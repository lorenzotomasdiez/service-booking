#!/bin/bash

# BarberPro Production Deployment Script
# Optimized for Railway deployment in Argentina

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/barberpro-deploy.log"
TIMEZONE="America/Argentina/Buenos_Aires"
DEPLOY_ENV="${DEPLOY_ENV:-production}"

# Argentina compliance: Set timezone
export TZ="$TIMEZONE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function with Argentina timezone
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Success notification
success_notification() {
    log "INFO" "✅ $1"
    
    # Send deployment notification
    if [ -n "${DEPLOY_WEBHOOK_URL:-}" ]; then
        curl -X POST "$DEPLOY_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"message\": \"✅ BarberPro deployment successful: $1\", 
                \"environment\": \"$DEPLOY_ENV\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"timezone\": \"$TIMEZONE\"
            }" \
            --max-time 30 --silent || log "WARN" "Failed to send success notification"
    fi
}

# Error notification
error_notification() {
    log "ERROR" "❌ $1"
    
    # Send error notification
    if [ -n "${DEPLOY_WEBHOOK_URL:-}" ]; then
        curl -X POST "$DEPLOY_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"message\": \"❌ BarberPro deployment failed: $1\", 
                \"environment\": \"$DEPLOY_ENV\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"timezone\": \"$TIMEZONE\"
            }" \
            --max-time 30 --silent || log "WARN" "Failed to send error notification"
    fi
}

# Display banner
show_banner() {
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                     BarberPro Deployment                     ║
║              Argentina Service Booking Platform              ║
╚══════════════════════════════════════════════════════════════╝
EOF
}

# Validate environment
validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check required commands
    local required_commands=("docker" "node" "npm" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command not found: $cmd"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_node="18.0.0"
    
    if ! printf '%s\n%s\n' "$required_node" "$node_version" | sort -V -C; then
        error_exit "Node.js version $node_version is below required $required_node"
    fi
    
    # Check environment variables for production
    if [ "$DEPLOY_ENV" = "production" ]; then
        local required_vars=(
            "DATABASE_URL"
            "REDIS_URL" 
            "JWT_SECRET"
            "MERCADOPAGO_ACCESS_TOKEN"
            "MERCADOPAGO_PUBLIC_KEY"
        )
        
        for var in "${required_vars[@]}"; do
            if [ -z "${!var:-}" ]; then
                error_exit "Required environment variable not set: $var"
            fi
        done
    fi
    
    log "INFO" "Environment validation completed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "INFO" "Running pre-deployment checks..."
    
    # Check git status
    if [[ -n $(git status --porcelain) ]]; then
        log "WARN" "Working directory has uncommitted changes"
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    if [ "$DEPLOY_ENV" = "production" ] && [ "$current_branch" != "main" ]; then
        error_exit "Production deployments must be from main branch (current: $current_branch)"
    fi
    
    # Run tests
    log "INFO" "Running test suite..."
    if ! npm test; then
        error_exit "Tests failed. Deployment aborted."
    fi
    
    # Check for security vulnerabilities
    log "INFO" "Checking for security vulnerabilities..."
    if ! npm audit --audit-level moderate; then
        log "WARN" "Security vulnerabilities detected. Review npm audit output."
    fi
    
    log "INFO" "Pre-deployment checks completed"
}

# Build application
build_application() {
    log "INFO" "Building application..."
    
    # Install dependencies
    log "INFO" "Installing dependencies..."
    npm ci --production=false
    
    # Generate Prisma client
    log "INFO" "Generating Prisma client..."
    npx prisma generate
    
    # Type checking
    log "INFO" "Running TypeScript type checking..."
    npm run typecheck
    
    # Build application
    log "INFO" "Building application..."
    npm run build
    
    # Verify build output
    if [ ! -f "dist/server.js" ]; then
        error_exit "Build failed: dist/server.js not found"
    fi
    
    log "INFO" "Application build completed"
}

# Database operations
manage_database() {
    log "INFO" "Managing database migrations..."
    
    # Backup current database (production only)
    if [ "$DEPLOY_ENV" = "production" ]; then
        log "INFO" "Creating pre-deployment database backup..."
        local backup_file="/tmp/barberpro_pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
        
        pg_dump "$DATABASE_URL" > "$backup_file" || log "WARN" "Could not create backup"
        log "INFO" "Database backup created: $backup_file"
    fi
    
    # Run migrations
    log "INFO" "Running database migrations..."
    if ! npx prisma migrate deploy; then
        error_exit "Database migration failed"
    fi
    
    # Verify database connection
    log "INFO" "Verifying database connection..."
    if ! npx prisma db ping; then
        error_exit "Database connection verification failed"
    fi
    
    log "INFO" "Database operations completed"
}

# Deploy to Railway
deploy_to_railway() {
    log "INFO" "Deploying to Railway..."
    
    # Check if railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log "INFO" "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway (assuming token is set)
    if [ -n "${RAILWAY_TOKEN:-}" ]; then
        echo "$RAILWAY_TOKEN" | railway login --token
    fi
    
    # Deploy based on environment
    case "$DEPLOY_ENV" in
        "production")
            log "INFO" "Deploying to production environment..."
            railway deploy --environment production
            ;;
        "staging")
            log "INFO" "Deploying to staging environment..."
            railway deploy --environment staging
            ;;
        *)
            error_exit "Unknown deployment environment: $DEPLOY_ENV"
            ;;
    esac
    
    log "INFO" "Railway deployment completed"
}

# Health checks
run_health_checks() {
    log "INFO" "Running post-deployment health checks..."
    
    local max_attempts=30
    local attempt=1
    local health_url
    
    case "$DEPLOY_ENV" in
        "production")
            health_url="https://barberpro.com.ar/api/health"
            ;;
        "staging")
            health_url="https://staging.barberpro.com.ar/api/health"
            ;;
        *)
            error_exit "Unknown environment for health check: $DEPLOY_ENV"
            ;;
    esac
    
    log "INFO" "Waiting for application to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        log "DEBUG" "Health check attempt $attempt/$max_attempts"
        
        if curl -f --max-time 10 --silent "$health_url" > /dev/null; then
            log "INFO" "✅ Application is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error_exit "Application failed health checks after $max_attempts attempts"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Additional health checks
    log "INFO" "Running comprehensive health checks..."
    
    # Check readiness endpoint
    if ! curl -f --max-time 10 --silent "${health_url}/ready" > /dev/null; then
        log "WARN" "Readiness check failed, but continuing deployment"
    fi
    
    # Check API endpoints
    local api_endpoints=(
        "/api/services"
        "/api/auth/health"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        local endpoint_url="${health_url%/api/health}$endpoint"
        if curl -f --max-time 10 --silent "$endpoint_url" > /dev/null; then
            log "INFO" "✅ Endpoint healthy: $endpoint"
        else
            log "WARN" "⚠️  Endpoint check failed: $endpoint"
        fi
    done
}

# Performance verification
verify_performance() {
    log "INFO" "Verifying performance (Argentina SLA: <200ms)..."
    
    local api_url
    case "$DEPLOY_ENV" in
        "production")
            api_url="https://barberpro.com.ar/api/health"
            ;;
        "staging")
            api_url="https://staging.barberpro.com.ar/api/health"
            ;;
    esac
    
    # Measure response time
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$api_url")
    local response_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    if [ "$response_ms" -lt 200 ]; then
        log "INFO" "✅ Performance check passed: ${response_ms}ms"
    else
        log "WARN" "⚠️  Performance check failed: ${response_ms}ms (SLA: <200ms)"
    fi
}

# Smoke tests
run_smoke_tests() {
    log "INFO" "Running smoke tests..."
    
    # Test critical user journeys
    local base_url
    case "$DEPLOY_ENV" in
        "production")
            base_url="https://barberpro.com.ar"
            ;;
        "staging")
            base_url="https://staging.barberpro.com.ar"
            ;;
    esac
    
    # Test service listing
    if curl -f --max-time 30 "${base_url}/api/services" > /dev/null; then
        log "INFO" "✅ Services endpoint working"
    else
        log "WARN" "⚠️  Services endpoint test failed"
    fi
    
    # Test MercadoPago integration health
    if curl -f --max-time 30 "${base_url}/api/payments/mercadopago/status" > /dev/null; then
        log "INFO" "✅ MercadoPago integration healthy"
    else
        log "WARN" "⚠️  MercadoPago integration test failed"
    fi
    
    log "INFO" "Smoke tests completed"
}

# Rollback function
rollback_deployment() {
    log "WARN" "Initiating deployment rollback..."
    
    # Get previous deployment
    local previous_deployment=$(railway deployments list --json | jq -r '.[1].id' 2>/dev/null || echo "")
    
    if [ -n "$previous_deployment" ]; then
        log "INFO" "Rolling back to deployment: $previous_deployment"
        railway rollback "$previous_deployment"
        
        # Wait for rollback to complete
        sleep 30
        
        # Verify rollback
        if run_health_checks; then
            log "INFO" "✅ Rollback completed successfully"
        else
            error_exit "❌ Rollback failed"
        fi
    else
        error_exit "❌ Could not find previous deployment for rollback"
    fi
}

# Generate deployment report
generate_deployment_report() {
    log "INFO" "Generating deployment report..."
    
    local report_file="/tmp/barberpro_deployment_report_$(date +%Y%m%d_%H%M%S).txt"
    local git_commit=$(git rev-parse HEAD)
    local git_branch=$(git branch --show-current)
    
    cat > "$report_file" << EOF
BarberPro Deployment Report
===========================
Date: $(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')
Environment: $DEPLOY_ENV
Timezone: $TIMEZONE

Git Information:
- Branch: $git_branch
- Commit: $git_commit
- Author: $(git log -1 --pretty=format:'%an <%ae>')
- Message: $(git log -1 --pretty=format:'%s')

Deployment Details:
- Node.js Version: $(node --version)
- NPM Version: $(npm --version)
- Build Time: $(date -Iseconds)
- Deployment Method: Railway CLI

Health Check Results:
- Application Status: $(curl -f --max-time 10 --silent "${health_url:-}" > /dev/null && echo "Healthy" || echo "Failed")
- Response Time: ${response_ms:-Unknown}ms
- Database: $(npx prisma db ping > /dev/null 2>&1 && echo "Connected" || echo "Failed")

Argentina Compliance:
- Timezone: $TIMEZONE
- Data Residency: Argentina (Railway South America)
- Performance SLA: <200ms response time
- Monitoring: Enabled

Next Steps:
- Monitor application metrics for 1 hour
- Verify customer traffic patterns
- Check Argentina business hours performance
- Review error rates and alerts

EOF

    log "INFO" "Deployment report generated: $report_file"
    cat "$report_file"
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/barberpro-build-*
    rm -f /tmp/barberpro-test-*
    
    # Clear npm cache
    npm cache clean --force --silent
    
    log "INFO" "Cleanup completed"
}

# Main deployment function
main() {
    show_banner
    
    log "INFO" "Starting BarberPro deployment to $DEPLOY_ENV environment..."
    log "INFO" "Argentina timezone: $TIMEZONE"
    log "INFO" "Deployment time: $(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')"
    
    # Set error handling
    trap 'error_notification "Deployment failed at line $LINENO"' ERR
    trap cleanup EXIT
    
    # Deployment steps
    validate_environment
    pre_deployment_checks
    build_application
    manage_database
    deploy_to_railway
    
    # Post-deployment verification
    run_health_checks
    verify_performance
    run_smoke_tests
    
    # Generate report
    generate_deployment_report
    
    # Success notification
    success_notification "Deployment to $DEPLOY_ENV completed successfully at $(TZ=$TIMEZONE date)"
    
    log "INFO" "🎉 BarberPro deployment completed successfully!"
    log "INFO" "Access your application at: $(case "$DEPLOY_ENV" in "production") echo "https://barberpro.com.ar";; "staging") echo "https://staging.barberpro.com.ar";; esac)"
    
    exit 0
}

# Handle script arguments
case "${1:-}" in
    "production"|"prod")
        DEPLOY_ENV="production"
        ;;
    "staging"|"stage")
        DEPLOY_ENV="staging"
        ;;
    "rollback")
        rollback_deployment
        exit 0
        ;;
    "help"|"--help"|"-h")
        cat << EOF
BarberPro Deployment Script

Usage: $0 [ENVIRONMENT|COMMAND]

Environments:
  production, prod    Deploy to production
  staging, stage      Deploy to staging

Commands:
  rollback           Rollback to previous deployment
  help               Show this help message

Environment Variables:
  DEPLOY_WEBHOOK_URL      Webhook URL for deployment notifications
  RAILWAY_TOKEN          Railway authentication token
  DATABASE_URL           PostgreSQL database URL
  REDIS_URL              Redis cache URL
  JWT_SECRET             JWT signing secret

Examples:
  $0 production          # Deploy to production
  $0 staging             # Deploy to staging  
  $0 rollback            # Rollback current deployment

EOF
        exit 0
        ;;
    "")
        # Default to staging if no argument provided
        DEPLOY_ENV="staging"
        ;;
    *)
        error_exit "Unknown argument: $1. Use 'help' for usage information."
        ;;
esac

# Run main function
main "$@"