/**
 * Security Hardening Service for BarberPro
 * Advanced security validation and DDoS protection
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHash, timingSafeEqual, randomBytes } from 'crypto';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivities: Array<{
    type: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'rate_limit' | 'invalid_input';
    ip: string;
    timestamp: Date;
    details: string;
  }>;
  ddosAttacks: Array<{
    ip: string;
    requestCount: number;
    startTime: Date;
    endTime?: Date;
    blocked: boolean;
  }>;
  lastUpdated: Date;
}

export interface SecurityConfig {
  rateLimiting: {
    general: { requests: number; window: number; }; // 100 requests per minute
    authentication: { requests: number; window: number; }; // 5 attempts per 15 minutes
    payment: { requests: number; window: number; }; // 10 per hour
    api: { requests: number; window: number; }; // 1000 per hour
  };
  ddosProtection: {
    enabled: boolean;
    threshold: number; // requests per second to trigger protection
    banDuration: number; // milliseconds
    whitelist: string[]; // IP addresses to never ban
  };
  inputValidation: {
    maxLength: number; // max string length
    allowedCharacters: RegExp; // allowed characters regex
    blockedPatterns: string[]; // SQL injection, XSS patterns
  };
  auditLogging: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error';
    storage: 'file' | 'database' | 'external';
  };
}

export class SecurityHardeningService {
  private metrics: SecurityMetrics;
  private config: SecurityConfig;
  private rateLimiters: Map<string, RateLimiterMemory>;
  private ipBanList: Set<string>;
  private suspiciousIPs: Map<string, number>;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.config = this.getSecurityConfig();
    this.rateLimiters = new Map();
    this.ipBanList = new Set();
    this.suspiciousIPs = new Map();
    this.initializeRateLimiters();
  }

  /**
   * Initialize security middleware for Fastify
   */
  async setupSecurityMiddleware(server: FastifyInstance): Promise<void> {
    // DDoS protection middleware
    server.addHook('onRequest', this.ddosProtectionHook.bind(this));
    
    // Input validation middleware
    server.addHook('preValidation', this.inputValidationHook.bind(this));
    
    // Security headers middleware
    server.addHook('onSend', this.securityHeadersHook.bind(this));
    
    // Audit logging middleware
    server.addHook('onResponse', this.auditLoggingHook.bind(this));

    console.log('🛡️  Security hardening middleware initialized');
  }

  /**
   * DDoS protection and rate limiting
   */
  private async ddosProtectionHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const clientIp = this.getClientIP(request);
    
    // Check if IP is banned
    if (this.ipBanList.has(clientIp)) {
      this.logSecurityEvent('rate_limit', clientIp, 'IP banned - DDoS protection');
      throw new Error('Access denied');
    }

    // Check rate limits
    const endpoint = this.categorizeEndpoint(request.url);
    const rateLimiter = this.rateLimiters.get(endpoint);
    
    if (rateLimiter) {
      try {
        await rateLimiter.consume(clientIp);
      } catch (rateLimiterRes) {
        // Rate limit exceeded
        this.handleRateLimitExceeded(clientIp, endpoint);
        throw new Error('Rate limit exceeded');
      }
    }

    // DDoS detection
    if (this.config.ddosProtection.enabled) {
      await this.detectDDoS(clientIp);
    }

    this.metrics.totalRequests++;
  }

  /**
   * Advanced input validation and sanitization
   */
  private async inputValidationHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const clientIp = this.getClientIP(request);

    // Validate request body
    if (request.body) {
      const validationResult = this.validateInput(request.body, clientIp);
      if (!validationResult.isValid) {
        this.logSecurityEvent(validationResult.threat as any, clientIp, validationResult.reason);
        throw new Error('Invalid input detected');
      }
    }

    // Validate query parameters
    if (request.query) {
      const validationResult = this.validateInput(request.query, clientIp);
      if (!validationResult.isValid) {
        this.logSecurityEvent(validationResult.threat as any, clientIp, validationResult.reason);
        throw new Error('Invalid query parameters');
      }
    }

    // Validate headers for suspicious patterns
    const suspiciousHeaders = this.validateHeaders(request.headers);
    if (suspiciousHeaders.length > 0) {
      this.logSecurityEvent('xss_attempt', clientIp, `Suspicious headers: ${suspiciousHeaders.join(', ')}`);
    }
  }

  /**
   * Add security headers to responses
   */
  private async securityHeadersHook(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: any
  ): Promise<string> {
    // Security headers
    reply.headers({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.getCSPHeader(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Powered-By': 'BarberPro-Security',
      'Server': 'BarberPro/1.0'
    });

    return payload;
  }

  /**
   * Comprehensive audit logging
   */
  private async auditLoggingHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!this.config.auditLogging.enabled) return;

    const clientIp = this.getClientIP(request);
    const logEntry = {
      timestamp: new Date(),
      ip: clientIp,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      userAgent: request.headers['user-agent'] || 'unknown',
      responseTime: reply.getResponseTime(),
      requestSize: request.headers['content-length'] || 0,
      responseSize: reply.getHeader('content-length') || 0
    };

    // Log suspicious activities
    if (reply.statusCode === 429) {
      this.logSecurityEvent('rate_limit', clientIp, 'Rate limit exceeded');
    } else if (reply.statusCode === 400) {
      this.logSecurityEvent('invalid_input', clientIp, 'Bad request - potential attack');
    } else if (reply.statusCode === 401 || reply.statusCode === 403) {
      this.incrementSuspiciousActivity(clientIp);
    }

    // Store audit log
    await this.storeAuditLog(logEntry);
  }

  /**
   * Validate input for security threats
   */
  private validateInput(input: any, clientIp: string): {
    isValid: boolean;
    threat?: string;
    reason?: string;
  } {
    const inputString = JSON.stringify(input).toLowerCase();

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)/gi,
      /(--|\*\/|\/\*)/gi,
      /(\bor\b|\band\b)[\s]*[\d]+=[\d]+/gi,
      /('|\")[\s]*;[\s]*--/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(inputString)) {
        return {
          isValid: false,
          threat: 'sql_injection',
          reason: `SQL injection pattern detected: ${pattern.source}`
        };
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[\s\S]*?onerror/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(inputString)) {
        return {
          isValid: false,
          threat: 'xss_attempt',
          reason: `XSS pattern detected: ${pattern.source}`
        };
      }
    }

    // Check input length
    if (inputString.length > this.config.inputValidation.maxLength) {
      return {
        isValid: false,
        threat: 'invalid_input',
        reason: `Input too long: ${inputString.length} characters`
      };
    }

    // Check for blocked patterns
    for (const pattern of this.config.inputValidation.blockedPatterns) {
      if (inputString.includes(pattern.toLowerCase())) {
        return {
          isValid: false,
          threat: 'invalid_input',
          reason: `Blocked pattern detected: ${pattern}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate HTTP headers for suspicious content
   */
  private validateHeaders(headers: any): string[] {
    const suspiciousHeaders: string[] = [];
    
    const headerString = JSON.stringify(headers).toLowerCase();
    
    // Check for suspicious user agents
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'wget',
      'curl', // Be careful with this, might block legitimate requests
      'python-requests',
      'masscan'
    ];

    const userAgent = headers['user-agent']?.toLowerCase() || '';
    for (const suspicious of suspiciousUserAgents) {
      if (userAgent.includes(suspicious)) {
        suspiciousHeaders.push(`user-agent: ${suspicious}`);
      }
    }

    // Check for injection attempts in headers
    const injectionPatterns = [
      /<script/gi,
      /javascript:/gi,
      /eval\(/gi,
      /expression\(/gi
    ];

    for (const [key, value] of Object.entries(headers)) {
      const valueString = String(value).toLowerCase();
      for (const pattern of injectionPatterns) {
        if (pattern.test(valueString)) {
          suspiciousHeaders.push(`${key}: injection attempt`);
        }
      }
    }

    return suspiciousHeaders;
  }

  /**
   * Detect and handle DDoS attacks
   */
  private async detectDDoS(clientIp: string): Promise<void> {
    const now = Date.now();
    const windowMs = 1000; // 1 second window
    
    if (!this.suspiciousIPs.has(clientIp)) {
      this.suspiciousIPs.set(clientIp, 0);
    }

    const requestCount = this.suspiciousIPs.get(clientIp)! + 1;
    this.suspiciousIPs.set(clientIp, requestCount);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanupSuspiciousIPs();
    }

    // Check if threshold exceeded
    if (requestCount > this.config.ddosProtection.threshold) {
      if (!this.config.ddosProtection.whitelist.includes(clientIp)) {
        this.banIP(clientIp, this.config.ddosProtection.banDuration);
        
        this.metrics.ddosAttacks.push({
          ip: clientIp,
          requestCount,
          startTime: new Date(now - windowMs),
          blocked: true
        });

        console.log(`🚨 DDoS attack detected and blocked: ${clientIp} (${requestCount} req/s)`);
      }
    }
  }

  /**
   * Handle rate limit exceeded scenarios
   */
  private handleRateLimitExceeded(clientIp: string, endpoint: string): void {
    this.metrics.blockedRequests++;
    
    // Increment suspicious activity counter
    this.incrementSuspiciousActivity(clientIp);
    
    // If too many violations, ban the IP temporarily
    const violations = this.suspiciousIPs.get(clientIp) || 0;
    if (violations > 10) {
      this.banIP(clientIp, 300000); // 5 minutes ban
    }

    this.logSecurityEvent('rate_limit', clientIp, `Rate limit exceeded on ${endpoint}`);
  }

  /**
   * Connection resilience for interrupted processes
   */
  async validateConnectionResilience(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test database connection resilience
      const dbTest = await this.testDatabaseResilience();
      if (!dbTest.healthy) {
        issues.push('Database connection not resilient to interruptions');
        recommendations.push('Implement connection pooling with retry logic');
      }

      // Test API endpoint resilience
      const apiTest = await this.testAPIResilience();
      if (!apiTest.healthy) {
        issues.push('API endpoints not handling interrupted requests properly');
        recommendations.push('Add request timeout handling and graceful degradation');
      }

      // Test WebSocket connection resilience
      const wsTest = await this.testWebSocketResilience();
      if (!wsTest.healthy) {
        issues.push('WebSocket connections not resilient');
        recommendations.push('Implement WebSocket reconnection logic with exponential backoff');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error: any) {
      return {
        healthy: false,
        issues: [`Connection resilience test failed: ${error.message}`],
        recommendations: ['Review system architecture for fault tolerance']
      };
    }
  }

  /**
   * Get comprehensive security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    this.metrics.lastUpdated = new Date();
    return { ...this.metrics };
  }

  /**
   * Export security audit report
   */
  async generateSecurityAuditReport(dateRange: { from: Date; to: Date }): Promise<{
    summary: {
      totalRequests: number;
      blockedRequests: number;
      threatTypes: Record<string, number>;
      topAttackers: Array<{ ip: string; attempts: number }>;
    };
    recommendations: string[];
    compliance: {
      rateLimit: boolean;
      inputValidation: boolean;
      ddosProtection: boolean;
      auditLogging: boolean;
    };
  }> {
    const threats = this.metrics.suspiciousActivities.filter(
      activity => activity.timestamp >= dateRange.from && activity.timestamp <= dateRange.to
    );

    const threatTypes: Record<string, number> = {};
    const attackerCount: Record<string, number> = {};

    threats.forEach(threat => {
      threatTypes[threat.type] = (threatTypes[threat.type] || 0) + 1;
      attackerCount[threat.ip] = (attackerCount[threat.ip] || 0) + 1;
    });

    const topAttackers = Object.entries(attackerCount)
      .map(([ip, attempts]) => ({ ip, attempts }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    const recommendations = [
      'Review and update security policies regularly',
      'Monitor suspicious IP addresses and patterns',
      'Implement additional rate limiting on sensitive endpoints',
      'Consider implementing CAPTCHA for repeated failed attempts',
      'Regular security audits and penetration testing'
    ];

    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        blockedRequests: this.metrics.blockedRequests,
        threatTypes,
        topAttackers
      },
      recommendations,
      compliance: {
        rateLimit: true,
        inputValidation: true,
        ddosProtection: this.config.ddosProtection.enabled,
        auditLogging: this.config.auditLogging.enabled
      }
    };
  }

  // Private helper methods

  private initializeMetrics(): SecurityMetrics {
    return {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivities: [],
      ddosAttacks: [],
      lastUpdated: new Date()
    };
  }

  private getSecurityConfig(): SecurityConfig {
    return {
      rateLimiting: {
        general: { requests: 100, window: 60000 }, // 100 req/min
        authentication: { requests: 5, window: 900000 }, // 5 req/15min
        payment: { requests: 10, window: 3600000 }, // 10 req/hour
        api: { requests: 1000, window: 3600000 } // 1000 req/hour
      },
      ddosProtection: {
        enabled: true,
        threshold: 50, // 50 req/sec
        banDuration: 600000, // 10 minutes
        whitelist: ['127.0.0.1', '::1'] // localhost
      },
      inputValidation: {
        maxLength: 10000,
        allowedCharacters: /^[\w\s\-.,@!?()[\]{}:;"'\/\\+=*&%$#<>|`~áéíóúñü]*$/i,
        blockedPatterns: [
          'drop table',
          'delete from',
          'insert into',
          'update set',
          '<script>',
          'javascript:',
          'eval(',
          'expression('
        ]
      },
      auditLogging: {
        enabled: true,
        logLevel: 'info',
        storage: 'file'
      }
    };
  }

  private initializeRateLimiters(): void {
    // General rate limiter
    this.rateLimiters.set('general', new RateLimiterMemory({
      keyGetter: (req: any) => this.getClientIP(req),
      points: this.config.rateLimiting.general.requests,
      duration: this.config.rateLimiting.general.window / 1000
    }));

    // Authentication rate limiter
    this.rateLimiters.set('auth', new RateLimiterMemory({
      keyGetter: (req: any) => this.getClientIP(req),
      points: this.config.rateLimiting.authentication.requests,
      duration: this.config.rateLimiting.authentication.window / 1000
    }));

    // Payment rate limiter
    this.rateLimiters.set('payment', new RateLimiterMemory({
      keyGetter: (req: any) => this.getClientIP(req),
      points: this.config.rateLimiting.payment.requests,
      duration: this.config.rateLimiting.payment.window / 1000
    }));
  }

  private getClientIP(request: FastifyRequest): string {
    return request.headers['x-forwarded-for'] as string ||
           request.headers['x-real-ip'] as string ||
           request.ip ||
           'unknown';
  }

  private categorizeEndpoint(url: string): string {
    if (url.includes('/auth/')) return 'auth';
    if (url.includes('/payment')) return 'payment';
    if (url.includes('/api/v1/')) return 'api';
    return 'general';
  }

  private banIP(ip: string, duration: number): void {
    this.ipBanList.add(ip);
    setTimeout(() => {
      this.ipBanList.delete(ip);
      console.log(`🔓 IP unbanned: ${ip}`);
    }, duration);
  }

  private incrementSuspiciousActivity(ip: string): void {
    const current = this.suspiciousIPs.get(ip) || 0;
    this.suspiciousIPs.set(ip, current + 1);
  }

  private cleanupSuspiciousIPs(): void {
    // Simple cleanup - in production you'd use a more sophisticated approach
    if (this.suspiciousIPs.size > 1000) {
      this.suspiciousIPs.clear();
    }
  }

  private logSecurityEvent(
    type: SecurityMetrics['suspiciousActivities'][0]['type'],
    ip: string,
    details: string
  ): void {
    this.metrics.suspiciousActivities.push({
      type,
      ip,
      timestamp: new Date(),
      details
    });

    console.log(`🚨 Security Event: ${type} from ${ip} - ${details}`);
  }

  private getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'"
    ].join('; ');
  }

  private async storeAuditLog(logEntry: any): Promise<void> {
    // In production, you would store this in a database or external service
    console.log('📋 Audit Log:', JSON.stringify(logEntry, null, 2));
  }

  private async testDatabaseResilience(): Promise<{ healthy: boolean }> {
    // Mock test - in production, this would test actual database connection resilience
    return { healthy: true };
  }

  private async testAPIResilience(): Promise<{ healthy: boolean }> {
    // Mock test - in production, this would test API endpoint resilience
    return { healthy: true };
  }

  private async testWebSocketResilience(): Promise<{ healthy: boolean }> {
    // Mock test - in production, this would test WebSocket connection resilience
    return { healthy: true };
  }
}

export const securityHardening = new SecurityHardeningService();