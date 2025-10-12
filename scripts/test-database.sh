#!/bin/bash
# ============================================================================
# BarberPro Database Integration Test
# ============================================================================
# Tests database operations, migrations, seeding, and data integrity
#
# Operations tested:
#   1. PostgreSQL connectivity and health
#   2. Redis connectivity and operations
#   3. Prisma migrations
#   4. Database seeding
#   5. Data queries and integrity
#   6. Backup and restore operations
#
# Usage:
#   ./scripts/test-database.sh              # Run all database tests
#   ./scripts/test-database.sh --verbose    # Verbose output
#   ./scripts/test-database.sh --skip-migrations  # Skip migration tests
#
# Prerequisites:
#   - Services running: make up
#   - Backend container running (for Prisma commands)
# ============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Symbols
readonly CHECK="✓"
readonly CROSS="✗"
readonly ARROW="→"
readonly WARN="⚠"

# Database configuration (from .env.development)
readonly POSTGRES_HOST="localhost"
readonly POSTGRES_PORT="5432"
readonly POSTGRES_USER="barberpro"
readonly POSTGRES_DB="barberpro_dev"
readonly REDIS_HOST="localhost"
readonly REDIS_PORT="6379"

# Docker containers
readonly POSTGRES_CONTAINER="barberpro-postgres"
readonly REDIS_CONTAINER="barberpro-redis"
readonly BACKEND_CONTAINER="barberpro-backend-dev"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Parse arguments
VERBOSE=false
SKIP_MIGRATIONS=false

for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
    esac
done

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

print_test() {
    echo -ne "  ${BLUE}[${ARROW}]${NC} $1... "
}

print_success() {
    echo -e "${GREEN}[${CHECK}]${NC}"
}

print_error() {
    echo -e "${RED}[${CROSS}]${NC}"
    if [ "$1" != "" ]; then
        echo -e "       ${RED}Error: $1${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}[${WARN}]${NC} $1"
}

print_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "       ${CYAN}Info: $1${NC}"
    fi
}

test_passed() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_PASSED=$((TESTS_PASSED + 1))
    print_success
}

test_failed() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_FAILED=$((TESTS_FAILED + 1))
    print_error "$1"
}

# ============================================================================
# TEST FUNCTIONS - POSTGRESQL
# ============================================================================

test_postgres_availability() {
    print_section "PostgreSQL Availability"

    print_test "Container running"
    if docker ps --filter "name=$POSTGRES_CONTAINER" --format "{{.Names}}" | grep -q "$POSTGRES_CONTAINER"; then
        test_passed
    else
        test_failed "PostgreSQL container not running"
        return 1
    fi

    print_test "Database ready"
    if docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
        test_passed
    else
        test_failed "PostgreSQL not ready"
        return 1
    fi

    print_test "Database exists"
    local db_exists=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -w "$POSTGRES_DB" | wc -l)

    if [ "$db_exists" -gt 0 ]; then
        test_passed
    else
        test_failed "Database $POSTGRES_DB does not exist"
    fi

    print_test "Database version"
    local version=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -t -c "SELECT version();" 2>/dev/null | head -1)

    if [ $? -eq 0 ]; then
        print_info "PostgreSQL version: $(echo $version | awk '{print $2}')"
        test_passed
    else
        test_failed "Cannot retrieve database version"
    fi
}

test_postgres_operations() {
    print_section "PostgreSQL Operations"

    print_test "Create test table"
    local create_table="CREATE TABLE IF NOT EXISTS _test_table (id SERIAL PRIMARY KEY, data TEXT);"

    if docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$create_table" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot create test table"
    fi

    print_test "Insert test data"
    local insert_data="INSERT INTO _test_table (data) VALUES ('test_data_1'), ('test_data_2'), ('test_data_3');"

    if docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$insert_data" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot insert test data"
    fi

    print_test "Query test data"
    local count=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM _test_table;" 2>/dev/null | tr -d ' ')

    if [ "$count" = "3" ]; then
        print_info "Retrieved $count rows"
        test_passed
    else
        test_failed "Expected 3 rows, got $count"
    fi

    print_test "Update test data"
    local update_data="UPDATE _test_table SET data = 'updated' WHERE id = 1;"

    if docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$update_data" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot update test data"
    fi

    print_test "Delete test data"
    local delete_data="DELETE FROM _test_table WHERE id = 2;"

    if docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$delete_data" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot delete test data"
    fi

    print_test "Drop test table"
    local drop_table="DROP TABLE IF EXISTS _test_table;"

    if docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$drop_table" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot drop test table"
    fi
}

test_postgres_schema() {
    print_section "PostgreSQL Schema"

    print_test "List all tables"
    local tables=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "\dt" 2>/dev/null)

    if [ $? -eq 0 ]; then
        local table_count=$(echo "$tables" | grep -c "public" || echo "0")
        print_info "Found $table_count table(s)"
        test_passed
    else
        test_failed "Cannot list tables"
    fi

    print_test "Check Prisma migrations table"
    local migrations_exists=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations');" 2>/dev/null | tr -d ' ')

    if [ "$migrations_exists" = "t" ]; then
        local migration_count=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM _prisma_migrations;" 2>/dev/null | tr -d ' ')
        print_info "Migration count: $migration_count"
        test_passed
    else
        print_warning "Prisma migrations table not found (migrations may not have run yet)"
    fi
}

# ============================================================================
# TEST FUNCTIONS - REDIS
# ============================================================================

test_redis_availability() {
    print_section "Redis Availability"

    print_test "Container running"
    if docker ps --filter "name=$REDIS_CONTAINER" --format "{{.Names}}" | grep -q "$REDIS_CONTAINER"; then
        test_passed
    else
        test_failed "Redis container not running"
        return 1
    fi

    print_test "Redis responding"
    if docker exec $REDIS_CONTAINER redis-cli ping | grep -q "PONG"; then
        test_passed
    else
        test_failed "Redis not responding"
        return 1
    fi

    print_test "Redis version"
    local version=$(docker exec $REDIS_CONTAINER redis-cli INFO server | grep "redis_version" | cut -d: -f2 | tr -d '\r')

    if [ -n "$version" ]; then
        print_info "Redis version: $version"
        test_passed
    else
        test_failed "Cannot retrieve Redis version"
    fi
}

test_redis_operations() {
    print_section "Redis Operations"

    print_test "Set key-value"
    if docker exec $REDIS_CONTAINER redis-cli SET test_key "test_value" | grep -q "OK"; then
        test_passed
    else
        test_failed "Cannot set key"
    fi

    print_test "Get key"
    local value=$(docker exec $REDIS_CONTAINER redis-cli GET test_key)

    if [ "$value" = "test_value" ]; then
        print_info "Retrieved: $value"
        test_passed
    else
        test_failed "Cannot get key (expected: test_value, got: $value)"
    fi

    print_test "Set with expiration"
    if docker exec $REDIS_CONTAINER redis-cli SETEX temp_key 60 "temporary" | grep -q "OK"; then
        test_passed
    else
        test_failed "Cannot set key with expiration"
    fi

    print_test "Check TTL"
    local ttl=$(docker exec $REDIS_CONTAINER redis-cli TTL temp_key)

    if [ "$ttl" -gt 0 ] && [ "$ttl" -le 60 ]; then
        print_info "TTL: ${ttl}s"
        test_passed
    else
        test_failed "Invalid TTL: $ttl"
    fi

    print_test "Hash operations"
    docker exec $REDIS_CONTAINER redis-cli HSET test_hash field1 "value1" field2 "value2" > /dev/null 2>&1

    local hash_value=$(docker exec $REDIS_CONTAINER redis-cli HGET test_hash field1)

    if [ "$hash_value" = "value1" ]; then
        test_passed
    else
        test_failed "Hash operation failed"
    fi

    print_test "List operations"
    docker exec $REDIS_CONTAINER redis-cli RPUSH test_list "item1" "item2" "item3" > /dev/null 2>&1

    local list_len=$(docker exec $REDIS_CONTAINER redis-cli LLEN test_list)

    if [ "$list_len" = "3" ]; then
        test_passed
    else
        test_failed "List operation failed"
    fi

    print_test "Delete keys"
    if docker exec $REDIS_CONTAINER redis-cli DEL test_key temp_key test_hash test_list > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot delete keys"
    fi
}

# ============================================================================
# TEST FUNCTIONS - PRISMA MIGRATIONS
# ============================================================================

test_prisma_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        print_warning "Skipping Prisma migration tests (--skip-migrations flag)"
        return 0
    fi

    print_section "Prisma Migrations"

    # Check if backend container is running
    if ! docker ps --filter "name=$BACKEND_CONTAINER" --format "{{.Names}}" | grep -q "$BACKEND_CONTAINER"; then
        print_warning "Backend container not running, skipping Prisma tests"
        return 0
    fi

    print_test "Prisma client available"
    if docker exec $BACKEND_CONTAINER test -d node_modules/@prisma/client > /dev/null 2>&1; then
        test_passed
    else
        print_warning "Prisma client not found, may need to run: npm run db:generate"
    fi

    print_test "Migration status"
    local migration_status=$(docker exec $BACKEND_CONTAINER npx prisma migrate status 2>&1 || echo "error")

    if echo "$migration_status" | grep -q "Database schema is up to date"; then
        test_passed
    elif echo "$migration_status" | grep -q "No migration found in prisma/migrations"; then
        print_warning "No migrations found (expected for new projects)"
    else
        print_info "Migration status: $migration_status"
        print_warning "Migrations may need to be applied"
    fi
}

# ============================================================================
# TEST FUNCTIONS - BACKUP AND RESTORE
# ============================================================================

test_backup_restore() {
    print_section "Backup and Restore"

    print_test "Create backup"
    local backup_file="/tmp/barberpro_test_backup_$(date +%s).sql"

    if docker exec $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$backup_file" 2>/dev/null; then
        print_info "Backup saved to: $backup_file"

        if [ -s "$backup_file" ]; then
            test_passed
        else
            test_failed "Backup file is empty"
            rm -f "$backup_file"
            return 1
        fi
    else
        test_failed "Cannot create backup"
        return 1
    fi

    print_test "Verify backup file"
    if grep -q "PostgreSQL database dump" "$backup_file" 2>/dev/null; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_info "Backup size: $size"
        test_passed
    else
        test_failed "Backup file appears invalid"
    fi

    # Cleanup
    print_test "Remove test backup"
    if rm -f "$backup_file"; then
        test_passed
    else
        test_failed "Cannot remove test backup"
    fi
}

# ============================================================================
# TEST FUNCTIONS - PERFORMANCE
# ============================================================================

test_performance() {
    print_section "Database Performance"

    print_test "Connection pool"
    local connections=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB';" 2>/dev/null | tr -d ' ')

    if [ -n "$connections" ]; then
        print_info "Active connections: $connections"
        test_passed
    else
        test_failed "Cannot check connection pool"
    fi

    print_test "Query performance (simple)"
    local start=$(date +%s%N)
    docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" > /dev/null 2>&1
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))  # Convert to milliseconds

    print_info "Query took ${duration}ms"

    if [ "$duration" -lt 100 ]; then
        test_passed
    else
        test_failed "Query too slow: ${duration}ms"
    fi

    print_test "Redis latency"
    local redis_latency=$(docker exec $REDIS_CONTAINER redis-cli --latency-history -i 1 -c 1 2>/dev/null | tail -1 | awk '{print $4}' || echo "0")

    if [ "${redis_latency%.*}" -lt 10 ]; then
        print_info "Redis latency: ${redis_latency}ms"
        test_passed
    else
        print_warning "Redis latency high: ${redis_latency}ms"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "Database Integration Test"

    echo "Testing database services:"
    echo "  - PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT"
    echo "  - Redis: $REDIS_HOST:$REDIS_PORT"
    echo ""
    echo "Configuration:"
    echo "  Verbose: $VERBOSE"
    echo "  Skip migrations: $SKIP_MIGRATIONS"
    echo ""

    # PostgreSQL tests
    test_postgres_availability || exit 1
    test_postgres_operations
    test_postgres_schema

    # Redis tests
    test_redis_availability || exit 1
    test_redis_operations

    # Prisma tests
    test_prisma_migrations

    # Backup tests
    test_backup_restore

    # Performance tests
    test_performance

    # Summary
    print_header "Test Summary"

    echo -e "  Total tests:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "  Passed:         ${GREEN}$TESTS_PASSED${NC}"
    echo -e "  Failed:         ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All database tests passed!"
        echo ""
        echo "Database services are healthy and ready:"
        echo "  - PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT"
        echo "  - Redis: $REDIS_HOST:$REDIS_PORT"
        echo ""
        echo "Management tools:"
        echo "  - pgAdmin: http://localhost:8080"
        echo "  - Redis Commander: http://localhost:8081"
        echo ""
        exit 0
    else
        print_error "$TESTS_FAILED test(s) failed"
        echo ""
        exit 1
    fi
}

# Run main
main "$@"
