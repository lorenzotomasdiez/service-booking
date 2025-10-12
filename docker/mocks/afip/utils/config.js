const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class Config {
  constructor() {
    this.rules = null;
    this.loaded = false;
  }

  /**
   * Load configuration from rules.json
   */
  load() {
    try {
      const configPath = path.join(__dirname, '../config/rules.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.rules = JSON.parse(configData);
      this.loaded = true;
      logger.info('Configuration loaded successfully');
      return this.rules;
    } catch (error) {
      logger.error('Failed to load configuration', { error: error.message });
      throw new Error(`Configuration load failed: ${error.message}`);
    }
  }

  /**
   * Get all tax categories
   */
  getTaxCategories() {
    this.ensureLoaded();
    return this.rules.tax_categories;
  }

  /**
   * Get specific tax category
   */
  getTaxCategory(code) {
    this.ensureLoaded();
    return this.rules.tax_categories[code];
  }

  /**
   * Get all invoice types
   */
  getInvoiceTypes() {
    this.ensureLoaded();
    return this.rules.invoice_types;
  }

  /**
   * Get specific invoice type
   */
  getInvoiceType(code) {
    this.ensureLoaded();
    return this.rules.invoice_types[code];
  }

  /**
   * Get validation rules
   */
  getValidationRules() {
    this.ensureLoaded();
    return this.rules.validation_rules;
  }

  /**
   * Get response delays
   */
  getResponseDelays() {
    this.ensureLoaded();
    return this.rules.response_delays;
  }

  /**
   * Get error simulation config
   */
  getErrorSimulation() {
    this.ensureLoaded();
    return this.rules.error_simulation;
  }

  /**
   * Check if tax category is valid
   */
  isValidTaxCategory(code) {
    this.ensureLoaded();
    return !!this.rules.tax_categories[code];
  }

  /**
   * Check if invoice type is valid
   */
  isValidInvoiceType(code) {
    this.ensureLoaded();
    return !!this.rules.invoice_types[code];
  }

  /**
   * Get IVA rate for tax category
   */
  getIVARate(taxCategoryCode) {
    this.ensureLoaded();
    const category = this.rules.tax_categories[taxCategoryCode];
    return category ? category.iva_rate : null;
  }

  /**
   * Ensure configuration is loaded
   */
  ensureLoaded() {
    if (!this.loaded) {
      this.load();
    }
  }

  /**
   * Reload configuration (useful for testing)
   */
  reload() {
    this.loaded = false;
    return this.load();
  }
}

// Export singleton instance
module.exports = new Config();
