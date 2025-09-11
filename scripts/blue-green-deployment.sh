#!/bin/bash

# ============================================================================
# BarberPro Blue-Green Deployment Script
# Zero-downtime deployment strategy for production launches
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_CONFIG_DIR="$PROJECT_ROOT/deployment"
LOG_FILE="/var/log/barberpro-deployment.log"
DEPLOYMENT_ID=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Environment configurations
BLUE_PORT=3000
GREEN_PORT=3001
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
HEALTH_CHECK_TIMEOUT=300
MAX_HEALTH_CHECK_RETRIES=10

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Create deployment configuration
setup_deployment_config() {
    log "INFO" "Setting up blue-green deployment configuration..."
    
    mkdir -p "$DEPLOYMENT_CONFIG_DIR"
    mkdir -p "$DEPLOYMENT_CONFIG_DIR/nginx"
    mkdir -p "$DEPLOYMENT_CONFIG_DIR/healthchecks"
    mkdir -p "$DEPLOYMENT_CONFIG_DIR/rollback"
    
    # Blue environment Docker Compose
    cat > "$DEPLOYMENT_CONFIG_DIR/docker-compose.blue.yml" << 'EOF'
version: '3.8'

services:
  # Blue Environment (Currently Active)
  backend-blue:
    image: barberpro-backend:blue
    container_name: barberpro-backend-blue
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - DEPLOYMENT_SLOT=blue
      - DEPLOYMENT_VERSION=${BLUE_VERSION}
    ports:
      - "3000:3000"
    networks:
      - barberpro-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

networks:
  barberpro-network:
    external: true
EOF

    # Green environment Docker Compose
    cat > "$DEPLOYMENT_CONFIG_DIR/docker-compose.green.yml" << 'EOF'
version: '3.8'

services:
  # Green Environment (Staging for Deployment)
  backend-green:
    image: barberpro-backend:green
    container_name: barberpro-backend-green
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - DEPLOYMENT_SLOT=green
      - DEPLOYMENT_VERSION=${GREEN_VERSION}
    ports:
      - "3001:3001"
    networks:
      - barberpro-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

networks:
  barberpro-network:
    external: true
EOF

    log "INFO" "${GREEN}Deployment configuration created${NC}"
}

# Setup Nginx configurations for blue-green
setup_nginx_configs() {
    log "INFO" "Setting up Nginx configurations for blue-green deployment..."
    
    # Blue configuration (production traffic)
    cat > "$DEPLOYMENT_CONFIG_DIR/nginx/barberpro-blue.conf" << 'EOF'
# BarberPro Blue Environment Configuration
upstream backend_blue {
    server localhost:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name barberpro.com.ar www.barberpro.com.ar;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name barberpro.com.ar www.barberpro.com.ar;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/barberpro.com.ar.crt;
    ssl_certificate_key /etc/nginx/ssl/barberpro.com.ar.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Environment "blue" always;
    
    # Health check endpoint (for load balancer)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://backend_blue;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files and frontend
    location / {
        root /var/www/barberpro;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    # Green configuration (staging/deployment testing)
    cat > "$DEPLOYMENT_CONFIG_DIR/nginx/barberpro-green.conf" << 'EOF'
# BarberPro Green Environment Configuration
upstream backend_green {
    server localhost:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name staging.barberpro.com.ar;
    
    # SSL Configuration (same certificate)
    ssl_certificate /etc/nginx/ssl/barberpro.com.ar.crt;
    ssl_certificate_key /etc/nginx/ssl/barberpro.com.ar.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Environment "green" always;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://backend_green;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files and frontend
    location / {
        root /var/www/barberpro-green;
        try_files $uri $uri/ /index.html;
    }
}
EOF

    log "INFO" "${GREEN}Nginx configurations created${NC}"
}

# Health check functions
perform_health_check() {
    local environment=$1
    local port=$2
    local max_retries=${3:-$MAX_HEALTH_CHECK_RETRIES}
    local timeout=${4:-$HEALTH_CHECK_TIMEOUT}
    
    log "INFO" "Performing health check for $environment environment (port $port)..."
    
    local retries=0
    local start_time=$(date +%s)
    
    while [ $retries -lt $max_retries ]; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            log "ERROR" "Health check timeout for $environment environment"
            return 1
        fi
        
        # Basic health check
        if curl -sf "http://localhost:$port/api/health" >/dev/null 2>&1; then
            log "INFO" "${GREEN}Basic health check passed for $environment${NC}"
            
            # Extended health checks
            if perform_extended_health_check "$port"; then
                log "INFO" "${GREEN}Extended health check passed for $environment${NC}"
                return 0
            fi
        fi
        
        retries=$((retries + 1))
        log "INFO" "Health check attempt $retries/$max_retries for $environment..."
        sleep 5
    done
    
    log "ERROR" "Health check failed for $environment environment after $max_retries attempts"
    return 1
}

perform_extended_health_check() {
    local port=$1
    
    # Database connectivity check
    local db_health=$(curl -sf "http://localhost:$port/api/health/database" 2>/dev/null || echo "failed")
    if [ "$db_health" = "failed" ]; then
        log "WARNING" "Database health check failed"
        return 1
    fi
    
    # Redis connectivity check
    local redis_health=$(curl -sf "http://localhost:$port/api/health/redis" 2>/dev/null || echo "failed")
    if [ "$redis_health" = "failed" ]; then
        log "WARNING" "Redis health check failed"
        return 1
    fi
    
    # API response time check
    local response_time=$(curl -w "%{time_total}" -sf "http://localhost:$port/api/health" -o /dev/null 2>/dev/null || echo "timeout")
    if [ "$response_time" = "timeout" ]; then
        log "WARNING" "API response time check failed"
        return 1
    fi
    
    # Check if response time is acceptable (< 1 second)
    if (( $(echo "$response_time > 1.0" | bc -l) )); then
        log "WARNING" "API response time too slow: ${response_time}s"
        return 1
    fi
    
    log "INFO" "Extended health checks passed (response time: ${response_time}s)"
    return 0
}

# Build and tag new version
build_new_version() {
    local version=$1
    local environment=$2
    
    log "INFO" "Building new version $version for $environment environment..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker image
    if docker build -t "barberpro-backend:$environment" -f Dockerfile .; then
        log "INFO" "${GREEN}Docker image built successfully for $environment${NC}"
        
        # Tag with version
        docker tag "barberpro-backend:$environment" "barberpro-backend:$version"
        log "INFO" "Image tagged with version: $version"
        
        return 0
    else
        log "ERROR" "Failed to build Docker image for $environment"
        return 1
    fi
}

# Deploy to green environment
deploy_to_green() {
    local version=$1
    
    log "INFO" "${CYAN}Deploying version $version to GREEN environment...${NC}"
    
    # Set environment variables
    export GREEN_VERSION=$version
    
    # Stop existing green environment
    if docker-compose -f "$DEPLOYMENT_CONFIG_DIR/docker-compose.green.yml" down 2>/dev/null; then
        log "INFO" "Stopped existing green environment"
    fi
    
    # Start green environment with new version
    if docker-compose -f "$DEPLOYMENT_CONFIG_DIR/docker-compose.green.yml" up -d; then
        log "INFO" "Started green environment with version $version"
        
        # Wait for container to be ready
        sleep 10
        
        # Perform health check
        if perform_health_check "GREEN" $GREEN_PORT; then
            log "INFO" "${GREEN}Green environment deployment successful${NC}"
            return 0
        else
            log "ERROR" "Green environment health check failed"
            return 1
        fi
    else
        log "ERROR" "Failed to start green environment"
        return 1
    fi
}

# Switch traffic from blue to green
switch_to_green() {
    log "INFO" "${CYAN}Switching traffic from BLUE to GREEN...${NC}"
    
    # Create backup of current nginx config
    cp "$NGINX_CONFIG_DIR/barberpro" "$DEPLOYMENT_CONFIG_DIR/rollback/barberpro.backup.$(date +%s)"
    
    # Update nginx configuration to point to green
    sed -i.bak 's/localhost:3000/localhost:3001/g' "$NGINX_CONFIG_DIR/barberpro"
    sed -i.bak 's/X-Environment "blue"/X-Environment "green"/g' "$NGINX_CONFIG_DIR/barberpro"
    
    # Test nginx configuration
    if nginx -t; then
        log "INFO" "Nginx configuration test passed"
        
        # Reload nginx
        if systemctl reload nginx; then
            log "INFO" "${GREEN}Traffic switched to GREEN environment${NC}"
            return 0
        else
            log "ERROR" "Failed to reload nginx"
            return 1
        fi
    else
        log "ERROR" "Nginx configuration test failed"
        return 1
    fi
}

# Post-deployment validation
validate_deployment() {
    local environment=$1
    
    log "INFO" "Validating deployment in $environment environment..."
    
    # Test key endpoints
    local endpoints=(
        "/api/health"
        "/api/auth/status" 
        "/api/bookings/available"
        "/api/providers"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="https://barberpro.com.ar$endpoint"
        local response_code=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$response_code" = "200" ]; then
            log "INFO" "✓ Endpoint $endpoint returned 200"
        else
            log "ERROR" "✗ Endpoint $endpoint returned $response_code"
            return 1
        fi
    done
    
    # Test payment gateway integration
    local payment_health=$(curl -sf "https://barberpro.com.ar/api/payment/status" 2>/dev/null || echo "failed")
    if [ "$payment_health" != "failed" ]; then
        log "INFO" "✓ Payment gateway integration working"
    else
        log "WARNING" "⚠ Payment gateway check inconclusive"
    fi
    
    # Test database performance
    local db_response_time=$(curl -w "%{time_total}" -sf "https://barberpro.com.ar/api/health/database" -o /dev/null 2>/dev/null || echo "timeout")
    if [ "$db_response_time" != "timeout" ] && (( $(echo "$db_response_time < 0.5" | bc -l) )); then
        log "INFO" "✓ Database performance acceptable (${db_response_time}s)"
    else
        log "WARNING" "⚠ Database performance may be degraded"
    fi
    
    log "INFO" "${GREEN}Deployment validation completed${NC}"
    return 0
}

# Rollback to previous version
rollback_deployment() {
    local reason=$1
    
    log "WARNING" "${YELLOW}Initiating rollback due to: $reason${NC}"
    
    # Restore nginx configuration
    if [ -f "$DEPLOYMENT_CONFIG_DIR/rollback/barberpro.backup.$(ls -t $DEPLOYMENT_CONFIG_DIR/rollback/ | head -n1 | sed 's/barberpro.backup.//')" ]; then
        local latest_backup=$(ls -t $DEPLOYMENT_CONFIG_DIR/rollback/barberpro.backup.* | head -n1)
        cp "$latest_backup" "$NGINX_CONFIG_DIR/barberpro"
        
        # Test and reload nginx
        if nginx -t && systemctl reload nginx; then
            log "INFO" "${GREEN}Nginx configuration rolled back successfully${NC}"
        else
            log "ERROR" "Failed to rollback nginx configuration"
        fi
    fi
    
    # Stop green environment
    docker-compose -f "$DEPLOYMENT_CONFIG_DIR/docker-compose.green.yml" down
    
    # Verify blue environment is healthy
    if perform_health_check "BLUE" $BLUE_PORT 5 60; then
        log "INFO" "${GREEN}Rollback completed - traffic restored to BLUE${NC}"
        
        # Send rollback notification
        send_deployment_notification "ROLLBACK" "Deployment rolled back: $reason"
    else
        log "ERROR" "CRITICAL: Blue environment also unhealthy after rollback!"
        send_deployment_notification "CRITICAL" "Both environments unhealthy after rollback attempt"
    fi
}

# Cleanup old environments
cleanup_old_environment() {
    local environment=$1
    
    log "INFO" "Cleaning up old $environment environment..."
    
    if [ "$environment" = "blue" ]; then
        docker-compose -f "$DEPLOYMENT_CONFIG_DIR/docker-compose.blue.yml" down
        docker rmi "barberpro-backend:blue" 2>/dev/null || true
    else
        docker-compose -f "$DEPLOYMENT_CONFIG_DIR/docker-compose.green.yml" down
        docker rmi "barberpro-backend:green" 2>/dev/null || true
    fi
    
    # Clean up old images (keep last 3 versions)
    docker image prune -f
    
    log "INFO" "Cleanup completed for $environment environment"
}

# Send deployment notifications
send_deployment_notification() {
    local status=$1
    local message=$2
    
    local emoji="🚀"
    local color="good"
    
    case $status in
        "SUCCESS")
            emoji="✅"
            color="good"
            ;;
        "ROLLBACK")
            emoji="↩️"
            color="warning"
            ;;
        "FAILED"|"CRITICAL")
            emoji="❌"
            color="danger"
            ;;
    esac
    
    # Send to Slack
    if [ -n "$SLACK_WEBHOOK_DEPLOYMENT" ]; then
        curl -X POST "$SLACK_WEBHOOK_DEPLOYMENT" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"$emoji BarberPro Deployment $status\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Status\",
                        \"value\": \"$status\",
                        \"short\": true
                    }, {
                        \"title\": \"Deployment ID\",
                        \"value\": \"$DEPLOYMENT_ID\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date '+%Y-%m-%d %H:%M:%S ART')\",
                        \"short\": true
                    }]
                }]
            }"
    fi
    
    # Send email to ops team
    if command -v mail >/dev/null; then
        echo "$message" | mail -s "BarberPro Deployment $status" ops@barberpro.com.ar
    fi
}

# Main deployment function
deploy() {
    local version=${1:-$(date +%Y%m%d_%H%M%S)}
    local skip_tests=${2:-false}
    
    log "INFO" "${BLUE}Starting Blue-Green deployment for BarberPro v$version${NC}"
    log "INFO" "Deployment ID: $DEPLOYMENT_ID"
    
    # Pre-deployment checks
    if [ "$skip_tests" != "true" ]; then
        log "INFO" "Running pre-deployment checks..."
        
        # Check current blue environment
        if ! perform_health_check "BLUE" $BLUE_PORT 3 30; then
            log "ERROR" "Current production environment is unhealthy - aborting deployment"
            return 1
        fi
    fi
    
    # Build new version
    if ! build_new_version "$version" "green"; then
        log "ERROR" "Failed to build new version - aborting deployment"
        return 1
    fi
    
    # Deploy to green environment
    if ! deploy_to_green "$version"; then
        log "ERROR" "Failed to deploy to green environment - aborting"
        cleanup_old_environment "green"
        return 1
    fi
    
    # Validate green environment
    log "INFO" "Validating green environment before traffic switch..."
    sleep 30  # Allow more time for full startup
    
    if ! validate_deployment "GREEN"; then
        log "ERROR" "Green environment validation failed"
        rollback_deployment "Green environment validation failed"
        return 1
    fi
    
    # Switch traffic to green
    if ! switch_to_green; then
        log "ERROR" "Failed to switch traffic to green"
        rollback_deployment "Traffic switch failed"
        return 1
    fi
    
    # Post-switch validation
    log "INFO" "Validating production traffic on green environment..."
    sleep 60  # Allow time for traffic to stabilize
    
    if ! validate_deployment "GREEN"; then
        log "ERROR" "Post-switch validation failed"
        rollback_deployment "Post-switch validation failed"
        return 1
    fi
    
    # Success - cleanup old blue environment
    cleanup_old_environment "blue"
    
    # Promote green to blue for next deployment
    export BLUE_VERSION=$version
    docker tag "barberpro-backend:green" "barberpro-backend:blue"
    
    log "INFO" "${GREEN}Blue-Green deployment completed successfully!${NC}"
    log "INFO" "Version $version is now live in production"
    
    send_deployment_notification "SUCCESS" "Version $version deployed successfully via blue-green deployment"
    
    return 0
}

# Create deployment management commands
create_deployment_commands() {
    log "INFO" "Creating deployment management commands..."
    
    # Deployment status command
    cat > "$DEPLOYMENT_CONFIG_DIR/status.sh" << 'EOF'
#!/bin/bash
echo "BarberPro Deployment Status"
echo "=========================="
echo "Blue Environment:"
docker ps --filter "name=barberpro-backend-blue" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Green Environment:"  
docker ps --filter "name=barberpro-backend-green" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Current Nginx Configuration:"
grep -n "localhost:" /etc/nginx/sites-available/barberpro | head -2
EOF

    chmod +x "$DEPLOYMENT_CONFIG_DIR/status.sh"
    
    # Quick rollback command
    cat > "$DEPLOYMENT_CONFIG_DIR/rollback.sh" << 'EOF'
#!/bin/bash
echo "Initiating emergency rollback..."
source "$(dirname "$0")/../scripts/blue-green-deployment.sh"
rollback_deployment "Manual emergency rollback"
EOF

    chmod +x "$DEPLOYMENT_CONFIG_DIR/rollback.sh"
    
    log "INFO" "${GREEN}Deployment management commands created${NC}"
}

# Main function
main() {
    case "${1:-deploy}" in
        "setup")
            setup_deployment_config
            setup_nginx_configs
            create_deployment_commands
            log "INFO" "${GREEN}Blue-green deployment setup completed${NC}"
            ;;
        "deploy")
            setup_deployment_config
            setup_nginx_configs
            deploy "${2:-$(date +%Y%m%d_%H%M%S)}" "${3:-false}"
            ;;
        "rollback")
            rollback_deployment "${2:-Manual rollback}"
            ;;
        "status")
            "$DEPLOYMENT_CONFIG_DIR/status.sh"
            ;;
        "health")
            perform_health_check "${2:-BLUE}" "${3:-3000}"
            ;;
        *)
            echo "Usage: $0 {setup|deploy|rollback|status|health} [options]"
            echo "  setup                 - Setup blue-green deployment configuration"
            echo "  deploy [version]      - Deploy new version using blue-green strategy" 
            echo "  rollback [reason]     - Rollback to previous version"
            echo "  status                - Show current deployment status"
            echo "  health [env] [port]   - Perform health check on environment"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"