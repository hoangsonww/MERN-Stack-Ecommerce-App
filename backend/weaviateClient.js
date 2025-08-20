'use strict';

require('dotenv').config();

const weaviateModule = require('weaviate-client');
const weaviate = weaviateModule.default || weaviateModule;

const RAW_HOST = process.env.WEAVIATE_HOST;
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY; // keep as-is if you really need it

if (!RAW_HOST) {
  console.error('Missing WEAVIATE_HOST in .env');
  process.exit(1);
}
if (!WEAVIATE_API_KEY) {
  console.error('Missing WEAVIATE_API_KEY in .env');
  process.exit(1);
}

// minimal host cleanup (no protocol, no trailing slash)
const WEAVIATE_HOST = RAW_HOST.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

let clientPromise;

async function printRaw(url, init) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    console.error(`\n--- Weaviate response: ${url}`);
    console.error(`HTTP ${res.status}`);
    // print a few headers that matter
    ['content-type', 'server', 'date', 'x-request-id'].forEach(h => {
      const v = res.headers.get(h);
      if (v) console.error(`${h}: ${v}`);
    });
    console.error('--- body start');
    console.error(text || '(empty body)');
    console.error('--- body end\n');
  } catch (e) {
    console.error(`\n--- fetch error while requesting ${url}`);
    console.error(String((e && e.message) || e));
    console.error('---\n');
  }
}

function getWeaviateClient() {
  if (!clientPromise) {
    clientPromise = weaviate
      .connectToWeaviateCloud(WEAVIATE_HOST, {
        authCredentials: new weaviate.ApiKey(WEAVIATE_API_KEY),
        headers: GOOGLE_AI_API_KEY ? { 'X-OpenAI-Api-Key': GOOGLE_AI_API_KEY } : {},
      })
      .then(client => {
        console.log(`✅ Connected to Weaviate Cloud @ ${WEAVIATE_HOST}`);
        return client;
      })
      .catch(async err => {
        // print ONLY what Weaviate actually returns (no guesses)
        const base = `https://${WEAVIATE_HOST}`;
        // whatever connectToWeaviateCloud hit, these are the canonical endpoints
        await printRaw(`${base}/v1/.well-known/ready`, {
          headers: { Authorization: `Bearer ${WEAVIATE_API_KEY}` },
        });
        await printRaw(`${base}/v1/graphql`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${WEAVIATE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: '{ Get { __typename } }' }),
        });

        // also dump the original error message without stack
        console.error('\n--- weaviate-client error message');
        console.error(String((err && err.message) || err));
        console.error('---\n');

        process.exit(1);
      });
  }
  return clientPromise;
}

module.exports = { getWeaviateClient };
