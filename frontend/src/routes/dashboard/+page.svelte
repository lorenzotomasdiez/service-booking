<script lang="ts">
	import { onMount } from 'svelte';
	
	let loading = true;
	let user = {
		name: 'Juan Pérez',
		avatar: '',
		stats: {
			totalBookings: 24,
			upcomingBookings: 3,
			favoriteProviders: 5,
			totalSpent: 12500
		}
	};

	let upcomingBookings = [
		{
			id: 1,
			service: 'Corte + Barba',
			provider: 'Barbería El Corte',
			date: '2024-03-15',
			time: '14:30',
			price: 2500,
			status: 'confirmed'
		},
		{
			id: 2,
			service: 'Corte Clásico',
			provider: 'Estilo Premium',
			date: '2024-03-20',
			time: '16:00',
			price: 1800,
			status: 'pending'
		},
		{
			id: 3,
			service: 'Tratamiento Capilar',
			provider: 'Salon Moderno',
			date: '2024-03-25',
			time: '10:00',
			price: 3200,
			status: 'confirmed'
		}
	];

	onMount(() => {
		// Simulate data loading
		setTimeout(() => {
			loading = false;
		}, 1000);
	});

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS'
		}).format(amount);
	}

	function formatDate(dateStr: string) {
		return new Intl.DateTimeFormat('es-AR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(new Date(dateStr));
	}
</script>

<svelte:head>
	<title>Dashboard - BarberPro</title>
	<meta name="description" content="Gestiona tus reservas y servicios en BarberPro" />
</svelte:head>

<div class="container-responsive py-8">
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
			<div class="card">
				<div class="skeleton skeleton-text" style="width: 200px; height: 24px; margin-bottom: 1rem;"></div>
				<div class="space-y-4">
					{#each Array(3) as _}
						<div class="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
							<div class="skeleton skeleton-avatar" style="width: 48px; height: 48px;"></div>
							<div class="flex-1 space-y-2">
								<div class="skeleton skeleton-text" style="width: 60%;"></div>
								<div class="skeleton skeleton-text-sm" style="width: 40%;"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- Dashboard Content -->
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
			<div>
				<h1 class="text-3xl font-bold text-neutral-800">
					¡Hola, {user.name}!
				</h1>
				<p class="mt-1 text-neutral-600">
					Gestiona tus reservas y descubre nuevos servicios
				</p>
			</div>
			<div class="mt-4 sm:mt-0">
				<a href="/buscar" class="btn btn-primary">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
					Buscar Servicios
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
				<p class="text-2xl font-bold text-neutral-800">{user.stats.totalBookings}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Próximas</h3>
				<p class="text-2xl font-bold text-neutral-800">{user.stats.upcomingBookings}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Favoritos</h3>
				<p class="text-2xl font-bold text-neutral-800">{user.stats.favoriteProviders}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Total Gastado</h3>
				<p class="text-2xl font-bold text-neutral-800 price-format">{formatCurrency(user.stats.totalSpent)}</p>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Upcoming Bookings -->
			<div class="lg:col-span-2">
				<div class="card">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-xl font-semibold text-neutral-800">
							Próximas Reservas
						</h2>
						<a href="/reservas" class="text-sm text-brand hover:text-primary-700 font-medium">
							Ver todas
						</a>
					</div>

					{#if upcomingBookings.length > 0}
						<div class="space-y-4">
							{#each upcomingBookings as booking}
								<div class="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
									<div class="w-12 h-12 bg-brand rounded-lg flex items-center justify-center text-white font-semibold">
										{booking.provider.charAt(0)}
									</div>
									
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between">
											<div>
												<h3 class="font-semibold text-neutral-800">{booking.service}</h3>
												<p class="text-sm text-neutral-600">{booking.provider}</p>
												<p class="text-sm text-neutral-500">
													{formatDate(booking.date)} - {booking.time}
												</p>
											</div>
											<div class="text-right">
												<p class="font-semibold price-format">{formatCurrency(booking.price)}</p>
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
													class:badge-success={booking.status === 'confirmed'}
													class:badge-warning={booking.status === 'pending'}
												>
													{booking.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
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
							<h3 class="text-lg font-medium text-neutral-800 mb-2">No tienes reservas próximas</h3>
							<p class="text-neutral-600 mb-6">Descubre y reserva en los mejores lugares de tu ciudad</p>
							<a href="/buscar" class="btn btn-primary">
								Buscar Servicios
							</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Quick Actions & Recent Activity -->
			<div class="space-y-8">
				<!-- Quick Actions -->
				<div class="card">
					<h2 class="text-xl font-semibold text-neutral-800 mb-4">
						Acciones Rápidas
					</h2>
					<div class="space-y-3">
						<a href="/buscar" class="w-full btn btn-secondary text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
							</svg>
							Buscar Servicios
						</a>
						<a href="/reservas" class="w-full btn btn-ghost text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
							Mis Reservas
						</a>
						<a href="/favoritos" class="w-full btn btn-ghost text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
							</svg>
							Mis Favoritos
						</a>
						<a href="/perfil" class="w-full btn btn-ghost text-left justify-start">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
							</svg>
							Mi Perfil
						</a>
					</div>
				</div>

				<!-- Recommended Services -->
				<div class="card">
					<h2 class="text-xl font-semibold text-neutral-800 mb-4">
						Recomendados para ti
					</h2>
					<div class="space-y-4">
						<div class="p-3 bg-neutral-50 rounded-lg">
							<h3 class="font-medium text-neutral-800">Spa Relax</h3>
							<p class="text-sm text-neutral-600">Masajes y tratamientos faciales</p>
							<div class="flex items-center justify-between mt-2">
								<span class="text-sm font-medium price-format">Desde {formatCurrency(3500)}</span>
								<button class="text-xs text-brand hover:text-primary-700 font-medium">
									Ver más
								</button>
							</div>
						</div>

						<div class="p-3 bg-neutral-50 rounded-lg">
							<h3 class="font-medium text-neutral-800">Estudio Color</h3>
							<p class="text-sm text-neutral-600">Coloración y tratamientos capilares</p>
							<div class="flex items-center justify-between mt-2">
								<span class="text-sm font-medium price-format">Desde {formatCurrency(4200)}</span>
								<button class="text-xs text-brand hover:text-primary-700 font-medium">
									Ver más
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>