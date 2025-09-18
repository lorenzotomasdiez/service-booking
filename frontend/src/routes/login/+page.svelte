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

<!-- Premium login background with Argentina-inspired gradient -->
<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
	<!-- Animated background pattern -->
	<div class="absolute inset-0 opacity-5">
		<div class="absolute top-0 left-0 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
		<div class="absolute top-0 right-0 w-96 h-96 bg-secondary-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style="animation-delay: 2s;"></div>
		<div class="absolute bottom-0 left-1/2 w-96 h-96 bg-success-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style="animation-delay: 4s;"></div>
	</div>

	<div class="max-w-md w-full space-y-6 relative z-10">
		<!-- Enhanced Header with Premium Branding -->
		<div class="text-center">
			<!-- Premium Logo with Trust Indicators -->
			<div class="relative mx-auto w-20 h-20 mb-6">
				<div class="w-full h-full bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-primary-500/25 transform transition-all duration-300 hover:scale-105">
					<!-- Enhanced barber icon -->
					<svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
						<path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h2a1 1 0 011 1v2a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H8a2 2 0 01-2-2V8H5a1 1 0 01-1-1V5a1 1 0 011-1h2zM9 3v1h6V3H9zM8 8v9h8V8H8z"/>
						<path d="M10 10h4v1h-4v-1zm0 2h4v1h-4v-1z" fill="white" opacity="0.7"/>
					</svg>
				</div>

				<!-- Trust badges -->
				<div class="absolute -top-2 -right-2 flex flex-col space-y-1">
					<div class="w-6 h-6 bg-success-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
						<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
						</svg>
					</div>
					<div class="w-4 h-4 bg-amber-500 rounded-full border border-white flex items-center justify-center shadow-md">
						<div class="w-1.5 h-1.5 bg-white rounded-full"></div>
					</div>
				</div>

				<!-- Online status -->
				<div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
			</div>

			<!-- Enhanced Welcome Message -->
			<div class="space-y-3 mb-8">
				<h1 class="text-4xl font-bold text-neutral-800 leading-tight">
					¡Bienvenido de vuelta!
				</h1>
				<p class="text-lg text-neutral-600 max-w-sm mx-auto leading-relaxed">
					Accede a tu cuenta para gestionar tus reservas y servicios premium
				</p>

				<!-- Argentina Trust Indicators -->
				<div class="flex items-center justify-center space-x-4 pt-2">
					<div class="flex items-center space-x-2 text-sm text-success-700">
						<div class="w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
							<svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</div>
						<span class="font-medium">Plataforma Verificada</span>
					</div>
					<div class="flex items-center space-x-1 text-sm text-primary-700">
						<span class="text-lg">🇦🇷</span>
						<span class="font-medium">Argentina</span>
					</div>
				</div>
			</div>

			<!-- Registration Link -->
			<p class="text-sm text-neutral-600">
				¿No tienes cuenta?
				<a href="/register" class="text-brand hover:text-primary-700 font-semibold transition-colors duration-200 hover:underline">
					Regístrate gratis
				</a>
			</p>
		</div>

		<!-- Premium Login Form Card -->
		<div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
			<!-- Card Header with Security Message -->
			<div class="bg-gradient-to-r from-primary-600/5 via-white to-secondary-600/5 px-8 py-6 border-b border-neutral-100">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
							<svg class="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-neutral-800">Acceso Seguro</h3>
							<p class="text-sm text-neutral-600">Tus datos están protegidos con encriptación SSL</p>
						</div>
					</div>
					<div class="flex items-center space-x-2 text-sm text-success-600">
						<div class="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
						<span class="font-medium">Seguro</span>
					</div>
				</div>
			</div>

			<form on:submit|preventDefault={handleLogin} class="p-8 space-y-6">
				<!-- Enhanced Email Field -->
				<div class="space-y-2">
					<label for="email" class="flex items-center space-x-2 text-sm font-semibold text-neutral-700">
						<svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
						</svg>
						<span>Correo Electrónico</span>
					</label>
					<div class="relative">
						<input
							id="email"
							type="email"
							bind:value={email}
							class="form-input pl-12 h-12 text-base rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:shadow-lg focus:scale-[1.02]"
							class:form-input-error={errors.email}
							class:border-success-300={email && !errors.email}
							class:bg-success-50={email && !errors.email}
							placeholder="tu@email.com"
							autocomplete="email"
							required
						/>
						<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
							</svg>
						</div>
						{#if email && !errors.email}
							<div class="absolute inset-y-0 right-0 pr-4 flex items-center">
								<svg class="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
								</svg>
							</div>
						{/if}
					</div>
					{#if errors.email}
						<div class="flex items-center space-x-2 text-error-600">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<p class="text-sm font-medium">{errors.email}</p>
						</div>
					{/if}
				</div>

				<!-- Enhanced Password Field -->
				<div class="space-y-2">
					<label for="password" class="flex items-center space-x-2 text-sm font-semibold text-neutral-700">
						<svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
						<span>Contraseña</span>
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							class="form-input pl-12 pr-12 h-12 text-base rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:shadow-lg focus:scale-[1.02]"
							class:form-input-error={errors.password}
							class:border-success-300={password && !errors.password}
							class:bg-success-50={password && !errors.password}
							placeholder="Ingresa tu contraseña"
							autocomplete="current-password"
							required
						/>
						<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
							</svg>
						</div>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-neutral-50 rounded-r-xl transition-colors duration-200"
							on:click={togglePasswordVisibility}
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
						>
							{#if showPassword}
								<svg class="h-5 w-5 text-neutral-500 hover:text-neutral-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								</svg>
							{:else}
								<svg class="h-5 w-5 text-neutral-500 hover:text-neutral-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
					{#if errors.password}
						<div class="flex items-center space-x-2 text-error-600">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<p class="text-sm font-medium">{errors.password}</p>
						</div>
					{/if}
				</div>

				<!-- Enhanced Remember Me & Forgot Password -->
				<div class="flex items-center justify-between py-2">
					<label class="flex items-center space-x-3 cursor-pointer group">
						<div class="relative">
							<input
								type="checkbox"
								bind:checked={rememberMe}
								class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded-lg transition-all duration-200 group-hover:border-primary-400"
							/>
							{#if rememberMe}
								<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
									<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
								</div>
							{/if}
						</div>
						<span class="text-sm font-medium text-neutral-700 group-hover:text-neutral-800 transition-colors duration-200">
							Mantener sesión iniciada
						</span>
					</label>

					<a
						href="/forgot-password"
						class="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-all duration-200 px-2 py-1 rounded-lg hover:bg-primary-50"
					>
						¿Olvidaste tu contraseña?
					</a>
				</div>

				<!-- Enhanced Error Display -->
				{#if errors.general || $authError}
					<div class="bg-gradient-to-r from-error-50 to-red-50 border border-error-200 rounded-xl p-5 animate-fade-in">
						<div class="flex items-start space-x-3">
							<div class="w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<svg class="h-5 w-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="flex-1">
								<h4 class="font-semibold text-error-800 mb-1">Error de acceso</h4>
								<p class="text-sm text-error-700 leading-relaxed">
									{errors.general || $authError}
								</p>
								<div class="mt-3 flex items-center space-x-4 text-sm">
									<a href="/forgot-password" class="text-error-600 hover:text-error-700 font-medium hover:underline">
										Recuperar contraseña
									</a>
									<a href="/ayuda" class="text-error-600 hover:text-error-700 font-medium hover:underline">
										Obtener ayuda
									</a>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Premium Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						class="w-full h-14 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
						disabled={$isLoading}
					>
						<!-- Animated shine effect -->
						<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

						{#if $isLoading}
							<div class="flex items-center justify-center space-x-3">
								<svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span class="relative z-10">Iniciando sesión...</span>
							</div>
						{:else}
							<div class="flex items-center justify-center space-x-3 relative z-10">
								<svg class="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
								</svg>
								<span>Iniciar Sesión</span>
							</div>
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Premium Alternative Login Methods -->
		<div class="space-y-6">
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
				</div>
				<div class="relative flex justify-center">
					<span class="px-6 py-2 bg-white text-sm font-medium text-neutral-500 rounded-full border border-neutral-200">
						O continúa con
					</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<button
					type="button"
					class="group relative h-12 px-4 rounded-xl border-2 border-neutral-200 bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					<div class="flex items-center justify-center space-x-3">
						<svg class="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
							<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						<span class="font-semibold text-neutral-700 group-hover:text-red-700 transition-colors duration-200">Google</span>
					</div>
				</button>

				<button
					type="button"
					class="group relative h-12 px-4 rounded-xl border-2 border-neutral-200 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					<div class="flex items-center justify-center space-x-3">
						<svg class="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
						</svg>
						<span class="font-semibold text-neutral-700 group-hover:text-blue-700 transition-colors duration-200">Facebook</span>
					</div>
				</button>
			</div>

			<!-- Security and speed messaging -->
			<div class="text-center">
				<p class="text-xs text-neutral-500 leading-relaxed">
					Acceso rápido y seguro con tu cuenta preferida
				</p>
			</div>
		</div>

		<!-- Enhanced Argentina Support Section -->
		<div class="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 text-center">
			<div class="space-y-4">
				<div class="flex items-center justify-center space-x-2 text-neutral-600">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<span class="font-medium">¿Problemas para iniciar sesión?</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<a
						href="/ayuda"
						class="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 hover:text-primary-800 rounded-xl transition-all duration-200 font-medium group"
					>
						<svg class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
						</svg>
						<span>Centro de Ayuda</span>
					</a>

					<a
						href="https://wa.me/5491123456789"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center space-x-2 px-4 py-3 bg-success-50 hover:bg-success-100 text-success-700 hover:text-success-800 rounded-xl transition-all duration-200 font-medium group"
					>
						<svg class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.087"/>
						</svg>
						<span>WhatsApp 24/7</span>
					</a>
				</div>

				<!-- Trust footer -->
				<div class="flex items-center justify-center space-x-4 pt-2 text-xs text-neutral-500">
					<div class="flex items-center space-x-1">
						<span class="text-base">🔒</span>
						<span>Datos seguros</span>
					</div>
					<div class="flex items-center space-x-1">
						<span class="text-base">🇦🇷</span>
						<span>Soporte en Argentina</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>