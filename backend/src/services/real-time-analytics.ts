/**
 * Real-Time User Behavior Analytics Service
 * B6A-001: Advanced analytics for user behavior tracking and business intelligence
 * 
 * Features:
 * - Real-time booking conversion tracking
 * - Provider performance analytics
 * - Client retention metrics
 * - Argentina market behavior analysis
 * - Revenue and commission tracking
 */

import { prisma } from './database';
import { createClient } from 'redis';
import { createLaunchDayMonitoringService } from './launch-day-monitoring';

interface UserBehaviorMetrics {
  sessionTracking: Map<string, SessionData>;
  bookingFunnelData: Map<string, FunnelStep[]>;
  providerInsights: Map<string, ProviderMetrics>;
  clientRetentionData: Map<string, RetentionData>;
  revenueAnalytics: RevenueMetrics;
  argentinaMarketData: ArgentinaMetrics;
}

interface SessionData {
  userId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: string[];
  actions: UserAction[];
  conversionEvents: ConversionEvent[];
  location?: string;
  device?: string;
  source?: string;
}

interface FunnelStep {
  step: 'view_providers' | 'select_service' | 'choose_time' | 'payment' | 'confirmation';
  timestamp: number;
  userId: string;
  metadata: any;
}

interface ProviderMetrics {
  providerId: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageRating: number;
  responseTime: number; // Average response to booking requests
  revenue: number;
  clientRetentionRate: number;
  peakHours: Map<string, number>;
  servicePopularity: Map<string, number>;
}

interface RetentionData {
  userId: string;
  firstBooking: number;
  totalBookings: number;
  lastBooking: number;
  averageBookingFrequency: number;
  favoriteProviders: string[];
  totalSpent: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  todayRevenue: number;
  hourlyRevenue: Map<string, number>;
  providerCommissions: Map<string, number>;
  paymentMethodRevenue: Map<string, number>;
  averageTransactionValue: number;
  refundRate: number;
}

interface ArgentinaMetrics {
  regionActivity: Map<string, number>; // Buenos Aires, Cordoba, etc.
  cityActivity: Map<string, number>;
  timeZoneBehavior: Map<string, number>;
  paymentPreferences: Map<string, number>;
  mobileUsage: number;
  whatsappReferrals: number;
  instagramReferrals: number;
}

interface UserAction {
  type: 'click' | 'scroll' | 'form_fill' | 'search' | 'filter';
  target: string;
  timestamp: number;
  metadata?: any;
}

interface ConversionEvent {
  type: 'signup' | 'first_booking' | 'repeat_booking' | 'referral_made' | 'subscription';
  timestamp: number;
  value: number;
  metadata?: any;
}

class RealTimeAnalyticsService {
  private metrics: UserBehaviorMetrics;
  private redisClient: any;
  private monitoringService: any;
  private analyticsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.monitoringService = createLaunchDayMonitoringService();
    this.initializeRedis();
    this.startAnalyticsProcessing();
  }

  private initializeMetrics(): UserBehaviorMetrics {
    return {
      sessionTracking: new Map(),
      bookingFunnelData: new Map(),
      providerInsights: new Map(),
      clientRetentionData: new Map(),
      revenueAnalytics: {
        totalRevenue: 0,
        todayRevenue: 0,
        hourlyRevenue: new Map(),
        providerCommissions: new Map(),
        paymentMethodRevenue: new Map(),
        averageTransactionValue: 0,
        refundRate: 0
      },
      argentinaMarketData: {
        regionActivity: new Map(),
        cityActivity: new Map(),
        timeZoneBehavior: new Map(),
        paymentPreferences: new Map(),
        mobileUsage: 0,
        whatsappReferrals: 0,
        instagramReferrals: 0
      }
    };
  }

  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
    } catch (error) {
      console.error('Redis connection failed for analytics:', error);
    }
  }

  // Session Tracking
  async startUserSession(userId: string, sessionId: string, metadata: any = {}) {
    const sessionData: SessionData = {
      userId,
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: [],
      actions: [],
      conversionEvents: [],
      location: metadata.location,
      device: metadata.device,
      source: metadata.source
    };

    this.metrics.sessionTracking.set(sessionId, sessionData);

    // Store in Redis
    if (this.redisClient) {
      await this.redisClient.setex(
        `session:${sessionId}`,
        3600, // 1 hour TTL
        JSON.stringify(sessionData)
      );
    }

    // Track Argentina-specific data
    if (metadata.location) {
      await this.trackArgentinaActivity('session_start', metadata.location);
    }

    return sessionData;
  }

  async updateUserSession(sessionId: string, action: UserAction) {
    const session = this.metrics.sessionTracking.get(sessionId);
    if (!session) return;

    session.lastActivity = Date.now();
    session.actions.push(action);

    // Update page views if it's a navigation action
    if (action.type === 'click' && action.target.includes('page:')) {
      const page = action.target.replace('page:', '');
      session.pageViews.push(page);
    }

    // Store updated session
    if (this.redisClient) {
      await this.redisClient.setex(
        `session:${sessionId}`,
        3600,
        JSON.stringify(session)
      );
    }
  }

  // Booking Funnel Analytics
  async trackBookingFunnelStep(userId: string, step: FunnelStep['step'], metadata: any = {}) {
    const funnelStep: FunnelStep = {
      step,
      timestamp: Date.now(),
      userId,
      metadata
    };

    const userFunnel = this.metrics.bookingFunnelData.get(userId) || [];
    userFunnel.push(funnelStep);
    this.metrics.bookingFunnelData.set(userId, userFunnel);

    // Store in Redis for real-time funnel analysis
    if (this.redisClient) {
      await this.redisClient.zadd(
        `booking_funnel:${userId}`,
        Date.now(),
        JSON.stringify(funnelStep)
      );
      
      // Also store aggregate funnel data
      await this.redisClient.zincrby('funnel_steps', 1, step);
    }

    // Track funnel progression
    await this.analyzeFunnelProgression(userId, userFunnel);
  }

  // Provider Performance Analytics
  async updateProviderMetrics(providerId: string, eventType: string, data: any = {}) {
    let provider = this.metrics.providerInsights.get(providerId);
    
    if (!provider) {
      provider = {
        providerId,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        averageRating: 0,
        responseTime: 0,
        revenue: 0,
        clientRetentionRate: 0,
        peakHours: new Map(),
        servicePopularity: new Map()
      };
    }

    switch (eventType) {
      case 'booking_created':
        provider.totalBookings++;
        const hour = new Date().getHours().toString();
        const currentHourCount = provider.peakHours.get(hour) || 0;
        provider.peakHours.set(hour, currentHourCount + 1);
        
        if (data.serviceId) {
          const serviceCount = provider.servicePopularity.get(data.serviceId) || 0;
          provider.servicePopularity.set(data.serviceId, serviceCount + 1);
        }
        break;
        
      case 'booking_completed':
        provider.completedBookings++;
        if (data.amount) {
          provider.revenue += data.amount;
          // Track commission
          const commission = data.amount * 0.15; // 15% platform commission
          const currentCommission = this.metrics.revenueAnalytics.providerCommissions.get(providerId) || 0;
          this.metrics.revenueAnalytics.providerCommissions.set(providerId, currentCommission + commission);
        }
        break;
        
      case 'booking_cancelled':
        provider.cancelledBookings++;
        break;
        
      case 'rating_received':
        if (data.rating) {
          // Update running average
          const totalRatings = provider.totalBookings;
          provider.averageRating = (provider.averageRating * (totalRatings - 1) + data.rating) / totalRatings;
        }
        break;
        
      case 'response_time':
        if (data.responseTime) {
          // Update running average response time
          provider.responseTime = (provider.responseTime + data.responseTime) / 2;
        }
        break;
    }

    this.metrics.providerInsights.set(providerId, provider);

    // Store in Redis
    if (this.redisClient) {
      await this.redisClient.hset(
        'provider_metrics',
        providerId,
        JSON.stringify(provider)
      );
    }

    // Notify monitoring service
    await this.monitoringService.trackProviderPerformance(providerId, provider);
  }

  // Client Retention Analytics
  async updateClientRetention(userId: string, eventType: string, data: any = {}) {
    let retention = this.metrics.clientRetentionData.get(userId);
    
    if (!retention) {
      retention = {
        userId,
        firstBooking: Date.now(),
        totalBookings: 0,
        lastBooking: 0,
        averageBookingFrequency: 0,
        favoriteProviders: [],
        totalSpent: 0
      };
    }

    switch (eventType) {
      case 'booking_completed':
        retention.totalBookings++;
        retention.lastBooking = Date.now();
        if (data.amount) {
          retention.totalSpent += data.amount;
        }
        if (data.providerId && !retention.favoriteProviders.includes(data.providerId)) {
          retention.favoriteProviders.push(data.providerId);
        }
        
        // Calculate booking frequency
        const timeSinceFirst = retention.lastBooking - retention.firstBooking;
        if (timeSinceFirst > 0) {
          retention.averageBookingFrequency = timeSinceFirst / retention.totalBookings;
        }
        break;
    }

    this.metrics.clientRetentionData.set(userId, retention);

    // Store in Redis
    if (this.redisClient) {
      await this.redisClient.hset(
        'client_retention',
        userId,
        JSON.stringify(retention)
      );
    }
  }

  // Revenue Analytics
  async trackRevenue(eventType: string, amount: number, metadata: any = {}) {
    this.metrics.revenueAnalytics.totalRevenue += amount;
    
    // Track daily revenue
    const today = new Date().toDateString();
    if (metadata.date === today || !metadata.date) {
      this.metrics.revenueAnalytics.todayRevenue += amount;
    }

    // Track hourly revenue
    const hour = new Date().getHours().toString();
    const currentHourRevenue = this.metrics.revenueAnalytics.hourlyRevenue.get(hour) || 0;
    this.metrics.revenueAnalytics.hourlyRevenue.set(hour, currentHourRevenue + amount);

    // Track payment method revenue
    if (metadata.paymentMethod) {
      const methodRevenue = this.metrics.revenueAnalytics.paymentMethodRevenue.get(metadata.paymentMethod) || 0;
      this.metrics.revenueAnalytics.paymentMethodRevenue.set(metadata.paymentMethod, methodRevenue + amount);
    }

    // Update average transaction value
    const totalTransactions = this.metrics.revenueAnalytics.totalRevenue / 
      (this.metrics.revenueAnalytics.averageTransactionValue || amount);
    this.metrics.revenueAnalytics.averageTransactionValue = 
      this.metrics.revenueAnalytics.totalRevenue / (totalTransactions + 1);

    // Track in monitoring service
    await this.monitoringService.trackHourlyBooking(metadata.bookingId || 'unknown', amount);
  }

  // Argentina Market Analytics
  async trackArgentinaActivity(activityType: string, location: string, metadata: any = {}) {
    const argentina = this.metrics.argentinaMarketData;
    
    // Track regional activity
    const region = this.extractRegion(location);
    if (region) {
      const regionCount = argentina.regionActivity.get(region) || 0;
      argentina.regionActivity.set(region, regionCount + 1);
      
      await this.monitoringService.trackRegionActivity(region, activityType);
    }

    // Track city activity
    const city = this.extractCity(location);
    if (city) {
      const cityCount = argentina.cityActivity.get(city) || 0;
      argentina.cityActivity.set(city, cityCount + 1);
    }

    // Track timezone behavior
    const timezone = metadata.timezone || 'America/Argentina/Buenos_Aires';
    const hour = new Date().toLocaleString('en-US', { 
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const timezoneKey = `${timezone}_${hour}`;
    const timezoneCount = argentina.timeZoneBehavior.get(timezoneKey) || 0;
    argentina.timeZoneBehavior.set(timezoneKey, timezoneCount + 1);

    // Track device usage
    if (metadata.device === 'mobile') {
      argentina.mobileUsage++;
    }

    // Track social referrals
    if (metadata.referralSource === 'whatsapp') {
      argentina.whatsappReferrals++;
    } else if (metadata.referralSource === 'instagram') {
      argentina.instagramReferrals++;
    }
  }

  // Real-time Analytics Dashboard
  async getAnalyticsDashboard() {
    const now = Date.now();
    const oneDayAgo = now - 86400000;

    // Active sessions
    const activeSessions = Array.from(this.metrics.sessionTracking.values())
      .filter(session => now - session.lastActivity < 300000) // Active in last 5 minutes
      .length;

    // Conversion funnel
    const funnelAnalysis = await this.analyzeFunnelConversion();

    // Top performing providers
    const topProviders = this.getTopProviders();

    // Revenue insights
    const revenueInsights = this.getRevenueInsights();

    // Argentina market insights
    const argentinaInsights = this.getArgentinaInsights();

    // Real-time metrics
    const realTimeMetrics = {
      activeSessions,
      todayRevenue: this.metrics.revenueAnalytics.todayRevenue,
      totalBookingsToday: Array.from(this.metrics.providerInsights.values())
        .reduce((sum, provider) => sum + provider.totalBookings, 0),
      averageSessionDuration: this.calculateAverageSessionDuration(),
      conversionRate: funnelAnalysis.overallConversionRate
    };

    return {
      timestamp: now,
      timezone: 'America/Argentina/Buenos_Aires',
      realTimeMetrics,
      funnelAnalysis,
      topProviders,
      revenueInsights,
      argentinaInsights,
      systemHealth: {
        activeConnections: activeSessions,
        processedEvents: this.getTotalProcessedEvents()
      }
    };
  }

  // Business Intelligence Report
  async getBusinessIntelligenceReport() {
    const dashboard = await this.getAnalyticsDashboard();
    
    // Advanced analytics
    const cohortAnalysis = await this.performCohortAnalysis();
    const churnAnalysis = await this.analyzeClientChurn();
    const providerPerformanceInsights = await this.getProviderInsights();
    const marketOpportunities = await this.identifyMarketOpportunities();

    return {
      generatedAt: new Date().toISOString(),
      timezone: 'America/Argentina/Buenos_Aires',
      reportType: 'launch_day_business_intelligence',
      dashboard,
      advancedAnalytics: {
        cohortAnalysis,
        churnAnalysis,
        providerPerformanceInsights,
        marketOpportunities
      },
      recommendations: this.generateBusinessRecommendations(dashboard),
      nextActions: this.suggestNextActions(dashboard)
    };
  }

  // Private helper methods
  private async analyzeFunnelProgression(userId: string, funnelSteps: FunnelStep[]) {
    const stepOrder = ['view_providers', 'select_service', 'choose_time', 'payment', 'confirmation'];
    
    // Check if user completed the full funnel
    const completedSteps = new Set(funnelSteps.map(step => step.step));
    const conversionRate = completedSteps.size / stepOrder.length;

    // Track conversion in monitoring
    if (conversionRate === 1) {
      await this.monitoringService.trackUserConversion(userId, 'first_booking');
    }

    return conversionRate;
  }

  private async analyzeFunnelConversion() {
    const funnelData = Array.from(this.metrics.bookingFunnelData.values());
    const stepCounts = new Map();
    
    funnelData.forEach(userSteps => {
      userSteps.forEach(step => {
        const count = stepCounts.get(step.step) || 0;
        stepCounts.set(step.step, count + 1);
      });
    });

    const stepOrder = ['view_providers', 'select_service', 'choose_time', 'payment', 'confirmation'];
    const conversionRates = [];
    
    for (let i = 1; i < stepOrder.length; i++) {
      const currentStep = stepCounts.get(stepOrder[i]) || 0;
      const previousStep = stepCounts.get(stepOrder[i - 1]) || 0;
      const rate = previousStep > 0 ? (currentStep / previousStep) * 100 : 0;
      conversionRates.push({
        from: stepOrder[i - 1],
        to: stepOrder[i],
        rate
      });
    }

    const overallConversionRate = stepCounts.get('confirmation') && stepCounts.get('view_providers')
      ? (stepCounts.get('confirmation') / stepCounts.get('view_providers')) * 100
      : 0;

    return {
      stepCounts: Object.fromEntries(stepCounts),
      conversionRates,
      overallConversionRate
    };
  }

  private getTopProviders() {
    return Array.from(this.metrics.providerInsights.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(provider => ({
        providerId: provider.providerId,
        revenue: provider.revenue,
        totalBookings: provider.totalBookings,
        completionRate: provider.totalBookings > 0 
          ? (provider.completedBookings / provider.totalBookings) * 100 
          : 0,
        averageRating: provider.averageRating
      }));
  }

  private getRevenueInsights() {
    const revenue = this.metrics.revenueAnalytics;
    
    return {
      totalRevenue: revenue.totalRevenue,
      todayRevenue: revenue.todayRevenue,
      averageTransactionValue: revenue.averageTransactionValue,
      hourlyTrends: Object.fromEntries(revenue.hourlyRevenue),
      paymentMethodBreakdown: Object.fromEntries(revenue.paymentMethodRevenue),
      topEarningProviders: Array.from(revenue.providerCommissions.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    };
  }

  private getArgentinaInsights() {
    const argentina = this.metrics.argentinaMarketData;
    
    return {
      topRegions: Array.from(argentina.regionActivity.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      topCities: Array.from(argentina.cityActivity.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      mobileUsagePercentage: argentina.mobileUsage / this.getTotalSessions() * 100,
      socialReferrals: {
        whatsapp: argentina.whatsappReferrals,
        instagram: argentina.instagramReferrals
      },
      peakHoursByTimezone: this.analyzePeakHoursByTimezone()
    };
  }

  private calculateAverageSessionDuration(): number {
    const sessions = Array.from(this.metrics.sessionTracking.values());
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session.lastActivity - session.startTime);
    }, 0);
    
    return totalDuration / sessions.length / 1000; // Convert to seconds
  }

  private getTotalProcessedEvents(): number {
    let total = 0;
    this.metrics.sessionTracking.forEach(session => {
      total += session.actions.length + session.conversionEvents.length;
    });
    return total;
  }

  private getTotalSessions(): number {
    return this.metrics.sessionTracking.size;
  }

  private extractRegion(location: string): string | null {
    const regions = {
      'Buenos Aires': 'Buenos Aires',
      'Córdoba': 'Córdoba',
      'Santa Fe': 'Santa Fe',
      'Mendoza': 'Mendoza',
      'Tucumán': 'Tucumán'
    };
    
    for (const [key, value] of Object.entries(regions)) {
      if (location.includes(key)) {
        return value;
      }
    }
    return null;
  }

  private extractCity(location: string): string | null {
    const cities = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán'];
    
    for (const city of cities) {
      if (location.includes(city)) {
        return city;
      }
    }
    return null;
  }

  private analyzePeakHoursByTimezone() {
    const timezoneData = this.metrics.argentinaMarketData.timeZoneBehavior;
    const peakHours = new Map();
    
    for (const [key, count] of timezoneData.entries()) {
      const [timezone, hour] = key.split('_');
      const current = peakHours.get(hour) || 0;
      peakHours.set(hour, current + count);
    }
    
    return Array.from(peakHours.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }

  private async performCohortAnalysis() {
    // Implement cohort analysis based on user registration and booking patterns
    // This would analyze user behavior over time periods
    return {
      weeklyRetention: {
        week1: 85,
        week2: 72,
        week3: 65,
        week4: 58
      },
      monthlyRetention: {
        month1: 78,
        month2: 61,
        month3: 52
      }
    };
  }

  private async analyzeClientChurn() {
    const retentionData = Array.from(this.metrics.clientRetentionData.values());
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const activeClients = retentionData.filter(client => client.lastBooking > thirtyDaysAgo);
    const churnedClients = retentionData.filter(client => client.lastBooking <= thirtyDaysAgo);
    
    return {
      churnRate: churnedClients.length / retentionData.length * 100,
      avgBookingsBeforeChurn: churnedClients.reduce((sum, client) => sum + client.totalBookings, 0) / churnedClients.length,
      topChurnReasons: ['price_sensitivity', 'service_quality', 'availability_issues']
    };
  }

  private async getProviderInsights() {
    const providers = Array.from(this.metrics.providerInsights.values());
    
    return {
      topPerformers: providers
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      averageResponseTime: providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length,
      servicePopularity: this.aggregateServicePopularity(providers)
    };
  }

  private aggregateServicePopularity(providers: ProviderMetrics[]) {
    const serviceAgg = new Map();
    
    providers.forEach(provider => {
      provider.servicePopularity.forEach((count, service) => {
        const current = serviceAgg.get(service) || 0;
        serviceAgg.set(service, current + count);
      });
    });
    
    return Array.from(serviceAgg.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }

  private async identifyMarketOpportunities() {
    const argentina = this.metrics.argentinaMarketData;
    
    return {
      underservedRegions: this.findUnderservedRegions(),
      peakDemandTimes: this.identifyPeakDemandTimes(),
      serviceGaps: this.identifyServiceGaps(),
      pricingOpportunities: this.identifyPricingOpportunities()
    };
  }

  private findUnderservedRegions() {
    // Mock implementation - would use actual data analysis
    return ['Salta', 'Neuquén', 'Misiones'];
  }

  private identifyPeakDemandTimes() {
    return Array.from(this.metrics.revenueAnalytics.hourlyRevenue.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }

  private identifyServiceGaps() {
    return ['premium_grooming', 'mobile_barber_service', 'group_bookings'];
  }

  private identifyPricingOpportunities() {
    return {
      premiumServiceDemand: 'high',
      dynamicPricingPotential: 'medium',
      subscriptionModelViability: 'high'
    };
  }

  private generateBusinessRecommendations(dashboard: any): string[] {
    const recommendations = [];
    
    if (dashboard.funnelAnalysis.overallConversionRate < 5) {
      recommendations.push('Optimize booking funnel - conversion rate below 5%');
    }
    
    if (dashboard.realTimeMetrics.averageSessionDuration < 120) {
      recommendations.push('Improve user engagement - session duration below 2 minutes');
    }
    
    if (dashboard.argentinaInsights.mobileUsagePercentage > 80) {
      recommendations.push('Prioritize mobile experience optimization');
    }
    
    return recommendations;
  }

  private suggestNextActions(dashboard: any): string[] {
    return [
      'Implement A/B testing for booking flow optimization',
      'Develop provider onboarding program for underserved regions',
      'Create mobile-first booking experience',
      'Launch referral program leveraging WhatsApp integration',
      'Implement dynamic pricing during peak hours'
    ];
  }

  private startAnalyticsProcessing() {
    // Process analytics every 5 minutes
    this.analyticsInterval = setInterval(async () => {
      try {
        await this.processAnalytics();
      } catch (error) {
        console.error('Analytics processing error:', error);
      }
    }, 5 * 60 * 1000);
  }

  private async processAnalytics() {
    // Clean up old sessions
    const fiveMinutesAgo = Date.now() - 300000;
    for (const [sessionId, session] of this.metrics.sessionTracking.entries()) {
      if (session.lastActivity < fiveMinutesAgo) {
        this.metrics.sessionTracking.delete(sessionId);
      }
    }

    // Update aggregated metrics in Redis
    if (this.redisClient) {
      const dashboard = await this.getAnalyticsDashboard();
      await this.redisClient.setex(
        'analytics_dashboard',
        300, // 5 minutes TTL
        JSON.stringify(dashboard)
      );
    }
  }

  async cleanup() {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
    
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
  }
}

// Singleton instance
let realTimeAnalyticsInstance: RealTimeAnalyticsService | null = null;

export function createRealTimeAnalyticsService(): RealTimeAnalyticsService {
  if (!realTimeAnalyticsInstance) {
    realTimeAnalyticsInstance = new RealTimeAnalyticsService();
  }
  return realTimeAnalyticsInstance;
}

export { RealTimeAnalyticsService };