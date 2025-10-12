const express = require('express');
const router = express.Router();
const mediaService = require('../services/media.service');
const logger = require('../utils/logger');

/**
 * POST /v1/media
 * Upload media
 */
router.post('/v1/media', async (req, res) => {
  try {
    const { file, type, filename, mimetype } = req.body;

    const response = mediaService.uploadMedia({
      file,
      type,
      filename,
      mimetype
    });

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error uploading media', { error: error.message });

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
 * GET /v1/media/:id
 * Get media by ID
 */
router.get('/v1/media/:id', (req, res) => {
  try {
    const { id } = req.params;

    const media = mediaService.getMedia(id);

    if (!media) {
      return res.status(404).json({
        error: {
          message: 'Media not found',
          type: 'not_found',
          code: 404
        }
      });
    }

    res.status(200).json(media);

  } catch (error) {
    logger.error('Error getting media', { error: error.message });

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
 * DELETE /v1/media/:id
 * Delete media
 */
router.delete('/v1/media/:id', (req, res) => {
  try {
    const { id } = req.params;

    const deleted = mediaService.deleteMedia(id);

    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Media not found',
          type: 'not_found',
          code: 404
        }
      });
    }

    res.status(200).json({
      success: true
    });

  } catch (error) {
    logger.error('Error deleting media', { error: error.message });

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
 * GET /v1/media
 * Get all media (for dashboard/debugging)
 */
router.get('/v1/media', (req, res) => {
  try {
    const media = mediaService.getAllMedia();

    res.status(200).json({
      media,
      total: media.length
    });

  } catch (error) {
    logger.error('Error getting media list', { error: error.message });

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
