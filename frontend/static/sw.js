// Service Worker for BarberPro - Optimized for Argentina Mobile Users
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `barberpro-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Core application files - Cache First (long-term caching)
  core: [
    '/',
    '/manifest.json',
    '/offline',
    // Add main JS/CSS bundles here when known
  ],
  
  // API responses - Network First with fallback
  api: [
    '/api/auth/',
    '/api/bookings/',
    '/api/services/',
    '/api/providers/',
    '/api/payments/'
  ],
  
  // Static assets - Cache First with updates
  assets: [
    '/icons/',
    '/images/',
    '/screenshots/',
    '/_app/immutable/'
  ],
  
  // Argentina-specific content - prioritized caching
  argentina: [
    '/api/locations/argentina',
    '/api/services/popular-argentina',
    '/api/providers/argentina'
  ]
};

// Install event - cache core files
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache core files immediately
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(CACHE_STRATEGIES.core);
      }),
      
      // Preload Argentina-specific data
      preloadArgentinaData(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }
  
  // Determine strategy based on request type
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isAssetRequest(url)) {
    event.respondWith(handleAssetRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Default: network first with cache fallback
    event.respondWith(handleDefaultRequest(request));
  }
});

// Background sync for offline bookings
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'booking-sync') {
    event.waitUntil(syncOfflineBookings());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Push notifications for booking reminders
self.addEventListener('push', event => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'Recordatorio: Tu reserva es en 1 hora',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard/client/bookings'
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Reserva',
        icon: '/icons/action-view.png'
      },
      {
        action: 'cancel',
        title: 'Cancelar',
        icon: '/icons/action-cancel.png'
      }
    ],
    lang: 'es-AR',
    tag: 'booking-reminder'
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('BarberPro', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  let url = event.notification.data?.url || '/';
  
  if (event.action === 'view') {
    url = event.notification.data?.bookingUrl || '/dashboard/client/bookings';
  } else if (event.action === 'cancel') {
    // Handle cancellation
    url = `/booking/cancel/${event.notification.data?.bookingId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Request handlers
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Try network first for API requests
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for booking/payment failures
    if (url.pathname.includes('/bookings') || url.pathname.includes('/payments')) {
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: 'No tienes conexión. Tu reserva se procesará cuando vuelvas a estar online.',
          queued: true
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

async function handleAssetRequest(request) {
  // Cache first for assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch and cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder for failed images
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".35em" font-family="Arial" font-size="14" fill="#9ca3af">Imagen no disponible</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful page loads
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Navigation request failed, trying cache');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

async function handleDefaultRequest(request) {
  // Network first with cache fallback
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Utility functions
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isAssetRequest(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|ico)$/) ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/images/') ||
         url.pathname.startsWith('/_app/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

async function preloadArgentinaData() {
  console.log('[SW] Preloading Argentina-specific data');
  
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Preload popular services in Argentina
    await cache.add('/api/services/popular?country=AR');
    
    // Preload Argentina locations data
    await cache.add('/api/locations/argentina');
    
    console.log('[SW] Argentina data preloaded successfully');
  } catch (error) {
    console.warn('[SW] Failed to preload Argentina data:', error);
  }
}

async function syncOfflineBookings() {
  console.log('[SW] Syncing offline bookings');
  
  try {
    // Get queued bookings from IndexedDB
    const queuedBookings = await getQueuedBookings();
    
    for (const booking of queuedBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${booking.token}`
          },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await removeQueuedBooking(booking.id);
          
          // Show success notification
          self.registration.showNotification('BarberPro', {
            body: '¡Tu reserva offline fue procesada exitosamente!',
            icon: '/icons/icon-192x192.png',
            tag: 'booking-success'
          });
        }
      } catch (error) {
        console.warn('[SW] Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Offline booking sync failed:', error);
  }
}

async function syncAnalyticsData() {
  console.log('[SW] Syncing analytics data');
  
  try {
    const analyticsData = await getQueuedAnalytics();
    
    if (analyticsData.length > 0) {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsData)
      });
      
      await clearQueuedAnalytics();
    }
  } catch (error) {
    console.warn('[SW] Analytics sync failed:', error);
  }
}

// IndexedDB helpers (simplified - would use a proper DB library in production)
async function getQueuedBookings() {
  // Return queued bookings from IndexedDB
  return [];
}

async function removeQueuedBooking(id) {
  // Remove booking from IndexedDB
}

async function getQueuedAnalytics() {
  // Return queued analytics from IndexedDB
  return [];
}

async function clearQueuedAnalytics() {
  // Clear analytics queue
}

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'QUEUE_BOOKING') {
    // Queue booking for offline sync
    queueBookingForSync(event.data.booking);
  } else if (event.data.type === 'QUEUE_ANALYTICS') {
    // Queue analytics for sync
    queueAnalyticsForSync(event.data.analytics);
  } else if (event.data.type === 'GET_VERSION') {
    // Return service worker version
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

async function queueBookingForSync(booking) {
  // Store booking in IndexedDB for background sync
  console.log('[SW] Queuing booking for sync:', booking);
  
  // Request background sync
  try {
    await self.registration.sync.register('booking-sync');
  } catch (error) {
    console.warn('[SW] Background sync not supported');
  }
}

async function queueAnalyticsForSync(analytics) {
  // Store analytics in IndexedDB for background sync
  console.log('[SW] Queuing analytics for sync');
  
  try {
    await self.registration.sync.register('analytics-sync');
  } catch (error) {
    console.warn('[SW] Background sync not supported');
  }
}

// Performance monitoring
self.addEventListener('fetch', event => {
  // Track fetch performance
  const startTime = performance.now();
  
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log slow requests (Argentina mobile optimization)
        if (duration > 3000) {
          console.warn(`[SW] Slow request detected: ${event.request.url} took ${duration.toFixed(0)}ms`);
        }
        
        return response;
      } catch (error) {
        console.error(`[SW] Fetch failed: ${event.request.url}`, error);
        throw error;
      }
    })()
  );
});

console.log('[SW] Service Worker initialized for Argentina mobile users');