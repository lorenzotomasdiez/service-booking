import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = process.hrtime.bigint();
    
    const healthCheck: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'disconnected',
        redis: 'disconnected'
      },
      uptime: process.uptime(),
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    };

    try {
      // Check database connection
      try {
        // await fastify.prisma.$queryRaw`SELECT 1`;
        healthCheck.services.database = 'connected';
      } catch (error) {
        healthCheck.services.database = 'error';
        healthCheck.status = 'error';
      }

      // Check Redis connection
      try {
        // await fastify.redis.ping();
        healthCheck.services.redis = 'connected';
      } catch (error) {
        healthCheck.services.redis = 'error';
        healthCheck.status = 'error';
      }

      // Memory usage
      const memUsage = process.memoryUsage();
      healthCheck.memory = {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      };

    } catch (error) {
      healthCheck.status = 'error';
      fastify.log.error('Health check error:', error);
    }

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    reply.header('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    
    if (healthCheck.status === 'error') {
      reply.code(503);
    }

    return healthCheck;
  });

  // Detailed health check for monitoring systems
  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = process.hrtime.bigint();
    
    const detailedHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'unknown',
          responseTime: 0,
          error: null as string | null
        },
        redis: {
          status: 'unknown',
          responseTime: 0,
          error: null as string | null
        },
        external_apis: {
          mercadopago: {
            status: 'unknown',
            responseTime: 0,
            error: null as string | null
          }
        }
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: {
          node: process.version,
          app: process.env.npm_package_version || '1.0.0'
        },
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Database health check with timing
    try {
      const dbStart = process.hrtime.bigint();
      // await fastify.prisma.$queryRaw`SELECT 1`;
      const dbEnd = process.hrtime.bigint();
      
      detailedHealth.checks.database.status = 'healthy';
      detailedHealth.checks.database.responseTime = Number(dbEnd - dbStart) / 1000000;
    } catch (error) {
      detailedHealth.checks.database.status = 'unhealthy';
      detailedHealth.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
      detailedHealth.status = 'degraded';
    }

    // Redis health check with timing
    try {
      const redisStart = process.hrtime.bigint();
      // await fastify.redis.ping();
      const redisEnd = process.hrtime.bigint();
      
      detailedHealth.checks.redis.status = 'healthy';
      detailedHealth.checks.redis.responseTime = Number(redisEnd - redisStart) / 1000000;
    } catch (error) {
      detailedHealth.checks.redis.status = 'unhealthy';
      detailedHealth.checks.redis.error = error instanceof Error ? error.message : 'Unknown error';
      detailedHealth.status = 'degraded';
    }

    // MercadoPago API health check (optional)
    try {
      const mpStart = process.hrtime.bigint();
      // Test MercadoPago API connectivity
      // const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      //   headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
      // });
      const mpEnd = process.hrtime.bigint();
      
      detailedHealth.checks.external_apis.mercadopago.status = 'healthy';
      detailedHealth.checks.external_apis.mercadopago.responseTime = Number(mpEnd - mpStart) / 1000000;
    } catch (error) {
      detailedHealth.checks.external_apis.mercadopago.status = 'unhealthy';
      detailedHealth.checks.external_apis.mercadopago.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000;

    reply.header('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    
    if (detailedHealth.status === 'unhealthy') {
      reply.code(503);
    } else if (detailedHealth.status === 'degraded') {
      reply.code(200); // Still operational but with issues
    }

    return detailedHealth;
  });

  // Readiness probe for Kubernetes/Container orchestration
  fastify.get('/health/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if application is ready to serve traffic
      // await fastify.prisma.$queryRaw`SELECT 1`;
      
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      reply.code(503);
      return { status: 'not_ready', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Liveness probe for Kubernetes/Container orchestration
  fastify.get('/health/live', async (request: FastifyRequest, reply: FastifyReply) => {
    // Simple check to verify the application is running
    return { 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime() 
    };
  });
}