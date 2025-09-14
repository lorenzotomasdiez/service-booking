<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isAuthenticated, user } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	
	// Import F11-001 Customer Experience Platform components
	import BusinessOperationsDashboard from '$lib/components/analytics/BusinessOperationsDashboard.svelte';
	import CustomerSupportInterface from '$lib/components/onboarding/CustomerSupportInterface.svelte';
	import CustomerHealthWidget from '$lib/components/analytics/CustomerHealthWidget.svelte';
	
	let showUnifiedDashboard = false;
	let activeTab: 'overview' | 'analytics' | 'support' = 'overview';
	
	onMount(() => {
		// Check if user wants unified dashboard (for admin/manager roles)
		const urlParams = new URLSearchParams($page.url.search);
		const unified = urlParams.get('unified') === 'true';
		
		if ($isAuthenticated && $user) {
			// Show unified dashboard for admin/manager or if explicitly requested
			if ($user.role === 'admin' || $user.role === 'manager' || unified) {
				showUnifiedDashboard = true;
			} else {
				// Redirect to role-specific dashboards
				if ($user.role === 'provider') {
					goto('/dashboard/provider');
				} else {
					goto('/dashboard/client');
				}
			}
		} else {
			goto('/login?redirect=' + encodeURIComponent($page.url.pathname));
		}
	});
</script>

<svelte:head>
	<title>Dashboard - BarberPro</title>
	<meta name="description" content="Gestiona tus reservas y servicios en BarberPro" />
</svelte:head>

{#if showUnifiedDashboard && $user}
	<!-- F11-001 Customer Experience Platform Unified Dashboard -->
	<div class="min-h-screen bg-gray-50" transition:fade>
		<!-- Header -->
		<div class="bg-white shadow-sm border-b border-gray-200">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="py-6">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-2xl font-bold text-gray-900">
								Panel de Control Ejecutivo
							</h1>
							<p class="text-gray-600 mt-1">
								{$user.role === 'admin' ? 'Administración completa de BarberPro' : 'Gestión y análisis de operaciones'}
							</p>
						</div>
						
						<div class="flex items-center space-x-3">
							<div class="text-sm text-gray-500">
								Última actualización: {new Date().toLocaleTimeString('es-AR')}
							</div>
							<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
								🔄 Actualizar
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Navigation Tabs -->
		<div class="bg-white border-b border-gray-200">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<nav class="flex space-x-8">
					<button
						on:click={() => activeTab = 'overview'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
							{activeTab === 'overview' 
								? 'border-blue-500 text-blue-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>🏠</span>
						<span>Resumen</span>
					</button>
					
					<button
						on:click={() => activeTab = 'analytics'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
							{activeTab === 'analytics' 
								? 'border-blue-500 text-blue-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>📊</span>
						<span>Business Intelligence</span>
					</button>
					
					<button
						on:click={() => activeTab = 'support'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
							{activeTab === 'support' 
								? 'border-blue-500 text-blue-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>🎧</span>
						<span>Customer Success</span>
					</button>
				</nav>
			</div>
		</div>
		
		<!-- Tab Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{#if activeTab === 'overview'}
				<div class="grid grid-cols-1 lg:grid-cols-4 gap-6" transition:fade>
					<!-- Key Metrics -->
					<div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div class="flex items-center">
								<div class="p-3 bg-blue-100 rounded-full">
									<div class="text-2xl">💼</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Proveedores Activos</p>
									<p class="text-2xl font-bold text-gray-900">2,847</p>
									<p class="text-sm text-green-600">+12% este mes</p>
								</div>
							</div>
						</div>
						
						<div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div class="flex items-center">
								<div class="p-3 bg-green-100 rounded-full">
									<div class="text-2xl">📅</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Reservas Mensuales</p>
									<p class="text-2xl font-bold text-gray-900">15,632</p>
									<p class="text-sm text-green-600">+8% este mes</p>
								</div>
							</div>
						</div>
						
						<div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
							<div class="flex items-center">
								<div class="p-3 bg-purple-100 rounded-full">
									<div class="text-2xl">💰</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Ingresos Totales</p>
									<p class="text-2xl font-bold text-gray-900">$1.2M</p>
									<p class="text-sm text-green-600">+15% este mes</p>
								</div>
							</div>
						</div>
					</div>
					
					<!-- System Health -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200">
						<div class="p-6 border-b border-gray-200">
							<h3 class="text-lg font-medium text-gray-900">Salud del Sistema</h3>
						</div>
						<div class="p-6">
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Uptime</span>
									<span class="text-sm font-medium text-green-600">99.8%</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Tiempo de Respuesta</span>
									<span class="text-sm font-medium text-green-600">138ms</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Usuarios Activos</span>
									<span class="text-sm font-medium text-blue-600">1,234</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Tickets Abiertos</span>
									<span class="text-sm font-medium text-yellow-600">23</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'analytics'}
				<div transition:fade>
					<BusinessOperationsDashboard 
						userRole={$user.role === 'admin' ? 'executive' : 'manager'}
						refreshInterval={30000}
					/>
				</div>
			{:else if activeTab === 'support'}
				<div transition:fade>
					<CustomerSupportInterface 
						userId={$user.id}
						isProvider={false}
						on:ticket-created={() => {
							alert('Ticket creado exitosamente. Se notificará al equipo de soporte.');
						}}
						on:feedback-submitted={() => {
							alert('Feedback registrado. Gracias por ayudarnos a mejorar.');
						}}
					/>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Loading state while redirecting -->
	<div class="min-h-screen flex items-center justify-center bg-neutral-50">
		<div class="text-center space-y-4">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
			<p class="text-neutral-600">Cargando dashboard...</p>
		</div>
	</div>
{/if}