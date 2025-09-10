<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>BarberPro - Inicio</title>
	<meta name="description" content="Plataforma de reservas de barbería premium para Argentina" />
</svelte:head>

<section class="hero">
	<h1>BarberPro</h1>
	<p>La plataforma premium de reservas de barbería para Argentina</p>
	{#if mounted}
		<div class="status">
			<p>✅ SvelteKit funcionando correctamente</p>
			<p>🎯 MVP Foundation - Arquitectura Base</p>
		</div>
	{/if}
</section>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
	}

	h1 {
		font-size: 3rem;
		color: var(--color-primary);
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.2rem;
		margin-bottom: 2rem;
		color: var(--color-text);
	}

	.status {
		background: #f0f9ff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--color-primary);
	}

	.status p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}
</style>