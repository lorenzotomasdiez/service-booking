<!-- Real-time Frontend Monitoring Dashboard for Launch Day -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { performanceStore, coreWebVitals, performanceScore, activeAlerts, performanceTrend } from '$lib/stores/performance';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';

  // Real-time monitoring state
  let isLiveMonitoring = false;
  let userInteractionCount = 0;
  let errorRate = 0;
  let currentUsers = 0;
  let mobileUserPercentage = 0;
  let argentinianUsers = 0;
  
  // Connection monitoring
  let connectionStatus: 'online' | 'offline' | 'slow' = 'online';
  let lastUpdateTime = new Date();
  let monitoringInterval: NodeJS.Timeout;

  // User behavior tracking
  let sessionData = {
    pageViews: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    conversionRate: 0,
    bookingCompletionRate: 0
  };

  // Mobile-specific metrics for Argentina
  let mobileMetrics = {
    touchLatency: 0,
    scrollPerformance: 0,
    orientationChanges: 0,
    networkQuality: 'unknown' as const,
    deviceMemory: 0
  };

  // Critical issues tracker
  let criticalIssues: Array<{
    id: string;
    type: 'performance' | 'error' | 'ux' | 'mobile';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers: number;
    firstSeen: Date;
    lastSeen: Date;
    status: 'new' | 'investigating' | 'resolved';
  }> = [];

  onMount(() => {
    if (browser) {
      startLiveMonitoring();
      setupUserBehaviorTracking();
      setupMobileMetricsTracking();
      setupErrorTracking();
    }
  });

  onDestroy(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    isLiveMonitoring = false;
  });

  function startLiveMonitoring() {
    isLiveMonitoring = true;
    console.log('[Live Monitoring] Started for launch day');
    
    // Update metrics every 5 seconds for real-time monitoring
    monitoringInterval = setInterval(() => {
      updateLiveMetrics();
      detectNetworkIssues();
      analyzeUserBehavior();
      checkCriticalIssues();
      lastUpdateTime = new Date();
    }, 5000);

    // Immediate initial load
    updateLiveMetrics();
  }

  function updateLiveMetrics() {
    // Simulate real-time data - in production, this would come from analytics APIs
    userInteractionCount = Math.floor(Math.random() * 1000) + 500;
    currentUsers = Math.floor(Math.random() * 200) + 50;
    mobileUserPercentage = Math.floor(Math.random() * 20) + 75; // Argentina is mobile-heavy
    argentinianUsers = Math.floor(currentUsers * 0.95); // 95% Argentina users
    
    // Calculate error rate based on actual errors
    const totalRequests = userInteractionCount;
    const errorCount = $performanceStore.metrics.jsErrorCount + $performanceStore.metrics.networkErrorCount;
    errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Update session data
    sessionData.pageViews += Math.floor(Math.random() * 10) + 1;
    sessionData.bounceRate = Math.random() * 30 + 20; // 20-50%
    sessionData.avgSessionDuration = Math.random() * 300 + 120; // 2-7 minutes
    sessionData.conversionRate = Math.random() * 15 + 5; // 5-20%
    sessionData.bookingCompletionRate = Math.random() * 25 + 65; // 65-90%
  }

  function setupUserBehaviorTracking() {
    if (!browser) return;

    // Track user interactions
    document.addEventListener('click', () => {
      userInteractionCount++;
      trackInteractionLatency();
    });

    // Track scrolling performance
    let scrollStartTime: number;
    document.addEventListener('scroll', () => {
      if (!scrollStartTime) {
        scrollStartTime = performance.now();
      }
      
      // Measure scroll performance
      requestAnimationFrame(() => {
        if (scrollStartTime) {
          const scrollDuration = performance.now() - scrollStartTime;
          mobileMetrics.scrollPerformance = scrollDuration;
          scrollStartTime = 0;
        }
      });
    });

    // Track orientation changes (mobile)
    window.addEventListener('orientationchange', () => {
      mobileMetrics.orientationChanges++;
      // Re-measure performance after orientation change
      setTimeout(() => {
        performanceStore.takeSnapshot();
      }, 100);
    });
  }

  function setupMobileMetricsTracking() {
    if (!browser) return;

    // Device memory (if available)
    if ('deviceMemory' in navigator) {
      mobileMetrics.deviceMemory = (navigator as any).deviceMemory;
    }

    // Touch latency tracking
    let touchStartTime: number;
    document.addEventListener('touchstart', (e) => {
      touchStartTime = performance.now();
    });

    document.addEventListener('touchend', () => {
      if (touchStartTime) {
        mobileMetrics.touchLatency = performance.now() - touchStartTime;
      }
    });

    // Network quality monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        mobileMetrics.networkQuality = connection.effectiveType || 'unknown';
        
        connection.addEventListener('change', () => {
          mobileMetrics.networkQuality = connection.effectiveType || 'unknown';
          detectNetworkIssues();
        });
      }
    }
  }

  function setupErrorTracking() {
    if (!browser) return;

    // Enhanced error tracking for launch day
    window.addEventListener('error', (error) => {
      console.error('[Live Monitoring] JS Error detected:', error);
      
      addCriticalIssue({
        type: 'error',
        severity: 'high',
        description: `JavaScript Error: ${error.message}`,
        affectedUsers: 1
      });
    });

    window.addEventListener('unhandledrejection', (error) => {
      console.error('[Live Monitoring] Promise Rejection:', error);
      
      addCriticalIssue({
        type: 'error',
        severity: 'medium',
        description: `Unhandled Promise Rejection: ${error.reason}`,
        affectedUsers: 1
      });
    });
  }

  function trackInteractionLatency() {
    const startTime = performance.now();
    
    // Measure time to next paint
    requestAnimationFrame(() => {
      const latency = performance.now() - startTime;
      if (latency > 100) { // Over 100ms is concerning
        addCriticalIssue({
          type: 'ux',
          severity: latency > 300 ? 'high' : 'medium',
          description: `High interaction latency: ${latency.toFixed(1)}ms`,
          affectedUsers: Math.floor(currentUsers * 0.1)
        });
      }
    });
  }

  function detectNetworkIssues() {
    // Check if user is offline
    if (!navigator.onLine) {
      connectionStatus = 'offline';
      addCriticalIssue({
        type: 'mobile',
        severity: 'critical',
        description: 'User went offline',
        affectedUsers: 1
      });
      return;
    }

    // Check for slow network
    if (mobileMetrics.networkQuality === 'slow-2g' || mobileMetrics.networkQuality === '2g') {
      connectionStatus = 'slow';
      addCriticalIssue({
        type: 'performance',
        severity: 'medium',
        description: `Slow network detected: ${mobileMetrics.networkQuality}`,
        affectedUsers: Math.floor(currentUsers * 0.2)
      });
    } else {
      connectionStatus = 'online';
    }
  }

  function analyzeUserBehavior() {
    // High bounce rate alert
    if (sessionData.bounceRate > 70) {
      addCriticalIssue({
        type: 'ux',
        severity: 'high',
        description: `High bounce rate: ${sessionData.bounceRate.toFixed(1)}%`,
        affectedUsers: Math.floor(currentUsers * (sessionData.bounceRate / 100))
      });
    }

    // Low booking completion rate
    if (sessionData.bookingCompletionRate < 50) {
      addCriticalIssue({
        type: 'ux',
        severity: 'critical',
        description: `Low booking completion: ${sessionData.bookingCompletionRate.toFixed(1)}%`,
        affectedUsers: Math.floor(currentUsers * 0.3)
      });
    }

    // High error rate
    if (errorRate > 5) {
      addCriticalIssue({
        type: 'error',
        severity: 'critical',
        description: `High error rate: ${errorRate.toFixed(1)}%`,
        affectedUsers: Math.floor(currentUsers * (errorRate / 100))
      });
    }
  }

  function checkCriticalIssues() {
    // Auto-resolve old issues that haven't been seen recently
    criticalIssues = criticalIssues.map(issue => {
      const timeSinceLastSeen = Date.now() - issue.lastSeen.getTime();
      if (timeSinceLastSeen > 300000 && issue.status !== 'resolved') { // 5 minutes
        return { ...issue, status: 'resolved' as const };
      }
      return issue;
    });

    // Remove resolved issues older than 1 hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    criticalIssues = criticalIssues.filter(issue => 
      issue.status !== 'resolved' || issue.lastSeen > oneHourAgo
    );
  }

  function addCriticalIssue(issue: {
    type: 'performance' | 'error' | 'ux' | 'mobile';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers: number;
  }) {
    const existingIssue = criticalIssues.find(i => i.description === issue.description);
    
    if (existingIssue) {
      // Update existing issue
      existingIssue.lastSeen = new Date();
      existingIssue.affectedUsers = Math.max(existingIssue.affectedUsers, issue.affectedUsers);
      if (existingIssue.status === 'resolved') {
        existingIssue.status = 'new';
      }
    } else {
      // Add new issue
      const newIssue = {
        id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...issue,
        firstSeen: new Date(),
        lastSeen: new Date(),
        status: 'new' as const
      };
      criticalIssues = [newIssue, ...criticalIssues].slice(0, 20); // Keep last 20 issues
    }
  }

  function resolveIssue(issueId: string) {
    criticalIssues = criticalIssues.map(issue =>
      issue.id === issueId ? { ...issue, status: 'resolved' as const } : issue
    );
  }

  function investigateIssue(issueId: string) {
    criticalIssues = criticalIssues.map(issue =>
      issue.id === issueId ? { ...issue, status: 'investigating' as const } : issue
    );
  }

  // Get status color classes
  function getStatusColor(status: string) {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'slow': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
</script>

<div class="live-monitoring-dashboard p-6 max-w-7xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">🚀 Live Launch Monitoring</h1>
      <p class="text-gray-600">Real-time frontend performance & user experience tracking</p>
    </div>
    
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full {isLiveMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}"></div>
        <span class="text-sm font-medium">{isLiveMonitoring ? 'Live' : 'Offline'}</span>
      </div>
      
      <div class="text-sm text-gray-500">
        Last update: {lastUpdateTime.toLocaleTimeString('es-AR')}
      </div>
    </div>
  </div>

  <!-- Key Metrics Row -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <!-- Current Users -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Users Online</p>
          <p class="text-2xl font-bold text-gray-900">{currentUsers.toLocaleString()}</p>
        </div>
        <div class="p-3 bg-blue-100 rounded-lg">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      </div>
      <div class="mt-2 flex items-center text-sm">
        <span class="text-green-600">🇦🇷 {Math.floor(mobileUserPercentage)}% mobile</span>
      </div>
    </div>

    <!-- Performance Score -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Performance Score</p>
          <p class="text-2xl font-bold text-gray-900">{$performanceScore}/100</p>
        </div>
        <div class="p-3 {$performanceScore >= 80 ? 'bg-green-100' : $performanceScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'} rounded-lg">
          <svg class="w-6 h-6 {$performanceScore >= 80 ? 'text-green-600' : $performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <div class="mt-2 flex items-center text-sm">
        <span class="{$performanceTrend === 'improving' ? 'text-green-600' : $performanceTrend === 'degrading' ? 'text-red-600' : 'text-gray-600'}">
          {$performanceTrend === 'improving' ? '↗ Improving' : $performanceTrend === 'degrading' ? '↘ Degrading' : '→ Stable'}
        </span>
      </div>
    </div>

    <!-- Error Rate -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Error Rate</p>
          <p class="text-2xl font-bold text-gray-900">{errorRate.toFixed(1)}%</p>
        </div>
        <div class="p-3 {errorRate < 1 ? 'bg-green-100' : errorRate < 5 ? 'bg-yellow-100' : 'bg-red-100'} rounded-lg">
          <svg class="w-6 h-6 {errorRate < 1 ? 'text-green-600' : errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <div class="mt-2 flex items-center text-sm">
        <span class="text-gray-600">{$performanceStore.metrics.jsErrorCount + $performanceStore.metrics.networkErrorCount} total errors</span>
      </div>
    </div>

    <!-- Connection Status -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Connection</p>
          <p class="text-sm font-semibold {getStatusColor(connectionStatus)}">{connectionStatus.toUpperCase()}</p>
        </div>
        <div class="p-3 {getStatusColor(connectionStatus)} rounded-lg">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
      </div>
      <div class="mt-2 flex items-center text-sm">
        <span class="text-gray-600">{mobileMetrics.networkQuality} quality</span>
      </div>
    </div>
  </div>

  <!-- Core Web Vitals -->
  <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals (Argentina Mobile)</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- LCP -->
      <div class="text-center">
        <div class="text-2xl font-bold {$coreWebVitals.lcp && $coreWebVitals.lcp <= 2500 ? 'text-green-600' : $coreWebVitals.lcp && $coreWebVitals.lcp <= 4000 ? 'text-yellow-600' : 'text-red-600'}">
          {$coreWebVitals.lcp ? `${($coreWebVitals.lcp / 1000).toFixed(1)}s` : 'N/A'}
        </div>
        <div class="text-sm font-medium text-gray-600">LCP</div>
        <div class="text-xs text-gray-500">Largest Contentful Paint</div>
      </div>

      <!-- FID -->
      <div class="text-center">
        <div class="text-2xl font-bold {$coreWebVitals.fid && $coreWebVitals.fid <= 100 ? 'text-green-600' : $coreWebVitals.fid && $coreWebVitals.fid <= 300 ? 'text-yellow-600' : 'text-red-600'}">
          {$coreWebVitals.fid ? `${$coreWebVitals.fid.toFixed(0)}ms` : 'N/A'}
        </div>
        <div class="text-sm font-medium text-gray-600">FID</div>
        <div class="text-xs text-gray-500">First Input Delay</div>
      </div>

      <!-- CLS -->
      <div class="text-center">
        <div class="text-2xl font-bold {$coreWebVitals.cls !== null && $coreWebVitals.cls <= 0.1 ? 'text-green-600' : $coreWebVitals.cls !== null && $coreWebVitals.cls <= 0.25 ? 'text-yellow-600' : 'text-red-600'}">
          {$coreWebVitals.cls !== null ? $coreWebVitals.cls.toFixed(3) : 'N/A'}
        </div>
        <div class="text-sm font-medium text-gray-600">CLS</div>
        <div class="text-xs text-gray-500">Cumulative Layout Shift</div>
      </div>

      <!-- FCP -->
      <div class="text-center">
        <div class="text-2xl font-bold {$coreWebVitals.fcp && $coreWebVitals.fcp <= 1800 ? 'text-green-600' : $coreWebVitals.fcp && $coreWebVitals.fcp <= 3000 ? 'text-yellow-600' : 'text-red-600'}">
          {$coreWebVitals.fcp ? `${($coreWebVitals.fcp / 1000).toFixed(1)}s` : 'N/A'}
        </div>
        <div class="text-sm font-medium text-gray-600">FCP</div>
        <div class="text-xs text-gray-500">First Contentful Paint</div>
      </div>
    </div>
  </div>

  <!-- Critical Issues -->
  {#if criticalIssues.length > 0}
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">🚨 Critical Issues ({criticalIssues.filter(i => i.status !== 'resolved').length})</h2>
      
      <div class="space-y-3">
        {#each criticalIssues.filter(i => i.status !== 'resolved').slice(0, 10) as issue (issue.id)}
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-{issue.severity === 'critical' ? 'red' : issue.severity === 'high' ? 'orange' : issue.severity === 'medium' ? 'yellow' : 'blue'}-400">
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span class="px-2 py-1 text-xs font-medium rounded {getSeverityColor(issue.severity)}">
                  {issue.severity.toUpperCase()}
                </span>
                <span class="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                  {issue.type.toUpperCase()}
                </span>
                <span class="text-sm text-gray-600">
                  {issue.affectedUsers} users affected
                </span>
              </div>
              <p class="text-sm font-medium text-gray-900 mt-1">{issue.description}</p>
              <p class="text-xs text-gray-500">
                First seen: {issue.firstSeen.toLocaleTimeString('es-AR')} | 
                Last seen: {issue.lastSeen.toLocaleTimeString('es-AR')}
              </p>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              {#if issue.status === 'new'}
                <button 
                  class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  on:click={() => investigateIssue(issue.id)}
                >
                  Investigate
                </button>
              {:else if issue.status === 'investigating'}
                <span class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded">Investigating...</span>
              {/if}
              
              <button 
                class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                on:click={() => resolveIssue(issue.id)}
              >
                Resolve
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- User Behavior Analytics -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Session Data -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">📊 User Behavior</h2>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Bounce Rate</span>
          <span class="font-semibold {sessionData.bounceRate > 70 ? 'text-red-600' : sessionData.bounceRate > 50 ? 'text-yellow-600' : 'text-green-600'}">
            {sessionData.bounceRate.toFixed(1)}%
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Avg Session Duration</span>
          <span class="font-semibold">{Math.floor(sessionData.avgSessionDuration / 60)}:{(sessionData.avgSessionDuration % 60).toFixed(0).padStart(2, '0')}</span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Conversion Rate</span>
          <span class="font-semibold text-green-600">{sessionData.conversionRate.toFixed(1)}%</span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Booking Completion</span>
          <span class="font-semibold {sessionData.bookingCompletionRate < 50 ? 'text-red-600' : sessionData.bookingCompletionRate < 70 ? 'text-yellow-600' : 'text-green-600'}">
            {sessionData.bookingCompletionRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>

    <!-- Mobile Metrics -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">📱 Argentina Mobile Performance</h2>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Touch Latency</span>
          <span class="font-semibold {mobileMetrics.touchLatency > 100 ? 'text-red-600' : mobileMetrics.touchLatency > 50 ? 'text-yellow-600' : 'text-green-600'}">
            {mobileMetrics.touchLatency.toFixed(0)}ms
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Scroll Performance</span>
          <span class="font-semibold {mobileMetrics.scrollPerformance > 16 ? 'text-red-600' : mobileMetrics.scrollPerformance > 10 ? 'text-yellow-600' : 'text-green-600'}">
            {mobileMetrics.scrollPerformance.toFixed(1)}ms
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Network Quality</span>
          <span class="font-semibold {mobileMetrics.networkQuality === '4g' ? 'text-green-600' : mobileMetrics.networkQuality === '3g' ? 'text-yellow-600' : 'text-red-600'}">
            {mobileMetrics.networkQuality.toUpperCase()}
          </span>
        </div>
        
        {#if mobileMetrics.deviceMemory > 0}
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Device Memory</span>
            <span class="font-semibold">{mobileMetrics.deviceMemory}GB</span>
          </div>
        {/if}
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Orientation Changes</span>
          <span class="font-semibold">{mobileMetrics.orientationChanges}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Active Alerts -->
  {#if $activeAlerts.length > 0}
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">⚠️ Performance Alerts ({$activeAlerts.length})</h2>
      
      <div class="space-y-2">
        {#each $activeAlerts as alert (alert.id)}
          <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800">{alert.message}</p>
              <p class="text-xs text-yellow-600">
                Metric: {alert.metric} | Value: {alert.value} | Threshold: {alert.threshold}
              </p>
            </div>
            
            <button 
              class="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              on:click={() => performanceStore.resolveAlert(alert.id)}
            >
              Resolve
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .live-monitoring-dashboard {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>