#!/bin/sh
set -e

echo "Starting GTD app..."
echo "Public files:"
ls -la /app/public/ | head -5

# Run the API which also serves static files
cd /app/api
exec node dist/index.js
