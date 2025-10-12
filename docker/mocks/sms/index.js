require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

// Import routes
const smsRoutes = require('./routes/sms');
const { swaggerUi, swaggerDocument, swaggerOptions } = require('./routes/swagger');

const app = express();
const PORT = process.env.SMS_MOCK_PORT || 3004;

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
    service: 'sms-mock-server',
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
logger.info('Dashboard UI enabled at /dashboard');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'SMS Mock Server',
    version: '1.0.0',
    description: 'Mock SMS Gateway (Twilio-style) API for local development and testing',
    endpoints: {
      health: 'GET /health',
      docs: 'GET /docs',
      dashboard: 'GET /dashboard',
      sms: {
        send: 'POST /v1/sms',
        get: 'GET /v1/sms/:id',
        list: 'GET /v1/sms',
        bulk: 'POST /v1/sms/bulk',
        stats: 'GET /v1/stats',
        clear: 'DELETE /v1/sms'
      }
    },
    formats: {
      phone: '+54 9 11 1234-5678 (Argentina format)',
      segments: '160 characters per segment',
      cost: `${process.env.SMS_COST_PER_SEGMENT || '0.05'} ARS per segment`
    },
    note: 'This is a MOCK server for development purposes only'
  });
});

// Register API routes
app.use('/', smsRoutes);

logger.info('API routes registered');

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    hint: 'See available endpoints at GET / or view API docs at /docs'
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
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
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

// Start server
let server;

function start() {
  try {
    server = app.listen(PORT, () => {
      logger.info('SMS Mock Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        costPerSegment: process.env.SMS_COST_PER_SEGMENT || '0.05',
        fromNumber: process.env.SMS_FROM_NUMBER || '+54 11 0000-0000'
      });
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/docs`);
      logger.info(`Dashboard UI available at http://localhost:${PORT}/dashboard`);
      logger.info(`Endpoints available at http://localhost:${PORT}/`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server
// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = app;
