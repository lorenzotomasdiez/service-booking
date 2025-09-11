import { PrismaClient, Booking, BookingStatus } from '@prisma/client';
import { prisma } from './database';
import { reminderService } from './reminder';

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface WorkingHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string; // "09:00"
    closeTime: string; // "18:00"
    breaks?: Array<{
      start: string;
      end: string;
    }>;
  };
}

export interface BookingConflict {
  type: 'OVERLAP' | 'BUFFER_VIOLATION' | 'OUTSIDE_HOURS' | 'BREAK_TIME';
  message: string;
  conflictingBooking?: Booking;
  suggestedSlots?: TimeSlot[];
}

export class BookingService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Main booking conflict resolution algorithm
   * Checks for overlaps, buffer times, working hours, and breaks
   */
  async validateBookingSlot(
    providerId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{ isValid: boolean; conflicts: BookingConflict[] }> {
    const conflicts: BookingConflict[] = [];

    // Get service and provider data
    const [service, provider] = await Promise.all([
      this.db.service.findUnique({
        where: { id: serviceId }
      }),
      this.db.provider.findUnique({
        where: { id: providerId }
      })
    ]);

    if (!service || !provider) {
      throw new Error('Service or provider not found');
    }

    // 1. Check working hours
    const workingHoursConflict = this.checkWorkingHours(startTime, endTime, provider.workingHours as WorkingHours);
    if (workingHoursConflict) {
      conflicts.push(workingHoursConflict);
    }

    // 2. Check for booking overlaps with buffer time
    const overlapConflicts = await this.checkBookingOverlaps(
      providerId,
      startTime,
      endTime,
      excludeBookingId
    );
    conflicts.push(...overlapConflicts);

    // 3. Check break times
    const breakConflict = this.checkBreakTimes(startTime, endTime, provider.workingHours as WorkingHours);
    if (breakConflict) {
      conflicts.push(breakConflict);
    }

    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Calculate available time slots for a provider on a specific date
   */
  async calculateAvailableSlots(
    providerId: string,
    serviceId: string,
    date: Date,
    bufferMinutes: number = 15
  ): Promise<TimeSlot[]> {
    const service = await this.db.service.findUnique({
      where: { id: serviceId }
    });

    const provider = await this.db.provider.findUnique({
      where: { id: providerId }
    });

    if (!service || !provider) {
      throw new Error('Service or provider not found');
    }

    const workingHours = provider.workingHours as WorkingHours;
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayKey];

    if (!daySchedule?.isOpen) {
      return [];
    }

    // Create base day start/end times in Argentina timezone
    const dayStart = new Date(date);
    const [openHour, openMinute] = daySchedule.openTime.split(':').map(Number);
    dayStart.setHours(openHour, openMinute, 0, 0);

    const dayEnd = new Date(date);
    const [closeHour, closeMinute] = daySchedule.closeTime.split(':').map(Number);
    dayEnd.setHours(closeHour, closeMinute, 0, 0);

    // Get all bookings for the day
    const bookings = await this.db.booking.findMany({
      where: {
        providerId,
        startTime: {
          gte: dayStart,
          lt: dayEnd
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING]
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Generate potential slots
    const availableSlots: TimeSlot[] = [];
    const slotDuration = service.duration;
    const totalDuration = slotDuration + bufferMinutes;

    let currentTime = new Date(dayStart);

    while (currentTime.getTime() + (totalDuration * 60000) <= dayEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + (slotDuration * 60000));
      const slotWithBuffer = new Date(currentTime.getTime() + (totalDuration * 60000));

      // Check if this slot conflicts with any booking
      const hasConflict = bookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const bookingWithBuffer = new Date(bookingEnd.getTime() + (bufferMinutes * 60000));

        return (
          (currentTime < bookingEnd && slotWithBuffer > bookingStart) ||
          (currentTime < bookingWithBuffer && slotEnd > bookingStart)
        );
      });

      // Check if slot conflicts with break times
      const breakConflict = this.checkBreakTimes(currentTime, slotEnd, workingHours);

      if (!hasConflict && !breakConflict) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd)
        });
      }

      // Move to next 15-minute interval
      currentTime = new Date(currentTime.getTime() + (15 * 60000));
    }

    return availableSlots;
  }

  /**
   * Check if booking time is within working hours
   */
  private checkWorkingHours(
    startTime: Date,
    endTime: Date,
    workingHours: WorkingHours
  ): BookingConflict | null {
    const dayKey = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayKey];

    if (!daySchedule?.isOpen) {
      return {
        type: 'OUTSIDE_HOURS',
        message: 'El proveedor no trabaja este día',
        suggestedSlots: []
      };
    }

    const [openHour, openMinute] = daySchedule.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = daySchedule.closeTime.split(':').map(Number);

    const dayStart = new Date(startTime);
    dayStart.setHours(openHour, openMinute, 0, 0);

    const dayEnd = new Date(startTime);
    dayEnd.setHours(closeHour, closeMinute, 0, 0);

    if (startTime < dayStart || endTime > dayEnd) {
      return {
        type: 'OUTSIDE_HOURS',
        message: `Horario de atención: ${daySchedule.openTime} - ${daySchedule.closeTime}`,
        suggestedSlots: []
      };
    }

    return null;
  }

  /**
   * Check for booking overlaps with buffer time consideration
   */
  private async checkBookingOverlaps(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
    bufferMinutes: number = 15
  ): Promise<BookingConflict[]> {
    const conflicts: BookingConflict[] = [];

    // Get overlapping bookings
    const overlappingBookings = await this.db.booking.findMany({
      where: {
        providerId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING]
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      },
      include: {
        service: true,
        client: true
      }
    });

    for (const booking of overlappingBookings) {
      const bookingStartWithBuffer = new Date(booking.startTime.getTime() - (bufferMinutes * 60000));
      const bookingEndWithBuffer = new Date(booking.endTime.getTime() + (bufferMinutes * 60000));

      if (
        (startTime < booking.endTime && endTime > booking.startTime) ||
        (startTime < bookingEndWithBuffer && endTime > bookingStartWithBuffer)
      ) {
        conflicts.push({
          type: startTime < booking.endTime && endTime > booking.startTime ? 'OVERLAP' : 'BUFFER_VIOLATION',
          message: startTime < booking.endTime && endTime > booking.startTime 
            ? `Conflicto directo con reserva existente de ${booking.client.name}`
            : `Tiempo de buffer insuficiente con reserva de ${booking.client.name}`,
          conflictingBooking: booking
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if booking conflicts with break times
   */
  private checkBreakTimes(
    startTime: Date,
    endTime: Date,
    workingHours: WorkingHours
  ): BookingConflict | null {
    const dayKey = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayKey];

    if (!daySchedule?.breaks) {
      return null;
    }

    for (const breakTime of daySchedule.breaks) {
      const [breakStartHour, breakStartMinute] = breakTime.start.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = breakTime.end.split(':').map(Number);

      const breakStart = new Date(startTime);
      breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);

      const breakEnd = new Date(startTime);
      breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

      if (startTime < breakEnd && endTime > breakStart) {
        return {
          type: 'BREAK_TIME',
          message: `Conflicto con horario de descanso (${breakTime.start} - ${breakTime.end})`,
          suggestedSlots: []
        };
      }
    }

    return null;
  }

  /**
   * Get suggested alternative time slots when booking fails
   */
  async getSuggestedSlots(
    providerId: string,
    serviceId: string,
    preferredDate: Date,
    daysToCheck: number = 7
  ): Promise<TimeSlot[]> {
    const suggestions: TimeSlot[] = [];
    const currentDate = new Date(preferredDate);

    for (let i = 0; i < daysToCheck && suggestions.length < 10; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() + i);

      const availableSlots = await this.calculateAvailableSlots(
        providerId,
        serviceId,
        checkDate
      );

      suggestions.push(...availableSlots.slice(0, 3)); // Max 3 slots per day
    }

    return suggestions.slice(0, 10); // Return max 10 suggestions
  }

  /**
   * Create a new booking with validation
   */
  async createBooking(bookingData: {
    clientId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    notes?: string;
  }): Promise<{ success: boolean; booking?: Booking; errors?: BookingConflict[] }> {
    const service = await this.db.service.findUnique({
      where: { id: bookingData.serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const endTime = new Date(bookingData.startTime.getTime() + (service.duration * 60000));

    // Validate the booking slot
    const validation = await this.validateBookingSlot(
      bookingData.providerId,
      bookingData.serviceId,
      bookingData.startTime,
      endTime
    );

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.conflicts
      };
    }

    // Create the booking
    const booking = await this.db.booking.create({
      data: {
        clientId: bookingData.clientId,
        providerId: bookingData.providerId,
        serviceId: bookingData.serviceId,
        startTime: bookingData.startTime,
        endTime,
        totalAmount: service.price,
        notes: bookingData.notes,
        status: BookingStatus.PENDING
      },
      include: {
        client: true,
        provider: true,
        service: true
      }
    });

    return {
      success: true,
      booking
    };
  }

  /**
   * Update booking with conflict checking
   */
  async updateBooking(
    bookingId: string,
    updates: {
      startTime?: Date;
      notes?: string;
      status?: BookingStatus;
    }
  ): Promise<{ success: boolean; booking?: Booking; errors?: BookingConflict[] }> {
    const existingBooking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { service: true }
    });

    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    // If updating start time, validate the new slot
    let updateData: any = { ...updates };
    if (updates.startTime) {
      const endTime = new Date(updates.startTime.getTime() + (existingBooking.service.duration * 60000));
      
      const validation = await this.validateBookingSlot(
        existingBooking.providerId,
        existingBooking.serviceId,
        updates.startTime,
        endTime,
        bookingId // Exclude current booking from conflict check
      );

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.conflicts
        };
      }

      updateData.endTime = endTime;
    }

    const booking = await this.db.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        client: true,
        provider: true,
        service: true
      }
    });

    return {
      success: true,
      booking
    };
  }

  /**
   * Advanced booking state management with transitions
   */
  async updateBookingState(
    bookingId: string,
    newStatus: BookingStatus,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; booking?: Booking; errors?: string[] }> {
    const errors: string[] = [];
    
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { 
        client: true, 
        provider: { include: { user: true } }, 
        service: true 
      }
    });

    if (!booking) {
      errors.push('Reserva no encontrada');
      return { success: false, errors };
    }

    // Validate state transition permissions
    const canTransition = this.validateStateTransition(booking, newStatus, userId);
    if (!canTransition.allowed) {
      errors.push(canTransition.reason || 'Transición de estado no permitida');
      return { success: false, errors };
    }

    // Validate business rules for state changes
    const businessValidation = await this.validateBusinessRulesForStateChange(booking, newStatus);
    if (!businessValidation.valid) {
      errors.push(...businessValidation.errors);
      return { success: false, errors };
    }

    // Update booking with proper timestamps
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Set specific timestamps based on status
    switch (newStatus) {
      case BookingStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case BookingStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
      case BookingStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = userId;
        updateData.cancelReason = reason;
        break;
    }

    const updatedBooking = await this.db.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        client: true,
        provider: { include: { user: true } },
        service: true
      }
    });

    // Handle reminder updates based on status change
    if (newStatus === BookingStatus.CANCELLED) {
      await reminderService.cancelReminders(bookingId);
    } else if (newStatus === BookingStatus.COMPLETED) {
      await reminderService.cancelReminders(bookingId);
    }

    return { success: true, booking: updatedBooking };
  }

  /**
   * Validate state transition permissions
   */
  private validateStateTransition(
    booking: any,
    newStatus: BookingStatus,
    userId: string
  ): { allowed: boolean; reason?: string } {
    const isClient = booking.clientId === userId;
    const isProvider = booking.provider.userId === userId;
    const isAdmin = false; // TODO: Add admin check

    // Define allowed transitions
    const transitions: Record<BookingStatus, { from: BookingStatus[]; who: string[] }> = {
      [BookingStatus.CONFIRMED]: {
        from: [BookingStatus.PENDING],
        who: ['provider', 'admin']
      },
      [BookingStatus.COMPLETED]: {
        from: [BookingStatus.CONFIRMED],
        who: ['provider', 'admin']
      },
      [BookingStatus.CANCELLED]: {
        from: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        who: ['client', 'provider', 'admin']
      },
      [BookingStatus.NO_SHOW]: {
        from: [BookingStatus.CONFIRMED],
        who: ['provider', 'admin']
      },
      [BookingStatus.PENDING]: {
        from: [],
        who: []
      }
    };

    const transition = transitions[newStatus];
    if (!transition.from.includes(booking.status)) {
      return {
        allowed: false,
        reason: `No se puede cambiar de ${booking.status} a ${newStatus}`
      };
    }

    let userRole = '';
    if (isAdmin) userRole = 'admin';
    else if (isProvider) userRole = 'provider';
    else if (isClient) userRole = 'client';

    if (!transition.who.includes(userRole)) {
      return {
        allowed: false,
        reason: `No tiene permisos para realizar esta transición`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate business rules for state changes
   */
  private async validateBusinessRulesForStateChange(
    booking: any,
    newStatus: BookingStatus
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const now = new Date();

    switch (newStatus) {
      case BookingStatus.CONFIRMED:
        // Can't confirm past bookings
        if (booking.startTime <= now) {
          errors.push('No se puede confirmar una reserva que ya comenzó');
        }
        break;

      case BookingStatus.COMPLETED:
        // Can only complete bookings that have started
        if (booking.startTime > now) {
          errors.push('No se puede completar una reserva que no ha comenzado');
        }
        // Must be at least near the end time
        if (booking.endTime > new Date(now.getTime() + (30 * 60000))) { // 30 min buffer
          errors.push('Solo se puede completar cerca del horario de finalización');
        }
        break;

      case BookingStatus.CANCELLED:
        // Check cancellation policy (24 hours before)
        const hoursUntilBooking = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilBooking < 24 && booking.clientId) {
          errors.push('Las cancelaciones deben realizarse con al menos 24 horas de anticipación');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Advanced double-booking prevention with database-level locking
   */
  async createBookingWithLock(bookingData: {
    clientId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    notes?: string;
  }): Promise<{ success: boolean; booking?: Booking; errors?: BookingConflict[] }> {
    // Use database transaction to prevent race conditions
    return await this.db.$transaction(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: bookingData.serviceId }
      });

      if (!service) {
        throw new Error('Servicio no encontrado');
      }

      const endTime = new Date(bookingData.startTime.getTime() + (service.duration * 60000));

      // Lock the provider's schedule for this time slot
      await tx.$executeRaw`
        SELECT * FROM bookings 
        WHERE provider_id = ${bookingData.providerId}
          AND start_time < ${endTime}
          AND end_time > ${bookingData.startTime}
          AND status IN ('PENDING', 'CONFIRMED')
        FOR UPDATE
      `;

      // Re-validate after lock
      const validation = await this.validateBookingSlot(
        bookingData.providerId,
        bookingData.serviceId,
        bookingData.startTime,
        endTime
      );

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.conflicts
        };
      }

      // Create the booking
      const booking = await tx.booking.create({
        data: {
          clientId: bookingData.clientId,
          providerId: bookingData.providerId,
          serviceId: bookingData.serviceId,
          startTime: bookingData.startTime,
          endTime,
          totalAmount: service.price,
          notes: bookingData.notes,
          status: BookingStatus.PENDING
        },
        include: {
          client: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      // Schedule reminders for the new booking
      await reminderService.scheduleReminders(booking);

      return { success: true, booking };
    });
  }

  /**
   * Recurring appointment template support
   */
  async createRecurringBookings(data: {
    clientId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    recurringPattern: {
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      occurrences: number;
      endDate?: Date;
    };
    notes?: string;
  }): Promise<{ 
    success: boolean; 
    bookings: Booking[]; 
    failed: { date: Date; errors: BookingConflict[] }[] 
  }> {
    const bookings: Booking[] = [];
    const failed: { date: Date; errors: BookingConflict[] }[] = [];

    const service = await this.db.service.findUnique({
      where: { id: data.serviceId }
    });

    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    // Generate recurring dates
    const recurringDates = this.generateRecurringDates(
      data.startTime,
      data.recurringPattern
    );

    // Try to create each booking
    for (const date of recurringDates) {
      const result = await this.createBookingWithLock({
        clientId: data.clientId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        startTime: date,
        notes: data.notes
      });

      if (result.success && result.booking) {
        bookings.push(result.booking);
        // Schedule reminders for recurring bookings
        await reminderService.scheduleReminders(result.booking);
      } else {
        failed.push({
          date,
          errors: result.errors || []
        });
      }
    }

    return {
      success: bookings.length > 0,
      bookings,
      failed
    };
  }

  /**
   * Generate dates for recurring bookings
   */
  private generateRecurringDates(
    startDate: Date,
    pattern: {
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      occurrences: number;
      endDate?: Date;
    }
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < pattern.occurrences; i++) {
      if (pattern.endDate && currentDate > pattern.endDate) {
        break;
      }
      
      dates.push(new Date(currentDate));
      
      // Calculate next occurrence
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    
    return dates;
  }

  /**
   * Group session support and management
   */
  async createGroupBooking(data: {
    providerId: string;
    serviceId: string;
    startTime: Date;
    clientIds: string[];
    maxParticipants?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    bookings: Booking[];
    errors?: string[];
  }> {
    const errors: string[] = [];
    
    if (data.clientIds.length === 0) {
      errors.push('Al menos un cliente es requerido');
      return { success: false, bookings: [], errors };
    }

    if (data.maxParticipants && data.clientIds.length > data.maxParticipants) {
      errors.push(`Máximo ${data.maxParticipants} participantes permitidos`);
      return { success: false, bookings: [], errors };
    }

    // Create individual bookings for each participant
    const bookings: Booking[] = [];
    
    for (const clientId of data.clientIds) {
      const result = await this.createBookingWithLock({
        clientId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        notes: `Sesión grupal - ${data.notes || ''}`
      });

      if (result.success && result.booking) {
        bookings.push(result.booking);
        // Schedule reminders for group bookings
        await reminderService.scheduleReminders(result.booking);
      } else {
        errors.push(`Error creando reserva para cliente ${clientId}`);
      }
    }

    return {
      success: bookings.length > 0,
      bookings,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Waitlist management system
   */
  async addToWaitlist(data: {
    clientId: string;
    providerId: string;
    serviceId: string;
    preferredDate: Date;
    timeRange?: {
      startTime: string; // "09:00"
      endTime: string;   // "17:00"
    };
    notes?: string;
  }): Promise<{ success: boolean; waitlistEntry?: any; errors?: string[] }> {
    // Note: This would require a Waitlist model in Prisma schema
    // For now, we'll store in a simple JSON format or use Redis
    
    const waitlistEntry = {
      id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: data.clientId,
      providerId: data.providerId,
      serviceId: data.serviceId,
      preferredDate: data.preferredDate,
      timeRange: data.timeRange,
      notes: data.notes,
      status: 'WAITING',
      createdAt: new Date()
    };

    // TODO: Implement proper waitlist storage
    // For now, we'll return success
    
    return {
      success: true,
      waitlistEntry
    };
  }

  /**
   * Booking analytics and reporting foundation
   */
  async getBookingAnalytics(providerId: string, dateRange: {
    from: Date;
    to: Date;
  }): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    revenue: number;
    averageRating: number;
    popularServices: Array<{ serviceName: string; count: number }>;
    busyHours: Array<{ hour: number; count: number }>;
  }> {
    const bookings = await this.db.booking.findMany({
      where: {
        providerId,
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      },
      include: {
        service: true
      }
    });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
    const cancelledBookings = bookings.filter(b => b.status === BookingStatus.CANCELLED).length;
    const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED).length;
    
    const revenue = bookings
      .filter(b => b.status === BookingStatus.COMPLETED)
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    const ratingsSum = bookings
      .filter(b => b.clientRating)
      .reduce((sum, b) => sum + (b.clientRating || 0), 0);
    const ratingsCount = bookings.filter(b => b.clientRating).length;
    const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    // Popular services
    const serviceStats: Record<string, number> = {};
    bookings.forEach(b => {
      const serviceName = b.service.name;
      serviceStats[serviceName] = (serviceStats[serviceName] || 0) + 1;
    });
    const popularServices = Object.entries(serviceStats)
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Busy hours
    const hourStats: Record<number, number> = {};
    bookings.forEach(b => {
      const hour = b.startTime.getHours();
      hourStats[hour] = (hourStats[hour] || 0) + 1;
    });
    const busyHours = Object.entries(hourStats)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      revenue,
      averageRating,
      popularServices,
      busyHours
    };
  }
}

export const bookingService = new BookingService();