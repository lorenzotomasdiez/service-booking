import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UserResponse } from '../schemas/auth';
import { ArgentinaDNI, ArgentinaPhone, ArgentinaCUIT } from '../schemas/argentina';
import { prisma } from '../services/database';

const usersRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  
  // Get user by ID (Admin or own profile)
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Get user information by ID (admin only or own profile)',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        id: Type.String({ description: 'User ID' })
      }),
      response: {
        200: UserResponse,
        401: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        }),
        403: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        }),
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        })
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const currentUserId = (request.user as any).userId;
    const currentUserRole = (request.user as any).role;
    const requestedUserId = request.params.id;

    // Check if user can access this profile
    if (currentUserId !== requestedUserId && currentUserRole !== 'ADMIN') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'No tienes permisos para acceder a este perfil',
        statusCode: 403
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: requestedUserId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          dni: true,
          cuit: true,
          timezone: true,
          locale: true,
          avatar: true,
          birthDate: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        reply.code(404).send({
          error: 'User Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
        return;
      }

      reply.send({
        ...user,
        birthDate: user.birthDate?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener usuario',
        statusCode: 500
      });
    }
  });

  // List users (Admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'List users',
      description: 'Get paginated list of users (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        role: Type.Optional(Type.Union([
          Type.Literal('CLIENT'),
          Type.Literal('PROVIDER'),
          Type.Literal('ADMIN')
        ])),
        search: Type.Optional(Type.String({ minLength: 1 })),
        isActive: Type.Optional(Type.Boolean())
      }),
      response: {
        200: Type.Object({
          users: Type.Array(UserResponse),
          pagination: Type.Object({
            page: Type.Number(),
            limit: Type.Number(),
            total: Type.Number(),
            totalPages: Type.Number()
          })
        }),
        401: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        }),
        403: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        })
      }
    }
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      page?: number; 
      limit?: number; 
      role?: 'CLIENT' | 'PROVIDER' | 'ADMIN';
      search?: string;
      isActive?: boolean;
    } 
  }>, reply: FastifyReply) => {
    const currentUserRole = (request.user as any).role;

    // Check if user is admin
    if (currentUserRole !== 'ADMIN') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo los administradores pueden listar usuarios',
        statusCode: 403
      });
      return;
    }

    const { page = 1, limit = 20, role, search, isActive } = request.query;
    const skip = (page - 1) * limit;

    try {
      // Build where clause
      const where: any = {};
      
      if (role) {
        where.role = role;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get users and count
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            dni: true,
            cuit: true,
            timezone: true,
            locale: true,
            avatar: true,
            birthDate: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const formattedUsers = users.map(user => ({
        ...user,
        birthDate: user.birthDate?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }));

      reply.send({
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener usuarios',
        statusCode: 500
      });
    }
  });

  // Update user status (Admin only)
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Update user status',
      description: 'Activate or deactivate user account (admin only)',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        id: Type.String({ description: 'User ID' })
      }),
      body: Type.Object({
        isActive: Type.Boolean({ description: 'User active status' })
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          user: UserResponse
        }),
        401: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        }),
        403: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        }),
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        })
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { id: string }; 
    Body: { isActive: boolean } 
  }>, reply: FastifyReply) => {
    const currentUserRole = (request.user as any).role;
    const currentUserId = (request.user as any).userId;
    const targetUserId = request.params.id;

    // Check if user is admin
    if (currentUserRole !== 'ADMIN') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo los administradores pueden cambiar el estado de usuarios',
        statusCode: 403
      });
      return;
    }

    // Prevent admin from deactivating themselves
    if (currentUserId === targetUserId && !request.body.isActive) {
      reply.code(400).send({
        error: 'Bad Request',
        message: 'No puedes desactivar tu propia cuenta',
        statusCode: 400
      });
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: request.body.isActive },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          dni: true,
          cuit: true,
          timezone: true,
          locale: true,
          avatar: true,
          birthDate: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // If deactivating user, revoke all their refresh tokens
      if (!request.body.isActive) {
        await prisma.refreshToken.updateMany({
          where: { userId: targetUserId },
          data: { isRevoked: true }
        });
      }

      reply.send({
        message: `Usuario ${request.body.isActive ? 'activado' : 'desactivado'} exitosamente`,
        user: {
          ...user,
          birthDate: user.birthDate?.toISOString() || null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        reply.code(404).send({
          error: 'User Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
      } else {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Error al actualizar estado del usuario',
          statusCode: 500
        });
      }
    }
  });

  // Get user statistics (Admin only)
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get user statistics',
      description: 'Get user registration and activity statistics (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          total: Type.Number(),
          active: Type.Number(),
          inactive: Type.Number(),
          verified: Type.Number(),
          unverified: Type.Number(),
          byRole: Type.Object({
            CLIENT: Type.Number(),
            PROVIDER: Type.Number(),
            ADMIN: Type.Number()
          }),
          registrationsByMonth: Type.Array(Type.Object({
            month: Type.String(),
            count: Type.Number()
          }))
        }),
        401: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        }),
        403: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserRole = (request.user as any).role;

    // Check if user is admin
    if (currentUserRole !== 'ADMIN') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo los administradores pueden ver estadísticas',
        statusCode: 403
      });
      return;
    }

    try {
      const [
        total,
        active,
        verified,
        clientCount,
        providerCount,
        adminCount
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({ where: { role: 'CLIENT' } }),
        prisma.user.count({ where: { role: 'PROVIDER' } }),
        prisma.user.count({ where: { role: 'ADMIN' } })
      ]);

      // Get registrations by month for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const registrationsByMonth = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*)::int as count
        FROM users
        WHERE created_at >= ${twelveMonthsAgo}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `;

      reply.send({
        total,
        active,
        inactive: total - active,
        verified,
        unverified: total - verified,
        byRole: {
          CLIENT: clientCount,
          PROVIDER: providerCount,
          ADMIN: adminCount
        },
        registrationsByMonth
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener estadísticas',
        statusCode: 500
      });
    }
  });

  // GET /api/users/me - Get current user profile
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get current user profile',
      description: 'Get current authenticated user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: UserResponse
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;

    try {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          dni: true,
          cuit: true,
          timezone: true,
          locale: true,
          avatar: true,
          birthDate: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return reply.code(404).send({
          error: 'User Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
      }

      reply.send({
        ...user,
        birthDate: user.birthDate?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener perfil',
        statusCode: 500
      });
    }
  });

  // PUT /api/users/me - Update current user profile
  fastify.put('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Update current user profile',
      description: 'Update current authenticated user profile',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
        phone: Type.Optional(ArgentinaPhone),
        dni: Type.Optional(ArgentinaDNI),
        cuit: Type.Optional(ArgentinaCUIT),
        timezone: Type.Optional(Type.String()),
        locale: Type.Optional(Type.String()),
        birthDate: Type.Optional(Type.String({ format: 'date' }))
      }),
      response: {
        200: UserResponse
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      name?: string;
      phone?: string;
      dni?: string;
      cuit?: string;
      timezone?: string;
      locale?: string;
      birthDate?: string;
    }
  }>, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;

    try {
      const updateData: any = { ...request.body };
      if (updateData.birthDate) {
        updateData.birthDate = new Date(updateData.birthDate);
      }

      const user = await prisma.user.update({
        where: { id: currentUserId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          dni: true,
          cuit: true,
          timezone: true,
          locale: true,
          avatar: true,
          birthDate: true,
          createdAt: true,
          updatedAt: true
        }
      });

      reply.send({
        ...user,
        birthDate: user.birthDate?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        reply.code(409).send({
          error: 'Conflict',
          message: 'Ya existe un usuario con estos datos',
          statusCode: 409
        });
      } else {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Error al actualizar perfil',
          statusCode: 500
        });
      }
    }
  });

  // POST /api/users/me/avatar - Upload user avatar
  fastify.post('/me/avatar', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Upload user avatar',
      description: 'Upload avatar image for current user',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: Type.Object({
          avatar: Type.String(),
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;

    try {
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

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (data.file.readableLength > maxSize) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'El archivo es demasiado grande (máximo 2MB)'
        });
      }

      // TODO: Implement actual file upload to cloud storage
      const filename = `avatar-${currentUserId}-${Date.now()}.${data.mimetype.split('/')[1]}`;
      const avatarUrl = `${process.env.STORAGE_BASE_URL || 'https://storage.barberpro.com.ar'}/avatars/${filename}`;

      // Update user avatar
      const user = await prisma.user.update({
        where: { id: currentUserId },
        data: { avatar: avatarUrl },
        select: { avatar: true }
      });

      reply.send({
        avatar: user.avatar!,
        message: 'Avatar actualizado exitosamente'
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al subir avatar',
        statusCode: 500
      });
    }
  });

  // GET /api/users/me/provider - Get provider profile (Provider only)
  fastify.get('/me/provider', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get provider profile',
      description: 'Get current user provider profile (Provider only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          id: Type.String(),
          userId: Type.String(),
          businessName: Type.String(),
          description: Type.Optional(Type.String()),
          address: Type.String(),
          city: Type.String(),
          province: Type.String(),
          country: Type.String(),
          postalCode: Type.Optional(Type.String()),
          businessPhone: Type.Optional(Type.String()),
          businessEmail: Type.Optional(Type.String()),
          website: Type.Optional(Type.String()),
          taxId: Type.Optional(Type.String()),
          businessType: Type.Optional(Type.String()),
          workingHours: Type.Optional(Type.Any()),
          isVerified: Type.Boolean(),
          isActive: Type.Boolean(),
          latitude: Type.Optional(Type.Number()),
          longitude: Type.Optional(Type.Number()),
          logo: Type.Optional(Type.String()),
          coverImage: Type.Optional(Type.String()),
          images: Type.Array(Type.String()),
          createdAt: Type.String({ format: 'date-time' }),
          updatedAt: Type.String({ format: 'date-time' })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;
    const userRole = (request.user as any).role;

    if (userRole !== 'PROVIDER') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo proveedores pueden acceder a este perfil'
      });
    }

    try {
      const provider = await prisma.provider.findUnique({
        where: { userId: currentUserId }
      });

      if (!provider) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Perfil de proveedor no encontrado'
        });
      }

      reply.send({
        ...provider,
        createdAt: provider.createdAt.toISOString(),
        updatedAt: provider.updatedAt.toISOString()
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener perfil de proveedor'
      });
    }
  });

  // PUT /api/users/me/provider - Update provider profile (Provider only)
  fastify.put('/me/provider', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Update provider profile',
      description: 'Update current user provider profile (Provider only)',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        businessName: Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        address: Type.Optional(Type.String({ minLength: 5, maxLength: 200 })),
        city: Type.Optional(Type.String({ minLength: 2, maxLength: 50 })),
        province: Type.Optional(Type.String({ minLength: 2, maxLength: 50 })),
        postalCode: Type.Optional(Type.String()),
        businessPhone: Type.Optional(ArgentinaPhone),
        businessEmail: Type.Optional(Type.String({ format: 'email' })),
        website: Type.Optional(Type.String({ format: 'uri' })),
        taxId: Type.Optional(Type.String()),
        businessType: Type.Optional(Type.String()),
        workingHours: Type.Optional(Type.Any()),
        latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90 })),
        longitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180 }))
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          provider: Type.Any()
        })
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      businessName?: string;
      description?: string;
      address?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      businessPhone?: string;
      businessEmail?: string;
      website?: string;
      taxId?: string;
      businessType?: string;
      workingHours?: any;
      latitude?: number;
      longitude?: number;
    }
  }>, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;
    const userRole = (request.user as any).role;

    if (userRole !== 'PROVIDER') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Solo proveedores pueden actualizar este perfil'
      });
    }

    try {
      const provider = await prisma.provider.update({
        where: { userId: currentUserId },
        data: request.body
      });

      reply.send({
        message: 'Perfil de proveedor actualizado exitosamente',
        provider: {
          ...provider,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Perfil de proveedor no encontrado'
        });
      } else {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Error al actualizar perfil de proveedor'
        });
      }
    }
  });

  // GET /api/users/me/bookings - Get user bookings
  fastify.get('/me/bookings', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get user bookings',
      description: 'Get current user bookings with pagination',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        status: Type.Optional(Type.Union([
          Type.Literal('PENDING'),
          Type.Literal('CONFIRMED'),
          Type.Literal('COMPLETED'),
          Type.Literal('CANCELLED'),
          Type.Literal('NO_SHOW')
        ])),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('startTime'),
          Type.Literal('created'),
          Type.Literal('status')
        ], { default: 'startTime' })),
        sortOrder: Type.Optional(Type.Union([
          Type.Literal('asc'),
          Type.Literal('desc')
        ], { default: 'desc' }))
      }),
      response: {
        200: Type.Object({
          bookings: Type.Array(Type.Any()),
          pagination: Type.Object({
            page: Type.Number(),
            limit: Type.Number(),
            total: Type.Number(),
            totalPages: Type.Number()
          }),
          stats: Type.Object({
            total: Type.Number(),
            upcoming: Type.Number(),
            completed: Type.Number(),
            cancelled: Type.Number()
          })
        })
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    }
  }>, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;
    const { status, page = 1, limit = 10, sortBy = 'startTime', sortOrder = 'desc' } = request.query;
    const skip = (page - 1) * limit;

    try {
      // Build where clause
      const where: any = { clientId: currentUserId };
      if (status) where.status = status;

      // Build order by
      const orderBy: any = {};
      if (sortBy === 'created') {
        orderBy.createdAt = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      const [bookings, total, stats] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
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
                businessPhone: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.booking.count({ where }),
        prisma.booking.groupBy({
          by: ['status'],
          where: { clientId: currentUserId },
          _count: { id: true }
        })
      ]);

      const statsObj = {
        total: stats.reduce((sum, s) => sum + s._count.id, 0),
        upcoming: stats.filter(s => ['PENDING', 'CONFIRMED'].includes(s.status)).reduce((sum, s) => sum + s._count.id, 0),
        completed: stats.find(s => s.status === 'COMPLETED')?._count.id || 0,
        cancelled: stats.find(s => s.status === 'CANCELLED')?._count.id || 0
      };

      reply.send({
        bookings: bookings.map(booking => ({
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
        stats: statsObj
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener reservas'
      });
    }
  });

  // GET /api/users/me/preferences - Get user preferences
  fastify.get('/me/preferences', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get user preferences',
      description: 'Get current user preferences and settings',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          notifications: Type.Object({
            email: Type.Boolean(),
            sms: Type.Boolean(),
            push: Type.Boolean(),
            bookingReminders: Type.Boolean(),
            promotions: Type.Boolean()
          }),
          privacy: Type.Object({
            profileVisible: Type.Boolean(),
            showPhone: Type.Boolean(),
            showEmail: Type.Boolean()
          }),
          language: Type.String(),
          timezone: Type.String(),
          currency: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;

    try {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          timezone: true,
          locale: true
        }
      });

      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Usuario no encontrado'
        });
      }

      // TODO: Store preferences in a separate table or in user metadata
      // For now, return default preferences
      reply.send({
        notifications: {
          email: true,
          sms: true,
          push: true,
          bookingReminders: true,
          promotions: false
        },
        privacy: {
          profileVisible: true,
          showPhone: false,
          showEmail: false
        },
        language: user.locale || 'es-AR',
        timezone: user.timezone || 'America/Argentina/Buenos_Aires',
        currency: 'ARS'
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener preferencias'
      });
    }
  });

  // PUT /api/users/me/preferences - Update user preferences
  fastify.put('/me/preferences', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Update user preferences',
      description: 'Update current user preferences and settings',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        notifications: Type.Optional(Type.Object({
          email: Type.Optional(Type.Boolean()),
          sms: Type.Optional(Type.Boolean()),
          push: Type.Optional(Type.Boolean()),
          bookingReminders: Type.Optional(Type.Boolean()),
          promotions: Type.Optional(Type.Boolean())
        })),
        privacy: Type.Optional(Type.Object({
          profileVisible: Type.Optional(Type.Boolean()),
          showPhone: Type.Optional(Type.Boolean()),
          showEmail: Type.Optional(Type.Boolean())
        })),
        language: Type.Optional(Type.String()),
        timezone: Type.Optional(Type.String())
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          preferences: Type.Any()
        })
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      notifications?: any;
      privacy?: any;
      language?: string;
      timezone?: string;
    }
  }>, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;

    try {
      // Update locale and timezone in user table
      const updateData: any = {};
      if (request.body.language) updateData.locale = request.body.language;
      if (request.body.timezone) updateData.timezone = request.body.timezone;

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: currentUserId },
          data: updateData
        });
      }

      // TODO: Store other preferences in a separate preferences table

      reply.send({
        message: 'Preferencias actualizadas exitosamente',
        preferences: request.body
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al actualizar preferencias'
      });
    }
  });

  // GET /api/users/me/verification-status - Get verification status
  fastify.get('/me/verification-status', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get verification status',
      description: 'Get current user verification status',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          email: Type.Object({
            verified: Type.Boolean(),
            verifiedAt: Type.Optional(Type.String({ format: 'date-time' }))
          }),
          phone: Type.Object({
            verified: Type.Boolean(),
            verifiedAt: Type.Optional(Type.String({ format: 'date-time' }))
          }),
          identity: Type.Object({
            verified: Type.Boolean(),
            verifiedAt: Type.Optional(Type.String({ format: 'date-time' })),
            documents: Type.Array(Type.Object({
              type: Type.String(),
              status: Type.String(),
              uploadedAt: Type.String({ format: 'date-time' })
            }))
          }),
          overall: Type.Object({
            verified: Type.Boolean(),
            percentage: Type.Number()
          })
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = (request.user as any).sub;

    try {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          isVerified: true,
          email: true,
          phone: true,
          dni: true,
          createdAt: true
        }
      });

      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Usuario no encontrado'
        });
      }

      // Calculate verification percentage
      let percentage = 0;
      if (user.email) percentage += 40;
      if (user.phone) percentage += 30;
      if (user.dni) percentage += 30;

      reply.send({
        email: {
          verified: !!user.email,
          verifiedAt: user.email ? user.createdAt.toISOString() : undefined
        },
        phone: {
          verified: !!user.phone,
          verifiedAt: user.phone ? user.createdAt.toISOString() : undefined
        },
        identity: {
          verified: !!user.dni,
          verifiedAt: user.dni ? user.createdAt.toISOString() : undefined,
          documents: [] // TODO: Implement document upload system
        },
        overall: {
          verified: user.isVerified,
          percentage
        }
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener estado de verificación'
      });
    }
  });
};

export default usersRoutes;