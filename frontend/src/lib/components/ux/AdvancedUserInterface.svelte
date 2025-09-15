<!--
  F14-001: Advanced User Interface with Personalization & Adaptive Design
  Complete user interface excellence with intelligent adaptation and micro-animations
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide, fly, scale } from 'svelte/transition';
  import { cubicOut, elasticOut } from 'svelte/easing';
  import { user } from '$lib/stores/auth';

  export let enablePersonalization = true;
  export let enableMicroAnimations = true;
  export let enableAdaptiveDesign = true;
  export let enableGestures = true;

  const dispatch = createEventDispatcher();

  let mounted = false;
  let userPreferences = {
    theme: 'auto',
    reducedMotion: false,
    fontSize: 'normal',
    highContrast: false,
    preferredLanguage: 'es-AR'
  };

  let adaptiveState = {
    screenSize: 'desktop',
    connectionSpeed: 'fast',
    deviceType: 'desktop',
    orientation: 'landscape',
    inputMethod: 'mouse'
  };

  let interactionMetrics = {
    clicks: 0,
    scrollDepth: 0,
    timeSpent: 0,
    features_used: []
  };

  onMount(async () => {
    mounted = true;

    if (enablePersonalization) {
      await loadUserPreferences();
      startPersonalizationEngine();
    }

    if (enableAdaptiveDesign) {
      detectDeviceCapabilities();
      startAdaptiveOptimizations();
    }

    if (enableMicroAnimations) {
      initializeMicroAnimations();
    }

    if (enableGestures) {
      initializeGestureControls();
    }

    // Start user behavior tracking
    startBehaviorTracking();
  });

  async function loadUserPreferences() {
    try {
      // Load from localStorage first
      const stored = localStorage.getItem('barberpro-user-preferences');
      if (stored) {
        userPreferences = { ...userPreferences, ...JSON.parse(stored) };
      }

      // Load from user profile if authenticated
      if ($user) {
        const response = await fetch(`/api/users/${$user.id}/preferences`);
        if (response.ok) {
          const serverPrefs = await response.json();
          userPreferences = { ...userPreferences, ...serverPrefs };
        }
      }

      applyUserPreferences();
    } catch (error) {
      console.warn('[AdvancedUI] Failed to load preferences:', error);
    }
  }

  function applyUserPreferences() {
    // Apply theme
    if (userPreferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (userPreferences.theme === 'light') {
      document.documentElement.classList.remove('dark');
    }

    // Apply accessibility preferences
    if (userPreferences.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01s');
    }

    if (userPreferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      normal: '16px',
      large: '18px',
      extra-large: '20px'
    };
    document.documentElement.style.setProperty(
      '--base-font-size',
      fontSizeMap[userPreferences.fontSize] || '16px'
    );
  }

  function detectDeviceCapabilities() {
    // Screen size detection
    const width = window.innerWidth;
    if (width < 768) {
      adaptiveState.screenSize = 'mobile';
    } else if (width < 1024) {
      adaptiveState.screenSize = 'tablet';
    } else {
      adaptiveState.screenSize = 'desktop';
    }

    // Device type detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    adaptiveState.deviceType = isMobile ? 'mobile' : 'desktop';

    // Input method detection
    if ('ontouchstart' in window) {
      adaptiveState.inputMethod = 'touch';
    }

    // Connection speed estimation
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === '4g') {
        adaptiveState.connectionSpeed = 'fast';
      } else if (connection.effectiveType === '3g') {
        adaptiveState.connectionSpeed = 'moderate';
      } else {
        adaptiveState.connectionSpeed = 'slow';
      }
    }

    // Orientation detection
    adaptiveState.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  function startPersonalizationEngine() {
    // AI-powered personalization based on user behavior
    const personalizeContent = () => {
      if (!$user) return;

      // Analyze user interaction patterns
      const behaviorSignals = {
        preferredActions: getMostUsedFeatures(),
        timeOfDayPattern: getTimeOfDayUsage(),
        devicePreference: adaptiveState.deviceType,
        interactionStyle: getInteractionStyle()
      };

      // Apply personalized optimizations
      personalizeInterface(behaviorSignals);
      dispatch('personalization-applied', behaviorSignals);
    };

    // Run personalization every 30 seconds
    setInterval(personalizeContent, 30000);
  }

  function startAdaptiveOptimizations() {
    // Adapt interface based on current conditions
    const adaptInterface = () => {
      // Performance optimizations based on connection speed
      if (adaptiveState.connectionSpeed === 'slow') {
        disableHeavyAnimations();
        enableDataSaverMode();
      }

      // Layout adaptations for screen size
      if (adaptiveState.screenSize === 'mobile') {
        enableMobileOptimizations();
      }

      // Input method optimizations
      if (adaptiveState.inputMethod === 'touch') {
        enlargeTouchTargets();
        enableSwipeGestures();
      }

      dispatch('adaptive-optimization', adaptiveState);
    };

    // Listen for viewport changes
    window.addEventListener('resize', () => {
      detectDeviceCapabilities();
      adaptInterface();
    });

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        detectDeviceCapabilities();
        adaptInterface();
      }, 100);
    });

    adaptInterface();
  }

  function initializeMicroAnimations() {
    // Add micro-animations to enhance user experience
    const addHoverEffects = (element: HTMLElement) => {
      element.addEventListener('mouseenter', () => {
        if (!userPreferences.reducedMotion) {
          element.style.transform = 'scale(1.02)';
          element.style.transition = 'transform 0.2s ease-out';
        }
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'scale(1)';
      });
    };

    // Apply to interactive elements
    const interactiveElements = document.querySelectorAll('button, .card, .interactive');
    interactiveElements.forEach(addHoverEffects);
  }

  function initializeGestureControls() {
    if (adaptiveState.inputMethod !== 'touch') return;

    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          dispatch('swipe-right');
        } else {
          dispatch('swipe-left');
        }
      } else if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          dispatch('swipe-down');
        } else {
          dispatch('swipe-up');
        }
      }
    });
  }

  function startBehaviorTracking() {
    // Track user interactions for personalization
    document.addEventListener('click', (e) => {
      interactionMetrics.clicks++;

      const target = e.target as HTMLElement;
      if (target.dataset.feature) {
        if (!interactionMetrics.features_used.includes(target.dataset.feature)) {
          interactionMetrics.features_used.push(target.dataset.feature);
        }
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = (window.scrollY / scrollHeight) * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
      interactionMetrics.scrollDepth = maxScrollDepth;
    });

    // Track time spent
    const startTime = Date.now();
    setInterval(() => {
      interactionMetrics.timeSpent = Date.now() - startTime;
    }, 1000);
  }

  function getMostUsedFeatures(): string[] {
    return interactionMetrics.features_used.slice(0, 5);
  }

  function getTimeOfDayUsage(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'early-morning';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  function getInteractionStyle(): string {
    const clicksPerMinute = interactionMetrics.clicks / (interactionMetrics.timeSpent / 60000);
    if (clicksPerMinute > 10) return 'fast';
    if (clicksPerMinute > 5) return 'moderate';
    return 'careful';
  }

  function personalizeInterface(signals: any) {
    // Apply AI-powered interface personalization
    if (signals.preferredActions.includes('booking')) {
      // Prioritize booking features
      const bookingElements = document.querySelectorAll('[data-feature="booking"]');
      bookingElements.forEach(el => {
        (el as HTMLElement).style.order = '-1';
      });
    }

    if (signals.interactionStyle === 'fast') {
      // Reduce animation delays for fast users
      document.documentElement.style.setProperty('--animation-delay', '0s');
    }

    if (signals.timeOfDayPattern === 'night') {
      // Suggest dark mode for night users
      if (userPreferences.theme === 'auto') {
        document.documentElement.classList.add('dark');
      }
    }
  }

  function disableHeavyAnimations() {
    document.documentElement.classList.add('reduced-animations');
  }

  function enableDataSaverMode() {
    document.documentElement.classList.add('data-saver');
  }

  function enableMobileOptimizations() {
    document.documentElement.classList.add('mobile-optimized');
  }

  function enlargeTouchTargets() {
    document.documentElement.classList.add('large-touch-targets');
  }

  function enableSwipeGestures() {
    document.documentElement.classList.add('swipe-enabled');
  }

  // Preference update functions
  function updateTheme(theme: string) {
    userPreferences.theme = theme;
    applyUserPreferences();
    savePreferences();
  }

  function updateFontSize(size: string) {
    userPreferences.fontSize = size;
    applyUserPreferences();
    savePreferences();
  }

  function toggleHighContrast() {
    userPreferences.highContrast = !userPreferences.highContrast;
    applyUserPreferences();
    savePreferences();
  }

  function toggleReducedMotion() {
    userPreferences.reducedMotion = !userPreferences.reducedMotion;
    applyUserPreferences();
    savePreferences();
  }

  async function savePreferences() {
    // Save to localStorage
    localStorage.setItem('barberpro-user-preferences', JSON.stringify(userPreferences));

    // Save to server if authenticated
    if ($user) {
      try {
        await fetch(`/api/users/${$user.id}/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userPreferences)
        });
      } catch (error) {
        console.warn('[AdvancedUI] Failed to save preferences to server:', error);
      }
    }
  }

  // Export metrics for analytics
  export function getMetrics() {
    return {
      userPreferences,
      adaptiveState,
      interactionMetrics
    };
  }
</script>

<!-- Advanced UI Controls Panel -->
{#if mounted}
  <div class="fixed bottom-4 right-4 z-50" transition:fly={{ y: 100, duration: 500, easing: cubicOut }}>
    <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900">Personalización</h3>
        <button class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Theme Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tema</label>
          <div class="flex space-x-2">
            <button
              on:click={() => updateTheme('light')}
              class="flex-1 p-2 text-xs rounded-lg border transition-colors
                {userPreferences.theme === 'light'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}"
            >
              ☀️ Claro
            </button>
            <button
              on:click={() => updateTheme('dark')}
              class="flex-1 p-2 text-xs rounded-lg border transition-colors
                {userPreferences.theme === 'dark'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}"
            >
              🌙 Oscuro
            </button>
            <button
              on:click={() => updateTheme('auto')}
              class="flex-1 p-2 text-xs rounded-lg border transition-colors
                {userPreferences.theme === 'auto'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}"
            >
              🔄 Auto
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tamaño de Texto</label>
          <div class="flex space-x-2">
            <button
              on:click={() => updateFontSize('small')}
              class="flex-1 p-2 text-xs rounded-lg border transition-colors
                {userPreferences.fontSize === 'small'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}"
            >
              A
            </button>
            <button
              on:click={() => updateFontSize('normal')}
              class="flex-1 p-2 text-sm rounded-lg border transition-colors
                {userPreferences.fontSize === 'normal'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}"
            >
              A
            </button>
            <button
              on:click={() => updateFontSize('large')}
              class="flex-1 p-2 text-base rounded-lg border transition-colors
                {userPreferences.fontSize === 'large'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}"
            >
              A
            </button>
          </div>
        </div>

        <!-- Accessibility Options -->
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={userPreferences.highContrast}
              on:change={toggleHighContrast}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Alto Contraste</span>
          </label>

          <label class="flex items-center">
            <input
              type="checkbox"
              checked={userPreferences.reducedMotion}
              on:change={toggleReducedMotion}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="ml-2 text-sm text-gray-700">Reducir Animaciones</span>
          </label>
        </div>

        <!-- Device Information -->
        <div class="pt-3 border-t border-gray-200">
          <div class="text-xs text-gray-500 space-y-1">
            <div>Dispositivo: {adaptiveState.deviceType}</div>
            <div>Pantalla: {adaptiveState.screenSize}</div>
            <div>Conexión: {adaptiveState.connectionSpeed}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Micro-animations and feedback -->
{#if enableMicroAnimations && !userPreferences.reducedMotion}
  <div class="pointer-events-none fixed inset-0 z-40">
    <!-- Success feedback animation -->
    <!-- Error feedback animation -->
    <!-- Loading states -->
  </div>
{/if}

<style>
  :global(.reduced-animations *) {
    animation-duration: 0.01s !important;
    animation-delay: 0s !important;
    transition-duration: 0.01s !important;
  }

  :global(.data-saver img) {
    filter: blur(2px);
    transition: filter 0.3s ease;
  }

  :global(.data-saver img:hover) {
    filter: none;
  }

  :global(.mobile-optimized) {
    font-size: calc(var(--base-font-size) * 1.1);
  }

  :global(.large-touch-targets button),
  :global(.large-touch-targets a),
  :global(.large-touch-targets input),
  :global(.large-touch-targets [role="button"]) {
    min-height: 44px;
    min-width: 44px;
  }

  :global(.high-contrast) {
    filter: contrast(150%);
  }

  :global(.swipe-enabled) {
    touch-action: pan-x pan-y;
  }
</style>