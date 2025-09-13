<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { debounce } from 'lodash-es';
	import Button from '../Button.svelte';
	import Loading from '../Loading.svelte';
	
	const dispatch = createEventDispatcher();
	
	export let placeholder = 'Buscar servicios, profesionales o ubicaciones...';
	export let enableVoiceSearch = true;
	export let enableSmartFilters = true;
	export let contextualSuggestions = true;
	export let userPreferences: any = {};
	
	// AI Search State
	let searchInput = '';
	let isSearching = false;
	let showSuggestions = false;
	let isListening = false;
	let searchHistory: string[] = [];
	
	// AI-powered search results and suggestions
	const searchResults = writable([]);
	const aiSuggestions = writable([]);
	const smartFilters = writable([]);
	const contextualRecommendations = writable([]);
	
	// Voice search support
	let recognition: SpeechRecognition | null = null;
	
	onMount(() => {
		// Initialize speech recognition for voice search
		if (enableVoiceSearch && 'webkitSpeechRecognition' in window) {
			recognition = new webkitSpeechRecognition();
			recognition.continuous = false;
			recognition.interimResults = false;
			recognition.lang = 'es-AR';
			
			recognition.onresult = (event) => {
				const transcript = event.results[0][0].transcript;
				searchInput = transcript;
				handleSearch();
				isListening = false;
			};
			
			recognition.onerror = () => {
				isListening = false;
			};
			
			recognition.onend = () => {
				isListening = false;
			};
		}
		
		// Load search history from localStorage
		loadSearchHistory();
		
		// Initialize contextual suggestions based on user behavior
		if (contextualSuggestions) {
			initializeContextualSuggestions();
		}
	});
	
	// Debounced search function for real-time AI suggestions
	const debouncedSearch = debounce(async (query: string) => {
		if (query.length < 2) {
			aiSuggestions.set([]);
			return;
		}
		
		try {
			// AI-powered search suggestions
			const response = await fetch('/api/ai/search/suggestions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					query,
					userPreferences,
					context: {
						location: userPreferences.location || 'Buenos Aires',
						previousSearches: searchHistory.slice(-5),
						timeOfDay: new Date().getHours(),
						dayOfWeek: new Date().getDay()
					}
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				aiSuggestions.set(data.suggestions || []);
				
				// Update smart filters based on AI analysis
				if (enableSmartFilters) {
					smartFilters.set(data.smartFilters || []);
				}
			}
		} catch (error) {
			console.error('AI search suggestions error:', error);
		}
	}, 300);
	
	// Handle search input changes
	function handleSearchInput() {
		showSuggestions = searchInput.length > 0;
		debouncedSearch(searchInput);
	}
	
	// Execute AI-powered search
	async function handleSearch() {
		if (!searchInput.trim()) return;
		
		isSearching = true;
		showSuggestions = false;
		
		try {
			// Add to search history
			addToSearchHistory(searchInput.trim());
			
			// AI-powered search with intelligent ranking
			const response = await fetch('/api/ai/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					query: searchInput,
					userPreferences,
					filters: $smartFilters,
					context: {
						location: userPreferences.location || 'Buenos Aires',
						previousBookings: userPreferences.bookingHistory || [],
						preferences: userPreferences.preferences || {},
						timeOfDay: new Date().getHours()
					}
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				searchResults.set(data.results || []);
				
				// Dispatch search results to parent component
				dispatch('search', {
					query: searchInput,
					results: data.results,
					aiInsights: data.insights,
					personalization: data.personalization
				});
			} else {
				console.error('Search failed:', response.statusText);
			}
		} catch (error) {
			console.error('AI search error:', error);
		} finally {
			isSearching = false;
		}
	}
	
	// Voice search activation
	function startVoiceSearch() {
		if (!recognition) return;
		
		isListening = true;
		recognition.start();
	}
	
	// Handle suggestion selection
	function selectSuggestion(suggestion: any) {
		searchInput = suggestion.query;
		showSuggestions = false;
		handleSearch();
	}
	
	// Load search history from localStorage
	function loadSearchHistory() {
		const history = localStorage.getItem('ai_search_history');
		if (history) {
			searchHistory = JSON.parse(history).slice(-10); // Keep last 10 searches
		}
	}
	
	// Add search to history
	function addToSearchHistory(query: string) {
		if (!searchHistory.includes(query)) {
			searchHistory = [query, ...searchHistory].slice(0, 10);
			localStorage.setItem('ai_search_history', JSON.stringify(searchHistory));
		}
	}
	
	// Initialize contextual suggestions based on user behavior
	async function initializeContextualSuggestions() {
		try {
			const response = await fetch('/api/ai/contextual-suggestions', {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				contextualRecommendations.set(data.recommendations || []);
			}
		} catch (error) {
			console.error('Contextual suggestions error:', error);
		}
	}
	
	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		} else if (event.key === 'Escape') {
			showSuggestions = false;
		}
	}
</script>

<div class="ai-search-container relative">
	<!-- Main Search Input -->
	<div class="relative">
		<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
		
		<input
			type="text"
			bind:value={searchInput}
			on:input={handleSearchInput}
			on:keydown={handleKeydown}
			on:focus={() => showSuggestions = searchInput.length > 0}
			class="w-full pl-10 pr-20 py-3 border-2 border-neutral-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-lg"
			class:border-brand={showSuggestions}
			{placeholder}
			autocomplete="off"
		/>
		
		<!-- Search Actions -->
		<div class="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
			{#if enableVoiceSearch && recognition}
				<button
					type="button"
					on:click={startVoiceSearch}
					class="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
					class:bg-red-100={isListening}
					class:text-red-600={isListening}
					disabled={isListening}
					title="Buscar por voz"
				>
					{#if isListening}
						<svg class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
						</svg>
					{/if}
				</button>
			{/if}
			
			{#if isSearching}
				<div class="animate-spin w-5 h-5">
					<Loading size="sm" />
				</div>
			{:else if searchInput}
				<button
					type="button"
					on:click={handleSearch}
					class="bg-brand text-white p-2 rounded-lg hover:bg-brand-dark transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
	
	<!-- AI-Powered Suggestions Dropdown -->
	{#if showSuggestions && ($aiSuggestions.length > 0 || searchHistory.length > 0)}
		<div class="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-neutral-200 z-50 max-h-96 overflow-y-auto">
			<!-- AI Suggestions -->
			{#if $aiSuggestions.length > 0}
				<div class="p-3 border-b border-neutral-100">
					<h6 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Sugerencias IA</h6>
					{#each $aiSuggestions as suggestion}
						<button
							type="button"
							on:click={() => selectSuggestion(suggestion)}
							class="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors group"
						>
							<div class="flex items-center space-x-3">
								<div class="flex-shrink-0">
									{#if suggestion.type === 'service'}
										<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
										</svg>
									{:else if suggestion.type === 'provider'}
										<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
									{:else}
										<svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-neutral-900 truncate">{suggestion.title}</p>
									{#if suggestion.subtitle}
										<p class="text-xs text-neutral-500 truncate">{suggestion.subtitle}</p>
									{/if}
								</div>
								{#if suggestion.confidence}
									<div class="flex-shrink-0">
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
											{Math.round(suggestion.confidence * 100)}% match
										</span>
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
			
			<!-- Search History -->
			{#if searchHistory.length > 0}
				<div class="p-3">
					<h6 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Búsquedas Recientes</h6>
					{#each searchHistory.slice(0, 5) as query}
						<button
							type="button"
							on:click={() => selectSuggestion({ query, type: 'history' })}
							class="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors group flex items-center space-x-3"
						>
							<svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="text-sm text-neutral-700">{query}</span>
						</button>
					{/each}
				</div>
			{/if}
			
			<!-- Contextual Recommendations -->
			{#if $contextualRecommendations.length > 0}
				<div class="p-3 border-t border-neutral-100">
					<h6 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Recomendado para ti</h6>
					{#each $contextualRecommendations.slice(0, 3) as recommendation}
						<button
							type="button"
							on:click={() => selectSuggestion(recommendation)}
							class="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors group"
						>
							<div class="flex items-center space-x-3">
								<div class="w-2 h-2 bg-brand rounded-full flex-shrink-0"></div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-neutral-900 truncate">{recommendation.title}</p>
									<p class="text-xs text-neutral-500 truncate">{recommendation.reason}</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Smart Filters (if enabled) -->
	{#if enableSmartFilters && $smartFilters.length > 0 && searchInput}
		<div class="mt-4 flex flex-wrap gap-2">
			<span class="text-sm text-neutral-600 font-medium">Filtros sugeridos:</span>
			{#each $smartFilters as filter}
				<button
					type="button"
					class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
					on:click={() => dispatch('filter', filter)}
				>
					{filter.label}
					<span class="ml-1 text-blue-600">({filter.count})</span>
				</button>
			{/each}
		</div>
	{/if}
	
	<!-- Voice Search Feedback -->
	{#if isListening}
		<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="w-5 h-5 text-red-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Escuchando...</h3>
					<p class="text-sm text-red-700 mt-1">Habla ahora para buscar servicios o profesionales</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.ai-search-container {
		@apply w-full max-w-2xl;
	}
	
	/* Mobile optimization for Argentina market */
	@media (max-width: 768px) {
		.ai-search-container input {
			@apply text-base; /* Prevent zoom on iOS */
			min-height: 44px; /* Touch-friendly height */
		}
		
		.ai-search-container button {
			min-height: 44px;
			min-width: 44px;
		}
	}
	
	/* Accessibility enhancements */
	.ai-search-container input:focus {
		@apply outline-none;
	}
	
	/* Argentina-specific styling */
	.ai-search-container {
		/* Optimized for Spanish language content */
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}
</style>