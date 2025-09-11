import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../services/database';
import {
  CreateBookingSchema,
  UpdateBookingSchema,
  GetBookingSchema,
  BookingStatusUpdateSchema,
  BookingCancellationSchema,
  BookingListSchema,
  BookingConflictCheckSchema,
  BookingFeedbackSchema,
  BookingResponse,
  BookingListResponse,
  BookingConflictResponse,
  BookingStatsResponse
} from '../schemas/bookings';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: any;
  }
}

// Helper function to check booking conflicts
const checkBookingConflicts = async (
  prisma: PrismaClient,
  providerId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
) => {
  const conflictWhere: any = {
    providerId,
    status: { in: ['CONFIRMED', 'PENDING'] },
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
  };

  if (excludeBookingId) {
    conflictWhere.id = { not: excludeBookingId };
  }

  return await prisma.booking.findMany({
    where: conflictWhere,
    include: {
      service: { select: { name: true } }
    }
  });
};

// Helper function to suggest alternative time slots
const suggestAlternativeSlots = async (
  prisma: PrismaClient,
  providerId: string,
  startTime: Date,
  duration: number
) => {
  const suggestions = [];
  const baseDate = new Date(startTime);
  baseDate.setHours(0, 0, 0, 0);

  // Check slots for the same day
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotStart = new Date(baseDate);
      slotStart.setHours(hour, minute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + duration);

      if (slotStart < new Date()) continue; // Skip past slots

      const conflicts = await checkBookingConflicts(prisma, providerId, slotStart, slotEnd);
      
      suggestions.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: conflicts.length === 0
      });

      if (suggestions.length >= 10) break;
    }
    if (suggestions.length >= 10) break;
  }

  return suggestions;
};

export default async function bookingsRoutes(fastify: FastifyInstance) {
  
  // GET /api/bookings/conflicts/check - Check booking conflicts
  fastify.get('/conflicts/check', {
    schema: {
      tags: ['Bookings'],
      summary: 'Check booking conflicts',
      description: 'Check for booking conflicts and suggest alternative times',
      ...BookingConflictCheckSchema,
      response: {
        200: BookingConflictResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      providerId: string;
      startTime: string;
      duration: number;
      excludeBookingId?: string;
    }
  }>, reply: FastifyReply) => {
    const { providerId, startTime, duration, excludeBookingId } = request.query;
    
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + duration);

    const conflicts = await checkBookingConflicts(
      prisma,
      providerId,
      startDateTime,
      endDateTime,
      excludeBookingId
    );

    const suggestedSlots = conflicts.length > 0 
      ? await suggestAlternativeSlots(prisma, providerId, startDateTime, duration)
      : [];

    return reply.send({
      hasConflict: conflicts.length > 0,
      conflictingBookings: conflicts.map(booking => ({
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        serviceName: booking.service.name
      })),
      suggestedSlots
    });
  });

  // GET /api/bookings - List bookings with filters
  fastify.get('/', {
    schema: {
      tags: ['Bookings'],
      summary: 'List bookings',
      description: 'Get bookings with filtering and pagination',
      security: [{ bearerAuth: [] }],
      ...BookingListSchema,
      response: {
        200: BookingListResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Querystring: {
      status?: string;
      providerId?: string;
      clientId?: string;
      serviceId?: string;
      startDate?: string;
      endDate?: string;
      paymentStatus?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    const {
      status,
      providerId,
      clientId,
      serviceId,
      startDate,
      endDate,
      paymentStatus,
      sortBy = 'startTime',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = request.query;

    const skip = (page - 1) * limit;
    
    // Build where clause based on user role
    const where: any = {};
    
    if (role === 'CLIENT') {
      where.clientId = userId;
    } else if (role === 'PROVIDER') {
      const provider = await prisma.provider.findUnique({
        where: { userId }
      });
      if (provider) {
        where.providerId = provider.id;
      }
    }
    
    // Apply filters
    if (status) where.status = status;
    if (providerId && role === 'ADMIN') where.providerId = providerId;
    if (clientId && role === 'ADMIN') where.clientId = clientId;
    if (serviceId) where.serviceId = serviceId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
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
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              category: {
                select: { id: true, name: true }
              }
            }
          },
          provider: {
            select: {
              id: true,
              businessName: true,
              address: true,
              city: true,
              province: true,
              businessPhone: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          payment: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    // Calculate stats
    const stats = role !== 'CLIENT' ? await prisma.booking.aggregate({
      where: role === 'PROVIDER' ? { providerId: where.providerId } : {},
      _count: { id: true },
      _sum: { totalAmount: true },
      _avg: { clientRating: true }
    }) : undefined;

    const statusStats = role !== 'CLIENT' ? await prisma.booking.groupBy({
      by: ['status'],
      where: role === 'PROVIDER' ? { providerId: where.providerId } : {},
      _count: { id: true }
    }) : undefined;

    return reply.send({
      data: bookings.map(booking => ({
        ...booking,
        totalAmount: booking.totalAmount.toNumber(),
        service: booking.service ? {
          ...booking.service,
          price: booking.service.price.toNumber()
        } : undefined
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: stats ? {
        totalBookings: stats._count.id || 0,
        pendingBookings: statusStats?.find(s => s.status === 'PENDING')?._count.id || 0,
        confirmedBookings: statusStats?.find(s => s.status === 'CONFIRMED')?._count.id || 0,
        completedBookings: statusStats?.find(s => s.status === 'COMPLETED')?._count.id || 0,
        cancelledBookings: statusStats?.find(s => s.status === 'CANCELLED')?._count.id || 0,
        totalRevenue: stats._sum.totalAmount?.toNumber() || 0,
        averageRating: stats._avg.clientRating || undefined
      } : undefined
    });
  });

  // GET /api/bookings/:id - Get booking by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Bookings'],
      summary: 'Get booking by ID',
      description: 'Get detailed information about a specific booking',
      security: [{ bearerAuth: [] }],
      ...GetBookingSchema,
      response: {
        200: BookingResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    
    const booking = await prisma.booking.findUnique({
      where: { id: request.params.id },
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
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: {
              select: { id: true, name: true }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            businessPhone: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payment: true
      }
    });

    if (!booking) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Reserva no encontrada'
      });
    }

    // Check permissions
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (role === 'CLIENT' && booking.clientId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para ver esta reserva'
      });
    } else if (role === 'PROVIDER' && booking.providerId !== provider?.id) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para ver esta reserva'
      });
    }

    return reply.send({
      ...booking,
      totalAmount: booking.totalAmount.toNumber(),
      service: booking.service ? {
        ...booking.service,
        price: booking.service.price.toNumber()
      } : undefined
    });
  });

  // POST /api/bookings - Create booking
  fastify.post('/', {
    schema: {
      tags: ['Bookings'],
      summary: 'Create booking',
      description: 'Create a new booking with conflict checking',
      security: [{ bearerAuth: [] }],
      ...CreateBookingSchema,
      response: {
        201: BookingResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Body: {
      serviceId: string;
      providerId: string;
      startTime: string;
      notes?: string;
      clientNotes?: string;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    const { serviceId, providerId, startTime, notes, clientNotes } = request.body;
    
    if (role !== 'CLIENT') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo clientes pueden crear reservas'
      });
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service || !service.isActive) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Servicio no encontrado o inactivo'
      });
    }

    if (service.providerId !== providerId) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'El servicio no pertenece al proveedor especificado'
      });
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + service.duration);

    // Check for conflicts
    const conflicts = await checkBookingConflicts(
      prisma,
      providerId,
      startDateTime,
      endDateTime
    );

    if (conflicts.length > 0) {
      const suggestedSlots = await suggestAlternativeSlots(
        prisma,
        providerId,
        startDateTime,
        service.duration
      );

      return reply.code(409).send({
        error: 'Conflict',
        message: 'Ya existe una reserva en este horario',
        conflicts: conflicts.map(c => ({
          id: c.id,
          startTime: c.startTime.toISOString(),
          endTime: c.endTime.toISOString(),
          serviceName: c.service.name
        })),
        suggestedSlots
      });
    }

    // Validate booking time (not in the past, within advance booking limit)
    if (startDateTime < new Date()) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No se pueden crear reservas en el pasado'
      });
    }

    if (!service.allowSameDayBooking) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (startDateTime < tomorrow) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Este servicio no permite reservas para el mismo día'
        });
      }
    }

    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + service.maxAdvanceBookingDays);
    
    if (startDateTime > maxAdvanceDate) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `No se pueden crear reservas con más de ${service.maxAdvanceBookingDays} días de anticipación`
      });
    }

    // Calculate total amount (service price + potential deposit)
    const totalAmount = service.depositRequired && service.depositAmount 
      ? service.depositAmount 
      : service.price;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: userId,
        serviceId,
        providerId,
        startTime: startDateTime,
        endTime: endDateTime,
        totalAmount,
        notes,
        clientNotes,
        status: service.requiresConsultation ? 'PENDING' : 'CONFIRMED',
        paymentStatus: 'PENDING'
      },
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
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: {
              select: { id: true, name: true }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            businessPhone: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // TODO: Send notifications to client and provider
    // TODO: Create payment record if deposit required

    return reply.code(201).send({
      ...booking,
      totalAmount: booking.totalAmount.toNumber(),
      service: booking.service ? {
        ...booking.service,
        price: booking.service.price.toNumber()
      } : undefined
    });
  });

  // PUT /api/bookings/:id - Update booking
  fastify.put('/:id', {
    schema: {
      tags: ['Bookings'],
      summary: 'Update booking',
      description: 'Update booking details (Client/Provider)',
      security: [{ bearerAuth: [] }],
      ...UpdateBookingSchema,
      response: {
        200: BookingResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      startTime?: string;
      notes?: string;
      clientNotes?: string;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    const { startTime, notes, clientNotes } = request.body;
    
    const booking = await prisma.booking.findUnique({
      where: { id: request.params.id },
      include: { service: true, provider: true }
    });

    if (!booking) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Reserva no encontrada'
      });
    }

    // Check permissions
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (role === 'CLIENT' && booking.clientId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para actualizar esta reserva'
      });
    } else if (role === 'PROVIDER' && booking.providerId !== provider?.id) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para actualizar esta reserva'
      });
    }

    // Check if booking can be modified
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No se puede modificar una reserva completada o cancelada'
      });
    }

    const updateData: any = {};
    
    if (startTime) {
      const newStartTime = new Date(startTime);
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newStartTime.getMinutes() + booking.service.duration);

      // Check for conflicts (excluding current booking)
      const conflicts = await checkBookingConflicts(
        prisma,
        booking.providerId,
        newStartTime,
        newEndTime,
        booking.id
      );

      if (conflicts.length > 0) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Ya existe una reserva en el nuevo horario',
          conflicts: conflicts.map(c => ({
            id: c.id,
            startTime: c.startTime.toISOString(),
            endTime: c.endTime.toISOString(),
            serviceName: c.service.name
          }))
        });
      }

      updateData.startTime = newStartTime;
      updateData.endTime = newEndTime;
    }

    if (notes !== undefined) updateData.notes = notes;
    if (clientNotes !== undefined) updateData.clientNotes = clientNotes;

    const updatedBooking = await prisma.booking.update({
      where: { id: request.params.id },
      data: updateData,
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
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: {
              select: { id: true, name: true }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            businessPhone: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payment: true
      }
    });

    return reply.send({
      ...updatedBooking,
      totalAmount: updatedBooking.totalAmount.toNumber(),
      service: updatedBooking.service ? {
        ...updatedBooking.service,
        price: updatedBooking.service.price.toNumber()
      } : undefined
    });
  });

  // PUT /api/bookings/:id/status - Update booking status (Provider only)
  fastify.put('/:id/status', {
    schema: {
      tags: ['Bookings'],
      summary: 'Update booking status',
      description: 'Update booking status (Provider only)',
      security: [{ bearerAuth: [] }],
      ...BookingStatusUpdateSchema,
      response: {
        200: BookingResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      status: string;
      internalNotes?: string;
      cancelReason?: string;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    const { status, internalNotes, cancelReason } = request.body;
    
    if (role !== 'PROVIDER' && role !== 'ADMIN') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo proveedores pueden actualizar el estado de las reservas'
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!booking) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Reserva no encontrada'
      });
    }

    // Check provider ownership
    if (role === 'PROVIDER' && booking.provider.userId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para actualizar esta reserva'
      });
    }

    const updateData: any = { status, internalNotes };
    
    if (status === 'CANCELLED') {
      updateData.cancelledBy = userId;
      updateData.cancelReason = cancelReason;
      updateData.cancelledAt = new Date();
    } else if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: request.params.id },
      data: updateData,
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
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: {
              select: { id: true, name: true }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            businessPhone: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payment: true
      }
    });

    // TODO: Send status update notifications

    return reply.send({
      ...updatedBooking,
      totalAmount: updatedBooking.totalAmount.toNumber(),
      service: updatedBooking.service ? {
        ...updatedBooking.service,
        price: updatedBooking.service.price.toNumber()
      } : undefined
    });
  });

  // POST /api/bookings/:id/cancel - Cancel booking
  fastify.post('/:id/cancel', {
    schema: {
      tags: ['Bookings'],
      summary: 'Cancel booking',
      description: 'Cancel a booking with reason',
      security: [{ bearerAuth: [] }],
      ...BookingCancellationSchema,
      response: {
        200: BookingResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      reason: string;
      notifyClient?: boolean;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    const { reason, notifyClient = true } = request.body;
    
    const booking = await prisma.booking.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!booking) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Reserva no encontrada'
      });
    }

    // Check permissions
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (role === 'CLIENT' && booking.clientId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para cancelar esta reserva'
      });
    } else if (role === 'PROVIDER' && booking.providerId !== provider?.id) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para cancelar esta reserva'
      });
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No se puede cancelar una reserva ya completada o cancelada'
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: request.params.id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelReason: reason,
        cancelledAt: new Date()
      },
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
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: {
              select: { id: true, name: true }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            businessPhone: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payment: true
      }
    });

    // TODO: Process refund if applicable
    // TODO: Send cancellation notifications if notifyClient is true

    return reply.send({
      ...updatedBooking,
      totalAmount: updatedBooking.totalAmount.toNumber(),
      service: updatedBooking.service ? {
        ...updatedBooking.service,
        price: updatedBooking.service.price.toNumber()
      } : undefined
    });
  });

  // POST /api/bookings/:id/feedback - Add booking feedback
  fastify.post('/:id/feedback', {
    schema: {
      tags: ['Bookings'],
      summary: 'Add booking feedback',
      description: 'Add rating and feedback to a completed booking',
      security: [{ bearerAuth: [] }],
      ...BookingFeedbackSchema,
      response: {
        200: BookingResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      clientRating: number;
      clientFeedback?: string;
      providerFeedback?: string;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    const { clientRating, clientFeedback, providerFeedback } = request.body;
    
    const booking = await prisma.booking.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!booking) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Reserva no encontrada'
      });
    }

    // Check permissions
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (role === 'CLIENT' && booking.clientId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para calificar esta reserva'
      });
    } else if (role === 'PROVIDER' && booking.providerId !== provider?.id) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para responder a esta reserva'
      });
    }

    if (booking.status !== 'COMPLETED') {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Solo se pueden calificar reservas completadas'
      });
    }

    const updateData: any = {};
    if (role === 'CLIENT') {
      updateData.clientRating = clientRating;
      updateData.clientFeedback = clientFeedback;
    } else if (role === 'PROVIDER') {
      updateData.providerFeedback = providerFeedback;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: request.params.id },
      data: updateData,
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
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: {
              select: { id: true, name: true }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            province: true,
            businessPhone: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payment: true
      }
    });

    return reply.send({
      ...updatedBooking,
      totalAmount: updatedBooking.totalAmount.toNumber(),
      service: updatedBooking.service ? {
        ...updatedBooking.service,
        price: updatedBooking.service.price.toNumber()
      } : undefined
    });
  });
}