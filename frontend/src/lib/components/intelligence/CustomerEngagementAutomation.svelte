<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import type { User, EngagementEvent, AutomationRule, CustomerJourney } from '$lib/types';

	export let user: User;

	const dispatch = createEventDispatcher();

	// Engagement automation state
	const automationRules = writable<AutomationRule[]>([]);
	const engagementEvents = writable<EngagementEvent[]>([]);
	const customerJourney = writable<CustomerJourney | null>(null);
	const notifications = writable<any[]>([]);

	// Customer Engagement Automation Engine
	class CustomerEngagementAutomation {
		private userId: string;
		private journeyData: any = {};
		private behaviorPatterns: any = {};

		constructor(userId: string) {
			this.userId = userId;
		}

		async initialize() {
			await this.loadCustomerJourney();
			await this.loadAutomationRules();
			await this.analyzeBehaviorPatterns();
			await this.setupProactiveAssistance();

			this.startEngagementMonitoring();
			console.log('[CustomerEngagement] Automation engine initialized');
		}

		private async loadCustomerJourney() {
			try {
				const response = await fetch(`/api/customers/${this.userId}/journey`, {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					this.journeyData = data;
					customerJourney.set(data.journey);
				}
			} catch (error) {
				console.error('[CustomerEngagement] Failed to load customer journey:', error);
			}
		}

		private async loadAutomationRules() {
			try {
				const response = await fetch('/api/engagement/automation-rules', {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					automationRules.set(data.rules || []);
				}
			} catch (error) {
				console.error('[CustomerEngagement] Failed to load automation rules:', error);
			}
		}

		private async analyzeBehaviorPatterns() {
			try {
				const response = await fetch(`/api/customers/${this.userId}/behavior-analysis`, {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					this.behaviorPatterns = data.patterns;
					this.setupPersonalizedAutomations(data.patterns);
				}
			} catch (error) {
				console.error('[CustomerEngagement] Failed to analyze behavior patterns:', error);
			}
		}

		private setupPersonalizedAutomations(patterns: any) {
			// Create personalized automation rules based on user behavior
			const personalizedRules: AutomationRule[] = [];

			// Booking frequency automation
			if (patterns.bookingFrequency === 'regular') {
				personalizedRules.push({
					id: 'booking-reminder',
					trigger: 'time_based',
					condition: 'days_since_last_booking > booking_average_interval',
					action: 'send_booking_reminder',
					priority: 'medium',
					enabled: true
				});
			}

			// Service preference automation
			if (patterns.preferredServices && patterns.preferredServices.length > 0) {
				personalizedRules.push({
					id: 'service-recommendation',
					trigger: 'browse_services',
					condition: 'viewing_different_service_category',
					action: 'show_preferred_services',
					priority: 'low',
					enabled: true
				});
			}

			// Satisfaction automation
			if (patterns.satisfactionTrend === 'improving') {
				personalizedRules.push({
					id: 'loyalty-reward',
					trigger: 'booking_completed',
					condition: 'satisfaction_rating >= 4',
					action: 'offer_loyalty_points',
					priority: 'high',
					enabled: true
				});
			}

			automationRules.update(rules => [...rules, ...personalizedRules]);
		}

		private async setupProactiveAssistance() {
			// Monitor user actions for proactive assistance opportunities
			this.monitorUserActions();
			this.setupSmartNotifications();
			this.initializeConversationalUI();
		}

		private monitorUserActions() {
			// Monitor page views and user interactions
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'childList') {
						this.analyzeUserInteraction(mutation);
					}
				});
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true
			});

			// Monitor scroll behavior
			let scrollTimeout: NodeJS.Timeout;
			window.addEventListener('scroll', () => {
				clearTimeout(scrollTimeout);
				scrollTimeout = setTimeout(() => {
					this.analyzeScrollBehavior();
				}, 1000);
			});
		}

		private analyzeUserInteraction(mutation: MutationRecord) {
			// Analyze user interactions to provide proactive help
			const target = mutation.target as Element;

			// Check if user is struggling with form completion
			if (target.querySelector('input[data-error]')) {
				this.triggerProactiveHelp('form_assistance');
			}

			// Check if user is browsing services for too long
			if (target.querySelector('[data-service-card]')) {
				this.trackServiceBrowsingTime();
			}
		}

		private analyzeScrollBehavior() {
			const scrollPosition = window.scrollY;
			const pageHeight = document.body.scrollHeight - window.innerHeight;
			const scrollPercentage = (scrollPosition / pageHeight) * 100;

			// If user scrolled through most of the page without action
			if (scrollPercentage > 80 && !this.hasUserTakenAction()) {
				this.triggerProactiveHelp('browsing_assistance');
			}
		}

		private trackServiceBrowsingTime() {
			// Track how long user has been browsing services
			const browsingStartKey = 'service_browsing_start';
			const startTime = localStorage.getItem(browsingStartKey);

			if (!startTime) {
				localStorage.setItem(browsingStartKey, Date.now().toString());
			} else {
				const elapsed = Date.now() - parseInt(startTime);
				if (elapsed > 3 * 60 * 1000) { // 3 minutes
					this.triggerProactiveHelp('service_selection_assistance');
					localStorage.removeItem(browsingStartKey);
				}
			}
		}

		private hasUserTakenAction(): boolean {
			// Check if user has taken meaningful actions recently
			const recentActions = this.getRecentEngagementEvents();
			return recentActions.some(event =>
				['booking_initiated', 'service_selected', 'provider_contacted'].includes(event.type)
			);
		}

		private getRecentEngagementEvents(): EngagementEvent[] {
			const recent = Date.now() - (5 * 60 * 1000); // Last 5 minutes
			return engagementEvents.value.filter(event =>
				new Date(event.timestamp).getTime() > recent
			);
		}

		private async triggerProactiveHelp(assistanceType: string) {
			const assistanceMessages = {
				form_assistance: {
					title: '¿Necesitas ayuda?',
					message: 'Veo que tienes dificultades con el formulario. ¿Te gustaría que te ayude?',
					actions: [
						{ label: 'Sí, ayúdame', action: 'show_form_help' },
						{ label: 'No, gracias', action: 'dismiss' }
					]
				},
				browsing_assistance: {
					title: '¿Te puedo ayudar a encontrar algo?',
					message: 'Has estado navegando un rato. ¿Buscas algo específico?',
					actions: [
						{ label: 'Mostrar recomendaciones', action: 'show_recommendations' },
						{ label: 'Buscar por ubicación', action: 'location_search' },
						{ label: 'Estoy bien', action: 'dismiss' }
					]
				},
				service_selection_assistance: {
					title: '¿Indeciso sobre qué servicio elegir?',
					message: 'Te puedo ayudar a encontrar el servicio perfecto para ti.',
					actions: [
						{ label: 'Ayúdame a elegir', action: 'service_wizard' },
						{ label: 'Ver más populares', action: 'show_popular' },
						{ label: 'Continuar navegando', action: 'dismiss' }
					]
				}
			};

			const assistance = assistanceMessages[assistanceType];
			if (assistance) {
				this.showProactiveAssistance(assistance);
			}
		}

		private showProactiveAssistance(assistance: any) {
			const notification = {
				id: `assistance_${Date.now()}`,
				type: 'proactive_help',
				...assistance,
				timestamp: Date.now()
			};

			notifications.update(list => [notification, ...list]);

			// Auto-dismiss after 10 seconds if no action taken
			setTimeout(() => {
				notifications.update(list =>
					list.filter(n => n.id !== notification.id)
				);
			}, 10000);
		}

		private setupSmartNotifications() {
			// Setup intelligent notification timing based on user behavior
			this.scheduleSmartNotifications();
		}

		private async scheduleSmartNotifications() {
			const preferences = this.behaviorPatterns.notificationPreferences || {};
			const optimalTimes = preferences.optimalTimes || ['09:00', '14:00', '19:00'];

			// Schedule notifications at user's preferred times
			optimalTimes.forEach(time => {
				this.scheduleNotificationAtTime(time);
			});
		}

		private scheduleNotificationAtTime(time: string) {
			const [hours, minutes] = time.split(':').map(Number);
			const now = new Date();
			const scheduledTime = new Date();

			scheduledTime.setHours(hours, minutes, 0, 0);

			// If the time has passed today, schedule for tomorrow
			if (scheduledTime <= now) {
				scheduledTime.setDate(scheduledTime.getDate() + 1);
			}

			const delay = scheduledTime.getTime() - now.getTime();

			setTimeout(() => {
				this.checkForSmartNotifications();
			}, delay);
		}

		private async checkForSmartNotifications() {
			// Check if user needs any intelligent notifications
			const journey = customerJourney.value;
			if (!journey) return;

			// Days since last booking
			const daysSinceLastBooking = this.getDaysSinceLastBooking();

			if (daysSinceLastBooking >= journey.averageBookingInterval) {
				this.sendBookingReminderNotification();
			}

			// Check for special offers
			if (this.shouldShowSpecialOffer()) {
				this.sendSpecialOfferNotification();
			}

			// Check for loyalty rewards
			if (this.hasEarnedLoyaltyReward()) {
				this.sendLoyaltyRewardNotification();
			}
		}

		private initializeConversationalUI() {
			// Initialize conversational interface for seamless help
			if (!document.querySelector('#conversational-ui')) {
				this.createConversationalUI();
			}
		}

		private createConversationalUI() {
			const ui = document.createElement('div');
			ui.id = 'conversational-ui';
			ui.className = 'fixed bottom-4 right-4 z-50';
			ui.innerHTML = `
				<button id="help-button" class="w-14 h-14 bg-brand text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</button>
			`;

			document.body.appendChild(ui);

			// Add click handler
			const helpButton = ui.querySelector('#help-button');
			helpButton?.addEventListener('click', () => {
				this.openConversationalHelp();
			});
		}

		private openConversationalHelp() {
			// Open conversational help interface
			dispatch('open-conversational-help');
		}

		// Public methods for handling notifications
		async dismissNotification(notificationId: string) {
			notifications.update(list =>
				list.filter(n => n.id !== notificationId)
			);

			// Track dismissal for learning
			await this.trackEngagementEvent('notification_dismissed', {
				notificationId
			});
		}

		async handleNotificationAction(notificationId: string, action: string) {
			const notification = notifications.value.find(n => n.id === notificationId);
			if (!notification) return;

			// Handle the action
			switch (action) {
				case 'show_form_help':
					dispatch('show-form-help');
					break;

				case 'show_recommendations':
					dispatch('show-recommendations');
					break;

				case 'location_search':
					dispatch('open-location-search');
					break;

				case 'service_wizard':
					dispatch('open-service-wizard');
					break;

				case 'show_popular':
					dispatch('show-popular-services');
					break;

				default:
					console.log('Unknown action:', action);
			}

			// Remove notification
			await this.dismissNotification(notificationId);

			// Track action for learning
			await this.trackEngagementEvent('notification_action_taken', {
				notificationId,
				action
			});
		}

		private async trackEngagementEvent(type: string, data: any) {
			const event: EngagementEvent = {
				id: `event_${Date.now()}`,
				type,
				data,
				timestamp: new Date(),
				userId: this.userId
			};

			engagementEvents.update(list => [event, ...list]);

			// Send to server for analytics
			try {
				await fetch('/api/engagement/events', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(event)
				});
			} catch (error) {
				console.error('[CustomerEngagement] Failed to track event:', error);
			}
		}

		private getDaysSinceLastBooking(): number {
			const journey = customerJourney.value;
			if (!journey?.lastBookingDate) return 0;

			const lastBooking = new Date(journey.lastBookingDate);
			const now = new Date();
			return Math.floor((now.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24));
		}

		private shouldShowSpecialOffer(): boolean {
			// Logic to determine if user should see special offers
			const journey = customerJourney.value;
			return journey?.engagementScore < 70; // Low engagement users get offers
		}

		private hasEarnedLoyaltyReward(): boolean {
			// Check if user has earned loyalty rewards
			const journey = customerJourney.value;
			return journey?.loyaltyPoints >= journey?.nextRewardThreshold;
		}

		private sendBookingReminderNotification() {
			const notification = {
				id: `booking_reminder_${Date.now()}`,
				type: 'booking_reminder',
				title: '¿Listo para tu próxima cita?',
				message: 'Han pasado algunos días desde tu última reserva. ¿Quieres reservar de nuevo?',
				actions: [
					{ label: 'Reservar ahora', action: 'book_now' },
					{ label: 'Ver favoritos', action: 'show_favorites' },
					{ label: 'Después', action: 'dismiss' }
				],
				timestamp: Date.now()
			};

			notifications.update(list => [notification, ...list]);
		}

		private sendSpecialOfferNotification() {
			const notification = {
				id: `special_offer_${Date.now()}`,
				type: 'special_offer',
				title: '¡Oferta especial para ti!',
				message: '15% de descuento en tu próxima reserva. Solo por tiempo limitado.',
				actions: [
					{ label: 'Ver ofertas', action: 'view_offers' },
					{ label: 'Reservar ahora', action: 'book_now' },
					{ label: 'No, gracias', action: 'dismiss' }
				],
				timestamp: Date.now()
			};

			notifications.update(list => [notification, ...list]);
		}

		private sendLoyaltyRewardNotification() {
			const notification = {
				id: `loyalty_reward_${Date.now()}`,
				type: 'loyalty_reward',
				title: '¡Has ganado una recompensa!',
				message: 'Tus puntos de fidelidad te han dado una recompensa especial.',
				actions: [
					{ label: 'Ver recompensa', action: 'view_reward' },
					{ label: 'Canjear puntos', action: 'redeem_points' },
					{ label: 'Ver después', action: 'dismiss' }
				],
				timestamp: Date.now()
			};

			notifications.update(list => [notification, ...list]);
		}

		private startEngagementMonitoring() {
			// Monitor engagement metrics in real-time
			setInterval(() => {
				this.updateEngagementMetrics();
			}, 60000); // Every minute
		}

		private async updateEngagementMetrics() {
			try {
				const response = await fetch(`/api/customers/${this.userId}/engagement-metrics`, {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const metrics = await response.json();
					customerJourney.update(journey => ({
						...journey,
						...metrics
					}));
				}
			} catch (error) {
				console.error('[CustomerEngagement] Failed to update metrics:', error);
			}
		}
	}

	let engagementEngine: CustomerEngagementAutomation;

	onMount(async () => {
		engagementEngine = new CustomerEngagementAutomation(user.id);
		await engagementEngine.initialize();
	});
</script>

<!-- Proactive Assistance Notifications -->
{#each $notifications as notification}
	<div
		class="proactive-notification fixed top-4 right-4 bg-white rounded-xl shadow-lg border border-neutral-200 p-4 z-50 max-w-sm transform animate-slide-in"
		style="margin-top: {$notifications.indexOf(notification) * 90}px"
	>
		<div class="flex items-start justify-between mb-3">
			<div class="flex items-center space-x-2">
				{#if notification.type === 'proactive_help'}
					<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				{:else if notification.type === 'booking_reminder'}
					<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
				{:else if notification.type === 'special_offer'}
					<div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
						</svg>
					</div>
				{:else if notification.type === 'loyalty_reward'}
					<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
						</svg>
					</div>
				{/if}
				<h4 class="font-semibold text-neutral-800">{notification.title}</h4>
			</div>
			<button
				class="text-neutral-400 hover:text-neutral-600 transition-colors"
				on:click={() => engagementEngine.dismissNotification(notification.id)}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<p class="text-sm text-neutral-600 mb-4">{notification.message}</p>

		<div class="flex flex-col space-y-2">
			{#each notification.actions as actionItem}
				{#if actionItem.action !== 'dismiss'}
					<button
						class="btn-sm"
						class:btn-primary={actionItem.action === notification.actions[0].action}
						class:btn-outline={actionItem.action !== notification.actions[0].action}
						on:click={() => engagementEngine.handleNotificationAction(notification.id, actionItem.action)}
					>
						{actionItem.label}
					</button>
				{/if}
			{/each}
		</div>
	</div>
{/each}

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}

	.proactive-notification {
		backdrop-filter: blur(8px);
	}

	@media (max-width: 768px) {
		.proactive-notification {
			right: 1rem;
			left: 1rem;
			max-width: none;
		}
	}
</style>