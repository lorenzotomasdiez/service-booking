/**
 * Decidir Payment Service for BarberPro Argentina
 * First Data's Argentina payment gateway integration
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import paymentConfig from '../../config/payment';
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
} from '../../types/payment';

export class DecidirPaymentService implements PaymentGateway {
  private prisma: PrismaClient;
  private config: any;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = paymentConfig.secondaryGateways.decidir;
    
    if (!this.config.enabled) {
      throw new PaymentError('Decidir gateway is not enabled', 'GATEWAY_DISABLED');
    }

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.publicApiKey) {
      throw new PaymentError('Decidir public API key is required', 'MISSING_CONFIG');
    }
    if (!this.config.privateApiKey) {
      throw new PaymentError('Decidir private API key is required', 'MISSING_CONFIG');
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate Decidir specific requirements
      await this.validateDecidirRequest(request);

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

      // Create Decidir payment request
      const decidirRequest = {
        site_transaction_id: `${booking.id}_${Date.now()}`,
        token: 'card_token_placeholder', // In real implementation, this comes from frontend
        payment_method_id: this.mapPaymentMethod(request.paymentMethod),
        amount: Math.round(request.amount * 100), // Decidir uses cents
        currency: 'ARS',
        installments: request.installments || 1,
        description: request.description,
        payment_type: 'single',
        sub_payments: [],
        customer: {
          id: booking.clientId,
          email: request.clientEmail,
          name: request.clientName,
          phone: request.clientPhone,
          identification: {
            type: 'dni',
            number: request.clientDni,
          },
        },
        metadata: {
          ...request.metadata,
          gateway: 'decidir',
          booking_id: request.bookingId,
          service_id: booking.serviceId,
          provider_id: booking.providerId,
        },
      };

      // In a real implementation, this would call the Decidir API
      const simulatedResponse = await this.simulateDecidirApi(decidirRequest);

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: request.bookingId,
          amount: request.amount,
          currency: request.currency,
          status: 'PENDING',
          paymentMethod: 'decidir',
          externalId: simulatedResponse.id,
          externalStatus: simulatedResponse.status,
          gatewayData: simulatedResponse as any,
          description: request.description,
          metadata: {
            decidirPaymentId: simulatedResponse.id,
            siteTransactionId: decidirRequest.site_transaction_id,
            clientInfo: {
              email: request.clientEmail,
              name: request.clientName,
              phone: request.clientPhone,
              dni: request.clientDni,
            },
          },
        },
      });

      return {
        id: payment.id,
        status: this.mapDecidirStatus(simulatedResponse.status),
        externalReference: request.bookingId,
        gatewayData: simulatedResponse,
        createdAt: payment.createdAt,
        // Decidir doesn't use redirect URLs like MercadoPago
      };

    } catch (error: any) {
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentGatewayError(
        `Decidir payment creation failed: ${error?.message || 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  async getPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const dbPayment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!dbPayment) {
        throw new PaymentValidationError('Payment not found');
      }

      if (!dbPayment.externalId) {
        return {
          id: dbPayment.id,
          status: this.mapDecidirStatus(dbPayment.status),
          externalReference: paymentId,
          gatewayData: dbPayment.gatewayData,
          createdAt: dbPayment.createdAt,
        };
      }

      // In a real implementation, this would query Decidir API
      const decidirPayment = await this.simulateDecidirQuery(dbPayment.externalId);

      // Update payment status
      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        this.mapDecidirStatus(decidirPayment.status),
        decidirPayment
      );

      return {
        id: updatedPayment.id,
        status: this.mapDecidirStatus(decidirPayment.status),
        externalReference: decidirPayment.site_transaction_id || '',
        gatewayData: decidirPayment,
        createdAt: updatedPayment.createdAt,
      };

    } catch (error: any) {
      throw new PaymentGatewayError(
        `Decidir payment query failed: ${error?.message || 'Unknown error'}`,
        { paymentId, originalError: error }
      );
    }
  }

  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
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

      // In a real implementation, this would call Decidir refund API
      const refundResponse = await this.simulateDecidirRefund(dbPayment.externalId, refundAmount);

      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        PaymentStatusEnum.REFUNDED,
        refundResponse,
        new Date()
      );

      return {
        id: updatedPayment.id,
        status: PaymentStatusEnum.REFUNDED,
        externalReference: refundResponse.site_transaction_id || '',
        gatewayData: refundResponse,
        createdAt: updatedPayment.createdAt,
      };

    } catch (error: any) {
      throw new PaymentGatewayError(
        `Decidir refund failed: ${error?.message || 'Unknown error'}`,
        { paymentId, amount, originalError: error }
      );
    }
  }

  async processWebhook(payload: any): Promise<PaymentProcessingResult> {
    try {
      // Decidir webhook structure
      if (!payload.site_transaction_id || !payload.payment_method_id) {
        return {
          success: false,
          paymentId: '',
          status: PaymentStatusEnum.PENDING,
          processedAt: new Date(),
          error: 'Invalid Decidir webhook payload',
        };
      }

      // Find payment by external ID
      const dbPayment = await this.prisma.payment.findFirst({
        where: {
          externalId: payload.id,
        },
        include: { booking: true },
      });

      if (!dbPayment) {
        throw new PaymentValidationError('Payment not found in database');
      }

      // Update payment status
      const newStatus = this.mapDecidirStatus(payload.status);
      const paidAt = newStatus === PaymentStatusEnum.APPROVED ? new Date() : undefined;

      await this.updatePaymentStatus(
        dbPayment.id,
        newStatus,
        payload,
        paidAt
      );

      return {
        success: true,
        paymentId: dbPayment.id,
        status: newStatus,
        amount: Number(payload.amount || 0) / 100, // Convert from cents
        processedAt: new Date(),
        metadata: { decidirPayment: payload },
      };

    } catch (error: any) {
      return {
        success: false,
        paymentId: payload.id || '',
        status: PaymentStatusEnum.PENDING,
        processedAt: new Date(),
        error: error?.message || 'Unknown error',
      };
    }
  }

  async calculateCommission(amount: number, providerId: string): Promise<CommissionCalculation> {
    // Use the same commission logic as MercadoPago
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
    let commissionRate = paymentConfig.business.commissionStandard;

    if (monthlyVolume >= 100) {
      commissionRate = paymentConfig.business.commissionPremium;
    } else if (monthlyVolume >= 50) {
      commissionRate = paymentConfig.business.commissionHighVolume;
    }

    // Decidir has competitive rates similar to MercadoPago
    commissionRate += 0.002; // Add 0.2% for Decidir

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

  // Private helper methods

  private async validateDecidirRequest(request: PaymentRequest): Promise<void> {
    const errors: string[] = [];

    if (!request.bookingId) errors.push('Booking ID is required');
    if (!request.amount || request.amount <= 0) errors.push('Valid amount is required');
    if (request.amount > 999999.99) errors.push('Amount exceeds Decidir limit (ARS 999,999.99)');
    if (!request.clientEmail) errors.push('Client email is required');
    if (!request.clientName) errors.push('Client name is required');
    if (request.installments && (request.installments < 1 || request.installments > 12)) {
      errors.push('Installments must be between 1 and 12');
    }

    if (errors.length > 0) {
      throw new PaymentValidationError(`Decidir validation errors: ${errors.join(', ')}`);
    }
  }

  private mapPaymentMethod(method?: string): number {
    // Decidir payment method IDs
    const methodMap: Record<string, number> = {
      'credit_card': 1,
      'debit_card': 31,
      'visa': 1,
      'mastercard': 104,
      'amex': 65,
      'cabal': 63,
      'naranja': 24,
    };

    return methodMap[method || 'credit_card'] || 1;
  }

  private mapDecidirStatus(decidirStatus: string): PaymentStatusEnum {
    const statusMap: Record<string, PaymentStatusEnum> = {
      pending: PaymentStatusEnum.PENDING,
      approved: PaymentStatusEnum.APPROVED,
      pre_approved: PaymentStatusEnum.AUTHORIZED,
      rejected: PaymentStatusEnum.REJECTED,
      cancelled: PaymentStatusEnum.CANCELLED,
      refunded: PaymentStatusEnum.REFUNDED,
      failed: PaymentStatusEnum.REJECTED,
      error: PaymentStatusEnum.REJECTED,
    };

    return statusMap[decidirStatus] || PaymentStatusEnum.PENDING;
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
        gatewayData: gatewayData || null,
        paidAt,
        ...(status === PaymentStatusEnum.REJECTED && { failedAt: new Date() }),
        ...(status === PaymentStatusEnum.REFUNDED && { refundedAt: new Date() }),
      },
    });
  }

  // Simulation methods (replace with real API calls in production)

  private async simulateDecidirApi(request: any): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 400));

    // Simulate occasional failures for testing
    if (paymentConfig.testing.simulationEnabled && Math.random() > paymentConfig.testing.successRate) {
      throw new Error('Simulated Decidir API failure');
    }

    return {
      id: parseInt(Math.random().toString().substring(2, 10)),
      site_transaction_id: request.site_transaction_id,
      status: 'approved',
      status_details: {
        ticket: `DEC${Math.random().toString().substring(2, 8)}`,
        card_authorization_code: Math.random().toString().substring(2, 8),
      },
      amount: request.amount,
      currency: request.currency,
      installments: request.installments,
      payment_method_id: request.payment_method_id,
      created_at: new Date().toISOString(),
    };
  }

  private async simulateDecidirQuery(paymentId: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 200));

    return {
      id: paymentId,
      site_transaction_id: '',
      status: 'approved',
      amount: 0,
      updated_at: new Date().toISOString(),
    };
  }

  private async simulateDecidirRefund(paymentId: string, amount: number): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 600));

    return {
      id: paymentId,
      refund_id: parseInt(Math.random().toString().substring(2, 10)),
      status: 'refunded',
      refund_amount: Math.round(amount * 100), // Cents
      site_transaction_id: '',
      processed_at: new Date().toISOString(),
    };
  }
}

export default DecidirPaymentService;