<!-- Waitlist Management Component for Clients -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { WaitlistEntry, Service, Provider } from '$lib/types/booking';
	
	export let providerId: string;
	export let serviceId: string | null = null;
	export let preferredDate: string = '';
	export let isOpen = false;
	
	const dispatch = createEventDispatcher<{
		joined: WaitlistEntry;
		cancelled: string;
		close: void;
	}>();
	
	interface WaitlistFormData {
		serviceId: string;
		preferredDate: string;
		preferredTimeSlots: string[];
		maxWaitTime: number;
		notifications: {
			email: boolean;
			sms: boolean;
			push: boolean;
		};
	}
	
	let loading = false;
	let error: string | null = null;
	let services: Service[] = [];
	let provider: Provider | null = null;
	let activeWaitlistEntries: WaitlistEntry[] = [];
	
	let formData: WaitlistFormData = {
		serviceId: serviceId || '',
		preferredDate: preferredDate || '',
		preferredTimeSlots: [],
		maxWaitTime: 24, // hours
		notifications: {
			email: true,
			sms: false,
			push: true
		}
	};
	
	const timeSlotOptions = [
		{ value: '08:00-10:00', label: 'Mañana temprano (8:00 - 10:00)' },
		{ value: '10:00-12:00', label: 'Media mañana (10:00 - 12:00)' },
		{ value: '12:00-14:00', label: 'Mediodía (12:00 - 14:00)' },
		{ value: '14:00-16:00', label: 'Tarde temprano (14:00 - 16:00)' },
		{ value: '16:00-18:00', label: 'Media tarde (16:00 - 18:00)' },
		{ value: '18:00-20:00', label: 'Tarde (18:00 - 20:00)' },
		{ value: '20:00-22:00', label: 'Noche (20:00 - 22:00)' }
	];
	
	const waitTimeOptions = [
		{ value: 2, label: '2 horas' },
		{ value: 6, label: '6 horas' },
		{ value: 12, label: '12 horas' },
		{ value: 24, label: '1 día' },
		{ value: 48, label: '2 días' },
		{ value: 72, label: '3 días' },
		{ value: 168, label: '1 semana' }
	];
	
	onMount(async () => {
		if (isOpen) {
			await loadData();
		}
	});
	
	$: if (isOpen && services.length === 0) {
		loadData();
	}
	
	async function loadData() {
		loading = true;
		error = null;
		
		try {
			// Load provider services
			const servicesResponse = await fetch(`/api/providers/${providerId}/services`);
			if (servicesResponse.ok) {
				services = await servicesResponse.json();
			}
			
			// Load provider info
			const providerResponse = await fetch(`/api/providers/${providerId}`);
			if (providerResponse.ok) {
				provider = await providerResponse.json();
			}
			
			// Load user's active waitlist entries for this provider
			const waitlistResponse = await fetch(`/api/waitlist?providerId=${providerId}&active=true`);
			if (waitlistResponse.ok) {
				activeWaitlistEntries = await waitlistResponse.json();
			}
			
		} catch (err: any) {
			error = err.message || 'Error al cargar datos';
		} finally {
			loading = false;
		}
	}
	
	function toggleTimeSlot(timeSlot: string) {
		if (formData.preferredTimeSlots.includes(timeSlot)) {
			formData.preferredTimeSlots = formData.preferredTimeSlots.filter(ts => ts !== timeSlot);
		} else {
			formData.preferredTimeSlots = [...formData.preferredTimeSlots, timeSlot];
		}
	}
	
	async function joinWaitlist() {
		if (!formData.serviceId || !formData.preferredDate || formData.preferredTimeSlots.length === 0) {
			error = 'Por favor completa todos los campos requeridos';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/waitlist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					providerId,
					serviceId: formData.serviceId,
					preferredDate: new Date(formData.preferredDate).toISOString(),
					preferredTimeSlots: formData.preferredTimeSlots,
					maxWaitTime: formData.maxWaitTime,
					notificationPreferences: formData.notifications
				})
			});
			
			if (response.ok) {
				const waitlistEntry = await response.json();
				dispatch('joined', waitlistEntry);
				
				// Refresh active entries
				await loadData();
				
				// Reset form
				formData = {
					serviceId: serviceId || '',
					preferredDate: '',
					preferredTimeSlots: [],
					maxWaitTime: 24,
					notifications: {
						email: true,
						sms: false,
						push: true
					}
				};
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Error al unirse a la lista de espera';
			}
		} catch (err: any) {
			error = err.message || 'Error de conexión';
		} finally {
			loading = false;
		}
	}
	
	async function cancelWaitlistEntry(entryId: string) {
		loading = true;
		
		try {
			const response = await fetch(`/api/waitlist/${entryId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				dispatch('cancelled', entryId);
				activeWaitlistEntries = activeWaitlistEntries.filter(entry => entry.id !== entryId);
			}
		} catch (err: any) {
			error = err.message || 'Error al cancelar entrada de lista de espera';
		} finally {
			loading = false;
		}
	}
	
	function formatDateTime(date: Date | string) {
		return new Intl.DateTimeFormat('es-AR', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(new Date(date));
	}
	
	function getServiceName(serviceId: string) {
		return services.find(s => s.id === serviceId)?.name || 'Servicio desconocido';
	}
</script>

<Modal bind:isOpen title="Lista de Espera" on:close={() => dispatch('close')}>
	<div class="space-y-6">
		{#if loading}
			<div class="flex justify-center py-8">
				<Loading />
			</div>
		{:else}
			<!-- Provider Info -->
			{#if provider}
				<div class="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
					{#if provider.profileImage}
						<img 
							src={provider.profileImage} 
							alt={provider.businessName}
							class="w-12 h-12 rounded-full object-cover"
						/>
					{:else}
						<div class="w-12 h-12 bg-brand rounded-full flex items-center justify-center">
							<span class="text-white font-semibold text-lg">
								{provider.businessName.charAt(0).toUpperCase()}
							</span>
						</div>
					{/if}
					
					<div>
						<h3 class="font-semibold text-neutral-800">{provider.businessName}</h3>
						<p class="text-sm text-neutral-600">{provider.address}</p>
						<div class="flex items-center mt-1">
							<svg class="w-4 h-4 text-warning-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
							</svg>
							<span class="text-sm text-neutral-600">
								{provider.rating.toFixed(1)} ({provider.totalReviews} reseñas)
							</span>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Active Waitlist Entries -->
			{#if activeWaitlistEntries.length > 0}
				<div class="space-y-3">
					<h3 class="font-medium text-neutral-800">Tus entradas en lista de espera:</h3>
					
					{#each activeWaitlistEntries as entry (entry.id)}
						<div class="p-4 bg-warning-50 border border-warning-200 rounded-lg" transition:fade>
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<h4 class="font-medium text-warning-800">
										{getServiceName(entry.serviceId)}
									</h4>
									<p class="text-sm text-warning-700 mt-1">
										Fecha preferida: {formatDateTime(entry.preferredDate)}
									</p>
									<p class="text-sm text-warning-600">
										Horarios: {entry.preferredTimeSlots.join(', ')}
									</p>
									<p class="text-xs text-warning-600 mt-1">
										Máximo de espera: {entry.maxWaitTime} horas
									</p>
								</div>
								
								<button
									type="button"
									class="text-warning-600 hover:text-warning-800 p-1"
									on:click={() => cancelWaitlistEntry(entry.id)}
									disabled={loading}
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			
			<!-- Waitlist Form -->
			<div class="border-t border-neutral-200 pt-6">
				<h3 class="font-medium text-neutral-800 mb-4">Unirse a Lista de Espera</h3>
				
				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
						{error}
					</div>
				{/if}
				
				<div class="space-y-4">
					<!-- Service Selection -->
					<div>
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Servicio <span class="text-red-500">*</span>
						</label>
						<select 
							bind:value={formData.serviceId}
							class="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
							required
						>
							<option value="">Selecciona un servicio</option>
							{#each services as service}
								<option value={service.id}>
									{service.name} - ${service.price.toLocaleString()}
								</option>
							{/each}
						</select>
					</div>
					
					<!-- Preferred Date -->
					<div>
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Fecha Preferida <span class="text-red-500">*</span>
						</label>
						<Input
							type="date"
							bind:value={formData.preferredDate}
							min={new Date().toISOString().split('T')[0]}
							required
							class="w-full"
						/>
					</div>
					
					<!-- Time Slots -->
					<div>
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Horarios Preferidos <span class="text-red-500">*</span>
						</label>
						<p class="text-xs text-neutral-500 mb-3">
							Selecciona uno o más horarios de tu preferencia
						</p>
						<div class="grid grid-cols-1 gap-2">
							{#each timeSlotOptions as timeSlot}
								<label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors {
									formData.preferredTimeSlots.includes(timeSlot.value) 
										? 'border-brand bg-brand-50' 
										: 'border-neutral-300'
								}">
									<input
										type="checkbox"
										class="sr-only"
										value={timeSlot.value}
										checked={formData.preferredTimeSlots.includes(timeSlot.value)}
										on:change={() => toggleTimeSlot(timeSlot.value)}
									/>
									<div class="flex-1">
										<span class="text-sm font-medium text-neutral-800">
											{timeSlot.label}
										</span>
									</div>
									{#if formData.preferredTimeSlots.includes(timeSlot.value)}
										<svg class="w-5 h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
										</svg>
									{/if}
								</label>
							{/each}
						</div>
					</div>
					
					<!-- Max Wait Time -->
					<div>
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Tiempo Máximo de Espera
						</label>
						<select 
							bind:value={formData.maxWaitTime}
							class="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
						>
							{#each waitTimeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					
					<!-- Notification Preferences -->
					<div>
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Notificaciones
						</label>
						<div class="space-y-2">
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.notifications.email}
									class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
								/>
								<span class="ml-2 text-sm text-neutral-700">Email</span>
							</label>
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.notifications.sms}
									class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
								/>
								<span class="ml-2 text-sm text-neutral-700">SMS</span>
							</label>
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.notifications.push}
									class="h-4 w-4 text-brand border-neutral-300 rounded focus:ring-brand"
								/>
								<span class="ml-2 text-sm text-neutral-700">Notificaciones Push</span>
							</label>
						</div>
					</div>
				</div>
				
				<!-- Action Buttons -->
				<div class="flex justify-end space-x-3 mt-6">
					<Button variant="outline" on:click={() => dispatch('close')} disabled={loading}>
						Cancelar
					</Button>
					<Button variant="primary" on:click={joinWaitlist} disabled={loading}>
						{#if loading}
							<Loading size="sm" class="mr-2" />
						{/if}
						Unirse a Lista de Espera
					</Button>
				</div>
			</div>
		{/if}
	</div>
</Modal>