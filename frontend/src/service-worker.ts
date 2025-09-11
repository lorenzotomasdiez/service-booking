// Enhanced Service Worker for BarberPro PWA
// Provides offline-first capabilities and background sync

import { build, files, version } from '$service-worker';

const CACHE_NAME = `barberpro-cache-${version}`;
const API_CACHE = `barberpro-api-cache-${version}`;
const STATIC_CACHE = `barberpro-static-cache-${version}`;

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  ...build, // App shell
  ...files, // Static files
  '/offline',
  '/manifest.json'
];

// API endpoints that can be cached
const CACHEABLE_APIS = [
  '/api/providers',
  '/api/services',
  '/api/bookings',
  '/api/notifications'
];

// Background sync tags
const SYNC_TAGS = {
  BOOKING_CREATE: 'booking-create',
  BOOKING_UPDATE: 'booking-update',
  NOTIFICATION_READ: 'notification-read'
};

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker version:', version);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE && 
                cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle network requests with cache strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Static assets - Cache first
    event.respondWith(handleStaticRequest(request));
  } else if (url.pathname === '/' || url.pathname.startsWith('/dashboard/')) {
    // App shell - Cache with network update
    event.respondWith(handleAppShellRequest(request));
  } else {
    // Default - Network first
    event.respondWith(handleDefaultRequest(request));
  }
});

// Handle API requests - Network first with cache fallback
async function handleAPIRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIs.some(api => url.pathname.startsWith(api));
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses for cacheable APIs
    if (networkResponse.ok && isCacheable) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Try cache fallback
    if (isCacheable) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline page for failed API requests
    return createOfflineResponse();
  }
}

// Handle static asset requests - Cache first
async function handleStaticRequest(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle app shell requests - Cache with network update
async function handleAppShellRequest(request: Request): Promise<Response> {
  const cachedResponse = await caches.match('/');
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
        }
      })
      .catch(() => {}); // Ignore network errors
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return offline page
    return new Response(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sin conexión - BarberPro</title>
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 2rem; }
          .offline-container { max-width: 400px; margin: 0 auto; }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #dc2626; margin-bottom: 1rem; }
          p { color: #6b7280; margin-bottom: 2rem; }
          button { background: #10b981; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="icon">📱</div>
          <h1>Sin conexión a Internet</h1>
          <p>No hay conexión disponible. Verifica tu conexión a Internet y vuelve a intentar.</p>
          <button onclick="window.location.reload()">Reintentar</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    });
  }
}

// Handle default requests - Network first
async function handleDefaultRequest(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    return createOfflineResponse();
  }
}

// Create offline response
function createOfflineResponse(): Response {
  return new Response(
    JSON.stringify({ 
      error: 'No hay conexión a Internet', 
      offline: true 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.BOOKING_CREATE:
      event.waitUntil(syncOfflineBookings());
      break;
    case SYNC_TAGS.BOOKING_UPDATE:
      event.waitUntil(syncBookingUpdates());
      break;
    case SYNC_TAGS.NOTIFICATION_READ:
      event.waitUntil(syncNotificationReads());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Sync offline bookings
async function syncOfflineBookings() {
  try {
    const offlineBookings = await getStoredOfflineData('offline-bookings');
    
    for (const booking of offlineBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await removeStoredOfflineData('offline-bookings', booking.id);
          console.log('[SW] Synced offline booking:', booking.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync offline bookings:', error);
  }
}

// Sync booking updates
async function syncBookingUpdates() {
  try {
    const updates = await getStoredOfflineData('offline-booking-updates');
    
    for (const update of updates) {
      try {
        const response = await fetch(`/api/bookings/${update.bookingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removeStoredOfflineData('offline-booking-updates', update.id);
          console.log('[SW] Synced booking update:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync booking update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync booking updates:', error);
  }
}

// Sync notification reads
async function syncNotificationReads() {
  try {
    const reads = await getStoredOfflineData('offline-notification-reads');
    
    for (const read of reads) {
      try {
        const response = await fetch(`/api/notifications/${read.notificationId}/read`, {
          method: 'POST'
        });
        
        if (response.ok) {
          await removeStoredOfflineData('offline-notification-reads', read.id);
          console.log('[SW] Synced notification read:', read.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync notification read:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync notification reads:', error);
  }
}

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] Push message received');
  
  let notificationData = {
    title: 'BarberPro',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {},
    actions: []
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.data?.urgent || false,
      tag: notificationData.data?.tag || 'default'
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  const data = event.notification.data;
  let urlToOpen = '/dashboard';
  
  if (data?.url) {
    urlToOpen = data.url;
  } else if (data?.type === 'booking') {
    urlToOpen = `/dashboard/bookings/${data.bookingId}`;
  } else if (data?.type === 'notification') {
    urlToOpen = '/dashboard/notifications';
  }
  
  event.waitUntil(
    self.clients.matchAll().then((clientList) => {
      // Try to focus existing client
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Utility functions for offline storage
async function getStoredOfflineData(store: string): Promise<any[]> {
  // In a real implementation, this would use IndexedDB
  // For now, return empty array
  return [];
}

async function removeStoredOfflineData(store: string, id: string): Promise<void> {
  // In a real implementation, this would remove from IndexedDB
  console.log(`[SW] Would remove ${id} from ${store}`);
}

// Message handling for communication with main app
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data?.type === 'CACHE_URLS') {
    // Cache specific URLs on demand
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Types for TypeScript
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response>): void;
}

interface SyncEvent extends ExtendableEvent {
  tag: string;
}

interface PushEvent extends ExtendableEvent {
  data: PushMessageData | null;
}

interface NotificationEvent extends ExtendableEvent {
  notification: Notification;
  action?: string;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  data: any;
  source: Client | ServiceWorker | MessagePort;
}