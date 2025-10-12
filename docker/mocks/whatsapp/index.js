require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

// Import routes
const messagesRoutes = require('./routes/messages');
const mediaRoutes = require('./routes/media');
const webhooksRoutes = require('./routes/webhooks');
const { swaggerUi, swaggerDocument, swaggerOptions } = require('./routes/swagger');

// Import services
const webhookService = require('./services/webhook.service');

const app = express();
const PORT = process.env.WHATSAPP_MOCK_PORT || 3003;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
if (process.env.ENABLE_CORS !== 'false') {
  app.use(cors());
  logger.info('CORS enabled');
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    service: 'whatsapp-mock-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };

  res.json(healthStatus);
});

// Swagger/OpenAPI documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
logger.info('Swagger documentation enabled at /docs');

// Dashboard endpoint - serve the HTML file directly
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'WhatsApp Business API Mock Server',
    version: '1.0.0',
    description: 'Mock server for WhatsApp Business API for local development and testing',
    endpoints: {
      health: '/health',
      docs: '/docs',
      dashboard: '/dashboard',
      messages: {
        send: 'POST /v1/messages',
        send_template: 'POST /v1/messages/template',
        get_status: 'GET /v1/messages/:id',
        get_all: 'GET /v1/messages'
      },
      media: {
        upload: 'POST /v1/media',
        get: 'GET /v1/media/:id',
        delete: 'DELETE /v1/media/:id',
        get_all: 'GET /v1/media'
      },
      webhooks: {
        config: 'POST /v1/webhooks/config',
        get_config: 'GET /v1/webhooks/config',
        history: 'GET /v1/webhooks/history',
        clear: 'POST /v1/webhooks/clear'
      },
      templates: {
        get_all: 'GET /v1/templates'
      }
    },
    note: 'This is a MOCK server for development purposes only'
  });
});

// Register API routes
app.use('/', messagesRoutes);
app.use('/', mediaRoutes);
app.use('/', webhooksRoutes);

logger.info('API routes registered');

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      type: 'not_found',
      code: 404,
      hint: 'See available endpoints at GET / or view API docs at /docs'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      type: 'server_error',
      code: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Close server
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
});

// Initialize and start server
let server;

async function start() {
  try {
    // Initialize webhook URL from environment
    if (process.env.WHATSAPP_MOCK_WEBHOOK_URL) {
      webhookService.setWebhookUrl(process.env.WHATSAPP_MOCK_WEBHOOK_URL);
      logger.info('Webhook URL configured from environment');
    }

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`WhatsApp Mock Server started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/docs`);
      logger.info(`Dashboard available at http://localhost:${PORT}/dashboard`);
      logger.info(`Endpoints available at http://localhost:${PORT}/`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = app;
