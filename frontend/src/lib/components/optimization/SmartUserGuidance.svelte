<script lang="ts">
  // Smart User Guidance Component - Argentina Market Optimizations
  // Provides contextual help and guidance based on user behavior patterns
  
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  const dispatch = createEventDispatcher<{
    guidanceInteraction: { type: string; action: string; helpful: boolean };
    errorRecoveryStarted: { originalError: string; guidanceType: string };
    onboardingCompleted: { completedSteps: string[]; timeSpent: number };
  }>();

  // Props
  export let currentRoute: string = '';
  export let userDevice: 'mobile' | 'tablet' | 'desktop' = 'mobile';
  export let connectionType: string = '4g';
  export let isFirstVisit: boolean = false;
  export let hasBookingErrors: boolean = false;
  export let bookingStep: string = '';
  export let userLocation: string = 'argentina';

  // Guidance state
  let showGuidance: boolean = false;
  let guidanceType: GuidanceType = 'none';
  let guidanceContent: GuidanceContent | null = null;
  let isMinimized: boolean = false;
  let userInteracted: boolean = false;
  let showOnboarding: boolean = false;

  type GuidanceType = 
    | 'none'
    | 'first_visit_onboarding'
    | 'booking_flow_help'
    | 'error_recovery'
    | 'mobile_optimization_tips'
    | 'argentina_payment_help'
    | 'connection_quality_notice'
    | 'booking_abandonment_recovery'
    | 'accessibility_assistance';

  interface GuidanceContent {
    title: string;
    message: string;
    steps?: GuidanceStep[];
    actions?: GuidanceAction[];
    helpfulLinks?: HelpfulLink[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    autoShow: boolean;
    showDuration?: number;
  }

  interface GuidanceStep {
    step: number;
    title: string;
    description: string;
    visual?: string;
    interactive?: boolean;
  }

  interface GuidanceAction {
    type: 'button' | 'link' | 'phone' | 'whatsapp';
    label: string;
    action: string;
    primary?: boolean;
    icon?: string;
  }

  interface HelpfulLink {
    label: string;
    url: string;
    external?: boolean;
  }

  // Argentina-specific guidance content
  const guidanceDatabase: Record<GuidanceType, GuidanceContent> = {
    none: { title: '', message: '', priority: 'low', autoShow: false },
    
    first_visit_onboarding: {
      title: '¡Bienvenido a BarberPro! 🇦🇷',
      message: 'Te ayudamos a encontrar y reservar con los mejores barberos de Argentina.',
      steps: [
        {
          step: 1,
          title: 'Buscar Barberos',
          description: 'Usa la búsqueda para encontrar barberos cerca tuyo',
          visual: 'search-demo.gif',
          interactive: true
        },
        {
          step: 2,
          title: 'Ver Perfiles',
          description: 'Revisa calificaciones, fotos y servicios disponibles',
          visual: 'profile-demo.gif'
        },
        {
          step: 3,
          title: 'Reservar Cita',
          description: 'Elige fecha, hora y confirma tu reserva',
          visual: 'booking-demo.gif',
          interactive: true
        },
        {
          step: 4,
          title: 'Pagar Fácil',
          description: 'Paga con MercadoPago, efectivo o tarjeta',
          visual: 'payment-demo.gif'
        }
      ],
      actions: [
        {
          type: 'button',
          label: 'Comenzar Tour',
          action: 'start-onboarding',
          primary: true,
          icon: 'play'
        },
        {
          type: 'button',
          label: 'Saltar',
          action: 'skip-onboarding'
        }
      ],
      priority: 'medium',
      autoShow: true,
      showDuration: 30000
    },

    booking_flow_help: {
      title: 'Ayuda con tu Reserva',
      message: 'Te guiamos paso a paso para completar tu reserva exitosamente.',
      steps: [
        {
          step: 1,
          title: 'Selecciona tu Servicio',
          description: 'Elige el corte o servicio que deseas',
          interactive: true
        },
        {
          step: 2,
          title: 'Fecha y Hora',
          description: 'Selecciona cuando quieres tu cita',
          interactive: true
        },
        {
          step: 3,
          title: 'Datos de Contacto',
          description: 'Completa tu información para confirmar',
          interactive: true
        }
      ],
      actions: [
        {
          type: 'whatsapp',
          label: 'Ayuda por WhatsApp',
          action: 'whatsapp://send?phone=5491123456789&text=Necesito%20ayuda%20con%20mi%20reserva',
          icon: 'whatsapp'
        }
      ],
      priority: 'high',
      autoShow: true
    },

    error_recovery: {
      title: 'Ups, algo salió mal',
      message: 'No te preocupes, te ayudamos a solucionarlo rápidamente.',
      steps: [
        {
          step: 1,
          title: 'Verificar Conexión',
          description: 'Asegúrate de tener conexión a internet estable'
        },
        {
          step: 2,
          title: 'Recargar Página',
          description: 'Intenta recargar la página y volver a intentar'
        },
        {
          step: 3,
          title: 'Cambiar Horario',
          description: 'Es posible que el horario ya no esté disponible'
        }
      ],
      actions: [
        {
          type: 'button',
          label: 'Reintentar',
          action: 'retry-booking',
          primary: true,
          icon: 'refresh'
        },
        {
          type: 'phone',
          label: 'Llamar Soporte',
          action: 'tel:+5491123456789',
          icon: 'phone'
        }
      ],
      priority: 'urgent',
      autoShow: true
    },

    mobile_optimization_tips: {
      title: 'Optimizado para tu Móvil 📱',
      message: 'Aprovecha al máximo BarberPro en tu teléfono con estos consejos.',
      steps: [
        {
          step: 1,
          title: 'Agregar a Inicio',
          description: 'Instala BarberPro como app en tu teléfono',
          visual: 'install-pwa.gif'
        },
        {
          step: 2,
          title: 'Notificaciones',
          description: 'Activa las notificaciones para recordatorios',
          interactive: true
        },
        {
          step: 3,
          title: 'Modo Offline',
          description: 'Consulta tus reservas sin conexión'
        }
      ],
      actions: [
        {
          type: 'button',
          label: 'Instalar App',
          action: 'install-pwa',
          primary: true,
          icon: 'download'
        }
      ],
      priority: 'low',
      autoShow: false
    },

    argentina_payment_help: {
      title: 'Pagos en Argentina 💳',
      message: 'Conoce todas las formas de pago disponibles para tu comodidad.',
      steps: [
        {
          step: 1,
          title: 'MercadoPago',
          description: 'Paga con tu cuenta MP, tarjetas o efectivo',
          visual: 'mercadopago-demo.gif'
        },
        {
          step: 2,
          title: 'Cuotas sin Interés',
          description: 'Aprovecha las promociones bancarias',
        },
        {
          step: 3,
          title: 'Efectivo',
          description: 'También puedes pagar directamente en el local'
        }
      ],
      actions: [
        {
          type: 'link',
          label: 'Ver Promociones',
          action: '/promociones-pago',
          icon: 'tag'
        }
      ],
      helpfulLinks: [
        {
          label: 'Ayuda MercadoPago',
          url: 'https://www.mercadopago.com.ar/ayuda',
          external: true
        }
      ],
      priority: 'medium',
      autoShow: false
    },

    connection_quality_notice: {
      title: 'Conexión Lenta Detectada 📶',
      message: 'Optimizamos tu experiencia para conexiones lentas.',
      steps: [
        {
          step: 1,
          title: 'Modo Datos',
          description: 'Reducimos el uso de datos automáticamente'
        },
        {
          step: 2,
          title: 'Búsqueda Rápida',
          description: 'Usa filtros para encontrar más rápido'
        },
        {
          step: 3,
          title: 'Guardar Favoritos',
          description: 'Guarda barberos para acceso offline'
        }
      ],
      actions: [
        {
          type: 'button',
          label: 'Activar Modo Ahorro',
          action: 'enable-data-saver',
          primary: true,
          icon: 'wifi'
        }
      ],
      priority: 'medium',
      autoShow: true
    },

    booking_abandonment_recovery: {
      title: '¿Necesitas Ayuda? 🤝',
      message: 'Vemos que estuviste reservando. ¿Te ayudamos a completarlo?',
      steps: [
        {
          step: 1,
          title: 'Continuar Reserva',
          description: 'Retomamos donde te quedaste'
        },
        {
          step: 2,
          title: 'Cambiar Preferencias',
          description: 'Podemos sugerir otras opciones'
        },
        {
          step: 3,
          title: 'Asistencia Personal',
          description: 'Un agente te puede ayudar por WhatsApp'
        }
      ],
      actions: [
        {
          type: 'button',
          label: 'Continuar Reserva',
          action: 'resume-booking',
          primary: true,
          icon: 'play'
        },
        {
          type: 'whatsapp',
          label: 'Ayuda WhatsApp',
          action: 'whatsapp://send?phone=5491123456789&text=Necesito%20ayuda%20para%20reservar',
          icon: 'whatsapp'
        }
      ],
      priority: 'high',
      autoShow: true,
      showDuration: 45000
    },

    accessibility_assistance: {
      title: 'Asistencia de Accesibilidad ♿',
      message: 'Configuraciones para mejorar tu experiencia.',
      steps: [
        {
          step: 1,
          title: 'Texto Grande',
          description: 'Aumentar el tamaño de texto'
        },
        {
          step: 2,
          title: 'Alto Contraste',
          description: 'Mejorar la legibilidad'
        },
        {
          step: 3,
          title: 'Navegación por Voz',
          description: 'Usar comandos de voz'
        }
      ],
      actions: [
        {
          type: 'button',
          label: 'Configurar Accesibilidad',
          action: 'open-accessibility',
          primary: true,
          icon: 'settings'
        }
      ],
      priority: 'high',
      autoShow: false
    }
  };

  // Determine guidance type based on context
  function determineGuidanceType(): GuidanceType {
    // First visit onboarding
    if (isFirstVisit && currentRoute === '/') {
      return 'first_visit_onboarding';
    }

    // Error recovery
    if (hasBookingErrors) {
      return 'error_recovery';
    }

    // Booking flow help
    if (currentRoute.includes('/booking') || bookingStep) {
      return 'booking_flow_help';
    }

    // Mobile optimization for mobile users
    if (userDevice === 'mobile' && !localStorage.getItem('mobile-tips-shown')) {
      return 'mobile_optimization_tips';
    }

    // Connection quality notice
    if (connectionType === '2g' || connectionType === 'slow-2g') {
      return 'connection_quality_notice';
    }

    // Payment help for Argentina users
    if (currentRoute.includes('/payment') && userLocation === 'argentina') {
      return 'argentina_payment_help';
    }

    // Booking abandonment recovery (would be triggered by analytics)
    if (currentRoute === '/' && localStorage.getItem('abandoned-booking')) {
      return 'booking_abandonment_recovery';
    }

    return 'none';
  }

  onMount(() => {
    // Initialize guidance based on context
    const newGuidanceType = determineGuidanceType();
    if (newGuidanceType !== 'none') {
      showGuidanceType(newGuidanceType);
    }

    // Track guidance shown
    uxAnalytics.trackEvent('guidance', {
      action: 'initialized',
      route: currentRoute,
      device: userDevice,
      guidanceType: newGuidanceType
    });
  });

  function showGuidanceType(type: GuidanceType): void {
    guidanceType = type;
    guidanceContent = guidanceDatabase[type];
    
    if (guidanceContent?.autoShow) {
      showGuidance = true;
      
      // Auto-hide after duration
      if (guidanceContent.showDuration) {
        setTimeout(() => {
          if (!userInteracted) {
            hideGuidance();
          }
        }, guidanceContent.showDuration);
      }
    }

    // Track guidance shown
    uxAnalytics.trackEvent('guidance', {
      action: 'shown',
      guidanceType: type,
      priority: guidanceContent?.priority,
      autoShow: guidanceContent?.autoShow
    });
  }

  function hideGuidance(): void {
    showGuidance = false;
    isMinimized = false;
    
    // Track guidance hidden
    uxAnalytics.trackEvent('guidance', {
      action: 'hidden',
      guidanceType,
      userInteracted,
      timeShown: Date.now() - (guidanceContent?.showDuration || 0)
    });
  }

  function minimizeGuidance(): void {
    isMinimized = true;
    userInteracted = true;
  }

  function expandGuidance(): void {
    isMinimized = false;
    userInteracted = true;
  }

  function handleActionClick(action: GuidanceAction): void {
    userInteracted = true;
    
    // Track action click
    uxAnalytics.trackEvent('guidance', {
      action: 'action_clicked',
      actionType: action.type,
      actionLabel: action.label,
      guidanceType
    });

    dispatch('guidanceInteraction', {
      type: guidanceType,
      action: action.action,
      helpful: true
    });

    // Handle different action types
    switch (action.type) {
      case 'button':
        handleButtonAction(action.action);
        break;
      case 'link':
        window.location.href = action.action;
        break;
      case 'phone':
        window.open(action.action);
        break;
      case 'whatsapp':
        window.open(action.action);
        break;
    }
  }

  function handleButtonAction(actionType: string): void {
    switch (actionType) {
      case 'start-onboarding':
        startOnboarding();
        break;
      case 'skip-onboarding':
        skipOnboarding();
        break;
      case 'retry-booking':
        retryBooking();
        break;
      case 'install-pwa':
        installPWA();
        break;
      case 'enable-data-saver':
        enableDataSaver();
        break;
      case 'resume-booking':
        resumeBooking();
        break;
      case 'open-accessibility':
        openAccessibilitySettings();
        break;
    }
  }

  function startOnboarding(): void {
    showOnboarding = true;
    hideGuidance();
  }

  function skipOnboarding(): void {
    localStorage.setItem('onboarding-completed', 'true');
    hideGuidance();
  }

  function retryBooking(): void {
    dispatch('errorRecoveryStarted', {
      originalError: 'booking_failed',
      guidanceType: 'error_recovery'
    });
    // Trigger booking retry logic
    window.location.reload();
  }

  function installPWA(): void {
    // PWA installation logic would be handled by the app
    localStorage.setItem('pwa-install-requested', 'true');
    hideGuidance();
  }

  function enableDataSaver(): void {
    localStorage.setItem('data-saver-mode', 'true');
    // Trigger data saver mode
    document.documentElement.classList.add('data-saver-mode');
    hideGuidance();
  }

  function resumeBooking(): void {
    const abandonedBooking = localStorage.getItem('abandoned-booking');
    if (abandonedBooking) {
      const bookingData = JSON.parse(abandonedBooking);
      // Navigate to booking flow with saved data
      window.location.href = `/booking/resume?data=${encodeURIComponent(abandonedBooking)}`;
    }
  }

  function openAccessibilitySettings(): void {
    // Open accessibility settings modal/page
    window.location.href = '/configuracion/accesibilidad';
  }

  function markAsHelpful(): void {
    userInteracted = true;
    dispatch('guidanceInteraction', {
      type: guidanceType,
      action: 'marked_helpful',
      helpful: true
    });
    
    uxAnalytics.trackEvent('guidance', {
      action: 'marked_helpful',
      guidanceType
    });
  }

  function markAsNotHelpful(): void {
    userInteracted = true;
    dispatch('guidanceInteraction', {
      type: guidanceType,
      action: 'marked_not_helpful',
      helpful: false
    });
    
    uxAnalytics.trackEvent('guidance', {
      action: 'marked_not_helpful',
      guidanceType
    });
    
    hideGuidance();
  }

  // Expose methods for external triggering
  export function triggerGuidance(type: GuidanceType): void {
    showGuidanceType(type);
  }

  export function triggerErrorRecovery(errorType: string): void {
    showGuidanceType('error_recovery');
  }

  export function triggerBookingHelp(): void {
    showGuidanceType('booking_flow_help');
  }
</script>

{#if showGuidance && guidanceContent}
  <div 
    class="smart-guidance-overlay fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div 
      class={`smart-guidance-panel bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden ${
        isMinimized ? 'h-16' : 'h-auto'
      }`}
      in:fly={{ y: userDevice === 'mobile' ? 100 : 0, duration: 400 }}
      out:fly={{ y: userDevice === 'mobile' ? 100 : 0, duration: 300 }}
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div class="flex items-center space-x-3">
          <!-- Priority indicator -->
          <div class={`w-3 h-3 rounded-full ${
            guidanceContent.priority === 'urgent' ? 'bg-red-500' :
            guidanceContent.priority === 'high' ? 'bg-orange-500' :
            guidanceContent.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
          }`}></div>
          <h3 class="font-bold text-gray-800 text-lg">{guidanceContent.title}</h3>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- Minimize/Expand button -->
          <button
            class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            on:click={isMinimized ? expandGuidance : minimizeGuidance}
          >
            {#if isMinimized}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            {/if}
          </button>
          
          <!-- Close button -->
          <button
            class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            on:click={hideGuidance}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {#if !isMinimized}
        <!-- Content -->
        <div class="p-4" in:slide={{ duration: 300 }}>
          <!-- Message -->
          <p class="text-gray-600 mb-4">{guidanceContent.message}</p>

          <!-- Steps -->
          {#if guidanceContent.steps}
            <div class="space-y-3 mb-6">
              {#each guidanceContent.steps as step}
                <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-1">{step.title}</h4>
                    <p class="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Actions -->
          {#if guidanceContent.actions}
            <div class="space-y-3 mb-4">
              {#each guidanceContent.actions as action}
                <button
                  class={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    action.primary
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  on:click={() => handleActionClick(action)}
                >
                  {#if action.icon}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <!-- Icon would be dynamically loaded based on action.icon -->
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  {/if}
                  <span>{action.label}</span>
                </button>
              {/each}
            </div>
          {/if}

          <!-- Helpful links -->
          {#if guidanceContent.helpfulLinks}
            <div class="border-t border-gray-100 pt-4">
              <h5 class="text-sm font-semibold text-gray-700 mb-2">Enlaces útiles:</h5>
              <div class="space-y-2">
                {#each guidanceContent.helpfulLinks as link}
                  <a
                    href={link.url}
                    class="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    target={link.external ? '_blank' : '_self'}
                    rel={link.external ? 'noopener noreferrer' : ''}
                  >
                    {link.label}
                    {#if link.external}
                      <svg class="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    {/if}
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Feedback -->
        <div class="border-t border-gray-100 p-4 bg-gray-50">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">¿Te fue útil esta ayuda?</span>
            <div class="flex items-center space-x-2">
              <button
                class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                on:click={markAsHelpful}
              >
                👍 Sí
              </button>
              <button
                class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                on:click={markAsNotHelpful}
              >
                👎 No
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .smart-guidance-overlay {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  
  .smart-guidance-panel {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: gentle-pulse 2s ease-in-out infinite;
  }
  
  @keyframes gentle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.98; }
  }
  
  /* Argentina market mobile optimizations */
  @media (max-width: 640px) {
    .smart-guidance-panel {
      margin-bottom: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      max-height: 85vh;
    }
    
    .smart-guidance-overlay {
      align-items: flex-end;
    }
  }
  
  /* High contrast mode for accessibility */
  @media (prefers-contrast: high) {
    .smart-guidance-panel {
      border: 2px solid #000;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .smart-guidance-panel {
      animation: none;
    }
  }
</style>