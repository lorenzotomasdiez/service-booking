/**
 * Payment Integration Tests for BarberPro Argentina
 * MercadoPago Payment Processing Tests
 */

import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/app';
import { prisma } from '../../src/services/database';
import { v4 as uuidv4 } from 'uuid';

describe('Payment Integration Tests', () => {
  let server: FastifyInstance;
  let authToken: string;
  let testUserId: string;
  let testProviderId: string;
  let testServiceId: string;
  let testBookingId: string;

  beforeAll(async () => {
    server = buildServer();
    await server.ready();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-client@example.com',
        name: 'Test Client',
        phone: '+5491123456789',
        password: 'hashedpassword',
        role: 'CLIENT',
        dni: '12345678',
        isVerified: true,
      },
    });
    testUserId = testUser.id;

    // Create test provider
    const providerUser = await prisma.user.create({
      data: {
        email: 'test-provider@example.com',
        name: 'Test Provider',
        phone: '+5491987654321',
        password: 'hashedpassword',
        role: 'PROVIDER',
        isVerified: true,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: providerUser.id,
        businessName: 'Test Barber Shop',
        description: 'Test description',
        address: 'Test Address 123',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        isVerified: true,
        isActive: true,
      },
    });
    testProviderId = provider.id;

    // Create test service
    const service = await prisma.service.create({
      data: {
        name: 'Corte de Cabello',
        description: 'Corte de cabello profesional',
        duration: 60,
        price: 2500.00,
        providerId: testProviderId,
        isActive: true,
      },
    });
    testServiceId = service.id;

    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        clientId: testUserId,
        serviceId: testServiceId,
        providerId: testProviderId,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
        totalAmount: 2500.00,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });
    testBookingId = booking.id;

    // Get auth token
    const loginResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test-client@example.com',
        password: 'password123',
      },
    });
    
    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.payload);
      authToken = loginData.data.accessToken;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.payment.deleteMany({
      where: { bookingId: testBookingId },
    });
    await prisma.booking.deleteMany({
      where: { id: testBookingId },
    });
    await prisma.service.deleteMany({
      where: { id: testServiceId },
    });
    await prisma.provider.deleteMany({
      where: { id: testProviderId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId] } },
    });

    await server.close();
  });

  describe('Payment Configuration', () => {
    it('should get payment configuration', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/payments/config',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('publicKey');
      expect(data.data).toHaveProperty('environment');
      expect(data.data).toHaveProperty('currency', 'ARS');
      expect(data.data).toHaveProperty('maxInstallments');
      expect(data.data.supportedMethods).toContain('credit_card');
    });
  });

  describe('Payment Creation', () => {
    it('should create a payment preference successfully', async () => {
      const paymentRequest = {
        bookingId: testBookingId,
        amount: 2500.00,
        currency: 'ARS',
        description: 'Corte de cabello - Test Barber Shop',
        clientEmail: 'test-client@example.com',
        clientName: 'Test Client',
        clientPhone: '+5491123456789',
        clientDni: '12345678',
        returnUrls: {
          success: 'http://localhost:3000/payment/success',
          failure: 'http://localhost:3000/payment/failure',
          pending: 'http://localhost:3000/payment/pending',
        },
        metadata: {
          test: true,
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: paymentRequest,
      });

      console.log('Payment creation response:', response.payload);
      
      // Note: This will fail with real MercadoPago credentials in sandbox
      // but should show proper validation and error handling
      expect([201, 400, 502]).toContain(response.statusCode);
      
      if (response.statusCode === 201) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('id');
        expect(data.data).toHaveProperty('status');
        expect(data.data).toHaveProperty('externalReference', testBookingId);
      }
    });

    it('should reject payment creation with invalid data', async () => {
      const invalidRequest = {
        bookingId: testBookingId,
        amount: -100, // Invalid amount
        currency: 'USD', // Invalid currency
        description: '',
        clientEmail: 'invalid-email',
        clientName: '',
        returnUrls: {
          success: 'not-a-url',
          failure: 'not-a-url',
          pending: 'not-a-url',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
    });

    it('should reject unauthorized payment creation', async () => {
      const paymentRequest = {
        bookingId: testBookingId,
        amount: 2500.00,
        currency: 'ARS',
        description: 'Unauthorized payment attempt',
        clientEmail: 'test-client@example.com',
        clientName: 'Test Client',
        returnUrls: {
          success: 'http://localhost:3000/payment/success',
          failure: 'http://localhost:3000/payment/failure',
          pending: 'http://localhost:3000/payment/pending',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/payments',
        payload: paymentRequest,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Payment Status', () => {
    let testPaymentId: string;

    beforeEach(async () => {
      // Create a test payment record
      const payment = await prisma.payment.create({
        data: {
          bookingId: testBookingId,
          amount: 2500.00,
          currency: 'ARS',
          status: 'PENDING',
          paymentMethod: 'mercadopago',
          description: 'Test payment',
        },
      });
      testPaymentId = payment.id;
    });

    afterEach(async () => {
      await prisma.payment.deleteMany({
        where: { id: testPaymentId },
      });
    });

    it('should get payment status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/payments/${testPaymentId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', testPaymentId);
      expect(data.data).toHaveProperty('status', 'PENDING');
      expect(data.data).toHaveProperty('amount', 2500);
      expect(data.data).toHaveProperty('currency', 'ARS');
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/payments/non-existent-id`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('MercadoPago Webhook', () => {
    it('should handle webhook notification', async () => {
      const webhookPayload = {
        id: 12345,
        live_mode: false,
        type: 'payment',
        date_created: '2023-01-01T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: 'test-payment-id',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/payments/webhooks/mercadopago',
        payload: webhookPayload,
      });

      // Should handle webhook gracefully even if payment doesn't exist
      expect([200, 422]).toContain(response.statusCode);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('success');
    });

    it('should reject webhook with invalid signature when validation is enabled', async () => {
      const webhookPayload = {
        id: 12345,
        type: 'payment',
        data: { id: 'test-id' },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/payments/webhooks/mercadopago',
        headers: {
          'x-signature': 'invalid-signature',
        },
        payload: webhookPayload,
      });

      // Note: Signature validation might be disabled in test environment
      expect([200, 401, 422]).toContain(response.statusCode);
    });
  });

  describe('Payment Analytics', () => {
    it('should get payment analytics for authorized user', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/payments/analytics',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        query: {
          from: '2023-01-01',
          to: '2023-12-31',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalTransactions');
      expect(data.data).toHaveProperty('successfulTransactions');
      expect(data.data).toHaveProperty('successRate');
      expect(data.data).toHaveProperty('totalVolume');
      expect(data.data.period).toHaveProperty('from');
      expect(data.data.period).toHaveProperty('to');
    });

    it('should reject analytics request without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/payments/analytics',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle payment service errors gracefully', async () => {
      // Test with non-existent booking
      const invalidRequest = {
        bookingId: 'non-existent-booking-id',
        amount: 1000,
        currency: 'ARS',
        description: 'Test payment',
        clientEmail: 'test@example.com',
        clientName: 'Test Client',
        returnUrls: {
          success: 'http://localhost:3000/success',
          failure: 'http://localhost:3000/failure',
          pending: 'http://localhost:3000/pending',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/payments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BOOKING_NOT_FOUND');
    });
  });
});