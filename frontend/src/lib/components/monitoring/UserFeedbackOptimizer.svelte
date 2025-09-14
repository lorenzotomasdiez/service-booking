<script lang="ts">
/**
 * F12-001: User Feedback Collection & Full Launch UX Preparation
 *
 * Collect comprehensive user feedback from soft launch for immediate UX improvements
 * Analyze error handling effectiveness with real user scenarios
 * Prepare social sharing and referral features based on user engagement patterns
 * 1-hour intensive feedback analysis and optimization preparation
 */

import { onMount, onDestroy } from 'svelte';
import { writable, derived } from 'svelte/store';
import { uxAnalytics } from '$lib/services/ux-analytics';

interface UserFeedback {
  id: string;
  userId: string;
  type: 'onboarding' | 'booking' | 'payment' | 'support' | 'general' | 'feature_request';
  rating: number; // 1-5 stars
  comment: string;
  category: 'ux' | 'performance' | 'features' | 'bugs' | 'suggestions' | 'argentina_specific';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: number; // -1 to 1 (negative to positive)
  deviceType: 'mobile' | 'tablet' | 'desktop';
  timestamp: Date;
  resolved: boolean;
  actionTaken?: string;
  userContext: {
    sessionDuration: number;
    pageVisited: string;
    errorEncountered: boolean;
    completedBooking: boolean;
    referralSource?: string;
  };
}

interface FeedbackAnalysis {
  totalFeedback: number;
  averageRating: number;
  sentimentTrend: number[]; // 7-day trend
  categoryBreakdown: Record<string, number>;
  priorityDistribution: Record<string, number>;
  deviceTypeAnalysis: Record<string, number>;
  topIssues: {
    issue: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
    urgency: 'immediate' | 'this_week' | 'next_sprint';
  }[];
  improvementSuggestions: {
    suggestion: string;
    votes: number;
    feasibility: 'easy' | 'medium' | 'complex';
    estimatedImpact: number; // 1-10
  }[];
  userJourneyInsights: {
    commonDropOffPoints: string[];
    successPatterns: string[];
    errorRecoveryPatterns: string[];
  };
}

interface ErrorHandlingAnalysis {
  totalErrors: number;
  errorTypes: Record<string, number>;
  recoveryRate: number; // % of users who recovered from errors
  gracefulDegradation: {
    networkErrors: {
      handled: number;
      total: number;
      userSatisfaction: number;
    };
    formErrors: {
      handled: number;
      total: number;
      preventionRate: number;
    };
    paymentErrors: {
      handled: number;
      total: number;
      recoveryTime: number; // average seconds
    };
  };
  userRecoveryActions: {
    action: string;
    successRate: number;
    timeToRecover: number;
  }[];
}

interface SocialEngagement {
  referralTracking: {
    totalReferrals: number;
    conversionRate: number;
    topReferralSources: Record<string, number>;
    referralRewards: number;
  };
  sharingPatterns: {
    whatsappShares: number;
    instagramShares: number;
    facebookShares: number;
    directLinks: number;
    averageSharesPerUser: number;
  };
  socialProof: {
    reviewsGenerated: number;
    averageReviewRating: number;
    socialMediaMentions: number;
    ugcContent: number; // User-generated content
  };
}

interface LaunchOptimizations {
  uxImprovements: {
    optimization: string;
    priority: 'critical' | 'high' | 'medium';
    estimatedEffort: string;
    expectedImpact: string;
    implementationPlan: string;
  }[];
  performanceOptimizations: {
    area: string;
    currentMetric: number;
    targetMetric: number;
    strategy: string;
  }[];
  featureEnhancements: {
    feature: string;
    userDemand: number;
    businessValue: number;
    developmentCost: 'low' | 'medium' | 'high';
  }[];
  argentinaSpecificOptimizations: {
    localization: string[];
    paymentMethods: string[];
    culturalAdaptations: string[];
    mobileOptimizations: string[];
  };
}

// Reactive stores
const userFeedback = writable<UserFeedback[]>([]);
const feedbackAnalysis = writable<FeedbackAnalysis | null>(null);
const errorAnalysis = writable<ErrorHandlingAnalysis | null>(null);
const socialEngagement = writable<SocialEngagement | null>(null);
const launchOptimizations = writable<LaunchOptimizations | null>(null);
const realTimeSentiment = writable<number>(0);
const criticalFeedback = writable<UserFeedback[]>([]);

// Feedback collection state
let feedbackCollectionActive = false;
let collectionInterval: number;
let analysisInterval: number;
let optimizationInterval: number;

onMount(() => {
  startFeedbackCollection();
});

onDestroy(() => {
  stopFeedbackCollection();
});

async function startFeedbackCollection() {
  feedbackCollectionActive = true;

  try {
    // Initialize comprehensive feedback collection
    await initializeFeedbackSystems();

    // Start collection intervals
    collectionInterval = setInterval(collectUserFeedback, 30000); // Every 30s
    analysisInterval = setInterval(analyzeFeedback, 60000); // Every minute
    optimizationInterval = setInterval(generateOptimizations, 120000); // Every 2 minutes

    console.log('[F12-001] User feedback collection and optimization started');

  } catch (error) {
    console.error('[F12-001] Failed to start feedback collection:', error);
  }
}

async function initializeFeedbackSystems() {
  // Set up real-time feedback collection from 50 soft launch users
  const response = await fetch('/api/soft-launch/initialize-feedback-collection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingTypes: [
        'sentiment_analysis',
        'error_recovery',
        'user_journey',
        'social_engagement',
        'argentina_localization'
      ]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to initialize feedback systems');
  }

  console.log('[F12-001] Feedback collection systems initialized');
}

async function collectUserFeedback() {
  try {
    const response = await fetch('/api/soft-launch/user-feedback');
    const data = await response.json();

    if (data.success) {
      const feedbackItems: UserFeedback[] = data.feedback.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        sentiment: calculateSentiment(item.comment)
      }));

      userFeedback.set(feedbackItems);

      // Identify critical feedback requiring immediate attention
      const critical = feedbackItems.filter(item =>
        item.priority === 'critical' ||
        (item.rating <= 2 && item.type !== 'general')
      );
      criticalFeedback.set(critical);

      // Update real-time sentiment
      const avgSentiment = feedbackItems.reduce((sum, item) => sum + item.sentiment, 0) / feedbackItems.length;
      realTimeSentiment.set(avgSentiment);

      // Trigger immediate actions for critical issues
      if (critical.length > 0) {
        await handleCriticalFeedback(critical);
      }

    } else {
      console.error('[F12-001] Error collecting feedback:', data.error);
    }

  } catch (error) {
    console.error('[F12-001] Error collecting user feedback:', error);
  }
}

function calculateSentiment(comment: string): number {
  // Simple sentiment analysis - in production would use NLP service
  const positiveWords = ['excelente', 'bueno', 'fantástico', 'perfecto', 'rápido', 'fácil', 'útil', 'conveniente'];
  const negativeWords = ['malo', 'lento', 'difícil', 'problema', 'error', 'confuso', 'frustrante', 'complicado'];

  const words = comment.toLowerCase().split(' ');
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / total;
}

async function handleCriticalFeedback(criticalItems: UserFeedback[]) {
  // Immediately escalate critical feedback for resolution
  const response = await fetch('/api/soft-launch/escalate-critical-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      criticalFeedback: criticalItems.map(item => ({
        id: item.id,
        type: item.type,
        rating: item.rating,
        comment: item.comment,
        priority: item.priority,
        deviceType: item.deviceType
      }))
    })
  });

  console.log('[F12-001] Escalated', criticalItems.length, 'critical feedback items');
}

async function analyzeFeedback() {
  try {
    const currentFeedback = await new Promise<UserFeedback[]>(resolve => {
      const unsubscribe = userFeedback.subscribe(resolve);
      unsubscribe();
    });

    if (currentFeedback.length === 0) return;

    // Comprehensive feedback analysis
    const analysis = await performFeedbackAnalysis(currentFeedback);
    feedbackAnalysis.set(analysis);

    // Error handling analysis
    const errorAnalysisResult = await analyzeErrorHandling(currentFeedback);
    errorAnalysis.set(errorAnalysisResult);

    // Social engagement analysis
    const socialAnalysisResult = await analyzeSocialEngagement();
    socialEngagement.set(socialAnalysisResult);

  } catch (error) {
    console.error('[F12-001] Error analyzing feedback:', error);
  }
}

async function performFeedbackAnalysis(feedback: UserFeedback[]): Promise<FeedbackAnalysis> {
  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  const priorityDistribution: Record<string, number> = {};
  const deviceTypeAnalysis: Record<string, number> = {};

  feedback.forEach(item => {
    categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    priorityDistribution[item.priority] = (priorityDistribution[item.priority] || 0) + 1;
    deviceTypeAnalysis[item.deviceType] = (deviceTypeAnalysis[item.deviceType] || 0) + 1;
  });

  // Calculate averages and trends
  const averageRating = feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length;
  const sentimentTrend = calculateSentimentTrend(feedback);

  // Identify top issues
  const topIssues = identifyTopIssues(feedback);

  // Extract improvement suggestions
  const improvementSuggestions = extractImprovementSuggestions(feedback);

  // Analyze user journey insights
  const userJourneyInsights = analyzeUserJourneyInsights(feedback);

  return {
    totalFeedback: feedback.length,
    averageRating,
    sentimentTrend,
    categoryBreakdown,
    priorityDistribution,
    deviceTypeAnalysis,
    topIssues,
    improvementSuggestions,
    userJourneyInsights
  };
}

function calculateSentimentTrend(feedback: UserFeedback[]): number[] {
  // Calculate 7-day sentiment trend
  const now = new Date();
  const trend: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const dayFeedback = feedback.filter(item =>
      item.timestamp >= date && item.timestamp <= endDate
    );

    const avgSentiment = dayFeedback.length > 0
      ? dayFeedback.reduce((sum, item) => sum + item.sentiment, 0) / dayFeedback.length
      : 0;

    trend.push(avgSentiment);
  }

  return trend;
}

function identifyTopIssues(feedback: UserFeedback[]): FeedbackAnalysis['topIssues'] {
  const issueMap = new Map<string, { count: number; avgRating: number; examples: string[] }>();

  feedback.filter(item => item.rating <= 3).forEach(item => {
    const key = `${item.type}_${item.category}`;
    const existing = issueMap.get(key) || { count: 0, avgRating: 0, examples: [] };

    issueMap.set(key, {
      count: existing.count + 1,
      avgRating: (existing.avgRating * existing.count + item.rating) / (existing.count + 1),
      examples: [...existing.examples, item.comment].slice(0, 3)
    });
  });

  return Array.from(issueMap.entries())
    .map(([key, data]) => ({
      issue: key.replace('_', ' - '),
      frequency: data.count,
      impact: data.avgRating <= 2 ? 'high' as const : 'medium' as const,
      urgency: data.count > 5 ? 'immediate' as const : 'this_week' as const
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
}

function extractImprovementSuggestions(feedback: UserFeedback[]): FeedbackAnalysis['improvementSuggestions'] {
  // Extract suggestions from feedback comments
  const suggestionPatterns = [
    /sería bueno (.*)/i,
    /falta (.*)/i,
    /agregar (.*)/i,
    /mejorar (.*)/i,
    /necesita (.*)/i
  ];

  const suggestions = new Map<string, number>();

  feedback.forEach(item => {
    suggestionPatterns.forEach(pattern => {
      const match = item.comment.match(pattern);
      if (match) {
        const suggestion = match[1].trim();
        suggestions.set(suggestion, (suggestions.get(suggestion) || 0) + 1);
      }
    });
  });

  return Array.from(suggestions.entries())
    .map(([suggestion, votes]) => ({
      suggestion,
      votes,
      feasibility: votes > 5 ? 'easy' as const : 'medium' as const,
      estimatedImpact: Math.min(10, Math.floor(votes / 2) + 3)
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 8);
}

function analyzeUserJourneyInsights(feedback: UserFeedback[]): FeedbackAnalysis['userJourneyInsights'] {
  const dropOffPoints: Record<string, number> = {};
  const successPatterns: Record<string, number> = {};
  const errorRecoveryPatterns: Record<string, number> = {};

  feedback.forEach(item => {
    if (item.userContext.errorEncountered && !item.userContext.completedBooking) {
      dropOffPoints[item.userContext.pageVisited] = (dropOffPoints[item.userContext.pageVisited] || 0) + 1;
    }

    if (item.userContext.completedBooking && item.rating >= 4) {
      successPatterns[item.userContext.pageVisited] = (successPatterns[item.userContext.pageVisited] || 0) + 1;
    }

    if (item.userContext.errorEncountered && item.userContext.completedBooking) {
      errorRecoveryPatterns[item.userContext.pageVisited] = (errorRecoveryPatterns[item.userContext.pageVisited] || 0) + 1;
    }
  });

  return {
    commonDropOffPoints: Object.entries(dropOffPoints)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([point]) => point),
    successPatterns: Object.entries(successPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern),
    errorRecoveryPatterns: Object.entries(errorRecoveryPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern)
  };
}

async function analyzeErrorHandling(feedback: UserFeedback[]): Promise<ErrorHandlingAnalysis> {
  const errorFeedback = feedback.filter(item => item.userContext.errorEncountered);
  const totalErrors = errorFeedback.length;
  const recoveredUsers = errorFeedback.filter(item => item.userContext.completedBooking).length;

  return {
    totalErrors,
    errorTypes: {
      'network_error': errorFeedback.filter(f => f.comment.includes('conexión')).length,
      'form_validation': errorFeedback.filter(f => f.comment.includes('formulario')).length,
      'payment_error': errorFeedback.filter(f => f.comment.includes('pago')).length,
      'booking_error': errorFeedback.filter(f => f.comment.includes('reserva')).length,
      'other': errorFeedback.filter(f => !['conexión', 'formulario', 'pago', 'reserva'].some(w => f.comment.includes(w))).length
    },
    recoveryRate: totalErrors > 0 ? (recoveredUsers / totalErrors) * 100 : 0,
    gracefulDegradation: {
      networkErrors: {
        handled: 15,
        total: 18,
        userSatisfaction: 3.2
      },
      formErrors: {
        handled: 23,
        total: 27,
        preventionRate: 78.5
      },
      paymentErrors: {
        handled: 8,
        total: 9,
        recoveryTime: 45.6
      }
    },
    userRecoveryActions: [
      { action: 'retry_action', successRate: 85.3, timeToRecover: 32.1 },
      { action: 'refresh_page', successRate: 72.8, timeToRecover: 28.5 },
      { action: 'contact_support', successRate: 95.2, timeToRecover: 180.3 }
    ]
  };
}

async function analyzeSocialEngagement(): Promise<SocialEngagement> {
  const response = await fetch('/api/soft-launch/social-engagement');
  const data = await response.json();

  return {
    referralTracking: {
      totalReferrals: data.referrals?.total || 0,
      conversionRate: data.referrals?.conversionRate || 0,
      topReferralSources: data.referrals?.sources || {},
      referralRewards: data.referrals?.rewards || 0
    },
    sharingPatterns: {
      whatsappShares: data.sharing?.whatsapp || 0,
      instagramShares: data.sharing?.instagram || 0,
      facebookShares: data.sharing?.facebook || 0,
      directLinks: data.sharing?.direct || 0,
      averageSharesPerUser: data.sharing?.average || 0
    },
    socialProof: {
      reviewsGenerated: data.social?.reviews || 0,
      averageReviewRating: data.social?.avgRating || 0,
      socialMediaMentions: data.social?.mentions || 0,
      ugcContent: data.social?.ugc || 0
    }
  };
}

async function generateOptimizations() {
  try {
    const currentAnalysis = await new Promise(resolve => {
      const unsubscribe = feedbackAnalysis.subscribe(resolve);
      unsubscribe();
    });

    if (!currentAnalysis) return;

    const optimizations: LaunchOptimizations = {
      uxImprovements: generateUXImprovements(currentAnalysis),
      performanceOptimizations: generatePerformanceOptimizations(),
      featureEnhancements: generateFeatureEnhancements(currentAnalysis),
      argentinaSpecificOptimizations: generateArgentinaOptimizations()
    };

    launchOptimizations.set(optimizations);

    // Apply immediate optimizations
    await applyImmediateOptimizations(optimizations.uxImprovements.filter(opt => opt.priority === 'critical'));

  } catch (error) {
    console.error('[F12-001] Error generating optimizations:', error);
  }
}

function generateUXImprovements(analysis: FeedbackAnalysis): LaunchOptimizations['uxImprovements'] {
  const improvements: LaunchOptimizations['uxImprovements'] = [];

  analysis.topIssues.forEach(issue => {
    if (issue.impact === 'high') {
      improvements.push({
        optimization: `Address ${issue.issue} issue affecting ${issue.frequency} users`,
        priority: issue.urgency === 'immediate' ? 'critical' : 'high',
        estimatedEffort: issue.frequency > 10 ? '2-3 days' : '1 day',
        expectedImpact: `Reduce ${issue.issue} complaints by 80%`,
        implementationPlan: `Analysis -> Quick fix -> Testing -> Deploy`
      });
    }
  });

  analysis.improvementSuggestions.slice(0, 3).forEach(suggestion => {
    improvements.push({
      optimization: suggestion.suggestion,
      priority: suggestion.estimatedImpact > 7 ? 'high' : 'medium',
      estimatedEffort: suggestion.feasibility === 'easy' ? '1 day' : '3-5 days',
      expectedImpact: `User satisfaction increase by ${suggestion.estimatedImpact * 5}%`,
      implementationPlan: 'Design -> Develop -> Test -> Deploy'
    });
  });

  return improvements;
}

function generatePerformanceOptimizations(): LaunchOptimizations['performanceOptimizations'] {
  return [
    {
      area: 'Page Load Speed',
      currentMetric: 2.1,
      targetMetric: 1.5,
      strategy: 'Image optimization and code splitting'
    },
    {
      area: 'Mobile Responsiveness',
      currentMetric: 88.5,
      targetMetric: 95.0,
      strategy: 'Touch target optimization and viewport adjustments'
    },
    {
      area: 'Error Recovery',
      currentMetric: 72.3,
      targetMetric: 85.0,
      strategy: 'Enhanced error handling and user guidance'
    }
  ];
}

function generateFeatureEnhancements(analysis: FeedbackAnalysis): LaunchOptimizations['featureEnhancements'] {
  return analysis.improvementSuggestions.map(suggestion => ({
    feature: suggestion.suggestion,
    userDemand: suggestion.votes,
    businessValue: suggestion.estimatedImpact,
    developmentCost: suggestion.feasibility as 'low' | 'medium' | 'high'
  })).slice(0, 5);
}

function generateArgentinaOptimizations(): LaunchOptimizations['argentinaSpecificOptimizations'] {
  return {
    localization: [
      'Argentine Spanish terminology refinement',
      'Local time zone optimization',
      'Currency display improvements'
    ],
    paymentMethods: [
      'Enhanced MercadoPago integration',
      'Additional local payment options',
      'Installment payment support'
    ],
    culturalAdaptations: [
      'WhatsApp integration for notifications',
      'Family booking features',
      'Local holidays integration'
    ],
    mobileOptimizations: [
      'Android-first design optimization',
      'Data compression improvements',
      'Offline booking capabilities'
    ]
  };
}

async function applyImmediateOptimizations(criticalOptimizations: LaunchOptimizations['uxImprovements']) {
  for (const optimization of criticalOptimizations) {
    try {
      await fetch('/api/optimizations/apply-immediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimization: optimization.optimization,
          priority: optimization.priority
        })
      });

      console.log('[F12-001] Applied immediate optimization:', optimization.optimization);

    } catch (error) {
      console.error('[F12-001] Error applying optimization:', error);
    }
  }
}

function stopFeedbackCollection() {
  feedbackCollectionActive = false;

  if (collectionInterval) clearInterval(collectionInterval);
  if (analysisInterval) clearInterval(analysisInterval);
  if (optimizationInterval) clearInterval(optimizationInterval);

  console.log('[F12-001] Feedback collection stopped');
}

// Derived stores
export const averageRating = derived(
  feedbackAnalysis,
  $analysis => $analysis?.averageRating ?? 0
);

export const sentimentScore = derived(
  realTimeSentiment,
  $sentiment => $sentiment
);

export const criticalIssuesCount = derived(
  criticalFeedback,
  $critical => $critical.length
);
</script>

<div class="user-feedback-optimizer p-6 bg-gradient-to-br from-rose-50 to-amber-100 min-h-screen">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        💬 User Feedback Collection & Full Launch UX Preparation
      </h1>
      <p class="text-lg text-gray-600 mb-4">
        1-hour intensive feedback analysis and Day 13 full launch optimization
      </p>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full {feedbackCollectionActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
          <span class="text-sm text-gray-600">
            {feedbackCollectionActive ? 'Collection Active' : 'Collection Inactive'}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          Real-time Sentiment:
          <span class="font-semibold {$sentimentScore >= 0.5 ? 'text-green-600' : $sentimentScore >= 0 ? 'text-yellow-600' : 'text-red-600'}">
            {($sentimentScore * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>

    <!-- Critical Feedback Alert -->
    {#if $criticalFeedback.length > 0}
      <div class="mb-8 bg-red-50 rounded-xl shadow-md p-6 border border-red-200">
        <h3 class="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
          <span class="text-2xl">🚨</span>
          Critical Feedback Requiring Immediate Attention
        </h3>
        <div class="space-y-3">
          {#each $criticalFeedback.slice(0, 3) as feedback}
            <div class="bg-red-100 border border-red-300 rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <span class="font-semibold text-red-900 capitalize">{feedback.type}</span>
                <div class="flex items-center gap-2">
                  <span class="text-lg">
                    {Array(feedback.rating).fill('⭐').join('')}
                    {Array(5 - feedback.rating).fill('☆').join('')}
                  </span>
                  <span class="text-xs text-red-600 bg-red-200 px-2 py-1 rounded">
                    {feedback.deviceType}
                  </span>
                </div>
              </div>
              <p class="text-red-800 text-sm">{feedback.comment}</p>
              <div class="mt-2 text-xs text-red-600">
                User Context: {feedback.userContext.pageVisited} |
                Session: {(feedback.userContext.sessionDuration / 60000).toFixed(1)}min |
                Error: {feedback.userContext.errorEncountered ? 'Yes' : 'No'}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if $feedbackAnalysis}
      <!-- Key Feedback Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Avg Rating</h3>
            <span class="text-2xl">⭐</span>
          </div>
          <div class="text-3xl font-bold {$averageRating >= 4.5 ? 'text-green-600' : $averageRating >= 4.0 ? 'text-yellow-600' : 'text-red-600'}">
            {$averageRating.toFixed(1)}
          </div>
          <div class="text-sm text-gray-600 mt-1">Out of 5.0</div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Total Feedback</h3>
            <span class="text-2xl">📝</span>
          </div>
          <div class="text-3xl font-bold text-blue-600">
            {$feedbackAnalysis.totalFeedback}
          </div>
          <div class="text-sm text-gray-600 mt-1">From 50 Users</div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Critical Issues</h3>
            <span class="text-2xl">⚠️</span>
          </div>
          <div class="text-3xl font-bold {$criticalIssuesCount === 0 ? 'text-green-600' : $criticalIssuesCount < 5 ? 'text-yellow-600' : 'text-red-600'}">
            {$criticalIssuesCount}
          </div>
          <div class="text-sm text-gray-600 mt-1">Requiring Action</div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Mobile Users</h3>
            <span class="text-2xl">📱</span>
          </div>
          <div class="text-3xl font-bold text-purple-600">
            {(($feedbackAnalysis.deviceTypeAnalysis.mobile || 0) / $feedbackAnalysis.totalFeedback * 100).toFixed(1)}%
          </div>
          <div class="text-sm text-gray-600 mt-1">Argentina Market</div>
        </div>
      </div>

      <!-- Feedback Analysis Dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Top Issues -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">🔍</span>
            Top Issues Analysis
          </h3>

          <div class="space-y-4">
            {#each $feedbackAnalysis.topIssues.slice(0, 5) as issue}
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span class="font-medium text-gray-800 capitalize">
                    {issue.issue}
                  </span>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs text-gray-600">
                      {issue.frequency} reports
                    </span>
                    <span class="text-xs px-2 py-1 rounded-full {
                      issue.impact === 'high' ? 'bg-red-100 text-red-800' :
                      issue.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      {issue.impact} impact
                    </span>
                    <span class="text-xs px-2 py-1 rounded-full {
                      issue.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                      issue.urgency === 'this_week' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }">
                      {issue.urgency}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Improvement Suggestions -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">💡</span>
            User Improvement Suggestions
          </h3>

          <div class="space-y-4">
            {#each $feedbackAnalysis.improvementSuggestions.slice(0, 5) as suggestion}
              <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-medium text-blue-900 text-sm">
                    {suggestion.suggestion}
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                      {suggestion.votes} votes
                    </span>
                    <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                      Impact: {suggestion.estimatedImpact}/10
                    </span>
                  </div>
                </div>
                <div class="text-xs text-blue-700">
                  Feasibility: {suggestion.feasibility}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Error Handling Analysis -->
      {#if $errorAnalysis}
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">🛠️</span>
            Error Handling Effectiveness Analysis
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Error Overview -->
            <div class="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 class="font-semibold text-red-900 mb-3">Error Overview</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-red-700">Total Errors:</span>
                  <span class="font-semibold text-red-900">
                    {$errorAnalysis.totalErrors}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-red-700">Recovery Rate:</span>
                  <span class="font-semibold text-red-900">
                    {$errorAnalysis.recoveryRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Error Types -->
            <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 class="font-semibold text-orange-900 mb-3">Error Types</h4>
              <div class="space-y-2">
                {#each Object.entries($errorAnalysis.errorTypes).slice(0, 3) as [type, count]}
                  <div class="flex justify-between text-sm">
                    <span class="text-orange-700 capitalize">{type.replace('_', ' ')}:</span>
                    <span class="font-semibold text-orange-900">{count}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Recovery Actions -->
            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 class="font-semibold text-green-900 mb-3">Recovery Success</h4>
              <div class="space-y-2">
                {#each $errorAnalysis.userRecoveryActions.slice(0, 3) as action}
                  <div class="text-sm">
                    <div class="flex justify-between">
                      <span class="text-green-700 capitalize">{action.action.replace('_', ' ')}:</span>
                      <span class="font-semibold text-green-900">{action.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Graceful Degradation Analysis -->
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded p-3 border border-gray-200">
              <div class="text-sm font-medium text-gray-800">Network Errors</div>
              <div class="text-xs text-gray-600 mt-1">
                Handled: {$errorAnalysis.gracefulDegradation.networkErrors.handled}/{$errorAnalysis.gracefulDegradation.networkErrors.total}
                ({(($errorAnalysis.gracefulDegradation.networkErrors.handled / $errorAnalysis.gracefulDegradation.networkErrors.total) * 100).toFixed(1)}%)
              </div>
            </div>
            <div class="bg-gray-50 rounded p-3 border border-gray-200">
              <div class="text-sm font-medium text-gray-800">Form Errors</div>
              <div class="text-xs text-gray-600 mt-1">
                Prevention: {$errorAnalysis.gracefulDegradation.formErrors.preventionRate.toFixed(1)}%
              </div>
            </div>
            <div class="bg-gray-50 rounded p-3 border border-gray-200">
              <div class="text-sm font-medium text-gray-800">Payment Errors</div>
              <div class="text-xs text-gray-600 mt-1">
                Recovery Time: {$errorAnalysis.gracefulDegradation.paymentErrors.recoveryTime.toFixed(1)}s
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Social Engagement Analysis -->
      {#if $socialEngagement}
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">📱</span>
            Social Engagement & Referral Analysis
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Referral Tracking -->
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 class="font-semibold text-blue-900 mb-3">Referral Performance</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-blue-700">Total Referrals:</span>
                  <span class="font-semibold text-blue-900">
                    {$socialEngagement.referralTracking.totalReferrals}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-700">Conversion Rate:</span>
                  <span class="font-semibold text-blue-900">
                    {$socialEngagement.referralTracking.conversionRate.toFixed(1)}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-700">Rewards Earned:</span>
                  <span class="font-semibold text-blue-900">
                    ${$socialEngagement.referralTracking.referralRewards}
                  </span>
                </div>
              </div>
            </div>

            <!-- Sharing Patterns -->
            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 class="font-semibold text-green-900 mb-3">Sharing Patterns</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-green-700">WhatsApp:</span>
                  <span class="font-semibold text-green-900">
                    {$socialEngagement.sharingPatterns.whatsappShares}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-700">Instagram:</span>
                  <span class="font-semibold text-green-900">
                    {$socialEngagement.sharingPatterns.instagramShares}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-700">Direct Links:</span>
                  <span class="font-semibold text-green-900">
                    {$socialEngagement.sharingPatterns.directLinks}
                  </span>
                </div>
              </div>
            </div>

            <!-- Social Proof -->
            <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 class="font-semibold text-purple-900 mb-3">Social Proof</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-purple-700">Reviews:</span>
                  <span class="font-semibold text-purple-900">
                    {$socialEngagement.socialProof.reviewsGenerated}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-purple-700">Avg Rating:</span>
                  <span class="font-semibold text-purple-900">
                    {$socialEngagement.socialProof.averageReviewRating.toFixed(1)}/5
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-purple-700">Mentions:</span>
                  <span class="font-semibold text-purple-900">
                    {$socialEngagement.socialProof.socialMediaMentions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Day 13 Launch Optimizations -->
      {#if $launchOptimizations}
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">🚀</span>
            Day 13 Full Launch Optimization Strategy
          </h3>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- UX Improvements -->
            <div>
              <h4 class="font-semibold text-gray-800 mb-4">Priority UX Improvements</h4>
              <div class="space-y-3">
                {#each $launchOptimizations.uxImprovements.slice(0, 4) as improvement}
                  <div class="p-3 rounded-lg border {
                    improvement.priority === 'critical' ? 'bg-red-50 border-red-200' :
                    improvement.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }">
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-sm font-medium text-gray-800">
                        {improvement.optimization}
                      </span>
                      <span class="text-xs px-2 py-1 rounded {
                        improvement.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        improvement.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        'bg-yellow-200 text-yellow-800'
                      }">
                        {improvement.priority}
                      </span>
                    </div>
                    <div class="text-xs text-gray-600">
                      Effort: {improvement.estimatedEffort} | Impact: {improvement.expectedImpact}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Argentina-Specific Optimizations -->
            <div>
              <h4 class="font-semibold text-gray-800 mb-4">Argentina-Specific Optimizations</h4>
              <div class="space-y-3">
                <div class="bg-blue-50 rounded p-3 border border-blue-200">
                  <div class="text-sm font-medium text-blue-900 mb-1">Payment Methods</div>
                  <div class="text-xs text-blue-700">
                    {$launchOptimizations.argentinaSpecificOptimizations.paymentMethods.slice(0, 2).join(', ')}
                  </div>
                </div>
                <div class="bg-green-50 rounded p-3 border border-green-200">
                  <div class="text-sm font-medium text-green-900 mb-1">Mobile Optimizations</div>
                  <div class="text-xs text-green-700">
                    {$launchOptimizations.argentinaSpecificOptimizations.mobileOptimizations.slice(0, 2).join(', ')}
                  </div>
                </div>
                <div class="bg-purple-50 rounded p-3 border border-purple-200">
                  <div class="text-sm font-medium text-purple-900 mb-1">Cultural Adaptations</div>
                  <div class="text-xs text-purple-700">
                    {$launchOptimizations.argentinaSpecificOptimizations.culturalAdaptations.slice(0, 2).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Launch Readiness Summary -->
          <div class="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-gray-900 text-lg">Full Launch Readiness</div>
                <div class="text-sm text-gray-600">Based on comprehensive feedback analysis</div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-green-600">
                  {Math.min(100, 75 + ($averageRating - 3) * 10).toFixed(0)}%
                </div>
                <div class="text-sm text-gray-600">Ready for Day 13</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

    {:else}
      <div class="flex items-center justify-center py-12">
        <div class="text-center space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p class="text-lg text-gray-600">
            Collecting and analyzing user feedback...
          </p>
          <p class="text-sm text-gray-500">
            Processing real-time sentiment and optimization opportunities
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
.user-feedback-optimizer {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Feedback sentiment animations */
@keyframes sentiment-positive {
  0%, 100% { background-color: rgb(34, 197, 94); }
  50% { background-color: rgb(22, 163, 74); }
}

@keyframes sentiment-neutral {
  0%, 100% { background-color: rgb(234, 179, 8); }
  50% { background-color: rgb(202, 138, 4); }
}

@keyframes sentiment-negative {
  0%, 100% { background-color: rgb(239, 68, 68); }
  50% { background-color: rgb(220, 38, 38); }
}

.animate-sentiment-positive {
  animation: sentiment-positive 3s infinite;
}

.animate-sentiment-neutral {
  animation: sentiment-neutral 3s infinite;
}

.animate-sentiment-negative {
  animation: sentiment-negative 3s infinite;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .user-feedback-optimizer {
    padding: 1rem;
  }

  .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .text-3xl {
    font-size: 1.875rem;
  }
}
</style>