import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Database connection
import { database, prisma } from './services/database';

// Route imports
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';

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
    }
  });

  // Add database to Fastify instance
  server.decorate('prisma', prisma);

  // Global error handler
  server.setErrorHandler(async (error, request, reply) => {
    const { log } = request;
    
    // Log the error
    log.error(error);

    // Handle Prisma errors
    if (error.code && error.code.startsWith('P')) {
      if (error.code === 'P2002') {
        reply.code(409).send({
          error: 'Conflict',
          message: 'Recurso ya existe',
          statusCode: 409
        });
        return;
      }
      
      if (error.code === 'P2025') {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Recurso no encontrado',
          statusCode: 404
        });
        return;
      }
    }

    // Handle JWT errors
    if (error.message.includes('jwt')) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token inválido',
        statusCode: 401
      });
      return;
    }

    // Handle validation errors
    if (error.validation) {
      reply.code(400).send({
        error: 'Validation Error',
        message: 'Datos de entrada inválidos',
        validation: error.validation,
        statusCode: 400
      });
      return;
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
        statusCode: 429
      });
      return;
    }

    // Generic server error
    reply.code(error.statusCode || 500).send({
      error: error.statusCode >= 400 && error.statusCode < 500 ? 'Client Error' : 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor' 
        : error.message,
      statusCode: error.statusCode || 500
    });
  });

  // Not found handler
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Ruta ${request.method} ${request.url} no encontrada`,
      statusCode: 404
    });
  });

  // Register plugins
  server.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGIN?.split(',') || ['https://barberpro.com.ar'] 
      : true,
    credentials: true
  });

  // Rate limiting for Argentina market
  server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    errorResponseBuilder: (request, context) => {
      return {
        error: 'Too Many Requests',
        message: `Demasiadas solicitudes. Límite: ${context.max} por ${Math.floor(context.timeWindow / 1000 / 60)} minutos.`,
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      };
    }
  });

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
        title: 'BarberPro API',
        description: 'API para plataforma de reservas de barbería en Argentina',
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
        { name: 'Auth', description: 'Authentication and authorization' },
        { name: 'Users', description: 'User management' },
        { name: 'Providers', description: 'Service provider management' },
        { name: 'Services', description: 'Service management' },
        { name: 'Bookings', description: 'Booking management' },
        { name: 'Payments', description: 'Payment processing' }
      ]
    }
  });

  server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() }
    }
  });

  // Database connection hook
  server.addHook('onReady', async () => {
    try {
      await database.connect();
    } catch (error) {
      server.log.error('Failed to connect to database:', error);
      throw error;
    }
  });

  // Graceful shutdown
  server.addHook('onClose', async () => {
    await database.disconnect();
  });

  // Health check hook
  server.addHook('preHandler', async (request, reply) => {
    // Add Argentina timezone header
    reply.header('X-Timezone', 'America/Argentina/Buenos_Aires');
    reply.header('X-Locale', 'es-AR');
  });

  // Register routes
  server.register(healthRoutes, { prefix: '/api' });
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(usersRoutes, { prefix: '/api/users' });

  return server;
}