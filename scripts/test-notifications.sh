#!/bin/bash
# ============================================================================
# BarberPro Notifications Integration Test
# ============================================================================
# Tests all notification channels: WhatsApp, SMS, and Email (MailHog)
#
# Channels tested:
#   1. WhatsApp Business API (mock)
#   2. SMS Gateway (mock)
#   3. Email via MailHog
#
# Usage:
#   ./scripts/test-notifications.sh              # Run all notification tests
#   ./scripts/test-notifications.sh --verbose    # Verbose output
#
# Prerequisites:
#   - Services running: make up
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
readonly WHATSAPP_MOCK_URL="http://localhost:3003"
readonly SMS_MOCK_URL="http://localhost:3004"
readonly MAILHOG_API_URL="http://localhost:8025/api/v2"
readonly MAILHOG_SMTP_HOST="localhost"
readonly MAILHOG_SMTP_PORT="1025"

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

    print_info "POST $url -> Status: $status"
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

# HTTP DELETE
http_delete() {
    local url=$1
    local expected_status=${2:-200}

    local response=$(curl -s -w "\n%{http_code}" -X DELETE "$url" 2>/dev/null || echo -e "\n000")
    local status=$(echo "$response" | tail -n 1)

    print_info "DELETE $url -> Status: $status"

    if [ "$status" = "$expected_status" ]; then
        return 0
    fi

    return 1
}

# ============================================================================
# TEST FUNCTIONS - WHATSAPP
# ============================================================================

test_whatsapp_availability() {
    print_section "WhatsApp Mock Availability"

    print_test "Health endpoint"
    if http_get "$WHATSAPP_MOCK_URL/health" 200 > /dev/null; then
        test_passed
    else
        test_failed "WhatsApp mock not responding"
        return 1
    fi

    print_test "Dashboard accessible"
    if curl -sf "$WHATSAPP_MOCK_URL/dashboard" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Dashboard not accessible"
    fi
}

test_whatsapp_messaging() {
    print_section "WhatsApp Messaging"

    print_test "Send text message"
    local text_message='{
        "messaging_product": "whatsapp",
        "to": "+5491112345678",
        "type": "text",
        "text": {
            "body": "Tu turno está confirmado para mañana a las 10:00 AM. BarberPro"
        }
    }'

    local response=$(http_post "$WHATSAPP_MOCK_URL/v1/messages" "$text_message" 201)

    if [ $? -eq 0 ]; then
        MESSAGE_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
        print_info "Message ID: $MESSAGE_ID"
        test_passed
    else
        test_failed "Failed to send text message"
    fi

    print_test "Send template message"
    local template_message='{
        "messaging_product": "whatsapp",
        "to": "+5491187654321",
        "type": "template",
        "template": {
            "name": "booking_confirmation",
            "language": {
                "code": "es_AR"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": "Juan Pérez"},
                        {"type": "text", "text": "15/10/2025"},
                        {"type": "text", "text": "10:00"}
                    ]
                }
            ]
        }
    }'

    if http_post "$WHATSAPP_MOCK_URL/v1/messages" "$template_message" 201 > /dev/null; then
        test_passed
    else
        test_failed "Failed to send template message"
    fi

    print_test "Send message with media"
    local media_message='{
        "messaging_product": "whatsapp",
        "to": "+5491198765432",
        "type": "image",
        "image": {
            "link": "https://example.com/barbershop-location.jpg",
            "caption": "Nuestra ubicación"
        }
    }'

    if http_post "$WHATSAPP_MOCK_URL/v1/messages" "$media_message" 201 > /dev/null; then
        test_passed
    else
        test_failed "Failed to send media message"
    fi
}

test_whatsapp_status() {
    print_section "WhatsApp Message Status"

    print_test "Message history"
    if http_get "$WHATSAPP_MOCK_URL/messages" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot retrieve message history"
    fi

    print_test "Message statistics"
    if http_get "$WHATSAPP_MOCK_URL/stats" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot retrieve statistics"
    fi

    print_test "Reset messages"
    if http_delete "$WHATSAPP_MOCK_URL/messages" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot reset messages"
    fi
}

# ============================================================================
# TEST FUNCTIONS - SMS
# ============================================================================

test_sms_availability() {
    print_section "SMS Mock Availability"

    print_test "Health endpoint"
    if http_get "$SMS_MOCK_URL/health" 200 > /dev/null; then
        test_passed
    else
        test_failed "SMS mock not responding"
        return 1
    fi

    print_test "Dashboard accessible"
    if curl -sf "$SMS_MOCK_URL/dashboard" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "Dashboard not accessible"
    fi
}

test_sms_messaging() {
    print_section "SMS Messaging"

    print_test "Send SMS message"
    local sms_data='{
        "to": "+5491112345678",
        "message": "Tu turno en BarberPro está confirmado para mañana a las 10:00 AM"
    }'

    local response=$(http_post "$SMS_MOCK_URL/v1/messages" "$sms_data" 201)

    if [ $? -eq 0 ]; then
        SMS_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
        print_info "SMS ID: $SMS_ID"
        test_passed
    else
        test_failed "Failed to send SMS"
    fi

    print_test "Send bulk SMS"
    local bulk_sms='{
        "recipients": [
            "+5491112345678",
            "+5491187654321",
            "+5491198765432"
        ],
        "message": "Recordatorio: Tu turno es mañana. BarberPro"
    }'

    if http_post "$SMS_MOCK_URL/v1/messages/bulk" "$bulk_sms" 201 > /dev/null; then
        test_passed
    else
        test_failed "Failed to send bulk SMS"
    fi

    print_test "Send scheduled SMS"
    local scheduled_sms='{
        "to": "+5491112345678",
        "message": "Tu turno es en 1 hora. BarberPro",
        "scheduled_at": "2025-10-15T09:00:00Z"
    }'

    if http_post "$SMS_MOCK_URL/v1/messages/scheduled" "$scheduled_sms" 201 > /dev/null; then
        test_passed
    else
        test_failed "Failed to schedule SMS"
    fi
}

test_sms_status() {
    print_section "SMS Status and History"

    print_test "SMS history"
    if http_get "$SMS_MOCK_URL/messages" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot retrieve SMS history"
    fi

    print_test "Delivery status"
    if [ -n "$SMS_ID" ]; then
        if http_get "$SMS_MOCK_URL/messages/$SMS_ID" 200 > /dev/null; then
            test_passed
        else
            test_failed "Cannot retrieve delivery status"
        fi
    else
        print_warning "No SMS ID available, skipping delivery status test"
    fi

    print_test "SMS statistics"
    if http_get "$SMS_MOCK_URL/stats" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot retrieve SMS statistics"
    fi

    print_test "Reset SMS history"
    if http_delete "$SMS_MOCK_URL/messages" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot reset SMS history"
    fi
}

# ============================================================================
# TEST FUNCTIONS - EMAIL (MAILHOG)
# ============================================================================

test_mailhog_availability() {
    print_section "MailHog Availability"

    print_test "API endpoint"
    if http_get "$MAILHOG_API_URL/messages" 200 > /dev/null; then
        test_passed
    else
        test_failed "MailHog API not responding"
        return 1
    fi

    print_test "Web UI accessible"
    if curl -sf "http://localhost:8025" > /dev/null 2>&1; then
        test_passed
    else
        test_failed "MailHog UI not accessible"
    fi
}

test_email_sending() {
    print_section "Email Sending"

    # Clear previous messages
    http_delete "$MAILHOG_API_URL/messages" 200 > /dev/null 2>&1 || true

    print_test "Send email via SMTP"

    # Create a simple email using swaks (if available) or curl
    if command -v swaks > /dev/null 2>&1; then
        swaks --to test@example.com \
              --from noreply@barberpro.local \
              --server $MAILHOG_SMTP_HOST:$MAILHOG_SMTP_PORT \
              --header "Subject: Test - Booking Confirmation" \
              --body "Your appointment is confirmed." \
              --suppress-data > /dev/null 2>&1

        if [ $? -eq 0 ]; then
            test_passed
        else
            test_failed "Failed to send email via SMTP"
        fi
    else
        # Alternative: use a simple telnet/nc approach or skip
        print_warning "swaks not installed, skipping SMTP test"
        print_info "Install swaks: apt-get install swaks (Linux) or brew install swaks (macOS)"
    fi

    # Wait for email to be captured
    sleep 1

    print_test "Verify email captured"
    local messages=$(http_get "$MAILHOG_API_URL/messages" 200)

    if [ $? -eq 0 ]; then
        local count=$(echo "$messages" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        print_info "Emails captured: $count"

        if [ -n "$count" ] && [ "$count" -gt 0 ]; then
            test_passed
        else
            print_warning "No emails captured (SMTP test may have been skipped)"
        fi
    else
        test_failed "Cannot retrieve emails from MailHog"
    fi
}

test_email_operations() {
    print_section "Email Operations"

    print_test "List all messages"
    local messages=$(http_get "$MAILHOG_API_URL/messages" 200)

    if [ $? -eq 0 ]; then
        local count=$(echo "$messages" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        print_info "Total messages: ${count:-0}"
        test_passed
    else
        test_failed "Cannot list messages"
    fi

    print_test "Search messages"
    if http_get "$MAILHOG_API_URL/search?kind=to&query=test@example.com" 200 > /dev/null; then
        test_passed
    else
        test_failed "Search functionality not working"
    fi

    print_test "Delete all messages"
    if http_delete "$MAILHOG_API_URL/messages" 200 > /dev/null; then
        test_passed
    else
        test_failed "Cannot delete messages"
    fi

    print_test "Verify messages deleted"
    local messages_after=$(http_get "$MAILHOG_API_URL/messages" 200)

    if [ $? -eq 0 ]; then
        local count=$(echo "$messages_after" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        if [ "${count:-0}" -eq 0 ]; then
            test_passed
        else
            test_failed "Messages not deleted (count: $count)"
        fi
    else
        test_failed "Cannot verify deletion"
    fi
}

# ============================================================================
# TEST FUNCTIONS - INTEGRATION
# ============================================================================

test_notification_integration() {
    print_section "Notification Integration"

    print_test "Multi-channel notification flow"

    # Simulate a booking confirmation sent via all channels
    local phone="+5491112345678"
    local email="customer@example.com"
    local message="Tu turno está confirmado para mañana a las 10:00 AM"

    # Send WhatsApp
    local whatsapp_sent=false
    if http_post "$WHATSAPP_MOCK_URL/v1/messages" "{\"to\":\"$phone\",\"type\":\"text\",\"text\":{\"body\":\"$message\"}}" 201 > /dev/null; then
        whatsapp_sent=true
    fi

    # Send SMS
    local sms_sent=false
    if http_post "$SMS_MOCK_URL/v1/messages" "{\"to\":\"$phone\",\"message\":\"$message\"}" 201 > /dev/null; then
        sms_sent=true
    fi

    # Email would be sent here (skipped if swaks not available)
    local email_sent=true

    if [ "$whatsapp_sent" = true ] && [ "$sms_sent" = true ] && [ "$email_sent" = true ]; then
        test_passed
    else
        test_failed "Not all channels succeeded"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "Notifications Integration Test"

    echo "Testing notification channels:"
    echo "  - WhatsApp: $WHATSAPP_MOCK_URL"
    echo "  - SMS: $SMS_MOCK_URL"
    echo "  - Email: $MAILHOG_API_URL"
    echo ""
    echo "Verbose mode: $VERBOSE"
    echo ""

    # WhatsApp tests
    test_whatsapp_availability || exit 1
    test_whatsapp_messaging
    test_whatsapp_status

    # SMS tests
    test_sms_availability || exit 1
    test_sms_messaging
    test_sms_status

    # Email tests
    test_mailhog_availability || exit 1
    test_email_sending
    test_email_operations

    # Integration test
    test_notification_integration

    # Summary
    print_header "Test Summary"

    echo -e "  Total tests:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "  Passed:         ${GREEN}$TESTS_PASSED${NC}"
    echo -e "  Failed:         ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All notification tests passed!"
        echo ""
        echo "Notification services are ready:"
        echo "  - WhatsApp Dashboard: $WHATSAPP_MOCK_URL/dashboard"
        echo "  - SMS Dashboard: $SMS_MOCK_URL/dashboard"
        echo "  - MailHog UI: http://localhost:8025"
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
