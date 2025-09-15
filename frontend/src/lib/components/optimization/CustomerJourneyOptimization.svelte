<!--
  F14-001: Customer Journey Optimization with Conversion Enhancement
  Advanced journey tracking and optimization for maximum user experience
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide, fly } from 'svelte/transition';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let enableJourneyTracking = true;
  export let enableConversionOptimization = true;
  export let enableABTesting = true;
  export let enablePersonalization = true;

  const dispatch = createEventDispatcher();

  interface JourneyStep {
    id: string;
    name: string;
    path: string;
    timestamp: number;
    duration: number;
    exitRate: number;
    conversionRate: number;
    userActions: string[];
  }

  interface ConversionFunnel {
    step: string;
    users: number;
    conversions: number;
    rate: number;
    dropOffReasons: string[];
  }

  let currentJourney: JourneyStep[] = [];
  let journeyMetrics = {
    sessionId: '',
    startTime: 0,
    totalSteps: 0,
    completionRate: 0,
    averageStepTime: 0,
    exitPoints: [] as string[],
    goals: {
      booking_started: false,
      booking_completed: false,
      profile_completed: false,
      referral_made: false
    }
  };

  let conversionFunnels: ConversionFunnel[] = [
    { step: 'Landing', users: 1000, conversions: 850, rate: 85, dropOffReasons: ['Slow loading', 'Unclear value prop'] },
    { step: 'Registration', users: 850, conversions: 680, rate: 80, dropOffReasons: ['Complex form', 'Missing trust signals'] },
    { step: 'Profile Setup', users: 680, conversions: 544, rate: 80, dropOffReasons: ['Too many fields', 'Mobile issues'] },
    { step: 'Service Selection', users: 544, conversions: 463, rate: 85, dropOffReasons: ['Limited options', 'Price concerns'] },
    { step: 'Booking Creation', users: 463, conversions: 370, rate: 80, dropOffReasons: ['Calendar issues', 'Payment errors'] },
    { step: 'Payment', users: 370, conversions: 333, rate: 90, dropOffReasons: ['Payment failures', 'Trust concerns'] },
    { step: 'Confirmation', users: 333, conversions: 326, rate: 98, dropOffReasons: ['Email issues', 'Confusion'] }
  ];

  let optimizationSuggestions = {
    currentStep: '',
    suggestions: [],
    impact: 'medium',
    effort: 'low'
  };

  let abTestVariants = {
    current: 'A',
    variants: {
      A: { name: 'Control', description: 'Current experience' },
      B: { name: 'Simplified', description: 'Reduced form fields' },
      C: { name: 'Trust Enhanced', description: 'Added trust signals' }
    },
    results: {
      A: { conversions: 68, users: 100 },
      B: { conversions: 75, users: 100 },
      C: { conversions: 82, users: 100 }
    }
  };

  onMount(() => {
    if (enableJourneyTracking) {
      startJourneyTracking();
    }

    if (enableConversionOptimization) {
      initializeConversionOptimization();
    }

    if (enableABTesting) {
      initializeABTesting();
    }
  });

  function startJourneyTracking() {
    journeyMetrics.sessionId = generateSessionId();
    journeyMetrics.startTime = Date.now();

    // Track page visits
    const unsubscribe = page.subscribe((currentPage) => {
      trackJourneyStep({
        id: generateStepId(),
        name: getPageName(currentPage.url.pathname),
        path: currentPage.url.pathname,
        timestamp: Date.now(),
        duration: 0,
        exitRate: 0,
        conversionRate: 0,
        userActions: []
      });
    });

    // Track user interactions
    document.addEventListener('click', trackUserAction);
    document.addEventListener('submit', trackFormSubmission);
    document.addEventListener('scroll', trackScrollDepth);

    // Track exit intent
    document.addEventListener('mouseleave', trackExitIntent);

    return unsubscribe;
  }

  function trackJourneyStep(step: JourneyStep) {
    // Update previous step duration
    if (currentJourney.length > 0) {
      const previousStep = currentJourney[currentJourney.length - 1];
      previousStep.duration = step.timestamp - previousStep.timestamp;
    }

    currentJourney.push(step);
    journeyMetrics.totalSteps = currentJourney.length;

    // Calculate journey metrics
    updateJourneyMetrics();

    // Trigger optimization analysis
    analyzeJourneyProgress();

    dispatch('journey-step', { step, metrics: journeyMetrics });
  }

  function trackUserAction(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const action = {
      type: 'click',
      element: target.tagName.toLowerCase(),
      id: target.id || '',
      class: target.className || '',
      text: target.textContent?.substring(0, 50) || '',
      timestamp: Date.now()
    };

    if (currentJourney.length > 0) {
      const currentStep = currentJourney[currentJourney.length - 1];
      currentStep.userActions.push(JSON.stringify(action));

      // Track specific goals
      if (target.dataset.goal) {
        trackGoalAchievement(target.dataset.goal);
      }
    }
  }

  function trackFormSubmission(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const formType = form.dataset.formType || 'unknown';

    const submission = {
      type: 'form_submit',
      formType,
      fields: Array.from(formData.keys()),
      timestamp: Date.now()
    };

    if (currentJourney.length > 0) {
      const currentStep = currentJourney[currentJourney.length - 1];
      currentStep.userActions.push(JSON.stringify(submission));
    }

    // Track form-specific goals
    if (formType === 'booking') {
      trackGoalAchievement('booking_started');
    } else if (formType === 'registration') {
      trackGoalAchievement('profile_completed');
    }
  }

  function trackScrollDepth() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollDepth = (window.scrollY / scrollHeight) * 100;

    if (scrollDepth > 80 && currentJourney.length > 0) {
      const currentStep = currentJourney[currentJourney.length - 1];
      const action = {
        type: 'scroll_depth',
        depth: scrollDepth,
        timestamp: Date.now()
      };
      currentStep.userActions.push(JSON.stringify(action));
    }
  }

  function trackExitIntent(event: MouseEvent) {
    if (event.clientY <= 0) {
      const exitPoint = currentJourney[currentJourney.length - 1]?.path || 'unknown';
      journeyMetrics.exitPoints.push(exitPoint);

      dispatch('exit-intent', {
        exitPoint,
        journeyLength: currentJourney.length,
        timeSpent: Date.now() - journeyMetrics.startTime
      });

      // Trigger retention strategy
      showExitIntentOptimization();
    }
  }

  function trackGoalAchievement(goal: string) {
    if (goal in journeyMetrics.goals) {
      journeyMetrics.goals[goal] = true;
      dispatch('goal-achieved', { goal, journey: currentJourney });

      // Trigger success optimizations
      showSuccessOptimization(goal);
    }
  }

  function updateJourneyMetrics() {
    const totalDuration = Date.now() - journeyMetrics.startTime;
    journeyMetrics.averageStepTime = totalDuration / journeyMetrics.totalSteps;

    // Calculate completion rate based on goals achieved
    const goalsAchieved = Object.values(journeyMetrics.goals).filter(Boolean).length;
    const totalGoals = Object.keys(journeyMetrics.goals).length;
    journeyMetrics.completionRate = (goalsAchieved / totalGoals) * 100;
  }

  function analyzeJourneyProgress() {
    const currentStep = currentJourney[currentJourney.length - 1];
    if (!currentStep) return;

    // Identify potential drop-off points
    const stepDuration = currentStep.duration || 0;
    const isSlowStep = stepDuration > 30000; // More than 30 seconds
    const hasMinimalInteraction = currentStep.userActions.length < 2;

    if (isSlowStep || hasMinimalInteraction) {
      generateOptimizationSuggestions(currentStep);
    }

    // Predict user intent and provide proactive assistance
    predictUserIntent();
  }

  function generateOptimizationSuggestions(step: JourneyStep) {
    const stepName = step.name.toLowerCase();
    let suggestions = [];

    if (stepName.includes('registration')) {
      suggestions = [
        'Reduce form fields to essential only',
        'Add social login options',
        'Show progress indicator',
        'Add trust signals (testimonials, security badges)'
      ];
    } else if (stepName.includes('booking')) {
      suggestions = [
        'Simplify calendar interface',
        'Add real-time availability',
        'Provide booking assistance chat',
        'Show popular time slots'
      ];
    } else if (stepName.includes('payment')) {
      suggestions = [
        'Add multiple payment methods',
        'Show security guarantees',
        'Enable one-click payments',
        'Provide payment assistance'
      ];
    } else {
      suggestions = [
        'Add contextual help',
        'Simplify navigation',
        'Improve loading performance',
        'Add progress indicators'
      ];
    }

    optimizationSuggestions = {
      currentStep: step.name,
      suggestions,
      impact: 'high',
      effort: 'medium'
    };

    // Show optimization UI if needed
    if (step.duration > 45000) { // More than 45 seconds
      showOptimizationHelper();
    }
  }

  function predictUserIntent() {
    const recentActions = currentJourney
      .slice(-3)
      .flatMap(step => step.userActions)
      .slice(-5);

    // Simple intent prediction based on actions
    const actionTypes = recentActions.map(action => {
      try {
        return JSON.parse(action).type;
      } catch {
        return 'unknown';
      }
    });

    const intent = {
      likely_to_exit: actionTypes.includes('scroll_depth') && actionTypes.filter(t => t === 'click').length < 2,
      needs_help: actionTypes.length < 2 && (Date.now() - journeyMetrics.startTime) > 60000,
      ready_to_convert: actionTypes.includes('form_submit') || actionTypes.filter(t => t === 'click').length > 5
    };

    if (intent.likely_to_exit) {
      showRetentionAssistance();
    } else if (intent.needs_help) {
      showContextualHelp();
    } else if (intent.ready_to_convert) {
      showConversionBooster();
    }
  }

  function initializeConversionOptimization() {
    // Monitor conversion funnels in real-time
    setInterval(updateConversionMetrics, 30000);

    // Apply dynamic optimizations based on current performance
    applyDynamicOptimizations();
  }

  function updateConversionMetrics() {
    // Simulate real-time updates (in production, this would fetch from analytics API)
    conversionFunnels = conversionFunnels.map(funnel => ({
      ...funnel,
      rate: funnel.rate + (Math.random() - 0.5) * 2 // Small random variation
    }));
  }

  function applyDynamicOptimizations() {
    // Apply optimizations based on current funnel performance
    const lowPerformingSteps = conversionFunnels.filter(funnel => funnel.rate < 75);

    lowPerformingSteps.forEach(step => {
      dispatch('optimization-needed', {
        step: step.step,
        currentRate: step.rate,
        suggestions: getOptimizationForStep(step.step)
      });
    });
  }

  function getOptimizationForStep(stepName: string): string[] {
    const optimizations = {
      'Landing': ['A/B test hero message', 'Optimize loading speed', 'Add social proof'],
      'Registration': ['Simplify form', 'Add social login', 'Improve mobile UX'],
      'Profile Setup': ['Progressive disclosure', 'Skip optional fields', 'Add guidance'],
      'Service Selection': ['Better filtering', 'Add recommendations', 'Show popular services'],
      'Booking Creation': ['Calendar UX improvement', 'Real-time availability', 'Quick booking options'],
      'Payment': ['More payment methods', 'Trust signals', 'Express checkout'],
      'Confirmation': ['Clear next steps', 'Email optimization', 'Add to calendar']
    };

    return optimizations[stepName] || [];
  }

  function initializeABTesting() {
    // Assign user to A/B test variant
    const variant = assignABTestVariant();
    abTestVariants.current = variant;

    // Apply variant-specific optimizations
    applyABTestVariant(variant);

    dispatch('ab-test-assigned', { variant, user: $user?.id });
  }

  function assignABTestVariant(): string {
    const variants = Object.keys(abTestVariants.variants);
    const userHash = $user?.id ? hashString($user.id) : Math.random();
    return variants[Math.floor(userHash * variants.length)];
  }

  function applyABTestVariant(variant: string) {
    document.body.setAttribute('data-ab-variant', variant);

    // Apply variant-specific styles and behaviors
    switch (variant) {
      case 'B':
        // Simplified variant
        document.body.classList.add('simplified-forms');
        break;
      case 'C':
        // Trust enhanced variant
        document.body.classList.add('trust-enhanced');
        break;
      default:
        // Control variant
        break;
    }
  }

  // UI Helper functions
  function showOptimizationHelper() {
    // Implementation would show optimization suggestions UI
    dispatch('show-optimization-helper', optimizationSuggestions);
  }

  function showExitIntentOptimization() {
    // Implementation would show exit intent modal
    dispatch('show-exit-intent-modal');
  }

  function showSuccessOptimization(goal: string) {
    // Implementation would show success celebration and next steps
    dispatch('show-success-optimization', { goal });
  }

  function showRetentionAssistance() {
    // Implementation would show help or incentives to continue
    dispatch('show-retention-assistance');
  }

  function showContextualHelp() {
    // Implementation would show contextual help based on current step
    dispatch('show-contextual-help');
  }

  function showConversionBooster() {
    // Implementation would show conversion acceleration features
    dispatch('show-conversion-booster');
  }

  // Utility functions
  function generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateStepId(): string {
    return 'step_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getPageName(path: string): string {
    const pageNames = {
      '/': 'Landing',
      '/register': 'Registration',
      '/login': 'Login',
      '/dashboard': 'Dashboard',
      '/booking': 'Booking',
      '/profile': 'Profile',
      '/payment': 'Payment'
    };
    return pageNames[path] || path.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / Math.pow(2, 31);
  }

  // Export function for analytics integration
  export function getJourneyData() {
    return {
      journey: currentJourney,
      metrics: journeyMetrics,
      optimizationSuggestions,
      abTestVariant: abTestVariants.current
    };
  }

  export function exportJourneyReport() {
    const report = {
      sessionId: journeyMetrics.sessionId,
      userId: $user?.id,
      startTime: new Date(journeyMetrics.startTime).toISOString(),
      duration: Date.now() - journeyMetrics.startTime,
      steps: currentJourney.length,
      completionRate: journeyMetrics.completionRate,
      goalsAchieved: Object.entries(journeyMetrics.goals)
        .filter(([_, achieved]) => achieved)
        .map(([goal, _]) => goal),
      exitPoints: journeyMetrics.exitPoints,
      abTestVariant: abTestVariants.current,
      journeySteps: currentJourney
    };

    return report;
  }
</script>

<!-- Journey Optimization Dashboard (Admin/Analytics View) -->
{#if $user?.role === 'admin'}
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6" transition:slide>
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Journey Analytics</h3>

    <!-- Current Session Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="text-center p-4 bg-blue-50 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">{journeyMetrics.totalSteps}</div>
        <div class="text-sm text-blue-700">Steps</div>
      </div>
      <div class="text-center p-4 bg-green-50 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{Math.round(journeyMetrics.completionRate)}%</div>
        <div class="text-sm text-green-700">Completion</div>
      </div>
      <div class="text-center p-4 bg-purple-50 rounded-lg">
        <div class="text-2xl font-bold text-purple-600">{Math.round(journeyMetrics.averageStepTime / 1000)}s</div>
        <div class="text-sm text-purple-700">Avg Step Time</div>
      </div>
      <div class="text-center p-4 bg-orange-50 rounded-lg">
        <div class="text-2xl font-bold text-orange-600">{abTestVariants.current}</div>
        <div class="text-sm text-orange-700">A/B Variant</div>
      </div>
    </div>

    <!-- Conversion Funnel -->
    <div class="mb-6">
      <h4 class="font-medium text-gray-900 mb-3">Conversion Funnel</h4>
      <div class="space-y-2">
        {#each conversionFunnels as funnel, index}
          <div class="flex items-center space-x-4">
            <div class="w-24 text-sm text-gray-600">{funnel.step}</div>
            <div class="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                class="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style="width: {funnel.rate}%"
              ></div>
              <div class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {funnel.rate}%
              </div>
            </div>
            <div class="w-16 text-sm text-gray-600">{funnel.users}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- A/B Test Results -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">A/B Test Performance</h4>
      <div class="grid grid-cols-3 gap-4">
        {#each Object.entries(abTestVariants.results) as [variant, results]}
          <div class="text-center p-4 border rounded-lg
            {variant === abTestVariants.current ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}">
            <div class="font-medium">Variant {variant}</div>
            <div class="text-lg font-bold text-blue-600">
              {Math.round((results.conversions / results.users) * 100)}%
            </div>
            <div class="text-xs text-gray-600">{results.conversions}/{results.users}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Real-time Optimization Suggestions (shown to all users when needed) -->
{#if optimizationSuggestions.suggestions.length > 0}
  <div class="fixed bottom-4 left-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
       transition:fly={{ x: -100, duration: 300 }}>
    <div class="flex items-start space-x-3">
      <div class="text-2xl">💡</div>
      <div class="flex-1">
        <div class="font-medium text-gray-900 mb-1">Mejora tu experiencia</div>
        <div class="text-sm text-gray-600 mb-3">
          Detectamos que podrías necesitar ayuda en {optimizationSuggestions.currentStep}
        </div>
        <div class="space-y-1">
          {#each optimizationSuggestions.suggestions.slice(0, 2) as suggestion}
            <div class="text-xs text-blue-600">• {suggestion}</div>
          {/each}
        </div>
        <div class="flex space-x-2 mt-3">
          <button class="text-xs bg-blue-600 text-white px-3 py-1 rounded">
            Ayuda
          </button>
          <button class="text-xs text-gray-600 hover:text-gray-800">
            Ignorar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.simplified-forms input) {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  :global(.simplified-forms .optional-field) {
    display: none;
  }

  :global(.trust-enhanced) {
    --trust-color: #10b981;
  }

  :global(.trust-enhanced .trust-signal) {
    display: block !important;
    color: var(--trust-color);
  }
</style>