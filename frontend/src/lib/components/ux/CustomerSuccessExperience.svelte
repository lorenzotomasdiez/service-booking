<!--
  Customer Success & Retention Experience Design - D11-001
  Proactive health monitoring with empathy-driven interaction design
  Customer segmentation with personalized engagement strategies
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'dashboard' | 'support' | 'feedback' | 'segmentation' | 'retention' | 'lifetime-value' = 'dashboard';
  export let customerData: any = null;
  export let argentinaOptimized: boolean = true;
  export let empathyMode: boolean = true;
  export let proactiveMode: boolean = true;

  const dispatch = createEventDispatcher<{
    healthAction: { customer: string; action: string; urgency: 'low' | 'medium' | 'high' };
    supportInteraction: { type: string; satisfaction: number; resolutionTime: number };
    retentionStrategy: { segment: string; strategy: string; predictedImpact: number };
    lifetimeValueOptimization: { customer: string; currentValue: number; potentialValue: number };
  }>();

  // Customer Success Data & Health Monitoring
  const customerSuccessData = {
    healthMetrics: {
      overall: 87.5, // Customer Health Score out of 100
      engagement: 92.3,
      satisfaction: 89.1,
      retention_risk: 12.8,
      lifetime_value: 24500 // ARS
    },
    segmentation: {
      champions: { count: 145, percentage: 23, characteristics: ['Alta frecuencia', 'Alta satisfacción', 'Recomiendan activamente'] },
      loyal_customers: { count: 287, percentage: 46, characteristics: ['Uso regular', 'Satisfechos', 'Baja rotación'] },
      at_risk: { count: 89, percentage: 14, characteristics: ['Uso decreciente', 'Quejas recientes', 'Cancelaciones'] },
      new_customers: { count: 103, percentage: 17, characteristics: ['Menos de 3 meses', 'En evaluación', 'Potencial crecimiento'] }
    },
    proactiveInterventions: [
      {
        trigger: 'booking_decline',
        customer: 'María González',
        risk_level: 'high',
        last_booking: '15 días atrás',
        intervention: 'Oferta personalizada + llamada de seguimiento',
        success_probability: 78
      },
      {
        trigger: 'satisfaction_drop',
        customer: 'Carlos Mendez',
        risk_level: 'medium',
        issue: 'Calificación 3★ en última reserva',
        intervention: 'Contacto empático + descuento de disculpa',
        success_probability: 85
      },
      {
        trigger: 'payment_issues',
        customer: 'Sofia Martinez',
        risk_level: 'medium',
        issue: 'Fallo en pago MercadoPago',
        intervention: 'Asistencia técnica + método de pago alternativo',
        success_probability: 92
      }
    ],
    supportChannels: {
      whatsapp: { usage: 67, satisfaction: 4.8, avg_resolution: '12 minutos' },
      email: { usage: 25, satisfaction: 4.3, avg_resolution: '2.5 horas' },
      phone: { usage: 8, satisfaction: 4.9, avg_resolution: '8 minutos' }
    },
    feedbackInsights: {
      nps_score: 74,
      satisfaction_trends: {
        current_month: 89.1,
        previous_month: 87.3,
        improvement: +1.8
      },
      common_praise: [
        'Facilidad de uso de la plataforma',
        'Profesionales de alta calidad',
        'Atención al cliente excelente',
        'Pagos seguros con MercadoPago'
      ],
      improvement_areas: [
        'Mayor variedad de horarios',
        'Más opciones de cancelación',
        'Notificaciones más claras',
        'Descuentos por fidelidad'
      ]
    },
    retentionStrategies: {
      loyalty_program: {
        name: 'BarberPro VIP',
        tiers: ['Bronce', 'Plata', 'Oro', 'Platinum'],
        benefits: ['Descuentos progresivos', 'Acceso prioritario', 'Servicios exclusivos'],
        impact: '+35% retención'
      },
      personalization: {
        preference_learning: 'IA que aprende gustos y horarios preferidos',
        predictive_booking: 'Sugerencias automáticas basadas en historial',
        custom_notifications: 'Mensajes personalizados por perfil',
        impact: '+28% engagement'
      }
    }
  };

  // Argentina-specific success patterns
  const argentinaSuccessPatterns = {
    communication_preferences: {
      whatsapp_first: 67, // Prefer WhatsApp as primary contact
      informal_tone: 89, // Prefer casual, friendly communication
      family_oriented: 73, // Family-focused messaging resonates
      local_references: 82 // Local cultural references increase engagement
    },
    retention_factors: {
      trust: 94, // Trust is the #1 retention factor in Argentina
      price_value: 87, // Price-to-value ratio is critical
      convenience: 91, // Convenience and time-saving highly valued
      social_proof: 84, // Recommendations from friends/family important
      customer_service: 92 // Personal, empathetic service expected
    },
    success_indicators: {
      repeat_bookings: 'Más de 3 reservas en 90 días',
      referrals: 'Al menos 1 referido activo',
      engagement: 'Interacción semanal con la plataforma',
      satisfaction: 'Calificación promedio >4.5 estrellas',
      payment_success: 'Pagos exitosos >95%'
    }
  };

  // Component State
  let currentData = writable({});
  let selectedCustomer = null;
  let interventionMode = false;
  let dashboardMetrics = {
    health_score: 0,
    interventions_today: 0,
    success_rate: 0,
    retention_improvement: 0
  };

  onMount(() => {
    initializeVariant();
    startHealthMonitoring();
    trackCustomerSuccessEngagement();
  });

  function initializeVariant() {
    switch (variant) {
      case 'dashboard':
        initializeSuccessDashboard();
        break;
      case 'support':
        initializeSupportExperience();
        break;
      case 'feedback':
        initializeFeedbackCollection();
        break;
      case 'segmentation':
        initializeSegmentationVisualization();
        break;
      case 'retention':
        initializeRetentionOptimization();
        break;
      case 'lifetime-value':
        initializeLifetimeValueExperience();
        break;
    }
  }

  function initializeSuccessDashboard() {
    currentData.set({
      ...customerSuccessData,
      realTimeAlerts: [
        { type: 'churn_risk', customer: 'Ana Silva', urgency: 'high', action: 'Contactar en próximas 2 horas' },
        { type: 'payment_failed', customer: 'Diego López', urgency: 'medium', action: 'Ofrecer asistencia técnica' },
        { type: 'high_satisfaction', customer: 'Laura Rodríguez', urgency: 'low', action: 'Solicitar referidos' }
      ],
      interventionQueue: customerSuccessData.proactiveInterventions
    });
    
    dashboardMetrics = {
      health_score: customerSuccessData.healthMetrics.overall,
      interventions_today: 12,
      success_rate: 87.3,
      retention_improvement: 15.2
    };
  }

  function initializeSupportExperience() {
    currentData.set({
      activeTickets: [
        {
          id: 'CS-2024-001',
          customer: 'María Fernández',
          issue: 'Problema con pago en MercadoPago',
          urgency: 'high',
          channel: 'whatsapp',
          created: Date.now() - 1800000, // 30 minutes ago
          status: 'in_progress',
          agent: 'Lucia Rodriguez',
          sentiment: 'frustrated'
        },
        {
          id: 'CS-2024-002',
          customer: 'Carlos Pérez',
          issue: 'Consulta sobre horarios disponibles',
          urgency: 'low',
          channel: 'email',
          created: Date.now() - 3600000, // 1 hour ago
          status: 'pending',
          agent: null,
          sentiment: 'neutral'
        }
      ],
      supportMetrics: customerSuccessData.supportChannels,
      empathyGuidelines: {
        greeting: 'Usar saludo cálido y personal',
        listening: 'Validar emociones antes de resolver',
        solution: 'Explicar paso a paso con paciencia',
        followup: 'Confirmar satisfacción y ofrecer ayuda adicional'
      }
    });
  }

  function initializeFeedbackCollection() {
    currentData.set({
      ...customerSuccessData.feedbackInsights,
      activeSurveys: [
        {
          name: 'Post-Service Experience',
          completion_rate: 78,
          avg_rating: 4.6,
          engagement_score: 85
        },
        {
          name: 'Platform Usability',
          completion_rate: 62,
          avg_rating: 4.3,
          engagement_score: 71
        }
      ],
      feedbackChannels: [
        { channel: 'In-app prompts', effectiveness: 89, response_rate: 34 },
        { channel: 'WhatsApp surveys', effectiveness: 94, response_rate: 67 },
        { channel: 'Email campaigns', effectiveness: 71, response_rate: 23 }
      ]
    });
  }

  function initializeSegmentationVisualization() {
    currentData.set({
      segments: customerSuccessData.segmentation,
      segmentInsights: {
        champions: {
          growth_strategy: 'Programa de embajadores',
          retention_rate: 96,
          ltv_multiplier: 3.2
        },
        loyal_customers: {
          growth_strategy: 'Upselling servicios premium',
          retention_rate: 89,
          ltv_multiplier: 2.1
        },
        at_risk: {
          growth_strategy: 'Intervención proactiva urgente',
          retention_rate: 34,
          ltv_multiplier: 0.7
        },
        new_customers: {
          growth_strategy: 'Onboarding personalizado',
          retention_rate: 67,
          ltv_multiplier: 1.4
        }
      }
    });
  }

  function initializeRetentionOptimization() {
    currentData.set({
      ...customerSuccessData.retentionStrategies,
      retentionCampaigns: [
        {
          name: 'Win-Back Campaign',
          target_segment: 'at_risk',
          strategy: 'Descuento 40% + llamada personal',
          predicted_recovery: 73,
          cost_per_recovery: 850 // ARS
        },
        {
          name: 'Loyalty Upgrade',
          target_segment: 'loyal_customers',
          strategy: 'Upgrade gratuito a premium por 3 meses',
          predicted_upgrade: 42,
          ltv_increase: 2800 // ARS
        }
      ],
      retentionMetrics: {
        monthly_churn: 4.2,
        yearly_retention: 87.3,
        intervention_success: 78.9,
        cost_of_acquisition: 1200 // ARS
      }
    });
  }

  function initializeLifetimeValueExperience() {
    currentData.set({
      ltvSegments: [
        { segment: 'High Value', count: 89, avg_ltv: 45000, potential: 67000, actions: ['Premium upsell', 'VIP treatment'] },
        { segment: 'Growing Value', count: 234, avg_ltv: 18000, potential: 28000, actions: ['Service expansion', 'Frequency increase'] },
        { segment: 'Base Value', count: 445, avg_ltv: 8500, potential: 12500, actions: ['Engagement programs', 'Referral incentives'] }
      ],
      ltvDrivers: [
        { driver: 'Booking frequency', impact: 34, optimization: 'Automated reminders + incentives' },
        { driver: 'Service variety', impact: 28, optimization: 'Cross-service recommendations' },
        { driver: 'Premium features', impact: 23, optimization: 'Feature education + trials' },
        { driver: 'Referral activity', impact: 15, optimization: 'Enhanced referral rewards' }
      ]
    });
  }

  function startHealthMonitoring() {
    // Simulate real-time health monitoring
    setInterval(() => {
      if (proactiveMode) {
        checkCustomerHealth();
      }
    }, 30000); // Check every 30 seconds
  }

  function checkCustomerHealth() {
    // Simulate health check results
    const healthAlerts = Math.random();
    if (healthAlerts > 0.7) {
      triggerHealthAlert('customer_' + Math.floor(Math.random() * 1000), 'engagement_drop');
    }
  }

  function triggerHealthAlert(customerId: string, alertType: string) {
    const urgency = Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low';
    
    dispatch('healthAction', {
      customer: customerId,
      action: alertType,
      urgency
    });
  }

  function handleSupportInteraction(type: string, ticketData: any) {
    const satisfaction = Math.random() * 2 + 3; // 3-5 range
    const resolutionTime = Math.random() * 120 + 10; // 10-130 minutes
    
    dispatch('supportInteraction', { type, satisfaction, resolutionTime });
    
    uxAnalytics.trackExternalEvent('customer_support_interaction', {
      type,
      satisfaction,
      resolutionTime,
      channel: ticketData.channel,
      urgency: ticketData.urgency
    });
  }

  function handleRetentionAction(segment: string, strategy: string) {
    const predictedImpact = Math.random() * 20 + 10; // 10-30% impact
    
    dispatch('retentionStrategy', { segment, strategy, predictedImpact });
    
    uxAnalytics.trackExternalEvent('retention_strategy_applied', {
      segment,
      strategy,
      predictedImpact
    });
  }

  function trackCustomerSuccessEngagement() {
    uxAnalytics.trackExternalEvent('customer_success_dashboard_view', {
      variant,
      empathyMode,
      proactiveMode,
      argentinaOptimized
    });
  }

  function formatArgentinaCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `hace ${minutes} minutos`;
    if (hours < 24) return `hace ${hours} horas`;
    return `hace ${Math.floor(hours / 24)} días`;
  }

  function getSentimentColor(sentiment: string): string {
    const colors = {
      'frustrated': 'bg-red-100 text-red-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'satisfied': 'bg-green-100 text-green-800',
      'delighted': 'bg-blue-100 text-blue-800'
    };
    return colors[sentiment] || colors.neutral;
  }

  function getUrgencyColor(urgency: string): string {
    const colors = {
      'high': 'bg-red-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[urgency] || colors.low;
  }

  $: currentVariantData = $currentData;
</script>

<div class="customer-success-experience" class:empathy-mode={empathyMode} class:proactive-mode={proactiveMode}>
  {#if variant === 'dashboard'}
    <!-- Customer Success Dashboard -->
    <section class="dashboard-section bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Real-time Status -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Panel de Éxito del Cliente</h1>
            <p class="text-gray-600">Monitoreo proactivo y optimización de retención</p>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-green-700 font-medium">Sistema Activo</span>
              </div>
            </div>
            
            {#if proactiveMode}
              <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span class="text-blue-700 font-medium">🤖 IA Proactiva ON</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Key Metrics Dashboard -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-green-600 text-sm font-medium">Salud General</span>
              <span class="text-2xl">💚</span>
            </div>
            <div class="text-3xl font-bold text-green-700 mb-1">
              {dashboardMetrics.health_score.toFixed(1)}%
            </div>
            <div class="text-xs text-green-600">Score promedio de clientes</div>
          </div>

          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-blue-600 text-sm font-medium">Intervenciones Hoy</span>
              <span class="text-2xl">🚀</span>
            </div>
            <div class="text-3xl font-bold text-blue-700 mb-1">{dashboardMetrics.interventions_today}</div>
            <div class="text-xs text-blue-600">Acciones proactivas ejecutadas</div>
          </div>

          <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-purple-600 text-sm font-medium">Tasa de Éxito</span>
              <span class="text-2xl">🎯</span>
            </div>
            <div class="text-3xl font-bold text-purple-700 mb-1">
              {dashboardMetrics.success_rate.toFixed(1)}%
            </div>
            <div class="text-xs text-purple-600">Intervenciones exitosas</div>
          </div>

          <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-orange-600 text-sm font-medium">Mejora Retención</span>
              <span class="text-2xl">📈</span>
            </div>
            <div class="text-3xl font-bold text-orange-700 mb-1">
              +{dashboardMetrics.retention_improvement.toFixed(1)}%
            </div>
            <div class="text-xs text-orange-600">vs. mes anterior</div>
          </div>
        </div>

        <!-- Real-time Alerts -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">🚨 Alertas en Tiempo Real</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each currentVariantData.realTimeAlerts || [] as alert}
              <div class="bg-white border-l-4 rounded-lg p-6 shadow-lg transition-all hover:shadow-xl"
                   class:border-red-500={alert.urgency === 'high'}
                   class:border-yellow-500={alert.urgency === 'medium'}
                   class:border-green-500={alert.urgency === 'low'}
                   in:slide={{ delay: Math.random() * 500 }}>
                
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">
                      {#if alert.type === 'churn_risk'}⚠️
                      {:else if alert.type === 'payment_failed'}💳
                      {:else if alert.type === 'high_satisfaction'}⭐
                      {:else}🔔
                      {/if}
                    </span>
                    <div>
                      <div class="font-bold text-gray-900">{alert.customer}</div>
                      <div class="text-sm text-gray-600 capitalize">
                        {alert.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  
                  <span class="px-3 py-1 rounded-full text-xs font-bold {getUrgencyColor(alert.urgency)}">
                    {alert.urgency.toUpperCase()}
                  </span>
                </div>
                
                <p class="text-gray-700 text-sm mb-4">{alert.action}</p>
                
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full"
                        on:click={() => handleSupportInteraction('proactive_intervention', alert)}>
                  Tomar Acción
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Health Intervention Queue -->
        <div class="bg-gray-50 rounded-2xl p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">🎯 Cola de Intervenciones Proactivas</h2>
          <div class="space-y-4">
            {#each currentVariantData.interventionQueue || [] as intervention}
              <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-3">
                      <div class="flex items-center space-x-2">
                        <span class="text-lg font-bold text-gray-900">{intervention.customer}</span>
                        <span class="px-2 py-1 rounded-full text-xs font-bold {getUrgencyColor(intervention.risk_level)}">
                          {intervention.risk_level.toUpperCase()}
                        </span>
                      </div>
                      
                      <div class="text-sm text-gray-600">
                        Trigger: <span class="font-medium">{intervention.trigger.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div class="text-gray-700 mb-2">
                      <strong>Situación:</strong> {intervention.last_booking || intervention.issue}
                    </div>
                    
                    <div class="text-gray-700 mb-3">
                      <strong>Intervención sugerida:</strong> {intervention.intervention}
                    </div>
                    
                    <div class="flex items-center space-x-4">
                      <div class="text-sm text-green-600">
                        🎯 Probabilidad de éxito: <span class="font-bold">{intervention.success_probability}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="ml-6">
                    <button class="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            on:click={() => handleRetentionAction('at_risk', intervention.intervention)}>
                      Ejecutar
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'support'}
    <!-- Empathy-Driven Support Experience -->
    <section class="support-section bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">💝 Soporte con Empatía</h1>
          <p class="text-gray-700">Atención personalizada que comprende y resuelve</p>
        </div>

        <!-- Support Channel Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {#each Object.entries(currentVariantData.supportMetrics || {}) as [channel, metrics]}
            <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div class="text-center">
                <div class="text-3xl mb-3">
                  {#if channel === 'whatsapp'}💬
                  {:else if channel === 'email'}📧
                  {:else if channel === 'phone'}📞
                  {:else}💻
                  {/if}
                </div>
                
                <h3 class="text-lg font-bold text-gray-900 mb-4 capitalize">{channel}</h3>
                
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Uso:</span>
                    <span class="font-bold text-blue-600">{metrics.usage}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Satisfacción:</span>
                    <span class="font-bold text-green-600">{metrics.satisfaction}⭐</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Resolución:</span>
                    <span class="font-bold text-purple-600">{metrics.avg_resolution}</span>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Active Support Tickets -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">🎫 Tickets Activos</h2>
          <div class="space-y-6">
            {#each currentVariantData.activeTickets || [] as ticket}
              <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center space-x-4">
                    <div class="text-2xl">
                      {#if ticket.channel === 'whatsapp'}💬
                      {:else if ticket.channel === 'email'}📧
                      {:else}📞
                      {/if}
                    </div>
                    
                    <div>
                      <div class="font-bold text-lg text-gray-900">{ticket.customer}</div>
                      <div class="text-sm text-gray-600">ID: {ticket.id}</div>
                      <div class="text-sm text-gray-500">{getTimeAgo(ticket.created)}</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    <span class="px-3 py-1 rounded-full text-xs font-bold {getUrgencyColor(ticket.urgency)}">
                      {ticket.urgency.toUpperCase()}
                    </span>
                    
                    <span class="px-3 py-1 rounded-full text-xs font-medium {getSentimentColor(ticket.sentiment)}">
                      {ticket.sentiment}
                    </span>
                  </div>
                </div>
                
                <div class="mb-4">
                  <h4 class="font-medium text-gray-900 mb-2">Problema:</h4>
                  <p class="text-gray-700">{ticket.issue}</p>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-600">
                    {#if ticket.agent}
                      Asignado a: <span class="font-medium">{ticket.agent}</span>
                    {:else}
                      <span class="text-red-600 font-medium">Sin asignar</span>
                    {/if}
                  </div>
                  
                  <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          on:click={() => handleSupportInteraction('ticket_response', ticket)}>
                    Responder
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Empathy Guidelines -->
        {#if empathyMode}
          <div class="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">💖 Guías de Empatía</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {#each Object.entries(currentVariantData.empathyGuidelines || {}) as [phase, guideline]}
                <div class="bg-white rounded-lg p-6 shadow-sm border border-pink-100">
                  <div class="text-center">
                    <div class="text-3xl mb-3">
                      {#if phase === 'greeting'}👋
                      {:else if phase === 'listening'}👂
                      {:else if phase === 'solution'}🛠️
                      {:else if phase === 'followup'}🤝
                      {:else}💝
                      {/if}
                    </div>
                    
                    <h4 class="font-bold text-gray-900 mb-2 capitalize">{phase}</h4>
                    <p class="text-sm text-gray-700">{guideline}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'feedback'}
    <!-- Feedback Collection Experience -->
    <section class="feedback-section bg-white py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">📝 Recolección de Feedback</h1>
          <p class="text-gray-700">Escuchamos activamente para mejorar continuamente</p>
        </div>

        <!-- NPS and Satisfaction Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center border border-green-100">
            <div class="text-5xl font-bold text-green-600 mb-2">{currentVariantData.nps_score || 0}</div>
            <div class="text-lg font-medium text-green-700 mb-2">Net Promoter Score</div>
            <div class="text-sm text-green-600">Excelente - Clase Mundial</div>
          </div>
          
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 text-center border border-blue-100">
            <div class="text-5xl font-bold text-blue-600 mb-2">
              {currentVariantData.satisfaction_trends?.current_month?.toFixed(1) || 0}%
            </div>
            <div class="text-lg font-medium text-blue-700 mb-2">Satisfacción General</div>
            <div class="text-sm text-blue-600">
              {#if currentVariantData.satisfaction_trends?.improvement > 0}
                📈 +{currentVariantData.satisfaction_trends?.improvement?.toFixed(1)}% vs anterior
              {:else}
                📊 Estable vs anterior
              {/if}
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center border border-purple-100">
            <div class="text-5xl font-bold text-purple-600 mb-2">78%</div>
            <div class="text-lg font-medium text-purple-700 mb-2">Tasa de Respuesta</div>
            <div class="text-sm text-purple-600">Por encima del promedio</div>
          </div>
        </div>

        <!-- Feedback Channels Performance -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">📊 Rendimiento por Canal</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each currentVariantData.feedbackChannels || [] as channel}
              <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div class="text-center">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">{channel.channel}</h3>
                  
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Efectividad:</span>
                      <div class="flex items-center space-x-2">
                        <div class="w-20 bg-gray-200 rounded-full h-2">
                          <div class="bg-green-500 h-2 rounded-full" style="width: {channel.effectiveness}%"></div>
                        </div>
                        <span class="font-bold text-green-600">{channel.effectiveness}%</span>
                      </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Respuesta:</span>
                      <div class="flex items-center space-x-2">
                        <div class="w-20 bg-gray-200 rounded-full h-2">
                          <div class="bg-blue-500 h-2 rounded-full" style="width: {channel.response_rate}%"></div>
                        </div>
                        <span class="font-bold text-blue-600">{channel.response_rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Common Feedback Analysis -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Positive Feedback -->
          <div class="bg-green-50 rounded-xl p-8 border border-green-200">
            <h3 class="text-xl font-bold text-green-800 mb-6">✅ Lo que más valoran</h3>
            <div class="space-y-3">
              {#each currentVariantData.common_praise || [] as praise}
                <div class="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                  <div class="flex items-center space-x-3">
                    <span class="text-green-500 text-xl">👍</span>
                    <span class="text-gray-700">{praise}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Improvement Areas -->
          <div class="bg-yellow-50 rounded-xl p-8 border border-yellow-200">
            <h3 class="text-xl font-bold text-yellow-800 mb-6">🔧 Áreas de mejora</h3>
            <div class="space-y-3">
              {#each currentVariantData.improvement_areas || [] as area}
                <div class="bg-white rounded-lg p-4 shadow-sm border border-yellow-100">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <span class="text-yellow-500 text-xl">💡</span>
                      <span class="text-gray-700">{area}</span>
                    </div>
                    <button class="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Priorizar
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'segmentation'}
    <!-- Customer Segmentation Visualization -->
    <section class="segmentation-section bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">🎯 Segmentación de Clientes</h1>
          <p class="text-gray-700">Estrategias personalizadas por tipo de cliente</p>
        </div>

        <!-- Segmentation Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {#each Object.entries(currentVariantData.segments || {}) as [segmentName, segment]}
            <div class="bg-white rounded-xl p-6 shadow-lg border-l-4 hover:shadow-xl transition-shadow"
                 class:border-green-500={segmentName === 'champions'}
                 class:border-blue-500={segmentName === 'loyal_customers'}
                 class:border-red-500={segmentName === 'at_risk'}
                 class:border-yellow-500={segmentName === 'new_customers'}>
              
              <div class="text-center">
                <div class="text-3xl mb-3">
                  {#if segmentName === 'champions'}🏆
                  {:else if segmentName === 'loyal_customers'}💙
                  {:else if segmentName === 'at_risk'}⚠️
                  {:else if segmentName === 'new_customers'}🌟
                  {:else}👥
                  {/if}
                </div>
                
                <h3 class="text-lg font-bold text-gray-900 mb-2 capitalize">
                  {#if segmentName === 'champions'}Campeones
                  {:else if segmentName === 'loyal_customers'}Clientes Leales
                  {:else if segmentName === 'at_risk'}En Riesgo
                  {:else if segmentName === 'new_customers'}Nuevos Clientes
                  {:else}{segmentName.replace('_', ' ')}
                  {/if}
                </h3>
                
                <div class="text-2xl font-bold mb-1"
                     class:text-green-600={segmentName === 'champions'}
                     class:text-blue-600={segmentName === 'loyal_customers'}
                     class:text-red-600={segmentName === 'at_risk'}
                     class:text-yellow-600={segmentName === 'new_customers'}>
                  {segment.count}
                </div>
                
                <div class="text-sm font-medium mb-4"
                     class:text-green-700={segmentName === 'champions'}
                     class:text-blue-700={segmentName === 'loyal_customers'}
                     class:text-red-700={segmentName === 'at_risk'}
                     class:text-yellow-700={segmentName === 'new_customers'}>
                  {segment.percentage}% del total
                </div>
                
                <div class="text-xs text-gray-600">
                  <div class="font-medium mb-2">Características:</div>
                  <ul class="space-y-1">
                    {#each segment.characteristics as characteristic}
                      <li>• {characteristic}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Detailed Segment Insights -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">📈 Insights por Segmento</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {#each Object.entries(currentVariantData.segmentInsights || {}) as [segmentName, insights]}
              <div class="border border-gray-200 rounded-xl p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4 capitalize">
                  {#if segmentName === 'champions'}🏆 Campeones
                  {:else if segmentName === 'loyal_customers'}💙 Leales
                  {:else if segmentName === 'at_risk'}⚠️ En Riesgo
                  {:else if segmentName === 'new_customers'}🌟 Nuevos
                  {:else}{segmentName.replace('_', ' ')}
                  {/if}
                </h3>
                
                <div class="space-y-4">
                  <div>
                    <div class="text-sm font-medium text-gray-700 mb-1">Estrategia:</div>
                    <div class="text-sm text-gray-600">{insights.growth_strategy}</div>
                  </div>
                  
                  <div>
                    <div class="text-sm font-medium text-gray-700 mb-1">Retención:</div>
                    <div class="text-lg font-bold text-green-600">{insights.retention_rate}%</div>
                  </div>
                  
                  <div>
                    <div class="text-sm font-medium text-gray-700 mb-1">LTV Multiplier:</div>
                    <div class="text-lg font-bold text-blue-600">{insights.ltv_multiplier}x</div>
                  </div>
                  
                  <button class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                          on:click={() => handleRetentionAction(segmentName, insights.growth_strategy)}>
                    Aplicar Estrategia
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'retention'}
    <!-- Retention Optimization Experience -->
    <section class="retention-section bg-white py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">🔄 Optimización de Retención</h1>
          <p class="text-gray-700">Estrategias inteligentes para mantener clientes felices</p>
        </div>

        <!-- Retention Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {#each Object.entries(currentVariantData.retentionMetrics || {}) as [metric, value]}
            <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
              <div class="text-2xl font-bold mb-2"
                   class:text-green-600={metric.includes('retention')}
                   class:text-red-600={metric.includes('churn')}
                   class:text-blue-600={metric.includes('success')}
                   class:text-purple-600={metric.includes('cost')}>
                {#if typeof value === 'number'}
                  {#if metric.includes('cost')}
                    {formatArgentinaCurrency(value)}
                  {:else}
                    {value}%
                  {/if}
                {:else}
                  {value}
                {/if}
              </div>
              <div class="text-sm text-gray-700 capitalize">
                {#if metric === 'monthly_churn'}Churn Mensual
                {:else if metric === 'yearly_retention'}Retención Anual
                {:else if metric === 'intervention_success'}Éxito Intervenciones
                {:else if metric === 'cost_of_acquisition'}Costo Adquisición
                {:else}{metric.replace('_', ' ')}
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Active Retention Campaigns -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">🚀 Campañas de Retención Activas</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each currentVariantData.retentionCampaigns || [] as campaign}
              <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                <div class="text-center">
                  <h3 class="text-xl font-bold text-gray-900 mb-4">{campaign.name}</h3>
                  
                  <div class="bg-white rounded-lg p-4 mb-6">
                    <div class="text-sm text-gray-600 mb-2">Segmento objetivo:</div>
                    <div class="font-bold text-blue-600 capitalize mb-4">
                      {campaign.target_segment.replace('_', ' ')}
                    </div>
                    
                    <div class="text-sm text-gray-700 mb-4">
                      <strong>Estrategia:</strong> {campaign.strategy}
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div class="text-2xl font-bold text-green-600">
                          {campaign.predicted_recovery || campaign.predicted_upgrade}%
                        </div>
                        <div class="text-xs text-gray-600">
                          {campaign.predicted_recovery ? 'Recuperación' : 'Upgrade'}
                        </div>
                      </div>
                      
                      <div>
                        <div class="text-2xl font-bold text-purple-600">
                          {formatArgentinaCurrency(campaign.cost_per_recovery || campaign.ltv_increase)}
                        </div>
                        <div class="text-xs text-gray-600">
                          {campaign.cost_per_recovery ? 'Costo' : 'LTV Increase'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button class="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all w-full"
                          on:click={() => handleRetentionAction(campaign.target_segment, campaign.name)}>
                    Activar Campaña
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Loyalty Program Overview -->
        <div class="bg-gradient-to-r from-gold-50 to-yellow-50 rounded-2xl p-8 border border-yellow-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">👑 Programa de Lealtad</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">{currentVariantData.loyalty_program?.name || 'BarberPro VIP'}</h3>
              
              <div class="mb-6">
                <div class="text-sm font-medium text-gray-700 mb-3">Niveles disponibles:</div>
                <div class="flex flex-wrap gap-2">
                  {#each currentVariantData.loyalty_program?.tiers || [] as tier}
                    <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {tier}
                    </span>
                  {/each}
                </div>
              </div>
              
              <div>
                <div class="text-sm font-medium text-gray-700 mb-3">Beneficios principales:</div>
                <ul class="space-y-2">
                  {#each currentVariantData.loyalty_program?.benefits || [] as benefit}
                    <li class="flex items-center space-x-2">
                      <span class="text-green-500">✅</span>
                      <span class="text-gray-700">{benefit}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
            
            <div class="text-center">
              <div class="bg-white rounded-xl p-6 shadow-lg">
                <div class="text-3xl font-bold text-green-600 mb-2">
                  {currentVariantData.loyalty_program?.impact || '+35% retención'}
                </div>
                <div class="text-gray-700 mb-6">Impacto en retención</div>
                
                <button class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all w-full">
                  Gestionar Programa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'lifetime-value'}
    <!-- Lifetime Value Experience -->
    <section class="ltv-section bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">💎 Optimización de Valor de Vida</h1>
          <p class="text-gray-700">Maximiza el valor a largo plazo de cada cliente</p>
        </div>

        <!-- LTV Segments Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {#each currentVariantData.ltvSegments || [] as segment}
            <div class="bg-white rounded-xl p-8 shadow-xl border-l-4"
                 class:border-green-500={segment.segment.includes('High')}
                 class:border-blue-500={segment.segment.includes('Growing')}
                 class:border-gray-500={segment.segment.includes('Base')}>
              
              <div class="text-center">
                <div class="text-3xl mb-4">
                  {#if segment.segment.includes('High')}💎
                  {:else if segment.segment.includes('Growing')}📈
                  {:else}🌱
                  {/if}
                </div>
                
                <h3 class="text-xl font-bold text-gray-900 mb-2">{segment.segment}</h3>
                
                <div class="grid grid-cols-1 gap-4 mb-6">
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-gray-900 mb-1">{segment.count}</div>
                    <div class="text-sm text-gray-600">Clientes</div>
                  </div>
                  
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-green-600 mb-1">
                      {formatArgentinaCurrency(segment.avg_ltv)}
                    </div>
                    <div class="text-sm text-gray-600">LTV Actual</div>
                  </div>
                  
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-2xl font-bold text-blue-600 mb-1">
                      {formatArgentinaCurrency(segment.potential)}
                    </div>
                    <div class="text-sm text-gray-600">Potencial</div>
                  </div>
                </div>
                
                <div class="text-left">
                  <div class="text-sm font-medium text-gray-700 mb-2">Acciones recomendadas:</div>
                  <ul class="space-y-1">
                    {#each segment.actions as action}
                      <li class="text-sm text-gray-600">• {action}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- LTV Drivers Analysis -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">🎯 Factores que Impulsan el LTV</h2>
          
          <div class="space-y-6">
            {#each currentVariantData.ltvDrivers || [] as driver}
              <div class="border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-gray-900">{driver.driver}</h3>
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">
                    {driver.impact}% impacto
                  </span>
                </div>
                
                <div class="mb-4">
                  <div class="flex items-center space-x-4">
                    <span class="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">Impacto:</span>
                    <div class="flex-1">
                      <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000" 
                             style="width: {driver.impact}%"></div>
                      </div>
                    </div>
                    <span class="text-sm font-bold text-green-600">{driver.impact}%</span>
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-600">
                    <strong>Optimización:</strong> {driver.optimization}
                  </div>
                  
                  <button class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          on:click={() => dispatch('lifetimeValueOptimization', { 
                            driver: driver.driver, 
                            currentImpact: driver.impact, 
                            optimization: driver.optimization 
                          })}>
                    Optimizar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Argentina-Specific LTV Insights -->
        {#if argentinaOptimized}
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">🇦🇷 Insights Específicos de Argentina</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">💬</div>
                <div class="text-lg font-bold text-blue-600 mb-1">67%</div>
                <div class="text-sm text-gray-700">Prefiere WhatsApp como canal</div>
              </div>
              
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">🤝</div>
                <div class="text-lg font-bold text-green-600 mb-1">94%</div>
                <div class="text-sm text-gray-700">Valora la confianza sobre todo</div>
              </div>
              
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                <div class="text-lg font-bold text-purple-600 mb-1">73%</div>
                <div class="text-sm text-gray-700">Decisiones orientadas a familia</div>
              </div>
              
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">💰</div>
                <div class="text-lg font-bold text-orange-600 mb-1">87%</div>
                <div class="text-sm text-gray-700">Sensible a relación precio-valor</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .customer-success-experience {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .empathy-mode {
    --empathy-primary: #f472b6;
    --empathy-secondary: #ec4899;
  }

  .proactive-mode {
    --proactive-primary: #3b82f6;
    --proactive-secondary: #2563eb;
  }

  /* Argentina-specific color scheme */
  .argentina-success {
    background: linear-gradient(135deg, #74b9ff 0%, #00b894 100%);
  }

  /* Smooth animations for health monitoring */
  @keyframes healthPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .health-indicator {
    animation: healthPulse 2s infinite;
  }

  /* Responsive design optimizations */
  @media (max-width: 768px) {
    .customer-success-experience h1 {
      font-size: 1.875rem;
    }
    
    .customer-success-experience .text-3xl {
      font-size: 1.5rem;
    }
    
    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* Enhanced accessibility */
  .customer-success-experience [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Premium experience enhancements */
  .premium-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.08);
  }

  .premium-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  }
</style>