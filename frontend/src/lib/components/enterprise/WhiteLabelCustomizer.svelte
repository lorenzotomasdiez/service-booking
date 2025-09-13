<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import Card from '../Card.svelte';
	import Button from '../Button.svelte';
	import Input from '../Input.svelte';
	import Loading from '../Loading.svelte';
	import Modal from '../Modal.svelte';
	
	const dispatch = createEventDispatcher();
	
	export let tenantId: string;
	export let currentConfig: any = {};
	export let permissions: string[] = [];
	
	// White-label customization state
	let loading = false;
	let saving = false;
	let activeTab = 'branding';
	let previewMode = false;
	let showThemeModal = false;
	let selectedLanguage = 'es';
	
	// Customization data stores
	const brandingConfig = writable({
		primaryColor: '#3b82f6',
		secondaryColor: '#10b981',
		accentColor: '#f59e0b',
		logo: '',
		favicon: '',
		companyName: 'Mi Empresa',
		tagline: 'Reservas profesionales',
		fontFamily: 'Inter',
		borderRadius: '8',
		spacing: 'normal'
	});
	
	const themeConfig = writable({
		mode: 'light',
		customCSS: '',
		layout: 'modern',
		animations: true,
		shadows: true,
		gradients: false
	});
	
	const workflowConfig = writable({
		bookingFlow: 'standard',
		paymentFlow: 'integrated',
		userRegistration: 'required',
		providerVerification: 'manual',
		notificationSettings: {
			email: true,
			sms: false,
			whatsapp: true,
			push: true
		},
		approvalWorkflows: {
			bookings: 'auto',
			providers: 'manual',
			services: 'manual'
		}
	});
	
	const featureConfig = writable({
		enabledFeatures: [
			'booking',
			'payments',
			'calendar',
			'messaging',
			'reviews',
			'analytics'
		],
		premiumFeatures: [
			'ai_recommendations',
			'advanced_analytics',
			'multi_location',
			'api_access',
			'white_label_app'
		],
		customModules: []
	});
	
	const languageConfig = writable({
		primaryLanguage: 'es',
		supportedLanguages: ['es', 'en'],
		customTranslations: {},
		dateFormat: 'DD/MM/YYYY',
		currency: 'ARS',
		timezone: 'America/Argentina/Buenos_Aires',
		cultural Adaptations: {
			paymentMethods: ['MercadoPago', 'Credit Card', 'Bank Transfer'],
			addressFormat: 'argentina',
			phoneFormat: '+54'
		}
	});
	
	// Available theme presets
	const themePresets = [
		{
			id: 'modern',
			name: 'Moderno',
			description: 'Diseño limpio y minimalista',
			colors: { primary: '#3b82f6', secondary: '#10b981' },
			preview: '/themes/modern-preview.jpg'
		},
		{
			id: 'professional',
			name: 'Profesional',
			description: 'Elegante y corporativo',
			colors: { primary: '#1f2937', secondary: '#6b7280' },
			preview: '/themes/professional-preview.jpg'
		},
		{
			id: 'vibrant',
			name: 'Vibrante',
			description: 'Colorido y energético',
			colors: { primary: '#ec4899', secondary: '#f59e0b' },
			preview: '/themes/vibrant-preview.jpg'
		},
		{
			id: 'healthcare',
			name: 'Salud',
			description: 'Diseño para servicios de salud',
			colors: { primary: '#059669', secondary: '#0ea5e9' },
			preview: '/themes/healthcare-preview.jpg'
		}
	];
	
	onMount(async () => {
		await loadCurrentConfig();
	});
	
	async function loadCurrentConfig() {
		loading = true;
		
		try {
			const response = await fetch(`/api/enterprise/white-label/config/${tenantId}`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				}
			});
			
			if (response.ok) {
				const config = await response.json();
				brandingConfig.set({ ...$brandingConfig, ...config.branding });
				themeConfig.set({ ...$themeConfig, ...config.theme });
				workflowConfig.set({ ...$workflowConfig, ...config.workflows });
				featureConfig.set({ ...$featureConfig, ...config.features });
				languageConfig.set({ ...$languageConfig, ...config.language });
			}
		} catch (error) {
			console.error('Failed to load white-label config:', error);
		} finally {
			loading = false;
		}
	}
	
	async function saveConfiguration() {
		saving = true;
		
		try {
			const config = {
				branding: $brandingConfig,
				theme: $themeConfig,
				workflows: $workflowConfig,
				features: $featureConfig,
				language: $languageConfig
			};
			
			const response = await fetch(`/api/enterprise/white-label/config/${tenantId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify(config)
			});
			
			if (response.ok) {
				dispatch('config-saved', config);
				
				// Show success notification
				showNotification('Configuración guardada exitosamente', 'success');
			} else {
				throw new Error('Failed to save configuration');
			}
		} catch (error) {
			console.error('Save configuration error:', error);
			showNotification('Error al guardar la configuración', 'error');
		} finally {
			saving = false;
		}
	}
	
	async function generatePreview() {
		previewMode = true;
		
		try {
			const response = await fetch(`/api/enterprise/white-label/preview/${tenantId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					branding: $brandingConfig,
					theme: $themeConfig,
					workflows: $workflowConfig,
					features: $featureConfig,
					language: $languageConfig
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				// Open preview in new window
				window.open(data.previewUrl, '_blank', 'width=1200,height=800');
			}
		} catch (error) {
			console.error('Preview generation error:', error);
		} finally {
			previewMode = false;
		}
	}
	
	function applyThemePreset(preset: any) {
		brandingConfig.update(config => ({
			...config,
			primaryColor: preset.colors.primary,
			secondaryColor: preset.colors.secondary
		}));
		
		themeConfig.update(config => ({
			...config,
			layout: preset.id
		}));
		
		showThemeModal = false;
	}
	
	function handleLogoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			// Handle file upload (would typically upload to cloud storage)
			const reader = new FileReader();
			reader.onload = (e) => {
				brandingConfig.update(config => ({
					...config,
					logo: e.target?.result as string
				}));
			};
			reader.readAsDataURL(file);
		}
	}
	
	function updateFeature(featureId: string, enabled: boolean) {
		featureConfig.update(config => {
			const features = enabled 
				? [...config.enabledFeatures, featureId].filter((f, i, arr) => arr.indexOf(f) === i)
				: config.enabledFeatures.filter(f => f !== featureId);
			
			return { ...config, enabledFeatures: features };
		});
	}
	
	function hasPermission(permission: string): boolean {
		return permissions.includes(permission) || permissions.includes('admin');
	}
	
	function showNotification(message: string, type: 'success' | 'error') {
		// Implementation would dispatch to notification system
		console.log(`${type}: ${message}`);
	}
</script>

<div class="white-label-customizer space-y-6">
	<!-- Header -->
	<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Personalización White-Label</h1>
			<p class="text-neutral-600 mt-1">Configura la apariencia y funcionalidades de tu plataforma</p>
		</div>
		
		<div class="flex items-center space-x-3">
			<Button variant="secondary" on:click={generatePreview} disabled={previewMode}>
				{#if previewMode}
					<Loading size="sm" class="mr-2" />
				{:else}
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
					</svg>
				{/if}
				Vista Previa
			</Button>
			
			{#if hasPermission('white_label_save')}
				<Button variant="primary" on:click={saveConfiguration} disabled={saving}>
					{#if saving}
						<Loading size="sm" class="mr-2" />
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{/if}
					Guardar Cambios
				</Button>
			{/if}
		</div>
	</div>
	
	{#if loading}
		<Loading message="Cargando configuración..." />
	{:else}
		<!-- Navigation Tabs -->
		<div class="border-b border-neutral-200">
			<nav class="-mb-px flex space-x-8 overflow-x-auto">
				{#each [
					{ id: 'branding', label: 'Marca', icon: 'palette' },
					{ id: 'theme', label: 'Tema', icon: 'color-swatch' },
					{ id: 'workflows', label: 'Flujos', icon: 'workflow' },
					{ id: 'features', label: 'Funciones', icon: 'puzzle' },
					{ id: 'language', label: 'Idioma', icon: 'translate' }
				] as tab}
					<button
						class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
						class:border-brand={activeTab === tab.id}
						class:text-brand={activeTab === tab.id}
						class:border-transparent={activeTab !== tab.id}
						class:text-neutral-500={activeTab !== tab.id}
						class:hover:text-neutral-700={activeTab !== tab.id}
						class:hover:border-neutral-300={activeTab !== tab.id}
						on:click={() => activeTab = tab.id}
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>
		
		<!-- Tab Content -->
		<div class="mt-6">
			{#if activeTab === 'branding'}
				<!-- Branding Configuration -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Identidad de Marca</h3>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Nombre de la Empresa</label>
								<Input 
									bind:value={$brandingConfig.companyName}
									placeholder="Mi Empresa"
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Eslogan</label>
								<Input 
									bind:value={$brandingConfig.tagline}
									placeholder="Tu eslogan aquí"
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Logo</label>
								<div class="flex items-center space-x-4">
									{#if $brandingConfig.logo}
										<img src={$brandingConfig.logo} alt="Logo" class="w-16 h-16 object-contain rounded-lg border" />
									{:else}
										<div class="w-16 h-16 bg-neutral-100 rounded-lg border flex items-center justify-center">
											<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
									{/if}
									<input
										type="file"
										accept="image/*"
										on:change={handleLogoUpload}
										class="text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand file:text-white hover:file:bg-brand-dark"
									/>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Colores de Marca</h3>
						<div class="space-y-4">
							<div class="grid grid-cols-3 gap-4">
								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Color Primario</label>
									<div class="flex items-center space-x-2">
										<input
											type="color"
											bind:value={$brandingConfig.primaryColor}
											class="w-12 h-10 rounded border"
										/>
										<Input 
											bind:value={$brandingConfig.primaryColor}
											class="flex-1"
										/>
									</div>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Color Secundario</label>
									<div class="flex items-center space-x-2">
										<input
											type="color"
											bind:value={$brandingConfig.secondaryColor}
											class="w-12 h-10 rounded border"
										/>
										<Input 
											bind:value={$brandingConfig.secondaryColor}
											class="flex-1"
										/>
									</div>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Color de Acento</label>
									<div class="flex items-center space-x-2">
										<input
											type="color"
											bind:value={$brandingConfig.accentColor}
											class="w-12 h-10 rounded border"
										/>
										<Input 
											bind:value={$brandingConfig.accentColor}
											class="flex-1"
										/>
									</div>
								</div>
							</div>
							
							<div class="pt-4">
								<Button variant="secondary" size="sm" on:click={() => showThemeModal = true}>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
									</svg>
									Temas Predefinidos
								</Button>
							</div>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'theme'}
				<!-- Theme Configuration -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Configuración del Tema</h3>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Modo</label>
								<div class="flex space-x-4">
									<label class="flex items-center">
										<input 
											type="radio" 
											name="theme-mode" 
											value="light" 
											bind:group={$themeConfig.mode}
											class="mr-2"
										/>
										Claro
									</label>
									<label class="flex items-center">
										<input 
											type="radio" 
											name="theme-mode" 
											value="dark" 
											bind:group={$themeConfig.mode}
											class="mr-2"
										/>
										Oscuro
									</label>
									<label class="flex items-center">
										<input 
											type="radio" 
											name="theme-mode" 
											value="auto" 
											bind:group={$themeConfig.mode}
											class="mr-2"
										/>
										Automático
									</label>
								</div>
							</div>
							
							<div class="space-y-3">
								<label class="flex items-center">
									<input 
										type="checkbox" 
										bind:checked={$themeConfig.animations}
										class="mr-3 rounded"
									/>
									<span class="text-sm font-medium text-neutral-700">Animaciones</span>
								</label>
								
								<label class="flex items-center">
									<input 
										type="checkbox" 
										bind:checked={$themeConfig.shadows}
										class="mr-3 rounded"
									/>
									<span class="text-sm font-medium text-neutral-700">Sombras</span>
								</label>
								
								<label class="flex items-center">
									<input 
										type="checkbox" 
										bind:checked={$themeConfig.gradients}
										class="mr-3 rounded"
									/>
									<span class="text-sm font-medium text-neutral-700">Gradientes</span>
								</label>
							</div>
						</div>
					</Card>
					
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">CSS Personalizado</h3>
						<textarea
							bind:value={$themeConfig.customCSS}
							rows="12"
							class="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-mono text-sm"
							placeholder="/* Agrega tu CSS personalizado aquí */"
						></textarea>
					</Card>
				</div>
			{:else if activeTab === 'features'}
				<!-- Feature Configuration -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Funciones Básicas</h3>
						<div class="space-y-3">
							{#each [
								{ id: 'booking', label: 'Sistema de Reservas', description: 'Funcionalidad de reserva de citas' },
								{ id: 'payments', label: 'Pagos', description: 'Procesamiento de pagos integrado' },
								{ id: 'calendar', label: 'Calendario', description: 'Gestión de horarios y disponibilidad' },
								{ id: 'messaging', label: 'Mensajería', description: 'Chat entre usuarios y proveedores' },
								{ id: 'reviews', label: 'Reseñas', description: 'Sistema de reseñas y calificaciones' },
								{ id: 'analytics', label: 'Analíticas', description: 'Estadísticas y reportes básicos' }
							] as feature}
								<label class="flex items-start space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
									<input 
										type="checkbox" 
										checked={$featureConfig.enabledFeatures.includes(feature.id)}
										on:change={(e) => updateFeature(feature.id, e.target.checked)}
										class="mt-0.5 rounded"
									/>
									<div class="flex-1">
										<div class="font-medium text-neutral-900">{feature.label}</div>
										<div class="text-sm text-neutral-600">{feature.description}</div>
									</div>
								</label>
							{/each}
						</div>
					</Card>
					
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Funciones Premium</h3>
						<div class="space-y-3">
							{#each [
								{ id: 'ai_recommendations', label: 'Recomendaciones IA', description: 'Sugerencias inteligentes personalizadas' },
								{ id: 'advanced_analytics', label: 'Analíticas Avanzadas', description: 'Reportes detallados y predicciones' },
								{ id: 'multi_location', label: 'Multi-ubicación', description: 'Gestión de múltiples sucursales' },
								{ id: 'api_access', label: 'Acceso API', description: 'Integración con sistemas externos' },
								{ id: 'white_label_app', label: 'App White-Label', description: 'Aplicación móvil personalizada' }
							] as feature}
								<label class="flex items-start space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
									<input 
										type="checkbox" 
										checked={$featureConfig.enabledFeatures.includes(feature.id)}
										on:change={(e) => updateFeature(feature.id, e.target.checked)}
										class="mt-0.5 rounded"
									/>
									<div class="flex-1">
										<div class="flex items-center space-x-2">
											<span class="font-medium text-neutral-900">{feature.label}</span>
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Premium</span>
										</div>
										<div class="text-sm text-neutral-600">{feature.description}</div>
									</div>
								</label>
							{/each}
						</div>
					</Card>
				</div>
			{:else if activeTab === 'language'}
				<!-- Language Configuration -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Configuración Regional</h3>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Idioma Principal</label>
								<select 
									bind:value={$languageConfig.primaryLanguage}
									class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								>
									<option value="es">Español (Argentina)</option>
									<option value="en">English</option>
									<option value="pt">Português (Brasil)</option>
								</select>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Moneda</label>
								<select 
									bind:value={$languageConfig.currency}
									class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								>
									<option value="ARS">Peso Argentino (ARS)</option>
									<option value="USD">Dólar Estadounidense (USD)</option>
									<option value="EUR">Euro (EUR)</option>
									<option value="BRL">Real Brasileño (BRL)</option>
								</select>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Zona Horaria</label>
								<select 
									bind:value={$languageConfig.timezone}
									class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								>
									<option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
									<option value="America/Argentina/Cordoba">Córdoba (UTC-3)</option>
									<option value="America/Argentina/Mendoza">Mendoza (UTC-3)</option>
								</select>
							</div>
						</div>
					</Card>
					
					<Card>
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Adaptaciones Culturales</h3>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Métodos de Pago</label>
								<div class="space-y-2">
									{#each ['MercadoPago', 'Credit Card', 'Bank Transfer', 'Cash'] as method}
										<label class="flex items-center">
											<input 
												type="checkbox" 
												checked={$languageConfig.culturalAdaptations.paymentMethods.includes(method)}
												class="mr-2 rounded"
											/>
											{method}
										</label>
									{/each}
								</div>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Formato de Dirección</label>
								<select 
									bind:value={$languageConfig.culturalAdaptations.addressFormat}
									class="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
								>
									<option value="argentina">Argentina</option>
									<option value="international">Internacional</option>
								</select>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">Formato de Teléfono</label>
								<Input 
									bind:value={$languageConfig.culturalAdaptations.phoneFormat}
									placeholder="+54"
								/>
							</div>
						</div>
					</Card>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Theme Presets Modal -->
{#if showThemeModal}
	<Modal 
		title="Temas Predefinidos" 
		on:close={() => showThemeModal = false}
		size="lg"
	>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each themePresets as preset}
				<button
					type="button"
					on:click={() => applyThemePreset(preset)}
					class="p-4 border-2 border-neutral-200 rounded-lg hover:border-brand transition-colors text-left"
				>
					<div class="flex items-center space-x-3 mb-3">
						<div class="flex space-x-1">
							<div class="w-4 h-4 rounded" style="background-color: {preset.colors.primary}"></div>
							<div class="w-4 h-4 rounded" style="background-color: {preset.colors.secondary}"></div>
						</div>
						<div>
							<h4 class="font-semibold text-neutral-900">{preset.name}</h4>
							<p class="text-sm text-neutral-600">{preset.description}</p>
						</div>
					</div>
					
					{#if preset.preview}
						<div class="w-full h-24 bg-neutral-100 rounded border"></div>
					{/if}
				</button>
			{/each}
		</div>
	</Modal>
{/if}

<style>
	.white-label-customizer {
		@apply max-w-7xl mx-auto p-6;
	}
	
	/* Mobile optimization */
	@media (max-width: 768px) {
		.white-label-customizer {
			@apply p-4;
		}
		
		/* Touch-friendly controls */
		input[type="checkbox"], 
		input[type="radio"] {
			transform: scale(1.2);
		}
		
		button {
			min-height: 44px;
		}
	}
	
	/* Color picker styling */
	input[type="color"] {
		-webkit-appearance: none;
		border: none;
		cursor: pointer;
	}
	
	input[type="color"]::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	
	input[type="color"]::-webkit-color-swatch {
		border: none;
		border-radius: 4px;
	}
</style>