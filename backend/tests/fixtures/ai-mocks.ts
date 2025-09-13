/**
 * AI System Testing Mock Data and Machine Learning Utilities
 * Supporting Q10-001 AI System Quality Validation
 */

export interface AITestData {
    users: any[];
    providers: any[];
    bookings: any[];
    reviews: any[];
    behaviorPatterns: any[];
}

export class MockMLModels {
    private models: Map<string, any> = new Map();
    private trainingData: AITestData | null = null;
    
    async initialize(testData: AITestData): Promise<void> {
        this.trainingData = testData;
        
        // Initialize recommendation model
        this.models.set('recommendation', {
            accuracy: 0.92,
            version: '2.1.0',
            lastTrained: new Date(),
            features: ['user_preferences', 'historical_bookings', 'location', 'time_patterns'],
            performanceMetrics: {
                precision: 0.89,
                recall: 0.94,
                f1Score: 0.91
            }
        });
        
        // Initialize demand forecasting model
        this.models.set('demand_forecast', {
            accuracy: 0.88,
            version: '1.5.2',
            lastTrained: new Date(),
            features: ['seasonal_patterns', 'historical_demand', 'events', 'promotions'],
            performanceMetrics: {
                meanAbsoluteError: 0.12,
                rootMeanSquaredError: 0.18,
                r2Score: 0.86
            }
        });
        
        // Initialize personalization model
        this.models.set('personalization', {
            accuracy: 0.91,
            version: '3.0.1',
            lastTrained: new Date(),
            features: ['user_behavior', 'preferences', 'satisfaction_history', 'contextual_data'],
            performanceMetrics: {
                engagementIncrease: 0.34,
                satisfactionImprovement: 0.28,
                conversionRate: 0.67
            }
        });
    }
    
    async predict(modelType: string, input: any): Promise<any> {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model ${modelType} not found`);
        }
        
        switch (modelType) {
            case 'recommendation':
                return this.generateRecommendations(input);
            case 'demand_forecast':
                return this.generateDemandForecast(input);
            case 'personalization':
                return this.generatePersonalization(input);
            default:
                throw new Error(`Unknown model type: ${modelType}`);
        }
    }
    
    private async generateRecommendations(input: any): Promise<any> {
        const { location, serviceType, preferences } = input;
        
        // Mock recommendation generation with high accuracy
        const providers = Array.from({ length: 10 }, (_, i) => ({
            id: `provider-${i}`,
            name: `Provider ${i}`,
            relevanceScore: 0.8 + (Math.random() * 0.2), // 0.8-1.0 range
            matchFactors: [
                { factor: 'location', score: 0.9 },
                { factor: 'service_expertise', score: 0.85 + (Math.random() * 0.15) },
                { factor: 'user_preferences', score: 0.8 + (Math.random() * 0.2) },
                { factor: 'availability', score: 0.9 }
            ],
            estimatedSatisfaction: 4.2 + (Math.random() * 0.8), // 4.2-5.0 range
            confidenceLevel: 0.88 + (Math.random() * 0.12) // 0.88-1.0 range
        }));
        
        // Sort by relevance score
        providers.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return {
            providers: providers.slice(0, 5),
            relevanceScores: providers.slice(0, 5).map(p => p.relevanceScore),
            confidenceLevel: Math.min(...providers.slice(0, 5).map(p => p.confidenceLevel)),
            algorithmVersion: '2.1.0',
            processingTime: 45 + Math.random() * 30 // 45-75ms
        };
    }
    
    private async generateDemandForecast(input: any): Promise<any> {
        const { providerId, forecastPeriod, services, factors } = input;
        
        const predictions = [];
        const startDate = new Date(forecastPeriod.start);
        const endDate = new Date(forecastPeriod.end);
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const baselineDemo = 20 + Math.random() * 15; // 20-35 base demand
            const seasonalMultiplier = this.getSeasonalMultiplier(date);
            const weekdayMultiplier = this.getWeekdayMultiplier(date);
            
            const expectedDemand = Math.round(baselineDemo * seasonalMultiplier * weekdayMultiplier);
            const confidenceInterval = {
                lower: Math.round(expectedDemand * 0.85),
                upper: Math.round(expectedDemand * 1.15)
            };
            
            predictions.push({
                date: date.toISOString().split('T')[0],
                expectedDemand,
                confidenceInterval,
                factors: {
                    seasonal: seasonalMultiplier,
                    weekday: weekdayMultiplier,
                    events: 1.0,
                    promotions: 1.0
                }
            });
        }
        
        return {
            predictions,
            confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
            accuracy: {
                meanAbsoluteError: 0.10 + Math.random() * 0.08, // 0.10-0.18
                meanSquaredError: 0.15 + Math.random() * 0.1 // 0.15-0.25
            },
            factors: factors,
            modelVersion: '1.5.2'
        };
    }
    
    private async generatePersonalization(input: any): Promise<any> {
        const { userId, userHistory, contextData } = input;
        
        // Analyze user behavior patterns
        const behaviorAnalysis = {
            preferredServices: this.extractPreferredServices(userHistory),
            timePreferences: this.extractTimePreferences(userHistory),
            priceRange: this.extractPriceRange(userHistory),
            loyaltyLevel: this.calculateLoyaltyLevel(userHistory)
        };
        
        // Generate personalized recommendations
        const personalizedRecommendations = Array.from({ length: 8 }, (_, i) => ({
            type: i % 2 === 0 ? 'service' : 'provider',
            name: i % 2 === 0 ? `Service ${i}` : `Provider ${i}`,
            confidence: 0.82 + (Math.random() * 0.18), // 0.82-1.0
            personalizedReasons: [
                'Based on your booking history',
                'Matches your preferred time slots',
                'Similar to highly rated services',
                'Popular in your area'
            ].slice(0, 2 + Math.floor(Math.random() * 2)),
            estimatedSatisfaction: 4.1 + (Math.random() * 0.9) // 4.1-5.0
        }));
        
        return {
            userId,
            behaviorAnalysis,
            personalizedRecommendations,
            adaptationApplied: true,
            accuracyMetrics: {
                personalizationScore: 0.85 + Math.random() * 0.15, // 0.85-1.0
                satisfactionPredictionAccuracy: 0.88,
                engagementIncrease: 0.30 + Math.random() * 0.20 // 30-50%
            },
            confidence: 0.89 + Math.random() * 0.11, // 0.89-1.0
            modelVersion: '3.0.1'
        };
    }
    
    private getSeasonalMultiplier(date: Date): number {
        const month = date.getMonth();
        const seasonalFactors = [0.8, 0.85, 0.9, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1, 1.0, 0.9, 0.85];
        return seasonalFactors[month] || 1.0;
    }
    
    private getWeekdayMultiplier(date: Date): number {
        const dayOfWeek = date.getDay();
        const weekdayFactors = [0.7, 0.9, 1.0, 1.0, 1.1, 1.2, 1.15]; // Sun-Sat
        return weekdayFactors[dayOfWeek] || 1.0;
    }
    
    private extractPreferredServices(history: any): string[] {
        if (!history || !history.previousBookings) return ['premium-cut'];
        
        const serviceCounts = history.previousBookings.reduce((acc: any, booking: any) => {
            acc[booking.service] = (acc[booking.service] || 0) + 1;
            return acc;
        }, {});
        
        return Object.entries(serviceCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3)
            .map((entry: any) => entry[0]);
    }
    
    private extractTimePreferences(history: any): any {
        if (!history || !history.preferences) {
            return { preferredTime: 'morning', flexibility: 'moderate' };
        }
        
        return {
            preferredTime: history.preferences.timeOfDay || 'morning',
            flexibility: 'moderate'
        };
    }
    
    private extractPriceRange(history: any): any {
        if (!history || !history.preferences) {
            return { min: 30, max: 60, willingness: 'moderate' };
        }
        
        return {
            min: history.preferences.budget?.min || 30,
            max: history.preferences.budget?.max || 60,
            willingness: 'moderate'
        };
    }
    
    private calculateLoyaltyLevel(history: any): string {
        if (!history || !history.previousBookings) return 'new';
        
        const bookingCount = history.previousBookings.length;
        const avgSatisfaction = history.previousBookings.reduce((sum: number, b: any) => sum + b.satisfaction, 0) / bookingCount;
        
        if (bookingCount >= 10 && avgSatisfaction >= 4.5) return 'champion';
        if (bookingCount >= 5 && avgSatisfaction >= 4.0) return 'loyal';
        if (bookingCount >= 2) return 'returning';
        return 'new';
    }
    
    async validateModelAccuracy(modelType: string, testData: any[]): Promise<any> {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model ${modelType} not found`);
        }
        
        // Simulate model validation against historical data
        const validationResults = {
            accuracy: model.performanceMetrics.precision || model.accuracy,
            precision: model.performanceMetrics.precision || 0.89,
            recall: model.performanceMetrics.recall || 0.91,
            f1Score: model.performanceMetrics.f1Score || 0.90,
            testDataSize: testData.length,
            validationDate: new Date(),
            improvementSinceLastValidation: 0.02 + Math.random() * 0.03 // 2-5% improvement
        };
        
        return validationResults;
    }
}

export async function createAITestData(config: {
    users: number;
    providers: number;
    bookings: number;
    reviews: number;
    timeSpan: string;
}): Promise<AITestData> {
    const users = Array.from({ length: config.users }, (_, i) => ({
        id: `user-${i}`,
        name: `Test User ${i}`,
        preferences: {
            services: ['premium-cut', 'styling', 'beard-trim'][Math.floor(Math.random() * 3)],
            priceRange: { min: 30 + Math.random() * 20, max: 60 + Math.random() * 40 },
            timePreference: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
            frequency: ['weekly', 'monthly', 'quarterly'][Math.floor(Math.random() * 3)]
        },
        accessToken: `test-user-token-${i}`,
        behaviorScore: Math.random(),
        loyaltyTier: ['new', 'returning', 'loyal', 'champion'][Math.floor(Math.random() * 4)]
    }));
    
    const providers = Array.from({ length: config.providers }, (_, i) => ({
        id: `provider-${i}`,
        name: `Test Provider ${i}`,
        location: {
            city: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'][Math.floor(Math.random() * 4)],
            neighborhood: `Neighborhood ${i % 10}`,
            coordinates: { lat: -34.6 + Math.random() * 0.2, lng: -58.4 + Math.random() * 0.2 }
        },
        services: ['premium-cut', 'basic-cut', 'styling', 'beard-trim', 'color'],
        rating: 4.0 + Math.random() * 1.0,
        experience: Math.floor(Math.random() * 10) + 1,
        availability: {
            workingHours: { start: '09:00', end: '19:00' },
            daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        },
        accessToken: `test-provider-token-${i}`
    }));
    
    const bookings = Array.from({ length: config.bookings }, (_, i) => ({
        id: `booking-${i}`,
        userId: `user-${Math.floor(Math.random() * config.users)}`,
        providerId: `provider-${Math.floor(Math.random() * config.providers)}`,
        service: ['premium-cut', 'basic-cut', 'styling', 'beard-trim'][Math.floor(Math.random() * 4)],
        dateTime: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(), // Last 6 months
        duration: 30 + Math.random() * 60, // 30-90 minutes
        price: 2000 + Math.random() * 3000, // 2000-5000 ARS
        status: ['completed', 'cancelled', 'no-show'][Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 2) + 1],
        satisfaction: Math.random() < 0.8 ? 4 + Math.random() * 1 : 1 + Math.random() * 3 // 80% high satisfaction
    }));
    
    const reviews = Array.from({ length: config.reviews }, (_, i) => ({
        id: `review-${i}`,
        bookingId: `booking-${Math.floor(Math.random() * config.bookings)}`,
        userId: `user-${Math.floor(Math.random() * config.users)}`,
        providerId: `provider-${Math.floor(Math.random() * config.providers)}`,
        rating: Math.random() < 0.7 ? 4 + Math.random() * 1 : 1 + Math.random() * 3, // 70% positive reviews
        comment: `Test review ${i} with detailed feedback about the service quality and experience.`,
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        verified: Math.random() < 0.9 // 90% verified reviews
    }));
    
    const behaviorPatterns = users.map((user, i) => ({
        userId: user.id,
        patterns: {
            bookingFrequency: Math.random() * 30 + 7, // 7-37 days
            preferredDayOfWeek: Math.floor(Math.random() * 7),
            preferredTimeSlot: Math.floor(Math.random() * 12) + 8, // 8-19 (8am-7pm)
            priceElasticity: Math.random() * 0.5 + 0.5, // 0.5-1.0
            loyaltyScore: Math.random(),
            churnRisk: Math.random() < 0.15 ? Math.random() * 0.5 : Math.random() * 0.2, // 15% have higher churn risk
            serviceVariety: Math.floor(Math.random() * 4) + 1 // 1-4 different services
        },
        predictions: {
            nextBookingDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            lifetimeValue: Math.random() * 50000 + 10000, // 10k-60k ARS
            recommendationReceptiveness: Math.random()
        }
    }));
    
    return {
        users,
        providers,
        bookings,
        reviews,
        behaviorPatterns
    };
}

export const mockMLModels = new MockMLModels();