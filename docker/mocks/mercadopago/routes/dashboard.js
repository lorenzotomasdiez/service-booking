/**
 * Dashboard API Routes
 * Provides endpoints for dashboard scenario control and transaction management
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const webhookService = require('../services/webhook.service');
const fs = require('fs');
const path = require('path');

// Load scenarios configuration
let scenarios;
try {
  scenarios = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../config/scenarios.json'), 'utf8')
  );
} catch (error) {
  console.error('Failed to load scenarios.json', error);
  scenarios = { default: 'success', scenarios: {} };
}

// In-memory storage for current scenario
let currentScenario = scenarios.default || 'success';

// Maximum transactions to store
const MAX_TRANSACTIONS = 100;

/**
 * @swagger
 * /api/dashboard/scenario:
 *   get:
 *     summary: Get current scenario
 *     description: Returns the currently active payment scenario
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Current scenario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scenario:
 *                   type: string
 *                   enum: [success, pending, rejected, timeout]
 *                   example: success
 */
router.get('/scenario', (req, res) => {
  const availableScenarios = Object.keys(scenarios.scenarios || {});

  res.json({
    scenario: currentScenario,
    availableScenarios: availableScenarios.length > 0
      ? availableScenarios
      : ['success', 'pending', 'rejected', 'timeout'],
  });
});

/**
 * @swagger
 * /api/dashboard/scenario:
 *   put:
 *     summary: Set current scenario
 *     description: Changes the active payment scenario
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scenario
 *             properties:
 *               scenario:
 *                 type: string
 *                 enum: [success, pending, rejected, timeout]
 *                 example: success
 *     responses:
 *       200:
 *         description: Scenario updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scenario:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Scenario updated successfully
 *       400:
 *         description: Invalid scenario
 */
router.put('/scenario', (req, res) => {
  const { scenario } = req.body;

  const validScenarios = Object.keys(scenarios.scenarios || {});

  if (validScenarios.length === 0) {
    validScenarios.push('success', 'pending', 'rejected', 'timeout');
  }

  if (!scenario || !validScenarios.includes(scenario)) {
    return res.status(400).json({
      error: 'Invalid scenario',
      validScenarios,
    });
  }

  currentScenario = scenario;
  scenarios.default = scenario;

  res.json({
    scenario: currentScenario,
    message: 'Scenario updated successfully',
  });
});

/**
 * @swagger
 * /api/dashboard/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Returns all stored transactions (max 100 most recent)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: number
 */
router.get('/transactions', (req, res) => {
  // Get all payments from payment service
  const payments = paymentService.getAllPayments();

  // Transform payments to transaction format
  const transactions = payments.slice(0, MAX_TRANSACTIONS).map(payment => ({
    id: payment.id.toString(),
    amount: payment.transaction_amount,
    status: payment.status,
    paymentMethod: payment.payment_method_id,
    timestamp: payment.date_created,
  }));

  res.json({
    transactions,
    count: transactions.length,
  });
});

/**
 * @swagger
 * /api/dashboard/transactions:
 *   delete:
 *     summary: Clear transaction history
 *     description: Removes all stored transactions
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Transactions cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction history cleared
 *                 deletedCount:
 *                   type: number
 */
router.delete('/transactions', (req, res) => {
  const payments = paymentService.getAllPayments();
  const deletedCount = payments.length;

  paymentService.clearAllPayments();

  res.json({
    message: 'Transaction history cleared',
    deletedCount,
  });
});

/**
 * @swagger
 * /api/dashboard/webhook/{paymentId}:
 *   post:
 *     summary: Trigger webhook manually
 *     description: Manually triggers a webhook notification for a specific payment
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID to trigger webhook for
 *     responses:
 *       200:
 *         description: Webhook triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *                 webhookUrl:
 *                   type: string
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Failed to trigger webhook
 */
router.post('/webhook/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  // Get payment from payment service
  const payment = paymentService.getPayment(paymentId);

  if (!payment) {
    return res.status(404).json({
      error: 'Payment not found',
      paymentId,
    });
  }

  // Get webhook URL from environment or use default
  const webhookUrl = process.env.MERCADOPAGO_MOCK_WEBHOOK_URL || 'http://backend:3000/api/webhooks/mercadopago';

  try {
    // Send webhook using webhook service
    const result = await webhookService.sendWebhook(webhookUrl, payment, 'payment.updated');

    res.json({
      message: 'Webhook triggered successfully',
      paymentId,
      webhookUrl,
      webhookSent: result.success,
      payload: result.payload,
    });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    res.status(500).json({
      error: 'Failed to trigger webhook',
      message: error.message,
    });
  }
});

// Helper function to get current scenario (used by other modules)
function getCurrentScenario() {
  return currentScenario;
}

// Helper function to set current scenario (used by other modules)
function setCurrentScenario(scenario) {
  currentScenario = scenario;
  return currentScenario;
}

// Export router and helper functions
module.exports = {
  router,
  getCurrentScenario,
  setCurrentScenario,
};
