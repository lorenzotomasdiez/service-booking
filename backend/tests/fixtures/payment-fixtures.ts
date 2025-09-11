/**
 * Payment Test Fixtures for BarberPro Argentina
 */

import { PaymentRequest, MercadoPagoWebhook } from '../../src/types/payment';

// Mock MercadoPago Response Data
export const mockMercadoPagoPreference = {
  id: 'TEST-123456789-987654321',
  init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=TEST-123456789-987654321',
  sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=TEST-123456789-987654321',
  date_created: '2024-09-10T20:00:00.000Z',
  external_reference: 'booking-123',
  collector_id: 123456789,
  client_id: '1234567890',
  marketplace: 'MELI',
  operation_type: 'regular_payment',
  additional_info: '',
  auto_return: 'approved',
  back_urls: {
    success: 'https://barberpro.com.ar/payment/success',
    failure: 'https://barberpro.com.ar/payment/failure',
    pending: 'https://barberpro.com.ar/payment/pending'
  }
};

export const mockMercadoPagoPayment = {
  id: 987654321,
  status: 'approved',
  status_detail: 'accredited',
  external_reference: 'booking-123',
  transaction_amount: 2500.00,
  currency_id: 'ARS',
  date_created: '2024-09-10T20:00:00.000Z',
  date_approved: '2024-09-10T20:01:00.000Z',
  date_last_updated: '2024-09-10T20:01:00.000Z',
  payment_method_id: 'visa',
  payment_type_id: 'credit_card',
  installments: 1,
  issuer_id: 25,
  card: {
    id: null,
    first_six_digits: '450995',
    last_four_digits: '3704',
    expiration_month: 11,
    expiration_year: 2025,
    date_created: '2024-09-10T20:00:00.000Z',
    date_last_updated: '2024-09-10T20:00:00.000Z',
    cardholder: {
      name: 'JUAN CARLOS PEREZ',
      identification: {
        number: '12345678',
        type: 'DNI'
      }
    }
  },
  payer: {
    id: '123456789',
    email: 'juan.perez@example.com',
    identification: {
      type: 'DNI',
      number: '12345678'
    },
    phone: {
      area_code: '11',
      number: '12345678'
    },
    first_name: 'Juan Carlos',
    last_name: 'Pérez'
  }
};

// Sample Payment Requests
export const validPaymentRequest: PaymentRequest = {
  bookingId: 'booking-123',
  amount: 2500.00,
  currency: 'ARS',
  description: 'Corte de cabello y barba - BarberShop Central',
  clientEmail: 'juan.perez@example.com',
  clientName: 'Juan Carlos Pérez',
  clientPhone: '+5491123456789',
  clientDni: '12345678',
  returnUrls: {
    success: 'https://barberpro.com.ar/payment/success',
    failure: 'https://barberpro.com.ar/payment/failure',
    pending: 'https://barberpro.com.ar/payment/pending'
  },
  metadata: {
    serviceType: 'barber',
    location: 'Buenos Aires'
  }
};

export const invalidPaymentRequests = {
  missingBookingId: {
    ...validPaymentRequest,
    bookingId: ''
  },
  invalidAmount: {
    ...validPaymentRequest,
    amount: -100
  },
  missingEmail: {
    ...validPaymentRequest,
    clientEmail: ''
  },
  invalidEmail: {
    ...validPaymentRequest,
    clientEmail: 'invalid-email'
  },
  missingReturnUrls: {
    ...validPaymentRequest,
    returnUrls: {
      success: '',
      failure: '',
      pending: ''
    }
  }
};

// MercadoPago Webhook Samples
export const mockWebhookPaymentApproved: MercadoPagoWebhook = {
  id: 1234567890,
  live_mode: false,
  type: 'payment',
  date_created: '2024-09-10T20:01:00.000Z',
  application_id: 123456789,
  user_id: 987654321,
  version: 1,
  api_version: 'v1',
  action: 'payment.updated',
  data: {
    id: '987654321'
  }
};

export const mockWebhookPaymentRejected: MercadoPagoWebhook = {
  ...mockWebhookPaymentApproved,
  action: 'payment.updated',
  data: {
    id: '987654322'
  }
};

// Test Database Records
export const mockUser = {
  id: 'user-123',
  email: 'juan.perez@example.com',
  name: 'Juan Carlos Pérez',
  phone: '+5491123456789',
  role: 'CLIENT',
  isActive: true,
  isVerified: true,
  dni: '12345678',
  timezone: 'America/Argentina/Buenos_Aires',
  locale: 'es-AR'
};

export const mockProvider = {
  id: 'provider-123',
  userId: 'user-provider-123',
  businessName: 'BarberShop Central',
  description: 'Barbería tradicional en el corazón de Buenos Aires',
  address: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  province: 'Buenos Aires',
  country: 'Argentina',
  postalCode: 'C1043',
  businessPhone: '+5491187654321',
  businessEmail: 'info@barbershopcentral.com.ar',
  taxId: '20-12345678-9',
  businessType: 'Barber Shop',
  isVerified: true,
  isActive: true,
  latitude: -34.6037,
  longitude: -58.3816
};

export const mockService = {
  id: 'service-123',
  name: 'Corte de cabello y barba',
  description: 'Corte clásico con barba y bigote',
  duration: 45,
  price: 2500.00,
  isActive: true,
  providerId: 'provider-123',
  categoryId: 'category-barber',
  depositRequired: false,
  bufferTimeBefore: 5,
  bufferTimeAfter: 10,
  maxAdvanceBookingDays: 30,
  allowSameDayBooking: true,
  requiresConsultation: false
};

export const mockBooking = {
  id: 'booking-123',
  clientId: 'user-123',
  serviceId: 'service-123',
  providerId: 'provider-123',
  startTime: new Date('2024-09-15T14:00:00.000Z'),
  endTime: new Date('2024-09-15T14:45:00.000Z'),
  status: 'PENDING',
  totalAmount: 2500.00,
  paymentStatus: 'PENDING',
  notes: 'Preferencia por corte clásico'
};

export const mockPayment = {
  id: 'payment-123',
  bookingId: 'booking-123',
  amount: 2500.00,
  currency: 'ARS',
  status: 'PENDING',
  paymentMethod: 'mercadopago',
  externalId: 'TEST-123456789-987654321',
  externalStatus: 'created',
  description: 'Corte de cabello y barba - BarberShop Central',
  metadata: {
    preferenceId: 'TEST-123456789-987654321',
    clientInfo: {
      email: 'juan.perez@example.com',
      name: 'Juan Carlos Pérez',
      phone: '+5491123456789',
      dni: '12345678'
    }
  }
};

// Payment Method Validation Test Cases
export const paymentMethodTestCases = {
  credit_card: {
    valid: {
      amount: 1000,
      installments: 6
    },
    invalidLowAmount: {
      amount: 50,
      installments: 1
    },
    invalidHighInstallments: {
      amount: 5000,
      installments: 15
    }
  },
  debit_card: {
    valid: {
      amount: 1000,
      installments: 1
    },
    invalidInstallments: {
      amount: 1000,
      installments: 3
    }
  },
  rapipago: {
    valid: {
      amount: 1000,
      installments: 1
    },
    invalidHighAmount: {
      amount: 60000,
      installments: 1
    }
  }
};

// Cancellation Test Scenarios
export const cancellationScenarios = {
  sameDayCancel: {
    bookingTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    expectedPenalty: 0.2 // 20%
  },
  oneDayCancel: {
    bookingTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    expectedPenalty: 0.2 // 20%
  },
  twoDayCancel: {
    bookingTime: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
    expectedPenalty: 0.1 // 10%
  },
  weekCancel: {
    bookingTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    expectedPenalty: 0 // No penalty
  }
};

// Error Scenarios
export const errorScenarios = {
  networkTimeout: {
    code: 'ETIMEDOUT',
    message: 'Request timeout'
  },
  mercadopagoServerError: {
    status: 500,
    message: 'Internal Server Error'
  },
  mercadopagoRateLimit: {
    status: 429,
    message: 'Too Many Requests'
  },
  invalidCredentials: {
    status: 401,
    message: 'Invalid credentials'
  },
  paymentRejected: {
    status: 'rejected',
    status_detail: 'cc_rejected_insufficient_amount'
  }
};

export default {
  mockMercadoPagoPreference,
  mockMercadoPagoPayment,
  validPaymentRequest,
  invalidPaymentRequests,
  mockWebhookPaymentApproved,
  mockWebhookPaymentRejected,
  mockUser,
  mockProvider,
  mockService,
  mockBooking,
  mockPayment,
  paymentMethodTestCases,
  cancellationScenarios,
  errorScenarios
};