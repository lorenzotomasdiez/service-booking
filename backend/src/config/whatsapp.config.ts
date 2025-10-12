/**
 * WhatsApp Business Configuration for BarberPro Argentina
 * WhatsApp Business API Integration with Mock Service Support
 */

export interface WhatsAppConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId: string;
  businessPhone: string;
  webhookUrl: string;
  webhookVerifyToken: string;
  isMock: boolean;
  timeout: number;
  version: string;
}

export const whatsappConfig: WhatsAppConfig = {
  // Base API URL - uses mock service in development
  apiUrl: process.env.WHATSAPP_API_URL || process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com',

  // Access token for WhatsApp Business API
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN || '',

  // Phone number ID from WhatsApp Business
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',

  // Business phone number (Argentina format: +54 9 11 1234-5678)
  businessPhone: process.env.WHATSAPP_BUSINESS_PHONE || '',

  // Webhook URL for incoming messages
  webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || 'http://backend:3000/api/webhooks/whatsapp',

  // Webhook verification token
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',

  // Use mock service in development
  isMock: process.env.NODE_ENV === 'development',

  // Request timeout in milliseconds
  timeout: parseInt(process.env.WHATSAPP_TIMEOUT || '10000'),

  // WhatsApp API version
  version: process.env.WHATSAPP_API_VERSION || 'v18.0',
};

/**
 * Validate WhatsApp configuration
 * Throws an error if required configuration is missing
 */
export function validateWhatsAppConfig(): void {
  const errors: string[] = [];

  if (!whatsappConfig.accessToken) {
    errors.push('WHATSAPP_ACCESS_TOKEN or WHATSAPP_API_TOKEN is required');
  }

  if (!whatsappConfig.apiUrl) {
    errors.push('WHATSAPP_API_URL or WHATSAPP_BASE_URL is required');
  }

  // In production, phone number ID and business phone are required
  if (process.env.NODE_ENV === 'production') {
    if (!whatsappConfig.phoneNumberId) {
      errors.push('WHATSAPP_PHONE_NUMBER_ID is required in production');
    }

    if (!whatsappConfig.businessPhone) {
      errors.push('WHATSAPP_BUSINESS_PHONE is required in production');
    }

    if (!whatsappConfig.webhookVerifyToken) {
      errors.push('WHATSAPP_WEBHOOK_VERIFY_TOKEN is required in production');
    }
  }

  // Validate Argentina phone format if provided
  if (whatsappConfig.businessPhone && !/^\+54\s?9?\s?\d{2,4}\s?\d{4}-?\d{4}$/.test(whatsappConfig.businessPhone)) {
    errors.push('WHATSAPP_BUSINESS_PHONE must be in Argentina format (+54 9 11 1234-5678)');
  }

  if (errors.length > 0) {
    throw new Error(`WhatsApp configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get WhatsApp configuration with validation
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  validateWhatsAppConfig();
  return whatsappConfig;
}

export default whatsappConfig;
