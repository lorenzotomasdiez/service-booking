<script lang="ts">
/**
 * T12-001: Soft Launch Real-Time Monitoring Dashboard
 *
 * Real-time dashboard for monitoring the controlled soft launch with 50 customers
 * Building on Day 11's 98.2% launch readiness for live validation
 */

import { onMount, onDestroy } from 'svelte';
import { writable } from 'svelte/store';

interface SoftLaunchMetrics {
  totalCustomers: number;
  providersCount: number;
  clientsCount: number;
  avgOnboardingTime: number;
  bookingSuccessRate: number;
  paymentSuccessRate: number;
  overallSatisfaction: number;
  churnRate: number;
  systemPerformance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
  keyInsights: string[];
  optimizations: string[];
}

interface CustomerSummary {
  total: number;
  active: number;
  onboarding: number;
  completed: number;
}

// Reactive stores
const metrics = writable<SoftLaunchMetrics | null>(null);
const customerSummary = writable<CustomerSummary | null>(null);
const isLoading = writable(true);
const lastUpdate = writable<Date | null>(null);

let refreshInterval: number;
let errorCount = 0;

onMount(() => {
  loadSoftLaunchMetrics();

  // Refresh metrics every 30 seconds
  refreshInterval = setInterval(() => {
    loadSoftLaunchMetrics();
  }, 30000);
});

onDestroy(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

async function loadSoftLaunchMetrics() {
  try {
    const response = await fetch('/api/v1/soft-launch/metrics');
    const data = await response.json();

    if (data.success) {
      metrics.set(data.data.metrics);
      customerSummary.set(data.data.customersSummary);
      lastUpdate.set(new Date());
      errorCount = 0;
    } else {
      console.error('Failed to load metrics:', data.error);
      errorCount++;
    }
  } catch (error) {
    console.error('Error loading soft launch metrics:', error);
    errorCount++;
  } finally {
    isLoading.set(false);
  }
}

async function initializeSoftLaunch() {
  try {
    const response = await fetch('/api/v1/soft-launch/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      alert('Soft launch initialized successfully!');
      await loadSoftLaunchMetrics();
    } else {
      alert('Failed to initialize soft launch');
    }
  } catch (error) {
    console.error('Error initializing soft launch:', error);
    alert('Error initializing soft launch');
  }
}

async function collectFeedback() {
  try {
    const response = await fetch('/api/v1/soft-launch/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.success) {
      alert(`Feedback collected: ${data.data.feedbackCollected} items`);
      await loadSoftLaunchMetrics();
    } else {
      alert('Failed to collect feedback');
    }
  } catch (error) {
    console.error('Error collecting feedback:', error);
    alert('Error collecting feedback');
  }
}

function getStatusColor(value: number, target: number, higher = true): string {
  const achieved = higher ? value >= target : value <= target;
  return achieved ? 'text-green-600' : value >= target * 0.9 ? 'text-yellow-600' : 'text-red-600';
}

function getPerformanceStatus(value: number, target: number, higher = true): string {
  const achieved = higher ? value >= target : value <= target;
  return achieved ? '✅' : value >= target * 0.9 ? '🟡' : '❌';
}
</script>

<div class="soft-launch-dashboard p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        🚀 T12-001: Soft Launch Technical Leadership
      </h1>
      <p class="text-lg text-gray-600 mb-4">
        Controlled soft launch with 50 customers - Real-world system validation
      </p>

      {#if $lastUpdate}
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            Last updated: {$lastUpdate.toLocaleString()}
          </span>
          <div class="flex gap-2">
            <button
              on:click={initializeSoftLaunch}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Initialize Launch
            </button>
            <button
              on:click={collectFeedback}
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Collect Feedback
            </button>
          </div>
        </div>
      {/if}

      {#if errorCount > 0}
        <div class="mt-2 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p class="text-yellow-700">⚠️ Connection issues detected ({errorCount} errors)</p>
        </div>
      {/if}
    </div>

    {#if $isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-lg text-gray-600">Loading soft launch metrics...</span>
      </div>
    {:else if $metrics && $customerSummary}
      <!-- Key Metrics Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Customer Summary -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Customer Status</h3>
            <span class="text-2xl">👥</span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Total Selected:</span>
              <span class="font-semibold">{$customerSummary.total}/50</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Active:</span>
              <span class="font-semibold text-green-600">{$customerSummary.active}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Onboarding:</span>
              <span class="font-semibold text-blue-600">{$customerSummary.onboarding}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Completed:</span>
              <span class="font-semibold text-purple-600">{$customerSummary.completed}</span>
            </div>
          </div>
        </div>

        <!-- Enterprise Onboarding -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Onboarding Time</h3>
            <span class="text-2xl">⏱️</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold {getStatusColor($metrics.avgOnboardingTime, 47, false)}">
              {$metrics.avgOnboardingTime.toFixed(1)}min
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Target: 47min</span>
              <span class="text-lg">{getPerformanceStatus($metrics.avgOnboardingTime, 47, false)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500 {$metrics.avgOnboardingTime <= 47 ? 'bg-green-500' : 'bg-yellow-500'}"
                style="width: {Math.min(100, (47 / Math.max($metrics.avgOnboardingTime, 47)) * 100)}%"
              ></div>
            </div>
          </div>
        </div>

        <!-- Payment Success -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Payment Success</h3>
            <span class="text-2xl">💳</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold {getStatusColor($metrics.paymentSuccessRate, 99.5)}">
              {$metrics.paymentSuccessRate.toFixed(1)}%
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Target: >99.5%</span>
              <span class="text-lg">{getPerformanceStatus($metrics.paymentSuccessRate, 99.5)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500 {$metrics.paymentSuccessRate >= 99.5 ? 'bg-green-500' : 'bg-yellow-500'}"
                style="width: {$metrics.paymentSuccessRate}%"
              ></div>
            </div>
          </div>
        </div>

        <!-- Customer Satisfaction -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Satisfaction</h3>
            <span class="text-2xl">⭐</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold {getStatusColor($metrics.overallSatisfaction, 4.5)}">
              {$metrics.overallSatisfaction.toFixed(1)}/5
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Target: >4.5/5</span>
              <span class="text-lg">{getPerformanceStatus($metrics.overallSatisfaction, 4.5)}</span>
            </div>
            <div class="flex">
              {#each Array(5) as _, i}
                <span class="text-xl {i < Math.floor($metrics.overallSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}">⭐</span>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- System Performance Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- System Performance -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">📊 System Performance</h3>

          <div class="space-y-6">
            <!-- Response Time -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-600">Average Response Time</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-2xl font-bold {getStatusColor($metrics.systemPerformance.avgResponseTime, 200, false)}">
                    {$metrics.systemPerformance.avgResponseTime.toFixed(0)}ms
                  </span>
                  <span class="text-lg">{getPerformanceStatus($metrics.systemPerformance.avgResponseTime, 200, false)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">Target: <200ms</div>
                <div class="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500 {$metrics.systemPerformance.avgResponseTime <= 200 ? 'bg-green-500' : 'bg-red-500'}"
                    style="width: {Math.min(100, (200 / Math.max($metrics.systemPerformance.avgResponseTime, 200)) * 100)}%"
                  ></div>
                </div>
              </div>
            </div>

            <!-- System Uptime -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-600">System Uptime</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-2xl font-bold text-green-600">
                    {$metrics.systemPerformance.uptime.toFixed(1)}%
                  </span>
                  <span class="text-lg">✅</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">Target: >99.9%</div>
                <div class="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    class="h-2 rounded-full bg-green-500 transition-all duration-500"
                    style="width: {$metrics.systemPerformance.uptime}%"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Error Rate -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-600">Error Rate</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-2xl font-bold {getStatusColor($metrics.systemPerformance.errorRate, 0.1, false)}">
                    {($metrics.systemPerformance.errorRate * 100).toFixed(3)}%
                  </span>
                  <span class="text-lg">{getPerformanceStatus($metrics.systemPerformance.errorRate, 0.1, false)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">Target: <0.1%</div>
                <div class="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500 {$metrics.systemPerformance.errorRate <= 0.1 ? 'bg-green-500' : 'bg-red-500'}"
                    style="width: {Math.max(5, Math.min(100, ($metrics.systemPerformance.errorRate / 0.1) * 100))}%"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Metrics -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">📈 Business Metrics</h3>

          <div class="space-y-6">
            <!-- Booking Success Rate -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-600">Booking Success Rate</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-2xl font-bold {getStatusColor($metrics.bookingSuccessRate, 95)}">
                    {$metrics.bookingSuccessRate.toFixed(1)}%
                  </span>
                  <span class="text-lg">{getPerformanceStatus($metrics.bookingSuccessRate, 95)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">Target: >95%</div>
                <div class="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500 {$metrics.bookingSuccessRate >= 95 ? 'bg-green-500' : 'bg-yellow-500'}"
                    style="width: {$metrics.bookingSuccessRate}%"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Churn Rate -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-600">Churn Rate</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-2xl font-bold {getStatusColor($metrics.churnRate, 5, false)}">
                    {$metrics.churnRate.toFixed(1)}%
                  </span>
                  <span class="text-lg">{getPerformanceStatus($metrics.churnRate, 5, false)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">Target: <5%</div>
                <div class="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500 {$metrics.churnRate <= 5 ? 'bg-green-500' : 'bg-red-500'}"
                    style="width: {Math.max(5, Math.min(100, ($metrics.churnRate / 10) * 100))}%"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Provider/Client Split -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-600">Provider/Client Split</span>
                <div class="flex items-center gap-4 mt-2">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span class="text-sm">Providers: {$metrics.providersCount}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span class="text-sm">Clients: {$metrics.clientsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insights & Optimizations -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Key Insights -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">💡 Key Insights</h3>
          <div class="space-y-3">
            {#each $metrics.keyInsights as insight, index}
              <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span class="text-blue-600 font-semibold">{index + 1}.</span>
                <span class="text-blue-800">{insight}</span>
              </div>
            {:else}
              <div class="text-gray-500 text-center py-4">
                Key insights will appear here as data is collected...
              </div>
            {/each}
          </div>
        </div>

        <!-- Applied Optimizations -->
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">⚡ Applied Optimizations</h3>
          <div class="space-y-3">
            {#each $metrics.optimizations as optimization, index}
              <div class="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span class="text-green-600">✅</span>
                <span class="text-green-800">{optimization}</span>
              </div>
            {:else}
              <div class="text-gray-500 text-center py-4">
                Applied optimizations will appear here...
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-600 text-lg">No soft launch data available. Initialize the soft launch to begin monitoring.</p>
      </div>
    {/if}
  </div>
</div>

<style>
.soft-launch-dashboard {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Custom animations for metrics */
@keyframes pulse-green {
  0%, 100% { background-color: rgb(34, 197, 94); }
  50% { background-color: rgb(22, 163, 74); }
}

@keyframes pulse-yellow {
  0%, 100% { background-color: rgb(234, 179, 8); }
  50% { background-color: rgb(202, 138, 4); }
}

@keyframes pulse-red {
  0%, 100% { background-color: rgb(239, 68, 68); }
  50% { background-color: rgb(220, 38, 38); }
}

.animate-pulse-green {
  animation: pulse-green 2s infinite;
}

.animate-pulse-yellow {
  animation: pulse-yellow 2s infinite;
}

.animate-pulse-red {
  animation: pulse-red 2s infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .soft-launch-dashboard {
    padding: 1rem;
  }

  .text-3xl {
    font-size: 1.875rem;
  }

  .text-2xl {
    font-size: 1.5rem;
  }
}
</style>