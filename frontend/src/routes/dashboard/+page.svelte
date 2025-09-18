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

	// Import F13-001 Advanced User Experience components
	import PersonalizedDashboard from '$lib/components/intelligence/PersonalizedDashboard.svelte';
	import SmartRecommendationEngine from '$lib/components/intelligence/SmartRecommendationEngine.svelte';
	import IntelligentSearchInterface from '$lib/components/intelligence/IntelligentSearchInterface.svelte';
	import ProviderAnalyticsDashboard from '$lib/components/provider/ProviderAnalyticsDashboard.svelte';
	import AdvancedBookingManagement from '$lib/components/provider/AdvancedBookingManagement.svelte';
	import IntelligentCacheManager from '$lib/components/performance/IntelligentCacheManager.svelte';
	import SocialEngagementHub from '$lib/components/social/SocialEngagementHub.svelte';
	import CustomerEngagementAutomation from '$lib/components/intelligence/CustomerEngagementAutomation.svelte';

	let showUnifiedDashboard = false;
	let activeTab: 'overview' | 'analytics' | 'support' | 'intelligence' | 'social' = 'overview';
	
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
				<nav class="flex space-x-8 overflow-x-auto">
					<button
						on:click={() => activeTab = 'overview'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap
							{activeTab === 'overview'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>🏠</span>
						<span>Resumen</span>
					</button>

					<button
						on:click={() => activeTab = 'intelligence'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap
							{activeTab === 'intelligence'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>🧠</span>
						<span>Experiencia Inteligente</span>
					</button>

					<button
						on:click={() => activeTab = 'analytics'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap
							{activeTab === 'analytics'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>📊</span>
						<span>Analytics Avanzados</span>
					</button>

					<button
						on:click={() => activeTab = 'social'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap
							{activeTab === 'social'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						<span>🌟</span>
						<span>Social & Growth</span>
					</button>

					<button
						on:click={() => activeTab = 'support'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap
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
				<div transition:fade>
					<!-- F13-001 Personalized Dashboard for Admin/Manager -->
					{#if $user.role === 'customer'}
						<PersonalizedDashboard user={$user} />
					{:else}
						<!-- Executive Dashboard for admin/providers -->
						<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
							<!-- Key Metrics with F13-001 Intelligence -->
							<div class="lg:col-span-3 space-y-6">
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

								<!-- F13-001 Intelligent Search for Admin -->
								<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 class="text-lg font-semibold text-gray-900 mb-4">Búsqueda Inteligente de Sistema</h3>
									<IntelligentSearchInterface
										placeholder="Buscar usuarios, reservas, proveedores, métricas..."
										contextualFilters={[
											{ id: 'date', label: 'Fecha', value: 'última semana' },
											{ id: 'type', label: 'Tipo', value: 'todos' }
										]}
										personalizedRanking={false}
									/>
								</div>
							</div>

							<!-- System Health & Intelligence -->
							<div class="space-y-6">
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

								<CustomerHealthWidget
									userId={$user.id}
									compact={false}
								/>
							</div>
						</div>
					{/if}
				</div>

			{:else if activeTab === 'intelligence'}
				<div transition:fade>
					<!-- F13-001 Intelligent Customer Experience & Provider Excellence -->
					<div class="space-y-8">
						<div class="text-center mb-8">
							<h2 class="text-3xl font-bold text-gray-900 mb-4">Experiencia Inteligente F13-001</h2>
							<p class="text-lg text-gray-600">
								Sistema avanzado de personalización, recomendaciones ML y gestión inteligente
							</p>
						</div>

						{#if $user.role === 'customer'}
							<!-- Customer Intelligence Interface -->
							<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
								<div class="xl:col-span-2">
									<SmartRecommendationEngine
										user={$user}
										context="dashboard"
										maxRecommendations={6}
									/>
								</div>
								<div>
									<CustomerHealthWidget userId={$user.id} compact={false} />
								</div>
							</div>
						{:else if $user.role === 'provider'}
							<!-- Provider Excellence Platform -->
							<div class="space-y-8">
								<ProviderAnalyticsDashboard providerId={$user.id} />
								<AdvancedBookingManagement providerId={$user.id} />
							</div>
						{:else}
							<!-- Admin Intelligence Overview -->
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
								<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 class="text-xl font-semibold text-gray-900 mb-4">Sistema de Recomendaciones ML</h3>
									<div class="space-y-4">
										<div class="flex justify-between">
											<span class="text-gray-600">Precisión del Modelo</span>
											<span class="font-bold text-green-600">94.7%</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Engagement Rate</span>
											<span class="font-bold text-blue-600">+68%</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Conversiones</span>
											<span class="font-bold text-purple-600">+45%</span>
										</div>
									</div>
								</div>

								<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 class="text-xl font-semibold text-gray-900 mb-4">Performance Intelligence</h3>
									<div class="space-y-4">
										<div class="flex justify-between">
											<span class="text-gray-600">Cache Hit Rate</span>
											<span class="font-bold text-green-600">89.2%</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Mobile App Usage</span>
											<span class="font-bold text-blue-600">2,847</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Offline Sync Success</span>
											<span class="font-bold text-purple-600">98.1%</span>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

			{:else if activeTab === 'analytics'}
				<div transition:fade>
					<BusinessOperationsDashboard
						userRole={$user.role === 'admin' ? 'executive' : 'manager'}
						refreshInterval={30000}
					/>
				</div>

			{:else if activeTab === 'social'}
				<div transition:fade>
					<!-- F13-001 Social Features & Viral Growth -->
					{#if $user.role === 'customer'}
						<SocialEngagementHub user={$user} />
					{:else}
						<div class="text-center py-12">
							<div class="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
								<span class="text-4xl">🌟</span>
							</div>
							<h3 class="text-2xl font-bold text-gray-900 mb-4">
								Plataforma Social y Crecimiento Viral
							</h3>
							<p class="text-gray-600 max-w-2xl mx-auto mb-8">
								Sistema completo de gamificación, referencias y engagement comunitario
								diseñado para impulsar el crecimiento viral y la retención de usuarios.
							</p>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
								<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<div class="text-3xl mb-3">🏆</div>
									<h4 class="font-semibold text-gray-900 mb-2">Sistema de Logros</h4>
									<p class="text-sm text-gray-600">Gamificación avanzada con insignias, niveles y recompensas</p>
								</div>
								<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<div class="text-3xl mb-3">📱</div>
									<h4 class="font-semibold text-gray-900 mb-2">Referencias Virales</h4>
									<p class="text-sm text-gray-600">Sistema de códigos de referencia con integración social</p>
								</div>
								<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<div class="text-3xl mb-3">👥</div>
									<h4 class="font-semibold text-gray-900 mb-2">Comunidad Activa</h4>
									<p class="text-sm text-gray-600">Feed social, desafíos y engagement automation</p>
								</div>
							</div>
						</div>
					{/if}
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

		<!-- F13-001 Background Components -->
		<IntelligentCacheManager />
		<CustomerEngagementAutomation user={$user} />
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