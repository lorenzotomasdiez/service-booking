<script lang="ts">
	import { authStore, authError, isLoading } from '$lib/stores/auth';
	import { registerSchema } from '$lib/api/auth';
	import { z } from 'zod';
	import OAuthButton from '$lib/components/OAuthButton.svelte';
	import {
		validateField,
		validatePasswordConfirmation,
		calculatePasswordStrength,
		getPasswordStrengthLabel,
		getPasswordStrengthColor,
		areAllFieldsValid,
		type PasswordStrength
	} from '$lib/validation/registration';
	import { uxAnalytics } from '$lib/services/ux-analytics';

	// Role prop: null = show selection, 'client' or 'provider' = pre-selected
	export let role: null | 'client' | 'provider' = null;

	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		password: '',
		confirmPassword: ''
	};

	// Initialize userType based on role prop
	let userType: 'client' | 'provider' = role || 'client';
	let acceptTerms = false;
	let acceptMarketing = false;
	let errors: Record<string, string> = {};
	let showPassword = false;
	let showConfirmPassword = false;
	let passwordStrength: PasswordStrength = 'weak';
	let isFormValid = false;

	// T051: Real-time field validation handlers
	function handleEmailBlur() {
		const error = validateField('email', formData.email);
		if (error) {
			errors.email = error;
		} else {
			delete errors.email;
		}
		errors = errors; // Trigger reactivity
	}

	function handleNameBlur(field: 'firstName' | 'lastName') {
		const error = validateField(field, formData[field]);
		if (error) {
			errors[field] = error;
		} else {
			delete errors[field];
		}
		errors = errors; // Trigger reactivity
	}

	function formatPhoneInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const value = input.value;

		// Remove all non-digit characters
		const digits = value.replace(/\D/g, '');

		// Format: +54 9 11 1234-5678
		// Expected: 11 digits total (54 + 9 + 11 + 12345678)
		let formatted = '';

		if (digits.length > 0) {
			// Always start with +54
			if (digits.startsWith('54')) {
				formatted = '+54';
				const remaining = digits.substring(2);

				if (remaining.length > 0) {
					// Add the 9 (mobile prefix)
					formatted += ' 9';

					if (remaining.length > 1) {
						// Add area code (2-4 digits, typically 11 for Buenos Aires)
						const areaCode = remaining.substring(1, Math.min(3, remaining.length));
						formatted += ' ' + areaCode;

						if (remaining.length > 3) {
							// Add first 4 digits of phone number
							const firstPart = remaining.substring(3, Math.min(7, remaining.length));
							formatted += ' ' + firstPart;

							if (remaining.length > 7) {
								// Add last 4 digits with dash
								const lastPart = remaining.substring(7, 11);
								formatted += '-' + lastPart;
							}
						}
					}
				}
			} else {
				// If doesn't start with 54, assume user is typing local number
				formatted = '+54 9';

				if (digits.length > 0) {
					// Add area code
					const areaCode = digits.substring(0, Math.min(2, digits.length));
					formatted += ' ' + areaCode;

					if (digits.length > 2) {
						// Add first 4 digits
						const firstPart = digits.substring(2, Math.min(6, digits.length));
						formatted += ' ' + firstPart;

						if (digits.length > 6) {
							// Add last 4 digits with dash
							const lastPart = digits.substring(6, 10);
							formatted += '-' + lastPart;
						}
					}
				}
			}
		}

		formData.phone = formatted;
	}

	function handlePhoneBlur() {
		const error = validateField('phone', formData.phone);
		if (error) {
			errors.phone = error;
		} else {
			delete errors.phone;
		}
		errors = errors; // Trigger reactivity
	}

	// T052: Password strength calculation on change
	function handlePasswordChange() {
		passwordStrength = calculatePasswordStrength(formData.password);
		const error = validateField('password', formData.password);
		if (error) {
			errors.password = error;
		} else {
			delete errors.password;
		}

		// T053: Revalidate confirmation when password changes
		if (formData.confirmPassword) {
			handleConfirmPasswordChange();
		}

		errors = errors; // Trigger reactivity
	}

	// T053: Confirm password validation on change
	function handleConfirmPasswordChange() {
		const error = validatePasswordConfirmation(formData.password, formData.confirmPassword);
		if (error) {
			errors.confirmPassword = error;
		} else {
			delete errors.confirmPassword;
		}
		errors = errors; // Trigger reactivity
	}

	async function handleRegister() {
		errors = {};

		// T069: Track registration attempt
		uxAnalytics.trackExternalEvent('registration_attempt', {
			registrationType: userType,
			rolePreSelected: role !== null,
			hasMarketing: acceptMarketing
		});

		try {
			// Validate form data
			const validatedData = registerSchema.parse({
				email: formData.email,
				password: formData.password,
				confirmPassword: formData.confirmPassword,
				firstName: formData.firstName,
				lastName: formData.lastName,
				phone: formData.phone,
				role: userType,
				acceptTerms
			});

			// Attempt registration
			const result = await authStore.register({
				email: validatedData.email,
				password: validatedData.password,
				firstName: validatedData.firstName,
				lastName: validatedData.lastName,
				phone: validatedData.phone,
				role: userType.toUpperCase() as 'CLIENT' | 'PROVIDER'
			});

			if (result && !result.success) {
				if (result.errors) {
					// Handle field-specific errors from server
					Object.assign(errors, result.errors);
				}
				if (result.error) {
					errors.general = result.error;
				}

				// T069: Track registration failure
				uxAnalytics.trackExternalEvent('registration_failed', {
					registrationType: userType,
					rolePreSelected: role !== null,
					errorType: result.error || 'validation_error',
					fieldErrors: result.errors ? Object.keys(result.errors) : []
				});
			} else if (result && result.success) {
				// T069: Track successful registration conversion
				uxAnalytics.trackExternalEvent('registration_success', {
					registrationType: userType,
					rolePreSelected: role !== null,
					hasMarketing: acceptMarketing,
					conversionPath: role === null ? 'general' : role
				});
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				// Handle validation errors
				error.issues.forEach((issue) => {
					if (issue.path[0]) {
						const field = issue.path[0] as string;
						if (field === 'acceptTerms') {
							errors.terms = issue.message;
						} else {
							errors[field] = issue.message;
						}
					}
				});

				// T069: Track validation error
				uxAnalytics.trackExternalEvent('registration_validation_error', {
					registrationType: userType,
					rolePreSelected: role !== null,
					errorCount: error.issues.length,
					errorFields: error.issues.map(issue => issue.path[0])
				});
			} else {
				errors.general = 'Error inesperado al registrarse';

				// T069: Track unexpected error
				uxAnalytics.trackExternalEvent('registration_error', {
					registrationType: userType,
					rolePreSelected: role !== null,
					errorType: 'unexpected'
				});
			}
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}

	// T069: Track role selection changes
	function handleRoleChange(newRole: 'client' | 'provider') {
		const previousRole = userType;
		userType = newRole;

		// Only track if role actually changed
		if (previousRole !== newRole) {
			uxAnalytics.trackExternalEvent('registration_role_changed', {
				from: previousRole,
				to: newRole,
				rolePreSelected: role !== null
			});
		}
	}

	// T054: Check form validity reactively to enable/disable submit button
	$: {
		isFormValid = areAllFieldsValid({
			firstName: formData.firstName,
			lastName: formData.lastName,
			email: formData.email,
			phone: formData.phone,
			password: formData.password,
			confirmPassword: formData.confirmPassword,
			role: userType.toUpperCase() as 'CLIENT' | 'PROVIDER',
			acceptTerms
		});
	}

	// Clear errors when user types
	$: if (formData.firstName && errors.firstName) delete errors.firstName;
	$: if (formData.lastName && errors.lastName) delete errors.lastName;
	$: if (formData.email && errors.email) delete errors.email;
	$: if (formData.phone && errors.phone) delete errors.phone;
	$: if (acceptTerms && errors.terms) delete errors.terms;
	$: if ($authError && errors.general) delete errors.general;
</script>

<div class="card">
	<!-- User Type Selection - only show if role is null -->
	{#if role === null}
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
					on:click={() => handleRoleChange('client')}
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
					on:click={() => handleRoleChange('provider')}
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
	{/if}

	<!-- T046: OAuth Button Section -->
	<div class="mb-8">
		<OAuthButton
			role={userType === 'client' ? 'CLIENT' : 'PROVIDER'}
			isRegistration={true}
			returnTo="/dashboard"
		/>
	</div>

	<!-- Divider -->
	<div class="relative mb-8">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full border-t border-neutral-200"></div>
		</div>
		<div class="relative flex justify-center text-sm">
			<span class="px-4 bg-white text-neutral-500">o continúa con email</span>
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
					on:blur={() => handleNameBlur('firstName')}
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
					on:blur={() => handleNameBlur('lastName')}
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
				on:blur={handleEmailBlur}
				class="form-input"
				class:form-input-error={errors.email}
				placeholder="tu@email.com"
				autocomplete="email"
			/>
			{#if errors.email}
				<p class="mt-1 text-sm text-error-600">{errors.email}</p>
			{/if}
		</div>

		<div>
			<label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
				Teléfono *
			</label>
			<input
				id="phone"
				type="tel"
				bind:value={formData.phone}
				on:input={formatPhoneInput}
				on:blur={handlePhoneBlur}
				class="form-input phone-input"
				class:form-input-error={errors.phone}
				placeholder="+54 9 11 1234-5678"
				autocomplete="tel"
				maxlength="20"
			/>
			{#if errors.phone}
				<p class="mt-1 text-sm text-error-600">{errors.phone}</p>
			{:else}
				<p class="mt-1 text-sm text-neutral-500">Solo ingresa los números (ej: 1123977641)</p>
			{/if}
		</div>

		<!-- Password -->
		<div class="space-y-6">
			<div>
				<label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
					Contraseña *
				</label>
				<div class="relative">
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						bind:value={formData.password}
						on:input={handlePasswordChange}
						class="form-input pr-10"
						class:form-input-error={errors.password}
						placeholder="Mínimo 8 caracteres"
						autocomplete="new-password"
					/>
					<button
						type="button"
						class="absolute inset-y-0 right-0 pr-3 flex items-center"
						on:click={togglePasswordVisibility}
					>
						{#if showPassword}
							<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
							</svg>
						{:else}
							<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						{/if}
					</button>
				</div>

				<!-- T052: Password Strength Indicator -->
				{#if formData.password}
					<div class="mt-2">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs text-neutral-600">Fortaleza de la contraseña:</span>
							<span class="text-xs font-medium text-neutral-700">{getPasswordStrengthLabel(passwordStrength)}</span>
						</div>
						<div class="w-full bg-neutral-200 rounded-full h-2">
							<div
								class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor(passwordStrength)}"
								style="width: {passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'}"
							></div>
						</div>
					</div>
				{/if}

				{#if errors.password}
					<p class="mt-1 text-sm text-error-600">{errors.password}</p>
				{/if}
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-neutral-700 mb-2">
					Confirmar Contraseña *
				</label>
				<div class="relative">
					<input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						bind:value={formData.confirmPassword}
						on:input={handleConfirmPasswordChange}
						class="form-input pr-10"
						class:form-input-error={errors.confirmPassword}
						placeholder="Repite tu contraseña"
						autocomplete="new-password"
					/>
					<button
						type="button"
						class="absolute inset-y-0 right-0 pr-3 flex items-center"
						on:click={toggleConfirmPasswordVisibility}
					>
						{#if showConfirmPassword}
							<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
							</svg>
						{:else}
							<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						{/if}
					</button>
				</div>
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

		<!-- General Error -->
		{#if errors.general || $authError}
			<div class="bg-error-50 border border-error-200 rounded-lg p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="ml-3">
						<p class="text-sm text-error-700">
							{errors.general || $authError}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Submit Button -->
		<!-- T054: Disable submit button until all fields valid -->
		<button
			type="submit"
			class="w-full btn btn-primary btn-lg"
			disabled={$isLoading || !isFormValid}
		>
			{#if $isLoading}
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
