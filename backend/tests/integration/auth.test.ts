/**
 * Authentication Flow Integration Tests
 * Tests all authentication endpoints with Argentina-specific validations
 */

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testUtils, prisma } from '../../jest.setup';

describe('Authentication Flow Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration', () => {
    it('should register a new client with valid Argentina phone', async () => {
      const userData = {
        email: 'carlos@example.com',
        password: 'SecurePass123!',
        name: 'Carlos Rodriguez',
        phone: '+5491123456789',
        role: 'CLIENT'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.phone).toBe(userData.phone);
      expect(result.token).toBeDefined();
      expect(result.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should register a provider with DNI validation', async () => {
      const providerData = {
        email: 'martin@barberia.com',
        password: 'ProviderPass123!',
        name: 'Martín García',
        phone: '+5491187654321',
        role: 'PROVIDER',
        dni: '20123456789', // Valid Argentina DNI format
        businessName: 'Barbería Martín'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: providerData
      });

      expect(response.statusCode).toBe(201);
      const result = response.json();
      expect(result.user.role).toBe('PROVIDER');
      expect(result.user.dni).toBe(providerData.dni);
    });

    it('should reject registration with invalid Argentina phone format', async () => {
      const invalidPhoneData = {
        email: 'invalid@example.com',
        password: 'SecurePass123!',
        name: 'Invalid User',
        phone: '+1234567890', // Non-Argentina phone
        role: 'CLIENT'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: invalidPhoneData
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('phone');
    });

    it('should reject registration with invalid DNI format', async () => {
      const invalidDniData = {
        email: 'invalid@barberia.com',
        password: 'ProviderPass123!',
        name: 'Invalid Provider',
        phone: '+5491123456789',
        role: 'PROVIDER',
        dni: '123456', // Invalid DNI format
        businessName: 'Invalid Barbería'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: invalidDniData
      });

      expect(response.statusCode).toBe(400);
      const result = response.json();
      expect(result.error).toContain('dni');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'First User',
        phone: '+5491123456789',
        role: 'CLIENT'
      };

      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      // Duplicate registration attempt
      const duplicateResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { ...userData, name: 'Second User' }
      });

      expect(duplicateResponse.statusCode).toBe(409);
      const result = duplicateResponse.json();
      expect(result.error).toContain('email already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await testUtils.createTestUser({
        email: 'login@test.com',
        password: '$2b$10$hashedpassword', // Pre-hashed password
        name: 'Login Test User',
        phone: '+5491123456789'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'correctpassword'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.user.password).toBeUndefined();
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(401);
      const result = response.json();
      expect(result.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'anypassword'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(401);
      const result = response.json();
      expect(result.error).toContain('Invalid credentials');
    });
  });

  describe('JWT Token Validation', () => {
    let testUser: any;
    let validToken: string;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'jwt@test.com',
        name: 'JWT Test User'
      });
      validToken = testUtils.generateTestJWT(testUser.id, testUser.role);
    });

    it('should accept requests with valid JWT token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${validToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.id).toBe(testUser.id);
    });

    it('should reject requests with invalid JWT token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: 'Bearer invalidtoken'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject requests without JWT token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject expired JWT tokens', async () => {
      const expiredToken = testUtils.generateTestJWT(testUser.id, testUser.role, '-1h');
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      await testUtils.createTestUser({
        email: 'reset@test.com',
        name: 'Reset Test User',
        phone: '+5491123456789'
      });
    });

    it('should initiate password reset for existing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'reset@test.com' }
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.message).toContain('Password reset');
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email: 'nonexistent@test.com' }
      });

      // Should return 200 for security reasons (not reveal if email exists)
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Role-Based Access Control', () => {
    let clientUser: any;
    let providerUser: any;
    let clientToken: string;
    let providerToken: string;

    beforeEach(async () => {
      clientUser = await testUtils.createTestUser({
        email: 'client@test.com',
        role: 'CLIENT'
      });
      
      providerUser = await testUtils.createTestProvider({
        email: 'provider@test.com',
        role: 'PROVIDER'
      });

      clientToken = testUtils.generateTestJWT(clientUser.id, 'CLIENT');
      providerToken = testUtils.generateTestJWT(providerUser.id, 'PROVIDER');
    });

    it('should allow providers to access provider-only endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/providers/dashboard',
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
    });

    it('should deny clients access to provider-only endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/providers/dashboard',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow both roles to access general endpoints', async () => {
      const clientResponse = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${clientToken}`
        }
      });

      const providerResponse = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: `Bearer ${providerToken}`
        }
      });

      expect(clientResponse.statusCode).toBe(200);
      expect(providerResponse.statusCode).toBe(200);
    });
  });
});