/**
 * Integration Tests for Payment Processing - Day 8 Advanced Testing Framework
 * BarberPro Premium Service Booking Platform - Argentina Market
 * 
 * Tests payment gateway integration, MercadoPago functionality,
 * and Argentina-specific payment scenarios
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { build } from '../../app';
import { PrismaClient } from '@prisma/client';

describe('Payment Integration Tests - Argentina Market', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    
    app = build({ logger: false });
    await app.ready();
    
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean test data
    await prisma.$executeRaw`TRUNCATE TABLE "Payment", "Booking", "Transaction" CASCADE`;
  });

  describe('MercadoPago Integration - Argentina', () => {
    test('should process successful MercadoPago payment', async () => {
      const bookingData = {
        clientId: 'test-client-123',
        providerId: 'test-provider-456',
        serviceId: 'test-service-789',
        amount: 7500, // ARS
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        clientEmail: 'cliente@test.com',
        clientDNI: '12345678'
      };

      // Create booking first
      const bookingResponse = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: bookingData
      });

      expect(bookingResponse.statusCode).toBe(201);
      const booking = JSON.parse(bookingResponse.payload);

      // Process payment
      const paymentData = {
        bookingId: booking.id,
        amount: 7500,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        mercadopagoData: {
          token: 'test-mp-token-123',
          installments: 1,
          issuerId: '25',
          paymentMethodId: 'visa'
        }
      };

      const paymentResponse = await app.inject({
        method: 'POST',
        url: '/api/payments/process',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: paymentData
      });

      expect(paymentResponse.statusCode).toBe(200);
      const paymentResult = JSON.parse(paymentResponse.payload);

      expect(paymentResult).toMatchObject({
        success: true,
        status: 'approved',
        transactionId: expect.any(String),
        mercadopagoId: expect.any(String),
        amount: 7500,
        currency: 'ARS'
      });

      // Verify booking status updated
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id }
      });
      expect(updatedBooking?.status).toBe('CONFIRMED');
    });

    test('should handle MercadoPago payment with installments', async () => {
      const paymentData = {
        amount: 15000, // ARS
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        mercadopagoData: {
          token: 'test-mp-token-installments',
          installments: 6,
          issuerId: '25',
          paymentMethodId: 'visa'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/process',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: paymentData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        success: true,
        installments: 6,
        installmentAmount: 2500, // 15000 / 6
        totalAmount: 15000,
        interestRate: expect.any(Number)
      });
    });

    test('should handle MercadoPago payment rejection', async () => {
      const paymentData = {
        amount: 5000,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        mercadopagoData: {
          token: 'test-mp-token-rejected',
          installments: 1,
          issuerId: '25',
          paymentMethodId: 'visa'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/process',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: paymentData
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        success: false,
        status: 'rejected',
        errorCode: expect.any(String),
        errorMessage: expect.any(String)
      });
    });

    test('should handle MercadoPago webhook notifications', async () => {
      // Create a pending payment first
      const payment = await prisma.payment.create({
        data: {
          id: 'test-payment-webhook',
          amount: 8000,
          currency: 'ARS',
          status: 'PENDING',
          mercadopagoId: 'mp-12345678',
          method: 'mercadopago'
        }
      });

      // Simulate MercadoPago webhook
      const webhookData = {
        action: 'payment.updated',
        api_version: 'v1',
        data: {
          id: 'mp-12345678'
        },
        date_created: new Date().toISOString(),
        id: 'webhook-notification-123',
        live_mode: false,
        type: 'payment',
        user_id: '123456789'
      };

      const webhookResponse = await app.inject({
        method: 'POST',
        url: '/api/webhooks/mercadopago',
        headers: {
          'content-type': 'application/json',
          'x-signature': 'test-signature'
        },
        payload: webhookData
      });

      expect(webhookResponse.statusCode).toBe(200);

      // Verify payment status was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: 'test-payment-webhook' }
      });
      expect(updatedPayment?.status).toBe('APPROVED');
    });
  });

  describe('AFIP Tax Integration', () => {
    test('should calculate and apply AFIP taxes correctly', async () => {
      const taxCalculationData = {
        amount: 10000, // ARS
        serviceType: 'STANDARD',
        clientType: 'CONSUMER',
        providerCUIT: '20-12345678-9',
        location: 'Buenos Aires'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/calculate-tax',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: taxCalculationData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        baseAmount: 10000,
        taxAmount: 2100, // 21% IVA
        totalAmount: 12100,
        taxBreakdown: {
          iva: 2100,
          rate: 0.21
        },
        afipCompliant: true
      });
    });

    test('should handle psychology services tax exemption', async () => {
      const psychologyTaxData = {
        amount: 8000, // ARS
        serviceType: 'PSYCHOLOGY',
        clientType: 'PATIENT',
        providerCUIT: '20-87654321-9',
        psychologyLicense: 'AR-PSY-12345'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/calculate-tax',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: psychologyTaxData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        baseAmount: 8000,
        taxAmount: 0, // Psychology services tax exempt
        totalAmount: 8000,
        taxExempt: true,
        exemptionReason: 'Mental health services exemption'
      });
    });

    test('should generate AFIP-compliant invoice', async () => {
      const invoiceData = {
        paymentId: 'test-payment-invoice',
        amount: 12100,
        taxAmount: 2100,
        clientDNI: '12345678',
        clientName: 'Juan Pérez',
        providerCUIT: '20-12345678-9',
        providerName: 'Barbería Moderna',
        serviceDescription: 'Corte de cabello premium'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/generate-invoice',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: invoiceData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        invoiceNumber: expect.stringMatching(/^[A-Z]-\d{4}-\d{8}$/),
        afipAuthorization: expect.any(String),
        qrCode: expect.any(String),
        pdfUrl: expect.any(String),
        xmlUrl: expect.any(String),
        afipCompliant: true
      });
    });
  });

  describe('Payment Security and Compliance', () => {
    test('should encrypt sensitive payment data', async () => {
      const sensitivePaymentData = {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'Juan Pérez'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/tokenize-card',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: sensitivePaymentData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        token: expect.any(String),
        last4: '1111',
        brand: 'visa',
        encrypted: true,
        pciCompliant: true
      });

      // Verify sensitive data is not stored
      expect(result.cardNumber).toBeUndefined();
      expect(result.cvv).toBeUndefined();
    });

    test('should validate PCI DSS compliance', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/compliance-status',
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        pciDssLevel: 1,
        compliant: true,
        lastAudit: expect.any(String),
        certificates: expect.arrayContaining([
          expect.objectContaining({
            type: 'PCI_DSS',
            status: 'VALID'
          })
        ])
      });
    });

    test('should detect and prevent payment fraud', async () => {
      const suspiciousPaymentData = {
        amount: 100000, // Unusually high amount
        paymentMethod: 'mercadopago',
        clientId: 'new-client-suspicious',
        ipAddress: '192.168.1.100',
        userAgent: 'SuspiciousBrowser/1.0',
        rapidRequests: true
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/fraud-check',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json',
          'x-real-ip': '192.168.1.100'
        },
        payload: suspiciousPaymentData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        riskScore: expect.any(Number),
        riskLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
        flagged: expect.any(Boolean),
        reasons: expect.arrayContaining([
          expect.any(String)
        ])
      });

      if (result.riskLevel === 'HIGH') {
        expect(result.flagged).toBe(true);
        expect(result.recommendedAction).toBe('BLOCK');
      }
    });
  });

  describe('Multi-City Payment Processing', () => {
    test('should handle regional payment processing for Córdoba', async () => {
      const cordobaPaymentData = {
        amount: 6500,
        currency: 'ARS',
        location: 'Córdoba',
        paymentMethod: 'mercadopago',
        regionalTaxes: true
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/regional-process',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: cordobaPaymentData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        success: true,
        location: 'Córdoba',
        regionalTaxRate: expect.any(Number),
        processingFee: expect.any(Number),
        totalAmount: expect.any(Number)
      });
    });

    test('should handle cross-city payment with travel compensation', async () => {
      const crossCityPaymentData = {
        amount: 8000,
        currency: 'ARS',
        clientLocation: 'Buenos Aires',
        providerLocation: 'Rosario',
        travelDistance: 300, // km
        travelCompensation: 2000 // ARS
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/cross-city-process',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: crossCityPaymentData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        baseAmount: 8000,
        travelCompensation: 2000,
        totalAmount: 10000,
        crossCityService: true,
        travelDistance: 300
      });
    });
  });

  describe('Payment Analytics and Reporting', () => {
    test('should generate payment analytics for Argentina market', async () => {
      // Create sample payment data
      await prisma.payment.createMany({
        data: [
          {
            id: 'payment-analytics-1',
            amount: 5000,
            currency: 'ARS',
            status: 'APPROVED',
            method: 'mercadopago',
            location: 'Buenos Aires',
            createdAt: new Date('2025-09-01')
          },
          {
            id: 'payment-analytics-2',
            amount: 7500,
            currency: 'ARS',
            status: 'APPROVED',
            method: 'mercadopago',
            location: 'Córdoba',
            createdAt: new Date('2025-09-02')
          }
        ]
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/analytics?period=monthly&location=all',
        headers: {
          'authorization': 'Bearer admin-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        totalPayments: expect.any(Number),
        totalAmount: expect.any(Number),
        currency: 'ARS',
        successRate: expect.any(Number),
        averageAmount: expect.any(Number),
        locationBreakdown: expect.objectContaining({
          'Buenos Aires': expect.any(Object),
          'Córdoba': expect.any(Object)
        }),
        methodBreakdown: expect.objectContaining({
          mercadopago: expect.any(Object)
        })
      });
    });

    test('should export payment data for AFIP reporting', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/export-afip?period=2025-09',
        headers: {
          'authorization': 'Bearer admin-token',
          'accept': 'application/json'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        reportPeriod: '2025-09',
        totalTransactions: expect.any(Number),
        totalAmount: expect.any(Number),
        totalTax: expect.any(Number),
        afipFormat: true,
        downloadUrl: expect.any(String),
        generatedAt: expect.any(String)
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle payment gateway timeout', async () => {
      const paymentData = {
        amount: 5000,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        simulateTimeout: true
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/process',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: paymentData
      });

      expect(response.statusCode).toBe(408);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        error: 'PAYMENT_TIMEOUT',
        retryable: true,
        retryAfter: expect.any(Number),
        paymentId: expect.any(String)
      });
    });

    test('should handle payment retry mechanism', async () => {
      const retryPaymentData = {
        originalPaymentId: 'failed-payment-123',
        retryAttempt: 2
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/retry',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: retryPaymentData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        success: true,
        retryAttempt: 2,
        originalPaymentId: 'failed-payment-123',
        newPaymentId: expect.any(String)
      });
    });

    test('should handle refund processing', async () => {
      // Create a successful payment first
      const payment = await prisma.payment.create({
        data: {
          id: 'refund-payment-test',
          amount: 7500,
          currency: 'ARS',
          status: 'APPROVED',
          mercadopagoId: 'mp-refund-123',
          method: 'mercadopago'
        }
      });

      const refundData = {
        paymentId: 'refund-payment-test',
        amount: 7500, // Full refund
        reason: 'Customer request'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/refund',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        payload: refundData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result).toMatchObject({
        success: true,
        refundId: expect.any(String),
        amount: 7500,
        status: 'PROCESSED',
        estimatedArrival: expect.any(String)
      });
    });
  });
});