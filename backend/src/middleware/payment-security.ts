/**
 * Payment Security Middleware for BarberPro Argentina
 * Enhanced security measures for payment processing
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import paymentConfig from '../config/payment';

/**
 * Rate limiting specifically for payment endpoints
 */
export const paymentRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 payment requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Payment Requests',
    message: 'Demasiadas solicitudes de pago. Intente nuevamente en 15 minutos.',
    statusCode: 429,
  },
};

/**
 * Webhook signature validation middleware
 */
export const validateWebhookSignature = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!paymentConfig.webhooks.signatureValidation) {
    return; // Skip validation if disabled
  }

  const signature = request.headers['x-signature'] as string;
  if (!signature) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'MISSING_SIGNATURE',
        message: 'Webhook signature is required',
      },
    });
  }

  try {
    const payloadString = JSON.stringify(request.body);
    const webhookSecret = paymentConfig.mercadopago.webhookSecret;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadString)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      request.log.warn('Invalid webhook signature received');

      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature',
        },
      });
    }
  } catch (error: any) {
    request.log.error('Error validating webhook signature:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'SIGNATURE_VALIDATION_ERROR',
        message: 'Error validating signature',
      },
    });
  }
};

/**
 * Payment data encryption utility
 */
export class PaymentEncryption {
  private static algorithm = 'aes-256-gcm';
  private static key = Buffer.from(paymentConfig.security.encryptionKey || 'your_32_character_encryption_key_here_123', 'utf8');

  static encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key.slice(0, 32), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string }): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key.slice(0, 32), iv);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

/**
 * PCI DSS compliance middleware
 */
export const pciComplianceMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!paymentConfig.security.pciComplianceMode) {
    return;
  }

  // Set security headers for PCI DSS compliance
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self' https://www.mercadopago.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");

  // Remove sensitive headers that might leak information
  reply.removeHeader('X-Powered-By');
  reply.removeHeader('Server');
};

/**
 * Payment audit logging middleware
 */
export const paymentAuditLogger = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!paymentConfig.security.auditLogging) {
    return;
  }

  const startTime = Date.now();
  const originalSend = reply.send;

  // Log request details
  const auditLog = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    userId: (request as any).user?.userId,
    requestId: request.id,
    startTime,
  };

  request.log.info('Payment audit log - Request');

  // Override reply.send to log response
  reply.send = function(payload: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const responseAuditLog = {
      ...auditLog,
      endTime,
      responseTime,
      statusCode: reply.statusCode,
      success: reply.statusCode < 400,
    };

    request.log.info('Payment audit log - Response');
    
    return originalSend.call(this, payload);
  };
};

/**
 * IP whitelist middleware for webhook endpoints
 */
export const webhookIPWhitelist = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // MercadoPago webhook IP ranges (update as needed)
  const allowedIPs = [
    '209.225.49.0/24',
    '216.33.197.0/24',
    '216.33.196.0/24',
    '127.0.0.1', // localhost for testing
    '::1', // localhost IPv6
  ];

  const clientIP = request.ip;
  
  // Check if IP is in whitelist (simplified check for localhost)
  const isAllowed = allowedIPs.some(allowedIP => {
    if (allowedIP === clientIP) return true;
    if (allowedIP === '127.0.0.1' && (clientIP === '127.0.0.1' || clientIP === '::1')) return true;
    return false;
  });

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    request.log.warn('Webhook request from unauthorized IP');

    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN_IP',
        message: 'Access denied',
      },
    });
  }
};

/**
 * Request timeout middleware for payment operations
 */
export const paymentTimeoutMiddleware = (timeoutMs: number = 30000) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const timeoutId = setTimeout(() => {
      if (!reply.sent) {
        reply.status(408).send({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Payment request timed out',
          },
        });
      }
    }, timeoutMs);

    // Clear timeout when request completes
    reply.raw.on('finish', () => {
      clearTimeout(timeoutId);
    });
  };
};

/**
 * Sensitive data sanitization middleware
 */
export const sanitizePaymentLogs = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const originalLog = request.log;
  
  // Override log methods to sanitize sensitive data
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = { ...obj };
    const sensitiveFields = [
      'password',
      'token',
      'authorization',
      'credit_card',
      'cvv',
      'expiration_date',
      'cardholder_name',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  };

  request.log = {
    ...originalLog,
    info: (msg: any, obj?: any) => originalLog.info(msg, obj ? sanitize(obj) : undefined),
    warn: (msg: any, obj?: any) => originalLog.warn(msg, obj ? sanitize(obj) : undefined),
    error: (msg: any, obj?: any) => originalLog.error(msg, obj ? sanitize(obj) : undefined),
    debug: (msg: any, obj?: any) => originalLog.debug(msg, obj ? sanitize(obj) : undefined),
  } as any;
};

/**
 * Combined payment security setup
 */
export const setupPaymentSecurity = (server: any) => {
  // Apply payment-specific rate limiting
  server.register(require('@fastify/rate-limit'), {
    ...paymentRateLimit,
    keyGenerator: (request: FastifyRequest) => {
      // Use IP + user ID for authenticated requests
      const userId = (request as any).user?.userId;
      return userId ? `${request.ip}-${userId}` : request.ip;
    },
    skipOnError: false,
    skipSuccessfulRequests: false,
  });

  // Apply security middleware to all payment routes
  server.addHook('preHandler', pciComplianceMiddleware);
  server.addHook('preHandler', paymentAuditLogger);
  server.addHook('preHandler', sanitizePaymentLogs);
};

export default {
  paymentRateLimit,
  validateWebhookSignature,
  PaymentEncryption,
  pciComplianceMiddleware,
  paymentAuditLogger,
  webhookIPWhitelist,
  paymentTimeoutMiddleware,
  sanitizePaymentLogs,
  setupPaymentSecurity,
};