// Performance Store - Monitor and optimize app performance
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  loadTime: number;
  apiResponseTime: number;
  renderTime: number;
  bundleSize: number;
  cacheHitRate: number;
  memoryUsage: number;
  
  // User experience metrics
  interactionLatency: number;
  scrollPerformance: number;
  networkQuality: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  
  // Error metrics
  jsErrorCount: number;
  networkErrorCount: number;
  
  // Timestamps
  lastMeasurement: Date;
  sessionStart: Date;
}

interface PerformanceState {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  optimizations: {
    lazyLoadingEnabled: boolean;
    preloadingEnabled: boolean;
    compressionEnabled: boolean;
    cacheOptimized: boolean;
  };
  alerts: PerformanceAlert[];
  history: PerformanceSnapshot[];
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface PerformanceSnapshot {
  timestamp: Date;
  metrics: Partial<PerformanceMetrics>;
  pageUrl: string;
  userAgent: string;
}

// Performance thresholds (based on Core Web Vitals)
const THRESHOLDS = {
  LCP_GOOD: 2500, // milliseconds
  LCP_POOR: 4000,
  FID_GOOD: 100,
  FID_POOR: 300,
  CLS_GOOD: 0.1,
  CLS_POOR: 0.25,
  FCP_GOOD: 1800,
  FCP_POOR: 3000,
  TTFB_GOOD: 800,
  TTFB_POOR: 1800,
  API_RESPONSE_GOOD: 200,
  API_RESPONSE_POOR: 1000,
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
  MEMORY_CRITICAL: 100 * 1024 * 1024 // 100MB
};

// Initial state
const initialState: PerformanceState = {
  metrics: {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    loadTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    interactionLatency: 0,
    scrollPerformance: 0,
    networkQuality: 'unknown',
    jsErrorCount: 0,
    networkErrorCount: 0,
    lastMeasurement: new Date(),
    sessionStart: new Date()
  },
  isMonitoring: false,
  optimizations: {
    lazyLoadingEnabled: true,
    preloadingEnabled: true,
    compressionEnabled: true,
    cacheOptimized: true
  },
  alerts: [],
  history: []
};

function createPerformanceStore() {
  const { subscribe, set, update } = writable<PerformanceState>(initialState);

  // Performance observer instances
  let perfObserver: PerformanceObserver | null = null;
  let layoutShiftObserver: PerformanceObserver | null = null;
  let longTaskObserver: PerformanceObserver | null = null;

  // Start performance monitoring
  const startMonitoring = () => {
    if (!browser || typeof PerformanceObserver === 'undefined') return;

    update(state => ({ ...state, isMonitoring: true }));

    // Core Web Vitals monitoring
    try {
      // LCP (Largest Contentful Paint)
      perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          updateMetric('lcp', lastEntry.startTime);
        }
      });
      perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay) - via event timing
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            updateMetric('fid', fid);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        updateMetric('cls', clsValue);
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

      // FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            updateMetric('fcp', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Long tasks (for interaction latency)
      longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            updateMetric('interactionLatency', entry.duration);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }

    // Navigation timing
    measureNavigationTiming();

    // Memory usage (if supported)
    measureMemoryUsage();

    // Network quality
    detectNetworkQuality();

    // Set up periodic measurements
    setInterval(() => {
      measureMemoryUsage();
      measureCachePerformance();
      takeSnapshot();
    }, 30000); // Every 30 seconds

    console.log('[Performance] Monitoring started');
  };

  // Stop performance monitoring
  const stopMonitoring = () => {
    update(state => ({ ...state, isMonitoring: false }));

    if (perfObserver) perfObserver.disconnect();
    if (layoutShiftObserver) layoutShiftObserver.disconnect();
    if (longTaskObserver) longTaskObserver.disconnect();

    console.log('[Performance] Monitoring stopped');
  };

  // Update a specific metric
  const updateMetric = (metric: keyof PerformanceMetrics, value: number) => {
    update(state => {
      const newMetrics = {
        ...state.metrics,
        [metric]: value,
        lastMeasurement: new Date()
      };

      // Check for performance alerts
      const newAlerts = checkPerformanceThresholds(metric, value, state.alerts);

      return {
        ...state,
        metrics: newMetrics,
        alerts: newAlerts
      };
    });
  };

  // Measure navigation timing
  const measureNavigationTiming = () => {
    if (!browser || !performance.navigation) return;

    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const ttfb = timing.responseStart - timing.navigationStart;

    updateMetric('loadTime', loadTime);
    updateMetric('ttfb', ttfb);
  };

  // Measure memory usage
  const measureMemoryUsage = () => {
    if (!browser) return;

    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      updateMetric('memoryUsage', memory.usedJSHeapSize);
    }
  };

  // Measure cache performance
  const measureCachePerformance = async () => {
    if (!browser || !('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      let totalRequests = 0;
      let cacheHits = 0;

      // This is a simplified cache hit rate calculation
      // In practice, you'd track this more accurately
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        totalRequests += requests.length;
        cacheHits += requests.length * 0.8; // Assume 80% hit rate
      }

      const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
      updateMetric('cacheHitRate', hitRate);
    } catch (error) {
      console.warn('Cache performance measurement failed:', error);
    }
  };

  // Detect network quality
  const detectNetworkQuality = () => {
    if (!browser) return;

    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.effectiveType) {
        update(state => ({
          ...state,
          metrics: {
            ...state.metrics,
            networkQuality: connection.effectiveType
          }
        }));
      }
    }
  };

  // Measure API response time
  const measureApiResponse = (startTime: number, endTime: number) => {
    const responseTime = endTime - startTime;
    updateMetric('apiResponseTime', responseTime);
  };

  // Record JavaScript error
  const recordJsError = () => {
    update(state => ({
      ...state,
      metrics: {
        ...state.metrics,
        jsErrorCount: state.metrics.jsErrorCount + 1
      }
    }));
  };

  // Record network error
  const recordNetworkError = () => {
    update(state => ({
      ...state,
      metrics: {
        ...state.metrics,
        networkErrorCount: state.metrics.networkErrorCount + 1
      }
    }));
  };

  // Check performance thresholds and create alerts
  const checkPerformanceThresholds = (
    metric: keyof PerformanceMetrics, 
    value: number, 
    existingAlerts: PerformanceAlert[]
  ): PerformanceAlert[] => {
    const alerts = [...existingAlerts];
    
    const createAlert = (type: 'warning' | 'error', message: string, threshold: number) => {
      const alertId = `${metric}-${Date.now()}`;
      alerts.push({
        id: alertId,
        type,
        metric: metric as string,
        value,
        threshold,
        message,
        timestamp: new Date(),
        resolved: false
      });
    };

    // Check specific metric thresholds
    switch (metric) {
      case 'lcp':
        if (value > THRESHOLDS.LCP_POOR) {
          createAlert('error', `LCP is poor (${value}ms > ${THRESHOLDS.LCP_POOR}ms)`, THRESHOLDS.LCP_POOR);
        } else if (value > THRESHOLDS.LCP_GOOD) {
          createAlert('warning', `LCP needs improvement (${value}ms > ${THRESHOLDS.LCP_GOOD}ms)`, THRESHOLDS.LCP_GOOD);
        }
        break;
      case 'fid':
        if (value > THRESHOLDS.FID_POOR) {
          createAlert('error', `FID is poor (${value}ms > ${THRESHOLDS.FID_POOR}ms)`, THRESHOLDS.FID_POOR);
        } else if (value > THRESHOLDS.FID_GOOD) {
          createAlert('warning', `FID needs improvement (${value}ms > ${THRESHOLDS.FID_GOOD}ms)`, THRESHOLDS.FID_GOOD);
        }
        break;
      case 'cls':
        if (value > THRESHOLDS.CLS_POOR) {
          createAlert('error', `CLS is poor (${value} > ${THRESHOLDS.CLS_POOR})`, THRESHOLDS.CLS_POOR);
        } else if (value > THRESHOLDS.CLS_GOOD) {
          createAlert('warning', `CLS needs improvement (${value} > ${THRESHOLDS.CLS_GOOD})`, THRESHOLDS.CLS_GOOD);
        }
        break;
      case 'memoryUsage':
        if (value > THRESHOLDS.MEMORY_CRITICAL) {
          createAlert('error', `Memory usage is critical (${(value / 1024 / 1024).toFixed(1)}MB)`, THRESHOLDS.MEMORY_CRITICAL);
        } else if (value > THRESHOLDS.MEMORY_WARNING) {
          createAlert('warning', `Memory usage is high (${(value / 1024 / 1024).toFixed(1)}MB)`, THRESHOLDS.MEMORY_WARNING);
        }
        break;
      case 'apiResponseTime':
        if (value > THRESHOLDS.API_RESPONSE_POOR) {
          createAlert('error', `API response is slow (${value}ms > ${THRESHOLDS.API_RESPONSE_POOR}ms)`, THRESHOLDS.API_RESPONSE_POOR);
        } else if (value > THRESHOLDS.API_RESPONSE_GOOD) {
          createAlert('warning', `API response could be faster (${value}ms > ${THRESHOLDS.API_RESPONSE_GOOD}ms)`, THRESHOLDS.API_RESPONSE_GOOD);
        }
        break;
    }

    return alerts;
  };

  // Take performance snapshot
  const takeSnapshot = () => {
    if (!browser) return;

    update(state => {
      const snapshot: PerformanceSnapshot = {
        timestamp: new Date(),
        metrics: { ...state.metrics },
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };

      // Keep only last 50 snapshots
      const newHistory = [snapshot, ...state.history].slice(0, 50);

      return {
        ...state,
        history: newHistory
      };
    });
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    update(state => ({
      ...state,
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    }));
  };

  // Clear old alerts
  const clearOldAlerts = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    update(state => ({
      ...state,
      alerts: state.alerts.filter(alert => alert.timestamp > oneDayAgo)
    }));
  };

  // Export performance data
  const exportData = () => {
    const state = initialState; // This would come from current state in real implementation
    
    return {
      metrics: state.metrics,
      alerts: state.alerts,
      history: state.history,
      exportTime: new Date().toISOString()
    };
  };

  // Enable/disable optimizations
  const toggleOptimization = (optimization: keyof PerformanceState['optimizations']) => {
    update(state => ({
      ...state,
      optimizations: {
        ...state.optimizations,
        [optimization]: !state.optimizations[optimization]
      }
    }));
  };

  return {
    subscribe,
    startMonitoring,
    stopMonitoring,
    updateMetric,
    measureApiResponse,
    recordJsError,
    recordNetworkError,
    takeSnapshot,
    resolveAlert,
    clearOldAlerts,
    exportData,
    toggleOptimization
  };
}

export const performanceStore = createPerformanceStore();

// Derived stores for specific metrics
export const coreWebVitals = derived(
  performanceStore,
  $performance => ({
    lcp: $performance.metrics.lcp,
    fid: $performance.metrics.fid,
    cls: $performance.metrics.cls,
    fcp: $performance.metrics.fcp
  })
);

export const performanceScore = derived(
  performanceStore,
  $performance => {
    const { lcp, fid, cls } = $performance.metrics;
    
    if (!lcp || !fid || cls === null) return 0;
    
    // Calculate score based on Core Web Vitals
    let score = 0;
    
    // LCP scoring (40% weight)
    if (lcp <= THRESHOLDS.LCP_GOOD) score += 40;
    else if (lcp <= THRESHOLDS.LCP_POOR) score += 20;
    
    // FID scoring (30% weight)
    if (fid <= THRESHOLDS.FID_GOOD) score += 30;
    else if (fid <= THRESHOLDS.FID_POOR) score += 15;
    
    // CLS scoring (30% weight)
    if (cls <= THRESHOLDS.CLS_GOOD) score += 30;
    else if (cls <= THRESHOLDS.CLS_POOR) score += 15;
    
    return score;
  }
);

export const activeAlerts = derived(
  performanceStore,
  $performance => $performance.alerts.filter(alert => !alert.resolved)
);

export const performanceTrend = derived(
  performanceStore,
  $performance => {
    const history = $performance.history.slice(0, 10); // Last 10 snapshots
    if (history.length < 2) return 'stable';
    
    const recent = history[0];
    const older = history[Math.floor(history.length / 2)];
    
    if (!recent.metrics.lcp || !older.metrics.lcp) return 'stable';
    
    const change = (recent.metrics.lcp - older.metrics.lcp) / older.metrics.lcp;
    
    if (change > 0.1) return 'degrading';
    if (change < -0.1) return 'improving';
    return 'stable';
  }
);

// Auto-start monitoring in browser
if (browser) {
  performanceStore.startMonitoring();
  
  // Set up global error handlers
  window.addEventListener('error', () => {
    performanceStore.recordJsError();
  });
  
  window.addEventListener('unhandledrejection', () => {
    performanceStore.recordNetworkError();
  });
}