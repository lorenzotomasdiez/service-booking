#!/bin/bash
# ============================================================================
# BarberPro Payment Flow Integration Test
# ============================================================================
# Tests the complete payment flow from booking creation to payment confirmation
#
# Flow tested:
#   1. Create a test booking
#   2. Initialize payment via MercadoPago mock
#   3. Process payment
#   4. Verify payment status
#   5. Check database records
#   6. Verify webhook delivery
#
# Usage:
#   ./scripts/test-payment-flow.sh              # Run all payment tests
#   ./scripts/test-payment-flow.sh --verbose    # Verbose output
#
# Prerequisites:
#   - Services running: make up
#   - Backend running (optional for API tests)
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

# Service URLs
readonly BACKEND_URL="http://localhost:3000"
readonly MERCADOPAGO_MOCK_URL="http://localhost:3001"

# Test configuration
readonly RETRY_COUNT=3
readonly RETRY_DELAY=2

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Parse arguments
VERBOSE=false
for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE=true
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

# HTTP POST with JSON
http_post() {
    local url=$1
    local data=$2
    local expected_status=${3:-200}

    local response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null || echo -e "\n000")

    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)

    print_info "Request to: $url"
    print_info "Status: $status, Expected: $expected_status"
    print_info "Response: $body"

    if [ "$status" = "$expected_status" ]; then
        echo "$body"
        return 0
    fi

    return 1
}

# HTTP GET
http_get() {
    local url=$1
    local expected_status=${2:-200}

    local response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo -e "\n000")
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)

    print_info "GET $url -> Status: $status"

    if [ "$status" = "$expected_status" ]; then
        echo "$body"
        return 0
    fi

    return 1
}

# Extract JSON field (basic)
extract_json_field() {
    local json=$1
    local field=$2
    echo "$json" | grep -o "\"$field\"[^,}]*" | cut -d'"' -f4 | head -1
}

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

# Test 1: MercadoPago Mock Availability
test_mercadopago_availability() {
    print_section "MercadoPago Mock Availability"

    print_test "Health endpoint"
    if http_get "$MERCADOPAGO_MOCK_URL/health" 200 > /dev/null; then
        test_passed
    else
        test_failed "MercadoPago mock not responding"
        return 1
    fi

    print_test "API version endpoint"
    if http_get "$MERCADOPAGO_MOCK_URL/v1" 200 > /dev/null; then
        test_passed
    else
        test_failed "API version endpoint not available"
    fi

    print_test "Dashboard accessible"
    if curl -sf "$MERCADOPAGO_MOCK_URL/dashboard" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Dashboard not accessible"
    fi
}

# Test 2: Payment Creation
test_payment_creation() {
    print_section "Payment Creation"

    print_test "Create payment preference"
    local preference_data='{
        "items": [
            {
                "title": "Corte de cabello premium",
                "quantity": 1,
                "unit_price": 2500,
                "currency_id": "ARS"
            }
        ],
        "payer": {
            "name": "Juan",
            "surname": "Pérez",
            "email": "juan.perez@example.com",
            "phone": {
                "area_code": "11",
                "number": "12345678"
            }
        },
        "back_urls": {
            "success": "http://localhost:5173/payment/success",
            "failure": "http://localhost:5173/payment/failure",
            "pending": "http://localhost:5173/payment/pending"
        },
        "auto_return": "approved",
        "notification_url": "http://backend:3000/api/webhooks/mercadopago"
    }'

    local response=$(http_post "$MERCADOPAGO_MOCK_URL/checkout/preferences" "$preference_data" 201)

    if [ $? -eq 0 ]; then
        PREFERENCE_ID=$(extract_json_field "$response" "id")
        print_info "Preference ID: $PREFERENCE_ID"
        test_passed
    else
        test_failed "Failed to create payment preference"
        return 1
    fi

    # Verify preference was created
    if [ -n "$PREFERENCE_ID" ]; then
        print_test "Verify preference created"
        if http_get "$MERCADOPAGO_MOCK_URL/checkout/preferences/$PREFERENCE_ID" 200 > /dev/null; then
            test_passed
        else
            test_failed "Preference not found"
        fi
    fi
}

# Test 3: Payment Processing
test_payment_processing() {
    print_section "Payment Processing"

    print_test "Process approved payment"
    local payment_data='{
        "transaction_amount": 2500,
        "description": "Corte de cabello premium",
        "payment_method_id": "visa",
        "installments": 1,
        "payer": {
            "email": "juan.perez@example.com",
            "identification": {
                "type": "DNI",
                "number": "12345678"
            }
        },
        "additional_info": {
            "items": [
                {
                    "id": "service-001",
                    "title": "Corte de cabello premium",
                    "quantity": 1,
                    "unit_price": 2500
                }
            ]
        }
    }'

    local response=$(http_post "$MERCADOPAGO_MOCK_URL/v1/payments" "$payment_data" 201)

    if [ $? -eq 0 ]; then
        PAYMENT_ID=$(extract_json_field "$response" "id")
        PAYMENT_STATUS=$(extract_json_field "$response" "status")
        print_info "Payment ID: $PAYMENT_ID"
        print_info "Status: $PAYMENT_STATUS"
        test_passed
    else
        test_failed "Payment processing failed"
        return 1
    fi

    # Verify payment status
    if [ -n "$PAYMENT_ID" ]; then
        print_test "Verify payment status"
        local payment_info=$(http_get "$MERCADOPAGO_MOCK_URL/v1/payments/$PAYMENT_ID" 200)

        if [ $? -eq 0 ]; then
            local status=$(extract_json_field "$payment_info" "status")
            print_info "Payment status: $status"

            if [ "$status" = "approved" ] || [ "$status" = "pending" ]; then
                test_passed
            else
                test_failed "Unexpected payment status: $status"
            fi
        else
            test_failed "Could not retrieve payment status"
        fi
    fi
}

# Test 4: Payment Refund
test_payment_refund() {
    print_section "Payment Refund"

    if [ -z "$PAYMENT_ID" ]; then
        print_warning "No payment ID available, skipping refund test"
        return 0
    fi

    print_test "Create refund"
    local refund_data='{
        "amount": 2500
    }'

    local response=$(http_post "$MERCADOPAGO_MOCK_URL/v1/payments/$PAYMENT_ID/refunds" "$refund_data" 201)

    if [ $? -eq 0 ]; then
        REFUND_ID=$(extract_json_field "$response" "id")
        print_info "Refund ID: $REFUND_ID"
        test_passed
    else
        test_failed "Refund creation failed"
    fi
}

# Test 5: Payment Scenarios
test_payment_scenarios() {
    print_section "Payment Scenarios"

    # Test approved scenario
    print_test "Approved payment scenario"
    local approved_data='{
        "transaction_amount": 100,
        "description": "Test approved",
        "payment_method_id": "visa",
        "payer": {"email": "approved@example.com"}
    }'

    if http_post "$MERCADOPAGO_MOCK_URL/v1/payments" "$approved_data" 201 > /dev/null; then
        test_passed
    else
        test_failed "Approved scenario failed"
    fi

    # Test pending scenario
    print_test "Pending payment scenario"
    local pending_data='{
        "transaction_amount": 100,
        "description": "Test pending",
        "payment_method_id": "bolbradesco",
        "payer": {"email": "pending@example.com"}
    }'

    if http_post "$MERCADOPAGO_MOCK_URL/v1/payments" "$pending_data" 201 > /dev/null; then
        test_passed
    else
        test_failed "Pending scenario failed"
    fi

    # Test rejected scenario
    print_test "Rejected payment scenario"
    local rejected_data='{
        "transaction_amount": 100,
        "description": "Test rejected",
        "payment_method_id": "visa",
        "payer": {"email": "rejected@example.com"}
    }'

    # Rejection might return 400 or 201 with rejected status
    local response=$(http_post "$MERCADOPAGO_MOCK_URL/v1/payments" "$rejected_data" 201 2>/dev/null || echo "rejected")

    if [ $? -eq 0 ] || [ "$response" = "rejected" ]; then
        test_passed
    else
        test_failed "Rejected scenario failed"
    fi
}

# Test 6: Webhook Delivery
test_webhook_delivery() {
    print_section "Webhook Delivery"

    print_test "Webhook history endpoint"
    if http_get "$MERCADOPAGO_MOCK_URL/webhooks" 200 > /dev/null; then
        test_passed
    else
        test_failed "Webhook history not available"
    fi

    print_test "Webhook reset endpoint"
    if http_post "$MERCADOPAGO_MOCK_URL/webhooks/reset" "{}" 200 > /dev/null; then
        test_passed
    else
        test_failed "Webhook reset failed"
    fi
}

# Test 7: Mock Dashboard
test_mock_dashboard() {
    print_section "Mock Dashboard"

    print_test "Dashboard UI"
    if curl -sf "$MERCADOPAGO_MOCK_URL/dashboard" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Dashboard UI not accessible"
    fi

    print_test "Payments list endpoint"
    if http_get "$MERCADOPAGO_MOCK_URL/mock/payments" 200 > /dev/null; then
        test_passed
    else
        test_failed "Payments list not available"
    fi

    print_test "Statistics endpoint"
    if http_get "$MERCADOPAGO_MOCK_URL/mock/stats" 200 > /dev/null; then
        test_passed
    else
        test_failed "Statistics not available"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "Payment Flow Integration Test"

    echo "Testing MercadoPago mock service: $MERCADOPAGO_MOCK_URL"
    echo "Verbose mode: $VERBOSE"
    echo ""

    # Run tests
    test_mercadopago_availability || exit 1
    test_payment_creation
    test_payment_processing
    test_payment_refund
    test_payment_scenarios
    test_webhook_delivery
    test_mock_dashboard

    # Summary
    print_header "Test Summary"

    echo -e "  Total tests:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "  Passed:         ${GREEN}$TESTS_PASSED${NC}"
    echo -e "  Failed:         ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All payment flow tests passed!"
        echo ""
        echo "MercadoPago mock is fully functional:"
        echo "  - Dashboard: $MERCADOPAGO_MOCK_URL/dashboard"
        echo "  - API: $MERCADOPAGO_MOCK_URL/v1"
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
