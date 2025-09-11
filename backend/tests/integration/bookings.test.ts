/**
 * Booking Flow Integration Tests
 * Tests complete booking lifecycle with Argentina-specific features
 */

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testUtils, prisma } from '../../jest.setup';

describe('Booking Flow Integration Tests', () => {
  let app: FastifyInstance;
  let providerUser: any;
  let clientUser: any;
  let testService: any;
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
      email: 'bookingprovider@test.com',
      name: 'Booking Provider',
      businessName: 'Test Barbería Buenos Aires'
    });

    clientUser = await testUtils.createTestUser({
      email: 'bookingclient@test.com',
      name: 'Diego Fernández', // Typical Argentina name
      phone: '+5491123456789'
    });

    // Create test service
    testService = await testUtils.createTestService(providerUser.id, {
      name: 'Corte Ejecutivo',
      description: 'Corte profesional para ejecutivos',
      duration: 45,
      price: 1800
    });

    providerToken = testUtils.generateTestJWT(providerUser.id, 'PROVIDER');
    clientToken = testUtils.generateTestJWT(clientUser.id, 'CLIENT');
  });

  describe('Booking Creation', () => {
    it('should create a new booking with Argentina timezone', async () => {
      const bookingData = {
        serviceId: testService.id,
        providerId: providerUser.id,
        scheduledAt: new Date('2024-12-15T14:00:00-03:00').toISOString(), // Argentina timezone
        notes: 'Preferencia: corte degradé'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: bookingData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.serviceId).toBe(testService.id);
      expect(result.clientId).toBe(clientUser.id);
      expect(result.providerId).toBe(providerUser.id);
      expect(result.status).toBe('PENDING');
      expect(result.totalPrice).toBe(testService.price);
      expect(result.notes).toBe(bookingData.notes);
    });

    it('should prevent double booking at same time slot', async () => {
      const scheduledTime = new Date('2024-12-15T15:00:00-03:00').toISOString();
      
      // Create first booking
      await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          serviceId: testService.id,
          providerId: providerUser.id,
          scheduledAt: scheduledTime
        }
      });

      // Create another client for second booking attempt
      const otherClient = await testUtils.createTestUser({
        email: 'otherclient@test.com',
        name: 'Otro Cliente'
      });
      const otherClientToken = testUtils.generateTestJWT(otherClient.id, 'CLIENT');

      // Attempt second booking at same time
      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${otherClientToken}`
        },
        payload: {
          serviceId: testService.id,
          providerId: providerUser.id,
          scheduledAt: scheduledTime
        }
      });

      expect(response.statusCode).toBe(409); // Conflict
      const result = response.json();
      expect(result.error).toContain('time slot already booked');
    });

    it('should validate booking during business hours', async () => {
      const outsideBusinessHours = new Date('2024-12-15T22:00:00-03:00').toISOString(); // 10 PM

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          serviceId: testService.id,
          providerId: providerUser.id,
          scheduledAt: outsideBusinessHours
        }
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('business hours');
    });

    it('should reject booking in the past', async () => {
      const pastTime = new Date('2020-01-01T14:00:00-03:00').toISOString();

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          serviceId: testService.id,
          providerId: providerUser.id,
          scheduledAt: pastTime
        }
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('cannot book in the past');
    });

    it('should calculate correct price with Argentina taxes', async () => {
      const bookingData = {
        serviceId: testService.id,
        providerId: providerUser.id,
        scheduledAt: new Date('2024-12-15T16:00:00-03:00').toISOString()
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: bookingData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.totalPrice).toBe(testService.price);
      expect(result.taxAmount).toBeDefined(); // Should include Argentina tax calculation
      expect(result.finalPrice).toBeDefined(); // Price including taxes
    });
  });

  describe('Booking Status Management', () => {
    let testBooking: any;

    beforeEach(async () => {
      testBooking = await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date('2024-12-15T14:00:00-03:00'),
          status: 'PENDING',
          totalPrice: testService.price
        }
      });
    });

    it('should allow provider to confirm booking', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/confirm`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.status).toBe('CONFIRMED');
      expect(result.confirmedAt).toBeDefined();
    });

    it('should allow provider to reject booking', async () => {
      const rejectionData = {
        reason: 'No disponible en ese horario'
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/reject`,
        headers: {
          authorization: `Bearer ${providerToken}`
        },
        payload: rejectionData
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe(rejectionData.reason);
    });

    it('should allow client to cancel booking', async () => {
      const cancellationData = {
        reason: 'Cambio de planes'
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/cancel`,
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: cancellationData
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.status).toBe('CANCELLED');
      expect(result.cancellationReason).toBe(cancellationData.reason);
    });

    it('should prevent unauthorized status changes', async () => {
      const otherClient = await testUtils.createTestUser({
        email: 'unauthorized@test.com',
        name: 'Unauthorized User'
      });
      const unauthorizedToken = testUtils.generateTestJWT(otherClient.id, 'CLIENT');

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/confirm`,
        headers: {
          authorization: `Bearer ${unauthorizedToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should mark booking as completed', async () => {
      // First confirm the booking
      await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: 'CONFIRMED' }
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/complete`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('Booking Retrieval and Search', () => {
    beforeEach(async () => {
      // Create multiple bookings for testing
      await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date('2024-12-15T10:00:00-03:00'),
          status: 'CONFIRMED',
          totalPrice: testService.price
        }
      });

      await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date('2024-12-16T14:00:00-03:00'),
          status: 'PENDING',
          totalPrice: testService.price
        }
      });
    });

    it('should get client bookings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/bookings/client',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].clientId).toBe(clientUser.id);
    });

    it('should get provider bookings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/bookings/provider',
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

    it('should filter bookings by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/bookings/client?status=CONFIRMED',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      result.forEach((booking: any) => {
        expect(booking.status).toBe('CONFIRMED');
      });
    });

    it('should filter bookings by date range', async () => {
      const startDate = '2024-12-15';
      const endDate = '2024-12-15';

      const response = await app.inject({
        method: 'GET',
        url: `/api/bookings/provider?startDate=${startDate}&endDate=${endDate}`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      result.forEach((booking: any) => {
        const bookingDate = new Date(booking.scheduledAt).toISOString().split('T')[0];
        expect(bookingDate).toMatch(/2024-12-15/);
      });
    });

    it('should get specific booking details', async () => {
      const booking = await prisma.booking.findFirst({
        where: { clientId: clientUser.id }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/bookings/${booking!.id}`,
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.id).toBe(booking!.id);
      expect(result.service).toBeDefined();
      expect(result.provider).toBeDefined();
      expect(result.client).toBeDefined();
    });
  });

  describe('Booking Modifications', () => {
    let testBooking: any;

    beforeEach(async () => {
      testBooking = await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date('2024-12-15T14:00:00-03:00'),
          status: 'CONFIRMED',
          totalPrice: testService.price
        }
      });
    });

    it('should allow client to reschedule booking', async () => {
      const newTime = new Date('2024-12-16T15:00:00-03:00').toISOString();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/reschedule`,
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          scheduledAt: newTime,
          reason: 'Cambio de horario laboral'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.scheduledAt).toBe(newTime);
      expect(result.rescheduleReason).toBe('Cambio de horario laboral');
    });

    it('should prevent rescheduling too close to appointment time', async () => {
      // Create booking for today + 1 hour (too close to reschedule)
      const soonBooking = await prisma.booking.create({
        data: {
          clientId: clientUser.id,
          providerId: providerUser.id,
          serviceId: testService.id,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          status: 'CONFIRMED',
          totalPrice: testService.price
        }
      });

      const newTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours from now

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${soonBooking.id}/reschedule`,
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          scheduledAt: newTime
        }
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('too close to appointment time');
    });

    it('should allow adding notes to existing booking', async () => {
      const additionalNotes = 'Por favor traer documentación para descuento';

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookings/${testBooking.id}/notes`,
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          notes: additionalNotes
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.notes).toBe(additionalNotes);
    });
  });

  describe('Argentina-Specific Booking Features', () => {
    it('should handle Argentina holidays in booking validation', async () => {
      // Try to book on Argentina Independence Day (July 9th)
      const holidayDate = new Date('2024-07-09T14:00:00-03:00').toISOString();

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          serviceId: testService.id,
          providerId: providerUser.id,
          scheduledAt: holidayDate
        }
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('holiday');
    });

    it('should support WhatsApp notification preferences', async () => {
      const bookingData = {
        serviceId: testService.id,
        providerId: providerUser.id,
        scheduledAt: new Date('2024-12-15T14:00:00-03:00').toISOString(),
        notificationPreferences: {
          whatsapp: true,
          email: false,
          sms: true
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: bookingData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.notificationPreferences.whatsapp).toBe(true);
      expect(result.notificationPreferences.email).toBe(false);
    });

    it('should validate Argentina phone numbers for WhatsApp', async () => {
      // Update client with invalid phone for WhatsApp
      await prisma.user.update({
        where: { id: clientUser.id },
        data: { phone: '+1234567890' } // Non-Argentina phone
      });

      const bookingData = {
        serviceId: testService.id,
        providerId: providerUser.id,
        scheduledAt: new Date('2024-12-15T14:00:00-03:00').toISOString(),
        notificationPreferences: {
          whatsapp: true
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: bookingData
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('Argentina phone number required for WhatsApp');
    });

    it('should handle siesta time restrictions', async () => {
      // Try to book during siesta time (2-4 PM in some Argentina regions)
      const siestaTime = new Date('2024-12-15T15:00:00-03:00').toISOString();

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        headers: {
          authorization: `Bearer ${clientToken}`
        },
        payload: {
          serviceId: testService.id,
          providerId: providerUser.id,
          scheduledAt: siestaTime
        }
      });

      // This depends on provider settings - might be allowed or not
      if (response.statusCode === 400) {
        const result = response.json();
        expect(result.error).toContain('siesta time');
      } else {
        expect(response.statusCode).toBe(201);
      }
    });
  });

  describe('Booking Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create various bookings for analytics
      const statuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'PENDING'];
      
      for (let i = 0; i < 4; i++) {
        await prisma.booking.create({
          data: {
            clientId: clientUser.id,
            providerId: providerUser.id,
            serviceId: testService.id,
            scheduledAt: new Date(`2024-12-${15 + i}T14:00:00-03:00`),
            status: statuses[i] as any,
            totalPrice: testService.price
          }
        });
      }
    });

    it('should get booking statistics for provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/bookings/analytics/stats',
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.totalBookings).toBeGreaterThan(0);
      expect(result.confirmedBookings).toBeDefined();
      expect(result.completedBookings).toBeDefined();
      expect(result.cancellationRate).toBeDefined();
      expect(result.totalRevenue).toBeDefined();
    });

    it('should get daily booking schedule', async () => {
      const date = '2024-12-15';

      const response = await app.inject({
        method: 'GET',
        url: `/api/bookings/schedule/${date}`,
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});