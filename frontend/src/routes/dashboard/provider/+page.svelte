<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { providerStore } from '$lib/stores/booking';
	import { bookingApi } from '$lib/api/booking';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import ServiceManager from '$lib/components/provider/ServiceManager.svelte';
	import NotificationCenter from '$lib/components/notifications/NotificationCenter.svelte';
	import PromotionManager from '$lib/components/provider/PromotionManager.svelte';
	import AnalyticsDashboard from '$lib/components/provider/AnalyticsDashboard.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { BookingAnalytics, Booking } from '$lib/types/booking';
	
	let loading = true;
	let stats: BookingAnalytics | null = null;
	let todayAppointments: Booking[] = [];
	let profileCompletion = 0;
	let showProfileBanner = false;
	let showServiceManager = false;
	let showPromotionManager = false;
	let showAnalyticsDashboard = false;
	let showReferralManager = false;
	let error: string | null = null;

	// Real-time updates
	let lastUpdated = new Date();
	
	// Referral system state (placeholder for when backend is ready)
	let referralStats = {
		totalReferrals: 0,
		successfulReferrals: 0,
		totalEarnings: 0,
		referralCode: '',
		conversionRate: 0
	};
	
	// Performance metrics
	let performanceMetrics = {
		loadTime: 0,
		apiResponseTime: 0,
		cacheHitRate: 0
	};

	onMount(async () => {
		const startTime = performance.now();
		
		await Promise.all([
			loadProviderData(),
			loadReferralData(),
			measurePerformance()
		]);
		
		// Calculate profile completion
		if ($user) {
			const requiredFields = [
				$user.firstName,
				$user.lastName,
				$user.phone,
				$user.email,
				$user.profile?.bio,
				$user.profile?.location?.address,
				$user.profile?.location?.city,
				$user.profile?.location?.state,
				$user.avatar,
				$user.profile?.services?.length > 0 ? 'services' : '',
				$user.profile?.experience > 0 ? 'experience' : '',
				$user.profile?.workingHours ? 'hours' : ''
			];
			
			const completedFields = requiredFields.filter(field => field && field.length > 0);
			profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);
			showProfileBanner = profileCompletion < 90;
		}

		performanceMetrics.loadTime = performance.now() - startTime;
		loading = false;
	});

	// Load referral system data (placeholder for backend integration)
	const loadReferralData = async () => {
		try {
			// This will be uncommented when backend B5-001 referral APIs are ready
			/*
			const response = await fetch(`/api/providers/${$user?.profile?.provider?.id}/referrals`);
			if (response.ok) {
				referralStats = await response.json();
			}
			*/
			
			// Mock data for now
			referralStats = {
				totalReferrals: 12,
				successfulReferrals: 8,
				totalEarnings: 2400,
				referralCode: 'BARBER2024',
				conversionRate: 66.7
			};
		} catch (error) {
			console.warn('Referral data not available yet');
		}
	};
	
	// Performance measurement
	const measurePerformance = async () => {
		try {
			// Measure API response time
			const apiStart = performance.now();
			await fetch('/api/health');
			performanceMetrics.apiResponseTime = performance.now() - apiStart;
			
			// Mock cache hit rate
			performanceMetrics.cacheHitRate = Math.floor(Math.random() * 20) + 80; // 80-100%
		} catch (error) {
			console.warn('Performance metrics not available');
		}
	};
	
	// Share referral code
	const shareReferralCode = async (platform: 'whatsapp' | 'instagram' | 'copy' | 'email') => {
		if (!referralStats.referralCode) return;
		
		const message = `¡Descubre el mejor servicio de barbería! Usa mi código de referido ${referralStats.referralCode} y obtén un descuento en tu primera cita. https://barberpro.com/referral/${referralStats.referralCode}`;
		
		switch (platform) {
			case 'whatsapp':
				window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
				break;
			case 'instagram':
				// Instagram doesn't support direct sharing, copy to clipboard
				navigator.clipboard.writeText(message);
				alert('Código copiado. Compártelo en tu historia de Instagram!');
				break;
			case 'copy':
				navigator.clipboard.writeText(message);
				alert('Código de referido copiado al portapapeles');
				break;
			case 'email':
				window.open(`mailto:?subject=Código de referido BarberPro&body=${encodeURIComponent(message)}`);
				break;
		}
	};

	const loadProviderData = async () => {
		if (!$user?.profile?.provider?.id) return;
		
		try {
			// Load analytics
			await providerStore.loadAnalytics($user.profile.provider.id);
			
			// Load today's bookings
			const today = new Date().toISOString().split('T')[0];
			const response = await bookingApi.searchBookings({
				providerId: $user.profile.provider.id,
				dateFrom: new Date(today),
				dateTo: new Date(today + 'T23:59:59'),
				sortBy: 'startTime',
				sortOrder: 'asc'
			});
			
			if (response.success) {
				todayAppointments = response.data.bookings;
			}
			
			lastUpdated = new Date();
		} catch (err: any) {
			error = err.message || 'Error al cargar datos';
			console.error('Error loading provider data:', err);
		}
	};

	// Subscribe to provider store
	$: ({ analytics } = $providerStore);
	$: stats = analytics;

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS'
		}).format(amount);
	}

	function formatTime(date: Date | string) {
		return new Intl.DateTimeFormat('es-AR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(new Date(date));
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'CONFIRMED':
				return '✓';
			case 'PENDING':
				return '⏱';
			case 'COMPLETED':
				return '✅';
			case 'CANCELLED':
				return '❌';
			case 'IN_PROGRESS':
				return '🔄';
			default:
				return '?';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'CONFIRMED':
				return 'text-green-600 bg-green-100';
			case 'PENDING':
				return 'text-yellow-600 bg-yellow-100';
			case 'COMPLETED':
				return 'text-blue-600 bg-blue-100';
			case 'CANCELLED':
				return 'text-red-600 bg-red-100';
			case 'IN_PROGRESS':
				return 'text-purple-600 bg-purple-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	const refreshData = () => {
		loadProviderData();
	};
</script>

<svelte:head>
	<title>Dashboard Profesional - BarberPro</title>
	<meta name="description" content="Gestiona tu negocio, servicios y reservas" />
</svelte:head>

<ErrorBoundary fallback="retry" {error}>
	<div class="container-responsive">
		{#if loading}
			<!-- Enhanced Loading State with Skeleton -->
			<SkeletonLoader variant="dashboard" />
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
			<div class="mt-4 sm:mt-0 flex items-center space-x-3">
				<!-- Real-time Notifications -->
				<NotificationCenter />
				
				<!-- Refresh Button -->
				<Button variant="outline" size="sm" on:click={refreshData}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</Button>
				
				<Button variant="primary" on:click={() => showServiceManager = true}>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
					</svg>
					Gestionar Servicios
				</Button>
				
				<Button variant="secondary" href="/dashboard/provider/schedule">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					Horarios
				</Button>
			</div>
		</div>

		<!-- Professional Profile Completion Banner -->
		{#if showProfileBanner}
			<div class="mb-8 bg-gradient-to-r from-success-50 to-primary-50 border border-success-200 rounded-lg p-6">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="flex items-center mb-3">
							<svg class="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<h3 class="text-lg font-semibold text-success-800">
								Optimiza tu perfil profesional
							</h3>
						</div>
						
						<p class="text-success-700 mb-4">
							Tu perfil profesional está {profileCompletion}% completo. Un perfil completo atrae hasta 3x más clientes.
						</p>
						
						<div class="w-full bg-success-200 rounded-full h-2 mb-4">
							<div 
								class="bg-success-600 h-2 rounded-full transition-all duration-300" 
								style="width: {profileCompletion}%"
							></div>
						</div>
						
						<div class="flex space-x-4">
							<a href="/dashboard/provider/profile" class="inline-flex items-center text-success-700 hover:text-success-800 font-medium">
								Completar perfil
								<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
							{#if profileCompletion >= 70}
								<span class="inline-flex items-center text-success-600 text-sm">
									<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
									</svg>
									¡Excelente progreso!
								</span>
							{/if}
						</div>
					</div>
					
					<button 
						class="text-success-400 hover:text-success-600 ml-4"
						on:click={() => showProfileBanner = false}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		{#if error}
			<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" in:fade>
				<div class="flex items-center justify-between">
					<p class="text-red-700">{error}</p>
					<button 
						type="button"
						on:click={() => error = null}
						class="text-red-400 hover:text-red-600"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="card text-center">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Total Reservas</h3>
				<p class="text-2xl font-bold text-neutral-800">{stats?.totalBookings || 0}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Hoy</h3>
				<p class="text-2xl font-bold text-neutral-800">{todayAppointments.length}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Servicios</h3>
				<p class="text-2xl font-bold text-neutral-800">{stats?.popularServices?.length || 0}</p>
			</div>

			<div class="card text-center">
				<div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Ingresos del Mes</h3>
				<p class="text-2xl font-bold text-neutral-800">{formatCurrency(stats?.totalRevenue || 0)}</p>
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
						<div class="space-y-4" in:fade={{ duration: 300 }}>
							{#each todayAppointments as appointment (appointment.id)}
								<div class="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
								     in:fly={{ y: 20, duration: 200, delay: todayAppointments.indexOf(appointment) * 50 }}>
									<div class="w-12 h-12 bg-brand rounded-lg flex items-center justify-center text-white font-semibold">
										{appointment.client?.firstName?.charAt(0) || 'C'}{appointment.client?.lastName?.charAt(0) || ''}
									</div>
									
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between">
											<div>
												<h3 class="font-semibold text-neutral-800">{appointment.service?.name}</h3>
												<p class="text-sm text-neutral-600">
													{appointment.client?.firstName} {appointment.client?.lastName}
												</p>
												<p class="text-sm text-neutral-500">
													{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
												</p>
												{#if appointment.notes}
													<p class="text-xs text-neutral-500 mt-1 italic">
														"{appointment.notes}"
													</p>
												{/if}
											</div>
											<div class="text-right">
												<p class="font-semibold">{formatCurrency(appointment.totalAmount)}</p>
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(appointment.status)}">
													{getStatusIcon(appointment.status)} {appointment.status.toLowerCase()}
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
						<Button variant="secondary" class="w-full text-left justify-start" on:click={() => showServiceManager = true}>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
							</svg>
							Gestionar Servicios
						</Button>
						<Button variant="ghost" class="w-full text-left justify-start" href="/dashboard/provider/schedule">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							Configurar Horarios
						</Button>
						<Button variant="ghost" class="w-full text-left justify-start" href="/dashboard/provider/bookings">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
							Todas las Reservas
						</Button>
						<Button variant="ghost" class="w-full text-left justify-start" on:click={() => showAnalyticsDashboard = true}>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
							</svg>
							Panel de Análisis
						</Button>
						<Button variant="ghost" class="w-full text-left justify-start" on:click={() => showPromotionManager = true}>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
							</svg>
							Promociones
						</Button>
						<Button variant="ghost" class="w-full text-left justify-start" on:click={() => showReferralManager = true}>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
							</svg>
							Sistema de Referidos
						</Button>
					</div>
				</div>

				<!-- Referral Stats Card -->
				<div class="card" in:fade={{ duration: 300 }}>
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-neutral-800">Sistema de Referidos</h2>
						<Button 
							variant="ghost" 
							size="sm" 
							on:click={() => showReferralManager = true}
							class="text-brand hover:text-brand-600"
						>
							<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
							Gestionar
						</Button>
					</div>
					
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div class="text-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
							<div class="text-2xl font-bold text-purple-700">{referralStats.successfulReferrals}</div>
							<div class="text-xs text-purple-600">Referidos Exitosos</div>
						</div>
						<div class="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
							<div class="text-2xl font-bold text-green-700">{formatCurrency(referralStats.totalEarnings)}</div>
							<div class="text-xs text-green-600">Ganancias por Referidos</div>
						</div>
					</div>
					
					{#if referralStats.referralCode}
						<div class="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium text-neutral-700">Tu Código:</span>
								<button
									type="button"
									on:click={() => shareReferralCode('copy')}
									class="text-xs text-brand hover:text-brand-600 font-medium"
								>
									Copiar
								</button>
							</div>
							<div class="font-mono text-lg font-bold text-center text-neutral-800 bg-white py-2 rounded border">
								{referralStats.referralCode}
							</div>
							
							<div class="flex justify-center space-x-2 mt-3">
								<button
									type="button"
									on:click={() => shareReferralCode('whatsapp')}
									class="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
									title="Compartir en WhatsApp"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.119"/>
									</svg>
								</button>
								<button
									type="button"
									on:click={() => shareReferralCode('instagram')}
									class="p-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg transition-colors"
									title="Compartir en Instagram"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
									</svg>
								</button>
								<button
									type="button"
									on:click={() => shareReferralCode('email')}
									class="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
									title="Compartir por Email"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
									</svg>
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Analytics Summary -->
				{#if stats}
					<div class="card" in:fade={{ duration: 300 }}>
						<h2 class="text-lg font-semibold text-neutral-800 mb-4">
							Resumen del Mes
						</h2>
						<div class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Citas completadas</span>
								<span class="font-semibold">{stats.completedBookings}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Ingresos</span>
								<span class="font-semibold">{formatCurrency(stats.totalRevenue)}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Citas canceladas</span>
								<span class="font-semibold">{stats.cancelledBookings}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Calificación promedio</span>
								<div class="flex items-center space-x-1">
									<span class="font-semibold">{stats.averageRating.toFixed(1)}</span>
									<svg class="w-4 h-4 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
									</svg>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Last Updated Info -->
				<div class="card">
					<div class="text-center text-sm text-neutral-600">
						<p>Última actualización:</p>
						<p class="font-medium">
							{lastUpdated.toLocaleTimeString('es-AR', { 
								hour: '2-digit', 
								minute: '2-digit' 
							})}
						</p>
						<Button 
							variant="ghost" 
							size="sm" 
							on:click={refreshData}
							class="mt-2"
						>
							<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Actualizar
						</Button>
					</div>
				</div>
			</div>
		</div>
		{/if}
	</div>
</ErrorBoundary>

<!-- Service Manager Modal -->
{#if showServiceManager && $user?.profile?.provider?.id}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
	     on:click|self={() => showServiceManager = false}
	     in:fade={{ duration: 200 }}>
		<div class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
		     in:fly={{ y: 20, duration: 300 }}>
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Gestión de Servicios</h2>
				<button 
					type="button"
					on:click={() => showServiceManager = false}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			
			<div class="p-6">
				<ServiceManager 
					providerId={$user.profile.provider.id}
					on:serviceCreated={refreshData}
					on:serviceUpdated={refreshData}
					on:serviceDeleted={refreshData}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Promotion Manager Modal -->
{#if showPromotionManager && $user?.profile?.provider?.id}
	<PromotionManager 
		bind:isOpen={showPromotionManager}
		providerId={$user.profile.provider.id}
		on:promotionCreated={refreshData}
		on:promotionUpdated={refreshData}
		on:promotionDeleted={refreshData}
		on:close={() => showPromotionManager = false}
	/>
{/if}

<!-- Analytics Dashboard Modal -->
{#if showAnalyticsDashboard && $user?.profile?.provider?.id}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
	     on:click|self={() => showAnalyticsDashboard = false}
	     in:fade={{ duration: 200 }}>
		<div class="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
		     in:fly={{ y: 20, duration: 300 }}>
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Panel de Análisis Avanzado</h2>
				<button 
					type="button"
					on:click={() => showAnalyticsDashboard = false}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			
			<div class="p-6">
				<AnalyticsDashboard 
					providerId={$user.profile.provider.id}
					on:export={(event) => {
						console.log('Exporting analytics:', event.detail);
					}}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Referral Manager Modal (Placeholder for backend integration) -->
{#if showReferralManager && $user?.profile?.provider?.id}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
	     on:click|self={() => showReferralManager = false}
	     in:fade={{ duration: 200 }}>
		<div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
		     in:fly={{ y: 20, duration: 300 }}>
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Sistema de Referidos</h2>
				<button 
					type="button"
					on:click={() => showReferralManager = false}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			
			<div class="p-6 space-y-6">
				<!-- Referral Stats Overview -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="bg-gradient-to-br from-purple-50 to-indigo-100 p-6 rounded-xl">
						<div class="flex items-center justify-between mb-4">
							<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
								</svg>
							</div>
							<span class="text-2xl font-bold text-purple-700">{referralStats.totalReferrals}</span>
						</div>
						<h3 class="text-lg font-semibold text-purple-800 mb-2">Total de Referidos</h3>
						<p class="text-purple-600 text-sm">Usuarios que compartiste el código</p>
					</div>
					
					<div class="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl">
						<div class="flex items-center justify-between mb-4">
							<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
								</svg>
							</div>
							<span class="text-2xl font-bold text-green-700">{referralStats.successfulReferrals}</span>
						</div>
						<h3 class="text-lg font-semibold text-green-800 mb-2">Conversiones</h3>
						<p class="text-green-600 text-sm">Reservas realizadas con tu código</p>
					</div>
					
					<div class="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-xl">
						<div class="flex items-center justify-between mb-4">
							<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
								<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
								</svg>
							</div>
							<span class="text-2xl font-bold text-yellow-700">{formatCurrency(referralStats.totalEarnings)}</span>
						</div>
						<h3 class="text-lg font-semibold text-yellow-800 mb-2">Ganancias</h3>
						<p class="text-yellow-600 text-sm">Total ganado por referidos</p>
					</div>
				</div>
				
				<!-- Referral Code Sharing -->
				<div class="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
					<h3 class="text-lg font-semibold text-neutral-800 mb-4">Compartir Código de Referido</h3>
					
					<div class="bg-white border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center mb-6">
						<div class="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
							</svg>
						</div>
						
						<h4 class="text-xl font-bold text-neutral-800 mb-2">Tu Código de Referido</h4>
						<div class="font-mono text-3xl font-bold text-brand mb-4 bg-brand-50 py-3 px-6 rounded-lg inline-block">
							{referralStats.referralCode}
						</div>
						
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
							<button
								type="button"
								on:click={() => shareReferralCode('whatsapp')}
								class="flex flex-col items-center p-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
							>
								<svg class="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.119"/>
								</svg>
								<span class="text-sm font-medium">WhatsApp</span>
							</button>
							
							<button
								type="button"
								on:click={() => shareReferralCode('instagram')}
								class="flex flex-col items-center p-4 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg transition-colors"
							>
								<svg class="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
								</svg>
								<span class="text-sm font-medium">Instagram</span>
							</button>
							
							<button
								type="button"
								on:click={() => shareReferralCode('email')}
								class="flex flex-col items-center p-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
							>
								<svg class="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
								</svg>
								<span class="text-sm font-medium">Email</span>
							</button>
							
							<button
								type="button"
								on:click={() => shareReferralCode('copy')}
								class="flex flex-col items-center p-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
							>
								<svg class="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
								</svg>
								<span class="text-sm font-medium">Copiar</span>
							</button>
						</div>
					</div>
					
					<!-- Referral Performance -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 class="font-semibold text-neutral-800 mb-3">Tasa de Conversión</h4>
							<div class="w-full bg-neutral-200 rounded-full h-3 mb-2">
								<div 
									class="bg-brand h-3 rounded-full transition-all duration-300" 
									style="width: {referralStats.conversionRate}%"
								></div>
							</div>
							<p class="text-sm text-neutral-600">{referralStats.conversionRate}% de tus referidos se convierten en clientes</p>
						</div>
						
						<div>
							<h4 class="font-semibold text-neutral-800 mb-3">Próxima Recompensa</h4>
							<div class="text-center p-4 bg-warning-50 border border-warning-200 rounded-lg">
								<div class="text-lg font-bold text-warning-800">5 referidos más</div>
								<div class="text-sm text-warning-600">para obtener $500 de bonus</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Notice about backend integration -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-start space-x-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<div>
							<p class="text-sm font-medium text-blue-800">Sistema en Desarrollo</p>
							<p class="text-sm text-blue-700 mt-1">
								El sistema de referidos estará completamente funcional una vez que se integren las APIs del backend (B5-001). 
								Actualmente se muestran datos de demostración.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}