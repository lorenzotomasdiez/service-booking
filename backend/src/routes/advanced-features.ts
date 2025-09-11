/**
 * Advanced Features API Routes for BarberPro
 * Referrals, Promotions, Subscriptions, and Analytics
 */

import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { referralSystem } from '../services/referral-system';
import { promotionEngine } from '../services/promotion-engine';
import { subscriptionBilling } from '../services/subscription-billing';
import { providerAnalytics } from '../services/provider-analytics';
import { databaseHealth } from '../services/database-health';

const advancedFeaturesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  
  // ============================================================================
  // REFERRAL SYSTEM ROUTES
  // ============================================================================
  
  fastify.post('/referrals/program', {
    schema: {
      tags: ['Referrals'],
      summary: 'Create referral program',
      body: {
        type: 'object',
        required: ['providerId', 'name', 'referrerReward', 'refereeReward'],
        properties: {
          providerId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          referrerReward: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['PERCENTAGE_DISCOUNT', 'FIXED_AMOUNT', 'FREE_SERVICE', 'LOYALTY_POINTS'] },
              value: { type: 'number' },
              description: { type: 'string' }
            }
          },
          refereeReward: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['PERCENTAGE_DISCOUNT', 'FIXED_AMOUNT', 'FREE_SERVICE', 'LOYALTY_POINTS'] },
              value: { type: 'number' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const program = await referralSystem.createReferralProgram(request.body as any);
      
      reply.send({
        success: true,
        data: program,
        message: 'Programa de referidos creado exitosamente'
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/referrals/generate-link', {
    schema: {
      tags: ['Referrals'],
      summary: 'Generate referral link',
      body: {
        type: 'object',
        required: ['providerId', 'referrerId'],
        properties: {
          providerId: { type: 'string' },
          referrerId: { type: 'string' },
          customCode: { type: 'string' },
          expiresInDays: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const link = await referralSystem.generateReferralLink(request.body as any);
      
      reply.send({
        success: true,
        data: link,
        message: 'Enlace de referido generado'
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.get('/referrals/analytics/:providerId', {
    schema: {
      tags: ['Referrals'],
      summary: 'Get referral analytics',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.params as { providerId: string };
      const analytics = await referralSystem.getReferralAnalytics(providerId);
      
      reply.send({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // PROMOTION ENGINE ROUTES
  // ============================================================================

  fastify.post('/promotions/create', {
    schema: {
      tags: ['Promotions'],
      summary: 'Create promotion campaign',
      body: {
        type: 'object',
        required: ['providerId', 'name', 'rules', 'action', 'schedule'],
        properties: {
          providerId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          code: { type: 'string' },
          rules: { type: 'array' },
          action: { type: 'object' },
          schedule: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = request.body as any;
      data.schedule.startDate = new Date(data.schedule.startDate);
      data.schedule.endDate = new Date(data.schedule.endDate);
      
      const promotion = await promotionEngine.createPromotion(data);
      
      reply.send({
        success: true,
        data: promotion,
        message: 'Promoción creada exitosamente'
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/promotions/evaluate', {
    schema: {
      tags: ['Promotions'],
      summary: 'Evaluate promotions for booking',
      body: {
        type: 'object',
        required: ['providerId', 'userId', 'serviceIds', 'bookingAmount', 'bookingTime'],
        properties: {
          providerId: { type: 'string' },
          userId: { type: 'string' },
          serviceIds: { type: 'array', items: { type: 'string' } },
          bookingAmount: { type: 'number' },
          bookingTime: { type: 'string', format: 'date-time' },
          promocode: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = request.body as any;
      data.bookingTime = new Date(data.bookingTime);
      
      const evaluations = await promotionEngine.evaluatePromotions(data);
      
      reply.send({
        success: true,
        data: evaluations
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/promotions/happy-hour', {
    schema: {
      tags: ['Promotions'],
      summary: 'Create happy hour promotion',
      body: {
        type: 'object',
        required: ['providerId', 'name', 'discountPercent', 'days', 'startTime', 'endTime', 'validUntil'],
        properties: {
          providerId: { type: 'string' },
          name: { type: 'string' },
          discountPercent: { type: 'number' },
          days: { type: 'array', items: { type: 'number' } },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          validUntil: { type: 'string', format: 'date-time' },
          serviceIds: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = request.body as any;
      data.validUntil = new Date(data.validUntil);
      
      const promotion = await promotionEngine.createTimeBasedPromotion(data);
      
      reply.send({
        success: true,
        data: promotion,
        message: 'Promoción Happy Hour creada'
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.get('/promotions/analytics/:providerId', {
    schema: {
      tags: ['Promotions'],
      summary: 'Get promotion analytics',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.params as { providerId: string };
      const analytics = await promotionEngine.getPromotionAnalytics(providerId);
      
      reply.send({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // SUBSCRIPTION BILLING ROUTES
  // ============================================================================

  fastify.get('/subscriptions/plans', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Get available subscription plans'
    }
  }, async (request, reply) => {
    try {
      const plans = await subscriptionBilling.getSubscriptionPlans();
      
      reply.send({
        success: true,
        data: plans
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/subscriptions/create', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Create subscription',
      body: {
        type: 'object',
        required: ['providerId', 'planId', 'billingEmail'],
        properties: {
          providerId: { type: 'string' },
          planId: { type: 'string' },
          billingEmail: { type: 'string', format: 'email' },
          paymentMethodId: { type: 'string' },
          taxId: { type: 'string' },
          startTrial: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const subscription = await subscriptionBilling.createSubscription(request.body as any);
      
      reply.send({
        success: true,
        data: subscription,
        message: 'Suscripción creada exitosamente'
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.get('/subscriptions/provider/:providerId', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Get provider subscription',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.params as { providerId: string };
      const subscription = await subscriptionBilling.getProviderSubscription(providerId);
      
      reply.send({
        success: true,
        data: subscription
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.get('/subscriptions/usage-limits/:providerId', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Check usage limits',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.params as { providerId: string };
      const limits = await subscriptionBilling.checkUsageLimits(providerId);
      
      reply.send({
        success: true,
        data: limits
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/subscriptions/record-usage', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Record usage for billing',
      body: {
        type: 'object',
        required: ['providerId', 'metricName', 'quantity'],
        properties: {
          providerId: { type: 'string' },
          metricName: { type: 'string' },
          quantity: { type: 'number' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const usage = await subscriptionBilling.recordUsage(request.body as any);
      
      reply.send({
        success: true,
        data: usage
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // PROVIDER ANALYTICS ROUTES
  // ============================================================================

  fastify.get('/analytics/dashboard/:providerId', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get comprehensive analytics dashboard',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.params as { providerId: string };
      const query = request.query as any;
      
      const dateRange = {
        from: query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: query.to ? new Date(query.to) : new Date()
      };

      const dashboard = await providerAnalytics.getAnalyticsDashboard(providerId, dateRange);
      
      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.get('/analytics/revenue/:providerId', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get revenue analytics',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.params as { providerId: string };
      const query = request.query as any;
      
      const dateRange = {
        from: query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: query.to ? new Date(query.to) : new Date()
      };

      const revenue = await providerAnalytics.getRevenueAnalytics(providerId, dateRange);
      
      reply.send({
        success: true,
        data: revenue
      });
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.get('/analytics/export/:providerId/:format', {
    schema: {
      tags: ['Analytics'],
      summary: 'Export analytics report',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          format: { type: 'string', enum: ['json', 'csv', 'pdf'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId, format } = request.params as { providerId: string; format: 'json' | 'csv' | 'pdf' };
      const query = request.query as any;
      
      const dateRange = {
        from: query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: query.to ? new Date(query.to) : new Date()
      };

      const report = await providerAnalytics.exportAnalyticsReport(providerId, dateRange, format);
      
      reply
        .header('Content-Type', report.mimeType)
        .header('Content-Disposition', `attachment; filename="${report.filename}"`)
        .send(report.data);
    } catch (error: any) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // DATABASE HEALTH ROUTES
  // ============================================================================

  fastify.get('/health/database', {
    schema: {
      tags: ['Health'],
      summary: 'Get database health metrics'
    }
  }, async (request, reply) => {
    try {
      const metrics = await databaseHealth.performHealthCheck();
      
      reply.send({
        success: true,
        data: metrics,
        timestamp: new Date()
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  });

  fastify.get('/health/database/schema', {
    schema: {
      tags: ['Health'],
      summary: 'Validate database schema integrity'
    }
  }, async (request, reply) => {
    try {
      const validation = await databaseHealth.validateSchemaIntegrity();
      
      reply.send({
        success: true,
        data: validation
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/health/database/load-test', {
    schema: {
      tags: ['Health'],
      summary: 'Perform database load test',
      body: {
        type: 'object',
        properties: {
          concurrency: { type: 'number', default: 10 },
          duration: { type: 'number', default: 5000 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { concurrency = 10, duration = 5000 } = request.body as any;
      const results = await databaseHealth.performLoadTest(concurrency, duration);
      
      reply.send({
        success: true,
        data: results
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  fastify.post('/health/database/maintenance', {
    schema: {
      tags: ['Health'],
      summary: 'Perform database maintenance tasks'
    }
  }, async (request, reply) => {
    try {
      const results = await databaseHealth.performMaintenance();
      
      reply.send({
        success: true,
        data: results,
        message: 'Mantenimiento de base de datos completado'
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });
};

export default advancedFeaturesRoutes;