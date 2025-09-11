#!/bin/bash

# BarberPro Production Backup Script
# Optimized for Argentina compliance and Railway deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/backup"
LOG_FILE="/var/log/barberpro-backup.log"
DATE=$(date +"%Y%m%d_%H%M%S")
TIMEZONE="America/Argentina/Buenos_Aires"

# Argentina compliance: Set timezone
export TZ="$TIMEZONE"

# Logging function with Argentina timezone
log() {
    echo "[$(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Success notification
success_notification() {
    log "SUCCESS: $1"
    
    # Send notification (implement webhook or email notification)
    if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"✅ BarberPro backup completed: $1\", \"timestamp\": \"$(date -Iseconds)\"}" \
            --max-time 30 --silent || log "WARNING: Failed to send success notification"
    fi
}

# Error notification
error_notification() {
    log "ERROR: $1"
    
    # Send error notification
    if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"❌ BarberPro backup failed: $1\", \"timestamp\": \"$(date -Iseconds)\"}" \
            --max-time 30 --silent || log "WARNING: Failed to send error notification"
    fi
}

# Validate environment variables
validate_environment() {
    log "Validating environment variables..."
    
    required_vars=("POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
    
    log "Environment validation completed"
}

# Create backup directory structure
setup_backup_directory() {
    log "Setting up backup directory structure..."
    
    mkdir -p "$BACKUP_DIR"/{database,files,logs}
    
    # Set proper permissions
    chmod 700 "$BACKUP_DIR"
    
    log "Backup directory structure created"
}

# Database backup with Argentina-specific settings
backup_database() {
    log "Starting PostgreSQL database backup..."
    
    local backup_file="$BACKUP_DIR/database/barberpro_db_${DATE}.sql"
    local backup_file_compressed="$BACKUP_DIR/database/barberpro_db_${DATE}.sql.gz"
    
    # Set PostgreSQL connection parameters
    export PGPASSWORD="$POSTGRES_PASSWORD"
    export PGTZ="$TIMEZONE"
    
    # Create database dump with Argentina timezone
    if pg_dump \
        --host=postgres \
        --port=5432 \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --no-password \
        --verbose \
        --format=plain \
        --encoding=UTF8 \
        --no-owner \
        --no-privileges \
        --compress=0 \
        --file="$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
        
        # Compress the backup
        gzip "$backup_file"
        
        # Get backup size
        local backup_size=$(du -h "$backup_file_compressed" | cut -f1)
        log "Database backup completed: $backup_file_compressed ($backup_size)"
        
        # Verify backup integrity
        if gunzip -t "$backup_file_compressed" 2>/dev/null; then
            log "Database backup integrity verified"
        else
            error_notification "Database backup integrity check failed"
            return 1
        fi
        
        return 0
    else
        error_notification "Database backup failed"
        return 1
    fi
}

# Application files backup
backup_application_files() {
    log "Starting application files backup..."
    
    local backup_file="$BACKUP_DIR/files/barberpro_files_${DATE}.tar.gz"
    
    # Files to backup
    local files_to_backup=(
        "/app/uploads"
        "/app/config"
        "/app/.env.production"
        "/app/package.json"
        "/app/package-lock.json"
    )
    
    # Create files backup
    if tar -czf "$backup_file" \
        --exclude="*.tmp" \
        --exclude="*.log" \
        --exclude="node_modules" \
        "${files_to_backup[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "Application files backup completed: $backup_file ($backup_size)"
        return 0
    else
        error_notification "Application files backup failed"
        return 1
    fi
}

# Backup logs with rotation
backup_logs() {
    log "Starting logs backup..."
    
    local logs_backup_file="$BACKUP_DIR/logs/barberpro_logs_${DATE}.tar.gz"
    
    # Log files to backup
    local log_files=(
        "/var/log/barberpro-backup.log"
        "/var/log/nginx"
        "/app/logs"
    )
    
    # Create logs backup
    if tar -czf "$logs_backup_file" "${log_files[@]}" 2>/dev/null; then
        local backup_size=$(du -h "$logs_backup_file" | cut -f1)
        log "Logs backup completed: $logs_backup_file ($backup_size)"
    else
        log "WARNING: Some log files could not be backed up"
    fi
}

# Upload to S3 (if configured)
upload_to_s3() {
    if [ -n "${S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        log "Uploading backups to S3..."
        
        # Install AWS CLI if not present
        if ! command -v aws &> /dev/null; then
            log "Installing AWS CLI..."
            pip install awscli --quiet || error_exit "Failed to install AWS CLI"
        fi
        
        # Configure AWS CLI
        aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
        aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
        aws configure set default.region "${AWS_DEFAULT_REGION:-us-east-1}"
        
        # Upload database backup
        if aws s3 cp "$BACKUP_DIR/database/" "s3://$S3_BUCKET/database/" --recursive --only-show-errors; then
            log "Database backup uploaded to S3"
        else
            error_notification "Failed to upload database backup to S3"
        fi
        
        # Upload files backup
        if aws s3 cp "$BACKUP_DIR/files/" "s3://$S3_BUCKET/files/" --recursive --only-show-errors; then
            log "Files backup uploaded to S3"
        else
            error_notification "Failed to upload files backup to S3"
        fi
        
        # Upload logs backup
        if aws s3 cp "$BACKUP_DIR/logs/" "s3://$S3_BUCKET/logs/" --recursive --only-show-errors; then
            log "Logs backup uploaded to S3"
        else
            log "WARNING: Failed to upload logs backup to S3"
        fi
        
    else
        log "S3 configuration not found, skipping cloud backup"
    fi
}

# Clean old local backups (retain last 7 days)
cleanup_old_backups() {
    log "Cleaning up old local backups..."
    
    local retention_days=7
    
    # Clean database backups
    find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +$retention_days -delete || true
    
    # Clean files backups
    find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime +$retention_days -delete || true
    
    # Clean logs backups
    find "$BACKUP_DIR/logs" -name "*.tar.gz" -mtime +$retention_days -delete || true
    
    log "Old backups cleanup completed"
}

# Generate backup report
generate_backup_report() {
    log "Generating backup report..."
    
    local report_file="$BACKUP_DIR/barberpro_backup_report_${DATE}.txt"
    
    cat > "$report_file" << EOF
BarberPro Backup Report
======================
Date: $(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')
Backup ID: $DATE
Timezone: $TIMEZONE
Environment: ${NODE_ENV:-production}

Database Backup:
$(ls -lh "$BACKUP_DIR/database/"*"$DATE"* 2>/dev/null || echo "No database backup found")

Files Backup:
$(ls -lh "$BACKUP_DIR/files/"*"$DATE"* 2>/dev/null || echo "No files backup found")

Logs Backup:
$(ls -lh "$BACKUP_DIR/logs/"*"$DATE"* 2>/dev/null || echo "No logs backup found")

Disk Usage:
$(df -h "$BACKUP_DIR")

Argentina Compliance:
- Timezone: $TIMEZONE
- Backup retention: 7 days local, 30 days S3
- Data encryption: In transit (S3)
- Access logging: Enabled

EOF

    log "Backup report generated: $report_file"
}

# Main backup function
main() {
    log "Starting BarberPro backup process..."
    
    # Validate environment
    validate_environment
    
    # Setup backup directory
    setup_backup_directory
    
    # Perform backups
    local backup_success=true
    
    if ! backup_database; then
        backup_success=false
    fi
    
    if ! backup_application_files; then
        backup_success=false
    fi
    
    backup_logs
    
    # Upload to cloud if configured
    upload_to_s3
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate report
    generate_backup_report
    
    if [ "$backup_success" = true ]; then
        success_notification "Backup completed successfully at $(TZ=$TIMEZONE date)"
        log "BarberPro backup process completed successfully"
        exit 0
    else
        error_notification "Backup completed with errors"
        log "BarberPro backup process completed with errors"
        exit 1
    fi
}

# Run main function
main "$@"