<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Chart from 'chart.js/auto';
	import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
	import { es } from 'date-fns/locale';
	import Card from '../Card.svelte';
	import Button from '../Button.svelte';
	import Loading from '../Loading.svelte';
	
	export let tenantId: string | null = null;
	export let providerId: string | null = null;
	export let dateRange = '30d';
	export let showAdvancedMetrics = true;
	
	// Predictive analytics state
	let loading = false;
	let selectedMetric = 'revenue';
	let predictionAccuracy = 0;
	
	// Chart instances
	let revenueChart: Chart | null = null;
	let demandChart: Chart | null = null;
	let churnChart: Chart | null = null;
	let capacityChart: Chart | null = null;
	
	// Analytics data stores
	const predictiveInsights = writable({
		revenue: {
			current: 0,
			predicted: 0,
			growthRate: 0,
			confidenceInterval: { min: 0, max: 0 }
		},
		demand: {
			currentBookings: 0,
			predictedBookings: 0,
			peakTimes: [],
			seasonalTrends: []
		},
		churn: {
			currentRate: 0,
			predictedRate: 0,
			riskFactors: [],
			retentionStrategies: []
		},
		capacity: {
			currentUtilization: 0,
			optimalCapacity: 0,
			bottlenecks: [],
			optimizationTips: []
		}
	});
	
	const businessRecommendations = writable([]);
	const marketTrends = writable([]);
	const competitiveAnalysis = writable(null);
	
	onMount(async () => {
		await loadPredictiveAnalytics();
		initializeCharts();
	});
	
	async function loadPredictiveAnalytics() {
		loading = true;
		
		try {
			const response = await fetch('/api/ai/analytics/predictive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					tenantId,
					providerId,
					dateRange,
					metrics: ['revenue', 'demand', 'churn', 'capacity'],
					context: {
						location: 'Argentina',
						industry: 'beauty_wellness',
						seasonality: true,
						economicFactors: true
					}
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				predictiveInsights.set(data.insights || {});
				businessRecommendations.set(data.recommendations || []);
				marketTrends.set(data.marketTrends || []);
				competitiveAnalysis.set(data.competitiveAnalysis || null);
				predictionAccuracy = data.modelAccuracy || 0;
				
				// Update charts with new data
				updateCharts(data);
			} else {
				console.error('Failed to load predictive analytics');
			}
		} catch (error) {
			console.error('Predictive analytics error:', error);
		} finally {
			loading = false;
		}
	}
	
	function initializeCharts() {
		// Initialize Revenue Prediction Chart
		const revenueCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
		if (revenueCtx) {
			revenueChart = new Chart(revenueCtx, {
				type: 'line',
				data: {
					labels: [],
					datasets: [
						{
							label: 'Ingresos Históricos',
							data: [],
							borderColor: '#3b82f6',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							fill: true,
							tension: 0.4
						},
						{
							label: 'Predicción IA',
							data: [],
							borderColor: '#10b981',
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							borderDash: [5, 5],
							fill: false,
							tension: 0.4
						},
						{
							label: 'Intervalo de Confianza',
							data: [],
							borderColor: 'rgba(16, 185, 129, 0.3)',
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							fill: '+1'
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'top'
						},
						title: {
							display: true,
							text: 'Predicción de Ingresos con IA'
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							ticks: {
								callback: function(value) {
									return 'ARS $' + value.toLocaleString();
								}
							}
						}
					}
				}
			});
		}
		
		// Initialize Demand Forecast Chart
		const demandCtx = document.getElementById('demandChart') as HTMLCanvasElement;
		if (demandCtx) {
			demandChart = new Chart(demandCtx, {
				type: 'bar',
				data: {
					labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
					datasets: [
						{
							label: 'Demanda Actual',
							data: [65, 75, 70, 85, 95, 120, 45],
							backgroundColor: '#3b82f6'
						},
						{
							label: 'Demanda Predicha',
							data: [68, 78, 73, 88, 98, 125, 48],
							backgroundColor: '#10b981'
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: 'Predicción de Demanda Semanal'
						}
					}
				}
			});
		}
		
		// Initialize Churn Prediction Chart
		const churnCtx = document.getElementById('churnChart') as HTMLCanvasElement;
		if (churnCtx) {
			churnChart = new Chart(churnCtx, {
				type: 'doughnut',
				data: {
					labels: ['Retención Predicha', 'Riesgo de Abandono'],
					datasets: [{
						data: [85, 15],
						backgroundColor: ['#10b981', '#ef4444'],
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'bottom'
						},
						title: {
							display: true,
							text: 'Predicción de Retención de Clientes'
						}
					}
				}
			});
		}
	}
	
	function updateCharts(data: any) {
		// Update charts with real prediction data
		if (revenueChart && data.charts?.revenue) {
			revenueChart.data = data.charts.revenue;
			revenueChart.update();
		}
		
		if (demandChart && data.charts?.demand) {
			demandChart.data = data.charts.demand;
			demandChart.update();
		}
		
		if (churnChart && data.charts?.churn) {
			churnChart.data = data.charts.churn;
			churnChart.update();
		}
	}
	
	function getInsightIcon(category: string) {
		switch (category) {
			case 'revenue':
				return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
			case 'demand':
				return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
			case 'churn':
				return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
			case 'capacity':
				return 'M13 10V3L4 14h7v7l9-11h-7z';
			default:
				return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
		}
	}
	
	function getRecommendationPriority(priority: string) {
		switch (priority) {
			case 'high':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low':
				return 'bg-green-100 text-green-800 border-green-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}
</script>

<div class="predictive-analytics-dashboard space-y-6">
	<!-- Header -->
	<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold text-neutral-900">Analíticas Predictivas con IA</h2>
			<p class="text-neutral-600 mt-1">Insights de negocio impulsados por inteligencia artificial</p>
			{#if predictionAccuracy > 0}
				<div class="flex items-center space-x-2 mt-2">
					<span class="text-sm text-neutral-600">Precisión del modelo:</span>
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						{Math.round(predictionAccuracy * 100)}%
					</span>
				</div>
			{/if}
		</div>
		
		<div class="flex items-center space-x-3">
			<select 
				bind:value={dateRange}
				on:change={loadPredictiveAnalytics}
				class="text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:border-transparent"
			>
				<option value="7d">Últimos 7 días</option>
				<option value="30d">Últimos 30 días</option>
				<option value="90d">Últimos 90 días</option>
				<option value="1y">Último año</option>
			</select>
			
			<Button variant="secondary" size="sm" on:click={loadPredictiveAnalytics} disabled={loading}>
				{#if loading}
					<Loading size="sm" class="mr-2" />
				{:else}
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				{/if}
				Actualizar
			</Button>
		</div>
	</div>
	
	{#if loading}
		<Loading message="Generando predicciones con IA..." />
	{:else}
		<!-- Key Metrics Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#if $predictiveInsights}
				<!-- Revenue Prediction -->
				<Card class="bg-gradient-to-br from-blue-50 to-blue-100">
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getInsightIcon('revenue')} />
							</svg>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium text-blue-600">
								{$predictiveInsights.revenue.growthRate > 0 ? '+' : ''}{$predictiveInsights.revenue.growthRate.toFixed(1)}%
							</div>
						</div>
					</div>
					<div>
						<h3 class="text-sm font-medium text-blue-900 mb-1">Ingresos Predichos</h3>
						<p class="text-2xl font-bold text-blue-900">ARS ${$predictiveInsights.revenue.predicted.toLocaleString()}</p>
						<p class="text-xs text-blue-700 mt-1">
							Actual: ARS ${$predictiveInsights.revenue.current.toLocaleString()}
						</p>
					</div>
				</Card>
				
				<!-- Demand Prediction -->
				<Card class="bg-gradient-to-br from-green-50 to-green-100">
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getInsightIcon('demand')} />
							</svg>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium text-green-600">
								+{Math.round((($predictiveInsights.demand.predictedBookings - $predictiveInsights.demand.currentBookings) / $predictiveInsights.demand.currentBookings) * 100)}%
							</div>
						</div>
					</div>
					<div>
						<h3 class="text-sm font-medium text-green-900 mb-1">Demanda Predicha</h3>
						<p class="text-2xl font-bold text-green-900">{$predictiveInsights.demand.predictedBookings}</p>
						<p class="text-xs text-green-700 mt-1">
							Actual: {$predictiveInsights.demand.currentBookings} reservas
						</p>
					</div>
				</Card>
				
				<!-- Churn Prediction -->
				<Card class="bg-gradient-to-br from-purple-50 to-purple-100">
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getInsightIcon('churn')} />
							</svg>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium" 
								class:text-green-600={$predictiveInsights.churn.predictedRate < $predictiveInsights.churn.currentRate}
								class:text-red-600={$predictiveInsights.churn.predictedRate >= $predictiveInsights.churn.currentRate}
							>
								{$predictiveInsights.churn.predictedRate < $predictiveInsights.churn.currentRate ? '-' : '+'}{Math.abs($predictiveInsights.churn.predictedRate - $predictiveInsights.churn.currentRate).toFixed(1)}%
							</div>
						</div>
					</div>
					<div>
						<h3 class="text-sm font-medium text-purple-900 mb-1">Riesgo de Abandono</h3>
						<p class="text-2xl font-bold text-purple-900">{$predictiveInsights.churn.predictedRate.toFixed(1)}%</p>
						<p class="text-xs text-purple-700 mt-1">
							Actual: {$predictiveInsights.churn.currentRate.toFixed(1)}%
						</p>
					</div>
				</Card>
				
				<!-- Capacity Optimization -->
				<Card class="bg-gradient-to-br from-orange-50 to-orange-100">
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getInsightIcon('capacity')} />
							</svg>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium text-orange-600">
								{Math.round(($predictiveInsights.capacity.optimalCapacity - $predictiveInsights.capacity.currentUtilization) / $predictiveInsights.capacity.currentUtilization * 100)}% mejora
							</div>
						</div>
					</div>
					<div>
						<h3 class="text-sm font-medium text-orange-900 mb-1">Capacidad Óptima</h3>
						<p class="text-2xl font-bold text-orange-900">{$predictiveInsights.capacity.optimalCapacity.toFixed(1)}%</p>
						<p class="text-xs text-orange-700 mt-1">
							Actual: {$predictiveInsights.capacity.currentUtilization.toFixed(1)}%
						</p>
					</div>
				</Card>
			{/if}
		</div>
		
		<!-- Prediction Charts -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<div class="h-80">
					<canvas id="revenueChart"></canvas>
				</div>
			</Card>
			
			<Card>
				<div class="h-80">
					<canvas id="demandChart"></canvas>
				</div>
			</Card>
		</div>
		
		<!-- Business Recommendations -->
		{#if $businessRecommendations.length > 0}
			<Card>
				<h3 class="text-lg font-semibold text-neutral-900 mb-4">Recomendaciones de IA</h3>
				<div class="space-y-4">
					{#each $businessRecommendations as recommendation}
						<div class="border rounded-lg p-4 {getRecommendationPriority(recommendation.priority)}">
							<div class="flex items-start space-x-3">
								<div class="flex-shrink-0">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
									</svg>
								</div>
								<div class="flex-1">
									<div class="flex items-center justify-between mb-2">
										<h4 class="font-semibold">{recommendation.title}</h4>
										<span class="text-xs font-medium px-2 py-1 rounded-full">{recommendation.priority.toUpperCase()}</span>
									</div>
									<p class="text-sm mb-3">{recommendation.description}</p>
									
									{#if recommendation.expectedImpact}
										<div class="bg-white bg-opacity-50 rounded p-2 text-xs">
											<strong>Impacto esperado:</strong> {recommendation.expectedImpact}
										</div>
									{/if}
									
									{#if recommendation.actionItems && recommendation.actionItems.length > 0}
										<div class="mt-3">
											<h5 class="text-sm font-medium mb-2">Acciones recomendadas:</h5>
											<ul class="space-y-1">
												{#each recommendation.actionItems as action}
													<li class="flex items-center space-x-2 text-xs">
														<svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
														</svg>
														<span>{action}</span>
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		{/if}
		
		<!-- Market Trends & Competitive Analysis -->
		{#if showAdvancedMetrics}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Market Trends -->
				{#if $marketTrends.length > 0}
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Tendencias del Mercado Argentino</h3>
						<div class="space-y-3">
							{#each $marketTrends as trend}
								<div class="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
									<div class="flex-shrink-0">
										<div class="w-2 h-2 rounded-full"
											class:bg-green-500={trend.direction === 'up'}
											class:bg-red-500={trend.direction === 'down'}
											class:bg-yellow-500={trend.direction === 'stable'}
										></div>
									</div>
									<div class="flex-1">
										<h4 class="font-medium text-neutral-900">{trend.category}</h4>
										<p class="text-sm text-neutral-600 mt-1">{trend.description}</p>
										<div class="flex items-center space-x-2 mt-2">
											<span class="text-xs font-medium text-neutral-700">Impacto:</span>
											<span class="text-xs"
												class:text-green-600={trend.impact === 'positive'}
												class:text-red-600={trend.impact === 'negative'}
												class:text-neutral-600={trend.impact === 'neutral'}
											>
												{trend.impact === 'positive' ? 'Positivo' : trend.impact === 'negative' ? 'Negativo' : 'Neutral'}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</Card>
				{/if}
				
				<!-- Competitive Analysis -->
				{#if $competitiveAnalysis}
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Análisis Competitivo</h3>
						<div class="space-y-4">
							<div class="grid grid-cols-3 gap-4 text-center">
								<div class="p-3 bg-green-50 rounded-lg">
									<div class="text-2xl font-bold text-green-600">{$competitiveAnalysis.marketPosition}</div>
									<div class="text-xs text-green-700">Posición</div>
								</div>
								<div class="p-3 bg-blue-50 rounded-lg">
									<div class="text-2xl font-bold text-blue-600">{$competitiveAnalysis.marketShare}%</div>
									<div class="text-xs text-blue-700">Participación</div>
								</div>
								<div class="p-3 bg-purple-50 rounded-lg">
									<div class="text-2xl font-bold text-purple-600">{$competitiveAnalysis.competitiveAdvantage}%</div>
									<div class="text-xs text-purple-700">Ventaja</div>
								</div>
							</div>
							
							{#if $competitiveAnalysis.strengths || $competitiveAnalysis.opportunities}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									{#if $competitiveAnalysis.strengths}
										<div>
											<h4 class="font-medium text-neutral-900 mb-2">Fortalezas</h4>
											<ul class="space-y-1">
												{#each $competitiveAnalysis.strengths as strength}
													<li class="flex items-center space-x-2 text-sm text-neutral-600">
														<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
														</svg>
														<span>{strength}</span>
													</li>
												{/each}
											</ul>
										</div>
									{/if}
									
									{#if $competitiveAnalysis.opportunities}
										<div>
											<h4 class="font-medium text-neutral-900 mb-2">Oportunidades</h4>
											<ul class="space-y-1">
												{#each $competitiveAnalysis.opportunities as opportunity}
													<li class="flex items-center space-x-2 text-sm text-neutral-600">
														<svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
														</svg>
														<span>{opportunity}</span>
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</Card>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.predictive-analytics-dashboard {
		@apply max-w-7xl mx-auto p-6;
	}
	
	/* Mobile optimization for Argentina market */
	@media (max-width: 768px) {
		.predictive-analytics-dashboard {
			@apply p-4;
		}
		
		/* Simplified grid layout for mobile */
		.grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-4 {
			@apply grid-cols-1 gap-4;
		}
		
		.grid.grid-cols-1.lg\:grid-cols-2 {
			@apply grid-cols-1;
		}
	}
	
	/* Chart container styling */
	.h-80 {
		position: relative;
	}
	
	/* Accessibility improvements */
	button:focus, 
	select:focus {
		@apply outline-none ring-2 ring-brand ring-offset-2;
	}
	
	/* Loading state animations */
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: .5;
		}
	}
</style>