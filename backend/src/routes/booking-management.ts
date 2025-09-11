import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BookingStatus, PrismaClient } from '@prisma/client';
import { bookingService } from '../services/booking';
import { socketService } from '../services/socket';
import { reminderService } from '../services/reminder';

// Type for authenticated user data
interface UserData {
  userId: string;
  userRole: string;
  providerId?: string;
}

export default async function bookingManagementRoutes(fastify: FastifyInstance) {
  // Prehandler for authentication
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * POST /search
   * Advanced booking search with filters and pagination
   */
  fastify.post('/search', {
    schema: {
      tags: ['Booking Management'],
      description: 'Search bookings with advanced filters and pagination',
      body: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          clientId: { type: 'string' },
          status: {
            type: 'array',
            items: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] }
          },
          serviceId: { type: 'string' },
          dateRange: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date-time' },
              to: { type: 'string', format: 'date-time' }
            }
          },
          searchTerm: { type: 'string' },
          sortBy: { type: 'string', enum: ['startTime', 'createdAt', 'totalAmount', 'clientName'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        providerId,
        clientId,
        status,
        serviceId,
        dateRange,
        searchTerm,
        sortBy = 'startTime',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = request.body as any;

      // Build where clause
      const where: any = {};

      // Provider filter
      if (providerId) {
        // Verify the requesting user has access to this provider
        if ((request.user as UserData)?.providerId !== providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'No tiene permisos para ver estas reservas',
            statusCode: 403
          });
        }
        where.providerId = providerId;
      }

      // Client filter
      if (clientId) {
        // Verify the requesting user is the client or has access
        if ((request.user as UserData)?.userId !== clientId && (request.user as UserData)?.userRole !== 'ADMIN' && !providerId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'No tiene permisos para ver estas reservas',
            statusCode: 403
          });
        }
        where.clientId = clientId;
      }

      // Status filter
      if (status && status.length > 0) {
        where.status = { in: status };
      }

      // Service filter
      if (serviceId) {
        where.serviceId = serviceId;
      }

      // Date range filter
      if (dateRange) {
        where.startTime = {};
        if (dateRange.from) {
          where.startTime.gte = new Date(dateRange.from);
        }
        if (dateRange.to) {
          where.startTime.lte = new Date(dateRange.to);
        }
      }

      // Search term filter (search in client name, service name, or notes)
      if (searchTerm) {
        where.OR = [
          {
            client: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          },
          {
            service: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          },
          {
            notes: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            clientNotes: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build sort order
      const orderBy: any = {};
      if (sortBy === 'clientName') {
        orderBy.client = { name: sortOrder };
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Execute search with pagination
      const [bookings, totalCount] = await Promise.all([
        fastify.prisma.booking.findMany({
          where,
          include: {
            client: {
              select: { id: true, name: true, email: true, phone: true }
            },
            provider: {
              select: { id: true, businessName: true, user: { select: { name: true } } }
            },
            service: {
              select: { id: true, name: true, duration: true, price: true }
            },
            payment: {
              select: { id: true, status: true, amount: true, paymentMethod: true }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        fastify.prisma.booking.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        bookings,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          providerId,
          clientId,
          status,
          serviceId,
          dateRange,
          searchTerm
        },
        sorting: {
          sortBy,
          sortOrder
        }
      };

    } catch (error) {
      fastify.log.error('Error searching bookings:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * PUT /bulk-update
   * Bulk update multiple bookings
   */
  fastify.put('/bulk-update', {
    schema: {
      tags: ['Booking Management'],
      description: 'Bulk update multiple bookings',
      body: {
        type: 'object',
        required: ['bookingIds', 'action'],
        properties: {
          bookingIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 50
          },
          action: { type: 'string', enum: ['confirm', 'cancel', 'complete', 'reschedule'] },
          reason: { type: 'string' },
          newDateTime: { type: 'string', format: 'date-time' }, // For reschedule action
          sendNotification: { type: 'boolean', default: true }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { bookingIds, action, reason, newDateTime, sendNotification = true } = request.body as any;

      // Verify user has permission to perform bulk operations
      if ((request.user as UserData)?.userRole !== 'ADMIN' && !(request.user as UserData)?.providerId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para operaciones masivas',
          statusCode: 403
        });
      }

      const results = {
        successful: [] as string[],
        failed: [] as { bookingId: string; error: string }[]
      };

      // Process each booking
      for (const bookingId of bookingIds) {
        try {
          const booking = await fastify.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
              provider: { include: { user: true } },
              client: true,
              service: true
            }
          });

          if (!booking) {
            results.failed.push({ bookingId, error: 'Reserva no encontrada' });
            continue;
          }

          // Check permissions
          if ((request.user as UserData)?.providerId && booking.providerId !== (request.user as UserData)?.providerId) {
            results.failed.push({ bookingId, error: 'Sin permisos para esta reserva' });
            continue;
          }

          let updateResult;

          switch (action) {
            case 'confirm':
              updateResult = await bookingService.updateBookingState(
                bookingId,
                BookingStatus.CONFIRMED,
                (request.user as UserData)?.userId,
                reason
              );
              break;

            case 'cancel':
              updateResult = await bookingService.updateBookingState(
                bookingId,
                BookingStatus.CANCELLED,
                (request.user as UserData)?.userId,
                reason
              );
              break;

            case 'complete':
              updateResult = await bookingService.updateBookingState(
                bookingId,
                BookingStatus.COMPLETED,
                (request.user as UserData)?.userId,
                reason
              );
              break;

            case 'reschedule':
              if (!newDateTime) {
                results.failed.push({ bookingId, error: 'Nueva fecha requerida para reagendar' });
                continue;
              }

              updateResult = await bookingService.updateBooking(bookingId, {
                startTime: new Date(newDateTime),
                notes: `Reagendado: ${reason || 'Sin motivo especificado'}`
              });
              break;

            default:
              results.failed.push({ bookingId, error: 'Acción no válida' });
              continue;
          }

          if (updateResult.success) {
            results.successful.push(bookingId);

            // Broadcast real-time update
            if (updateResult.booking) {
              await socketService.broadcastBookingUpdate({
                bookingId: updateResult.booking.id,
                action: action === 'reschedule' ? 'updated' : action,
                booking: updateResult.booking,
                timestamp: new Date()
              });

              // Update availability if rescheduled
              if (action === 'reschedule') {
                await socketService.broadcastAvailabilityUpdate(
                  booking.providerId,
                  booking.startTime
                );
                await socketService.broadcastAvailabilityUpdate(
                  booking.providerId,
                  new Date(newDateTime)
                );
              }
            }
          } else {
            results.failed.push({
              bookingId,
              error: updateResult.errors?.join(', ') || 'Error desconocido'
            });
          }
        } catch (error) {
          results.failed.push({
            bookingId,
            error: 'Error procesando la reserva'
          });
        }
      }

      return {
        success: true,
        action,
        results,
        summary: {
          total: bookingIds.length,
          successful: results.successful.length,
          failed: results.failed.length
        },
        message: `Operación completada: ${results.successful.length} exitosas, ${results.failed.length} fallidas`
      };

    } catch (error) {
      fastify.log.error('Error in bulk update:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /:bookingId/modification-request
   * Client requests modification to existing booking
   */
  fastify.post('/:bookingId/modification-request', {
    schema: {
      tags: ['Booking Management'],
      description: 'Request modification to existing booking',
      params: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['modificationType'],
        properties: {
          modificationType: { type: 'string', enum: ['reschedule', 'service_change', 'cancellation'] },
          newDateTime: { type: 'string', format: 'date-time' },
          newServiceId: { type: 'string' },
          reason: { type: 'string', maxLength: 500 },
          urgent: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { bookingId } = request.params as any;
      const { modificationType, newDateTime, newServiceId, reason, urgent = false } = request.body as any;

      const booking = await fastify.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      if (!booking) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
      }

      // Verify the requesting user is the client
      if (booking.clientId !== (request.user as UserData)?.userId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo el cliente puede solicitar modificaciones',
          statusCode: 403
        });
      }

      // Check if booking can be modified
      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Esta reserva no puede ser modificada',
          statusCode: 400
        });
      }

      // Check time constraints for modifications
      const hoursUntilBooking = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (!urgent && hoursUntilBooking < 24) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Las modificaciones deben solicitarse con al menos 24 horas de anticipación',
          statusCode: 400
        });
      }

      const modificationRequestId = `mod_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create modification request
      const modificationRequest = {
        id: modificationRequestId,
        bookingId,
        clientId: booking.clientId,
        providerId: booking.providerId,
        modificationType,
        newDateTime: newDateTime ? new Date(newDateTime) : undefined,
        newServiceId,
        reason,
        urgent,
        status: 'PENDING',
        createdAt: new Date()
      };

      // Store modification request (could be in a separate ModificationRequest model)
      // For now, we'll store it in booking notes as a temporary solution
      const currentNotes = booking.internalNotes ? JSON.parse(booking.internalNotes) : {};
      currentNotes.modificationRequests = currentNotes.modificationRequests || [];
      currentNotes.modificationRequests.push(modificationRequest);

      await fastify.prisma.booking.update({
        where: { id: bookingId },
        data: {
          internalNotes: JSON.stringify(currentNotes)
        }
      });

      // Send real-time notification to provider
      await socketService.notifyProvider(booking.providerId, {
        type: 'modification_request',
        bookingId,
        requestId: modificationRequestId,
        clientName: booking.client.name,
        modificationType,
        urgent,
        message: `${booking.client.name} solicita modificar su reserva`
      });

      // Schedule reminder for provider to respond
      await reminderService.scheduleProviderAlert(booking.providerId, {
        type: 'modification_request',
        bookingId,
        requestId: modificationRequestId,
        scheduleTime: new Date(Date.now() + (urgent ? 60 * 60 * 1000 : 4 * 60 * 60 * 1000)) // 1h or 4h
      });

      return {
        success: true,
        modificationRequestId,
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          service: booking.service.name
        },
        request: {
          modificationType,
          newDateTime,
          newServiceId,
          reason,
          urgent,
          status: 'PENDING'
        },
        message: 'Solicitud de modificación enviada al proveedor'
      };

    } catch (error) {
      fastify.log.error('Error creating modification request:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /:bookingId/modification-request/:requestId/respond
   * Provider responds to modification request
   */
  fastify.post('/:bookingId/modification-request/:requestId/respond', {
    schema: {
      tags: ['Booking Management'],
      description: 'Provider responds to modification request',
      params: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' },
          requestId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['response'],
        properties: {
          response: { type: 'string', enum: ['approve', 'reject', 'counter_offer'] },
          reason: { type: 'string' },
          counterOffer: {
            type: 'object',
            properties: {
              newDateTime: { type: 'string', format: 'date-time' },
              newServiceId: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { bookingId, requestId } = request.params as any;
      const { response, reason, counterOffer } = request.body as any;

      const booking = await fastify.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      if (!booking) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
      }

      // Verify the requesting user is the provider
      if (booking.providerId !== (request.user as UserData)?.providerId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo el proveedor puede responder a modificaciones',
          statusCode: 403
        });
      }

      // Get modification request
      const currentNotes = booking.internalNotes ? JSON.parse(booking.internalNotes) : {};
      const modificationRequests = currentNotes.modificationRequests || [];
      const requestIndex = modificationRequests.findIndex((req: any) => req.id === requestId);

      if (requestIndex === -1) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Solicitud de modificación no encontrada',
          statusCode: 404
        });
      }

      const modificationRequest = modificationRequests[requestIndex];

      if (modificationRequest.status !== 'PENDING') {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Esta solicitud ya fue procesada',
          statusCode: 400
        });
      }

      // Update request status
      modificationRequest.status = response.toUpperCase();
      modificationRequest.providerResponse = {
        response,
        reason,
        counterOffer,
        respondedAt: new Date()
      };

      let updateData: any = {
        internalNotes: JSON.stringify(currentNotes)
      };

      // Apply changes if approved
      if (response === 'approve') {
        if (modificationRequest.modificationType === 'reschedule' && modificationRequest.newDateTime) {
          // Validate new time slot
          const newStartTime = new Date(modificationRequest.newDateTime);
          const newEndTime = new Date(newStartTime.getTime() + (booking.service.duration * 60000));
          
          const validation = await bookingService.validateBookingSlot(
            booking.providerId,
            booking.serviceId,
            newStartTime,
            newEndTime,
            bookingId
          );

          if (!validation.isValid) {
            return reply.code(409).send({
              error: 'Conflict',
              message: 'El nuevo horario no está disponible',
              conflicts: validation.conflicts,
              statusCode: 409
            });
          }

          updateData.startTime = newStartTime;
          updateData.endTime = newEndTime;
        }

        if (modificationRequest.modificationType === 'service_change' && modificationRequest.newServiceId) {
          const newService = await fastify.prisma.service.findUnique({
            where: { id: modificationRequest.newServiceId }
          });

          if (newService) {
            updateData.serviceId = modificationRequest.newServiceId;
            updateData.totalAmount = newService.price;
            updateData.endTime = new Date(booking.startTime.getTime() + (newService.duration * 60000));
          }
        }

        if (modificationRequest.modificationType === 'cancellation') {
          updateData.status = BookingStatus.CANCELLED;
          updateData.cancelledAt = new Date();
          updateData.cancelledBy = booking.clientId;
          updateData.cancelReason = modificationRequest.reason;
        }
      }

      const updatedBooking = await fastify.prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          client: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      // Send real-time notification to client
      await socketService.notifyClient(booking.clientId, {
        type: 'modification_response',
        bookingId,
        requestId,
        response,
        reason,
        counterOffer,
        message: `Su solicitud de modificación fue ${response === 'approve' ? 'aprobada' : response === 'reject' ? 'rechazada' : 'respondida con contraoferta'}`
      });

      // Broadcast booking update if changes were applied
      if (response === 'approve') {
        await socketService.broadcastBookingUpdate({
          bookingId: updatedBooking.id,
          action: modificationRequest.modificationType === 'cancellation' ? 'cancelled' : 'updated',
          booking: updatedBooking,
          timestamp: new Date()
        });
      }

      return {
        success: true,
        requestId,
        response,
        booking: updatedBooking,
        modificationRequest,
        message: `Solicitud de modificación ${response === 'approve' ? 'aprobada' : response === 'reject' ? 'rechazada' : 'respondida'}`
      };

    } catch (error) {
      fastify.log.error('Error responding to modification request:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * GET /:bookingId/timeline
   * Get booking timeline with all events and changes
   */
  fastify.get('/:bookingId/timeline', {
    schema: {
      tags: ['Booking Management'],
      description: 'Get complete booking timeline and history',
      params: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { bookingId } = request.params as any;

      const booking = await fastify.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          provider: {
            select: { id: true, businessName: true, user: { select: { name: true } } }
          },
          service: {
            select: { id: true, name: true, duration: true, price: true }
          },
          payment: true
        }
      });

      if (!booking) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
      }

      // Verify the requesting user has access to this booking
      const canAccess = (
        booking.clientId === (request.user as UserData)?.userId ||
        booking.providerId === (request.user as UserData)?.providerId ||
        (request.user as UserData)?.userRole === 'ADMIN'
      );

      if (!canAccess) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tiene permisos para ver este historial',
          statusCode: 403
        });
      }

      // Build timeline from booking data
      const timeline: any[] = [];

      // Booking creation
      timeline.push({
        event: 'booking_created',
        timestamp: booking.createdAt,
        actor: 'client',
        actorName: booking.client.name,
        details: {
          service: booking.service.name,
          startTime: booking.startTime,
          amount: booking.totalAmount
        },
        description: 'Reserva creada'
      });

      // Confirmation
      if (booking.confirmedAt) {
        timeline.push({
          event: 'booking_confirmed',
          timestamp: booking.confirmedAt,
          actor: 'provider',
          actorName: booking.provider.user.name,
          description: 'Reserva confirmada'
        });
      }

      // Completion
      if (booking.completedAt) {
        timeline.push({
          event: 'booking_completed',
          timestamp: booking.completedAt,
          actor: 'provider',
          actorName: booking.provider.user.name,
          description: 'Servicio completado'
        });
      }

      // Cancellation
      if (booking.cancelledAt) {
        timeline.push({
          event: 'booking_cancelled',
          timestamp: booking.cancelledAt,
          actor: booking.cancelledBy === booking.clientId ? 'client' : 'provider',
          actorName: booking.cancelledBy === booking.clientId ? booking.client.name : booking.provider.user.name,
          details: {
            reason: booking.cancelReason
          },
          description: 'Reserva cancelada'
        });
      }

      // Payment events
      if (booking.payment) {
        timeline.push({
          event: 'payment_updated',
          timestamp: booking.payment.updatedAt,
          actor: 'system',
          actorName: 'Sistema',
          details: {
            status: booking.payment.status,
            amount: booking.payment.amount,
            method: booking.payment.paymentMethod
          },
          description: `Estado de pago: ${booking.payment.status}`
        });
      }

      // Rating/feedback
      if (booking.clientRating || booking.clientFeedback) {
        timeline.push({
          event: 'feedback_added',
          timestamp: booking.updatedAt, // Approximate
          actor: 'client',
          actorName: booking.client.name,
          details: {
            rating: booking.clientRating,
            feedback: booking.clientFeedback
          },
          description: 'Calificación y comentario agregados'
        });
      }

      // Parse modification requests from internal notes
      if (booking.internalNotes) {
        try {
          const notes = JSON.parse(booking.internalNotes);
          if (notes.modificationRequests) {
            for (const request of notes.modificationRequests) {
              timeline.push({
                event: 'modification_requested',
                timestamp: new Date(request.createdAt),
                actor: 'client',
                actorName: booking.client.name,
                details: {
                  modificationType: request.modificationType,
                  reason: request.reason,
                  urgent: request.urgent
                },
                description: 'Solicitud de modificación'
              });

              if (request.providerResponse) {
                timeline.push({
                  event: 'modification_responded',
                  timestamp: new Date(request.providerResponse.respondedAt),
                  actor: 'provider',
                  actorName: booking.provider.user.name,
                  details: {
                    response: request.providerResponse.response,
                    reason: request.providerResponse.reason,
                    counterOffer: request.providerResponse.counterOffer
                  },
                  description: `Respuesta: ${request.providerResponse.response}`
                });
              }
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      // Sort timeline by timestamp
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
          startTime: booking.startTime,
          endTime: booking.endTime,
          client: booking.client,
          provider: booking.provider,
          service: booking.service
        },
        timeline,
        timelineCount: timeline.length
      };

    } catch (error) {
      fastify.log.error('Error getting booking timeline:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  /**
   * POST /:bookingId/automatic-expiration
   * Set automatic expiration for pending bookings
   */
  fastify.post('/:bookingId/automatic-expiration', {
    schema: {
      tags: ['Booking Management'],
      description: 'Set automatic expiration for pending bookings',
      params: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['expirationHours'],
        properties: {
          expirationHours: { type: 'integer', minimum: 1, maximum: 168 }, // Max 1 week
          notifyBeforeExpiration: { type: 'boolean', default: true },
          notificationHours: { type: 'integer', minimum: 1, maximum: 24, default: 2 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { bookingId } = request.params as any;
      const { expirationHours, notifyBeforeExpiration = true, notificationHours = 2 } = request.body as any;

      const booking = await fastify.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          provider: { include: { user: true } }
        }
      });

      if (!booking) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
      }

      // Verify the requesting user is the provider
      if (booking.providerId !== (request.user as UserData)?.providerId && (request.user as UserData)?.userRole !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo el proveedor puede configurar expiración automática',
          statusCode: 403
        });
      }

      if (booking.status !== 'PENDING') {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Solo las reservas pendientes pueden tener expiración automática',
          statusCode: 400
        });
      }

      const expirationTime = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
      const notificationTime = notifyBeforeExpiration 
        ? new Date(expirationTime.getTime() - (notificationHours * 60 * 60 * 1000))
        : null;

      // Store expiration configuration in booking notes
      const currentNotes = booking.internalNotes ? JSON.parse(booking.internalNotes) : {};
      currentNotes.automaticExpiration = {
        enabled: true,
        expirationTime,
        notificationTime,
        expirationHours,
        notificationHours,
        configuredAt: new Date(),
        configuredBy: (request.user as UserData)?.userId
      };

      await fastify.prisma.booking.update({
        where: { id: bookingId },
        data: {
          internalNotes: JSON.stringify(currentNotes)
        }
      });

      // Schedule expiration task (this would need a job queue in production)
      // For now, we'll use reminderService to schedule
      await reminderService.scheduleBookingExpiration(bookingId, {
        expirationTime,
        notificationTime
      });

      return {
        success: true,
        bookingId,
        automaticExpiration: {
          enabled: true,
          expirationTime,
          notificationTime,
          expirationHours,
          notificationHours
        },
        message: 'Expiración automática configurada exitosamente'
      };

    } catch (error) {
      fastify.log.error('Error setting automatic expiration:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });
}