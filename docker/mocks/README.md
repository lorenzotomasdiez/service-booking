# Argentina Service Mocks

Local mock servers for Argentina-specific external services used in the BarberPro platform. These mocks enable full-stack development and testing without requiring connections to real external services or API credentials.

## Overview

This directory contains 5 production-ready mock servers that simulate Argentina's critical payment, tax, and communication infrastructure:

| Service | Port | Purpose | Web Interface |
|---------|------|---------|---------------|
| **MercadoPago** | 3001 | Payment gateway for Argentina | http://localhost:3001/dashboard |
| **AFIP** | 3002 | Tax authority electronic invoicing | http://localhost:3002/docs |
| **WhatsApp** | 3003 | Business messaging API | http://localhost:3003/dashboard |
| **SMS** | 3004 | SMS gateway (Argentina +54) | http://localhost:3004/dashboard |
| **MailHog** | 1025 (SMTP)<br>8025 (UI) | Email capture and testing | http://localhost:8025 |

## Quick Start

### Start All Mocks

```bash
# From project root
make mocks
```

This command starts all 5 mock services with proper networking and health checks.

**Expected Output:**
```
[→] Starting Argentina mock services...
[✓] Mock services started

Mock services available at:
  MercadoPago: http://localhost:3001/dashboard
  AFIP:        http://localhost:3002/docs
  WhatsApp:    http://localhost:3003/dashboard
  SMS:         http://localhost:3004/dashboard
  Email:       http://localhost:8025
```

### Stop All Mocks

```bash
make mocks-down
```

### View Logs

```bash
# Follow logs from all mock services
make mocks-logs

# View logs for specific service
docker logs -f barberpro-mercadopago-mock
docker logs -f barberpro-afip-mock
docker logs -f barberpro-whatsapp-mock
docker logs -f barberpro-sms-mock
docker logs -f barberpro-mailhog
```

### Reset Mocks (Clear Data)

```bash
# Stop, remove volumes, and restart fresh
make mocks-reset
```

This clears all stored data (payments, invoices, messages, emails) and restarts services.

## Service Details

### 1. MercadoPago Mock (Port 3001)

**Purpose:** Simulates Argentina's primary payment gateway for credit cards, debit cards, and cash payment methods.

**Key Features:**
- Complete payment flow simulation (approved, pending, rejected)
- Multiple payment methods (Visa, Mastercard, Rapipago, Pago Fácil)
- Configurable response scenarios
- Webhook simulation with automatic callbacks
- Refund processing
- Real-time payment dashboard

**Web Interfaces:**
- **Dashboard:** http://localhost:3001/dashboard - View payment statistics and recent transactions
- **API Docs:** http://localhost:3001/docs - Interactive Swagger/OpenAPI documentation

**Health Check:**
```bash
curl http://localhost:3001/health
```

**Example Usage:**
```bash
# Create a payment (auto-approved)
curl -X POST http://localhost:3001/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_amount": 100,
    "payment_method_id": "visa",
    "payer": {
      "email": "test@example.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "identification": {
        "type": "DNI",
        "number": "12345678"
      }
    }
  }'

# Test rejection scenario
curl -X POST "http://localhost:3001/v1/payments?scenario=rejected_insufficient_amount" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_amount": 100,
    "payment_method_id": "visa",
    "payer": {"email": "test@example.com"}
  }'

# Get payment status
curl http://localhost:3001/v1/payments/1000000001

# Process refund
curl -X POST http://localhost:3001/v1/payments/1000000001/refunds \
  -H "Content-Type: application/json" \
  -d '{"amount": 50}'
```

**Available Scenarios:**
- `success` - Approved payment (default)
- `pending` - Pending payment (cash methods)
- `rejected_insufficient_amount` - Insufficient funds
- `rejected_bad_filled` - Invalid card number
- `rejected_call_for_authorize` - Needs authorization
- `rejected_card_disabled` - Card disabled
- `rejected_high_risk` - High risk transaction

**Documentation:** See [docker/mocks/mercadopago/README.md](./mercadopago/README.md)

---

### 2. AFIP Mock (Port 3002)

**Purpose:** Simulates AFIP (Administración Federal de Ingresos Públicos) WebServices for electronic invoice authorization (CAE).

**Key Features:**
- CUIT/CUIL validation with checksum verification
- CAE (Electronic Authorization Code) generation
- Electronic invoicing (WSFEv1) endpoints
- Invoice number sequencing per POS (Punto de Venta)
- IVA (VAT) calculation for different tax categories
- Taxpayer registry simulation (Padrón A5)
- SQLite persistence for invoice history

**Web Interfaces:**
- **API Docs:** http://localhost:3002/docs - Complete API documentation
- **Service Info:** http://localhost:3002/ - Endpoint list and configuration

**Health Check:**
```bash
curl http://localhost:3002/health
```

**Example Usage:**
```bash
# Validate CUIT
curl -X POST http://localhost:3002/validate/cuit \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20-12345678-6"}'

# Authenticate (get token)
curl -X POST http://localhost:3002/wsaa/auth \
  -H "Content-Type: application/json" \
  -d '{
    "cuit": "20-12345678-6",
    "service": "wsfev1"
  }'

# Create electronic invoice (request CAE)
curl -X POST http://localhost:3002/wsfev1/FECAESolicitar \
  -H "Content-Type: application/json" \
  -d '{
    "Auth": {
      "Token": "mock-token",
      "Sign": "mock-sign",
      "Cuit": "20123456786"
    },
    "FeCAEReq": {
      "FeCabReq": {
        "CantReg": 1,
        "PtoVta": 1,
        "CbteTipo": 1
      },
      "FeDetReq": [{
        "Concepto": 1,
        "DocTipo": 80,
        "DocNro": "27987654321",
        "CbteDesde": 1,
        "CbteHasta": 1,
        "CbteFch": "20251012",
        "ImpTotal": 121.00,
        "ImpTotConc": 0,
        "ImpNeto": 100.00,
        "ImpOpEx": 0,
        "ImpIVA": 21.00,
        "ImpTrib": 0,
        "MonId": "PES",
        "MonCotiz": 1
      }]
    }
  }'

# Query last authorized invoice
curl "http://localhost:3002/wsfev1/FECompUltimoAutorizado?PtoVta=1&CbteTipo=1"

# Get taxpayer information
curl -X POST http://localhost:3002/ws_sr_padron_a5/getPersona \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20123456786"}'
```

**Test CUIT Numbers:**
- `20-12345678-6` - Valid CUIT (Male individual)
- `27-98765432-0` - Valid CUIT (Female individual)
- `30-71234567-1` - Valid CUIT (Legal entity/Company)

**Invoice Types:**
- Type 1: Factura A (Between registered taxpayers)
- Type 6: Factura B (From registered to final consumer)
- Type 11: Factura C (Between non-registered)

**Documentation:** See [docker/mocks/afip/README.md](./afip/README.md)

---

### 3. WhatsApp Mock (Port 3003)

**Purpose:** Simulates WhatsApp Business API for customer messaging and notifications.

**Key Features:**
- Send text, template, and media messages
- Automatic status transitions (sent → delivered → read)
- Webhook simulation for status updates
- Pre-configured Argentina booking templates
- Argentina phone number validation (+54 format)
- Media handling (images, documents, audio, video)
- Real-time message dashboard

**Web Interfaces:**
- **Dashboard:** http://localhost:3003/dashboard - View sent messages and status
- **API Docs:** http://localhost:3003/docs - Interactive API documentation

**Health Check:**
```bash
curl http://localhost:3003/health
```

**Example Usage:**
```bash
# Send text message
curl -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "text",
    "text": {
      "body": "Your appointment is confirmed for tomorrow at 3 PM"
    }
  }'

# Send template message (booking confirmation)
curl -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "template",
    "template": {
      "name": "booking_confirmation",
      "language": {"code": "es"},
      "components": [{
        "type": "body",
        "parameters": [
          {"type": "text", "text": "Juan Pérez"},
          {"type": "text", "text": "15/10/2025"},
          {"type": "text", "text": "10:00"}
        ]
      }]
    }
  }'

# Send image
curl -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "image",
    "image": {
      "link": "https://example.com/image.jpg",
      "caption": "Your appointment details"
    }
  }'

# Get message status
curl http://localhost:3003/v1/messages/wamid.abc123def456

# List available templates
curl http://localhost:3003/v1/templates
```

**Available Templates:**
- `booking_confirmation` - Confirms appointment (Name, Date, Time)
- `booking_reminder` - Reminds about upcoming appointment (Time)
- `booking_cancelled` - Notifies cancellation (Date)

**Phone Number Format:**
- Valid: `+5491112345678`, `+54 9 11 1234-5678`
- Country code `+54` is required

**Documentation:** See [docker/mocks/whatsapp/README.md](./whatsapp/README.md)

---

### 4. SMS Mock (Port 3004)

**Purpose:** Simulates SMS gateway for Argentina phone numbers (Twilio-style API).

**Key Features:**
- Send single or bulk SMS messages
- Argentina phone number validation (+54)
- Delivery simulation with 95% success rate
- Automatic cost calculation (0.05 ARS per 160-char segment)
- Message segmentation (up to 10 segments)
- Webhook callbacks for status updates
- Real-time SMS dashboard

**Web Interfaces:**
- **Dashboard:** http://localhost:3004/dashboard - View SMS history and statistics
- **API Docs:** http://localhost:3004/docs - Interactive API documentation

**Health Check:**
```bash
curl http://localhost:3004/health
```

**Example Usage:**
```bash
# Send single SMS
curl -X POST http://localhost:3004/v1/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+54 9 11 1234-5678",
    "body": "Your appointment is confirmed for tomorrow at 3 PM"
  }'

# Send bulk SMS
curl -X POST http://localhost:3004/v1/sms/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "to": "+54 9 11 1234-5678",
        "body": "Reminder: Appointment tomorrow at 10:00 AM"
      },
      {
        "to": "+54 9 11 9876-5432",
        "body": "Reminder: Appointment tomorrow at 2:00 PM"
      }
    ]
  }'

# Get SMS status
curl http://localhost:3004/v1/sms/SM1699999999abc123

# Get statistics
curl http://localhost:3004/v1/stats
```

**SMS Segmentation:**
| Characters | Segments | Cost (ARS) |
|-----------|----------|------------|
| 1-160 | 1 | 0.05 |
| 161-320 | 2 | 0.10 |
| 321-480 | 3 | 0.15 |
| 481-640 | 4 | 0.20 |

Maximum: 1600 characters (10 segments)

**Status Flow:**
1. `queued` - Initial state (0s)
2. `sent` - After 1 second
3. `delivered` - After 2 seconds (95% success)
4. `failed` - Delivery failure (5% rate)

**Documentation:** See [docker/mocks/sms/README.md](./sms/README.md)

---

### 5. MailHog (Ports 1025, 8025)

**Purpose:** Email capture and testing tool for development.

**Key Features:**
- SMTP server on port 1025
- Web UI for viewing captured emails
- No actual email sending
- Email search and filtering
- JSON API for automation
- Email attachment support

**Web Interface:**
- **Email UI:** http://localhost:8025 - View all captured emails

**Health Check:**
```bash
curl http://localhost:8025
```

**Example Usage:**
```bash
# Send email via SMTP (using Python example)
python3 << EOF
import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg.set_content('Your appointment is confirmed.')
msg['Subject'] = 'Appointment Confirmation'
msg['From'] = 'noreply@barberpro.local'
msg['To'] = 'customer@example.com'

with smtplib.SMTP('localhost', 1025) as smtp:
    smtp.send_message(msg)
    print('Email sent!')
EOF

# View emails via API
curl http://localhost:8025/api/v2/messages

# Get specific email
curl http://localhost:8025/api/v2/messages/{message-id}

# Delete all emails
curl -X DELETE http://localhost:8025/api/v1/messages
```

**SMTP Configuration (Backend):**
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false  # No TLS in development
```

**Official Documentation:** https://github.com/mailhog/MailHog

---

## Configuration

### Environment Variables

All mock services can be configured via environment variables in your `.env` file or `docker/.env.example`:

```bash
# === Argentina Mock Services ===

# MercadoPago Mock
MERCADOPAGO_MOCK_URL=http://localhost:3001
MERCADOPAGO_WEBHOOK_URL=http://backend:3000/api/webhooks/mercadopago
MERCADOPAGO_DEFAULT_SCENARIO=success

# AFIP Mock
AFIP_MOCK_URL=http://localhost:3002

# WhatsApp Mock
WHATSAPP_MOCK_URL=http://localhost:3003
WHATSAPP_WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp

# SMS Mock
SMS_MOCK_URL=http://localhost:3004
SMS_WEBHOOK_URL=http://backend:3000/api/webhooks/sms
SMS_COST_PER_SEGMENT=0.05

# Email Mock (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
MAILHOG_UI=http://localhost:8025

# General Configuration
NODE_ENV=development
LOG_LEVEL=info
```

### Makefile Commands

All mock services are controlled via Makefile commands:

| Command | Description |
|---------|-------------|
| `make mocks` | Start all mock services |
| `make mocks-down` | Stop all mock services |
| `make mocks-logs` | View logs from all mocks (follow mode) |
| `make mocks-reset` | Reset mocks (stop, remove volumes, restart) |

### Docker Compose Direct Usage

```bash
# Start all mocks
docker-compose -f docker/docker-compose.mocks.yml up -d

# Stop all mocks
docker-compose -f docker/docker-compose.mocks.yml down

# View logs
docker-compose -f docker/docker-compose.mocks.yml logs -f

# Reset with volume removal
docker-compose -f docker/docker-compose.mocks.yml down -v
docker-compose -f docker/docker-compose.mocks.yml up -d
```

---

## Integration Testing

### Complete Payment Flow Test

```bash
# 1. Create a payment
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:3001/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_amount": 100,
    "payment_method_id": "visa",
    "payer": {"email": "test@example.com"}
  }')

PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.id')
echo "Payment created: $PAYMENT_ID"

# 2. Check payment status
curl http://localhost:3001/v1/payments/$PAYMENT_ID

# 3. View in dashboard
open http://localhost:3001/dashboard
```

### Complete Invoice Flow Test

```bash
# 1. Validate CUIT
curl -X POST http://localhost:3002/validate/cuit \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20-12345678-6"}'

# 2. Get authentication token
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3002/wsaa/auth \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20-12345678-6", "service": "wsfev1"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 3. Create invoice and get CAE
CAE_RESPONSE=$(curl -s -X POST http://localhost:3002/wsfev1/FECAESolicitar \
  -H "Content-Type: application/json" \
  -d '{
    "Auth": {"Token": "'$TOKEN'", "Sign": "mock-sign", "Cuit": "20123456786"},
    "FeCAEReq": {
      "FeCabReq": {"CantReg": 1, "PtoVta": 1, "CbteTipo": 1},
      "FeDetReq": [{
        "Concepto": 1,
        "DocTipo": 80,
        "DocNro": "27987654321",
        "CbteDesde": 1,
        "CbteHasta": 1,
        "CbteFch": "20251012",
        "ImpTotal": 121.00,
        "ImpNeto": 100.00,
        "ImpIVA": 21.00
      }]
    }
  }')

CAE=$(echo $CAE_RESPONSE | jq -r '.FeDetResp[0].CAE')
echo "CAE generated: $CAE"

# 4. Query invoice
curl "http://localhost:3002/wsfev1/FECompConsultar?PtoVta=1&CbteTipo=1&CbteNro=1"
```

### Complete Notification Flow Test

```bash
# 1. Send WhatsApp message
WA_RESPONSE=$(curl -s -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "text",
    "text": {"body": "Test message"}
  }')

WA_ID=$(echo $WA_RESPONSE | jq -r '.messages[0].id')
echo "WhatsApp message sent: $WA_ID"

# 2. Send SMS
SMS_RESPONSE=$(curl -s -X POST http://localhost:3004/v1/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+54 9 11 1234-5678",
    "body": "Test SMS"
  }')

SMS_ID=$(echo $SMS_RESPONSE | jq -r '.data.id')
echo "SMS sent: $SMS_ID"

# 3. Send Email
python3 << EOF
import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg.set_content('Test email content')
msg['Subject'] = 'Test Email'
msg['From'] = 'noreply@barberpro.local'
msg['To'] = 'test@example.com'

with smtplib.SMTP('localhost', 1025) as smtp:
    smtp.send_message(msg)
    print('Email sent!')
EOF

# 4. View all notifications
echo "WhatsApp Dashboard: http://localhost:3003/dashboard"
echo "SMS Dashboard: http://localhost:3004/dashboard"
echo "Email UI: http://localhost:8025"
```

---

## Resource Usage

### Memory & CPU

Combined resource usage for all 5 mock services:

| Service | Memory Limit | CPU Limit | Actual Usage |
|---------|--------------|-----------|--------------|
| MercadoPago | 256 MB | 0.25 cores | ~80 MB, <5% CPU |
| AFIP | 256 MB | 0.25 cores | ~100 MB, <5% CPU |
| WhatsApp | 256 MB | 0.25 cores | ~70 MB, <5% CPU |
| SMS | 256 MB | 0.25 cores | ~60 MB, <5% CPU |
| MailHog | 128 MB | 0.25 cores | ~30 MB, <2% CPU |
| **Total** | **1.2 GB** | **1.25 cores** | **~400 MB, ~20% CPU** |

**Idle State:** ~400 MB memory, <5% CPU
**Under Load:** ~800 MB memory, ~20% CPU

### Disk Usage

- Docker images: ~500 MB (combined, after first build)
- AFIP database volume: ~10 MB (grows with invoice history)
- Total: ~510 MB

### Performance

- Lightweight enough to run alongside main dev environment
- Fast startup: <10 seconds for all 5 services
- Response times: <100ms for most endpoints
- Suitable for local development on laptops

### Optimization Tips

1. **Run only what you need:**
   ```bash
   # Start only specific mocks
   docker-compose -f docker/docker-compose.mocks.yml up -d mercadopago-mock afip-mock
   ```

2. **Stop when not needed:**
   ```bash
   make mocks-down  # Free ~400 MB memory
   ```

3. **Clear old data:**
   ```bash
   make mocks-reset  # Clear accumulated messages/payments
   ```

---

## Networking

All mock services run on the `barberpro-network` Docker network, allowing seamless communication with the main BarberPro backend and frontend containers.

### Network Architecture

```
┌─────────────────────────────────────────────────────┐
│         barberpro-network (Docker Bridge)           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐   │
│  │  Backend   │  │  Frontend  │  │  PostgreSQL │   │
│  │  :3000     │  │  :5173     │  │  :5432      │   │
│  └──────┬─────┘  └────────────┘  └─────────────┘   │
│         │                                            │
│         │  (Webhooks & API calls)                   │
│         │                                            │
│  ┌──────▼────────────────────────────────────────┐  │
│  │         Mock Services Layer                   │  │
│  │  ┌──────────┐  ┌──────┐  ┌──────┐  ┌──────┐  │  │
│  │  │MercadoPago│  │ AFIP │  │WhatsApp│  │ SMS │  │  │
│  │  │  :3001   │  │:3002 │  │ :3003 │  │:3004│  │  │
│  │  └──────────┘  └──────┘  └──────┘  └──────┘  │  │
│  │  ┌──────────┐                                 │  │
│  │  │ MailHog  │                                 │  │
│  │  │:1025,:8025│                                 │  │
│  │  └──────────┘                                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
       │                                    │
       │ Port Forwarding                   │
       ▼                                    ▼
  localhost:3001-3004              localhost:1025, 8025
```

### Service Discovery

Services can communicate using container names:

```bash
# From backend container
curl http://mercadopago-mock:3001/v1/payments
curl http://afip-mock:3002/health
curl http://whatsapp-mock:3003/v1/messages
curl http://sms-mock:3004/v1/sms
curl http://mailhog:8025/api/v2/messages
```

### External Access

All services are accessible from the host machine via localhost:

```bash
# From your laptop/development machine
curl http://localhost:3001/health  # MercadoPago
curl http://localhost:3002/health  # AFIP
curl http://localhost:3003/health  # WhatsApp
curl http://localhost:3004/health  # SMS
curl http://localhost:8025         # MailHog
```

---

## Troubleshooting

### Services Won't Start

**Issue:** Port conflicts
```bash
# Check what's using the ports
lsof -i :3001
lsof -i :3002
lsof -i :3003
lsof -i :3004
lsof -i :8025

# Kill conflicting processes
kill -9 <PID>

# Or change ports in docker-compose.mocks.yml
```

**Issue:** Docker network not found
```bash
# Create the network manually
docker network create barberpro-network

# Or start base services first
make up
```

**Issue:** Permission denied on volumes
```bash
# Fix AFIP data volume permissions
sudo chmod -R 755 docker/mocks/afip/data

# Or remove and recreate
docker volume rm barberpro-afip-data
make mocks-reset
```

### Health Checks Failing

**Check service logs:**
```bash
# View logs for failing service
docker logs barberpro-mercadopago-mock
docker logs barberpro-afip-mock
docker logs barberpro-whatsapp-mock
docker logs barberpro-sms-mock
docker logs barberpro-mailhog

# Follow logs in real-time
make mocks-logs
```

**Check health status:**
```bash
# Inspect container health
docker inspect barberpro-mercadopago-mock | grep -A 10 Health

# Check all container statuses
docker-compose -f docker/docker-compose.mocks.yml ps
```

**Common issues:**
- Service not ready yet (wait 10-15 seconds after startup)
- Port binding failed (check for conflicts)
- Missing environment variables (check .env file)
- Network issues (recreate network)

### Webhook Errors

**Issue:** Webhooks not being received by backend

```bash
# Verify backend is accessible from mocks network
docker exec barberpro-mercadopago-mock curl http://backend:3000/health

# Check webhook URL configuration
curl http://localhost:3003/v1/webhooks/config

# Test manual webhook trigger (MercadoPago)
curl -X POST http://localhost:3001/admin/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": 1000000001,
    "webhook_url": "http://backend:3000/api/webhooks/mercadopago"
  }'
```

**Solution:** Ensure webhook URLs use container names, not localhost:
- ✓ Correct: `http://backend:3000/api/webhooks/mercadopago`
- ✗ Wrong: `http://localhost:3000/api/webhooks/mercadopago`

### Database Issues (AFIP)

**Issue:** AFIP database not persisting
```bash
# Check volume exists
docker volume ls | grep afip

# Inspect volume
docker volume inspect barberpro-afip-data

# Backup database
docker exec barberpro-afip-mock cp /app/data/afip.db /tmp/backup.db
docker cp barberpro-afip-mock:/tmp/backup.db ./afip-backup.db

# Restore database
docker cp ./afip-backup.db barberpro-afip-mock:/app/data/afip.db
docker restart barberpro-afip-mock
```

### Performance Issues

**Issue:** Mocks running slowly

```bash
# Check resource usage
docker stats

# Restart specific service
docker restart barberpro-mercadopago-mock

# Clear accumulated data
make mocks-reset

# Increase resource limits (edit docker-compose.mocks.yml)
# Change from 256M to 512M, 0.25 to 0.5 cores
```

### Docker Compose Validation

```bash
# Validate compose file syntax
docker-compose -f docker/docker-compose.mocks.yml config

# View resolved configuration
docker-compose -f docker/docker-compose.mocks.yml config --resolve-image-digests

# Check for warnings
docker-compose -f docker/docker-compose.mocks.yml config --quiet
```

---

## Development

### Project Structure

```
docker/mocks/
├── README.md                    # This file
├── mercadopago/                 # MercadoPago mock server
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── README.md
├── afip/                        # AFIP mock server
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── database/
│   ├── services/
│   ├── routes/
│   ├── data/                    # SQLite database (volume mount)
│   └── README.md
├── whatsapp/                    # WhatsApp mock server
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── routes/
│   ├── services/
│   └── README.md
├── sms/                         # SMS mock server
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── routes/
│   ├── services/
│   └── README.md
└── (MailHog uses official Docker image)
```

### Adding a New Mock Service

1. **Create service directory:**
   ```bash
   mkdir docker/mocks/new-service
   cd docker/mocks/new-service
   ```

2. **Initialize Node.js project:**
   ```bash
   npm init -y
   npm install express winston
   ```

3. **Create Dockerfile:**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3005
   CMD ["node", "index.js"]
   ```

4. **Add to docker-compose.mocks.yml:**
   ```yaml
   new-service-mock:
     build:
       context: ./mocks/new-service
       dockerfile: Dockerfile
     container_name: barberpro-new-service-mock
     ports:
       - "3005:3005"
     environment:
       PORT: 3005
     networks:
       - barberpro-network
     healthcheck:
       test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3005/health"]
       interval: 10s
       timeout: 5s
       retries: 3
     restart: unless-stopped
     deploy:
       resources:
         limits:
           cpus: '0.25'
           memory: 256M
   ```

5. **Update this README** with service details.

### Testing Individual Services

```bash
# Test MercadoPago
cd docker/mocks/mercadopago
npm install
npm test
npm run dev

# Test AFIP
cd docker/mocks/afip
npm install
npm test
npm run dev

# Test WhatsApp
cd docker/mocks/whatsapp
npm install
npm test
npm run dev

# Test SMS
cd docker/mocks/sms
npm install
npm test
npm run dev
```

### Rebuilding After Changes

```bash
# Rebuild all mock services
docker-compose -f docker/docker-compose.mocks.yml build

# Rebuild specific service
docker-compose -f docker/docker-compose.mocks.yml build mercadopago-mock

# Rebuild and restart
docker-compose -f docker/docker-compose.mocks.yml up -d --build
```

---

## Production Considerations

### ⚠️ Important Warnings

**These mock services are for DEVELOPMENT and TESTING ONLY.**

They do NOT:
- Connect to real external services
- Require real API credentials
- Actually send messages or process payments
- Provide legally valid CAEs or invoices
- Implement production-level security
- Persist data reliably (except AFIP SQLite)
- Handle rate limiting or quotas
- Make real HTTP webhook calls (just log them)

### Migration to Production

When moving to production, you must:

1. **MercadoPago:**
   - Obtain real MercadoPago API credentials
   - Switch to production environment
   - Configure real webhook URLs with HTTPS
   - Implement signature verification
   - Handle IPN notifications properly

2. **AFIP:**
   - Obtain real AFIP certificates
   - Implement WSAA authentication with PKCS7
   - Use AFIP homologation environment for testing
   - Move to AFIP production after certification
   - Implement proper error handling and retries

3. **WhatsApp:**
   - Set up WhatsApp Business account
   - Get WhatsApp Business API credentials
   - Configure real webhook endpoints
   - Implement message template approval process
   - Handle rate limits and message quotas

4. **SMS:**
   - Choose SMS provider (Twilio, MessageBird, etc.)
   - Obtain API credentials
   - Configure real webhook endpoints
   - Implement delivery reports
   - Handle failures and retries

5. **Email:**
   - Configure real SMTP server (SendGrid, Mailgun, SES)
   - Set up SPF, DKIM, DMARC records
   - Implement email templates
   - Handle bounces and complaints
   - Monitor delivery rates

### Environment Variable Changes

Development:
```bash
MERCADOPAGO_MOCK_URL=http://localhost:3001
```

Production:
```bash
MERCADOPAGO_API_URL=https://api.mercadopago.com
MERCADOPAGO_ACCESS_TOKEN=PROD-xxxx-xxxx-xxxx-xxxx
```

---

## FAQ

### Q: Can I use these mocks in CI/CD?

**A:** Yes! They're perfect for automated testing:
```yaml
# .github/workflows/test.yml
services:
  mercadopago-mock:
    image: mercadopago-mock:latest
    ports:
      - 3001:3001
  afip-mock:
    image: afip-mock:latest
    ports:
      - 3002:3002
  # ... other mocks
```

### Q: How do I debug webhook issues?

**A:** Check logs and test manually:
```bash
# View webhook logs
make mocks-logs | grep webhook

# Test webhook endpoint
curl -X POST http://backend:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Use webhook history (WhatsApp)
curl http://localhost:3003/v1/webhooks/history
```

### Q: Can I customize response scenarios?

**A:** Yes! Edit the scenario configuration:
```bash
# MercadoPago scenarios
vim docker/mocks/mercadopago/config/scenarios.json

# Set default scenario
export MERCADOPAGO_DEFAULT_SCENARIO=rejected_insufficient_amount
```

### Q: How do I clear all test data?

**A:** Use the reset command:
```bash
make mocks-reset  # Clears everything
```

Or clear specific services:
```bash
curl -X DELETE http://localhost:3001/admin/payments
curl -X DELETE http://localhost:3004/v1/sms
curl -X DELETE http://localhost:8025/api/v1/messages
```

### Q: Are the mocks thread-safe?

**A:** Yes, all mocks use in-memory storage with proper synchronization. However, data is not persisted across restarts (except AFIP SQLite).

### Q: Can I run mocks on different ports?

**A:** Yes, edit `docker-compose.mocks.yml`:
```yaml
mercadopago-mock:
  ports:
    - "3101:3001"  # Change host port, keep container port
```

### Q: How do I monitor mock performance?

**A:** Use Docker stats and health checks:
```bash
# Real-time stats
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Health check status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Service uptime
curl http://localhost:3001/health | jq .uptime
```

---

## Related Documentation

- **Project README:** `/home/lorenzo/projects/service-booking/README.md`
- **CLAUDE.md:** `/home/lorenzo/projects/service-booking/CLAUDE.md`
- **Docker README:** `/home/lorenzo/projects/service-booking/docker/README.md`
- **Environment Example:** `/home/lorenzo/projects/service-booking/docker/.env.example`
- **Makefile:** `/home/lorenzo/projects/service-booking/Makefile`

### Service-Specific READMEs

- **MercadoPago:** [docker/mocks/mercadopago/README.md](./mercadopago/README.md)
- **AFIP:** [docker/mocks/afip/README.md](./afip/README.md)
- **WhatsApp:** [docker/mocks/whatsapp/README.md](./whatsapp/README.md)
- **SMS:** [docker/mocks/sms/README.md](./sms/README.md)
- **MailHog:** https://github.com/mailhog/MailHog

---

## Support

For issues, questions, or contributions:

- **GitHub Issues:** https://github.com/lorenzotomasdiez/service-booking/issues
- **Check Logs:** `make mocks-logs`
- **Health Checks:** Visit `/health` endpoint for each service
- **API Docs:** Visit `/docs` endpoint for each service
- **Dashboards:** Visit web interfaces listed above

---

## License

MIT License - Part of the BarberPro service booking platform.

---

**Generated for BarberPro - Service Booking Platform**
Mock Services for Argentina-specific integrations: Payment, Tax, Messaging, Email
