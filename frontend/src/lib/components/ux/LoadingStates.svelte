<!-- Enhanced Loading States for Argentina Mobile Users -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { shouldUseSkeletons, shouldReduceAnimations, connectionSpeed, isLowEndDevice } from '$lib/services/ux-optimization';

  export let type: 'skeleton' | 'spinner' | 'progress' | 'shimmer' | 'dots' | 'booking' | 'payment' = 'skeleton';
  export let size: 'sm' | 'md' | 'lg' | 'full' = 'md';
  export let message: string = '';
  export let progress: number | undefined = undefined;
  export let showPercentage: boolean = false;
  export let adaptToConnection: boolean = true;
  export let optimizeForMobile: boolean = true;
  
  // Argentina-specific loading messages
  const loadingMessages = {
    booking: [
      'Buscando los mejores profesionales...',
      'Verificando disponibilidad...',
      'Preparando tu reserva...',
      'Casi listo...'
    ],
    payment: [
      'Procesando pago con MercadoPago...',
      'Verificando transacción...',
      'Confirmando reserva...',
      'Finalizando...'
    ],
    general: [
      'Cargando...',
      'Un momento por favor...',
      'Preparando contenido...',
      'Optimizando para tu conexión...'
    ]
  };
  
  let currentMessageIndex = 0;
  let currentMessage = message;
  let isVisible = false;
  let shouldAnimate = true;
  
  onMount(() => {
    isVisible = true;
    
    // Cycle through messages if none provided
    if (!message) {
      const messages = type === 'booking' ? loadingMessages.booking :
                     type === 'payment' ? loadingMessages.payment :
                     loadingMessages.general;
      
      currentMessage = messages[0];
      
      const interval = setInterval(() => {
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;
        currentMessage = messages[currentMessageIndex];
      }, 2000);
      
      return () => clearInterval(interval);
    }
  });
  
  // Adapt loading style based on connection and device
  $: adaptiveType = adaptToConnection ? 
    ($connectionSpeed === 'slow' ? 'dots' :
     $connectionSpeed === 'medium' ? 'spinner' :
     $shouldUseSkeletons ? 'skeleton' : type) : type;
  
  $: shouldAnimate = !$shouldReduceAnimations;
  
  // Size classes
  $: sizeClasses = {
    sm: 'text-sm p-2',
    md: 'text-base p-4',
    lg: 'text-lg p-6',
    full: 'text-xl p-8 min-h-screen'
  };
  
  // Connection-aware styling
  $: connectionClasses = adaptToConnection ? {
    slow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-blue-50 border-blue-200 text-blue-800', 
    fast: 'bg-green-50 border-green-200 text-green-800'
  }[$connectionSpeed] : 'bg-gray-50 border-gray-200 text-gray-800';
</script>

<!-- Main Loading Container -->
<div 
  class="loading-container {sizeClasses[size]} {connectionClasses} 
         {optimizeForMobile ? 'mobile-optimized' : ''}
         {$isLowEndDevice ? 'low-end-device' : ''}
         flex flex-col items-center justify-center rounded-lg border transition-all duration-300"
  class:animate-fade-in={shouldAnimate && isVisible}
  role="status" 
  aria-live="polite"
  aria-label="Cargando contenido"
>
  <!-- Skeleton Loading -->
  {#if adaptiveType === 'skeleton'}
    <div class="w-full max-w-md space-y-4">
      <!-- Profile skeleton -->
      <div class="flex items-center space-x-4">
        <div class="skeleton skeleton-avatar"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton skeleton-text" style="width: 75%;"></div>
          <div class="skeleton skeleton-text-sm" style="width: 50%;"></div>
        </div>
      </div>
      
      <!-- Content skeleton -->
      <div class="space-y-3">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
      </div>
      
      <!-- Card skeleton -->
      <div class="skeleton skeleton-card"></div>
      
      <!-- Button skeleton -->
      <div class="flex space-x-3">
        <div class="skeleton" style="width: 100px; height: 40px; border-radius: 6px;"></div>
        <div class="skeleton" style="width: 120px; height: 40px; border-radius: 6px;"></div>
      </div>
    </div>
  
  <!-- Spinner Loading -->
  {:else if adaptiveType === 'spinner'}
    <div class="flex flex-col items-center space-y-4">
      <div 
        class="spinner {shouldAnimate ? 'animate-spin' : ''}"
        class:w-8={size === 'sm'}
        class:h-8={size === 'sm'}
        class:w-12={size === 'md'}
        class:h-12={size === 'md'}
        class:w-16={size === 'lg' || size === 'full'}
        class:h-16={size === 'lg' || size === 'full'}
      >
        <svg class="w-full h-full text-current" viewBox="0 0 24 24" fill="none">
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-dasharray="31.416" 
            stroke-dashoffset="15.708"
          />
        </svg>
      </div>
      
      {#if currentMessage}
        <p class="text-center font-medium max-w-xs">
          {currentMessage}
        </p>
      {/if}
    </div>
  
  <!-- Progress Loading -->
  {:else if adaptiveType === 'progress'}
    <div class="w-full max-w-md space-y-4">
      {#if currentMessage}
        <p class="text-center font-medium">{currentMessage}</p>
      {/if}
      
      <div class="relative">
        <!-- Progress bar background -->
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <!-- Progress bar fill -->
          <div 
            class="bg-current h-full rounded-full transition-all duration-500 ease-out"
            class:animate-pulse={shouldAnimate && progress === undefined}
            style="width: {progress !== undefined ? `${progress}%` : '60%'}"
          ></div>
        </div>
        
        <!-- Progress percentage -->
        {#if showPercentage && progress !== undefined}
          <div class="absolute -top-6 right-0 text-xs font-medium">
            {Math.round(progress)}%
          </div>
        {/if}
      </div>
      
      <!-- Connection speed indicator for slow connections -->
      {#if $connectionSpeed === 'slow'}
        <div class="flex items-center justify-center space-x-2 text-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span>Optimizando para conexión lenta</span>
        </div>
      {/if}
    </div>
  
  <!-- Shimmer Loading -->
  {:else if adaptiveType === 'shimmer'}
    <div class="w-full max-w-md">
      <div class="shimmer-container">
        <div class="shimmer-content">
          <div class="shimmer-line long"></div>
          <div class="shimmer-line short"></div>
          <div class="shimmer-line medium"></div>
          <div class="shimmer-line long"></div>
        </div>
      </div>
      
      {#if currentMessage}
        <p class="text-center font-medium mt-4">{currentMessage}</p>
      {/if}
    </div>
  
  <!-- Dots Loading (Optimized for slow connections) -->
  {:else if adaptiveType === 'dots'}
    <div class="flex flex-col items-center space-y-4">
      <div class="flex space-x-2">
        {#each Array(3) as _, i}
          <div 
            class="dot"
            class:w-2={size === 'sm'}
            class:h-2={size === 'sm'}
            class:w-3={size === 'md'}
            class:h-3={size === 'md'}
            class:w-4={size === 'lg' || size === 'full'}
            class:h-4={size === 'lg' || size === 'full'}
            class:animate-bounce={shouldAnimate}
            style="animation-delay: {i * 0.2}s;"
          ></div>
        {/each}
      </div>
      
      {#if currentMessage}
        <p class="text-center font-medium text-sm max-w-xs">
          {currentMessage}
        </p>
      {/if}
      
      <!-- Data usage indicator for slow connections -->
      {#if $connectionSpeed === 'slow'}
        <div class="text-xs text-center opacity-75">
          Modo de datos reducidos activado
        </div>
      {/if}
    </div>
  
  <!-- Booking-specific Loading -->
  {:else if adaptiveType === 'booking'}
    <div class="flex flex-col items-center space-y-6 max-w-sm">
      <!-- Booking icon -->
      <div class="relative">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {#if shouldAnimate}
          <div class="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
        {/if}
      </div>
      
      <!-- Booking steps -->
      <div class="space-y-2 text-center">
        <p class="font-semibold text-gray-900">{currentMessage}</p>
        
        <div class="flex justify-center space-x-2 mt-4">
          {#each Array(4) as _, i}
            <div 
              class="w-2 h-2 rounded-full"
              class:bg-blue-600={i <= currentMessageIndex}
              class:bg-gray-300={i > currentMessageIndex}
            ></div>
          {/each}
        </div>
        
        <!-- Argentina mobile optimization message -->
        {#if optimizeForMobile}
          <p class="text-xs text-gray-600 mt-2">
            Optimizado para dispositivos móviles
          </p>
        {/if}
      </div>
    </div>
  
  <!-- Payment-specific Loading -->
  {:else if adaptiveType === 'payment'}
    <div class="flex flex-col items-center space-y-6 max-w-sm">
      <!-- MercadoPago-style loading -->
      <div class="relative">
        <div class="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        
        {#if shouldAnimate}
          <!-- Security animation -->
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        {/if}
      </div>
      
      <div class="space-y-2 text-center">
        <p class="font-semibold text-gray-900">{currentMessage}</p>
        
        <!-- Security indicators -->
        <div class="flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div class="flex items-center space-x-1">
            <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Seguro</span>
          </div>
          
          <div class="flex items-center space-x-1">
            <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Cifrado</span>
          </div>
        </div>
        
        <p class="text-xs text-gray-500">
          Procesado por MercadoPago
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Base skeleton styles */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
  }
  
  .skeleton-text {
    height: 1em;
    margin: 0.5em 0;
  }
  
  .skeleton-text-sm {
    height: 0.875em;
    margin: 0.25em 0;
  }
  
  .skeleton-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
  }
  
  .skeleton-card {
    height: 200px;
    border-radius: 8px;
  }
  
  @keyframes skeleton-loading {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  /* Spinner styles */
  .spinner {
    border-radius: 50%;
  }
  
  /* Shimmer styles */
  .shimmer-container {
    position: relative;
    overflow: hidden;
    background: #f6f7f8;
    border-radius: 8px;
    height: 120px;
  }
  
  .shimmer-content {
    padding: 20px;
  }
  
  .shimmer-line {
    height: 12px;
    margin: 12px 0;
    background: #eee;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
  }
  
  .shimmer-line.short { width: 40%; }
  .shimmer-line.medium { width: 70%; }
  .shimmer-line.long { width: 90%; }
  
  .shimmer-line::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
  
  /* Dots styles */
  .dot {
    background-color: currentColor;
    border-radius: 50%;
    opacity: 0.7;
  }
  
  /* Fade in animation */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Mobile optimizations */
  .mobile-optimized {
    font-size: 16px; /* Prevent zoom on iOS */
    touch-action: manipulation;
  }
  
  .low-end-device * {
    will-change: auto; /* Reduce GPU usage */
  }
  
  /* Connection-specific styles */
  .loading-container {
    transition: background-color 0.5s ease;
  }
  
  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .skeleton,
    .shimmer-line::after,
    .spinner,
    .dot,
    .animate-fade-in {
      animation: none !important;
    }
    
    .skeleton {
      background: #f0f0f0;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .skeleton {
      background: #000;
      opacity: 0.1;
    }
    
    .loading-container {
      border-width: 2px;
      border-style: solid;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .skeleton {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    }
    
    .shimmer-container {
      background: #374151;
    }
    
    .shimmer-line {
      background: #4b5563;
    }
  }
</style>