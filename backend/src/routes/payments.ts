/**
 * Payment Routes for BarberPro Argentina
 * MercadoPago Integration API endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import MercadoPagoPaymentService from '../services/payment';
import { prisma } from '../services/database';
import { 
  PaymentRequest, 
  MercadoPagoWebhook,
  PaymentError,
  PaymentValidationError,
  PaymentGatewayError,
} from '../types/payment';
import paymentConfig from '../config/payment';

// Request schemas
const CreatePaymentSchema = Type.Object({
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
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

const PaymentParamsSchema = Type.Object({
  paymentId: Type.String(),
});

const RefundRequestSchema = Type.Object({
  amount: Type.Optional(Type.Number({ minimum: 0.01 })),
  reason: Type.Optional(Type.String()),
});

const CancellationRequestSchema = Type.Object({
  bookingId: Type.String(),
  reason: Type.String({ minLength: 5, maxLength: 500 }),
  applyPenalty: Type.Optional(Type.Boolean()),
});

const CBUValidationSchema = Type.Object({
  cbu: Type.String({ minLength: 22, maxLength: 22 }),
});

const DisputeRequestSchema = Type.Object({
  paymentId: Type.String(),
  disputeType: Type.Union([Type.Literal('chargeback'), Type.Literal('refund_request'), Type.Literal('quality_complaint')]),
  details: Type.String({ minLength: 10, maxLength: 1000 }),
});

const EnhancedAnalyticsSchema = Type.Object({
  providerId: Type.Optional(Type.String()),
  from: Type.Optional(Type.String({ format: 'date' })),
  to: Type.Optional(Type.String({ format: 'date' })),
  includeArgentinaMetrics: Type.Optional(Type.Boolean()),
});

type CreatePaymentRequest = Static<typeof CreatePaymentSchema>;
type PaymentParams = Static<typeof PaymentParamsSchema>;
type RefundRequest = Static<typeof RefundRequestSchema>;
type CancellationRequest = Static<typeof CancellationRequestSchema>;
type CBUValidationRequest = Static<typeof CBUValidationSchema>;
type DisputeRequest = Static<typeof DisputeRequestSchema>;
type EnhancedAnalyticsRequest = Static<typeof EnhancedAnalyticsSchema>;

export default async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = new MercadoPagoPaymentService(prisma);

  // Validate payment configuration on startup
  try {
    // Import and validate config
    const { validatePaymentConfig } = await import('../config/payment');
    validatePaymentConfig();
  } catch (error) {
    fastify.log.error('Payment configuration validation failed:', error);
    throw error;
  }

  /**
   * Create Payment Preference
   * POST /api/payments
   */
  fastify.post<{
    Body: CreatePaymentRequest;
  }>('/payments', {
    schema: {
      description: 'Create a payment preference for MercadoPago',
      tags: ['payments'],
      body: CreatePaymentSchema,
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            status: Type.String(),
            preferenceId: Type.Optional(Type.String()),
            initPoint: Type.Optional(Type.String()),
            sandboxInitPoint: Type.Optional(Type.String()),
            externalReference: Type.String(),
            createdAt: Type.String(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.Object({
            code: Type.String(),
            message: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: CreatePaymentRequest }>, reply: FastifyReply) => {
    try {
      // Verify user owns the booking or is the provider
      const booking = await prisma.booking.findUnique({
        where: { id: request.body.bookingId },
        include: { provider: true },
      });

      if (!booking) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found',
          },
        });
      }

      // Authorization check
      const userId = (request as any).user.userId;
      if (booking.clientId !== userId && booking.provider.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to create payment for this booking',
          },
        });
      }

      // Check if payment already exists
      const existingPayment = await prisma.payment.findUnique({
        where: { bookingId: request.body.bookingId },
      });

      if (existingPayment && existingPayment.status === 'PAID') {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PAYMENT_ALREADY_EXISTS',
            message: 'Payment already completed for this booking',
          },
        });
      }

      const paymentResponse = await paymentService.createPayment(request.body);

      return reply.status(201).send({
        success: true,
        data: {
          id: paymentResponse.id,
          status: paymentResponse.status,
          preferenceId: paymentResponse.preferenceId,
          initPoint: paymentResponse.initPoint,
          sandboxInitPoint: paymentResponse.sandboxInitPoint,
          externalReference: paymentResponse.externalReference,
          createdAt: paymentResponse.createdAt.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error('Payment creation error:', error);

      if (error instanceof PaymentValidationError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      if (error instanceof PaymentGatewayError) {
        return reply.status(502).send({
          success: false,
          error: {
            code: error.code,
            message: 'Payment gateway error. Please try again.',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  });

  /**
   * Get Payment Status
   * GET /api/payments/:paymentId
   */
  fastify.get<{
    Params: PaymentParams;
  }>('/payments/:paymentId', {
    schema: {
      description: 'Get payment status and details',
      tags: ['payments'],
      params: PaymentParamsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            status: Type.String(),
            amount: Type.Number(),
            currency: Type.String(),
            paymentMethod: Type.Optional(Type.String()),
            externalId: Type.Optional(Type.String()),
            createdAt: Type.String(),
            paidAt: Type.Optional(Type.String()),
            booking: Type.Object({
              id: Type.String(),
              clientId: Type.String(),
              providerId: Type.String(),
              serviceId: Type.String(),
            }),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: PaymentParams }>, reply: FastifyReply) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: request.params.paymentId },
        include: {
          booking: {
            include: { provider: true },
          },
        },
      });

      if (!payment) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      // Authorization check
      const userId = (request as any).user.userId;
      if (payment.booking.clientId !== userId && payment.booking.provider.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to view this payment',
          },
        });
      }

      // Get latest status from MercadoPago if external ID exists
      let latestPayment = payment;
      if (payment.externalId) {
        try {
          await paymentService.getPayment(payment.id);
          // Refetch the updated payment
          latestPayment = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: { booking: true },
          }) || payment;
        } catch (error) {
          fastify.log.warn('Failed to update payment status from MercadoPago:', error);
        }
      }

      return reply.send({
        success: true,
        data: {
          id: latestPayment.id,
          status: latestPayment.status,
          amount: Number(latestPayment.amount),
          currency: latestPayment.currency,
          paymentMethod: latestPayment.paymentMethod,
          externalId: latestPayment.externalId,
          createdAt: latestPayment.createdAt.toISOString(),
          paidAt: latestPayment.paidAt?.toISOString(),
          booking: {
            id: latestPayment.booking.id,
            clientId: latestPayment.booking.clientId,
            providerId: latestPayment.booking.providerId,
            serviceId: latestPayment.booking.serviceId,
          },
        },
      });
    } catch (error) {
      fastify.log.error('Get payment error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  });

  /**
   * Process Payment Refund
   * POST /api/payments/:paymentId/refund
   */
  fastify.post<{
    Params: PaymentParams;
    Body: RefundRequest;
  }>('/payments/:paymentId/refund', {
    schema: {
      description: 'Process a payment refund',
      tags: ['payments'],
      params: PaymentParamsSchema,
      body: RefundRequestSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            status: Type.String(),
            refundAmount: Type.Number(),
            processedAt: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: PaymentParams; Body: RefundRequest }>, reply: FastifyReply) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: request.params.paymentId },
        include: {
          booking: {
            include: { provider: true },
          },
        },
      });

      if (!payment) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      // Authorization check - only provider can initiate refunds
      const userId = (request as any).user.userId;
      if (payment.booking.provider.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Only the service provider can process refunds',
          },
        });
      }

      const refundResponse = await paymentService.processRefund(
        request.params.paymentId,
        request.body.amount
      );

      return reply.send({
        success: true,
        data: {
          id: refundResponse.id,
          status: refundResponse.status,
          refundAmount: request.body.amount || Number(payment.amount),
          processedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error('Refund processing error:', error);

      if (error instanceof PaymentValidationError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process refund',
        },
      });
    }
  });

  /**
   * MercadoPago Webhook Handler
   * POST /api/payments/webhooks/mercadopago
   */
  fastify.post('/payments/webhooks/mercadopago', {
    schema: {
      description: 'Handle MercadoPago webhook notifications',
      tags: ['payments', 'webhooks'],
      body: Type.Any(),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = request.headers['x-signature'] as string;
      const payloadString = JSON.stringify(request.body);

      // Validate webhook signature
      if (paymentConfig.webhooks.signatureValidation && signature) {
        const isValidSignature = paymentService.validateWebhookSignature(payloadString, signature);
        if (!isValidSignature) {
          fastify.log.warn('Invalid webhook signature received');
          return reply.status(401).send({
            success: false,
            message: 'Invalid signature',
          });
        }
      }

      const webhook = request.body as MercadoPagoWebhook;
      fastify.log.info('Processing MercadoPago webhook:', {
        type: webhook.type,
        action: webhook.action,
        dataId: webhook.data.id,
      });

      const result = await paymentService.processWebhook(webhook);

      if (!result.success) {
        fastify.log.error('Webhook processing failed:', result.error);
        return reply.status(422).send({
          success: false,
          message: result.error || 'Webhook processing failed',
        });
      }

      return reply.send({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      fastify.log.error('Webhook processing error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  /**
   * Get Payment Methods Configuration
   * GET /api/payments/config
   */
  fastify.get('/payments/config', {
    schema: {
      description: 'Get payment methods configuration for frontend',
      tags: ['payments'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            publicKey: Type.String(),
            environment: Type.String(),
            currency: Type.String(),
            maxInstallments: Type.Number(),
            supportedMethods: Type.Array(Type.String()),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        publicKey: paymentConfig.mercadopago.publicKey,
        environment: paymentConfig.mercadopago.environment,
        currency: 'ARS',
        maxInstallments: paymentConfig.paymentMethods.installmentsMax,
        supportedMethods: [
          'credit_card',
          'debit_card',
          'bank_transfer',
          'rapipago',
          'pagofacil',
          'account_money',
          'cbu_transfer',
        ],
        argentinaSpecificMethods: {
          rapipago: {
            enabled: true,
            maxAmount: 50000,
            minAmount: 100,
            expiryHours: 72,
            networkFee: 0.015,
          },
          pagofacil: {
            enabled: true,
            maxAmount: 50000,
            minAmount: 100,
            expiryHours: 72,
            networkFee: 0.015,
          },
          cbu_transfer: {
            enabled: true,
            requiresCBUValidation: true,
            processingTimeHours: 24,
            maxAmount: 1000000,
            minAmount: 500,
          },
        },
      },
    });
  });

  /**
   * Get Payment Analytics (for providers)
   * GET /api/payments/analytics
   */
  fastify.get('/payments/analytics', {
    schema: {
      description: 'Get payment analytics for providers',
      tags: ['payments', 'analytics'],
      querystring: Type.Object({
        from: Type.Optional(Type.String({ format: 'date' })),
        to: Type.Optional(Type.String({ format: 'date' })),
        providerId: Type.Optional(Type.String()),
      }),
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{
    Querystring: {
      from?: string;
      to?: string;
      providerId?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const { from, to, providerId } = request.query;

      // Authorization check for provider analytics
      if (providerId) {
        const provider = await prisma.provider.findUnique({
          where: { id: providerId },
        });

        if (!provider || provider.userId !== userId) {
          return reply.status(403).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'You are not authorized to view this provider analytics',
            },
          });
        }
      }

      const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = to ? new Date(to) : new Date();

      const whereClause = {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
        ...(providerId && {
          booking: {
            providerId,
          },
        }),
      };

      const [
        totalPayments,
        successfulPayments,
        totalVolume,
      ] = await Promise.all([
        prisma.payment.count({ where: whereClause }),
        prisma.payment.count({ 
          where: { ...whereClause, status: 'PAID' } 
        }),
        prisma.payment.aggregate({
          where: { ...whereClause, status: 'PAID' },
          _sum: { amount: true },
        }),
      ]);

      const successRate = totalPayments > 0 ? successfulPayments / totalPayments : 0;
      const averageAmount = successfulPayments > 0 
        ? Number(totalVolume._sum.amount || 0) / successfulPayments 
        : 0;

      return reply.send({
        success: true,
        data: {
          totalTransactions: totalPayments,
          successfulTransactions: successfulPayments,
          failedTransactions: totalPayments - successfulPayments,
          successRate: Math.round(successRate * 100) / 100,
          totalVolume: Number(totalVolume._sum.amount || 0),
          averageTransactionAmount: Math.round(averageAmount * 100) / 100,
          period: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
        },
      });
    } catch (error) {
      fastify.log.error('Payment analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payment analytics',
        },
      });
    }
  });

  /**
   * Process Booking Cancellation with Payment Logic
   * POST /api/payments/cancel
   */
  fastify.post<{
    Body: CancellationRequest;
  }>('/payments/cancel', {
    schema: {
      description: 'Cancel booking with payment handling and potential refund',
      tags: ['payments', 'bookings'],
      body: CancellationRequestSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            refunded: Type.Boolean(),
            refundAmount: Type.Optional(Type.Number()),
            penaltyAmount: Type.Optional(Type.Number()),
            message: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: CancellationRequest }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const { bookingId, reason, applyPenalty = false } = request.body;

      // Verify user has permission to cancel this booking
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { provider: true },
      });

      if (!booking) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found',
          },
        });
      }

      // Authorization check - client or provider can cancel
      if (booking.clientId !== userId && booking.provider.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to cancel this booking',
          },
        });
      }

      const result = await paymentService.processCancellation(
        bookingId,
        userId,
        reason,
        applyPenalty
      );

      let message = 'Booking cancelled successfully';
      if (result.refunded) {
        message += ` with refund of ARS ${result.refundAmount}`;
        if (result.penaltyAmount) {
          message += ` (penalty: ARS ${result.penaltyAmount})`;
        }
      }

      return reply.send({
        success: true,
        data: {
          refunded: result.refunded,
          refundAmount: result.refundAmount,
          penaltyAmount: result.penaltyAmount,
          message,
        },
      });
    } catch (error) {
      fastify.log.error('Cancellation processing error:', error);

      if (error instanceof PaymentValidationError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process cancellation',
        },
      });
    }
  });

  /**
   * Get Payment Status Tracking
   * GET /api/payments/:paymentId/status
   */
  fastify.get<{
    Params: PaymentParams;
  }>('/payments/:paymentId/status', {
    schema: {
      description: 'Get detailed payment status tracking information',
      tags: ['payments'],
      params: PaymentParamsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            currentStatus: Type.String(),
            statusHistory: Type.Array(Type.Object({
              status: Type.String(),
              timestamp: Type.String(),
              externalStatus: Type.Optional(Type.String()),
            })),
            lastUpdated: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: PaymentParams }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const { paymentId } = request.params;

      // Verify user has access to this payment
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: { provider: true },
          },
        },
      });

      if (!payment) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      // Authorization check
      if (payment.booking.clientId !== userId && payment.booking.provider.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to view this payment status',
          },
        });
      }

      const statusInfo = await paymentService.trackPaymentStatus(paymentId);

      return reply.send({
        success: true,
        data: {
          currentStatus: statusInfo.currentStatus,
          statusHistory: statusInfo.statusHistory.map(entry => ({
            status: entry.status,
            timestamp: entry.timestamp.toISOString(),
            externalStatus: entry.externalStatus,
          })),
          lastUpdated: statusInfo.lastUpdated.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error('Payment status tracking error:', error);

      if (error instanceof PaymentValidationError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payment status',
        },
      });
    }
  });

  /**
   * Retry Failed Payment
   * POST /api/payments/:paymentId/retry
   */
  fastify.post<{
    Params: PaymentParams;
  }>('/payments/:paymentId/retry', {
    schema: {
      description: 'Retry a failed payment',
      tags: ['payments'],
      params: PaymentParamsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            status: Type.String(),
            preferenceId: Type.Optional(Type.String()),
            initPoint: Type.Optional(Type.String()),
            retryAttempt: Type.Number(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: PaymentParams }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const { paymentId } = request.params;

      // Get the failed payment
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              provider: true,
              service: true,
            },
          },
        },
      });

      if (!payment) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      // Authorization check
      if (payment.booking.clientId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to retry this payment',
          },
        });
      }

      // Check if payment is in a retriable state
      if (payment.status === 'PAID') {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PAYMENT_ALREADY_PAID',
            message: 'Payment has already been completed',
          },
        });
      }

      if (payment.status !== 'FAILED' && payment.status !== 'REJECTED') {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PAYMENT_NOT_RETRIABLE',
            message: 'Payment is not in a retriable state',
          },
        });
      }

      // Create new payment request from existing payment data
      const metadata = payment.metadata as any;
      const retryRequest: PaymentRequest = {
        bookingId: payment.bookingId,
        amount: Number(payment.amount),
        currency: payment.currency as 'ARS',
        description: payment.description || `Retry payment for booking ${payment.bookingId}`,
        clientEmail: metadata?.clientInfo?.email || '',
        clientName: metadata?.clientInfo?.name || '',
        clientPhone: metadata?.clientInfo?.phone,
        clientDni: metadata?.clientInfo?.dni,
        returnUrls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },
        metadata: {
          ...metadata,
          retryOf: paymentId,
          retryAttempt: (metadata?.retryAttempt || 0) + 1,
        },
      };

      // Mark old payment as cancelled
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'CANCELLED' },
      });

      // Create new payment
      const newPayment = await paymentService.createPayment(retryRequest);

      return reply.send({
        success: true,
        data: {
          id: newPayment.id,
          status: newPayment.status,
          preferenceId: newPayment.preferenceId,
          initPoint: newPayment.initPoint,
          retryAttempt: retryRequest.metadata?.retryAttempt || 1,
        },
      });
    } catch (error) {
      fastify.log.error('Payment retry error:', error);

      if (error instanceof PaymentValidationError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retry payment',
        },
      });
    }
  });

  /**
   * Validate CBU (Argentina Bank Account)
   * POST /api/payments/validate-cbu
   */
  fastify.post<{
    Body: CBUValidationRequest;
  }>('/payments/validate-cbu', {
    schema: {
      description: 'Validate CBU (Clave Bancaria Uniforme) for Argentina bank transfers',
      tags: ['payments', 'argentina'],
      body: CBUValidationSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            valid: Type.Boolean(),
            bankName: Type.Optional(Type.String()),
            bankCode: Type.String(),
            accountNumber: Type.String(),
            formattedCBU: Type.Optional(Type.String()),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.Object({
            code: Type.String(),
            message: Type.String(),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: CBUValidationRequest }>, reply: FastifyReply) => {
    try {
      const validation = await paymentService.validateCBU(request.body.cbu);

      return reply.send({
        success: true,
        data: {
          valid: validation.valid,
          bankName: validation.bankName,
          bankCode: validation.bankCode,
          accountNumber: validation.accountNumber,
          formattedCBU: validation.formattedCBU,
          ...(validation.error && { error: validation.error }),
        },
      });
    } catch (error) {
      fastify.log.error('CBU validation error:', error);
      return reply.status(400).send({
        success: false,
        error: {
          code: 'CBU_VALIDATION_ERROR',
          message: 'Failed to validate CBU',
        },
      });
    }
  });

  /**
   * Process Payment Hold
   * POST /api/payments/:paymentId/hold
   */
  fastify.post<{
    Params: PaymentParams;
  }>('/payments/:paymentId/hold', {
    schema: {
      description: 'Process payment hold for provider payout',
      tags: ['payments', 'payout'],
      params: PaymentParamsSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            paymentId: Type.String(),
            status: Type.String(),
            holdAmount: Type.Number(),
            releaseDate: Type.String(),
            daysRemaining: Type.Number(),
            commission: Type.Number(),
            taxes: Type.Number(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: PaymentParams }>, reply: FastifyReply) => {
    try {
      const holdStatus = await paymentService.processPaymentHold(request.params.paymentId);

      return reply.send({
        success: true,
        data: {
          paymentId: holdStatus.paymentId,
          status: holdStatus.status,
          holdAmount: holdStatus.holdAmount,
          releaseDate: holdStatus.releaseDate.toISOString(),
          daysRemaining: holdStatus.daysRemaining,
          commission: holdStatus.commission,
          taxes: holdStatus.taxes,
        },
      });
    } catch (error) {
      fastify.log.error('Payment hold processing error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'HOLD_PROCESSING_ERROR',
          message: 'Failed to process payment hold',
        },
      });
    }
  });

  /**
   * Get Provider Payout Schedule
   * GET /api/payments/provider/:providerId/payout-schedule
   */
  fastify.get<{
    Params: { providerId: string };
  }>('/payments/provider/:providerId/payout-schedule', {
    schema: {
      description: 'Get provider payout schedule and pending amounts',
      tags: ['payments', 'payout'],
      params: Type.Object({
        providerId: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            providerId: Type.String(),
            pendingAmount: Type.Number(),
            readyForPayout: Type.Number(),
            totalEarnings: Type.Number(),
            nextPayoutDate: Type.String(),
            payoutFrequency: Type.String(),
            minimumPayoutAmount: Type.Number(),
            currency: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { providerId: string } }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.userId;
      const { providerId } = request.params;

      // Verify provider ownership
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
      });

      if (!provider || provider.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to view this payout schedule',
          },
        });
      }

      const schedule = await paymentService.getProviderPayoutSchedule(providerId);

      return reply.send({
        success: true,
        data: {
          providerId: schedule.providerId,
          pendingAmount: schedule.pendingAmount,
          readyForPayout: schedule.readyForPayout,
          totalEarnings: schedule.totalEarnings,
          nextPayoutDate: schedule.nextPayoutDate.toISOString(),
          payoutFrequency: schedule.payoutFrequency,
          minimumPayoutAmount: schedule.minimumPayoutAmount,
          currency: schedule.currency,
        },
      });
    } catch (error) {
      fastify.log.error('Provider payout schedule error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'PAYOUT_SCHEDULE_ERROR',
          message: 'Failed to get provider payout schedule',
        },
      });
    }
  });

  /**
   * Process Payment Dispute
   * POST /api/payments/dispute
   */
  fastify.post<{
    Body: DisputeRequest;
  }>('/payments/dispute', {
    schema: {
      description: 'Create a payment dispute or chargeback claim',
      tags: ['payments', 'dispute'],
      body: DisputeRequestSchema,
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            disputeId: Type.String(),
            paymentId: Type.String(),
            status: Type.String(),
            disputeType: Type.String(),
            amount: Type.Number(),
            createdAt: Type.String(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: DisputeRequest }>, reply: FastifyReply) => {
    try {
      const { paymentId, disputeType, details } = request.body;

      const dispute = await paymentService.processPaymentDispute(
        paymentId,
        disputeType,
        details
      );

      return reply.status(201).send({
        success: true,
        data: {
          disputeId: dispute.id,
          paymentId: dispute.paymentId,
          status: dispute.status,
          disputeType: dispute.disputeType,
          amount: dispute.amount,
          createdAt: dispute.createdAt.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error('Payment dispute processing error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'DISPUTE_PROCESSING_ERROR',
          message: 'Failed to process payment dispute',
        },
      });
    }
  });

  /**
   * Enhanced Payment Analytics (Argentina-specific)
   * GET /api/payments/analytics/enhanced
   */
  fastify.get('/payments/analytics/enhanced', {
    schema: {
      description: 'Get enhanced payment analytics with Argentina-specific metrics',
      tags: ['payments', 'analytics', 'argentina'],
      querystring: EnhancedAnalyticsSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{
    Querystring: EnhancedAnalyticsRequest;
  }>, reply: FastifyReply) => {
    try {
      const { providerId, from, to, includeArgentinaMetrics = true } = request.query;
      
      const dateRange = {
        from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
      };

      const analytics = await paymentService.getEnhancedPaymentAnalytics(
        providerId,
        dateRange
      );

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error('Enhanced analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to fetch enhanced payment analytics',
        },
      });
    }
  });

  /**
   * Get Argentina Payment Methods Configuration
   * GET /api/payments/config/argentina
   */
  fastify.get('/payments/config/argentina', {
    schema: {
      description: 'Get Argentina-specific payment methods configuration',
      tags: ['payments', 'config', 'argentina'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            mercadopago: Type.Object({
              enabled: Type.Boolean(),
              maxInstallments: Type.Number(),
              installmentsSupported: Type.Boolean(),
            }),
            rapipago: Type.Object({
              enabled: Type.Boolean(),
              maxAmount: Type.Number(),
              minAmount: Type.Number(),
              expiryHours: Type.Number(),
              networkFee: Type.Number(),
            }),
            pagofacil: Type.Object({
              enabled: Type.Boolean(),
              maxAmount: Type.Number(),
              minAmount: Type.Number(),
              expiryHours: Type.Number(),
              networkFee: Type.Number(),
            }),
            cbu_transfer: Type.Object({
              enabled: Type.Boolean(),
              requiresCBUValidation: Type.Boolean(),
              processingTimeHours: Type.Number(),
              maxAmount: Type.Number(),
              minAmount: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        mercadopago: {
          enabled: true,
          maxInstallments: paymentConfig.paymentMethods.installmentsMax,
          installmentsSupported: true,
        },
        rapipago: {
          enabled: true,
          maxAmount: 50000,
          minAmount: 100,
          expiryHours: 72,
          networkFee: 0.015,
        },
        pagofacil: {
          enabled: true,
          maxAmount: 50000,
          minAmount: 100,
          expiryHours: 72,
          networkFee: 0.015,
        },
        cbu_transfer: {
          enabled: true,
          requiresCBUValidation: true,
          processingTimeHours: 24,
          maxAmount: 1000000,
          minAmount: 500,
        },
      },
    });
  });
}