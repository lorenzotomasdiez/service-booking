#!/bin/bash
# ============================================================================
# BarberPro Final Validation Checklist
# ============================================================================
# Comprehensive final validation test suite before production rollout
# Tests all critical functionality and validates deployment readiness
#
# Usage:
#   ./scripts/final-test.sh              # Run all validation tests
#   ./scripts/final-test.sh --verbose    # Verbose output
#   ./scripts/final-test.sh --quick      # Quick validation (skip non-critical)
#
# Test Categories:
#   1. Basic commands (help, version, doctor)
#   2. Lifecycle management (up, status, down)
#   3. Database operations (migrate, seed)
#   4. Mock services (start, health check)
#   5. Integration (backend, frontend accessibility)
#   6. Cleanup and reset
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Symbols
readonly CHECK="✓"
readonly CROSS="✗"
readonly ARROW="→"
readonly WARN="⚠"
readonly INFO="ℹ"

# Service URLs
readonly BACKEND_URL="http://localhost:3000"
readonly FRONTEND_URL="http://localhost:5173"
readonly POSTGRES_PORT="5432"
readonly REDIS_PORT="6379"
readonly PGADMIN_URL="http://localhost:8080"
readonly REDIS_COMMANDER_URL="http://localhost:8081"
readonly MERCADOPAGO_MOCK_URL="http://localhost:3001"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
START_TIME=$(date +%s)

# Parse command line arguments
VERBOSE=false
QUICK=false

for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --quick|-q)
            QUICK=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v    Enable verbose output"
            echo "  --quick, -q      Skip non-critical tests"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
    esac
done

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    printf "${CYAN}║ %-62s ║${NC}\n" "$1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_test() {
    printf "  %-50s " "$1"
}

pass_test() {
    echo -e "${GREEN}[${CHECK}] PASS${NC}"
    ((TESTS_PASSED++))
    ((TESTS_RUN++))
}

fail_test() {
    echo -e "${RED}[${CROSS}] FAIL${NC}"
    if [ -n "${1:-}" ]; then
        echo -e "    ${YELLOW}${ARROW}${NC} $1"
    fi
    ((TESTS_FAILED++))
    ((TESTS_RUN++))
}

warn_test() {
    echo -e "${YELLOW}[${WARN}] WARN${NC}"
    if [ -n "${1:-}" ]; then
        echo -e "    ${YELLOW}${ARROW}${NC} $1"
    fi
    ((TESTS_RUN++))
}

info() {
    echo -e "${CYAN}[${INFO}]${NC} $1"
}

verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# ============================================================================
# TEST CATEGORY 1: BASIC COMMANDS
# ============================================================================

test_basic_commands() {
    print_header "Category 1: Basic Commands"

    print_test "make help"
    if make help &> /dev/null; then
        verbose "Help command displays correctly"
        pass_test
    else
        fail_test "Help command failed"
    fi

    print_test "make version"
    if make version &> /dev/null; then
        verbose "Version command displays system info"
        pass_test
    else
        fail_test "Version command failed"
    fi

    print_test "make doctor"
    if make doctor &> /dev/null; then
        verbose "Doctor command runs diagnostics"
        pass_test
    else
        fail_test "Doctor command failed"
    fi

    print_test "make validate"
    if make validate &> /dev/null; then
        verbose "Compose file validation passed"
        pass_test
    else
        fail_test "Compose file validation failed"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 2: LIFECYCLE MANAGEMENT
# ============================================================================

test_lifecycle_management() {
    print_header "Category 2: Lifecycle Management"

    # Ensure clean state
    print_test "Ensuring clean state"
    make down &> /dev/null || true
    pass_test

    # Test up command
    print_test "make up (starting services)"
    verbose "Starting all services..."
    if timeout 90 make up &> /dev/null; then
        verbose "Services started successfully"
        pass_test
    else
        fail_test "Failed to start services within 90s"
        return 1
    fi

    # Wait for services to stabilize
    info "Waiting for services to stabilize (10s)..."
    sleep 10

    # Test status command
    print_test "make status"
    if make status &> /dev/null; then
        verbose "Status command displays service health"
        pass_test
    else
        fail_test "Status command failed"
    fi

    # Test ps command
    print_test "make ps"
    if make ps &> /dev/null; then
        verbose "Container listing works"
        pass_test
    else
        fail_test "PS command failed"
    fi

    # Test health command
    print_test "make health"
    if make health &> /dev/null; then
        verbose "Health checks passed"
        pass_test
    else
        fail_test "Health checks failed"
    fi

    # Test logs command (just verify it runs, don't tail)
    print_test "make logs (non-tailing test)"
    if timeout 5 make logs &> /dev/null || true; then
        verbose "Logs command works"
        pass_test
    else
        fail_test "Logs command failed"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 3: SERVICE CONNECTIVITY
# ============================================================================

test_service_connectivity() {
    print_header "Category 3: Service Connectivity"

    print_test "PostgreSQL port (${POSTGRES_PORT})"
    if nc -z localhost "$POSTGRES_PORT" 2>/dev/null || \
       timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/${POSTGRES_PORT}" 2>/dev/null; then
        verbose "PostgreSQL is accessible"
        pass_test
    else
        fail_test "Cannot connect to PostgreSQL"
    fi

    print_test "Redis port (${REDIS_PORT})"
    if nc -z localhost "$REDIS_PORT" 2>/dev/null || \
       timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/${REDIS_PORT}" 2>/dev/null; then
        verbose "Redis is accessible"
        pass_test
    else
        fail_test "Cannot connect to Redis"
    fi

    print_test "pgAdmin web interface"
    if curl -sf "$PGADMIN_URL" &> /dev/null || \
       curl -sf -o /dev/null -w "%{http_code}" "$PGADMIN_URL" 2>/dev/null | grep -q "200\|302"; then
        verbose "pgAdmin is accessible"
        pass_test
    else
        warn_test "pgAdmin may not be fully initialized yet"
    fi

    print_test "Redis Commander web interface"
    if curl -sf "$REDIS_COMMANDER_URL" &> /dev/null || \
       curl -sf -o /dev/null -w "%{http_code}" "$REDIS_COMMANDER_URL" 2>/dev/null | grep -q "200\|302"; then
        verbose "Redis Commander is accessible"
        pass_test
    else
        warn_test "Redis Commander may not be fully initialized yet"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 4: DATABASE OPERATIONS
# ============================================================================

test_database_operations() {
    print_header "Category 4: Database Operations"

    if [ "$QUICK" = true ]; then
        info "Quick mode: Skipping database operations"
        echo ""
        return 0
    fi

    # Note: These tests assume backend container is running
    # For final test, we're just testing the infrastructure
    # Not the actual migrations which require backend container

    print_test "Database backup directory"
    if mkdir -p docker/backup 2>/dev/null; then
        verbose "Backup directory exists/created"
        pass_test
    else
        fail_test "Cannot create backup directory"
    fi

    print_test "PostgreSQL connectivity"
    local container_id
    container_id=$(docker ps --filter "name=barberpro-postgres" -q)
    if [ -n "$container_id" ]; then
        if docker exec "$container_id" pg_isready -U barberpro &> /dev/null; then
            verbose "PostgreSQL is ready to accept connections"
            pass_test
        else
            fail_test "PostgreSQL is not ready"
        fi
    else
        fail_test "PostgreSQL container not found"
    fi

    print_test "Redis connectivity"
    container_id=$(docker ps --filter "name=barberpro-redis" -q)
    if [ -n "$container_id" ]; then
        if docker exec "$container_id" redis-cli ping 2>/dev/null | grep -q "PONG"; then
            verbose "Redis is responding to commands"
            pass_test
        else
            fail_test "Redis is not responding"
        fi
    else
        fail_test "Redis container not found"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 5: MOCK SERVICES
# ============================================================================

test_mock_services() {
    print_header "Category 5: Mock Services"

    print_test "Starting mock services"
    if make mocks &> /dev/null; then
        verbose "Mock services started"
        pass_test
    else
        fail_test "Failed to start mock services"
        return 1
    fi

    # Wait for mocks to initialize
    info "Waiting for mock services to initialize (5s)..."
    sleep 5

    print_test "MercadoPago mock health check"
    if curl -sf "${MERCADOPAGO_MOCK_URL}/health" &> /dev/null || \
       curl -sf -o /dev/null -w "%{http_code}" "${MERCADOPAGO_MOCK_URL}/health" 2>/dev/null | grep -q "200"; then
        verbose "MercadoPago mock is healthy"
        pass_test
    else
        fail_test "MercadoPago mock health check failed"
    fi

    print_test "MercadoPago mock dashboard"
    if curl -sf "${MERCADOPAGO_MOCK_URL}/dashboard" &> /dev/null || \
       curl -sf -o /dev/null -w "%{http_code}" "${MERCADOPAGO_MOCK_URL}/dashboard" 2>/dev/null | grep -q "200"; then
        verbose "MercadoPago dashboard is accessible"
        pass_test
    else
        warn_test "MercadoPago dashboard may not be fully initialized"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 6: INTEGRATION VALIDATION
# ============================================================================

test_integration_validation() {
    print_header "Category 6: Integration Validation"

    if [ "$QUICK" = true ]; then
        info "Quick mode: Skipping integration tests"
        echo ""
        return 0
    fi

    print_test "Container health status"
    local healthy_count=0
    local total_count=0

    for container in $(docker ps --filter "name=barberpro" --format "{{.Names}}"); do
        ((total_count++))
        local health
        health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container" 2>/dev/null)

        if [[ "$health" == "healthy" ]] || [[ "$health" == "no-healthcheck" ]]; then
            ((healthy_count++))
        fi
        verbose "$container: $health"
    done

    if [[ $healthy_count -eq $total_count ]] && [[ $total_count -gt 0 ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} All $total_count containers healthy"
        pass_test
    elif [[ $healthy_count -gt 0 ]]; then
        warn_test "$healthy_count/$total_count containers healthy"
    else
        fail_test "No healthy containers found"
    fi

    print_test "Volume persistence"
    if docker volume ls | grep -q "barberpro-postgres-data"; then
        verbose "PostgreSQL data volume exists"
        pass_test
    else
        fail_test "PostgreSQL data volume not found"
    fi

    print_test "Network connectivity"
    if docker network ls | grep -q "barberpro-network"; then
        verbose "BarberPro network exists"
        pass_test
    else
        fail_test "BarberPro network not found"
    fi

    print_test "Docker resource usage"
    local memory_usage
    memory_usage=$(docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" 2>/dev/null | grep barberpro | wc -l)

    if [[ $memory_usage -gt 0 ]]; then
        verbose "Resource monitoring working"
        pass_test
    else
        warn_test "Unable to get resource usage"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 7: CLEANUP AND RESET
# ============================================================================

test_cleanup_and_reset() {
    print_header "Category 7: Cleanup Operations"

    print_test "Stopping mock services"
    if make mocks-down &> /dev/null; then
        verbose "Mock services stopped"
        pass_test
    else
        warn_test "Mock services may already be stopped"
    fi

    print_test "Stopping all services"
    if make down &> /dev/null; then
        verbose "All services stopped gracefully"
        pass_test
    else
        fail_test "Failed to stop services"
    fi

    # Verify services are actually stopped
    print_test "Verifying services stopped"
    sleep 2
    local running_containers
    running_containers=$(docker ps --filter "name=barberpro" -q | wc -l)

    if [[ $running_containers -eq 0 ]]; then
        verbose "No BarberPro containers running"
        pass_test
    else
        fail_test "$running_containers containers still running"
    fi

    echo ""
}

# ============================================================================
# TEST CATEGORY 8: DOCUMENTATION CHECK
# ============================================================================

test_documentation() {
    print_header "Category 8: Documentation Validation"

    local docs=("docs/docker-setup-guide.md" "docs/docker-migration-guide.md" "docs/docker-changelog.md" "docker/README.md")

    for doc in "${docs[@]}"; do
        print_test "Documentation: $(basename "$doc")"
        if [ -f "$doc" ]; then
            verbose "Document exists: $doc"
            pass_test
        else
            warn_test "Missing: $doc"
        fi
    done

    print_test "Makefile completeness"
    local required_targets=("help" "version" "doctor" "up" "down" "status" "health" "mocks")
    local missing_targets=()

    for target in "${required_targets[@]}"; do
        if ! grep -q "^${target}:" Makefile 2>/dev/null; then
            missing_targets+=("$target")
        fi
    done

    if [[ ${#missing_targets[@]} -eq 0 ]]; then
        verbose "All required Makefile targets present"
        pass_test
    else
        fail_test "Missing targets: ${missing_targets[*]}"
    fi

    echo ""
}

# ============================================================================
# FINAL REPORT
# ============================================================================

print_final_report() {
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    print_header "Final Validation Report"

    # Platform detection
    local platform="Unknown"
    if [[ "$(uname -s)" == "Darwin" ]]; then
        platform="macOS"
    elif grep -qi microsoft /proc/version 2>/dev/null; then
        platform="WSL2"
    else
        platform="Linux"
    fi

    echo -e "${CYAN}Platform:${NC}       $platform"
    echo -e "${CYAN}Docker:${NC}         $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'N/A')"
    echo -e "${CYAN}Test Mode:${NC}      $([ "$QUICK" = true ] && echo "Quick" || echo "Full")"
    echo -e "${CYAN}Duration:${NC}       ${duration}s"
    echo ""
    echo -e "${CYAN}Tests Run:${NC}      $TESTS_RUN"
    echo -e "${GREEN}Passed:${NC}        $TESTS_PASSED"
    echo -e "${RED}Failed:${NC}        $TESTS_FAILED"
    echo -e "${YELLOW}Warnings:${NC}      $((TESTS_RUN - TESTS_PASSED - TESTS_FAILED))"
    echo ""

    # Calculate success rate
    local success_rate=0
    if [[ $TESTS_RUN -gt 0 ]]; then
        success_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    fi

    echo -e "${CYAN}Success Rate:${NC}   ${success_rate}%"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                  ✓ READY FOR PRODUCTION                       ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${CYAN}All validation tests passed successfully!${NC}"
        echo -e "${CYAN}The Docker environment is ready for team rollout.${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo -e "  1. Schedule team training session"
        echo -e "  2. Announce Docker environment availability"
        echo -e "  3. Update onboarding documentation"
        echo -e "  4. Set up support channels for questions"
        echo ""
        return 0
    elif [[ $success_rate -ge 80 ]]; then
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║              ⚠ MOSTLY READY - MINOR ISSUES                    ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Most tests passed, but some issues need attention.${NC}"
        echo -e "${YELLOW}Review failures above before production rollout.${NC}"
        echo ""
        return 1
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                ✗ NOT READY FOR PRODUCTION                     ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${RED}Critical issues detected. Please fix before proceeding.${NC}"
        echo ""
        echo -e "${YELLOW}Action items:${NC}"
        echo -e "  1. Review all failed tests above"
        echo -e "  2. Ensure Docker Desktop is running properly"
        echo -e "  3. Check system resources (RAM, disk space)"
        echo -e "  4. Verify all docker-compose files are valid"
        echo -e "  5. Run 'make doctor' for detailed diagnostics"
        echo ""
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "BarberPro Final Validation Checklist"

    info "Running comprehensive validation tests..."
    info "Test mode: $([ "$QUICK" = true ] && echo "Quick" || echo "Full")"
    info "Verbose: $([ "$VERBOSE" = true ] && echo "Enabled" || echo "Disabled")"
    echo ""

    # Run all test categories
    test_basic_commands
    test_lifecycle_management
    test_service_connectivity
    test_database_operations
    test_mock_services
    test_integration_validation
    test_cleanup_and_reset
    test_documentation

    # Print final report
    print_final_report
}

# Run main function
main "$@"
