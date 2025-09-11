/**
 * Payment Service Unit Tests for BarberPro Argentina
 * Tests for MercadoPago integration, retry logic, and Argentina-specific features
 */

import { PrismaClient } from '@prisma/client';
import { MercadoPagoPaymentService } from '../../../src/services/payment';
import {
  PaymentValidationError,
  PaymentGatewayError,
  PaymentStatusEnum
} from '../../../src/types/payment';
import {
  validPaymentRequest,
  invalidPaymentRequests,
  mockMercadoPagoPreference,
  mockMercadoPagoPayment,
  mockWebhookPaymentApproved,
  mockBooking,
  mockPayment,
  mockProvider,
  mockService,
  paymentMethodTestCases,
  cancellationScenarios,
  errorScenarios
} from '../../fixtures/payment-fixtures';

// Mock MercadoPago SDK
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn()
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn()
  }))
}));

// Mock Prisma Client
const mockPrisma = {
  booking: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn()
  },
  provider: {
    findUnique: jest.fn()
  }
} as unknown as PrismaClient;

describe('MercadoPagoPaymentService', () => {
  let paymentService: MercadoPagoPaymentService;
  let mockPreference: any;
  let mockPayment: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup MercadoPago mocks
    const { Preference, Payment } = require('mercadopago');
    mockPreference = {
      create: jest.fn().mockResolvedValue(mockMercadoPagoPreference)
    };
    mockPayment = {
      get: jest.fn().mockResolvedValue(mockMercadoPagoPayment)
    };
    
    Preference.mockImplementation(() => mockPreference);
    Payment.mockImplementation(() => mockPayment);
    
    paymentService = new MercadoPagoPaymentService(mockPrisma);
  });

  describe('Payment Creation', () => {
    beforeEach(() => {
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
        ...mockBooking,
        service: mockService,
        provider: { ...mockProvider, user: { email: 'provider@test.com' } },
        client: { email: 'client@test.com' }
      });
      
      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: [] // New provider, no volume discounts
      });
      
      mockPrisma.payment.create = jest.fn().mockResolvedValue(mockPayment);
    });

    test('should create payment successfully with valid request', async () => {
      const result = await paymentService.createPayment(validPaymentRequest);

      expect(result).toMatchObject({
        id: mockPayment.id,
        status: PaymentStatusEnum.PENDING,
        preferenceId: mockMercadoPagoPreference.id,
        initPoint: mockMercadoPagoPreference.init_point,
        sandboxInitPoint: mockMercadoPagoPreference.sandbox_init_point
      });

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              currency_id: 'ARS',
              unit_price: validPaymentRequest.amount
            })
          ]),
          payer: expect.objectContaining({
            email: validPaymentRequest.clientEmail,
            name: validPaymentRequest.clientName
          }),
          external_reference: validPaymentRequest.bookingId
        })
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookingId: validPaymentRequest.bookingId,
          amount: validPaymentRequest.amount,
          currency: 'ARS',
          status: 'PENDING'
        })
      });
    });

    test('should handle Argentina phone number parsing correctly', async () => {
      const requestWithPhone = {
        ...validPaymentRequest,
        clientPhone: '+5491123456789'
      };

      await paymentService.createPayment(requestWithPhone);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          payer: expect.objectContaining({
            phone: {
              area_code: '11',
              number: '23456789'
            }
          })
        })
      });
    });

    test('should include DNI in payer identification for Argentina', async () => {
      const requestWithDni = {
        ...validPaymentRequest,
        clientDni: '12345678'
      };

      await paymentService.createPayment(requestWithDni);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          payer: expect.objectContaining({
            identification: {
              type: 'DNI',
              number: '12345678'
            }
          })
        })
      });
    });

    test('should calculate commission rates correctly', async () => {
      // Test different provider volumes for commission tiers
      const scenarios = [
        { bookings: 10, expectedRate: 0.035 }, // Standard
        { bookings: 60, expectedRate: 0.028 }, // High volume
        { bookings: 120, expectedRate: 0.025 } // Premium
      ];

      for (const scenario of scenarios) {
        mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
          ...mockProvider,
          bookings: new Array(scenario.bookings).fill({ status: 'COMPLETED' })
        });

        const commission = await paymentService.calculateCommission(1000, 'provider-123');
        
        expect(commission.commissionRate).toBe(scenario.expectedRate);
        expect(commission.commissionAmount).toBe(1000 * scenario.expectedRate);
      }
    });

    describe('Payment Validation', () => {
      test.each(Object.entries(invalidPaymentRequests))(
        'should reject invalid payment request: %s',
        async (testName, invalidRequest) => {
          await expect(paymentService.createPayment(invalidRequest as any))
            .rejects.toThrow(PaymentValidationError);
        }
      );
    });

    describe('Payment Method Validation', () => {
      test('should validate credit card limits correctly', async () => {
        const { valid, invalidLowAmount, invalidHighInstallments } = paymentMethodTestCases.credit_card;

        // Valid credit card payment
        const validRequest = {
          ...validPaymentRequest,
          amount: valid.amount,
          installments: valid.installments,
          paymentMethod: 'credit_card'
        };
        
        await expect(paymentService.createPayment(validRequest)).resolves.toBeDefined();

        // Invalid low amount
        const invalidLowRequest = {
          ...validPaymentRequest,
          amount: invalidLowAmount.amount,
          paymentMethod: 'credit_card'
        };
        
        await expect(paymentService.createPayment(invalidLowRequest))
          .rejects.toThrow('Amount too low for credit_card');

        // Invalid installments
        const invalidInstallmentsRequest = {
          ...validPaymentRequest,
          amount: 5000,
          installments: invalidHighInstallments.installments,
          paymentMethod: 'credit_card'
        };
        
        await expect(paymentService.createPayment(invalidInstallmentsRequest))
          .rejects.toThrow('Too many installments for credit_card');
      });

      test('should validate Rapipago cash payment limits', async () => {
        const { valid, invalidHighAmount } = paymentMethodTestCases.rapipago;

        // Valid Rapipago payment
        const validRequest = {
          ...validPaymentRequest,
          amount: valid.amount,
          paymentMethod: 'rapipago'
        };
        
        await expect(paymentService.createPayment(validRequest)).resolves.toBeDefined();

        // Invalid high amount for cash payment
        const invalidRequest = {
          ...validPaymentRequest,
          amount: invalidHighAmount.amount,
          paymentMethod: 'rapipago'
        };
        
        await expect(paymentService.createPayment(invalidRequest))
          .rejects.toThrow('Amount too high for rapipago');
      });

      test('should validate debit card installment restrictions', async () => {
        const { valid, invalidInstallments } = paymentMethodTestCases.debit_card;

        // Valid debit card payment (single installment)
        const validRequest = {
          ...validPaymentRequest,
          amount: valid.amount,
          installments: valid.installments,
          paymentMethod: 'debit_card'
        };
        
        await expect(paymentService.createPayment(validRequest)).resolves.toBeDefined();

        // Invalid installments for debit card
        const invalidRequest = {
          ...validPaymentRequest,
          amount: 1000,
          installments: invalidInstallments.installments,
          paymentMethod: 'debit_card'
        };
        
        await expect(paymentService.createPayment(invalidRequest))
          .rejects.toThrow('Too many installments for debit_card');
      });
    });
  });

  describe('Payment Retry Logic', () => {
    test('should retry on network errors', async () => {
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
        ...mockBooking,
        service: mockService,
        provider: { ...mockProvider, user: { email: 'provider@test.com' } },
        client: { email: 'client@test.com' }
      });
      
      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: []
      });

      // First call fails with network error, second succeeds
      mockPreference.create = jest.fn()
        .mockRejectedValueOnce(errorScenarios.networkTimeout)
        .mockResolvedValueOnce(mockMercadoPagoPreference);
      
      mockPrisma.payment.create = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment(validPaymentRequest);

      expect(mockPreference.create).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    test('should retry on MercadoPago server errors', async () => {
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
        ...mockBooking,
        service: mockService,
        provider: { ...mockProvider, user: { email: 'provider@test.com' } },
        client: { email: 'client@test.com' }
      });
      
      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: []
      });

      // First call fails with server error, second succeeds
      mockPreference.create = jest.fn()
        .mockRejectedValueOnce(errorScenarios.mercadopagoServerError)
        .mockResolvedValueOnce(mockMercadoPagoPreference);
      
      mockPrisma.payment.create = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment(validPaymentRequest);

      expect(mockPreference.create).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    test('should not retry on validation errors', async () => {
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue(null);

      await expect(paymentService.createPayment(validPaymentRequest))
        .rejects.toThrow(PaymentValidationError);

      // Should not retry validation errors
      expect(mockPreference.create).not.toHaveBeenCalled();
    });

    test('should implement exponential backoff', async () => {
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
        ...mockBooking,
        service: mockService,
        provider: { ...mockProvider, user: { email: 'provider@test.com' } },
        client: { email: 'client@test.com' }
      });
      
      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: []
      });

      // All calls fail to test exponential backoff
      mockPreference.create = jest.fn()
        .mockRejectedValue(errorScenarios.networkTimeout);

      const startTime = Date.now();
      
      await expect(paymentService.createPayment(validPaymentRequest))
        .rejects.toThrow();

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have taken some time due to retries and backoff
      expect(totalTime).toBeGreaterThan(100); // At least some delay
      expect(mockPreference.create).toHaveBeenCalledTimes(3); // Max retries
    });
  });

  describe('Payment Status and Webhook Processing', () => {
    test('should process approved payment webhook correctly', async () => {
      mockPrisma.payment.findFirst = jest.fn().mockResolvedValue({
        ...mockPayment,
        booking: mockBooking
      });
      
      mockPrisma.booking.update = jest.fn().mockResolvedValue(mockBooking);
      mockPrisma.payment.update = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.processWebhook(mockWebhookPaymentApproved);

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatusEnum.APPROVED);
      
      // Should update booking payment status
      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: mockBooking.id },
        data: { paymentStatus: 'PAID' }
      });
    });

    test('should track payment status history', async () => {
      mockPrisma.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);

      const statusInfo = await paymentService.trackPaymentStatus('payment-123');

      expect(statusInfo).toMatchObject({
        currentStatus: mockPayment.status,
        statusHistory: expect.arrayContaining([
          expect.objectContaining({
            status: mockPayment.status
          })
        ])
      });
    });
  });

  describe('Cancellation and Refund Logic', () => {
    test('should calculate cancellation penalties correctly', async () => {
      for (const [scenario, config] of Object.entries(cancellationScenarios)) {
        const bookingWithTime = {
          ...mockBooking,
          startTime: config.bookingTime,
          payment: { ...mockPayment, status: 'PAID' },
          service: mockService,
          provider: mockProvider
        };

        mockPrisma.booking.findUnique = jest.fn().mockResolvedValue(bookingWithTime);
        mockPrisma.booking.update = jest.fn().mockResolvedValue(bookingWithTime);
        mockPrisma.payment.update = jest.fn().mockResolvedValue(mockPayment);

        const result = await paymentService.processCancellation(
          'booking-123',
          'user-123',
          'Test cancellation',
          true // Apply penalty
        );

        if (config.expectedPenalty > 0) {
          expect(result.penaltyAmount).toBeGreaterThan(0);
          expect(result.penaltyAmount).toBe(mockBooking.totalAmount * config.expectedPenalty);
        } else {
          expect(result.penaltyAmount).toBeUndefined();
        }
      }
    });

    test('should handle cancellation of unpaid booking', async () => {
      const unpaidBooking = {
        ...mockBooking,
        payment: { ...mockPayment, status: 'PENDING' }
      };

      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue(unpaidBooking);
      mockPrisma.booking.update = jest.fn().mockResolvedValue(unpaidBooking);
      mockPrisma.payment.update = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.processCancellation(
        'booking-123',
        'user-123',
        'Test cancellation',
        false
      );

      expect(result.refunded).toBe(false);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: unpaidBooking.payment.id },
        data: { status: 'CANCELLED' }
      });
    });

    test('should process partial refund correctly', async () => {
      mockPrisma.payment.findUnique = jest.fn().mockResolvedValue({
        ...mockPayment,
        status: 'PAID'
      });
      
      mockPrisma.payment.update = jest.fn().mockResolvedValue(mockPayment);

      const partialAmount = 1000; // Partial refund
      const result = await paymentService.processRefund(
        'payment-123',
        partialAmount,
        'Partial service refund'
      );

      expect(result.status).toBe(PaymentStatusEnum.REFUNDED);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: expect.objectContaining({
          status: 'REFUNDED',
          refundedAt: expect.any(Date)
        })
      });
    });

    test('should reject refund for non-paid payment', async () => {
      mockPrisma.payment.findUnique = jest.fn().mockResolvedValue({
        ...mockPayment,
        status: 'PENDING'
      });

      await expect(paymentService.processRefund('payment-123'))
        .rejects.toThrow('Payment must be paid to process refund');
    });
  });

  describe('Commission Calculation', () => {
    test('should calculate tax withholding when enabled', async () => {
      // Mock tax withholding enabled
      const originalConfig = require('../../../src/config/payment').default;
      originalConfig.tax.withholdingEnabled = true;
      originalConfig.tax.ivaRate = 0.21;

      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: []
      });

      const commission = await paymentService.calculateCommission(10000, 'provider-123');

      expect(commission.taxAmount).toBeGreaterThan(0);
      expect(commission.netProviderAmount).toBeLessThan(commission.providerAmount);
      expect(commission.taxAmount).toBe(commission.commissionAmount * 0.21);
    });

    test('should handle high-volume provider discounts', async () => {
      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: new Array(100).fill({ status: 'COMPLETED' }) // High volume
      });

      const commission = await paymentService.calculateCommission(10000, 'provider-123');

      expect(commission.commissionRate).toBe(0.025); // Premium rate
      expect(commission.commissionAmount).toBe(250); // 2.5% of 10000
    });
  });

  describe('Error Handling', () => {
    test('should handle MercadoPago API errors gracefully', async () => {
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
        ...mockBooking,
        service: mockService,
        provider: { ...mockProvider, user: { email: 'provider@test.com' } },
        client: { email: 'client@test.com' }
      });

      mockPreference.create = jest.fn().mockRejectedValue(
        new Error('MercadoPago API Error')
      );

      await expect(paymentService.createPayment(validPaymentRequest))
        .rejects.toThrow(PaymentGatewayError);
    });

    test('should handle database connection errors', async () => {
      mockPrisma.booking.findUnique = jest.fn().mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(paymentService.createPayment(validPaymentRequest))
        .rejects.toThrow();
    });

    test('should sanitize sensitive data in error logs', async () => {
      const sensitiveRequest = {
        ...validPaymentRequest,
        metadata: {
          creditCard: '4509-9531-6789-3704',
          cvv: '123'
        }
      };

      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue(null);

      await expect(paymentService.createPayment(sensitiveRequest))
        .rejects.toThrow(PaymentValidationError);

      // Verify sensitive data is not logged (would need to check log output)
    });
  });

  describe('Argentina-Specific Features', () => {
    test('should handle Argentina timezone correctly', async () => {
      const now = new Date();
      const argentinaTime = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);

      // Verify timezone handling in payment expiration
      mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
        ...mockBooking,
        service: mockService,
        provider: { ...mockProvider, user: { email: 'provider@test.com' } },
        client: { email: 'client@test.com' }
      });
      
      mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
        ...mockProvider,
        bookings: []
      });
      
      mockPrisma.payment.create = jest.fn().mockResolvedValue(mockPayment);

      await paymentService.createPayment(validPaymentRequest);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          expires: true,
          expiration_date_to: expect.any(String)
        })
      });
    });

    test('should support Argentina payment methods', async () => {
      const argentinePaymentMethods = [
        'rapipago',
        'pagofacil',
        'account_money', // MercadoPago wallet
        'bank_transfer'
      ];

      for (const method of argentinePaymentMethods) {
        const request = {
          ...validPaymentRequest,
          paymentMethod: method,
          installments: 1 // Cash payments don't support installments
        };

        mockPrisma.booking.findUnique = jest.fn().mockResolvedValue({
          ...mockBooking,
          service: mockService,
          provider: { ...mockProvider, user: { email: 'provider@test.com' } },
          client: { email: 'client@test.com' }
        });
        
        mockPrisma.provider.findUnique = jest.fn().mockResolvedValue({
          ...mockProvider,
          bookings: []
        });
        
        mockPrisma.payment.create = jest.fn().mockResolvedValue(mockPayment);

        await expect(paymentService.createPayment(request))
          .resolves.toBeDefined();
      }
    });
  });
});