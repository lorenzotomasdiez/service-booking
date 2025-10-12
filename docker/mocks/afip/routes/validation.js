const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const config = require('../utils/config');

/**
 * AFIP Validation Service Mock Routes
 *
 * These routes simulate AFIP's validation endpoints for CUIT/CUIL verification
 * and taxpayer information retrieval.
 */

/**
 * Validate CUIT/CUIL checksum (Dígito Verificador)
 */
function validateCUITChecksum(cuit) {
  const normalized = cuit.replace(/[-\s]/g, '');

  if (!/^\d{11}$/.test(normalized)) {
    return { valid: false, error: 'CUIT must be 11 digits' };
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

  const isValid = checkDigit === parseInt(normalized[10]);

  return {
    valid: isValid,
    normalized,
    checkDigit,
    providedCheckDigit: parseInt(normalized[10])
  };
}

/**
 * Determine document type from CUIT prefix
 */
function getDocumentType(cuit) {
  const prefix = parseInt(cuit.substring(0, 2));

  if (prefix === 20 || prefix === 23 || prefix === 24 || prefix === 27) {
    return 'CUIT'; // Company or individual taxpayer
  } else if (prefix === 30 || prefix === 33 || prefix === 34) {
    return 'CUIT'; // Legal entity
  } else {
    return 'CUIL'; // Individual
  }
}

/**
 * Generate mock taxpayer data based on CUIT
 */
function generateMockTaxpayerData(cuit) {
  const normalized = cuit.replace(/[-\s]/g, '');
  const prefix = parseInt(normalized.substring(0, 2));
  const documentNumber = normalized.substring(2, 10);

  // Determine if it's a person or company based on prefix
  const isCompany = [30, 33, 34].includes(prefix);
  const documentType = getDocumentType(normalized);

  if (isCompany) {
    return {
      tipoPersona: 'JURIDICA',
      tipoCuit: documentType,
      numeroDocumento: parseInt(documentNumber),
      razonSocial: `Mock Company ${documentNumber} S.A.`,
      nombre: null,
      apellido: null,
      domicilioFiscal: {
        direccion: `Av. Corrientes ${Math.floor(Math.random() * 9000) + 1000}`,
        localidad: 'Ciudad Autónoma de Buenos Aires',
        provincia: 'Ciudad Autónoma de Buenos Aires',
        codigoPostal: 'C1043',
        pais: 'ARGENTINA'
      },
      categoriaAutonomo: null,
      estadoCuit: 'ACTIVO',
      idPersona: parseInt(documentNumber)
    };
  } else {
    const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Diego', 'Sofía'];
    const lastNames = ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Pérez', 'Sánchez'];

    const randomFirstName = firstNames[parseInt(documentNumber[0]) % firstNames.length];
    const randomLastName = lastNames[parseInt(documentNumber[1]) % lastNames.length];

    return {
      tipoPersona: 'FISICA',
      tipoCuit: documentType,
      numeroDocumento: parseInt(documentNumber),
      razonSocial: null,
      nombre: randomFirstName,
      apellido: randomLastName,
      domicilioFiscal: {
        direccion: `Calle ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 9000) + 1000}`,
        localidad: 'Ciudad Autónoma de Buenos Aires',
        provincia: 'Ciudad Autónoma de Buenos Aires',
        codigoPostal: 'C1000',
        pais: 'ARGENTINA'
      },
      categoriaAutonomo: 'MONOTRIBUTO',
      estadoCuit: 'ACTIVO',
      idPersona: parseInt(documentNumber)
    };
  }
}

/**
 * POST /ws_sr_padron_a5/getPersona
 * Validate CUIT/CUIL and retrieve taxpayer information
 *
 * Request body:
 * {
 *   "cuit": "20-12345678-9" or "20123456789"
 * }
 *
 * Response:
 * {
 *   "persona": {
 *     "tipoPersona": "FISICA" | "JURIDICA",
 *     "numeroDocumento": 12345678,
 *     "razonSocial": "Company Name S.A.",
 *     "domicilioFiscal": {...},
 *     ...
 *   }
 * }
 */
router.post('/ws_sr_padron_a5/getPersona', async (req, res) => {
  try {
    const { cuit } = req.body;

    // Validate CUIT presence
    if (!cuit) {
      logger.warn('getPersona request missing CUIT');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'CUIT/CUIL is required'
      });
    }

    // Validate CUIT format and checksum
    const validation = validateCUITChecksum(cuit);

    if (!validation.valid) {
      logger.warn('Invalid CUIT checksum', {
        cuit,
        provided: validation.providedCheckDigit,
        expected: validation.checkDigit
      });
      return res.status(400).json({
        error: 'INVALID_CUIT',
        message: 'Invalid CUIT/CUIL checksum',
        details: {
          provided_check_digit: validation.providedCheckDigit,
          expected_check_digit: validation.checkDigit
        }
      });
    }

    // Simulate network delay
    const delays = config.getResponseDelays();
    if (delays.validation > 0) {
      await new Promise(resolve => setTimeout(resolve, delays.validation));
    }

    // Generate mock taxpayer data
    const personaData = generateMockTaxpayerData(validation.normalized);

    logger.info('CUIT validation successful', {
      cuit: validation.normalized,
      type: personaData.tipoPersona
    });

    res.json({
      persona: {
        ...personaData,
        cuit: validation.normalized
      }
    });

  } catch (error) {
    logger.error('getPersona error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Validation service error'
    });
  }
});

/**
 * POST /ws_sr_padron_a5/getPersonaList
 * Get information for multiple CUITs/CUILs
 *
 * Request body:
 * {
 *   "cuits": ["20-12345678-9", "30-12345678-9"]
 * }
 */
router.post('/ws_sr_padron_a5/getPersonaList', async (req, res) => {
  try {
    const { cuits } = req.body;

    if (!cuits || !Array.isArray(cuits) || cuits.length === 0) {
      logger.warn('getPersonaList request missing or invalid cuits array');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Array of CUITs/CUILs is required'
      });
    }

    // Limit to 100 CUITs per request
    if (cuits.length > 100) {
      logger.warn('getPersonaList request exceeds maximum', { count: cuits.length });
      return res.status(400).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Maximum 100 CUITs per request'
      });
    }

    // Simulate network delay
    const delays = config.getResponseDelays();
    if (delays.validation > 0) {
      await new Promise(resolve => setTimeout(resolve, delays.validation));
    }

    // Process each CUIT
    const results = [];

    for (const cuit of cuits) {
      const validation = validateCUITChecksum(cuit);

      if (!validation.valid) {
        results.push({
          cuit,
          error: 'INVALID_CHECKSUM',
          persona: null
        });
        continue;
      }

      const personaData = generateMockTaxpayerData(validation.normalized);
      results.push({
        cuit: validation.normalized,
        error: null,
        persona: personaData
      });
    }

    logger.info('CUIT list validation completed', {
      total: cuits.length,
      valid: results.filter(r => !r.error).length
    });

    res.json({
      personas: results
    });

  } catch (error) {
    logger.error('getPersonaList error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Validation service error'
    });
  }
});

/**
 * POST /validate/cuit
 * Simple CUIT validation endpoint (checksum only)
 *
 * Request body:
 * {
 *   "cuit": "20-12345678-9"
 * }
 *
 * Response:
 * {
 *   "valid": true,
 *   "cuit": "20123456789",
 *   "formatted": "20-12345678-9"
 * }
 */
router.post('/validate/cuit', async (req, res) => {
  try {
    const { cuit } = req.body;

    if (!cuit) {
      logger.warn('CUIT validation request missing CUIT');
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'CUIT/CUIL is required'
      });
    }

    const validation = validateCUITChecksum(cuit);

    if (!validation.valid) {
      logger.info('CUIT validation failed', {
        cuit,
        provided: validation.providedCheckDigit,
        expected: validation.checkDigit
      });

      return res.json({
        valid: false,
        cuit: validation.normalized,
        formatted: formatCUIT(validation.normalized),
        error: 'Invalid checksum',
        details: {
          provided_check_digit: validation.providedCheckDigit,
          expected_check_digit: validation.checkDigit
        }
      });
    }

    logger.info('CUIT validation successful', { cuit: validation.normalized });

    res.json({
      valid: true,
      cuit: validation.normalized,
      formatted: formatCUIT(validation.normalized),
      type: getDocumentType(validation.normalized)
    });

  } catch (error) {
    logger.error('CUIT validation error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Validation service error'
    });
  }
});

/**
 * Format CUIT with dashes (XX-XXXXXXXX-X)
 */
function formatCUIT(cuit) {
  const normalized = cuit.replace(/[-\s]/g, '');
  return `${normalized.substring(0, 2)}-${normalized.substring(2, 10)}-${normalized.substring(10)}`;
}

/**
 * GET /validate/cuit/:cuit
 * Validate CUIT via URL parameter
 */
router.get('/validate/cuit/:cuit', (req, res) => {
  try {
    const { cuit } = req.params;

    if (!cuit) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'CUIT/CUIL is required'
      });
    }

    const validation = validateCUITChecksum(cuit);

    if (!validation.valid) {
      return res.json({
        valid: false,
        cuit: validation.normalized,
        formatted: formatCUIT(validation.normalized),
        error: 'Invalid checksum',
        details: {
          provided_check_digit: validation.providedCheckDigit,
          expected_check_digit: validation.checkDigit
        }
      });
    }

    res.json({
      valid: true,
      cuit: validation.normalized,
      formatted: formatCUIT(validation.normalized),
      type: getDocumentType(validation.normalized)
    });

  } catch (error) {
    logger.error('CUIT validation error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Validation service error'
    });
  }
});

module.exports = router;
