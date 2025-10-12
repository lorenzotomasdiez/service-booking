const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhook.service');
const logger = require('../utils/logger');

/**
 * POST /v1/webhooks/config
 * Configure webhook URL
 */
router.post('/v1/webhooks/config', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: url',
          type: 'invalid_request',
          code: 400
        }
      });
    }

    webhookService.setWebhookUrl(url);

    res.status(200).json({
      success: true,
      webhook_url: url
    });

  } catch (error) {
    logger.error('Error configuring webhook', { error: error.message });

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
 * GET /v1/webhooks/config
 * Get current webhook configuration
 */
router.get('/v1/webhooks/config', (req, res) => {
  try {
    const url = webhookService.getWebhookUrl();

    res.status(200).json({
      webhook_url: url
    });

  } catch (error) {
    logger.error('Error getting webhook config', { error: error.message });

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
 * GET /v1/webhooks/history
 * Get webhook delivery history
 */
router.get('/v1/webhooks/history', (req, res) => {
  try {
    const history = webhookService.getWebhookHistory();

    res.status(200).json({
      webhooks: history,
      total: history.length
    });

  } catch (error) {
    logger.error('Error getting webhook history', { error: error.message });

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
 * POST /v1/webhooks/clear
 * Clear webhook history
 */
router.post('/v1/webhooks/clear', (req, res) => {
  try {
    webhookService.clearWebhookHistory();

    res.status(200).json({
      success: true,
      message: 'Webhook history cleared'
    });

  } catch (error) {
    logger.error('Error clearing webhook history', { error: error.message });

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
