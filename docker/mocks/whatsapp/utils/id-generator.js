const { v4: uuidv4 } = require('uuid');

/**
 * Generate a WhatsApp-style message ID
 * Format: wamid.{random-uuid}
 */
function generateMessageId() {
  return `wamid.${uuidv4().replace(/-/g, '')}`;
}

/**
 * Generate a media ID
 * Format: media.{random-uuid}
 */
function generateMediaId() {
  return `media.${uuidv4().replace(/-/g, '')}`;
}

module.exports = {
  generateMessageId,
  generateMediaId
};
