<!-- Enhanced Analytics Dashboard for Providers -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { BookingAnalytics } from '$lib/types/booking';
	
	export let providerId: string;
	export let dateRange: 'week' | 'month' | 'quarter' | 'year' = 'month';
	
	const dispatch = createEventDispatcher<{
		export: { type: 'pdf' | 'csv'; data: any };
	}>();
	
	interface ExtendedAnalytics extends BookingAnalytics {
		revenueByService: Array<{
			serviceId: string;
			serviceName: string;
			revenue: number;
			bookingCount: number;
			averagePrice: number;
		}>;
		clientRetention: {
			newClients: number;
			returningClients: number;
			retentionRate: number;
		};
		peakHours: Array<{
			hour: number;
			day: string;
			bookingCount: number;
			revenue: number;
		}>;
		monthlyTrends: Array<{
			month: string;
			revenue: number;
			bookings: number;
			newClients: number;
		}>;
		cancellationReasons: Array<{
			reason: string;
			count: number;
			percentage: number;
		}>;
		servicePerformance: Array<{
			serviceId: string;
			serviceName: string;
			bookingCount: number;
			revenue: number;
			averageRating: number;
			cancellationRate: number;
		}>;
	}
	
	let loading = false;
	let error: string | null = null;
	let analytics: ExtendedAnalytics | null = null;
	let selectedMetric: 'revenue' | 'bookings' | 'clients' = 'revenue';
	
	const dateRangeOptions = [
		{ value: 'week', label: 'Última Semana' },
		{ value: 'month', label: 'Último Mes' },
		{ value: 'quarter', label: 'Último Trimestre' },
		{ value: 'year', label: 'Último Año' }
	];
	
	onMount(() => {
		loadAnalytics();
	});
	
	$: if (dateRange) {
		loadAnalytics();
	}
	
	async function loadAnalytics() {
		loading = true;
		error = null;
		
		try {
			const response = await fetch(`/api/providers/${providerId}/analytics?period=${dateRange}&detailed=true`);
			if (response.ok) {
				analytics = await response.json();
			} else {
				throw new Error('Error al cargar analíticas');
			}
		} catch (err: any) {
			error = err.message || 'Error de conexión';
		} finally {
			loading = false;
		}
	}
	
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS'
		}).format(amount);
	}
	
	function formatPercentage(value: number) {
		return `${value.toFixed(1)}%`;
	}
	
	function exportData(type: 'pdf' | 'csv') {
		dispatch('export', { type, data: analytics });
	}
	
	function getChangeColor(current: number, previous: number) {
		const change = ((current - previous) / previous) * 100;
		if (change > 0) return 'text-green-600';
		if (change < 0) return 'text-red-600';
		return 'text-neutral-600';
	}
	
	function getChangePercentage(current: number, previous: number) {
		if (previous === 0) return current > 0 ? '+100%' : '0%';
		const change = ((current - previous) / previous) * 100;
		return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
	}
	
	function getBestPerformingService() {
		if (!analytics?.servicePerformance || analytics.servicePerformance.length === 0) return null;
		return analytics.servicePerformance.reduce((best, current) => 
			current.revenue > best.revenue ? current : best
		);
	}
	
	function getMostBookedHour() {
		if (!analytics?.busyHours || analytics.busyHours.length === 0) return null;
		return analytics.busyHours.reduce((busiest, current) => 
			current.bookingCount > busiest.bookingCount ? current : busiest
		);
	}
	
	function getRevenueGrowth() {
		if (!analytics?.monthlyTrends || analytics.monthlyTrends.length < 2) return 0;
		const current = analytics.monthlyTrends[analytics.monthlyTrends.length - 1];
		const previous = analytics.monthlyTrends[analytics.monthlyTrends.length - 2];
		return ((current.revenue - previous.revenue) / previous.revenue) * 100;
	}
</script>

<div class="space-y-6">
	<!-- Header Controls -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-bold text-neutral-800">Panel de Análisis</h2>
			<p class="text-neutral-600">Insights detallados sobre tu negocio</p>
		</div>
		
		<div class="mt-4 sm:mt-0 flex items-center space-x-3">
			<!-- Date Range Selector -->
			<select 
				bind:value={dateRange}
				class="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
			>
				{#each dateRangeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			
			<!-- Export Buttons -->
			<Button variant="outline" size="sm" on:click={() => exportData('csv')}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
				Exportar CSV
			</Button>
			
			<Button variant="outline" size="sm" on:click={() => exportData('pdf')}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
				</svg>
				Exportar PDF
			</Button>
		</div>
	</div>
	
	{#if loading}
		<div class="flex justify-center py-12">
			<Loading />
		</div>
	{:else if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
			{error}
			<Button variant="outline" size="sm" on:click={loadAnalytics} class="mt-3">
				Reintentar
			</Button>
		</div>
	{:else if analytics}
		<!-- Key Metrics Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" transition:fade>
			<div class="card text-center">
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Ingresos Totales</h3>
				<p class="text-2xl font-bold text-neutral-800 mb-1">
					{formatCurrency(analytics.totalRevenue)}
				</p>
				<p class="text-xs {getChangeColor(analytics.totalRevenue, analytics.totalRevenue * 0.8)}">
					{getChangePercentage(analytics.totalRevenue, analytics.totalRevenue * 0.8)} vs período anterior
				</p>
			</div>
			
			<div class="card text-center">
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Reservas Totales</h3>
				<p class="text-2xl font-bold text-neutral-800 mb-1">
					{analytics.totalBookings}
				</p>
				<p class="text-xs text-neutral-500">
					{analytics.completedBookings} completadas
				</p>
			</div>
			
			<div class="card text-center">
				<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Clientes</h3>
				<p class="text-2xl font-bold text-neutral-800 mb-1">
					{analytics.clientRetention?.newClients + analytics.clientRetention?.returningClients || 0}
				</p>
				<p class="text-xs text-neutral-500">
					{formatPercentage(analytics.clientRetention?.retentionRate || 0)} retención
				</p>
			</div>
			
			<div class="card text-center">
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
					</svg>
				</div>
				<h3 class="text-sm font-medium text-neutral-600 mb-1">Calificación</h3>
				<p class="text-2xl font-bold text-neutral-800 mb-1">
					{analytics.averageRating.toFixed(1)}
				</p>
				<p class="text-xs text-neutral-500">
					⭐⭐⭐⭐⭐
				</p>
			</div>
		</div>
		
		<!-- Revenue and Booking Trends Chart -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Revenue by Service -->
			<div class="card">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-neutral-800">
						Ingresos por Servicio
					</h3>
					<select 
						bind:value={selectedMetric}
						class="text-sm border border-neutral-300 rounded px-2 py-1"
					>
						<option value="revenue">Ingresos</option>
						<option value="bookings">Reservas</option>
						<option value="clients">Clientes</option>
					</select>
				</div>
				
				<div class="space-y-4">
					{#each analytics.revenueByService?.slice(0, 5) || [] as service}
						{@const maxValue = Math.max(...(analytics.revenueByService?.map(s => s.revenue) || [1]))}
						{@const percentage = (service.revenue / maxValue) * 100}
						
						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-sm font-medium text-neutral-800">
									{service.serviceName}
								</span>
								<span class="text-sm font-semibold text-neutral-700">
									{formatCurrency(service.revenue)}
								</span>
							</div>
							
							<div class="w-full bg-neutral-200 rounded-full h-2">
								<div 
									class="bg-brand h-2 rounded-full transition-all duration-500"
									style="width: {percentage}%"
								></div>
							</div>
							
							<div class="flex justify-between text-xs text-neutral-500">
								<span>{service.bookingCount} reservas</span>
								<span>{formatCurrency(service.averagePrice)} promedio</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Peak Hours Analysis -->
			<div class="card">
				<h3 class="text-lg font-semibold text-neutral-800 mb-6">
					Horas Pico
				</h3>
				
				<div class="grid grid-cols-8 gap-1 mb-4">
					{#each Array(24) as _, hour}
						{@const hourData = analytics.busyHours?.find(h => h.hour === hour)}
						{@const bookingCount = hourData?.bookingCount || 0}
						{@const maxBookings = Math.max(...(analytics.busyHours?.map(h => h.bookingCount) || [1]))}
						{@const intensity = maxBookings > 0 ? (bookingCount / maxBookings) * 100 : 0}
						
						<div 
							class="aspect-square rounded text-xs flex items-center justify-center font-medium transition-colors {
								intensity > 75 ? 'bg-red-500 text-white' :
								intensity > 50 ? 'bg-orange-400 text-white' :
								intensity > 25 ? 'bg-yellow-400 text-neutral-800' :
								intensity > 0 ? 'bg-green-200 text-neutral-800' :
								'bg-neutral-100 text-neutral-500'
							}"
							title="{hour}:00 - {bookingCount} reservas"
						>
							{hour}
						</div>
					{/each}
				</div>
				
				<div class="flex justify-between text-xs text-neutral-500">
					<span>Menos ocupado</span>
					<span>Más ocupado</span>
				</div>
				
				{#if getMostBookedHour()}
					{@const mostBooked = getMostBookedHour()}
					<div class="mt-4 p-3 bg-neutral-50 rounded-lg">
						<p class="text-sm text-neutral-600">
							<span class="font-semibold">Hora pico:</span>
							{mostBooked.hour}:00 con {mostBooked.bookingCount} reservas
						</p>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Service Performance Analysis -->
		<div class="card">
			<h3 class="text-lg font-semibold text-neutral-800 mb-6">
				Rendimiento de Servicios
			</h3>
			
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-neutral-200">
							<th class="text-left py-3 text-sm font-medium text-neutral-600">Servicio</th>
							<th class="text-right py-3 text-sm font-medium text-neutral-600">Reservas</th>
							<th class="text-right py-3 text-sm font-medium text-neutral-600">Ingresos</th>
							<th class="text-right py-3 text-sm font-medium text-neutral-600">Calificación</th>
							<th class="text-right py-3 text-sm font-medium text-neutral-600">Cancelaciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each analytics.servicePerformance || [] as service}
							<tr class="hover:bg-neutral-50">
								<td class="py-3">
									<div class="font-medium text-neutral-800">{service.serviceName}</div>
								</td>
								<td class="text-right py-3 text-neutral-600">
									{service.bookingCount}
								</td>
								<td class="text-right py-3 text-neutral-600">
									{formatCurrency(service.revenue)}
								</td>
								<td class="text-right py-3">
									<div class="flex items-center justify-end">
										<span class="text-neutral-600 mr-1">{service.averageRating.toFixed(1)}</span>
										<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
										</svg>
									</div>
								</td>
								<td class="text-right py-3">
									<span class="text-sm {service.cancellationRate > 20 ? 'text-red-600' : service.cancellationRate > 10 ? 'text-yellow-600' : 'text-green-600'}">
										{formatPercentage(service.cancellationRate)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
		
		<!-- Insights and Recommendations -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Quick Insights -->
			<div class="card">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">
					Insights Rápidos
				</h3>
				
				<div class="space-y-4">
					{#if getBestPerformingService()}
						{@const bestService = getBestPerformingService()}
						<div class="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
							<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
								</svg>
							</div>
							<div>
								<p class="text-sm font-medium text-green-800">Servicio estrella</p>
								<p class="text-sm text-green-700">
									{bestService.serviceName} generó {formatCurrency(bestService.revenue)} 
									con {bestService.bookingCount} reservas
								</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
						<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<div>
							<p class="text-sm font-medium text-blue-800">Crecimiento de ingresos</p>
							<p class="text-sm text-blue-700">
								{getRevenueGrowth() > 0 ? '+' : ''}{getRevenueGrowth().toFixed(1)}% respecto al período anterior
							</p>
						</div>
					</div>
					
					<div class="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
						<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
							</svg>
						</div>
						<div>
							<p class="text-sm font-medium text-purple-800">Fidelización</p>
							<p class="text-sm text-purple-700">
								{formatPercentage(analytics.clientRetention?.retentionRate || 0)} de tus clientes repiten
							</p>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Recommendations -->
			<div class="card">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">
					Recomendaciones
				</h3>
				
				<div class="space-y-3">
					{#if analytics.cancellationReasons?.length > 0}
						{@const topCancellation = analytics.cancellationReasons[0]}
						<div class="p-3 bg-yellow-50 border-l-4 border-yellow-400">
							<p class="text-sm font-medium text-yellow-800">Reducir cancelaciones</p>
							<p class="text-sm text-yellow-700">
								{formatPercentage(topCancellation.percentage)} de las cancelaciones son por "{topCancellation.reason}". 
								Considera implementar recordatorios automáticos.
							</p>
						</div>
					{/if}
					
					{#if analytics.clientRetention?.retentionRate < 60}
						<div class="p-3 bg-orange-50 border-l-4 border-orange-400">
							<p class="text-sm font-medium text-orange-800">Mejorar retención</p>
							<p class="text-sm text-orange-700">
								Tu tasa de retención es del {formatPercentage(analytics.clientRetention.retentionRate)}. 
								Considera crear un programa de fidelización.
							</p>
						</div>
					{/if}
					
					<div class="p-3 bg-green-50 border-l-4 border-green-400">
						<p class="text-sm font-medium text-green-800">Optimizar horarios</p>
						<p class="text-sm text-green-700">
							Tus horas más ocupadas pueden generar más ingresos. 
							Considera ajustar precios en horarios pico.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>