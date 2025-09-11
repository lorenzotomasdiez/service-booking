# ============================================================================
# BarberPro Frontend Production Dockerfile
# Optimized SvelteKit build for Argentina deployment
# ============================================================================

FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && apk add --no-cache \
    libc6-compat \
    ca-certificates \
    && rm -rf /var/cache/apk/*

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

# Build SvelteKit application
RUN npm run build

# ============================================================================
# Production Stage with Nginx
# ============================================================================
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:80/health || exit 1' > /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh

# Create nginx config if not copied
RUN if [ ! -f /etc/nginx/conf.d/default.conf ]; then \
    cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression for Argentina
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # SvelteKit app
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF
fi

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/health-check.sh

CMD ["nginx", "-g", "daemon off;"]