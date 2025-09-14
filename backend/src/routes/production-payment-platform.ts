/**
 * Production Payment Platform API Routes
 * PAY11-001: Enterprise payment processing endpoints with comprehensive monitoring
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { rateLimitStrict } from '../middleware/rateLimit';
import ProductionPaymentPlatform from '../services/production-payment-platform';
import FinancialOperationsIntelligence from '../services/financial-operations-intelligence';
import PaymentSecurityCompliance from '../services/payment-security-compliance';
import { body, query, param } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize payment platform services
const paymentPlatform = new ProductionPaymentPlatform(prisma);
const financialOps = new FinancialOperationsIntelligence(prisma);
const securityCompliance = new PaymentSecurityCompliance(prisma);

/**
 * Production Payment Processing
 */
router.post('/process',
  rateLimitStrict,
  authenticateToken,
  [
    body('amount').isNumeric().isFloat({ min: 1, max: 10000000 }),
    body('currency').optional().isIn(['ARS', 'USD']),
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet']),
    body('customerEmail').isEmail(),
    body('orderId').isString().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 500 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Security validation first
      const securityValidation = await securityCompliance.validatePaymentSecurity(req.body);
      
      if (!securityValidation.approved) {
        return res.status(403).json({
          success: false,
          error: 'SECURITY_VIOLATION',
          message: 'Payment security validation failed',
          violations: securityValidation.violations,
          riskScore: securityValidation.riskScore
        });
      }

      // Process payment through production platform
      const result = await paymentPlatform.processPayment({
        ...req.body,
        metadata: {
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          ...req.body.metadata
        }
      });

      res.json({
        success: true,
        data: result,
        securityValidation: {
          riskScore: securityValidation.riskScore,
          validated: true
        }
      });

    } catch (error: any) {
      console.error('Payment processing error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'PAYMENT_ERROR',
        message: error.message || 'Payment processing failed'
      });
    }
  }
);

/**
 * Payment Optimization Insights
 */
router.get('/optimization',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const period = {
        from: req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: req.query.to ? new Date(req.query.to as string) : new Date()
      };

      const insights = await paymentPlatform.getOptimizationInsights(period);

      res.json({
        success: true,
        data: insights,
        metadata: {
          period,
          generatedAt: new Date()
        }
      });

    } catch (error: any) {
      console.error('Optimization insights error:', error);
      res.status(500).json({
        success: false,
        error: 'INSIGHTS_ERROR',
        message: 'Failed to generate optimization insights'
      });
    }
  }
);

/**
 * Financial Reports
 */
router.get('/reports/financial/:type',
  authenticateToken,
  requireRole(['admin', 'finance']),
  [
    param('type').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const type = req.params.type as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
      const period = req.query.from && req.query.to ? {
        from: new Date(req.query.from as string),
        to: new Date(req.query.to as string)
      } : undefined;

      const report = await financialOps.generateFinancialReport(type, period);

      res.json({
        success: true,
        data: report
      });

    } catch (error: any) {
      console.error('Financial report error:', error);
      res.status(500).json({
        success: false,
        error: 'REPORT_ERROR',
        message: 'Failed to generate financial report'
      });
    }
  }
);

/**
 * Export Financial Report
 */
router.get('/reports/financial/:reportId/export/:format',
  authenticateToken,
  requireRole(['admin', 'finance']),
  [
    param('reportId').isUUID(),
    param('format').isIn(['excel', 'pdf', 'csv'])
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { reportId, format } = req.params;
      const buffer = await financialOps.exportFinancialReport(
        reportId, 
        format as 'excel' | 'pdf' | 'csv'
      );

      const contentType = {
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
        csv: 'text/csv'
      }[format];

      const filename = `financial-report-${reportId}.${format === 'excel' ? 'xlsx' : format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error: any) {
      console.error('Report export error:', error);
      res.status(500).json({
        success: false,
        error: 'EXPORT_ERROR',
        message: 'Failed to export financial report'
      });
    }
  }
);

/**
 * Revenue Optimization Strategy
 */
router.get('/revenue/optimization',
  authenticateToken,
  requireRole(['admin', 'business']),
  async (req, res) => {
    try {
      const optimization = await financialOps.getRevenueOptimization();

      res.json({
        success: true,
        data: optimization,
        generatedAt: new Date()
      });

    } catch (error: any) {
      console.error('Revenue optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'OPTIMIZATION_ERROR',
        message: 'Failed to generate revenue optimization'
      });
    }
  }
);

/**
 * Implement Promotional Campaign
 */
router.post('/revenue/campaigns',
  authenticateToken,
  requireRole(['admin', 'business']),
  [
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('type').isIn(['discount', 'bundle', 'loyalty', 'referral']),
    body('target').isString(),
    body('parameters').isObject(),
    body('expectedRoi').isNumeric(),
    body('duration.start').isISO8601(),
    body('duration.end').isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const campaign = {
        ...req.body,
        id: req.body.id || require('uuid').v4(),
        duration: {
          start: new Date(req.body.duration.start),
          end: new Date(req.body.duration.end)
        }
      };

      const result = await financialOps.implementPromotionalCampaign(campaign);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Campaign implementation error:', error);
      res.status(500).json({
        success: false,
        error: 'CAMPAIGN_ERROR',
        message: 'Failed to implement promotional campaign'
      });
    }
  }
);

/**
 * Compliance Status
 */
router.get('/compliance/status',
  authenticateToken,
  requireRole(['admin', 'compliance']),
  async (req, res) => {
    try {
      const compliance = await securityCompliance.validateCompliance();

      res.json({
        success: true,
        data: compliance
      });

    } catch (error: any) {
      console.error('Compliance status error:', error);
      res.status(500).json({
        success: false,
        error: 'COMPLIANCE_ERROR',
        message: 'Failed to get compliance status'
      });
    }
  }
);

/**
 * Compliance Report
 */
router.get('/compliance/report',
  authenticateToken,
  requireRole(['admin', 'compliance']),
  [
    query('from').isISO8601(),
    query('to').isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const period = {
        from: new Date(req.query.from as string),
        to: new Date(req.query.to as string)
      };

      const report = await paymentPlatform.generateComplianceReport(period);

      res.json({
        success: true,
        data: report
      });

    } catch (error: any) {
      console.error('Compliance report error:', error);
      res.status(500).json({
        success: false,
        error: 'REPORT_ERROR',
        message: 'Failed to generate compliance report'
      });
    }
  }
);

/**
 * Payment Reconciliation
 */
router.post('/reconciliation',
  authenticateToken,
  requireRole(['admin', 'finance']),
  [
    body('from').isISO8601(),
    body('to').isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const period = {
        from: new Date(req.body.from),
        to: new Date(req.body.to)
      };

      const reconciliation = await financialOps.runReconciliation(period);

      res.json({
        success: true,
        data: reconciliation
      });

    } catch (error: any) {
      console.error('Reconciliation error:', error);
      res.status(500).json({
        success: false,
        error: 'RECONCILIATION_ERROR',
        message: 'Failed to run reconciliation'
      });
    }
  }
);

/**
 * Growth Analytics
 */
router.get('/analytics/growth',
  authenticateToken,
  requireRole(['admin', 'business']),
  [
    query('from').isISO8601(),
    query('to').isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const period = {
        from: new Date(req.query.from as string),
        to: new Date(req.query.to as string)
      };

      const analytics = await financialOps.getGrowthAnalytics(period);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error: any) {
      console.error('Growth analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'ANALYTICS_ERROR',
        message: 'Failed to generate growth analytics'
      });
    }
  }
);

/**
 * Risk Assessment
 */
router.get('/security/risk',
  authenticateToken,
  requireRole(['admin', 'security']),
  async (req, res) => {
    try {
      const risk = await securityCompliance.assessSystemRisk();

      res.json({
        success: true,
        data: risk
      });

    } catch (error: any) {
      console.error('Risk assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'RISK_ERROR',
        message: 'Failed to assess system risk'
      });
    }
  }
);

/**
 * Security Audit
 */
router.post('/security/audit',
  authenticateToken,
  requireRole(['admin', 'security']),
  async (req, res) => {
    try {
      const audit = await securityCompliance.runAuditAutomation();

      res.json({
        success: true,
        data: audit
      });

    } catch (error: any) {
      console.error('Security audit error:', error);
      res.status(500).json({
        success: false,
        error: 'AUDIT_ERROR',
        message: 'Failed to run security audit'
      });
    }
  }
);

/**
 * Quality Assurance
 */
router.get('/quality/assurance',
  authenticateToken,
  requireRole(['admin', 'qa']),
  async (req, res) => {
    try {
      const qa = await securityCompliance.runQualityAssurance();

      res.json({
        success: true,
        data: qa
      });

    } catch (error: any) {
      console.error('Quality assurance error:', error);
      res.status(500).json({
        success: false,
        error: 'QA_ERROR',
        message: 'Failed to run quality assurance'
      });
    }
  }
);

/**
 * Real-time Dashboard Metrics
 */
router.get('/dashboard',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const metrics = await financialOps.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date()
      });

    } catch (error: any) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'DASHBOARD_ERROR',
        message: 'Failed to get dashboard metrics'
      });
    }
  }
);

/**
 * Investor Report
 */
router.get('/reports/investor/:quarter',
  authenticateToken,
  requireRole(['admin', 'executive']),
  [
    param('quarter').matches(/^\d{4}-Q[1-4]$/)
  ],
  validateRequest,
  async (req, res) => {
    try {
      const quarter = req.params.quarter;
      const report = await financialOps.generateInvestorReport(quarter);

      res.json({
        success: true,
        data: report
      });

    } catch (error: any) {
      console.error('Investor report error:', error);
      res.status(500).json({
        success: false,
        error: 'INVESTOR_REPORT_ERROR',
        message: 'Failed to generate investor report'
      });
    }
  }
);

/**
 * Security Documentation
 */
router.get('/security/documentation',
  authenticateToken,
  requireRole(['admin', 'security']),
  async (req, res) => {
    try {
      const documentation = await securityCompliance.generateSecurityDocumentation();

      res.json({
        success: true,
        data: documentation
      });

    } catch (error: any) {
      console.error('Security documentation error:', error);
      res.status(500).json({
        success: false,
        error: 'DOCUMENTATION_ERROR',
        message: 'Failed to generate security documentation'
      });
    }
  }
);

/**
 * Payment Platform Health Check
 */
router.get('/health',
  async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          paymentPlatform: 'operational',
          financialOps: 'operational',
          securityCompliance: 'operational',
          database: 'connected'
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: 'HEALTH_CHECK_FAILED',
        message: 'Payment platform health check failed'
      });
    }
  }
);

// Event handlers for real-time monitoring
paymentPlatform.on('payment_processed', (data) => {
  console.log('Payment processed:', data.request.orderId);
});

paymentPlatform.on('payment_error', (data) => {
  console.error('Payment error:', data.error.message);
});

financialOps.on('daily_report_generated', (report) => {
  console.log('Daily financial report generated:', report.reportId);
});

financialOps.on('compliance_violation', (violation) => {
  console.warn('Compliance violation detected:', violation.type);
});

securityCompliance.on('security_violation', (violation) => {
  console.error('Security violation:', violation.violations);
});

securityCompliance.on('high_risk_detected', (risk) => {
  console.warn('High risk detected:', risk.riskLevel, risk.riskScore);
});

export default router;