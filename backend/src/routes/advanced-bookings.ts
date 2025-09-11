import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BookingStatus, PrismaClient } from '@prisma/client';
import { bookingService } from '../services/booking';
import { socketService } from '../services/socket';

// Type for authenticated user data
interface UserData {
  userId: string;
  userRole: string;
  providerId?: string;
}

export default async function advancedBookingsRoutes(fastify: FastifyInstance) {
  // Prehandler for authentication
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * POST /advanced/state-transition
   * Advanced booking state management with transitions
   */
  fastify.post('/advanced/state-transition', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Update booking state with validation and business rules',
      body: {
        type: 'object',
        required: ['bookingId', 'newStatus'],
        properties: {
          bookingId: { type: 'string' },
          newStatus: { 
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
          },
          reason: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { bookingId, newStatus, reason } = request.body as any;
      
      const result = await bookingService.updateBookingState(
        bookingId,
        newStatus as BookingStatus,
        (request.user as UserData)?.userId,
        reason
      );

      if (!result.success) {
        return reply.code(400).send({
          error: 'State Transition Failed',
          message: 'No se pudo actualizar el estado de la reserva',
          details: result.errors,
          statusCode: 400
        });
      }

      // Broadcast real-time update
      if (result.booking) {
        await socketService.broadcastBookingUpdate({
          bookingId: result.booking.id,
          action: 'updated',
          booking: result.booking,
          timestamp: new Date()
        });

        // Update availability
        await socketService.broadcastAvailabilityUpdate(
          result.booking.providerId,
          result.booking.startTime
        );
      }

      return {
        success: true,
        booking: result.booking,
        message: 'Estado de reserva actualizado exitosamente'
      };

    } catch (error) {
      fastify.log.error('Error updating booking state:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /advanced/create-with-lock
   * Create booking with advanced double-booking prevention
   */
  fastify.post('/advanced/create-with-lock', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Create booking with database-level locking for conflict prevention',
      body: {
        type: 'object',
        required: ['providerId', 'serviceId', 'startTime'],
        properties: {
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId, serviceId, startTime, notes } = request.body as any;
      
      const result = await bookingService.createBookingWithLock({
        clientId: (request.user as UserData)?.userId,
        providerId,
        serviceId,
        startTime: new Date(startTime),
        notes
      });

      if (!result.success) {
        // Get suggested alternative slots
        const suggestions = await bookingService.getSuggestedSlots(
          providerId,
          serviceId,
          new Date(startTime)
        );

        return reply.code(409).send({
          error: 'Booking Conflict',
          message: 'El horario solicitado no está disponible',
          conflicts: result.errors,
          suggestedSlots: suggestions,
          statusCode: 409
        });
      }

      // Broadcast real-time updates
      if (result.booking) {
        await socketService.broadcastBookingUpdate({
          bookingId: result.booking.id,
          action: 'created',
          booking: result.booking,
          timestamp: new Date()
        });

        await socketService.broadcastAvailabilityUpdate(
          providerId,
          new Date(startTime)
        );
      }

      return {
        success: true,
        booking: result.booking,
        message: 'Reserva creada exitosamente'
      };

    } catch (error) {
      fastify.log.error('Error creating booking with lock:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /advanced/recurring
   * Create recurring bookings
   */
  fastify.post('/advanced/recurring', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Create recurring appointments',
      body: {
        type: 'object',
        required: ['providerId', 'serviceId', 'startTime', 'recurringPattern'],
        properties: {
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          recurringPattern: {
            type: 'object',
            required: ['frequency', 'occurrences'],
            properties: {
              frequency: {
                type: 'string',
                enum: ['daily', 'weekly', 'biweekly', 'monthly']
              },
              occurrences: { type: 'integer', minimum: 1, maximum: 52 },
              endDate: { type: 'string', format: 'date-time' }
            }
          },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId, serviceId, startTime, recurringPattern, notes } = request.body as any;
      
      const result = await bookingService.createRecurringBookings({
        clientId: (request.user as UserData)?.userId,
        providerId,
        serviceId,
        startTime: new Date(startTime),
        recurringPattern,
        notes
      });

      // Broadcast updates for successful bookings
      for (const booking of result.bookings) {
        await socketService.broadcastBookingUpdate({
          bookingId: booking.id,
          action: 'created',
          booking,
          timestamp: new Date()
        });
      }

      // Update availability for affected dates
      const affectedDates = new Set(result.bookings.map(b => b.startTime.toDateString()));
      for (const dateString of affectedDates) {
        await socketService.broadcastAvailabilityUpdate(providerId, new Date(dateString));
      }

      return {
        success: result.success,
        bookings: result.bookings,
        failed: result.failed,
        message: `${result.bookings.length} reservas creadas exitosamente${result.failed.length > 0 ? `, ${result.failed.length} fallaron` : ''}`
      };

    } catch (error) {
      fastify.log.error('Error creating recurring bookings:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /advanced/group
   * Create group bookings
   */
  fastify.post('/advanced/group', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Create group session bookings',
      body: {
        type: 'object',
        required: ['providerId', 'serviceId', 'startTime', 'clientIds'],
        properties: {
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          clientIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10
          },
          maxParticipants: { type: 'integer', minimum: 1, maximum: 20 },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId, serviceId, startTime, clientIds, maxParticipants, notes } = request.body as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo el proveedor puede crear sesiones grupales',
          statusCode: 403
        });
      }

      const result = await bookingService.createGroupBooking({
        providerId,
        serviceId,
        startTime: new Date(startTime),
        clientIds,
        maxParticipants,
        notes
      });

      if (!result.success) {
        return reply.code(400).send({
          error: 'Group Booking Failed',
          message: 'No se pudo crear la sesión grupal',
          details: result.errors,
          statusCode: 400
        });
      }

      // Broadcast updates for all group bookings
      for (const booking of result.bookings) {
        await socketService.broadcastBookingUpdate({
          bookingId: booking.id,
          action: 'created',
          booking,
          timestamp: new Date()
        });
      }

      // Update availability
      await socketService.broadcastAvailabilityUpdate(providerId, new Date(startTime));

      return {
        success: true,
        bookings: result.bookings,
        message: `Sesión grupal creada con ${result.bookings.length} participantes`
      };

    } catch (error) {
      fastify.log.error('Error creating group booking:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /advanced/waitlist
   * Add client to waitlist
   */
  fastify.post('/advanced/waitlist', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Add client to booking waitlist',
      body: {
        type: 'object',
        required: ['providerId', 'serviceId', 'preferredDate'],
        properties: {
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          preferredDate: { type: 'string', format: 'date-time' },
          timeRange: {
            type: 'object',
            properties: {
              startTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
              endTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
            }
          },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId, serviceId, preferredDate, timeRange, notes } = request.body as any;
      
      const result = await bookingService.addToWaitlist({
        clientId: (request.user as UserData)?.userId,
        providerId,
        serviceId,
        preferredDate: new Date(preferredDate),
        timeRange,
        notes
      });

      return {
        success: result.success,
        waitlistEntry: result.waitlistEntry,
        message: 'Agregado a la lista de espera exitosamente'
      };

    } catch (error) {
      fastify.log.error('Error adding to waitlist:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * GET /advanced/analytics/:providerId
   * Get booking analytics for provider
   */
  fastify.get('/advanced/analytics/:providerId', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Get comprehensive booking analytics',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId } = request.params as any;
      const { from, to } = request.query as any;
      
      // Verify the requesting user is the provider or has admin rights
      if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para ver estas analíticas',
          statusCode: 403
        });
      }

      const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
      const dateTo = to ? new Date(to) : new Date(); // Default now

      const analytics = await bookingService.getBookingAnalytics(providerId, {
        from: dateFrom,
        to: dateTo
      });

      return {
        success: true,
        analytics,
        dateRange: {
          from: dateFrom,
          to: dateTo
        }
      };

    } catch (error) {
      fastify.log.error('Error getting booking analytics:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /advanced/availability/check
   * Real-time availability checking
   */
  fastify.post('/advanced/availability/check', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Check real-time slot availability with conflict detection',
      body: {
        type: 'object',
        required: ['providerId', 'serviceId', 'startTime'],
        properties: {
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          excludeBookingId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId, serviceId, startTime, excludeBookingId } = request.body as any;
      
      // Get service to calculate end time
      const service = await fastify.prisma.service.findUnique({
        where: { id: serviceId }
      });

      if (!service) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Servicio no encontrado',
          statusCode: 404
        });
      }

      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + (service.duration * 60000));

      const validation = await bookingService.validateBookingSlot(
        providerId,
        serviceId,
        startDateTime,
        endDateTime,
        excludeBookingId
      );

      let suggestedSlots: any[] = [];
      if (!validation.isValid) {
        suggestedSlots = await bookingService.getSuggestedSlots(
          providerId,
          serviceId,
          startDateTime
        );
      }

      return {
        available: validation.isValid,
        conflicts: validation.conflicts,
        suggestedSlots: validation.isValid ? [] : suggestedSlots,
        timeSlot: {
          start: startDateTime,
          end: endDateTime
        }
      };

    } catch (error) {
      fastify.log.error('Error checking availability:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * GET /advanced/availability/:providerId/:date
   * Get all available slots for a provider on a specific date
   */
  fastify.get('/advanced/availability/:providerId/:date', {
    schema: {
      tags: ['Advanced Bookings'],
      description: 'Get all available time slots for a provider on a date',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          date: { type: 'string', format: 'date' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          serviceId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { providerId, date } = request.params as any;
      const { serviceId } = request.query as any;
      
      if (!serviceId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'serviceId es requerido',
          statusCode: 400
        });
      }

      const targetDate = new Date(date + 'T00:00:00');
      const availableSlots = await bookingService.calculateAvailableSlots(
        providerId,
        serviceId,
        targetDate
      );

      return {
        success: true,
        providerId,
        serviceId,
        date: targetDate,
        availableSlots,
        count: availableSlots.length
      };

    } catch (error) {
      fastify.log.error('Error getting available slots:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });
}