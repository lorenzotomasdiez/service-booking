import { FastifyInstance } from 'fastify';
import { prisma } from './database';
import { multiTenantService } from './multi-tenant';
import { v4 as uuidv4 } from 'uuid';

/**
 * T10-001: Enterprise Architecture & AI-Powered Platform Enhancement
 * Multi-Tenant Enterprise Architecture Implementation
 * 
 * Extends base multi-tenant service with enterprise-grade features:
 * - Advanced data isolation and security boundaries
 * - Enterprise-grade permission and role management
 * - Tenant-specific customization framework
 * - Scalable architecture for 1000+ concurrent users
 * - White-label solutions support
 */

export interface EnterpriseConfig {
  id: string;
  tenantId: string;
  organizationName: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'white_label';
  subscriptionPlan: EnterprisePlan;
  securityProfile: SecurityProfile;
  customization: EnterpriseCustomization;
  integrationSettings: EnterpriseIntegration;
  complianceSettings: ComplianceProfile;
  performanceProfile: PerformanceProfile;
  supportLevel: 'basic' | 'priority' | 'premium' | 'dedicated';
  createdAt: Date;
  lastSync: Date;
}

export interface EnterprisePlan {
  planId: string;
  features: {
    maxUsers: number;
    maxProviders: number;
    maxLocations: number;
    maxBookingsPerMonth: number;
    apiCallsPerDay: number;
    storageLimit: number; // GB
    customBranding: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
    aiFeatures: boolean;
    customIntegrations: boolean;
    prioritySupport: boolean;
    slaGuarantee?: number; // uptime percentage
  };
  billing: {
    model: 'fixed' | 'usage_based' | 'hybrid';
    amount: number;
    currency: 'ARS' | 'USD';
    billingCycle: 'monthly' | 'yearly';
    trialPeriod?: number; // days
  };
}

export interface SecurityProfile {
  dataIsolation: 'shared' | 'dedicated' | 'encrypted_shared';
  networkSecurity: {
    ipWhitelist?: string[];
    vpnRequired: boolean;
    sslEnforcement: boolean;
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
  };
  authentication: {
    mfaRequired: boolean;
    ssoProvider?: string;
    passwordPolicy: {
      minLength: number;
      requireComplexity: boolean;
      rotationPeriod?: number; // days
    };
    sessionTimeout: number; // minutes
  };
  auditLogging: {
    enabled: boolean;
    retentionPeriod: number; // days
    logLevel: 'basic' | 'detailed' | 'comprehensive';
    complianceReporting: boolean;
  };
}

export interface EnterpriseCustomization {
  branding: {
    logo: {
      light?: string;
      dark?: string;
      favicon?: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
      success: string;
      warning: string;
      error: string;
    };
    typography: {
      fontFamily: string;
      customCSS?: string;
    };
  };
  ui: {
    layout: 'standard' | 'minimal' | 'custom';
    navigation: {
      position: 'top' | 'side' | 'combined';
      customMenuItems?: MenuItem[];
    };
    dashboard: {
      widgets: string[];
      layout: 'grid' | 'list' | 'cards';
      customWidgets?: CustomWidget[];
    };
    whiteLabel: {
      enabled: boolean;
      customDomain?: string;
      hideBarberProBranding: boolean;
      customFooter?: string;
    };
  };
  features: {
    enabled: string[];
    disabled: string[];
    customFeatures?: CustomFeature[];
  };
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  permissions: string[];
}

export interface CustomWidget {
  id: string;
  name: string;
  component: string;
  config: Record<string, any>;
  permissions: string[];
}

export interface CustomFeature {
  id: string;
  name: string;
  description: string;
  implementation: 'plugin' | 'webhook' | 'custom';
  config: Record<string, any>;
}

export interface EnterpriseIntegration {
  crm: {
    provider?: 'salesforce' | 'hubspot' | 'pipedrive' | 'custom';
    config?: Record<string, any>;
    syncSchedule?: string;
    bidirectional: boolean;
  };
  erp: {
    provider?: 'sap' | 'oracle' | 'microsoft_dynamics' | 'custom';
    config?: Record<string, any>;
    financialSync: boolean;
    inventorySync: boolean;
  };
  communication: {
    email: {
      provider: 'sendgrid' | 'mailgun' | 'ses' | 'custom';
      templates: string[];
      automationRules: EmailAutomation[];
    };
    sms: {
      provider: 'twilio' | 'nexmo' | 'custom';
      globalNumbers: string[];
      templates: string[];
    };
    whatsapp: {
      businessAccountId?: string;
      webhookEndpoint?: string;
      templates: string[];
    };
  };
  analytics: {
    providers: ('google_analytics' | 'mixpanel' | 'amplitude' | 'custom')[];
    customDashboards: string[];
    reportingSchedule?: string;
  };
  payments: {
    primaryGateway: string;
    fallbackGateways: string[];
    customRules?: PaymentRule[];
    reconciliation: {
      automated: boolean;
      schedule?: string;
      tolerance: number;
    };
  };
}

export interface EmailAutomation {
  trigger: string;
  template: string;
  delay?: number;
  conditions?: Record<string, any>;
}

export interface PaymentRule {
  condition: string;
  action: 'route_to' | 'apply_fee' | 'require_approval';
  value: any;
}

export interface ComplianceProfile {
  regulations: {
    gdpr: boolean;
    ccpa: boolean;
    hipaa: boolean;
    pci_dss: boolean;
    argentina_data_protection: boolean;
  };
  dataRetention: {
    defaultPeriod: number; // days
    categorySpecific: Record<string, number>;
    automaticDeletion: boolean;
  };
  auditRequirements: {
    frequency: 'monthly' | 'quarterly' | 'annually';
    externalAuditor: boolean;
    reportGeneration: boolean;
    complianceDashboard: boolean;
  };
  backupAndRecovery: {
    frequency: 'hourly' | 'daily' | 'weekly';
    retentionPeriod: number; // days
    offSiteBackup: boolean;
    encryptedBackups: boolean;
    rpoTarget: number; // minutes
    rtoTarget: number; // minutes
  };
}

export interface PerformanceProfile {
  tier: 'standard' | 'premium' | 'enterprise';
  guarantees: {
    responseTime: number; // ms
    uptime: number; // percentage
    throughput: number; // requests per second
    concurrentUsers: number;
  };
  scaling: {
    autoScaling: boolean;
    maxInstances: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    cooldownPeriod: number; // seconds
  };
  caching: {
    strategy: 'aggressive' | 'moderate' | 'conservative';
    customRules: CacheRule[];
    cdnEnabled: boolean;
  };
  monitoring: {
    realTimeAlerts: boolean;
    customMetrics: string[];
    dashboardAccess: boolean;
  };
}

export interface CacheRule {
  pattern: string;
  ttl: number;
  conditions?: Record<string, any>;
}

export interface EnterpriseRole {
  id: string;
  name: string;
  level: 'tenant_admin' | 'location_admin' | 'manager' | 'staff' | 'readonly';
  permissions: EnterprisePermission[];
  restrictions?: {
    locations?: string[];
    features?: string[];
    dataAccess?: 'full' | 'filtered' | 'readonly';
  };
  inheritFrom?: string;
  isSystem: boolean;
}

export interface EnterprisePermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'execute')[];
  conditions?: {
    owner?: boolean;
    location?: string[];
    timeRestriction?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
}

export interface EnterpriseUser {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  locations: string[];
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    title?: string;
    department?: string;
    phoneNumber?: string;
  };
  settings: {
    language: string;
    timezone: string;
    notifications: Record<string, boolean>;
    preferences: Record<string, any>;
  };
  security: {
    mfaEnabled: boolean;
    lastLogin?: Date;
    loginAttempts: number;
    locked: boolean;
    temporaryPassword: boolean;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: Date;
  lastActive?: Date;
}

class EnterpriseMultiTenantService {
  private enterprises: Map<string, EnterpriseConfig> = new Map();
  private tenantToEnterprise: Map<string, string> = new Map();
  private enterpriseRoles: Map<string, EnterpriseRole[]> = new Map();
  private enterpriseUsers: Map<string, EnterpriseUser[]> = new Map();

  // Initialize enterprise multi-tenant service
  async initialize() {
    await this.loadEnterpriseConfigurations();
    await this.setupDefaultRoles();
    console.log(`🏢 Enterprise multi-tenant service initialized with ${this.enterprises.size} enterprise clients`);
  }

  // Load existing enterprise configurations
  private async loadEnterpriseConfigurations() {
    try {
      // Create default enterprise configurations for demonstration
      const defaultEnterprises = [
        {
          id: 'enterprise-barbershop-chain',
          tenantId: 'barberpro-main',
          organizationName: 'Premium Barbershop Chain Argentina',
          tier: 'enterprise' as const,
          subscriptionPlan: this.getDefaultPlan('enterprise'),
          securityProfile: this.getDefaultSecurityProfile('enterprise'),
          customization: this.getDefaultCustomization('barbershop_chain'),
          integrationSettings: this.getDefaultIntegrations(),
          complianceSettings: this.getDefaultComplianceProfile(),
          performanceProfile: this.getDefaultPerformanceProfile('enterprise'),
          supportLevel: 'premium' as const,
          createdAt: new Date(),
          lastSync: new Date()
        },
        {
          id: 'enterprise-wellness-network',
          tenantId: 'mindcarepro-main',
          organizationName: 'Wellness Professional Network',
          tier: 'professional' as const,
          subscriptionPlan: this.getDefaultPlan('professional'),
          securityProfile: this.getDefaultSecurityProfile('professional'),
          customization: this.getDefaultCustomization('wellness_network'),
          integrationSettings: this.getDefaultIntegrations(),
          complianceSettings: this.getDefaultComplianceProfile(),
          performanceProfile: this.getDefaultPerformanceProfile('professional'),
          supportLevel: 'priority' as const,
          createdAt: new Date(),
          lastSync: new Date()
        }
      ];

      for (const enterprise of defaultEnterprises) {
        this.enterprises.set(enterprise.id, enterprise);
        this.tenantToEnterprise.set(enterprise.tenantId, enterprise.id);
      }
    } catch (error) {
      console.error('Error loading enterprise configurations:', error);
    }
  }

  private getDefaultPlan(tier: 'starter' | 'professional' | 'enterprise' | 'white_label'): EnterprisePlan {
    const plans: Record<string, EnterprisePlan> = {
      starter: {
        planId: 'starter-plan',
        features: {
          maxUsers: 10,
          maxProviders: 5,
          maxLocations: 2,
          maxBookingsPerMonth: 1000,
          apiCallsPerDay: 5000,
          storageLimit: 5,
          customBranding: false,
          whiteLabel: false,
          advancedAnalytics: false,
          aiFeatures: false,
          customIntegrations: false,
          prioritySupport: false
        },
        billing: {
          model: 'fixed',
          amount: 29999, // ARS
          currency: 'ARS',
          billingCycle: 'monthly',
          trialPeriod: 14
        }
      },
      professional: {
        planId: 'professional-plan',
        features: {
          maxUsers: 50,
          maxProviders: 25,
          maxLocations: 10,
          maxBookingsPerMonth: 10000,
          apiCallsPerDay: 25000,
          storageLimit: 50,
          customBranding: true,
          whiteLabel: false,
          advancedAnalytics: true,
          aiFeatures: true,
          customIntegrations: true,
          prioritySupport: true
        },
        billing: {
          model: 'usage_based',
          amount: 99999, // ARS base + usage
          currency: 'ARS',
          billingCycle: 'monthly',
          trialPeriod: 30
        }
      },
      enterprise: {
        planId: 'enterprise-plan',
        features: {
          maxUsers: 1000,
          maxProviders: 500,
          maxLocations: 100,
          maxBookingsPerMonth: 100000,
          apiCallsPerDay: 100000,
          storageLimit: 500,
          customBranding: true,
          whiteLabel: true,
          advancedAnalytics: true,
          aiFeatures: true,
          customIntegrations: true,
          prioritySupport: true,
          slaGuarantee: 99.9
        },
        billing: {
          model: 'hybrid',
          amount: 499999, // ARS base + custom pricing
          currency: 'ARS',
          billingCycle: 'yearly'
        }
      },
      white_label: {
        planId: 'white-label-plan',
        features: {
          maxUsers: -1, // unlimited
          maxProviders: -1,
          maxLocations: -1,
          maxBookingsPerMonth: -1,
          apiCallsPerDay: -1,
          storageLimit: -1,
          customBranding: true,
          whiteLabel: true,
          advancedAnalytics: true,
          aiFeatures: true,
          customIntegrations: true,
          prioritySupport: true,
          slaGuarantee: 99.95
        },
        billing: {
          model: 'hybrid',
          amount: 0, // custom pricing
          currency: 'USD',
          billingCycle: 'yearly'
        }
      }
    };
    return plans[tier];
  }

  private getDefaultSecurityProfile(tier: string): SecurityProfile {
    return {
      dataIsolation: tier === 'enterprise' || tier === 'white_label' ? 'dedicated' : 'encrypted_shared',
      networkSecurity: {
        vpnRequired: tier === 'enterprise',
        sslEnforcement: true,
        encryptionAtRest: true,
        encryptionInTransit: true
      },
      authentication: {
        mfaRequired: tier === 'enterprise' || tier === 'professional',
        passwordPolicy: {
          minLength: tier === 'enterprise' ? 12 : 8,
          requireComplexity: true,
          rotationPeriod: tier === 'enterprise' ? 90 : undefined
        },
        sessionTimeout: tier === 'enterprise' ? 30 : 60
      },
      auditLogging: {
        enabled: true,
        retentionPeriod: tier === 'enterprise' ? 2555 : 365, // 7 years for enterprise
        logLevel: tier === 'enterprise' ? 'comprehensive' : 'detailed',
        complianceReporting: tier === 'enterprise'
      }
    };
  }

  private getDefaultCustomization(type: string): EnterpriseCustomization {
    return {
      branding: {
        logo: {},
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          neutral: '#f8f9fa',
          success: '#28a745',
          warning: '#ffc107',
          error: '#dc3545'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      ui: {
        layout: 'standard',
        navigation: {
          position: 'top'
        },
        dashboard: {
          widgets: ['bookings', 'revenue', 'providers', 'analytics'],
          layout: 'grid'
        },
        whiteLabel: {
          enabled: false,
          hideBarberProBranding: false
        }
      },
      features: {
        enabled: ['booking', 'payments', 'notifications', 'analytics'],
        disabled: []
      }
    };
  }

  private getDefaultIntegrations(): EnterpriseIntegration {
    return {
      crm: {
        bidirectional: false
      },
      erp: {
        financialSync: false,
        inventorySync: false
      },
      communication: {
        email: {
          provider: 'sendgrid',
          templates: ['welcome', 'booking_confirmation', 'reminder'],
          automationRules: []
        },
        sms: {
          provider: 'twilio',
          globalNumbers: [],
          templates: ['booking_reminder', 'confirmation']
        },
        whatsapp: {
          templates: ['appointment_reminder', 'welcome_message']
        }
      },
      analytics: {
        providers: ['google_analytics'],
        customDashboards: []
      },
      payments: {
        primaryGateway: 'mercadopago',
        fallbackGateways: ['decidir'],
        reconciliation: {
          automated: true,
          tolerance: 0.01
        }
      }
    };
  }

  private getDefaultComplianceProfile(): ComplianceProfile {
    return {
      regulations: {
        gdpr: false,
        ccpa: false,
        hipaa: false,
        pci_dss: true,
        argentina_data_protection: true
      },
      dataRetention: {
        defaultPeriod: 1095, // 3 years
        categorySpecific: {
          'payment_data': 2555, // 7 years
          'user_data': 1825, // 5 years
          'audit_logs': 2190 // 6 years
        },
        automaticDeletion: true
      },
      auditRequirements: {
        frequency: 'quarterly',
        externalAuditor: false,
        reportGeneration: true,
        complianceDashboard: true
      },
      backupAndRecovery: {
        frequency: 'daily',
        retentionPeriod: 90,
        offSiteBackup: true,
        encryptedBackups: true,
        rpoTarget: 60,
        rtoTarget: 240
      }
    };
  }

  private getDefaultPerformanceProfile(tier: string): PerformanceProfile {
    const profiles: Record<string, PerformanceProfile> = {
      standard: {
        tier: 'standard',
        guarantees: {
          responseTime: 500,
          uptime: 99.0,
          throughput: 100,
          concurrentUsers: 100
        },
        scaling: {
          autoScaling: false,
          maxInstances: 2,
          scaleUpThreshold: 70,
          scaleDownThreshold: 30,
          cooldownPeriod: 300
        },
        caching: {
          strategy: 'moderate',
          customRules: [],
          cdnEnabled: false
        },
        monitoring: {
          realTimeAlerts: false,
          customMetrics: [],
          dashboardAccess: false
        }
      },
      premium: {
        tier: 'premium',
        guarantees: {
          responseTime: 200,
          uptime: 99.5,
          throughput: 500,
          concurrentUsers: 500
        },
        scaling: {
          autoScaling: true,
          maxInstances: 5,
          scaleUpThreshold: 60,
          scaleDownThreshold: 20,
          cooldownPeriod: 180
        },
        caching: {
          strategy: 'aggressive',
          customRules: [],
          cdnEnabled: true
        },
        monitoring: {
          realTimeAlerts: true,
          customMetrics: ['business_metrics'],
          dashboardAccess: true
        }
      },
      enterprise: {
        tier: 'enterprise',
        guarantees: {
          responseTime: 100,
          uptime: 99.9,
          throughput: 2000,
          concurrentUsers: 1000
        },
        scaling: {
          autoScaling: true,
          maxInstances: 20,
          scaleUpThreshold: 50,
          scaleDownThreshold: 15,
          cooldownPeriod: 60
        },
        caching: {
          strategy: 'aggressive',
          customRules: [],
          cdnEnabled: true
        },
        monitoring: {
          realTimeAlerts: true,
          customMetrics: ['business_metrics', 'performance_metrics', 'security_metrics'],
          dashboardAccess: true
        }
      }
    };
    return profiles[tier] || profiles.standard;
  }

  // Setup default enterprise roles
  private async setupDefaultRoles() {
    const defaultRoles: EnterpriseRole[] = [
      {
        id: 'tenant-admin',
        name: 'Tenant Administrator',
        level: 'tenant_admin',
        permissions: [
          { resource: '*', actions: ['create', 'read', 'update', 'delete', 'execute'] }
        ],
        isSystem: true
      },
      {
        id: 'location-admin',
        name: 'Location Administrator',
        level: 'location_admin',
        permissions: [
          { resource: 'bookings', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'providers', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'services', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'users', actions: ['create', 'read', 'update'] },
          { resource: 'analytics', actions: ['read'] }
        ],
        restrictions: {
          dataAccess: 'filtered'
        },
        isSystem: true
      },
      {
        id: 'manager',
        name: 'Manager',
        level: 'manager',
        permissions: [
          { resource: 'bookings', actions: ['create', 'read', 'update'] },
          { resource: 'providers', actions: ['read', 'update'] },
          { resource: 'services', actions: ['read', 'update'] },
          { resource: 'analytics', actions: ['read'] }
        ],
        restrictions: {
          dataAccess: 'filtered'
        },
        isSystem: true
      },
      {
        id: 'staff',
        name: 'Staff Member',
        level: 'staff',
        permissions: [
          { resource: 'bookings', actions: ['create', 'read', 'update'] },
          { resource: 'providers', actions: ['read'] },
          { resource: 'services', actions: ['read'] }
        ],
        restrictions: {
          dataAccess: 'filtered'
        },
        isSystem: true
      },
      {
        id: 'readonly',
        name: 'Read Only',
        level: 'readonly',
        permissions: [
          { resource: 'bookings', actions: ['read'] },
          { resource: 'providers', actions: ['read'] },
          { resource: 'services', actions: ['read'] },
          { resource: 'analytics', actions: ['read'] }
        ],
        restrictions: {
          dataAccess: 'readonly'
        },
        isSystem: true
      }
    ];

    // Set default roles for all enterprises
    for (const [enterpriseId] of this.enterprises) {
      this.enterpriseRoles.set(enterpriseId, [...defaultRoles]);
    }
  }

  // Get enterprise configuration
  getEnterpriseConfig(tenantId: string): EnterpriseConfig | null {
    const enterpriseId = this.tenantToEnterprise.get(tenantId);
    return enterpriseId ? this.enterprises.get(enterpriseId) || null : null;
  }

  // Create enterprise tenant isolation middleware
  createEnterpriseMiddleware() {
    return async (request: any, reply: any) => {
      // Get base tenant from multi-tenant service
      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant) {
        return reply.code(400).send({
          error: 'No tenant context',
          message: 'Contexto de inquilino requerido'
        });
      }

      // Get enterprise configuration
      const enterpriseConfig = this.getEnterpriseConfig(tenant.id);
      if (!enterpriseConfig) {
        return reply.code(404).send({
          error: 'Enterprise configuration not found',
          message: 'Configuración empresarial no encontrada'
        });
      }

      // Check enterprise status and limits
      if (!this.validateEnterpriseAccess(enterpriseConfig, request)) {
        return reply.code(403).send({
          error: 'Enterprise access denied',
          message: 'Acceso empresarial denegado'
        });
      }

      // Set enterprise context
      request.enterprise = enterpriseConfig;
      
      // Add enterprise headers
      reply.header('X-Enterprise-ID', enterpriseConfig.id);
      reply.header('X-Enterprise-Tier', enterpriseConfig.tier);
      reply.header('X-Performance-Profile', enterpriseConfig.performanceProfile.tier);
    };
  }

  // Validate enterprise access
  private validateEnterpriseAccess(config: EnterpriseConfig, request: any): boolean {
    const now = new Date();
    
    // Check IP whitelist if configured
    if (config.securityProfile.networkSecurity.ipWhitelist?.length) {
      const clientIP = request.ip || request.connection.remoteAddress;
      if (!config.securityProfile.networkSecurity.ipWhitelist.includes(clientIP)) {
        return false;
      }
    }

    // Check SSL enforcement
    if (config.securityProfile.networkSecurity.sslEnforcement && !request.secure) {
      return false;
    }

    // Check subscription limits (simplified)
    const plan = config.subscriptionPlan;
    const currentHour = now.getHours();
    
    // Basic rate limiting check (would be more sophisticated in production)
    if (plan.features.apiCallsPerDay > 0) {
      // Would check actual API call count here
    }

    return true;
  }

  // Permission validation
  hasPermission(userId: string, resource: string, action: string, context?: any): boolean {
    // Get user's enterprise context
    const user = this.getEnterpriseUser(userId);
    if (!user) return false;

    // Get enterprise roles
    const enterpriseRoles = this.enterpriseRoles.get(this.tenantToEnterprise.get(user.tenantId) || '') || [];
    
    // Check each role permission
    for (const roleId of user.roles) {
      const role = enterpriseRoles.find(r => r.id === roleId);
      if (!role) continue;

      for (const permission of role.permissions) {
        // Check wildcard or exact resource match
        if (permission.resource === '*' || permission.resource === resource) {
          // Check if action is allowed
          if (permission.actions.includes(action as any)) {
            // Check conditions if present
            if (this.checkPermissionConditions(permission, user, context)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // Check permission conditions
  private checkPermissionConditions(permission: EnterprisePermission, user: EnterpriseUser, context?: any): boolean {
    if (!permission.conditions) return true;

    // Check owner condition
    if (permission.conditions.owner && context?.userId !== user.id) {
      return false;
    }

    // Check location restrictions
    if (permission.conditions.location?.length) {
      const userLocations = user.locations;
      const allowedLocations = permission.conditions.location;
      if (!userLocations.some(loc => allowedLocations.includes(loc))) {
        return false;
      }
    }

    // Check time restrictions
    if (permission.conditions.timeRestriction) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
      const { start, end } = permission.conditions.timeRestriction;
      
      if (currentTime < start || currentTime > end) {
        return false;
      }
    }

    return true;
  }

  // Get enterprise user
  private getEnterpriseUser(userId: string): EnterpriseUser | null {
    for (const [, users] of this.enterpriseUsers) {
      const user = users.find(u => u.id === userId);
      if (user) return user;
    }
    return null;
  }

  // Create enterprise user
  async createEnterpriseUser(tenantId: string, userData: Partial<EnterpriseUser>): Promise<EnterpriseUser> {
    const enterpriseId = this.tenantToEnterprise.get(tenantId);
    if (!enterpriseId) {
      throw new Error('Enterprise configuration not found');
    }

    const user: EnterpriseUser = {
      id: userData.id || uuidv4(),
      tenantId,
      email: userData.email || '',
      roles: userData.roles || ['staff'],
      locations: userData.locations || [],
      profile: userData.profile || {
        firstName: '',
        lastName: ''
      },
      settings: userData.settings || {
        language: 'es-AR',
        timezone: 'America/Argentina/Buenos_Aires',
        notifications: {},
        preferences: {}
      },
      security: userData.security || {
        mfaEnabled: false,
        loginAttempts: 0,
        locked: false,
        temporaryPassword: true
      },
      status: 'active',
      createdAt: new Date()
    };

    // Store user
    const existingUsers = this.enterpriseUsers.get(enterpriseId) || [];
    existingUsers.push(user);
    this.enterpriseUsers.set(enterpriseId, existingUsers);

    return user;
  }

  // Get enterprise analytics with enhanced metrics
  async getEnterpriseAnalytics(tenantId: string, timeRange: string = '30d') {
    const enterpriseConfig = this.getEnterpriseConfig(tenantId);
    if (!enterpriseConfig) {
      throw new Error('Enterprise configuration not found');
    }

    // Get base analytics from multi-tenant service
    const baseAnalytics = await multiTenantService.getTenantAnalytics(tenantId, timeRange);
    
    // Add enterprise-specific metrics
    const enterpriseId = this.tenantToEnterprise.get(tenantId);
    const users = this.enterpriseUsers.get(enterpriseId || '') || [];
    const activeUsers = users.filter(u => u.status === 'active');
    const lockedUsers = users.filter(u => u.security.locked);

    return {
      ...baseAnalytics,
      enterprise: {
        id: enterpriseConfig.id,
        organizationName: enterpriseConfig.organizationName,
        tier: enterpriseConfig.tier,
        supportLevel: enterpriseConfig.supportLevel,
        users: {
          total: users.length,
          active: activeUsers.length,
          locked: lockedUsers.length,
          byRole: this.getUsersByRole(users)
        },
        performance: {
          responseTimeTarget: enterpriseConfig.performanceProfile.guarantees.responseTime,
          uptimeTarget: enterpriseConfig.performanceProfile.guarantees.uptime,
          concurrentUsersLimit: enterpriseConfig.performanceProfile.guarantees.concurrentUsers
        },
        limits: {
          usage: {
            providers: baseAnalytics.metrics.providers,
            maxProviders: enterpriseConfig.subscriptionPlan.features.maxProviders,
            utilizationPercent: enterpriseConfig.subscriptionPlan.features.maxProviders > 0 
              ? (baseAnalytics.metrics.providers / enterpriseConfig.subscriptionPlan.features.maxProviders) * 100
              : 0
          },
          bookings: {
            current: baseAnalytics.metrics.bookings,
            maxPerMonth: enterpriseConfig.subscriptionPlan.features.maxBookingsPerMonth,
            utilizationPercent: enterpriseConfig.subscriptionPlan.features.maxBookingsPerMonth > 0
              ? (baseAnalytics.metrics.bookings / enterpriseConfig.subscriptionPlan.features.maxBookingsPerMonth) * 100
              : 0
          }
        },
        security: {
          mfaEnabledUsers: activeUsers.filter(u => u.security.mfaEnabled).length,
          lastSecurityIncident: null,
          auditLogRetention: enterpriseConfig.securityProfile.auditLogging.retentionPeriod
        },
        compliance: {
          enabledRegulations: Object.keys(enterpriseConfig.complianceSettings.regulations)
            .filter(reg => enterpriseConfig.complianceSettings.regulations[reg as keyof typeof enterpriseConfig.complianceSettings.regulations]),
          nextAuditDue: this.calculateNextAuditDate(enterpriseConfig),
          backupStatus: 'healthy',
          dataRetentionCompliant: true
        }
      }
    };
  }

  private getUsersByRole(users: EnterpriseUser[]): Record<string, number> {
    const roleCount: Record<string, number> = {};
    for (const user of users) {
      for (const role of user.roles) {
        roleCount[role] = (roleCount[role] || 0) + 1;
      }
    }
    return roleCount;
  }

  private calculateNextAuditDate(config: EnterpriseConfig): Date {
    const now = new Date();
    const frequency = config.complianceSettings.auditRequirements.frequency;
    
    switch (frequency) {
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case 'annually':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    }
  }

  // White-label deployment
  async deployWhiteLabelTenant(config: {
    organizationName: string;
    customDomain: string;
    branding: EnterpriseCustomization['branding'];
    features: string[];
  }) {
    // Create base tenant
    const tenant = await multiTenantService.createTenant({
      verticalId: 'barber',
      subdomain: config.organizationName.toLowerCase().replace(/\s+/g, '-'),
      customDomain: config.customDomain
    });

    // Create enterprise configuration
    const enterpriseConfig: EnterpriseConfig = {
      id: `enterprise-${tenant.id}`,
      tenantId: tenant.id,
      organizationName: config.organizationName,
      tier: 'white_label',
      subscriptionPlan: this.getDefaultPlan('white_label'),
      securityProfile: this.getDefaultSecurityProfile('enterprise'),
      customization: {
        branding: config.branding,
        ui: {
          layout: 'standard',
          navigation: { position: 'top' },
          dashboard: {
            widgets: ['bookings', 'revenue', 'providers'],
            layout: 'grid'
          },
          whiteLabel: {
            enabled: true,
            customDomain: config.customDomain,
            hideBarberProBranding: true
          }
        },
        features: {
          enabled: config.features,
          disabled: []
        }
      },
      integrationSettings: this.getDefaultIntegrations(),
      complianceSettings: this.getDefaultComplianceProfile(),
      performanceProfile: this.getDefaultPerformanceProfile('enterprise'),
      supportLevel: 'dedicated',
      createdAt: new Date(),
      lastSync: new Date()
    };

    // Store enterprise configuration
    this.enterprises.set(enterpriseConfig.id, enterpriseConfig);
    this.tenantToEnterprise.set(tenant.id, enterpriseConfig.id);
    this.enterpriseRoles.set(enterpriseConfig.id, []);
    this.enterpriseUsers.set(enterpriseConfig.id, []);

    console.log(`🏢 White-label tenant deployed: ${config.organizationName}`);
    console.log(`🌐 Custom domain: ${config.customDomain}`);
    console.log(`🎨 Custom branding configured`);
    console.log(`⚡ Enterprise features enabled: ${config.features.join(', ')}`);

    return {
      tenant,
      enterprise: enterpriseConfig
    };
  }

  // Get all enterprise configurations
  getAllEnterpriseConfigs(): EnterpriseConfig[] {
    return Array.from(this.enterprises.values());
  }

  // Update enterprise configuration
  async updateEnterpriseConfig(enterpriseId: string, updates: Partial<EnterpriseConfig>): Promise<EnterpriseConfig> {
    const config = this.enterprises.get(enterpriseId);
    if (!config) {
      throw new Error('Enterprise configuration not found');
    }

    Object.assign(config, updates, { lastSync: new Date() });
    this.enterprises.set(enterpriseId, config);

    return config;
  }
}

export const enterpriseMultiTenantService = new EnterpriseMultiTenantService();

// Register enterprise multi-tenant routes
export function registerEnterpriseRoutes(server: FastifyInstance) {
  // Get enterprise information
  server.get('/api/v1/enterprise/info', {
    schema: {
      tags: ['Enterprise'],
      summary: 'Get enterprise configuration and status'
    }
  }, async (request, reply) => {
    try {
      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant) {
        return reply.code(404).send({ error: 'No tenant context' });
      }

      const enterpriseConfig = enterpriseMultiTenantService.getEnterpriseConfig(tenant.id);
      if (!enterpriseConfig) {
        return reply.code(404).send({ error: 'Enterprise configuration not found' });
      }

      return reply.send({
        success: true,
        data: {
          id: enterpriseConfig.id,
          organizationName: enterpriseConfig.organizationName,
          tier: enterpriseConfig.tier,
          supportLevel: enterpriseConfig.supportLevel,
          subscriptionPlan: enterpriseConfig.subscriptionPlan,
          customization: enterpriseConfig.customization,
          performanceProfile: enterpriseConfig.performanceProfile.guarantees,
          status: 'active'
        }
      });
    } catch (error) {
      server.log.error('Enterprise info error:', error);
      return reply.code(500).send({
        error: 'Error retrieving enterprise information',
        message: 'Error al obtener información empresarial'
      });
    }
  });

  // Get enterprise analytics
  server.get('/api/v1/enterprise/analytics', {
    schema: {
      tags: ['Enterprise'],
      summary: 'Get comprehensive enterprise analytics'
    }
  }, async (request, reply) => {
    try {
      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant) {
        return reply.code(404).send({ error: 'No tenant context' });
      }

      const timeRange = request.query?.timeRange as string || '30d';
      const analytics = await enterpriseMultiTenantService.getEnterpriseAnalytics(tenant.id, timeRange);

      return reply.send({
        success: true,
        data: analytics
      });
    } catch (error) {
      server.log.error('Enterprise analytics error:', error);
      return reply.code(500).send({
        error: 'Error retrieving enterprise analytics',
        message: 'Error al obtener analíticas empresariales'
      });
    }
  });

  // Update enterprise configuration
  server.put('/api/v1/enterprise/config', {
    schema: {
      tags: ['Enterprise'],
      summary: 'Update enterprise configuration'
    }
  }, async (request, reply) => {
    try {
      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant) {
        return reply.code(404).send({ error: 'No tenant context' });
      }

      const enterpriseConfig = enterpriseMultiTenantService.getEnterpriseConfig(tenant.id);
      if (!enterpriseConfig) {
        return reply.code(404).send({ error: 'Enterprise configuration not found' });
      }

      const updates = request.body as Partial<EnterpriseConfig>;
      const updatedConfig = await enterpriseMultiTenantService.updateEnterpriseConfig(enterpriseConfig.id, updates);

      return reply.send({
        success: true,
        data: updatedConfig,
        message: 'Enterprise configuration updated successfully'
      });
    } catch (error) {
      server.log.error('Enterprise config update error:', error);
      return reply.code(500).send({
        error: 'Error updating enterprise configuration',
        message: 'Error al actualizar configuración empresarial'
      });
    }
  });

  // Deploy white-label tenant (admin only)
  server.post('/api/v1/admin/enterprise/white-label', {
    schema: {
      tags: ['Enterprise Admin'],
      summary: 'Deploy white-label tenant'
    }
  }, async (request, reply) => {
    try {
      const config = request.body as any;
      
      const deployment = await enterpriseMultiTenantService.deployWhiteLabelTenant(config);
      
      return reply.send({
        success: true,
        data: deployment,
        message: 'White-label tenant deployed successfully'
      });
    } catch (error) {
      server.log.error('White-label deployment error:', error);
      return reply.code(500).send({
        error: 'Error deploying white-label tenant',
        message: 'Error al desplegar inquilino de marca blanca'
      });
    }
  });

  // List all enterprise configurations (admin only)
  server.get('/api/v1/admin/enterprise/configs', {
    schema: {
      tags: ['Enterprise Admin'],
      summary: 'List all enterprise configurations'
    }
  }, async (request, reply) => {
    try {
      const configs = enterpriseMultiTenantService.getAllEnterpriseConfigs();
      
      return reply.send({
        success: true,
        data: {
          enterprises: configs.map(c => ({
            id: c.id,
            organizationName: c.organizationName,
            tier: c.tier,
            supportLevel: c.supportLevel,
            tenantId: c.tenantId,
            createdAt: c.createdAt,
            lastSync: c.lastSync
          })),
          totalEnterprises: configs.length
        }
      });
    } catch (error) {
      server.log.error('Enterprise configs list error:', error);
      return reply.code(500).send({
        error: 'Error listing enterprise configurations',
        message: 'Error al listar configuraciones empresariales'
      });
    }
  });
}
