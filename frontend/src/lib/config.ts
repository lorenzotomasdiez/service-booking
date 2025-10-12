/**
 * Centralized Configuration for BarberPro Frontend
 *
 * This file consolidates all environment variables into a single, type-safe configuration object.
 * Uses SvelteKit's $env/dynamic/public for runtime environment variables.
 *
 * All environment variables must be prefixed with PUBLIC_ to be exposed to the browser.
 */

import { env } from '$env/dynamic/public';
import { dev } from '$app/environment';

/**
 * Application configuration interface
 */
export interface AppConfig {
  // API & Backend
  apiUrl: string;
  socketUrl: string;

  // Application metadata
  appName: string;
  appVersion: string;
  environment: string;
  isDevelopment: boolean;

  // Argentina localization
  timezone: string;
  locale: string;
  currency: string;

  // Payment integration
  mercadopago: {
    publicKey: string;
  };

  // Feature flags
  features: {
    socialLogin: boolean;
    whatsappSupport: boolean;
    debugLogging: boolean;
  };

  // Support contact
  support: {
    email: string;
    phone: string;
    whatsapp: string;
  };

  // Socket.io configuration
  socket: {
    reconnectAttempts: number;
    reconnectDelay: number;
  };
}

/**
 * Parse boolean environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse number environment variable
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Main application configuration
 * Populated from environment variables with sensible defaults
 */
export const config: AppConfig = {
  // API & Backend
  apiUrl: env.PUBLIC_API_URL || 'http://localhost:3000/api',
  socketUrl: env.PUBLIC_SOCKET_URL || 'http://localhost:3000',

  // Application metadata
  appName: env.PUBLIC_APP_NAME || 'BarberPro',
  appVersion: env.PUBLIC_APP_VERSION || '1.0.0',
  environment: env.NODE_ENV || 'development',
  isDevelopment: dev,

  // Argentina localization
  timezone: env.PUBLIC_TIMEZONE || 'America/Argentina/Buenos_Aires',
  locale: env.PUBLIC_LOCALE || 'es-AR',
  currency: env.PUBLIC_CURRENCY || 'ARS',

  // Payment integration
  mercadopago: {
    publicKey: env.PUBLIC_MERCADOPAGO_PUBLIC_KEY || ''
  },

  // Feature flags
  features: {
    socialLogin: parseBoolean(env.PUBLIC_ENABLE_SOCIAL_LOGIN, true),
    whatsappSupport: parseBoolean(env.PUBLIC_ENABLE_WHATSAPP_SUPPORT, true),
    debugLogging: parseBoolean(env.PUBLIC_ENABLE_DEBUG_LOGGING, dev)
  },

  // Support contact
  support: {
    email: env.PUBLIC_SUPPORT_EMAIL || 'soporte@barberpro.com.ar',
    phone: env.PUBLIC_SUPPORT_PHONE || '+54 11 1234-5678',
    whatsapp: env.PUBLIC_SUPPORT_WHATSAPP || '+5491123456789'
  },

  // Socket.io configuration
  socket: {
    reconnectAttempts: parseNumber(env.PUBLIC_SOCKET_RECONNECT_ATTEMPTS, 5),
    reconnectDelay: parseNumber(env.PUBLIC_SOCKET_RECONNECT_DELAY, 1000)
  }
};

/**
 * Validate critical configuration on startup
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate API URL
  if (!config.apiUrl) {
    errors.push('API URL is not configured (PUBLIC_API_URL)');
  }

  // Validate Socket URL
  if (!config.socketUrl) {
    errors.push('Socket URL is not configured (PUBLIC_SOCKET_URL)');
  }

  // Validate MercadoPago public key (only warn in development)
  if (!config.mercadopago.publicKey && dev) {
    console.warn('MercadoPago public key is not configured (PUBLIC_MERCADOPAGO_PUBLIC_KEY)');
  }

  // Log configuration in development
  if (dev) {
    console.log('[Config] Application configuration loaded:', {
      apiUrl: config.apiUrl,
      socketUrl: config.socketUrl,
      environment: config.environment,
      locale: config.locale,
      features: config.features
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format currency for Argentina
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date/time for Argentina timezone
 */
export function formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(config.locale, {
    timeZone: config.timezone,
    ...options
  }).format(dateObj);
}

/**
 * Format phone number for Argentina
 * Example: +54 9 11 1234-5678
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Argentina phone format: +54 9 11 1234-5678
  if (digits.startsWith('549')) {
    const areaCode = digits.slice(3, 5);
    const firstPart = digits.slice(5, 9);
    const secondPart = digits.slice(9, 13);
    return `+54 9 ${areaCode} ${firstPart}-${secondPart}`;
  }

  return phone;
}

/**
 * Check if running in Docker environment
 */
export function isDockerEnvironment(): boolean {
  // In Docker, the API URL typically uses service names or localhost with exposed ports
  return config.apiUrl.includes('backend:') || config.socketUrl.includes('backend:');
}

// Export default configuration
export default config;
