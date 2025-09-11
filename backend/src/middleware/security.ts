import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Security configuration for Argentina market
export const securityConfig = {
  // Rate limiting configurations
  rateLimits: {
    global: {
      max: 200,
      timeWindow: '15 minutes',
      errorResponseBuilder: (request: FastifyRequest, context: any) => ({
        error: 'Too Many Requests',
        message: `Demasiadas solicitudes. Límite: ${context.max} por ${Math.floor(context.timeWindow / 1000 / 60)} minutos.`,
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      })
    },
    auth: {
      max: 10,
      timeWindow: '15 minutes',
      keyGenerator: (request: FastifyRequest) => {
        return request.ip + ':auth';
      },
      errorResponseBuilder: (request: FastifyRequest, context: any) => ({
        error: 'Authentication Rate Limit',
        message: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.',
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      })
    },
    booking: {
      max: 50,
      timeWindow: '1 hour',
      keyGenerator: (request: FastifyRequest) => {
        return request.ip + ':booking';
      },
      errorResponseBuilder: (request: FastifyRequest, context: any) => ({
        error: 'Booking Rate Limit',
        message: 'Demasiadas reservas. Límite: 50 por hora.',
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      })
    },
    payments: {
      max: 20,
      timeWindow: '1 hour',
      keyGenerator: (request: FastifyRequest) => {
        return request.ip + ':payment';
      },
      errorResponseBuilder: (request: FastifyRequest, context: any) => ({
        error: 'Payment Rate Limit',
        message: 'Demasiados intentos de pago. Contacte soporte si necesita ayuda.',
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      })
    }
  },

  // CORS configuration for Argentina domains
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        'https://barberpro.com.ar',
        'https://www.barberpro.com.ar',
        'https://app.barberpro.com.ar',
        'https://admin.barberpro.com.ar'
      ];

      // Allow development origins in non-production
      if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.push(
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173'
        );
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Timezone',
      'X-Locale'
    ]
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
  },

  // Content Security Policy for Argentina compliance
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Only for inline scripts, remove in production
        'https://js.mercadopago.com',
        'https://secure.mlstatic.com',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'https://secure.mlstatic.com',
        'https://www.google-analytics.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.mercadopago.com',
        'https://api.mercadolibre.com',
        'https://www.google-analytics.com',
        'wss:', // For WebSocket connections
      ],
      'frame-src': [
        'https://www.mercadopago.com.ar',
        'https://secure.mlstatic.com'
      ],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'form-action': [
        "'self'",
        'https://www.mercadopago.com.ar'
      ],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"]
    }
  }
};

// IP Whitelist for Argentina (optional for admin access)
export const argentineIPRanges = [
  // Major Argentina ISP ranges (examples - should be updated with real ranges)
  '200.49.0.0/16',     // Telecom Argentina
  '181.88.0.0/16',     // Fibertel
  '190.210.0.0/16',    // Arnet
  '200.32.0.0/16',     // Speedy
];

// Security middleware functions
export function setupSecurityHeaders(server: FastifyInstance): void {
  server.addHook('onSend', async (request, reply, payload) => {
    // Add security headers
    Object.entries(securityConfig.headers).forEach(([header, value]) => {
      reply.header(header, value);
    });

    // Add HSTS for HTTPS
    if (request.protocol === 'https') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Add CSP header
    const cspValue = Object.entries(securityConfig.csp.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    reply.header('Content-Security-Policy', cspValue);

    return payload;
  });
}

// DDoS protection middleware
export function setupDDoSProtection(server: FastifyInstance): void {
  // Track request patterns for basic DDoS detection
  const requestPatterns = new Map<string, { count: number; lastReset: number }>();
  
  server.addHook('onRequest', async (request, reply) => {
    const clientIP = request.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequestsPerWindow = 300; // Maximum requests per minute per IP
    
    const pattern = requestPatterns.get(clientIP) || { count: 0, lastReset: now };
    
    // Reset counter if window has passed
    if (now - pattern.lastReset > windowMs) {
      pattern.count = 0;
      pattern.lastReset = now;
    }
    
    pattern.count++;
    requestPatterns.set(clientIP, pattern);
    
    // Block if too many requests
    if (pattern.count > maxRequestsPerWindow) {
      reply.code(429).send({
        error: 'DDoS Protection',
        message: 'Demasiadas solicitudes desde su IP. Contacte soporte si esto es un error.',
        statusCode: 429
      });
      return;
    }
  });
}

// SQL Injection protection (additional to Prisma's built-in protection)
export function setupSQLInjectionProtection(server: FastifyInstance): void {
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION(?:\s+ALL)?\s+SELECT/i,
    /SELECT.*FROM.*WHERE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /UPDATE.*SET/i,
    /DROP\s+TABLE/i,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i
  ];

  server.addHook('preValidation', async (request, reply) => {
    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return sqlInjectionPatterns.some(pattern => pattern.test(value));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    // Check query parameters
    if (request.query && checkValue(request.query)) {
      reply.code(400).send({
        error: 'Invalid Input',
        message: 'Entrada sospechosa detectada. Solicitud bloqueada por seguridad.',
        statusCode: 400
      });
      return;
    }

    // Check body parameters
    if (request.body && checkValue(request.body)) {
      reply.code(400).send({
        error: 'Invalid Input',
        message: 'Entrada sospechosa detectada. Solicitud bloqueada por seguridad.',
        statusCode: 400
      });
      return;
    }
  });
}

// Input sanitization middleware
export function setupInputSanitization(server: FastifyInstance): void {
  server.addHook('preValidation', async (request, reply) => {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // Remove potential XSS vectors
        return value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized: any = Array.isArray(value) ? [] : {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };

    // Sanitize query parameters
    if (request.query) {
      request.query = sanitizeValue(request.query);
    }

    // Sanitize body (be careful not to break file uploads)
    if (request.body && request.headers['content-type']?.includes('application/json')) {
      request.body = sanitizeValue(request.body);
    }
  });
}

// Argentina-specific security measures
export function setupArgentinaCompliance(server: FastifyInstance): void {
  server.addHook('onRequest', async (request, reply) => {
    // Add Argentina-specific headers
    reply.header('X-Timezone', 'America/Argentina/Buenos_Aires');
    reply.header('X-Locale', 'es-AR');
    reply.header('X-Country', 'AR');
    
    // Log request for Argentina compliance (GDPR-like requirements)
    if (process.env.NODE_ENV === 'production') {
      server.log.info({
        ip: request.ip,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
        country: 'AR'
      }, 'Request logged for compliance');
    }
  });
}

// Setup all security middleware
export function setupAllSecurityMiddleware(server: FastifyInstance): void {
  setupSecurityHeaders(server);
  setupDDoSProtection(server);
  setupSQLInjectionProtection(server);
  setupInputSanitization(server);
  setupArgentinaCompliance(server);
}