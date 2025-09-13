/**
 * Enterprise Testing Mock Data and Utilities
 * Supporting Q10-001 Enterprise Quality Assurance Testing
 */

export interface EnterpriseClient {
    id: string;
    name: string;
    tier: 'ENTERPRISE' | 'ENTERPRISE_PLUS' | 'ENTERPRISE_PREMIUM';
    locations: number;
    users: number;
    features: string[];
    slaRequirements: {
        responseTime: number;
        uptime: number;
        throughput: number;
    };
}

export interface Tenant {
    id: string;
    clientId: string;
    name: string;
    locations: string[];
    settings: {
        timezone: string;
        currency: string;
        locale: string;
    };
    accessToken: string;
}

export async function createMockEnterpriseClient(config: {
    name: string;
    locations: number;
    users: number;
    tier: 'ENTERPRISE' | 'ENTERPRISE_PLUS' | 'ENTERPRISE_PREMIUM';
}): Promise<EnterpriseClient> {
    return {
        id: `enterprise-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: config.name,
        tier: config.tier,
        locations: config.locations,
        users: config.users,
        features: [
            'MULTI_TENANT',
            'ADVANCED_ANALYTICS',
            'AI_FEATURES',
            'ENTERPRISE_BILLING',
            'BULK_OPERATIONS',
            'AUDIT_LOGGING',
            'WHITE_LABEL',
            'API_ACCESS',
            'PRIORITY_SUPPORT'
        ],
        slaRequirements: {
            responseTime: config.tier === 'ENTERPRISE_PREMIUM' ? 100 : 
                          config.tier === 'ENTERPRISE_PLUS' ? 150 : 200,
            uptime: config.tier === 'ENTERPRISE_PREMIUM' ? 99.99 : 
                   config.tier === 'ENTERPRISE_PLUS' ? 99.95 : 99.9,
            throughput: config.tier === 'ENTERPRISE_PREMIUM' ? 50000 : 
                       config.tier === 'ENTERPRISE_PLUS' ? 25000 : 10000
        }
    };
}

export async function createMockTenant(config: {
    clientId: string;
    name: string;
    locations: string[];
}): Promise<Tenant> {
    const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    return {
        id: tenantId,
        clientId: config.clientId,
        name: config.name,
        locations: config.locations,
        settings: {
            timezone: 'America/Argentina/Buenos_Aires',
            currency: 'ARS',
            locale: 'es-AR'
        },
        accessToken: `tenant-token-${tenantId}`
    };
}

export class MockEnterpriseDatabase {
    private tenantData: Map<string, any[]> = new Map();
    
    async isolatedQuery(tenantId: string, table: string, query: any = {}): Promise<any[]> {
        const key = `${tenantId}:${table}`;
        const data = this.tenantData.get(key) || [];
        
        // Simulate data isolation - only return data for the specific tenant
        return data.filter(item => {
            return Object.keys(query).every(field => {
                return !query[field] || item[field] === query[field];
            });
        });
    }
    
    async isolatedInsert(tenantId: string, table: string, data: any): Promise<any> {
        const key = `${tenantId}:${table}`;
        const existingData = this.tenantData.get(key) || [];
        
        const newItem = {
            ...data,
            id: `${table}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            tenantId,
            createdAt: new Date().toISOString()
        };
        
        existingData.push(newItem);
        this.tenantData.set(key, existingData);
        
        return newItem;
    }
    
    async validateDataIsolation(tenant1Id: string, tenant2Id: string): Promise<{
        isolated: boolean;
        crossTenantLeaks: number;
    }> {
        let crossTenantLeaks = 0;
        
        // Check all tables for cross-tenant data leaks
        for (const [key, data] of this.tenantData.entries()) {
            const [tenantId] = key.split(':');
            
            data.forEach(item => {
                if (item.tenantId !== tenantId) {
                    crossTenantLeaks++;
                }
            });
        }
        
        return {
            isolated: crossTenantLeaks === 0,
            crossTenantLeaks
        };
    }
}

export const mockEnterpriseDatabase = new MockEnterpriseDatabase();