#!/bin/bash

NETWORK_NAME="fluxtube-network"
CONTAINER_NAME="video-streaming-fluxtube"
HOST_PORT=3000
CONTAINER_PORT=3000

echo "Ensuring Docker network '$NETWORK_NAME' exists..."
docker network create $NETWORK_NAME &> /dev/null || true

echo "Stopping and removing existing $CONTAINER_NAME' containers (if any)..."
docker stop $CONTAINER_NAME &> /dev/null
docker rm $CONTAINER_NAME &> /dev/null

echo "Deploying '$CONTAINER_NAME' container..."
docker run -d \
  --name $CONTAINER_NAME \
  --network $NETWORK_NAME \
  -p $HOST_PORT:$CONTAINER_PORT \
  -e PORT=$CONTAINER_PORT \
  -e RABBIT=amqp://test:test@video-rabbit-mq:5672 \
  video-streaming-fluxtube

echo "Video Streaming microservice deployed on port $HOST_PORT."
echo "Ensure 'video-rabbit-mq' and 'video-storage-local-fluxtube' containers are also on '$NETWORK_NAME'."
