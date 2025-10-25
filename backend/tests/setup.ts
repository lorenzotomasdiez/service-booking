/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower rounds for faster tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barberpro_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// SMTP settings for testing (MailHog)
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = '';
process.env.SMTP_PASSWORD = '';
process.env.SMTP_FROM = 'test@barberpro.com.ar';
process.env.SMTP_FROM_NAME = 'BarberPro Test';

// Google OAuth settings (mock)
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  generateRandomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com.ar`,
  generateRandomPhone: () => `+54-11-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  generateRandomDNI: () => String(Math.floor(10000000 + Math.random() * 90000000)),
};

export {};
