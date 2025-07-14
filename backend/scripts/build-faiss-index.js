#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { IndexFlatL2 } = require('faiss-node');

const { MONGO_URI, GOOGLE_AI_API_KEY } = process.env;
if (!MONGO_URI || !GOOGLE_AI_API_KEY) {
  console.error('❌ MONGO_URI & GOOGLE_AI_API_KEY required');
  process.exit(1);
}

async function main() {
  // 1) Connect to MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // 2) Define Product model (collection = "products")
  const Product = mongoose.model('Product',
    new mongoose.Schema({ name: String, description: String }),
    'products'
  );

  // 3) Embed model
  const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
  const embedModel = genAI.getGenerativeModel({ model: 'models/text-embedding-004' });

  // 4) Load all products
  const products = await Product.find().lean();
  console.log(`🔎 Loaded ${products.length} products`);
  if (!products.length) return process.exit(0);

  // 5) Determine embedding dim
  const sample = (await embedModel.embedContent(
    `${products[0].name}: ${products[0].description}`
  )).embedding.values;
  const dim = sample.length;
  console.log(`ℹ️ Embedding dim = ${dim}`);

  // 6) Create FAISS index
  const index = new IndexFlatL2(dim);
  const metadata = [];

  // 7) Loop and add one vector at a time
  for (const doc of products) {
    const text = `${doc.name}: ${doc.description}`;
    let embedding;
    try {
      embedding = (await embedModel.embedContent(text)).embedding.values;
    } catch (e) {
      console.warn(`⚠️ Embedding failed for ${doc._id}`, e);
      continue;
    }
    // add expects a plain array of length `dim`
    index.add(embedding);
    metadata.push({ id: doc._id.toString() });
  }
  console.log(`✅ Indexed ${index.ntotal()} vectors`);

  // 8) Persist index & metadata
  const storeDir = path.resolve(__dirname, '../faiss_stores');
  fs.mkdirSync(storeDir, { recursive: true });
  const idxPath  = path.join(storeDir, 'products.index');
  const metaPath = path.join(storeDir, 'products_meta.json');

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  index.write(idxPath);

  console.log(`🎉 FAISS index saved to ${idxPath}`);
  console.log(`🗂️ Metadata saved to ${metaPath}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
