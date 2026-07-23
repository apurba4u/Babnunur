#!/bin/bash
set -e

echo "=== Babnunur Release ==="
VERSION=${1:-3.1.0}

echo "Building..."
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

echo "Testing..."
cd backend && npm test && cd ..

echo "Creating release v$VERSION..."
git tag -a v$VERSION -m "Release v$VERSION"
git push origin v$VERSION

echo "=== Release v$VERSION Complete ==="
