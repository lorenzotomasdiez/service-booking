// UX Optimization Service - Real-time user experience improvements for Argentina users
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { performanceStore } from '$lib/stores/performance';

interface UXOptimizationState {
  connectionSpeed: 'slow' | 'medium' | 'fast';
  deviceCapabilities: {
    memory: number;
    cores: number;
    isMobile: boolean;
    isLowEnd: boolean;
  };
  userPreferences: {
    reducedMotion: boolean;
    highContrast: boolean;
    darkMode: boolean;
    language: string;
  };
  optimizations: {
    adaptiveLoading: boolean;
    progressiveImages: boolean;
    reducedAnimations: boolean;
    preloadCritical: boolean;
    deferNonCritical: boolean;
  };
  loading: {
    showSkeletons: boolean;
    optimisticUpdates: boolean;
    backgroundSync: boolean;
    offlineQueue: boolean;
  };
}

interface UXImprovementAction {
  id: string;
  type: 'loading' | 'interaction' | 'visual' | 'performance' | 'accessibility';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation: () => void;
  condition: () => boolean;
  appliedAt?: Date;
}

// Initial state optimized for Argentina mobile users
const initialState: UXOptimizationState = {
  connectionSpeed: 'medium',
  deviceCapabilities: {
    memory: 4,
    cores: 4,
    isMobile: true,
    isLowEnd: false
  },
  userPreferences: {
    reducedMotion: false,
    highContrast: false,
    darkMode: false,
    language: 'es-AR'
  },
  optimizations: {
    adaptiveLoading: true,
    progressiveImages: true,
    reducedAnimations: false,
    preloadCritical: true,
    deferNonCritical: true
  },
  loading: {
    showSkeletons: true,
    optimisticUpdates: true,
    backgroundSync: true,
    offlineQueue: true
  }
};

function createUXOptimizationService() {
  const { subscribe, set, update } = writable<UXOptimizationState>(initialState);

  // Available UX improvements
  const improvements: UXImprovementAction[] = [
    {
      id: 'adaptive-loading-slow-network',
      type: 'performance',
      priority: 'high',
      description: 'Enable adaptive loading for slow connections',
      condition: () => getCurrentState().connectionSpeed === 'slow',
      implementation: () => {
        update(state => ({
          ...state,
          optimizations: {
            ...state.optimizations,
            adaptiveLoading: true,
            progressiveImages: true,
            deferNonCritical: true
          }
        }));
        applyAdaptiveLoading();
      }
    },
    {
      id: 'reduce-animations-low-end',
      type: 'performance',
      priority: 'medium',
      description: 'Reduce animations on low-end devices',
      condition: () => getCurrentState().deviceCapabilities.isLowEnd,
      implementation: () => {
        update(state => ({
          ...state,
          optimizations: { ...state.optimizations, reducedAnimations: true }
        }));
        applyReducedAnimations();
      }
    },
    {
      id: 'skeleton-loading-mobile',
      type: 'loading',
      priority: 'high',
      description: 'Enable skeleton loading for mobile users',
      condition: () => getCurrentState().deviceCapabilities.isMobile,
      implementation: () => {
        update(state => ({
          ...state,
          loading: { ...state.loading, showSkeletons: true }
        }));
        enableSkeletonLoading();
      }
    },
    {
      id: 'optimistic-updates-fast-interaction',
      type: 'interaction',
      priority: 'medium',
      description: 'Enable optimistic updates for better perceived performance',
      condition: () => true, // Always beneficial
      implementation: () => {
        update(state => ({
          ...state,
          loading: { ...state.loading, optimisticUpdates: true }
        }));
        enableOptimisticUpdates();
      }
    },
    {
      id: 'high-contrast-accessibility',
      type: 'accessibility',
      priority: 'critical',
      description: 'Apply high contrast mode for better accessibility',
      condition: () => getCurrentState().userPreferences.highContrast,
      implementation: () => {
        applyHighContrastMode();
      }
    },
    {
      id: 'reduced-motion-accessibility',
      type: 'accessibility',
      priority: 'critical',
      description: 'Respect reduced motion preferences',
      condition: () => getCurrentState().userPreferences.reducedMotion,
      implementation: () => {
        update(state => ({
          ...state,
          optimizations: { ...state.optimizations, reducedAnimations: true }
        }));
        applyReducedMotion();
      }
    }
  ];

  let currentState = initialState;

  function getCurrentState(): UXOptimizationState {
    return currentState;
  }

  // Initialize UX optimization
  const initialize = () => {
    if (!browser) return;
    
    console.log('[UX Optimization] Initializing for Argentina mobile users');
    
    // Detect device capabilities
    detectDeviceCapabilities();
    
    // Detect user preferences
    detectUserPreferences();
    
    // Detect connection speed
    detectConnectionSpeed();
    
    // Apply initial optimizations
    applyInitialOptimizations();
    
    // Set up continuous monitoring
    setInterval(() => {
      monitorAndOptimize();
    }, 10000); // Check every 10 seconds
  };

  function detectDeviceCapabilities() {
    if (!browser) return;

    update(state => {
      const newCapabilities = { ...state.deviceCapabilities };
      
      // Device memory
      if ('deviceMemory' in navigator) {
        newCapabilities.memory = (navigator as any).deviceMemory;
        newCapabilities.isLowEnd = newCapabilities.memory <= 2;
      }
      
      // Hardware cores
      if ('hardwareConcurrency' in navigator) {
        newCapabilities.cores = navigator.hardwareConcurrency;
      }
      
      // Mobile detection
      newCapabilities.isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      
      return { ...state, deviceCapabilities: newCapabilities };
    });
  }

  function detectUserPreferences() {
    if (!browser) return;

    update(state => {
      const newPreferences = { ...state.userPreferences };
      
      // Reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      newPreferences.reducedMotion = prefersReducedMotion.matches;
      
      // High contrast
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      newPreferences.highContrast = prefersHighContrast.matches;
      
      // Dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      newPreferences.darkMode = prefersDark.matches;
      
      // Language (Argentina Spanish)
      newPreferences.language = navigator.language || 'es-AR';
      
      return { ...state, userPreferences: newPreferences };
    });
  }

  function detectConnectionSpeed() {
    if (!browser) return;

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        let speed: 'slow' | 'medium' | 'fast' = 'medium';
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          speed = 'slow';
        } else if (effectiveType === '3g') {
          speed = 'medium';
        } else if (effectiveType === '4g') {
          speed = 'fast';
        }
        
        update(state => ({ ...state, connectionSpeed: speed }));
        
        // Listen for connection changes
        connection.addEventListener('change', () => {
          detectConnectionSpeed();
          monitorAndOptimize();
        });
      }
    }
  }

  function applyInitialOptimizations() {
    // Apply optimizations based on initial detection
    improvements.forEach(improvement => {
      if (improvement.condition()) {
        console.log(`[UX Optimization] Applying: ${improvement.description}`);
        improvement.implementation();
        improvement.appliedAt = new Date();
      }
    });
  }

  function monitorAndOptimize() {
    // Check if any new optimizations should be applied
    improvements.forEach(improvement => {
      if (!improvement.appliedAt && improvement.condition()) {
        console.log(`[UX Optimization] Applying new optimization: ${improvement.description}`);
        improvement.implementation();
        improvement.appliedAt = new Date();
      }
    });
  }

  // Specific optimization implementations
  function applyAdaptiveLoading() {
    if (!browser) return;
    
    // Add adaptive loading styles
    const style = document.createElement('style');
    style.textContent = `
      .adaptive-loading img {
        loading: lazy;
        transition: opacity 0.3s ease;
      }
      
      .adaptive-loading img[data-loading] {
        opacity: 0.5;
        background: linear-gradient(90deg, #f0f0f0 25%, transparent 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading-shimmer 2s infinite;
      }
      
      @keyframes loading-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      /* Reduce image quality for slow connections */
      .connection-slow img {
        image-rendering: optimizeSpeed;
        filter: contrast(0.9) brightness(1.1);
      }
    `;
    document.head.appendChild(style);
    
    // Apply adaptive loading class to body
    document.body.classList.add('adaptive-loading');
    
    if (getCurrentState().connectionSpeed === 'slow') {
      document.body.classList.add('connection-slow');
    }
  }

  function applyReducedAnimations() {
    if (!browser) return;
    
    const style = document.createElement('style');
    style.textContent = `
      .reduced-animations *,
      .reduced-animations *::before,
      .reduced-animations *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
    
    document.body.classList.add('reduced-animations');
  }

  function enableSkeletonLoading() {
    if (!browser) return;
    
    // Create skeleton loading styles optimized for Argentina mobile
    const style = document.createElement('style');
    style.textContent = `
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
      }
      
      .skeleton-text {
        height: 1em;
        margin: 0.5em 0;
      }
      
      .skeleton-text-sm {
        height: 0.875em;
        margin: 0.25em 0;
      }
      
      .skeleton-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
      }
      
      .skeleton-card {
        height: 200px;
        border-radius: 8px;
      }
      
      @keyframes skeleton-loading {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          background: #f0f0f0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function enableOptimisticUpdates() {
    // This would be implemented in individual components
    // Here we just set up the infrastructure
    
    if (!browser) return;
    
    // Create a global optimistic update system
    (window as any).optimisticUpdates = {
      booking: new Map(),
      payments: new Map(),
      profile: new Map(),
      
      set(type: string, id: string, data: any) {
        if (!this[type]) this[type] = new Map();
        this[type].set(id, {
          ...data,
          timestamp: Date.now(),
          optimistic: true
        });
      },
      
      get(type: string, id: string) {
        return this[type]?.get(id);
      },
      
      resolve(type: string, id: string, actualData?: any) {
        if (this[type]) {
          if (actualData) {
            this[type].set(id, { ...actualData, optimistic: false });
          } else {
            this[type].delete(id);
          }
        }
      },
      
      reject(type: string, id: string) {
        if (this[type]) {
          this[type].delete(id);
        }
      }
    };
  }

  function applyHighContrastMode() {
    if (!browser) return;
    
    const style = document.createElement('style');
    style.textContent = `
      .high-contrast {
        --color-primary: #000000;
        --color-secondary: #ffffff;
        --color-text: #000000;
        --color-background: #ffffff;
        --color-border: #000000;
      }
      
      .high-contrast * {
        background-color: var(--color-background) !important;
        color: var(--color-text) !important;
        border-color: var(--color-border) !important;
      }
      
      .high-contrast button,
      .high-contrast a {
        background-color: var(--color-primary) !important;
        color: var(--color-secondary) !important;
        border: 2px solid var(--color-primary) !important;
      }
      
      .high-contrast button:hover,
      .high-contrast a:hover {
        background-color: var(--color-secondary) !important;
        color: var(--color-primary) !important;
      }
    `;
    document.head.appendChild(style);
    
    document.body.classList.add('high-contrast');
  }

  function applyReducedMotion() {
    if (!browser) return;
    
    // This is already handled by CSS media queries, but we can add extra logic
    document.body.classList.add('prefers-reduced-motion');
    
    // Disable autoplay videos
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach(video => {
      (video as HTMLVideoElement).removeAttribute('autoplay');
    });
    
    // Disable auto-advancing carousels
    const carousels = document.querySelectorAll('[data-auto-advance]');
    carousels.forEach(carousel => {
      carousel.removeAttribute('data-auto-advance');
    });
  }

  // Argentina-specific optimizations
  function applyArgentinaOptimizations() {
    if (!browser) return;
    
    // Optimize for Argentina mobile usage patterns
    const style = document.createElement('style');
    style.textContent = `
      /* Larger touch targets for Argentina mobile users */
      .btn, button, [role="button"] {
        min-height: 44px;
        min-width: 44px;
        padding: 12px 20px;
      }
      
      /* Optimize text for mobile reading */
      .mobile-optimized {
        font-size: 16px;
        line-height: 1.5;
        letter-spacing: 0.01em;
      }
      
      /* WhatsApp-style UI patterns familiar to Argentina users */
      .chat-style {
        border-radius: 18px;
        padding: 12px 16px;
        margin: 4px 0;
      }
      
      /* One-handed usage optimization */
      .bottom-sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 20px 20px 0 0;
        z-index: 1000;
      }
      
      /* Data-efficient loading for limited plans */
      .data-efficient img {
        max-width: 100%;
        height: auto;
        loading: lazy;
        decoding: async;
      }
    `;
    document.head.appendChild(style);
    
    // Apply mobile-optimized classes
    document.body.classList.add('mobile-optimized', 'argentina-optimized');
  }

  // Error recovery and user guidance
  function showUserGuidance(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    if (!browser) return;
    
    // Create a non-intrusive notification
    const notification = document.createElement('div');
    notification.className = `ux-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#e0f2fe',
      color: type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#0369a1',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '9999',
      maxWidth: '320px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Network quality feedback
  function provideNetworkFeedback() {
    const state = getCurrentState();
    
    if (state.connectionSpeed === 'slow') {
      showUserGuidance('Conexión lenta detectada. Optimizando experiencia...', 'info');
    }
  }

  // Public API
  return {
    subscribe,
    initialize,
    applyAdaptiveLoading,
    applyReducedAnimations,
    enableSkeletonLoading,
    enableOptimisticUpdates,
    applyArgentinaOptimizations,
    showUserGuidance,
    provideNetworkFeedback,
    
    // Update specific aspects
    updateConnectionSpeed: (speed: 'slow' | 'medium' | 'fast') => {
      update(state => ({ ...state, connectionSpeed: speed }));
      monitorAndOptimize();
    },
    
    updateDeviceCapabilities: (capabilities: Partial<UXOptimizationState['deviceCapabilities']>) => {
      update(state => ({
        ...state,
        deviceCapabilities: { ...state.deviceCapabilities, ...capabilities }
      }));
      monitorAndOptimize();
    },
    
    toggleOptimization: (optimization: keyof UXOptimizationState['optimizations']) => {
      update(state => ({
        ...state,
        optimizations: {
          ...state.optimizations,
          [optimization]: !state.optimizations[optimization]
        }
      }));
    }
  };
}

export const uxOptimizationService = createUXOptimizationService();

// Derived stores for easy component consumption
export const connectionSpeed = derived(
  uxOptimizationService,
  $ux => $ux.connectionSpeed
);

export const isMobile = derived(
  uxOptimizationService,
  $ux => $ux.deviceCapabilities.isMobile
);

export const isLowEndDevice = derived(
  uxOptimizationService,
  $ux => $ux.deviceCapabilities.isLowEnd
);

export const shouldUseSkeletons = derived(
  uxOptimizationService,
  $ux => $ux.loading.showSkeletons
);

export const shouldReduceAnimations = derived(
  uxOptimizationService,
  $ux => $ux.optimizations.reducedAnimations || $ux.userPreferences.reducedMotion
);

// Auto-initialize in browser
if (browser) {
  uxOptimizationService.initialize();
  
  // Apply Argentina-specific optimizations
  uxOptimizationService.applyArgentinaOptimizations();
  
  // Provide initial feedback
  setTimeout(() => {
    uxOptimizationService.provideNetworkFeedback();
  }, 2000);
}