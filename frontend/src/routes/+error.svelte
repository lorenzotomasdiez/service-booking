<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Get error details from page store
	$: error = $page.error;
	$: status = $page.status;

	function goHome() {
		goto('/');
	}

	function goBack() {
		if (typeof window !== 'undefined') {
			window.history.back();
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>Error {status} - BarberPro</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-neutral-50">
	<div class="container-responsive max-w-lg text-center">
		<div class="space-y-8">
			<!-- Error Icon -->
			<div class="mx-auto w-24 h-24 bg-error-100 rounded-full flex items-center justify-center">
				<svg class="w-12 h-12 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
						d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
				</svg>
			</div>

			<!-- Error Content -->
			<div class="space-y-4">
				<h1 class="text-4xl font-bold text-neutral-800">
					{#if status === 404}
						Página no encontrada
					{:else if status >= 500}
						Error del servidor
					{:else}
						Ha ocurrido un error
					{/if}
				</h1>

				<p class="text-lg text-neutral-600">
					{#if status === 404}
						La página que buscas no existe o ha sido movida.
					{:else if status >= 500}
						Estamos experimentando problemas técnicos. Por favor intenta nuevamente más tarde.
					{:else if error?.message}
						{error.message}
					{:else}
						Ha ocurrido un error inesperado. Por favor intenta nuevamente.
					{/if}
				</p>

				{#if status}
					<p class="text-sm text-neutral-400 font-mono">
						Error {status}
					</p>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<button
					type="button"
					class="btn btn-primary"
					on:click={goHome}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					Ir al inicio
				</button>

				<button
					type="button"
					class="btn btn-secondary"
					on:click={goBack}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
							d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Volver atrás
				</button>
			</div>

			<!-- Help Section -->
			<div class="pt-8 border-t border-neutral-200">
				<p class="text-sm text-neutral-500 mb-4">
					¿Necesitas ayuda? Contacta a nuestro equipo de soporte:
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center text-sm">
					<a href="tel:+5491112345678" class="flex items-center justify-center space-x-2 text-brand hover:text-primary-700">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
						</svg>
						<span>+54 9 11 1234-5678</span>
					</a>
					<a href="mailto:soporte@barberpro.com.ar" class="flex items-center justify-center space-x-2 text-brand hover:text-primary-700">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
							<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
						</svg>
						<span>soporte@barberpro.com.ar</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>