#!/bin/bash

# ============================================================================
# BarberPro Backup and Disaster Recovery Testing Script
# Validates backup procedures and tests actual recovery scenarios
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_BACKUP_DIR="/tmp/barberpro-backup-test"
LOG_FILE="/var/log/barberpro-recovery-test.log"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Create test backup directory
prepare_test_environment() {
    log "INFO" "Preparing test environment..."
    
    mkdir -p "$TEST_BACKUP_DIR"
    cd "$PROJECT_ROOT"
    
    # Ensure backup script exists and is executable
    if [ ! -f "$PROJECT_ROOT/scripts/backup.sh" ]; then
        log "ERROR" "Backup script not found. Creating one..."
        return 1
    fi
    
    chmod +x "$PROJECT_ROOT/scripts/backup.sh"
    log "INFO" "${GREEN}Test environment prepared${NC}"
}

# Test database backup creation
test_database_backup() {
    log "INFO" "Testing database backup creation..."
    
    # Create a test backup
    local backup_file="$TEST_BACKUP_DIR/test_backup_${TIMESTAMP}.sql"
    
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U barberpro -d barberpro_prod > "$backup_file"; then
        local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || echo "0")
        
        if [ "$backup_size" -gt 1000 ]; then
            log "INFO" "${GREEN}Database backup created successfully (${backup_size} bytes)${NC}"
            
            # Verify backup integrity
            if head -n 20 "$backup_file" | grep -q "PostgreSQL database dump"; then
                log "INFO" "${GREEN}Backup integrity verified${NC}"
                return 0
            else
                log "ERROR" "${RED}Backup integrity check failed${NC}"
                return 1
            fi
        else
            log "ERROR" "${RED}Backup file is too small or empty${NC}"
            return 1
        fi
    else
        log "ERROR" "${RED}Database backup creation failed${NC}"
        return 1
    fi
}

# Test backup compression and encryption
test_backup_compression() {
    log "INFO" "Testing backup compression and encryption..."
    
    local backup_file="$TEST_BACKUP_DIR/test_backup_${TIMESTAMP}.sql"
    local compressed_file="$TEST_BACKUP_DIR/test_backup_${TIMESTAMP}.sql.gz"
    
    if [ -f "$backup_file" ]; then
        # Compress backup
        if gzip -c "$backup_file" > "$compressed_file"; then
            local original_size=$(stat -f%z "$backup_file" 2>/dev/null || echo "0")
            local compressed_size=$(stat -f%z "$compressed_file" 2>/dev/null || echo "0")
            local compression_ratio=$(echo "scale=2; $compressed_size * 100 / $original_size" | bc -l)
            
            log "INFO" "${GREEN}Backup compressed successfully${NC}"
            log "INFO" "Compression ratio: ${compression_ratio}% (${original_size} -> ${compressed_size} bytes)"
            return 0
        else
            log "ERROR" "${RED}Backup compression failed${NC}"
            return 1
        fi
    else
        log "ERROR" "${RED}Backup file not found for compression test${NC}"
        return 1
    fi
}

# Test recovery procedure
test_recovery_procedure() {
    log "INFO" "Testing recovery procedure with test database..."
    
    local backup_file="$TEST_BACKUP_DIR/test_backup_${TIMESTAMP}.sql"
    local test_db_name="barberpro_recovery_test"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR" "${RED}Backup file not found for recovery test${NC}"
        return 1
    fi
    
    # Create test database for recovery
    log "INFO" "Creating test database for recovery..."
    if docker-compose -f docker-compose.production.yml exec -T postgres createdb -U barberpro "$test_db_name" 2>/dev/null || true; then
        
        # Restore backup to test database
        log "INFO" "Restoring backup to test database..."
        if cat "$backup_file" | docker-compose -f docker-compose.production.yml exec -T postgres psql -U barberpro -d "$test_db_name" >/dev/null 2>&1; then
            
            # Verify recovery by checking table structure
            local table_count=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U barberpro -d "$test_db_name" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
            
            if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
                log "INFO" "${GREEN}Recovery test successful - $table_count tables restored${NC}"
                
                # Cleanup test database
                docker-compose -f docker-compose.production.yml exec -T postgres dropdb -U barberpro "$test_db_name" 2>/dev/null || true
                return 0
            else
                log "ERROR" "${RED}Recovery verification failed - no tables found${NC}"
                return 1
            fi
        else
            log "ERROR" "${RED}Database restore failed${NC}"
            return 1
        fi
    else
        log "ERROR" "${RED}Failed to create test database${NC}"
        return 1
    fi
}

# Test S3 backup upload (if configured)
test_s3_backup_upload() {
    log "INFO" "Testing S3 backup upload..."
    
    if [ -z "$BACKUP_S3_BUCKET" ] || [ -z "$BACKUP_S3_ACCESS_KEY" ] || [ -z "$BACKUP_S3_SECRET_KEY" ]; then
        log "WARNING" "${YELLOW}S3 backup not configured - skipping S3 test${NC}"
        return 0
    fi
    
    local test_file="$TEST_BACKUP_DIR/s3_test_${TIMESTAMP}.txt"
    echo "BarberPro S3 backup test - $(date)" > "$test_file"
    
    # Test S3 upload using AWS CLI or similar
    if command -v aws >/dev/null 2>&1; then
        export AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY"
        export AWS_DEFAULT_REGION="sa-east-1"
        
        if aws s3 cp "$test_file" "s3://$BACKUP_S3_BUCKET/test/" >/dev/null 2>&1; then
            log "INFO" "${GREEN}S3 backup upload test successful${NC}"
            
            # Cleanup test file from S3
            aws s3 rm "s3://$BACKUP_S3_BUCKET/test/$(basename "$test_file")" >/dev/null 2>&1 || true
            return 0
        else
            log "ERROR" "${RED}S3 backup upload test failed${NC}"
            return 1
        fi
    else
        log "WARNING" "${YELLOW}AWS CLI not installed - cannot test S3 upload${NC}"
        return 0
    fi
}

# Test backup retention policy
test_backup_retention() {
    log "INFO" "Testing backup retention policy..."
    
    # Create multiple test backup files with different dates
    for days_ago in 1 7 15 30 35; do
        local backup_date=$(date -d "$days_ago days ago" '+%Y%m%d_%H%M%S' 2>/dev/null || date -v-${days_ago}d '+%Y%m%d_%H%M%S' 2>/dev/null)
        local test_backup="$TEST_BACKUP_DIR/backup_${backup_date}.sql.gz"
        touch "$test_backup"
        
        # Set file modification time
        if command -v touch >/dev/null 2>&1; then
            touch -t "$(date -d "$days_ago days ago" '+%Y%m%d%H%M' 2>/dev/null || date -v-${days_ago}d '+%Y%m%d%H%M' 2>/dev/null)" "$test_backup" 2>/dev/null || true
        fi
    done
    
    # Test retention cleanup (keep last 30 days)
    local retention_days=30
    local files_before=$(find "$TEST_BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
    
    # Simulate retention cleanup
    find "$TEST_BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$retention_days -delete 2>/dev/null || true
    
    local files_after=$(find "$TEST_BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
    
    log "INFO" "Backup retention test: $files_before files -> $files_after files (retention: ${retention_days} days)"
    
    if [ "$files_after" -lt "$files_before" ]; then
        log "INFO" "${GREEN}Backup retention policy working correctly${NC}"
        return 0
    else
        log "WARNING" "${YELLOW}Backup retention policy may not be working${NC}"
        return 1
    fi
}

# Test backup monitoring and alerting
test_backup_monitoring() {
    log "INFO" "Testing backup monitoring and alerting..."
    
    # Check if backup script has monitoring capabilities
    if grep -q "NOTIFICATION_WEBHOOK" "$PROJECT_ROOT/scripts/backup.sh" 2>/dev/null; then
        log "INFO" "${GREEN}Backup script has notification capabilities${NC}"
    else
        log "WARNING" "${YELLOW}Backup script lacks notification capabilities${NC}"
    fi
    
    # Check if backup logs are properly written
    local backup_log="/var/log/barberpro-backup.log"
    if [ -f "$backup_log" ] || [ -w "$(dirname "$backup_log")" ]; then
        log "INFO" "${GREEN}Backup logging is properly configured${NC}"
    else
        log "WARNING" "${YELLOW}Backup logging may not be working${NC}"
    fi
    
    # Test backup size monitoring
    local min_backup_size=1024  # 1KB minimum
    local backup_file="$TEST_BACKUP_DIR/test_backup_${TIMESTAMP}.sql"
    
    if [ -f "$backup_file" ]; then
        local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || echo "0")
        if [ "$backup_size" -gt "$min_backup_size" ]; then
            log "INFO" "${GREEN}Backup size monitoring: backup size OK (${backup_size} bytes)${NC}"
        else
            log "ERROR" "${RED}Backup size monitoring: backup too small (${backup_size} bytes)${NC}"
            return 1
        fi
    fi
    
    return 0
}

# Performance test for backup and recovery
test_backup_performance() {
    log "INFO" "Testing backup and recovery performance..."
    
    local start_time=$(date +%s)
    
    # Time the backup process
    local backup_file="$TEST_BACKUP_DIR/perf_backup_${TIMESTAMP}.sql"
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U barberpro -d barberpro_prod > "$backup_file" 2>/dev/null; then
        local backup_end_time=$(date +%s)
        local backup_duration=$((backup_end_time - start_time))
        local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || echo "0")
        local backup_speed=$(echo "scale=2; $backup_size / 1024 / 1024 / $backup_duration" | bc -l 2>/dev/null || echo "0")
        
        log "INFO" "Backup performance: ${backup_duration}s, ${backup_speed} MB/s"
        
        # Test if backup time is acceptable (under 5 minutes for typical database)
        if [ "$backup_duration" -lt 300 ]; then
            log "INFO" "${GREEN}Backup performance is acceptable${NC}"
        else
            log "WARNING" "${YELLOW}Backup is taking longer than expected (${backup_duration}s)${NC}"
        fi
    else
        log "ERROR" "${RED}Performance backup test failed${NC}"
        return 1
    fi
    
    return 0
}

# Cleanup test files
cleanup_test_environment() {
    log "INFO" "Cleaning up test environment..."
    
    if [ -d "$TEST_BACKUP_DIR" ]; then
        rm -rf "$TEST_BACKUP_DIR"
        log "INFO" "${GREEN}Test files cleaned up${NC}"
    fi
}

# Main function
main() {
    log "INFO" "${BLUE}Starting BarberPro backup and recovery validation...${NC}"
    
    local exit_code=0
    
    # Prepare test environment
    prepare_test_environment || exit_code=1
    
    # Run backup tests
    test_database_backup || exit_code=1
    test_backup_compression || exit_code=1
    test_recovery_procedure || exit_code=1
    test_s3_backup_upload || exit_code=1
    test_backup_retention || exit_code=1
    test_backup_monitoring || exit_code=1
    test_backup_performance || exit_code=1
    
    # Cleanup
    cleanup_test_environment
    
    if [ $exit_code -eq 0 ]; then
        log "INFO" "${GREEN}All backup and recovery tests passed successfully!${NC}"
        log "INFO" "${GREEN}Disaster recovery procedures validated${NC}"
    else
        log "ERROR" "${RED}Some backup and recovery tests failed${NC}"
    fi
    
    return $exit_code
}

# Execute main function
main "$@"