require('dotenv').config();

const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { upsertVectors, purgeNamespace, getNamespaceVectorCount } = require('../pineconeClient');

const {
  MONGO_URI,
  GOOGLE_AI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_HOST,
  PINECONE_INDEX,
  PINECONE_BATCH_SIZE = 25,
  PINECONE_PURGE_ON_SYNC,
} = process.env;

const chunk = (list, size) => {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

module.exports = async function syncPinecone() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI must be set to sync Pinecone');
  }

  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY must be set to build embeddings for Pinecone');
  }

  if (!PINECONE_API_KEY || !PINECONE_HOST) {
    throw new Error('PINECONE_API_KEY and PINECONE_HOST must be set for Pinecone sync');
  }

  if (!PINECONE_INDEX) {
    console.warn('⚠️  PINECONE_INDEX is not set, defaulting to index encoded in host');
  }

  const shouldDisconnect = mongoose.connection.readyState === 0;
  if (shouldDisconnect) {
    await mongoose.connect(MONGO_URI);
  }

  let Product;
  if (mongoose.models.Product) {
    Product = mongoose.model('Product');
  } else {
    Product = require('../models/product');
  }

  const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
  const embedModel = genAI.getGenerativeModel({ model: 'models/text-embedding-004' });

  const products = await Product.find().lean();
  if (!products.length) {
    if (shouldDisconnect) await mongoose.disconnect();
    return;
  }

  const namespace = process.env.PINECONE_NAMESPACE || '';
  const existingVectorCount = await getNamespaceVectorCount(namespace);

  if (existingVectorCount && existingVectorCount === products.length) {
    console.log(`ℹ️  Pinecone namespace already contains ${existingVectorCount} vectors. Skipping purge and upsert.`);
    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
    return;
  }

  console.log(`🚀 Syncing ${products.length} products to Pinecone...`);

  const shouldPurge = PINECONE_PURGE_ON_SYNC !== 'false';
  if (shouldPurge) {
    try {
      await purgeNamespace(namespace);
      console.log('🧹 Cleared existing Pinecone vectors for namespace');
    } catch (err) {
      console.error('⚠️  Failed to purge Pinecone namespace:', err);
    }
  }

  const batches = chunk(products, Number(PINECONE_BATCH_SIZE));
  let processed = 0;

  for (const batch of batches) {
    const vectors = [];
    const syncedIds = [];
    for (const doc of batch) {
      const text = `${doc.name || ''}. ${doc.description || ''}`.trim();
      if (!text) continue;
      try {
        const embedding = (await embedModel.embedContent(text)).embedding.values;
        vectors.push({
          id: doc._id.toString(),
          values: embedding,
          metadata: {
            mongoId: doc._id.toString(),
            name: doc.name,
            category: doc.category,
            brand: doc.brand,
            price: doc.price,
            image: doc.image,
            createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
          },
        });
        syncedIds.push(doc._id);
      } catch (err) {
        console.warn(`⚠️  Embedding failed for ${doc._id}:`, err.message || err);
      }
    }

    if (!vectors.length) continue;

    await upsertVectors(vectors, namespace);

    if (syncedIds.length) {
      await Product.bulkWrite(
        syncedIds.map(id => ({
          updateOne: {
            filter: { _id: id },
            update: { $set: { pineconeId: id.toString() } },
            upsert: false,
          },
        }))
      );
    }

    processed += syncedIds.length;
    console.log(`✅ Pinecone sync: ${processed}/${products.length}`);
  }

  console.log('🎯 Pinecone sync finished');

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }
};
