/**
 * Invoice Service Unit Tests
 *
 * Tests for invoice creation, validation, IVA calculation, and retrieval
 */

const invoiceService = require('../services/invoice.service');
const cuitService = require('../services/cuit.service');
const caeService = require('../services/cae.service');
const config = require('../utils/config');

// Mock database for testing
class MockDatabase {
  constructor() {
    this.invoices = [];
    this.posConfig = new Map();
    this.nextId = 1;
  }

  async get(query, params = []) {
    if (query.includes('pos_config')) {
      const pos = params[0];
      return this.posConfig.get(pos) || null;
    }

    if (query.includes('cae =')) {
      const cae = params[0];
      return this.invoices.find(inv => inv.cae === cae) || null;
    }

    if (query.includes('invoice_number =')) {
      const [invoiceNumber, pos] = params;
      return this.invoices.find(inv => inv.invoice_number === invoiceNumber && inv.pos === pos) || null;
    }

    if (query.includes('ORDER BY invoice_number DESC')) {
      const pos = params[0];
      const posInvoices = this.invoices.filter(inv => inv.pos === pos);
      return posInvoices.length > 0 ? posInvoices[posInvoices.length - 1] : null;
    }

    return null;
  }

  async all(query, params = []) {
    if (query.includes('cuit_emisor =')) {
      const cuitEmisor = params[0];
      const limit = params[1];
      const offset = params[2];
      return this.invoices
        .filter(inv => inv.cuit_emisor === cuitEmisor)
        .slice(offset, offset + limit);
    }

    if (query.includes('invoice_date >=')) {
      const [startDate, endDate, limit, offset] = params;
      return this.invoices
        .filter(inv => inv.invoice_date >= startDate && inv.invoice_date <= endDate)
        .slice(offset, offset + limit);
    }

    return [];
  }

  async run(query, params = []) {
    if (query.includes('INSERT INTO pos_config')) {
      const [pos, lastInvoiceNumber] = params;
      this.posConfig.set(pos, { pos, last_invoice_number: lastInvoiceNumber });
      return { lastID: pos };
    }

    if (query.includes('UPDATE pos_config')) {
      const [invoiceNumber, pos] = params;
      const existing = this.posConfig.get(pos);
      if (existing) {
        existing.last_invoice_number = invoiceNumber;
        existing.updated_at = new Date().toISOString();
      }
      return { changes: 1 };
    }

    if (query.includes('INSERT INTO invoices')) {
      const [cae, cae_expiration, invoice_number, pos, invoice_date, invoice_type,
             total_amount, iva_amount, cuit_emisor, cuit_receptor, tax_category] = params;

      const invoice = {
        id: this.nextId++,
        cae,
        cae_expiration,
        invoice_number,
        pos,
        invoice_date,
        invoice_type,
        total_amount,
        iva_amount,
        cuit_emisor,
        cuit_receptor,
        tax_category,
        created_at: new Date().toISOString()
      };

      this.invoices.push(invoice);
      return { lastID: invoice.id };
    }

    return { lastID: this.nextId++, changes: 1 };
  }

  reset() {
    this.invoices = [];
    this.posConfig.clear();
    this.nextId = 1;
  }
}

describe('Invoice Service', () => {
  let mockDb;

  beforeAll(() => {
    // Load configuration
    config.load();
  });

  beforeEach(() => {
    mockDb = new MockDatabase();
    invoiceService.setDatabase(mockDb);
  });

  afterEach(() => {
    mockDb.reset();
  });

  describe('Database Initialization', () => {
    it('should set database instance', () => {
      const newDb = new MockDatabase();
      invoiceService.setDatabase(newDb);
      expect(invoiceService.db).toBeDefined();
    });

    it('should throw error when database not initialized', async () => {
      invoiceService.setDatabase(null);
      await expect(invoiceService.getNextInvoiceNumber(1))
        .rejects.toThrow('Database not initialized');
    });
  });

  describe('getNextInvoiceNumber', () => {
    it('should return 1 for new POS', async () => {
      const nextNumber = await invoiceService.getNextInvoiceNumber(1);
      expect(nextNumber).toBe(1);
    });

    it('should increment invoice number for existing POS', async () => {
      await invoiceService.getNextInvoiceNumber(1);
      await invoiceService.updateLastInvoiceNumber(1, 1);

      const nextNumber = await invoiceService.getNextInvoiceNumber(1);
      expect(nextNumber).toBe(2);
    });

    it('should maintain separate sequences for different POS', async () => {
      const pos1Next = await invoiceService.getNextInvoiceNumber(1);
      const pos2Next = await invoiceService.getNextInvoiceNumber(2);

      expect(pos1Next).toBe(1);
      expect(pos2Next).toBe(1);
    });

    it('should handle sequential number generation', async () => {
      for (let i = 1; i <= 5; i++) {
        const nextNumber = await invoiceService.getNextInvoiceNumber(1);
        expect(nextNumber).toBe(i);
        await invoiceService.updateLastInvoiceNumber(1, i);
      }
    });
  });

  describe('updateLastInvoiceNumber', () => {
    it('should update last invoice number for POS', async () => {
      await invoiceService.getNextInvoiceNumber(1);
      await invoiceService.updateLastInvoiceNumber(1, 5);

      const nextNumber = await invoiceService.getNextInvoiceNumber(1);
      expect(nextNumber).toBe(6);
    });

    it('should throw error when database not initialized', async () => {
      invoiceService.setDatabase(null);
      await expect(invoiceService.updateLastInvoiceNumber(1, 5))
        .rejects.toThrow('Database not initialized');
    });
  });

  describe('calculateIVA', () => {
    it('should calculate IVA for Responsable Inscripto (21%)', () => {
      const result = invoiceService.calculateIVA(100, '1');

      expect(result.base_amount).toBe(100);
      expect(result.iva_rate).toBe(0.21);
      expect(result.iva_amount).toBe(21);
      expect(result.total_amount).toBe(121);
    });

    it('should calculate IVA for Exento (0%)', () => {
      const result = invoiceService.calculateIVA(100, '4');  // Tax category 4 is Exento

      expect(result.base_amount).toBe(100);
      expect(result.iva_rate).toBe(0);
      expect(result.iva_amount).toBe(0);
      expect(result.total_amount).toBe(100);
    });

    it('should calculate IVA for Monotributista (0%)', () => {
      const result = invoiceService.calculateIVA(100, '6');  // Tax category 6 is Monotributo

      expect(result.base_amount).toBe(100);
      expect(result.iva_rate).toBe(0);
      expect(result.iva_amount).toBe(0);
      expect(result.total_amount).toBe(100);
    });

    it('should round IVA amount to 2 decimal places', () => {
      const result = invoiceService.calculateIVA(33.33, '1');

      expect(result.iva_amount).toBe(7.00); // Rounded from 6.9993
      expect(result.total_amount).toBe(40.33);
    });

    it('should throw error for invalid tax category', () => {
      expect(() => {
        invoiceService.calculateIVA(100, '999');
      }).toThrow('Invalid tax category');
    });

    it('should handle tax category as string or number', () => {
      const result1 = invoiceService.calculateIVA(100, '1');
      const result2 = invoiceService.calculateIVA(100, 1);

      expect(result1.iva_amount).toBe(result2.iva_amount);
    });

    it('should handle decimal base amounts', () => {
      const result = invoiceService.calculateIVA(99.99, '1');

      expect(result.base_amount).toBe(99.99);
      expect(result.iva_amount).toBe(21.00); // Rounded
      expect(result.total_amount).toBe(120.99);
    });
  });

  describe('validateInvoiceData', () => {
    const validInvoiceData = {
      cuit_emisor: '20-12345678-6',
      cuit_receptor: '27-98765432-0',  // Corrected checksum
      pos: 1,
      total_amount: 1000,
      tax_category: '1',
      invoice_type: '1'
    };

    it('should validate correct invoice data', () => {
      const result = invoiceService.validateInvoiceData(validInvoiceData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing CUIT emisor', () => {
      const data = { ...validInvoiceData, cuit_emisor: null };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CUIT emisor is required');
    });

    it('should reject invalid CUIT emisor', () => {
      const data = { ...validInvoiceData, cuit_emisor: '20-12345678-0' };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid CUIT emisor');
    });

    it('should reject invalid CUIT receptor if provided', () => {
      const data = { ...validInvoiceData, cuit_receptor: '20-12345678-0' };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid CUIT receptor');
    });

    it('should allow null CUIT receptor', () => {
      const data = { ...validInvoiceData, cuit_receptor: null };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid POS', () => {
      const data = { ...validInvoiceData, pos: 0 };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid POS (must be >= 1)');
    });

    it('should reject amount below minimum', () => {
      const data = { ...validInvoiceData, total_amount: 0 };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject amount above maximum', () => {
      const data = { ...validInvoiceData, total_amount: 9999999999 };  // Above max limit
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid tax category', () => {
      const data = { ...validInvoiceData, tax_category: '999' };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid tax category');
    });

    it('should reject invalid invoice type', () => {
      const data = { ...validInvoiceData, invoice_type: '999' };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid invoice type');
    });

    it('should return multiple errors for multiple issues', () => {
      const data = {
        cuit_emisor: '20-12345678-0',
        cuit_receptor: '27-98765432-0',
        pos: 0,
        total_amount: 0,
        tax_category: '999',
        invoice_type: '999'
      };
      const result = invoiceService.validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('createInvoice', () => {
    const validInvoiceData = {
      cuit_emisor: '20-12345678-6',
      pos: 1,
      total_amount: 121,
      iva_amount: 21,
      tax_category: '1',
      invoice_type: '1'
    };

    it('should create invoice with CAE', async () => {
      const invoice = await invoiceService.createInvoice(validInvoiceData);

      expect(invoice).toBeDefined();
      expect(invoice.id).toBeDefined();
      expect(invoice.cae).toBeDefined();
      expect(invoice.cae.length).toBe(14);
      expect(invoice.cae_expiration).toBeDefined();
      expect(invoice.invoice_number).toBe(1);
      expect(invoice.pos).toBe(1);
    });

    it('should increment invoice number per POS', async () => {
      const invoice1 = await invoiceService.createInvoice(validInvoiceData);
      const invoice2 = await invoiceService.createInvoice(validInvoiceData);
      const invoice3 = await invoiceService.createInvoice(validInvoiceData);

      expect(invoice1.invoice_number).toBe(1);
      expect(invoice2.invoice_number).toBe(2);
      expect(invoice3.invoice_number).toBe(3);
    });

    it('should maintain separate sequences for different POS', async () => {
      const data1 = { ...validInvoiceData, pos: 1 };
      const data2 = { ...validInvoiceData, pos: 2 };

      const invoice1 = await invoiceService.createInvoice(data1);
      const invoice2 = await invoiceService.createInvoice(data2);
      const invoice3 = await invoiceService.createInvoice(data1);

      expect(invoice1.invoice_number).toBe(1);
      expect(invoice2.invoice_number).toBe(1);
      expect(invoice3.invoice_number).toBe(2);

      expect(invoice1.pos).toBe(1);
      expect(invoice2.pos).toBe(2);
      expect(invoice3.pos).toBe(1);
    });

    it('should calculate IVA correctly', async () => {
      const data = { ...validInvoiceData, total_amount: 100, iva_amount: 0 };
      const invoice = await invoiceService.createInvoice(data);

      expect(invoice.iva_amount).toBe(21);
      expect(invoice.total_amount).toBe(121);
      expect(invoice.base_amount).toBe(100);
    });

    it('should clean CUIT before storing', async () => {
      const data = {
        ...validInvoiceData,
        cuit_emisor: '20-12345678-6',
        cuit_receptor: '27-98765432-0'  // Corrected checksum
      };
      const invoice = await invoiceService.createInvoice(data);

      // The stored CUIT should be cleaned in the database
      expect(mockDb.invoices[0].cuit_emisor).toBe('20123456786');
      expect(mockDb.invoices[0].cuit_receptor).toBe('27987654320');  // Corrected
    });

    it('should use current date if invoice_date not provided', async () => {
      const invoice = await invoiceService.createInvoice(validInvoiceData);

      expect(invoice.invoice_date).toBeDefined();
      expect(invoice.invoice_date.length).toBe(8); // YYYYMMDD format
    });

    it('should use provided invoice_date', async () => {
      const data = { ...validInvoiceData, invoice_date: '20231015' };
      const invoice = await invoiceService.createInvoice(data);

      expect(invoice.invoice_date).toBe('20231015');
    });

    it('should throw error for invalid invoice data', async () => {
      const invalidData = { ...validInvoiceData, cuit_emisor: '20-12345678-0' };

      await expect(invoiceService.createInvoice(invalidData))
        .rejects.toThrow('Invoice validation failed');
    });

    it('should generate unique CAE for each invoice', async () => {
      const invoice1 = await invoiceService.createInvoice(validInvoiceData);
      const invoice2 = await invoiceService.createInvoice(validInvoiceData);

      expect(invoice1.cae).not.toBe(invoice2.cae);
    });

    it('should store all invoice fields correctly', async () => {
      const invoice = await invoiceService.createInvoice(validInvoiceData);

      expect(invoice.cuit_emisor).toBe(validInvoiceData.cuit_emisor);
      expect(invoice.pos).toBe(validInvoiceData.pos);
      expect(invoice.tax_category).toBe(validInvoiceData.tax_category);
      expect(invoice.invoice_type).toBe(validInvoiceData.invoice_type);
    });
  });

  describe('getInvoiceByCAE', () => {
    it('should retrieve invoice by CAE', async () => {
      const created = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 121,
        iva_amount: 21,
        tax_category: '1',
        invoice_type: '1'
      });

      const invoice = await invoiceService.getInvoiceByCAE(created.cae);

      expect(invoice).toBeDefined();
      expect(invoice.cae).toBe(created.cae);
      expect(invoice.id).toBe(created.id);
    });

    it('should return null for non-existent CAE', async () => {
      const invoice = await invoiceService.getInvoiceByCAE('20231015123456');

      expect(invoice).toBe(null);
    });

    it('should throw error for invalid CAE format', async () => {
      await expect(invoiceService.getInvoiceByCAE('invalid'))
        .rejects.toThrow('Invalid CAE format');
    });
  });

  describe('getInvoiceByNumber', () => {
    it('should retrieve invoice by number and POS', async () => {
      const created = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 121,
        iva_amount: 21,
        tax_category: '1',
        invoice_type: '1'
      });

      const invoice = await invoiceService.getInvoiceByNumber(created.invoice_number, created.pos);

      expect(invoice).toBeDefined();
      expect(invoice.invoice_number).toBe(created.invoice_number);
      expect(invoice.pos).toBe(created.pos);
    });

    it('should return null for non-existent invoice', async () => {
      const invoice = await invoiceService.getInvoiceByNumber(999, 1);

      expect(invoice).toBe(null);
    });

    it('should distinguish between different POS', async () => {
      await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 121,
        tax_category: '1',
        invoice_type: '1'
      });

      const invoice = await invoiceService.getInvoiceByNumber(1, 2);

      expect(invoice).toBe(null);
    });
  });

  describe('getInvoicesByCUITEmisor', () => {
    beforeEach(async () => {
      // Create test invoices
      for (let i = 0; i < 5; i++) {
        await invoiceService.createInvoice({
          cuit_emisor: '20-12345678-6',
          pos: 1,
          total_amount: 121,
          tax_category: '1',
          invoice_type: '1'
        });
      }
    });

    it('should retrieve invoices by CUIT emisor', async () => {
      const invoices = await invoiceService.getInvoicesByCUITEmisor('20-12345678-6');

      expect(invoices).toBeDefined();
      expect(invoices.length).toBe(5);
    });

    it('should clean CUIT before querying', async () => {
      const invoices = await invoiceService.getInvoicesByCUITEmisor('20123456786');

      expect(invoices.length).toBe(5);
    });

    it('should respect limit option', async () => {
      const invoices = await invoiceService.getInvoicesByCUITEmisor('20-12345678-6', { limit: 3 });

      expect(invoices.length).toBe(3);
    });

    it('should respect offset option', async () => {
      const invoices = await invoiceService.getInvoicesByCUITEmisor('20-12345678-6', { offset: 2 });

      expect(invoices.length).toBe(3);
    });

    it('should throw error for invalid CUIT', async () => {
      await expect(invoiceService.getInvoicesByCUITEmisor('20-12345678-0'))
        .rejects.toThrow('Invalid CUIT emisor');
    });

    it('should return empty array for CUIT with no invoices', async () => {
      const invoices = await invoiceService.getInvoicesByCUITEmisor('27-98765432-0');  // Corrected

      expect(invoices).toEqual([]);
    });
  });

  describe('getLastInvoice', () => {
    it('should return last invoice for POS', async () => {
      await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 121,
        tax_category: '1',
        invoice_type: '1'
      });

      const last = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 242,
        tax_category: '1',
        invoice_type: '1'
      });

      const invoice = await invoiceService.getLastInvoice(1);

      expect(invoice).toBeDefined();
      expect(invoice.id).toBe(last.id);
      expect(invoice.invoice_number).toBe(2);
    });

    it('should return null for POS with no invoices', async () => {
      const invoice = await invoiceService.getLastInvoice(999);

      expect(invoice).toBe(null);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete invoice lifecycle', async () => {
      // Create invoice
      const created = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        cuit_receptor: '27-98765432-0',  // Corrected checksum
        pos: 1,
        total_amount: 121,
        tax_category: '1',
        invoice_type: '1'
      });

      // Verify creation
      expect(created.id).toBeDefined();
      expect(created.cae).toBeDefined();
      expect(created.invoice_number).toBe(1);

      // Retrieve by CAE
      const byCAE = await invoiceService.getInvoiceByCAE(created.cae);
      expect(byCAE.id).toBe(created.id);

      // Retrieve by number
      const byNumber = await invoiceService.getInvoiceByNumber(1, 1);
      expect(byNumber.id).toBe(created.id);

      // Retrieve by CUIT
      const byCUIT = await invoiceService.getInvoicesByCUITEmisor('20-12345678-6');
      expect(byCUIT.length).toBe(1);
      expect(byCUIT[0].id).toBe(created.id);
    });

    it('should handle multiple POS and invoice sequences', async () => {
      // Create invoices for different POS
      const pos1inv1 = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 121,
        tax_category: '1',
        invoice_type: '1'
      });

      const pos2inv1 = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 2,
        total_amount: 121,
        tax_category: '1',
        invoice_type: '1'
      });

      const pos1inv2 = await invoiceService.createInvoice({
        cuit_emisor: '20-12345678-6',
        pos: 1,
        total_amount: 121,
        tax_category: '1',
        invoice_type: '1'
      });

      // Verify sequences
      expect(pos1inv1.invoice_number).toBe(1);
      expect(pos2inv1.invoice_number).toBe(1);
      expect(pos1inv2.invoice_number).toBe(2);

      // Verify POS
      expect(pos1inv1.pos).toBe(1);
      expect(pos2inv1.pos).toBe(2);
      expect(pos1inv2.pos).toBe(1);
    });
  });
});
