<!-- CodeSplitLoader.svelte - Dynamic component loading for Argentina mobile optimization -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { connectionSpeed, shouldUseSkeletons } from '$lib/services/ux-optimization';
  
  interface LoaderProps {
    module: () => Promise<any>;
    props?: Record<string, any>;
    fallback?: any;
    skeleton?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
  }
  
  // Props
  export let module: () => Promise<any>;
  export let props: Record<string, any> = {};
  export let fallback: any = null;
  export let skeleton = true;
  export let retryAttempts = 3;
  export let retryDelay = 1000;
  
  const dispatch = createEventDispatcher<{
    loaded: { component: any };
    error: { error: Error; attempts: number };
    retry: { attempt: number };
  }>();
  
  // State
  let component: any = null;
  let isLoading = true;
  let error: Error | null = null;
  let attempts = 0;
  let retryTimeout: number | null = null;
  
  // Adaptive loading based on connection speed
  $: shouldUseProgressiveLoading = $connectionSpeed === 'slow';
  $: shouldShowSkeleton = skeleton && $shouldUseSkeletons;
  
  onMount(() => {
    loadComponent();
    
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  });
  
  async function loadComponent() {
    if (!browser) return;
    
    attempts++;
    isLoading = true;
    error = null;
    
    try {
      console.log(`[CodeSplitLoader] Loading component (attempt ${attempts})`);
      
      // Add artificial delay for slow connections to prevent UI thrashing
      if (shouldUseProgressiveLoading && attempts === 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      const moduleExports = await module();
      component = moduleExports.default || moduleExports;
      
      if (!component) {
        throw new Error('Module does not export a component');
      }
      
      isLoading = false;
      dispatch('loaded', { component });
      
      console.log(`[CodeSplitLoader] Component loaded successfully after ${attempts} attempts`);
      
    } catch (err) {
      console.error('[CodeSplitLoader] Failed to load component:', err);
      
      error = err instanceof Error ? err : new Error('Unknown loading error');
      isLoading = false;
      
      dispatch('error', { error, attempts });
      
      // Retry logic with exponential backoff
      if (attempts < retryAttempts) {
        const delay = retryDelay * Math.pow(2, attempts - 1); // Exponential backoff
        console.log(`[CodeSplitLoader] Retrying in ${delay}ms (attempt ${attempts + 1}/${retryAttempts})`);
        
        retryTimeout = window.setTimeout(() => {
          dispatch('retry', { attempt: attempts + 1 });
          loadComponent();
        }, delay);
      }
    }
  }
  
  function handleRetry() {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    loadComponent();
  }
  
  function renderSkeleton() {
    // Default skeleton for Argentina mobile users
    return `
      <div class="component-skeleton">
        <div class="skeleton skeleton-header"></div>
        <div class="skeleton skeleton-content"></div>
        <div class="skeleton skeleton-actions"></div>
      </div>
    `;
  }
</script>

{#if component && !isLoading}
  <!-- Successfully loaded component -->
  <svelte:component this={component} {...props} />
  
{:else if isLoading}
  <!-- Loading state -->
  {#if shouldShowSkeleton}
    <!-- Skeleton loading optimized for mobile -->
    <div class="code-split-skeleton" role="status" aria-label="Cargando contenido">
      <div class="skeleton-container">
        <!-- Header skeleton -->
        <div class="skeleton skeleton-header mb-4"></div>
        
        <!-- Content skeleton -->
        <div class="skeleton-content-grid">
          <div class="skeleton skeleton-text mb-2"></div>
          <div class="skeleton skeleton-text mb-2" style="width: 80%;"></div>
          <div class="skeleton skeleton-text mb-4" style="width: 60%;"></div>
        </div>
        
        <!-- Action skeleton -->
        <div class="skeleton-actions">
          <div class="skeleton skeleton-button mr-2"></div>
          <div class="skeleton skeleton-button-secondary"></div>
        </div>
      </div>
      
      <!-- Loading indicator for slow connections -->
      {#if shouldUseProgressiveLoading && attempts > 1}
        <div class="loading-indicator">
          <div class="loading-spinner"></div>
          <span class="loading-text">Cargando... ({attempts}/{retryAttempts})</span>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Simple loading spinner -->
    <div class="simple-loader" role="status" aria-label="Cargando">
      <div class="spinner"></div>
      <span class="sr-only">Cargando...</span>
    </div>
  {/if}
  
{:else if error}
  <!-- Error state with retry option -->
  <div class="code-split-error" role="alert">
    <div class="error-content">
      <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <h3 class="error-title">Error al cargar contenido</h3>
      
      <p class="error-message">
        {#if $connectionSpeed === 'slow'}
          Tu conexión parece lenta. Verifica tu señal e intenta nuevamente.
        {:else}
          No se pudo cargar este contenido. Por favor intenta nuevamente.
        {/if}
      </p>
      
      <div class="error-details">
        <details>
          <summary>Detalles técnicos</summary>
          <p class="error-technical">{error.message}</p>
          <p class="error-attempts">Intentos: {attempts}/{retryAttempts}</p>
        </details>
      </div>
      
      <div class="error-actions">
        {#if attempts < retryAttempts}
          <button 
            class="btn btn-primary"
            on:click={handleRetry}
            type="button"
          >
            Reintentar
          </button>
        {/if}
        
        {#if fallback}
          <button 
            class="btn btn-secondary ml-2"
            on:click={() => component = fallback}
            type="button"
          >
            Usar versión simple
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* Skeleton loading styles optimized for Argentina mobile */
  .code-split-skeleton {
    padding: 1rem;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .skeleton-container {
    max-width: 100%;
  }
  
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-pulse 1.5s infinite;
    border-radius: 4px;
  }
  
  .skeleton-header {
    height: 2rem;
    width: 100%;
  }
  
  .skeleton-content-grid {
    margin: 1rem 0;
  }
  
  .skeleton-text {
    height: 1rem;
    width: 100%;
  }
  
  .skeleton-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .skeleton-button {
    height: 2.5rem;
    width: 6rem;
    border-radius: 6px;
  }
  
  .skeleton-button-secondary {
    height: 2.5rem;
    width: 5rem;
    border-radius: 6px;
  }
  
  /* Loading indicator for slow connections */
  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  
  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  .loading-text {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  /* Simple loader */
  .simple-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  /* Error state styles */
  .code-split-error {
    padding: 2rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    text-align: center;
  }
  
  .error-content {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .error-icon {
    width: 3rem;
    height: 3rem;
    color: #dc2626;
    margin: 0 auto 1rem;
  }
  
  .error-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
  }
  
  .error-message {
    color: #6b7280;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .error-details {
    margin-bottom: 1.5rem;
    text-align: left;
  }
  
  .error-details summary {
    cursor: pointer;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }
  
  .error-technical {
    font-family: monospace;
    font-size: 0.75rem;
    color: #dc2626;
    background: #fee2e2;
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    word-break: break-all;
  }
  
  .error-attempts {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .error-actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  /* Button styles */
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px; /* Argentina mobile optimization */
  }
  
  .btn-primary {
    background: #2563eb;
    color: white;
  }
  
  .btn-primary:hover {
    background: #1d4ed8;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  /* Responsive design for Argentina mobile */
  @media (max-width: 640px) {
    .code-split-skeleton {
      padding: 0.75rem;
    }
    
    .error-content {
      padding: 0 0.5rem;
    }
    
    .error-actions {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
      margin: 0;
    }
    
    .ml-2 {
      margin-left: 0;
      margin-top: 0.5rem;
    }
  }
  
  /* Animations */
  @keyframes skeleton-pulse {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Accessibility improvements */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
      background: #f0f0f0;
    }
    
    .loading-spinner,
    .spinner {
      animation: none;
      border-top-color: #2563eb;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .code-split-error {
      border-color: #000;
      background: #fff;
    }
    
    .error-icon {
      color: #000;
    }
    
    .btn-primary {
      background: #000;
      color: #fff;
      border: 1px solid #000;
    }
    
    .btn-secondary {
      background: #fff;
      color: #000;
      border: 2px solid #000;
    }
  }
  
  /* Utility classes */
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mr-2 { margin-right: 0.5rem; }
  .ml-2 { margin-left: 0.5rem; }
</style>