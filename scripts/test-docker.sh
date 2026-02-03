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

# Wait for backend to be healthy
echo "Checking backend health..."
for i in {1..30}; do
  if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend failed to start"
    docker-compose -f docker-compose.test.yml logs backend
    docker-compose -f docker-compose.test.yml down -v
    exit 1
  fi
  echo "Waiting for backend... ($i/30)"
  sleep 2
done

# Wait for frontend to be healthy
echo "Checking frontend health..."
for i in {1..30}; do
  if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Frontend failed to start"
    docker-compose -f docker-compose.test.yml logs frontend
    docker-compose -f docker-compose.test.yml down -v
    exit 1
  fi
  echo "Waiting for frontend... ($i/30)"
  sleep 2
done

echo ""
echo "✅ All services are running!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:3003"
echo "   Backend:  http://localhost:3002"
echo "   Database: localhost:5433"
echo "   Redis:    localhost:6380"
echo ""
echo "🔑 Test credentials: admin / testadmin123"
echo ""
echo "To stop: docker-compose -f docker-compose.test.yml down -v"

