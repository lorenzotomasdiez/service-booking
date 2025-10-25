<script lang="ts">
/**
 * T045: Google OAuth Callback Page
 * T059: Show welcome modal for new OAuth users
 * T063: Implement role-based redirect logic
 * Handles OAuth callback from Google, exchanges tokens, and redirects user
 */

import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { authStore, firstLogin, user } from '$lib/stores/auth';
import { apiClient } from '$lib/api/client';
import WelcomeModal from '$lib/components/WelcomeModal.svelte';

let loading = true;
let error: string | null = null;
let success = false;
let showWelcomeModal = false; // T059: Control welcome modal visibility
let userName = '';
let userRole: 'CLIENT' | 'PROVIDER' = 'CLIENT';
let redirectUrl = '/dashboard';

onMount(async () => {
	await handleOAuthCallback();
});

async function handleOAuthCallback() {
	try {
		// Get query parameters from URL
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const state = params.get('state');
		const errorParam = params.get('error');
		const errorDescription = params.get('error_description');

		// Handle OAuth errors from Google
		if (errorParam) {
			if (errorParam === 'access_denied') {
				error = 'Autenticación cancelada. Puedes intentar nuevamente.';
			} else {
				error = `Error de autenticación: ${errorDescription || errorParam}`;
			}
			loading = false;

			// Redirect to login after 3 seconds
			setTimeout(() => {
				goto('/login');
			}, 3000);
			return;
		}

		// Validate required parameters
		if (!code || !state) {
			error = 'Parámetros de autenticación inválidos';
			loading = false;

			setTimeout(() => {
				goto('/login');
			}, 3000);
			return;
		}

		// Exchange authorization code for tokens
		const response = await apiClient.get('/auth/oauth/google/callback', {
			params: { code, state }
		});

		if (!response.success || !response.data) {
			throw new Error(response.error?.message || 'Error al autenticar con Google');
		}

		const { user: userData, accessToken, refreshToken, isNewUser, returnTo, expiresIn } = response.data;

		// T060: Store OAuth user in auth store
		authStore.setOAuthUser({
			user: userData,
			accessToken,
			refreshToken,
			expiresIn: expiresIn || 3600,
			isNewUser: isNewUser || false
		});

		success = true;
		loading = false;

		// T059: Show welcome modal for NEW users only
		if (isNewUser) {
			userName = userData.name || '';
			userRole = userData.role || 'CLIENT';
			showWelcomeModal = true;

			// Don't auto-redirect for new users - let them interact with welcome modal
			console.log('¡Bienvenido! Tu cuenta ha sido creada exitosamente.');
		} else {
			// T063: Existing users - redirect immediately based on role
			console.log('¡Bienvenido de vuelta! Has iniciado sesión exitosamente.');

			const roleBasedRedirect = userData.role === 'PROVIDER'
				? '/dashboard/provider'
				: '/dashboard/client';

			redirectUrl = returnTo || roleBasedRedirect;

			setTimeout(() => {
				goto(redirectUrl);
			}, 1500);
		}

	} catch (err: any) {
		console.error('OAuth callback error:', err);

		// Parse error message
		if (err.message?.includes('inválido')) {
			error = 'Token de seguridad inválido. Por favor, inicia el proceso nuevamente.';
		} else if (err.message?.includes('expirado')) {
			error = 'La sesión de autenticación ha expirado. Por favor, intenta nuevamente.';
		} else if (err.message?.includes('vinculada')) {
			error = 'Esta cuenta de Google ya está vinculada a otro usuario.';
		} else {
			error = err.message || 'Error al completar la autenticación con Google';
		}

		loading = false;

		// Redirect to login after showing error
		setTimeout(() => {
			goto('/login');
		}, 4000);
	}
}
</script>

<svelte:head>
	<title>Autenticando con Google...</title>
</svelte:head>

<div class="callback-container">
	<div class="callback-card">
		{#if loading}
			<!-- Loading state -->
			<div class="loading-state">
				<div class="spinner-container">
					<svg class="spinner" viewBox="0 0 50 50">
						<circle
							class="path"
							cx="25"
							cy="25"
							r="20"
							fill="none"
							stroke-width="4"
						></circle>
					</svg>
				</div>
				<h1>Autenticando con Google</h1>
				<p>Por favor espera mientras completamos tu inicio de sesión...</p>
			</div>
		{:else if success}
			<!-- Success state (only for existing users, new users see modal) -->
			<div class="success-state">
				<svg class="checkmark" viewBox="0 0 52 52">
					<circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
					<path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
				</svg>
				<h1>¡Autenticación exitosa!</h1>
				<p>Redirigiendo...</p>
			</div>
		{:else if error}
			<!-- Error state -->
			<div class="error-state">
				<svg class="error-icon" viewBox="0 0 52 52">
					<circle class="error-circle" cx="26" cy="26" r="25" fill="none"/>
					<path class="error-cross" fill="none" d="M16 16 36 36 M36 16 16 36"/>
				</svg>
				<h1>Error de autenticación</h1>
				<p class="error-message">{error}</p>
				<p class="redirect-message">Redirigiendo a la página de inicio de sesión...</p>
			</div>
		{/if}
	</div>
</div>

<!-- T059: Welcome Modal for new OAuth users -->
<WelcomeModal
	bind:open={showWelcomeModal}
	userName={userName}
	userRole={userRole}
	on:continue={() => {
		// T060: Clear firstLogin flag after modal is dismissed
		authStore.clearFirstLogin();

		// T063: Role-based redirect
		const roleBasedRedirect = userRole === 'PROVIDER'
			? '/dashboard/provider'
			: '/dashboard/client';
		goto(roleBasedRedirect);
	}}
	on:profile-click={() => {
		// T060: Clear firstLogin flag
		authStore.clearFirstLogin();

		// Profile page redirect is handled by WelcomeModal component
	}}
	on:close={() => {
		// T060: Clear firstLogin flag
		authStore.clearFirstLogin();
	}}
/>

<style>
.callback-container {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-card {
	background: white;
	border-radius: 1rem;
	padding: 3rem 2rem;
	max-width: 28rem;
	width: 100%;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
				0 10px 10px -5px rgba(0, 0, 0, 0.04);
	text-align: center;
}

/* Loading State */
.loading-state h1 {
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

.loading-state p {
	color: #6b7280;
	font-size: 0.875rem;
}

.spinner-container {
	display: flex;
	justify-content: center;
	margin-bottom: 1rem;
}

.spinner {
	width: 60px;
	height: 60px;
	animation: rotate 2s linear infinite;
}

.spinner .path {
	stroke: #667eea;
	stroke-linecap: round;
	animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
	100% {
		transform: rotate(360deg);
	}
}

@keyframes dash {
	0% {
		stroke-dasharray: 1, 150;
		stroke-dashoffset: 0;
	}
	50% {
		stroke-dasharray: 90, 150;
		stroke-dashoffset: -35;
	}
	100% {
		stroke-dasharray: 90, 150;
		stroke-dashoffset: -124;
	}
}

/* Success State */
.success-state h1 {
	font-size: 1.5rem;
	font-weight: 600;
	color: #059669;
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

.success-state p {
	color: #6b7280;
	font-size: 0.875rem;
}

.checkmark {
	width: 60px;
	height: 60px;
	margin: 0 auto 1rem;
}

.checkmark-circle {
	stroke: #059669;
	stroke-width: 2;
	stroke-miterlimit: 10;
	animation: fill 0.4s ease-in-out 0.4s forwards,
				scale 0.3s ease-in-out 0.9s both;
}

.checkmark-check {
	stroke: #059669;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-dasharray: 48;
	stroke-dashoffset: 48;
	animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
	100% {
		stroke-dashoffset: 0;
	}
}

@keyframes fill {
	100% {
		box-shadow: inset 0 0 0 30px #059669;
	}
}

@keyframes scale {
	0%, 100% {
		transform: none;
	}
	50% {
		transform: scale3d(1.1, 1.1, 1);
	}
}

/* Error State */
.error-state h1 {
	font-size: 1.5rem;
	font-weight: 600;
	color: #dc2626;
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

.error-message {
	color: #374151;
	font-size: 0.875rem;
	margin-bottom: 1rem;
	font-weight: 500;
}

.redirect-message {
	color: #6b7280;
	font-size: 0.75rem;
}

.error-icon {
	width: 60px;
	height: 60px;
	margin: 0 auto 1rem;
}

.error-circle {
	stroke: #dc2626;
	stroke-width: 2;
	stroke-miterlimit: 10;
	animation: fill-error 0.4s ease-in-out 0.4s forwards,
				scale 0.3s ease-in-out 0.9s both;
}

.error-cross {
	stroke: #dc2626;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-dasharray: 30;
	stroke-dashoffset: 30;
	animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes fill-error {
	100% {
		box-shadow: inset 0 0 0 30px #dc2626;
	}
}

/* Mobile responsiveness */
@media (max-width: 640px) {
	.callback-card {
		padding: 2rem 1.5rem;
	}

	.loading-state h1,
	.success-state h1,
	.error-state h1 {
		font-size: 1.25rem;
	}
}
</style>
