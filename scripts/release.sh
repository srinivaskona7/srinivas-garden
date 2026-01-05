#!/bin/bash
set -e

# Default version from package.json if not provided
DEFAULT_VERSION="v$(node -p "require('./package.json').version")"
VERSION=${1:-$DEFAULT_VERSION}
IMAGE_NAME="sriniv7654/garden"

echo "🚀 Starting Release Process for Version: $VERSION"

# 1. Build Docker Image (Force AMD64 for K8s compatibility)
echo "📦 Building Docker Image (linux/amd64): $IMAGE_NAME:$VERSION..."
docker build --platform linux/amd64 -t $IMAGE_NAME:$VERSION .

# 2. Push Docker Image
echo "fw Pushing Docker Image..."
docker push $IMAGE_NAME:$VERSION

# 3. Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes namespace 'garden'..."
helm upgrade --install beautiful-garden ./helm/beautiful-garden \
  --namespace garden \
  --create-namespace \
  --set image.tag=$VERSION \
  --kubeconfig kubeconfig-trail.yaml

echo "✅ Release $VERSION Deployed Successfully!"
echo "   - Image: $IMAGE_NAME:$VERSION"
echo "   - URL: https://garden.srinivaskona.life"
