<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore, isAuthenticated, user, isProvider, isClient } from '$lib/stores/auth';
	import { OnboardingFlow } from '$lib/components';
	import { onMount } from 'svelte';
	
	let sidebarOpen = false;
	let showOnboarding = false;

	onMount(() => {
		// Verify authentication on mount
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}

		// Check if onboarding should be shown
		const onboardingCompleted = localStorage.getItem('onboarding_completed');
		if (!onboardingCompleted && $user && !$user.isProfileComplete) {
			// Show onboarding after a brief delay to let the dashboard load
			setTimeout(() => {
				showOnboarding = true;
			}, 1000);
		}
	});

	function handleOnboardingComplete() {
		showOnboarding = false;
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	async function handleLogout() {
		await authStore.logout();
	}

	// Navigation items based on user role
	$: navigationItems = $isProvider ? [
		{
			name: 'Dashboard',
			href: '/dashboard/provider',
			icon: 'home',
			current: $page.url.pathname === '/dashboard/provider'
		},
		{
			name: 'Servicios',
			href: '/dashboard/provider/services',
			icon: 'scissors',
			current: $page.url.pathname.startsWith('/dashboard/provider/services')
		},
		{
			name: 'Reservas',
			href: '/dashboard/provider/bookings',
			icon: 'calendar',
			current: $page.url.pathname.startsWith('/dashboard/provider/bookings')
		},
		{
			name: 'Clientes',
			href: '/dashboard/provider/clients',
			icon: 'users',
			current: $page.url.pathname.startsWith('/dashboard/provider/clients')
		},
		{
			name: 'Horarios',
			href: '/dashboard/provider/schedule',
			icon: 'clock',
			current: $page.url.pathname.startsWith('/dashboard/provider/schedule')
		},
		{
			name: 'Análisis',
			href: '/dashboard/provider/analytics',
			icon: 'chart',
			current: $page.url.pathname.startsWith('/dashboard/provider/analytics')
		},
		{
			name: 'Perfil',
			href: '/dashboard/provider/profile',
			icon: 'user',
			current: $page.url.pathname.startsWith('/dashboard/provider/profile')
		}
	] : [
		{
			name: 'Dashboard',
			href: '/dashboard/client',
			icon: 'home',
			current: $page.url.pathname === '/dashboard/client'
		},
		{
			name: 'Mis Reservas',
			href: '/dashboard/client/bookings',
			icon: 'calendar',
			current: $page.url.pathname.startsWith('/dashboard/client/bookings')
		},
		{
			name: 'Favoritos',
			href: '/dashboard/client/favorites',
			icon: 'heart',
			current: $page.url.pathname.startsWith('/dashboard/client/favorites')
		},
		{
			name: 'Historial',
			href: '/dashboard/client/history',
			icon: 'clock',
			current: $page.url.pathname.startsWith('/dashboard/client/history')
		},
		{
			name: 'Perfil',
			href: '/dashboard/client/profile',
			icon: 'user',
			current: $page.url.pathname.startsWith('/dashboard/client/profile')
		}
	];

	function getIconSvg(iconName: string): string {
		const icons: Record<string, string> = {
			home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
			scissors: 'M7 17l-3-3 3-3m0 6l3-3-3-3m6 0l3 3-3 3',
			calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z',
			clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
			chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
			heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
		};
		return icons[iconName] || icons.home;
	}
</script>

{#if $isAuthenticated && $user}
	<div class="min-h-screen bg-neutral-50 flex">
		<!-- Sidebar -->
		<div class="hidden lg:flex lg:flex-shrink-0">
			<div class="flex flex-col w-64">
				<div class="flex flex-col h-0 flex-1 bg-white border-r border-neutral-200">
					<!-- Sidebar header -->
					<div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
						<div class="flex items-center flex-shrink-0 px-4">
							<a href="/" class="flex items-center space-x-2">
								<div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
									B
								</div>
								<span class="text-xl font-bold text-neutral-800">BarberPro</span>
							</a>
						</div>
						
						<!-- User info -->
						<div class="mt-6 px-4">
							<div class="flex items-center">
								{#if $user.avatar}
									<img class="h-10 w-10 rounded-full object-cover" src={$user.avatar} alt="Avatar" />
								{:else}
									<div class="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white font-medium">
										{$user.firstName[0]}{$user.lastName[0]}
									</div>
								{/if}
								<div class="ml-3">
									<p class="text-sm font-medium text-neutral-700">
										{$user.firstName} {$user.lastName}
									</p>
									<p class="text-xs text-neutral-500">
										{$isProvider ? 'Profesional' : 'Cliente'}
									</p>
								</div>
							</div>
						</div>

						<!-- Navigation -->
						<nav class="mt-8 flex-1 px-2 space-y-1">
							{#each navigationItems as item}
								<a
									href={item.href}
									class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
									class:bg-primary-100={item.current}
									class:text-brand={item.current}
									class:text-neutral-600={!item.current}
									class:hover:bg-neutral-100={!item.current}
									class:hover:text-neutral-900={!item.current}
								>
									<svg
										class="mr-3 h-5 w-5 flex-shrink-0"
										class:text-brand={item.current}
										class:text-neutral-400={!item.current}
										class:group-hover:text-neutral-500={!item.current}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={getIconSvg(item.icon)}
										/>
									</svg>
									{item.name}
								</a>
							{/each}
						</nav>
					</div>

					<!-- Sidebar footer -->
					<div class="flex-shrink-0 flex border-t border-neutral-200 p-4">
						<button
							on:click={handleLogout}
							class="flex-shrink-0 w-full group block"
						>
							<div class="flex items-center">
								<svg class="inline-block h-5 w-5 text-neutral-400 group-hover:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<div class="ml-3">
									<p class="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
										Cerrar Sesión
									</p>
								</div>
							</div>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Mobile sidebar -->
		{#if sidebarOpen}
			<div class="fixed inset-0 flex z-40 lg:hidden">
				<div class="fixed inset-0 bg-neutral-600 bg-opacity-75" on:click={toggleSidebar}></div>
				<div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
					<!-- Close button -->
					<div class="absolute top-0 right-0 -mr-12 pt-2">
						<button
							type="button"
							class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
							on:click={toggleSidebar}
						>
							<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Mobile sidebar content -->
					<div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
						<div class="flex items-center flex-shrink-0 px-4">
							<div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
								B
							</div>
							<span class="ml-2 text-xl font-bold text-neutral-800">BarberPro</span>
						</div>

						<!-- Mobile user info -->
						<div class="mt-6 px-4">
							<div class="flex items-center">
								{#if $user.avatar}
									<img class="h-10 w-10 rounded-full object-cover" src={$user.avatar} alt="Avatar" />
								{:else}
									<div class="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white font-medium">
										{$user.firstName[0]}{$user.lastName[0]}
									</div>
								{/if}
								<div class="ml-3">
									<p class="text-sm font-medium text-neutral-700">
										{$user.firstName} {$user.lastName}
									</p>
									<p class="text-xs text-neutral-500">
										{$isProvider ? 'Profesional' : 'Cliente'}
									</p>
								</div>
							</div>
						</div>

						<!-- Mobile navigation -->
						<nav class="mt-8 px-2 space-y-1">
							{#each navigationItems as item}
								<a
									href={item.href}
									class="group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors"
									class:bg-primary-100={item.current}
									class:text-brand={item.current}
									class:text-neutral-600={!item.current}
									class:hover:bg-neutral-100={!item.current}
									class:hover:text-neutral-900={!item.current}
									on:click={toggleSidebar}
								>
									<svg
										class="mr-4 h-6 w-6 flex-shrink-0"
										class:text-brand={item.current}
										class:text-neutral-400={!item.current}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={getIconSvg(item.icon)}
										/>
									</svg>
									{item.name}
								</a>
							{/each}
						</nav>
					</div>

					<!-- Mobile logout -->
					<div class="flex-shrink-0 flex border-t border-neutral-200 p-4">
						<button
							on:click={handleLogout}
							class="flex-shrink-0 w-full group block"
						>
							<div class="flex items-center">
								<svg class="inline-block h-6 w-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<div class="ml-3">
									<p class="text-base font-medium text-neutral-700">
										Cerrar Sesión
									</p>
								</div>
							</div>
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main content -->
		<div class="flex flex-col w-0 flex-1 overflow-hidden">
			<!-- Mobile header -->
			<div class="lg:hidden">
				<div class="flex items-center justify-between bg-white border-b border-neutral-200 px-4 py-3">
					<button
						type="button"
						class="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900"
						on:click={toggleSidebar}
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
					<div class="flex items-center space-x-2">
						<div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
							B
						</div>
						<span class="text-xl font-bold text-neutral-800">BarberPro</span>
					</div>
					<div class="w-12"></div>
				</div>
			</div>

			<!-- Page content -->
			<main class="flex-1 relative overflow-y-auto focus:outline-none">
				<div class="py-6">
					<slot />
				</div>
			</main>
		</div>
	</div>
{:else}
	<!-- Loading or not authenticated -->
	<div class="min-h-screen flex items-center justify-center bg-neutral-50">
		<div class="text-center">
			<div class="skeleton skeleton-avatar mx-auto mb-4"></div>
			<div class="skeleton skeleton-text mx-auto mb-2" style="width: 200px;"></div>
			<div class="skeleton skeleton-text-sm mx-auto" style="width: 150px;"></div>
		</div>
	</div>
{/if}

<!-- Onboarding Flow -->
<OnboardingFlow 
	bind:open={showOnboarding} 
	on:complete={handleOnboardingComplete}
/>