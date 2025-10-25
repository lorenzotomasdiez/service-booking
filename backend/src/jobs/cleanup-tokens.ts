import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

/**
 * T070: Cleanup cron job for expired EmailVerificationTokens
 *
 * This job deletes expired email verification tokens from the database.
 * Schedule: Runs daily at 2:00 AM (Argentina timezone)
 *
 * Benefits:
 * - Keeps database clean and optimized
 * - Removes stale tokens that can't be used
 * - Improves query performance on tokens table
 */

interface CleanupStats {
  deletedCount: number;
  timestamp: Date;
  executionTimeMs: number;
}

export class TokenCleanupJob {
  private prisma: PrismaClient;
  private logger: FastifyInstance['log'];
  private intervalId?: NodeJS.Timeout;

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma;
    this.logger = fastify.log;
  }

  /**
   * Execute cleanup of expired tokens
   * Deletes all EmailVerificationTokens where expiresAt < now()
   */
  async execute(): Promise<CleanupStats> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting email verification token cleanup job');

      // Delete all expired tokens
      const result = await this.prisma.emailVerificationToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      const executionTimeMs = Date.now() - startTime;

      const stats: CleanupStats = {
        deletedCount: result.count,
        timestamp: new Date(),
        executionTimeMs
      };

      this.logger.info('Email verification token cleanup completed', {
        deletedTokens: stats.deletedCount,
        executionTimeMs: stats.executionTimeMs
      });

      return stats;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;

      this.logger.error('Email verification token cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs
      });

      // Return stats with 0 deleted on error
      return {
        deletedCount: 0,
        timestamp: new Date(),
        executionTimeMs
      };
    }
  }

  /**
   * Schedule the cleanup job to run daily at 2:00 AM Argentina time
   * Uses setInterval for simplicity (in production, use node-cron or similar)
   */
  schedule(): void {
    // Calculate milliseconds until next 2:00 AM Argentina time
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Next day
      2, // 2 AM
      0,
      0,
      0
    );

    // If we're past 2 AM today, schedule for tomorrow
    if (now.getHours() >= 2) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const msUntilNextRun = nextRun.getTime() - now.getTime();

    this.logger.info('Scheduling token cleanup job', {
      nextRun: nextRun.toISOString(),
      msUntilNextRun
    });

    // Schedule first run
    setTimeout(() => {
      this.execute();

      // Then run every 24 hours
      this.intervalId = setInterval(() => {
        this.execute();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilNextRun);
  }

  /**
   * Stop the scheduled job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.logger.info('Token cleanup job stopped');
    }
  }

  /**
   * Run cleanup immediately (for testing or manual execution)
   */
  async runNow(): Promise<CleanupStats> {
    return this.execute();
  }
}

/**
 * Factory function to create and schedule the cleanup job
 */
export function setupTokenCleanupJob(fastify: FastifyInstance): TokenCleanupJob {
  const job = new TokenCleanupJob(fastify);
  job.schedule();
  return job;
}

/**
 * Run cleanup manually (for scripts or testing)
 */
export async function runTokenCleanup(fastify: FastifyInstance): Promise<CleanupStats> {
  const job = new TokenCleanupJob(fastify);
  return job.runNow();
}
