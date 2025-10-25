import { startServer } from './app';
import redisService from './services/redis';
import { prisma } from './services/database';

// Handle unhandled rejections to prevent crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

// Handle uncaught exceptions - CRITICAL for Redis socket errors
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error.message);

  // Don't crash for Redis socket errors - they have reconnection logic
  if (error.message && (
    error.message.includes('Socket closed') ||
    error.message.includes('Redis') ||
    error.name === 'SocketClosedUnexpectedlyError'
  )) {
    console.log('Redis socket error caught - connection will auto-reconnect');
    return; // Continue running
  }

  // For other critical errors, exit gracefully
  console.error('Fatal error - shutting down');
  process.exit(1);
});

// Handle graceful shutdown - Hot reload test
// This comment tests the hot reload functionality
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisService.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await redisService.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});