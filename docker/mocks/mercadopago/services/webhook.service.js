const axios = require('axios');
const logger = require('../utils/logger');

// Webhook ID counter
let webhookIdCounter = 3000000000;

/**
 * Generate a unique webhook ID
 */
function generateWebhookId() {
  return ++webhookIdCounter;
}

/**
 * Send webhook notification
 */
async function sendWebhook(webhookUrl, payment, action = 'payment.created') {
  if (!webhookUrl) {
    logger.warn('No webhook URL configured, skipping webhook delivery');
    return null;
  }

  const webhook = {
    id: generateWebhookId(),
    live_mode: false,
    type: 'payment',
    date_created: new Date().toISOString(),
    application_id: '123456789',
    user_id: '987654321',
    version: 1,
    api_version: 'v1',
    action: action,
    data: {
      id: String(payment.id)
    }
  };

  try {
    logger.info(`Sending webhook to ${webhookUrl}`, { webhook_id: webhook.id, payment_id: payment.id });
    
    const response = await axios.post(webhookUrl, webhook, {
      headers: {
        'Content-Type': 'application/json',
        'x-signature': generateSignature(webhook),
        'x-request-id': webhook.id
      },
      timeout: 5000
    });

    logger.info(`Webhook delivered successfully`, { 
      webhook_id: webhook.id, 
      status: response.status 
    });

    return {
      webhook_id: webhook.id,
      status: 'delivered',
      status_code: response.status,
      delivered_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to deliver webhook`, { 
      webhook_id: webhook.id, 
      error: error.message 
    });

    return {
      webhook_id: webhook.id,
      status: 'failed',
      error: error.message,
      attempted_at: new Date().toISOString()
    };
  }
}

/**
 * Generate webhook signature (mock implementation)
 * In real MercadoPago, this uses HMAC-SHA256
 */
function generateSignature(webhook) {
  // This is a simplified mock signature
  // Real MercadoPago uses: HMAC-SHA256(secret, data_id + request_id)
  const data = `${webhook.data.id}${webhook.id}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Trigger webhook with delay
 */
async function triggerWebhookWithDelay(webhookUrl, payment, action, delayMs = 0) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const result = await sendWebhook(webhookUrl, payment, action);
      resolve(result);
    }, delayMs);
  });
}

/**
 * Simulate payment status transition with webhooks
 */
async function simulatePaymentTransition(webhookUrl, payment, scenario) {
  const results = [];

  // Initial creation webhook
  results.push(await sendWebhook(webhookUrl, payment, 'payment.created'));

  // Simulate transitions based on scenario
  if (scenario === 'pending') {
    // Pending payment might later be approved
    await new Promise(resolve => setTimeout(resolve, 2000));
    results.push(await sendWebhook(webhookUrl, payment, 'payment.updated'));
  } else if (scenario === 'success') {
    // Immediate approval
    await new Promise(resolve => setTimeout(resolve, 500));
    results.push(await sendWebhook(webhookUrl, payment, 'payment.updated'));
  }

  return results;
}

module.exports = {
  generateWebhookId,
  sendWebhook,
  generateSignature,
  triggerWebhookWithDelay,
  simulatePaymentTransition
};
