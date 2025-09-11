/**
 * Payment Performance Monitoring Service for BarberPro Argentina
 * Real-time monitoring and alerting for payment system performance
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import paymentConfig from '../config/payment';

export interface PaymentMetric {
  timestamp: Date;
  gateway: string;
  action: 'payment_created' | 'payment_processed' | 'payment_failed' | 'webhook_received';
  success: boolean;
  duration: number;
  amount?: number;
  errorCode?: string;
  metadata?: Record<string, any>;
}

export interface PaymentAlert {
  id: string;
  type: 'performance' | 'error_rate' | 'volume' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  gateway?: string;
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PaymentHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  successRate: number;
  averageResponseTime: number;
  totalTransactions: number;
  errorRate: number;
  gateways: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      successRate: number;
      responseTime: number;
      lastTransaction: Date;
    };
  };
  alerts: PaymentAlert[];
  lastUpdated: Date;
}

export interface PaymentPerformanceReport {
  period: { from: Date; to: Date };
  overview: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalVolume: number;
    averageResponseTime: number;
    successRate: number;
  };
  gatewayBreakdown: {
    [gateway: string]: {
      transactions: number;
      successRate: number;
      averageResponseTime: number;
      volume: number;
      errors: Array<{ code: string; count: number; percentage: number }>;
    };
  };
  trends: {
    hourly: Array<{ hour: number; transactions: number; successRate: number }>;
    daily: Array<{ date: string; transactions: number; successRate: number }>;
  };
  recommendations: string[];
}

class PaymentMonitoringService extends EventEmitter {
  private prisma: PrismaClient;
  private metrics: PaymentMetric[] = [];
  private alerts: PaymentAlert[] = [];
  private readonly maxMetricsInMemory = 10000;
  private readonly alertRetentionDays = 30;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.startMonitoring();
  }

  /**
   * Record a payment metric
   */
  recordMetric(metric: Omit<PaymentMetric, 'timestamp'>): void {
    const fullMetric: PaymentMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics in memory
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Emit metric for real-time processing
    this.emit('metric', fullMetric);

    // Check for alerts
    this.checkAlerts(fullMetric);
  }

  /**
   * Get current payment system health status
   */
  async getHealthStatus(): Promise<PaymentHealthStatus> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Get recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    
    // Calculate overall metrics
    const totalTransactions = recentMetrics.length;
    const successfulTransactions = recentMetrics.filter(m => m.success).length;
    const errorRate = totalTransactions > 0 ? ((totalTransactions - successfulTransactions) / totalTransactions) * 100 : 0;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 100;
    
    const responseTimes = recentMetrics.filter(m => m.duration > 0).map(m => m.duration);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Gateway-specific metrics
    const gateways: PaymentHealthStatus['gateways'] = {};
    const gatewayNames = ['mercadopago', 'todopago', 'decidir', 'payu'];
    
    for (const gateway of gatewayNames) {
      const gatewayMetrics = recentMetrics.filter(m => m.gateway === gateway);
      const gatewaySuccess = gatewayMetrics.filter(m => m.success).length;
      const gatewayTotal = gatewayMetrics.length;
      const gatewayResponseTimes = gatewayMetrics.filter(m => m.duration > 0).map(m => m.duration);
      
      if (gatewayTotal > 0) {
        gateways[gateway] = {
          status: this.determineGatewayHealth(gatewayTotal > 0 ? (gatewaySuccess / gatewayTotal) * 100 : 100, 
                                             gatewayResponseTimes.length > 0 ? gatewayResponseTimes.reduce((a, b) => a + b, 0) / gatewayResponseTimes.length : 0),
          successRate: gatewayTotal > 0 ? (gatewaySuccess / gatewayTotal) * 100 : 100,
          responseTime: gatewayResponseTimes.length > 0 ? gatewayResponseTimes.reduce((a, b) => a + b, 0) / gatewayResponseTimes.length : 0,
          lastTransaction: gatewayMetrics.length > 0 ? gatewayMetrics[gatewayMetrics.length - 1].timestamp : new Date(0),
        };
      }
    }

    // Determine overall health
    const overall = this.determineOverallHealth(successRate, averageResponseTime, errorRate);

    // Get active alerts
    const activeAlerts = this.alerts.filter(a => !a.resolved);

    return {
      overall,
      successRate,
      averageResponseTime: Math.round(averageResponseTime),
      totalTransactions,
      errorRate: Math.round(errorRate * 100) / 100,
      gateways,
      alerts: activeAlerts,
      lastUpdated: now,
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    from: Date = new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: Date = new Date()
  ): Promise<PaymentPerformanceReport> {
    // Get database metrics for the period
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        paidAt: true,
        failedAt: true,
        gatewayData: true,
        metadata: true,
      },
    });

    // Calculate overview metrics
    const totalTransactions = payments.length;
    const successfulTransactions = payments.filter(p => p.status === 'PAID').length;
    const failedTransactions = payments.filter(p => p.status === 'FAILED' || p.status === 'REJECTED').length;
    const totalVolume = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 100;
    
    // Calculate average response time from recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp >= from && m.timestamp <= to);
    const responseTimes = recentMetrics.filter(m => m.duration > 0).map(m => m.duration);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Gateway breakdown
    const gatewayBreakdown: PaymentPerformanceReport['gatewayBreakdown'] = {};
    const gateways = ['mercadopago', 'todopago', 'decidir', 'payu'];
    
    for (const gateway of gateways) {
      const gatewayPayments = payments.filter(p => 
        p.paymentMethod === gateway || 
        (p.metadata as any)?.selectedGateway === gateway
      );
      
      if (gatewayPayments.length > 0) {
        const gatewaySuccess = gatewayPayments.filter(p => p.status === 'PAID').length;
        const gatewayVolume = gatewayPayments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        
        const gatewayMetrics = recentMetrics.filter(m => m.gateway === gateway);
        const gatewayResponseTimes = gatewayMetrics.filter(m => m.duration > 0).map(m => m.duration);
        
        // Error analysis
        const failedPayments = gatewayPayments.filter(p => p.status === 'FAILED' || p.status === 'REJECTED');
        const errorCounts: { [key: string]: number } = {};
        
        failedPayments.forEach(p => {
          const errorCode = (p.gatewayData as any)?.error_code || 'UNKNOWN';
          errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
        });
        
        const errors = Object.entries(errorCounts).map(([code, count]) => ({
          code,
          count,
          percentage: (count / failedPayments.length) * 100,
        }));

        gatewayBreakdown[gateway] = {
          transactions: gatewayPayments.length,
          successRate: gatewayPayments.length > 0 ? (gatewaySuccess / gatewayPayments.length) * 100 : 100,
          averageResponseTime: gatewayResponseTimes.length > 0 
            ? gatewayResponseTimes.reduce((a, b) => a + b, 0) / gatewayResponseTimes.length 
            : 0,
          volume: gatewayVolume,
          errors,
        };
      }
    }

    // Trends analysis
    const hourlyTrends = this.calculateHourlyTrends(payments, from, to);
    const dailyTrends = this.calculateDailyTrends(payments, from, to);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      successRate,
      averageResponseTime,
      gatewayBreakdown,
      totalTransactions,
    });

    return {
      period: { from, to },
      overview: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalVolume,
        averageResponseTime: Math.round(averageResponseTime),
        successRate: Math.round(successRate * 100) / 100,
      },
      gatewayBreakdown,
      trends: {
        hourly: hourlyTrends,
        daily: dailyTrends,
      },
      recommendations,
    };
  }

  /**
   * Create an alert
   */
  private createAlert(
    type: PaymentAlert['type'],
    severity: PaymentAlert['severity'],
    message: string,
    details: Record<string, any>,
    gateway?: string
  ): void {
    const alert: PaymentAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      gateway,
      message,
      details,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts
    const cutoff = new Date(Date.now() - this.alertRetentionDays * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff || !a.resolved);

    // Emit alert for external handling
    this.emit('alert', alert);

    console.warn(`🚨 Payment Alert [${severity.toUpperCase()}]: ${message}`, details);
  }

  /**
   * Check for alert conditions based on new metric
   */
  private checkAlerts(metric: PaymentMetric): void {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= fiveMinutesAgo);
    
    if (recentMetrics.length < 10) return; // Need sufficient data

    // Error rate alert
    const errorRate = (recentMetrics.filter(m => !m.success).length / recentMetrics.length) * 100;
    if (errorRate > 20) {
      this.createAlert(
        'error_rate',
        errorRate > 50 ? 'critical' : 'high',
        `High error rate detected: ${errorRate.toFixed(1)}%`,
        { errorRate, gateway: metric.gateway, sampleSize: recentMetrics.length }
      );
    }

    // Response time alert
    const responseTimes = recentMetrics.filter(m => m.duration > 0).map(m => m.duration);
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const threshold = paymentConfig.monitoring.responseTimeThreshold;
      
      if (avgResponseTime > threshold) {
        this.createAlert(
          'performance',
          avgResponseTime > threshold * 2 ? 'critical' : 'high',
          `Slow response time detected: ${avgResponseTime.toFixed(0)}ms (threshold: ${threshold}ms)`,
          { averageResponseTime: avgResponseTime, threshold, gateway: metric.gateway }
        );
      }
    }

    // Volume spike alert (unusual high volume)
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const lastHourMetrics = this.metrics.filter(m => m.timestamp >= hourAgo);
    const previousHourMetrics = this.metrics.filter(m => 
      m.timestamp >= new Date(hourAgo.getTime() - 60 * 60 * 1000) && 
      m.timestamp < hourAgo
    );

    if (lastHourMetrics.length > previousHourMetrics.length * 3 && lastHourMetrics.length > 100) {
      this.createAlert(
        'volume',
        'medium',
        `Unusual high transaction volume detected`,
        { 
          currentHour: lastHourMetrics.length, 
          previousHour: previousHourMetrics.length,
          increase: `${Math.round(((lastHourMetrics.length / Math.max(previousHourMetrics.length, 1)) - 1) * 100)}%`
        }
      );
    }
  }

  /**
   * Start monitoring service
   */
  private startMonitoring(): void {
    if (!paymentConfig.monitoring.metricsEnabled) return;

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute

    console.log('📊 Payment monitoring service started');
  }

  /**
   * Perform periodic health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getHealthStatus();
      
      // Check for degraded performance
      if (health.overall === 'unhealthy') {
        this.createAlert(
          'performance',
          'critical',
          'Payment system is unhealthy',
          {
            successRate: health.successRate,
            responseTime: health.averageResponseTime,
            errorRate: health.errorRate,
          }
        );
      } else if (health.overall === 'degraded') {
        this.createAlert(
          'performance',
          'medium',
          'Payment system performance degraded',
          {
            successRate: health.successRate,
            responseTime: health.averageResponseTime,
          }
        );
      }

      // Emit health status for external monitoring
      this.emit('health_status', health);

    } catch (error: any) {
      console.error('Health check failed:', error);
      this.createAlert(
        'error_rate',
        'high',
        'Payment monitoring health check failed',
        { error: error.message }
      );
    }
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(
    successRate: number, 
    responseTime: number, 
    errorRate: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const successThreshold = paymentConfig.monitoring.successRateThreshold * 100;
    const responseThreshold = paymentConfig.monitoring.responseTimeThreshold;

    if (successRate < successThreshold * 0.8 || responseTime > responseThreshold * 2 || errorRate > 20) {
      return 'unhealthy';
    }
    
    if (successRate < successThreshold || responseTime > responseThreshold || errorRate > 10) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Determine gateway health status
   */
  private determineGatewayHealth(successRate: number, responseTime: number): 'healthy' | 'degraded' | 'unhealthy' {
    const successThreshold = paymentConfig.monitoring.successRateThreshold * 100;
    const responseThreshold = paymentConfig.monitoring.responseTimeThreshold;

    if (successRate < successThreshold * 0.7 || responseTime > responseThreshold * 3) {
      return 'unhealthy';
    }
    
    if (successRate < successThreshold * 0.9 || responseTime > responseThreshold * 1.5) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Calculate hourly trends
   */
  private calculateHourlyTrends(payments: any[], from: Date, to: Date): Array<{ hour: number; transactions: number; successRate: number }> {
    const hourlyData: { [hour: number]: { total: number; successful: number } } = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { total: 0, successful: 0 };
    }

    payments.forEach(payment => {
      const hour = payment.createdAt.getHours();
      hourlyData[hour].total++;
      if (payment.status === 'PAID') {
        hourlyData[hour].successful++;
      }
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      transactions: data.total,
      successRate: data.total > 0 ? (data.successful / data.total) * 100 : 100,
    }));
  }

  /**
   * Calculate daily trends
   */
  private calculateDailyTrends(payments: any[], from: Date, to: Date): Array<{ date: string; transactions: number; successRate: number }> {
    const dailyData: { [date: string]: { total: number; successful: number } } = {};

    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, successful: 0 };
      }
      dailyData[date].total++;
      if (payment.status === 'PAID') {
        dailyData[date].successful++;
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        transactions: data.total,
        successRate: data.total > 0 ? (data.successful / data.total) * 100 : 100,
      }));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: {
    successRate: number;
    averageResponseTime: number;
    gatewayBreakdown: any;
    totalTransactions: number;
  }): string[] {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (metrics.successRate < 95) {
      recommendations.push(
        `Success rate is ${metrics.successRate.toFixed(1)}%. Consider reviewing error patterns and improving payment validation.`
      );
    }

    // Response time recommendations
    if (metrics.averageResponseTime > 5000) {
      recommendations.push(
        `Average response time is ${metrics.averageResponseTime.toFixed(0)}ms. Consider optimizing API calls and implementing connection pooling.`
      );
    }

    // Gateway performance recommendations
    Object.entries(metrics.gatewayBreakdown).forEach(([gateway, data]: [string, any]) => {
      if (data.successRate < 90) {
        recommendations.push(
          `${gateway} gateway has low success rate (${data.successRate.toFixed(1)}%). Consider implementing retry logic or switching primary gateway.`
        );
      }
      
      if (data.averageResponseTime > 8000) {
        recommendations.push(
          `${gateway} gateway has high response time (${data.averageResponseTime.toFixed(0)}ms). Review gateway configuration and network connectivity.`
        );
      }
    });

    // Volume recommendations
    if (metrics.totalTransactions > 10000) {
      recommendations.push(
        'High transaction volume detected. Consider implementing load balancing and caching strategies.'
      );
    }

    // Default recommendation if everything is good
    if (recommendations.length === 0) {
      recommendations.push('Payment system is performing well. Continue monitoring for any changes.');
    }

    return recommendations;
  }

  /**
   * Get payment metrics for a specific period
   */
  getMetrics(from: Date, to: Date): PaymentMetric[] {
    return this.metrics.filter(m => m.timestamp >= from && m.timestamp <= to);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PaymentAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alert_resolved', alert);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.removeAllListeners();
    console.log('🛑 Payment monitoring service destroyed');
  }
}

export default PaymentMonitoringService;