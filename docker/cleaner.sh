#!/bin/bash

docker build --label keep=true -t cleaner ./cleaner
docker run -it --rm -v "$(pwd):/mnt" cleaner
