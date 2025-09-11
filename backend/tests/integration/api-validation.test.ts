/**
 * API Validation Integration Tests
 * Tests API endpoints validation, security, and Argentina-specific data formats
 */

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testUtils, prisma } from '../../jest.setup';

describe('API Validation Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Input Validation', () => {
    describe('Email Validation', () => {
      it('should reject invalid email formats', async () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user@domain',
          'user space@domain.com'
        ];

        for (const email of invalidEmails) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email,
              password: 'ValidPass123!',
              name: 'Test User',
              phone: '+5491123456789',
              role: 'CLIENT'
            }
          });

          expect(response.statusCode).toBe(400);
          const result = response.json();
          expect(result.error).toContain('email');
        }
      });

      it('should accept valid email formats', async () => {
        const validEmails = [
          'user@domain.com',
          'user.name@domain.com.ar',
          'user+tag@domain.co',
          'user123@domain-name.com'
        ];

        for (const email of validEmails) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email,
              password: 'ValidPass123!',
              name: 'Test User',
              phone: '+5491123456789',
              role: 'CLIENT'
            }
          });

          expect([201, 409]).toContain(response.statusCode); // 201 success or 409 if email exists
        }
      });
    });

    describe('Argentina Phone Number Validation', () => {
      it('should reject invalid Argentina phone formats', async () => {
        const invalidPhones = [
          '+1234567890', // US format
          '+5511999999999', // Brazil format
          '011123456789', // Missing country code
          '+54911234567890', // Too many digits
          '+549112345678', // Too few digits
          '+54911-234-5678' // Invalid characters
        ];

        for (const phone of invalidPhones) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password: 'ValidPass123!',
              name: 'Test User',
              phone,
              role: 'CLIENT'
            }
          });

          expect(response.statusCode).toBe(400);
          const result = response.json();
          expect(result.error).toContain('phone');
        }
      });

      it('should accept valid Argentina phone formats', async () => {
        const validPhones = [
          '+5491123456789', // Buenos Aires mobile
          '+5491187654321', // Buenos Aires mobile alternative
          '+542114567890', // Buenos Aires landline
          '+543514567890', // Córdoba landline
          '+542234567890'  // Mar del Plata landline
        ];

        for (const phone of validPhones) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password: 'ValidPass123!',
              name: 'Test User',
              phone,
              role: 'CLIENT'
            }
          });

          expect([201, 409]).toContain(response.statusCode);
        }
      });
    });

    describe('DNI Validation (Argentina)', () => {
      it('should reject invalid DNI formats', async () => {
        const invalidDNIs = [
          '12345678', // Too short
          '123456789012', // Too long
          '12.345.678', // Invalid format
          'AB12345678', // Contains letters
          '00000000000', // All zeros
          '12345678-9' // Invalid format
        ];

        for (const dni of invalidDNIs) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password: 'ValidPass123!',
              name: 'Test Provider',
              phone: '+5491123456789',
              role: 'PROVIDER',
              dni,
              businessName: 'Test Business'
            }
          });

          expect(response.statusCode).toBe(400);
          const result = response.json();
          expect(result.error).toContain('dni');
        }
      });

      it('should accept valid DNI formats', async () => {
        const validDNIs = [
          '12345678901', // 11 digits
          '20123456789', // 11 digits starting with 20
          '27987654321'  // 11 digits starting with 27
        ];

        for (const dni of validDNIs) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password: 'ValidPass123!',
              name: 'Test Provider',
              phone: '+5491123456789',
              role: 'PROVIDER',
              dni,
              businessName: 'Test Business'
            }
          });

          expect([201, 409]).toContain(response.statusCode);
        }
      });
    });

    describe('Password Validation', () => {
      it('should enforce strong password requirements', async () => {
        const weakPasswords = [
          '123456', // Too short
          'password', // No uppercase, numbers, or symbols
          'PASSWORD', // No lowercase, numbers, or symbols
          '12345678', // No letters or symbols
          'Pass123', // Too short
          'passwordpassword' // No uppercase, numbers, or symbols
        ];

        for (const password of weakPasswords) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password,
              name: 'Test User',
              phone: '+5491123456789',
              role: 'CLIENT'
            }
          });

          expect(response.statusCode).toBe(400);
          const result = response.json();
          expect(result.error).toContain('password');
        }
      });

      it('should accept strong passwords', async () => {
        const strongPasswords = [
          'SecurePass123!',
          'MyStr0ng_P@ssw0rd',
          'C0mplex!P@ssw0rd123'
        ];

        for (const password of strongPasswords) {
          const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password,
              name: 'Test User',
              phone: '+5491123456789',
              role: 'CLIENT'
            }
          });

          expect([201, 409]).toContain(response.statusCode);
        }
      });
    });
  });

  describe('Data Sanitization', () => {
    let providerUser: any;
    let providerToken: string;

    beforeEach(async () => {
      providerUser = await testUtils.createTestProvider({
        email: 'sanitization@test.com',
        name: 'Sanitization Provider'
      });
      providerToken = testUtils.generateTestJWT(providerUser.id, 'PROVIDER');
    });

    it('should sanitize HTML in service descriptions', async () => {
      const maliciousDescription = '<script>alert("XSS")</script>Corte de cabello<img src="x" onerror="alert(1)">';

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: {
          name: 'Test Service',
          description: maliciousDescription,
          duration: 30,
          price: 1000,
          category: 'HAIRCUT'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.description).not.toContain('<script>');
      expect(result.description).not.toContain('onerror');
      expect(result.description).toContain('Corte de cabello');
    });

    it('should sanitize SQL injection attempts', async () => {
      const sqlInjectionName = "'; DROP TABLE users; --";

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: {
          name: sqlInjectionName,
          description: 'Test description',
          duration: 30,
          price: 1000,
          category: 'HAIRCUT'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.name).not.toContain('DROP TABLE');
      expect(result.name).not.toContain('--');
    });

    it('should handle special Argentina characters correctly', async () => {
      const spanishText = 'Peluquería especializada en niños y niñas con atención personalizada';

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: {
          name: 'Corte Infantil',
          description: spanishText,
          duration: 45,
          price: 1500,
          category: 'HAIRCUT'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.description).toBe(spanishText);
      expect(result.description).toContain('ñ');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on registration endpoint', async () => {
      const registrationData = {
        password: 'TestPass123!',
        name: 'Rate Limit Test',
        phone: '+5491123456789',
        role: 'CLIENT'
      };

      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              ...registrationData,
              email: `ratelimit${i}@test.com`
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on login endpoint', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      };

      // Make multiple rapid login attempts
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: loginData
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
        headers: {
          origin: 'https://barberpro.com.ar'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/auth/login',
        headers: {
          origin: 'https://barberpro.com.ar',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type,authorization'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('authorization');
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.error).toBe('string');
    });

    it('should handle malformed JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: '{"invalid": json}',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('JSON');
    });

    it('should handle unsupported content types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: 'plain text data',
        headers: {
          'content-type': 'text/plain'
        }
      });

      expect(response.statusCode).toBe(415); // Unsupported Media Type
    });

    it('should handle too large payloads', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        name: 'Test User',
        phone: '+5491123456789',
        role: 'CLIENT',
        largeField: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: largePayload
      });

      expect(response.statusCode).toBe(413); // Payload Too Large
    });
  });

  describe('Content Type Validation', () => {
    it('should reject requests without content-type for POST', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
          name: 'Test User',
          phone: '+5491123456789',
          role: 'CLIENT'
        })
        // No content-type header
      });

      expect(response.statusCode).toBe(400);
    });

    it('should accept proper JSON content-type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'ValidPass123!',
          name: 'Test User',
          phone: '+5491123456789',
          role: 'CLIENT'
        },
        headers: {
          'content-type': 'application/json'
        }
      });

      expect([201, 400, 409]).toContain(response.statusCode); // Various valid responses
    });
  });

  describe('API Documentation Validation', () => {
    it('should serve OpenAPI documentation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation/json'
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.openapi).toBeDefined();
      expect(result.info).toBeDefined();
      expect(result.paths).toBeDefined();
    });

    it('should include all main endpoints in documentation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation/json'
      });

      const result = response.json();
      const paths = Object.keys(result.paths);
      
      expect(paths).toContain('/api/auth/register');
      expect(paths).toContain('/api/auth/login');
      expect(paths).toContain('/api/services');
      expect(paths).toContain('/api/bookings');
    });

    it('should include Argentina-specific schemas', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation/json'
      });

      const result = response.json();
      const schemas = JSON.stringify(result);
      
      expect(schemas).toContain('phone');
      expect(schemas).toContain('dni');
      expect(schemas).toContain('Argentina');
    });
  });
});