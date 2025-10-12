/**
 * CORS Middleware Configuration for BarberPro Argentina
 * Supports both local development and Docker container networking
 */

import { FastifyRequest } from 'fastify';

export interface CorsOptions {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

/**
 * CORS configuration that supports:
 * - Production domains
 * - Local development (localhost)
 * - Docker service names (frontend, backend)
 * - Docker container IPs (172.x.x.x range)
 */
export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins: (string | RegExp)[] = [
      // Production domains
      'https://barberpro.com.ar',
      'https://www.barberpro.com.ar',
      'https://app.barberpro.com.ar',
      'https://admin.barberpro.com.ar'
    ];

    // Development and Docker origins
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push(
        // Local development
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',

        // Docker service names for container-to-container communication
        'http://frontend:5173',
        'http://backend:3000',

        // Docker container IP ranges (172.x.x.x is the default Docker bridge network)
        /^http:\/\/172\.[\d]+\.[\d]+\.[\d]+:5173$/,
        /^http:\/\/172\.[\d]+\.[\d]+\.[\d]+:3000$/,

        // Support for other common Docker network ranges
        /^http:\/\/10\.[\d]+\.[\d]+\.[\d]+:5173$/,
        /^http:\/\/10\.[\d]+\.[\d]+\.[\d]+:3000$/
      );
    }

    // Parse additional origins from environment variable
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }

    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: process.env.CORS_CREDENTIALS !== 'false',

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],

  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Timezone',
    'X-Locale',
    'X-Country'
  ]
};

export default corsOptions;
