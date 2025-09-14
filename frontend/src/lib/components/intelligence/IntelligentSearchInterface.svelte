<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import { debounce } from '$lib/utils/helpers';
	import type { ServiceProvider, SearchFilter, SearchResult } from '$lib/types';

	export let placeholder: string = 'Buscar servicios, profesionales o ubicaciones...';
	export let initialQuery: string = '';
	export let contextualFilters: SearchFilter[] = [];
	export let personalizedRanking: boolean = true;

	const dispatch = createEventDispatcher();

	// Search state
	const query = writable(initialQuery);
	const suggestions = writable<string[]>([]);
	const results = writable<SearchResult[]>([]);
	const filters = writable<SearchFilter[]>(contextualFilters);
	const loading = writable(false);
	const showSuggestions = writable(false);
	const selectedSuggestion = writable(-1);

	// Search input element
	let searchInput: HTMLInputElement;
	let suggestionsContainer: HTMLElement;

	// Intelligent search engine
	class IntelligentSearchEngine {
		private searchHistory: string[] = [];
		private userPreferences: any = {};
		private popularSearches: string[] = [];
		private contextualData: any = {};

		async initialize() {
			await this.loadSearchContext();
			await this.loadUserPreferences();
			await this.loadPopularSearches();
		}

		private async loadSearchContext() {
			try {
				const response = await fetch('/api/search/context', {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					this.contextualData = await response.json();
					console.log('[IntelligentSearch] Context loaded');
				}
			} catch (error) {
				console.error('[IntelligentSearch] Failed to load context:', error);
			}
		}

		private async loadUserPreferences() {
			try {
				const response = await fetch('/api/users/search-preferences', {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					this.userPreferences = await response.json();
					console.log('[IntelligentSearch] User preferences loaded');
				}
			} catch (error) {
				console.error('[IntelligentSearch] Failed to load preferences:', error);
			}
		}

		private async loadPopularSearches() {
			try {
				const response = await fetch('/api/search/popular', {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					this.popularSearches = data.searches || [];
					console.log('[IntelligentSearch] Popular searches loaded:', this.popularSearches.length);
				}
			} catch (error) {
				console.error('[IntelligentSearch] Failed to load popular searches:', error);
			}
		}

		async generateSuggestions(inputQuery: string): Promise<string[]> {
			if (inputQuery.length < 2) {
				// Return popular searches for empty query
				return this.popularSearches.slice(0, 6);
			}

			try {
				const response = await fetch('/api/search/suggestions', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						query: inputQuery,
						userPreferences: this.userPreferences,
						context: this.contextualData,
						includeHistory: true,
						includePopular: true,
						maxSuggestions: 8
					})
				});

				if (response.ok) {
					const data = await response.json();
					return this.rankSuggestions(data.suggestions, inputQuery);
				}
			} catch (error) {
				console.error('[IntelligentSearch] Failed to generate suggestions:', error);
			}

			// Fallback to local suggestions
			return this.generateLocalSuggestions(inputQuery);
		}

		private rankSuggestions(suggestions: any[], inputQuery: string): string[] {
			return suggestions
				.map(s => ({
					...s,
					relevance: this.calculateRelevance(s, inputQuery)
				}))
				.sort((a, b) => b.relevance - a.relevance)
				.map(s => s.text);
		}

		private calculateRelevance(suggestion: any, inputQuery: string): number {
			let score = 0;

			// Exact match boost
			if (suggestion.text.toLowerCase().includes(inputQuery.toLowerCase())) {
				score += 50;
			}

			// User preference boost
			if (this.userPreferences.categories?.includes(suggestion.category)) {
				score += 30;
			}

			// Search history boost
			if (this.searchHistory.includes(suggestion.text)) {
				score += 20;
			}

			// Popularity boost
			score += suggestion.popularity * 10;

			return score;
		}

		private generateLocalSuggestions(inputQuery: string): string[] {
			const localSuggestions = [
				'corte de cabello',
				'barbería cerca',
				'manicura',
				'masaje relajante',
				'depilación',
				'tratamiento facial',
				'coloración',
				'pedicura',
				'cejas',
				'barba'
			];

			return localSuggestions
				.filter(s => s.toLowerCase().includes(inputQuery.toLowerCase()))
				.slice(0, 6);
		}

		async performSearch(searchQuery: string, searchFilters: SearchFilter[]): Promise<SearchResult[]> {
			loading.set(true);

			try {
				// Record search for analytics
				this.recordSearch(searchQuery);

				const response = await fetch('/api/search/intelligent', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						query: searchQuery,
						filters: searchFilters,
						personalized: personalizedRanking,
						userPreferences: this.userPreferences,
						location: this.contextualData.location,
						sortBy: 'relevance',
						includeMlRanking: true
					})
				});

				if (response.ok) {
					const data = await response.json();
					return this.processSearchResults(data.results, searchQuery);
				}
			} catch (error) {
				console.error('[IntelligentSearch] Search failed:', error);
			} finally {
				loading.set(false);
			}

			return [];
		}

		private processSearchResults(rawResults: any[], searchQuery: string): SearchResult[] {
			return rawResults.map(result => ({
				id: result.id,
				provider: result.provider,
				relevanceScore: result.relevanceScore || 0,
				matchingFactors: result.matchingFactors || [],
				personalizedReason: result.personalizedReason,
				searchHighlights: this.generateHighlights(result, searchQuery),
				isRecommended: result.isRecommended || false,
				quickActions: this.generateQuickActions(result)
			}));
		}

		private generateHighlights(result: any, searchQuery: string): any {
			const highlights = {};
			const queryWords = searchQuery.toLowerCase().split(' ');

			// Highlight in name
			highlights.name = this.highlightText(result.provider.name, queryWords);

			// Highlight in description
			if (result.provider.description) {
				highlights.description = this.highlightText(result.provider.description, queryWords);
			}

			// Highlight in specialties
			if (result.provider.specialties) {
				highlights.specialties = result.provider.specialties.map(
					s => this.highlightText(s, queryWords)
				);
			}

			return highlights;
		}

		private highlightText(text: string, queryWords: string[]): string {
			let highlighted = text;

			queryWords.forEach(word => {
				if (word.length > 2) {
					const regex = new RegExp(`(${word})`, 'gi');
					highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
				}
			});

			return highlighted;
		}

		private generateQuickActions(result: any): any[] {
			const actions = [];

			// Always show view profile
			actions.push({
				label: 'Ver perfil',
				action: 'view-profile',
				primary: true
			});

			// Show book now if available today
			if (result.provider.availableToday) {
				actions.push({
					label: 'Reservar hoy',
					action: 'book-today',
					priority: 'high'
				});
			}

			// Show call if phone available
			if (result.provider.phone) {
				actions.push({
					label: 'Llamar',
					action: 'call',
					icon: 'phone'
				});
			}

			return actions;
		}

		private recordSearch(searchQuery: string) {
			// Add to search history
			this.searchHistory.unshift(searchQuery);
			this.searchHistory = [...new Set(this.searchHistory)].slice(0, 10);

			// Send analytics
			fetch('/api/search/analytics', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: searchQuery,
					timestamp: Date.now(),
					userContext: this.userPreferences
				})
			}).catch(error => {
				console.error('[IntelligentSearch] Analytics recording failed:', error);
			});
		}
	}

	let searchEngine: IntelligentSearchEngine;

	// Debounced search functions
	const debouncedSuggestions = debounce(async (inputQuery: string) => {
		if (searchEngine) {
			const newSuggestions = await searchEngine.generateSuggestions(inputQuery);
			suggestions.set(newSuggestions);
			showSuggestions.set(true);
		}
	}, 300);

	const debouncedSearch = debounce(async (searchQuery: string) => {
		if (searchEngine && searchQuery.trim()) {
			const searchResults = await searchEngine.performSearch(searchQuery, $filters);
			results.set(searchResults);
			dispatch('search-results', { query: searchQuery, results: searchResults });
		}
	}, 500);

	// Handle input changes
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		query.set(value);

		if (value.length > 0) {
			debouncedSuggestions(value);
		} else {
			showSuggestions.set(false);
			suggestions.set([]);
		}

		// Auto-search for queries longer than 3 characters
		if (value.length >= 3) {
			debouncedSearch(value);
		}
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		const suggestionList = $suggestions;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedSuggestion.update(current =>
					Math.min(current + 1, suggestionList.length - 1)
				);
				break;

			case 'ArrowUp':
				event.preventDefault();
				selectedSuggestion.update(current => Math.max(current - 1, -1));
				break;

			case 'Enter':
				event.preventDefault();
				const currentSelection = $selectedSuggestion;

				if (currentSelection >= 0 && suggestionList[currentSelection]) {
					selectSuggestion(suggestionList[currentSelection]);
				} else {
					performSearch();
				}
				break;

			case 'Escape':
				showSuggestions.set(false);
				selectedSuggestion.set(-1);
				searchInput.blur();
				break;
		}
	}

	// Select suggestion
	function selectSuggestion(suggestion: string) {
		query.set(suggestion);
		showSuggestions.set(false);
		selectedSuggestion.set(-1);

		// Perform immediate search
		debouncedSearch(suggestion);
	}

	// Perform search
	function performSearch() {
		const searchQuery = $query.trim();
		if (searchQuery && searchEngine) {
			showSuggestions.set(false);
			debouncedSearch(searchQuery);
		}
	}

	// Handle focus events
	function handleFocus() {
		if ($query.length > 0 && $suggestions.length > 0) {
			showSuggestions.set(true);
		}
	}

	function handleBlur() {
		// Delay hiding suggestions to allow clicking
		setTimeout(() => {
			showSuggestions.set(false);
			selectedSuggestion.set(-1);
		}, 200);
	}

	// Click outside handler
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;

		if (!target.closest('.intelligent-search')) {
			showSuggestions.set(false);
			selectedSuggestion.set(-1);
		}
	}

	onMount(async () => {
		searchEngine = new IntelligentSearchEngine();
		await searchEngine.initialize();

		// Set up click outside listener
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="intelligent-search relative">
	<!-- Search Input -->
	<div class="search-input-container relative">
		<div class="relative">
			<input
				bind:this={searchInput}
				type="text"
				{placeholder}
				value={$query}
				on:input={handleInput}
				on:keydown={handleKeydown}
				on:focus={handleFocus}
				on:blur={handleBlur}
				class="w-full pl-12 pr-16 py-4 text-lg border-2 border-neutral-200 rounded-2xl focus:border-brand focus:ring-4 focus:ring-brand-50 outline-none transition-all duration-200 bg-white shadow-sm"
				class:border-brand={$showSuggestions}
				aria-label="Búsqueda inteligente"
				aria-expanded={$showSuggestions}
				aria-haspopup="listbox"
				autocomplete="off"
			/>

			<!-- Search Icon -->
			<div class="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
				{#if $loading}
					<div class="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
				{:else}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				{/if}
			</div>

			<!-- Search Button -->
			<button
				class="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary h-10 px-4 text-sm"
				on:click={performSearch}
				disabled={$loading || !$query.trim()}
			>
				Buscar
			</button>
		</div>

		<!-- Voice Search -->
		{#if 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window}
			<button
				class="absolute right-20 top-1/2 transform -translate-y-1/2 p-2 text-neutral-400 hover:text-brand transition-colors"
				title="Búsqueda por voz"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Suggestions Dropdown -->
	{#if $showSuggestions && ($suggestions.length > 0 || $query.length === 0)}
		<div
			bind:this={suggestionsContainer}
			class="suggestions-dropdown absolute top-full left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg mt-2 z-50 max-h-80 overflow-y-auto"
			role="listbox"
		>
			{#if $query.length === 0}
				<div class="p-4 border-b border-neutral-100">
					<h6 class="text-sm font-medium text-neutral-600 mb-2">Búsquedas populares</h6>
				</div>
			{:else}
				<div class="p-4 border-b border-neutral-100">
					<h6 class="text-sm font-medium text-neutral-600">Sugerencias</h6>
				</div>
			{/if}

			{#each $suggestions as suggestion, index}
				<button
					class="w-full px-4 py-3 text-left hover:bg-brand-50 transition-colors border-b border-neutral-50 last:border-b-0"
					class:bg-brand-50={index === $selectedSuggestion}
					class:text-brand={index === $selectedSuggestion}
					on:click={() => selectSuggestion(suggestion)}
					role="option"
					aria-selected={index === $selectedSuggestion}
				>
					<div class="flex items-center space-x-3">
						<svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<span class="text-sm">{suggestion}</span>
					</div>
				</button>
			{/each}

			{#if $query.length > 0}
				<div class="p-4 border-t border-neutral-100">
					<button
						class="w-full text-left text-sm text-brand hover:text-brand-dark transition-colors"
						on:click={performSearch}
					>
						Buscar "{$query}" →
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Search Filters -->
	{#if $filters.length > 0}
		<div class="search-filters mt-4 flex flex-wrap gap-2">
			{#each $filters as filter}
				<div class="filter-tag bg-brand-50 text-brand px-3 py-1 rounded-full text-sm flex items-center space-x-2">
					<span>{filter.label}: {filter.value}</span>
					<button
						class="hover:bg-brand-100 rounded-full p-1 transition-colors"
						on:click={() => {
							filters.update(current => current.filter(f => f.id !== filter.id));
							if ($query) debouncedSearch($query);
						}}
					>
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.intelligent-search {
		@apply w-full max-w-2xl mx-auto;
	}

	.suggestions-dropdown {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.search-input-container input:focus {
		box-shadow: 0 0 0 4px rgba(var(--brand-50), 0.5);
	}

	@media (max-width: 768px) {
		.intelligent-search {
			@apply max-w-none;
		}

		.search-input-container input {
			@apply text-base py-3 pl-10 pr-14;
		}

		.search-input-container .absolute.left-4 {
			@apply left-3;
		}

		.search-input-container .absolute.right-2 {
			@apply right-1 text-xs px-2;
		}
	}
</style>