<script lang="ts">
  // Service Selector Component - Choose service for booking
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { bookingApi } from '$lib/api/booking';
  import Loading from '../Loading.svelte';
  import type { Provider, Service } from '$lib/types/booking';
  
  // Props
  export let provider: Provider;
  export let preselected: Service | null = null;
  
  const dispatch = createEventDispatcher<{
    serviceSelected: Service;
  }>();
  
  // State
  let services: Service[] = [];
  let selectedService: Service | null = preselected;
  let isLoading = true;
  let error: string | null = null;
  let searchQuery = '';
  let selectedCategory = 'all';
  
  // Reactive filtered services
  $: filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory && service.isActive;
  });
  
  $: categories = ['all', ...new Set(services.map(s => s.category))];
  
  // Formatting functions
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
  
  // Load services
  const loadServices = async () => {
    try {
      isLoading = true;
      error = null;
      
      const response = await bookingApi.getProviderServices(provider.id);
      
      if (response.success) {
        services = response.data;
        
        // If preselected service is provided, find it in the loaded services
        if (preselected) {
          selectedService = services.find(s => s.id === preselected.id) || null;
        }
      } else {
        error = 'Error al cargar los servicios';
      }
    } catch (err: any) {
      error = err.message || 'Error al cargar los servicios';
    } finally {
      isLoading = false;
    }
  };
  
  // Service selection
  const selectService = (service: Service) => {
    selectedService = service;
    dispatch('serviceSelected', service);
  };
  
  // Clear search
  const clearSearch = () => {
    searchQuery = '';
  };
  
  onMount(() => {
    loadServices();
  });
</script>

<div class="service-selector">
  <!-- Header -->
  <div class="mb-6">
    <h3 class="text-xl font-semibold text-gray-900 mb-2">
      Selecciona un servicio
    </h3>
    <p class="text-gray-600">
      Elige el servicio que deseas reservar con {provider.businessName}
    </p>
  </div>

  {#if isLoading}
    <!-- Loading state -->
    <div class="flex items-center justify-center py-12">
      <Loading size="lg" />
    </div>
  
  {:else if error}
    <!-- Error state -->
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar servicios</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <button 
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        on:click={loadServices}
      >
        Intentar nuevamente
      </button>
    </div>
  
  {:else if services.length === 0}
    <!-- No services state -->
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No hay servicios disponibles</h3>
      <p class="text-gray-600">
        {provider.businessName} no tiene servicios configurados en este momento.
      </p>
    </div>
  
  {:else}
    <!-- Services display -->
    <div in:fade={{ duration: 300 }}>
      <!-- Search and filters -->
      <div class="mb-6 space-y-4">
        <!-- Search bar -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar servicios..."
            bind:value={searchQuery}
            class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {#if searchQuery}
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                on:click={clearSearch}
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          {/if}
        </div>

        <!-- Category filter -->
        {#if categories.length > 2}
          <div class="flex flex-wrap gap-2">
            {#each categories as category}
              <button
                type="button"
                class="px-4 py-2 rounded-full text-sm font-medium transition-colors
                       {selectedCategory === category 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = category}
              >
                {category === 'all' ? 'Todos' : category}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Services grid -->
      {#if filteredServices.length === 0}
        <div class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron servicios</h3>
          <p class="text-gray-600">
            Intenta con otros términos de búsqueda o categoria.
          </p>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {#each filteredServices as service (service.id)}
            <div 
              class="service-card relative bg-white border-2 rounded-xl p-6 cursor-pointer 
                     transition-all duration-200 hover:shadow-lg
                     {selectedService?.id === service.id 
                       ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                       : 'border-gray-200 hover:border-blue-300'}"
              on:click={() => selectService(service)}
              on:keydown={(e) => e.key === 'Enter' && selectService(service)}
              role="button"
              tabindex="0"
              in:fly={{ y: 20, duration: 200, delay: filteredServices.indexOf(service) * 50 }}
            >
              <!-- Selection indicator -->
              {#if selectedService?.id === service.id}
                <div class="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              {/if}

              <!-- Service header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                  <h4 class="text-lg font-semibold text-gray-900 truncate">
                    {service.name}
                  </h4>
                  <p class="text-sm text-gray-600 mt-1">
                    {service.category}
                  </p>
                </div>
                <div class="text-right ml-4">
                  <p class="text-xl font-bold text-gray-900">
                    {formatPrice(service.price)}
                  </p>
                  <p class="text-sm text-gray-600">
                    {formatDuration(service.duration)}
                  </p>
                </div>
              </div>

              <!-- Service description -->
              <p class="text-gray-700 text-sm mb-4 line-clamp-3">
                {service.description}
              </p>

              <!-- Service features -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 text-sm text-gray-600">
                  <!-- Duration badge -->
                  <div class="flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDuration(service.duration)}</span>
                  </div>

                  <!-- Category badge -->
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                               bg-gray-100 text-gray-800">
                    {service.category}
                  </span>
                </div>

                <!-- Selection button -->
                <button
                  type="button"
                  class="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                         {selectedService?.id === service.id
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                  on:click|stopPropagation={() => selectService(service)}
                >
                  {selectedService?.id === service.id ? 'Seleccionado' : 'Seleccionar'}
                </button>
              </div>

              <!-- Additional service info -->
              {#if service.requirements}
                <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 class="text-sm font-medium text-yellow-800 mb-1">Requisitos</h5>
                  <p class="text-sm text-yellow-700">{service.requirements}</p>
                </div>
              {/if}

              {#if service.cancellationPolicy}
                <div class="mt-2 text-xs text-gray-500">
                  <strong>Política de cancelación:</strong> {service.cancellationPolicy}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <!-- Selected service summary -->
      {#if selectedService}
        <div class="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl" in:fly={{ y: 20, duration: 300 }}>
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 class="font-semibold text-green-900">Servicio seleccionado</h4>
                <p class="text-green-700">{selectedService.name}</p>
                <p class="text-sm text-green-600">
                  {formatDuration(selectedService.duration)} • {selectedService.category}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-green-600">Precio</p>
              <p class="text-2xl font-bold text-green-900">
                {formatPrice(selectedService.price)}
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .service-card {
    transition: all 0.2s ease-in-out;
  }
  
  .service-card:hover {
    transform: translateY(-2px);
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>