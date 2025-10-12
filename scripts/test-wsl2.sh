#!/bin/bash
# ============================================================================
# BarberPro WSL2 Platform Test Suite
# ============================================================================
# Comprehensive testing for Windows WSL2 (Ubuntu distribution)
# Tests Docker Desktop WSL2 backend, path handling, and all Makefile commands
#
# Usage:
#   ./scripts/test-wsl2.sh              # Run all tests
#   ./scripts/test-wsl2.sh --verbose    # Verbose output
#   ./scripts/test-wsl2.sh --quick      # Quick smoke test
#
# Prerequisites:
#   - Windows 10/11 with WSL2 enabled
#   - Ubuntu or Debian WSL2 distribution
#   - Docker Desktop with WSL2 backend enabled
#   - WSL2 integration enabled for your distribution
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
readonly MIN_WSL_VERSION="2"

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
# WSL2 DETECTION
# ============================================================================

detect_wsl2_environment() {
    print_header "WSL2 Environment Detection"

    print_test "Detecting WSL2"
    if grep -qi microsoft /proc/version; then
        verbose "Running inside WSL"
        pass_test
    else
        fail_test "Not running in WSL2 (detected: $(uname -s))"
        echo -e "    ${YELLOW}${ARROW}${NC} This script is designed for Windows WSL2"
        return 1
    fi

    print_test "Checking WSL version"
    # Check if WSL_DISTRO_NAME is set (WSL2 feature)
    if [ -n "${WSL_DISTRO_NAME:-}" ]; then
        verbose "WSL distribution: $WSL_DISTRO_NAME"
        echo -e "    ${GREEN}${ARROW}${NC} Distribution: $WSL_DISTRO_NAME"
        pass_test
    else
        warn_test "Unable to detect WSL distribution name"
    fi

    print_test "Detecting Linux distribution"
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

    print_test "Checking kernel version"
    local kernel_version
    kernel_version=$(uname -r)
    verbose "Kernel: $kernel_version"

    if [[ "$kernel_version" == *"microsoft"* ]] || [[ "$kernel_version" == *"WSL"* ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} $kernel_version (WSL2 kernel)"
        pass_test
    else
        warn_test "Kernel doesn't appear to be WSL2: $kernel_version"
    fi

    print_test "Checking CPU architecture"
    local arch
    arch=$(uname -m)
    verbose "Architecture: $arch"

    if [[ "$arch" == "x86_64" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} x86_64 (64-bit)"
        pass_test
    else
        warn_test "Unusual architecture for WSL2: $arch"
    fi
}

# ============================================================================
# DOCKER DESKTOP WSL2 BACKEND CHECKS
# ============================================================================

check_docker_desktop_wsl2() {
    print_header "Docker Desktop WSL2 Backend Checks"

    print_test "Checking Docker installation"
    if command -v docker &> /dev/null; then
        verbose "Docker command found: $(command -v docker)"
        pass_test
    else
        fail_test "Docker is not available in WSL2"
        echo -e "    ${YELLOW}${ARROW}${NC} Install Docker Desktop for Windows"
        echo -e "    ${YELLOW}${ARROW}${NC} Enable WSL2 backend in Docker Desktop settings"
        echo -e "    ${YELLOW}${ARROW}${NC} Enable integration with your WSL2 distribution"
        return 1
    fi

    print_test "Checking Docker daemon status"
    if docker info &> /dev/null; then
        verbose "Docker daemon is accessible"
        pass_test
    else
        fail_test "Docker daemon is not accessible"
        echo -e "    ${YELLOW}${ARROW}${NC} Ensure Docker Desktop is running on Windows"
        echo -e "    ${YELLOW}${ARROW}${NC} Check WSL2 integration in Docker Desktop settings"
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

    print_test "Checking Docker Desktop context"
    local docker_context
    docker_context=$(docker context show 2>/dev/null || echo "unknown")
    verbose "Docker context: $docker_context"

    if [[ "$docker_context" == "default" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} Using Docker Desktop context"
        pass_test
    else
        warn_test "Using non-default context: $docker_context"
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

    print_test "Checking WSL2 Docker socket"
    if [ -S /var/run/docker.sock ]; then
        verbose "Docker socket exists and is accessible"
        pass_test
    else
        fail_test "Docker socket not accessible in WSL2"
        echo -e "    ${YELLOW}${ARROW}${NC} Enable WSL2 integration in Docker Desktop"
        return 1
    fi

    print_test "Checking Docker Desktop integration"
    local docker_host="${DOCKER_HOST:-/var/run/docker.sock}"
    verbose "DOCKER_HOST: $docker_host"

    if docker ps &> /dev/null; then
        echo -e "    ${GREEN}${ARROW}${NC} WSL2 integration working"
        pass_test
    else
        fail_test "WSL2 integration not working properly"
        return 1
    fi
}

# ============================================================================
# WINDOWS/WSL PATH HANDLING VALIDATION
# ============================================================================

check_path_handling() {
    print_header "Windows/WSL Path Handling Validation"

    print_test "Checking WSL path conversion"
    local test_path="/mnt/c/Users"
    if [ -d "$test_path" ]; then
        verbose "Windows C: drive mounted at /mnt/c"
        pass_test
    else
        warn_test "Windows drives not mounted at /mnt/* (may use custom mount)"
    fi

    print_test "Checking wslpath utility"
    if command -v wslpath &> /dev/null; then
        verbose "wslpath utility available"
        # Test conversion
        local windows_path="C:\\Users"
        local wsl_path
        wsl_path=$(wslpath "$windows_path" 2>/dev/null || echo "")
        if [ -n "$wsl_path" ]; then
            verbose "Path conversion working: $windows_path -> $wsl_path"
            pass_test
        else
            warn_test "wslpath conversion failed"
        fi
    else
        warn_test "wslpath utility not available"
    fi

    print_test "Checking current directory path"
    local pwd_path
    pwd_path=$(pwd)
    verbose "Current directory: $pwd_path"

    if [[ "$pwd_path" == /home/* ]] || [[ "$pwd_path" == /root/* ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} Using WSL filesystem (recommended)"
        pass_test
    elif [[ "$pwd_path" == /mnt/* ]]; then
        warn_test "Using Windows filesystem (slower performance)"
        echo -e "    ${YELLOW}${ARROW}${NC} For better performance, use WSL filesystem (/home/...)"
    else
        verbose "Using path: $pwd_path"
        pass_test
    fi

    print_test "Checking line ending configuration"
    local git_autocrlf
    git_autocrlf=$(git config --get core.autocrlf 2>/dev/null || echo "unset")
    verbose "git core.autocrlf: $git_autocrlf"

    if [[ "$git_autocrlf" == "input" ]] || [[ "$git_autocrlf" == "false" ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} Line endings configured correctly ($git_autocrlf)"
        pass_test
    else
        warn_test "Line endings may cause issues (autocrlf=$git_autocrlf)"
        echo -e "    ${YELLOW}${ARROW}${NC} Set with: git config --global core.autocrlf input"
    fi

    print_test "Checking file permissions"
    # Create a test script to check execute permissions
    local test_file="/tmp/wsl2_test_$$"
    echo "#!/bin/bash" > "$test_file"
    echo "echo test" >> "$test_file"

    if chmod +x "$test_file" 2>/dev/null && [ -x "$test_file" ]; then
        verbose "File permissions working correctly"
        rm -f "$test_file"
        pass_test
    else
        warn_test "File permission issues detected"
        rm -f "$test_file" 2>/dev/null || true
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
# WSL2-SPECIFIC CHECKS
# ============================================================================

check_wsl2_specific() {
    print_header "WSL2-Specific Checks"

    print_test "Checking WSL2 memory configuration"
    local total_mem_gb
    total_mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    verbose "WSL2 memory limit: ${total_mem_gb}GB"

    if [[ $total_mem_gb -ge 4 ]]; then
        echo -e "    ${GREEN}${ARROW}${NC} ${total_mem_gb}GB available"
        pass_test
    else
        warn_test "Only ${total_mem_gb}GB RAM (may need to increase in .wslconfig)"
        echo -e "    ${YELLOW}${ARROW}${NC} Configure in C:\\Users\\<username>\\.wslconfig"
    fi

    print_test "Checking Windows integration tools"
    if command -v cmd.exe &> /dev/null; then
        verbose "Windows integration available (cmd.exe)"
        pass_test
    else
        warn_test "Windows integration tools not available"
    fi

    print_test "Checking file watching (inotify)"
    if [ -f /proc/sys/fs/inotify/max_user_watches ]; then
        local max_watches
        max_watches=$(cat /proc/sys/fs/inotify/max_user_watches)
        verbose "max_user_watches: $max_watches"

        if [[ $max_watches -ge 524288 ]]; then
            echo -e "    ${GREEN}${ARROW}${NC} $max_watches watches (adequate)"
            pass_test
        else
            warn_test "Only $max_watches watches (may affect hot reload)"
            echo -e "    ${YELLOW}${ARROW}${NC} Increase with: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf"
        fi
    else
        warn_test "Unable to check inotify limits"
    fi

    print_test "Checking systemd support"
    if command -v systemctl &> /dev/null && systemctl --version &> /dev/null; then
        verbose "systemd is available in WSL2"
        pass_test
    else
        warn_test "systemd not available (may be using older WSL2)"
        echo -e "    ${YELLOW}${ARROW}${NC} Consider updating WSL2 for systemd support"
    fi

    print_test "Checking DNS resolution"
    if ping -c 1 google.com &> /dev/null; then
        verbose "DNS resolution working"
        pass_test
    else
        fail_test "DNS resolution not working"
        echo -e "    ${YELLOW}${ARROW}${NC} Check /etc/resolv.conf or restart WSL2"
    fi

    print_test "Checking localhost connectivity"
    # Test if we can reach Windows host
    if command -v powershell.exe &> /dev/null; then
        verbose "Can execute Windows commands from WSL2"
        pass_test
    else
        warn_test "Windows command execution limited"
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

    local distro="WSL2"
    if [ -f /etc/os-release ]; then
        distro="WSL2 ($(grep "^NAME=" /etc/os-release | cut -d'"' -f2))"
    fi

    echo -e "${CYAN}Platform:${NC}       $distro"
    echo -e "${CYAN}Distribution:${NC}   ${WSL_DISTRO_NAME:-Unknown}"
    echo -e "${CYAN}Kernel:${NC}         $(uname -r)"
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
        echo -e "${CYAN}WSL2 environment is ready for development.${NC}"
        return 0
    else
        echo -e "${RED}[${CROSS}] Some tests failed.${NC}"
        echo ""
        echo -e "${YELLOW}Please review the failures above and:${NC}"
        echo -e "  1. Ensure Docker Desktop is running on Windows"
        echo -e "  2. Enable WSL2 backend in Docker Desktop settings"
        echo -e "  3. Enable integration with your WSL2 distribution"
        echo -e "  4. Check that required ports are available"
        echo -e "  5. Consider using WSL filesystem (/home/...) instead of /mnt/c"
        echo -e "  6. Run 'make doctor' for more diagnostics"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "BarberPro WSL2 Platform Test Suite"

    info "Testing platform: Windows WSL2"
    info "Test mode: $([ "$QUICK" = true ] && echo "Quick" || echo "Full")"
    info "Verbose: $([ "$VERBOSE" = true ] && echo "Enabled" || echo "Disabled")"
    echo ""

    # Run test suites
    detect_wsl2_environment || exit 1
    check_docker_desktop_wsl2 || exit 1
    check_path_handling || true
    check_port_availability || true
    check_wsl2_specific || true
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
