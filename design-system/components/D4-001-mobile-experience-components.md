# 📱 Mobile Experience Optimization Components - Argentina Mobile-First Design

## MobileBottomSheet.svelte - Native Mobile Patterns

### Component Architecture
```typescript
// MobileBottomSheet.svelte - Bottom sheet modal for mobile interactions
interface BottomSheetProps {
  isOpen: boolean;
  title?: string;
  height?: 'auto' | 'half' | 'full';
  snapPoints?: number[];
  onClose: () => void;
  onSnapChange?: (height: number) => void;
  showHandle?: boolean;
  backdrop?: boolean;
}
```

### Visual Design Specifications

#### Bottom Sheet Container
```scss
.bottom-sheet {
  @apply fixed inset-x-0 bottom-0 z-50;
  @apply bg-white rounded-t-2xl shadow-2xl;
  @apply transform transition-transform duration-300 ease-out;
  
  &.closed {
    transform: translateY(100%);
  }
  
  &.open {
    transform: translateY(0);
  }
  
  // Backdrop
  &::before {
    content: '';
    @apply fixed inset-0 bg-black opacity-50;
    @apply transition-opacity duration-300;
    z-index: -1;
  }
  
  // Handle for dragging
  .drag-handle {
    @apply w-10 h-1.5 bg-gray-300 rounded-full;
    @apply mx-auto mt-3 mb-4;
    @apply cursor-grab active:cursor-grabbing;
    
    &:hover {
      @apply bg-gray-400;
    }
  }
  
  // Content area
  .sheet-content {
    @apply px-6 pb-safe-area-inset-bottom;
    @apply max-h-screen overflow-y-auto;
  }
  
  // Header with title
  .sheet-header {
    @apply flex items-center justify-between;
    @apply py-4 border-b border-gray-100;
    @apply sticky top-0 bg-white z-10;
    
    h2 {
      @apply text-lg font-semibold text-gray-900;
    }
    
    .close-button {
      @apply p-2 rounded-full text-gray-400;
      @apply hover:bg-gray-100 hover:text-gray-600;
      @apply transition-colors duration-200;
      @apply touch-target;
    }
  }
}

// Snap points for different heights
.bottom-sheet-auto {
  height: auto;
  max-height: 90vh;
}

.bottom-sheet-half {
  height: 50vh;
}

.bottom-sheet-full {
  height: 90vh;
}

// Safe area support for iOS
.pb-safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 1.5rem);
}
```

#### Touch Interactions & Gestures
```scss
// Gesture handling styles
.swipe-container {
  @apply relative overflow-hidden;
  touch-action: pan-y;
  
  // Swipe indicators
  &.swipe-up::after {
    content: '';
    @apply absolute bottom-0 left-0 right-0 h-1;
    @apply bg-gradient-to-t from-blue-500 to-transparent;
    @apply opacity-0 transition-opacity duration-200;
  }
  
  &.swipe-active::after {
    @apply opacity-100;
  }
}

// Touch feedback for interactive elements
.touch-feedback {
  @apply relative overflow-hidden;
  
  // Ripple effect
  &::after {
    content: '';
    @apply absolute inset-0 bg-current opacity-0;
    @apply rounded-inherit pointer-events-none;
    @apply transition-opacity duration-200;
    transform: scale(0);
  }
  
  &:active::after {
    @apply opacity-10;
    transform: scale(1);
    transition: transform 0.3s ease-out;
  }
}

// Large touch targets for mobile
.touch-target {
  min-height: 44px;
  min-width: 44px;
  @apply flex items-center justify-center;
}

.touch-target-large {
  min-height: 56px;
  min-width: 56px;
  @apply flex items-center justify-center;
}
```

### Service Selection Bottom Sheet
```html
<div class="bottom-sheet service-selection-sheet">
  <!-- Drag Handle -->
  <div class="drag-handle"></div>
  
  <!-- Header -->
  <div class="sheet-header">
    <h2>Seleccionar Servicio</h2>
    <button class="close-button touch-target" on:click={closeSheet}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
  
  <!-- Search Bar -->
  <div class="px-6 py-4 border-b border-gray-100 bg-white sticky top-16 z-10">
    <div class="relative">
      <input 
        type="text" 
        placeholder="Buscar servicios..."
        class="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 touch-target"
      >
      <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>
  </div>
  
  <!-- Service Categories -->
  <div class="px-6 py-4">
    <div class="flex space-x-3 overflow-x-auto pb-2">
      <button class="category-pill active">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
        Todos
      </button>
      <button class="category-pill">
        <span class="text-xl mr-2">✂️</span>
        Cortes
      </button>
      <button class="category-pill">
        <span class="text-xl mr-2">🧔</span>
        Barbas
      </button>
      <button class="category-pill">
        <span class="text-xl mr-2">💆</span>
        Tratamientos
      </button>
    </div>
  </div>
  
  <!-- Services Grid -->
  <div class="sheet-content pb-6">
    <div class="space-y-4">
      <!-- Service Item -->
      <div class="service-card-mobile touch-feedback" role="button" tabindex="0">
        <div class="flex items-center space-x-4 p-4">
          <div class="service-image">
            <img src="/api/placeholder/80/80" alt="Corte Clásico" class="w-20 h-20 object-cover rounded-xl">
            <div class="service-badge">Popular</div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between mb-2">
              <h3 class="service-title">Corte Clásico</h3>
              <div class="service-price">
                <span class="current-price">$1.500</span>
                <span class="original-price">$1.800</span>
              </div>
            </div>
            
            <p class="service-description">Corte tradicional con tijera y máquina, incluye lavado y peinado</p>
            
            <div class="service-meta">
              <span class="duration">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                45 min
              </span>
              <span class="rating">
                <svg class="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                4.8 (127)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- More service items... -->
    </div>
    
    <!-- Load More Button -->
    <div class="text-center py-6">
      <button class="btn-outline touch-target-large">
        Ver más servicios
      </button>
    </div>
  </div>
</div>

<style>
.category-pill {
  @apply flex items-center px-4 py-2 rounded-full text-sm font-medium;
  @apply bg-gray-100 text-gray-700 whitespace-nowrap;
  @apply hover:bg-gray-200 transition-colors duration-200;
  @apply touch-target;
  
  &.active {
    @apply bg-blue-600 text-white;
  }
}

.service-card-mobile {
  @apply bg-white border border-gray-200 rounded-xl;
  @apply hover:shadow-md transition-all duration-200;
  
  .service-image {
    @apply relative;
    
    .service-badge {
      @apply absolute -top-2 -right-2;
      @apply bg-red-500 text-white text-xs font-bold;
      @apply px-2 py-1 rounded-full;
    }
  }
  
  .service-title {
    @apply text-lg font-semibold text-gray-900 truncate;
  }
  
  .service-description {
    @apply text-sm text-gray-600 mb-3 line-clamp-2;
  }
  
  .service-price {
    @apply text-right;
    
    .current-price {
      @apply text-lg font-bold text-gray-900;
    }
    
    .original-price {
      @apply text-sm text-gray-500 line-through ml-1;
    }
  }
  
  .service-meta {
    @apply flex items-center space-x-4 text-xs text-gray-500;
    
    .duration, .rating {
      @apply flex items-center;
    }
  }
}
</style>
```

### Time Slot Selection Bottom Sheet
```html
<div class="bottom-sheet time-selection-sheet">
  <!-- Header with selected date -->
  <div class="sheet-header bg-gradient-to-r from-blue-50 to-blue-100">
    <div class="w-full">
      <h2 class="text-center">Seleccionar Horario</h2>
      <div class="selected-date-display text-center mt-2">
        <p class="text-sm text-blue-600">Fecha seleccionada</p>
        <p class="text-lg font-semibold text-blue-900">Viernes, 15 de Septiembre</p>
      </div>
    </div>
    <button class="close-button touch-target">×</button>
  </div>
  
  <!-- Quick Time Navigation -->
  <div class="quick-time-nav px-6 py-4 bg-white border-b border-gray-100">
    <div class="flex space-x-2 overflow-x-auto">
      <button class="time-period-btn active">Mañana</button>
      <button class="time-period-btn">Tarde</button>
      <button class="time-period-btn">Noche</button>
    </div>
  </div>
  
  <!-- Available Times Grid -->
  <div class="sheet-content">
    <div class="time-slots-mobile px-6 py-4">
      <!-- Morning Section -->
      <div class="time-section">
        <h3 class="section-title">
          <span class="text-xl mr-2">🌅</span>
          Mañana (9:00 - 12:00)
        </h3>
        
        <div class="time-grid">
          <button class="time-slot available">
            <div class="time">09:00</div>
            <div class="status">Disponible</div>
          </button>
          
          <button class="time-slot available">
            <div class="time">09:30</div>
            <div class="status">Disponible</div>
          </button>
          
          <button class="time-slot popular">
            <div class="time">10:00</div>
            <div class="status">Popular</div>
          </button>
          
          <button class="time-slot available">
            <div class="time">10:30</div>
            <div class="status">Disponible</div>
          </button>
          
          <button class="time-slot occupied" disabled>
            <div class="time">11:00</div>
            <div class="status">Ocupado</div>
          </button>
          
          <button class="time-slot last-available">
            <div class="time">11:30</div>
            <div class="status">¡Último!</div>
          </button>
        </div>
      </div>
      
      <!-- Afternoon Section -->
      <div class="time-section">
        <h3 class="section-title">
          <span class="text-xl mr-2">☀️</span>
          Tarde (14:00 - 18:00)
        </h3>
        
        <div class="time-grid">
          <button class="time-slot available">
            <div class="time">14:00</div>
            <div class="status">Disponible</div>
          </button>
          
          <button class="time-slot available">
            <div class="time">14:30</div>
            <div class="status">Disponible</div>
          </button>
          
          <!-- More time slots... -->
        </div>
      </div>
      
      <!-- Evening Section -->
      <div class="time-section">
        <h3 class="section-title">
          <span class="text-xl mr-2">🌆</span>
          Noche (18:00 - 21:00)
        </h3>
        
        <div class="time-grid">
          <!-- Evening time slots... -->
        </div>
      </div>
    </div>
    
    <!-- No Available Times State -->
    <div class="no-times-available text-center py-12" style="display: none;">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No hay horarios disponibles</h3>
      <p class="text-gray-600 mb-6">Para esta fecha no encontramos horarios libres</p>
      
      <div class="space-y-3">
        <button class="btn-booking-primary touch-target-large w-full max-w-sm mx-auto">
          Ver fechas alternativas
        </button>
        <button class="btn-whatsapp-contact touch-target-large w-full max-w-sm mx-auto">
          Contactar por WhatsApp
        </button>
      </div>
    </div>
  </div>
  
  <!-- Fixed Bottom Action -->
  <div class="fixed-bottom-action bg-white border-t border-gray-200 px-6 py-4">
    <div class="selected-time-summary mb-4" style="display: none;">
      <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
        <div>
          <p class="text-sm text-green-600">Horario seleccionado</p>
          <p class="font-semibold text-green-900">10:00 - 10:45</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-green-600">Precio</p>
          <p class="font-bold text-green-900">$1.500</p>
        </div>
      </div>
    </div>
    
    <button class="btn-booking-primary w-full touch-target-large" disabled>
      Continuar con la reserva
    </button>
  </div>
</div>

<style>
.time-period-btn {
  @apply px-4 py-2 rounded-full text-sm font-medium;
  @apply bg-gray-100 text-gray-700 whitespace-nowrap;
  @apply hover:bg-gray-200 transition-colors duration-200;
  @apply touch-target;
  
  &.active {
    @apply bg-blue-600 text-white;
  }
}

.time-section {
  @apply mb-8;
  
  .section-title {
    @apply flex items-center text-lg font-semibold text-gray-900 mb-4;
    @apply border-b border-gray-100 pb-2;
  }
}

.time-grid {
  @apply grid grid-cols-2 gap-3;
}

.time-slot {
  @apply p-4 rounded-xl border-2 text-center transition-all duration-200;
  @apply touch-target-large;
  
  .time {
    @apply text-lg font-semibold mb-1;
  }
  
  .status {
    @apply text-xs font-medium;
  }
  
  // Available state
  &.available {
    @apply border-gray-200 bg-white text-gray-900;
    @apply hover:border-blue-300 hover:bg-blue-50;
    
    .status {
      @apply text-gray-600;
    }
  }
  
  // Popular state
  &.popular {
    @apply border-orange-200 bg-orange-50 text-orange-900;
    @apply hover:border-orange-300 hover:bg-orange-100;
    
    .status {
      @apply text-orange-600;
    }
  }
  
  // Last available state
  &.last-available {
    @apply border-red-200 bg-red-50 text-red-900;
    @apply hover:border-red-300 hover:bg-red-100;
    
    .status {
      @apply text-red-600;
    }
  }
  
  // Occupied state
  &.occupied {
    @apply border-gray-200 bg-gray-100 text-gray-500;
    @apply cursor-not-allowed opacity-60;
    
    .status {
      @apply text-gray-400;
    }
  }
  
  // Selected state
  &.selected {
    @apply border-blue-500 bg-blue-600 text-white;
    @apply shadow-lg transform scale-105;
    
    .status {
      @apply text-blue-100;
    }
  }
}

.fixed-bottom-action {
  @apply sticky bottom-0 left-0 right-0;
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}
</style>
```

## Touch Interaction Enhancements

### Haptic Feedback Implementation
```typescript
// Touch feedback utility functions
export class TouchFeedback {
  static vibrate(pattern: number | number[] = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
  
  static lightTap() {
    this.vibrate(10);
  }
  
  static mediumTap() {
    this.vibrate(20);
  }
  
  static success() {
    this.vibrate([20, 50, 20]);
  }
  
  static error() {
    this.vibrate([50, 100, 50]);
  }
  
  static selection() {
    this.vibrate([10, 20]);
  }
}

// Usage in components
function handleServiceSelect(service: Service) {
  TouchFeedback.lightTap();
  selectService(service);
}

function handleBookingConfirm() {
  TouchFeedback.success();
  confirmBooking();
}

function handleError() {
  TouchFeedback.error();
  showErrorMessage();
}
```

### Gesture Recognition
```typescript
// Gesture handling for mobile interactions
export class GestureHandler {
  private startY = 0;
  private startX = 0;
  private threshold = 50; // Minimum distance for gesture recognition
  
  constructor(private element: HTMLElement) {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }
  
  private handleTouchStart(e: TouchEvent) {
    this.startY = e.touches[0].clientY;
    this.startX = e.touches[0].clientX;
  }
  
  private handleTouchMove(e: TouchEvent) {
    if (!this.startY || !this.startX) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = this.startY - currentY;
    const diffX = this.startX - currentX;
    
    // Prevent default for vertical swipes on bottom sheets
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      e.preventDefault();
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    if (!this.startY || !this.startX) return;
    
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const diffY = this.startY - endY;
    const diffX = this.startX - endX;
    
    // Determine gesture type
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > this.threshold) {
      if (diffY > 0) {
        this.onSwipeUp();
      } else {
        this.onSwipeDown();
      }
    } else if (Math.abs(diffX) > this.threshold) {
      if (diffX > 0) {
        this.onSwipeLeft();
      } else {
        this.onSwipeRight();
      }
    }
    
    this.startY = 0;
    this.startX = 0;
  }
  
  onSwipeUp() {
    this.element.dispatchEvent(new CustomEvent('swipeUp'));
  }
  
  onSwipeDown() {
    this.element.dispatchEvent(new CustomEvent('swipeDown'));
  }
  
  onSwipeLeft() {
    this.element.dispatchEvent(new CustomEvent('swipeLeft'));
  }
  
  onSwipeRight() {
    this.element.dispatchEvent(new CustomEvent('swipeRight'));
  }
}
```

## Mobile Notification System

### In-App Notification Toast
```html
<div class="mobile-toast-container">
  <!-- Booking Confirmation Toast -->
  <div class="toast-notification booking-confirmed" role="alert">
    <div class="toast-content">
      <div class="toast-icon">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div class="toast-message">
        <h4 class="toast-title">¡Reserva confirmada!</h4>
        <p class="toast-description">Tu cita está programada para el 15 de Sept a las 14:30</p>
      </div>
    </div>
    
    <div class="toast-actions">
      <button class="toast-action-btn primary">
        Ver detalles
      </button>
      <button class="toast-action-btn secondary" onclick="this.closest('.toast-notification').remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Provider Response Toast -->
  <div class="toast-notification provider-response" role="alert">
    <div class="toast-content">
      <div class="toast-avatar">
        <img src="/api/placeholder/40/40" alt="Carlos" class="w-10 h-10 rounded-full">
        <div class="online-indicator"></div>
      </div>
      <div class="toast-message">
        <h4 class="toast-title">Carlos respondió</h4>
        <p class="toast-description">"Perfecto, te espero mañana. ¡Saludos!"</p>
      </div>
    </div>
    
    <div class="toast-actions">
      <button class="toast-action-btn whatsapp">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..."/>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Payment Reminder Toast -->
  <div class="toast-notification payment-reminder" role="alert">
    <div class="toast-content">
      <div class="toast-icon">
        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
      </div>
      <div class="toast-message">
        <h4 class="toast-title">Pago pendiente</h4>
        <p class="toast-description">Tienes una reserva por pagar. Vence en 2 horas.</p>
      </div>
    </div>
    
    <div class="toast-actions">
      <button class="toast-action-btn primary">
        Pagar ahora
      </button>
    </div>
  </div>
</div>

<style>
.mobile-toast-container {
  @apply fixed top-safe-area-inset-top right-0 left-0 z-50;
  @apply p-4 space-y-3 pointer-events-none;
}

.toast-notification {
  @apply bg-white rounded-xl shadow-lg border border-gray-200;
  @apply p-4 pointer-events-auto;
  @apply transform transition-all duration-300 ease-out;
  @apply animate-slide-down;
  
  &.booking-confirmed {
    @apply border-l-4 border-l-green-500;
  }
  
  &.provider-response {
    @apply border-l-4 border-l-blue-500;
  }
  
  &.payment-reminder {
    @apply border-l-4 border-l-orange-500;
  }
}

.toast-content {
  @apply flex items-start space-x-3 mb-3;
}

.toast-icon {
  @apply flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center;
  
  .booking-confirmed & {
    @apply bg-green-100;
  }
  
  .payment-reminder & {
    @apply bg-orange-100;
  }
}

.toast-avatar {
  @apply relative flex-shrink-0;
  
  .online-indicator {
    @apply absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white;
  }
}

.toast-message {
  @apply flex-1 min-w-0;
}

.toast-title {
  @apply font-semibold text-gray-900 text-sm mb-1;
}

.toast-description {
  @apply text-gray-600 text-sm line-clamp-2;
}

.toast-actions {
  @apply flex items-center space-x-2 ml-13;
}

.toast-action-btn {
  @apply px-3 py-1.5 rounded-lg text-sm font-medium transition-colors;
  @apply touch-target;
  
  &.primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
  
  &.secondary {
    @apply text-gray-400 hover:text-gray-600 hover:bg-gray-100;
  }
  
  &.whatsapp {
    @apply bg-green-500 text-white hover:bg-green-600;
  }
}

@keyframes slide-down {
  from {
    transform: translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

// Safe area support
.top-safe-area-inset-top {
  top: env(safe-area-inset-top, 1rem);
}
</style>
```

## Mobile-Specific Loading States

### Skeleton Screens for Mobile
```html
<div class="mobile-skeleton-screens">
  <!-- Service Loading Skeleton -->
  <div class="service-skeleton">
    <div class="flex space-x-4 p-4">
      <div class="skeleton-image w-20 h-20 rounded-xl"></div>
      <div class="flex-1 space-y-3">
        <div class="skeleton-line h-5 w-3/4"></div>
        <div class="skeleton-line h-4 w-full"></div>
        <div class="skeleton-line h-4 w-2/3"></div>
        <div class="flex space-x-4">
          <div class="skeleton-line h-3 w-16"></div>
          <div class="skeleton-line h-3 w-20"></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Calendar Loading Skeleton -->
  <div class="calendar-skeleton p-6">
    <div class="skeleton-line h-8 w-48 mx-auto mb-6"></div>
    <div class="grid grid-cols-7 gap-2 mb-4">
      <!-- Day headers -->
      {#each Array(7) as _}
        <div class="skeleton-line h-6 w-full"></div>
      {/each}
    </div>
    <div class="grid grid-cols-7 gap-2">
      <!-- Calendar days -->
      {#each Array(35) as _}
        <div class="skeleton-circle w-10 h-10"></div>
      {/each}
    </div>
  </div>
  
  <!-- Time Slots Loading Skeleton -->
  <div class="time-slots-skeleton p-6">
    <div class="skeleton-line h-6 w-32 mb-4"></div>
    <div class="grid grid-cols-2 gap-3">
      {#each Array(8) as _}
        <div class="skeleton-time-slot h-16 rounded-xl"></div>
      {/each}
    </div>
  </div>
</div>

<style>
.skeleton-line,
.skeleton-image,
.skeleton-circle,
.skeleton-time-slot {
  @apply bg-gray-200 animate-pulse;
}

.skeleton-line {
  @apply rounded;
}

.skeleton-image,
.skeleton-time-slot {
  @apply rounded-xl;
}

.skeleton-circle {
  @apply rounded-full;
}

// Shimmer effect
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-line,
.skeleton-image,
.skeleton-circle,
.skeleton-time-slot {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
</style>
```

## Argentina Mobile Optimizations

### WhatsApp Integration Components
```html
<div class="whatsapp-integration">
  <!-- Quick Contact Button -->
  <div class="whatsapp-quick-contact">
    <button class="whatsapp-fab" onclick="openWhatsApp()">
      <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
      </svg>
    </button>
  </div>
  
  <!-- WhatsApp Share Booking -->
  <div class="whatsapp-share-modal" style="display: none;">
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div class="bg-white w-full rounded-t-2xl p-6 pb-safe-area-inset-bottom">
        <div class="drag-handle"></div>
        
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Compartir reserva</h3>
        
        <div class="message-preview bg-green-50 p-4 rounded-xl mb-4 border border-green-200">
          <div class="message-content">
            <p class="text-sm text-gray-800 leading-relaxed">
              🗓️ <strong>Reserva confirmada en BarberPro</strong><br><br>
              📍 <strong>Peluquería:</strong> Carlos Mendoza - Barber Shop<br>
              ✂️ <strong>Servicio:</strong> Corte + Barba<br>
              📅 <strong>Fecha:</strong> Viernes, 15 de Septiembre<br>
              ⏰ <strong>Hora:</strong> 14:30<br>
              💰 <strong>Precio:</strong> $2.500 ARS<br><br>
              📍 <strong>Dirección:</strong> Av. Corrientes 1234, CABA<br><br>
              Reservado através de: https://barberpro.com.ar
            </p>
          </div>
        </div>
        
        <div class="space-y-3">
          <button class="btn-whatsapp-contact w-full touch-target-large" onclick="shareToWhatsApp()">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..."/>
            </svg>
            Enviar por WhatsApp
          </button>
          
          <button class="btn-outline w-full touch-target-large" onclick="copyToClipboard()">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Copiar mensaje
          </button>
          
          <button class="text-gray-500 text-center w-full py-2 touch-target" onclick="closeWhatsAppModal()">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.whatsapp-fab {
  @apply fixed bottom-6 right-6 z-40;
  @apply w-14 h-14 bg-green-500 hover:bg-green-600;
  @apply rounded-full shadow-lg;
  @apply flex items-center justify-center;
  @apply text-white;
  @apply transition-all duration-200;
  @apply transform hover:scale-110;
  
  // Pulse animation for attention
  &::after {
    content: '';
    @apply absolute inset-0 rounded-full;
    @apply bg-green-500 opacity-30;
    @apply animate-ping;
  }
}

.message-preview {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  
  .message-content {
    @apply relative;
    
    // WhatsApp-style message bubble
    &::before {
      content: '';
      @apply absolute -left-2 top-3 w-0 h-0;
      border: 8px solid transparent;
      border-right-color: #dcfce7;
      border-left: 0;
    }
  }
}
</style>

<script>
function openWhatsApp() {
  const phone = '+541112345678'; // Provider's WhatsApp number
  const message = encodeURIComponent('Hola! Me interesa reservar una cita. Vi tu perfil en BarberPro.');
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

function shareToWhatsApp() {
  const message = `🗓️ Reserva confirmada en BarberPro

📍 Peluquería: Carlos Mendoza - Barber Shop
✂️ Servicio: Corte + Barba
📅 Fecha: Viernes, 15 de Septiembre
⏰ Hora: 14:30
💰 Precio: $2.500 ARS

📍 Dirección: Av. Corrientes 1234, CABA

Reservado através de: https://barberpro.com.ar`;
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

function copyToClipboard() {
  const message = document.querySelector('.message-preview .message-content p').textContent;
  navigator.clipboard.writeText(message).then(() => {
    // Show success toast
    showToast('Mensaje copiado al portapapeles', 'success');
  });
}

function closeWhatsAppModal() {
  document.querySelector('.whatsapp-share-modal').style.display = 'none';
}
</script>
```

This mobile experience optimization package provides comprehensive touch-optimized components, gesture handling, and Argentina-specific mobile patterns that create a premium mobile-first booking experience.