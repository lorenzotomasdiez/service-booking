<!-- Error Boundary Component for Graceful Error Handling -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from './Button.svelte';
	
	export let fallback: 'minimal' | 'detailed' | 'retry' | 'redirect' = 'retry';
	export let title = 'Algo salió mal';
	export let message = 'Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.';
	export let showDetails = false;
	export let retryAction: (() => Promise<void>) | null = null;
	export let redirectUrl: string | null = null;
	export let onError: ((error: Error, errorInfo: any) => void) | null = null;
	
	interface ErrorInfo {
		error: Error;
		timestamp: Date;
		userAgent: string;
		url: string;
		userId?: string;
		componentStack?: string;
	}
	
	let hasError = false;
	let errorInfo: ErrorInfo | null = null;
	let isRetrying = false;
	let showErrorDetails = false;
	let errorId: string | null = null;
	
	// Global error handler
	let globalErrorHandler: ((event: ErrorEvent) => void) | null = null;
	let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
	
	onMount(() => {
		// Set up global error handlers
		globalErrorHandler = (event: ErrorEvent) => {
			handleError(event.error, {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno
			});
		};
		
		unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
			handleError(new Error(event.reason), {
				type: 'unhandledRejection'
			});
		};
		
		window.addEventListener('error', globalErrorHandler);
		window.addEventListener('unhandledrejection', unhandledRejectionHandler);
	});
	
	onDestroy(() => {
		if (globalErrorHandler) {
			window.removeEventListener('error', globalErrorHandler);
		}
		if (unhandledRejectionHandler) {
			window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
		}
	});
	
	function handleError(error: Error, info: any = {}) {
		console.error('Error caught by ErrorBoundary:', error);
		
		// Generate unique error ID
		errorId = generateErrorId();
		
		// Create error info
		errorInfo = {
			error,
			timestamp: new Date(),
			userAgent: navigator.userAgent,
			url: window.location.href,
			componentStack: info.componentStack,
			...info
		};
		
		hasError = true;
		
		// Call custom error handler if provided
		if (onError) {
			onError(error, errorInfo);
		}
		
		// Log error to monitoring service (if available)
		logErrorToService(errorInfo);
		
		// Show user-friendly error notification
		showErrorNotification(error);
	}
	
	async function logErrorToService(errorInfo: ErrorInfo) {
		try {
			// Send error to monitoring service
			await fetch('/api/errors', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					errorId,
					message: errorInfo.error.message,
					stack: errorInfo.error.stack,
					timestamp: errorInfo.timestamp,
					userAgent: errorInfo.userAgent,
					url: errorInfo.url,
					userId: errorInfo.userId,
					componentStack: errorInfo.componentStack
				})
			});
		} catch (error) {
			console.warn('Failed to log error to service:', error);
		}
	}
	
	function showErrorNotification(error: Error) {
		// Show browser notification if available
		if ('Notification' in window && Notification.permission === 'granted') {
			new Notification('Error en la aplicación', {
				body: 'Se ha producido un error. Por favor, recarga la página.',
				icon: '/icons/error-icon.png',
				tag: 'app-error'
			});
		}
	}
	
	function generateErrorId() {
		return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
	
	async function retry() {
		if (!retryAction) {
			window.location.reload();
			return;
		}
		
		isRetrying = true;
		
		try {
			await retryAction();
			// If successful, reset error state
			hasError = false;
			errorInfo = null;
			errorId = null;
		} catch (error) {
			console.error('Retry failed:', error);
			// Update error info with retry failure
			if (errorInfo) {
				errorInfo.error = error as Error;
			}
		} finally {
			isRetrying = false;
		}
	}
	
	function redirect() {
		if (redirectUrl) {
			window.location.href = redirectUrl;
		} else {
			window.location.href = '/';
		}
	}
	
	function copyErrorDetails() {
		if (!errorInfo) return;
		
		const errorDetails = {
			errorId,
			message: errorInfo.error.message,
			stack: errorInfo.error.stack,
			timestamp: errorInfo.timestamp.toISOString(),
			url: errorInfo.url,
			userAgent: errorInfo.userAgent
		};
		
		navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
			.then(() => {
				alert('Detalles del error copiados al portapapeles');
			})
			.catch(() => {
				// Fallback for older browsers
				const textArea = document.createElement('textarea');
				textArea.value = JSON.stringify(errorDetails, null, 2);
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
				alert('Detalles del error copiados al portapapeles');
			});
	}
	
	function reportIssue() {
		// Open issue reporting (could be email, GitHub, or support system)
		const subject = encodeURIComponent(`Error Report: ${errorInfo?.error.message}`);
		const body = encodeURIComponent(`
Error ID: ${errorId}
Timestamp: ${errorInfo?.timestamp.toISOString()}
URL: ${errorInfo?.url}
Message: ${errorInfo?.error.message}
Stack: ${errorInfo?.error.stack}
User Agent: ${errorInfo?.userAgent}

Please describe what you were doing when this error occurred:

		`);
		
		window.open(`mailto:support@barberpro.com?subject=${subject}&body=${body}`);
	}
	
	// Expose handleError for external use
	export function captureError(error: Error, info: any = {}) {
		handleError(error, info);
	}
</script>

{#if hasError && errorInfo}
	<div class="error-boundary-container">
		{#if fallback === 'minimal'}
			<!-- Minimal Error Display -->
			<div class="flex items-center justify-center min-h-[200px] p-6" in:fade>
				<div class="text-center">
					<svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<h3 class="text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
					<p class="text-neutral-600 mb-4">{message}</p>
					<Button variant="primary" on:click={retry} loading={isRetrying}>
						Reintentar
					</Button>
				</div>
			</div>
		{:else if fallback === 'detailed'}
			<!-- Detailed Error Display -->
			<div class="max-w-2xl mx-auto p-6" in:fly={{ y: 20, duration: 300 }}>
				<div class="bg-red-50 border border-red-200 rounded-lg p-6">
					<div class="flex items-start space-x-3">
						<svg class="w-8 h-8 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						
						<div class="flex-1">
							<h3 class="text-xl font-semibold text-red-800 mb-2">{title}</h3>
							<p class="text-red-700 mb-4">{message}</p>
							
							{#if errorId}
								<div class="mb-4">
									<span class="text-sm text-red-600">ID de Error: </span>
									<code class="text-xs bg-red-100 px-2 py-1 rounded text-red-800">{errorId}</code>
								</div>
							{/if}
							
							<!-- Error Details Toggle -->
							<button
								type="button"
								class="text-sm text-red-700 hover:text-red-800 underline mb-4"
								on:click={() => showErrorDetails = !showErrorDetails}
							>
								{showErrorDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos
							</button>
							
							{#if showErrorDetails}
								<div class="bg-red-100 rounded p-4 mb-4" transition:fade>
									<div class="space-y-2 text-sm">
										<div>
											<strong>Mensaje:</strong> {errorInfo.error.message}
										</div>
										<div>
											<strong>Timestamp:</strong> {errorInfo.timestamp.toLocaleString('es-AR')}
										</div>
										<div>
											<strong>URL:</strong> {errorInfo.url}
										</div>
										{#if errorInfo.error.stack}
											<div>
												<strong>Stack Trace:</strong>
												<pre class="mt-2 p-2 bg-red-200 rounded text-xs overflow-x-auto">{errorInfo.error.stack}</pre>
											</div>
										{/if}
									</div>
								</div>
							{/if}
							
							<!-- Actions -->
							<div class="flex flex-wrap gap-3">
								<Button variant="primary" on:click={retry} loading={isRetrying}>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
									</svg>
									Reintentar
								</Button>
								
								<Button variant="outline" on:click={redirect}>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
									</svg>
									Ir al inicio
								</Button>
								
								<Button variant="ghost" on:click={copyErrorDetails}>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
									</svg>
									Copiar detalles
								</Button>
								
								<Button variant="ghost" on:click={reportIssue}>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
									</svg>
									Reportar problema
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if fallback === 'retry'}
			<!-- Retry-focused Error Display -->
			<div class="flex items-center justify-center min-h-[300px] p-6" in:fly={{ y: 20, duration: 300 }}>
				<div class="text-center max-w-md">
					<div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					
					<h3 class="text-xl font-semibold text-neutral-800 mb-2">{title}</h3>
					<p class="text-neutral-600 mb-6">{message}</p>
					
					{#if errorId}
						<p class="text-sm text-neutral-500 mb-6">
							Error ID: <code class="bg-neutral-100 px-2 py-1 rounded text-neutral-700">{errorId}</code>
						</p>
					{/if}
					
					<div class="space-y-3">
						<Button variant="primary" on:click={retry} loading={isRetrying} class="w-full">
							{isRetrying ? 'Reintentando...' : 'Intentar nuevamente'}
						</Button>
						
						<Button variant="outline" on:click={redirect} class="w-full">
							Volver al inicio
						</Button>
						
						{#if showDetails}
							<Button 
								variant="ghost" 
								on:click={() => showErrorDetails = !showErrorDetails}
								class="w-full text-sm"
							>
								{showErrorDetails ? 'Ocultar' : 'Ver'} detalles técnicos
							</Button>
						{/if}
					</div>
					
					{#if showErrorDetails && showDetails}
						<div class="mt-6 p-4 bg-neutral-50 rounded-lg text-left" transition:fade>
							<h4 class="font-medium text-neutral-800 mb-2">Detalles del Error</h4>
							<div class="space-y-1 text-sm text-neutral-600">
								<div><strong>Mensaje:</strong> {errorInfo.error.message}</div>
								<div><strong>Hora:</strong> {errorInfo.timestamp.toLocaleString('es-AR')}</div>
								{#if errorInfo.error.stack}
									<div class="mt-2">
										<strong>Stack:</strong>
										<pre class="mt-1 p-2 bg-neutral-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">{errorInfo.error.stack}</pre>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else if fallback === 'redirect'}
			<!-- Redirect-focused Error Display -->
			<div class="flex items-center justify-center min-h-[300px] p-6" in:fade>
				<div class="text-center max-w-md">
					<svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					
					<h3 class="text-xl font-semibold text-neutral-800 mb-2">{title}</h3>
					<p class="text-neutral-600 mb-6">{message}</p>
					
					<p class="text-sm text-neutral-500 mb-6">
						Serás redirigido automáticamente en unos segundos...
					</p>
					
					<Button variant="primary" on:click={redirect} class="w-full">
						Ir ahora
					</Button>
				</div>
			</div>
			
			<!-- Auto-redirect after 5 seconds -->
			{setTimeout(redirect, 5000)}
		{/if}
	</div>
{:else}
	<!-- Normal content when no error -->
	<slot />
{/if}

<style>
	.error-boundary-container {
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	pre {
		font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
	}
</style>