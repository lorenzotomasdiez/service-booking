const { generateMediaId } = require('../utils/id-generator');
const logger = require('../utils/logger');

// In-memory media store
const mediaStore = new Map();

class MediaService {
  /**
   * Upload media
   */
  uploadMedia(data) {
    const { file, type, filename, mimetype } = data;

    // Validate required fields
    if (!type) {
      throw new Error('Missing required field: type');
    }

    // Validate media type
    const validMediaTypes = ['image', 'document', 'audio', 'video'];
    if (!validMediaTypes.includes(type)) {
      throw new Error(`Invalid media type. Must be one of: ${validMediaTypes.join(', ')}`);
    }

    const mediaId = generateMediaId();

    const media = {
      id: mediaId,
      type,
      filename: filename || `file_${Date.now()}`,
      mimetype: mimetype || 'application/octet-stream',
      size: file?.size || 0,
      url: file?.url || null,
      uploaded_at: new Date().toISOString()
    };

    mediaStore.set(mediaId, media);

    logger.info('Media uploaded', {
      mediaId,
      type,
      filename: media.filename
    });

    return {
      id: mediaId
    };
  }

  /**
   * Get media by ID
   */
  getMedia(mediaId) {
    const media = mediaStore.get(mediaId);

    if (!media) {
      return null;
    }

    return media;
  }

  /**
   * Delete media
   */
  deleteMedia(mediaId) {
    const exists = mediaStore.has(mediaId);

    if (!exists) {
      return false;
    }

    mediaStore.delete(mediaId);

    logger.info('Media deleted', { mediaId });

    return true;
  }

  /**
   * Get all media
   */
  getAllMedia() {
    return Array.from(mediaStore.values()).sort((a, b) =>
      new Date(b.uploaded_at) - new Date(a.uploaded_at)
    );
  }

  /**
   * Clear all media (for testing)
   */
  clearMedia() {
    mediaStore.clear();
    logger.info('Media store cleared');
  }
}

module.exports = new MediaService();
