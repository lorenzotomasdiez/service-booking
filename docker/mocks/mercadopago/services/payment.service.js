const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// In-memory storage for payments
const payments = new Map();
const refunds = new Map();

// Load scenarios
let scenarios;
try {
  scenarios = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../config/scenarios.json'), 'utf8')
  );
} catch (error) {
  logger.error('Failed to load scenarios.json', error);
  scenarios = { default: 'success', scenarios: {}, payment_methods: {} };
}

// Payment ID counter
let paymentIdCounter = 1000000000;
let refundIdCounter = 2000000000;

/**
 * Generate a unique payment ID
 */
function generatePaymentId() {
  return ++paymentIdCounter;
}

/**
 * Generate a unique refund ID
 */
function generateRefundId() {
  return ++refundIdCounter;
}

/**
 * Get scenario configuration
 */
function getScenario(scenarioName) {
  const name = scenarioName || scenarios.default;
  return scenarios.scenarios[name] || scenarios.scenarios[scenarios.default];
}

/**
 * Validate payment request
 */
function validatePaymentRequest(body) {
  const errors = [];

  if (!body.transaction_amount || body.transaction_amount <= 0) {
    errors.push('transaction_amount must be greater than 0');
  }

  if (!body.payment_method_id) {
    errors.push('payment_method_id is required');
  }

  if (!body.payer) {
    errors.push('payer information is required');
  } else {
    if (!body.payer.email) {
      errors.push('payer.email is required');
    }
  }

  if (body.installments && (body.installments < 1 || body.installments > 24)) {
    errors.push('installments must be between 1 and 24');
  }

  return errors;
}

/**
 * Create a new payment
 */
function createPayment(body, scenarioName) {
  const scenario = getScenario(scenarioName);
  const paymentId = generatePaymentId();
  
  const payment = {
    id: paymentId,
    date_created: new Date().toISOString(),
    date_approved: scenario.status === 'approved' ? new Date().toISOString() : null,
    date_last_updated: new Date().toISOString(),
    money_release_date: scenario.status === 'approved' 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
      : null,
    operation_type: 'regular_payment',
    issuer_id: '25',
    payment_method_id: body.payment_method_id,
    payment_type_id: body.payment_type_id || 'credit_card',
    status: scenario.status,
    status_detail: scenario.status_detail,
    currency_id: 'ARS',
    description: body.description || 'Payment',
    live_mode: false,
    sponsor_id: null,
    authorization_code: scenario.status === 'approved' ? '1234567' : null,
    money_release_schema: null,
    taxes_amount: 0,
    counter_currency: null,
    shipping_amount: 0,
    pos_id: null,
    store_id: null,
    collector_id: 123456789,
    payer: {
      id: body.payer.id || '987654321',
      email: body.payer.email,
      identification: body.payer.identification || {},
      phone: body.payer.phone || {},
      type: 'guest',
      entity_type: null,
      first_name: body.payer.first_name || null,
      last_name: body.payer.last_name || null
    },
    metadata: body.metadata || {},
    additional_info: body.additional_info || {},
    order: {},
    external_reference: body.external_reference || null,
    transaction_amount: body.transaction_amount,
    transaction_amount_refunded: 0,
    coupon_amount: 0,
    differential_pricing_id: null,
    deduction_schema: null,
    transaction_details: {
      payment_method_reference_id: null,
      net_received_amount: scenario.status === 'approved' 
        ? body.transaction_amount - (body.transaction_amount * 0.029) // 2.9% fee
        : 0,
      total_paid_amount: body.transaction_amount,
      overpaid_amount: 0,
      external_resource_url: null,
      installment_amount: body.installments 
        ? (body.transaction_amount / body.installments).toFixed(2)
        : body.transaction_amount,
      financial_institution: null,
      payable_deferral_period: null,
      acquirer_reference: null
    },
    fee_details: scenario.status === 'approved' ? [
      {
        type: 'mercadopago_fee',
        amount: body.transaction_amount * 0.029,
        fee_payer: 'collector'
      }
    ] : [],
    captured: true,
    binary_mode: false,
    call_for_authorize_id: null,
    statement_descriptor: 'BarberPro',
    installments: body.installments || 1,
    card: body.token ? {
      id: null,
      first_six_digits: '450995',
      last_four_digits: '3704',
      expiration_month: 11,
      expiration_year: 2025,
      date_created: new Date().toISOString(),
      date_last_updated: new Date().toISOString(),
      cardholder: {
        name: body.payer.first_name && body.payer.last_name
          ? `${body.payer.first_name} ${body.payer.last_name}`
          : 'APRO',
        identification: body.payer.identification || {}
      }
    } : null,
    notification_url: body.notification_url || null,
    refunds: [],
    processing_mode: 'aggregator',
    merchant_account_id: null,
    acquirer: null,
    merchant_number: null,
    _scenario: scenarioName || scenarios.default,
    _delay_ms: scenario.delay_ms || 0
  };

  payments.set(paymentId, payment);
  logger.info(`Payment created: ${paymentId} with status ${scenario.status}`);
  
  return payment;
}

/**
 * Get payment by ID
 */
function getPayment(paymentId) {
  return payments.get(parseInt(paymentId));
}

/**
 * Update payment status
 */
function updatePaymentStatus(paymentId, status, statusDetail) {
  const payment = payments.get(parseInt(paymentId));
  
  if (!payment) {
    return null;
  }

  payment.status = status;
  payment.status_detail = statusDetail;
  payment.date_last_updated = new Date().toISOString();

  if (status === 'approved' && !payment.date_approved) {
    payment.date_approved = new Date().toISOString();
    payment.authorization_code = '1234567';
  }

  payments.set(parseInt(paymentId), payment);
  logger.info(`Payment ${paymentId} status updated to ${status}`);
  
  return payment;
}

/**
 * Create a refund
 */
function createRefund(paymentId, amount) {
  const payment = payments.get(parseInt(paymentId));
  
  if (!payment) {
    return { error: 'payment_not_found' };
  }

  if (payment.status !== 'approved') {
    return { error: 'payment_not_approved' };
  }

  const remainingAmount = payment.transaction_amount - payment.transaction_amount_refunded;
  
  if (amount > remainingAmount) {
    return { error: 'amount_exceeds_payment' };
  }

  const refundId = generateRefundId();
  const refund = {
    id: refundId,
    payment_id: paymentId,
    amount: amount || remainingAmount,
    metadata: {},
    source: {
      id: '123456789',
      name: 'Collector',
      type: 'collector'
    },
    date_created: new Date().toISOString(),
    unique_sequence_number: null,
    refund_mode: 'standard',
    adjustment_amount: 0,
    status: 'approved',
    reason: 'Refund requested'
  };

  payment.transaction_amount_refunded += refund.amount;
  payment.refunds.push(refund);
  
  if (payment.transaction_amount_refunded >= payment.transaction_amount) {
    payment.status = 'refunded';
  }

  refunds.set(refundId, refund);
  payments.set(parseInt(paymentId), payment);
  
  logger.info(`Refund ${refundId} created for payment ${paymentId}`);
  
  return refund;
}

/**
 * Get all payment methods
 */
function getPaymentMethods() {
  const allMethods = [];
  
  Object.keys(scenarios.payment_methods).forEach(type => {
    allMethods.push(...scenarios.payment_methods[type]);
  });
  
  return allMethods;
}

/**
 * Get payment methods by type
 */
function getPaymentMethodsByType(type) {
  return scenarios.payment_methods[type] || [];
}

/**
 * Get all payments (for dashboard)
 */
function getAllPayments() {
  return Array.from(payments.values()).reverse();
}

/**
 * Clear all payments (for testing)
 */
function clearAllPayments() {
  payments.clear();
  refunds.clear();
  paymentIdCounter = 1000000000;
  refundIdCounter = 2000000000;
  logger.info('All payments and refunds cleared');
}

/**
 * Get statistics
 */
function getStatistics() {
  const allPayments = Array.from(payments.values());
  
  return {
    total_payments: allPayments.length,
    approved: allPayments.filter(p => p.status === 'approved').length,
    pending: allPayments.filter(p => p.status === 'pending').length,
    rejected: allPayments.filter(p => p.status === 'rejected').length,
    refunded: allPayments.filter(p => p.status === 'refunded').length,
    total_amount: allPayments.reduce((sum, p) => sum + p.transaction_amount, 0),
    total_refunded: allPayments.reduce((sum, p) => sum + p.transaction_amount_refunded, 0)
  };
}

module.exports = {
  generatePaymentId,
  generateRefundId,
  getScenario,
  validatePaymentRequest,
  createPayment,
  getPayment,
  updatePaymentStatus,
  createRefund,
  getPaymentMethods,
  getPaymentMethodsByType,
  getAllPayments,
  clearAllPayments,
  getStatistics
};
