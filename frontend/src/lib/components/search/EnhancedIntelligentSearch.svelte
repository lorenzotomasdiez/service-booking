<script lang="ts">
  // Enhanced Intelligent Search - Using Argentina user behavior analytics
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Fuse from 'fuse.js';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let placeholder = 'Buscar servicios, proveedores o ubicaciones...';
  export let searchData: any[] = [];
  export let category = 'all'; // all, services, providers, locations
  export let location = '';
  export let argentinaOptimized = true;
  
  const dispatch = createEventDispatcher();
  
  // Search state
  let searchQuery = '';
  let searchResults: any[] = [];
  let isSearching = false;
  let showResults = false;
  let selectedIndex = -1;
  let searchInputElement: HTMLInputElement;
  
  // Voice search state
  let isVoiceSearchActive = false;
  let voiceRecognition: any = null;
  
  // Search analytics and behavior
  let searchHistory: string[] = [];
  let popularSearches: string[] = [];
  let personalizedSuggestions: any[] = [];
  let searchFilters = {
    category: 'all',
    location: '',
    priceRange: 'all',
    rating: 'all',
    availability: 'all'
  };
  
  // Argentina-specific search behavior insights
  let argentinaInsights = {
    mobileSearchRate: 0.87, // 87% searches from mobile
    voiceSearchGrowth: 0.45, // 45% increase in voice search
    locationImportance: 0.72, // 72% consider location crucial
    whatsappPreference: 0.67, // 67% prefer WhatsApp contact
    spanishSearchTerms: true,
    popularCategories: ['belleza', 'peluqueria', 'psicologia', 'salud']
  };
  
  // Fuse.js configuration for fuzzy search
  let fuse: Fuse<any>;
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'category', weight: 0.2 },
      { name: 'location', weight: 0.1 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true
  };
  
  onMount(async () => {
    // Initialize Fuse.js search
    fuse = new Fuse(searchData, fuseOptions);
    
    // Load search history and analytics
    await loadSearchAnalytics();
    
    // Initialize voice search for Argentina mobile users
    if (argentinaOptimized && 'webkitSpeechRecognition' in window) {
      initializeVoiceSearch();
    }
    
    // Load personalized suggestions
    await loadPersonalizedSuggestions();
    
    // Track search widget access
    uxAnalyticsService.trackEvent('intelligent_search_accessed', {
      argentinaOptimized,
      mobileUser: window.innerWidth <= 768,
      voiceSearchSupported: !!voiceRecognition
    });
  });
  
  onDestroy(() => {
    if (voiceRecognition) {
      voiceRecognition.stop();
    }
  });
  
  async function loadSearchAnalytics() {
    try {
      const response = await fetch('/api/search/analytics', {
        headers: {
          'X-Argentina-Search': 'true',
          'X-User-Location': location
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        popularSearches = data.popularSearches || [];
        searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
        
        // Merge with Argentina insights
        argentinaInsights = { ...argentinaInsights, ...data.argentinaInsights };
      }
    } catch (error) {
      console.error('[IntelligentSearch] Analytics loading error:', error);
    }
  }
  
  async function loadPersonalizedSuggestions() {
    try {
      const response = await fetch('/api/search/suggestions', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Personalization': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        personalizedSuggestions = data.suggestions || [];
      }
    } catch (error) {
      console.error('[IntelligentSearch] Suggestions loading error:', error);
    }
  }
  
  function initializeVoiceSearch() {
    try {
      voiceRecognition = new (window as any).webkitSpeechRecognition();
      voiceRecognition.lang = 'es-AR'; // Argentina Spanish
      voiceRecognition.continuous = false;
      voiceRecognition.interimResults = false;
      
      voiceRecognition.onstart = () => {
        isVoiceSearchActive = true;
        uxAnalyticsService.trackEvent('voice_search_started', {
          language: 'es-AR',
          searchContext: category
        });
      };
      
      voiceRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        searchQuery = transcript;
        performSearch();
        
        uxAnalyticsService.trackEvent('voice_search_completed', {
          transcript,
          confidence: event.results[0][0].confidence
        });
      };
      
      voiceRecognition.onend = () => {
        isVoiceSearchActive = false;
      };
      
      voiceRecognition.onerror = (event: any) => {
        isVoiceSearchActive = false;
        console.warn('[VoiceSearch] Error:', event.error);
      };
    } catch (error) {
      console.warn('[VoiceSearch] Initialization error:', error);
    }
  }
  
  function startVoiceSearch() {
    if (voiceRecognition && !isVoiceSearchActive) {
      voiceRecognition.start();
    }
  }
  
  async function performSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      showResults = false;
      return;
    }
    
    isSearching = true;
    
    try {
      // Use Fuse.js for local fuzzy search
      const fuseResults = fuse.search(searchQuery);
      
      // Enhance with server-side search for Argentina-specific results
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Argentina-Search': 'true'
        },
        body: JSON.stringify({
          query: searchQuery,
          category: searchFilters.category,
          location: searchFilters.location,
          filters: searchFilters,
          argentinaOptimized: true
        })
      });
      
      if (response.ok) {
        const serverResults = await response.json();
        
        // Combine and rank results
        searchResults = combineAndRankResults(
          fuseResults.map(r => ({ ...r.item, score: r.score })),
          serverResults.results || []
        );
      } else {
        // Fallback to Fuse.js only
        searchResults = fuseResults.map(r => ({ ...r.item, score: r.score }));
      }
      
      showResults = true;
      selectedIndex = -1;
      
      // Track search behavior
      uxAnalyticsService.trackEvent('search_performed', {
        query: searchQuery,
        resultCount: searchResults.length,
        category: searchFilters.category,
        argentinaOptimized: true
      });
      
      // Save to search history
      saveToSearchHistory(searchQuery);
    } catch (error) {
      console.error('[IntelligentSearch] Search error:', error);
    } finally {
      isSearching = false;
    }
  }
  
  function combineAndRankResults(fuseResults: any[], serverResults: any[]): any[] {
    // Combine results and remove duplicates
    const combined = [...fuseResults];
    
    serverResults.forEach(serverResult => {
      const existing = combined.find(r => r.id === serverResult.id);
      if (!existing) {
        combined.push(serverResult);
      }
    });
    
    // Sort by relevance, location proximity, and Argentina preferences
    return combined
      .sort((a, b) => {
        // Prioritize Argentina location matches
        if (a.argentina_optimized && !b.argentina_optimized) return -1;
        if (!a.argentina_optimized && b.argentina_optimized) return 1;
        
        // Then by score
        return (a.score || 0) - (b.score || 0);
      })
      .slice(0, 10); // Limit to top 10 results
  }
  
  function saveToSearchHistory(query: string) {
    searchHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    localStorage.setItem('search_history', JSON.stringify(searchHistory));
  }
  
  function selectResult(result: any) {
    showResults = false;
    searchQuery = result.name;
    
    // Track result selection
    uxAnalyticsService.trackEvent('search_result_selected', {
      resultId: result.id,
      resultType: result.type,
      query: searchQuery,
      position: searchResults.indexOf(result)
    });
    
    dispatch('resultSelected', { result });
  }
  
  function selectSuggestion(suggestion: string) {
    searchQuery = suggestion;
    performSearch();
  }
  
  function clearSearch() {
    searchQuery = '';
    searchResults = [];
    showResults = false;
    selectedIndex = -1;
    searchInputElement?.focus();
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (!showResults) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          selectResult(searchResults[selectedIndex]);
        } else if (searchQuery.trim()) {
          performSearch();
        }
        break;
      case 'Escape':
        showResults = false;
        selectedIndex = -1;
        break;
    }
  }
  
  function updateFilter(filterKey: string, value: string) {
    searchFilters = { ...searchFilters, [filterKey]: value };
    if (searchQuery.trim()) {
      performSearch();
    }
  }
  
  function getResultIcon(result: any): string {
    switch (result.type) {
      case 'service': return '🛍️';
      case 'provider': return '👨‍💼';
      case 'location': return '📍';
      default: return '🔍';
    }
  }
  
  function formatResultLocation(result: any): string {
    if (result.city && result.province) {
      return `${result.city}, ${result.province}`;
    }
    return result.location || '';
  }
  
  function highlightMatch(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  }
  
  // Debounce search input
  let searchTimeout: number;
  $: {
    clearTimeout(searchTimeout);
    if (searchQuery.trim()) {
      searchTimeout = setTimeout(performSearch, 300);
    } else {
      searchResults = [];
      showResults = false;
    }
  }
</script>

<!-- Enhanced Intelligent Search -->
<div class="relative w-full max-w-2xl mx-auto">
  <!-- Search Input Container -->
  <div class="relative">
    <!-- Search Icon -->
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    
    <!-- Search Input -->
    <input
      bind:this={searchInputElement}
      bind:value={searchQuery}
      type="text"
      {placeholder}
      class="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg"
      on:keydown={handleKeydown}
      on:focus={() => { if (searchResults.length > 0) showResults = true; }}
      autocomplete="off"
    >
    
    <!-- Right Side Actions -->
    <div class="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
      <!-- Voice Search Button (Argentina mobile optimization) -->
      {#if voiceRecognition && argentinaOptimized}
        <button
          on:click={startVoiceSearch}
          class="p-2 rounded-lg transition-colors"
          class:bg-red-100={isVoiceSearchActive}
          class:text-red-600={isVoiceSearchActive}
          class:hover:bg-gray-100={!isVoiceSearchActive}
          class:dark:hover:bg-gray-700={!isVoiceSearchActive}
          title="Buscar por voz"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      {/if}
      
      <!-- Loading Spinner -->
      {#if isSearching}
        <LoadingSpinner size="small" />
      {/if}
      
      <!-- Clear Button -->
      {#if searchQuery}
        <button
          on:click={clearSearch}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Limpiar búsqueda"
        >
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Search Filters (Mobile Optimized) -->
  <div class="mt-3 flex flex-wrap gap-2">
    <select
      bind:value={searchFilters.category}
      on:change={(e) => updateFilter('category', e.target.value)}
      class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
    >
      <option value="all">Todas las categorías</option>
      <option value="services">Servicios</option>
      <option value="providers">Proveedores</option>
      <option value="locations">Ubicaciones</option>
    </select>
    
    <select
      bind:value={searchFilters.priceRange}
      on:change={(e) => updateFilter('priceRange', e.target.value)}
      class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
    >
      <option value="all">Todos los precios</option>
      <option value="low">Hasta $5,000</option>
      <option value="medium">$5,000 - $15,000</option>
      <option value="high">Más de $15,000</option>
    </select>
    
    <select
      bind:value={searchFilters.rating}
      on:change={(e) => updateFilter('rating', e.target.value)}
      class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
    >
      <option value="all">Todas las calificaciones</option>
      <option value="4+">4+ estrellas</option>
      <option value="4.5+">4.5+ estrellas</option>
    </select>
  </div>
  
  <!-- Search Results Dropdown -->
  {#if showResults}
    <div 
      class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-96 overflow-y-auto"
      in:fly={{ y: -10, duration: 200 }}
    >
      <!-- Search Suggestions (if no query) -->
      {#if !searchQuery.trim() && (searchHistory.length > 0 || popularSearches.length > 0)}
        <div class="p-4">
          {#if searchHistory.length > 0}
            <div class="mb-4">
              <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Búsquedas recientes
              </h4>
              <div class="flex flex-wrap gap-2">
                {#each searchHistory.slice(0, 5) as historyItem}
                  <button
                    on:click={() => selectSuggestion(historyItem)}
                    class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {historyItem}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if popularSearches.length > 0}
            <div>
              <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Búsquedas populares en Argentina
              </h4>
              <div class="flex flex-wrap gap-2">
                {#each popularSearches.slice(0, 6) as popularSearch}
                  <button
                    on:click={() => selectSuggestion(popularSearch)}
                    class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    🔥 {popularSearch}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        
      {:else if searchResults.length > 0}
        <!-- Search Results -->
        <div class="divide-y divide-gray-200 dark:divide-gray-600">
          {#each searchResults as result, index (result.id)}
            <button
              on:click={() => selectResult(result)}
              class="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              class:bg-blue-50={index === selectedIndex}
              class:dark:bg-blue-900={index === selectedIndex}
            >
              <div class="flex items-start space-x-3">
                <!-- Result Icon -->
                <div class="text-2xl mt-1">
                  {getResultIcon(result)}
                </div>
                
                <!-- Result Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {@html highlightMatch(result.name, searchQuery)}
                    </h3>
                    
                    <!-- Argentina Badge -->
                    {#if result.argentina_optimized}
                      <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex-shrink-0">
                        🇦🇷 ARG
                      </span>
                    {/if}
                  </div>
                  
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {@html highlightMatch(result.description || '', searchQuery)}
                  </p>
                  
                  <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {#if result.category}
                      <span class="capitalize">{result.category}</span>
                    {/if}
                    
                    {#if result.rating}
                      <span class="flex items-center">
                        ⭐ {result.rating}
                      </span>
                    {/if}
                    
                    {#if formatResultLocation(result)}
                      <span>
                        📍 {formatResultLocation(result)}
                      </span>
                    {/if}
                    
                    {#if result.price}
                      <span class="font-medium">
                        ${result.price.toLocaleString('es-AR')}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
        
      {:else if searchQuery.trim() && !isSearching}
        <!-- No Results -->
        <div class="p-6 text-center" in:fade>
          <div class="text-4xl mb-2">🔍</div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron resultados
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Intenta con otros términos o revisa los filtros
          </p>
          
          <!-- Suggestions -->
          {#if argentinaInsights.popularCategories.length > 0}
            <div class="text-left">
              <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Categorías populares:
              </h4>
              <div class="flex flex-wrap gap-2">
                {#each argentinaInsights.popularCategories as category}
                  <button
                    on:click={() => selectSuggestion(category)}
                    class="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    {category}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Click outside to close -->
<svelte:window 
  on:click={(e) => {
    if (!e.target.closest('.relative')) {
      showResults = false;
    }
  }}
/>

<style>
  /* Custom mark styling */
  :global(mark) {
    padding: 2px 4px;
    border-radius: 3px;
  }
  
  /* Mobile optimization for Argentina */
  @media (max-width: 768px) {
    .max-w-2xl {
      max-width: 100%;
    }
    
    /* Larger touch targets */
    button {
      min-height: 44px;
    }
    
    /* Improved typography for mobile */
    input {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
  
  /* Smooth animations */
  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  /* Voice search pulse animation */
  .bg-red-100 {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  /* Scroll optimization */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
  }
</style>