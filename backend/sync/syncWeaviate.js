require('dotenv').config();
const mongoose = require('mongoose');
const weaviateModule = require('weaviate-ts-client');
const weaviate = weaviateModule.default || weaviateModule;
const { ApiKey } = weaviateModule;

const { MONGO_URI, WEAVIATE_HOST, WEAVIATE_API_KEY } = process.env;
if (!MONGO_URI || !WEAVIATE_HOST || !WEAVIATE_API_KEY) {
  throw new Error('You must set MONGO_URI, WEAVIATE_HOST & WEAVIATE_API_KEY in .env');
}

module.exports = async function syncWeaviate() {
  // 0. Grab the Product model only if it's not already defined
  let Product;
  if (mongoose.models.Product) {
    Product = mongoose.model('Product');
  } else {
    const ProductModule = require('../models/Product.js');
    Product = ProductModule.default || ProductModule;
  }

  // 1. (Re)connect to MongoDB
  await mongoose.connect(MONGO_URI);

  // 2. Build Weaviate client
  const client = weaviate.client({
    scheme: 'https',
    host:   WEAVIATE_HOST,
    apiKey: new ApiKey(WEAVIATE_API_KEY),
  });

  // 3. Find all products missing weaviateId
  const toSync = await Product.find({ weaviateId: { $exists: false } }).lean();
  console.log(`🔍 Found ${toSync.length} products to sync...`);

  // 4. Sync loop
  for (const doc of toSync) {
    try {
      const resp = await client.graphql
        .get()
        .withClassName('Product')
        .withFields('_additional { id }')
        .withWhere({
          path: ['name'],
          operator: 'Equal',
          valueString: doc.name,
        })
        .withLimit(1)
        .do();

      const hits = resp.data.Get.Product;
      if (!hits.length) {
        console.warn(`⚠️  No Weaviate object found for name="${doc.name}"`);
        continue;
      }

      const wid = hits[0]._additional.id;
      await Product.updateOne(
        { _id: doc._id },
        { $set: { weaviateId: wid } }
      );

      console.log(`✅ Synced "${doc.name}" → ${wid}`);
    } catch (err) {
      console.error(`❌ Error syncing "${doc.name}":`, err.message || err);
    }
  }

  console.log('🎉 Weaviate sync complete.');

  // 5. Disconnect this connection
  await mongoose.disconnect();
};
