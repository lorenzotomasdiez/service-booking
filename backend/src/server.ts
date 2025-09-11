import { FastifyInstance } from 'fastify';
import { buildServer } from './app';
import { initializeSocketService } from './services/socket';

const start = async (): Promise<void> => {
  const server: FastifyInstance = buildServer();

  try {
    await server.listen({ 
      port: Number(process.env.PORT) || 3000, 
      host: '0.0.0.0' 
    });
    
    // Initialize Socket.io with the HTTP server
    const socketService = initializeSocketService(server.server);
    
    console.log(`🚀 BarberPro API Server running on http://localhost:${Number(process.env.PORT) || 3000}`);
    console.log(`📖 API Documentation available at http://localhost:${Number(process.env.PORT) || 3000}/docs`);
    console.log(`🔌 Socket.io server initialized for real-time features`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();