import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Database connection
import { database, prisma } from './services/database';

// Monitoring service
import { createMetricsMiddleware } from './services/monitoring';

// Security middleware
import { setupAllSecurityMiddleware, securityConfig } from './middleware/security';
import { setupValidationMiddleware } from './middleware/validation';

// Route imports
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import servicesRoutes from './routes/services';
import bookingsRoutes from './routes/bookings';
import searchRoutes from './routes/search';
import paymentsRoutes from './routes/payments';

// New CRUD routes
import usersCrudRoutes from './routes/users-crud';
import servicesCrudRoutes from './routes/services-crud';
import bookingsCrudRoutes from './routes/bookings-crud';
import uploadRoutes from './routes/upload';
import advancedBookingsRoutes from './routes/advanced-bookings';

// Comprehensive booking system routes
import providerScheduleRoutes from './routes/provider-schedule';
import bookingManagementRoutes from './routes/booking-management';
import paymentTestingRoutes from './routes/payment-testing';
import paymentManagementRoutes from './routes/payment-management';

// T5-001 Advanced Features Routes
import advancedFeaturesRoutes from './routes/advanced-features';

// PAY5-001 Argentina Payment Validation Routes
import argentinaPaymentValidationRoutes from './routes/argentina-payment-validation';

// B6A-001 Launch Day Monitoring and Analytics Routes (Day 6)
import launchDayMonitoringRoutes from './routes/launch-day-monitoring';

// Q6A-001 Quality Monitoring Routes for Launch Day Testing
import qualityMonitoringRoutes from './routes/quality-monitoring';

// PAY6A-001 Live Payment Monitoring and Argentina Market Optimization (Day 6)
import paymentMonitoringRoutes from './routes/payment-monitoring';

// T7A-001 Day 7 Track A Technical Lead Services (Argentina Expansion & Template Replication)
import { registerGeoLocationRoutes } from './services/geo-location';
import { registerAPIOptimizationRoutes } from './services/api-optimization';
import { registerLocalizationRoutes } from './services/argentina-localization';
import { registerTemplateReplicationRoutes } from './services/template-replication';
import { registerMultiTenantRoutes, multiTenantService } from './services/multi-tenant';
import { registerAdvancedAnalyticsRoutes } from './services/advanced-analytics';
import { registerPremiumFeaturesRoutes } from './services/premium-features';

// B7A-001 Day 7 Track A Backend Developer Services (Argentina Expansion & Psychology Vertical)
import { registerPsychologyVerticalRoutes } from './services/psychology-vertical';

// T8-001 Day 8 Technical Coordination Services (Geographic Expansion & Template Deployment)
import { registerDay8PremiumEnhancementRoutes } from './services/day8-premium-enhancement';
import { registerDay8TeamScalingRoutes } from './services/day8-team-scaling';

// B8-001 Day 8 Backend Developer Services (Argentina Expansion & Psychology Vertical Implementation)
import { registerAdvancedBookingLogicRoutes } from './services/advanced-booking-logic';
import { registerWhatsAppIntegrationRoutes } from './services/whatsapp-integration';
import { registerBackendOptimizationRoutes } from './services/backend-optimization';
import { registerB8IntegrationRoutes } from './services/b8-001-integration';

// B9-001 Day 9 Backend Developer Services (Business Logic Optimization & Integration Consolidation)
import day9BusinessOptimizationRoutes from './routes/day9-business-optimization';

// PAY9-001 Day 9 Advanced Payment Features (Enterprise Billing, Multi-Vertical, Payment Intelligence)
import day9AdvancedPaymentsRoutes from './routes/day9-advanced-payments';

// T9-001 Day 9 Technical Lead Services (Template Architecture & Premium Features)
import { registerTemplateDeploymentRoutes } from './services/template-deployment';
import { registerEnterpriseInfrastructureRoutes } from './services/enterprise-infrastructure';
import { registerDay9CoordinationRoutes } from './services/day9-coordination';

// T10-001 Day 10 Enterprise Architecture & AI-Powered Platform Enhancement
import { registerEnterpriseRoutes } from './services/enterprise-multi-tenant';
import { registerAIRoutes } from './services/ai-powered-features';
import { registerPerformanceRoutes } from './services/enterprise-performance';
import { registerEnterpriseCoordinationRoutes } from './services/enterprise-coordination';


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
  
  // Setup multi-tenant resolution middleware (T7A-001)
  server.addHook('onRequest', multiTenantService.createTenantResolutionMiddleware());

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
        { name: 'Payments', description: 'Payment processing' },
        { name: 'Upload', description: 'File upload and management' },
        { name: 'Referrals', description: 'Referral system management' },
        { name: 'Promotions', description: 'Promotion and discount management' },
        { name: 'Subscriptions', description: 'Subscription billing management' },
        { name: 'Analytics', description: 'Provider analytics and insights' },
        { name: 'Health', description: 'System health monitoring' },
        { name: 'Enterprise Business Logic', description: 'Enterprise scheduling, billing, and workflow automation' },
        { name: 'AI & Machine Learning', description: 'AI-powered recommendations, predictions, and intelligence' },
        { name: 'Partnership Integration', description: 'B2B partner integrations, webhooks, and marketplace APIs' },
        { name: 'Enterprise Performance', description: 'Database optimization, caching, and enterprise scaling' },
        { name: 'Business Intelligence', description: 'Advanced analytics and business intelligence' }
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
    } catch (error: any) {
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
  
  // Original routes (legacy)
  server.register(usersRoutes, { prefix: '/api/users' });
  server.register(servicesRoutes, { prefix: '/api/services' });
  server.register(bookingsRoutes, { prefix: '/api/bookings' });
  server.register(searchRoutes, { prefix: '/api/search' });
  server.register(paymentsRoutes, { prefix: '/api' });
  
  // New CRUD routes with validation
  server.register(usersCrudRoutes, { prefix: '/api/v1/users' });
  server.register(servicesCrudRoutes, { prefix: '/api/v1' });
  server.register(bookingsCrudRoutes, { prefix: '/api/v1/bookings' });
  
  // Upload routes
  server.register(uploadRoutes, { prefix: '/api/v1/upload' });

  // Advanced booking routes
  server.register(advancedBookingsRoutes, { prefix: '/api/v1/bookings' });

  // Provider schedule management routes
  server.register(providerScheduleRoutes, { prefix: '/api/v1/providers' });

  // Comprehensive booking management routes
  server.register(bookingManagementRoutes, { prefix: '/api/v1/bookings' });

  // Payment testing routes (only in development)
  if (process.env.NODE_ENV !== 'production') {
    server.register(paymentTestingRoutes, { prefix: '/api' });
  }

  // Enhanced payment management routes
  server.register(paymentManagementRoutes, { prefix: '/api' });

  // T5-001 Advanced Features Routes (Day 5) - Consolidated
  server.register(advancedFeaturesRoutes, { prefix: '/api/v1' });

  // PAY5-001 Argentina Payment Validation Routes (Day 5 Payment Optimization)
  server.register(argentinaPaymentValidationRoutes, { prefix: '/api' });

  // B6A-001 Launch Day Monitoring and Analytics Routes (Day 6)
  server.register(launchDayMonitoringRoutes, { prefix: '/api/v1' });

  // Q6A-001 Quality Monitoring Routes for Launch Day Testing
  server.register(qualityMonitoringRoutes, { prefix: '/' });

  // PAY6A-001 Live Payment Monitoring and Argentina Market Optimization (Day 6)
  server.register(paymentMonitoringRoutes, { prefix: '/api' });

  // T7A-001 Day 7 Track A Technical Lead Services (Argentina Expansion & Template Replication)
  registerGeoLocationRoutes(server);
  registerAPIOptimizationRoutes(server);
  registerLocalizationRoutes(server);
  registerTemplateReplicationRoutes(server);
  registerMultiTenantRoutes(server);
  registerAdvancedAnalyticsRoutes(server);
  registerPremiumFeaturesRoutes(server);

  // B7A-001 Day 7 Track A Backend Developer Services (Argentina Expansion & Psychology Vertical)
  registerPsychologyVerticalRoutes(server);

  // T8-001 Day 8 Technical Coordination Services (Geographic Expansion & Template Deployment)
  registerDay8PremiumEnhancementRoutes(server);
  registerDay8TeamScalingRoutes(server);

  // B8-001 Day 8 Backend Developer Services (Argentina Expansion & Psychology Vertical Implementation)
  registerAdvancedBookingLogicRoutes(server);
  registerWhatsAppIntegrationRoutes(server);
  registerBackendOptimizationRoutes(server);
  registerB8IntegrationRoutes(server);

  // B9-001 Day 9 Backend Developer Services (Business Logic Optimization & Integration Consolidation)
  server.register(day9BusinessOptimizationRoutes, { prefix: '/api/v1/day9' });

  // PAY9-001 Day 9 Advanced Payment Features (Enterprise Billing, Multi-Vertical, Payment Intelligence)
  server.register(day9AdvancedPaymentsRoutes, { prefix: '/api/day9-payments' });

  // T9-001 Day 9 Technical Lead Services (Template Architecture & Premium Features)
  registerTemplateDeploymentRoutes(server);
  registerEnterpriseInfrastructureRoutes(server);
  registerDay9CoordinationRoutes(server);

  // T10-001 Day 10 Enterprise Architecture & AI-Powered Platform Enhancement
  registerEnterpriseRoutes(server);
  registerAIRoutes(server);
  registerPerformanceRoutes(server);
  registerEnterpriseCoordinationRoutes(server);

  return server;
}