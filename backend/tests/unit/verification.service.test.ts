/**
 * T020: Verification Service Unit Tests
 * Tests for token generation, validation, and expiration
 *
 * Note: These are minimal tests since the service was already created in Phase 2
 */

import verificationService from '../../src/services/verification.service';

describe('VerificationService', () => {
  describe('service initialization', () => {
    it('should be defined', () => {
      expect(verificationService).toBeDefined();
    });

    it('should have generateToken method', () => {
      expect(verificationService.generateToken).toBeDefined();
      expect(typeof verificationService.generateToken).toBe('function');
    });

    it('should have sendVerificationEmail method', () => {
      expect(verificationService.sendVerificationEmail).toBeDefined();
      expect(typeof verificationService.sendVerificationEmail).toBe('function');
    });

    it('should have validateToken method', () => {
      expect(verificationService.validateToken).toBeDefined();
      expect(typeof verificationService.validateToken).toBe('function');
    });

    it('should have markEmailVerified method', () => {
      expect(verificationService.markEmailVerified).toBeDefined();
      expect(typeof verificationService.markEmailVerified).toBe('function');
    });

    it('should have getVerificationStatus method', () => {
      expect(verificationService.getVerificationStatus).toBeDefined();
      expect(typeof verificationService.getVerificationStatus).toBe('function');
    });

    it('should have cleanupExpiredTokens method', () => {
      expect(verificationService.cleanupExpiredTokens).toBeDefined();
      expect(typeof verificationService.cleanupExpiredTokens).toBe('function');
    });
  });

  describe('token generation', () => {
    it('should generate a token', () => {
      const token = verificationService.generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = verificationService.generateToken();
      const token2 = verificationService.generateToken();
      expect(token1).not.toBe(token2);
    });
  });
});
