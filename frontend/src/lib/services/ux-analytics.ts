// UX Analytics Service - Real-time User Experience Monitoring
// Comprehensive tracking for Argentina market user behavior analysis

interface UXEvent {
  type: 'page_view' | 'interaction' | 'form_action' | 'booking_flow' | 'error' | 'performance';
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  location: ArgentinaLocationData;
  data: any;
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenSize: string;
  isTouch: boolean;
  connection: string; // 3G, 4G, WiFi, etc.
}

interface ArgentinaLocationData {
  region?: 'CABA' | 'GBA' | 'Córdoba' | 'Rosario' | 'Other';
  timezone: 'America/Argentina/Buenos_Aires';
  currency: 'ARS';
  locale: 'es-AR';
}

interface BookingFlowStep {
  step: 'service_selection' | 'date_time' | 'form_completion' | 'payment' | 'confirmation';
  startTime: number;
  endTime?: number;
  dropped?: boolean;
  errorEncountered?: string;
  recoveryAction?: string;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  deviceInfo: DeviceInfo;
  location: ArgentinaLocationData;
  bookingFlows: BookingFlowStep[];
  interactions: UXEvent[];
  performanceMetrics: PerformanceMetrics[];
}

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  cumulativeLayoutShift: number;
  route: string;
  timestamp: number;
}

class UXAnalyticsService {
  private sessionId: string;
  private currentSession: UserSession;
  private bookingFlowState: BookingFlowStep | null = null;
  private interactionQueue: UXEvent[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.currentSession = this.initializeSession();
    this.setupEventListeners();
    this.startPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `ux_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): UserSession {
    return {
      sessionId: this.sessionId,
      startTime: Date.now(),
      deviceInfo: this.getDeviceInfo(),
      location: this.getArgentinaLocationData(),
      bookingFlows: [],
      interactions: [],
      performanceMetrics: []
    };
  }

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const connection = (navigator as any).connection;
    
    let deviceType: 'mobile' | 'tablet' | 'desktop';
    if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';
    else deviceType = 'desktop';

    return {
      type: deviceType,
      os: this.getOS(),
      browser: this.getBrowser(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      isTouch: 'ontouchstart' in window,
      connection: connection ? connection.effectiveType || 'unknown' : 'unknown'
    };
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Unknown';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Chromium')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getArgentinaLocationData(): ArgentinaLocationData {
    // In production, this would use geolocation or IP-based detection
    // For now, we assume Argentina market
    return {
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      locale: 'es-AR'
      // region would be detected via geolocation or user selection
    };
  }

  private setupEventListeners(): void {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_view', {
        action: document.hidden ? 'hidden' : 'visible',
        route: window.location.pathname
      });
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error', {
        type: 'unhandled_promise',
        reason: event.reason?.toString()
      });
    });

    // Network status changes (critical for Argentina mobile users)
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('performance', { action: 'connection_restored' });
      this.flushEventQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('performance', { action: 'connection_lost' });
    });

    // User interaction patterns
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const elementInfo = this.getElementInfo(target);
      
      this.trackEvent('interaction', {
        type: 'click',
        element: elementInfo,
        coordinates: { x: event.clientX, y: event.clientY },
        timestamp: Date.now()
      });
    });

    // Form interactions (critical for booking flow)
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.trackEvent('form_action', {
          action: 'focus',
          element: this.getElementInfo(target)
        });
      }
    });

    // Scroll behavior (important for mobile UX)
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('interaction', {
          type: 'scroll',
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY
          },
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight
        });
      }, 150);
    });
  }

  private getElementInfo(element: HTMLElement) {
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList),
      text: element.textContent?.slice(0, 100) || null,
      type: element.getAttribute('type') || null,
      role: element.getAttribute('role') || null
    };
  }

  private startPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        
        this.currentSession.performanceMetrics.push({
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          timeToInteractive: navigation.domInteractive - navigation.navigationStart,
          firstContentfulPaint: fcp?.startTime || 0,
          cumulativeLayoutShift: this.getCLS(),
          route: window.location.pathname,
          timestamp: Date.now()
        });

        this.trackEvent('performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          route: window.location.pathname,
          connectionType: (navigator as any).connection?.effectiveType
        });
      }, 1000);
    });

    // Monitor ongoing performance
    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        this.trackEvent('performance', {
          type: 'memory',
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          timestamp: Date.now()
        });
      }
    }, 30000); // Every 30 seconds
  }

  private getCLS(): number {
    // Simplified CLS calculation
    // In production, use more sophisticated measurement
    return 0; // Placeholder
  }

  // Public methods for booking flow tracking
  startBookingFlow(providerId: string, serviceId?: string): void {
    this.bookingFlowState = {
      step: 'service_selection',
      startTime: Date.now()
    };

    this.trackEvent('booking_flow', {
      action: 'started',
      providerId,
      preselectedService: serviceId || null,
      device: this.currentSession.deviceInfo.type
    });
  }

  progressBookingFlow(step: BookingFlowStep['step'], metadata?: any): void {
    if (this.bookingFlowState) {
      // Complete previous step
      this.bookingFlowState.endTime = Date.now();
      this.currentSession.bookingFlows.push({ ...this.bookingFlowState });

      // Start new step
      this.bookingFlowState = {
        step,
        startTime: Date.now()
      };

      this.trackEvent('booking_flow', {
        action: 'step_completed',
        step,
        timeSpent: this.bookingFlowState.endTime - this.bookingFlowState.startTime,
        metadata
      });
    }
  }

  abandonBookingFlow(reason?: string): void {
    if (this.bookingFlowState) {
      this.bookingFlowState.dropped = true;
      this.bookingFlowState.endTime = Date.now();
      
      this.trackEvent('booking_flow', {
        action: 'abandoned',
        step: this.bookingFlowState.step,
        reason: reason || 'user_navigation',
        timeSpent: this.bookingFlowState.endTime - this.bookingFlowState.startTime
      });

      this.currentSession.bookingFlows.push({ ...this.bookingFlowState });
      this.bookingFlowState = null;
    }
  }

  completeBookingFlow(bookingId: string, paymentMethod: string): void {
    if (this.bookingFlowState) {
      this.bookingFlowState.endTime = Date.now();
      this.currentSession.bookingFlows.push({ ...this.bookingFlowState });

      const totalTime = this.currentSession.bookingFlows.reduce(
        (sum, step) => sum + (step.endTime! - step.startTime), 0
      );

      this.trackEvent('booking_flow', {
        action: 'completed',
        bookingId,
        paymentMethod,
        totalTimeSpent: totalTime,
        stepsCompleted: this.currentSession.bookingFlows.length,
        device: this.currentSession.deviceInfo.type
      });

      this.bookingFlowState = null;
    }
  }

  // Payment method selection tracking (critical for Argentina market)
  trackPaymentMethodSelection(method: 'mercadopago' | 'cash' | 'other'): void {
    this.trackEvent('booking_flow', {
      action: 'payment_method_selected',
      method,
      device: this.currentSession.deviceInfo.type,
      connectionType: this.currentSession.deviceInfo.connection
    });
  }

  // Error recovery tracking
  trackErrorRecovery(originalError: string, recoveryAction: string, successful: boolean): void {
    this.trackEvent('error', {
      type: 'recovery_attempt',
      originalError,
      recoveryAction,
      successful,
      timestamp: Date.now()
    });
  }

  // Form validation errors (important for UX optimization)
  trackFormValidationError(fieldName: string, errorType: string, userInput?: string): void {
    this.trackEvent('form_action', {
      action: 'validation_error',
      field: fieldName,
      errorType,
      // Don't log sensitive data, just type info
      inputLength: userInput?.length || 0
    });
  }

  // Search and filtering behavior
  trackSearchBehavior(query: string, filters: any, resultsCount: number): void {
    this.trackEvent('interaction', {
      type: 'search',
      query: query.slice(0, 50), // Truncate for privacy
      filtersUsed: Object.keys(filters).length,
      resultsCount,
      device: this.currentSession.deviceInfo.type
    });
  }

  // Provider interaction tracking
  trackProviderInteraction(providerId: string, action: 'view' | 'contact' | 'book'): void {
    this.trackEvent('interaction', {
      type: 'provider_interaction',
      providerId,
      action,
      timestamp: Date.now()
    });
  }

  private trackEvent(type: UXEvent['type'], data: any): void {
    const event: UXEvent = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.currentSession.userId,
      deviceInfo: this.currentSession.deviceInfo,
      location: this.currentSession.location,
      data
    };

    this.currentSession.interactions.push(event);

    if (this.isOnline) {
      this.sendEvent(event);
    } else {
      this.interactionQueue.push(event);
    }
  }

  private async sendEvent(event: UXEvent): Promise<void> {
    try {
      await fetch('/api/analytics/ux-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Queue for retry if send fails
      this.interactionQueue.push(event);
      console.warn('Failed to send UX event:', error);
    }
  }

  private flushEventQueue(): void {
    if (this.interactionQueue.length > 0 && this.isOnline) {
      const events = [...this.interactionQueue];
      this.interactionQueue = [];
      
      events.forEach(event => this.sendEvent(event));
    }
  }

  // Get current session analytics for real-time monitoring
  getCurrentSessionAnalytics(): UserSession {
    return {
      ...this.currentSession,
      endTime: Date.now()
    };
  }

  // Argentina-specific user behavior analysis
  getArgentinaMarketInsights(): any {
    const interactions = this.currentSession.interactions;
    const bookingFlows = this.currentSession.bookingFlows;
    
    return {
      devicePreference: this.currentSession.deviceInfo.type,
      connectionQuality: this.currentSession.deviceInfo.connection,
      averageInteractionTime: this.calculateAverageInteractionTime(),
      bookingFlowCompletionRate: this.calculateBookingCompletionRate(),
      mobileUsabilityScore: this.calculateMobileUsabilityScore(),
      paymentMethodPreferences: this.getPaymentMethodPreferences(),
      timeOfDayActivity: this.getTimeOfDayActivity()
    };
  }

  private calculateAverageInteractionTime(): number {
    const interactions = this.currentSession.interactions;
    if (interactions.length < 2) return 0;
    
    const totalTime = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
    return totalTime / interactions.length;
  }

  private calculateBookingCompletionRate(): number {
    const completed = this.currentSession.bookingFlows.filter(flow => !flow.dropped).length;
    const total = this.currentSession.bookingFlows.length;
    return total > 0 ? (completed / total) * 100 : 0;
  }

  private calculateMobileUsabilityScore(): number {
    if (this.currentSession.deviceInfo.type !== 'mobile') return 100;
    
    const errorEvents = this.currentSession.interactions.filter(e => e.type === 'error').length;
    const totalEvents = this.currentSession.interactions.length;
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
    
    return Math.max(0, 100 - errorRate * 10); // Simplified scoring
  }

  private getPaymentMethodPreferences(): any {
    const paymentEvents = this.currentSession.interactions.filter(
      e => e.type === 'booking_flow' && e.data.action === 'payment_method_selected'
    );
    
    return paymentEvents.reduce((acc, event) => {
      const method = event.data.method;
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTimeOfDayActivity(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // Public method for external event tracking
  public trackExternalEvent(eventType: string, data: any): void {
    this.trackEvent('interaction', {
      customEventType: eventType,
      ...data
    });
  }
}

// Export singleton instance
export const uxAnalytics = new UXAnalyticsService();

// Export types for use in other modules
export type {
  UXEvent,
  DeviceInfo,
  ArgentinaLocationData,
  BookingFlowStep,
  UserSession,
  PerformanceMetrics
};