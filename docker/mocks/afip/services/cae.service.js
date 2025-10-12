const logger = require('../utils/logger');
const config = require('../utils/config');

/**
 * CAE (Código de Autorización Electrónico) Service
 *
 * Generates and manages CAE codes for electronic invoices
 * CAE format: 14 digits (YYYYMMDDXXXXXX)
 *
 * Features:
 * - CAE generation with date prefix
 * - Expiration date calculation (10 days default)
 * - CAE format validation
 * - Expiration checking
 */
class CAEService {
  constructor() {
    this.CAE_LENGTH = 14;
    this.DEFAULT_EXPIRATION_DAYS = 10;
  }

  /**
   * Generate a new CAE code
   * @param {Date} date - Optional date for CAE generation (defaults to now)
   * @returns {string} - Generated CAE (14 digits)
   */
  generateCAE(date = null) {
    try {
      const generationDate = date || new Date();

      // Format date as YYYYMMDD
      const yyyymmdd = this.formatDateForCAE(generationDate);

      // Generate random 6-digit suffix
      const randomSuffix = this.generateRandomSuffix();

      // Combine to form 14-digit CAE
      const cae = yyyymmdd + randomSuffix;

      logger.info('CAE generated successfully', {
        cae: cae,
        date: generationDate.toISOString()
      });

      return cae;
    } catch (error) {
      logger.error('CAE generation failed', { error: error.message });
      throw new Error(`CAE generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate CAE expiration date
   * @param {Date} generationDate - CAE generation date
   * @param {number} days - Number of days until expiration (default 10)
   * @returns {string} - Expiration date in YYYYMMDD format
   */
  getCAEExpiration(generationDate = null, days = null) {
    try {
      const date = generationDate || new Date();
      const expirationDays = days !== null ? days : this.getExpirationDaysFromConfig();

      // Calculate expiration date
      const expirationDate = new Date(date);
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Format as YYYYMMDD
      const formatted = this.formatDateForCAE(expirationDate);

      logger.debug('CAE expiration calculated', {
        generationDate: date.toISOString(),
        expirationDate: expirationDate.toISOString(),
        expirationDays: expirationDays,
        formatted: formatted
      });

      return formatted;
    } catch (error) {
      logger.error('CAE expiration calculation failed', { error: error.message });
      throw new Error(`CAE expiration calculation failed: ${error.message}`);
    }
  }

  /**
   * Format date as YYYYMMDD string
   * @param {Date} date - Date object
   * @returns {string} - Date in YYYYMMDD format
   */
  formatDateForCAE(date) {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return year + month + day;
  }

  /**
   * Generate random 6-digit suffix for CAE
   * @returns {string} - 6-digit random string
   */
  generateRandomSuffix() {
    const random = Math.floor(Math.random() * 1000000);
    return random.toString().padStart(6, '0');
  }

  /**
   * Validate CAE format
   * @param {string} cae - CAE code to validate
   * @returns {boolean} - True if valid format
   */
  validateCAEFormat(cae) {
    try {
      // Check length
      if (!cae || cae.length !== this.CAE_LENGTH) {
        logger.debug('CAE format validation failed: invalid length', {
          cae: cae,
          length: cae ? cae.length : 0,
          expected: this.CAE_LENGTH
        });
        return false;
      }

      // Check if all digits
      if (!/^\d+$/.test(cae)) {
        logger.debug('CAE format validation failed: non-numeric', { cae: cae });
        return false;
      }

      // Validate date portion (first 8 digits)
      const datePortion = cae.substring(0, 8);
      if (!this.validateDatePortion(datePortion)) {
        logger.debug('CAE format validation failed: invalid date portion', {
          cae: cae,
          datePortion: datePortion
        });
        return false;
      }

      logger.debug('CAE format validation successful', { cae: cae });
      return true;
    } catch (error) {
      logger.error('CAE format validation error', {
        cae: cae,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate date portion of CAE (YYYYMMDD)
   * @param {string} datePortion - 8-digit date string
   * @returns {boolean} - True if valid date
   */
  validateDatePortion(datePortion) {
    if (datePortion.length !== 8) {
      return false;
    }

    const year = parseInt(datePortion.substring(0, 4));
    const month = parseInt(datePortion.substring(4, 6));
    const day = parseInt(datePortion.substring(6, 8));

    // Basic date validation
    if (year < 2000 || year > 2100) {
      return false;
    }

    if (month < 1 || month > 12) {
      return false;
    }

    if (day < 1 || day > 31) {
      return false;
    }

    // Try to create a valid date
    try {
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year &&
             date.getMonth() === month - 1 &&
             date.getDate() === day;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if CAE is expired
   * @param {string} expirationDate - Expiration date in YYYYMMDD format
   * @returns {boolean} - True if expired
   */
  isCAEExpired(expirationDate) {
    try {
      const expDate = this.parseCAEDate(expirationDate);
      const now = new Date();

      // Set time to midnight for date-only comparison
      now.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);

      const expired = now > expDate;

      logger.debug('CAE expiration check', {
        expirationDate: expirationDate,
        expired: expired,
        now: now.toISOString(),
        expDate: expDate.toISOString()
      });

      return expired;
    } catch (error) {
      logger.error('CAE expiration check failed', {
        expirationDate: expirationDate,
        error: error.message
      });
      return true; // Treat as expired on error
    }
  }

  /**
   * Parse CAE date string (YYYYMMDD) to Date object
   * @param {string} dateString - Date in YYYYMMDD format
   * @returns {Date} - Date object
   */
  parseCAEDate(dateString) {
    if (!dateString || dateString.length !== 8) {
      throw new Error('Invalid date string format');
    }

    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6));
    const day = parseInt(dateString.substring(6, 8));

    return new Date(year, month - 1, day);
  }

  /**
   * Get expiration days from configuration
   * @returns {number} - Number of days until expiration
   */
  getExpirationDaysFromConfig() {
    try {
      const validationRules = config.getValidationRules();
      return validationRules.cae_expiration_days || this.DEFAULT_EXPIRATION_DAYS;
    } catch (error) {
      logger.warn('Failed to get expiration days from config, using default', {
        default: this.DEFAULT_EXPIRATION_DAYS,
        error: error.message
      });
      return this.DEFAULT_EXPIRATION_DAYS;
    }
  }

  /**
   * Generate CAE with expiration date
   * @param {Date} date - Optional generation date
   * @returns {object} - CAE and expiration information
   */
  generateCAEWithExpiration(date = null) {
    const generationDate = date || new Date();
    const cae = this.generateCAE(generationDate);
    const expiration = this.getCAEExpiration(generationDate);

    return {
      cae: cae,
      cae_expiration: expiration,
      generation_date: this.formatDateForCAE(generationDate),
      expiration_days: this.getExpirationDaysFromConfig()
    };
  }

  /**
   * Extract date from CAE
   * @param {string} cae - CAE code
   * @returns {Date|null} - Date object or null if invalid
   */
  extractDateFromCAE(cae) {
    if (!this.validateCAEFormat(cae)) {
      return null;
    }

    try {
      const datePortion = cae.substring(0, 8);
      return this.parseCAEDate(datePortion);
    } catch (error) {
      logger.error('Failed to extract date from CAE', {
        cae: cae,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Validate CAE and check expiration
   * @param {string} cae - CAE code
   * @param {string} expirationDate - Expiration date in YYYYMMDD format
   * @returns {object} - Validation result
   */
  validateCAE(cae, expirationDate) {
    const formatValid = this.validateCAEFormat(cae);
    const expired = expirationDate ? this.isCAEExpired(expirationDate) : false;

    return {
      valid: formatValid && !expired,
      format_valid: formatValid,
      expired: expired,
      cae: cae,
      expiration_date: expirationDate
    };
  }
}

// Export singleton instance
module.exports = new CAEService();
