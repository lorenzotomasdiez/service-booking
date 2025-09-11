/**
 * Advanced Provider Analytics Service for BarberPro
 * Comprehensive analytics and business intelligence
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './database';

export interface AnalyticsDateRange {
  from: Date;
  to: Date;
  previousFrom?: Date;
  previousTo?: Date;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageBookingValue: number;
  growth: {
    revenue: number; // percentage
    bookings: number; // percentage
    avgValue: number; // percentage
  };
  breakdown: {
    byService: Array<{
      serviceId: string;
      serviceName: string;
      revenue: number;
      bookings: number;
      percentage: number;
    }>;
    byMonth: Array<{
      month: string; // "2025-09"
      revenue: number;
      bookings: number;
      avgValue: number;
    }>;
    byDay: Array<{
      date: string; // "2025-09-11"
      revenue: number;
      bookings: number;
    }>;
    byHour: Array<{
      hour: number; // 0-23
      revenue: number;
      bookings: number;
    }>;
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
    yearEnd: number;
  };
}

export interface ClientAnalytics {
  totalClients: number;
  newClients: number;
  returningClients: number;
  clientRetentionRate: number;
  averageBookingsPerClient: number;
  clientLifetimeValue: number;
  churnRate: number;
  growth: {
    newClients: number; // percentage
    retention: number; // percentage
    ltv: number; // percentage
  };
  segments: {
    byFrequency: Array<{
      segment: 'first_time' | 'occasional' | 'regular' | 'loyal';
      count: number;
      revenue: number;
      percentage: number;
    }>;
    byValue: Array<{
      segment: 'low' | 'medium' | 'high' | 'vip';
      count: number;
      revenue: number;
      avgBookingValue: number;
    }>;
    byRecency: Array<{
      segment: 'active' | 'at_risk' | 'inactive';
      count: number;
      lastBookingDays: number;
    }>;
  };
  demographics: {
    ageGroups: Array<{
      range: string; // "18-25"
      count: number;
      percentage: number;
    }>;
    locations: Array<{
      area: string;
      count: number;
      percentage: number;
    }>;
  };
}

export interface OperationalAnalytics {
  utilization: {
    overall: number; // percentage
    byDay: Array<{
      day: string;
      utilization: number;
    }>;
    byHour: Array<{
      hour: number;
      utilization: number;
    }>;
  };
  efficiency: {
    averageServiceTime: number; // minutes
    bufferTime: number; // minutes
    overtimeRate: number; // percentage of bookings going over time
    cancellationRate: number; // percentage
    noShowRate: number; // percentage
  };
  capacity: {
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    peakHours: Array<{
      hour: number;
      demand: number;
    }>;
    optimalCapacity: number;
  };
  quality: {
    averageRating: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
    reviewSentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

export interface MarketingAnalytics {
  channelPerformance: Array<{
    channel: 'organic' | 'referral' | 'social_media' | 'paid_ads' | 'email' | 'sms';
    bookings: number;
    revenue: number;
    cost?: number;
    roi?: number;
  }>;
  promotionEffectiveness: Array<{
    promotionId: string;
    promotionName: string;
    usage: number;
    revenue: number;
    discount: number;
    netRevenue: number;
    conversionRate: number;
  }>;
  referralProgram: {
    totalReferrals: number;
    successfulReferrals: number;
    referralRevenue: number;
    topReferrers: Array<{
      clientId: string;
      clientName: string;
      referrals: number;
      revenue: number;
    }>;
  };
  digitalPresence: {
    websiteViews?: number;
    socialMediaReach?: number;
    onlineReviews: number;
    averageOnlineRating: number;
  };
}

export interface PredictiveAnalytics {
  demandForecasting: {
    nextWeek: Array<{
      date: string;
      predictedBookings: number;
      confidence: number;
    }>;
    nextMonth: {
      predictedRevenue: number;
      predictedBookings: number;
      confidence: number;
    };
    seasonal: Array<{
      month: number;
      seasonalityIndex: number; // 1.0 = average
      predictedDemand: number;
    }>;
  };
  clientBehavior: {
    churnRisk: Array<{
      clientId: string;
      clientName: string;
      riskScore: number; // 0-100
      lastBooking: Date;
      recommendedAction: string;
    }>;
    upsellOpportunities: Array<{
      clientId: string;
      clientName: string;
      suggestedService: string;
      probability: number;
      potentialRevenue: number;
    }>;
  };
  businessInsights: {
    revenueGrowthTrend: 'increasing' | 'stable' | 'decreasing';
    clientSatisfactionTrend: 'improving' | 'stable' | 'declining';
    operationalEfficiencyTrend: 'improving' | 'stable' | 'declining';
    recommendations: Array<{
      category: 'pricing' | 'scheduling' | 'marketing' | 'operations';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      expectedImpact: string;
    }>;
  };
}

export class ProviderAnalyticsService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Get comprehensive analytics dashboard for a provider
   */
  async getAnalyticsDashboard(
    providerId: string,
    dateRange: AnalyticsDateRange
  ): Promise<{
    revenue: RevenueAnalytics;
    clients: ClientAnalytics;
    operations: OperationalAnalytics;
    marketing: MarketingAnalytics;
    predictive: PredictiveAnalytics;
    lastUpdated: Date;
  }> {
    const [revenue, clients, operations, marketing, predictive] = await Promise.all([
      this.getRevenueAnalytics(providerId, dateRange),
      this.getClientAnalytics(providerId, dateRange),
      this.getOperationalAnalytics(providerId, dateRange),
      this.getMarketingAnalytics(providerId, dateRange),
      this.getPredictiveAnalytics(providerId, dateRange)
    ]);

    return {
      revenue,
      clients,
      operations,
      marketing,
      predictive,
      lastUpdated: new Date()
    };
  }

  /**
   * Get revenue analytics with growth metrics
   */
  async getRevenueAnalytics(
    providerId: string,
    dateRange: AnalyticsDateRange
  ): Promise<RevenueAnalytics> {
    // In production, these would be complex database queries
    // For now, providing realistic mock data

    const totalRevenue = 285000; // ARS
    const totalBookings = 342;
    const averageBookingValue = totalRevenue / totalBookings;

    // Mock previous period for growth calculation
    const previousRevenue = 248000;
    const previousBookings = 298;
    const previousAvgValue = previousRevenue / previousBookings;

    return {
      totalRevenue,
      averageBookingValue,
      growth: {
        revenue: ((totalRevenue - previousRevenue) / previousRevenue) * 100,
        bookings: ((totalBookings - previousBookings) / previousBookings) * 100,
        avgValue: ((averageBookingValue - previousAvgValue) / previousAvgValue) * 100
      },
      breakdown: {
        byService: [
          {
            serviceId: 'service-1',
            serviceName: 'Corte de Cabello',
            revenue: 142500,
            bookings: 190,
            percentage: 50.0
          },
          {
            serviceId: 'service-2',
            serviceName: 'Barba',
            revenue: 85500,
            bookings: 95,
            percentage: 30.0
          },
          {
            serviceId: 'service-3',
            serviceName: 'Combo Completo',
            revenue: 57000,
            bookings: 57,
            percentage: 20.0
          }
        ],
        byMonth: this.generateMonthlyBreakdown(),
        byDay: this.generateDailyBreakdown(),
        byHour: this.generateHourlyBreakdown()
      },
      projections: {
        nextMonth: totalRevenue * 1.15, // 15% growth projection
        nextQuarter: totalRevenue * 3.2,
        yearEnd: totalRevenue * 12.8
      }
    };
  }

  /**
   * Get client analytics with segmentation
   */
  async getClientAnalytics(
    providerId: string,
    dateRange: AnalyticsDateRange
  ): Promise<ClientAnalytics> {
    const totalClients = 156;
    const newClients = 23;
    const returningClients = 133;
    const clientRetentionRate = (returningClients / totalClients) * 100;

    return {
      totalClients,
      newClients,
      returningClients,
      clientRetentionRate,
      averageBookingsPerClient: 2.19,
      clientLifetimeValue: 4850,
      churnRate: 12.5,
      growth: {
        newClients: 18.5,
        retention: 5.2,
        ltv: 8.7
      },
      segments: {
        byFrequency: [
          { segment: 'first_time', count: 23, revenue: 46000, percentage: 14.7 },
          { segment: 'occasional', count: 45, revenue: 81000, percentage: 28.8 },
          { segment: 'regular', count: 67, revenue: 120600, percentage: 43.0 },
          { segment: 'loyal', count: 21, revenue: 37400, percentage: 13.5 }
        ],
        byValue: [
          { segment: 'low', count: 45, revenue: 31500, avgBookingValue: 700 },
          { segment: 'medium', count: 78, revenue: 140400, avgBookingValue: 1800 },
          { segment: 'high', count: 28, revenue: 89600, avgBookingValue: 3200 },
          { segment: 'vip', count: 5, revenue: 23500, avgBookingValue: 4700 }
        ],
        byRecency: [
          { segment: 'active', count: 124, lastBookingDays: 15 },
          { segment: 'at_risk', count: 23, lastBookingDays: 45 },
          { segment: 'inactive', count: 9, lastBookingDays: 90 }
        ]
      },
      demographics: {
        ageGroups: [
          { range: '18-25', count: 28, percentage: 17.9 },
          { range: '26-35', count: 52, percentage: 33.3 },
          { range: '36-45', count: 41, percentage: 26.3 },
          { range: '46-55', count: 25, percentage: 16.0 },
          { range: '56+', count: 10, percentage: 6.4 }
        ],
        locations: [
          { area: 'Palermo', count: 45, percentage: 28.8 },
          { area: 'Recoleta', count: 38, percentage: 24.4 },
          { area: 'Villa Crespo', count: 31, percentage: 19.9 },
          { area: 'Caballito', count: 24, percentage: 15.4 },
          { area: 'Otros', count: 18, percentage: 11.5 }
        ]
      }
    };
  }

  /**
   * Get operational efficiency analytics
   */
  async getOperationalAnalytics(
    providerId: string,
    dateRange: AnalyticsDateRange
  ): Promise<OperationalAnalytics> {
    return {
      utilization: {
        overall: 78.5,
        byDay: [
          { day: 'Lunes', utilization: 65.2 },
          { day: 'Martes', utilization: 73.8 },
          { day: 'Miércoles', utilization: 82.1 },
          { day: 'Jueves', utilization: 89.3 },
          { day: 'Viernes', utilization: 95.7 },
          { day: 'Sábado', utilization: 91.2 }
        ],
        byHour: this.generateHourlyUtilization()
      },
      efficiency: {
        averageServiceTime: 42, // minutes
        bufferTime: 15, // minutes
        overtimeRate: 8.3, // 8.3% of bookings go over time
        cancellationRate: 5.7,
        noShowRate: 2.1
      },
      capacity: {
        totalSlots: 480,
        bookedSlots: 377,
        availableSlots: 103,
        peakHours: [
          { hour: 14, demand: 95 },
          { hour: 15, demand: 88 },
          { hour: 16, demand: 92 },
          { hour: 17, demand: 87 }
        ],
        optimalCapacity: 420
      },
      quality: {
        averageRating: 4.7,
        ratingDistribution: [
          { rating: 5, count: 198, percentage: 65.1 },
          { rating: 4, count: 87, percentage: 28.6 },
          { rating: 3, count: 15, percentage: 4.9 },
          { rating: 2, count: 3, percentage: 1.0 },
          { rating: 1, count: 1, percentage: 0.3 }
        ],
        reviewSentiment: {
          positive: 89.5,
          neutral: 8.2,
          negative: 2.3
        }
      }
    };
  }

  /**
   * Get marketing performance analytics
   */
  async getMarketingAnalytics(
    providerId: string,
    dateRange: AnalyticsDateRange
  ): Promise<MarketingAnalytics> {
    return {
      channelPerformance: [
        {
          channel: 'organic',
          bookings: 145,
          revenue: 130500,
          cost: 0,
          roi: Infinity
        },
        {
          channel: 'referral',
          bookings: 67,
          revenue: 60300,
          cost: 4200,
          roi: 1335
        },
        {
          channel: 'social_media',
          bookings: 89,
          revenue: 80100,
          cost: 8500,
          roi: 842
        },
        {
          channel: 'paid_ads',
          bookings: 23,
          revenue: 20700,
          cost: 12000,
          roi: 73
        }
      ],
      promotionEffectiveness: [
        {
          promotionId: 'promo-1',
          promotionName: 'Happy Hour',
          usage: 45,
          revenue: 31500,
          discount: 6300,
          netRevenue: 25200,
          conversionRate: 15.8
        },
        {
          promotionId: 'promo-2',
          promotionName: 'Descuento Nuevos Clientes',
          usage: 23,
          revenue: 18400,
          discount: 2760,
          netRevenue: 15640,
          conversionRate: 12.1
        }
      ],
      referralProgram: {
        totalReferrals: 89,
        successfulReferrals: 67,
        referralRevenue: 60300,
        topReferrers: [
          {
            clientId: 'client-1',
            clientName: 'Carlos Mendez',
            referrals: 8,
            revenue: 7200
          },
          {
            clientId: 'client-2',
            clientName: 'María López',
            referrals: 6,
            revenue: 5400
          }
        ]
      },
      digitalPresence: {
        websiteViews: 2340,
        socialMediaReach: 5670,
        onlineReviews: 156,
        averageOnlineRating: 4.8
      }
    };
  }

  /**
   * Get predictive analytics and insights
   */
  async getPredictiveAnalytics(
    providerId: string,
    dateRange: AnalyticsDateRange
  ): Promise<PredictiveAnalytics> {
    return {
      demandForecasting: {
        nextWeek: this.generateWeeklyForecast(),
        nextMonth: {
          predictedRevenue: 310000,
          predictedBookings: 375,
          confidence: 85
        },
        seasonal: this.generateSeasonalForecast()
      },
      clientBehavior: {
        churnRisk: [
          {
            clientId: 'client-at-risk-1',
            clientName: 'Roberto Silva',
            riskScore: 78,
            lastBooking: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            recommendedAction: 'Enviar promoción personalizada'
          },
          {
            clientId: 'client-at-risk-2',
            clientName: 'Diego Fernández',
            riskScore: 65,
            lastBooking: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
            recommendedAction: 'Contactar para reagendar'
          }
        ],
        upsellOpportunities: [
          {
            clientId: 'client-upsell-1',
            clientName: 'Martín Rodríguez',
            suggestedService: 'Tratamiento Capilar',
            probability: 72,
            potentialRevenue: 2500
          }
        ]
      },
      businessInsights: {
        revenueGrowthTrend: 'increasing',
        clientSatisfactionTrend: 'stable',
        operationalEfficiencyTrend: 'improving',
        recommendations: [
          {
            category: 'scheduling',
            priority: 'high',
            title: 'Optimizar horarios de baja demanda',
            description: 'Implementar promociones para martes y miércoles por la mañana',
            expectedImpact: '+12% en utilización'
          },
          {
            category: 'marketing',
            priority: 'medium',
            title: 'Expandir programa de referidos',
            description: 'Aumentar recompensas para referidos exitosos',
            expectedImpact: '+25% en nuevos clientes'
          },
          {
            category: 'pricing',
            priority: 'medium',
            title: 'Ajustar precios de servicios premium',
            description: 'Incremento de 8% en servicios con alta demanda',
            expectedImpact: '+6% en revenue'
          }
        ]
      }
    };
  }

  /**
   * Export analytics data in various formats
   */
  async exportAnalyticsReport(
    providerId: string,
    dateRange: AnalyticsDateRange,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<{
    data: any;
    filename: string;
    mimeType: string;
  }> {
    const analytics = await this.getAnalyticsDashboard(providerId, dateRange);
    
    const filename = `analytics-${providerId}-${dateRange.from.toISOString().split('T')[0]}-${dateRange.to.toISOString().split('T')[0]}`;

    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(analytics, null, 2),
          filename: `${filename}.json`,
          mimeType: 'application/json'
        };
        
      case 'csv':
        const csvData = this.convertToCSV(analytics);
        return {
          data: csvData,
          filename: `${filename}.csv`,
          mimeType: 'text/csv'
        };
        
      case 'pdf':
        // In production, you would generate a PDF report
        return {
          data: 'PDF report would be generated here',
          filename: `${filename}.pdf`,
          mimeType: 'application/pdf'
        };
        
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Private helper methods

  private generateMonthlyBreakdown(): RevenueAnalytics['breakdown']['byMonth'] {
    const months = ['2025-06', '2025-07', '2025-08', '2025-09'];
    return months.map(month => ({
      month,
      revenue: 60000 + Math.random() * 40000,
      bookings: 70 + Math.floor(Math.random() * 30),
      avgValue: 800 + Math.random() * 200
    }));
  }

  private generateDailyBreakdown(): RevenueAnalytics['breakdown']['byDay'] {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        revenue: 8000 + Math.random() * 4000,
        bookings: 10 + Math.floor(Math.random() * 8)
      });
    }
    return days.reverse();
  }

  private generateHourlyBreakdown(): RevenueAnalytics['breakdown']['byHour'] {
    const hours = [];
    for (let hour = 9; hour <= 18; hour++) {
      let bookings = 5;
      let revenue = 4000;
      
      // Peak hours (2-6 PM) have more bookings
      if (hour >= 14 && hour <= 18) {
        bookings = 8 + Math.floor(Math.random() * 4);
        revenue = 6000 + Math.random() * 2000;
      }
      
      hours.push({ hour, revenue, bookings });
    }
    return hours;
  }

  private generateHourlyUtilization(): OperationalAnalytics['utilization']['byHour'] {
    const hours = [];
    for (let hour = 9; hour <= 18; hour++) {
      let utilization = 60 + Math.random() * 20;
      
      // Peak hours have higher utilization
      if (hour >= 14 && hour <= 18) {
        utilization = 80 + Math.random() * 15;
      }
      
      hours.push({ hour, utilization });
    }
    return hours;
  }

  private generateWeeklyForecast(): PredictiveAnalytics['demandForecasting']['nextWeek'] {
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      let predictedBookings = 12;
      let confidence = 75;
      
      // Weekend has lower bookings
      if (date.getDay() === 0) { // Sunday
        predictedBookings = 3;
        confidence = 65;
      }
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedBookings: predictedBookings + Math.floor(Math.random() * 6),
        confidence: confidence + Math.floor(Math.random() * 20)
      });
    }
    return forecast;
  }

  private generateSeasonalForecast(): PredictiveAnalytics['demandForecasting']['seasonal'] {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      let seasonalityIndex = 1.0;
      let predictedDemand = 300;
      
      // Summer months (Dec-Feb) have higher demand
      if (month === 12 || month <= 2) {
        seasonalityIndex = 1.2;
        predictedDemand = 360;
      }
      // Winter months (Jun-Aug) have lower demand
      else if (month >= 6 && month <= 8) {
        seasonalityIndex = 0.8;
        predictedDemand = 240;
      }
      
      months.push({
        month,
        seasonalityIndex,
        predictedDemand: predictedDemand + Math.floor(Math.random() * 60)
      });
    }
    return months;
  }

  private convertToCSV(analytics: any): string {
    // Simple CSV conversion - in production, you'd use a proper CSV library
    const headers = ['Metric', 'Value', 'Period'];
    const rows = [
      ['Total Revenue', analytics.revenue.totalRevenue, 'Current Period'],
      ['Average Booking Value', analytics.revenue.averageBookingValue, 'Current Period'],
      ['Total Clients', analytics.clients.totalClients, 'Current Period'],
      ['Client Retention Rate', `${analytics.clients.clientRetentionRate}%`, 'Current Period'],
      ['Overall Utilization', `${analytics.operations.utilization.overall}%`, 'Current Period'],
      ['Average Rating', analytics.operations.quality.averageRating, 'Current Period']
    ];
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

export const providerAnalytics = new ProviderAnalyticsService();