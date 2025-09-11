<!-- Advanced Booking Search Filters Component -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	
	export let filters = {
		priceRange: { min: 0, max: 50000 },
		rating: 0,
		availability: {
			date: '',
			timeFrom: '',
			timeTo: ''
		},
		location: '',
		services: [] as string[],
		distance: 10
	};
	
	export let isOpen = false;
	export let serviceCategories = [
		'Corte de Cabello',
		'Barba',
		'Coloración',
		'Peinado',
		'Tratamientos',
		'Masajes'
	];
	
	const dispatch = createEventDispatcher<{
		applyFilters: typeof filters;
		clearFilters: void;
	}>();
	
	let localFilters = { ...filters };
	
	$: {
		// Update local filters when props change
		localFilters = { ...filters };
	}
	
	function applyFilters() {
		dispatch('applyFilters', localFilters);
		isOpen = false;
	}
	
	function clearFilters() {
		localFilters = {
			priceRange: { min: 0, max: 50000 },
			rating: 0,
			availability: {
				date: '',
				timeFrom: '',
				timeTo: ''
			},
			location: '',
			services: [],
			distance: 10
		};
		dispatch('clearFilters');
		isOpen = false;
	}
	
	function formatPrice(value: number) {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 0
		}).format(value);
	}
	
	function toggleService(service: string) {
		if (localFilters.services.includes(service)) {
			localFilters.services = localFilters.services.filter(s => s !== service);
		} else {
			localFilters.services = [...localFilters.services, service];
		}
	}
</script>

<div class="relative">
	<!-- Filter Toggle Button -->
	<Button 
		variant="outline" 
		size="sm"
		on:click={() => isOpen = !isOpen}
		class="flex items-center space-x-2"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4V11.414a1 1 0 00-.293-.707L3.293 4.293A1 1 0 013 4z"/>
		</svg>
		<span>Filtros Avanzados</span>
		<svg 
			class="w-4 h-4 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
			fill="none" 
			stroke="currentColor" 
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
		</svg>
	</Button>
	
	<!-- Filter Panel -->
	{#if isOpen}
		<div 
			class="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 p-6"
			transition:slide={{ duration: 200 }}
		>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Price Range -->
				<div class="space-y-3">
					<h3 class="font-medium text-neutral-800">Rango de Precios</h3>
					<div class="space-y-2">
						<div class="flex items-center space-x-3">
							<Input
								type="number"
								placeholder="Mínimo"
								bind:value={localFilters.priceRange.min}
								class="flex-1"
								min="0"
								max="100000"
								step="500"
							/>
							<span class="text-neutral-500">-</span>
							<Input
								type="number"
								placeholder="Máximo"
								bind:value={localFilters.priceRange.max}
								class="flex-1"
								min="0"
								max="100000"
								step="500"
							/>
						</div>
						<div class="flex justify-between text-xs text-neutral-500">
							<span>{formatPrice(localFilters.priceRange.min)}</span>
							<span>{formatPrice(localFilters.priceRange.max)}</span>
						</div>
					</div>
				</div>
				
				<!-- Rating Filter -->
				<div class="space-y-3">
					<h3 class="font-medium text-neutral-800">Calificación Mínima</h3>
					<div class="flex space-x-2">
						{#each [1, 2, 3, 4, 5] as rating}
							<button
								type="button"
								class="p-2 rounded-lg border transition-colors {localFilters.rating >= rating 
									? 'bg-warning-100 border-warning-300 text-warning-700' 
									: 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
								}"
								on:click={() => localFilters.rating = rating}
							>
								<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
								</svg>
							</button>
						{/each}
					</div>
					<p class="text-xs text-neutral-500">
						{localFilters.rating > 0 ? `${localFilters.rating}+ estrellas` : 'Cualquier calificación'}
					</p>
				</div>
				
				<!-- Location & Distance -->
				<div class="space-y-3">
					<h3 class="font-medium text-neutral-800">Ubicación</h3>
					<div class="space-y-2">
						<Input
							type="text"
							placeholder="Barrio, zona o dirección"
							bind:value={localFilters.location}
						/>
						<div class="flex items-center space-x-3">
							<label class="text-sm text-neutral-600">Radio:</label>
							<input
								type="range"
								min="1"
								max="50"
								bind:value={localFilters.distance}
								class="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
							/>
							<span class="text-sm font-medium text-neutral-700 min-w-[3rem]">
								{localFilters.distance}km
							</span>
						</div>
					</div>
				</div>
				
				<!-- Availability -->
				<div class="space-y-3">
					<h3 class="font-medium text-neutral-800">Disponibilidad</h3>
					<div class="space-y-2">
						<Input
							type="date"
							bind:value={localFilters.availability.date}
							min={new Date().toISOString().split('T')[0]}
							label="Fecha preferida"
						/>
						<div class="grid grid-cols-2 gap-2">
							<Input
								type="time"
								bind:value={localFilters.availability.timeFrom}
								label="Desde"
							/>
							<Input
								type="time"
								bind:value={localFilters.availability.timeTo}
								label="Hasta"
							/>
						</div>
					</div>
				</div>
				
				<!-- Services -->
				<div class="md:col-span-2 space-y-3">
					<h3 class="font-medium text-neutral-800">Servicios</h3>
					<div class="flex flex-wrap gap-2">
						{#each serviceCategories as service}
							<button
								type="button"
								class="px-3 py-2 rounded-full text-sm font-medium transition-colors {
									localFilters.services.includes(service)
										? 'bg-brand text-white'
										: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
								}"
								on:click={() => toggleService(service)}
							>
								{service}
								{#if localFilters.services.includes(service)}
									<svg class="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			</div>
			
			<!-- Action Buttons -->
			<div class="flex justify-between items-center mt-6 pt-6 border-t border-neutral-200">
				<button
					type="button"
					class="text-neutral-600 hover:text-neutral-800 font-medium"
					on:click={clearFilters}
				>
					Limpiar Filtros
				</button>
				
				<div class="flex space-x-3">
					<Button variant="outline" size="sm" on:click={() => isOpen = false}>
						Cancelar
					</Button>
					<Button variant="primary" size="sm" on:click={applyFilters}>
						Aplicar Filtros
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 18px;
		width: 18px;
		border-radius: 50%;
		background: #10b981;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.slider::-moz-range-thumb {
		height: 18px;
		width: 18px;
		border-radius: 50%;
		background: #10b981;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
</style>