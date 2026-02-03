#!/bin/bash

# Augment Skills - Development Startup Script
# This script starts all services for local development

set -e

echo "🚀 Starting Augment Skills Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start PostgreSQL and Redis
echo ""
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec augment-skills-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Wait for Redis to be ready
echo ""
echo "⏳ Waiting for Redis to be ready..."
until docker exec augment-skills-redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✅ Redis is ready${NC}"

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please review and update .env file with your settings${NC}"
fi

# Copy .env to backend if needed
if [ ! -f "backend/.env" ]; then
    cp .env backend/.env
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo "=========================================="
echo ""
echo "To start the servers, run these commands in separate terminals:"
echo ""
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Default login: admin / changeme123"
echo ""
echo "To stop databases: docker-compose down"
echo ""

