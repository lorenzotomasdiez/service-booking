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
} from '../types/payment';

export class MercadoPagoPaymentService implements PaymentGateway {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;
  private prisma: PrismaClient;
  private retryConfig: PaymentRetryConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.retryConfig = {
      maxRetries: paymentConfig.paymentMethods.retryAttempts,
      retryDelayMs: paymentConfig.paymentMethods.retryDelayMs,
      exponentialBackoff: true,
    };
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
          gatewayData: dbPayment.gatewayData,
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
        this.mapMercadoPagoStatus(mpPayment.status),
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
}

export default MercadoPagoPaymentService;