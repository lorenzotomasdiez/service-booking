import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import promClient from 'prom-client';

// Create a registry for Prometheus metrics
const register = new promClient.Registry();

// Collect default Node.js metrics (memory, CPU, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'barberpro_nodejs_'
});

// Custom HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// Custom HTTP request counter
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Custom HTTP error counter
const httpErrorsTotal = new promClient.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Active connections gauge
const activeConnections = new promClient.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register]
});

// Application-specific metrics
const appInfo = new promClient.Gauge({
  name: 'barberpro_app_info',
  help: 'Application information',
  labelNames: ['version', 'environment', 'region'],
  registers: [register]
});

// Set application info
appInfo.set(
  {
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    region: 'argentina'
  },
  1
);

// Extend FastifyRequest type to include startTime
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}

/**
 * Fastify plugin for Prometheus metrics
 *
 * This plugin:
 * - Collects default Node.js metrics (memory, CPU, event loop, etc.)
 * - Tracks HTTP request duration, count, and errors
 * - Tracks active connections
 * - Exposes metrics via /metrics endpoint
 */
const metricsPlugin: FastifyPluginAsync = async (fastify) => {
  // Hook to record start time of each request
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.startTime = Date.now();
    activeConnections.inc();
  });

  // Hook to record metrics after response is sent
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.startTime) {
      const duration = (Date.now() - request.startTime) / 1000; // Convert to seconds
      const route = (request as any).routerPath || request.url;
      const method = request.method;
      const statusCode = reply.statusCode.toString();

      // Record request duration
      httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        duration
      );

      // Increment request counter
      httpRequestTotal.inc({ method, route, status_code: statusCode });

      // Increment error counter for 4xx and 5xx responses
      if (reply.statusCode >= 400) {
        httpErrorsTotal.inc({ method, route, status_code: statusCode });
      }

      // Decrement active connections
      activeConnections.dec();
    }
  });

  // Hook to decrement active connections on error
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    activeConnections.dec();
  });

  // Metrics endpoint
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.type(register.contentType);
      const metrics = await register.metrics();
      return metrics;
    } catch (error) {
      fastify.log.error('Error generating metrics:', error);
      reply.code(500).send({ error: 'Failed to generate metrics' });
    }
  });

  fastify.log.info('Prometheus metrics plugin registered - metrics available at /metrics');
};

export default metricsPlugin;

// Export register for testing purposes
export { register };
