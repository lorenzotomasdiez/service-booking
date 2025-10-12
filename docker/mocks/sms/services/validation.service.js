/**
 * Validation Service
 * Handles phone number validation for Argentina (+54) format
 */

const logger = require('../utils/logger');

/**
 * Argentina phone number regex
 * Format: +54 9 11 1234-5678
 * Also accepts variations:
 * - +54 9 11 12345678
 * - +549111234-5678
 * - +5491112345678
 */
const ARGENTINA_PHONE_REGEX = /^\+54\s?9?\s?\d{2}\s?\d{4}-?\d{4}$/;

/**
 * Validates Argentina phone number format
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result with isValid and normalized phone
 */
function validateArgentinaPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required and must be a string',
      normalized: null
    };
  }

  const isValid = ARGENTINA_PHONE_REGEX.test(phone);

  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid phone format. Expected: +54 9 11 1234-5678',
      normalized: null
    };
  }

  // Normalize phone number (remove spaces and hyphens)
  const normalized = phone.replace(/[\s-]/g, '');

  logger.debug('Phone validation', { phone, normalized, isValid });

  return {
    isValid: true,
    error: null,
    normalized
  };
}

/**
 * Validates SMS message body
 * @param {string} body - Message body
 * @returns {object} - Validation result
 */
function validateMessageBody(body) {
  if (!body || typeof body !== 'string') {
    return {
      isValid: false,
      error: 'Message body is required and must be a string'
    };
  }

  if (body.length === 0) {
    return {
      isValid: false,
      error: 'Message body cannot be empty'
    };
  }

  if (body.length > 1600) {
    return {
      isValid: false,
      error: 'Message body exceeds maximum length of 1600 characters (10 segments)'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates webhook URL
 * @param {string} webhookUrl - Webhook URL
 * @returns {object} - Validation result
 */
function validateWebhookUrl(webhookUrl) {
  if (!webhookUrl) {
    return { isValid: true, error: null }; // Webhook is optional
  }

  if (typeof webhookUrl !== 'string') {
    return {
      isValid: false,
      error: 'Webhook URL must be a string'
    };
  }

  try {
    const url = new URL(webhookUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: 'Webhook URL must use HTTP or HTTPS protocol'
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid webhook URL format'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates bulk SMS request
 * @param {array} messages - Array of message objects
 * @returns {object} - Validation result
 */
function validateBulkMessages(messages) {
  if (!Array.isArray(messages)) {
    return {
      isValid: false,
      error: 'Messages must be an array'
    };
  }

  if (messages.length === 0) {
    return {
      isValid: false,
      error: 'Messages array cannot be empty'
    };
  }

  if (messages.length > 100) {
    return {
      isValid: false,
      error: 'Bulk SMS limited to 100 messages per request'
    };
  }

  // Validate each message
  const errors = [];
  messages.forEach((msg, index) => {
    if (!msg.to) {
      errors.push(`Message ${index}: Missing 'to' field`);
    }
    if (!msg.body) {
      errors.push(`Message ${index}: Missing 'body' field`);
    }
  });

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join(', ')
    };
  }

  return {
    isValid: true,
    error: null
  };
}

module.exports = {
  validateArgentinaPhone,
  validateMessageBody,
  validateWebhookUrl,
  validateBulkMessages,
  ARGENTINA_PHONE_REGEX
};
