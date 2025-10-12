# AFIP Mock Server - Business Logic Services

This directory contains the core business logic services for the AFIP mock server.

## Services Overview

### 1. CUIT Validation Service (`cuit.service.js`)

Validates and formats Argentine CUIT/CUIL identification numbers.

**Key Features:**
- CUIT validation with official AFIP checksum algorithm
- Format validation (11 digits, XX-XXXXXXXX-X pattern)
- Type identification (person/company classification)
- Random CUIT generation for testing

**Usage Example:**
```javascript
const cuitService = require('./cuit.service');

// Validate CUIT
const isValid = cuitService.validateCUIT('20-12345678-9');

// Format CUIT
const formatted = cuitService.formatCUIT('20123456789');
// Returns: "20-12345678-9"

// Get CUIT type
const type = cuitService.getCUITType('20-12345678-9');
// Returns: "Persona Física Masculino"

// Generate random valid CUIT
const randomCUIT = cuitService.generateRandomCUIT('20');
```

**API:**
- `validateCUIT(cuit)` - Validates CUIT with checksum
- `validateChecksum(cuit)` - Verifies checksum digit
- `cleanCUIT(cuit)` - Removes hyphens and spaces
- `formatCUIT(cuit)` - Formats as XX-XXXXXXXX-X
- `getCUITType(cuit)` - Returns type identifier
- `validateAndFormat(cuit)` - Combined validation and formatting
- `generateRandomCUIT(typeId)` - Generates valid test CUIT

---

### 2. CAE Generation Service (`cae.service.js`)

Generates and manages CAE (Código de Autorización Electrónico) codes for electronic invoices.

**Key Features:**
- 14-digit CAE generation (YYYYMMDDXXXXXX format)
- Expiration date calculation (10 days default)
- Format and date validation
- Expiration checking

**Usage Example:**
```javascript
const caeService = require('./cae.service');

// Generate CAE
const cae = caeService.generateCAE();
// Returns: "20251012123456" (14 digits)

// Calculate expiration
const expiration = caeService.getCAEExpiration();
// Returns: "20251022" (10 days from now)

// Generate CAE with expiration
const caeData = caeService.generateCAEWithExpiration();
// Returns: {
//   cae: "20251012123456",
//   cae_expiration: "20251022",
//   generation_date: "20251012",
//   expiration_days: 10
// }

// Validate CAE format
const isValid = caeService.validateCAEFormat('20251012123456');

// Check if expired
const expired = caeService.isCAEExpired('20251022');

// Extract date from CAE
const date = caeService.extractDateFromCAE('20251012123456');
```

**API:**
- `generateCAE(date)` - Generates 14-digit CAE
- `getCAEExpiration(date, days)` - Calculates expiration date
- `validateCAEFormat(cae)` - Validates format
- `validateDatePortion(datePortion)` - Validates date part
- `isCAEExpired(expirationDate)` - Checks expiration
- `parseCAEDate(dateString)` - Parses YYYYMMDD to Date
- `generateCAEWithExpiration()` - Combined generation
- `extractDateFromCAE(cae)` - Gets generation date
- `validateCAE(cae, expirationDate)` - Full validation

---

### 3. Invoice Service (`invoice.service.js`)

Manages invoice creation, storage, and retrieval with number sequencing per POS.

**Key Features:**
- Invoice number auto-increment per POS
- IVA (VAT) calculation based on tax categories
- CAE generation and association
- Database persistence
- Comprehensive validation
- Query and statistics operations

**Usage Example:**
```javascript
const invoiceService = require('./invoice.service');
const db = require('../database/db');

// Initialize database
await db.init();
invoiceService.setDatabase(db.getInstance());

// Calculate IVA
const ivaCalc = invoiceService.calculateIVA(1000, 1);
// Returns: {
//   base_amount: 1000,
//   iva_rate: 0.21,
//   iva_amount: 210,
//   total_amount: 1210
// }

// Create invoice
const invoice = await invoiceService.createInvoice({
  cuit_emisor: '20-12345678-9',
  cuit_receptor: '27-98765432-1',
  pos: 1,
  total_amount: 1000,
  tax_category: 1,
  invoice_type: 1
});
// Returns invoice with auto-generated CAE and invoice number

// Get invoice by CAE
const invoiceByCAE = await invoiceService.getInvoiceByCAE('20251012123456');

// Get invoice by number
const invoiceByNumber = await invoiceService.getInvoiceByNumber(1, 1);

// Get invoices by CUIT
const invoices = await invoiceService.getInvoicesByCUITEmisor('20-12345678-9');

// Get statistics
const stats = await invoiceService.getInvoiceStats('20-12345678-9');
// Returns: {
//   total_invoices: 5,
//   total_amount: 6050,
//   total_iva: 1050,
//   average_amount: 1210,
//   first_invoice_date: "20251001",
//   last_invoice_date: "20251012"
// }
```

**API:**
- `setDatabase(database)` - Initialize with database instance
- `createInvoice(invoiceData)` - Create new invoice
- `getNextInvoiceNumber(pos)` - Get next number for POS
- `calculateIVA(baseAmount, taxCategory)` - Calculate VAT
- `validateInvoiceData(invoiceData)` - Validate invoice
- `getInvoiceByCAE(cae)` - Find by CAE
- `getInvoiceByNumber(invoiceNumber, pos)` - Find by number
- `getInvoicesByCUITEmisor(cuit, options)` - List by CUIT
- `getInvoicesByDateRange(start, end, options)` - List by date
- `getLastInvoice(pos)` - Get last for POS
- `getInvoiceStats(cuit)` - Get statistics

---

## Architecture

All services follow these patterns:

- **Singleton Pattern**: Export singleton instances for easy importing
- **Structured Logging**: Use Winston logger for all operations
- **Configuration-Driven**: Pull settings from `config/rules.json`
- **Error Handling**: Try-catch with detailed error logging
- **Validation**: Multi-layer validation (format, checksum, business rules)

## AFIP Standards Compliance

- **CUIT Checksum**: Official AFIP algorithm (weights: 5,4,3,2,7,6,5,4,3,2)
- **CAE Format**: 14 digits (YYYYMMDDXXXXXX)
- **CAE Expiration**: 10 days default (configurable)
- **IVA Rates**: From configuration (21% for category 1, 0% for categories 4,6,10)
- **Invoice Sequencing**: Per-POS auto-increment

## Testing

Run the integration test:
```bash
node services/test-services.js
```

This test verifies:
- CUIT validation and formatting
- CAE generation and expiration
- Invoice creation and sequencing
- Database persistence
- IVA calculations
- Query operations

## Dependencies

- **logger** (`utils/logger.js`) - Winston structured logging
- **config** (`utils/config.js`) - Configuration loader
- **db** (`database/db.js`) - SQLite database connection

## For Stream C (API Routes)

These services are ready to be consumed by Express routes:

```javascript
// Example route usage
const cuitService = require('../services/cuit.service');
const invoiceService = require('../services/invoice.service');

router.post('/validate-cuit', (req, res) => {
  const result = cuitService.validateAndFormat(req.body.cuit);
  res.json(result);
});

router.post('/invoices', async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body);
  res.json(invoice);
});
```

All services handle errors gracefully and return descriptive error messages suitable for API responses.
