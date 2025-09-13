<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { formatDistance, format } from 'date-fns';
	import { es } from 'date-fns/locale';
	import Card from '../Card.svelte';
	import Button from '../Button.svelte';
	import Loading from '../Loading.svelte';
	import Modal from '../Modal.svelte';
	
	const dispatch = createEventDispatcher();
	
	export let userId: string;
	export let userPreferences: any = {};
	export let realTimeUpdates = true;
	
	// Intelligent notification state
	let loading = false;
	let showSettingsModal = false;
	let selectedFilter = 'all';
	let showOnlyUnread = false;
	
	// AI-powered notification data
	const notifications = writable([]);
	const prioritizedAlerts = writable([]);
	const contextualSuggestions = writable([]);
	const smartSummary = writable(null);
	const notificationSettings = writable({
		aiPrioritization: true,
		smartGrouping: true,
		contextualTiming: true,
		personalization: true,
		quietHours: {
			enabled: true,
			start: '22:00',
			end: '08:00'
		},
		filters: {
			bookings: true,
			payments: true,
			messages: true,
			promotions: false,
			system: true
		}
	});
	
	// WebSocket connection for real-time notifications
	let socket: WebSocket | null = null;
	
	onMount(async () => {
		await loadNotifications();
		if (realTimeUpdates) {
			initializeRealTimeConnection();
		}
		setInterval(loadSmartSummary, 300000); // Update summary every 5 minutes
	});
	
	async function loadNotifications() {
		loading = true;
		
		try {
			const response = await fetch(`/api/ai/notifications/${userId}`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				notifications.set(data.notifications || []);
				prioritizedAlerts.set(data.prioritizedAlerts || []);
				contextualSuggestions.set(data.suggestions || []);
				
				// Load AI-generated smart summary
				if (data.smartSummary) {
					smartSummary.set(data.smartSummary);
				}
			} else {
				console.error('Failed to load notifications');
			}
		} catch (error) {
			console.error('Notification loading error:', error);
		} finally {
			loading = false;
		}
	}
	
	function initializeRealTimeConnection() {
		const wsUrl = `wss://api.barberpro.com.ar/notifications/${userId}`;
		socket = new WebSocket(wsUrl);
		
		socket.onopen = () => {
			console.log('Real-time notification connection established');
		};
		
		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			handleRealTimeNotification(data);
		};
		
		socket.onerror = (error) => {
			console.error('WebSocket error:', error);
		};
		
		socket.onclose = () => {
			// Attempt to reconnect after 5 seconds
			setTimeout(() => {
				if (realTimeUpdates) {
					initializeRealTimeConnection();
				}
			}, 5000);
		};
	}
	
	function handleRealTimeNotification(data: any) {
		if (data.type === 'new_notification') {
			notifications.update(current => [data.notification, ...current]);
			
			// Check if it's a high-priority alert
			if (data.notification.priority === 'high' || data.notification.priority === 'urgent') {
				prioritizedAlerts.update(current => [data.notification, ...current]);
				
				// Show browser notification if permitted
				showBrowserNotification(data.notification);
			}
			
			// Dispatch event for parent components
			dispatch('new-notification', data.notification);
		} else if (data.type === 'summary_update') {
			smartSummary.set(data.summary);
		}
	}
	
	async function loadSmartSummary() {
		try {
			const response = await fetch(`/api/ai/notifications/summary/${userId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					userPreferences,
					context: {
						timeOfDay: new Date().getHours(),
						dayOfWeek: new Date().getDay(),
						recentActivity: userPreferences.recentActivity || []
					}
				})
			});
			
			if (response.ok) {
				const summary = await response.json();
				smartSummary.set(summary);
			}
		} catch (error) {
			console.error('Smart summary error:', error);
		}
	}
	
	async function markAsRead(notificationId: string) {
		try {
			const response = await fetch(`/api/ai/notifications/${notificationId}/read`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				}
			});
			
			if (response.ok) {
				notifications.update(current => 
					current.map(n => n.id === notificationId ? { ...n, read: true } : n)
				);
			}
		} catch (error) {
			console.error('Mark as read error:', error);
		}
	}
	
	async function markAllAsRead() {
		try {
			const response = await fetch(`/api/ai/notifications/${userId}/mark-all-read`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				}
			});
			
			if (response.ok) {
				notifications.update(current => 
					current.map(n => ({ ...n, read: true }))
				);
				prioritizedAlerts.set([]);
			}
		} catch (error) {
			console.error('Mark all as read error:', error);
		}
	}
	
	async function snoozeNotification(notificationId: string, snoozeMinutes: number) {
		try {
			const response = await fetch(`/api/ai/notifications/${notificationId}/snooze`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({ snoozeMinutes })
			});
			
			if (response.ok) {
				notifications.update(current => 
					current.filter(n => n.id !== notificationId)
				);
			}
		} catch (error) {
			console.error('Snooze notification error:', error);
		}
	}
	
	function showBrowserNotification(notification: any) {
		if ('Notification' in window && Notification.permission === 'granted') {
			const browserNotif = new Notification(notification.title, {
				body: notification.message,
				icon: '/favicon.ico',
				tag: notification.id
			});
			
			browserNotif.onclick = () => {
				window.focus();
				handleNotificationClick(notification);
				browserNotif.close();
			};
		}
	}
	
	function handleNotificationClick(notification: any) {
		// Mark as read and handle action
		markAsRead(notification.id);
		
		// Dispatch click event with notification data
		dispatch('notification-click', {
			notification,
			action: notification.action || 'view'
		});
	}
	
	function getNotificationIcon(type: string) {
		switch (type) {
			case 'booking':
				return 'M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m0 0v1a2 2 0 01-2 2H10a2 2 0 01-2-2V7';
			case 'payment':
				return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
			case 'message':
				return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
			case 'promotion':
				return 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z';
			case 'system':
				return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
			default:
				return 'M15 17h5l-5 5v-5zM9.059 15H6.5a2.5 2.5 0 110-5h1.731c.973 0 1.908-.49 2.456-1.296l.755-.966a2.5 2.5 0 012.456-1.296H15.5a2.5 2.5 0 110 5H13.24c-.973 0-1.908.49-2.456 1.296l-.755.966A2.5 2.5 0 017.574 15z';
		}
	}
	
	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'urgent':
				return 'border-red-500 bg-red-50';
			case 'high':
				return 'border-orange-500 bg-orange-50';
			case 'medium':
				return 'border-yellow-500 bg-yellow-50';
			case 'low':
				return 'border-gray-300 bg-gray-50';
			default:
				return 'border-gray-300 bg-white';
		}
	}
	
	// Filter notifications based on selected criteria
	$: filteredNotifications = $notifications.filter(notification => {
		if (showOnlyUnread && notification.read) return false;
		if (selectedFilter !== 'all' && notification.type !== selectedFilter) return false;
		return true;
	});
	
	$: unreadCount = $notifications.filter(n => !n.read).length;
</script>

<div class="intelligent-notification-center space-y-6">
	<!-- Header with Smart Summary -->
	<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold text-neutral-900 flex items-center space-x-2">
				<span>Centro de Notificaciones IA</span>
				{#if unreadCount > 0}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
						{unreadCount} sin leer
					</span>
				{/if}
			</h2>
			<p class="text-neutral-600 mt-1">Notificaciones priorizadas con inteligencia artificial</p>
		</div>
		
		<div class="flex items-center space-x-3">
			<Button variant="secondary" size="sm" on:click={() => showSettingsModal = true}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				</svg>
				Configuración
			</Button>
			
			{#if unreadCount > 0}
				<Button variant="primary" size="sm" on:click={markAllAsRead}>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Marcar Todo Leído
				</Button>
			{/if}
		</div>
	</div>
	
	<!-- AI Smart Summary -->
	{#if $smartSummary}
		<Card class="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
			<div class="flex items-start space-x-3">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-blue-900 mb-2">Resumen Inteligente</h3>
					<p class="text-blue-800 text-sm leading-relaxed">{$smartSummary.summary}</p>
					
					{#if $smartSummary.insights && $smartSummary.insights.length > 0}
						<div class="mt-3 space-y-1">
							{#each $smartSummary.insights as insight}
								<div class="flex items-center space-x-2 text-blue-700">
									<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
									<span class="text-xs">{insight}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</Card>
	{/if}
	
	<!-- High Priority Alerts -->
	{#if $prioritizedAlerts.length > 0}
		<Card class="border-red-200 bg-red-50">
			<h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center space-x-2">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<span>Alertas Prioritarias</span>
			</h3>
			<div class="space-y-3">
				{#each $prioritizedAlerts as alert}
					<div class="bg-white border border-red-200 rounded-lg p-4">
						<div class="flex items-start space-x-3">
							<div class="flex-shrink-0">
								<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getNotificationIcon(alert.type)} />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-red-900">{alert.title}</p>
								<p class="text-red-700 text-sm mt-1">{alert.message}</p>
								<p class="text-red-600 text-xs mt-2">
									{formatDistance(new Date(alert.createdAt), new Date(), { addSuffix: true, locale: es })}
								</p>
							</div>
							<div class="flex-shrink-0">
								<Button 
									variant="primary" 
									size="sm"
									on:click={() => handleNotificationClick(alert)}
								>
									{alert.actionLabel || 'Ver'}
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{/if}
	
	<!-- Filter Controls -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div class="flex items-center space-x-4">
			<div class="flex items-center space-x-2">
				<label class="text-sm font-medium text-neutral-700">Filtrar por:</label>
				<select 
					bind:value={selectedFilter}
					class="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand focus:border-transparent"
				>
					<option value="all">Todas</option>
					<option value="booking">Reservas</option>
					<option value="payment">Pagos</option>
					<option value="message">Mensajes</option>
					<option value="promotion">Promociones</option>
					<option value="system">Sistema</option>
				</select>
			</div>
			
			<label class="flex items-center space-x-2 text-sm">
				<input 
					type="checkbox" 
					bind:checked={showOnlyUnread}
					class="rounded"
				/>
				<span class="text-neutral-700">Solo no leídas</span>
			</label>
		</div>
		
		<div class="text-sm text-neutral-500">
			{filteredNotifications.length} notificaciones
		</div>
	</div>
	
	{#if loading}
		<Loading message="Cargando notificaciones..." />
	{:else if filteredNotifications.length === 0}
		<Card>
			<div class="text-center py-8">
				<svg class="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9.059 15H6.5a2.5 2.5 0 110-5h1.731c.973 0 1.908-.49 2.456-1.296l.755-.966a2.5 2.5 0 012.456-1.296H15.5a2.5 2.5 0 110 5H13.24c-.973 0-1.908.49-2.456 1.296l-.755.966A2.5 2.5 0 017.574 15z" />
				</svg>
				<h3 class="text-lg font-medium text-neutral-900 mb-2">No hay notificaciones</h3>
				<p class="text-neutral-500">Todas las notificaciones están al día</p>
			</div>
		</Card>
	{:else}
		<!-- Notification List -->
		<div class="space-y-3">
			{#each filteredNotifications as notification}
				<Card 
					class="cursor-pointer transition-all duration-200 hover:shadow-md {getPriorityColor(notification.priority)}"
					class:opacity-60={notification.read}
					on:click={() => handleNotificationClick(notification)}
				>
					<div class="flex items-start space-x-3">
						<!-- Icon -->
						<div class="flex-shrink-0">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center"
								class:bg-blue-100={notification.type === 'booking'}
								class:bg-green-100={notification.type === 'payment'}
								class:bg-purple-100={notification.type === 'message'}
								class:bg-orange-100={notification.type === 'promotion'}
								class:bg-gray-100={notification.type === 'system'}
							>
								<svg class="w-5 h-5" 
									class:text-blue-600={notification.type === 'booking'}
									class:text-green-600={notification.type === 'payment'}
									class:text-purple-600={notification.type === 'message'}
									class:text-orange-600={notification.type === 'promotion'}
									class:text-gray-600={notification.type === 'system'}
									fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getNotificationIcon(notification.type)} />
								</svg>
							</div>
						</div>
						
						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-1">
								<h4 class="font-medium text-neutral-900 truncate">{notification.title}</h4>
								<div class="flex items-center space-x-2">
									{#if notification.aiScore}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
											IA: {Math.round(notification.aiScore * 100)}%
										</span>
									{/if}
									{#if !notification.read}
										<div class="w-2 h-2 bg-brand rounded-full"></div>
									{/if}
								</div>
							</div>
							
							<p class="text-neutral-600 text-sm mb-2 line-clamp-2">{notification.message}</p>
							
							<div class="flex items-center justify-between text-xs text-neutral-500">
								<span>{formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true, locale: es })}</span>
								
								<div class="flex items-center space-x-2">
									{#if notification.category}
										<span class="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">{notification.category}</span>
									{/if}
									
									<!-- Snooze dropdown -->
									<div class="relative">
										<button 
											type="button"
											class="p-1 rounded hover:bg-neutral-200 transition-colors"
											on:click|stopPropagation={() => {}}
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Notification Settings Modal -->
{#if showSettingsModal}
	<Modal 
		title="Configuración de Notificaciones IA" 
		on:close={() => showSettingsModal = false}
		size="lg"
	>
		<div class="space-y-6">
			<!-- AI Features -->
			<div>
				<h3 class="text-lg font-semibold text-neutral-900 mb-4">Funciones de IA</h3>
				<div class="space-y-3">
					<label class="flex items-center space-x-3">
						<input 
							type="checkbox" 
							bind:checked={$notificationSettings.aiPrioritization}
							class="rounded"
						/>
						<div>
							<div class="font-medium text-neutral-900">Priorización con IA</div>
							<div class="text-sm text-neutral-600">Ordena automáticamente por importancia</div>
						</div>
					</label>
					
					<label class="flex items-center space-x-3">
						<input 
							type="checkbox" 
							bind:checked={$notificationSettings.smartGrouping}
							class="rounded"
						/>
						<div>
							<div class="font-medium text-neutral-900">Agrupación Inteligente</div>
							<div class="text-sm text-neutral-600">Agrupa notificaciones relacionadas</div>
						</div>
					</label>
					
					<label class="flex items-center space-x-3">
						<input 
							type="checkbox" 
							bind:checked={$notificationSettings.personalization}
							class="rounded"
						/>
						<div>
							<div class="font-medium text-neutral-900">Personalización</div>
							<div class="text-sm text-neutral-600">Adapta contenido a tus preferencias</div>
						</div>
					</label>
				</div>
			</div>
			
			<!-- Quiet Hours -->
			<div>
				<h3 class="text-lg font-semibold text-neutral-900 mb-4">Horas de Silencio</h3>
				<label class="flex items-center space-x-3 mb-3">
					<input 
						type="checkbox" 
						bind:checked={$notificationSettings.quietHours.enabled}
						class="rounded"
					/>
					<span class="font-medium text-neutral-900">Activar horas de silencio</span>
				</label>
				
				{#if $notificationSettings.quietHours.enabled}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-neutral-700 mb-1">Desde</label>
							<input 
								type="time" 
								bind:value={$notificationSettings.quietHours.start}
								class="w-full p-2 border border-neutral-300 rounded-lg"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-neutral-700 mb-1">Hasta</label>
							<input 
								type="time" 
								bind:value={$notificationSettings.quietHours.end}
								class="w-full p-2 border border-neutral-300 rounded-lg"
							/>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Notification Types -->
			<div>
				<h3 class="text-lg font-semibold text-neutral-900 mb-4">Tipos de Notificación</h3>
				<div class="space-y-3">
					{#each Object.entries($notificationSettings.filters) as [type, enabled]}
						<label class="flex items-center space-x-3">
							<input 
								type="checkbox" 
								checked={enabled}
								class="rounded"
							/>
							<span class="font-medium text-neutral-900 capitalize">{type}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
		
		<div class="flex justify-end space-x-3 mt-6">
			<Button variant="secondary" on:click={() => showSettingsModal = false}>
				Cancelar
			</Button>
			<Button variant="primary">
				Guardar Configuración
			</Button>
		</div>
	</Modal>
{/if}

<style>
	.intelligent-notification-center {
		@apply max-w-4xl mx-auto;
	}
	
	/* Mobile optimization for Argentina market */
	@media (max-width: 768px) {
		.intelligent-notification-center {
			@apply px-2;
		}
		
		/* Larger touch targets */
		button, 
		select,
		input[type="checkbox"] {
			min-height: 44px;
		}
		
		/* Simplified layout for mobile */
		.flex.flex-col.sm\:flex-row {
			@apply space-y-3;
		}
	}
	
	/* Accessibility enhancements */
	.cursor-pointer:focus {
		@apply outline-none ring-2 ring-brand ring-offset-2;
	}
	
	/* Text clamp utility */
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>