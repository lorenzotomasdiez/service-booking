/**
 * Jest Setup File for BarberPro Backend Testing
 * Sets up testing environment, database connections, and global test utilities
 */

import { PrismaClient } from '@prisma/client';
import { jest, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Global variables for testing
declare global {
  var __PRISMA_CLIENT__: PrismaClient;
  var __TEST_DATABASE_URL__: string;
}

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    on: jest.fn(),
    isReady: true
  }))
}));

// Environment setup for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/barberpro_test';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use DB 1 for testing

// Setup test database connection
beforeAll(async () => {
  // Initialize Prisma client for testing
  global.__PRISMA_CLIENT__ = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  try {
    await global.__PRISMA_CLIENT__.$connect();
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (global.__PRISMA_CLIENT__) {
    await global.__PRISMA_CLIENT__.$disconnect();
  }
});

// Clean database between test suites
beforeEach(async () => {
  if (global.__PRISMA_CLIENT__) {
    // Clean all tables in reverse order to handle foreign keys
    const tablenames = await global.__PRISMA_CLIENT__.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await global.__PRISMA_CLIENT__.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          console.log(`Could not truncate ${tablename}, probably doesn't exist yet`);
        }
      }
    }
  }
});

// Test utilities
export const testUtils = {
  /**
   * Create a test user for authentication testing
   */
  async createTestUser(userData: any = {}) {
    const defaultUser = {
      email: 'test@barberpro.com',
      name: 'Test User',
      phone: '+5491123456789',
      role: 'CLIENT',
      ...userData
    };
    
    return await global.__PRISMA_CLIENT__.user.create({
      data: defaultUser
    });
  },

  /**
   * Create a test provider for provider-related testing
   */
  async createTestProvider(providerData: any = {}) {
    const defaultProvider = {
      email: 'provider@barberpro.com',
      name: 'Test Provider',
      phone: '+5491123456789',
      role: 'PROVIDER',
      ...providerData
    };
    
    return await global.__PRISMA_CLIENT__.user.create({
      data: defaultProvider
    });
  },

  /**
   * Create test service data
   */
  async createTestService(providerId: string, serviceData: any = {}) {
    const defaultService = {
      name: 'Corte Clásico',
      description: 'Corte de cabello tradicional',
      duration: 30,
      price: 800,
      providerId,
      ...serviceData
    };
    
    return await global.__PRISMA_CLIENT__.service.create({
      data: defaultService
    });
  },

  /**
   * Generate test JWT token
   */
  generateTestJWT(userId: string, role: string = 'CLIENT', expiresIn: string = '24h') {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        userId, 
        role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET!,
      { expiresIn }
    );
  },

  /**
   * Get current timestamp for Argentina timezone
   */
  getArgentinaTimestamp() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  }
};

// Export Prisma client for use in tests
export const prisma = global.__PRISMA_CLIENT__;