#!/bin/bash


set -e
docker build -t nexusbot .
docker tag nexusbot hub.nexusnull.com/nexusbot:latest
docker push hub.nexusnull.com/nexusbot:latest
