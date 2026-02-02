#!/bin/sh
set -e

echo "Starting GTD app..."

# Start API server in background on port 3001 explicitly
cd /app/api
PORT=3001 node dist/index.js &
API_PID=$!

# Give API time to start
sleep 2

# Check if API is still running
if ! kill -0 $API_PID 2>/dev/null; then
    echo "API server failed to start!"
    exit 1
fi

echo "API server started (PID: $API_PID)"

# Start frontend static server on port 3000
exec serve -s /app/public -l 3000
