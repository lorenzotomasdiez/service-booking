import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../services/database';
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  GetServiceSchema,
  ServiceSearchSchema,
  ServiceAvailabilitySchema,
  ServicePhotoUploadSchema,
  CreateServiceCategorySchema,
  UpdateServiceCategorySchema,
  ServiceResponse,
  ServiceListResponse,
  ServiceAvailabilityResponse,
  ServiceCategoryResponse
} from '../schemas/services';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: any;
  }
}

// Helper function to calculate available time slots
const calculateAvailableSlots = (
  workingHours: any,
  existingBookings: any[],
  serviceDuration: number,
  date: string
) => {
  const slots = [];
  
  if (!workingHours || !workingHours.isWorkingDay) {
    return {
      availableSlots: [],
      workingHours: { start: '00:00', end: '00:00', isWorkingDay: false },
      blockedSlots: []
    };
  }

  const startHour = parseInt(workingHours.start.split(':')[0]);
  const startMinute = parseInt(workingHours.start.split(':')[1]);
  const endHour = parseInt(workingHours.end.split(':')[0]);
  const endMinute = parseInt(workingHours.end.split(':')[1]);

  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // Generate 15-minute slots
  for (let time = startTime; time <= endTime - serviceDuration; time += 15) {
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const slotEndTime = time + serviceDuration;
    const endHourSlot = Math.floor(slotEndTime / 60);
    const endMinuteSlot = slotEndTime % 60;
    const slotEnd = `${endHourSlot.toString().padStart(2, '0')}:${endMinuteSlot.toString().padStart(2, '0')}`;

    // Check if slot conflicts with existing bookings
    const isAvailable = !existingBookings.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const slotStartDate = new Date(`${date}T${slotStart}:00`);
      const slotEndDate = new Date(`${date}T${slotEnd}:00`);

      return (slotStartDate < bookingEnd && slotEndDate > bookingStart);
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable
    });
  }

  return {
    availableSlots: slots,
    workingHours: {
      start: workingHours.start,
      end: workingHours.end,
      isWorkingDay: true
    },
    blockedSlots: existingBookings.map(booking => ({
      startTime: new Date(booking.startTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: new Date(booking.endTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      reason: 'Existing booking'
    }))
  };
};

export default async function servicesRoutes(fastify: FastifyInstance) {
  
  // Service Categories Management
  
  // GET /api/services/categories - List all categories
  fastify.get('/categories', {
    schema: {
      tags: ['Services'],
      summary: 'List service categories',
      description: 'Get all service categories with optional filtering',
      querystring: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean', default: true },
          includeCount: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: ServiceCategoryResponse },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: { isActive?: boolean; includeCount?: boolean }
  }>, reply: FastifyReply) => {
    const { isActive = true, includeCount = false } = request.query;

    const categories = await prisma.serviceCategory.findMany({
      where: { isActive },
      include: includeCount ? { _count: { select: { services: true } } } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    });

    return reply.send({
      data: categories,
      total: categories.length
    });
  });

  // POST /api/services/categories - Create category (Admin only)
  fastify.post('/categories', {
    schema: {
      tags: ['Services'],
      summary: 'Create service category',
      description: 'Create a new service category (Admin only)',
      security: [{ bearerAuth: [] }],
      ...CreateServiceCategorySchema,
      response: {
        201: ServiceCategoryResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Body: {
      name: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  }>, reply: FastifyReply) => {
    const { role } = request.user as any;
    
    if (role !== 'ADMIN') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo administradores pueden crear categorías'
      });
    }

    const category = await prisma.serviceCategory.create({
      data: request.body
    });

    return reply.code(201).send(category);
  });

  // PUT /api/services/categories/:id - Update category (Admin only)
  fastify.put('/categories/:id', {
    schema: {
      tags: ['Services'],
      summary: 'Update service category',
      description: 'Update a service category (Admin only)',
      security: [{ bearerAuth: [] }],
      ...UpdateServiceCategorySchema,
      response: {
        200: ServiceCategoryResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: Partial<{
      name: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }>
  }>, reply: FastifyReply) => {
    const { role } = request.user as any;
    
    if (role !== 'ADMIN') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo administradores pueden actualizar categorías'
      });
    }

    const category = await prisma.serviceCategory.update({
      where: { id: request.params.id },
      data: request.body
    });

    return reply.send(category);
  });

  // DELETE /api/services/categories/:id - Delete category (Admin only)
  fastify.delete('/categories/:id', {
    schema: {
      tags: ['Services'],
      summary: 'Delete service category',
      description: 'Delete a service category (Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: { type: 'null' }
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { role } = request.user as any;
    
    if (role !== 'ADMIN') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo administradores pueden eliminar categorías'
      });
    }

    await prisma.serviceCategory.delete({
      where: { id: request.params.id }
    });

    return reply.code(204).send();
  });

  // Service Management

  // GET /api/services/search - Search services
  fastify.get('/search', {
    schema: {
      tags: ['Services'],
      summary: 'Search services',
      description: 'Search and filter services with pagination',
      ...ServiceSearchSchema,
      response: {
        200: ServiceListResponse
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      q?: string;
      categoryId?: string;
      providerId?: string;
      minPrice?: number;
      maxPrice?: number;
      minDuration?: number;
      maxDuration?: number;
      tags?: string;
      sortBy?: 'price' | 'duration' | 'name' | 'created' | 'popularity';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
      isActive?: boolean;
    }
  }>, reply: FastifyReply) => {
    const {
      q,
      categoryId,
      providerId,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      tags,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
      isActive = true
    } = request.query;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = { isActive };
    
    if (categoryId) where.categoryId = categoryId;
    if (providerId) where.providerId = providerId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Decimal(maxPrice);
    }
    if (minDuration !== undefined || maxDuration !== undefined) {
      where.duration = {};
      if (minDuration !== undefined) where.duration.gte = minDuration;
      if (maxDuration !== undefined) where.duration.lte = maxDuration;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } }
      ];
    }
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'duration':
        orderBy = { duration: sortOrder };
        break;
      case 'created':
        orderBy = { createdAt: sortOrder };
        break;
      case 'popularity':
        orderBy = { bookings: { _count: sortOrder } };
        break;
      default:
        orderBy = { name: sortOrder };
    }

    const [services, total, categories, priceStats, durationStats] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              businessName: true,
              city: true,
              province: true
            }
          },
          _count: {
            select: { bookings: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.service.count({ where }),
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        include: { _count: { select: { services: true } } }
      }),
      prisma.service.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.service.aggregate({
        where: { isActive: true },
        _min: { duration: true },
        _max: { duration: true }
      })
    ]);

    return reply.send({
      data: services.map(service => ({
        ...service,
        price: service.price.toNumber(),
        depositAmount: service.depositAmount?.toNumber()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        categories,
        priceRange: {
          min: priceStats._min.price?.toNumber() || 0,
          max: priceStats._max.price?.toNumber() || 0
        },
        durationRange: {
          min: durationStats._min.duration || 0,
          max: durationStats._max.duration || 0
        }
      }
    });
  });

  // GET /api/services/:id - Get service by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Services'],
      summary: 'Get service by ID',
      description: 'Get detailed information about a specific service',
      ...GetServiceSchema,
      response: {
        200: ServiceResponse
      }
    }
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            city: true,
            province: true
          }
        },
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!service) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Servicio no encontrado'
      });
    }

    return reply.send({
      ...service,
      price: service.price.toNumber(),
      depositAmount: service.depositAmount?.toNumber()
    });
  });

  // POST /api/services - Create service (Provider only)
  fastify.post('/', {
    schema: {
      tags: ['Services'],
      summary: 'Create service',
      description: 'Create a new service (Provider only)',
      security: [{ bearerAuth: [] }],
      ...CreateServiceSchema,
      response: {
        201: ServiceResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Body: {
      name: string;
      description?: string;
      duration: number;
      price: number;
      categoryId?: string;
      depositRequired?: boolean;
      depositAmount?: number;
      bufferTimeBefore?: number;
      bufferTimeAfter?: number;
      maxAdvanceBookingDays?: number;
      allowSameDayBooking?: boolean;
      requiresConsultation?: boolean;
      tags?: string[];
      sortOrder?: number;
      isActive?: boolean;
    }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    
    if (role !== 'PROVIDER') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo proveedores pueden crear servicios'
      });
    }

    // Get provider ID
    const provider = await prisma.provider.findUnique({
      where: { userId }
    });

    if (!provider) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Perfil de proveedor no encontrado'
      });
    }

    const service = await prisma.service.create({
      data: {
        ...request.body,
        price: new Decimal(request.body.price),
        depositAmount: request.body.depositAmount ? new Decimal(request.body.depositAmount) : undefined,
        providerId: provider.id
      },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            city: true,
            province: true
          }
        }
      }
    });

    return reply.code(201).send({
      ...service,
      price: service.price.toNumber(),
      depositAmount: service.depositAmount?.toNumber()
    });
  });

  // PUT /api/services/:id - Update service (Provider/Admin only)
  fastify.put('/:id', {
    schema: {
      tags: ['Services'],
      summary: 'Update service',
      description: 'Update a service (Provider/Admin only)',
      security: [{ bearerAuth: [] }],
      ...UpdateServiceSchema,
      response: {
        200: ServiceResponse
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: Partial<{
      name: string;
      description?: string;
      duration: number;
      price: number;
      categoryId?: string;
      depositRequired?: boolean;
      depositAmount?: number;
      bufferTimeBefore?: number;
      bufferTimeAfter?: number;
      maxAdvanceBookingDays?: number;
      allowSameDayBooking?: boolean;
      requiresConsultation?: boolean;
      tags?: string[];
      sortOrder?: number;
      isActive?: boolean;
    }>
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    
    // Check if service exists and user has permission
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!service) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Servicio no encontrado'
      });
    }

    if (role !== 'ADMIN' && service.provider.userId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para actualizar este servicio'
      });
    }

    const updateData: any = { ...request.body };
    if (updateData.price) updateData.price = new Decimal(updateData.price);
    if (updateData.depositAmount) updateData.depositAmount = new Decimal(updateData.depositAmount);

    const updatedService = await prisma.service.update({
      where: { id: request.params.id },
      data: updateData,
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            city: true,
            province: true
          }
        }
      }
    });

    return reply.send({
      ...updatedService,
      price: updatedService.price.toNumber(),
      depositAmount: updatedService.depositAmount?.toNumber()
    });
  });

  // DELETE /api/services/:id - Delete service (Provider/Admin only)
  fastify.delete('/:id', {
    schema: {
      tags: ['Services'],
      summary: 'Delete service',
      description: 'Delete a service (Provider/Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: { type: 'null' }
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    
    // Check if service exists and user has permission
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!service) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Servicio no encontrado'
      });
    }

    if (role !== 'ADMIN' && service.provider.userId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para eliminar este servicio'
      });
    }

    await prisma.service.delete({
      where: { id: request.params.id }
    });

    return reply.code(204).send();
  });

  // GET /api/services/:id/availability - Check service availability
  fastify.get('/:id/availability', {
    schema: {
      tags: ['Services'],
      summary: 'Check service availability',
      description: 'Get available time slots for a service on a specific date',
      ...ServiceAvailabilitySchema,
      response: {
        200: ServiceAvailabilityResponse
      }
    }
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Querystring: { date: string; duration?: number }
  }>, reply: FastifyReply) => {
    const { date, duration } = request.query;
    
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!service) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Servicio no encontrado'
      });
    }

    const serviceDuration = duration || service.duration;
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get provider's working hours for the day
    const workingHours = service.provider.workingHours as any;
    const dayWorkingHours = workingHours ? workingHours[dayOfWeek] : null;

    // Get existing bookings for the date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        providerId: service.providerId,
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    });

    const availability = calculateAvailableSlots(
      dayWorkingHours,
      existingBookings,
      serviceDuration,
      date
    );

    return reply.send({
      serviceId: service.id,
      date,
      ...availability
    });
  });

  // POST /api/services/:id/photos - Upload service photos (Provider only)
  fastify.post('/:id/photos', {
    schema: {
      tags: ['Services'],
      summary: 'Upload service photos',
      description: 'Upload photos for a service (Provider only)',
      security: [{ bearerAuth: [] }],
      ...ServicePhotoUploadSchema,
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            images: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { sub: userId, role } = request.user as any;
    
    // Check if service exists and user has permission
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
      include: { provider: true }
    });

    if (!service) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Servicio no encontrado'
      });
    }

    if (role !== 'ADMIN' && service.provider.userId !== userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para subir fotos a este servicio'
      });
    }

    // Handle multipart file upload
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No se encontró archivo para subir'
      });
    }

    // Validate file type
    if (!data.mimetype.startsWith('image/')) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Solo se permiten archivos de imagen'
      });
    }

    // TODO: Implement actual file upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll simulate the upload
    const filename = `service-${service.id}-${Date.now()}.${data.mimetype.split('/')[1]}`;
    const imageUrl = `${process.env.STORAGE_BASE_URL || 'https://storage.barberpro.com.ar'}/services/${filename}`;

    // Update service with new image
    const updatedService = await prisma.service.update({
      where: { id: request.params.id },
      data: {
        images: {
          push: imageUrl
        }
      }
    });

    return reply.send({
      images: updatedService.images,
      message: 'Imagen subida exitosamente'
    });
  });
}