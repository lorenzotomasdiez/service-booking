# BarberPro Payment Testing Guide

## Overview
This guide covers comprehensive testing procedures for BarberPro's payment system integration with MercadoPago and Argentina-specific payment features.

## Test Coverage

### 1. Unit Tests
**Location**: `tests/unit/services/payment.test.ts`

**Coverage Areas**:
- Payment creation with MercadoPago integration
- Argentina phone number and DNI validation
- Commission calculation (3.5%, 2.8%, 2.5% tiers)
- Payment method validation (credit_card, debit_card, rapipago, pagofacil, account_money)
- Retry logic with exponential backoff
- Webhook processing for payment status updates
- Cancellation with penalty calculation
- Refund processing (full and partial)
- Error handling and security measures

**Key Test Scenarios**:
```typescript
// Payment Method Validation
- Credit card: 100-999999 ARS, 1-12 installments
- Debit card: 50-500000 ARS, 1 installment only
- Rapipago/Pago Fácil: 100-50000 ARS, cash limits
- Bank transfer: 200-1000000 ARS
- MercadoPago wallet: 50-999999 ARS

// Commission Tiers
- Standard (0-49 bookings): 3.5%
- High Volume (50-99 bookings): 2.8% 
- Premium (100+ bookings): 2.5%

// Cancellation Penalties
- <24 hours: 20% penalty
- 24-48 hours: 10% penalty
- >48 hours: No penalty
```

### 2. Integration Tests
**Location**: `tests/integration/payment-routes.test.ts`

**Coverage Areas**:
- End-to-end payment API testing
- Authentication and authorization
- Database integration
- MercadoPago webhook simulation
- Error response validation
- Payment flow completion

**API Endpoints Tested**:
```
POST /api/payments - Create payment
GET /api/payments/:id - Get payment details
POST /api/payments/:id/refund - Process refund
POST /api/payments/cancel - Cancel with refund
GET /api/payments/:id/status - Status tracking
POST /api/payments/:id/retry - Retry failed payment
POST /api/payments/webhooks/mercadopago - Webhook handler
GET /api/payments/config - Payment configuration
GET /api/payments/analytics - Payment analytics
```

### 3. Security Testing

**Implemented Security Measures**:
- PCI DSS compliance headers
- Payment data encryption (AES-256)
- Webhook signature validation
- Rate limiting (10 requests/15 minutes)
- IP whitelist for webhooks
- Sensitive data sanitization in logs
- Request timeout protection

**Security Test Cases**:
- Unauthorized payment access attempts
- Invalid webhook signatures
- SQL injection attempts in payment data
- Rate limiting enforcement
- Sensitive data exposure prevention

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test database
createdb barberpro_test
npx prisma migrate deploy
```

### Test Commands
```bash
# Run all payment tests
npm run test:unit -- payment
npm run test:integration -- payment

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- tests/unit/services/payment.test.ts
npm test -- tests/integration/payment-routes.test.ts

# Watch mode for development
npm run test:watch -- payment
```

### Environment Setup
Create `.env.test` file:
```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/barberpro_test

# MercadoPago Test Configuration
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-ACCESS-TOKEN
MERCADOPAGO_PUBLIC_KEY_TEST=TEST-PUBLIC-KEY
MERCADOPAGO_WEBHOOK_SECRET_TEST=test-webhook-secret

# Payment Configuration
PAYMENT_DATA_ENCRYPTION_KEY=test-encryption-key-32-characters-long
PLATFORM_COMMISSION_STANDARD=0.035
PLATFORM_COMMISSION_HIGH_VOLUME=0.028
PLATFORM_COMMISSION_PREMIUM=0.025

# Security Configuration (disabled for tests)
WEBHOOK_SIGNATURE_VALIDATION=false
PCI_COMPLIANCE_MODE=false
TAX_WITHHOLDING_ENABLED=false
AFIP_INTEGRATION_ENABLED=false

# Enable test simulations
ENABLE_PAYMENT_SIMULATION=true
TEST_PAYMENT_SUCCESS_RATE=0.95
```

## Test Scenarios and Expected Results

### 1. Payment Creation Tests

**Scenario**: Valid payment request
```json
{
  "bookingId": "booking-123",
  "amount": 2500.00,
  "currency": "ARS",
  "description": "Corte de cabello y barba",
  "clientEmail": "juan.perez@example.com",
  "clientName": "Juan Carlos Pérez",
  "clientPhone": "+5491123456789",
  "clientDni": "12345678",
  "returnUrls": {
    "success": "https://barberpro.com.ar/payment/success",
    "failure": "https://barberpro.com.ar/payment/failure",
    "pending": "https://barberpro.com.ar/payment/pending"
  }
}
```

**Expected Result**:
- Status: 201 Created
- Response includes: preferenceId, initPoint, sandboxInitPoint
- Database record created with PENDING status
- Commission calculated correctly based on provider tier

### 2. Payment Method Validation Tests

**Test Cases**:
```javascript
// Valid credit card payment
{ amount: 1000, installments: 6, paymentMethod: 'credit_card' } // ✅

// Invalid debit card installments
{ amount: 1000, installments: 3, paymentMethod: 'debit_card' } // ❌

// Invalid Rapipago amount
{ amount: 60000, installments: 1, paymentMethod: 'rapipago' } // ❌

// Valid bank transfer
{ amount: 5000, installments: 1, paymentMethod: 'bank_transfer' } // ✅
```

### 3. Retry Logic Tests

**Retryable Errors**:
- Network timeouts (ETIMEDOUT)
- Server errors (500-599)
- Rate limiting (429)
- Connection errors

**Non-Retryable Errors**:
- Validation errors (400)
- Authentication errors (401)
- Not found errors (404)

**Expected Behavior**:
- Max 3 retry attempts
- Exponential backoff: 1s, 2s, 4s delays
- Audit logging for each retry attempt

### 4. Webhook Processing Tests

**Payment Approved Webhook**:
```json
{
  "id": 1234567890,
  "live_mode": false,
  "type": "payment",
  "action": "payment.updated",
  "data": { "id": "987654321" }
}
```

**Expected Processing**:
- Payment status updated to 'PAID'
- Booking status updated to 'PAID'
- Commission processing triggered
- Provider payout scheduled (10-day hold)

### 5. Cancellation and Refund Tests

**Same-day Cancellation (20% penalty)**:
- Original amount: $2500
- Penalty: $500 (20%)
- Refund: $2000

**Two-day Cancellation (10% penalty)**:
- Original amount: $2500
- Penalty: $250 (10%)
- Refund: $2250

**Week-ahead Cancellation (no penalty)**:
- Original amount: $2500
- Penalty: $0
- Refund: $2500

## Performance Benchmarks

### Expected Response Times
- Payment creation: <2 seconds
- Payment status check: <500ms
- Refund processing: <3 seconds
- Webhook processing: <1 second

### Throughput Targets
- 100 concurrent payment requests
- 95% success rate under load
- Error rate <5% during peak usage

## Error Codes and Troubleshooting

### Common Error Codes
```
VALIDATION_ERROR - Invalid request parameters
GATEWAY_ERROR - MercadoPago API error
BOOKING_NOT_FOUND - Invalid booking ID
PAYMENT_ALREADY_EXISTS - Duplicate payment attempt
UNAUTHORIZED - Invalid authentication
PAYMENT_NOT_FOUND - Invalid payment ID
PAYMENT_NOT_RETRIABLE - Cannot retry payment in current state
```

### Troubleshooting Steps
1. **Payment Creation Fails**:
   - Check MercadoPago credentials
   - Verify booking exists and user has access
   - Validate request parameters
   - Check rate limiting

2. **Webhook Not Processing**:
   - Verify webhook URL accessibility
   - Check signature validation
   - Review IP whitelist
   - Validate payload format

3. **Refund Fails**:
   - Ensure payment is in PAID status
   - Verify provider authorization
   - Check refund amount validity
   - Review MercadoPago refund limits

## Monitoring and Alerts

### Key Metrics to Monitor
- Payment success rate (target: >95%)
- Average payment processing time
- Webhook processing latency
- Refund processing success rate
- Commission calculation accuracy

### Alert Conditions
- Payment success rate drops below 90%
- Response time exceeds 5 seconds
- Webhook failures exceed 5% rate
- Multiple payment gateway errors

## Test Data Management

### Test Fixtures
- Sample users (client, provider, admin)
- Test services and bookings
- Mock MercadoPago responses
- Error scenario simulations

### Data Cleanup
- Automated cleanup between tests
- Test database isolation
- Mock external service calls
- Sensitive data sanitization

## Argentina-Specific Test Considerations

### Phone Number Validation
```
Valid: +5491123456789, +5421134567890
Invalid: +1234567890, 123456789
```

### DNI Validation
```
Valid: 12345678, 87654321
Invalid: 123456, abcd1234
```

### Currency and Amounts
```
Currency: ARS only
Minimum amounts vary by payment method
Maximum amounts enforced for cash payments
```

### Timezone Handling
```
Timezone: America/Argentina/Buenos_Aires
Payment expiration calculated in local time
Cancellation penalties based on Argentina time
```

This testing guide ensures comprehensive coverage of BarberPro's payment system, with particular attention to Argentina's payment ecosystem and MercadoPago integration requirements.