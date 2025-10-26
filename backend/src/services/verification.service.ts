/**
 * Email Verification Service
 * Handles email verification token generation, validation, and marking users as verified
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import emailService from './email.service';
import logger from '../utils/logger';

const TOKEN_EXPIRY_HOURS = 24;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

/**
 * Verification service class
 */
class VerificationService {
  /**
   * Generate a unique verification token
   */
  generateToken(): string {
    return uuidv4();
  }

  /**
   * Hash token using bcrypt for security
   */
  private async hashToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(token, salt);
  }

  /**
   * Compare token with hash
   */
  private async compareToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(userId: string, email: string, userName: string): Promise<string> {
    try {
      // Generate token
      const plainToken = this.generateToken();
      const hashedToken = await this.hashToken(plainToken);

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

      // Store token in database
      await prisma.emailVerificationToken.create({
        data: {
          userId,
          token: hashedToken,
          email,
          expiresAt,
        },
      });

      // Build verification link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLink = `${frontendUrl}/verify-email?token=${plainToken}`;
      const resendLink = `${frontendUrl}/auth/resend-verification?email=${encodeURIComponent(email)}`;

      // Send email
      await emailService.sendVerificationEmail(
        email,
        userName,
        plainToken,
        verificationLink,
        resendLink
      );

      logger.info('Verification email sent', {
        userId,
        email,
        tokenId: hashedToken.substring(0, 10) + '...',
        expiresAt,
      });

      return plainToken;
    } catch (error) {
      logger.error('Failed to send verification email', {
        userId,
        email,
        error,
      });

      throw error;
    }
  }

  /**
   * Validate a verification token
   */
  async validateToken(plainToken: string, email: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      // Find all tokens for this email
      const tokens = await prisma.emailVerificationToken.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        take: 5, // Get last 5 tokens to compare
      });

      if (tokens.length === 0) {
        return {
          valid: false,
          error: 'No verification token found for this email',
        };
      }

      // Try to match the token with any of the hashed tokens
      for (const tokenRecord of tokens) {
        // Check if token is expired
        if (new Date() > tokenRecord.expiresAt) {
          logger.warn('Verification token expired', {
            email,
            expiresAt: tokenRecord.expiresAt,
          });
          continue; // Check next token in case there's a more recent one
        }

        // Compare token
        const isValid = await this.compareToken(plainToken, tokenRecord.token);
        if (isValid) {
          return {
            valid: true,
            userId: tokenRecord.userId,
          };
        }
      }

      return {
        valid: false,
        error: 'Invalid or expired verification token',
      };
    } catch (error) {
      logger.error('Failed to validate token', {
        email,
        error,
      });

      throw error;
    }
  }

  /**
   * Mark email as verified and delete used tokens
   */
  async markEmailVerified(userId: string, email: string): Promise<boolean> {
    try {
      // Update user as verified
      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Delete all tokens for this email
      await prisma.emailVerificationToken.deleteMany({
        where: { email },
      });

      logger.info('Email marked as verified', {
        userId,
        email,
      });

      return true;
    } catch (error) {
      logger.error('Failed to mark email as verified', {
        userId,
        email,
        error,
      });

      throw error;
    }
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    email: string;
    verifiedAt?: Date;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isVerified: true,
          email: true,
          emailVerifiedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        isVerified: user.isVerified,
        email: user.email,
        verifiedAt: user.emailVerifiedAt || undefined,
      };
    } catch (error) {
      logger.error('Failed to get verification status', {
        userId,
        error,
      });

      throw error;
    }
  }

  /**
   * Check if user has pending verification
   */
  async hasPendingVerification(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true },
      });

      return user ? !user.isVerified : false;
    } catch (error) {
      logger.error('Failed to check pending verification', {
        userId,
        error,
      });

      throw error;
    }
  }

  /**
   * Cleanup expired tokens
   * Should be run as a cron job
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.emailVerificationToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Cleaned up expired verification tokens', {
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', { error });
      throw error;
    }
  }
}

// Export singleton instance
export default new VerificationService();
