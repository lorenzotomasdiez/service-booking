/**
 * Promotion Engine Service for BarberPro
 * Advanced discount and promotion system with time-based rules
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface PromotionRule {
  id: string;
  type: 'TIME_BASED' | 'QUANTITY_BASED' | 'USER_SEGMENT' | 'SERVICE_SPECIFIC' | 'BOOKING_VALUE';
  conditions: {
    // Time-based conditions
    dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    timeOfDay?: { start: string; end: string }; // "09:00" - "17:00"
    dateRange?: { start: Date; end: Date };
    
    // Quantity-based conditions
    minimumBookings?: number;
    maximumBookings?: number;
    bookingFrequency?: 'FIRST_TIME' | 'RETURNING' | 'LOYAL'; // >=5 bookings
    
    // User segment conditions
    userTypes?: ('NEW_CLIENT' | 'RETURNING_CLIENT' | 'VIP_CLIENT')[];
    ageRange?: { min: number; max: number };
    locationRadius?: { lat: number; lng: number; radiusKm: number };
    
    // Service-specific conditions
    serviceIds?: string[];
    serviceCategoryIds?: string[];
    minimumServiceDuration?: number;
    
    // Booking value conditions
    minimumAmount?: number;
    maximumAmount?: number;
  };
}

export interface PromotionAction {
  id: string;
  type: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'FREE_SERVICE' | 'LOYALTY_POINTS' | 'CASHBACK' | 'BUNDLE_DEAL';
  value: number;
  description: string;
  limitations?: {
    maxDiscountAmount?: number;
    applicableToServices?: string[];
    excludedServices?: string[];
    usageLimit?: number;
    perUserLimit?: number;
  };
}

export interface Promotion {
  id: string;
  providerId: string;
  name: string;
  description: string;
  code?: string;
  isActive: boolean;
  priority: number; // Higher numbers = higher priority
  rules: PromotionRule[];
  action: PromotionAction;
  analytics: {
    totalUsage: number;
    totalSavings: number;
    conversionRate: number;
    popularTimes: string[];
    topServices: string[];
  };
  budget?: {
    maxTotalDiscount: number;
    currentSpent: number;
    maxPerUser: number;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionApplication {
  id: string;
  promotionId: string;
  bookingId: string;
  userId: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  appliedAt: Date;
}

export interface PromotionEvaluation {
  eligible: boolean;
  promotion?: Promotion;
  discountAmount: number;
  finalAmount: number;
  reasons: string[];
  conditions: {
    timeMatch: boolean;
    segmentMatch: boolean;
    serviceMatch: boolean;
    valueMatch: boolean;
    usageWithinLimits: boolean;
  };
}

export class PromotionEngineService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Create a new promotion campaign
   */
  async createPromotion(data: {
    providerId: string;
    name: string;
    description: string;
    code?: string;
    rules: Omit<PromotionRule, 'id'>[];
    action: Omit<PromotionAction, 'id'>;
    schedule: {
      startDate: Date;
      endDate: Date;
      timezone?: string;
    };
    budget?: {
      maxTotalDiscount: number;
      maxPerUser: number;
    };
    priority?: number;
  }): Promise<Promotion> {
    const promotion: Promotion = {
      id: uuidv4(),
      providerId: data.providerId,
      name: data.name,
      description: data.description,
      code: data.code?.toUpperCase(),
      isActive: true,
      priority: data.priority || 0,
      rules: data.rules.map(rule => ({ ...rule, id: uuidv4() })),
      action: { ...data.action, id: uuidv4() },
      analytics: {
        totalUsage: 0,
        totalSavings: 0,
        conversionRate: 0,
        popularTimes: [],
        topServices: []
      },
      budget: data.budget ? {
        ...data.budget,
        currentSpent: 0
      } : undefined,
      schedule: {
        ...data.schedule,
        timezone: data.schedule.timezone || 'America/Argentina/Buenos_Aires'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database
    // await this.db.promotion.create({ data: promotion });

    console.log(`🎯 Created promotion "${promotion.name}" for provider ${data.providerId}`);
    
    return promotion;
  }

  /**
   * Evaluate if a booking is eligible for promotions
   */
  async evaluatePromotions(data: {
    providerId: string;
    userId: string;
    serviceIds: string[];
    bookingAmount: number;
    bookingTime: Date;
    promocode?: string;
  }): Promise<PromotionEvaluation[]> {
    try {
      // Get active promotions for the provider
      const promotions = await this.getActivePromotions(data.providerId);
      
      // Filter by promo code if provided
      const eligiblePromotions = data.promocode 
        ? promotions.filter(p => p.code === data.promocode.toUpperCase())
        : promotions;

      const evaluations: PromotionEvaluation[] = [];

      for (const promotion of eligiblePromotions) {
        const evaluation = await this.evaluatePromotion(promotion, data);
        evaluations.push(evaluation);
      }

      // Sort by priority and discount amount
      evaluations.sort((a, b) => {
        if (a.promotion && b.promotion) {
          if (a.promotion.priority !== b.promotion.priority) {
            return b.promotion.priority - a.promotion.priority;
          }
          return b.discountAmount - a.discountAmount;
        }
        return 0;
      });

      return evaluations;
    } catch (error: any) {
      console.error('Error evaluating promotions:', error.message);
      return [];
    }
  }

  /**
   * Apply the best available promotion to a booking
   */
  async applyBestPromotion(data: {
    providerId: string;
    userId: string;
    bookingId: string;
    serviceIds: string[];
    bookingAmount: number;
    bookingTime: Date;
    promocode?: string;
  }): Promise<{
    success: boolean;
    application?: PromotionApplication;
    savings: number;
    finalAmount: number;
  }> {
    try {
      const evaluations = await this.evaluatePromotions(data);
      
      // Find the best eligible promotion
      const bestPromotion = evaluations.find(e => e.eligible);
      
      if (!bestPromotion || !bestPromotion.promotion) {
        return {
          success: false,
          savings: 0,
          finalAmount: data.bookingAmount
        };
      }

      // Create promotion application
      const application: PromotionApplication = {
        id: uuidv4(),
        promotionId: bestPromotion.promotion.id,
        bookingId: data.bookingId,
        userId: data.userId,
        discountAmount: bestPromotion.discountAmount,
        originalAmount: data.bookingAmount,
        finalAmount: bestPromotion.finalAmount,
        appliedAt: new Date()
      };

      // Update promotion analytics and budget
      await this.updatePromotionUsage(bestPromotion.promotion, application);

      // Store application in database
      // await this.db.promotionApplication.create({ data: application });

      console.log(`💰 Applied promotion "${bestPromotion.promotion.name}" - Saved ARS ${application.discountAmount}`);

      return {
        success: true,
        application,
        savings: application.discountAmount,
        finalAmount: application.finalAmount
      };
    } catch (error: any) {
      console.error('Error applying promotion:', error.message);
      return {
        success: false,
        savings: 0,
        finalAmount: data.bookingAmount
      };
    }
  }

  /**
   * Create time-based promotions (Happy Hour, etc.)
   */
  async createTimeBasedPromotion(data: {
    providerId: string;
    name: string;
    discountPercent: number;
    days: number[]; // 0-6 (Sunday-Saturday)
    startTime: string; // "14:00"
    endTime: string; // "16:00"
    validUntil: Date;
    serviceIds?: string[];
  }): Promise<Promotion> {
    return this.createPromotion({
      providerId: data.providerId,
      name: data.name,
      description: `${data.discountPercent}% descuento en horarios específicos`,
      rules: [{
        type: 'TIME_BASED',
        conditions: {
          dayOfWeek: data.days,
          timeOfDay: {
            start: data.startTime,
            end: data.endTime
          },
          serviceIds: data.serviceIds
        }
      }],
      action: {
        type: 'PERCENTAGE_DISCOUNT',
        value: data.discountPercent,
        description: `${data.discountPercent}% de descuento`
      },
      schedule: {
        startDate: new Date(),
        endDate: data.validUntil
      }
    });
  }

  /**
   * Create first-time client promotions
   */
  async createNewClientPromotion(data: {
    providerId: string;
    discountPercent: number;
    maxDiscountAmount?: number;
    validUntil: Date;
  }): Promise<Promotion> {
    return this.createPromotion({
      providerId: data.providerId,
      name: 'Descuento Primer Cliente',
      description: `${data.discountPercent}% descuento para nuevos clientes`,
      rules: [{
        type: 'USER_SEGMENT',
        conditions: {
          userTypes: ['NEW_CLIENT'],
          bookingFrequency: 'FIRST_TIME'
        }
      }],
      action: {
        type: 'PERCENTAGE_DISCOUNT',
        value: data.discountPercent,
        description: `${data.discountPercent}% descuento para nuevos clientes`,
        limitations: {
          maxDiscountAmount: data.maxDiscountAmount,
          perUserLimit: 1
        }
      },
      schedule: {
        startDate: new Date(),
        endDate: data.validUntil
      }
    });
  }

  /**
   * Create loyalty promotions for returning clients
   */
  async createLoyaltyPromotion(data: {
    providerId: string;
    minimumBookings: number;
    rewardType: 'PERCENTAGE_DISCOUNT' | 'FREE_SERVICE' | 'LOYALTY_POINTS';
    rewardValue: number;
    validUntil: Date;
  }): Promise<Promotion> {
    return this.createPromotion({
      providerId: data.providerId,
      name: 'Programa de Fidelidad',
      description: `Recompensa para clientes con ${data.minimumBookings}+ reservas`,
      rules: [{
        type: 'QUANTITY_BASED',
        conditions: {
          minimumBookings: data.minimumBookings,
          bookingFrequency: 'LOYAL'
        }
      }],
      action: {
        type: data.rewardType,
        value: data.rewardValue,
        description: this.getRewardDescription(data.rewardType, data.rewardValue)
      },
      schedule: {
        startDate: new Date(),
        endDate: data.validUntil
      }
    });
  }

  /**
   * Get promotion analytics for a provider
   */
  async getPromotionAnalytics(providerId: string, dateRange?: {
    from: Date;
    to: Date;
  }) {
    const promotions = await this.getActivePromotions(providerId);
    
    const analytics = {
      totalPromotions: promotions.length,
      totalSavings: promotions.reduce((sum, p) => sum + p.analytics.totalSavings, 0),
      totalUsage: promotions.reduce((sum, p) => sum + p.analytics.totalUsage, 0),
      averageDiscount: 0,
      topPerformingPromotions: promotions
        .sort((a, b) => b.analytics.totalUsage - a.analytics.totalUsage)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          usage: p.analytics.totalUsage,
          savings: p.analytics.totalSavings,
          conversionRate: p.analytics.conversionRate
        })),
      timeDistribution: this.calculateTimeDistribution(promotions),
      serviceImpact: this.calculateServiceImpact(promotions)
    };

    analytics.averageDiscount = analytics.totalUsage > 0 
      ? analytics.totalSavings / analytics.totalUsage 
      : 0;

    return analytics;
  }

  // Private helper methods

  private async getActivePromotions(providerId: string): Promise<Promotion[]> {
    // Mock implementation - in production, this would query the database
    const now = new Date();
    
    return [
      {
        id: 'promo-1',
        providerId,
        name: 'Happy Hour',
        description: '20% descuento de 14:00 a 16:00',
        isActive: true,
        priority: 10,
        rules: [{
          id: 'rule-1',
          type: 'TIME_BASED',
          conditions: {
            dayOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
            timeOfDay: { start: '14:00', end: '16:00' }
          }
        }],
        action: {
          id: 'action-1',
          type: 'PERCENTAGE_DISCOUNT',
          value: 20,
          description: '20% de descuento'
        },
        analytics: {
          totalUsage: 45,
          totalSavings: 12500,
          conversionRate: 15.8,
          popularTimes: ['14:00', '15:00'],
          topServices: ['Corte de Cabello', 'Barba']
        },
        schedule: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          timezone: 'America/Argentina/Buenos_Aires'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private async evaluatePromotion(
    promotion: Promotion, 
    data: {
      userId: string;
      serviceIds: string[];
      bookingAmount: number;
      bookingTime: Date;
    }
  ): Promise<PromotionEvaluation> {
    const conditions = {
      timeMatch: true,
      segmentMatch: true,
      serviceMatch: true,
      valueMatch: true,
      usageWithinLimits: true
    };
    const reasons: string[] = [];

    // Check time-based conditions
    for (const rule of promotion.rules) {
      if (rule.type === 'TIME_BASED') {
        conditions.timeMatch = this.evaluateTimeConditions(rule.conditions, data.bookingTime);
        if (!conditions.timeMatch) {
          reasons.push('Fuera del horario de la promoción');
        }
      }
    }

    // Check budget limits
    if (promotion.budget && promotion.budget.currentSpent >= promotion.budget.maxTotalDiscount) {
      conditions.usageWithinLimits = false;
      reasons.push('Presupuesto de promoción agotado');
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.action.type === 'PERCENTAGE_DISCOUNT') {
      discountAmount = data.bookingAmount * (promotion.action.value / 100);
      if (promotion.action.limitations?.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, promotion.action.limitations.maxDiscountAmount);
      }
    } else if (promotion.action.type === 'FIXED_DISCOUNT') {
      discountAmount = promotion.action.value;
    }

    const finalAmount = Math.max(0, data.bookingAmount - discountAmount);
    
    const eligible = Object.values(conditions).every(condition => condition);

    return {
      eligible,
      promotion: eligible ? promotion : undefined,
      discountAmount: eligible ? discountAmount : 0,
      finalAmount: eligible ? finalAmount : data.bookingAmount,
      reasons,
      conditions
    };
  }

  private evaluateTimeConditions(conditions: PromotionRule['conditions'], bookingTime: Date): boolean {
    const now = bookingTime;
    
    // Check day of week
    if (conditions.dayOfWeek && !conditions.dayOfWeek.includes(now.getDay())) {
      return false;
    }
    
    // Check time of day
    if (conditions.timeOfDay) {
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
      if (currentTime < conditions.timeOfDay.start || currentTime > conditions.timeOfDay.end) {
        return false;
      }
    }
    
    // Check date range
    if (conditions.dateRange) {
      if (now < conditions.dateRange.start || now > conditions.dateRange.end) {
        return false;
      }
    }
    
    return true;
  }

  private async updatePromotionUsage(promotion: Promotion, application: PromotionApplication): Promise<void> {
    promotion.analytics.totalUsage++;
    promotion.analytics.totalSavings += application.discountAmount;
    
    if (promotion.budget) {
      promotion.budget.currentSpent += application.discountAmount;
    }
    
    promotion.updatedAt = new Date();
    
    // Update in database
    // await this.db.promotion.update({
    //   where: { id: promotion.id },
    //   data: { analytics: promotion.analytics, budget: promotion.budget, updatedAt: promotion.updatedAt }
    // });
  }

  private getRewardDescription(type: PromotionAction['type'], value: number): string {
    switch (type) {
      case 'PERCENTAGE_DISCOUNT':
        return `${value}% de descuento`;
      case 'FIXED_DISCOUNT':
        return `ARS ${value} de descuento`;
      case 'FREE_SERVICE':
        return 'Servicio gratuito';
      case 'LOYALTY_POINTS':
        return `${value} puntos de fidelidad`;
      default:
        return `Recompensa: ${value}`;
    }
  }

  private calculateTimeDistribution(promotions: Promotion[]) {
    // Mock implementation - would analyze usage patterns
    return {
      morning: 25,
      afternoon: 45,
      evening: 30
    };
  }

  private calculateServiceImpact(promotions: Promotion[]) {
    // Mock implementation - would analyze service usage with promotions
    return [
      { serviceName: 'Corte de Cabello', usage: 120, savings: 2400 },
      { serviceName: 'Barba', usage: 85, savings: 1700 },
      { serviceName: 'Combo', usage: 60, savings: 1800 }
    ];
  }
}

export const promotionEngine = new PromotionEngineService();