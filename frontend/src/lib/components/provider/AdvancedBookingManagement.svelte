<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import type { Booking, TimeSlot, Service, ConflictResolution } from '$lib/types';

	export let providerId: string;

	const dispatch = createEventDispatcher();

	// Booking management state
	const bookings = writable<Booking[]>([]);
	const availableSlots = writable<TimeSlot[]>([]);
	const services = writable<Service[]>([]);
	const conflicts = writable<ConflictResolution[]>([]);
	const loading = writable(false);

	// Calendar view state
	const currentView = writable<'day' | 'week' | 'month'>('week');
	const selectedDate = writable(new Date());
	const selectedBooking = writable<Booking | null>(null);

	// Intelligent scheduling engine
	class IntelligentSchedulingEngine {
		private providerId: string;
		private bookingRules: any = {};
		private mlModel: any = null;

		constructor(providerId: string) {
			this.providerId = providerId;
		}

		async initialize() {
			await this.loadBookingRules();
			await this.initializeMlModel();
			await this.loadBookingData();
		}

		private async loadBookingRules() {
			try {
				const response = await fetch(`/api/providers/${this.providerId}/booking-rules`);
				if (response.ok) {
					this.bookingRules = await response.json();
					console.log('[IntelligentScheduling] Booking rules loaded');
				}
			} catch (error) {
				console.error('[IntelligentScheduling] Failed to load booking rules:', error);
			}
		}

		private async initializeMlModel() {
			try {
				// Load ML model for booking optimization
				if (typeof window !== 'undefined' && (window as any).tf) {
					const tf = (window as any).tf;
					this.mlModel = await tf.loadLayersModel('/models/scheduling-optimization.json');
					console.log('[IntelligentScheduling] ML model initialized');
				}
			} catch (error) {
				console.error('[IntelligentScheduling] ML model loading failed:', error);
			}
		}

		async loadBookingData() {
			loading.set(true);
			try {
				const date = $selectedDate;
				const startDate = this.getViewStartDate(date, $currentView);
				const endDate = this.getViewEndDate(startDate, $currentView);

				const [bookingsRes, slotsRes, servicesRes] = await Promise.all([
					fetch(`/api/providers/${this.providerId}/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
					fetch(`/api/providers/${this.providerId}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
					fetch(`/api/providers/${this.providerId}/services`)
				]);

				if (bookingsRes.ok) {
					const bookingData = await bookingsRes.json();
					bookings.set(bookingData.bookings || []);
				}

				if (slotsRes.ok) {
					const slotsData = await slotsRes.json();
					availableSlots.set(slotsData.slots || []);
				}

				if (servicesRes.ok) {
					const servicesData = await servicesRes.json();
					services.set(servicesData.services || []);
				}

				// Check for conflicts
				await this.detectConflicts();

			} catch (error) {
				console.error('[IntelligentScheduling] Failed to load booking data:', error);
			} finally {
				loading.set(false);
			}
		}

		private getViewStartDate(date: Date, view: string): Date {
			const start = new Date(date);

			switch (view) {
				case 'day':
					start.setHours(0, 0, 0, 0);
					break;
				case 'week':
					const dayOfWeek = start.getDay();
					start.setDate(start.getDate() - dayOfWeek);
					start.setHours(0, 0, 0, 0);
					break;
				case 'month':
					start.setDate(1);
					start.setHours(0, 0, 0, 0);
					break;
			}

			return start;
		}

		private getViewEndDate(startDate: Date, view: string): Date {
			const end = new Date(startDate);

			switch (view) {
				case 'day':
					end.setDate(end.getDate() + 1);
					break;
				case 'week':
					end.setDate(end.getDate() + 7);
					break;
				case 'month':
					end.setMonth(end.getMonth() + 1);
					break;
			}

			return end;
		}

		private async detectConflicts() {
			try {
				const response = await fetch(`/api/providers/${this.providerId}/conflicts`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						bookings: $bookings,
						availableSlots: $availableSlots,
						rules: this.bookingRules
					})
				});

				if (response.ok) {
					const conflictData = await response.json();
					conflicts.set(conflictData.conflicts || []);
				}
			} catch (error) {
				console.error('[IntelligentScheduling] Conflict detection failed:', error);
			}
		}

		async optimizeSchedule(): Promise<any> {
			try {
				const response = await fetch(`/api/providers/${this.providerId}/schedule-optimization`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						currentBookings: $bookings,
						availableSlots: $availableSlots,
						services: $services,
						preferences: this.bookingRules,
						date: $selectedDate
					})
				});

				if (response.ok) {
					const optimization = await response.json();
					return optimization;
				}
			} catch (error) {
				console.error('[IntelligentScheduling] Schedule optimization failed:', error);
			}

			return null;
		}

		async resolveConflict(conflictId: string, resolution: 'reschedule' | 'cancel' | 'split'): Promise<boolean> {
			try {
				const response = await fetch(`/api/providers/${this.providerId}/conflicts/${conflictId}/resolve`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						resolution,
						timestamp: Date.now()
					})
				});

				if (response.ok) {
					await this.loadBookingData(); // Refresh data
					return true;
				}
			} catch (error) {
				console.error('[IntelligentScheduling] Conflict resolution failed:', error);
			}

			return false;
		}

		async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<boolean> {
			try {
				const response = await fetch(`/api/bookings/${bookingId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updates)
				});

				if (response.ok) {
					await this.loadBookingData(); // Refresh data
					dispatch('booking-updated', { bookingId, updates });
					return true;
				}
			} catch (error) {
				console.error('[IntelligentScheduling] Booking update failed:', error);
			}

			return false;
		}
	}

	let schedulingEngine: IntelligentSchedulingEngine;

	// Computed values
	const calendarData = derived(
		[bookings, availableSlots, selectedDate, currentView],
		([$bookings, $slots, $date, $view]) => {
			return this.generateCalendarData($bookings, $slots, $date, $view);
		}
	);

	const bookingStats = derived(
		bookings,
		($bookings) => {
			const today = new Date();
			const todayBookings = $bookings.filter(b =>
				new Date(b.scheduledAt).toDateString() === today.toDateString()
			);

			return {
				total: $bookings.length,
				today: todayBookings.length,
				confirmed: $bookings.filter(b => b.status === 'confirmed').length,
				pending: $bookings.filter(b => b.status === 'pending').length,
				cancelled: $bookings.filter(b => b.status === 'cancelled').length
			};
		}
	);

	function generateCalendarData(bookings: Booking[], slots: TimeSlot[], date: Date, view: string) {
		const startDate = schedulingEngine?.getViewStartDate(date, view) || new Date();
		const endDate = schedulingEngine?.getViewEndDate(startDate, view) || new Date();

		// Generate calendar grid based on view
		const calendarDays = [];
		const currentDate = new Date(startDate);

		while (currentDate < endDate) {
			const dayBookings = bookings.filter(b =>
				new Date(b.scheduledAt).toDateString() === currentDate.toDateString()
			);

			const daySlots = slots.filter(s =>
				new Date(s.startTime).toDateString() === currentDate.toDateString()
			);

			calendarDays.push({
				date: new Date(currentDate),
				bookings: dayBookings,
				availableSlots: daySlots,
				isToday: currentDate.toDateString() === new Date().toDateString()
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}

		return calendarDays;
	}

	// Event handlers
	function handleViewChange(newView: 'day' | 'week' | 'month') {
		currentView.set(newView);
		schedulingEngine.loadBookingData();
	}

	function handleDateChange(increment: number) {
		selectedDate.update(date => {
			const newDate = new Date(date);

			switch ($currentView) {
				case 'day':
					newDate.setDate(newDate.getDate() + increment);
					break;
				case 'week':
					newDate.setDate(newDate.getDate() + (increment * 7));
					break;
				case 'month':
					newDate.setMonth(newDate.getMonth() + increment);
					break;
			}

			return newDate;
		});

		schedulingEngine.loadBookingData();
	}

	function handleBookingSelect(booking: Booking) {
		selectedBooking.set(booking);
	}

	function handleBookingUpdate(booking: Booking, field: string, value: any) {
		schedulingEngine.updateBooking(booking.id, { [field]: value });
	}

	async function handleOptimizeSchedule() {
		loading.set(true);
		try {
			const optimization = await schedulingEngine.optimizeSchedule();
			if (optimization) {
				dispatch('schedule-optimized', optimization);
			}
		} finally {
			loading.set(false);
		}
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('es-AR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	function getBookingStatusColor(status: string): string {
		switch (status) {
			case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
			case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
			case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
			default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
		}
	}

	function getBookingStatusLabel(status: string): string {
		switch (status) {
			case 'confirmed': return 'Confirmada';
			case 'pending': return 'Pendiente';
			case 'cancelled': return 'Cancelada';
			case 'completed': return 'Completada';
			default: return 'Desconocido';
		}
	}

	onMount(async () => {
		schedulingEngine = new IntelligentSchedulingEngine(providerId);
		await schedulingEngine.initialize();
	});
</script>

<div class="advanced-booking-management">
	<!-- Header Controls -->
	<div class="booking-header bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
		<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
			<div class="mb-4 lg:mb-0">
				<h1 class="text-2xl font-bold text-neutral-800 mb-2">Gestión Inteligente de Reservas</h1>
				<div class="flex items-center space-x-6 text-sm text-neutral-600">
					<span>Total: <strong class="text-neutral-800">{$bookingStats.total}</strong></span>
					<span>Hoy: <strong class="text-neutral-800">{$bookingStats.today}</strong></span>
					<span>Confirmadas: <strong class="text-green-600">{$bookingStats.confirmed}</strong></span>
					<span>Pendientes: <strong class="text-yellow-600">{$bookingStats.pending}</strong></span>
				</div>
			</div>

			<div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
				<!-- View Selector -->
				<div class="view-selector bg-neutral-100 rounded-lg p-1 flex">
					{#each ['day', 'week', 'month'] as view}
						<button
							class="px-3 py-1 rounded text-sm font-medium transition-colors"
							class:bg-white={$currentView === view}
							class:shadow-sm={$currentView === view}
							class:text-brand={$currentView === view}
							class:text-neutral-600={$currentView !== view}
							on:click={() => handleViewChange(view)}
						>
							{#if view === 'day'}Día{:else if view === 'week'}Semana{:else}Mes{/if}
						</button>
					{/each}
				</div>

				<!-- Date Navigation -->
				<div class="date-navigation flex items-center space-x-2">
					<button
						class="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
						on:click={() => handleDateChange(-1)}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>

					<div class="text-lg font-medium text-neutral-800 min-w-[200px] text-center">
						{#if $currentView === 'day'}
							{$selectedDate.toLocaleDateString('es-AR', {
								weekday: 'long',
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						{:else if $currentView === 'week'}
							Semana del {$selectedDate.toLocaleDateString('es-AR', {
								day: 'numeric',
								month: 'short'
							})}
						{:else}
							{$selectedDate.toLocaleDateString('es-AR', {
								month: 'long',
								year: 'numeric'
							})}
						{/if}
					</div>

					<button
						class="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
						on:click={() => handleDateChange(1)}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>

				<!-- Actions -->
				<div class="flex space-x-2">
					<button
						class="btn-sm btn-outline"
						on:click={handleOptimizeSchedule}
						disabled={$loading}
					>
						{#if $loading}
							<div class="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2"></div>
						{:else}
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						{/if}
						Optimizar
					</button>

					<button class="btn-sm btn-primary">
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Nueva Reserva
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Conflict Alerts -->
	{#if $conflicts.length > 0}
		<div class="conflicts-alert bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
			<div class="flex items-start">
				<svg class="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				<div>
					<h3 class="text-sm font-medium text-red-800 mb-1">
						Conflictos de Programación Detectados ({$conflicts.length})
					</h3>
					<div class="space-y-2">
						{#each $conflicts.slice(0, 3) as conflict}
							<div class="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
								<div class="text-sm text-red-700">
									<strong>{conflict.title}</strong> - {conflict.description}
								</div>
								<div class="flex space-x-2">
									<button
										class="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
										on:click={() => schedulingEngine.resolveConflict(conflict.id, 'reschedule')}
									>
										Reprogramar
									</button>
									<button
										class="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
										on:click={() => schedulingEngine.resolveConflict(conflict.id, 'cancel')}
									>
										Cancelar
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Calendar View -->
	<div class="calendar-container bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
		{#if $loading}
			<div class="loading-calendar p-8">
				<div class="animate-pulse">
					<div class="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
					<div class="space-y-3">
						{#each Array(7) as _}
							<div class="h-16 bg-neutral-200 rounded"></div>
						{/each}
					</div>
				</div>
			</div>
		{:else if $currentView === 'day'}
			<!-- Day View -->
			<div class="day-view">
				<div class="day-header bg-neutral-50 p-4 border-b border-neutral-200">
					<h2 class="text-lg font-semibold text-neutral-800">
						{$selectedDate.toLocaleDateString('es-AR', {
							weekday: 'long',
							day: 'numeric',
							month: 'long'
						})}
					</h2>
					<p class="text-sm text-neutral-600 mt-1">
						{$calendarData[0]?.bookings.length || 0} reservas programadas
					</p>
				</div>

				<div class="day-schedule p-4">
					{#if $calendarData[0]?.bookings.length > 0}
						<div class="space-y-3">
							{#each $calendarData[0].bookings as booking}
								<div
									class="booking-item p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all {getBookingStatusColor(booking.status)}"
									on:click={() => handleBookingSelect(booking)}
								>
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="flex items-center space-x-3 mb-2">
												<span class="text-sm font-medium">
													{formatTime(new Date(booking.scheduledAt))}
												</span>
												<span class="text-xs px-2 py-1 bg-white rounded-full">
													{getBookingStatusLabel(booking.status)}
												</span>
											</div>
											<h4 class="font-semibold text-neutral-800">{booking.serviceName}</h4>
											<p class="text-sm text-neutral-600">{booking.customerName}</p>
										</div>
										<div class="text-right">
											<div class="font-semibold text-neutral-800">
												{new Intl.NumberFormat('es-AR', {
													style: 'currency',
													currency: 'ARS'
												}).format(booking.price)}
											</div>
											<div class="text-sm text-neutral-600">{booking.duration}min</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-day text-center py-12">
							<svg class="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<h3 class="text-lg font-medium text-neutral-600 mb-2">No hay reservas para hoy</h3>
							<p class="text-neutral-500">¡Perfecto día para descansar o promocionar tus servicios!</p>
						</div>
					{/if}
				</div>
			</div>
		{:else if $currentView === 'week'}
			<!-- Week View -->
			<div class="week-view">
				<div class="week-header grid grid-cols-8 bg-neutral-50 border-b border-neutral-200">
					<div class="p-4"></div>
					{#each $calendarData as day}
						<div class="p-4 text-center border-l border-neutral-200">
							<div class="text-sm font-medium text-neutral-600">
								{day.date.toLocaleDateString('es-AR', { weekday: 'short' })}
							</div>
							<div
								class="text-lg font-semibold mt-1"
								class:text-brand={day.isToday}
								class:text-neutral-800={!day.isToday}
							>
								{day.date.getDate()}
							</div>
						</div>
					{/each}
				</div>

				<div class="week-grid grid grid-cols-8 min-h-[400px]">
					<div class="time-column bg-neutral-50 p-2">
						{#each Array(12) as _, hour}
							<div class="h-12 flex items-center text-xs text-neutral-500 border-b border-neutral-100">
								{String(9 + hour).padStart(2, '0')}:00
							</div>
						{/each}
					</div>

					{#each $calendarData as day}
						<div class="day-column border-l border-neutral-200 p-1">
							{#each day.bookings as booking}
								<div
									class="booking-block mb-1 p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow {getBookingStatusColor(booking.status)}"
									style="height: {(booking.duration / 60) * 48}px; min-height: 40px;"
									on:click={() => handleBookingSelect(booking)}
								>
									<div class="font-medium truncate">{booking.serviceName}</div>
									<div class="text-xs truncate opacity-75">{booking.customerName}</div>
									<div class="text-xs">{formatTime(new Date(booking.scheduledAt))}</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Month View -->
			<div class="month-view">
				<div class="month-header grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
					{#each ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as day}
						<div class="p-4 text-center text-sm font-medium text-neutral-600">
							{day}
						</div>
					{/each}
				</div>

				<div class="month-grid grid grid-cols-7">
					{#each $calendarData as day}
						<div
							class="day-cell aspect-square border-b border-r border-neutral-200 p-2 hover:bg-neutral-50 transition-colors"
							class:bg-brand-50={day.isToday}
						>
							<div
								class="text-sm font-medium mb-1"
								class:text-brand={day.isToday}
								class:text-neutral-800={!day.isToday}
							>
								{day.date.getDate()}
							</div>

							{#if day.bookings.length > 0}
								<div class="space-y-1">
									{#each day.bookings.slice(0, 3) as booking}
										<div
											class="text-xs p-1 rounded truncate cursor-pointer {getBookingStatusColor(booking.status)}"
											on:click={() => handleBookingSelect(booking)}
											title="{booking.serviceName} - {booking.customerName}"
										>
											{formatTime(new Date(booking.scheduledAt))} {booking.serviceName}
										</div>
									{/each}

									{#if day.bookings.length > 3}
										<div class="text-xs text-neutral-500">+{day.bookings.length - 3} más</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Booking Details Modal -->
	{#if $selectedBooking}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
				<div class="p-6 border-b border-neutral-200">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold text-neutral-800">Detalles de la Reserva</h2>
						<button
							class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
							on:click={() => selectedBooking.set(null)}
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<div class="p-6 space-y-4">
					<div>
						<label class="text-sm font-medium text-neutral-700">Servicio</label>
						<div class="text-lg font-semibold text-neutral-800">{$selectedBooking.serviceName}</div>
					</div>

					<div>
						<label class="text-sm font-medium text-neutral-700">Cliente</label>
						<div class="text-lg text-neutral-800">{$selectedBooking.customerName}</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-sm font-medium text-neutral-700">Fecha y Hora</label>
							<div class="text-neutral-800">
								{new Date($selectedBooking.scheduledAt).toLocaleDateString('es-AR', {
									weekday: 'long',
									day: 'numeric',
									month: 'long'
								})}
								<br />
								{formatTime(new Date($selectedBooking.scheduledAt))}
							</div>
						</div>

						<div>
							<label class="text-sm font-medium text-neutral-700">Duración</label>
							<div class="text-neutral-800">{$selectedBooking.duration} minutos</div>
						</div>
					</div>

					<div>
						<label class="text-sm font-medium text-neutral-700">Estado</label>
						<select
							value={$selectedBooking.status}
							on:change={(e) => handleBookingUpdate($selectedBooking, 'status', e.target.value)}
							class="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-50 focus:border-brand outline-none"
						>
							<option value="pending">Pendiente</option>
							<option value="confirmed">Confirmada</option>
							<option value="cancelled">Cancelada</option>
							<option value="completed">Completada</option>
						</select>
					</div>

					<div>
						<label class="text-sm font-medium text-neutral-700">Precio</label>
						<div class="text-lg font-semibold text-neutral-800">
							{new Intl.NumberFormat('es-AR', {
								style: 'currency',
								currency: 'ARS'
							}).format($selectedBooking.price)}
						</div>
					</div>

					{#if $selectedBooking.notes}
						<div>
							<label class="text-sm font-medium text-neutral-700">Notas</label>
							<div class="text-neutral-800 bg-neutral-50 p-3 rounded-lg">
								{$selectedBooking.notes}
							</div>
						</div>
					{/if}
				</div>

				<div class="p-6 border-t border-neutral-200 flex justify-end space-x-3">
					<button
						class="btn-sm btn-outline"
						on:click={() => selectedBooking.set(null)}
					>
						Cerrar
					</button>
					<button class="btn-sm btn-primary">
						Editar Reserva
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.booking-block {
		position: relative;
		overflow: hidden;
	}

	.booking-item:hover {
		transform: translateX(4px);
	}

	.day-cell:hover .booking-block {
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.week-grid {
			grid-template-columns: 60px repeat(7, 1fr);
		}

		.month-view .text-xs {
			font-size: 0.625rem;
		}

		.booking-header {
			padding: 1rem;
		}

		.booking-header h1 {
			font-size: 1.25rem;
		}
	}
</style>