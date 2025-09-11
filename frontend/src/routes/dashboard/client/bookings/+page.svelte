<script lang="ts">
  // Client Bookings Page - View and manage all bookings
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { user } from '$lib/stores/auth';
  import { bookingStore } from '$lib/stores/booking';
  import { bookingApi } from '$lib/api/booking';
  import Button from '$lib/components/Button.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { Booking, BookingStatus } from '$lib/types/booking';
  
  // State
  let bookings: Booking[] = [];
  let filteredBookings: Booking[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  // Filters
  let statusFilter: BookingStatus | 'all' = 'all';
  let dateFilter: 'upcoming' | 'past' | 'all' = 'all';
  let searchQuery = '';
  
  // Pagination
  let currentPage = 1;
  let totalPages = 1;
  let totalBookings = 0;
  const itemsPerPage = 10;
  
  // Modals
  let showCancelModal = false;
  let cancellingBooking: Booking | null = null;
  let cancelReason = '';
  let isSubmitting = false;
  
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'CONFIRMED', label: 'Confirmada' },
    { value: 'IN_PROGRESS', label: 'En progreso' },
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'CANCELLED', label: 'Cancelada' },
    { value: 'NO_SHOW', label: 'No asistió' }
  ];
  
  const dateOptions = [
    { value: 'all', label: 'Todas las fechas' },
    { value: 'upcoming', label: 'Próximas' },
    { value: 'past', label: 'Pasadas' }
  ];
  
  onMount(() => {
    loadBookings();
  });
  
  const loadBookings = async () => {
    if (!$user) return;
    
    isLoading = true;
    error = null;
    
    try {
      const response = await bookingApi.searchBookings({
        clientId: $user.id,
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'startTime',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        bookings = response.data.bookings;
        totalBookings = response.data.pagination.total;
        totalPages = response.data.pagination.totalPages;
        applyFilters();
      }
    } catch (err: any) {
      error = err.message || 'Error al cargar las reservas';
    } finally {
      isLoading = false;
    }
  };
  
  const applyFilters = () => {
    let filtered = [...bookings];
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Date filter
    const now = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(booking => new Date(booking.startTime) >= now);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(booking => new Date(booking.startTime) < now);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.service?.name.toLowerCase().includes(query) ||
        booking.provider?.businessName.toLowerCase().includes(query)
      );
    }
    
    filteredBookings = filtered;
  };
  
  // Handle filter changes
  $: {
    statusFilter;
    dateFilter;
    searchQuery;
    applyFilters();
  }
  
  // Pagination
  const goToPage = (page: number) => {
    currentPage = page;
    loadBookings();
  };
  
  // Booking actions
  const openCancelModal = (booking: Booking) => {
    cancellingBooking = booking;
    cancelReason = '';
    showCancelModal = true;
  };
  
  const closeCancelModal = () => {
    showCancelModal = false;
    cancellingBooking = null;
    cancelReason = '';
  };
  
  const handleCancelBooking = async () => {
    if (!cancellingBooking || !cancelReason.trim()) return;
    
    isSubmitting = true;
    
    try {
      const result = await bookingStore.cancelBooking(cancellingBooking.id, cancelReason);
      
      if (result.success) {
        // Update local state
        bookings = bookings.map(b => 
          b.id === cancellingBooking!.id 
            ? { ...b, status: 'CANCELLED' as BookingStatus, cancelReason } 
            : b
        );
        applyFilters();
        closeCancelModal();
      } else {
        error = result.error || 'Error al cancelar la reserva';
      }
    } catch (err: any) {
      error = err.message || 'Error al cancelar la reserva';
    } finally {
      isSubmitting = false;
    }
  };
  
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
  
  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status: BookingStatus): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };
  
  const canCancelBooking = (booking: Booking): boolean => {
    const now = new Date();
    const bookingTime = new Date(booking.startTime);
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED' && hoursUntilBooking >= 24;
  };
  
  const isUpcoming = (booking: Booking): boolean => {
    return new Date(booking.startTime) > new Date();
  };
</script>

<svelte:head>
  <title>Mis Reservas - BarberPro</title>
  <meta name="description" content="Gestiona todas tus reservas de servicios" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Mis Reservas</h1>
      <p class="text-gray-600 mt-1">
        Gestiona todas tus citas y servicios reservados
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <Button variant="primary" href="/search">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nueva Reserva
      </Button>
    </div>
  </div>

  {#if error}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" in:fade>
      <div class="flex items-center justify-between">
        <p class="text-red-700">{error}</p>
        <button 
          type="button"
          on:click={() => error = null}
          class="text-red-400 hover:text-red-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  {/if}

  <!-- Filters -->
  <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Search -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Buscar reservas
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por servicio o profesional..."
            bind:value={searchQuery}
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <!-- Status Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Estado
        </label>
        <select 
          bind:value={statusFilter}
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Date Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Fecha
        </label>
        <select 
          bind:value={dateFilter}
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {#each dateOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Bookings List -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <Loading size="lg" />
    </div>
  
  {:else if filteredBookings.length === 0}
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-2m-6 2v-2a4 4 0 114 0v2m6-8V7a4 4 0 118 0v8M3 21h18" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {bookings.length === 0 ? 'No tienes reservas' : 'No hay reservas que coincidan con los filtros'}
      </h3>
      <p class="text-gray-600 mb-6">
        {bookings.length === 0 
          ? 'Comienza reservando tu primer servicio'
          : 'Intenta ajustar los filtros de búsqueda'
        }
      </p>
      {#if bookings.length === 0}
        <Button variant="primary" href="/search">
          Buscar Servicios
        </Button>
      {:else}
        <Button variant="outline" on:click={() => {
          statusFilter = 'all';
          dateFilter = 'all';
          searchQuery = '';
        }}>
          Limpiar filtros
        </Button>
      {/if}
    </div>
  
  {:else}
    <div class="space-y-4" in:fade={{ duration: 300 }}>
      {#each filteredBookings as booking (booking.id)}
        <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
             in:fly={{ y: 20, duration: 200, delay: filteredBookings.indexOf(booking) * 50 }}>
          
          <div class="flex items-start justify-between">
            <!-- Booking Info -->
            <div class="flex items-start space-x-4 flex-1">
              <!-- Provider Avatar -->
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {booking.provider?.businessName.charAt(0) || 'P'}
              </div>
              
              <!-- Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {booking.service?.name}
                    </h3>
                    <p class="text-gray-600 mb-2">
                      {booking.provider?.businessName}
                    </p>
                    
                    <!-- Date and Time -->
                    <div class="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-2m-6 2v-2a4 4 0 114 0v2m6-8V7a4 4 0 118 0v8M3 21h18" />
                        </svg>
                        <span>{formatDate(new Date(booking.startTime))}</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {formatTime(new Date(booking.startTime))} - 
                          {formatTime(new Date(booking.endTime))}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Address -->
                    {#if booking.provider?.address}
                      <div class="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{booking.provider.address}</span>
                      </div>
                    {/if}
                    
                    <!-- Notes -->
                    {#if booking.notes}
                      <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                        <strong>Notas:</strong> {booking.notes}
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Price and Status -->
                  <div class="text-right ml-4">
                    <p class="text-2xl font-bold text-gray-900 mb-2">
                      {formatPrice(booking.totalAmount)}
                    </p>
                    
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(booking.status)}">
                      {getStatusLabel(booking.status)}
                    </span>
                    
                    {#if isUpcoming(booking)}
                      <p class="text-xs text-gray-500 mt-2">
                        Próxima cita
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div class="flex items-center space-x-4">
              <!-- Contact Provider -->
              {#if booking.provider?.phone}
                <Button
                  variant="outline"
                  size="sm"
                  href="tel:{booking.provider.phone}"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Llamar
                </Button>
              {/if}
              
              <!-- Directions -->
              {#if booking.provider?.address}
                <Button
                  variant="outline"
                  size="sm"
                  href="https://maps.google.com/maps?q={encodeURIComponent(booking.provider.address)}"
                  target="_blank"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Cómo llegar
                </Button>
              {/if}
            </div>
            
            <div class="flex items-center space-x-2">
              <!-- View Details -->
              <Button
                variant="outline"
                size="sm"
                href="/dashboard/client/bookings/{booking.id}"
              >
                Ver detalles
              </Button>
              
              <!-- Cancel Booking -->
              {#if canCancelBooking(booking)}
                <Button
                  variant="outline"
                  size="sm"
                  on:click={() => openCancelModal(booking)}
                  class="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancelar
                </Button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          on:click={() => goToPage(currentPage - 1)}
        >
          Anterior
        </Button>
        
        {#each Array(totalPages) as _, i}
          <Button
            variant={currentPage === i + 1 ? 'primary' : 'outline'}
            size="sm"
            on:click={() => goToPage(i + 1)}
          >
            {i + 1}
          </Button>
        {/each}
        
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          on:click={() => goToPage(currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    {/if}
  {/if}
</div>

<!-- Cancel Booking Modal -->
<Modal
  isOpen={showCancelModal}
  onClose={closeCancelModal}
  title="Cancelar Reserva"
  size="md"
>
  {#if cancellingBooking}
    <div class="space-y-6">
      <!-- Booking Details -->
      <div class="p-4 bg-gray-50 rounded-lg">
        <h3 class="font-semibold text-gray-900 mb-2">
          {cancellingBooking.service?.name}
        </h3>
        <p class="text-gray-600 mb-1">
          {cancellingBooking.provider?.businessName}
        </p>
        <p class="text-sm text-gray-500">
          {formatDate(new Date(cancellingBooking.startTime))} - 
          {formatTime(new Date(cancellingBooking.startTime))}
        </p>
      </div>
      
      <!-- Warning -->
      <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div class="flex items-start space-x-3">
          <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 class="font-semibold text-yellow-800">Importante</h4>
            <p class="text-yellow-700 text-sm">
              La cancelación de reservas con menos de 24 horas de anticipación 
              puede estar sujeta a la política de cancelación del profesional.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Reason -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Motivo de la cancelación
        </label>
        <textarea
          bind:value={cancelReason}
          rows="3"
          placeholder="Explica brevemente el motivo de la cancelación..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          required
        ></textarea>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <Button variant="outline" on:click={closeCancelModal} disabled={isSubmitting}>
          Mantener reserva
        </Button>
        <Button 
          variant="primary"
          on:click={handleCancelBooking}
          loading={isSubmitting}
          disabled={!cancelReason.trim()}
          class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        >
          Cancelar reserva
        </Button>
      </div>
    </div>
  {/if}
</Modal>