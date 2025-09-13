<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import Sortable from 'sortablejs';
	import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
	import { es } from 'date-fns/locale';

	const dispatch = createEventDispatcher();

	export let providerId: string;
	export let vertical: 'barber' | 'psychology' = 'barber';
	export let enableDragDrop = true;
	export let showTimeSlots = true;
	export let enableGroupBooking = false;

	interface BookingSlot {
		id: string;
		clientName: string;
		clientPhone: string;
		service: string;
		startTime: string;
		endTime: string;
		status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no-show';
		price: number;
		notes?: string;
		isGroup?: boolean;
		groupSize?: number;
		isPriority?: boolean;
		clientType?: 'new' | 'returning' | 'vip';
	}

	interface TimeSlot {
		time: string;
		available: boolean;
		bookings: BookingSlot[];
	}

	interface DaySchedule {
		date: string;
		dayName: string;
		timeSlots: TimeSlot[];
		totalBookings: number;
		totalRevenue: number;
	}

	let schedule: DaySchedule[] = [];
	let selectedDate = new Date();
	let weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
	let weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
	let currentWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	let loading = true;
	let error: string | null = null;
	let draggedBooking: BookingSlot | null = null;
	let showBookingModal = false;
	let selectedSlot: { date: string; time: string } | null = null;
	let sortableInstances: Sortable[] = [];

	// Business hours configuration
	const businessHours = {
		start: vertical === 'psychology' ? '09:00' : '08:00',
		end: vertical === 'psychology' ? '19:00' : '20:00',
		slotDuration: vertical === 'psychology' ? 60 : 30 // minutes
	};

	// Quick actions for different verticals
	const quickActions = vertical === 'psychology' 
		? ['Nueva Consulta', 'Consulta de Seguimiento', 'Sesión Grupal', 'Evaluación Inicial']
		: ['Corte Clásico', 'Corte + Barba', 'Solo Barba', 'Tratamiento Capilar'];

	onMount(() => {
		loadSchedule();
		initializeDragAndDrop();
	});

	onDestroy(() => {
		cleanupSortable();
	});

	async function loadSchedule() {
		try {
			loading = true;
			error = null;

			const startDate = format(weekStart, 'yyyy-MM-dd');
			const endDate = format(weekEnd, 'yyyy-MM-dd');

			const response = await fetch(
				`/api/providers/${providerId}/schedule?start=${startDate}&end=${endDate}`,
				{
					headers: {
						'Authorization': `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (!response.ok) {
				throw new Error('Error al cargar la agenda');
			}

			const data = await response.json();
			schedule = generateWeekSchedule(data.bookings);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
			console.error('Schedule loading error:', err);
		} finally {
			loading = false;
		}
	}

	function generateWeekSchedule(bookings: BookingSlot[]): DaySchedule[] {
		return currentWeek.map(date => {
			const dateStr = format(date, 'yyyy-MM-dd');
			const dayBookings = bookings.filter(booking => 
				booking.startTime.startsWith(dateStr)
			);

			const timeSlots = generateTimeSlots(dayBookings);
			
			return {
				date: dateStr,
				dayName: format(date, 'EEEE', { locale: es }),
				timeSlots,
				totalBookings: dayBookings.length,
				totalRevenue: dayBookings.reduce((sum, booking) => sum + booking.price, 0)
			};
		});
	}

	function generateTimeSlots(dayBookings: BookingSlot[]): TimeSlot[] {
		const slots: TimeSlot[] = [];
		const startHour = parseInt(businessHours.start.split(':')[0]);
		const endHour = parseInt(businessHours.end.split(':')[0]);
		const slotDuration = businessHours.slotDuration;

		for (let hour = startHour; hour < endHour; hour++) {
			for (let minute = 0; minute < 60; minute += slotDuration) {
				const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				const slotBookings = dayBookings.filter(booking => {
					const bookingTime = booking.startTime.substring(11, 16);
					return bookingTime === timeStr;
				});

				slots.push({
					time: timeStr,
					available: slotBookings.length === 0,
					bookings: slotBookings
				});
			}
		}

		return slots;
	}

	function initializeDragAndDrop() {
		if (!enableDragDrop) return;

		// Clean up existing instances
		cleanupSortable();

		// Initialize drag and drop for each day column
		schedule.forEach((day, dayIndex) => {
			const dayElement = document.querySelector(`[data-day="${day.date}"]`);
			if (dayElement) {
				const sortable = Sortable.create(dayElement as HTMLElement, {
					group: 'bookings',
					animation: 150,
					ghostClass: 'sortable-ghost',
					chosenClass: 'sortable-chosen',
					dragClass: 'sortable-drag',
					onStart: (evt) => {
						const bookingId = evt.item.dataset.bookingId;
						draggedBooking = findBookingById(bookingId || '');
					},
					onEnd: async (evt) => {
						const newDate = evt.to.dataset.day;
						const newTimeSlot = evt.to.dataset.timeSlot;
						
						if (draggedBooking && newDate && newTimeSlot) {
							await moveBooking(draggedBooking, newDate, newTimeSlot);
						}
						
						draggedBooking = null;
					}
				});
				
				sortableInstances.push(sortable);
			}
		});
	}

	function cleanupSortable() {
		sortableInstances.forEach(instance => instance.destroy());
		sortableInstances = [];
	}

	function findBookingById(id: string): BookingSlot | null {
		for (const day of schedule) {
			for (const slot of day.timeSlots) {
				const booking = slot.bookings.find(b => b.id === id);
				if (booking) return booking;
			}
		}
		return null;
	}

	async function moveBooking(booking: BookingSlot, newDate: string, newTime: string) {
		try {
			const newDateTime = `${newDate}T${newTime}:00`;
			
			const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					newStartTime: newDateTime,
					reason: 'Reagendado por el proveedor'
				})
			});

			if (!response.ok) {
				throw new Error('Error al mover la reserva');
			}

			// Reload schedule to reflect changes
			await loadSchedule();
			
			dispatch('booking-moved', {
				bookingId: booking.id,
				newDate,
				newTime
			});

		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al mover reserva';
			console.error('Move booking error:', err);
		}
	}

	async function updateBookingStatus(bookingId: string, newStatus: BookingSlot['status']) {
		try {
			const response = await fetch(`/api/bookings/${bookingId}/status`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (!response.ok) {
				throw new Error('Error al actualizar estado');
			}

			await loadSchedule();
			
			dispatch('booking-status-updated', {
				bookingId,
				newStatus
			});

		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al actualizar estado';
			console.error('Update booking status error:', err);
		}
	}

	function openBookingModal(date: string, time: string) {
		selectedSlot = { date, time };
		showBookingModal = true;
	}

	function closeBookingModal() {
		showBookingModal = false;
		selectedSlot = null;
	}

	function navigateWeek(direction: 'prev' | 'next') {
		const days = direction === 'next' ? 7 : -7;
		selectedDate = addDays(selectedDate, days);
		weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
		weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
		currentWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
		loadSchedule();
	}

	function getStatusColor(status: BookingSlot['status']): string {
		switch (status) {
			case 'confirmed': return 'bg-success-100 text-success-800 border-success-200';
			case 'pending': return 'bg-warning-100 text-warning-800 border-warning-200';
			case 'completed': return 'bg-primary-100 text-primary-800 border-primary-200';
			case 'cancelled': return 'bg-error-100 text-error-800 border-error-200';
			case 'no-show': return 'bg-neutral-100 text-neutral-800 border-neutral-200';
			default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
		}
	}

	function getClientTypeIcon(type: BookingSlot['clientType']): string {
		switch (type) {
			case 'new': return '🆕';
			case 'vip': return '⭐';
			case 'returning': return '🔄';
			default: return '';
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="space-y-6">
	<!-- Header with Navigation -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h2 class="text-2xl font-bold text-neutral-800">Gestión de Agenda</h2>
			<p class="text-neutral-600">
				{format(weekStart, 'dd MMM', { locale: es })} - {format(weekEnd, 'dd MMM yyyy', { locale: es })}
			</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button 
				class="btn btn-secondary btn-sm"
				on:click={() => navigateWeek('prev')}
			>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Anterior
			</button>
			
			<button 
				class="btn btn-secondary btn-sm"
				on:click={() => {
					selectedDate = new Date();
					weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
					weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
					currentWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
					loadSchedule();
				}}
			>
				Hoy
			</button>
			
			<button 
				class="btn btn-secondary btn-sm"
				on:click={() => navigateWeek('next')}
			>
				Siguiente
				<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Quick Actions Bar -->
	<div class="flex flex-wrap gap-2">
		{#each quickActions as action}
			<button class="btn btn-ghost btn-sm">
				+ {action}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="grid grid-cols-7 gap-4">
			{#each Array(7) as _}
				<div class="card">
					<div class="card-header">
						<div class="skeleton skeleton-text"></div>
					</div>
					<div class="card-body space-y-2">
						{#each Array(8) as _}
							<div class="skeleton h-16"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="card border-error-200 bg-error-50">
			<div class="card-body text-center">
				<svg class="w-12 h-12 text-error-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<h3 class="text-lg font-semibold text-error-800 mb-2">Error al cargar agenda</h3>
				<p class="text-error-600 mb-4">{error}</p>
				<button class="btn btn-primary" on:click={loadSchedule}>
					Reintentar
				</button>
			</div>
		</div>
	{:else}
		<!-- Weekly Schedule Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
			{#each schedule as day}
				<div class="card min-h-96">
					<!-- Day Header -->
					<div class="card-header bg-neutral-50">
						<div class="text-center">
							<h3 class="font-semibold text-neutral-800 capitalize">
								{day.dayName}
							</h3>
							<p class="text-sm text-neutral-600">
								{format(parseISO(day.date), 'd MMM', { locale: es })}
							</p>
							<div class="mt-2 flex justify-between text-xs">
								<span class="text-primary-600">{day.totalBookings} citas</span>
								<span class="text-success-600">{formatCurrency(day.totalRevenue)}</span>
							</div>
						</div>
					</div>

					<!-- Time Slots -->
					<div 
						class="card-body p-2 space-y-1 min-h-96"
						data-day={day.date}
					>
						{#each day.timeSlots as slot}
							<div 
								class="min-h-16 border border-neutral-200 rounded-lg p-2 transition-colors hover:bg-neutral-50"
								class:bg-success-50={slot.available}
								class:border-success-200={slot.available}
								data-time-slot={slot.time}
							>
								<!-- Time Label -->
								<div class="text-xs font-medium text-neutral-500 mb-1">
									{slot.time}
								</div>

								<!-- Available Slot -->
								{#if slot.available}
									<button 
										class="w-full h-12 border-2 border-dashed border-neutral-300 rounded-lg text-xs text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
										on:click={() => openBookingModal(day.date, slot.time)}
									>
										+ Agendar cita
									</button>
								{:else}
									<!-- Bookings in this slot -->
									{#each slot.bookings as booking}
										<div 
											class="booking-card w-full mb-1 p-2 rounded-lg border cursor-move {getStatusColor(booking.status)}"
											data-booking-id={booking.id}
											class:border-l-4={booking.isPriority}
											class:border-l-warning-500={booking.isPriority}
										>
											<div class="flex items-start justify-between">
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-1">
														<span class="text-xs font-medium truncate">
															{booking.clientName}
														</span>
														<span class="text-xs">
															{getClientTypeIcon(booking.clientType)}
														</span>
													</div>
													<div class="text-xs text-neutral-600 truncate">
														{booking.service}
													</div>
													{#if booking.isGroup}
														<div class="text-xs text-primary-600">
															Grupo: {booking.groupSize} personas
														</div>
													{/if}
													<div class="text-xs font-medium text-success-600">
														{formatCurrency(booking.price)}
													</div>
												</div>
												
												<!-- Quick Actions -->
												<div class="flex flex-col gap-1">
													<button 
														class="text-xs text-neutral-500 hover:text-success-600"
														on:click={() => updateBookingStatus(booking.id, 'completed')}
														title="Marcar completada"
													>
														✓
													</button>
													<button 
														class="text-xs text-neutral-500 hover:text-error-600"
														on:click={() => updateBookingStatus(booking.id, 'cancelled')}
														title="Cancelar"
													>
														✗
													</button>
												</div>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Weekly Summary -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="card">
				<div class="card-body text-center">
					<h3 class="text-sm font-medium text-neutral-600 mb-2">Total Semanal</h3>
					<div class="text-2xl font-bold text-neutral-800">
						{schedule.reduce((sum, day) => sum + day.totalBookings, 0)} citas
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="card-body text-center">
					<h3 class="text-sm font-medium text-neutral-600 mb-2">Ingresos Semanales</h3>
					<div class="text-2xl font-bold text-success-600">
						{formatCurrency(schedule.reduce((sum, day) => sum + day.totalRevenue, 0))}
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="card-body text-center">
					<h3 class="text-sm font-medium text-neutral-600 mb-2">Promedio Diario</h3>
					<div class="text-2xl font-bold text-primary-600">
						{(schedule.reduce((sum, day) => sum + day.totalBookings, 0) / 7).toFixed(1)} citas
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Booking Modal (placeholder for integration) -->
{#if showBookingModal && selectedSlot}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold">Nueva Cita</h3>
					<button 
						class="text-neutral-500 hover:text-neutral-700"
						on:click={closeBookingModal}
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<div class="text-sm text-neutral-600 mb-4">
					{format(parseISO(selectedSlot.date), 'EEEE, dd MMMM yyyy', { locale: es })} a las {selectedSlot.time}
				</div>
				
				<p class="text-sm text-neutral-500">
					Integrar con componente de booking aquí...
				</p>
				
				<div class="flex gap-2 mt-6">
					<button class="btn btn-primary flex-1">
						Crear Cita
					</button>
					<button class="btn btn-secondary" on:click={closeBookingModal}>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.booking-card {
		transition: all 0.2s ease;
	}
	
	.booking-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	:global(.sortable-ghost) {
		opacity: 0.4;
		transform: rotate(5deg);
	}
	
	:global(.sortable-chosen) {
		transform: scale(1.05);
		z-index: 1000;
	}
	
	:global(.sortable-drag) {
		opacity: 1;
		transform: rotate(5deg);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
	}
</style>