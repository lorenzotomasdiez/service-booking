/**
 * Payment Schema Definitions for BarberPro Argentina
 * TypeBox schemas for payment validation and documentation
 */

import { Type, Static } from '@sinclair/typebox';

// Core Payment Schemas
export const PaymentMethodSchema = Type.Union([
  Type.Literal('credit_card'),
  Type.Literal('debit_card'),
  Type.Literal('bank_transfer'),
  Type.Literal('rapipago'),
  Type.Literal('pagofacil'),
  Type.Literal('account_money'),
  Type.Literal('mercadopago'),
]);

export const PaymentStatusSchema = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('PAID'),
  Type.Literal('FAILED'),
  Type.Literal('REFUNDED'),
  Type.Literal('CANCELLED'),
]);

export const CurrencySchema = Type.Literal('ARS');

// Payment Request Schemas
export const CreatePaymentRequestSchema = Type.Object({
  bookingId: Type.String({
    description: 'Unique identifier for the booking',
    examples: ['clm1234567890abcdef'],
  }),
  amount: Type.Number({
    minimum: 1,
    maximum: 999999.99,
    description: 'Payment amount in ARS',
    examples: [2500.00],
  }),
  currency: CurrencySchema,
  paymentMethod: Type.Optional(PaymentMethodSchema),
  installments: Type.Optional(Type.Number({
    minimum: 1,
    maximum: 12,
    description: 'Number of installments for credit card payments',
  })),
  description: Type.String({
    minLength: 1,
    maxLength: 500,
    description: 'Payment description',
    examples: ['Corte de cabello y barba - BarberShop Central'],
  }),
  clientEmail: Type.String({
    format: 'email',
    description: 'Client email address',
    examples: ['cliente@example.com'],
  }),
  clientName: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Client full name',
    examples: ['Juan Carlos Pérez'],
  }),
  clientPhone: Type.Optional(Type.String({
    pattern: '^\\+54[0-9]{10,11}$',
    description: 'Argentina phone number format: +54xxxxxxxxxx',
    examples: ['+5491123456789'],
  })),
  clientDni: Type.Optional(Type.String({
    pattern: '^[0-9]{7,8}$',
    description: 'Argentina DNI (7-8 digits)',
    examples: ['12345678'],
  })),
  returnUrls: Type.Object({
    success: Type.String({
      format: 'uri',
      description: 'URL to redirect after successful payment',
      examples: ['https://barberpro.com.ar/payment/success'],
    }),
    failure: Type.String({
      format: 'uri',
      description: 'URL to redirect after failed payment',
      examples: ['https://barberpro.com.ar/payment/failure'],
    }),
    pending: Type.String({
      format: 'uri',
      description: 'URL to redirect for pending payments',
      examples: ['https://barberpro.com.ar/payment/pending'],
    }),
  }),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any(), {
    description: 'Additional metadata for the payment',
  })),
});

// Payment Response Schemas
export const PaymentResponseSchema = Type.Object({
  id: Type.String({
    description: 'Internal payment ID',
    examples: ['clm0987654321fedcba'],
  }),
  status: PaymentStatusSchema,
  preferenceId: Type.Optional(Type.String({
    description: 'MercadoPago preference ID',
    examples: ['123456789-12345678-1234567890abcdef'],
  })),
  initPoint: Type.Optional(Type.String({
    format: 'uri',
    description: 'MercadoPago checkout URL',
  })),
  sandboxInitPoint: Type.Optional(Type.String({
    format: 'uri',
    description: 'MercadoPago sandbox checkout URL',
  })),
  externalReference: Type.String({
    description: 'External reference (booking ID)',
  }),
  amount: Type.Number({
    description: 'Payment amount',
  }),
  currency: CurrencySchema,
  paymentMethod: Type.Optional(PaymentMethodSchema),
  externalId: Type.Optional(Type.String({
    description: 'External payment gateway ID',
  })),
  createdAt: Type.String({
    format: 'date-time',
    description: 'Payment creation timestamp',
  }),
  paidAt: Type.Optional(Type.String({
    format: 'date-time',
    description: 'Payment completion timestamp',
  })),
});

// Refund Request Schema
export const RefundRequestSchema = Type.Object({
  amount: Type.Optional(Type.Number({
    minimum: 0.01,
    description: 'Refund amount (if partial refund)',
    examples: [1000.00],
  })),
  reason: Type.Optional(Type.String({
    maxLength: 500,
    description: 'Reason for refund',
    examples: ['Client cancellation within 24 hours'],
  })),
});

// Commission Calculation Schema
export const CommissionCalculationSchema = Type.Object({
  baseAmount: Type.Number({
    description: 'Original payment amount',
  }),
  commissionRate: Type.Number({
    description: 'Commission rate applied (0.035 = 3.5%)',
  }),
  commissionAmount: Type.Number({
    description: 'Commission amount deducted',
  }),
  providerAmount: Type.Number({
    description: 'Amount before taxes',
  }),
  taxAmount: Type.Optional(Type.Number({
    description: 'Tax withholding amount',
  })),
  netProviderAmount: Type.Number({
    description: 'Final amount to be paid to provider',
  }),
});

// Analytics Schemas
export const PaymentAnalyticsSchema = Type.Object({
  totalTransactions: Type.Number({
    description: 'Total number of payment transactions',
  }),
  successfulTransactions: Type.Number({
    description: 'Number of successful payments',
  }),
  failedTransactions: Type.Number({
    description: 'Number of failed payments',
  }),
  successRate: Type.Number({
    minimum: 0,
    maximum: 1,
    description: 'Payment success rate (0.95 = 95%)',
  }),
  totalVolume: Type.Number({
    description: 'Total payment volume in ARS',
  }),
  averageTransactionAmount: Type.Number({
    description: 'Average payment amount',
  }),
  period: Type.Object({
    from: Type.String({
      format: 'date-time',
      description: 'Analytics period start date',
    }),
    to: Type.String({
      format: 'date-time',
      description: 'Analytics period end date',
    }),
  }),
});

// Payment Configuration Schema
export const PaymentConfigSchema = Type.Object({
  publicKey: Type.String({
    description: 'MercadoPago public key for frontend',
  }),
  environment: Type.Union([
    Type.Literal('sandbox'),
    Type.Literal('production'),
  ]),
  currency: CurrencySchema,
  maxInstallments: Type.Number({
    description: 'Maximum number of installments allowed',
  }),
  supportedMethods: Type.Array(PaymentMethodSchema, {
    description: 'List of supported payment methods',
  }),
});

// Webhook Schemas
export const MercadoPagoWebhookSchema = Type.Object({
  id: Type.Number(),
  live_mode: Type.Boolean(),
  type: Type.Union([
    Type.Literal('payment'),
    Type.Literal('merchant_order'),
    Type.Literal('plan'),
    Type.Literal('subscription'),
    Type.Literal('invoice'),
  ]),
  date_created: Type.String(),
  application_id: Type.Number(),
  user_id: Type.Number(),
  version: Type.Number(),
  api_version: Type.String(),
  action: Type.Union([
    Type.Literal('payment.created'),
    Type.Literal('payment.updated'),
    Type.Literal('merchant_order.updated'),
  ]),
  data: Type.Object({
    id: Type.String(),
  }),
});

// Error Response Schemas
export const PaymentErrorSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String({
      description: 'Error code',
      examples: ['VALIDATION_ERROR', 'GATEWAY_ERROR', 'UNAUTHORIZED'],
    }),
    message: Type.String({
      description: 'Human-readable error message',
    }),
    details: Type.Optional(Type.Record(Type.String(), Type.Any(), {
      description: 'Additional error details',
    })),
  }),
});

// Success Response Schemas
export const PaymentSuccessSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Any({
    description: 'Response data varies by endpoint',
  }),
});

// Argentina-specific Schemas
export const ArgentinaPhoneSchema = Type.String({
  pattern: '^\\+54[0-9]{10,11}$',
  description: 'Argentina phone number: +54 followed by 10-11 digits',
  examples: ['+5491123456789', '+542234567890'],
});

export const ArgentinaDniSchema = Type.String({
  pattern: '^[0-9]{7,8}$',
  description: 'Argentina DNI: 7-8 digits',
  examples: ['12345678', '87654321'],
});

export const ArgentinaCuitSchema = Type.String({
  pattern: '^[0-9]{2}-[0-9]{8}-[0-9]$',
  description: 'Argentina CUIT format: XX-XXXXXXXX-X',
  examples: ['20-12345678-9', '27-87654321-0'],
});

// Type exports for TypeScript
export type CreatePaymentRequest = Static<typeof CreatePaymentRequestSchema>;
export type PaymentResponse = Static<typeof PaymentResponseSchema>;
export type RefundRequest = Static<typeof RefundRequestSchema>;
export type CommissionCalculation = Static<typeof CommissionCalculationSchema>;
export type PaymentAnalytics = Static<typeof PaymentAnalyticsSchema>;
export type PaymentConfig = Static<typeof PaymentConfigSchema>;
export type MercadoPagoWebhook = Static<typeof MercadoPagoWebhookSchema>;
export type PaymentError = Static<typeof PaymentErrorSchema>;
export type PaymentSuccess = Static<typeof PaymentSuccessSchema>;

// Common response schemas for OpenAPI documentation
export const CommonPaymentResponses = {
  200: PaymentSuccessSchema,
  201: PaymentSuccessSchema,
  400: PaymentErrorSchema,
  401: PaymentErrorSchema,
  403: PaymentErrorSchema,
  404: PaymentErrorSchema,
  422: PaymentErrorSchema,
  500: PaymentErrorSchema,
  502: PaymentErrorSchema,
};

export default {
  CreatePaymentRequestSchema,
  PaymentResponseSchema,
  RefundRequestSchema,
  CommissionCalculationSchema,
  PaymentAnalyticsSchema,
  PaymentConfigSchema,
  MercadoPagoWebhookSchema,
  PaymentErrorSchema,
  PaymentSuccessSchema,
  CommonPaymentResponses,
};