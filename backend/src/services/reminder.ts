import { PrismaClient, BookingStatus, Booking } from '@prisma/client';
import { prisma } from './database';
import { socketService } from './socket';
import redis from './redis';

export interface ReminderRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerBefore: number; // minutes before appointment
  channels: ('email' | 'sms' | 'push' | 'whatsapp')[];
  template: {
    title: string;
    message: string;
  };
}

export interface ReminderJob {
  id: string;
  bookingId: string;
  ruleId: string;
  scheduledAt: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  attempts: number;
  lastAttempt?: Date;
  errorMessage?: string;
}

/**
 * Booking reminder system for Argentina market
 * Handles multi-channel notifications (SMS, WhatsApp, Email, Push)
 */
export class ReminderService {
  private defaultRules: ReminderRule[] = [
    {
      id: 'reminder_24h',
      name: 'Recordatorio 24 horas',
      enabled: true,
      triggerBefore: 24 * 60, // 24 hours
      channels: ['whatsapp', 'push'],
      template: {
        title: 'Recordatorio de cita',
        message: 'Tienes una cita mañana a las {time} con {provider}. ¡No olvides confirmar tu asistencia!'
      }
    },
    {
      id: 'reminder_2h',
      name: 'Recordatorio 2 horas',
      enabled: true,
      triggerBefore: 2 * 60, // 2 hours
      channels: ['sms', 'push'],
      template: {
        title: 'Cita en 2 horas',
        message: 'Tu cita con {provider} es en 2 horas ({time}). Dirección: {address}'
      }
    },
    {
      id: 'reminder_30min',
      name: 'Recordatorio 30 minutos',
      enabled: false,
      triggerBefore: 30, // 30 minutes
      channels: ['push'],
      template: {
        title: 'Cita próxima',
        message: 'Tu cita con {provider} comienza en 30 minutos'
      }
    }
  ];

  private reminderQueue = 'barberpro:reminders'; // Redis sorted set key

  constructor(private db: PrismaClient = prisma) {}

  /**
   * Schedule reminders for a new booking
   */
  async scheduleReminders(booking: Booking): Promise<void> {
    try {
      const activeRules = this.defaultRules.filter(rule => rule.enabled);
      
      for (const rule of activeRules) {
        const reminderTime = new Date(
          booking.startTime.getTime() - (rule.triggerBefore * 60000)
        );

        // Don't schedule reminders for the past
        if (reminderTime <= new Date()) {
          continue;
        }

        const reminderJob: ReminderJob = {
          id: `${booking.id}_${rule.id}`,
          bookingId: booking.id,
          ruleId: rule.id,
          scheduledAt: reminderTime,
          status: 'PENDING',
          attempts: 0
        };

        // Store in Redis with TTL
        await redis.set(
          `reminder:${reminderJob.id}`,
          JSON.stringify(reminderJob),
          Math.ceil((reminderTime.getTime() - Date.now()) / 1000) + 86400 // +1 day buffer
        );

        // Add to sorted set for processing (using raw Redis client)
        await redis.getClient().zAdd(
          'reminder_queue',
          { score: reminderTime.getTime(), value: reminderJob.id }
        );

        console.log(`Scheduled reminder ${reminderJob.id} for ${reminderTime.toISOString()}`);
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  /**
   * Cancel reminders for a booking (when cancelled or rescheduled)
   */
  async cancelReminders(bookingId: string): Promise<void> {
    try {
      const activeRules = this.defaultRules;
      
      for (const rule of activeRules) {
        const reminderId = `${bookingId}_${rule.id}`;
        
        // Remove from Redis
        await redis.del(`reminder:${reminderId}`);
        
        // Remove from queue
        await redis.getClient().zRem('reminder_queue', reminderId);
        
        console.log(`Cancelled reminder ${reminderId}`);
      }
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  }

  /**
   * Process due reminders (called by cron job)
   */
  async processDueReminders(): Promise<void> {
    try {
      const now = Date.now();
      
      // Get due reminders from sorted set
      const dueReminderIds = await redis.getClient().zRangeByScore(
        'reminder_queue',
        0,
        now,
        { LIMIT: { offset: 0, count: 10 } } // Process max 10 at a time
      );

      for (const reminderId of dueReminderIds) {
        await this.processReminder(reminderId);
        
        // Remove from queue after processing
        await redis.getClient().zRem('reminder_queue', reminderId);
      }

      if (dueReminderIds.length > 0) {
        console.log(`Processed ${dueReminderIds.length} due reminders`);
      }
    } catch (error) {
      console.error('Error processing due reminders:', error);
    }
  }

  /**
   * Process individual reminder
   */
  private async processReminder(reminderId: string): Promise<void> {
    try {
      const reminderData = await redis.get(`reminder:${reminderId}`);
      if (!reminderData) {
        console.warn(`Reminder ${reminderId} not found in Redis`);
        return;
      }

      const reminder: ReminderJob = JSON.parse(reminderData);
      
      // Get booking details
      const booking = await this.db.booking.findUnique({
        where: { id: reminder.bookingId },
        include: {
          client: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      if (!booking) {
        console.warn(`Booking ${reminder.bookingId} not found for reminder`);
        return;
      }

      // Skip if booking is cancelled or completed
      if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
        console.log(`Skipping reminder for ${booking.status} booking ${booking.id}`);
        return;
      }

      const rule = this.defaultRules.find(r => r.id === reminder.ruleId);
      if (!rule) {
        console.warn(`Reminder rule ${reminder.ruleId} not found`);
        return;
      }

      // Send notifications through configured channels
      await this.sendReminderNotifications(booking, rule);

      // Update reminder status
      reminder.status = 'SENT';
      reminder.attempts += 1;
      reminder.lastAttempt = new Date();

      // Update Redis
      await redis.set(
        `reminder:${reminderId}`,
        JSON.stringify(reminder),
        86400 // Keep for 1 day for debugging
      );

      console.log(`Sent reminder ${reminderId} for booking ${booking.id}`);

    } catch (error) {
      console.error(`Error processing reminder ${reminderId}:`, error);
      
      // Update failure status
      try {
        const reminderData = await redis.get(`reminder:${reminderId}`);
        if (reminderData) {
          const reminder: ReminderJob = JSON.parse(reminderData);
          reminder.status = 'FAILED';
          reminder.attempts += 1;
          reminder.lastAttempt = new Date();
          reminder.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await redis.set(
            `reminder:${reminderId}`,
            JSON.stringify(reminder),
            86400
          );
        }
      } catch (updateError) {
        console.error('Error updating failed reminder status:', updateError);
      }
    }
  }

  /**
   * Send reminder notifications through configured channels
   */
  private async sendReminderNotifications(booking: any, rule: ReminderRule): Promise<void> {
    const context = this.buildMessageContext(booking);
    const personalizedMessage = this.personalizeMessage(rule.template.message, context);
    const personalizedTitle = this.personalizeMessage(rule.template.title, context);

    // Send push notification (always available)
    if (rule.channels.includes('push')) {
      await socketService.sendNotification({
        userId: booking.clientId,
        type: 'booking',
        title: personalizedTitle,
        message: personalizedMessage,
        data: {
          bookingId: booking.id,
          type: 'reminder',
          ruleId: rule.id
        }
      });
    }

    // Store notification in database for all channels
    await this.db.notification.create({
      data: {
        userId: booking.clientId,
        title: personalizedTitle,
        message: personalizedMessage,
        type: 'BOOKING_REMINDER',
        data: {
          bookingId: booking.id,
          ruleId: rule.id,
          channels: rule.channels
        }
      }
    });

    // TODO: Integrate with external services for other channels
    // - WhatsApp Business API
    // - SMS provider (like Twilio)
    // - Email service (like SendGrid)
    
    console.log(`Reminder sent via ${rule.channels.join(', ')} to ${booking.client.email}`);
  }

  /**
   * Build message context for personalization
   */
  private buildMessageContext(booking: any): Record<string, string> {
    const startTime = new Date(booking.startTime);
    const timeString = startTime.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    });

    return {
      clientName: booking.client.name,
      provider: booking.provider.businessName || booking.provider.user.name,
      service: booking.service.name,
      time: timeString,
      date: startTime.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      }),
      address: booking.provider.address || 'Consultar con el proveedor',
      phone: booking.provider.businessPhone || booking.provider.user.phone || '',
      duration: `${booking.service.duration} minutos`,
      price: `$${booking.totalAmount.toString()}`
    };
  }

  /**
   * Personalize message template with context
   */
  private personalizeMessage(template: string, context: Record<string, string>): string {
    let message = template;
    
    Object.entries(context).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return message;
  }

  /**
   * Get reminder status for a booking
   */
  async getReminderStatus(bookingId: string): Promise<ReminderJob[]> {
    try {
      const reminders: ReminderJob[] = [];
      
      for (const rule of this.defaultRules) {
        const reminderId = `${bookingId}_${rule.id}`;
        const reminderData = await redis.get(`reminder:${reminderId}`);
        
        if (reminderData) {
          reminders.push(JSON.parse(reminderData));
        }
      }
      
      return reminders;
    } catch (error) {
      console.error('Error getting reminder status:', error);
      return [];
    }
  }

  /**
   * Update reminder rules (for future enhancement)
   */
  async updateReminderRules(providerId: string, rules: ReminderRule[]): Promise<void> {
    // TODO: Store provider-specific reminder rules
    // For now, we use default rules for all providers
    console.log(`TODO: Update reminder rules for provider ${providerId}`, rules);
  }

  /**
   * Schedule provider alert/notification
   */
  async scheduleProviderAlert(providerId: string, alert: {
    type: string;
    bookingId?: string;
    requestId?: string;
    scheduleTime: Date;
    message?: string;
  }): Promise<void> {
    try {
      const alertKey = `provider_alert:${providerId}:${alert.type}:${Date.now()}`;
      await redis.getClient().zAdd(this.reminderQueue, {
        score: alert.scheduleTime.getTime(),
        value: JSON.stringify({
          key: alertKey,
          type: 'provider_alert',
          providerId,
          alertType: alert.type,
          bookingId: alert.bookingId,
          requestId: alert.requestId,
          message: alert.message,
          scheduledFor: alert.scheduleTime
        })
      });

      console.log(`Scheduled provider alert for ${providerId} at ${alert.scheduleTime}`);
    } catch (error) {
      console.error('Error scheduling provider alert:', error);
    }
  }

  /**
   * Schedule booking expiration with optional notification
   */
  async scheduleBookingExpiration(bookingId: string, config: {
    expirationTime: Date;
    notificationTime?: Date;
  }): Promise<void> {
    try {
      // Schedule expiration task
      const expirationKey = `expiration:${bookingId}`;
      await redis.getClient().zAdd(this.reminderQueue, {
        score: config.expirationTime.getTime(),
        value: JSON.stringify({
          key: expirationKey,
          type: 'booking_expiration',
          bookingId,
          scheduledFor: config.expirationTime
        })
      });

      // Schedule notification before expiration if specified
      if (config.notificationTime) {
        const notificationKey = `expiration_notice:${bookingId}`;
        await redis.getClient().zAdd(this.reminderQueue, {
          score: config.notificationTime.getTime(),
          value: JSON.stringify({
            key: notificationKey,
            type: 'expiration_notice',
            bookingId,
            scheduledFor: config.notificationTime,
            expirationTime: config.expirationTime
          })
        });
      }

      console.log(`Scheduled expiration for booking ${bookingId} at ${config.expirationTime}`);
    } catch (error) {
      console.error('Error scheduling booking expiration:', error);
    }
  }

  /**
   * Start reminder processing daemon
   */
  startReminderProcessor(): void {
    // Process reminders every minute
    const interval = setInterval(async () => {
      await this.processDueReminders();
    }, 60000); // 1 minute

    console.log('Reminder processor started - checking every minute');
    
    // Cleanup on process exit
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('Reminder processor stopped');
    });
    
    process.on('SIGTERM', () => {
      clearInterval(interval);
      console.log('Reminder processor stopped');
    });
  }
}

export const reminderService = new ReminderService();