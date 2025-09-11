/**
 * TodoPago Payment Service for BarberPro Argentina
 * Banco Provincia's payment gateway integration
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

export class TodoPagoPaymentService implements PaymentGateway {
  private prisma: PrismaClient;
  private config: any;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = paymentConfig.secondaryGateways.todopago;
    
    if (!this.config.enabled) {
      throw new PaymentError('TodoPago gateway is not enabled', 'GATEWAY_DISABLED');
    }

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.merchantId) {
      throw new PaymentError('TodoPago merchant ID is required', 'MISSING_CONFIG');
    }
    if (!this.config.apiKey) {
      throw new PaymentError('TodoPago API key is required', 'MISSING_CONFIG');
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate TodoPago specific requirements
      await this.validateTodopagoRequest(request);

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

      // Create TodoPago payment request
      const todopagoRequest = {
        merchant_id: this.config.merchantId,
        operation: {
          amount: request.amount,
          currency: 'ARS',
          description: request.description,
          external_reference: request.bookingId,
        },
        customer: {
          email: request.clientEmail,
          name: request.clientName,
          phone: request.clientPhone,
          dni: request.clientDni,
        },
        return_urls: {
          success: request.returnUrls.success,
          failure: request.returnUrls.failure,
          pending: request.returnUrls.pending,
        },
        metadata: {
          ...request.metadata,
          gateway: 'todopago',
          service_id: booking.serviceId,
          provider_id: booking.providerId,
        },
      };

      // In a real implementation, this would call the TodoPago API
      // For now, we'll simulate the response
      const simulatedResponse = await this.simulateTodopagoApi(todopagoRequest);

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: request.bookingId,
          amount: request.amount,
          currency: request.currency,
          status: 'PENDING',
          paymentMethod: 'todopago',
          externalId: simulatedResponse.operation_id,
          externalStatus: 'created',
          gatewayData: simulatedResponse as any,
          description: request.description,
          metadata: {
            todopagoOperationId: simulatedResponse.operation_id,
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
        status: PaymentStatusEnum.PENDING,
        externalReference: request.bookingId,
        gatewayData: simulatedResponse,
        createdAt: payment.createdAt,
        initPoint: simulatedResponse.checkout_url,
      };

    } catch (error: any) {
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentGatewayError(
        `TodoPago payment creation failed: ${error?.message || 'Unknown error'}`,
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
          status: this.mapTodopagoStatus(dbPayment.status),
          externalReference: paymentId,
          gatewayData: dbPayment.gatewayData,
          createdAt: dbPayment.createdAt,
        };
      }

      // In a real implementation, this would query TodoPago API
      const todopagoPayment = await this.simulateTodopagoQuery(dbPayment.externalId);

      // Update payment status
      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        this.mapTodopagoStatus(todopagoPayment.status),
        todopagoPayment
      );

      return {
        id: updatedPayment.id,
        status: this.mapTodopagoStatus(todopagoPayment.status),
        externalReference: todopagoPayment.external_reference || '',
        gatewayData: todopagoPayment,
        createdAt: updatedPayment.createdAt,
      };

    } catch (error: any) {
      throw new PaymentGatewayError(
        `TodoPago payment query failed: ${error?.message || 'Unknown error'}`,
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

      // In a real implementation, this would call TodoPago refund API
      const refundResponse = await this.simulateTodopagoRefund(dbPayment.externalId, refundAmount);

      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        PaymentStatusEnum.REFUNDED,
        refundResponse,
        new Date()
      );

      return {
        id: updatedPayment.id,
        status: PaymentStatusEnum.REFUNDED,
        externalReference: refundResponse.external_reference || '',
        gatewayData: refundResponse,
        createdAt: updatedPayment.createdAt,
      };

    } catch (error: any) {
      throw new PaymentGatewayError(
        `TodoPago refund failed: ${error?.message || 'Unknown error'}`,
        { paymentId, amount, originalError: error }
      );
    }
  }

  async processWebhook(payload: any): Promise<PaymentProcessingResult> {
    try {
      // TodoPago webhook structure
      if (!payload.merchant || !payload.operation) {
        return {
          success: false,
          paymentId: '',
          status: PaymentStatusEnum.PENDING,
          processedAt: new Date(),
          error: 'Invalid TodoPago webhook payload',
        };
      }

      // Find payment by external ID
      const dbPayment = await this.prisma.payment.findFirst({
        where: {
          externalId: payload.operation.id,
        },
        include: { booking: true },
      });

      if (!dbPayment) {
        throw new PaymentValidationError('Payment not found in database');
      }

      // Update payment status
      const newStatus = this.mapTodopagoStatus(payload.operation.status);
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
        amount: Number(payload.operation.amount || 0),
        processedAt: new Date(),
        metadata: { todopagoPayment: payload },
      };

    } catch (error: any) {
      return {
        success: false,
        paymentId: payload.operation?.id || '',
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

    // TodoPago has slightly higher commission due to lower processing fees
    commissionRate += 0.005; // Add 0.5% for TodoPago

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

  private async validateTodopagoRequest(request: PaymentRequest): Promise<void> {
    const errors: string[] = [];

    if (!request.bookingId) errors.push('Booking ID is required');
    if (!request.amount || request.amount <= 0) errors.push('Valid amount is required');
    if (request.amount > 500000) errors.push('Amount exceeds TodoPago limit (ARS 500,000)');
    if (!request.clientEmail) errors.push('Client email is required');
    if (!request.clientName) errors.push('Client name is required');
    if (request.installments && request.installments > 1) errors.push('TodoPago does not support installments');

    if (errors.length > 0) {
      throw new PaymentValidationError(`TodoPago validation errors: ${errors.join(', ')}`);
    }
  }

  private mapTodopagoStatus(todopagoStatus: string): PaymentStatusEnum {
    const statusMap: Record<string, PaymentStatusEnum> = {
      created: PaymentStatusEnum.PENDING,
      pending: PaymentStatusEnum.PENDING,
      approved: PaymentStatusEnum.APPROVED,
      authorized: PaymentStatusEnum.AUTHORIZED,
      rejected: PaymentStatusEnum.REJECTED,
      cancelled: PaymentStatusEnum.CANCELLED,
      refunded: PaymentStatusEnum.REFUNDED,
      failed: PaymentStatusEnum.REJECTED,
    };

    return statusMap[todopagoStatus] || PaymentStatusEnum.PENDING;
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

  private async simulateTodopagoApi(request: any): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate occasional failures for testing
    if (paymentConfig.testing.simulationEnabled && Math.random() > paymentConfig.testing.successRate) {
      throw new Error('Simulated TodoPago API failure');
    }

    return {
      operation_id: `TP_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      status: 'created',
      amount: request.operation.amount,
      currency: request.operation.currency,
      external_reference: request.operation.external_reference,
      checkout_url: `https://developers.todopago.com.ar/checkout/${uuidv4()}`,
      created_at: new Date().toISOString(),
    };
  }

  private async simulateTodopagoQuery(operationId: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    return {
      operation_id: operationId,
      status: 'approved',
      external_reference: '',
      amount: 0,
      updated_at: new Date().toISOString(),
    };
  }

  private async simulateTodopagoRefund(operationId: string, amount: number): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 800));

    return {
      operation_id: operationId,
      refund_id: `REF_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      status: 'refunded',
      refund_amount: amount,
      external_reference: '',
      processed_at: new Date().toISOString(),
    };
  }
}

export default TodoPagoPaymentService;