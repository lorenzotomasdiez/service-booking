/**
 * PayU Payment Service for BarberPro Argentina
 * PayU Latin America payment gateway integration
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

export class PayUPaymentService implements PaymentGateway {
  private prisma: PrismaClient;
  private config: any;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = paymentConfig.secondaryGateways.payu;
    
    if (!this.config.enabled) {
      throw new PaymentError('PayU gateway is not enabled', 'GATEWAY_DISABLED');
    }

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiLogin) {
      throw new PaymentError('PayU API login is required', 'MISSING_CONFIG');
    }
    if (!this.config.apiKey) {
      throw new PaymentError('PayU API key is required', 'MISSING_CONFIG');
    }
    if (!this.config.merchantId) {
      throw new PaymentError('PayU merchant ID is required', 'MISSING_CONFIG');
    }
    if (!this.config.accountId) {
      throw new PaymentError('PayU account ID is required', 'MISSING_CONFIG');
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate PayU specific requirements
      await this.validatePayuRequest(request);

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

      // Create PayU payment request
      const payuRequest = {
        language: 'es',
        command: 'SUBMIT_TRANSACTION',
        merchant: {
          apiLogin: this.config.apiLogin,
          apiKey: this.config.apiKey,
        },
        transaction: {
          order: {
            accountId: this.config.accountId,
            referenceCode: request.bookingId,
            description: request.description,
            language: 'es',
            signature: this.generateSignature(request),
            additionalValues: {
              TX_VALUE: {
                value: request.amount,
                currency: 'ARS',
              },
            },
            buyer: {
              merchantBuyerId: booking.clientId,
              fullName: request.clientName,
              emailAddress: request.clientEmail,
              contactPhone: request.clientPhone,
              dniNumber: request.clientDni,
            },
          },
          payer: {
            merchantPayerId: booking.clientId,
            fullName: request.clientName,
            emailAddress: request.clientEmail,
            contactPhone: request.clientPhone,
            dniType: 'DNI',
            dniNumber: request.clientDni,
          },
          creditCard: {
            number: 'XXXX-XXXX-XXXX-XXXX', // This comes from frontend tokenization
            securityCode: 'XXX',
            expirationDate: '2025/12',
            name: request.clientName,
          },
          extraParameters: {
            INSTALLMENTS_NUMBER: request.installments || 1,
            RESPONSE_URL: request.returnUrls.success,
          },
          type: 'AUTHORIZATION_AND_CAPTURE',
          paymentMethod: this.mapPaymentMethod(request.paymentMethod),
          paymentCountry: 'AR',
          deviceSessionId: uuidv4(),
          ipAddress: '127.0.0.1', // This should come from request
          cookie: 'cookie_' + uuidv4(),
          userAgent: 'Mozilla/5.0 (BarberPro App)',
        },
        test: this.config.environment === 'sandbox',
      };

      // In a real implementation, this would call the PayU API
      const simulatedResponse = await this.simulatePayuApi(payuRequest);

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: request.bookingId,
          amount: request.amount,
          currency: request.currency,
          status: 'PENDING',
          paymentMethod: 'payu',
          externalId: simulatedResponse.transactionResponse.transactionId,
          externalStatus: simulatedResponse.transactionResponse.state,
          gatewayData: simulatedResponse as any,
          description: request.description,
          metadata: {
            payuTransactionId: simulatedResponse.transactionResponse.transactionId,
            payuOrderId: simulatedResponse.transactionResponse.orderId,
            referenceCode: request.bookingId,
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
        status: this.mapPayuStatus(simulatedResponse.transactionResponse.state),
        externalReference: request.bookingId,
        gatewayData: simulatedResponse,
        createdAt: payment.createdAt,
        // PayU typically processes directly without redirect
      };

    } catch (error: any) {
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentGatewayError(
        `PayU payment creation failed: ${error?.message || 'Unknown error'}`,
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
          status: this.mapPayuStatus(dbPayment.status),
          externalReference: paymentId,
          gatewayData: dbPayment.gatewayData,
          createdAt: dbPayment.createdAt,
        };
      }

      // In a real implementation, this would query PayU API
      const payuPayment = await this.simulatePayuQuery(dbPayment.externalId);

      // Update payment status
      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        this.mapPayuStatus(payuPayment.state),
        payuPayment
      );

      return {
        id: updatedPayment.id,
        status: this.mapPayuStatus(payuPayment.state),
        externalReference: payuPayment.reference_sale || '',
        gatewayData: payuPayment,
        createdAt: updatedPayment.createdAt,
      };

    } catch (error: any) {
      throw new PaymentGatewayError(
        `PayU payment query failed: ${error?.message || 'Unknown error'}`,
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

      // In a real implementation, this would call PayU refund API
      const refundResponse = await this.simulatePayuRefund(dbPayment.externalId, refundAmount);

      const updatedPayment = await this.updatePaymentStatus(
        paymentId,
        PaymentStatusEnum.REFUNDED,
        refundResponse,
        new Date()
      );

      return {
        id: updatedPayment.id,
        status: PaymentStatusEnum.REFUNDED,
        externalReference: refundResponse.reference_sale || '',
        gatewayData: refundResponse,
        createdAt: updatedPayment.createdAt,
      };

    } catch (error: any) {
      throw new PaymentGatewayError(
        `PayU refund failed: ${error?.message || 'Unknown error'}`,
        { paymentId, amount, originalError: error }
      );
    }
  }

  async processWebhook(payload: any): Promise<PaymentProcessingResult> {
    try {
      // PayU webhook structure
      if (!payload.reference_sale || !payload.state_pol) {
        return {
          success: false,
          paymentId: '',
          status: PaymentStatusEnum.PENDING,
          processedAt: new Date(),
          error: 'Invalid PayU webhook payload',
        };
      }

      // Find payment by reference (booking ID)
      const dbPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId: payload.reference_sale,
        },
        include: { booking: true },
      });

      if (!dbPayment) {
        throw new PaymentValidationError('Payment not found in database');
      }

      // Update payment status
      const newStatus = this.mapPayuStatus(payload.state_pol);
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
        amount: Number(payload.value || 0),
        processedAt: new Date(),
        metadata: { payuPayment: payload },
      };

    } catch (error: any) {
      return {
        success: false,
        paymentId: payload.reference_sale || '',
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

    // PayU has slightly higher commission due to international processing
    commissionRate += 0.008; // Add 0.8% for PayU

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

  private async validatePayuRequest(request: PaymentRequest): Promise<void> {
    const errors: string[] = [];

    if (!request.bookingId) errors.push('Booking ID is required');
    if (!request.amount || request.amount <= 0) errors.push('Valid amount is required');
    if (request.amount > 300000) errors.push('Amount exceeds PayU limit for Argentina (ARS 300,000)');
    if (!request.clientEmail) errors.push('Client email is required');
    if (!request.clientName) errors.push('Client name is required');
    if (!request.clientDni) errors.push('Client DNI is required for PayU Argentina');
    if (request.installments && (request.installments < 1 || request.installments > 12)) {
      errors.push('Installments must be between 1 and 12');
    }

    if (errors.length > 0) {
      throw new PaymentValidationError(`PayU validation errors: ${errors.join(', ')}`);
    }
  }

  private generateSignature(request: PaymentRequest): string {
    // PayU signature generation: MD5(apiKey~merchantId~referenceCode~amount~currency)
    const signatureString = `${this.config.apiKey}~${this.config.merchantId}~${request.bookingId}~${request.amount}~ARS`;
    
    // In a real implementation, you would use actual MD5 hashing
    return 'simulated_signature_' + signatureString.length;
  }

  private mapPaymentMethod(method?: string): string {
    // PayU payment method codes for Argentina
    const methodMap: Record<string, string> = {
      'credit_card': 'VISA',
      'visa': 'VISA',
      'mastercard': 'MASTERCARD',
      'amex': 'AMEX',
      'diners': 'DINERS',
      'cabal': 'CABAL',
      'naranja': 'NARANJA',
      'shopping': 'SHOPPING',
      'cencosud': 'CENCOSUD',
    };

    return methodMap[method || 'credit_card'] || 'VISA';
  }

  private mapPayuStatus(payuStatus: string): PaymentStatusEnum {
    const statusMap: Record<string, PaymentStatusEnum> = {
      // PayU transaction states
      '4': PaymentStatusEnum.APPROVED, // APPROVED
      '6': PaymentStatusEnum.REJECTED, // DECLINED
      '104': PaymentStatusEnum.REJECTED, // ERROR
      '7': PaymentStatusEnum.PENDING, // PENDING
      '5': PaymentStatusEnum.CANCELLED, // EXPIRED
      // Additional mappings
      'APPROVED': PaymentStatusEnum.APPROVED,
      'DECLINED': PaymentStatusEnum.REJECTED,
      'ERROR': PaymentStatusEnum.REJECTED,
      'PENDING': PaymentStatusEnum.PENDING,
      'EXPIRED': PaymentStatusEnum.CANCELLED,
      'REFUNDED': PaymentStatusEnum.REFUNDED,
    };

    return statusMap[payuStatus] || PaymentStatusEnum.PENDING;
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
        externalStatus: gatewayData.state || gatewayData.state_pol,
        gatewayData: gatewayData || null,
        paidAt,
        ...(status === PaymentStatusEnum.REJECTED && { failedAt: new Date() }),
        ...(status === PaymentStatusEnum.REFUNDED && { refundedAt: new Date() }),
      },
    });
  }

  // Simulation methods (replace with real API calls in production)

  private async simulatePayuApi(request: any): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 600));

    // Simulate occasional failures for testing
    if (paymentConfig.testing.simulationEnabled && Math.random() > paymentConfig.testing.successRate) {
      throw new Error('Simulated PayU API failure');
    }

    const transactionId = `TXN_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const orderId = Math.floor(Math.random() * 1000000);

    return {
      code: 'SUCCESS',
      error: null,
      transactionResponse: {
        orderId: orderId,
        transactionId: transactionId,
        state: 'APPROVED',
        paymentNetworkResponseCode: '00',
        paymentNetworkResponseErrorMessage: null,
        trazabilityCode: Math.random().toString().substring(2, 10),
        authorizationCode: Math.random().toString().substring(2, 8),
        pendingReason: null,
        responseCode: 'APPROVED',
        errorCode: null,
        responseMessage: null,
        transactionDate: new Date().toISOString(),
        transactionTime: new Date().toISOString(),
        operationDate: new Date().toISOString(),
        extraParameters: {
          BANK_REFERENCED_CODE: Math.random().toString().substring(2, 10),
        },
      },
    };
  }

  private async simulatePayuQuery(transactionId: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));

    return {
      transactionId: transactionId,
      state: 'APPROVED',
      reference_sale: '',
      value: 0,
      updated_at: new Date().toISOString(),
    };
  }

  private async simulatePayuRefund(transactionId: string, amount: number): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 800));

    return {
      transactionId: transactionId,
      refund_id: `REF_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      state: 'REFUNDED',
      refund_amount: amount,
      reference_sale: '',
      processed_at: new Date().toISOString(),
    };
  }
}

export default PayUPaymentService;