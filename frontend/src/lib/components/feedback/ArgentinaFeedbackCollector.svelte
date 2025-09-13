<script lang="ts">
  // Argentina Feedback Collector - Contextual User Experience Feedback
  // Optimized for Argentina market cultural preferences and mobile usage
  
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  const dispatch = createEventDispatcher<{
    feedbackSubmitted: { 
      type: string; 
      rating: number; 
      feedback: string; 
      context: FeedbackContext;
      metadata: FeedbackMetadata;
    };
    feedbackClosed: { reason: string; timeShown: number };
    improvementSuggestion: { area: string; suggestion: string; priority: number };
  }>();

  // Props
  export let triggerType: FeedbackTriggerType = 'none';
  export let currentRoute: string = '';
  export let bookingStep: string = '';
  export let userDevice: 'mobile' | 'tablet' | 'desktop' = 'mobile';
  export let autoShow: boolean = false;
  export let contextData: any = {};

  // Feedback types specific to Argentina market
  type FeedbackTriggerType = 
    | 'none'
    | 'booking_completed'
    | 'booking_abandoned'
    | 'payment_method_issue'
    | 'mobile_experience'
    | 'search_results'
    | 'provider_interaction'
    | 'first_time_user'
    | 'error_encountered'
    | 'performance_issue'
    | 'argentina_localization'
    | 'mercadopago_experience';

  interface FeedbackContext {
    route: string;
    step?: string;
    device: string;
    timestamp: number;
    sessionDuration: number;
    triggeredBy: FeedbackTriggerType;
    userAgent: string;
    screenSize: string;
    connectionType?: string;
  }

  interface FeedbackMetadata {
    isFirstTime: boolean;
    completedBookings: number;
    favoriteProviders: number;
    preferredPaymentMethod?: string;
    regionCode?: string;
    languagePreference: string;
  }

  // State management
  let showFeedback: boolean = false;
  let currentFeedbackType: FeedbackTriggerType = 'none';
  let feedbackStep: number = 1;
  let isSubmitting: boolean = false;
  let showThankYou: boolean = false;
  let showMinimized: boolean = false;

  // Feedback data
  let overallRating: number = 0;
  let specificRatings: Record<string, number> = {};
  let feedbackText: string = '';
  let selectedIssues: string[] = [];
  let improvementSuggestions: string[] = [];
  let wouldRecommend: boolean | null = null;
  let experienceEmoji: string = '';

  // Timing
  let feedbackStartTime: number = 0;
  let timeSpentOnFeedback: number = 0;

  // Argentina-specific feedback configurations
  const feedbackConfigs: Record<FeedbackTriggerType, FeedbackConfig> = {
    none: { title: '', questions: [], autoShow: false },
    
    booking_completed: {
      title: '¡Genial! Tu reserva está confirmada 🎉',
      subtitle: 'Ayúdanos a mejorar tu experiencia',
      questions: [
        {
          id: 'overall_experience',
          type: 'rating',
          title: '¿Qué tal fue tu experiencia reservando?',
          required: true,
          scale: 5,
          labels: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente']
        },
        {
          id: 'booking_ease',
          type: 'rating',
          title: '¿Qué tan fácil fue encontrar y reservar?',
          required: true,
          scale: 5
        },
        {
          id: 'payment_experience',
          type: 'rating', 
          title: '¿Cómo fue el proceso de pago?',
          required: true,
          scale: 5
        },
        {
          id: 'would_recommend',
          type: 'boolean',
          title: '¿Recomendarías BarberPro a tus amigos?',
          required: true
        },
        {
          id: 'improvement_areas',
          type: 'multiple_choice',
          title: '¿En qué podríamos mejorar?',
          options: [
            'Más opciones de pago',
            'Mejor búsqueda de barberos',
            'Horarios más disponibles',
            'Comunicación con el barbero',
            'Aplicación móvil',
            'Precios más claros',
            'Proceso más rápido'
          ],
          maxSelections: 3
        },
        {
          id: 'additional_feedback',
          type: 'text',
          title: '¿Algo más que quieras contarnos?',
          placeholder: 'Tu opinión nos ayuda a mejorar...',
          maxLength: 500
        }
      ],
      autoShow: true,
      priority: 'high',
      showAfterDelay: 2000
    },

    booking_abandoned: {
      title: 'Te vemos por aquí... 👀',
      subtitle: '¿Podés contarnos por qué no completaste la reserva?',
      questions: [
        {
          id: 'abandonment_reason',
          type: 'single_choice',
          title: '¿Qué te hizo detener la reserva?',
          required: true,
          options: [
            'No encontré el horario que quería',
            'El precio era muy alto',
            'El proceso era muy complicado',
            'Problemas con el pago',
            'Cambié de opinión',
            'Problemas técnicos',
            'Solo estaba explorando',
            'Otro motivo'
          ]
        },
        {
          id: 'improvement_suggestion',
          type: 'text',
          title: '¿Qué podríamos hacer para ayudarte?',
          placeholder: 'Tus sugerencias son muy importantes...'
        },
        {
          id: 'try_again',
          type: 'boolean',
          title: '¿Te gustaría que te ayudemos a completar la reserva?'
        }
      ],
      autoShow: true,
      priority: 'high',
      showAfterDelay: 15000
    },

    mobile_experience: {
      title: 'Experiencia en tu móvil 📱',
      subtitle: 'Contanos cómo funciona BarberPro en tu teléfono',
      questions: [
        {
          id: 'mobile_performance',
          type: 'rating',
          title: '¿Qué tal la velocidad de carga?',
          scale: 5,
          labels: ['Muy lenta', 'Lenta', 'Normal', 'Rápida', 'Muy rápida']
        },
        {
          id: 'mobile_usability',
          type: 'rating',
          title: '¿Qué tan fácil es usar en tu teléfono?',
          scale: 5
        },
        {
          id: 'mobile_issues',
          type: 'multiple_choice',
          title: '¿Tuviste algún problema?',
          options: [
            'Botones muy pequeños',
            'Textos difíciles de leer',
            'Carga lenta',
            'Problemas de conexión',
            'Errores en la app',
            'Difícil navegación',
            'No funciona sin internet'
          ]
        },
        {
          id: 'mobile_features',
          type: 'text',
          title: '¿Qué funciones te gustaría tener en el móvil?',
          placeholder: 'Notificaciones, modo offline, etc.'
        }
      ],
      autoShow: false,
      priority: 'medium'
    },

    mercadopago_experience: {
      title: 'Experiencia con MercadoPago 💳',
      subtitle: 'Queremos mejorar los pagos para los argentinos',
      questions: [
        {
          id: 'payment_satisfaction',
          type: 'rating',
          title: '¿Qué tal fue pagar con MercadoPago?',
          scale: 5,
          required: true
        },
        {
          id: 'payment_speed',
          type: 'rating',
          title: '¿Qué tan rápido fue el proceso?',
          scale: 5
        },
        {
          id: 'payment_issues',
          type: 'multiple_choice',
          title: '¿Tuviste algún problema?',
          options: [
            'No se procesó el pago',
            'Fue muy lento',
            'Problemas con cuotas',
            'No encontré mi banco',
            'Error en la aplicación',
            'Faltaban opciones de pago',
            'Proceso confuso'
          ]
        },
        {
          id: 'preferred_payment',
          type: 'single_choice',
          title: '¿Cuál preferís para próximas reservas?',
          options: [
            'MercadoPago (cuenta)',
            'Tarjeta de crédito',
            'Tarjeta de débito',
            'Efectivo en el local',
            'Transferencia bancaria',
            'Otro'
          ]
        },
        {
          id: 'payment_suggestions',
          type: 'text',
          title: '¿Cómo podríamos mejorar los pagos?',
          placeholder: 'Más opciones, mejor información, etc.'
        }
      ],
      autoShow: false,
      priority: 'high'
    },

    argentina_localization: {
      title: 'BarberPro para Argentina 🇦🇷',
      subtitle: 'Ayúdanos a adaptar mejor la plataforma',
      questions: [
        {
          id: 'localization_rating',
          type: 'rating',
          title: '¿Qué tan argentino se siente BarberPro?',
          scale: 5,
          labels: ['Nada', 'Poco', 'Normal', 'Bastante', 'Muy argentino']
        },
        {
          id: 'language_issues',
          type: 'multiple_choice',
          title: '¿Encontraste problemas con el idioma?',
          options: [
            'Palabras que no usamos acá',
            'Falta el voseo',
            'Horarios en formato extraño',
            'Precios sin símbolo peso',
            'Direcciones mal formateadas',
            'Teléfonos sin código de área'
          ]
        },
        {
          id: 'argentina_features',
          type: 'text',
          title: '¿Qué funciones específicas necesitamos en Argentina?',
          placeholder: 'Integración con transporte público, barrios populares, etc.'
        },
        {
          id: 'cultural_fit',
          type: 'text',
          title: '¿Algo que no se sienta "argentino"?',
          placeholder: 'Colores, diseño, formas de comunicación, etc.'
        }
      ],
      autoShow: false,
      priority: 'medium'
    },

    error_encountered: {
      title: 'Ups, algo salió mal 😅',
      subtitle: 'Ayúdanos a solucionarlo',
      questions: [
        {
          id: 'error_frustration',
          type: 'rating',
          title: '¿Qué tan frustrante fue este error?',
          scale: 5,
          labels: ['Nada', 'Poco', 'Normal', 'Bastante', 'Muy frustrante']
        },
        {
          id: 'error_description',
          type: 'text',
          title: '¿Podés contarnos qué pasó?',
          placeholder: 'Describe qué estabas haciendo cuando apareció el error...',
          required: true,
          maxLength: 300
        },
        {
          id: 'error_frequency',
          type: 'single_choice',
          title: '¿Te pasó antes?',
          options: [
            'Es la primera vez',
            'Me pasó algunas veces',
            'Me pasa seguido',
            'Siempre me pasa esto'
          ]
        },
        {
          id: 'recovery_success',
          type: 'boolean',
          title: '¿Pudiste completar lo que querías hacer después?'
        }
      ],
      autoShow: true,
      priority: 'urgent',
      showAfterDelay: 5000
    }
  };

  interface FeedbackConfig {
    title: string;
    subtitle?: string;
    questions: FeedbackQuestion[];
    autoShow: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    showAfterDelay?: number;
  }

  interface FeedbackQuestion {
    id: string;
    type: 'rating' | 'text' | 'single_choice' | 'multiple_choice' | 'boolean';
    title: string;
    required?: boolean;
    scale?: number;
    labels?: string[];
    options?: string[];
    maxSelections?: number;
    placeholder?: string;
    maxLength?: number;
  }

  // Reactive properties
  $: currentConfig = feedbackConfigs[currentFeedbackType] || feedbackConfigs.none;
  $: currentQuestion = currentConfig.questions[feedbackStep - 1];
  $: canProceed = isQuestionAnswered(currentQuestion);
  $: isLastQuestion = feedbackStep >= currentConfig.questions.length;

  onMount(() => {
    if (autoShow && triggerType !== 'none') {
      triggerFeedback(triggerType);
    }
  });

  function triggerFeedback(type: FeedbackTriggerType, delay: number = 0): void {
    if (delay > 0) {
      setTimeout(() => showFeedbackType(type), delay);
    } else {
      showFeedbackType(type);
    }
  }

  function showFeedbackType(type: FeedbackTriggerType): void {
    // Don't show feedback if user recently gave feedback
    const lastFeedback = localStorage.getItem('last-feedback-time');
    if (lastFeedback && Date.now() - parseInt(lastFeedback) < 24 * 60 * 60 * 1000) {
      return; // Don't show feedback within 24 hours
    }

    currentFeedbackType = type;
    showFeedback = true;
    feedbackStep = 1;
    feedbackStartTime = Date.now();
    
    // Reset form data
    overallRating = 0;
    specificRatings = {};
    feedbackText = '';
    selectedIssues = [];
    improvementSuggestions = [];
    wouldRecommend = null;
    experienceEmoji = '';

    // Track feedback shown
    uxAnalytics.trackEvent('feedback', {
      action: 'shown',
      type: type,
      device: userDevice,
      route: currentRoute,
      auto: autoShow
    });
  }

  function closeFeedback(reason: string = 'user_closed'): void {
    const timeShown = Date.now() - feedbackStartTime;
    
    dispatch('feedbackClosed', { 
      reason, 
      timeShown 
    });

    // Track feedback closed
    uxAnalytics.trackEvent('feedback', {
      action: 'closed',
      reason,
      timeShown,
      step: feedbackStep,
      type: currentFeedbackType
    });

    resetFeedback();
  }

  function resetFeedback(): void {
    showFeedback = false;
    showThankYou = false;
    showMinimized = false;
    currentFeedbackType = 'none';
    feedbackStep = 1;
  }

  function minimizeFeedback(): void {
    showMinimized = true;
    
    uxAnalytics.trackEvent('feedback', {
      action: 'minimized',
      type: currentFeedbackType,
      step: feedbackStep
    });
  }

  function expandFeedback(): void {
    showMinimized = false;
    
    uxAnalytics.trackEvent('feedback', {
      action: 'expanded',
      type: currentFeedbackType,
      step: feedbackStep
    });
  }

  function nextQuestion(): void {
    if (canProceed && !isLastQuestion) {
      feedbackStep++;
    } else if (canProceed && isLastQuestion) {
      submitFeedback();
    }
  }

  function previousQuestion(): void {
    if (feedbackStep > 1) {
      feedbackStep--;
    }
  }

  function isQuestionAnswered(question: FeedbackQuestion): boolean {
    if (!question) return false;

    switch (question.type) {
      case 'rating':
        return specificRatings[question.id] > 0;
      case 'text':
        return !question.required || (feedbackText.trim().length > 0);
      case 'boolean':
        return wouldRecommend !== null;
      case 'single_choice':
      case 'multiple_choice':
        return !question.required || selectedIssues.length > 0;
      default:
        return true;
    }
  }

  async function submitFeedback(): Promise<void> {
    isSubmitting = true;
    
    const context: FeedbackContext = {
      route: currentRoute,
      step: bookingStep,
      device: userDevice,
      timestamp: Date.now(),
      sessionDuration: Date.now() - feedbackStartTime,
      triggeredBy: currentFeedbackType,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      connectionType: (navigator as any).connection?.effectiveType
    };

    const metadata: FeedbackMetadata = {
      isFirstTime: !localStorage.getItem('user-visited-before'),
      completedBookings: parseInt(localStorage.getItem('completed-bookings') || '0'),
      favoriteProviders: parseInt(localStorage.getItem('favorite-providers') || '0'),
      preferredPaymentMethod: localStorage.getItem('preferred-payment'),
      languagePreference: 'es-AR'
    };

    try {
      // Compile feedback data
      const feedbackData = {
        type: currentFeedbackType,
        overallRating,
        specificRatings,
        feedbackText,
        selectedIssues,
        improvementSuggestions,
        wouldRecommend,
        experienceEmoji,
        context,
        metadata
      };

      // Submit to backend
      await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      // Track successful submission
      uxAnalytics.trackEvent('feedback', {
        action: 'submitted',
        type: currentFeedbackType,
        rating: overallRating,
        textLength: feedbackText.length,
        issuesCount: selectedIssues.length
      });

      // Dispatch event
      dispatch('feedbackSubmitted', {
        type: currentFeedbackType,
        rating: overallRating,
        feedback: feedbackText,
        context,
        metadata
      });

      // Store last feedback time
      localStorage.setItem('last-feedback-time', Date.now().toString());

      // Show thank you
      showThankYou = true;
      setTimeout(() => {
        resetFeedback();
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      uxAnalytics.trackEvent('feedback', {
        action: 'submission_failed',
        type: currentFeedbackType,
        error: error.message
      });
    } finally {
      isSubmitting = false;
    }
  }

  function setRating(questionId: string, rating: number): void {
    specificRatings[questionId] = rating;
    if (questionId === 'overall_experience') {
      overallRating = rating;
    }
  }

  function toggleIssue(issue: string): void {
    if (selectedIssues.includes(issue)) {
      selectedIssues = selectedIssues.filter(i => i !== issue);
    } else {
      if (currentQuestion.maxSelections && selectedIssues.length >= currentQuestion.maxSelections) {
        selectedIssues = [...selectedIssues.slice(1), issue];
      } else {
        selectedIssues = [...selectedIssues, issue];
      }
    }
  }

  function selectSingleIssue(issue: string): void {
    selectedIssues = [issue];
  }

  function setEmoji(emoji: string): void {
    experienceEmoji = emoji;
  }

  // Public methods for external triggering
  export function triggerBookingFeedback(): void {
    triggerFeedback('booking_completed', 2000);
  }

  export function triggerAbandonmentFeedback(): void {
    triggerFeedback('booking_abandoned', 15000);
  }

  export function triggerErrorFeedback(): void {
    triggerFeedback('error_encountered', 5000);
  }

  export function triggerMobileFeedback(): void {
    triggerFeedback('mobile_experience');
  }

  export function triggerPaymentFeedback(): void {
    triggerFeedback('mercadopago_experience', 3000);
  }
</script>

{#if showFeedback && currentConfig.title}
  <div class="feedback-overlay fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
    {#if showThankYou}
      <!-- Thank you message -->
      <div 
        class="feedback-panel bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        in:scale={{ duration: 400 }}
        out:scale={{ duration: 300 }}
      >
        <div class="text-6xl mb-4">🙏</div>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">¡Gracias!</h3>
        <p class="text-gray-600 mb-4">
          Tu opinión nos ayuda a hacer BarberPro mejor para todos los argentinos.
        </p>
        <div class="text-sm text-blue-600 font-medium">
          Cerrando automáticamente...
        </div>
      </div>
    {:else if showMinimized}
      <!-- Minimized feedback -->
      <div 
        class="feedback-minimized fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
        on:click={expandFeedback}
        in:scale={{ duration: 300 }}
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    {:else}
      <!-- Main feedback panel -->
      <div 
        class="feedback-panel bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        in:fly={{ y: userDevice === 'mobile' ? 100 : 0, duration: 400 }}
        out:fly={{ y: userDevice === 'mobile' ? 100 : 0, duration: 300 }}
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xl font-bold">{currentConfig.title}</h3>
            <div class="flex items-center space-x-2">
              <button
                class="p-1 text-blue-100 hover:text-white rounded"
                on:click={minimizeFeedback}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                class="p-1 text-blue-100 hover:text-white rounded"
                on:click={() => closeFeedback('user_closed')}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {#if currentConfig.subtitle}
            <p class="text-blue-100">{currentConfig.subtitle}</p>
          {/if}
        </div>

        <!-- Progress indicator -->
        <div class="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">
              Pregunta {feedbackStep} de {currentConfig.questions.length}
            </span>
            <span class="text-xs text-gray-500">
              {Math.round((feedbackStep / currentConfig.questions.length) * 100)}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style="width: {(feedbackStep / currentConfig.questions.length) * 100}%"
            ></div>
          </div>
        </div>

        <!-- Question content -->
        {#if currentQuestion}
          <div class="p-6" in:fade={{ duration: 300 }}>
            <h4 class="text-lg font-semibold text-gray-800 mb-4">
              {currentQuestion.title}
            </h4>

            {#if currentQuestion.type === 'rating'}
              <!-- Rating question -->
              <div class="space-y-4">
                <div class="flex items-center justify-center space-x-2 mb-4">
                  {#each Array(currentQuestion.scale || 5) as _, i}
                    <button
                      class={`w-10 h-10 rounded-full border-2 transition-all ${
                        (specificRatings[currentQuestion.id] || 0) > i
                          ? 'bg-yellow-400 border-yellow-400 text-white'
                          : 'border-gray-300 text-gray-400 hover:border-yellow-300'
                      }`}
                      on:click={() => setRating(currentQuestion.id, i + 1)}
                    >
                      ⭐
                    </button>
                  {/each}
                </div>
                
                {#if currentQuestion.labels && specificRatings[currentQuestion.id]}
                  <div class="text-center text-sm text-gray-600">
                    {currentQuestion.labels[specificRatings[currentQuestion.id] - 1]}
                  </div>
                {/if}
              </div>

            {:else if currentQuestion.type === 'text'}
              <!-- Text question -->
              <textarea
                bind:value={feedbackText}
                placeholder={currentQuestion.placeholder || 'Escribe tu respuesta aquí...'}
                maxlength={currentQuestion.maxLength || 1000}
                class="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
              ></textarea>
              {#if currentQuestion.maxLength}
                <div class="text-xs text-gray-500 mt-1 text-right">
                  {feedbackText.length}/{currentQuestion.maxLength}
                </div>
              {/if}

            {:else if currentQuestion.type === 'boolean'}
              <!-- Yes/No question -->
              <div class="space-y-2">
                <button
                  class={`w-full p-3 rounded-lg border-2 transition-colors ${
                    wouldRecommend === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                  on:click={() => wouldRecommend = true}
                >
                  👍 Sí
                </button>
                <button
                  class={`w-full p-3 rounded-lg border-2 transition-colors ${
                    wouldRecommend === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                  on:click={() => wouldRecommend = false}
                >
                  👎 No
                </button>
              </div>

            {:else if currentQuestion.type === 'single_choice'}
              <!-- Single choice question -->
              <div class="space-y-2">
                {#each currentQuestion.options || [] as option}
                  <button
                    class={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                      selectedIssues.includes(option)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                    on:click={() => selectSingleIssue(option)}
                  >
                    {option}
                  </button>
                {/each}
              </div>

            {:else if currentQuestion.type === 'multiple_choice'}
              <!-- Multiple choice question -->
              <div class="space-y-2">
                {#each currentQuestion.options || [] as option}
                  <button
                    class={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                      selectedIssues.includes(option)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                    on:click={() => toggleIssue(option)}
                  >
                    <div class="flex items-center justify-between">
                      <span>{option}</span>
                      {#if selectedIssues.includes(option)}
                        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      {/if}
                    </div>
                  </button>
                {/each}
                {#if currentQuestion.maxSelections}
                  <div class="text-xs text-gray-500 mt-2">
                    Máximo {currentQuestion.maxSelections} opciones
                    ({selectedIssues.length}/{currentQuestion.maxSelections} seleccionadas)
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Navigation buttons -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div class="flex items-center justify-between">
              <button
                class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                on:click={previousQuestion}
                disabled={feedbackStep === 1}
              >
                ← Anterior
              </button>

              <div class="flex items-center space-x-3">
                <button
                  class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  on:click={() => closeFeedback('skipped')}
                >
                  Saltar
                </button>

                {#if isLastQuestion}
                  <button
                    class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    on:click={submitFeedback}
                    disabled={!canProceed || isSubmitting}
                  >
                    {#if isSubmitting}
                      <svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Enviando...</span>
                    {:else}
                      <span>Enviar</span>
                    {/if}
                  </button>
                {:else}
                  <button
                    class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    on:click={nextQuestion}
                    disabled={!canProceed}
                  >
                    Siguiente →
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .feedback-overlay {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  
  .feedback-panel {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .feedback-minimized {
    animation: pulse-notification 2s infinite;
  }
  
  @keyframes pulse-notification {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  
  /* Argentina mobile optimizations */
  @media (max-width: 640px) {
    .feedback-panel {
      margin-bottom: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      max-height: 90vh;
    }
    
    .feedback-overlay {
      align-items: flex-end;
      padding: 0;
    }
  }
  
  /* High contrast support */
  @media (prefers-contrast: high) {
    .feedback-panel {
      border: 3px solid #000;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .feedback-minimized {
      animation: none;
    }
  }
  
  /* Custom scrollbar for mobile */
  .feedback-panel::-webkit-scrollbar {
    width: 4px;
  }
  
  .feedback-panel::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.3);
    border-radius: 2px;
  }
</style>