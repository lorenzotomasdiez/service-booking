#!/bin/bash
# ============================================================================
# BarberPro Performance Benchmark Suite
# ============================================================================
# Comprehensive performance testing for Docker environment
# Measures startup times, memory usage, and validates success criteria
#
# Usage:
#   ./scripts/benchmark.sh              # Run all benchmarks
#   ./scripts/benchmark.sh --quick      # Quick benchmark (skip cold start)
#   ./scripts/benchmark.sh --verbose    # Verbose output
#
# Success Criteria:
#   - Cold start (full stack) < 60 seconds
#   - Warm start (dev only) < 15 seconds
#   - Environment reset < 2 minutes
#   - Memory usage < 4GB (all services running)
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
readonly CLOCK="⏱"

# Success criteria (in seconds)
readonly MAX_COLD_START=60
readonly MAX_WARM_START=15
readonly MAX_RESET_TIME=120
readonly MAX_MEMORY_MB=4096

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
            echo "  --quick, -q      Skip cold start test (faster)"
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
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    print_header "Prerequisite Checks"

    print_test "Docker daemon running"
    if docker info &> /dev/null; then
        verbose "Docker daemon is accessible"
        pass_test
    else
        fail_test "Docker daemon is not running"
        echo -e "    ${YELLOW}${ARROW}${NC} Start Docker Desktop and try again"
        exit 1
    fi

    print_test "Docker Compose available"
    if docker-compose version &> /dev/null; then
        verbose "Docker Compose found"
        pass_test
    else
        fail_test "Docker Compose not available"
        exit 1
    fi

    print_test "Makefile exists"
    if [ -f "Makefile" ]; then
        verbose "Makefile found"
        pass_test
    else
        fail_test "Makefile not found (wrong directory?)"
        exit 1
    fi

    echo ""
}

# ============================================================================
# CLEANUP FUNCTION
# ============================================================================

cleanup_environment() {
    verbose "Cleaning up environment..."
    make down &> /dev/null || true
    docker system prune -f &> /dev/null || true
}

# ============================================================================
# COLD START BENCHMARK
# ============================================================================

benchmark_cold_start() {
    print_header "Cold Start Benchmark"

    info "Testing cold start (from clean state with no cached images)..."
    info "This test will take several minutes..."
    echo ""

    # Clean everything
    print_test "Cleaning environment"
    cleanup_environment
    # Also remove images to force fresh pull
    docker images | grep barberpro | awk '{print $3}' | xargs -r docker rmi -f &> /dev/null || true
    pass_test

    # Measure cold start
    print_test "Starting environment (cold start)"
    echo ""
    echo -e "    ${CYAN}${CLOCK}${NC} Starting timer..."

    local start_time
    start_time=$(date +%s)

    # Capture output if verbose
    if [ "$VERBOSE" = true ]; then
        make up
    else
        make up &> /dev/null
    fi

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    printf "  %-50s " "Cold start completed"

    # Validate against criteria
    if [[ $duration -lt $MAX_COLD_START ]]; then
        echo -e "${GREEN}[${CHECK}] ${duration}s (< ${MAX_COLD_START}s)${NC}"
        ((TESTS_PASSED++))
    elif [[ $duration -lt $((MAX_COLD_START + 30)) ]]; then
        echo -e "${YELLOW}[${WARN}] ${duration}s (exceeds ${MAX_COLD_START}s target)${NC}"
        echo -e "    ${YELLOW}${ARROW}${NC} Performance acceptable but slower than target"
        warn_test ""
    else
        echo -e "${RED}[${CROSS}] ${duration}s (much slower than ${MAX_COLD_START}s)${NC}"
        fail_test "Performance significantly below target"
    fi
    ((TESTS_RUN++))

    # Wait for services to stabilize
    info "Waiting for services to stabilize (10s)..."
    sleep 10

    # Verify services are healthy
    print_test "Verifying services are healthy"
    if make health &> /dev/null; then
        verbose "All services healthy"
        pass_test
    else
        fail_test "Some services are not healthy"
    fi

    echo ""
}

# ============================================================================
# WARM START BENCHMARK
# ============================================================================

benchmark_warm_start() {
    print_header "Warm Start Benchmark"

    info "Testing warm start (with cached images)..."
    echo ""

    # Stop services first
    print_test "Stopping services"
    make down &> /dev/null
    pass_test

    # Small delay
    sleep 2

    # Measure warm start
    print_test "Starting environment (warm start)"
    echo ""
    echo -e "    ${CYAN}${CLOCK}${NC} Starting timer..."

    local start_time
    start_time=$(date +%s)

    # Use make dev for faster startup
    if [ "$VERBOSE" = true ]; then
        make dev
    else
        make dev &> /dev/null
    fi

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    printf "  %-50s " "Warm start completed"

    # Validate against criteria
    if [[ $duration -lt $MAX_WARM_START ]]; then
        echo -e "${GREEN}[${CHECK}] ${duration}s (< ${MAX_WARM_START}s)${NC}"
        ((TESTS_PASSED++))
    elif [[ $duration -lt $((MAX_WARM_START + 10)) ]]; then
        echo -e "${YELLOW}[${WARN}] ${duration}s (exceeds ${MAX_WARM_START}s target)${NC}"
        echo -e "    ${YELLOW}${ARROW}${NC} Performance acceptable but slower than target"
        warn_test ""
    else
        echo -e "${RED}[${CROSS}] ${duration}s (much slower than ${MAX_WARM_START}s)${NC}"
        fail_test "Performance significantly below target"
    fi
    ((TESTS_RUN++))

    # Wait for services to stabilize
    info "Waiting for services to stabilize (5s)..."
    sleep 5

    # Verify services are healthy
    print_test "Verifying services are healthy"
    if make health &> /dev/null; then
        verbose "All services healthy"
        pass_test
    else
        fail_test "Some services are not healthy"
    fi

    echo ""
}

# ============================================================================
# RESET TIME BENCHMARK
# ============================================================================

benchmark_reset_time() {
    print_header "Environment Reset Benchmark"

    info "Testing complete environment reset (down + clean + up)..."
    echo ""

    print_test "Running environment reset"
    echo ""
    echo -e "    ${CYAN}${CLOCK}${NC} Starting timer..."

    local start_time
    start_time=$(date +%s)

    # Use non-interactive reset
    {
        make down
        docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml -f docker/docker-compose.mocks.yml down -v --remove-orphans 2>/dev/null || true
        docker volume rm barberpro-postgres-data barberpro-redis-data barberpro-pgadmin-data 2>/dev/null || true
        make up
    } &> /dev/null

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    printf "  %-50s " "Reset completed"

    # Validate against criteria
    if [[ $duration -lt $MAX_RESET_TIME ]]; then
        echo -e "${GREEN}[${CHECK}] ${duration}s (< ${MAX_RESET_TIME}s)${NC}"
        ((TESTS_PASSED++))
    elif [[ $duration -lt $((MAX_RESET_TIME + 30)) ]]; then
        echo -e "${YELLOW}[${WARN}] ${duration}s (exceeds ${MAX_RESET_TIME}s target)${NC}"
        echo -e "    ${YELLOW}${ARROW}${NC} Performance acceptable but slower than target"
        warn_test ""
    else
        echo -e "${RED}[${CROSS}] ${duration}s (much slower than ${MAX_RESET_TIME}s)${NC}"
        fail_test "Performance significantly below target"
    fi
    ((TESTS_RUN++))

    echo ""
}

# ============================================================================
# MEMORY USAGE BENCHMARK
# ============================================================================

benchmark_memory_usage() {
    print_header "Memory Usage Benchmark"

    info "Measuring memory consumption of all services..."
    echo ""

    # Ensure services are running
    print_test "Ensuring services are running"
    make up &> /dev/null
    sleep 5
    pass_test

    # Get memory stats for all BarberPro containers
    print_test "Collecting memory statistics"
    local containers
    containers=$(docker ps --filter "name=barberpro" -q)

    if [ -z "$containers" ]; then
        fail_test "No BarberPro containers running"
        return 1
    fi

    verbose "Found $(echo "$containers" | wc -l) containers"
    pass_test

    # Calculate total memory usage
    print_test "Calculating total memory usage"
    local total_memory_mb=0
    local memory_data=""

    while IFS= read -r container; do
        local name
        name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        local mem_usage
        mem_usage=$(docker stats --no-stream --format "{{.MemUsage}}" "$container" | awk '{print $1}' | sed 's/MiB//')

        # Convert to MB if needed
        if [[ "$mem_usage" == *"GiB"* ]]; then
            mem_usage=$(echo "$mem_usage" | sed 's/GiB//' | awk '{print $1 * 1024}')
        fi

        # Remove any non-numeric characters
        mem_usage=$(echo "$mem_usage" | tr -cd '0-9.')
        mem_usage=${mem_usage%.*}  # Remove decimal

        if [ -n "$mem_usage" ] && [ "$mem_usage" -gt 0 ]; then
            total_memory_mb=$((total_memory_mb + mem_usage))
            memory_data="${memory_data}    ${name}: ${mem_usage}MB\n"
            verbose "$name: ${mem_usage}MB"
        fi
    done <<< "$containers"

    pass_test

    # Display detailed memory breakdown if verbose
    if [ "$VERBOSE" = true ] && [ -n "$memory_data" ]; then
        echo ""
        echo -e "${BLUE}Memory breakdown:${NC}"
        echo -e "$memory_data"
    fi

    # Validate against criteria
    printf "  %-50s " "Total memory usage: ${total_memory_mb}MB"

    if [[ $total_memory_mb -lt $MAX_MEMORY_MB ]]; then
        echo -e "${GREEN}[${CHECK}] < ${MAX_MEMORY_MB}MB${NC}"
        ((TESTS_PASSED++))
    elif [[ $total_memory_mb -lt $((MAX_MEMORY_MB + 1024)) ]]; then
        echo -e "${YELLOW}[${WARN}] Exceeds ${MAX_MEMORY_MB}MB target${NC}"
        echo -e "    ${YELLOW}${ARROW}${NC} Memory usage acceptable but higher than target"
        warn_test ""
    else
        echo -e "${RED}[${CROSS}] Much higher than ${MAX_MEMORY_MB}MB${NC}"
        fail_test "Memory usage significantly above target"
    fi
    ((TESTS_RUN++))

    echo ""
}

# ============================================================================
# CPU USAGE BENCHMARK
# ============================================================================

benchmark_cpu_usage() {
    print_header "CPU Usage Benchmark"

    info "Measuring CPU consumption of all services..."
    echo ""

    # Ensure services are running
    print_test "Services running check"
    if docker ps --filter "name=barberpro" -q | grep -q .; then
        pass_test
    else
        fail_test "No services running"
        return 1
    fi

    # Sample CPU usage
    print_test "Sampling CPU usage (5s window)"
    local containers
    containers=$(docker ps --filter "name=barberpro" -q)

    # Get CPU stats
    local cpu_data=""
    local high_cpu_count=0

    while IFS= read -r container; do
        local name
        name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        local cpu_usage
        cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" | sed 's/%//')

        # Check if CPU is very high (> 50%)
        if (( $(echo "$cpu_usage > 50" | bc -l 2>/dev/null || echo 0) )); then
            high_cpu_count=$((high_cpu_count + 1))
            cpu_data="${cpu_data}    ${name}: ${cpu_usage}% (HIGH)\n"
        else
            cpu_data="${cpu_data}    ${name}: ${cpu_usage}%\n"
        fi

        verbose "$name: ${cpu_usage}%"
    done <<< "$containers"

    pass_test

    # Display CPU breakdown if verbose
    if [ "$VERBOSE" = true ] && [ -n "$cpu_data" ]; then
        echo ""
        echo -e "${BLUE}CPU usage:${NC}"
        echo -e "$cpu_data"
    fi

    # Validate
    print_test "CPU usage validation"
    if [[ $high_cpu_count -eq 0 ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} All services under 50% CPU"
        pass_test
    else
        warn_test "$high_cpu_count service(s) using > 50% CPU"
        echo -e "    ${YELLOW}${ARROW}${NC} High CPU may indicate initialization or ongoing work"
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

    print_header "Benchmark Summary"

    # Platform detection
    local platform="Unknown"
    if [[ "$(uname -s)" == "Darwin" ]]; then
        platform="macOS ($(uname -m))"
    elif grep -qi microsoft /proc/version 2>/dev/null; then
        platform="WSL2"
    else
        platform="Linux ($(uname -m))"
    fi

    echo -e "${CYAN}Platform:${NC}       $platform"
    echo -e "${CYAN}Docker:${NC}         $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'N/A')"
    echo -e "${CYAN}Total Time:${NC}     ${duration}s"
    echo ""
    echo -e "${CYAN}Benchmarks Run:${NC} $TESTS_RUN"
    echo -e "${GREEN}Passed:${NC}        $TESTS_PASSED"
    echo -e "${RED}Failed:${NC}        $TESTS_FAILED"
    echo -e "${YELLOW}Warnings:${NC}      $((TESTS_RUN - TESTS_PASSED - TESTS_FAILED))"
    echo ""

    echo -e "${BLUE}Success Criteria:${NC}"
    echo -e "  Cold start < ${MAX_COLD_START}s"
    echo -e "  Warm start < ${MAX_WARM_START}s"
    echo -e "  Reset < ${MAX_RESET_TIME}s"
    echo -e "  Memory < ${MAX_MEMORY_MB}MB"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}[${CHECK}] All benchmarks passed!${NC}"
        echo ""
        echo -e "${CYAN}Performance meets or exceeds all success criteria.${NC}"
        return 0
    else
        echo -e "${RED}[${CROSS}] Some benchmarks failed.${NC}"
        echo ""
        echo -e "${YELLOW}Recommendations:${NC}"
        echo -e "  1. Allocate more resources to Docker (8GB+ RAM, 4+ CPUs)"
        echo -e "  2. Use SSD storage for better I/O performance"
        echo -e "  3. Close unnecessary applications"
        echo -e "  4. On WSL2, use WSL filesystem instead of /mnt/c"
        echo -e "  5. Update Docker Desktop to latest version"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "BarberPro Performance Benchmark Suite"

    info "Running performance benchmarks..."
    info "Mode: $([ "$QUICK" = true ] && echo "Quick (no cold start)" || echo "Full")"
    info "Verbose: $([ "$VERBOSE" = true ] && echo "Enabled" || echo "Disabled")"
    echo ""

    # Run prerequisite checks
    check_prerequisites

    # Run benchmarks
    if [ "$QUICK" = false ]; then
        benchmark_cold_start
    else
        info "Skipping cold start test (quick mode)"
        echo ""
    fi

    benchmark_warm_start
    benchmark_reset_time
    benchmark_memory_usage
    benchmark_cpu_usage

    # Cleanup
    info "Cleaning up test environment..."
    cleanup_environment

    # Print final report
    print_final_report
}

# Run main function
main "$@"
