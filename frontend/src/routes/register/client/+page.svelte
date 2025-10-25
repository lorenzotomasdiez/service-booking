<script lang="ts">
	import { onMount } from 'svelte';
	import RegistrationForm from '$lib/components/RegistrationForm.svelte';
	import { uxAnalytics } from '$lib/services/ux-analytics';

	// T069: Track client registration page visit
	onMount(() => {
		uxAnalytics.trackExternalEvent('registration_page_visit', {
			registrationType: 'client',
			url: '/register/client',
			source: 'direct_link'
		});
	});
</script>

<svelte:head>
	<title>Regístrate como Cliente - BarberPro</title>
	<meta name="description" content="Regístrate como cliente en BarberPro y accede a los mejores servicios de barbería en Argentina. Reserva fácil y rápido." />
	<meta property="og:title" content="Regístrate como Cliente - BarberPro" />
	<meta property="og:description" content="Regístrate como cliente en BarberPro y accede a los mejores servicios de barbería en Argentina. Reserva fácil y rápido." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Regístrate como Cliente - BarberPro" />
	<meta name="twitter:description" content="Regístrate como cliente en BarberPro y accede a los mejores servicios de barbería en Argentina. Reserva fácil y rápido." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="mx-auto w-16 h-16 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
				B
			</div>
			<h2 class="text-3xl font-bold text-neutral-800">
				Crear Cuenta de Cliente
			</h2>
			<p class="mt-2 text-sm text-neutral-600">
				¿Ya tienes cuenta?
				<a href="/login" class="text-brand hover:text-primary-700 font-medium">
					Inicia sesión
				</a>
			</p>
		</div>

		<!-- T066: RegistrationForm with pre-selected client role -->
		<RegistrationForm role="client" />

		<!-- Help Section -->
		<div class="text-center text-sm text-neutral-500 mt-8">
			<p>¿Necesitas ayuda para registrarte?</p>
			<a href="/ayuda" class="text-brand hover:text-primary-700 font-medium">
				Contacta nuestro soporte
			</a>
		</div>
	</div>
</div>
