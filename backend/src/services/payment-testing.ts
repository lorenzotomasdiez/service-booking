/**
 * Payment Testing Service for BarberPro Argentina
 * Comprehensive testing and validation for payment features
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import MercadoPagoPaymentService from './payment';
import { PaymentRequest, PaymentStatusEnum } from '../types/payment';
import paymentConfig from '../config/payment';

export interface PaymentTestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: Record<string, any>;
  errors?: string[];
}

export interface PaymentTestSuite {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: PaymentTestResult[];
}

export class PaymentTestingService {
  private prisma: PrismaClient;
  private paymentService: MercadoPagoPaymentService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.paymentService = new MercadoPagoPaymentService(prisma);
  }

  /**
   * Run comprehensive payment system tests
   */
  async runPaymentTestSuite(): Promise<PaymentTestSuite> {
    const startTime = Date.now();
    const results: PaymentTestResult[] = [];

    console.log('🧪 Starting BarberPro Payment System Tests...');

    // Test 1: Argentina Payment Method Configuration
    results.push(await this.testArgentinaPaymentMethods());

    // Test 2: CBU Validation
    results.push(await this.testCBUValidation());

    // Test 3: MercadoPago Payment Creation
    results.push(await this.testMercadoPagoPaymentCreation());

    // Test 4: Commission Calculation System
    results.push(await this.testCommissionCalculation());

    // Test 5: Payment Hold System
    results.push(await this.testPaymentHoldSystem());

    // Test 6: Provider Payout Schedule
    results.push(await this.testProviderPayoutSchedule());

    // Test 7: Payment Dispute Processing
    results.push(await this.testPaymentDisputeProcessing());

    // Test 8: Enhanced Analytics
    results.push(await this.testEnhancedAnalytics());

    // Test 9: Webhook Processing
    results.push(await this.testWebhookProcessing());

    // Test 10: Payment Retry Mechanism
    results.push(await this.testPaymentRetryMechanism());

    // Test 11: Installments Processing
    results.push(await this.testInstallmentsProcessing());

    // Test 12: Payment Security Validation
    results.push(await this.testPaymentSecurity());

    const totalDuration = Date.now() - startTime;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;

    return {
      suiteName: 'BarberPro Payment System Test Suite',
      totalTests: results.length,
      passedTests,
      failedTests,
      totalDuration,
      results,
    };
  }

  /**
   * Test Argentina-specific payment methods configuration
   */
  private async testArgentinaPaymentMethods(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test payment methods initialization
      const paymentMethods = (this.paymentService as any).argentinaPaymentMethods;

      if (!paymentMethods) {
        errors.push('Argentina payment methods not initialized');
      }

      if (!paymentMethods.mercadopago?.enabled) {
        errors.push('MercadoPago not enabled');
      }

      if (!paymentMethods.rapipago?.enabled) {
        errors.push('Rapipago not enabled');
      }

      if (!paymentMethods.pagofacil?.enabled) {
        errors.push('Pago Fácil not enabled');
      }

      if (!paymentMethods.bankTransfer?.enabled) {
        errors.push('Bank transfer not enabled');
      }

      // Validate configuration values
      if (paymentMethods.mercadopago?.maxInstallments !== 12) {
        errors.push('MercadoPago max installments should be 12');
      }

      if (paymentMethods.rapipago?.maxAmount !== 50000) {
        errors.push('Rapipago max amount should be ARS 50,000');
      }

      if (paymentMethods.pagofacil?.expiryHours !== 72) {
        errors.push('Pago Fácil expiry should be 72 hours');
      }

      return {
        testName: 'Argentina Payment Methods Configuration',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          paymentMethods,
          configuredMethods: Object.keys(paymentMethods || {}),
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Argentina Payment Methods Configuration',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test CBU validation functionality
   */
  private async testCBUValidation(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test valid CBU
      const validCBU = '01101100030000001234567';
      const validResult = await this.paymentService.validateCBU(validCBU);

      if (!validResult.valid) {
        errors.push('Valid CBU was rejected');
      }

      if (validResult.bankCode !== '011') {
        errors.push('Bank code not extracted correctly');
      }

      // Test invalid CBU (wrong length)
      const invalidCBU = '011011000300000012345';
      const invalidResult = await this.paymentService.validateCBU(invalidCBU);

      if (invalidResult.valid) {
        errors.push('Invalid CBU was accepted');
      }

      // Test CBU with invalid check digit
      const wrongCheckDigitCBU = '01101100030000001234560';
      const wrongCheckResult = await this.paymentService.validateCBU(wrongCheckDigitCBU);

      if (wrongCheckResult.valid) {
        errors.push('CBU with wrong check digit was accepted');
      }

      return {
        testName: 'CBU Validation',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          validCBU: validResult,
          invalidCBU: invalidResult,
          wrongCheckDigit: wrongCheckResult,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'CBU Validation',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test MercadoPago payment creation
   */
  private async testMercadoPagoPaymentCreation(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create test booking first
      const testBooking = await this.createTestBooking();

      const paymentRequest: PaymentRequest = {
        bookingId: testBooking.id,
        amount: 5000,
        currency: 'ARS',
        description: 'Test payment for barber service',
        clientEmail: 'test@example.com',
        clientName: 'Test Cliente',
        clientPhone: '+541141234567',
        clientDni: '12345678',
        returnUrls: {
          success: 'https://barberpro.com.ar/payment/success',
          failure: 'https://barberpro.com.ar/payment/failure',
          pending: 'https://barberpro.com.ar/payment/pending',
        },
        installments: 3,
        metadata: {
          test: true,
          environment: 'testing',
        },
      };

      const paymentResponse = await this.paymentService.createPayment(paymentRequest);

      if (!paymentResponse.id) {
        errors.push('Payment ID not generated');
      }

      if (paymentResponse.status !== PaymentStatusEnum.PENDING) {
        errors.push('Payment should start in PENDING status');
      }

      if (!paymentResponse.initPoint) {
        errors.push('MercadoPago init point not generated');
      }

      // Clean up
      await this.cleanupTestBooking(testBooking.id);

      return {
        testName: 'MercadoPago Payment Creation',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          paymentId: paymentResponse.id,
          status: paymentResponse.status,
          hasInitPoint: !!paymentResponse.initPoint,
          amount: paymentRequest.amount,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'MercadoPago Payment Creation',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test commission calculation system
   */
  private async testCommissionCalculation(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create test provider
      const testProvider = await this.createTestProvider();

      // Test standard commission (3.5%)
      const commission1 = await this.paymentService.calculateCommission(10000, testProvider.id);

      const expectedStandardCommission = 10000 * paymentConfig.business.commissionStandard;
      if (Math.abs(commission1.commissionAmount - expectedStandardCommission) > 0.01) {
        errors.push(`Standard commission calculation incorrect. Expected: ${expectedStandardCommission}, Got: ${commission1.commissionAmount}`);
      }

      // Verify all commission fields
      if (commission1.baseAmount !== 10000) {
        errors.push('Base amount not set correctly');
      }

      if (commission1.providerAmount !== (10000 - commission1.commissionAmount)) {
        errors.push('Provider amount calculation incorrect');
      }

      if (commission1.commissionRate !== paymentConfig.business.commissionStandard) {
        errors.push('Commission rate not set correctly');
      }

      // Clean up
      await this.cleanupTestProvider(testProvider.id);

      return {
        testName: 'Commission Calculation System',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          testAmount: 10000,
          commission: commission1,
          expectedCommissionAmount: expectedStandardCommission,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Commission Calculation System',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test payment hold system
   */
  private async testPaymentHoldSystem(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create test payment
      const testData = await this.createTestPaymentData();

      // Create a paid payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: testData.booking.id,
          amount: 5000,
          currency: 'ARS',
          status: 'PAID',
          paymentMethod: 'mercadopago',
          description: 'Test payment for hold system',
          paidAt: new Date(),
        },
      });

      const holdStatus = await this.paymentService.processPaymentHold(payment.id);

      if (holdStatus.status !== 'HELD') {
        errors.push('Payment hold status should be HELD');
      }

      if (holdStatus.daysRemaining !== paymentConfig.business.payoutHoldDays) {
        errors.push(`Hold days should be ${paymentConfig.business.payoutHoldDays}`);
      }

      if (holdStatus.holdAmount <= 0) {
        errors.push('Hold amount should be positive');
      }

      if (holdStatus.commission <= 0) {
        errors.push('Commission should be positive');
      }

      // Clean up
      await this.cleanupTestPaymentData(testData);

      return {
        testName: 'Payment Hold System',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          holdStatus,
          holdDays: paymentConfig.business.payoutHoldDays,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Payment Hold System',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test provider payout schedule
   */
  private async testProviderPayoutSchedule(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const testProvider = await this.createTestProvider();

      const schedule = await this.paymentService.getProviderPayoutSchedule(testProvider.id);

      if (schedule.providerId !== testProvider.id) {
        errors.push('Provider ID mismatch in payout schedule');
      }

      if (schedule.currency !== 'ARS') {
        errors.push('Payout schedule currency should be ARS');
      }

      if (schedule.minimumPayoutAmount !== paymentConfig.business.minimumPayoutAmount) {
        errors.push('Minimum payout amount configuration mismatch');
      }

      if (!schedule.nextPayoutDate) {
        errors.push('Next payout date should be set');
      }

      if (schedule.payoutFrequency !== 'weekly') {
        errors.push('Payout frequency should be weekly');
      }

      // Clean up
      await this.cleanupTestProvider(testProvider.id);

      return {
        testName: 'Provider Payout Schedule',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          schedule,
          expectedMinimumPayout: paymentConfig.business.minimumPayoutAmount,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Provider Payout Schedule',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test payment dispute processing
   */
  private async testPaymentDisputeProcessing(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const testData = await this.createTestPaymentData();

      const payment = await this.prisma.payment.create({
        data: {
          bookingId: testData.booking.id,
          amount: 5000,
          currency: 'ARS',
          status: 'PAID',
          paymentMethod: 'mercadopago',
          description: 'Test payment for dispute',
          paidAt: new Date(),
        },
      });

      const dispute = await this.paymentService.processPaymentDispute(
        payment.id,
        'quality_complaint',
        'Service quality did not meet expectations'
      );

      if (!dispute.id) {
        errors.push('Dispute ID not generated');
      }

      if (dispute.paymentId !== payment.id) {
        errors.push('Dispute payment ID mismatch');
      }

      if (dispute.status !== 'OPEN') {
        errors.push('Dispute should start in OPEN status');
      }

      if (dispute.disputeType !== 'quality_complaint') {
        errors.push('Dispute type not set correctly');
      }

      if (dispute.amount !== 5000) {
        errors.push('Dispute amount mismatch');
      }

      // Clean up
      await this.cleanupTestPaymentData(testData);

      return {
        testName: 'Payment Dispute Processing',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          dispute,
          disputeTypes: ['chargeback', 'refund_request', 'quality_complaint'],
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Payment Dispute Processing',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test enhanced analytics
   */
  private async testEnhancedAnalytics(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const testProvider = await this.createTestProvider();

      const dateRange = {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await this.paymentService.getEnhancedPaymentAnalytics(
        testProvider.id,
        dateRange
      );

      if (!analytics.period) {
        errors.push('Analytics period not set');
      }

      if (!analytics.argentinaSpecificMetrics) {
        errors.push('Argentina-specific metrics not included');
      }

      if (typeof analytics.argentinaSpecificMetrics.cashPaymentPercentage !== 'number') {
        errors.push('Cash payment percentage not calculated');
      }

      if (typeof analytics.argentinaSpecificMetrics.averageInstallments !== 'number') {
        errors.push('Average installments not calculated');
      }

      if (typeof analytics.argentinaSpecificMetrics.pesoVolumeGrowth !== 'number') {
        errors.push('Peso volume growth not calculated');
      }

      // Clean up
      await this.cleanupTestProvider(testProvider.id);

      return {
        testName: 'Enhanced Payment Analytics',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          analytics,
          metricsIncluded: Object.keys(analytics.argentinaSpecificMetrics || {}),
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Enhanced Payment Analytics',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test webhook processing
   */
  private async testWebhookProcessing(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create test payment
      const testData = await this.createTestPaymentData();

      const payment = await this.prisma.payment.create({
        data: {
          bookingId: testData.booking.id,
          amount: 5000,
          currency: 'ARS',
          status: 'PENDING',
          paymentMethod: 'mercadopago',
          externalId: 'test-mp-payment-id',
          description: 'Test payment for webhook',
        },
      });

      // Mock MercadoPago webhook payload
      const webhookPayload = {
        id: 123456,
        live_mode: false,
        type: 'payment' as const,
        date_created: new Date().toISOString(),
        application_id: 789,
        user_id: 456,
        version: 1,
        api_version: 'v1',
        action: 'payment.updated' as const,
        data: {
          id: 'test-mp-payment-id',
        },
      };

      // Mock the payment.get method to avoid actual API call
      const originalPaymentGet = this.paymentService['payment'].get;
      this.paymentService['payment'].get = async () => ({
        id: 'test-mp-payment-id',
        status: 'approved',
        external_reference: testData.booking.id,
        transaction_amount: 5000,
      });

      const result = await this.paymentService.processWebhook(webhookPayload);

      // Restore original method
      this.paymentService['payment'].get = originalPaymentGet;

      if (!result.success) {
        errors.push('Webhook processing should succeed');
      }

      if (result.paymentId !== payment.id) {
        errors.push('Webhook processing payment ID mismatch');
      }

      if (result.status !== PaymentStatusEnum.APPROVED) {
        errors.push('Webhook should update payment status to APPROVED');
      }

      // Clean up
      await this.cleanupTestPaymentData(testData);

      return {
        testName: 'Webhook Processing',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          webhookResult: result,
          webhookPayload,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Webhook Processing',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test payment retry mechanism
   */
  private async testPaymentRetryMechanism(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test retry configuration
      const retryConfig = (this.paymentService as any).retryConfig;

      if (!retryConfig) {
        errors.push('Retry configuration not set');
      }

      if (retryConfig.maxRetries !== paymentConfig.paymentMethods.retryAttempts) {
        errors.push('Max retries configuration mismatch');
      }

      if (retryConfig.retryDelayMs !== paymentConfig.paymentMethods.retryDelayMs) {
        errors.push('Retry delay configuration mismatch');
      }

      if (!retryConfig.exponentialBackoff) {
        errors.push('Exponential backoff should be enabled');
      }

      return {
        testName: 'Payment Retry Mechanism',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          retryConfig,
          expectedMaxRetries: paymentConfig.paymentMethods.retryAttempts,
          expectedRetryDelay: paymentConfig.paymentMethods.retryDelayMs,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Payment Retry Mechanism',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test installments processing
   */
  private async testInstallmentsProcessing(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test installment validation
      const validInstallments = [1, 3, 6, 9, 12];
      const invalidInstallments = [0, 13, 24];

      for (const installments of validInstallments) {
        const request: PaymentRequest = {
          bookingId: uuidv4(),
          amount: 10000,
          currency: 'ARS',
          description: 'Test installments',
          clientEmail: 'test@example.com',
          clientName: 'Test',
          returnUrls: {
            success: '',
            failure: '',
            pending: '',
          },
          installments,
        };

        try {
          await (this.paymentService as any).validatePaymentMethod(request);
        } catch (error) {
          errors.push(`Valid installments ${installments} was rejected`);
        }
      }

      for (const installments of invalidInstallments) {
        const request: PaymentRequest = {
          bookingId: uuidv4(),
          amount: 10000,
          currency: 'ARS',
          description: 'Test installments',
          clientEmail: 'test@example.com',
          clientName: 'Test',
          paymentMethod: 'credit_card',
          returnUrls: {
            success: '',
            failure: '',
            pending: '',
          },
          installments,
        };

        try {
          await (this.paymentService as any).validatePaymentMethod(request);
          if (installments > 12) {
            errors.push(`Invalid installments ${installments} was accepted`);
          }
        } catch (error) {
          // Expected for invalid installments
        }
      }

      return {
        testName: 'Installments Processing',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          validInstallments,
          invalidInstallments,
          maxInstallments: paymentConfig.paymentMethods.installmentsMax,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Installments Processing',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  /**
   * Test payment security validation
   */
  private async testPaymentSecurity(): Promise<PaymentTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test webhook signature validation
      if (!paymentConfig.webhooks.signatureValidation) {
        errors.push('Webhook signature validation should be enabled');
      }

      // Test PCI compliance mode
      if (!paymentConfig.security.pciComplianceMode) {
        errors.push('PCI compliance mode should be enabled');
      }

      // Test audit logging
      if (!paymentConfig.security.auditLogging) {
        errors.push('Audit logging should be enabled');
      }

      // Test encryption key configuration
      if (!paymentConfig.security.encryptionKey) {
        errors.push('Encryption key should be configured');
      }

      if (paymentConfig.security.encryptionKey && paymentConfig.security.encryptionKey.length < 32) {
        errors.push('Encryption key should be at least 32 characters');
      }

      // Test webhook signature generation
      const testPayload = JSON.stringify({ test: true });
      const testSignature = 'test-signature';

      try {
        const isValid = this.paymentService.validateWebhookSignature(testPayload, testSignature);
        // Since we're using a test signature, this should return false
        if (isValid && paymentConfig.webhooks.signatureValidation) {
          errors.push('Webhook signature validation too permissive');
        }
      } catch (error: any) {
        if (!error.message.includes('Webhook secret not configured')) {
          errors.push(`Unexpected webhook validation error: ${error.message}`);
        }
      }

      return {
        testName: 'Payment Security Validation',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          securityConfig: {
            webhookValidation: paymentConfig.webhooks.signatureValidation,
            pciCompliance: paymentConfig.security.pciComplianceMode,
            auditLogging: paymentConfig.security.auditLogging,
            encryptionKeyLength: paymentConfig.security.encryptionKey?.length || 0,
          },
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        testName: 'Payment Security Validation',
        success: false,
        duration: Date.now() - startTime,
        details: { error: error.message },
        errors: [error.message],
      };
    }
  }

  // Helper methods for test data creation and cleanup

  private async createTestBooking() {
    const user = await this.prisma.user.create({
      data: {
        email: `test-${uuidv4()}@example.com`,
        name: 'Test User',
        password: 'test',
        role: 'CLIENT',
        isVerified: true,
      },
    });

    const provider = await this.createTestProvider();

    // First create or get the service category
    const serviceCategory = await this.prisma.serviceCategory.upsert({
      where: { name: 'HAIRCUT' },
      update: {},
      create: {
        name: 'HAIRCUT',
        description: 'Haircut services',
        isActive: true,
      },
    });

    const service = await this.prisma.service.create({
      data: {
        name: 'Test Barber Service',
        description: 'Test service for payment testing',
        price: 5000,
        duration: 60,
        category: { connect: { id: serviceCategory.id } },
        providerId: provider.id,
        isActive: true,
      },
    });

    return await this.prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: provider.id,
        serviceId: service.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        totalAmount: 5000,
      },
    });
  }

  private async createTestProvider() {
    const user = await this.prisma.user.create({
      data: {
        email: `provider-${uuidv4()}@example.com`,
        name: 'Test Provider',
        password: 'test',
        role: 'PROVIDER',
        isVerified: true,
      },
    });

    return await this.prisma.provider.create({
      data: {
        userId: user.id,
        businessName: 'Test Barbershop',
        address: 'Test Address 123',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        postalCode: '1000',
        isVerified: true,
        subscriptionTier: 'BASIC',
      },
    });
  }

  private async createTestPaymentData() {
    const booking = await this.createTestBooking();
    return { booking };
  }

  private async cleanupTestBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (booking) {
      await this.prisma.payment.deleteMany({
        where: { bookingId },
      });
      
      await this.prisma.booking.delete({
        where: { id: bookingId },
      });

      if (booking.service) {
        await this.prisma.service.delete({
          where: { id: booking.service.id },
        });
      }

      const provider = await this.prisma.provider.findUnique({
        where: { id: booking.providerId },
      });
      
      const client = await this.prisma.user.findUnique({
        where: { id: booking.clientId },
      });

      if (provider) {
        await this.cleanupTestProvider(provider.id);
      }

      if (client) {
        await this.prisma.user.delete({
          where: { id: client.id },
        });
      }
    }
  }

  private async cleanupTestProvider(providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (provider) {
      await this.prisma.provider.delete({
        where: { id: providerId },
      });

      await this.prisma.user.delete({
        where: { id: provider.userId },
      });
    }
  }

  private async cleanupTestPaymentData(testData: { booking: any }) {
    await this.cleanupTestBooking(testData.booking.id);
  }
}

export default PaymentTestingService;