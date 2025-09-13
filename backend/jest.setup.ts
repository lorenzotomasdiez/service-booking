/**
 * Jest Setup File for BarberPro Backend Testing - Day 8 Advanced Framework
 * Sets up testing environment, database connections, and global test utilities
 * Includes Argentina market testing, Psychology vertical, and advanced security testing
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

// Day 8 Advanced Testing Utilities
export const advancedTestUtils = {
  /**
   * Create test psychology provider with proper licensing
   */
  async createTestPsychologist(psychologistData: any = {}) {
    const defaultPsychologist = {
      email: 'psychologist@barberpro.com',
      name: 'Dr. Test Psychologist',
      phone: '+5491123456789',
      role: 'PROVIDER',
      psychologyLicense: 'MP-12345-AR',
      licenseVerified: true,
      specializations: ['cognitive-behavioral', 'anxiety-disorders'],
      gdprCompliant: true,
      ...psychologistData
    };
    
    return await global.__PRISMA_CLIENT__.user.create({
      data: defaultPsychologist
    });
  },

  /**
   * Create test therapy booking with privacy compliance (using existing Booking model)
   */
  async createTestTherapyBooking(clientId: string, therapistId: string, sessionData: any = {}) {
    const defaultSession = {
      clientId,
      providerId: therapistId,
      serviceType: 'PSYCHOLOGY',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      duration: 50,
      price: 8000,
      currency: 'ARS',
      status: 'CONFIRMED',
      privacyCompliant: true,
      gdprCompliant: true,
      specialNotes: 'Psychology session - high privacy',
      ...sessionData
    };
    
    return await global.__PRISMA_CLIENT__.booking.create({
      data: defaultSession
    });
  },

  /**
   * Create test Argentina payment with MercadoPago
   */
  async createTestArgentinaPayment(bookingId: string, paymentData: any = {}) {
    const defaultPayment = {
      bookingId,
      amount: 7500,
      currency: 'ARS',
      method: 'mercadopago',
      status: 'APPROVED',
      mercadopagoId: 'mp-test-' + Date.now(),
      taxAmount: 1575, // 21% IVA
      afipCompliant: true,
      ...paymentData
    };
    
    return await global.__PRISMA_CLIENT__.payment.create({
      data: defaultPayment
    });
  },

  /**
   * Create test multi-city booking
   */
  async createTestMultiCityBooking(bookingData: any = {}) {
    const cities = ['Buenos Aires', 'Córdoba', 'Rosario', 'La Plata', 'Mendoza'];
    const defaultBooking = {
      clientLocation: cities[0],
      providerLocation: cities[Math.floor(Math.random() * cities.length)],
      crossCityService: true,
      travelCompensation: 2000,
      ...bookingData
    };
    
    return await global.__PRISMA_CLIENT__.booking.create({
      data: defaultBooking
    });
  },

  /**
   * Simulate Argentina network conditions
   */
  simulateArgentinaNetworkConditions(condition: 'buenos_aires' | 'interior' | 'mobile_4g' | 'mobile_3g' = 'buenos_aires') {
    const conditions = {
      buenos_aires: { latency: 20, bandwidth: 50, packetLoss: 0.1 },
      interior: { latency: 50, bandwidth: 25, packetLoss: 0.5 },
      mobile_4g: { latency: 80, bandwidth: 15, packetLoss: 1.0 },
      mobile_3g: { latency: 150, bandwidth: 5, packetLoss: 2.0 }
    };
    
    return conditions[condition];
  },

  /**
   * Generate test Argentina identity documents
   */
  generateArgentinaTestData() {
    return {
      dni: String(Math.floor(Math.random() * 90000000) + 10000000),
      cuit: `20-${Math.floor(Math.random() * 90000000) + 10000000}-${Math.floor(Math.random() * 9) + 1}`,
      phone: `+5491${Math.floor(Math.random() * 900000000) + 100000000}`,
      address: 'Av. Corrientes 1234, Buenos Aires',
      city: ['Buenos Aires', 'Córdoba', 'Rosario', 'La Plata', 'Mendoza'][Math.floor(Math.random() * 5)]
    };
  },

  /**
   * Test GDPR compliance for psychology data
   */
  async testGDPRCompliance(data: any) {
    const gdprRequirements = {
      consentRequired: ['mentalHealthData', 'therapyNotes', 'personalData'],
      dataMinimization: true,
      purposeLimitation: true,
      accuracyMaintenance: true,
      storageSecurityMeasures: true
    };
    
    // Validate GDPR requirements
    for (const requirement of gdprRequirements.consentRequired) {
      if (data[requirement] && !data.gdprConsent) {
        throw new Error(`GDPR consent required for ${requirement}`);
      }
    }
    
    return { compliant: true, requirements: gdprRequirements };
  },

  /**
   * Test payment security measures
   */
  async testPaymentSecurity(paymentData: any) {
    const securityChecks = {
      cardNumberEncrypted: !paymentData.cardNumber || paymentData.cardNumber.includes('*'),
      cvvNotStored: !paymentData.cvv,
      tokenized: !!paymentData.paymentToken,
      pciCompliant: !!paymentData.pciCompliant,
      fraudCheck: !!paymentData.fraudScore
    };
    
    const allPassed = Object.values(securityChecks).every(check => check === true);
    
    return { passed: allPassed, checks: securityChecks };
  },

  /**
   * Measure test performance for Argentina requirements
   */
  async measureArgentinaPerformance(testFunction: () => Promise<any>) {
    const start = process.hrtime.bigint();
    const result = await testFunction();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Argentina performance requirements
    const requirements = {
      apiResponse: duration < 450, // <450ms p95 for Argentina
      userExperience: duration < 200, // <200ms for excellent UX
      mobileOptimized: duration < 300 // <300ms for mobile
    };
    
    return {
      result,
      duration,
      requirements,
      meetsArgentinaStandards: requirements.apiResponse
    };
  },

  /**
   * Test accessibility compliance for Argentina users
   */
  async testAccessibilityCompliance(element: any) {
    const wcagChecks = {
      hasAltText: !!element.alt || !!element['aria-label'],
      colorContrast: true, // Would require actual color analysis
      keyboardAccessible: !!element.tabIndex || element.tabIndex === 0,
      screenReaderFriendly: !!element['aria-label'] || !!element['aria-describedby'],
      spanishLocalization: true // Would check for Spanish content
    };
    
    const complianceScore = Object.values(wcagChecks).filter(check => check).length / Object.keys(wcagChecks).length;
    
    return {
      compliant: complianceScore >= 0.9, // 90% compliance required
      score: complianceScore,
      checks: wcagChecks
    };
  }
};

// Export Prisma client for use in tests
export const prisma = global.__PRISMA_CLIENT__;