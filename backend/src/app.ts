import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createServer } from 'http';

// Database connection
import { database, prisma } from './services/database';

// Socket.IO service
import { initializeSocketService } from './services/socket';

// Monitoring service
import { createMetricsMiddleware } from './services/monitoring';

// Security middleware
import { setupAllSecurityMiddleware, securityConfig } from './middleware/security';
import { setupValidationMiddleware } from './middleware/validation';

// Essential route imports for login functionality
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import frontendAnalyticsRoutes from './routes/frontend-analytics';

export function buildServer(): FastifyInstance {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    // Allow error handler override to prevent warnings
    allowErrorHandlerOverride: true
  });

  // Add database to Fastify instance
  server.decorate('prisma', prisma);

  // Add metrics middleware
  server.addHook('onRequest', createMetricsMiddleware());

  // Not found handler
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Ruta ${request.method} ${request.url} no encontrada`,
      statusCode: 404
    });
  });

  // Setup comprehensive security middleware
  setupAllSecurityMiddleware(server);

  // Setup validation middleware
  setupValidationMiddleware(server);

  // Register plugins
  server.register(cors, securityConfig.cors as any);

  // Enhanced rate limiting for Argentina market
  server.register(rateLimit, securityConfig.rateLimits.global as any);

  server.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret-change-in-production'
  });

  server.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
    }
  });

  // Register authentication decorator
  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token de acceso requerido',
        statusCode: 401
      });
    }
  });

  // Swagger documentation
  server.register(swagger, {
    swagger: {
      info: {
        title: 'BarberPro API - Minimal',
        description: 'API para plataforma de reservas de barbería en Argentina (versión mínima para login)',
        version: '1.0.0',
        contact: {
          name: 'BarberPro Support',
          email: 'soporte@barberpro.com.ar'
        }
      },
      host: process.env.SWAGGER_HOST || 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT token (format: Bearer <token>)'
        }
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' }
      ]
    }
  });

  server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Register essential routes only
  server.register(healthRoutes, { prefix: '/api' });
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(usersRoutes, { prefix: '/api/users' });
  server.register(frontendAnalyticsRoutes, { prefix: '/api/analytics' });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;

    server.log.error({
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method
    });

    reply.code(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'Error interno del servidor',
      statusCode,
      timestamp: new Date().toISOString()
    });
  });

  return server;
}

// Start server function
export async function startServer(): Promise<void> {
  const fastify = buildServer();

  try {
    // Test database connection
    await database.testConnection();
    console.log('✅ Database connection established');

    // Get server configuration
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    // Listen on the server to get the HTTP server instance
    await fastify.listen({ port, host });

    // After Fastify starts, we can access the HTTP server
    const httpServer = fastify.server;

    // Initialize Socket.IO with the Fastify HTTP server
    const socketService = initializeSocketService(httpServer);
    console.log('✅ Socket.IO service initialized');

    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    console.log(`❤️  Health Check: http://${host}:${port}/api/health`);
    console.log(`🔌 WebSocket: ws://${host}:${port}/socket.io/`);

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

export default buildServer;