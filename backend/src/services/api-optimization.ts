import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from 'redis';
import { geoLocationService } from './geo-location';

// API Routing Optimization for Argentina Regional Performance
// T7A-001: Maintain 0.31ms baseline with regional optimization

interface PerformanceMetrics {
  responseTime: number;
  region: string;
  endpoint: string;
  timestamp: Date;
  success: boolean;
}

interface CacheConfig {
  ttl: number; // seconds
  region: string;
  strategy: 'aggressive' | 'moderate' | 'conservative';
}

class APIOptimizationService {
  private performanceMetrics: PerformanceMetrics[] = [];
  private redisClient?: any;
  private readonly TARGET_RESPONSE_TIME = 0.31; // 0.31ms baseline

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      console.log('⚙️ Redis connected for API optimization');
    } catch (error) {
      console.error('Redis connection failed:', error);
    }
  }

  // Regional cache strategy based on Argentina geography
  getRegionalCacheConfig(latitude: number, longitude: number): CacheConfig {
    const nearestCity = geoLocationService.findNearestCity(latitude, longitude);
    
    // Cache strategy based on city population and distance from Buenos Aires
    const distanceFromBA = geoLocationService.calculateDistance(
      latitude, longitude,
      -34.6037, -58.3816 // Buenos Aires coordinates
    );

    let strategy: 'aggressive' | 'moderate' | 'conservative' = 'moderate';
    let ttl = 300; // 5 minutes default

    if (nearestCity.population > 1000000) {
      // Major cities - aggressive caching
      strategy = 'aggressive';
      ttl = 600; // 10 minutes
    } else if (distanceFromBA > 500) {
      // Remote areas - conservative caching to ensure freshness
      strategy = 'conservative';
      ttl = 120; // 2 minutes
    }

    return {
      ttl,
      region: nearestCity.province,
      strategy
    };
  }

  // Performance monitoring middleware
  createPerformanceMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = process.hrtime.bigint();
      
      // Extract user location if available
      const userLat = request.headers['x-user-latitude'] as string;
      const userLng = request.headers['x-user-longitude'] as string;
      
      let region = 'unknown';
      if (userLat && userLng) {
        const nearestCity = geoLocationService.findNearestCity(
          parseFloat(userLat), 
          parseFloat(userLng)
        );
        region = nearestCity.province;
      }

      // Add region-specific headers for optimization
      reply.header('X-Region', region);
      reply.header('X-Cache-Strategy', 'optimized');
      
      // Track response time after request completion
      reply.addHook('onSend', async (request, reply, payload) => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
        
        // Store performance metric
        this.performanceMetrics.push({
          responseTime,
          region,
          endpoint: request.url,
          timestamp: new Date(),
          success: reply.statusCode < 400
        });

        // Clean old metrics (keep last 1000)
        if (this.performanceMetrics.length > 1000) {
          this.performanceMetrics = this.performanceMetrics.slice(-1000);
        }

        // Add performance headers
        reply.header('X-Response-Time', `${responseTime.toFixed(3)}ms`);
        reply.header('X-Performance-Target', `${this.TARGET_RESPONSE_TIME}ms`);
        
        return payload;
      });
    };
  }

  // Intelligent caching for Argentina regions
  async getOrSetCache(key: string, fetcher: () => Promise<any>, latitude?: number, longitude?: number) {
    if (!this.redisClient) {
      return await fetcher();
    }

    try {
      // Check cache first
      const cached = await this.redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch fresh data
      const data = await fetcher();
      
      // Determine cache TTL based on location
      let ttl = 300; // Default 5 minutes
      if (latitude && longitude) {
        const cacheConfig = this.getRegionalCacheConfig(latitude, longitude);
        ttl = cacheConfig.ttl;
      }

      // Store in cache
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Cache operation failed:', error);
      return await fetcher();
    }
  }

  // Connection pooling optimization for Argentina regions
  getOptimalConnectionPool(region: string) {
    const regionConfig = {
      'Ciudad Autónoma de Buenos Aires': {
        maxConnections: 50,
        minConnections: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 300000
      },
      'Buenos Aires': {
        maxConnections: 40,
        minConnections: 8,
        acquireTimeoutMillis: 35000,
        idleTimeoutMillis: 300000
      },
      'Córdoba': {
        maxConnections: 30,
        minConnections: 6,
        acquireTimeoutMillis: 40000,
        idleTimeoutMillis: 400000
      },
      default: {
        maxConnections: 20,
        minConnections: 4,
        acquireTimeoutMillis: 45000,
        idleTimeoutMillis: 500000
      }
    };

    return regionConfig[region as keyof typeof regionConfig] || regionConfig.default;
  }

  // Real-time performance analysis
  getPerformanceAnalysis(timeRangeMinutes: number = 60) {
    const cutoff = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        status: 'no-data',
        message: 'No recent performance data available'
      };
    }

    // Calculate statistics
    const responseTimes = recentMetrics.map(m => m.responseTime);
    const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    // P95 calculation
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95ResponseTime = sortedTimes[p95Index] || avgResponseTime;

    // Regional breakdown
    const regionBreakdown = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.region]) {
        acc[metric.region] = {
          count: 0,
          avgResponseTime: 0,
          successRate: 0
        };
      }
      acc[metric.region].count++;
      return acc;
    }, {} as Record<string, any>);

    // Calculate regional averages
    Object.keys(regionBreakdown).forEach(region => {
      const regionMetrics = recentMetrics.filter(m => m.region === region);
      const regionTimes = regionMetrics.map(m => m.responseTime);
      const regionSuccesses = regionMetrics.filter(m => m.success).length;
      
      regionBreakdown[region].avgResponseTime = regionTimes.reduce((a, b) => a + b, 0) / regionTimes.length;
      regionBreakdown[region].successRate = regionSuccesses / regionMetrics.length;
    });

    return {
      status: avgResponseTime <= this.TARGET_RESPONSE_TIME ? 'optimal' : 'needs-optimization',
      baseline: this.TARGET_RESPONSE_TIME,
      metrics: {
        avgResponseTime: Number(avgResponseTime.toFixed(3)),
        p95ResponseTime: Number(p95ResponseTime.toFixed(3)),
        maxResponseTime: Number(maxResponseTime.toFixed(3)),
        minResponseTime: Number(minResponseTime.toFixed(3)),
        successRate: Number((successRate * 100).toFixed(2)),
        totalRequests: recentMetrics.length
      },
      regionBreakdown,
      recommendations: this.generateOptimizationRecommendations(avgResponseTime, regionBreakdown)
    };
  }

  private generateOptimizationRecommendations(avgResponseTime: number, regionBreakdown: Record<string, any>) {
    const recommendations = [];

    if (avgResponseTime > this.TARGET_RESPONSE_TIME) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `Average response time (${avgResponseTime.toFixed(3)}ms) exceeds baseline (${this.TARGET_RESPONSE_TIME}ms)`,
        action: 'Implement additional caching layers and optimize database queries'
      });
    }

    // Regional optimization recommendations
    Object.entries(regionBreakdown).forEach(([region, data]: [string, any]) => {
      if (data.avgResponseTime > this.TARGET_RESPONSE_TIME * 1.5) {
        recommendations.push({
          type: 'regional',
          priority: 'medium',
          message: `Region ${region} showing slow response times (${data.avgResponseTime.toFixed(3)}ms)`,
          action: `Consider regional CDN optimization for ${region}`
        });
      }
      
      if (data.successRate < 0.95) {
        recommendations.push({
          type: 'reliability',
          priority: 'high',
          message: `Region ${region} has low success rate (${(data.successRate * 100).toFixed(1)}%)`,
          action: `Investigate error patterns in ${region}`
        });
      }
    });

    return recommendations;
  }

  // Database query optimization for Argentina regions
  optimizeQueryForRegion(query: any, latitude?: number, longitude?: number) {
    if (!latitude || !longitude) return query;

    const nearestCity = geoLocationService.findNearestCity(latitude, longitude);
    
    // Add regional indexes and filters
    const optimizedQuery = {
      ...query,
      // Add city/province filters to leverage regional indexes
      where: {
        ...query.where,
        ...(query.includeLocation && {
          OR: [
            { city: nearestCity.name },
            { province: nearestCity.province }
          ]
        })
      },
      // Optimize ordering for regional queries
      orderBy: query.orderBy || [
        { city: nearestCity.name ? 'asc' : undefined },
        { createdAt: 'desc' }
      ].filter(Boolean)
    };

    return optimizedQuery;
  }

  // Auto-scaling triggers for Argentina traffic patterns
  shouldTriggerAutoScaling() {
    const last5MinMetrics = this.performanceMetrics.filter(
      m => m.timestamp > new Date(Date.now() - 5 * 60 * 1000)
    );

    if (last5MinMetrics.length < 10) return false;

    const avgResponseTime = last5MinMetrics.reduce((sum, m) => sum + m.responseTime, 0) / last5MinMetrics.length;
    const errorRate = last5MinMetrics.filter(m => !m.success).length / last5MinMetrics.length;

    return {
      shouldScale: avgResponseTime > this.TARGET_RESPONSE_TIME * 2 || errorRate > 0.05,
      reason: avgResponseTime > this.TARGET_RESPONSE_TIME * 2 ? 'high-latency' : 'high-error-rate',
      metrics: {
        avgResponseTime,
        errorRate,
        requestCount: last5MinMetrics.length
      }
    };
  }
}

export const apiOptimizationService = new APIOptimizationService();

// Register optimization routes
export function registerAPIOptimizationRoutes(server: FastifyInstance) {
  // Performance dashboard endpoint
  server.get('/api/v1/performance/dashboard', {
    schema: {
      tags: ['Performance'],
      summary: 'Get real-time performance dashboard for Argentina regions'
    }
  }, async (request, reply) => {
    try {
      const timeRange = parseInt(request.query?.timeRange as string) || 60;
      const analysis = apiOptimizationService.getPerformanceAnalysis(timeRange);
      
      return reply.send({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      server.log.error('Performance dashboard error:', error);
      return reply.code(500).send({
        error: 'Error retrieving performance dashboard',
        message: 'Error al obtener dashboard de rendimiento'
      });
    }
  });

  // Auto-scaling status
  server.get('/api/v1/performance/auto-scaling', {
    schema: {
      tags: ['Performance'],
      summary: 'Check auto-scaling status and triggers'
    }
  }, async (request, reply) => {
    try {
      const scalingStatus = apiOptimizationService.shouldTriggerAutoScaling();
      
      return reply.send({
        success: true,
        data: scalingStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      server.log.error('Auto-scaling check error:', error);
      return reply.code(500).send({
        error: 'Error checking auto-scaling status',
        message: 'Error al verificar estado de auto-escalado'
      });
    }
  });
}