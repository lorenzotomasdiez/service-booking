#!/bin/bash
# Fix Docker dependencies issue by ensuring clean node_modules in containers
# This script resolves the recurring esbuild version mismatch error

set -e

echo "🔧 Fixing Docker dependencies..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/5]${NC} Stopping containers..."
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down

echo -e "${YELLOW}[2/5]${NC} Removing old node_modules volumes..."
docker volume rm barberpro-backend-node-modules-dev 2>/dev/null || true
docker volume rm barberpro-frontend-node-modules-dev 2>/dev/null || true

echo -e "${YELLOW}[3/5]${NC} Generating package-lock.json files..."
# Generate lock files in container to ensure platform compatibility
if [ ! -f backend/package-lock.json ]; then
    echo "  → Generating backend/package-lock.json..."
    (cd backend && npm install --package-lock-only)
fi

if [ ! -f frontend/package-lock.json ]; then
    echo "  → Generating frontend/package-lock.json..."
    (cd frontend && npm install --package-lock-only)
fi

echo -e "${YELLOW}[4/5]${NC} Rebuilding containers with fresh dependencies..."
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build --no-cache backend frontend

echo -e "${YELLOW}[5/5]${NC} Starting services..."
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

echo ""
echo -e "${GREEN}✅ Docker dependencies fixed!${NC}"
echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check backend health
if docker logs barberpro-backend-dev 2>&1 | tail -20 | grep -q "Server running"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}⚠️  Backend may have issues. Check logs: docker logs barberpro-backend-dev${NC}"
fi

# Check frontend health
if docker logs barberpro-frontend-dev 2>&1 | tail -20 | grep -q "ready in"; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}⚠️  Frontend may have issues. Check logs: docker logs barberpro-frontend-dev${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Access your services at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  API Docs: http://localhost:3000/docs"
