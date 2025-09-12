/**
 * Launch Day Real-Time Monitoring Service
 * B6A-001: Comprehensive backend monitoring for launch day operations
 * 
 * Features:
 * - Real-time API performance tracking
 * - Database query performance monitoring
 * - Payment webhook success rate tracking
 * - User behavior analytics
 * - Argentina market-specific metrics
 */

import { FastifyRequest } from 'fastify';
import { prisma } from './database';
import { createClient } from 'redis';

interface LaunchDayMetrics {
  // Performance Metrics
  apiResponseTimes: Map<string, number[]>;
  dbQueryTimes: Map<string, number[]>;
  paymentWebhookSuccess: number;
  paymentWebhookFailures: number;
  realTimeConnections: number;
  
  // User Behavior Analytics
  userConversions: Map<string, number>;
  providerPerformance: Map<string, any>;
  referralTracking: Map<string, number>;
  promotionUsage: Map<string, number>;
  
  // Argentina-specific metrics
  regionActivity: Map<string, number>;
  paymentMethodUsage: Map<string, number>;
  timezoneBehavior: Map<string, number>;
  
  // Business Intelligence
  hourlyBookings: Map<string, number>;
  revenueTracking: number;
  clientRetention: Map<string, number>;
  
  // System Health
  errorRates: Map<string, number>;
  memoryUsage: NodeJS.MemoryUsage[];
  uptime: number;
}

class LaunchDayMonitoringService {
  private metrics: LaunchDayMetrics;
  private redisClient: any;
  private startTime: number;
  private alertThresholds: any;

  constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.alertThresholds = this.setupAlertThresholds();
    this.initializeRedis();
  }

  private initializeMetrics(): LaunchDayMetrics {
    return {
      apiResponseTimes: new Map(),
      dbQueryTimes: new Map(),
      paymentWebhookSuccess: 0,
      paymentWebhookFailures: 0,
      realTimeConnections: 0,
      userConversions: new Map(),
      providerPerformance: new Map(),
      referralTracking: new Map(),
      promotionUsage: new Map(),
      regionActivity: new Map(),
      paymentMethodUsage: new Map(),
      timezoneBehavior: new Map(),
      hourlyBookings: new Map(),
      revenueTracking: 0,
      clientRetention: new Map(),
      errorRates: new Map(),
      memoryUsage: [],
      uptime: 0
    };
  }

  private setupAlertThresholds() {
    return {
      apiResponseTime: 150, // ms
      dbQueryTime: 50, // ms
      paymentFailureRate: 0.01, // 1%
      errorRate: 0.05, // 5%
      memoryUsage: 1024 * 1024 * 1024, // 1GB
      connectionLimit: 10000
    };
  }

  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
    } catch (error) {
      console.error('Redis connection failed for monitoring:', error);
    }
  }

  // Real-time API Performance Monitoring
  async trackApiRequest(request: FastifyRequest, responseTime: number, statusCode: number) {
    const route = `${request.method} ${(request as any).routerPath || request.url}`;
    
    // Store response times
    const times = this.metrics.apiResponseTimes.get(route) || [];
    times.push(responseTime);
    if (times.length > 1000) times.shift(); // Keep last 1000 requests
    this.metrics.apiResponseTimes.set(route, times);

    // Track errors
    if (statusCode >= 400) {
      const errors = this.metrics.errorRates.get(route) || 0;
      this.metrics.errorRates.set(route, errors + 1);
    }

    // Alert on slow responses
    if (responseTime > this.alertThresholds.apiResponseTime) {
      await this.sendAlert('api_slow_response', {
        route,
        responseTime,
        threshold: this.alertThresholds.apiResponseTime
      });
    }

    // Store in Redis for real-time dashboard
    if (this.redisClient) {
      await this.redisClient.zadd(
        `api_performance:${route}`,
        Date.now(),
        JSON.stringify({ responseTime, statusCode, timestamp: Date.now() })
      );
      
      // Keep only last hour of data
      const oneHourAgo = Date.now() - 3600000;
      await this.redisClient.zremrangebyscore(`api_performance:${route}`, 0, oneHourAgo);
    }
  }

  // Database Query Performance Monitoring
  async trackDatabaseQuery(query: string, duration: number) {
    const queryType = this.extractQueryType(query);
    
    const times = this.metrics.dbQueryTimes.get(queryType) || [];
    times.push(duration);
    if (times.length > 500) times.shift();
    this.metrics.dbQueryTimes.set(queryType, times);

    // Alert on slow queries
    if (duration > this.alertThresholds.dbQueryTime) {
      await this.sendAlert('db_slow_query', {
        queryType,
        duration,
        threshold: this.alertThresholds.dbQueryTime,
        query: query.substring(0, 200) // First 200 chars
      });
    }

    // Store in Redis
    if (this.redisClient) {
      await this.redisClient.zadd(
        `db_performance:${queryType}`,
        Date.now(),
        JSON.stringify({ duration, timestamp: Date.now() })
      );
    }
  }

  // Payment Webhook Monitoring
  async trackPaymentWebhook(success: boolean, provider: string, amount?: number) {
    if (success) {
      this.metrics.paymentWebhookSuccess++;
      if (amount) {
        this.metrics.revenueTracking += amount;
      }
    } else {
      this.metrics.paymentWebhookFailures++;
    }

    const totalWebhooks = this.metrics.paymentWebhookSuccess + this.metrics.paymentWebhookFailures;
    const failureRate = this.metrics.paymentWebhookFailures / totalWebhooks;

    // Alert on high failure rate
    if (failureRate > this.alertThresholds.paymentFailureRate && totalWebhooks > 10) {
      await this.sendAlert('payment_high_failure_rate', {
        failureRate: failureRate * 100,
        threshold: this.alertThresholds.paymentFailureRate * 100,
        totalWebhooks,
        provider
      });
    }

    // Track payment method usage
    const count = this.metrics.paymentMethodUsage.get(provider) || 0;
    this.metrics.paymentMethodUsage.set(provider, count + 1);
  }

  // User Behavior Analytics
  async trackUserConversion(userId: string, conversionType: 'registration' | 'first_booking' | 'repeat_booking' | 'referral') {
    const count = this.metrics.userConversions.get(conversionType) || 0;
    this.metrics.userConversions.set(conversionType, count + 1);

    // Store detailed conversion data
    if (this.redisClient) {
      await this.redisClient.zadd(
        `user_conversions:${conversionType}`,
        Date.now(),
        JSON.stringify({ userId, timestamp: Date.now() })
      );
    }
  }

  // Provider Performance Analytics
  async trackProviderPerformance(providerId: string, metrics: any) {
    this.metrics.providerPerformance.set(providerId, {
      ...this.metrics.providerPerformance.get(providerId),
      ...metrics,
      lastUpdate: Date.now()
    });

    // Store in Redis for real-time updates
    if (this.redisClient) {
      await this.redisClient.hset(
        'provider_performance',
        providerId,
        JSON.stringify(metrics)
      );
    }
  }

  // Argentina-Specific Region Activity
  async trackRegionActivity(region: string, activity: string) {
    const key = `${region}_${activity}`;
    const count = this.metrics.regionActivity.get(key) || 0;
    this.metrics.regionActivity.set(key, count + 1);
  }

  // Real-time Connection Monitoring
  updateRealTimeConnections(count: number) {
    this.metrics.realTimeConnections = count;
    
    // Alert on too many connections
    if (count > this.alertThresholds.connectionLimit) {
      this.sendAlert('high_connection_count', {
        currentConnections: count,
        threshold: this.alertThresholds.connectionLimit
      });
    }
  }

  // Hourly Booking Analytics
  async trackHourlyBooking(bookingId: string, amount: number) {
    const hour = new Date().getHours();
    const hourKey = `${new Date().toDateString()}_${hour}`;
    
    const count = this.metrics.hourlyBookings.get(hourKey) || 0;
    this.metrics.hourlyBookings.set(hourKey, count + 1);
    
    this.metrics.revenueTracking += amount;
  }

  // System Health Monitoring
  monitorSystemHealth() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push(memUsage);
    if (this.metrics.memoryUsage.length > 60) {
      this.metrics.memoryUsage.shift(); // Keep last 60 measurements
    }

    this.metrics.uptime = Date.now() - this.startTime;

    // Alert on high memory usage
    if (memUsage.heapUsed > this.alertThresholds.memoryUsage) {
      this.sendAlert('high_memory_usage', {
        currentUsage: memUsage.heapUsed,
        threshold: this.alertThresholds.memoryUsage
      });
    }
  }

  // Get Real-time Analytics Dashboard Data
  async getRealTimeAnalytics() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Calculate API performance averages
    const apiPerformance = {};
    for (const [route, times] of this.metrics.apiResponseTimes.entries()) {
      const recentTimes = times.slice(-100); // Last 100 requests
      const avg = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
      const p95 = this.calculatePercentile(recentTimes, 95);
      
      apiPerformance[route] = {
        avgResponseTime: avg || 0,
        p95ResponseTime: p95 || 0,
        requestCount: recentTimes.length,
        errorRate: (this.metrics.errorRates.get(route) || 0) / recentTimes.length
      };
    }

    // Database performance
    const dbPerformance = {};
    for (const [queryType, times] of this.metrics.dbQueryTimes.entries()) {
      const recentTimes = times.slice(-50); // Last 50 queries
      const avg = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
      
      dbPerformance[queryType] = {
        avgQueryTime: avg || 0,
        queryCount: recentTimes.length
      };
    }

    // Payment metrics
    const totalPayments = this.metrics.paymentWebhookSuccess + this.metrics.paymentWebhookFailures;
    const paymentSuccessRate = totalPayments > 0 
      ? (this.metrics.paymentWebhookSuccess / totalPayments) * 100 
      : 100;

    // User activity metrics
    const userActivity = {
      conversions: Object.fromEntries(this.metrics.userConversions),
      regionActivity: Object.fromEntries(this.metrics.regionActivity),
      paymentMethods: Object.fromEntries(this.metrics.paymentMethodUsage)
    };

    // Business metrics
    const businessMetrics = {
      hourlyBookings: Object.fromEntries(this.metrics.hourlyBookings),
      totalRevenue: this.metrics.revenueTracking,
      activeConnections: this.metrics.realTimeConnections
    };

    return {
      timestamp: now,
      apiPerformance,
      dbPerformance,
      paymentMetrics: {
        successRate: paymentSuccessRate,
        totalTransactions: totalPayments,
        totalRevenue: this.metrics.revenueTracking
      },
      userActivity,
      businessMetrics,
      systemHealth: {
        uptime: this.metrics.uptime,
        memoryUsage: this.metrics.memoryUsage.slice(-1)[0] || process.memoryUsage(),
        connections: this.metrics.realTimeConnections
      }
    };
  }

  // Get Launch Day Summary Report
  async getLaunchDayReport() {
    const analytics = await this.getRealTimeAnalytics();
    
    // Database insights
    const dbInsights = await this.getDatabaseInsights();
    
    // User behavior insights
    const userInsights = await this.getUserBehaviorInsights();
    
    // Performance recommendations
    const recommendations = this.generateRecommendations();

    return {
      launchDate: new Date().toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
      reportGenerated: new Date().toISOString(),
      summary: {
        totalRequests: Array.from(this.metrics.apiResponseTimes.values())
          .reduce((total, times) => total + times.length, 0),
        avgResponseTime: this.calculateOverallAvgResponseTime(),
        paymentSuccessRate: analytics.paymentMetrics.successRate,
        totalRevenue: analytics.paymentMetrics.totalRevenue,
        userRegistrations: this.metrics.userConversions.get('registration') || 0,
        totalBookings: this.metrics.userConversions.get('first_booking') || 0 + 
                      this.metrics.userConversions.get('repeat_booking') || 0
      },
      analytics,
      dbInsights,
      userInsights,
      recommendations,
      systemHealth: analytics.systemHealth
    };
  }

  // Private helper methods
  private extractQueryType(query: string): string {
    const normalized = query.toLowerCase().trim();
    if (normalized.startsWith('select')) return 'SELECT';
    if (normalized.startsWith('insert')) return 'INSERT';
    if (normalized.startsWith('update')) return 'UPDATE';
    if (normalized.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private calculateOverallAvgResponseTime(): number {
    let totalTime = 0;
    let totalRequests = 0;
    
    for (const times of this.metrics.apiResponseTimes.values()) {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalRequests += times.length;
    }
    
    return totalRequests > 0 ? totalTime / totalRequests : 0;
  }

  private async getDatabaseInsights() {
    try {
      // Get database statistics
      const bookingStats = await prisma.booking.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const userStats = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      });

      return {
        bookingStats,
        userStats,
        queryPerformance: Object.fromEntries(this.metrics.dbQueryTimes)
      };
    } catch (error) {
      return { error: 'Failed to collect database insights' };
    }
  }

  private async getUserBehaviorInsights() {
    const insights = {
      conversionFunnel: Object.fromEntries(this.metrics.userConversions),
      regionalActivity: this.getTopRegions(),
      paymentPreferences: this.getPaymentMethodDistribution(),
      peakHours: this.getPeakBookingHours()
    };

    return insights;
  }

  private getTopRegions(): any[] {
    return Array.from(this.metrics.regionActivity.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([region, count]) => ({ region, count }));
  }

  private getPaymentMethodDistribution(): any {
    const total = Array.from(this.metrics.paymentMethodUsage.values())
      .reduce((sum, count) => sum + count, 0);
    
    const distribution = {};
    for (const [method, count] of this.metrics.paymentMethodUsage.entries()) {
      distribution[method] = {
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    }
    
    return distribution;
  }

  private getPeakBookingHours(): any[] {
    return Array.from(this.metrics.hourlyBookings.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour, count }));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // API performance recommendations
    const slowRoutes = Array.from(this.metrics.apiResponseTimes.entries())
      .filter(([, times]) => {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        return avg > this.alertThresholds.apiResponseTime;
      });
    
    if (slowRoutes.length > 0) {
      recommendations.push(`Optimize slow API routes: ${slowRoutes.map(([route]) => route).join(', ')}`);
    }

    // Database recommendations
    const slowQueries = Array.from(this.metrics.dbQueryTimes.entries())
      .filter(([, times]) => {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        return avg > this.alertThresholds.dbQueryTime;
      });
    
    if (slowQueries.length > 0) {
      recommendations.push(`Optimize slow database queries: ${slowQueries.map(([type]) => type).join(', ')}`);
    }

    // Payment recommendations
    const failureRate = this.metrics.paymentWebhookFailures / 
      (this.metrics.paymentWebhookSuccess + this.metrics.paymentWebhookFailures);
    
    if (failureRate > this.alertThresholds.paymentFailureRate) {
      recommendations.push('Investigate payment webhook failures and implement retry logic');
    }

    // Memory usage recommendations
    const currentMemory = this.metrics.memoryUsage.slice(-1)[0];
    if (currentMemory && currentMemory.heapUsed > this.alertThresholds.memoryUsage) {
      recommendations.push('Monitor memory usage and implement garbage collection optimization');
    }

    return recommendations;
  }

  private async sendAlert(alertType: string, data: any) {
    const alert = {
      type: alertType,
      timestamp: new Date().toISOString(),
      timezone: 'America/Argentina/Buenos_Aires',
      data,
      severity: this.getAlertSeverity(alertType)
    };

    // Log alert
    console.warn(`🚨 Launch Day Alert [${alertType}]:`, JSON.stringify(alert, null, 2));

    // Store in Redis for alert dashboard
    if (this.redisClient) {
      await this.redisClient.lpush('launch_day_alerts', JSON.stringify(alert));
      await this.redisClient.ltrim('launch_day_alerts', 0, 99); // Keep last 100 alerts
    }

    // Here you could integrate with external alerting systems
    // like Slack, email, or monitoring services
  }

  private getAlertSeverity(alertType: string): string {
    const criticalAlerts = ['payment_high_failure_rate', 'high_memory_usage'];
    const warningAlerts = ['api_slow_response', 'db_slow_query'];
    
    if (criticalAlerts.includes(alertType)) return 'CRITICAL';
    if (warningAlerts.includes(alertType)) return 'WARNING';
    return 'INFO';
  }

  // Cleanup method
  async cleanup() {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
  }
}

// Singleton instance
let launchDayMonitoringInstance: LaunchDayMonitoringService | null = null;

export function createLaunchDayMonitoringService(): LaunchDayMonitoringService {
  if (!launchDayMonitoringInstance) {
    launchDayMonitoringInstance = new LaunchDayMonitoringService();
  }
  return launchDayMonitoringInstance;
}

export { LaunchDayMonitoringService };