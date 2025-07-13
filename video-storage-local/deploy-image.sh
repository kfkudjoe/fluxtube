#!/bin/bash

# Define the common network name
NETWORK_NAME="fluxtube-network"

# Ensure the network exists. If it already exits, just report so.
echo "Ensuring Docker network '$NETWORK_NAME' exits..."
docker network create $NETWORK_NAME || true

# Deploy the video-storage-local-fluxtube microservice; Connect to the 'fluxtube-network'
echo "Deploying 'video-storage-local-fluxtube' container..."
docker run -d \
  --name video-storage-local-fluxtube \
  --network $NETWORK_NAME \
  -p 3001:3000 \
  -e PORT=3000 \
  video-storage-local-fluxtube

echo "Video Storage microservice deployed."
echo "Access on host port 3001."
