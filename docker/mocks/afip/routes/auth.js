const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const config = require('../utils/config');

/**
 * AFIP WSAA (Web Services Authentication and Authorization) Mock Routes
 *
 * These routes simulate AFIP's authentication endpoints for local development.
 * In production, you would authenticate against the real AFIP WSAA service.
 */

/**
 * POST /wsaa/auth
 * Mock authentication endpoint - generates a mock token
 *
 * Request body:
 * {
 *   "cuit": "20-12345678-9"
 * }
 *
 * Response:
 * {
 *   "token": "mock-token-xxxx",
 *   "expiration": "2025-10-13T01:42:30Z",
 *   "sign": "mocked-signature",
 *   "generated_at": "2025-10-12T01:42:30Z"
 * }
 */
router.post('/wsaa/auth', async (req, res) => {
  try {
    const { cuit } = req.body;

    // Validate CUIT presence
    if (!cuit) {
      logger.warn('WSAA auth request missing CUIT');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'CUIT is required'
      });
    }

    // Validate CUIT format (basic format check)
    const cuitNormalized = cuit.replace(/[-\s]/g, '');
    if (!/^\d{11}$/.test(cuitNormalized)) {
      logger.warn('WSAA auth request with invalid CUIT format', { cuit });
      return res.status(400).json({
        error: 'INVALID_CUIT_FORMAT',
        message: 'CUIT must be 11 digits (format: XX-XXXXXXXX-X or XXXXXXXXXXX)'
      });
    }

    // Get response delay from config (simulate network latency)
    const delays = config.getResponseDelays();
    if (delays.auth > 0) {
      await new Promise(resolve => setTimeout(resolve, delays.auth));
    }

    // Generate mock token
    const timestamp = Date.now();
    const token = `mock-token-${cuitNormalized}-${timestamp}`;
    const generatedAt = new Date().toISOString();
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    logger.info('WSAA authentication successful', {
      cuit: cuitNormalized,
      token_preview: `${token.substring(0, 30)}...`
    });

    res.json({
      token,
      expiration,
      sign: `mocked-signature-${timestamp}`,
      generated_at: generatedAt,
      service: 'wsfe', // Web Service Factura Electrónica
      cuit: cuitNormalized
    });

  } catch (error) {
    logger.error('WSAA authentication error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service error'
    });
  }
});

/**
 * POST /wsaa/loginCms
 * Alternative authentication endpoint (used by some AFIP integrations)
 *
 * Request body:
 * {
 *   "cms": "base64-encoded-cms-signature"
 * }
 *
 * Response: Similar to /wsaa/auth
 */
router.post('/wsaa/loginCms', async (req, res) => {
  try {
    const { cms } = req.body;

    if (!cms) {
      logger.warn('WSAA loginCms request missing CMS');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'CMS signature is required'
      });
    }

    // Get response delay from config
    const delays = config.getResponseDelays();
    if (delays.auth > 0) {
      await new Promise(resolve => setTimeout(resolve, delays.auth));
    }

    // Generate mock token
    const timestamp = Date.now();
    const token = `mock-token-cms-${timestamp}`;
    const generatedAt = new Date().toISOString();
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    logger.info('WSAA loginCms authentication successful');

    res.json({
      token,
      expiration,
      sign: `mocked-signature-${timestamp}`,
      generated_at: generatedAt,
      source: 'cms'
    });

  } catch (error) {
    logger.error('WSAA loginCms error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service error'
    });
  }
});

/**
 * GET /wsaa/status
 * Check WSAA service status
 */
router.get('/wsaa/status', (req, res) => {
  logger.debug('WSAA status check');

  res.json({
    service: 'WSAA Mock',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: 'POST /wsaa/auth',
      loginCms: 'POST /wsaa/loginCms'
    }
  });
});

module.exports = router;
