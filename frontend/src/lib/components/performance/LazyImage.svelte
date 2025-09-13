<!-- LazyImage.svelte - Optimized image loading for Argentina mobile users -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { connectionSpeed } from '$lib/services/ux-optimization';
  
  interface ImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    class?: string;
    lazy?: boolean;
    quality?: 'low' | 'medium' | 'high' | 'auto';
    placeholder?: 'blur' | 'skeleton' | 'color';
    fallback?: string;
    sizes?: string;
    srcset?: string;
  }
  
  // Props
  export let src: string;
  export let alt: string;
  export let width: number | undefined = undefined;
  export let height: number | undefined = undefined;
  export let lazy = true;
  export let quality: 'low' | 'medium' | 'high' | 'auto' = 'auto';
  export let placeholder: 'blur' | 'skeleton' | 'color' = 'skeleton';
  export let fallback = '/images/placeholder.svg';
  export let sizes: string | undefined = undefined;
  export let srcset: string | undefined = undefined;
  
  let className = '';
  export { className as class };
  
  const dispatch = createEventDispatcher<{
    load: { src: string };
    error: { src: string; error: Event };
  }>();
  
  // State
  let imageElement: HTMLImageElement;
  let isLoaded = false;
  let hasError = false;
  let isIntersecting = false;
  let observer: IntersectionObserver | null = null;
  
  // Adaptive quality based on connection speed
  $: adaptiveQuality = quality === 'auto' ? getAdaptiveQuality($connectionSpeed) : quality;
  $: optimizedSrc = getOptimizedSrc(src, adaptiveQuality);
  $: shouldLoad = !lazy || isIntersecting;
  
  function getAdaptiveQuality(speed: string): 'low' | 'medium' | 'high' {
    switch (speed) {
      case 'slow':
        return 'low';
      case 'medium':
        return 'medium';
      case 'fast':
        return 'high';
      default:
        return 'medium';
    }
  }
  
  function getOptimizedSrc(originalSrc: string, targetQuality: string): string {
    // In a real implementation, this would integrate with an image CDN
    // For now, we'll use URL parameters to hint at quality preferences
    if (!originalSrc) return fallback;
    
    const url = new URL(originalSrc, window.location.origin);
    
    // Add quality parameters for image optimization services
    switch (targetQuality) {
      case 'low':
        url.searchParams.set('quality', '60');
        url.searchParams.set('format', 'webp');
        break;
      case 'medium':
        url.searchParams.set('quality', '75');
        url.searchParams.set('format', 'webp');
        break;
      case 'high':
        url.searchParams.set('quality', '90');
        url.searchParams.set('format', 'auto');
        break;
    }
    
    return url.toString();
  }
  
  onMount(() => {
    if (!browser) return;
    
    if (lazy && 'IntersectionObserver' in window) {
      // Set up intersection observer for lazy loading
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isIntersecting = true;
              if (observer) {
                observer.disconnect();
                observer = null;
              }
            }
          });
        },
        {
          // Start loading when image is 100px away from viewport
          rootMargin: '100px 0px',
          threshold: 0
        }
      );
      
      if (imageElement) {
        observer.observe(imageElement);
      }
    } else {
      // Load immediately if not lazy or IntersectionObserver not supported
      isIntersecting = true;
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  });
  
  function handleLoad(event: Event) {
    isLoaded = true;
    hasError = false;
    dispatch('load', { src: optimizedSrc });
  }
  
  function handleError(event: Event) {
    hasError = true;
    isLoaded = false;
    dispatch('error', { src: optimizedSrc, error: event });
    
    // Try fallback image
    if (imageElement && optimizedSrc !== fallback) {
      imageElement.src = fallback;
    }
  }
  
  function getPlaceholderStyle(): string {
    const baseStyle = width && height ? `width: ${width}px; height: ${height}px;` : '';
    
    switch (placeholder) {
      case 'blur':
        return `${baseStyle} filter: blur(5px); background: #f3f4f6;`;
      case 'color':
        return `${baseStyle} background: #e5e7eb;`;
      case 'skeleton':
      default:
        return `${baseStyle} background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;`;
    }
  }
</script>

<!-- Image container -->
<div 
  class="lazy-image-container {className}"
  class:loading={!isLoaded && !hasError}
  class:loaded={isLoaded}
  class:error={hasError}
  style={!isLoaded && !hasError ? getPlaceholderStyle() : ''}
>
  {#if shouldLoad}
    <img
      bind:this={imageElement}
      src={optimizedSrc}
      {alt}
      {width}
      {height}
      {sizes}
      {srcset}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      class="lazy-image"
      class:opacity-0={!isLoaded}
      class:opacity-100={isLoaded}
      on:load={handleLoad}
      on:error={handleError}
    />
  {:else if lazy}
    <!-- Placeholder while not in viewport -->
    <div 
      bind:this={imageElement}
      class="lazy-placeholder"
      style={getPlaceholderStyle()}
      role="img"
      aria-label={alt}
    >
      {#if placeholder === 'skeleton'}
        <div class="skeleton-shimmer"></div>
      {/if}
    </div>
  {/if}
  
  {#if hasError}
    <!-- Error state -->
    <div class="error-placeholder" style={getPlaceholderStyle()}>
      <svg 
        class="error-icon" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
      <span class="error-text">Imagen no disponible</span>
    </div>
  {/if}
</div>

<style>
  .lazy-image-container {
    position: relative;
    overflow: hidden;
    display: inline-block;
    background-color: #f3f4f6;
  }
  
  .lazy-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease-in-out;
  }
  
  .lazy-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
  }
  
  .skeleton-shimmer {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
  
  .error-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f9fafb;
    border: 1px dashed #d1d5db;
    color: #6b7280;
  }
  
  .error-icon {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }
  
  .error-text {
    font-size: 0.75rem;
    text-align: center;
    opacity: 0.7;
  }
  
  /* Responsive design for Argentina mobile users */
  @media (max-width: 640px) {
    .lazy-image-container {
      border-radius: 8px;
    }
    
    .error-icon {
      width: 1.5rem;
      height: 1.5rem;
    }
    
    .error-text {
      font-size: 0.625rem;
    }
  }
  
  /* Animation for skeleton loading */
  @keyframes skeleton-loading {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .lazy-image {
      transition: none;
    }
    
    .skeleton-shimmer {
      animation: none;
      background: #f0f0f0;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .lazy-image-container {
      border: 1px solid #000;
    }
    
    .error-placeholder {
      border-color: #000;
      background-color: #fff;
      color: #000;
    }
  }
  
  /* Utilities */
  .opacity-0 {
    opacity: 0;
  }
  
  .opacity-100 {
    opacity: 1;
  }
</style>