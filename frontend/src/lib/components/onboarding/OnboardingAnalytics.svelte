<!-- Onboarding Analytics & Drop-off Analysis for Launch Day -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { browser } from '$app/environment';
  import { uxOptimizationService } from '$lib/services/ux-optimization';

  interface OnboardingMetrics {
    totalStarted: number;
    totalCompleted: number;
    dropOffPoints: Record<number, number>; // step -> drop count
    averageTimePerStep: Record<number, number>; // step -> seconds
    completionRate: number;
    mobileCompletionRate: number;
    argentinianUserRate: number;
    commonErrors: Array<{
      step: number;
      error: string;
      count: number;
      lastSeen: Date;
    }>;
    userFeedback: Array<{
      step: number;
      rating: number;
      comment: string;
      timestamp: Date;
    }>;
  }

  interface OnboardingStep {
    step: number;
    name: string;
    started: number;
    completed: number;
    abandoned: number;
    avgTimeSeconds: number;
    errorRate: number;
    mobileCompletionRate: number;
  }

  interface UserJourney {
    sessionId: string;
    userType: 'client' | 'provider';
    deviceType: 'mobile' | 'desktop';
    connectionSpeed: string;
    isArgentinian: boolean;
    startTime: Date;
    currentStep: number;
    stepTimings: Record<number, number>;
    completed: boolean;
    abandonedAt?: number;
    errors: string[];
  }

  // Store for onboarding analytics
  const analyticsStore = writable<OnboardingMetrics>({
    totalStarted: 0,
    totalCompleted: 0,
    dropOffPoints: {},
    averageTimePerStep: {},
    completionRate: 0,
    mobileCompletionRate: 0,
    argentinianUserRate: 0,
    commonErrors: [],
    userFeedback: []
  });

  // Current user journeys
  const activeJourneys = writable<Map<string, UserJourney>>(new Map());

  // Derived insights
  const onboardingInsights = derived(analyticsStore, $analytics => {
    const totalDropoffs = Object.values($analytics.dropOffPoints).reduce((sum, count) => sum + count, 0);
    const criticalDropoffSteps = Object.entries($analytics.dropOffPoints)
      .filter(([_, count]) => count > $analytics.totalStarted * 0.1) // More than 10% drop
      .map(([step, count]) => ({ step: parseInt(step), count, rate: (count / $analytics.totalStarted) * 100 }))
      .sort((a, b) => b.rate - a.rate);

    const improvementAreas = [];
    
    // Identify improvement areas
    if ($analytics.mobileCompletionRate < 80) {
      improvementAreas.push('Mobile experience needs optimization');
    }
    if ($analytics.completionRate < 85) {
      improvementAreas.push('Overall onboarding flow needs simplification');
    }
    if (criticalDropoffSteps.length > 0) {
      improvementAreas.push(`Step ${criticalDropoffSteps[0].step} has high drop-off rate`);
    }

    return {
      criticalDropoffSteps,
      improvementAreas,
      healthScore: Math.min($analytics.completionRate, $analytics.mobileCompletionRate),
      avgCompletionTime: Object.values($analytics.averageTimePerStep).reduce((sum, time) => sum + time, 0)
    };
  });

  let monitoringInterval: NodeJS.Timeout;
  let currentSessionId = '';
  let currentJourney: UserJourney | null = null;

  // Step definitions for both user types
  const stepDefinitions = {
    client: [
      { name: 'Welcome', description: 'Welcome screen' },
      { name: 'Profile Setup', description: 'Complete personal profile' },
      { name: 'Location', description: 'Set location preferences' },
      { name: 'Explore Services', description: 'Browse available services' },
      { name: 'Completion', description: 'Onboarding complete' }
    ],
    provider: [
      { name: 'Welcome', description: 'Professional welcome' },
      { name: 'Professional Profile', description: 'Complete professional profile' },
      { name: 'Service Configuration', description: 'Set up services and pricing' },
      { name: 'Schedule Setup', description: 'Configure availability' },
      { name: 'Portfolio Upload', description: 'Upload work samples' },
      { name: 'Completion', description: 'Professional setup complete' }
    ]
  };

  onMount(() => {
    if (browser) {
      initializeAnalytics();
      startMonitoring();
    }
  });

  onDestroy(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    if (currentJourney && !currentJourney.completed) {
      recordAbandonedJourney();
    }
  });

  function initializeAnalytics() {
    // Load existing data from localStorage
    const savedData = localStorage.getItem('onboarding_analytics');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        analyticsStore.set(data);
      } catch (error) {
        console.warn('Failed to load onboarding analytics:', error);
      }
    }

    // Generate session ID
    currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function startMonitoring() {
    // Monitor every 30 seconds
    monitoringInterval = setInterval(() => {
      saveAnalytics();
      analyzeCurrentJourneys();
      detectIssues();
    }, 30000);
  }

  function saveAnalytics() {
    analyticsStore.update(data => {
      localStorage.setItem('onboarding_analytics', JSON.stringify(data));
      return data;
    });
  }

  function analyzeCurrentJourneys() {
    activeJourneys.update(journeys => {
      const now = Date.now();
      
      journeys.forEach((journey) => {
        const timeInCurrentStep = now - (journey.stepTimings[journey.currentStep] || now);
        
        // If user has been in a step for more than 5 minutes, consider it stalled
        if (timeInCurrentStep > 300000) { // 5 minutes
          recordStepError(journey.currentStep, 'Step timeout - user stalled');
          
          // Show guidance
          if (browser) {
            uxOptimizationService.showUserGuidance(
              getStepGuidanceMessage(journey.currentStep, journey.userType),
              'info'
            );
          }
        }
      });

      return journeys;
    });
  }

  function detectIssues() {
    analyticsStore.update(analytics => {
      // Auto-detect critical issues
      Object.entries(analytics.dropOffPoints).forEach(([step, dropCount]) => {
        const dropRate = analytics.totalStarted > 0 ? (dropCount / analytics.totalStarted) * 100 : 0;
        
        if (dropRate > 25) { // More than 25% drop at this step
          console.warn(`Critical drop-off detected at step ${step}: ${dropRate.toFixed(1)}%`);
          
          // Automatically apply optimizations
          optimizeStepBasedOnDropoff(parseInt(step));
        }
      });

      return analytics;
    });
  }

  function optimizeStepBasedOnDropoff(step: number) {
    // Apply automatic optimizations based on common drop-off points
    switch (step) {
      case 1: // Profile setup
        uxOptimizationService.showUserGuidance(
          'Tip: Completar tu perfil te ayuda a encontrar mejores servicios. ¡Solo toma 2 minutos!',
          'info'
        );
        break;
      case 2: // Location or service setup
        uxOptimizationService.showUserGuidance(
          'Problema con la ubicación? Puedes configurarla más tarde en tu perfil.',
          'warning'
        );
        break;
      case 3: // Complex configurations
        uxOptimizationService.showUserGuidance(
          'Este paso es opcional. Puedes continuar y configurarlo después.',
          'info'
        );
        break;
    }
  }

  function getStepGuidanceMessage(step: number, userType: 'client' | 'provider'): string {
    const messages = {
      client: {
        1: 'Para completar tu perfil, solo necesitas tu nombre y teléfono. ¡Es rápido!',
        2: 'Permitir ubicación te ayuda a encontrar servicios cerca de ti.',
        3: 'Explora servicios disponibles o continúa para terminar la configuración.'
      },
      provider: {
        1: 'Completa tu perfil profesional para atraer más clientes.',
        2: 'Configura al menos un servicio para empezar a recibir reservas.',
        3: 'Establece tus horarios de atención preferidos.',
        4: 'Las fotos de tu trabajo aumentan las reservas un 60%.'
      }
    };

    return messages[userType][step] || 'Si necesitas ayuda, contacta soporte.';
  }

  // Public API for tracking onboarding events
  export function startOnboardingJourney(userType: 'client' | 'provider') {
    const journey: UserJourney = {
      sessionId: currentSessionId,
      userType,
      deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      connectionSpeed: 'unknown', // Will be updated by UX service
      isArgentinian: navigator.language?.includes('es-AR') || Intl.DateTimeFormat().resolvedOptions().timeZone === 'America/Argentina/Buenos_Aires',
      startTime: new Date(),
      currentStep: 0,
      stepTimings: { 0: Date.now() },
      completed: false,
      errors: []
    };

    currentJourney = journey;
    
    activeJourneys.update(journeys => {
      journeys.set(currentSessionId, journey);
      return journeys;
    });

    analyticsStore.update(analytics => ({
      ...analytics,
      totalStarted: analytics.totalStarted + 1
    }));

    console.log('[Onboarding Analytics] Journey started:', journey);
  }

  export function trackStepProgress(step: number) {
    if (!currentJourney) return;

    const now = Date.now();
    const previousStepTime = currentJourney.stepTimings[currentJourney.currentStep] || now;
    const timeInPreviousStep = now - previousStepTime;

    // Update journey
    currentJourney.currentStep = step;
    currentJourney.stepTimings[step] = now;

    // Update analytics
    analyticsStore.update(analytics => {
      const newAverageTime = analytics.averageTimePerStep[step - 1] || 0;
      const stepCount = Object.keys(analytics.averageTimePerStep).length || 1;
      
      return {
        ...analytics,
        averageTimePerStep: {
          ...analytics.averageTimePerStep,
          [step - 1]: (newAverageTime * (stepCount - 1) + timeInPreviousStep / 1000) / stepCount
        }
      };
    });

    console.log(`[Onboarding Analytics] Step ${step} reached, previous step took ${(timeInPreviousStep / 1000).toFixed(1)}s`);
  }

  export function trackStepError(step: number, error: string) {
    if (currentJourney) {
      currentJourney.errors.push(error);
    }

    recordStepError(step, error);
  }

  function recordStepError(step: number, error: string) {
    analyticsStore.update(analytics => {
      const existingError = analytics.commonErrors.find(e => e.step === step && e.error === error);
      
      if (existingError) {
        existingError.count++;
        existingError.lastSeen = new Date();
      } else {
        analytics.commonErrors.push({
          step,
          error,
          count: 1,
          lastSeen: new Date()
        });
      }

      // Keep only top 20 errors
      analytics.commonErrors = analytics.commonErrors
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return analytics;
    });
  }

  export function trackStepAbandonment(step: number) {
    if (currentJourney) {
      currentJourney.abandonedAt = step;
    }

    analyticsStore.update(analytics => ({
      ...analytics,
      dropOffPoints: {
        ...analytics.dropOffPoints,
        [step]: (analytics.dropOffPoints[step] || 0) + 1
      }
    }));

    console.log(`[Onboarding Analytics] Abandonment at step ${step}`);
  }

  export function completeOnboardingJourney() {
    if (!currentJourney) return;

    currentJourney.completed = true;
    
    analyticsStore.update(analytics => {
      const newCompletionRate = ((analytics.totalCompleted + 1) / (analytics.totalStarted || 1)) * 100;
      
      // Calculate mobile completion rate
      let mobileCompleted = 0;
      let mobileTotal = 0;
      
      // This would ideally come from stored journey data
      if (currentJourney?.deviceType === 'mobile') {
        mobileCompleted = Math.floor(analytics.totalCompleted * 0.8); // Estimate
        mobileTotal = Math.floor(analytics.totalStarted * 0.8); // Argentina is 80% mobile
      }
      
      const newMobileCompletionRate = mobileTotal > 0 ? (mobileCompleted / mobileTotal) * 100 : 0;

      return {
        ...analytics,
        totalCompleted: analytics.totalCompleted + 1,
        completionRate: newCompletionRate,
        mobileCompletionRate: Math.max(newMobileCompletionRate, analytics.mobileCompletionRate)
      };
    });

    activeJourneys.update(journeys => {
      journeys.delete(currentSessionId);
      return journeys;
    });

    console.log('[Onboarding Analytics] Journey completed successfully');
  }

  function recordAbandonedJourney() {
    if (currentJourney && !currentJourney.completed) {
      trackStepAbandonment(currentJourney.currentStep);
      
      activeJourneys.update(journeys => {
        journeys.delete(currentSessionId);
        return journeys;
      });
    }
  }

  export function addUserFeedback(step: number, rating: number, comment: string = '') {
    analyticsStore.update(analytics => ({
      ...analytics,
      userFeedback: [
        ...analytics.userFeedback,
        {
          step,
          rating,
          comment,
          timestamp: new Date()
        }
      ].slice(-50) // Keep last 50 feedback entries
    }));
  }

  // Export analytics for reporting
  export function getAnalyticsReport() {
    let currentAnalytics: OnboardingMetrics;
    analyticsStore.subscribe(value => currentAnalytics = value)();
    
    const insights = get(onboardingInsights);
    
    return {
      metrics: currentAnalytics!,
      insights,
      recommendations: generateRecommendations(currentAnalytics!, insights)
    };
  }

  function generateRecommendations(analytics: OnboardingMetrics, insights: any): string[] {
    const recommendations = [];

    if (analytics.completionRate < 85) {
      recommendations.push('Consider simplifying the onboarding flow');
    }

    if (analytics.mobileCompletionRate < analytics.completionRate - 10) {
      recommendations.push('Optimize mobile experience - significant gap detected');
    }

    if (insights.criticalDropoffSteps.length > 0) {
      const step = insights.criticalDropoffSteps[0];
      recommendations.push(`Address high drop-off at step ${step.step} (${step.rate.toFixed(1)}% abandon here)`);
    }

    if (analytics.commonErrors.length > 5) {
      recommendations.push('Focus on error prevention - too many user errors detected');
    }

    if (insights.avgCompletionTime > 600) { // 10 minutes
      recommendations.push('Onboarding takes too long - consider reducing steps');
    }

    return recommendations;
  }

  // Helper to get current insights
  function get(store: any) {
    let value: any;
    store.subscribe((val: any) => value = val)();
    return value;
  }
</script>

<!-- Analytics Dashboard Component -->
<div class="onboarding-analytics p-6 bg-white rounded-xl shadow-soft border border-gray-200">
  <h2 class="text-lg font-semibold text-gray-900 mb-6">📊 Onboarding Analytics (Launch Day)</h2>
  
  <!-- Key Metrics -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="metric-card">
      <div class="text-2xl font-bold text-blue-600">{$analyticsStore.totalStarted}</div>
      <div class="text-sm text-gray-600">Started</div>
    </div>
    
    <div class="metric-card">
      <div class="text-2xl font-bold text-green-600">{$analyticsStore.totalCompleted}</div>
      <div class="text-sm text-gray-600">Completed</div>
    </div>
    
    <div class="metric-card">
      <div class="text-2xl font-bold {$analyticsStore.completionRate >= 85 ? 'text-green-600' : $analyticsStore.completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}">
        {$analyticsStore.completionRate.toFixed(1)}%
      </div>
      <div class="text-sm text-gray-600">Completion Rate</div>
    </div>
    
    <div class="metric-card">
      <div class="text-2xl font-bold {$analyticsStore.mobileCompletionRate >= 80 ? 'text-green-600' : $analyticsStore.mobileCompletionRate >= 65 ? 'text-yellow-600' : 'text-red-600'}">
        {$analyticsStore.mobileCompletionRate.toFixed(1)}%
      </div>
      <div class="text-sm text-gray-600">Mobile Rate</div>
    </div>
  </div>

  <!-- Health Score -->
  <div class="bg-gray-50 p-4 rounded-lg mb-6">
    <div class="flex items-center justify-between">
      <span class="font-medium text-gray-700">Onboarding Health Score</span>
      <div class="flex items-center space-x-2">
        <div class="text-lg font-bold {$onboardingInsights.healthScore >= 85 ? 'text-green-600' : $onboardingInsights.healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'}">
          {$onboardingInsights.healthScore.toFixed(0)}/100
        </div>
        <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            class="h-full transition-all duration-300 {$onboardingInsights.healthScore >= 85 ? 'bg-green-500' : $onboardingInsights.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}"
            style="width: {$onboardingInsights.healthScore}%"
          ></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Critical Drop-off Points -->
  {#if $onboardingInsights.criticalDropoffSteps.length > 0}
    <div class="mb-6">
      <h3 class="font-medium text-gray-900 mb-3">🚨 Critical Drop-off Points</h3>
      <div class="space-y-2">
        {#each $onboardingInsights.criticalDropoffSteps.slice(0, 3) as dropoff}
          <div class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <span class="font-medium text-red-800">Step {dropoff.step}</span>
              <span class="text-sm text-red-600 ml-2">
                {dropoff.count} users ({dropoff.rate.toFixed(1)}% drop-off)
              </span>
            </div>
            <button class="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors">
              Optimize
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Common Errors -->
  {#if $analyticsStore.commonErrors.length > 0}
    <div class="mb-6">
      <h3 class="font-medium text-gray-900 mb-3">⚠️ Common Issues</h3>
      <div class="space-y-1">
        {#each $analyticsStore.commonErrors.slice(0, 5) as error}
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">Step {error.step}: {error.error}</span>
            <span class="text-gray-500">{error.count}x</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Improvement Areas -->
  {#if $onboardingInsights.improvementAreas.length > 0}
    <div class="mb-6">
      <h3 class="font-medium text-gray-900 mb-3">💡 Improvement Areas</h3>
      <div class="space-y-2">
        {#each $onboardingInsights.improvementAreas as area}
          <div class="flex items-center text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {area}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Active Journeys -->
  {#if $activeJourneys.size > 0}
    <div>
      <h3 class="font-medium text-gray-900 mb-3">🔄 Active Journeys ({$activeJourneys.size})</h3>
      <div class="text-sm text-gray-600">
        {$activeJourneys.size} users currently in onboarding process
      </div>
    </div>
  {/if}
</div>

<style>
  .metric-card {
    @apply p-4 bg-gray-50 rounded-lg text-center;
  }
  
  .onboarding-analytics {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
</style>