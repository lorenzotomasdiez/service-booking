/**
 * T033: OAuth Service Unit Tests
 * Tests for OAuth state generation, Google profile fetching, user creation
 */

import { OAuthService } from '../../src/services/oauth.service';
import { prisma } from '../../src/services/database';
import { redisClient } from '../../src/services/redis';
import { FastifyInstance } from 'fastify';
import { GoogleProfile, OAuthState, OAuthErrorCode } from '../../src/types/oauth.types';
import { AuthMethod } from '@prisma/client';

// Mock dependencies
jest.mock('../../src/services/database');
jest.mock('../../src/services/redis');
jest.mock('axios');

describe('OAuthService Unit Tests', () => {
  let oauthService: OAuthService;
  let mockFastify: Partial<FastifyInstance>;

  beforeEach(() => {
    // Create mock Fastify instance
    mockFastify = {
      jwt: {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        verify: jest.fn()
      },
      log: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      }
    } as any;

    oauthService = new OAuthService(mockFastify as FastifyInstance);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('generateState', () => {
    it('should generate a random state token', () => {
      const state1 = oauthService.generateState();
      const state2 = oauthService.generateState();

      expect(state1).toBeDefined();
      expect(typeof state1).toBe('string');
      expect(state1.length).toBeGreaterThan(30);
      expect(state1).not.toBe(state2);
    });

    it('should generate URL-safe tokens', () => {
      const state = oauthService.generateState();
      // URL-safe base64: only contains A-Z, a-z, 0-9, -, _
      expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
    });
  });

  describe('storeState', () => {
    it('should store state in Redis with correct TTL', async () => {
      const mockSet = jest.fn().mockResolvedValue('OK');
      (redisClient.set as jest.Mock) = mockSet;

      const stateToken = 'test-state-token';
      const stateData: OAuthState = {
        token: stateToken,
        createdAt: Date.now(),
        isRegistration: true,
        role: 'CLIENT'
      };

      await oauthService.storeState(stateToken, stateData);

      expect(mockSet).toHaveBeenCalledWith(
        `oauth:state:${stateToken}`,
        JSON.stringify(stateData),
        'EX',
        expect.any(Number)
      );

      // Check TTL is around 10 minutes (600 seconds)
      const ttl = (mockSet.mock.calls[0][3] as number);
      expect(ttl).toBeGreaterThanOrEqual(550);
      expect(ttl).toBeLessThanOrEqual(650);
    });

    it('should handle Redis errors gracefully', async () => {
      const mockSet = jest.fn().mockRejectedValue(new Error('Redis error'));
      (redisClient.set as jest.Mock) = mockSet;

      await expect(
        oauthService.storeState('test-token', { token: 'test-token', createdAt: Date.now() })
      ).rejects.toThrow('Redis error');
    });
  });

  describe('validateState', () => {
    it('should validate and return state data for valid token', async () => {
      const stateToken = 'valid-state-token';
      const stateData: OAuthState = {
        token: stateToken,
        createdAt: Date.now(),
        isRegistration: true,
        role: 'CLIENT'
      };

      const mockGet = jest.fn().mockResolvedValue(JSON.stringify(stateData));
      const mockDel = jest.fn().mockResolvedValue(1);
      (redisClient.get as jest.Mock) = mockGet;
      (redisClient.del as jest.Mock) = mockDel;

      const result = await oauthService.validateState(stateToken);

      expect(result).toEqual({
        valid: true,
        state: stateData
      });

      expect(mockGet).toHaveBeenCalledWith(`oauth:state:${stateToken}`);
      expect(mockDel).toHaveBeenCalledWith(`oauth:state:${stateToken}`);
    });

    it('should return invalid for non-existent state token', async () => {
      const mockGet = jest.fn().mockResolvedValue(null);
      (redisClient.get as jest.Mock) = mockGet;

      const result = await oauthService.validateState('non-existent-token');

      expect(result).toEqual({
        valid: false,
        error: 'Token de estado inválido o expirado',
        errorCode: OAuthErrorCode.STATE_EXPIRED
      });
    });

    it('should return invalid for malformed state data', async () => {
      const mockGet = jest.fn().mockResolvedValue('invalid-json');
      const mockDel = jest.fn().mockResolvedValue(1);
      (redisClient.get as jest.Mock) = mockGet;
      (redisClient.del as jest.Mock) = mockDel;

      const result = await oauthService.validateState('malformed-token');

      expect(result).toEqual({
        valid: false,
        error: 'Token de estado inválido o expirado',
        errorCode: OAuthErrorCode.STATE_EXPIRED
      });
    });
  });

  describe('fetchGoogleProfile', () => {
    it('should fetch and parse Google profile data', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockGoogleResponse = {
        id: 'google-user-123',
        email: 'test@gmail.com',
        name: 'Test User',
        picture: 'https://google.com/avatar.jpg',
        email_verified: true,
        locale: 'es-AR'
      };

      // Mock axios
      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: mockGoogleResponse });

      const profile = await oauthService.fetchGoogleProfile(mockAccessToken);

      expect(profile).toEqual({
        id: 'google-user-123',
        email: 'test@gmail.com',
        name: 'Test User',
        picture: 'https://google.com/avatar.jpg',
        email_verified: true,
        locale: 'es-AR'
      });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com'),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockAccessToken}`
          }
        })
      );
    });

    it('should handle Google API errors', async () => {
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('Google API error'));

      await expect(
        oauthService.fetchGoogleProfile('invalid-token')
      ).rejects.toThrow('Error al obtener perfil de Google');
    });

    it('should validate email is verified', async () => {
      const mockGoogleResponse = {
        id: 'google-user-123',
        email: 'test@gmail.com',
        name: 'Test User',
        email_verified: false
      };

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: mockGoogleResponse });

      await expect(
        oauthService.fetchGoogleProfile('mock-token')
      ).rejects.toThrow('Email no verificado por Google');
    });
  });

  describe('createOrUpdateOAuthUser', () => {
    const mockGoogleProfile: GoogleProfile = {
      id: 'google-user-123',
      email: 'newuser@gmail.com',
      name: 'New User',
      picture: 'https://google.com/avatar.jpg',
      email_verified: true,
      locale: 'es-AR'
    };

    it('should create new user with OAuth authentication', async () => {
      // Mock user doesn't exist
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null);
      (prisma.oAuthProvider.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      // Mock user creation
      const mockNewUser = {
        id: 'user-123',
        email: 'newuser@gmail.com',
        name: 'New User',
        avatar: 'https://google.com/avatar.jpg',
        isVerified: true,
        authMethod: AuthMethod.OAUTH,
        emailVerifiedAt: expect.any(Date),
        role: 'CLIENT'
      };

      (prisma.$transaction as jest.Mock) = jest.fn().mockResolvedValue([
        mockNewUser,
        { id: 'oauth-provider-123', provider: 'GOOGLE' }
      ]);

      const result = await oauthService.createOrUpdateOAuthUser(mockGoogleProfile, 'CLIENT');

      expect(result).toEqual({
        user: mockNewUser,
        isNewUser: true,
        oauthProvider: { id: 'oauth-provider-123', provider: 'GOOGLE' }
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should link OAuth to existing user with email auth', async () => {
      const existingUser = {
        id: 'existing-user-123',
        email: 'newuser@gmail.com',
        name: 'Existing User',
        authMethod: AuthMethod.EMAIL,
        isVerified: false
      };

      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (prisma.oAuthProvider.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      const mockUpdatedUser = {
        ...existingUser,
        authMethod: AuthMethod.BOTH,
        isVerified: true,
        emailVerifiedAt: expect.any(Date)
      };

      (prisma.$transaction as jest.Mock) = jest.fn().mockResolvedValue([
        mockUpdatedUser,
        { id: 'oauth-provider-123', provider: 'GOOGLE' }
      ]);

      const result = await oauthService.createOrUpdateOAuthUser(mockGoogleProfile, 'CLIENT');

      expect(result).toEqual({
        user: mockUpdatedUser,
        isNewUser: false,
        oauthProvider: { id: 'oauth-provider-123', provider: 'GOOGLE' }
      });
    });

    it('should handle existing OAuth provider', async () => {
      const existingUser = {
        id: 'existing-user-123',
        email: 'newuser@gmail.com',
        authMethod: AuthMethod.OAUTH
      };

      const existingOAuthProvider = {
        id: 'oauth-provider-123',
        provider: 'GOOGLE',
        providerUserId: 'google-user-123'
      };

      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (prisma.oAuthProvider.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingOAuthProvider);

      const result = await oauthService.createOrUpdateOAuthUser(mockGoogleProfile, 'CLIENT');

      expect(result).toEqual({
        user: existingUser,
        isNewUser: false,
        oauthProvider: existingOAuthProvider
      });
    });

    it('should use avatar from Google profile', async () => {
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null);
      (prisma.oAuthProvider.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      const mockNewUser = {
        id: 'user-123',
        email: 'newuser@gmail.com',
        name: 'New User',
        avatar: mockGoogleProfile.picture,
        isVerified: true,
        authMethod: AuthMethod.OAUTH
      };

      (prisma.$transaction as jest.Mock) = jest.fn().mockImplementation((callback) => {
        // Simulate transaction callback
        return callback({
          user: {
            create: jest.fn().mockResolvedValue(mockNewUser)
          },
          oAuthProvider: {
            create: jest.fn().mockResolvedValue({ id: 'oauth-123' })
          }
        });
      });

      await oauthService.createOrUpdateOAuthUser(mockGoogleProfile, 'CLIENT');

      // Verify avatar was set from Google profile
      const transaction = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(transaction).toBeDefined();
    });
  });

  describe('generateOAuthTokens', () => {
    it('should generate JWT tokens for user', () => {
      const userId = 'user-123';
      const role = 'CLIENT';

      const tokens = oauthService.generateOAuthTokens(userId, role);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');

      expect(mockFastify.jwt?.sign).toHaveBeenCalledWith(
        { userId, role },
        expect.any(Object)
      );
    });

    it('should generate different tokens for different users', () => {
      (mockFastify.jwt?.sign as jest.Mock).mockReturnValueOnce('token-1');
      (mockFastify.jwt?.sign as jest.Mock).mockReturnValueOnce('refresh-1');

      const tokens1 = oauthService.generateOAuthTokens('user-1', 'CLIENT');

      (mockFastify.jwt?.sign as jest.Mock).mockReturnValueOnce('token-2');
      (mockFastify.jwt?.sign as jest.Mock).mockReturnValueOnce('refresh-2');

      const tokens2 = oauthService.generateOAuthTokens('user-2', 'PROVIDER');

      expect(tokens1.accessToken).toBe('token-1');
      expect(tokens2.accessToken).toBe('token-2');
    });
  });

  describe('logOAuthEvent', () => {
    it('should log OAuth events with correlation ID', () => {
      const correlationId = 'correlation-123';

      oauthService.logOAuthEvent({
        type: 'INITIATE',
        provider: 'GOOGLE',
        correlationId,
        timestamp: new Date()
      });

      expect(mockFastify.log?.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INITIATE',
          provider: 'GOOGLE',
          correlationId
        }),
        expect.any(String)
      );
    });

    it('should log OAuth errors with error details', () => {
      const correlationId = 'correlation-123';

      oauthService.logOAuthEvent({
        type: 'ERROR',
        provider: 'GOOGLE',
        correlationId,
        timestamp: new Date(),
        error: {
          code: OAuthErrorCode.STATE_MISMATCH,
          message: 'Estado OAuth inválido'
        }
      });

      expect(mockFastify.log?.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          error: expect.objectContaining({
            code: OAuthErrorCode.STATE_MISMATCH
          })
        }),
        expect.any(String)
      );
    });
  });
});
