/**
 * SMS Mock Server Tests
 */

const request = require('supertest');
const app = require('../index');

// Wait for server to be ready
beforeAll((done) => {
  setTimeout(done, 100);
});

// Clean up after all tests
afterAll((done) => {
  // Give time for pending async operations to complete
  setTimeout(() => {
    // Close all timers and async operations
    done();
  }, 3000);
});

describe('Health Check', () => {
  test('GET /health should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'sms-mock-server');
    expect(response.body).toHaveProperty('version');
  });
});

describe('Root Endpoint', () => {
  test('GET / should return service information', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('service', 'SMS Mock Server');
    expect(response.body).toHaveProperty('endpoints');
    expect(response.body.endpoints).toHaveProperty('sms');
  });
});

describe('SMS Send - POST /v1/sms', () => {
  beforeEach(async () => {
    // Clear all SMS before each test
    await request(app).delete('/v1/sms');
  });

  test('Should send SMS with valid Argentina phone number', async () => {
    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: 'Test message'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('to');
    expect(response.body.data).toHaveProperty('status', 'queued');
    expect(response.body.data).toHaveProperty('segments', 1);
    expect(response.body.data).toHaveProperty('cost');
  });

  test('Should accept different phone number formats', async () => {
    const phoneFormats = [
      '+54 9 11 1234-5678',
      '+549111234-5678',
      '+5491112345678',
      '+54 9 11 12345678'
    ];

    for (const phone of phoneFormats) {
      const response = await request(app)
        .post('/v1/sms')
        .send({
          to: phone,
          body: 'Test message'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    }
  });

  test('Should reject invalid phone number format', async () => {
    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '1234567890',
        body: 'Test message'
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.message).toContain('Invalid phone format');
  });

  test('Should reject missing "to" field', async () => {
    const response = await request(app)
      .post('/v1/sms')
      .send({
        body: 'Test message'
      })
      .expect(400);

    expect(response.body.message).toContain('required');
  });

  test('Should reject missing "body" field', async () => {
    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678'
      })
      .expect(400);

    expect(response.body.message).toContain('required');
  });

  test('Should reject empty message body', async () => {
    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: ''
      })
      .expect(400);

    expect(response.body.message).toMatch(/cannot be empty|required/i);
  });

  test('Should reject message body over 1600 characters', async () => {
    const longMessage = 'a'.repeat(1601);

    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: longMessage
      })
      .expect(400);

    expect(response.body.message).toContain('exceeds maximum length');
  });

  test('Should calculate segments correctly', async () => {
    // 160 chars = 1 segment
    const message160 = 'a'.repeat(160);
    const response1 = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: message160
      })
      .expect(201);

    expect(response1.body.data.segments).toBe(1);

    // 161 chars = 2 segments
    const message161 = 'a'.repeat(161);
    const response2 = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: message161
      })
      .expect(201);

    expect(response2.body.data.segments).toBe(2);
  });

  test('Should calculate cost correctly', async () => {
    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: 'Test'
      })
      .expect(201);

    // 1 segment * 0.05 ARS = 0.05
    expect(response.body.data.cost).toBe('0.05');
  });
});

describe('SMS Get - GET /v1/sms/:id', () => {
  let smsId;

  beforeAll(async () => {
    // Create a test SMS
    const response = await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: 'Test message for GET'
      });

    smsId = response.body.data.id;
  });

  test('Should get SMS by ID', async () => {
    const response = await request(app)
      .get(`/v1/sms/${smsId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', smsId);
    expect(response.body.data).toHaveProperty('to');
    expect(response.body.data).toHaveProperty('body');
    expect(response.body.data).toHaveProperty('status');
  });

  test('Should return 404 for non-existent SMS', async () => {
    const response = await request(app)
      .get('/v1/sms/INVALID_ID')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not Found');
  });
});

describe('SMS List - GET /v1/sms', () => {
  beforeAll(async () => {
    // Clear and create test SMS
    await request(app).delete('/v1/sms');

    await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: 'Test message 1'
      });

    await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 9876-5432',
        body: 'Test message 2'
      });
  });

  test('Should get all SMS messages', async () => {
    const response = await request(app)
      .get('/v1/sms')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('count');
    expect(response.body.data).toHaveProperty('messages');
    expect(Array.isArray(response.body.data.messages)).toBe(true);
    expect(response.body.data.count).toBeGreaterThan(0);
  });

  test('Should filter SMS by status', async () => {
    const response = await request(app)
      .get('/v1/sms?status=queued')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.messages.every(sms => sms.status === 'queued')).toBe(true);
  });

  test('Should limit number of results', async () => {
    const response = await request(app)
      .get('/v1/sms?limit=1')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.messages.length).toBeLessThanOrEqual(1);
  });
});

describe('SMS Bulk - POST /v1/sms/bulk', () => {
  beforeEach(async () => {
    // Clear all SMS before each test
    await request(app).delete('/v1/sms');
  });

  test('Should send bulk SMS successfully', async () => {
    const response = await request(app)
      .post('/v1/sms/bulk')
      .send({
        messages: [
          { to: '+54 9 11 1234-5678', body: 'Message 1' },
          { to: '+54 9 11 9876-5432', body: 'Message 2' },
          { to: '+54 9 11 5555-5555', body: 'Message 3' }
        ]
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.total).toBe(3);
    expect(response.body.data.successful).toBeGreaterThan(0);
    expect(response.body.data).toHaveProperty('totalCost');
    expect(response.body.data).toHaveProperty('totalSegments');
    expect(response.body.data).toHaveProperty('results');
  });

  test('Should reject non-array messages', async () => {
    const response = await request(app)
      .post('/v1/sms/bulk')
      .send({
        messages: 'not an array'
      })
      .expect(400);

    expect(response.body.message).toContain('must be an array');
  });

  test('Should reject empty messages array', async () => {
    const response = await request(app)
      .post('/v1/sms/bulk')
      .send({
        messages: []
      })
      .expect(400);

    expect(response.body.message).toContain('cannot be empty');
  });

  test('Should reject more than 100 messages', async () => {
    const messages = Array(101).fill({
      to: '+54 9 11 1234-5678',
      body: 'Test'
    });

    const response = await request(app)
      .post('/v1/sms/bulk')
      .send({ messages })
      .expect(400);

    expect(response.body.message).toContain('limited to 100');
  });

  test('Should handle partial failures in bulk send', async () => {
    const response = await request(app)
      .post('/v1/sms/bulk')
      .send({
        messages: [
          { to: '+54 9 11 1234-5678', body: 'Valid message' },
          { to: 'invalid-phone', body: 'Invalid message' },
          { to: '+54 9 11 9876-5432', body: 'Another valid message' }
        ]
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.successful).toBeGreaterThan(0);
    expect(response.body.data.failed).toBeGreaterThan(0);
    expect(response.body.data.errors.length).toBeGreaterThan(0);
  });
});

describe('SMS Stats - GET /v1/stats', () => {
  beforeAll(async () => {
    // Clear and create test data
    await request(app).delete('/v1/sms');

    await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: 'Test message'
      });
  });

  test('Should get SMS statistics', async () => {
    const response = await request(app)
      .get('/v1/stats')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('total');
    expect(response.body.data).toHaveProperty('queued');
    expect(response.body.data).toHaveProperty('sent');
    expect(response.body.data).toHaveProperty('delivered');
    expect(response.body.data).toHaveProperty('failed');
    expect(response.body.data).toHaveProperty('totalCost');
    expect(response.body.data).toHaveProperty('totalSegments');
  });
});

describe('SMS Clear - DELETE /v1/sms', () => {
  test('Should clear all SMS messages', async () => {
    // Create some test SMS
    await request(app)
      .post('/v1/sms')
      .send({
        to: '+54 9 11 1234-5678',
        body: 'Test message'
      });

    // Clear all
    const response = await request(app)
      .delete('/v1/sms')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Cleared');

    // Verify cleared
    const listResponse = await request(app)
      .get('/v1/sms')
      .expect(200);

    expect(listResponse.body.data.count).toBe(0);
  });
});

describe('404 Handler', () => {
  test('Should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not Found');
  });
});
