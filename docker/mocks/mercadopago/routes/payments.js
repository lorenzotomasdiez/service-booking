const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const winston = require('winston');

// Logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

/**
 * POST /v1/payments
 * Create a new payment
 *
 * Query params:
 *   - scenario: Scenario name to apply (optional, defaults to configured default)
 *
 * Body:
 *   - transaction_amount: number (required)
 *   - payment_method_id: string (required)
 *   - payer: object (required)
 *     - email: string (required)
 *     - identification: object (optional)
 *     - phone: object (optional)
 *   - description: string (optional)
 *   - installments: number (optional, default 1)
 *   - metadata: object (optional)
 */
router.post('/', async (req, res, next) => {
  try {
    const scenarioName = req.query.scenario;
    const paymentData = req.body;

    logger.info('Creating payment', {
      scenario: scenarioName,
      amount: paymentData.transaction_amount,
      paymentMethod: paymentData.payment_method_id,
    });

    const payment = await paymentService.createPayment(paymentData, scenarioName);

    logger.info('Payment created successfully', {
      paymentId: payment.id,
      status: payment.status,
    });

    // Return 201 Created
    res.status(201).json(payment);
  } catch (error) {
    logger.error('Failed to create payment', {
      error: error.message,
      details: error.details,
    });
    next(error);
  }
});

/**
 * GET /v1/payments/:id
 * Get payment details by ID
 *
 * Params:
 *   - id: Payment ID (required)
 */
router.get('/:id', (req, res, next) => {
  try {
    const paymentId = req.params.id;

    logger.info('Fetching payment', { paymentId });

    const payment = paymentService.getPayment(paymentId);

    logger.info('Payment retrieved successfully', {
      paymentId: payment.id,
      status: payment.status,
    });

    res.json(payment);
  } catch (error) {
    logger.error('Failed to fetch payment', {
      paymentId: req.params.id,
      error: error.message,
    });
    next(error);
  }
});

/**
 * PUT /v1/payments/:id
 * Update payment (for status transitions)
 *
 * Params:
 *   - id: Payment ID (required)
 *
 * Body:
 *   - status: string (optional)
 *   - status_detail: string (optional)
 */
router.put('/:id', (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const updates = req.body;

    logger.info('Updating payment', {
      paymentId,
      updates,
    });

    const payment = paymentService.updatePayment(paymentId, updates);

    logger.info('Payment updated successfully', {
      paymentId: payment.id,
      status: payment.status,
    });

    res.json(payment);
  } catch (error) {
    logger.error('Failed to update payment', {
      paymentId: req.params.id,
      error: error.message,
    });
    next(error);
  }
});

/**
 * GET /v1/payments
 * Get all payments (for testing/debugging)
 */
router.get('/', (req, res) => {
  logger.info('Fetching all payments');

  const payments = paymentService.getAllPayments();

  res.json({
    results: payments,
    paging: {
      total: payments.length,
      limit: 100,
      offset: 0,
    },
  });
});

/**
 * DELETE /v1/payments
 * Clear all payments (for testing)
 */
router.delete('/', (req, res) => {
  logger.info('Clearing all payments');

  paymentService.clearPayments();

  res.json({
    message: 'All payments cleared',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
