import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UserResponse } from '../schemas/auth';

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
      const user = await fastify.prisma.user.findUnique({
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
        fastify.prisma.user.findMany({
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
        fastify.prisma.user.count({ where })
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
      const user = await fastify.prisma.user.update({
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
        await fastify.prisma.refreshToken.updateMany({
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
        fastify.prisma.user.count(),
        fastify.prisma.user.count({ where: { isActive: true } }),
        fastify.prisma.user.count({ where: { isVerified: true } }),
        fastify.prisma.user.count({ where: { role: 'CLIENT' } }),
        fastify.prisma.user.count({ where: { role: 'PROVIDER' } }),
        fastify.prisma.user.count({ where: { role: 'ADMIN' } })
      ]);

      // Get registrations by month for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const registrationsByMonth = await fastify.prisma.$queryRaw`
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
};

export default usersRoutes;