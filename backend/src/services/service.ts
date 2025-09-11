import { PrismaClient, Service, ServiceCategory, Prisma } from '@prisma/client';
import { database } from './database';

export class ServiceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = database.prisma;
  }

  // Create new service
  async createService(data: {
    name: string;
    description?: string;
    duration: number;
    price: number;
    providerId: string;
    categoryId?: string;
    depositRequired?: boolean;
    depositAmount?: number;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
    maxAdvanceBookingDays?: number;
    allowSameDayBooking?: boolean;
    requiresConsultation?: boolean;
    images?: string[];
    tags?: string[];
    sortOrder?: number;
  }): Promise<Service> {
    return await this.prisma.service.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
        depositAmount: data.depositAmount ? new Prisma.Decimal(data.depositAmount) : null
      },
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  // Get service by ID
  async getServiceById(id: string): Promise<Service | null> {
    return await this.prisma.service.findUnique({
      where: { id },
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
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'COMPLETED']
            }
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            clientRating: true,
            clientFeedback: true
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 5 // Last 5 bookings for reviews
        }
      }
    });
  }

  // Update service
  async updateService(id: string, data: Partial<{
    name: string;
    description: string;
    duration: number;
    price: number;
    categoryId: string;
    isActive: boolean;
    depositRequired: boolean;
    depositAmount: number;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    maxAdvanceBookingDays: number;
    allowSameDayBooking: boolean;
    requiresConsultation: boolean;
    images: string[];
    tags: string[];
    sortOrder: number;
  }>): Promise<Service> {
    const updateData: any = { ...data };
    
    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price);
    }
    
    if (data.depositAmount !== undefined) {
      updateData.depositAmount = data.depositAmount ? new Prisma.Decimal(data.depositAmount) : null;
    }

    return await this.prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  // List services with pagination and filters
  async listServices(options: {
    page?: number;
    limit?: number;
    providerId?: string;
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    province?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    services: Service[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      providerId,
      categoryId,
      isActive = true,
      search,
      minPrice,
      maxPrice,
      city,
      province,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ServiceWhereInput = {};
    
    if (providerId) where.providerId = providerId;
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    // Filter by location if provided
    if (city || province) {
      where.provider = {};
      if (city) where.provider.city = { contains: city, mode: 'insensitive' };
      if (province) where.provider.province = province;
    }

    // Get total count
    const total = await this.prisma.service.count({ where });

    // Get services
    const services = await this.prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                }
              }
            }
          }
        }
      }
    });

    return {
      services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get services by provider
  async getServicesByProvider(providerId: string, includeInactive = false): Promise<Service[]> {
    return await this.prisma.service.findMany({
      where: {
        providerId,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        category: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                }
              }
            }
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  // Get services by category
  async getServicesByCategory(categoryId: string, options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<{
    services: Service[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      isActive = true,
      minPrice,
      maxPrice
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ServiceWhereInput = {
      categoryId,
      isActive
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    // Get total count
    const total = await this.prisma.service.count({ where });

    // Get services
    const services = await this.prisma.service.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return {
      services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Delete service
  async deleteService(id: string): Promise<void> {
    // Check if service has active bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        serviceId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings > 0) {
      throw new Error('No se puede eliminar un servicio con reservas activas');
    }

    await this.prisma.service.delete({
      where: { id }
    });
  }

  // Deactivate service (soft delete)
  async deactivateService(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Reactivate service
  async reactivateService(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { isActive: true }
    });
  }

  // Get service statistics
  async getServiceStats(providerId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    averagePrice: number;
    mostBooked: Service[];
    recentlyAdded: Service[];
  }> {
    const where = providerId ? { providerId } : {};

    const [
      total,
      active,
      inactive,
      services,
      mostBookedServices
    ] = await Promise.all([
      this.prisma.service.count({ where }),
      this.prisma.service.count({ where: { ...where, isActive: true } }),
      this.prisma.service.count({ where: { ...where, isActive: false } }),
      this.prisma.service.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: {
                    in: ['CONFIRMED', 'COMPLETED']
                  }
                }
              }
            }
          }
        }
      }),
      this.prisma.service.findMany({
        where,
        include: {
          category: true,
          provider: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: {
                    in: ['CONFIRMED', 'COMPLETED']
                  }
                }
              }
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Calculate by category
    const byCategory: Record<string, number> = {};
    services.forEach(service => {
      const categoryName = service.category?.name || 'Sin categoría';
      byCategory[categoryName] = (byCategory[categoryName] || 0) + 1;
    });

    // Calculate average price
    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
    const averagePrice = services.length > 0 ? totalPrice / services.length : 0;

    // Get recently added services
    const recentlyAdded = await this.prisma.service.findMany({
      where,
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return {
      total,
      active,
      inactive,
      byCategory,
      averagePrice,
      mostBooked: mostBookedServices,
      recentlyAdded
    };
  }

  // Search services with advanced filters
  async searchServices(query: {
    search?: string;
    categoryIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    duration?: {
      min?: number;
      max?: number;
    };
    location?: {
      city?: string;
      province?: string;
      latitude?: number;
      longitude?: number;
      radius?: number; // in kilometers
    };
    availability?: {
      date?: Date;
      startTime?: string;
      endTime?: string;
    };
    page?: number;
    limit?: number;
    sortBy?: 'price' | 'duration' | 'rating' | 'distance' | 'popularity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    services: Service[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      categoryIds,
      minPrice,
      maxPrice,
      duration,
      location,
      page = 1,
      limit = 10,
      sortBy = 'popularity',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ServiceWhereInput = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { provider: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (categoryIds && categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    if (duration) {
      where.duration = {};
      if (duration.min !== undefined) where.duration.gte = duration.min;
      if (duration.max !== undefined) where.duration.lte = duration.max;
    }

    if (location) {
      where.provider = {};
      if (location.city) {
        where.provider.city = { contains: location.city, mode: 'insensitive' };
      }
      if (location.province) {
        where.provider.province = location.province;
      }
      // TODO: Add geolocation-based filtering for radius searches
    }

    // Get total count
    const total = await this.prisma.service.count({ where });

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'duration':
        orderBy = { duration: sortOrder };
        break;
      case 'rating':
        // This would require aggregating ratings from bookings
        orderBy = { createdAt: 'desc' }; // Fallback
        break;
      case 'distance':
        // This would require geolocation calculations
        orderBy = { createdAt: 'desc' }; // Fallback
        break;
      case 'popularity':
      default:
        orderBy = {
          bookings: {
            _count: sortOrder
          }
        };
        break;
    }

    // Get services
    const services = await this.prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                }
              }
            }
          }
        }
      }
    });

    return {
      services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ===== NEW METHODS FOR B3-001 REQUIREMENTS =====

  // Service approval/verification system
  async approveService(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { 
        isActive: true,
        // Add approved flag or status field when schema is updated
      }
    });
  }

  // Service rejection
  async rejectService(id: string, reason: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { 
        isActive: false,
        // Store rejection reason in a notes field or create audit log
      }
    });
    // TODO: Send notification to provider about rejection
  }

  // Update service availability
  async updateServiceAvailability(id: string, availabilityData: any, userId: string): Promise<void> {
    // Verify user owns this service (for providers)
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { provider: true }
    });

    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    // Update service availability settings
    await this.prisma.service.update({
      where: { id },
      data: {
        bufferTimeBefore: availabilityData.bufferTimeBefore,
        bufferTimeAfter: availabilityData.bufferTimeAfter,
        maxAdvanceBookingDays: availabilityData.maxAdvanceBookingDays,
        allowSameDayBooking: availabilityData.allowSameDayBooking
      }
    });

    // Update provider working hours if provided
    if (availabilityData.workingHours) {
      await this.prisma.provider.update({
        where: { id: service.providerId },
        data: {
          workingHours: availabilityData.workingHours
        }
      });
    }
  }

  // Update service pricing
  async updateServicePricing(id: string, pricingData: any, userId: string): Promise<void> {
    const updateData: any = {};

    if (pricingData.price !== undefined) {
      updateData.price = new Prisma.Decimal(pricingData.price);
    }

    if (pricingData.depositRequired !== undefined) {
      updateData.depositRequired = pricingData.depositRequired;
    }

    if (pricingData.depositAmount !== undefined) {
      updateData.depositAmount = pricingData.depositAmount ? 
        new Prisma.Decimal(pricingData.depositAmount) : null;
    }

    await this.prisma.service.update({
      where: { id },
      data: updateData
    });

    // TODO: Store discount information in a separate discounts table
    // For now, we'll just update the basic pricing
  }

  // Bulk activate services
  async bulkActivateServices(serviceIds: string[]): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const serviceId of serviceIds) {
      try {
        await this.prisma.service.update({
          where: { id: serviceId },
          data: { isActive: true }
        });
        updated++;
      } catch (error) {
        failed.push(serviceId);
      }
    }

    return { updated, failed };
  }

  // Get service analytics
  async getServiceAnalytics(serviceId: string, options: any, userId: string): Promise<any> {
    const { period = 'month', fromDate, toDate } = options;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    if (fromDate) {
      startDate = new Date(fromDate);
    } else {
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const endDate = toDate ? new Date(toDate) : now;

    // Get booking analytics for the service
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageRating,
      bookingsByDay
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          serviceId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.booking.count({
        where: {
          serviceId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.booking.count({
        where: {
          serviceId,
          status: 'CANCELLED',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.booking.aggregate({
        where: {
          serviceId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: {
          totalAmount: true
        }
      }),
      this.prisma.booking.aggregate({
        where: {
          serviceId,
          status: 'COMPLETED',
          clientRating: { not: null },
          createdAt: { gte: startDate, lte: endDate }
        },
        _avg: {
          clientRating: true
        }
      }),
      this.prisma.booking.groupBy({
        by: ['createdAt'],
        where: {
          serviceId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: {
          id: true
        }
      })
    ]);

    return {
      period,
      dateRange: { from: startDate, to: endDate },
      metrics: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        averageRating: Number(averageRating._avg.clientRating || 0),
        averageRevenuePerBooking: completedBookings > 0 ? 
          Number(totalRevenue._sum.totalAmount || 0) / completedBookings : 0
      },
      trends: {
        bookingsByDay: bookingsByDay.map(day => ({
          date: day.createdAt,
          count: day._count.id
        }))
      }
    };
  }

  // Advanced service search with all filters
  async advancedServiceSearch(query: any): Promise<any> {
    const {
      q,
      categoryId,
      city,
      province,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      rating,
      availableToday,
      availableDate,
      tags,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      latitude,
      longitude,
      radius = 10
    } = query;

    const skip = (page - 1) * limit;

    // Build comprehensive where clause
    const where: Prisma.ServiceWhereInput = {
      isActive: true
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
        { provider: { businessName: { contains: q, mode: 'insensitive' } } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    if (minDuration !== undefined || maxDuration !== undefined) {
      where.duration = {};
      if (minDuration !== undefined) where.duration.gte = minDuration;
      if (maxDuration !== undefined) where.duration.lte = maxDuration;
    }

    if (city || province) {
      where.provider = {};
      if (city) where.provider.city = { contains: city, mode: 'insensitive' };
      if (province) where.provider.province = province;
    }

    if (tags) {
      const tagArray = tags.split(',').map((tag: string) => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Get total count
    const total = await this.prisma.service.count({ where });

    // Build dynamic order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'rating':
        // For rating, we'd need to join with booking ratings
        orderBy = { createdAt: 'desc' };
        break;
      case 'duration':
        orderBy = { duration: sortOrder };
        break;
      case 'distance':
        // Distance sorting would require geo calculations
        orderBy = { createdAt: 'desc' };
        break;
      case 'popularity':
      default:
        orderBy = {
          bookings: {
            _count: sortOrder
          }
        };
        break;
    }

    // Get services with comprehensive data
    const services = await this.prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                }
              }
            }
          }
        }
      }
    });

    // Calculate average rating for each service
    const servicesWithRating = await Promise.all(
      services.map(async (service) => {
        const ratingData = await this.prisma.booking.aggregate({
          where: {
            serviceId: service.id,
            status: 'COMPLETED',
            clientRating: { not: null }
          },
          _avg: {
            clientRating: true
          },
          _count: {
            clientRating: true
          }
        });

        return {
          ...service,
          rating: {
            average: Number(ratingData._avg.clientRating || 0),
            count: ratingData._count.clientRating
          },
          bookingCount: service._count.bookings
        };
      })
    );

    return {
      services: servicesWithRating,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        categories: await this.getAvailableCategories(),
        priceRange: await this.getPriceRange(),
        durationRange: await this.getDurationRange()
      }
    };
  }

  // Get popular services
  async getPopularServices(options: any): Promise<any> {
    const { categoryId, city, province, limit = 10, period = 'month' } = options;

    // Calculate date range for popularity
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const where: Prisma.ServiceWhereInput = {
      isActive: true
    };

    if (categoryId) where.categoryId = categoryId;
    if (city || province) {
      where.provider = {};
      if (city) where.provider.city = { contains: city, mode: 'insensitive' };
      if (province) where.provider.province = province;
    }

    const services = await this.prisma.service.findMany({
      where,
      take: limit,
      include: {
        category: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                },
                createdAt: {
                  gte: startDate
                }
              }
            }
          }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      }
    });

    return services.map(service => ({
      ...service,
      recentBookings: service._count.bookings
    }));
  }

  // Helper methods for search filters
  private async getAvailableCategories(): Promise<any[]> {
    return await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            services: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  private async getPriceRange(): Promise<{ min: number; max: number }> {
    const result = await this.prisma.service.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true }
    });

    return {
      min: Number(result._min.price || 0),
      max: Number(result._max.price || 0)
    };
  }

  private async getDurationRange(): Promise<{ min: number; max: number }> {
    const result = await this.prisma.service.aggregate({
      where: { isActive: true },
      _min: { duration: true },
      _max: { duration: true }
    });

    return {
      min: result._min.duration || 0,
      max: result._max.duration || 0
    };
  }
}

// Service Category Service
export class ServiceCategoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = database.prisma;
  }

  // Create service category
  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
  }): Promise<ServiceCategory> {
    return await this.prisma.serviceCategory.create({
      data
    });
  }

  // Get all categories
  async getAllCategories(includeInactive = false): Promise<ServiceCategory[]> {
    return await this.prisma.serviceCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: {
            services: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<ServiceCategory | null> {
    return await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          where: {
            isActive: true
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            services: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });
  }

  // Update category
  async updateCategory(id: string, data: Partial<{
    name: string;
    description: string;
    icon: string;
    sortOrder: number;
    isActive: boolean;
  }>): Promise<ServiceCategory> {
    return await this.prisma.serviceCategory.update({
      where: { id },
      data
    });
  }

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    // Check if category has services
    const servicesCount = await this.prisma.service.count({
      where: { categoryId: id }
    });

    if (servicesCount > 0) {
      throw new Error('No se puede eliminar una categoría que tiene servicios asociados');
    }

    await this.prisma.serviceCategory.delete({
      where: { id }
    });
  }
}

// Export singleton instances
export const serviceService = new ServiceService();
export const serviceCategoryService = new ServiceCategoryService();