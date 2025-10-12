/**
 * SMS Service
 * Handles SMS message creation, storage, and delivery simulation
 */

const logger = require('../utils/logger');
const { validateArgentinaPhone, validateMessageBody, validateWebhookUrl } = require('./validation.service');

// In-memory storage for SMS messages
const smsStore = new Map();

// Cost per segment in ARS (mock)
const COST_PER_SEGMENT = parseFloat(process.env.SMS_COST_PER_SEGMENT || '0.05');

// SMS segment size
const SEGMENT_SIZE = 160;

/**
 * Generates a unique SMS ID
 * @returns {string} - Unique SMS ID
 */
function generateSmsId() {
  return `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculates number of SMS segments
 * @param {string} message - Message body
 * @returns {number} - Number of segments
 */
function calculateSegments(message) {
  return Math.ceil(message.length / SEGMENT_SIZE);
}

/**
 * Calculates SMS cost
 * @param {string} message - Message body
 * @returns {number} - Cost in ARS
 */
function calculateCost(message) {
  const segments = calculateSegments(message);
  return (segments * COST_PER_SEGMENT).toFixed(2);
}

/**
 * Triggers webhook callback
 * @param {string} event - Event type (delivered, failed, etc.)
 * @param {object} sms - SMS object
 */
async function triggerWebhook(event, sms) {
  if (!sms.webhookUrl) {
    return;
  }

  try {
    logger.info('Triggering webhook', {
      event,
      smsId: sms.id,
      webhookUrl: sms.webhookUrl
    });

    // In a real implementation, this would make an HTTP POST request
    // For mock purposes, we just log it
    logger.debug('Webhook payload', {
      event,
      sms: {
        id: sms.id,
        to: sms.to,
        status: sms.status,
        timestamp: sms.updatedAt
      }
    });
  } catch (error) {
    logger.error('Webhook delivery failed', {
      error: error.message,
      smsId: sms.id
    });
  }
}

/**
 * Simulates SMS delivery
 * @param {object} sms - SMS object
 */
function simulateDelivery(sms) {
  // Skip simulation in test mode to prevent timer leaks
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Simulate queued -> sent -> delivered flow

  // After 1 second, mark as sent
  setTimeout(() => {
    const existingSms = smsStore.get(sms.id);
    if (!existingSms) return; // SMS was deleted

    existingSms.status = 'sent';
    existingSms.updatedAt = new Date().toISOString();
    logger.info('SMS sent', { smsId: existingSms.id, to: existingSms.to });
  }, 1000);

  // After 2 seconds total, mark as delivered (95% success rate)
  setTimeout(() => {
    const existingSms = smsStore.get(sms.id);
    if (!existingSms) return; // SMS was deleted

    const isSuccess = Math.random() < 0.95;

    if (isSuccess) {
      existingSms.status = 'delivered';
      existingSms.deliveredAt = new Date().toISOString();
      logger.info('SMS delivered', { smsId: existingSms.id, to: existingSms.to });
      triggerWebhook('delivered', existingSms);
    } else {
      existingSms.status = 'failed';
      existingSms.errorMessage = 'Delivery failed: Network error';
      logger.warn('SMS delivery failed', { smsId: existingSms.id, to: existingSms.to });
      triggerWebhook('failed', existingSms);
    }

    existingSms.updatedAt = new Date().toISOString();
  }, 2000);
}

/**
 * Creates and sends an SMS
 * @param {object} params - SMS parameters
 * @returns {object} - Created SMS object
 */
function createSms({ to, body, from, webhookUrl }) {
  // Validate phone number
  const phoneValidation = validateArgentinaPhone(to);
  if (!phoneValidation.isValid) {
    throw new Error(phoneValidation.error);
  }

  // Validate message body
  const bodyValidation = validateMessageBody(body);
  if (!bodyValidation.isValid) {
    throw new Error(bodyValidation.error);
  }

  // Validate webhook URL if provided
  const webhookValidation = validateWebhookUrl(webhookUrl);
  if (!webhookValidation.isValid) {
    throw new Error(webhookValidation.error);
  }

  // Create SMS object
  const sms = {
    id: generateSmsId(),
    to: phoneValidation.normalized,
    body,
    from: from || process.env.SMS_FROM_NUMBER || '+54 11 0000-0000',
    status: 'queued',
    segments: calculateSegments(body),
    cost: calculateCost(body),
    webhookUrl: webhookUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveredAt: null,
    errorMessage: null
  };

  // Store SMS
  smsStore.set(sms.id, sms);

  logger.info('SMS created', {
    smsId: sms.id,
    to: sms.to,
    segments: sms.segments,
    cost: sms.cost
  });

  // Simulate delivery
  simulateDelivery(sms);

  return sms;
}

/**
 * Gets SMS by ID
 * @param {string} id - SMS ID
 * @returns {object|null} - SMS object or null
 */
function getSmsById(id) {
  return smsStore.get(id) || null;
}

/**
 * Gets all SMS messages
 * @param {object} filters - Optional filters
 * @returns {array} - Array of SMS objects
 */
function getAllSms(filters = {}) {
  let messages = Array.from(smsStore.values());

  // Apply filters
  if (filters.status) {
    messages = messages.filter(sms => sms.status === filters.status);
  }

  if (filters.to) {
    messages = messages.filter(sms => sms.to.includes(filters.to));
  }

  if (filters.limit) {
    messages = messages.slice(0, parseInt(filters.limit));
  }

  // Sort by creation date (newest first)
  messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return messages;
}

/**
 * Gets SMS statistics
 * @returns {object} - SMS statistics
 */
function getSmsStats() {
  const messages = Array.from(smsStore.values());

  return {
    total: messages.length,
    queued: messages.filter(s => s.status === 'queued').length,
    sent: messages.filter(s => s.status === 'sent').length,
    delivered: messages.filter(s => s.status === 'delivered').length,
    failed: messages.filter(s => s.status === 'failed').length,
    totalCost: messages.reduce((sum, s) => sum + parseFloat(s.cost), 0).toFixed(2),
    totalSegments: messages.reduce((sum, s) => sum + s.segments, 0)
  };
}

/**
 * Clears all SMS messages (for testing)
 */
function clearAllSms() {
  const count = smsStore.size;
  smsStore.clear();
  logger.info('SMS store cleared', { count });
  return { cleared: count };
}

module.exports = {
  createSms,
  getSmsById,
  getAllSms,
  getSmsStats,
  clearAllSms,
  calculateSegments,
  calculateCost,
  SEGMENT_SIZE,
  COST_PER_SEGMENT
};
