<script lang="ts">
  // Booking Confirmation Component - Success state after booking
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import Button from '../Button.svelte';
  import type { Booking, Provider } from '$lib/types/booking';
  
  // Props
  export let booking: Booking;
  export let provider: Provider;
  
  const dispatch = createEventDispatcher<{
    close: void;
    newBooking: void;
    addToCalendar: void;
    shareBooking: void;
  }>();
  
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
  
  // Reactive calculations
  $: startTime = new Date(booking.startTime);
  $: endTime = new Date(booking.endTime);
  $: bookingDate = formatDate(startTime);
  $: timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  
  // Calendar integration
  const generateCalendarUrl = () => {
    const title = encodeURIComponent(`${booking.service?.name} - ${provider.businessName}`);
    const start = new Date(booking.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(booking.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const location = encodeURIComponent(provider.address);
    const description = encodeURIComponent(
      `Reserva confirmada para ${booking.service?.name}\n\n` +
      `Profesional: ${provider.businessName}\n` +
      `Dirección: ${provider.address}\n` +
      `Teléfono: ${provider.phone}\n\n` +
      `ID de reserva: ${booking.id}`
    );
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${location}&details=${description}`;
  };
  
  // Share functionality
  const shareBooking = async () => {
    const shareData = {
      title: 'Mi reserva en BarberPro',
      text: `Tengo una cita el ${bookingDate} a las ${formatTime(startTime)} con ${provider.businessName}`,
      url: window.location.origin + `/booking/${booking.id}`
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${shareData.text}\n${shareData.url}`;
      await navigator.clipboard.writeText(text);
      alert('Enlace copiado al portapapeles');
    }
    
    dispatch('shareBooking');
  };
  
  // WhatsApp share
  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola! Acabo de reservar una cita:\n\n` +
      `📅 ${bookingDate}\n` +
      `🕐 ${timeRange}\n` +
      `✂️ ${booking.service?.name}\n` +
      `🏪 ${provider.businessName}\n` +
      `📍 ${provider.address}\n\n` +
      `¡Nos vemos ahí! 😊`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
</script>

<div class="booking-confirmation" in:fade={{ duration: 400 }}>
  <!-- Success Animation & Header -->
  <div class="text-center mb-8" in:fly={{ y: -20, duration: 600, delay: 200 }}>
    <!-- Success checkmark animation -->
    <div class="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
      <svg 
        class="w-12 h-12 text-white animate-bounce" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        in:fly={{ scale: 0, duration: 500, delay: 400 }}
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      ¡Reserva confirmada!
    </h2>
    <p class="text-lg text-gray-600">
      Tu cita ha sido reservada exitosamente
    </p>
  </div>

  <!-- Booking Details Card -->
  <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 mb-8" 
       in:fly={{ y: 20, duration: 600, delay: 300 }}>
    
    <!-- Booking ID -->
    <div class="text-center mb-6">
      <p class="text-sm text-green-600 font-medium">Número de reserva</p>
      <p class="text-2xl font-bold text-green-800 font-mono">#{booking.id.slice(-8).toUpperCase()}</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Service & Provider Info -->
      <div class="space-y-6">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900">{booking.service?.name}</h3>
            <p class="text-green-700 font-medium">{provider.businessName}</p>
            <p class="text-gray-600 text-sm mt-1">{provider.address}</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-2m-6 2v-2a4 4 0 114 0v2m6-8V7a4 4 0 118 0v8M3 21h18" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900">{bookingDate}</h3>
            <p class="text-blue-700 font-medium text-lg">{timeRange}</p>
            <p class="text-gray-600 text-sm mt-1">Argentina (UTC-3)</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900">Total</h3>
            <p class="text-purple-700 font-bold text-2xl">{formatPrice(booking.totalAmount)}</p>
            <p class="text-gray-600 text-sm mt-1">Se paga en el momento de la cita</p>
          </div>
        </div>
      </div>
      
      <!-- Contact & Additional Info -->
      <div class="lg:border-l lg:border-green-200 lg:pl-8 space-y-6">
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Contacto del profesional</h4>
          <div class="space-y-2">
            <div class="flex items-center space-x-3">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span class="text-gray-700">{provider.phone}</span>
            </div>
            <div class="flex items-center space-x-3">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="text-gray-700">{provider.email}</span>
            </div>
          </div>
        </div>
        
        {#if booking.notes}
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">Notas de la reserva</h4>
            <p class="text-gray-700 bg-white p-3 rounded-lg border border-green-200">
              {booking.notes}
            </p>
          </div>
        {/if}
        
        <div class="bg-white p-4 rounded-lg border border-green-200">
          <h4 class="font-semibold text-gray-900 mb-2">Estado de la reserva</h4>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-green-700 font-medium capitalize">{booking.status.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" 
       in:fly={{ y: 20, duration: 600, delay: 500 }}>
    
    <!-- Add to Calendar -->
    <button
      type="button"
      on:click={() => window.open(generateCalendarUrl(), '_blank')}
      class="flex items-center justify-center space-x-3 p-4 bg-white border border-gray-200 
             rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-2m-6 2v-2a4 4 0 114 0v2m6-8V7a4 4 0 118 0v8M3 21h18" />
      </svg>
      <span class="text-sm font-medium text-gray-700">Agregar al calendario</span>
    </button>
    
    <!-- Share WhatsApp -->
    <button
      type="button"
      on:click={shareWhatsApp}
      class="flex items-center justify-center space-x-3 p-4 bg-white border border-gray-200 
             rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
             focus:ring-2 focus:ring-green-500 focus:border-green-500"
    >
      <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
      </svg>
      <span class="text-sm font-medium text-gray-700">Compartir</span>
    </button>
    
    <!-- Get Directions -->
    <button
      type="button"
      on:click={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(provider.address)}`, '_blank')}
      class="flex items-center justify-center space-x-3 p-4 bg-white border border-gray-200 
             rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
             focus:ring-2 focus:ring-red-500 focus:border-red-500"
    >
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="text-sm font-medium text-gray-700">Cómo llegar</span>
    </button>
    
    <!-- Call Provider -->
    <button
      type="button"
      on:click={() => window.open(`tel:${provider.phone}`, '_self')}
      class="flex items-center justify-center space-x-3 p-4 bg-white border border-gray-200 
             rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
             focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
    >
      <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span class="text-sm font-medium text-gray-700">Llamar</span>
    </button>
  </div>

  <!-- Important Reminders -->
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
       in:fly={{ y: 20, duration: 600, delay: 600 }}>
    <div class="flex items-start space-x-3">
      <svg class="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h4 class="font-semibold text-blue-900 mb-2">Recordatorios importantes</h4>
        <ul class="text-blue-800 text-sm space-y-1">
          <li>• Recibirás recordatorios por WhatsApp y email</li>
          <li>• Llega 10 minutos antes de tu cita</li>
          <li>• Trae documento de identidad</li>
          <li>• El pago se realiza en el momento de la cita</li>
          <li>• Para cancelar, hazlo con al menos 24hs de anticipación</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex flex-col sm:flex-row gap-4"
       in:fly={{ y: 20, duration: 600, delay: 700 }}>
    <Button 
      variant="outline" 
      size="lg"
      on:click={() => dispatch('newBooking')}
      class="flex-1 sm:flex-none"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Nueva reserva
    </Button>
    
    <Button 
      variant="primary" 
      size="lg"
      on:click={() => dispatch('close')}
      class="flex-1"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Perfecto, entendido
    </Button>
  </div>
</div>

<style>
  .booking-confirmation {
    max-width: 100%;
  }
  
  /* Custom animations */
  @keyframes checkmark {
    0% {
      transform: scale(0) rotate(45deg);
    }
    50% {
      transform: scale(1.2) rotate(45deg);
    }
    100% {
      transform: scale(1) rotate(45deg);
    }
  }
  
  .animate-checkmark {
    animation: checkmark 0.6s ease-in-out;
  }
</style>