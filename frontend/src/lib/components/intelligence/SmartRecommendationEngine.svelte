<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import type { ServiceProvider, User, Recommendation } from '$lib/types';

	export let user: User;
	export let context: 'dashboard' | 'search' | 'booking' = 'dashboard';
	export let maxRecommendations: number = 6;

	const dispatch = createEventDispatcher();

	// Recommendation state
	const recommendations = writable<Recommendation[]>([]);
	const loading = writable(false);
	const confidence = writable(0);

	// ML-powered recommendation engine
	class SmartRecommendationEngine {
		private userId: string;
		private context: string;
		private mlModel: any = null;
		private behaviorData: any = {};

		constructor(userId: string, context: string) {
			this.userId = userId;
			this.context = context;
		}

		async initialize() {
			loading.set(true);
			try {
				// Load user behavior data
				await this.loadBehaviorData();

				// Initialize ML model
				await this.initializeMLModel();

				// Generate initial recommendations
				await this.generateRecommendations();

			} catch (error) {
				console.error('[SmartRecommendationEngine] Initialization failed:', error);
			} finally {
				loading.set(false);
			}
		}

		private async loadBehaviorData() {
			try {
				const response = await fetch(`/api/users/${this.userId}/behavior-analysis`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					}
				});

				if (response.ok) {
					this.behaviorData = await response.json();
					console.log('[SmartRecommendationEngine] Behavior data loaded:', Object.keys(this.behaviorData));
				}
			} catch (error) {
				console.error('[SmartRecommendationEngine] Failed to load behavior data:', error);
			}
		}

		private async initializeMLModel() {
			// Initialize TensorFlow.js model for client-side inference
			try {
				// Load pre-trained recommendation model
				if (typeof window !== 'undefined' && (window as any).tf) {
					const tf = (window as any).tf;
					this.mlModel = await tf.loadLayersModel('/models/recommendation-model.json');
					console.log('[SmartRecommendationEngine] ML model initialized');
				} else {
					// Fallback to server-side recommendations
					console.log('[SmartRecommendationEngine] Using server-side recommendations');
				}
			} catch (error) {
				console.error('[SmartRecommendationEngine] ML model loading failed:', error);
			}
		}

		private async generateRecommendations() {
			try {
				const payload = {
					userId: this.userId,
					context: this.context,
					behaviorData: this.behaviorData,
					maxResults: maxRecommendations,
					features: {
						collaborative: true,
						contentBased: true,
						contextual: true,
						realTime: true
					}
				};

				const response = await fetch('/api/recommendations/smart', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				});

				if (response.ok) {
					const data = await response.json();
					const processedRecommendations = await this.processRecommendations(data.recommendations);

					recommendations.set(processedRecommendations);
					confidence.set(data.confidence || 0.8);

					dispatch('recommendations-updated', {
						recommendations: processedRecommendations,
						confidence: data.confidence
					});

					console.log('[SmartRecommendationEngine] Generated recommendations:', processedRecommendations.length);
				}
			} catch (error) {
				console.error('[SmartRecommendationEngine] Failed to generate recommendations:', error);
			}
		}

		private async processRecommendations(rawRecommendations: any[]): Promise<Recommendation[]> {
			return rawRecommendations.map(rec => ({
				id: rec.id,
				provider: rec.provider,
				score: rec.score,
				reasoning: this.generateReasoning(rec),
				tags: this.generateTags(rec),
				priority: this.calculatePriority(rec),
				contextualFactors: rec.contextualFactors || [],
				personalizedMessage: this.generatePersonalizedMessage(rec)
			}));
		}

		private generateReasoning(rec: any): string {
			const reasons = [];

			if (rec.matchingPreferences) {
				reasons.push('Coincide con tus preferencias');
			}

			if (rec.similarUsers) {
				reasons.push('Popular entre usuarios similares');
			}

			if (rec.locationMatch) {
				reasons.push('Cerca de tu ubicación');
			}

			if (rec.availabilityMatch) {
				reasons.push('Disponible en tu horario preferido');
			}

			if (rec.highRating) {
				reasons.push('Excelentes reseñas');
			}

			return reasons.join(' • ') || 'Recomendado para ti';
		}

		private generateTags(rec: any): string[] {
			const tags = [];

			if (rec.score > 0.9) tags.push('TOP MATCH');
			if (rec.provider.isNew) tags.push('NUEVO');
			if (rec.provider.specialOffer) tags.push('OFERTA');
			if (rec.contextualFactors?.includes('trending')) tags.push('TRENDING');
			if (rec.provider.premiumVerified) tags.push('VERIFICADO');

			return tags;
		}

		private calculatePriority(rec: any): number {
			let priority = rec.score * 100;

			// Boost based on contextual factors
			if (rec.contextualFactors?.includes('immediate_availability')) priority += 20;
			if (rec.contextualFactors?.includes('location_proximity')) priority += 15;
			if (rec.contextualFactors?.includes('price_preference')) priority += 10;

			return Math.min(priority, 100);
		}

		private generatePersonalizedMessage(rec: any): string {
			const messages = [
				`Perfecto para tu estilo, ${user.firstName}`,
				'Basado en tu historial de reservas',
				'Otros usuarios con gustos similares lo aman',
				'Especialista en lo que buscas',
				'Disponible en tu zona'
			];

			// Choose message based on recommendation factors
			if (rec.contextualFactors?.includes('style_match')) {
				return messages[0];
			} else if (rec.contextualFactors?.includes('booking_history')) {
				return messages[1];
			} else if (rec.contextualFactors?.includes('collaborative_filtering')) {
				return messages[2];
			}

			return messages[Math.floor(Math.random() * messages.length)];
		}

		async updateWithUserFeedback(recommendationId: string, feedback: 'like' | 'dislike' | 'book') {
			try {
				await fetch('/api/recommendations/feedback', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						userId: this.userId,
						recommendationId,
						feedback,
						timestamp: Date.now()
					})
				});

				// Re-generate recommendations with updated preferences
				setTimeout(() => {
					this.generateRecommendations();
				}, 1000);

			} catch (error) {
				console.error('[SmartRecommendationEngine] Failed to record feedback:', error);
			}
		}

		async refreshRecommendations() {
			await this.generateRecommendations();
		}
	}

	let recommendationEngine: SmartRecommendationEngine;

	// User preference learning
	const userFeedback = writable<{[key: string]: 'like' | 'dislike'}>({});

	// Filtered and ranked recommendations
	const displayRecommendations = derived(
		[recommendations, userFeedback],
		([$recs, $feedback]) => {
			return $recs
				.filter(rec => !$feedback[rec.id] || $feedback[rec.id] === 'like')
				.sort((a, b) => b.priority - a.priority)
				.slice(0, maxRecommendations);
		}
	);

	function handleProviderClick(recommendation: Recommendation) {
		// Track engagement
		recommendationEngine.updateWithUserFeedback(recommendation.id, 'book');

		dispatch('provider-selected', recommendation);

		// Navigate to provider
		window.location.href = `/providers/${recommendation.provider.id}`;
	}

	function handleFeedback(recommendationId: string, feedback: 'like' | 'dislike') {
		userFeedback.update(current => ({
			...current,
			[recommendationId]: feedback
		}));

		recommendationEngine.updateWithUserFeedback(recommendationId, feedback);
	}

	function formatConfidenceLevel(conf: number): string {
		if (conf > 0.9) return 'Muy alta';
		if (conf > 0.7) return 'Alta';
		if (conf > 0.5) return 'Media';
		return 'Baja';
	}

	onMount(async () => {
		recommendationEngine = new SmartRecommendationEngine(user.id, context);
		await recommendationEngine.initialize();
	});
</script>

<div class="smart-recommendations">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-xl font-semibold text-neutral-800">Recomendaciones inteligentes</h2>
			<p class="text-sm text-neutral-600">
				Basado en tus preferencias y comportamiento • Confianza: {formatConfidenceLevel($confidence)}
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<div class="confidence-indicator bg-white rounded-lg px-3 py-1 border border-neutral-200">
				<div class="flex items-center space-x-2">
					<div class="w-2 h-2 rounded-full"
						 class:bg-green-500={$confidence > 0.8}
						 class:bg-yellow-500={$confidence > 0.6 && $confidence <= 0.8}
						 class:bg-red-500={$confidence <= 0.6}>
					</div>
					<span class="text-xs font-medium text-neutral-600">
						{Math.round($confidence * 100)}%
					</span>
				</div>
			</div>
			<button
				class="btn-sm btn-outline"
				on:click={() => recommendationEngine.refreshRecommendations()}
				disabled={$loading}
			>
				{#if $loading}
					<div class="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
				{:else}
					Actualizar
				{/if}
			</button>
		</div>
	</div>

	{#if $loading}
		<div class="loading-state">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each Array(6) as _}
					<div class="recommendation-skeleton bg-white rounded-xl p-4 border border-neutral-100">
						<div class="skeleton skeleton-image mb-4"></div>
						<div class="skeleton skeleton-text mb-2"></div>
						<div class="skeleton skeleton-text-sm mb-3"></div>
						<div class="flex justify-between items-center">
							<div class="skeleton skeleton-text-xs"></div>
							<div class="skeleton skeleton-button"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if $displayRecommendations.length === 0}
		<div class="empty-state text-center py-12">
			<div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-neutral-800 mb-2">Generando recomendaciones</h3>
			<p class="text-neutral-600">Estamos analizando tus preferencias para ofrecerte las mejores opciones.</p>
		</div>
	{:else}
		<div class="recommendations-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each $displayRecommendations as recommendation (recommendation.id)}
				<div class="recommendation-card bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-neutral-100 group">
					<!-- Priority Indicator -->
					{#if recommendation.priority > 85}
						<div class="absolute top-3 left-3 z-10 bg-brand text-white px-2 py-1 rounded-full text-xs font-medium">
							TOP MATCH
						</div>
					{/if}

					<!-- Provider Image -->
					<div class="relative aspect-w-16 aspect-h-9">
						<img
							src={recommendation.provider.profileImage || '/images/default-provider.jpg'}
							alt={recommendation.provider.name}
							class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
							loading="lazy"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-colors"></div>

						<!-- Tags -->
						{#if recommendation.tags.length > 0}
							<div class="absolute top-3 right-3 space-y-1">
								{#each recommendation.tags.slice(0, 2) as tag}
									<div class="bg-white/90 text-neutral-800 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
										{tag}
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="p-4">
						<!-- Provider Info -->
						<div class="flex items-start justify-between mb-3">
							<div class="flex-1">
								<h3 class="font-semibold text-neutral-800 mb-1 group-hover:text-brand transition-colors">
									{recommendation.provider.name}
								</h3>
								<p class="text-sm text-neutral-600">{recommendation.provider.specialties.join(', ')}</p>
							</div>
							<div class="flex items-center space-x-1 ml-2">
								<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								<span class="text-sm font-medium text-neutral-700">{recommendation.provider.rating}</span>
							</div>
						</div>

						<!-- Recommendation Reasoning -->
						<div class="bg-brand-50 rounded-lg p-3 mb-4">
							<p class="text-sm text-brand-dark font-medium mb-1">{recommendation.personalizedMessage}</p>
							<p class="text-xs text-brand-600">{recommendation.reasoning}</p>
						</div>

						<!-- Actions -->
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-neutral-700">
								Desde ${recommendation.provider.startingPrice}
							</span>
							<div class="flex items-center space-x-2">
								<!-- Feedback Buttons -->
								<button
									class="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
									on:click={() => handleFeedback(recommendation.id, 'dislike')}
									class:text-red-500={$userFeedback[recommendation.id] === 'dislike'}
									class:bg-red-50={$userFeedback[recommendation.id] === 'dislike'}
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 13l3 3 7-7" />
									</svg>
								</button>
								<button
									class="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
									on:click={() => handleFeedback(recommendation.id, 'like')}
									class:text-green-500={$userFeedback[recommendation.id] === 'like'}
									class:bg-green-50={$userFeedback[recommendation.id] === 'like'}
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
									</svg>
								</button>
								<button
									class="btn-sm btn-primary ml-2"
									on:click={() => handleProviderClick(recommendation)}
								>
									Ver perfil
								</button>
							</div>
						</div>

						<!-- Confidence Bar -->
						<div class="mt-3 pt-3 border-t border-neutral-100">
							<div class="flex items-center justify-between text-xs text-neutral-500 mb-1">
								<span>Match Score</span>
								<span>{Math.round(recommendation.score * 100)}%</span>
							</div>
							<div class="w-full bg-neutral-200 rounded-full h-1.5">
								<div
									class="bg-brand rounded-full h-1.5 transition-all duration-500"
									style="width: {recommendation.score * 100}%"
								></div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.recommendation-card:hover {
		transform: translateY(-4px);
	}

	.skeleton-image {
		@apply w-full h-32 bg-neutral-200 rounded-lg;
	}

	.skeleton-text {
		@apply w-3/4 h-4 bg-neutral-200 rounded;
	}

	.skeleton-text-sm {
		@apply w-1/2 h-3 bg-neutral-200 rounded;
	}

	.skeleton-text-xs {
		@apply w-1/3 h-2 bg-neutral-200 rounded;
	}

	.skeleton-button {
		@apply w-20 h-8 bg-neutral-200 rounded-lg;
	}

	.confidence-indicator {
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.recommendations-grid {
			@apply grid-cols-1;
		}

		.recommendation-card .absolute.top-3.right-3 {
			@apply space-y-0 flex space-x-1;
		}
	}
</style>