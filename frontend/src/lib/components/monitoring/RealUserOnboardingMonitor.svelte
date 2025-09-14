<script lang="ts">
/**
 * F12-001: Real-User Onboarding Experience Monitoring & Optimization
 *
 * Monitor customer registration with 50 real users completing onboarding flow optimization
 * Track customer dashboard usage with actual booking management and service discovery patterns
 * Real-time UX improvements and conversion optimization
 */

import { onMount, onDestroy } from 'svelte';
import { writable, derived } from 'svelte/store';
import { uxAnalytics } from '$lib/services/ux-analytics';
import { frontendMonitoringStore } from '$lib/stores/frontend-monitoring';

interface OnboardingStep {
  step: 'registration' | 'verification' | 'profile_setup' | 'dashboard_intro' | 'first_booking_attempt';
  startTime: number;
  completionTime?: number;
  abandoned: boolean;
  errors: OnboardingError[];
  userSatisfaction?: number;
  optimizations: string[];
  argentinaSpecific: {
    dniValidation?: boolean;
    mercadopagoSetup?: boolean;
    whatsappVerification?: boolean;
    locationPermission?: boolean;
  };
}

interface OnboardingError {
  type: 'validation' | 'network' | 'server' | 'user_input';
  message: string;
  timestamp: number;
  recovered: boolean;
  recoveryTime?: number;
}

interface OnboardingAnalytics {
  totalUsers: number;
  completionRate: number;
  avgCompletionTime: number;
  abandonmentPoints: Record<string, number>;
  errorPatterns: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  argentinaUserBehavior: {
    preferredPaymentMethods: Record<string, number>;
    locationDistribution: Record<string, number>;
    timeOfDayPatterns: Record<string, number>;
    mobileUsageRate: number;
  };
  conversionOptimizations: {
    appliedOptimizations: string[];
    conversionImprovement: number;
    userFeedback: string[];
  };
}

interface CustomerDashboardUsage {
  sessionMetrics: {
    averageSessionDuration: number;
    pagesViewed: number;
    featuresUsed: string[];
    bookingInteractions: number;
  };
  serviceDiscovery: {
    searchQueries: number;
    filterUsage: Record<string, number>;
    providerViews: number;
    bookingAttempts: number;
    conversionRate: number;
  };
  profileManagement: {
    updatesCount: number;
    preferencesSet: string[];
    personalizationEngagement: number;
  };
  supportInteraction: {
    helpViewedSections: string[];
    ticketsCreated: number;
    satisfactionRating: number;
  };
}

// Reactive stores
const onboardingSteps = writable<OnboardingStep[]>([]);
const onboardingAnalytics = writable<OnboardingAnalytics | null>(null);
const dashboardUsage = writable<CustomerDashboardUsage | null>(null);
const activeUsers = writable<number>(0);
const realTimeOptimizations = writable<string[]>([]);

// Monitoring state
let monitoringActive = false;
let onboardingInterval: number;
let analyticsInterval: number;
let optimizationInterval: number;

onMount(() => {
  startOnboardingMonitoring();
});

onDestroy(() => {
  stopOnboardingMonitoring();
});

async function startOnboardingMonitoring() {
  monitoringActive = true;

  try {
    // Initialize real-user tracking for 50 customers
    await initializeRealUserTracking();

    // Start monitoring intervals
    onboardingInterval = setInterval(trackOnboardingProgress, 15000); // Every 15s
    analyticsInterval = setInterval(updateAnalytics, 30000); // Every 30s
    optimizationInterval = setInterval(applyOptimizations, 60000); // Every minute

    console.log('[F12-001] Real-user onboarding monitoring started');

  } catch (error) {
    console.error('[F12-001] Failed to start onboarding monitoring:', error);
  }
}

async function initializeRealUserTracking() {
  // Set up tracking for the 50 selected soft launch customers
  const response = await fetch('/api/soft-launch/initialize-onboarding-tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerCount: 50,
      trackingLevel: 'comprehensive',
      argentinaOptimizations: true
    })
  });

  if (!response.ok) {
    throw new Error('Failed to initialize real-user tracking');
  }

  const data = await response.json();
  console.log(`[F12-001] Tracking initialized for ${data.customersTracked} customers`);
}

async function trackOnboardingProgress() {
  try {
    const response = await fetch('/api/soft-launch/onboarding-progress');
    const data = await response.json();

    if (data.success) {
      onboardingSteps.set(data.onboardingSteps);
      activeUsers.set(data.activeUsers);

      // Track real-time user behavior
      await trackRealTimeUserBehavior(data.onboardingSteps);

    } else {
      console.error('[F12-001] Error tracking onboarding:', data.error);
    }

  } catch (error) {
    console.error('[F12-001] Error tracking onboarding progress:', error);
  }
}

async function trackRealTimeUserBehavior(steps: OnboardingStep[]) {
  // Analyze current user behavior patterns
  const behaviorAnalysis = analyzeUserBehavior(steps);

  // Apply immediate optimizations if needed
  if (behaviorAnalysis.requiresOptimization) {
    await applyImmediateOptimizations(behaviorAnalysis.optimizations);
  }

  // Track Argentina-specific behavior
  await trackArgentinaSpecificBehavior(steps);
}

function analyzeUserBehavior(steps: OnboardingStep[]) {
  const abandonmentRate = steps.filter(s => s.abandoned).length / steps.length;
  const avgCompletionTime = steps
    .filter(s => s.completionTime)
    .reduce((sum, s) => sum + (s.completionTime! - s.startTime), 0) / steps.length;

  return {
    requiresOptimization: abandonmentRate > 0.15 || avgCompletionTime > 300000, // 5 minutes
    optimizations: generateOptimizations(abandonmentRate, avgCompletionTime),
    patterns: extractBehaviorPatterns(steps)
  };
}

function generateOptimizations(abandonmentRate: number, avgTime: number): string[] {
  const optimizations: string[] = [];

  if (abandonmentRate > 0.2) {
    optimizations.push('Simplify registration form');
    optimizations.push('Add progress indicators');
    optimizations.push('Improve error messaging');
  }

  if (avgTime > 360000) { // 6 minutes
    optimizations.push('Pre-fill form fields where possible');
    optimizations.push('Add autocomplete for Argentina addresses');
    optimizations.push('Optimize mobile keyboard interactions');
  }

  return optimizations;
}

async function updateAnalytics() {
  try {
    const response = await fetch('/api/soft-launch/onboarding-analytics');
    const data = await response.json();

    if (data.success) {
      const analytics: OnboardingAnalytics = {
        totalUsers: data.totalUsers,
        completionRate: data.completionRate,
        avgCompletionTime: data.avgCompletionTime,
        abandonmentPoints: data.abandonmentPoints,
        errorPatterns: data.errorPatterns,
        deviceBreakdown: data.deviceBreakdown,
        argentinaUserBehavior: {
          preferredPaymentMethods: data.paymentMethods,
          locationDistribution: data.locationDistribution,
          timeOfDayPatterns: data.timePatterns,
          mobileUsageRate: data.mobileUsageRate
        },
        conversionOptimizations: {
          appliedOptimizations: data.appliedOptimizations,
          conversionImprovement: data.conversionImprovement,
          userFeedback: data.userFeedback
        }
      };

      onboardingAnalytics.set(analytics);

      // Update dashboard usage metrics
      await updateDashboardUsageMetrics();

    } else {
      console.error('[F12-001] Error updating analytics:', data.error);
    }

  } catch (error) {
    console.error('[F12-001] Error updating analytics:', error);
  }
}

async function updateDashboardUsageMetrics() {
  try {
    const response = await fetch('/api/soft-launch/dashboard-usage-metrics');
    const data = await response.json();

    if (data.success) {
      const usage: CustomerDashboardUsage = {
        sessionMetrics: {
          averageSessionDuration: data.sessionDuration,
          pagesViewed: data.pagesViewed,
          featuresUsed: data.featuresUsed,
          bookingInteractions: data.bookingInteractions
        },
        serviceDiscovery: {
          searchQueries: data.searchQueries,
          filterUsage: data.filterUsage,
          providerViews: data.providerViews,
          bookingAttempts: data.bookingAttempts,
          conversionRate: data.conversionRate
        },
        profileManagement: {
          updatesCount: data.profileUpdates,
          preferencesSet: data.preferencesSet,
          personalizationEngagement: data.personalizationScore
        },
        supportInteraction: {
          helpViewedSections: data.helpSections,
          ticketsCreated: data.supportTickets,
          satisfactionRating: data.supportSatisfaction
        }
      };

      dashboardUsage.set(usage);

    } else {
      console.error('[F12-001] Error updating dashboard usage:', data.error);
    }

  } catch (error) {
    console.error('[F12-001] Error updating dashboard usage:', error);
  }
}

async function applyOptimizations() {
  try {
    const currentAnalytics = await new Promise(resolve => {
      const unsubscribe = onboardingAnalytics.subscribe(resolve);
      unsubscribe();
    });

    if (!currentAnalytics) return;

    const optimizations: string[] = [];

    // Apply completion rate optimizations
    if (currentAnalytics.completionRate < 85) {
      await optimizeRegistrationFlow();
      optimizations.push('Registration flow optimization');
    }

    // Apply mobile-specific optimizations for Argentina users
    if (currentAnalytics.argentinaUserBehavior.mobileUsageRate > 80) {
      await optimizeMobileOnboarding();
      optimizations.push('Mobile onboarding optimization');
    }

    // Apply payment method optimizations
    const topPaymentMethod = Object.keys(currentAnalytics.argentinaUserBehavior.preferredPaymentMethods)[0];
    if (topPaymentMethod && topPaymentMethod !== 'mercadopago') {
      await prioritizePaymentMethod(topPaymentMethod);
      optimizations.push(`Payment method prioritization: ${topPaymentMethod}`);
    }

    realTimeOptimizations.set(optimizations);

    if (optimizations.length > 0) {
      console.log('[F12-001] Applied optimizations:', optimizations);
    }

  } catch (error) {
    console.error('[F12-001] Error applying optimizations:', error);
  }
}

async function optimizeRegistrationFlow() {
  // Implementation for registration flow optimization
  await fetch('/api/optimizations/registration-flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      optimizations: [
        'reduce_form_fields',
        'add_progress_indicator',
        'improve_error_messaging',
        'argentina_address_autocomplete'
      ]
    })
  });
}

async function optimizeMobileOnboarding() {
  // Implementation for mobile onboarding optimization
  await fetch('/api/optimizations/mobile-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      optimizations: [
        'touch_target_optimization',
        'keyboard_optimization',
        'viewport_adjustments',
        'swipe_navigation'
      ]
    })
  });
}

async function prioritizePaymentMethod(method: string) {
  // Implementation for payment method prioritization
  await fetch('/api/optimizations/payment-priority', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priorityMethod: method,
      region: 'argentina'
    })
  });
}

function stopOnboardingMonitoring() {
  monitoringActive = false;

  if (onboardingInterval) clearInterval(onboardingInterval);
  if (analyticsInterval) clearInterval(analyticsInterval);
  if (optimizationInterval) clearInterval(optimizationInterval);

  console.log('[F12-001] Onboarding monitoring stopped');
}

// Derived stores for reactive UI
export const completionRate = derived(
  onboardingAnalytics,
  $analytics => $analytics?.completionRate ?? 0
);

export const avgOnboardingTime = derived(
  onboardingAnalytics,
  $analytics => $analytics?.avgCompletionTime ?? 0
);

export const mobileUsage = derived(
  onboardingAnalytics,
  $analytics => $analytics?.argentinaUserBehavior.mobileUsageRate ?? 0
);

export const bookingConversion = derived(
  dashboardUsage,
  $usage => $usage?.serviceDiscovery.conversionRate ?? 0
);
</script>

<div class="real-user-onboarding-monitor p-6 bg-gradient-to-br from-blue-50 to-green-100 min-h-screen">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        🎯 Real-User Onboarding Experience Monitoring
      </h1>
      <p class="text-lg text-gray-600 mb-4">
        Live monitoring of 50 customers completing onboarding flow optimization
      </p>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full {monitoringActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
          <span class="text-sm text-gray-600">
            {monitoringActive ? 'Monitoring Active' : 'Monitoring Inactive'}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          Active Users: <span class="font-semibold text-blue-600">{$activeUsers}</span>
        </div>
      </div>
    </div>

    {#if $onboardingAnalytics}
      <!-- Key Performance Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Completion Rate</h3>
            <span class="text-2xl">✅</span>
          </div>
          <div class="text-3xl font-bold {$completionRate >= 85 ? 'text-green-600' : $completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}">
            {$completionRate.toFixed(1)}%
          </div>
          <div class="text-sm text-gray-600 mt-1">Target: >85%</div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              class="h-2 rounded-full transition-all duration-500 {$completionRate >= 85 ? 'bg-green-500' : 'bg-yellow-500'}"
              style="width: {$completionRate}%"
            ></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Avg Time</h3>
            <span class="text-2xl">⏱️</span>
          </div>
          <div class="text-3xl font-bold {$avgOnboardingTime <= 300000 ? 'text-green-600' : 'text-yellow-600'}">
            {($avgOnboardingTime / 60000).toFixed(1)}min
          </div>
          <div class="text-sm text-gray-600 mt-1">Target: <5min</div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Mobile Usage</h3>
            <span class="text-2xl">📱</span>
          </div>
          <div class="text-3xl font-bold text-blue-600">
            {$mobileUsage.toFixed(1)}%
          </div>
          <div class="text-sm text-gray-600 mt-1">Argentina Users</div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Booking Conversion</h3>
            <span class="text-2xl">🎯</span>
          </div>
          <div class="text-3xl font-bold text-green-600">
            {$bookingConversion.toFixed(1)}%
          </div>
          <div class="text-sm text-gray-600 mt-1">First Session</div>
        </div>
      </div>

      <!-- Onboarding Flow Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Abandonment Points -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">🚪</span>
            Abandonment Analysis
          </h3>

          <div class="space-y-4">
            {#each Object.entries($onboardingAnalytics.abandonmentPoints) as [step, rate]}
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-800 capitalize">
                  {step.replace('_', ' ')}
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-bold {rate > 20 ? 'text-red-600' : rate > 10 ? 'text-yellow-600' : 'text-green-600'}">
                    {rate.toFixed(1)}%
                  </span>
                  {#if rate > 15}
                    <span class="text-red-500">⚠️</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Error Patterns -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">🐛</span>
            Error Patterns
          </h3>

          <div class="space-y-4">
            {#each Object.entries($onboardingAnalytics.errorPatterns).slice(0, 5) as [error, count]}
              <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span class="text-sm text-red-800 font-medium">
                  {error.replace('_', ' ')}
                </span>
                <span class="text-lg font-bold text-red-600">
                  {count}
                </span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Dashboard Usage Metrics -->
      {#if $dashboardUsage}
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-2xl">📊</span>
            Customer Dashboard Usage Analysis
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Session Metrics -->
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 class="font-semibold text-blue-900 mb-3">Session Metrics</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-blue-700">Avg Duration:</span>
                  <span class="font-semibold text-blue-900">
                    {($dashboardUsage.sessionMetrics.averageSessionDuration / 60000).toFixed(1)}min
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-700">Pages Viewed:</span>
                  <span class="font-semibold text-blue-900">
                    {$dashboardUsage.sessionMetrics.pagesViewed.toFixed(1)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-700">Booking Interactions:</span>
                  <span class="font-semibold text-blue-900">
                    {$dashboardUsage.sessionMetrics.bookingInteractions}
                  </span>
                </div>
              </div>
            </div>

            <!-- Service Discovery -->
            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 class="font-semibold text-green-900 mb-3">Service Discovery</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-green-700">Search Queries:</span>
                  <span class="font-semibold text-green-900">
                    {$dashboardUsage.serviceDiscovery.searchQueries}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-700">Provider Views:</span>
                  <span class="font-semibold text-green-900">
                    {$dashboardUsage.serviceDiscovery.providerViews}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-700">Conversion Rate:</span>
                  <span class="font-semibold text-green-900">
                    {$dashboardUsage.serviceDiscovery.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Support Interaction -->
            <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 class="font-semibold text-purple-900 mb-3">Support & Help</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-purple-700">Help Sections:</span>
                  <span class="font-semibold text-purple-900">
                    {$dashboardUsage.supportInteraction.helpViewedSections.length}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-purple-700">Tickets Created:</span>
                  <span class="font-semibold text-purple-900">
                    {$dashboardUsage.supportInteraction.ticketsCreated}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-purple-700">Satisfaction:</span>
                  <span class="font-semibold text-purple-900">
                    {$dashboardUsage.supportInteraction.satisfactionRating.toFixed(1)}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Argentina-Specific User Behavior -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
        <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span class="text-2xl">🇦🇷</span>
          Argentina User Behavior Analysis
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Payment Methods -->
          <div>
            <h4 class="font-semibold text-gray-800 mb-3">Payment Method Preferences</h4>
            <div class="space-y-2">
              {#each Object.entries($onboardingAnalytics.argentinaUserBehavior.preferredPaymentMethods).slice(0, 4) as [method, usage]}
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span class="text-gray-700 capitalize">{method.replace('_', ' ')}</span>
                  <span class="font-semibold text-gray-900">{usage.toFixed(1)}%</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Time Patterns -->
          <div>
            <h4 class="font-semibold text-gray-800 mb-3">Time of Day Patterns</h4>
            <div class="space-y-2">
              {#each Object.entries($onboardingAnalytics.argentinaUserBehavior.timeOfDayPatterns) as [time, usage]}
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span class="text-gray-700 capitalize">{time}</span>
                  <span class="font-semibold text-gray-900">{usage.toFixed(1)}%</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Real-Time Optimizations -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span class="text-2xl">⚡</span>
          Applied Real-Time Optimizations
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-semibold text-gray-800 mb-3">Conversion Optimizations</h4>
            <div class="space-y-2">
              {#each $onboardingAnalytics.conversionOptimizations.appliedOptimizations.slice(0, 5) as optimization}
                <div class="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                  <span class="text-green-600">✅</span>
                  <span class="text-green-800 text-sm">{optimization}</span>
                </div>
              {/each}
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-800 mb-3">Current Optimizations</h4>
            <div class="space-y-2">
              {#each $realTimeOptimizations as optimization}
                <div class="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <span class="text-blue-600">🔄</span>
                  <span class="text-blue-800 text-sm">{optimization}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Conversion Improvement -->
        <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-gray-900">Conversion Improvement</div>
              <div class="text-sm text-gray-600">Since optimization start</div>
            </div>
            <div class="text-2xl font-bold text-green-600">
              +{$onboardingAnalytics.conversionOptimizations.conversionImprovement.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

    {:else}
      <div class="flex items-center justify-center py-12">
        <div class="text-center space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-lg text-gray-600">
            Initializing real-user onboarding monitoring...
          </p>
          <p class="text-sm text-gray-500">
            Tracking 50 customers through complete onboarding flow
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
.real-user-onboarding-monitor {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Real-time update animations */
@keyframes data-update {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.animate-data-update {
  animation: data-update 0.3s ease-in-out;
}

/* Progress bar animations */
.progress-bar {
  transition: width 0.5s ease-in-out;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .real-user-onboarding-monitor {
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