<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import type { Provider, BusinessMetrics, RevenueData, CustomerInsight } from '$lib/types';

	export let providerId: string;

	// Analytics state
	const businessMetrics = writable<BusinessMetrics>({});
	const revenueData = writable<RevenueData[]>([]);
	const customerInsights = writable<CustomerInsight[]>([]);
	const growthInsights = writable<any>({});
	const competitiveAnalysis = writable<any>({});
	const loading = writable(true);

	// Time range for analytics
	const timeRange = writable('30d');
	const availableRanges = [
		{ value: '7d', label: 'Últimos 7 días' },
		{ value: '30d', label: 'Últimos 30 días' },
		{ value: '90d', label: 'Últimos 3 meses' },
		{ value: '12m', label: 'Último año' }
	];

	// Business Intelligence Engine
	class BusinessIntelligenceEngine {
		private providerId: string;
		private analytics: any = {};

		constructor(providerId: string) {
			this.providerId = providerId;
		}

		async loadAnalytics(period: string) {
			loading.set(true);

			try {
				const response = await fetch(`/api/providers/${this.providerId}/analytics?period=${period}`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					}
				});

				if (response.ok) {
					this.analytics = await response.json();
					this.processAnalyticsData();
					console.log('[BusinessIntelligenceEngine] Analytics loaded');
				}
			} catch (error) {
				console.error('[BusinessIntelligenceEngine] Failed to load analytics:', error);
			} finally {
				loading.set(false);
			}
		}

		private processAnalyticsData() {
			// Process business metrics
			businessMetrics.set({
				totalRevenue: this.analytics.revenue?.total || 0,
				revenueGrowth: this.analytics.revenue?.growth || 0,
				totalBookings: this.analytics.bookings?.total || 0,
				bookingGrowth: this.analytics.bookings?.growth || 0,
				averageRating: this.analytics.rating?.average || 0,
				ratingTrend: this.analytics.rating?.trend || 0,
				customerRetention: this.analytics.customers?.retention || 0,
				newCustomers: this.analytics.customers?.new || 0,
				conversionRate: this.analytics.conversion?.rate || 0,
				averageBookingValue: this.analytics.revenue?.averageBookingValue || 0
			});

			// Process revenue data for charts
			revenueData.set(this.analytics.revenue?.timeline || []);

			// Process customer insights
			customerInsights.set(this.analytics.customers?.insights || []);

			// Process growth insights
			growthInsights.set({
				opportunities: this.analytics.growth?.opportunities || [],
				recommendations: this.analytics.growth?.recommendations || [],
				trends: this.analytics.growth?.trends || [],
				benchmarks: this.analytics.growth?.benchmarks || {}
			});

			// Process competitive analysis
			competitiveAnalysis.set({
				marketPosition: this.analytics.competition?.position || 0,
				pricingComparison: this.analytics.competition?.pricing || [],
				serviceGaps: this.analytics.competition?.gaps || [],
				strengths: this.analytics.competition?.strengths || []
			});
		}

		async exportAnalytics(format: 'pdf' | 'excel') {
			try {
				const response = await fetch(`/api/providers/${this.providerId}/analytics/export`, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						format,
						period: timeRange,
						includeCharts: true,
						includeRecommendations: true
					})
				});

				if (response.ok) {
					const blob = await response.blob();
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `analytics-${this.providerId}-${new Date().toISOString().split('T')[0]}.${format}`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
				}
			} catch (error) {
				console.error('[BusinessIntelligenceEngine] Export failed:', error);
			}
		}
	}

	let biEngine: BusinessIntelligenceEngine;

	// Computed metrics
	const kpiCards = derived(
		businessMetrics,
		($metrics) => [
			{
				title: 'Ingresos Totales',
				value: new Intl.NumberFormat('es-AR', {
					style: 'currency',
					currency: 'ARS'
				}).format($metrics.totalRevenue || 0),
				change: $metrics.revenueGrowth || 0,
				icon: 'currency',
				color: 'green'
			},
			{
				title: 'Reservas',
				value: $metrics.totalBookings || 0,
				change: $metrics.bookingGrowth || 0,
				icon: 'calendar',
				color: 'blue'
			},
			{
				title: 'Puntuación Promedio',
				value: ($metrics.averageRating || 0).toFixed(1) + '/5',
				change: $metrics.ratingTrend || 0,
				icon: 'star',
				color: 'yellow'
			},
			{
				title: 'Retención de Clientes',
				value: Math.round($metrics.customerRetention || 0) + '%',
				change: 0,
				icon: 'users',
				color: 'purple'
			}
		]
	);

	// Chart configurations
	function formatRevenueChart(data: RevenueData[]) {
		return {
			labels: data.map(d => new Date(d.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })),
			datasets: [{
				label: 'Ingresos Diarios',
				data: data.map(d => d.amount),
				borderColor: 'rgb(59, 130, 246)',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				tension: 0.4,
				fill: true
			}]
		};
	}

	function formatCustomerChart(insights: CustomerInsight[]) {
		const demographics = insights.find(i => i.type === 'demographics');
		if (!demographics) return null;

		return {
			labels: demographics.data.map(d => d.label),
			datasets: [{
				data: demographics.data.map(d => d.value),
				backgroundColor: [
					'#FF6384',
					'#36A2EB',
					'#FFCE56',
					'#4BC0C0',
					'#9966FF'
				]
			}]
		};
	}

	// Handle time range change
	function handleTimeRangeChange(newRange: string) {
		timeRange.set(newRange);
		biEngine.loadAnalytics(newRange);
	}

	// Format change percentage
	function formatChange(change: number): string {
		const sign = change >= 0 ? '+' : '';
		return `${sign}${change.toFixed(1)}%`;
	}

	// Get change color class
	function getChangeColorClass(change: number): string {
		if (change > 0) return 'text-green-600';
		if (change < 0) return 'text-red-600';
		return 'text-neutral-500';
	}

	onMount(async () => {
		biEngine = new BusinessIntelligenceEngine(providerId);
		await biEngine.loadAnalytics($timeRange);
	});

	// Handle export
	function handleExport(format: 'pdf' | 'excel') {
		biEngine.exportAnalytics(format);
	}
</script>

<div class="provider-analytics-dashboard">
	<!-- Dashboard Header -->
	<div class="dashboard-header bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
		<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
			<div class="mb-4 lg:mb-0">
				<h1 class="text-2xl font-bold text-neutral-800 mb-2">Panel de Análisis de Negocio</h1>
				<p class="text-neutral-600">Información inteligente para hacer crecer tu negocio</p>
			</div>

			<div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
				<!-- Time Range Selector -->
				<select
					bind:value={$timeRange}
					on:change={(e) => handleTimeRangeChange(e.target.value)}
					class="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-50 focus:border-brand outline-none"
				>
					{#each availableRanges as range}
						<option value={range.value}>{range.label}</option>
					{/each}
				</select>

				<!-- Export Options -->
				<div class="flex space-x-2">
					<button
						class="btn-sm btn-outline"
						on:click={() => handleExport('pdf')}
						disabled={$loading}
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						PDF
					</button>
					<button
						class="btn-sm btn-outline"
						on:click={() => handleExport('excel')}
						disabled={$loading}
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						Excel
					</button>
				</div>
			</div>
		</div>
	</div>

	{#if $loading}
		<div class="loading-state">
			<!-- Loading skeleton -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{#each Array(4) as _}
					<div class="bg-white rounded-xl p-6 border border-neutral-200">
						<div class="skeleton skeleton-text mb-2"></div>
						<div class="skeleton skeleton-text-lg mb-1"></div>
						<div class="skeleton skeleton-text-sm"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- KPI Cards -->
		<div class="kpi-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			{#each $kpiCards as kpi}
				<div class="kpi-card bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
					<div class="flex items-center justify-between mb-4">
						<div class="w-12 h-12 rounded-lg flex items-center justify-center"
							 class:bg-green-100={kpi.color === 'green'}
							 class:bg-blue-100={kpi.color === 'blue'}
							 class:bg-yellow-100={kpi.color === 'yellow'}
							 class:bg-purple-100={kpi.color === 'purple'}>
							{#if kpi.icon === 'currency'}
								<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
							{:else if kpi.icon === 'calendar'}
								<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							{:else if kpi.icon === 'star'}
								<svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							{:else if kpi.icon === 'users'}
								<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
								</svg>
							{/if}
						</div>
						{#if kpi.change !== 0}
							<span class="text-sm font-medium {getChangeColorClass(kpi.change)}">
								{formatChange(kpi.change)}
							</span>
						{/if}
					</div>
					<div>
						<div class="text-2xl font-bold text-neutral-800 mb-1">{kpi.value}</div>
						<div class="text-sm text-neutral-600">{kpi.title}</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Revenue Chart -->
		<div class="revenue-chart-container bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-neutral-800">Evolución de Ingresos</h2>
				<div class="flex items-center space-x-2 text-sm text-neutral-600">
					<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
					<span>Ingresos diarios</span>
				</div>
			</div>

			{#if $revenueData.length > 0}
				<div class="h-64 flex items-end space-x-2">
					{#each $revenueData as dataPoint, index}
						<div class="flex-1 flex flex-col items-center">
							<div
								class="w-full bg-blue-500 rounded-t transition-all duration-500"
								style="height: {(dataPoint.amount / Math.max(...$revenueData.map(d => d.amount))) * 100}%"
								title="ARS {new Intl.NumberFormat('es-AR').format(dataPoint.amount)}"
							></div>
							{#if index % Math.ceil($revenueData.length / 7) === 0}
								<span class="text-xs text-neutral-500 mt-2">
									{new Date(dataPoint.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="h-64 flex items-center justify-center text-neutral-500">
					No hay datos suficientes para mostrar el gráfico
				</div>
			{/if}
		</div>

		<!-- Growth Insights and Recommendations -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
			<!-- Growth Opportunities -->
			<div class="growth-opportunities bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<h2 class="text-lg font-semibold text-neutral-800 mb-4">Oportunidades de Crecimiento</h2>

				{#if $growthInsights.opportunities?.length > 0}
					<div class="space-y-4">
						{#each $growthInsights.opportunities.slice(0, 5) as opportunity}
							<div class="opportunity-item p-4 bg-brand-50 rounded-lg border-l-4 border-brand-500">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-medium text-neutral-800 mb-1">{opportunity.title}</h4>
										<p class="text-sm text-neutral-600 mb-2">{opportunity.description}</p>
										<div class="flex items-center space-x-4 text-xs text-neutral-500">
											<span>Impacto: <strong class="text-brand-600">{opportunity.impact}</strong></span>
											<span>Esfuerzo: <strong>{opportunity.effort}</strong></span>
										</div>
									</div>
									<div class="ml-4 text-right">
										<div class="text-lg font-bold text-brand-600">+{opportunity.potentialIncrease}%</div>
										<div class="text-xs text-neutral-500">Potencial</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-neutral-500">
						<svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
						<p>Analizando oportunidades...</p>
					</div>
				{/if}
			</div>

			<!-- Competitive Analysis -->
			<div class="competitive-analysis bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<h2 class="text-lg font-semibold text-neutral-800 mb-4">Análisis Competitivo</h2>

				{#if $competitiveAnalysis.marketPosition}
					<div class="space-y-6">
						<!-- Market Position -->
						<div class="market-position">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium text-neutral-700">Posición en el Mercado</span>
								<span class="text-sm text-neutral-600">Top {$competitiveAnalysis.marketPosition}%</span>
							</div>
							<div class="w-full bg-neutral-200 rounded-full h-2">
								<div
									class="bg-brand h-2 rounded-full transition-all duration-500"
									style="width: {100 - $competitiveAnalysis.marketPosition}%"
								></div>
							</div>
						</div>

						<!-- Strengths -->
						{#if $competitiveAnalysis.strengths?.length > 0}
							<div class="strengths">
								<h4 class="font-medium text-neutral-800 mb-3">Tus Fortalezas</h4>
								<div class="space-y-2">
									{#each $competitiveAnalysis.strengths as strength}
										<div class="flex items-center space-x-2">
											<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
											</svg>
											<span class="text-sm text-neutral-700">{strength}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Service Gaps -->
						{#if $competitiveAnalysis.serviceGaps?.length > 0}
							<div class="service-gaps">
								<h4 class="font-medium text-neutral-800 mb-3">Oportunidades de Servicio</h4>
								<div class="space-y-2">
									{#each $competitiveAnalysis.serviceGaps.slice(0, 3) as gap}
										<div class="flex items-center space-x-2">
											<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
											</svg>
											<span class="text-sm text-neutral-700">{gap}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="text-center py-8 text-neutral-500">
						<svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						<p>Analizando competencia...</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Customer Insights -->
		<div class="customer-insights bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
			<h2 class="text-lg font-semibold text-neutral-800 mb-6">Insights de Clientes</h2>

			{#if $customerInsights.length > 0}
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{#each $customerInsights as insight}
						<div class="insight-section">
							<h3 class="font-medium text-neutral-800 mb-4">{insight.title}</h3>

							{#if insight.type === 'demographics'}
								<div class="space-y-3">
									{#each insight.data as item}
										<div class="flex items-center justify-between">
											<span class="text-sm text-neutral-600">{item.label}</span>
											<div class="flex items-center space-x-2">
												<div class="w-16 bg-neutral-200 rounded-full h-2">
													<div
														class="bg-brand h-2 rounded-full"
														style="width: {(item.value / Math.max(...insight.data.map(d => d.value))) * 100}%"
													></div>
												</div>
												<span class="text-sm font-medium text-neutral-800">{item.value}%</span>
											</div>
										</div>
									{/each}
								</div>
							{:else if insight.type === 'preferences'}
								<div class="grid grid-cols-2 gap-4">
									{#each insight.data as item}
										<div class="text-center p-3 bg-neutral-50 rounded-lg">
											<div class="text-lg font-bold text-brand">{item.value}%</div>
											<div class="text-sm text-neutral-600">{item.label}</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="space-y-2">
									{#each insight.data as item}
										<div class="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
											<span class="text-sm text-neutral-600">{item.label}</span>
											<span class="text-sm font-medium text-neutral-800">{item.value}</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 text-neutral-500">
					<svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<p>Analizando datos de clientes...</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.provider-analytics-dashboard {
		@apply max-w-7xl mx-auto p-4;
	}

	.kpi-card:hover {
		transform: translateY(-2px);
	}

	.skeleton-text {
		@apply w-3/4 h-4 bg-neutral-200 rounded animate-pulse;
	}

	.skeleton-text-lg {
		@apply w-1/2 h-6 bg-neutral-200 rounded animate-pulse;
	}

	.skeleton-text-sm {
		@apply w-1/3 h-3 bg-neutral-200 rounded animate-pulse;
	}

	.opportunity-item {
		border-left-width: 4px;
		transition: all 0.2s ease;
	}

	.opportunity-item:hover {
		transform: translateX(4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.provider-analytics-dashboard {
			@apply p-2;
		}

		.dashboard-header {
			@apply p-4;
		}

		.kpi-grid {
			@apply grid-cols-2 gap-4;
		}

		.kpi-card {
			@apply p-4;
		}
	}
</style>