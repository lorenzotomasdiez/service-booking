const request = require('supertest');
const express = require('express');
const paymentService = require('../services/payment.service');
const webhookService = require('../services/webhook.service');

// Create a simple webhook receiver for testing
function createWebhookReceiver() {
  const app = express();
  const receivedWebhooks = [];
  
  app.use(express.json());
  
  app.post('/webhook', (req, res) => {
    receivedWebhooks.push({
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    res.status(200).json({ received: true });
  });
  
  return { app, receivedWebhooks };
}

describe('Webhook Integration Tests', () => {
  let app;
  let webhookReceiver;
  let webhookServer;
  const WEBHOOK_PORT = 3333;

  beforeAll((done) => {
    // Start webhook receiver server
    const receiver = createWebhookReceiver();
    webhookReceiver = receiver;
    webhookServer = receiver.app.listen(WEBHOOK_PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    webhookServer.close(done);
  });

  beforeEach(() => {
    // Clear all payments and webhooks before each test
    paymentService.clearAllPayments();
    webhookReceiver.receivedWebhooks.length = 0;
    
    // Load the main app
    app = require('../index');
  });

  describe('Payment Flow Integration', () => {
    test('creates payment and sends webhook', async () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        },
        notification_url: `http://localhost:${WEBHOOK_PORT}/webhook`
      };

      // Create payment
      const response = await request(app)
        .post('/v1/payments')
        .send(paymentData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('approved');

      // Wait for webhook to be delivered
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify webhook was received
      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
      const webhook = webhookReceiver.receivedWebhooks[0];
      
      expect(webhook.body.type).toBe('payment');
      expect(webhook.body.action).toBe('payment.created');
      expect(webhook.body.data.id).toBe(String(response.body.id));
    });

    test('webhook includes proper headers', async () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        },
        notification_url: `http://localhost:${WEBHOOK_PORT}/webhook`
      };

      await request(app)
        .post('/v1/payments')
        .send(paymentData)
        .expect(201);

      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
      const webhook = webhookReceiver.receivedWebhooks[0];
      
      expect(webhook.headers['content-type']).toContain('application/json');
      expect(webhook.headers['x-signature']).toBeDefined();
      expect(webhook.headers['x-request-id']).toBeDefined();
    });

    test('refund triggers webhook', async () => {
      // Create payment first
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        },
        notification_url: `http://localhost:${WEBHOOK_PORT}/webhook`
      };

      const createResponse = await request(app)
        .post('/v1/payments')
        .send(paymentData)
        .expect(201);

      const paymentId = createResponse.body.id;

      // Wait for initial webhook
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear webhooks
      webhookReceiver.receivedWebhooks.length = 0;

      // Create refund
      await request(app)
        .post(`/v1/payments/${paymentId}/refunds`)
        .send({ amount: 50 })
        .expect(201);

      // Wait for refund webhook
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify refund webhook was received
      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
      const webhook = webhookReceiver.receivedWebhooks[0];
      
      expect(webhook.body.action).toBe('payment.updated');
    });
  });

  describe('Payment Status Transitions', () => {
    test('pending payment can be updated to approved', async () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'rapipago',
        payer: {
          email: 'test@example.com'
        }
      };

      // Create pending payment
      const response = await request(app)
        .post('/v1/payments?scenario=pending')
        .send(paymentData)
        .expect(201);

      expect(response.body.status).toBe('pending');

      const paymentId = response.body.id;

      // Update payment status
      const updated = paymentService.updatePaymentStatus(paymentId, 'approved', 'accredited');

      expect(updated.status).toBe('approved');
      expect(updated.date_approved).toBeDefined();
      expect(updated.authorization_code).toBeDefined();

      // Verify via API
      const getResponse = await request(app)
        .get(`/v1/payments/${paymentId}`)
        .expect(200);

      expect(getResponse.body.status).toBe('approved');
    });

    test('payment status transitions are persisted', async () => {
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      };

      // Create payment
      const response = await request(app)
        .post('/v1/payments?scenario=pending')
        .send(paymentData)
        .expect(201);

      const paymentId = response.body.id;

      // Transition through states
      paymentService.updatePaymentStatus(paymentId, 'in_process', 'pending_contingency');
      paymentService.updatePaymentStatus(paymentId, 'approved', 'accredited');

      // Verify final state
      const getResponse = await request(app)
        .get(`/v1/payments/${paymentId}`)
        .expect(200);

      expect(getResponse.body.status).toBe('approved');
      expect(getResponse.body.status_detail).toBe('accredited');
    });
  });

  describe('Webhook Service', () => {
    test('generates unique webhook IDs', () => {
      const id1 = webhookService.generateWebhookId();
      const id2 = webhookService.generateWebhookId();

      expect(id1).not.toBe(id2);
    });

    test('generates signature for webhook', () => {
      const webhook = {
        id: 123456,
        data: {
          id: '789'
        }
      };

      const signature = webhookService.generateSignature(webhook);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    test('sendWebhook handles successful delivery', async () => {
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      const result = await webhookService.sendWebhook(
        `http://localhost:${WEBHOOK_PORT}/webhook`,
        payment,
        'payment.created'
      );

      expect(result.status).toBe('delivered');
      expect(result.webhook_id).toBeDefined();
    });

    test('sendWebhook handles failed delivery', async () => {
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      const result = await webhookService.sendWebhook(
        'http://invalid-url-that-does-not-exist:9999/webhook',
        payment,
        'payment.created'
      );

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    test('sendWebhook handles missing webhook URL', async () => {
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      const result = await webhookService.sendWebhook(null, payment, 'payment.created');

      expect(result).toBeNull();
    });
  });

  describe('Complete Payment Flow', () => {
    test('full payment lifecycle with webhooks', async () => {
      // 1. Create payment
      const paymentData = {
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com',
          first_name: 'Juan',
          last_name: 'Perez'
        },
        installments: 3,
        notification_url: `http://localhost:${WEBHOOK_PORT}/webhook`
      };

      const createResponse = await request(app)
        .post('/v1/payments')
        .send(paymentData)
        .expect(201);

      expect(createResponse.body.status).toBe('approved');
      const paymentId = createResponse.body.id;

      // 2. Verify payment
      const getResponse = await request(app)
        .get(`/v1/payments/${paymentId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(paymentId);
      expect(getResponse.body.installments).toBe(3);

      // 3. Create partial refund
      await request(app)
        .post(`/v1/payments/${paymentId}/refunds`)
        .send({ amount: 30 })
        .expect(201);

      // 4. Verify refund updated payment
      const afterRefundResponse = await request(app)
        .get(`/v1/payments/${paymentId}`)
        .expect(200);

      expect(afterRefundResponse.body.transaction_amount_refunded).toBe(30);
      expect(afterRefundResponse.body.refunds.length).toBe(1);

      // 5. Verify webhooks were sent
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
    });
  });
});
