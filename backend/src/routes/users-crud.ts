import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { userService } from '../services/user';
import { validateSchema } from '../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
  listUsersQuerySchema,
  userIdParamSchema,
  emailAvailabilitySchema,
  phoneAvailabilitySchema,
  dniAvailabilitySchema,
  CreateUserInput,
  UpdateUserInput,
  UpdatePasswordInput,
  ListUsersQuery,
  UserIdParam
} from '../schemas/users';

const usersCrudRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

  // Create new user (Admin only or self-registration)
  fastify.post('/', {
    preHandler: [validateSchema(createUserSchema, 'body')],
    schema: {
      tags: ['Users'],
      summary: 'Create new user',
      description: 'Create a new user account (admin only or self-registration for clients)',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          phone: { type: 'string', pattern: '^\\+54-[0-9]{2,4}-[0-9]{6,8}$' },
          role: { type: 'string', enum: ['CLIENT', 'PROVIDER', 'ADMIN'] },
          dni: { type: 'string', pattern: '^[0-9]{1,2}\\.?[0-9]{3}\\.?[0-9]{3}$' },
          cuit: { type: 'string', pattern: '^[0-9]{2}-[0-9]{8}-[0-9]{1}$' },
          avatar: { type: 'string', format: 'uri' },
          birthDate: { type: 'string', format: 'date-time' }
        },
        required: ['name', 'email', 'password']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) => {
    try {
      const userData = request.body;

      // Check if this is self-registration or admin creation
      let isAuthorized = false;
      
      // Allow self-registration for clients
      if (userData.role === UserRole.CLIENT || !userData.role) {
        isAuthorized = true;
      } else {
        // For PROVIDER or ADMIN roles, require admin authentication
        try {
          await request.jwtVerify();
          const currentUser = (request.user as any);
          if (currentUser.role === UserRole.ADMIN) {
            isAuthorized = true;
          }
        } catch (error) {
          // No valid token provided
        }
      }

      if (!isAuthorized) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para crear este tipo de usuario',
          statusCode: 403
        });
        return;
      }

      // Check if email is available
      const isEmailAvailable = await userService.isEmailAvailable(userData.email);
      if (!isEmailAvailable) {
        reply.code(409).send({
          error: 'Conflict',
          message: 'El email ya está registrado',
          statusCode: 409
        });
        return;
      }

      // Check if phone is available (if provided)
      if (userData.phone) {
        const isPhoneAvailable = await userService.isPhoneAvailable(userData.phone);
        if (!isPhoneAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El teléfono ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      // Check if DNI is available (if provided)
      if (userData.dni) {
        const isDNIAvailable = await userService.isDNIAvailable(userData.dni);
        if (!isDNIAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El DNI ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      const user = await userService.createUser(userData);
      
      reply.code(201).send({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt
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

  // Get user by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params')],
    schema: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Get user information by ID (admin or own profile only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const requestedUserId = request.params.id;

      // Check if user can access this profile
      if (currentUser.id !== requestedUserId && currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para acceder a este perfil',
          statusCode: 403
        });
        return;
      }

      const user = await userService.getUserById(requestedUserId);
      
      if (!user) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
        return;
      }

      reply.send({
        success: true,
        data: user
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

  // Update user
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params'), validateSchema(updateUserSchema, 'body')],
    schema: {
      tags: ['Users'],
      summary: 'Update user',
      description: 'Update user information (admin or own profile only)',
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
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^\\+54-[0-9]{2,4}-[0-9]{6,8}$' },
          dni: { type: 'string', pattern: '^[0-9]{1,2}\\.?[0-9]{3}\\.?[0-9]{3}$' },
          cuit: { type: 'string', pattern: '^[0-9]{2}-[0-9]{8}-[0-9]{1}$' },
          avatar: { type: 'string', format: 'uri' },
          birthDate: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' },
          isVerified: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam; Body: UpdateUserInput }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const userIdToUpdate = request.params.id;
      const updateData = request.body;

      // Check if user can update this profile
      if (currentUser.id !== userIdToUpdate && currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para modificar este perfil',
          statusCode: 403
        });
        return;
      }

      // Only admins can change isActive and isVerified
      if ((updateData.isActive !== undefined || updateData.isVerified !== undefined) && currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden cambiar el estado de verificación o activación',
          statusCode: 403
        });
        return;
      }

      // Check if email is available (if being updated)
      if (updateData.email) {
        const isEmailAvailable = await userService.isEmailAvailable(updateData.email, userIdToUpdate);
        if (!isEmailAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El email ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      // Check if phone is available (if being updated)
      if (updateData.phone) {
        const isPhoneAvailable = await userService.isPhoneAvailable(updateData.phone, userIdToUpdate);
        if (!isPhoneAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El teléfono ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      // Check if DNI is available (if being updated)
      if (updateData.dni) {
        const isDNIAvailable = await userService.isDNIAvailable(updateData.dni, userIdToUpdate);
        if (!isDNIAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El DNI ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      const updatedUser = await userService.updateUser(userIdToUpdate, updateData);
      
      reply.send({
        success: true,
        data: updatedUser
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

  // Update password
  fastify.put('/:id/password', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params'), validateSchema(updatePasswordSchema, 'body')],
    schema: {
      tags: ['Users'],
      summary: 'Update user password',
      description: 'Update user password (own profile only)',
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
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string' }
        },
        required: ['currentPassword', 'newPassword', 'confirmPassword']
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam; Body: UpdatePasswordInput }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const userIdToUpdate = request.params.id;
      const { currentPassword, newPassword } = request.body;

      // Only allow users to change their own password
      if (currentUser.id !== userIdToUpdate) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo puedes cambiar tu propia contraseña',
          statusCode: 403
        });
        return;
      }

      await userService.updatePassword(userIdToUpdate, currentPassword, newPassword);
      
      reply.send({
        success: true,
        data: {
          message: 'Contraseña actualizada correctamente'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Contraseña')) {
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

  // List users (Admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate, validateSchema(listUsersQuerySchema, 'query')],
    schema: {
      tags: ['Users'],
      summary: 'List users',
      description: 'List all users with pagination and filters (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          role: { type: 'string', enum: ['CLIENT', 'PROVIDER', 'ADMIN'] },
          isActive: { type: 'boolean' },
          isVerified: { type: 'boolean' },
          search: { type: 'string', maxLength: 100 },
          sortBy: { type: 'string', enum: ['name', 'email', 'createdAt', 'updatedAt', 'role'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: ListUsersQuery }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      // Only admins can list users
      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden listar usuarios',
          statusCode: 403
        });
        return;
      }

      const result = await userService.listUsers(request.query);
      
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

  // Deactivate user (Admin only)
  fastify.patch('/:id/deactivate', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params')],
    schema: {
      tags: ['Users'],
      summary: 'Deactivate user',
      description: 'Deactivate a user account (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden desactivar usuarios',
          statusCode: 403
        });
        return;
      }

      await userService.deactivateUser(request.params.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Usuario desactivado correctamente'
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

  // Verify user (Admin only)
  fastify.patch('/:id/verify', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params')],
    schema: {
      tags: ['Users'],
      summary: 'Verify user',
      description: 'Verify a user account (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden verificar usuarios',
          statusCode: 403
        });
        return;
      }

      await userService.verifyUser(request.params.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Usuario verificado correctamente'
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

  // Check email availability
  fastify.post('/check-email', {
    preHandler: [validateSchema(emailAvailabilitySchema, 'body')],
    schema: {
      tags: ['Users'],
      summary: 'Check email availability',
      description: 'Check if an email address is available for registration',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      }
    }
  }, async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    try {
      const { email } = request.body;
      const isAvailable = await userService.isEmailAvailable(email);
      
      reply.send({
        success: true,
        data: {
          email,
          available: isAvailable
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

  // Get user statistics (Admin only)
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get user statistics',
      description: 'Get user statistics and metrics (admin only)',
      security: [{ bearerAuth: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden ver estadísticas',
          statusCode: 403
        });
        return;
      }

      const stats = await userService.getUserStats();
      
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

  // Update user preferences
  fastify.put('/me/preferences', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Update user preferences',
      description: 'Update current user preferences and settings',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          timezone: { type: 'string' },
          locale: { type: 'string', enum: ['es-AR', 'en-US'] },
          notifications: {
            type: 'object',
            properties: {
              email: { type: 'boolean' },
              sms: { type: 'boolean' },
              push: { type: 'boolean' },
              bookingReminders: { type: 'boolean' },
              promotions: { type: 'boolean' }
            }
          },
          privacy: {
            type: 'object',
            properties: {
              showProfile: { type: 'boolean' },
              showReviews: { type: 'boolean' },
              allowDirectMessages: { type: 'boolean' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const preferences = request.body;

      // Update user preferences
      const updatedUser = await userService.updateUserPreferences(currentUser.id, preferences);

      reply.send({
        success: true,
        data: updatedUser
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

  // Get current user profile (me endpoint)
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Get current user profile',
      description: 'Get current authenticated user profile information',
      security: [{ bearerAuth: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const user = await userService.getUserById(currentUser.id);

      if (!user) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
        return;
      }

      reply.send({
        success: true,
        data: user
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

  // Update current user profile
  fastify.put('/me', {
    preHandler: [fastify.authenticate, validateSchema(updateUserSchema, 'body')],
    schema: {
      tags: ['Users'],
      summary: 'Update current user profile',
      description: 'Update current authenticated user profile',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          phone: { type: 'string', pattern: '^\\+54-[0-9]{2,4}-[0-9]{6,8}$' },
          dni: { type: 'string', pattern: '^[0-9]{1,2}\\.?[0-9]{3}\\.?[0-9]{3}$' },
          avatar: { type: 'string', format: 'uri' },
          birthDate: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: UpdateUserInput }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const updateData = request.body;

      // Check if phone is available (if being updated)
      if (updateData.phone) {
        const isPhoneAvailable = await userService.isPhoneAvailable(updateData.phone, currentUser.id);
        if (!isPhoneAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El teléfono ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      // Check if DNI is available (if being updated)
      if (updateData.dni) {
        const isDNIAvailable = await userService.isDNIAvailable(updateData.dni, currentUser.id);
        if (!isDNIAvailable) {
          reply.code(409).send({
            error: 'Conflict',
            message: 'El DNI ya está registrado',
            statusCode: 409
          });
          return;
        }
      }

      const updatedUser = await userService.updateUser(currentUser.id, updateData);
      
      reply.send({
        success: true,
        data: updatedUser
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

  // User role management endpoint
  fastify.patch('/:id/role', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params')],
    schema: {
      tags: ['Users'],
      summary: 'Update user role',
      description: 'Update user role (admin only)',
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
          role: { type: 'string', enum: ['CLIENT', 'PROVIDER', 'ADMIN'] }
        },
        required: ['role']
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam; Body: { role: UserRole } }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);
      const { id } = request.params;
      const { role } = request.body;

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden cambiar roles de usuario',
          statusCode: 403
        });
        return;
      }

      // Prevent admins from demoting themselves
      if (currentUser.id === id && role !== UserRole.ADMIN) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'No puedes cambiar tu propio rol de administrador',
          statusCode: 400
        });
        return;
      }

      await userService.updateUserRole(id, role);

      reply.send({
        success: true,
        data: {
          message: 'Rol de usuario actualizado correctamente'
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

  // Reactivate user (Admin only)
  fastify.patch('/:id/reactivate', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params')],
    schema: {
      tags: ['Users'],
      summary: 'Reactivate user',
      description: 'Reactivate a deactivated user account (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden reactivar usuarios',
          statusCode: 403
        });
        return;
      }

      await userService.reactivateUser(request.params.id);
      
      reply.send({
        success: true,
        data: {
          message: 'Usuario reactivado correctamente'
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

  // Advanced user search endpoint
  fastify.get('/search', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Advanced user search',
      description: 'Search users with advanced filters (admin or provider only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', maxLength: 100 },
          role: { type: 'string', enum: ['CLIENT', 'PROVIDER', 'ADMIN'] },
          city: { type: 'string', maxLength: 100 },
          province: { type: 'string' },
          isActive: { type: 'boolean' },
          isVerified: { type: 'boolean' },
          hasProvider: { type: 'boolean' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
          sortBy: { type: 'string', enum: ['name', 'email', 'createdAt', 'role'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      // Only admins and providers can search users
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROVIDER) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo administradores y proveedores pueden buscar usuarios',
          statusCode: 403
        });
        return;
      }

      const result = await userService.searchUsers(request.query);
      
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

  // Get user activity log (Admin only)
  fastify.get('/:id/activity', {
    preHandler: [fastify.authenticate, validateSchema(userIdParamSchema, 'params')],
    schema: {
      tags: ['Users'],
      summary: 'Get user activity log',
      description: 'Get user activity and audit log (admin only)',
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
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          action: { type: 'string' },
          fromDate: { type: 'string', format: 'date' },
          toDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: UserIdParam; Querystring: any }>, reply: FastifyReply) => {
    try {
      const currentUser = (request.user as any);

      if (currentUser.role !== UserRole.ADMIN) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Solo los administradores pueden ver logs de actividad',
          statusCode: 403
        });
        return;
      }

      const activity = await userService.getUserActivity(request.params.id, request.query);
      
      reply.send({
        success: true,
        data: activity
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

export default usersCrudRoutes;