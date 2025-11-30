#!/bin/bash

# Intervue Poll Deployment Script
echo "🚀 Deploying Intervue Poll Application..."

# Build and run with Docker
echo "📦 Building Docker image..."
docker build -t intervue-poll .

echo "🔄 Starting containers..."
docker-compose up -d

echo "✅ Deployment complete!"
echo "🌐 Application is running at: http://localhost:3001"
echo "📊 Check logs with: docker-compose logs -f"
