const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const webhookService = require('../services/webhook.service');
const logger = require('../utils/logger');

/**
 * @swagger
 * /v1/payments:
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: scenario
 *         schema:
 *           type: string
 *         description: Scenario name (success, pending, rejected, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_amount
 *               - payment_method_id
 *               - payer
 *             properties:
 *               transaction_amount:
 *                 type: number
 *               payment_method_id:
 *                 type: string
 *               payer:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment created
 *       400:
 *         description: Invalid request
 */
router.post('/v1/payments', async (req, res) => {
  logger.info('POST /v1/payments', { scenario: req.query.scenario });

  // Validate request
  const errors = paymentService.validatePaymentRequest(req.body);
  if (errors.length > 0) {
    logger.warn('Payment validation failed', { errors });
    return res.status(400).json({
      error: 'bad_request',
      message: 'Invalid payment request',
      details: errors
    });
  }

  try {
    const scenario = paymentService.getScenario(req.query.scenario);
    
    // Simulate timeout scenario
    if (scenario.simulate_timeout) {
      logger.info('Simulating timeout scenario');
      await new Promise(resolve => setTimeout(resolve, scenario.delay_ms));
      return res.status(408).json({
        error: 'timeout',
        message: 'Request timeout'
      });
    }

    // Simulate network error
    if (scenario.simulate_error) {
      logger.info('Simulating network error');
      return res.status(500).json({
        error: scenario.error_code || 'internal_server_error',
        message: 'Internal server error'
      });
    }

    // Simulate delay
    if (scenario.delay_ms > 0) {
      await new Promise(resolve => setTimeout(resolve, scenario.delay_ms));
    }

    // Create payment
    const payment = paymentService.createPayment(req.body, req.query.scenario);

    // Send webhook asynchronously if URL is provided
    const webhookUrl = req.body.notification_url || process.env.MERCADOPAGO_MOCK_WEBHOOK_URL;
    if (webhookUrl) {
      // Get scenario delay for webhook
      const webhookDelay = scenario.delay_ms || 500;

      // Don't await - trigger webhook asynchronously with delay
      if (webhookUrl !== webhookService.webhookUrl) {
        // Custom webhook URL provided in notification_url
        webhookService.triggerWebhookWithDelay(webhookUrl, payment, 'payment.created', webhookDelay)
          .catch(err => logger.error('Webhook delivery failed', { error: err.message }));
      } else {
        // Use configured webhook URL
        webhookService.triggerWebhook(payment, 'payment.created', webhookDelay, true)
          .catch(err => logger.error('Webhook delivery failed', { error: err.message }));
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    logger.error('Error creating payment', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'internal_server_error',
      message: 'Failed to create payment'
    });
  }
});

/**
 * @swagger
 * /v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment found
 *       404:
 *         description: Payment not found
 */
router.get('/v1/payments/:id', (req, res) => {
  logger.info('GET /v1/payments/:id', { payment_id: req.params.id });

  const payment = paymentService.getPayment(req.params.id);

  if (!payment) {
    logger.warn('Payment not found', { payment_id: req.params.id });
    return res.status(404).json({
      error: 'not_found',
      message: 'Payment not found'
    });
  }

  res.json(payment);
});

/**
 * @swagger
 * /v1/payments/{id}/refunds:
 *   post:
 *     summary: Refund a payment
 *     tags: [Refunds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Refund created
 *       404:
 *         description: Payment not found
 */
router.post('/v1/payments/:id/refunds', async (req, res) => {
  logger.info('POST /v1/payments/:id/refunds', { 
    payment_id: req.params.id,
    amount: req.body.amount 
  });

  const result = paymentService.createRefund(
    parseInt(req.params.id),
    req.body.amount
  );

  if (result.error) {
    const statusCode = result.error === 'payment_not_found' ? 404 : 400;
    return res.status(statusCode).json({
      error: result.error,
      message: `Refund failed: ${result.error}`
    });
  }

  // Send webhook for refund with minimal delay
  const payment = paymentService.getPayment(req.params.id);
  const webhookUrl = payment.notification_url || process.env.MERCADOPAGO_MOCK_WEBHOOK_URL;
  if (webhookUrl) {
    // Trigger webhook with small delay for refund events
    if (webhookUrl !== webhookService.webhookUrl) {
      webhookService.triggerWebhookWithDelay(webhookUrl, payment, 'payment.updated', 500)
        .catch(err => logger.error('Webhook delivery failed', { error: err.message }));
    } else {
      webhookService.triggerWebhook(payment, 'payment.updated', 500, true)
        .catch(err => logger.error('Webhook delivery failed', { error: err.message }));
    }
  }

  res.status(201).json(result);
});

/**
 * @swagger
 * /v1/payment_methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [Payment Methods]
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get('/v1/payment_methods', (req, res) => {
  logger.info('GET /v1/payment_methods');
  const methods = paymentService.getPaymentMethods();
  res.json(methods);
});

module.exports = router;
