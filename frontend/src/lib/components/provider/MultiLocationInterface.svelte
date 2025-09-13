<script lang="ts">
  // Multi-Location Interface - Leveraging Argentina expansion architecture
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Button from '../Button.svelte';
  import Modal from '../Modal.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let locations: any[] = [];
  export let activeLocation: any = null;
  export let argentinaInsights: any = {};
  
  const dispatch = createEventDispatcher();
  
  // Location management state
  let isAddingLocation = false;
  let isEditingLocation = false;
  let selectedLocationForEdit: any = null;
  let isLoading = false;
  let locationStats: any = {};
  
  // Argentina cities with population data (from Day 8 expansion success)
  const argentinaCities = [
    { name: 'Buenos Aires', province: 'Buenos Aires', population: 15200000, status: 'active' },
    { name: 'Córdoba', province: 'Córdoba', population: 1600000, status: 'active' },
    { name: 'Rosario', province: 'Santa Fe', population: 1200000, status: 'ready' },
    { name: 'La Plata', province: 'Buenos Aires', population: 700000, status: 'ready' },
    { name: 'Mar del Plata', province: 'Buenos Aires', population: 650000, status: 'planned' },
    { name: 'Tucumán', province: 'Tucumán', population: 550000, status: 'planned' },
    { name: 'Salta', province: 'Salta', population: 540000, status: 'planned' },
    { name: 'Mendoza', province: 'Mendoza', population: 1000000, status: 'planned' }
  ];
  
  // New location form
  let newLocation = {
    name: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', enabled: true },
      tuesday: { open: '09:00', close: '18:00', enabled: true },
      wednesday: { open: '09:00', close: '18:00', enabled: true },
      thursday: { open: '09:00', close: '18:00', enabled: true },
      friday: { open: '09:00', close: '18:00', enabled: true },
      saturday: { open: '09:00', close: '15:00', enabled: true },
      sunday: { open: '10:00', close: '14:00', enabled: false }
    },
    services: [],
    staff: []
  };
  
  onMount(async () => {
    await loadLocationStats();
    
    // Track multi-location access
    uxAnalyticsService.trackEvent('multi_location_access', {
      totalLocations: locations.length,
      argentinaExpansion: true,
      activeCity: activeLocation?.city
    });
  });
  
  async function loadLocationStats() {
    try {
      const response = await fetch('/api/provider/locations/stats', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Expansion': 'true'
        }
      });
      
      if (response.ok) {
        locationStats = await response.json();
      }
    } catch (error) {
      console.error('[MultiLocation] Stats loading error:', error);
    }
  }
  
  function openAddLocation() {
    isAddingLocation = true;
    resetLocationForm();
    
    uxAnalyticsService.trackEvent('location_add_initiated', {
      currentLocations: locations.length
    });
  }
  
  function openEditLocation(location: any) {
    selectedLocationForEdit = location;
    newLocation = { ...location };
    isEditingLocation = true;
    
    uxAnalyticsService.trackEvent('location_edit_initiated', {
      locationId: location.id,
      city: location.city
    });
  }
  
  function resetLocationForm() {
    newLocation = {
      name: '',
      address: '',
      city: '',
      province: '',
      phone: '',
      email: '',
      businessHours: {
        monday: { open: '09:00', close: '18:00', enabled: true },
        tuesday: { open: '09:00', close: '18:00', enabled: true },
        wednesday: { open: '09:00', close: '18:00', enabled: true },
        thursday: { open: '09:00', close: '18:00', enabled: true },
        friday: { open: '09:00', close: '18:00', enabled: true },
        saturday: { open: '09:00', close: '15:00', enabled: true },
        sunday: { open: '10:00', close: '14:00', enabled: false }
      },
      services: [],
      staff: []
    };
  }
  
  async function saveLocation() {
    if (!newLocation.name || !newLocation.address || !newLocation.city) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    
    isLoading = true;
    
    try {
      const endpoint = isEditingLocation 
        ? `/api/provider/locations/${selectedLocationForEdit.id}`
        : '/api/provider/locations';
      
      const method = isEditingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Expansion': 'true'
        },
        body: JSON.stringify({
          ...newLocation,
          argentinaOptimized: true
        })
      });
      
      if (response.ok) {
        const savedLocation = await response.json();
        
        if (isEditingLocation) {
          // Update existing location
          locations = locations.map(loc => 
            loc.id === selectedLocationForEdit.id ? savedLocation : loc
          );
        } else {
          // Add new location
          locations = [...locations, savedLocation];
        }
        
        // Close modals
        isAddingLocation = false;
        isEditingLocation = false;
        selectedLocationForEdit = null;
        
        // Reload stats
        await loadLocationStats();
        
        // Track successful save
        uxAnalyticsService.trackEvent('location_saved', {
          type: isEditingLocation ? 'edit' : 'add',
          city: newLocation.city,
          province: newLocation.province
        });
        
        dispatch('locationUpdated', { locations });
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('[MultiLocation] Save error:', error);
      alert('Error al guardar la sucursal');
    } finally {
      isLoading = false;
    }
  }
  
  async function toggleLocationStatus(location: any) {
    try {
      const response = await fetch(`/api/provider/locations/${location.id}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        const updatedLocation = await response.json();
        locations = locations.map(loc => 
          loc.id === location.id ? updatedLocation : loc
        );
        
        uxAnalyticsService.trackEvent('location_status_toggled', {
          locationId: location.id,
          newStatus: updatedLocation.status
        });
      }
    } catch (error) {
      console.error('[MultiLocation] Toggle status error:', error);
    }
  }
  
  function setActiveLocation(location: any) {
    activeLocation = location;
    
    uxAnalyticsService.trackEvent('active_location_changed', {
      locationId: location.id,
      city: location.city
    });
    
    dispatch('activeLocationChanged', { activeLocation: location });
  }
  
  function getCityStatus(cityName: string): string {
    const city = argentinaCities.find(c => c.name === cityName);
    return city?.status || 'not_available';
  }
  
  function getCityPopulation(cityName: string): number {
    const city = argentinaCities.find(c => c.name === cityName);
    return city?.population || 0;
  }
  
  function getStatusColor(status: string): string {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      ready: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[status] || colors.inactive;
  }
  
  function getStatusText(status: string): string {
    const texts = {
      active: 'Activo',
      ready: 'Listo',
      planned: 'Planificado',
      inactive: 'Inactivo'
    };
    return texts[status] || 'Desconocido';
  }
</script>

<!-- Multi-Location Management Interface -->
<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        📍 Gestión de Sucursales
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Administra tus ubicaciones en Argentina
      </p>
    </div>
    
    <Button
      variant="primary"
      size="md"
      on:click={openAddLocation}
      class="mt-4 lg:mt-0"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Agregar Sucursal
    </Button>
  </div>
  
  <!-- Argentina Expansion Overview -->
  <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-xl font-bold mb-1">¡Expansión Argentina Disponible!</h3>
        <p class="opacity-90">Lleva tu negocio a las principales ciudades del país</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold">8</div>
        <div class="text-sm opacity-75">ciudades disponibles</div>
      </div>
    </div>
    
    <!-- Quick City Status -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      {#each argentinaCities.slice(0, 4) as city}
        <div class="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
          <div class="text-sm font-medium">{city.name}</div>
          <div class="text-xs opacity-75">{(city.population / 1000000).toFixed(1)}M hab.</div>
          <div class="mt-1">
            <span class="px-2 py-1 bg-white/20 rounded text-xs">
              {getStatusText(city.status)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Current Locations -->
  {#if locations.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each locations as location (location.id)}
        <div 
          class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all duration-200 hover:shadow-xl"
          class:border-blue-500={activeLocation?.id === location.id}
          class:border-gray-200={activeLocation?.id !== location.id}
          class:dark:border-gray-600={activeLocation?.id !== location.id}
          in:scale={{ duration: 300, start: 0.95 }}
        >
          <!-- Location Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {location.name}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {location.address}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500">
                {location.city}, {location.province}
              </p>
            </div>
            
            <!-- Status Badge -->
            <div class="ml-2">
              <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(location.status)}">
                {getStatusText(location.status)}
              </span>
            </div>
          </div>
          
          <!-- Location Stats -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {locationStats[location.id]?.bookings || 0}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Reservas</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                ${(locationStats[location.id]?.revenue || 0).toLocaleString('es-AR')}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Ingresos</div>
            </div>
          </div>
          
          <!-- City Information -->
          {#if getCityPopulation(location.city) > 0}
            <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Población:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {(getCityPopulation(location.city) / 1000000).toFixed(1)}M habitantes
                </span>
              </div>
              <div class="flex items-center justify-between text-sm mt-1">
                <span class="text-gray-600 dark:text-gray-400">Estado:</span>
                <span class="font-medium {getStatusColor(getCityStatus(location.city))} px-2 py-1 rounded">
                  {getStatusText(getCityStatus(location.city))}
                </span>
              </div>
            </div>
          {/if}
          
          <!-- Business Hours -->
          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Horarios de Atención
            </h4>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Lun - Vie:</span>
                <span class="text-gray-900 dark:text-white">
                  {location.businessHours?.monday?.open} - {location.businessHours?.friday?.close}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Sábado:</span>
                <span class="text-gray-900 dark:text-white">
                  {location.businessHours?.saturday?.enabled 
                    ? `${location.businessHours.saturday.open} - ${location.businessHours.saturday.close}`
                    : 'Cerrado'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col space-y-2">
            <div class="flex space-x-2">
              <Button
                variant={activeLocation?.id === location.id ? 'secondary' : 'primary'}
                size="sm"
                class="flex-1"
                on:click={() => setActiveLocation(location)}
              >
                {activeLocation?.id === location.id ? 'Activo' : 'Activar'}
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                on:click={() => openEditLocation(location)}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            </div>
            
            <Button
              variant={location.status === 'active' ? 'danger' : 'success'}
              size="sm"
              class="w-full"
              on:click={() => toggleLocationStatus(location)}
            >
              {location.status === 'active' ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-12" in:fade>
      <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No tienes sucursales configuradas
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Agrega tu primera sucursal para comenzar a expandir tu negocio en Argentina
      </p>
      <Button variant="primary" on:click={openAddLocation}>
        Agregar Primera Sucursal
      </Button>
    </div>
  {/if}
</div>

<!-- Add/Edit Location Modal -->
<Modal 
  open={isAddingLocation || isEditingLocation} 
  on:close={() => {
    isAddingLocation = false;
    isEditingLocation = false;
    selectedLocationForEdit = null;
  }}
  title={isEditingLocation ? 'Editar Sucursal' : 'Nueva Sucursal'}
  size="large"
>
  <form on:submit|preventDefault={saveLocation} class="space-y-6">
    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre de la Sucursal *
        </label>
        <input
          type="text"
          bind:value={newLocation.name}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Ej: Sucursal Centro"
          required
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Teléfono
        </label>
        <input
          type="tel"
          bind:value={newLocation.phone}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="+54 11 1234-5678"
        >
      </div>
    </div>
    
    <!-- Address -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Dirección Completa *
      </label>
      <input
        type="text"
        bind:value={newLocation.address}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Av. Corrientes 1234, CABA"
        required
      >
    </div>
    
    <!-- Location -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ciudad *
        </label>
        <select
          bind:value={newLocation.city}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Selecciona una ciudad</option>
          {#each argentinaCities as city}
            <option value={city.name}>
              {city.name} ({(city.population / 1000000).toFixed(1)}M hab.)
            </option>
          {/each}
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Provincia *
        </label>
        <input
          type="text"
          bind:value={newLocation.province}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Buenos Aires"
          required
        >
      </div>
    </div>
    
    <!-- Email -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Email de Contacto
      </label>
      <input
        type="email"
        bind:value={newLocation.email}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="sucursal@empresa.com"
      >
    </div>
    
    <!-- Business Hours -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Horarios de Atención
      </h3>
      
      <div class="space-y-3">
        {#each Object.entries(newLocation.businessHours) as [day, hours]}
          {@const dayNames = {
            monday: 'Lunes',
            tuesday: 'Martes', 
            wednesday: 'Miércoles',
            thursday: 'Jueves',
            friday: 'Viernes',
            saturday: 'Sábado',
            sunday: 'Domingo'
          }}
          
          <div class="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="w-20">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  bind:checked={hours.enabled}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {dayNames[day]}
                </span>
              </label>
            </div>
            
            {#if hours.enabled}
              <div class="flex items-center space-x-2">
                <input
                  type="time"
                  bind:value={hours.open}
                  class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-white"
                >
                <span class="text-gray-500">a</span>
                <input
                  type="time"
                  bind:value={hours.close}
                  class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-white"
                >
              </div>
            {:else}
              <span class="text-sm text-gray-500 dark:text-gray-400">Cerrado</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Form Actions -->
    <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-6 border-t border-gray-200 dark:border-gray-600">
      <Button
        variant="secondary"
        type="button"
        on:click={() => {
          isAddingLocation = false;
          isEditingLocation = false;
          selectedLocationForEdit = null;
        }}
        disabled={isLoading}
      >
        Cancelar
      </Button>
      
      <Button
        variant="primary"
        type="submit"
        disabled={isLoading}
        class="flex items-center space-x-2"
      >
        {#if isLoading}
          <LoadingSpinner size="small" />
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
        <span>{isEditingLocation ? 'Actualizar' : 'Crear'} Sucursal</span>
      </Button>
    </div>
  </form>
</Modal>

<style>
  /* Argentina mobile optimization */
  @media (max-width: 768px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
    }
    
    .md\:grid-cols-2 {
      grid-template-columns: 1fr;
    }
    
    .xl\:grid-cols-3 {
      grid-template-columns: 1fr;
    }
  }
  
  /* Smooth transitions */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
  
  /* Card hover effects */
  .hover\:shadow-xl:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
</style>