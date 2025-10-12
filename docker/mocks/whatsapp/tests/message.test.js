const request = require('supertest');
const app = require('../index');
const messageService = require('../services/message.service');

describe('WhatsApp Mock Server - Messages', () => {
  // Clear message store before each test
  beforeEach(() => {
    messageService.clearMessages();
  });

  describe('POST /v1/messages', () => {
    it('should send a text message successfully', async () => {
      const response = await request(app)
        .post('/v1/messages')
        .send({
          to: '+5491112345678',
          type: 'text',
          text: {
            body: 'Hello from test!'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messaging_product', 'whatsapp');
      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0]).toHaveProperty('id');
      expect(response.body.messages[0]).toHaveProperty('message_status', 'accepted');
    });

    it('should send a template message successfully', async () => {
      const response = await request(app)
        .post('/v1/messages')
        .send({
          to: '+5491112345678',
          type: 'template',
          template: {
            name: 'booking_confirmation',
            language: { code: 'es' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'Juan' },
                  { type: 'text', text: '15/10/2025' },
                  { type: 'text', text: '10:00' }
                ]
              }
            ]
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messaging_product', 'whatsapp');
      expect(response.body.messages[0]).toHaveProperty('id');
    });

    it('should reject message with invalid phone number', async () => {
      const response = await request(app)
        .post('/v1/messages')
        .send({
          to: 'invalid-phone',
          type: 'text',
          text: {
            body: 'Hello!'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('phone number');
    });

    it('should reject message without required fields', async () => {
      const response = await request(app)
        .post('/v1/messages')
        .send({
          type: 'text'
          // Missing 'to' field
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should send an image message successfully', async () => {
      const response = await request(app)
        .post('/v1/messages')
        .send({
          to: '+5491112345678',
          type: 'image',
          image: {
            link: 'https://example.com/image.jpg',
            caption: 'Test image'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messaging_product', 'whatsapp');
      expect(response.body.messages[0]).toHaveProperty('id');
    });
  });

  describe('GET /v1/messages/:id', () => {
    it('should get message status by ID', async () => {
      // First, send a message
      const sendResponse = await request(app)
        .post('/v1/messages')
        .send({
          to: '+5491112345678',
          type: 'text',
          text: {
            body: 'Test message'
          }
        });

      const messageId = sendResponse.body.messages[0].id;

      // Then, get its status
      const statusResponse = await request(app)
        .get(`/v1/messages/${messageId}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toHaveProperty('id', messageId);
      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('to', '+5491112345678');
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .get('/v1/messages/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/messages', () => {
    it('should return all messages', async () => {
      // Send multiple messages
      await request(app)
        .post('/v1/messages')
        .send({
          to: '+5491112345678',
          type: 'text',
          text: { body: 'Message 1' }
        });

      await request(app)
        .post('/v1/messages')
        .send({
          to: '+5491198765432',
          type: 'text',
          text: { body: 'Message 2' }
        });

      // Get all messages
      const response = await request(app)
        .get('/v1/messages');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(response.body).toHaveProperty('total');
      expect(response.body.messages).toHaveLength(2);
    });

    it('should return empty array when no messages exist', async () => {
      const response = await request(app)
        .get('/v1/messages');

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /v1/templates', () => {
    it('should return available templates', async () => {
      const response = await request(app)
        .get('/v1/templates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(response.body).toHaveProperty('total');
      expect(response.body.templates.length).toBeGreaterThan(0);
    });

    it('should include template details', async () => {
      const response = await request(app)
        .get('/v1/templates');

      const template = response.body.templates[0];
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('language');
      expect(template).toHaveProperty('components');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'whatsapp-mock-server');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Message Service', () => {
    it('should validate Argentina phone numbers', () => {
      expect(messageService.validatePhoneNumber('+5491112345678')).toBe(true);
      expect(messageService.validatePhoneNumber('5491112345678')).toBe(true);
      expect(messageService.validatePhoneNumber('+54 9 11 1234-5678')).toBe(true);
      expect(messageService.validatePhoneNumber('invalid')).toBe(false);
      expect(messageService.validatePhoneNumber('123')).toBe(false);
    });

    it('should update message status', () => {
      const message = messageService.sendMessage({
        to: '+5491112345678',
        body: 'Test',
        type: 'text'
      });

      const messageId = message.messages[0].id;

      const updated = messageService.updateMessageStatus(messageId, 'delivered');
      expect(updated).toBe(true);

      const status = messageService.getMessageStatus(messageId);
      expect(status.status).toBe('delivered');
      expect(status.delivered_at).toBeTruthy();
    });

    it('should handle non-existent message update', () => {
      const updated = messageService.updateMessageStatus('non-existent', 'delivered');
      expect(updated).toBe(false);
    });
  });
});
