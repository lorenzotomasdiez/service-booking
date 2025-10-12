const logger = require('../utils/logger');
const config = require('../utils/config');
const cuitService = require('./cuit.service');
const caeService = require('./cae.service');

/**
 * Invoice Service
 *
 * Manages AFIP mock invoice generation and storage
 *
 * Features:
 * - Invoice number sequencing per POS (Punto de Venta)
 * - IVA (VAT) calculation based on tax categories
 * - CAE generation and association
 * - Invoice storage and retrieval
 * - Tax category validation
 */
class InvoiceService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize service with database instance
   * @param {object} database - Database instance
   */
  setDatabase(database) {
    this.db = database;
    logger.info('Invoice service initialized with database');
  }

  /**
   * Get the next invoice number for a POS
   * @param {number} pos - Punto de Venta (point of sale)
   * @returns {Promise<number>} - Next invoice number
   */
  async getNextInvoiceNumber(pos) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Get current last invoice number for this POS
      const result = await this.db.get(
        'SELECT last_invoice_number FROM pos_config WHERE pos = ?',
        [pos]
      );

      let nextNumber = 1;

      if (result) {
        nextNumber = result.last_invoice_number + 1;
      } else {
        // Initialize POS if it doesn't exist
        await this.db.run(
          'INSERT INTO pos_config (pos, last_invoice_number) VALUES (?, ?)',
          [pos, 0]
        );
        nextNumber = 1;
      }

      logger.debug('Next invoice number calculated', {
        pos: pos,
        nextNumber: nextNumber
      });

      return nextNumber;
    } catch (error) {
      logger.error('Failed to get next invoice number', {
        pos: pos,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update last invoice number for a POS
   * @param {number} pos - Punto de Venta
   * @param {number} invoiceNumber - Last invoice number
   * @returns {Promise<void>}
   */
  async updateLastInvoiceNumber(pos, invoiceNumber) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      await this.db.run(
        'UPDATE pos_config SET last_invoice_number = ?, updated_at = CURRENT_TIMESTAMP WHERE pos = ?',
        [invoiceNumber, pos]
      );

      logger.debug('Last invoice number updated', {
        pos: pos,
        invoiceNumber: invoiceNumber
      });
    } catch (error) {
      logger.error('Failed to update last invoice number', {
        pos: pos,
        invoiceNumber: invoiceNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate IVA (VAT) amount based on tax category
   * @param {number} baseAmount - Base amount before tax
   * @param {number|string} taxCategory - Tax category code
   * @returns {object} - IVA calculation result
   */
  calculateIVA(baseAmount, taxCategory) {
    try {
      // Validate tax category
      const taxCategoryStr = taxCategory.toString();
      if (!config.isValidTaxCategory(taxCategoryStr)) {
        throw new Error(`Invalid tax category: ${taxCategory}`);
      }

      // Get IVA rate from config
      const ivaRate = config.getIVARate(taxCategoryStr);
      const ivaAmount = baseAmount * ivaRate;
      const totalAmount = baseAmount + ivaAmount;

      logger.debug('IVA calculated', {
        baseAmount: baseAmount,
        taxCategory: taxCategory,
        ivaRate: ivaRate,
        ivaAmount: ivaAmount,
        totalAmount: totalAmount
      });

      return {
        base_amount: baseAmount,
        iva_rate: ivaRate,
        iva_amount: parseFloat(ivaAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
      };
    } catch (error) {
      logger.error('IVA calculation failed', {
        baseAmount: baseAmount,
        taxCategory: taxCategory,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate invoice data before creation
   * @param {object} invoiceData - Invoice data to validate
   * @returns {object} - Validation result
   */
  validateInvoiceData(invoiceData) {
    const errors = [];

    // Validate CUIT emisor
    if (!invoiceData.cuit_emisor) {
      errors.push('CUIT emisor is required');
    } else if (!cuitService.validateCUIT(invoiceData.cuit_emisor)) {
      errors.push('Invalid CUIT emisor');
    }

    // Validate CUIT receptor (if provided)
    if (invoiceData.cuit_receptor && !cuitService.validateCUIT(invoiceData.cuit_receptor)) {
      errors.push('Invalid CUIT receptor');
    }

    // Validate POS
    if (!invoiceData.pos || invoiceData.pos < 1) {
      errors.push('Invalid POS (must be >= 1)');
    }

    // Validate amounts
    const validationRules = config.getValidationRules();
    if (!invoiceData.total_amount || invoiceData.total_amount < validationRules.min_invoice_amount) {
      errors.push(`Total amount must be >= ${validationRules.min_invoice_amount}`);
    }
    if (invoiceData.total_amount > validationRules.max_invoice_amount) {
      errors.push(`Total amount must be <= ${validationRules.max_invoice_amount}`);
    }

    // Validate tax category
    if (!config.isValidTaxCategory(invoiceData.tax_category.toString())) {
      errors.push('Invalid tax category');
    }

    // Validate invoice type
    if (!config.isValidInvoiceType(invoiceData.invoice_type.toString())) {
      errors.push('Invalid invoice type');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      logger.warn('Invoice data validation failed', {
        errors: errors,
        invoiceData: invoiceData
      });
    }

    return {
      valid: isValid,
      errors: errors
    };
  }

  /**
   * Create a new invoice
   * @param {object} invoiceData - Invoice data
   * @returns {Promise<object>} - Created invoice with CAE
   */
  async createInvoice(invoiceData) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Validate invoice data
      const validation = this.validateInvoiceData(invoiceData);
      if (!validation.valid) {
        throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
      }

      // Get next invoice number
      const invoiceNumber = await this.getNextInvoiceNumber(invoiceData.pos);

      // Generate CAE with expiration
      const caeData = caeService.generateCAEWithExpiration();

      // Calculate IVA
      const ivaCalc = this.calculateIVA(
        invoiceData.total_amount - (invoiceData.iva_amount || 0),
        invoiceData.tax_category
      );

      // Prepare invoice date
      const invoiceDate = invoiceData.invoice_date || caeService.formatDateForCAE(new Date());

      // Insert invoice into database
      const result = await this.db.run(
        `INSERT INTO invoices (
          cae, cae_expiration, invoice_number, pos, invoice_date,
          invoice_type, total_amount, iva_amount, cuit_emisor,
          cuit_receptor, tax_category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          caeData.cae,
          caeData.cae_expiration,
          invoiceNumber,
          invoiceData.pos,
          invoiceDate,
          invoiceData.invoice_type,
          ivaCalc.total_amount,
          ivaCalc.iva_amount,
          cuitService.cleanCUIT(invoiceData.cuit_emisor),
          invoiceData.cuit_receptor ? cuitService.cleanCUIT(invoiceData.cuit_receptor) : null,
          invoiceData.tax_category
        ]
      );

      // Update last invoice number for POS
      await this.updateLastInvoiceNumber(invoiceData.pos, invoiceNumber);

      const invoice = {
        id: result.lastID,
        cae: caeData.cae,
        cae_expiration: caeData.cae_expiration,
        invoice_number: invoiceNumber,
        pos: invoiceData.pos,
        invoice_date: invoiceDate,
        invoice_type: invoiceData.invoice_type,
        total_amount: ivaCalc.total_amount,
        iva_amount: ivaCalc.iva_amount,
        base_amount: ivaCalc.base_amount,
        cuit_emisor: invoiceData.cuit_emisor,
        cuit_receptor: invoiceData.cuit_receptor || null,
        tax_category: invoiceData.tax_category
      };

      logger.info('Invoice created successfully', {
        id: invoice.id,
        cae: invoice.cae,
        invoice_number: invoice.invoice_number,
        pos: invoice.pos
      });

      return invoice;
    } catch (error) {
      logger.error('Invoice creation failed', {
        error: error.message,
        invoiceData: invoiceData
      });
      throw error;
    }
  }

  /**
   * Get invoice by CAE
   * @param {string} cae - CAE code
   * @returns {Promise<object|null>} - Invoice or null if not found
   */
  async getInvoiceByCAE(cae) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      if (!caeService.validateCAEFormat(cae)) {
        throw new Error('Invalid CAE format');
      }

      const invoice = await this.db.get(
        'SELECT * FROM invoices WHERE cae = ?',
        [cae]
      );

      if (invoice) {
        logger.debug('Invoice found by CAE', { cae: cae });
      } else {
        logger.debug('Invoice not found by CAE', { cae: cae });
      }

      return invoice;
    } catch (error) {
      logger.error('Failed to get invoice by CAE', {
        cae: cae,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get invoice by number and POS
   * @param {number} invoiceNumber - Invoice number
   * @param {number} pos - Punto de Venta
   * @returns {Promise<object|null>} - Invoice or null if not found
   */
  async getInvoiceByNumber(invoiceNumber, pos) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const invoice = await this.db.get(
        'SELECT * FROM invoices WHERE invoice_number = ? AND pos = ?',
        [invoiceNumber, pos]
      );

      if (invoice) {
        logger.debug('Invoice found by number', {
          invoice_number: invoiceNumber,
          pos: pos
        });
      } else {
        logger.debug('Invoice not found by number', {
          invoice_number: invoiceNumber,
          pos: pos
        });
      }

      return invoice;
    } catch (error) {
      logger.error('Failed to get invoice by number', {
        invoice_number: invoiceNumber,
        pos: pos,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get invoices by CUIT emisor
   * @param {string} cuitEmisor - CUIT of issuer
   * @param {object} options - Query options (limit, offset, orderBy)
   * @returns {Promise<array>} - List of invoices
   */
  async getInvoicesByCUITEmisor(cuitEmisor, options = {}) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const cleanedCuit = cuitService.cleanCUIT(cuitEmisor);
      if (!cuitService.validateCUIT(cleanedCuit)) {
        throw new Error('Invalid CUIT emisor');
      }

      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const orderBy = options.orderBy || 'created_at DESC';

      const invoices = await this.db.all(
        `SELECT * FROM invoices WHERE cuit_emisor = ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [cleanedCuit, limit, offset]
      );

      logger.debug('Invoices retrieved by CUIT emisor', {
        cuit_emisor: cuitEmisor,
        count: invoices.length
      });

      return invoices;
    } catch (error) {
      logger.error('Failed to get invoices by CUIT emisor', {
        cuit_emisor: cuitEmisor,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get invoices by date range
   * @param {string} startDate - Start date (YYYYMMDD)
   * @param {string} endDate - End date (YYYYMMDD)
   * @param {object} options - Query options
   * @returns {Promise<array>} - List of invoices
   */
  async getInvoicesByDateRange(startDate, endDate, options = {}) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const orderBy = options.orderBy || 'invoice_date DESC';

      const invoices = await this.db.all(
        `SELECT * FROM invoices WHERE invoice_date >= ? AND invoice_date <= ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [startDate, endDate, limit, offset]
      );

      logger.debug('Invoices retrieved by date range', {
        startDate: startDate,
        endDate: endDate,
        count: invoices.length
      });

      return invoices;
    } catch (error) {
      logger.error('Failed to get invoices by date range', {
        startDate: startDate,
        endDate: endDate,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get last invoice for a POS
   * @param {number} pos - Punto de Venta
   * @returns {Promise<object|null>} - Last invoice or null
   */
  async getLastInvoice(pos) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const invoice = await this.db.get(
        'SELECT * FROM invoices WHERE pos = ? ORDER BY invoice_number DESC LIMIT 1',
        [pos]
      );

      if (invoice) {
        logger.debug('Last invoice retrieved', {
          pos: pos,
          invoice_number: invoice.invoice_number
        });
      } else {
        logger.debug('No invoices found for POS', { pos: pos });
      }

      return invoice;
    } catch (error) {
      logger.error('Failed to get last invoice', {
        pos: pos,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get invoice statistics for a CUIT
   * @param {string} cuitEmisor - CUIT of issuer
   * @returns {Promise<object>} - Statistics
   */
  async getInvoiceStats(cuitEmisor) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const cleanedCuit = cuitService.cleanCUIT(cuitEmisor);
      if (!cuitService.validateCUIT(cleanedCuit)) {
        throw new Error('Invalid CUIT emisor');
      }

      const stats = await this.db.get(
        `SELECT
          COUNT(*) as total_invoices,
          SUM(total_amount) as total_amount,
          SUM(iva_amount) as total_iva,
          AVG(total_amount) as average_amount,
          MIN(invoice_date) as first_invoice_date,
          MAX(invoice_date) as last_invoice_date
        FROM invoices
        WHERE cuit_emisor = ?`,
        [cleanedCuit]
      );

      logger.debug('Invoice statistics retrieved', {
        cuit_emisor: cuitEmisor,
        total_invoices: stats.total_invoices
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get invoice statistics', {
        cuit_emisor: cuitEmisor,
        error: error.message
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new InvoiceService();
