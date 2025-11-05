#!/bin/bash
# Docker環境のクリーンアップとリスタートスクリプト

echo "🧹 Cleaning up Docker containers and volumes..."
docker compose down -v

echo "🔨 Rebuilding backend image without cache..."
docker compose build --no-cache backend

echo "🚀 Starting services..."
docker compose up -d

echo "✅ Cleanup and restart complete!"
echo "📊 Check logs with: docker-compose logs -f backend"
