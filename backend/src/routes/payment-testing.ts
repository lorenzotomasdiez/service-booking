/**
 * Payment Testing Routes for BarberPro Argentina
 * Comprehensive testing endpoints for payment system validation
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import PaymentTestingService from '../services/payment-testing';
import { prisma } from '../services/database';

export default async function paymentTestingRoutes(fastify: FastifyInstance) {
  const testingService = new PaymentTestingService(prisma);

  // Only enable testing routes in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  /**
   * Run Complete Payment Test Suite
   * POST /api/payment-testing/run-suite
   */
  fastify.post('/payment-testing/run-suite', {
    schema: {
      description: 'Run comprehensive payment system test suite',
      tags: ['testing', 'payments'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            suiteName: Type.String(),
            totalTests: Type.Number(),
            passedTests: Type.Number(),
            failedTests: Type.Number(),
            totalDuration: Type.Number(),
            successRate: Type.Number(),
            results: Type.Array(Type.Object({
              testName: Type.String(),
              success: Type.Boolean(),
              duration: Type.Number(),
              details: Type.Any(),
              errors: Type.Optional(Type.Array(Type.String())),
            })),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const testSuite = await testingService.runPaymentTestSuite();

      const successRate = testSuite.totalTests > 0 
        ? (testSuite.passedTests / testSuite.totalTests) * 100 
        : 0;

      return reply.send({
        success: true,
        data: {
          ...testSuite,
          successRate: Math.round(successRate * 100) / 100,
        },
      });
    } catch (error: any) {
      fastify.log.error('Payment test suite error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'TEST_SUITE_ERROR',
          message: 'Failed to run payment test suite',
          details: error.message,
        },
      });
    }
  });

  /**
   * Test Argentina Payment Methods Configuration
   * GET /api/payment-testing/argentina-methods
   */
  fastify.get('/payment-testing/argentina-methods', {
    schema: {
      description: 'Test Argentina-specific payment methods configuration',
      tags: ['testing', 'payments', 'argentina'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            mercadopago: Type.Object({
              enabled: Type.Boolean(),
              maxInstallments: Type.Number(),
              supportedMethods: Type.Array(Type.String()),
            }),
            rapipago: Type.Object({
              enabled: Type.Boolean(),
              maxAmount: Type.Number(),
              minAmount: Type.Number(),
              expiryHours: Type.Number(),
            }),
            pagofacil: Type.Object({
              enabled: Type.Boolean(),
              maxAmount: Type.Number(),
              minAmount: Type.Number(),
              expiryHours: Type.Number(),
            }),
            bankTransfer: Type.Object({
              enabled: Type.Boolean(),
              requiresCBUValidation: Type.Boolean(),
              processingTimeHours: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get payment service instance to test configuration
      const MercadoPagoPaymentService = await import('../services/payment');
      const paymentService = new MercadoPagoPaymentService.default(prisma);
      const argentinaConfig = (paymentService as any).argentinaPaymentMethods;

      return reply.send({
        success: true,
        data: argentinaConfig,
      });
    } catch (error: any) {
      fastify.log.error('Argentina payment methods test error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'ARGENTINA_METHODS_TEST_ERROR',
          message: 'Failed to test Argentina payment methods',
          details: error.message,
        },
      });
    }
  });

  /**
   * Test CBU Validation
   * POST /api/payment-testing/cbu-validation
   */
  fastify.post('/payment-testing/cbu-validation', {
    schema: {
      description: 'Test CBU validation with various test cases',
      tags: ['testing', 'payments', 'cbu'],
      body: Type.Object({
        testCBUs: Type.Optional(Type.Array(Type.String())),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            testResults: Type.Array(Type.Object({
              cbu: Type.String(),
              valid: Type.Boolean(),
              bankName: Type.Optional(Type.String()),
              error: Type.Optional(Type.String()),
            })),
            summary: Type.Object({
              totalTests: Type.Number(),
              validCBUs: Type.Number(),
              invalidCBUs: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Body: { testCBUs?: string[] };
  }>, reply: FastifyReply) => {
    try {
      const MercadoPagoPaymentService = await import('../services/payment');
      const paymentService = new MercadoPagoPaymentService.default(prisma);

      // Default test CBUs if none provided
      const testCBUs = request.body.testCBUs || [
        // Valid CBUs
        '01101100030000001234567', // Banco Nación
        '00700000030000001234567', // Banco Galicia
        '01400000030000001234567', // Banco Provincia Buenos Aires
        // Invalid CBUs
        '0110110003000000123456',  // Too short
        '011011000300000012345678', // Too long
        '01101100030000001234560',  // Wrong check digit
      ];

      const testResults = [];
      let validCount = 0;
      let invalidCount = 0;

      for (const cbu of testCBUs) {
        try {
          const result = await paymentService.validateCBU(cbu);
          testResults.push({
            cbu,
            valid: result.valid,
            bankName: result.bankName,
            error: result.error,
          });

          if (result.valid) {
            validCount++;
          } else {
            invalidCount++;
          }
        } catch (error: any) {
          testResults.push({
            cbu,
            valid: false,
            error: error.message,
          });
          invalidCount++;
        }
      }

      return reply.send({
        success: true,
        data: {
          testResults,
          summary: {
            totalTests: testCBUs.length,
            validCBUs: validCount,
            invalidCBUs: invalidCount,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error('CBU validation test error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'CBU_VALIDATION_TEST_ERROR',
          message: 'Failed to test CBU validation',
          details: error.message,
        },
      });
    }
  });

  /**
   * Test Commission Calculation
   * POST /api/payment-testing/commission-calculation
   */
  fastify.post('/payment-testing/commission-calculation', {
    schema: {
      description: 'Test commission calculation for different amounts and tiers',
      tags: ['testing', 'payments', 'commission'],
      body: Type.Object({
        testAmounts: Type.Optional(Type.Array(Type.Number())),
        createTestProvider: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            testResults: Type.Array(Type.Object({
              amount: Type.Number(),
              commission: Type.Object({
                baseAmount: Type.Number(),
                commissionRate: Type.Number(),
                commissionAmount: Type.Number(),
                providerAmount: Type.Number(),
                taxAmount: Type.Optional(Type.Number()),
                netProviderAmount: Type.Number(),
              }),
            })),
            configuration: Type.Object({
              standardRate: Type.Number(),
              highVolumeRate: Type.Number(),
              premiumRate: Type.Number(),
              taxRate: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Body: { testAmounts?: number[]; createTestProvider?: boolean };
  }>, reply: FastifyReply) => {
    try {
      const MercadoPagoPaymentService = await import('../services/payment');
      const paymentService = new MercadoPagoPaymentService.default(prisma);
      const paymentConfig = await import('../config/payment');

      // Create test provider if needed
      let testProviderId: string;
      let shouldCleanup = false;

      if (request.body.createTestProvider) {
        const testUser = await prisma.user.create({
          data: {
            email: `test-commission-${Date.now()}@example.com`,
            name: 'Test Commission User',
            hashedPassword: 'test',
            role: 'PROVIDER',
            isVerified: true,
          },
        });

        const testProvider = await prisma.provider.create({
          data: {
            userId: testUser.id,
            businessName: 'Test Commission Barbershop',
            phone: '+541141234567',
            address: 'Test Address',
            city: 'Buenos Aires',
            province: 'Buenos Aires',
            postalCode: '1000',
            isVerified: true,
            subscriptionTier: 'BASIC',
          },
        });

        testProviderId = testProvider.id;
        shouldCleanup = true;
      } else {
        // Find any existing provider
        const existingProvider = await prisma.provider.findFirst();
        if (!existingProvider) {
          throw new Error('No provider found for commission testing');
        }
        testProviderId = existingProvider.id;
      }

      const testAmounts = request.body.testAmounts || [1000, 5000, 10000, 25000, 50000];
      const testResults = [];

      for (const amount of testAmounts) {
        try {
          const commission = await paymentService.calculateCommission(amount, testProviderId);
          testResults.push({
            amount,
            commission,
          });
        } catch (error: any) {
          fastify.log.error(`Commission calculation error for amount ${amount}:`, error);
        }
      }

      // Cleanup test provider if created
      if (shouldCleanup) {
        const provider = await prisma.provider.findUnique({
          where: { id: testProviderId },
        });
        
        if (provider) {
          await prisma.provider.delete({
            where: { id: testProviderId },
          });
          
          await prisma.user.delete({
            where: { id: provider.userId },
          });
        }
      }

      return reply.send({
        success: true,
        data: {
          testResults,
          configuration: {
            standardRate: paymentConfig.default.business.commissionStandard,
            highVolumeRate: paymentConfig.default.business.commissionHighVolume,
            premiumRate: paymentConfig.default.business.commissionPremium,
            taxRate: paymentConfig.default.tax.ivaRate,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error('Commission calculation test error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'COMMISSION_TEST_ERROR',
          message: 'Failed to test commission calculation',
          details: error.message,
        },
      });
    }
  });

  /**
   * Test Payment Flow End-to-End
   * POST /api/payment-testing/end-to-end
   */
  fastify.post('/payment-testing/end-to-end', {
    schema: {
      description: 'Test complete payment flow from creation to completion',
      tags: ['testing', 'payments', 'e2e'],
      body: Type.Object({
        amount: Type.Optional(Type.Number({ minimum: 100 })),
        currency: Type.Optional(Type.Literal('ARS')),
        installments: Type.Optional(Type.Number({ minimum: 1, maximum: 12 })),
        paymentMethod: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            testSteps: Type.Array(Type.Object({
              step: Type.String(),
              success: Type.Boolean(),
              duration: Type.Number(),
              details: Type.Any(),
              error: Type.Optional(Type.String()),
            })),
            overall: Type.Object({
              success: Type.Boolean(),
              totalDuration: Type.Number(),
              stepsCompleted: Type.Number(),
              stepsFailed: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Body: {
      amount?: number;
      currency?: 'ARS';
      installments?: number;
      paymentMethod?: string;
    };
  }>, reply: FastifyReply) => {
    const startTime = Date.now();
    const testSteps = [];
    let stepsCompleted = 0;
    let stepsFailed = 0;

    try {
      const MercadoPagoPaymentService = await import('../services/payment');
      const paymentService = new MercadoPagoPaymentService.default(prisma);

      const {
        amount = 5000,
        currency = 'ARS',
        installments = 1,
        paymentMethod = 'credit_card',
      } = request.body;

      // Step 1: Create test user and provider
      let stepStart = Date.now();
      let testUser, testProvider, testService, testBooking;

      try {
        testUser = await prisma.user.create({
          data: {
            email: `e2e-test-${Date.now()}@example.com`,
            name: 'E2E Test User',
            hashedPassword: 'test',
            role: 'CLIENT',
            isVerified: true,
          },
        });

        const providerUser = await prisma.user.create({
          data: {
            email: `e2e-provider-${Date.now()}@example.com`,
            name: 'E2E Test Provider',
            hashedPassword: 'test',
            role: 'PROVIDER',
            isVerified: true,
          },
        });

        testProvider = await prisma.provider.create({
          data: {
            userId: providerUser.id,
            businessName: 'E2E Test Barbershop',
            phone: '+541141234567',
            address: 'Test Address',
            city: 'Buenos Aires',
            province: 'Buenos Aires',
            postalCode: '1000',
            isVerified: true,
            subscriptionTier: 'BASIC',
          },
        });

        testService = await prisma.service.create({
          data: {
            name: 'E2E Test Service',
            description: 'Test service for e2e testing',
            price: amount,
            duration: 60,
            category: 'HAIRCUT',
            providerId: testProvider.id,
            isActive: true,
          },
        });

        testBooking = await prisma.booking.create({
          data: {
            clientId: testUser.id,
            providerId: testProvider.id,
            serviceId: testService.id,
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
            status: 'CONFIRMED',
            paymentStatus: 'PENDING',
          },
        });

        testSteps.push({
          step: 'Create Test Data',
          success: true,
          duration: Date.now() - stepStart,
          details: {
            userId: testUser.id,
            providerId: testProvider.id,
            bookingId: testBooking.id,
          },
        });
        stepsCompleted++;
      } catch (error: any) {
        testSteps.push({
          step: 'Create Test Data',
          success: false,
          duration: Date.now() - stepStart,
          details: {},
          error: error.message,
        });
        stepsFailed++;
        throw error;
      }

      // Step 2: Create Payment Request
      stepStart = Date.now();
      let paymentResponse;

      try {
        const paymentRequest = {
          bookingId: testBooking.id,
          amount,
          currency,
          paymentMethod,
          installments,
          description: `E2E Test Payment - ${amount} ARS`,
          clientEmail: testUser.email,
          clientName: testUser.name,
          clientPhone: '+541141234567',
          returnUrls: {
            success: 'https://barberpro.com.ar/payment/success',
            failure: 'https://barberpro.com.ar/payment/failure',
            pending: 'https://barberpro.com.ar/payment/pending',
          },
          metadata: {
            test: true,
            e2e: true,
          },
        };

        paymentResponse = await paymentService.createPayment(paymentRequest);

        testSteps.push({
          step: 'Create Payment',
          success: true,
          duration: Date.now() - stepStart,
          details: {
            paymentId: paymentResponse.id,
            status: paymentResponse.status,
            hasInitPoint: !!paymentResponse.initPoint,
          },
        });
        stepsCompleted++;
      } catch (error: any) {
        testSteps.push({
          step: 'Create Payment',
          success: false,
          duration: Date.now() - stepStart,
          details: {},
          error: error.message,
        });
        stepsFailed++;
        throw error;
      }

      // Step 3: Test Commission Calculation
      stepStart = Date.now();

      try {
        const commission = await paymentService.calculateCommission(amount, testProvider.id);

        testSteps.push({
          step: 'Calculate Commission',
          success: true,
          duration: Date.now() - stepStart,
          details: {
            baseAmount: commission.baseAmount,
            commissionAmount: commission.commissionAmount,
            providerAmount: commission.providerAmount,
            commissionRate: commission.commissionRate,
          },
        });
        stepsCompleted++;
      } catch (error: any) {
        testSteps.push({
          step: 'Calculate Commission',
          success: false,
          duration: Date.now() - stepStart,
          details: {},
          error: error.message,
        });
        stepsFailed++;
      }

      // Step 4: Test Payment Hold Processing
      stepStart = Date.now();

      try {
        // First, simulate payment being paid
        await prisma.payment.update({
          where: { id: paymentResponse.id },
          data: { 
            status: 'PAID',
            paidAt: new Date(),
          },
        });

        const holdStatus = await paymentService.processPaymentHold(paymentResponse.id);

        testSteps.push({
          step: 'Process Payment Hold',
          success: true,
          duration: Date.now() - stepStart,
          details: {
            holdStatus: holdStatus.status,
            holdAmount: holdStatus.holdAmount,
            daysRemaining: holdStatus.daysRemaining,
          },
        });
        stepsCompleted++;
      } catch (error: any) {
        testSteps.push({
          step: 'Process Payment Hold',
          success: false,
          duration: Date.now() - stepStart,
          details: {},
          error: error.message,
        });
        stepsFailed++;
      }

      // Cleanup
      stepStart = Date.now();
      try {
        await prisma.payment.deleteMany({
          where: { bookingId: testBooking.id },
        });
        
        await prisma.booking.delete({
          where: { id: testBooking.id },
        });
        
        await prisma.service.delete({
          where: { id: testService.id },
        });
        
        await prisma.provider.delete({
          where: { id: testProvider.id },
        });
        
        const providerUser = await prisma.user.findFirst({
          where: { id: testProvider.userId },
        });
        
        if (providerUser) {
          await prisma.user.delete({
            where: { id: providerUser.id },
          });
        }
        
        await prisma.user.delete({
          where: { id: testUser.id },
        });

        testSteps.push({
          step: 'Cleanup Test Data',
          success: true,
          duration: Date.now() - stepStart,
          details: { cleaned: true },
        });
        stepsCompleted++;
      } catch (error: any) {
        testSteps.push({
          step: 'Cleanup Test Data',
          success: false,
          duration: Date.now() - stepStart,
          details: {},
          error: error.message,
        });
        stepsFailed++;
      }

      const totalDuration = Date.now() - startTime;
      const overallSuccess = stepsFailed === 0;

      return reply.send({
        success: true,
        data: {
          testSteps,
          overall: {
            success: overallSuccess,
            totalDuration,
            stepsCompleted,
            stepsFailed,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error('End-to-end payment test error:', error);
      return reply.status(500).send({
        success: false,
        data: {
          testSteps,
          overall: {
            success: false,
            totalDuration: Date.now() - startTime,
            stepsCompleted,
            stepsFailed: stepsFailed + 1,
          },
        },
        error: {
          code: 'E2E_TEST_ERROR',
          message: 'End-to-end payment test failed',
          details: error.message,
        },
      });
    }
  });
}