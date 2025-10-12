/**
 * AFIP Configuration for BarberPro Argentina
 * Argentina Tax Authority (AFIP) Integration with Mock Service Support
 */

export interface AFIPConfig {
  baseUrl: string;
  wsfeUrl: string;
  wsaaUrl: string;
  cuit: string;
  certPath: string;
  keyPath: string;
  environment: 'sandbox' | 'production';
  isMock: boolean;
  timeout: number;
  pointOfSale: number;
}

export const afipConfig: AFIPConfig = {
  // Base URL - uses mock service in development
  baseUrl: process.env.AFIP_BASE_URL || 'https://wswhomo.afip.gov.ar',

  // AFIP Web Services Facturacion Electronica (WSFE) URL
  wsfeUrl: process.env.AFIP_WSFEV1_URL || process.env.AFIP_BASE_URL + '/wsfev1' || 'https://wswhomo.afip.gov.ar/wsfev1',

  // AFIP Web Services Autenticacion y Autorizacion (WSAA) URL
  wsaaUrl: process.env.AFIP_WSAA_URL || process.env.AFIP_BASE_URL + '/wsaa' || 'https://wswhomo.afip.gov.ar/wsaa',

  // CUIT (Clave Unica de Identificacion Tributaria)
  cuit: process.env.AFIP_CUIT || '',

  // Certificate path for AFIP authentication
  certPath: process.env.AFIP_CERT_PATH || '/app/certs/afip-mock.crt',

  // Private key path for AFIP authentication
  keyPath: process.env.AFIP_KEY_PATH || '/app/certs/afip-mock.key',

  // Environment (sandbox for development/testing)
  environment: (process.env.AFIP_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',

  // Use mock service in development
  isMock: process.env.NODE_ENV === 'development',

  // Request timeout in milliseconds
  timeout: parseInt(process.env.AFIP_TIMEOUT || '30000'),

  // Point of sale number for electronic invoicing
  pointOfSale: parseInt(process.env.ELECTRONIC_INVOICE_POINT_OF_SALE || '1'),
};

/**
 * Validate AFIP configuration
 * Throws an error if required configuration is missing
 */
export function validateAFIPConfig(): void {
  const errors: string[] = [];

  if (!afipConfig.cuit) {
    errors.push('AFIP_CUIT is required');
  }

  if (!afipConfig.baseUrl) {
    errors.push('AFIP_BASE_URL is required');
  }

  // In production, certificate and key paths are required
  if (process.env.NODE_ENV === 'production') {
    if (!afipConfig.certPath) {
      errors.push('AFIP_CERT_PATH is required in production');
    }

    if (!afipConfig.keyPath) {
      errors.push('AFIP_KEY_PATH is required in production');
    }
  }

  // Validate CUIT format (should be 11 digits)
  if (afipConfig.cuit && !/^\d{11}$/.test(afipConfig.cuit)) {
    errors.push('AFIP_CUIT must be 11 digits');
  }

  if (errors.length > 0) {
    throw new Error(`AFIP configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get AFIP configuration with validation
 */
export function getAFIPConfig(): AFIPConfig {
  validateAFIPConfig();
  return afipConfig;
}

export default afipConfig;
