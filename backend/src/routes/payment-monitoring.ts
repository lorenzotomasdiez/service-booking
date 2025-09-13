/**
 * Payment Monitoring Routes for BarberPro Argentina
 * Day 6: Live monitoring, performance optimization, and Argentina market analysis
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import PaymentMonitoringService from '../services/payment-monitoring';
import { prisma } from '../services/database';
import paymentConfig from '../config/payment';

// Initialize monitoring service
const monitoringService = new PaymentMonitoringService(prisma);

// Request schemas
const DateRangeSchema = Type.Object({
  from: Type.Optional(Type.String({ format: 'date-time' })),
  to: Type.Optional(Type.String({ format: 'date-time' })),
});

const MetricRecordSchema = Type.Object({
  gateway: Type.String(),
  action: Type.Union([
    Type.Literal('payment_created'),
    Type.Literal('payment_processed'),
    Type.Literal('payment_failed'),
    Type.Literal('webhook_received'),
  ]),
  success: Type.Boolean(),
  duration: Type.Number({ minimum: 0 }),
  amount: Type.Optional(Type.Number({ minimum: 0 })),
  errorCode: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

type DateRangeRequest = Static<typeof DateRangeSchema>;
type MetricRecordRequest = Static<typeof MetricRecordSchema>;

export default async function paymentMonitoringRoutes(fastify: FastifyInstance) {
  
  /**
   * Get live payment system health status
   * GET /api/payment-monitoring/health
   */
  fastify.get('/payment-monitoring/health', {
    schema: {
      description: 'Get current payment system health status',
      tags: ['monitoring', 'health'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            overall: Type.Union([Type.Literal('healthy'), Type.Literal('degraded'), Type.Literal('unhealthy')]),
            successRate: Type.Number(),
            averageResponseTime: Type.Number(),
            totalTransactions: Type.Number(),
            errorRate: Type.Number(),
            gateways: Type.Record(Type.String(), Type.Object({
              status: Type.Union([Type.Literal('healthy'), Type.Literal('degraded'), Type.Literal('unhealthy')]),
              successRate: Type.Number(),
              responseTime: Type.Number(),
              lastTransaction: Type.String(),
            })),
            alerts: Type.Array(Type.Object({
              id: Type.String(),
              type: Type.String(),
              severity: Type.String(),
              message: Type.String(),
              timestamp: Type.String(),
            })),
            lastUpdated: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user has admin privileges for monitoring
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin access required for payment monitoring',
          },
        });
      }

      const healthStatus = await monitoringService.getHealthStatus();

      return reply.send({
        success: true,
        data: {
          overall: healthStatus.overall,
          successRate: healthStatus.successRate,
          averageResponseTime: healthStatus.averageResponseTime,
          totalTransactions: healthStatus.totalTransactions,
          errorRate: healthStatus.errorRate,
          gateways: Object.fromEntries(
            Object.entries(healthStatus.gateways).map(([gateway, data]) => [
              gateway,
              {
                status: data.status,
                successRate: data.successRate,
                responseTime: data.responseTime,
                lastTransaction: data.lastTransaction.toISOString(),
              },
            ])
          ),
          alerts: healthStatus.alerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
          })),
          lastUpdated: healthStatus.lastUpdated.toISOString(),
        },
      });
    } catch (error: any) {
      fastify.log.error('Health status error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to get health status',
        },
      });
    }
  });

  /**
   * Get live payment metrics (Day 6)
   * GET /api/payment-monitoring/live
   */
  fastify.get('/payment-monitoring/live', {
    schema: {
      description: 'Get live payment processing metrics for Day 6',
      tags: ['monitoring', 'live', 'day6'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            realTimeMetrics: Type.Object({
              successRate: Type.Number(),
              avgProcessingTime: Type.Number(),
              totalTransactions: Type.Number(),
              mercadopagoWebhookHealth: Type.Object({
                successfulWebhooks: Type.Number(),
                failedWebhooks: Type.Number(),
                avgWebhookProcessingTime: Type.Number(),
                webhookSuccessRate: Type.Number(),
              }),
              commissionAccuracy: Type.Object({
                correctCalculations: Type.Number(),
                totalCalculations: Type.Number(),
                accuracyRate: Type.Number(),
                avgCommissionAmount: Type.Number(),
              }),
              refundDispute: Type.Object({
                totalRefunds: Type.Number(),
                avgRefundTime: Type.Number(),
                totalDisputes: Type.Number(),
                disputeResolutionRate: Type.Number(),
              }),
            }),
            regionAnalysis: Type.Record(Type.String(), Type.Object({
              transactionCount: Type.Number(),
              volume: Type.Number(),
              preferredMethods: Type.Array(Type.String()),
              successRate: Type.Number(),
            })),
            alerts: Type.Array(Type.Object({
              type: Type.String(),
              message: Type.String(),
              timestamp: Type.String(),
              metric: Type.String(),
              currentValue: Type.Number(),
              threshold: Type.Number(),
            })),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const liveMetrics = await monitoringService.collectLiveMetrics();

      return reply.send({
        success: true,
        data: {
          realTimeMetrics: liveMetrics.realTimeMetrics,
          regionAnalysis: liveMetrics.regionAnalysis,
          alerts: liveMetrics.alerts.map(alert => ({
            type: alert.type,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
            metric: alert.metric,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
          })),
        },
      });
    } catch (error: any) {
      fastify.log.error('Live metrics error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'LIVE_MONITORING_ERROR', message: 'Failed to get live metrics' },
      });
    }
  });

  /**
   * Get Argentina market analysis (Day 6)
   * GET /api/payment-monitoring/argentina-market
   */
  fastify.get<{ Querystring: DateRangeRequest }>('/payment-monitoring/argentina-market', {
    schema: {
      description: 'Analyze Argentina payment market behavior and insights',
      tags: ['monitoring', 'argentina', 'market', 'day6'],
      querystring: DateRangeSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            paymentMethodAdoption: Type.Array(Type.Object({
              method: Type.String(),
              usagePercentage: Type.Number(),
              growthRate: Type.Number(),
              avgTransactionAmount: Type.Number(),
              userPreference: Type.Union([Type.Literal('growing'), Type.Literal('stable'), Type.Literal('declining')]),
            })),
            currencyHandling: Type.Object({
              pesoVolumeGrowth: Type.Number(),
              exchangeRateImpact: Type.Number(),
              inflationAdjustment: Type.Number(),
              avgTransactionInPesos: Type.Number(),
            }),
            installmentAnalysis: Type.Object({
              optionUsage: Type.Array(Type.Object({
                installments: Type.Number(),
                usage: Type.Number(),
                avgAmount: Type.Number(),
                successRate: Type.Number(),
              })),
              totalInstallmentVolume: Type.Number(),
              avgInstallmentsPerTransaction: Type.Number(),
              installmentPreferenceByAmount: Type.Object({
                low: Type.Number(),
                medium: Type.Number(),
                high: Type.Number(),
              }),
            }),
            userSegmentAnalysis: Type.Object({
              firstTimeUsers: Type.Object({
                count: Type.Number(),
                preferredMethods: Type.Array(Type.String()),
                avgTransactionAmount: Type.Number(),
                conversionRate: Type.Number(),
              }),
              returningUsers: Type.Object({
                count: Type.Number(),
                preferredMethods: Type.Array(Type.String()),
                avgTransactionAmount: Type.Number(),
                loyaltyScore: Type.Number(),
              }),
              premiumUsers: Type.Object({
                count: Type.Number(),
                preferredMethods: Type.Array(Type.String()),
                avgTransactionAmount: Type.Number(),
                retentionRate: Type.Number(),
              }),
            }),
            businessIntelligence: Type.Object({
              peakHours: Type.Array(Type.Number()),
              seasonalTrends: Type.Record(Type.String(), Type.Number()),
              provincialPreferences: Type.Record(Type.String(), Type.Array(Type.String())),
              competitorAnalysis: Type.Object({
                marketShare: Type.Number(),
                differentiators: Type.Array(Type.String()),
                opportunities: Type.Array(Type.String()),
              }),
            }),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: DateRangeRequest }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const { from, to } = request.query;
      const dateRange = {
        from: from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      };

      const marketInsights = await monitoringService.analyzeArgentinaMarketLive(dateRange);

      return reply.send({
        success: true,
        data: marketInsights,
      });
    } catch (error: any) {
      fastify.log.error('Argentina market analysis error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'MARKET_ANALYSIS_ERROR', message: 'Failed to analyze Argentina market' },
      });
    }
  });

  /**
   * Get payment optimization recommendations (Day 6)
   * GET /api/payment-monitoring/optimization-recommendations
   */
  fastify.get<{ Querystring: DateRangeRequest }>('/payment-monitoring/optimization-recommendations', {
    schema: {
      description: 'Get comprehensive payment optimization recommendations for Day 6',
      tags: ['monitoring', 'optimization', 'recommendations', 'day6'],
      querystring: DateRangeSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: DateRangeRequest }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const { from, to } = request.query;
      const dateRange = {
        from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      };

      const currentMetrics = await monitoringService.collectLiveMetrics();
      const marketInsights = await monitoringService.analyzeArgentinaMarketLive(dateRange);
      const recommendations = await monitoringService.generateOptimizationRecommendations(
        currentMetrics,
        marketInsights
      );

      return reply.send({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      fastify.log.error('Optimization recommendations error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'OPTIMIZATION_ERROR', message: 'Failed to generate recommendations' },
      });
    }
  });

  /**
   * Export comprehensive Day 6 monitoring report
   * GET /api/payment-monitoring/day6-report
   */
  fastify.get<{ Querystring: DateRangeRequest }>('/payment-monitoring/day6-report', {
    schema: {
      description: 'Export comprehensive Day 6 payment monitoring and optimization report',
      tags: ['monitoring', 'report', 'day6', 'export'],
      querystring: DateRangeSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: DateRangeRequest }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const { from, to } = request.query;
      const dateRange = {
        from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      };

      console.log('🚀 Generating Day 6 comprehensive monitoring report...');
      const report = await monitoringService.exportDay6MonitoringReport(dateRange);

      // Log report generation for tracking
      fastify.log.info(`Day 6 payment monitoring report generated for user ${userId}`, {
        userId,
        dateRange,
        launchStatus: report.launchReadiness.status,
        executiveSummary: report.executiveSummary,
      });

      return reply.send({
        success: true,
        data: report,
        metadata: {
          generatedBy: userId,
          reportType: 'day6-comprehensive-monitoring',
          dateRange,
        },
      });
    } catch (error: any) {
      fastify.log.error('Day 6 report generation error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'REPORT_GENERATION_ERROR', message: 'Failed to generate Day 6 report' },
      });
    }
  });

  /**
   * Record a payment metric
   * POST /api/payment-monitoring/metrics
   */
  fastify.post<{ Body: MetricRecordRequest }>('/payment-monitoring/metrics', {
    schema: {
      description: 'Record a payment processing metric',
      tags: ['monitoring', 'metrics'],
      body: MetricRecordSchema,
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: MetricRecordRequest }>, reply: FastifyReply) => {
    try {
      monitoringService.recordMetric(request.body);

      return reply.status(201).send({
        success: true,
        message: 'Metric recorded successfully',
      });
    } catch (error: any) {
      fastify.log.error('Metric recording error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'METRIC_RECORDING_ERROR', message: 'Failed to record metric' },
      });
    }
  });

  /**
   * Get payment performance report
   * GET /api/payment-monitoring/performance-report
   */
  fastify.get<{ Querystring: DateRangeRequest }>('/payment-monitoring/performance-report', {
    schema: {
      description: 'Generate detailed payment performance report',
      tags: ['monitoring', 'performance', 'report'],
      querystring: DateRangeSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: DateRangeRequest }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const { from, to } = request.query;
      const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();

      const report = await monitoringService.generatePerformanceReport(fromDate, toDate);

      return reply.send({
        success: true,
        data: report,
      });
    } catch (error: any) {
      fastify.log.error('Performance report error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'PERFORMANCE_REPORT_ERROR', message: 'Failed to generate performance report' },
      });
    }
  });

  /**
   * Get active alerts
   * GET /api/payment-monitoring/alerts
   */
  fastify.get('/payment-monitoring/alerts', {
    schema: {
      description: 'Get active payment monitoring alerts',
      tags: ['monitoring', 'alerts'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            alerts: Type.Array(Type.Object({
              id: Type.String(),
              type: Type.String(),
              severity: Type.String(),
              message: Type.String(),
              timestamp: Type.String(),
              resolved: Type.Boolean(),
            })),
            summary: Type.Object({
              total: Type.Number(),
              critical: Type.Number(),
              high: Type.Number(),
              medium: Type.Number(),
              low: Type.Number(),
            }),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const activeAlerts = monitoringService.getActiveAlerts();

      const summary = {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length,
      };

      return reply.send({
        success: true,
        data: {
          alerts: activeAlerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
            resolved: alert.resolved,
          })),
          summary,
        },
      });
    } catch (error: any) {
      fastify.log.error('Alerts retrieval error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'ALERTS_ERROR', message: 'Failed to get alerts' },
      });
    }
  });

  /**
   * Resolve an alert
   * PATCH /api/payment-monitoring/alerts/:alertId/resolve
   */
  fastify.patch<{ Params: { alertId: string } }>('/payment-monitoring/alerts/:alertId/resolve', {
    schema: {
      description: 'Resolve a payment monitoring alert',
      tags: ['monitoring', 'alerts'],
      params: Type.Object({
        alertId: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { alertId: string } }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' },
        });
      }

      const { alertId } = request.params;
      monitoringService.resolveAlert(alertId);

      fastify.log.info(`Alert ${alertId} resolved by user ${userId}`);

      return reply.send({
        success: true,
        message: 'Alert resolved successfully',
      });
    } catch (error: any) {
      fastify.log.error('Alert resolution error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'ALERT_RESOLUTION_ERROR', message: 'Failed to resolve alert' },
      });
    }
  });

  /**
   * Get current live metrics snapshot (lightweight)
   * GET /api/payment-monitoring/live-snapshot
   */
  fastify.get('/payment-monitoring/live-snapshot', {
    schema: {
      description: 'Get lightweight snapshot of current live payment metrics',
      tags: ['monitoring', 'live', 'snapshot'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            timestamp: Type.String(),
            successRate: Type.Number(),
            totalTransactions: Type.Number(),
            avgProcessingTime: Type.Number(),
            activeAlerts: Type.Number(),
            systemHealth: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || (user.role !== 'ADMIN' && user.role !== 'PROVIDER')) {
        return reply.status(403).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin or Provider access required' },
        });
      }

      const currentMetrics = monitoringService.getCurrentLiveMetrics();
      
      if (!currentMetrics) {
        return reply.status(204).send({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            successRate: 0,
            totalTransactions: 0,
            avgProcessingTime: 0,
            activeAlerts: 0,
            systemHealth: 'unknown',
          },
        });
      }

      const criticalAlerts = currentMetrics.alerts.filter(alert => alert.type === 'critical').length;
      const systemHealth = criticalAlerts > 0 ? 'critical' : 
                          currentMetrics.realTimeMetrics.successRate < 95 ? 'warning' : 'healthy';

      return reply.send({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          successRate: currentMetrics.realTimeMetrics.successRate,
          totalTransactions: currentMetrics.realTimeMetrics.totalTransactions,
          avgProcessingTime: currentMetrics.realTimeMetrics.avgProcessingTime,
          activeAlerts: currentMetrics.alerts.length,
          systemHealth,
        },
      });
    } catch (error: any) {
      fastify.log.error('Live snapshot error:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'SNAPSHOT_ERROR', message: 'Failed to get live snapshot' },
      });
    }
  });

  // Hook to record payment metrics automatically
  fastify.addHook('onResponse', async (request, reply) => {
    // Record metrics for payment-related endpoints
    if (request.url.includes('/api/payments') && request.method === 'POST') {
      const duration = reply.getResponseTime();
      const success = reply.statusCode >= 200 && reply.statusCode < 300;
      
      monitoringService.recordMetric({
        gateway: 'mercadopago', // Default gateway
        action: 'payment_created',
        success,
        duration,
        errorCode: success ? undefined : `HTTP_${reply.statusCode}`,
      });
    }
  });

  console.log('🚀 Day 6 Payment Monitoring Routes initialized with live Argentina market analysis');
}