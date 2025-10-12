const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');
const paymentService = require('./services/payment.service');
const webhookService = require('./services/webhook.service');

// Routes
const paymentsRouter = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.MERCADOPAGO_MOCK_PORT || process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(req.method + ' ' + req.path, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MercadoPago Mock API',
      version: '1.0.0',
      description: 'Mock server for MercadoPago payment gateway - Argentina',
    },
    servers: [
      {
        url: 'http://localhost:' + PORT,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files (dashboard)
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'mercadopago-mock'
  });
});

// Dashboard endpoint (legacy)
app.get('/dashboard', (req, res) => {
  const stats = paymentService.getStatistics();
  const payments = paymentService.getAllPayments();

  res.json({
    statistics: stats,
    recent_payments: payments.slice(0, 10)
  });
});

// Dashboard Routes (Stream D)
app.use('/api/dashboard', dashboardRoutes.router);

// API routes
app.use('/', paymentsRouter);

// Admin/Test endpoints
app.get('/admin/payments', (req, res) => {
  const payments = paymentService.getAllPayments();
  res.json({
    total: payments.length,
    payments: payments
  });
});

app.delete('/admin/payments', (req, res) => {
  paymentService.clearAllPayments();
  res.json({
    message: 'All payments cleared successfully'
  });
});

app.post('/admin/webhook/test', async (req, res) => {
  const payment_id = req.body.payment_id;
  const webhook_url = req.body.webhook_url;
  
  const payment = paymentService.getPayment(payment_id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const url = webhook_url || process.env.MERCADOPAGO_MOCK_WEBHOOK_URL;
  if (!url) {
    return res.status(400).json({ error: 'Webhook URL required' });
  }

  const result = await webhookService.sendWebhook(url, payment, 'payment.updated');
  res.json(result);
});

app.get('/admin/statistics', (req, res) => {
  const stats = paymentService.getStatistics();
  res.json(stats);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  const defaultScenario = process.env.MERCADOPAGO_MOCK_DEFAULT_SCENARIO || 'success';
  const webhookUrl = process.env.MERCADOPAGO_MOCK_WEBHOOK_URL || 'not configured';
  
  logger.info('MercadoPago Mock Server started on port ' + PORT);
  logger.info('Swagger documentation available at http://localhost:' + PORT + '/docs');
  logger.info('Dashboard available at http://localhost:' + PORT + '/dashboard');
  logger.info('Health check at http://localhost:' + PORT + '/health');
  logger.info('Default scenario: ' + defaultScenario);
  logger.info('Webhook URL: ' + webhookUrl);
});

module.exports = app;
