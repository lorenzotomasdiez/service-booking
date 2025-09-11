/**
 * Subscription Billing Service for BarberPro
 * Foundation for premium features and recurring billing
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'ARS';
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  features: {
    maxServices: number;
    maxBookingsPerMonth: number;
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    multiLocation: boolean;
    promotionalTools: boolean;
    prioritySupport: boolean;
    customDomain: boolean;
    whiteLabel: boolean;
  };
  trialPeriodDays: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  providerId: string;
  planId: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'PAUSED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelReason?: string;
  pausedAt?: Date;
  pauseReason?: string;
  billingEmail: string;
  paymentMethodId?: string;
  taxId?: string; // CUIT for Argentina
  metadata: {
    features: SubscriptionPlan['features'];
    usage: {
      servicesUsed: number;
      bookingsThisMonth: number;
      storageUsedMB: number;
      apiCallsThisMonth: number;
    };
    billing: {
      nextBillingDate: Date;
      lastPaymentDate?: Date;
      failedPaymentAttempts: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  providerId: string;
  number: string; // Invoice number
  amount: number;
  currency: 'ARS';
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  voidedAt?: Date;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethodId?: string;
  paymentIntentId?: string;
  afipData?: {
    cae: string; // Código de Autorización Electrónico
    caeExpiryDate: Date;
    documentType: string; // Factura A, B, C
    documentNumber: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  subscriptionId: string;
  providerId: string;
  metricName: string; // 'bookings', 'services', 'storage', 'api_calls'
  quantity: number;
  timestamp: Date;
  metadata?: any;
}

export class SubscriptionBillingService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    // Mock implementation - in production, these would be stored in database
    return [
      {
        id: 'plan-basic',
        name: 'Básico',
        description: 'Perfecto para emprender tu negocio',
        price: 2999,
        currency: 'ARS',
        billingCycle: 'MONTHLY',
        features: {
          maxServices: 10,
          maxBookingsPerMonth: 100,
          advancedAnalytics: false,
          customBranding: false,
          apiAccess: false,
          multiLocation: false,
          promotionalTools: false,
          prioritySupport: false,
          customDomain: false,
          whiteLabel: false
        },
        trialPeriodDays: 14,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'plan-professional',
        name: 'Profesional',
        description: 'Para barberos establecidos que buscan crecer',
        price: 5999,
        currency: 'ARS',
        billingCycle: 'MONTHLY',
        features: {
          maxServices: 50,
          maxBookingsPerMonth: 500,
          advancedAnalytics: true,
          customBranding: true,
          apiAccess: true,
          multiLocation: false,
          promotionalTools: true,
          prioritySupport: true,
          customDomain: false,
          whiteLabel: false
        },
        trialPeriodDays: 14,
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'plan-enterprise',
        name: 'Empresarial',
        description: 'Para cadenas de barberías y grandes negocios',
        price: 12999,
        currency: 'ARS',
        billingCycle: 'MONTHLY',
        features: {
          maxServices: -1, // unlimited
          maxBookingsPerMonth: -1, // unlimited
          advancedAnalytics: true,
          customBranding: true,
          apiAccess: true,
          multiLocation: true,
          promotionalTools: true,
          prioritySupport: true,
          customDomain: true,
          whiteLabel: true
        },
        trialPeriodDays: 30,
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Create a new subscription for a provider
   */
  async createSubscription(data: {
    providerId: string;
    planId: string;
    billingEmail: string;
    paymentMethodId?: string;
    taxId?: string;
    startTrial?: boolean;
  }): Promise<Subscription> {
    const plan = await this.getSubscriptionPlan(data.planId);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    const now = new Date();
    const isTrialing = data.startTrial && plan.trialPeriodDays > 0;
    
    let currentPeriodStart = now;
    let currentPeriodEnd = new Date(now);
    let trialStart: Date | undefined;
    let trialEnd: Date | undefined;

    if (isTrialing) {
      trialStart = now;
      trialEnd = new Date(now.getTime() + plan.trialPeriodDays * 24 * 60 * 60 * 1000);
      currentPeriodEnd = trialEnd;
    } else {
      // Set end date based on billing cycle
      switch (plan.billingCycle) {
        case 'MONTHLY':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          break;
        case 'QUARTERLY':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
          break;
        case 'YEARLY':
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          break;
      }
    }

    const subscription: Subscription = {
      id: uuidv4(),
      providerId: data.providerId,
      planId: data.planId,
      status: isTrialing ? 'TRIALING' : 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      billingEmail: data.billingEmail,
      paymentMethodId: data.paymentMethodId,
      taxId: data.taxId,
      metadata: {
        features: plan.features,
        usage: {
          servicesUsed: 0,
          bookingsThisMonth: 0,
          storageUsedMB: 0,
          apiCallsThisMonth: 0
        },
        billing: {
          nextBillingDate: currentPeriodEnd,
          failedPaymentAttempts: 0
        }
      },
      createdAt: now,
      updatedAt: now
    };

    // Store subscription in database
    // await this.db.subscription.create({ data: subscription });

    console.log(`🔄 Created subscription "${plan.name}" for provider ${data.providerId}`);
    
    // If not trialing, create first invoice
    if (!isTrialing) {
      await this.createInvoice(subscription, plan);
    }

    return subscription;
  }

  /**
   * Get subscription for a provider
   */
  async getProviderSubscription(providerId: string): Promise<Subscription | null> {
    // Mock implementation - in production, this would query the database
    return {
      id: 'sub-1',
      providerId,
      planId: 'plan-professional',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      billingEmail: 'barbero@example.com',
      taxId: '20123456789',
      metadata: {
        features: {
          maxServices: 50,
          maxBookingsPerMonth: 500,
          advancedAnalytics: true,
          customBranding: true,
          apiAccess: true,
          multiLocation: false,
          promotionalTools: true,
          prioritySupport: true,
          customDomain: false,
          whiteLabel: false
        },
        usage: {
          servicesUsed: 12,
          bookingsThisMonth: 87,
          storageUsedMB: 245,
          apiCallsThisMonth: 1240
        },
        billing: {
          nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          lastPaymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          failedPaymentAttempts: 0
        }
      },
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
  }

  /**
   * Check if provider has access to a feature
   */
  async hasFeatureAccess(providerId: string, feature: keyof SubscriptionPlan['features']): Promise<boolean> {
    const subscription = await this.getProviderSubscription(providerId);
    
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }

    return subscription.metadata.features[feature];
  }

  /**
   * Track usage for billing purposes
   */
  async recordUsage(data: {
    providerId: string;
    metricName: string;
    quantity: number;
    metadata?: any;
  }): Promise<UsageRecord> {
    const subscription = await this.getProviderSubscription(data.providerId);
    
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const usageRecord: UsageRecord = {
      id: uuidv4(),
      subscriptionId: subscription.id,
      providerId: data.providerId,
      metricName: data.metricName,
      quantity: data.quantity,
      timestamp: new Date(),
      metadata: data.metadata
    };

    // Update subscription usage
    switch (data.metricName) {
      case 'bookings':
        subscription.metadata.usage.bookingsThisMonth += data.quantity;
        break;
      case 'services':
        subscription.metadata.usage.servicesUsed += data.quantity;
        break;
      case 'storage':
        subscription.metadata.usage.storageUsedMB += data.quantity;
        break;
      case 'api_calls':
        subscription.metadata.usage.apiCallsThisMonth += data.quantity;
        break;
    }

    // Store usage record and update subscription
    // await this.db.usageRecord.create({ data: usageRecord });
    // await this.db.subscription.update({
    //   where: { id: subscription.id },
    //   data: { metadata: subscription.metadata }
    // });

    return usageRecord;
  }

  /**
   * Check usage limits and restrictions
   */
  async checkUsageLimits(providerId: string): Promise<{
    withinLimits: boolean;
    warnings: string[];
    restrictions: string[];
    usage: Subscription['metadata']['usage'];
    limits: SubscriptionPlan['features'];
  }> {
    const subscription = await this.getProviderSubscription(providerId);
    
    if (!subscription) {
      return {
        withinLimits: false,
        warnings: [],
        restrictions: ['No active subscription'],
        usage: {
          servicesUsed: 0,
          bookingsThisMonth: 0,
          storageUsedMB: 0,
          apiCallsThisMonth: 0
        },
        limits: {} as SubscriptionPlan['features']
      };
    }

    const usage = subscription.metadata.usage;
    const limits = subscription.metadata.features;
    const warnings: string[] = [];
    const restrictions: string[] = [];

    // Check booking limits
    if (limits.maxBookingsPerMonth > 0) {
      const bookingUsagePercent = (usage.bookingsThisMonth / limits.maxBookingsPerMonth) * 100;
      
      if (bookingUsagePercent >= 100) {
        restrictions.push('Límite mensual de reservas alcanzado');
      } else if (bookingUsagePercent >= 80) {
        warnings.push(`80% del límite de reservas mensuales usado (${usage.bookingsThisMonth}/${limits.maxBookingsPerMonth})`);
      }
    }

    // Check service limits
    if (limits.maxServices > 0 && usage.servicesUsed >= limits.maxServices) {
      restrictions.push('Límite máximo de servicios alcanzado');
    }

    const withinLimits = restrictions.length === 0;

    return {
      withinLimits,
      warnings,
      restrictions,
      usage,
      limits
    };
  }

  /**
   * Create subscription invoice
   */
  async createInvoice(subscription: Subscription, plan: SubscriptionPlan): Promise<SubscriptionInvoice> {
    const invoiceNumber = this.generateInvoiceNumber();
    
    const lineItems = [{
      description: `${plan.name} - ${this.formatBillingPeriod(plan.billingCycle)}`,
      quantity: 1,
      unitPrice: plan.price,
      amount: plan.price,
      taxRate: 21, // IVA Argentina
      taxAmount: plan.price * 0.21
    }];

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const total = subtotal + tax;

    const invoice: SubscriptionInvoice = {
      id: uuidv4(),
      subscriptionId: subscription.id,
      providerId: subscription.providerId,
      number: invoiceNumber,
      amount: total,
      currency: 'ARS',
      status: 'OPEN',
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to pay
      lineItems,
      subtotal,
      tax,
      total,
      paymentMethodId: subscription.paymentMethodId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store invoice in database
    // await this.db.subscriptionInvoice.create({ data: invoice });

    console.log(`📄 Created invoice ${invoiceNumber} for ARS ${total}`);
    
    return invoice;
  }

  /**
   * Process subscription renewal
   */
  async processRenewal(subscriptionId: string): Promise<{
    success: boolean;
    subscription?: Subscription;
    invoice?: SubscriptionInvoice;
    error?: string;
  }> {
    try {
      const subscription = await this.getSubscriptionById(subscriptionId);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return { success: false, error: 'Subscription plan not found' };
      }

      // Update subscription period
      const now = new Date();
      subscription.currentPeriodStart = subscription.currentPeriodEnd;
      
      switch (plan.billingCycle) {
        case 'MONTHLY':
          subscription.currentPeriodEnd.setMonth(subscription.currentPeriodEnd.getMonth() + 1);
          break;
        case 'QUARTERLY':
          subscription.currentPeriodEnd.setMonth(subscription.currentPeriodEnd.getMonth() + 3);
          break;
        case 'YEARLY':
          subscription.currentPeriodEnd.setFullYear(subscription.currentPeriodEnd.getFullYear() + 1);
          break;
      }

      // Reset monthly usage counters
      subscription.metadata.usage.bookingsThisMonth = 0;
      subscription.metadata.usage.apiCallsThisMonth = 0;
      subscription.metadata.billing.nextBillingDate = subscription.currentPeriodEnd;
      subscription.metadata.billing.lastPaymentDate = now;
      subscription.updatedAt = now;

      // Create renewal invoice
      const invoice = await this.createInvoice(subscription, plan);

      console.log(`🔄 Renewed subscription ${subscriptionId} until ${subscription.currentPeriodEnd.toISOString().split('T')[0]}`);

      return { success: true, subscription, invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    reason?: string,
    cancelImmediately: boolean = false
  ): Promise<Subscription> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = 'CANCELED';
    subscription.canceledAt = new Date();
    subscription.cancelReason = reason;
    subscription.updatedAt = new Date();

    if (cancelImmediately) {
      subscription.currentPeriodEnd = new Date();
    }

    console.log(`❌ Canceled subscription ${subscriptionId}${reason ? ` (${reason})` : ''}`);
    
    return subscription;
  }

  // Private helper methods

  private async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    const plans = await this.getSubscriptionPlans();
    return plans.find(p => p.id === planId) || null;
  }

  private async getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
    // Mock implementation - in production, this would query the database
    return {
      id: subscriptionId,
      providerId: 'provider-1',
      planId: 'plan-professional',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      billingEmail: 'barbero@example.com',
      metadata: {
        features: {} as SubscriptionPlan['features'],
        usage: {
          servicesUsed: 12,
          bookingsThisMonth: 87,
          storageUsedMB: 245,
          apiCallsThisMonth: 1240
        },
        billing: {
          nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          failedPaymentAttempts: 0
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  private formatBillingPeriod(cycle: SubscriptionPlan['billingCycle']): string {
    switch (cycle) {
      case 'MONTHLY':
        return 'Mensual';
      case 'QUARTERLY':
        return 'Trimestral';
      case 'YEARLY':
        return 'Anual';
    }
  }
}

export const subscriptionBilling = new SubscriptionBillingService();