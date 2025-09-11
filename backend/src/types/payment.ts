/**
 * Payment Types for BarberPro Argentina
 * MercadoPago Integration and Argentina-specific payment handling
 */

// Core Payment Types
export interface PaymentPreference {
  id: string;
  items: PaymentItem[];
  payer: PaymentPayer;
  back_urls: PaymentBackUrls;
  notification_url: string;
  auto_return: 'approved' | 'all';
  payment_methods: PaymentMethodsConfig;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  external_reference: string;
  metadata?: Record<string, any>;
}

export interface PaymentItem {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  quantity: number;
  currency_id: 'ARS';
  unit_price: number;
}

export interface PaymentPayer {
  name?: string;
  surname?: string;
  email: string;
  phone?: PaymentPhone;
  identification?: PaymentIdentification;
  address?: PaymentAddress;
  date_created?: string;
}

export interface PaymentPhone {
  area_code: string;
  number: string;
}

export interface PaymentIdentification {
  type: 'DNI' | 'CUIT' | 'CUIL' | 'CI' | 'Otro';
  number: string;
}

export interface PaymentAddress {
  street_name: string;
  street_number?: number;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface PaymentBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface PaymentMethodsConfig {
  excluded_payment_methods?: PaymentMethodExclusion[];
  excluded_payment_types?: PaymentTypeExclusion[];
  installments?: number;
  default_installments?: number;
}

export interface PaymentMethodExclusion {
  id: string;
}

export interface PaymentTypeExclusion {
  id: 'credit_card' | 'debit_card' | 'ticket' | 'bank_transfer' | 'digital_currency';
}

// MercadoPago Webhook Types
export interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'merchant_order' | 'plan' | 'subscription' | 'invoice';
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: 'payment.created' | 'payment.updated' | 'merchant_order.updated';
  data: {
    id: string;
  };
}

// Payment Processing Types
export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: 'ARS';
  paymentMethod?: string;
  installments?: number;
  description: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  clientDni?: string;
  returnUrls: PaymentBackUrls;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatusEnum;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  externalReference: string;
  gatewayData: Record<string, any>;
  createdAt: Date;
}

export interface PaymentWebhookHandler {
  processWebhook(payload: MercadoPagoWebhook): Promise<PaymentProcessingResult>;
  validateSignature(payload: string, signature: string): boolean;
}

export interface PaymentProcessingResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatusEnum;
  amount?: number;
  processedAt: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// Commission and Fee Types
export interface CommissionCalculation {
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  providerAmount: number;
  taxAmount?: number;
  netProviderAmount: number;
}

export interface PayoutRequest {
  providerId: string;
  amount: number;
  currency: 'ARS';
  reference: string;
  description: string;
}

export interface PayoutResponse {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  amount: number;
  currency: 'ARS';
  providerId: string;
  processedAt?: Date;
  error?: string;
}

// Argentina Tax Types
export interface AfipInvoiceData {
  pointOfSale: number;
  invoiceType: number;
  invoiceNumber: number;
  amount: number;
  taxAmount: number;
  clientDni?: string;
  clientCuit?: string;
  items: AfipInvoiceItem[];
}

export interface AfipInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

// Payment Analytics Types
export interface PaymentMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  averageResponseTime: number;
  totalVolume: number;
  averageTransactionAmount: number;
  topPaymentMethods: PaymentMethodStats[];
  period: {
    from: Date;
    to: Date;
  };
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  volume: number;
  successRate: number;
}

// Enums
export enum PaymentStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back'
}

export enum PaymentMethodEnum {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  RAPIPAGO = 'rapipago',
  PAGO_FACIL = 'pagofacil',
  MERCADOPAGO_WALLET = 'account_money'
}

// Error Types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class PaymentValidationError extends PaymentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'PaymentValidationError';
  }
}

export class PaymentGatewayError extends PaymentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'GATEWAY_ERROR', details);
    this.name = 'PaymentGatewayError';
  }
}

export class PaymentWebhookError extends PaymentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'WEBHOOK_ERROR', details);
    this.name = 'PaymentWebhookError';
  }
}

// Utility Types
export type PaymentProvider = 'mercadopago' | 'todopago' | 'decidir' | 'payu';

export interface PaymentGateway {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPayment(paymentId: string): Promise<PaymentResponse>;
  processRefund(paymentId: string, amount?: number): Promise<PaymentResponse>;
  processWebhook(payload: any): Promise<PaymentProcessingResult>;
  calculateCommission(amount: number, providerId: string): Promise<CommissionCalculation>;
}

export interface PaymentAuditLog {
  id: string;
  paymentId: string;
  action: string;
  userId?: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export default {
  PaymentStatusEnum,
  PaymentMethodEnum,
  PaymentError,
  PaymentValidationError,
  PaymentGatewayError,
  PaymentWebhookError,
};