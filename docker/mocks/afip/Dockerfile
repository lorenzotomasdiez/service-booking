FROM node:20-slim

LABEL maintainer="BarberPro Team"
LABEL description="AFIP Mock Server for local development and testing"
LABEL version="1.0.0"

WORKDIR /app

# Install system dependencies (SQLite and wget for health checks)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    sqlite3 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data && \
    chmod 755 /app/data && \
    chown -R node:node /app

# Expose application port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Run as non-root user
USER node

# Start the application
CMD ["node", "index.js"]
