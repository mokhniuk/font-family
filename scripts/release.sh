#!/usr/bin/env bash
set -euo pipefail

IMAGE="mokhniuk/font-family"
VERSION=$(node -p "require('./package.json').version")
MAJOR_MINOR="${VERSION%.*}"

echo "Building $IMAGE:$VERSION..."

docker build \
  --tag "$IMAGE:$VERSION" \
  --tag "$IMAGE:$MAJOR_MINOR" \
  --tag "$IMAGE:latest" \
  .

docker push "$IMAGE:$VERSION"
docker push "$IMAGE:$MAJOR_MINOR"
docker push "$IMAGE:latest"

echo ""
echo "Published:"
echo "  $IMAGE:$VERSION"
echo "  $IMAGE:$MAJOR_MINOR"
echo "  $IMAGE:latest"
