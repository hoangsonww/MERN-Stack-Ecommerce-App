#!/usr/bin/env bash
set -euo pipefail

# 1) Configuration
GH_USER="hoangsonww"
IMAGE="ghcr.io/${GH_USER}/ecommerce-fullstack-website-frontend"
VERSION=$(node -p "require('./package.json').version")

# 2) Ensure we have a PAT with write:packages scope in GITHUB_TOKEN
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌ Please set GITHUB_TOKEN (GitHub PAT with write:packages scope)."
  exit 1
fi

# 3) Login to GHCR
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "${GH_USER}" --password-stdin

# 4) Build & tag
docker build -t "${IMAGE}:${VERSION}" -t "${IMAGE}:latest" .

# 5) Push
docker push "${IMAGE}:${VERSION}"
docker push "${IMAGE}:latest"

echo "✅ Pushed Docker image to GitHub Container Registry:"
echo "   • ${IMAGE}:${VERSION}"
echo "   • ${IMAGE}:latest"
