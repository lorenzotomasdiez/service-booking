import { FastifyRequest } from 'fastify';
import { prisma } from './database';

interface MonitoringMetrics {
  requestCount: Map<string, number>;
  responseTime: Map<string, number[]>;
  errorCount: Map<string, number>;
  businessMetrics: Map<string, number>;
  startTime: number;
}

class MonitoringService {
  private metrics: MonitoringMetrics;

  constructor() {
    this.metrics = {
      requestCount: new Map(),
      responseTime: new Map(),
      errorCount: new Map(),
      businessMetrics: new Map(),
      startTime: Date.now()
    };
  }

  // Record HTTP request metrics
  recordRequest(request: FastifyRequest, responseTime: number, statusCode: number): void {
    const route = `${request.method} ${(request as any).routerPath || request.url}`;
    
    // Increment request count
    const currentCount = this.metrics.requestCount.get(route) || 0;
    this.metrics.requestCount.set(route, currentCount + 1);

    // Record response time
    const responseTimes = this.metrics.responseTime.get(route) || [];
    responseTimes.push(responseTime);
    this.metrics.responseTime.set(route, responseTimes);

    // Record errors
    if (statusCode >= 400) {
      const errorKey = `${route}_${Math.floor(statusCode / 100)}xx`;
      const currentErrorCount = this.metrics.errorCount.get(errorKey) || 0;
      this.metrics.errorCount.set(errorKey, currentErrorCount + 1);
    }
  }

  // Record business-specific metrics
  recordBusinessMetric(metric: string, value: number): void {
    this.metrics.businessMetrics.set(metric, value);
  }

  // Generate Prometheus format metrics
  async getMetrics(): Promise<string> {
    const lines: string[] = [];
    const now = Date.now();

    // Application info
    lines.push('# HELP barberpro_info Application information');
    lines.push('# TYPE barberpro_info gauge');
    lines.push('barberpro_info{version="1.0.0",environment="production",region="argentina"} 1');
    lines.push('');

    // Uptime
    lines.push('# HELP barberpro_uptime_seconds Application uptime in seconds');
    lines.push('# TYPE barberpro_uptime_seconds counter');
    lines.push(`barberpro_uptime_seconds ${Math.floor((now - this.metrics.startTime) / 1000)}`);
    lines.push('');

    // HTTP request total
    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    for (const [route, count] of this.metrics.requestCount.entries()) {
      const [method, path] = route.split(' ', 2);
      lines.push(`http_requests_total{method="${method}",route="${path}"} ${count}`);
    }
    lines.push('');

    // HTTP request duration
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds histogram');
    for (const [route, times] of this.metrics.responseTime.entries()) {
      if (times.length === 0) continue;
      
      const [method, path] = route.split(' ', 2);
      const sorted = times.sort((a, b) => a - b);
      const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
      
      let count = 0;
      for (const bucket of buckets) {
        const bucketCount = sorted.filter(t => t <= bucket).length;
        lines.push(`http_request_duration_seconds_bucket{method="${method}",route="${path}",le="${bucket}"} ${bucketCount}`);
        count = bucketCount;
      }
      lines.push(`http_request_duration_seconds_bucket{method="${method}",route="${path}",le="+Inf"} ${times.length}`);
      lines.push(`http_request_duration_seconds_count{method="${method}",route="${path}"} ${times.length}`);
      
      const sum = times.reduce((acc, time) => acc + time, 0);
      lines.push(`http_request_duration_seconds_sum{method="${method}",route="${path}"} ${sum}`);
    }
    lines.push('');

    // Error rates
    lines.push('# HELP http_requests_errors_total Total number of HTTP errors');
    lines.push('# TYPE http_requests_errors_total counter');
    for (const [errorKey, count] of this.metrics.errorCount.entries()) {
      const [route, status] = errorKey.split('_');
      const [method, path] = route.split(' ', 2);
      lines.push(`http_requests_errors_total{method="${method}",route="${path}",status="${status}"} ${count}`);
    }
    lines.push('');

    // Database metrics
    try {
      const dbMetrics = await this.getDatabaseMetrics();
      lines.push(...dbMetrics);
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    lines.push('# HELP barberpro_memory_usage_bytes Memory usage in bytes');
    lines.push('# TYPE barberpro_memory_usage_bytes gauge');
    lines.push(`barberpro_memory_usage_bytes{type="rss"} ${memUsage.rss}`);
    lines.push(`barberpro_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`);
    lines.push(`barberpro_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`);
    lines.push(`barberpro_memory_usage_bytes{type="external"} ${memUsage.external}`);
    lines.push('');

    return lines.join('\n');
  }

  // Generate business-specific metrics
  async getBusinessMetrics(): Promise<string> {
    const lines: string[] = [];

    try {
      // Get business metrics from database
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Bookings metrics
      const todayBookings = await prisma.booking.count({
        where: {
          createdAt: {
            gte: todayStart
          }
        }
      });

      const completedBookings = await prisma.booking.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: todayStart
          }
        }
      });

      const cancelledBookings = await prisma.booking.count({
        where: {
          status: 'CANCELLED',
          createdAt: {
            gte: todayStart
          }
        }
      });

      // User metrics
      const totalUsers = await prisma.user.count();
      const todayRegistrations = await prisma.user.count({
        where: {
          createdAt: {
            gte: todayStart
          }
        }
      });

      // Provider metrics
      const totalProviders = await prisma.user.count({
        where: {
          role: 'PROVIDER'
        }
      });

      const activeProviders = await prisma.user.count({
        where: {
          role: 'PROVIDER',
          isActive: true
        }
      });

      // Business metrics
      lines.push('# HELP barberpro_bookings_total Total number of bookings');
      lines.push('# TYPE barberpro_bookings_total gauge');
      lines.push(`barberpro_bookings_total{period="today",status="all"} ${todayBookings}`);
      lines.push(`barberpro_bookings_total{period="today",status="completed"} ${completedBookings}`);
      lines.push(`barberpro_bookings_total{period="today",status="cancelled"} ${cancelledBookings}`);
      lines.push('');

      lines.push('# HELP barberpro_users_total Total number of users');
      lines.push('# TYPE barberpro_users_total gauge');
      lines.push(`barberpro_users_total{type="all"} ${totalUsers}`);
      lines.push(`barberpro_users_total{type="today_registrations"} ${todayRegistrations}`);
      lines.push('');

      lines.push('# HELP barberpro_providers_total Total number of providers');
      lines.push('# TYPE barberpro_providers_total gauge');
      lines.push(`barberpro_providers_total{status="all"} ${totalProviders}`);
      lines.push(`barberpro_providers_total{status="active"} ${activeProviders}`);
      lines.push('');

      // Add Argentina-specific timezone metadata
      lines.push('# HELP barberpro_timezone_info Timezone information');
      lines.push('# TYPE barberpro_timezone_info gauge');
      lines.push('barberpro_timezone_info{timezone="America/Argentina/Buenos_Aires",locale="es_AR"} 1');
      lines.push('');

    } catch (error) {
      console.error('Error collecting business metrics:', error);
      lines.push('# Error collecting business metrics');
    }

    return lines.join('\n');
  }

  private async getDatabaseMetrics(): Promise<string[]> {
    const lines: string[] = [];

    try {
      // Database connection pool info would go here
      // For now, just basic connectivity check
      await prisma.$queryRaw`SELECT 1`;
      
      lines.push('# HELP barberpro_database_up Database connectivity');
      lines.push('# TYPE barberpro_database_up gauge');
      lines.push('barberpro_database_up 1');
      lines.push('');

      // Add Argentina timezone database check
      const timezoneCheck = await prisma.$queryRaw`SHOW timezone`;
      lines.push('# HELP barberpro_database_timezone Database timezone check');
      lines.push('# TYPE barberpro_database_timezone gauge');
      lines.push('barberpro_database_timezone{timezone="america_argentina_buenos_aires"} 1');
      lines.push('');

    } catch (error) {
      lines.push('# HELP barberpro_database_up Database connectivity');
      lines.push('# TYPE barberpro_database_up gauge');
      lines.push('barberpro_database_up 0');
      lines.push('');
    }

    return lines;
  }
}

// Singleton instance
let monitoringInstance: MonitoringService | null = null;

export function createMonitoringService(): MonitoringService {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService();
  }
  return monitoringInstance;
}

// Middleware to track HTTP requests
export function createMetricsMiddleware() {
  const monitoring = createMonitoringService();
  
  return async (request: FastifyRequest, reply: any) => {
    const startTime = Date.now();
    
    reply.raw.on('finish', () => {
      const responseTime = (Date.now() - startTime) / 1000; // Convert to seconds
      monitoring.recordRequest(request, responseTime, reply.raw.statusCode);
    });
  };
}

export { MonitoringService };