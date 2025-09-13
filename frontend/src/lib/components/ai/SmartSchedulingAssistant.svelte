<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
	import { es } from 'date-fns/locale';
	import Card from '../Card.svelte';
	import Button from '../Button.svelte';
	import Loading from '../Loading.svelte';
	
	const dispatch = createEventDispatcher();
	
	export let providerId: string;
	export let serviceId: string;
	export let userPreferences: any = {};
	export let existingBookings: any[] = [];
	
	// Smart scheduling state
	let isAnalyzing = false;
	let selectedTimeSlot: any = null;
	let conflictResolution: any = null;
	let showConflictDialog = false;
	
	// AI-powered scheduling data
	const smartSuggestions = writable([]);
	const availabilityPredictions = writable([]);
	const conflictAnalysis = writable(null);
	const optimizationInsights = writable([]);
	
	// Calendar state
	let currentWeek = new Date();
	let weekDays: Date[] = [];
	
	onMount(() => {
		initializeCalendar();
		loadSmartSchedulingData();
	});
	
	function initializeCalendar() {
		const startWeek = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
		weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
	}
	
	async function loadSmartSchedulingData() {
		isAnalyzing = true;
		
		try {
			// Load AI-powered scheduling suggestions
			const response = await fetch('/api/ai/scheduling/suggestions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					providerId,
					serviceId,
					userPreferences,
					existingBookings,
					weekStart: format(weekDays[0], 'yyyy-MM-dd'),
					weekEnd: format(weekDays[6], 'yyyy-MM-dd'),
					context: {
						timeZone: 'America/Argentina/Buenos_Aires',
						currentTime: new Date().toISOString(),
						userHistory: userPreferences.bookingHistory || [],
						providerPreferences: userPreferences.providerPreferences || {}
					}
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				smartSuggestions.set(data.suggestions || []);
				availabilityPredictions.set(data.predictions || []);
				optimizationInsights.set(data.insights || []);
				
				// Check for potential conflicts
				if (data.conflicts && data.conflicts.length > 0) {
					conflictAnalysis.set(data.conflicts[0]);
				}
			} else {
				console.error('Failed to load smart scheduling data');
			}
		} catch (error) {
			console.error('Smart scheduling error:', error);
		} finally {
			isAnalyzing = false;
		}
	}
	
	async function selectTimeSlot(slot: any) {
		// Check for conflicts before selection
		const conflictCheck = await checkForConflicts(slot);
		
		if (conflictCheck.hasConflict) {
			conflictResolution = conflictCheck;
			showConflictDialog = true;
			return;
		}
		
		selectedTimeSlot = slot;
		dispatch('slot-selected', {
			slot,
			aiInsights: {
				optimalTime: slot.optimal,
				confidenceScore: slot.confidence,
				recommendationReason: slot.reason
			}
		});
	}
	
	async function checkForConflicts(slot: any) {
		try {
			const response = await fetch('/api/ai/scheduling/conflict-check', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					proposedSlot: slot,
					existingBookings,
					userSchedule: userPreferences.schedule || {},
					providerSchedule: userPreferences.providerSchedule || {}
				})
			});
			
			if (response.ok) {
				return await response.json();
			} else {
				return { hasConflict: false };
			}
		} catch (error) {
			console.error('Conflict check error:', error);
			return { hasConflict: false };
		}
	}
	
	async function resolveConflict(resolution: string) {
		if (!conflictResolution) return;
		
		try {
			const response = await fetch('/api/ai/scheduling/resolve-conflict', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					conflict: conflictResolution,
					resolution,
					user Preferences: userPreferences
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				
				if (data.resolvedSlot) {
					selectedTimeSlot = data.resolvedSlot;
					dispatch('slot-selected', {
						slot: data.resolvedSlot,
						aiInsights: {
							conflictResolved: true,
							resolutionMethod: resolution,
							originalConflict: conflictResolution
						}
					});
				}
				
				showConflictDialog = false;
				conflictResolution = null;
				
				// Reload scheduling data to reflect changes
				await loadSmartSchedulingData();
			}
		} catch (error) {
			console.error('Conflict resolution error:', error);
		}
	}
	
	function navigateWeek(direction: number) {
		currentWeek = addDays(currentWeek, direction * 7);
		initializeCalendar();
		loadSmartSchedulingData();
	}
	
	function getSlotConfidenceColor(confidence: number) {
		if (confidence >= 0.9) return 'bg-green-100 border-green-300 text-green-800';
		if (confidence >= 0.7) return 'bg-blue-100 border-blue-300 text-blue-800';
		if (confidence >= 0.5) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
		return 'bg-red-100 border-red-300 text-red-800';
	}
	
	function getOptimizationIcon(type: string) {
		switch (type) {
			case 'peak_avoidance':
				return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'travel_optimization':
				return 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z';
			case 'provider_preference':
				return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
			default:
				return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
		}
	}
</script>

<div class="smart-scheduling-assistant space-y-6">
	<!-- Header with AI insights -->
	<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold text-neutral-900">Asistente de Programación IA</h2>
			<p class="text-neutral-600 mt-1">Sugerencias inteligentes para optimizar tu reserva</p>
		</div>
		
		{#if isAnalyzing}
			<div class="flex items-center space-x-2 text-brand">
				<Loading size="sm" />
				<span class="text-sm font-medium">Analizando disponibilidad...</span>
			</div>
		{/if}
	</div>
	
	<!-- AI Optimization Insights -->
	{#if $optimizationInsights.length > 0}
		<Card class="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
			<div class="flex items-start space-x-3">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-blue-900 mb-2">Recomendaciones de IA</h3>
					<div class="space-y-2">
						{#each $optimizationInsights as insight}
							<div class="flex items-start space-x-2">
								<svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getOptimizationIcon(insight.type)} />
								</svg>
								<div class="flex-1">
									<p class="text-sm text-blue-800 font-medium">{insight.title}</p>
									<p class="text-xs text-blue-600 mt-1">{insight.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</Card>
	{/if}
	
	<!-- Calendar Navigation -->
	<div class="flex items-center justify-between">
		<Button variant="secondary" size="sm" on:click={() => navigateWeek(-1)}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Semana Anterior
		</Button>
		
		<h3 class="text-lg font-semibold text-neutral-900">
			{format(weekDays[0], "d 'de' MMMM", { locale: es })} - {format(weekDays[6], "d 'de' MMMM yyyy", { locale: es })}
		</h3>
		
		<Button variant="secondary" size="sm" on:click={() => navigateWeek(1)}>
			Semana Siguiente
			<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</Button>
	</div>
	
	<!-- Smart Scheduling Grid -->
	<div class="grid grid-cols-7 gap-2 lg:gap-4">
		<!-- Day Headers -->
		{#each weekDays as day}
			<div class="text-center py-2">
				<div class="text-sm font-semibold text-neutral-900">
					{format(day, 'EEE', { locale: es }).toUpperCase()}
				</div>
				<div class="text-2xl font-bold text-neutral-600 mt-1">
					{format(day, 'd')}
				</div>
			</div>
		{/each}
		
		<!-- Time Slots -->
		{#each weekDays as day, dayIndex}
			<div class="space-y-2">
				{#if $smartSuggestions.find(s => format(new Date(s.datetime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))}
					{#each $smartSuggestions.filter(s => format(new Date(s.datetime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) as slot}
						<button
							type="button"
							on:click={() => selectTimeSlot(slot)}
							class="w-full p-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 hover:shadow-md"
							class:ring-2={selectedTimeSlot?.id === slot.id}
							class:ring-brand={selectedTimeSlot?.id === slot.id}
							class:{getSlotConfidenceColor(slot.confidence)}
						>
							<div class="flex flex-col items-center space-y-1">
								<span class="font-bold">{format(new Date(slot.datetime), 'HH:mm')}</span>
								
								{#if slot.optimal}
									<div class="flex items-center space-x-1">
										<svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
										</svg>
										<span class="text-yellow-600 font-medium">Óptimo</span>
									</div>
								{/if}
								
								<div class="flex items-center justify-center space-x-1">
									<div class="w-2 h-2 rounded-full"
										class:bg-green-500={slot.confidence >= 0.8}
										class:bg-yellow-500={slot.confidence >= 0.6 && slot.confidence < 0.8}
										class:bg-red-500={slot.confidence < 0.6}
									></div>
									<span class="text-xs">{Math.round(slot.confidence * 100)}%</span>
								</div>
								
								{#if slot.reason}
									<div class="text-xs opacity-75 truncate w-full" title={slot.reason}>
										{slot.reason.substring(0, 20)}...
									</div>
								{/if}
							</div>
						</button>
					{/each}
				{:else}
					<div class="w-full p-4 text-center text-neutral-400 text-xs border-2 border-dashed border-neutral-200 rounded-lg">
						No hay horarios disponibles
					</div>
				{/if}
			</div>
		{/each}
	</div>
	
	<!-- Selected Slot Information -->
	{#if selectedTimeSlot}
		<Card class="bg-green-50 border-green-200">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-green-900">Horario Seleccionado</h4>
						<p class="text-green-700">
							{format(new Date(selectedTimeSlot.datetime), "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
						</p>
						{#if selectedTimeSlot.reason}
							<p class="text-sm text-green-600 mt-1">{selectedTimeSlot.reason}</p>
						{/if}
					</div>
				</div>
				
				<div class="text-right">
					<div class="flex items-center space-x-1 mb-1">
						{#if selectedTimeSlot.optimal}
							<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
							</svg>
							<span class="text-sm font-medium text-yellow-600">Óptimo</span>
						{/if}
					</div>
					<div class="text-sm text-green-600">
						Confianza: {Math.round(selectedTimeSlot.confidence * 100)}%
					</div>
				</div>
			</div>
		</Card>
	{/if}
	
	<!-- AI Predictions -->
	{#if $availabilityPredictions.length > 0}
		<Card>
			<h3 class="text-lg font-semibold text-neutral-900 mb-4">Predicciones de Disponibilidad</h3>
			<div class="space-y-3">
				{#each $availabilityPredictions as prediction}
					<div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 rounded-full"
								class:bg-green-500={prediction.availability >= 0.7}
								class:bg-yellow-500={prediction.availability >= 0.4 && prediction.availability < 0.7}
								class:bg-red-500={prediction.availability < 0.4}
							></div>
							<div>
								<p class="font-medium text-neutral-900">{prediction.timeRange}</p>
								<p class="text-sm text-neutral-600">{prediction.description}</p>
							</div>
						</div>
						<div class="text-right">
							<span class="text-sm font-medium text-neutral-700">
								{Math.round(prediction.availability * 100)}% disponible
							</span>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{/if}
</div>

<!-- Conflict Resolution Dialog -->
{#if showConflictDialog && conflictResolution}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-neutral-900">Conflicto Detectado</h3>
			</div>
			
			<p class="text-neutral-600">{conflictResolution.description}</p>
			
			<div class="space-y-2">
				<p class="text-sm font-medium text-neutral-900">Opciones de resolución:</p>
				{#each conflictResolution.resolutionOptions || [] as option}
					<button
						type="button"
						on:click={() => resolveConflict(option.type)}
						class="w-full text-left p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
					>
						<div class="font-medium text-neutral-900">{option.title}</div>
						<div class="text-sm text-neutral-600">{option.description}</div>
					</button>
				{/each}
			</div>
			
			<div class="flex justify-end space-x-3">
				<Button variant="secondary" on:click={() => showConflictDialog = false}>
					Cancelar
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.smart-scheduling-assistant {
		@apply max-w-6xl mx-auto;
	}
	
	/* Mobile optimization for Argentina market */
	@media (max-width: 768px) {
		.smart-scheduling-assistant {
			@apply px-2;
		}
		
		/* Larger touch targets for mobile */
		button {
			min-height: 44px;
		}
		
		/* Simplified grid for mobile */
		.grid-cols-7 {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	
	/* Accessibility enhancements */
	button:focus {
		@apply outline-none ring-2 ring-brand ring-offset-2;
	}
	
	/* Animation for confidence indicators */
	.w-2.h-2.rounded-full {
		@apply transition-colors duration-300;
	}
</style>