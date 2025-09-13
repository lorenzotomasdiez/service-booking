/**
 * Unit Tests for Booking Service - Day 8 Advanced Testing Framework
 * BarberPro Premium Service Booking Platform - Argentina Market
 * 
 * Tests critical booking logic, psychology vertical integration,
 * and Argentina-specific functionality
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import BookingService from '../../services/booking-service';
import PaymentService from '../../services/payment-service';
import NotificationService from '../../services/notification-service';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../services/payment-service');
jest.mock('../../services/notification-service');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockPaymentService = new PaymentService() as jest.Mocked<PaymentService>;
const mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

describe('BookingService - Advanced Testing Framework', () => {
  let bookingService: BookingService;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingService = new BookingService(mockPrisma, mockPaymentService, mockNotificationService);
  });

  describe('Core Booking Functionality', () => {
    test('should create standard service booking successfully', async () => {
      const bookingData = {
        clientId: 'client-123',
        providerId: 'provider-456',
        serviceId: 'service-789',
        scheduledFor: new Date('2025-09-15T10:00:00.000Z'),
        location: 'Buenos Aires',
        price: 5000, // ARS
        paymentMethod: 'mercadopago'
      };

      const expectedBooking = {
        id: 'booking-123',
        ...bookingData,
        status: 'CONFIRMED',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.booking.create.mockResolvedValue(expectedBooking as any);
      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'tx-123',
        status: 'APPROVED'
      });
      mockNotificationService.sendBookingConfirmation.mockResolvedValue(true);

      const result = await bookingService.createBooking(bookingData);

      expect(result).toMatchObject({
        id: 'booking-123',
        status: 'CONFIRMED'
      });
      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clientId: 'client-123',
          providerId: 'provider-456',
          serviceId: 'service-789'
        })
      });
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          currency: 'ARS',
          method: 'mercadopago'
        })
      );
    });

    test('should handle double booking prevention', async () => {
      const bookingData = {
        providerId: 'provider-456',
        scheduledFor: new Date('2025-09-15T10:00:00.000Z')
      };

      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        providerId: 'provider-456',
        scheduledFor: new Date('2025-09-15T10:00:00.000Z'),
        status: 'CONFIRMED'
      } as any);

      await expect(bookingService.createBooking(bookingData as any))
        .rejects
        .toThrow('Time slot already booked');

      expect(mockPrisma.booking.create).not.toHaveBeenCalled();
    });

    test('should validate booking time constraints', async () => {
      const pastBookingData = {
        scheduledFor: new Date('2025-09-12T10:00:00.000Z') // Past date
      };

      await expect(bookingService.createBooking(pastBookingData as any))
        .rejects
        .toThrow('Cannot book appointments in the past');
    });
  });

  describe('Psychology Vertical Integration', () => {
    test('should create psychology therapy session with privacy compliance', async () => {
      const therapyBookingData = {
        clientId: 'client-123',
        providerId: 'therapist-456',
        serviceId: 'therapy-individual',
        scheduledFor: new Date('2025-09-15T14:00:00.000Z'),
        location: 'Buenos Aires',
        price: 8000, // ARS
        serviceType: 'PSYCHOLOGY',
        specialization: 'cognitive-behavioral',
        privacyConsent: true,
        gdprCompliant: true
      };

      const expectedTherapyBooking = {
        id: 'therapy-booking-123',
        ...therapyBookingData,
        status: 'CONFIRMED',
        encryptedNotes: 'encrypted-session-notes',
        privacyLevel: 'HIGH'
      };

      mockPrisma.booking.create.mockResolvedValue(expectedTherapyBooking as any);
      mockPrisma.therapySession.create.mockResolvedValue({
        id: 'session-123',
        bookingId: 'therapy-booking-123',
        privacyLevel: 'HIGH',
        gdprCompliant: true
      } as any);

      const result = await bookingService.createPsychologyBooking(therapyBookingData);

      expect(result).toMatchObject({
        id: 'therapy-booking-123',
        serviceType: 'PSYCHOLOGY',
        privacyLevel: 'HIGH'
      });
      expect(mockPrisma.therapySession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookingId: 'therapy-booking-123',
          privacyLevel: 'HIGH',
          gdprCompliant: true
        })
      });
    });

    test('should require privacy consent for psychology bookings', async () => {
      const therapyBookingWithoutConsent = {
        serviceType: 'PSYCHOLOGY',
        privacyConsent: false
      };

      await expect(bookingService.createPsychologyBooking(therapyBookingWithoutConsent as any))
        .rejects
        .toThrow('Privacy consent required for psychology services');
    });

    test('should validate therapist licensing for psychology bookings', async () => {
      const therapyBookingData = {
        providerId: 'unlicensed-therapist-789',
        serviceType: 'PSYCHOLOGY'
      };

      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'unlicensed-therapist-789',
        psychologyLicense: null,
        licenseVerified: false
      } as any);

      await expect(bookingService.createPsychologyBooking(therapyBookingData as any))
        .rejects
        .toThrow('Provider not licensed for psychology services');
    });
  });

  describe('Argentina-Specific Functionality', () => {
    test('should calculate AFIP tax correctly for Argentina bookings', async () => {
      const argentinaBookingData = {
        price: 10000, // ARS
        location: 'Buenos Aires',
        clientDNI: '12345678',
        providerCUIT: '20-12345678-9'
      };

      const taxCalculation = await bookingService.calculateArgentinaTax(argentinaBookingData);

      expect(taxCalculation).toMatchObject({
        baseAmount: 10000,
        taxAmount: 2100, // 21% IVA
        totalAmount: 12100,
        afipCompliant: true
      });
    });

    test('should validate DNI format for Argentina clients', async () => {
      const invalidDNIBooking = {
        clientDNI: 'invalid-dni',
        location: 'Buenos Aires'
      };

      await expect(bookingService.validateArgentinaIdentity(invalidDNIBooking))
        .rejects
        .toThrow('Invalid DNI format');
    });

    test('should handle MercadoPago payment integration', async () => {
      const mercadopagoBookingData = {
        price: 7500,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        installments: 3
      };

      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'mp-tx-123',
        status: 'APPROVED',
        installments: 3,
        installmentAmount: 2500
      });

      const result = await bookingService.processMercadoPagoPayment(mercadopagoBookingData);

      expect(result.success).toBe(true);
      expect(result.installments).toBe(3);
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          gateway: 'mercadopago',
          installments: 3
        })
      );
    });

    test('should handle Argentina timezone correctly', async () => {
      const bookingData = {
        scheduledFor: '2025-09-15 10:00',
        timezone: 'America/Argentina/Buenos_Aires'
      };

      const convertedTime = await bookingService.convertToArgentinaTime(bookingData);

      expect(convertedTime).toBeInstanceOf(Date);
      expect(convertedTime.toISOString()).toContain('2025-09-15');
    });
  });

  describe('Multi-City Support', () => {
    test('should handle cross-city service booking', async () => {
      const crossCityBookingData = {
        clientLocation: 'Buenos Aires',
        providerLocation: 'Córdoba',
        serviceRadius: 50, // km
        travelCompensation: true
      };

      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'provider-456',
        location: 'Córdoba',
        serviceRadius: 50,
        crossCityService: true
      } as any);

      const result = await bookingService.validateCrossCityService(crossCityBookingData);

      expect(result.eligible).toBe(true);
      expect(result.travelCompensation).toBe(true);
    });

    test('should calculate distance between Argentina cities', async () => {
      const distanceCalculation = await bookingService.calculateArgentinaCityDistance(
        'Buenos Aires',
        'Córdoba'
      );

      expect(distanceCalculation.distance).toBeGreaterThan(0);
      expect(distanceCalculation.travelTime).toBeGreaterThan(0);
      expect(distanceCalculation.currency).toBe('ARS');
    });
  });

  describe('Advanced Booking Features', () => {
    test('should handle group booking coordination', async () => {
      const groupBookingData = {
        groupSize: 4,
        participants: [
          { clientId: 'client-1', name: 'Juan' },
          { clientId: 'client-2', name: 'María' },
          { clientId: 'client-3', name: 'Carlos' },
          { clientId: 'client-4', name: 'Ana' }
        ],
        splitPayment: true
      };

      mockPrisma.groupBooking.create.mockResolvedValue({
        id: 'group-booking-123',
        ...groupBookingData,
        status: 'CONFIRMED'
      } as any);

      const result = await bookingService.createGroupBooking(groupBookingData);

      expect(result.id).toBe('group-booking-123');
      expect(result.groupSize).toBe(4);
      expect(mockNotificationService.sendGroupBookingNotifications).toHaveBeenCalledWith(
        expect.arrayContaining(['client-1', 'client-2', 'client-3', 'client-4'])
      );
    });

    test('should handle recurring booking series', async () => {
      const recurringBookingData = {
        frequency: 'weekly',
        occurrences: 8,
        startDate: new Date('2025-09-15T10:00:00.000Z')
      };

      const result = await bookingService.createRecurringBooking(recurringBookingData);

      expect(result.series.length).toBe(8);
      expect(result.frequency).toBe('weekly');
      expect(mockPrisma.booking.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            scheduledFor: expect.any(Date),
            seriesId: expect.any(String)
          })
        ])
      });
    });

    test('should validate booking conflicts in series', async () => {
      const conflictingSeriesData = {
        providerId: 'provider-456',
        frequency: 'weekly',
        startDate: new Date('2025-09-15T10:00:00.000Z'),
        occurrences: 4
      };

      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'conflict-booking',
          providerId: 'provider-456',
          scheduledFor: new Date('2025-09-22T10:00:00.000Z'), // Second week
          status: 'CONFIRMED'
        }
      ] as any);

      await expect(bookingService.validateRecurringBookingSeries(conflictingSeriesData))
        .rejects
        .toThrow('Scheduling conflict detected in recurring series');
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle high concurrent booking requests', async () => {
      const concurrentBookings = Array.from({ length: 10 }, (_, i) => ({
        clientId: `client-${i}`,
        providerId: 'provider-456',
        scheduledFor: new Date(`2025-09-15T${10 + i}:00:00.000Z`)
      }));

      // Mock successful bookings
      mockPrisma.booking.create.mockImplementation(({ data }) => 
        Promise.resolve({
          id: `booking-${data.clientId}`,
          ...data,
          status: 'CONFIRMED'
        } as any)
      );

      const results = await Promise.allSettled(
        concurrentBookings.map(booking => bookingService.createBooking(booking as any))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      expect(successful).toBe(10);
    });

    test('should handle payment gateway timeout gracefully', async () => {
      const bookingData = {
        price: 5000,
        paymentMethod: 'mercadopago'
      };

      mockPaymentService.processPayment.mockRejectedValue(new Error('Payment timeout'));

      const result = await bookingService.createBookingWithPayment(bookingData as any);

      expect(result.status).toBe('PAYMENT_PENDING');
      expect(result.paymentRetryScheduled).toBe(true);
    });

    test('should validate booking capacity limits', async () => {
      const capacityData = {
        providerId: 'provider-456',
        date: '2025-09-15',
        requestedSlots: 12
      };

      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'provider-456',
        dailyCapacity: 8,
        maxConcurrentBookings: 10
      } as any);

      await expect(bookingService.validateBookingCapacity(capacityData))
        .rejects
        .toThrow('Provider capacity exceeded for requested date');
    });
  });

  describe('Integration Points', () => {
    test('should integrate with WhatsApp Business API for Argentina notifications', async () => {
      const whatsappBookingData = {
        clientPhone: '+5491234567890',
        preferredNotification: 'whatsapp',
        language: 'es-AR'
      };

      mockNotificationService.sendWhatsAppNotification.mockResolvedValue({
        success: true,
        messageId: 'wa-msg-123',
        deliveryStatus: 'DELIVERED'
      });

      const result = await bookingService.sendArgentinaBookingNotification(whatsappBookingData);

      expect(result.success).toBe(true);
      expect(mockNotificationService.sendWhatsAppNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+5491234567890',
          language: 'es-AR',
          template: 'booking_confirmation_ar'
        })
      );
    });

    test('should integrate with AFIP for tax reporting', async () => {
      const afipReportingData = {
        bookingId: 'booking-123',
        amount: 12100,
        taxAmount: 2100,
        clientDNI: '12345678',
        providerCUIT: '20-12345678-9'
      };

      mockPrisma.afipTransaction.create.mockResolvedValue({
        id: 'afip-tx-123',
        ...afipReportingData,
        reportedAt: new Date(),
        status: 'REPORTED'
      } as any);

      const result = await bookingService.reportToAFIP(afipReportingData);

      expect(result.status).toBe('REPORTED');
      expect(result.afipTransactionId).toBe('afip-tx-123');
    });
  });

  describe('Data Validation and Security', () => {
    test('should sanitize and validate booking input data', async () => {
      const maliciousBookingData = {
        clientId: '<script>alert("xss")</script>',
        notes: 'DROP TABLE bookings; --',
        location: 'Buenos Aires'
      };

      const sanitizedData = await bookingService.sanitizeBookingData(maliciousBookingData);

      expect(sanitizedData.clientId).not.toContain('<script>');
      expect(sanitizedData.notes).not.toContain('DROP TABLE');
      expect(sanitizedData.location).toBe('Buenos Aires');
    });

    test('should enforce rate limiting for booking creation', async () => {
      const clientId = 'high-frequency-client';
      const bookingAttempts = Array.from({ length: 6 }, () => ({
        clientId,
        scheduledFor: new Date('2025-09-15T10:00:00.000Z')
      }));

      // First 5 should succeed, 6th should be rate limited
      for (let i = 0; i < 5; i++) {
        await expect(bookingService.createBooking(bookingAttempts[i] as any))
          .resolves.toBeDefined();
      }

      await expect(bookingService.createBooking(bookingAttempts[5] as any))
        .rejects
        .toThrow('Rate limit exceeded');
    });

    test('should encrypt sensitive therapy session data', async () => {
      const sensitiveTherapyData = {
        sessionNotes: 'Client discussed anxiety management techniques',
        mentalHealthAssessment: 'GAD-7 score: 12',
        treatmentPlan: 'Cognitive behavioral therapy recommended'
      };

      const encryptedData = await bookingService.encryptTherapyData(sensitiveTherapyData);

      expect(encryptedData.sessionNotes).not.toBe(sensitiveTherapyData.sessionNotes);
      expect(encryptedData.encryptionMethod).toBe('AES-256-GCM');
      expect(encryptedData.gdprCompliant).toBe(true);
    });
  });
});