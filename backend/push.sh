#!/usr/bin/env bash
set -euo pipefail

GITHUB_USER="hoangsonww"
IMAGE_NAME="fusion-electronics-backend"
VERSION="1.1.0"
IMAGE_REF="ghcr.io/${GITHUB_USER}/${IMAGE_NAME}:${VERSION}"

# 1) make sure you’ve exported a token with pkg:write scope:
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "❌ Please export GITHUB_TOKEN with packages:write scope"
  exit 1
fi

# 2) login to GHCR
echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_USER}" --password-stdin

# 3) build
docker build -t "${IMAGE_REF}" .

# 4) push
docker push "${IMAGE_REF}"

echo "✅ Successfully pushed ${IMAGE_REF}"
