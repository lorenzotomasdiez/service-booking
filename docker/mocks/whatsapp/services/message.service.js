const { generateMessageId } = require('../utils/id-generator');
const logger = require('../utils/logger');

// In-memory message store
const messageStore = new Map();

// Template store
const templateStore = new Map([
  ['booking_confirmation', {
    name: 'booking_confirmation',
    language: 'es',
    components: [
      { type: 'BODY', text: 'Hola {{1}}, tu reserva ha sido confirmada para el {{2}} a las {{3}}.' },
      { type: 'FOOTER', text: 'BarberPro' }
    ]
  }],
  ['booking_reminder', {
    name: 'booking_reminder',
    language: 'es',
    components: [
      { type: 'BODY', text: 'Recordatorio: Tienes una reserva mañana a las {{1}}.' },
      { type: 'FOOTER', text: 'BarberPro' }
    ]
  }],
  ['booking_cancelled', {
    name: 'booking_cancelled',
    language: 'es',
    components: [
      { type: 'BODY', text: 'Tu reserva del {{1}} ha sido cancelada.' },
      { type: 'FOOTER', text: 'BarberPro' }
    ]
  }]
]);

class MessageService {
  /**
   * Send a text message
   */
  sendMessage(data) {
    const { to, body, type = 'text', preview_url = false } = data;

    // Validate required fields
    if (!to || !body) {
      throw new Error('Missing required fields: to, body');
    }

    // Validate phone number format (basic validation)
    if (!this.validatePhoneNumber(to)) {
      throw new Error('Invalid phone number format');
    }

    const message = {
      messaging_product: 'whatsapp',
      contacts: [{ input: to, wa_id: to }],
      messages: [{
        id: generateMessageId(),
        message_status: 'accepted'
      }]
    };

    // Store message details
    const messageDetails = {
      id: message.messages[0].id,
      to,
      body,
      type,
      preview_url,
      status: 'sent',
      timestamp: new Date().toISOString(),
      delivered_at: null,
      read_at: null
    };

    messageStore.set(messageDetails.id, messageDetails);

    logger.info('Message sent', {
      messageId: messageDetails.id,
      to,
      type
    });

    return message;
  }

  /**
   * Send a template message
   */
  sendTemplateMessage(data) {
    const { to, template } = data;

    // Validate required fields
    if (!to || !template || !template.name) {
      throw new Error('Missing required fields: to, template.name');
    }

    // Validate phone number
    if (!this.validatePhoneNumber(to)) {
      throw new Error('Invalid phone number format');
    }

    // Check if template exists
    const templateData = templateStore.get(template.name);
    if (!templateData) {
      throw new Error(`Template '${template.name}' not found`);
    }

    const message = {
      messaging_product: 'whatsapp',
      contacts: [{ input: to, wa_id: to }],
      messages: [{
        id: generateMessageId(),
        message_status: 'accepted'
      }]
    };

    // Store message details
    const messageDetails = {
      id: message.messages[0].id,
      to,
      type: 'template',
      template: template.name,
      template_data: templateData,
      parameters: template.components || [],
      status: 'sent',
      timestamp: new Date().toISOString(),
      delivered_at: null,
      read_at: null
    };

    messageStore.set(messageDetails.id, messageDetails);

    logger.info('Template message sent', {
      messageId: messageDetails.id,
      to,
      template: template.name
    });

    return message;
  }

  /**
   * Send a media message
   */
  sendMediaMessage(data) {
    const { to, type, media } = data;

    // Validate required fields
    if (!to || !type || !media) {
      throw new Error('Missing required fields: to, type, media');
    }

    // Validate phone number
    if (!this.validatePhoneNumber(to)) {
      throw new Error('Invalid phone number format');
    }

    // Validate media type
    const validMediaTypes = ['image', 'document', 'audio', 'video'];
    if (!validMediaTypes.includes(type)) {
      throw new Error(`Invalid media type. Must be one of: ${validMediaTypes.join(', ')}`);
    }

    const message = {
      messaging_product: 'whatsapp',
      contacts: [{ input: to, wa_id: to }],
      messages: [{
        id: generateMessageId(),
        message_status: 'accepted'
      }]
    };

    // Store message details
    const messageDetails = {
      id: message.messages[0].id,
      to,
      type,
      media: {
        id: media.id || null,
        link: media.link || null,
        caption: media.caption || null,
        filename: media.filename || null
      },
      status: 'sent',
      timestamp: new Date().toISOString(),
      delivered_at: null,
      read_at: null
    };

    messageStore.set(messageDetails.id, messageDetails);

    logger.info('Media message sent', {
      messageId: messageDetails.id,
      to,
      mediaType: type
    });

    return message;
  }

  /**
   * Get message status
   */
  getMessageStatus(messageId) {
    const message = messageStore.get(messageId);

    if (!message) {
      return null;
    }

    return {
      id: message.id,
      status: message.status,
      timestamp: message.timestamp,
      delivered_at: message.delivered_at,
      read_at: message.read_at,
      to: message.to
    };
  }

  /**
   * Get all messages
   */
  getAllMessages() {
    return Array.from(messageStore.values()).sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  /**
   * Update message status
   */
  updateMessageStatus(messageId, status, timestamp = new Date().toISOString()) {
    const message = messageStore.get(messageId);

    if (!message) {
      logger.warn('Attempted to update non-existent message', { messageId });
      return false;
    }

    message.status = status;

    if (status === 'delivered') {
      message.delivered_at = timestamp;
    } else if (status === 'read') {
      message.read_at = timestamp;
    }

    messageStore.set(messageId, message);

    logger.info('Message status updated', {
      messageId,
      status
    });

    return true;
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return Array.from(templateStore.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  /**
   * Validate phone number format
   * Accepts formats:
   * - +54xxxxxxxxxx
   * - 54xxxxxxxxxx
   * - +54 9 xx xxxx-xxxx
   */
  validatePhoneNumber(phone) {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Check if it starts with +54 or 54 (Argentina)
    const argentinaRegex = /^\+?54\d{10,}$/;

    // Also accept generic international format
    const internationalRegex = /^\+?\d{10,15}$/;

    return argentinaRegex.test(cleaned) || internationalRegex.test(cleaned);
  }

  /**
   * Clear all messages (for testing)
   */
  clearMessages() {
    messageStore.clear();
    logger.info('Message store cleared');
  }
}

module.exports = new MessageService();
