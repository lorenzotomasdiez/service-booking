const logger = require('../utils/logger');

class WebhookService {
  constructor() {
    this.webhookUrl = process.env.WHATSAPP_MOCK_WEBHOOK_URL || null;
    this.webhookCallbacks = [];
  }

  /**
   * Set webhook URL
   */
  setWebhookUrl(url) {
    this.webhookUrl = url;
    logger.info('Webhook URL set', { url });
  }

  /**
   * Get webhook URL
   */
  getWebhookUrl() {
    return this.webhookUrl;
  }

  /**
   * Trigger webhook callback
   */
  async triggerWebhook(event, message) {
    if (!this.webhookUrl) {
      logger.debug('No webhook URL configured, skipping webhook trigger', {
        event,
        messageId: message.id
      });
      return;
    }

    const payload = this.buildWebhookPayload(event, message);

    // Store webhook attempt
    const webhookAttempt = {
      timestamp: new Date().toISOString(),
      event,
      messageId: message.id,
      url: this.webhookUrl,
      payload,
      status: 'pending'
    };

    this.webhookCallbacks.push(webhookAttempt);

    try {
      // In a real implementation, this would make an HTTP request
      // For mock purposes, we'll just log it
      logger.info('Webhook triggered', {
        event,
        messageId: message.id,
        url: this.webhookUrl
      });

      // Simulate HTTP request (in reality, you'd use axios or fetch)
      // const response = await fetch(this.webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });

      webhookAttempt.status = 'success';
      webhookAttempt.completed_at = new Date().toISOString();

      return true;
    } catch (error) {
      logger.error('Webhook delivery failed', {
        event,
        messageId: message.id,
        error: error.message
      });

      webhookAttempt.status = 'failed';
      webhookAttempt.error = error.message;
      webhookAttempt.completed_at = new Date().toISOString();

      return false;
    }
  }

  /**
   * Build webhook payload according to WhatsApp Business API format
   */
  buildWebhookPayload(event, message) {
    const basePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'BUSINESS_ACCOUNT_ID',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'PHONE_NUMBER_ID'
            }
          },
          field: 'messages'
        }]
      }]
    };

    // Add status update to the payload
    if (event === 'delivered' || event === 'read' || event === 'failed') {
      basePayload.entry[0].changes[0].value.statuses = [{
        id: message.id,
        status: event,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        recipient_id: message.to,
        conversation: {
          id: 'CONVERSATION_ID',
          origin: {
            type: 'business_initiated'
          }
        },
        pricing: {
          billable: true,
          pricing_model: 'CBP',
          category: 'business_initiated'
        }
      }];
    }

    return basePayload;
  }

  /**
   * Get webhook history
   */
  getWebhookHistory() {
    return this.webhookCallbacks.slice(-100); // Last 100 webhooks
  }

  /**
   * Clear webhook history
   */
  clearWebhookHistory() {
    this.webhookCallbacks = [];
    logger.info('Webhook history cleared');
  }

  /**
   * Schedule delayed webhook
   */
  scheduleWebhook(event, message, delayMs) {
    setTimeout(() => {
      this.triggerWebhook(event, message);
    }, delayMs);

    logger.debug('Webhook scheduled', {
      event,
      messageId: message.id,
      delayMs
    });
  }
}

module.exports = new WebhookService();
