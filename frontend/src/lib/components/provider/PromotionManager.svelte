<!-- Promotion and Discount Management Component for Providers -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Loading from '$lib/components/Loading.svelte';
	
	export let providerId: string;
	export let isOpen = false;
	
	const dispatch = createEventDispatcher<{
		promotionCreated: any;
		promotionUpdated: any;
		promotionDeleted: string;
		close: void;
	}>();
	
	interface Promotion {
		id?: string;
		name: string;
		description: string;
		type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';
		value: number;
		minPurchaseAmount?: number;
		maxDiscountAmount?: number;
		code: string;
		isActive: boolean;
		startDate: string;
		endDate: string;
		usageLimit?: number;
		usageCount: number;
		applicableServices: string[];
		firstTimeClientsOnly: boolean;
		createdAt?: Date;
	}
	
	let loading = false;
	let error: string | null = null;
	let promotions: Promotion[] = [];
	let services: any[] = [];
	let showCreateForm = false;
	let editingPromotion: Promotion | null = null;
	
	let formData: Promotion = {
		name: '',
		description: '',
		type: 'PERCENTAGE',
		value: 0,
		code: '',
		isActive: true,
		startDate: new Date().toISOString().split('T')[0],
		endDate: '',
		usageCount: 0,
		applicableServices: [],
		firstTimeClientsOnly: false
	};
	
	const promotionTypes = [
		{ value: 'PERCENTAGE', label: 'Porcentaje de descuento' },
		{ value: 'FIXED_AMOUNT', label: 'Monto fijo de descuento' },
		{ value: 'BUY_X_GET_Y', label: 'Compra X obtén Y gratis' }
	];
	
	onMount(async () => {
		if (isOpen) {
			await loadData();
		}
	});
	
	$: if (isOpen && promotions.length === 0) {
		loadData();
	}
	
	async function loadData() {
		loading = true;
		error = null;
		
		try {
			// Load promotions
			const promotionsResponse = await fetch(`/api/providers/${providerId}/promotions`);
			if (promotionsResponse.ok) {
				promotions = await promotionsResponse.json();
			}
			
			// Load services for promotion targeting
			const servicesResponse = await fetch(`/api/providers/${providerId}/services`);
			if (servicesResponse.ok) {
				services = await servicesResponse.json();
			}
		} catch (err: any) {
			error = err.message || 'Error al cargar datos';
		} finally {
			loading = false;
		}
	}
	
	function startCreatePromotion() {
		formData = {
			name: '',
			description: '',
			type: 'PERCENTAGE',
			value: 0,
			code: generatePromotionCode(),
			isActive: true,
			startDate: new Date().toISOString().split('T')[0],
			endDate: '',
			usageCount: 0,
			applicableServices: [],
			firstTimeClientsOnly: false
		};
		editingPromotion = null;
		showCreateForm = true;
	}
	
	function editPromotion(promotion: Promotion) {
		formData = {
			...promotion,
			startDate: new Date(promotion.startDate).toISOString().split('T')[0],
			endDate: new Date(promotion.endDate).toISOString().split('T')[0]
		};
		editingPromotion = promotion;
		showCreateForm = true;
	}
	
	function generatePromotionCode() {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}
	
	function toggleService(serviceId: string) {
		if (formData.applicableServices.includes(serviceId)) {
			formData.applicableServices = formData.applicableServices.filter(id => id !== serviceId);
		} else {
			formData.applicableServices = [...formData.applicableServices, serviceId];
		}
	}
	
	async function savePromotion() {
		if (!formData.name || !formData.code || !formData.startDate || !formData.endDate) {
			error = 'Por favor completa todos los campos requeridos';
			return;
		}
		
		if (formData.value <= 0) {
			error = 'El valor del descuento debe ser mayor a 0';
			return;
		}
		
		if (new Date(formData.startDate) >= new Date(formData.endDate)) {
			error = 'La fecha de fin debe ser posterior a la fecha de inicio';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const url = editingPromotion 
				? `/api/providers/${providerId}/promotions/${editingPromotion.id}`
				: `/api/providers/${providerId}/promotions`;
			
			const method = editingPromotion ? 'PUT' : 'POST';
			
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					startDate: new Date(formData.startDate).toISOString(),
					endDate: new Date(formData.endDate).toISOString()
				})
			});
			
			if (response.ok) {
				const savedPromotion = await response.json();
				
				if (editingPromotion) {
					promotions = promotions.map(p => 
						p.id === editingPromotion!.id ? savedPromotion : p
					);
					dispatch('promotionUpdated', savedPromotion);
				} else {
					promotions = [...promotions, savedPromotion];
					dispatch('promotionCreated', savedPromotion);
				}
				
				showCreateForm = false;
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Error al guardar promoción';
			}
		} catch (err: any) {
			error = err.message || 'Error de conexión';
		} finally {
			loading = false;
		}
	}
	
	async function deletePromotion(promotionId: string) {
		if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
		
		loading = true;
		
		try {
			const response = await fetch(`/api/providers/${providerId}/promotions/${promotionId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				promotions = promotions.filter(p => p.id !== promotionId);
				dispatch('promotionDeleted', promotionId);
			}
		} catch (err: any) {
			error = err.message || 'Error al eliminar promoción';
		} finally {
			loading = false;
		}
	}
	
	async function togglePromotionStatus(promotion: Promotion) {
		loading = true;
		
		try {
			const response = await fetch(`/api/providers/${providerId}/promotions/${promotion.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...promotion,
					isActive: !promotion.isActive
				})
			});
			
			if (response.ok) {
				const updatedPromotion = await response.json();
				promotions = promotions.map(p => 
					p.id === promotion.id ? updatedPromotion : p
				);
			}
		} catch (err: any) {
			error = err.message || 'Error al actualizar promoción';
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
	
	function formatDate(date: string | Date) {
		return new Intl.DateTimeFormat('es-AR', {
			dateStyle: 'short'
		}).format(new Date(date));
	}
	
	function getPromotionTypeLabel(type: string) {
		return promotionTypes.find(t => t.value === type)?.label || type;
	}
	
	function getDiscountDisplay(promotion: Promotion) {
		switch (promotion.type) {
			case 'PERCENTAGE':
				return `${promotion.value}% OFF`;
			case 'FIXED_AMOUNT':
				return `${formatCurrency(promotion.value)} OFF`;
			case 'BUY_X_GET_Y':
				return `Compra ${Math.floor(promotion.value)} obtén 1 gratis`;
			default:
				return `${promotion.value}`;
		}
	}
</script>

<Modal bind:isOpen title="Gestión de Promociones" size="lg" on:close={() => dispatch('close')}>
	<div class="space-y-6">
		{#if loading && promotions.length === 0}
			<div class="flex justify-center py-8">
				<Loading />
			</div>
		{:else}
			<!-- Header Actions -->
			<div class="flex justify-between items-center">
				<p class="text-neutral-600">
					Gestiona promociones y descuentos para atraer más clientes
				</p>
				
				{#if !showCreateForm}
					<Button variant="primary" on:click={startCreatePromotion}>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
						</svg>
						Nueva Promoción
					</Button>
				{/if}
			</div>
			
			{#if error}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{error}
				</div>
			{/if}
			
			<!-- Create/Edit Form -->
			{#if showCreateForm}
				<div class="border border-neutral-200 rounded-lg p-6" transition:fly={{ y: -20, duration: 300 }}>
					<div class="flex justify-between items-center mb-6">
						<h3 class="text-lg font-semibold text-neutral-800">
							{editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
						</h3>
						<button
							type="button"
							class="text-neutral-400 hover:text-neutral-600"
							on:click={() => showCreateForm = false}
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
							</svg>
						</button>
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Basic Info -->
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Nombre de la Promoción <span class="text-red-500">*</span>
								</label>
								<Input
									bind:value={formData.name}
									placeholder="Ej: Descuento de Verano"
									required
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Descripción
								</label>
								<textarea
									bind:value={formData.description}
									class="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
									rows="3"
									placeholder="Describe la promoción para tus clientes"
								></textarea>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Código de Promoción <span class="text-red-500">*</span>
								</label>
								<div class="flex space-x-2">
									<Input
										bind:value={formData.code}
										placeholder="CODIGO"
										class="flex-1"
										required
									/>
									<Button 
										variant="outline" 
										size="sm"
										on:click={() => formData.code = generatePromotionCode()}
									>
										Generar
									</Button>
								</div>
							</div>
						</div>
						
						<!-- Discount Configuration -->
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Tipo de Descuento
								</label>
								<select 
									bind:value={formData.type}
									class="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								>
									{#each promotionTypes as type}
										<option value={type.value}>{type.label}</option>
									{/each}
								</select>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Valor del Descuento <span class="text-red-500">*</span>
								</label>
								<div class="relative">
									<Input
										type="number"
										bind:value={formData.value}
										min="1"
										step={formData.type === 'PERCENTAGE' ? '1' : '100'}
										placeholder={formData.type === 'PERCENTAGE' ? '10' : '1000'}
										required
									/>
									<span class="absolute right-3 top-3 text-neutral-500">
										{formData.type === 'PERCENTAGE' ? '%' : 
										 formData.type === 'FIXED_AMOUNT' ? '$' : 'qty'}
									</span>
								</div>
							</div>
							
							{#if formData.type === 'PERCENTAGE'}
								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">
										Descuento Máximo
									</label>
									<Input
										type="number"
										bind:value={formData.maxDiscountAmount}
										min="0"
										step="100"
										placeholder="Opcional"
									/>
									<p class="text-xs text-neutral-500 mt-1">
										Límite máximo del descuento en pesos
									</p>
								</div>
							{/if}
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Compra Mínima
								</label>
								<Input
									type="number"
									bind:value={formData.minPurchaseAmount}
									min="0"
									step="100"
									placeholder="Opcional"
								/>
								<p class="text-xs text-neutral-500 mt-1">
									Monto mínimo para aplicar la promoción
								</p>
							</div>
						</div>
						
						<!-- Date Range -->
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Fecha de Inicio <span class="text-red-500">*</span>
								</label>
								<Input
									type="date"
									bind:value={formData.startDate}
									min={new Date().toISOString().split('T')[0]}
									required
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Fecha de Fin <span class="text-red-500">*</span>
								</label>
								<Input
									type="date"
									bind:value={formData.endDate}
									min={formData.startDate || new Date().toISOString().split('T')[0]}
									required
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Límite de Uso
								</label>
								<Input
									type="number"
									bind:value={formData.usageLimit}
									min="1"
									placeholder="Opcional"
								/>
								<p class="text-xs text-neutral-500 mt-1">
									Cantidad máxima de veces que se puede usar
								</p>
							</div>
						</div>
						
						<!-- Applicable Services -->
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Servicios Aplicables
								</label>
								<div class="space-y-2 max-h-32 overflow-y-auto border border-neutral-200 rounded-lg p-3">
									<label class="flex items-center">
										<input
											type="checkbox"
											class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
											checked={formData.applicableServices.length === 0}
											on:change={(e) => {
												if (e.currentTarget.checked) {
													formData.applicableServices = [];
												}
											}}
										/>
										<span class="ml-2 text-sm text-neutral-700 font-medium">
											Todos los servicios
										</span>
									</label>
									
									{#each services as service}
										<label class="flex items-center">
											<input
												type="checkbox"
												class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
												checked={formData.applicableServices.includes(service.id)}
												on:change={() => toggleService(service.id)}
											/>
											<span class="ml-2 text-sm text-neutral-700">
												{service.name} - {formatCurrency(service.price)}
											</span>
										</label>
									{/each}
								</div>
							</div>
							
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.firstTimeClientsOnly}
										class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
									/>
									<span class="ml-2 text-sm text-neutral-700">
										Solo para clientes nuevos
									</span>
								</label>
							</div>
							
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.isActive}
										class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
									/>
									<span class="ml-2 text-sm text-neutral-700">
										Promoción activa
									</span>
								</label>
							</div>
						</div>
					</div>
					
					<!-- Form Actions -->
					<div class="flex justify-end space-x-3 mt-6">
						<Button variant="outline" on:click={() => showCreateForm = false}>
							Cancelar
						</Button>
						<Button variant="primary" on:click={savePromotion} disabled={loading}>
							{#if loading}
								<Loading size="sm" class="mr-2" />
							{/if}
							{editingPromotion ? 'Guardar Cambios' : 'Crear Promoción'}
						</Button>
					</div>
				</div>
			{/if}
			
			<!-- Promotions List -->
			{#if !showCreateForm && promotions.length > 0}
				<div class="space-y-4">
					<h3 class="font-medium text-neutral-800">Promociones Actuales</h3>
					
					{#each promotions as promotion (promotion.id)}
						<div 
							class="border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow"
							transition:fade
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center space-x-3 mb-2">
										<h4 class="font-semibold text-neutral-800">{promotion.name}</h4>
										
										<span class="px-3 py-1 text-xs font-medium rounded-full {
											promotion.isActive 
												? 'bg-success-100 text-success-700' 
												: 'bg-neutral-100 text-neutral-600'
										}">
											{promotion.isActive ? 'Activa' : 'Inactiva'}
										</span>
										
										<span class="px-3 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700">
											{getDiscountDisplay(promotion)}
										</span>
									</div>
									
									{#if promotion.description}
										<p class="text-sm text-neutral-600 mb-3">{promotion.description}</p>
									{/if}
									
									<div class="flex flex-wrap gap-4 text-sm text-neutral-600">
										<span class="flex items-center">
											<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
											</svg>
											Código: <span class="font-mono font-medium ml-1">{promotion.code}</span>
										</span>
										
										<span class="flex items-center">
											<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
											</svg>
											{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
										</span>
										
										{#if promotion.usageLimit}
											<span class="flex items-center">
												<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
												</svg>
												Usado: {promotion.usageCount}/{promotion.usageLimit}
											</span>
										{:else}
											<span class="flex items-center">
												<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
												</svg>
												Usado: {promotion.usageCount} veces
											</span>
										{/if}
									</div>
								</div>
								
								<!-- Actions -->
								<div class="flex space-x-2">
									<button
										type="button"
										class="p-2 text-neutral-600 hover:text-brand transition-colors"
										on:click={() => togglePromotionStatus(promotion)}
										disabled={loading}
										title={promotion.isActive ? 'Desactivar' : 'Activar'}
									>
										{#if promotion.isActive}
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
											</svg>
										{:else}
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
											</svg>
										{/if}
									</button>
									
									<button
										type="button"
										class="p-2 text-neutral-600 hover:text-brand transition-colors"
										on:click={() => editPromotion(promotion)}
										disabled={loading}
										title="Editar"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
										</svg>
									</button>
									
									<button
										type="button"
										class="p-2 text-red-600 hover:text-red-800 transition-colors"
										on:click={() => deletePromotion(promotion.id!)}
										disabled={loading}
										title="Eliminar"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if !showCreateForm}
				<div class="text-center py-12">
					<div class="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-neutral-800 mb-2">No tienes promociones activas</h3>
					<p class="text-neutral-600 mb-6">Crea promociones para atraer más clientes</p>
					<Button variant="primary" on:click={startCreatePromotion}>
						Crear Primera Promoción
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</Modal>