import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { z } from 'zod';
import { AuthService } from '../services/auth';
import verificationService from '../services/verification.service';
import { validateSchema, argentinaValidation } from '../middleware/validation';
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

// T056: Enhanced Zod validation schemas with detailed field-level error messages
const registerValidationSchema = z.object({
  name: z.string()
    .min(1, 'Nombre requerido')
    .min(2, 'Nombre muy corto (mín. 2 caracteres)')
    .max(100, 'Nombre muy largo (máx. 100 caracteres)')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string()
    .min(1, 'Email requerido')
    .email('Email inválido')
    .max(255, 'Email muy largo'),
  password: z.string()
    .min(1, 'Contraseña requerida')
    .min(8, 'Contraseña muy corta (mín. 8 caracteres)')
    .max(100, 'Contraseña muy larga (máx. 100 caracteres)')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un carácter especial'),
  phone: argentinaValidation.phone.optional(),
  role: z.enum(['CLIENT', 'PROVIDER', 'ADMIN'], 'Por favor selecciona un rol').default('CLIENT'),
  dni: argentinaValidation.dni.optional(),
  cuit: argentinaValidation.cuit.optional(),
  birthDate: z.string().datetime('Fecha de nacimiento inválida').optional()
});

const loginValidationSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  rememberMe: z.boolean().default(false).optional()
});

const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1, 'Token de actualización requerido')
});

const authRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const authService = new AuthService(fastify);

  // Register endpoint
  // T071: Rate limiting - 5 registrations per IP per hour
  fastify.post('/register', {
    preHandler: [validateSchema(registerValidationSchema, 'body')],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour'
      }
    },
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Create a new user account with Argentina-specific validations and email verification (rate limited: 5 per IP per hour)'
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await authService.register(request.body);

      // T025-T026: Send verification email after user creation
      try {
        await verificationService.sendVerificationEmail(
          result.user.id,
          result.user.email,
          result.user.name
        );
        fastify.log.info('Verification email sent', {
          userId: result.user.id,
          email: result.user.email,
        });
      } catch (emailError: any) {
        // Log error but don't fail registration
        fastify.log.error('Failed to send verification email', {
          userId: result.user.id,
          email: result.user.email,
          error: emailError.message,
        });
      }

      return reply.code(201).send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        message: 'Registro exitoso. Por favor verifica tu email.'
      });
    } catch (error: any) {
      const message = error.message;

      // All validation errors are now handled by preHandler middleware
      // This catch block only handles business logic errors
      return reply.code(409).send({
        error: 'Registration Failed',
        message: message || 'Error al registrar usuario',
        statusCode: 409
      });
    }
  });

  // Login endpoint
  fastify.post('/login', {
    preHandler: [validateSchema(loginValidationSchema, 'body')],
    schema: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and return access tokens',
      response: {
        200: AuthResponse,
        401: AuthErrorResponse,
        403: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await authService.login(request.body);

      return reply.send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      const message = error.message;

      if (message.includes('desactivada')) {
        return reply.code(403).send({
          error: 'Account Disabled',
          message,
          statusCode: 403
        });
      } else {
        return reply.code(401).send({
          error: 'Authentication Failed',
          message: message || 'Credenciales inválidas',
          statusCode: 401
        });
      }
    }
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    preHandler: [validateSchema(refreshTokenValidationSchema, 'body')],
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      description: 'Get new access token using refresh token',
      response: {
        200: TokenResponse,
        401: AuthErrorResponse
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await authService.refreshToken(request.body.refreshToken);

      return reply.send({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      return reply.code(401).send({
        error: 'Token Refresh Failed',
        message: error.message || 'Token de actualización inválido',
        statusCode: 401
      });
    }
  });

  // Logout endpoint
  fastify.post('/logout', {
    preHandler: [validateSchema(refreshTokenValidationSchema, 'body')],
    schema: {
      tags: ['Auth'],
      summary: 'User logout',
      description: 'Revoke refresh token and logout user',
      response: {
        200: Type.Object({
          message: Type.String()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      await authService.logout(request.body.refreshToken);
      return reply.send({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      return reply.send({ message: 'Sesión cerrada exitosamente' });
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
        return reply.code(404).send({
          error: 'User Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
      }

      return reply.send({
        ...user,
        birthDate: user.birthDate?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      });
    } catch (error) {
      return reply.code(500).send({
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
      return reply.send(user);
    } catch (error: any) {
      return reply.code(400).send({
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
        return reply.code(404).send({
          error: 'User Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
      }

      // Verify current password
      const isValidPassword = await authService.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return reply.code(400).send({
          error: 'Invalid Password',
          message: 'Contraseña actual incorrecta',
          statusCode: 400
        });
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

      return reply.send({
        message: 'Contraseña actualizada exitosamente. Por favor, inicie sesión nuevamente.'
      });
    } catch (error) {
      return reply.code(500).send({
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
      return reply.send({
        message: 'Sesión cerrada en todos los dispositivos'
      });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al cerrar sesiones',
        statusCode: 500
      });
    }
  });

  // T027: Verify email endpoint
  fastify.get('/verify-email', {
    schema: {
      tags: ['Auth'],
      summary: 'Verify email address',
      description: 'Verify user email with token from verification email',
      querystring: Type.Object({
        token: Type.String({ description: 'Email verification token' })
      })
    }
  }, async (request: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = request.query;

    if (!token) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Token de verificación requerido',
        statusCode: 400
      });
    }

    try {
      // Find token in database by searching across all tokens
      const tokenRecord = await fastify.prisma.emailVerificationToken.findFirst({
        where: {
          expiresAt: {
            gte: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!tokenRecord) {
        return reply.code(400).send({
          error: 'Invalid Token',
          message: 'Token de verificación inválido o expirado',
          statusCode: 400
        });
      }

      // Validate token using the service
      const validation = await verificationService.validateToken(token, tokenRecord.email);

      if (!validation.valid) {
        return reply.code(400).send({
          error: 'Invalid Token',
          message: validation.error || 'Token de verificación inválido',
          statusCode: 400
        });
      }

      // Mark email as verified
      await verificationService.markEmailVerified(validation.userId!, tokenRecord.email);

      return reply.send({
        message: 'Email verificado exitosamente',
        verified: true
      });
    } catch (error: any) {
      fastify.log.error('Error verifying email', { error });
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al verificar email',
        statusCode: 500
      });
    }
  });

  // T028: Send verification email (public endpoint with rate limiting)
  fastify.post('/send-verification', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour'
      }
    },
    schema: {
      tags: ['Auth'],
      summary: 'Send verification email',
      description: 'Send verification email to unverified user (rate limited: 3 per hour)',
      body: Type.Object({
        email: Type.String({ format: 'email' })
      })
    }
  }, async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    const { email } = request.body;

    try {
      // Find user by email
      const user = await fastify.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      // Always return success to avoid email enumeration
      if (!user) {
        return reply.send({
          message: 'Si el email existe, se ha enviado un correo de verificación'
        });
      }

      // Don't resend if already verified
      if (user.isVerified) {
        return reply.send({
          message: 'Email ya verificado'
        });
      }

      // Send verification email
      await verificationService.sendVerificationEmail(user.id, user.email, user.name);

      return reply.send({
        message: 'Email de verificación enviado'
      });
    } catch (error: any) {
      fastify.log.error('Error sending verification email', { error, email });

      // Don't reveal internal errors to avoid enumeration
      return reply.send({
        message: 'Si el email existe, se ha enviado un correo de verificación'
      });
    }
  });

  // T029: Resend verification email (authenticated endpoint with rate limiting)
  fastify.post('/resend-verification', {
    preHandler: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour'
      }
    },
    schema: {
      tags: ['Auth'],
      summary: 'Resend verification email',
      description: 'Resend verification email for authenticated user (rate limited: 3 per hour)',
      security: [{ bearerAuth: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;

    try {
      // Get user
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Usuario no encontrado',
          statusCode: 404
        });
      }

      // Check if already verified
      if (user.isVerified) {
        return reply.code(400).send({
          error: 'Already Verified',
          message: 'Email ya verificado',
          statusCode: 400
        });
      }

      // Send verification email
      await verificationService.sendVerificationEmail(user.id, user.email, user.name);

      return reply.send({
        message: 'Email de verificación enviado'
      });
    } catch (error: any) {
      fastify.log.error('Error resending verification email', { error, userId });
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al enviar email de verificación',
        statusCode: 500
      });
    }
  });

  // T030: Get verification status
  fastify.get('/verification-status', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get email verification status',
      description: 'Get current user email verification status',
      security: [{ bearerAuth: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;

    try {
      const status = await verificationService.getVerificationStatus(userId);

      return reply.send(status);
    } catch (error: any) {
      fastify.log.error('Error getting verification status', { error, userId });
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error al obtener estado de verificación',
        statusCode: 500
      });
    }
  });
};

export default authRoutes;