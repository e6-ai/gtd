#!/bin/sh
# Start API server in background
cd /app/api && tsx src/index.ts &

# Start frontend static server
serve -s /app/public -l 3000
