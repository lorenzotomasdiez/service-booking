<script lang="ts">
/**
 * T058: Welcome Modal Component
 * Shows welcome message for new users with profile completion prompt
 */

import { createEventDispatcher } from 'svelte';
import { goto } from '$app/navigation';
import { fade, scale } from 'svelte/transition';
import { user } from '$lib/stores/auth';

export let open = false;
export let userName: string = '';
export let userRole: 'CLIENT' | 'PROVIDER' = 'CLIENT';

const dispatch = createEventDispatcher();

// Reactive properties
$: displayName = userName || ($user?.name.split(' ')[0]) || 'usuario';
$: isProvider = userRole === 'PROVIDER';
$: profileUrl = isProvider ? '/dashboard/provider/profile' : '/dashboard/client/profile';
$: dashboardUrl = isProvider ? '/dashboard/provider' : '/dashboard/client';

function handleProfileCompletion() {
	open = false;
	dispatch('profile-click');
	goto(profileUrl);
}

function handleContinueToDashboard() {
	open = false;
	dispatch('continue');
	goto(dashboardUrl);
}

function handleClose() {
	open = false;
	dispatch('close');
}

// Prevent background scrolling when modal is open
$: if (open) {
	document.body.style.overflow = 'hidden';
} else {
	document.body.style.overflow = '';
}
</script>

{#if open}
	<!-- Modal backdrop -->
	<div
		class="modal-backdrop"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		transition:fade={{ duration: 200 }}
		data-testid="welcome-modal-backdrop"
		role="presentation"
	></div>

	<!-- Modal content -->
	<div
		class="modal-container"
		transition:scale={{ duration: 300, start: 0.9 }}
		data-testid="welcome-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="welcome-modal-title"
	>
		<div class="modal-content">
			<!-- Celebration icon -->
			<div class="celebration-icon">
				<svg class="icon-svg" viewBox="0 0 52 52" aria-hidden="true">
					<circle class="celebration-circle" cx="26" cy="26" r="25" fill="none"/>
					<path
						class="celebration-check"
						fill="none"
						d="M14.1 27.2l7.1 7.2 16.7-16.8"
					/>
				</svg>
			</div>

			<!-- Welcome message -->
			<h1 id="welcome-modal-title" class="welcome-title">
				¡Bienvenido{#if displayName}, {displayName}{/if}!
			</h1>

			<p class="welcome-message">
				{#if isProvider}
					Tu cuenta profesional ha sido creada exitosamente. Ahora puedes configurar tus servicios, horarios y comenzar a recibir reservas.
				{:else}
					Tu cuenta ha sido creada exitosamente. Ya puedes explorar profesionales, reservar servicios y gestionar tus citas.
				{/if}
			</p>

			<!-- Profile completion section -->
			<div class="profile-completion-section">
				<div class="completion-icon">
					<svg
						class="w-5 h-5 text-brand"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
				</div>
				<div class="completion-text">
					<h3 class="completion-title">Completa tu perfil</h3>
					<p class="completion-description">
						{#if isProvider}
							Agrega tu información profesional, servicios y horarios para que los clientes puedan encontrarte.
						{:else}
							Agrega tu foto, preferencias y detalles de contacto para una mejor experiencia.
						{/if}
					</p>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="button-group">
				<button
					class="btn-profile"
					on:click={handleProfileCompletion}
					data-testid="profile-completion-cta"
					aria-label="Ir a completar perfil"
				>
					<svg
						class="btn-icon"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
					Completar Perfil
				</button>

				<button
					class="btn-continue"
					on:click={handleContinueToDashboard}
					data-testid="continue-dashboard"
					aria-label="Continuar al dashboard"
				>
					Continuar al Dashboard
					<svg
						class="btn-icon-right"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7l5 5m0 0l-5 5m5-5H6"
						/>
					</svg>
				</button>
			</div>

			<!-- Close button -->
			<button
				class="close-button"
				on:click={handleClose}
				aria-label="Cerrar modal"
			>
				<svg
					class="close-icon"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
/* Modal backdrop */
.modal-backdrop {
	position: fixed;
	inset: 0;
	background-color: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	z-index: 9998;
}

/* Modal container */
.modal-container {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
}

/* Modal content */
.modal-content {
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	max-width: 28rem;
	width: 100%;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
				0 10px 10px -5px rgba(0, 0, 0, 0.04);
	position: relative;
	text-align: center;
}

/* Celebration icon */
.celebration-icon {
	display: flex;
	justify-content: center;
	margin-bottom: 1.5rem;
}

.icon-svg {
	width: 80px;
	height: 80px;
}

.celebration-circle {
	stroke: #10b981;
	stroke-width: 2;
	stroke-miterlimit: 10;
	animation: fill-circle 0.4s ease-in-out 0.4s forwards,
				scale-circle 0.3s ease-in-out 0.9s both;
}

.celebration-check {
	stroke: #10b981;
	stroke-width: 3;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-dasharray: 48;
	stroke-dashoffset: 48;
	animation: stroke-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke-check {
	100% {
		stroke-dashoffset: 0;
	}
}

@keyframes fill-circle {
	100% {
		box-shadow: inset 0 0 0 30px #10b981;
	}
}

@keyframes scale-circle {
	0%, 100% {
		transform: none;
	}
	50% {
		transform: scale3d(1.1, 1.1, 1);
	}
}

/* Welcome title */
.welcome-title {
	font-size: 1.875rem;
	font-weight: 700;
	color: #111827;
	margin-bottom: 1rem;
	line-height: 1.2;
}

/* Welcome message */
.welcome-message {
	color: #6b7280;
	font-size: 1rem;
	line-height: 1.5;
	margin-bottom: 2rem;
}

/* Profile completion section */
.profile-completion-section {
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #bae6fd;
	border-radius: 0.75rem;
	padding: 1.25rem;
	margin-bottom: 2rem;
	text-align: left;
}

.completion-icon {
	flex-shrink: 0;
	width: 2.5rem;
	height: 2.5rem;
	background: white;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.completion-text {
	flex: 1;
}

.completion-title {
	font-size: 0.875rem;
	font-weight: 600;
	color: #0c4a6e;
	margin-bottom: 0.25rem;
}

.completion-description {
	font-size: 0.75rem;
	color: #475569;
	line-height: 1.4;
}

/* Button group */
.button-group {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

/* Profile button */
.btn-profile {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	font-weight: 600;
	font-size: 0.9375rem;
	padding: 0.875rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
}

.btn-profile:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 12px -1px rgba(102, 126, 234, 0.4);
}

.btn-profile:active {
	transform: translateY(0);
}

.btn-profile:focus {
	outline: none;
	box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

/* Continue button */
.btn-continue {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	background: white;
	color: #4b5563;
	font-weight: 500;
	font-size: 0.9375rem;
	padding: 0.875rem 1.5rem;
	border-radius: 0.5rem;
	border: 1px solid #d1d5db;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-continue:hover {
	background: #f9fafb;
	border-color: #9ca3af;
}

.btn-continue:focus {
	outline: none;
	box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.2);
}

/* Button icons */
.btn-icon,
.btn-icon-right {
	width: 1.25rem;
	height: 1.25rem;
}

/* Close button */
.close-button {
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	color: #9ca3af;
	transition: color 0.2s ease;
}

.close-button:hover {
	color: #4b5563;
}

.close-button:focus {
	outline: none;
	color: #1f2937;
}

.close-icon {
	width: 1.5rem;
	height: 1.5rem;
}

/* Responsive design */
@media (max-width: 640px) {
	.modal-content {
		padding: 1.5rem;
	}

	.welcome-title {
		font-size: 1.5rem;
	}

	.welcome-message {
		font-size: 0.9375rem;
	}

	.profile-completion-section {
		padding: 1rem;
	}

	.btn-profile,
	.btn-continue {
		font-size: 0.875rem;
		padding: 0.75rem 1.25rem;
	}
}

/* Accessibility - high contrast mode */
@media (prefers-contrast: high) {
	.modal-content {
		border: 2px solid #000;
	}

	.btn-profile,
	.btn-continue {
		border: 2px solid currentColor;
	}
}

/* Accessibility - reduced motion */
@media (prefers-reduced-motion: reduce) {
	.celebration-circle,
	.celebration-check {
		animation: none;
	}

	.btn-profile:hover,
	.btn-continue:hover {
		transform: none;
	}
}
</style>
