#!/usr/bin/env bash
set -euo pipefail

echo "🛠️  Testing FAISS index build (faiss-upsert)..."
npm run faiss-upsert
echo "✅ FAISS index build succeeded!"

echo "🛠️  Testing FAISS index search (faiss-search)..."
npm run faiss-search -- "your search text" 5
echo "✅ FAISS index search succeeded!"
