#!/bin/bash
# ============================================================================
# BarberPro Linux Platform Test Suite
# ============================================================================
# Comprehensive testing for Linux (Ubuntu 22.04+ and other distributions)
# Tests Docker Engine, user permissions, systemd, and all Makefile commands
#
# Usage:
#   ./scripts/test-linux.sh              # Run all tests
#   ./scripts/test-linux.sh --verbose    # Verbose output
#   ./scripts/test-linux.sh --quick      # Quick smoke test
#
# Prerequisites:
#   - Linux (Ubuntu 22.04+ or equivalent)
#   - Docker Engine installed
#   - User added to docker group
#   - Make and basic development tools
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
readonly MIN_MEMORY_GB=4

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

detect_linux_distribution() {
    print_header "Linux Platform Detection"

    print_test "Detecting Linux distribution"
    if [[ "$(uname -s)" != "Linux" ]]; then
        fail_test "Not running on Linux (detected: $(uname -s))"
        return 1
    fi

    local distro="Unknown"
    local version="Unknown"

    if [ -f /etc/os-release ]; then
        distro=$(grep "^NAME=" /etc/os-release | cut -d'"' -f2)
        version=$(grep "^VERSION_ID=" /etc/os-release | cut -d'"' -f2)
        verbose "Distribution: $distro $version"
        echo -e "    ${GREEN}${ARROW}${NC} $distro $version"
        pass_test
    else
        warn_test "Unable to detect distribution"
    fi

    print_test "Checking CPU architecture"
    local arch
    arch=$(uname -m)
    verbose "Architecture: $arch"

    if [[ "$arch" == "x86_64" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} x86_64 (64-bit)"
        pass_test
    elif [[ "$arch" == "aarch64" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} ARM64 (64-bit)"
        pass_test
    else
        warn_test "Unusual architecture: $arch"
    fi

    print_test "Checking kernel version"
    local kernel_version
    kernel_version=$(uname -r)
    verbose "Kernel: $kernel_version"
    echo -e "    ${GREEN}${ARROW}${NC} $kernel_version"
    pass_test

    print_test "Checking system memory"
    local memory_gb
    memory_gb=$(free -g | awk '/^Mem:/{print $2}')
    verbose "System memory: ${memory_gb}GB"

    if [[ $memory_gb -ge $MIN_MEMORY_GB ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} ${memory_gb}GB RAM available"
        pass_test
    else
        warn_test "Only ${memory_gb}GB RAM (recommended: ${MIN_MEMORY_GB}GB+)"
    fi
}

# ============================================================================
# DOCKER ENGINE CHECKS
# ============================================================================

check_docker_engine() {
    print_header "Docker Engine Checks"

    print_test "Checking Docker installation"
    if command -v docker &> /dev/null; then
        verbose "Docker command found: $(command -v docker)"
        pass_test
    else
        fail_test "Docker is not installed"
        echo -e "    ${YELLOW}${ARROW}${NC} Install with: curl -fsSL https://get.docker.com | sh"
        return 1
    fi

    print_test "Checking Docker daemon status"
    if docker info &> /dev/null; then
        verbose "Docker daemon is running"
        pass_test
    else
        fail_test "Docker daemon is not running"
        echo -e "    ${YELLOW}${ARROW}${NC} Start with: sudo systemctl start docker"
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
        echo -e "    ${YELLOW}${ARROW}${NC} Install with: sudo apt install docker-compose-plugin"
        return 1
    fi

    print_test "Checking user docker group membership"
    if groups | grep -q docker; then
        verbose "User is in docker group"
        pass_test
    else
        fail_test "User is not in docker group"
        echo -e "    ${YELLOW}${ARROW}${NC} Add user with: sudo usermod -aG docker \$USER"
        echo -e "    ${YELLOW}${ARROW}${NC} Then log out and back in"
        return 1
    fi

    print_test "Checking Docker socket permissions"
    if [ -S /var/run/docker.sock ]; then
        verbose "Docker socket exists and is accessible"
        pass_test
    else
        fail_test "Docker socket not accessible"
        return 1
    fi
}

# ============================================================================
# SYSTEMD SERVICE CHECKS
# ============================================================================

check_systemd_services() {
    print_header "Systemd Service Checks"

    print_test "Checking systemd availability"
    if command -v systemctl &> /dev/null; then
        verbose "systemd is available"
        pass_test
    else
        warn_test "systemd not available (may be using different init system)"
        return 0
    fi

    print_test "Checking docker.service status"
    if systemctl is-active --quiet docker; then
        verbose "docker.service is active"
        pass_test
    else
        fail_test "docker.service is not active"
        echo -e "    ${YELLOW}${ARROW}${NC} Start with: sudo systemctl start docker"
    fi

    print_test "Checking docker.service enabled on boot"
    if systemctl is-enabled --quiet docker 2>/dev/null; then
        verbose "docker.service is enabled on boot"
        pass_test
    else
        warn_test "docker.service not enabled on boot"
        echo -e "    ${YELLOW}${ARROW}${NC} Enable with: sudo systemctl enable docker"
    fi

    print_test "Checking docker.socket status"
    if systemctl is-active --quiet docker.socket 2>/dev/null; then
        verbose "docker.socket is active"
        pass_test
    else
        warn_test "docker.socket is not active (may not be required)"
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

        # Use ss or netstat depending on availability
        if command -v ss &> /dev/null; then
            if ! ss -tuln | grep -q ":$port "; then
                verbose "Port $port is available"
                pass_test
            else
                warn_test "Port $port is in use (may conflict)"
            fi
        elif command -v netstat &> /dev/null; then
            if ! netstat -tuln | grep -q ":$port "; then
                verbose "Port $port is available"
                pass_test
            else
                warn_test "Port $port is in use (may conflict)"
            fi
        else
            warn_test "Cannot check port $port (ss/netstat not available)"
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
# LINUX-SPECIFIC CHECKS
# ============================================================================

check_linux_specific() {
    print_header "Linux-Specific Checks"

    print_test "SELinux status"
    if command -v getenforce &> /dev/null; then
        local selinux_status
        selinux_status=$(getenforce 2>/dev/null || echo "Unknown")
        verbose "SELinux status: $selinux_status"

        if [[ "$selinux_status" == "Enforcing" ]]; then
            warn_test "SELinux is enforcing (may need :z flag on volumes)"
        elif [[ "$selinux_status" == "Permissive" ]]; then
            echo -e "    ${YELLOW}${ARROW}${NC} SELinux is permissive"
            pass_test
        else
            echo -e "    ${BLUE}${ARROW}${NC} SELinux is disabled"
            pass_test
        fi
    else
        echo -e "    ${BLUE}${ARROW}${NC} SELinux not installed"
        pass_test
    fi

    print_test "AppArmor status"
    if command -v aa-status &> /dev/null; then
        if sudo aa-status &> /dev/null; then
            verbose "AppArmor is active"
            pass_test
        else
            warn_test "AppArmor check failed (may need sudo)"
        fi
    else
        echo -e "    ${BLUE}${ARROW}${NC} AppArmor not installed"
        pass_test
    fi

    print_test "File watching limits (inotify)"
    if [ -f /proc/sys/fs/inotify/max_user_watches ]; then
        local max_watches
        max_watches=$(cat /proc/sys/fs/inotify/max_user_watches)
        verbose "max_user_watches: $max_watches"

        if [[ $max_watches -ge 524288 ]]; then
            echo -e "    ${GREEN}${ARROW}${NC} $max_watches watches (adequate)"
            pass_test
        else
            warn_test "Only $max_watches watches (may need to increase for hot reload)"
            echo -e "    ${YELLOW}${ARROW}${NC} Increase with: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf"
        fi
    else
        warn_test "Unable to check inotify limits"
    fi

    print_test "Core utilities availability"
    local missing_utils=()
    for util in curl wget git make; do
        if ! command -v $util &> /dev/null; then
            missing_utils+=("$util")
        fi
    done

    if [[ ${#missing_utils[@]} -eq 0 ]]; then
        verbose "All core utilities available"
        pass_test
    else
        fail_test "Missing utilities: ${missing_utils[*]}"
        echo -e "    ${YELLOW}${ARROW}${NC} Install with: sudo apt install ${missing_utils[*]}"
    fi

    print_test "Storage driver"
    local storage_driver
    storage_driver=$(docker info --format '{{.Driver}}' 2>/dev/null || echo "unknown")
    verbose "Storage driver: $storage_driver"

    if [[ "$storage_driver" == "overlay2" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} overlay2 (recommended)"
        pass_test
    else
        warn_test "Using $storage_driver (overlay2 is recommended)"
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

    local distro="Linux"
    if [ -f /etc/os-release ]; then
        distro=$(grep "^NAME=" /etc/os-release | cut -d'"' -f2)
    fi

    echo -e "${CYAN}Platform:${NC}       $distro ($(uname -m))"
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
        echo -e "${CYAN}Linux environment is ready for development.${NC}"
        return 0
    else
        echo -e "${RED}[${CROSS}] Some tests failed.${NC}"
        echo ""
        echo -e "${YELLOW}Please review the failures above and:${NC}"
        echo -e "  1. Ensure Docker is running: sudo systemctl start docker"
        echo -e "  2. Add user to docker group: sudo usermod -aG docker \$USER"
        echo -e "  3. Check that required ports are available"
        echo -e "  4. Verify system resources (4GB+ RAM recommended)"
        echo -e "  5. Run 'make doctor' for more diagnostics"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "BarberPro Linux Platform Test Suite"

    info "Testing platform: Linux"
    info "Test mode: $([ "$QUICK" = true ] && echo "Quick" || echo "Full")"
    info "Verbose: $([ "$VERBOSE" = true ] && echo "Enabled" || echo "Disabled")"
    echo ""

    # Run test suites
    detect_linux_distribution || true
    check_docker_engine || exit 1
    check_systemd_services || true
    check_port_availability || true
    check_linux_specific || true
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
