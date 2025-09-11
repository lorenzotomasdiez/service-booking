<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, authStore } from '$lib/stores/auth';
	import { Button, Input, ImageUpload, ProgressIndicator, Card, Modal, Loading } from '$lib/components';
	import { profileApi, updateProfileSchema, changePasswordSchema } from '$lib/api/profile';
	import { z } from 'zod';

	let loading = true;
	let saving = false;
	let profileData = {
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
		bio: '',
		dni: '',
		birthDate: '',
		gender: '',
		location: {
			address: '',
			city: '',
			state: '',
			postalCode: '',
			neighborhood: ''
		},
		socialMedia: {
			instagram: '',
			facebook: '',
			whatsapp: ''
		},
		preferences: {
			emailNotifications: true,
			smsNotifications: true,
			pushNotifications: true,
			marketingEmails: false
		}
	};

	let passwordData = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	};

	let errors: Record<string, string> = {};
	let passwordErrors: Record<string, string> = {};
	let successMessage = '';
	let avatarUrl = '';
	let showPasswordModal = false;
	let showDeleteModal = false;
	let profileCompletion = 0;
	let missingFields: string[] = [];

	// Argentina provinces and cities data
	let provinces = [
		{ code: 'BA', name: 'Buenos Aires' },
		{ code: 'CA', name: 'Catamarca' },
		{ code: 'CB', name: 'Córdoba' },
		{ code: 'CC', name: 'Corrientes' },
		{ code: 'CH', name: 'Chaco' },
		{ code: 'CT', name: 'Chubut' },
		{ code: 'ER', name: 'Entre Ríos' },
		{ code: 'FO', name: 'Formosa' },
		{ code: 'JY', name: 'Jujuy' },
		{ code: 'LP', name: 'La Pampa' },
		{ code: 'LR', name: 'La Rioja' },
		{ code: 'MZ', name: 'Mendoza' },
		{ code: 'MI', name: 'Misiones' },
		{ code: 'NQ', name: 'Neuquén' },
		{ code: 'RN', name: 'Río Negro' },
		{ code: 'SA', name: 'Salta' },
		{ code: 'SJ', name: 'San Juan' },
		{ code: 'SL', name: 'San Luis' },
		{ code: 'SC', name: 'Santa Cruz' },
		{ code: 'SF', name: 'Santa Fe' },
		{ code: 'SE', name: 'Santiago del Estero' },
		{ code: 'TF', name: 'Tierra del Fuego' },
		{ code: 'TM', name: 'Tucumán' }
	];

	onMount(async () => {
		await loadProfile();
	});

	async function loadProfile() {
		try {
			// Load current user data
			if ($user) {
				profileData = {
					firstName: $user.firstName || '',
					lastName: $user.lastName || '',
					phone: $user.phone || '',
					email: $user.email || '',
					bio: $user.profile?.bio || '',
					dni: '',
					birthDate: '',
					gender: '',
					location: {
						address: $user.profile?.location?.address || '',
						city: $user.profile?.location?.city || '',
						state: $user.profile?.location?.state || '',
						postalCode: $user.profile?.location?.postalCode || '',
						neighborhood: $user.profile?.location?.neighborhood || ''
					},
					socialMedia: {
						instagram: $user.profile?.socialMedia?.instagram || '',
						facebook: $user.profile?.socialMedia?.facebook || '',
						whatsapp: $user.profile?.socialMedia?.whatsapp || ''
					},
					preferences: {
						emailNotifications: true,
						smsNotifications: true,
						pushNotifications: true,
						marketingEmails: false
					}
				};
				avatarUrl = $user.avatar || '';
			}

			// Calculate profile completion
			calculateProfileCompletion();
			
		} catch (error) {
			console.error('Error loading profile:', error);
		} finally {
			loading = false;
		}
	}

	function calculateProfileCompletion() {
		const requiredFields = [
			profileData.firstName,
			profileData.lastName,
			profileData.phone,
			profileData.email,
			profileData.bio,
			profileData.location.address,
			profileData.location.city,
			profileData.location.state,
			avatarUrl
		];

		const completedFields = requiredFields.filter(field => field && field.length > 0);
		profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);

		missingFields = [];
		if (!profileData.firstName) missingFields.push('Nombre');
		if (!profileData.lastName) missingFields.push('Apellido');
		if (!profileData.phone) missingFields.push('Teléfono');
		if (!profileData.bio) missingFields.push('Biografía');
		if (!profileData.location.address) missingFields.push('Dirección');
		if (!profileData.location.city) missingFields.push('Ciudad');
		if (!profileData.location.state) missingFields.push('Provincia');
		if (!avatarUrl) missingFields.push('Foto de perfil');
	}

	async function handleProfileSubmit() {
		errors = {};
		successMessage = '';
		saving = true;

		try {
			// Validate profile data
			const validatedData = updateProfileSchema.parse(profileData);
			
			// Update profile
			const response = await profileApi.updateProfile(validatedData);
			
			if (response.success && response.data) {
				// Update auth store with new user data
				authStore.updateUser(response.data);
				successMessage = 'Perfil actualizado exitosamente';
				calculateProfileCompletion();
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				error.issues.forEach((issue) => {
					if (issue.path.length > 0) {
						const fieldPath = issue.path.join('.');
						errors[fieldPath] = issue.message;
					}
				});
			} else {
				errors.general = 'Error al actualizar el perfil';
			}
		} finally {
			saving = false;
		}
	}

	async function handlePasswordChange() {
		passwordErrors = {};
		saving = true;

		try {
			// Validate password data
			const validatedData = changePasswordSchema.parse(passwordData);
			
			// Change password
			const response = await profileApi.changePassword(validatedData);
			
			if (response.success) {
				showPasswordModal = false;
				successMessage = 'Contraseña cambiada exitosamente';
				passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				error.issues.forEach((issue) => {
					if (issue.path.length > 0) {
						passwordErrors[issue.path[0] as string] = issue.message;
					}
				});
			} else {
				passwordErrors.general = 'Error al cambiar la contraseña';
			}
		} finally {
			saving = false;
		}
	}

	async function handleAvatarUpload(event: CustomEvent) {
		const { file } = event.detail;
		
		try {
			const response = await profileApi.uploadAvatar(file);
			if (response.success && response.data) {
				avatarUrl = response.data.avatarUrl;
				// Update user in auth store
				authStore.updateUser({ avatar: avatarUrl });
				calculateProfileCompletion();
				successMessage = 'Foto de perfil actualizada';
			}
		} catch (error) {
			errors.avatar = 'Error al subir la imagen';
		}
	}

	async function handleDeleteAccount() {
		try {
			await profileApi.deleteAccount();
			await authStore.logout();
			goto('/');
		} catch (error) {
			errors.general = 'Error al eliminar la cuenta';
		}
	}

	// Clear success message after 5 seconds
	$: if (successMessage) {
		setTimeout(() => {
			successMessage = '';
		}, 5000);
	}

	// Reactive updates for profile completion
	$: {
		calculateProfileCompletion();
	}
</script>

<svelte:head>
	<title>Mi Perfil - BarberPro</title>
	<meta name="description" content="Gestiona tu perfil y configuración de cuenta" />
</svelte:head>

<div class="container-responsive max-w-4xl">
	{#if loading}
		<div class="space-y-6">
			<div class="skeleton skeleton-text" style="width: 300px; height: 32px;"></div>
			<Card>
				<div class="space-y-4">
					{#each Array(6) as _}
						<div class="skeleton skeleton-text"></div>
					{/each}
				</div>
			</Card>
		</div>
	{:else}
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
			<div>
				<h1 class="text-3xl font-bold text-neutral-800">Mi Perfil</h1>
				<p class="mt-1 text-neutral-600">
					Administra tu información personal y configuración
				</p>
			</div>
			
			<!-- Quick Actions -->
			<div class="mt-4 sm:mt-0 flex space-x-3">
				<Button
					variant="secondary"
					on:click={() => showPasswordModal = true}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-11.83 1.66m0-3.32A6 6 0 0117 9m-6 4a3 3 0 105.905-.75" />
					</svg>
					Cambiar Contraseña
				</Button>
				
				<Button
					variant="primary"
					on:click={handleProfileSubmit}
					loading={saving}
				>
					Guardar Cambios
				</Button>
			</div>
		</div>

		<!-- Success Message -->
		{#if successMessage}
			<div class="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<div class="ml-3">
						<p class="text-sm text-success-700">{successMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- General Error -->
		{#if errors.general}
			<div class="mb-6 bg-error-50 border border-error-200 rounded-lg p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="ml-3">
						<p class="text-sm text-error-700">{errors.general}</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Profile Completion Sidebar -->
			<div class="lg:col-span-1">
				<Card className="sticky top-6">
					<h3 class="text-lg font-semibold text-neutral-800 mb-4">
						Completar Perfil
					</h3>
					
					<ProgressIndicator
						percentage={profileCompletion}
						variant={profileCompletion >= 100 ? 'success' : 'primary'}
						className="mb-4"
					/>

					{#if missingFields.length > 0}
						<div class="space-y-2">
							<p class="text-sm font-medium text-neutral-700">
								Campos pendientes:
							</p>
							<ul class="text-sm text-neutral-600 space-y-1">
								{#each missingFields as field}
									<li class="flex items-center">
										<svg class="w-3 h-3 text-warning-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 002 0V7zm-1 4a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
										</svg>
										{field}
									</li>
								{/each}
							</ul>
						</div>
					{:else}
						<div class="text-center py-4">
							<svg class="w-12 h-12 text-success-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p class="text-sm font-medium text-success-700">
								¡Perfil completo!
							</p>
							<p class="text-xs text-success-600">
								Tu perfil está 100% completado
							</p>
						</div>
					{/if}

					<!-- Account Actions -->
					<div class="mt-6 pt-6 border-t border-neutral-200 space-y-3">
						<h4 class="text-sm font-semibold text-neutral-700">
							Configuración de Cuenta
						</h4>
						
						<Button
							variant="ghost"
							size="sm"
							fullWidth
							className="justify-start"
							on:click={() => showPasswordModal = true}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-11.83 1.66m0-3.32A6 6 0 0117 9m-6 4a3 3 0 105.905-.75" />
							</svg>
							Cambiar Contraseña
						</Button>
						
						<Button
							variant="danger"
							size="sm"
							fullWidth
							className="justify-start"
							on:click={() => showDeleteModal = true}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Eliminar Cuenta
						</Button>
					</div>
				</Card>
			</div>

			<!-- Main Profile Form -->
			<div class="lg:col-span-2 space-y-8">
				<!-- Photo Section -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-800 mb-4">
						Foto de Perfil
					</h3>
					
					<ImageUpload
						bind:value={avatarUrl}
						label=""
						placeholder="Sube tu foto de perfil"
						circular={true}
						aspectRatio="square"
						maxSize={5 * 1024 * 1024}
						on:upload={handleAvatarUpload}
						error={errors.avatar}
						hint="Tamaño recomendado: 400x400px. Máximo 5MB."
					/>
				</Card>

				<!-- Personal Information -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-800 mb-6">
						Información Personal
					</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Input
							label="Nombre"
							bind:value={profileData.firstName}
							placeholder="Tu nombre"
							required
							error={errors.firstName}
						/>
						
						<Input
							label="Apellido"
							bind:value={profileData.lastName}
							placeholder="Tu apellido"
							required
							error={errors.lastName}
						/>
						
						<Input
							label="DNI"
							bind:value={profileData.dni}
							placeholder="12.345.678"
							format="dni"
							error={errors.dni}
							hint="Solo números, sin puntos"
						/>
						
						<Input
							label="Fecha de Nacimiento"
							type="date"
							bind:value={profileData.birthDate}
							error={errors.birthDate}
						/>
					</div>

					<div class="mt-6">
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Género
						</label>
						<select
							bind:value={profileData.gender}
							class="form-input"
						>
							<option value="">Seleccionar...</option>
							<option value="masculino">Masculino</option>
							<option value="femenino">Femenino</option>
							<option value="otro">Otro</option>
							<option value="prefiero_no_decir">Prefiero no decir</option>
						</select>
					</div>

					<div class="mt-6">
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Biografía
						</label>
						<textarea
							bind:value={profileData.bio}
							placeholder="Cuéntanos un poco sobre ti..."
							class="form-input"
							rows="4"
							maxlength="500"
						></textarea>
						<p class="mt-1 text-xs text-neutral-500">
							{profileData.bio.length}/500 caracteres
						</p>
						{#if errors.bio}
							<p class="mt-1 text-sm text-error-600">{errors.bio}</p>
						{/if}
					</div>
				</Card>

				<!-- Contact Information -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-800 mb-6">
						Información de Contacto
					</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Input
							label="Correo Electrónico"
							type="email"
							bind:value={profileData.email}
							placeholder="tu@email.com"
							readonly
							hint="Para cambiar el email, contacta soporte"
						/>
						
						<Input
							label="Teléfono"
							type="tel"
							bind:value={profileData.phone}
							placeholder="+54 9 11 1234-5678"
							format="phone"
							required
							error={errors.phone}
						/>
					</div>
				</Card>

				<!-- Location -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-800 mb-6">
						Ubicación
					</h3>
					
					<div class="space-y-6">
						<Input
							label="Dirección"
							bind:value={profileData.location.address}
							placeholder="Calle y número"
							error={errors['location.address']}
						/>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Provincia
								</label>
								<select
									bind:value={profileData.location.state}
									class="form-input"
								>
									<option value="">Seleccionar provincia...</option>
									{#each provinces as province}
										<option value={province.code}>{province.name}</option>
									{/each}
								</select>
								{#if errors['location.state']}
									<p class="mt-1 text-sm text-error-600">{errors['location.state']}</p>
								{/if}
							</div>
							
							<Input
								label="Ciudad"
								bind:value={profileData.location.city}
								placeholder="Tu ciudad"
								error={errors['location.city']}
							/>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Input
								label="Código Postal"
								bind:value={profileData.location.postalCode}
								placeholder="1234"
								maxlength={4}
								error={errors['location.postalCode']}
							/>
							
							<Input
								label="Barrio"
								bind:value={profileData.location.neighborhood}
								placeholder="Tu barrio"
								error={errors['location.neighborhood']}
							/>
						</div>
					</div>
				</Card>

				<!-- Social Media -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-800 mb-6">
						Redes Sociales
					</h3>
					
					<div class="space-y-6">
						<Input
							label="Instagram"
							bind:value={profileData.socialMedia.instagram}
							placeholder="@tuusuario"
							error={errors['socialMedia.instagram']}
						/>
						
						<Input
							label="Facebook"
							bind:value={profileData.socialMedia.facebook}
							placeholder="https://facebook.com/tuusuario"
							error={errors['socialMedia.facebook']}
						/>
						
						<Input
							label="WhatsApp"
							type="tel"
							bind:value={profileData.socialMedia.whatsapp}
							placeholder="+54 9 11 1234-5678"
							format="phone"
							error={errors['socialMedia.whatsapp']}
						/>
					</div>
				</Card>

				<!-- Preferences -->
				<Card>
					<h3 class="text-lg font-semibold text-neutral-800 mb-6">
						Preferencias de Notificaciones
					</h3>
					
					<div class="space-y-4">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={profileData.preferences.emailNotifications}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-sm text-neutral-700">
								Recibir notificaciones por email
							</span>
						</label>
						
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={profileData.preferences.smsNotifications}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-sm text-neutral-700">
								Recibir notificaciones por SMS
							</span>
						</label>
						
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={profileData.preferences.pushNotifications}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-sm text-neutral-700">
								Recibir notificaciones push
							</span>
						</label>
						
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={profileData.preferences.marketingEmails}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-sm text-neutral-700">
								Recibir emails promocionales y ofertas especiales
							</span>
						</label>
					</div>
				</Card>

				<!-- Save Button -->
				<div class="flex justify-end">
					<Button
						variant="primary"
						size="lg"
						on:click={handleProfileSubmit}
						loading={saving}
					>
						{saving ? 'Guardando...' : 'Guardar Cambios'}
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Change Password Modal -->
<Modal bind:open={showPasswordModal} size="md">
	<div class="p-6">
		<h3 class="text-lg font-semibold text-neutral-800 mb-4">
			Cambiar Contraseña
		</h3>
		
		<form on:submit|preventDefault={handlePasswordChange} class="space-y-4">
			<Input
				label="Contraseña Actual"
				type="password"
				bind:value={passwordData.currentPassword}
				placeholder="Tu contraseña actual"
				required
				error={passwordErrors.currentPassword}
			/>
			
			<Input
				label="Nueva Contraseña"
				type="password"
				bind:value={passwordData.newPassword}
				placeholder="Mínimo 8 caracteres"
				required
				error={passwordErrors.newPassword}
			/>
			
			<Input
				label="Confirmar Nueva Contraseña"
				type="password"
				bind:value={passwordData.confirmPassword}
				placeholder="Repite la nueva contraseña"
				required
				error={passwordErrors.confirmPassword}
			/>

			{#if passwordErrors.general}
				<div class="bg-error-50 border border-error-200 rounded-lg p-3">
					<p class="text-sm text-error-700">{passwordErrors.general}</p>
				</div>
			{/if}

			<div class="flex space-x-3 pt-4">
				<Button
					variant="secondary"
					fullWidth
					on:click={() => showPasswordModal = false}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					variant="primary"
					fullWidth
					loading={saving}
				>
					{saving ? 'Cambiando...' : 'Cambiar Contraseña'}
				</Button>
			</div>
		</form>
	</div>
</Modal>

<!-- Delete Account Modal -->
<Modal bind:open={showDeleteModal} size="md">
	<div class="p-6">
		<h3 class="text-lg font-semibold text-error-800 mb-4">
			Eliminar Cuenta
		</h3>
		
		<div class="space-y-4">
			<div class="bg-error-50 border border-error-200 rounded-lg p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="ml-3">
						<h4 class="text-sm font-medium text-error-800">
							¡Atención! Esta acción es irreversible
						</h4>
						<p class="text-sm text-error-700 mt-1">
							Se eliminarán todos tus datos, reservas y configuración de forma permanente.
						</p>
					</div>
				</div>
			</div>

			<p class="text-sm text-neutral-600">
				¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.
			</p>

			<div class="flex space-x-3 pt-4">
				<Button
					variant="secondary"
					fullWidth
					on:click={() => showDeleteModal = false}
				>
					Cancelar
				</Button>
				<Button
					variant="danger"
					fullWidth
					on:click={handleDeleteAccount}
				>
					Sí, Eliminar Cuenta
				</Button>
			</div>
		</div>
	</div>
</Modal>