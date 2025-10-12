const express = require('express');
const router = express.Router();
const messageService = require('../services/message.service');
const webhookService = require('../services/webhook.service');
const logger = require('../utils/logger');

/**
 * POST /v1/messages
 * Send a text message
 */
router.post('/v1/messages', async (req, res) => {
  try {
    const { to, type = 'text', text, template, image, document, audio, video } = req.body;

    let response;

    // Handle different message types
    if (type === 'text' && text) {
      response = messageService.sendMessage({
        to,
        body: text.body,
        type: 'text',
        preview_url: text.preview_url || false
      });
    } else if (type === 'template' && template) {
      response = messageService.sendTemplateMessage({
        to,
        template
      });
    } else if (type === 'image' && image) {
      response = messageService.sendMediaMessage({
        to,
        type: 'image',
        media: image
      });
    } else if (type === 'document' && document) {
      response = messageService.sendMediaMessage({
        to,
        type: 'document',
        media: document
      });
    } else if (type === 'audio' && audio) {
      response = messageService.sendMediaMessage({
        to,
        type: 'audio',
        media: audio
      });
    } else if (type === 'video' && video) {
      response = messageService.sendMediaMessage({
        to,
        type: 'video',
        media: video
      });
    } else {
      return res.status(400).json({
        error: {
          message: 'Invalid message type or missing required fields',
          type: 'invalid_request',
          code: 400
        }
      });
    }

    // Simulate async delivery with webhooks (only in non-test environment)
    const messageId = response.messages[0].id;

    if (process.env.NODE_ENV !== 'test') {
      const messageDetails = messageService.getMessageStatus(messageId);

      // Schedule status updates
      setTimeout(() => {
        const msg = messageService.getMessageStatus(messageId);
        if (msg) {
          messageService.updateMessageStatus(messageId, 'delivered');
          webhookService.scheduleWebhook('delivered', msg, 0);
        }
      }, 1000);

      setTimeout(() => {
        const msg = messageService.getMessageStatus(messageId);
        if (msg) {
          messageService.updateMessageStatus(messageId, 'read');
          webhookService.scheduleWebhook('read', msg, 0);
        }
      }, 5000);
    }

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error sending message', { error: error.message });

    res.status(400).json({
      error: {
        message: error.message,
        type: 'invalid_request',
        code: 400
      }
    });
  }
});

/**
 * POST /v1/messages/template
 * Send a template message (alternative endpoint)
 */
router.post('/v1/messages/template', async (req, res) => {
  try {
    const { to, template } = req.body;

    const response = messageService.sendTemplateMessage({
      to,
      template
    });

    // Simulate async delivery with webhooks (only in non-test environment)
    const messageId = response.messages[0].id;

    if (process.env.NODE_ENV !== 'test') {
      const messageDetails = messageService.getMessageStatus(messageId);

      // Schedule status updates
      setTimeout(() => {
        const msg = messageService.getMessageStatus(messageId);
        if (msg) {
          messageService.updateMessageStatus(messageId, 'delivered');
          webhookService.scheduleWebhook('delivered', msg, 0);
        }
      }, 1000);

      setTimeout(() => {
        const msg = messageService.getMessageStatus(messageId);
        if (msg) {
          messageService.updateMessageStatus(messageId, 'read');
          webhookService.scheduleWebhook('read', msg, 0);
        }
      }, 5000);
    }

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error sending template message', { error: error.message });

    res.status(400).json({
      error: {
        message: error.message,
        type: 'invalid_request',
        code: 400
      }
    });
  }
});

/**
 * GET /v1/messages/:id
 * Get message status
 */
router.get('/v1/messages/:id', (req, res) => {
  try {
    const { id } = req.params;

    const status = messageService.getMessageStatus(id);

    if (!status) {
      return res.status(404).json({
        error: {
          message: 'Message not found',
          type: 'not_found',
          code: 404
        }
      });
    }

    res.status(200).json(status);

  } catch (error) {
    logger.error('Error getting message status', { error: error.message });

    res.status(500).json({
      error: {
        message: error.message,
        type: 'server_error',
        code: 500
      }
    });
  }
});

/**
 * GET /v1/messages
 * Get all messages (for dashboard/debugging)
 */
router.get('/v1/messages', (req, res) => {
  try {
    const messages = messageService.getAllMessages();

    res.status(200).json({
      messages,
      total: messages.length
    });

  } catch (error) {
    logger.error('Error getting messages', { error: error.message });

    res.status(500).json({
      error: {
        message: error.message,
        type: 'server_error',
        code: 500
      }
    });
  }
});

/**
 * GET /v1/templates
 * Get available templates
 */
router.get('/v1/templates', (req, res) => {
  try {
    const templates = messageService.getTemplates();

    res.status(200).json({
      templates,
      total: templates.length
    });

  } catch (error) {
    logger.error('Error getting templates', { error: error.message });

    res.status(500).json({
      error: {
        message: error.message,
        type: 'server_error',
        code: 500
      }
    });
  }
});

module.exports = router;
