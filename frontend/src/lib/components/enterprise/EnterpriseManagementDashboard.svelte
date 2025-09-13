<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Chart from 'chart.js/auto';
	import { formatDistance } from 'date-fns';
	import { es } from 'date-fns/locale';
	import Card from '../Card.svelte';
	import Loading from '../Loading.svelte';
	import Button from '../Button.svelte';
	import Modal from '../Modal.svelte';
	
	export let tenantId: string;
	export let permissions: string[] = [];
	
	// Enterprise dashboard state
	let loading = true;
	let error: string | null = null;
	let activeTab = 'overview';
	let showBulkActions = false;
	let selectedUsers: string[] = [];
	
	// Dashboard data stores
	const dashboardData = writable({
		overview: {
			totalLocations: 0,
			activeUsers: 0,
			monthlyRevenue: 0,
			bookingsToday: 0,
			performanceMetrics: {
				avgResponseTime: 0,
				uptime: 0,
				satisfactionScore: 0
			}
		},
		locations: [],
		users: [],
		analytics: {
			revenueChart: null,
			userGrowthChart: null,
			bookingTrendsChart: null
		},
		billing: {
			currentPlan: 'Enterprise Plus',
			monthlySpend: 0,
			upcomingInvoices: [],
			paymentMethods: []
		},
		compliance: {
			auditLogs: [],
			complianceScore: 0,
			lastAudit: null
		}
	});
	
	// Chart instances
	let revenueChart: Chart | null = null;
	let userGrowthChart: Chart | null = null;
	let bookingTrendsChart: Chart | null = null;
	
	onMount(async () => {
		try {
			await loadEnterpriseDashboard();
			initializeCharts();
		} catch (err) {
			error = 'Error al cargar el dashboard empresarial';
			console.error('Enterprise dashboard error:', err);
		} finally {
			loading = false;
		}
	});
	
	async function loadEnterpriseDashboard() {
		const response = await fetch(`/api/enterprise/dashboard/${tenantId}`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
			}
		});
		
		if (!response.ok) {
			throw new Error('Failed to load enterprise dashboard');
		}
		
		const data = await response.json();
		dashboardData.set(data);
	}
	
	function initializeCharts() {
		// Initialize revenue chart
		const revenueCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
		if (revenueCtx) {
			revenueChart = new Chart(revenueCtx, {
				type: 'line',
				data: {
					labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
					datasets: [{
						label: 'Ingresos (ARS)',
						data: [65000, 75000, 85000, 95000, 105000, 125000],
						borderColor: '#10b981',
						backgroundColor: '#10b981',
						tension: 0.4
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							grid: {
								color: '#f3f4f6'
							}
						},
						x: {
							grid: {
								display: false
							}
						}
					}
				}
			});
		}
		
		// Initialize user growth chart
		const userGrowthCtx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
		if (userGrowthCtx) {
			userGrowthChart = new Chart(userGrowthCtx, {
				type: 'bar',
				data: {
					labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
					datasets: [
						{
							label: 'Nuevos Usuarios',
							data: [12, 19, 15, 25, 22, 18, 8],
							backgroundColor: '#3b82f6'
						},
						{
							label: 'Usuarios Activos',
							data: [145, 168, 152, 180, 175, 162, 98],
							backgroundColor: '#10b981'
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'bottom'
						}
					}
				}
			});
		}
	}
	
	async function handleBulkUserAction(action: string) {
		if (selectedUsers.length === 0) return;
		
		try {
			const response = await fetch('/api/enterprise/users/bulk', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					action,
					userIds: selectedUsers,
					tenantId
				})
			});
			
			if (response.ok) {
				selectedUsers = [];
				showBulkActions = false;
				await loadEnterpriseDashboard();
			}
		} catch (err) {
			console.error('Bulk action error:', err);
		}
	}
	
	function toggleUserSelection(userId: string) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter(id => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}
	
	function hasPermission(permission: string): boolean {
		return permissions.includes(permission) || permissions.includes('admin');
	}
</script>

<div class="enterprise-dashboard space-y-6">
	<!-- Header -->
	<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Dashboard Empresarial</h1>
			<p class="text-neutral-600 mt-1">Gestión centralizada de múltiples ubicaciones y equipos</p>
		</div>
		
		{#if hasPermission('bulk_operations')}
		<div class="flex items-center space-x-3">
			{#if selectedUsers.length > 0}
				<Button 
					variant="secondary" 
					size="sm"
					on:click={() => showBulkActions = true}
				>
					Acciones Masivas ({selectedUsers.length})
				</Button>
			{/if}
			
			<Button variant="primary" size="sm">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Nueva Ubicación
			</Button>
		</div>
		{/if}
	</div>

	{#if loading}
		<Loading message="Cargando dashboard empresarial..." />
	{:else if error}
		<Card>
			<div class="text-center py-8">
				<div class="text-red-600 text-lg font-medium">{error}</div>
				<Button variant="secondary" size="sm" class="mt-4" on:click={() => window.location.reload()}>
					Recargar Dashboard
				</Button>
			</div>
		</Card>
	{:else}
		<!-- Navigation Tabs -->
		<div class="border-b border-neutral-200">
			<nav class="-mb-px flex space-x-8 overflow-x-auto">
				{#each [
					{ id: 'overview', label: 'Resumen', icon: 'chart-bar' },
					{ id: 'locations', label: 'Ubicaciones', icon: 'location-marker' },
					{ id: 'users', label: 'Usuarios', icon: 'users' },
					{ id: 'analytics', label: 'Analíticas', icon: 'trending-up' },
					{ id: 'billing', label: 'Facturación', icon: 'credit-card' },
					{ id: 'compliance', label: 'Cumplimiento', icon: 'shield-check' }
				] as tab}
					<button
						class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
						class:border-brand={activeTab === tab.id}
						class:text-brand={activeTab === tab.id}
						class:border-transparent={activeTab !== tab.id}
						class:text-neutral-500={activeTab !== tab.id}
						class:hover:text-neutral-700={activeTab !== tab.id}
						class:hover:border-neutral-300={activeTab !== tab.id}
						on:click={() => activeTab = tab.id}
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>

		<!-- Tab Content -->
		<div class="mt-6">
			{#if activeTab === 'overview'}
				{#if $dashboardData}
				<!-- KPI Cards -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<Card>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v9" />
									</svg>
								</div>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-neutral-600">Ubicaciones Activas</p>
								<p class="text-2xl font-bold text-neutral-900">{$dashboardData.overview.totalLocations}</p>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								</div>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-neutral-600">Usuarios Activos</p>
								<p class="text-2xl font-bold text-neutral-900">{$dashboardData.overview.activeUsers.toLocaleString()}</p>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
									</svg>
								</div>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-neutral-600">Ingresos Mensuales</p>
								<p class="text-2xl font-bold text-neutral-900">ARS ${$dashboardData.overview.monthlyRevenue.toLocaleString()}</p>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m0 0v1a2 2 0 01-2 2H10a2 2 0 01-2-2V7" />
									</svg>
								</div>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-neutral-600">Reservas Hoy</p>
								<p class="text-2xl font-bold text-neutral-900">{$dashboardData.overview.bookingsToday}</p>
							</div>
						</div>
					</Card>
				</div>
				
				<!-- Performance Metrics -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
					<Card class="col-span-1">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Métricas de Rendimiento</h3>
						<div class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Tiempo de Respuesta</span>
								<span class="font-medium text-green-600">{$dashboardData.overview.performanceMetrics.avgResponseTime}ms</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Tiempo de Actividad</span>
								<span class="font-medium text-green-600">{$dashboardData.overview.performanceMetrics.uptime}%</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-neutral-600">Satisfacción</span>
								<span class="font-medium text-green-600">{$dashboardData.overview.performanceMetrics.satisfactionScore}/5</span>
							</div>
						</div>
					</Card>
					
					<Card class="col-span-2">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Tendencia de Ingresos</h3>
						<div class="h-64">
							<canvas id="revenueChart"></canvas>
						</div>
					</Card>
				</div>
				{/if}
			{:else if activeTab === 'users'}
				<!-- User Management Interface -->
				<Card>
					<div class="flex justify-between items-center mb-6">
						<h3 class="text-lg font-semibold text-neutral-900">Gestión de Usuarios</h3>
						
						{#if hasPermission('user_management')}
						<div class="flex items-center space-x-3">
							<div class="relative">
								<input
									type="text"
									placeholder="Buscar usuarios..."
									class="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								/>
								<svg class="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
							
							<Button variant="primary" size="sm">
								Invitar Usuario
							</Button>
						</div>
						{/if}
					</div>
					
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-neutral-200">
							<thead class="bg-neutral-50">
								<tr>
									{#if hasPermission('bulk_operations')}
									<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
										<input type="checkbox" class="rounded" />
									</th>
									{/if}
									<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Usuario</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Rol</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ubicación</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Último Acceso</th>
									<th class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-neutral-200">
								{#each $dashboardData.users as user}
								<tr class="hover:bg-neutral-50">
									{#if hasPermission('bulk_operations')}
									<td class="px-6 py-4 whitespace-nowrap">
										<input 
											type="checkbox" 
											class="rounded"
											checked={selectedUsers.includes(user.id)}
											on:change={() => toggleUserSelection(user.id)}
										/>
									</td>
									{/if}
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div class="flex-shrink-0 h-10 w-10">
												{#if user.avatar}
													<img class="h-10 w-10 rounded-full object-cover" src={user.avatar} alt="{user.name}" />
												{:else}
													<div class="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white font-medium">
														{user.name.charAt(0)}
													</div>
												{/if}
											</div>
											<div class="ml-4">
												<div class="text-sm font-medium text-neutral-900">{user.name}</div>
												<div class="text-sm text-neutral-500">{user.email}</div>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{user.role}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
										{user.location || 'Todas'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
											class:bg-green-100={user.status === 'active'}
											class:text-green-800={user.status === 'active'}
											class:bg-yellow-100={user.status === 'pending'}
											class:text-yellow-800={user.status === 'pending'}
											class:bg-red-100={user.status === 'inactive'}
											class:text-red-800={user.status === 'inactive'}
										>
											{#if user.status === 'active'}Activo{:else if user.status === 'pending'}Pendiente{:else}Inactivo{/if}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
										{formatDistance(new Date(user.lastLogin), new Date(), { addSuffix: true, locale: es })}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button class="text-brand hover:text-brand-dark">Editar</button>
									</td>
								</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</Card>
			{:else if activeTab === 'analytics'}
				<!-- Analytics Dashboard -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Crecimiento de Usuarios</h3>
						<div class="h-64">
							<canvas id="userGrowthChart"></canvas>
						</div>
					</Card>
					
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Métricas Clave</h3>
						<div class="space-y-4">
							<div class="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
								<span class="font-medium">Tasa de Conversión</span>
								<span class="text-green-600 font-bold">24.6%</span>
							</div>
							<div class="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
								<span class="font-medium">ARPU (ARS)</span>
								<span class="text-green-600 font-bold">$2,450</span>
							</div>
							<div class="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
								<span class="font-medium">Retención (30d)</span>
								<span class="text-green-600 font-bold">87.3%</span>
							</div>
							<div class="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
								<span class="font-medium">NPS Score</span>
								<span class="text-green-600 font-bold">72</span>
							</div>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'billing'}
				<!-- Enterprise Billing Interface -->
				<div class="space-y-6">
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Plan Actual y Facturación</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div class="text-center p-6 border rounded-lg">
								<h4 class="font-semibold text-lg">{$dashboardData.billing.currentPlan}</h4>
								<p class="text-3xl font-bold text-brand mt-2">ARS ${$dashboardData.billing.monthlySpend.toLocaleString()}</p>
								<p class="text-sm text-neutral-600 mt-1">Por mes</p>
							</div>
							
							<div class="col-span-2 space-y-4">
								<h5 class="font-medium">Próximas Facturas</h5>
								{#each $dashboardData.billing.upcomingInvoices as invoice}
								<div class="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
									<div>
										<span class="font-medium">{invoice.description}</span>
										<p class="text-sm text-neutral-600">Vence: {new Date(invoice.dueDate).toLocaleDateString('es-AR')}</p>
									</div>
									<span class="font-bold">ARS ${invoice.amount.toLocaleString()}</span>
								</div>
								{/each}
							</div>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'compliance'}
				<!-- Compliance Dashboard -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-900 mb-4">Estado de Cumplimiento</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="text-center p-6 border rounded-lg">
							<div class="text-4xl font-bold text-green-600">{$dashboardData.compliance.complianceScore}%</div>
							<p class="text-sm text-neutral-600 mt-1">Score de Cumplimiento</p>
						</div>
						
						<div>
							<h5 class="font-medium mb-3">Últimas Auditorías</h5>
							{#each $dashboardData.compliance.auditLogs.slice(0, 5) as log}
							<div class="flex justify-between items-center py-2 border-b">
								<span class="text-sm">{log.action}</span>
								<span class="text-xs text-neutral-500">{formatDistance(new Date(log.timestamp), new Date(), { addSuffix: true, locale: es })}</span>
							</div>
							{/each}
						</div>
					</div>
				</Card>
			{/if}
		</div>
	{/if}
</div>

<!-- Bulk Actions Modal -->
{#if showBulkActions}
<Modal 
	title="Acciones Masivas" 
	on:close={() => showBulkActions = false}
	size="md"
>
	<div class="space-y-4">
		<p class="text-neutral-600">Seleccionaste {selectedUsers.length} usuarios. ¿Qué acción deseas realizar?</p>
		
		<div class="flex space-x-3">
			<Button variant="secondary" on:click={() => handleBulkUserAction('activate')}>
				Activar Usuarios
			</Button>
			<Button variant="secondary" on:click={() => handleBulkUserAction('deactivate')}>
				Desactivar Usuarios
			</Button>
			<Button variant="danger" on:click={() => handleBulkUserAction('delete')}>
				Eliminar Usuarios
			</Button>
		</div>
	</div>
</Modal>
{/if}

<style>
	.enterprise-dashboard {
		@apply max-w-7xl mx-auto p-6;
	}
	
	/* Mobile-first responsive design */
	@media (max-width: 768px) {
		.enterprise-dashboard {
			@apply p-4;
		}
	}
	
	/* Argentina mobile optimization */
	@media (max-width: 480px) {
		.enterprise-dashboard {
			@apply p-2;
		}
		
		/* Touch-optimized interactions */
		table td {
			@apply py-4;
		}
		
		button {
			@apply min-h-[44px];
		}
	}
</style>