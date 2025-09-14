<script lang="ts">
  // Customer Health Score Widget Component
  // F11-001: Customer Experience Platform - Customer Success Interface
  
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import customerSuccessService from '../../services/customer-success';
  import type {
    CustomerHealthScore,
    CustomerSuccessRecommendation
  } from '../../types/customer-experience';
  
  const dispatch = createEventDispatcher();
  
  export let userId: string;
  export let showRecommendations: boolean = true;
  export let compact: boolean = false;
  
  let healthScore: CustomerHealthScore | null = null;
  let recommendations: CustomerSuccessRecommendation[] = [];
  let isLoading = false;
  let error: string | null = null;
  let showDetails = false;
  
  onMount(async () => {
    await loadHealthData();
  });
  
  async function loadHealthData() {
    isLoading = true;
    error = null;
    
    try {
      const [scoreData, recData] = await Promise.all([
        customerSuccessService.getCustomerHealthScore(userId),
        showRecommendations ? customerSuccessService.getCustomerRecommendations(userId) : []
      ]);
      
      healthScore = scoreData;
      recommendations = recData;
      
    } catch (err) {
      error = 'Error al cargar la información de salud del cliente';
      console.error('Health data loading error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function refreshHealthScore() {
    if (!healthScore) return;
    
    try {
      const updatedScore = await customerSuccessService.updateCustomerHealthScore(userId);
      healthScore = updatedScore;
      dispatch('health-updated', { healthScore: updatedScore });
    } catch (err) {
      error = 'Error al actualizar la puntuación de salud';
      console.error('Health score refresh error:', err);
    }
  }
  
  async function executeRecommendation(recommendationId: string) {
    try {
      await customerSuccessService.executeIntervention(userId, recommendationId);
      await loadHealthData(); // Refresh data after intervention
      dispatch('intervention-executed', { recommendationId });
    } catch (err) {
      error = 'Error al ejecutar la recomendación';
      console.error('Recommendation execution error:', err);
    }
  }
  
  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
  
  function getScoreBackground(score: number): string {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  }
  
  function getRiskColor(risk: string): string {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  function getRiskIcon(risk: string): string {
    switch (risk) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      default: return 'ℹ️';
    }
  }
  
  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
</script>

{#if compact}
  <!-- Compact Version -->
  <div class="bg-white border border-gray-200 rounded-lg p-4">
    {#if isLoading}
      <div class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    {:else if error}
      <div class="text-red-600 text-sm text-center py-2">
        {error}
      </div>
    {:else if healthScore}
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="{getScoreBackground(healthScore.score)} rounded-full p-2">
            <div class="text-2xl font-bold {getScoreColor(healthScore.score)}">
              {healthScore.score}
            </div>
          </div>
          
          <div>
            <h4 class="font-medium text-gray-900">Salud del Cliente</h4>
            <div class="flex items-center space-x-2">
              <span class="text-sm {getRiskColor(healthScore.risk)} px-2 py-1 rounded-full font-medium">
                {getRiskIcon(healthScore.risk)} {healthScore.risk === 'low' ? 'Bajo' : 
                 healthScore.risk === 'medium' ? 'Medio' : 'Alto'} riesgo
              </span>
            </div>
          </div>
        </div>
        
        <button
          on:click={() => showDetails = !showDetails}
          class="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showDetails ? 'Menos' : 'Más'} detalles
        </button>
      </div>
      
      {#if showDetails}
        <div class="mt-4 pt-4 border-t border-gray-200" transition:slide>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">Reservas</span>
              <span class="font-medium">{healthScore.factors.bookingFrequency}/100</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Pagos</span>
              <span class="font-medium">{healthScore.factors.paymentHistory}/100</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Soporte</span>
              <span class="font-medium">{healthScore.factors.supportInteractions}/100</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Uso</span>
              <span class="font-medium">{healthScore.factors.appUsage}/100</span>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
{:else}
  <!-- Full Version -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Salud del Cliente</h3>
          <p class="text-sm text-gray-600 mt-1">Análisis del estado de la relación con el cliente</p>
        </div>
        
        <button
          on:click={refreshHealthScore}
          disabled={isLoading}
          class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
        >
          🔄 Actualizar
        </button>
      </div>
    </div>
    
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Calculando salud del cliente...</span>
      </div>
    {:else if error}
      <div class="p-6 text-center">
        <div class="text-red-600 mb-2">⚠️</div>
        <div class="text-red-700 text-sm">{error}</div>
        <button
          on:click={loadHealthData}
          class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          Reintentar
        </button>
      </div>
    {:else if healthScore}
      <div class="p-6">
        <!-- Score Display -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-24 h-24 {getScoreBackground(healthScore.score)} rounded-full mb-4" 
               transition:scale>
            <div class="text-3xl font-bold {getScoreColor(healthScore.score)}">
              {healthScore.score}
            </div>
          </div>
          
          <h4 class="text-xl font-semibold text-gray-900 mb-2">
            Puntuación de Salud
          </h4>
          
          <div class="flex items-center justify-center space-x-4">
            <span class="px-3 py-1 {getRiskColor(healthScore.risk)} rounded-full text-sm font-medium">
              {getRiskIcon(healthScore.risk)} 
              {healthScore.risk === 'low' ? 'Riesgo Bajo' : 
               healthScore.risk === 'medium' ? 'Riesgo Medio' : 'Riesgo Alto'}
            </span>
            
            <span class="text-sm text-gray-500">
              Actualizado: {formatDate(healthScore.lastCalculated)}
            </span>
          </div>
        </div>
        
        <!-- Factors Breakdown -->
        <div class="mb-8">
          <h5 class="font-medium text-gray-900 mb-4">Factores de Salud</h5>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">📅</div>
                <div>
                  <div class="font-medium text-gray-900">Frecuencia de Reservas</div>
                  <div class="text-sm text-gray-600">Qué tan activo es el cliente</div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style="width: {healthScore.factors.bookingFrequency}%"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8">
                  {healthScore.factors.bookingFrequency}
                </span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">💳</div>
                <div>
                  <div class="font-medium text-gray-900">Historial de Pagos</div>
                  <div class="text-sm text-gray-600">Confiabilidad en los pagos</div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style="width: {healthScore.factors.paymentHistory}%"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8">
                  {healthScore.factors.paymentHistory}
                </span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">🎧</div>
                <div>
                  <div class="font-medium text-gray-900">Interacciones de Soporte</div>
                  <div class="text-sm text-gray-600">Satisfacción con el soporte</div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                    style="width: {healthScore.factors.supportInteractions}%"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8">
                  {healthScore.factors.supportInteractions}
                </span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">📱</div>
                <div>
                  <div class="font-medium text-gray-900">Uso de la Aplicación</div>
                  <div class="text-sm text-gray-600">Nivel de engagement</div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style="width: {healthScore.factors.appUsage}%"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8">
                  {healthScore.factors.appUsage}
                </span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">👥</div>
                <div>
                  <div class="font-medium text-gray-900">Engagement Social</div>
                  <div class="text-sm text-gray-600">Participación en la comunidad</div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-pink-600 h-2 rounded-full transition-all duration-300"
                    style="width: {healthScore.factors.socialEngagement}%"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8">
                  {healthScore.factors.socialEngagement}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recommendations -->
        {#if showRecommendations && recommendations.length > 0}
          <div class="border-t border-gray-200 pt-6">
            <h5 class="font-medium text-gray-900 mb-4">Recomendaciones Personalizadas</h5>
            
            <div class="space-y-3">
              {#each recommendations.slice(0, 3) as recommendation}
                <div class="border border-gray-200 rounded-lg p-4" transition:fade>
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h6 class="font-medium text-gray-900 mb-1">{recommendation.title}</h6>
                      <p class="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                      
                      <div class="flex items-center space-x-3 text-xs text-gray-500">
                        <span class="px-2 py-1 {getPriorityColor(recommendation.priority)} rounded-full font-medium">
                          Prioridad {recommendation.priority === 'high' ? 'Alta' : 
                                   recommendation.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                        
                        <span>Impacto: {recommendation.estimatedImpact}%</span>
                        
                        {#if recommendation.expiresAt}
                          <span>Expira: {formatDate(recommendation.expiresAt)}</span>
                        {/if}
                      </div>
                    </div>
                    
                    {#if recommendation.automationType}
                      <button
                        on:click={() => executeRecommendation(recommendation.id)}
                        class="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        ⚡ Ejecutar
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
              
              {#if recommendations.length > 3}
                <div class="text-center">
                  <button
                    on:click={() => dispatch('show-all-recommendations', { userId })}
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver todas las recomendaciones ({recommendations.length})
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/if}
        
        <!-- Actions -->
        <div class="border-t border-gray-200 pt-6 mt-6">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              Próxima evaluación automática en 24 horas
            </div>
            
            <div class="flex space-x-3">
              <button
                on:click={() => dispatch('view-customer-journey', { userId })}
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                📊 Ver Journey Completo
              </button>
              
              <button
                on:click={() => dispatch('schedule-intervention', { userId, healthScore })}
                class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                💬 Programar Intervención
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .animate-spin {
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
</style>
