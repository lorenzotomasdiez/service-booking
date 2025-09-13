<!--
  Advanced Search and Filtering System
  Optimized for Argentina market preferences
  Supports voice search, location-based filtering, and cultural preferences
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { uxAnalytics } from '$lib/services/ux-analytics';
  
  export let initialQuery: string = '';
  export let showFilters: boolean = true;
  export let enableVoiceSearch: boolean = true;
  export let location: string = 'Buenos Aires';
  
  const dispatch = createEventDispatcher<{
    search: { query: string; filters: SearchFilters; results: SearchResult[] };
    filterChanged: { filter: string; value: any };
    locationSelected: { location: string };
  }>();
  
  interface SearchFilters {
    serviceType: string[];
    priceRange: [number, number];
    availability: 'today' | 'week' | 'month' | 'any';
    rating: number;
    distance: number;
    neighborhood: string[];
    paymentMethods: string[];
    specialFeatures: string[];
    businessHours: string[];
  }
  
  interface SearchResult {
    id: string;
    businessName: string;
    services: string[];
    rating: number;
    reviews: number;
    distance: string;
    neighborhood: string;
    priceRange: string;
    availability: string;
    image: string;
    verified: boolean;
    features: string[];
  }
  
  // Search state
  let searchQuery = initialQuery;
  let isSearching = false;
  let showAdvancedFilters = false;
  let voiceSearchSupported = false;
  let isListening = false;
  
  // Filter state
  let filters: SearchFilters = {
    serviceType: [],
    priceRange: [1000, 10000],
    availability: 'any',
    rating: 0,
    distance: 10,
    neighborhood: [],
    paymentMethods: [],
    specialFeatures: [],
    businessHours: []
  };
  
  // Argentina-specific options
  let serviceTypes = [
    { id: 'corte-clasico', label: 'Corte Clásico', icon: '✂️' },
    { id: 'barba-styling', label: 'Barba & Styling', icon: '🧔' },
    { id: 'combo-completo', label: 'Combo Completo', icon: '💫' },
    { id: 'afeitado-tradicional', label: 'Afeitado Tradicional', icon: '🪒' },
    { id: 'tratamiento-capilar', label: 'Tratamiento Capilar', icon: '💆‍♂️' },
    { id: 'coloracion', label: 'Coloración', icon: '🎨' }
  ];
  
  let neighborhoods = [
    'Palermo', 'Recoleta', 'Belgrano', 'San Telmo', 'La Boca', 
    'Puerto Madero', 'Caballito', 'Villa Crespo', 'Barracas', 'Nuñez'
  ];
  
  let paymentMethods = [
    { id: 'mercadopago', label: 'MercadoPago', preferred: true },
    { id: 'efectivo', label: 'Efectivo', preferred: false },
    { id: 'tarjeta', label: 'Tarjeta de Crédito', preferred: false },
    { id: 'debito', label: 'Débito', preferred: false }
  ];
  
  let specialFeatures = [
    'WhatsApp Business', 'Turnos Online', 'Descuentos Estudiantes',
    'Estacionamiento', 'WiFi Gratuito', 'Productos Argentinos',
    'Atención Domicilio', 'Horario Extendido'
  ];
  
  let businessHours = [
    'Mañana (8-12hs)', 'Tarde (14-18hs)', 'Noche (18-22hs)', 
    'Fines de Semana', 'Feriados'
  ];
  
  // Sample search results (based on Day 6 data)
  let searchResults: SearchResult[] = [
    {
      id: '1',
      businessName: 'Barbería Premium Palermo',
      services: ['Corte Clásico', 'Barba Styling'],
      rating: 4.8,
      reviews: 127,
      distance: '0.8 km',
      neighborhood: 'Palermo',
      priceRange: 'ARS 3,500 - 5,500',
      availability: 'Hoy disponible',
      image: '/api/placeholder/150/150',
      verified: true,
      features: ['WhatsApp Business', 'MercadoPago', 'Wifi Gratuito']
    },
    {
      id: '2',
      businessName: 'Estilo Recoleta',
      services: ['Combo Completo', 'Tratamiento Capilar'],
      rating: 4.9,
      reviews: 89,
      distance: '1.2 km',
      neighborhood: 'Recoleta',
      priceRange: 'ARS 4,000 - 7,000',
      availability: 'Mañana disponible',
      image: '/api/placeholder/150/150',
      verified: true,
      features: ['Turnos Online', 'Estacionamiento', 'Productos Argentinos']
    }
  ];
  
  onMount(() => {
    checkVoiceSearchSupport();
    initializeLocationServices();
  });
  
  function checkVoiceSearchSupport() {
    voiceSearchSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
  
  function initializeLocationServices() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In production, would reverse geocode to get Argentina neighborhood
          console.log('Location detected:', position.coords);
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }
  
  function performSearch() {
    isSearching = true;
    
    // Track search behavior
    uxAnalytics.trackSearchBehavior(searchQuery, filters, searchResults.length);
    
    // Simulate search delay
    setTimeout(() => {
      // In production, this would be an API call
      const results = filterResults(searchResults);
      
      dispatch('search', {
        query: searchQuery,
        filters,
        results
      });
      
      isSearching = false;
    }, 800);
  }
  
  function filterResults(results: SearchResult[]): SearchResult[] {
    return results.filter(result => {
      // Apply filters
      if (filters.serviceType.length > 0) {
        const hasMatchingService = filters.serviceType.some(serviceId =>
          result.services.some(service => 
            service.toLowerCase().includes(serviceId.replace('-', ' '))
          )
        );
        if (!hasMatchingService) return false;
      }
      
      if (filters.rating > 0 && result.rating < filters.rating) {
        return false;
      }
      
      if (filters.neighborhood.length > 0 && !filters.neighborhood.includes(result.neighborhood)) {
        return false;
      }
      
      return true;
    });
  }
  
  function startVoiceSearch() {
    if (!voiceSearchSupported) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-AR'; // Argentina Spanish
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      isListening = true;
      uxAnalytics.trackExternalEvent('voice_search_started', {
        location,
        timestamp: Date.now()
      });
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      searchQuery = transcript;
      performSearch();
      
      uxAnalytics.trackExternalEvent('voice_search_completed', {
        query: transcript,
        confidence: event.results[0][0].confidence,
        timestamp: Date.now()
      });
    };
    
    recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);
      uxAnalytics.trackExternalEvent('voice_search_error', {
        error: event.error,
        timestamp: Date.now()
      });
    };
    
    recognition.onend = () => {
      isListening = false;
    };
    
    recognition.start();
  }
  
  function updateFilter(filterName: keyof SearchFilters, value: any) {
    filters = { ...filters, [filterName]: value };
    
    dispatch('filterChanged', { filter: filterName, value });
    
    // Auto-search when filters change
    if (searchQuery || Object.values(filters).some(v => 
      Array.isArray(v) ? v.length > 0 : v !== 0 && v !== 'any'
    )) {
      performSearch();
    }
  }
  
  function clearFilters() {
    filters = {
      serviceType: [],
      priceRange: [1000, 10000],
      availability: 'any',
      rating: 0,
      distance: 10,
      neighborhood: [],
      paymentMethods: [],
      specialFeatures: [],
      businessHours: []
    };
    
    if (searchQuery) {
      performSearch();
    }
  }
  
  function selectLocation(newLocation: string) {
    location = newLocation;
    dispatch('locationSelected', { location: newLocation });
  }
</script>

<div class="advanced-search-system">
  <!-- Main Search Bar -->
  <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
    <div class="flex items-center space-x-4 mb-4">
      <div class="flex-1 relative">
        <input
          type="text"
          placeholder="Buscar barbería, servicio o barrio en {location}..."
          bind:value={searchQuery}
          on:input={performSearch}
          class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        >
        <div class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {#if isSearching}
          <div class="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        {/if}
      </div>
      
      <!-- Voice Search Button -->
      {#if enableVoiceSearch && voiceSearchSupported}
        <button
          type="button"
          on:click={startVoiceSearch}
          disabled={isListening}
          class="p-3 rounded-lg border-2 transition-all"
          class:border-red-500={isListening}
          class:bg-red-50={isListening}
          class:border-gray-300={!isListening}
          class:hover:border-blue-500={!isListening}
          class:animate-pulse={isListening}
        >
          {#if isListening}
            <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          {/if}
        </button>
      {/if}
      
      <!-- Filters Toggle -->
      {#if showFilters}
        <button
          type="button"
          on:click={() => showAdvancedFilters = !showAdvancedFilters}
          class="p-3 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors"
          class:bg-blue-50={showAdvancedFilters}
          class:border-blue-500={showAdvancedFilters}
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      {/if}
    </div>
    
    <!-- Quick Filters -->
    <div class="flex flex-wrap gap-2">
      {#each serviceTypes.slice(0, 4) as service}
        <button
          type="button"
          on:click={() => {
            if (filters.serviceType.includes(service.id)) {
              filters.serviceType = filters.serviceType.filter(s => s !== service.id);
            } else {
              filters.serviceType = [...filters.serviceType, service.id];
            }
            updateFilter('serviceType', filters.serviceType);
          }}
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
          class:bg-blue-100={filters.serviceType.includes(service.id)}
          class:text-blue-800={filters.serviceType.includes(service.id)}
          class:bg-gray-100={!filters.serviceType.includes(service.id)}
          class:text-gray-700={!filters.serviceType.includes(service.id)}
        >
          <span class="mr-1">{service.icon}</span>
          {service.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Advanced Filters Panel -->
  {#if showAdvancedFilters}
    <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6" transition:slide={{ duration: 300 }}>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
        <button
          type="button"
          on:click={clearFilters}
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Limpiar Filtros
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Price Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Rango de Precios (ARS)</label>
          <div class="space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>${filters.priceRange[0].toLocaleString()}</span>
              <span>${filters.priceRange[1].toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="15000"
              step="500"
              bind:value={filters.priceRange[1]}
              on:change={() => updateFilter('priceRange', filters.priceRange)}
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
          </div>
        </div>
        
        <!-- Rating -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Calificación Mínima</label>
          <div class="flex space-x-2">
            {#each [0, 3, 4, 4.5] as rating}
              <button
                type="button"
                on:click={() => updateFilter('rating', rating)}
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                class:bg-yellow-100={filters.rating === rating}
                class:text-yellow-800={filters.rating === rating}
                class:bg-gray-100={filters.rating !== rating}
                class:text-gray-700={filters.rating !== rating}
              >
                {rating === 0 ? 'Todas' : `${rating}+ ⭐`}
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Availability -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Disponibilidad</label>
          <select
            bind:value={filters.availability}
            on:change={() => updateFilter('availability', filters.availability)}
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="any">Cualquier momento</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>
        
        <!-- Neighborhoods -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Barrios</label>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            {#each neighborhoods as neighborhood}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  value={neighborhood}
                  on:change={(e) => {
                    if (e.target.checked) {
                      filters.neighborhood = [...filters.neighborhood, neighborhood];
                    } else {
                      filters.neighborhood = filters.neighborhood.filter(n => n !== neighborhood);
                    }
                    updateFilter('neighborhood', filters.neighborhood);
                  }}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="ml-2 text-sm text-gray-700">{neighborhood}</span>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Payment Methods -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Métodos de Pago</label>
          <div class="space-y-2">
            {#each paymentMethods as method}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  value={method.id}
                  on:change={(e) => {
                    if (e.target.checked) {
                      filters.paymentMethods = [...filters.paymentMethods, method.id];
                    } else {
                      filters.paymentMethods = filters.paymentMethods.filter(m => m !== method.id);
                    }
                    updateFilter('paymentMethods', filters.paymentMethods);
                  }}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="ml-2 text-sm text-gray-700 flex items-center">
                  {method.label}
                  {#if method.preferred}
                    <span class="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">Popular</span>
                  {/if}
                </span>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Special Features -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Características</label>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            {#each specialFeatures as feature}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  value={feature}
                  on:change={(e) => {
                    if (e.target.checked) {
                      filters.specialFeatures = [...filters.specialFeatures, feature];
                    } else {
                      filters.specialFeatures = filters.specialFeatures.filter(f => f !== feature);
                    }
                    updateFilter('specialFeatures', filters.specialFeatures);
                  }}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="ml-2 text-sm text-gray-700">{feature}</span>
              </label>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Search Results -->
  {#if searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== 0 && v !== 'any')}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          Resultados de búsqueda ({searchResults.length})
        </h3>
        
        <!-- Sort Options -->
        <select class="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="relevance">Más Relevante</option>
          <option value="rating">Mejor Calificados</option>
          <option value="distance">Más Cercanos</option>
          <option value="price-low">Menor Precio</option>
          <option value="price-high">Mayor Precio</option>
        </select>
      </div>
      
      <!-- Results List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each filterResults(searchResults) as result}
          <div 
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            in:fly={{ y: 20, duration: 300 }}
          >
            <div class="flex items-start space-x-4">
              <div class="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                <img src={result.image} alt={result.businessName} class="w-full h-full object-cover" />
              </div>
              
              <div class="flex-1">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h4 class="font-semibold text-gray-900 flex items-center">
                      {result.businessName}
                      {#if result.verified}
                        <svg class="w-4 h-4 text-blue-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.282.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      {/if}
                    </h4>
                    <p class="text-sm text-gray-600">{result.neighborhood} • {result.distance}</p>
                  </div>
                  
                  <div class="text-right">
                    <div class="flex items-center space-x-1">
                      <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span class="text-sm font-medium text-gray-700">{result.rating}</span>
                      <span class="text-sm text-gray-500">({result.reviews})</span>
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <p class="text-sm text-gray-600 mb-1">Servicios:</p>
                  <div class="flex flex-wrap gap-1">
                    {#each result.services as service}
                      <span class="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {service}
                      </span>
                    {/each}
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{result.priceRange}</p>
                    <p class="text-xs text-green-600">{result.availability}</p>
                  </div>
                  
                  <button class="btn btn-sm btn-primary">
                    Ver Detalles
                  </button>
                </div>
                
                <!-- Features -->
                {#if result.features.length > 0}
                  <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="flex flex-wrap gap-1">
                      {#each result.features.slice(0, 3) as feature}
                        <span class="inline-block px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                          {feature}
                        </span>
                      {/each}
                      {#if result.features.length > 3}
                        <span class="inline-block px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                          +{result.features.length - 3} más
                        </span>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      {#if filterResults(searchResults).length === 0}
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
          <p class="text-gray-600 mb-4">Intenta ajustar tus filtros o buscar con términos diferentes</p>
          <button
            type="button"
            on:click={clearFilters}
            class="btn btn-primary"
          >
            Limpiar Filtros
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>