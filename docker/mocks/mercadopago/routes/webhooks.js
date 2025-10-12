/**
 * Webhook Routes
 * Provides endpoints for webhook management and manual triggering
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const webhookService = require('../services/webhook.service');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/webhooks/trigger/{paymentId}:
 *   post:
 *     summary: Manually trigger webhook for a payment
 *     description: Trigger webhook notification for testing purposes with configurable delay
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID to trigger webhook for
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               delay:
 *                 type: number
 *                 description: Delay in ms before sending webhook
 *                 example: 1000
 *                 default: 0
 *               action:
 *                 type: string
 *                 description: Webhook action type
 *                 example: payment.updated
 *                 default: payment.updated
 *                 enum: [payment.created, payment.updated]
 *               enableRetry:
 *                 type: boolean
 *                 description: Enable retry logic on failure
 *                 example: true
 *                 default: true
 *               webhookUrl:
 *                 type: string
 *                 description: Optional custom webhook URL (overrides configured URL)
 *                 example: http://localhost:3000/api/webhooks/mercadopago
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
 *                   example: Webhook triggered
 *                 paymentId:
 *                   type: string
 *                 action:
 *                   type: string
 *                 delay:
 *                   type: number
 *                 webhookUrl:
 *                   type: string
 *                 scheduled:
 *                   type: boolean
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Failed to trigger webhook
 */
router.post('/api/webhooks/trigger/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const {
    delay = 0,
    action = 'payment.updated',
    enableRetry = true,
    webhookUrl: customWebhookUrl
  } = req.body;

  logger.info('Manual webhook trigger requested', {
    paymentId,
    action,
    delay,
    enableRetry
  });

  // Get payment from payment service
  const payment = paymentService.getPayment(paymentId);

  if (!payment) {
    logger.warn('Payment not found for webhook trigger', { paymentId });
    return res.status(404).json({
      error: 'payment_not_found',
      message: 'Payment not found',
      paymentId
    });
  }

  try {
    // Determine webhook URL to use
    const targetUrl = customWebhookUrl || webhookService.webhookUrl;

    // If delay is specified, trigger asynchronously
    if (delay > 0) {
      // Don't await - trigger in background
      if (customWebhookUrl) {
        webhookService.triggerWebhookWithDelay(customWebhookUrl, payment, action, delay)
          .catch(err => logger.error('Webhook trigger failed', { error: err.message }));
      } else {
        webhookService.triggerWebhook(payment, action, delay, enableRetry)
          .catch(err => logger.error('Webhook trigger failed', { error: err.message }));
      }

      return res.json({
        message: 'Webhook scheduled',
        paymentId,
        action,
        delay,
        webhookUrl: targetUrl,
        scheduled: true,
        note: `Webhook will be sent in ${delay}ms`
      });
    }

    // Otherwise trigger immediately and wait for result
    let result;
    if (customWebhookUrl) {
      result = await webhookService.triggerWebhookWithDelay(customWebhookUrl, payment, action, 0);
    } else {
      result = await webhookService.triggerWebhook(payment, action, 0, enableRetry);
    }

    res.json({
      message: 'Webhook triggered',
      paymentId,
      action,
      delay,
      webhookUrl: targetUrl,
      scheduled: false,
      result: {
        webhook_id: result.webhook_id,
        status: result.status,
        delivered_at: result.delivered_at,
        error: result.error
      }
    });
  } catch (error) {
    logger.error('Error triggering webhook', {
      paymentId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'webhook_trigger_failed',
      message: 'Failed to trigger webhook',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/webhooks/config:
 *   get:
 *     summary: Get webhook configuration
 *     description: Returns current webhook configuration including URL and retry settings
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhookUrl:
 *                   type: string
 *                   example: http://localhost:3000/api/webhooks/mercadopago
 *                 retryAttempts:
 *                   type: number
 *                   example: 3
 *                 retryDelay:
 *                   type: string
 *                   example: exponential backoff (2000ms base)
 *                 baseDelay:
 *                   type: number
 *                   example: 2000
 */
router.get('/api/webhooks/config', (req, res) => {
  logger.info('Webhook config requested');

  const config = webhookService.getConfig();

  res.json({
    ...config,
    message: 'Current webhook configuration'
  });
});

/**
 * @swagger
 * /api/webhooks/config:
 *   put:
 *     summary: Update webhook URL
 *     description: Updates the configured webhook URL for all future webhook deliveries
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - webhookUrl
 *             properties:
 *               webhookUrl:
 *                 type: string
 *                 description: New webhook URL
 *                 example: http://localhost:3000/api/webhooks/mercadopago
 *     responses:
 *       200:
 *         description: Webhook URL updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Webhook URL updated
 *                 webhookUrl:
 *                   type: string
 *                 previousUrl:
 *                   type: string
 *       400:
 *         description: Invalid request (missing webhookUrl)
 */
router.put('/api/webhooks/config', (req, res) => {
  const { webhookUrl } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'webhookUrl is required'
    });
  }

  // Validate URL format (basic validation)
  try {
    new URL(webhookUrl);
  } catch (error) {
    return res.status(400).json({
      error: 'invalid_url',
      message: 'Invalid webhook URL format'
    });
  }

  const previousUrl = webhookService.webhookUrl;

  logger.info('Updating webhook URL', {
    previousUrl,
    newUrl: webhookUrl
  });

  webhookService.setWebhookUrl(webhookUrl);

  res.json({
    message: 'Webhook URL updated',
    webhookUrl: webhookUrl,
    previousUrl: previousUrl
  });
});

/**
 * @swagger
 * /api/webhooks/test:
 *   post:
 *     summary: Test webhook delivery
 *     description: Test webhook delivery without requiring an existing payment
 *     tags: [Webhooks]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhookUrl:
 *                 type: string
 *                 description: Webhook URL to test
 *                 example: http://localhost:3000/api/webhooks/mercadopago
 *               paymentId:
 *                 type: string
 *                 description: Optional payment ID to test with (uses mock if not provided)
 *                 example: "1000000001"
 *     responses:
 *       200:
 *         description: Test webhook sent
 *       400:
 *         description: Invalid request
 */
router.post('/api/webhooks/test', async (req, res) => {
  const { webhookUrl, paymentId } = req.body;

  const targetUrl = webhookUrl || webhookService.webhookUrl;

  if (!targetUrl) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'webhookUrl is required'
    });
  }

  let payment;

  if (paymentId) {
    payment = paymentService.getPayment(paymentId);
    if (!payment) {
      return res.status(404).json({
        error: 'payment_not_found',
        message: 'Payment not found',
        paymentId
      });
    }
  } else {
    // Create a mock payment for testing
    payment = {
      id: 9999999999,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 100.00,
      payer: {
        id: 'test_user',
        email: 'test@example.com'
      },
      payment_method_id: 'visa',
      date_created: new Date().toISOString()
    };
  }

  logger.info('Testing webhook delivery', {
    webhookUrl: targetUrl,
    paymentId: payment.id
  });

  try {
    const result = await webhookService.sendWebhook(targetUrl, payment, 'payment.updated');

    res.json({
      message: 'Test webhook sent',
      webhookUrl: targetUrl,
      paymentId: payment.id,
      result: {
        webhook_id: result.webhook_id,
        status: result.status,
        status_code: result.status_code,
        delivered_at: result.delivered_at,
        error: result.error
      }
    });
  } catch (error) {
    logger.error('Test webhook failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'webhook_test_failed',
      message: 'Failed to send test webhook',
      details: error.message
    });
  }
});

module.exports = router;
