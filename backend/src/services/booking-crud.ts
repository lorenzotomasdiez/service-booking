import { PrismaClient, Booking, BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { database } from './database';

export class BookingCrudService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = database.prisma;
  }

  // Create new booking
  async createBooking(data: {
    clientId: string;
    serviceId: string;
    providerId: string;
    startTime: Date;
    endTime: Date;
    totalAmount: number;
    notes?: string;
    clientNotes?: string;
  }): Promise<Booking> {
    // Check for booking conflicts
    const conflictingBookings = await this.checkBookingConflicts(
      data.providerId,
      data.startTime,
      data.endTime
    );

    if (conflictingBookings.length > 0) {
      throw new Error('El horario seleccionado no está disponible');
    }

    // Validate that the service belongs to the provider
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { provider: true }
    });

    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    if (service.providerId !== data.providerId) {
      throw new Error('El servicio no pertenece al proveedor especificado');
    }

    if (!service.isActive) {
      throw new Error('El servicio no está disponible');
    }

    // Check if same-day booking is allowed
    if (!service.allowSameDayBooking) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (data.startTime <= today) {
        throw new Error('Este servicio no permite reservas para el mismo día');
      }
    }

    // Check advance booking limit
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + service.maxAdvanceBookingDays);
    if (data.startTime > maxDate) {
      throw new Error(`No se pueden hacer reservas con más de ${service.maxAdvanceBookingDays} días de anticipación`);
    }

    return await this.prisma.booking.create({
      data: {
        ...data,
        totalAmount: new Prisma.Decimal(data.totalAmount),
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          include: {
            category: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });
  }

  // Get booking by ID
  async getBookingById(id: string): Promise<Booking | null> {
    return await this.prisma.booking.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        service: {
          include: {
            category: true,
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payment: true
      }
    });
  }

  // Update booking
  async updateBooking(id: string, data: Partial<{
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    notes: string;
    clientNotes: string;
    internalNotes: string;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    paymentId: string;
    clientRating: number;
    clientFeedback: string;
    providerFeedback: string;
  }>): Promise<Booking> {
    // If updating time, check for conflicts
    if (data.startTime || data.endTime) {
      const existingBooking = await this.prisma.booking.findUnique({
        where: { id }
      });

      if (!existingBooking) {
        throw new Error('Reserva no encontrada');
      }

      const startTime = data.startTime || existingBooking.startTime;
      const endTime = data.endTime || existingBooking.endTime;

      const conflictingBookings = await this.checkBookingConflicts(
        existingBooking.providerId,
        startTime,
        endTime,
        id // Exclude current booking from conflict check
      );

      if (conflictingBookings.length > 0) {
        throw new Error('El nuevo horario no está disponible');
      }
    }

    const updateData: any = { ...data };
    
    // Handle status changes
    if (data.status) {
      switch (data.status) {
        case BookingStatus.CONFIRMED:
          updateData.confirmedAt = new Date();
          break;
        case BookingStatus.COMPLETED:
          updateData.completedAt = new Date();
          break;
        case BookingStatus.CANCELLED:
          updateData.cancelledAt = new Date();
          break;
      }
    }

    return await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          include: {
            category: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payment: true
      }
    });
  }

  // List bookings with pagination and filters
  async listBookings(options: {
    page?: number;
    limit?: number;
    clientId?: string;
    providerId?: string;
    serviceId?: string;
    status?: BookingStatus[];
    paymentStatus?: PaymentStatus[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      clientId,
      providerId,
      serviceId,
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BookingWhereInput = {};
    
    if (clientId) where.clientId = clientId;
    if (providerId) where.providerId = providerId;
    if (serviceId) where.serviceId = serviceId;
    if (status && status.length > 0) where.status = { in: status };
    if (paymentStatus && paymentStatus.length > 0) where.paymentStatus = { in: paymentStatus };
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { clientNotes: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } },
        { service: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count
    const total = await this.prisma.booking.count({ where });

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        service: {
          include: {
            category: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payment: true
      }
    });

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get bookings by client
  async getBookingsByClient(clientId: string, options: {
    page?: number;
    limit?: number;
    status?: BookingStatus[];
    upcoming?: boolean;
  } = {}): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      upcoming = false
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BookingWhereInput = {
      clientId
    };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (upcoming) {
      where.startTime = { gte: new Date() };
    }

    // Get total count
    const total = await this.prisma.booking.count({ where });

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: upcoming ? 'asc' : 'desc' },
      include: {
        service: {
          include: {
            category: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payment: true
      }
    });

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get bookings by provider
  async getBookingsByProvider(providerId: string, options: {
    page?: number;
    limit?: number;
    date?: Date;
    status?: BookingStatus[];
  } = {}): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      date,
      status
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BookingWhereInput = {
      providerId
    };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // Get total count
    const total = await this.prisma.booking.count({ where });

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        service: {
          include: {
            category: true
          }
        },
        payment: true
      }
    });

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Cancel booking
  async cancelBooking(id: string, cancelledBy: string, cancelReason?: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new Error('Reserva no encontrada');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('La reserva ya está cancelada');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error('No se puede cancelar una reserva completada');
    }

    // Check cancellation timing (e.g., must cancel at least 2 hours before)
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    if (booking.startTime <= twoHoursFromNow) {
      throw new Error('No se puede cancelar una reserva con menos de 2 horas de anticipación');
    }

    return await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledBy,
        cancelReason,
        cancelledAt: new Date()
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          include: {
            category: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });
  }

  // Check booking conflicts
  async checkBookingConflicts(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<Booking[]> {
    const where: Prisma.BookingWhereInput = {
      providerId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
      },
      OR: [
        {
          startTime: {
            lt: endTime
          },
          endTime: {
            gt: startTime
          }
        }
      ]
    };

    if (excludeBookingId) {
      where.NOT = { id: excludeBookingId };
    }

    return await this.prisma.booking.findMany({
      where,
      include: {
        service: true
      }
    });
  }

  // Get available time slots for a provider on a specific date
  async getAvailableTimeSlots(
    providerId: string,
    serviceId: string,
    date: Date
  ): Promise<{
    slots: Array<{ startTime: Date; endTime: Date }>;
    workingHours: any;
  }> {
    // Get provider and service details
    const [provider, service] = await Promise.all([
      this.prisma.provider.findUnique({
        where: { id: providerId }
      }),
      this.prisma.service.findUnique({
        where: { id: serviceId }
      })
    ]);

    if (!provider || !service) {
      throw new Error('Proveedor o servicio no encontrado');
    }

    // Get working hours for the specific day
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const workingHours = provider.workingHours as any;
    const daySchedule = workingHours?.[dayName];

    if (!daySchedule || !daySchedule.isOpen) {
      return { slots: [], workingHours: daySchedule };
    }

    // Get existing bookings for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        },
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Calculate available slots
    const slots: Array<{ startTime: Date; endTime: Date }> = [];
    const serviceDuration = service.duration + service.bufferTimeBefore + service.bufferTimeAfter;

    // Parse working hours
    const [openHour, openMinute] = daySchedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = daySchedule.close.split(':').map(Number);

    const workStart = new Date(date);
    workStart.setHours(openHour, openMinute, 0, 0);
    const workEnd = new Date(date);
    workEnd.setHours(closeHour, closeMinute, 0, 0);

    let currentTime = new Date(workStart);

    // Generate time slots
    while (currentTime < workEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      if (slotEnd > workEnd) break;

      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        return (
          currentTime < booking.endTime &&
          slotEnd > booking.startTime
        );
      });

      if (!hasConflict) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd)
        });
      }

      // Move to next slot (every 15 minutes)
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return { slots, workingHours: daySchedule };
  }

  // Get booking statistics
  async getBookingStats(providerId?: string): Promise<{
    total: number;
    byStatus: Record<BookingStatus, number>;
    byPaymentStatus: Record<PaymentStatus, number>;
    revenue: {
      total: number;
      thisMonth: number;
      thisWeek: number;
    };
    upcomingBookings: number;
    averageRating: number;
    completionRate: number;
  }> {
    const where = providerId ? { providerId } : {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      noShow,
      paymentPending,
      paymentPaid,
      paymentFailed,
      paymentRefunded,
      paymentCancelled,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      upcomingBookings,
      ratedBookings
    ] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { ...where, status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { ...where, status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { ...where, status: BookingStatus.CANCELLED } }),
      this.prisma.booking.count({ where: { ...where, status: BookingStatus.NO_SHOW } }),
      this.prisma.booking.count({ where: { ...where, paymentStatus: PaymentStatus.PENDING } }),
      this.prisma.booking.count({ where: { ...where, paymentStatus: PaymentStatus.PAID } }),
      this.prisma.booking.count({ where: { ...where, paymentStatus: PaymentStatus.FAILED } }),
      this.prisma.booking.count({ where: { ...where, paymentStatus: PaymentStatus.REFUNDED } }),
      this.prisma.booking.count({ where: { ...where, paymentStatus: PaymentStatus.CANCELLED } }),
      this.prisma.booking.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.PAID },
        _sum: { totalAmount: true }
      }),
      this.prisma.booking.aggregate({
        where: { 
          ...where, 
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: startOfMonth }
        },
        _sum: { totalAmount: true }
      }),
      this.prisma.booking.aggregate({
        where: { 
          ...where, 
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: startOfWeek }
        },
        _sum: { totalAmount: true }
      }),
      this.prisma.booking.count({
        where: {
          ...where,
          startTime: { gte: now },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
        }
      }),
      this.prisma.booking.aggregate({
        where: {
          ...where,
          status: BookingStatus.COMPLETED,
          clientRating: { not: null }
        },
        _avg: { clientRating: true },
        _count: { clientRating: true }
      })
    ]);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const averageRating = ratedBookings._avg.clientRating || 0;

    return {
      total,
      byStatus: {
        [BookingStatus.PENDING]: pending,
        [BookingStatus.CONFIRMED]: confirmed,
        [BookingStatus.COMPLETED]: completed,
        [BookingStatus.CANCELLED]: cancelled,
        [BookingStatus.NO_SHOW]: noShow
      },
      byPaymentStatus: {
        [PaymentStatus.PENDING]: paymentPending,
        [PaymentStatus.PAID]: paymentPaid,
        [PaymentStatus.FAILED]: paymentFailed,
        [PaymentStatus.REFUNDED]: paymentRefunded,
        [PaymentStatus.CANCELLED]: paymentCancelled
      },
      revenue: {
        total: Number(totalRevenue._sum.totalAmount || 0),
        thisMonth: Number(monthlyRevenue._sum.totalAmount || 0),
        thisWeek: Number(weeklyRevenue._sum.totalAmount || 0)
      },
      upcomingBookings,
      averageRating,
      completionRate
    };
  }

  // Delete booking (soft delete - change status to cancelled)
  async deleteBooking(id: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new Error('Reserva no encontrada');
    }

    // Only allow deletion of pending bookings or in specific circumstances
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CANCELLED) {
      throw new Error('Solo se pueden eliminar reservas pendientes o canceladas');
    }

    // For now, we'll just cancel the booking instead of hard delete
    await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: 'Eliminada por el sistema'
      }
    });
  }
}

// Export singleton instance
export const bookingCrudService = new BookingCrudService();