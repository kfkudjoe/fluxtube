#!/bin/bash

# Define common network and container details
NETWORK_NAME="fluxtube-network"
CONTAINER_NAME="video-history-fluxtube"
HOST_PORT=3002
CONTAINER_PORT=3000

# Environment variables for the microservice
# DBHOST is the name of the MongoDB container on the shared network
# RABBIT is the name of the RabbitMQ container on the shared network
DB_HOST="mongodb"
DB_NAME="history"
RABBIT_HOST="rabbitmq"

# Ensure the docker network exists
echo "Ensuring docker network '$NETWORK_NAME' exists..."
docker network create $NETWORK_NAME &> /dev/null || true

# Stop and remove any existing container with the same name
echo "Stopping and removing existing '$CONTAINER_NAME' container (if any)..."
docker stop $CONTAINER_NAME &> /dev/null
docker rm $CONTAINER_NAME &> /dev/null

# Deploy the video-history microservice
echo "Deploying '$CONTAINER_NAME' container..."
docker run -d \
	--name $CONTAINER_NAME \
	-p $HOST_PORT:$CONTAINER_PORT \
	--network $NETWORK_NAME \
	-e PORT=$CONTAINER_PORT \
	-e DBHOST="mongodb://$DB_HOST:27017" \
	-e DBNAME=$DB_NAME \
	-e RABBIT="amqp://guest:guest@$RABBIT_HOST:5672" \
	$CONTAINER_NAME

echo "Video history microservice has been deployed."
echo "Access it on host port $HOST_PORT."

# Note: Ensure 'mongodb' and 'rabbitmq' containers are running on '$NETWORK_NAME'
# Named as 'mongodb' and 'rabbitmq' respectively.
# To enable RabbitMQ management plugin:
# docker exec rabbitmq rabbitmq-plugins enable rabbitmq_management
