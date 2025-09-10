import { FastifyInstance, FastifyPluginOptions } from 'fastify';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
}

export default async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get<{ Reply: HealthResponse }>('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
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

  fastify.get('/health/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['Health'],
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
        }
      }
    }
  }, async (_request, reply) => {
    // TODO: Add actual database and redis health checks
    return reply.send({
      status: 'READY',
      checks: {
        database: 'OK',
        redis: 'OK'
      }
    });
  });
}