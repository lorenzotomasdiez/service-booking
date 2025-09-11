# Frontend Developer Handoff - Day 2 Design Deliverables
*BarberPro - Premium Argentina Barber Booking Platform*

## Handoff Overview
**Deliverable:** Complete UI/UX designs for core booking flows  
**Target:** SvelteKit + TailwindCSS implementation  
**Timeline:** Ready for immediate development  
**Priority:** Critical path items for MVP launch  

---

## 📋 Completed Design Deliverables

### **1. Service Discovery Interface** ✅
- **File:** `/design-system/screens/service-discovery-interface.md`
- **Status:** Complete and ready for implementation
- **Components:** Search, filters, service cards, map integration, empty states

### **2. Complete Booking Flow** ✅
- **File:** `/design-system/screens/booking-flow-complete.md`
- **Status:** Complete and ready for implementation
- **Components:** Service details, time picker, booking confirmation, payment integration

### **3. Provider Dashboard** ✅
- **File:** `/design-system/screens/provider-dashboard-detailed.md`
- **Status:** Complete and ready for implementation
- **Components:** Calendar, service management, analytics, client management, notifications

### **4. Accessibility Guidelines** ✅
- **File:** `/design-system/accessibility/accessibility-guidelines.md`
- **Status:** Complete WCAG 2.1 AA compliance guide
- **Coverage:** Color contrast, keyboard navigation, screen readers, motor accessibility

---

## 🎨 Design System Integration

### **TailwindCSS Configuration**
```javascript
// tailwind.config.js - BarberPro Theme Extension
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // BarberPro Brand Colors
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Main brand
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Trust/Success colors
        trust: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // Main trust color
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        
        // Warning colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // Main warning
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Main error
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Neutral grays
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      
      // Custom spacing for Argentina mobile-first
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Custom border radius
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      
      // Box shadows
      boxShadow: {
        'card': '0 4px 12px rgba(37, 99, 235, 0.1)',
        'card-hover': '0 8px 25px rgba(37, 99, 235, 0.15)',
        'focus': '0 0 0 3px rgba(37, 99, 235, 0.1)',
      },
      
      // Animation
      animation: {
        'bounce-gentle': 'bounce-gentle 0.6s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'skeleton': 'skeleton 1.5s infinite',
      },
      
      keyframes: {
        'bounce-gentle': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'skeleton': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

### **Component Architecture**
```typescript
// Component structure for SvelteKit
src/
├── lib/
│   ├── components/
│   │   ├── ui/               // Base UI components
│   │   │   ├── Button.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Card.svelte
│   │   │   └── Toast.svelte
│   │   ├── booking/          // Booking flow components
│   │   │   ├── ServiceCard.svelte
│   │   │   ├── TimeSlotPicker.svelte
│   │   │   ├── BookingForm.svelte
│   │   │   └── PaymentSelector.svelte
│   │   ├── search/           // Discovery components
│   │   │   ├── SearchBar.svelte
│   │   │   ├── FilterPanel.svelte
│   │   │   ├── ServiceGrid.svelte
│   │   │   └── MapView.svelte
│   │   └── provider/         // Provider dashboard
│   │       ├── Calendar.svelte
│   │       ├── ServiceManager.svelte
│   │       ├── AnalyticsDashboard.svelte
│   │       └── ClientList.svelte
│   ├── stores/               // Svelte stores
│   ├── utils/                // Utility functions
│   └── types/                // TypeScript types
└── routes/                   // SvelteKit routes
```

---

## 🔧 Implementation Guidelines

### **Mobile-First Development**
```scss
// Base styles - Mobile first (375px+)
.component {
  // Mobile styles here
  padding: 1rem;
  font-size: 14px;
  
  // Tablet (768px+)
  @screen md {
    padding: 1.5rem;
    font-size: 16px;
  }
  
  // Desktop (1024px+)
  @screen lg {
    padding: 2rem;
    font-size: 18px;
  }
  
  // Wide screens (1280px+)
  @screen xl {
    padding: 2.5rem;
  }
}
```

### **Touch Target Requirements**
```scss
// Minimum touch targets for Argentina mobile users
.touch-target {
  @apply min-w-[44px] min-h-[44px] flex items-center justify-center;
  
  // Critical actions get larger targets
  &.critical {
    @apply min-w-[56px] min-h-[56px];
  }
  
  // Ensure adequate spacing
  @apply m-1;
}

// Form inputs optimized for mobile
.mobile-input {
  @apply min-h-[48px] px-4 py-3 text-base; // 16px prevents iOS zoom
  @apply rounded-lg border-2 border-gray-300;
  @apply focus:border-primary-600 focus:ring-2 focus:ring-primary-100;
}
```

### **Argentina-Specific Patterns**
```typescript
// Currency formatting for Argentina
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount);
}

// Date formatting for Argentina
export function formatArgentinaDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Phone number validation for Argentina
export function validateArgentinaPhone(phone: string): boolean {
  // Argentina phone patterns: +54 11 1234 5678 or 11 1234 5678
  const pattern = /^(\+54\s?)?(\d{2,4})\s?(\d{4})\s?(\d{4})$/;
  return pattern.test(phone.replace(/\s/g, ''));
}
```

---

## 📱 Component Implementation Examples

### **Service Card Component**
```svelte
<!-- ServiceCard.svelte -->
<script lang="ts">
  import type { Service } from '$lib/types';
  
  export let service: Service;
  export let onSelect: (service: Service) => void;
  
  const handleClick = () => onSelect(service);
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };
</script>

<article 
  class="service-card group"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keypress={handleKeyPress}
  aria-labelledby="service-title-{service.id}"
  aria-describedby="service-details-{service.id}"
>
  <div class="relative h-20 mb-3 rounded-lg overflow-hidden bg-gray-100">
    <img 
      src={service.imageUrl} 
      alt="Foto de {service.providerName} mostrando {service.name}"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
    />
    
    {#if service.isPopular}
      <div class="absolute top-2 right-2 bg-warning-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
        🔥 Popular
      </div>
    {/if}
  </div>
  
  <div class="flex-1">
    <h3 id="service-title-{service.id}" class="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
      {service.name}
    </h3>
    
    <p class="text-sm text-gray-600 mb-2">{service.providerName}</p>
    
    <div id="service-details-{service.id}" class="flex items-center gap-3 mb-2 text-sm">
      <div class="flex items-center gap-1" aria-label="Calificación {service.rating} de 5 estrellas">
        <span class="text-yellow-400">⭐</span>
        <span class="font-medium">{service.rating}</span>
        <span class="text-gray-500">({service.reviewCount})</span>
      </div>
      
      <div class="flex items-center gap-1 text-gray-500" aria-label="Distancia {service.distance} kilómetros">
        <span>📍</span>
        <span>{service.distance} km</span>
      </div>
    </div>
    
    <div class="flex justify-between items-center">
      <div class="price-info">
        <span class="text-lg font-bold text-trust-600" aria-label="Precio desde {formatARS(service.price)}">
          desde {formatARS(service.price)}
        </span>
      </div>
      
      <div class="availability">
        {#if service.availableToday}
          <span class="text-xs bg-trust-100 text-trust-700 px-2 py-1 rounded-full font-medium">
            Disponible hoy
          </span>
        {:else}
          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {service.nextAvailability}
          </span>
        {/if}
      </div>
    </div>
  </div>
</article>

<style>
  .service-card {
    @apply flex p-4 bg-white border border-gray-200 rounded-xl cursor-pointer;
    @apply transition-all duration-200 hover:border-primary-300 hover:shadow-card;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
    @apply active:scale-[0.98];
  }
  
  .service-card img {
    @apply w-20 h-20 mr-3 rounded-lg object-cover bg-gray-100;
  }
  
  @media (max-width: 480px) {
    .service-card {
      @apply p-3;
    }
    
    .service-card img {
      @apply w-16 h-16;
    }
  }
</style>
```

### **Time Slot Picker Component**
```svelte
<!-- TimeSlotPicker.svelte -->
<script lang="ts">
  import type { TimeSlot } from '$lib/types';
  
  export let availableSlots: TimeSlot[];
  export let selectedSlot: TimeSlot | null = null;
  export let onSlotSelect: (slot: TimeSlot) => void;
  
  const timeSlots = groupSlotsByPeriod(availableSlots);
  
  function groupSlotsByPeriod(slots: TimeSlot[]) {
    const periods = {
      morning: slots.filter(slot => slot.hour < 12),
      afternoon: slots.filter(slot => slot.hour >= 12 && slot.hour < 18),
      evening: slots.filter(slot => slot.hour >= 18)
    };
    return periods;
  }
  
  function handleSlotSelect(slot: TimeSlot) {
    if (!slot.isAvailable) return;
    selectedSlot = slot;
    onSlotSelect(slot);
  }
  
  function handleKeyPress(e: KeyboardEvent, slot: TimeSlot) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSlotSelect(slot);
    }
  }
</script>

<div class="time-slot-picker">
  <div class="picker-header mb-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-1">
      Selecciona un horario
    </h3>
    <p class="text-sm text-gray-600">
      {availableSlots.length} horarios disponibles
    </p>
  </div>
  
  {#each Object.entries(timeSlots) as [period, slots]}
    {#if slots.length > 0}
      <div class="time-period mb-6">
        <h4 class="period-title">
          {period === 'morning' ? 'Mañana' : period === 'afternoon' ? 'Tarde' : 'Noche'}
        </h4>
        
        <div class="slots-grid">
          {#each slots as slot}
            <button
              type="button"
              class="time-slot"
              class:selected={selectedSlot?.id === slot.id}
              class:unavailable={!slot.isAvailable}
              class:popular={slot.isPopular}
              disabled={!slot.isAvailable}
              on:click={() => handleSlotSelect(slot)}
              on:keypress={(e) => handleKeyPress(e, slot)}
              aria-label="Horario {slot.time} - {slot.isAvailable ? 'disponible' : 'no disponible'}"
            >
              <div class="slot-time">{slot.time}</div>
              {#if slot.discountPrice}
                <div class="slot-price">{formatARS(slot.discountPrice)}</div>
              {:else}
                <div class="slot-price">{formatARS(slot.price)}</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
  .time-slot-picker {
    @apply bg-white rounded-xl border border-gray-200 p-4;
  }
  
  .period-title {
    @apply text-sm font-semibold text-gray-700 mb-3 pl-2;
    @apply relative before:content-[''] before:absolute before:left-0 before:top-1/2;
    @apply before:transform before:-translate-y-1/2 before:w-3 before:h-4;
    @apply before:bg-primary-600 before:rounded-sm;
  }
  
  .slots-grid {
    @apply grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2;
  }
  
  .time-slot {
    @apply min-h-[60px] p-3 border border-gray-200 rounded-lg text-center;
    @apply transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500;
    @apply hover:border-primary-300 hover:bg-gray-50;
  }
  
  .time-slot.selected {
    @apply bg-primary-600 border-primary-600 text-white;
  }
  
  .time-slot.unavailable {
    @apply bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed;
    @apply hover:border-gray-200 hover:bg-gray-100;
  }
  
  .time-slot.popular::after {
    content: '🔥';
    @apply absolute -top-2 -right-2 text-base;
  }
  
  .slot-time {
    @apply text-sm font-semibold mb-1;
  }
  
  .slot-price {
    @apply text-xs text-trust-600 font-medium;
  }
  
  .time-slot.selected .slot-price {
    @apply text-primary-100;
  }
  
  .time-slot.unavailable .slot-price {
    @apply hidden;
  }
  
  @media (max-width: 480px) {
    .slots-grid {
      @apply grid-cols-2;
    }
    
    .time-slot {
      @apply min-h-[64px] p-2;
    }
  }
</style>
```

### **Search Bar Component**
```svelte
<!-- SearchBar.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debounce } from '$lib/utils';
  
  export let value = '';
  export let placeholder = 'Buscar barbería o servicio...';
  export let suggestions: string[] = [];
  
  const dispatch = createEventDispatcher();
  
  let showSuggestions = false;
  let activeSuggestionIndex = -1;
  let inputElement: HTMLInputElement;
  
  const debouncedSearch = debounce((query: string) => {
    dispatch('search', { query });
  }, 300);
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    
    if (value.length >= 2) {
      debouncedSearch(value);
      showSuggestions = true;
      activeSuggestionIndex = -1;
    } else {
      showSuggestions = false;
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, suggestions.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          selectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        showSuggestions = false;
        activeSuggestionIndex = -1;
        break;
    }
  }
  
  function selectSuggestion(suggestion: string) {
    value = suggestion;
    showSuggestions = false;
    activeSuggestionIndex = -1;
    dispatch('search', { query: suggestion });
  }
  
  function handleSearch() {
    dispatch('search', { query: value });
    showSuggestions = false;
  }
  
  function handleClear() {
    value = '';
    showSuggestions = false;
    dispatch('clear');
    inputElement.focus();
  }
</script>

<div class="search-container" role="search" aria-label="Buscar servicios de barbería">
  <div class="search-input-wrapper">
    <input
      bind:this={inputElement}
      type="search"
      bind:value
      {placeholder}
      class="search-input"
      aria-label="Buscar por nombre de barbería, servicio o ubicación"
      aria-expanded={showSuggestions}
      aria-autocomplete="list"
      aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:focus={() => value.length >= 2 && (showSuggestions = true)}
      on:blur={() => setTimeout(() => showSuggestions = false, 200)}
    />
    
    {#if value}
      <button
        type="button"
        class="clear-button"
        aria-label="Limpiar búsqueda"
        on:click={handleClear}
      >
        ✕
      </button>
    {/if}
    
    <button
      type="button"
      class="search-button"
      aria-label="Buscar servicios"
      on:click={handleSearch}
    >
      🔍
    </button>
  </div>
  
  {#if showSuggestions && suggestions.length > 0}
    <div class="suggestions-dropdown" role="listbox" aria-label="Sugerencias de búsqueda">
      {#each suggestions as suggestion, index}
        <button
          type="button"
          class="suggestion-item"
          class:active={index === activeSuggestionIndex}
          role="option"
          id="suggestion-{index}"
          aria-selected={index === activeSuggestionIndex}
          on:click={() => selectSuggestion(suggestion)}
        >
          <span class="suggestion-icon">🔍</span>
          <span class="suggestion-text">{suggestion}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-container {
    @apply relative w-full;
  }
  
  .search-input-wrapper {
    @apply relative;
  }
  
  .search-input {
    @apply w-full h-12 pl-4 pr-20 border-2 border-gray-200 rounded-xl;
    @apply text-base bg-white transition-colors duration-200;
    @apply focus:border-primary-600 focus:ring-2 focus:ring-primary-100 focus:outline-none;
    @apply placeholder-gray-400;
    font-size: 16px; /* Prevents iOS zoom */
  }
  
  .clear-button {
    @apply absolute right-12 top-1/2 transform -translate-y-1/2;
    @apply w-6 h-6 flex items-center justify-center;
    @apply text-gray-400 hover:text-gray-600 transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 rounded;
  }
  
  .search-button {
    @apply absolute right-3 top-1/2 transform -translate-y-1/2;
    @apply w-8 h-8 flex items-center justify-center;
    @apply text-gray-400 hover:text-primary-600 transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 rounded;
  }
  
  .suggestions-dropdown {
    @apply absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200;
    @apply rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto;
  }
  
  .suggestion-item {
    @apply w-full flex items-center gap-3 px-4 py-3 text-left;
    @apply hover:bg-gray-50 transition-colors;
    @apply focus:outline-none focus:bg-primary-50 focus:text-primary-700;
    @apply border-b border-gray-100 last:border-b-0;
  }
  
  .suggestion-item.active {
    @apply bg-primary-50 text-primary-700;
  }
  
  .suggestion-icon {
    @apply text-gray-400;
  }
  
  .suggestion-text {
    @apply flex-1 text-sm text-gray-700;
  }
  
  .suggestion-item.active .suggestion-text {
    @apply text-primary-700;
  }
</style>
```

---

## 🎯 Performance Requirements

### **Core Web Vitals Targets**
```typescript
// Performance budgets for BarberPro
const PERFORMANCE_TARGETS = {
  // Core Web Vitals
  LCP: 2.5, // Largest Contentful Paint (seconds)
  FID: 100, // First Input Delay (milliseconds)
  CLS: 0.1, // Cumulative Layout Shift
  
  // Additional metrics
  FCP: 1.8, // First Contentful Paint (seconds)
  TTI: 3.8, // Time to Interactive (seconds)
  
  // Argentina 3G network targets
  SLOW_3G_LCP: 4.0,
  SLOW_3G_FCP: 3.0,
};
```

### **Image Optimization**
```typescript
// Image optimization for Argentina market
export const imageConfig = {
  formats: ['webp', 'jpg'], // WebP with JPEG fallback
  sizes: {
    thumbnail: { width: 80, height: 80 },
    card: { width: 320, height: 180 },
    hero: { width: 800, height: 400 },
  },
  quality: {
    low: 60,  // For slow connections
    medium: 75, // Default
    high: 85,   // For retina displays
  },
  lazy: true, // Lazy loading by default
  placeholder: 'blur', // Blur placeholder
};
```

### **Bundle Size Limits**
```javascript
// Webpack/Vite bundle analysis
const BUNDLE_LIMITS = {
  // Initial bundle (critical path)
  initial: '150KB', // Gzipped
  
  // Route-based chunks
  page: '50KB',     // Per page chunk
  component: '25KB', // Per component chunk
  
  // Vendor libraries
  vendor: '100KB',   // Third-party code
  
  // Total app size
  total: '500KB',    // All chunks combined
};
```

---

## 🧪 Testing Requirements

### **Component Testing**
```typescript
// Example test for ServiceCard component
import { render, fireEvent, screen } from '@testing-library/svelte';
import { axe, toHaveNoViolations } from 'jest-axe';
import ServiceCard from '$lib/components/ServiceCard.svelte';

expect.extend(toHaveNoViolations);

describe('ServiceCard', () => {
  const mockService = {
    id: '1',
    name: 'Corte clásico',
    providerName: 'Barbería Los Amigos',
    price: 1500,
    rating: 4.8,
    reviewCount: 127,
    distance: 2.3,
    availableToday: true,
    imageUrl: '/test-image.jpg'
  };

  test('renders service information correctly', () => {
    render(ServiceCard, { service: mockService });
    
    expect(screen.getByText('Corte clásico')).toBeInTheDocument();
    expect(screen.getByText('Barbería Los Amigos')).toBeInTheDocument();
    expect(screen.getByText('desde $1.500')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('Disponible hoy')).toBeInTheDocument();
  });

  test('handles click events', async () => {
    const onSelect = jest.fn();
    render(ServiceCard, { service: mockService, onSelect });
    
    await fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockService);
  });

  test('handles keyboard navigation', async () => {
    const onSelect = jest.fn();
    render(ServiceCard, { service: mockService, onSelect });
    
    const card = screen.getByRole('button');
    card.focus();
    
    await fireEvent.keyPress(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(mockService);
    
    await fireEvent.keyPress(card, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  test('meets accessibility standards', async () => {
    const { container } = render(ServiceCard, { service: mockService });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('displays proper ARIA labels', () => {
    render(ServiceCard, { service: mockService });
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-labelledby');
    expect(card).toHaveAttribute('aria-describedby');
  });
});
```

### **E2E Testing Scenarios**
```typescript
// Playwright E2E tests for booking flow
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('complete booking journey', async ({ page }) => {
    // Start from search
    await page.goto('/');
    await page.fill('[aria-label="Buscar por nombre de barbería, servicio o ubicación"]', 'corte');
    await page.press('[aria-label="Buscar por nombre de barbería, servicio o ubicación"]', 'Enter');
    
    // Select service
    await page.click('[aria-labelledby*="service-title"]').first();
    
    // Select time slot
    await page.click('[aria-label*="Horario"][aria-label*="disponible"]').first();
    
    // Fill booking form
    await page.fill('#client-name', 'Juan Pérez');
    await page.fill('#client-phone', '11 1234 5678');
    await page.fill('#client-email', 'juan@example.com');
    
    // Submit booking
    await page.click('[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Reserva confirmada')).toBeVisible();
    
    // Check accessibility
    await expect(page).toPassA11yAudit();
  });

  test('mobile booking flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile-specific interactions
    // ... mobile-specific test steps
  });
});
```

---

## 📝 Implementation Checklist

### **Phase 1: Foundation (Week 1)**
- [ ] Set up TailwindCSS configuration with BarberPro theme
- [ ] Create base UI components (Button, Input, Card, Modal)
- [ ] Implement responsive layout system
- [ ] Set up accessibility testing framework
- [ ] Configure image optimization

### **Phase 2: Service Discovery (Week 1-2)**
- [ ] Implement SearchBar component with autocomplete
- [ ] Build ServiceCard with all interactive states
- [ ] Create FilterPanel with Argentina-specific filters
- [ ] Integrate map view with Google Maps API
- [ ] Add empty states and loading animations

### **Phase 3: Booking Flow (Week 2)**
- [ ] Build TimeSlotPicker with calendar integration
- [ ] Create BookingForm with validation
- [ ] Implement PaymentSelector for MercadoPago
- [ ] Add booking confirmation flow
- [ ] Integrate real-time availability updates

### **Phase 4: Provider Dashboard (Week 2-3)**
- [ ] Build calendar component with drag-drop
- [ ] Create service management interface
- [ ] Implement analytics dashboard
- [ ] Add client management features
- [ ] Build notification system

### **Phase 5: Optimization (Week 3)**
- [ ] Optimize for Core Web Vitals
- [ ] Add progressive loading
- [ ] Implement offline capabilities
- [ ] Conduct accessibility audit
- [ ] Performance testing on 3G networks

---

## 🔗 Resources and Assets

### **Design Files**
- Service discovery interface: `design-system/screens/service-discovery-interface.md`
- Complete booking flow: `design-system/screens/booking-flow-complete.md`
- Provider dashboard: `design-system/screens/provider-dashboard-detailed.md`
- Accessibility guidelines: `design-system/accessibility/accessibility-guidelines.md`

### **Icon Library**
```typescript
// Recommended icon library for consistency
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  HeartIcon,
  UserIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Argentina-specific icons
const ArgentinaIcons = {
  peso: '💰',
  mercadoPago: '💳',
  whatsapp: '💬',
  location: '📍',
  verified: '✅',
  premium: '👑'
};
```

### **API Integration Points**
```typescript
// API endpoints to integrate with backend
const API_ENDPOINTS = {
  // Service discovery
  searchServices: 'GET /api/services/search',
  getServiceDetails: 'GET /api/services/:id',
  getCategories: 'GET /api/services/categories',
  
  // Booking
  getAvailability: 'GET /api/providers/:id/availability',
  createBooking: 'POST /api/bookings',
  updateBooking: 'PATCH /api/bookings/:id',
  cancelBooking: 'DELETE /api/bookings/:id',
  
  // Payment
  createPayment: 'POST /api/payments',
  getPaymentStatus: 'GET /api/payments/:id/status',
  
  // Provider dashboard
  getBookings: 'GET /api/providers/bookings',
  updateService: 'PATCH /api/services/:id',
  getAnalytics: 'GET /api/providers/analytics',
  getClients: 'GET /api/providers/clients'
};
```

---

This comprehensive handoff document provides everything needed to implement the BarberPro frontend with premium quality, mobile-first design, and full accessibility compliance for the Argentina market.