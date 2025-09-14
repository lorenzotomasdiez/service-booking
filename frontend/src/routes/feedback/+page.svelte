<!--
T12-001: Customer Feedback Collection Route
Public interface for collecting customer feedback during soft launch
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import CustomerFeedbackInterface from '$lib/components/feedback/CustomerFeedbackInterface.svelte';
  import { fade } from 'svelte/transition';

  let showThankYou = false;
  let isLoading = false;

  // Handle feedback submission success
  function handleFeedbackSubmitted() {
    showThankYou = true;
    setTimeout(() => {
      showThankYou = false;
    }, 5000); // Hide thank you message after 5 seconds
  }

  onMount(() => {
    // Track page visit for analytics
    console.log('Customer Feedback page loaded');
  });
</script>

<svelte:head>
  <title>Comparte tu Experiencia - BarberPro</title>
  <meta name="description" content="Ayúdanos a mejorar BarberPro compartiendo tu experiencia y sugerencias" />
  <meta name="keywords" content="feedback, experiencia, barberías, Argentina, sugerencias" />
</svelte:head>

<div class="feedback-page">
  {#if showThankYou}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      transition:fade
    >
      <div
        class="bg-white p-8 rounded-xl shadow-2xl max-w-md mx-4 text-center"
        transition:fade={{ delay: 200 }}
      >
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          ¡Gracias por tu Feedback!
        </h2>
        <p class="text-gray-600 mb-6">
          Tu opinión es muy valiosa para nosotros. Utilizaremos tu feedback para mejorar la experiencia de BarberPro.
        </p>
        <button
          on:click={() => showThankYou = false}
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  {/if}

  <!-- Header Section -->
  <section class="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h1 class="text-4xl font-bold mb-4">
        Comparte tu Experiencia con BarberPro
      </h1>
      <p class="text-xl mb-6 opacity-90">
        Tu opinión nos ayuda a crear la mejor plataforma de reservas de barberías en Argentina
      </p>
      <div class="flex justify-center items-center gap-4 text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Lanzamiento Controlado</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-yellow-400 rounded-full"></span>
          <span>50 Clientes Seleccionados</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
          <span>Validación Real</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Value Proposition -->
  <section class="py-12 bg-white">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="p-6">
          <div class="text-4xl mb-4">🎯</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            Tu Voz Importa
          </h3>
          <p class="text-gray-600">
            Cada comentario nos ayuda a mejorar la experiencia para toda la comunidad de BarberPro.
          </p>
        </div>
        <div class="p-6">
          <div class="text-4xl mb-4">⚡</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            Mejoras Rápidas
          </h3>
          <p class="text-gray-600">
            Implementamos mejoras basadas en tu feedback de manera rápida y efectiva.
          </p>
        </div>
        <div class="p-6">
          <div class="text-4xl mb-4">🏆</div>
          <h3 class="text-xl font-semibent text-gray-900 mb-2">
            Excelencia Conjunta
          </h3>
          <p class="text-gray-600">
            Juntos construimos la mejor plataforma de servicios de belleza en Argentina.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Feedback Interface -->
  <section class="bg-gray-50">
    <CustomerFeedbackInterface on:feedbackSubmitted={handleFeedbackSubmitted} />
  </section>

  <!-- Stats Section -->
  <section class="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-3xl font-bold text-gray-900 mb-8">
        Impacto de tu Feedback en Tiempo Real
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-3xl font-bold text-blue-600 mb-2">4.7/5</div>
          <div class="text-sm text-gray-600">Satisfacción Promedio</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-3xl font-bold text-green-600 mb-2">35+</div>
          <div class="text-sm text-gray-600">Comentarios Recibidos</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-3xl font-bold text-purple-600 mb-2">6</div>
          <div class="text-sm text-gray-600">Mejoras Implementadas</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-3xl font-bold text-orange-600 mb-2">94%</div>
          <div class="text-sm text-gray-600">Tasa de Activación</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Call to Action -->
  <section class="py-16 bg-gray-900 text-white text-center">
    <div class="max-w-3xl mx-auto px-6">
      <h2 class="text-3xl font-bold mb-4">
        ¿Tienes más sugerencias?
      </h2>
      <p class="text-xl mb-8 opacity-90">
        Contáctanos directamente para conversaciones más detalladas sobre tu experiencia.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="mailto:feedback@barberpro.com.ar"
          class="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          📧 Enviar Email
        </a>
        <a
          href="https://wa.me/5491123456789"
          target="_blank"
          rel="noopener noreferrer"
          class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          📱 WhatsApp
        </a>
        <button
          on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          class="px-8 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-medium"
        >
          ⬆️ Volver Arriba
        </button>
      </div>
    </div>
  </section>
</div>

<style>
  .feedback-page {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Smooth scroll behavior */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Custom animations */
  @keyframes pulse-soft {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  .animate-pulse-soft {
    animation: pulse-soft 3s infinite;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .text-4xl {
      font-size: 2rem;
    }

    .text-3xl {
      font-size: 1.75rem;
    }

    .py-16 {
      padding: 3rem 0;
    }

    .grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>