/**
 * T039-T042: OAuth Routes
 * Google OAuth authentication endpoints
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { z } from 'zod';
import crypto from 'crypto';
import { OAuthService } from '../services/oauth.service';
import { validateSchema } from '../middleware/validation';
import { googleOAuthConfig } from '../config/oauth.config';
import { OAuthState, OAuthErrorCode, GoogleProfile } from '../types/oauth.types';
import { UserRole } from '@prisma/client';
import { prisma } from '../services/database';

// Validation schemas
const initiateOAuthSchema = z.object({
  role: z.enum(['CLIENT', 'PROVIDER', 'ADMIN']).default('CLIENT').optional(),
  isRegistration: z.boolean().default(true).optional(),
  returnTo: z.string().optional()
});

const linkOAuthSchema = z.object({
  accessToken: z.string().min(1, 'Token de acceso de Google requerido')
});

const oauthRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const oauthService = new OAuthService(fastify);

  /**
   * T039: POST /auth/oauth/google/initiate
   * Initiate Google OAuth flow - returns redirect URL with state token
   */
  fastify.post('/google/initiate', {
    preHandler: [validateSchema(initiateOAuthSchema, 'body')],
    schema: {
      tags: ['OAuth'],
      summary: 'Initiate Google OAuth flow',
      description: 'Start OAuth authentication with Google, returns redirect URL',
      body: Type.Object({
        role: Type.Optional(Type.Enum(UserRole)),
        isRegistration: Type.Optional(Type.Boolean()),
        returnTo: Type.Optional(Type.String())
      }),
      response: {
        200: Type.Object({
          redirectUrl: Type.String(),
          state: Type.String()
        }),
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const correlationId = crypto.randomUUID();

    try {
      // Validate Google OAuth credentials are configured
      if (!googleOAuthConfig.clientId || !googleOAuthConfig.clientSecret) {
        fastify.log.error('Google OAuth credentials not configured', {
          clientIdPresent: !!googleOAuthConfig.clientId,
          clientSecretPresent: !!googleOAuthConfig.clientSecret,
          correlationId
        });

        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Autenticación con Google no está configurada. Por favor, contacta al administrador.',
          statusCode: 503,
          correlationId
        });
      }

      const { role, isRegistration, returnTo } = request.body;

      // Generate state token
      const stateToken = oauthService.generateState();

      // Create state data
      const stateData: OAuthState = {
        token: stateToken,
        createdAt: Date.now(),
        role: role || UserRole.CLIENT,
        isRegistration: isRegistration !== false,
        returnTo
      };

      // Store state in Redis
      await oauthService.storeState(stateToken, stateData);

      // Log OAuth initiation
      oauthService.logOAuthEvent({
        type: 'INITIATE',
        provider: 'GOOGLE',
        correlationId,
        timestamp: new Date(),
        context: {
          role: stateData.role,
          isRegistration: stateData.isRegistration
        }
      });

      // Build Google OAuth URL
      const params = new URLSearchParams({
        client_id: googleOAuthConfig.clientId,
        redirect_uri: googleOAuthConfig.callbackURL,
        response_type: 'code',
        scope: googleOAuthConfig.scope.join(' '),
        state: stateToken,
        access_type: googleOAuthConfig.accessType,
        prompt: googleOAuthConfig.prompt
      });

      const redirectUrl = `${googleOAuthConfig.authorizationURL}?${params.toString()}`;

      return reply.send({
        redirectUrl,
        state: stateToken
      });
    } catch (error: any) {
      fastify.log.error('Error initiating OAuth flow', {
        error: error.message,
        correlationId
      });

      oauthService.logOAuthEvent({
        type: 'ERROR',
        provider: 'GOOGLE',
        correlationId,
        timestamp: new Date(),
        error: {
          code: OAuthErrorCode.UNKNOWN_ERROR,
          message: error.message
        }
      });

      return reply.code(400).send({
        error: 'OAuth Initiation Failed',
        message: 'Error al iniciar autenticación con Google',
        statusCode: 400
      });
    }
  });

  /**
   * T040: GET /auth/oauth/google/callback
   * Handle Google OAuth callback - exchange code for tokens and create/login user
   */
  fastify.get('/google/callback', {
    schema: {
      tags: ['OAuth'],
      summary: 'Google OAuth callback',
      description: 'Handle OAuth callback from Google, exchange code for user session',
      querystring: Type.Object({
        code: Type.Optional(Type.String()),
        state: Type.Optional(Type.String()),
        error: Type.Optional(Type.String()),
        error_description: Type.Optional(Type.String())
      })
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    }
  }>, reply: FastifyReply) => {
    const correlationId = crypto.randomUUID();
    const { code, state, error, error_description } = request.query;

    try {
      // Validate Google OAuth credentials are configured
      if (!googleOAuthConfig.clientId || !googleOAuthConfig.clientSecret) {
        fastify.log.error('Google OAuth credentials not configured in callback handler', {
          correlationId
        });

        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Autenticación con Google no está configurada. Por favor, contacta al administrador.',
          statusCode: 503,
          correlationId
        });
      }

      // Check if user cancelled OAuth
      if (error) {
        oauthService.logOAuthEvent({
          type: 'ERROR',
          provider: 'GOOGLE',
          correlationId,
          timestamp: new Date(),
          error: {
            code: error === 'access_denied'
              ? OAuthErrorCode.CANCELLED_BY_USER
              : OAuthErrorCode.UNKNOWN_ERROR,
            message: error_description || error
          }
        });

        return reply.code(400).send({
          error: 'OAuth Cancelled',
          message: error === 'access_denied'
            ? 'Autenticación cancelada por el usuario'
            : `Error de OAuth: ${error_description || error}`,
          statusCode: 400
        });
      }

      // Validate required parameters
      if (!code || !state) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Código de autorización y estado requeridos',
          statusCode: 400
        });
      }

      // Validate state token
      const stateValidation = await oauthService.validateState(state);
      if (!stateValidation.valid) {
        oauthService.logOAuthEvent({
          type: 'ERROR',
          provider: 'GOOGLE',
          correlationId,
          timestamp: new Date(),
          error: {
            code: stateValidation.errorCode || OAuthErrorCode.STATE_MISMATCH,
            message: stateValidation.error || 'Estado inválido'
          }
        });

        return reply.code(400).send({
          error: 'Invalid State',
          message: stateValidation.error || 'Token de estado inválido',
          statusCode: 400
        });
      }

      const stateData = stateValidation.state!;

      // Exchange code for access token using fastify-oauth2
      let token: any;
      try {
        // Use fastify-oauth2 to exchange code for token
        token = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      } catch (tokenError: any) {
        oauthService.logOAuthEvent({
          type: 'ERROR',
          provider: 'GOOGLE',
          correlationId,
          timestamp: new Date(),
          error: {
            code: OAuthErrorCode.TOKEN_EXCHANGE_FAILED,
            message: tokenError.message
          }
        });

        return reply.code(400).send({
          error: 'Token Exchange Failed',
          message: 'Error al obtener tokens de Google',
          statusCode: 400
        });
      }

      // Fetch Google profile
      let googleProfile: GoogleProfile;
      try {
        googleProfile = await oauthService.fetchGoogleProfile(token.access_token);
      } catch (profileError: any) {
        oauthService.logOAuthEvent({
          type: 'ERROR',
          provider: 'GOOGLE',
          correlationId,
          timestamp: new Date(),
          error: {
            code: OAuthErrorCode.USER_FETCH_FAILED,
            message: profileError.message
          }
        });

        return reply.code(400).send({
          error: 'Profile Fetch Failed',
          message: profileError.message || 'Error al obtener perfil de Google',
          statusCode: 400
        });
      }

      // Create or update user
      let userResult: any;
      try {
        userResult = await oauthService.createOrUpdateOAuthUser(
          googleProfile,
          stateData.role
        );
      } catch (userError: any) {
        oauthService.logOAuthEvent({
          type: 'ERROR',
          provider: 'GOOGLE',
          correlationId,
          timestamp: new Date(),
          error: {
            code: OAuthErrorCode.USER_CREATION_FAILED,
            message: userError.message
          }
        });

        return reply.code(500).send({
          error: 'User Creation Failed',
          message: userError.message || 'Error al crear usuario',
          statusCode: 500
        });
      }

      // Generate JWT tokens
      const tokens = oauthService.generateOAuthTokens(
        userResult.user.id,
        userResult.user.role
      );

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: userResult.user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expiresIn)
        }
      });

      // Log successful OAuth
      oauthService.logOAuthEvent({
        type: 'SUCCESS',
        provider: 'GOOGLE',
        correlationId,
        userId: userResult.user.id,
        providerUserId: googleProfile.id,
        timestamp: new Date(),
        context: {
          isNewUser: userResult.isNewUser,
          authMethod: userResult.user.authMethod
        }
      });

      // Return success with tokens
      return reply.send({
        user: {
          id: userResult.user.id,
          email: userResult.user.email,
          name: userResult.user.name,
          avatar: userResult.user.avatar,
          role: userResult.user.role,
          isVerified: userResult.user.isVerified,
          authMethod: userResult.user.authMethod
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        isNewUser: userResult.isNewUser,
        returnTo: stateData.returnTo
      });

    } catch (error: any) {
      fastify.log.error('Unexpected error in OAuth callback', {
        error: error.message,
        stack: error.stack,
        correlationId
      });

      oauthService.logOAuthEvent({
        type: 'ERROR',
        provider: 'GOOGLE',
        correlationId,
        timestamp: new Date(),
        error: {
          code: OAuthErrorCode.UNKNOWN_ERROR,
          message: error.message
        }
      });

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error interno durante autenticación con Google',
        statusCode: 500
      });
    }
  });

  /**
   * T041: POST /auth/oauth/google/link
   * Link Google account to existing authenticated user
   */
  fastify.post('/google/link', {
    preHandler: [fastify.authenticate, validateSchema(linkOAuthSchema, 'body')],
    schema: {
      tags: ['OAuth'],
      summary: 'Link Google account',
      description: 'Link Google OAuth to existing user account',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        accessToken: Type.String()
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          authMethod: Type.String()
        }),
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
          statusCode: Type.Number()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: { accessToken: string } }>, reply: FastifyReply) => {
    const correlationId = crypto.randomUUID();
    const userId = (request.user as any).userId;
    const { accessToken } = request.body;

    try {
      // Fetch Google profile
      const googleProfile = await oauthService.fetchGoogleProfile(accessToken);

      // Link OAuth to user
      await oauthService.linkOAuthToUser(userId, googleProfile);

      // Log OAuth link
      oauthService.logOAuthEvent({
        type: 'LINK',
        provider: 'GOOGLE',
        correlationId,
        userId,
        providerUserId: googleProfile.id,
        timestamp: new Date()
      });

      return reply.send({
        message: 'Cuenta de Google vinculada exitosamente',
        authMethod: 'BOTH'
      });
    } catch (error: any) {
      fastify.log.error('Error linking OAuth account', {
        error: error.message,
        userId,
        correlationId
      });

      oauthService.logOAuthEvent({
        type: 'ERROR',
        provider: 'GOOGLE',
        correlationId,
        userId,
        timestamp: new Date(),
        error: {
          code: OAuthErrorCode.USER_LINKING_FAILED,
          message: error.message
        }
      });

      return reply.code(400).send({
        error: 'Link Failed',
        message: error.message || 'Error al vincular cuenta de Google',
        statusCode: 400
      });
    }
  });

  /**
   * T042: DELETE /auth/oauth/google/unlink
   * Unlink Google account from authenticated user
   */
  fastify.delete('/google/unlink', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['OAuth'],
      summary: 'Unlink Google account',
      description: 'Remove Google OAuth link from user account',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          message: Type.String(),
          authMethod: Type.String()
        }),
        400: Type.Object({
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = crypto.randomUUID();
    const userId = (request.user as any).userId;

    try {
      // Unlink OAuth from user
      await oauthService.unlinkOAuthFromUser(userId);

      // Log OAuth unlink
      oauthService.logOAuthEvent({
        type: 'UNLINK',
        provider: 'GOOGLE',
        correlationId,
        userId,
        timestamp: new Date()
      });

      return reply.send({
        message: 'Cuenta de Google desvinculada exitosamente',
        authMethod: 'EMAIL'
      });
    } catch (error: any) {
      fastify.log.error('Error unlinking OAuth account', {
        error: error.message,
        userId,
        correlationId
      });

      const statusCode = error.message.includes('No hay') ? 404 : 400;

      return reply.code(statusCode).send({
        error: statusCode === 404 ? 'Not Found' : 'Unlink Failed',
        message: error.message || 'Error al desvincular cuenta de Google',
        statusCode
      });
    }
  });
};

export default oauthRoutes;
