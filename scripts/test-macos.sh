#!/bin/bash
# ============================================================================
# BarberPro macOS Platform Test Suite
# ============================================================================
# Comprehensive testing for macOS (Intel x86_64 and Apple Silicon arm64)
# Tests Docker Desktop, Makefile commands, performance, and color output
#
# Usage:
#   ./scripts/test-macos.sh              # Run all tests
#   ./scripts/test-macos.sh --verbose    # Verbose output
#   ./scripts/test-macos.sh --quick      # Quick smoke test
#
# Prerequisites:
#   - macOS (10.15+ Catalina or newer)
#   - Docker Desktop for Mac installed and running
#   - Xcode Command Line Tools (for make, git, etc.)
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

# Test configuration
readonly TIMEOUT=60
readonly MIN_DOCKER_VERSION="20.10"
readonly MIN_MEMORY_GB=8

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
            echo "  --quick, -q      Run quick smoke test only"
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
# PLATFORM DETECTION
# ============================================================================

detect_macos_version() {
    print_header "macOS Platform Detection"

    print_test "Detecting macOS version"
    if [[ "$(uname -s)" != "Darwin" ]]; then
        fail_test "Not running on macOS (detected: $(uname -s))"
        return 1
    fi

    local os_version
    os_version=$(sw_vers -productVersion)
    verbose "macOS version: $os_version"
    pass_test

    print_test "Detecting CPU architecture"
    local arch
    arch=$(uname -m)
    verbose "Architecture: $arch"

    if [[ "$arch" == "arm64" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} Apple Silicon (M1/M2/M3)"
        pass_test
    elif [[ "$arch" == "x86_64" ]]; then
        echo -e "    ${BLUE}${ARROW}${NC} Intel x86_64"
        pass_test
    else
        fail_test "Unknown architecture: $arch"
        return 1
    fi

    print_test "Checking system memory"
    local memory_gb
    memory_gb=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
    verbose "System memory: ${memory_gb}GB"

    if [[ $memory_gb -ge $MIN_MEMORY_GB ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} ${memory_gb}GB RAM available"
        pass_test
    else
        warn_test "Only ${memory_gb}GB RAM (recommended: ${MIN_MEMORY_GB}GB+)"
    fi

    print_test "Checking Command Line Tools"
    if xcode-select -p &> /dev/null; then
        verbose "Xcode CLT path: $(xcode-select -p)"
        pass_test
    else
        fail_test "Xcode Command Line Tools not installed"
        echo -e "    ${YELLOW}${ARROW}${NC} Install with: xcode-select --install"
        return 1
    fi
}

# ============================================================================
# DOCKER DESKTOP CHECKS
# ============================================================================

check_docker_desktop() {
    print_header "Docker Desktop Checks"

    print_test "Checking Docker Desktop installation"
    if [[ -d "/Applications/Docker.app" ]]; then
        verbose "Docker.app found at /Applications/Docker.app"
        pass_test
    else
        fail_test "Docker Desktop not found in /Applications"
        echo -e "    ${YELLOW}${ARROW}${NC} Download from: https://www.docker.com/products/docker-desktop"
        return 1
    fi

    print_test "Checking Docker daemon status"
    if docker info &> /dev/null; then
        verbose "Docker daemon is running"
        pass_test
    else
        fail_test "Docker daemon is not running"
        echo -e "    ${YELLOW}${ARROW}${NC} Start Docker Desktop from Applications"
        return 1
    fi

    print_test "Checking Docker version"
    local docker_version
    docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0.0.0")
    verbose "Docker version: $docker_version"

    if [[ "$(printf '%s\n' "$MIN_DOCKER_VERSION" "$docker_version" | sort -V | head -n1)" == "$MIN_DOCKER_VERSION" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} Version $docker_version (>= $MIN_DOCKER_VERSION)"
        pass_test
    else
        fail_test "Docker version $docker_version is too old (need >= $MIN_DOCKER_VERSION)"
        return 1
    fi

    print_test "Checking Docker Compose"
    if docker-compose version &> /dev/null; then
        local compose_version
        compose_version=$(docker-compose version --short 2>/dev/null)
        verbose "Docker Compose version: $compose_version"
        pass_test
    else
        fail_test "Docker Compose not available"
        return 1
    fi

    print_test "Checking Docker Desktop resources"
    local cpu_count
    local memory_mb
    cpu_count=$(docker info --format '{{.NCPU}}' 2>/dev/null || echo "0")
    memory_mb=$(docker info --format '{{.MemTotal}}' 2>/dev/null | awk '{print int($1/1024/1024)}')

    verbose "Docker CPUs: $cpu_count, Memory: ${memory_mb}MB"

    if [[ $cpu_count -ge 2 ]] && [[ $memory_mb -ge 4096 ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} ${cpu_count} CPUs, ${memory_mb}MB RAM"
        pass_test
    else
        warn_test "Low resources: ${cpu_count} CPUs, ${memory_mb}MB RAM (recommend 4+ CPUs, 8GB+ RAM)"
    fi

    print_test "Checking Docker network connectivity"
    if docker run --rm alpine:latest ping -c 1 google.com &> /dev/null; then
        verbose "Docker network connectivity OK"
        pass_test
    else
        fail_test "Docker network connectivity issue"
        return 1
    fi
}

# ============================================================================
# PORT AVAILABILITY CHECKS
# ============================================================================

check_port_availability() {
    print_header "Port Availability Checks"

    local ports=("3000:Backend" "5173:Frontend" "5432:PostgreSQL" "6379:Redis" "8080:pgAdmin" "8081:Redis Commander")

    for port_info in "${ports[@]}"; do
        IFS=':' read -r port name <<< "$port_info"
        print_test "Port $port ($name)"

        if ! lsof -i:$port &> /dev/null; then
            verbose "Port $port is available"
            pass_test
        else
            warn_test "Port $port is in use (may conflict)"
            if [ "$VERBOSE" = true ]; then
                echo -e "    ${BLUE}${ARROW}${NC} Process: $(lsof -ti:$port | xargs ps -p | tail -n +2 | awk '{print $NF}')"
            fi
        fi
    done
}

# ============================================================================
# MAKEFILE COMMANDS TEST
# ============================================================================

test_makefile_commands() {
    print_header "Makefile Commands Test"

    # Test help command
    print_test "make help"
    if make help &> /dev/null; then
        verbose "Help command executed successfully"
        pass_test
    else
        fail_test "Help command failed"
    fi

    # Test version command
    print_test "make version"
    if make version &> /dev/null; then
        verbose "Version command executed successfully"
        pass_test
    else
        fail_test "Version command failed"
    fi

    # Test doctor command
    print_test "make doctor"
    if make doctor &> /dev/null; then
        verbose "Doctor command executed successfully"
        pass_test
    else
        fail_test "Doctor command failed"
    fi

    if [ "$QUICK" = true ]; then
        info "Quick mode: Skipping full environment tests"
        return 0
    fi

    # Test up command
    print_test "make up"
    verbose "Starting development environment..."
    if timeout $TIMEOUT make up &> /dev/null; then
        verbose "Environment started successfully"
        pass_test
    else
        fail_test "Failed to start environment"
        return 1
    fi

    # Wait for services to stabilize
    info "Waiting for services to stabilize (10s)..."
    sleep 10

    # Test status command
    print_test "make status"
    if make status &> /dev/null; then
        verbose "Status command executed successfully"
        pass_test
    else
        fail_test "Status command failed"
    fi

    # Test health command
    print_test "make health"
    if make health &> /dev/null; then
        verbose "Health check executed successfully"
        pass_test
    else
        fail_test "Health check failed"
    fi

    # Test down command
    print_test "make down"
    if make down &> /dev/null; then
        verbose "Environment stopped successfully"
        pass_test
    else
        fail_test "Failed to stop environment"
    fi
}

# ============================================================================
# PERFORMANCE BENCHMARKS
# ============================================================================

run_performance_benchmarks() {
    print_header "Performance Benchmarks"

    info "Running performance benchmarks (this may take a few minutes)..."

    # Warm start benchmark
    print_test "Warm start time (make dev)"
    verbose "Starting timer for warm start..."
    local start_time
    start_time=$(date +%s)

    if make dev &> /dev/null; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))

        if [[ $duration -lt 15 ]]; then
            echo -e "    ${GREEN}${ARROW}${NC} ${duration}s (< 15s target)"
            pass_test
        elif [[ $duration -lt 30 ]]; then
            echo -e "    ${YELLOW}${ARROW}${NC} ${duration}s (exceeds 15s target)"
            warn_test "Slower than target but acceptable"
        else
            echo -e "    ${RED}${ARROW}${NC} ${duration}s (much slower than 15s target)"
            fail_test "Performance below acceptable threshold"
        fi
    else
        fail_test "Failed to start dev environment"
    fi

    # Clean up
    make down &> /dev/null || true
}

# ============================================================================
# COLOR OUTPUT VERIFICATION
# ============================================================================

verify_color_output() {
    print_header "Color Output Verification"

    print_test "Terminal color support"
    if [[ -t 1 ]] && command -v tput &> /dev/null; then
        local colors
        colors=$(tput colors 2>/dev/null || echo "0")
        verbose "Terminal supports $colors colors"

        if [[ $colors -ge 8 ]]; then
            echo -e "    ${GREEN}${ARROW}${NC} ${colors} colors supported"
            pass_test
        else
            warn_test "Limited color support ($colors colors)"
        fi
    else
        warn_test "Terminal color support unknown"
    fi

    print_test "Color output rendering"
    echo ""
    echo -e "    ${RED}Red${NC} ${GREEN}Green${NC} ${YELLOW}Yellow${NC} ${BLUE}Blue${NC} ${CYAN}Cyan${NC}"
    echo -e "    ${GREEN}${CHECK}${NC} ${RED}${CROSS}${NC} ${CYAN}${ARROW}${NC} ${YELLOW}${WARN}${NC} ${BLUE}${INFO}${NC}"
    pass_test
}

# ============================================================================
# MACOS-SPECIFIC CHECKS
# ============================================================================

check_macos_specific() {
    print_header "macOS-Specific Checks"

    print_test "File watching support (fsevents)"
    if [[ -e "/dev/fsevents" ]]; then
        verbose "fsevents device found"
        pass_test
    else
        warn_test "fsevents not available (may affect hot reload)"
    fi

    print_test "Homebrew package manager"
    if command -v brew &> /dev/null; then
        local brew_version
        brew_version=$(brew --version | head -n1)
        verbose "$brew_version"
        pass_test
    else
        warn_test "Homebrew not installed (optional but recommended)"
    fi

    print_test "System Integrity Protection (SIP)"
    local sip_status
    sip_status=$(csrutil status 2>/dev/null || echo "unknown")
    verbose "SIP status: $sip_status"

    if [[ "$sip_status" == *"enabled"* ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} SIP is enabled (recommended)"
        pass_test
    elif [[ "$sip_status" == *"disabled"* ]]; then
        warn_test "SIP is disabled (may have security implications)"
    else
        warn_test "Unable to determine SIP status"
    fi

    print_test "Apple Silicon Rosetta 2 (if ARM)"
    if [[ "$(uname -m)" == "arm64" ]]; then
        if [[ -f "/Library/Apple/usr/share/rosetta/rosetta" ]]; then
            verbose "Rosetta 2 is installed"
            pass_test
        else
            warn_test "Rosetta 2 not installed (may be needed for x86_64 images)"
            echo -e "    ${YELLOW}${ARROW}${NC} Install with: softwareupdate --install-rosetta"
        fi
    else
        echo -e "    ${BLUE}${ARROW}${NC} Not applicable (Intel CPU)"
        pass_test
    fi
}

# ============================================================================
# FINAL REPORT
# ============================================================================

print_final_report() {
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    print_header "Test Summary"

    echo -e "${CYAN}Platform:${NC}       macOS $(sw_vers -productVersion) ($(uname -m))"
    echo -e "${CYAN}Docker:${NC}         $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'N/A')"
    echo -e "${CYAN}Duration:${NC}       ${duration}s"
    echo ""
    echo -e "${CYAN}Tests Run:${NC}      $TESTS_RUN"
    echo -e "${GREEN}Passed:${NC}        $TESTS_PASSED"
    echo -e "${RED}Failed:${NC}        $TESTS_FAILED"
    echo -e "${YELLOW}Warnings:${NC}      $((TESTS_RUN - TESTS_PASSED - TESTS_FAILED))"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}[${CHECK}] All tests passed!${NC}"
        echo ""
        echo -e "${CYAN}macOS environment is ready for development.${NC}"
        return 0
    else
        echo -e "${RED}[${CROSS}] Some tests failed.${NC}"
        echo ""
        echo -e "${YELLOW}Please review the failures above and:${NC}"
        echo -e "  1. Ensure Docker Desktop is running"
        echo -e "  2. Check that required ports are available"
        echo -e "  3. Verify system resources (8GB+ RAM recommended)"
        echo -e "  4. Run 'make doctor' for more diagnostics"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "BarberPro macOS Platform Test Suite"

    info "Testing platform: macOS"
    info "Test mode: $([ "$QUICK" = true ] && echo "Quick" || echo "Full")"
    info "Verbose: $([ "$VERBOSE" = true ] && echo "Enabled" || echo "Disabled")"
    echo ""

    # Run test suites
    detect_macos_version || true
    check_docker_desktop || exit 1
    check_port_availability || true
    check_macos_specific || true
    test_makefile_commands || true

    if [ "$QUICK" = false ]; then
        run_performance_benchmarks || true
    fi

    verify_color_output || true

    # Print final report
    print_final_report
}

# Run main function
main "$@"
