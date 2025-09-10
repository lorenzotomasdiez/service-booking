import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Route imports
import healthRoutes from './routes/health';

export function buildServer(): FastifyInstance {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    }
  });

  // Register plugins
  server.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://barberpro.com.ar'] 
      : true,
    credentials: true
  });

  server.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret-change-in-production'
  });

  server.register(multipart);

  // Swagger documentation
  server.register(swagger, {
    swagger: {
      info: {
        title: 'BarberPro API',
        description: 'API para plataforma de reservas de barbería',
        version: '1.0.0'
      },
      host: 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Services', description: 'Service management endpoints' },
        { name: 'Bookings', description: 'Booking management endpoints' }
      ]
    }
  });

  server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });

  // Register routes
  server.register(healthRoutes, { prefix: '/api' });

  return server;
}