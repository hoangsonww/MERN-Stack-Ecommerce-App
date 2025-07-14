#!/usr/bin/env bash
set -euo pipefail

# 1) Make sure GitHub Personal Access Token (with read:packages/write:packages) is exported
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌ Please set GITHUB_TOKEN to a GitHub PAT with read:packages, write:packages scopes."
  exit 1
fi

# 2) Configure npm to hit GitHub Packages
cat > ~/.npmrc <<EOF
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
//npm.pkg.github.com/:always-auth=true
@hoangsonww:registry=https://npm.pkg.github.com
EOF

echo "🚀 Publishing @hoangsonww/ecommerce-fullstack-website-frontend to GitHub Packages..."
npm publish --access public

# 3) Friendly confirmation
NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
echo "✅ Published ${NAME}@${VERSION} to https://npm.pkg.github.com/hoangsonww"
