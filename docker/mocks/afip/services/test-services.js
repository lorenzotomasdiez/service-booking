/**
 * Integration test for AFIP mock services
 *
 * Tests CUIT, CAE, and Invoice services together
 * Run with: node services/test-services.js
 */

const path = require('path');

// Set environment variables
process.env.AFIP_MOCK_DB_PATH = path.join(__dirname, '../data/test-afip.db');

const cuitService = require('./cuit.service');
const caeService = require('./cae.service');
const invoiceService = require('./invoice.service');
const config = require('../utils/config');
const db = require('../database/db');
const logger = require('../utils/logger');

async function testCUITService() {
  console.log('\n=== Testing CUIT Service ===\n');

  // Test valid CUIT
  const validCUIT = '20-12345678-9';
  console.log(`Testing CUIT: ${validCUIT}`);
  const isValid = cuitService.validateCUIT(validCUIT);
  console.log(`Valid: ${isValid}`);

  // Test CUIT formatting
  const formatted = cuitService.formatCUIT('20123456789');
  console.log(`Formatted: ${formatted}`);

  // Test CUIT type
  const type = cuitService.getCUITType(validCUIT);
  console.log(`Type: ${type}`);

  // Generate random CUIT
  const randomCUIT = cuitService.generateRandomCUIT('20');
  console.log(`Random CUIT: ${randomCUIT}`);
  console.log(`Random CUIT valid: ${cuitService.validateCUIT(randomCUIT)}`);

  // Test validation and format
  const result = cuitService.validateAndFormat(randomCUIT);
  console.log('Validation result:', result);

  return randomCUIT;
}

async function testCAEService() {
  console.log('\n=== Testing CAE Service ===\n');

  // Generate CAE
  const cae = caeService.generateCAE();
  console.log(`Generated CAE: ${cae}`);

  // Validate CAE format
  const formatValid = caeService.validateCAEFormat(cae);
  console.log(`CAE format valid: ${formatValid}`);

  // Get expiration
  const expiration = caeService.getCAEExpiration();
  console.log(`CAE expiration: ${expiration}`);

  // Check if expired
  const isExpired = caeService.isCAEExpired(expiration);
  console.log(`CAE expired: ${isExpired}`);

  // Generate CAE with expiration
  const caeData = caeService.generateCAEWithExpiration();
  console.log('CAE with expiration:', caeData);

  // Extract date from CAE
  const extractedDate = caeService.extractDateFromCAE(cae);
  console.log(`Date extracted from CAE: ${extractedDate ? extractedDate.toISOString() : 'null'}`);

  // Validate CAE
  const validation = caeService.validateCAE(cae, expiration);
  console.log('CAE validation:', validation);

  return cae;
}

async function testInvoiceService(testCUIT) {
  console.log('\n=== Testing Invoice Service ===\n');

  // Load configuration
  config.load();
  console.log('Configuration loaded');

  // Initialize database
  await db.init();
  console.log('Database initialized');

  // Set database for invoice service
  invoiceService.setDatabase(db.getInstance());
  console.log('Invoice service initialized');

  // Test IVA calculation
  console.log('\nTesting IVA calculation:');
  const ivaCalc = invoiceService.calculateIVA(1000, 1); // IVA Responsable Inscripto
  console.log('IVA for 1000 ARS (category 1):', ivaCalc);

  const ivaCalc2 = invoiceService.calculateIVA(1000, 6); // Monotributo
  console.log('IVA for 1000 ARS (category 6):', ivaCalc2);

  // Test invoice creation
  console.log('\nCreating test invoice:');
  const invoiceData = {
    cuit_emisor: testCUIT,
    cuit_receptor: cuitService.generateRandomCUIT('27'),
    pos: 1,
    total_amount: 1000,
    tax_category: 1,
    invoice_type: 1
  };

  const invoice = await invoiceService.createInvoice(invoiceData);
  console.log('Invoice created:', {
    id: invoice.id,
    cae: invoice.cae,
    invoice_number: invoice.invoice_number,
    pos: invoice.pos,
    total_amount: invoice.total_amount,
    iva_amount: invoice.iva_amount
  });

  // Test get invoice by CAE
  console.log('\nRetrieving invoice by CAE:');
  const retrievedByCAE = await invoiceService.getInvoiceByCAE(invoice.cae);
  console.log('Invoice found:', retrievedByCAE ? 'Yes' : 'No');

  // Test get invoice by number
  console.log('\nRetrieving invoice by number:');
  const retrievedByNumber = await invoiceService.getInvoiceByNumber(
    invoice.invoice_number,
    invoice.pos
  );
  console.log('Invoice found:', retrievedByNumber ? 'Yes' : 'No');

  // Create another invoice to test sequencing
  console.log('\nCreating second invoice (testing sequencing):');
  const invoice2 = await invoiceService.createInvoice({
    ...invoiceData,
    cuit_receptor: cuitService.generateRandomCUIT('30')
  });
  console.log('Second invoice created:', {
    invoice_number: invoice2.invoice_number,
    cae: invoice2.cae
  });

  // Test get invoices by CUIT
  console.log('\nRetrieving invoices by CUIT emisor:');
  const invoicesByCUIT = await invoiceService.getInvoicesByCUITEmisor(testCUIT);
  console.log(`Found ${invoicesByCUIT.length} invoices`);

  // Test get last invoice
  console.log('\nRetrieving last invoice for POS 1:');
  const lastInvoice = await invoiceService.getLastInvoice(1);
  console.log('Last invoice number:', lastInvoice.invoice_number);

  // Test invoice statistics
  console.log('\nRetrieving invoice statistics:');
  const stats = await invoiceService.getInvoiceStats(testCUIT);
  console.log('Statistics:', {
    total_invoices: stats.total_invoices,
    total_amount: stats.total_amount,
    total_iva: stats.total_iva,
    average_amount: stats.average_amount
  });

  // Test validation
  console.log('\nTesting invoice validation:');
  const invalidData = {
    cuit_emisor: 'invalid',
    pos: 1,
    total_amount: 1000,
    tax_category: 1,
    invoice_type: 1
  };
  const validation = invoiceService.validateInvoiceData(invalidData);
  console.log('Validation result:', validation);

  return invoice;
}

async function runTests() {
  try {
    console.log('=================================================');
    console.log('AFIP Mock Services Integration Test');
    console.log('=================================================');

    // Test CUIT service
    const testCUIT = await testCUITService();

    // Test CAE service
    await testCAEService();

    // Test Invoice service (includes database operations)
    await testInvoiceService(testCUIT);

    console.log('\n=================================================');
    console.log('All tests completed successfully!');
    console.log('=================================================\n');

    // Close database
    await db.close();
    console.log('Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Close database on error
    try {
      await db.close();
    } catch (closeError) {
      console.error('Failed to close database:', closeError.message);
    }

    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
