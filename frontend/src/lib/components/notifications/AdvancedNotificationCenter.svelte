<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { format, formatDistanceToNow, parseISO } from 'date-fns';
	import { es } from 'date-fns/locale';
	import { fly, fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let userId: string;
	export let userType: 'client' | 'provider' = 'client';
	export let vertical: 'barber' | 'psychology' = 'barber';
	export let enableRealTime = true;
	export let enablePushNotifications = true;
	export let maxNotifications = 50;

	interface NotificationAction {
		id: string;
		label: string;
		type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
		url?: string;
		handler?: () => void;
	}

	interface Notification {
		id: string;
		type: 'booking' | 'payment' | 'reminder' | 'promotion' | 'system' | 'message' | 'review' | 'alert';
		title: string;
		message: string;
		timestamp: string;
		read: boolean;
		priority: 'low' | 'normal' | 'high' | 'urgent';
		category: string;
		actions?: NotificationAction[];
		data?: {
			bookingId?: string;
			providerId?: string;
			clientId?: string;
			amount?: number;
			[key: string]: any;
		};
		image?: string;
		icon?: string;
		requiresAction?: boolean;
		expiresAt?: string;
	}

	let notifications: Notification[] = [];
	let unreadCount = 0;
	let isOpen = false;
	let loading = true;
	let error: string | null = null;

	// Filters and sorting
	let selectedFilter: 'all' | 'unread' | 'booking' | 'payment' | 'system' = 'all';
	let sortBy: 'newest' | 'oldest' | 'priority' = 'newest';

	// Real-time connection
	let eventSource: EventSource | null = null;
	let reconnectTimeout: NodeJS.Timeout | null = null;

	// Push notifications
	let pushSubscription: PushSubscription | null = null;

	// Auto-refresh for non-real-time updates
	let refreshInterval: NodeJS.Timeout | null = null;

	onMount(async () => {
		await loadNotifications();
		
		if (enableRealTime) {
			setupRealTimeConnection();
		} else {
			// Fallback to polling
			refreshInterval = setInterval(loadNotifications, 30000);
		}

		if (enablePushNotifications) {
			await setupPushNotifications();
		}

		// Setup keyboard shortcuts
		document.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		closeRealTimeConnection();
		if (refreshInterval) clearInterval(refreshInterval);
		if (reconnectTimeout) clearTimeout(reconnectTimeout);
		document.removeEventListener('keydown', handleKeyDown);
	});

	async function loadNotifications() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`/api/notifications?limit=${maxNotifications}`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Error al cargar notificaciones');
			}

			const data = await response.json();
			notifications = data.notifications;
			unreadCount = notifications.filter(n => !n.read).length;

		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
			console.error('Notifications loading error:', err);
		} finally {
			loading = false;
		}
	}

	function setupRealTimeConnection() {
		const token = localStorage.getItem('token');
		if (!token) return;

		eventSource = new EventSource(`/api/notifications/stream?token=${token}`);

		eventSource.onmessage = (event) => {
			const notification: Notification = JSON.parse(event.data);
			addNotification(notification);
		};

		eventSource.onerror = () => {
			console.warn('SSE connection error, attempting to reconnect...');
			closeRealTimeConnection();
			
			reconnectTimeout = setTimeout(() => {
				setupRealTimeConnection();
			}, 5000);
		};
	}

	function closeRealTimeConnection() {
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
	}

	async function setupPushNotifications() {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			console.warn('Push notifications not supported');
			return;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
			});

			pushSubscription = subscription;

			// Send subscription to server
			await fetch('/api/notifications/push-subscription', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(subscription)
			});

		} catch (error) {
			console.error('Push notification setup failed:', error);
		}
	}

	function urlBase64ToUint8Array(base64String: string) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	function addNotification(notification: Notification) {
		// Add to beginning of array
		notifications = [notification, ...notifications.slice(0, maxNotifications - 1)];
		
		if (!notification.read) {
			unreadCount++;
		}

		// Show browser notification if permission granted
		if (Notification.permission === 'granted' && !document.hasFocus()) {
			new Notification(notification.title, {
				body: notification.message,
				icon: notification.icon || '/icons/notification-icon.png',
				tag: notification.id
			});
		}

		dispatch('notification-received', notification);
	}

	async function markAsRead(notificationId: string) {
		try {
			const response = await fetch(`/api/notifications/${notificationId}/read`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				notifications = notifications.map(n => 
					n.id === notificationId ? { ...n, read: true } : n
				);
				unreadCount = Math.max(0, unreadCount - 1);
			}

		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	}

	async function markAllAsRead() {
		try {
			const response = await fetch('/api/notifications/mark-all-read', {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				notifications = notifications.map(n => ({ ...n, read: true }));
				unreadCount = 0;
			}

		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	}

	async function deleteNotification(notificationId: string) {
		try {
			const response = await fetch(`/api/notifications/${notificationId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const deletedNotification = notifications.find(n => n.id === notificationId);
				notifications = notifications.filter(n => n.id !== notificationId);
				
				if (deletedNotification && !deletedNotification.read) {
					unreadCount = Math.max(0, unreadCount - 1);
				}
			}

		} catch (error) {
			console.error('Error deleting notification:', error);
		}
	}

	async function executeAction(notification: Notification, action: NotificationAction) {
		try {
			if (action.url) {
				window.location.href = action.url;
				return;
			}

			if (action.handler) {
				action.handler();
				return;
			}

			// Default API action
			const response = await fetch(`/api/notifications/${notification.id}/action`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ actionId: action.id })
			});

			if (response.ok) {
				// Mark notification as read after action
				await markAsRead(notification.id);
			}

		} catch (error) {
			console.error('Error executing notification action:', error);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Escape to close
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
		}
		
		// Ctrl/Cmd + Shift + N to open notifications
		if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
			event.preventDefault();
			isOpen = !isOpen;
		}
	}

	function getFilteredNotifications(): Notification[] {
		let filtered = notifications;

		// Apply type filter
		if (selectedFilter !== 'all') {
			if (selectedFilter === 'unread') {
				filtered = filtered.filter(n => !n.read);
			} else {
				filtered = filtered.filter(n => n.type === selectedFilter);
			}
		}

		// Apply sorting
		filtered.sort((a, b) => {
			if (sortBy === 'priority') {
				const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
				const aPriority = priorityOrder[a.priority];
				const bPriority = priorityOrder[b.priority];
				if (aPriority !== bPriority) {
					return bPriority - aPriority;
				}
			}
			
			const aTime = new Date(a.timestamp).getTime();
			const bTime = new Date(b.timestamp).getTime();
			
			return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
		});

		return filtered;
	}

	function getNotificationIcon(type: Notification['type']): string {
		switch (type) {
			case 'booking': return '📅';
			case 'payment': return '💳';
			case 'reminder': return '⏰';
			case 'promotion': return '🎉';
			case 'system': return '⚙️';
			case 'message': return '💬';
			case 'review': return '⭐';
			case 'alert': return '⚠️';
			default: return '🔔';
		}
	}

	function getPriorityColor(priority: Notification['priority']): string {
		switch (priority) {
			case 'urgent': return 'border-l-error-500 bg-error-50';
			case 'high': return 'border-l-warning-500 bg-warning-50';
			case 'normal': return 'border-l-primary-500 bg-white';
			case 'low': return 'border-l-neutral-300 bg-neutral-50';
			default: return 'border-l-neutral-300 bg-white';
		}
	}

	function getActionButtonClass(type: NotificationAction['type']): string {
		switch (type) {
			case 'primary': return 'btn-primary btn-sm';
			case 'secondary': return 'btn-secondary btn-sm';
			case 'success': return 'btn-success btn-sm';
			case 'warning': return 'btn-ghost btn-sm text-warning-700';
			case 'danger': return 'btn-ghost btn-sm text-error-700';
			default: return 'btn-secondary btn-sm';
		}
	}
</script>

<!-- Notification Bell Button -->
<div class="relative">
	<button
		type="button"
		class="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors"
		on:click={() => isOpen = !isOpen}
		aria-label="Notificaciones"
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.403-3.403A3.01 3.01 0 0116 12V6a6 6 0 10-12 0v6c0 .696-.244 1.375-.597 1.901L0 17h5m10 0v1a4 4 0 11-8 0v-1m8 0H7" />
		</svg>
		
		{#if unreadCount > 0}
			<span 
				class="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-error-600 rounded-full min-w-5 h-5"
				in:fly={{ y: -10, duration: 200 }}
			>
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	<!-- Notification Panel -->
	{#if isOpen}
		<div 
			class="absolute right-0 top-full mt-2 w-96 max-w-screen-sm bg-white border border-neutral-200 rounded-xl shadow-strong z-50 max-h-96 overflow-hidden"
			transition:fly={{ y: -10, duration: 200 }}
		>
			<!-- Header -->
			<div class="border-b border-neutral-200 p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-lg font-semibold text-neutral-800">
						Notificaciones
					</h3>
					<div class="flex items-center gap-2">
						{#if unreadCount > 0}
							<button
								class="text-xs text-primary-600 hover:text-primary-700 font-medium"
								on:click={markAllAsRead}
							>
								Marcar todas como leídas
							</button>
						{/if}
						<button
							class="text-neutral-500 hover:text-neutral-700"
							on:click={() => isOpen = false}
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Filters -->
				<div class="flex items-center gap-2 text-xs">
					<select bind:value={selectedFilter} class="form-input py-1 text-xs">
						<option value="all">Todas</option>
						<option value="unread">No leídas</option>
						<option value="booking">Reservas</option>
						<option value="payment">Pagos</option>
						<option value="system">Sistema</option>
					</select>
					
					<select bind:value={sortBy} class="form-input py-1 text-xs">
						<option value="newest">Más recientes</option>
						<option value="oldest">Más antiguas</option>
						<option value="priority">Por prioridad</option>
					</select>
				</div>
			</div>

			<!-- Notifications List -->
			<div class="max-h-80 overflow-y-auto">
				{#if loading}
					<div class="p-4 space-y-3">
						{#each Array(3) as _}
							<div class="flex gap-3">
								<div class="skeleton skeleton-avatar"></div>
								<div class="flex-1 space-y-2">
									<div class="skeleton skeleton-text"></div>
									<div class="skeleton skeleton-text-sm"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if error}
					<div class="p-4 text-center">
						<svg class="w-8 h-8 text-error-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-sm text-error-600">{error}</p>
						<button class="btn btn-primary btn-sm mt-2" on:click={loadNotifications}>
							Reintentar
						</button>
					</div>
				{:else}
					{@const filteredNotifications = getFilteredNotifications()}
					
					{#if filteredNotifications.length === 0}
						<div class="p-8 text-center">
							<div class="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
								<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.403-3.403A3.01 3.01 0 0116 12V6a6 6 0 10-12 0v6c0 .696-.244 1.375-.597 1.901L0 17h5" />
								</svg>
							</div>
							<p class="text-sm text-neutral-600">No hay notificaciones</p>
						</div>
					{:else}
						{#each filteredNotifications as notification (notification.id)}
							<div 
								class="border-l-4 p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors {getPriorityColor(notification.priority)}"
								class:opacity-60={notification.read}
								in:fly={{ x: -20, duration: 200 }}
							>
								<div class="flex gap-3">
									<!-- Icon/Image -->
									<div class="flex-shrink-0">
										{#if notification.image}
											<img 
												src={notification.image} 
												alt=""
												class="w-10 h-10 rounded-full object-cover"
											/>
										{:else}
											<div class="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-lg">
												{notification.icon || getNotificationIcon(notification.type)}
											</div>
										{/if}
									</div>

									<!-- Content -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<h4 class="text-sm font-medium text-neutral-800 leading-tight">
												{notification.title}
											</h4>
											
											<div class="flex items-center gap-1">
												{#if !notification.read}
													<div class="w-2 h-2 bg-primary-600 rounded-full"></div>
												{/if}
												
												<button
													class="text-neutral-400 hover:text-neutral-600 p-1"
													on:click={() => deleteNotification(notification.id)}
													title="Eliminar notificación"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
													</svg>
												</button>
											</div>
										</div>

										<p class="text-sm text-neutral-600 mt-1 leading-relaxed">
											{notification.message}
										</p>

										<div class="flex items-center justify-between mt-2">
											<span class="text-xs text-neutral-500">
												{formatDistanceToNow(parseISO(notification.timestamp), { 
													addSuffix: true, 
													locale: es 
												})}
											</span>
											
											{#if notification.category}
												<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-700">
													{notification.category}
												</span>
											{/if}
										</div>

										<!-- Actions -->
										{#if notification.actions && notification.actions.length > 0}
											<div class="flex flex-wrap gap-2 mt-3">
												{#each notification.actions as action}
													<button
														class="{getActionButtonClass(action.type)}"
														on:click={() => executeAction(notification, action)}
													>
														{action.label}
													</button>
												{/each}
											</div>
										{/if}

										<!-- Mark as read button for unread notifications -->
										{#if !notification.read}
											<button
												class="text-xs text-primary-600 hover:text-primary-700 mt-2"
												on:click={() => markAsRead(notification.id)}
											>
												Marcar como leída
											</button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			{#if !loading && !error && notifications.length > 0}
				<div class="border-t border-neutral-200 p-3 bg-neutral-50">
					<a 
						href="/notifications" 
						class="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
						on:click={() => isOpen = false}
					>
						Ver todas las notificaciones
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
	<div 
		class="fixed inset-0 z-40"
		on:click={() => isOpen = false}
		aria-hidden="true"
	></div>
{/if}