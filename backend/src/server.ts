import { FastifyInstance } from 'fastify';
import { buildServer } from './app';

const start = async (): Promise<void> => {
  const server: FastifyInstance = buildServer();

  try {
    await server.listen({ 
      port: Number(process.env.PORT) || 3000, 
      host: '0.0.0.0' 
    });
    
    console.log(`🚀 BarberPro API Server running on http://localhost:${Number(process.env.PORT) || 3000}`);
    console.log(`📖 API Documentation available at http://localhost:${Number(process.env.PORT) || 3000}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();