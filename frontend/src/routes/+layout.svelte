<script lang="ts">
	import '../app/app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { authStore, isAuthenticated, user } from '$lib/stores/auth';
	import { performanceStore } from '$lib/stores/performance';
	import { uxOptimizationService } from '$lib/services/ux-optimization';
	import UserGuidance from '$lib/components/ux/UserGuidance.svelte';
	
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
			
			// Initialize UX optimizations for Argentina mobile users
			uxOptimizationService.initialize();
			
			// Register service worker for PWA functionality
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('/sw.js')
					.then(registration => {
						console.log('[Layout] Service Worker registered:', registration);
					})
					.catch(error => {
						console.warn('[Layout] Service Worker registration failed:', error);
					});
			}
			
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

	// Navigation items
	const navItems = [
		{ href: '/', label: 'Inicio' },
		{ href: '/servicios', label: 'Servicios' },
		{ href: '/como-funciona', label: 'Cómo Funciona' },
		{ href: '/ayuda', label: 'Ayuda' }
	];

	const authItems = [
		{ href: '/login', label: 'Iniciar Sesión' },
		{ href: '/register', label: 'Registrarse' }
	];
</script>

<div class="min-h-screen bg-neutral-50 flex flex-col">
	<!-- Mobile-first header -->
	<header class="bg-white shadow-soft border-b border-neutral-200 sticky top-0 z-40">
		<div class="container-responsive">
			<div class="flex items-center justify-between h-16 md:h-20">
				<!-- Logo -->
				<a href="/" class="flex items-center space-x-2 text-brand font-heading font-bold text-xl md:text-2xl">
					<!-- Replace with actual logo when available -->
					<div class="w-8 h-8 md:w-10 md:h-10 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
						B
					</div>
					<span class="hidden sm:block">BarberPro</span>
				</a>

				<!-- Desktop Navigation -->
				<nav class="hidden md:flex items-center space-x-8">
					{#each navItems as item}
						<a
							href={item.href}
							class="text-neutral-600 hover:text-brand transition-colors duration-200 font-medium"
							class:text-brand={$page.url.pathname === item.href}
						>
							{item.label}
						</a>
					{/each}
				</nav>

				<!-- Desktop Auth/User Menu -->
				<div class="hidden md:flex items-center space-x-4">
					{#if $isAuthenticated && $user}
						<!-- User Menu -->
						<div class="relative">
							<button
								type="button"
								class="flex items-center space-x-2 text-neutral-600 hover:text-brand transition-colors duration-200 font-medium"
							>
								{#if $user.avatar}
									<img src={$user.avatar} alt="Avatar" class="w-8 h-8 rounded-full object-cover" />
								{:else}
									<div class="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-sm font-medium">
										{$user.firstName[0]}{$user.lastName[0]}
									</div>
								{/if}
								<span>{$user.firstName}</span>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
						</div>
						<a
							href="/dashboard"
							class="btn btn-primary"
						>
							Dashboard
						</a>
					{:else}
						<!-- Auth Buttons -->
						<a
							href="/login"
							class="text-neutral-600 hover:text-brand transition-colors duration-200 font-medium"
						>
							Iniciar Sesión
						</a>
						<a
							href="/register"
							class="btn btn-primary"
						>
							Registrarse
						</a>
					{/if}
				</div>

				<!-- Mobile menu button -->
				<button
					type="button"
					class="md:hidden mobile-nav p-2 rounded-lg hover:bg-neutral-100 transition-colors"
					aria-label="Abrir menú"
					on:click={toggleMobileMenu}
				>
					{#if mobileMenuOpen}
						<!-- X icon -->
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<!-- Hamburger icon -->
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Navigation Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden bg-white border-t border-neutral-200 animate-slide-down">
				<div class="container-responsive py-4">
					<nav class="space-y-2">
						{#each navItems as item}
							<a
								href={item.href}
								class="block py-3 px-4 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-brand transition-all font-medium"
								class:bg-primary-50={$page.url.pathname === item.href}
								class:text-brand={$page.url.pathname === item.href}
							>
								{item.label}
							</a>
						{/each}
						
						<div class="border-t border-neutral-200 pt-4 mt-4 space-y-2">
							{#each authItems as item}
								<a
									href={item.href}
									class="block py-3 px-4 rounded-lg text-center font-medium transition-all"
									class:btn-primary={item.href === '/register'}
									class:text-neutral-600={item.href === '/login'}
									class:hover:bg-neutral-100={item.href === '/login'}
									class:hover:text-brand={item.href === '/login'}
								>
									{item.label}
								</a>
							{/each}
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