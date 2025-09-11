/**
 * Payment Configuration for BarberPro Argentina
 * MercadoPago Integration with Argentina-specific settings
 */

export const paymentConfig = {
  // MercadoPago Configuration
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox' 
      ? process.env.MERCADOPAGO_ACCESS_TOKEN_TEST 
      : process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox' 
      ? process.env.MERCADOPAGO_PUBLIC_KEY_TEST 
      : process.env.MERCADOPAGO_PUBLIC_KEY,
    environment: process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox',
    timeout: parseInt(process.env.MERCADOPAGO_TIMEOUT || '15000'),
    integrationId: process.env.MERCADOPAGO_INTEGRATION_ID || 'barberpro-v1',
    baseUrl: process.env.MERCADOPAGO_BASE_URL || 'https://api.mercadopago.com',
    webhookSecret: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox' 
      ? process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST 
      : process.env.MERCADOPAGO_WEBHOOK_SECRET,
  },

  // Argentina Business Configuration
  business: {
    commissionStandard: parseFloat(process.env.PLATFORM_COMMISSION_STANDARD || '0.035'),
    commissionHighVolume: parseFloat(process.env.PLATFORM_COMMISSION_HIGH_VOLUME || '0.028'),
    commissionPremium: parseFloat(process.env.PLATFORM_COMMISSION_PREMIUM || '0.025'),
    payoutHoldDays: parseInt(process.env.PAYOUT_HOLD_DAYS || '10'),
    minimumPayoutAmount: parseInt(process.env.MINIMUM_PAYOUT_AMOUNT || '1000'),
  },

  // Payment Method Configuration
  paymentMethods: {
    installmentsMax: parseInt(process.env.PAYMENT_INSTALLMENTS_MAX || '12'),
    ticketExpiryDays: parseInt(process.env.PAYMENT_TICKET_EXPIRY_DAYS || '3'),
    retryAttempts: parseInt(process.env.PAYMENT_RETRY_ATTEMPTS || '3'),
    retryDelayMs: parseInt(process.env.PAYMENT_RETRY_DELAY_MS || '5000'),
  },

  // Argentina Tax Configuration
  tax: {
    ivaRate: parseFloat(process.env.TAX_IVA_RATE || '0.21'),
    withholdingEnabled: process.env.TAX_WITHHOLDING_ENABLED === 'true',
    afipIntegrationEnabled: process.env.AFIP_INTEGRATION_ENABLED === 'true',
    electronicInvoicePointOfSale: parseInt(process.env.ELECTRONIC_INVOICE_POINT_OF_SALE || '1'),
  },

  // Webhook Configuration
  webhooks: {
    signatureValidation: process.env.WEBHOOK_SIGNATURE_VALIDATION !== 'false',
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '5'),
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000'),
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.PAYMENT_DATA_ENCRYPTION_KEY,
    pciComplianceMode: process.env.PCI_COMPLIANCE_MODE === 'true',
    auditLogging: process.env.PAYMENT_AUDIT_LOGGING !== 'false',
  },

  // Development and Testing
  testing: {
    simulationEnabled: process.env.ENABLE_PAYMENT_SIMULATION === 'true',
    successRate: parseFloat(process.env.TEST_PAYMENT_SUCCESS_RATE || '0.95'),
    debugLogging: process.env.PAYMENT_DEBUG_LOGGING === 'true',
  },

  // Monitoring
  monitoring: {
    successRateThreshold: parseFloat(process.env.PAYMENT_SUCCESS_RATE_THRESHOLD || '0.95'),
    responseTimeThreshold: parseInt(process.env.PAYMENT_RESPONSE_TIME_THRESHOLD || '5000'),
    metricsEnabled: process.env.ENABLE_PAYMENT_METRICS !== 'false',
    alertEmail: process.env.PAYMENT_ALERT_EMAIL || 'admin@barberpro.com.ar',
  },
};

// Validation
export function validatePaymentConfig(): void {
  const errors: string[] = [];

  if (!paymentConfig.mercadopago.accessToken) {
    errors.push('MERCADOPAGO_ACCESS_TOKEN is required');
  }

  if (!paymentConfig.mercadopago.publicKey) {
    errors.push('MERCADOPAGO_PUBLIC_KEY is required');
  }

  if (!paymentConfig.mercadopago.webhookSecret) {
    errors.push('MERCADOPAGO_WEBHOOK_SECRET is required');
  }

  if (!paymentConfig.security.encryptionKey) {
    errors.push('PAYMENT_DATA_ENCRYPTION_KEY is required');
  }

  if (paymentConfig.security.encryptionKey && paymentConfig.security.encryptionKey.length < 32) {
    errors.push('PAYMENT_DATA_ENCRYPTION_KEY must be at least 32 characters');
  }

  if (errors.length > 0) {
    throw new Error(`Payment configuration errors: ${errors.join(', ')}`);
  }
}

export default paymentConfig;