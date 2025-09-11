<script lang="ts">
  // Booking Form Component - Final booking details and submission
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { user } from '$lib/stores/auth';
  import Button from '../Button.svelte';
  import Input from '../Input.svelte';
  import type { Provider, Service, TimeSlot } from '$lib/types/booking';
  
  // Props
  export let provider: Provider;
  export let service: Service;
  export let date: string;
  export let timeSlot: TimeSlot;
  export let isSubmitting = false;
  export let formData = {
    notes: '',
    clientPhone: '',
    clientEmail: ''
  };
  
  const dispatch = createEventDispatcher<{
    submit: {
      notes: string;
      clientInfo?: {
        phone: string;
        email: string;
      };
    };
    cancel: void;
  }>();
  
  // Form validation
  let errors: Record<string, string> = {};
  let isFormValid = true;
  
  // Reactive calculations
  $: bookingDate = new Date(date);
  $: startTime = new Date(timeSlot.startTime);
  $: endTime = new Date(timeSlot.endTime);
  $: totalPrice = timeSlot.price || service.price;
  
  // Formatting functions
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };
  
  // Form validation
  const validateForm = () => {
    errors = {};
    
    // Validate phone if provided
    if (formData.clientPhone) {
      const phoneRegex = /^(\+54|54|0)?[\s\-]?(\d{2,4})[\s\-]?(\d{6,8})$/;
      if (!phoneRegex.test(formData.clientPhone.replace(/[\s\-]/g, ''))) {
        errors.clientPhone = 'Formato de teléfono inválido (ej: +54 11 1234-5678)';
      }
    }
    
    // Validate email if provided
    if (formData.clientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail)) {
        errors.clientEmail = 'Formato de email inválido';
      }
    }
    
    // Notes validation (optional but with limits)
    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Las notas no pueden exceder 500 caracteres';
    }
    
    isFormValid = Object.keys(errors).length === 0;
    return isFormValid;
  };
  
  // Form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const clientInfo = (formData.clientPhone || formData.clientEmail) ? {
      phone: formData.clientPhone,
      email: formData.clientEmail
    } : undefined;
    
    dispatch('submit', {
      notes: formData.notes,
      clientInfo
    });
  };
  
  const handleCancel = () => {
    dispatch('cancel');
  };
  
  // Auto-fill user data if logged in
  $: if ($user && !formData.clientPhone && !formData.clientEmail) {
    formData.clientPhone = $user.phone || '';
    formData.clientEmail = $user.email || '';
  }
  
  // Reactive validation
  $: {
    formData;
    validateForm();
  }
  
  // Calculate booking summary
  $: bookingSummary = {
    service: service.name,
    provider: provider.businessName,
    date: formatDate(bookingDate),
    time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
    duration: formatDuration(service.duration),
    price: formatPrice(totalPrice),
    address: provider.address
  };
</script>

<div class="booking-form">
  <!-- Booking Summary -->
  <div class="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
    <h3 class="text-xl font-semibold text-gray-900 mb-4">Resumen de la reserva</h3>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Service details -->
      <div class="space-y-4">
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900">{bookingSummary.service}</h4>
            <p class="text-gray-600">{bookingSummary.provider}</p>
            <p class="text-sm text-gray-500">{bookingSummary.duration}</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-2m-6 2v-2a4 4 0 114 0v2m6-8V7a4 4 0 118 0v8M3 21h18" />
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900">{bookingSummary.date}</h4>
            <p class="text-gray-600">{bookingSummary.time}</p>
            <p class="text-sm text-gray-500">{bookingSummary.address}</p>
          </div>
        </div>
      </div>
      
      <!-- Price breakdown -->
      <div class="lg:border-l lg:border-blue-200 lg:pl-6">
        <div class="bg-white rounded-lg p-4 border border-blue-200">
          <h4 class="font-semibold text-gray-900 mb-3">Detalles del precio</h4>
          
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Servicio</span>
              <span class="text-gray-900">{formatPrice(service.price)}</span>
            </div>
            
            {#if timeSlot.price && timeSlot.price !== service.price}
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Ajuste de horario</span>
                <span class="text-gray-900">
                  {formatPrice(timeSlot.price - service.price)}
                </span>
              </div>
            {/if}
            
            <hr class="border-gray-200" />
            
            <div class="flex justify-between font-semibold text-lg">
              <span class="text-gray-900">Total</span>
              <span class="text-blue-600">{bookingSummary.price}</span>
            </div>
          </div>
          
          <div class="mt-4 text-xs text-gray-500">
            <p>* Los precios están expresados en pesos argentinos</p>
            <p>* El pago se realiza en el momento de la cita</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Booking Form -->
  <form on:submit|preventDefault={handleSubmit} class="space-y-6" in:fade={{ duration: 300 }}>
    <!-- Contact Information -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h4 class="text-lg font-semibold text-gray-900 mb-4">
        Información de contacto
      </h4>
      <p class="text-gray-600 text-sm mb-6">
        Completa tus datos para recibir confirmación y recordatorios de tu cita.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Teléfono"
            type="tel"
            placeholder="+54 11 1234-5678"
            bind:value={formData.clientPhone}
            error={errors.clientPhone}
            required={false}
          />
          <p class="mt-1 text-xs text-gray-500">
            Recibirás recordatorios por WhatsApp y SMS
          </p>
        </div>
        
        <div>
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            bind:value={formData.clientEmail}
            error={errors.clientEmail}
            required={false}
          />
          <p class="mt-1 text-xs text-gray-500">
            Recibirás la confirmación por email
          </p>
        </div>
      </div>
    </div>

    <!-- Notes Section -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h4 class="text-lg font-semibold text-gray-900 mb-4">
        Notas adicionales
        <span class="text-sm font-normal text-gray-500">(opcional)</span>
      </h4>
      
      <div class="space-y-4">
        <textarea
          bind:value={formData.notes}
          placeholder="Añade cualquier información adicional que consideres importante para tu cita..."
          rows="4"
          maxlength="500"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                 resize-none transition-colors {errors.notes ? 'border-red-500' : ''}"
        ></textarea>
        
        <div class="flex justify-between items-center text-sm">
          <div>
            {#if errors.notes}
              <span class="text-red-600">{errors.notes}</span>
            {:else}
              <span class="text-gray-500">
                Puedes mencionar preferencias específicas, necesidades especiales, etc.
              </span>
            {/if}
          </div>
          <span class="text-gray-400">
            {formData.notes.length}/500
          </span>
        </div>
      </div>
    </div>

    <!-- Service Requirements -->
    {#if service.requirements}
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 class="font-semibold text-yellow-800">Requisitos del servicio</h4>
            <p class="text-yellow-700 mt-1">{service.requirements}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Cancellation Policy -->
    {#if service.cancellationPolicy}
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <div>
            <h4 class="font-semibold text-gray-800">Política de cancelación</h4>
            <p class="text-gray-700 mt-1">{service.cancellationPolicy}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Terms and Conditions -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div class="flex items-start space-x-3">
        <input
          type="checkbox"
          id="terms"
          required
          class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded 
                 focus:ring-blue-500 focus:ring-2"
        />
        <div>
          <label for="terms" class="text-sm text-gray-700">
            Al confirmar esta reserva, acepto los
            <a href="/terminos" class="text-blue-600 hover:text-blue-800 underline">
              términos y condiciones
            </a>
            de BarberPro y autorizo el procesamiento de mis datos personales 
            para la gestión de la cita.
          </label>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
      <Button 
        variant="outline" 
        size="lg"
        on:click={handleCancel}
        disabled={isSubmitting}
        class="flex-1 sm:flex-none"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </Button>
      
      <Button 
        type="submit" 
        variant="primary" 
        size="lg"
        disabled={!isFormValid || isSubmitting}
        loading={isSubmitting}
        class="flex-1"
      >
        {#if isSubmitting}
          Procesando reserva...
        {:else}
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Confirmar reserva • {bookingSummary.price}
        {/if}
      </Button>
    </div>
  </form>
</div>

<style>
  /* Custom checkbox styling */
  input[type="checkbox"]:checked {
    background-color: #2563eb;
    border-color: #2563eb;
  }
  
  /* Form focus improvements */
  textarea:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
</style>