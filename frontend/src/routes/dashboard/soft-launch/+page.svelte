<!--
T12-001: Soft Launch Monitoring Dashboard Route
Real-time monitoring interface for the controlled soft launch with 50 customers
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated, user } from '$lib/stores/auth';
  import SoftLaunchDashboard from '$lib/components/monitoring/SoftLaunchDashboard.svelte';

  // Check authentication and admin permissions
  onMount(() => {
    if (!$isAuthenticated || !$user) {
      goto('/login?redirect=/dashboard/soft-launch');
      return;
    }

    // Only allow admin/manager access to soft launch monitoring
    if ($user.role !== 'admin' && $user.role !== 'manager') {
      goto('/dashboard');
      return;
    }
  });

  $: if ($isAuthenticated === false) {
    goto('/login?redirect=/dashboard/soft-launch');
  }
</script>

<svelte:head>
  <title>T12-001 Soft Launch Monitoring - BarberPro</title>
  <meta name="description" content="Real-time monitoring dashboard for BarberPro controlled soft launch" />
</svelte:head>

{#if $isAuthenticated && $user && ($user.role === 'admin' || $user.role === 'manager')}
  <div class="soft-launch-page">
    <SoftLaunchDashboard />
  </div>
{:else}
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
      <p class="text-gray-600 mb-6">This page is only accessible to administrators and managers.</p>
      <button
        on:click={() => goto('/dashboard')}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  </div>
{/if}

<style>
  .soft-launch-page {
    min-height: 100vh;
  }
</style>