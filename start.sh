#!/bin/sh
# Start API server in background
cd /app/api && node dist/index.js &

# Start frontend static server
serve -s /app/public -l 3000
