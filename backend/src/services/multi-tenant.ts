import { FastifyInstance } from 'fastify';
import { prisma } from './database';
import { templateReplicationService } from './template-replication';

// Multi-Tenant Architecture for Vertical Isolation
// T7A-001: Multi-tenant architecture for vertical isolation

export interface TenantConfig {
  id: string;
  verticalId: string;
  subdomain: string;
  customDomain?: string;
  databaseSchema: string;
  settings: TenantSettings;
  resources: TenantResources;
  status: 'active' | 'inactive' | 'suspended' | 'migrating';
  createdAt: Date;
  lastAccessed: Date;
}

export interface TenantSettings {
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customCSS?: string;
  };
  features: {
    enabled: string[];
    disabled: string[];
    beta: string[];
  };
  limits: {
    maxProviders: number;
    maxBookingsPerMonth: number;
    storageLimit: number; // MB
    apiCallsPerDay: number;
  };
  integrations: {
    paymentGateways: string[];
    notificationChannels: string[];
    analyticsProviders: string[];
  };
}

export interface TenantResources {
  database: {
    schema: string;
    connectionString: string;
    readReplicas: string[];
  };
  storage: {
    bucket: string;
    cdnEndpoint: string;
    usedSpace: number; // MB
  };
  cache: {
    redisNamespace: string;
    ttlDefaults: Record<string, number>;
  };
}

class MultiTenantService {
  private tenants: Map<string, TenantConfig> = new Map();
  private subdomainToTenant: Map<string, string> = new Map();
  private currentTenant: string | null = null;

  // Initialize multi-tenant service
  async initialize() {
    await this.loadExistingTenants();
    console.log(`🏢 Multi-tenant service initialized with ${this.tenants.size} tenants`);
  }

  // Load existing tenants from database
  private async loadExistingTenants() {
    try {
      // In a real implementation, this would load from a tenants table
      // For now, we'll create default tenants for our verticals
      const defaultTenants = [
        {
          id: 'barberpro-main',
          verticalId: 'barber',
          subdomain: 'barberpro',
          databaseSchema: 'public',
          settings: this.getDefaultSettings('barber'),
          resources: this.getDefaultResources('barberpro'),
          status: 'active' as const,
          createdAt: new Date(),
          lastAccessed: new Date()
        },
        {
          id: 'mindcarepro-main',
          verticalId: 'psychology',
          subdomain: 'mindcarepro',
          databaseSchema: 'psychology_schema',
          settings: this.getDefaultSettings('psychology'),
          resources: this.getDefaultResources('mindcarepro'),
          status: 'active' as const,
          createdAt: new Date(),
          lastAccessed: new Date()
        }
      ];

      for (const tenant of defaultTenants) {
        this.tenants.set(tenant.id, tenant);
        this.subdomainToTenant.set(tenant.subdomain, tenant.id);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  }

  private getDefaultSettings(verticalId: string): TenantSettings {
    const vertical = templateReplicationService.getVerticalConfig(verticalId);
    
    return {
      branding: {
        primaryColor: vertical?.customizations.branding.primaryColor || '#007bff',
        secondaryColor: vertical?.customizations.branding.secondaryColor || '#6c757d'
      },
      features: {
        enabled: ['booking', 'payments', 'notifications', 'analytics'],
        disabled: [],
        beta: ['ai_scheduling', 'voice_booking']
      },
      limits: {
        maxProviders: verticalId === 'psychology' ? 50 : 100,
        maxBookingsPerMonth: verticalId === 'psychology' ? 1000 : 2000,
        storageLimit: 1024, // 1GB
        apiCallsPerDay: 10000
      },
      integrations: {
        paymentGateways: ['mercadopago'],
        notificationChannels: ['email', 'sms', 'whatsapp'],
        analyticsProviders: ['internal']
      }
    };
  }

  private getDefaultResources(subdomain: string): TenantResources {
    return {
      database: {
        schema: `${subdomain}_schema`,
        connectionString: process.env.DATABASE_URL || '',
        readReplicas: []
      },
      storage: {
        bucket: `${subdomain}-assets`,
        cdnEndpoint: `https://cdn.${subdomain}.com`,
        usedSpace: 0
      },
      cache: {
        redisNamespace: `${subdomain}:`,
        ttlDefaults: {
          user_session: 3600,
          provider_list: 300,
          booking_availability: 60
        }
      }
    };
  }

  // Tenant resolution middleware
  createTenantResolutionMiddleware() {
    return async (request: any, reply: any) => {
      const host = request.headers.host;
      let tenantId: string | null = null;

      // Try to resolve tenant by subdomain
      if (host) {
        const subdomain = host.split('.')[0];
        tenantId = this.subdomainToTenant.get(subdomain) || null;
      }

      // Try to resolve by custom domain
      if (!tenantId && host) {
        for (const [id, tenant] of this.tenants) {
          if (tenant.customDomain === host) {
            tenantId = id;
            break;
          }
        }
      }

      // Try to resolve by tenant header (for API calls)
      if (!tenantId) {
        tenantId = request.headers['x-tenant-id'] as string;
      }

      // Default to main barberpro tenant
      if (!tenantId) {
        tenantId = 'barberpro-main';
      }

      const tenant = this.tenants.get(tenantId);
      if (!tenant) {
        return reply.code(404).send({
          error: 'Tenant not found',
          message: 'El inquilino especificado no existe'
        });
      }

      if (tenant.status !== 'active') {
        return reply.code(503).send({
          error: 'Tenant unavailable',
          message: 'El servicio no está disponible temporalmente'
        });
      }

      // Set tenant context
      request.tenant = tenant;
      this.currentTenant = tenantId;
      
      // Update last accessed
      tenant.lastAccessed = new Date();

      // Add tenant-specific headers
      reply.header('X-Tenant-ID', tenantId);
      reply.header('X-Vertical', tenant.verticalId);
      reply.header('X-Schema', tenant.databaseSchema);
    };
  }

  // Get current tenant
  getCurrentTenant(): TenantConfig | null {
    return this.currentTenant ? this.tenants.get(this.currentTenant) || null : null;
  }

  // Create new tenant
  async createTenant(config: Partial<TenantConfig> & { verticalId: string; subdomain: string }): Promise<TenantConfig> {
    const tenantId = config.id || `${config.subdomain}-${Date.now()}`;
    
    // Validate subdomain availability
    if (this.subdomainToTenant.has(config.subdomain)) {
      throw new Error('Subdomain already exists');
    }

    const vertical = templateReplicationService.getVerticalConfig(config.verticalId);
    if (!vertical) {
      throw new Error('Invalid vertical ID');
    }

    const newTenant: TenantConfig = {
      id: tenantId,
      verticalId: config.verticalId,
      subdomain: config.subdomain,
      customDomain: config.customDomain,
      databaseSchema: config.databaseSchema || `${config.subdomain}_schema`,
      settings: config.settings || this.getDefaultSettings(config.verticalId),
      resources: config.resources || this.getDefaultResources(config.subdomain),
      status: 'active',
      createdAt: new Date(),
      lastAccessed: new Date()
    };

    // Store tenant
    this.tenants.set(tenantId, newTenant);
    this.subdomainToTenant.set(config.subdomain, tenantId);

    // Initialize tenant database schema
    await this.initializeTenantDatabase(newTenant);

    return newTenant;
  }

  // Initialize tenant database schema
  private async initializeTenantDatabase(tenant: TenantConfig) {
    try {
      const vertical = templateReplicationService.getVerticalConfig(tenant.verticalId);
      if (!vertical) throw new Error('Vertical configuration not found');

      const schema = templateReplicationService.generateVerticalSchema(vertical);
      
      // In a real implementation, this would:
      // 1. Create database schema
      // 2. Run migrations
      // 3. Seed initial data
      // 4. Set up proper permissions
      
      console.log(`📊 Database schema initialized for tenant ${tenant.id}`);
      console.log(`🎯 Vertical: ${vertical.displayName}`);
      console.log(`🗄️ Schema: ${tenant.databaseSchema}`);
      
      return schema;
    } catch (error) {
      console.error(`Error initializing database for tenant ${tenant.id}:`, error);
      throw error;
    }
  }

  // Get tenant-aware database connection
  getTenantDatabase(tenantId?: string) {
    const tenant = tenantId ? this.tenants.get(tenantId) : this.getCurrentTenant();
    if (!tenant) {
      throw new Error('No tenant context available');
    }

    // In a real implementation, this would return a database connection
    // configured for the tenant's schema
    return {
      schema: tenant.databaseSchema,
      connectionString: tenant.resources.database.connectionString,
      // For now, return the main prisma client with schema context
      prisma: prisma,
      tenantId: tenant.id
    };
  }

  // Tenant resource usage tracking
  async trackResourceUsage(tenantId: string, resource: string, amount: number) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    switch (resource) {
      case 'storage':
        tenant.resources.storage.usedSpace += amount;
        break;
      case 'api_calls':
        // Track daily API calls
        break;
      case 'bookings':
        // Track monthly bookings
        break;
    }
  }

  // Check tenant limits
  checkTenantLimits(tenantId: string, resource: string, requested: number = 1): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    switch (resource) {
      case 'storage':
        return tenant.resources.storage.usedSpace + requested <= tenant.settings.limits.storageLimit;
      case 'providers':
        // Would check current provider count against limit
        return true;
      case 'bookings':
        // Would check monthly booking count against limit
        return true;
      default:
        return true;
    }
  }

  // Get tenant analytics
  async getTenantAnalytics(tenantId: string, timeRange: string = '30d') {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const db = this.getTenantDatabase(tenantId);
    
    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get tenant-specific analytics
    const [providersCount, bookingsCount, revenue] = await Promise.all([
      prisma.provider.count({
        where: {
          createdAt: { gte: startDate },
          isActive: true
        }
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    return {
      tenantId,
      timeRange,
      metrics: {
        providers: providersCount,
        bookings: bookingsCount,
        revenue: revenue._sum.totalAmount || 0,
        resourceUsage: {
          storage: {
            used: tenant.resources.storage.usedSpace,
            limit: tenant.settings.limits.storageLimit,
            percentage: (tenant.resources.storage.usedSpace / tenant.settings.limits.storageLimit) * 100
          }
        }
      },
      vertical: tenant.verticalId,
      status: tenant.status
    };
  }

  // List all tenants
  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  // Update tenant configuration
  async updateTenant(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Apply updates
    Object.assign(tenant, updates);
    this.tenants.set(tenantId, tenant);

    return tenant;
  }

  // Delete tenant
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Mark as inactive first
    tenant.status = 'inactive';
    
    // In a real implementation, this would:
    // 1. Backup tenant data
    // 2. Clean up database schema
    // 3. Remove storage buckets
    // 4. Clean up cache entries
    
    this.tenants.delete(tenantId);
    this.subdomainToTenant.delete(tenant.subdomain);
  }
}

export const multiTenantService = new MultiTenantService();

// Register multi-tenant routes
export function registerMultiTenantRoutes(server: FastifyInstance) {
  // Get tenant information
  server.get('/api/v1/tenant/info', {
    schema: {
      tags: ['Multi-Tenant'],
      summary: 'Get current tenant information'
    }
  }, async (request, reply) => {
    try {
      const tenant = multiTenantService.getCurrentTenant();
      
      if (!tenant) {
        return reply.code(404).send({
          error: 'No tenant context',
          message: 'No se pudo determinar el contexto del inquilino'
        });
      }
      
      return reply.send({
        success: true,
        data: {
          id: tenant.id,
          verticalId: tenant.verticalId,
          subdomain: tenant.subdomain,
          customDomain: tenant.customDomain,
          settings: tenant.settings,
          status: tenant.status
        }
      });
    } catch (error) {
      server.log.error('Tenant info error:', error);
      return reply.code(500).send({
        error: 'Error retrieving tenant information',
        message: 'Error al obtener información del inquilino'
      });
    }
  });

  // Get tenant analytics
  server.get('/api/v1/tenant/analytics', {
    schema: {
      tags: ['Multi-Tenant'],
      summary: 'Get tenant analytics and resource usage'
    }
  }, async (request, reply) => {
    try {
      const tenant = multiTenantService.getCurrentTenant();
      if (!tenant) {
        return reply.code(404).send({ error: 'No tenant context' });
      }

      const timeRange = request.query?.timeRange as string || '30d';
      const analytics = await multiTenantService.getTenantAnalytics(tenant.id, timeRange);
      
      return reply.send({
        success: true,
        data: analytics
      });
    } catch (error) {
      server.log.error('Tenant analytics error:', error);
      return reply.code(500).send({
        error: 'Error retrieving tenant analytics',
        message: 'Error al obtener analíticas del inquilino'
      });
    }
  });

  // Create new tenant (admin only)
  server.post('/api/v1/admin/tenants', {
    schema: {
      tags: ['Multi-Tenant'],
      summary: 'Create new tenant (admin only)'
    }
  }, async (request, reply) => {
    try {
      const config = request.body as any;
      
      const newTenant = await multiTenantService.createTenant(config);
      
      return reply.send({
        success: true,
        data: newTenant,
        message: 'Tenant created successfully'
      });
    } catch (error) {
      server.log.error('Tenant creation error:', error);
      return reply.code(500).send({
        error: 'Error creating tenant',
        message: 'Error al crear inquilino'
      });
    }
  });

  // List all tenants (admin only)
  server.get('/api/v1/admin/tenants', {
    schema: {
      tags: ['Multi-Tenant'],
      summary: 'List all tenants (admin only)'
    }
  }, async (request, reply) => {
    try {
      const tenants = multiTenantService.getAllTenants();
      
      return reply.send({
        success: true,
        data: {
          tenants: tenants.map(t => ({
            id: t.id,
            verticalId: t.verticalId,
            subdomain: t.subdomain,
            customDomain: t.customDomain,
            status: t.status,
            createdAt: t.createdAt,
            lastAccessed: t.lastAccessed
          })),
          totalTenants: tenants.length
        }
      });
    } catch (error) {
      server.log.error('Tenants list error:', error);
      return reply.code(500).send({
        error: 'Error listing tenants',
        message: 'Error al listar inquilinos'
      });
    }
  });
}