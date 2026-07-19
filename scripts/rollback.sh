#!/bin/bash
set -e

echo "=== Babnunur Rollback ==="
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
echo "=== Rollback Complete ==="
