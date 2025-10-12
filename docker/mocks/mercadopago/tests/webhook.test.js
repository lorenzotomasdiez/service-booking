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
    }, 10000); // Increase timeout to 10 seconds to handle connection timeout

    test('sendWebhook handles missing webhook URL', async () => {
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      // Temporarily clear the configured webhook URL
      const originalUrl = webhookService.webhookUrl;
      webhookService.webhookUrl = null;

      const result = await webhookService.sendWebhook(null, payment, 'payment.created');

      expect(result.status).toBe('skipped');
      expect(result.message).toContain('No webhook URL configured');

      // Restore original URL
      webhookService.webhookUrl = originalUrl;
    });

    test('builds correct webhook payload', () => {
      const payment = {
        id: '123',
        payer: { id: 'user1', email: 'test@example.com' }
      };

      const webhook = webhookService.buildWebhookPayload(payment, 'payment.created');

      expect(webhook.action).toBe('payment.created');
      expect(webhook.data.id).toBe('123');
      expect(webhook.type).toBe('payment');
      expect(webhook.api_version).toBe('v1');
    });

    test('triggerWebhook with delay', async () => {
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      const startTime = Date.now();
      const delay = 1000;

      // Set webhook URL temporarily
      const originalUrl = webhookService.webhookUrl;
      webhookService.setWebhookUrl(`http://localhost:${WEBHOOK_PORT}/webhook`);

      await webhookService.triggerWebhook(payment, 'payment.created', delay, false);

      const elapsed = Date.now() - startTime;

      // Restore URL
      webhookService.setWebhookUrl(originalUrl);

      expect(elapsed).toBeGreaterThanOrEqual(delay - 100); // Allow small variance
      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
    });

    test('getConfig returns current configuration', () => {
      const config = webhookService.getConfig();

      expect(config.webhookUrl).toBeDefined();
      expect(config.retryAttempts).toBe(3);
      expect(config.baseDelay).toBe(2000);
    });

    test('setWebhookUrl updates webhook URL', () => {
      const originalUrl = webhookService.webhookUrl;
      const newUrl = 'http://new-url.com/webhook';

      webhookService.setWebhookUrl(newUrl);

      expect(webhookService.webhookUrl).toBe(newUrl);

      // Restore original
      webhookService.setWebhookUrl(originalUrl);
    });
  });

  describe('Webhook Routes', () => {
    test('GET /api/webhooks/config returns configuration', async () => {
      const response = await request(app)
        .get('/api/webhooks/config')
        .expect(200);

      expect(response.body.webhookUrl).toBeDefined();
      expect(response.body.retryAttempts).toBe(3);
      expect(response.body.baseDelay).toBe(2000);
    });

    test('PUT /api/webhooks/config updates webhook URL', async () => {
      const newUrl = 'http://test-webhook.com/webhooks';

      const response = await request(app)
        .put('/api/webhooks/config')
        .send({ webhookUrl: newUrl })
        .expect(200);

      expect(response.body.webhookUrl).toBe(newUrl);
      expect(response.body.previousUrl).toBeDefined();

      // Restore original URL
      webhookService.setWebhookUrl(process.env.MERCADOPAGO_MOCK_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/mercadopago');
    });

    test('PUT /api/webhooks/config validates URL format', async () => {
      const response = await request(app)
        .put('/api/webhooks/config')
        .send({ webhookUrl: 'invalid-url' })
        .expect(400);

      expect(response.body.error).toBe('invalid_url');
    });

    test('POST /api/webhooks/trigger/:paymentId triggers webhook', async () => {
      // Create a payment first
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      // Set webhook URL
      webhookService.setWebhookUrl(`http://localhost:${WEBHOOK_PORT}/webhook`);

      // Trigger webhook
      const response = await request(app)
        .post(`/api/webhooks/trigger/${payment.id}`)
        .send({
          action: 'payment.updated',
          delay: 0
        })
        .expect(200);

      expect(response.body.message).toContain('Webhook triggered');
      expect(response.body.paymentId).toBe(String(payment.id));

      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify webhook was received
      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
    });

    test('POST /api/webhooks/trigger/:paymentId with delay schedules webhook', async () => {
      const payment = paymentService.createPayment({
        transaction_amount: 100,
        payment_method_id: 'visa',
        payer: {
          email: 'test@example.com'
        }
      }, 'success');

      webhookService.setWebhookUrl(`http://localhost:${WEBHOOK_PORT}/webhook`);

      const response = await request(app)
        .post(`/api/webhooks/trigger/${payment.id}`)
        .send({
          action: 'payment.updated',
          delay: 500
        })
        .expect(200);

      expect(response.body.scheduled).toBe(true);
      expect(response.body.note).toContain('500ms');
    });

    test('POST /api/webhooks/test sends test webhook', async () => {
      webhookReceiver.receivedWebhooks.length = 0;

      const response = await request(app)
        .post('/api/webhooks/test')
        .send({
          webhookUrl: `http://localhost:${WEBHOOK_PORT}/webhook`
        })
        .expect(200);

      expect(response.body.message).toBe('Test webhook sent');
      expect(response.body.result.status).toBe('delivered');

      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(webhookReceiver.receivedWebhooks.length).toBeGreaterThan(0);
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
