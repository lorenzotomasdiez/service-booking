import { PrismaClient } from '@prisma/client';
import { 
  ProviderAnalyticsResponse,
  EarningsReportResponse,
  ClientManagementResponse,
  CreateClientNoteRequest,
  ClientNoteResponse,
  PerformanceMetrics,
  BusinessInsights
} from '../types/analytics';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate comprehensive provider analytics
   */
  async getProviderAnalytics(
    providerId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderAnalyticsResponse> {
    // Get all bookings for the period
    const bookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        startTime: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        service: true,
        client: true,
        payment: true
      }
    });

    // Calculate summary metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const noShowBookings = bookings.filter(b => b.status === 'NO_SHOW').length;

    const totalRevenue = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    const platformFeeRate = 0.1; // 10% platform fee
    const platformFee = totalRevenue * platformFeeRate;
    const netRevenue = totalRevenue - platformFee;

    // Client metrics
    const uniqueClients = new Set(bookings.map(b => b.clientId));
    const newClients = await this.calculateNewClients(providerId, fromDate, toDate);
    const returningClients = uniqueClients.size - newClients;

    // Average rating
    const ratingsSum = bookings
      .filter(b => b.clientRating)
      .reduce((sum, b) => sum + (b.clientRating || 0), 0);
    const ratingsCount = bookings.filter(b => b.clientRating).length;
    const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    // Utilization rate (simplified calculation)
    const workingDays = this.getWorkingDays(fromDate, toDate);
    const workingHoursPerDay = 8; // Assume 8 working hours per day
    const totalWorkingHours = workingDays * workingHoursPerDay;
    const bookedHours = bookings.reduce((sum, b) => sum + (b.service.duration / 60), 0);
    const utilizationRate = totalWorkingHours > 0 ? (bookedHours / totalWorkingHours) * 100 : 0;

    // Daily metrics
    const dailyMetrics = await this.calculateDailyMetrics(providerId, fromDate, toDate);

    // Service performance
    const servicePerformance = await this.calculateServicePerformance(providerId, fromDate, toDate);

    // Client insights
    const clientInsights = await this.calculateClientInsights(providerId, fromDate, toDate);

    // Time analysis
    const timeAnalysis = await this.calculateTimeAnalysis(providerId, fromDate, toDate);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(providerId, {
      totalBookings,
      completedBookings,
      cancelledBookings,
      utilizationRate,
      averageRating
    });

    return {
      providerId,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      summary: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        totalRevenue,
        netRevenue,
        platformFee,
        newClients,
        returningClients,
        averageRating,
        utilizationRate
      },
      dailyMetrics,
      servicePerformance,
      clientInsights,
      timeAnalysis,
      recommendations
    };
  }

  /**
   * Generate detailed earnings report
   */
  async getEarningsReport(
    providerId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<EarningsReportResponse> {
    const payments = await this.prisma.payment.findMany({
      where: {
        booking: {
          providerId,
          startTime: {
            gte: fromDate,
            lte: toDate
          },
          status: 'COMPLETED'
        },
        status: 'PAID'
      },
      include: {
        booking: {
          include: {
            service: true
          }
        }
      }
    });

    const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformFeeRate = 0.1;
    const platformFee = totalEarnings * platformFeeRate;
    const netEarnings = totalEarnings - platformFee;

    // Payout status (simplified)
    const payoutStatus = {
      pending: netEarnings * 0.2, // 20% pending
      paid: netEarnings * 0.7,    // 70% paid
      scheduled: netEarnings * 0.1 // 10% scheduled
    };

    // Breakdown by service
    const serviceBreakdown = new Map<string, { revenue: number; bookings: number; serviceName: string }>();
    payments.forEach(payment => {
      const service = payment.booking.service;
      const existing = serviceBreakdown.get(service.id) || { revenue: 0, bookings: 0, serviceName: service.name };
      existing.revenue += Number(payment.amount);
      existing.bookings += 1;
      serviceBreakdown.set(service.id, existing);
    });

    const byService = Array.from(serviceBreakdown.entries()).map(([serviceId, data]) => ({
      serviceId,
      serviceName: data.serviceName,
      revenue: data.revenue,
      bookings: data.bookings,
      averagePrice: data.revenue / data.bookings
    }));

    // Breakdown by payment method
    const paymentMethodBreakdown = new Map<string, number>();
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      paymentMethodBreakdown.set(method, (paymentMethodBreakdown.get(method) || 0) + Number(payment.amount));
    });

    const byPaymentMethod = Array.from(paymentMethodBreakdown.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: (amount / totalEarnings) * 100
    }));

    // Daily breakdown
    const dailyBreakdown = await this.calculateDailyEarnings(providerId, fromDate, toDate);

    // Trends and comparison
    const previousPeriod = await this.calculatePreviousPeriodComparison(providerId, fromDate, toDate);
    const revenueGrowth = previousPeriod.revenue > 0 ? ((totalEarnings - previousPeriod.revenue) / previousPeriod.revenue) * 100 : 0;
    const bookingGrowth = previousPeriod.bookings > 0 ? ((payments.length - previousPeriod.bookings) / previousPeriod.bookings) * 100 : 0;

    return {
      providerId,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      totalEarnings,
      netEarnings,
      platformFee,
      platformFeePercentage: platformFeeRate * 100,
      payoutStatus,
      breakdown: {
        byService,
        byPaymentMethod,
        byDate: dailyBreakdown
      },
      trends: {
        revenueGrowth,
        bookingGrowth,
        averageBookingValue: payments.length > 0 ? totalEarnings / payments.length : 0,
        previousPeriodComparison: previousPeriod
      }
    };
  }

  /**
   * Get client management data
   */
  async getClientManagement(
    providerId: string,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<ClientManagementResponse> {
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      bookings: {
        some: {
          providerId
        }
      }
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [clients, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          clientBookings: {
            where: { providerId },
            include: {
              service: true,
              payment: true
            },
            orderBy: { startTime: 'desc' }
          },
          clientNotes: {
            where: { providerId },
            orderBy: { createdAt: 'desc' }
          },
          loyaltyPoints: {
            where: { providerId }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    const formattedClients = clients.map(client => {
      const bookings = client.clientBookings;
      const totalSpent = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      const ratings = bookings
        .filter(b => b.clientRating)
        .map(b => b.clientRating!);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : undefined;

      const lastBooking = bookings.length > 0 ? bookings[0].startTime.toISOString() : undefined;

      const serviceFrequency = new Map<string, number>();
      bookings.forEach(booking => {
        const serviceId = booking.serviceId;
        serviceFrequency.set(serviceId, (serviceFrequency.get(serviceId) || 0) + 1);
      });

      const preferredServices = Array.from(serviceFrequency.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([serviceId]) => serviceId);

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        avatar: client.avatar,
        totalBookings: bookings.length,
        totalSpent,
        lastBooking,
        averageRating,
        loyaltyPoints: client.loyaltyPoints[0]?.points || 0,
        tags: [], // Can be derived from client notes
        notes: client.clientNotes.map(note => ({
          id: note.id,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          isPrivate: note.isPrivate,
          tags: note.tags
        })),
        bookingHistory: bookings.slice(0, 10).map(booking => ({
          id: booking.id,
          serviceName: booking.service.name,
          date: booking.startTime.toISOString(),
          status: booking.status,
          amount: Number(booking.totalAmount),
          rating: booking.clientRating
        })),
        preferences: {
          preferredServices,
          preferredTimes: [], // Can be calculated from booking patterns
          communicationMethod: 'EMAIL' as const // Default or from user preferences
        }
      };
    });

    return {
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a client note
   */
  async createClientNote(
    providerId: string,
    data: CreateClientNoteRequest
  ): Promise<ClientNoteResponse> {
    const note = await this.prisma.clientNote.create({
      data: {
        providerId,
        clientId: data.clientId,
        content: data.content,
        isPrivate: data.isPrivate ?? true,
        tags: data.tags || []
      },
      include: {
        client: {
          select: { name: true, email: true }
        }
      }
    });

    return {
      id: note.id,
      providerId: note.providerId,
      clientId: note.clientId,
      content: note.content,
      isPrivate: note.isPrivate,
      tags: note.tags,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      client: {
        name: note.client.name,
        email: note.client.email
      }
    };
  }

  /**
   * Update daily analytics (should be run daily via cron)
   */
  async updateDailyAnalytics(providerId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        service: true,
        client: true
      }
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const noShowBookings = bookings.filter(b => b.status === 'NO_SHOW').length;

    const totalRevenue = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    const platformFeeRate = 0.1;
    const platformFee = totalRevenue * platformFeeRate;
    const netRevenue = totalRevenue - platformFee;

    // Calculate new vs returning clients
    const clientIds = bookings.map(b => b.clientId);
    const uniqueClientIds = [...new Set(clientIds)];
    
    let newClients = 0;
    for (const clientId of uniqueClientIds) {
      const previousBookings = await this.prisma.booking.count({
        where: {
          providerId,
          clientId,
          startTime: { lt: startOfDay }
        }
      });
      if (previousBookings === 0) {
        newClients++;
      }
    }

    const returningClients = uniqueClientIds.length - newClients;

    // Service metrics
    const serviceMetrics: any = {};
    bookings.forEach(booking => {
      if (!serviceMetrics[booking.serviceId]) {
        serviceMetrics[booking.serviceId] = { bookings: 0, revenue: 0 };
      }
      serviceMetrics[booking.serviceId].bookings++;
      if (booking.status === 'COMPLETED') {
        serviceMetrics[booking.serviceId].revenue += Number(booking.totalAmount);
      }
    });

    // Calculate utilization rate
    const workingHours = 8; // Assume 8 working hours
    const bookedTime = bookings.reduce((sum, b) => sum + b.service.duration, 0) / 60; // Convert to hours
    const utilizationRate = workingHours > 0 ? (bookedTime / workingHours) * 100 : 0;

    // Upsert analytics record
    await this.prisma.providerAnalytics.upsert({
      where: {
        providerId_date: {
          providerId,
          date: startOfDay
        }
      },
      update: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        totalRevenue,
        platformFee,
        netRevenue,
        newClients,
        returningClients,
        serviceMetrics,
        utilizationRate
      },
      create: {
        providerId,
        date: startOfDay,
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        totalRevenue,
        platformFee,
        netRevenue,
        newClients,
        returningClients,
        serviceMetrics,
        utilizationRate
      }
    });
  }

  // Private helper methods

  private async calculateNewClients(providerId: string, fromDate: Date, toDate: Date): Promise<number> {
    const newClientBookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        startTime: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        client: {
          include: {
            clientBookings: {
              where: { providerId }
            }
          }
        }
      }
    });

    const newClients = new Set<string>();
    for (const booking of newClientBookings) {
      const firstBooking = booking.client.clientBookings
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
      
      if (firstBooking && firstBooking.startTime >= fromDate && firstBooking.startTime <= toDate) {
        newClients.add(booking.clientId);
      }
    }

    return newClients.size;
  }

  private getWorkingDays(fromDate: Date, toDate: Date): number {
    let count = 0;
    const current = new Date(fromDate);
    
    while (current <= toDate) {
      const dayOfWeek = current.getDay();
      // Assume Monday-Saturday are working days (1-6)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  private async calculateDailyMetrics(providerId: string, fromDate: Date, toDate: Date) {
    const analytics = await this.prisma.providerAnalytics.findMany({
      where: {
        providerId,
        date: {
          gte: fromDate,
          lte: toDate
        }
      },
      orderBy: { date: 'asc' }
    });

    return analytics.map(a => ({
      date: a.date.toISOString().split('T')[0],
      bookings: a.totalBookings,
      revenue: Number(a.totalRevenue),
      clients: a.newClients + a.returningClients,
      utilizationRate: Number(a.utilizationRate || 0)
    }));
  }

  private async calculateServicePerformance(providerId: string, fromDate: Date, toDate: Date) {
    const services = await this.prisma.service.findMany({
      where: { providerId },
      include: {
        bookings: {
          where: {
            startTime: {
              gte: fromDate,
              lte: toDate
            }
          }
        }
      }
    });

    const totalBookings = services.reduce((sum, s) => sum + s.bookings.length, 0);

    return services.map(service => {
      const bookings = service.bookings;
      const revenue = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      const ratings = bookings
        .filter(b => b.clientRating)
        .map(b => b.clientRating!);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

      const popularity = totalBookings > 0 ? (bookings.length / totalBookings) * 100 : 0;

      return {
        serviceId: service.id,
        serviceName: service.name,
        bookings: bookings.length,
        revenue,
        averageRating,
        popularity
      };
    });
  }

  private async calculateClientInsights(providerId: string, fromDate: Date, toDate: Date) {
    // This would involve complex queries - simplified for now
    return {
      topClients: [],
      clientRetentionRate: 75, // Placeholder
      averageBookingsPerClient: 2.5 // Placeholder
    };
  }

  private async calculateTimeAnalysis(providerId: string, fromDate: Date, toDate: Date) {
    // This would involve analyzing booking times - simplified for now
    return {
      busyHours: [],
      busyDays: []
    };
  }

  private async generateRecommendations(providerId: string, metrics: any) {
    const recommendations = [];

    if (metrics.utilizationRate < 60) {
      recommendations.push({
        type: 'SCHEDULING' as const,
        title: 'Optimizar horarios',
        description: 'Tu tasa de utilización es baja. Considera ajustar tus horarios disponibles.',
        impact: 'HIGH' as const,
        actionRequired: true
      });
    }

    if (metrics.cancelledBookings / metrics.totalBookings > 0.15) {
      recommendations.push({
        type: 'SERVICE_OPTIMIZATION' as const,
        title: 'Reducir cancelaciones',
        description: 'Alta tasa de cancelaciones. Implementa recordatorios automáticos.',
        impact: 'MEDIUM' as const,
        actionRequired: true
      });
    }

    return recommendations;
  }

  private async calculateDailyEarnings(providerId: string, fromDate: Date, toDate: Date) {
    // Simplified - would use analytics table in production
    return [];
  }

  private async calculatePreviousPeriodComparison(providerId: string, fromDate: Date, toDate: Date) {
    // Simplified - calculate previous period metrics
    return {
      revenue: 0,
      bookings: 0,
      clients: 0
    };
  }
}