<script lang="ts">
  /**
   * T032: Email Verification Page
   * Handles email verification from link sent to user's email
   */
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let verifying = true;
  let success = false;
  let error = '';
  let token = '';

  onMount(async () => {
    // Get token from URL query parameters
    token = $page.url.searchParams.get('token') || '';

    if (!token) {
      verifying = false;
      error = 'Token de verificación no proporcionado';
      return;
    }

    await verifyEmail(token);
  });

  async function verifyEmail(verificationToken: string) {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      verifying = false;

      if (response.ok) {
        success = true;
        // Redirect to login after 3 seconds
        setTimeout(() => {
          goto('/login');
        }, 3000);
      } else {
        error = data.message || 'Error al verificar el email';
      }
    } catch (err: any) {
      verifying = false;
      error = err.message || 'Error al conectar con el servidor';
    }
  }

  async function resendVerification() {
    try {
      const response = await fetch('http://localhost:3000/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: '' }), // User would need to provide email
      });

      if (response.ok) {
        alert('Email de verificación reenviado');
      } else {
        alert('Error al reenviar email de verificación');
      }
    } catch (err) {
      alert('Error al conectar con el servidor');
    }
  }
</script>

<svelte:head>
  <title>Verificar Email - BarberPro</title>
  <meta name="description" content="Verifica tu dirección de email para completar el registro en BarberPro" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
    <!-- Logo/Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">BarberPro</h1>
      <p class="text-gray-600 mt-2">Verificación de Email</p>
    </div>

    {#if verifying}
      <!-- Loading State -->
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p class="mt-4 text-gray-600">Verificando tu email...</p>
      </div>
    {:else if success}
      <!-- Success State -->
      <div class="text-center py-8">
        <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">¡Email Verificado!</h2>
        <p class="text-gray-600 mb-6">
          Tu dirección de email ha sido verificada exitosamente.
        </p>
        <p class="text-sm text-gray-500">
          Serás redirigido al inicio de sesión en unos segundos...
        </p>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="text-center py-8">
        <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Error de Verificación</h2>
        <p class="text-gray-600 mb-6">{error}</p>

        <div class="space-y-3">
          <button
            on:click={resendVerification}
            class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Reenviar Email de Verificación
          </button>

          <a
            href="/login"
            class="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Volver al Inicio de Sesión
          </a>
        </div>

        <div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-left">
          <p class="text-sm text-yellow-800">
            <strong>Posibles causas:</strong>
          </p>
          <ul class="text-sm text-yellow-700 mt-2 list-disc list-inside">
            <li>El enlace ha expirado (válido por 24 horas)</li>
            <li>El enlace ya fue utilizado</li>
            <li>El token de verificación es inválido</li>
          </ul>
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p>¿Necesitas ayuda?</p>
      <a href="mailto:soporte@barberpro.com.ar" class="text-purple-600 hover:text-purple-700">
        soporte@barberpro.com.ar
      </a>
    </div>
  </div>
</div>

<style>
  /* Additional custom styles if needed */
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
