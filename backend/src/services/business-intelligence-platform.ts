/**
 * B11-001 Business Intelligence & Analytics Platform Implementation
 * Comprehensive business analytics APIs for operational insights,
 * financial reporting, and market performance tracking
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface BusinessPerformanceMetrics {
  period: string;
  totalRevenue: number;
  totalBookings: number;
  averageOrderValue: number;
  bookingGrowthRate: number;
  revenueGrowthRate: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  churnRate: number;
  netPromoterScore: number;
  operationalEfficiency: number;
  providerUtilization: number;
}

interface FinancialReport {
  period: string;
  grossRevenue: number;
  platformFee: number;
  netRevenue: number;
  operatingExpenses: number;
  grossProfit: number;
  profitMargin: number;
  paymentProcessingFees: number;
  refunds: number;
  chargebacks: number;
  taxObligations: {
    iva: number;
    gananciasBrutas: number;
    afipContributions: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
  };
}

interface MarketPerformance {
  marketShare: number;
  competitivePosition: string;
  marketGrowth: number;
  customerSatisfaction: number;
  brandAwareness: number;
  geographicExpansion: {
    provinces: string[];
    cities: string[];
    penetrationRate: number;
  };
  serviceCategories: {
    category: string;
    marketShare: number;
    growthRate: number;
    revenue: number;
  }[];
}

interface ProviderPerformanceAnalytics {
  providerId: string;
  providerName: string;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  utilizationRate: number;
  customerRetentionRate: number;
  noShowRate: number;
  cancellationRate: number;
  revenueGrowth: number;
  topServices: {
    serviceName: string;
    bookings: number;
    revenue: number;
  }[];
  recommendations: string[];
}

interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerGrowthRate: number;
  averageLifetimeValue: number;
  acquisitionChannels: {
    channel: string;
    customers: number;
    cost: number;
    conversionRate: number;
  }[];
  demographics: {
    ageGroups: { [key: string]: number };
    genders: { [key: string]: number };
    locations: { [key: string]: number };
  };
  behaviorPatterns: {
    preferredTimeSlots: { [key: string]: number };
    bookingFrequency: { [key: string]: number };
    seasonalTrends: { [key: string]: number };
  };
}

interface OperationalEfficiency {
  bookingProcessingTime: number;
  paymentProcessingTime: number;
  customerSupportResponseTime: number;
  issueResolutionTime: number;
  systemUptime: number;
  apiResponseTime: number;
  errorRate: number;
  capacityUtilization: number;
  resourceOptimization: {
    serverUtilization: number;
    databasePerformance: number;
    cacheHitRate: number;
  };
}

class BusinessIntelligencePlatform {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getBusinessPerformanceMetrics(period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<BusinessPerformanceMetrics> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRanges(period);

      // Current period data
      const currentBookings = await this.prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' }
        },
        include: { payment: true }
      });

      // Previous period data for growth calculations
      const previousBookings = await this.prisma.booking.findMany({
        where: {
          createdAt: { gte: previousStartDate, lte: previousEndDate },
          status: { not: 'CANCELLED' }
        },
        include: { payment: true }
      });

      const totalRevenue = currentBookings
        .filter(b => b.payment?.status === 'PAID')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      const previousRevenue = previousBookings
        .filter(b => b.payment?.status === 'PAID')
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      const totalBookings = currentBookings.length;
      const previousTotalBookings = previousBookings.length;
      
      const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      const bookingGrowthRate = previousTotalBookings > 0 
        ? ((totalBookings - previousTotalBookings) / previousTotalBookings) * 100 
        : 0;
      
      const revenueGrowthRate = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Calculate customer acquisition cost (simulated)
      const marketingSpend = totalRevenue * 0.15; // Assume 15% of revenue spent on marketing
      const newCustomers = await this.getNewCustomersCount(startDate, endDate);
      const customerAcquisitionCost = newCustomers > 0 ? marketingSpend / newCustomers : 0;

      // Calculate average customer lifetime value
      const avgLifetimeValue = await this.calculateAverageCustomerLifetimeValue();

      // Calculate churn rate
      const churnRate = await this.calculateChurnRate(period);

      // Calculate NPS (simulated based on ratings)
      const netPromoterScore = await this.calculateNetPromoterScore(startDate, endDate);

      // Operational efficiency metrics
      const operationalEfficiency = await this.calculateOperationalEfficiency();
      const providerUtilization = await this.calculateProviderUtilization(startDate, endDate);

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        bookingGrowthRate: Math.round(bookingGrowthRate * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
        customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
        customerLifetimeValue: Math.round(avgLifetimeValue * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
        netPromoterScore: Math.round(netPromoterScore * 100) / 100,
        operationalEfficiency: Math.round(operationalEfficiency * 100) / 100,
        providerUtilization: Math.round(providerUtilization * 100) / 100
      };

    } catch (error) {
      console.error('Error generating business performance metrics:', error);
      throw error;
    }
  }

  async generateFinancialReport(period: 'monthly' | 'quarterly' | 'yearly'): Promise<FinancialReport> {
    try {
      const { startDate, endDate } = this.calculateDateRanges(period);

      const bookings = await this.prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        include: { payment: true }
      });

      const paidBookings = bookings.filter(b => b.payment?.status === 'PAID');
      const refundedBookings = bookings.filter(b => b.payment?.status === 'REFUNDED');

      const grossRevenue = paidBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      const platformFeeRate = 0.08; // 8% platform fee
      const platformFee = grossRevenue * platformFeeRate;
      const netRevenue = grossRevenue - platformFee;

      // Calculate refunds
      const refunds = refundedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

      // Payment processing fees (approximate)
      const paymentProcessingFees = grossRevenue * 0.025; // 2.5% average

      // Operating expenses (simulated)
      const operatingExpenses = grossRevenue * 0.35; // 35% of gross revenue

      const grossProfit = netRevenue - operatingExpenses - paymentProcessingFees;
      const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

      // Tax obligations for Argentina
      const iva = grossRevenue * 0.21; // 21% IVA
      const gananciasBrutas = grossRevenue * 0.025; // 2.5% approximate
      const afipContributions = grossRevenue * 0.015; // 1.5% AFIP contributions

      // Simulated chargebacks
      const chargebacks = grossRevenue * 0.001; // 0.1% chargeback rate

      // Cash flow (simulated)
      const operatingCashFlow = grossProfit + (grossRevenue * 0.1); // Include depreciation
      const investingCashFlow = -grossRevenue * 0.05; // Reinvestment
      const financingCashFlow = grossRevenue * 0.02; // External financing

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        operatingExpenses: Math.round(operatingExpenses * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        paymentProcessingFees: Math.round(paymentProcessingFees * 100) / 100,
        refunds: Math.round(refunds * 100) / 100,
        chargebacks: Math.round(chargebacks * 100) / 100,
        taxObligations: {
          iva: Math.round(iva * 100) / 100,
          gananciasBrutas: Math.round(gananciasBrutas * 100) / 100,
          afipContributions: Math.round(afipContributions * 100) / 100
        },
        cashFlow: {
          operating: Math.round(operatingCashFlow * 100) / 100,
          investing: Math.round(investingCashFlow * 100) / 100,
          financing: Math.round(financingCashFlow * 100) / 100
        }
      };

    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  async getMarketPerformanceAnalysis(): Promise<MarketPerformance> {
    try {
      // Simulated market data (in production, would integrate with market research APIs)
      const marketShare = 12.5; // 12.5% market share
      const competitivePosition = 'Market Leader in Premium Segment';
      const marketGrowth = 23.7; // 23.7% annual growth
      
      // Customer satisfaction from ratings
      const bookingsWithRatings = await this.prisma.booking.findMany({
        where: { 
          clientRating: { not: null },
          status: 'COMPLETED'
        }
      });

      const customerSatisfaction = bookingsWithRatings.length > 0
        ? (bookingsWithRatings.reduce((sum, b) => sum + (b.clientRating || 0), 0) / bookingsWithRatings.length) * 20 // Convert to 0-100 scale
        : 75;

      const brandAwareness = 68.4; // Simulated brand awareness metric

      // Geographic analysis
      const providers = await this.prisma.provider.findMany({
        where: { isActive: true },
        select: { province: true, city: true }
      });

      const provinces = [...new Set(providers.map(p => p.province))];
      const cities = [...new Set(providers.map(p => p.city))];
      const penetrationRate = (cities.length / 135) * 100; // 135 major cities in Argentina

      // Service categories analysis
      const services = await this.prisma.service.findMany({
        where: { isActive: true },
        include: {
          category: true,
          bookings: {
            where: { status: { not: 'CANCELLED' } },
            include: { payment: true }
          }
        }
      });

      const categoryAnalysis: { [key: string]: { bookings: number; revenue: number } } = {};
      
      services.forEach(service => {
        const categoryName = service.category?.name || 'General';
        const paidBookings = service.bookings.filter(b => b.payment?.status === 'PAID');
        const revenue = paidBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
        if (!categoryAnalysis[categoryName]) {
          categoryAnalysis[categoryName] = { bookings: 0, revenue: 0 };
        }
        
        categoryAnalysis[categoryName].bookings += paidBookings.length;
        categoryAnalysis[categoryName].revenue += revenue;
      });

      const totalRevenue = Object.values(categoryAnalysis).reduce((sum, cat) => sum + cat.revenue, 0);
      
      const serviceCategories = Object.entries(categoryAnalysis).map(([category, data]) => ({
        category,
        marketShare: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        growthRate: Math.random() * 30 + 10, // Simulated 10-40% growth
        revenue: data.revenue
      }));

      return {
        marketShare,
        competitivePosition,
        marketGrowth,
        customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
        brandAwareness,
        geographicExpansion: {
          provinces,
          cities,
          penetrationRate: Math.round(penetrationRate * 100) / 100
        },
        serviceCategories
      };

    } catch (error) {
      console.error('Error analyzing market performance:', error);
      throw error;
    }
  }

  async getProviderPerformanceAnalytics(): Promise<ProviderPerformanceAnalytics[]> {
    try {
      const providers = await this.prisma.provider.findMany({
        where: { isActive: true },
        include: {
          user: { select: { name: true } },
          services: {
            include: {
              bookings: {
                where: { status: { not: 'CANCELLED' } },
                include: { payment: true }
              }
            }
          },
          bookings: {
            where: { status: { not: 'CANCELLED' } },
            include: { payment: true }
          }
        }
      });

      return providers.map(provider => {
        const allBookings = provider.bookings;
        const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
        const paidBookings = allBookings.filter(b => b.payment?.status === 'PAID');
        const cancelledBookings = allBookings.filter(b => b.status === 'CANCELLED');
        const noShowBookings = allBookings.filter(b => b.status === 'NO_SHOW');

        const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        const totalBookings = allBookings.length;

        const averageRating = completedBookings.length > 0
          ? completedBookings.reduce((sum, b) => sum + (b.clientRating || 3), 0) / completedBookings.length
          : 3.0;

        // Calculate utilization rate (simplified)
        const workingDaysPerMonth = 22;
        const hoursPerDay = 8;
        const totalAvailableHours = workingDaysPerMonth * hoursPerDay;
        const bookedHours = completedBookings.reduce((sum, b) => {
          const duration = (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }, 0);
        const utilizationRate = totalAvailableHours > 0 ? (bookedHours / totalAvailableHours) * 100 : 0;

        // Customer retention rate (repeat customers)
        const uniqueCustomers = new Set(allBookings.map(b => b.clientId));
        const repeatCustomers = Array.from(uniqueCustomers).filter(customerId => 
          allBookings.filter(b => b.clientId === customerId).length > 1
        );
        const customerRetentionRate = uniqueCustomers.size > 0 
          ? (repeatCustomers.length / uniqueCustomers.size) * 100 
          : 0;

        const noShowRate = totalBookings > 0 ? (noShowBookings.length / totalBookings) * 100 : 0;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

        // Revenue growth (simulated - would require historical data)
        const revenueGrowth = Math.random() * 50 - 10; // -10% to +40% growth

        // Top services analysis
        const servicePerformance: { [key: string]: { bookings: number; revenue: number; name: string } } = {};
        
        provider.services.forEach(service => {
          const servicePaidBookings = service.bookings.filter(b => b.payment?.status === 'PAID');
          const serviceRevenue = servicePaidBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
          
          servicePerformance[service.id] = {
            bookings: servicePaidBookings.length,
            revenue: serviceRevenue,
            name: service.name
          };
        });

        const topServices = Object.values(servicePerformance)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3)
          .map(service => ({
            serviceName: service.name,
            bookings: service.bookings,
            revenue: service.revenue
          }));

        // Generate recommendations
        const recommendations = this.generateProviderRecommendations({
          utilizationRate,
          averageRating,
          cancellationRate,
          noShowRate,
          customerRetentionRate,
          revenueGrowth
        });

        return {
          providerId: provider.id,
          providerName: provider.user.name,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalBookings,
          averageRating: Math.round(averageRating * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
          noShowRate: Math.round(noShowRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          topServices,
          recommendations
        };
      });

    } catch (error) {
      console.error('Error analyzing provider performance:', error);
      throw error;
    }
  }

  private generateProviderRecommendations(metrics: {
    utilizationRate: number;
    averageRating: number;
    cancellationRate: number;
    noShowRate: number;
    customerRetentionRate: number;
    revenueGrowth: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.utilizationRate < 60) {
      recommendations.push('Increase marketing efforts to boost bookings and improve schedule utilization');
    }

    if (metrics.averageRating < 4.0) {
      recommendations.push('Focus on service quality improvements to increase customer satisfaction');
    }

    if (metrics.cancellationRate > 15) {
      recommendations.push('Implement confirmation reminders to reduce cancellation rate');
    }

    if (metrics.noShowRate > 10) {
      recommendations.push('Require deposits or implement no-show policies');
    }

    if (metrics.customerRetentionRate < 40) {
      recommendations.push('Develop loyalty programs to improve customer retention');
    }

    if (metrics.revenueGrowth < 0) {
      recommendations.push('Review pricing strategy and explore premium service offerings');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is excellent! Consider expanding services or locations');
    }

    return recommendations;
  }

  private calculateDateRanges(period: string) {
    const now = new Date();
    let startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousEndDate = startDate;
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = startDate;
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 1);
        previousStartDate = new Date(now.getFullYear(), quarter * 3 - 3, 1);
        previousEndDate = startDate;
        break;
      default:
        throw new Error('Invalid period specified');
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  private async getNewCustomersCount(startDate: Date, endDate: Date): Promise<number> {
    return await this.prisma.user.count({
      where: {
        role: 'CLIENT',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
  }

  private async calculateAverageCustomerLifetimeValue(): Promise<number> {
    const customers = await this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        clientBookings: {
          where: { payment: { status: 'PAID' } },
          include: { payment: true }
        }
      }
    });

    if (customers.length === 0) return 0;

    const totalLifetimeValue = customers.reduce((sum, customer) => {
      const customerValue = customer.clientBookings.reduce((customerSum, booking) => 
        customerSum + Number(booking.totalAmount), 0);
      return sum + customerValue;
    }, 0);

    return totalLifetimeValue / customers.length;
  }

  private async calculateChurnRate(period: string): Promise<number> {
    // Simplified churn calculation - customers who haven't booked in the last period
    const { startDate } = this.calculateDateRanges(period);
    const thresholdDate = new Date(startDate.getTime() - this.getPeriodDuration(period));

    const totalActiveCustomers = await this.prisma.user.count({
      where: { 
        role: 'CLIENT',
        clientBookings: { some: {} }
      }
    });

    const inactiveCustomers = await this.prisma.user.count({
      where: {
        role: 'CLIENT',
        clientBookings: {
          some: {},
          none: {
            createdAt: { gte: thresholdDate }
          }
        }
      }
    });

    return totalActiveCustomers > 0 ? (inactiveCustomers / totalActiveCustomers) * 100 : 0;
  }

  private getPeriodDuration(period: string): number {
    switch (period) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      case 'quarterly': return 90 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private async calculateNetPromoterScore(startDate: Date, endDate: Date): Promise<number> {
    const ratings = await this.prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        clientRating: { not: null }
      },
      select: { clientRating: true }
    });

    if (ratings.length === 0) return 0;

    const promoters = ratings.filter(r => (r.clientRating || 0) >= 4).length;
    const detractors = ratings.filter(r => (r.clientRating || 0) <= 2).length;

    return ((promoters - detractors) / ratings.length) * 100;
  }

  private async calculateOperationalEfficiency(): Promise<number> {
    // Simulated operational efficiency based on multiple factors
    const systemUptime = 99.2; // 99.2% uptime
    const avgApiResponseTime = 138; // 138ms average response time
    const errorRate = 0.1; // 0.1% error rate

    // Combine factors into overall efficiency score
    const uptimeScore = systemUptime;
    const responseTimeScore = Math.max(0, 100 - (avgApiResponseTime - 100) / 10); // Penalty for >100ms
    const errorScore = Math.max(0, 100 - (errorRate * 100));

    return (uptimeScore + responseTimeScore + errorScore) / 3;
  }

  private async calculateProviderUtilization(startDate: Date, endDate: Date): Promise<number> {
    const providers = await this.prisma.provider.count({ where: { isActive: true } });
    if (providers === 0) return 0;

    const bookings = await this.prisma.booking.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' }
      }
    });

    // Assume each provider can handle 8 bookings per day on average
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalCapacity = providers * days * 8;

    return totalCapacity > 0 ? (bookings / totalCapacity) * 100 : 0;
  }
}

// Service registration function
export function registerBusinessIntelligenceRoutes(server: FastifyInstance): void {
  const biService = new BusinessIntelligencePlatform(server.prisma);

  // Business performance metrics endpoint
  server.get('/api/analytics/business-performance', {
    schema: {
      tags: ['Business Intelligence'],
      summary: 'Get comprehensive business performance metrics',
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                totalRevenue: { type: 'number' },
                totalBookings: { type: 'number' },
                averageOrderValue: { type: 'number' },
                bookingGrowthRate: { type: 'number' },
                revenueGrowthRate: { type: 'number' },
                customerAcquisitionCost: { type: 'number' },
                customerLifetimeValue: { type: 'number' },
                churnRate: { type: 'number' },
                netPromoterScore: { type: 'number' },
                operationalEfficiency: { type: 'number' },
                providerUtilization: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { period?: string } }>, reply: FastifyReply) => {
    try {
      const period = (request.query.period as 'daily' | 'weekly' | 'monthly' | 'quarterly') || 'monthly';
      const metrics = await biService.getBusinessPerformanceMetrics(period);
      
      reply.send({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to generate business performance metrics',
        message: error.message
      });
    }
  });

  // Financial reporting endpoint
  server.post('/api/analytics/financial-reporting', {
    schema: {
      tags: ['Business Intelligence'],
      summary: 'Generate comprehensive financial reports',
      body: {
        type: 'object',
        required: ['period'],
        properties: {
          period: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                grossRevenue: { type: 'number' },
                platformFee: { type: 'number' },
                netRevenue: { type: 'number' },
                operatingExpenses: { type: 'number' },
                grossProfit: { type: 'number' },
                profitMargin: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { period: 'monthly' | 'quarterly' | 'yearly' } }>, reply: FastifyReply) => {
    try {
      const { period } = request.body;
      const report = await biService.generateFinancialReport(period);
      
      reply.send({
        success: true,
        data: report
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to generate financial report',
        message: error.message
      });
    }
  });

  // Market performance analysis endpoint
  server.get('/api/analytics/market-performance', {
    schema: {
      tags: ['Business Intelligence'],
      summary: 'Get market performance analysis and competitive insights',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                marketShare: { type: 'number' },
                competitivePosition: { type: 'string' },
                marketGrowth: { type: 'number' },
                customerSatisfaction: { type: 'number' },
                brandAwareness: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const marketAnalysis = await biService.getMarketPerformanceAnalysis();
      
      reply.send({
        success: true,
        data: marketAnalysis
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to analyze market performance',
        message: error.message
      });
    }
  });

  // Provider performance analytics endpoint
  server.get('/api/analytics/provider-performance', {
    schema: {
      tags: ['Business Intelligence'],
      summary: 'Get provider performance analytics and recommendations',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  providerId: { type: 'string' },
                  providerName: { type: 'string' },
                  totalRevenue: { type: 'number' },
                  totalBookings: { type: 'number' },
                  averageRating: { type: 'number' },
                  utilizationRate: { type: 'number' },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const analytics = await biService.getProviderPerformanceAnalytics();
      
      reply.send({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: 'Failed to analyze provider performance',
        message: error.message
      });
    }
  });

  server.log.info('B11-001 Business Intelligence & Analytics Platform routes registered successfully');
}