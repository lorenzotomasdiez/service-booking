<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Modal, Loading } from '$lib/components';

	// Hot reload test - this file changed to verify Vite HMR
	let mounted = false;
	let showModal = false;
	let inputValue = '';
	let phoneValue = '';
	let dniValue = '';
	let emailValue = '';
	let loadingState = false;

	onMount(() => {
		mounted = true;
	});

	function handleButtonClick(event: CustomEvent) {
		console.log('Button clicked:', event.detail);
	}

	function handleInputChange(event: CustomEvent) {
		console.log('Input changed:', event.detail.value);
	}

	function simulateLoading() {
		loadingState = true;
		setTimeout(() => {
			loadingState = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>BarberPro - Componentes Demo</title>
	<meta name="description" content="Demostración de componentes de BarberPro - Plataforma de reservas premium para Argentina" />
</svelte:head>

<div class="container-responsive py-12 space-y-16">
	<!-- Hero Section -->
	<section class="text-center space-y-6">
		<div class="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto">
			B
		</div>
		<div>
			<h1 class="text-4xl md:text-6xl font-bold text-neutral-800 mb-4">
				BarberPro
			</h1>
			<p class="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto">
				La plataforma premium de reservas de servicios para Argentina
			</p>
		</div>
		
		{#if mounted}
			<div class="bg-primary-50 border border-primary-200 rounded-xl p-6 max-w-md mx-auto">
				<p class="text-primary-800 font-semibold mb-2">
					✅ Sistema funcionando correctamente
				</p>
				<p class="text-primary-700">
					🎯 Componentes móviles optimizados para Argentina
				</p>
			</div>
		{/if}
	</section>

	<!-- Button Components Demo -->
	<section class="space-y-8">
		<div>
			<h2 class="text-2xl font-semibold text-neutral-800 mb-2">
				Componentes de Botones
			</h2>
			<p class="text-neutral-600">
				Botones optimizados para touch con targets de 44px mínimo para móviles argentinos
			</p>
		</div>

		<div class="space-y-6">
			<!-- Button Variants -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-neutral-700">Variantes</h3>
				<div class="flex flex-wrap gap-4">
					<Button variant="primary" on:click={handleButtonClick}>
						Reservar Cita
					</Button>
					<Button variant="secondary" on:click={handleButtonClick}>
						Ver Servicios
					</Button>
					<Button variant="ghost" on:click={handleButtonClick}>
						Cancelar
					</Button>
					<Button variant="success" on:click={handleButtonClick}>
						Confirmar
					</Button>
					<Button variant="danger" on:click={handleButtonClick}>
						Eliminar
					</Button>
				</div>
			</div>

			<!-- Button Sizes -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-neutral-700">Tamaños</h3>
				<div class="flex flex-wrap items-center gap-4">
					<Button variant="primary" size="sm">
						Pequeño
					</Button>
					<Button variant="primary" size="md">
						Mediano
					</Button>
					<Button variant="primary" size="lg">
						Grande
					</Button>
				</div>
			</div>

			<!-- Button States -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-neutral-700">Estados</h3>
				<div class="flex flex-wrap gap-4">
					<Button variant="primary" loading>
						Procesando...
					</Button>
					<Button variant="secondary" disabled>
						Deshabilitado
					</Button>
					<Button variant="primary" fullWidth>
						Ancho Completo
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Input Components Demo -->
	<section class="space-y-8">
		<div>
			<h2 class="text-2xl font-semibold text-neutral-800 mb-2">
				Componentes de Entrada
			</h2>
			<p class="text-neutral-600">
				Inputs con formato argentino automático y validación
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
			<Input
				label="Nombre Completo"
				placeholder="Tu nombre completo"
				bind:value={inputValue}
				on:input={handleInputChange}
				required
			/>

			<Input
				type="email"
				label="Correo Electrónico"
				placeholder="tu@email.com"
				bind:value={emailValue}
				success="Email válido"
			/>

			<Input
				type="tel"
				label="Teléfono Argentina"
				placeholder="+54 9 11 1234-5678"
				bind:value={phoneValue}
				format="phone"
				hint="Formato: +54 9 11 1234-5678"
			/>

			<Input
				label="DNI"
				placeholder="12.345.678"
				bind:value={dniValue}
				format="dni"
				hint="Solo números, se formatea automáticamente"
			/>

			<Input
				type="password"
				label="Contraseña"
				placeholder="Tu contraseña segura"
				error="La contraseña debe tener al menos 8 caracteres"
			/>

			<Input
				type="number"
				label="Precio Servicio"
				placeholder="0"
				format="currency"
				hint="Ingresa el precio en pesos argentinos"
			/>
		</div>
	</section>

	<!-- Card Components Demo -->
	<section class="space-y-8">
		<div>
			<h2 class="text-2xl font-semibold text-neutral-800 mb-2">
				Componentes de Tarjetas
			</h2>
			<p class="text-neutral-600">
				Tarjetas para servicios, proveedores y resúmenes de reservas
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<!-- Provider Card -->
			<Card
				variant="interactive"
				imageUrl="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&crop=face"
				imageAlt="Barbería El Corte"
				title="Barbería El Corte"
				subtitle="Especialistas en cortes clásicos y modernos"
				rating={4.8}
				reviewCount={142}
				price={2500}
				location="Palermo, Buenos Aires"
				clickable
				on:click={() => console.log('Provider card clicked')}
			/>

			<!-- Service Card -->
			<Card
				variant="elevated"
				title="Corte + Barba"
				subtitle="Incluye shampoo y peinado"
				price={3500}
			>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Duración:</span>
						<span class="font-medium">45 min</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Disponible:</span>
						<span class="text-success-600 font-medium">Hoy</span>
					</div>
					<Button variant="primary" size="sm" fullWidth>
						Reservar
					</Button>
				</div>
			</Card>

			<!-- Booking Summary Card -->
			<Card title="Resumen de Reserva" variant="outlined">
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Servicio:</span>
						<span class="font-medium">Corte Premium</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Fecha:</span>
						<span class="font-medium">15 Mar, 14:30</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Profesional:</span>
						<span class="font-medium">Carlos Martinez</span>
					</div>
					<hr class="border-neutral-200">
					<div class="flex justify-between font-semibold">
						<span>Total:</span>
						<span class="text-primary-600 font-mono">$2.500</span>
					</div>
				</div>
			</Card>
		</div>
	</section>

	<!-- Loading Components Demo -->
	<section class="space-y-8">
		<div>
			<h2 class="text-2xl font-semibold text-neutral-800 mb-2">
				Componentes de Carga
			</h2>
			<p class="text-neutral-600">
				Estados de carga optimizados para conexiones 3G/4G en Argentina
			</p>
		</div>

		<div class="space-y-6">
			<div class="flex flex-wrap gap-8">
				<div class="space-y-2">
					<h4 class="text-sm font-medium text-neutral-700">Spinner</h4>
					<Loading variant="spinner" size="md" text="Cargando..." />
				</div>

				<div class="space-y-2">
					<h4 class="text-sm font-medium text-neutral-700">Dots</h4>
					<Loading variant="dots" size="md" text="Procesando..." />
				</div>
			</div>

			<div class="max-w-md space-y-4">
				<h4 class="text-sm font-medium text-neutral-700">Skeleton Loading</h4>
				<Loading variant="skeleton" avatar={true} image={true} lines={3} />
			</div>

			<div class="max-w-md space-y-4">
				<h4 class="text-sm font-medium text-neutral-700">Pulse Loading</h4>
				<Loading variant="pulse" avatar={true} lines={4} />
			</div>

			<Button variant="secondary" on:click={simulateLoading}>
				{#if loadingState}
					<Loading variant="spinner" size="sm" />
					Simulando carga...
				{:else}
					Probar Carga 3 Segundos
				{/if}
			</Button>
		</div>
	</section>

	<!-- Modal Components Demo -->
	<section class="space-y-8">
		<div>
			<h2 class="text-2xl font-semibold text-neutral-800 mb-2">
				Componentes Modales
			</h2>
			<p class="text-neutral-600">
				Modales para flujos de reserva y confirmaciones
			</p>
		</div>

		<div>
			<Button variant="primary" on:click={() => showModal = true}>
				Abrir Modal de Reserva
			</Button>
		</div>
	</section>

	<!-- Footer -->
	<section class="text-center space-y-4 pt-16 border-t border-neutral-200">
		<p class="text-neutral-600">
			Componentes desarrollados para BarberPro
		</p>
		<p class="text-sm text-neutral-500">
			Optimizado para Argentina • Mobile First • TypeScript + TailwindCSS
		</p>
	</section>
</div>

<!-- Modal Demo -->
<Modal
	bind:open={showModal}
	title="Confirmar Reserva"
	size="md"
>
	<div class="space-y-4">
		<p class="text-neutral-700">
			¿Estás seguro que quieres reservar este servicio?
		</p>
		
		<div class="bg-neutral-50 rounded-lg p-4 space-y-2">
			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Servicio:</span>
				<span class="font-medium">Corte Premium + Barba</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Fecha:</span>
				<span class="font-medium">Viernes 15 Mar, 14:30</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Precio:</span>
				<span class="font-semibold text-primary-600 font-mono">$3.500</span>
			</div>
		</div>
		
		<p class="text-xs text-neutral-500">
			Recibirás un SMS de confirmación al número registrado.
		</p>
	</div>

	<div slot="footer">
		<Button variant="ghost" on:click={() => showModal = false}>
			Cancelar
		</Button>
		<Button variant="primary" on:click={() => showModal = false}>
			Confirmar Reserva
		</Button>
	</div>
</Modal>

{#if loadingState}
	<Loading variant="spinner" text="Simulando carga de 3G/4G..." fullScreen />
{/if}