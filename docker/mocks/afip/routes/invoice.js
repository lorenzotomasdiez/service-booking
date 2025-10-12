const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const config = require('../utils/config');
const db = require('../database/db');

/**
 * AFIP WSFEv1 (Web Service Facturación Electrónica v1) Mock Routes
 *
 * These routes simulate AFIP's electronic invoicing endpoints for local development.
 * Implements CAE (Código de Autorización Electrónico) generation and invoice tracking.
 */

/**
 * Generate a mock CAE (14 digits)
 */
function generateCAE() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const sequence = Math.floor(Math.random() * 100).toString().padStart(2, '0');

  return `${year}${month}${day}${random}${sequence}`;
}

/**
 * Calculate CAE expiration date (10 days from now)
 */
function getCAEExpiration() {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  return date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
}

/**
 * Format date to YYYYMMDD
 */
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Validate CUIT checksum (Dígito Verificador)
 */
function validateCUITChecksum(cuit) {
  const normalized = cuit.replace(/[-\s]/g, '');
  if (!/^\d{11}$/.test(normalized)) {
    return false;
  }

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(normalized[i]) * multipliers[i];
  }

  const remainder = sum % 11;
  let checkDigit = 11 - remainder;

  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) checkDigit = 9;

  return checkDigit === parseInt(normalized[10]);
}

/**
 * POST /wsfev1/FECAESolicitar
 * Request CAE for a new invoice
 *
 * Request body:
 * {
 *   "FeCAEReq": {
 *     "FeCabReq": {
 *       "CantReg": 1,
 *       "PtoVta": 1,
 *       "CbteTipo": 6
 *     },
 *     "FeDetReq": [{
 *       "Concepto": 1,
 *       "DocTipo": 80,
 *       "DocNro": 20123456789,
 *       "CbteDesde": 1,
 *       "CbteHasta": 1,
 *       "CbteFch": "20251012",
 *       "ImpTotal": 1210.00,
 *       "ImpTotConc": 0,
 *       "ImpNeto": 1000.00,
 *       "ImpOpEx": 0,
 *       "ImpIVA": 210.00,
 *       "ImpTrib": 0,
 *       "MonId": "PES",
 *       "MonCotiz": 1,
 *       "Iva": [{
 *         "Id": 5,
 *         "BaseImp": 1000.00,
 *         "Importe": 210.00
 *       }]
 *     }]
 *   }
 * }
 */
router.post('/wsfev1/FECAESolicitar', async (req, res) => {
  try {
    const { FeCAEReq } = req.body;

    // Validate request structure
    if (!FeCAEReq || !FeCAEReq.FeCabReq || !FeCAEReq.FeDetReq) {
      logger.warn('Invalid FECAESolicitar request structure');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Invalid request structure. Expected FeCAEReq with FeCabReq and FeDetReq'
      });
    }

    const { FeCabReq, FeDetReq } = FeCAEReq;
    const { CantReg, PtoVta, CbteTipo } = FeCabReq;

    // Validate required fields
    if (!PtoVta || !CbteTipo || !CantReg) {
      logger.warn('Missing required fields in FeCabReq');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Missing required fields: PtoVta, CbteTipo, CantReg'
      });
    }

    // Validate invoice type
    if (!config.isValidInvoiceType(CbteTipo.toString())) {
      logger.warn('Invalid invoice type', { type: CbteTipo });
      return res.status(400).json({
        error: 'INVALID_INVOICE_TYPE',
        message: `Invalid invoice type: ${CbteTipo}`
      });
    }

    // Process each invoice in the request
    const results = [];
    const dbInstance = db.getInstance();

    for (const invoice of FeDetReq) {
      const {
        DocNro,
        CbteDesde,
        ImpTotal,
        ImpNeto,
        ImpIVA
      } = invoice;

      // Validate CUIT if provided
      if (DocNro) {
        const cuitStr = DocNro.toString();
        if (!validateCUITChecksum(cuitStr)) {
          logger.warn('Invalid CUIT checksum', { cuit: cuitStr });
          results.push({
            CbteDesde,
            Resultado: 'R',
            Observaciones: [{
              Code: 10016,
              Msg: 'El CUIT informado no es válido'
            }]
          });
          continue;
        }
      }

      // Validate amounts
      const validationRules = config.getValidationRules();
      if (ImpTotal < validationRules.min_invoice_amount ||
          ImpTotal > validationRules.max_invoice_amount) {
        logger.warn('Invalid invoice amount', { amount: ImpTotal });
        results.push({
          CbteDesde,
          Resultado: 'R',
          Observaciones: [{
            Code: 10048,
            Msg: `El importe total debe estar entre ${validationRules.min_invoice_amount} y ${validationRules.max_invoice_amount}`
          }]
        });
        continue;
      }

      // Get or create POS config
      let posConfig = await dbInstance.get(
        'SELECT * FROM pos_config WHERE pos = ?',
        [PtoVta]
      );

      if (!posConfig) {
        await dbInstance.run(
          'INSERT INTO pos_config (pos, last_invoice_number) VALUES (?, 0)',
          [PtoVta]
        );
        posConfig = { pos: PtoVta, last_invoice_number: 0 };
      }

      // Determine next invoice number
      const invoiceNumber = CbteDesde || (posConfig.last_invoice_number + 1);

      // Generate CAE
      const cae = generateCAE();
      const caeExpiration = getCAEExpiration();
      const invoiceDate = formatDate();

      // Store invoice in database
      try {
        await dbInstance.run(
          `INSERT INTO invoices (
            cae, cae_expiration, invoice_number, pos, invoice_date,
            invoice_type, total_amount, iva_amount, cuit_emisor,
            cuit_receptor, tax_category
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cae,
            caeExpiration,
            invoiceNumber,
            PtoVta,
            invoiceDate,
            CbteTipo,
            ImpTotal,
            ImpIVA,
            '20123456789', // Mock CUIT emisor
            DocNro ? DocNro.toString() : null,
            1 // Default tax category
          ]
        );

        // Update POS last invoice number
        await dbInstance.run(
          'UPDATE pos_config SET last_invoice_number = ?, updated_at = CURRENT_TIMESTAMP WHERE pos = ?',
          [invoiceNumber, PtoVta]
        );

        logger.info('CAE generated successfully', {
          cae,
          pos: PtoVta,
          invoice_number: invoiceNumber,
          amount: ImpTotal
        });

        results.push({
          CbteDesde: invoiceNumber,
          CbteHasta: invoiceNumber,
          CAE: cae,
          CAEFchVto: caeExpiration,
          Resultado: 'A', // A = Approved
          Observaciones: []
        });

      } catch (dbError) {
        logger.error('Database error storing invoice', {
          error: dbError.message
        });

        results.push({
          CbteDesde: invoiceNumber,
          Resultado: 'R',
          Observaciones: [{
            Code: 10000,
            Msg: 'Error interno al procesar la solicitud'
          }]
        });
      }
    }

    // Simulate network delay
    const delays = config.getResponseDelays();
    if (delays.invoice > 0) {
      await new Promise(resolve => setTimeout(resolve, delays.invoice));
    }

    // Build AFIP-compliant response
    res.json({
      FECAESolicitarResult: {
        FeCabResp: {
          Cuit: 20123456789,
          PtoVta,
          CbteTipo,
          FchProceso: formatDate(),
          CantReg: results.length,
          Resultado: results.every(r => r.Resultado === 'A') ? 'A' : 'P'
        },
        FeDetResp: results
      }
    });

  } catch (error) {
    logger.error('FECAESolicitar error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error processing CAE request'
    });
  }
});

/**
 * GET /wsfev1/FECompUltimoAutorizado
 * Get the last authorized invoice number for a POS
 *
 * Query params:
 * - pos: Point of sale number (required)
 * - tipo_cbte: Invoice type (optional, defaults to 6)
 */
router.get('/wsfev1/FECompUltimoAutorizado', async (req, res) => {
  try {
    const pos = parseInt(req.query.pos);
    const tipoCbte = parseInt(req.query.tipo_cbte) || 6;

    if (!pos || isNaN(pos)) {
      logger.warn('FECompUltimoAutorizado request missing or invalid POS');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Valid POS (punto de venta) is required'
      });
    }

    const dbInstance = db.getInstance();

    // Get last invoice number from database
    const posConfig = await dbInstance.get(
      'SELECT * FROM pos_config WHERE pos = ?',
      [pos]
    );

    const lastInvoice = posConfig ? posConfig.last_invoice_number : 0;

    logger.info('Last authorized invoice retrieved', {
      pos,
      tipo_cbte: tipoCbte,
      last_invoice: lastInvoice
    });

    res.json({
      FECompUltimoAutorizadoResult: {
        PtoVta: pos,
        CbteTipo: tipoCbte,
        CbteNro: lastInvoice
      }
    });

  } catch (error) {
    logger.error('FECompUltimoAutorizado error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error retrieving last invoice number'
    });
  }
});

/**
 * POST /wsfev1/FEParamGetPtosVenta
 * Get list of configured points of sale (POS)
 */
router.post('/wsfev1/FEParamGetPtosVenta', async (req, res) => {
  try {
    const dbInstance = db.getInstance();

    // Get all POS from database
    const posList = await dbInstance.all(
      'SELECT pos, last_invoice_number FROM pos_config ORDER BY pos'
    );

    logger.info('POS list retrieved', { count: posList.length });

    res.json({
      FEParamGetPtosVentaResult: {
        ResultGet: posList.map(pos => ({
          Nro: pos.pos,
          EmisionTipo: 'CAE',
          Bloqueado: 'N',
          FchBaja: null
        }))
      }
    });

  } catch (error) {
    logger.error('FEParamGetPtosVenta error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error retrieving POS list'
    });
  }
});

/**
 * POST /wsfev1/FEParamGetTiposCbte
 * Get list of invoice types
 */
router.post('/wsfev1/FEParamGetTiposCbte', (req, res) => {
  try {
    const invoiceTypes = config.getInvoiceTypes();

    const result = Object.entries(invoiceTypes).map(([code, type]) => ({
      Id: parseInt(code),
      Desc: type.name,
      FchDesde: '20100917',
      FchHasta: null
    }));

    logger.info('Invoice types retrieved', { count: result.length });

    res.json({
      FEParamGetTiposCbteResult: {
        ResultGet: result
      }
    });

  } catch (error) {
    logger.error('FEParamGetTiposCbte error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error retrieving invoice types'
    });
  }
});

/**
 * GET /wsfev1/FECompConsultar
 * Query an invoice by CAE or invoice number
 *
 * Query params:
 * - cae: CAE code (optional)
 * - pos: Point of sale (optional)
 * - invoice_number: Invoice number (optional)
 */
router.get('/wsfev1/FECompConsultar', async (req, res) => {
  try {
    const { cae, pos, invoice_number } = req.query;

    if (!cae && (!pos || !invoice_number)) {
      logger.warn('FECompConsultar missing search criteria');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Either CAE or (POS + invoice_number) is required'
      });
    }

    const dbInstance = db.getInstance();
    let invoice;

    if (cae) {
      invoice = await dbInstance.get(
        'SELECT * FROM invoices WHERE cae = ?',
        [cae]
      );
    } else {
      invoice = await dbInstance.get(
        'SELECT * FROM invoices WHERE pos = ? AND invoice_number = ?',
        [parseInt(pos), parseInt(invoice_number)]
      );
    }

    if (!invoice) {
      logger.warn('Invoice not found', { cae, pos, invoice_number });
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }

    logger.info('Invoice retrieved', {
      cae: invoice.cae,
      invoice_number: invoice.invoice_number
    });

    res.json({
      FECompConsultarResult: {
        ResultGet: {
          CbteNro: invoice.invoice_number,
          PtoVta: invoice.pos,
          CbteTipo: invoice.invoice_type,
          CbteFch: invoice.invoice_date,
          ImpTotal: invoice.total_amount,
          ImpIVA: invoice.iva_amount,
          ImpNeto: invoice.total_amount - invoice.iva_amount,
          CodAutorizacion: invoice.cae,
          FchVto: invoice.cae_expiration,
          Resultado: 'A'
        }
      }
    });

  } catch (error) {
    logger.error('FECompConsultar error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error querying invoice'
    });
  }
});

module.exports = router;
