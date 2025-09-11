import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, BookingStatus, PaymentStatus } from '@prisma/client';
import { bookingCrudService } from '../services/booking-crud';
import { validateSchema } from '../middleware/validation';
import { z } from 'zod';
import { argentinaValidation, commonSchemas } from '../middleware/validation';

// Booking schemas
const createBookingSchema = z.object({
  clientId: z.string().cuid('Client ID inválido'),
  serviceId: z.string().cuid('Service ID inválido'),
  providerId: z.string().cuid('Provider ID inválido'),
  startTime: z.string().datetime('Fecha de inicio inválida').transform(val => new Date(val)),
  endTime: z.string().datetime('Fecha de fin inválida').transform(val => new Date(val)),
  totalAmount: argentinaValidation.price,
  notes: z.string().max(500, 'Notas demasiado largas').optional(),
  clientNotes: z.string().max(500, 'Notas del cliente demasiado largas').optional()
}).refine(data => data.startTime < data.endTime, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['endTime']
});

const updateBookingSchema = z.object({
  startTime: z.string().datetime('Fecha de inicio inválida').transform(val => new Date(val)).optional(),
  endTime: z.string().datetime('Fecha de fin inválida').transform(val => new Date(val)).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  notes: z.string().max(500, 'Notas demasiado largas').optional(),
  clientNotes: z.string().max(500, 'Notas del cliente demasiado largas').optional(),
  internalNotes: z.string().max(500, 'Notas internas demasiado largas').optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  paymentMethod: z.string().max(50, 'Método de pago demasiado largo').optional(),
  paymentId: z.string().max(100, 'ID de pago demasiado largo').optional(),
  clientRating: z.number().int().min(1).max(5).optional(),
  clientFeedback: z.string().max(1000, 'Comentario demasiado largo').optional(),
  providerFeedback: z.string().max(1000, 'Comentario demasiado largo').optional()
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['endTime']
});

const listBookingsQuerySchema = commonSchemas.pagination.extend({
  clientId: z.string().cuid().optional(),
  providerId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  status: z.array(z.nativeEnum(BookingStatus)).optional(),
  paymentStatus: z.array(z.nativeEnum(PaymentStatus)).optional(),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['startTime', 'createdAt', 'totalAmount', 'status']).default('startTime')
});

const cancelBookingSchema = z.object({
  cancelReason: z.string().max(500, 'Razón de cancelación demasiado larga').optional()
});

const availableSlotsQuerySchema = z.object({
  providerId: z.string().cuid('Provider ID inválido'),
  serviceId: z.string().cuid('Service ID inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .transform(val => new Date(val + 'T00:00:00.000Z'))
});

const bookingIdParamSchema = commonSchemas.id;

const bookingsCrudRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

  // Create new booking
  fastify.post('/', {
    preHandler: [fastify.authenticate, validateSchema(createBookingSchema, 'body')],
    schema: {
      tags: ['Bookings'],
      summary: 'Create new booking',
      description: 'Create a new booking (client, provider, or admin)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          clientId: { type: 'string' },
          serviceId: { type: 'string' },
          providerId: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          totalAmount: { type: 'number', minimum: 0 },
          notes: { type: 'string', maxLength: 500 },
          clientNotes: { type: 'string', maxLength: 500 }
        },
        required: ['clientId', 'serviceId', 'providerId', 'startTime', 'endTime', 'totalAmount']
      }
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof createBookingSchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const bookingData = request.body;

      // Check authorization
      const canCreateBooking = 
        currentUser.role === UserRole.ADMIN ||
        (currentUser.role === UserRole.CLIENT && bookingData.clientId === currentUser.id) ||
        (currentUser.role === UserRole.PROVIDER && bookingData.providerId === currentUser.providerId);

      if (!canCreateBooking) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para crear esta reserva',
          statusCode: 403
        });
        return;
      }

      const booking = await bookingCrudService.createBooking(bookingData);
      
      reply.code(201).send({
        success: true,
        data: booking
      });
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }
      
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Get booking by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate, validateSchema(bookingIdParamSchema, 'params')],
    schema: {
      tags: ['Bookings'],
      summary: 'Get booking by ID',
      description: 'Get detailed booking information by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const booking = await bookingCrudService.getBookingById(request.params.id);
      
      if (!booking) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
        return;
      }

      // Check authorization to view booking
      const canViewBooking = 
        currentUser.role === UserRole.ADMIN ||
        booking.clientId === currentUser.id ||
        booking.providerId === currentUser.providerId;

      if (!canViewBooking) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para ver esta reserva',
          statusCode: 403
        });
        return;
      }

      reply.send({
        success: true,
        data: booking
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Update booking
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, validateSchema(bookingIdParamSchema, 'params'), validateSchema(updateBookingSchema, 'body')],
    schema: {
      tags: ['Bookings'],
      summary: 'Update booking',
      description: 'Update booking information (authorized users only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
          notes: { type: 'string', maxLength: 500 },
          clientNotes: { type: 'string', maxLength: 500 },
          internalNotes: { type: 'string', maxLength: 500 },
          paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'] },
          paymentMethod: { type: 'string', maxLength: 50 },
          paymentId: { type: 'string', maxLength: 100 },
          clientRating: { type: 'number', minimum: 1, maximum: 5 },
          clientFeedback: { type: 'string', maxLength: 1000 },
          providerFeedback: { type: 'string', maxLength: 1000 }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateBookingSchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const bookingId = request.params.id;
      const updateData = request.body;

      // Get existing booking to check authorization
      const existingBooking = await bookingCrudService.getBookingById(bookingId);
      if (!existingBooking) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
        return;
      }

      // Check authorization
      const canUpdateBooking = 
        currentUser.role === UserRole.ADMIN ||
        (currentUser.role === UserRole.CLIENT && existingBooking.clientId === currentUser.id) ||
        (currentUser.role === UserRole.PROVIDER && existingBooking.providerId === currentUser.providerId);

      if (!canUpdateBooking) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para modificar esta reserva',
          statusCode: 403
        });
        return;
      }

      // Restrict what clients can update
      if (currentUser.role === UserRole.CLIENT) {
        const allowedFields = ['clientNotes', 'clientRating', 'clientFeedback'];
        const hasRestrictedFields = Object.keys(updateData).some(field => !allowedFields.includes(field));
        
        if (hasRestrictedFields) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'Los clientes solo pueden actualizar sus notas y calificaciones',
            statusCode: 403
          });
          return;
        }
      }

      // Restrict what providers can update
      if (currentUser.role === UserRole.PROVIDER) {
        const restrictedFields = ['paymentStatus', 'paymentMethod', 'paymentId'];
        const hasRestrictedFields = Object.keys(updateData).some(field => restrictedFields.includes(field));
        
        if (hasRestrictedFields) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'Los proveedores no pueden modificar información de pagos',
            statusCode: 403
          });
          return;
        }
      }

      const updatedBooking = await bookingCrudService.updateBooking(bookingId, updateData);
      
      reply.send({
        success: true,
        data: updatedBooking
      });
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }
      
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // List bookings
  fastify.get('/', {
    preHandler: [fastify.authenticate, validateSchema(listBookingsQuerySchema, 'query')],
    schema: {
      tags: ['Bookings'],
      summary: 'List bookings',
      description: 'List bookings with pagination and filters',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          clientId: { type: 'string' },
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          status: { type: 'array', items: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
          paymentStatus: { type: 'array', items: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'] } },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          search: { type: 'string', maxLength: 100 },
          sortBy: { type: 'string', enum: ['startTime', 'createdAt', 'totalAmount', 'status'], default: 'startTime' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof listBookingsQuerySchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const query = request.query;

      // Apply access restrictions based on user role
      if (currentUser.role === UserRole.CLIENT) {
        query.clientId = currentUser.id;
      } else if (currentUser.role === UserRole.PROVIDER) {
        query.providerId = currentUser.providerId;
      }
      // Admins can see all bookings

      const result = await bookingCrudService.listBookings(query);
      
      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Get bookings by client
  fastify.get('/client/:clientId', {
    preHandler: [fastify.authenticate, validateSchema(z.object({ clientId: z.string().cuid() }), 'params')],
    schema: {
      tags: ['Bookings'],
      summary: 'Get bookings by client',
      description: 'Get all bookings for a specific client',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          clientId: { type: 'string' }
        },
        required: ['clientId']
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          status: { type: 'array', items: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
          upcoming: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { clientId: string };
    Querystring: { page?: number; limit?: number; status?: BookingStatus[]; upcoming?: boolean }
  }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { clientId } = request.params;

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && currentUser.id !== clientId) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para ver estas reservas',
          statusCode: 403
        });
        return;
      }

      const result = await bookingCrudService.getBookingsByClient(clientId, request.query);
      
      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Get bookings by provider
  fastify.get('/provider/:providerId', {
    preHandler: [fastify.authenticate, validateSchema(z.object({ providerId: z.string().cuid() }), 'params')],
    schema: {
      tags: ['Bookings'],
      summary: 'Get bookings by provider',
      description: 'Get all bookings for a specific provider',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        },
        required: ['providerId']
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          date: { type: 'string', format: 'date' },
          status: { type: 'array', items: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] } }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { providerId: string };
    Querystring: { page?: number; limit?: number; date?: string; status?: BookingStatus[] }
  }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { providerId } = request.params;

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && currentUser.providerId !== providerId) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para ver estas reservas',
          statusCode: 403
        });
        return;
      }

      const options = { ...request.query };
      if (options.date) {
        options.date = new Date(options.date);
      }

      const result = await bookingCrudService.getBookingsByProvider(providerId, options);
      
      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Cancel booking
  fastify.patch('/:id/cancel', {
    preHandler: [fastify.authenticate, validateSchema(bookingIdParamSchema, 'params'), validateSchema(cancelBookingSchema, 'body')],
    schema: {
      tags: ['Bookings'],
      summary: 'Cancel booking',
      description: 'Cancel a booking (client, provider, or admin)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          cancelReason: { type: 'string', maxLength: 500 }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { id: string }; 
    Body: z.infer<typeof cancelBookingSchema> 
  }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const bookingId = request.params.id;
      const { cancelReason } = request.body;

      // Get existing booking to check authorization
      const existingBooking = await bookingCrudService.getBookingById(bookingId);
      if (!existingBooking) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Reserva no encontrada',
          statusCode: 404
        });
        return;
      }

      // Check authorization
      const canCancelBooking = 
        currentUser.role === UserRole.ADMIN ||
        existingBooking.clientId === currentUser.id ||
        existingBooking.providerId === currentUser.providerId;

      if (!canCancelBooking) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para cancelar esta reserva',
          statusCode: 403
        });
        return;
      }

      const cancelledBooking = await bookingCrudService.cancelBooking(
        bookingId, 
        currentUser.id, 
        cancelReason
      );
      
      reply.send({
        success: true,
        data: cancelledBooking
      });
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }
      
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Get available time slots
  fastify.get('/availability', {
    preHandler: [validateSchema(availableSlotsQuerySchema, 'query')],
    schema: {
      tags: ['Bookings'],
      summary: 'Get available time slots',
      description: 'Get available time slots for a provider, service, and date',
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          serviceId: { type: 'string' },
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
        },
        required: ['providerId', 'serviceId', 'date']
      }
    }
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof availableSlotsQuerySchema> }>, reply: FastifyReply) => {
    try {
      const { providerId, serviceId, date } = request.query;
      
      const result = await bookingCrudService.getAvailableTimeSlots(providerId, serviceId, date);
      
      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }
      
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Get booking statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Bookings'],
      summary: 'Get booking statistics',
      description: 'Get booking statistics and metrics',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { providerId?: string } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { providerId } = request.query;

      // Check authorization for provider-specific stats
      if (providerId && currentUser.role !== UserRole.ADMIN && currentUser.providerId !== providerId) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para ver estas estadísticas',
          statusCode: 403
        });
        return;
      }

      // Apply restrictions based on user role
      let finalProviderId = providerId;
      if (currentUser.role === UserRole.PROVIDER) {
        finalProviderId = currentUser.providerId;
      }

      const stats = await bookingCrudService.getBookingStats(finalProviderId);
      
      reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });

  // Delete booking (Admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, validateSchema(bookingIdParamSchema, 'params')],
    schema: {
      tags: ['Bookings'],
      summary: 'Delete booking',
      description: 'Delete a booking (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden eliminar reservas',
          statusCode: 403
        });
        return;
      }

      await bookingCrudService.deleteBooking(request.params.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Reserva eliminada correctamente'
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: error.message,
          statusCode: 400
        });
        return;
      }
      
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500
      });
    }
  });
};

export default bookingsCrudRoutes;