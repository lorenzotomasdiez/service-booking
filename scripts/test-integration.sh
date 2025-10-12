#!/bin/bash
# ============================================================================
# BarberPro Integration Test Suite
# ============================================================================
# Comprehensive integration testing for the entire Docker environment
# Tests all services, mocks, and end-to-end flows
#
# Usage:
#   ./scripts/test-integration.sh              # Run all tests
#   ./scripts/test-integration.sh --quick      # Quick smoke test
#   ./scripts/test-integration.sh --verbose    # Verbose output
#
# Prerequisites:
#   - Docker and docker-compose installed
#   - Services running: make up
# ============================================================================

set -e  # Exit on error

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
readonly TIMEOUT=30
readonly RETRY_COUNT=3
readonly RETRY_DELAY=2

# Service URLs (from .env.development)
readonly BACKEND_URL="http://localhost:3000"
readonly FRONTEND_URL="http://localhost:5173"
readonly MERCADOPAGO_MOCK_URL="http://localhost:3001"
readonly AFIP_MOCK_URL="http://localhost:3002"
readonly WHATSAPP_MOCK_URL="http://localhost:3003"
readonly SMS_MOCK_URL="http://localhost:3004"
readonly MAILHOG_API_URL="http://localhost:8025/api/v2"
readonly MAILHOG_UI_URL="http://localhost:8025"
readonly POSTGRES_HOST="localhost"
readonly POSTGRES_PORT="5432"
readonly REDIS_HOST="localhost"
readonly REDIS_PORT="6379"

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
    echo -e "${GREEN}[${CHECK}]${NC} $1"
}

print_error() {
    echo -e "${RED}[${CROSS}]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[${WARN}]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[${INFO}]${NC} $1"
}

# Increment test counters
test_passed() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}PASS${NC}"
}

test_failed() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}FAIL${NC}"
    if [ "$1" != "" ]; then
        echo -e "       ${RED}Error: $1${NC}"
    fi
}

# Wait for service with retries
wait_for_service() {
    local url=$1
    local name=$2
    local retries=${3:-$RETRY_COUNT}
    local delay=${4:-$RETRY_DELAY}

    if [ "$VERBOSE" = true ]; then
        print_info "Waiting for $name at $url"
    fi

    for i in $(seq 1 $retries); do
        if curl -sf "$url" > /dev/null 2>&1; then
            return 0
        fi

        if [ $i -lt $retries ]; then
            if [ "$VERBOSE" = true ]; then
                print_info "Retry $i/$retries for $name..."
            fi
            sleep $delay
        fi
    done

    return 1
}

# HTTP GET request with retries
http_get() {
    local url=$1
    local expected_status=${2:-200}
    local retries=${3:-1}

    for i in $(seq 1 $retries); do
        local response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
        local body=$(echo "$response" | head -n -1)
        local status=$(echo "$response" | tail -n 1)

        if [ "$status" = "$expected_status" ]; then
            if [ "$VERBOSE" = true ]; then
                echo "$body"
            fi
            return 0
        fi

        if [ $i -lt $retries ]; then
            sleep $RETRY_DELAY
        fi
    done

    return 1
}

# HTTP POST request
http_post() {
    local url=$1
    local data=$2
    local expected_status=${3:-200}

    local response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null || echo "000")

    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)

    if [ "$VERBOSE" = true ]; then
        echo "Response status: $status"
        echo "Response body: $body"
    fi

    if [ "$status" = "$expected_status" ]; then
        echo "$body"
        return 0
    fi

    return 1
}

# Check if Docker container is running
is_container_running() {
    local container_name=$1
    docker ps --filter "name=$container_name" --format "{{.Names}}" | grep -q "$container_name"
}

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

# Test 1: Docker Environment
test_docker_environment() {
    print_section "Docker Environment"

    # Test Docker is running
    print_test "Docker daemon"
    if docker info > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Docker is not running"
        return 1
    fi

    # Test required containers
    # Check for both prod and dev container names
    local containers=("barberpro-postgres" "barberpro-redis" "barberpro-mercadopago-mock" "barberpro-afip-mock" "barberpro-whatsapp-mock" "barberpro-sms-mock" "barberpro-mailhog")
    local dev_containers=("barberpro-postgres-dev" "barberpro-redis-dev" "barberpro-mercadopago-mock" "barberpro-afip-mock" "barberpro-whatsapp-mock" "barberpro-sms-mock" "barberpro-mailhog")

    for i in "${!containers[@]}"; do
        local container="${containers[$i]}"
        local dev_container="${dev_containers[$i]}"
        print_test "Container $container"
        if is_container_running "$container" || is_container_running "$dev_container"; then
            test_passed
        else
            test_failed "Container not running"
        fi
    done
}

# Test 2: Database Connectivity
test_database_connectivity() {
    print_section "Database Connectivity"

    # Test PostgreSQL connection
    print_test "PostgreSQL connection"
    if docker exec barberpro-postgres pg_isready -U barberpro > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Cannot connect to PostgreSQL"
    fi

    # Test database exists
    print_test "Database exists"
    if docker exec barberpro-postgres psql -U barberpro -d barberpro_dev -c "SELECT 1" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Database does not exist"
    fi

    # Test Redis connection
    print_test "Redis connection"
    # Try both prod and dev container names
    if docker exec barberpro-redis redis-cli ping 2>/dev/null | grep -q "PONG" || \
       docker exec barberpro-redis-dev redis-cli ping 2>/dev/null | grep -q "PONG"; then
        test_passed
    else
        test_failed "Cannot connect to Redis"
    fi
}

# Test 3: Mock Services Health
test_mock_services() {
    print_section "Mock Services Health"

    # Test MercadoPago Mock
    print_test "MercadoPago Mock health"
    if http_get "$MERCADOPAGO_MOCK_URL/health" 200 $RETRY_COUNT; then
        test_passed
    else
        test_failed "MercadoPago mock not healthy"
    fi

    # Test AFIP Mock
    print_test "AFIP Mock health"
    if http_get "$AFIP_MOCK_URL/health" 200 $RETRY_COUNT; then
        test_passed
    else
        test_failed "AFIP mock not healthy"
    fi

    # Test WhatsApp Mock
    print_test "WhatsApp Mock health"
    if http_get "$WHATSAPP_MOCK_URL/health" 200 $RETRY_COUNT; then
        test_passed
    else
        test_failed "WhatsApp mock not healthy"
    fi

    # Test SMS Mock
    print_test "SMS Mock health"
    if http_get "$SMS_MOCK_URL/health" 200 $RETRY_COUNT; then
        test_passed
    else
        test_failed "SMS mock not healthy"
    fi
}

# Test 4: Email Service (MailHog)
test_email_service() {
    print_section "Email Service (MailHog)"

    # Test MailHog API
    print_test "MailHog API"
    if http_get "$MAILHOG_API_URL/messages" 200 $RETRY_COUNT; then
        test_passed
    else
        test_failed "MailHog API not accessible"
    fi

    # Test MailHog can receive emails (verify endpoint exists)
    print_test "MailHog ready to receive"
    if curl -sf "$MAILHOG_UI_URL" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "MailHog UI not accessible"
    fi
}

# Test 5: Payment Flow (if backend is available)
test_payment_flow() {
    print_section "Payment Flow"

    # Check if backend is running
    if ! curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_warning "Backend not running, skipping payment flow tests"
        return 0
    fi

    # Test MercadoPago payment initialization
    print_test "Payment initialization"
    local payment_data='{
        "transaction_amount": 100,
        "description": "Test payment",
        "payment_method_id": "visa",
        "payer": {
            "email": "test@example.com"
        }
    }'

    if http_post "$MERCADOPAGO_MOCK_URL/v1/payments" "$payment_data" 201; then
        test_passed
    else
        test_failed "Payment initialization failed"
    fi
}

# Test 6: Tax Reporting (AFIP)
test_tax_reporting() {
    print_section "Tax Reporting (AFIP)"

    # Test AFIP authorization
    print_test "AFIP authorization"
    local auth_data='{
        "service": "wsfev1",
        "cuit": "20123456789"
    }'

    if http_post "$AFIP_MOCK_URL/wsaa/LoginCms" "$auth_data" 200; then
        test_passed
    else
        test_failed "AFIP authorization failed"
    fi

    # Test AFIP invoice generation
    print_test "Invoice generation (CAE)"
    local invoice_data='{
        "cuit": "20123456789",
        "sale_point": 1,
        "concept": 1,
        "doc_type": 99,
        "doc_number": 0,
        "from_date": "20250101",
        "to_date": "20250101",
        "due_date": "20250101",
        "total": 100,
        "net_taxed": 82.64,
        "net_not_taxed": 0,
        "exempt": 0,
        "iva": 17.36
    }'

    if http_post "$AFIP_MOCK_URL/wsfev1/FECAESolicitar" "$invoice_data" 200; then
        test_passed
    else
        test_failed "Invoice generation failed"
    fi
}

# Test 7: Notification Services
test_notifications() {
    print_section "Notification Services"

    # Test WhatsApp message sending
    print_test "WhatsApp message"
    local whatsapp_data='{
        "to": "+5491112345678",
        "body": "Test message"
    }'

    if http_post "$WHATSAPP_MOCK_URL/v1/messages" "$whatsapp_data" 201; then
        test_passed
    else
        test_failed "WhatsApp message failed"
    fi

    # Test SMS sending
    print_test "SMS message"
    local sms_data='{
        "to": "+5491112345678",
        "message": "Test SMS"
    }'

    if http_post "$SMS_MOCK_URL/v1/messages" "$sms_data" 201; then
        test_passed
    else
        test_failed "SMS message failed"
    fi
}

# Test 8: Full Stack Integration
test_full_stack() {
    print_section "Full Stack Integration"

    # Check if backend is running
    if ! curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_warning "Backend not running, skipping full stack tests"
        return 0
    fi

    # Test backend health
    print_test "Backend health endpoint"
    if http_get "$BACKEND_URL/health" 200 $RETRY_COUNT; then
        test_passed
    else
        test_failed "Backend health check failed"
    fi

    # Check if frontend is running
    print_test "Frontend accessibility"
    if curl -sf "$FRONTEND_URL" > /dev/null 2>&1; then
        test_passed
    else
        print_warning "Frontend not running (optional for integration tests)"
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

main() {
    print_header "BarberPro Integration Test Suite"

    print_info "Test Configuration:"
    echo "  Timeout: ${TIMEOUT}s"
    echo "  Retry count: ${RETRY_COUNT}"
    echo "  Retry delay: ${RETRY_DELAY}s"
    echo "  Quick mode: $QUICK"
    echo "  Verbose: $VERBOSE"
    echo ""

    # Run tests
    test_docker_environment
    test_database_connectivity
    test_mock_services
    test_email_service

    if [ "$QUICK" = false ]; then
        test_payment_flow
        test_tax_reporting
        test_notifications
        test_full_stack
    else
        print_info "Quick mode: Skipping detailed integration tests"
    fi

    # Print summary
    print_header "Test Summary"

    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    echo -e "  Total tests:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "  Passed:         ${GREEN}$TESTS_PASSED${NC}"
    echo -e "  Failed:         ${RED}$TESTS_FAILED${NC}"
    echo -e "  Duration:       ${CYAN}${duration}s${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All tests passed!"
        echo ""
        print_info "Services are ready for development:"
        echo "  - Database:     postgresql://localhost:5432"
        echo "  - Redis:        redis://localhost:6379"
        echo "  - MercadoPago:  $MERCADOPAGO_MOCK_URL"
        echo "  - AFIP:         $AFIP_MOCK_URL"
        echo "  - WhatsApp:     $WHATSAPP_MOCK_URL"
        echo "  - SMS:          $SMS_MOCK_URL"
        echo "  - Email:        $MAILHOG_UI_URL"
        echo ""
        exit 0
    else
        print_error "$TESTS_FAILED test(s) failed"
        echo ""
        print_warning "Troubleshooting tips:"
        echo "  1. Check service logs:    make logs"
        echo "  2. Check service status:  make status"
        echo "  3. Restart services:      make restart"
        echo "  4. View detailed errors:  ./scripts/test-integration.sh --verbose"
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"
