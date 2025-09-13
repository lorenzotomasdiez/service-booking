/**
 * PAY9-001: Day 9 Advanced Subscription & Billing Systems
 * Enterprise-grade subscription management with complex billing logic
 * Multi-tier subscriptions with family plans and corporate billing
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import paymentConfig from '../config/payment';
import MercadoPagoPaymentService from './payment';
import { subscriptionBilling, SubscriptionPlan, Subscription } from './subscription-billing';

export interface AdvancedSubscriptionTier {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  features: SubscriptionFeatureSet;
  limits: SubscriptionLimits;
  billingOptions: BillingCycleConfig[];
  targetAudience: 'individual' | 'small_business' | 'enterprise' | 'family';
  discountStructure: DiscountStructure;
  addOns: SubscriptionAddOn[];
  autoScaling: AutoScalingConfig;
}

export interface SubscriptionFeatureSet {
  // Core Features
  maxProviders: number;
  maxServices: number;
  maxBookingsPerMonth: number;
  maxClients: number;
  
  // Advanced Features
  advancedAnalytics: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  
  // Multi-location Support
  multiLocation: boolean;
  maxLocations: number;
  locationSyncEnabled: boolean;
  
  // Payment Features
  advancedPaymentMethods: boolean;
  customCommissionRates: boolean;
  priorityPaymentSupport: boolean;
  
  // Business Features
  inventoryManagement: boolean;
  staffManagement: boolean;
  marketingTools: boolean;
  loyaltyPrograms: boolean;
  
  // Support & Training
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
  trainingPrograms: boolean;
  
  // Integration & Automation
  webhookAccess: boolean;
  automationRules: boolean;
  thirdPartyIntegrations: string[];
  
  // Argentina-Specific
  afipIntegration: boolean;
  argentinaReporting: boolean;
  localPaymentMethods: boolean;
}

export interface SubscriptionLimits {
  storage: {
    maxStorageGB: number;
    maxFileSize: number;
    maxUploadsPerMonth: number;
  };
  api: {
    maxApiCallsPerMonth: number;
    rateLimitPerMinute: number;
  };
  communications: {
    maxEmailsPerMonth: number;
    maxSmsPerMonth: number;
    maxWhatsAppPerMonth: number;
  };
  analytics: {
    dataRetentionMonths: number;
    exportFrequency: string;
    customReportsPerMonth: number;
  };
}

export interface BillingCycleConfig {
  cycle: 'monthly' | 'quarterly' | 'biannually' | 'annually';
  discountPercentage: number;
  price: number;
  trialDays: number;
  setupFee?: number;
}

export interface DiscountStructure {
  volumeDiscounts: Array<{
    minimumProviders: number;
    discountPercentage: number;
  }>;
  loyaltyDiscounts: Array<{
    monthsSubscribed: number;
    discountPercentage: number;
  }>;
  familyPlanDiscount: number;
  corporateDiscount: number;
  studentDiscount: number;
  earlyAdopterDiscount: number;
}

export interface SubscriptionAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'one_time' | 'usage_based';
  category: 'storage' | 'api' | 'communication' | 'feature' | 'support';
  limits?: Record<string, number>;
}

export interface AutoScalingConfig {
  enabled: boolean;
  triggers: Array<{
    metric: string;
    threshold: number;
    action: 'upgrade_tier' | 'add_addon' | 'notify_user';
  }>;
  notifications: {
    approaching_limit: boolean;
    auto_scaling_performed: boolean;
  };
}

export interface FamilyPlan {
  id: string;
  name: string;
  description: string;
  masterAccountId: string;
  memberAccounts: string[];
  maxMembers: number;
  sharedFeatures: string[];
  individualFeatures: string[];
  billingStructure: {
    masterPays: boolean;
    splitBilling: boolean;
    individualLimits: boolean;
  };
  parentalControls: {
    enabled: boolean;
    approvalRequired: string[];
    spendingLimits: Record<string, number>;
  };
}

export interface CorporateSubscription {
  id: string;
  companyName: string;
  companyTaxId: string;
  billingContact: {
    name: string;
    email: string;
    phone: string;
    department: string;
  };
  subscriptionTiers: Array<{
    tierId: string;
    quantity: number;
    assignedTo: string[];
  }>;
  enterpriseFeatures: {
    singleSignOn: boolean;
    ldapIntegration: boolean;
    customIntegrations: boolean;
    dedicatedSupport: boolean;
    serviceLevel: 'standard' | 'premium' | 'enterprise';
  };
  billing: {
    invoiceFrequency: 'monthly' | 'quarterly' | 'annually';
    paymentTerms: number; // days
    purchaseOrderRequired: boolean;
    customInvoicing: boolean;
  };
}

export interface ProrationCalculation {
  oldPlan: {
    id: string;
    price: number;
    unusedDays: number;
    credit: number;
  };
  newPlan: {
    id: string;
    price: number;
    remainingDays: number;
    charge: number;
  };
  adjustment: {
    type: 'credit' | 'charge' | 'none';
    amount: number;
    description: string;
  };
  nextBillingDate: Date;
  prorationPolicy: string;
}

export interface SubscriptionAnalytics {
  metrics: {
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    customerLifetimeValue: number;
    churnRate: number;
    subscriptionGrowthRate: number;
  };
  cohortAnalysis: {
    retentionRates: Record<string, number>;
    revenueGrowth: Record<string, number>;
    upgradePaths: Record<string, number>;
  };
  predictiveInsights: {
    churnPrediction: Array<{
      subscriptionId: string;
      riskScore: number;
      factors: string[];
    }>;
    upgradeOpportunities: Array<{
      subscriptionId: string;
      recommendedTier: string;
      reasoning: string[];
    }>;
  };
}

export class AdvancedSubscriptionBillingService extends EventEmitter {
  private prisma: PrismaClient;
  private paymentService: MercadoPagoPaymentService;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.paymentService = new MercadoPagoPaymentService(prisma);
  }

  /**
   * Get advanced subscription tiers with complex features
   */
  async getAdvancedSubscriptionTiers(): Promise<AdvancedSubscriptionTier[]> {
    console.log('📋 Getting advanced subscription tiers for Day 9...');

    return [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfecto para barberos independientes comenzando',
        basePrice: 1999,
        features: {
          maxProviders: 1,
          maxServices: 10,
          maxBookingsPerMonth: 50,
          maxClients: 200,
          advancedAnalytics: false,
          customBranding: false,
          whiteLabel: false,
          apiAccess: false,
          multiLocation: false,
          maxLocations: 1,
          locationSyncEnabled: false,
          advancedPaymentMethods: false,
          customCommissionRates: false,
          priorityPaymentSupport: false,
          inventoryManagement: false,
          staffManagement: false,
          marketingTools: false,
          loyaltyPrograms: false,
          prioritySupport: false,
          dedicatedAccountManager: false,
          trainingPrograms: false,
          webhookAccess: false,
          automationRules: false,
          thirdPartyIntegrations: [],
          afipIntegration: true,
          argentinaReporting: true,
          localPaymentMethods: true,
        },
        limits: {
          storage: { maxStorageGB: 1, maxFileSize: 5, maxUploadsPerMonth: 100 },
          api: { maxApiCallsPerMonth: 1000, rateLimitPerMinute: 10 },
          communications: { maxEmailsPerMonth: 100, maxSmsPerMonth: 50, maxWhatsAppPerMonth: 200 },
          analytics: { dataRetentionMonths: 6, exportFrequency: 'monthly', customReportsPerMonth: 2 },
        },
        billingOptions: [
          { cycle: 'monthly', discountPercentage: 0, price: 1999, trialDays: 14 },
          { cycle: 'annually', discountPercentage: 15, price: 20389, trialDays: 30 },
        ],
        targetAudience: 'individual',
        discountStructure: {
          volumeDiscounts: [],
          loyaltyDiscounts: [
            { monthsSubscribed: 6, discountPercentage: 5 },
            { monthsSubscribed: 12, discountPercentage: 10 },
          ],
          familyPlanDiscount: 0,
          corporateDiscount: 0,
          studentDiscount: 20,
          earlyAdopterDiscount: 25,
        },
        addOns: [],
        autoScaling: {
          enabled: true,
          triggers: [
            { metric: 'bookingsPerMonth', threshold: 45, action: 'notify_user' },
          ],
          notifications: { approaching_limit: true, auto_scaling_performed: false },
        },
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Para barberos establecidos que buscan crecer',
        basePrice: 4999,
        features: {
          maxProviders: 3,
          maxServices: 50,
          maxBookingsPerMonth: 300,
          maxClients: 1000,
          advancedAnalytics: true,
          customBranding: true,
          whiteLabel: false,
          apiAccess: true,
          multiLocation: true,
          maxLocations: 3,
          locationSyncEnabled: true,
          advancedPaymentMethods: true,
          customCommissionRates: true,
          priorityPaymentSupport: true,
          inventoryManagement: true,
          staffManagement: true,
          marketingTools: true,
          loyaltyPrograms: true,
          prioritySupport: true,
          dedicatedAccountManager: false,
          trainingPrograms: true,
          webhookAccess: true,
          automationRules: true,
          thirdPartyIntegrations: ['WhatsApp', 'Instagram', 'Facebook'],
          afipIntegration: true,
          argentinaReporting: true,
          localPaymentMethods: true,
        },
        limits: {
          storage: { maxStorageGB: 10, maxFileSize: 25, maxUploadsPerMonth: 500 },
          api: { maxApiCallsPerMonth: 10000, rateLimitPerMinute: 50 },
          communications: { maxEmailsPerMonth: 500, maxSmsPerMonth: 300, maxWhatsAppPerMonth: 1000 },
          analytics: { dataRetentionMonths: 24, exportFrequency: 'weekly', customReportsPerMonth: 10 },
        },
        billingOptions: [
          { cycle: 'monthly', discountPercentage: 0, price: 4999, trialDays: 14 },
          { cycle: 'quarterly', discountPercentage: 10, price: 13497, trialDays: 14 },
          { cycle: 'annually', discountPercentage: 20, price: 47992, trialDays: 30 },
        ],
        targetAudience: 'small_business',
        discountStructure: {
          volumeDiscounts: [
            { minimumProviders: 2, discountPercentage: 10 },
            { minimumProviders: 5, discountPercentage: 15 },
          ],
          loyaltyDiscounts: [
            { monthsSubscribed: 6, discountPercentage: 5 },
            { monthsSubscribed: 12, discountPercentage: 10 },
            { monthsSubscribed: 24, discountPercentage: 15 },
          ],
          familyPlanDiscount: 20,
          corporateDiscount: 15,
          studentDiscount: 30,
          earlyAdopterDiscount: 35,
        },
        addOns: [
          {
            id: 'extra_storage',
            name: 'Almacenamiento Extra',
            description: '10GB adicionales de almacenamiento',
            price: 299,
            billingCycle: 'monthly',
            category: 'storage',
            limits: { storage: 10 },
          },
          {
            id: 'premium_analytics',
            name: 'Analytics Premium',
            description: 'Reportes avanzados y predicciones',
            price: 799,
            billingCycle: 'monthly',
            category: 'feature',
          },
        ],
        autoScaling: {
          enabled: true,
          triggers: [
            { metric: 'bookingsPerMonth', threshold: 280, action: 'notify_user' },
            { metric: 'providers', threshold: 3, action: 'upgrade_tier' },
          ],
          notifications: { approaching_limit: true, auto_scaling_performed: true },
        },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Para cadenas de barberías y grandes empresas',
        basePrice: 12999,
        features: {
          maxProviders: -1,
          maxServices: -1,
          maxBookingsPerMonth: -1,
          maxClients: -1,
          advancedAnalytics: true,
          customBranding: true,
          whiteLabel: true,
          apiAccess: true,
          multiLocation: true,
          maxLocations: -1,
          locationSyncEnabled: true,
          advancedPaymentMethods: true,
          customCommissionRates: true,
          priorityPaymentSupport: true,
          inventoryManagement: true,
          staffManagement: true,
          marketingTools: true,
          loyaltyPrograms: true,
          prioritySupport: true,
          dedicatedAccountManager: true,
          trainingPrograms: true,
          webhookAccess: true,
          automationRules: true,
          thirdPartyIntegrations: ['All Available'],
          afipIntegration: true,
          argentinaReporting: true,
          localPaymentMethods: true,
        },
        limits: {
          storage: { maxStorageGB: -1, maxFileSize: 100, maxUploadsPerMonth: -1 },
          api: { maxApiCallsPerMonth: -1, rateLimitPerMinute: 1000 },
          communications: { maxEmailsPerMonth: -1, maxSmsPerMonth: -1, maxWhatsAppPerMonth: -1 },
          analytics: { dataRetentionMonths: -1, exportFrequency: 'real_time', customReportsPerMonth: -1 },
        },
        billingOptions: [
          { cycle: 'monthly', discountPercentage: 0, price: 12999, trialDays: 30 },
          { cycle: 'quarterly', discountPercentage: 15, price: 33147, trialDays: 30 },
          { cycle: 'annually', discountPercentage: 25, price: 116991, trialDays: 60, setupFee: 0 },
        ],
        targetAudience: 'enterprise',
        discountStructure: {
          volumeDiscounts: [
            { minimumProviders: 10, discountPercentage: 15 },
            { minimumProviders: 25, discountPercentage: 20 },
            { minimumProviders: 50, discountPercentage: 25 },
          ],
          loyaltyDiscounts: [
            { monthsSubscribed: 6, discountPercentage: 5 },
            { monthsSubscribed: 12, discountPercentage: 10 },
            { monthsSubscribed: 24, discountPercentage: 15 },
            { monthsSubscribed: 36, discountPercentage: 20 },
          ],
          familyPlanDiscount: 0,
          corporateDiscount: 25,
          studentDiscount: 0,
          earlyAdopterDiscount: 40,
        },
        addOns: [
          {
            id: 'custom_integration',
            name: 'Integración Personalizada',
            description: 'Desarrollo de integración personalizada',
            price: 25000,
            billingCycle: 'one_time',
            category: 'feature',
          },
          {
            id: 'dedicated_support',
            name: 'Soporte Dedicado 24/7',
            description: 'Soporte técnico dedicado las 24 horas',
            price: 2999,
            billingCycle: 'monthly',
            category: 'support',
          },
        ],
        autoScaling: {
          enabled: false,
          triggers: [],
          notifications: { approaching_limit: false, auto_scaling_performed: false },
        },
      },
      {
        id: 'family',
        name: 'Family Plan',
        description: 'Plan familiar para múltiples miembros de la familia',
        basePrice: 3499,
        features: {
          maxProviders: 5,
          maxServices: 25,
          maxBookingsPerMonth: 150,
          maxClients: 500,
          advancedAnalytics: false,
          customBranding: false,
          whiteLabel: false,
          apiAccess: false,
          multiLocation: false,
          maxLocations: 1,
          locationSyncEnabled: false,
          advancedPaymentMethods: true,
          customCommissionRates: false,
          priorityPaymentSupport: false,
          inventoryManagement: false,
          staffManagement: false,
          marketingTools: false,
          loyaltyPrograms: true,
          prioritySupport: false,
          dedicatedAccountManager: false,
          trainingPrograms: false,
          webhookAccess: false,
          automationRules: false,
          thirdPartyIntegrations: ['WhatsApp'],
          afipIntegration: true,
          argentinaReporting: true,
          localPaymentMethods: true,
        },
        limits: {
          storage: { maxStorageGB: 5, maxFileSize: 10, maxUploadsPerMonth: 250 },
          api: { maxApiCallsPerMonth: 2500, rateLimitPerMinute: 20 },
          communications: { maxEmailsPerMonth: 250, maxSmsPerMonth: 150, maxWhatsAppPerMonth: 500 },
          analytics: { dataRetentionMonths: 12, exportFrequency: 'monthly', customReportsPerMonth: 5 },
        },
        billingOptions: [
          { cycle: 'monthly', discountPercentage: 0, price: 3499, trialDays: 14 },
          { cycle: 'annually', discountPercentage: 20, price: 33590, trialDays: 30 },
        ],
        targetAudience: 'family',
        discountStructure: {
          volumeDiscounts: [],
          loyaltyDiscounts: [
            { monthsSubscribed: 12, discountPercentage: 10 },
          ],
          familyPlanDiscount: 0,
          corporateDiscount: 0,
          studentDiscount: 15,
          earlyAdopterDiscount: 30,
        },
        addOns: [
          {
            id: 'extra_family_member',
            name: 'Miembro Familiar Extra',
            description: 'Agregar un miembro adicional al plan familiar',
            price: 699,
            billingCycle: 'monthly',
            category: 'feature',
          },
        ],
        autoScaling: {
          enabled: true,
          triggers: [
            { metric: 'familyMembers', threshold: 5, action: 'add_addon' },
          ],
          notifications: { approaching_limit: true, auto_scaling_performed: false },
        },
      },
    ];
  }

  /**
   * Calculate complex proration for subscription changes
   */
  async calculateProration(
    currentSubscriptionId: string,
    newTierId: string,
    newBillingCycle: string
  ): Promise<ProrationCalculation> {
    console.log('🧮 Calculating complex proration for subscription change...');

    try {
      // Get current subscription
      const currentSubscription = await subscriptionBilling.getProviderSubscription('provider-id');
      if (!currentSubscription) {
        throw new Error('Current subscription not found');
      }

      // Get current and new plans
      const tiers = await this.getAdvancedSubscriptionTiers();
      const newTier = tiers.find(t => t.id === newTierId);
      if (!newTier) {
        throw new Error('New subscription tier not found');
      }

      // Find current plan price
      const currentTier = tiers.find(t => t.id === currentSubscription.planId);
      if (!currentTier) {
        throw new Error('Current subscription tier not found');
      }

      const now = new Date();
      const periodEnd = currentSubscription.currentPeriodEnd;
      const totalPeriodDays = Math.ceil(
        (periodEnd.getTime() - currentSubscription.currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const unusedDays = Math.max(0, remainingDays);

      // Get new plan pricing for selected billing cycle
      const newBillingOption = newTier.billingOptions.find(opt => opt.cycle === newBillingCycle);
      if (!newBillingOption) {
        throw new Error('Billing cycle not available for new tier');
      }

      // Calculate old plan credit
      const oldPlanDailyRate = currentTier.basePrice / 30; // Assume monthly base
      const credit = oldPlanDailyRate * unusedDays;

      // Calculate new plan charge for remaining period
      const newPlanDailyRate = newBillingOption.price / (newBillingCycle === 'annually' ? 365 : 30);
      const newPlanCharge = newPlanDailyRate * remainingDays;

      // Calculate adjustment
      const adjustmentAmount = newPlanCharge - credit;
      const adjustment = {
        type: adjustmentAmount > 0 ? 'charge' : adjustmentAmount < 0 ? 'credit' : 'none' as const,
        amount: Math.abs(adjustmentAmount),
        description: adjustmentAmount > 0 
          ? `Cargo adicional por upgrade a ${newTier.name}`
          : adjustmentAmount < 0
          ? `Crédito por downgrade a ${newTier.name}`
          : 'Sin ajustes necesarios',
      };

      // Calculate next billing date
      const nextBillingDate = new Date(now);
      switch (newBillingCycle) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'annually':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }

      const proration: ProrationCalculation = {
        oldPlan: {
          id: currentSubscription.planId,
          price: currentTier.basePrice,
          unusedDays,
          credit,
        },
        newPlan: {
          id: newTierId,
          price: newBillingOption.price,
          remainingDays,
          charge: newPlanCharge,
        },
        adjustment,
        nextBillingDate,
        prorationPolicy: 'Prorrateamos el tiempo no utilizado del plan actual y cobramos proporcionalmente el nuevo plan.',
      };

      console.log(`✅ Proration calculated: ${adjustment.type} ARS ${adjustment.amount.toFixed(2)}`);
      
      return proration;
    } catch (error: any) {
      console.error('❌ Error calculating proration:', error);
      throw new Error(`Failed to calculate proration: ${error.message}`);
    }
  }

  /**
   * Create family plan subscription with multiple members
   */
  async createFamilyPlan(data: {
    masterAccountId: string;
    memberEmails: string[];
    billingEmail: string;
    paymentMethodId?: string;
  }): Promise<{
    familyPlan: FamilyPlan;
    subscriptions: Subscription[];
    totalCost: number;
  }> {
    console.log(`👨‍👩‍👧‍👦 Creating family plan for ${data.memberEmails.length} members...`);

    try {
      const familyTier = (await this.getAdvancedSubscriptionTiers()).find(t => t.id === 'family');
      if (!familyTier) {
        throw new Error('Family plan not available');
      }

      // Validate member count
      if (data.memberEmails.length > familyTier.features.maxProviders) {
        throw new Error(`Family plan supports maximum ${familyTier.features.maxProviders} members`);
      }

      // Create family plan structure
      const familyPlan: FamilyPlan = {
        id: uuidv4(),
        name: 'Plan Familiar BarberPro',
        description: `Plan familiar para ${data.memberEmails.length} miembros`,
        masterAccountId: data.masterAccountId,
        memberAccounts: data.memberEmails,
        maxMembers: familyTier.features.maxProviders,
        sharedFeatures: [
          'loyalty_points',
          'family_calendar',
          'shared_bookings',
          'payment_methods',
        ],
        individualFeatures: [
          'personal_preferences',
          'booking_history',
          'service_favorites',
        ],
        billingStructure: {
          masterPays: true,
          splitBilling: false,
          individualLimits: false,
        },
        parentalControls: {
          enabled: true,
          approvalRequired: ['high_value_bookings'],
          spendingLimits: {
            monthly_per_member: 5000,
            single_booking_limit: 2000,
          },
        },
      };

      // Create subscriptions for each member
      const subscriptions: Subscription[] = [];
      let totalCost = familyTier.basePrice;

      // Master subscription
      const masterSubscription = await subscriptionBilling.createSubscription({
        providerId: data.masterAccountId,
        planId: 'family',
        billingEmail: data.billingEmail,
        paymentMethodId: data.paymentMethodId,
      });
      subscriptions.push(masterSubscription);

      // Member subscriptions (free under family plan)
      for (const memberEmail of data.memberEmails) {
        if (memberEmail === data.billingEmail) continue; // Skip master account

        const memberSubscription = await subscriptionBilling.createSubscription({
          providerId: `member-${uuidv4()}`,
          planId: 'family',
          billingEmail: memberEmail,
          startTrial: false,
        });
        subscriptions.push(memberSubscription);
      }

      console.log(`✅ Family plan created with ${subscriptions.length} subscriptions`);
      console.log(`💰 Total monthly cost: ARS ${totalCost}`);

      return {
        familyPlan,
        subscriptions,
        totalCost,
      };
    } catch (error: any) {
      console.error('❌ Error creating family plan:', error);
      throw new Error(`Failed to create family plan: ${error.message}`);
    }
  }

  /**
   * Create corporate subscription with enterprise features
   */
  async createCorporateSubscription(data: {
    companyName: string;
    companyTaxId: string;
    billingContact: CorporateSubscription['billingContact'];
    tierRequirements: Array<{
      tierId: string;
      quantity: number;
      assignedTo: string[];
    }>;
    enterpriseFeatures: CorporateSubscription['enterpriseFeatures'];
  }): Promise<{
    corporateSubscription: CorporateSubscription;
    subscriptions: Subscription[];
    estimatedMonthlyCost: number;
  }> {
    console.log(`🏢 Creating corporate subscription for ${data.companyName}...`);

    try {
      const tiers = await this.getAdvancedSubscriptionTiers();
      const subscriptions: Subscription[] = [];
      let totalMonthlyCost = 0;

      // Create corporate subscription structure
      const corporateSubscription: CorporateSubscription = {
        id: uuidv4(),
        companyName: data.companyName,
        companyTaxId: data.companyTaxId,
        billingContact: data.billingContact,
        subscriptionTiers: data.tierRequirements,
        enterpriseFeatures: data.enterpriseFeatures,
        billing: {
          invoiceFrequency: 'monthly',
          paymentTerms: 30,
          purchaseOrderRequired: true,
          customInvoicing: true,
        },
      };

      // Create subscriptions for each tier requirement
      for (const requirement of data.tierRequirements) {
        const tier = tiers.find(t => t.id === requirement.tierId);
        if (!tier) {
          throw new Error(`Tier ${requirement.tierId} not found`);
        }

        // Apply corporate discount
        const basePrice = tier.basePrice;
        const corporateDiscount = tier.discountStructure.corporateDiscount;
        const discountedPrice = basePrice * (1 - corporateDiscount / 100);

        for (let i = 0; i < requirement.quantity; i++) {
          const assignedUser = requirement.assignedTo[i] || `user-${i + 1}`;
          
          const subscription = await subscriptionBilling.createSubscription({
            providerId: assignedUser,
            planId: requirement.tierId,
            billingEmail: data.billingContact.email,
          });

          subscriptions.push(subscription);
          totalMonthlyCost += discountedPrice;
        }
      }

      // Apply volume discounts
      const totalUsers = data.tierRequirements.reduce((sum, req) => sum + req.quantity, 0);
      const enterpriseTier = tiers.find(t => t.id === 'enterprise');
      if (enterpriseTier && totalUsers >= 10) {
        const volumeDiscount = enterpriseTier.discountStructure.volumeDiscounts.find(
          d => totalUsers >= d.minimumProviders
        );
        if (volumeDiscount) {
          totalMonthlyCost *= (1 - volumeDiscount.discountPercentage / 100);
        }
      }

      console.log(`✅ Corporate subscription created for ${data.companyName}`);
      console.log(`👥 Total users: ${totalUsers}`);
      console.log(`💰 Estimated monthly cost: ARS ${totalMonthlyCost.toFixed(2)}`);

      return {
        corporateSubscription,
        subscriptions,
        estimatedMonthlyCost: totalMonthlyCost,
      };
    } catch (error: any) {
      console.error('❌ Error creating corporate subscription:', error);
      throw new Error(`Failed to create corporate subscription: ${error.message}`);
    }
  }

  /**
   * Advanced subscription analytics with predictive insights
   */
  async getSubscriptionAnalytics(dateRange?: { from: Date; to: Date }): Promise<SubscriptionAnalytics> {
    console.log('📊 Generating advanced subscription analytics...');

    try {
      // Mock implementation - in production would query actual data
      const analytics: SubscriptionAnalytics = {
        metrics: {
          monthlyRecurringRevenue: 285600,
          annualRecurringRevenue: 3427200,
          customerLifetimeValue: 18400,
          churnRate: 3.2,
          subscriptionGrowthRate: 24.8,
        },
        cohortAnalysis: {
          retentionRates: {
            month_1: 94.2,
            month_3: 87.5,
            month_6: 79.3,
            month_12: 72.1,
            month_24: 65.8,
          },
          revenueGrowth: {
            quarter_1: 28.4,
            quarter_2: 32.1,
            quarter_3: 29.7,
            quarter_4: 35.2,
          },
          upgradePaths: {
            starter_to_professional: 18.5,
            professional_to_enterprise: 12.3,
            family_to_professional: 8.7,
          },
        },
        predictiveInsights: {
          churnPrediction: [
            {
              subscriptionId: 'sub-001',
              riskScore: 85,
              factors: ['Low usage', 'Payment failures', 'No recent logins'],
            },
            {
              subscriptionId: 'sub-002',
              riskScore: 72,
              factors: ['Decreased bookings', 'Support tickets'],
            },
          ],
          upgradeOpportunities: [
            {
              subscriptionId: 'sub-003',
              recommendedTier: 'professional',
              reasoning: ['Exceeding service limits', 'High booking volume', 'API usage growth'],
            },
            {
              subscriptionId: 'sub-004',
              recommendedTier: 'enterprise',
              reasoning: ['Multiple locations', 'Team growth', 'Advanced analytics usage'],
            },
          ],
        },
      };

      console.log(`📈 Analytics generated:`);
      console.log(`  💰 MRR: ARS ${analytics.metrics.monthlyRecurringRevenue.toLocaleString()}`);
      console.log(`  📊 Growth Rate: ${analytics.metrics.subscriptionGrowthRate}%`);
      console.log(`  ⚠️ Churn Risk: ${analytics.predictiveInsights.churnPrediction.length} subscriptions`);
      console.log(`  🚀 Upgrade Opportunities: ${analytics.predictiveInsights.upgradeOpportunities.length}`);

      return analytics;
    } catch (error: any) {
      console.error('❌ Error generating subscription analytics:', error);
      throw new Error(`Failed to generate subscription analytics: ${error.message}`);
    }
  }

  /**
   * Automatic usage-based billing adjustments
   */
  async processUsageBasedAdjustments(subscriptionId: string): Promise<{
    adjustments: Array<{
      type: 'overage' | 'addon_recommendation' | 'tier_upgrade_suggestion';
      description: string;
      amount?: number;
      action_required: boolean;
    }>;
    totalAdjustment: number;
  }> {
    console.log(`⚡ Processing usage-based billing adjustments for ${subscriptionId}...`);

    try {
      // Mock implementation - would analyze actual usage data
      const adjustments = [
        {
          type: 'overage' as const,
          description: 'Exceso en límite de almacenamiento: 2.5GB adicionales',
          amount: 750,
          action_required: true,
        },
        {
          type: 'overage' as const,
          description: 'Llamadas de API adicionales: 1,200 calls sobre el límite',
          amount: 299,
          action_required: true,
        },
        {
          type: 'addon_recommendation' as const,
          description: 'Recomendamos el addon de Analytics Premium por tu alto uso',
          action_required: false,
        },
      ];

      const totalAdjustment = adjustments
        .filter(adj => adj.amount)
        .reduce((sum, adj) => sum + (adj.amount || 0), 0);

      console.log(`💡 Found ${adjustments.length} billing adjustments`);
      console.log(`💰 Total additional charges: ARS ${totalAdjustment}`);

      return {
        adjustments,
        totalAdjustment,
      };
    } catch (error: any) {
      console.error('❌ Error processing usage-based adjustments:', error);
      throw new Error(`Failed to process usage adjustments: ${error.message}`);
    }
  }

  /**
   * Intelligent subscription tier recommendations
   */
  async getSubscriptionRecommendations(providerId: string): Promise<{
    currentUsage: Record<string, number>;
    recommendedTier: string;
    reasoningFactors: string[];
    potentialSavings: number;
    upgradeIncentives: Array<{
      feature: string;
      description: string;
      value_proposition: string;
    }>;
  }> {
    console.log(`🎯 Generating subscription recommendations for provider ${providerId}...`);

    try {
      // Mock current usage analysis
      const currentUsage = {
        bookingsPerMonth: 340,
        servicesUsed: 28,
        storageUsedGB: 4.2,
        apiCallsPerMonth: 8500,
        locationsUsed: 2,
        staffMembers: 4,
      };

      // Analyze current tier vs usage
      const tiers = await this.getAdvancedSubscriptionTiers();
      const currentSubscription = await subscriptionBilling.getProviderSubscription(providerId);
      
      let recommendedTier = 'professional';
      let reasoningFactors: string[] = [];
      let potentialSavings = 0;

      // Recommendation logic
      if (currentUsage.bookingsPerMonth > 300) {
        recommendedTier = 'enterprise';
        reasoningFactors.push('Alto volumen de reservas mensuales');
      }

      if (currentUsage.locationsUsed > 1) {
        recommendedTier = 'professional';
        reasoningFactors.push('Uso de múltiples ubicaciones');
      }

      if (currentUsage.apiCallsPerMonth > 5000) {
        reasoningFactors.push('Alto uso de integraciones API');
      }

      // Calculate potential savings/costs
      const currentTier = tiers.find(t => t.id === currentSubscription?.planId);
      const newTier = tiers.find(t => t.id === recommendedTier);
      
      if (currentTier && newTier) {
        potentialSavings = currentTier.basePrice - newTier.basePrice;
      }

      const upgradeIncentives = [
        {
          feature: 'Advanced Analytics',
          description: 'Reportes predictivos y análisis de tendencias',
          value_proposition: 'Incrementa tus ingresos hasta 15% con insights inteligentes',
        },
        {
          feature: 'Custom Branding',
          description: 'Personaliza completamente la experiencia de tus clientes',
          value_proposition: 'Mejora la retención de clientes y construcción de marca',
        },
        {
          feature: 'API Access',
          description: 'Integra con tus herramientas favoritas',
          value_proposition: 'Automatiza procesos y ahorra 5+ horas semanales',
        },
      ];

      console.log(`🎯 Recommendation: ${recommendedTier} tier`);
      console.log(`💡 Key factors: ${reasoningFactors.join(', ')}`);

      return {
        currentUsage,
        recommendedTier,
        reasoningFactors,
        potentialSavings,
        upgradeIncentives,
      };
    } catch (error: any) {
      console.error('❌ Error generating subscription recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
}

export const advancedSubscriptionBilling = new AdvancedSubscriptionBillingService(
  new PrismaClient()
);