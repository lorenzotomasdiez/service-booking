/**
 * Email/SMTP Configuration for BarberPro Argentina
 * Email Service Integration with MailHog Support for Development
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
  isMock: boolean;
  timeout: number;
  maxRetries: number;
}

export const emailConfig: EmailConfig = {
  // SMTP host - uses MailHog in development
  host: process.env.SMTP_HOST || 'localhost',

  // SMTP port (1025 for MailHog, 587 for production)
  port: parseInt(process.env.SMTP_PORT || '587'),

  // Use TLS/SSL (false for MailHog, true for production)
  secure: process.env.SMTP_SECURE === 'true',

  // SMTP authentication user
  user: process.env.SMTP_USER || '',

  // SMTP authentication password
  password: process.env.SMTP_PASSWORD || '',

  // Default "from" email address
  from: process.env.SMTP_FROM || 'noreply@barberpro.com.ar',

  // Default "from" name
  fromName: process.env.SMTP_FROM_NAME || 'BarberPro',

  // Use mock service (MailHog) in development
  isMock: process.env.NODE_ENV === 'development',

  // Request timeout in milliseconds
  timeout: parseInt(process.env.SMTP_TIMEOUT || '10000'),

  // Maximum retry attempts for failed emails
  maxRetries: parseInt(process.env.SMTP_MAX_RETRIES || '3'),
};

/**
 * Validate Email configuration
 * Throws an error if required configuration is missing
 */
export function validateEmailConfig(): void {
  const errors: string[] = [];

  if (!emailConfig.host) {
    errors.push('SMTP_HOST is required');
  }

  if (!emailConfig.port || emailConfig.port <= 0 || emailConfig.port > 65535) {
    errors.push('SMTP_PORT must be a valid port number (1-65535)');
  }

  if (!emailConfig.from) {
    errors.push('SMTP_FROM is required');
  }

  // In production with secure SMTP, credentials are required
  if (process.env.NODE_ENV === 'production' && emailConfig.secure) {
    if (!emailConfig.user) {
      errors.push('SMTP_USER is required in production with secure SMTP');
    }

    if (!emailConfig.password) {
      errors.push('SMTP_PASSWORD is required in production with secure SMTP');
    }
  }

  // Validate email format for "from" address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailConfig.from && !emailRegex.test(emailConfig.from)) {
    errors.push('SMTP_FROM must be a valid email address');
  }

  if (errors.length > 0) {
    throw new Error(`Email configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get Email configuration with validation
 */
export function getEmailConfig(): EmailConfig {
  validateEmailConfig();
  return emailConfig;
}

export default emailConfig;
