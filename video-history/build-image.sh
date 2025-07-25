#!/bin/bash

# Define the image name
IMAGE_NAME="video-history-fluxtube"

echo "Building docker image '$IMAGE_NAME' ..."
docker build -t $IMAGE_NAME --file dockerfile-prod .

echo "Image $IMAGE_NAME built successfully."