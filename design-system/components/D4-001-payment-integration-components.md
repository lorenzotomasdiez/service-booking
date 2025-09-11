# 💳 Payment Integration Components - Argentina Market Design

## PaymentFlow.svelte - Complete Payment Experience

### Component Architecture
```typescript
// PaymentFlow.svelte - Main payment orchestrator
interface PaymentFlowProps {
  bookingDetails: BookingDetails;
  totalAmount: number;
  currency: 'ARS';
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: PaymentError) => void;
  onCancel: () => void;
}
```

### Visual Design Specifications

#### Payment Method Selection Cards
```scss
.payment-method-card {
  @apply bg-white rounded-xl shadow-md border border-gray-200;
  @apply hover:shadow-lg hover:border-blue-300;
  @apply transition-all duration-200;
  @apply p-6 cursor-pointer;
  min-height: 120px;
  
  &.selected {
    @apply border-blue-500 bg-blue-50;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &.disabled {
    @apply opacity-50 cursor-not-allowed;
    @apply bg-gray-50 border-gray-100;
  }
}

.payment-method-logo {
  @apply w-12 h-12 object-contain mb-3;
  
  &.mercadopago {
    @apply w-16 h-8; // Adjust for MercadoPago aspect ratio
  }
}

.payment-method-title {
  @apply text-lg font-semibold text-gray-900 mb-1;
}

.payment-method-description {
  @apply text-sm text-gray-600;
  @apply leading-relaxed;
}

.payment-method-badge {
  @apply inline-block px-3 py-1 rounded-full text-xs font-medium;
  @apply bg-green-100 text-green-800;
  
  &.popular {
    @apply bg-blue-100 text-blue-800;
  }
  
  &.secure {
    @apply bg-purple-100 text-purple-800;
  }
}
```

#### MercadoPago Integration Design
```html
<div class="mercadopago-container">
  <!-- MercadoPago Brand Header -->
  <div class="mercadopago-header">
    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl">
      <div class="flex items-center space-x-3">
        <img src="/assets/mercadopago-logo.png" alt="MercadoPago" class="h-8">
        <span class="text-white font-semibold">Pago seguro</span>
      </div>
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>
        </svg>
        <span class="text-white text-sm">SSL</span>
      </div>
    </div>
  </div>

  <!-- Payment Options Grid -->
  <div class="mercadopago-options grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white rounded-b-xl">
    
    <!-- Credit/Debit Cards -->
    <div class="payment-option-card">
      <div class="flex items-center space-x-3 mb-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">Tarjeta</h3>
          <p class="text-sm text-gray-600">Débito o crédito</p>
        </div>
      </div>
      <div class="flex space-x-2 mb-3">
        <img src="/assets/visa-logo.png" alt="Visa" class="h-6">
        <img src="/assets/mastercard-logo.png" alt="Mastercard" class="h-6">
        <img src="/assets/amex-logo.png" alt="American Express" class="h-6">
      </div>
      <span class="text-xs text-green-600 font-medium">Hasta 12 cuotas sin interés</span>
    </div>

    <!-- MercadoPago Account -->
    <div class="payment-option-card">
      <div class="flex items-center space-x-3 mb-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">Cuenta MP</h3>
          <p class="text-sm text-gray-600">Dinero en cuenta</p>
        </div>
      </div>
      <span class="text-xs text-blue-600 font-medium">Pago inmediato</span>
    </div>

    <!-- Bank Transfer -->
    <div class="payment-option-card">
      <div class="flex items-center space-x-3 mb-3">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">Transferencia</h3>
          <p class="text-sm text-gray-600">Desde tu banco</p>
        </div>
      </div>
      <span class="text-xs text-gray-600">24-48 hs hábiles</span>
    </div>

    <!-- Cash Payment -->
    <div class="payment-option-card">
      <div class="flex items-center space-x-3 mb-3">
        <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">Efectivo</h3>
          <p class="text-sm text-gray-600">Pago Fácil, Rapipago</p>
        </div>
      </div>
      <span class="text-xs text-gray-600">Genera cupón</span>
    </div>
  </div>
</div>
```

### Credit Card Form Design
```scss
.credit-card-form {
  @apply bg-white rounded-xl shadow-lg p-6;
  @apply border border-gray-200;
  
  .card-preview {
    @apply bg-gradient-to-br from-blue-600 to-blue-800;
    @apply rounded-xl p-6 mb-6 text-white;
    @apply shadow-lg transform perspective-1000;
    aspect-ratio: 1.586; // Standard credit card ratio
    
    .card-chip {
      @apply w-8 h-6 bg-yellow-400 rounded mb-4;
    }
    
    .card-number {
      @apply font-mono text-lg tracking-wider mb-4;
      letter-spacing: 0.2em;
    }
    
    .card-details {
      @apply flex justify-between items-end;
      
      .card-holder {
        @apply text-sm opacity-90;
      }
      
      .card-expiry {
        @apply text-sm opacity-90;
      }
    }
    
    .card-brand {
      @apply absolute top-6 right-6;
      
      img {
        @apply h-8 w-auto;
      }
    }
  }
  
  .form-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
    
    .form-group-full {
      @apply md:col-span-2;
    }
  }
}

.input-with-icon {
  @apply relative;
  
  .input-icon {
    @apply absolute left-3 top-1/2 transform -translate-y-1/2;
    @apply w-5 h-5 text-gray-400;
  }
  
  input {
    @apply pl-10;
  }
  
  &.has-error {
    .input-icon {
      @apply text-red-500;
    }
    
    input {
      @apply border-red-500 focus:ring-red-500;
    }
  }
  
  &.has-success {
    .input-icon {
      @apply text-green-500;
    }
    
    input {
      @apply border-green-500 focus:ring-green-500;
    }
  }
}
```

### Payment Processing States
```html
<!-- Payment Processing Animation -->
<div class="payment-processing-modal">
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
      
      <!-- Processing Animation -->
      <div class="mb-6">
        <div class="relative">
          <!-- Outer Ring -->
          <div class="w-24 h-24 border-4 border-blue-200 rounded-full mx-auto"></div>
          <!-- Animated Ring -->
          <div class="absolute inset-0 w-24 h-24 border-4 border-blue-600 rounded-full animate-spin border-t-transparent mx-auto"></div>
          <!-- Security Shield -->
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Processing Steps -->
      <div class="space-y-3 mb-6">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Validando datos...</span>
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Procesando pago...</span>
          <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div class="flex items-center justify-between opacity-50">
          <span class="text-sm text-gray-600">Confirmando reserva...</span>
          <div class="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        </div>
      </div>

      <!-- Security Message -->
      <div class="bg-blue-50 rounded-lg p-4 mb-6">
        <div class="flex items-center justify-center space-x-2">
          <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
          </svg>
          <span class="text-sm text-blue-800 font-medium">Pago 100% seguro</span>
        </div>
        <p class="text-xs text-blue-600 mt-1">Tus datos están protegidos con encriptación bancaria</p>
      </div>

      <!-- Cancel Button -->
      <button class="text-gray-500 text-sm hover:text-gray-700 transition-colors">
        Cancelar pago
      </button>
    </div>
  </div>
</div>
```

### Payment Success/Error States
```html
<!-- Payment Success -->
<div class="payment-success">
  <div class="text-center py-8">
    <!-- Success Animation -->
    <div class="relative mb-6">
      <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" class="animate-draw-check"/>
        </svg>
      </div>
      <!-- Animated Success Ring -->
      <div class="absolute inset-0 w-24 h-24 border-4 border-green-200 rounded-full animate-pulse mx-auto"></div>
    </div>

    <!-- Success Message -->
    <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Pago confirmado!</h2>
    <p class="text-gray-600 mb-6">Tu reserva ha sido confirmada exitosamente</p>

    <!-- Payment Details -->
    <div class="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Monto pagado:</span>
          <p class="font-semibold text-gray-900">$2.500 ARS</p>
        </div>
        <div>
          <span class="text-gray-600">Método de pago:</span>
          <p class="font-semibold text-gray-900">MercadoPago</p>
        </div>
        <div>
          <span class="text-gray-600">Número de transacción:</span>
          <p class="font-semibold text-gray-900">#MP-789123456</p>
        </div>
        <div>
          <span class="text-gray-600">Estado:</span>
          <p class="font-semibold text-green-600">Aprobado</p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3">
      <button class="btn-booking-primary w-full">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Descargar comprobante
      </button>
      
      <button class="btn-whatsapp-contact w-full">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
        Compartir por WhatsApp
      </button>
      
      <button class="btn-outline w-full">
        Ver detalles de la reserva
      </button>
    </div>
  </div>
</div>

<!-- Payment Error -->
<div class="payment-error">
  <div class="text-center py-8">
    <!-- Error Animation -->
    <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
    </div>

    <!-- Error Message -->
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Error en el pago</h2>
    <p class="text-gray-600 mb-6">No pudimos procesar tu pago. Intenta nuevamente.</p>

    <!-- Error Details -->
    <div class="bg-red-50 rounded-xl p-6 mb-6 border border-red-200">
      <div class="text-left">
        <h4 class="font-semibold text-red-900 mb-2">Motivo del error:</h4>
        <p class="text-red-700 text-sm mb-4">Tarjeta rechazada por el banco emisor</p>
        
        <h4 class="font-semibold text-red-900 mb-2">¿Qué puedes hacer?</h4>
        <ul class="text-red-700 text-sm space-y-1">
          <li>• Verificar los datos de tu tarjeta</li>
          <li>• Intentar con otra tarjeta</li>
          <li>• Contactar a tu banco</li>
          <li>• Usar otro método de pago</li>
        </ul>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3">
      <button class="btn-booking-primary w-full">
        Intentar nuevamente
      </button>
      
      <button class="btn-outline w-full">
        Cambiar método de pago
      </button>
      
      <button class="text-gray-500 text-sm hover:text-gray-700 transition-colors">
        Contactar soporte
      </button>
    </div>
  </div>
</div>
```

### Installment Payment Options (Argentina-Specific)
```html
<div class="installment-options">
  <h4 class="font-semibold text-gray-900 mb-4">Opciones de cuotas</h4>
  
  <div class="space-y-3">
    <!-- Cash Payment -->
    <div class="installment-option selected">
      <div class="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg">
        <div class="flex items-center space-x-3">
          <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">1 pago</p>
            <p class="text-sm text-gray-600">Pago único</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-green-600">$2.500</p>
          <p class="text-xs text-green-600">Sin interés</p>
        </div>
      </div>
    </div>

    <!-- 3 Installments -->
    <div class="installment-option">
      <div class="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
        <div class="flex items-center space-x-3">
          <div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
          <div>
            <p class="font-semibold text-gray-900">3 cuotas</p>
            <p class="text-sm text-gray-600">Sin interés</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-gray-900">$833,33</p>
          <p class="text-xs text-gray-600">por mes</p>
        </div>
      </div>
    </div>

    <!-- 6 Installments -->
    <div class="installment-option">
      <div class="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
        <div class="flex items-center space-x-3">
          <div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
          <div>
            <p class="font-semibold text-gray-900">6 cuotas</p>
            <p class="text-sm text-gray-600">Sin interés</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-gray-900">$416,67</p>
          <p class="text-xs text-gray-600">por mes</p>
        </div>
      </div>
    </div>

    <!-- 12 Installments -->
    <div class="installment-option">
      <div class="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
        <div class="flex items-center space-x-3">
          <div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
          <div>
            <p class="font-semibold text-gray-900">12 cuotas</p>
            <p class="text-sm text-red-600">CFT: 35% - TEA: 40%</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-gray-900">$245,83</p>
          <p class="text-xs text-gray-600">por mes</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Payment Calculator -->
  <div class="mt-6 p-4 bg-blue-50 rounded-lg">
    <h5 class="font-medium text-blue-900 mb-2">Resumen del pago</h5>
    <div class="text-sm space-y-1">
      <div class="flex justify-between">
        <span class="text-blue-700">Precio del servicio:</span>
        <span class="text-blue-900 font-medium">$2.500,00</span>
      </div>
      <div class="flex justify-between">
        <span class="text-blue-700">Intereses:</span>
        <span class="text-blue-900 font-medium">$0,00</span>
      </div>
      <div class="flex justify-between border-t border-blue-200 pt-2 mt-2">
        <span class="text-blue-800 font-semibold">Total a pagar:</span>
        <span class="text-blue-900 font-bold">$2.500,00</span>
      </div>
    </div>
  </div>
</div>
```

### Mobile Payment Optimization
```scss
// Mobile-specific payment styles
@media (max-width: 768px) {
  .payment-method-card {
    @apply p-4;
    min-height: 100px;
  }
  
  .mercadopago-options {
    @apply grid-cols-1 gap-3 p-4;
  }
  
  .payment-option-card {
    @apply p-4 text-center;
    
    .flex {
      @apply flex-col space-x-0 space-y-2;
    }
  }
  
  .credit-card-form {
    @apply p-4;
    
    .card-preview {
      @apply p-4 mb-4;
      font-size: 0.9rem;
    }
    
    .form-grid {
      @apply grid-cols-1 gap-4;
    }
  }
  
  .installment-option {
    .flex {
      @apply text-sm;
    }
  }
}

// Touch-optimized interactive elements
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

.payment-method-card,
.installment-option div {
  @extend .touch-target;
}
```

## Argentina-Specific Payment Features

### Bank Integration Display
```html
<div class="argentina-banks-grid">
  <h4 class="font-semibold text-gray-900 mb-4">Bancos disponibles</h4>
  
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bank-option">
      <img src="/assets/banco-nacion-logo.png" alt="Banco Nación" class="h-8 mx-auto mb-2">
      <span class="text-xs text-gray-600">Banco Nación</span>
    </div>
    
    <div class="bank-option">
      <img src="/assets/banco-santander-logo.png" alt="Santander" class="h-8 mx-auto mb-2">
      <span class="text-xs text-gray-600">Santander</span>
    </div>
    
    <div class="bank-option">
      <img src="/assets/banco-galicia-logo.png" alt="Banco Galicia" class="h-8 mx-auto mb-2">
      <span class="text-xs text-gray-600">Banco Galicia</span>
    </div>
    
    <div class="bank-option">
      <img src="/assets/banco-macro-logo.png" alt="Banco Macro" class="h-8 mx-auto mb-2">
      <span class="text-xs text-gray-600">Banco Macro</span>
    </div>
  </div>
</div>
```

### Receipt and Invoice Components
```html
<div class="payment-receipt">
  <div class="receipt-header bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-bold">Comprobante de Pago</h3>
        <p class="text-blue-100">BarberPro Argentina</p>
      </div>
      <div class="text-right">
        <p class="text-sm text-blue-100">Número de transacción</p>
        <p class="font-mono text-lg">#MP-789123456</p>
      </div>
    </div>
  </div>
  
  <div class="receipt-body bg-white p-6 rounded-b-xl border-l border-r border-b border-gray-200">
    <!-- Service Details -->
    <div class="mb-6">
      <h4 class="font-semibold text-gray-900 mb-3">Detalles del servicio</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Servicio:</span>
          <span class="text-gray-900 font-medium">Corte + Barba</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Profesional:</span>
          <span class="text-gray-900 font-medium">Carlos Mendoza</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Fecha:</span>
          <span class="text-gray-900 font-medium">15 Sept 2025, 14:30</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Duración:</span>
          <span class="text-gray-900 font-medium">60 minutos</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Details -->
    <div class="mb-6 border-t border-gray-200 pt-4">
      <h4 class="font-semibold text-gray-900 mb-3">Detalles del pago</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Subtotal:</span>
          <span class="text-gray-900 font-medium">$2.300,00</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Impuestos:</span>
          <span class="text-gray-900 font-medium">$200,00</span>
        </div>
        <div class="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
          <span class="text-gray-900">Total:</span>
          <span class="text-gray-900">$2.500,00 ARS</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Method -->
    <div class="mb-6 border-t border-gray-200 pt-4">
      <h4 class="font-semibold text-gray-900 mb-3">Método de pago</h4>
      <div class="flex items-center space-x-3">
        <img src="/assets/mercadopago-logo.png" alt="MercadoPago" class="h-6">
        <div>
          <p class="text-gray-900 font-medium">MercadoPago</p>
          <p class="text-gray-600 text-sm">Tarjeta terminada en 4567</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
      <p>BarberPro Argentina S.A. - CUIT: 30-12345678-9</p>
      <p>Av. Corrientes 1234, CABA, Argentina</p>
      <p>soporte@barberpro.com.ar - +54 11 1234-5678</p>
    </div>
  </div>
</div>
```

This payment integration design provides a comprehensive, culturally-optimized payment experience for Argentina's market, with MercadoPago prominence, familiar payment methods, and mobile-optimized interactions.