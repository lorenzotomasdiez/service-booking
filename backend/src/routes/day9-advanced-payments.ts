/**
 * PAY9-001: Day 9 Advanced Payment Features API Routes
 * Express routes for enterprise billing, multi-vertical payments, and payment intelligence
 */

import express from 'express';
import { z } from 'zod';
import { day9AdvancedPaymentCoordinator } from '../services/day9-advanced-payment-coordinator';
import { advancedSubscriptionBilling } from '../services/day9-advanced-subscription-billing';
import { multiVerticalPayment } from '../services/day9-multi-vertical-payment';
import { paymentIntelligence } from '../services/day9-payment-intelligence';

const router = express.Router();

// Request validation schemas
const EnterpriseSubscriptionSchema = z.object({
  subscriptionType: z.enum(['individual', 'family', 'corporate']),
  tierId: z.string(),
  verticalId: z.string().optional(),
  paymentData: z.object({
    amount: z.number().min(100),
    paymentMethod: z.string(),
    billingCycle: z.enum(['monthly', 'quarterly', 'annually']),
    customizations: z.record(z.any()).optional(),
  }),
  customerData: z.object({
    type: z.enum(['individual', 'business']),
    identification: z.string(),
    contact: z.record(z.string()),
    complianceData: z.record(z.any()).optional(),
  }),
  features: z.object({
    prorationRequired: z.boolean().default(false),
    intelligenceAnalysis: z.boolean().default(true),
    verticalCompliance: z.boolean().default(false),
    argentinaOptimization: z.boolean().default(true),
  }),
});

const FamilyPlanSchema = z.object({
  masterAccountId: z.string(),
  memberEmails: z.array(z.string().email()).min(1).max(5),
  billingEmail: z.string().email(),
  paymentMethodId: z.string().optional(),
});

const CorporateSubscriptionSchema = z.object({
  companyName: z.string(),
  companyTaxId: z.string(),
  billingContact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    department: z.string(),
  }),
  tierRequirements: z.array(z.object({
    tierId: z.string(),
    quantity: z.number().min(1),
    assignedTo: z.array(z.string()),
  })),
  enterpriseFeatures: z.object({
    singleSignOn: z.boolean().default(false),
    ldapIntegration: z.boolean().default(false),
    customIntegrations: z.boolean().default(false),
    dedicatedSupport: z.boolean().default(true),
    serviceLevel: z.enum(['standard', 'premium', 'enterprise']).default('standard'),
  }),
});

const VerticalPaymentSchema = z.object({
  verticalId: z.string(),
  providerId: z.string(),
  amount: z.number().min(100),
  paymentMethodId: z.string(),
  complianceData: z.record(z.any()).default({}),
  customFields: z.record(z.any()).default({}),
});

const IntelligenceAnalysisSchema = z.object({
  userId: z.string(),
  transactionAmount: z.number().min(0),
  paymentMethod: z.string(),
  deviceInfo: z.record(z.any()).default({}),
  locationInfo: z.record(z.any()).default({}),
  behaviorMetrics: z.record(z.any()).default({}),
});

const FraudDetectionSchema = z.object({
  amount: z.number().min(0),
  paymentMethod: z.string(),
  userId: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  deviceFingerprint: z.string(),
  ipAddress: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    country: z.string(),
    region: z.string(),
  }),
});

/**
 * System Status and Health
 */

// GET /api/day9-payments/status
router.get('/status', async (req, res) => {
  try {
    console.log('📊 Day 9 Payment System Status requested');
    
    const systemStatus = day9AdvancedPaymentCoordinator.getSystemStatus();
    
    res.json({
      success: true,
      data: systemStatus,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/configuration
router.get('/configuration', async (req, res) => {
  try {
    console.log('⚙️ Day 9 Payment System Configuration requested');
    
    const configuration = day9AdvancedPaymentCoordinator.getSystemConfiguration();
    
    res.json({
      success: true,
      data: configuration,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting system configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system configuration',
      details: error.message,
    });
  }
});

// POST /api/day9-payments/initialize
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 Day 9 Payment System initialization requested');
    
    const systemStatus = await day9AdvancedPaymentCoordinator.initializeSystem();
    
    res.json({
      success: true,
      message: 'Day 9 payment system initialized successfully',
      data: systemStatus,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error initializing system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize system',
      details: error.message,
    });
  }
});

/**
 * Advanced Subscription Billing
 */

// GET /api/day9-payments/subscription-tiers
router.get('/subscription-tiers', async (req, res) => {
  try {
    console.log('📋 Advanced subscription tiers requested');
    
    const tiers = await advancedSubscriptionBilling.getAdvancedSubscriptionTiers();
    
    res.json({
      success: true,
      data: tiers,
      count: tiers.length,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting subscription tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription tiers',
      details: error.message,
    });
  }
});

// POST /api/day9-payments/subscription/enterprise
router.post('/subscription/enterprise', async (req, res) => {
  try {
    console.log('🏢 Enterprise subscription processing requested');
    
    const validatedData = EnterpriseSubscriptionSchema.parse(req.body);
    
    const result = await day9AdvancedPaymentCoordinator.processEnterpriseSubscription(validatedData);
    
    res.json({
      success: true,
      message: 'Enterprise subscription processed successfully',
      data: result,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error processing enterprise subscription:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process enterprise subscription',
        details: error.message,
      });
    }
  }
});

// POST /api/day9-payments/subscription/family
router.post('/subscription/family', async (req, res) => {
  try {
    console.log('👨‍👩‍👧‍👦 Family plan creation requested');
    
    const validatedData = FamilyPlanSchema.parse(req.body);
    
    const result = await advancedSubscriptionBilling.createFamilyPlan(validatedData);
    
    res.json({
      success: true,
      message: 'Family plan created successfully',
      data: result,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error creating family plan:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create family plan',
        details: error.message,
      });
    }
  }
});

// POST /api/day9-payments/subscription/corporate
router.post('/subscription/corporate', async (req, res) => {
  try {
    console.log('🏢 Corporate subscription creation requested');
    
    const validatedData = CorporateSubscriptionSchema.parse(req.body);
    
    const result = await advancedSubscriptionBilling.createCorporateSubscription(validatedData);
    
    res.json({
      success: true,
      message: 'Corporate subscription created successfully',
      data: result,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error creating corporate subscription:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create corporate subscription',
        details: error.message,
      });
    }
  }
});

// POST /api/day9-payments/subscription/proration
router.post('/subscription/proration', async (req, res) => {
  try {
    console.log('🧮 Proration calculation requested');
    
    const { currentSubscriptionId, newTierId, newBillingCycle } = req.body;
    
    if (!currentSubscriptionId || !newTierId || !newBillingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: currentSubscriptionId, newTierId, newBillingCycle',
      });
    }
    
    const prorationResult = await advancedSubscriptionBilling.calculateProration(
      currentSubscriptionId,
      newTierId,
      newBillingCycle
    );
    
    res.json({
      success: true,
      message: 'Proration calculated successfully',
      data: prorationResult,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error calculating proration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate proration',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/subscription/analytics
router.get('/subscription/analytics', async (req, res) => {
  try {
    console.log('📊 Subscription analytics requested');
    
    const { from, to } = req.query;
    let dateRange: { from: Date; to: Date } | undefined;
    
    if (from && to) {
      dateRange = {
        from: new Date(from as string),
        to: new Date(to as string),
      };
    }
    
    const analytics = await advancedSubscriptionBilling.getSubscriptionAnalytics(dateRange);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting subscription analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription analytics',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/subscription/recommendations/:providerId
router.get('/subscription/recommendations/:providerId', async (req, res) => {
  try {
    console.log(`🎯 Subscription recommendations requested for provider ${req.params.providerId}`);
    
    const recommendations = await advancedSubscriptionBilling.getSubscriptionRecommendations(req.params.providerId);
    
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting subscription recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription recommendations',
      details: error.message,
    });
  }
});

/**
 * Multi-Vertical Payment Processing
 */

// GET /api/day9-payments/verticals
router.get('/verticals', async (req, res) => {
  try {
    console.log('🏥 Supported verticals requested');
    
    const verticals = await multiVerticalPayment.getSupportedVerticals();
    
    res.json({
      success: true,
      data: verticals,
      count: verticals.length,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting supported verticals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported verticals',
      details: error.message,
    });
  }
});

// POST /api/day9-payments/verticals/flow/:verticalId
router.post('/verticals/flow/:verticalId', async (req, res) => {
  try {
    console.log(`🎯 Vertical payment flow creation requested for ${req.params.verticalId}`);
    
    const flow = await multiVerticalPayment.createVerticalPaymentFlow(req.params.verticalId);
    
    res.json({
      success: true,
      message: 'Vertical payment flow created successfully',
      data: flow,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error creating vertical payment flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vertical payment flow',
      details: error.message,
    });
  }
});

// POST /api/day9-payments/verticals/payment
router.post('/verticals/payment', async (req, res) => {
  try {
    console.log('💳 Vertical payment processing requested');
    
    const validatedData = VerticalPaymentSchema.parse(req.body);
    
    const result = await multiVerticalPayment.processVerticalPayment(validatedData);
    
    res.json({
      success: true,
      message: 'Vertical payment processed successfully',
      data: result,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error processing vertical payment:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process vertical payment',
        details: error.message,
      });
    }
  }
});

// GET /api/day9-payments/verticals/analytics/:verticalId
router.get('/verticals/analytics/:verticalId', async (req, res) => {
  try {
    console.log(`📊 Vertical analytics requested for ${req.params.verticalId}`);
    
    const { from, to } = req.query;
    let dateRange: { from: Date; to: Date } | undefined;
    
    if (from && to) {
      dateRange = {
        from: new Date(from as string),
        to: new Date(to as string),
      };
    }
    
    const analytics = await multiVerticalPayment.getVerticalAnalytics(req.params.verticalId, dateRange);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting vertical analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vertical analytics',
      details: error.message,
    });
  }
});

// POST /api/day9-payments/verticals/template
router.post('/verticals/template', async (req, res) => {
  try {
    console.log('📋 Vertical template generation requested');
    
    const { baseVerticalId, customizations } = req.body;
    
    if (!baseVerticalId || !customizations) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: baseVerticalId, customizations',
      });
    }
    
    const template = await multiVerticalPayment.generateVerticalTemplate(baseVerticalId, customizations);
    
    res.json({
      success: true,
      message: 'Vertical template generated successfully',
      data: template,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error generating vertical template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate vertical template',
      details: error.message,
    });
  }
});

/**
 * Payment Intelligence and Security
 */

// POST /api/day9-payments/intelligence/analyze
router.post('/intelligence/analyze', async (req, res) => {
  try {
    console.log('🧠 Payment intelligence analysis requested');
    
    const validatedData = IntelligenceAnalysisSchema.parse(req.body);
    
    const analysis = await paymentIntelligence.analyzePaymentIntelligence(validatedData);
    
    res.json({
      success: true,
      message: 'Payment intelligence analysis completed',
      data: analysis,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error in payment intelligence analysis:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze payment intelligence',
        details: error.message,
      });
    }
  }
});

// POST /api/day9-payments/intelligence/fraud-detection
router.post('/intelligence/fraud-detection', async (req, res) => {
  try {
    console.log('🔍 Real-time fraud detection requested');
    
    const validatedData = FraudDetectionSchema.parse(req.body);
    
    const fraudResult = await paymentIntelligence.detectRealTimeFraud(validatedData);
    
    res.json({
      success: true,
      message: 'Fraud detection completed',
      data: fraudResult,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error in fraud detection:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to perform fraud detection',
        details: error.message,
      });
    }
  }
});

// GET /api/day9-payments/intelligence/optimizations
router.get('/intelligence/optimizations', async (req, res) => {
  try {
    console.log('⚡ Payment optimizations requested');
    
    const { from, to } = req.query;
    let dateRange: { from: Date; to: Date } | undefined;
    
    if (from && to) {
      dateRange = {
        from: new Date(from as string),
        to: new Date(to as string),
      };
    }
    
    const optimizations = await paymentIntelligence.generatePaymentOptimizations(dateRange);
    
    res.json({
      success: true,
      data: optimizations,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting payment optimizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment optimizations',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/intelligence/security-dashboard
router.get('/intelligence/security-dashboard', async (req, res) => {
  try {
    console.log('🛡️ Security dashboard requested');
    
    const dashboard = await paymentIntelligence.getSecurityDashboard();
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting security dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security dashboard',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/intelligence/template
router.get('/intelligence/template', async (req, res) => {
  try {
    console.log('📋 Intelligence template requested');
    
    const template = await paymentIntelligence.generateIntelligenceTemplate();
    
    res.json({
      success: true,
      data: template,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error getting intelligence template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get intelligence template',
      details: error.message,
    });
  }
});

/**
 * System Management and Reports
 */

// GET /api/day9-payments/performance/optimize
router.get('/performance/optimize', async (req, res) => {
  try {
    console.log('⚡ System performance optimization requested');
    
    const optimization = await day9AdvancedPaymentCoordinator.optimizeSystemPerformance();
    
    res.json({
      success: true,
      message: 'System performance optimization completed',
      data: optimization,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error optimizing system performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize system performance',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/deployment/report
router.get('/deployment/report', async (req, res) => {
  try {
    console.log('📋 Deployment report generation requested');
    
    const report = await day9AdvancedPaymentCoordinator.generateDeploymentReport();
    
    res.json({
      success: true,
      message: 'Deployment report generated successfully',
      data: report,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error generating deployment report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate deployment report',
      details: error.message,
    });
  }
});

// GET /api/day9-payments/system/template
router.get('/system/template', async (req, res) => {
  try {
    console.log('📋 System template generation requested');
    
    const template = await day9AdvancedPaymentCoordinator.generateSystemTemplate();
    
    res.json({
      success: true,
      message: 'System template generated successfully',
      data: template,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Error generating system template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate system template',
      details: error.message,
    });
  }
});

// Health check endpoint
// GET /api/day9-payments/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Day 9 Advanced Payment System',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date(),
    features: [
      'Advanced Subscription Billing',
      'Multi-Vertical Payment Processing',
      'Payment Intelligence & Security',
      'Argentina Market Optimization',
    ],
  });
});

export default router;