<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	
	let loading = true;
	let stats = {
		totalBookings: 0,
		todayBookings: 0,
		totalServices: 0,
		monthlyRevenue: 0
	};

	let todayAppointments: any[] = [];
	let recentBookings: any[] = [];

	onMount(async () => {
		// TODO: Load real data from API
		// Simulate loading
		setTimeout(() => {
			stats = {
				totalBookings: 156,
				todayBookings: 8,
				totalServices: 12,
				monthlyRevenue: 87500
			};

			todayAppointments = [
				{
					id: 1,
					service: 'Corte + Barba',
					client: 'Juan Pérez',
					time: '10:00',
					price: 2500,
					status: 'confirmed'
				},
				{
					id: 2,
					service: 'Corte Clásico',
					client: 'Carlos González',
					time: '11:30',
					price: 1800,
					status: 'confirmed'
				},
				{
					id: 3,
					service: 'Tratamiento Capilar',
					client: 'Luis Martinez',
					time: '14:00',
					price: 3200,
					status: 'pending'
				}
			];

			loading = false;
		}, 1000);
	});

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS'
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Dashboard Profesional - BarberPro</title>
	<meta name="description" content="Gestiona tu negocio, servicios y reservas" />
</svelte:head>

<div class="container-responsive">
	{#if loading}
		<!-- Loading State -->
		<div class="space-y-6">
			<div class="skeleton skeleton-text" style="width: 300px; height: 32px;"></div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each Array(4) as _}
					<div class="card space-y-3">
						<div class="skeleton skeleton-text-sm"></div>
						<div class="skeleton skeleton-text" style="width: 80px; height: 28px;"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
			<div>
				<h1 class="text-3xl font-bold text-neutral-800">
					¡Hola, {$user?.firstName}!
				</h1>
				<p class="mt-1 text-neutral-600">
					Gestiona tu negocio y mantente al día con tus reservas
				</p>
			</div>
			<div class="mt-4 sm:mt-0 flex space-x-3">
				<a href="/dashboard/provider/services/new" class="btn btn-primary">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
					</svg>
					Nuevo Servicio
				</a>
				<a href="/dashboard/provider/schedule" class="btn btn-secondary">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					Horarios
				</a>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="card text-center">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Total Reservas</h3>
				<p class="text-2xl font-bold text-neutral-800">{stats.totalBookings}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Hoy</h3>
				<p class="text-2xl font-bold text-neutral-800">{stats.todayBookings}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Servicios</h3>
				<p class="text-2xl font-bold text-neutral-800">{stats.totalServices}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Ingresos del Mes</h3>
				<p class="text-2xl font-bold text-neutral-800">{formatCurrency(stats.monthlyRevenue)}</p>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Today's Appointments -->
			<div class="lg:col-span-2">
				<div class="card">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-xl font-semibold text-neutral-800">
							Citas de Hoy
						</h2>
						<a href="/dashboard/provider/bookings" class="text-sm text-brand hover:text-primary-700 font-medium">
							Ver todas
						</a>
					</div>

					{#if todayAppointments.length > 0}
						<div class="space-y-4">
							{#each todayAppointments as appointment}
								<div class="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
									<div class="w-12 h-12 bg-brand rounded-lg flex items-center justify-center text-white font-semibold">
										{appointment.client.split(' ').map((n: string) => n[0]).join('')}
									</div>
									
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between">
											<div>
												<h3 class="font-semibold text-neutral-800">{appointment.service}</h3>
												<p class="text-sm text-neutral-600">{appointment.client}</p>
												<p class="text-sm text-neutral-500">
													{appointment.time}
												</p>
											</div>
											<div class="text-right">
												<p class="font-semibold">{formatCurrency(appointment.price)}</p>
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
													class:bg-success-100={appointment.status === 'confirmed'}
													class:text-success-700={appointment.status === 'confirmed'}
													class:bg-warning-100={appointment.status === 'pending'}
													class:text-warning-700={appointment.status === 'pending'}
												>
													{appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
												</span>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<div class="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
								</svg>
							</div>
							<h3 class="text-lg font-medium text-neutral-800 mb-2">No tienes citas para hoy</h3>
							<p class="text-neutral-600">¡Perfecto momento para descansar o promocionar tus servicios!</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Quick Actions & Analytics -->
			<div class="space-y-8">
				<!-- Quick Actions -->
				<div class="card">
					<h2 class="text-xl font-semibold text-neutral-800 mb-4">
						Acciones Rápidas
					</h2>
					<div class="space-y-3">
						<a href="/dashboard/provider/services/new" class="w-full btn btn-secondary text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
							</svg>
							Nuevo Servicio
						</a>
						<a href="/dashboard/provider/schedule" class="w-full btn btn-ghost text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							Configurar Horarios
						</a>
						<a href="/dashboard/provider/clients" class="w-full btn btn-ghost text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
							</svg>
							Ver Clientes
						</a>
						<a href="/dashboard/provider/analytics" class="w-full btn btn-ghost text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
							</svg>
							Ver Análisis
						</a>
					</div>
				</div>

				<!-- Weekly Summary -->
				<div class="card">
					<h2 class="text-xl font-semibold text-neutral-800 mb-4">
						Resumen Semanal
					</h2>
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-sm text-neutral-600">Citas completadas</span>
							<span class="font-semibold">23</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-neutral-600">Ingresos</span>
							<span class="font-semibold">{formatCurrency(18500)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-neutral-600">Clientes nuevos</span>
							<span class="font-semibold">5</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-neutral-600">Calificación promedio</span>
							<div class="flex items-center space-x-1">
								<span class="font-semibold">4.8</span>
								<svg class="w-4 h-4 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Notifications -->
				<div class="card">
					<h2 class="text-xl font-semibold text-neutral-800 mb-4">
						Notificaciones
					</h2>
					<div class="space-y-3">
						<div class="p-3 bg-primary-50 border border-primary-200 rounded-lg">
							<p class="text-sm text-primary-800">
								<strong>Nueva reserva:</strong> Carlos González reservó para mañana a las 15:00
							</p>
						</div>
						<div class="p-3 bg-warning-50 border border-warning-200 rounded-lg">
							<p class="text-sm text-warning-800">
								<strong>Recordatorio:</strong> Actualiza tu horario para la próxima semana
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>