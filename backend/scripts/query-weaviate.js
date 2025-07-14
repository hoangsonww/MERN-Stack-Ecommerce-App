#!/usr/bin/env node

require('dotenv').config();
const weaviateModule = require('weaviate-ts-client');
const weaviate = weaviateModule.default || weaviateModule;
const { ApiKey } = weaviateModule;

const { WEAVIATE_HOST, WEAVIATE_API_KEY, GOOGLE_AI_API_KEY } = process.env;
if (!WEAVIATE_HOST || !WEAVIATE_API_KEY) {
  console.error('❌ You must set WEAVIATE_HOST & WEAVIATE_API_KEY in .env');
  process.exit(1);
}

const client = weaviate.client({
  scheme: 'https',
  host: WEAVIATE_HOST,
  apiKey: new ApiKey(WEAVIATE_API_KEY),
  headers: {
    // only needed for nearText
    'X-OpenAI-Api-Key': GOOGLE_AI_API_KEY || ''
  }
});

function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

(async () => {
  const raw = process.argv[2];
  if (!raw) {
    console.error('Usage: npm run weaviate-query -- <uuid|search text>');
    process.exit(1);
  }

  try {
    let items;

    if (isUUID(raw)) {
      console.log(`⏳ Finding items similar to ID="${raw}"...`);

      const vecRes = await client.graphql
        .get()
        .withClassName('Product')
        .withFields('_additional { vector }')
        .withWhere({
          path: ['id'],
          operator: 'Equal',
          valueString: raw
        })
        .do();

      const productsArr = vecRes.data.Get.Product;
      if (!productsArr.length || !productsArr[0]._additional.vector) {
        console.error(
          `❌ Object "${raw}" has no stored vector. ` +
          `Make sure your Product class has vectorization enabled and that this object was indexed with a vector.`
        );
        process.exit(1);
      }

      const vector = productsArr[0]._additional.vector;

      const res = await client.graphql
        .get()
        .withClassName('Product')
        .withFields(`
          name
          description
          price
          category
          _additional { distance }
        `)
        .withNearVector({ vector })
        .withLimit(5)
        .do();

      items = res.data.Get.Product;
    } else {
      console.log(`⏳ Searching for "${raw}"...`);

      const res = await client.graphql
        .get()
        .withClassName('Product')
        .withFields(`
          name
          description
          price
          category
          _additional { distance }
        `)
        .withNearText({ concepts: [raw] })
        .withLimit(5)
        .do();

      items = res.data.Get.Product;
    }

    console.log(JSON.stringify(items, null, 2));
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
