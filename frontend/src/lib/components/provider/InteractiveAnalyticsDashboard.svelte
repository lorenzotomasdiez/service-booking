<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
	import { es } from 'date-fns/locale';
	import type { ChartConfiguration } from 'chart.js';

	Chart.register(...registerables);

	export let providerId: string;
	export let vertical: 'barber' | 'psychology' = 'barber';
	export let realTimeUpdates = true;

	interface AnalyticsData {
		revenue: {
			total: number;
			trend: number;
			data: Array<{date: string; amount: number}>;
		};
		bookings: {
			total: number;
			confirmed: number;
			cancelled: number;
			pending: number;
			data: Array<{date: string; count: number; status: string}>;
		};
		clients: {
			total: number;
			new: number;
			returning: number;
			retention: number;
		};
		performance: {
			averageRating: number;
			completionRate: number;
			responseTime: number;
			peakHours: Array<{hour: number; bookings: number}>;
		};
		geographic: {
			topAreas: Array<{area: string; count: number}>;
			distribution: Array<{zone: string; percentage: number}>;
		};
	}

	let analyticsData: AnalyticsData = {
		revenue: { total: 0, trend: 0, data: [] },
		bookings: { total: 0, confirmed: 0, cancelled: 0, pending: 0, data: [] },
		clients: { total: 0, new: 0, returning: 0, retention: 0 },
		performance: { averageRating: 0, completionRate: 0, responseTime: 0, peakHours: [] },
		geographic: { topAreas: [], distribution: [] }
	};

	let revenueChart: Chart | null = null;
	let bookingsChart: Chart | null = null;
	let peakHoursChart: Chart | null = null;
	let geoChart: Chart | null = null;

	let selectedPeriod: 'week' | 'month' | 'quarter' = 'month';
	let loading = true;
	let error: string | null = null;
	let refreshInterval: NodeJS.Timeout | null = null;

	// Chart canvas references
	let revenueCanvas: HTMLCanvasElement;
	let bookingsCanvas: HTMLCanvasElement;
	let peakHoursCanvas: HTMLCanvasElement;
	let geoCanvas: HTMLCanvasElement;

	onMount(async () => {
		await loadAnalyticsData();
		initializeCharts();
		
		if (realTimeUpdates) {
			refreshInterval = setInterval(loadAnalyticsData, 30000); // Update every 30s
		}
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		destroyCharts();
	});

	async function loadAnalyticsData() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`/api/providers/${providerId}/analytics?period=${selectedPeriod}`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Error al cargar datos de análisis');
			}

			analyticsData = await response.json();
			updateCharts();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
			console.error('Analytics loading error:', err);
		} finally {
			loading = false;
		}
	}

	function initializeCharts() {
		createRevenueChart();
		createBookingsChart();
		createPeakHoursChart();
		createGeographicChart();
	}

	function createRevenueChart() {
		const ctx = revenueCanvas.getContext('2d');
		if (!ctx) return;

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels: analyticsData.revenue.data.map(d => format(new Date(d.date), 'dd MMM', { locale: es })),
				datasets: [{
					label: 'Ingresos (ARS)',
					data: analyticsData.revenue.data.map(d => d.amount),
					borderColor: 'rgb(37, 99, 235)',
					backgroundColor: 'rgba(37, 99, 235, 0.1)',
					tension: 0.4,
					fill: true
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => `$${context.parsed.y.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
						}
					}
				},
				interaction: {
					intersect: false,
					mode: 'index'
				}
			}
		};

		revenueChart = new Chart(ctx, config);
	}

	function createBookingsChart() {
		const ctx = bookingsCanvas.getContext('2d');
		if (!ctx) return;

		const config: ChartConfiguration = {
			type: 'doughnut',
			data: {
				labels: ['Confirmadas', 'Pendientes', 'Canceladas'],
				datasets: [{
					data: [analyticsData.bookings.confirmed, analyticsData.bookings.pending, analyticsData.bookings.cancelled],
					backgroundColor: [
						'rgb(16, 185, 129)', // Success green
						'rgb(245, 158, 11)', // Warning yellow
						'rgb(239, 68, 68)'   // Error red
					],
					borderWidth: 0
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							usePointStyle: true,
							padding: 20
						}
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const total = context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
								const percentage = ((Number(context.parsed) / Number(total)) * 100).toFixed(1);
								return `${context.label}: ${context.parsed} (${percentage}%)`;
							}
						}
					}
				}
			}
		};

		bookingsChart = new Chart(ctx, config);
	}

	function createPeakHoursChart() {
		const ctx = peakHoursCanvas.getContext('2d');
		if (!ctx) return;

		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels: analyticsData.performance.peakHours.map(p => `${p.hour}:00`),
				datasets: [{
					label: 'Reservas por Hora',
					data: analyticsData.performance.peakHours.map(p => p.bookings),
					backgroundColor: 'rgba(37, 99, 235, 0.8)',
					borderRadius: 4
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
						ticks: {
							stepSize: 1
						}
					}
				}
			}
		};

		peakHoursChart = new Chart(ctx, config);
	}

	function createGeographicChart() {
		const ctx = geoCanvas.getContext('2d');
		if (!ctx) return;

		const config: ChartConfiguration = {
			type: 'polarArea',
			data: {
				labels: analyticsData.geographic.distribution.map(g => g.zone),
				datasets: [{
					data: analyticsData.geographic.distribution.map(g => g.percentage),
					backgroundColor: [
						'rgba(37, 99, 235, 0.8)',
						'rgba(16, 185, 129, 0.8)',
						'rgba(245, 158, 11, 0.8)',
						'rgba(239, 68, 68, 0.8)',
						'rgba(168, 85, 247, 0.8)'
					]
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							usePointStyle: true
						}
					},
					tooltip: {
						callbacks: {
							label: (context) => `${context.label}: ${context.parsed}% de clientes`
						}
					}
				}
			}
		};

		geoChart = new Chart(ctx, config);
	}

	function updateCharts() {
		if (revenueChart) {
			revenueChart.data.labels = analyticsData.revenue.data.map(d => format(new Date(d.date), 'dd MMM', { locale: es }));
			revenueChart.data.datasets[0].data = analyticsData.revenue.data.map(d => d.amount);
			revenueChart.update();
		}

		if (bookingsChart) {
			bookingsChart.data.datasets[0].data = [
				analyticsData.bookings.confirmed,
				analyticsData.bookings.pending,
				analyticsData.bookings.cancelled
			];
			bookingsChart.update();
		}

		if (peakHoursChart) {
			peakHoursChart.data.labels = analyticsData.performance.peakHours.map(p => `${p.hour}:00`);
			peakHoursChart.data.datasets[0].data = analyticsData.performance.peakHours.map(p => p.bookings);
			peakHoursChart.update();
		}

		if (geoChart) {
			geoChart.data.labels = analyticsData.geographic.distribution.map(g => g.zone);
			geoChart.data.datasets[0].data = analyticsData.geographic.distribution.map(g => g.percentage);
			geoChart.update();
		}
	}

	function destroyCharts() {
		if (revenueChart) revenueChart.destroy();
		if (bookingsChart) bookingsChart.destroy();
		if (peakHoursChart) peakHoursChart.destroy();
		if (geoChart) geoChart.destroy();
	}

	function onPeriodChange() {
		loadAnalyticsData();
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatPercentage(value: number): string {
		const sign = value > 0 ? '+' : '';
		return `${sign}${value.toFixed(1)}%`;
	}
</script>

<div class="space-y-6">
	<!-- Header with Period Selector -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h2 class="text-2xl font-bold text-neutral-800">Panel de Análisis</h2>
			<p class="text-neutral-600">
				{vertical === 'psychology' ? 'Análisis de consultas psicológicas' : 'Análisis de servicios de barbería'}
			</p>
		</div>
		
		<div class="flex items-center gap-2">
			<select 
				bind:value={selectedPeriod} 
				on:change={onPeriodChange}
				class="form-input text-sm"
			>
				<option value="week">Esta Semana</option>
				<option value="month">Este Mes</option>
				<option value="quarter">Último Trimestre</option>
			</select>
			
			{#if realTimeUpdates}
				<div class="flex items-center gap-1 text-xs text-success-600">
					<div class="w-2 h-2 bg-success-600 rounded-full animate-pulse"></div>
					En vivo
				</div>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			{#each Array(4) as _}
				<div class="card">
					<div class="card-body">
						<div class="skeleton skeleton-text mb-2"></div>
						<div class="skeleton skeleton-text-sm mb-4"></div>
						<div class="skeleton h-24"></div>
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
				<h3 class="text-lg font-semibold text-error-800 mb-2">Error al cargar datos</h3>
				<p class="text-error-600 mb-4">{error}</p>
				<button class="btn btn-primary" on:click={loadAnalyticsData}>
					Reintentar
				</button>
			</div>
		</div>
	{:else}
		<!-- Key Metrics Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			<!-- Revenue Card -->
			<div class="card card-interactive">
				<div class="card-body">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-medium text-neutral-600">Ingresos Totales</h3>
						<svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
						</svg>
					</div>
					<div class="text-2xl font-bold text-neutral-800 mb-1">
						{formatCurrency(analyticsData.revenue.total)}
					</div>
					<div class="flex items-center">
						<span class="text-sm" class:text-success-600={analyticsData.revenue.trend > 0} class:text-error-600={analyticsData.revenue.trend < 0}>
							{formatPercentage(analyticsData.revenue.trend)} vs período anterior
						</span>
					</div>
				</div>
			</div>

			<!-- Bookings Card -->
			<div class="card card-interactive">
				<div class="card-body">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-medium text-neutral-600">Reservas Totales</h3>
						<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<div class="text-2xl font-bold text-neutral-800 mb-1">
						{analyticsData.bookings.total}
					</div>
					<div class="text-sm text-neutral-600">
						{analyticsData.bookings.confirmed} confirmadas, {analyticsData.bookings.pending} pendientes
					</div>
				</div>
			</div>

			<!-- Clients Card -->
			<div class="card card-interactive">
				<div class="card-body">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-medium text-neutral-600">Clientes</h3>
						<svg class="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<div class="text-2xl font-bold text-neutral-800 mb-1">
						{analyticsData.clients.total}
					</div>
					<div class="text-sm text-neutral-600">
						{analyticsData.clients.new} nuevos, {analyticsData.clients.retention.toFixed(1)}% retención
					</div>
				</div>
			</div>

			<!-- Performance Card -->
			<div class="card card-interactive">
				<div class="card-body">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-medium text-neutral-600">Calificación Promedio</h3>
						<svg class="w-5 h-5 text-warning-600" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</div>
					<div class="text-2xl font-bold text-neutral-800 mb-1">
						{analyticsData.performance.averageRating.toFixed(1)}
					</div>
					<div class="text-sm text-neutral-600">
						{analyticsData.performance.completionRate.toFixed(1)}% tasa de finalización
					</div>
				</div>
			</div>
		</div>

		<!-- Charts Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Revenue Chart -->
			<div class="card">
				<div class="card-header">
					<h3 class="text-lg font-semibold text-neutral-800">Ingresos por Período</h3>
				</div>
				<div class="card-body">
					<div class="h-64">
						<canvas bind:this={revenueCanvas}></canvas>
					</div>
				</div>
			</div>

			<!-- Bookings Status Chart -->
			<div class="card">
				<div class="card-header">
					<h3 class="text-lg font-semibold text-neutral-800">Estado de Reservas</h3>
				</div>
				<div class="card-body">
					<div class="h-64">
						<canvas bind:this={bookingsCanvas}></canvas>
					</div>
				</div>
			</div>

			<!-- Peak Hours Chart -->
			<div class="card">
				<div class="card-header">
					<h3 class="text-lg font-semibold text-neutral-800">Horas Pico</h3>
				</div>
				<div class="card-body">
					<div class="h-64">
						<canvas bind:this={peakHoursCanvas}></canvas>
					</div>
				</div>
			</div>

			<!-- Geographic Distribution -->
			<div class="card">
				<div class="card-header">
					<h3 class="text-lg font-semibold text-neutral-800">Distribución Geográfica</h3>
				</div>
				<div class="card-body">
					<div class="h-64">
						<canvas bind:this={geoCanvas}></canvas>
					</div>
				</div>
			</div>
		</div>

		<!-- Top Areas Table -->
		<div class="card">
			<div class="card-header">
				<h3 class="text-lg font-semibold text-neutral-800">Áreas con Más Clientes</h3>
			</div>
			<div class="card-body p-0">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-neutral-200">
						<thead class="bg-neutral-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
									Área
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
									Clientes
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
									Porcentaje
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-neutral-200">
							{#each analyticsData.geographic.topAreas as area, index}
								<tr class="hover:bg-neutral-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div class="w-2 h-2 rounded-full mr-3" 
												class:bg-primary-600={index === 0}
												class:bg-success-600={index === 1}
												class:bg-warning-600={index === 2}
												class:bg-error-600={index === 3}
												class:bg-purple-600={index === 4}
											></div>
											<span class="text-sm font-medium text-neutral-800">{area.area}</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
										{area.count}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
										{((area.count / analyticsData.clients.total) * 100).toFixed(1)}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>