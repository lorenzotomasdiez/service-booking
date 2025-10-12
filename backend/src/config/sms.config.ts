/**
 * SMS Configuration for BarberPro Argentina
 * SMS Gateway Integration with Mock Service Support
 */

export interface SMSConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  provider: 'mock' | 'twilio' | 'nexmo' | 'messagebird';
  webhookUrl: string;
  isMock: boolean;
  timeout: number;
  costPerSegment: number;
  defaultSender: string;
}

export const smsConfig: SMSConfig = {
  // Base API URL - uses mock service in development
  apiUrl: process.env.SMS_API_URL || process.env.SMS_BASE_URL || 'https://api.twilio.com',

  // API key for SMS service
  apiKey: process.env.SMS_API_KEY || '',

  // API secret for SMS service
  apiSecret: process.env.SMS_API_SECRET || '',

  // SMS provider
  provider: (process.env.SMS_PROVIDER as 'mock' | 'twilio' | 'nexmo' | 'messagebird') || 'mock',

  // Webhook URL for delivery status updates
  webhookUrl: process.env.SMS_WEBHOOK_URL || 'http://backend:3000/api/webhooks/sms',

  // Use mock service in development
  isMock: process.env.NODE_ENV === 'development',

  // Request timeout in milliseconds
  timeout: parseInt(process.env.SMS_TIMEOUT || '10000'),

  // Cost per SMS segment in ARS
  costPerSegment: parseFloat(process.env.SMS_COST_PER_SEGMENT || '0.05'),

  // Default sender name/number
  defaultSender: process.env.SMS_DEFAULT_SENDER || 'BarberPro',
};

/**
 * Validate SMS configuration
 * Throws an error if required configuration is missing
 */
export function validateSMSConfig(): void {
  const errors: string[] = [];

  if (!smsConfig.apiUrl) {
    errors.push('SMS_API_URL or SMS_BASE_URL is required');
  }

  // In production, API credentials are required
  if (process.env.NODE_ENV === 'production' && smsConfig.provider !== 'mock') {
    if (!smsConfig.apiKey) {
      errors.push('SMS_API_KEY is required in production');
    }

    if (!smsConfig.apiSecret) {
      errors.push('SMS_API_SECRET is required in production');
    }
  }

  // Validate provider
  const validProviders = ['mock', 'twilio', 'nexmo', 'messagebird'];
  if (!validProviders.includes(smsConfig.provider)) {
    errors.push(`SMS_PROVIDER must be one of: ${validProviders.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new Error(`SMS configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get SMS configuration with validation
 */
export function getSMSConfig(): SMSConfig {
  validateSMSConfig();
  return smsConfig;
}

export default smsConfig;
