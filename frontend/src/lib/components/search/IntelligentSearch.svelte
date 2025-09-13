<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import Fuse from 'fuse.js';
	import DOMPurify from 'dompurify';

	const dispatch = createEventDispatcher();

	export let placeholder = 'Buscar servicios, profesionales...';
	export let vertical: 'barber' | 'psychology' = 'barber';
	export let enableVoiceSearch = true;
	export let enableLocationFilter = true;
	export let showRecentSearches = true;
	export let maxSuggestions = 8;

	interface SearchResult {
		id: string;
		type: 'provider' | 'service' | 'location' | 'specialty';
		title: string;
		subtitle?: string;
		description?: string;
		image?: string;
		rating?: number;
		price?: number;
		distance?: number;
		availability?: 'available' | 'busy' | 'offline';
		badges?: string[];
		location?: {
			address: string;
			zone: string;
		};
	}

	interface SearchFilters {
		location?: string;
		maxDistance?: number;
		priceRange?: [number, number];
		rating?: number;
		availability?: boolean;
		specialties?: string[];
	}

	let query = '';
	let searchResults: SearchResult[] = [];
	let suggestions: SearchResult[] = [];
	let recentSearches: string[] = [];
	let isSearching = false;
	let showSuggestions = false;
	let selectedIndex = -1;
	let searchTimeout: NodeJS.Timeout | null = null;
	let fuse: Fuse<SearchResult> | null = null;
	let allData: SearchResult[] = [];

	// Voice search state
	let isListening = false;
	let recognition: SpeechRecognition | null = null;

	// Filters state
	let filters: SearchFilters = {};
	let showFilters = false;

	// Location state
	let userLocation: GeolocationPosition | null = null;

	// Search input element
	let searchInput: HTMLInputElement;
	let suggestionsContainer: HTMLElement;

	const fuseOptions = {
		keys: [
			{ name: 'title', weight: 0.4 },
			{ name: 'subtitle', weight: 0.3 },
			{ name: 'description', weight: 0.2 },
			{ name: 'location.address', weight: 0.1 }
		],
		threshold: 0.3,
		includeScore: true,
		includeMatches: true
	};

	onMount(async () => {
		await loadInitialData();
		setupFuse();
		loadRecentSearches();
		setupVoiceSearch();
		requestLocation();
		
		// Setup keyboard navigation
		document.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		if (searchTimeout) clearTimeout(searchTimeout);
		if (recognition) recognition.abort();
		document.removeEventListener('keydown', handleKeyDown);
	});

	async function loadInitialData() {
		try {
			const response = await fetch('/api/search/data', {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				allData = await response.json();
			}
		} catch (error) {
			console.error('Error loading search data:', error);
		}
	}

	function setupFuse() {
		if (allData.length > 0) {
			fuse = new Fuse(allData, fuseOptions);
		}
	}

	function loadRecentSearches() {
		const stored = localStorage.getItem('barberpro_recent_searches');
		if (stored) {
			recentSearches = JSON.parse(stored).slice(0, 5);
		}
	}

	function saveRecentSearch(searchQuery: string) {
		if (!searchQuery.trim()) return;
		
		recentSearches = [
			searchQuery,
			...recentSearches.filter(s => s !== searchQuery)
		].slice(0, 5);
		
		localStorage.setItem('barberpro_recent_searches', JSON.stringify(recentSearches));
	}

	function setupVoiceSearch() {
		if (!enableVoiceSearch || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
			return;
		}

		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		recognition = new SpeechRecognition();
		recognition.lang = 'es-AR';
		recognition.continuous = false;
		recognition.interimResults = false;

		recognition.onstart = () => {
			isListening = true;
		};

		recognition.onresult = (event) => {
			const transcript = event.results[0][0].transcript;
			query = transcript;
			performSearch();
		};

		recognition.onend = () => {
			isListening = false;
		};

		recognition.onerror = (event) => {
			console.error('Voice search error:', event.error);
			isListening = false;
		};
	}

	function requestLocation() {
		if (!enableLocationFilter || !navigator.geolocation) return;

		navigator.geolocation.getCurrentPosition(
			(position) => {
				userLocation = position;
			},
			(error) => {
				console.warn('Location access denied:', error);
			}
		);
	}

	function handleInput() {
		if (searchTimeout) clearTimeout(searchTimeout);
		
		if (query.trim().length === 0) {
			showSuggestions = false;
			return;
		}

		searchTimeout = setTimeout(() => {
			performSearch();
		}, 150); // Debounce for performance
	}

	function performSearch() {
		if (!query.trim()) {
			showSuggestions = false;
			return;
		}

		isSearching = true;
		showSuggestions = true;
		selectedIndex = -1;

		try {
			let results: SearchResult[] = [];

			if (fuse) {
				const fuseResults = fuse.search(query);
				results = fuseResults.map(result => result.item);
			} else {
				// Fallback simple search
				results = allData.filter(item => 
					item.title.toLowerCase().includes(query.toLowerCase()) ||
					item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
					item.description?.toLowerCase().includes(query.toLowerCase())
				);
			}

			// Apply filters
			results = applyFilters(results);

			// Sort by relevance and distance
			results = sortResults(results);

			suggestions = results.slice(0, maxSuggestions);
		} catch (error) {
			console.error('Search error:', error);
		} finally {
			isSearching = false;
		}
	}

	function applyFilters(results: SearchResult[]): SearchResult[] {
		return results.filter(result => {
			// Location filter
			if (filters.location && result.location) {
				if (!result.location.zone.toLowerCase().includes(filters.location.toLowerCase())) {
					return false;
				}
			}

			// Distance filter
			if (filters.maxDistance && result.distance && result.distance > filters.maxDistance) {
				return false;
			}

			// Price range filter
			if (filters.priceRange && result.price) {
				const [min, max] = filters.priceRange;
				if (result.price < min || result.price > max) {
					return false;
				}
			}

			// Rating filter
			if (filters.rating && result.rating && result.rating < filters.rating) {
				return false;
			}

			// Availability filter
			if (filters.availability && result.availability === 'offline') {
				return false;
			}

			return true;
		});
	}

	function sortResults(results: SearchResult[]): SearchResult[] {
		return results.sort((a, b) => {
			// Prioritize by availability
			if (a.availability === 'available' && b.availability !== 'available') return -1;
			if (b.availability === 'available' && a.availability !== 'available') return 1;

			// Then by rating
			if (a.rating && b.rating && a.rating !== b.rating) {
				return b.rating - a.rating;
			}

			// Then by distance if available
			if (a.distance && b.distance && a.distance !== b.distance) {
				return a.distance - b.distance;
			}

			return 0;
		});
	}

	function selectSuggestion(result: SearchResult) {
		query = result.title;
		showSuggestions = false;
		saveRecentSearch(query);
		
		dispatch('select', result);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!showSuggestions || suggestions.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0) {
					selectSuggestion(suggestions[selectedIndex]);
				} else if (query.trim()) {
					performFullSearch();
				}
				break;
			case 'Escape':
				showSuggestions = false;
				selectedIndex = -1;
				break;
		}
	}

	function performFullSearch() {
		saveRecentSearch(query);
		showSuggestions = false;
		
		dispatch('search', {
			query: query.trim(),
			filters
		});
	}

	function startVoiceSearch() {
		if (recognition && !isListening) {
			recognition.start();
		}
	}

	function clearSearch() {
		query = '';
		showSuggestions = false;
		selectedIndex = -1;
		searchInput.focus();
	}

	function selectRecentSearch(search: string) {
		query = search;
		performSearch();
	}

	function getResultIcon(type: SearchResult['type']): string {
		switch (type) {
			case 'provider': return '👨‍💼';
			case 'service': return '✂️';
			case 'location': return '📍';
			case 'specialty': return '🎯';
			default: return '🔍';
		}
	}

	function getAvailabilityColor(availability: SearchResult['availability']): string {
		switch (availability) {
			case 'available': return 'text-success-600';
			case 'busy': return 'text-warning-600';
			case 'offline': return 'text-neutral-400';
			default: return 'text-neutral-600';
		}
	}

	function formatDistance(distance: number): string {
		if (distance < 1) {
			return `${Math.round(distance * 1000)}m`;
		}
		return `${distance.toFixed(1)}km`;
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 0
		}).format(price);
	}

	// Close suggestions when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (!suggestionsContainer?.contains(event.target as Node) && 
			!searchInput?.contains(event.target as Node)) {
			showSuggestions = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative w-full">
	<!-- Search Input -->
	<div class="relative">
		<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
		
		<input
			bind:this={searchInput}
			bind:value={query}
			on:input={handleInput}
			on:focus={() => query.length > 0 && (showSuggestions = true)}
			class="form-input pl-10 pr-20 w-full"
			{placeholder}
			autocomplete="off"
			type="text"
		/>
		
		<div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
			<!-- Voice Search Button -->
			{#if enableVoiceSearch && recognition}
				<button
					type="button"
					class="p-1 text-neutral-400 hover:text-primary-600 transition-colors"
					class:text-error-600={isListening}
					class:animate-pulse={isListening}
					on:click={startVoiceSearch}
					title="Búsqueda por voz"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				</button>
			{/if}
			
			<!-- Clear Button -->
			{#if query}
				<button
					type="button"
					class="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
					on:click={clearSearch}
					title="Limpiar búsqueda"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
			
			<!-- Filters Button -->
			<button
				type="button"
				class="p-1 text-neutral-400 hover:text-primary-600 transition-colors"
				class:text-primary-600={showFilters}
				on:click={() => showFilters = !showFilters}
				title="Filtros"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Suggestions Dropdown -->
	{#if showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)}
		<div 
			bind:this={suggestionsContainer}
			class="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-strong max-h-96 overflow-y-auto"
		>
			<!-- Recent Searches -->
			{#if showRecentSearches && recentSearches.length > 0 && !query}
				<div class="p-3 border-b border-neutral-100">
					<h4 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
						Búsquedas Recientes
					</h4>
					{#each recentSearches as recent}
						<button
							class="flex items-center w-full p-2 text-left hover:bg-neutral-50 rounded-md transition-colors"
							on:click={() => selectRecentSearch(recent)}
						>
							<svg class="w-4 h-4 text-neutral-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="text-sm text-neutral-700">{recent}</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Search Results -->
			{#if suggestions.length > 0}
				<div class="py-2">
					{#each suggestions as result, index}
						<button
							class="flex items-center w-full p-3 text-left hover:bg-neutral-50 transition-colors"
							class:bg-primary-50={index === selectedIndex}
							on:click={() => selectSuggestion(result)}
						>
							<div class="flex-shrink-0 mr-3">
								{#if result.image}
									<img 
										src={result.image} 
										alt={result.title}
										class="w-10 h-10 rounded-full object-cover"
									/>
								{:else}
									<div class="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-lg">
										{getResultIcon(result.type)}
									</div>
								{/if}
							</div>
							
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<h4 class="text-sm font-medium text-neutral-800 truncate">
										{@html DOMPurify.sanitize(result.title)}
									</h4>
									{#if result.availability}
										<span class="w-2 h-2 rounded-full {getAvailabilityColor(result.availability)} bg-current"></span>
									{/if}
								</div>
								
								{#if result.subtitle}
									<p class="text-xs text-neutral-600 truncate mb-1">
										{result.subtitle}
									</p>
								{/if}
								
								<div class="flex items-center gap-3 text-xs text-neutral-500">
									{#if result.rating}
										<div class="flex items-center gap-1">
											<svg class="w-3 h-3 text-warning-500" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
											</svg>
											<span>{result.rating.toFixed(1)}</span>
										</div>
									{/if}
									
									{#if result.price}
										<span class="font-medium">
											{formatPrice(result.price)}
										</span>
									{/if}
									
									{#if result.distance}
										<span>
											{formatDistance(result.distance)}
										</span>
									{/if}
								</div>
								
								{#if result.badges && result.badges.length > 0}
									<div class="flex gap-1 mt-1">
										{#each result.badges.slice(0, 2) as badge}
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-800">
												{badge}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Search Loading -->
			{#if isSearching}
				<div class="flex items-center justify-center p-4">
					<div class="flex items-center gap-2 text-sm text-neutral-500">
						<div class="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
						Buscando...
					</div>
				</div>
			{/if}

			<!-- No Results -->
			{#if !isSearching && query && suggestions.length === 0}
				<div class="p-4 text-center text-sm text-neutral-500">
					No se encontraron resultados para "{query}"
				</div>
			{/if}
		</div>
	{/if}

	<!-- Quick Filters (Mobile-First) -->
	{#if showFilters}
		<div class="absolute z-40 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-strong p-4">
			<h4 class="text-sm font-semibold text-neutral-800 mb-3">Filtros de Búsqueda</h4>
			
			<div class="space-y-4">
				<!-- Location Filter -->
				{#if enableLocationFilter}
					<div>
						<label class="block text-xs font-medium text-neutral-700 mb-1">
							Ubicación
						</label>
						<input
							type="text"
							class="form-input text-sm"
							placeholder="Zona o barrio"
							bind:value={filters.location}
						/>
					</div>
				{/if}
				
				<!-- Price Range -->
				<div>
					<label class="block text-xs font-medium text-neutral-700 mb-1">
						Rango de Precios
					</label>
					<div class="flex gap-2">
						<input
							type="number"
							class="form-input text-sm"
							placeholder="Mín"
							bind:value={filters.priceRange?.[0]}
						/>
						<input
							type="number"
							class="form-input text-sm"
							placeholder="Máx"
							bind:value={filters.priceRange?.[1]}
						/>
					</div>
				</div>
				
				<!-- Rating Filter -->
				<div>
					<label class="block text-xs font-medium text-neutral-700 mb-1">
						Calificación Mínima
					</label>
					<select class="form-input text-sm" bind:value={filters.rating}>
						<option value="">Cualquiera</option>
						<option value={4.5}>4.5+ estrellas</option>
						<option value={4.0}>4.0+ estrellas</option>
						<option value={3.5}>3.5+ estrellas</option>
					</select>
				</div>
				
				<!-- Availability Filter -->
				<div class="flex items-center">
					<input
						type="checkbox"
						id="availability-filter"
						class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
						bind:checked={filters.availability}
					/>
					<label for="availability-filter" class="ml-2 text-sm text-neutral-700">
						Solo disponibles ahora
					</label>
				</div>
			</div>
			
			<div class="flex gap-2 mt-4">
				<button 
					class="btn btn-primary btn-sm flex-1"
					on:click={() => {
						showFilters = false;
						performSearch();
					}}
				>
					Aplicar Filtros
				</button>
				<button 
					class="btn btn-secondary btn-sm"
					on:click={() => {
						filters = {};
						showFilters = false;
						performSearch();
					}}
				>
					Limpiar
				</button>
			</div>
		</div>
	{/if}
</div>