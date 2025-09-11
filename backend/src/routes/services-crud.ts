import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { serviceService, serviceCategoryService } from '../services/service';
import { validateSchema } from '../middleware/validation';
import { z } from 'zod';
import { argentinaValidation, commonSchemas } from '../middleware/validation';

// Service schemas
const createServiceSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  description: z.string().max(500, 'Descripción demasiado larga').optional(),
  duration: z.number().int().min(5, 'Duración mínima: 5 minutos').max(480, 'Duración máxima: 8 horas'),
  price: argentinaValidation.price,
  providerId: z.string().cuid('Provider ID inválido'),
  categoryId: z.string().cuid('Category ID inválido').optional(),
  depositRequired: z.boolean().default(false),
  depositAmount: argentinaValidation.price.optional(),
  bufferTimeBefore: z.number().int().min(0).max(60).default(5),
  bufferTimeAfter: z.number().int().min(0).max(60).default(10),
  maxAdvanceBookingDays: z.number().int().min(1).max(365).default(30),
  allowSameDayBooking: z.boolean().default(true),
  requiresConsultation: z.boolean().default(false),
  images: z.array(z.string().url('URL de imagen inválida')).default([]),
  tags: z.array(z.string().max(50, 'Tag demasiado largo')).default([]),
  sortOrder: z.number().int().min(0).default(0)
});

const updateServiceSchema = createServiceSchema.partial().omit({ providerId: true });

const listServicesQuerySchema = commonSchemas.pagination.extend({
  providerId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  city: z.string().max(100).optional(),
  province: argentinaValidation.province.optional(),
  sortBy: z.enum(['name', 'price', 'duration', 'createdAt', 'sortOrder']).default('sortOrder')
});

const serviceIdParamSchema = commonSchemas.id;

// Service Category schemas
const createCategorySchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50, 'Nombre demasiado largo'),
  description: z.string().max(200, 'Descripción demasiado larga').optional(),
  icon: z.string().max(100, 'Icono demasiado largo').optional(),
  sortOrder: z.number().int().min(0).default(0)
});

const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional()
});

const servicesCrudRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

  // ===== SERVICE ROUTES =====

  // Create new service
  fastify.post('/services', {
    preHandler: [fastify.authenticate, validateSchema(createServiceSchema, 'body')],
    schema: {
      tags: ['Services'],
      summary: 'Create new service',
      description: 'Create a new service (provider or admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          duration: { type: 'number', minimum: 5, maximum: 480 },
          price: { type: 'number', minimum: 0 },
          providerId: { type: 'string' },
          categoryId: { type: 'string' },
          depositRequired: { type: 'boolean', default: false },
          depositAmount: { type: 'number', minimum: 0 },
          bufferTimeBefore: { type: 'number', minimum: 0, maximum: 60, default: 5 },
          bufferTimeAfter: { type: 'number', minimum: 0, maximum: 60, default: 10 },
          maxAdvanceBookingDays: { type: 'number', minimum: 1, maximum: 365, default: 30 },
          allowSameDayBooking: { type: 'boolean', default: true },
          requiresConsultation: { type: 'boolean', default: false },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
          tags: { type: 'array', items: { type: 'string' } },
          sortOrder: { type: 'number', minimum: 0, default: 0 }
        },
        required: ['name', 'duration', 'price', 'providerId']
      }
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof createServiceSchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const serviceData = request.body;

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROVIDER) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo proveedores y administradores pueden crear servicios',
          statusCode: 403
        });
        return;
      }

      // Providers can only create services for themselves
      if (currentUser.role === UserRole.PROVIDER && serviceData.providerId !== currentUser.providerId) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo puedes crear servicios para tu propio negocio',
          statusCode: 403
        });
        return;
      }

      const service = await serviceService.createService(serviceData);
      
      reply.code(201).send({
        success: true,
        data: service
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

  // Get service by ID
  fastify.get('/services/:id', {
    preHandler: [validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Get service by ID',
      description: 'Get detailed service information by ID',
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
      const service = await serviceService.getServiceById(request.params.id);
      
      if (!service) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Servicio no encontrado',
          statusCode: 404
        });
        return;
      }

      reply.send({
        success: true,
        data: service
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

  // Update service
  fastify.put('/services/:id', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params'), validateSchema(updateServiceSchema, 'body')],
    schema: {
      tags: ['Services'],
      summary: 'Update service',
      description: 'Update service information (provider owner or admin only)',
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
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          duration: { type: 'number', minimum: 5, maximum: 480 },
          price: { type: 'number', minimum: 0 },
          categoryId: { type: 'string' },
          isActive: { type: 'boolean' },
          depositRequired: { type: 'boolean' },
          depositAmount: { type: 'number', minimum: 0 },
          bufferTimeBefore: { type: 'number', minimum: 0, maximum: 60 },
          bufferTimeAfter: { type: 'number', minimum: 0, maximum: 60 },
          maxAdvanceBookingDays: { type: 'number', minimum: 1, maximum: 365 },
          allowSameDayBooking: { type: 'boolean' },
          requiresConsultation: { type: 'boolean' },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
          tags: { type: 'array', items: { type: 'string' } },
          sortOrder: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateServiceSchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const serviceId = request.params.id;
      const updateData = request.body;

      // Get service to check ownership
      const existingService = await serviceService.getServiceById(serviceId);
      if (!existingService) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Servicio no encontrado',
          statusCode: 404
        });
        return;
      }

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && 
          (currentUser.role !== UserRole.PROVIDER || existingService.providerId !== currentUser.providerId)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para modificar este servicio',
          statusCode: 403
        });
        return;
      }

      const updatedService = await serviceService.updateService(serviceId, updateData);
      
      reply.send({
        success: true,
        data: updatedService
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

  // List services
  fastify.get('/services', {
    preHandler: [validateSchema(listServicesQuerySchema, 'query')],
    schema: {
      tags: ['Services'],
      summary: 'List services',
      description: 'List services with pagination and filters',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          providerId: { type: 'string' },
          categoryId: { type: 'string' },
          isActive: { type: 'boolean' },
          search: { type: 'string', maxLength: 100 },
          minPrice: { type: 'number', minimum: 0 },
          maxPrice: { type: 'number', minimum: 0 },
          city: { type: 'string', maxLength: 100 },
          province: { type: 'string' },
          sortBy: { type: 'string', enum: ['name', 'price', 'duration', 'createdAt', 'sortOrder'], default: 'sortOrder' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof listServicesQuerySchema> }>, reply: FastifyReply) => {
    try {
      const result = await serviceService.listServices(request.query);
      
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

  // Get services by provider
  fastify.get('/providers/:providerId/services', {
    preHandler: [validateSchema(z.object({ providerId: z.string().cuid() }), 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Get services by provider',
      description: 'Get all services for a specific provider',
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
          includeInactive: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { providerId: string }; 
    Querystring: { includeInactive?: boolean } 
  }>, reply: FastifyReply) => {
    try {
      const { providerId } = request.params;
      const { includeInactive = false } = request.query;

      const services = await serviceService.getServicesByProvider(providerId, includeInactive);
      
      reply.send({
        success: true,
        data: services
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

  // Delete service
  fastify.delete('/services/:id', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Delete service',
      description: 'Delete a service (provider owner or admin only)',
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
      const serviceId = request.params.id;

      // Get service to check ownership
      const existingService = await serviceService.getServiceById(serviceId);
      if (!existingService) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Servicio no encontrado',
          statusCode: 404
        });
        return;
      }

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && 
          (currentUser.role !== UserRole.PROVIDER || existingService.providerId !== currentUser.providerId)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para eliminar este servicio',
          statusCode: 403
        });
        return;
      }

      await serviceService.deleteService(serviceId);
      
      reply.send({
        success: true,
        data: {
          message: 'Servicio eliminado correctamente'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('reservas activas')) {
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

  // Get service statistics
  fastify.get('/services/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Services'],
      summary: 'Get service statistics',
      description: 'Get service statistics and metrics',
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

      const stats = await serviceService.getServiceStats(providerId);
      
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

  // ===== SERVICE CATEGORY ROUTES =====

  // Create service category (Admin only)
  fastify.post('/categories', {
    preHandler: [fastify.authenticate, validateSchema(createCategorySchema, 'body')],
    schema: {
      tags: ['Service Categories'],
      summary: 'Create service category',
      description: 'Create a new service category (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50 },
          description: { type: 'string', maxLength: 200 },
          icon: { type: 'string', maxLength: 100 },
          sortOrder: { type: 'number', minimum: 0, default: 0 }
        },
        required: ['name']
      }
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof createCategorySchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden crear categorías',
          statusCode: 403
        });
        return;
      }

      const category = await serviceCategoryService.createCategory(request.body);
      
      reply.code(201).send({
        success: true,
        data: category
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

  // Get all categories
  fastify.get('/categories', {
    schema: {
      tags: ['Service Categories'],
      summary: 'Get all service categories',
      description: 'Get all service categories with service counts',
      querystring: {
        type: 'object',
        properties: {
          includeInactive: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { includeInactive?: boolean } }>, reply: FastifyReply) => {
    try {
      const { includeInactive = false } = request.query;
      const categories = await serviceCategoryService.getAllCategories(includeInactive);
      
      reply.send({
        success: true,
        data: categories
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

  // Get category by ID
  fastify.get('/categories/:id', {
    preHandler: [validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Service Categories'],
      summary: 'Get category by ID',
      description: 'Get detailed category information including services',
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
      const category = await serviceCategoryService.getCategoryById(request.params.id);
      
      if (!category) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Categoría no encontrada',
          statusCode: 404
        });
        return;
      }

      reply.send({
        success: true,
        data: category
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

  // Update category (Admin only)
  fastify.put('/categories/:id', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params'), validateSchema(updateCategorySchema, 'body')],
    schema: {
      tags: ['Service Categories'],
      summary: 'Update service category',
      description: 'Update service category information (admin only)',
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
          name: { type: 'string', minLength: 2, maxLength: 50 },
          description: { type: 'string', maxLength: 200 },
          icon: { type: 'string', maxLength: 100 },
          sortOrder: { type: 'number', minimum: 0 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateCategorySchema> }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden modificar categorías',
          statusCode: 403
        });
        return;
      }

      const category = await serviceCategoryService.updateCategory(request.params.id, request.body);
      
      reply.send({
        success: true,
        data: category
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

  // Delete category (Admin only)
  fastify.delete('/categories/:id', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Service Categories'],
      summary: 'Delete service category',
      description: 'Delete a service category (admin only)',
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
          message: 'Solo los administradores pueden eliminar categorías',
          statusCode: 403
        });
        return;
      }

      await serviceCategoryService.deleteCategory(request.params.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Categoría eliminada correctamente'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('servicios asociados')) {
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

  // ===== ADVANCED SERVICE MANAGEMENT =====

  // Service approval/verification system
  fastify.patch('/services/:id/approve', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Approve service',
      description: 'Approve a service for public listing (admin only)',
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
          message: 'Solo los administradores pueden aprobar servicios',
          statusCode: 403
        });
        return;
      }

      await serviceService.approveService(request.params.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Servicio aprobado correctamente'
        }
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

  // Service rejection
  fastify.patch('/services/:id/reject', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Reject service',
      description: 'Reject a service with reason (admin only)',
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
          reason: { type: 'string', maxLength: 500 }
        },
        required: ['reason']
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { reason: string } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden rechazar servicios',
          statusCode: 403
        });
        return;
      }

      await serviceService.rejectService(request.params.id, request.body.reason);
      
      reply.send({
        success: true,
        data: {
          message: 'Servicio rechazado correctamente'
        }
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

  // Service availability management
  fastify.put('/services/:id/availability', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Update service availability',
      description: 'Update service availability schedule (provider or admin only)',
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
          workingHours: {
            type: 'object',
            properties: {
              monday: { type: 'object' },
              tuesday: { type: 'object' },
              wednesday: { type: 'object' },
              thursday: { type: 'object' },
              friday: { type: 'object' },
              saturday: { type: 'object' },
              sunday: { type: 'object' }
            }
          },
          blackoutDates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                reason: { type: 'string' }
              }
            }
          },
          bufferTimeBefore: { type: 'number', minimum: 0, maximum: 60 },
          bufferTimeAfter: { type: 'number', minimum: 0, maximum: 60 },
          maxAdvanceBookingDays: { type: 'number', minimum: 1, maximum: 365 },
          allowSameDayBooking: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { id } = request.params;
      const availabilityData = request.body;

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROVIDER) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo proveedores y administradores pueden gestionar disponibilidad',
          statusCode: 403
        });
        return;
      }

      await serviceService.updateServiceAvailability(id, availabilityData, currentUser.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Disponibilidad del servicio actualizada correctamente'
        }
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

  // Service pricing and discount management
  fastify.put('/services/:id/pricing', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Update service pricing',
      description: 'Update service pricing and discount information (provider or admin only)',
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
          price: { type: 'number', minimum: 0 },
          depositRequired: { type: 'boolean' },
          depositAmount: { type: 'number', minimum: 0 },
          discounts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['percentage', 'fixed'] },
                value: { type: 'number', minimum: 0 },
                conditions: {
                  type: 'object',
                  properties: {
                    minBookings: { type: 'number' },
                    firstTimeClient: { type: 'boolean' },
                    validFrom: { type: 'string', format: 'date' },
                    validTo: { type: 'string', format: 'date' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { id } = request.params;
      const pricingData = request.body;

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROVIDER) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo proveedores y administradores pueden gestionar precios',
          statusCode: 403
        });
        return;
      }

      await serviceService.updateServicePricing(id, pricingData, currentUser.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Precios del servicio actualizados correctamente'
        }
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

  // Bulk service operations
  fastify.patch('/services/bulk/activate', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Services'],
      summary: 'Bulk activate services',
      description: 'Activate multiple services at once (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          serviceIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 50
          }
        },
        required: ['serviceIds']
      }
    }
  }, async (request: FastifyRequest<{ Body: { serviceIds: string[] } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden realizar operaciones masivas',
          statusCode: 403
        });
        return;
      }

      const result = await serviceService.bulkActivateServices(request.body.serviceIds);
      
      reply.send({
        success: true,
        data: {
          message: `${result.updated} servicios activados correctamente`,
          updated: result.updated,
          failed: result.failed
        }
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

  // Get service analytics
  fastify.get('/services/:id/analytics', {
    preHandler: [fastify.authenticate, validateSchema(serviceIdParamSchema, 'params')],
    schema: {
      tags: ['Services'],
      summary: 'Get service analytics',
      description: 'Get analytics data for a service (provider or admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month', 'quarter', 'year'], default: 'month' },
          fromDate: { type: 'string', format: 'date' },
          toDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: any }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { id } = request.params;

      // Check authorization
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROVIDER) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo proveedores y administradores pueden ver analíticas',
          statusCode: 403
        });
        return;
      }

      const analytics = await serviceService.getServiceAnalytics(id, request.query, currentUser.id);
      
      reply.send({
        success: true,
        data: analytics
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

  // Advanced service search with filters
  fastify.get('/services/search/advanced', {
    schema: {
      tags: ['Services'],
      summary: 'Advanced service search',
      description: 'Search services with advanced filters and sorting',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', maxLength: 100 },
          categoryId: { type: 'string' },
          city: { type: 'string', maxLength: 100 },
          province: { type: 'string' },
          minPrice: { type: 'number', minimum: 0 },
          maxPrice: { type: 'number', minimum: 0 },
          minDuration: { type: 'number', minimum: 0 },
          maxDuration: { type: 'number', minimum: 0 },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          availableToday: { type: 'boolean' },
          availableDate: { type: 'string', format: 'date' },
          tags: { type: 'string' }, // comma-separated
          sortBy: { type: 'string', enum: ['price', 'rating', 'duration', 'popularity', 'distance'], default: 'popularity' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 12 },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          radius: { type: 'number', default: 10 } // km
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const result = await serviceService.advancedServiceSearch(request.query);
      
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

  // Get popular services
  fastify.get('/services/popular', {
    schema: {
      tags: ['Services'],
      summary: 'Get popular services',
      description: 'Get most popular services based on bookings and ratings',
      querystring: {
        type: 'object',
        properties: {
          categoryId: { type: 'string' },
          city: { type: 'string' },
          province: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 20, default: 10 },
          period: { type: 'string', enum: ['week', 'month', 'quarter'], default: 'month' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const services = await serviceService.getPopularServices(request.query);
      
      reply.send({
        success: true,
        data: services
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
};

export default servicesCrudRoutes;