require('dotenv').config();

const weaviateModule = require('weaviate-client');
const weaviate = weaviateModule.default || weaviateModule;
const { ApiKey } = weaviateModule;

const { WEAVIATE_HOST, WEAVIATE_API_KEY, GOOGLE_AI_API_KEY } = process.env;

if (!WEAVIATE_HOST) throw new Error('Missing WEAVIATE_HOST in .env');
if (!WEAVIATE_API_KEY) throw new Error('Missing WEAVIATE_API_KEY in .env');

let clientPromise;

function getWeaviateClient() {
  if (!clientPromise) {
    clientPromise = weaviate
      .connectToWeaviateCloud(WEAVIATE_HOST, {
        authCredentials: new weaviate.ApiKey(WEAVIATE_API_KEY),
        headers: {
          'X-OpenAI-Api-Key': GOOGLE_AI_API_KEY || '',
        },
      })
      .then(client => {
        console.log('✅ Connected to Weaviate Cloud');
        return client;
      });
  }
  return clientPromise;
}

module.exports = { getWeaviateClient };
