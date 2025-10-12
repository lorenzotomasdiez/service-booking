const paymentService = require('../services/payment.service');

describe('Payment Service', () => {
  beforeEach(() => {
    // Clear all payments before each test
    paymentService.clearAllPayments();
  });

  describe('validatePaymentRequest', () => {
    test('validates payment with all required fields', () => {
      const validPayment = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const errors = paymentService.validatePaymentRequest(validPayment);
      expect(errors).toHaveLength(0);
    });

    test('rejects payment without transaction_amount', () => {
      const invalidPayment = {
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('transaction_amount must be greater than 0');
    });

    test('rejects payment with zero transaction_amount', () => {
      const invalidPayment = {
        transaction_amount: 0,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('transaction_amount must be greater than 0');
    });

    test('rejects payment without payment_method_id', () => {
      const invalidPayment = {
        transaction_amount: 100,
        payer: {
          email: 'test@example.com'
        }
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('payment_method_id is required');
    });

    test('rejects payment without payer', () => {
      const invalidPayment = {
        transaction_amount: 100,
        payment_method_id: 'visa'
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('payer information is required');
    });

    test('rejects payment without payer email', () => {
      const invalidPayment = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {}
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('payer.email is required');
    });

    test('rejects payment with invalid installments (too low)', () => {
      const invalidPayment = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        },
        installments: 0
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('installments must be between 1 and 24');
    });

    test('rejects payment with invalid installments (too high)', () => {
      const invalidPayment = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        },
        installments: 25
      };

      const errors = paymentService.validatePaymentRequest(invalidPayment);
      expect(errors).toContain('installments must be between 1 and 24');
    });
  });

  describe('createPayment', () => {
    test('creates payment with valid data', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'success');

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.status).toBe('approved');
      expect(payment.transaction_amount).toBe(100);
      expect(payment.payment_method_id).toBe('visa');
      expect(payment.payer.email).toBe('test@example.com');
    });

    test('creates payment with pending scenario', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'pending');

      expect(payment.status).toBe('pending');
      expect(payment.status_detail).toBe('pending_waiting_payment');
    });

    test('creates payment with rejected scenario', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'rejected_insufficient_amount');

      expect(payment.status).toBe('rejected');
      expect(payment.status_detail).toBe('cc_rejected_insufficient_amount');
    });

    test('generates unique payment IDs', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment1 = paymentService.createPayment(paymentData, 'success');
      const payment2 = paymentService.createPayment(paymentData, 'success');

      expect(payment1.id).not.toBe(payment2.id);
    });

    test('stores payment metadata', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        },
        metadata: {
          order_id: '12345'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'success');

      expect(payment.metadata.order_id).toBe('12345');
    });
  });

  describe('getPayment', () => {
    test('retrieves existing payment', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const created = paymentService.createPayment(paymentData, 'success');
      const retrieved = paymentService.getPayment(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    test('returns undefined for non-existent payment', () => {
      const retrieved = paymentService.getPayment(999999999);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updatePaymentStatus', () => {
    test('updates payment status successfully', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'pending');
      const updated = paymentService.updatePaymentStatus(payment.id, 'approved', 'accredited');

      expect(updated.status).toBe('approved');
      expect(updated.status_detail).toBe('accredited');
      expect(updated.date_approved).toBeDefined();
    });

    test('returns null for non-existent payment', () => {
      const updated = paymentService.updatePaymentStatus(999999999, 'approved', 'accredited');
      expect(updated).toBeNull();
    });
  });

  describe('createRefund', () => {
    test('creates full refund for approved payment', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'success');
      const refund = paymentService.createRefund(payment.id);

      expect(refund.error).toBeUndefined();
      expect(refund.id).toBeDefined();
      expect(refund.amount).toBe(100);
      expect(refund.status).toBe('approved');
    });

    test('creates partial refund', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'success');
      const refund = paymentService.createRefund(payment.id, 50);

      expect(refund.amount).toBe(50);
    });

    test('rejects refund for non-existent payment', () => {
      const refund = paymentService.createRefund(999999999);
      expect(refund.error).toBe('payment_not_found');
    });

    test('rejects refund for non-approved payment', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'pending');
      const refund = paymentService.createRefund(payment.id);

      expect(refund.error).toBe('payment_not_approved');
    });

    test('rejects refund exceeding payment amount', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      const payment = paymentService.createPayment(paymentData, 'success');
      const refund = paymentService.createRefund(payment.id, 150);

      expect(refund.error).toBe('amount_exceeds_payment');
    });
  });

  describe('getPaymentMethods', () => {
    test('returns list of payment methods', () => {
      const methods = paymentService.getPaymentMethods();

      expect(methods).toBeDefined();
      expect(Array.isArray(methods)).toBe(true);
      expect(methods.length).toBeGreaterThan(0);
    });

    test('payment methods include visa', () => {
      const methods = paymentService.getPaymentMethods();
      const visa = methods.find(m => m.id === 'visa');

      expect(visa).toBeDefined();
      expect(visa.payment_type_id).toBe('credit_card');
    });
  });

  describe('getStatistics', () => {
    test('returns correct statistics for empty state', () => {
      const stats = paymentService.getStatistics();

      expect(stats.total_payments).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.total_amount).toBe(0);
    });

    test('returns correct statistics with multiple payments', () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      paymentService.createPayment(paymentData, 'success');
      paymentService.createPayment(paymentData, 'pending');
      paymentService.createPayment(paymentData, 'rejected_insufficient_amount');

      const stats = paymentService.getStatistics();

      expect(stats.total_payments).toBe(3);
      expect(stats.approved).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.total_amount).toBe(300);
    });
  });
});
