<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';

	// PWA state
	const pwaStatus = writable('initializing');
	const installPrompt = writable<any>(null);
	const updateAvailable = writable(false);
	const offlineMode = writable(false);
	const syncQueue = writable<any[]>([]);

	// PWA Manager
	class ProgressiveWebAppManager {
		private serviceWorker: ServiceWorkerRegistration | null = null;
		private deferredPrompt: any = null;
		private offlineBookingQueue: any[] = [];

		async initialize() {
			try {
				await this.registerServiceWorker();
				this.setupInstallPrompt();
				this.setupOfflineHandling();
				this.setupBackgroundSync();
				this.setupPushNotifications();
				this.monitorNetworkStatus();

				pwaStatus.set('ready');
				console.log('[PWA] Progressive Web App initialized');
			} catch (error) {
				console.error('[PWA] Initialization failed:', error);
				pwaStatus.set('error');
			}
		}

		private async registerServiceWorker() {
			if ('serviceWorker' in navigator) {
				try {
					this.serviceWorker = await navigator.serviceWorker.register('/service-worker.js', {
						scope: '/',
						updateViaCache: 'none'
					});

					// Listen for service worker updates
					this.serviceWorker.addEventListener('updatefound', () => {
						const newWorker = this.serviceWorker!.installing;
						if (newWorker) {
							newWorker.addEventListener('statechange', () => {
								if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
									updateAvailable.set(true);
								}
							});
						}
					});

					// Listen for service worker messages
					navigator.serviceWorker.addEventListener('message', (event) => {
						this.handleServiceWorkerMessage(event.data);
					});

					console.log('[PWA] Service Worker registered successfully');
				} catch (error) {
					console.error('[PWA] Service Worker registration failed:', error);
				}
			}
		}

		private setupInstallPrompt() {
			window.addEventListener('beforeinstallprompt', (event) => {
				event.preventDefault();
				this.deferredPrompt = event;
				installPrompt.set(event);
				console.log('[PWA] Install prompt available');
			});

			window.addEventListener('appinstalled', () => {
				this.deferredPrompt = null;
				installPrompt.set(null);
				console.log('[PWA] App installed successfully');

				// Track installation
				this.trackEvent('app_installed');
			});
		}

		private setupOfflineHandling() {
			// Monitor online/offline status
			window.addEventListener('online', () => {
				offlineMode.set(false);
				this.processOfflineQueue();
				console.log('[PWA] Back online, processing queued actions');
			});

			window.addEventListener('offline', () => {
				offlineMode.set(true);
				console.log('[PWA] Offline mode activated');
			});

			// Initial status
			offlineMode.set(!navigator.onLine);
		}

		private setupBackgroundSync() {
			if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
				navigator.serviceWorker.ready.then((registration) => {
					// Register sync for offline booking queue
					registration.sync.register('booking-sync');
					registration.sync.register('analytics-sync');
					console.log('[PWA] Background sync registered');
				});
			}
		}

		private async setupPushNotifications() {
			if ('Notification' in window && 'serviceWorker' in navigator) {
				try {
					const permission = await Notification.requestPermission();
					if (permission === 'granted') {
						await this.subscribeToPush();
						console.log('[PWA] Push notifications enabled');
					}
				} catch (error) {
					console.error('[PWA] Push notification setup failed:', error);
				}
			}
		}

		private async subscribeToPush() {
			try {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: this.urlBase64ToUint8Array(
						'BCxOkgWfr1z6gIjJy4e9d8-qZJDCrEJBBfEJAK6FHrn6GBZ8N-o6QZ8i4ZsX7f-c5fqMBjkJlFzYI1T9J4KjHrGa'
					)
				});

				// Send subscription to server
				await fetch('/api/push-subscriptions', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(subscription)
				});

				console.log('[PWA] Push subscription created');
			} catch (error) {
				console.error('[PWA] Push subscription failed:', error);
			}
		}

		private monitorNetworkStatus() {
			if ('connection' in navigator) {
				const connection = (navigator as any).connection;

				const updateConnectionInfo = () => {
					const connectionInfo = {
						effectiveType: connection.effectiveType,
						downlink: connection.downlink,
						saveData: connection.saveData
					};

					// Adjust app behavior based on connection
					if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
						this.enableDataSaverMode();
					} else {
						this.disableDataSaverMode();
					}

					console.log('[PWA] Network status updated:', connectionInfo);
				};

				connection.addEventListener('change', updateConnectionInfo);
				updateConnectionInfo(); // Initial check
			}
		}

		private handleServiceWorkerMessage(message: any) {
			switch (message.type) {
				case 'CACHE_UPDATED':
					console.log('[PWA] Cache updated:', message.url);
					break;

				case 'OFFLINE_FALLBACK':
					console.log('[PWA] Serving offline fallback');
					break;

				case 'BACKGROUND_SYNC_SUCCESS':
					console.log('[PWA] Background sync completed');
					this.processBackgroundSyncResult(message.data);
					break;

				case 'PUSH_RECEIVED':
					this.handlePushNotification(message.data);
					break;

				default:
					console.log('[PWA] Unknown service worker message:', message);
			}
		}

		// Public API
		async installApp() {
			if (this.deferredPrompt) {
				try {
					this.deferredPrompt.prompt();
					const choiceResult = await this.deferredPrompt.userChoice;

					if (choiceResult.outcome === 'accepted') {
						console.log('[PWA] User accepted install prompt');
						this.trackEvent('install_accepted');
					} else {
						console.log('[PWA] User dismissed install prompt');
						this.trackEvent('install_dismissed');
					}

					this.deferredPrompt = null;
					installPrompt.set(null);
				} catch (error) {
					console.error('[PWA] Install prompt failed:', error);
				}
			}
		}

		async updateApp() {
			if (this.serviceWorker && this.serviceWorker.waiting) {
				this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
			}
		}

		// Offline functionality
		async queueBooking(bookingData: any) {
			const queueItem = {
				id: `booking_${Date.now()}`,
				type: 'booking',
				data: bookingData,
				timestamp: Date.now(),
				retries: 0
			};

			this.offlineBookingQueue.push(queueItem);
			syncQueue.update(queue => [...queue, queueItem]);

			// Store in IndexedDB for persistence
			await this.storeInOfflineDB('booking_queue', queueItem);

			console.log('[PWA] Booking queued for offline sync');
		}

		private async processOfflineQueue() {
			const queue = [...this.offlineBookingQueue];
			this.offlineBookingQueue = [];

			for (const item of queue) {
				try {
					await this.syncQueueItem(item);
					await this.removeFromOfflineDB('booking_queue', item.id);
				} catch (error) {
					console.error('[PWA] Failed to sync queue item:', error);

					// Retry logic
					if (item.retries < 3) {
						item.retries++;
						this.offlineBookingQueue.push(item);
					} else {
						console.error('[PWA] Max retries reached for queue item:', item.id);
					}
				}
			}

			syncQueue.set(this.offlineBookingQueue);
		}

		private async syncQueueItem(item: any) {
			switch (item.type) {
				case 'booking':
					await fetch('/api/bookings', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(item.data)
					});
					break;

				default:
					console.warn('[PWA] Unknown queue item type:', item.type);
			}
		}

		private async storeInOfflineDB(store: string, data: any) {
			try {
				const request = indexedDB.open('BarberProOffline', 1);

				request.onupgradeneeded = (event) => {
					const db = (event.target as any).result;
					if (!db.objectStoreNames.contains(store)) {
						db.createObjectStore(store, { keyPath: 'id' });
					}
				};

				request.onsuccess = (event) => {
					const db = (event.target as any).result;
					const transaction = db.transaction([store], 'readwrite');
					const objectStore = transaction.objectStore(store);
					objectStore.put(data);
				};
			} catch (error) {
				console.error('[PWA] Failed to store in offline DB:', error);
			}
		}

		private async removeFromOfflineDB(store: string, id: string) {
			try {
				const request = indexedDB.open('BarberProOffline', 1);

				request.onsuccess = (event) => {
					const db = (event.target as any).result;
					const transaction = db.transaction([store], 'readwrite');
					const objectStore = transaction.objectStore(store);
					objectStore.delete(id);
				};
			} catch (error) {
				console.error('[PWA] Failed to remove from offline DB:', error);
			}
		}

		// Performance optimizations
		private enableDataSaverMode() {
			document.documentElement.classList.add('data-saver-mode');
			console.log('[PWA] Data saver mode enabled');
		}

		private disableDataSaverMode() {
			document.documentElement.classList.remove('data-saver-mode');
			console.log('[PWA] Data saver mode disabled');
		}

		private processBackgroundSyncResult(data: any) {
			// Handle successful background sync
			syncQueue.update(queue =>
				queue.filter(item => !data.completedItems.includes(item.id))
			);
		}

		private handlePushNotification(data: any) {
			// Handle incoming push notifications
			console.log('[PWA] Push notification received:', data);
		}

		// Utility functions
		private urlBase64ToUint8Array(base64String: string) {
			const padding = '='.repeat((4 - base64String.length % 4) % 4);
			const base64 = (base64String + padding)
				.replace(/\-/g, '+')
				.replace(/_/g, '/');

			const rawData = window.atob(base64);
			const outputArray = new Uint8Array(rawData.length);

			for (let i = 0; i < rawData.length; ++i) {
				outputArray[i] = rawData.charCodeAt(i);
			}
			return outputArray;
		}

		private trackEvent(event: string, data?: any) {
			// Send analytics event
			if ('gtag' in window) {
				(window as any).gtag('event', event, data);
			}
		}
	}

	let pwaManager: ProgressiveWebAppManager;

	// Component API for other components to use
	export function getPWAManager(): ProgressiveWebAppManager {
		return pwaManager;
	}

	export async function queueOfflineBooking(bookingData: any) {
		if (pwaManager) {
			await pwaManager.queueBooking(bookingData);
		}
	}

	onMount(() => {
		if (browser) {
			pwaManager = new ProgressiveWebAppManager();
			pwaManager.initialize();
		}
	});
</script>

<!-- Install Prompt -->
{#if $installPrompt}
	<div class="install-prompt fixed bottom-0 left-0 right-0 bg-brand text-white p-4 shadow-lg z-50 transform translate-y-0 transition-transform">
		<div class="flex items-center justify-between max-w-md mx-auto">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
				</div>
				<div>
					<div class="font-semibold">Instalar BarberPro</div>
					<div class="text-sm text-white/80">Acceso rápido y funciones offline</div>
				</div>
			</div>
			<div class="flex items-center space-x-2">
				<button
					class="text-sm px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
					on:click={() => installPrompt.set(null)}
				>
					Después
				</button>
				<button
					class="text-sm px-3 py-2 bg-white text-brand font-medium rounded-lg hover:bg-white/90 transition-colors"
					on:click={() => pwaManager.installApp()}
				>
					Instalar
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Update Available Notification -->
{#if $updateAvailable}
	<div class="update-notification fixed top-4 right-4 bg-white rounded-xl shadow-lg border border-neutral-200 p-4 z-50 max-w-sm">
		<div class="flex items-start space-x-3">
			<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
				<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
			</div>
			<div class="flex-1">
				<h4 class="font-semibold text-neutral-800">Actualización disponible</h4>
				<p class="text-sm text-neutral-600 mb-3">
					Nueva versión con mejoras y nuevas funciones.
				</p>
				<div class="flex space-x-2">
					<button
						class="text-sm px-3 py-1 text-neutral-600 hover:text-neutral-800 transition-colors"
						on:click={() => updateAvailable.set(false)}
					>
						Después
					</button>
					<button
						class="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
						on:click={() => pwaManager.updateApp()}
					>
						Actualizar
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Offline Indicator -->
{#if $offlineMode}
	<div class="offline-indicator fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm font-medium z-40">
		<div class="flex items-center justify-center space-x-2">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
			</svg>
			<span>Sin conexión - Modo offline activado</span>
			{#if $syncQueue.length > 0}
				<span class="bg-white/20 px-2 py-1 rounded-full text-xs">
					{$syncQueue.length} pendientes
				</span>
			{/if}
		</div>
	</div>
{/if}

<!-- Sync Queue Status (Development only) -->
{#if browser && import.meta.env.DEV && $syncQueue.length > 0}
	<div class="sync-queue-status fixed bottom-20 right-4 bg-white rounded-lg shadow-lg border border-neutral-200 p-3 text-xs z-50">
		<div class="flex items-center space-x-2 mb-2">
			<div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
			<span class="font-medium text-neutral-700">Cola de Sincronización</span>
		</div>
		<div class="space-y-1 text-neutral-600">
			{#each $syncQueue.slice(0, 3) as item}
				<div class="flex justify-between">
					<span>{item.type}</span>
					<span class="text-neutral-400">x{item.retries}</span>
				</div>
			{/each}
			{#if $syncQueue.length > 3}
				<div class="text-neutral-400">+{$syncQueue.length - 3} más</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.install-prompt {
		animation: slideUp 0.3s ease-out;
	}

	.update-notification {
		animation: slideInFromRight 0.3s ease-out;
	}

	.offline-indicator {
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes slideInFromRight {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* Data saver mode optimizations */
	:global(.data-saver-mode) {
		/* Reduce animations */
		* {
			animation-duration: 0s !important;
			transition-duration: 0s !important;
		}

		/* Hide non-essential images */
		.non-essential-image {
			display: none;
		}

		/* Simplify shadows and effects */
		.shadow-lg,
		.shadow-md,
		.shadow-sm {
			box-shadow: none !important;
		}
	}

	@media (max-width: 768px) {
		.install-prompt {
			padding: 1rem;
		}

		.update-notification {
			top: 1rem;
			right: 1rem;
			left: 1rem;
			max-width: none;
		}
	}
</style>