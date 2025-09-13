<!-- ErrorBoundary.svelte - Advanced error handling for Argentina mobile users -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { connectionSpeed } from '$lib/services/ux-optimization';
  import { uxAnalytics } from '$lib/services/ux-analytics';
  
  interface ErrorInfo {
    error: Error;
    errorInfo?: any;
    timestamp: number;
    userAgent: string;
    url: string;
    userId?: string;
    sessionId: string;
    connectionSpeed: string;
    retryCount: number;
  }
  
  interface ErrorBoundaryConfig {
    fallbackComponent?: any;
    enableRetry?: boolean;
    maxRetries?: number;
    enableReporting?: boolean;
    reportingEndpoint?: string;
    showTechnicalDetails?: boolean;
    argentina?: boolean; // Argentina-specific error messages
  }
  
  // Props
  export let config: ErrorBoundaryConfig = {};
  export let name = 'ErrorBoundary';
  
  const dispatch = createEventDispatcher<{
    error: ErrorInfo;
    retry: { attempt: number };
    recover: { timestamp: number };
  }>();
  
  // State
  let hasError = false;
  let errorInfo: ErrorInfo | null = null;
  let retryCount = 0;
  let isRetrying = false;
  let sessionId = '';
  
  // Configuration with defaults
  const {
    fallbackComponent = null,
    enableRetry = true,
    maxRetries = 3,
    enableReporting = true,
    reportingEndpoint = '/api/errors',
    showTechnicalDetails = false,
    argentina = true
  } = config;
  
  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  function handleError(error: Error, additionalInfo?: any) {
    const info: ErrorInfo = {
      error,
      errorInfo: additionalInfo,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId,
      connectionSpeed: $connectionSpeed,
      retryCount
    };
    
    hasError = true;
    errorInfo = info;
    
    // Track error in analytics
    uxAnalytics.trackExternalEvent('error_boundary_triggered', {
      errorMessage: error.message,
      errorStack: error.stack,
      componentName: name,
      retryCount,
      connectionSpeed: $connectionSpeed
    });
    
    dispatch('error', info);
    console.error(`[${name}] Error caught:`, error, additionalInfo);
  }
  
  async function handleRetry() {
    if (!enableRetry || retryCount >= maxRetries) return;
    
    isRetrying = true;
    retryCount++;
    
    dispatch('retry', { attempt: retryCount });
    
    // Add delay for mobile network stability
    const retryDelay = $connectionSpeed === 'slow' ? 3000 : 2000;
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    try {
      // Reset error state
      hasError = false;
      errorInfo = null;
      isRetrying = false;
      
      dispatch('recover', { timestamp: Date.now() });
      console.log(`[${name}] Recovery attempt ${retryCount} completed`);
      
    } catch (error) {
      isRetrying = false;
      console.error(`[${name}] Recovery attempt ${retryCount} failed:`, error);
    }
  }
  
  function handleReload() {
    uxAnalytics.trackExternalEvent('error_boundary_reload', {
      componentName: name,
      retryCount
    });
    
    window.location.reload();
  }
  
  function getArgentinaErrorMessage(error: Error): string {
    const commonErrors = {
      'Network Error': 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      'Failed to fetch': 'No se pudo conectar al servidor. Revisa tu conexión.',
      'Load failed': 'Error al cargar. Intenta refrescar la página.',
      'Timeout': 'La conexión tardó demasiado. Intenta nuevamente.',
      'Not Found': 'No se encontró la página solicitada.',
      'Server Error': 'Error del servidor. Intenta más tarde.',
      'Unauthorized': 'Tu sesión expiró. Inicia sesión nuevamente.'
    };
    
    // Check for common error patterns
    for (const [pattern, message] of Object.entries(commonErrors)) {
      if (error.message.includes(pattern)) {
        return message;
      }
    }
    
    // Connection-specific messages
    if ($connectionSpeed === 'slow') {
      return 'Tu conexión parece lenta. Verifica tu señal e intenta nuevamente.';
    }
    
    return 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
  }
  
  function getRecoveryTips(): string[] {
    const tips = [
      'Verifica tu conexión a internet',
      'Cierra y vuelve a abrir la aplicación',
      'Intenta refrescar la página'
    ];
    
    if ($connectionSpeed === 'slow') {
      tips.unshift('Espera a tener mejor señal de internet');
    }
    
    return tips;
  }
  
  onMount(() => {
    sessionId = generateSessionId();
    
    const handleUnhandledError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message), {
        type: 'unhandled',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(new Error(event.reason), {
        type: 'unhandled-promise',
        reason: event.reason
      });
    };
    
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });
  
  // Expose retry function for parent components
  export { handleRetry as retry };
</script>

{#if hasError && errorInfo}
  <!-- Error fallback UI -->
  <div class="error-boundary" class:argentina-style={argentina}>
    <div class="error-container">
      <!-- Error icon -->
      <div class="error-icon">
        {#if $connectionSpeed === 'slow'}
          📶
        {:else}
          ⚠️
        {/if}
      </div>
      
      <!-- Error heading -->
      <h2 class="error-title">
        {#if argentina}
          Ups, algo salió mal
        {:else}
          Something went wrong
        {/if}
      </h2>
      
      <!-- Error message -->
      <p class="error-message">
        {#if argentina}
          {getArgentinaErrorMessage(errorInfo.error)}
        {:else}
          {errorInfo.error.message}
        {/if}
      </p>
      
      <!-- Connection status -->
      {#if $connectionSpeed === 'slow'}
        <div class="connection-warning">
          <span class="connection-icon">🔄</span>
          <span class="connection-text">
            Conexión lenta detectada. Esto puede afectar el funcionamiento.
          </span>
        </div>
      {/if}
      
      <!-- Recovery tips -->
      {#if argentina}
        <div class="recovery-tips">
          <h3>Puedes intentar:</h3>
          <ul>
            {#each getRecoveryTips() as tip}
              <li>{tip}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      <!-- Action buttons -->
      <div class="error-actions">
        {#if enableRetry && retryCount < maxRetries}
          <button
            class="retry-button"
            class:loading={isRetrying}
            on:click={handleRetry}
            disabled={isRetrying}
          >
            {#if isRetrying}
              <div class="button-spinner"></div>
              {argentina ? 'Reintentando...' : 'Retrying...'}
            {:else}
              {argentina ? 'Reintentar' : 'Retry'} ({maxRetries - retryCount})
            {/if}
          </button>
        {/if}
        
        <button class="reload-button" on:click={handleReload}>
          {argentina ? 'Refrescar página' : 'Reload page'}
        </button>
      </div>
      
      <!-- Support contact -->
      {#if argentina}
        <div class="support-info">
          <p class="support-text">
            Si el problema persiste, contacta soporte en 
            <a href="mailto:soporte@barberpro.com.ar" class="support-link">
              soporte@barberpro.com.ar
            </a>
          </p>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Normal content -->
  <slot />
{/if}

<style>
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
    background: #fef2f2;
    border-radius: 8px;
    border: 1px solid #fecaca;
  }
  
  .error-boundary.argentina-style {
    background: linear-gradient(135deg, #fef2f2 0%, #fef7ff 100%);
    border-color: #f3e8ff;
  }
  
  .error-container {
    max-width: 500px;
    text-align: center;
    width: 100%;
  }
  
  .error-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }
  
  .error-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1rem 0;
  }
  
  .error-message {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    line-height: 1.6;
  }
  
  .connection-warning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    margin-bottom: 1.5rem;
  }
  
  .connection-icon {
    font-size: 1.25rem;
    animation: spin 2s linear infinite;
  }
  
  .connection-text {
    font-size: 0.875rem;
    color: #92400e;
    font-weight: 500;
  }
  
  .recovery-tips {
    text-align: left;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .recovery-tips h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #0369a1;
    margin: 0 0 0.5rem 0;
  }
  
  .recovery-tips ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #0369a1;
  }
  
  .recovery-tips li {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  
  .retry-button,
  .reload-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px; /* Argentina mobile optimization */
  }
  
  .retry-button {
    background: #2563eb;
    color: white;
  }
  
  .retry-button:hover:not(:disabled) {
    background: #1d4ed8;
  }
  
  .retry-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .reload-button {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .reload-button:hover {
    background: #e5e7eb;
  }
  
  .button-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .support-info {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 1rem;
  }
  
  .support-text {
    font-size: 0.875rem;
    color: #0369a1;
    margin: 0;
  }
  
  .support-link {
    color: #2563eb;
    text-decoration: underline;
    font-weight: 600;
  }
  
  .support-link:hover {
    color: #1d4ed8;
  }
  
  /* Mobile optimizations for Argentina */
  @media (max-width: 640px) {
    .error-boundary {
      padding: 1rem;
      min-height: 300px;
    }
    
    .error-container {
      padding: 0;
    }
    
    .error-icon {
      font-size: 3rem;
    }
    
    .error-title {
      font-size: 1.25rem;
    }
    
    .error-actions {
      flex-direction: column;
    }
    
    .retry-button,
    .reload-button {
      width: 100%;
    }
    
    .recovery-tips {
      text-align: center;
    }
    
    .recovery-tips ul {
      text-align: left;
      display: inline-block;
    }
  }
  
  /* Animations */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .connection-icon,
    .button-spinner {
      animation: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .error-boundary {
      background: #fff;
      border: 2px solid #000;
    }
    
    .retry-button {
      background: #000;
      border: 2px solid #000;
    }
    
    .reload-button {
      background: #fff;
      color: #000;
      border: 2px solid #000;
    }
  }
</style>