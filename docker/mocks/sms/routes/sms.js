/**
 * SMS Routes
 * API endpoints for SMS operations
 */

const express = require('express');
const logger = require('../utils/logger');
const smsService = require('../services/sms.service');
const { validateBulkMessages } = require('../services/validation.service');

const router = express.Router();

/**
 * POST /v1/sms - Send single SMS
 */
router.post('/v1/sms', async (req, res) => {
  try {
    const { to, body, from, webhookUrl } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "to" is required'
      });
    }

    if (!body) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "body" is required'
      });
    }

    const sms = smsService.createSms({ to, body, from, webhookUrl });

    logger.info('SMS send request', {
      smsId: sms.id,
      to: sms.to,
      segments: sms.segments
    });

    res.status(201).json({
      success: true,
      data: {
        id: sms.id,
        to: sms.to,
        body: sms.body,
        from: sms.from,
        status: sms.status,
        segments: sms.segments,
        cost: sms.cost,
        createdAt: sms.createdAt
      }
    });

  } catch (error) {
    logger.error('SMS send failed', { error: error.message });

    res.status(400).json({
      error: 'Bad Request',
      message: error.message
    });
  }
});

/**
 * GET /v1/sms/:id - Get SMS status
 */
router.get('/v1/sms/:id', (req, res) => {
  try {
    const { id } = req.params;

    const sms = smsService.getSmsById(id);

    if (!sms) {
      return res.status(404).json({
        error: 'Not Found',
        message: `SMS with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: {
        id: sms.id,
        to: sms.to,
        body: sms.body,
        from: sms.from,
        status: sms.status,
        segments: sms.segments,
        cost: sms.cost,
        createdAt: sms.createdAt,
        updatedAt: sms.updatedAt,
        deliveredAt: sms.deliveredAt,
        errorMessage: sms.errorMessage
      }
    });

  } catch (error) {
    logger.error('Get SMS failed', { error: error.message });

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /v1/sms/bulk - Send bulk SMS
 */
router.post('/v1/sms/bulk', async (req, res) => {
  try {
    const { messages, webhookUrl } = req.body;

    if (!messages) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "messages" is required'
      });
    }

    // Validate bulk messages
    const validation = validateBulkMessages(messages);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: validation.error
      });
    }

    // Create all SMS messages
    const results = [];
    const errors = [];

    for (let i = 0; i < messages.length; i++) {
      try {
        const msg = messages[i];
        const sms = smsService.createSms({
          to: msg.to,
          body: msg.body,
          from: msg.from,
          webhookUrl: msg.webhookUrl || webhookUrl
        });

        results.push({
          index: i,
          success: true,
          smsId: sms.id,
          to: sms.to,
          status: sms.status,
          segments: sms.segments,
          cost: sms.cost
        });

      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error.message,
          to: messages[i].to
        });

        logger.error('Bulk SMS individual failure', {
          index: i,
          error: error.message
        });
      }
    }

    const totalCost = results.reduce((sum, r) => sum + parseFloat(r.cost), 0).toFixed(2);
    const totalSegments = results.reduce((sum, r) => sum + r.segments, 0);

    logger.info('Bulk SMS request', {
      total: messages.length,
      successful: results.length,
      failed: errors.length,
      totalCost,
      totalSegments
    });

    res.status(201).json({
      success: true,
      data: {
        total: messages.length,
        successful: results.length,
        failed: errors.length,
        totalCost,
        totalSegments,
        results,
        errors
      }
    });

  } catch (error) {
    logger.error('Bulk SMS send failed', { error: error.message });

    res.status(400).json({
      error: 'Bad Request',
      message: error.message
    });
  }
});

/**
 * GET /v1/sms - Get all SMS messages
 */
router.get('/v1/sms', (req, res) => {
  try {
    const { status, to, limit } = req.query;

    const messages = smsService.getAllSms({ status, to, limit });

    res.json({
      success: true,
      data: {
        count: messages.length,
        messages: messages.map(sms => ({
          id: sms.id,
          to: sms.to,
          body: sms.body,
          from: sms.from,
          status: sms.status,
          segments: sms.segments,
          cost: sms.cost,
          createdAt: sms.createdAt,
          updatedAt: sms.updatedAt
        }))
      }
    });

  } catch (error) {
    logger.error('Get all SMS failed', { error: error.message });

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /v1/sms/stats - Get SMS statistics
 */
router.get('/v1/stats', (req, res) => {
  try {
    const stats = smsService.getSmsStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get SMS stats failed', { error: error.message });

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * DELETE /v1/sms - Clear all SMS (for testing)
 */
router.delete('/v1/sms', (req, res) => {
  try {
    const result = smsService.clearAllSms();

    res.json({
      success: true,
      message: `Cleared ${result.cleared} SMS messages`
    });

  } catch (error) {
    logger.error('Clear SMS failed', { error: error.message });

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
