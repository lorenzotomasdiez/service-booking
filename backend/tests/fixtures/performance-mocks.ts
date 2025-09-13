/**
 * Performance Testing Mock Data and Load Simulation Utilities
 * Supporting Q10-001 Enterprise Performance Validation
 */

export interface LoadTestScenarios {
    maxConcurrentUsers: number;
    testDuration: number;
    rampUpTime: number;
    scenarios: LoadTestScenario[];
}

export interface LoadTestScenario {
    name: string;
    weight: number; // Percentage of users running this scenario
    operations: LoadTestOperation[];
}

export interface LoadTestOperation {
    endpoint: string;
    method: string;
    payload?: any;
    expectedResponseTime: number;
    weight: number;
}

export class EnterpriseTrafficSimulator {
    private scenarios: Map<string, LoadTestScenario> = new Map();
    private metrics: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        peakMemoryUsage: number;
        peakCpuUsage: number;
    } = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        peakMemoryUsage: 0,
        peakCpuUsage: 0
    };

    constructor() {
        this.initializeScenarios();
    }

    private initializeScenarios(): void {
        // Booking flow scenario
        this.scenarios.set('booking_flow', {
            name: 'Complete Booking Flow',
            weight: 35,
            operations: [
                {
                    endpoint: '/api/enterprise/providers/search',
                    method: 'GET',
                    expectedResponseTime: 100,
                    weight: 20
                },
                {
                    endpoint: '/api/enterprise/availability/check',
                    method: 'POST',
                    payload: { providerId: 'test', date: '2024-09-15' },
                    expectedResponseTime: 120,
                    weight: 15
                },
                {
                    endpoint: '/api/enterprise/bookings',
                    method: 'POST',
                    payload: {
                        service: 'premium-cut',
                        dateTime: '2024-09-15T14:00:00Z',
                        providerId: 'test-provider'
                    },
                    expectedResponseTime: 150,
                    weight: 25
                },
                {
                    endpoint: '/api/enterprise/payments/process',
                    method: 'POST',
                    payload: { amount: 2500, currency: 'ARS', method: 'mercadopago' },
                    expectedResponseTime: 200,
                    weight: 40
                }
            ]
        });

        // Search heavy scenario
        this.scenarios.set('search_heavy', {
            name: 'Search and Discovery',
            weight: 25,
            operations: [
                {
                    endpoint: '/api/enterprise/providers/search',
                    method: 'GET',
                    expectedResponseTime: 80,
                    weight: 40
                },
                {
                    endpoint: '/api/ai/search/intelligent',
                    method: 'POST',
                    payload: {
                        query: 'premium barber near me',
                        location: { lat: -34.6118, lng: -58.3960 }
                    },
                    expectedResponseTime: 90,
                    weight: 30
                },
                {
                    endpoint: '/api/enterprise/services',
                    method: 'GET',
                    expectedResponseTime: 60,
                    weight: 20
                },
                {
                    endpoint: '/api/ai/recommendations/providers',
                    method: 'GET',
                    expectedResponseTime: 100,
                    weight: 10
                }
            ]
        });

        // Dashboard analytics scenario
        this.scenarios.set('dashboard_analytics', {
            name: 'Analytics and Dashboards',
            weight: 20,
            operations: [
                {
                    endpoint: '/api/enterprise/dashboard/overview',
                    method: 'GET',
                    expectedResponseTime: 150,
                    weight: 30
                },
                {
                    endpoint: '/api/enterprise/analytics/dashboard',
                    method: 'GET',
                    expectedResponseTime: 200,
                    weight: 25
                },
                {
                    endpoint: '/api/ai/analytics/business-intelligence',
                    method: 'GET',
                    expectedResponseTime: 180,
                    weight: 20
                },
                {
                    endpoint: '/api/enterprise/reports/performance',
                    method: 'GET',
                    expectedResponseTime: 250,
                    weight: 25
                }
            ]
        });

        // Payment processing scenario
        this.scenarios.set('payment_processing', {
            name: 'Payment Operations',
            weight: 20,
            operations: [
                {
                    endpoint: '/api/enterprise/payments/validate',
                    method: 'POST',
                    payload: { cardToken: 'test-token', amount: 2500 },
                    expectedResponseTime: 100,
                    weight: 30
                },
                {
                    endpoint: '/api/enterprise/payments/process',
                    method: 'POST',
                    payload: { amount: 2500, currency: 'ARS' },
                    expectedResponseTime: 180,
                    weight: 40
                },
                {
                    endpoint: '/api/enterprise/billing/invoice',
                    method: 'GET',
                    expectedResponseTime: 120,
                    weight: 20
                },
                {
                    endpoint: '/api/enterprise/payments/status',
                    method: 'GET',
                    expectedResponseTime: 80,
                    weight: 10
                }
            ]
        });
    }

    async simulateLoad(config: {
        concurrentUsers: number;
        duration: number;
        rampUpTime: number;
    }): Promise<any> {
        const startTime = Date.now();
        const endTime = startTime + config.duration;
        
        const results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [] as number[],
            throughput: 0,
            errorRate: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            peakMemoryUsage: 0,
            scenarioDistribution: new Map<string, number>()
        };

        // Initialize scenario distribution
        for (const [name, scenario] of this.scenarios) {
            results.scenarioDistribution.set(name, 0);
        }

        const requests: Promise<any>[] = [];

        // Generate load according to ramp-up pattern
        for (let user = 0; user < config.concurrentUsers; user++) {
            const rampUpDelay = (user / config.concurrentUsers) * config.rampUpTime;
            
            const userPromise = this.simulateUser(user, {
                startDelay: rampUpDelay,
                duration: config.duration - rampUpDelay,
                results
            });
            
            requests.push(userPromise);
        }

        await Promise.all(requests);

        // Calculate final metrics
        results.averageResponseTime = results.responseTimes.length > 0 
            ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
            : 0;
        
        results.p95ResponseTime = this.calculatePercentile(results.responseTimes, 95);
        results.p99ResponseTime = this.calculatePercentile(results.responseTimes, 99);
        results.throughput = results.totalRequests / (config.duration / 1000);
        results.errorRate = results.failedRequests / results.totalRequests;

        return results;
    }

    private async simulateUser(userId: number, config: {
        startDelay: number;
        duration: number;
        results: any;
    }): Promise<void> {
        // Wait for ramp-up delay
        await new Promise(resolve => setTimeout(resolve, config.startDelay));

        const userStartTime = Date.now();
        const userEndTime = userStartTime + config.duration;

        while (Date.now() < userEndTime) {
            // Select scenario based on weights
            const scenario = this.selectScenario();
            config.results.scenarioDistribution.set(
                scenario.name,
                (config.results.scenarioDistribution.get(scenario.name) || 0) + 1
            );

            // Execute scenario operations
            for (const operation of scenario.operations) {
                const operationStartTime = Date.now();
                
                try {
                    // Simulate operation execution
                    await this.simulateOperation(operation);
                    
                    const responseTime = Date.now() - operationStartTime;
                    config.results.totalRequests++;
                    config.results.successfulRequests++;
                    config.results.responseTimes.push(responseTime);
                    
                } catch (error) {
                    config.results.totalRequests++;
                    config.results.failedRequests++;
                }

                // Random delay between operations (realistic user behavior)
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            }

            // Random delay between scenario repetitions
            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));
        }
    }

    private selectScenario(): LoadTestScenario {
        const random = Math.random() * 100;
        let cumulative = 0;

        for (const scenario of this.scenarios.values()) {
            cumulative += scenario.weight;
            if (random <= cumulative) {
                return scenario;
            }
        }

        // Fallback to first scenario
        return Array.from(this.scenarios.values())[0];
    }

    private async simulateOperation(operation: LoadTestOperation): Promise<void> {
        // Simulate network latency and processing time
        const baseLatency = 10 + Math.random() * 40; // 10-50ms network latency
        const processingTime = operation.expectedResponseTime + (Math.random() - 0.5) * 40; // ±20ms variance
        
        await new Promise(resolve => setTimeout(resolve, baseLatency + processingTime));

        // Simulate occasional failures (2% failure rate)
        if (Math.random() < 0.02) {
            throw new Error(`Operation failed: ${operation.endpoint}`);
        }
    }

    private calculatePercentile(values: number[], percentile: number): number {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    getPerformanceReport(): any {
        return {
            summary: this.metrics,
            scenarios: Array.from(this.scenarios.entries()).map(([name, scenario]) => ({
                name,
                weight: scenario.weight,
                operations: scenario.operations.length
            })),
            recommendations: this.generatePerformanceRecommendations()
        };
    }

    private generatePerformanceRecommendations(): string[] {
        const recommendations = [];

        if (this.metrics.averageResponseTime > 200) {
            recommendations.push('Consider implementing response time optimization');
        }

        if (this.metrics.failedRequests / this.metrics.totalRequests > 0.01) {
            recommendations.push('Error rate exceeds acceptable threshold - investigate failures');
        }

        if (this.metrics.peakMemoryUsage > 1024) {
            recommendations.push('Memory usage is high - consider optimization');
        }

        return recommendations;
    }
}

export async function createLoadTestScenarios(config: {
    maxConcurrentUsers: number;
    testDuration: number;
    rampUpTime: number;
    scenarios: string[];
}): Promise<LoadTestScenarios> {
    const simulator = new EnterpriseTrafficSimulator();
    
    return {
        maxConcurrentUsers: config.maxConcurrentUsers,
        testDuration: config.testDuration,
        rampUpTime: config.rampUpTime,
        scenarios: config.scenarios.map(scenarioName => ({
            name: scenarioName,
            weight: 25, // Equal distribution
            operations: [
                {
                    endpoint: `/api/enterprise/${scenarioName}`,
                    method: 'GET',
                    expectedResponseTime: 150,
                    weight: 100
                }
            ]
        }))
    };
}

export const mockEnterpriseTraffic = new EnterpriseTrafficSimulator();