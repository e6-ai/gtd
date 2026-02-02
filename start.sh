#!/bin/sh
set -e

echo "Starting GTD app..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"
echo "API files:"
ls -la /app/api/dist/ || echo "No dist folder!"

# Start API server in background with logging
cd /app/api
echo "Starting API server..."
node dist/index.js 2>&1 &
API_PID=$!

# Give API time to start
sleep 2

# Check if API is still running
if ! kill -0 $API_PID 2>/dev/null; then
    echo "API server failed to start!"
    exit 1
fi

echo "API server started (PID: $API_PID)"

# Start frontend static server (foreground)
echo "Starting frontend server..."
serve -s /app/public -l 3000
