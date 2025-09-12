import { FastifyInstance } from 'fastify';
import { buildServer } from './app';
import { initializeSocketService } from './services/socket';
import { reminderService } from './services/reminder';
import { createLiveOptimizationService } from './services/live-optimization';

const start = async (): Promise<void> => {
  const server: FastifyInstance = buildServer();

  try {
    await server.listen({ 
      port: Number(process.env.PORT) || 3000, 
      host: '0.0.0.0' 
    });
    
    // Initialize Socket.io with the HTTP server
    const socketService = initializeSocketService(server.server);
    
    // Start reminder processing daemon
    reminderService.startReminderProcessor();
    
    // Initialize live optimization service for launch day
    const optimizationService = createLiveOptimizationService();
    
    console.log(`🚀 BarberPro API Server running on http://localhost:${Number(process.env.PORT) || 3000}`);
    console.log(`📖 API Documentation available at http://localhost:${Number(process.env.PORT) || 3000}/docs`);
    console.log(`🔌 Socket.io server initialized for real-time features`);
    console.log(`⏰ Booking reminder system initialized`);
    console.log(`📊 Launch day monitoring and analytics activated`);
    console.log(`⚡ Live optimization service running for performance tuning`);
    console.log(`🇦🇷 Argentina market optimization enabled`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();