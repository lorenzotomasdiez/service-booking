/**
 * Enterprise Integration & Partnership Platform Mock Data
 * Supporting Q10-001 Integration Platform Testing
 */

export interface PartnerTestData {
    whitelabelPartners: WhitelabelPartner[];
    b2bPartners: B2BPartner[];
    webhookEndpoints: WebhookEndpoint[];
    integrationSystems: IntegrationSystem[];
}

export interface WhitelabelPartner {
    id: string;
    name: string;
    type: 'WHITELABEL';
    configuration: {
        branding: any;
        customization: any;
        features: any;
        businessRules: any;
    };
    deploymentStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    accessToken: string;
}

export interface B2BPartner {
    id: string;
    name: string;
    type: 'B2B_INTEGRATION';
    apiKey: string;
    apiSecret: string;
    clientId: string;
    clientSecret: string;
    permissions: string[];
    accessToken: string;
    rateLimits: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
}

export interface WebhookEndpoint {
    id: string;
    partnerId: string;
    url: string;
    secret: string;
    events: string[];
    status: 'ACTIVE' | 'INACTIVE' | 'FAILED';
    deliveryStats: {
        totalDeliveries: number;
        successfulDeliveries: number;
        failedDeliveries: number;
        averageResponseTime: number;
    };
}

export interface IntegrationSystem {
    id: string;
    name: string;
    type: 'CRM' | 'ERP' | 'PAYMENT' | 'ANALYTICS';
    configuration: any;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    syncStatus: {
        lastSync: string;
        nextSync: string;
        syncAccuracy: number;
    };
}

export class MockExternalSystems {
    private systems: Map<string, any> = new Map();
    
    async initialize(): Promise<void> {
        // Mock HubSpot CRM
        this.systems.set('hubspot', {
            apiEndpoint: 'https://api.hubapi.com',
            status: 'CONNECTED',
            version: '3.0',
            capabilities: ['contacts', 'deals', 'activities', 'webhooks'],
            rateLimits: {
                requestsPerSecond: 10,
                dailyLimit: 40000
            },
            responseLatency: 150, // ms
            reliability: 0.998
        });
        
        // Mock SAP ERP
        this.systems.set('sap', {
            apiEndpoint: 'https://sap.enterprise.com/api',
            status: 'CONNECTED',
            version: '4.6',
            capabilities: ['customers', 'invoices', 'payments', 'reporting'],
            rateLimits: {
                requestsPerSecond: 5,
                dailyLimit: 10000
            },
            responseLatency: 300, // ms
            reliability: 0.995
        });
        
        // Mock External Provider System
        this.systems.set('external_provider', {
            apiEndpoint: 'https://external-provider.com/api',
            status: 'CONNECTED',
            version: '2.1',
            capabilities: ['booking', 'availability', 'services', 'pricing'],
            rateLimits: {
                requestsPerSecond: 20,
                dailyLimit: 100000
            },
            responseLatency: 200, // ms
            reliability: 0.992
        });
    }
    
    async simulateRequest(systemId: string, endpoint: string, method: string = 'GET', data?: any): Promise<any> {
        const system = this.systems.get(systemId);
        if (!system) {
            throw new Error(`System ${systemId} not found`);
        }
        
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, system.responseLatency + Math.random() * 50));
        
        // Simulate reliability (occasional failures)
        if (Math.random() > system.reliability) {
            throw new Error(`External system ${systemId} temporarily unavailable`);
        }
        
        // Mock responses based on system and endpoint
        return this.generateMockResponse(systemId, endpoint, method, data);
    }
    
    private generateMockResponse(systemId: string, endpoint: string, method: string, data?: any): any {
        switch (systemId) {
            case 'hubspot':
                return this.generateHubSpotResponse(endpoint, method, data);
            case 'sap':
                return this.generateSAPResponse(endpoint, method, data);
            case 'external_provider':
                return this.generateExternalProviderResponse(endpoint, method, data);
            default:
                return { success: true, data: null };
        }
    }
    
    private generateHubSpotResponse(endpoint: string, method: string, data?: any): any {
        if (endpoint.includes('/contacts')) {
            if (method === 'GET') {
                return {
                    results: Array.from({ length: 10 }, (_, i) => ({
                        id: `hubspot-contact-${i}`,
                        properties: {
                            email: `contact${i}@example.com`,
                            firstname: `Contact ${i}`,
                            lastname: `LastName ${i}`,
                            phone: `+5491123456${String(i).padStart(3, '0')}`
                        },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })),
                    total: 10
                };
            } else if (method === 'POST') {
                return {
                    id: `hubspot-contact-${Date.now()}`,
                    properties: data?.properties || {},
                    createdAt: new Date().toISOString()
                };
            }
        }
        
        return { success: true, message: 'HubSpot API response' };
    }
    
    private generateSAPResponse(endpoint: string, method: string, data?: any): any {
        if (endpoint.includes('/customers')) {
            if (method === 'GET') {
                return {
                    customers: Array.from({ length: 5 }, (_, i) => ({
                        customerNumber: `SAP-CUST-${String(i).padStart(6, '0')}`,
                        name: `SAP Customer ${i}`,
                        taxId: `20-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}-5`,
                        address: {
                            street: `Street ${i}`,
                            city: 'Buenos Aires',
                            country: 'AR'
                        },
                        creditLimit: 100000 + Math.random() * 500000,
                        paymentTerms: 'NET30'
                    })),
                    totalCount: 5
                };
            }
        }
        
        if (endpoint.includes('/invoices')) {
            return {
                invoices: Array.from({ length: 3 }, (_, i) => ({
                    invoiceNumber: `INV-${Date.now()}-${i}`,
                    customerNumber: `SAP-CUST-${String(i).padStart(6, '0')}`,
                    amount: 1000 + Math.random() * 10000,
                    currency: 'ARS',
                    status: 'POSTED',
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })),
                totalAmount: 15000
            };
        }
        
        return { success: true, message: 'SAP ERP response' };
    }
    
    private generateExternalProviderResponse(endpoint: string, method: string, data?: any): any {
        if (endpoint.includes('/booking')) {
            if (method === 'POST') {
                return {
                    bookingId: `ext-booking-${Date.now()}`,
                    status: 'CONFIRMED',
                    confirmationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
                    providerResponse: {
                        accepted: true,
                        proposedDateTime: data?.preferredDateTime || new Date().toISOString(),
                        alternativeSlots: [
                            new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                            new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
                        ]
                    }
                };
            }
        }
        
        if (endpoint.includes('/availability')) {
            return {
                availableSlots: Array.from({ length: 10 }, (_, i) => ({
                    startTime: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(),
                    serviceId: 'premium-cut',
                    price: 3500 + Math.random() * 1000
                })),
                lastUpdated: new Date().toISOString()
            };
        }
        
        return { success: true, message: 'External provider response' };
    }
}

export async function createPartnerTestData(): Promise<PartnerTestData> {
    const whitelabelPartners: WhitelabelPartner[] = Array.from({ length: 3 }, (_, i) => ({
        id: `whitelabel-partner-${i}`,
        name: `WhiteLabel Partner ${i}`,
        type: 'WHITELABEL',
        configuration: {
            branding: {
                primaryColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                secondaryColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                logo: `https://partner${i}.com/logo.svg`,
                companyName: `Partner Company ${i}`
            },
            customization: {
                domain: `partner${i}.barberpro.com`,
                customFooter: true,
                hideBarberProBranding: i > 0
            },
            features: {
                enabledServices: ['haircut', 'styling', 'beard-work'],
                paymentMethods: ['mercadopago', 'stripe'],
                languages: ['es-AR', 'en']
            },
            businessRules: {
                bookingWindow: 30,
                cancellationPolicy: '24h',
                loyaltyProgram: true
            }
        },
        deploymentStatus: 'ACTIVE',
        accessToken: `whitelabel-token-${i}`
    }));
    
    const b2bPartners: B2BPartner[] = Array.from({ length: 2 }, (_, i) => ({
        id: `b2b-partner-${i}`,
        name: `B2B Partner ${i}`,
        type: 'B2B_INTEGRATION',
        apiKey: `api-key-${i}-${Math.random().toString(36).substring(7)}`,
        apiSecret: `api-secret-${i}-${Math.random().toString(36).substring(7)}`,
        clientId: `client-id-${i}`,
        clientSecret: `client-secret-${i}-${Math.random().toString(36).substring(7)}`,
        permissions: [
            'read:bookings',
            'write:bookings',
            'read:analytics',
            'read:customers',
            'write:webhooks'
        ],
        accessToken: `b2b-token-${i}`,
        rateLimits: {
            requestsPerMinute: 100 + i * 50,
            requestsPerHour: 5000 + i * 2500,
            requestsPerDay: 100000 + i * 50000
        }
    }));
    
    const webhookEndpoints: WebhookEndpoint[] = Array.from({ length: 5 }, (_, i) => ({
        id: `webhook-${i}`,
        partnerId: i < 3 ? `whitelabel-partner-${i}` : `b2b-partner-${i-3}`,
        url: `https://partner${i}.com/webhooks/barberpro`,
        secret: `webhook-secret-${i}-${Math.random().toString(36).substring(7)}`,
        events: ['booking.created', 'booking.updated', 'payment.completed', 'user.updated'].slice(0, 2 + Math.floor(Math.random() * 2)),
        status: 'ACTIVE',
        deliveryStats: {
            totalDeliveries: Math.floor(Math.random() * 1000) + 100,
            successfulDeliveries: Math.floor(Math.random() * 950) + 95,
            failedDeliveries: Math.floor(Math.random() * 50),
            averageResponseTime: 150 + Math.random() * 100 // 150-250ms
        }
    }));
    
    const integrationSystems: IntegrationSystem[] = [
        {
            id: 'hubspot-integration',
            name: 'HubSpot CRM',
            type: 'CRM',
            configuration: {
                apiEndpoint: 'https://api.hubapi.com',
                portalId: '12345678',
                accessToken: 'hubspot-token-secret'
            },
            status: 'CONNECTED',
            syncStatus: {
                lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
                nextSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
                syncAccuracy: 0.98 + Math.random() * 0.02 // 98-100%
            }
        },
        {
            id: 'sap-integration',
            name: 'SAP ERP',
            type: 'ERP',
            configuration: {
                apiEndpoint: 'https://sap.enterprise.com/api',
                clientId: 'SAP_CLIENT_123',
                systemId: 'PRD'
            },
            status: 'CONNECTED',
            syncStatus: {
                lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                nextSync: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                syncAccuracy: 0.96 + Math.random() * 0.04 // 96-100%
            }
        }
    ];
    
    return {
        whitelabelPartners,
        b2bPartners,
        webhookEndpoints,
        integrationSystems
    };
}

export class MockWebhookDeliverySystem {
    private deliveryQueue: Array<{
        id: string;
        webhookId: string;
        event: string;
        payload: any;
        attempts: number;
        status: 'PENDING' | 'DELIVERED' | 'FAILED';
        nextRetry?: Date;
    }> = [];
    
    async deliverWebhook(webhookId: string, event: string, payload: any): Promise<{
        deliveryId: string;
        status: 'DELIVERED' | 'FAILED';
        attempts: number;
        responseTime: number;
    }> {
        const deliveryId = `delivery-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const startTime = Date.now();
        
        // Simulate webhook delivery with retry logic
        let attempts = 1;
        let status: 'DELIVERED' | 'FAILED' = 'DELIVERED';
        
        // Simulate occasional failures (10% failure rate on first attempt)
        if (Math.random() < 0.1) {
            attempts = 3; // Simulate 2 retries
            status = Math.random() < 0.8 ? 'DELIVERED' : 'FAILED'; // 80% success after retries
        }
        
        const responseTime = Date.now() - startTime + Math.random() * 200; // Add some latency
        
        this.deliveryQueue.push({
            id: deliveryId,
            webhookId,
            event,
            payload,
            attempts,
            status,
            nextRetry: status === 'FAILED' ? new Date(Date.now() + 5000) : undefined // Retry in 5 seconds
        });
        
        return {
            deliveryId,
            status,
            attempts,
            responseTime
        };
    }
    
    async getDeliveryHistory(webhookId: string, filters?: {
        eventType?: string;
        status?: string;
        timeRange?: string;
    }): Promise<any[]> {
        let deliveries = this.deliveryQueue.filter(d => d.webhookId === webhookId);
        
        if (filters?.eventType) {
            deliveries = deliveries.filter(d => d.event === filters.eventType);
        }
        
        if (filters?.status) {
            deliveries = deliveries.filter(d => d.status === filters.status);
        }
        
        return deliveries.map(d => ({
            id: d.id,
            eventType: d.event,
            status: d.status,
            attempts: d.attempts,
            responseCode: d.status === 'DELIVERED' ? 200 : 500,
            deliveredAt: new Date(Date.now() - Math.random() * 60000).toISOString(), // Random time in last minute
            retrySchedule: d.attempts > 1 ? [
                { attempt: 1, delaySeconds: 5 },
                { attempt: 2, delaySeconds: 25 },
                { attempt: 3, delaySeconds: 125 }
            ].slice(0, d.attempts) : []
        }));
    }
}

export const mockExternalSystems = new MockExternalSystems();
export const mockWebhookSystem = new MockWebhookDeliverySystem();