import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { whatsAppService } from '../../src/services/whatsapp-integration';
import { emailService } from '../../src/services/email-integration';
import { smsService } from '../../src/services/sms-integration';

// Mock external API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsApp Business API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('WhatsApp Message Delivery', () => {
    it('should send booking confirmation via WhatsApp successfully', async () => {
      const mockResponse = {
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '+5491123456789', wa_id: '5491123456789' }],
          messages: [{ id: 'wamid.HBgLNTE5MTEyMzQ1Njc4OQA=' }],
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const bookingData = {
        clientPhone: '+5491123456789',
        providerName: 'Barbería El Corte',
        serviceName: 'Corte de Cabello',
        dateTime: new Date('2024-01-15T14:00:00Z'),
        address: 'Av. Corrientes 1234, CABA',
        totalAmount: 150.00,
      };

      const result = await whatsAppService.sendBookingConfirmation(bookingData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '+5491123456789',
          type: 'template',
        }),
        expect.objectContaining({
          headers: {
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle WhatsApp API rate limiting gracefully', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            error: {
              message: 'Rate limit exceeded',
              code: 131056,
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(rateLimitError);
      
      // Mock successful retry after delay
      mockedAxios.post.mockResolvedValueOnce({
        data: { messages: [{ id: 'retry-message-id' }] },
        status: 200,
      });

      const result = await whatsAppService.sendMessage(
        '+5491123456789',
        'Test message'
      );

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should fallback to SMS when WhatsApp fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('WhatsApp service unavailable'));

      const fallbackResult = await whatsAppService.sendWithFallback(
        '+5491123456789',
        'Booking confirmed for tomorrow at 2 PM'
      );

      expect(fallbackResult.primaryChannel).toBe('whatsapp');
      expect(fallbackResult.fallbackChannel).toBe('sms');
      expect(fallbackResult.delivered).toBe(true);
    });
  });

  describe('Calendar Synchronization', () => {
    it('should sync booking with Google Calendar successfully', async () => {
      const mockCalendarResponse = {
        data: {
          id: 'event-12345',
          status: 'confirmed',
          summary: 'Corte de Cabello - Cliente: Juan Pérez',
          start: { dateTime: '2024-01-15T14:00:00-03:00' },
          end: { dateTime: '2024-01-15T15:00:00-03:00' },
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValue(mockCalendarResponse);

      const bookingData = {
        providerId: 'provider-1',
        clientName: 'Juan Pérez',
        serviceName: 'Corte de Cabello',
        startTime: new Date('2024-01-15T14:00:00-03:00'),
        endTime: new Date('2024-01-15T15:00:00-03:00'),
        location: 'Barbería El Corte, Palermo',
      };

      const result = await emailService.syncToCalendar(bookingData);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-12345');
      expect(result.calendarProvider).toBe('google');
    });

    it('should handle calendar sync conflicts', async () => {
      const conflictError = {
        response: {
          status: 409,
          data: {
            error: {
              message: 'Time slot already booked',
              conflicts: ['existing-event-123'],
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValue(conflictError);

      const result = await emailService.syncToCalendar({
        providerId: 'provider-1',
        startTime: new Date('2024-01-15T14:00:00-03:00'),
        endTime: new Date('2024-01-15T15:00:00-03:00'),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('CALENDAR_CONFLICT');
      expect(result.conflictingEvents).toContain('existing-event-123');
    });

    it('should support multiple calendar providers', async () => {
      const providers = ['google', 'outlook', 'apple'];
      
      for (const provider of providers) {
        mockedAxios.post.mockResolvedValueOnce({
          data: { id: `${provider}-event-123` },
          status: 200,
        });

        const result = await emailService.syncToCalendar({
          providerId: 'provider-1',
          calendarProvider: provider,
          startTime: new Date(),
          endTime: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.calendarProvider).toBe(provider);
      }
    });
  });

  describe('Social Media Integration', () => {
    it('should post service promotion to Instagram Business', async () => {
      const mockInstagramResponse = {
        data: {
          id: 'post-12345',
          permalink: 'https://instagram.com/p/ABC123',
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValue(mockInstagramResponse);

      const promotionData = {
        providerId: 'provider-1',
        serviceId: 'service-1',
        imageUrl: 'https://example.com/haircut-promo.jpg',
        caption: '¡Nueva promoción en cortes de cabello! 20% de descuento esta semana.',
        hashtags: ['#barberia', '#palermo', '#corte', '#descuento'],
      };

      const result = await emailService.postToInstagram(promotionData);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('post-12345');
      expect(result.permalink).toContain('instagram.com');
    });

    it('should handle Instagram API content policy violations', async () => {
      const policyViolationError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 100,
              message: 'Content violates Instagram policies',
              type: 'OAuthException',
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValue(policyViolationError);

      const result = await emailService.postToInstagram({
        imageUrl: 'https://example.com/violation.jpg',
        caption: 'Test content',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('CONTENT_POLICY_VIOLATION');
    });

    it('should schedule social media posts for optimal engagement', async () => {
      const scheduleData = {
        providerId: 'provider-1',
        content: 'Nueva promoción disponible',
        platforms: ['instagram', 'facebook'],
        scheduledTime: new Date('2024-01-15T18:00:00-03:00'), // 6 PM Argentina time
      };

      mockedAxios.post.mockResolvedValue({
        data: { scheduled_publish_time: 1705344000 },
        status: 200,
      });

      const result = await emailService.schedulePost(scheduleData);

      expect(result.success).toBe(true);
      expect(result.scheduledFor).toBeInstanceOf(Date);
    });
  });

  describe('Email Campaign Integration', () => {
    it('should send targeted email campaign to client segments', async () => {
      const campaignData = {
        segmentId: 'premium-clients',
        subject: 'Oferta Especial para Clientes Premium',
        template: 'premium-offer',
        variables: {
          discount: '25%',
          validUntil: '2024-01-31',
        },
        recipients: 150,
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          campaign_id: 'campaign-12345',
          status: 'sent',
          recipients_count: 150,
          delivery_rate: 0.98,
        },
        status: 200,
      });

      const result = await emailService.sendCampaign(campaignData);

      expect(result.success).toBe(true);
      expect(result.campaignId).toBe('campaign-12345');
      expect(result.deliveryRate).toBeGreaterThan(0.95);
    });

    it('should track email campaign performance metrics', async () => {
      const campaignId = 'campaign-12345';

      mockedAxios.get.mockResolvedValue({
        data: {
          campaign_id: campaignId,
          sent: 150,
          delivered: 147,
          opened: 89,
          clicked: 23,
          unsubscribed: 2,
          bounced: 3,
        },
        status: 200,
      });

      const metrics = await emailService.getCampaignMetrics(campaignId);

      expect(metrics.openRate).toBeCloseTo(0.605, 2); // 89/147
      expect(metrics.clickRate).toBeCloseTo(0.156, 2); // 23/147
      expect(metrics.bounceRate).toBeCloseTo(0.02, 2); // 3/150
    });

    it('should personalize email content for Argentina market', async () => {
      const personalizationData = {
        clientName: 'María González',
        preferredService: 'Coloración',
        lastVisit: new Date('2023-12-15'),
        location: 'Palermo',
        currency: 'ARS',
      };

      const personalizedContent = await emailService.personalizeContent(
        'welcome-template',
        personalizationData
      );

      expect(personalizedContent).toContain('María González');
      expect(personalizedContent).toContain('Coloración');
      expect(personalizedContent).toContain('Palermo');
      expect(personalizedContent).toContain('ARS');
    });
  });

  describe('SMS Notification System', () => {
    it('should send SMS notifications via Argentina mobile networks', async () => {
      const smsData = {
        to: '+5491123456789',
        message: 'Su cita en Barbería El Corte está confirmada para mañana a las 14:00.',
        carrier: 'movistar', // Argentina carrier
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          message_id: 'sms-12345',
          status: 'sent',
          carrier: 'movistar',
          cost: 0.05,
        },
        status: 200,
      });

      const result = await smsService.sendSMS(smsData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('sms-12345');
      expect(result.carrier).toBe('movistar');
    });

    it('should optimize SMS content for character limits', async () => {
      const longMessage = 'Su cita en Barbería El Corte ubicada en Av. Corrientes 1234, Palermo, Buenos Aires está confirmada para el día de mañana 15 de enero a las 14:00 horas. Por favor confirme su asistencia.';

      const optimized = await smsService.optimizeMessage(longMessage);

      expect(optimized.length).toBeLessThanOrEqual(160);
      expect(optimized).toContain('cita confirmada');
      expect(optimized).toContain('15/1 14:00');
    });

    it('should handle SMS delivery failures with retry logic', async () => {
      const deliveryError = {
        response: {
          status: 422,
          data: {
            error: 'Invalid phone number format',
            code: 'INVALID_NUMBER',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(deliveryError);
      
      const result = await smsService.sendWithRetry(
        '+54911234567', // Invalid format
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_NUMBER');
      expect(result.retryAttempts).toBe(0); // No retry for invalid number
    });
  });

  describe('Payment Integration with Subscription Billing', () => {
    it('should process subscription billing with MercadoPago', async () => {
      const subscriptionData = {
        providerId: 'provider-1',
        planId: 'premium-monthly',
        amount: 2500.00,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          id: 'sub-12345',
          status: 'active',
          next_payment_date: '2024-02-15',
          amount: 2500.00,
        },
        status: 200,
      });

      const result = await whatsAppService.processSubscriptionPayment(subscriptionData);

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('sub-12345');
      expect(result.status).toBe('active');
    });

    it('should handle failed subscription renewals', async () => {
      const renewalError = {
        response: {
          status: 402,
          data: {
            error: 'Payment failed',
            reason: 'Insufficient funds',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(renewalError);

      const result = await whatsAppService.processSubscriptionRenewal('sub-12345');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PAYMENT_FAILED');
      expect(result.notificationSent).toBe(true); // Should notify via WhatsApp
    });

    it('should validate payment security for premium features', async () => {
      const paymentData = {
        amount: 5000.00,
        currency: 'ARS',
        providerId: 'provider-1',
        paymentMethod: 'credit_card',
        cardToken: 'tok_test_12345',
      };

      const securityCheck = await whatsAppService.validatePaymentSecurity(paymentData);

      expect(securityCheck.passed).toBe(true);
      expect(securityCheck.riskScore).toBeLessThan(0.3);
      expect(securityCheck.checks).toContain('PCI_COMPLIANCE');
      expect(securityCheck.checks).toContain('FRAUD_DETECTION');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-volume message sending (>1000 messages)', async () => {
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        to: `+54911${String(i).padStart(7, '0')}`,
        message: `Test message ${i}`,
      }));

      mockedAxios.post.mockImplementation(() => 
        Promise.resolve({
          data: { messages: [{ id: `msg-${Date.now()}` }] },
          status: 200,
        })
      );

      const start = Date.now();
      const results = await whatsAppService.sendBulkMessages(messages);
      const duration = Date.now() - start;

      expect(results.successCount).toBe(1000);
      expect(results.failureCount).toBe(0);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should maintain >99.5% integration reliability', async () => {
      const totalRequests = 200;
      let successCount = 0;

      // Simulate 99.5% success rate
      mockedAxios.post.mockImplementation(() => {
        if (Math.random() < 0.995) {
          successCount++;
          return Promise.resolve({ data: { success: true }, status: 200 });
        } else {
          return Promise.reject(new Error('Simulated failure'));
        }
      });

      const promises = Array.from({ length: totalRequests }, () =>
        whatsAppService.sendMessage('+5491123456789', 'Test').catch(() => null)
      );

      await Promise.all(promises);

      const reliabilityRate = successCount / totalRequests;
      expect(reliabilityRate).toBeGreaterThan(0.995);
    });

    it('should implement circuit breaker for external API failures', async () => {
      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        mockedAxios.post.mockRejectedValueOnce(new Error('API unavailable'));
        
        try {
          await whatsAppService.sendMessage('+5491123456789', 'Test');
        } catch (error) {
          // Expected failures
        }
      }

      // Circuit breaker should now be open
      const result = await whatsAppService.sendMessage('+5491123456789', 'Test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('CIRCUIT_BREAKER_OPEN');
    });
  });
});

describe('Integration Systems Coordination', () => {
  it('should coordinate multi-channel notifications correctly', async () => {
    const notificationData = {
      clientId: 'client-1',
      type: 'BOOKING_CONFIRMATION',
      channels: ['whatsapp', 'email', 'sms'],
      priority: 'high',
      content: {
        bookingId: 'booking-123',
        serviceName: 'Corte de Cabello',
        dateTime: new Date('2024-01-15T14:00:00Z'),
      },
    };

    mockedAxios.post.mockResolvedValue({
      data: { success: true, messageId: 'msg-123' },
      status: 200,
    });

    const result = await whatsAppService.sendMultiChannelNotification(notificationData);

    expect(result.whatsapp.success).toBe(true);
    expect(result.email.success).toBe(true);
    expect(result.sms.success).toBe(true);
    expect(result.deliveredChannels).toBe(3);
  });

  it('should validate Argentina compliance across all integrations', async () => {
    const complianceCheck = await whatsAppService.validateArgentinaCompliance();

    expect(complianceCheck.dataProtection).toBe(true);
    expect(complianceCheck.consumedRights).toBe(true);
    expect(complianceCheck.taxCompliance).toBe(true);
    expect(complianceCheck.communicationPreferences).toBe(true);
  });
});