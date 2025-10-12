FROM node:20-alpine

LABEL maintainer="BarberPro Team"
LABEL description="AFIP Mock Server for local development and testing"
LABEL version="1.0.0"

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    wget \
    && rm -rf /var/cache/apk/*

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
