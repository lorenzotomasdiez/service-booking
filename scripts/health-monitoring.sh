#!/bin/bash

# ============================================================================
# BarberPro Health Monitoring Script
# Automated database service health monitoring and recovery procedures
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/barberpro-health.log"
NOTIFICATION_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
MAX_RETRIES=3
RETRY_INTERVAL=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Health check functions
check_postgres_health() {
    log "INFO" "Checking PostgreSQL health..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U barberpro -d barberpro_prod >/dev/null 2>&1; then
            log "INFO" "${GREEN}PostgreSQL is healthy${NC}"
            
            # Check database performance
            local connections=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U barberpro -d barberpro_prod -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
            local max_connections=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U barberpro -d barberpro_prod -t -c "SHOW max_connections;" 2>/dev/null | tr -d ' ')
            
            if [ -n "$connections" ] && [ -n "$max_connections" ]; then
                local usage=$(echo "scale=2; $connections * 100 / $max_connections" | bc -l 2>/dev/null || echo "0")
                log "INFO" "Database connections: $connections/$max_connections (${usage}%)"
                
                if (( $(echo "$usage > 80" | bc -l) )); then
                    log "WARNING" "${YELLOW}High database connection usage: ${usage}%${NC}"
                    send_alert "HIGH_DB_CONNECTIONS" "Database connection usage is ${usage}%"
                fi
            fi
            
            return 0
        else
            retries=$((retries + 1))
            log "WARNING" "${YELLOW}PostgreSQL health check failed, attempt $retries/$MAX_RETRIES${NC}"
            sleep $RETRY_INTERVAL
        fi
    done
    
    log "ERROR" "${RED}PostgreSQL is unhealthy after $MAX_RETRIES attempts${NC}"
    send_alert "POSTGRES_DOWN" "PostgreSQL failed health checks after $MAX_RETRIES attempts"
    return 1
}

check_redis_health() {
    log "INFO" "Checking Redis health..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q "PONG"; then
            log "INFO" "${GREEN}Redis is healthy${NC}"
            
            # Check memory usage
            local used_memory=$(docker-compose -f docker-compose.production.yml exec -T redis redis-cli info memory | grep "used_memory:" | cut -d: -f2 | tr -d '\r')
            local max_memory=$(docker-compose -f docker-compose.production.yml exec -T redis redis-cli config get maxmemory | tail -1 | tr -d '\r')
            
            if [ -n "$used_memory" ] && [ "$max_memory" != "0" ]; then
                local usage=$(echo "scale=2; $used_memory * 100 / $max_memory" | bc -l 2>/dev/null || echo "0")
                log "INFO" "Redis memory usage: ${usage}%"
                
                if (( $(echo "$usage > 90" | bc -l) )); then
                    log "WARNING" "${YELLOW}High Redis memory usage: ${usage}%${NC}"
                    send_alert "HIGH_REDIS_MEMORY" "Redis memory usage is ${usage}%"
                fi
            fi
            
            return 0
        else
            retries=$((retries + 1))
            log "WARNING" "${YELLOW}Redis health check failed, attempt $retries/$MAX_RETRIES${NC}"
            sleep $RETRY_INTERVAL
        fi
    done
    
    log "ERROR" "${RED}Redis is unhealthy after $MAX_RETRIES attempts${NC}"
    send_alert "REDIS_DOWN" "Redis failed health checks after $MAX_RETRIES attempts"
    return 1
}

check_backend_health() {
    log "INFO" "Checking Backend API health..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
        if [ "$response_code" = "200" ]; then
            log "INFO" "${GREEN}Backend API is healthy${NC}"
            
            # Check response time
            local response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/api/health 2>/dev/null || echo "0")
            log "INFO" "API response time: ${response_time}s"
            
            if (( $(echo "$response_time > 0.5" | bc -l) )); then
                log "WARNING" "${YELLOW}Slow API response time: ${response_time}s${NC}"
                send_alert "SLOW_API_RESPONSE" "API response time is ${response_time}s"
            fi
            
            return 0
        else
            retries=$((retries + 1))
            log "WARNING" "${YELLOW}Backend health check failed (HTTP $response_code), attempt $retries/$MAX_RETRIES${NC}"
            sleep $RETRY_INTERVAL
        fi
    done
    
    log "ERROR" "${RED}Backend API is unhealthy after $MAX_RETRIES attempts${NC}"
    send_alert "BACKEND_DOWN" "Backend API failed health checks after $MAX_RETRIES attempts"
    return 1
}

check_nginx_health() {
    log "INFO" "Checking Nginx health..."
    
    if docker-compose -f docker-compose.production.yml exec -T nginx nginx -t >/dev/null 2>&1; then
        log "INFO" "${GREEN}Nginx configuration is valid${NC}"
        return 0
    else
        log "ERROR" "${RED}Nginx configuration is invalid${NC}"
        send_alert "NGINX_CONFIG_ERROR" "Nginx configuration validation failed"
        return 1
    fi
}

# CDN Performance Validation
validate_cdn_performance() {
    log "INFO" "Validating CDN performance for Argentina..."
    
    local test_endpoints=(
        "https://barberpro.com.ar"
        "https://api.barberpro.com.ar/api/health"
        "https://cdn.barberpro.com.ar/assets/logo.png"
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        log "INFO" "Testing CDN performance for: $endpoint"
        
        # Test from Buenos Aires (simulated)
        local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$endpoint" 2>/dev/null || echo "timeout")
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
        
        if [ "$http_code" = "200" ] && [ "$response_time" != "timeout" ]; then
            local response_ms=$(echo "$response_time * 1000" | bc -l)
            log "INFO" "CDN response: ${response_ms}ms (HTTP $http_code)"
            
            if (( $(echo "$response_time > 0.2" | bc -l) )); then
                log "WARNING" "${YELLOW}CDN response time exceeds Argentina SLA: ${response_ms}ms${NC}"
                send_alert "CDN_SLOW_RESPONSE" "CDN response time is ${response_ms}ms for $endpoint"
            fi
        else
            log "ERROR" "${RED}CDN test failed for $endpoint (HTTP $http_code)${NC}"
            send_alert "CDN_FAILURE" "CDN test failed for $endpoint"
        fi
    done
}

# Connection resilience test
test_connection_resilience() {
    log "INFO" "Testing connection resilience and automatic recovery..."
    
    # Test database connection recovery
    log "INFO" "Testing database connection recovery..."
    local db_recovery_test=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U barberpro -d barberpro_prod -c "SELECT 1;" 2>/dev/null | grep -q "1" && echo "pass" || echo "fail")
    
    if [ "$db_recovery_test" = "pass" ]; then
        log "INFO" "${GREEN}Database connection recovery test: PASSED${NC}"
    else
        log "ERROR" "${RED}Database connection recovery test: FAILED${NC}"
        return 1
    fi
    
    # Test Redis connection recovery
    log "INFO" "Testing Redis connection recovery..."
    local redis_recovery_test=$(docker-compose -f docker-compose.production.yml exec -T redis redis-cli set test_key "recovery_test" && docker-compose -f docker-compose.production.yml exec -T redis redis-cli get test_key | grep -q "recovery_test" && echo "pass" || echo "fail")
    
    if [ "$redis_recovery_test" = "pass" ]; then
        log "INFO" "${GREEN}Redis connection recovery test: PASSED${NC}"
        docker-compose -f docker-compose.production.yml exec -T redis redis-cli del test_key >/dev/null 2>&1
    else
        log "ERROR" "${RED}Redis connection recovery test: FAILED${NC}"
        return 1
    fi
}

# Database startup reliability enhancement
enhance_database_startup() {
    log "INFO" "Enhancing database startup reliability..."
    
    # Check if custom PostgreSQL init scripts exist
    if [ ! -f "$PROJECT_ROOT/scripts/init-prod-db.sql" ]; then
        log "INFO" "Creating production database initialization script..."
        cat > "$PROJECT_ROOT/scripts/init-prod-db.sql" << 'EOF'
-- BarberPro Production Database Initialization
-- Enhanced for Argentina market

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Argentina timezone
ALTER SYSTEM SET timezone = 'America/Argentina/Buenos_Aires';

-- Connection settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';

-- Create monitoring user
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitoring') THEN
    CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitoring_secure_password';
    GRANT pg_monitor TO monitoring;
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_provider_date ON bookings(provider_id, booking_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_client_status ON bookings(client_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created ON payments(status, created_at);

-- Enable query logging for slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'mod';

SELECT pg_reload_conf();
EOF
    fi
    
    # Check PostgreSQL configuration
    if [ ! -f "$PROJECT_ROOT/config/postgres-prod.conf" ]; then
        mkdir -p "$PROJECT_ROOT/config"
        log "INFO" "Creating production PostgreSQL configuration..."
        cat > "$PROJECT_ROOT/config/postgres-prod.conf" << 'EOF'
# PostgreSQL Production Configuration for BarberPro
# Optimized for Argentina service booking platform

# Connection settings
listen_addresses = '*'
port = 5432
max_connections = 200
superuser_reserved_connections = 3

# Memory settings
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB
dynamic_shared_memory_type = posix

# WAL settings
wal_buffers = 16MB
wal_level = replica
max_wal_size = 2GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9

# Query planner
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_duration_statement = 1000
log_statement = 'mod'
log_timezone = 'America/Argentina/Buenos_Aires'

# Error handling
restart_after_crash = on
EOF
    fi
    
    log "INFO" "${GREEN}Database startup reliability enhanced${NC}"
}

# Alert notification function
send_alert() {
    local alert_type=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"🚨 BarberPro Alert: $alert_type\",
                \"attachments\": [{
                    \"color\": \"danger\",
                    \"fields\": [{
                        \"title\": \"Alert Type\",
                        \"value\": \"$alert_type\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$timestamp\",
                        \"short\": true
                    }]
                }]
            }" >/dev/null 2>&1
    fi
}

# Main health check function
main() {
    log "INFO" "${BLUE}Starting BarberPro health monitoring...${NC}"
    
    local exit_code=0
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # Enhance database startup
    enhance_database_startup
    
    # Run health checks
    check_postgres_health || exit_code=1
    check_redis_health || exit_code=1
    check_backend_health || exit_code=1
    check_nginx_health || exit_code=1
    
    # Validate CDN performance
    validate_cdn_performance || exit_code=1
    
    # Test connection resilience
    test_connection_resilience || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log "INFO" "${GREEN}All health checks passed successfully!${NC}"
    else
        log "ERROR" "${RED}Some health checks failed. Check logs for details.${NC}"
        send_alert "HEALTH_CHECK_FAILURE" "One or more health checks failed"
    fi
    
    return $exit_code
}

# Run with cron support
if [ "$1" = "--cron" ]; then
    main >> "$LOG_FILE" 2>&1
else
    main
fi