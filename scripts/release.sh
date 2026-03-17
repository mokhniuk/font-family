#!/usr/bin/env bash
set -euo pipefail

IMAGE="mokhniuk/font-family"
VERSION=$(node -p "require('./package.json').version")
MAJOR_MINOR="${VERSION%.*}"

echo "Building $IMAGE:$VERSION (multi-arch)..."

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag "$IMAGE:$VERSION" \
  --tag "$IMAGE:$MAJOR_MINOR" \
  --tag "$IMAGE:latest" \
  --push \
  .

echo ""
echo "Published:"
echo "  $IMAGE:$VERSION"
echo "  $IMAGE:$MAJOR_MINOR"
echo "  $IMAGE:latest"
