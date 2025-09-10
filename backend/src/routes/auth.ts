import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { AuthService } from '../services/auth';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  AuthResponse,
  TokenResponse,
  UserResponse,
  AuthErrorResponse,
  ValidationErrorResponse
} from '../schemas/auth';

const authRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const authService = new AuthService(fastify);

  // Register endpoint
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Create a new user account with Argentina-specific validations',
      body: RegisterSchema,
      response: {
        201: AuthResponse,
        400: ValidationErrorResponse,
        409: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await authService.register(request.body);
      
      reply.code(201).send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      const message = error.message;
      
      if (message.includes('Errores de validación')) {
        reply.code(400).send({
          error: 'Validation Error',
          message,
          statusCode: 400
        });
      } else {
        reply.code(409).send({
          error: 'Registration Failed',
          message: message || 'Error al registrar usuario',
          statusCode: 409
        });
      }
    }
  });

  // Login endpoint
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and return access tokens',
      body: LoginSchema,
      response: {
        200: AuthResponse,
        401: AuthErrorResponse,
        403: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await authService.login(request.body);
      
      reply.send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      const message = error.message;
      
      if (message.includes('desactivada')) {
        reply.code(403).send({
          error: 'Account Disabled',
          message,
          statusCode: 403
        });
      } else {
        reply.code(401).send({
          error: 'Authentication Failed',
          message: message || 'Credenciales inválidas',
          statusCode: 401
        });
      }
    }
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      description: 'Get new access token using refresh token',
      body: RefreshTokenSchema,
      response: {
        200: TokenResponse,
        401: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await authService.refreshToken(request.body.refreshToken);
      
      reply.send({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      reply.code(401).send({
        error: 'Token Refresh Failed',
        message: error.message || 'Token de actualización inválido',
        statusCode: 401
      });
    }
  });

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'User logout',
      description: 'Revoke refresh token and logout user',
      body: RefreshTokenSchema,
      response: {
        200: Type.Object({
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      await authService.logout(request.body.refreshToken);
      reply.send({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      reply.send({ message: 'Sesión cerrada exitosamente' });
    }
  });


  // Get current user profile
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get current user profile',
      description: 'Get authenticated user information',
      security: [{ bearerAuth: [] }],
      response: {
        200: UserResponse,
        401: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
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
        message: 'Error al obtener perfil de usuario',
        statusCode: 500
      });
    }
  });

  // Update user profile
  fastify.put('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Update user profile',
      description: 'Update authenticated user information',
      security: [{ bearerAuth: [] }],
      body: UpdateProfileSchema,
      response: {
        200: UserResponse,
        400: ValidationErrorResponse,
        401: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    
    try {
      const user = await authService.updateProfile(userId, request.body);
      reply.send(user);
    } catch (error: any) {
      reply.code(400).send({
        error: 'Update Failed',
        message: error.message || 'Error al actualizar perfil',
        statusCode: 400
      });
    }
  });

  // Change password
  fastify.put('/password', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Change user password',
      description: 'Change authenticated user password',
      security: [{ bearerAuth: [] }],
      body: ChangePasswordSchema,
      response: {
        200: Type.Object({
          message: Type.String()
        }),
        400: AuthErrorResponse,
        401: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    const { currentPassword, newPassword } = request.body;
    
    try {
      // Get user with password
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        reply.code(404).send({
          error: 'User Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
        return;
      }

      // Verify current password
      const isValidPassword = await authService.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        reply.code(400).send({
          error: 'Invalid Password',
          message: 'Contraseña actual incorrecta',
          statusCode: 400
        });
        return;
      }

      // Hash new password
      const hashedPassword = await authService.hashPassword(newPassword);

      // Update password
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Revoke all refresh tokens to force re-login
      await authService.logoutAll(userId);

      reply.send({ 
        message: 'Contraseña actualizada exitosamente. Por favor, inicie sesión nuevamente.' 
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al cambiar contraseña',
        statusCode: 500
      });
    }
  });

  // Logout from all devices
  fastify.post('/logout-all', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout from all devices',
      description: 'Revoke all refresh tokens for the user',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    
    try {
      await authService.logoutAll(userId);
      reply.send({ 
        message: 'Sesión cerrada en todos los dispositivos' 
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al cerrar sesiones',
        statusCode: 500
      });
    }
  });
};

export default authRoutes;