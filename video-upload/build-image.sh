#!/bin/bash

# Define the image name
IMAGE_NAME="video-upload-fluxtube"

# Build the image
echo "Building the docker image $'$IMAGE_NAME'... "
docker build -t $IMAGE_NAME --file dockerfile-prod .
echo "Image $IMAGE_NAME built successfully."