/**
 * Service Management Integration Tests
 * Tests service CRUD operations and Argentina-specific pricing
 */

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testUtils, prisma } from '../../jest.setup';

describe('Service Management Integration Tests', () => {
  let app: FastifyInstance;
  let providerUser: any;
  let clientUser: any;
  let providerToken: string;
  let clientToken: string;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create test users
    providerUser = await testUtils.createTestProvider({
      email: 'serviceprovider@test.com',
      name: 'Service Provider',
      businessName: 'Test Barbería'
    });

    clientUser = await testUtils.createTestUser({
      email: 'serviceclient@test.com',
      name: 'Service Client'
    });

    providerToken = testUtils.generateTestJWT(providerUser.id, 'PROVIDER');
    clientToken = testUtils.generateTestJWT(clientUser.id, 'CLIENT');
  });

  describe('Service Creation', () => {
    it('should create a new service with Argentina pricing', async () => {
      const serviceData = {
        name: 'Corte Clásico',
        description: 'Corte de cabello tradicional masculino',
        duration: 30,
        price: 1200, // Argentina pesos
        category: 'HAIRCUT',
        isActive: true
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: serviceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.name).toBe(serviceData.name);
      expect(result.price).toBe(serviceData.price);
      expect(result.duration).toBe(serviceData.duration);
      expect(result.providerId).toBe(providerUser.id);
    });

    it('should create premium service with higher pricing', async () => {
      const premiumServiceData = {
        name: 'Corte Premium + Barba',
        description: 'Corte premium con arreglo de barba y toalla caliente',
        duration: 60,
        price: 2500, // Higher price for premium service
        category: 'PREMIUM',
        isActive: true
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: premiumServiceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.price).toBe(premiumServiceData.price);
      expect(result.category).toBe('PREMIUM');
    });

    it('should reject service creation by clients', async () => {
      const serviceData = {
        name: 'Unauthorized Service',
        description: 'This should fail',
        duration: 30,
        price: 1000
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: serviceData
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject service with invalid pricing', async () => {
      const invalidServiceData = {
        name: 'Invalid Price Service',
        description: 'Service with invalid price',
        duration: 30,
        price: -100 // Negative price
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: invalidServiceData
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('price');
    });

    it('should reject service with invalid duration', async () => {
      const invalidServiceData = {
        name: 'Invalid Duration Service',
        description: 'Service with invalid duration',
        duration: 0, // Zero duration
        price: 1000
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: invalidServiceData
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('duration');
    });
  });

  describe('Service Retrieval', () => {
    let testService: any;

    beforeEach(async () => {
      testService = await testUtils.createTestService(providerUser.id, {
        name: 'Test Retrieval Service',
        price: 1500,
        duration: 45
      });
    });

    it('should get all services for a provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/services/provider/${providerUser.id}`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].providerId).toBe(providerUser.id);
    });

    it('should get specific service by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.id).toBe(testService.id);
      expect(result.name).toBe(testService.name);
    });

    it('should return 404 for non-existent service', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/services/non-existent-id',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should search services by category', async () => {
      await testUtils.createTestService(providerUser.id, {
        name: 'Barba Completa',
        category: 'BEARD',
        price: 800
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/services/search?category=BEARD',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe('BEARD');
    });

    it('should filter services by price range', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/services/search?minPrice=1000&maxPrice=2000',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      result.forEach((service: any) => {
        expect(service.price).toBeGreaterThanOrEqual(1000);
        expect(service.price).toBeLessThanOrEqual(2000);
      });
    });
  });

  describe('Service Updates', () => {
    let testService: any;

    beforeEach(async () => {
      testService = await testUtils.createTestService(providerUser.id, {
        name: 'Original Service',
        price: 1000,
        duration: 30
      });
    });

    it('should update service by owner', async () => {
      const updateData = {
        name: 'Updated Service Name',
        price: 1300,
        duration: 40,
        description: 'Updated description'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.name).toBe(updateData.name);
      expect(result.price).toBe(updateData.price);
      expect(result.duration).toBe(updateData.duration);
    });

    it('should reject update by non-owner', async () => {
      const otherProvider = await testUtils.createTestProvider({
        email: 'other@provider.com',
        name: 'Other Provider'
      });
      const otherToken = testUtils.generateTestJWT(otherProvider.id, 'PROVIDER');

      const updateData = {
        name: 'Unauthorized Update',
        price: 2000
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${otherToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject update by client', async () => {
      const updateData = {
        name: 'Client Update Attempt',
        price: 1500
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Service Deletion', () => {
    let testService: any;

    beforeEach(async () => {
      testService = await testUtils.createTestService(providerUser.id, {
        name: 'Service to Delete',
        price: 1000,
        duration: 30
      });
    });

    it('should soft delete service by owner', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);

      // Verify service is soft deleted (not visible in listings)
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should reject deletion by non-owner', async () => {
      const otherProvider = await testUtils.createTestProvider({
        email: 'other@provider.com',
        name: 'Other Provider'
      });
      const otherToken = testUtils.generateTestJWT(otherProvider.id, 'PROVIDER');

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${otherToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should prevent deletion of service with active bookings', async () => {
      // Create a booking for the service
      await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'CONFIRMED',
          totalPrice: testService.price
        }
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/services/${testService.id}`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(409); // Conflict due to active bookings
      const result = response.json();
      expect(result.error).toContain('active bookings');
    });
  });

  describe('Service Categories and Argentina-Specific Features', () => {
    it('should handle Spanish service names and descriptions', async () => {
      const spanishServiceData = {
        name: 'Corte y Peinado Caballero',
        description: 'Servicio completo de corte de cabello y peinado para caballeros, incluye shampoo y secado',
        duration: 45,
        price: 1800,
        category: 'HAIRCUT'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: spanishServiceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.name).toBe(spanishServiceData.name);
      expect(result.description).toBe(spanishServiceData.description);
    });

    it('should support Argentina peso pricing with proper formatting', async () => {
      const serviceData = {
        name: 'Servicio Premium',
        description: 'Servicio de lujo',
        duration: 60,
        price: 3500, // Argentina pesos
        category: 'PREMIUM'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: serviceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.price).toBe(3500);
      expect(typeof result.price).toBe('number');
    });

    it('should validate Argentina business hours in service scheduling', async () => {
      const serviceData = {
        name: 'Servicio con Horarios',
        description: 'Servicio con restricciones de horario',
        duration: 30,
        price: 1200,
        category: 'HAIRCUT',
        availableHours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          saturday: { start: '09:00', end: '14:00' } // Half day Saturday (common in Argentina)
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: serviceData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.availableHours).toBeDefined();
      expect(result.availableHours.saturday.end).toBe('14:00');
    });
  });

  describe('Service Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create multiple services for analytics testing
      await testUtils.createTestService(providerUser.id, {
        name: 'Popular Service',
        price: 1200,
        duration: 30
      });
      
      await testUtils.createTestService(providerUser.id, {
        name: 'Premium Service',
        price: 2500,
        duration: 60,
        category: 'PREMIUM'
      });
    });

    it('should get service performance metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/services/analytics/performance',
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.totalServices).toBeGreaterThan(0);
      expect(result.averagePrice).toBeDefined();
      expect(result.categoryBreakdown).toBeDefined();
    });

    it('should get pricing insights for Argentina market', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/services/analytics/pricing',
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.averagePrice).toBeDefined();
      expect(result.priceRange).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });
});