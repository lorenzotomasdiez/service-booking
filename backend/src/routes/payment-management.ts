/**
 * Enhanced Payment Management Routes for BarberPro Argentina
 * Multi-gateway support with monitoring and advanced features
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import PaymentGatewayManager from '../services/payment-gateway-manager';
import PaymentMonitoringService from '../services/payment-monitoring';
import AFIPIntegrationService from '../services/afip-integration';
import { prisma } from '../services/database';
import paymentConfig from '../config/payment';

// Create service instances
let gatewayManager: PaymentGatewayManager;
let monitoringService: PaymentMonitoringService;
let afipService: AFIPIntegrationService;

// Request schemas
const GatewayHealthSchema = Type.Object({
  gateway: Type.Optional(Type.String()),
});

const MonitoringReportSchema = Type.Object({
  from: Type.Optional(Type.String({ format: 'date-time' })),
  to: Type.Optional(Type.String({ format: 'date-time' })),
  includeRecommendations: Type.Optional(Type.Boolean()),
});

const AFIPInvoiceSchema = Type.Object({
  paymentId: Type.String(),
  clientData: Type.Object({
    name: Type.String(),
    email: Type.String({ format: 'email' }),
    phone: Type.Optional(Type.String()),
    dni: Type.Optional(Type.String()),
    cuit: Type.Optional(Type.String()),
    address: Type.Optional(Type.String()),
  }),
});

const CITIReportSchema = Type.Object({
  month: Type.Number({ minimum: 1, maximum: 12 }),
  year: Type.Number({ minimum: 2020, maximum: 2030 }),
});

const CUITValidationSchema = Type.Object({
  cuit: Type.String(),
});

export default async function paymentManagementRoutes(fastify: FastifyInstance) {
  // Initialize services
  gatewayManager = new PaymentGatewayManager(prisma);
  monitoringService = new PaymentMonitoringService(prisma);
  afipService = new AFIPIntegrationService(prisma);

  // Set up monitoring event listeners
  monitoringService.on('alert', (alert) => {
    fastify.log.warn(`Payment Alert [${alert.severity}]: ${alert.message}`, alert.details);
    // In production, you would send notifications, emails, or webhook calls
  });

  monitoringService.on('health_status', (status) => {
    if (status.overall === 'unhealthy') {
      fastify.log.error('Payment system is unhealthy!', {
        successRate: status.successRate,
        responseTime: status.averageResponseTime,
        activeAlerts: status.alerts.length,
      });
    }
  });

  /**
   * Get Payment Gateway Health Status
   * GET /api/payment-management/gateway-health
   */
  fastify.get('/payment-management/gateway-health', {
    schema: {
      description: 'Get payment gateway health status and metrics',
      tags: ['payment-management', 'monitoring'],
      querystring: GatewayHealthSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gatewayHealth: Type.Array(Type.Object({
              gateway: Type.String(),
              healthy: Type.Boolean(),
              responseTime: Type.Number(),
              successRate: Type.Number(),
              lastChecked: Type.String(),
              consecutiveFailures: Type.Number(),
            })),
            gatewayMetrics: Type.Array(Type.Object({
              gateway: Type.String(),
              totalRequests: Type.Number(),
              successfulRequests: Type.Number(),
              failedRequests: Type.Number(),
              averageResponseTime: Type.Number(),
              lastRequestTime: Type.String(),
            })),
            summary: Type.Object({
              totalGateways: Type.Number(),
              healthyGateways: Type.Number(),
              unhealthyGateways: Type.Number(),
              averageResponseTime: Type.Number(),
              totalRequests: Type.Number(),
              overallSuccessRate: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Querystring: Static<typeof GatewayHealthSchema> }>, reply: FastifyReply) => {
    try {
      const gatewayHealth = gatewayManager.getGatewayHealth();
      const gatewayMetrics = gatewayManager.getGatewayMetrics();
      const summary = gatewayManager.getGatewayStatus();

      return reply.send({
        success: true,
        data: {
          gatewayHealth: gatewayHealth.map(h => ({
            ...h,
            lastChecked: h.lastChecked.toISOString(),
          })),
          gatewayMetrics: gatewayMetrics.map(m => ({
            ...m,
            lastRequestTime: m.lastRequestTime.toISOString(),
          })),
          summary,
        },
      });

    } catch (error: any) {
      fastify.log.error('Gateway health check error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Failed to get gateway health status',
        },
      });
    }
  });

  /**
   * Get Payment System Health Status
   * GET /api/payment-management/system-health
   */
  fastify.get('/payment-management/system-health', {
    schema: {
      description: 'Get overall payment system health status',
      tags: ['payment-management', 'monitoring'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            overall: Type.String(),
            successRate: Type.Number(),
            averageResponseTime: Type.Number(),
            totalTransactions: Type.Number(),
            errorRate: Type.Number(),
            gateways: Type.Record(Type.String(), Type.Object({
              status: Type.String(),
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
              gateway: Type.Optional(Type.String()),
            })),
            lastUpdated: Type.String(),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const healthStatus = await monitoringService.getHealthStatus();

      return reply.send({
        success: true,
        data: {
          ...healthStatus,
          gateways: Object.fromEntries(
            Object.entries(healthStatus.gateways).map(([key, value]) => [
              key,
              { ...value, lastTransaction: value.lastTransaction.toISOString() }
            ])
          ),
          alerts: healthStatus.alerts.map(alert => ({
            ...alert,
            timestamp: alert.timestamp.toISOString(),
          })),
          lastUpdated: healthStatus.lastUpdated.toISOString(),
        },
      });

    } catch (error: any) {
      fastify.log.error('System health check error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'SYSTEM_HEALTH_ERROR',
          message: 'Failed to get system health status',
        },
      });
    }
  });

  /**
   * Generate Payment Performance Report
   * POST /api/payment-management/performance-report
   */
  fastify.post('/payment-management/performance-report', {
    schema: {
      description: 'Generate comprehensive payment performance report',
      tags: ['payment-management', 'monitoring', 'analytics'],
      body: MonitoringReportSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            period: Type.Object({
              from: Type.String(),
              to: Type.String(),
            }),
            overview: Type.Object({
              totalTransactions: Type.Number(),
              successfulTransactions: Type.Number(),
              failedTransactions: Type.Number(),
              totalVolume: Type.Number(),
              averageResponseTime: Type.Number(),
              successRate: Type.Number(),
            }),
            gatewayBreakdown: Type.Record(Type.String(), Type.Any()),
            trends: Type.Object({
              hourly: Type.Array(Type.Any()),
              daily: Type.Array(Type.Any()),
            }),
            recommendations: Type.Array(Type.String()),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: Static<typeof MonitoringReportSchema> }>, reply: FastifyReply) => {
    try {
      const { from, to, includeRecommendations = true } = request.body;
      
      const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();

      const report = await monitoringService.generatePerformanceReport(fromDate, toDate);

      // Filter out recommendations if not requested
      if (!includeRecommendations) {
        report.recommendations = [];
      }

      return reply.send({
        success: true,
        data: {
          ...report,
          period: {
            from: report.period.from.toISOString(),
            to: report.period.to.toISOString(),
          },
        },
      });

    } catch (error: any) {
      fastify.log.error('Performance report generation error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate performance report',
        },
      });
    }
  });

  /**
   * Create Payment with Multi-Gateway Support
   * POST /api/payment-management/create-payment
   */
  fastify.post('/payment-management/create-payment', {
    schema: {
      description: 'Create payment with automatic gateway selection and failover',
      tags: ['payment-management', 'payments'],
      body: Type.Object({
        bookingId: Type.String(),
        amount: Type.Number({ minimum: 1 }),
        currency: Type.Literal('ARS'),
        paymentMethod: Type.Optional(Type.String()),
        installments: Type.Optional(Type.Number({ minimum: 1, maximum: 12 })),
        description: Type.String(),
        clientEmail: Type.String({ format: 'email' }),
        clientName: Type.String(),
        clientPhone: Type.Optional(Type.String()),
        clientDni: Type.Optional(Type.String()),
        returnUrls: Type.Object({
          success: Type.String({ format: 'uri' }),
          failure: Type.String({ format: 'uri' }),
          pending: Type.String({ format: 'uri' }),
        }),
        preferredGateway: Type.Optional(Type.Union([
          Type.Literal('mercadopago'),
          Type.Literal('todopago'),
          Type.Literal('decidir'),
          Type.Literal('payu'),
        ])),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            status: Type.String(),
            preferenceId: Type.Optional(Type.String()),
            initPoint: Type.Optional(Type.String()),
            externalReference: Type.String(),
            selectedGateway: Type.String(),
            createdAt: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply: FastifyReply) => {
    const startTime = Date.now();
    
    try {
      // Record metric start
      const metricData = {
        gateway: 'multi-gateway',
        action: 'payment_created' as const,
        success: false,
        duration: 0,
        amount: request.body.amount,
      };

      const paymentResponse = await gatewayManager.createPayment(request.body);
      
      // Record successful metric
      metricData.success = true;
      metricData.duration = Date.now() - startTime;
      metricData.gateway = (paymentResponse.gatewayData as any)?.selectedGateway || 'mercadopago';
      monitoringService.recordMetric(metricData);

      return reply.status(201).send({
        success: true,
        data: {
          id: paymentResponse.id,
          status: paymentResponse.status,
          preferenceId: paymentResponse.preferenceId,
          initPoint: paymentResponse.initPoint,
          externalReference: paymentResponse.externalReference,
          selectedGateway: metricData.gateway,
          createdAt: paymentResponse.createdAt.toISOString(),
        },
      });

    } catch (error: any) {
      // Record failed metric
      monitoringService.recordMetric({
        gateway: 'multi-gateway',
        action: 'payment_created',
        success: false,
        duration: Date.now() - startTime,
        amount: request.body.amount,
        errorCode: error.code || 'UNKNOWN_ERROR',
      });

      fastify.log.error('Multi-gateway payment creation error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: error.code || 'PAYMENT_CREATION_ERROR',
          message: error.message || 'Failed to create payment',
        },
      });
    }
  });

  /**
   * Generate AFIP Electronic Invoice
   * POST /api/payment-management/generate-invoice
   */
  fastify.post('/payment-management/generate-invoice', {
    schema: {
      description: 'Generate AFIP electronic invoice for payment',
      tags: ['payment-management', 'afip', 'invoices'],
      body: AFIPInvoiceSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            invoiceId: Type.String(),
            cae: Type.Optional(Type.String()),
            caeExpirationDate: Type.Optional(Type.String()),
            invoiceNumber: Type.Optional(Type.Number()),
            qrCode: Type.Optional(Type.String()),
            pdfUrl: Type.Optional(Type.String()),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.Object({
            code: Type.String(),
            message: Type.String(),
            errors: Type.Optional(Type.Array(Type.String())),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: Static<typeof AFIPInvoiceSchema> }>, reply: FastifyReply) => {
    try {
      const { paymentId, clientData } = request.body;

      // Validate CUIT if provided
      if (clientData.cuit) {
        const cuitValidation = afipService.validateCUIT(clientData.cuit);
        if (!cuitValidation.valid) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'INVALID_CUIT',
              message: cuitValidation.error || 'Invalid CUIT',
            },
          });
        }
      }

      const invoiceResponse = await afipService.generateElectronicInvoice(paymentId, clientData);

      if (!invoiceResponse.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVOICE_GENERATION_FAILED',
            message: 'Failed to generate electronic invoice',
            errors: invoiceResponse.errors,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          invoiceId: invoiceResponse.invoiceId,
          cae: invoiceResponse.cae,
          caeExpirationDate: invoiceResponse.caeExpirationDate?.toISOString(),
          invoiceNumber: invoiceResponse.invoiceNumber,
          qrCode: invoiceResponse.qrCode,
          pdfUrl: invoiceResponse.pdfUrl,
        },
      });

    } catch (error: any) {
      fastify.log.error('AFIP invoice generation error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INVOICE_GENERATION_ERROR',
          message: 'Internal error generating invoice',
        },
      });
    }
  });

  /**
   * Generate CITI Report for AFIP
   * POST /api/payment-management/citi-report
   */
  fastify.post('/payment-management/citi-report', {
    schema: {
      description: 'Generate CITI report for AFIP compliance',
      tags: ['payment-management', 'afip', 'compliance'],
      body: CITIReportSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            period: Type.Object({
              month: Type.Number(),
              year: Type.Number(),
            }),
            salesCount: Type.Number(),
            purchasesCount: Type.Number(),
            files: Type.Object({
              salesFile: Type.String(),
              purchasesFile: Type.String(),
              aliquotsFile: Type.String(),
            }),
            generatedAt: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: Static<typeof CITIReportSchema> }>, reply: FastifyReply) => {
    try {
      const { month, year } = request.body;

      const report = await afipService.generateCITIReport(month, year);
      const exportedFiles = afipService.exportCITIReport(report);

      return reply.send({
        success: true,
        data: {
          period: report.period,
          salesCount: report.sales.length,
          purchasesCount: report.purchases.length,
          files: exportedFiles,
          generatedAt: report.generatedAt.toISOString(),
        },
      });

    } catch (error: any) {
      fastify.log.error('CITI report generation error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'CITI_REPORT_ERROR',
          message: 'Failed to generate CITI report',
        },
      });
    }
  });

  /**
   * Validate CUIT
   * POST /api/payment-management/validate-cuit
   */
  fastify.post('/payment-management/validate-cuit', {
    schema: {
      description: 'Validate Argentina CUIT number',
      tags: ['payment-management', 'validation', 'argentina'],
      body: CUITValidationSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            valid: Type.Boolean(),
            cuit: Type.String(),
            formatted: Type.Optional(Type.String()),
            entityType: Type.Optional(Type.String()),
            error: Type.Optional(Type.String()),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: Static<typeof CUITValidationSchema> }>, reply: FastifyReply) => {
    try {
      const { cuit } = request.body;
      const validation = afipService.validateCUIT(cuit);

      const cleanCuit = cuit.replace(/\D/g, '');
      const formatted = cleanCuit.length === 11 
        ? `${cleanCuit.substring(0, 2)}-${cleanCuit.substring(2, 10)}-${cleanCuit.substring(10)}`
        : undefined;

      const entityTypeMap: Record<string, string> = {
        '20': 'Persona Física',
        '23': 'Persona Física - Monotributo',
        '24': 'Persona Física - Excenta',
        '27': 'Persona Física - Exterior',
        '30': 'Persona Jurídica',
        '33': 'Persona Jurídica - Exterior',
        '34': 'Persona Jurídica - Excenta',
      };

      const entityType = cleanCuit.length >= 2 ? entityTypeMap[cleanCuit.substring(0, 2)] : undefined;

      return reply.send({
        success: true,
        data: {
          valid: validation.valid,
          cuit: cleanCuit,
          formatted: validation.valid ? formatted : undefined,
          entityType: validation.valid ? entityType : undefined,
          error: validation.error,
        },
      });

    } catch (error: any) {
      fastify.log.error('CUIT validation error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'CUIT_VALIDATION_ERROR',
          message: 'Failed to validate CUIT',
        },
      });
    }
  });

  /**
   * Get Active Alerts
   * GET /api/payment-management/alerts
   */
  fastify.get('/payment-management/alerts', {
    schema: {
      description: 'Get active payment system alerts',
      tags: ['payment-management', 'monitoring'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            alerts: Type.Array(Type.Object({
              id: Type.String(),
              type: Type.String(),
              severity: Type.String(),
              gateway: Type.Optional(Type.String()),
              message: Type.String(),
              details: Type.Any(),
              timestamp: Type.String(),
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
      const alerts = monitoringService.getActiveAlerts();
      
      const summary = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      };

      return reply.send({
        success: true,
        data: {
          alerts: alerts.map(alert => ({
            ...alert,
            timestamp: alert.timestamp.toISOString(),
          })),
          summary,
        },
      });

    } catch (error: any) {
      fastify.log.error('Get alerts error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'GET_ALERTS_ERROR',
          message: 'Failed to get alerts',
        },
      });
    }
  });

  /**
   * Resolve Alert
   * POST /api/payment-management/alerts/:alertId/resolve
   */
  fastify.post('/payment-management/alerts/:alertId/resolve', {
    schema: {
      description: 'Resolve a payment system alert',
      tags: ['payment-management', 'monitoring'],
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
      monitoringService.resolveAlert(request.params.alertId);

      return reply.send({
        success: true,
        message: 'Alert resolved successfully',
      });

    } catch (error: any) {
      fastify.log.error('Resolve alert error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'RESOLVE_ALERT_ERROR',
          message: 'Failed to resolve alert',
        },
      });
    }
  });

  // Cleanup on server shutdown
  fastify.addHook('onClose', async () => {
    gatewayManager?.destroy();
    monitoringService?.destroy();
    console.log('🛑 Payment management services cleaned up');
  });
}