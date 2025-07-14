#!/usr/bin/env bash
set -euo pipefail

# ensure GITHUB_TOKEN is set
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌ Please export GITHUB_TOKEN (GitHub PAT with write:packages)."
  exit 1
fi

echo "🚀 Publishing to GitHub Packages..."
npm publish

# grab name & version for a friendly echo
NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
echo "✅ Published ${NAME}@${VERSION} to GitHub Packages"
