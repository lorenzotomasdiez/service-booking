<!-- Frontend Analytics Dashboard for Launch Day Analysis -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { performanceStore, coreWebVitals, performanceScore } from '$lib/stores/performance';
  import { uxOptimizationService, connectionSpeed, isMobile } from '$lib/services/ux-optimization';

  interface FrontendAnalytics {
    // User Behavior Analytics
    userFlow: {
      totalSessions: number;
      averageSessionDuration: number;
      bounceRate: number;
      pagesPerSession: number;
      topEntryPages: Array<{ page: string; count: number; percentage: number }>;
      topExitPages: Array<{ page: string; count: number; percentage: number }>;
      conversionFunnel: {
        homepage: number;
        browse: number;
        booking: number;
        payment: number;
        completion: number;
      };
    };

    // Argentina-specific metrics
    argentinianUsers: {
      percentage: number;
      mobileUsage: number;
      preferredTimeSlots: Array<{ hour: number; bookings: number }>;
      popularServiceTypes: Array<{ service: string; bookings: number }>;
      paymentMethodPreferences: Array<{ method: string; usage: number }>;
      regionalDistribution: Array<{ region: string; users: number }>;
    };

    // Performance insights
    performance: {
      averageLoadTime: number;
      mobilePerformanceScore: number;
      slowConnectionOptimization: number;
      errorRate: number;
      crashFreePage: string | null;
      performanceTrends: Array<{ timestamp: Date; score: number }>;
    };

    // UI/UX Analytics
    uiInteractions: {
      mostClickedElements: Array<{ element: string; clicks: number; page: string }>;
      formAbandonmentRate: number;
      searchUsage: number;
      filterUsage: number;
      mobileGestureUsage: Array<{ gesture: string; frequency: number }>;
      accessibilityUsage: {
        screenReaderUsers: number;
        keyboardNavigationUsers: number;
        highContrastUsers: number;
      };
    };

    // Launch day specific metrics
    launchMetrics: {
      newUserRegistrations: number;
      providerSignups: number;
      firstBookingSuccess: number;
      referralConversions: number;
      socialShareClicks: number;
      helpPageVisits: number;
    };
  }

  interface UserJourneyAnalysis {
    commonPaths: Array<{ path: string; frequency: number; conversionRate: number }>;
    dropOffPoints: Array<{ page: string; dropRate: number; suggestions: string[] }>;
    timeSpentAnalysis: Array<{ page: string; averageTime: number; optimalTime: number }>;
    mobileVsDesktopBehavior: {
      mobile: { bounceRate: number; conversion: number; sessionTime: number };
      desktop: { bounceRate: number; conversion: number; sessionTime: number };
    };
  }

  interface Day7Recommendations {
    highPriority: string[];
    mediumPriority: string[];
    longTerm: string[];
    argentineSpecific: string[];
    mobileOptimizations: string[];
    performanceImprovements: string[];
  }

  // Analytics store
  const analyticsStore = writable<FrontendAnalytics>({
    userFlow: {
      totalSessions: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      topEntryPages: [],
      topExitPages: [],
      conversionFunnel: {
        homepage: 0,
        browse: 0,
        booking: 0,
        payment: 0,
        completion: 0
      }
    },
    argentinianUsers: {
      percentage: 0,
      mobileUsage: 0,
      preferredTimeSlots: [],
      popularServiceTypes: [],
      paymentMethodPreferences: [],
      regionalDistribution: []
    },
    performance: {
      averageLoadTime: 0,
      mobilePerformanceScore: 0,
      slowConnectionOptimization: 0,
      errorRate: 0,
      crashFreePage: null,
      performanceTrends: []
    },
    uiInteractions: {
      mostClickedElements: [],
      formAbandonmentRate: 0,
      searchUsage: 0,
      filterUsage: 0,
      mobileGestureUsage: [],
      accessibilityUsage: {
        screenReaderUsers: 0,
        keyboardNavigationUsers: 0,
        highContrastUsers: 0
      }
    },
    launchMetrics: {
      newUserRegistrations: 0,
      providerSignups: 0,
      firstBookingSuccess: 0,
      referralConversions: 0,
      socialShareClicks: 0,
      helpPageVisits: 0
    }
  });

  // User journey analysis
  const journeyAnalysisStore = writable<UserJourneyAnalysis>({
    commonPaths: [],
    dropOffPoints: [],
    timeSpentAnalysis: [],
    mobileVsDesktopBehavior: {
      mobile: { bounceRate: 0, conversion: 0, sessionTime: 0 },
      desktop: { bounceRate: 0, conversion: 0, sessionTime: 0 }
    }
  });

  // Day 7 recommendations
  const recommendationsStore = writable<Day7Recommendations>({
    highPriority: [],
    mediumPriority: [],
    longTerm: [],
    argentineSpecific: [],
    mobileOptimizations: [],
    performanceImprovements: []
  });

  // Derived insights
  const analyticsInsights = derived(
    [analyticsStore, journeyAnalysisStore, performanceStore],
    ([$analytics, $journey, $performance]) => ({
      overallHealth: calculateOverallHealth($analytics, $journey, $performance),
      criticalIssues: identifyCriticalIssues($analytics, $journey),
      opportunityScore: calculateOpportunityScore($analytics),
      userSatisfactionScore: calculateUserSatisfaction($analytics, $journey),
      mobileReadiness: calculateMobileReadiness($analytics),
      conversionOptimizationScore: calculateConversionScore($analytics)
    })
  );

  let currentSession: any = null;
  let analyticsInterval: NodeJS.Timeout;
  let sessionStartTime: number;

  onMount(() => {
    if (browser) {
      initializeAnalytics();
      startSessionTracking();
      setupEventTracking();
    }
  });

  onDestroy(() => {
    if (analyticsInterval) {
      clearInterval(analyticsInterval);
    }
    endSessionTracking();
  });

  function initializeAnalytics() {
    sessionStartTime = Date.now();
    
    // Load existing analytics data
    const savedData = localStorage.getItem('frontend_analytics');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        analyticsStore.set(data);
      } catch (error) {
        console.warn('Failed to load analytics data:', error);
      }
    }

    // Start periodic data collection
    analyticsInterval = setInterval(() => {
      collectAnalyticsData();
      generateRecommendations();
    }, 60000); // Every minute

    console.log('[Frontend Analytics] Initialized for launch day');
  }

  function startSessionTracking() {
    currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      pages: [$page.url.pathname],
      interactions: 0,
      deviceType: $isMobile ? 'mobile' : 'desktop',
      connectionSpeed: $connectionSpeed,
      isArgentinian: detectArgentinianUser()
    };

    // Track page changes
    page.subscribe((pageData) => {
      if (currentSession) {
        currentSession.pages.push(pageData.url.pathname);
        trackPageView(pageData.url.pathname);
      }
    });
  }

  function endSessionTracking() {
    if (currentSession) {
      const sessionDuration = Date.now() - currentSession.startTime;
      
      analyticsStore.update(analytics => ({
        ...analytics,
        userFlow: {
          ...analytics.userFlow,
          totalSessions: analytics.userFlow.totalSessions + 1,
          averageSessionDuration: updateAverage(
            analytics.userFlow.averageSessionDuration,
            sessionDuration / 1000,
            analytics.userFlow.totalSessions
          ),
          pagesPerSession: updateAverage(
            analytics.userFlow.pagesPerSession,
            currentSession.pages.length,
            analytics.userFlow.totalSessions
          )
        }
      }));

      currentSession = null;
    }
  }

  function setupEventTracking() {
    if (!browser) return;

    // Click tracking
    document.addEventListener('click', handleClickEvent);
    
    // Form interaction tracking
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('focusout', handleFormAbandon);
    
    // Search and filter tracking
    document.addEventListener('input', handleSearchInput);
    
    // Mobile gesture tracking
    if ($isMobile) {
      document.addEventListener('touchstart', handleTouchEvent);
      document.addEventListener('touchmove', handleSwipeEvent);
    }

    // Accessibility tracking
    document.addEventListener('keydown', handleKeyboardNav);
    
    // Error tracking
    window.addEventListener('error', handleJSError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    console.log('[Frontend Analytics] Event tracking setup complete');
  }

  function handleClickEvent(event: Event) {
    const target = event.target as HTMLElement;
    const elementInfo = getElementInfo(target);
    
    if (currentSession) {
      currentSession.interactions++;
    }

    analyticsStore.update(analytics => {
      const existingClick = analytics.uiInteractions.mostClickedElements
        .find(item => item.element === elementInfo.selector && item.page === $page.url.pathname);
      
      if (existingClick) {
        existingClick.clicks++;
      } else {
        analytics.uiInteractions.mostClickedElements.push({
          element: elementInfo.selector,
          clicks: 1,
          page: $page.url.pathname
        });
      }

      // Keep top 50 clicked elements
      analytics.uiInteractions.mostClickedElements = analytics.uiInteractions.mostClickedElements
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 50);

      return analytics;
    });
  }

  function handleFormSubmit(event: Event) {
    const form = event.target as HTMLFormElement;
    console.log('[Analytics] Form submitted:', form.action || form.id);
    
    // Track successful form completion
    trackConversionEvent('form_completion', {
      form: form.action || form.id,
      page: $page.url.pathname
    });
  }

  function handleFormAbandon(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.form && input.value.length > 0) {
      // User started filling but didn't complete - potential abandon
      setTimeout(() => {
        if (input.form && !isFormCompleted(input.form)) {
          analyticsStore.update(analytics => ({
            ...analytics,
            uiInteractions: {
              ...analytics.uiInteractions,
              formAbandonmentRate: analytics.uiInteractions.formAbandonmentRate + 0.1
            }
          }));
        }
      }, 30000); // Check after 30 seconds
    }
  }

  function handleSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.type === 'search' || input.placeholder?.toLowerCase().includes('buscar')) {
      analyticsStore.update(analytics => ({
        ...analytics,
        uiInteractions: {
          ...analytics.uiInteractions,
          searchUsage: analytics.uiInteractions.searchUsage + 1
        }
      }));
    }
  }

  function handleTouchEvent(event: TouchEvent) {
    // Track mobile gestures
    const touch = event.touches[0];
    if (touch) {
      // This would be expanded for gesture recognition
      analyticsStore.update(analytics => {
        const gestureData = analytics.uiInteractions.mobileGestureUsage;
        const tapGesture = gestureData.find(g => g.gesture === 'tap');
        
        if (tapGesture) {
          tapGesture.frequency++;
        } else {
          gestureData.push({ gesture: 'tap', frequency: 1 });
        }

        return analytics;
      });
    }
  }

  function handleSwipeEvent(event: TouchEvent) {
    // Track swipe gestures (simplified)
    if (event.touches.length === 1) {
      analyticsStore.update(analytics => {
        const gestureData = analytics.uiInteractions.mobileGestureUsage;
        const swipeGesture = gestureData.find(g => g.gesture === 'swipe');
        
        if (swipeGesture) {
          swipeGesture.frequency++;
        } else {
          gestureData.push({ gesture: 'swipe', frequency: 1 });
        }

        return analytics;
      });
    }
  }

  function handleKeyboardNav(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      analyticsStore.update(analytics => ({
        ...analytics,
        uiInteractions: {
          ...analytics.uiInteractions,
          accessibilityUsage: {
            ...analytics.uiInteractions.accessibilityUsage,
            keyboardNavigationUsers: analytics.uiInteractions.accessibilityUsage.keyboardNavigationUsers + 0.1
          }
        }
      }));
    }
  }

  function handleJSError(event: ErrorEvent) {
    console.error('[Analytics] JS Error:', event.error);
    
    analyticsStore.update(analytics => ({
      ...analytics,
      performance: {
        ...analytics.performance,
        errorRate: analytics.performance.errorRate + 0.01
      }
    }));
  }

  function handlePromiseRejection(event: PromiseRejectionEvent) {
    console.error('[Analytics] Promise Rejection:', event.reason);
    
    analyticsStore.update(analytics => ({
      ...analytics,
      performance: {
        ...analytics.performance,
        errorRate: analytics.performance.errorRate + 0.005
      }
    }));
  }

  function trackPageView(pathname: string) {
    analyticsStore.update(analytics => {
      // Update entry pages
      if (currentSession && currentSession.pages.length === 1) {
        const entryPage = analytics.userFlow.topEntryPages
          .find(page => page.page === pathname);
        
        if (entryPage) {
          entryPage.count++;
        } else {
          analytics.userFlow.topEntryPages.push({
            page: pathname,
            count: 1,
            percentage: 0
          });
        }
      }

      // Update conversion funnel
      if (pathname === '/' || pathname === '/home') {
        analytics.userFlow.conversionFunnel.homepage++;
      } else if (pathname.includes('/servicios') || pathname.includes('/browse')) {
        analytics.userFlow.conversionFunnel.browse++;
      } else if (pathname.includes('/booking') || pathname.includes('/reserva')) {
        analytics.userFlow.conversionFunnel.booking++;
      } else if (pathname.includes('/payment') || pathname.includes('/pago')) {
        analytics.userFlow.conversionFunnel.payment++;
      } else if (pathname.includes('/confirmation') || pathname.includes('/confirmacion')) {
        analytics.userFlow.conversionFunnel.completion++;
      }

      return analytics;
    });
  }

  function trackConversionEvent(event: string, data: any) {
    console.log(`[Analytics] Conversion event: ${event}`, data);
    
    switch (event) {
      case 'user_registration':
        analyticsStore.update(analytics => ({
          ...analytics,
          launchMetrics: {
            ...analytics.launchMetrics,
            newUserRegistrations: analytics.launchMetrics.newUserRegistrations + 1
          }
        }));
        break;
      case 'provider_signup':
        analyticsStore.update(analytics => ({
          ...analytics,
          launchMetrics: {
            ...analytics.launchMetrics,
            providerSignups: analytics.launchMetrics.providerSignups + 1
          }
        }));
        break;
      case 'first_booking':
        analyticsStore.update(analytics => ({
          ...analytics,
          launchMetrics: {
            ...analytics.launchMetrics,
            firstBookingSuccess: analytics.launchMetrics.firstBookingSuccess + 1
          }
        }));
        break;
    }
  }

  function collectAnalyticsData() {
    // Collect current performance metrics
    analyticsStore.update(analytics => ({
      ...analytics,
      performance: {
        ...analytics.performance,
        averageLoadTime: $performanceStore.metrics.loadTime,
        mobilePerformanceScore: $isMobile ? $performanceScore : analytics.performance.mobilePerformanceScore,
        performanceTrends: [
          ...analytics.performance.performanceTrends,
          { timestamp: new Date(), score: $performanceScore }
        ].slice(-100) // Keep last 100 measurements
      }
    }));

    // Update Argentinian user metrics
    if (detectArgentinianUser()) {
      updateArgentinianMetrics();
    }

    // Save analytics data
    saveAnalyticsData();
  }

  function updateArgentinianMetrics() {
    const currentHour = new Date().getHours();
    
    analyticsStore.update(analytics => ({
      ...analytics,
      argentinianUsers: {
        ...analytics.argentinianUsers,
        percentage: updateArgentinianPercentage(analytics.argentinianUsers.percentage),
        mobileUsage: $isMobile ? analytics.argentinianUsers.mobileUsage + 0.1 : analytics.argentinianUsers.mobileUsage,
        preferredTimeSlots: updateTimeSlotPreferences(analytics.argentinianUsers.preferredTimeSlots, currentHour)
      }
    }));
  }

  function generateRecommendations() {
    const currentAnalytics = getCurrentAnalytics();
    const recommendations = analyzeAndGenerateRecommendations(currentAnalytics);
    
    recommendationsStore.set(recommendations);
    console.log('[Analytics] Recommendations updated for Day 7 planning');
  }

  function analyzeAndGenerateRecommendations(analytics: FrontendAnalytics): Day7Recommendations {
    const recommendations: Day7Recommendations = {
      highPriority: [],
      mediumPriority: [],
      longTerm: [],
      argentineSpecific: [],
      mobileOptimizations: [],
      performanceImprovements: []
    };

    // High priority recommendations
    if (analytics.userFlow.bounceRate > 60) {
      recommendations.highPriority.push('Optimize landing page - high bounce rate detected');
    }
    
    if (analytics.performance.errorRate > 0.05) {
      recommendations.highPriority.push('Fix critical JavaScript errors affecting user experience');
    }

    if (analytics.uiInteractions.formAbandonmentRate > 30) {
      recommendations.highPriority.push('Simplify form flows - high abandonment rate');
    }

    // Argentina-specific recommendations
    if (analytics.argentinianUsers.mobileUsage > 80) {
      recommendations.argentineSpecific.push('Prioritize mobile-first design - 80%+ mobile usage');
    }

    if (analytics.argentinianUsers.preferredTimeSlots.length > 0) {
      const peakHour = analytics.argentinianUsers.preferredTimeSlots
        .sort((a, b) => b.bookings - a.bookings)[0];
      recommendations.argentineSpecific.push(`Optimize for peak usage at ${peakHour?.hour}:00 - most bookings`);
    }

    // Mobile optimizations
    if (analytics.performance.mobilePerformanceScore < 80) {
      recommendations.mobileOptimizations.push('Improve mobile performance score');
    }

    if (analytics.uiInteractions.mobileGestureUsage.length < 3) {
      recommendations.mobileOptimizations.push('Add more intuitive mobile gestures');
    }

    // Performance improvements
    if (analytics.performance.averageLoadTime > 3000) {
      recommendations.performanceImprovements.push('Reduce average load time - currently over 3 seconds');
    }

    // Long-term recommendations
    recommendations.longTerm.push('Implement A/B testing framework for conversion optimization');
    recommendations.longTerm.push('Add advanced analytics for user journey mapping');
    recommendations.longTerm.push('Develop personalized user experience based on behavior');

    return recommendations;
  }

  // Utility functions
  function detectArgentinianUser(): boolean {
    return navigator.language?.includes('es-AR') || 
           Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('Argentina') ||
           false;
  }

  function getElementInfo(element: HTMLElement): { selector: string; text: string } {
    const selector = element.tagName.toLowerCase() + 
                    (element.id ? `#${element.id}` : '') +
                    (element.className ? `.${element.className.split(' ').join('.')}` : '');
    
    return {
      selector: selector.substring(0, 100), // Limit length
      text: element.textContent?.substring(0, 50) || ''
    };
  }

  function isFormCompleted(form: HTMLFormElement): boolean {
    const requiredFields = form.querySelectorAll('[required]');
    return Array.from(requiredFields).every(field => 
      (field as HTMLInputElement).value.trim() !== ''
    );
  }

  function updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  function updateArgentinianPercentage(current: number): number {
    return Math.min(current + 0.1, 100);
  }

  function updateTimeSlotPreferences(slots: any[], hour: number): any[] {
    const existingSlot = slots.find(s => s.hour === hour);
    if (existingSlot) {
      existingSlot.bookings++;
    } else {
      slots.push({ hour, bookings: 1 });
    }
    
    return slots.sort((a, b) => b.bookings - a.bookings).slice(0, 24);
  }

  function calculateOverallHealth(analytics: FrontendAnalytics, journey: UserJourneyAnalysis, performance: any): number {
    const factors = [
      Math.max(0, 100 - analytics.userFlow.bounceRate), // Lower bounce rate = better
      analytics.performance.mobilePerformanceScore,
      Math.max(0, 100 - (analytics.performance.errorRate * 100)),
      Math.max(0, 100 - analytics.uiInteractions.formAbandonmentRate)
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  function identifyCriticalIssues(analytics: FrontendAnalytics, journey: UserJourneyAnalysis): string[] {
    const issues = [];
    
    if (analytics.userFlow.bounceRate > 70) issues.push('Critical bounce rate');
    if (analytics.performance.errorRate > 0.1) issues.push('High error rate');
    if (analytics.uiInteractions.formAbandonmentRate > 50) issues.push('Critical form abandonment');
    
    return issues;
  }

  function calculateOpportunityScore(analytics: FrontendAnalytics): number {
    // Higher opportunity score = more room for improvement
    const conversionRate = analytics.userFlow.conversionFunnel.completion / 
                          Math.max(analytics.userFlow.conversionFunnel.homepage, 1) * 100;
    
    return Math.max(0, 100 - conversionRate);
  }

  function calculateUserSatisfaction(analytics: FrontendAnalytics, journey: UserJourneyAnalysis): number {
    const satisfactionFactors = [
      analytics.userFlow.averageSessionDuration / 180, // 3 minutes = 100%
      analytics.userFlow.pagesPerSession / 5, // 5 pages = 100%
      Math.max(0, 100 - analytics.userFlow.bounceRate) / 100
    ];

    return Math.min(100, satisfactionFactors.reduce((sum, factor) => sum + factor, 0) / satisfactionFactors.length * 100);
  }

  function calculateMobileReadiness(analytics: FrontendAnalytics): number {
    return (
      analytics.performance.mobilePerformanceScore * 0.4 +
      (analytics.uiInteractions.mobileGestureUsage.length * 10) * 0.3 +
      (analytics.argentinianUsers.mobileUsage > 80 ? 100 : 50) * 0.3
    );
  }

  function calculateConversionScore(analytics: FrontendAnalytics): number {
    const funnel = analytics.userFlow.conversionFunnel;
    const conversionRate = funnel.completion / Math.max(funnel.homepage, 1) * 100;
    return conversionRate;
  }

  function getCurrentAnalytics(): FrontendAnalytics {
    let current: FrontendAnalytics;
    analyticsStore.subscribe(value => current = value)();
    return current!;
  }

  function saveAnalyticsData() {
    analyticsStore.subscribe(data => {
      localStorage.setItem('frontend_analytics', JSON.stringify(data));
    })();
  }

  // Export analytics data
  export function getAnalyticsReport() {
    const analytics = getCurrentAnalytics();
    let journey: UserJourneyAnalysis;
    let recommendations: Day7Recommendations;
    let insights: any;
    
    journeyAnalysisStore.subscribe(value => journey = value)();
    recommendationsStore.subscribe(value => recommendations = value)();
    analyticsInsights.subscribe(value => insights = value)();

    return {
      analytics,
      journey: journey!,
      recommendations: recommendations!,
      insights: insights!,
      generatedAt: new Date(),
      launchDayInsights: generateLaunchDayInsights(analytics, insights!)
    };
  }

  function generateLaunchDayInsights(analytics: FrontendAnalytics, insights: any) {
    return {
      summary: {
        totalEngagement: analytics.userFlow.totalSessions,
        userSatisfaction: insights.userSatisfactionScore,
        mobileReadiness: insights.mobileReadiness,
        argentineOptimization: analytics.argentinianUsers.percentage
      },
      keyFindings: [
        `${analytics.userFlow.totalSessions} total user sessions tracked`,
        `${analytics.argentinianUsers.percentage.toFixed(1)}% Argentina users`,
        `${analytics.argentinianUsers.mobileUsage.toFixed(1)}% mobile usage`,
        `${insights.userSatisfactionScore.toFixed(1)} user satisfaction score`
      ],
      nextSteps: [
        'Implement high-priority recommendations',
        'Focus on Argentina mobile experience',
        'Optimize conversion funnel',
        'Enhance performance monitoring'
      ]
    };
  }
</script>

<!-- Analytics Dashboard -->
<div class="analytics-dashboard p-6 space-y-6 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">📊 Frontend Analytics Dashboard</h1>
      <p class="text-gray-600">Launch Day Performance & User Behavior Analysis</p>
    </div>
    
    <div class="flex items-center space-x-4">
      <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        Live Tracking
      </div>
      <div class="text-sm text-gray-500">
        Last updated: {new Date().toLocaleTimeString('es-AR')}
      </div>
    </div>
  </div>

  <!-- Key Insights -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Overall Health -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Overall Health</p>
          <p class="text-2xl font-bold {$analyticsInsights.overallHealth >= 80 ? 'text-green-600' : $analyticsInsights.overallHealth >= 60 ? 'text-yellow-600' : 'text-red-600'}">
            {$analyticsInsights.overallHealth.toFixed(0)}/100
          </p>
        </div>
        <div class="p-3 bg-blue-100 rounded-lg">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- User Satisfaction -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">User Satisfaction</p>
          <p class="text-2xl font-bold text-green-600">
            {$analyticsInsights.userSatisfactionScore.toFixed(0)}/100
          </p>
        </div>
        <div class="p-3 bg-green-100 rounded-lg">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Mobile Readiness -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Mobile Readiness</p>
          <p class="text-2xl font-bold text-blue-600">
            {$analyticsInsights.mobileReadiness.toFixed(0)}/100
          </p>
        </div>
        <div class="p-3 bg-purple-100 rounded-lg">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Conversion Rate -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Conversion Rate</p>
          <p class="text-2xl font-bold text-yellow-600">
            {$analyticsInsights.conversionOptimizationScore.toFixed(1)}%
          </p>
        </div>
        <div class="p-3 bg-yellow-100 rounded-lg">
          <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- User Flow Analysis -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Conversion Funnel -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">🎯 Conversion Funnel</h2>
      
      <div class="space-y-3">
        {#each [
          { name: 'Homepage', count: $analyticsStore.userFlow.conversionFunnel.homepage, color: 'blue' },
          { name: 'Browse Services', count: $analyticsStore.userFlow.conversionFunnel.browse, color: 'green' },
          { name: 'Booking', count: $analyticsStore.userFlow.conversionFunnel.booking, color: 'yellow' },
          { name: 'Payment', count: $analyticsStore.userFlow.conversionFunnel.payment, color: 'orange' },
          { name: 'Completion', count: $analyticsStore.userFlow.conversionFunnel.completion, color: 'red' }
        ] as step, index}
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">{step.name}</span>
            <div class="flex items-center space-x-2">
              <div class="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  class="h-full bg-{step.color}-500 transition-all duration-300"
                  style="width: {$analyticsStore.userFlow.conversionFunnel.homepage > 0 ? (step.count / $analyticsStore.userFlow.conversionFunnel.homepage) * 100 : 0}%"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-900">{step.count}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Argentina User Insights -->
    <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">🇦🇷 Argentina User Insights</h2>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Argentina Users</span>
          <span class="font-semibold text-blue-600">
            {$analyticsStore.argentinianUsers.percentage.toFixed(1)}%
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Mobile Usage</span>
          <span class="font-semibold text-green-600">
            {$analyticsStore.argentinianUsers.mobileUsage.toFixed(1)}%
          </span>
        </div>
        
        {#if $analyticsStore.argentinianUsers.preferredTimeSlots.length > 0}
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Peak Booking Hours</h4>
            <div class="space-y-1">
              {#each $analyticsStore.argentinianUsers.preferredTimeSlots.slice(0, 3) as timeSlot}
                <div class="flex justify-between text-xs">
                  <span>{timeSlot.hour}:00</span>
                  <span class="font-medium">{timeSlot.bookings} bookings</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Critical Issues -->
  {#if $analyticsInsights.criticalIssues.length > 0}
    <div class="bg-red-50 border border-red-200 p-6 rounded-xl">
      <h2 class="text-lg font-semibold text-red-900 mb-4">🚨 Critical Issues</h2>
      
      <div class="space-y-2">
        {#each $analyticsInsights.criticalIssues as issue}
          <div class="flex items-center justify-between p-3 bg-red-100 rounded-lg">
            <span class="text-red-800 font-medium">{issue}</span>
            <button class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
              Fix Now
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Day 7 Recommendations -->
  <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900 mb-6">🚀 Day 7 Planning Recommendations</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- High Priority -->
      <div>
        <h3 class="font-semibold text-red-700 mb-3">🔥 High Priority</h3>
        <div class="space-y-2">
          {#each $recommendationsStore.highPriority as rec}
            <div class="text-sm p-2 bg-red-50 border border-red-200 rounded text-red-700">
              {rec}
            </div>
          {/each}
        </div>
      </div>

      <!-- Argentina Specific -->
      <div>
        <h3 class="font-semibold text-blue-700 mb-3">🇦🇷 Argentina Specific</h3>
        <div class="space-y-2">
          {#each $recommendationsStore.argentineSpecific as rec}
            <div class="text-sm p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
              {rec}
            </div>
          {/each}
        </div>
      </div>

      <!-- Mobile Optimizations -->
      <div>
        <h3 class="font-semibold text-green-700 mb-3">📱 Mobile Focus</h3>
        <div class="space-y-2">
          {#each $recommendationsStore.mobileOptimizations as rec}
            <div class="text-sm p-2 bg-green-50 border border-green-200 rounded text-green-700">
              {rec}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Performance Improvements -->
    {#if $recommendationsStore.performanceImprovements.length > 0}
      <div class="mt-6">
        <h3 class="font-semibold text-yellow-700 mb-3">⚡ Performance Improvements</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          {#each $recommendationsStore.performanceImprovements as rec}
            <div class="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
              {rec}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Launch Metrics Summary -->
  <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">🎉 Launch Day Summary</h2>
    
    <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{$analyticsStore.launchMetrics.newUserRegistrations}</div>
        <div class="text-xs text-gray-600">New Users</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{$analyticsStore.launchMetrics.providerSignups}</div>
        <div class="text-xs text-gray-600">Providers</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-yellow-600">{$analyticsStore.launchMetrics.firstBookingSuccess}</div>
        <div class="text-xs text-gray-600">First Bookings</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600">{$analyticsStore.launchMetrics.referralConversions}</div>
        <div class="text-xs text-gray-600">Referrals</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-pink-600">{$analyticsStore.launchMetrics.socialShareClicks}</div>
        <div class="text-xs text-gray-600">Social Shares</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-600">{$analyticsStore.launchMetrics.helpPageVisits}</div>
        <div class="text-xs text-gray-600">Help Visits</div>
      </div>
    </div>
  </div>
</div>

<style>
  .analytics-dashboard {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
</style>