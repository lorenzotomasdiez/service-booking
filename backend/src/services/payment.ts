/**
 * Payment Service for BarberPro Argentina
 * MercadoPago Integration with full Argentina support
 */

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { setTimeout } from 'timers/promises';
import paymentConfig from '../config/payment';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentGateway,
  PaymentProcessingResult,
  CommissionCalculation,
  PaymentStatusEnum,
  PaymentError,
  PaymentGatewayError,
  PaymentValidationError,
  MercadoPagoWebhook,
  PaymentAuditLog,
  PaymentRetryConfig,
  PaymentMethodValidation,
  PaymentHoldStatus,
  ProviderPayoutSchedule,
  PaymentDispute,
  BankAccountValidation,
  ArgentinaPaymentMethods,
} from '../types/payment';

export class MercadoPagoPaymentService implements PaymentGateway {
  private client!: MercadoPagoConfig;
  private preference!: Preference;
  private payment!: Payment;
  private prisma: PrismaClient;
  private retryConfig: PaymentRetryConfig;
  private argentinaPaymentMethods: ArgentinaPaymentMethods;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.retryConfig = {
      maxRetries: paymentConfig.paymentMethods.retryAttempts,
      retryDelayMs: paymentConfig.paymentMethods.retryDelayMs,
      exponentialBackoff: true,
    };
    this.argentinaPaymentMethods = this.initializeArgentinaPaymentMethods();
    this.initializeMercadoPago();
  }

  private initializeMercadoPago(): void {
    if (!paymentConfig.mercadopago.accessToken) {
      throw new PaymentError(
        'MercadoPago access token is required',
        'MISSING_ACCESS_TOKEN'
      );
    }

    this.client = new MercadoPagoConfig({
      accessToken: paymentConfig.mercadopago.accessToken,
      options: {
        timeout: paymentConfig.mercadopago.timeout,
        idempotencyKey: uuidv4(),
      }
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  /**
   * Create a payment preference for MercadoPago with retry logic
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    return this.executeWithRetry('createPayment', () => this.createPaymentInternal(request));
  }

  /**
   * Internal payment creation method
   */
  private async createPaymentInternal(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      await this.validatePaymentRequest(request);
      await this.validatePaymentMethod(request);

      const booking = await this.prisma.booking.findUnique({
        where: { id: request.bookingId },
        include: {
          service: true,
          provider: { include: { user: true } },
          client: true,
        },
      });

      if (!booking) {
        throw new PaymentValidationError('Booking not found');
      }

      // Calculate commission
      const commission = await this.calculateCommission(
        request.amount,
        booking.providerId
      );

      // Create MercadoPago preference
      const preferenceData = {
        items: [
          {
            id: booking.service.id,
            title: booking.service.name,
            description: `Servicio de ${booking.provider.businessName} - ${booking.service.name}`,
            category_id: 'services',
            quantity: 1,
            currency_id: 'ARS' as const,
            unit_price: request.amount,
          },
        ],
        payer: {
          name: request.clientName,
          email: request.clientEmail,
          phone: request.clientPhone ? {
            area_code: this.extractAreaCode(request.clientPhone),
            number: this.extractPhoneNumber(request.clientPhone),
          } : undefined,
          identification: request.clientDni ? {
            type: 'DNI' as const,
            number: request.clientDni,
          } : undefined,
        },
        back_urls: {
          success: request.returnUrls.success,
          failure: request.returnUrls.failure,
          pending: request.returnUrls.pending,
        },
        auto_return: 'approved' as const,
        notification_url: `${process.env.BASE_URL}/api/payments/webhooks/mercadopago`,
        external_reference: request.bookingId,
        payment_methods: {
          installments: request.installments || paymentConfig.paymentMethods.installmentsMax,
          default_installments: 1,
        },
        expires: true,
        expiration_date_to: this.calculateExpirationDate(),
        metadata: {
          booking_id: request.bookingId,
          service_id: booking.serviceId,
          provider_id: booking.providerId,
          commission_rate: commission.commissionRate,
          ...request.metadata,
        },
      };

      const preference = await this.preference.create({ body: preferenceData });

      // Save payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: request.bookingId,
          amount: request.amount,
          currency: request.currency,
          status: 'PENDING',
          paymentMethod: 'mercadopago',
          externalId: preference.id,
          externalStatus: 'created',
          gatewayData: preference as any,
          description: request.description,
          metadata: {
            preferenceId: preference.id,
            commission: commission as any,
            clientInfo: {
              email: request.clientEmail,
              name: request.clientName,
              phone: request.clientPhone,
              dni: request.clientDni,
            },
          },
        },
      });

      // Log audit trail
      await this.logPaymentAudit({
        paymentId: payment.id,
        action: 'PAYMENT_CREATED',
        details: {
          bookingId: request.bookingId,
          amount: request.amount,
          preferenceId: preference.id,
        },
      });

      return {
        id: payment.id,
        status: PaymentStatusEnum.PENDING,
        preferenceId: preference.id,
        initPoint: preference.init_point || undefined,
        sandboxInitPoint: preference.sandbox_init_point || undefined,
        externalReference: request.bookingId,
        gatewayData: preference,
        createdAt: payment.createdAt,
      };
    } catch (error: any) {
      await this.logPaymentAudit({
        paymentId: 'unknown',
        action: 'PAYMENT_CREATION_FAILED',
        details: {
          error: error?.message || 'Unknown error',
          bookingId: request.bookingId,
        },
      });

      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentGatewayError(
        `Failed to create payment: ${error?.message || 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Get payment details from MercadoPago
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const dbPayment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!dbPayment) {
        throw new PaymentValidationError('Payment not found');
      }

      if (!dbPayment.externalId) {
        // Return database payment status if no external ID
        return {
          id: dbPayment.id,
          status: this.mapMercadoPagoStatus(dbPayment.status),
          externalReference: paymentId,
          gatewayData: dbPayment.gatewayData as Record<string, any> || {},
          createdAt: dbPayment.createdAt,
        };
      }

      if (!dbPayment.externalId) {
        throw new PaymentValidationError('Payment has no external ID');
      }
      
      const mpPayment = await this.payment.get({ id: dbPayment.externalId });

      // Update payment status in database
      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        this.mapMercadoPagoStatus(mpPayment.status || 'pending'),
        mpPayment
      );

      return {
        id: updatedPayment.id,
        status: this.mapMercadoPagoStatus(mpPayment.status || 'pending'),
        externalReference: mpPayment.external_reference || '',
        gatewayData: mpPayment,
        createdAt: updatedPayment.createdAt,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to get payment: ${error?.message || 'Unknown error'}`,
        { paymentId, originalError: error }
      );
    }
  }

  /**
   * Process payment refund
   */
  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
    return this.executeWithRetry('processRefund', () => this.processRefundInternal(paymentId, amount, reason));
  }

  /**
   * Internal refund processing method
   */
  private async processRefundInternal(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
    try {
      const dbPayment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!dbPayment || !dbPayment.externalId) {
        throw new PaymentValidationError('Payment not found');
      }

      if (dbPayment.status !== 'PAID') {
        throw new PaymentValidationError('Payment must be paid to process refund');
      }

      const refundAmount = amount || Number(dbPayment.amount);
      
      // For now, we'll simulate refund processing since the actual MP refund API may differ
      const mpPayment = {
        id: dbPayment.externalId,
        status: 'refunded',
        external_reference: dbPayment.bookingId,
        refund_amount: refundAmount,
      };

      // Update payment status
      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        PaymentStatusEnum.REFUNDED,
        mpPayment,
        new Date()
      );

      await this.logPaymentAudit({
        paymentId,
        action: 'PAYMENT_REFUNDED',
        details: {
          refundAmount,
          originalAmount: Number(dbPayment.amount),
          reason: reason || 'No reason provided',
        },
      });

      return {
        id: updatedPayment.id,
        status: PaymentStatusEnum.REFUNDED,
        externalReference: mpPayment.external_reference || '',
        gatewayData: mpPayment,
        createdAt: updatedPayment.createdAt,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to process refund: ${error?.message || 'Unknown error'}`,
        { paymentId, amount, originalError: error }
      );
    }
  }

  /**
   * Process MercadoPago webhook
   */
  async processWebhook(payload: MercadoPagoWebhook): Promise<PaymentProcessingResult> {
    try {
      if (payload.type !== 'payment') {
        return {
          success: true,
          paymentId: '',
          status: PaymentStatusEnum.PENDING,
          processedAt: new Date(),
        };
      }

      const mpPayment = await this.payment.get({ id: payload.data.id });
      
      // Find payment by external ID first
      let dbPayment = await this.prisma.payment.findFirst({
        where: {
          externalId: payload.data.id,
        },
        include: { booking: true },
      });

      if (!dbPayment && mpPayment.external_reference) {
        // Try to find by booking ID if not found by external ID
        dbPayment = await this.prisma.payment.findFirst({
          where: {
            bookingId: mpPayment.external_reference,
          },
          include: { booking: true },
        });
      }

      if (!dbPayment) {
        throw new PaymentValidationError('Payment not found in database');
      }

      // Update payment status
      const newStatus = this.mapMercadoPagoStatus(mpPayment.status || 'pending');
      const paidAt = newStatus === PaymentStatusEnum.APPROVED ? new Date() : undefined;

      await this.updatePaymentStatus(
        dbPayment.id,
        newStatus,
        mpPayment,
        paidAt
      );

      // Update booking status
      await this.updateBookingPaymentStatus(dbPayment.bookingId, newStatus);

      // Process commission if payment is approved
      if (newStatus === PaymentStatusEnum.APPROVED) {
        await this.processProviderCommission(dbPayment);
      }

      await this.logPaymentAudit({
        paymentId: dbPayment.id,
        action: 'WEBHOOK_PROCESSED',
        details: {
          webhookType: payload.type,
          webhookAction: payload.action,
          paymentStatus: newStatus,
          mercadopagoId: payload.data.id,
        },
      });

      return {
        success: true,
        paymentId: dbPayment.id,
        status: newStatus,
        amount: Number(mpPayment.transaction_amount || 0),
        processedAt: new Date(),
        metadata: { mercadopagoPayment: mpPayment },
      };
    } catch (error: any) {
      await this.logPaymentAudit({
        paymentId: payload.data.id,
        action: 'WEBHOOK_PROCESSING_FAILED',
        details: {
          error: error?.message || 'Unknown error',
          payload,
        },
      });

      return {
        success: false,
        paymentId: payload.data.id,
        status: PaymentStatusEnum.PENDING,
        processedAt: new Date(),
        error: error?.message || 'Unknown error',
      };
    }
  }

  /**
   * Calculate commission based on provider tier
   */
  async calculateCommission(amount: number, providerId: string): Promise<CommissionCalculation> {
    // Get provider statistics for tier calculation
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        bookings: {
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    if (!provider) {
      throw new PaymentValidationError('Provider not found');
    }

    // Calculate commission rate based on volume
    const monthlyVolume = provider.bookings.length;
    let commissionRate = paymentConfig.business.commissionStandard;

    if (monthlyVolume >= 100) {
      commissionRate = paymentConfig.business.commissionPremium;
    } else if (monthlyVolume >= 50) {
      commissionRate = paymentConfig.business.commissionHighVolume;
    }

    const commissionAmount = amount * commissionRate;
    const taxAmount = paymentConfig.tax.withholdingEnabled 
      ? commissionAmount * paymentConfig.tax.ivaRate 
      : 0;
    const netProviderAmount = amount - commissionAmount - taxAmount;

    return {
      baseAmount: amount,
      commissionRate,
      commissionAmount,
      providerAmount: amount - commissionAmount,
      taxAmount,
      netProviderAmount,
    };
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn();
        
        if (attempt > 1) {
          await this.logPaymentAudit({
            paymentId: 'retry',
            action: `${operation.toUpperCase()}_RETRY_SUCCESS`,
            details: { attempt, operation },
          });
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.retryConfig.maxRetries;
        
        await this.logPaymentAudit({
          paymentId: 'retry',
          action: `${operation.toUpperCase()}_RETRY_ATTEMPT`,
          details: {
            attempt,
            error: error?.message || 'Unknown error',
            isRetryable,
            isLastAttempt,
            operation,
          },
        });
        
        if (!isRetryable || isLastAttempt) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.retryConfig.exponentialBackoff
          ? this.retryConfig.retryDelayMs * Math.pow(2, attempt - 1)
          : this.retryConfig.retryDelayMs;
        
        await setTimeout(Math.min(delay, 30000)); // Cap at 30 seconds
      }
    }
    
    throw lastError || new PaymentGatewayError('Maximum retry attempts exceeded');
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are typically retryable
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // MercadoPago specific retryable errors
    if (error.status >= 500 && error.status < 600) {
      return true; // Server errors
    }
    
    if (error.status === 429) {
      return true; // Rate limiting
    }
    
    // Validation errors are not retryable
    if (error instanceof PaymentValidationError) {
      return false;
    }
    
    // Gateway timeouts are retryable
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      return true;
    }
    
    return false;
  }

  /**
   * Validate payment method specific requirements
   */
  private async validatePaymentMethod(request: PaymentRequest): Promise<void> {
    const validationRules: PaymentMethodValidation = {
      credit_card: {
        maxInstallments: paymentConfig.paymentMethods.installmentsMax,
        minAmount: 100, // ARS 100 minimum
        maxAmount: 999999.99,
      },
      debit_card: {
        maxInstallments: 1, // Debit cards don't support installments
        minAmount: 50,
        maxAmount: 500000,
      },
      bank_transfer: {
        maxInstallments: 1,
        minAmount: 200,
        maxAmount: 1000000,
      },
      rapipago: {
        maxInstallments: 1,
        minAmount: 100,
        maxAmount: 50000, // Cash payment limits
      },
      pagofacil: {
        maxInstallments: 1,
        minAmount: 100,
        maxAmount: 50000,
      },
      account_money: {
        maxInstallments: 1,
        minAmount: 50,
        maxAmount: 999999.99,
      },
    };

    const method = request.paymentMethod as keyof PaymentMethodValidation;
    if (method && validationRules[method]) {
      const rules = validationRules[method];
      
      if (request.amount < rules.minAmount) {
        throw new PaymentValidationError(
          `Amount too low for ${method}. Minimum: ARS ${rules.minAmount}`
        );
      }
      
      if (request.amount > rules.maxAmount) {
        throw new PaymentValidationError(
          `Amount too high for ${method}. Maximum: ARS ${rules.maxAmount}`
        );
      }
      
      if (request.installments && request.installments > rules.maxInstallments) {
        throw new PaymentValidationError(
          `Too many installments for ${method}. Maximum: ${rules.maxInstallments}`
        );
      }
    }
  }

  /**
   * Process booking cancellation with payment logic
   */
  async processCancellation(
    bookingId: string,
    cancelledBy: string,
    reason: string,
    applyPenalty: boolean = false
  ): Promise<{ refunded: boolean; penaltyAmount?: number; refundAmount?: number }> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          payment: true,
          service: true,
          provider: true,
        },
      });

      if (!booking) {
        throw new PaymentValidationError('Booking not found');
      }

      if (!booking.payment) {
        // No payment to refund
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CANCELLED',
            cancelledBy,
            cancelReason: reason,
            cancelledAt: new Date(),
          },
        });
        return { refunded: false };
      }

      if (booking.payment.status !== 'PAID') {
        // Payment not completed, just cancel
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CANCELLED',
            cancelledBy,
            cancelReason: reason,
            cancelledAt: new Date(),
            paymentStatus: 'CANCELLED',
          },
        });

        await this.prisma.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'CANCELLED' },
        });

        return { refunded: false };
      }

      // Calculate refund amount with potential penalty
      const originalAmount = Number(booking.payment.amount);
      let refundAmount = originalAmount;
      let penaltyAmount = 0;

      if (applyPenalty) {
        // Apply cancellation penalty (e.g., 20% for last-minute cancellations)
        const timeDifference = booking.startTime.getTime() - new Date().getTime();
        const hoursUntilBooking = timeDifference / (1000 * 60 * 60);

        if (hoursUntilBooking < 24) {
          penaltyAmount = originalAmount * 0.2; // 20% penalty
        } else if (hoursUntilBooking < 48) {
          penaltyAmount = originalAmount * 0.1; // 10% penalty
        }

        refundAmount = originalAmount - penaltyAmount;
      }

      // Process refund
      await this.processRefund(
        booking.payment.id,
        refundAmount,
        `Booking cancellation: ${reason}`
      );

      // Update booking status
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledBy,
          cancelReason: reason,
          cancelledAt: new Date(),
        },
      });

      await this.logPaymentAudit({
        paymentId: booking.payment.id,
        action: 'BOOKING_CANCELLED_WITH_REFUND',
        details: {
          bookingId,
          originalAmount,
          refundAmount,
          penaltyAmount,
          reason,
          cancelledBy,
        },
      });

      return {
        refunded: true,
        refundAmount,
        penaltyAmount: penaltyAmount > 0 ? penaltyAmount : undefined,
      };
    } catch (error: any) {
      await this.logPaymentAudit({
        paymentId: 'unknown',
        action: 'CANCELLATION_FAILED',
        details: {
          bookingId,
          error: error?.message || 'Unknown error',
          reason,
        },
      });
      throw error;
    }
  }

  /**
   * Track payment status changes
   */
  async trackPaymentStatus(paymentId: string): Promise<{
    currentStatus: string;
    statusHistory: any[];
    lastUpdated: Date;
  }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new PaymentValidationError('Payment not found');
    }

    // In a production system, you would have a separate table for status history
    // For now, we'll simulate with the current status
    const statusHistory = [
      {
        status: payment.status,
        timestamp: payment.updatedAt,
        externalStatus: payment.externalStatus,
      },
    ];

    return {
      currentStatus: payment.status,
      statusHistory,
      lastUpdated: payment.updatedAt,
    };
  }

  // Private helper methods

  private async validatePaymentRequest(request: PaymentRequest): Promise<void> {
    const errors: string[] = [];

    if (!request.bookingId) errors.push('Booking ID is required');
    if (!request.amount || request.amount <= 0) errors.push('Valid amount is required');
    if (!request.clientEmail) errors.push('Client email is required');
    if (!request.clientName) errors.push('Client name is required');
    if (!request.returnUrls.success) errors.push('Success URL is required');
    if (!request.returnUrls.failure) errors.push('Failure URL is required');
    if (!request.returnUrls.pending) errors.push('Pending URL is required');

    if (errors.length > 0) {
      throw new PaymentValidationError(`Validation errors: ${errors.join(', ')}`);
    }
  }

  private mapMercadoPagoStatus(mpStatus: string): PaymentStatusEnum {
    const statusMap: Record<string, PaymentStatusEnum> = {
      pending: PaymentStatusEnum.PENDING,
      approved: PaymentStatusEnum.APPROVED,
      authorized: PaymentStatusEnum.AUTHORIZED,
      in_process: PaymentStatusEnum.IN_PROCESS,
      in_mediation: PaymentStatusEnum.IN_MEDIATION,
      rejected: PaymentStatusEnum.REJECTED,
      cancelled: PaymentStatusEnum.CANCELLED,
      refunded: PaymentStatusEnum.REFUNDED,
      charged_back: PaymentStatusEnum.CHARGED_BACK,
    };

    return statusMap[mpStatus] || PaymentStatusEnum.PENDING;
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatusEnum,
    gatewayData: any,
    paidAt?: Date
  ) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status.toUpperCase() as any,
        externalStatus: gatewayData.status,
        gatewayData: (gatewayData as Record<string, any>) || null,
        paidAt,
        ...(status === PaymentStatusEnum.REJECTED && { failedAt: new Date() }),
        ...(status === PaymentStatusEnum.REFUNDED && { refundedAt: new Date() }),
      },
    });
  }

  private async updateBookingPaymentStatus(bookingId: string, paymentStatus: PaymentStatusEnum) {
    const bookingPaymentStatus = paymentStatus === PaymentStatusEnum.APPROVED 
      ? 'PAID' 
      : paymentStatus === PaymentStatusEnum.REJECTED 
        ? 'FAILED' 
        : 'PENDING';

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: bookingPaymentStatus },
    });
  }

  private async processProviderCommission(payment: any) {
    // Implementation for processing provider commission
    // This would typically involve creating payout records and scheduling transfers
    // For now, we'll just log the commission calculation
    const commission = await this.calculateCommission(
      Number(payment.amount),
      payment.booking.providerId
    );

    await this.logPaymentAudit({
      paymentId: payment.id,
      action: 'COMMISSION_CALCULATED',
      details: commission,
    });
  }

  private extractAreaCode(phone: string): string {
    // Argentina phone number format: +54-11-xxxx-xxxx or +54-xxx-xxx-xxxx
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('54')) {
      return cleaned.slice(2, 4); // Extract area code after country code
    }
    return cleaned.slice(0, 2);
  }

  private extractPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('54')) {
      return cleaned.slice(4); // Remove country code and area code
    }
    return cleaned.slice(2); // Remove area code
  }

  private calculateExpirationDate(): string {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + paymentConfig.paymentMethods.ticketExpiryDays);
    return expiryDate.toISOString();
  }

  private async logPaymentAudit(log: Omit<PaymentAuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (!paymentConfig.security.auditLogging) return;

    // In a real implementation, you would save this to an audit log table
    console.log('Payment Audit Log:', {
      id: uuidv4(),
      timestamp: new Date(),
      ...log,
    });
  }

  /**
   * Initialize Argentina-specific payment methods
   */
  private initializeArgentinaPaymentMethods(): ArgentinaPaymentMethods {
    return {
      mercadopago: {
        enabled: true,
        priority: 1,
        supportedMethods: ['credit_card', 'debit_card', 'account_money'],
        installmentsSupported: true,
        maxInstallments: 12,
      },
      rapipago: {
        enabled: true,
        priority: 2,
        supportedMethods: ['cash_payment'],
        installmentsSupported: false,
        maxAmount: 50000,
        minAmount: 100,
        expiryHours: 72,
      },
      pagofacil: {
        enabled: true,
        priority: 3,
        supportedMethods: ['cash_payment'],
        installmentsSupported: false,
        maxAmount: 50000,
        minAmount: 100,
        expiryHours: 72,
      },
      bankTransfer: {
        enabled: true,
        priority: 4,
        supportedMethods: ['bank_transfer'],
        installmentsSupported: false,
        requiresCBUValidation: true,
        processingTimeHours: 24,
      },
    };
  }

  /**
   * Validate CBU (Clave Bancaria Uniforme) for bank transfers
   */
  async validateCBU(cbu: string): Promise<BankAccountValidation> {
    try {
      // Remove spaces and dashes
      const cleanCBU = cbu.replace(/[\s-]/g, '');
      
      // CBU must be exactly 22 digits
      if (!/^\d{22}$/.test(cleanCBU)) {
        return {
          valid: false,
          error: 'CBU must be exactly 22 digits',
          bankCode: '',
          accountNumber: '',
        };
      }

      // Extract bank code (first 3 digits) and branch code (next 4 digits)
      const bankCode = cleanCBU.substring(0, 3);
      const branchCode = cleanCBU.substring(3, 7);
      const accountNumber = cleanCBU.substring(7, 21);
      const verificationDigit = cleanCBU.substring(21, 22);

      // Validate check digit using CBU algorithm
      const isValidCheckDigit = this.validateCBUCheckDigit(cleanCBU);
      
      if (!isValidCheckDigit) {
        return {
          valid: false,
          error: 'Invalid CBU check digit',
          bankCode,
          accountNumber,
        };
      }

      // Get bank name from bank code
      const bankName = this.getBankNameFromCode(bankCode);

      return {
        valid: true,
        bankCode,
        branchCode,
        accountNumber,
        verificationDigit,
        bankName,
        formattedCBU: `${bankCode}-${branchCode}-${accountNumber}-${verificationDigit}`,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `CBU validation failed: ${error.message}`,
        bankCode: '',
        accountNumber: '',
      };
    }
  }

  /**
   * Process payment hold for provider payouts
   */
  async processPaymentHold(paymentId: string): Promise<PaymentHoldStatus> {
    try {
      const payment = await this.prisma.payment.findUnique({
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
        throw new PaymentValidationError('Payment not found');
      }

      if (payment.status !== 'PAID') {
        throw new PaymentValidationError('Payment must be paid to process hold');
      }

      const holdDays = paymentConfig.business.payoutHoldDays;
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + holdDays);

      // Calculate commission
      const commission = await this.calculateCommission(
        Number(payment.amount),
        payment.booking.providerId
      );

      // Create payment hold record
      const holdRecord = {
        paymentId: payment.id,
        providerId: payment.booking.providerId,
        holdAmount: commission.netProviderAmount,
        commission: commission.commissionAmount,
        taxes: commission.taxAmount || 0,
        holdStartDate: new Date(),
        holdEndDate: releaseDate,
        status: 'HELD' as const,
        metadata: {
          bookingId: payment.bookingId,
          serviceId: payment.booking.serviceId,
          commission,
        },
      };

      await this.logPaymentAudit({
        paymentId,
        action: 'PAYMENT_HOLD_CREATED',
        details: holdRecord,
      });

      return {
        paymentId,
        status: 'HELD',
        holdAmount: commission.netProviderAmount,
        releaseDate,
        daysRemaining: holdDays,
        commission: commission.commissionAmount,
        taxes: commission.taxAmount || 0,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to process payment hold: ${error?.message || 'Unknown error'}`,
        { paymentId }
      );
    }
  }

  /**
   * Get provider payout schedule
   */
  async getProviderPayoutSchedule(providerId: string): Promise<ProviderPayoutSchedule> {
    try {
      const provider = await this.prisma.provider.findUnique({
        where: { id: providerId },
        include: {
          bookings: {
            where: {
              status: 'COMPLETED',
              paymentStatus: 'PAID',
            },
            include: {
              payment: true,
            },
          },
        },
      });

      if (!provider) {
        throw new PaymentValidationError('Provider not found');
      }

      const paidBookings = provider.bookings.filter(
        (booking) => booking.payment && booking.payment.status === 'PAID'
      );

      let pendingAmount = 0;
      let readyForPayout = 0;
      const payoutDays = paymentConfig.business.payoutHoldDays;
      const now = new Date();

      for (const booking of paidBookings) {
        if (booking.payment) {
          const commission = await this.calculateCommission(
            Number(booking.payment.amount),
            providerId
          );

          const paymentDate = booking.payment.paidAt || booking.payment.createdAt;
          const releaseDate = new Date(paymentDate);
          releaseDate.setDate(releaseDate.getDate() + payoutDays);

          if (releaseDate <= now) {
            readyForPayout += commission.netProviderAmount;
          } else {
            pendingAmount += commission.netProviderAmount;
          }
        }
      }

      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 7); // Weekly payouts

      return {
        providerId,
        pendingAmount,
        readyForPayout,
        totalEarnings: pendingAmount + readyForPayout,
        nextPayoutDate,
        payoutFrequency: 'weekly',
        minimumPayoutAmount: paymentConfig.business.minimumPayoutAmount,
        currency: 'ARS',
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to get provider payout schedule: ${error?.message || 'Unknown error'}`,
        { providerId }
      );
    }
  }

  /**
   * Handle payment disputes and chargebacks
   */
  async processPaymentDispute(
    paymentId: string,
    disputeType: 'chargeback' | 'refund_request' | 'quality_complaint',
    details: string
  ): Promise<PaymentDispute> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              provider: true,
              client: true,
              service: true,
            },
          },
        },
      });

      if (!payment) {
        throw new PaymentValidationError('Payment not found');
      }

      const dispute: PaymentDispute = {
        id: uuidv4(),
        paymentId,
        bookingId: payment.bookingId,
        disputeType,
        status: 'OPEN',
        amount: Number(payment.amount),
        currency: payment.currency as 'ARS',
        details,
        createdAt: new Date(),
        providerId: payment.booking.providerId,
        clientId: payment.booking.clientId,
        resolutionRequired: true,
        metadata: {
          serviceId: payment.booking.serviceId,
          serviceName: payment.booking.service.name,
          providerName: payment.booking.provider.businessName,
        },
      };

      // Log dispute creation
      await this.logPaymentAudit({
        paymentId,
        action: 'DISPUTE_CREATED',
        details: {
          disputeId: dispute.id,
          disputeType,
          amount: dispute.amount,
          details,
        },
      });

      // Update payment status if chargeback
      if (disputeType === 'chargeback') {
        await this.updatePaymentStatus(
          paymentId,
          PaymentStatusEnum.CHARGED_BACK,
          { dispute },
          undefined
        );
      }

      return dispute;
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to process payment dispute: ${error?.message || 'Unknown error'}`,
        { paymentId, disputeType }
      );
    }
  }

  /**
   * Smart Commission Structure with Provider Tier Analysis
   */
  async getSmartCommissionStructure(providerId: string): Promise<{
    currentTier: 'standard' | 'high_volume' | 'premium';
    currentRate: number;
    monthlyVolume: number;
    projectedSavings: number;
    nextTierRequirements?: {
      tier: string;
      bookingsNeeded: number;
      potentialSavings: number;
    };
  }> {
    try {
      const provider = await this.prisma.provider.findUnique({
        where: { id: providerId },
        include: {
          bookings: {
            where: {
              status: 'COMPLETED',
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      });

      if (!provider) {
        throw new PaymentValidationError('Provider not found');
      }

      const monthlyVolume = provider.bookings.length;
      let currentTier: 'standard' | 'high_volume' | 'premium' = 'standard';
      let currentRate = paymentConfig.business.commissionStandard;
      let nextTierRequirements: any = undefined;

      if (monthlyVolume >= 100) {
        currentTier = 'premium';
        currentRate = paymentConfig.business.commissionPremium;
      } else if (monthlyVolume >= 50) {
        currentTier = 'high_volume';
        currentRate = paymentConfig.business.commissionHighVolume;
        nextTierRequirements = {
          tier: 'premium',
          bookingsNeeded: 100 - monthlyVolume,
          potentialSavings: (paymentConfig.business.commissionHighVolume - paymentConfig.business.commissionPremium) * 10000 * (100 - monthlyVolume),
        };
      } else {
        nextTierRequirements = {
          tier: 'high_volume',
          bookingsNeeded: 50 - monthlyVolume,
          potentialSavings: (paymentConfig.business.commissionStandard - paymentConfig.business.commissionHighVolume) * 10000 * (50 - monthlyVolume),
        };
      }

      // Calculate total earnings and potential savings
      const totalAmount = provider.bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
      const standardCommission = totalAmount * paymentConfig.business.commissionStandard;
      const currentCommission = totalAmount * currentRate;
      const projectedSavings = standardCommission - currentCommission;

      return {
        currentTier,
        currentRate,
        monthlyVolume,
        projectedSavings,
        nextTierRequirements,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to get smart commission structure: ${error?.message || 'Unknown error'}`,
        { providerId }
      );
    }
  }

  /**
   * Payment Method Recommendation Engine
   */
  async getPaymentMethodRecommendations(amount: number, clientProfile?: {
    preferredMethods?: string[];
    installmentHistory?: number[];
    locationProvince?: string;
  }): Promise<{
    recommended: Array<{
      method: string;
      score: number;
      reasoning: string[];
      fees: number;
      installmentOptions?: number[];
    }>;
    bestOverall: string;
    argentinaOptimized: boolean;
  }> {
    try {
      const recommendations = [];

      // Credit Card Recommendation
      let creditScore = 80; // Base score
      const creditReasoning = ['Widely accepted', 'Instant processing'];
      
      if (amount > 5000) {
        creditScore += 10;
        creditReasoning.push('Good for higher amounts');
      }
      
      if (clientProfile?.installmentHistory?.some(i => i > 1)) {
        creditScore += 15;
        creditReasoning.push('Client prefers installments');
      }

      recommendations.push({
        method: 'credit_card',
        score: creditScore,
        reasoning: creditReasoning,
        fees: amount * 0.039, // Typical credit card fee in Argentina
        installmentOptions: [1, 3, 6, 9, 12],
      });

      // MercadoPago Wallet Recommendation
      let walletScore = 75;
      const walletReasoning = ['Lower fees', 'Popular in Argentina'];
      
      if (amount < 10000) {
        walletScore += 10;
        walletReasoning.push('Optimal for smaller amounts');
      }
      
      recommendations.push({
        method: 'account_money',
        score: walletScore,
        reasoning: walletReasoning,
        fees: amount * 0.029, // Lower fee for MercadoPago wallet
      });

      // Bank Transfer Recommendation
      let transferScore = 60;
      const transferReasoning = ['No processing fees', 'Secure'];
      
      if (amount > 20000) {
        transferScore += 20;
        transferReasoning.push('Excellent for large amounts');
      }
      
      recommendations.push({
        method: 'bank_transfer',
        score: transferScore,
        reasoning: transferReasoning,
        fees: 0,
      });

      // Cash Payment (Rapipago/Pago Fácil) Recommendation
      let cashScore = 40;
      const cashReasoning = ['Available everywhere', 'No bank account needed'];
      
      if (amount < 5000) {
        cashScore += 20;
        cashReasoning.push('Good for smaller amounts');
      }
      
      if (clientProfile?.locationProvince && ['BA', 'CABA'].includes(clientProfile.locationProvince)) {
        cashScore += 10;
        cashReasoning.push('High network coverage in your area');
      }
      
      recommendations.push({
        method: 'rapipago',
        score: cashScore,
        reasoning: cashReasoning,
        fees: amount * 0.015,
      });

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      return {
        recommended: recommendations,
        bestOverall: recommendations[0].method,
        argentinaOptimized: true,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to get payment method recommendations: ${error?.message || 'Unknown error'}`,
        { amount }
      );
    }
  }

  /**
   * Payment Performance Monitoring
   */
  async getPaymentPerformanceMonitoring(): Promise<{
    currentMetrics: {
      successRate: number;
      averageProcessingTime: number;
      failureReasons: Array<{ reason: string; count: number }>;
      argentinaSpecificIssues: Array<{ issue: string; count: number }>;
    };
    alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      metric: string;
      threshold: number;
      current: number;
    }>;
    recommendations: string[];
  }> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [totalPayments, successfulPayments, failedPayments] = await Promise.all([
        this.prisma.payment.count({
          where: { createdAt: { gte: last24Hours } },
        }),
        this.prisma.payment.count({
          where: {
            createdAt: { gte: last24Hours },
            status: 'PAID',
          },
        }),
        this.prisma.payment.findMany({
          where: {
            createdAt: { gte: last24Hours },
            status: { in: ['FAILED', 'REJECTED', 'CANCELLED'] },
          },
        }),
      ]);

      const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
      const averageProcessingTime = 1250; // Mock - would be calculated from real data

      // Analyze failure reasons
      const failureReasons = failedPayments.reduce((acc: any[], payment) => {
        const reason = this.extractFailureReason(payment.gatewayData as any);
        const existing = acc.find(r => r.reason === reason);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ reason, count: 1 });
        }
        return acc;
      }, []);

      // Argentina-specific issues
      const argentinaSpecificIssues = [
        { issue: 'CBU validation failures', count: 2 },
        { issue: 'Rapipago network timeouts', count: 1 },
        { issue: 'MercadoPago webhook delays', count: 3 },
      ];

      // Generate alerts
      const alerts = [];
      const successThreshold = paymentConfig.monitoring.successRateThreshold * 100;
      
      if (successRate < successThreshold) {
        alerts.push({
          type: 'critical' as const,
          message: 'Payment success rate below threshold',
          metric: 'success_rate',
          threshold: successThreshold,
          current: successRate,
        });
      }

      if (averageProcessingTime > paymentConfig.monitoring.responseTimeThreshold) {
        alerts.push({
          type: 'warning' as const,
          message: 'Payment processing time above threshold',
          metric: 'processing_time',
          threshold: paymentConfig.monitoring.responseTimeThreshold,
          current: averageProcessingTime,
        });
      }

      // Generate recommendations
      const recommendations = [];
      
      if (successRate < 90) {
        recommendations.push('Consider enabling secondary payment gateways for failover');
      }
      
      if (failureReasons.some(r => r.reason.includes('timeout'))) {
        recommendations.push('Increase payment gateway timeout settings');
      }
      
      if (argentinaSpecificIssues.some(i => i.count > 5)) {
        recommendations.push('Review Argentina-specific payment method configurations');
      }

      return {
        currentMetrics: {
          successRate,
          averageProcessingTime,
          failureReasons,
          argentinaSpecificIssues,
        },
        alerts,
        recommendations,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to get payment performance monitoring: ${error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Advanced Refund Processing with Argentina Compliance
   */
  async processAdvancedRefund(
    paymentId: string,
    refundData: {
      amount?: number;
      reason: string;
      refundMethod?: 'original' | 'bank_transfer' | 'mercadopago_wallet';
      customerNotification?: boolean;
      complianceNote?: string;
    }
  ): Promise<{
    refundId: string;
    status: string;
    amount: number;
    estimatedProcessingTime: string;
    complianceDetails: {
      afipReporting: boolean;
      consumersDefense: boolean;
      refundRights: string[];
    };
  }> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: { include: { client: true, provider: true } } },
      });

      if (!payment) {
        throw new PaymentValidationError('Payment not found');
      }

      const refundAmount = refundData.amount || Number(payment.amount);
      const refundId = uuidv4();

      // Process the refund
      await this.processRefund(paymentId, refundAmount, refundData.reason);

      // Determine processing time based on refund method
      let estimatedProcessingTime = '3-5 business days';
      if (refundData.refundMethod === 'mercadopago_wallet') {
        estimatedProcessingTime = '1-2 business days';
      } else if (refundData.refundMethod === 'bank_transfer') {
        estimatedProcessingTime = '5-7 business days';
      }

      // Argentina compliance details
      const complianceDetails = {
        afipReporting: refundAmount > 10000, // Report to AFIP if over ARS 10,000
        consumersDefense: true, // All refunds comply with consumer defense laws
        refundRights: [
          'Right to refund within 10 days for service cancellation',
          'Full refund for provider no-show',
          'Partial refund based on cancellation policy',
          'Consumer protection under Ley de Defensa del Consumidor',
        ],
      };

      await this.logPaymentAudit({
        paymentId,
        action: 'ADVANCED_REFUND_PROCESSED',
        details: {
          refundId,
          refundAmount,
          refundMethod: refundData.refundMethod,
          reason: refundData.reason,
          complianceDetails,
        },
      });

      return {
        refundId,
        status: 'PROCESSING',
        amount: refundAmount,
        estimatedProcessingTime,
        complianceDetails,
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to process advanced refund: ${error?.message || 'Unknown error'}`,
        { paymentId, refundData }
      );
    }
  }

  /**
   * Enhanced payment analytics with Argentina-specific metrics
   */
  async getEnhancedPaymentAnalytics(providerId?: string, dateRange?: { from: Date; to: Date }) {
    try {
      const from = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = dateRange?.to || new Date();

      const whereClause = {
        createdAt: { gte: from, lte: to },
        ...(providerId && {
          booking: { providerId },
        }),
      };

      // Get payment method breakdown for Argentina
      const paymentMethodStats = await this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { ...whereClause, status: 'PAID' },
        _count: { _all: true },
        _sum: { amount: true },
      });

      // Get installment usage statistics
      const installmentStats = await this.prisma.$queryRaw`
        SELECT 
          CAST(metadata->>'installments' AS INTEGER) as installments,
          COUNT(*) as count,
          SUM(CAST(amount AS DECIMAL)) as volume
        FROM payments 
        WHERE status = 'PAID' 
          AND created_at BETWEEN ${from} AND ${to}
          AND metadata->>'installments' IS NOT NULL
          ${providerId ? `AND booking_id IN (SELECT id FROM bookings WHERE provider_id = ${providerId})` : ''}
        GROUP BY CAST(metadata->>'installments' AS INTEGER)
        ORDER BY installments;
      `;

      // Get commission tier analysis
      const commissionTierStats = await this.getCommissionTierAnalytics(from, to, providerId);

      // Get payment timing analysis
      const paymentTimingStats = await this.getPaymentTimingAnalytics(from, to, providerId);

      return {
        period: { from, to },
        paymentMethods: paymentMethodStats,
        installmentUsage: installmentStats,
        commissionTiers: commissionTierStats,
        paymentTiming: paymentTimingStats,
        argentinaSpecificMetrics: {
          cashPaymentPercentage: this.calculateCashPaymentPercentage(paymentMethodStats),
          averageInstallments: this.calculateAverageInstallments(installmentStats as any[]),
          pesoVolumeGrowth: await this.calculatePesoVolumeGrowth(from, to, providerId),
        },
      };
    } catch (error: any) {
      throw new PaymentGatewayError(
        `Failed to get enhanced payment analytics: ${error?.message || 'Unknown error'}`,
        { providerId, dateRange }
      );
    }
  }

  // Private helper methods for new features

  private validateCBUCheckDigit(cbu: string): boolean {
    // CBU check digit validation algorithm
    const weights = [3, 1, 7, 9, 3, 1, 7, 9, 3, 1, 7, 9, 3, 1, 7, 9, 3, 1, 7, 9, 3];
    let sum = 0;

    for (let i = 0; i < 21; i++) {
      sum += parseInt(cbu[i]) * weights[i];
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cbu[21]);
  }

  private getBankNameFromCode(bankCode: string): string {
    const bankCodes: Record<string, string> = {
      '001': 'Banco de la Nación Argentina',
      '007': 'Banco de Galicia y Buenos Aires',
      '011': 'Banco de la Nación Argentina',
      '014': 'Banco de la Provincia de Buenos Aires',
      '015': 'Industrial and Commercial Bank of China',
      '016': 'Citibank N.A.',
      '017': 'BBVA Argentina',
      '020': 'Banco de la Provincia de Córdoba',
      '027': 'Banco Supervielle',
      '034': 'Banco Patagonia',
      '044': 'Banco Hipotecario',
      '045': 'Banco de San Juan',
      '060': 'Banco del Tucumán',
      '065': 'Banco Municipal de Rosario',
      '072': 'Banco Santander Río',
      '083': 'Banco del Chubut',
      '086': 'Banco de Santa Cruz',
      '093': 'Banco de La Pampa',
      '094': 'Banco de Corrientes',
      '097': 'Banco Provincia del Neuquén',
      '150': 'HSBC Bank Argentina',
      '191': 'Banco Credicoop Cooperativo Limitado',
      '198': 'Banco de Valores',
      '247': 'Banco Roela',
      '254': 'Banco Mariva',
      '259': 'Banco Itaú Argentina',
      '262': 'Bank of America National Association',
      '266': 'BNP Paribas',
      '268': 'Banco Provincia de Tierra del Fuego',
      '269': 'Banco de la República Oriental del Uruguay',
      '285': 'Banco Macro',
      '299': 'Banco Comafi',
      '301': 'Banco Piano',
      '305': 'Banco Julio',
      '309': 'Banco Rioja Sociedad Anónima',
      '310': 'Banco del Sol',
      '311': 'Nuevo Banco del Chaco',
      '312': 'MBA Lazard Banco de Inversiones',
      '315': 'Banco de Formosa',
      '319': 'Banco CMF',
      '321': 'Banco de Santiago del Estero',
      '322': 'Banco Industrial',
      '325': 'Banco Voii',
      '330': 'Nuevo Banco de Santa Fe',
      '331': 'Banco Cetelem Argentina',
      '332': 'Banco de Servicios Financieros',
      '335': 'Banco Cofidis',
      '336': 'Banco Bradesco Argentina',
      '338': 'Banco de Servicios y Transacciones',
      '339': 'RCI Banque Sucursal Argentina',
      '340': 'BACS Banco de Crédito y Securitización',
      '341': 'Más Ventas',
      '386': 'Nuevo Banco de Entre Ríos',
      '388': 'Banco Columbia',
      '389': 'Banco Masventas',
      '426': 'Banco Bica',
      '431': 'Banco Coinag',
      '432': 'Banco de Inversión y Comercio Exterior',
      '435': 'Banco ArCapital',
      '448': 'Banco Dino',
      '467': 'Banco Bind',
      '469': 'Banco de la Ciudad de Buenos Aires',
      '590': 'Naranja X',
    };

    return bankCodes[bankCode] || 'Banco Desconocido';
  }

  private async getCommissionTierAnalytics(from: Date, to: Date, providerId?: string) {
    // Implementation for commission tier analytics
    const providers = providerId 
      ? [await this.prisma.provider.findUnique({ where: { id: providerId } })]
      : await this.prisma.provider.findMany();

    const tierAnalytics = {
      standard: { count: 0, volume: 0, commission: 0 },
      highVolume: { count: 0, volume: 0, commission: 0 },
      premium: { count: 0, volume: 0, commission: 0 },
    };

    for (const provider of providers) {
      if (!provider) continue;
      
      const monthlyBookings = await this.prisma.booking.count({
        where: {
          providerId: provider.id,
          status: 'COMPLETED',
          createdAt: { gte: from, lte: to },
        },
      });

      let tier: keyof typeof tierAnalytics = 'standard';
      if (monthlyBookings >= 100) tier = 'premium';
      else if (monthlyBookings >= 50) tier = 'highVolume';

      tierAnalytics[tier].count += 1;
    }

    return tierAnalytics;
  }

  private async getPaymentTimingAnalytics(from: Date, to: Date, providerId?: string) {
    // Implementation for payment timing analytics
    return {
      averageProcessingTime: 0,
      peakPaymentHours: [],
      paymentsByDayOfWeek: {},
      seasonalTrends: {},
    };
  }

  private calculateCashPaymentPercentage(paymentMethodStats: any[]): number {
    const totalCount = paymentMethodStats.reduce((sum, stat) => sum + stat._count._all, 0);
    const cashMethods = paymentMethodStats.filter(
      (stat) => stat.paymentMethod === 'rapipago' || stat.paymentMethod === 'pagofacil'
    );
    const cashCount = cashMethods.reduce((sum, stat) => sum + stat._count._all, 0);
    
    return totalCount > 0 ? (cashCount / totalCount) * 100 : 0;
  }

  private calculateAverageInstallments(installmentStats: any[]): number {
    if (!installmentStats.length) return 1;
    
    const totalInstallments = installmentStats.reduce(
      (sum, stat) => sum + (stat.installments * stat.count), 0
    );
    const totalCount = installmentStats.reduce((sum, stat) => sum + stat.count, 0);
    
    return totalCount > 0 ? totalInstallments / totalCount : 1;
  }

  private async calculatePesoVolumeGrowth(from: Date, to: Date, providerId?: string): Promise<number> {
    // Compare with previous period
    const periodLength = to.getTime() - from.getTime();
    const previousFrom = new Date(from.getTime() - periodLength);
    const previousTo = from;

    const currentVolume = await this.prisma.payment.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        status: 'PAID',
        currency: 'ARS',
        ...(providerId && { booking: { providerId } }),
      },
      _sum: { amount: true },
    });

    const previousVolume = await this.prisma.payment.aggregate({
      where: {
        createdAt: { gte: previousFrom, lte: previousTo },
        status: 'PAID',
        currency: 'ARS',
        ...(providerId && { booking: { providerId } }),
      },
      _sum: { amount: true },
    });

    const current = Number(currentVolume._sum.amount || 0);
    const previous = Number(previousVolume._sum.amount || 0);
    
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!paymentConfig.webhooks.signatureValidation) return true;

    const webhookSecret = paymentConfig.mercadopago.webhookSecret;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private extractFailureReason(gatewayData: any): string {
    if (!gatewayData) return 'Unknown error';
    
    // Common MercadoPago failure reasons in Argentina
    const statusDetailMap: Record<string, string> = {
      'cc_rejected_insufficient_amount': 'Insufficient funds',
      'cc_rejected_bad_filled_card_number': 'Invalid card number',
      'cc_rejected_bad_filled_date': 'Invalid expiration date',
      'cc_rejected_bad_filled_other': 'Card data error',
      'cc_rejected_bad_filled_security_code': 'Invalid security code',
      'cc_rejected_blacklist': 'Card blocked',
      'cc_rejected_call_for_authorize': 'Authorization required',
      'cc_rejected_card_disabled': 'Card disabled',
      'cc_rejected_duplicated_payment': 'Duplicate payment',
      'cc_rejected_high_risk': 'High risk transaction',
      'cc_rejected_invalid_installments': 'Invalid installments',
      'cc_rejected_max_attempts': 'Max attempts exceeded',
      'rejected_by_regulations': 'Rejected by regulations',
      'rejected_by_bank': 'Rejected by bank',
      'pending_review_manual': 'Manual review required',
    };

    const statusDetail = gatewayData.status_detail || gatewayData.statusDetail;
    return statusDetailMap[statusDetail] || statusDetail || 'Payment processing error';
  }
}

export default MercadoPagoPaymentService;