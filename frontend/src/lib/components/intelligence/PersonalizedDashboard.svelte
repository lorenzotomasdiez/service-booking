<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import type { User, Booking, ServiceProvider, Preference } from '$lib/types';

	export let user: User;

	// Personalization state
	const preferences = writable<Preference[]>([]);
	const recentBookings = writable<Booking[]>([]);
	const recommendations = writable<ServiceProvider[]>([]);
	const insights = writable<any>({});
	const adaptiveInterface = writable({
		theme: 'auto',
		layout: 'cards',
		contentDensity: 'comfortable',
		preferredLanguage: 'es-AR'
	});

	// ML-powered personalization engine
	class PersonalizationEngine {
		private userId: string;
		private learningData: any = {};

		constructor(userId: string) {
			this.userId = userId;
		}

		async initializePersonalization() {
			// Load user behavior data
			await this.loadUserBehavior();

			// Initialize ML recommendations
			await this.initializeRecommendations();

			// Set up adaptive interface
			await this.configureAdaptiveInterface();

			// Start real-time learning
			this.startBehaviorTracking();
		}

		private async loadUserBehavior() {
			try {
				const response = await fetch(`/api/users/${this.userId}/behavior`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					}
				});

				if (response.ok) {
					this.learningData = await response.json();
					console.log('[PersonalizationEngine] User behavior data loaded');
				}
			} catch (error) {
				console.error('[PersonalizationEngine] Failed to load behavior data:', error);
			}
		}

		private async initializeRecommendations() {
			try {
				const response = await fetch(`/api/recommendations/${this.userId}`, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						behaviorData: this.learningData,
						preferences: $preferences,
						context: 'dashboard'
					})
				});

				if (response.ok) {
					const recs = await response.json();
					recommendations.set(recs.providers || []);
					console.log('[PersonalizationEngine] Recommendations initialized:', recs.providers?.length);
				}
			} catch (error) {
				console.error('[PersonalizationEngine] Failed to load recommendations:', error);
			}
		}

		private async configureAdaptiveInterface() {
			// Analyze user device and usage patterns
			const deviceInfo = {
				isMobile: window.innerWidth < 768,
				connection: (navigator as any).connection?.effectiveType || 'unknown',
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
			};

			// Configure interface based on user patterns
			const interfaceConfig = {
				theme: this.learningData.preferredTheme || 'auto',
				layout: deviceInfo.isMobile ? 'list' : 'cards',
				contentDensity: this.learningData.preferredDensity || 'comfortable',
				preferredLanguage: 'es-AR'
			};

			adaptiveInterface.set(interfaceConfig);
		}

		private startBehaviorTracking() {
			// Track user interactions for continuous learning
			document.addEventListener('click', (event) => {
				const target = event.target as HTMLElement;
				if (target.dataset.trackable) {
					this.recordInteraction({
						type: 'click',
						element: target.dataset.trackable,
						timestamp: Date.now(),
						context: window.location.pathname
					});
				}
			});

			// Track scroll behavior
			let scrollTimeout: NodeJS.Timeout;
			window.addEventListener('scroll', () => {
				clearTimeout(scrollTimeout);
				scrollTimeout = setTimeout(() => {
					this.recordInteraction({
						type: 'scroll',
						scrollY: window.scrollY,
						timestamp: Date.now(),
						context: window.location.pathname
					});
				}, 500);
			});
		}

		private async recordInteraction(interaction: any) {
			try {
				await fetch(`/api/users/${this.userId}/interactions`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(interaction)
				});
			} catch (error) {
				console.error('[PersonalizationEngine] Failed to record interaction:', error);
			}
		}

		async updateRecommendations() {
			// Refresh recommendations based on latest behavior
			await this.initializeRecommendations();
		}
	}

	// Initialize personalization engine
	let personalizationEngine: PersonalizationEngine;

	// Dynamic content curation
	const curatedContent = derived(
		[preferences, recentBookings, recommendations],
		([$prefs, $bookings, $recs]) => {
			return {
				quickActions: generateQuickActions($prefs, $bookings),
				featuredProviders: $recs.slice(0, 6),
				personalizedTips: generatePersonalizedTips($prefs, $bookings),
				upcomingReminders: generateReminders($bookings)
			};
		}
	);

	function generateQuickActions(prefs: Preference[], bookings: Booking[]) {
		const actions = [];

		// Based on booking history
		if (bookings.length > 0) {
			const lastBooking = bookings[0];
			actions.push({
				icon: 'refresh',
				label: 'Reservar de nuevo',
				subtitle: lastBooking.serviceName,
				action: () => rebookService(lastBooking.serviceId),
				priority: 1
			});
		}

		// Based on preferences
		if (prefs.some(p => p.category === 'hair-care')) {
			actions.push({
				icon: 'scissors',
				label: 'Corte de cabello',
				subtitle: 'Encuentra tu barbero ideal',
				action: () => searchServices('hair-care'),
				priority: 2
			});
		}

		// Time-based suggestions
		const hour = new Date().getHours();
		if (hour >= 9 && hour <= 18) {
			actions.push({
				icon: 'calendar',
				label: 'Reservar hoy',
				subtitle: 'Disponibilidad inmediata',
				action: () => searchAvailableToday(),
				priority: 3
			});
		}

		return actions.sort((a, b) => a.priority - b.priority);
	}

	function generatePersonalizedTips(prefs: Preference[], bookings: Booking[]) {
		const tips = [];

		if (bookings.length === 0) {
			tips.push({
				title: 'Bienvenido a BarberPro',
				content: 'Descubre los mejores profesionales cerca de ti. ¡Tu primera reserva tiene 10% de descuento!',
				type: 'welcome',
				action: 'explore-services'
			});
		}

		if (prefs.length === 0) {
			tips.push({
				title: 'Personaliza tu experiencia',
				content: 'Completa tu perfil para recibir recomendaciones más precisas.',
				type: 'profile',
				action: 'complete-profile'
			});
		}

		return tips;
	}

	function generateReminders(bookings: Booking[]) {
		const upcoming = bookings.filter(b =>
			b.status === 'confirmed' && new Date(b.scheduledAt) > new Date()
		).slice(0, 3);

		return upcoming.map(booking => ({
			id: booking.id,
			title: booking.serviceName,
			provider: booking.providerName,
			time: new Date(booking.scheduledAt),
			location: booking.location,
			canReschedule: true,
			canCancel: true
		}));
	}

	// Action handlers
	function rebookService(serviceId: string) {
		window.location.href = `/booking/${serviceId}`;
	}

	function searchServices(category: string) {
		window.location.href = `/servicios?categoria=${category}`;
	}

	function searchAvailableToday() {
		window.location.href = `/servicios?disponible=hoy`;
	}

	onMount(async () => {
		personalizationEngine = new PersonalizationEngine(user.id);
		await personalizationEngine.initializePersonalization();

		// Load user data
		try {
			const [prefsRes, bookingsRes] = await Promise.all([
				fetch(`/api/users/${user.id}/preferences`),
				fetch(`/api/users/${user.id}/bookings?limit=10`)
			]);

			if (prefsRes.ok) preferences.set(await prefsRes.json());
			if (bookingsRes.ok) recentBookings.set(await bookingsRes.json());
		} catch (error) {
			console.error('[PersonalizedDashboard] Failed to load user data:', error);
		}
	});
</script>

<div class="personalized-dashboard" class:mobile-optimized={$adaptiveInterface.layout === 'list'}>
	<!-- Dynamic Header with Personalized Greeting -->
	<div class="dashboard-header bg-gradient-to-br from-brand-50 to-primary-50 rounded-2xl p-6 mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-neutral-800 mb-2">
					¡Hola, {user.firstName}! 👋
				</h1>
				<p class="text-neutral-600">
					{#if $curatedContent.upcomingReminders.length > 0}
						Tienes {$curatedContent.upcomingReminders.length} cita{$curatedContent.upcomingReminders.length > 1 ? 's' : ''} próxima{$curatedContent.upcomingReminders.length > 1 ? 's' : ''}
					{:else}
						¿Listo para tu próxima experiencia premium?
					{/if}
				</p>
			</div>
			<div class="hidden md:flex items-center space-x-3">
				<div class="satisfaction-score bg-white rounded-lg px-4 py-2 shadow-sm">
					<div class="text-sm text-neutral-500">Tu satisfacción</div>
					<div class="text-lg font-bold text-brand">4.9/5</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions Row -->
	<div class="quick-actions mb-8">
		<h2 class="text-lg font-semibold mb-4 text-neutral-800">Acciones rápidas</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each $curatedContent.quickActions as action}
				<button
					class="quick-action-card bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-100 text-left group"
					on:click={action.action}
					data-trackable="quick-action-{action.label}"
				>
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
							<svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if action.icon === 'refresh'}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								{:else if action.icon === 'scissors'}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l.5 3M17 4l-.5 3M6.5 7l6 6M17.5 7l-6 6M12.5 13L10 16M12.5 13L15 16" />
								{:else if action.icon === 'calendar'}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								{/if}
							</svg>
						</div>
						<div class="flex-1">
							<div class="font-medium text-neutral-800">{action.label}</div>
							<div class="text-sm text-neutral-500">{action.subtitle}</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Personalized Recommendations -->
	<div class="recommendations mb-8">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-neutral-800">Recomendado para ti</h2>
			<button
				class="text-brand hover:text-brand-dark transition-colors text-sm font-medium"
				on:click={() => personalizationEngine.updateRecommendations()}
				data-trackable="refresh-recommendations"
			>
				Actualizar
			</button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each $curatedContent.featuredProviders as provider}
				<div class="provider-card bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-neutral-100">
					<div class="aspect-w-16 aspect-h-9">
						<img
							src={provider.profileImage || '/images/default-provider.jpg'}
							alt={provider.name}
							class="w-full h-48 object-cover"
							loading="lazy"
						/>
					</div>
					<div class="p-4">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold text-neutral-800">{provider.name}</h3>
							<div class="flex items-center space-x-1">
								<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								<span class="text-sm font-medium text-neutral-700">{provider.rating}</span>
							</div>
						</div>
						<p class="text-sm text-neutral-600 mb-3">{provider.specialties.join(', ')}</p>
						<div class="flex items-center justify-between">
							<span class="text-sm text-neutral-500">Desde ${provider.startingPrice}</span>
							<button
								class="btn-sm btn-primary"
								on:click={() => window.location.href = `/providers/${provider.id}`}
								data-trackable="view-provider-{provider.id}"
							>
								Ver perfil
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Upcoming Appointments -->
	{#if $curatedContent.upcomingReminders.length > 0}
		<div class="upcoming-appointments mb-8">
			<h2 class="text-lg font-semibold mb-4 text-neutral-800">Próximas citas</h2>
			<div class="space-y-4">
				{#each $curatedContent.upcomingReminders as appointment}
					<div class="appointment-card bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-4">
								<div class="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center">
									<svg class="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
								<div>
									<h3 class="font-semibold text-neutral-800">{appointment.title}</h3>
									<p class="text-sm text-neutral-600">{appointment.provider}</p>
									<div class="flex items-center space-x-4 mt-1">
										<span class="text-sm text-neutral-500">
											{appointment.time.toLocaleDateString('es-AR', {
												weekday: 'long',
												day: 'numeric',
												month: 'long'
											})}
										</span>
										<span class="text-sm text-neutral-500">
											{appointment.time.toLocaleTimeString('es-AR', {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								{#if appointment.canReschedule}
									<button class="text-neutral-500 hover:text-brand transition-colors p-2">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</button>
								{/if}
								<button class="btn-sm btn-primary">Ver detalles</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Personalized Tips & Insights -->
	{#if $curatedContent.personalizedTips.length > 0}
		<div class="personalized-tips">
			<h2 class="text-lg font-semibold mb-4 text-neutral-800">Tips para ti</h2>
			<div class="space-y-4">
				{#each $curatedContent.personalizedTips as tip}
					<div class="tip-card bg-gradient-to-r from-brand-50 to-primary-50 rounded-xl p-4 border border-brand-100">
						<div class="flex items-start space-x-3">
							<div class="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
								{#if tip.type === 'welcome'}
									<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
									</svg>
								{:else if tip.type === 'profile'}
									<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								{/if}
							</div>
							<div class="flex-1">
								<h3 class="font-semibold text-neutral-800 mb-1">{tip.title}</h3>
								<p class="text-sm text-neutral-600 mb-3">{tip.content}</p>
								{#if tip.action}
									<button class="text-sm font-medium text-brand hover:text-brand-dark transition-colors">
										{#if tip.action === 'explore-services'}
											Explorar servicios →
										{:else if tip.action === 'complete-profile'}
											Completar perfil →
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.personalized-dashboard {
		@apply max-w-6xl mx-auto p-4;
	}

	.mobile-optimized {
		@apply max-w-none;
	}

	.quick-action-card:hover {
		transform: translateY(-2px);
	}

	.provider-card:hover {
		transform: translateY(-4px);
	}

	.appointment-card:hover {
		border-color: theme('colors.brand.200');
	}

	.tip-card {
		border-left: 4px solid theme('colors.brand.500');
	}

	@media (max-width: 768px) {
		.personalized-dashboard {
			@apply p-2;
		}

		.dashboard-header {
			@apply p-4 mb-4;
		}

		.dashboard-header h1 {
			@apply text-xl;
		}
	}
</style>