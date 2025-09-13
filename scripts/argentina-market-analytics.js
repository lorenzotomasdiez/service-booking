#!/usr/bin/env node

/**
 * Argentina Market Performance Analytics Dashboard
 * Day 6 Soft Launch - Market Intelligence & User Behavior Analysis
 * 
 * Tracks Argentina-specific metrics:
 * - Peso (ARS) pricing acceptance and payment methods
 * - Mobile-first usage patterns on Argentina devices
 * - Spanish language interaction patterns
 * - Regional usage distribution (Buenos Aires vs provinces)
 * - Social sharing behavior (WhatsApp/Instagram focus)
 * - Referral system effectiveness in Argentina culture
 */

const axios = require('axios');

class ArgentinaMarketAnalytics {
    constructor() {
        this.baseUrl = process.env.API_URL || 'http://localhost:3000';
        this.marketData = {
            // User Demographics
            totalUsers: 0,
            argentinaUsers: 0,
            buenosAiresUsers: 0,
            provincialUsers: 0,
            
            // Payment Behavior
            mercadoPagoUsers: 0,
            debitCardUsers: 0,
            installmentUsers: 0,
            cashUsers: 0,
            averageTransactionARS: 0,
            
            // Device & Platform
            mobileUsers: 0,
            androidUsers: 0,
            iOSUsers: 0,
            chromeUsers: 0,
            
            // Language & Localization
            spanishUsers: 0,
            argentineTerminologyUsage: 0,
            
            // Social & Referral
            whatsappShares: 0,
            instagramShares: 0,
            facebookShares: 0,
            referralConversionRate: 0,
            socialMediaDiscovery: 0,
            
            // Service Categories
            barberBookings: 0,
            premiumServiceUsage: 0,
            weekendBookings: 0,
            eveningBookings: 0,
            
            // Regional Performance
            regionalResponseTimes: {},
            regionalPaymentPreferences: {},
            regionalServicePopularity: {}
        };
        
        this.argentinaInsights = {
            culturalAdoption: [],
            paymentTrends: [],
            mobileUsagePatterns: [],
            socialSharingEffectiveness: [],
            pricingSensitivity: []
        };
        
        this.templateReplicationData = {
            coreFeatureUsage: {},
            argentineCustomizations: {},
            replicationReadiness: 0
        };
    }

    async startArgentinaMarketAnalysis() {
        console.log('🇦🇷 BarberPro Argentina Market Analytics - Soft Launch Analysis');
        console.log('📊 Tracking Argentina-specific user behavior and market performance');
        console.log('🎯 Objective: Gather insights for template replication strategy');
        console.log('='.repeat(80));
        
        // Run comprehensive analysis every 10 minutes
        setInterval(() => this.runFullMarketAnalysis(), 600000);
        
        // Track real-time payment behavior every 5 minutes
        setInterval(() => this.analyzePaymentBehavior(), 300000);
        
        // Monitor mobile usage patterns every 3 minutes
        setInterval(() => this.analyzeMobileUsagePatterns(), 180000);
        
        // Track social sharing behavior every 7 minutes
        setInterval(() => this.analyzeSocialSharingBehavior(), 420000);
        
        // Regional performance analysis every 15 minutes
        setInterval(() => this.analyzeRegionalPerformance(), 900000);
        
        // Generate market insights report every 30 minutes
        setInterval(() => this.generateMarketInsightsReport(), 1800000);
        
        // Initial comprehensive analysis
        await this.runFullMarketAnalysis();
    }

    async runFullMarketAnalysis() {
        console.log('📈 Running Comprehensive Argentina Market Analysis...');
        
        try {
            await Promise.all([
                this.collectUserDemographics(),
                this.analyzePaymentBehavior(),
                this.analyzeMobileUsagePatterns(),
                this.analyzeLanguageAndLocalization(),
                this.analyzeSocialSharingBehavior(),
                this.analyzeServiceCategoryPerformance(),
                this.analyzeRegionalPerformance()
            ]);
            
            console.log('✅ Market Analysis Complete');
            this.calculateMarketInsights();
            
        } catch (error) {
            console.error(`❌ Market Analysis Error: ${error.message}`);
        }
    }

    async collectUserDemographics() {
        try {
            const demographics = await axios.get(`${this.baseUrl}/api/analytics/demographics`);
            const data = demographics.data;
            
            this.marketData.totalUsers = data.totalUsers || 0;
            this.marketData.argentinaUsers = data.argentinaUsers || 0;
            this.marketData.buenosAiresUsers = data.buenosAiresUsers || 0;
            this.marketData.provincialUsers = data.provincialUsers || 0;
            
            // Calculate Argentina market penetration
            const argentinaPenetration = (this.marketData.argentinaUsers / this.marketData.totalUsers) * 100;
            const buenosAiresConcentration = (this.marketData.buenosAiresUsers / this.marketData.argentinaUsers) * 100;
            
            console.log(`👥 Demographics: ${this.marketData.argentinaUsers}/${this.marketData.totalUsers} Argentina users (${argentinaPenetration.toFixed(1)}%)`);
            console.log(`🏙️  Buenos Aires concentration: ${buenosAiresConcentration.toFixed(1)}%`);
            
        } catch (error) {
            console.error(`❌ Demographics collection failed: ${error.message}`);
        }
    }

    async analyzePaymentBehavior() {
        try {
            const payments = await axios.get(`${this.baseUrl}/api/analytics/payments/argentina`);
            const data = payments.data;
            
            this.marketData.mercadoPagoUsers = data.mercadoPagoUsers || 0;
            this.marketData.debitCardUsers = data.debitCardUsers || 0;
            this.marketData.installmentUsers = data.installmentUsers || 0;
            this.marketData.cashUsers = data.cashUsers || 0;
            this.marketData.averageTransactionARS = data.averageTransactionARS || 0;
            
            // Calculate payment method preferences
            const totalPaymentUsers = this.marketData.mercadoPagoUsers + this.marketData.debitCardUsers + 
                                     this.marketData.installmentUsers + this.marketData.cashUsers;
            
            const mercadoPagoPreference = (this.marketData.mercadoPagoUsers / totalPaymentUsers) * 100;
            const installmentUsage = (this.marketData.installmentUsers / totalPaymentUsers) * 100;
            
            console.log(`💳 Payment Behavior: MercadoPago ${mercadoPagoPreference.toFixed(1)}%, Installments ${installmentUsage.toFixed(1)}%`);
            console.log(`💰 Average Transaction: $${this.marketData.averageTransactionARS} ARS`);
            
            // Track payment trends
            this.argentinaInsights.paymentTrends.push({
                timestamp: new Date().toISOString(),
                mercadoPagoPreference,
                installmentUsage,
                averageTransaction: this.marketData.averageTransactionARS
            });
            
        } catch (error) {
            console.error(`❌ Payment behavior analysis failed: ${error.message}`);
        }
    }

    async analyzeMobileUsagePatterns() {
        try {
            const mobile = await axios.get(`${this.baseUrl}/api/analytics/mobile/argentina`);
            const data = mobile.data;
            
            this.marketData.mobileUsers = data.mobileUsers || 0;
            this.marketData.androidUsers = data.androidUsers || 0;
            this.marketData.iOSUsers = data.iOSUsers || 0;
            this.marketData.chromeUsers = data.chromeUsers || 0;
            
            // Calculate mobile penetration
            const mobilePenetration = (this.marketData.mobileUsers / this.marketData.totalUsers) * 100;
            const androidDominance = (this.marketData.androidUsers / this.marketData.mobileUsers) * 100;
            
            // Argentina-specific mobile insights
            const peakUsageHours = data.peakUsageHours || [];
            const averageSessionDuration = data.averageSessionDuration || 0;
            const offlineUsageAttempts = data.offlineUsageAttempts || 0;
            
            console.log(`📱 Mobile Usage: ${mobilePenetration.toFixed(1)}% mobile, Android ${androidDominance.toFixed(1)}%`);
            console.log(`⏱️  Session Duration: ${averageSessionDuration} minutes average`);
            console.log(`📶 Offline Attempts: ${offlineUsageAttempts} (network reliability indicator)`);
            
            // Track mobile patterns specific to Argentina
            this.argentinaInsights.mobileUsagePatterns.push({
                timestamp: new Date().toISOString(),
                mobilePenetration,
                androidDominance,
                sessionDuration: averageSessionDuration,
                peakHours: peakUsageHours,
                offlineAttempts: offlineUsageAttempts
            });
            
        } catch (error) {
            console.error(`❌ Mobile usage analysis failed: ${error.message}`);
        }
    }

    async analyzeLanguageAndLocalization() {
        try {
            const language = await axios.get(`${this.baseUrl}/api/analytics/language/argentina`);
            const data = language.data;
            
            this.marketData.spanishUsers = data.spanishUsers || 0;
            this.marketData.argentineTerminologyUsage = data.argentineTerminologyUsage || 0;
            
            // Argentina-specific language patterns
            const argentineSlangUsage = data.argentineSlangUsage || 0;
            const formalVsTuteoPreference = data.formalVsTuteoPreference || { formal: 0, tuteo: 0 };
            const localizedDateTimeUsage = data.localizedDateTimeUsage || 0;
            
            const spanishPenetration = (this.marketData.spanishUsers / this.marketData.argentinaUsers) * 100;
            
            console.log(`🗣️  Language: ${spanishPenetration.toFixed(1)}% Spanish usage`);
            console.log(`🇦🇷 Argentine terminology adoption: ${this.marketData.argentineTerminologyUsage}%`);
            console.log(`💬 Tuteo vs Formal preference: ${formalVsTuteoPreference.tuteo}% tuteo`);
            
        } catch (error) {
            console.error(`❌ Language analysis failed: ${error.message}`);
        }
    }

    async analyzeSocialSharingBehavior() {
        try {
            const social = await axios.get(`${this.baseUrl}/api/analytics/social/argentina`);
            const data = social.data;
            
            this.marketData.whatsappShares = data.whatsappShares || 0;
            this.marketData.instagramShares = data.instagramShares || 0;
            this.marketData.facebookShares = data.facebookShares || 0;
            this.marketData.referralConversionRate = data.referralConversionRate || 0;
            this.marketData.socialMediaDiscovery = data.socialMediaDiscovery || 0;
            
            const totalShares = this.marketData.whatsappShares + this.marketData.instagramShares + this.marketData.facebookShares;
            const whatsappDominance = (this.marketData.whatsappShares / totalShares) * 100;
            const instagramUsage = (this.marketData.instagramShares / totalShares) * 100;
            
            console.log(`📱 Social Sharing: WhatsApp ${whatsappDominance.toFixed(1)}%, Instagram ${instagramUsage.toFixed(1)}%`);
            console.log(`🔗 Referral Conversion: ${this.marketData.referralConversionRate}%`);
            console.log(`👥 Social Discovery: ${this.marketData.socialMediaDiscovery}% of new users`);
            
            // Track social effectiveness over time
            this.argentinaInsights.socialSharingEffectiveness.push({
                timestamp: new Date().toISOString(),
                whatsappDominance,
                instagramUsage,
                referralConversion: this.marketData.referralConversionRate,
                socialDiscovery: this.marketData.socialMediaDiscovery
            });
            
        } catch (error) {
            console.error(`❌ Social sharing analysis failed: ${error.message}`);
        }
    }

    async analyzeServiceCategoryPerformance() {
        try {
            const services = await axios.get(`${this.baseUrl}/api/analytics/services/argentina`);
            const data = services.data;
            
            this.marketData.barberBookings = data.barberBookings || 0;
            this.marketData.premiumServiceUsage = data.premiumServiceUsage || 0;
            this.marketData.weekendBookings = data.weekendBookings || 0;
            this.marketData.eveningBookings = data.eveningBookings || 0;
            
            // Service preferences analysis
            const premiumAdoption = (this.marketData.premiumServiceUsage / this.marketData.barberBookings) * 100;
            const weekendPreference = (this.marketData.weekendBookings / this.marketData.barberBookings) * 100;
            const eveningPreference = (this.marketData.eveningBookings / this.marketData.barberBookings) * 100;
            
            console.log(`✂️  Service Performance: ${this.marketData.barberBookings} total bookings`);
            console.log(`💎 Premium Services: ${premiumAdoption.toFixed(1)}% adoption`);
            console.log(`📅 Weekend Bookings: ${weekendPreference.toFixed(1)}%`);
            console.log(`🌆 Evening Bookings: ${eveningPreference.toFixed(1)}%`);
            
        } catch (error) {
            console.error(`❌ Service analysis failed: ${error.message}`);
        }
    }

    async analyzeRegionalPerformance() {
        try {
            const regional = await axios.get(`${this.baseUrl}/api/analytics/regional/argentina`);
            const data = regional.data;
            
            this.marketData.regionalResponseTimes = data.responseTimesByRegion || {};
            this.marketData.regionalPaymentPreferences = data.paymentPreferencesByRegion || {};
            this.marketData.regionalServicePopularity = data.servicePopularityByRegion || {};
            
            // Regional insights
            const buenosAiresPerformance = this.marketData.regionalResponseTimes['buenos-aires'] || 0;
            const cordobaPerformance = this.marketData.regionalResponseTimes['cordoba'] || 0;
            const rosarioPerformance = this.marketData.regionalResponseTimes['rosario'] || 0;
            
            console.log(`🏙️  Regional Performance:`);
            console.log(`  Buenos Aires: ${buenosAiresPerformance}ms response time`);
            console.log(`  Córdoba: ${cordobaPerformance}ms response time`);
            console.log(`  Rosario: ${rosarioPerformance}ms response time`);
            
            // Regional payment preferences
            const buenosAiresMercadoPago = this.marketData.regionalPaymentPreferences['buenos-aires']?.mercadopago || 0;
            const provincialMercadoPago = this.marketData.regionalPaymentPreferences['provincial']?.mercadopago || 0;
            
            console.log(`💳 Regional Payments: BA ${buenosAiresMercadoPago}%, Provinces ${provincialMercadoPago}% MercadoPago`);
            
        } catch (error) {
            console.error(`❌ Regional analysis failed: ${error.message}`);
        }
    }

    calculateMarketInsights() {
        // Calculate cultural adoption score
        const culturalScore = this.calculateCulturalAdoptionScore();
        
        // Assess template replication readiness
        const replicationReadiness = this.assessTemplateReplicationReadiness();
        
        // Store insights
        this.argentinaInsights.culturalAdoption.push({
            timestamp: new Date().toISOString(),
            score: culturalScore,
            factors: {
                whatsappUsage: this.marketData.whatsappShares,
                mobileFirstAdoption: (this.marketData.mobileUsers / this.marketData.totalUsers) * 100,
                mercadoPagoAdoption: (this.marketData.mercadoPagoUsers / this.marketData.argentinaUsers) * 100,
                spanishUsage: (this.marketData.spanishUsers / this.marketData.argentinaUsers) * 100
            }
        });
        
        this.templateReplicationData.replicationReadiness = replicationReadiness;
        
        console.log(`🎯 Cultural Adoption Score: ${culturalScore}/100`);
        console.log(`🔄 Template Replication Readiness: ${replicationReadiness}%`);
    }

    calculateCulturalAdoptionScore() {
        let score = 0;
        
        // WhatsApp usage weight: 25% (critical for Argentina)
        const whatsappWeight = Math.min((this.marketData.whatsappShares / this.marketData.totalUsers) * 100, 100) * 0.25;
        
        // Mobile-first adoption weight: 20%
        const mobileWeight = Math.min((this.marketData.mobileUsers / this.marketData.totalUsers) * 100, 100) * 0.20;
        
        // MercadoPago adoption weight: 20%
        const mercadoPagoWeight = Math.min((this.marketData.mercadoPagoUsers / this.marketData.argentinaUsers) * 100, 100) * 0.20;
        
        // Spanish language adoption weight: 15%
        const spanishWeight = Math.min((this.marketData.spanishUsers / this.marketData.argentinaUsers) * 100, 100) * 0.15;
        
        // Regional spread weight: 10%
        const regionalWeight = Math.min(((this.marketData.provincialUsers / this.marketData.argentinaUsers) * 100), 50) * 0.10 * 2;
        
        // Referral system adoption weight: 10%
        const referralWeight = Math.min(this.marketData.referralConversionRate, 100) * 0.10;
        
        score = whatsappWeight + mobileWeight + mercadoPagoWeight + spanishWeight + regionalWeight + referralWeight;
        
        return Math.round(score);
    }

    assessTemplateReplicationReadiness() {
        let readinessScore = 0;
        
        // Core feature adoption (30%)
        const coreFeatureUsage = (this.marketData.barberBookings / Math.max(this.marketData.totalUsers, 1)) * 100;
        readinessScore += Math.min(coreFeatureUsage, 100) * 0.30;
        
        // Payment system stability (25%)
        const paymentStability = (this.marketData.mercadoPagoUsers / Math.max(this.marketData.argentinaUsers, 1)) * 100;
        readinessScore += Math.min(paymentStability, 100) * 0.25;
        
        // User engagement (20%)
        const userEngagement = this.marketData.referralConversionRate;
        readinessScore += Math.min(userEngagement, 100) * 0.20;
        
        // Technical performance (15%)
        const avgRegionalResponseTime = Object.values(this.marketData.regionalResponseTimes).reduce((sum, time) => sum + time, 0) / 
                                       Math.max(Object.keys(this.marketData.regionalResponseTimes).length, 1);
        const performanceScore = Math.max(100 - (avgRegionalResponseTime / 10), 0); // <100ms = 100%, >1000ms = 0%
        readinessScore += performanceScore * 0.15;
        
        // Market penetration (10%)
        const marketPenetration = (this.marketData.argentinaUsers / Math.max(this.marketData.totalUsers, 1)) * 100;
        readinessScore += Math.min(marketPenetration, 100) * 0.10;
        
        return Math.round(readinessScore);
    }

    generateMarketInsightsReport() {
        console.log('\n' + '🇦🇷'.repeat(40));
        console.log('📊 ARGENTINA MARKET INTELLIGENCE REPORT');
        console.log(new Date().toISOString());
        console.log('🇦🇷'.repeat(40));
        
        // User Demographics Insights
        console.log('\n👥 USER DEMOGRAPHICS:');
        console.log(`Total Argentina Users: ${this.marketData.argentinaUsers}`);
        console.log(`Buenos Aires vs Provinces: ${this.marketData.buenosAiresUsers}/${this.marketData.provincialUsers}`);
        console.log(`Market Penetration: ${((this.marketData.argentinaUsers / this.marketData.totalUsers) * 100).toFixed(1)}%`);
        
        // Payment Behavior Insights
        console.log('\n💳 PAYMENT BEHAVIOR:');
        const totalPayments = this.marketData.mercadoPagoUsers + this.marketData.debitCardUsers;
        console.log(`MercadoPago Dominance: ${((this.marketData.mercadoPagoUsers / totalPayments) * 100).toFixed(1)}%`);
        console.log(`Installment Usage: ${((this.marketData.installmentUsers / totalPayments) * 100).toFixed(1)}%`);
        console.log(`Average Transaction: $${this.marketData.averageTransactionARS} ARS`);
        
        // Mobile & Tech Adoption
        console.log('\n📱 MOBILE & TECHNOLOGY:');
        console.log(`Mobile-First Usage: ${((this.marketData.mobileUsers / this.marketData.totalUsers) * 100).toFixed(1)}%`);
        console.log(`Android Dominance: ${((this.marketData.androidUsers / this.marketData.mobileUsers) * 100).toFixed(1)}%`);
        
        // Social & Cultural Insights
        console.log('\n📱 SOCIAL & CULTURAL:');
        const totalShares = this.marketData.whatsappShares + this.marketData.instagramShares + this.marketData.facebookShares;
        console.log(`WhatsApp Preference: ${((this.marketData.whatsappShares / totalShares) * 100).toFixed(1)}%`);
        console.log(`Referral Conversion: ${this.marketData.referralConversionRate}%`);
        console.log(`Social Media Discovery: ${this.marketData.socialMediaDiscovery}%`);
        
        // Template Replication Assessment
        console.log('\n🔄 TEMPLATE REPLICATION READINESS:');
        console.log(`Overall Readiness: ${this.templateReplicationData.replicationReadiness}%`);
        
        const culturalAdoption = this.calculateCulturalAdoptionScore();
        console.log(`Cultural Adoption Score: ${culturalAdoption}/100`);
        
        // Recommendations for scaling
        this.generateScalingRecommendations(culturalAdoption);
        
        console.log('\n' + '🇦🇷'.repeat(40) + '\n');
    }

    generateScalingRecommendations(culturalScore) {
        console.log('\n🚀 SCALING RECOMMENDATIONS FOR DAY 7:');
        
        if (culturalScore >= 80) {
            console.log('✅ EXCELLENT - Ready for aggressive scaling to 1000+ users');
            console.log('  - Deploy psychology vertical template immediately');
            console.log('  - Expand to 3 major Argentine cities');
            console.log('  - Launch premium referral incentives');
        } else if (culturalScore >= 60) {
            console.log('🟡 GOOD - Moderate scaling recommended');
            console.log('  - Focus on Buenos Aires market consolidation');
            console.log('  - Optimize MercadoPago integration further');
            console.log('  - Enhance WhatsApp sharing features');
        } else {
            console.log('🟠 CAUTION - Address cultural adoption gaps');
            console.log('  - Improve Spanish localization');
            console.log('  - Increase WhatsApp integration prominence');
            console.log('  - Optimize mobile experience further');
        }
        
        // Template replication insights
        console.log('\n🔄 TEMPLATE REPLICATION INSIGHTS:');
        if (this.templateReplicationData.replicationReadiness >= 75) {
            console.log('✅ Core platform ready for psychology/medical templates');
            console.log('✅ Payment infrastructure validated for service verticals');
            console.log('✅ Argentina market patterns established for replication');
        } else {
            console.log('⚠️  Need more Argentina market validation before template replication');
        }
    }

    // Export data for Day 7 planning
    exportMarketData() {
        return {
            marketData: this.marketData,
            insights: this.argentinaInsights,
            replicationData: this.templateReplicationData,
            recommendations: this.generateScalingRecommendations(this.calculateCulturalAdoptionScore())
        };
    }
}

// Main execution
if (require.main === module) {
    const analytics = new ArgentinaMarketAnalytics();
    
    analytics.startArgentinaMarketAnalysis().catch(error => {
        console.error('❌ Failed to start Argentina market analytics:', error);
        process.exit(1);
    });
}

module.exports = ArgentinaMarketAnalytics;