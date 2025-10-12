/**
 * MercadoPago Configuration for BarberPro Argentina
 * Payment Gateway Integration with Mock Service Support
 */

export interface MercadoPagoConfig {
  baseUrl: string;
  accessToken: string;
  publicKey: string;
  webhookUrl: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
  isMock: boolean;
  timeout: number;
  integrationId: string;
}

export const mercadopagoConfig: MercadoPagoConfig = {
  // Base URL - uses mock service in development
  baseUrl: process.env.MERCADOPAGO_BASE_URL || 'https://api.mercadopago.com',

  // Access token for API requests
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',

  // Public key for frontend integration
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',

  // Webhook URL for payment notifications
  webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || 'http://backend:3000/api/webhooks/mercadopago',

  // Webhook secret for signature validation
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',

  // Environment (sandbox for development/testing)
  environment: (process.env.MERCADOPAGO_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',

  // Use mock service in development
  isMock: process.env.NODE_ENV === 'development',

  // Request timeout in milliseconds
  timeout: parseInt(process.env.MERCADOPAGO_TIMEOUT || '15000'),

  // Integration identifier
  integrationId: process.env.MERCADOPAGO_INTEGRATION_ID || 'barberpro-v1',
};

/**
 * Validate MercadoPago configuration
 * Throws an error if required configuration is missing
 */
export function validateMercadoPagoConfig(): void {
  const errors: string[] = [];

  if (!mercadopagoConfig.accessToken) {
    errors.push('MERCADOPAGO_ACCESS_TOKEN is required');
  }

  if (!mercadopagoConfig.publicKey) {
    errors.push('MERCADOPAGO_PUBLIC_KEY is required');
  }

  if (!mercadopagoConfig.webhookSecret && process.env.NODE_ENV === 'production') {
    errors.push('MERCADOPAGO_WEBHOOK_SECRET is required in production');
  }

  if (!mercadopagoConfig.baseUrl) {
    errors.push('MERCADOPAGO_BASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`MercadoPago configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get MercadoPago configuration with validation
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  validateMercadoPagoConfig();
  return mercadopagoConfig;
}

export default mercadopagoConfig;
