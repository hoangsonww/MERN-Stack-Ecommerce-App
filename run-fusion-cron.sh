#!/usr/bin/env bash

# change to the directory where the script is located
cd /Users/davidnguyen/WebstormProjects/ecommerce-fullstack-website/backend

# Load any environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Run seed and then sync-weaviate
npm run seed
npm run sync-weaviate
