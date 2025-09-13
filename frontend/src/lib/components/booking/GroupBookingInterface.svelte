<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { format, addMinutes, parseISO } from 'date-fns';
	import { es } from 'date-fns/locale';
	import { fly } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let providerId: string;
	export let vertical: 'barber' | 'psychology' = 'barber';
	export let maxGroupSize = vertical === 'psychology' ? 6 : 4; // Psychology groups can be larger
	export let enableFamilyPlans = true;
	export let showDiscountCalculator = true;

	interface GroupMember {
		id: string;
		name: string;
		phone?: string;
		email?: string;
		age?: number;
		relationship?: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
		services: SelectedService[];
		specialRequirements?: string;
		isMinor?: boolean;
		guardianConsent?: boolean;
	}

	interface SelectedService {
		id: string;
		name: string;
		duration: number; // minutes
		price: number;
		category: string;
		requirements?: string[];
		ageRestrictions?: {
			min?: number;
			max?: number;
		};
	}

	interface TimeSlot {
		startTime: string;
		endTime: string;
		available: boolean;
		capacity: number;
		bookedSlots: number;
	}

	interface GroupDiscount {
		minSize: number;
		maxSize: number;
		discountPercentage: number;
		description: string;
	}

	interface FamilyPlan {
		id: string;
		name: string;
		description: string;
		minMembers: number;
		maxMembers: number;
		discountPercentage: number;
		includedServices: string[];
		monthlyPrice?: number;
		benefits: string[];
	}

	let groupMembers: GroupMember[] = [];
	let availableServices: SelectedService[] = [];
	let availableTimeSlots: TimeSlot[] = [];
	let groupDiscounts: GroupDiscount[] = [];
	let familyPlans: FamilyPlan[] = [];

	let selectedDate: string = '';
	let selectedTimeSlot: TimeSlot | null = null;
	let totalDuration = 0;
	let subtotal = 0;
	let discountAmount = 0;
	let totalAmount = 0;
	let selectedFamilyPlan: FamilyPlan | null = null;

	let currentStep: 'members' | 'services' | 'schedule' | 'payment' | 'confirmation' = 'members';
	let loading = false;
	let error: string | null = null;

	// Form state
	let showAddMemberModal = false;
	let editingMember: GroupMember | null = null;
	let showFamilyPlanModal = false;

	const relationshipOptions = [
		{ value: 'self', label: 'Yo mismo/a' },
		{ value: 'spouse', label: 'Cónyuge/Pareja' },
		{ value: 'child', label: 'Hijo/a' },
		{ value: 'parent', label: 'Padre/Madre' },
		{ value: 'sibling', label: 'Hermano/a' },
		{ value: 'other', label: 'Otro familiar' }
	];

	onMount(async () => {
		await loadAvailableServices();
		await loadGroupDiscounts();
		if (enableFamilyPlans) {
			await loadFamilyPlans();
		}
		
		// Add initial member (the booking user)
		addInitialMember();
	});

	async function loadAvailableServices() {
		try {
			const response = await fetch(`/api/providers/${providerId}/services?groupBooking=true`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				availableServices = await response.json();
			}
		} catch (err) {
			console.error('Error loading services:', err);
		}
	}

	async function loadGroupDiscounts() {
		try {
			const response = await fetch(`/api/providers/${providerId}/group-discounts`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				groupDiscounts = await response.json();
			}
		} catch (err) {
			console.error('Error loading group discounts:', err);
		}
	}

	async function loadFamilyPlans() {
		try {
			const response = await fetch(`/api/providers/${providerId}/family-plans`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				familyPlans = await response.json();
			}
		} catch (err) {
			console.error('Error loading family plans:', err);
		}
	}

	async function loadAvailableTimeSlots() {
		if (!selectedDate) return;

		try {
			loading = true;
			const response = await fetch(
				`/api/providers/${providerId}/availability?date=${selectedDate}&groupSize=${groupMembers.length}&duration=${totalDuration}`,
				{
					headers: {
						'Authorization': `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (response.ok) {
				availableTimeSlots = await response.json();
			}
		} catch (err) {
			console.error('Error loading time slots:', err);
		} finally {
			loading = false;
		}
	}

	function addInitialMember() {
		const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
		
		groupMembers = [{
			id: 'main',
			name: `${userInfo.firstName} ${userInfo.lastName}` || '',
			phone: userInfo.phone || '',
			email: userInfo.email || '',
			relationship: 'self',
			services: [],
			isMinor: false
		}];
	}

	function addMember() {
		if (groupMembers.length >= maxGroupSize) {
			error = `Máximo ${maxGroupSize} personas por grupo`;
			return;
		}

		const newMember: GroupMember = {
			id: `member_${Date.now()}`,
			name: '',
			relationship: 'other',
			services: [],
			isMinor: false
		};

		groupMembers = [...groupMembers, newMember];
		editingMember = newMember;
		showAddMemberModal = true;
	}

	function removeMember(memberId: string) {
		if (memberId === 'main') return; // Can't remove primary member
		
		groupMembers = groupMembers.filter(m => m.id !== memberId);
		calculateTotals();
	}

	function addServiceToMember(memberId: string, service: SelectedService) {
		groupMembers = groupMembers.map(member => {
			if (member.id === memberId) {
				// Check age restrictions
				if (service.ageRestrictions && member.age) {
					if (service.ageRestrictions.min && member.age < service.ageRestrictions.min) {
						error = `${service.name} requiere edad mínima de ${service.ageRestrictions.min} años`;
						return member;
					}
					if (service.ageRestrictions.max && member.age > service.ageRestrictions.max) {
						error = `${service.name} requiere edad máxima de ${service.ageRestrictions.max} años`;
						return member;
					}
				}

				return {
					...member,
					services: [...member.services, service]
				};
			}
			return member;
		});

		calculateTotals();
	}

	function removeServiceFromMember(memberId: string, serviceId: string) {
		groupMembers = groupMembers.map(member => {
			if (member.id === memberId) {
				return {
					...member,
					services: member.services.filter(s => s.id !== serviceId)
				};
			}
			return member;
		});

		calculateTotals();
	}

	function calculateTotals() {
		// Calculate total duration (overlapping services for simultaneous booking)
		const allServices = groupMembers.flatMap(m => m.services);
		totalDuration = Math.max(...allServices.map(s => s.duration), 0);

		// Calculate subtotal
		subtotal = allServices.reduce((sum, service) => sum + service.price, 0);

		// Calculate group discount
		discountAmount = calculateGroupDiscount();

		// Apply family plan discount if selected
		if (selectedFamilyPlan) {
			const familyPlanDiscount = (subtotal * selectedFamilyPlan.discountPercentage) / 100;
			discountAmount = Math.max(discountAmount, familyPlanDiscount);
		}

		totalAmount = subtotal - discountAmount;
	}

	function calculateGroupDiscount(): number {
		const groupSize = groupMembers.length;
		const applicableDiscount = groupDiscounts.find(
			d => groupSize >= d.minSize && groupSize <= d.maxSize
		);

		if (applicableDiscount) {
			return (subtotal * applicableDiscount.discountPercentage) / 100;
		}

		return 0;
	}

	function selectFamilyPlan(plan: FamilyPlan) {
		selectedFamilyPlan = plan;
		calculateTotals();
		showFamilyPlanModal = false;
	}

	function validateStep(): boolean {
		error = null;

		switch (currentStep) {
			case 'members':
				if (groupMembers.length < 2) {
					error = 'Se requieren al menos 2 personas para una reserva grupal';
					return false;
				}
				
				for (const member of groupMembers) {
					if (!member.name.trim()) {
						error = 'Todos los miembros deben tener un nombre';
						return false;
					}
					
					if (member.isMinor && !member.guardianConsent) {
						error = `Se requiere consentimiento del tutor para ${member.name}`;
						return false;
					}
				}
				break;

			case 'services':
				const membersWithoutServices = groupMembers.filter(m => m.services.length === 0);
				if (membersWithoutServices.length > 0) {
					error = 'Todos los miembros deben tener al menos un servicio seleccionado';
					return false;
				}
				break;

			case 'schedule':
				if (!selectedDate || !selectedTimeSlot) {
					error = 'Selecciona fecha y hora para la reserva';
					return false;
				}
				break;
		}

		return true;
	}

	function nextStep() {
		if (!validateStep()) return;

		const steps: typeof currentStep[] = ['members', 'services', 'schedule', 'payment', 'confirmation'];
		const currentIndex = steps.indexOf(currentStep);
		
		if (currentIndex < steps.length - 1) {
			currentStep = steps[currentIndex + 1];
			
			if (currentStep === 'schedule') {
				loadAvailableTimeSlots();
			}
		}
	}

	function previousStep() {
		const steps: typeof currentStep[] = ['members', 'services', 'schedule', 'payment', 'confirmation'];
		const currentIndex = steps.indexOf(currentStep);
		
		if (currentIndex > 0) {
			currentStep = steps[currentIndex - 1];
		}
	}

	async function submitGroupBooking() {
		try {
			loading = true;
			error = null;

			const bookingData = {
				providerId,
				groupMembers: groupMembers.map(member => ({
					...member,
					services: member.services.map(s => s.id)
				})),
				date: selectedDate,
				timeSlot: selectedTimeSlot,
				totalAmount,
				discountAmount,
				familyPlanId: selectedFamilyPlan?.id,
				specialRequirements: groupMembers
					.filter(m => m.specialRequirements)
					.map(m => `${m.name}: ${m.specialRequirements}`)
					.join('; ')
			};

			const response = await fetch('/api/bookings/group', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bookingData)
			});

			if (!response.ok) {
				throw new Error('Error al crear la reserva grupal');
			}

			const result = await response.json();
			
			dispatch('booking-created', result);
			currentStep = 'confirmation';

		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function getStepTitle(): string {
		switch (currentStep) {
			case 'members': return 'Miembros del Grupo';
			case 'services': return 'Selección de Servicios';
			case 'schedule': return 'Fecha y Hora';
			case 'payment': return 'Pago';
			case 'confirmation': return 'Confirmación';
			default: return '';
		}
	}

	$: calculateTotals();
	$: if (selectedDate && totalDuration > 0) loadAvailableTimeSlots();
</script>

<div class="max-w-4xl mx-auto">
	<!-- Progress Indicator -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			{#each ['members', 'services', 'schedule', 'payment', 'confirmation'] as step, index}
				<div class="flex items-center">
					<div 
						class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
						class:bg-primary-600={currentStep === step || (['services', 'schedule', 'payment', 'confirmation'].indexOf(currentStep) > ['services', 'schedule', 'payment', 'confirmation'].indexOf(step))}
						class:text-white={currentStep === step || (['services', 'schedule', 'payment', 'confirmation'].indexOf(currentStep) > ['services', 'schedule', 'payment', 'confirmation'].indexOf(step))}
						class:bg-neutral-200={currentStep !== step && (['services', 'schedule', 'payment', 'confirmation'].indexOf(currentStep) <= ['services', 'schedule', 'payment', 'confirmation'].indexOf(step))}
						class:text-neutral-600={currentStep !== step && (['services', 'schedule', 'payment', 'confirmation'].indexOf(currentStep) <= ['services', 'schedule', 'payment', 'confirmation'].indexOf(step))}
					>
						{index + 1}
					</div>
					{#if index < 4}
						<div class="w-16 h-1 mx-2 bg-neutral-200 rounded"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Header -->
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold text-neutral-800">Reserva Grupal</h1>
		<h2 class="text-xl text-neutral-600 mt-2">{getStepTitle()}</h2>
		
		{#if error}
			<div class="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
				{error}
			</div>
		{/if}
	</div>

	<!-- Step Content -->
	<div class="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 mb-6">
		{#if currentStep === 'members'}
			<div class="space-y-6">
				<!-- Family Plans Promotion -->
				{#if enableFamilyPlans && familyPlans.length > 0}
					<div class="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-4">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-semibold text-primary-800">¿Familia Regular?</h3>
								<p class="text-sm text-primary-600">Ahorra hasta 30% con nuestros planes familiares</p>
							</div>
							<button 
								class="btn btn-primary btn-sm"
								on:click={() => showFamilyPlanModal = true}
							>
								Ver Planes
							</button>
						</div>
					</div>
				{/if}

				<!-- Group Members List -->
				<div class="space-y-4">
					{#each groupMembers as member, index}
						<div class="border border-neutral-200 rounded-lg p-4" transition:fly={{ y: 20, duration: 300 }}>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-2">
										<h4 class="font-medium text-neutral-800">
											{member.name || `Miembro ${index + 1}`}
										</h4>
										{#if member.relationship === 'self'}
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-800">
												Principal
											</span>
										{/if}
										{#if member.isMinor}
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-warning-100 text-warning-800">
												Menor
											</span>
										{/if}
									</div>
									
									<div class="text-sm text-neutral-600 space-y-1">
										{#if member.phone}
											<div>📞 {member.phone}</div>
										{/if}
										{#if member.email}
											<div>📧 {member.email}</div>
										{/if}
										{#if member.age}
											<div>🎂 {member.age} años</div>
										{/if}
										{#if member.relationship}
											<div>👥 {relationshipOptions.find(r => r.value === member.relationship)?.label}</div>
										{/if}
									</div>
								</div>
								
								<div class="flex items-center gap-2">
									<button 
										class="btn btn-secondary btn-sm"
										on:click={() => {
											editingMember = member;
											showAddMemberModal = true;
										}}
									>
										Editar
									</button>
									{#if member.id !== 'main'}
										<button 
											class="btn btn-ghost btn-sm text-error-600"
											on:click={() => removeMember(member.id)}
										>
											Eliminar
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Add Member Button -->
				{#if groupMembers.length < maxGroupSize}
					<button 
						class="w-full border-2 border-dashed border-neutral-300 rounded-lg p-6 text-neutral-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
						on:click={addMember}
					>
						<svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Agregar Miembro ({groupMembers.length}/{maxGroupSize})
					</button>
				{/if}
			</div>

		{:else if currentStep === 'services'}
			<div class="space-y-6">
				{#each groupMembers as member}
					<div class="border border-neutral-200 rounded-lg p-4">
						<h4 class="font-medium text-neutral-800 mb-4">{member.name}</h4>
						
						<!-- Selected Services -->
						{#if member.services.length > 0}
							<div class="mb-4 space-y-2">
								{#each member.services as service}
									<div class="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-3">
										<div>
											<span class="font-medium text-primary-800">{service.name}</span>
											<span class="text-sm text-primary-600 ml-2">
												{service.duration}min • {formatCurrency(service.price)}
											</span>
										</div>
										<button 
											class="text-error-600 hover:text-error-700"
											on:click={() => removeServiceFromMember(member.id, service.id)}
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Available Services -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each availableServices as service}
								<button
									class="text-left border border-neutral-200 rounded-lg p-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
									on:click={() => addServiceToMember(member.id, service)}
									disabled={member.services.some(s => s.id === service.id)}
								>
									<div class="font-medium text-neutral-800">{service.name}</div>
									<div class="text-sm text-neutral-600">{service.category}</div>
									<div class="text-sm font-medium text-primary-600 mt-1">
										{service.duration}min • {formatCurrency(service.price)}
									</div>
									{#if service.ageRestrictions}
										<div class="text-xs text-warning-600 mt-1">
											Edad: {service.ageRestrictions.min || 0}-{service.ageRestrictions.max || '∞'} años
										</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>

		{:else if currentStep === 'schedule'}
			<div class="space-y-6">
				<!-- Date Selection -->
				<div>
					<label class="form-label">Fecha de la Reserva</label>
					<input 
						type="date" 
						class="form-input"
						bind:value={selectedDate}
						min={format(new Date(), 'yyyy-MM-dd')}
					/>
				</div>

				<!-- Time Slots -->
				{#if selectedDate}
					<div>
						<label class="form-label">Horarios Disponibles</label>
						
						{#if loading}
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								{#each Array(8) as _}
									<div class="skeleton h-12"></div>
								{/each}
							</div>
						{:else if availableTimeSlots.length === 0}
							<div class="text-center py-8 text-neutral-500">
								No hay horarios disponibles para esta fecha
							</div>
						{:else}
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								{#each availableTimeSlots as slot}
									<button
										class="p-3 border rounded-lg text-sm transition-colors"
										class:border-primary-600={selectedTimeSlot === slot}
										class:bg-primary-50={selectedTimeSlot === slot}
										class:text-primary-800={selectedTimeSlot === slot}
										class:border-neutral-200={selectedTimeSlot !== slot}
										class:hover:border-primary-300={slot.available}
										disabled={!slot.available}
										on:click={() => selectedTimeSlot = slot}
									>
										<div class="font-medium">
											{format(parseISO(`${selectedDate}T${slot.startTime}`), 'HH:mm')}
										</div>
										<div class="text-xs text-neutral-600">
											{slot.capacity - slot.bookedSlots} espacios
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Duration Info -->
				{#if totalDuration > 0}
					<div class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
						<h4 class="font-medium text-neutral-800 mb-2">Información de la Sesión</h4>
						<div class="text-sm text-neutral-600">
							<div>Duración total: {totalDuration} minutos</div>
							<div>Personas: {groupMembers.length}</div>
							{#if selectedTimeSlot}
								<div>
									Finaliza aproximadamente: 
									{format(addMinutes(parseISO(`${selectedDate}T${selectedTimeSlot.startTime}`), totalDuration), 'HH:mm')}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

		{:else if currentStep === 'payment'}
			<div class="space-y-6">
				<!-- Booking Summary -->
				<div class="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
					<h3 class="font-semibold text-neutral-800 mb-4">Resumen de la Reserva</h3>
					
					<div class="space-y-3 text-sm">
						<div class="flex justify-between">
							<span>Fecha:</span>
							<span class="font-medium">
								{format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy', { locale: es })}
							</span>
						</div>
						
						<div class="flex justify-between">
							<span>Hora:</span>
							<span class="font-medium">
								{selectedTimeSlot ? format(parseISO(`${selectedDate}T${selectedTimeSlot.startTime}`), 'HH:mm') : ''}
							</span>
						</div>
						
						<div class="flex justify-between">
							<span>Duración:</span>
							<span class="font-medium">{totalDuration} minutos</span>
						</div>
						
						<div class="flex justify-between">
							<span>Personas:</span>
							<span class="font-medium">{groupMembers.length}</span>
						</div>
					</div>
				</div>

				<!-- Price Breakdown -->
				<div class="border border-neutral-200 rounded-lg p-6">
					<h3 class="font-semibold text-neutral-800 mb-4">Desglose de Precios</h3>
					
					<div class="space-y-3">
						{#each groupMembers as member}
							{#if member.services.length > 0}
								<div class="border-b border-neutral-100 pb-3">
									<div class="font-medium text-neutral-800 mb-2">{member.name}</div>
									{#each member.services as service}
										<div class="flex justify-between text-sm">
											<span class="text-neutral-600">{service.name}</span>
											<span>{formatCurrency(service.price)}</span>
										</div>
									{/each}
								</div>
							{/if}
						{/each}
						
						<div class="border-t border-neutral-200 pt-3 space-y-2">
							<div class="flex justify-between">
								<span>Subtotal:</span>
								<span class="font-medium">{formatCurrency(subtotal)}</span>
							</div>
							
							{#if discountAmount > 0}
								<div class="flex justify-between text-success-600">
									<span>
										Descuento {selectedFamilyPlan ? '(Plan Familiar)' : '(Grupo)'}:
									</span>
									<span>-{formatCurrency(discountAmount)}</span>
								</div>
							{/if}
							
							<div class="flex justify-between text-lg font-semibold border-t border-neutral-200 pt-2">
								<span>Total:</span>
								<span>{formatCurrency(totalAmount)}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Payment Method Selection -->
				<div class="border border-neutral-200 rounded-lg p-6">
					<h3 class="font-semibold text-neutral-800 mb-4">Método de Pago</h3>
					<!-- Payment form would go here -->
					<p class="text-sm text-neutral-600">
						Formulario de pago será integrado aquí...
					</p>
				</div>
			</div>

		{:else if currentStep === 'confirmation'}
			<div class="text-center py-8">
				<div class="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				
				<h3 class="text-2xl font-bold text-success-800 mb-2">¡Reserva Confirmada!</h3>
				<p class="text-neutral-600 mb-6">
					Hemos enviado los detalles de la reserva a todos los miembros del grupo.
				</p>
				
				<div class="bg-success-50 border border-success-200 rounded-lg p-4 mb-6 text-left">
					<h4 class="font-semibold text-success-800 mb-2">Próximos Pasos:</h4>
					<ul class="text-sm text-success-700 space-y-1">
						<li>• Recibirás un recordatorio 24 horas antes</li>
						<li>• Puedes modificar o cancelar hasta 2 horas antes</li>
						<li>• Presenta tu ID de reserva al llegar</li>
						{#if vertical === 'psychology'}
							<li>• Asegúrate de que todos los menores tengan consentimiento firmado</li>
						{/if}
					</ul>
				</div>
				
				<button class="btn btn-primary" on:click={() => dispatch('booking-complete')}>
					Volver al Dashboard
				</button>
			</div>
		{/if}
	</div>

	<!-- Navigation Buttons -->
	{#if currentStep !== 'confirmation'}
		<div class="flex justify-between">
			<button 
				class="btn btn-secondary"
				on:click={previousStep}
				disabled={currentStep === 'members'}
			>
				Anterior
			</button>
			
			{#if currentStep === 'payment'}
				<button 
					class="btn btn-primary"
					on:click={submitGroupBooking}
					disabled={loading}
				>
					{loading ? 'Procesando...' : `Pagar ${formatCurrency(totalAmount)}`}
				</button>
			{:else}
				<button 
					class="btn btn-primary"
					on:click={nextStep}
				>
					Siguiente
				</button>
			{/if}
		</div>
	{/if}
</div>

<!-- Add/Edit Member Modal -->
{#if showAddMemberModal && editingMember}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-lg font-semibold">
						{editingMember.id === 'main' ? 'Editar Información' : 'Agregar Miembro'}
					</h3>
					<button 
						class="text-neutral-500 hover:text-neutral-700"
						on:click={() => showAddMemberModal = false}
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<div class="space-y-4">
					<div>
						<label class="form-label">Nombre Completo</label>
						<input 
							type="text" 
							class="form-input"
							bind:value={editingMember.name}
							placeholder="Nombre completo"
						/>
					</div>
					
					<div>
						<label class="form-label">Relación</label>
						<select class="form-input" bind:value={editingMember.relationship}>
							{#each relationshipOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="form-label">Edad</label>
							<input 
								type="number" 
								class="form-input"
								bind:value={editingMember.age}
								min="0"
								max="120"
							/>
						</div>
						
						<div class="flex items-center pt-8">
							<input 
								type="checkbox" 
								id="is-minor"
								bind:checked={editingMember.isMinor}
								class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
							/>
							<label for="is-minor" class="ml-2 text-sm">Menor de edad</label>
						</div>
					</div>
					
					{#if editingMember.id === 'main' || !editingMember.isMinor}
						<div>
							<label class="form-label">Teléfono</label>
							<input 
								type="tel" 
								class="form-input"
								bind:value={editingMember.phone}
								placeholder="+54 9 11 1234-5678"
							/>
						</div>
						
						<div>
							<label class="form-label">Email</label>
							<input 
								type="email" 
								class="form-input"
								bind:value={editingMember.email}
								placeholder="email@ejemplo.com"
							/>
						</div>
					{/if}
					
					{#if editingMember.isMinor}
						<div class="flex items-center">
							<input 
								type="checkbox" 
								id="guardian-consent"
								bind:checked={editingMember.guardianConsent}
								class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
							/>
							<label for="guardian-consent" class="ml-2 text-sm">
								Tengo consentimiento del tutor legal
							</label>
						</div>
					{/if}
					
					<div>
						<label class="form-label">Requerimientos Especiales</label>
						<textarea 
							class="form-input"
							bind:value={editingMember.specialRequirements}
							placeholder="Alergias, condiciones especiales, etc."
							rows="3"
						></textarea>
					</div>
				</div>
				
				<div class="flex gap-3 mt-6">
					<button 
						class="btn btn-primary flex-1"
						on:click={() => {
							showAddMemberModal = false;
							editingMember = null;
						}}
					>
						Guardar
					</button>
					<button 
						class="btn btn-secondary"
						on:click={() => {
							showAddMemberModal = false;
							editingMember = null;
						}}
					>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Family Plans Modal -->
{#if showFamilyPlanModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-lg font-semibold">Planes Familiares</h3>
					<button 
						class="text-neutral-500 hover:text-neutral-700"
						on:click={() => showFamilyPlanModal = false}
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<div class="space-y-4">
					{#each familyPlans as plan}
						<div 
							class="border border-neutral-200 rounded-lg p-4 cursor-pointer hover:border-primary-300 transition-colors"
							class:border-primary-600={selectedFamilyPlan?.id === plan.id}
							class:bg-primary-50={selectedFamilyPlan?.id === plan.id}
							on:click={() => selectFamilyPlan(plan)}
							role="button"
							tabindex="0"
						>
							<div class="flex justify-between items-start mb-2">
								<h4 class="font-semibold text-neutral-800">{plan.name}</h4>
								<span class="text-lg font-bold text-primary-600">
									{plan.discountPercentage}% OFF
								</span>
							</div>
							
							<p class="text-sm text-neutral-600 mb-3">{plan.description}</p>
							
							<div class="text-sm space-y-1">
								<div>👥 {plan.minMembers}-{plan.maxMembers} miembros</div>
								{#if plan.monthlyPrice}
									<div>💳 {formatCurrency(plan.monthlyPrice)}/mes</div>
								{/if}
							</div>
							
							<div class="mt-3">
								<h5 class="text-xs font-semibold text-neutral-700 mb-1">Beneficios:</h5>
								<ul class="text-xs text-neutral-600 space-y-0.5">
									{#each plan.benefits as benefit}
										<li>• {benefit}</li>
									{/each}
								</ul>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="flex gap-3 mt-6">
					<button 
						class="btn btn-primary flex-1"
						on:click={() => showFamilyPlanModal = false}
						disabled={!selectedFamilyPlan}
					>
						Aplicar Plan
					</button>
					<button 
						class="btn btn-secondary"
						on:click={() => {
							selectedFamilyPlan = null;
							showFamilyPlanModal = false;
						}}
					>
						Sin Plan
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}