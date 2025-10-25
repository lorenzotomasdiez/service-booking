/**
 * Prisma Client Singleton
 * Ensures a single instance of Prisma client across the application
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
