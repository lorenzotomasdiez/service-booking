<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { format } from 'date-fns';
	import { es } from 'date-fns/locale';
	import { fly, fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let userId: string;
	export let userType: 'client' | 'provider' = 'client';
	export let vertical: 'barber' | 'psychology' = 'barber';

	interface UserProfile {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		dateOfBirth?: string;
		avatar?: string;
		bio?: string;
		preferences: UserPreferences;
		addresses: Address[];
		emergencyContact?: EmergencyContact;
		medicalInfo?: MedicalInfo;
		socialProfiles?: SocialProfiles;
		privacySettings: PrivacySettings;
		notificationSettings: NotificationSettings;
		accessibility: AccessibilitySettings;
	}

	interface UserPreferences {
		language: 'es-AR' | 'en-US';
		timezone: string;
		currency: 'ARS' | 'USD';
		theme: 'light' | 'dark' | 'auto';
		preferredServices: string[];
		favoriteProviders: string[];
		bookingPreferences: {
			defaultDuration: number;
			preferredTimes: string[];
			allowWaitlist: boolean;
			autoConfirm: boolean;
		};
		communicationPreferences: {
			preferredMethod: 'email' | 'sms' | 'whatsapp' | 'push';
			language: 'formal' | 'casual';
			frequency: 'minimal' | 'standard' | 'all';
		};
	}

	interface Address {
		id: string;
		type: 'home' | 'work' | 'other';
		label: string;
		street: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
		isDefault: boolean;
		instructions?: string;
	}

	interface EmergencyContact {
		name: string;
		relationship: string;
		phone: string;
		email?: string;
	}

	interface MedicalInfo {
		allergies: string[];
		medications: string[];
		conditions: string[];
		bloodType?: string;
		insuranceProvider?: string;
		insuranceNumber?: string;
		doctorName?: string;
		doctorPhone?: string;
	}

	interface SocialProfiles {
		instagram?: string;
		facebook?: string;
		linkedin?: string;
		website?: string;
	}

	interface PrivacySettings {
		profileVisibility: 'public' | 'private' | 'contacts';
		showEmail: boolean;
		showPhone: boolean;
		showAddress: boolean;
		allowSearch: boolean;
		dataProcessing: boolean;
		marketingEmails: boolean;
		shareWithProviders: boolean;
	}

	interface NotificationSettings {
		bookingReminders: boolean;
		promotions: boolean;
		newServices: boolean;
		paymentUpdates: boolean;
		securityAlerts: boolean;
		systemUpdates: boolean;
		smsNotifications: boolean;
		emailNotifications: boolean;
		pushNotifications: boolean;
		whatsappNotifications: boolean;
	}

	interface AccessibilitySettings {
		fontSize: 'small' | 'medium' | 'large' | 'xlarge';
		highContrast: boolean;
		reducedMotion: boolean;
		screenReader: boolean;
		keyboardNavigation: boolean;
		voiceControl: boolean;
		audioDescriptions: boolean;
	}

	let profile: UserProfile = {
		id: '',
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		addresses: [],
		preferences: {
			language: 'es-AR',
			timezone: 'America/Argentina/Buenos_Aires',
			currency: 'ARS',
			theme: 'auto',
			preferredServices: [],
			favoriteProviders: [],
			bookingPreferences: {
				defaultDuration: 60,
				preferredTimes: [],
				allowWaitlist: true,
				autoConfirm: false
			},
			communicationPreferences: {
				preferredMethod: 'whatsapp',
				language: 'casual',
				frequency: 'standard'
			}
		},
		privacySettings: {
			profileVisibility: 'private',
			showEmail: false,
			showPhone: false,
			showAddress: false,
			allowSearch: true,
			dataProcessing: true,
			marketingEmails: false,
			shareWithProviders: true
		},
		notificationSettings: {
			bookingReminders: true,
			promotions: false,
			newServices: true,
			paymentUpdates: true,
			securityAlerts: true,
			systemUpdates: false,
			smsNotifications: true,
			emailNotifications: true,
			pushNotifications: true,
			whatsappNotifications: true
		},
		accessibility: {
			fontSize: 'medium',
			highContrast: false,
			reducedMotion: false,
			screenReader: false,
			keyboardNavigation: false,
			voiceControl: false,
			audioDescriptions: false
		}
	};

	let activeTab: 'personal' | 'preferences' | 'addresses' | 'medical' | 'privacy' | 'notifications' | 'accessibility' = 'personal';
	let loading = false;
	let saving = false;
	let error: string | null = null;
	let successMessage: string | null = null;

	// Avatar upload
	let avatarFile: File | null = null;
	let avatarPreview: string | null = null;
	let uploadingAvatar = false;

	// Address modal
	let showAddressModal = false;
	let editingAddress: Address | null = null;

	const timeSlots = [
		'08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
		'14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
	];

	const relationshipOptions = [
		'Cónyuge', 'Padre/Madre', 'Hijo/a', 'Hermano/a', 
		'Abuelo/a', 'Tío/a', 'Primo/a', 'Amigo/a', 'Otro'
	];

	const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

	onMount(async () => {
		await loadProfile();
	});

	async function loadProfile() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`/api/users/${userId}/profile`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Error al cargar el perfil');
			}

			profile = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}

	async function saveProfile() {
		try {
			saving = true;
			error = null;
			successMessage = null;

			const response = await fetch(`/api/users/${userId}/profile`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(profile)
			});

			if (!response.ok) {
				throw new Error('Error al guardar el perfil');
			}

			successMessage = 'Perfil actualizado correctamente';
			
			// Apply accessibility settings immediately
			applyAccessibilitySettings();
			
			dispatch('profile-updated', profile);

			// Clear success message after 3 seconds
			setTimeout(() => {
				successMessage = null;
			}, 3000);

		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al guardar';
		} finally {
			saving = false;
		}
	}

	async function uploadAvatar() {
		if (!avatarFile) return;

		try {
			uploadingAvatar = true;
			const formData = new FormData();
			formData.append('avatar', avatarFile);

			const response = await fetch(`/api/users/${userId}/avatar`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				},
				body: formData
			});

			if (!response.ok) {
				throw new Error('Error al subir la imagen');
			}

			const result = await response.json();
			profile.avatar = result.avatarUrl;
			avatarFile = null;
			avatarPreview = null;

		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al subir imagen';
		} finally {
			uploadingAvatar = false;
		}
	}

	function handleAvatarChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			if (file.size > 5 * 1024 * 1024) { // 5MB limit
				error = 'La imagen debe ser menor a 5MB';
				return;
			}

			if (!file.type.startsWith('image/')) {
				error = 'Debe ser una imagen válida';
				return;
			}

			avatarFile = file;
			
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function addAddress() {
		editingAddress = {
			id: `address_${Date.now()}`,
			type: 'home',
			label: '',
			street: '',
			city: '',
			state: 'Buenos Aires',
			postalCode: '',
			country: 'Argentina',
			isDefault: profile.addresses.length === 0
		};
		showAddressModal = true;
	}

	function editAddress(address: Address) {
		editingAddress = { ...address };
		showAddressModal = true;
	}

	function saveAddress() {
		if (!editingAddress) return;

		const existingIndex = profile.addresses.findIndex(a => a.id === editingAddress.id);
		
		if (existingIndex >= 0) {
			profile.addresses[existingIndex] = editingAddress;
		} else {
			profile.addresses = [...profile.addresses, editingAddress];
		}

		// If this is set as default, unset others
		if (editingAddress.isDefault) {
			profile.addresses = profile.addresses.map(a => ({
				...a,
				isDefault: a.id === editingAddress.id
			}));
		}

		showAddressModal = false;
		editingAddress = null;
	}

	function deleteAddress(addressId: string) {
		profile.addresses = profile.addresses.filter(a => a.id !== addressId);
		
		// Set first address as default if we deleted the default
		if (profile.addresses.length > 0 && !profile.addresses.some(a => a.isDefault)) {
			profile.addresses[0].isDefault = true;
		}
	}

	function togglePreferredTime(time: string) {
		const times = profile.preferences.bookingPreferences.preferredTimes;
		const index = times.indexOf(time);
		
		if (index >= 0) {
			profile.preferences.bookingPreferences.preferredTimes = times.filter(t => t !== time);
		} else {
			profile.preferences.bookingPreferences.preferredTimes = [...times, time];
		}
	}

	function addAllergy() {
		if (!profile.medicalInfo) {
			profile.medicalInfo = {
				allergies: [],
				medications: [],
				conditions: []
			};
		}
		profile.medicalInfo.allergies = [...profile.medicalInfo.allergies, ''];
	}

	function removeAllergy(index: number) {
		if (profile.medicalInfo) {
			profile.medicalInfo.allergies = profile.medicalInfo.allergies.filter((_, i) => i !== index);
		}
	}

	function addMedication() {
		if (!profile.medicalInfo) {
			profile.medicalInfo = {
				allergies: [],
				medications: [],
				conditions: []
			};
		}
		profile.medicalInfo.medications = [...profile.medicalInfo.medications, ''];
	}

	function removeMedication(index: number) {
		if (profile.medicalInfo) {
			profile.medicalInfo.medications = profile.medicalInfo.medications.filter((_, i) => i !== index);
		}
	}

	function addCondition() {
		if (!profile.medicalInfo) {
			profile.medicalInfo = {
				allergies: [],
				medications: [],
				conditions: []
			};
		}
		profile.medicalInfo.conditions = [...profile.medicalInfo.conditions, ''];
	}

	function removeCondition(index: number) {
		if (profile.medicalInfo) {
			profile.medicalInfo.conditions = profile.medicalInfo.conditions.filter((_, i) => i !== index);
		}
	}

	function applyAccessibilitySettings() {
		const { accessibility } = profile;
		
		// Apply font size
		document.documentElement.style.fontSize = {
			'small': '14px',
			'medium': '16px',
			'large': '18px',
			'xlarge': '20px'
		}[accessibility.fontSize];

		// Apply high contrast
		if (accessibility.highContrast) {
			document.documentElement.classList.add('high-contrast');
		} else {
			document.documentElement.classList.remove('high-contrast');
		}

		// Apply reduced motion
		if (accessibility.reducedMotion) {
			document.documentElement.classList.add('reduced-motion');
		} else {
			document.documentElement.classList.remove('reduced-motion');
		}
	}

	function getTabIcon(tab: typeof activeTab): string {
		const icons = {
			personal: '👤',
			preferences: '⚙️',
			addresses: '📍',
			medical: '🏥',
			privacy: '🔒',
			notifications: '🔔',
			accessibility: '♿'
		};
		return icons[tab];
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: profile.preferences.currency,
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="max-w-4xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-neutral-800">Configuración del Perfil</h1>
		<p class="text-neutral-600 mt-2">
			Personaliza tu experiencia en BarberPro
		</p>
		
		{#if error}
			<div class="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
				{error}
			</div>
		{/if}
		
		{#if successMessage}
			<div 
				class="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm"
				transition:fade={{ duration: 200 }}
			>
				{successMessage}
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="space-y-6">
			{#each Array(3) as _}
				<div class="card">
					<div class="card-body">
						<div class="skeleton skeleton-text mb-4"></div>
						<div class="space-y-3">
							<div class="skeleton skeleton-text"></div>
							<div class="skeleton skeleton-text"></div>
							<div class="skeleton skeleton-text"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Tab Navigation -->
		<div class="border-b border-neutral-200 mb-8">
			<nav class="flex space-x-8 overflow-x-auto">
				{#each ['personal', 'preferences', 'addresses', 'medical', 'privacy', 'notifications', 'accessibility'] as tab}
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors"
						class:border-primary-600={activeTab === tab}
						class:text-primary-600={activeTab === tab}
						class:border-transparent={activeTab !== tab}
						class:text-neutral-500={activeTab !== tab}
						class:hover:text-neutral-700={activeTab !== tab}
						on:click={() => activeTab = tab}
					>
						<span class="mr-2">{getTabIcon(tab)}</span>
						{#if tab === 'personal'}Información Personal
						{:else if tab === 'preferences'}Preferencias
						{:else if tab === 'addresses'}Direcciones
						{:else if tab === 'medical'}Información Médica
						{:else if tab === 'privacy'}Privacidad
						{:else if tab === 'notifications'}Notificaciones
						{:else if tab === 'accessibility'}Accesibilidad
						{/if}
					</button>
				{/each}
			</nav>
		</div>

		<!-- Tab Content -->
		<div class="space-y-6">
			{#if activeTab === 'personal'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<h2 class="text-xl font-semibold">Información Personal</h2>
					</div>
					<div class="card-body space-y-6">
						<!-- Avatar Section -->
						<div class="flex items-center space-x-6">
							<div class="relative">
								{#if avatarPreview}
									<img 
										src={avatarPreview} 
										alt="Preview"
										class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-medium"
									/>
								{:else if profile.avatar}
									<img 
										src={profile.avatar} 
										alt="Avatar"
										class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-medium"
									/>
								{:else}
									<div class="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
										{profile.firstName[0]}{profile.lastName[0]}
									</div>
								{/if}
								
								<label class="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<input 
										type="file" 
										class="hidden" 
										accept="image/*"
										on:change={handleAvatarChange}
									/>
								</label>
							</div>
							
							<div>
								<h3 class="font-medium text-neutral-800">{profile.firstName} {profile.lastName}</h3>
								<p class="text-sm text-neutral-600">Haz clic en el ícono para cambiar tu foto</p>
								
								{#if avatarFile}
									<button 
										class="btn btn-primary btn-sm mt-2"
										on:click={uploadAvatar}
										disabled={uploadingAvatar}
									>
										{uploadingAvatar ? 'Subiendo...' : 'Subir Foto'}
									</button>
								{/if}
							</div>
						</div>

						<!-- Basic Information -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="form-label">Nombre</label>
								<input 
									type="text" 
									class="form-input"
									bind:value={profile.firstName}
								/>
							</div>
							
							<div>
								<label class="form-label">Apellido</label>
								<input 
									type="text" 
									class="form-input"
									bind:value={profile.lastName}
								/>
							</div>
							
							<div>
								<label class="form-label">Email</label>
								<input 
									type="email" 
									class="form-input"
									bind:value={profile.email}
								/>
							</div>
							
							<div>
								<label class="form-label">Teléfono</label>
								<input 
									type="tel" 
									class="form-input"
									bind:value={profile.phone}
									placeholder="+54 9 11 1234-5678"
								/>
							</div>
							
							<div>
								<label class="form-label">Fecha de Nacimiento</label>
								<input 
									type="date" 
									class="form-input"
									bind:value={profile.dateOfBirth}
								/>
							</div>
						</div>

						<!-- Bio -->
						<div>
							<label class="form-label">Biografía</label>
							<textarea 
								class="form-input"
								bind:value={profile.bio}
								placeholder="Cuéntanos un poco sobre ti..."
								rows="4"
							></textarea>
						</div>

						<!-- Emergency Contact -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Contacto de Emergencia</h3>
							
							{#if !profile.emergencyContact}
								<button 
									class="btn btn-secondary"
									on:click={() => profile.emergencyContact = { name: '', relationship: '', phone: '' }}
								>
									+ Agregar Contacto de Emergencia
								</button>
							{:else}
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label class="form-label">Nombre</label>
										<input 
											type="text" 
											class="form-input"
											bind:value={profile.emergencyContact.name}
										/>
									</div>
									
									<div>
										<label class="form-label">Relación</label>
										<select class="form-input" bind:value={profile.emergencyContact.relationship}>
											<option value="">Seleccionar...</option>
											{#each relationshipOptions as option}
												<option value={option}>{option}</option>
											{/each}
										</select>
									</div>
									
									<div>
										<label class="form-label">Teléfono</label>
										<input 
											type="tel" 
											class="form-input"
											bind:value={profile.emergencyContact.phone}
										/>
									</div>
								</div>
								
								<button 
									class="btn btn-ghost btn-sm text-error-600"
									on:click={() => profile.emergencyContact = undefined}
								>
									Eliminar Contacto
								</button>
							{/if}
						</div>

						<!-- Social Profiles -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Redes Sociales</h3>
							
							{#if !profile.socialProfiles}
								<button 
									class="btn btn-secondary"
									on:click={() => profile.socialProfiles = {}}
								>
									+ Agregar Redes Sociales
								</button>
							{:else}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label class="form-label">Instagram</label>
										<input 
											type="url" 
											class="form-input"
											bind:value={profile.socialProfiles.instagram}
											placeholder="https://instagram.com/usuario"
										/>
									</div>
									
									<div>
										<label class="form-label">Facebook</label>
										<input 
											type="url" 
											class="form-input"
											bind:value={profile.socialProfiles.facebook}
											placeholder="https://facebook.com/usuario"
										/>
									</div>
									
									<div>
										<label class="form-label">LinkedIn</label>
										<input 
											type="url" 
											class="form-input"
											bind:value={profile.socialProfiles.linkedin}
											placeholder="https://linkedin.com/in/usuario"
										/>
									</div>
									
									<div>
										<label class="form-label">Sitio Web</label>
										<input 
											type="url" 
											class="form-input"
											bind:value={profile.socialProfiles.website}
											placeholder="https://ejemplo.com"
										/>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

			{:else if activeTab === 'preferences'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<h2 class="text-xl font-semibold">Preferencias</h2>
					</div>
					<div class="card-body space-y-6">
						<!-- General Preferences -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="form-label">Idioma</label>
								<select class="form-input" bind:value={profile.preferences.language}>
									<option value="es-AR">Español (Argentina)</option>
									<option value="en-US">English (US)</option>
								</select>
							</div>
							
							<div>
								<label class="form-label">Zona Horaria</label>
								<select class="form-input" bind:value={profile.preferences.timezone}>
									<option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
									<option value="America/Argentina/Cordoba">Córdoba</option>
									<option value="America/Argentina/Mendoza">Mendoza</option>
								</select>
							</div>
							
							<div>
								<label class="form-label">Moneda</label>
								<select class="form-input" bind:value={profile.preferences.currency}>
									<option value="ARS">Peso Argentino (ARS)</option>
									<option value="USD">Dólar Estadounidense (USD)</option>
								</select>
							</div>
							
							<div>
								<label class="form-label">Tema</label>
								<select class="form-input" bind:value={profile.preferences.theme}>
									<option value="light">Claro</option>
									<option value="dark">Oscuro</option>
									<option value="auto">Automático</option>
								</select>
							</div>
						</div>

						<!-- Booking Preferences -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Preferencias de Reserva</h3>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label class="form-label">Duración por Defecto (minutos)</label>
									<input 
										type="number" 
										class="form-input"
										bind:value={profile.preferences.bookingPreferences.defaultDuration}
										min="15"
										max="240"
										step="15"
									/>
								</div>
							</div>
							
							<div>
								<label class="form-label">Horarios Preferidos</label>
								<div class="grid grid-cols-4 md:grid-cols-7 gap-2">
									{#each timeSlots as time}
										<button
											type="button"
											class="p-2 text-sm border rounded-lg transition-colors"
											class:border-primary-600={profile.preferences.bookingPreferences.preferredTimes.includes(time)}
											class:bg-primary-50={profile.preferences.bookingPreferences.preferredTimes.includes(time)}
											class:text-primary-800={profile.preferences.bookingPreferences.preferredTimes.includes(time)}
											class:border-neutral-200={!profile.preferences.bookingPreferences.preferredTimes.includes(time)}
											on:click={() => togglePreferredTime(time)}
										>
											{time}
										</button>
									{/each}
								</div>
							</div>
							
							<div class="space-y-3">
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="allow-waitlist"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.preferences.bookingPreferences.allowWaitlist}
									/>
									<label for="allow-waitlist" class="ml-2 text-sm text-neutral-700">
										Permitir lista de espera
									</label>
								</div>
								
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="auto-confirm"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.preferences.bookingPreferences.autoConfirm}
									/>
									<label for="auto-confirm" class="ml-2 text-sm text-neutral-700">
										Confirmar automáticamente reservas disponibles
									</label>
								</div>
							</div>
						</div>

						<!-- Communication Preferences -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Preferencias de Comunicación</h3>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label class="form-label">Método Preferido</label>
									<select class="form-input" bind:value={profile.preferences.communicationPreferences.preferredMethod}>
										<option value="email">Email</option>
										<option value="sms">SMS</option>
										<option value="whatsapp">WhatsApp</option>
										<option value="push">Notificaciones Push</option>
									</select>
								</div>
								
								<div>
									<label class="form-label">Tono de Comunicación</label>
									<select class="form-input" bind:value={profile.preferences.communicationPreferences.language}>
										<option value="formal">Formal</option>
										<option value="casual">Casual</option>
									</select>
								</div>
								
								<div>
									<label class="form-label">Frecuencia</label>
									<select class="form-input" bind:value={profile.preferences.communicationPreferences.frequency}>
										<option value="minimal">Mínima</option>
										<option value="standard">Estándar</option>
										<option value="all">Todas</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else if activeTab === 'addresses'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<div class="flex justify-between items-center">
							<h2 class="text-xl font-semibold">Direcciones</h2>
							<button class="btn btn-primary" on:click={addAddress}>
								+ Agregar Dirección
							</button>
						</div>
					</div>
					<div class="card-body">
						{#if profile.addresses.length === 0}
							<div class="text-center py-8 text-neutral-500">
								<svg class="w-12 h-12 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<p>No tienes direcciones guardadas</p>
								<button class="btn btn-primary mt-4" on:click={addAddress}>
									Agregar Primera Dirección
								</button>
							</div>
						{:else}
							<div class="space-y-4">
								{#each profile.addresses as address}
									<div class="border border-neutral-200 rounded-lg p-4">
										<div class="flex justify-between items-start">
											<div class="flex-1">
												<div class="flex items-center gap-2 mb-2">
													<h4 class="font-medium text-neutral-800">
														{address.label || `${address.type.charAt(0).toUpperCase() + address.type.slice(1)}`}
													</h4>
													{#if address.isDefault}
														<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-800">
															Por defecto
														</span>
													{/if}
												</div>
												
												<div class="text-sm text-neutral-600">
													<div>{address.street}</div>
													<div>{address.city}, {address.state} {address.postalCode}</div>
													<div>{address.country}</div>
													{#if address.instructions}
														<div class="mt-1 text-neutral-500">
															Instrucciones: {address.instructions}
														</div>
													{/if}
												</div>
											</div>
											
											<div class="flex items-center gap-2">
												<button 
													class="btn btn-secondary btn-sm"
													on:click={() => editAddress(address)}
												>
													Editar
												</button>
												<button 
													class="btn btn-ghost btn-sm text-error-600"
													on:click={() => deleteAddress(address.id)}
												>
													Eliminar
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

			{:else if activeTab === 'medical'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<h2 class="text-xl font-semibold">Información Médica</h2>
						<p class="text-sm text-neutral-600 mt-1">
							{vertical === 'psychology' 
								? 'Esta información ayuda a brindar un mejor cuidado psicológico'
								: 'Esta información es importante para servicios de belleza seguros'
							}
						</p>
					</div>
					<div class="card-body space-y-6">
						{#if !profile.medicalInfo}
							<button 
								class="btn btn-secondary"
								on:click={() => profile.medicalInfo = { allergies: [], medications: [], conditions: [] }}
							>
								+ Agregar Información Médica
							</button>
						{:else}
							<!-- Basic Medical Info -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label class="form-label">Tipo de Sangre</label>
									<select class="form-input" bind:value={profile.medicalInfo.bloodType}>
										<option value="">Seleccionar...</option>
										{#each bloodTypes as type}
											<option value={type}>{type}</option>
										{/each}
									</select>
								</div>
								
								<div>
									<label class="form-label">Obra Social/Prepaga</label>
									<input 
										type="text" 
										class="form-input"
										bind:value={profile.medicalInfo.insuranceProvider}
										placeholder="Nombre de la obra social"
									/>
								</div>
								
								<div>
									<label class="form-label">Número de Afiliado</label>
									<input 
										type="text" 
										class="form-input"
										bind:value={profile.medicalInfo.insuranceNumber}
										placeholder="Número de afiliado"
									/>
								</div>
								
								<div>
									<label class="form-label">Médico de Cabecera</label>
									<input 
										type="text" 
										class="form-input"
										bind:value={profile.medicalInfo.doctorName}
										placeholder="Nombre del médico"
									/>
								</div>
								
								<div>
									<label class="form-label">Teléfono del Médico</label>
									<input 
										type="tel" 
										class="form-input"
										bind:value={profile.medicalInfo.doctorPhone}
										placeholder="+54 9 11 1234-5678"
									/>
								</div>
							</div>

							<!-- Allergies -->
							<div class="space-y-3">
								<div class="flex justify-between items-center">
									<h3 class="text-lg font-semibold text-neutral-800">Alergias</h3>
									<button class="btn btn-secondary btn-sm" on:click={addAllergy}>
										+ Agregar
									</button>
								</div>
								
								{#if profile.medicalInfo.allergies.length === 0}
									<p class="text-sm text-neutral-500">No hay alergias registradas</p>
								{:else}
									<div class="space-y-2">
										{#each profile.medicalInfo.allergies as allergy, index}
											<div class="flex gap-2">
												<input 
													type="text" 
													class="form-input flex-1"
													bind:value={profile.medicalInfo.allergies[index]}
													placeholder="Describe la alergia"
												/>
												<button 
													class="btn btn-ghost btn-sm text-error-600"
													on:click={() => removeAllergy(index)}
												>
													Eliminar
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Medications -->
							<div class="space-y-3">
								<div class="flex justify-between items-center">
									<h3 class="text-lg font-semibold text-neutral-800">Medicamentos</h3>
									<button class="btn btn-secondary btn-sm" on:click={addMedication}>
										+ Agregar
									</button>
								</div>
								
								{#if profile.medicalInfo.medications.length === 0}
									<p class="text-sm text-neutral-500">No hay medicamentos registrados</p>
								{:else}
									<div class="space-y-2">
										{#each profile.medicalInfo.medications as medication, index}
											<div class="flex gap-2">
												<input 
													type="text" 
													class="form-input flex-1"
													bind:value={profile.medicalInfo.medications[index]}
													placeholder="Nombre del medicamento y dosis"
												/>
												<button 
													class="btn btn-ghost btn-sm text-error-600"
													on:click={() => removeMedication(index)}
												>
													Eliminar
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Conditions -->
							<div class="space-y-3">
								<div class="flex justify-between items-center">
									<h3 class="text-lg font-semibold text-neutral-800">Condiciones Médicas</h3>
									<button class="btn btn-secondary btn-sm" on:click={addCondition}>
										+ Agregar
									</button>
								</div>
								
								{#if profile.medicalInfo.conditions.length === 0}
									<p class="text-sm text-neutral-500">No hay condiciones registradas</p>
								{:else}
									<div class="space-y-2">
										{#each profile.medicalInfo.conditions as condition, index}
											<div class="flex gap-2">
												<input 
													type="text" 
													class="form-input flex-1"
													bind:value={profile.medicalInfo.conditions[index]}
													placeholder="Describe la condición"
												/>
												<button 
													class="btn btn-ghost btn-sm text-error-600"
													on:click={() => removeCondition(index)}
												>
													Eliminar
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

			{:else if activeTab === 'privacy'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<h2 class="text-xl font-semibold">Configuración de Privacidad</h2>
					</div>
					<div class="card-body space-y-6">
						<!-- Profile Visibility -->
						<div>
							<label class="form-label">Visibilidad del Perfil</label>
							<select class="form-input" bind:value={profile.privacySettings.profileVisibility}>
								<option value="public">Público</option>
								<option value="private">Privado</option>
								<option value="contacts">Solo Contactos</option>
							</select>
							<p class="text-xs text-neutral-500 mt-1">
								Controla quién puede ver tu información de perfil
							</p>
						</div>

						<!-- Information Sharing -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Información Compartida</h3>
							
							<div class="space-y-3">
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="show-email"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.showEmail}
									/>
									<label for="show-email" class="ml-2 text-sm text-neutral-700">
										Mostrar email en perfil público
									</label>
								</div>
								
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="show-phone"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.showPhone}
									/>
									<label for="show-phone" class="ml-2 text-sm text-neutral-700">
										Mostrar teléfono en perfil público
									</label>
								</div>
								
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="show-address"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.showAddress}
									/>
									<label for="show-address" class="ml-2 text-sm text-neutral-700">
										Mostrar ubicación general en perfil
									</label>
								</div>
								
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="allow-search"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.allowSearch}
									/>
									<label for="allow-search" class="ml-2 text-sm text-neutral-700">
										Permitir que me encuentren en búsquedas
									</label>
								</div>
							</div>
						</div>

						<!-- Data Processing -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Procesamiento de Datos</h3>
							
							<div class="space-y-3">
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="data-processing"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.dataProcessing}
									/>
									<label for="data-processing" class="ml-2 text-sm text-neutral-700">
										Acepto el procesamiento de mis datos personales
									</label>
								</div>
								
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="marketing-emails"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.marketingEmails}
									/>
									<label for="marketing-emails" class="ml-2 text-sm text-neutral-700">
										Recibir emails de marketing y promociones
									</label>
								</div>
								
								<div class="flex items-center">
									<input 
										type="checkbox" 
										id="share-with-providers"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.privacySettings.shareWithProviders}
									/>
									<label for="share-with-providers" class="ml-2 text-sm text-neutral-700">
										Compartir información básica con proveedores de servicios
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else if activeTab === 'notifications'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<h2 class="text-xl font-semibold">Configuración de Notificaciones</h2>
					</div>
					<div class="card-body space-y-6">
						<!-- Notification Types -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Tipos de Notificaciones</h3>
							
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<div>
										<label for="booking-reminders" class="text-sm font-medium text-neutral-700">
											Recordatorios de Reservas
										</label>
										<p class="text-xs text-neutral-500">
											Recordatorios antes de tus citas programadas
										</p>
									</div>
									<input 
										type="checkbox" 
										id="booking-reminders"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.bookingReminders}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="promotions" class="text-sm font-medium text-neutral-700">
											Promociones y Ofertas
										</label>
										<p class="text-xs text-neutral-500">
											Ofertas especiales y descuentos
										</p>
									</div>
									<input 
										type="checkbox" 
										id="promotions"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.promotions}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="new-services" class="text-sm font-medium text-neutral-700">
											Nuevos Servicios
										</label>
										<p class="text-xs text-neutral-500">
											Notificaciones sobre nuevos servicios disponibles
										</p>
									</div>
									<input 
										type="checkbox" 
										id="new-services"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.newServices}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="payment-updates" class="text-sm font-medium text-neutral-700">
											Actualizaciones de Pago
										</label>
										<p class="text-xs text-neutral-500">
											Confirmaciones y problemas de pago
										</p>
									</div>
									<input 
										type="checkbox" 
										id="payment-updates"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.paymentUpdates}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="security-alerts" class="text-sm font-medium text-neutral-700">
											Alertas de Seguridad
										</label>
										<p class="text-xs text-neutral-500">
											Notificaciones importantes de seguridad
										</p>
									</div>
									<input 
										type="checkbox" 
										id="security-alerts"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.securityAlerts}
									/>
								</div>
							</div>
						</div>

						<!-- Delivery Methods -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Métodos de Entrega</h3>
							
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<label for="email-notifications" class="text-sm font-medium text-neutral-700">
										Notificaciones por Email
									</label>
									<input 
										type="checkbox" 
										id="email-notifications"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.emailNotifications}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<label for="sms-notifications" class="text-sm font-medium text-neutral-700">
										Notificaciones por SMS
									</label>
									<input 
										type="checkbox" 
										id="sms-notifications"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.smsNotifications}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<label for="push-notifications" class="text-sm font-medium text-neutral-700">
										Notificaciones Push
									</label>
									<input 
										type="checkbox" 
										id="push-notifications"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.pushNotifications}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<label for="whatsapp-notifications" class="text-sm font-medium text-neutral-700">
										WhatsApp Business
									</label>
									<input 
										type="checkbox" 
										id="whatsapp-notifications"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.notificationSettings.whatsappNotifications}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else if activeTab === 'accessibility'}
				<div class="card" transition:fly={{ x: 20, duration: 300 }}>
					<div class="card-header">
						<h2 class="text-xl font-semibold">Configuración de Accesibilidad</h2>
					</div>
					<div class="card-body space-y-6">
						<!-- Visual Settings -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Configuración Visual</h3>
							
							<div>
								<label class="form-label">Tamaño de Fuente</label>
								<select class="form-input" bind:value={profile.accessibility.fontSize}>
									<option value="small">Pequeña</option>
									<option value="medium">Mediana</option>
									<option value="large">Grande</option>
									<option value="xlarge">Extra Grande</option>
								</select>
							</div>
							
							<div class="flex items-center justify-between">
								<div>
									<label for="high-contrast" class="text-sm font-medium text-neutral-700">
										Alto Contraste
									</label>
									<p class="text-xs text-neutral-500">
										Aumenta el contraste para mejor visibilidad
									</p>
								</div>
								<input 
									type="checkbox" 
									id="high-contrast"
									class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
									bind:checked={profile.accessibility.highContrast}
								/>
							</div>
							
							<div class="flex items-center justify-between">
								<div>
									<label for="reduced-motion" class="text-sm font-medium text-neutral-700">
										Movimiento Reducido
									</label>
									<p class="text-xs text-neutral-500">
										Reduce animaciones y efectos de movimiento
									</p>
								</div>
								<input 
									type="checkbox" 
									id="reduced-motion"
									class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
									bind:checked={profile.accessibility.reducedMotion}
								/>
							</div>
						</div>

						<!-- Assistive Technology -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-neutral-800">Tecnología Asistiva</h3>
							
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<div>
										<label for="screen-reader" class="text-sm font-medium text-neutral-700">
											Lector de Pantalla
										</label>
										<p class="text-xs text-neutral-500">
											Optimiza para lectores de pantalla
										</p>
									</div>
									<input 
										type="checkbox" 
										id="screen-reader"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.accessibility.screenReader}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="keyboard-navigation" class="text-sm font-medium text-neutral-700">
											Navegación por Teclado
										</label>
										<p class="text-xs text-neutral-500">
											Mejora la navegación usando solo el teclado
										</p>
									</div>
									<input 
										type="checkbox" 
										id="keyboard-navigation"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.accessibility.keyboardNavigation}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="voice-control" class="text-sm font-medium text-neutral-700">
											Control por Voz
										</label>
										<p class="text-xs text-neutral-500">
											Habilita comandos de voz para navegación
										</p>
									</div>
									<input 
										type="checkbox" 
										id="voice-control"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.accessibility.voiceControl}
									/>
								</div>
								
								<div class="flex items-center justify-between">
									<div>
										<label for="audio-descriptions" class="text-sm font-medium text-neutral-700">
											Descripciones de Audio
										</label>
										<p class="text-xs text-neutral-500">
											Proporciona descripciones de audio para contenido visual
										</p>
									</div>
									<input 
										type="checkbox" 
										id="audio-descriptions"
										class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
										bind:checked={profile.accessibility.audioDescriptions}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Save Button -->
		<div class="flex justify-end">
			<button 
				class="btn btn-primary"
				on:click={saveProfile}
				disabled={saving}
			>
				{saving ? 'Guardando...' : 'Guardar Cambios'}
			</button>
		</div>
	{/if}
</div>

<!-- Address Modal -->
{#if showAddressModal && editingAddress}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-lg font-semibold">
						{editingAddress.id.startsWith('address_') ? 'Agregar' : 'Editar'} Dirección
					</h3>
					<button 
						class="text-neutral-500 hover:text-neutral-700"
						on:click={() => showAddressModal = false}
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<div class="space-y-4">
					<div>
						<label class="form-label">Etiqueta</label>
						<input 
							type="text" 
							class="form-input"
							bind:value={editingAddress.label}
							placeholder="Casa, Trabajo, etc."
						/>
					</div>
					
					<div>
						<label class="form-label">Tipo</label>
						<select class="form-input" bind:value={editingAddress.type}>
							<option value="home">Casa</option>
							<option value="work">Trabajo</option>
							<option value="other">Otro</option>
						</select>
					</div>
					
					<div>
						<label class="form-label">Dirección</label>
						<input 
							type="text" 
							class="form-input"
							bind:value={editingAddress.street}
							placeholder="Calle y número"
						/>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="form-label">Ciudad</label>
							<input 
								type="text" 
								class="form-input"
								bind:value={editingAddress.city}
								placeholder="Ciudad"
							/>
						</div>
						
						<div>
							<label class="form-label">Código Postal</label>
							<input 
								type="text" 
								class="form-input"
								bind:value={editingAddress.postalCode}
								placeholder="1234"
							/>
						</div>
					</div>
					
					<div>
						<label class="form-label">Provincia</label>
						<input 
							type="text" 
							class="form-input"
							bind:value={editingAddress.state}
							placeholder="Buenos Aires"
						/>
					</div>
					
					<div>
						<label class="form-label">Instrucciones Adicionales</label>
						<textarea 
							class="form-input"
							bind:value={editingAddress.instructions}
							placeholder="Piso, departamento, referencias..."
							rows="3"
						></textarea>
					</div>
					
					<div class="flex items-center">
						<input 
							type="checkbox" 
							id="is-default"
							class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
							bind:checked={editingAddress.isDefault}
						/>
						<label for="is-default" class="ml-2 text-sm text-neutral-700">
							Establecer como dirección por defecto
						</label>
					</div>
				</div>
				
				<div class="flex gap-3 mt-6">
					<button 
						class="btn btn-primary flex-1"
						on:click={saveAddress}
					>
						Guardar
					</button>
					<button 
						class="btn btn-secondary"
						on:click={() => showAddressModal = false}
					>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}