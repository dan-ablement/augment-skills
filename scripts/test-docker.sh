#!/bin/bash
set -e

echo "🧹 Cleaning up any existing test containers..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

echo "🔨 Building Docker images..."
docker-compose -f docker-compose.test.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Wait for app to be healthy
echo "Checking app health..."
for i in {1..30}; do
  if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ App is healthy"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ App failed to start"
    docker-compose -f docker-compose.test.yml logs app
    docker-compose -f docker-compose.test.yml down -v
    exit 1
  fi
  echo "Waiting for app... ($i/30)"
  sleep 2
done

echo ""
echo "✅ All services are running!"
echo ""
echo "📍 Access points:"
echo "   App (API + Frontend): http://localhost:3002"
echo "   Database: localhost:5433"
echo "   Redis:    localhost:6380"
echo ""
echo "🔑 Test credentials: admin / testadmin123"
echo ""
echo "To stop: docker-compose -f docker-compose.test.yml down -v"

