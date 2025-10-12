require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('./utils/logger');
const config = require('./utils/config');
const db = require('./database/db');

const app = express();
const PORT = process.env.AFIP_MOCK_PORT || 3002;

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
    service: 'afip-mock-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.getInstance().getDb() ? 'connected' : 'disconnected'
  };

  res.json(healthStatus);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AFIP Mock Server',
    version: '1.0.0',
    description: 'Mock server for AFIP WebServices (Argentina Federal Tax Authority)',
    endpoints: {
      health: '/health',
      docs: '/docs'
    },
    note: 'This is a MOCK server for development purposes only'
  });
});

// Configuration endpoint (for debugging)
app.get('/config', (req, res) => {
  try {
    const configData = {
      taxCategories: config.getTaxCategories(),
      invoiceTypes: config.getInvoiceTypes(),
      validationRules: config.getValidationRules()
    };
    res.json(configData);
  } catch (error) {
    logger.error('Failed to retrieve configuration', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: ['/health', '/', '/config']
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
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Close database connection
    await db.close();
    logger.info('Database connection closed');

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
    // Load configuration
    config.load();
    logger.info('Configuration loaded');

    // Initialize database
    await db.init();
    logger.info('Database initialized');

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`AFIP Mock Server started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server
start();

module.exports = app;
