<!--
  Enhanced Location Services - Argentina Market Specialization
  Regional preferences, neighborhood optimization, cultural timing patterns
  Buenos Aires focus with peso pricing and Argentina-specific trust signals
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { writable } from 'svelte/store';
  
  export let currentLocation: string | null = null;
  export let allowGeolocation: boolean = true;
  export let showNeighborhoodPreferences: boolean = true;
  export let serviceType: 'barber' | 'psychology' | 'medical' = 'barber';
  
  const dispatch = createEventDispatcher<{
    locationSelected: { location: any; preferences: any };
    neighborhoodChanged: { neighborhood: string; culturalData: any };
    travelPreferencesUpdated: { preferences: any };
  }>();
  
  // Argentina regions and cities with cultural data
  const argentinaRegions = {
    'CABA': {
      name: 'Ciudad Autónoma de Buenos Aires',
      neighborhoods: [
        {
          id: 'palermo',
          name: 'Palermo',
          zone: 'Norte',
          demographics: {
            avgAge: 32,
            incomeLevel: 'Alto',
            lifestyle: 'Moderno/Cosmopolita',
            preferredServices: ['premium', 'trendy', 'international']
          },
          servicePricing: {
            barber: { min: 4500, max: 12000, avg: 7500 },
            psychology: { min: 5000, max: 15000, avg: 8500 },
            medical: { min: 6000, max: 20000, avg: 10000 }
          },
          culturalNotes: {
            peakHours: ['10:00-12:00', '18:00-20:00'],
            siestaImpact: 'High',
            weekendActivity: 0.85,
            paymentPreferences: ['MercadoPago', 'Tarjeta', 'Efectivo']
          },
          transport: {
            subte: ['Línea D - Palermo', 'Línea D - Ministro Carranza'],
            buses: ['39', '41', '59', '67', '92', '152'],
            accessibility: 'Excelente',
            parking: 'Limitado - zona azul'
          }
        },
        {
          id: 'recoleta',
          name: 'Recoleta',
          zone: 'Norte',
          demographics: {
            avgAge: 38,
            incomeLevel: 'Muy Alto',
            lifestyle: 'Tradicional/Elegante',
            preferredServices: ['luxury', 'traditional', 'exclusive']
          },
          servicePricing: {
            barber: { min: 5500, max: 15000, avg: 9000 },
            psychology: { min: 6000, max: 18000, avg: 10000 },
            medical: { min: 8000, max: 25000, avg: 12000 }
          },
          culturalNotes: {
            peakHours: ['09:00-11:00', '16:00-18:00'],
            siestaImpact: 'High',
            weekendActivity: 0.65,
            paymentPreferences: ['Tarjeta', 'MercadoPago', 'Transferencia']
          },
          transport: {
            subte: ['Línea H - Las Heras', 'Línea D - Callao'],
            buses: ['17', '67', '92', '110'],
            accessibility: 'Muy Buena',
            parking: 'Disponible - estacionamiento pago'
          }
        },
        {
          id: 'belgrano',
          name: 'Belgrano',
          zone: 'Norte',
          demographics: {
            avgAge: 35,
            incomeLevel: 'Alto',
            lifestyle: 'Familiar/Residencial',
            preferredServices: ['family-friendly', 'reliable', 'convenient']
          },
          servicePricing: {
            barber: { min: 3800, max: 9000, avg: 5500 },
            psychology: { min: 4500, max: 12000, avg: 7000 },
            medical: { min: 5500, max: 16000, avg: 8500 }
          },
          culturalNotes: {
            peakHours: ['10:00-12:00', '17:00-19:00'],
            siestaImpact: 'Medium',
            weekendActivity: 0.75,
            paymentPreferences: ['MercadoPago', 'Efectivo', 'Tarjeta']
          },
          transport: {
            subte: ['Línea D - Belgrano'],
            buses: ['29', '42', '60', '107', '152'],
            accessibility: 'Buena',
            parking: 'Disponible'
          }
        },
        {
          id: 'villa_crespo',
          name: 'Villa Crespo',
          zone: 'Centro',
          demographics: {
            avgAge: 29,
            incomeLevel: 'Medio-Alto',
            lifestyle: 'Bohemio/Artístico',
            preferredServices: ['alternative', 'creative', 'authentic']
          },
          servicePricing: {
            barber: { min: 3500, max: 8500, avg: 5000 },
            psychology: { min: 4000, max: 10000, avg: 6000 },
            medical: { min: 4500, max: 12000, avg: 7000 }
          },
          culturalNotes: {
            peakHours: ['11:00-13:00', '19:00-21:00'],
            siestaImpact: 'Low',
            weekendActivity: 0.90,
            paymentPreferences: ['MercadoPago', 'Efectivo', 'Crypto']
          },
          transport: {
            subte: ['Línea B - Malabia', 'Línea B - Dorrego'],
            buses: ['39', '55', '71', '140'],
            accessibility: 'Buena',
            parking: 'Disponible'
          }
        },
        {
          id: 'caballito',
          name: 'Caballito',
          zone: 'Centro',
          demographics: {
            avgAge: 33,
            incomeLevel: 'Medio',
            lifestyle: 'Tradicional/Familiar',
            preferredServices: ['affordable', 'reliable', 'neighborhood']
          },
          servicePricing: {
            barber: { min: 2800, max: 6500, avg: 4000 },
            psychology: { min: 3500, max: 8500, avg: 5000 },
            medical: { min: 4000, max: 10000, avg: 6000 }
          },
          culturalNotes: {
            peakHours: ['09:00-11:00', '16:00-18:00'],
            siestaImpact: 'High',
            weekendActivity: 0.70,
            paymentPreferences: ['Efectivo', 'MercadoPago', 'Tarjeta']
          },
          transport: {
            subte: ['Línea A - Caballito', 'Línea E - Boedo'],
            buses: ['26', '84', '92', '103', '181'],
            accessibility: 'Excelente',
            parking: 'Disponible'
          }
        }
      ]
    },
    'GBA': {
      name: 'Gran Buenos Aires',
      neighborhoods: [
        {
          id: 'san_isidro',
          name: 'San Isidro',
          zone: 'Norte',
          demographics: {
            avgAge: 40,
            incomeLevel: 'Muy Alto',
            lifestyle: 'Exclusivo/Residencial',
            preferredServices: ['luxury', 'exclusive', 'personalized']
          },
          servicePricing: {
            barber: { min: 6000, max: 18000, avg: 10000 },
            psychology: { min: 7000, max: 20000, avg: 12000 },
            medical: { min: 9000, max: 30000, avg: 15000 }
          },
          culturalNotes: {
            peakHours: ['09:00-11:00', '15:00-17:00'],
            siestaImpact: 'Very High',
            weekendActivity: 0.80,
            paymentPreferences: ['Transferencia', 'Tarjeta', 'MercadoPago']
          },
          transport: {
            tren: ['Tren Mitre - Ramal Tigre'],
            buses: ['60', '168'],
            accessibility: 'Buena',
            parking: 'Abundante'
          }
        },
        {
          id: 'lanus',
          name: 'Lanús',
          zone: 'Sur',
          demographics: {
            avgAge: 31,
            incomeLevel: 'Medio',
            lifestyle: 'Familiar/Trabajador',
            preferredServices: ['affordable', 'convenient', 'quality']
          },
          servicePricing: {
            barber: { min: 2500, max: 5500, avg: 3500 },
            psychology: { min: 3000, max: 7000, avg: 4500 },
            medical: { min: 3500, max: 8500, avg: 5500 }
          },
          culturalNotes: {
            peakHours: ['18:00-20:00', '09:00-10:00'],
            siestaImpact: 'Medium',
            weekendActivity: 0.85,
            paymentPreferences: ['Efectivo', 'MercadoPago', 'Tarjeta']
          },
          transport: {
            tren: ['Tren Roca - Ramal Temperley'],
            buses: ['22', '37', '51', '79'],
            accessibility: 'Buena',
            parking: 'Disponible'
          }
        }
      ]
    }
  };
  
  // Cultural timing patterns for Argentina
  const culturalTimingData = {
    siesta: {
      startTime: '13:00',
      endTime: '15:00',
      impact: {
        'Very High': 0.1, // 10% normal activity
        'High': 0.3,      // 30% normal activity
        'Medium': 0.6,    // 60% normal activity
        'Low': 0.8        // 80% normal activity
      }
    },
    workingHours: {
      weekdays: ['09:00-13:00', '15:00-19:00'],
      saturday: ['09:00-13:00'],
      sunday: 'Cerrado (mayoría)'
    },
    peakSeasons: {
      summer: { months: [12, 1, 2], activityMultiplier: 0.7 },
      winter: { months: [6, 7, 8], activityMultiplier: 1.2 },
      holidays: {
        december: 'Muy ocupado - reservar con anticipación',
        january: 'Actividad reducida - muchos de vacaciones',
        july: 'Vacaciones de invierno - actividad normal'
      }
    }
  };
  
  // Component state
  let selectedRegion = 'CABA';
  let selectedNeighborhood = null;
  let userLocation = writable(null);
  let locationPermission = 'prompt';
  let travelPreferences = {
    maxDistance: 5, // km
    preferredTransport: 'subte',
    walkingTolerance: 10, // minutes
    carAvailable: false,
    accessibilityNeeds: false
  };
  
  let showLocationDetails = false;
  let neighborhoodCulturalData = null;
  
  onMount(() => {
    checkGeolocationPermission();
    loadSavedPreferences();
  });
  
  function checkGeolocationPermission() {
    if ('navigator' in window && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        locationPermission = result.state;
      });
    }
  }
  
  function loadSavedPreferences() {
    // Load from localStorage or user profile
    const saved = localStorage.getItem('argentinaLocationPreferences');
    if (saved) {
      const preferences = JSON.parse(saved);
      selectedRegion = preferences.region || 'CABA';
      selectedNeighborhood = preferences.neighborhood || null;
      travelPreferences = { ...travelPreferences, ...preferences.travel };
    }
  }
  
  function savePreferences() {
    const preferences = {
      region: selectedRegion,
      neighborhood: selectedNeighborhood,
      travel: travelPreferences,
      timestamp: Date.now()
    };
    localStorage.setItem('argentinaLocationPreferences', JSON.stringify(preferences));
  }
  
  function detectLocation() {
    if (!allowGeolocation || !navigator.geolocation) {
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Simulate reverse geocoding for Buenos Aires area
        const detectedNeighborhood = detectNeighborhoodFromCoords(latitude, longitude);
        
        userLocation.set({
          lat: latitude,
          lng: longitude,
          accuracy: position.coords.accuracy,
          neighborhood: detectedNeighborhood
        });
        
        if (detectedNeighborhood) {
          selectNeighborhood(detectedNeighborhood);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Fallback to manual selection
      }
    );
  }
  
  function detectNeighborhoodFromCoords(lat: number, lng: number) {
    // Simplified neighborhood detection for Buenos Aires
    // In production, use actual geocoding service
    
    // Buenos Aires approximate bounds
    if (lat >= -34.7 && lat <= -34.5 && lng >= -58.7 && lng <= -58.3) {
      // Basic neighborhood detection based on coordinates
      if (lat > -34.58 && lng > -58.42) return 'palermo';
      if (lat > -34.60 && lng > -58.40) return 'recoleta';
      if (lat > -34.56 && lng > -58.47) return 'belgrano';
      if (lat > -34.61 && lng > -58.44) return 'villa_crespo';
      return 'caballito'; // Default central
    }
    
    return null;
  }
  
  function selectRegion(regionId: string) {
    selectedRegion = regionId;
    selectedNeighborhood = null;
    neighborhoodCulturalData = null;
    savePreferences();
  }
  
  function selectNeighborhood(neighborhoodId: string) {
    const region = argentinaRegions[selectedRegion];
    const neighborhood = region.neighborhoods.find(n => n.id === neighborhoodId);
    
    if (neighborhood) {
      selectedNeighborhood = neighborhoodId;
      neighborhoodCulturalData = {
        ...neighborhood,
        culturalInsights: generateCulturalInsights(neighborhood)
      };
      
      savePreferences();
      
      dispatch('neighborhoodChanged', {
        neighborhood: neighborhoodId,
        culturalData: neighborhoodCulturalData
      });
    }
  }
  
  function generateCulturalInsights(neighborhood: any) {
    const insights = [];
    
    // Siesta impact insights
    if (neighborhood.culturalNotes.siestaImpact === 'High' || neighborhood.culturalNotes.siestaImpact === 'Very High') {
      insights.push({
        type: 'timing',
        icon: '🕒',
        title: 'Horario de Siesta',
        description: 'La actividad disminuye significativamente entre 13:00 y 15:00. Recomendamos reservar antes de las 13:00 o después de las 15:00.'
      });
    }
    
    // Payment preferences
    const primaryPayment = neighborhood.culturalNotes.paymentPreferences[0];
    insights.push({
      type: 'payment',
      icon: '💳',
      title: `Método de Pago Preferido: ${primaryPayment}`,
      description: `En esta zona, ${primaryPayment} es el método más popular. Los proveedores suelen tener promociones especiales para este método.`
    });
    
    // Lifestyle insights
    if (neighborhood.demographics.lifestyle.includes('Moderno')) {
      insights.push({
        type: 'style',
        icon: '✨',
        title: 'Estilo Moderno',
        description: 'Los residentes prefieren servicios innovadores y tendencias internacionales. Los proveedores suelen ofrecer técnicas de vanguardia.'
      });
    } else if (neighborhood.demographics.lifestyle.includes('Tradicional')) {
      insights.push({
        type: 'style',
        icon: '🏛️',
        title: 'Estilo Tradicional',
        description: 'Se valora la experiencia clásica y la atención personalizada. Los proveedores enfatizan técnicas tradicionales y el trato familiar.'
      });
    }
    
    // Weekend activity
    if (neighborhood.culturalNotes.weekendActivity > 0.8) {
      insights.push({
        type: 'weekend',
        icon: '🎉',
        title: 'Zona Activa los Fines de Semana',
        description: 'Alta actividad los sábados y domingos. Es recomendable reservar con anticipación para los fines de semana.'
      });
    }
    
    return insights;
  }
  
  function updateTravelPreferences(key: string, value: any) {
    travelPreferences = { ...travelPreferences, [key]: value };
    savePreferences();
    
    dispatch('travelPreferencesUpdated', {
      preferences: travelPreferences
    });
  }
  
  function formatPricing(pricing: any) {
    return {
      min: `$${pricing.min.toLocaleString('es-AR')}`,
      max: `$${pricing.max.toLocaleString('es-AR')}`,
      avg: `$${pricing.avg.toLocaleString('es-AR')}`
    };
  }
  
  function selectLocation() {
    if (selectedNeighborhood && neighborhoodCulturalData) {
      dispatch('locationSelected', {
        location: {
          region: selectedRegion,
          neighborhood: selectedNeighborhood,
          data: neighborhoodCulturalData
        },
        preferences: travelPreferences
      });
    }
  }
  
  $: currentRegionData = argentinaRegions[selectedRegion];
  $: selectedNeighborhoodData = selectedNeighborhood 
    ? currentRegionData.neighborhoods.find(n => n.id === selectedNeighborhood)
    : null;
</script>

<div class="argentina-location-services bg-white rounded-xl shadow-lg border border-gray-100 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h3 class="text-xl font-bold text-gray-900 flex items-center">
        <span class="mr-2">🇦🇷</span>
        Ubicación y Preferencias Culturales
      </h3>
      <p class="text-gray-600">Encuentra servicios adaptados a tu zona y preferencias argentinas</p>
    </div>
    
    {#if allowGeolocation}
      <button 
        class="btn btn-secondary"
        on:click={detectLocation}
        disabled={locationPermission === 'denied'}
      >
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        Detectar Ubicación
      </button>
    {/if}
  </div>
  
  <!-- Current Location Display -->
  {#if $userLocation}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" transition:fade>
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-blue-900">Ubicación Detectada</p>
          <p class="text-sm text-blue-700">
            {#if $userLocation.neighborhood}
              {currentRegionData.neighborhoods.find(n => n.id === $userLocation.neighborhood)?.name}
            {:else}
              Coordenadas: {$userLocation.lat.toFixed(4)}, {$userLocation.lng.toFixed(4)}
            {/if}
          </p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Region Selection -->
  <div class="mb-6">
    <h4 class="font-semibold text-gray-900 mb-3">Región</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each Object.entries(argentinaRegions) as [regionId, region]}
        <button 
          class="p-4 border rounded-lg text-left transition-all"
          class:border-blue-300={selectedRegion === regionId}
          class:bg-blue-50={selectedRegion === regionId}
          class:border-gray-200={selectedRegion !== regionId}
          on:click={() => selectRegion(regionId)}
        >
          <div class="font-medium text-gray-900">{region.name}</div>
          <div class="text-sm text-gray-600">{region.neighborhoods.length} zonas disponibles</div>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Neighborhood Selection -->
  {#if currentRegionData}
    <div class="mb-6">
      <h4 class="font-semibold text-gray-900 mb-3">Barrio / Zona</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each currentRegionData.neighborhoods as neighborhood}
          <button 
            class="p-4 border rounded-lg text-left hover:shadow-md transition-all"
            class:border-green-300={selectedNeighborhood === neighborhood.id}
            class:bg-green-50={selectedNeighborhood === neighborhood.id}
            class:border-gray-200={selectedNeighborhood !== neighborhood.id}
            on:click={() => selectNeighborhood(neighborhood.id)}
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900">{neighborhood.name}</h5>
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {neighborhood.zone}
              </span>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Nivel socioeconómico:</span>
                <span class="font-medium text-gray-700">{neighborhood.demographics.incomeLevel}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Precio promedio:</span>
                <span class="font-medium text-green-600">
                  {formatPricing(neighborhood.servicePricing[serviceType]).avg}
                </span>
              </div>
              
              <div class="text-xs text-gray-500">
                {neighborhood.demographics.lifestyle}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Selected Neighborhood Details -->
  {#if selectedNeighborhoodData && neighborhoodCulturalData}
    <div class="mb-6" transition:fly={{ y: 20, duration: 300 }}>
      <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h4 class="font-semibold text-green-900 mb-4 flex items-center">
          <span class="mr-2">📍</span>
          {selectedNeighborhoodData.name} - Información Cultural
        </h4>
        
        <!-- Cultural Insights -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {#each neighborhoodCulturalData.culturalInsights as insight}
            <div class="bg-white border border-green-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="text-2xl">{insight.icon}</div>
                <div>
                  <h5 class="font-medium text-gray-900 mb-1">{insight.title}</h5>
                  <p class="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Service Pricing Range -->
        <div class="bg-white border border-green-200 rounded-lg p-4 mb-4">
          <h5 class="font-medium text-gray-900 mb-3">Rango de Precios para {serviceType === 'barber' ? 'Barbería' : serviceType === 'psychology' ? 'Psicología' : 'Medicina'}</h5>
          <div class="flex items-center justify-between text-sm">
            <div class="text-center">
              <div class="text-lg font-bold text-gray-700">{formatPricing(selectedNeighborhoodData.servicePricing[serviceType]).min}</div>
              <div class="text-gray-500">Mínimo</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-green-600">{formatPricing(selectedNeighborhoodData.servicePricing[serviceType]).avg}</div>
              <div class="text-gray-500">Promedio</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-gray-700">{formatPricing(selectedNeighborhoodData.servicePricing[serviceType]).max}</div>
              <div class="text-gray-500">Máximo</div>
            </div>
          </div>
        </div>
        
        <!-- Transportation Info -->
        <div class="bg-white border border-green-200 rounded-lg p-4">
          <h5 class="font-medium text-gray-900 mb-3">Transporte y Acceso</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h6 class="font-medium text-gray-700 mb-1">Transporte Público</h6>
              <ul class="space-y-1 text-gray-600">
                {#if selectedNeighborhoodData.transport.subte}
                  {#each selectedNeighborhoodData.transport.subte as line}
                    <li>🚇 {line}</li>
                  {/each}
                {/if}
                {#if selectedNeighborhoodData.transport.tren}
                  {#each selectedNeighborhoodData.transport.tren as line}
                    <li>🚂 {line}</li>
                  {/each}
                {/if}
                {#if selectedNeighborhoodData.transport.buses}
                  <li>🚌 Colectivos: {selectedNeighborhoodData.transport.buses.join(', ')}</li>
                {/if}
              </ul>
            </div>
            
            <div>
              <h6 class="font-medium text-gray-700 mb-1">Estacionamiento</h6>
              <p class="text-gray-600">🅿️ {selectedNeighborhoodData.transport.parking}</p>
              
              <h6 class="font-medium text-gray-700 mb-1 mt-3">Accesibilidad</h6>
              <p class="text-gray-600">♿ {selectedNeighborhoodData.transport.accessibility}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Travel Preferences -->
  <div class="mb-6">
    <h4 class="font-semibold text-gray-900 mb-4">Preferencias de Desplazamiento</h4>
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Distance Preference -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Distancia máxima: {travelPreferences.maxDistance} km
          </label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            step="1"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            bind:value={travelPreferences.maxDistance}
            on:change={() => updateTravelPreferences('maxDistance', travelPreferences.maxDistance)}
          >
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>20 km</span>
          </div>
        </div>
        
        <!-- Transport Preference -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Transporte preferido</label>
          <select 
            class="w-full p-2 border border-gray-300 rounded-lg"
            bind:value={travelPreferences.preferredTransport}
            on:change={() => updateTravelPreferences('preferredTransport', travelPreferences.preferredTransport)}
          >
            <option value="subte">🚇 Subte (Metro)</option>
            <option value="colectivo">🚌 Colectivo (Bus)</option>
            <option value="tren">🚂 Tren</option>
            <option value="auto">🚗 Auto propio</option>
            <option value="caminando">🚶 Caminando</option>
            <option value="bicicleta">🚴 Bicicleta</option>
            <option value="taxi">🚕 Taxi/Uber</option>
          </select>
        </div>
        
        <!-- Walking Tolerance -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tolerancia para caminar: {travelPreferences.walkingTolerance} min
          </label>
          <input 
            type="range" 
            min="5" 
            max="30" 
            step="5"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            bind:value={travelPreferences.walkingTolerance}
            on:change={() => updateTravelPreferences('walkingTolerance', travelPreferences.walkingTolerance)}
          >
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 min</span>
            <span>30 min</span>
          </div>
        </div>
        
        <!-- Additional Options -->
        <div class="space-y-3">
          <label class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              class="form-checkbox h-4 w-4 text-blue-600"
              bind:checked={travelPreferences.carAvailable}
              on:change={() => updateTravelPreferences('carAvailable', travelPreferences.carAvailable)}
            >
            <span class="text-sm text-gray-700">Tengo auto disponible</span>
          </label>
          
          <label class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              class="form-checkbox h-4 w-4 text-blue-600"
              bind:checked={travelPreferences.accessibilityNeeds}
              on:change={() => updateTravelPreferences('accessibilityNeeds', travelPreferences.accessibilityNeeds)}
            >
            <span class="text-sm text-gray-700">Necesito accesibilidad especial</span>
          </label>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Cultural Timing Information -->
  <div class="mb-6">
    <h4 class="font-semibold text-gray-900 mb-4">Información Cultural de Horarios</h4>
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl mb-2">🕒</div>
          <h5 class="font-medium text-gray-900 mb-1">Horario de Siesta</h5>
          <p class="text-sm text-gray-600">
            {culturalTimingData.siesta.startTime} - {culturalTimingData.siesta.endTime}
          </p>
          <p class="text-xs text-yellow-700 mt-1">
            Menor actividad comercial
          </p>
        </div>
        
        <div class="text-center">
          <div class="text-2xl mb-2">⏰</div>
          <h5 class="font-medium text-gray-900 mb-1">Horarios Comerciales</h5>
          <p class="text-sm text-gray-600">
            Lun-Vie: {culturalTimingData.workingHours.weekdays.join(', ')}
          </p>
          <p class="text-sm text-gray-600">
            Sáb: {culturalTimingData.workingHours.saturday}
          </p>
        </div>
        
        <div class="text-center">
          <div class="text-2xl mb-2">🏖️</div>
          <h5 class="font-medium text-gray-900 mb-1">Época del Año</h5>
          <p class="text-sm text-gray-600">
            Enero: Vacaciones de verano
          </p>
          <p class="text-sm text-gray-600">
            Julio: Vacaciones de invierno
          </p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Action Button -->
  {#if selectedNeighborhood}
    <div class="text-center">
      <button class="btn btn-primary btn-lg" on:click={selectLocation}>
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Confirmar Ubicación y Preferencias
      </button>
      
      <p class="text-sm text-gray-600 mt-2">
        Se mostrarán servicios optimizados para {selectedNeighborhoodData?.name} con precios desde {formatPricing(selectedNeighborhoodData?.servicePricing[serviceType] || {}).min}
      </p>
    </div>
  {/if}
</div>

<style>
  .argentina-location-services {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .btn {
    @apply inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-500;
  }
  
  .btn-secondary {
    @apply text-gray-700 bg-white border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-gray-500;
  }
  
  .btn-lg {
    @apply px-8 py-4 text-lg;
  }
  
  .form-checkbox {
    @apply rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
  }
</style>