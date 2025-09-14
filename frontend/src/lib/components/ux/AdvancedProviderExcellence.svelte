<!--
  Advanced Provider Excellence Design & Business Intelligence Visualization - D13-001
  Comprehensive provider dashboard with business intelligence visualization and strategic insights
  Provider success interfaces with performance analytics and growth opportunity visualization
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'dashboard' | 'analytics' | 'marketplace' | 'communication' | 'growth' | 'intelligence' = 'dashboard';
  export let providerId: string = '';
  export let providerType: 'individual' | 'shop' | 'chain' = 'individual';
  export let argentinaOptimized: boolean = true;
  export let realTimeData: boolean = true;
  export let aiInsights: boolean = true;

  const dispatch = createEventDispatcher<{
    businessDecision: { type: string; data: any; confidence: number };
    growthAction: { strategy: string; expectedImpact: number; timeline: string };
    marketplaceOptimization: { feature: string; improvement: number; competition: string };
    communicationStrategy: { channel: string; effectiveness: number; engagement: number };
  }>();

  // Advanced Provider Excellence Data with Argentina Market Intelligence
  const advancedProviderData = {
    comprehensiveDashboard: {
      providerProfile: {
        name: 'Carlos Mendez',
        type: 'Barberia Premium',
        location: 'Palermo, Buenos Aires',
        status: 'VIP Provider',
        experience_years: 8,
        specializations: ['Corte Clásico', 'Barba Tradicional', 'Styling Moderno'],
        certifications: ['Barbero Profesional', 'Técnicas Tradicionales', 'Productos Premium'],
        argentina_cultural_fit: {
          mate_breaks: true,
          siesta_scheduling: true,
          football_season_awareness: true,
          family_friendly: true,
          neighborhood_loyalty: 95
        }
      },
      businessMetrics: {
        revenue: {
          monthly: 89000, // ARS
          growth_rate: 18.5,
          target: 95000,
          projection: 92000,
          breakdown: {
            services: 67000,
            tips: 15000,
            products: 7000
          }
        },
        performance: {
          bookings_completed: 156,
          completion_rate: 97.4,
          average_rating: 4.9,
          repeat_customer_rate: 78,
          punctuality_score: 96
        },
        efficiency: {
          avg_service_time: 45, // minutes
          utilization_rate: 84,
          no_show_rate: 3.2,
          cancellation_rate: 5.1,
          peak_efficiency_hours: ['10:00-12:00', '17:00-19:00']
        }
      },
      realtimeAlerts: [
        {
          type: 'booking_surge',
          message: 'Demanda alta para mañana 18:00-20:00',
          action: 'Considerar aumentar precios en 15%',
          urgency: 'medium',
          potential_revenue: 12000
        },
        {
          type: 'competitor_pricing',
          message: 'Competidor en Palermo bajó precios 20%',
          action: 'Revisar estrategia de pricing',
          urgency: 'high',
          market_impact: 'high'
        },
        {
          type: 'customer_feedback',
          message: 'Cliente VIP dejó reseña 5★ mencionando puntualidad',
          action: 'Usar como testimonio en marketing',
          urgency: 'low',
          marketing_value: 'high'
        }
      ]
    },
    performanceAnalytics: {
      businessIntelligence: {
        revenue_patterns: {
          seasonal_trends: {
            summer: { multiplier: 1.2, peak_services: ['Corte veraniego', 'Afeitado refrescante'] },
            winter: { multiplier: 0.9, peak_services: ['Tratamiento capilar', 'Barba completa'] },
            football_season: { multiplier: 1.1, peak_days: ['viernes', 'sabado'] },
            holidays: { multiplier: 1.35, special_packages: true }
          },
          daily_patterns: {
            monday: { booking_rate: 0.7, optimal_pricing: 'standard' },
            tuesday: { booking_rate: 0.8, optimal_pricing: 'standard' },
            wednesday: { booking_rate: 0.9, optimal_pricing: 'standard' },
            thursday: { booking_rate: 1.0, optimal_pricing: 'premium' },
            friday: { booking_rate: 1.2, optimal_pricing: 'premium' },
            saturday: { booking_rate: 1.3, optimal_pricing: 'premium_plus' },
            sunday: { booking_rate: 0.6, optimal_pricing: 'family_discount' }
          },
          hourly_optimization: {
            peak_hours: { times: ['10:00-12:00', '17:00-19:00'], pricing: 'premium' },
            slow_hours: { times: ['14:00-16:00'], pricing: 'discount', promotions: true },
            appointment_gaps: { avg_gap: 12, optimization_potential: 23 }
          }
        },
        customer_insights: {
          demographics: {
            age_25_34: { percentage: 45, preferred_services: ['Corte moderno', 'Barba styling'], avg_spend: 4500 },
            age_35_44: { percentage: 32, preferred_services: ['Corte clásico', 'Tratamiento'], avg_spend: 5200 },
            age_45_plus: { percentage: 23, preferred_services: ['Corte tradicional', 'Afeitado'], avg_spend: 4800 }
          },
          loyalty_segments: {
            champions: { count: 23, avg_frequency: 'bi-weekly', lifetime_value: 45000 },
            regulars: { count: 67, avg_frequency: 'monthly', lifetime_value: 28000 },
            occasional: { count: 45, avg_frequency: 'quarterly', lifetime_value: 12000 }
          },
          satisfaction_drivers: [
            { factor: 'Calidad del corte', importance: 95, performance: 4.9 },
            { factor: 'Puntualidad', importance: 89, performance: 4.8 },
            { factor: 'Atención personalizada', importance: 87, performance: 4.7 },
            { factor: 'Ambiente del local', importance: 78, performance: 4.6 }
          ]
        }
      },
      growthOpportunities: [
        {
          opportunity: 'Servicios Premium de Fin de Semana',
          description: 'Paquetes especiales para eventos y ocasiones especiales',
          market_size: 'Alto potencial en Palermo',
          investment_required: 25000,
          expected_roi: 185,
          timeline: '6-8 semanas',
          confidence: 87
        },
        {
          opportunity: 'Programa de Fidelización Digital',
          description: 'App loyalty con puntos y recompensas automáticas',
          market_size: 'Mercado en crecimiento 34%',
          investment_required: 15000,
          expected_roi: 225,
          timeline: '4-6 semanas',
          confidence: 92
        },
        {
          opportunity: 'Expansión a Servicios Familiares',
          description: 'Cortes para niños y servicios grupales familiares',
          market_size: 'Demanda familiar alta en zona',
          investment_required: 35000,
          expected_roi: 156,
          timeline: '8-10 semanas',
          confidence: 78
        }
      ]
    },
    marketplacePositioning: {
      competitiveAnalysis: {
        direct_competitors: [
          {
            name: 'Barberia Palermo Classic',
            distance: '0.3 km',
            pricing: 'standard',
            rating: 4.6,
            strengths: ['Ubicación central', 'Precios competitivos'],
            weaknesses: ['Menor calidad', 'Tiempo de espera'],
            market_share: 15,
            threat_level: 'medium'
          },
          {
            name: 'Modern Cuts Studio',
            distance: '0.8 km',
            pricing: 'premium',
            rating: 4.8,
            strengths: ['Diseño moderno', 'Marketing digital'],
            weaknesses: ['Precios altos', 'Menos experiencia'],
            market_share: 12,
            threat_level: 'high'
          }
        ],
        competitive_advantages: [
          { advantage: 'Experiencia de 8 años', strength: 95, differentiator: true },
          { advantage: 'Rating 4.9/5', strength: 88, differentiator: true },
          { advantage: 'Ubicación premium Palermo', strength: 82, differentiator: false },
          { advantage: 'Precios competitivos', strength: 76, differentiator: false }
        ],
        market_positioning: {
          position: 'Premium experience at competitive price',
          target_segment: 'Professional males 25-45',
          value_proposition: 'Expertise + Quality + Reliability',
          pricing_strategy: 'Value-based premium'
        }
      },
      revenueOptimization: {
        dynamic_pricing: {
          current_strategy: 'time-based',
          optimization_potential: 23,
          suggested_improvements: [
            'Implement demand-based pricing',
            'Weekend premium rates (+15%)',
            'Early morning discount (-10%)',
            'Loyalty member rates (-5%)'
          ]
        },
        service_expansion: {
          high_margin_services: [
            { service: 'Tratamiento Capilar Premium', margin: 68, demand: 'growing' },
            { service: 'Paquete Novio', margin: 72, demand: 'seasonal' },
            { service: 'Consulta Estilismo Personal', margin: 85, demand: 'niche' }
          ],
          package_opportunities: [
            { package: 'Mantenimiento Mensual', services: 4, discount: 15, retention: 89 },
            { package: 'Combo Padre e Hijo', services: 2, discount: 20, family_appeal: 95 }
          ]
        }
      }
    },
    communicationExcellence: {
      channelEffectiveness: {
        whatsapp: {
          usage_rate: 78,
          response_time: 3.2, // minutes
          satisfaction: 4.8,
          booking_conversion: 89,
          features: ['Appointment reminders', 'Photo confirmations', 'Payment links']
        },
        platform_messaging: {
          usage_rate: 67,
          response_time: 12.5, // minutes
          satisfaction: 4.5,
          booking_conversion: 82,
          features: ['Booking updates', 'Service confirmations', 'Review requests']
        },
        phone_calls: {
          usage_rate: 23,
          response_time: 1.8, // minutes
          satisfaction: 4.9,
          booking_conversion: 95,
          features: ['Complex queries', 'Emergency bookings', 'Personal touch']
        }
      },
      relationshipManagement: {
        customer_segments: {
          vip_clients: {
            count: 28,
            communication_style: 'Personal and exclusive',
            preferred_channel: 'WhatsApp direct',
            special_treatment: ['Priority booking', 'Personalized service', 'Exclusive offers']
          },
          regular_clients: {
            count: 89,
            communication_style: 'Friendly and professional',
            preferred_channel: 'WhatsApp',
            engagement_strategy: ['Regular check-ins', 'Service reminders', 'Birthday specials']
          },
          new_clients: {
            count: 34,
            communication_style: 'Informative and welcoming',
            preferred_channel: 'Platform + WhatsApp',
            onboarding_flow: ['Welcome message', 'Service explanation', 'First visit follow-up']
          }
        },
        engagement_optimization: {
          personalization_level: 87,
          automated_messages: 12,
          personal_touch_ratio: 88,
          response_consistency: 94
        }
      }
    },
    growthStrategies: {
      businessExpansion: {
        market_opportunities: [
          {
            opportunity: 'Corporate Partnership Program',
            target: 'Empresas en Puerto Madero',
            potential_clients: 450,
            expected_revenue: 125000,
            implementation_time: '3 meses',
            success_probability: 78
          },
          {
            opportunity: 'Weekend Event Services',
            target: 'Casamientos y eventos especiales',
            potential_bookings: 24,
            expected_revenue: 89000,
            implementation_time: '6 semanas',
            success_probability: 85
          }
        ],
        operational_scaling: {
          staff_expansion: {
            current_capacity: 156, // monthly bookings
            optimal_capacity: 210,
            hire_recommendation: 'Junior barber + apprentice',
            investment: 45000,
            payback_period: '4 meses'
          },
          location_optimization: {
            current_utilization: 84,
            space_efficiency: 76,
            expansion_options: ['Add chair', 'Waiting area upgrade', 'Product retail space']
          }
        }
      },
      technologyAdoption: {
        automation_opportunities: [
          {
            process: 'Appointment Scheduling',
            automation_level: 67,
            improvement_potential: 28,
            tools: ['Smart calendar sync', 'AI slot optimization', 'Auto-rescheduling']
          },
          {
            process: 'Customer Communication',
            automation_level: 45,
            improvement_potential: 35,
            tools: ['Automated reminders', 'Follow-up sequences', 'Feedback collection']
          },
          {
            process: 'Inventory Management',
            automation_level: 23,
            improvement_potential: 67,
            tools: ['Smart stock alerts', 'Auto-reordering', 'Supplier integration']
          }
        ],
        digital_presence: {
          current_score: 78,
          improvement_areas: ['Instagram content', 'Google My Business', 'Customer reviews'],
          potential_impact: 34
        }
      }
    },
    strategicIntelligence: {
      predictiveAnalytics: {
        demand_forecasting: {
          next_week: { predicted_bookings: 42, confidence: 89, peak_days: ['Thursday', 'Friday', 'Saturday'] },
          next_month: { predicted_bookings: 168, confidence: 84, seasonal_factors: ['Back to work', 'Pre-summer prep'] },
          revenue_projection: { q2: 276000, confidence: 87, growth_assumptions: 'Current trends + optimizations' }
        },
        customer_behavior: {
          churn_prediction: { at_risk_customers: 8, early_intervention: true, retention_strategies: 'Active' },
          upsell_opportunities: { potential_clients: 23, services: ['Premium treatments'], revenue_potential: 28000 },
          loyalty_trends: { improving: 78, stable: 18, declining: 4 }
        }
      },
      marketIntelligence: {
        argentina_trends: {
          cultural_factors: {
            football_season_impact: 15, // % increase during football
            economic_sensitivity: 'medium',
            family_booking_preference: 67,
            mate_break_scheduling: true
          },
          seasonal_adjustments: {
            summer_services: ['Cortes frescos', 'Afeitados', 'Hydratación'],
            winter_services: ['Tratamientos', 'Barbas completas', 'Cuidado capilar'],
            holiday_periods: ['Navidad', 'Año Nuevo', 'Vacaciones de invierno']
          }
        },
        local_insights: {
          palermo_specific: {
            client_profile: 'Young professionals + Artists',
            price_sensitivity: 'low',
            service_preferences: ['Modern cuts', 'Styling', 'Premium treatments'],
            competition_level: 'high'
          }
        }
      }
    }
  };

  // Component State
  let currentData = writable({});
  let selectedTimeframe = '30d';
  let selectedMetric = 'revenue';
  let dashboardView = 'overview';
  let lastUpdate = new Date();

  onMount(() => {
    initializeVariant();
    if (realTimeData) {
      startRealTimeUpdates();
    }
    trackAdvancedProviderExperience();
  });

  function initializeVariant() {
    switch (variant) {
      case 'dashboard':
        initializeComprehensiveDashboard();
        break;
      case 'analytics':
        initializePerformanceAnalytics();
        break;
      case 'marketplace':
        initializeMarketplacePositioning();
        break;
      case 'communication':
        initializeCommunicationExcellence();
        break;
      case 'growth':
        initializeGrowthStrategies();
        break;
      case 'intelligence':
        initializeStrategicIntelligence();
        break;
    }
  }

  function initializeComprehensiveDashboard() {
    currentData.set({
      ...advancedProviderData.comprehensiveDashboard,
      todayMetrics: {
        bookings_today: 8,
        revenue_today: 12500,
        avg_rating_today: 4.9,
        completion_rate_today: 100
      }
    });
  }

  function initializePerformanceAnalytics() {
    currentData.set({
      ...advancedProviderData.performanceAnalytics,
      analyticsInsights: {
        top_insight: 'Weekend bookings show 35% higher profit margins',
        optimization_recommendation: 'Focus premium services on Friday-Sunday',
        predicted_impact: 28000
      }
    });
  }

  function initializeMarketplacePositioning() {
    currentData.set({
      ...advancedProviderData.marketplacePositioning,
      competitiveScore: 87,
      marketPosition: 'Top 15% in Palermo area'
    });
  }

  function initializeCommunicationExcellence() {
    currentData.set({
      ...advancedProviderData.communicationExcellence,
      communicationScore: 94,
      responseTime: '3.2 minutes average'
    });
  }

  function initializeGrowthStrategies() {
    currentData.set({
      ...advancedProviderData.growthStrategies,
      growthPotential: 185,
      priorityActions: 3
    });
  }

  function initializeStrategicIntelligence() {
    currentData.set({
      ...advancedProviderData.strategicIntelligence,
      intelligenceScore: 91,
      predictions: 'High confidence forecasts available'
    });
  }

  function startRealTimeUpdates() {
    setInterval(() => {
      updateRealTimeMetrics();
      lastUpdate = new Date();
    }, 30000); // Update every 30 seconds
  }

  function updateRealTimeMetrics() {
    // Simulate real-time updates
    const currentMetrics = $currentData.businessMetrics;
    if (currentMetrics) {
      // Small random variations
      currentMetrics.performance.bookings_completed += Math.floor(Math.random() * 3);
      currentMetrics.efficiency.utilization_rate += (Math.random() - 0.5) * 2;
      currentData.update(data => ({ ...data, businessMetrics: currentMetrics }));
    }
  }

  function handleBusinessDecision(type: string, data: any, confidence: number) {
    dispatch('businessDecision', { type, data, confidence });

    uxAnalytics.trackExternalEvent('provider_business_decision', {
      type,
      confidence,
      providerId,
      providerType,
      variant
    });
  }

  function handleGrowthAction(strategy: string, expectedImpact: number, timeline: string) {
    dispatch('growthAction', { strategy, expectedImpact, timeline });

    uxAnalytics.trackExternalEvent('provider_growth_action', {
      strategy,
      expectedImpact,
      timeline,
      providerId,
      variant
    });
  }

  function trackAdvancedProviderExperience() {
    uxAnalytics.trackExternalEvent('advanced_provider_experience_view', {
      variant,
      providerId,
      providerType,
      argentinaOptimized,
      realTimeData,
      aiInsights
    });
  }

  function formatArgentinaCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getGrowthColor(value: number): string {
    if (value > 15) return 'text-green-600';
    if (value > 5) return 'text-blue-600';
    if (value > 0) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getPerformanceColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getCompetitiveThreat(level: string): string {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[level] || colors.medium;
  }

  $: currentVariantData = $currentData;
</script>

<div class="advanced-provider-excellence" class:argentina-optimized={argentinaOptimized} class:real-time-enabled={realTimeData}>
  {#if variant === 'dashboard'}
    <!-- Comprehensive Provider Dashboard -->
    <section class="provider-dashboard bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Provider Header -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-6">
              <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {currentVariantData.providerProfile?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  {currentVariantData.providerProfile?.name || 'Carlos Mendez'}
                </h1>
                <p class="text-gray-600 text-lg">
                  {currentVariantData.providerProfile?.type || 'Barberia Premium'}
                </p>
                <div class="flex items-center space-x-4 mt-2">
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {currentVariantData.providerProfile?.status || 'VIP Provider'}
                  </span>
                  <span class="text-sm text-gray-500">
                    📍 {currentVariantData.providerProfile?.location || 'Palermo, Buenos Aires'}
                  </span>
                  <span class="text-sm text-gray-500">
                    🏆 {currentVariantData.providerProfile?.experience_years || 8} años experiencia
                  </span>
                </div>
              </div>
            </div>

            <div class="text-right">
              {#if realTimeData}
                <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-2">
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-green-700 font-medium text-sm">En Vivo</span>
                  </div>
                </div>
              {/if}
              <div class="text-sm text-gray-500">
                Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        <!-- Key Performance Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <!-- Revenue Metric -->
          <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Ingresos Mensuales</div>
              <div class="text-2xl">💰</div>
            </div>
            <div class="text-3xl font-bold text-green-600 mb-2">
              {formatArgentinaCurrency(currentVariantData.businessMetrics?.revenue?.monthly || 89000)}
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm {getGrowthColor(currentVariantData.businessMetrics?.revenue?.growth_rate || 18.5)} font-medium">
                📈 {(currentVariantData.businessMetrics?.revenue?.growth_rate || 18.5).toFixed(1)}%
              </span>
              <span class="text-xs text-gray-500">vs. anterior</span>
            </div>
            <div class="mt-3">
              <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progreso al objetivo</span>
                <span>{(((currentVariantData.businessMetrics?.revenue?.monthly || 89000) / (currentVariantData.businessMetrics?.revenue?.target || 95000)) * 100).toFixed(0)}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                     style="width: {Math.min(((currentVariantData.businessMetrics?.revenue?.monthly || 89000) / (currentVariantData.businessMetrics?.revenue?.target || 95000)) * 100, 100)}%"></div>
              </div>
            </div>
          </div>

          <!-- Performance Metric -->
          <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Rating Promedio</div>
              <div class="text-2xl">⭐</div>
            </div>
            <div class="text-3xl font-bold text-yellow-500 mb-2">
              {currentVariantData.businessMetrics?.performance?.average_rating || 4.9}/5
            </div>
            <div class="text-sm text-gray-600">
              {currentVariantData.businessMetrics?.performance?.bookings_completed || 156} servicios completados
            </div>
          </div>

          <!-- Efficiency Metric -->
          <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Utilización</div>
              <div class="text-2xl">⚙️</div>
            </div>
            <div class="text-3xl font-bold text-blue-600 mb-2">
              {currentVariantData.businessMetrics?.efficiency?.utilization_rate || 84}%
            </div>
            <div class="text-sm text-gray-600">
              Promedio {currentVariantData.businessMetrics?.efficiency?.avg_service_time || 45} min/servicio
            </div>
          </div>

          <!-- Customer Loyalty -->
          <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Clientes Recurrentes</div>
              <div class="text-2xl">❤️</div>
            </div>
            <div class="text-3xl font-bold text-purple-600 mb-2">
              {currentVariantData.businessMetrics?.performance?.repeat_customer_rate || 78}%
            </div>
            <div class="text-sm text-gray-600">
              Tasa de puntualidad: {currentVariantData.businessMetrics?.performance?.punctuality_score || 96}%
            </div>
          </div>
        </div>

        <!-- Real-time Alerts -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">🚨 Alertas de Negocio en Tiempo Real</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each currentVariantData.realtimeAlerts || [] as alert}
              <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                   class:border-red-300={alert.urgency === 'high'}
                   class:bg-red-50={alert.urgency === 'high'}
                   class:border-yellow-300={alert.urgency === 'medium'}
                   class:bg-yellow-50={alert.urgency === 'medium'}
                   class:border-green-300={alert.urgency === 'low'}
                   class:bg-green-50={alert.urgency === 'low'}>

                <div class="flex items-start justify-between mb-4">
                  <div class="text-2xl">
                    {#if alert.type === 'booking_surge'}📈
                    {:else if alert.type === 'competitor_pricing'}⚡
                    {:else if alert.type === 'customer_feedback'}💬
                    {:else}🔔
                    {/if}
                  </div>
                  <span class="px-2 py-1 rounded-full text-xs font-bold"
                        class:bg-red-200={alert.urgency === 'high'}
                        class:text-red-800={alert.urgency === 'high'}
                        class:bg-yellow-200={alert.urgency === 'medium'}
                        class:text-yellow-800={alert.urgency === 'medium'}
                        class:bg-green-200={alert.urgency === 'low'}
                        class:text-green-800={alert.urgency === 'low'}>
                    {alert.urgency.toUpperCase()}
                  </span>
                </div>

                <h3 class="font-bold text-gray-900 mb-2">{alert.message}</h3>
                <p class="text-sm text-gray-700 mb-4">{alert.action}</p>

                <div class="flex items-center justify-between">
                  {#if alert.potential_revenue}
                    <span class="text-sm font-medium text-green-600">
                      Potencial: {formatArgentinaCurrency(alert.potential_revenue)}
                    </span>
                  {:else if alert.market_impact}
                    <span class="text-sm font-medium text-blue-600">
                      Impacto: {alert.market_impact}
                    </span>
                  {:else if alert.marketing_value}
                    <span class="text-sm font-medium text-purple-600">
                      Valor marketing: {alert.marketing_value}
                    </span>
                  {/if}

                  <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          on:click={() => handleBusinessDecision(alert.type, alert, 85)}>
                    Actuar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Argentina Cultural Adaptations -->
        {#if argentinaOptimized}
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">🇦🇷 Adaptaciones Culturales Argentina</h2>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="text-center p-4 bg-white rounded-lg shadow-sm">
                <div class="text-3xl mb-2">🧉</div>
                <div class="text-sm font-medium text-gray-900">Breaks para Mate</div>
                <div class="text-xs text-green-600 mt-1">✓ Configurado</div>
              </div>

              <div class="text-center p-4 bg-white rounded-lg shadow-sm">
                <div class="text-3xl mb-2">😴</div>
                <div class="text-sm font-medium text-gray-900">Horario Siesta</div>
                <div class="text-xs text-green-600 mt-1">✓ Optimizado</div>
              </div>

              <div class="text-center p-4 bg-white rounded-lg shadow-sm">
                <div class="text-3xl mb-2">⚽</div>
                <div class="text-sm font-medium text-gray-900">Temporada Fútbol</div>
                <div class="text-xs text-blue-600 mt-1">Awareness activo</div>
              </div>

              <div class="text-center p-4 bg-white rounded-lg shadow-sm">
                <div class="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                <div class="text-sm font-medium text-gray-900">Servicios Familiares</div>
                <div class="text-xs text-purple-600 mt-1">95% loyalty</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'analytics'}
    <!-- Performance Analytics with Business Intelligence -->
    <section class="analytics-section bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Analítica de Rendimiento</h1>
          <p class="text-gray-700">Business intelligence con insights estratégicos</p>
        </div>

        <!-- Revenue Pattern Analysis -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Patrones de Ingresos</h2>

          <!-- Seasonal Trends -->
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Tendencias Estacionales</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              {#each Object.entries(currentVariantData.businessIntelligence?.revenue_patterns?.seasonal_trends || {}) as [season, data]}
                <div class="bg-white rounded-xl p-6 shadow-sm">
                  <div class="text-center">
                    <div class="text-3xl mb-3">
                      {#if season === 'summer'}☀️
                      {:else if season === 'winter'}❄️
                      {:else if season === 'football_season'}⚽
                      {:else if season === 'holidays'}🎉
                      {:else}📅
                      {/if}
                    </div>

                    <h4 class="font-bold text-gray-900 mb-2 capitalize">
                      {#if season === 'summer'}Verano
                      {:else if season === 'winter'}Invierno
                      {:else if season === 'football_season'}Temporada Fútbol
                      {:else if season === 'holidays'}Feriados
                      {:else}{season}
                      {/if}
                    </h4>

                    <div class="text-2xl font-bold text-green-600 mb-2">
                      {data.multiplier}x
                    </div>

                    <div class="text-sm text-gray-600">
                      {#if data.peak_services}
                        Top servicios:
                        {#each data.peak_services.slice(0,2) as service}
                          <div class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1">{service}</div>
                        {/each}
                      {:else if data.peak_days}
                        Días pico: {data.peak_days.join(', ')}
                      {:else if data.special_packages}
                        Paquetes especiales disponibles
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Daily Patterns -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Patrones Diarios</h3>
            <div class="grid grid-cols-2 md:grid-cols-7 gap-4">
              {#each Object.entries(currentVariantData.businessIntelligence?.revenue_patterns?.daily_patterns || {}) as [day, data]}
                <div class="text-center p-4 rounded-lg border border-gray-200"
                     class:bg-green-50={data.booking_rate >= 1.2}
                     class:border-green-300={data.booking_rate >= 1.2}
                     class:bg-blue-50={data.booking_rate >= 1.0 && data.booking_rate < 1.2}
                     class:border-blue-300={data.booking_rate >= 1.0 && data.booking_rate < 1.2}
                     class:bg-gray-50={data.booking_rate < 1.0}>

                  <div class="font-bold text-gray-900 mb-2 capitalize">
                    {#if day === 'monday'}Lun
                    {:else if day === 'tuesday'}Mar
                    {:else if day === 'wednesday'}Mié
                    {:else if day === 'thursday'}Jue
                    {:else if day === 'friday'}Vie
                    {:else if day === 'saturday'}Sáb
                    {:else if day === 'sunday'}Dom
                    {:else}{day.slice(0,3)}
                    {/if}
                  </div>

                  <div class="text-lg font-bold mb-1"
                       class:text-green-600={data.booking_rate >= 1.2}
                       class:text-blue-600={data.booking_rate >= 1.0 && data.booking_rate < 1.2}
                       class:text-gray-600={data.booking_rate < 1.0}>
                    {data.booking_rate}x
                  </div>

                  <div class="text-xs text-gray-600 capitalize">
                    {data.optimal_pricing.replace('_', ' ')}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Customer Insights -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <!-- Demographics -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Demografia de Clientes</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.businessIntelligence?.customer_insights?.demographics || {}) as [ageGroup, data]}
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900">
                      {ageGroup.replace('age_', '').replace('_', '-')} años
                    </div>
                    <div class="text-sm text-gray-600">
                      Gasto promedio: {formatArgentinaCurrency(data.avg_spend)}
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="text-lg font-bold text-blue-600">{data.percentage}%</div>
                    <div class="text-sm text-gray-600">del total</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Loyalty Segments -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Segmentos de Lealtad</h3>
            <div class="space-y-4">
              {#each Object.entries(currentVariantData.businessIntelligence?.customer_insights?.loyalty_segments || {}) as [segment, data]}
                <div class="p-4 rounded-lg border border-gray-200"
                     class:bg-yellow-50={segment === 'champions'}
                     class:border-yellow-300={segment === 'champions'}
                     class:bg-blue-50={segment === 'regulars'}
                     class:border-blue-300={segment === 'regulars'}
                     class:bg-gray-50={segment === 'occasional'}>

                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-gray-900 capitalize">
                      {#if segment === 'champions'}Campeones 🏆
                      {:else if segment === 'regulars'}Regulares 💙
                      {:else if segment === 'occasional'}Ocasionales 📅
                      {:else}{segment}
                      {/if}
                    </h4>
                    <span class="text-lg font-bold"
                          class:text-yellow-600={segment === 'champions'}
                          class:text-blue-600={segment === 'regulars'}
                          class:text-gray-600={segment === 'occasional'}>
                      {data.count}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div class="text-gray-600">Frecuencia:</div>
                      <div class="font-medium">{data.avg_frequency}</div>
                    </div>
                    <div>
                      <div class="text-gray-600">LTV:</div>
                      <div class="font-medium">{formatArgentinaCurrency(data.lifetime_value)}</div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Growth Opportunities -->
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Oportunidades de Crecimiento</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each currentVariantData.growthOpportunities || [] as opportunity}
              <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 class="text-lg font-bold text-gray-900 mb-3">{opportunity.opportunity}</h3>
                <p class="text-gray-700 text-sm mb-4">{opportunity.description}</p>

                <div class="space-y-3 mb-4">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Inversión:</span>
                    <span class="font-medium">{formatArgentinaCurrency(opportunity.investment_required)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">ROI esperado:</span>
                    <span class="font-medium text-green-600">{opportunity.expected_roi}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Timeline:</span>
                    <span class="font-medium">{opportunity.timeline}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-purple-600">
                    Confianza: {opportunity.confidence}%
                  </span>
                  <button class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          on:click={() => handleGrowthAction(opportunity.opportunity, opportunity.expected_roi, opportunity.timeline)}>
                    Implementar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'marketplace'}
    <!-- Marketplace Positioning -->
    <section class="marketplace-section bg-gradient-to-br from-orange-50 to-red-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Posicionamiento en el Mercado</h1>
          <p class="text-gray-700">Análisis competitivo y optimización de ingresos</p>
        </div>

        <!-- Competitive Analysis -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Análisis Competitivo</h2>

          <div class="space-y-6">
            {#each currentVariantData.competitiveAnalysis?.direct_competitors || [] as competitor}
              <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-4">
                      <h3 class="text-lg font-bold text-gray-900">{competitor.name}</h3>
                      <span class="px-3 py-1 rounded-full text-sm font-medium {getCompetitiveThreat(competitor.threat_level)}">
                        {competitor.threat_level.toUpperCase()}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Distancia</div>
                        <div class="font-bold">{competitor.distance}</div>
                      </div>
                      <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Rating</div>
                        <div class="font-bold text-yellow-600">{competitor.rating}/5</div>
                      </div>
                      <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Precios</div>
                        <div class="font-bold capitalize">{competitor.pricing}</div>
                      </div>
                      <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Market Share</div>
                        <div class="font-bold">{competitor.market_share}%</div>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 class="font-medium text-green-800 mb-2">Fortalezas:</h4>
                        <ul class="text-sm text-green-700 space-y-1">
                          {#each competitor.strengths as strength}
                            <li>• {strength}</li>
                          {/each}
                        </ul>
                      </div>
                      <div>
                        <h4 class="font-medium text-red-800 mb-2">Debilidades:</h4>
                        <ul class="text-sm text-red-700 space-y-1">
                          {#each competitor.weaknesses as weakness}
                            <li>• {weakness}</li>
                          {/each}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Competitive Advantages -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Advantages -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Ventajas Competitivas</h3>
            <div class="space-y-4">
              {#each currentVariantData.competitiveAnalysis?.competitive_advantages || [] as advantage}
                <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                     class:bg-green-50={advantage.differentiator}
                     class:border-green-300={advantage.differentiator}>

                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{advantage.advantage}</div>
                    {#if advantage.differentiator}
                      <div class="text-sm text-green-600 font-medium">✓ Diferenciador clave</div>
                    {/if}
                  </div>

                  <div class="text-center">
                    <div class="text-lg font-bold {getPerformanceColor(advantage.strength)}">{advantage.strength}</div>
                    <div class="text-xs text-gray-500">Fortaleza</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Market Positioning -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Posicionamiento de Mercado</h3>

            <div class="space-y-4">
              <div class="bg-white rounded-lg p-4">
                <div class="text-sm text-gray-600 mb-1">Posición:</div>
                <div class="font-bold text-blue-600">
                  {currentVariantData.competitiveAnalysis?.market_positioning?.position || 'Premium experience at competitive price'}
                </div>
              </div>

              <div class="bg-white rounded-lg p-4">
                <div class="text-sm text-gray-600 mb-1">Segmento objetivo:</div>
                <div class="font-medium">
                  {currentVariantData.competitiveAnalysis?.market_positioning?.target_segment || 'Professional males 25-45'}
                </div>
              </div>

              <div class="bg-white rounded-lg p-4">
                <div class="text-sm text-gray-600 mb-1">Propuesta de valor:</div>
                <div class="font-medium">
                  {currentVariantData.competitiveAnalysis?.market_positioning?.value_proposition || 'Expertise + Quality + Reliability'}
                </div>
              </div>

              <div class="bg-white rounded-lg p-4">
                <div class="text-sm text-gray-600 mb-1">Estrategia de precios:</div>
                <div class="font-medium text-green-600">
                  {currentVariantData.competitiveAnalysis?.market_positioning?.pricing_strategy || 'Value-based premium'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'communication'}
    <!-- Communication Excellence -->
    <section class="communication-section bg-gradient-to-br from-green-50 to-teal-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Excelencia en Comunicación</h1>
          <p class="text-gray-700">Gestión de relaciones y optimización de engagement</p>
        </div>

        <!-- Channel Effectiveness -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {#each Object.entries(currentVariantData.channelEffectiveness || {}) as [channel, data]}
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <div class="text-center">
                <div class="text-4xl mb-4">
                  {#if channel === 'whatsapp'}💬
                  {:else if channel === 'platform_messaging'}💻
                  {:else if channel === 'phone_calls'}📞
                  {:else}📱
                  {/if}
                </div>

                <h3 class="text-lg font-bold text-gray-900 mb-6 capitalize">
                  {#if channel === 'whatsapp'}WhatsApp
                  {:else if channel === 'platform_messaging'}Mensajería Plataforma
                  {:else if channel === 'phone_calls'}Llamadas Telefónicas
                  {:else}{channel.replace('_', ' ')}
                  {/if}
                </h3>

                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Uso:</span>
                    <span class="font-bold text-blue-600">{data.usage_rate}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Tiempo respuesta:</span>
                    <span class="font-bold text-green-600">{data.response_time}{typeof data.response_time === 'number' ? ' min' : ''}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Satisfacción:</span>
                    <span class="font-bold text-yellow-600">{data.satisfaction}⭐</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Conversión:</span>
                    <span class="font-bold text-purple-600">{data.booking_conversion}%</span>
                  </div>
                </div>

                <div class="mt-6">
                  <div class="text-sm font-medium text-gray-700 mb-2">Características:</div>
                  <div class="space-y-1">
                    {#each data.features as feature}
                      <div class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{feature}</div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Relationship Management -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Gestión de Relaciones con Clientes</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each Object.entries(currentVariantData.relationshipManagement?.customer_segments || {}) as [segment, data]}
              <div class="border border-gray-200 rounded-xl p-6"
                   class:bg-yellow-50={segment === 'vip_clients'}
                   class:border-yellow-300={segment === 'vip_clients'}
                   class:bg-blue-50={segment === 'regular_clients'}
                   class:border-blue-300={segment === 'regular_clients'}
                   class:bg-green-50={segment === 'new_clients'}
                   class:border-green-300={segment === 'new_clients'}>

                <div class="text-center mb-4">
                  <div class="text-3xl mb-2">
                    {#if segment === 'vip_clients'}👑
                    {:else if segment === 'regular_clients'}💙
                    {:else if segment === 'new_clients'}🌟
                    {:else}👥
                    {/if}
                  </div>

                  <h3 class="font-bold text-gray-900 mb-2">
                    {#if segment === 'vip_clients'}Clientes VIP
                    {:else if segment === 'regular_clients'}Clientes Regulares
                    {:else if segment === 'new_clients'}Clientes Nuevos
                    {:else}{segment.replace('_', ' ')}
                    {/if}
                  </h3>

                  <div class="text-2xl font-bold mb-2"
                       class:text-yellow-600={segment === 'vip_clients'}
                       class:text-blue-600={segment === 'regular_clients'}
                       class:text-green-600={segment === 'new_clients'}>
                    {data.count}
                  </div>
                </div>

                <div class="space-y-3 text-sm">
                  <div>
                    <div class="text-gray-600 font-medium">Estilo comunicación:</div>
                    <div class="text-gray-800">{data.communication_style}</div>
                  </div>

                  <div>
                    <div class="text-gray-600 font-medium">Canal preferido:</div>
                    <div class="text-gray-800">{data.preferred_channel}</div>
                  </div>

                  <div>
                    <div class="text-gray-600 font-medium mb-2">
                      {segment === 'vip_clients' ? 'Tratamiento especial:' : segment === 'regular_clients' ? 'Estrategia engagement:' : 'Flujo onboarding:'}
                    </div>
                    <div class="space-y-1">
                      {#each (data.special_treatment || data.engagement_strategy || data.onboarding_flow || []) as item}
                        <div class="text-xs bg-white px-2 py-1 rounded border">{item}</div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'growth'}
    <!-- Growth Strategies -->
    <section class="growth-section bg-gradient-to-br from-purple-50 to-indigo-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Estrategias de Crecimiento</h1>
          <p class="text-gray-700">Expansión del negocio y adopción de tecnología</p>
        </div>

        <!-- Market Opportunities -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Oportunidades de Mercado</h2>
          <div class="space-y-6">
            {#each currentVariantData.businessExpansion?.market_opportunities || [] as opportunity}
              <div class="bg-white rounded-xl p-8 shadow-lg border-l-4 border-purple-500">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900 mb-3">{opportunity.opportunity}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div class="text-center p-3 bg-purple-50 rounded-lg">
                        <div class="text-sm text-purple-600">Target</div>
                        <div class="font-bold">{opportunity.target}</div>
                      </div>
                      <div class="text-center p-3 bg-blue-50 rounded-lg">
                        <div class="text-sm text-blue-600">Clientes potenciales</div>
                        <div class="font-bold">{opportunity.potential_clients || opportunity.potential_bookings}</div>
                      </div>
                      <div class="text-center p-3 bg-green-50 rounded-lg">
                        <div class="text-sm text-green-600">Ingresos esperados</div>
                        <div class="font-bold">{formatArgentinaCurrency(opportunity.expected_revenue)}</div>
                      </div>
                      <div class="text-center p-3 bg-yellow-50 rounded-lg">
                        <div class="text-sm text-yellow-600">Timeline</div>
                        <div class="font-bold">{opportunity.implementation_time}</div>
                      </div>
                    </div>
                  </div>

                  <div class="ml-6 text-center">
                    <div class="text-2xl font-bold text-purple-600 mb-1">{opportunity.success_probability}%</div>
                    <div class="text-sm text-gray-600 mb-4">Probabilidad éxito</div>
                    <button class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                            on:click={() => handleGrowthAction(opportunity.opportunity, opportunity.expected_revenue, opportunity.implementation_time)}>
                      Implementar
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Technology Adoption -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Adopción de Tecnología</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each currentVariantData.technologyAdoption?.automation_opportunities || [] as automation}
              <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-center space-x-3 mb-4">
                  <span class="text-2xl">🤖</span>
                  <h3 class="font-bold text-gray-900">{automation.process}</h3>
                </div>

                <div class="space-y-4">
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-600">Automatización actual:</span>
                      <span class="font-medium">{automation.automation_level}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-blue-500 h-2 rounded-full" style="width: {automation.automation_level}%"></div>
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-600">Potencial mejora:</span>
                      <span class="font-medium text-green-600">+{automation.improvement_potential}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-green-500 h-2 rounded-full" style="width: {automation.improvement_potential}%"></div>
                    </div>
                  </div>

                  <div>
                    <div class="text-sm font-medium text-gray-700 mb-2">Herramientas recomendadas:</div>
                    <div class="space-y-1">
                      {#each automation.tools as tool}
                        <div class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{tool}</div>
                      {/each}
                    </div>
                  </div>
                </div>

                <button class="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                  Evaluar Implementación
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'intelligence'}
    <!-- Strategic Intelligence -->
    <section class="intelligence-section bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Inteligencia Estratégica</h1>
          <p class="text-gray-700">Analítica predictiva e insights de mercado</p>
        </div>

        <!-- Predictive Analytics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <!-- Demand Forecasting -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Predicción de Demanda</h3>

            <div class="space-y-6">
              <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 class="font-medium text-blue-900 mb-2">Próxima semana</h4>
                <div class="text-2xl font-bold text-blue-600 mb-2">
                  {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_week?.predicted_bookings || 42} reservas
                </div>
                <div class="text-sm text-blue-700">
                  Confianza: {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_week?.confidence}%
                </div>
                <div class="text-xs text-blue-600 mt-2">
                  Días pico: {(currentVariantData.predictiveAnalytics?.demand_forecasting?.next_week?.peak_days || []).join(', ')}
                </div>
              </div>

              <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 class="font-medium text-green-900 mb-2">Próximo mes</h4>
                <div class="text-2xl font-bold text-green-600 mb-2">
                  {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_month?.predicted_bookings || 168} reservas
                </div>
                <div class="text-sm text-green-700">
                  Confianza: {currentVariantData.predictiveAnalytics?.demand_forecasting?.next_month?.confidence}%
                </div>
              </div>

              <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 class="font-medium text-purple-900 mb-2">Proyección Q2</h4>
                <div class="text-2xl font-bold text-purple-600 mb-2">
                  {formatArgentinaCurrency(currentVariantData.predictiveAnalytics?.demand_forecasting?.revenue_projection?.q2 || 276000)}
                </div>
                <div class="text-sm text-purple-700">
                  Confianza: {currentVariantData.predictiveAnalytics?.demand_forecasting?.revenue_projection?.confidence}%
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Behavior -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Comportamiento del Cliente</h3>

            <div class="space-y-6">
              <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 class="font-medium text-red-900 mb-2">Predicción de Churn</h4>
                <div class="text-2xl font-bold text-red-600 mb-2">
                  {currentVariantData.predictiveAnalytics?.customer_behavior?.churn_prediction?.at_risk_customers || 8} en riesgo
                </div>
                <div class="text-sm text-red-700">
                  Intervención temprana: {currentVariantData.predictiveAnalytics?.customer_behavior?.churn_prediction?.early_intervention ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 class="font-medium text-yellow-900 mb-2">Oportunidades Upsell</h4>
                <div class="text-2xl font-bold text-yellow-600 mb-2">
                  {currentVariantData.predictiveAnalytics?.customer_behavior?.upsell_opportunities?.potential_clients || 23} clientes
                </div>
                <div class="text-sm text-yellow-700">
                  Potencial: {formatArgentinaCurrency(currentVariantData.predictiveAnalytics?.customer_behavior?.upsell_opportunities?.revenue_potential || 28000)}
                </div>
              </div>

              <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 class="font-medium text-green-900 mb-2">Tendencias de Lealtad</h4>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div class="font-bold text-green-600">{currentVariantData.predictiveAnalytics?.customer_behavior?.loyalty_trends?.improving || 78}%</div>
                    <div class="text-xs text-green-700">Mejorando</div>
                  </div>
                  <div>
                    <div class="font-bold text-blue-600">{currentVariantData.predictiveAnalytics?.customer_behavior?.loyalty_trends?.stable || 18}%</div>
                    <div class="text-xs text-blue-700">Estable</div>
                  </div>
                  <div>
                    <div class="font-bold text-red-600">{currentVariantData.predictiveAnalytics?.customer_behavior?.loyalty_trends?.declining || 4}%</div>
                    <div class="text-xs text-red-700">Declinando</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Market Intelligence -->
        {#if argentinaOptimized}
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">🇦🇷 Inteligencia de Mercado Argentina</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Cultural Factors -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Factores Culturales</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-700">Impacto temporada fútbol:</span>
                    <span class="font-bold text-blue-600">+{currentVariantData.marketIntelligence?.argentina_trends?.cultural_factors?.football_season_impact || 15}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-700">Sensibilidad económica:</span>
                    <span class="font-bold text-yellow-600">
                      {currentVariantData.marketIntelligence?.argentina_trends?.cultural_factors?.economic_sensitivity || 'Media'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-700">Preferencia reservas familiares:</span>
                    <span class="font-bold text-green-600">{currentVariantData.marketIntelligence?.argentina_trends?.cultural_factors?.family_booking_preference || 67}%</span>
                  </div>
                </div>
              </div>

              <!-- Local Insights -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Insights Locales - Palermo</h3>
                <div class="space-y-3">
                  <div>
                    <div class="text-sm text-gray-600">Perfil del cliente:</div>
                    <div class="font-medium">
                      {currentVariantData.marketIntelligence?.local_insights?.palermo_specific?.client_profile || 'Young professionals + Artists'}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-600">Sensibilidad precio:</div>
                    <div class="font-medium text-green-600">
                      {currentVariantData.marketIntelligence?.local_insights?.palermo_specific?.price_sensitivity || 'Baja'}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-600">Nivel competencia:</div>
                    <div class="font-medium text-red-600">
                      {currentVariantData.marketIntelligence?.local_insights?.palermo_specific?.competition_level || 'Alto'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .advanced-provider-excellence {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .argentina-optimized {
    --argentina-primary: #74b9ff;
    --argentina-secondary: #00b894;
    --argentina-accent: #fdcb6e;
  }

  .real-time-enabled {
    --realtime-color: #10b981;
    --realtime-pulse: 2s infinite;
  }

  /* Premium provider dashboard styling */
  .provider-dashboard {
    background-image: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  }

  /* Analytics visualization */
  .analytics-section {
    background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
  }

  /* Competitive analysis colors */
  .marketplace-section {
    background-image: radial-gradient(circle at 30% 70%, rgba(249, 115, 22, 0.1) 0%, transparent 50%);
  }

  /* Real-time pulse animation */
  @keyframes realtimePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .realtime-indicator {
    animation: realtimePulse var(--realtime-pulse);
  }

  /* Growth opportunity cards */
  .growth-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    transition: all 0.3s ease;
  }

  .growth-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  /* Intelligence dashboard */
  .intelligence-section {
    background-image: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  }

  /* Argentina cultural adaptations */
  .argentina-colors {
    background: linear-gradient(135deg, #74b9ff 0%, #00b894 100%);
  }

  /* Responsive optimizations */
  @media (max-width: 768px) {
    .advanced-provider-excellence h1 {
      font-size: 2rem;
    }

    .advanced-provider-excellence .text-3xl {
      font-size: 1.75rem;
    }

    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .grid.grid-cols-7 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* Accessibility enhancements */
  .advanced-provider-excellence [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Premium animations */
  @keyframes slideInFromRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes countUp {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-slide-right {
    animation: slideInFromRight 0.6s ease-out forwards;
  }

  .animate-count-up {
    animation: countUp 0.5s ease-out forwards;
  }

  /* Data visualization elements */
  .chart-bar {
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .metric-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.08);
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  /* Competitive threat indicators */
  .threat-indicator {
    position: relative;
    overflow: hidden;
  }

  .threat-indicator::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .threat-indicator:hover::before {
    left: 100%;
  }
</style>