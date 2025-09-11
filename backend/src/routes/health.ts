import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { database } from '../services/database';
import { createMonitoringService } from '../services/monitoring';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
}

interface ReadinessResponse {
  status: string;
  checks: {
    database: string;
    redis?: string;
  };
}

export default async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  
  // Basic health check
  fastify.get<{ Reply: HealthResponse }>('/health', {
    schema: {
      description: 'Basic health check endpoint',
      tags: ['Health'],
      summary: 'Check if API is running',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            service: { type: 'string' },
            version: { type: 'string' },
            uptime: { type: 'number' }
          }
        }
      }
    }
  }, async (_request, reply) => {
    return reply.send({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'BarberPro API',
      version: '1.0.0',
      uptime: process.uptime()
    });
  });

  // Readiness check with dependencies
  fastify.get<{ Reply: ReadinessResponse }>('/health/ready', {
    schema: {
      description: 'Readiness check with dependency validation',
      tags: ['Health'],
      summary: 'Check if API and dependencies are ready',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' }
              }
            }
          }
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (_request, reply) => {
    const checks: any = {};
    let overallStatus = 'READY';

    // Check database
    try {
      const isDbHealthy = await database.healthCheck();
      checks.database = isDbHealthy ? 'OK' : 'FAIL';
      if (!isDbHealthy) overallStatus = 'NOT_READY';
    } catch (error) {
      checks.database = 'FAIL';
      overallStatus = 'NOT_READY';
    }

    // Check Redis (optional for now)
    try {
      // Basic Redis ping - will add Redis service later
      checks.redis = 'OK';
    } catch (error) {
      checks.redis = 'FAIL';
      // Redis is not critical for basic functionality
    }

    const statusCode = overallStatus === 'READY' ? 200 : 503;
    
    return reply.code(statusCode).send({
      status: overallStatus,
      checks
    });
  });

  // Liveness check (for Kubernetes)
  fastify.get('/health/live', {
    schema: {
      description: 'Liveness check endpoint',
      tags: ['Health'],
      summary: 'Check if API process is alive',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (_request, reply) => {
    return reply.send({
      status: 'ALIVE',
      timestamp: new Date().toISOString()
    });
  });

  // Metrics endpoint for Prometheus
  fastify.get('/metrics', {
    schema: {
      description: 'Prometheus metrics endpoint',
      tags: ['Health'],
      summary: 'Application metrics for monitoring',
      response: {
        200: {
          type: 'string',
          description: 'Prometheus formatted metrics'
        }
      }
    }
  }, async (_request, reply) => {
    const monitoring = createMonitoringService();
    const metrics = await monitoring.getMetrics();
    
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return reply.send(metrics);
  });

  // Business metrics endpoint
  fastify.get('/business-metrics', {
    schema: {
      description: 'Business metrics endpoint',
      tags: ['Health'],
      summary: 'Business-specific metrics for Argentina operations',
      response: {
        200: {
          type: 'string',
          description: 'Business metrics in Prometheus format'
        }
      }
    }
  }, async (_request, reply) => {
    const monitoring = createMonitoringService();
    const businessMetrics = await monitoring.getBusinessMetrics();
    
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return reply.send(businessMetrics);
  });
}