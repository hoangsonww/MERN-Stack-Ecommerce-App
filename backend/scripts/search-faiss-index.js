#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { IndexFlatL2 } = require('faiss-node');

const { GOOGLE_AI_API_KEY } = process.env;
if (!GOOGLE_AI_API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY required');
  process.exit(1);
}

async function main() {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.error('Usage: node search-faiss-index.js "<search text>" [k]');
    process.exit(1);
  }
  const k = parseInt(process.argv[3], 10) || 5;

  // 1) Load metadata and index
  const storeDir = path.resolve(__dirname, '../faiss_stores');
  const metaPath = path.join(storeDir, 'products_meta.json');
  const idxPath  = path.join(storeDir, 'products.index');

  if (!fs.existsSync(metaPath) || !fs.existsSync(idxPath)) {
    console.error('❌ FAISS index or metadata not found. Run build-faiss-index first.');
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const index    = IndexFlatL2.read(idxPath);

  // 2) Embed the query text
  const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/text-embedding-004' });
  const embedding = (await model.embedContent(query)).embedding.values;

  // 3) Perform the search
  //    FAISS-Node expects a plain array for both the query and returns { labels, distances }
  const results = index.search(embedding, k);
  const { labels, distances } = results;

  console.log(`🔍 Top ${k} results for "${query}":\n`);
  labels.forEach((label, i) => {
    if (label === -1 || label >= metadata.length) return;
    const id   = metadata[label].id;
    const dist = distances[i].toFixed(4);
    console.log(`${i + 1}. id=${id}    distance=${dist}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
