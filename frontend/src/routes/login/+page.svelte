<script lang="ts">
	import { authStore, authError, isLoading } from '$lib/stores/auth';
	import { loginSchema } from '$lib/api/auth';
	import { z } from 'zod';
	
	let email = '';
	let password = '';
	let rememberMe = false;
	let errors: Record<string, string> = {};
	let showPassword = false;

	async function handleLogin() {
		errors = {};

		try {
			// Validate form data
			const validatedData = loginSchema.parse({ email, password, rememberMe });
			
			// Attempt login
			const result = await authStore.login(validatedData.email, validatedData.password, validatedData.rememberMe || false);
			
			if (result && !result.success && result.error) {
				errors.general = result.error;
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				// Handle validation errors
				error.issues.forEach((issue) => {
					if (issue.path[0]) {
						errors[issue.path[0] as string] = issue.message;
					}
				});
			} else {
				errors.general = 'Error inesperado al iniciar sesión';
			}
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	// Clear errors when user types
	$: if (email && errors.email) delete errors.email;
	$: if (password && errors.password) delete errors.password;
	$: if ($authError && errors.general) delete errors.general;
</script>

<svelte:head>
	<title>Iniciar Sesión - BarberPro</title>
	<meta name="description" content="Inicia sesión en BarberPro para gestionar tus reservas y servicios" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto w-16 h-16 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
				B
			</div>
			<h2 class="text-3xl font-bold text-neutral-800">
				Iniciar Sesión
			</h2>
			<p class="mt-2 text-sm text-neutral-600">
				¿No tienes cuenta? 
				<a href="/register" class="text-brand hover:text-primary-700 font-medium">
					Regístrate gratis
				</a>
			</p>
		</div>

		<!-- Login Form -->
		<div class="card">
			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<!-- Email -->
				<div>
					<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
						Correo Electrónico
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						class="form-input"
						class:form-input-error={errors.email}
						placeholder="tu@email.com"
						autocomplete="email"
						required
					/>
					{#if errors.email}
						<p class="mt-1 text-sm text-error-600">{errors.email}</p>
					{/if}
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
						Contraseña
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							class="form-input pr-10"
							class:form-input-error={errors.password}
							placeholder="Tu contraseña"
							autocomplete="current-password"
							required
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							on:click={togglePasswordVisibility}
						>
							{#if showPassword}
								<!-- Eye Slash Icon -->
								<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								</svg>
							{:else}
								<!-- Eye Icon -->
								<svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
					{#if errors.password}
						<p class="mt-1 text-sm text-error-600">{errors.password}</p>
					{/if}
				</div>

				<!-- Remember Me & Forgot Password -->
				<div class="flex items-center justify-between">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
						/>
						<span class="ml-2 text-sm text-neutral-600">
							Recordarme
						</span>
					</label>

					<a href="/forgot-password" class="text-sm text-brand hover:text-primary-700">
						¿Olvidaste tu contraseña?
					</a>
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
				<button
					type="submit"
					class="w-full btn btn-primary btn-lg"
					disabled={$isLoading}
				>
					{#if $isLoading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Iniciando sesión...
					{:else}
						Iniciar Sesión
					{/if}
				</button>
			</form>
		</div>

		<!-- Alternative Login Methods -->
		<div class="space-y-4">
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-neutral-200"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-neutral-50 text-neutral-500">O continúa con</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<button
					type="button"
					class="w-full inline-flex justify-center py-3 px-4 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition-colors"
				>
					<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24">
						<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					<span class="ml-2">Google</span>
				</button>

				<button
					type="button"
					class="w-full inline-flex justify-center py-3 px-4 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition-colors"
				>
					<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
					</svg>
					<span class="ml-2">Facebook</span>
				</button>
			</div>
		</div>

		<!-- Help Section -->
		<div class="text-center text-sm text-neutral-500">
			<p>¿Problemas para iniciar sesión?</p>
			<a href="/ayuda" class="text-brand hover:text-primary-700 font-medium">
				Contacta nuestro soporte
			</a>
		</div>
	</div>
</div>