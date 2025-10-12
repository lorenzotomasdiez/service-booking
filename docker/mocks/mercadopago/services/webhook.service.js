const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Webhook ID counter
let webhookIdCounter = 3000000000;

/**
 * Webhook Service Class
 * Handles webhook delivery with retry logic and configurable settings
 */
class WebhookService {
  constructor() {
    this.webhookUrl = process.env.MERCADOPAGO_MOCK_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/mercadopago';
    this.deliveryQueue = [];
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 2000 // 2 seconds base delay for exponential backoff
    };
  }

  /**
   * Generate a unique webhook ID
   */
  generateWebhookId() {
    return ++webhookIdCounter;
  }

  /**
   * Build webhook payload following MercadoPago format
   * @param {Object} payment - Payment object
   * @param {string} action - Event action (payment.created, payment.updated)
   * @returns {Object} Webhook payload
   */
  buildWebhookPayload(payment, action = 'payment.updated') {
    return {
      id: this.generateWebhookId(),
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      application_id: '123456789',
      user_id: payment.payer?.id || 'mock_user',
      version: 1,
      api_version: 'v1',
      action: action,
      data: {
        id: String(payment.id)
      }
    };
  }

  /**
   * Generate webhook signature (mock HMAC-SHA256)
   * @param {Object} webhook - Webhook payload
   * @returns {string} Signature
   */
  generateSignature(webhook) {
    const secret = process.env.WEBHOOK_SECRET || 'mock_secret';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(webhook))
      .digest('hex');
  }

  /**
   * Send webhook notification
   * @param {string} webhookUrl - Target URL (optional, uses configured URL if not provided)
   * @param {Object} payment - Payment object
   * @param {string} action - Event action
   * @returns {Object} Delivery result
   */
  async sendWebhook(webhookUrl, payment, action = 'payment.created') {
    // Handle legacy signature (webhookUrl, payment, action)
    const targetUrl = webhookUrl || this.webhookUrl;

    if (!targetUrl) {
      logger.warn('No webhook URL configured, skipping webhook delivery');
      return {
        webhook_id: null,
        status: 'skipped',
        message: 'No webhook URL configured'
      };
    }

    const webhook = this.buildWebhookPayload(payment, action);

    try {
      logger.info(`Sending webhook to ${targetUrl}`, {
        webhook_id: webhook.id,
        payment_id: payment.id,
        action: action
      });

      const response = await axios.post(targetUrl, webhook, {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': this.generateSignature(webhook),
          'X-Request-Id': String(webhook.id)
        },
        timeout: 5000
      });

      logger.info(`Webhook delivered successfully`, {
        webhook_id: webhook.id,
        payment_id: payment.id,
        status: response.status
      });

      return {
        webhook_id: webhook.id,
        status: 'delivered',
        status_code: response.status,
        delivered_at: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      logger.error(`Failed to deliver webhook`, {
        webhook_id: webhook.id,
        payment_id: payment.id,
        error: error.message
      });

      return {
        webhook_id: webhook.id,
        status: 'failed',
        error: error.message,
        attempted_at: new Date().toISOString(),
        success: false
      };
    }
  }

  /**
   * Retry webhook delivery with exponential backoff
   * @param {Object} payment - Payment object
   * @param {string} action - Event action
   * @param {number} attempt - Current attempt number
   * @param {number} maxAttempts - Maximum retry attempts
   * @returns {Object} Delivery result
   */
  async retryWebhook(payment, action, attempt = 1, maxAttempts = null) {
    const max = maxAttempts || this.retryConfig.maxAttempts;

    if (attempt >= max) {
      logger.error('Webhook max retries exceeded', {
        payment_id: payment.id,
        attempts: attempt
      });
      return {
        webhook_id: null,
        status: 'failed',
        error: 'Max retries exceeded',
        attempts: attempt
      };
    }

    const retryDelay = attempt * this.retryConfig.baseDelay; // Exponential backoff

    return new Promise((resolve) => {
      setTimeout(async () => {
        logger.info('Retrying webhook', {
          payment_id: payment.id,
          attempt: attempt + 1,
          delay: retryDelay
        });

        const result = await this.sendWebhook(this.webhookUrl, payment, action);

        if (!result.success) {
          const retryResult = await this.retryWebhook(payment, action, attempt + 1, max);
          resolve(retryResult);
        } else {
          resolve(result);
        }
      }, retryDelay);
    });
  }

  /**
   * Trigger webhook for payment event with configurable delay
   * @param {Object} payment - Payment object
   * @param {string} action - Event action (payment.created, payment.updated)
   * @param {number} delay - Delay in ms before sending
   * @param {boolean} enableRetry - Enable retry logic on failure
   * @returns {Promise<Object>} Delivery result
   */
  async triggerWebhook(payment, action = 'payment.updated', delay = 0, enableRetry = true) {
    if (delay > 0) {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await this.sendWebhook(this.webhookUrl, payment, action);

          // Retry if failed and retry is enabled
          if (!result.success && enableRetry) {
            const retryResult = await this.retryWebhook(payment, action, 1);
            resolve(retryResult);
          } else {
            resolve(result);
          }
        }, delay);
      });
    } else {
      const result = await this.sendWebhook(this.webhookUrl, payment, action);

      // Retry if failed and retry is enabled
      if (!result.success && enableRetry) {
        return await this.retryWebhook(payment, action, 1);
      }

      return result;
    }
  }

  /**
   * Trigger webhook with delay (alias for backward compatibility)
   */
  async triggerWebhookWithDelay(webhookUrl, payment, action, delayMs = 0) {
    // Store original URL
    const originalUrl = this.webhookUrl;

    // Temporarily set webhook URL if provided
    if (webhookUrl) {
      this.webhookUrl = webhookUrl;
    }

    const result = await this.triggerWebhook(payment, action, delayMs, true);

    // Restore original URL
    this.webhookUrl = originalUrl;

    return result;
  }

  /**
   * Simulate payment status transition with webhooks
   * @param {string} webhookUrl - Target URL
   * @param {Object} payment - Payment object
   * @param {string} scenario - Scenario name
   * @returns {Array<Object>} Array of delivery results
   */
  async simulatePaymentTransition(webhookUrl, payment, scenario) {
    const results = [];

    // Store original URL
    const originalUrl = this.webhookUrl;

    // Use provided URL or default
    if (webhookUrl) {
      this.webhookUrl = webhookUrl;
    }

    // Initial creation webhook
    results.push(await this.sendWebhook(this.webhookUrl, payment, 'payment.created'));

    // Simulate transitions based on scenario
    if (scenario === 'pending') {
      // Pending payment might later be approved
      await new Promise(resolve => setTimeout(resolve, 2000));
      results.push(await this.sendWebhook(this.webhookUrl, payment, 'payment.updated'));
    } else if (scenario === 'success') {
      // Immediate approval
      await new Promise(resolve => setTimeout(resolve, 500));
      results.push(await this.sendWebhook(this.webhookUrl, payment, 'payment.updated'));
    }

    // Restore original URL
    this.webhookUrl = originalUrl;

    return results;
  }

  /**
   * Get webhook configuration
   * @returns {Object} Configuration
   */
  getConfig() {
    return {
      webhookUrl: this.webhookUrl,
      retryAttempts: this.retryConfig.maxAttempts,
      retryDelay: `exponential backoff (${this.retryConfig.baseDelay}ms base)`,
      baseDelay: this.retryConfig.baseDelay
    };
  }

  /**
   * Update webhook URL
   * @param {string} url - New webhook URL
   */
  setWebhookUrl(url) {
    this.webhookUrl = url;
    logger.info('Webhook URL updated', { webhookUrl: url });
  }
}

// Export singleton instance
module.exports = new WebhookService();
