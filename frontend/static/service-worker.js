// BarberPro Service Worker - Day 8 Advanced PWA Features
// Version 2.0 - Enhanced offline functionality and Argentina mobile optimization

const CACHE_NAME = 'barberpro-v2.0.0';
const OFFLINE_CACHE = 'barberpro-offline-v2.0.0';
const DYNAMIC_CACHE = 'barberpro-dynamic-v2.0.0';
const IMAGE_CACHE = 'barberpro-images-v2.0.0';

// Argentina-specific optimization for mobile networks
const NETWORK_TIMEOUT = 3000; // 3s timeout for Argentina mobile networks
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Resources to cache immediately for offline functionality
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/providers',
  '/api/services',
  '/api/auth/profile'
];

// Resources to cache with stale-while-revalidate strategy
const DYNAMIC_RESOURCES = [
  '/api/bookings',
  '/api/notifications',
  '/api/reviews'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker for Argentina mobile optimization');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets for offline access');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different resource types with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with fallback to cache
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - cache first with network fallback
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/_app/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // App assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // Pages - network first with offline fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Network-first strategy for API requests (for real-time data)
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Cache successful responses for offline access
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add header to indicate cached response
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker-Cache');
      return response;
    }
    
    // Return offline response for critical API endpoints
    if (url.pathname.includes('/bookings') || url.pathname.includes('/profile')) {
      return new Response(JSON.stringify({
        error: 'Offline mode - data not available',
        offline: true,
        message: 'Esta función requiere conexión a internet'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker-Offline'
        }
      });
    }
    
    throw error;
  }
}

// Cache-first strategy for images (optimize for Argentina mobile data usage)
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache immediately
    fetchAndUpdateCache(request, cache); // Update cache in background
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the new image
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="16">Imagen no disponible</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'X-Served-By': 'ServiceWorker-Placeholder'
        }
      }
    );
  }
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Network-first strategy for pages with offline fallback
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for page request, trying cache');
    
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page as last resort
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline HTML
    return new Response(`
      <!DOCTYPE html>
      <html lang="es-AR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Sin conexión - BarberPro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f9fafb;
            color: #374151;
            text-align: center;
            padding: 2rem;
          }
          .icon {
            width: 64px;
            height: 64px;
            margin-bottom: 1rem;
            opacity: 0.6;
          }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #111827;
          }
          p {
            margin-bottom: 1.5rem;
            color: #6b7280;
            max-width: 400px;
            line-height: 1.5;
          }
          button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover {
            background: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <div class="icon">📱</div>
        <h1>Sin conexión a internet</h1>
        <p>
          No se puede conectar a BarberPro en este momento. 
          Verifica tu conexión a internet e intenta nuevamente.
        </p>
        <button onclick="window.location.reload()">
          Intentar nuevamente
        </button>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }
}

// Background cache update function
async function fetchAndUpdateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
    console.log('[SW] Background cache update failed:', request.url);
  }
}

// Handle background sync for offline booking queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'booking-sync') {
    console.log('[SW] Background sync: processing offline bookings');
    event.waitUntil(processOfflineBookings());
  }
});

// Process offline bookings when connection is restored
async function processOfflineBookings() {
  try {
    // Get offline bookings from IndexedDB (would be implemented in app)
    const offlineBookings = await getOfflineBookings();
    
    for (const booking of offlineBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(booking)
        });
        
        if (response.ok) {
          await removeOfflineBooking(booking.id);
          console.log('[SW] Offline booking synced:', booking.id);
        }
      } catch (error) {
        console.log('[SW] Failed to sync booking:', booking.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error);
  }
}

// Placeholder functions for offline booking management
async function getOfflineBookings() {
  // Would integrate with IndexedDB in real implementation
  return [];
}

async function removeOfflineBooking(bookingId) {
  // Would remove from IndexedDB in real implementation
  console.log('[SW] Removing offline booking:', bookingId);
}

// Handle push notifications for booking updates
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  console.log('[SW] Push notification received:', data);
  
  const options = {
    body: data.message || 'Nueva notificación de BarberPro',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ],
    requireInteraction: false,
    tag: data.type || 'barberpro-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'BarberPro', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app to the relevant page
    const data = event.notification.data;
    const urlToOpen = data.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // Try to find an existing client
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Open new window if no existing client
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_CACHE_STATUS') {
    // Return cache status for performance monitoring
    event.ports[0].postMessage({
      caches: {
        static: STATIC_CACHE,
        dynamic: DYNAMIC_CACHE,
        images: IMAGE_CACHE
      }
    });
  }
});

console.log('[SW] Service worker loaded - Argentina mobile optimized');