#!/bin/bash

# Define common network and container details
NETWORK_NAME="fluxtube-network"
CONTAINER_NAME="video-upload-fluxtube"
HOST_PORT=3003
CONTAINER_PORT=3000

# Environment variables for the microservice
# VIDEO_STORAGE_HOST ist he name of the video-storage microservice container on the internal shared network
VIDEO_STORAGE_HOST="video-storage-local-fluxtube"
# VIDEO_STORAGE_PORT is the port number of the video-storage microservice container on the internal shared network
VIDEO_STORAGE_PORT=3000
# RABBIT_HOST is the name of the RabbitMQ container on the internal shared network
RABBIT_HOST="video-rabbit-mq"
# RABBIT_PORT is the port number of the RabbitMQ container on the internal shared network
RABBIT_PORT=5672
# RABBIT is the complete address of the RabbitMQ container on the internal shared network
RABBIT="amqp://guest:guest@$RABBIT_HOST:$RABBIT_PORT"

# Ensure the docker network exists
echo "Ensuring docker network '$NETWORK_NAME' exists...."
docker network create $NETWORK_NAME &> /dev/null || true

# Stop and remove any existing container with the same name
echo "Stopping and removing existing '$CONTAINER_NAME' containers (if any)...."
docker stop $CONTAINER_NAME &> /dev/null
docker rm $CONTAINER_NAME &> /dev/null

# Deploy the video-history microservice
echo "Deploying '$CONTAINER_NAME' container...."
docker run -d \
	--name $CONTAINER_NAME \
	-p $HOST_PORT:$CONTAINER_PORT \
	--network $NETWORK_NAME \
	-e PORT=$CONTAINER_PORT \
	-e VIDEO_STORAGE_HOST=$VIDEO_STORAGE_HOST \
	-e VIDEO_STORAGE_PORT=$VIDEO_STORAGE_PORT \
	-e RABBIT="$RABBIT" \
	$CONTAINER_NAME

# Acknowledge successful deployment
echo "Video upload microservice has been successfully deployed."
echo "Access it on host port $HOST_PORT."