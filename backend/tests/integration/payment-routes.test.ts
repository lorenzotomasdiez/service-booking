/**
 * Payment Routes Integration Tests for BarberPro Argentina
 * End-to-end testing of payment API endpoints
 */

import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import {
  validPaymentRequest,
  mockUser,
  mockProvider,
  mockService,
  mockBooking,
  mockPayment,
  mockWebhookPaymentApproved
} from '../fixtures/payment-fixtures';

describe('Payment Routes Integration Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let authToken: string;
  let clientUserId: string;
  let providerUserId: string;
  let bookingId: string;
  let paymentId: string;

  beforeAll(async () => {
    app = build();
    await app.ready();
    
    prisma = app.prisma;
    
    // Cleanup test data
    await prisma.payment.deleteMany({
      where: { description: { contains: 'TEST_PAYMENT' } }
    });
    await prisma.booking.deleteMany({
      where: { notes: { contains: 'TEST_BOOKING' } }
    });
    await prisma.service.deleteMany({
      where: { name: { contains: 'TEST_SERVICE' } }
    });
    await prisma.provider.deleteMany({
      where: { businessName: { contains: 'TEST_PROVIDER' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.payment' } }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.payment.deleteMany({
      where: { description: { contains: 'TEST_PAYMENT' } }
    });
    await prisma.booking.deleteMany({
      where: { notes: { contains: 'TEST_BOOKING' } }
    });
    await prisma.service.deleteMany({
      where: { name: { contains: 'TEST_SERVICE' } }
    });
    await prisma.provider.deleteMany({
      where: { businessName: { contains: 'TEST_PROVIDER' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.payment' } }
    });
    
    await app.close();
  });

  beforeEach(async () => {
    // Create test users
    const clientUser = await prisma.user.create({
      data: {
        ...mockUser,
        email: 'client.test.payment@example.com',
        name: 'Test Client Payment User'
      }
    });
    clientUserId = clientUser.id;

    const providerUser = await prisma.user.create({
      data: {
        ...mockUser,
        email: 'provider.test.payment@example.com',
        name: 'Test Provider Payment User',
        role: 'PROVIDER'
      }
    });
    providerUserId = providerUser.id;

    // Create test provider
    const provider = await prisma.provider.create({
      data: {
        ...mockProvider,
        userId: providerUserId,
        businessName: 'TEST_PROVIDER Payment Test'
      }
    });

    // Create test service
    const service = await prisma.service.create({
      data: {
        ...mockService,
        providerId: provider.id,
        name: 'TEST_SERVICE Payment Test'
      }
    });

    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        ...mockBooking,
        clientId: clientUserId,
        serviceId: service.id,
        providerId: provider.id,
        notes: 'TEST_BOOKING for payment integration'
      }
    });
    bookingId = booking.id;

    // Get auth token for client
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'client.test.payment@example.com',
        password: 'password123'
      }
    });

    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.data.token;
  });

  afterEach(async () => {
    // Cleanup after each test
    if (paymentId) {
      await prisma.payment.deleteMany({
        where: { id: paymentId }
      });
    }
    await prisma.booking.deleteMany({
      where: { notes: { contains: 'TEST_BOOKING' } }
    });
    await prisma.service.deleteMany({
      where: { name: { contains: 'TEST_SERVICE' } }
    });
    await prisma.provider.deleteMany({
      where: { businessName: { contains: 'TEST_PROVIDER' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.payment' } }
    });
  });

  describe('POST /api/payments', () => {
    test('should create payment successfully with valid request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          ...validPaymentRequest,
          bookingId,
          description: 'TEST_PAYMENT Integration Test'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        status: 'pending',
        externalReference: bookingId
      });

      paymentId = data.data.id;
    });

    test('should reject payment for non-existent booking', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          ...validPaymentRequest,
          bookingId: 'non-existent-booking',
          description: 'TEST_PAYMENT Invalid Booking'
        }
      });

      expect(response.statusCode).toBe(404);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BOOKING_NOT_FOUND');
    });

    test('should reject unauthorized payment creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments',
        payload: {
          ...validPaymentRequest,
          bookingId,
          description: 'TEST_PAYMENT Unauthorized'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should validate payment amount', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          ...validPaymentRequest,
          bookingId,
          amount: -100, // Invalid negative amount
          description: 'TEST_PAYMENT Invalid Amount'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should prevent duplicate payments for same booking', async () => {
      // Create first payment
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          ...validPaymentRequest,
          bookingId,
          description: 'TEST_PAYMENT First'
        }
      });

      expect(firstResponse.statusCode).toBe(201);
      const firstData = JSON.parse(firstResponse.body);
      paymentId = firstData.data.id;

      // Mark first payment as paid
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID' }
      });

      // Try to create second payment for same booking
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          ...validPaymentRequest,
          bookingId,
          description: 'TEST_PAYMENT Duplicate'
        }
      });

      expect(secondResponse.statusCode).toBe(400);
      
      const secondData = JSON.parse(secondResponse.body);
      expect(secondData.success).toBe(false);
      expect(secondData.error.code).toBe('PAYMENT_ALREADY_EXISTS');
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    beforeEach(async () => {
      // Create a test payment
      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          description: 'TEST_PAYMENT for GET test'
        }
      });
      paymentId = payment.id;
    });

    test('should get payment details successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/payments/${paymentId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: paymentId,
        status: expect.any(String),
        amount: expect.any(Number),
        currency: 'ARS'
      });
    });

    test('should reject unauthorized payment access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/payments/${paymentId}`
      });

      expect(response.statusCode).toBe(401);
    });

    test('should return 404 for non-existent payment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/non-existent-payment',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PAYMENT_NOT_FOUND');
    });
  });

  describe('POST /api/payments/:paymentId/refund', () => {
    beforeEach(async () => {
      // Create a paid test payment
      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          status: 'PAID',
          paidAt: new Date(),
          description: 'TEST_PAYMENT for refund test'
        }
      });
      paymentId = payment.id;
    });

    test('should process full refund successfully', async () => {
      // Login as provider (only providers can initiate refunds)
      const providerLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'provider.test.payment@example.com',
          password: 'password123'
        }
      });

      const providerToken = JSON.parse(providerLoginResponse.body).data.token;

      const response = await app.inject({
        method: 'POST',
        url: `/api/payments/${paymentId}/refund`,
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: {
          reason: 'Service cancellation by provider'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        status: 'refunded',
        refundAmount: expect.any(Number)
      });
    });

    test('should process partial refund successfully', async () => {
      // Login as provider
      const providerLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'provider.test.payment@example.com',
          password: 'password123'
        }
      });

      const providerToken = JSON.parse(providerLoginResponse.body).data.token;

      const partialAmount = 1000;
      const response = await app.inject({
        method: 'POST',
        url: `/api/payments/${paymentId}/refund`,
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: {
          amount: partialAmount,
          reason: 'Partial service refund'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.refundAmount).toBe(partialAmount);
    });

    test('should reject client-initiated refund', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/payments/${paymentId}/refund`,
        headers: {
          authorization: `Bearer ${authToken}` // Client token
        },
        payload: {
          reason: 'Client wants refund'
        }
      });

      expect(response.statusCode).toBe(403);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject refund for unpaid payment', async () => {
      // Update payment to pending status
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PENDING', paidAt: null }
      });

      const providerLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'provider.test.payment@example.com',
          password: 'password123'
        }
      });

      const providerToken = JSON.parse(providerLoginResponse.body).data.token;

      const response = await app.inject({
        method: 'POST',
        url: `/api/payments/${paymentId}/refund`,
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: {
          reason: 'Refund pending payment'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/payments/cancel', () => {
    test('should cancel booking with payment refund', async () => {
      // Create a paid payment
      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          status: 'PAID',
          paidAt: new Date(),
          description: 'TEST_PAYMENT for cancellation test'
        }
      });
      paymentId = payment.id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/cancel',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          bookingId,
          reason: 'Client needs to reschedule',
          applyPenalty: false
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        refunded: true,
        refundAmount: expect.any(Number),
        message: expect.stringContaining('cancelled successfully')
      });

      // Verify booking is cancelled
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      expect(updatedBooking?.status).toBe('CANCELLED');
    });

    test('should apply cancellation penalty when requested', async () => {
      // Create a paid payment for a booking in 12 hours (should have penalty)
      const nearFutureBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          startTime: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
        }
      });

      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          status: 'PAID',
          paidAt: new Date(),
          description: 'TEST_PAYMENT for penalty test'
        }
      });
      paymentId = payment.id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/cancel',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          bookingId,
          reason: 'Last minute cancellation',
          applyPenalty: true
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.penaltyAmount).toBeGreaterThan(0);
      expect(data.data.refundAmount).toBeLessThan(mockPayment.amount);
    });

    test('should cancel unpaid booking without refund', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/cancel',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          bookingId,
          reason: 'Cancel unpaid booking',
          applyPenalty: false
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.refunded).toBe(false);
    });
  });

  describe('GET /api/payments/:paymentId/status', () => {
    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          description: 'TEST_PAYMENT for status test'
        }
      });
      paymentId = payment.id;
    });

    test('should get payment status tracking', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/payments/${paymentId}/status`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        currentStatus: expect.any(String),
        statusHistory: expect.any(Array),
        lastUpdated: expect.any(String)
      });
    });
  });

  describe('POST /api/payments/:paymentId/retry', () => {
    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          status: 'FAILED',
          failedAt: new Date(),
          description: 'TEST_PAYMENT for retry test'
        }
      });
      paymentId = payment.id;
    });

    test('should retry failed payment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/payments/${paymentId}/retry`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        status: 'pending',
        retryAttempt: expect.any(Number)
      });

      // Verify old payment is cancelled
      const oldPayment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });
      expect(oldPayment?.status).toBe('CANCELLED');
    });

    test('should reject retry of paid payment', async () => {
      // Update payment to paid status
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', paidAt: new Date() }
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/payments/${paymentId}/retry`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PAYMENT_ALREADY_PAID');
    });
  });

  describe('POST /api/payments/webhooks/mercadopago', () => {
    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          ...mockPayment,
          bookingId,
          externalId: '987654321',
          description: 'TEST_PAYMENT for webhook test'
        }
      });
      paymentId = payment.id;
    });

    test('should process webhook successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/webhooks/mercadopago',
        payload: mockWebhookPaymentApproved
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Webhook processed successfully');
    });

    test('should handle webhook for non-existent payment', async () => {
      const invalidWebhook = {
        ...mockWebhookPaymentApproved,
        data: { id: 'non-existent-payment' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/webhooks/mercadopago',
        payload: invalidWebhook
      });

      expect(response.statusCode).toBe(422);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/payments/config', () => {
    test('should get payment configuration', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/config'
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        publicKey: expect.any(String),
        environment: expect.any(String),
        currency: 'ARS',
        maxInstallments: expect.any(Number),
        supportedMethods: expect.arrayContaining([
          'credit_card',
          'debit_card',
          'rapipago',
          'pagofacil'
        ])
      });
    });
  });

  describe('GET /api/payments/analytics', () => {
    test('should get payment analytics for authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/analytics',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        totalTransactions: expect.any(Number),
        successfulTransactions: expect.any(Number),
        failedTransactions: expect.any(Number),
        successRate: expect.any(Number),
        totalVolume: expect.any(Number),
        averageTransactionAmount: expect.any(Number),
        period: {
          from: expect.any(String),
          to: expect.any(String)
        }
      });
    });

    test('should require authentication for analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/analytics'
      });

      expect(response.statusCode).toBe(401);
    });
  });
});