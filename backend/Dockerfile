# ============================================================================
# BarberPro Backend Production Dockerfile
# Optimized Node.js + Fastify + Prisma for Argentina deployment
# ============================================================================

FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    curl \
    wget \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 barberpro && \
    adduser --system --uid 1001 --ingroup barberpro barberpro

# ============================================================================
# Dependencies Stage
# ============================================================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --no-audit --prefer-offline && \
    npm cache clean --force

# ============================================================================
# Builder Stage
# ============================================================================
FROM base AS builder
WORKDIR /app

# Install all dependencies for building
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================================================
# Production Stage
# ============================================================================
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies
COPY --from=deps --chown=barberpro:barberpro /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=barberpro:barberpro /app/dist ./dist
COPY --from=builder --chown=barberpro:barberpro /app/prisma ./prisma
COPY --chown=barberpro:barberpro package*.json ./

# Create startup script with proper database handling
COPY --chown=barberpro:barberpro <<EOF /app/start.sh
#!/bin/sh
set -e

echo "🚀 Starting BarberPro Backend Server..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "Database not ready yet, waiting..."
  sleep 2
done

# Run migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Start server
echo "🔧 Starting Fastify server on port 3000..."
exec node dist/server.js
EOF
RUN chmod +x /app/start.sh

# Health check script
COPY --chown=barberpro:barberpro <<EOF /usr/local/bin/health-check.sh
#!/bin/sh
curl -f http://localhost:3000/api/health || exit 1
EOF
RUN chmod +x /usr/local/bin/health-check.sh

USER barberpro

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]