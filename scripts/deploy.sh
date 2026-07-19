#!/bin/bash
set -e

echo "=== Babnunur Deployment ==="
echo "Building Docker images..."
docker-compose -f docker-compose.production.yml build

echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo "Waiting for health checks..."
sleep 10

if curl -sf http://localhost:5000/health > /dev/null; then
  echo "✓ Backend healthy"
else
  echo "✗ Backend unhealthy"
  exit 1
fi

if curl -sf http://localhost:3000 > /dev/null; then
  echo "✓ Frontend healthy"
else
  echo "✗ Frontend unhealthy"
  exit 1
fi

echo "=== Deployment Complete ==="
