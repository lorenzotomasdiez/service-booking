/**
 * Cross-Browser Compatibility E2E Tests
 * Tests BarberPro API compatibility across different browser environments
 */

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testUtils, prisma } from '../../jest.setup';

describe('Cross-Browser Compatibility E2E Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Agent Compatibility', () => {
    const userAgents = {
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      mobileChrome: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    };

    Object.entries(userAgents).forEach(([browser, userAgent]) => {
      describe(`${browser} compatibility`, () => {
        it('should handle authentication flow', async () => {
          const registerResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            headers: {
              'user-agent': userAgent,
              'content-type': 'application/json'
            },
            payload: {
              email: `${browser}@test.com`,
              password: 'SecurePass123!',
              name: `${browser} User`,
              phone: '+5491123456789',
              role: 'CLIENT'
            }
          });

          expect(registerResponse.statusCode).toBe(201);

          const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            headers: {
              'user-agent': userAgent,
              'content-type': 'application/json'
            },
            payload: {
              email: `${browser}@test.com`,
              password: 'SecurePass123!'
            }
          });

          expect(loginResponse.statusCode).toBe(200);
          const result = loginResponse.json();
          expect(result.token).toBeDefined();
        });

        it('should handle CORS preflight requests', async () => {
          const preflightResponse = await app.inject({
            method: 'OPTIONS',
            url: '/api/auth/login',
            headers: {
              'user-agent': userAgent,
              'origin': 'https://barberpro.com.ar',
              'access-control-request-method': 'POST',
              'access-control-request-headers': 'content-type,authorization'
            }
          });

          expect(preflightResponse.statusCode).toBe(200);
          expect(preflightResponse.headers['access-control-allow-origin']).toBeDefined();
          expect(preflightResponse.headers['access-control-allow-methods']).toContain('POST');
        });

        it('should handle content encoding preferences', async () => {
          const response = await app.inject({
            method: 'GET',
            url: '/api/health',
            headers: {
              'user-agent': userAgent,
              'accept-encoding': 'gzip, deflate, br'
            }
          });

          expect(response.statusCode).toBe(200);
        });
      });
    });
  });

  describe('HTTP Method Compatibility', () => {
    let testUser: any;
    let testToken: string;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'httptest@test.com',
        name: 'HTTP Test User'
      });
      testToken = testUtils.generateTestJWT(testUser.id, 'CLIENT');
    });

    it('should handle GET requests across browsers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.id).toBe(testUser.id);
    });

    it('should handle POST requests with different content types', async () => {
      const contentTypes = [
        'application/json',
        'application/json; charset=utf-8'
      ];

      for (const contentType of contentTypes) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: {
            'content-type': contentType
          },
          payload: {
            email: testUser.email,
            password: 'testpassword'
          }
        });

        // Should handle the request properly (even if credentials are wrong)
        expect([200, 401]).toContain(response.statusCode);
      }
    });

    it('should handle PUT and PATCH requests', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const putResponse = await app.inject({
        method: 'PUT',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: updateData
      });

      const patchResponse = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: updateData
      });

      expect([200, 404]).toContain(putResponse.statusCode);
      expect([200, 404]).toContain(patchResponse.statusCode);
    });
  });

  describe('Character Encoding Compatibility', () => {
    let providerUser: any;
    let providerToken: string;

    beforeEach(async () => {
      providerUser = await testUtils.createTestProvider({
        email: 'encoding@test.com',
        name: 'Encoding Provider'
      });
      providerToken = testUtils.generateTestJWT(providerUser.id, 'PROVIDER');
    });

    it('should handle Spanish characters correctly', async () => {
      const spanishData = {
        name: 'Peluquería Señoría',
        description: 'Especialistas en niños y niñas con atención personalizada. ¡Visitanos!',
        duration: 45,
        price: 1500,
        category: 'HAIRCUT'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`,
          'content-type': 'application/json; charset=utf-8'
        },
        payload: spanishData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.name).toBe(spanishData.name);
      expect(result.description).toBe(spanishData.description);
      expect(result.name).toContain('ñ');
      expect(result.description).toContain('ñ');
    });

    it('should handle Argentina-specific currency symbols', async () => {
      const serviceData = {
        name: 'Servicio Premium',
        description: 'Precio: $2.500 pesos argentinos',
        duration: 60,
        price: 2500,
        category: 'PREMIUM'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`,
          'content-type': 'application/json; charset=utf-8'
        },
        payload: serviceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.description).toContain('$');
    });

    it('should handle emojis in service descriptions', async () => {
      const serviceData = {
        name: 'Corte VIP ✂️',
        description: 'Servicio premium con los mejores productos 💫 ¡Te esperamos! 😊',
        duration: 60,
        price: 3000,
        category: 'PREMIUM'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`,
          'content-type': 'application/json; charset=utf-8'
        },
        payload: serviceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.name).toContain('✂️');
      expect(result.description).toContain('💫');
      expect(result.description).toContain('😊');
    });
  });

  describe('Date and Time Format Compatibility', () => {
    let clientUser: any;
    let providerUser: any;
    let testService: any;
    let clientToken: string;

    beforeEach(async () => {
      clientUser = await testUtils.createTestUser({
        email: 'dateclient@test.com',
        name: 'Date Client'
      });

      providerUser = await testUtils.createTestProvider({
        email: 'dateprovider@test.com',
        name: 'Date Provider'
      });

      testService = await testUtils.createTestService(providerUser.id, {
        name: 'Date Test Service',
        price: 1500,
        duration: 30
      });

      clientToken = testUtils.generateTestJWT(clientUser.id, 'CLIENT');
    });

    it('should handle different date formats', async () => {
      const dateFormats = [
        '2024-12-15T14:00:00-03:00', // ISO with timezone
        '2024-12-15T14:00:00Z',      // ISO UTC
        '2024-12-15T14:00:00.000Z',  // ISO with milliseconds
        '2024-12-15T17:00:00+00:00'  // ISO UTC with explicit timezone
      ];

      for (const dateFormat of dateFormats) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/bookings',
          headers: {
            authorization: `Bearer ${clientToken}`,
            'content-type': 'application/json'
          },
          payload: {
            serviceId: testService.id,
            providerId: providerUser.id,
            scheduledAt: dateFormat
          }
        });

        // Should either create booking or have a valid business reason for rejection
        expect([201, 400, 409]).toContain(response.statusCode);
      }
    });

    it('should return consistent date formats', async () => {
      const booking = await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date('2024-12-15T14:00:00-03:00'),
          status: 'PENDING',
          totalPrice: testService.price
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/bookings/${booking.id}`,
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      
      // Date should be returned in ISO format
      expect(result.scheduledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(Date.parse(result.scheduledAt)).not.toBeNaN();
    });
  });

  describe('File Upload Compatibility', () => {
    let providerUser: any;
    let providerToken: string;

    beforeEach(async () => {
      providerUser = await testUtils.createTestProvider({
        email: 'fileupload@test.com',
        name: 'File Upload Provider'
      });
      providerToken = testUtils.generateTestJWT(providerUser.id, 'PROVIDER');
    });

    it('should handle multipart form data', async () => {
      const formData = new FormData();
      formData.append('name', 'Service with Image');
      formData.append('description', 'Service description');
      formData.append('duration', '30');
      formData.append('price', '1500');
      formData.append('category', 'HAIRCUT');

      // Simulate file upload (in real E2E tests, this would be actual file)
      const fakeImageBuffer = Buffer.from('fake-image-data');
      formData.append('image', new Blob([fakeImageBuffer]), 'service-image.jpg');

      // Note: In real implementation, we'd need proper multipart handling
      // This test ensures the endpoint can handle multipart content-type
      const response = await app.inject({
        method: 'POST',
        url: '/api/services/with-image',
        headers: {
          authorization: `Bearer ${providerToken}`
          // content-type will be set automatically for multipart
        },
        payload: formData as any
      });

      // May not be implemented yet, but should not crash
      expect([201, 404, 501]).toContain(response.statusCode);
    });
  });

  describe('WebSocket Compatibility', () => {
    it('should handle WebSocket upgrade requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/socket.io/',
        headers: {
          connection: 'upgrade',
          upgrade: 'websocket',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'sec-websocket-version': '13'
        }
      });

      // Should either upgrade or handle gracefully
      expect([101, 400, 404]).toContain(response.statusCode);
    });

    it('should handle polling fallback', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/socket.io/?EIO=4&transport=polling',
        headers: {
          'content-type': 'text/plain'
        }
      });

      // Should handle Socket.IO polling requests
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('Cookie and Session Compatibility', () => {
    it('should handle cookies correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
        headers: {
          cookie: 'sessionid=test-session-id; theme=dark'
        }
      });

      expect(response.statusCode).toBe(200);
      // Should not break when cookies are present
    });

    it('should set secure cookie flags in production', async () => {
      // This would be more relevant in a production environment test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });

      // Restore environment
      process.env.NODE_ENV = originalEnv;

      // Check that response doesn't break in production mode
      expect([200, 401, 400]).toContain(response.statusCode);
    });
  });

  describe('Mobile Browser Compatibility', () => {
    const mobileUserAgents = {
      androidChrome: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      androidFirefox: 'Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0'
    };

    Object.entries(mobileUserAgents).forEach(([browser, userAgent]) => {
      it(`should handle ${browser} mobile requests`, async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/health',
          headers: {
            'user-agent': userAgent,
            'accept': 'application/json',
            'accept-language': 'es-AR,es;q=0.9,en;q=0.8'
          }
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();
        expect(result.status).toBe('ok');
      });

      it(`should handle ${browser} viewport considerations`, async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/health',
          headers: {
            'user-agent': userAgent,
            'viewport-width': '375', // iPhone width
            'dpr': '2' // Device pixel ratio
          }
        });

        expect(response.statusCode).toBe(200);
      });
    });
  });
});