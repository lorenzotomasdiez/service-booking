<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let name = 'ErrorBoundary';
	export let fallbackComponent: any = null;
	export let enableRetry = true;
	export let maxRetries = 3;
	export let retryDelay = 1000; // ms
	export let enableReporting = true;
	export let reportingUrl = '/api/errors';
	export let showErrorDetails = false;
	export let argentina = true; // Argentina-specific error handling

	interface ErrorInfo {
		error: Error;
		timestamp: number;
		userAgent: string;
		url: string;
		userId?: string;
		sessionId?: string;
		component: string;
		retryCount: number;
		stack?: string;
		componentStack?: string;
		recoveryAttempts: string[];
		networkStatus: 'online' | 'offline';
		deviceInfo?: {
			isMobile: boolean;
			isArgentinaTimezone: boolean;
			connection?: string;
		};
	}

	let hasError = false;
	let errorInfo: ErrorInfo | null = null;
	let retryCount = 0;
	let isRetrying = false;
	let sessionId = '';
	let componentElement: HTMLElement;
	let errorReports: ErrorInfo[] = [];

	// Error recovery strategies
	const recoveryStrategies = [
		'component-remount',
		'clear-cache',
		'reload-data',
		'reset-state',
		'fallback-mode'
	];

	onMount(() => {
		// Generate session ID
		sessionId = generateSessionId();
		
		// Setup global error handlers
		setupGlobalErrorHandlers();
		
		// Setup network status monitoring
		setupNetworkMonitoring();
		
		// Load error reports from storage
		loadStoredErrorReports();
	});

	onDestroy(() => {
		cleanup();
	});

	function generateSessionId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	function setupGlobalErrorHandlers() {
		if (!browser) return;

		// Catch unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			console.error('Unhandled Promise Rejection:', event.reason);
			
			const error = event.reason instanceof Error 
				? event.reason 
				: new Error(String(event.reason));
			
			handleError(error, 'unhandled-promise-rejection');
		});

		// Catch JavaScript errors
		window.addEventListener('error', (event) => {
			console.error('JavaScript Error:', event.error);
			handleError(event.error, 'javascript-error');
		});

		// Catch resource loading errors
		window.addEventListener('error', (event) => {
			if (event.target !== window) {
				const target = event.target as HTMLElement;
				const error = new Error(`Resource failed to load: ${target.tagName} - ${target.getAttribute('src') || target.getAttribute('href')}`);
				handleError(error, 'resource-error');
			}
		}, true);
	}

	function setupNetworkMonitoring() {
		if (!browser) return;

		window.addEventListener('online', () => {
			console.log('[ErrorBoundary] Network back online - attempting recovery');
			if (hasError && errorInfo && retryCount < maxRetries) {
				attemptRecovery();
			}
		});

		window.addEventListener('offline', () => {
			console.log('[ErrorBoundary] Network went offline');
		});
	}

	function handleError(error: Error, source: string = 'component') {
		console.error(`[${name}] Error caught:`, error);
		
		hasError = true;
		retryCount = 0;

		errorInfo = {
			error,
			timestamp: Date.now(),
			userAgent: navigator.userAgent,
			url: window.location.href,
			userId: getUserId(),
			sessionId,
			component: name,
			retryCount: 0,
			stack: error.stack,
			recoveryAttempts: [],
			networkStatus: navigator.onLine ? 'online' : 'offline',
			deviceInfo: {
				isMobile: /Mobi|Android/i.test(navigator.userAgent),
				isArgentinaTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Argentina'),
				connection: (navigator as any).connection?.effectiveType
			}
		};

		// Store error report
		storeErrorReport(errorInfo);

		// Report error if enabled
		if (enableReporting) {
			reportError(errorInfo);
		}

		// Dispatch error event
		dispatch('error', errorInfo);

		// Show Argentina-specific error message for network issues
		if (argentina && isNetworkError(error)) {
			showArgentinaNetworkError();
		}
	}

	async function attemptRecovery(strategy: string = 'auto') {
		if (retryCount >= maxRetries || !errorInfo) {
			console.warn(`[${name}] Max retries reached or no error info`);
			return;
		}

		isRetrying = true;
		retryCount++;
		errorInfo.retryCount = retryCount;

		console.log(`[${name}] Attempting recovery #${retryCount} with strategy: ${strategy}`);

		try {
			// Apply recovery strategy
			const success = await applyRecoveryStrategy(strategy);
			
			if (success) {
				hasError = false;
				errorInfo = null;
				isRetrying = false;
				
				dispatch('recovery-success', { 
					strategy, 
					retryCount,
					timestamp: Date.now()
				});
				
				console.log(`[${name}] Recovery successful with strategy: ${strategy}`);
			} else {
				throw new Error(`Recovery strategy '${strategy}' failed`);
			}

		} catch (recoveryError) {
			console.error(`[${name}] Recovery attempt failed:`, recoveryError);
			
			if (errorInfo) {
				errorInfo.recoveryAttempts.push(`${strategy}-failed`);
			}
			
			// Try next strategy or give up
			await new Promise(resolve => setTimeout(resolve, retryDelay));
			
			const nextStrategy = getNextRecoveryStrategy(strategy);
			if (nextStrategy && retryCount < maxRetries) {
				await attemptRecovery(nextStrategy);
			} else {
				isRetrying = false;
				dispatch('recovery-failed', { 
					finalStrategy: strategy, 
					totalRetries: retryCount,
					error: recoveryError
				});
			}
		}
	}

	async function applyRecoveryStrategy(strategy: string): Promise<boolean> {
		if (!errorInfo) return false;

		errorInfo.recoveryAttempts.push(strategy);

		switch (strategy) {
			case 'component-remount':
				// Force component remount
				hasError = false;
				await new Promise(resolve => setTimeout(resolve, 100));
				return true;

			case 'clear-cache':
				// Clear various caches
				if (browser) {
					localStorage.removeItem('barberpro-cache');
					sessionStorage.clear();
					
					// Clear browser cache if available
					if ('caches' in window) {
						const cacheNames = await caches.keys();
						await Promise.all(
							cacheNames.map(name => caches.delete(name))
						);
					}
				}
				return true;

			case 'reload-data':
				// Trigger data reload
				dispatch('reload-data');
				await new Promise(resolve => setTimeout(resolve, 2000));
				return true;

			case 'reset-state':
				// Reset application state
				dispatch('reset-state');
				return true;

			case 'fallback-mode':
				// Enable fallback mode
				dispatch('enable-fallback-mode');
				return true;

			case 'page-reload':
				// Full page reload as last resort
				if (browser) {
					window.location.reload();
				}
				return true;

			default:
				return false;
		}
	}

	function getNextRecoveryStrategy(currentStrategy: string): string | null {
		const index = recoveryStrategies.indexOf(currentStrategy);
		return index >= 0 && index < recoveryStrategies.length - 1 
			? recoveryStrategies[index + 1] 
			: 'page-reload';
	}

	async function reportError(error: ErrorInfo) {
		if (!browser || !enableReporting) return;

		try {
			const response = await fetch(reportingUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
				},
				body: JSON.stringify({
					...error,
					source: 'error-boundary',
					environment: process.env.NODE_ENV,
					buildVersion: __APP_VERSION__ || 'unknown'
				})
			});

			if (response.ok) {
				console.log('[ErrorBoundary] Error reported successfully');
			}
		} catch (reportingError) {
			console.error('[ErrorBoundary] Failed to report error:', reportingError);
			// Store for later retry when online
			storeErrorReport(error);
		}
	}

	function storeErrorReport(error: ErrorInfo) {
		if (!browser) return;

		try {
			const stored = localStorage.getItem('barberpro-error-reports');
			const reports: ErrorInfo[] = stored ? JSON.parse(stored) : [];
			
			reports.push(error);
			
			// Keep only last 10 error reports
			const recentReports = reports.slice(-10);
			
			localStorage.setItem('barberpro-error-reports', JSON.stringify(recentReports));
			errorReports = recentReports;
		} catch (storageError) {
			console.warn('[ErrorBoundary] Failed to store error report:', storageError);
		}
	}

	function loadStoredErrorReports() {
		if (!browser) return;

		try {
			const stored = localStorage.getItem('barberpro-error-reports');
			if (stored) {
				errorReports = JSON.parse(stored);
			}
		} catch (error) {
			console.warn('[ErrorBoundary] Failed to load stored error reports:', error);
		}
	}

	function getUserId(): string | undefined {
		if (!browser) return undefined;
		
		try {
			const user = localStorage.getItem('user');
			return user ? JSON.parse(user).id : undefined;
		} catch {
			return undefined;
		}
	}

	function isNetworkError(error: Error): boolean {
		return error.message.toLowerCase().includes('network') ||
			   error.message.toLowerCase().includes('fetch') ||
			   error.message.toLowerCase().includes('timeout') ||
			   error.name === 'TypeError' && error.message.includes('Failed to fetch');
	}

	function showArgentinaNetworkError() {
		// Show Argentina-specific network error guidance
		dispatch('show-argentina-network-help', {
			suggestions: [
				'Verificar conexión WiFi o datos móviles',
				'Probar cambiar entre WiFi y datos móviles',
				'Reiniciar el router o datos móviles',
				'Contactar al proveedor de internet',
				'Usar modo offline de BarberPro'
			]
		});
	}

	function cleanup() {
		if (browser) {
			window.removeEventListener('unhandledrejection', handleError);
			window.removeEventListener('error', handleError);
			window.removeEventListener('online', attemptRecovery);
			window.removeEventListener('offline', () => {});
		}
	}

	function resetError() {
		hasError = false;
		errorInfo = null;
		retryCount = 0;
		isRetrying = false;
	}

	function downloadErrorReport() {
		if (!errorInfo || !browser) return;

		const report = {
			...errorInfo,
			exportedAt: new Date().toISOString(),
			userAgent: navigator.userAgent,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			language: navigator.language,
			allReports: errorReports
		};

		const blob = new Blob([JSON.stringify(report, null, 2)], {
			type: 'application/json'
		});
		
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `barberpro-error-${Date.now()}.json`;
		a.click();
		
		URL.revokeObjectURL(url);
	}

	// Export functions for external use
	export { resetError, downloadErrorReport, attemptRecovery };
</script>

<!-- Error Boundary Container -->
<div bind:this={componentElement} class="error-boundary-container">
	{#if hasError && errorInfo}
		<!-- Argentina-Optimized Error Display -->
		<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
			<div class="max-w-md w-full bg-white rounded-xl shadow-strong border border-error-200 overflow-hidden">
				<!-- Error Header -->
				<div class="bg-error-50 border-b border-error-200 p-6 text-center">
					<div class="w-16 h-16 mx-auto mb-4 bg-error-100 rounded-full flex items-center justify-center">
						<svg class="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					
					<h1 class="text-xl font-bold text-error-800 mb-2">
						{#if argentina && isNetworkError(errorInfo.error)}
							Problema de Conexión
						{:else}
							Algo Salió Mal
						{/if}
					</h1>
					
					<p class="text-sm text-error-600">
						{#if argentina && isNetworkError(errorInfo.error)}
							Hay un problema con tu conexión a internet. Esto es común en Argentina debido a la conectividad móvil variable.
						{:else}
							Se produjo un error inesperado. Estamos trabajando para solucionarlo.
						{/if}
					</p>
				</div>

				<!-- Error Content -->
				<div class="p-6 space-y-4">
					<!-- Network Status -->
					{#if errorInfo.networkStatus === 'offline'}
						<div class="bg-warning-50 border border-warning-200 rounded-lg p-3">
							<div class="flex items-center gap-2 text-warning-800">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
								</svg>
								<span class="text-sm font-medium">Sin Conexión a Internet</span>
							</div>
							<p class="text-xs text-warning-600 mt-1">
								Reconectate a internet para continuar usando BarberPro
							</p>
						</div>
					{/if}

					<!-- Device Info for Argentina -->
					{#if argentina && errorInfo.deviceInfo}
						<div class="text-xs text-neutral-500 space-y-1">
							<div>📱 {errorInfo.deviceInfo.isMobile ? 'Móvil' : 'Escritorio'}</div>
							<div>🌍 {errorInfo.deviceInfo.isArgentinaTimezone ? 'Zona horaria Argentina' : 'Zona horaria internacional'}</div>
							{#if errorInfo.deviceInfo.connection}
								<div>📶 Conexión: {errorInfo.deviceInfo.connection}</div>
							{/if}
						</div>
					{/if}

					<!-- Retry Section -->
					{#if enableRetry}
						<div class="space-y-3">
							{#if isRetrying}
								<div class="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
									<div class="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
									<span class="text-sm text-primary-800">
										Intentando solucionar... (Intento {retryCount}/{maxRetries})
									</span>
								</div>
							{:else if retryCount < maxRetries}
								<button 
									class="btn btn-primary w-full"
									on:click={() => attemptRecovery()}
								>
									🔄 Intentar Nuevamente
									{#if retryCount > 0}({retryCount}/{maxRetries}){/if}
								</button>
							{/if}

							<!-- Recovery Options -->
							{#if retryCount > 1}
								<div class="space-y-2">
									<p class="text-xs text-neutral-600 font-medium">Opciones de recuperación:</p>
									
									<button 
										class="btn btn-secondary btn-sm w-full"
										on:click={() => attemptRecovery('clear-cache')}
									>
										🗑️ Limpiar Caché
									</button>
									
									<button 
										class="btn btn-secondary btn-sm w-full"
										on:click={() => attemptRecovery('reload-data')}
									>
										📥 Recargar Datos
									</button>
									
									{#if browser}
										<button 
											class="btn btn-secondary btn-sm w-full"
											on:click={() => window.location.reload()}
										>
											🔄 Recargar Página
										</button>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Argentina-specific help -->
					{#if argentina}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<h3 class="text-sm font-medium text-blue-800 mb-2">💡 Consejos para Argentina</h3>
							<ul class="text-xs text-blue-700 space-y-1">
								<li>• Cambia entre WiFi y datos móviles</li>
								<li>• Verifica tu saldo de datos</li>
								<li>• Intenta desde una ubicación con mejor señal</li>
								<li>• Contacta a tu proveedor si persiste</li>
							</ul>
						</div>
					{/if}

					<!-- Error Details (Development) -->
					{#if showErrorDetails || process.env.NODE_ENV === 'development'}
						<details class="text-xs">
							<summary class="cursor-pointer text-neutral-600 hover:text-neutral-800">
								Detalles Técnicos
							</summary>
							<div class="mt-2 p-3 bg-neutral-100 rounded border text-neutral-700 font-mono">
								<div><strong>Error:</strong> {errorInfo.error.message}</div>
								<div><strong>Componente:</strong> {errorInfo.component}</div>
								<div><strong>Tiempo:</strong> {new Date(errorInfo.timestamp).toLocaleString('es-AR')}</div>
								<div><strong>Sesión:</strong> {errorInfo.sessionId}</div>
								{#if errorInfo.stack}
									<details class="mt-2">
										<summary class="cursor-pointer">Stack Trace</summary>
										<pre class="mt-1 text-xs whitespace-pre-wrap">{errorInfo.stack}</pre>
									</details>
								{/if}
							</div>
						</details>
					{/if}

					<!-- Actions -->
					<div class="flex gap-2 pt-2 border-t border-neutral-200">
						<button 
							class="btn btn-ghost btn-sm flex-1"
							on:click={resetError}
						>
							Cerrar
						</button>
						
						{#if enableReporting}
							<button 
								class="btn btn-ghost btn-sm flex-1"
								on:click={downloadErrorReport}
							>
								📄 Descargar Reporte
							</button>
						{/if}
						
						{#if browser}
							<button 
								class="btn btn-ghost btn-sm flex-1"
								on:click={() => window.location.href = '/'}
							>
								🏠 Inicio
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Normal Content -->
		<slot />
	{/if}
</div>

<style>
	.error-boundary-container {
		width: 100%;
		min-height: 100%;
		position: relative;
	}

	/* Argentina mobile optimization */
	@media (max-width: 768px) {
		.error-boundary-container {
			padding: 1rem;
		}
	}

	/* High contrast support */
	@media (prefers-contrast: high) {
		.error-boundary-container {
			--error-bg: #000000;
			--error-text: #ffffff;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.animate-spin {
			animation: none;
		}
	}
</style>