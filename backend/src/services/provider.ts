import { PrismaClient, Provider } from '@prisma/client';
import { prisma } from './database';

export interface WorkingHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string; // "09:00"
    closeTime: string; // "18:00"
    breaks?: Array<{
      start: string;
      end: string;
      description?: string;
    }>;
  };
}

export interface BufferTimeSettings {
  beforeBooking: number; // minutes
  afterBooking: number; // minutes
  betweenServices: number; // minutes
}

export interface ProviderSettings {
  workingHours: WorkingHours;
  bufferTimes: BufferTimeSettings;
  allowSameDayBooking: boolean;
  maxAdvanceBookingDays: number;
  autoConfirmBookings: boolean;
  requireDeposit: boolean;
  depositPercentage?: number;
}

export class ProviderService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Get default working hours template for Argentina barber shops
   */
  getDefaultWorkingHours(): WorkingHours {
    return {
      monday: {
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [
          { start: "12:00", end: "13:00", description: "Almuerzo" }
        ]
      },
      tuesday: {
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [
          { start: "12:00", end: "13:00", description: "Almuerzo" }
        ]
      },
      wednesday: {
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [
          { start: "12:00", end: "13:00", description: "Almuerzo" }
        ]
      },
      thursday: {
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [
          { start: "12:00", end: "13:00", description: "Almuerzo" }
        ]
      },
      friday: {
        isOpen: true,
        openTime: "09:00",
        closeTime: "19:00",
        breaks: [
          { start: "12:00", end: "13:00", description: "Almuerzo" }
        ]
      },
      saturday: {
        isOpen: true,
        openTime: "09:00",
        closeTime: "16:00"
      },
      sunday: {
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00"
      }
    };
  }

  /**
   * Get default buffer time settings
   */
  getDefaultBufferSettings(): BufferTimeSettings {
    return {
      beforeBooking: 5, // 5 minutes to prepare
      afterBooking: 10, // 10 minutes to clean up
      betweenServices: 15 // 15 minutes between different services
    };
  }

  /**
   * Update provider working hours
   */
  async updateWorkingHours(
    providerId: string,
    workingHours: WorkingHours
  ): Promise<Provider> {
    // Validate working hours format
    this.validateWorkingHours(workingHours);

    const provider = await this.db.provider.update({
      where: { id: providerId },
      data: {
        workingHours: workingHours as any
      },
      include: {
        user: true,
        services: true
      }
    });

    return provider;
  }

  /**
   * Validate working hours structure
   */
  private validateWorkingHours(workingHours: WorkingHours): void {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const schedule = workingHours[day];
      
      if (!schedule) {
        throw new Error(`Missing schedule for ${day}`);
      }

      if (schedule.isOpen) {
        if (!schedule.openTime || !schedule.closeTime) {
          throw new Error(`Open/close time required for ${day}`);
        }

        if (!this.isValidTimeFormat(schedule.openTime) || !this.isValidTimeFormat(schedule.closeTime)) {
          throw new Error(`Invalid time format for ${day}. Use HH:MM format`);
        }

        const openMinutes = this.timeToMinutes(schedule.openTime);
        const closeMinutes = this.timeToMinutes(schedule.closeTime);

        if (openMinutes >= closeMinutes) {
          throw new Error(`Open time must be before close time for ${day}`);
        }

        // Validate break times
        if (schedule.breaks) {
          for (const breakTime of schedule.breaks) {
            if (!this.isValidTimeFormat(breakTime.start) || !this.isValidTimeFormat(breakTime.end)) {
              throw new Error(`Invalid break time format for ${day}`);
            }

            const breakStart = this.timeToMinutes(breakTime.start);
            const breakEnd = this.timeToMinutes(breakTime.end);

            if (breakStart >= breakEnd) {
              throw new Error(`Break start time must be before end time for ${day}`);
            }

            if (breakStart < openMinutes || breakEnd > closeMinutes) {
              throw new Error(`Break times must be within working hours for ${day}`);
            }
          }
        }
      }
    }
  }

  /**
   * Check if time format is valid (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get provider availability for a specific date
   */
  async getProviderAvailability(
    providerId: string,
    date: Date
  ): Promise<{
    isAvailable: boolean;
    workingHours?: { start: string; end: string };
    breaks?: Array<{ start: string; end: string; description?: string }>;
    totalWorkingMinutes: number;
  }> {
    const provider = await this.db.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    const workingHours = provider.workingHours as WorkingHours;
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayKey];

    if (!daySchedule || !daySchedule.isOpen) {
      return {
        isAvailable: false,
        totalWorkingMinutes: 0
      };
    }

    const openMinutes = this.timeToMinutes(daySchedule.openTime);
    const closeMinutes = this.timeToMinutes(daySchedule.closeTime);
    let totalWorkingMinutes = closeMinutes - openMinutes;

    // Subtract break times
    if (daySchedule.breaks) {
      for (const breakTime of daySchedule.breaks) {
        const breakStart = this.timeToMinutes(breakTime.start);
        const breakEnd = this.timeToMinutes(breakTime.end);
        totalWorkingMinutes -= (breakEnd - breakStart);
      }
    }

    return {
      isAvailable: true,
      workingHours: {
        start: daySchedule.openTime,
        end: daySchedule.closeTime
      },
      breaks: daySchedule.breaks,
      totalWorkingMinutes
    };
  }

  /**
   * Check if provider is available at specific time
   */
  async isProviderAvailable(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ available: boolean; reason?: string }> {
    const provider = await this.db.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return { available: false, reason: 'Provider not found' };
    }

    if (!provider.isActive) {
      return { available: false, reason: 'Provider is inactive' };
    }

    const workingHours = provider.workingHours as WorkingHours;
    const dayKey = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayKey];

    if (!daySchedule || !daySchedule.isOpen) {
      return { available: false, reason: 'Provider is closed on this day' };
    }

    // Check working hours
    const requestStartTime = startTime.toTimeString().slice(0, 5);
    const requestEndTime = endTime.toTimeString().slice(0, 5);

    const openMinutes = this.timeToMinutes(daySchedule.openTime);
    const closeMinutes = this.timeToMinutes(daySchedule.closeTime);
    const requestStartMinutes = this.timeToMinutes(requestStartTime);
    const requestEndMinutes = this.timeToMinutes(requestEndTime);

    if (requestStartMinutes < openMinutes || requestEndMinutes > closeMinutes) {
      return { 
        available: false, 
        reason: `Outside working hours (${daySchedule.openTime} - ${daySchedule.closeTime})` 
      };
    }

    // Check break times
    if (daySchedule.breaks) {
      for (const breakTime of daySchedule.breaks) {
        const breakStart = this.timeToMinutes(breakTime.start);
        const breakEnd = this.timeToMinutes(breakTime.end);

        if (
          (requestStartMinutes < breakEnd && requestEndMinutes > breakStart)
        ) {
          return { 
            available: false, 
            reason: `Conflicts with break time (${breakTime.start} - ${breakTime.end})` 
          };
        }
      }
    }

    return { available: true };
  }

  /**
   * Get provider's busy periods for a date range
   */
  async getProviderBusyPeriods(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    date: string;
    busySlots: Array<{
      start: string;
      end: string;
      type: 'booking' | 'break';
      description?: string;
    }>;
  }>> {
    const provider = await this.db.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Get all bookings in the date range
    const bookings = await this.db.booking.findMany({
      where: {
        providerId,
        startTime: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      },
      include: {
        service: true,
        client: true
      },
      orderBy: { startTime: 'asc' }
    });

    const workingHours = provider.workingHours as WorkingHours;
    const busyPeriods: Array<{
      date: string;
      busySlots: Array<{
        start: string;
        end: string;
        type: 'booking' | 'break';
        description?: string;
      }>;
    }> = [];

    // Group bookings by date
    const bookingsByDate = new Map<string, typeof bookings>();
    
    for (const booking of bookings) {
      const dateKey = booking.startTime.toISOString().split('T')[0];
      if (!bookingsByDate.has(dateKey)) {
        bookingsByDate.set(dateKey, []);
      }
      bookingsByDate.get(dateKey)!.push(booking);
    }

    // Process each date
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayKey = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule = workingHours[dayKey];

      const busySlots: Array<{
        start: string;
        end: string;
        type: 'booking' | 'break';
        description?: string;
      }> = [];

      // Add break times
      if (daySchedule?.breaks) {
        for (const breakTime of daySchedule.breaks) {
          busySlots.push({
            start: breakTime.start,
            end: breakTime.end,
            type: 'break',
            description: breakTime.description || 'Descanso'
          });
        }
      }

      // Add bookings
      const dayBookings = bookingsByDate.get(dateKey) || [];
      for (const booking of dayBookings) {
        busySlots.push({
          start: booking.startTime.toTimeString().slice(0, 5),
          end: booking.endTime.toTimeString().slice(0, 5),
          type: 'booking',
          description: `${booking.service.name} - ${booking.client.name}`
        });
      }

      if (busySlots.length > 0) {
        busyPeriods.push({
          date: dateKey,
          busySlots: busySlots.sort((a, b) => a.start.localeCompare(b.start))
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return busyPeriods;
  }

  /**
   * Update provider settings
   */
  async updateProviderSettings(
    providerId: string,
    settings: Partial<ProviderSettings>
  ): Promise<Provider> {
    const provider = await this.db.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    const currentWorkingHours = provider.workingHours as WorkingHours || this.getDefaultWorkingHours();

    const updatedData: any = {};

    if (settings.workingHours) {
      this.validateWorkingHours(settings.workingHours);
      updatedData.workingHours = settings.workingHours;
    }

    // Store other settings in a separate field or extend the model
    // For now, we'll store them in workingHours object
    const updatedWorkingHours = {
      ...currentWorkingHours,
      ...settings.workingHours,
      _settings: {
        bufferTimes: settings.bufferTimes || this.getDefaultBufferSettings(),
        allowSameDayBooking: settings.allowSameDayBooking ?? true,
        maxAdvanceBookingDays: settings.maxAdvanceBookingDays ?? 30,
        autoConfirmBookings: settings.autoConfirmBookings ?? false,
        requireDeposit: settings.requireDeposit ?? false,
        depositPercentage: settings.depositPercentage ?? 20
      }
    };

    const updatedProvider = await this.db.provider.update({
      where: { id: providerId },
      data: {
        workingHours: updatedWorkingHours
      },
      include: {
        user: true,
        services: true
      }
    });

    return updatedProvider;
  }
}

export const providerService = new ProviderService();