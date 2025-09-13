/**
 * Q10-001: AI System Quality Validation & Performance Testing
 * Building on 97% quality score benchmarks from Day 9
 * Focus: AI recommendations, predictive analytics, intelligent search, ML pipeline, personalization, smart scheduling
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../fixtures/test-app';
import { createAITestData, mockMLModels } from '../fixtures/ai-mocks';
import { performance } from 'perf_hooks';

describe('Q10-001: AI System Quality Validation & Performance Testing', () => {
    let app: FastifyInstance;
    let aiTestData: any;
    let testUser: any;
    let testProvider: any;

    beforeAll(async () => {
        app = await createTestApp({
            aiFeatures: true,
            mlPipeline: true,
            predictiveAnalytics: true
        });
        
        // Setup AI test data with historical patterns
        aiTestData = await createAITestData({
            users: 1000,
            providers: 50,
            bookings: 10000,
            reviews: 8500,
            timeSpan: '6months'
        });
        
        testUser = aiTestData.users[0];
        testProvider = aiTestData.providers[0];
        
        // Initialize ML models with test data
        await mockMLModels.initialize(aiTestData);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('1. AI-Powered Recommendation System Accuracy', () => {
        test('should achieve >90% recommendation relevance metrics', async () => {
            const startTime = performance.now();
            
            // Test provider recommendations based on user preferences
            const recommendationResponse = await app.inject({
                method: 'GET',
                url: '/api/ai/recommendations/providers',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                query: {
                    location: 'Buenos Aires',
                    serviceType: 'premium-cut',
                    preferences: JSON.stringify({
                        priceRange: { min: 30, max: 60 },
                        experience: 'high',
                        availability: 'flexible'
                    })
                }
            });
            
            const responseTime = performance.now() - startTime;
            
            expect(recommendationResponse.statusCode).toBe(200);
            expect(responseTime).toBeLessThan(150); // AI recommendations should be < 150ms
            
            const recommendations = recommendationResponse.json();
            expect(recommendations).toHaveProperty('providers');
            expect(recommendations).toHaveProperty('relevanceScores');
            expect(recommendations).toHaveProperty('confidenceLevel');
            expect(recommendations.providers).toBeInstanceOf(Array);
            expect(recommendations.providers.length).toBeGreaterThanOrEqual(5);
            
            // Verify recommendation quality
            expect(recommendations.confidenceLevel).toBeGreaterThanOrEqual(0.9); // >90% confidence
            recommendations.providers.forEach((provider: any) => {
                expect(provider).toHaveProperty('id');
                expect(provider).toHaveProperty('relevanceScore');
                expect(provider).toHaveProperty('matchFactors');
                expect(provider.relevanceScore).toBeGreaterThanOrEqual(0.8);
            });
        });

        test('should provide personalized service recommendations', async () => {
            // Create user behavior history
            const userHistory = {
                previousBookings: [
                    { service: 'premium-cut', satisfaction: 5, duration: 45 },
                    { service: 'beard-trim', satisfaction: 4, duration: 30 },
                    { service: 'styling', satisfaction: 5, duration: 60 }
                ],
                preferences: {
                    timeOfDay: 'morning',
                    frequency: 'monthly',
                    budget: { min: 40, max: 80 }
                }
            };
            
            const serviceRecommendationResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/recommendations/services',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                payload: {
                    userId: testUser.id,
                    userHistory,
                    contextData: {
                        season: 'summer',
                        occasion: 'routine'
                    }
                }
            });
            
            expect(serviceRecommendationResponse.statusCode).toBe(200);
            
            const serviceRecommendations = serviceRecommendationResponse.json();
            expect(serviceRecommendations).toHaveProperty('recommendedServices');
            expect(serviceRecommendations).toHaveProperty('personalizedReasons');
            expect(serviceRecommendations).toHaveProperty('accuracyMetrics');
            
            // Verify personalization accuracy
            expect(serviceRecommendations.accuracyMetrics.personalizationScore).toBeGreaterThanOrEqual(0.85);
            serviceRecommendations.recommendedServices.forEach((service: any) => {
                expect(service).toHaveProperty('name');
                expect(service).toHaveProperty('confidence');
                expect(service).toHaveProperty('estimatedSatisfaction');
                expect(service.estimatedSatisfaction).toBeGreaterThanOrEqual(4.0);
            });
        });

        test('should adapt recommendations based on real-time feedback', async () => {
            // Simulate user interaction and feedback
            const feedbackData = {
                recommendationId: 'rec-123',
                userAction: 'BOOKED',
                actualSatisfaction: 5,
                feedbackType: 'POSITIVE',
                contextData: {
                    bookingCompleted: true,
                    timeToDecision: 30 // seconds
                }
            };
            
            const feedbackResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/recommendations/feedback',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                payload: feedbackData
            });
            
            expect(feedbackResponse.statusCode).toBe(200);
            
            // Get updated recommendations to verify adaptation
            const updatedRecommendations = await app.inject({
                method: 'GET',
                url: '/api/ai/recommendations/providers',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                query: {
                    location: 'Buenos Aires',
                    serviceType: 'premium-cut',
                    includeAdaptation: 'true'
                }
            });
            
            const updated = updatedRecommendations.json();
            expect(updated).toHaveProperty('adaptationApplied');
            expect(updated.adaptationApplied).toBe(true);
            expect(updated.confidenceLevel).toBeGreaterThanOrEqual(0.92); // Should improve with feedback
        });
    });

    describe('2. Predictive Analytics Accuracy Validation', () => {
        test('should provide accurate demand forecasting', async () => {
            const startTime = performance.now();
            
            const demandForecastResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/analytics/demand-forecast',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                payload: {
                    providerId: testProvider.id,
                    forecastPeriod: {
                        start: '2024-09-15T00:00:00Z',
                        end: '2024-09-22T23:59:59Z'
                    },
                    services: ['premium-cut', 'basic-cut', 'beard-trim'],
                    factors: ['seasonality', 'events', 'promotions', 'historical']
                }
            });
            
            const responseTime = performance.now() - startTime;
            
            expect(demandForecastResponse.statusCode).toBe(200);
            expect(responseTime).toBeLessThan(200); // Predictive analytics should be < 200ms
            
            const forecast = demandForecastResponse.json();
            expect(forecast).toHaveProperty('predictions');
            expect(forecast).toHaveProperty('confidence');
            expect(forecast).toHaveProperty('factors');
            expect(forecast).toHaveProperty('accuracy');
            
            // Verify forecast accuracy against historical data
            expect(forecast.confidence).toBeGreaterThanOrEqual(0.85);
            expect(forecast.accuracy.meanAbsoluteError).toBeLessThanOrEqual(0.15);
            
            forecast.predictions.forEach((prediction: any) => {
                expect(prediction).toHaveProperty('date');
                expect(prediction).toHaveProperty('expectedDemand');
                expect(prediction).toHaveProperty('confidenceInterval');
                expect(prediction.expectedDemand).toBeGreaterThanOrEqual(0);
            });
        });

        test('should validate historical data comparison accuracy', async () => {
            // Test against known historical patterns
            const historicalComparisonResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/analytics/historical-validation',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                payload: {
                    testPeriod: {
                        start: '2024-06-01T00:00:00Z',
                        end: '2024-08-31T23:59:59Z'
                    },
                    validationMetrics: ['demand', 'revenue', 'satisfaction', 'cancellation']
                }
            });
            
            expect(historicalComparisonResponse.statusCode).toBe(200);
            
            const validation = historicalComparisonResponse.json();
            expect(validation).toHaveProperty('accuracyMetrics');
            expect(validation).toHaveProperty('predictionErrors');
            expect(validation).toHaveProperty('modelPerformance');
            
            // Verify prediction accuracy
            expect(validation.accuracyMetrics.overallAccuracy).toBeGreaterThanOrEqual(0.88);
            expect(validation.accuracyMetrics.demandPredictionAccuracy).toBeGreaterThanOrEqual(0.85);
            expect(validation.accuracyMetrics.revenuePredictionAccuracy).toBeGreaterThanOrEqual(0.82);
            
            // Check prediction errors are within acceptable bounds
            expect(validation.predictionErrors.meanSquaredError).toBeLessThanOrEqual(0.2);
            expect(validation.predictionErrors.rootMeanSquaredError).toBeLessThanOrEqual(0.45);
        });

        test('should provide accurate business intelligence forecasting', async () => {
            const businessIntelligenceResponse = await app.inject({
                method: 'GET',
                url: '/api/ai/analytics/business-intelligence',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                query: {
                    providerId: testProvider.id,
                    analysisType: 'GROWTH_FORECAST',
                    timeHorizon: '3months',
                    includeScenarios: 'true'
                }
            });
            
            expect(businessIntelligenceResponse.statusCode).toBe(200);
            
            const intelligence = businessIntelligenceResponse.json();
            expect(intelligence).toHaveProperty('growthForecast');
            expect(intelligence).toHaveProperty('riskAnalysis');
            expect(intelligence).toHaveProperty('opportunities');
            expect(intelligence).toHaveProperty('scenarios');
            
            // Verify intelligent insights quality
            expect(intelligence.growthForecast.confidence).toBeGreaterThanOrEqual(0.8);
            expect(intelligence.scenarios).toHaveProperty('optimistic');
            expect(intelligence.scenarios).toHaveProperty('realistic');
            expect(intelligence.scenarios).toHaveProperty('conservative');
            
            intelligence.opportunities.forEach((opportunity: any) => {
                expect(opportunity).toHaveProperty('type');
                expect(opportunity).toHaveProperty('impact');
                expect(opportunity).toHaveProperty('probability');
                expect(opportunity.probability).toBeGreaterThanOrEqual(0.7);
            });
        });
    });

    describe('3. Intelligent Search Performance & Relevance', () => {
        test('should provide intelligent search with natural language processing', async () => {
            const startTime = performance.now();
            
            const searchQuery = {
                query: 'find me a experienced barber near Palermo for premium haircut tomorrow morning',
                context: {
                    location: { lat: -34.5755, lng: -58.4061 }, // Palermo coordinates
                    userPreferences: {
                        experience: 'high',
                        serviceType: 'premium',
                        timePreference: 'morning'
                    }
                },
                filters: {
                    availability: true,
                    rating: { min: 4.0 }
                }
            };
            
            const searchResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/search/intelligent',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                payload: searchQuery
            });
            
            const responseTime = performance.now() - startTime;
            
            expect(searchResponse.statusCode).toBe(200);
            expect(responseTime).toBeLessThan(100); // Intelligent search should be < 100ms
            
            const searchResults = searchResponse.json();
            expect(searchResults).toHaveProperty('results');
            expect(searchResults).toHaveProperty('interpretedQuery');
            expect(searchResults).toHaveProperty('relevanceScores');
            expect(searchResults).toHaveProperty('searchMetrics');
            
            // Verify search intelligence
            expect(searchResults.interpretedQuery).toHaveProperty('location');
            expect(searchResults.interpretedQuery).toHaveProperty('service');
            expect(searchResults.interpretedQuery).toHaveProperty('timePreference');
            expect(searchResults.interpretedQuery.location).toContain('Palermo');
            expect(searchResults.interpretedQuery.service).toContain('premium');
            
            // Verify result quality
            expect(searchResults.results.length).toBeGreaterThanOrEqual(3);
            searchResults.results.forEach((result: any) => {
                expect(result).toHaveProperty('provider');
                expect(result).toHaveProperty('relevanceScore');
                expect(result).toHaveProperty('matchFactors');
                expect(result.relevanceScore).toBeGreaterThanOrEqual(0.75);
            });
        });

        test('should provide contextual search relevance scoring', async () => {
            // Test different search contexts
            const searchContexts = [
                {
                    query: 'quick haircut',
                    context: { urgency: 'high', budget: 'low' },
                    expectedType: 'basic-cut'
                },
                {
                    query: 'special occasion styling',
                    context: { event: 'wedding', budget: 'high' },
                    expectedType: 'premium-styling'
                },
                {
                    query: 'maintenance trim',
                    context: { frequency: 'regular', loyalty: 'high' },
                    expectedType: 'regular-trim'
                }
            ];
            
            for (const searchContext of searchContexts) {
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/ai/search/contextual',
                    headers: {
                        authorization: `Bearer ${testUser.accessToken}`,
                    },
                    payload: searchContext
                });
                
                expect(response.statusCode).toBe(200);
                
                const results = response.json();
                expect(results).toHaveProperty('contextualRelevance');
                expect(results).toHaveProperty('adaptedResults');
                expect(results.contextualRelevance.score).toBeGreaterThanOrEqual(0.8);
                
                // Verify context-appropriate results
                const topResult = results.adaptedResults[0];
                expect(topResult.contextMatch).toBeGreaterThanOrEqual(0.85);
            }
        });

        test('should handle complex search queries with multiple filters', async () => {
            const complexSearchQuery = {
                query: 'experienced barber with good reviews for beard styling and haircut in northern Buenos Aires available this weekend with parking',
                filters: {
                    services: ['haircut', 'beard-styling'],
                    rating: { min: 4.5 },
                    experience: { min: '3years' },
                    location: {
                        area: 'northern-buenos-aires',
                        radius: 5000 // 5km radius
                    },
                    availability: {
                        days: ['saturday', 'sunday'],
                        timeRange: { start: '09:00', end: '18:00' }
                    },
                    amenities: ['parking']
                },
                sortBy: 'relevance',
                limit: 10
            };
            
            const response = await app.inject({
                method: 'POST',
                url: '/api/ai/search/advanced',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                payload: complexSearchQuery
            });
            
            expect(response.statusCode).toBe(200);
            
            const results = response.json();
            expect(results).toHaveProperty('filteredResults');
            expect(results).toHaveProperty('filterMatches');
            expect(results).toHaveProperty('queryProcessing');
            
            // Verify complex query processing
            expect(results.queryProcessing.extractedCriteria).toHaveProperty('services');
            expect(results.queryProcessing.extractedCriteria).toHaveProperty('location');
            expect(results.queryProcessing.extractedCriteria).toHaveProperty('timeRequirement');
            expect(results.queryProcessing.extractedCriteria).toHaveProperty('amenities');
            
            // Verify results match all criteria
            results.filteredResults.forEach((result: any) => {
                expect(result.filterMatches.rating).toBeGreaterThanOrEqual(4.5);
                expect(result.filterMatches.services).toContain('haircut');
                expect(result.filterMatches.availability).toBe(true);
                expect(result.filterMatches.amenities).toContain('parking');
            });
        });
    });

    describe('4. Machine Learning Pipeline Performance', () => {
        test('should demonstrate continuous ML model improvement', async () => {
            // Test ML pipeline performance
            const pipelineResponse = await app.inject({
                method: 'GET',
                url: '/api/ai/ml-pipeline/performance',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                query: {
                    modelTypes: 'recommendation,demand-forecast,personalization',
                    timeRange: '30d'
                }
            });
            
            expect(pipelineResponse.statusCode).toBe(200);
            
            const pipelineMetrics = pipelineResponse.json();
            expect(pipelineMetrics).toHaveProperty('models');
            expect(pipelineMetrics).toHaveProperty('performanceMetrics');
            expect(pipelineMetrics).toHaveProperty('improvementTrends');
            
            // Verify model performance
            pipelineMetrics.models.forEach((model: any) => {
                expect(model).toHaveProperty('name');
                expect(model).toHaveProperty('accuracy');
                expect(model).toHaveProperty('lastTraining');
                expect(model).toHaveProperty('performanceTrend');
                expect(model.accuracy).toBeGreaterThanOrEqual(0.85);
                expect(model.performanceTrend).toMatch(/^(improving|stable)$/);
            });
            
            // Verify continuous improvement
            expect(pipelineMetrics.improvementTrends.overallTrend).toBe('improving');
            expect(pipelineMetrics.performanceMetrics.averageAccuracy).toBeGreaterThanOrEqual(0.88);
        });

        test('should validate model versioning and A/B testing', async () => {
            const abTestResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/ml-pipeline/ab-test',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                payload: {
                    modelType: 'recommendation',
                    testConfig: {
                        variantA: 'current-model-v2.1',
                        variantB: 'experimental-model-v2.2',
                        trafficSplit: 50, // 50/50 split
                        successMetrics: ['click-through-rate', 'booking-conversion', 'user-satisfaction']
                    }
                }
            });
            
            expect(abTestResponse.statusCode).toBe(200);
            
            const abTest = abTestResponse.json();
            expect(abTest).toHaveProperty('testId');
            expect(abTest).toHaveProperty('testStatus');
            expect(abTest).toHaveProperty('variants');
            expect(abTest).toHaveProperty('metrics');
            
            // Verify A/B test setup
            expect(abTest.testStatus).toBe('ACTIVE');
            expect(abTest.variants).toHaveLength(2);
            expect(abTest.metrics.baseline).toBeInstanceOf(Object);
        });

        test('should ensure ML pipeline scalability and performance', async () => {
            const startTime = performance.now();
            
            // Test high-volume prediction requests
            const batchPredictionRequest = {
                modelType: 'recommendation',
                batchSize: 100,
                requests: Array.from({ length: 100 }, (_, i) => ({
                    userId: `test-user-${i}`,
                    context: {
                        location: 'Buenos Aires',
                        serviceType: 'premium-cut',
                        timePreference: 'flexible'
                    }
                }))
            };
            
            const batchResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/ml-pipeline/batch-predict',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                payload: batchPredictionRequest
            });
            
            const responseTime = performance.now() - startTime;
            
            expect(batchResponse.statusCode).toBe(200);
            expect(responseTime).toBeLessThan(500); // Batch ML predictions should be < 500ms
            
            const batchResults = batchResponse.json();
            expect(batchResults).toHaveProperty('predictions');
            expect(batchResults).toHaveProperty('processingTime');
            expect(batchResults).toHaveProperty('successRate');
            
            // Verify batch processing performance
            expect(batchResults.predictions.length).toBe(100);
            expect(batchResults.successRate).toBeGreaterThanOrEqual(0.98);
            expect(batchResults.processingTime).toBeLessThan(400);
        });
    });

    describe('5. AI-Driven Personalization Effectiveness', () => {
        test('should measure personalization impact on user satisfaction', async () => {
            // Test personalized experience
            const personalizationResponse = await app.inject({
                method: 'GET',
                url: '/api/ai/personalization/dashboard',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                },
                query: {
                    includeMetrics: 'true',
                    personalizationType: 'full'
                }
            });
            
            expect(personalizationResponse.statusCode).toBe(200);
            
            const personalizedDashboard = personalizationResponse.json();
            expect(personalizedDashboard).toHaveProperty('personalizedContent');
            expect(personalizedDashboard).toHaveProperty('satisfactionMetrics');
            expect(personalizedDashboard).toHaveProperty('engagementImprovement');
            
            // Verify personalization effectiveness
            expect(personalizedDashboard.satisfactionMetrics.score).toBeGreaterThanOrEqual(4.2);
            expect(personalizedDashboard.engagementImprovement.percentage).toBeGreaterThanOrEqual(30);
            
            // Test personalized content quality
            const content = personalizedDashboard.personalizedContent;
            expect(content).toHaveProperty('recommendations');
            expect(content).toHaveProperty('promotions');
            expect(content).toHaveProperty('reminders');
            expect(content.recommendations.relevanceScore).toBeGreaterThanOrEqual(0.85);
        });

        test('should adapt personalization based on user behavior patterns', async () => {
            // Simulate user behavior sequence
            const behaviorSequence = [
                { action: 'VIEW_PROVIDER', providerId: 'prov-123', duration: 45 },
                { action: 'COMPARE_SERVICES', services: ['premium-cut', 'styling'], duration: 120 },
                { action: 'CHECK_AVAILABILITY', timeSlots: ['morning'], duration: 30 },
                { action: 'BOOK_SERVICE', serviceId: 'premium-cut', satisfaction: 5 }
            ];
            
            for (const behavior of behaviorSequence) {
                await app.inject({
                    method: 'POST',
                    url: '/api/ai/personalization/track-behavior',
                    headers: {
                        authorization: `Bearer ${testUser.accessToken}`,
                    },
                    payload: behavior
                });
            }
            
            // Get updated personalization
            const updatedPersonalizationResponse = await app.inject({
                method: 'GET',
                url: '/api/ai/personalization/profile',
                headers: {
                    authorization: `Bearer ${testUser.accessToken}`,
                }
            });
            
            expect(updatedPersonalizationResponse.statusCode).toBe(200);
            
            const profile = updatedPersonalizationResponse.json();
            expect(profile).toHaveProperty('learningProgress');
            expect(profile).toHaveProperty('adaptations');
            expect(profile).toHaveProperty('improvementScore');
            
            // Verify behavioral adaptation
            expect(profile.learningProgress.behaviors_learned).toBeGreaterThanOrEqual(4);
            expect(profile.improvementScore).toBeGreaterThanOrEqual(0.15);
            expect(profile.adaptations).toContain('service_preference');
            expect(profile.adaptations).toContain('time_preference');
        });
    });

    describe('6. Smart Scheduling Optimization & Conflict Resolution', () => {
        test('should provide intelligent scheduling with 90%+ conflict resolution accuracy', async () => {
            const schedulingRequest = {
                providerId: testProvider.id,
                optimizationPeriod: {
                    start: '2024-09-16T00:00:00Z',
                    end: '2024-09-22T23:59:59Z'
                },
                constraints: {
                    workingHours: { start: '09:00', end: '19:00' },
                    breakDuration: 60, // minutes
                    bufferTime: 15, // minutes between appointments
                    maxConsecutive: 5 // max consecutive appointments
                },
                optimizationGoals: ['maximize_utilization', 'minimize_conflicts', 'optimize_revenue']
            };
            
            const optimizationResponse = await app.inject({
                method: 'POST',
                url: '/api/ai/scheduling/optimize',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                payload: schedulingRequest
            });
            
            expect(optimizationResponse.statusCode).toBe(200);
            
            const optimization = optimizationResponse.json();
            expect(optimization).toHaveProperty('optimizedSchedule');
            expect(optimization).toHaveProperty('conflictsResolved');
            expect(optimization).toHaveProperty('utilizationImprovement');
            expect(optimization).toHaveProperty('accuracyMetrics');
            
            // Verify conflict resolution accuracy
            expect(optimization.accuracyMetrics.conflictResolutionRate).toBeGreaterThanOrEqual(0.90);
            expect(optimization.conflictsResolved.totalResolved).toBeGreaterThanOrEqual(
                optimization.conflictsResolved.totalDetected * 0.90
            );
            
            // Verify optimization effectiveness
            expect(optimization.utilizationImprovement.percentage).toBeGreaterThanOrEqual(15);
            expect(optimization.optimizedSchedule.efficiency).toBeGreaterThanOrEqual(0.85);
        });

        test('should handle complex multi-resource scheduling scenarios', async () => {
            const complexSchedulingRequest = {
                scenario: 'MULTI_RESOURCE',
                resources: [
                    { type: 'barber', id: 'barber-1', skills: ['cutting', 'styling'] },
                    { type: 'barber', id: 'barber-2', skills: ['cutting', 'beard-work'] },
                    { type: 'chair', id: 'chair-1', location: 'station-a' },
                    { type: 'chair', id: 'chair-2', location: 'station-b' },
                    { type: 'equipment', id: 'premium-tools', required: ['premium-cut', 'styling'] }
                ],
                appointments: Array.from({ length: 20 }, (_, i) => ({
                    id: `apt-${i}`,
                    service: i % 3 === 0 ? 'premium-cut' : 'basic-cut',
                    duration: i % 3 === 0 ? 45 : 30,
                    preferredTime: `2024-09-16T${9 + Math.floor(i / 2)}:${i % 2 * 30}:00Z`,
                    priority: i < 5 ? 'high' : 'normal'
                }))
            };
            
            const response = await app.inject({
                method: 'POST',
                url: '/api/ai/scheduling/complex-optimize',
                headers: {
                    authorization: `Bearer ${testProvider.accessToken}`,
                },
                payload: complexSchedulingRequest
            });
            
            expect(response.statusCode).toBe(200);
            
            const complexOptimization = response.json();
            expect(complexOptimization).toHaveProperty('resourceAllocation');
            expect(complexOptimization).toHaveProperty('scheduledAppointments');
            expect(complexOptimization).toHaveProperty('optimizationMetrics');
            
            // Verify complex scheduling success
            expect(complexOptimization.optimizationMetrics.scheduledRate).toBeGreaterThanOrEqual(0.95);
            expect(complexOptimization.optimizationMetrics.resourceUtilization).toBeGreaterThanOrEqual(0.80);
            expect(complexOptimization.scheduledAppointments.length).toBeGreaterThanOrEqual(19);
            
            // Verify resource conflicts are resolved
            expect(complexOptimization.optimizationMetrics.resourceConflicts).toBeLessThanOrEqual(1);
        });
    });
});