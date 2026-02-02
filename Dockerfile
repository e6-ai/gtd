# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build stage for API
FROM node:20-alpine AS api-builder
WORKDIR /app/api
COPY api/package*.json ./
RUN npm install
COPY api/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies for API
COPY api/package*.json ./api/
RUN cd api && npm install --omit=dev

# Copy built API
COPY --from=api-builder /app/api/dist ./api/dist

# Copy built frontend to public
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/api/data

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/api/data/gtd.db

# Single port for both API and static files
EXPOSE 3001

CMD ["/app/start.sh"]
