#!/bin/bash

# BarberPro Production Restore Script
# Optimized for Argentina compliance and Railway deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/backup"
LOG_FILE="/var/log/barberpro-restore.log"
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

# Display usage
usage() {
    cat << EOF
BarberPro Restore Script

Usage: $0 [OPTIONS] BACKUP_DATE

OPTIONS:
    -d, --database-only     Restore only database
    -f, --files-only        Restore only application files
    -s, --from-s3          Download backup from S3 first
    -y, --yes              Skip confirmation prompts
    -h, --help             Show this help message

BACKUP_DATE:
    Format: YYYYMMDD_HHMMSS (e.g., 20241210_020000)
    Use 'latest' for the most recent backup

Examples:
    $0 20241210_020000                 # Restore full backup
    $0 -d latest                       # Restore only database from latest backup
    $0 -s -f 20241210_020000          # Download from S3 and restore files only
    $0 -y latest                       # Restore latest backup without prompts

Environment Variables:
    S3_BUCKET              S3 bucket name for cloud backups
    AWS_ACCESS_KEY_ID      AWS access key
    AWS_SECRET_ACCESS_KEY  AWS secret key
    POSTGRES_USER          Database username
    POSTGRES_PASSWORD      Database password
    POSTGRES_DB            Database name

EOF
}

# Parse command line arguments
parse_arguments() {
    DATABASE_ONLY=false
    FILES_ONLY=false
    FROM_S3=false
    SKIP_CONFIRMATION=false
    BACKUP_DATE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--database-only)
                DATABASE_ONLY=true
                shift
                ;;
            -f|--files-only)
                FILES_ONLY=true
                shift
                ;;
            -s|--from-s3)
                FROM_S3=true
                shift
                ;;
            -y|--yes)
                SKIP_CONFIRMATION=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                if [[ -z "$BACKUP_DATE" ]]; then
                    BACKUP_DATE="$1"
                else
                    error_exit "Unknown option: $1"
                fi
                shift
                ;;
        esac
    done
    
    if [[ -z "$BACKUP_DATE" ]]; then
        error_exit "Backup date is required. Use --help for usage information."
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
    
    if [[ "$FROM_S3" == true ]]; then
        s3_vars=("S3_BUCKET" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
        for var in "${s3_vars[@]}"; do
            if [ -z "${!var:-}" ]; then
                error_exit "S3 restore requires environment variable $var"
            fi
        done
    fi
    
    log "Environment validation completed"
}

# Find latest backup
find_latest_backup() {
    log "Finding latest backup..."
    
    local latest_db_backup=$(ls -1 "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null | sort -r | head -n1 || true)
    
    if [[ -n "$latest_db_backup" ]]; then
        # Extract date from filename
        local filename=$(basename "$latest_db_backup")
        BACKUP_DATE=$(echo "$filename" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
        log "Latest backup found: $BACKUP_DATE"
    else
        error_exit "No backups found in $BACKUP_DIR/database/"
    fi
}

# Download backup from S3
download_from_s3() {
    log "Downloading backup from S3..."
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        log "Installing AWS CLI..."
        pip install awscli --quiet || error_exit "Failed to install AWS CLI"
    fi
    
    # Configure AWS CLI
    aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
    aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
    aws configure set default.region "${AWS_DEFAULT_REGION:-us-east-1}"
    
    # Create backup directory structure
    mkdir -p "$BACKUP_DIR"/{database,files,logs}
    
    # Download database backup
    if [[ "$FILES_ONLY" != true ]]; then
        if aws s3 cp "s3://$S3_BUCKET/database/barberpro_db_${BACKUP_DATE}.sql.gz" "$BACKUP_DIR/database/" --only-show-errors; then
            log "Database backup downloaded from S3"
        else
            error_exit "Failed to download database backup from S3"
        fi
    fi
    
    # Download files backup
    if [[ "$DATABASE_ONLY" != true ]]; then
        if aws s3 cp "s3://$S3_BUCKET/files/barberpro_files_${BACKUP_DATE}.tar.gz" "$BACKUP_DIR/files/" --only-show-errors; then
            log "Files backup downloaded from S3"
        else
            error_exit "Failed to download files backup from S3"
        fi
    fi
}

# Verify backup files exist
verify_backup_files() {
    log "Verifying backup files..."
    
    if [[ "$FILES_ONLY" != true ]]; then
        local db_backup="$BACKUP_DIR/database/barberpro_db_${BACKUP_DATE}.sql.gz"
        if [[ ! -f "$db_backup" ]]; then
            error_exit "Database backup file not found: $db_backup"
        fi
        
        # Verify integrity
        if ! gunzip -t "$db_backup" 2>/dev/null; then
            error_exit "Database backup file is corrupted: $db_backup"
        fi
        
        log "Database backup file verified: $db_backup"
    fi
    
    if [[ "$DATABASE_ONLY" != true ]]; then
        local files_backup="$BACKUP_DIR/files/barberpro_files_${BACKUP_DATE}.tar.gz"
        if [[ ! -f "$files_backup" ]]; then
            error_exit "Files backup file not found: $files_backup"
        fi
        
        # Verify integrity
        if ! tar -tzf "$files_backup" >/dev/null 2>&1; then
            error_exit "Files backup file is corrupted: $files_backup"
        fi
        
        log "Files backup file verified: $files_backup"
    fi
}

# Confirmation prompt
confirm_restore() {
    if [[ "$SKIP_CONFIRMATION" == true ]]; then
        return 0
    fi
    
    echo
    echo "========================================"
    echo "BarberPro Restore Confirmation"
    echo "========================================"
    echo "Backup Date: $BACKUP_DATE"
    echo "Timezone: $TIMEZONE"
    echo "Current Time: $(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')"
    echo
    
    if [[ "$DATABASE_ONLY" == true ]]; then
        echo "Operation: Database restore only"
    elif [[ "$FILES_ONLY" == true ]]; then
        echo "Operation: Files restore only"
    else
        echo "Operation: Full restore (database + files)"
    fi
    
    echo
    echo "WARNING: This operation will overwrite existing data!"
    echo
    read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        log "Restore operation cancelled by user"
        exit 0
    fi
}

# Stop application services
stop_services() {
    log "Stopping application services..."
    
    # Stop the application gracefully
    if command -v docker-compose &> /dev/null; then
        docker-compose stop backend || log "WARNING: Could not stop backend service"
    fi
    
    # Give services time to stop
    sleep 5
    
    log "Services stopped"
}

# Start application services
start_services() {
    log "Starting application services..."
    
    # Start the application
    if command -v docker-compose &> /dev/null; then
        docker-compose start backend || log "WARNING: Could not start backend service"
    fi
    
    # Wait for services to be ready
    sleep 10
    
    log "Services started"
}

# Restore database
restore_database() {
    log "Starting database restore..."
    
    local db_backup="$BACKUP_DIR/database/barberpro_db_${BACKUP_DATE}.sql.gz"
    
    # Set PostgreSQL connection parameters
    export PGPASSWORD="$POSTGRES_PASSWORD"
    export PGTZ="$TIMEZONE"
    
    # Create a backup of current database before restore
    log "Creating safety backup of current database..."
    local safety_backup="/tmp/barberpro_safety_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    pg_dump \
        --host=postgres \
        --port=5432 \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --no-password \
        --file="$safety_backup" || log "WARNING: Could not create safety backup"
    
    # Drop and recreate database
    log "Dropping and recreating database..."
    
    dropdb \
        --host=postgres \
        --port=5432 \
        --username="$POSTGRES_USER" \
        --no-password \
        "$POSTGRES_DB" 2>/dev/null || true
    
    createdb \
        --host=postgres \
        --port=5432 \
        --username="$POSTGRES_USER" \
        --no-password \
        --encoding=UTF8 \
        --locale=es_AR.UTF-8 \
        --template=template0 \
        "$POSTGRES_DB"
    
    # Restore database from backup
    log "Restoring database from backup..."
    
    if gunzip -c "$db_backup" | psql \
        --host=postgres \
        --port=5432 \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --no-password \
        --quiet 2>&1 | tee -a "$LOG_FILE"; then
        
        log "Database restore completed successfully"
        
        # Verify database integrity
        local table_count=$(psql \
            --host=postgres \
            --port=5432 \
            --username="$POSTGRES_USER" \
            --dbname="$POSTGRES_DB" \
            --no-password \
            --quiet \
            --tuples-only \
            --command="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
        
        log "Database verification: $table_count tables restored"
        
        # Clean up safety backup if restore was successful
        rm -f "$safety_backup"
        
        return 0
    else
        error_exit "Database restore failed. Safety backup available at: $safety_backup"
    fi
}

# Restore application files
restore_files() {
    log "Starting files restore..."
    
    local files_backup="$BACKUP_DIR/files/barberpro_files_${BACKUP_DATE}.tar.gz"
    
    # Create safety backup of current files
    log "Creating safety backup of current files..."
    local safety_backup="/tmp/barberpro_files_safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    tar -czf "$safety_backup" \
        /app/uploads \
        /app/config \
        /app/.env.production 2>/dev/null || log "WARNING: Could not create complete files safety backup"
    
    # Restore files from backup
    log "Restoring files from backup..."
    
    if tar -xzf "$files_backup" -C / 2>&1 | tee -a "$LOG_FILE"; then
        log "Files restore completed successfully"
        
        # Set proper permissions
        chown -R barberpro:barberpro /app/uploads 2>/dev/null || true
        chmod -R 755 /app/uploads 2>/dev/null || true
        
        # Clean up safety backup if restore was successful
        rm -f "$safety_backup"
        
        return 0
    else
        error_exit "Files restore failed. Safety backup available at: $safety_backup"
    fi
}

# Post-restore operations
post_restore_operations() {
    log "Running post-restore operations..."
    
    # Run database migrations if necessary
    if [[ "$FILES_ONLY" != true ]]; then
        log "Running database migrations..."
        cd /app && npm run db:migrate 2>&1 | tee -a "$LOG_FILE" || log "WARNING: Migration may have failed"
    fi
    
    # Clear application cache
    if [[ "$DATABASE_ONLY" != true ]]; then
        log "Clearing application cache..."
        rm -rf /app/node_modules/.cache 2>/dev/null || true
        rm -rf /tmp/barberpro-* 2>/dev/null || true
    fi
    
    log "Post-restore operations completed"
}

# Generate restore report
generate_restore_report() {
    log "Generating restore report..."
    
    local report_file="/tmp/barberpro_restore_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
BarberPro Restore Report
========================
Date: $(TZ=$TIMEZONE date '+%Y-%m-%d %H:%M:%S %Z')
Backup Date: $BACKUP_DATE
Timezone: $TIMEZONE
Environment: ${NODE_ENV:-production}

Restore Type:
$(if [[ "$DATABASE_ONLY" == true ]]; then echo "- Database only"; elif [[ "$FILES_ONLY" == true ]]; then echo "- Files only"; else echo "- Full restore (database + files)"; fi)

Source:
$(if [[ "$FROM_S3" == true ]]; then echo "- S3 bucket: $S3_BUCKET"; else echo "- Local backup directory"; fi)

Argentina Compliance:
- Timezone: $TIMEZONE
- Data restore verification: Completed
- Access logging: Enabled

Database Status:
$(if [[ "$FILES_ONLY" != true ]]; then psql --host=postgres --port=5432 --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --no-password --quiet --tuples-only --command="SELECT 'Connected, ' || COUNT(*) || ' tables available' FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "Database connection failed"; else echo "Not restored"; fi)

Files Status:
$(if [[ "$DATABASE_ONLY" != true ]]; then echo "Restored to /app/"; else echo "Not restored"; fi)

EOF

    log "Restore report generated: $report_file"
    cat "$report_file"
}

# Main restore function
main() {
    log "Starting BarberPro restore process..."
    
    # Parse arguments
    parse_arguments "$@"
    
    # Handle 'latest' backup date
    if [[ "$BACKUP_DATE" == "latest" ]]; then
        find_latest_backup
    fi
    
    log "Restore configuration: Backup date=$BACKUP_DATE, Database only=$DATABASE_ONLY, Files only=$FILES_ONLY, From S3=$FROM_S3"
    
    # Validate environment
    validate_environment
    
    # Download from S3 if requested
    if [[ "$FROM_S3" == true ]]; then
        download_from_s3
    fi
    
    # Verify backup files exist
    verify_backup_files
    
    # Confirmation
    confirm_restore
    
    # Stop services
    stop_services
    
    # Perform restore operations
    local restore_success=true
    
    if [[ "$FILES_ONLY" != true ]]; then
        if ! restore_database; then
            restore_success=false
        fi
    fi
    
    if [[ "$DATABASE_ONLY" != true ]]; then
        if ! restore_files; then
            restore_success=false
        fi
    fi
    
    # Post-restore operations
    if [[ "$restore_success" == true ]]; then
        post_restore_operations
    fi
    
    # Start services
    start_services
    
    # Generate report
    generate_restore_report
    
    if [[ "$restore_success" == true ]]; then
        log "BarberPro restore process completed successfully"
        exit 0
    else
        log "BarberPro restore process completed with errors"
        exit 1
    fi
}

# Run main function
main "$@"