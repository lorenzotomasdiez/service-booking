const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// In-memory storage for payments
const payments = new Map();

// Load scenarios configuration
let scenarios = {};
try {
  const scenariosPath = path.join(__dirname, '../config/scenarios.json');
  scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
} catch (error) {
  console.error('Failed to load scenarios.json:', error.message);
  scenarios = { default: 'success', scenarios: {} };
}

// ===== Payment Operations (Stream A) =====

/**
 * Get scenario configuration
 * @param {string} scenarioName - Name of the scenario to load
 * @returns {object} Scenario configuration
 */
function getScenario(scenarioName) {
  const name = scenarioName || scenarios.default || 'success';
  const scenario = scenarios.scenarios[name];

  if (!scenario) {
    throw new Error(`Scenario '${name}' not found`);
  }

  return { ...scenario, name };
}

/**
 * Generate a unique payment ID
 * @returns {string} Payment ID
 */
function generatePaymentId() {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

/**
 * Validate payment request
 * @param {object} paymentData - Payment data to validate
 * @returns {object} Validation result
 */
function validatePaymentRequest(paymentData) {
  const errors = [];

  if (!paymentData.transaction_amount || paymentData.transaction_amount <= 0) {
    errors.push('transaction_amount is required and must be greater than 0');
  }

  if (!paymentData.payment_method_id) {
    errors.push('payment_method_id is required');
  }

  if (!paymentData.payer || !paymentData.payer.email) {
    errors.push('payer.email is required');
  }

  // Validate Argentina-specific payment methods
  const validPaymentMethods = [
    'visa', 'master', 'amex', 'naranja', 'cabal', 'maestro',
    'mercadopago', 'account_money', 'debin_transfer',
    'rapipago', 'pagofacil', 'bapropagos', 'cargavirtual'
  ];

  if (paymentData.payment_method_id && !validPaymentMethods.includes(paymentData.payment_method_id)) {
    errors.push(`payment_method_id '${paymentData.payment_method_id}' is not supported. Valid methods: ${validPaymentMethods.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate installment amount
 * @param {number} amount - Total transaction amount
 * @param {number} installments - Number of installments
 * @returns {object} Installment details
 */
function calculateInstallments(amount, installments = 1) {
  const installmentAmount = amount / installments;
  const totalAmount = amount;

  return {
    installments,
    installment_amount: parseFloat(installmentAmount.toFixed(2)),
    total_amount: parseFloat(totalAmount.toFixed(2)),
  };
}

/**
 * Create a new payment
 * @param {object} paymentData - Payment request data
 * @param {string} scenarioName - Scenario to apply
 * @returns {Promise<object>} Created payment
 */
async function createPayment(paymentData, scenarioName) {
  // Validate payment request
  const validation = validatePaymentRequest(paymentData);
  if (!validation.valid) {
    const error = new Error('Invalid payment request');
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }

  // Get scenario configuration
  const scenario = getScenario(scenarioName);

  // Simulate network delay
  if (scenario.delay_ms) {
    await sleep(scenario.delay_ms);
  }

  // Simulate timeout
  if (scenario.simulate_timeout) {
    await sleep(scenario.delay_ms || 30000);
    const error = new Error('Request timeout');
    error.statusCode = 408;
    throw error;
  }

  // Simulate server error
  if (scenario.simulate_error) {
    const error = new Error(scenario.message || 'Internal server error');
    error.statusCode = scenario.status_code || 500;
    throw error;
  }

  // Calculate installments
  const installmentDetails = calculateInstallments(
    paymentData.transaction_amount,
    paymentData.installments || 1
  );

  // Generate payment ID
  const paymentId = generatePaymentId();

  // Create payment object
  const payment = {
    id: paymentId,
    status: scenario.status,
    status_detail: scenario.status_detail,
    transaction_amount: paymentData.transaction_amount,
    currency_id: paymentData.currency_id || 'ARS',
    description: paymentData.description || '',
    payment_method_id: paymentData.payment_method_id,
    payment_type_id: getPaymentTypeId(paymentData.payment_method_id),
    installments: installmentDetails.installments,
    installment_amount: installmentDetails.installment_amount,
    payer: {
      id: paymentData.payer.id || generatePaymentId(),
      email: paymentData.payer.email,
      identification: paymentData.payer.identification || {},
      phone: paymentData.payer.phone || {},
      type: paymentData.payer.type || 'guest',
    },
    metadata: paymentData.metadata || {},
    additional_info: paymentData.additional_info || {},
    date_created: new Date().toISOString(),
    date_approved: scenario.status === 'approved' ? new Date().toISOString() : null,
    date_last_updated: new Date().toISOString(),
    money_release_date: scenario.status === 'approved'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null,
    collector_id: 123456789,
    operation_type: 'regular_payment',
    live_mode: false,
    scenario: scenario.name,
  };

  // Store payment
  payments.set(paymentId, payment);

  return payment;
}

/**
 * Get payment by ID
 * @param {number} paymentId - Payment ID
 * @returns {object} Payment data
 */
function getPayment(paymentId) {
  const payment = payments.get(parseInt(paymentId));

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  return payment;
}

/**
 * Update payment status
 * @param {number} paymentId - Payment ID
 * @param {object} updates - Payment updates
 * @returns {object} Updated payment
 */
function updatePayment(paymentId, updates) {
  const payment = getPayment(paymentId);

  const updatedPayment = {
    ...payment,
    ...updates,
    date_last_updated: new Date().toISOString(),
  };

  // Update approved date if status changes to approved
  if (updates.status === 'approved' && payment.status !== 'approved') {
    updatedPayment.date_approved = new Date().toISOString();
    updatedPayment.money_release_date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  payments.set(parseInt(paymentId), updatedPayment);
  return updatedPayment;
}

/**
 * Get all payments
 * @returns {array} List of all payments
 */
function getAllPayments() {
  return Array.from(payments.values());
}

/**
 * Clear all payments from storage
 */
function clearPayments() {
  payments.clear();
}

// ===== Refund Operations (Stream B will add) =====
// function createRefund(paymentId, refundData) { ... }
// function getRefund(paymentId, refundId) { ... }

// ===== Utility Functions =====

/**
 * Sleep utility for simulating delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get payment type ID from payment method
 * @param {string} paymentMethodId - Payment method ID
 * @returns {string} Payment type ID
 */
function getPaymentTypeId(paymentMethodId) {
  const cardMethods = ['visa', 'master', 'amex', 'naranja', 'cabal', 'maestro'];
  const ticketMethods = ['rapipago', 'pagofacil', 'bapropagos', 'cargavirtual'];
  const bankTransferMethods = ['debin_transfer'];
  const accountMoneyMethods = ['account_money', 'mercadopago'];

  if (cardMethods.includes(paymentMethodId)) {
    return 'credit_card';
  } else if (ticketMethods.includes(paymentMethodId)) {
    return 'ticket';
  } else if (bankTransferMethods.includes(paymentMethodId)) {
    return 'bank_transfer';
  } else if (accountMoneyMethods.includes(paymentMethodId)) {
    return 'account_money';
  }

  return 'other';
}

module.exports = {
  // Payment operations
  createPayment,
  getPayment,
  updatePayment,
  getAllPayments,
  clearPayments,

  // Utilities
  getScenario,
  validatePaymentRequest,
  calculateInstallments,
};
