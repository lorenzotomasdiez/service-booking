<script lang="ts">
  // Premium Onboarding - Leveraging psychology vertical insights
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Button from '../Button.svelte';
  import Modal from '../Modal.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Onboarding state
  let currentStep = 1;
  let totalSteps = 5;
  let isLoading = false;
  let completedSteps = new Set();
  
  // Psychology vertical insights integration
  let psychologyInsights = {
    userMotivation: 'growth', // growth, efficiency, compliance
    preferredCommunication: 'visual', // visual, text, interactive
    urgencyLevel: 'medium', // low, medium, high
    trustFactors: ['testimonials', 'certifications', 'security']
  };
  
  // Onboarding data collection
  let onboardingData = {
    businessType: '',
    primaryGoals: [],
    currentChallenges: [],
    preferredFeatures: [],
    communicationStyle: '',
    growthPlans: ''
  };
  
  // Argentina-specific business types
  const businessTypes = [
    { id: 'barbershop', name: 'Barbería', icon: '✂️', popular: true },
    { id: 'beauty_salon', name: 'Salón de Belleza', icon: '💅', popular: true },
    { id: 'psychology', name: 'Consultorio Psicológico', icon: '🧠', emerging: true },
    { id: 'dental', name: 'Consultorio Dental', icon: '🦷', medical: true },
    { id: 'medical', name: 'Consultorio Médico', icon: '🥼', medical: true },
    { id: 'fitness', name: 'Gimnasio/Fitness', icon: '💪', growing: true },
    { id: 'spa', name: 'Spa/Wellness', icon: '🧼', premium: true },
    { id: 'nutrition', name: 'Nutrición', icon: '🥗', health: true }
  ];
  
  // Primary goals based on psychology insights
  const primaryGoals = [
    { id: 'increase_bookings', name: 'Aumentar reservas', priority: 'high' },
    { id: 'improve_efficiency', name: 'Mejorar eficiencia', priority: 'high' },
    { id: 'enhance_client_satisfaction', name: 'Mejorar satisfacción del cliente', priority: 'medium' },
    { id: 'reduce_no_shows', name: 'Reducir ausencias', priority: 'medium' },
    { id: 'automate_reminders', name: 'Automatizar recordatorios', priority: 'medium' },
    { id: 'track_analytics', name: 'Seguimiento y análiticas', priority: 'low' },
    { id: 'expand_business', name: 'Expandir el negocio', priority: 'low' },
    { id: 'improve_payments', name: 'Mejorar gestión de pagos', priority: 'high' }
  ];
  
  // Current challenges
  const currentChallenges = [
    { id: 'manual_booking', name: 'Reservas manuales/telefónicas', common: true },
    { id: 'double_bookings', name: 'Reservas duplicadas', common: true },
    { id: 'no_shows', name: 'Clientes que no asisten', common: true },
    { id: 'payment_issues', name: 'Problemas con pagos', common: false },
    { id: 'client_communication', name: 'Comunicación con clientes', common: false },
    { id: 'staff_coordination', name: 'Coordinación del personal', common: false },
    { id: 'analytics_tracking', name: 'Seguimiento de métricas', common: false },
    { id: 'compliance_issues', name: 'Cumplimiento normativo', medical: true }
  ];
  
  // Preferred features
  const preferredFeatures = [
    { id: 'calendar_management', name: 'Gestión de calendario', category: 'core' },
    { id: 'whatsapp_integration', name: 'Integración WhatsApp', category: 'communication', argentina: true },
    { id: 'payment_processing', name: 'Procesamiento de pagos', category: 'financial' },
    { id: 'client_profiles', name: 'Perfiles de clientes', category: 'crm' },
    { id: 'analytics_dashboard', name: 'Dashboard de analíticas', category: 'analytics' },
    { id: 'multi_location', name: 'Múltiples ubicaciones', category: 'expansion' },
    { id: 'staff_management', name: 'Gestión de personal', category: 'operations' },
    { id: 'compliance_tools', name: 'Herramientas de cumplimiento', category: 'medical' }
  ];
  
  onMount(() => {
    // Track onboarding start
    uxAnalyticsService.trackEvent('premium_onboarding_started', {
      timestamp: new Date().toISOString(),
      psychologyInsights
    });
  });
  
  function nextStep() {
    if (currentStep < totalSteps) {
      completedSteps.add(currentStep);
      currentStep++;
      
      // Track step completion
      uxAnalyticsService.trackEvent('onboarding_step_completed', {
        step: currentStep - 1,
        totalSteps,
        completionRate: completedSteps.size / totalSteps
      });
    }
  }
  
  function previousStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }
  
  function selectBusinessType(type: any) {
    onboardingData.businessType = type.id;
    
    // Auto-suggest relevant goals based on business type
    if (type.id === 'psychology') {
      onboardingData.primaryGoals = [
        'enhance_client_satisfaction',
        'improve_efficiency',
        'automate_reminders'
      ];
    } else if (type.medical) {
      onboardingData.primaryGoals = [
        'reduce_no_shows',
        'improve_efficiency',
        'track_analytics'
      ];
    }
    
    nextStep();
  }
  
  function toggleGoal(goalId: string) {
    if (onboardingData.primaryGoals.includes(goalId)) {
      onboardingData.primaryGoals = onboardingData.primaryGoals.filter(g => g !== goalId);
    } else {
      onboardingData.primaryGoals = [...onboardingData.primaryGoals, goalId];
    }
  }
  
  function toggleChallenge(challengeId: string) {
    if (onboardingData.currentChallenges.includes(challengeId)) {
      onboardingData.currentChallenges = onboardingData.currentChallenges.filter(c => c !== challengeId);
    } else {
      onboardingData.currentChallenges = [...onboardingData.currentChallenges, challengeId];
    }
  }
  
  function toggleFeature(featureId: string) {
    if (onboardingData.preferredFeatures.includes(featureId)) {
      onboardingData.preferredFeatures = onboardingData.preferredFeatures.filter(f => f !== featureId);
    } else {
      onboardingData.preferredFeatures = [...onboardingData.preferredFeatures, featureId];
    }
  }
  
  async function completeOnboarding() {
    isLoading = true;
    
    try {
      // Save onboarding data with psychology insights
      const response = await fetch('/api/provider/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`
        },
        body: JSON.stringify({
          ...onboardingData,
          psychologyInsights,
          completedAt: new Date().toISOString(),
          argentinaOptimized: true
        })
      });
      
      if (response.ok) {
        // Track successful completion
        uxAnalyticsService.trackEvent('premium_onboarding_completed', {
          businessType: onboardingData.businessType,
          goalCount: onboardingData.primaryGoals.length,
          challengeCount: onboardingData.currentChallenges.length,
          featureCount: onboardingData.preferredFeatures.length,
          completionTime: Date.now() - performance.now()
        });
        
        // Dispatch completion event
        dispatch('complete', {
          onboardingData,
          psychologyInsights
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('[PremiumOnboarding] Completion error:', error);
      alert('Error al completar la configuración inicial');
    } finally {
      isLoading = false;
    }
  }
  
  function getStepTitle(step: number): string {
    const titles = {
      1: 'Tipo de Negocio',
      2: 'Objetivos Principales',
      3: 'Desafíos Actuales',
      4: 'Funciones Preferidas',
      5: 'Configuración Final'
    };
    return titles[step] || `Paso ${step}`;
  }
  
  function getProgressPercentage(): number {
    return (completedSteps.size / totalSteps) * 100;
  }
</script>

<!-- Premium Onboarding Modal -->
<Modal 
  open={true} 
  size="large"
  title="Configuración Inicial Premium"
  showCloseButton={false}
>
  <div class="space-y-6">
    <!-- Progress Bar -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStepTitle(currentStep)}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Paso {currentStep} de {totalSteps}
        </span>
      </div>
      
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style="width: {getProgressPercentage()}%"
        ></div>
      </div>
    </div>
    
    <!-- Step Content -->
    <div class="min-h-[400px]">
      {#if currentStep === 1}
        <!-- Step 1: Business Type -->
        <div in:fly={{ x: 20, duration: 300 }}>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Qué tipo de negocio tienes?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Esto nos ayudará a personalizar la plataforma para tus necesidades específicas
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each businessTypes as type (type.id)}
              <button
                class="p-6 border-2 rounded-xl transition-all duration-200 hover:shadow-lg"
                class:border-blue-500={onboardingData.businessType === type.id}
                class:bg-blue-50={onboardingData.businessType === type.id}
                class:dark:bg-blue-900={onboardingData.businessType === type.id}
                class:border-gray-200={onboardingData.businessType !== type.id}
                class:dark:border-gray-600={onboardingData.businessType !== type.id}
                on:click={() => selectBusinessType(type)}
              >
                <div class="text-center">
                  <div class="text-4xl mb-3">{type.icon}</div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    {type.name}
                  </h4>
                  
                  <!-- Badges -->
                  <div class="flex justify-center space-x-1">
                    {#if type.popular}
                      <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Popular
                      </span>
                    {/if}
                    {#if type.emerging}
                      <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Emergente
                      </span>
                    {/if}
                    {#if type.medical}
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Médico
                      </span>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
        
      {:else if currentStep === 2}
        <!-- Step 2: Primary Goals -->
        <div in:fly={{ x: 20, duration: 300 }}>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Cuáles son tus objetivos principales?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Selecciona los objetivos más importantes para tu negocio (puedes elegir varios)
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each primaryGoals as goal (goal.id)}
              <label 
                class="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors"
                class:border-blue-500={onboardingData.primaryGoals.includes(goal.id)}
                class:bg-blue-50={onboardingData.primaryGoals.includes(goal.id)}
                class:dark:bg-blue-900={onboardingData.primaryGoals.includes(goal.id)}
              >
                <input
                  type="checkbox"
                  checked={onboardingData.primaryGoals.includes(goal.id)}
                  on:change={() => toggleGoal(goal.id)}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {goal.name}
                  </div>
                  {#if goal.priority === 'high'}
                    <span class="text-xs text-orange-600 dark:text-orange-400">
                      Alta prioridad
                    </span>
                  {/if}
                </div>
              </label>
            {/each}
          </div>
        </div>
        
      {:else if currentStep === 3}
        <!-- Step 3: Current Challenges -->
        <div in:fly={{ x: 20, duration: 300 }}>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Qué desafíos enfrentas actualmente?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Esto nos ayudará a priorizar las funciones que más te ayudarán
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each currentChallenges as challenge (challenge.id)}
              <label 
                class="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors"
                class:border-red-500={onboardingData.currentChallenges.includes(challenge.id)}
                class:bg-red-50={onboardingData.currentChallenges.includes(challenge.id)}
                class:dark:bg-red-900={onboardingData.currentChallenges.includes(challenge.id)}
              >
                <input
                  type="checkbox"
                  checked={onboardingData.currentChallenges.includes(challenge.id)}
                  on:change={() => toggleChallenge(challenge.id)}
                  class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                >
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {challenge.name}
                  </div>
                  {#if challenge.common}
                    <span class="text-xs text-blue-600 dark:text-blue-400">
                      Muy común
                    </span>
                  {/if}
                  {#if challenge.medical}
                    <span class="text-xs text-purple-600 dark:text-purple-400">
                      Sector médico
                    </span>
                  {/if}
                </div>
              </label>
            {/each}
          </div>
        </div>
        
      {:else if currentStep === 4}
        <!-- Step 4: Preferred Features -->
        <div in:fly={{ x: 20, duration: 300 }}>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Qué funciones te interesan más?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Selecciona las funciones que consideras más importantes para tu negocio
          </p>
          
          <!-- Feature Categories -->
          <div class="space-y-6">
            {#each ['core', 'communication', 'financial', 'crm', 'analytics', 'expansion'] as category}
              {@const categoryFeatures = preferredFeatures.filter(f => f.category === category)}
              {#if categoryFeatures.length > 0}
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                    {category === 'core' ? 'Funciones Básicas' :
                     category === 'communication' ? 'Comunicación' :
                     category === 'financial' ? 'Finanzas' :
                     category === 'crm' ? 'Gestión de Clientes' :
                     category === 'analytics' ? 'Analíticas' :
                     'Expansión'}
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {#each categoryFeatures as feature (feature.id)}
                      <label 
                        class="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors"
                        class:border-green-500={onboardingData.preferredFeatures.includes(feature.id)}
                        class:bg-green-50={onboardingData.preferredFeatures.includes(feature.id)}
                        class:dark:bg-green-900={onboardingData.preferredFeatures.includes(feature.id)}
                      >
                        <input
                          type="checkbox"
                          checked={onboardingData.preferredFeatures.includes(feature.id)}
                          on:change={() => toggleFeature(feature.id)}
                          class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        >
                        <div class="flex-1">
                          <div class="font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </div>
                          {#if feature.argentina}
                            <span class="text-xs text-blue-600 dark:text-blue-400">
                              Optimizado para Argentina
                            </span>
                          {/if}
                        </div>
                      </label>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
        
      {:else if currentStep === 5}
        <!-- Step 5: Final Configuration -->
        <div in:fly={{ x: 20, duration: 300 }}>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Configuración final
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Últimos detalles para personalizar tu experiencia
          </p>
          
          <div class="space-y-6">
            <!-- Communication Style -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                ¿Cómo prefieres recibir actualizaciones?
              </label>
              <div class="space-y-2">
                {#each ['email', 'whatsapp', 'sms', 'push'] as style}
                  <label class="flex items-center space-x-3">
                    <input
                      type="radio"
                      bind:group={onboardingData.communicationStyle}
                      value={style}
                      class="text-blue-600 focus:ring-blue-500"
                    >
                    <span class="text-gray-900 dark:text-white capitalize">
                      {style === 'whatsapp' ? 'WhatsApp' :
                       style === 'email' ? 'Correo electrónico' :
                       style === 'sms' ? 'SMS' :
                       'Notificaciones push'}
                    </span>
                  </label>
                {/each}
              </div>
            </div>
            
            <!-- Growth Plans -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                ¿Cuáles son tus planes de crecimiento?
              </label>
              <textarea
                bind:value={onboardingData.growthPlans}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Abrir una segunda sucursal en 6 meses, contratar más personal..."
              ></textarea>
            </div>
            
            <!-- Summary -->
            <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
              <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Resumen de tu configuración
              </h4>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-blue-800 dark:text-blue-200">Tipo de negocio:</span>
                  <span class="font-medium text-blue-900 dark:text-blue-100">
                    {businessTypes.find(t => t.id === onboardingData.businessType)?.name || 'No seleccionado'}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-800 dark:text-blue-200">Objetivos seleccionados:</span>
                  <span class="font-medium text-blue-900 dark:text-blue-100">
                    {onboardingData.primaryGoals.length}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-800 dark:text-blue-200">Desafíos identificados:</span>
                  <span class="font-medium text-blue-900 dark:text-blue-100">
                    {onboardingData.currentChallenges.length}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-800 dark:text-blue-200">Funciones de interés:</span>
                  <span class="font-medium text-blue-900 dark:text-blue-100">
                    {onboardingData.preferredFeatures.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Navigation Buttons -->
    <div class="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 pt-6 border-t border-gray-200 dark:border-gray-600">
      <Button
        variant="secondary"
        on:click={previousStep}
        disabled={currentStep === 1}
        class="flex items-center space-x-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Anterior</span>
      </Button>
      
      <div class="flex space-x-3">
        {#if currentStep < totalSteps}
          <Button
            variant="primary"
            on:click={nextStep}
            disabled={currentStep === 1 && !onboardingData.businessType}
            class="flex items-center space-x-2"
          >
            <span>Siguiente</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        {:else}
          <Button
            variant="primary"
            on:click={completeOnboarding}
            disabled={isLoading}
            class="flex items-center space-x-2"
          >
            {#if isLoading}
              <LoadingSpinner size="small" />
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
            <span>Completar Configuración</span>
          </Button>
        {/if}
      </div>
    </div>
  </div>
</Modal>

<style>
  /* Smooth transitions for step changes */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }
  
  /* Progress bar animation */
  .bg-blue-600 {
    transition: width 0.3s ease;
  }
  
  /* Button hover effects */
  button:hover {
    transform: translateY(-1px);
    transition: transform 0.2s ease;
  }
  
  /* Card selection effects */
  .border-blue-500 {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .border-red-500 {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
  
  .border-green-500 {
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
  
  /* Mobile optimization for Argentina */
  @media (max-width: 768px) {
    .lg\:grid-cols-3 {
      grid-template-columns: 1fr;
    }
    
    .md\:grid-cols-2 {
      grid-template-columns: 1fr;
    }
    
    .sm\:flex-row {
      flex-direction: column;
    }
    
    .sm\:space-x-3 > * + * {
      margin-left: 0;
      margin-top: 0.75rem;
    }
  }
</style>