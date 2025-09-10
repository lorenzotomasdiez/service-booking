<script lang="ts">
	import { goto } from '$app/navigation';
	
	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		dni: '',
		password: '',
		confirmPassword: ''
	};
	
	let userType = 'client'; // 'client' or 'provider'
	let acceptTerms = false;
	let acceptMarketing = false;
	let loading = false;
	let errors: Record<string, string> = {};

	function validateForm() {
		errors = {};

		if (!formData.firstName) errors.firstName = 'El nombre es requerido';
		if (!formData.lastName) errors.lastName = 'El apellido es requerido';
		if (!formData.email) errors.email = 'El email es requerido';
		if (!formData.phone) errors.phone = 'El teléfono es requerido';
		if (!formData.dni) errors.dni = 'El DNI es requerido';
		if (!formData.password) errors.password = 'La contraseña es requerida';
		if (formData.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
		if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
		if (!acceptTerms) errors.terms = 'Debes aceptar los términos y condiciones';

		// Basic email validation
		if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = 'El email no es válido';
		}

		// Argentina phone validation (basic)
		if (formData.phone && !/^\+?54?\s?9?\s?\d{2,4}\s?\d{4}\s?\d{4}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
			errors.phone = 'El teléfono no es válido para Argentina';
		}

		// Argentina DNI validation (basic)
		if (formData.dni && !/^\d{7,8}$/.test(formData.dni.replace(/[.\s]/g, ''))) {
			errors.dni = 'El DNI debe tener 7 u 8 dígitos';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleRegister() {
		if (!validateForm()) return;

		loading = true;

		// TODO: Implement actual registration logic
		console.log('Registration attempt:', { ...formData, userType, acceptTerms, acceptMarketing });
		
		// Simulate API call
		setTimeout(() => {
			loading = false;
			// Redirect to login or dashboard on success
			goto('/login?registered=true');
		}, 1500);
	}
</script>

<svelte:head>
	<title>Registrarse - BarberPro</title>
	<meta name="description" content="Únete a BarberPro y accede a los mejores servicios de barbería en Argentina" />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="mx-auto w-16 h-16 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
				B
			</div>
			<h2 class="text-3xl font-bold text-neutral-800">
				Crear Cuenta
			</h2>
			<p class="mt-2 text-sm text-neutral-600">
				¿Ya tienes cuenta? 
				<a href="/login" class="text-brand hover:text-primary-700 font-medium">
					Inicia sesión
				</a>
			</p>
		</div>

		<div class="card">
			<!-- User Type Selection -->
			<div class="mb-8">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">
					¿Cómo quieres usar BarberPro?
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<button
						type="button"
						class="p-4 border-2 rounded-xl text-left transition-all"
						class:border-primary-600={userType === 'client'}
						class:bg-primary-50={userType === 'client'}
						class:border-neutral-200={userType !== 'client'}
						on:click={() => userType = 'client'}
					>
						<div class="flex items-center space-x-3">
							<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
								</svg>
							</div>
							<div>
								<h4 class="font-semibold text-neutral-800">Cliente</h4>
								<p class="text-sm text-neutral-600">Reserva servicios de barbería</p>
							</div>
						</div>
					</button>

					<button
						type="button"
						class="p-4 border-2 rounded-xl text-left transition-all"
						class:border-primary-600={userType === 'provider'}
						class:bg-primary-50={userType === 'provider'}
						class:border-neutral-200={userType !== 'provider'}
						on:click={() => userType = 'provider'}
					>
						<div class="flex items-center space-x-3">
							<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2"/>
								</svg>
							</div>
							<div>
								<h4 class="font-semibold text-neutral-800">Profesional</h4>
								<p class="text-sm text-neutral-600">Ofrece servicios de barbería</p>
							</div>
						</div>
					</button>
				</div>
			</div>

			<!-- Registration Form -->
			<form on:submit|preventDefault={handleRegister} class="space-y-6">
				<!-- Personal Information -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="firstName" class="block text-sm font-medium text-neutral-700 mb-2">
							Nombre *
						</label>
						<input
							id="firstName"
							type="text"
							bind:value={formData.firstName}
							class="form-input"
							class:form-input-error={errors.firstName}
							placeholder="Tu nombre"
							autocomplete="given-name"
						/>
						{#if errors.firstName}
							<p class="mt-1 text-sm text-error-600">{errors.firstName}</p>
						{/if}
					</div>

					<div>
						<label for="lastName" class="block text-sm font-medium text-neutral-700 mb-2">
							Apellido *
						</label>
						<input
							id="lastName"
							type="text"
							bind:value={formData.lastName}
							class="form-input"
							class:form-input-error={errors.lastName}
							placeholder="Tu apellido"
							autocomplete="family-name"
						/>
						{#if errors.lastName}
							<p class="mt-1 text-sm text-error-600">{errors.lastName}</p>
						{/if}
					</div>
				</div>

				<!-- Contact Information -->
				<div>
					<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
						Correo Electrónico *
					</label>
					<input
						id="email"
						type="email"
						bind:value={formData.email}
						class="form-input"
						class:form-input-error={errors.email}
						placeholder="tu@email.com"
						autocomplete="email"
					/>
					{#if errors.email}
						<p class="mt-1 text-sm text-error-600">{errors.email}</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
							Teléfono *
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={formData.phone}
							class="form-input phone-input"
							class:form-input-error={errors.phone}
							placeholder="+54 9 11 1234-5678"
							autocomplete="tel"
						/>
						{#if errors.phone}
							<p class="mt-1 text-sm text-error-600">{errors.phone}</p>
						{/if}
					</div>

					<div>
						<label for="dni" class="block text-sm font-medium text-neutral-700 mb-2">
							DNI *
						</label>
						<input
							id="dni"
							type="text"
							bind:value={formData.dni}
							class="form-input dni-input"
							class:form-input-error={errors.dni}
							placeholder="12.345.678"
							autocomplete="off"
						/>
						{#if errors.dni}
							<p class="mt-1 text-sm text-error-600">{errors.dni}</p>
						{/if}
					</div>
				</div>

				<!-- Password -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
							Contraseña *
						</label>
						<input
							id="password"
							type="password"
							bind:value={formData.password}
							class="form-input"
							class:form-input-error={errors.password}
							placeholder="Mínimo 8 caracteres"
							autocomplete="new-password"
						/>
						{#if errors.password}
							<p class="mt-1 text-sm text-error-600">{errors.password}</p>
						{/if}
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-neutral-700 mb-2">
							Confirmar Contraseña *
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={formData.confirmPassword}
							class="form-input"
							class:form-input-error={errors.confirmPassword}
							placeholder="Repite tu contraseña"
							autocomplete="new-password"
						/>
						{#if errors.confirmPassword}
							<p class="mt-1 text-sm text-error-600">{errors.confirmPassword}</p>
						{/if}
					</div>
				</div>

				<!-- Terms and Marketing -->
				<div class="space-y-4">
					<label class="flex items-start space-x-3">
						<input
							type="checkbox"
							bind:checked={acceptTerms}
							class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
						/>
						<span class="text-sm text-neutral-600 leading-relaxed">
							Acepto los 
							<a href="/terminos" class="text-brand hover:text-primary-700 font-medium" target="_blank">
								Términos y Condiciones
							</a>
							y la 
							<a href="/privacidad" class="text-brand hover:text-primary-700 font-medium" target="_blank">
								Política de Privacidad
							</a>
							de BarberPro *
						</span>
					</label>
					{#if errors.terms}
						<p class="text-sm text-error-600">{errors.terms}</p>
					{/if}

					<label class="flex items-start space-x-3">
						<input
							type="checkbox"
							bind:checked={acceptMarketing}
							class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
						/>
						<span class="text-sm text-neutral-600 leading-relaxed">
							Acepto recibir comunicaciones promocionales y ofertas especiales por email y SMS
						</span>
					</label>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					class="w-full btn btn-primary btn-lg"
					disabled={loading}
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creando cuenta...
					{:else}
						Crear Cuenta
					{/if}
				</button>
			</form>
		</div>

		<!-- Help Section -->
		<div class="text-center text-sm text-neutral-500 mt-8">
			<p>¿Necesitas ayuda para registrarte?</p>
			<a href="/ayuda" class="text-brand hover:text-primary-700 font-medium">
				Contacta nuestro soporte
			</a>
		</div>
	</div>
</div>