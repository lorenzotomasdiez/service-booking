# WhatsApp Business API Mock Server

A lightweight, Express.js-based mock server that simulates the WhatsApp Business API for local development and testing. This mock enables you to develop and test WhatsApp messaging features without connecting to the real WhatsApp Business API.

## Features

- **Complete Message API**: Send text, template, and media messages
- **Status Tracking**: Automatic status updates (sent → delivered → read)
- **Webhook Simulation**: Configurable webhook callbacks for status updates
- **Template Support**: Pre-configured message templates (booking confirmations, reminders, etc.)
- **Media Handling**: Upload and manage images, documents, audio, and video
- **Real-time Dashboard**: Beautiful web UI to view sent messages
- **Argentina Phone Validation**: Validates +54 phone number formats
- **Comprehensive API Documentation**: Swagger/OpenAPI docs at `/docs`
- **Health Checks**: Docker-compatible health check endpoint
- **Structured Logging**: JSON-formatted logs with Winston

## Quick Start

### Using Docker

```bash
# Build the image
docker build -t whatsapp-mock .

# Run the container
docker run -p 3003:3003 whatsapp-mock

# Or with environment variables
docker run -p 3003:3003 \
  -e WHATSAPP_MOCK_WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp \
  whatsapp-mock
```

### Using Node.js

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The server will start on port 3003 (configurable via `WHATSAPP_MOCK_PORT`).

## API Endpoints

### Messages

#### Send a Message
**POST** `/v1/messages`

Send a text, template, or media message.

**Text Message Example:**
```bash
curl -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "text",
    "text": {
      "body": "Hello from WhatsApp!",
      "preview_url": false
    }
  }'
```

**Response:**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+5491112345678",
      "wa_id": "+5491112345678"
    }
  ],
  "messages": [
    {
      "id": "wamid.abc123def456",
      "message_status": "accepted"
    }
  ]
}
```

**Template Message Example:**
```bash
curl -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "template",
    "template": {
      "name": "booking_confirmation",
      "language": { "code": "es" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "Juan Pérez" },
            { "type": "text", "text": "15/10/2025" },
            { "type": "text", "text": "10:00" }
          ]
        }
      ]
    }
  }'
```

**Image Message Example:**
```bash
curl -X POST http://localhost:3003/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5491112345678",
    "type": "image",
    "image": {
      "link": "https://example.com/image.jpg",
      "caption": "Check out this image!"
    }
  }'
```

#### Get Message Status
**GET** `/v1/messages/:id`

Retrieve the status of a specific message.

```bash
curl http://localhost:3003/v1/messages/wamid.abc123def456
```

**Response:**
```json
{
  "id": "wamid.abc123def456",
  "status": "delivered",
  "timestamp": "2025-10-12T10:30:00.000Z",
  "delivered_at": "2025-10-12T10:30:01.000Z",
  "read_at": null,
  "to": "+5491112345678"
}
```

#### Get All Messages
**GET** `/v1/messages`

Retrieve all sent messages (for debugging/dashboard).

```bash
curl http://localhost:3003/v1/messages
```

#### Get Available Templates
**GET** `/v1/templates`

List all available message templates.

```bash
curl http://localhost:3003/v1/templates
```

**Response:**
```json
{
  "templates": [
    {
      "name": "booking_confirmation",
      "language": "es",
      "components": [
        {
          "type": "BODY",
          "text": "Hola {{1}}, tu reserva ha sido confirmada para el {{2}} a las {{3}}."
        }
      ]
    },
    {
      "name": "booking_reminder",
      "language": "es",
      "components": [
        {
          "type": "BODY",
          "text": "Recordatorio: Tienes una reserva mañana a las {{1}}."
        }
      ]
    }
  ],
  "total": 2
}
```

### Media

#### Upload Media
**POST** `/v1/media`

Upload media files (images, documents, audio, video).

```bash
curl -X POST http://localhost:3003/v1/media \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "file": {
      "url": "https://example.com/image.jpg",
      "size": 1024000
    },
    "filename": "profile.jpg",
    "mimetype": "image/jpeg"
  }'
```

**Response:**
```json
{
  "id": "media.xyz789abc123"
}
```

#### Get Media
**GET** `/v1/media/:id`

Retrieve media details by ID.

```bash
curl http://localhost:3003/v1/media/media.xyz789abc123
```

#### Delete Media
**DELETE** `/v1/media/:id`

Delete uploaded media.

```bash
curl -X DELETE http://localhost:3003/v1/media/media.xyz789abc123
```

### Webhooks

#### Configure Webhook URL
**POST** `/v1/webhooks/config`

Set the webhook URL for status update callbacks.

```bash
curl -X POST http://localhost:3003/v1/webhooks/config \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://backend:3000/api/webhooks/whatsapp"
  }'
```

#### Get Webhook Configuration
**GET** `/v1/webhooks/config`

Get the current webhook URL.

```bash
curl http://localhost:3003/v1/webhooks/config
```

#### Get Webhook History
**GET** `/v1/webhooks/history`

View the history of webhook deliveries.

```bash
curl http://localhost:3003/v1/webhooks/history
```

### Health & Info

#### Health Check
**GET** `/health`

Check if the service is running.

```bash
curl http://localhost:3003/health
```

#### Service Info
**GET** `/`

Get service information and available endpoints.

```bash
curl http://localhost:3003/
```

## Dashboard

Access the web dashboard at:
```
http://localhost:3003/dashboard
```

The dashboard provides:
- Real-time message monitoring
- Status tracking with visual indicators
- Message history with chat-like interface
- Auto-refresh every 3 seconds
- Statistics (total, delivered, read)

## API Documentation

Interactive Swagger/OpenAPI documentation is available at:
```
http://localhost:3003/docs
```

## Message Status Flow

Messages automatically transition through statuses:

1. **sent** (immediate) - Message accepted by the API
2. **delivered** (after 1 second) - Message delivered to recipient's device
3. **read** (after 5 seconds) - Message read by recipient

Status updates trigger webhook callbacks (if configured).

## Pre-configured Templates

The mock includes these templates for Argentina-based booking applications:

| Template Name | Description | Parameters |
|--------------|-------------|------------|
| `booking_confirmation` | Confirms a booking | Name, Date, Time |
| `booking_reminder` | Reminds about upcoming booking | Time |
| `booking_cancelled` | Notifies booking cancellation | Date |

## Phone Number Validation

The mock validates Argentina phone number formats:
- `+5491112345678` (international format)
- `5491112345678` (without +)
- `+54 9 11 1234-5678` (with spaces and dashes)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WHATSAPP_MOCK_PORT` | `3003` | Server port |
| `WHATSAPP_MOCK_WEBHOOK_URL` | `null` | Webhook callback URL |
| `ENABLE_CORS` | `true` | Enable CORS |
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |
| `NODE_ENV` | `development` | Environment (development, production) |

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:
- ✅ Text message sending
- ✅ Template message sending
- ✅ Media message sending
- ✅ Message status retrieval
- ✅ Phone number validation
- ✅ Error handling
- ✅ Health checks

## Integration with BarberPro

### Backend Integration

Configure your backend to use the mock server:

```typescript
// backend/src/config/whatsapp.config.ts
export const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL || 'http://whatsapp-mock:3003/v1',
  webhookUrl: process.env.WHATSAPP_WEBHOOK_URL
};
```

### Sending Messages

```typescript
// backend/src/services/notification.service.ts
import axios from 'axios';

async function sendWhatsAppMessage(to: string, body: string) {
  const response = await axios.post(`${whatsappConfig.apiUrl}/messages`, {
    to,
    type: 'text',
    text: { body }
  });

  return response.data;
}

async function sendBookingConfirmation(to: string, name: string, date: string, time: string) {
  const response = await axios.post(`${whatsappConfig.apiUrl}/messages`, {
    to,
    type: 'template',
    template: {
      name: 'booking_confirmation',
      language: { code: 'es' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: date },
            { type: 'text', text: time }
          ]
        }
      ]
    }
  });

  return response.data;
}
```

### Handling Webhooks

```typescript
// backend/src/routes/webhooks.ts
app.post('/api/webhooks/whatsapp', async (req, res) => {
  const { entry } = req.body;

  for (const change of entry[0].changes) {
    const { statuses } = change.value;

    if (statuses) {
      for (const status of statuses) {
        console.log(`Message ${status.id} is now ${status.status}`);
        // Update your database, notify users, etc.
      }
    }
  }

  res.sendStatus(200);
});
```

## Docker Compose

Example docker-compose configuration:

```yaml
services:
  whatsapp-mock:
    build: ./docker/mocks/whatsapp
    ports:
      - "3003:3003"
    environment:
      - WHATSAPP_MOCK_PORT=3003
      - WHATSAPP_MOCK_WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp
      - LOG_LEVEL=info
      - NODE_ENV=development
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3003/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - app-network
```

## Logging

Structured JSON logs with Winston:

```json
{
  "timestamp": "2025-10-12 10:30:00",
  "level": "info",
  "message": "Message sent",
  "service": "whatsapp-mock-server",
  "messageId": "wamid.abc123",
  "to": "+5491112345678",
  "type": "text"
}
```

## Limitations

This is a **mock server** for development purposes. It does NOT:
- Actually send WhatsApp messages
- Connect to the real WhatsApp Business API
- Require WhatsApp Business account credentials
- Support all WhatsApp Business API features
- Make real HTTP requests for webhooks (just logs them)

## Architecture

```
whatsapp-mock/
├── index.js                 # Express app entry point
├── routes/
│   ├── messages.js         # Message endpoints
│   ├── media.js            # Media endpoints
│   ├── webhooks.js         # Webhook endpoints
│   └── swagger.js          # API documentation
├── services/
│   ├── message.service.js  # Message business logic
│   ├── media.service.js    # Media business logic
│   └── webhook.service.js  # Webhook callbacks
├── utils/
│   ├── logger.js           # Winston logger
│   └── id-generator.js     # ID generation utilities
├── public/
│   └── dashboard.html      # Web dashboard
├── tests/
│   └── message.test.js     # Jest tests
├── Dockerfile              # Docker image definition
├── package.json            # Dependencies
└── README.md               # This file
```

## License

MIT

## Support

For issues and questions:
- Check the Swagger docs at `/docs`
- View the dashboard at `/dashboard`
- Review logs for detailed error messages
- Contact the BarberPro development team
