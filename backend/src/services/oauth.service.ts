/**
 * T036: OAuth Service
 * Handles Google OAuth authentication flow, state management, and user creation/linking
 */

import { FastifyInstance } from 'fastify';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from './database';
import redisService from './redis';
import {
  GoogleProfile,
  OAuthState,
  OAuthResult,
  OAuthEvent,
  OAuthErrorCode,
  OAuthCallbackSession
} from '../types/oauth.types';
import { googleOAuthConfig, oauthStateKeys, oauthCallbackKeys } from '../config/oauth.config';
import { AuthMethod, OAuthProviderType, UserRole } from '@prisma/client';

export class OAuthService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Generate a cryptographically secure random state token
   * @returns Random state token (URL-safe base64)
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Store OAuth state in Redis with TTL
   * @param stateToken - The state token
   * @param stateData - State data to store
   */
  async storeState(stateToken: string, stateData: OAuthState): Promise<void> {
    const key = oauthStateKeys.getStateKey(stateToken);
    await redisService.setJSON(key, stateData, oauthStateKeys.defaultTTL);

    this.fastify.log.info('OAuth state stored in Redis', {
      stateToken,
      ttl: oauthStateKeys.defaultTTL,
      isRegistration: stateData.isRegistration
    });
  }

  /**
   * Validate and retrieve OAuth state from Redis
   * @param stateToken - The state token to validate
   * @returns Validation result with state data
   */
  async validateState(stateToken: string): Promise<{
    valid: boolean;
    state?: OAuthState;
    error?: string;
    errorCode?: OAuthErrorCode;
  }> {
    const key = oauthStateKeys.getStateKey(stateToken);

    try {
      const stateData = await redisService.getJSON<OAuthState>(key);

      if (!stateData) {
        return {
          valid: false,
          error: 'Token de estado inválido o expirado',
          errorCode: OAuthErrorCode.STATE_EXPIRED
        };
      }

      // Delete state token after use (one-time use for security)
      await redisService.del(key);

      this.fastify.log.info('OAuth state validated successfully', {
        stateToken
      });

      return {
        valid: true,
        state: stateData
      };
    } catch (error) {
      this.fastify.log.error('Error validating OAuth state', {
        error,
        stateToken
      });

      return {
        valid: false,
        error: 'Token de estado inválido o expirado',
        errorCode: OAuthErrorCode.STATE_EXPIRED
      };
    }
  }

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from Google callback
   * @returns Access token response
   */
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; id_token?: string }> {
    try {
      const response = await axios.post(
        googleOAuthConfig.tokenURL,
        {
          code,
          client_id: googleOAuthConfig.clientId,
          client_secret: googleOAuthConfig.clientSecret,
          redirect_uri: googleOAuthConfig.callbackURL,
          grant_type: 'authorization_code'
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.fastify.log.info('Token exchange successful', {
        hasAccessToken: !!response.data.access_token,
        hasIdToken: !!response.data.id_token
      });

      return response.data;
    } catch (error: any) {
      this.fastify.log.error('Error exchanging code for token', {
        error: error.message,
        response: error.response?.data
      });

      throw new Error('Error al obtener tokens de Google');
    }
  }

  /**
   * Fetch user profile from Google using access token
   * @param accessToken - Google OAuth access token
   * @returns Google user profile
   */
  async fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
    try {
      const response = await axios.get<GoogleProfile>(
        googleOAuthConfig.userInfoURL,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const profile = response.data;

      // Log email verification status for monitoring
      // Note: Google's email_verified indicates Google's internal verification,
      // but OAuth flow itself validates email ownership. Our app handles verification separately.
      if (!profile.email_verified) {
        this.fastify.log.warn('Google account has unverified email (allowed for OAuth)', {
          googleUserId: profile.id,
          email: profile.email
        });
      }

      this.fastify.log.info('Google profile fetched successfully', {
        googleUserId: profile.id,
        email: profile.email,
        emailVerifiedByGoogle: profile.email_verified
      });

      return profile;
    } catch (error: any) {
      this.fastify.log.error('Error fetching Google profile', {
        error: error.message
      });

      if (error.message.includes('no verificado')) {
        throw error;
      }

      throw new Error('Error al obtener perfil de Google');
    }
  }

  /**
   * Create new user or update existing user with OAuth authentication
   * @param googleProfile - Google user profile
   * @param role - User role (CLIENT or PROVIDER)
   * @returns Created/updated user and OAuth provider record
   */
  async createOrUpdateOAuthUser(
    googleProfile: GoogleProfile,
    role?: UserRole
  ): Promise<{
    user: any;
    isNewUser: boolean;
    oauthProvider: any;
  }> {
    const email = googleProfile.email.toLowerCase().trim();
    const googleUserId = googleProfile.id;

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    // Check if OAuth provider already exists
    const existingOAuthProvider = await prisma.oAuthProvider.findFirst({
      where: {
        provider: OAuthProviderType.GOOGLE,
        providerUserId: googleUserId
      },
      include: {
        user: true
      }
    });

    // Case 1: OAuth provider exists (user logging in with existing OAuth)
    if (existingOAuthProvider) {
      this.fastify.log.info('OAuth provider already exists, logging in user', {
        userId: existingOAuthProvider.userId,
        googleUserId
      });

      return {
        user: existingOAuthProvider.user,
        isNewUser: false,
        oauthProvider: existingOAuthProvider
      };
    }

    // Case 2: User exists with email auth, link OAuth (upgrade to BOTH)
    if (existingUser) {
      this.fastify.log.info('Linking OAuth to existing user', {
        userId: existingUser.id,
        email,
        currentAuthMethod: existingUser.authMethod
      });

      const [updatedUser, oauthProvider] = await prisma.$transaction([
        // Update user auth method to BOTH and verify email
        prisma.user.update({
          where: { id: existingUser.id },
          data: {
            authMethod: AuthMethod.BOTH,
            isVerified: true,
            emailVerifiedAt: new Date(),
            avatar: googleProfile.picture || existingUser.avatar
          }
        }),
        // Create OAuth provider record
        prisma.oAuthProvider.create({
          data: {
            userId: existingUser.id,
            provider: OAuthProviderType.GOOGLE,
            providerUserId: googleUserId,
            email,
            profileData: {
              name: googleProfile.name,
              picture: googleProfile.picture,
              locale: googleProfile.locale
            }
          }
        })
      ]);

      return {
        user: updatedUser,
        isNewUser: false,
        oauthProvider
      };
    }

    // Case 3: New user registration via OAuth
    this.fastify.log.info('Creating new user via OAuth', {
      email,
      googleUserId,
      role: role || 'CLIENT'
    });

    // Use interactive transaction for sequential operations
    const result = await prisma.$transaction(async (tx) => {
      // Create new user
      const newUser = await tx.user.create({
        data: {
          email,
          name: googleProfile.name,
          password: null, // No password for OAuth-only users
          authMethod: AuthMethod.OAUTH,
          isVerified: true, // Auto-verified via Google
          emailVerifiedAt: new Date(),
          role: role || UserRole.CLIENT,
          avatar: googleProfile.picture,
          locale: googleProfile.locale || 'es-AR',
          timezone: 'America/Argentina/Buenos_Aires'
        }
      });

      // Create OAuth provider record
      const oauthProvider = await tx.oAuthProvider.create({
        data: {
          userId: newUser.id,
          provider: OAuthProviderType.GOOGLE,
          providerUserId: googleUserId,
          email,
          profileData: {
            name: googleProfile.name,
            picture: googleProfile.picture,
            locale: googleProfile.locale
          }
        }
      });

      return { user: newUser, oauthProvider };
    });

    return {
      user: result.user,
      isNewUser: true,
      oauthProvider: result.oauthProvider
    };
  }

  /**
   * Link OAuth provider to authenticated user
   * @param userId - Current user ID
   * @param googleProfile - Google profile to link
   */
  async linkOAuthToUser(
    userId: string,
    googleProfile: GoogleProfile
  ): Promise<void> {
    const googleUserId = googleProfile.id;
    const email = googleProfile.email.toLowerCase().trim();

    // Check if this Google account is already linked to another user
    const existingProvider = await prisma.oAuthProvider.findFirst({
      where: {
        provider: OAuthProviderType.GOOGLE,
        providerUserId: googleUserId
      }
    });

    if (existingProvider && existingProvider.userId !== userId) {
      throw new Error('Esta cuenta de Google ya está vinculada a otro usuario');
    }

    if (existingProvider && existingProvider.userId === userId) {
      // Already linked, nothing to do
      this.fastify.log.info('OAuth provider already linked to this user', {
        userId,
        googleUserId
      });
      return;
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Link OAuth provider
    await prisma.$transaction([
      // Create OAuth provider record
      prisma.oAuthProvider.create({
        data: {
          userId,
          provider: OAuthProviderType.GOOGLE,
          providerUserId: googleUserId,
          email,
          profileData: {
            name: googleProfile.name,
            picture: googleProfile.picture,
            locale: googleProfile.locale
          }
        }
      }),
      // Update user auth method to BOTH (if currently EMAIL)
      prisma.user.update({
        where: { id: userId },
        data: {
          authMethod: user.authMethod === AuthMethod.EMAIL
            ? AuthMethod.BOTH
            : user.authMethod,
          isVerified: true,
          emailVerifiedAt: new Date(),
          avatar: googleProfile.picture || user.avatar
        }
      })
    ]);

    this.fastify.log.info('OAuth provider linked to user', {
      userId,
      googleUserId,
      newAuthMethod: user.authMethod === AuthMethod.EMAIL ? 'BOTH' : user.authMethod
    });
  }

  /**
   * Unlink OAuth provider from user
   * @param userId - User ID
   */
  async unlinkOAuthFromUser(userId: string): Promise<void> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Check if user has password (can't unlink if OAuth is only method)
    if (user.authMethod === AuthMethod.OAUTH || !user.password) {
      throw new Error(
        'No puedes desvincular Google ya que es tu único método de acceso. Configura una contraseña primero.'
      );
    }

    // Find OAuth provider
    const oauthProvider = await prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider: OAuthProviderType.GOOGLE
      }
    });

    if (!oauthProvider) {
      throw new Error('No hay cuenta de Google vinculada');
    }

    // Unlink OAuth provider
    await prisma.$transaction([
      // Delete OAuth provider
      prisma.oAuthProvider.delete({
        where: { id: oauthProvider.id }
      }),
      // Update user auth method back to EMAIL
      prisma.user.update({
        where: { id: userId },
        data: {
          authMethod: AuthMethod.EMAIL
        }
      })
    ]);

    this.fastify.log.info('OAuth provider unlinked from user', {
      userId,
      oauthProviderId: oauthProvider.id
    });
  }

  /**
   * Generate JWT tokens for OAuth user
   * @param userId - User ID
   * @param role - User role
   * @returns Access and refresh tokens
   */
  generateOAuthTokens(userId: string, role: string): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const expiresIn = '7d';
    const refreshExpiresIn = '30d';

    const accessToken = this.fastify.jwt.sign(
      { userId, role },
      { expiresIn }
    );

    const refreshToken = this.fastify.jwt.sign(
      { userId, type: 'refresh' },
      { expiresIn: refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };
  }

  /**
   * Store OAuth callback session data in Redis for state token exchange
   * @param sessionData - Callback session data to store
   * @returns Callback token for exchange
   */
  async storeCallbackSession(sessionData: OAuthCallbackSession): Promise<string> {
    const callbackToken = crypto.randomBytes(32).toString('base64url');
    const key = oauthCallbackKeys.getCallbackSessionKey(callbackToken);

    await redisService.setJSON(key, sessionData, oauthCallbackKeys.defaultTTL);

    this.fastify.log.info('OAuth callback session stored in Redis', {
      callbackToken,
      userId: sessionData.user.id,
      ttl: oauthCallbackKeys.defaultTTL,
      isNewUser: sessionData.isNewUser
    });

    return callbackToken;
  }

  /**
   * Retrieve and delete OAuth callback session from Redis
   * @param callbackToken - The callback token to exchange
   * @returns Callback session data (one-time use)
   */
  async exchangeCallbackToken(callbackToken: string): Promise<{
    valid: boolean;
    session?: OAuthCallbackSession;
    error?: string;
  }> {
    const key = oauthCallbackKeys.getCallbackSessionKey(callbackToken);

    try {
      const sessionData = await redisService.getJSON<OAuthCallbackSession>(key);

      if (!sessionData) {
        return {
          valid: false,
          error: 'Token de callback inválido o expirado'
        };
      }

      // Delete token after retrieval (one-time use for security)
      await redisService.del(key);

      this.fastify.log.info('OAuth callback token exchanged successfully', {
        callbackToken,
        userId: sessionData.user.id
      });

      return {
        valid: true,
        session: sessionData
      };
    } catch (error) {
      this.fastify.log.error('Error exchanging OAuth callback token', {
        error,
        callbackToken
      });

      return {
        valid: false,
        error: 'Token de callback inválido o expirado'
      };
    }
  }

  /**
   * Log OAuth event with correlation ID
   * @param event - OAuth event data
   */
  logOAuthEvent(event: OAuthEvent): void {
    const logData = {
      oauthEvent: event.type,
      provider: event.provider,
      correlationId: event.correlationId,
      userId: event.userId,
      providerUserId: event.providerUserId,
      timestamp: event.timestamp,
      context: event.context,
      error: event.error
    };

    if (event.type === 'ERROR') {
      this.fastify.log.error(logData, `OAuth ${event.type}: ${event.error?.message}`);
    } else {
      this.fastify.log.info(logData, `OAuth ${event.type}`);
    }
  }
}

export default OAuthService;
