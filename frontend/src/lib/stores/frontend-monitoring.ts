// Frontend Monitoring Store - Real-time monitoring and analytics for BarberPro
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { dev } from '$app/environment';
import { performanceStore } from './performance';
import { apiClient } from '../api/client';

interface FrontendMetrics {
  // User interaction metrics
  clickEvents: number;
  formSubmissions: number;
  navigationEvents: number;
  searchQueries: number;
  bookingAttempts: number;
  bookingCompletions: number;
  
  // Performance metrics
  averageLoadTime: number;
  averageRenderTime: number;
  errorRate: number;
  cacheHitRate: number;
  
  // User experience metrics
  bounceRate: number;
  sessionDuration: number;
  pagesPerSession: number;
  conversionRate: number;
  
  // Argentina-specific metrics
  mobileUsageRate: number;
  whatsappShares: number;
  spanishPreferenceRate: number;
  
  // Real-time stats
  currentUsers: number;
  activeBookings: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Timestamp
  lastUpdate: Date;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: string[];
  interactions: InteractionEvent[];
  deviceInfo: DeviceInfo;
  location?: GeolocationInfo;
  isActive: boolean;
}

interface InteractionEvent {
  type: 'click' | 'form' | 'search' | 'booking' | 'error' | 'navigation';
  target?: string;
  value?: string;
  timestamp: Date;
  duration?: number;
  success?: boolean;
  metadata?: Record<string, any>;
}

interface DeviceInfo {
  isMobile: boolean;
  userAgent: string;
  screenResolution: string;
  connectionType: string;
  language: string;
  timezone: string;
}

interface GeolocationInfo {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface MonitoringAlert {
  id: string;
  type: 'performance' | 'error' | 'usage' | 'security';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  affectedUsers?: number;
  relatedMetric?: string;
}

interface FrontendMonitoringState {
  metrics: FrontendMetrics;
  currentSession: UserSession | null;
  allSessions: UserSession[];
  alerts: MonitoringAlert[];
  isMonitoring: boolean;
  configuration: {
    enableRealTimeTracking: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorTracking: boolean;
    enableUserAnalytics: boolean;
    sampleRate: number;
    batchSize: number;
    reportingInterval: number;
  };
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  ERROR_RATE: 0.05, // 5%
  LOAD_TIME: 3000, // 3 seconds
  BOUNCE_RATE: 0.7, // 70%
  LOW_CONVERSION: 0.02, // 2%
  HIGH_MEMORY: 100 * 1024 * 1024, // 100MB
  LOW_CACHE_HIT: 0.6 // 60%
};

// Initial state
const initialState: FrontendMonitoringState = {
  metrics: {
    clickEvents: 0,
    formSubmissions: 0,
    navigationEvents: 0,
    searchQueries: 0,
    bookingAttempts: 0,
    bookingCompletions: 0,
    averageLoadTime: 0,
    averageRenderTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    bounceRate: 0,
    sessionDuration: 0,
    pagesPerSession: 0,
    conversionRate: 0,
    mobileUsageRate: 0,
    whatsappShares: 0,
    spanishPreferenceRate: 0,
    currentUsers: 0,
    activeBookings: 0,
    systemHealth: 'excellent',
    lastUpdate: new Date()
  },
  currentSession: null,
  allSessions: [],
  alerts: [],
  isMonitoring: false,
  configuration: {
    enableRealTimeTracking: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableUserAnalytics: !dev, // Disable in development, enable in production
    sampleRate: dev ? 0.1 : 1.0, // 10% in dev, 100% in production
    batchSize: dev ? 5 : 10, // Smaller batches in dev
    reportingInterval: dev ? 60000 : 30000 // 1 minute in dev, 30 seconds in production
  }
};

function createFrontendMonitoringStore() {
  const { subscribe, set, update } = writable<FrontendMonitoringState>(initialState);

  let eventQueue: InteractionEvent[] = [];
  let reportingInterval: number | null = null;
  let sessionHeartbeat: number | null = null;

  // Start monitoring
  const startMonitoring = () => {
    if (!browser) return;

    update(state => ({ ...state, isMonitoring: true }));

    // Initialize session
    initializeSession();

    // Set up event listeners
    setupEventListeners();

    // Start reporting interval
    startReportingInterval();

    // Start session heartbeat
    startSessionHeartbeat();

    console.log('[FrontendMonitoring] Started monitoring for BarberPro Argentina');
  };

  // Stop monitoring
  const stopMonitoring = () => {
    update(state => ({ ...state, isMonitoring: false }));

    // Clean up intervals
    if (reportingInterval) {
      clearInterval(reportingInterval);
      reportingInterval = null;
    }

    if (sessionHeartbeat) {
      clearInterval(sessionHeartbeat);
      sessionHeartbeat = null;
    }

    // End current session
    endSession();

    console.log('[FrontendMonitoring] Stopped monitoring');
  };

  // Initialize user session
  function initializeSession() {
    const sessionId = generateSessionId();
    const deviceInfo = getDeviceInfo();

    const session: UserSession = {
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: [window.location.pathname],
      interactions: [],
      deviceInfo,
      isActive: true
    };

    // Try to get geolocation
    getGeolocation().then(location => {
      if (location) {
        session.location = location;
      }
    });

    update(state => ({
      ...state,
      currentSession: session,
      allSessions: [...state.allSessions, session]
    }));

    // Track session start
    trackInteraction({
      type: 'navigation',
      target: 'session_start',
      timestamp: new Date(),
      metadata: { deviceInfo, sessionId }
    });
  }

  // Generate unique session ID
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get device information
  function getDeviceInfo(): DeviceInfo {
    return {
      isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      connectionType: getConnectionType(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Get connection type
  function getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  // Get geolocation (with user permission)
  async function getGeolocation(): Promise<GeolocationInfo | null> {
    try {
      // For Argentina users, we can infer location from timezone and language
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;

      if (timezone.includes('Argentina') || language.includes('es-AR')) {
        return {
          country: 'Argentina',
          region: timezone.split('/')[2] || 'Buenos_Aires',
          city: timezone.split('/')[2] || 'Buenos Aires'
        };
      }

      // If geolocation API is available and user grants permission
      if ('geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                country: 'Unknown',
                region: 'Unknown',
                city: 'Unknown',
                coordinates: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }
              });
            },
            () => resolve(null), // User denied permission
            { timeout: 5000 }
          );
        });
      }
    } catch (error) {
      console.warn('[FrontendMonitoring] Geolocation detection failed:', error);
    }

    return null;
  }

  // Set up event listeners
  function setupEventListeners() {
    // Click tracking
    document.addEventListener('click', (event) => {
      trackInteraction({
        type: 'click',
        target: getElementIdentifier(event.target as Element),
        timestamp: new Date(),
        metadata: {
          x: event.clientX,
          y: event.clientY,
          button: event.button
        }
      });
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      trackInteraction({
        type: 'form',
        target: form.id || form.className || 'unknown-form',
        timestamp: new Date(),
        success: true, // Will be updated if validation fails
        metadata: {
          action: form.action,
          method: form.method
        }
      });
    });

    // Navigation tracking
    window.addEventListener('popstate', () => {
      trackInteraction({
        type: 'navigation',
        target: window.location.pathname,
        timestamp: new Date()
      });

      updatePageView(window.location.pathname);
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      trackInteraction({
        type: 'error',
        target: event.filename || 'unknown',
        timestamp: new Date(),
        success: false,
        metadata: {
          message: event.message,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        }
      });

      checkErrorThresholds();
    });

    // Unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', (event) => {
      trackInteraction({
        type: 'error',
        target: 'promise_rejection',
        timestamp: new Date(),
        success: false,
        metadata: {
          reason: event.reason
        }
      });
    });

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        trackInteraction({
          type: 'navigation',
          target: 'page_hidden',
          timestamp: new Date()
        });
      } else {
        trackInteraction({
          type: 'navigation',
          target: 'page_visible',
          timestamp: new Date()
        });
        updateLastActivity();
      }
    });

    // Before unload (session end)
    window.addEventListener('beforeunload', () => {
      endSession();
      flushEventQueue();
    });
  }

  // Track user interaction
  function trackInteraction(interaction: InteractionEvent) {
    // Apply sampling rate
    if (Math.random() > initialState.configuration.sampleRate) {
      return;
    }

    // Add to queue
    eventQueue.push(interaction);

    // Update current session
    update(state => {
      if (state.currentSession) {
        state.currentSession.interactions.push(interaction);
        state.currentSession.lastActivity = new Date();
      }
      return state;
    });

    // Update metrics based on interaction type
    updateMetricsFromInteraction(interaction);

    // Check if queue needs to be flushed
    if (eventQueue.length >= initialState.configuration.batchSize) {
      flushEventQueue();
    }
  }

  // Update metrics based on interaction
  function updateMetricsFromInteraction(interaction: InteractionEvent) {
    update(state => {
      const newMetrics = { ...state.metrics };

      switch (interaction.type) {
        case 'click':
          newMetrics.clickEvents++;
          break;
        case 'form':
          newMetrics.formSubmissions++;
          break;
        case 'navigation':
          newMetrics.navigationEvents++;
          break;
        case 'search':
          newMetrics.searchQueries++;
          break;
        case 'booking':
          if (interaction.target === 'booking_attempt') {
            newMetrics.bookingAttempts++;
          } else if (interaction.target === 'booking_completion') {
            newMetrics.bookingCompletions++;
          }
          break;
      }

      // Update conversion rate
      if (newMetrics.bookingAttempts > 0) {
        newMetrics.conversionRate = newMetrics.bookingCompletions / newMetrics.bookingAttempts;
      }

      newMetrics.lastUpdate = new Date();

      return { ...state, metrics: newMetrics };
    });
  }

  // Get element identifier for tracking
  function getElementIdentifier(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Update page view
  function updatePageView(pathname: string) {
    update(state => {
      if (state.currentSession) {
        state.currentSession.pageViews.push(pathname);
      }
      return state;
    });
  }

  // Update last activity timestamp
  function updateLastActivity() {
    update(state => {
      if (state.currentSession) {
        state.currentSession.lastActivity = new Date();
      }
      return state;
    });
  }

  // End current session
  function endSession() {
    update(state => {
      if (state.currentSession) {
        state.currentSession.isActive = false;

        // Calculate session metrics
        const sessionDuration = Date.now() - state.currentSession.startTime.getTime();
        const pagesViewed = state.currentSession.pageViews.length;

        // Update overall metrics
        const newMetrics = { ...state.metrics };
        newMetrics.sessionDuration = (newMetrics.sessionDuration + sessionDuration) / 2; // Running average
        newMetrics.pagesPerSession = (newMetrics.pagesPerSession + pagesViewed) / 2;

        return { ...state, metrics: newMetrics, currentSession: null };
      }
      return state;
    });
  }

  // Start reporting interval
  function startReportingInterval() {
    reportingInterval = window.setInterval(() => {
      flushEventQueue();
      updateSystemHealth();
      checkAlertConditions();
    }, initialState.configuration.reportingInterval);
  }

  // Start session heartbeat
  function startSessionHeartbeat() {
    sessionHeartbeat = window.setInterval(() => {
      updateLastActivity();
      
      // Clean up old sessions (older than 30 minutes)
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      
      update(state => ({
        ...state,
        allSessions: state.allSessions.filter(session => 
          session.lastActivity.getTime() > thirtyMinutesAgo
        )
      }));
    }, 60000); // Every minute
  }

  // Flush event queue to backend
  async function flushEventQueue() {
    if (eventQueue.length === 0) return;

    // Skip sending in development if user analytics is disabled
    if (dev && !initialState.configuration.enableUserAnalytics) {
      console.log(`[FrontendMonitoring] Skipping ${eventQueue.length} events in development mode`);
      eventQueue = [];
      return;
    }

    const events = [...eventQueue];
    eventQueue = [];

    try {
      // Send events to backend using centralized API client
      await apiClient.post('/analytics/frontend-events', {
        events,
        timestamp: new Date().toISOString(),
        sessionId: initialState.currentSession?.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        environment: dev ? 'development' : 'production'
      });

      console.log(`[FrontendMonitoring] Sent ${events.length} events to backend`);

    } catch (error) {
      console.error('[FrontendMonitoring] Failed to send events:', error);

      // In development, log the error but don't retry to avoid spam
      if (dev) {
        console.warn('[FrontendMonitoring] Skipping retry in development mode');
        return;
      }

      // Re-queue events for retry (with limit to prevent memory issues)
      if (eventQueue.length < 100) {
        eventQueue = [...events.slice(-50), ...eventQueue];
      }
    }
  }

  // Update system health based on metrics
  function updateSystemHealth() {
    update(state => {
      const { metrics } = state;
      let healthScore = 100;

      // Deduct points for poor metrics
      if (metrics.errorRate > 0.01) healthScore -= 20;
      if (metrics.averageLoadTime > 2000) healthScore -= 15;
      if (metrics.bounceRate > 0.5) healthScore -= 15;
      if (metrics.cacheHitRate < 0.8) healthScore -= 10;
      if (metrics.conversionRate < 0.05) healthScore -= 10;

      let systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
      if (healthScore >= 85) systemHealth = 'excellent';
      else if (healthScore >= 70) systemHealth = 'good';
      else if (healthScore >= 50) systemHealth = 'fair';
      else systemHealth = 'poor';

      return {
        ...state,
        metrics: { ...metrics, systemHealth }
      };
    });
  }

  // Check for alert conditions
  function checkAlertConditions() {
    update(state => {
      const { metrics } = state;
      const newAlerts: MonitoringAlert[] = [...state.alerts];

      // Error rate alert
      if (metrics.errorRate > ALERT_THRESHOLDS.ERROR_RATE) {
        const existingAlert = newAlerts.find(alert => 
          alert.type === 'error' && !alert.resolved
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `error_rate_${Date.now()}`,
            type: 'error',
            level: 'high',
            message: `Error rate is high: ${(metrics.errorRate * 100).toFixed(1)}%`,
            timestamp: new Date(),
            resolved: false,
            relatedMetric: 'errorRate'
          });
        }
      }

      // Load time alert
      if (metrics.averageLoadTime > ALERT_THRESHOLDS.LOAD_TIME) {
        const existingAlert = newAlerts.find(alert => 
          alert.type === 'performance' && !alert.resolved
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `load_time_${Date.now()}`,
            type: 'performance',
            level: 'medium',
            message: `Average load time is slow: ${metrics.averageLoadTime}ms`,
            timestamp: new Date(),
            resolved: false,
            relatedMetric: 'averageLoadTime'
          });
        }
      }

      // Conversion rate alert (critical for BarberPro business)
      if (metrics.conversionRate < ALERT_THRESHOLDS.LOW_CONVERSION && metrics.bookingAttempts > 10) {
        const existingAlert = newAlerts.find(alert => 
          alert.relatedMetric === 'conversionRate' && !alert.resolved
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `conversion_rate_${Date.now()}`,
            type: 'usage',
            level: 'critical',
            message: `Low booking conversion rate: ${(metrics.conversionRate * 100).toFixed(1)}%`,
            timestamp: new Date(),
            resolved: false,
            relatedMetric: 'conversionRate'
          });
        }
      }

      return { ...state, alerts: newAlerts };
    });
  }

  // Check error thresholds
  function checkErrorThresholds() {
    update(state => {
      const totalInteractions = state.currentSession?.interactions.length || 1;
      const errorInteractions = state.currentSession?.interactions.filter(i => 
        i.type === 'error'
      ).length || 0;

      const errorRate = errorInteractions / totalInteractions;

      return {
        ...state,
        metrics: { ...state.metrics, errorRate }
      };
    });
  }

  // Public API for specific tracking
  const trackBookingAttempt = (bookingData: any) => {
    trackInteraction({
      type: 'booking',
      target: 'booking_attempt',
      timestamp: new Date(),
      metadata: bookingData
    });
  };

  const trackBookingCompletion = (bookingId: string) => {
    trackInteraction({
      type: 'booking',
      target: 'booking_completion',
      timestamp: new Date(),
      success: true,
      metadata: { bookingId }
    });
  };

  const trackSearch = (query: string, results: number) => {
    trackInteraction({
      type: 'search',
      target: 'search_query',
      value: query,
      timestamp: new Date(),
      metadata: { resultCount: results }
    });
  };

  const trackWhatsAppShare = () => {
    update(state => ({
      ...state,
      metrics: {
        ...state.metrics,
        whatsappShares: state.metrics.whatsappShares + 1
      }
    }));

    trackInteraction({
      type: 'click',
      target: 'whatsapp_share',
      timestamp: new Date()
    });
  };

  const resolveAlert = (alertId: string) => {
    update(state => ({
      ...state,
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    }));
  };

  const updateConfiguration = (config: Partial<FrontendMonitoringState['configuration']>) => {
    update(state => ({
      ...state,
      configuration: { ...state.configuration, ...config }
    }));
  };

  return {
    subscribe,
    startMonitoring,
    stopMonitoring,
    trackBookingAttempt,
    trackBookingCompletion,
    trackSearch,
    trackWhatsAppShare,
    resolveAlert,
    updateConfiguration,
    flushEventQueue: () => flushEventQueue()
  };
}

export const frontendMonitoringStore = createFrontendMonitoringStore();

// Derived stores for specific metrics
export const currentUserCount = derived(
  frontendMonitoringStore,
  $monitoring => $monitoring.allSessions.filter(s => s.isActive).length
);

export const systemHealthStatus = derived(
  frontendMonitoringStore,
  $monitoring => $monitoring.metrics.systemHealth
);

export const activeAlerts = derived(
  frontendMonitoringStore,
  $monitoring => $monitoring.alerts.filter(alert => !alert.resolved)
);

export const criticalAlerts = derived(
  activeAlerts,
  $alerts => $alerts.filter(alert => alert.level === 'critical')
);

export const bookingConversionRate = derived(
  frontendMonitoringStore,
  $monitoring => $monitoring.metrics.conversionRate
);

export const argentinaMobileMetrics = derived(
  frontendMonitoringStore,
  $monitoring => ({
    mobileUsageRate: $monitoring.metrics.mobileUsageRate,
    whatsappShares: $monitoring.metrics.whatsappShares,
    spanishPreferenceRate: $monitoring.metrics.spanishPreferenceRate
  })
);

// Auto-start monitoring in browser
if (browser) {
  frontendMonitoringStore.startMonitoring();
  
  // Log initial state
  console.log('[FrontendMonitoring] Initialized for BarberPro Argentina mobile users');
}