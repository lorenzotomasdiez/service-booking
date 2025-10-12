const logger = require('../utils/logger');
const config = require('../utils/config');

/**
 * CUIT/CUIL Validation Service
 *
 * Provides validation and formatting for Argentine CUIT/CUIL numbers
 * CUIT format: XX-XXXXXXXX-X (11 digits total)
 *
 * Validation includes:
 * - Length validation (must be 11 digits)
 * - Checksum validation using AFIP algorithm
 * - Format validation
 */
class CUITService {
  constructor() {
    this.CUIT_LENGTH = 11;
    this.WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  }

  /**
   * Validate CUIT/CUIL number with checksum verification
   * @param {string} cuit - CUIT number (can include hyphens)
   * @returns {boolean} - True if valid, false otherwise
   */
  validateCUIT(cuit) {
    try {
      // Remove hyphens and spaces
      const cleaned = this.cleanCUIT(cuit);

      // Length validation
      if (cleaned.length !== this.CUIT_LENGTH) {
        logger.debug('CUIT validation failed: invalid length', {
          cuit: cuit,
          length: cleaned.length,
          expected: this.CUIT_LENGTH
        });
        return false;
      }

      // Check if all characters are digits
      if (!/^\d+$/.test(cleaned)) {
        logger.debug('CUIT validation failed: non-numeric characters', { cuit: cuit });
        return false;
      }

      // Checksum validation using AFIP algorithm
      const isValid = this.validateChecksum(cleaned);

      if (isValid) {
        logger.debug('CUIT validation successful', { cuit: cuit });
      } else {
        logger.debug('CUIT validation failed: invalid checksum', { cuit: cuit });
      }

      return isValid;
    } catch (error) {
      logger.error('CUIT validation error', {
        cuit: cuit,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate CUIT checksum using AFIP algorithm
   * @param {string} cuit - Cleaned CUIT (11 digits, no hyphens)
   * @returns {boolean} - True if checksum is valid
   */
  validateChecksum(cuit) {
    let sum = 0;

    // Calculate weighted sum of first 10 digits
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cuit[i]) * this.WEIGHTS[i];
    }

    // Calculate expected check digit
    let checkDigit = 11 - (sum % 11);

    // Handle special cases
    if (checkDigit === 11) {
      checkDigit = 0;
    } else if (checkDigit === 10) {
      checkDigit = 9;
    }

    // Compare with actual check digit
    const actualCheckDigit = parseInt(cuit[10]);
    return checkDigit === actualCheckDigit;
  }

  /**
   * Clean CUIT by removing hyphens and spaces
   * @param {string} cuit - CUIT number
   * @returns {string} - Cleaned CUIT (digits only)
   */
  cleanCUIT(cuit) {
    if (typeof cuit !== 'string') {
      return '';
    }
    return cuit.replace(/[-\s]/g, '');
  }

  /**
   * Format CUIT in standard format XX-XXXXXXXX-X
   * @param {string} cuit - CUIT number (can be with or without hyphens)
   * @returns {string|null} - Formatted CUIT or null if invalid
   */
  formatCUIT(cuit) {
    try {
      const cleaned = this.cleanCUIT(cuit);

      if (cleaned.length !== this.CUIT_LENGTH) {
        logger.debug('CUIT formatting failed: invalid length', { cuit: cuit });
        return null;
      }

      // Format as XX-XXXXXXXX-X
      const formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 10)}-${cleaned.substring(10, 11)}`;

      logger.debug('CUIT formatted successfully', {
        original: cuit,
        formatted: formatted
      });

      return formatted;
    } catch (error) {
      logger.error('CUIT formatting error', {
        cuit: cuit,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Extract type identifier from CUIT (first 2 digits)
   * @param {string} cuit - CUIT number
   * @returns {string|null} - Type identifier (20, 23, 24, 27, 30, 33, 34)
   */
  getCUITType(cuit) {
    const cleaned = this.cleanCUIT(cuit);

    if (cleaned.length !== this.CUIT_LENGTH) {
      return null;
    }

    const typeId = cleaned.substring(0, 2);

    // Map type identifiers to their meanings
    const types = {
      '20': 'Persona Física Masculino',
      '23': 'Persona Física - No Residente',
      '24': 'Persona Física - Nuevo',
      '27': 'Persona Física Femenino',
      '30': 'Persona Jurídica',
      '33': 'Persona Jurídica - Nacional',
      '34': 'Persona Jurídica - Extranjera'
    };

    return types[typeId] || 'Desconocido';
  }

  /**
   * Validate and format CUIT in one operation
   * @param {string} cuit - CUIT number
   * @returns {object} - Validation result with formatted CUIT
   */
  validateAndFormat(cuit) {
    const isValid = this.validateCUIT(cuit);

    return {
      valid: isValid,
      formatted: isValid ? this.formatCUIT(cuit) : null,
      cleaned: isValid ? this.cleanCUIT(cuit) : null,
      type: isValid ? this.getCUITType(cuit) : null
    };
  }

  /**
   * Generate a random valid CUIT for testing purposes
   * @param {string} typeId - Type identifier (20, 23, 24, 27, 30, 33, 34)
   * @returns {string} - Valid CUIT in format XX-XXXXXXXX-X
   */
  generateRandomCUIT(typeId = '20') {
    // Generate random 8 middle digits
    const middle = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Build first 10 digits
    const first10 = typeId + middle;

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(first10[i]) * this.WEIGHTS[i];
    }

    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 11) {
      checkDigit = 0;
    } else if (checkDigit === 10) {
      checkDigit = 9;
    }

    const cuit = first10 + checkDigit;
    return this.formatCUIT(cuit);
  }
}

// Export singleton instance
module.exports = new CUITService();
