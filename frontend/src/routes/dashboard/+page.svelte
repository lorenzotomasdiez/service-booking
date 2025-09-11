<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isAuthenticated, user } from '$lib/stores/auth';

	onMount(() => {
		// Redirect to appropriate dashboard based on role
		if ($isAuthenticated && $user) {
			if ($user.role === 'provider') {
				goto('/dashboard/provider');
			} else {
				goto('/dashboard/client');
			}
		} else {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Dashboard - BarberPro</title>
	<meta name="description" content="Gestiona tus reservas y servicios en BarberPro" />
</svelte:head>

<!-- Loading state while redirecting -->
<div class="min-h-screen flex items-center justify-center bg-neutral-50">
	<div class="text-center space-y-4">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
		<p class="text-neutral-600">Cargando dashboard...</p>
	</div>
</div>