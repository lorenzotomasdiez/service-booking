# MercadoPago Payment Testing Scenarios - Argentina Market

**Version:** 1.0  
**Date:** September 10, 2025  
**Author:** Payment Integration Specialist  

## Executive Summary

This document outlines comprehensive testing scenarios for MercadoPago payment integration in BarberPro's service booking platform, with specific focus on Argentina's payment ecosystem, user behaviors, and regulatory requirements.

## 1. Test Environment Setup

### 1.1 MercadoPago Test Credentials

**Test Environment Configuration:**
```env
# Test Environment Variables
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-your-test-access-token
MERCADOPAGO_PUBLIC_KEY_TEST=TEST-your-test-public-key
MERCADOPAGO_WEBHOOK_SECRET_TEST=test-webhook-secret-key
MERCADOPAGO_BASE_URL=https://api.mercadopago.com
```

**Test Account Setup:**
```javascript
const testConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_TEST,
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY_TEST,
  baseURL: 'https://api.mercadopago.com',
  sandbox: true
};
```

### 1.2 MercadoPago Test Cards

**Credit Cards for Testing:**

**✅ Approved Transactions:**
- **Visa:** 4009 1753 4280 6176
- **Mastercard:** 5031 4332 1540 6351
- **American Express:** 3711 803032 57522

**❌ Rejected Transactions:**
- **Insufficient Funds:** 4009 1753 4280 6177
- **Invalid Card:** 4009 1753 4280 6178
- **Security Code Error:** 4009 1753 4280 6179

**⏳ Pending Transactions:**
- **Pending Review:** 4009 1753 4280 6180
- **Manual Review Required:** 4009 1753 4280 6181

**Test CVV and Expiry:**
- **CVV:** 123 (use for all test cards)
- **Expiry:** Any future date (MM/YY format)
- **Cardholder:** Any name

### 1.3 Test User Personas

**Test Client Personas:**
```javascript
const testClientPersonas = {
  sofia_professional: {
    name: 'Sofía González',
    email: 'sofia.test@barberpro.com',
    phone: '+54 11 4567-8901',
    dni: '12345678',
    preferred_payment: 'credit_card',
    payment_behavior: 'prefers_installments'
  },
  
  martin_cash_user: {
    name: 'Martín Rodriguez',
    email: 'martin.test@barberpro.com',
    phone: '+54 11 8765-4321',
    dni: '87654321',
    preferred_payment: 'rapipago',
    payment_behavior: 'cash_oriented'
  },
  
  ana_digital_native: {
    name: 'Ana Fernández',
    email: 'ana.test@barberpro.com',
    phone: '+54 11 2345-6789',
    dni: '23456789',
    preferred_payment: 'mercadopago_wallet',
    payment_behavior: 'mobile_first'
  }
};
```

**Test Provider Personas:**
```javascript
const testProviderPersonas = {
  carlos_barber_shop: {
    business_name: 'Barbería Carlos',
    owner_name: 'Carlos Pérez',
    cuit: '20-12345678-9',
    bank_account: 'test_account_001',
    commission_tier: 'standard'
  },
  
  lucia_premium_salon: {
    business_name: 'Salón Lucía Premium',
    owner_name: 'Lucía Martínez',
    cuit: '27-87654321-4',
    bank_account: 'test_account_002',
    commission_tier: 'premium'
  }
};
```

## 2. Core Payment Flow Testing

### 2.1 Successful Payment Scenarios

**Test Case 1: Standard Credit Card Payment**
```javascript
describe('Standard Credit Card Payment', () => {
  const testScenario = {
    booking: {
      service: 'Corte de Cabello',
      duration: 60,
      price: 2500,
      provider: 'Carlos Pérez'
    },
    payment: {
      method: 'credit_card',
      card: '4009175342806176',
      installments: 1
    },
    expected: {
      status: 'approved',
      response_time: '<5s',
      booking_status: 'confirmed'
    }
  };

  it('should process single payment successfully', async () => {
    // Create booking
    const booking = await createTestBooking(testScenario.booking);
    
    // Create payment preference
    const preference = await paymentService.createPaymentPreference(booking);
    expect(preference.id).toBeDefined();
    
    // Simulate payment completion
    const payment = await simulatePayment(preference.id, testScenario.payment);
    expect(payment.status).toBe('approved');
    
    // Verify booking confirmation
    const updatedBooking = await getBooking(booking.id);
    expect(updatedBooking.status).toBe('confirmed');
    
    // Verify commission calculation
    const commission = await getCommission(payment.id);
    expect(commission.amount).toBe(87.50); // 3.5% of 2500
  });
});
```

**Test Case 2: Installment Payment (Cuotas)**
```javascript
describe('Installment Payment Processing', () => {
  const installmentScenarios = [
    { installments: 3, monthly_amount: 900, total_interest: 200 },
    { installments: 6, monthly_amount: 466.67, total_interest: 300 },
    { installments: 12, monthly_amount: 245.83, total_interest: 450 }
  ];

  installmentScenarios.forEach(scenario => {
    it(`should handle ${scenario.installments} installments`, async () => {
      const booking = await createTestBooking({
        service: 'Servicio Premium',
        price: 2500
      });
      
      const preference = await paymentService.createPaymentPreference({
        ...booking,
        installments: scenario.installments
      });
      
      expect(preference.payment_methods.installments).toBe(scenario.installments);
      
      const payment = await simulateInstallmentPayment(
        preference.id, 
        scenario.installments
      );
      
      expect(payment.status).toBe('approved');
      expect(payment.installments).toBe(scenario.installments);
    });
  });
});
```

**Test Case 3: MercadoPago Wallet Payment**
```javascript
describe('MercadoPago Wallet Payment', () => {
  it('should process wallet payment with saved methods', async () => {
    const booking = await createTestBooking({
      service: 'Corte + Barba',
      price: 3200
    });
    
    const preference = await paymentService.createPaymentPreference({
      ...booking,
      payer_id: 'test_user_ana'
    });
    
    const payment = await simulateWalletPayment(preference.id);
    
    expect(payment.status).toBe('approved');
    expect(payment.payment_method.type).toBe('account_money');
    expect(payment.transaction_amount).toBe(3200);
  });
});
```

### 2.2 Payment Failure Scenarios

**Test Case 4: Insufficient Funds Handling**
```javascript
describe('Insufficient Funds Scenarios', () => {
  it('should handle insufficient funds gracefully', async () => {
    const booking = await createTestBooking({
      service: 'Servicio Caro',
      price: 5000
    });
    
    const preference = await paymentService.createPaymentPreference(booking);
    
    const payment = await simulatePayment(preference.id, {
      card: '4009175342806177', // Insufficient funds test card
      amount: 5000
    });
    
    expect(payment.status).toBe('rejected');
    expect(payment.status_detail).toBe('cc_rejected_insufficient_amount');
    
    // Verify booking remains in payment_pending state
    const updatedBooking = await getBooking(booking.id);
    expect(updatedBooking.status).toBe('payment_pending');
    
    // Verify booking slot is held for retry
    const slot = await getBookingSlot(booking.slot_id);
    expect(slot.held_until).toBeAfter(Date.now() + 15 * 60 * 1000); // 15 minutes
  });
  
  it('should provide retry options for failed payments', async () => {
    // Implementation for payment retry flow
    const retryResponse = await paymentService.createRetryPayment(booking.id);
    expect(retryResponse.new_preference_id).toBeDefined();
  });
});
```

**Test Case 5: Network Timeout Handling**
```javascript
describe('Network Resilience', () => {
  it('should handle API timeouts gracefully', async () => {
    // Mock network timeout
    jest.spyOn(mercadopago.preference, 'create')
      .mockRejectedValueOnce(new Error('timeout'));
    
    const booking = await createTestBooking({
      service: 'Corte Básico',
      price: 1500
    });
    
    // Should retry with exponential backoff
    const preference = await paymentService.createPaymentPreference(booking);
    expect(preference).toBeDefined();
  });
  
  it('should maintain data consistency during failures', async () => {
    // Test database rollback on payment creation failure
    await testPaymentRollback();
  });
});
```

## 3. Argentina-Specific Payment Methods

### 3.1 Cash Payment Methods Testing

**Test Case 6: Rapipago Payment Processing**
```javascript
describe('Rapipago Cash Payment', () => {
  it('should create Rapipago payment ticket', async () => {
    const booking = await createTestBooking({
      service: 'Corte Básico',
      price: 2000,
      client: testClientPersonas.martin_cash_user
    });
    
    const preference = await paymentService.createPaymentPreference({
      ...booking,
      payment_methods: {
        excluded_payment_types: ['credit_card', 'debit_card'],
        included_payment_methods: ['rapipago']
      }
    });
    
    const payment = await simulateTicketPayment(preference.id, 'rapipago');
    
    expect(payment.status).toBe('pending');
    expect(payment.payment_method.id).toBe('rapipago');
    expect(payment.transaction_details.verification_code).toBeDefined();
    
    // Simulate customer payment at Rapipago location
    const webhookPayload = createRapipagoWebhookPayload(payment.id, 'approved');
    await processWebhook(webhookPayload);
    
    const finalPayment = await getPayment(payment.id);
    expect(finalPayment.status).toBe('approved');
  });
  
  it('should handle Rapipago expiration', async () => {
    // Test 72-hour ticket expiration
    const expiredPayment = await simulateExpiredTicket('rapipago');
    expect(expiredPayment.status).toBe('expired');
  });
});
```

**Test Case 7: Pago Fácil Integration**
```javascript
describe('Pago Fácil Cash Payment', () => {
  it('should generate Pago Fácil barcode', async () => {
    const booking = await createTestBooking({
      service: 'Corte + Lavado',
      price: 2800
    });
    
    const preference = await paymentService.createPaymentPreference({
      ...booking,
      payment_methods: {
        included_payment_methods: ['pagofacil']
      }
    });
    
    const payment = await simulateTicketPayment(preference.id, 'pagofacil');
    
    expect(payment.payment_method.id).toBe('pagofacil');
    expect(payment.transaction_details.external_resource_url).toContain('barcode');
  });
});
```

### 3.2 Bank Transfer Testing

**Test Case 8: Argentina Bank Transfer**
```javascript
describe('Bank Transfer Payment', () => {
  it('should process bank transfer payment', async () => {
    const booking = await createTestBooking({
      service: 'Tratamiento Completo',
      price: 4500
    });
    
    const preference = await paymentService.createPaymentPreference({
      ...booking,
      payment_methods: {
        included_payment_methods: ['bank_transfer']
      }
    });
    
    const payment = await simulateBankTransfer(preference.id);
    
    expect(payment.status).toBe('in_process');
    expect(payment.date_approved).toBeNull();
    
    // Bank transfers typically take 1-2 business days
    const approvedPayment = await simulateDelayedApproval(payment.id, '1 day');
    expect(approvedPayment.status).toBe('approved');
  });
});
```

## 4. Mobile Payment Experience Testing

### 4.1 Mobile Checkout Flow

**Test Case 9: Mobile-First Payment Experience**
```javascript
describe('Mobile Payment Experience', () => {
  it('should optimize for mobile screens', async () => {
    const mobileTest = {
      viewport: { width: 375, height: 812 }, // iPhone 12 dimensions
      user_agent: 'Mobile Safari Argentina'
    };
    
    const booking = await createTestBooking({
      service: 'Corte Express',
      price: 1800
    });
    
    const preference = await paymentService.createPaymentPreference({
      ...booking,
      additional_info: {
        payer: {
          phone: { number: '1155667788' }
        }
      }
    });
    
    // Test mobile checkout flow
    const checkoutUrl = preference.sandbox_init_point;
    const mobileResponse = await testMobileCheckout(checkoutUrl, mobileTest);
    
    expect(mobileResponse.mobile_optimized).toBe(true);
    expect(mobileResponse.touch_friendly).toBe(true);
  });
  
  it('should handle mobile payment methods', async () => {
    // Test mobile wallet integrations
    await testMobileWalletIntegration();
  });
});
```

### 4.2 WhatsApp Payment Integration

**Test Case 10: WhatsApp Payment Links**
```javascript
describe('WhatsApp Payment Integration', () => {
  it('should generate shareable payment links', async () => {
    const booking = await createTestBooking({
      service: 'Corte a Domicilio',
      price: 3500,
      payment_channel: 'whatsapp'
    });
    
    const paymentLink = await paymentService.createPaymentLink({
      ...booking,
      expiry_time: '24h'
    });
    
    expect(paymentLink.url).toContain('mercadopago.com.ar');
    expect(paymentLink.expiry_date).toBeDefined();
    
    // Test WhatsApp sharing
    const whatsappUrl = generateWhatsAppPaymentMessage(paymentLink.url);
    expect(whatsappUrl).toContain('wa.me');
  });
});
```

## 5. Commission & Fee Testing

### 5.1 Commission Calculation Testing

**Test Case 11: Tiered Commission Structure**
```javascript
describe('Commission Calculation', () => {
  const commissionScenarios = [
    { tier: 'standard', rate: 0.035, volume: 50 },
    { tier: 'high_volume', rate: 0.028, volume: 150 },
    { tier: 'premium', rate: 0.025, volume: 200 }
  ];
  
  commissionScenarios.forEach(scenario => {
    it(`should calculate ${scenario.tier} commission correctly`, async () => {
      const provider = await createTestProvider({
        tier: scenario.tier,
        monthly_volume: scenario.volume
      });
      
      const booking = await createTestBooking({
        provider_id: provider.id,
        price: 3000
      });
      
      const commission = await commissionService.calculate(booking);
      
      const expectedCommission = 3000 * scenario.rate;
      expect(commission.amount).toBe(expectedCommission);
      expect(commission.rate).toBe(scenario.rate);
      expect(commission.net_payout).toBe(3000 - expectedCommission);
    });
  });
});
```

**Test Case 12: Payout Schedule Testing**
```javascript
describe('Payout Processing', () => {
  it('should respect 10-day hold period', async () => {
    const payment = await createTestPayment({
      amount: 2500,
      status: 'approved',
      created_at: new Date('2025-09-01')
    });
    
    const commission = await commissionService.processCommission(payment);
    
    expect(commission.hold_until).toEqual(
      new Date('2025-09-11') // 10 days later
    );
    expect(commission.status).toBe('held');
    
    // Test payout release after hold period
    const releasedPayout = await simulatePayoutRelease(commission.id, '2025-09-12');
    expect(releasedPayout.status).toBe('ready_for_payout');
  });
  
  it('should batch payouts efficiently', async () => {
    const multiplePendingPayouts = await createMultiplePayouts(10);
    const batchPayout = await payoutService.processBatch(multiplePendingPayouts);
    
    expect(batchPayout.total_amount).toBeDefined();
    expect(batchPayout.processed_count).toBe(10);
  });
});
```

## 6. Error Handling & Edge Cases

### 6.1 Payment Dispute Testing

**Test Case 13: Chargeback Handling**
```javascript
describe('Payment Disputes', () => {
  it('should handle chargeback notifications', async () => {
    const originalPayment = await createApprovedPayment({
      amount: 4000,
      status: 'approved'
    });
    
    // Simulate chargeback webhook
    const chargebackWebhook = {
      type: 'payment',
      data: {
        id: originalPayment.mercadopago_id
      },
      status: 'charged_back'
    };
    
    await webhookService.processWebhook(chargebackWebhook);
    
    const updatedPayment = await getPayment(originalPayment.id);
    expect(updatedPayment.status).toBe('charged_back');
    
    // Verify commission reversal
    const commission = await getCommission(originalPayment.id);
    expect(commission.status).toBe('disputed');
  });
});
```

### 6.2 Concurrent Payment Testing

**Test Case 14: Race Condition Handling**
```javascript
describe('Concurrent Payment Processing', () => {
  it('should handle simultaneous booking attempts', async () => {
    const timeSlot = await createAvailableTimeSlot({
      provider_id: 'provider-123',
      start_time: '2025-09-15T14:00:00Z',
      duration: 60
    });
    
    // Simulate two clients trying to book the same slot
    const bookingPromises = [
      createBookingWithPayment(timeSlot, 'client-1'),
      createBookingWithPayment(timeSlot, 'client-2')
    ];
    
    const results = await Promise.allSettled(bookingPromises);
    
    // Only one booking should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);
  });
});
```

## 7. Webhook Testing

### 7.1 Webhook Security Testing

**Test Case 15: Webhook Signature Validation**
```javascript
describe('Webhook Security', () => {
  it('should validate webhook signatures', async () => {
    const validWebhook = {
      type: 'payment',
      data: { id: 'payment-123' }
    };
    
    const validSignature = generateValidSignature(validWebhook);
    
    const response = await request(app)
      .post('/api/webhooks/mercadopago')
      .set('x-signature', validSignature)
      .set('x-request-id', 'test-request-123')
      .send(validWebhook);
    
    expect(response.status).toBe(200);
  });
  
  it('should reject invalid webhook signatures', async () => {
    const invalidWebhook = {
      type: 'payment',
      data: { id: 'payment-456' }
    };
    
    const response = await request(app)
      .post('/api/webhooks/mercadopago')
      .set('x-signature', 'invalid-signature')
      .send(invalidWebhook);
    
    expect(response.status).toBe(401);
  });
});
```

### 7.2 Webhook Reliability Testing

**Test Case 16: Webhook Retry Logic**
```javascript
describe('Webhook Reliability', () => {
  it('should handle webhook processing failures', async () => {
    // Mock database failure
    jest.spyOn(prisma.payment, 'update')
      .mockRejectedValueOnce(new Error('Database connection failed'));
    
    const webhookPayload = {
      type: 'payment',
      data: { id: 'payment-789' }
    };
    
    const firstAttempt = await processWebhook(webhookPayload);
    expect(firstAttempt.status).toBe('failed');
    
    // Should succeed on retry
    const retryAttempt = await processWebhook(webhookPayload);
    expect(retryAttempt.status).toBe('processed');
  });
  
  it('should handle webhook replay attacks', async () => {
    const webhookPayload = {
      type: 'payment',
      data: { id: 'payment-101' }
    };
    
    // First webhook processing
    await processWebhook(webhookPayload);
    
    // Duplicate webhook should be ignored
    const duplicateResponse = await processWebhook(webhookPayload);
    expect(duplicateResponse.status).toBe('duplicate_ignored');
  });
});
```

## 8. Performance Testing

### 8.1 Load Testing Scenarios

**Test Case 17: High Concurrency Payment Processing**
```javascript
describe('Load Testing', () => {
  it('should handle 1000 concurrent payment requests', async () => {
    const concurrentRequests = Array.from({ length: 1000 }, (_, i) => 
      createPaymentPreference({
        booking_id: `booking-${i}`,
        amount: Math.floor(Math.random() * 5000) + 1000
      })
    );
    
    const startTime = Date.now();
    const results = await Promise.allSettled(concurrentRequests);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.status === 'fulfilled');
    const successRate = successful.length / 1000;
    
    expect(successRate).toBeGreaterThan(0.95); // 95% success rate
    expect(endTime - startTime).toBeLessThan(30000); // Under 30 seconds
  });
});
```

### 8.2 Database Performance Testing

**Test Case 18: Payment Query Performance**
```javascript
describe('Database Performance', () => {
  it('should handle payment history queries efficiently', async () => {
    // Create large dataset
    await createBulkPayments(10000);
    
    const startTime = Date.now();
    const paymentHistory = await paymentService.getProviderPaymentHistory(
      'provider-123',
      { 
        limit: 50,
        offset: 0,
        date_range: '30_days'
      }
    );
    const queryTime = Date.now() - startTime;
    
    expect(queryTime).toBeLessThan(500); // Under 500ms
    expect(paymentHistory.length).toBeLessThan(51);
  });
});
```

## 9. Regulatory Compliance Testing

### 9.1 AFIP Integration Testing

**Test Case 19: Tax Calculation Compliance**
```javascript
describe('Argentina Tax Compliance', () => {
  it('should calculate IVA correctly for services', async () => {
    const booking = await createTestBooking({
      service: 'Servicio Profesional',
      price: 2100 // Base price without IVA
    });
    
    const taxCalculation = await taxService.calculateServiceTax(booking);
    
    expect(taxCalculation.base_amount).toBe(2100);
    expect(taxCalculation.iva_amount).toBe(441); // 21% IVA
    expect(taxCalculation.total_amount).toBe(2541);
    expect(taxCalculation.tax_category).toBe('servicios_profesionales');
  });
  
  it('should generate electronic invoice data', async () => {
    const payment = await createApprovedPayment({
      amount: 2541,
      provider_cuit: '20-12345678-9'
    });
    
    const invoiceData = await afipService.generateInvoiceData(payment);
    
    expect(invoiceData.tipo_comprobante).toBe('006'); // Factura B
    expect(invoiceData.punto_venta).toBeDefined();
    expect(invoiceData.numero_comprobante).toBeDefined();
    expect(invoiceData.cuit_emisor).toBe('20-12345678-9');
  });
});
```

## 10. User Experience Testing

### 10.1 Payment Flow UX Testing

**Test Case 20: User Journey Validation**
```javascript
describe('Payment User Experience', () => {
  it('should complete booking to payment in under 3 minutes', async () => {
    const userJourney = new PaymentUserJourney();
    
    const startTime = Date.now();
    
    // Step 1: Service selection
    await userJourney.selectService('Corte de Cabello');
    
    // Step 2: Provider selection
    await userJourney.selectProvider('Carlos Pérez');
    
    // Step 3: Time slot selection
    await userJourney.selectTimeSlot('2025-09-15T14:00:00Z');
    
    // Step 4: Payment method selection
    await userJourney.selectPaymentMethod('credit_card');
    
    // Step 5: Payment completion
    await userJourney.completePayment();
    
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(180000); // Under 3 minutes
    expect(userJourney.currentStatus).toBe('booking_confirmed');
  });
});
```

### 10.2 Error Message Testing

**Test Case 21: User-Friendly Error Messages**
```javascript
describe('Error Message Localization', () => {
  const errorScenarios = [
    {
      error: 'cc_rejected_insufficient_amount',
      expected: 'Tu tarjeta no tiene fondos suficientes. Intentá con otra tarjeta o método de pago.'
    },
    {
      error: 'cc_rejected_bad_filled_security_code',
      expected: 'Revisá el código de seguridad de tu tarjeta.'
    },
    {
      error: 'cc_rejected_call_for_authorize',
      expected: 'Contactá a tu banco para autorizar el pago.'
    }
  ];
  
  errorScenarios.forEach(scenario => {
    it(`should display localized message for ${scenario.error}`, async () => {
      const localizedMessage = await errorService.getLocalizedMessage(
        scenario.error,
        'es-AR'
      );
      
      expect(localizedMessage).toBe(scenario.expected);
    });
  });
});
```

## 11. Test Automation & CI/CD

### 11.1 Automated Test Suite

**Test Execution Pipeline:**
```yaml
# .github/workflows/payment-tests.yml
name: Payment Integration Tests

on:
  push:
    paths:
      - 'src/services/payment/**'
      - 'src/routes/payment/**'
  pull_request:
    paths:
      - 'src/services/payment/**'

jobs:
  payment-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run payment unit tests
        run: npm run test:payment:unit
        env:
          MERCADOPAGO_ACCESS_TOKEN_TEST: ${{ secrets.MP_TEST_TOKEN }}
      
      - name: Run payment integration tests
        run: npm run test:payment:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          MERCADOPAGO_ACCESS_TOKEN_TEST: ${{ secrets.MP_TEST_TOKEN }}
      
      - name: Run payment E2E tests
        run: npm run test:payment:e2e
        env:
          MERCADOPAGO_ACCESS_TOKEN_TEST: ${{ secrets.MP_TEST_TOKEN }}
```

### 11.2 Test Coverage Requirements

**Minimum Coverage Targets:**
- **Unit Tests:** >90% code coverage
- **Integration Tests:** >85% critical path coverage
- **E2E Tests:** >95% user journey coverage

**Coverage Validation:**
```javascript
// jest.config.js - Payment module coverage
module.exports = {
  collectCoverageFrom: [
    'src/services/payment/**/*.ts',
    'src/routes/payment/**/*.ts',
    'src/utils/payment/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/services/payment/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

## 12. Production Monitoring Tests

### 12.1 Health Check Testing

**Test Case 22: Payment System Health Monitoring**
```javascript
describe('Payment System Health', () => {
  it('should provide comprehensive health status', async () => {
    const healthCheck = await paymentService.healthCheck();
    
    expect(healthCheck.mercadopago_api).toBe('operational');
    expect(healthCheck.database_connection).toBe('operational');
    expect(healthCheck.webhook_processing).toBe('operational');
    expect(healthCheck.commission_calculation).toBe('operational');
    
    expect(healthCheck.metrics.success_rate).toBeGreaterThan(0.95);
    expect(healthCheck.metrics.avg_response_time).toBeLessThan(500);
  });
});
```

### 12.2 Alerting System Testing

**Test Case 23: Critical Alert Validation**
```javascript
describe('Payment Alerting System', () => {
  it('should trigger alert for low success rate', async () => {
    // Simulate multiple payment failures
    await simulatePaymentFailures(10);
    
    const alert = await alertService.checkPaymentSuccessRate();
    
    expect(alert.triggered).toBe(true);
    expect(alert.severity).toBe('critical');
    expect(alert.message).toContain('Payment success rate below 90%');
  });
});
```

## Summary & Test Execution Strategy

### Test Priority Matrix

**Critical Priority (P0) - Must Pass Before Production:**
1. Successful payment processing for all Argentina payment methods
2. Commission calculation accuracy
3. Webhook security and reliability
4. Payment failure handling and recovery
5. Mobile payment experience

**High Priority (P1) - Must Pass Before Launch:**
1. Performance under load (1000+ concurrent requests)
2. Error message localization and UX
3. Tax compliance and AFIP integration
4. Refund processing reliability
5. Database consistency during failures

**Medium Priority (P2) - Should Pass Before Launch:**
1. Advanced payment method testing (installments, bank transfers)
2. User journey optimization
3. Monitoring and alerting validation
4. Edge case handling
5. Integration with external systems

### Test Execution Schedule

**Days 10-11: Development Testing**
- Unit tests during development
- Integration tests for each feature
- Local payment flow validation

**Day 12: Comprehensive Testing**
- Full test suite execution
- Load testing and performance validation
- Security testing and penetration testing

**Day 13: User Acceptance Testing**
- End-to-end user journey testing
- Mobile device testing across Argentina
- Payment method preference validation

**Day 14: Production Readiness Testing**
- Health check and monitoring validation
- Disaster recovery testing
- Final security audit and compliance check

---

**Document Status:** ✅ Complete  
**Test Coverage:** Comprehensive Argentina market testing  
**Implementation Dependencies:** MercadoPago SDK, Backend foundation  
**Timeline:** Ready for Day 10 implementation testing