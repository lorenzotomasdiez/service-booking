<!--
  Business Intelligence & Operations Design Excellence - D11-001
  Executive dashboard with strategic insights and decision-making optimization
  Business intelligence visualization with actionable data presentation
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'executive' | 'analytics' | 'operations' | 'financial' | 'provider' | 'compliance' = 'executive';
  export let userRole: 'executive' | 'manager' | 'analyst' | 'provider' | 'admin' = 'executive';
  export let argentinaMetrics: boolean = true;
  export let realTimeData: boolean = true;
  export let aiInsights: boolean = true;

  const dispatch = createEventDispatcher<{
    businessDecision: { type: string; data: any; confidence: number };
    insightAction: { insight: string; priority: 'high' | 'medium' | 'low'; impact: number };
    operationalChange: { area: string; change: string; expectedImprovement: number };
    complianceAlert: { regulation: string; status: 'compliant' | 'warning' | 'violation'; action: string };
  }>();

  // Argentina Business Intelligence Data
  const businessIntelligenceData = {
    executiveDashboard: {
      keyMetrics: {
        monthly_revenue: {
          current: 2450000, // ARS
          previous: 2180000,
          target: 2800000,
          growth: 12.4,
          forecast: 2650000
        },
        active_users: {
          current: 8945,
          previous: 7823,
          growth: 14.3,
          retention_rate: 87.2
        },
        provider_satisfaction: {
          score: 4.7,
          trend: 'up',
          nps: 68,
          churn_rate: 5.2
        },
        operational_efficiency: {
          booking_success_rate: 94.6,
          avg_response_time: 138, // ms
          system_uptime: 99.7,
          cost_per_acquisition: 1250 // ARS
        }
      },
      strategicInsights: [
        {
          type: 'market_opportunity',
          title: 'Expansión a GBA Sur',
          description: 'Oportunidad de crecimiento del 45% en zona sur del Gran Buenos Aires',
          confidence: 89,
          impact: 'high',
          recommended_action: 'Iniciar campaña de marketing dirigida en Q2',
          potential_revenue: 890000
        },
        {
          type: 'operational_optimization',
          title: 'Automatización de Onboarding',
          description: 'IA puede reducir tiempo de onboarding de proveedores en 67%',
          confidence: 94,
          impact: 'medium',
          recommended_action: 'Implementar chatbot inteligente para nuevos proveedores',
          cost_savings: 320000
        },
        {
          type: 'customer_behavior',
          title: 'Patrón de Reservas Familiares',
          description: 'Incremento del 78% en reservas grupales durante fines de semana',
          confidence: 96,
          impact: 'high',
          recommended_action: 'Crear paquetes familiares premium para fines de semana',
          potential_revenue: 560000
        }
      ]
    },
    analyticsVisualization: {
      customerJourney: {
        discovery: { conversion: 34, drop_points: ['pricing_page', 'signup_form'] },
        consideration: { conversion: 67, avg_time: '4.2 días' },
        booking: { conversion: 89, abandonment_rate: 11 },
        experience: { satisfaction: 91, repeat_rate: 73 },
        advocacy: { referral_rate: 28, nps_contribution: 15 }
      },
      marketSegmentation: {
        demographics: {
          age_25_34: { percentage: 42, ltv: 18500, growth: 23 },
          age_35_44: { percentage: 31, ltv: 24000, growth: 8 },
          age_45_54: { percentage: 19, ltv: 19500, growth: -3 },
          age_55_plus: { percentage: 8, ltv: 15000, growth: 12 }
        },
        geographic: {
          caba: { percentage: 58, revenue_share: 62, growth: 15 },
          gba_norte: { percentage: 23, revenue_share: 25, growth: 28 },
          gba_sur: { percentage: 12, revenue_share: 9, growth: 45 },
          interior: { percentage: 7, revenue_share: 4, growth: 67 }
        }
      },
      predictiveAnalytics: {
        churn_prediction: {
          high_risk: 145,
          medium_risk: 289,
          low_risk: 7834,
          accuracy: 89.3
        },
        demand_forecasting: {
          next_week: { predicted_bookings: 2340, confidence: 87 },
          next_month: { predicted_bookings: 9680, confidence: 82 },
          seasonal_trends: { peak_months: ['Nov', 'Dec', 'Mar'], growth_factor: 1.35 }
        }
      }
    },
    operationsExcellence: {
      processMetrics: {
        provider_onboarding: {
          avg_time: '3.2 días',
          completion_rate: 87,
          bottlenecks: ['document_verification', 'skills_assessment'],
          optimization_potential: 45
        },
        booking_processing: {
          avg_time: '12 segundos',
          success_rate: 96.4,
          error_recovery_rate: 98.1,
          peak_capacity: '450 bookings/minute'
        },
        customer_support: {
          first_response_time: '4.2 minutos',
          resolution_rate: 94.6,
          satisfaction_score: 4.8,
          whatsapp_preference: 67
        }
      },
      workflowOptimization: [
        {
          process: 'Provider Verification',
          current_efficiency: 73,
          target_efficiency: 90,
          improvement_actions: [
            'Automated document parsing with AI',
            'Real-time background checks',
            'Streamlined skills verification'
          ],
          impact: { time_saved: '2.1 días', cost_reduction: 34 }
        },
        {
          process: 'Payment Processing',
          current_efficiency: 89,
          target_efficiency: 95,
          improvement_actions: [
            'MercadoPago integration optimization',
            'Automated retry logic',
            'Smart payment routing'
          ],
          impact: { error_reduction: 67, revenue_recovery: 125000 }
        }
      ]
    },
    financialReporting: {
      revenueAnalysis: {
        monthly_breakdown: [
          { month: 'Enero', revenue: 2180000, growth: 8.3, margin: 23 },
          { month: 'Febrero', revenue: 2350000, growth: 12.1, margin: 25 },
          { month: 'Marzo', revenue: 2450000, growth: 14.2, margin: 26 },
          { month: 'Abril', revenue: 2650000, growth: 16.8, margin: 28 }
        ],
        revenue_streams: {
          transaction_fees: { amount: 1470000, percentage: 60, growth: 15 },
          subscription_fees: { amount: 735000, percentage: 30, growth: 22 },
          premium_features: { amount: 245000, percentage: 10, growth: 45 }
        },
        profitability: {
          gross_margin: 67,
          operating_margin: 23,
          net_margin: 18,
          ebitda: 28
        }
      },
      costAnalysis: {
        customer_acquisition: { cost: 1250, ltv_ratio: 14.2, payback_period: '2.3 meses' },
        provider_acquisition: { cost: 890, ltv_ratio: 22.1, payback_period: '1.8 meses' },
        operational_costs: {
          technology: 34,
          marketing: 28,
          support: 18,
          compliance: 12,
          other: 8
        }
      }
    },
    providerSuccess: {
      performanceMetrics: {
        top_performers: [
          { name: 'Carlos Mendez', rating: 4.9, bookings: 156, revenue: 89000 },
          { name: 'Sofia Martinez', rating: 4.8, bookings: 142, revenue: 78000 },
          { name: 'Diego Rodriguez', rating: 4.9, bookings: 134, revenue: 82000 }
        ],
        growth_opportunities: [
          {
            provider: 'Ana González',
            current_revenue: 45000,
            potential_revenue: 67000,
            improvement_areas: ['Expand service offerings', 'Optimize schedule'],
            success_probability: 84
          }
        ],
        market_insights: {
          high_demand_services: ['Corte + Barba', 'Combo Completo', 'Afeitado Tradicional'],
          optimal_pricing: { min: 3500, max: 8500, sweet_spot: 5200 },
          peak_hours: ['17:00-19:00', '10:00-12:00', '15:00-16:00']
        }
      }
    },
    complianceMonitoring: {
      regulations: {
        data_protection: {
          law: 'Ley de Protección de Datos Personales Argentina',
          status: 'compliant',
          last_audit: '2024-02-15',
          next_review: '2024-05-15',
          score: 96
        },
        consumer_protection: {
          law: 'Ley de Defensa del Consumidor',
          status: 'compliant',
          last_audit: '2024-01-20',
          next_review: '2024-04-20',
          score: 94
        },
        tax_compliance: {
          law: 'AFIP - Facturación Electrónica',
          status: 'compliant',
          last_audit: '2024-03-01',
          next_review: '2024-06-01',
          score: 98
        }
      },
      riskAssessment: {
        data_security: { risk_level: 'low', score: 89, last_incident: null },
        operational_continuity: { risk_level: 'low', score: 92, backup_systems: 3 },
        regulatory_changes: { risk_level: 'medium', monitoring: true, updates_pending: 2 }
      }
    }
  };

  // Component State
  let currentData = writable({});
  let selectedTimeframe = '30d';
  let selectedMetric = 'revenue';
  let refreshInterval = null;
  let lastUpdate = new Date();

  onMount(() => {
    initializeVariant();
    if (realTimeData) {
      startRealTimeUpdates();
    }
    trackDashboardUsage();
  });

  function initializeVariant() {
    switch (variant) {
      case 'executive':
        initializeExecutiveDashboard();
        break;
      case 'analytics':
        initializeAnalyticsVisualization();
        break;
      case 'operations':
        initializeOperationsExcellence();
        break;
      case 'financial':
        initializeFinancialReporting();
        break;
      case 'provider':
        initializeProviderSuccess();
        break;
      case 'compliance':
        initializeComplianceMonitoring();
        break;
    }
  }

  function initializeExecutiveDashboard() {
    currentData.set({
      ...businessIntelligenceData.executiveDashboard,
      realTimeAlerts: [
        {
          type: 'revenue_milestone',
          message: 'Ingresos mensuales superaron objetivo en 8%',
          severity: 'success',
          timestamp: Date.now() - 300000
        },
        {
          type: 'system_performance',
          message: 'Tiempo de respuesta promedio: 138ms (Excelente)',
          severity: 'info',
          timestamp: Date.now() - 600000
        }
      ]
    });
  }

  function initializeAnalyticsVisualization() {
    currentData.set({
      ...businessIntelligenceData.analyticsVisualization,
      customMetrics: {
        argentina_specific: {
          siesta_impact: { bookings_drop: 23, recovery_time: '15:30' },
          mercadopago_adoption: 92,
          whatsapp_engagement: 67,
          family_bookings_trend: 34
        }
      }
    });
  }

  function initializeOperationsExcellence() {
    currentData.set({
      ...businessIntelligenceData.operationsExcellence,
      automationOpportunities: [
        {
          process: 'Customer Onboarding',
          automation_potential: 78,
          estimated_savings: 45000,
          implementation_time: '6 semanas'
        },
        {
          process: 'Provider Matching',
          automation_potential: 85,
          estimated_savings: 67000,
          implementation_time: '8 semanas'
        }
      ]
    });
  }

  function initializeFinancialReporting() {
    currentData.set({
      ...businessIntelligenceData.financialReporting,
      projections: {
        q2_forecast: 8400000,
        yearly_target: 32000000,
        confidence_level: 87
      }
    });
  }

  function initializeProviderSuccess() {
    currentData.set({
      ...businessIntelligenceData.providerSuccess,
      growthPrograms: [
        {
          name: 'Provider Excellence Program',
          participants: 234,
          avg_revenue_increase: 34,
          satisfaction_improvement: 0.3
        }
      ]
    });
  }

  function initializeComplianceMonitoring() {
    currentData.set({
      ...businessIntelligenceData.complianceMonitoring,
      upcomingDeadlines: [
        {
          regulation: 'Actualización AFIP',
          deadline: '2024-05-15',
          status: 'in_progress',
          responsible: 'Legal Team'
        }
      ]
    });
  }

  function startRealTimeUpdates() {
    refreshInterval = setInterval(() => {
      updateMetrics();
      lastUpdate = new Date();
    }, 30000); // Update every 30 seconds
  }

  function updateMetrics() {
    // Simulate real-time metric updates
    if (variant === 'executive') {
      const currentMetrics = $currentData.keyMetrics;
      if (currentMetrics) {
        // Small random variations to simulate real-time changes
        currentMetrics.active_users.current += Math.floor(Math.random() * 20 - 10);
        currentMetrics.operational_efficiency.avg_response_time += Math.floor(Math.random() * 10 - 5);
        currentData.update(data => ({ ...data, keyMetrics: currentMetrics }));
      }
    }
  }

  function trackDashboardUsage() {
    uxAnalytics.trackExternalEvent('business_intelligence_dashboard_view', {
      variant,
      userRole,
      argentinaMetrics,
      realTimeData,
      aiInsights
    });
  }

  function handleBusinessDecision(type: string, data: any, confidence: number) {
    dispatch('businessDecision', { type, data, confidence });
    
    uxAnalytics.trackExternalEvent('business_decision_made', {
      type,
      confidence,
      variant,
      userRole
    });
  }

  function handleInsightAction(insight: string, priority: 'high' | 'medium' | 'low', impact: number) {
    dispatch('insightAction', { insight, priority, impact });
    
    uxAnalytics.trackExternalEvent('insight_action_taken', {
      insight,
      priority,
      impact,
      variant
    });
  }

  function formatArgentinaCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function getGrowthColor(growth: number): string {
    if (growth > 10) return 'text-green-600';
    if (growth > 0) return 'text-blue-600';
    return 'text-red-600';
  }

  function getGrowthIcon(growth: number): string {
    if (growth > 10) return '📈';
    if (growth > 0) return '↗️';
    return '📉';
  }

  function getSeverityColor(severity: string): string {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[severity] || colors.info;
  }

  function getComplianceColor(status: string): string {
    const colors = {
      compliant: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      violation: 'text-red-600 bg-red-100'
    };
    return colors[status] || colors.warning;
  }

  function getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }

  $: currentVariantData = $currentData;
</script>

<div class="business-intelligence-experience" class:real-time-mode={realTimeData} class:ai-enhanced={aiInsights}>
  {#if variant === 'executive'}
    <!-- Executive Strategic Dashboard -->
    <section class="executive-dashboard bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Executive Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Dashboard Ejecutivo</h1>
            <p class="text-gray-600">Visión estratégica integral del negocio</p>
          </div>
          
          <div class="flex items-center space-x-4">
            {#if realTimeData}
              <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-green-700 font-medium text-sm">Tiempo Real</span>
                </div>
              </div>
            {/if}
            
            <div class="text-sm text-gray-500">
              Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
            </div>
          </div>
        </div>

        <!-- Key Performance Indicators -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {#each Object.entries(currentVariantData.keyMetrics || {}) as [metricKey, metric]}
            <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-medium text-gray-600 capitalize">
                  {#if metricKey === 'monthly_revenue'}Ingresos Mensuales
                  {:else if metricKey === 'active_users'}Usuarios Activos
                  {:else if metricKey === 'provider_satisfaction'}Satisfacción Proveedores
                  {:else if metricKey === 'operational_efficiency'}Eficiencia Operacional
                  {:else}{metricKey.replace('_', ' ')}
                  {/if}
                </div>
                
                <div class="text-2xl">
                  {#if metricKey === 'monthly_revenue'}💰
                  {:else if metricKey === 'active_users'}👥
                  {:else if metricKey === 'provider_satisfaction'}⭐
                  {:else if metricKey === 'operational_efficiency'}⚙️
                  {:else}📈
                  {/if}
                </div>
              </div>
              
              <div class="mb-2">
                <div class="text-3xl font-bold text-gray-900">
                  {#if metricKey === 'monthly_revenue'}
                    {formatArgentinaCurrency(metric.current)}
                  {:else if metricKey === 'active_users'}
                    {metric.current.toLocaleString()}
                  {:else if metricKey === 'provider_satisfaction'}
                    {metric.score}/5
                  {:else if metricKey === 'operational_efficiency'}
                    {metric.booking_success_rate}%
                  {:else}
                    {metric.current || metric.score || 0}
                  {/if}
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                {#if metric.growth !== undefined}
                  <span class="text-sm {getGrowthColor(metric.growth)} font-medium">
                    {getGrowthIcon(metric.growth)} {formatPercentage(metric.growth)}
                  </span>
                {:else if metric.trend}
                  <span class="text-sm text-green-600 font-medium">
                    {metric.trend === 'up' ? '📈' : '📉'} {metric.trend}
                  </span>
                {/if}
                <span class="text-xs text-gray-500">vs. anterior</span>
              </div>
              
              {#if metricKey === 'monthly_revenue' && metric.target}
                <div class="mt-3">
                  <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progreso al objetivo</span>
                    <span>{formatPercentage((metric.current / metric.target) * 100)}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                         style="width: {Math.min((metric.current / metric.target) * 100, 100)}%"></div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Strategic Insights with AI -->
        <div class="mb-12">
          <div class="flex items-center space-x-3 mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Insights Estratégicos</h2>
            {#if aiInsights}
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                🤖 IA
              </span>
            {/if}
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each currentVariantData.strategicInsights || [] as insight}
              <div class="bg-white rounded-xl p-6 shadow-lg border-l-4 hover:shadow-xl transition-all"
                   class:border-red-400={insight.impact === 'high'}
                   class:border-yellow-400={insight.impact === 'medium'}
                   class:border-green-400={insight.impact === 'low'}>
                
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">{insight.title}</h3>
                    <div class="flex items-center space-x-3">
                      <span class="text-xs px-2 py-1 rounded-full font-medium"
                            class:bg-red-100={insight.impact === 'high'}
                            class:text-red-800={insight.impact === 'high'}
                            class:bg-yellow-100={insight.impact === 'medium'}
                            class:text-yellow-800={insight.impact === 'medium'}
                            class:bg-green-100={insight.impact === 'low'}
                            class:text-green-800={insight.impact === 'low'}>
                        {insight.impact.toUpperCase()}
                      </span>
                      
                      <span class="text-xs text-blue-600 font-medium">
                        🎯 {insight.confidence}% confianza
                      </span>
                    </div>
                  </div>
                  
                  <div class="text-2xl">
                    {#if insight.type === 'market_opportunity'}🎁
                    {:else if insight.type === 'operational_optimization'}⚙️
                    {:else if insight.type === 'customer_behavior'}👥
                    {:else}💡
                    {/if}
                  </div>
                </div>
                
                <p class="text-gray-700 mb-4">{insight.description}</p>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                  <div class="text-sm font-medium text-gray-900 mb-1">Acción Recomendada:</div>
                  <p class="text-sm text-gray-700">{insight.recommended_action}</p>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="text-sm">
                    {#if insight.potential_revenue}
                      <span class="font-medium text-green-600">
                        Potencial: {formatArgentinaCurrency(insight.potential_revenue)}
                      </span>
                    {:else if insight.cost_savings}
                      <span class="font-medium text-blue-600">
                        Ahorro: {formatArgentinaCurrency(insight.cost_savings)}
                      </span>
                    {/if}
                  </div>
                  
                  <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          on:click={() => handleInsightAction(insight.title, insight.impact, insight.potential_revenue || insight.cost_savings)}>
                    Implementar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Real-time Alerts -->
        {#if realTimeData}
          <div class="bg-white rounded-xl p-6 shadow-lg">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Alertas en Tiempo Real</h2>
            <div class="space-y-4">
              {#each currentVariantData.realTimeAlerts || [] as alert}
                <div class="flex items-center space-x-4 p-4 rounded-lg border {getSeverityColor(alert.severity)}">
                  <div class="text-2xl">
                    {#if alert.type === 'revenue_milestone'}🎉
                    {:else if alert.type === 'system_performance'}⚡
                    {:else if alert.type === 'user_activity'}👥
                    {:else}🔔
                    {/if}
                  </div>
                  
                  <div class="flex-1">
                    <p class="font-medium">{alert.message}</p>
                    <p class="text-sm opacity-75">{getTimeAgo(alert.timestamp)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'analytics'}
    <!-- Analytics Visualization -->
    <section class="analytics-visualization bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Analítica Avanzada</h1>
          <p class="text-gray-700">Visualización de datos con insights accionables</p>
        </div>

        <!-- Customer Journey Analytics -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Customer Journey Analytics</h2>
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
              {#each Object.entries(currentVariantData.customerJourney || {}) as [stage, data], index}
                <div class="text-center">
                  <div class="bg-white rounded-xl p-6 shadow-lg mb-4">
                    <div class="text-3xl mb-3">
                      {#if stage === 'discovery'}🔍
                      {:else if stage === 'consideration'}🤔
                      {:else if stage === 'booking'}📝
                      {:else if stage === 'experience'}✨
                      {:else if stage === 'advocacy'}🗣️
                      {:else}📋
                      {/if}
                    </div>
                    
                    <h3 class="font-bold text-gray-900 mb-2 capitalize">
                      {#if stage === 'discovery'}Descubrimiento
                      {:else if stage === 'consideration'}Consideración
                      {:else if stage === 'booking'}Reserva
                      {:else if stage === 'experience'}Experiencia
                      {:else if stage === 'advocacy'}Recomendación
                      {:else}{stage}
                      {/if}
                    </h3>
                    
                    <div class="text-2xl font-bold text-blue-600 mb-1">
                      {data.conversion}%
                    </div>
                    
                    <div class="text-sm text-gray-600">
                      {#if data.drop_points}
                        Abandonos: {data.drop_points.length}
                      {:else if data.avg_time}
                        Promedio: {data.avg_time}
                      {:else if data.abandonment_rate}
                        Abandono: {data.abandonment_rate}%
                      {:else if data.satisfaction}
                        Satisfacción: {data.satisfaction}%
                      {:else if data.referral_rate}
                        Referidos: {data.referral_rate}%
                      {/if}
                    </div>
                  </div>
                  
                  {#if index < 4}
                    <div class="hidden md:block text-gray-400 text-2xl">→</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Market Segmentation -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <!-- Demographics -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Segmentación Demográfica</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.marketSegmentation?.demographics || {}) as [ageGroup, data]}
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900">
                      {ageGroup.replace('age_', '').replace('_', '-').replace('plus', '+')} años
                    </div>
                    <div class="text-sm text-gray-600">
                      LTV: {formatArgentinaCurrency(data.ltv)}
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <div class="text-lg font-bold text-blue-600">{data.percentage}%</div>
                    <div class="text-sm {getGrowthColor(data.growth)}">
                      {getGrowthIcon(data.growth)} {formatPercentage(data.growth)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Geographic -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Distribución Geográfica</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.marketSegmentation?.geographic || {}) as [region, data]}
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div class="font-medium text-gray-900 uppercase">{region.replace('_', ' ')}</div>
                    <div class="text-sm {getGrowthColor(data.growth)}">
                      {getGrowthIcon(data.growth)} {formatPercentage(data.growth)}
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Usuarios: {data.percentage}%</span>
                    <span class="text-gray-600">Ingresos: {data.revenue_share}%</span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                         style="width: {data.percentage}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Predictive Analytics -->
        {#if aiInsights}
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
            <div class="flex items-center space-x-3 mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Analítica Predictiva</h2>
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                🤖 IA
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Churn Prediction -->
              <div class="bg-white rounded-xl p-6 shadow-lg">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Predicción de Churn</h3>
                <div class="space-y-4">
                  {#each Object.entries(currentVariantData.predictiveAnalytics?.churn_prediction || {}) as [riskLevel, count]}
                    {#if riskLevel !== 'accuracy'}
                      <div class="flex items-center justify-between">
                        <span class="capitalize text-gray-700">
                          {riskLevel.replace('_', ' ')} riesgo:
                        </span>
                        <span class="font-bold"
                              class:text-red-600={riskLevel === 'high_risk'}
                              class:text-yellow-600={riskLevel === 'medium_risk'}
                              class:text-green-600={riskLevel === 'low_risk'}>
                          {count}
                        </span>
                      </div>
                    {/if}
                  {/each}
                  
                  <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div class="text-sm font-medium text-blue-900">Precisión del modelo:</div>
                    <div class="text-lg font-bold text-blue-600">
                      {currentVariantData.predictiveAnalytics?.churn_prediction?.accuracy}%
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Demand Forecasting -->
              <div class="bg-white rounded-xl p-6 shadow-lg">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Predicción de Demanda</h3>
                <div class="space-y-4">
                  <div class="p-4 bg-green-50 rounded-lg">
                    <div class="text-sm text-green-800 mb-1">Próxima semana:</div>
                    <div class="text-xl font-bold text-green-600">
                      {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_week?.predicted_bookings || 0} reservas
                    </div>
                    <div class="text-xs text-green-700">
                      Confianza: {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_week?.confidence}%
                    </div>
                  </div>
                  
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <div class="text-sm text-blue-800 mb-1">Próximo mes:</div>
                    <div class="text-xl font-bold text-blue-600">
                      {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_month?.predicted_bookings || 0} reservas
                    </div>
                    <div class="text-xs text-blue-700">
                      Confianza: {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_month?.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Argentina-Specific Metrics -->
        {#if argentinaMetrics}
          <div class="mt-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">🇦🇷 Métricas Específicas Argentina</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">😴</div>
                <div class="text-lg font-bold text-blue-600 mb-1">23%</div>
                <div class="text-sm text-gray-700">Caída durante siesta</div>
                <div class="text-xs text-gray-500">Recuperación: 15:30</div>
              </div>
              
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">💳</div>
                <div class="text-lg font-bold text-green-600 mb-1">92%</div>
                <div class="text-sm text-gray-700">Adopción MercadoPago</div>
                <div class="text-xs text-gray-500">Crecimiento: +8%</div>
              </div>
              
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">💬</div>
                <div class="text-lg font-bold text-purple-600 mb-1">67%</div>
                <div class="text-sm text-gray-700">Engagement WhatsApp</div>
                <div class="text-xs text-gray-500">vs. 25% email</div>
              </div>
              
              <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                <div class="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                <div class="text-lg font-bold text-orange-600 mb-1">34%</div>
                <div class="text-sm text-gray-700">Reservas familiares</div>
                <div class="text-xs text-gray-500">Trend: 📈 +12%</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'operations'}
    <!-- Operations Excellence Dashboard -->
    <section class="operations-excellence bg-gray-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Excelencia Operacional</h1>
          <p class="text-gray-700">Optimización de procesos y eficiencia operativa</p>
        </div>

        <!-- Process Metrics Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {#each Object.entries(currentVariantData.processMetrics || {}) as [processName, metrics]}
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <div class="text-center mb-6">
                <div class="text-4xl mb-3">
                  {#if processName.includes('onboarding')}🚀
                  {:else if processName.includes('booking')}📋
                  {:else if processName.includes('support')}💖
                  {:else}⚙️
                  {/if}
                </div>
                
                <h3 class="text-lg font-bold text-gray-900 capitalize">
                  {processName.replace('_', ' ')}
                </h3>
              </div>
              
              <div class="space-y-4">
                {#each Object.entries(metrics) as [metricKey, value]}
                  {#if !Array.isArray(value)}
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 capitalize">
                        {metricKey.replace('_', ' ')}:
                      </span>
                      <span class="font-medium text-gray-900">
                        {#if typeof value === 'string'}
                          {value}
                        {:else}
                          {value}%
                        {/if}
                      </span>
                    </div>
                  {/if}
                {/each}
                
                {#if metrics.bottlenecks}
                  <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div class="text-sm font-medium text-yellow-800 mb-2">Cuellos de botella:</div>
                    <ul class="text-xs text-yellow-700 space-y-1">
                      {#each metrics.bottlenecks as bottleneck}
                        <li>• {bottleneck.replace('_', ' ')}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                
                {#if metrics.optimization_potential}
                  <div class="mt-4 p-3 bg-green-50 rounded-lg">
                    <div class="text-sm font-medium text-green-800">Potencial de optimización:</div>
                    <div class="text-lg font-bold text-green-600">{metrics.optimization_potential}%</div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Workflow Optimization Projects -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Proyectos de Optimización</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each currentVariantData.workflowOptimization || [] as workflow}
              <div class="bg-white rounded-xl p-8 shadow-lg border-l-4 border-blue-400">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-bold text-gray-900">{workflow.process}</h3>
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {workflow.current_efficiency}% → {workflow.target_efficiency}%
                  </span>
                </div>
                
                <div class="mb-6">
                  <div class="text-sm text-gray-600 mb-2">Progreso hacia objetivo:</div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                         style="width: {(workflow.current_efficiency / workflow.target_efficiency) * 100}%"></div>
                  </div>
                </div>
                
                <div class="mb-6">
                  <div class="text-sm font-medium text-gray-900 mb-3">Acciones de mejora:</div>
                  <ul class="space-y-2">
                    {#each workflow.improvement_actions as action}
                      <li class="flex items-start space-x-2">
                        <span class="text-green-500 text-sm">✓</span>
                        <span class="text-sm text-gray-700">{action}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div class="text-lg font-bold text-blue-600">
                        {workflow.impact.time_saved || formatPercentage(workflow.impact.error_reduction) || 'N/A'}
                      </div>
                      <div class="text-xs text-gray-600">
                        {workflow.impact.time_saved ? 'Tiempo ahorrado' : 'Reducción errores'}
                      </div>
                    </div>
                    
                    <div>
                      <div class="text-lg font-bold text-green-600">
                        {workflow.impact.cost_reduction ? formatPercentage(workflow.impact.cost_reduction) : formatArgentinaCurrency(workflow.impact.revenue_recovery)}
                      </div>
                      <div class="text-xs text-gray-600">
                        {workflow.impact.cost_reduction ? 'Reducción costos' : 'Recuperación ingresos'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button class="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                        on:click={() => dispatch('operationalChange', { area: workflow.process, change: workflow.improvement_actions[0], expectedImprovement: workflow.target_efficiency - workflow.current_efficiency })}>
                  Implementar Mejoras
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Automation Opportunities -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Oportunidades de Automatización</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each currentVariantData.automationOpportunities || [] as opportunity}
              <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-gray-900">{opportunity.process}</h3>
                  <span class="text-2xl">🤖</span>
                </div>
                
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Potencial de automatización:</span>
                    <span class="font-bold text-purple-600">{opportunity.automation_potential}%</span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                         style="width: {opportunity.automation_potential}%"></div>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Ahorro estimado:</span>
                    <span class="font-bold text-green-600">{formatArgentinaCurrency(opportunity.estimated_savings)}</span>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Tiempo de implementación:</span>
                    <span class="font-bold text-blue-600">{opportunity.implementation_time}</span>
                  </div>
                </div>
                
                <button class="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                  Iniciar Automatización
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'financial'}
    <!-- Financial Reporting Dashboard -->
    <section class="financial-reporting bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Reportes Financieros</h1>
          <p class="text-gray-700">Análisis financiero integral con insights para la toma de decisiones</p>
        </div>

        <!-- Revenue Analysis -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Análisis de Ingresos</h2>
          
          <!-- Monthly Breakdown -->
          <div class="bg-white rounded-xl p-8 shadow-lg mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Evolución Mensual</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              {#each currentVariantData.revenueAnalysis?.monthly_breakdown || [] as monthData}
                <div class="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-gray-100">
                  <div class="text-lg font-bold text-gray-900 mb-2">{monthData.month}</div>
                  <div class="text-2xl font-bold text-green-600 mb-1">
                    {formatArgentinaCurrency(monthData.revenue)}
                  </div>
                  <div class="text-sm {getGrowthColor(monthData.growth)} mb-2">
                    {getGrowthIcon(monthData.growth)} {formatPercentage(monthData.growth)}
                  </div>
                  <div class="text-xs text-gray-600">
                    Margen: {monthData.margin}%
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Revenue Streams -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Fuentes de Ingresos</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {#each Object.entries(currentVariantData.revenueAnalysis?.revenue_streams || {}) as [streamName, data]}
                <div class="p-6 bg-gray-50 rounded-lg">
                  <div class="text-center">
                    <h4 class="font-bold text-gray-900 mb-3 capitalize">
                      {streamName.replace('_', ' ')}
                    </h4>
                    
                    <div class="text-3xl font-bold text-blue-600 mb-2">
                      {formatArgentinaCurrency(data.amount)}
                    </div>
                    
                    <div class="text-lg font-medium text-gray-700 mb-2">
                      {data.percentage}% del total
                    </div>
                    
                    <div class="text-sm {getGrowthColor(data.growth)}">
                      Crecimiento: {getGrowthIcon(data.growth)} {formatPercentage(data.growth)}
                    </div>
                    
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                           style="width: {data.percentage}%"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Profitability Analysis -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <!-- Profitability Metrics -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Márgenes de Rentabilidad</h3>
            <div class="space-y-6">
              {#each Object.entries(currentVariantData.revenueAnalysis?.profitability || {}) as [metric, value]}
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium text-gray-900 capitalize">
                      {#if metric === 'gross_margin'}Margen Bruto
                      {:else if metric === 'operating_margin'}Margen Operativo
                      {:else if metric === 'net_margin'}Margen Neto
                      {:else if metric === 'ebitda'}EBITDA
                      {:else}{metric.replace('_', ' ')}
                      {/if}
                    </span>
                    <span class="text-lg font-bold text-green-600">{value}%</span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full"
                         style="width: {value}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Cost Analysis -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Análisis de Costos</h3>
            
            <!-- Customer & Provider Acquisition -->
            <div class="space-y-4 mb-6">
              <div class="p-4 bg-blue-50 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium text-blue-900">Adquisición de Clientes</span>
                  <span class="text-lg font-bold text-blue-600">
                    {formatArgentinaCurrency(currentVariantData.costAnalysis?.customer_acquisition?.cost)}
                  </span>
                </div>
                <div class="text-sm text-blue-700">
                  LTV Ratio: {currentVariantData.costAnalysis?.customer_acquisition?.ltv_ratio}x • 
                  Payback: {currentVariantData.costAnalysis?.customer_acquisition?.payback_period}
                </div>
              </div>
              
              <div class="p-4 bg-green-50 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium text-green-900">Adquisición de Proveedores</span>
                  <span class="text-lg font-bold text-green-600">
                    {formatArgentinaCurrency(currentVariantData.costAnalysis?.provider_acquisition?.cost)}
                  </span>
                </div>
                <div class="text-sm text-green-700">
                  LTV Ratio: {currentVariantData.costAnalysis?.provider_acquisition?.ltv_ratio}x • 
                  Payback: {currentVariantData.costAnalysis?.provider_acquisition?.payback_period}
                </div>
              </div>
            </div>
            
            <!-- Operational Cost Breakdown -->
            <div>
              <div class="font-medium text-gray-900 mb-3">Distribución de Costos Operativos</div>
              <div class="space-y-2">
                {#each Object.entries(currentVariantData.costAnalysis?.operational_costs || {}) as [category, percentage]}
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700 capitalize">{category}:</span>
                    <span class="font-medium">{percentage}%</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Projections -->
        {#if currentVariantData.projections}
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Proyecciones Financieras</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="text-center p-6 bg-white rounded-xl shadow-lg">
                <div class="text-3xl mb-3">🎯</div>
                <div class="text-lg font-bold text-gray-900 mb-2">Q2 Forecast</div>
                <div class="text-3xl font-bold text-blue-600 mb-1">
                  {formatArgentinaCurrency(currentVariantData.projections.q2_forecast)}
                </div>
                <div class="text-sm text-gray-600">Abril - Junio 2024</div>
              </div>
              
              <div class="text-center p-6 bg-white rounded-xl shadow-lg">
                <div class="text-3xl mb-3">🏆</div>
                <div class="text-lg font-bold text-gray-900 mb-2">Objetivo Anual</div>
                <div class="text-3xl font-bold text-green-600 mb-1">
                  {formatArgentinaCurrency(currentVariantData.projections.yearly_target)}
                </div>
                <div class="text-sm text-gray-600">Meta 2024</div>
              </div>
              
              <div class="text-center p-6 bg-white rounded-xl shadow-lg">
                <div class="text-3xl mb-3">🔮</div>
                <div class="text-lg font-bold text-gray-900 mb-2">Confianza</div>
                <div class="text-3xl font-bold text-purple-600 mb-1">
                  {currentVariantData.projections.confidence_level}%
                </div>
                <div class="text-sm text-gray-600">Nivel de certeza</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'provider'}
    <!-- Provider Success Dashboard -->
    <section class="provider-success bg-white py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Dashboard de Éxito del Proveedor</h1>
          <p class="text-gray-700">Herramientas y métricas para optimizar el rendimiento de proveedores</p>
        </div>

        <!-- Top Performers -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Proveedores Top</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each currentVariantData.performanceMetrics?.top_performers || [] as performer}
              <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border border-yellow-200">
                <div class="text-center">
                  <div class="text-4xl mb-3">🏆</div>
                  <div class="font-bold text-lg text-gray-900 mb-2">{performer.name}</div>
                  
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-yellow-600">{performer.rating}</div>
                      <div class="text-xs text-gray-600">Rating</div>
                    </div>
                    
                    <div class="text-center">
                      <div class="text-2xl font-bold text-blue-600">{performer.bookings}</div>
                      <div class="text-xs text-gray-600">Reservas</div>
                    </div>
                  </div>
                  
                  <div class="text-2xl font-bold text-green-600 mb-1">
                    {formatArgentinaCurrency(performer.revenue)}
                  </div>
                  <div class="text-sm text-gray-600">Ingresos mensuales</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Growth Opportunities -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Oportunidades de Crecimiento</h2>
          <div class="space-y-6">
            {#each currentVariantData.performanceMetrics?.growth_opportunities || [] as opportunity}
              <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-4">
                      <div class="text-3xl">📈</div>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">{opportunity.provider}</h3>
                        <div class="text-sm text-gray-600">
                          Potencial de crecimiento: {formatPercentage((opportunity.potential_revenue - opportunity.current_revenue) / opportunity.current_revenue * 100)}
                        </div>
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div class="text-center p-4 bg-white rounded-lg">
                        <div class="text-lg font-bold text-gray-600">
                          {formatArgentinaCurrency(opportunity.current_revenue)}
                        </div>
                        <div class="text-sm text-gray-500">Ingresos actuales</div>
                      </div>
                      
                      <div class="text-center p-4 bg-white rounded-lg">
                        <div class="text-lg font-bold text-green-600">
                          {formatArgentinaCurrency(opportunity.potential_revenue)}
                        </div>
                        <div class="text-sm text-gray-500">Potencial</div>
                      </div>
                    </div>
                    
                    <div class="mb-4">
                      <div class="text-sm font-medium text-gray-700 mb-2">Áreas de mejora:</div>
                      <div class="flex flex-wrap gap-2">
                        {#each opportunity.improvement_areas as area}
                          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {area}
                          </span>
                        {/each}
                      </div>
                    </div>
                  </div>
                  
                  <div class="ml-8">
                    <div class="text-center mb-4">
                      <div class="text-2xl font-bold text-purple-600">{opportunity.success_probability}%</div>
                      <div class="text-xs text-gray-600">Probabilidad de éxito</div>
                    </div>
                    
                    <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                      Crear Plan
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Market Insights -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Insights del Mercado</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- High Demand Services -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4">🔥 Servicios en Alta Demanda</h3>
              <div class="space-y-3">
                {#each currentVariantData.performanceMetrics?.market_insights?.high_demand_services || [] as service}
                  <div class="bg-red-50 text-red-800 px-4 py-2 rounded-lg border border-red-200">
                    {service}
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Optimal Pricing -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4">💰 Rango de Precios Óptimo</h3>
              <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                <div class="text-center">
                  <div class="text-sm text-green-700 mb-2">Rango recomendado:</div>
                  <div class="text-lg font-bold text-green-800 mb-2">
                    {formatArgentinaCurrency(currentVariantData.performanceMetrics?.market_insights?.optimal_pricing?.min)} - 
                    {formatArgentinaCurrency(currentVariantData.performanceMetrics?.market_insights?.optimal_pricing?.max)}
                  </div>
                  <div class="text-sm text-green-700">
                    Sweet spot: {formatArgentinaCurrency(currentVariantData.performanceMetrics?.market_insights?.optimal_pricing?.sweet_spot)}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Peak Hours -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4">⏰ Horarios Pico</h3>
              <div class="space-y-3">
                {#each currentVariantData.performanceMetrics?.market_insights?.peak_hours || [] as hour}
                  <div class="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-200 text-center">
                    {hour}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'compliance'}
    <!-- Compliance Monitoring Dashboard -->
    <section class="compliance-monitoring bg-gradient-to-br from-gray-50 to-slate-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Monitoreo de Cumplimiento</h1>
          <p class="text-gray-700">Conformidad regulatoria y gestión de riesgos</p>
        </div>

        <!-- Regulatory Compliance Status -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Estado de Cumplimiento Regulatorio</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each Object.entries(currentVariantData.regulations || {}) as [regKey, regulation]}
              <div class="bg-white rounded-xl p-6 shadow-lg border-l-4 {getComplianceColor(regulation.status).includes('green') ? 'border-green-400' : regulation.status === 'warning' ? 'border-yellow-400' : 'border-red-400'}">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 mb-2">
                      {#if regKey === 'data_protection'}Protección de Datos
                      {:else if regKey === 'consumer_protection'}Defensa del Consumidor
                      {:else if regKey === 'tax_compliance'}Cumplimiento Fiscal
                      {:else}{regKey.replace('_', ' ')}
                      {/if}
                    </h3>
                    <div class="text-sm text-gray-600 mb-3">{regulation.law}</div>
                  </div>
                  
                  <span class="px-3 py-1 rounded-full text-xs font-bold {getComplianceColor(regulation.status)}">
                    {regulation.status.toUpperCase()}
                  </span>
                </div>
                
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Última auditoría:</span>
                    <span class="font-medium">{new Date(regulation.last_audit).toLocaleDateString('es-AR')}</span>
                  </div>
                  
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Próxima revisión:</span>
                    <span class="font-medium">{new Date(regulation.next_review).toLocaleDateString('es-AR')}</span>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Score de cumplimiento:</span>
                    <span class="text-lg font-bold text-green-600">{regulation.score}/100</span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                         style="width: {regulation.score}%"></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Risk Assessment -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Evaluación de Riesgos</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each Object.entries(currentVariantData.riskAssessment || {}) as [riskArea, assessment]}
              <div class="bg-white rounded-xl p-6 shadow-lg">
                <div class="text-center">
                  <div class="text-3xl mb-3">
                    {#if riskArea.includes('security')}🔒
                    {:else if riskArea.includes('operational')}⚙️
                    {:else if riskArea.includes('regulatory')}📄
                    {:else}⚠️
                    {/if}
                  </div>
                  
                  <h3 class="font-bold text-gray-900 mb-4 capitalize">
                    {riskArea.replace('_', ' ')}
                  </h3>
                  
                  <div class="mb-4">
                    <span class="inline-flex px-3 py-1 rounded-full text-sm font-bold"
                          class:bg-green-100={assessment.risk_level === 'low'}
                          class:text-green-800={assessment.risk_level === 'low'}
                          class:bg-yellow-100={assessment.risk_level === 'medium'}
                          class:text-yellow-800={assessment.risk_level === 'medium'}
                          class:bg-red-100={assessment.risk_level === 'high'}
                          class:text-red-800={assessment.risk_level === 'high'}>
                      {assessment.risk_level.toUpperCase()}
                    </span>
                  </div>
                  
                  <div class="text-2xl font-bold mb-2"
                       class:text-green-600={assessment.risk_level === 'low'}
                       class:text-yellow-600={assessment.risk_level === 'medium'}
                       class:text-red-600={assessment.risk_level === 'high'}>
                    {assessment.score}/100
                  </div>
                  
                  <div class="text-sm text-gray-600">
                    {#if assessment.last_incident}
                      Último incidente: {new Date(assessment.last_incident).toLocaleDateString('es-AR')}
                    {:else if assessment.backup_systems}
                      {assessment.backup_systems} sistemas de backup
                    {:else if assessment.updates_pending}
                      {assessment.updates_pending} actualizaciones pendientes
                    {:else}
                      Sin incidentes recientes
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Upcoming Deadlines -->
        {#if currentVariantData.upcomingDeadlines}
          <div class="bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">📅 Próximos Vencimientos</h2>
            
            <div class="space-y-4">
              {#each currentVariantData.upcomingDeadlines as deadline}
                <div class="bg-white rounded-lg p-6 shadow-sm border border-yellow-100">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-bold text-gray-900 mb-1">{deadline.regulation}</h3>
                      <div class="text-sm text-gray-600 mb-2">
                        Vencimiento: {new Date(deadline.deadline).toLocaleDateString('es-AR')}
                      </div>
                      <div class="text-sm text-gray-600">
                        Responsable: {deadline.responsible}
                      </div>
                    </div>
                    
                    <div class="text-right">
                      <span class="inline-flex px-3 py-1 rounded-full text-sm font-bold"
                            class:bg-green-100={deadline.status === 'completed'}
                            class:text-green-800={deadline.status === 'completed'}
                            class:bg-yellow-100={deadline.status === 'in_progress'}
                            class:text-yellow-800={deadline.status === 'in_progress'}
                            class:bg-red-100={deadline.status === 'pending'}
                            class:text-red-800={deadline.status === 'pending'}>
                        {deadline.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            
            <div class="text-center mt-8">
              <button class="bg-yellow-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-yellow-700 transition-colors"
                      on:click={() => dispatch('complianceAlert', { regulation: 'general', status: 'compliant', action: 'review_deadlines' })}>
                Revisar Todos los Vencimientos
              </button>
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .business-intelligence-experience {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .real-time-mode {
    --real-time-color: #10b981;
    --real-time-pulse: animation 2s infinite;
  }

  .ai-enhanced {
    --ai-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Premium business intelligence styling */
  .executive-dashboard {
    background-image: radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%), 
                      radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
  }

  /* Argentina business colors */
  .argentina-business {
    background: linear-gradient(135deg, #74b9ff 0%, #00b894 100%);
  }

  /* Smooth data transitions */
  .metric-transition {
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Responsive enhancements */
  @media (max-width: 768px) {
    .business-intelligence-experience h1 {
      font-size: 2rem;
    }
    
    .business-intelligence-experience .text-3xl {
      font-size: 1.5rem;
    }
    
    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* Enhanced accessibility */
  .business-intelligence-experience [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Professional data visualization */
  .data-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.08);
  }

  .data-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  /* Custom animations for metrics */
  @keyframes countUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .metric-animate {
    animation: countUp 0.6s ease-out forwards;
  }
</style>