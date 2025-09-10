# BarberPro Design System Implementation Guide

## Quick Start Guide for Frontend Developer

### 1. Installation & Setup

#### Required Dependencies
```bash
# Core UI dependencies
npm install @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
npm install @heroicons/react
npm install clsx class-variance-authority

# Fonts (add to app.html)
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### TailwindCSS Configuration
```typescript
// Copy tailwind.config.js from design-system/tokens/
// This includes all BarberPro design tokens and component utilities
```

#### CSS Variables Setup
```css
/* src/app.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

:root {
  /* BarberPro Custom Properties */
  --font-sans: 'Inter', 'Roboto', system-ui, sans-serif;
  --font-heading: 'Poppins', 'Inter', system-ui, sans-serif;
  
  /* Argentina-specific spacing */
  --content-max-width: 1280px;
  --mobile-padding: 1rem;
  --desktop-padding: 2rem;
  
  /* Touch targets */
  --touch-target-min: 44px;
  --button-height-sm: 40px;
  --button-height-base: 48px;
  --button-height-lg: 56px;
}

/* Spanish text optimization */
body {
  font-family: var(--font-sans);
  line-height: 1.6; /* Better for Spanish readability */
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

/* Mobile-first responsive utilities */
@media (max-width: 768px) {
  .mobile-full-width {
    margin-left: calc(-1 * var(--mobile-padding));
    margin-right: calc(-1 * var(--mobile-padding));
  }
}

/* Argentina accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Component Implementation Patterns

#### Button Component (SvelteKit)
```typescript
<!-- src/lib/components/Button.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  
  interface $$Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
    size?: 'sm' | 'base' | 'lg';
    loading?: boolean;
    icon?: any;
    iconPosition?: 'left' | 'right';
  }
  
  export let variant: $$Props['variant'] = 'primary';
  export let size: $$Props['size'] = 'base';
  export let loading: $$Props['loading'] = false;
  export let icon: $$Props['icon'] = undefined;
  export let iconPosition: $$Props['iconPosition'] = 'left';
  export let disabled: $$Props['disabled'] = false;
  export let type: $$Props['type'] = 'button';
  
  const dispatch = createEventDispatcher();
  
  $: buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    $$props.class
  ].filter(Boolean).join(' ');
  
  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button
  class={buttonClasses}
  {disabled}
  {type}
  on:click={handleClick}
  {...$$restProps}
>
  {#if loading}
    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
    </svg>
  {:else if icon && iconPosition === 'left'}
    <svelte:component this={icon} class="w-5 h-5" />
  {/if}
  
  <slot />
  
  {#if icon && iconPosition === 'right' && !loading}
    <svelte:component this={icon} class="w-5 h-5" />
  {/if}
</button>
```

#### Input Component (SvelteKit)
```typescript
<!-- src/lib/components/Input.svelte -->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  
  interface $$Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    icon?: any;
    iconPosition?: 'left' | 'right';
    required?: boolean;
  }
  
  export let label: $$Props['label'] = undefined;
  export let error: $$Props['error'] = undefined;
  export let success: $$Props['success'] = undefined;
  export let hint: $$Props['hint'] = undefined;
  export let icon: $$Props['icon'] = undefined;
  export let iconPosition: $$Props['iconPosition'] = 'left';
  export let required: $$Props['required'] = false;
  export let value: $$Props['value'] = '';
  export let id: $$Props['id'] = undefined;
  export let name: $$Props['name'] = undefined;
  export let type: $$Props['type'] = 'text';
  export let placeholder: $$Props['placeholder'] = '';
  export let disabled: $$Props['disabled'] = false;
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  $: inputClasses = [
    'form-input',
    error && 'form-input-error',
    success && 'form-input-success',
    icon && iconPosition === 'left' && 'pl-12',
    icon && iconPosition === 'right' && 'pr-12',
    $$props.class
  ].filter(Boolean).join(' ');
</script>

<div class="form-group">
  {#if label}
    <label 
      for={inputId}
      class="form-label"
      class:form-required={required}
    >
      {label}
    </label>
  {/if}
  
  <div class="relative">
    {#if icon}
      <div class="absolute inset-y-0 {iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none">
        <svelte:component this={icon} class="w-5 h-5 text-neutral-400" />
      </div>
    {/if}
    
    <input
      {id}
      {name}
      {type}
      {placeholder}
      {disabled}
      {required}
      class={inputClasses}
      bind:value
      {...$$restProps}
    />
  </div>
  
  {#if error}
    <p class="error-message">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      {error}
    </p>
  {:else if success}
    <p class="success-message">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      {success}
    </p>
  {:else if hint}
    <p class="form-help">{hint}</p>
  {/if}
</div>
```

#### Provider Card Component
```typescript
<!-- src/lib/components/ProviderCard.svelte -->
<script lang="ts">
  import { StarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
  
  export let provider: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    distance: number;
    priceFrom: number;
    imageUrl: string;
    availability: 'available' | 'busy' | 'unavailable';
    verified: boolean;
    services: string[];
  };
  
  export let onClick: (() => void) | undefined = undefined;
  
  $: availabilityConfig = {
    available: { dot: 'bg-success-500', text: 'text-success-600', label: 'Disponible' },
    busy: { dot: 'bg-warning-500', text: 'text-warning-600', label: 'Ocupado' },
    unavailable: { dot: 'bg-error-500', text: 'text-error-600', label: 'No disponible' }
  }[provider.availability];
</script>

<div 
  class="card card-interactive provider-card"
  on:click={onClick}
  on:keydown={(e) => e.key === 'Enter' && onClick?.()}
  role="button"
  tabindex="0"
>
  <div class="provider-card-image-container">
    <img 
      src={provider.imageUrl} 
      alt={provider.name}
      class="provider-card-image"
      loading="lazy"
    />
    {#if provider.verified}
      <div class="absolute top-2 right-2">
        <div class="badge badge-primary">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          Verificado
        </div>
      </div>
    {/if}
  </div>
  
  <div class="provider-card-content">
    <div class="provider-card-header">
      <h3 class="provider-name">{provider.name}</h3>
      <div class="availability-status">
        <div class="status-dot {availabilityConfig.dot}"></div>
        <span class="status-text {availabilityConfig.text}">
          {availabilityConfig.label}
        </span>
      </div>
    </div>
    
    <div class="provider-rating">
      <div class="rating-stars">
        {#each Array(5) as _, i}
          <StarIcon 
            class="star {i < Math.floor(provider.rating) ? 'text-warning-400' : 'text-neutral-300'}"
          />
        {/each}
      </div>
      <span class="rating-text">
        {provider.rating} ({provider.reviewCount} reseñas)
      </span>
    </div>
    
    <div class="provider-location">
      <MapPinIcon class="location-icon" />
      <span>{provider.distance}km de distancia</span>
    </div>
    
    <div class="service-tags">
      {#each provider.services as service}
        <span class="service-tag">{service}</span>
      {/each}
    </div>
    
    <div class="provider-pricing">
      <span class="price-from">Desde</span>
      <span class="price-amount price-format">${provider.priceFrom}</span>
    </div>
  </div>
</div>

<style>
  .provider-card {
    @apply flex flex-col overflow-hidden;
  }
  
  .provider-card-image-container {
    @apply relative;
  }
  
  .provider-card-image {
    @apply w-full h-48 object-cover bg-neutral-100;
  }
  
  .provider-card-content {
    @apply p-5 flex-1 flex flex-col;
  }
  
  .provider-card-header {
    @apply flex justify-between items-start mb-3;
  }
  
  .provider-name {
    @apply text-lg font-semibold text-neutral-800;
  }
  
  .availability-status {
    @apply flex items-center gap-1.5;
  }
  
  .status-dot {
    @apply w-2 h-2 rounded-full;
  }
  
  .status-text {
    @apply text-sm font-medium;
  }
  
  .provider-rating {
    @apply flex items-center gap-2 mb-2;
  }
  
  .rating-stars {
    @apply flex gap-0.5;
  }
  
  .star {
    @apply w-4 h-4;
  }
  
  .rating-text {
    @apply text-sm text-neutral-500;
  }
  
  .provider-location {
    @apply flex items-center gap-1.5 mb-3;
  }
  
  .location-icon {
    @apply w-4 h-4 text-neutral-500;
  }
  
  .service-tags {
    @apply flex flex-wrap gap-1.5 mb-4;
  }
  
  .service-tag {
    @apply bg-primary-50 text-primary-600 px-2 py-1 rounded text-xs font-medium;
  }
  
  .provider-pricing {
    @apply mt-auto pt-3 border-t border-neutral-200;
  }
  
  .price-from {
    @apply text-sm text-neutral-500 mr-2;
  }
  
  .price-amount {
    @apply text-xl font-semibold;
  }
</style>
```

### 3. Layout System

#### Mobile-First Layout
```typescript
<!-- src/lib/components/Layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import BottomNavigation from './BottomNavigation.svelte';
  import TopHeader from './TopHeader.svelte';
  
  export let showBottomNav = true;
  export let showHeader = true;
  export let headerTitle = '';
  export let maxWidth = 'max-w-screen-xl';
  
  $: isDesktop = false; // Will be set by media query in onMount
  
  import { onMount } from 'svelte';
  
  onMount(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    isDesktop = mediaQuery.matches;
    
    const handler = (e: MediaQueryListEvent) => {
      isDesktop = e.matches;
    };
    
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  });
</script>

<div class="min-h-screen bg-neutral-50">
  {#if showHeader}
    <TopHeader title={headerTitle} />
  {/if}
  
  <main 
    class="flex-1"
    class:pb-20={showBottomNav && !isDesktop}
    class:pt-16={showHeader}
  >
    <div class="container mx-auto px-4 {maxWidth}">
      <slot />
    </div>
  </main>
  
  {#if showBottomNav && !isDesktop}
    <BottomNavigation />
  {/if}
</div>
```

### 4. Responsive Implementation

#### Breakpoint Usage
```css
/* Mobile-first approach with Argentina considerations */

/* Extra small devices (phones) */
@media (min-width: 375px) {
  /* Base mobile styles - primary design target */
}

/* Small devices (large phones) */
@media (min-width: 640px) {
  .container { max-width: 640px; }
  /* Improved spacing for larger phones */
}

/* Medium devices (tablets) */
@media (min-width: 768px) {
  .container { max-width: 768px; }
  /* Hide bottom navigation, show desktop nav */
  .bottom-nav { display: none; }
  .desktop-nav { display: flex; }
}

/* Large devices (desktops) */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  /* Multi-column layouts */
  .grid-desktop { grid-template-columns: 1fr 2fr; }
}

/* Extra large devices */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
  /* Maximum content width for readability */
}
```

### 5. State Management Patterns

#### Loading States
```typescript
<!-- Loading states with BarberPro patterns -->
<script lang="ts">
  export let loading = false;
  export let error = null;
  export let data = null;
</script>

{#if loading}
  <div class="space-y-4">
    <!-- Provider card skeleton -->
    <div class="card">
      <div class="skeleton skeleton-image mb-4"></div>
      <div class="skeleton skeleton-text mb-2"></div>
      <div class="skeleton skeleton-text-sm mb-3"></div>
      <div class="flex gap-2 mb-3">
        <div class="skeleton w-16 h-6 rounded-full"></div>
        <div class="skeleton w-20 h-6 rounded-full"></div>
      </div>
      <div class="skeleton skeleton-text-sm"></div>
    </div>
  </div>
{:else if error}
  <div class="text-center py-8">
    <div class="text-error-600 mb-4">
      <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-neutral-800 mb-2">
      Algo salió mal
    </h3>
    <p class="text-neutral-600 mb-4">{error}</p>
    <Button variant="primary" on:click={() => window.location.reload()}>
      Intentar nuevamente
    </Button>
  </div>
{:else if data}
  <slot {data} />
{/if}
```

### 6. Argentina-Specific Implementations

#### Currency Formatting
```typescript
// src/lib/utils/currency.ts
export function formatArgentineCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount);
}

// Usage in components
$: formattedPrice = formatArgentineCurrency(provider.price);
```

#### Phone Number Formatting
```typescript
// src/lib/utils/phone.ts
export function formatArgentinePhone(phone: string): string {
  // Format: +54 9 11 1234-5678
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('54')) {
    return `+54 9 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  }
  return phone;
}
```

#### Date/Time Formatting
```typescript
// src/lib/utils/date.ts
export function formatArgentineDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatArgentineTime(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}
```

### 7. Performance Optimizations

#### Image Optimization
```typescript
<!-- Optimized image component -->
<script lang="ts">
  export let src: string;
  export let alt: string;
  export let width: number = 400;
  export let height: number = 300;
  export let lazy: boolean = true;
  
  $: srcSet = [
    `${src}?w=${width}&h=${height}&q=75 1x`,
    `${src}?w=${width * 2}&h=${height * 2}&q=75 2x`
  ].join(', ');
</script>

<img 
  {srcSet}
  {alt}
  loading={lazy ? 'lazy' : 'eager'}
  decoding="async"
  class="w-full h-auto object-cover"
  style="aspect-ratio: {width}/{height}"
/>
```

#### Bundle Size Optimization
```typescript
// Lazy load components
export const LazyProviderDashboard = lazy(() => import('./ProviderDashboard.svelte'));
export const LazyBookingModal = lazy(() => import('./BookingModal.svelte'));

// Tree-shake Heroicons
import { 
  StarIcon,
  MapPinIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
```

### 8. Testing Patterns

#### Component Testing
```typescript
// tests/components/Button.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import Button from '$lib/components/Button.svelte';

describe('Button Component', () => {
  it('renders with correct variant styles', () => {
    const { container } = render(Button, {
      props: { variant: 'primary' }
    });
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('btn-primary');
  });
  
  it('handles loading state correctly', () => {
    const { container } = render(Button, {
      props: { loading: true }
    });
    
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
```

### 9. Accessibility Implementation

#### Focus Management
```typescript
// src/lib/utils/focus.ts
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
  
  element.addEventListener('keydown', handleKeydown);
  return () => element.removeEventListener('keydown', handleKeydown);
}
```

### 10. Development Workflow

#### Component Checklist
- [ ] Mobile-first responsive design
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Loading and error states
- [ ] Spanish localization ready
- [ ] Touch-friendly (44px+ targets)
- [ ] Performance optimized
- [ ] TailwindCSS utility classes
- [ ] TypeScript types defined
- [ ] Argentina market considerations

This implementation guide provides everything needed to build BarberPro's frontend with consistent design patterns, accessibility, and Argentina market optimization.