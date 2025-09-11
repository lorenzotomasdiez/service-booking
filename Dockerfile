# ============================================================================
# BarberPro Multi-Stage Production Dockerfile
# Optimized for Argentina deployment with fast builds and security
# ============================================================================

FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 barberpro && \
    adduser --system --uid 1001 --ingroup barberpro barberpro

# ============================================================================
# Dependencies Stage - Install production dependencies
# ============================================================================
FROM base AS deps
WORKDIR /app

# Copy root package files first
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies with cache optimization
RUN npm ci --only=production --no-audit --prefer-offline && \
    cd backend && npm ci --only=production --no-audit --prefer-offline && \
    cd ../frontend && npm ci --only=production --no-audit --prefer-offline && \
    npm cache clean --force

# ============================================================================
# Builder Stage - Build applications
# ============================================================================
FROM base AS builder
WORKDIR /app

# Install all dependencies (including dev) for building
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci --no-audit --prefer-offline && \
    cd backend && npm ci --no-audit --prefer-offline && \
    cd ../frontend && npm ci --no-audit --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build backend
RUN cd backend && npm run build

# Build frontend  
RUN cd frontend && npm run build

# ============================================================================
# Backend Production Stage
# ============================================================================
FROM base AS backend-production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies and built backend
COPY --from=deps --chown=barberpro:barberpro /app/node_modules ./node_modules
COPY --from=deps --chown=barberpro:barberpro /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=barberpro:barberpro /app/backend/dist ./backend/dist
COPY --from=builder --chown=barberpro:barberpro /app/backend/package*.json ./backend/
COPY --from=builder --chown=barberpro:barberpro /app/backend/prisma ./backend/prisma

# Copy scripts and configs needed at runtime
COPY --from=builder --chown=barberpro:barberpro /app/scripts ./scripts
COPY --chown=barberpro:barberpro package*.json ./

# Health check script
COPY --chown=barberpro:barberpro <<EOF /usr/local/bin/health-check.sh
#!/bin/sh
wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
EOF
RUN chmod +x /usr/local/bin/health-check.sh

USER barberpro

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/dist/server.js"]

# ============================================================================
# Frontend Production Stage (for standalone frontend deployment)
# ============================================================================
FROM nginx:alpine AS frontend-production
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy built frontend
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration optimized for Argentina
COPY --from=builder /app/docker/configs/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Health check for frontend
RUN echo '#!/bin/sh\nwget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1' > /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/health-check.sh

CMD ["nginx", "-g", "daemon off;"]

# ============================================================================
# Full Stack Production Stage (default)
# ============================================================================
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies and built applications
COPY --from=deps --chown=barberpro:barberpro /app/node_modules ./node_modules
COPY --from=deps --chown=barberpro:barberpro /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=barberpro:barberpro /app/backend/dist ./backend/dist
COPY --from=builder --chown=barberpro:barberpro /app/backend/package*.json ./backend/
COPY --from=builder --chown=barberpro:barberpro /app/backend/prisma ./backend/prisma
COPY --from=builder --chown=barberpro:barberpro /app/frontend/build ./frontend/build

# Copy runtime files
COPY --from=builder --chown=barberpro:barberpro /app/scripts ./scripts
COPY --chown=barberpro:barberpro package*.json ./

# Create startup script
COPY --chown=barberpro:barberpro <<EOF /app/start.sh
#!/bin/sh
set -e

echo "🚀 Starting BarberPro Production Server..."

# Run database migrations
echo "📊 Running database migrations..."
cd backend && npx prisma migrate deploy

# Start the backend server
echo "🔧 Starting backend server on port 3000..."
exec node dist/server.js
EOF
RUN chmod +x /app/start.sh

# Health check script
COPY --chown=barberpro:barberpro <<EOF /usr/local/bin/health-check.sh
#!/bin/sh
wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
EOF
RUN chmod +x /usr/local/bin/health-check.sh

USER barberpro

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Use tini for proper signal handling  
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]