<script lang="ts">
	import '../app/app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { authStore, isAuthenticated, user } from '$lib/stores/auth';
	import { performanceStore } from '$lib/stores/performance';
	import { frontendMonitoringStore } from '$lib/stores/frontend-monitoring';
	import { uxOptimizationService } from '$lib/services/ux-optimization';
	import performanceOptimizationService from '$lib/services/performance-optimization';
	import customerSuccessService from '$lib/services/customer-success';
	import UserGuidance from '$lib/components/ux/UserGuidance.svelte';
	import ErrorBoundary from '$lib/components/monitoring/ErrorBoundary.svelte';
	import CustomerHealthWidget from '$lib/components/analytics/CustomerHealthWidget.svelte';
	
	// Mobile navigation state
	let mobileMenuOpen = false;
	let mounted = false;

	onMount(() => {
		mounted = true;
		// Initialize authentication state
		authStore.initializeAuth();
		
		// Initialize launch day monitoring and optimizations
		if (browser) {
			// Start performance monitoring
			performanceStore.startMonitoring();
			
			// Start frontend monitoring for real-time analytics
			frontendMonitoringStore.startMonitoring();
			
			// Initialize UX optimizations for Argentina mobile users
			uxOptimizationService.initialize();
			
			// Initialize F11-001 Customer Experience Platform features
			performanceOptimizationService.optimizeForMobile();
			performanceOptimizationService.markCriticalResourcesLoaded();
			
			
			// Initialize performance monitoring for launch day
			console.log('[Layout] Launch day monitoring initialized');
		}
	});

	// Close mobile menu when route changes
	$: if (browser && $page.url.pathname) {
		mobileMenuOpen = false;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	// Service-focused navigation optimized for mobile-first booking experience
	const navItems = [
		{
			href: '/',
			label: 'Inicio',
			icon: 'home',
			description: 'Página principal',
			mobileLabel: 'Home'
		},
		{
			href: '/servicios',
			label: 'Reservar',
			icon: 'calendar',
			description: 'Encuentra y reserva tu barbero',
			badge: 'Popular',
			primary: true,
			mobileLabel: 'Reservar'
		},
		{
			href: '/barberos',
			label: 'Barberos',
			icon: 'provider',
			description: 'Explora profesionales cerca tuyo',
			mobileLabel: 'Barberos'
		},
		{
			href: '/como-funciona',
			label: 'Ayuda',
			icon: 'info',
			description: 'Cómo funciona la plataforma',
			mobileLabel: 'Ayuda'
		},
		{
			href: '/para-profesionales',
			label: 'Profesionales',
			icon: 'provider',
			description: 'Únete como barbero',
			highlight: true,
			mobileLabel: 'Únete'
		}
	];

	const authItems = [
		{ href: '/login', label: 'Iniciar Sesión' },
		{ href: '/register', label: 'Registrarse' }
	];

	// Enhanced icon rendering function with more iconography for service booking
	function getIcon(iconName) {
		const icons = {
			home: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`,
			services: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h2V3H9zM6 8v9h8V8H6z"/>`,
			info: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
			provider: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>`,
			search: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>`,
			calendar: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>`,
			analytics: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`,
			bookings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>`,
			support: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"/>`,
			whatsapp: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>`
		};
		return icons[iconName] || icons.home;
	}

	// Enhanced micro-interaction handlers
	function handleNavItemHover(event) {
		const item = event.currentTarget;
		item.style.transform = 'translateY(-1px)';
	}

	function handleNavItemLeave(event) {
		const item = event.currentTarget;
		item.style.transform = 'translateY(0)';
	}

	// Argentina market trust indicators
	const trustIndicators = [
		{ icon: 'shield', text: 'Plataforma Verificada', color: 'success' },
		{ icon: 'phone', text: 'Soporte 24/7', color: 'primary' },
		{ icon: 'lock', text: 'Pagos Seguros', color: 'success' },
		{ icon: 'users', text: '1,000+ Profesionales', color: 'primary' }
	];

	// Real-time booking metrics for social proof
	let liveBookings = 127;
	let onlineProviders = 89;

	// Simulate live updates for social proof
	onMount(() => {
		if (browser) {
			const updateMetrics = setInterval(() => {
				liveBookings = Math.floor(Math.random() * 50) + 100;
				onlineProviders = Math.floor(Math.random() * 30) + 75;
			}, 30000); // Update every 30 seconds

			return () => clearInterval(updateMetrics);
		}
	});
</script>

<ErrorBoundary config={{ argentina: true, enableRetry: true, enableReporting: true }} name="MainLayout">
{#if mounted}
<div class="min-h-screen bg-neutral-50 flex flex-col">
	<!-- Enhanced mobile-first header with trust indicators -->
	<header class="bg-white/95 backdrop-blur-sm shadow-soft border-b border-neutral-200 sticky top-0 z-40">
		<!-- Simplified trust header optimized for mobile-first Argentina market -->
		<div class="bg-gradient-to-r from-primary-500 to-primary-600 border-b border-primary-700 overflow-hidden relative">
			<!-- Simplified animated background -->
			<div class="absolute inset-0 opacity-20">
				<div class="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
			</div>
			<div class="container-responsive relative">
				<div class="flex items-center justify-between py-2.5 text-sm">
					<!-- Primary trust indicator - mobile-first -->
					<div class="flex items-center space-x-3 text-white">
						<div class="flex items-center space-x-2">
							<div class="flex items-center justify-center w-4 h-4 bg-white/20 rounded-full">
								<svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
								</svg>
							</div>
							<span class="font-semibold text-sm">Plataforma Verificada</span>
						</div>
						<div class="hidden sm:flex items-center space-x-2">
							<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
							<span class="font-medium text-sm text-white/90">{onlineProviders} profesionales online</span>
						</div>
					</div>

					<!-- Simplified Argentina indicators -->
					<div class="flex items-center space-x-3 text-white/90">
						<div class="hidden md:flex items-center space-x-2 text-xs font-medium">
							<span>🇦🇷</span>
							<span>Hecho en Argentina</span>
						</div>
						<div class="flex items-center space-x-2 px-2.5 py-1 bg-white/20 rounded-full">
							<div class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
							<span class="text-xs font-medium">{liveBookings} reservas hoy</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="container-responsive">
			<div class="flex items-center justify-between h-16 md:h-20">
				<!-- Streamlined Premium Logo with Enhanced Mobile-First Design -->
				<a href="/" class="flex items-center space-x-3 text-brand font-heading font-bold text-xl md:text-2xl group transition-all duration-300 hover:scale-105 touch-optimization">
					<!-- Simplified premium logo with better mobile focus -->
					<div class="relative">
						<div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl group-hover:shadow-primary-500/20 transition-all duration-500 transform group-hover:rotate-1">
							<!-- Optimized barber icon for mobile -->
							<svg class="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
								<path d="M8 4V2a1 1 0 011-1h6a1 1 0 011 1v2h2a1 1 0 011 1v2a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H9a2 2 0 01-2-2V8H6a1 1 0 01-1-1V5a1 1 0 011-1h2zM10 3v1h4V3h-4zM9 8v9h6V8H9z"/>
								<path d="M10.5 10h3v1h-3v-1zm0 2h3v1h-3v-1z" fill="white" opacity="0.8"/>
							</svg>
							<!-- Subtle shine effect -->
							<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
						</div>
						<!-- Single verification badge - simplified -->
						<div class="absolute -top-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
							<svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</div>
					</div>
					<div class="flex flex-col">
						<div class="flex items-center space-x-2">
							<span class="leading-none group-hover:text-primary-700 transition-colors duration-300">BarberPro</span>
							<span class="hidden sm:inline-block text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">🇦🇷</span>
						</div>
						<div class="hidden md:flex items-center space-x-2">
							<span class="text-xs font-normal text-neutral-500 leading-none">Plataforma Premium</span>
							<div class="w-1 h-1 bg-success-500 rounded-full animate-pulse"></div>
						</div>
					</div>
				</a>

				<!-- Service-Focused Desktop Navigation with Mobile-First Optimizations -->
				<nav class="hidden md:flex items-center space-x-1">
					{#each navItems as item}
						<div class="relative group">
							{#if item.primary}
								<!-- Primary booking button with enhanced CTA design -->
								<a
									href={item.href}
									class="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-md"
									aria-label="{item.description}"
								>
									<!-- Enhanced primary icon -->
									<svg class="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon(item.icon)}
									</svg>
									<span>{item.label}</span>
									{#if item.badge}
										<span class="ml-1 px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
											{item.badge}
										</span>
									{/if}
								</a>
							{:else}
								<!-- Regular navigation items -->
								<a
									href={item.href}
									class="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-neutral-600 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 transition-all duration-300 font-medium relative transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
									class:text-primary-600={$page.url.pathname === item.href}
									class:bg-gradient-to-r={$page.url.pathname === item.href || item.highlight}
									class:from-primary-100={$page.url.pathname === item.href}
									class:to-primary-50={$page.url.pathname === item.href}
									class:from-secondary-50={item.highlight && $page.url.pathname !== item.href}
									class:to-secondary-100={item.highlight && $page.url.pathname !== item.href}
									class:text-secondary-700={item.highlight && $page.url.pathname !== item.href}
									class:hover:from-secondary-100={item.highlight}
									class:hover:to-secondary-200={item.highlight}
									class:font-semibold={item.highlight}
									on:mouseenter={handleNavItemHover}
									on:mouseleave={handleNavItemLeave}
									aria-label="{item.description}"
								>
									<!-- Enhanced Icon with micro-animations -->
									<svg class="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon(item.icon)}
									</svg>
									<span class="group-hover:font-semibold transition-all duration-200">{item.label}</span>

									<!-- Enhanced Highlight indicator -->
									{#if item.highlight}
										<div class="flex items-center space-x-1">
											<div class="w-1 h-1 bg-secondary-600 rounded-full animate-pulse"></div>
											<svg class="w-3 h-3 text-secondary-600 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
											</svg>
										</div>
									{/if}

									<!-- Active state indicator -->
									{#if $page.url.pathname === item.href}
										<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary-600 rounded-full"></div>
									{/if}
								</a>
							{/if}

							<!-- Simplified tooltip -->
							<div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg">
								<div class="font-medium">{item.description}</div>
								{#if item.primary && item.badge}
									<div class="text-xs text-primary-300 mt-1">Acción principal</div>
								{/if}
								{#if item.highlight}
									<div class="text-xs text-secondary-300 mt-1">Comienza gratis</div>
								{/if}
								<!-- Arrow pointing up -->
								<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-neutral-900"></div>
							</div>
						</div>
					{/each}
				</nav>

				<!-- Enhanced Desktop Auth/User Menu with advanced service booking features -->
				<div class="hidden md:flex items-center space-x-3">
					{#if $isAuthenticated && $user}
						<!-- Enhanced Quick Actions with better UX -->
						<div class="flex items-center space-x-2">
							<!-- Customer quick actions -->
							{#if $user.role === 'customer'}
								<a
									href="/servicios"
									class="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
									aria-label="Reservar un servicio ahora"
								>
									<svg class="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
									</svg>
									<span class="hidden lg:block">Reservar</span>
									<span class="lg:hidden">+</span>
								</a>
								<!-- My bookings quick access -->
								<a
									href="/dashboard/bookings"
									class="flex items-center space-x-2 px-4 py-2.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 font-medium border border-neutral-200 hover:border-primary-200"
									aria-label="Ver mis reservas"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon('bookings')}
									</svg>
									<span class="hidden xl:block">Mis Reservas</span>
								</a>
							{/if}

							<!-- Provider quick actions -->
							{#if $user.role === 'provider'}
								<a
									href="/dashboard/calendar"
									class="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
									aria-label="Ver calendario de citas"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon('calendar')}
									</svg>
									<span class="hidden lg:block">Calendario</span>
								</a>
								<!-- Analytics quick access -->
								<a
									href="/dashboard/analytics"
									class="flex items-center space-x-2 px-4 py-2.5 text-neutral-600 hover:text-secondary-600 hover:bg-secondary-50 rounded-xl transition-all duration-200 font-medium border border-neutral-200 hover:border-secondary-200"
									aria-label="Ver estadísticas del negocio"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon('analytics')}
									</svg>
									<span class="hidden xl:block">Estadísticas</span>
								</a>
							{/if}
						</div>

						<!-- Enhanced User Menu with improved interaction design -->
						<div class="relative group">
							<button
								type="button"
								class="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100 transition-all duration-300 font-medium border border-transparent hover:border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
								aria-label="Menú de usuario"
								aria-expanded="false"
							>
								<div class="flex items-center space-x-2">
									{#if $user.avatar}
										<img src={$user.avatar} alt="Avatar de {$user?.name || 'Usuario'}" class="w-10 h-10 rounded-full object-cover ring-2 ring-primary-100 group-hover:ring-primary-200 transition-all duration-200" />
									{:else}
										<div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary-100 group-hover:ring-primary-200 group-hover:scale-105 transition-all duration-200">
											{(($user?.name || '')?.split(' ') || [])?.map(n => n?.[0])?.filter(Boolean)?.slice(0, 2)?.join('') || 'U'}
										</div>
									{/if}
									<div class="hidden xl:flex flex-col items-start">
										<div class="flex items-center space-x-2">
											<span class="text-neutral-700 font-semibold leading-none">{(($user?.name || '')?.split(' ') || [])?.[0] || 'Usuario'}</span>
											<!-- Role badge -->
											<span class="px-2 py-0.5 text-xs font-medium rounded-full capitalize" class:bg-primary-100={$user.role === 'CLIENT'} class:text-primary-700={$user.role === 'CLIENT'} class:bg-secondary-100={$user.role === 'PROVIDER'} class:text-secondary-700={$user.role === 'PROVIDER'} class:bg-amber-100={$user.role === 'ADMIN'} class:text-amber-700={$user.role === 'ADMIN'}>
												{$user.role === 'CLIENT' ? 'Cliente' : $user.role === 'PROVIDER' ? 'Profesional' : 'Admin'}
											</span>
										</div>
										<span class="text-xs text-neutral-500 leading-none">Ver perfil</span>
									</div>
								</div>
								<svg class="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 group-hover:rotate-180 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							<!-- Enhanced Dropdown menu with better design and functionality -->
							<div class="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-50">
								<!-- User info header -->
								<div class="p-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-t-2xl">
									<div class="flex items-center space-x-3">
										{#if $user.avatar}
											<img src={$user.avatar} alt="Avatar" class="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm" />
										{:else}
											<div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white shadow-sm">
												{(($user?.name || '')?.split(' ') || [])?.map(n => n?.[0])?.filter(Boolean)?.slice(0, 2)?.join('') || 'U'}
											</div>
										{/if}
										<div class="flex-1">
											<div class="font-semibold text-neutral-900">{$user?.name || 'Usuario'}</div>
											<div class="text-sm text-neutral-600">{$user.email}</div>
											<div class="flex items-center space-x-2 mt-1">
												<span class="px-2 py-0.5 text-xs font-medium rounded-full capitalize bg-white bg-opacity-70"
													class:text-primary-700={$user.role === 'customer'}
													class:text-secondary-700={$user.role === 'provider'}>
													{$user.role === 'customer' ? 'Cliente Premium' : 'Profesional Verificado'}
												</span>
												<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
											</div>
										</div>
									</div>
								</div>

								<!-- Quick stats for providers -->
								{#if $user.role === 'provider'}
									<div class="px-4 py-3 border-b border-neutral-100">
										<div class="grid grid-cols-3 gap-4 text-center">
											<div>
												<div class="text-lg font-bold text-primary-600">28</div>
												<div class="text-xs text-neutral-500">Citas hoy</div>
											</div>
											<div>
												<div class="text-lg font-bold text-success-600">4.9</div>
												<div class="text-xs text-neutral-500">Rating</div>
											</div>
											<div>
												<div class="text-lg font-bold text-secondary-600">87%</div>
												<div class="text-xs text-neutral-500">Ocupación</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Navigation menu -->
								<div class="p-2">
									<a href="/dashboard" class="flex items-center space-x-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 rounded-xl transition-all duration-200 group">
										<svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2"/>
										</svg>
										<span class="font-medium">Dashboard</span>
										<svg class="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
										</svg>
									</a>
									<a href="/dashboard/profile" class="flex items-center space-x-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 rounded-xl transition-all duration-200 group">
										<svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
										</svg>
										<span class="font-medium">Mi Perfil</span>
										<svg class="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
										</svg>
									</a>
									<a href="/soporte" class="flex items-center space-x-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 rounded-xl transition-all duration-200 group">
										<svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											{@html getIcon('support')}
										</svg>
										<span class="font-medium">Ayuda y Soporte</span>
										<svg class="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
										</svg>
									</a>

									<!-- WhatsApp support for Argentina market -->
									<div class="border-t border-neutral-100 pt-2 mt-2">
										<a href="https://wa.me/5491123456789" class="flex items-center space-x-3 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 group" target="_blank" rel="noopener noreferrer">
											<svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.087"/>
											</svg>
											<span class="font-medium">WhatsApp Soporte</span>
											<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">24/7</span>
										</a>
									</div>

									<!-- Logout -->
									<div class="border-t border-neutral-100 pt-2 mt-2">
										<button class="flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group w-full text-left" on:click={() => authStore.logout()}>
											<svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
											</svg>
											<span class="font-medium">Cerrar Sesión</span>
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Customer Experience Health Indicator -->
						{#if $user.role === 'customer'}
							<div class="relative">
								<CustomerHealthWidget userId={$user.id} compact={true} />
							</div>
						{/if}
					{:else}
						<!-- Enhanced Auth Buttons for conversion optimization -->
						<div class="flex items-center space-x-3">
							<a
								href="/login"
								class="flex items-center space-x-2 px-5 py-2.5 text-neutral-600 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 rounded-xl transition-all duration-300 font-medium border border-neutral-200 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
								</svg>
								<span>Iniciar Sesión</span>
							</a>
							<a
								href="/register"
								class="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 relative overflow-hidden"
							>
								<!-- Animated shine effect -->
								<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
								<svg class="w-4 h-4 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
								</svg>
								<span class="z-10 relative">Registrarse</span>
								<span class="ml-1 px-2.5 py-1 text-xs font-bold bg-white/25 hover:bg-white/30 rounded-full z-10 relative transition-colors duration-200">
									Gratis
								</span>
							</a>
						</div>
					{/if}
				</div>

				<!-- Enhanced Mobile menu button with better accessibility and design -->
				<div class="md:hidden flex items-center space-x-2">
					<!-- Notifications indicator for mobile -->
					{#if $isAuthenticated && $user}
						<button
							type="button"
							class="relative p-2 rounded-xl hover:bg-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							aria-label="Notificaciones"
						>
							<svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
							</svg>
							<!-- Notification badge -->
							<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white">
								<div class="w-full h-full bg-red-500 rounded-full animate-ping"></div>
							</div>
						</button>
					{/if}

					<!-- Enhanced hamburger menu button -->
					<button
						type="button"
						class="mobile-nav p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 border border-neutral-200 hover:border-neutral-300"
						aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
						aria-expanded={mobileMenuOpen}
						on:click={toggleMobileMenu}
					>
						<div class="relative w-6 h-6">
							{#if mobileMenuOpen}
								<!-- Enhanced X icon with animation -->
								<svg class="w-6 h-6 text-neutral-700 transform rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
								</svg>
							{:else}
								<!-- Enhanced Hamburger icon with micro-animation -->
								<svg class="w-6 h-6 text-neutral-700 transition-transform duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
								<!-- Menu indicator dots -->
								<div class="absolute -top-1 -right-1 flex space-x-0.5">
									<div class="w-1 h-1 bg-primary-500 rounded-full animate-pulse"></div>
									<div class="w-1 h-1 bg-secondary-500 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
								</div>
							{/if}
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Enhanced Mobile Navigation Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden bg-white border-t border-neutral-200 mobile-menu-slide shadow-lg navbar-mobile-optimized">
				<div class="container-responsive py-4">
					<!-- User info section for authenticated users -->
					{#if $isAuthenticated && $user}
						<div class="flex items-center space-x-3 p-4 mb-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
							{#if $user.avatar}
								<img src={$user.avatar} alt="Avatar" class="w-12 h-12 rounded-full object-cover ring-2 ring-primary-200" />
							{:else}
								<div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
									{(($user?.name || '')?.split(' ') || [])?.map(n => n?.[0])?.filter(Boolean)?.slice(0, 2)?.join('') || 'U'}
								</div>
							{/if}
							<div class="flex-1">
								<div class="font-semibold text-neutral-900">{$user?.name || 'Usuario'}</div>
								<div class="text-sm text-neutral-600 capitalize">{$user.role}</div>
							</div>
							<a href="/dashboard" class="btn btn-sm bg-primary-600 text-white rounded-lg px-3 py-1.5">
								Dashboard
							</a>
						</div>

						<!-- Quick actions for authenticated users -->
						<div class="grid grid-cols-2 gap-3 mb-4">
							{#if $user.role === 'customer'}
								<a
									href="/servicios"
									class="flex items-center justify-center space-x-2 p-3 bg-primary-600 text-white rounded-lg font-medium"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
									</svg>
									<span>Reservar</span>
								</a>
								<a
									href="/dashboard/bookings"
									class="flex items-center justify-center space-x-2 p-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
									</svg>
									<span>Mis Reservas</span>
								</a>
							{:else if $user.role === 'provider'}
								<a
									href="/dashboard/calendar"
									class="flex items-center justify-center space-x-2 p-3 bg-secondary-600 text-white rounded-lg font-medium"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
									</svg>
									<span>Calendario</span>
								</a>
								<a
									href="/dashboard/analytics"
									class="flex items-center justify-center space-x-2 p-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
									</svg>
									<span>Estadísticas</span>
								</a>
							{/if}
						</div>
					{/if}

					<nav class="space-y-2">
						{#each navItems as item}
							{#if item.primary}
								<!-- Primary mobile booking button -->
								<a
									href={item.href}
									class="flex items-center justify-center space-x-3 py-4 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg touch-optimization"
									aria-label="{item.description}"
								>
									<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon(item.icon)}
									</svg>
									<span class="text-lg">{item.mobileLabel || item.label}</span>
									{#if item.badge}
										<span class="px-2.5 py-1 text-xs font-bold bg-white/20 rounded-full">
											{item.badge}
										</span>
									{/if}
								</a>
							{:else}
								<!-- Regular mobile navigation items with better touch targets -->
								<a
									href={item.href}
									class="flex items-center space-x-4 py-3.5 px-4 rounded-xl text-neutral-700 hover:bg-neutral-100 hover:text-primary-600 transition-all font-medium touch-optimization"
									class:bg-primary-50={$page.url.pathname === item.href}
									class:text-primary-600={$page.url.pathname === item.href}
									class:border-l-4={$page.url.pathname === item.href}
									class:border-primary-600={$page.url.pathname === item.href}
									class:bg-gradient-to-r={item.highlight}
									class:from-secondary-50={item.highlight}
									class:to-secondary-100={item.highlight}
									class:text-secondary-700={item.highlight}
									aria-label="{item.description}"
								>
									<!-- Enhanced mobile icon -->
									<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon(item.icon)}
									</svg>
									<div class="flex-1">
										<div class="flex items-center justify-between">
											<span class="text-base font-medium">{item.mobileLabel || item.label}</span>
											<div class="flex items-center space-x-2">
												{#if item.badge}
													<span class="px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
														{item.badge}
													</span>
												{/if}
												{#if item.highlight}
													<svg class="w-4 h-4 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
													</svg>
												{/if}
											</div>
										</div>
										<div class="text-sm text-neutral-500 mt-1">{item.description}</div>
									</div>
								</a>
							{/if}
						{/each}

						<!-- Authentication section for non-authenticated users -->
						{#if !$isAuthenticated}
							<div class="border-t border-neutral-200 pt-4 mt-4 space-y-3">
								<a
									href="/login"
									class="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-all font-medium border border-neutral-200"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
									</svg>
									<span>Iniciar Sesión</span>
								</a>
								<a
									href="/register"
									class="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-md"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
									</svg>
									<span>Registrarse Gratis</span>
								</a>
							</div>
						{/if}

						<!-- Argentina-specific support section -->
						<div class="border-t border-neutral-200 pt-4 mt-4 space-y-3">
							<a
								href="/soporte"
								class="flex items-center space-x-3 py-3 px-4 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-all touch-optimization"
								aria-label="Ayuda y soporte"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"/>
								</svg>
								<span>Ayuda y Soporte</span>
							</a>
							<!-- WhatsApp support for mobile users -->
							<a
								href="https://wa.me/5491123456789"
								class="flex items-center space-x-3 py-3 px-4 rounded-xl text-green-700 bg-green-50 hover:bg-green-100 transition-all touch-optimization"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Contactar por WhatsApp"
							>
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.087"/>
								</svg>
								<div class="flex-1">
									<span class="font-medium">WhatsApp Soporte</span>
									<div class="text-xs text-green-600">Respuesta inmediata</div>
								</div>
								<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">24/7</span>
							</a>
						</div>
					</nav>
				</div>
			</div>
		{/if}
	</header>

	<!-- Main content area -->
	<main class="flex-1 safe-area-bottom">
		{#if mounted}
			<slot />
		{:else}
			<!-- Loading skeleton for initial render -->
			<div class="min-h-screen flex items-center justify-center">
				<div class="text-center space-y-4">
					<div class="skeleton skeleton-avatar mx-auto"></div>
					<div class="skeleton skeleton-text mx-auto" style="width: 200px;"></div>
					<div class="skeleton skeleton-text-sm mx-auto"></div>
				</div>
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="bg-neutral-800 text-neutral-300 py-12 safe-area-bottom">
		<div class="container-responsive">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
				<!-- Brand Section -->
				<div class="space-y-4">
					<div class="flex items-center space-x-2 text-white font-heading font-bold text-xl">
						<div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
							B
						</div>
						<span>BarberPro</span>
					</div>
					<p class="text-sm text-neutral-400 leading-relaxed">
						La plataforma premium de reservas de servicios para Argentina. Conectando profesionales con clientes.
					</p>
				</div>

				<!-- Quick Links -->
				<div>
					<h6 class="font-semibold mb-4 text-white">Enlaces Rápidos</h6>
					<ul class="space-y-2">
						{#each navItems as item}
							<li>
								<a href={item.href} class="text-sm hover:text-white transition-colors">
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Legal -->
				<div>
					<h6 class="font-semibold mb-4 text-white">Legal</h6>
					<ul class="space-y-2">
						<li>
							<a href="/privacidad" class="text-sm hover:text-white transition-colors">
								Política de Privacidad
							</a>
						</li>
						<li>
							<a href="/terminos" class="text-sm hover:text-white transition-colors">
								Términos de Servicio
							</a>
						</li>
						<li>
							<a href="/cookies" class="text-sm hover:text-white transition-colors">
								Política de Cookies
							</a>
						</li>
					</ul>
				</div>

				<!-- Contact -->
				<div>
					<h6 class="font-semibold mb-4 text-white">Contacto</h6>
					<ul class="space-y-2 text-sm">
						<li class="flex items-center space-x-2">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
							</svg>
							<span>+54 9 11 1234-5678</span>
						</li>
						<li class="flex items-center space-x-2">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
								<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
							</svg>
							<span>hola@barberpro.com.ar</span>
						</li>
					</ul>
				</div>
			</div>

			<div class="border-t border-neutral-700 mt-8 pt-8 text-center text-sm text-neutral-400">
				<p>&copy; {new Date().getFullYear()} BarberPro. Todos los derechos reservados. Hecho en Argentina.</p>
			</div>
		</div>
	</footer>
</div>
{:else}
<!-- Loading state while component initializes -->
<div class="min-h-screen bg-neutral-50 flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
		<p class="mt-2 text-neutral-600">Cargando...</p>
	</div>
</div>
{/if}
</ErrorBoundary>

<!-- Mobile menu overlay -->
{#if mobileMenuOpen}
	<div 
		class="fixed inset-0 bg-black/20 z-30 md:hidden"
		on:click={toggleMobileMenu}
		on:keydown={(e) => e.key === 'Escape' && toggleMobileMenu()}
		role="button"
		tabindex="0"
		aria-label="Cerrar menú"
	></div>
{/if}

<!-- Launch Day User Guidance System -->
<UserGuidance contextualHelp={true} adaptToUser={true} showProgress={true} />