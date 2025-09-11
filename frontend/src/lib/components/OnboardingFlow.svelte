<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { user, isProvider, isClient } from '$lib/stores/auth';
	import { Button, Modal, ProgressIndicator } from '$lib/components';

	export let open = false;

	const dispatch = createEventDispatcher();

	let currentStep = 0;
	let completedSteps: boolean[] = [];

	// Define onboarding steps based on user role
	$: steps = $isProvider ? providerSteps : clientSteps;
	$: progress = (currentStep / (steps.length - 1)) * 100;

	const clientSteps = [
		{
			title: '¡Bienvenido a BarberPro!',
			description: 'Te ayudaremos a configurar tu cuenta para que puedas reservar los mejores servicios de barbería en Argentina.',
			icon: '🎉',
			actions: ['next']
		},
		{
			title: 'Completa tu perfil',
			description: 'Agrega tu información personal para obtener recomendaciones personalizadas.',
			icon: '👤',
			actions: ['profile', 'skip'],
			link: '/dashboard/client/profile'
		},
		{
			title: 'Encuentra tu ubicación',
			description: 'Permite que encontremos los mejores servicios cerca de ti.',
			icon: '📍',
			actions: ['location', 'skip']
		},
		{
			title: 'Explora servicios',
			description: 'Descubre servicios de barbería cerca de ti y reserva tu primera cita.',
			icon: '✂️',
			actions: ['explore', 'finish'],
			link: '/servicios'
		},
		{
			title: '¡Todo listo!',
			description: 'Tu cuenta está configurada. ¡Disfruta de BarberPro!',
			icon: '🚀',
			actions: ['finish']
		}
	];

	const providerSteps = [
		{
			title: '¡Bienvenido, Profesional!',
			description: 'Te ayudaremos a configurar tu perfil profesional para que puedas empezar a recibir clientes.',
			icon: '💼',
			actions: ['next']
		},
		{
			title: 'Completa tu perfil profesional',
			description: 'Agrega tu información profesional, servicios y experiencia.',
			icon: '⭐',
			actions: ['profile', 'skip'],
			link: '/dashboard/provider/profile'
		},
		{
			title: 'Configura tus servicios',
			description: 'Define los servicios que ofreces y sus precios.',
			icon: '✂️',
			actions: ['services', 'skip'],
			link: '/dashboard/provider/services'
		},
		{
			title: 'Establece tus horarios',
			description: 'Configura tu disponibilidad y horarios de atención.',
			icon: '📅',
			actions: ['schedule', 'skip'],
			link: '/dashboard/provider/schedule'
		},
		{
			title: 'Agrega fotos de tu trabajo',
			description: 'Sube fotos de tus trabajos para atraer más clientes.',
			icon: '📸',
			actions: ['portfolio', 'skip'],
			link: '/dashboard/provider/profile#portfolio'
		},
		{
			title: '¡Tu negocio está listo!',
			description: 'Tu perfil profesional está configurado. ¡Empieza a recibir reservas!',
			icon: '🎯',
			actions: ['finish']
		}
	];

	function nextStep() {
		if (currentStep < steps.length - 1) {
			completedSteps[currentStep] = true;
			currentStep += 1;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep -= 1;
		}
	}

	function skipStep() {
		nextStep();
	}

	function goToProfile() {
		const link = steps[currentStep].link;
		if (link) {
			window.open(link, '_blank');
		}
		nextStep();
	}

	function goToServices() {
		window.open('/dashboard/provider/services', '_blank');
		nextStep();
	}

	function goToSchedule() {
		window.open('/dashboard/provider/schedule', '_blank');
		nextStep();
	}

	function goToPortfolio() {
		window.open('/dashboard/provider/profile#portfolio', '_blank');
		nextStep();
	}

	function goToExplore() {
		window.open('/servicios', '_blank');
		nextStep();
	}

	function finishOnboarding() {
		open = false;
		dispatch('complete');
		
		// Mark onboarding as completed in localStorage
		localStorage.setItem('onboarding_completed', 'true');
	}

	function handleAction(action: string) {
		switch (action) {
			case 'next':
				nextStep();
				break;
			case 'skip':
				skipStep();
				break;
			case 'profile':
				goToProfile();
				break;
			case 'services':
				goToServices();
				break;
			case 'schedule':
				goToSchedule();
				break;
			case 'portfolio':
				goToPortfolio();
				break;
			case 'location':
				// For location, we could integrate with geolocation API
				nextStep();
				break;
			case 'explore':
				goToExplore();
				break;
			case 'finish':
				finishOnboarding();
				break;
		}
	}

	$: currentStepData = steps[currentStep];
</script>

<Modal bind:open size="lg" className="onboarding-modal">
	<div class="p-8">
		<!-- Progress -->
		<div class="mb-8">
			<ProgressIndicator
				percentage={progress}
				variant="primary"
				size="md"
				showLabel={false}
			/>
			<div class="flex justify-between items-center mt-2">
				<span class="text-sm text-neutral-500">
					Paso {currentStep + 1} de {steps.length}
				</span>
				<span class="text-sm font-medium text-primary-600">
					{Math.round(progress)}% completado
				</span>
			</div>
		</div>

		<!-- Step Content -->
		<div class="text-center mb-8">
			<!-- Icon -->
			<div class="text-6xl mb-4">
				{currentStepData.icon}
			</div>
			
			<!-- Title -->
			<h2 class="text-2xl font-bold text-neutral-800 mb-4">
				{currentStepData.title}
			</h2>
			
			<!-- Description -->
			<p class="text-neutral-600 text-lg leading-relaxed max-w-md mx-auto">
				{currentStepData.description}
			</p>
		</div>

		<!-- Actions -->
		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			{#each currentStepData.actions as action}
				{#if action === 'next'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						Continuar
					</Button>
				{:else if action === 'skip'}
					<Button
						variant="ghost"
						size="lg"
						on:click={() => handleAction(action)}
					>
						Omitir por ahora
					</Button>
				{:else if action === 'profile'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						Completar Perfil
					</Button>
				{:else if action === 'services'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Configurar Servicios
					</Button>
				{:else if action === 'schedule'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						Configurar Horarios
					</Button>
				{:else if action === 'portfolio'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						Agregar Fotos
					</Button>
				{:else if action === 'location'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Permitir Ubicación
					</Button>
				{:else if action === 'explore'}
					<Button
						variant="primary"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						Explorar Servicios
					</Button>
				{:else if action === 'finish'}
					<Button
						variant="success"
						size="lg"
						on:click={() => handleAction(action)}
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						¡Empezar!
					</Button>
				{/if}
			{/each}
		</div>

		<!-- Navigation -->
		{#if currentStep > 0 && currentStep < steps.length - 1}
			<div class="flex justify-center mt-6">
				<Button
					variant="ghost"
					size="sm"
					on:click={prevStep}
				>
					<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Anterior
				</Button>
			</div>
		{/if}

		<!-- Skip onboarding -->
		{#if currentStep < steps.length - 1}
			<div class="text-center mt-6 pt-6 border-t border-neutral-200">
				<button
					class="text-sm text-neutral-500 hover:text-neutral-700"
					on:click={finishOnboarding}
				>
					Omitir configuración inicial
				</button>
			</div>
		{/if}
	</div>
</Modal>

<style>
	:global(.onboarding-modal .modal-content) {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	}
</style>