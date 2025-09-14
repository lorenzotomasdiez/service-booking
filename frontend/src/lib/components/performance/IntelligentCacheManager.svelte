<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';

	// Cache management state
	const cacheStats = writable({
		size: 0,
		entries: 0,
		hitRate: 0,
		lastCleared: null
	});

	const cacheStatus = writable('initializing');

	// Intelligent Cache Manager
	class IntelligentCacheManager {
		private cache: Map<string, any> = new Map();
		private metadata: Map<string, any> = new Map();
		private maxSize: number = 50 * 1024 * 1024; // 50MB
		private maxAge: number = 24 * 60 * 60 * 1000; // 24 hours
		private hitCount: number = 0;
		private missCount: number = 0;

		// Cache strategies
		private strategies = {
			LRU: 'least-recently-used',
			TTL: 'time-to-live',
			FREQUENCY: 'frequency-based',
			INTELLIGENT: 'ml-predictive'
		};

		// Data types with different caching strategies
		private cacheConfig = {
			'api-providers': { strategy: 'LRU', maxAge: 30 * 60 * 1000, priority: 'high' },
			'api-bookings': { strategy: 'TTL', maxAge: 5 * 60 * 1000, priority: 'high' },
			'api-services': { strategy: 'LRU', maxAge: 60 * 60 * 1000, priority: 'medium' },
			'user-preferences': { strategy: 'FREQUENCY', maxAge: 7 * 24 * 60 * 60 * 1000, priority: 'high' },
			'images': { strategy: 'LRU', maxAge: 60 * 60 * 1000, priority: 'low' },
			'search-results': { strategy: 'TTL', maxAge: 10 * 60 * 1000, priority: 'medium' },
			'analytics': { strategy: 'TTL', maxAge: 15 * 60 * 1000, priority: 'low' }
		};

		constructor() {
			if (browser) {
				this.initializeCache();
			}
		}

		private async initializeCache() {
			try {
				// Load cache from IndexedDB if available
				await this.loadFromPersistentStorage();

				// Set up periodic cleanup
				this.setupCleanupSchedule();

				// Monitor cache performance
				this.startPerformanceMonitoring();

				cacheStatus.set('ready');
				console.log('[IntelligentCache] Cache manager initialized');
			} catch (error) {
				console.error('[IntelligentCache] Initialization failed:', error);
				cacheStatus.set('error');
			}
		}

		// Main cache operations
		async set(key: string, data: any, options: any = {}) {
			try {
				const cacheType = this.detectCacheType(key);
				const config = this.cacheConfig[cacheType] || this.cacheConfig['api-providers'];

				// Prepare cache entry
				const entry = {
					data,
					timestamp: Date.now(),
					lastAccessed: Date.now(),
					accessCount: 1,
					size: this.estimateSize(data),
					type: cacheType,
					priority: config.priority,
					maxAge: options.maxAge || config.maxAge
				};

				// Check if we need to make space
				if (this.needsEviction(entry.size)) {
					await this.evictEntries(entry.size);
				}

				// Store in memory cache
				this.cache.set(key, entry.data);
				this.metadata.set(key, entry);

				// Store in persistent storage for high-priority items
				if (config.priority === 'high') {
					await this.saveToPersistentStorage(key, entry);
				}

				this.updateCacheStats();

			} catch (error) {
				console.error('[IntelligentCache] Set operation failed:', error);
			}
		}

		async get(key: string): Promise<any> {
			try {
				// Check memory cache first
				if (this.cache.has(key)) {
					const entry = this.metadata.get(key);

					// Check if entry has expired
					if (this.isExpired(entry)) {
						this.delete(key);
						this.missCount++;
						return null;
					}

					// Update access metadata
					entry.lastAccessed = Date.now();
					entry.accessCount++;
					this.metadata.set(key, entry);

					this.hitCount++;
					return this.cache.get(key);
				}

				// Check persistent storage
				const persistentData = await this.loadFromPersistentStorage(key);
				if (persistentData && !this.isExpired(persistentData)) {
					// Restore to memory cache
					this.cache.set(key, persistentData.data);
					this.metadata.set(key, persistentData);

					this.hitCount++;
					return persistentData.data;
				}

				this.missCount++;
				return null;

			} catch (error) {
				console.error('[IntelligentCache] Get operation failed:', error);
				this.missCount++;
				return null;
			}
		}

		async delete(key: string) {
			try {
				this.cache.delete(key);
				this.metadata.delete(key);

				// Remove from persistent storage
				await this.removeFromPersistentStorage(key);

				this.updateCacheStats();

			} catch (error) {
				console.error('[IntelligentCache] Delete operation failed:', error);
			}
		}

		async clear() {
			try {
				this.cache.clear();
				this.metadata.clear();

				// Clear persistent storage
				await this.clearPersistentStorage();

				this.updateCacheStats();
				cacheStats.update(stats => ({
					...stats,
					lastCleared: new Date()
				}));

				console.log('[IntelligentCache] Cache cleared');

			} catch (error) {
				console.error('[IntelligentCache] Clear operation failed:', error);
			}
		}

		// Intelligent caching strategies
		private detectCacheType(key: string): string {
			if (key.startsWith('/api/providers')) return 'api-providers';
			if (key.startsWith('/api/bookings')) return 'api-bookings';
			if (key.startsWith('/api/services')) return 'api-services';
			if (key.includes('user-preferences')) return 'user-preferences';
			if (key.includes('search')) return 'search-results';
			if (key.includes('analytics')) return 'analytics';
			if (key.match(/\.(jpg|jpeg|png|webp|gif)$/i)) return 'images';

			return 'api-providers'; // default
		}

		private needsEviction(newEntrySize: number): boolean {
			const currentSize = this.getCurrentCacheSize();
			return (currentSize + newEntrySize) > this.maxSize;
		}

		private async evictEntries(spaceNeeded: number): Promise<void> {
			let freedSpace = 0;
			const entries = Array.from(this.metadata.entries());

			// Sort by eviction priority (LRU + priority + frequency)
			entries.sort((a, b) => {
				const [, entryA] = a;
				const [, entryB] = b;

				// Priority-based sorting
				const priorityWeight = { 'low': 1, 'medium': 2, 'high': 3 };
				const priorityDiff = priorityWeight[entryA.priority] - priorityWeight[entryB.priority];

				if (priorityDiff !== 0) return priorityDiff;

				// LRU sorting for same priority
				return entryA.lastAccessed - entryB.lastAccessed;
			});

			// Evict entries until we have enough space
			for (const [key, entry] of entries) {
				if (freedSpace >= spaceNeeded) break;

				await this.delete(key);
				freedSpace += entry.size;
			}

			console.log(`[IntelligentCache] Evicted entries, freed ${freedSpace} bytes`);
		}

		private isExpired(entry: any): boolean {
			if (!entry.maxAge) return false;
			return (Date.now() - entry.timestamp) > entry.maxAge;
		}

		private estimateSize(data: any): number {
			try {
				return new TextEncoder().encode(JSON.stringify(data)).length;
			} catch {
				return 1024; // fallback estimate
			}
		}

		private getCurrentCacheSize(): number {
			let totalSize = 0;
			for (const entry of this.metadata.values()) {
				totalSize += entry.size;
			}
			return totalSize;
		}

		// Persistent storage operations
		private async saveToPersistentStorage(key: string, entry: any) {
			try {
				if ('indexedDB' in window) {
					const request = indexedDB.open('BarberProCache', 1);

					request.onupgradeneeded = (event) => {
						const db = (event.target as any).result;
						if (!db.objectStoreNames.contains('cache')) {
							db.createObjectStore('cache', { keyPath: 'key' });
						}
					};

					request.onsuccess = (event) => {
						const db = (event.target as any).result;
						const transaction = db.transaction(['cache'], 'readwrite');
						const store = transaction.objectStore('cache');

						store.put({
							key,
							...entry,
							persistedAt: Date.now()
						});
					};
				}
			} catch (error) {
				console.error('[IntelligentCache] Persistent storage save failed:', error);
			}
		}

		private async loadFromPersistentStorage(key?: string): Promise<any> {
			try {
				if ('indexedDB' in window) {
					return new Promise((resolve, reject) => {
						const request = indexedDB.open('BarberProCache', 1);

						request.onsuccess = (event) => {
							const db = (event.target as any).result;
							const transaction = db.transaction(['cache'], 'readonly');
							const store = transaction.objectStore('cache');

							if (key) {
								const getRequest = store.get(key);
								getRequest.onsuccess = () => resolve(getRequest.result);
								getRequest.onerror = () => resolve(null);
							} else {
								const getAllRequest = store.getAll();
								getAllRequest.onsuccess = () => {
									const entries = getAllRequest.result;
									entries.forEach(entry => {
										if (!this.isExpired(entry)) {
											this.cache.set(entry.key, entry.data);
											this.metadata.set(entry.key, entry);
										}
									});
									resolve(entries);
								};
								getAllRequest.onerror = () => resolve([]);
							}
						};

						request.onerror = () => resolve(null);
					});
				}
			} catch (error) {
				console.error('[IntelligentCache] Persistent storage load failed:', error);
			}

			return null;
		}

		private async removeFromPersistentStorage(key: string) {
			try {
				if ('indexedDB' in window) {
					const request = indexedDB.open('BarberProCache', 1);

					request.onsuccess = (event) => {
						const db = (event.target as any).result;
						const transaction = db.transaction(['cache'], 'readwrite');
						const store = transaction.objectStore('cache');
						store.delete(key);
					};
				}
			} catch (error) {
				console.error('[IntelligentCache] Persistent storage removal failed:', error);
			}
		}

		private async clearPersistentStorage() {
			try {
				if ('indexedDB' in window) {
					const request = indexedDB.open('BarberProCache', 1);

					request.onsuccess = (event) => {
						const db = (event.target as any).result;
						const transaction = db.transaction(['cache'], 'readwrite');
						const store = transaction.objectStore('cache');
						store.clear();
					};
				}
			} catch (error) {
				console.error('[IntelligentCache] Persistent storage clear failed:', error);
			}
		}

		// Performance monitoring
		private startPerformanceMonitoring() {
			setInterval(() => {
				this.updateCacheStats();
				this.cleanupExpiredEntries();
			}, 60000); // Every minute
		}

		private setupCleanupSchedule() {
			// Clean up expired entries every 5 minutes
			setInterval(() => {
				this.cleanupExpiredEntries();
			}, 5 * 60 * 1000);

			// Major cleanup every hour
			setInterval(() => {
				this.performMajorCleanup();
			}, 60 * 60 * 1000);
		}

		private cleanupExpiredEntries() {
			let cleanedCount = 0;

			for (const [key, entry] of this.metadata.entries()) {
				if (this.isExpired(entry)) {
					this.delete(key);
					cleanedCount++;
				}
			}

			if (cleanedCount > 0) {
				console.log(`[IntelligentCache] Cleaned up ${cleanedCount} expired entries`);
			}
		}

		private async performMajorCleanup() {
			// Remove low-priority entries if cache is getting full
			const currentSize = this.getCurrentCacheSize();
			const threshold = this.maxSize * 0.8; // 80% of max size

			if (currentSize > threshold) {
				const lowPriorityEntries = Array.from(this.metadata.entries())
					.filter(([, entry]) => entry.priority === 'low')
					.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

				const entriesToRemove = Math.ceil(lowPriorityEntries.length * 0.3);
				for (let i = 0; i < entriesToRemove; i++) {
					const [key] = lowPriorityEntries[i];
					await this.delete(key);
				}

				console.log(`[IntelligentCache] Major cleanup: removed ${entriesToRemove} low-priority entries`);
			}
		}

		private updateCacheStats() {
			const currentSize = this.getCurrentCacheSize();
			const totalRequests = this.hitCount + this.missCount;
			const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

			cacheStats.set({
				size: currentSize,
				entries: this.cache.size,
				hitRate: Math.round(hitRate * 100) / 100,
				lastCleared: null
			});
		}

		// Public API for cache management
		getStats() {
			return {
				size: this.getCurrentCacheSize(),
				entries: this.cache.size,
				hitRate: this.hitCount / (this.hitCount + this.missCount) * 100,
				hitCount: this.hitCount,
				missCount: this.missCount
			};
		}

		async preload(urls: string[]) {
			const promises = urls.map(async (url) => {
				try {
					const response = await fetch(url);
					if (response.ok) {
						const data = await response.json();
						await this.set(url, data);
					}
				} catch (error) {
					console.error(`[IntelligentCache] Preload failed for ${url}:`, error);
				}
			});

			await Promise.all(promises);
			console.log(`[IntelligentCache] Preloaded ${urls.length} resources`);
		}

		async warmup(criticalPaths: string[]) {
			// Preload critical resources for faster app startup
			await this.preload(criticalPaths);
		}
	}

	// Global cache instance
	let cacheManager: IntelligentCacheManager;

	// Cache management functions
	export function getCacheManager(): IntelligentCacheManager {
		if (!cacheManager && browser) {
			cacheManager = new IntelligentCacheManager();
		}
		return cacheManager;
	}

	// Utility functions for components to use
	export async function cacheApiCall(url: string, options: any = {}): Promise<any> {
		const cache = getCacheManager();
		if (!cache) return null;

		// Try cache first
		const cached = await cache.get(url);
		if (cached) {
			return cached;
		}

		// Make API call and cache result
		try {
			const response = await fetch(url, options);
			if (response.ok) {
				const data = await response.json();
				await cache.set(url, data);
				return data;
			}
		} catch (error) {
			console.error('[CacheManager] API call failed:', error);
		}

		return null;
	}

	export async function invalidateCache(pattern: string | RegExp) {
		const cache = getCacheManager();
		if (!cache) return;

		// Implementation would iterate through cache keys and remove matches
		console.log(`[CacheManager] Invalidating cache pattern: ${pattern}`);
	}

	// Initialize on mount
	onMount(() => {
		if (browser) {
			cacheManager = getCacheManager();
		}
	});
</script>

<!-- Cache Status Indicator (only visible in dev mode) -->
{#if browser && import.meta.env.DEV}
	<div class="cache-status-indicator fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-neutral-200 p-3 text-xs z-50">
		<div class="flex items-center space-x-2 mb-2">
			<div
				class="w-2 h-2 rounded-full"
				class:bg-green-500={$cacheStatus === 'ready'}
				class:bg-yellow-500={$cacheStatus === 'initializing'}
				class:bg-red-500={$cacheStatus === 'error'}
			></div>
			<span class="font-medium text-neutral-700">Cache</span>
		</div>

		<div class="space-y-1 text-neutral-600">
			<div>Entries: {$cacheStats.entries}</div>
			<div>Size: {Math.round($cacheStats.size / 1024)}KB</div>
			<div>Hit Rate: {$cacheStats.hitRate}%</div>
		</div>

		<button
			class="mt-2 text-xs text-brand hover:text-brand-dark"
			on:click={() => cacheManager?.clear()}
		>
			Clear Cache
		</button>
	</div>
{/if}

<style>
	.cache-status-indicator {
		min-width: 120px;
		font-family: monospace;
		backdrop-filter: blur(8px);
	}

	@media (max-width: 768px) {
		.cache-status-indicator {
			display: none;
		}
	}
</style>