<script lang="ts">
  // Booking Calendar Component - Interactive date and time selection
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { socketState } from '$lib/services/socket';
  import type { TimeSlot, Provider, Service } from '$lib/types/booking';
  
  // Props
  export let provider: Provider;
  export let service: Service;
  export let availableSlots: TimeSlot[] = [];
  export let selectedDate: string | null = null;
  export let selectedTimeSlot: TimeSlot | null = null;
  export let isLoading = false;
  export let conflictDetected = false;
  export let suggestedSlots: TimeSlot[] = [];
  
  const dispatch = createEventDispatcher<{
    dateSelected: string;
    timeSlotSelected: TimeSlot;
    refreshRequested: void;
  }>();
  
  // Calendar state
  let currentMonth = new Date();
  let calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isAvailable: boolean;
    isDisabled: boolean;
  }> = [];
  
  // Time formatting
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };
  
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };
  
  // Calendar generation
  const generateCalendar = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, monthIndex, 1);
    // Last day of the month
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at the last day of the week containing the last day of the month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const today = new Date();
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayDate = new Date(date);
      const isCurrentMonth = dayDate.getMonth() === monthIndex;
      const isToday = dayDate.toDateString() === today.toDateString();
      const isSelected = selectedDateObj?.toDateString() === dayDate.toDateString();
      const isPast = dayDate < today;
      
      days.push({
        date: dayDate,
        isCurrentMonth,
        isToday,
        isSelected,
        isAvailable: isCurrentMonth && !isPast,
        isDisabled: !isCurrentMonth || isPast
      });
    }
    
    calendarDays = days;
  };
  
  // Month navigation
  const previousMonth = () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    generateCalendar(currentMonth);
  };
  
  const nextMonth = () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    generateCalendar(currentMonth);
  };
  
  // Date selection
  const selectDate = (date: Date) => {
    if (date < new Date()) return; // Don't allow past dates
    
    selectedDate = date.toISOString().split('T')[0];
    generateCalendar(currentMonth);
    dispatch('dateSelected', selectedDate);
  };
  
  // Time slot selection
  const selectTimeSlot = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    
    selectedTimeSlot = slot;
    dispatch('timeSlotSelected', slot);
  };
  
  // Real-time status indicator
  $: connectionStatus = $socketState.connected ? 'connected' : 
                      $socketState.connecting ? 'connecting' : 'disconnected';
  
  // Initialize calendar
  onMount(() => {
    generateCalendar(currentMonth);
  });
  
  // Reactive updates
  $: if (selectedDate) {
    generateCalendar(currentMonth);
  }
  
  // Month names in Spanish
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
</script>

<div class="booking-calendar bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
  <!-- Real-time connection indicator -->
  <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-gray-900">
      Seleccionar Fecha y Hora
    </h3>
    
    <!-- Connection status indicator -->
    <div class="flex items-center space-x-2">
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full {connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}"></div>
        <span class="text-xs text-gray-600">
          {connectionStatus === 'connected' ? 'En vivo' : 
           connectionStatus === 'connecting' ? 'Conectando...' : 'Sin conexión'}
        </span>
      </div>
      
      {#if !$socketState.connected}
        <button 
          type="button"
          on:click={() => dispatch('refreshRequested')}
          class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          Actualizar
        </button>
      {/if}
    </div>
  </div>

  <!-- Calendar Section -->
  <div class="p-6">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-6">
      <button
        type="button"
        on:click={previousMonth}
        class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="Mes anterior"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <h2 class="text-xl font-semibold text-gray-900">
        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
      </h2>
      
      <button
        type="button"
        on:click={nextMonth}
        class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="Mes siguiente"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Day names header -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      {#each dayNames as dayName}
        <div class="text-center text-sm font-medium text-gray-500 py-2">
          {dayName}
        </div>
      {/each}
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 gap-1 mb-8">
      {#each calendarDays as day}
        <button
          type="button"
          class="aspect-square p-2 text-sm rounded-lg transition-all duration-200 relative
                 {day.isDisabled ? 'text-gray-300 cursor-not-allowed' :
                  day.isSelected ? 'bg-blue-600 text-white font-semibold shadow-md' :
                  day.isToday ? 'bg-blue-100 text-blue-800 font-semibold' :
                  day.isCurrentMonth ? 'text-gray-900 hover:bg-blue-50 hover:text-blue-600' :
                  'text-gray-400'}"
          disabled={day.isDisabled}
          on:click={() => selectDate(day.date)}
        >
          {day.date.getDate()}
          
          {#if day.isToday && !day.isSelected}
            <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Selected date display -->
    {#if selectedDate}
      <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200" in:fade={{ duration: 200 }}>
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-semibold text-blue-900">Fecha seleccionada</h4>
            <p class="text-blue-700 capitalize">
              {formatDate(new Date(selectedDate))}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-blue-600">Servicio</p>
            <p class="font-semibold text-blue-900">{service.name}</p>
            <p class="text-sm text-blue-600">Duración: {service.duration} min</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Conflict notification -->
    {#if conflictDetected}
      <div class="mb-6 p-4 bg-red-50 rounded-lg border border-red-200" in:fly={{ y: -20, duration: 300 }}>
        <div class="flex items-start space-x-3">
          <svg class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="flex-1">
            <h4 class="font-semibold text-red-900">Horario no disponible</h4>
            <p class="text-red-700 text-sm">
              Este horario ya fue reservado por otro cliente. Selecciona uno de los horarios sugeridos.
            </p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Time Slots Section -->
  {#if selectedDate}
    <div class="border-t border-gray-200 bg-gray-50">
      <div class="p-6">
        <h4 class="font-semibold text-gray-900 mb-4">
          Horarios disponibles
          {#if isLoading}
            <span class="inline-block ml-2">
              <svg class="animate-spin w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          {/if}
        </h4>

        {#if isLoading}
          <!-- Loading skeleton -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {#each Array(8) as _}
              <div class="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            {/each}
          </div>
        {:else if availableSlots.length === 0}
          <!-- No slots available -->
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay horarios disponibles</h3>
            <p class="text-gray-600">
              Intenta seleccionar otra fecha o contacta directamente al profesional.
            </p>
          </div>
        {:else}
          <!-- Available time slots -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" in:fade={{ duration: 300 }}>
            {#each availableSlots as slot}
              <button
                type="button"
                class="p-4 rounded-lg border transition-all duration-200 text-left
                       {slot.isAvailable 
                         ? selectedTimeSlot?.startTime.getTime() === slot.startTime.getTime()
                           ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                           : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                         : 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'}"
                disabled={!slot.isAvailable}
                on:click={() => selectTimeSlot(slot)}
              >
                <div class="font-semibold text-sm">
                  {formatTime(slot.startTime)}
                </div>
                {#if slot.price && slot.price !== service.price}
                  <div class="text-xs opacity-75 mt-1">
                    {formatPrice(slot.price)}
                  </div>
                {/if}
                {#if !slot.isAvailable && slot.conflicts}
                  <div class="text-xs mt-1 opacity-75">
                    Ocupado
                  </div>
                {/if}
              </button>
            {/each}
          </div>

          <!-- Suggested slots for conflicts -->
          {#if conflictDetected && suggestedSlots.length > 0}
            <div class="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 class="font-semibold text-yellow-900 mb-3">Horarios sugeridos</h5>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {#each suggestedSlots as slot}
                  <button
                    type="button"
                    class="p-3 rounded-lg bg-yellow-100 text-yellow-900 border border-yellow-300 
                           hover:bg-yellow-200 transition-colors duration-200 text-sm"
                    on:click={() => selectTimeSlot(slot)}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Selected time slot confirmation -->
  {#if selectedTimeSlot}
    <div class="border-t border-gray-200 bg-green-50 p-6" in:fly={{ y: 20, duration: 300 }}>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-green-900">Horario seleccionado</h4>
            <p class="text-green-700">
              {formatTime(selectedTimeSlot.startTime)} - 
              {formatTime(new Date(selectedTimeSlot.endTime))}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-green-600">Precio</p>
          <p class="font-bold text-green-900">
            {formatPrice(selectedTimeSlot.price || service.price)}
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for time slots */
  .booking-calendar ::-webkit-scrollbar {
    width: 6px;
  }
  
  .booking-calendar ::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .booking-calendar ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .booking-calendar ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>