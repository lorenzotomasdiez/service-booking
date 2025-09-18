// Performance Optimization Service
// F11-001: Customer Experience Platform - Production Readiness & Performance Optimization

class PerformanceOptimizationService {
  private observer: IntersectionObserver | null = null;
  private imageCache = new Map<string, HTMLImageElement>();
  private preloadQueue: string[] = [];
  private criticalResourcesLoaded = false;
  
  // Performance metrics tracking
  private metrics = {
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0
  };
  
  // Error tracking
  private errorBoundaryData = new Map<string, any>();
  
  constructor() {
    this.initializePerformanceTracking();
    this.setupLazyLoading();
    this.setupErrorBoundaries();
  }
  
  // Performance Monitoring
  private initializePerformanceTracking() {
    if (typeof window === 'undefined') return;
    
    // Core Web Vitals tracking
    this.trackCoreWebVitals();
    
    // Custom performance marks
    performance.mark('app-start');
    
    // Network performance
    this.trackNetworkPerformance();
    
    // Memory usage monitoring
    this.monitorMemoryUsage();
  }
  
  private trackCoreWebVitals() {
    // FCP - First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          this.reportMetric('FCP', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });
    
    // LCP - Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID - First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        this.reportMetric('FID', this.metrics.firstInputDelay);
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  private trackNetworkPerformance() {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        
        // Track slow resources
        if (resource.duration > 1000) {
          console.warn(`Slow resource detected: ${resource.name} took ${resource.duration}ms`);
          this.reportSlowResource(resource.name, resource.duration);
        }
        
        // Track failed resources
        if (resource.transferSize === 0 && resource.decodedBodySize === 0) {
          console.error(`Failed to load resource: ${resource.name}`);
          this.reportFailedResource(resource.name);
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }
  
  private monitorMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      setInterval(() => {
        const memoryUsage = {
          used: memory.usedJSHeapSize / 1048576, // MB
          total: memory.totalJSHeapSize / 1048576, // MB
          limit: memory.jsHeapSizeLimit / 1048576 // MB
        };
        
        // Alert if memory usage is high
        if (memoryUsage.used / memoryUsage.limit > 0.8) {
          console.warn('High memory usage detected:', memoryUsage);
          this.reportMemoryIssue(memoryUsage);
        }
      }, 30000); // Check every 30 seconds
    }
  }
  
  // Image Optimization and Lazy Loading
  private setupLazyLoading() {
    if (typeof window === 'undefined') return;
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    );
  }
  
  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (!src) return;
    
    // Check cache first
    if (this.imageCache.has(src)) {
      img.src = src;
      img.classList.add('loaded');
      return;
    }
    
    // Create optimized image loading
    const imageLoader = new Image();
    imageLoader.onload = () => {
      this.imageCache.set(src, imageLoader);
      img.src = src;
      img.classList.add('loaded');
      
      // Remove blur/placeholder
      img.style.filter = 'none';
    };
    
    imageLoader.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      img.classList.add('error');
    };
    
    // Load WebP if supported, fallback to original
    const supportsWebP = this.checkWebPSupport();
    const optimizedSrc = supportsWebP && src.includes('.jpg') 
      ? src.replace('.jpg', '.webp')
      : src;
    
    imageLoader.src = optimizedSrc;
  }
  
  private checkWebPSupport(): boolean {
    if (typeof document === 'undefined') return false;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  
  // Error Boundaries and Fallbacks
  private setupErrorBoundaries() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.toString() || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });
    
    // Network errors
    window.addEventListener('offline', () => {
      this.showOfflineMessage();
    });
    
    window.addEventListener('online', () => {
      this.hideOfflineMessage();
    });
  }
  
  private handleError(error: any) {
    const errorKey = `${error.type}-${error.message}`;
    
    // Avoid spam reporting the same error
    if (this.errorBoundaryData.has(errorKey)) {
      const existing = this.errorBoundaryData.get(errorKey);
      existing.count++;
      existing.lastOccurred = new Date();
    } else {
      this.errorBoundaryData.set(errorKey, {
        ...error,
        count: 1,
        firstOccurred: new Date(),
        lastOccurred: new Date()
      });
    }
    
    // Report to analytics
    this.reportError(error);
    
    // Show user-friendly error message for critical errors
    if (this.isCriticalError(error)) {
      this.showErrorFallback(error);
    }
  }
  
  private isCriticalError(error: any): boolean {
    const criticalPatterns = [
      'chunk load failed',
      'loading chunk',
      'network error',
      'failed to fetch'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message?.toLowerCase().includes(pattern)
    );
  }
  
  private showErrorFallback(error: any) {
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'error-fallback';
    fallbackElement.innerHTML = `
      <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <div class="text-center">
            <div class="text-6xl mb-4">😞</div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Algo salió mal</h2>
            <p class="text-gray-600 mb-4">Ocurrió un error inesperado. Por favor, intenta nuevamente.</p>
            <div class="space-y-2">
              <button onclick="window.location.reload()" 
                      class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Recargar Página
              </button>
              <button onclick="this.closest('.error-fallback').remove()" 
                      class="w-full text-gray-600 px-4 py-2 rounded hover:bg-gray-100">
                Continuar Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(fallbackElement);
  }
  
  private showOfflineMessage() {
    if (typeof document === 'undefined') return;

    const offlineElement = document.createElement('div');
    offlineElement.id = 'offline-message';
    offlineElement.innerHTML = `
      <div class="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50">
        <div class="flex items-center">
          <div class="text-xl mr-3">📡</div>
          <div>
            <div class="font-semibold">Sin conexión a internet</div>
            <div class="text-sm text-red-100">Algunas funciones pueden no estar disponibles</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(offlineElement);
  }
  
  private hideOfflineMessage() {
    if (typeof document === 'undefined') return;

    const offlineElement = document.getElementById('offline-message');
    if (offlineElement) {
      offlineElement.remove();
    }
  }
  
  // Performance Optimization Methods
  public enableLazyLoading(img: HTMLImageElement) {
    if (this.observer) {
      img.style.filter = 'blur(10px)';
      img.style.transition = 'filter 0.3s ease';
      this.observer.observe(img);
    }
  }
  
  public preloadImages(urls: string[]) {
    urls.forEach(url => {
      if (!this.imageCache.has(url)) {
        this.preloadQueue.push(url);
      }
    });
    
    this.processPreloadQueue();
  }
  
  private processPreloadQueue() {
    if (this.preloadQueue.length === 0) return;
    
    const url = this.preloadQueue.shift();
    if (!url) return;
    
    const img = new Image();
    img.onload = () => {
      this.imageCache.set(url, img);
      // Process next in queue after small delay
      setTimeout(() => this.processPreloadQueue(), 100);
    };
    img.onerror = () => {
      console.warn(`Failed to preload image: ${url}`);
      setTimeout(() => this.processPreloadQueue(), 100);
    };
    
    img.src = url;
  }
  
  public optimizeForMobile() {
    if (typeof window === 'undefined') return;

    // Reduce animations on slower devices
    if (this.isSlowDevice()) {
      document.documentElement.classList.add('reduce-motion');
    }
    
    // Optimize touch interactions
    this.optimizeTouchPerformance();
    
    // Reduce heavy operations on low-end devices
    this.adaptToDeviceCapabilities();
  }
  
  private isSlowDevice(): boolean {
    if (typeof navigator === 'undefined') return false;

    const connection = (navigator as any).connection;
    const slowConnection = connection && 
      (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    const lowMemory = (navigator as any).deviceMemory && 
      (navigator as any).deviceMemory < 4;
    
    const oldDevice = (navigator as any).hardwareConcurrency && 
      (navigator as any).hardwareConcurrency < 4;
    
    return slowConnection || lowMemory || oldDevice;
  }
  
  private optimizeTouchPerformance() {
    if (typeof document === 'undefined') return;

    // Add passive event listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    
    // Optimize tap delays
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  private adaptToDeviceCapabilities() {
    if (typeof document === 'undefined') return;

    if (this.isSlowDevice()) {
      // Disable heavy features
      document.documentElement.classList.add('low-performance');
      
      // Reduce image quality
      document.documentElement.style.setProperty('--image-quality', '0.8');
      
      // Simplify UI animations
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
  }
  
  // Analytics and Reporting
  private reportMetric(name: string, value: number) {
    // Report to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(value)
      });
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric - ${name}: ${value.toFixed(2)}ms`);
    }
  }
  
  private reportSlowResource(name: string, duration: number) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'slow_resource', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(duration)
      });
    }
  }
  
  private reportFailedResource(name: string) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'failed_resource', {
        event_category: 'Performance',
        event_label: name
      });
    }
  }
  
  private reportMemoryIssue(memoryUsage: any) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'memory_warning', {
        event_category: 'Performance',
        event_label: 'High Memory Usage',
        value: Math.round(memoryUsage.used)
      });
    }
  }
  
  private reportError(error: any) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: this.isCriticalError(error)
      });
    }
  }
  
  // Public API
  public getPerformanceMetrics() {
    return { ...this.metrics };
  }
  
  public getErrorSummary() {
    return Array.from(this.errorBoundaryData.entries()).map(([key, data]) => ({
      key,
      ...data
    }));
  }
  
  public markCriticalResourcesLoaded() {
    if (!this.criticalResourcesLoaded) {
      performance.mark('critical-resources-loaded');
      this.criticalResourcesLoaded = true;
      
      // Measure time to critical resources
      performance.measure(
        'time-to-critical-resources',
        'app-start',
        'critical-resources-loaded'
      );
      
      const measure = performance.getEntriesByName('time-to-critical-resources')[0];
      this.reportMetric('TTI', measure.duration);
    }
  }
  
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.imageCache.clear();
    this.preloadQueue.length = 0;
    this.errorBoundaryData.clear();
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService();
export default performanceOptimizationService;
