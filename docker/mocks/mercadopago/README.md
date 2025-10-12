# MercadoPago Mock Server

A lightweight mock server that simulates the MercadoPago payment gateway API for local development and testing. Supports all payment methods used in Argentina including cards, wallets, and cash payment methods.

## Features

- Complete payment flow simulation
- Multiple payment methods (Visa, Mastercard, Amex, Rapipago, Pago Facil, etc.)
- Configurable response scenarios
- Webhook simulation with delays
- Payment status transitions
- Refund processing
- Transaction history (in-memory)
- Web dashboard for monitoring
- Swagger/OpenAPI documentation
- Health check endpoint
- Argentina-specific payment methods

## Quick Start

### Using Docker (Recommended)

```bash
# Build the image
docker build -t mercadopago-mock .

# Run the container
docker run -p 3001:3001 \
  -e MERCADOPAGO_MOCK_WEBHOOK_URL=http://your-app:3000/webhooks/mercadopago \
  mercadopago-mock
```

### Using Docker Compose

```bash
# From the repository root
docker-compose -f docker/docker-compose.mocks.yml up mercadopago-mock
```

### Standalone (Development)

```bash
# Install dependencies
npm install

# Start server
npm start

# Or with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MERCADOPAGO_MOCK_PORT` | `3001` | Server port |
| `MERCADOPAGO_MOCK_WEBHOOK_URL` | - | Default webhook URL for notifications |
| `MERCADOPAGO_MOCK_DEFAULT_SCENARIO` | `success` | Default payment scenario |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |

## API Endpoints

### Health & Monitoring

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-12T10:30:00.000Z",
  "uptime": 3600.5,
  "service": "mercadopago-mock"
}
```

#### GET /dashboard
Returns dashboard data with statistics and recent payments.

**Response:**
```json
{
  "statistics": {
    "total_payments": 10,
    "approved": 8,
    "pending": 1,
    "rejected": 1,
    "total_amount": 1500.00,
    "total_refunded": 100.00
  },
  "recent_payments": [...]
}
```

### Payments API

#### POST /v1/payments
Create a new payment.

**Query Parameters:**
- `scenario` (optional): Scenario name (success, pending, rejected, etc.)

**Request Body:**
```json
{
  "transaction_amount": 100,
  "payment_method_id": "visa",
  "payer": {
    "email": "test@example.com",
    "first_name": "Juan",
    "last_name": "Perez",
    "identification": {
      "type": "DNI",
      "number": "12345678"
    }
  },
  "installments": 1,
  "description": "Test payment",
  "external_reference": "ORDER-123",
  "notification_url": "http://your-app:3000/webhooks/mercadopago"
}
```

**Response (201):**
```json
{
  "id": 1000000001,
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 100,
  "date_created": "2025-10-12T10:30:00.000Z",
  "date_approved": "2025-10-12T10:30:00.000Z",
  "payer": {...},
  "payment_method_id": "visa",
  ...
}
```

#### GET /v1/payments/:id
Get payment by ID.

**Response (200):**
```json
{
  "id": 1000000001,
  "status": "approved",
  ...
}
```

#### POST /v1/payments/:id/refunds
Create a refund for a payment.

**Request Body:**
```json
{
  "amount": 50
}
```

**Response (201):**
```json
{
  "id": 2000000001,
  "payment_id": 1000000001,
  "amount": 50,
  "status": "approved",
  "date_created": "2025-10-12T10:35:00.000Z"
}
```

#### GET /v1/payment_methods
Get available payment methods.

**Response (200):**
```json
[
  {
    "id": "visa",
    "name": "Visa",
    "payment_type_id": "credit_card",
    "status": "active",
    ...
  },
  ...
]
```

### Admin/Testing Endpoints

#### GET /admin/payments
Get all payments (for debugging).

#### DELETE /admin/payments
Clear all payments (for testing).

#### POST /admin/webhook/test
Manually trigger a webhook.

**Request Body:**
```json
{
  "payment_id": 1000000001,
  "webhook_url": "http://your-app:3000/webhooks/mercadopago"
}
```

#### GET /admin/statistics
Get payment statistics.

## Scenarios

Configure different payment outcomes using the `scenario` query parameter:

### Available Scenarios

| Scenario | Status | Status Detail | Description |
|----------|--------|---------------|-------------|
| `success` | approved | accredited | Successful payment |
| `pending` | pending | pending_waiting_payment | Pending payment |
| `pending_contingency` | pending | pending_contingency | Payment in review |
| `rejected_insufficient_amount` | rejected | cc_rejected_insufficient_amount | Insufficient funds |
| `rejected_bad_filled` | rejected | cc_rejected_bad_filled_card_number | Invalid card number |
| `rejected_call_for_authorize` | rejected | cc_rejected_call_for_authorize | Card needs authorization |
| `rejected_card_disabled` | rejected | cc_rejected_card_disabled | Card disabled |
| `rejected_high_risk` | rejected | cc_rejected_high_risk | High risk transaction |
| `timeout` | - | - | Simulates timeout (30s) |
| `network_error` | - | - | Simulates network error |

### Using Scenarios

```bash
# Successful payment
curl -X POST http://localhost:3001/v1/payments?scenario=success \
  -H "Content-Type: application/json" \
  -d '{"transaction_amount": 100, "payment_method_id": "visa", "payer": {"email": "test@example.com"}}'

# Rejected payment
curl -X POST http://localhost:3001/v1/payments?scenario=rejected_insufficient_amount \
  -H "Content-Type: application/json" \
  -d '{"transaction_amount": 100, "payment_method_id": "visa", "payer": {"email": "test@example.com"}}'
```

## Payment Methods

### Credit Cards
- Visa (`visa`)
- Mastercard (`master`)
- American Express (`amex`)

### Debit Cards
- Visa Débito (`debvisa`)
- Mastercard Débito (`debmaster`)

### Cash Payment Methods (Argentina)
- Rapipago (`rapipago`)
- Pago Fácil (`pagofacil`)

### Digital Wallet
- MercadoPago Wallet (`account_money`)

## Webhooks

The mock server automatically sends webhooks when:
- A payment is created (`payment.created`)
- A payment status changes (`payment.updated`)
- A refund is processed (`payment.updated`)

### Webhook Format

```json
{
  "id": 3000000001,
  "live_mode": false,
  "type": "payment",
  "date_created": "2025-10-12T10:30:00.000Z",
  "application_id": "123456789",
  "user_id": "987654321",
  "version": 1,
  "api_version": "v1",
  "action": "payment.created",
  "data": {
    "id": "1000000001"
  }
}
```

### Webhook Headers

- `Content-Type`: application/json
- `x-signature`: Webhook signature (mock implementation)
- `x-request-id`: Webhook ID

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Web Dashboard

Access the web dashboard at: `http://localhost:3001/`

Features:
- Real-time payment statistics
- Recent payments list
- Clear all payments (testing)
- Auto-refresh every 10 seconds

## Swagger Documentation

Interactive API documentation available at: `http://localhost:3001/docs`

## Usage Examples

### Create a Simple Payment

```javascript
const axios = require('axios');

const payment = await axios.post('http://localhost:3001/v1/payments', {
  transaction_amount: 100,
  payment_method_id: 'visa',
  payer: {
    email: 'test@example.com'
  }
});

console.log('Payment ID:', payment.data.id);
console.log('Status:', payment.data.status);
```

### Create Payment with Installments

```javascript
const payment = await axios.post('http://localhost:3001/v1/payments', {
  transaction_amount: 1200,
  payment_method_id: 'visa',
  installments: 12,
  payer: {
    email: 'test@example.com',
    first_name: 'Juan',
    last_name: 'Perez'
  }
});
```

### Create Rapipago Payment (Cash)

```javascript
const payment = await axios.post('http://localhost:3001/v1/payments?scenario=pending', {
  transaction_amount: 500,
  payment_method_id: 'rapipago',
  payer: {
    email: 'test@example.com',
    first_name: 'Juan',
    last_name: 'Perez',
    identification: {
      type: 'DNI',
      number: '12345678'
    }
  }
});

// Payment will be pending until "paid" at Rapipago
console.log('Payment code:', payment.data.id);
```

### Process Refund

```javascript
const refund = await axios.post(
  `http://localhost:3001/v1/payments/${paymentId}/refunds`,
  {
    amount: 50  // Partial refund
  }
);

console.log('Refund ID:', refund.data.id);
```

## Differences from Real MercadoPago API

This mock server is designed for development and testing. Key differences:

1. **Authentication**: No OAuth/API key required
2. **Webhooks**: Instant delivery (no retry logic)
3. **Payment Processing**: Instant responses (no actual processing)
4. **Card Validation**: No real card validation
5. **Installment Calculation**: Simplified (no actual interest rates)
6. **Transaction Limits**: Not enforced
7. **Rate Limiting**: Not implemented
8. **HTTPS**: Not required
9. **Signatures**: Simplified signature generation
10. **Data Persistence**: In-memory only (resets on restart)

## Troubleshooting

### Webhooks Not Being Received

1. Check webhook URL is accessible from container
2. Verify firewall/network settings
3. Check logs: `docker logs mercadopago-mock`
4. Test webhook manually: POST `/admin/webhook/test`

### Tests Failing

1. Ensure no other service is using port 3001
2. Clear all payments: DELETE `/admin/payments`
3. Check environment variables
4. Run with debug logging: `LOG_LEVEL=debug npm test`

### Container Won't Start

1. Check port 3001 is available
2. Verify Docker network configuration
3. Check logs: `docker logs mercadopago-mock`

## Development

### Project Structure

```
mercadopago/
├── config/
│   └── scenarios.json       # Payment scenarios configuration
├── public/
│   └── index.html          # Web dashboard
├── routes/
│   └── payments.js         # Payment API routes
├── services/
│   ├── payment.service.js  # Payment business logic
│   └── webhook.service.js  # Webhook delivery
├── tests/
│   ├── payment.test.js     # Unit tests
│   └── webhook.test.js     # Integration tests
├── utils/
│   └── logger.js           # Winston logger
├── index.js                # Express server
├── package.json
├── Dockerfile
└── README.md
```

### Adding New Scenarios

Edit `config/scenarios.json`:

```json
{
  "scenarios": {
    "my_scenario": {
      "status": "pending",
      "status_detail": "pending_review",
      "delay_ms": 2000
    }
  }
}
```

### Adding New Payment Methods

Edit `config/scenarios.json` under `payment_methods`:

```json
{
  "payment_methods": {
    "credit_card": [
      {
        "id": "new_card",
        "name": "New Card",
        "payment_type_id": "credit_card",
        ...
      }
    ]
  }
}
```

## License

MIT

## Support

For issues and questions:
- Create an issue in the repository
- Check the Swagger docs at `/docs`
- Review the test files for usage examples

## Related Links

- [MercadoPago Official Documentation](https://www.mercadopago.com.ar/developers/en/reference)
- [MercadoPago Test Cards](https://www.mercadopago.com.ar/developers/en/guides/testing)
- [BarberPro Project](https://github.com/lorenzotomasdiez/service-booking)
