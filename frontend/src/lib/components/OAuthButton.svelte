<script lang="ts">
/**
 * T044: OAuthButton Component
 * Reusable Google OAuth button with icon and redirect logic
 */

import { authApi } from '$lib/api/auth';

export let role: 'CLIENT' | 'PROVIDER' = 'CLIENT';
export let isRegistration = true;
export let returnTo: string | undefined = undefined;
export let disabled = false;

let loading = false;
let error: string | null = null;

async function handleGoogleOAuth() {
	loading = true;
	error = null;

	try {
		// Call API to initiate OAuth flow
		const response = await authApi.initiateGoogleOAuth({
			role,
			isRegistration,
			returnTo
		});

		if (response.success && response.data) {
			// Redirect to Google OAuth URL
			window.location.href = response.data.redirectUrl;
		} else {
			throw new Error(response.error?.message || 'Error al iniciar autenticación con Google');
		}
	} catch (err: any) {
		console.error('OAuth initiation error:', err);
		error = err.message || 'Error al conectar con Google';
		loading = false;
	}
}
</script>

<button
	type="button"
	on:click={handleGoogleOAuth}
	disabled={disabled || loading}
	class="oauth-button"
	class:loading
	class:disabled={disabled || loading}
>
	{#if loading}
		<svg class="spinner" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		<span>Conectando...</span>
	{:else}
		<svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
			<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
			<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
			<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
			<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
		</svg>
		<span>Continuar con Google</span>
	{/if}
</button>

{#if error}
	<p class="error-message">{error}</p>
{/if}

<style>
.oauth-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.75rem 1.5rem;
	background: white;
	border: 1px solid #dadce0;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #3c4043;
	cursor: pointer;
	transition: all 0.2s ease;
}

.oauth-button:hover:not(.disabled) {
	background: #f8f9fa;
	border-color: #d2d4d6;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.oauth-button:active:not(.disabled) {
	background: #f1f3f4;
	transform: translateY(1px);
}

.oauth-button.disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.oauth-button.loading {
	pointer-events: none;
}

.google-icon {
	flex-shrink: 0;
}

.spinner {
	width: 20px;
	height: 20px;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.error-message {
	margin-top: 0.5rem;
	font-size: 0.875rem;
	color: #dc2626;
	text-align: center;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
	.oauth-button {
		font-size: 0.8125rem;
		padding: 0.625rem 1.25rem;
	}
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
	.oauth-button {
		background: #2d2d2d;
		border-color: #444;
		color: #e8eaed;
	}

	.oauth-button:hover:not(.disabled) {
		background: #3a3a3a;
		border-color: #555;
	}

	.oauth-button:active:not(.disabled) {
		background: #424242;
	}
}
</style>
