const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');

// ===== Logger Configuration =====
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    }),
  ],
});

// ===== Express App Configuration =====
const app = express();
const PORT = process.env.MERCADOPAGO_MOCK_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
  });
  next();
});

// ===== Health Check Endpoint =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mercadopago-mock',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ===== Payment Routes =====
// (Stream A)
const paymentRoutes = require('./routes/payments');
app.use('/v1/payments', paymentRoutes);

// ===== Refund Routes =====
// (Stream B will add)
// const refundRoutes = require('./routes/refunds');
// app.use('/v1/payments/:id/refunds', refundRoutes);

// ===== Webhook Routes =====
// (Stream C will add)
// const webhookRoutes = require('./routes/webhooks');
// app.use('/webhooks', webhookRoutes);

// ===== Dashboard Routes =====
// (Stream D will add)
// app.use('/dashboard', express.static('public'));

// ===== Error Handling =====
app.use((err, req, res, next) => {
  logger.error('Error handling request', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    status: err.statusCode || 500,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    status: 404,
    timestamp: new Date().toISOString(),
  });
});

// ===== Server Start =====
app.listen(PORT, () => {
  logger.info(`MercadoPago Mock Server running on port ${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    webhookUrl: process.env.MERCADOPAGO_MOCK_WEBHOOK_URL || 'not configured',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
