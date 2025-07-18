#!/bin/bash

# Define common network and container details for the API Gateway
NETWORK_NAME="fluxtube-network"
CONTAINER_NAME="video-gateway-fluxtube"
HOST_PORT=3004
CONTAINER_PORT=3000

# Environment variables for the API Gateway microservice
# These define the internal network names of the backend services it proxies to
METADATA_HOST="video-metadata-fluxtube"
HISTORY_HOST="video-history-fluxtube"
VIDEO_STREAMING_HOST="video-streaming-fluxtube"
VIDEO_UPLOAD_HOST="video-upload-fluxtube"

# Ensure the docker network exists
echo "Ensuring docker network '$NETWORK_NAME' exists....."
docker network create $NETWORK_NAME &> /dev/null || true

# Stop and remove any existing container with the same name
echo "Stopping and removing existing '$CONTAINER_NAME' container (if any)...."
docker stop $CONTAINER_NAME &> /dev/null
docker rm $CONTAINER_NAME &> /dev/null

# Deploy the API Gateway microservice
echo "Deploying '$CONTAINER_NAME' container..."
docker run -d
	--name $CONTAINER_NAME \
	-p $HOST_PORT:$CONTAINER_PORT \
	--network $NETWORK_NAME \
	-e PORT=$CONTAINER_PORT \
	-e METADATA_HOST=$METADATA_HOST \
	-e HISTORY_HOST=$HISTORY_HOST \
	-e VIDEO_STREAMING_HOST=$VIDEO_STREAMING_HOST \
	-e VIDEO_UPLOAD_HOST=$VIDEO_UPLOAD_HOST \
	$CONTAINER_NAME

# Acknowledge successful deployment
echo "API Gateway microservice has been successfully deployed."
echo "Access it on host port $HOST_PORT."

# Note: Ensure all backend micrservices (video-db-monogodb, video-rabbit-mq,
# video-metadata-fluxtube, video-history-fluxtube, video-streaming-fluxtube, video-upload-fluxtube)
# are running on $NETWORK_NAME and named consistently.