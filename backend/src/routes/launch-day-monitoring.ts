/**
 * Launch Day Monitoring API Routes
 * B6A-001: Real-time monitoring and analytics endpoints for launch day operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { createLaunchDayMonitoringService } from '../services/launch-day-monitoring';
import { createRealTimeAnalyticsService } from '../services/real-time-analytics';

const monitoringService = createLaunchDayMonitoringService();
const analyticsService = createRealTimeAnalyticsService();

// Schema definitions
const SessionSchema = Type.Object({
  userId: Type.String(),
  sessionId: Type.String(),
  metadata: Type.Optional(Type.Object({
    location: Type.Optional(Type.String()),
    device: Type.Optional(Type.String()),
    source: Type.Optional(Type.String()),
    referralSource: Type.Optional(Type.String()),
    timezone: Type.Optional(Type.String())
  }))
});

const UserActionSchema = Type.Object({
  sessionId: Type.String(),
  action: Type.Object({
    type: Type.Union([
      Type.Literal('click'),
      Type.Literal('scroll'),
      Type.Literal('form_fill'),
      Type.Literal('search'),
      Type.Literal('filter')
    ]),
    target: Type.String(),
    metadata: Type.Optional(Type.Any())
  })
});

const FunnelStepSchema = Type.Object({
  userId: Type.String(),
  step: Type.Union([
    Type.Literal('view_providers'),
    Type.Literal('select_service'),
    Type.Literal('choose_time'),
    Type.Literal('payment'),
    Type.Literal('confirmation')
  ]),
  metadata: Type.Optional(Type.Any())
});

const ProviderMetricsSchema = Type.Object({
  providerId: Type.String(),
  eventType: Type.Union([
    Type.Literal('booking_created'),
    Type.Literal('booking_completed'),
    Type.Literal('booking_cancelled'),
    Type.Literal('rating_received'),
    Type.Literal('response_time')
  ]),
  data: Type.Optional(Type.Any())
});

const RevenueTrackingSchema = Type.Object({
  eventType: Type.String(),
  amount: Type.Number(),
  metadata: Type.Optional(Type.Object({
    bookingId: Type.Optional(Type.String()),
    providerId: Type.Optional(Type.String()),
    paymentMethod: Type.Optional(Type.String()),
    date: Type.Optional(Type.String())
  }))
});

export default async function launchDayMonitoringRoutes(fastify: FastifyInstance) {
  // Real-time monitoring dashboard
  fastify.get('/monitoring/dashboard', {
    schema: {
      tags: ['Launch Day Monitoring'],
      summary: 'Get real-time monitoring dashboard data',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            timestamp: Type.Number(),
            apiPerformance: Type.Any(),
            dbPerformance: Type.Any(),
            paymentMetrics: Type.Any(),
            userActivity: Type.Any(),
            businessMetrics: Type.Any(),
            systemHealth: Type.Any()
          })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dashboard = await monitoringService.getRealTimeAnalytics();
      
      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      request.log.error('Error getting monitoring dashboard:', error);
      reply.code(500).send({
        success: false,
        error: 'Error obteniendo panel de monitoreo',
        details: error.message
      });
    }
  });

  // Launch day summary report
  fastify.get('/monitoring/launch-report', {
    schema: {
      tags: ['Launch Day Monitoring'],
      summary: 'Get comprehensive launch day report',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            launchDate: Type.String(),
            timeZone: Type.String(),
            summary: Type.Any(),
            analytics: Type.Any(),
            recommendations: Type.Array(Type.String()),
            systemHealth: Type.Any()
          })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const report = await monitoringService.getLaunchDayReport();
      
      reply.send({
        success: true,
        data: report
      });
    } catch (error) {
      request.log.error('Error generating launch day report:', error);
      reply.code(500).send({
        success: false,
        error: 'Error generando reporte del día de lanzamiento',
        details: error.message
      });
    }
  });

  // Analytics dashboard
  fastify.get('/analytics/dashboard', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Get real-time user behavior analytics dashboard',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            timestamp: Type.Number(),
            timezone: Type.String(),
            realTimeMetrics: Type.Any(),
            funnelAnalysis: Type.Any(),
            topProviders: Type.Any(),
            revenueInsights: Type.Any(),
            argentinaInsights: Type.Any(),
            systemHealth: Type.Any()
          })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dashboard = await analyticsService.getAnalyticsDashboard();
      
      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      request.log.error('Error getting analytics dashboard:', error);
      reply.code(500).send({
        success: false,
        error: 'Error obteniendo panel de analytics',
        details: error.message
      });
    }
  });

  // Business intelligence report
  fastify.get('/analytics/business-intelligence', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Get comprehensive business intelligence report',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            generatedAt: Type.String(),
            timezone: Type.String(),
            reportType: Type.String(),
            dashboard: Type.Any(),
            advancedAnalytics: Type.Any(),
            recommendations: Type.Array(Type.String()),
            nextActions: Type.Array(Type.String())
          })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const report = await analyticsService.getBusinessIntelligenceReport();
      
      reply.send({
        success: true,
        data: report
      });
    } catch (error) {
      request.log.error('Error generating business intelligence report:', error);
      reply.code(500).send({
        success: false,
        error: 'Error generando reporte de inteligencia de negocio',
        details: error.message
      });
    }
  });

  // Track user session
  fastify.post('/analytics/session/start', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Start user session tracking',
      body: SessionSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            sessionId: Type.String(),
            startTime: Type.Number()
          })
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { userId, sessionId, metadata = {} } = request.body;
      
      const session = await analyticsService.startUserSession(userId, sessionId, metadata);
      
      // Track in monitoring service
      await monitoringService.trackUserConversion(userId, 'registration');
      
      reply.send({
        success: true,
        data: {
          sessionId: session.sessionId,
          startTime: session.startTime
        }
      });
    } catch (error) {
      request.log.error('Error starting user session:', error);
      reply.code(500).send({
        success: false,
        error: 'Error iniciando sesión de usuario',
        details: error.message
      });
    }
  });

  // Track user action
  fastify.post('/analytics/action', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Track user action',
      body: UserActionSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { sessionId, action } = request.body;
      
      const actionData = {
        ...action,
        timestamp: Date.now()
      };
      
      await analyticsService.updateUserSession(sessionId, actionData);
      
      reply.send({
        success: true,
        message: 'Acción registrada correctamente'
      });
    } catch (error) {
      request.log.error('Error tracking user action:', error);
      reply.code(500).send({
        success: false,
        error: 'Error registrando acción de usuario',
        details: error.message
      });
    }
  });

  // Track booking funnel step
  fastify.post('/analytics/funnel', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Track booking funnel step',
      body: FunnelStepSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { userId, step, metadata = {} } = request.body;
      
      await analyticsService.trackBookingFunnelStep(userId, step, metadata);
      
      // Track specific conversions
      if (step === 'confirmation') {
        await monitoringService.trackUserConversion(userId, 'first_booking');
      }
      
      reply.send({
        success: true,
        message: 'Paso del embudo registrado correctamente'
      });
    } catch (error) {
      request.log.error('Error tracking funnel step:', error);
      reply.code(500).send({
        success: false,
        error: 'Error registrando paso del embudo',
        details: error.message
      });
    }
  });

  // Update provider metrics
  fastify.post('/analytics/provider/metrics', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Update provider performance metrics',
      body: ProviderMetricsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { providerId, eventType, data = {} } = request.body;
      
      await analyticsService.updateProviderMetrics(providerId, eventType, data);
      
      reply.send({
        success: true,
        message: 'Métricas de proveedor actualizadas correctamente'
      });
    } catch (error) {
      request.log.error('Error updating provider metrics:', error);
      reply.code(500).send({
        success: false,
        error: 'Error actualizando métricas de proveedor',
        details: error.message
      });
    }
  });

  // Track revenue
  fastify.post('/analytics/revenue', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Track revenue and payment data',
      body: RevenueTrackingSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { eventType, amount, metadata = {} } = request.body;
      
      await analyticsService.trackRevenue(eventType, amount, metadata);
      
      // Track payment webhook success
      if (eventType === 'payment_completed') {
        await monitoringService.trackPaymentWebhook(
          true, 
          metadata.paymentMethod || 'unknown', 
          amount
        );
      }
      
      reply.send({
        success: true,
        message: 'Ingresos registrados correctamente'
      });
    } catch (error) {
      request.log.error('Error tracking revenue:', error);
      reply.code(500).send({
        success: false,
        error: 'Error registrando ingresos',
        details: error.message
      });
    }
  });

  // Track Argentina-specific activity
  fastify.post('/analytics/argentina/activity', {
    schema: {
      tags: ['Real-time Analytics'],
      summary: 'Track Argentina market activity',
      body: Type.Object({
        activityType: Type.String(),
        location: Type.String(),
        metadata: Type.Optional(Type.Object({
          device: Type.Optional(Type.String()),
          referralSource: Type.Optional(Type.String()),
          timezone: Type.Optional(Type.String())
        }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { activityType, location, metadata = {} } = request.body;
      
      await analyticsService.trackArgentinaActivity(activityType, location, metadata);
      await monitoringService.trackRegionActivity(location, activityType);
      
      reply.send({
        success: true,
        message: 'Actividad de Argentina registrada correctamente'
      });
    } catch (error) {
      request.log.error('Error tracking Argentina activity:', error);
      reply.code(500).send({
        success: false,
        error: 'Error registrando actividad de Argentina',
        details: error.message
      });
    }
  });

  // Get system health metrics
  fastify.get('/monitoring/health', {
    schema: {
      tags: ['Launch Day Monitoring'],
      summary: 'Get system health metrics',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            timestamp: Type.Number(),
            status: Type.String(),
            uptime: Type.Number(),
            memory: Type.Any(),
            connections: Type.Number(),
            apiPerformance: Type.Any(),
            databaseStatus: Type.String()
          })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const analytics = await monitoringService.getRealTimeAnalytics();
      const healthData = {
        timestamp: Date.now(),
        status: 'healthy',
        uptime: analytics.systemHealth.uptime,
        memory: analytics.systemHealth.memoryUsage,
        connections: analytics.systemHealth.connections,
        apiPerformance: analytics.apiPerformance,
        databaseStatus: 'connected'
      };
      
      reply.send({
        success: true,
        data: healthData
      });
    } catch (error) {
      request.log.error('Error getting system health:', error);
      reply.code(500).send({
        success: false,
        error: 'Error obteniendo estado del sistema',
        details: error.message
      });
    }
  });

  // Get Prometheus metrics
  fastify.get('/metrics', {
    schema: {
      tags: ['Launch Day Monitoring'],
      summary: 'Get Prometheus-format metrics',
      response: {
        200: Type.String()
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const metrics = await monitoringService.getMetrics();
      
      reply
        .header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
        .send(metrics);
    } catch (error) {
      request.log.error('Error getting Prometheus metrics:', error);
      reply.code(500).send('# Error collecting metrics');
    }
  });

  // WebSocket connections monitoring
  fastify.post('/monitoring/websocket/connections', {
    schema: {
      tags: ['Launch Day Monitoring'],
      summary: 'Update WebSocket connection count',
      body: Type.Object({
        connectionCount: Type.Number()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { connectionCount } = request.body;
      
      monitoringService.updateRealTimeConnections(connectionCount);
      
      reply.send({
        success: true,
        message: 'Conexiones WebSocket actualizadas'
      });
    } catch (error) {
      request.log.error('Error updating WebSocket connections:', error);
      reply.code(500).send({
        success: false,
        error: 'Error actualizando conexiones WebSocket',
        details: error.message
      });
    }
  });

  // Payment webhook monitoring
  fastify.post('/monitoring/webhook/payment', {
    schema: {
      tags: ['Launch Day Monitoring'],
      summary: 'Track payment webhook performance',
      body: Type.Object({
        success: Type.Boolean(),
        provider: Type.String(),
        amount: Type.Optional(Type.Number()),
        processingTime: Type.Optional(Type.Number())
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const { success, provider, amount, processingTime } = request.body;
      
      await monitoringService.trackPaymentWebhook(success, provider, amount);
      
      if (processingTime) {
        await monitoringService.trackDatabaseQuery('payment_webhook', processingTime);
      }
      
      reply.send({
        success: true,
        message: 'Webhook de pago registrado correctamente'
      });
    } catch (error) {
      request.log.error('Error tracking payment webhook:', error);
      reply.code(500).send({
        success: false,
        error: 'Error registrando webhook de pago',
        details: error.message
      });
    }
  });

  // Performance monitoring middleware
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - (request.startTime || Date.now());
    await monitoringService.trackApiRequest(request, responseTime, reply.statusCode);
  });
}