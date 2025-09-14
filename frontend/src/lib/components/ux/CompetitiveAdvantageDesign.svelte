<!--
  Competitive Advantage Design & Market Leadership Positioning - D13-001
  Market differentiation elements with premium positioning and competitive advantage highlighting
  Brand excellence interfaces with Argentina cultural alignment and premium market positioning
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'differentiation' | 'brand-excellence' | 'social-features' | 'gamification' | 'referral' | 'marketing' = 'differentiation';
  export let competitorData: any = null;
  export let argentinaMarketFocus: boolean = true;
  export let premiumPositioning: boolean = true;
  export let viralGrowthEnabled: boolean = true;

  const dispatch = createEventDispatcher<{
    competitiveAction: { strategy: string; differentiator: string; impact: number };
    brandingDecision: { element: string; positioning: string; marketFit: number };
    socialEngagement: { feature: string; viralCoefficient: number; communityImpact: number };
    gamificationActivation: { mechanism: string; engagement: number; retention: number };
    referralCampaign: { campaign: string; incentive: string; expectedReach: number };
    marketingOptimization: { channel: string; conversion: number; brandConsistency: number };
  }>();

  // Competitive Advantage & Market Leadership Data
  const competitiveAdvantageData = {
    marketDifferentiation: {
      coreAdvantages: [
        {
          advantage: 'Experiencia Premium Argentina-Centric',
          description: 'Única plataforma diseñada específicamente para cultura argentina',
          competitive_gap: 85, // % advantage vs competitors
          market_validation: 94,
          differentiator_strength: 'unique',
          implementation_areas: [
            'Horarios conscientes de siesta (14:00-17:00)',
            'Integración nativa WhatsApp Business',
            'Pagos optimizados MercadoPago',
            'Comunicación familiar y cálida',
            'Reservas grupales para familias'
          ]
        },
        {
          advantage: 'Tecnología de Matching Inteligente',
          description: 'IA que conecta clientes con proveedores ideales basado en preferencias',
          competitive_gap: 78,
          market_validation: 89,
          differentiator_strength: 'strong',
          implementation_areas: [
            'Algoritmo de compatibilidad personal',
            'Predicción de satisfacción',
            'Recomendaciones contextuales',
            'Optimización horarios preferidos',
            'Historial de preferencias'
          ]
        },
        {
          advantage: 'Ecosistema de Confianza 360°',
          description: 'Sistema integral de verificación, seguros y garantías',
          competitive_gap: 72,
          market_validation: 91,
          differentiator_strength: 'strong',
          implementation_areas: [
            'Verificación profesional completa',
            'Seguro de satisfacción',
            'Sistema de reputación transparente',
            'Resolución de conflictos',
            'Garantía de calidad'
          ]
        },
        {
          advantage: 'Experiencia Omnicanal Argentina',
          description: 'Integración perfecta entre digital y presencial adaptada a Argentina',
          competitive_gap: 68,
          market_validation: 87,
          differentiator_strength: 'moderate',
          implementation_areas: [
            'App PWA optimizada',
            'WhatsApp como canal principal',
            'Pagos híbridos (digital + efectivo)',
            'Soporte en horarios argentinos',
            'Integración con vida cotidiana local'
          ]
        }
      ],
      competitorComparison: {
        'Competitor A (International)': {
          strengths: ['Global brand recognition', 'Large provider network', 'Advanced technology'],
          weaknesses: ['No Argentina cultural adaptation', 'Complex pricing', 'Poor Spanish support'],
          market_share: 23,
          customer_satisfaction: 3.8,
          pricing_position: 'premium_plus',
          differentiation_gap: 45
        },
        'Competitor B (Local)': {
          strengths: ['Local market knowledge', 'Competitive pricing', 'Basic Spanish support'],
          weaknesses: ['Limited technology', 'Poor user experience', 'No premium services'],
          market_share: 18,
          customer_satisfaction: 4.1,
          pricing_position: 'budget',
          differentiation_gap: 62
        },
        'Competitor C (Regional)': {
          strengths: ['Regional presence', 'Moderate technology', 'Some local features'],
          weaknesses: ['Generic approach', 'Limited premium options', 'Inconsistent quality'],
          market_share: 15,
          customer_satisfaction: 4.0,
          pricing_position: 'mid_tier',
          differentiation_gap: 38
        }
      },
      marketPositioning: {
        current_position: 'Premium Argentina-First Experience',
        target_position: 'Market Leader in Premium Service Booking',
        positioning_pillars: [
          'Cultura Argentina Primero',
          'Tecnología Inteligente',
          'Confianza Absoluta',
          'Experiencia Premium'
        ],
        value_proposition: 'La única plataforma que realmente entiende y se adapta a la forma argentina de reservar servicios'
      }
    },
    brandExcellence: {
      brandIdentity: {
        personality: 'Confiable, Innovador, Cálido, Profesional',
        voice_tone: 'Amigable pero experto, cercano pero premium',
        cultural_alignment: {
          argentina_values: ['Confianza', 'Familia', 'Calidad', 'Hospitalidad'],
          local_expressions: ['Che', 'Dale', 'Bárbaro', 'De una'],
          cultural_moments: ['Almuerzo familiar domingo', 'After office', 'Preparación para asado'],
          seasonal_awareness: ['Verano: looks frescos', 'Invierno: cuidado personal', 'Fútbol: looks de campeón']
        },
        visual_system: {
          primary_colors: ['#2563eb', '#0891b2', '#059669'], // Argentina sky, trust, growth
          secondary_colors: ['#7c3aed', '#dc2626', '#ea580c'], // Premium, urgency, energy
          typography: 'Modern sans-serif with Spanish character support',
          iconography: 'Rounded, friendly, professionally crafted',
          photography_style: 'Authentic Argentina locations, diverse people, warm lighting'
        }
      },
      brandExperience: {
        touchpoint_consistency: 96,
        emotional_resonance: 89,
        trust_indicators: [
          'Verificación profesional visible',
          'Testimonios de clientes reales',
          'Certificaciones y seguros',
          'Transparencia en precios',
          'Garantía de satisfacción'
        ],
        premium_signals: [
          'Diseño sofisticado y limpio',
          'Atención al detalle excepcional',
          'Comunicación personalizada',
          'Servicios exclusivos VIP',
          'Experiencia sin fricciones'
        ]
      }
    },
    socialFeatures: {
      communityBuilding: {
        user_generated_content: {
          review_system: {
            completion_rate: 73,
            average_rating: 4.7,
            helpful_votes: 89,
            photo_uploads: 45,
            video_testimonials: 12
          },
          social_sharing: {
            instagram_integration: true,
            before_after_posts: 34,
            provider_spotlights: 28,
            service_recommendations: 67,
            viral_coefficient: 1.8
          },
          community_features: [
            'Grupos por zona (Palermo, Belgrano, etc.)',
            'Eventos de belleza y cuidado personal',
            'Tips y consejos de profesionales',
            'Intercambio de experiencias',
            'Recomendaciones entre usuarios'
          ]
        },
        influencer_integration: {
          micro_influencers: 23,
          macro_influencers: 5,
          celebrity_partnerships: 2,
          content_performance: {
            reach: 450000,
            engagement_rate: 6.8,
            conversion_rate: 3.2,
            brand_mention_sentiment: 87
          }
        }
      },
      viralMechanisms: [
        {
          mechanism: 'Refer-a-Friend Premium',
          description: 'Ambos usuarios reciben créditos y acceso VIP temporal',
          viral_coefficient: 2.3,
          activation_rate: 34,
          retention_impact: 45
        },
        {
          mechanism: 'Social Proof Amplifier',
          description: 'Compartir automático de experiencias exitosas con permiso',
          viral_coefficient: 1.7,
          activation_rate: 58,
          retention_impact: 28
        },
        {
          mechanism: 'Community Challenges',
          description: 'Desafíos grupales de belleza y cuidado personal',
          viral_coefficient: 1.9,
          activation_rate: 41,
          retention_impact: 52
        }
      ]
    },
    gamificationDesign: {
      engagementSystems: {
        loyalty_program: {
          name: 'BarberPro Champions',
          tiers: [
            { name: 'Bronce', requirements: '3 servicios', benefits: ['5% descuento', 'Prioridad soporte'] },
            { name: 'Plata', requirements: '10 servicios + 1 review', benefits: ['10% descuento', 'Acceso early bird', 'Servicios premium'] },
            { name: 'Oro', requirements: '20 servicios + 3 referidos', benefits: ['15% descuento', 'Concierge personal', 'Eventos exclusivos'] },
            { name: 'Platinum', requirements: '50 servicios + top reviewer', benefits: ['20% descuento', 'Servicios gratis mensuales', 'Advisory board'] }
          ],
          engagement_metrics: {
            participation_rate: 78,
            tier_advancement: 34,
            benefit_utilization: 67,
            satisfaction_boost: 23
          }
        },
        achievement_system: {
          categories: [
            {
              category: 'Explorador de Estilos',
              achievements: ['Primera vez', 'Aventurero', 'Trendsetter', 'Innovador'],
              completion_rate: 45,
              engagement_boost: 28
            },
            {
              category: 'Constructor de Comunidad',
              achievements: ['Primera review', 'Influencer', 'Mentor', 'Embajador'],
              completion_rate: 32,
              engagement_boost: 35
            },
            {
              category: 'Cliente Premium',
              achievements: ['Leal', 'VIP', 'Leyenda', 'Icono'],
              completion_rate: 18,
              engagement_boost: 67
            }
          ]
        }
      },
      motivationalDesign: {
        progress_visualization: 'Circular progress with Argentina flag colors',
        reward_psychology: 'Immediate gratification + long-term goals',
        social_recognition: 'Public badges + private achievements',
        surprise_delight: 'Unexpected bonuses + seasonal rewards'
      }
    },
    referralPrograms: {
      optimizedCampaigns: [
        {
          campaign: 'Familia BarberPro',
          target_audience: 'Familias argentinas',
          incentive_structure: {
            referrer: '20% descuento en próximo servicio + 500 puntos',
            referee: '30% descuento en primer servicio + onboarding VIP',
            bonus: 'Servicio familiar gratis al 5to referido exitoso'
          },
          performance_metrics: {
            conversion_rate: 34,
            lifetime_value_increase: 187,
            viral_coefficient: 2.8,
            retention_rate: 89
          },
          argentina_optimization: {
            family_focus: true,
            whatsapp_sharing: true,
            neighborhood_targeting: true,
            cultural_messaging: 'Compartí con tu familia el mejor cuidado personal'
          }
        },
        {
          campaign: 'Profesionales Premium',
          target_audience: 'Profesionales jóvenes Buenos Aires',
          incentive_structure: {
            referrer: 'Créditos acumulables + acceso eventos networking',
            referee: 'Mes gratis servicios premium + concierge',
            bonus: 'Membresía anual gratis al 10mo referido'
          },
          performance_metrics: {
            conversion_rate: 28,
            lifetime_value_increase: 245,
            viral_coefficient: 2.1,
            retention_rate: 92
          }
        }
      ],
      incentiveOptimization: {
        psychological_triggers: ['Reciprocidad', 'Exclusividad', 'Progreso social', 'Reconocimiento'],
        timing_optimization: 'Post-servicio satisfactorio + reminder sequence',
        channel_mix: ['WhatsApp 45%', 'In-app 30%', 'Email 15%', 'Social 10%'],
        personalization_level: 87
      }
    },
    marketingExcellence: {
      brandConsistency: {
        visual_consistency: 94,
        message_consistency: 91,
        tone_consistency: 88,
        experience_consistency: 92,
        cultural_consistency: 96
      },
      channelOptimization: {
        instagram: {
          content_mix: ['Before/After 40%', 'Behind scenes 25%', 'Tips 20%', 'UGC 15%'],
          engagement_rate: 8.2,
          conversion_rate: 4.1,
          brand_awareness_lift: 34
        },
        whatsapp_business: {
          response_rate: 89,
          conversion_rate: 67,
          customer_satisfaction: 4.8,
          automation_level: 45
        },
        google_ads: {
          click_through_rate: 6.7,
          conversion_rate: 12.3,
          cost_per_acquisition: 1250, // ARS
          return_on_ad_spend: 4.8
        },
        tiktok: {
          video_views: 2300000,
          engagement_rate: 11.2,
          brand_awareness: 28,
          gen_z_penetration: 45
        }
      },
      conversionOptimization: {
        landing_pages: {
          conversion_rate: 18.7,
          bounce_rate: 23.4,
          time_on_page: 142, // seconds
          optimization_score: 89
        },
        booking_funnel: {
          start_to_service_selection: 94,
          service_to_provider: 87,
          provider_to_booking: 78,
          booking_to_payment: 91,
          overall_conversion: 67
        }
      }
    }
  };

  // Component State
  let currentData = writable({});
  let selectedCompetitor = null;
  let brandConsistencyScore = 94;
  let competitiveAdvantageScore = 82;
  let marketLeadershipIndex = 78;

  onMount(() => {
    initializeVariant();
    trackCompetitiveAdvantageEngagement();
  });

  function initializeVariant() {
    switch (variant) {
      case 'differentiation':
        initializeMarketDifferentiation();
        break;
      case 'brand-excellence':
        initializeBrandExcellence();
        break;
      case 'social-features':
        initializeSocialFeatures();
        break;
      case 'gamification':
        initializeGamificationDesign();
        break;
      case 'referral':
        initializeReferralPrograms();
        break;
      case 'marketing':
        initializeMarketingExcellence();
        break;
    }
  }

  function initializeMarketDifferentiation() {
    currentData.set({
      ...competitiveAdvantageData.marketDifferentiation,
      competitiveScore: competitiveAdvantageScore,
      marketPosition: 'Leading in premium Argentina market'
    });
  }

  function initializeBrandExcellence() {
    currentData.set({
      ...competitiveAdvantageData.brandExcellence,
      brandScore: brandConsistencyScore,
      culturalAlignment: 96
    });
  }

  function initializeSocialFeatures() {
    currentData.set({
      ...competitiveAdvantageData.socialFeatures,
      viralCoefficient: 1.8,
      communityEngagement: 67
    });
  }

  function initializeGamificationDesign() {
    currentData.set({
      ...competitiveAdvantageData.gamificationDesign,
      engagementIncrease: 45,
      retentionImprovement: 34
    });
  }

  function initializeReferralPrograms() {
    currentData.set({
      ...competitiveAdvantageData.referralPrograms,
      averageViralCoefficient: 2.4,
      programEffectiveness: 87
    });
  }

  function initializeMarketingExcellence() {
    currentData.set({
      ...competitiveAdvantageData.marketingExcellence,
      overallROAS: 4.8,
      brandConsistencyScore: brandConsistencyScore
    });
  }

  function handleCompetitiveAction(strategy: string, differentiator: string, impact: number) {
    dispatch('competitiveAction', { strategy, differentiator, impact });

    uxAnalytics.trackExternalEvent('competitive_action_taken', {
      strategy,
      differentiator,
      impact,
      variant
    });
  }

  function handleBrandingDecision(element: string, positioning: string, marketFit: number) {
    dispatch('brandingDecision', { element, positioning, marketFit });

    uxAnalytics.trackExternalEvent('branding_decision_made', {
      element,
      positioning,
      marketFit,
      variant
    });
  }

  function trackCompetitiveAdvantageEngagement() {
    uxAnalytics.trackExternalEvent('competitive_advantage_design_view', {
      variant,
      argentinaMarketFocus,
      premiumPositioning,
      viralGrowthEnabled
    });
  }

  function formatArgentinaCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getDifferentiatorColor(strength: string): string {
    const colors = {
      'unique': 'bg-purple-100 text-purple-800 border-purple-300',
      'strong': 'bg-blue-100 text-blue-800 border-blue-300',
      'moderate': 'bg-green-100 text-green-800 border-green-300',
      'weak': 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[strength] || colors.moderate;
  }

  function getCompetitiveGapColor(gap: number): string {
    if (gap >= 70) return 'text-purple-600';
    if (gap >= 50) return 'text-blue-600';
    if (gap >= 30) return 'text-green-600';
    return 'text-yellow-600';
  }

  function getPerformanceIndicator(value: number, threshold: number = 70): string {
    if (value >= threshold) return '🏆';
    if (value >= threshold * 0.8) return '✅';
    if (value >= threshold * 0.6) return '⚠️';
    return '❌';
  }

  $: currentVariantData = $currentData;
</script>

<div class="competitive-advantage-design" class:argentina-focused={argentinaMarketFocus} class:premium-positioned={premiumPositioning}>
  {#if variant === 'differentiation'}
    <!-- Market Differentiation Elements -->
    <section class="differentiation-section bg-gradient-to-br from-purple-50 to-indigo-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Diferenciación Competitiva</h1>
          <p class="text-gray-700 text-lg">Ventajas únicas que nos posicionan como líderes del mercado</p>
          <div class="mt-4 flex items-center justify-center space-x-6">
            <div class="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              Score Competitivo: {competitiveAdvantageScore}/100
            </div>
            <div class="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
              Liderazgo de Mercado: {marketLeadershipIndex}/100
            </div>
          </div>
        </div>

        <!-- Core Competitive Advantages -->
        <div class="mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Ventajas Competitivas Centrales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each currentVariantData.coreAdvantages || [] as advantage}
              <div class="bg-white rounded-2xl p-8 shadow-xl border-l-4 border-purple-500 hover:shadow-2xl transition-all duration-300"
                   in:slide={{ delay: 200 }}>

                <div class="flex items-start justify-between mb-6">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900 mb-3">{advantage.advantage}</h3>
                    <p class="text-gray-700 mb-4">{advantage.description}</p>
                  </div>

                  <span class="px-3 py-1 rounded-full text-sm font-bold border {getDifferentiatorColor(advantage.differentiator_strength)}">
                    {advantage.differentiator_strength.toUpperCase()}
                  </span>
                </div>

                <!-- Competitive Metrics -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold {getCompetitiveGapColor(advantage.competitive_gap)} mb-1">
                      {advantage.competitive_gap}%
                    </div>
                    <div class="text-sm text-gray-600">Brecha Competitiva</div>
                  </div>

                  <div class="text-center p-4 bg-indigo-50 rounded-lg">
                    <div class="text-2xl font-bold text-indigo-600 mb-1">
                      {advantage.market_validation}%
                    </div>
                    <div class="text-sm text-gray-600">Validación Mercado</div>
                  </div>
                </div>

                <!-- Implementation Areas -->
                <div class="mb-6">
                  <h4 class="font-medium text-gray-900 mb-3">Áreas de Implementación:</h4>
                  <div class="space-y-2">
                    {#each advantage.implementation_areas as area}
                      <div class="flex items-center space-x-2">
                        <span class="text-green-500 text-sm">✓</span>
                        <span class="text-sm text-gray-700">{area}</span>
                      </div>
                    {/each}
                  </div>
                </div>

                <button class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                        on:click={() => handleCompetitiveAction('strengthen', advantage.advantage, advantage.competitive_gap)}>
                  Fortalecer Ventaja
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Competitor Comparison Matrix -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Análisis Competitivo Detallado</h2>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-4 px-6 font-bold text-gray-900">Competidor</th>
                  <th class="text-center py-4 px-6 font-bold text-gray-900">Market Share</th>
                  <th class="text-center py-4 px-6 font-bold text-gray-900">Satisfacción</th>
                  <th class="text-center py-4 px-6 font-bold text-gray-900">Posición Precio</th>
                  <th class="text-center py-4 px-6 font-bold text-gray-900">Brecha Diferenciación</th>
                </tr>
              </thead>
              <tbody>
                {#each Object.entries(currentVariantData.competitorComparison || {}) as [competitor, data]}
                  <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="py-4 px-6">
                      <div class="font-medium text-gray-900">{competitor}</div>
                    </td>
                    <td class="py-4 px-6 text-center">
                      <div class="text-lg font-bold text-blue-600">{data.market_share}%</div>
                    </td>
                    <td class="py-4 px-6 text-center">
                      <div class="flex items-center justify-center space-x-1">
                        <span class="text-lg font-bold text-yellow-600">{data.customer_satisfaction}</span>
                        <span class="text-yellow-500">⭐</span>
                      </div>
                    </td>
                    <td class="py-4 px-6 text-center">
                      <span class="px-2 py-1 rounded-full text-xs font-medium"
                            class:bg-red-100={data.pricing_position === 'premium_plus'}
                            class:text-red-800={data.pricing_position === 'premium_plus'}
                            class:bg-blue-100={data.pricing_position === 'mid_tier'}
                            class:text-blue-800={data.pricing_position === 'mid_tier'}
                            class:bg-green-100={data.pricing_position === 'budget'}
                            class:text-green-800={data.pricing_position === 'budget'}>
                        {data.pricing_position.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td class="py-4 px-6 text-center">
                      <div class="text-lg font-bold {getCompetitiveGapColor(data.differentiation_gap)}">
                        {data.differentiation_gap}%
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Market Positioning Statement -->
        {#if premiumPositioning}
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Posicionamiento Premium de Mercado</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Posición Actual vs. Objetivo</h3>
                <div class="space-y-4">
                  <div>
                    <div class="text-sm text-gray-600 mb-1">Posición Actual:</div>
                    <div class="font-medium text-purple-600">
                      {currentVariantData.marketPositioning?.current_position || 'Premium Argentina-First Experience'}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-600 mb-1">Posición Objetivo:</div>
                    <div class="font-medium text-indigo-600">
                      {currentVariantData.marketPositioning?.target_position || 'Market Leader in Premium Service Booking'}
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Pilares de Posicionamiento</h3>
                <div class="grid grid-cols-2 gap-3">
                  {#each currentVariantData.marketPositioning?.positioning_pillars || [] as pillar}
                    <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 text-center">
                      <div class="font-medium text-purple-800 text-sm">{pillar}</div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <div class="mt-6 text-center">
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <h4 class="font-bold text-gray-900 mb-2">Propuesta de Valor Única</h4>
                <p class="text-gray-700 italic text-lg">
                  "{currentVariantData.marketPositioning?.value_proposition || 'La única plataforma que realmente entiende y se adapta a la forma argentina de reservar servicios'}"
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else if variant === 'brand-excellence'}
    <!-- Brand Excellence Interface -->
    <section class="brand-excellence-section bg-gradient-to-br from-blue-50 to-cyan-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Excelencia de Marca</h1>
          <p class="text-gray-700 text-lg">Alineación cultural argentina y posicionamiento premium</p>
          <div class="mt-4">
            <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium inline-block">
              Consistencia de Marca: {brandConsistencyScore}/100
            </div>
          </div>
        </div>

        <!-- Brand Identity -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Identidad de Marca</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Personality & Voice -->
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-3">Personalidad de Marca</h3>
                <p class="text-gray-700 bg-blue-50 p-4 rounded-lg">
                  {currentVariantData.brandIdentity?.personality || 'Confiable, Innovador, Cálido, Profesional'}
                </p>
              </div>

              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-3">Tono de Voz</h3>
                <p class="text-gray-700 bg-cyan-50 p-4 rounded-lg">
                  {currentVariantData.brandIdentity?.voice_tone || 'Amigable pero experto, cercano pero premium'}
                </p>
              </div>
            </div>

            <!-- Visual System -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-3">Sistema Visual</h3>
              <div class="space-y-4">
                <div>
                  <h4 class="font-medium text-gray-700 mb-2">Colores Primarios</h4>
                  <div class="flex space-x-2">
                    {#each currentVariantData.brandIdentity?.visual_system?.primary_colors || ['#2563eb', '#0891b2', '#059669'] as color}
                      <div class="w-12 h-12 rounded-lg border-2 border-gray-200" style="background-color: {color}"></div>
                    {/each}
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-gray-700 mb-2">Estilo Fotográfico</h4>
                  <p class="text-sm text-gray-600">
                    {currentVariantData.brandIdentity?.visual_system?.photography_style || 'Authentic Argentina locations, diverse people, warm lighting'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Argentina Cultural Alignment -->
        {#if argentinaMarketFocus}
          <div class="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-8 border border-blue-200 mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">🇦🇷 Alineación Cultural Argentina</h2>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <!-- Argentina Values -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 text-center">Valores Argentinos</h3>
                <div class="space-y-2">
                  {#each currentVariantData.brandIdentity?.cultural_alignment?.argentina_values || [] as value}
                    <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm text-center">
                      {value}
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Local Expressions -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 text-center">Expresiones Locales</h3>
                <div class="space-y-2">
                  {#each currentVariantData.brandIdentity?.cultural_alignment?.local_expressions || [] as expression}
                    <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm text-center">
                      {expression}
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Cultural Moments -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 text-center">Momentos Culturales</h3>
                <div class="space-y-2">
                  {#each currentVariantData.brandIdentity?.cultural_alignment?.cultural_moments || [] as moment}
                    <div class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs text-center">
                      {moment}
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Seasonal Awareness -->
              <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 text-center">Conciencia Estacional</h3>
                <div class="space-y-2">
                  {#each currentVariantData.brandIdentity?.cultural_alignment?.seasonal_awareness || [] as season}
                    <div class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs text-center">
                      {season}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Brand Experience Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Trust Indicators -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Indicadores de Confianza</h3>
            <div class="space-y-3">
              {#each currentVariantData.brandExperience?.trust_indicators || [] as indicator}
                <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span class="text-green-500">🛡️</span>
                  <span class="text-gray-700">{indicator}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Premium Signals -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Señales Premium</h3>
            <div class="space-y-3">
              {#each currentVariantData.brandExperience?.premium_signals || [] as signal}
                <div class="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span class="text-purple-500">✨</span>
                  <span class="text-gray-700">{signal}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'social-features'}
    <!-- Social Features with Community Building -->
    <section class="social-features-section bg-gradient-to-br from-pink-50 to-rose-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Características Sociales</h1>
          <p class="text-gray-700 text-lg">Construcción de comunidad y mecanismos de crecimiento viral</p>
          <div class="mt-4">
            <div class="bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-medium inline-block">
              Coeficiente Viral: {currentVariantData.viralCoefficient || 1.8}
            </div>
          </div>
        </div>

        <!-- Community Building -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Construcción de Comunidad</h2>

          <!-- User Generated Content -->
          <div class="mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Contenido Generado por Usuarios</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Review System -->
              <div class="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <h4 class="font-bold text-gray-900 mb-4 text-center">Sistema de Reseñas</h4>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-700">Tasa completitud:</span>
                    <span class="font-bold text-yellow-600">
                      {currentVariantData.communityBuilding?.user_generated_content?.review_system?.completion_rate || 73}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-700">Rating promedio:</span>
                    <span class="font-bold text-yellow-600">
                      {currentVariantData.communityBuilding?.user_generated_content?.review_system?.average_rating || 4.7}⭐
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-700">Fotos subidas:</span>
                    <span class="font-bold text-yellow-600">
                      {currentVariantData.communityBuilding?.user_generated_content?.review_system?.photo_uploads || 45}%
                    </span>
                  </div>
                </div>
              </div>

              <!-- Social Sharing -->
              <div class="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 class="font-bold text-gray-900 mb-4 text-center">Compartir Social</h4>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-700">Posts antes/después:</span>
                    <span class="font-bold text-blue-600">
                      {currentVariantData.communityBuilding?.user_generated_content?.social_sharing?.before_after_posts || 34}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-700">Recomendaciones:</span>
                    <span class="font-bold text-blue-600">
                      {currentVariantData.communityBuilding?.user_generated_content?.social_sharing?.service_recommendations || 67}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-700">Coeficiente viral:</span>
                    <span class="font-bold text-blue-600">
                      {currentVariantData.communityBuilding?.user_generated_content?.social_sharing?.viral_coefficient || 1.8}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Community Features -->
              <div class="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 class="font-bold text-gray-900 mb-4 text-center">Características Comunidad</h4>
                <div class="space-y-2">
                  {#each currentVariantData.communityBuilding?.user_generated_content?.community_features || [] as feature}
                    <div class="text-sm bg-white p-2 rounded border text-gray-700">
                      {feature}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <!-- Influencer Integration -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">Integración con Influencers</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="text-center p-6 bg-purple-50 rounded-xl">
                <div class="text-3xl font-bold text-purple-600 mb-2">
                  {currentVariantData.communityBuilding?.influencer_integration?.micro_influencers || 23}
                </div>
                <div class="text-sm text-gray-600">Micro Influencers</div>
              </div>

              <div class="text-center p-6 bg-indigo-50 rounded-xl">
                <div class="text-3xl font-bold text-indigo-600 mb-2">
                  {currentVariantData.communityBuilding?.influencer_integration?.macro_influencers || 5}
                </div>
                <div class="text-sm text-gray-600">Macro Influencers</div>
              </div>

              <div class="text-center p-6 bg-pink-50 rounded-xl">
                <div class="text-3xl font-bold text-pink-600 mb-2">
                  {formatArgentinaCurrency(currentVariantData.communityBuilding?.influencer_integration?.content_performance?.reach || 450000).replace('$', '')}
                </div>
                <div class="text-sm text-gray-600">Alcance Total</div>
              </div>

              <div class="text-center p-6 bg-rose-50 rounded-xl">
                <div class="text-3xl font-bold text-rose-600 mb-2">
                  {currentVariantData.communityBuilding?.influencer_integration?.content_performance?.engagement_rate || 6.8}%
                </div>
                <div class="text-sm text-gray-600">Engagement Rate</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Viral Mechanisms -->
        <div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 border border-pink-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Mecanismos de Crecimiento Viral</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each currentVariantData.viralMechanisms || [] as mechanism}
              <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 class="text-lg font-bold text-gray-900 mb-3">{mechanism.mechanism}</h3>
                <p class="text-gray-700 mb-4 text-sm">{mechanism.description}</p>

                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600 text-sm">Coeficiente viral:</span>
                    <span class="font-bold text-purple-600">{mechanism.viral_coefficient}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 text-sm">Tasa activación:</span>
                    <span class="font-bold text-blue-600">{mechanism.activation_rate}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 text-sm">Impacto retención:</span>
                    <span class="font-bold text-green-600">+{mechanism.retention_impact}%</span>
                  </div>
                </div>

                <button class="w-full mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                        on:click={() => dispatch('socialEngagement', { feature: mechanism.mechanism, viralCoefficient: mechanism.viral_coefficient, communityImpact: mechanism.retention_impact })}>
                  Activar Mecanismo
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'gamification'}
    <!-- Gamification Design -->
    <section class="gamification-section bg-gradient-to-br from-yellow-50 to-orange-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Sistema de Gamificación</h1>
          <p class="text-gray-700 text-lg">Optimización de engagement y sistemas de recompensas</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-medium">
              Incremento Engagement: +{currentVariantData.engagementIncrease || 45}%
            </div>
            <div class="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-medium">
              Mejora Retención: +{currentVariantData.retentionImprovement || 34}%
            </div>
          </div>
        </div>

        <!-- Loyalty Program -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Programa de Lealtad: BarberPro Champions</h2>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {#each currentVariantData.engagementSystems?.loyalty_program?.tiers || [] as tier}
              <div class="text-center p-6 rounded-xl shadow-lg border-2 hover:shadow-xl transition-all"
                   class:bg-orange-50={tier.name === 'Bronce'}
                   class:border-orange-300={tier.name === 'Bronce'}
                   class:bg-gray-50={tier.name === 'Plata'}
                   class:border-gray-300={tier.name === 'Plata'}
                   class:bg-yellow-50={tier.name === 'Oro'}
                   class:border-yellow-400={tier.name === 'Oro'}
                   class:bg-purple-50={tier.name === 'Platinum'}
                   class:border-purple-400={tier.name === 'Platinum'}>

                <div class="text-4xl mb-3">
                  {#if tier.name === 'Bronce'}🥉
                  {:else if tier.name === 'Plata'}🥈
                  {:else if tier.name === 'Oro'}🥇
                  {:else if tier.name === 'Platinum'}💎
                  {:else}🏆
                  {/if}
                </div>

                <h3 class="text-xl font-bold mb-3"
                    class:text-orange-600={tier.name === 'Bronce'}
                    class:text-gray-600={tier.name === 'Plata'}
                    class:text-yellow-600={tier.name === 'Oro'}
                    class:text-purple-600={tier.name === 'Platinum'}>
                  {tier.name}
                </h3>

                <div class="text-sm text-gray-600 mb-4 font-medium">
                  {tier.requirements}
                </div>

                <div class="space-y-2">
                  {#each tier.benefits as benefit}
                    <div class="text-xs bg-white p-2 rounded border">
                      {benefit}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <!-- Loyalty Program Metrics -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600 mb-1">
                {currentVariantData.engagementSystems?.loyalty_program?.engagement_metrics?.participation_rate || 78}%
              </div>
              <div class="text-sm text-gray-600">Participación</div>
            </div>

            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600 mb-1">
                {currentVariantData.engagementSystems?.loyalty_program?.engagement_metrics?.tier_advancement || 34}%
              </div>
              <div class="text-sm text-gray-600">Avance de Nivel</div>
            </div>

            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600 mb-1">
                {currentVariantData.engagementSystems?.loyalty_program?.engagement_metrics?.benefit_utilization || 67}%
              </div>
              <div class="text-sm text-gray-600">Uso Beneficios</div>
            </div>

            <div class="text-center p-4 bg-yellow-50 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600 mb-1">
                +{currentVariantData.engagementSystems?.loyalty_program?.engagement_metrics?.satisfaction_boost || 23}%
              </div>
              <div class="text-sm text-gray-600">Boost Satisfacción</div>
            </div>
          </div>
        </div>

        <!-- Achievement System -->
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Sistema de Logros</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each currentVariantData.engagementSystems?.achievement_system?.categories || [] as category}
              <div class="bg-white rounded-xl p-6 shadow-lg">
                <h3 class="text-lg font-bold text-gray-900 mb-4 text-center">{category.category}</h3>

                <div class="space-y-3 mb-4">
                  {#each category.achievements as achievement}
                    <div class="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span class="text-xl">🏅</span>
                      <span class="text-sm text-gray-700">{achievement}</span>
                    </div>
                  {/each}
                </div>

                <div class="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div class="text-lg font-bold text-orange-600">{category.completion_rate}%</div>
                    <div class="text-xs text-gray-600">Completitud</div>
                  </div>
                  <div>
                    <div class="text-lg font-bold text-green-600">+{category.engagement_boost}%</div>
                    <div class="text-xs text-gray-600">Boost Engagement</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'referral'}
    <!-- Referral Programs -->
    <section class="referral-section bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Programas de Referidos</h1>
          <p class="text-gray-700 text-lg">Optimización de incentivos y seguimiento de impacto</p>
          <div class="mt-4">
            <div class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium inline-block">
              Coeficiente Viral Promedio: {currentVariantData.averageViralCoefficient || 2.4}
            </div>
          </div>
        </div>

        <!-- Optimized Campaigns -->
        <div class="space-y-8">
          {#each currentVariantData.optimizedCampaigns || [] as campaign}
            <div class="bg-white rounded-2xl p-8 shadow-xl border-l-4 border-green-500">
              <div class="flex items-start justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-2">{campaign.campaign}</h2>
                  <p class="text-gray-600">Target: {campaign.target_audience}</p>
                </div>

                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600 mb-1">{campaign.viral_coefficient}</div>
                  <div class="text-sm text-gray-600">Coeficiente Viral</div>
                </div>
              </div>

              <!-- Incentive Structure -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-blue-50 rounded-lg p-4">
                  <h3 class="font-bold text-blue-900 mb-2">Para quien Refiere</h3>
                  <p class="text-sm text-blue-800">{campaign.incentive_structure.referrer}</p>
                </div>

                <div class="bg-green-50 rounded-lg p-4">
                  <h3 class="font-bold text-green-900 mb-2">Para el Referido</h3>
                  <p class="text-sm text-green-800">{campaign.incentive_structure.referee}</p>
                </div>

                <div class="bg-purple-50 rounded-lg p-4">
                  <h3 class="font-bold text-purple-900 mb-2">Bonus Especial</h3>
                  <p class="text-sm text-purple-800">{campaign.incentive_structure.bonus}</p>
                </div>
              </div>

              <!-- Performance Metrics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-lg font-bold text-gray-900">{campaign.performance_metrics.conversion_rate}%</div>
                  <div class="text-xs text-gray-600">Conversión</div>
                </div>

                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-lg font-bold text-green-600">+{campaign.performance_metrics.lifetime_value_increase}%</div>
                  <div class="text-xs text-gray-600">Incremento LTV</div>
                </div>

                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-lg font-bold text-blue-600">{campaign.performance_metrics.viral_coefficient}</div>
                  <div class="text-xs text-gray-600">Viral Coefficient</div>
                </div>

                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-lg font-bold text-purple-600">{campaign.performance_metrics.retention_rate}%</div>
                  <div class="text-xs text-gray-600">Retención</div>
                </div>
              </div>

              <!-- Argentina Optimization -->
              {#if campaign.argentina_optimization}
                <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                  <h3 class="font-bold text-gray-900 mb-3">🇦🇷 Optimización Argentina</h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center">
                      <div class="text-2xl mb-1">{campaign.argentina_optimization.family_focus ? '👨‍👩‍👧‍👦' : '❌'}</div>
                      <div class="text-xs text-gray-600">Enfoque Familiar</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl mb-1">{campaign.argentina_optimization.whatsapp_sharing ? '💬' : '❌'}</div>
                      <div class="text-xs text-gray-600">Compartir WhatsApp</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl mb-1">{campaign.argentina_optimization.neighborhood_targeting ? '🏘️' : '❌'}</div>
                      <div class="text-xs text-gray-600">Targeting Barrial</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl mb-1">💬</div>
                      <div class="text-xs text-gray-600">Mensaje Cultural</div>
                    </div>
                  </div>
                  <div class="mt-3 text-center text-sm italic text-blue-700">
                    "{campaign.argentina_optimization.cultural_messaging}"
                  </div>
                </div>
              {/if}

              <div class="text-center">
                <button class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                        on:click={() => dispatch('referralCampaign', { campaign: campaign.campaign, incentive: campaign.incentive_structure.referrer, expectedReach: campaign.performance_metrics.conversion_rate * 100 })}>
                  Activar Campaña
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

  {:else if variant === 'marketing'}
    <!-- Marketing Excellence -->
    <section class="marketing-section bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Excelencia en Marketing</h1>
          <p class="text-gray-700 text-lg">Optimización de conversión y consistencia de marca</p>
          <div class="mt-4 flex items-center justify-center space-x-4">
            <div class="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
              ROAS General: {currentVariantData.overallROAS || 4.8}x
            </div>
            <div class="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              Consistencia: {currentVariantData.brandConsistencyScore || 94}/100
            </div>
          </div>
        </div>

        <!-- Channel Optimization -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {#each Object.entries(currentVariantData.channelOptimization || {}) as [channel, data]}
            <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="text-center">
                <div class="text-3xl mb-3">
                  {#if channel === 'instagram'}📸
                  {:else if channel === 'whatsapp_business'}💬
                  {:else if channel === 'google_ads'}🔍
                  {:else if channel === 'tiktok'}🎵
                  {:else}📱
                  {/if}
                </div>

                <h3 class="text-lg font-bold text-gray-900 mb-4 capitalize">
                  {channel.replace('_', ' ')}
                </h3>

                <div class="space-y-3">
                  {#if data.engagement_rate}
                    <div>
                      <div class="text-2xl font-bold text-blue-600">{data.engagement_rate}%</div>
                      <div class="text-xs text-gray-600">Engagement Rate</div>
                    </div>
                  {/if}

                  {#if data.conversion_rate}
                    <div>
                      <div class="text-2xl font-bold text-green-600">{data.conversion_rate}%</div>
                      <div class="text-xs text-gray-600">Conversion Rate</div>
                    </div>
                  {/if}

                  {#if data.cost_per_acquisition}
                    <div>
                      <div class="text-lg font-bold text-purple-600">{formatArgentinaCurrency(data.cost_per_acquisition)}</div>
                      <div class="text-xs text-gray-600">CPA</div>
                    </div>
                  {/if}

                  {#if data.return_on_ad_spend}
                    <div>
                      <div class="text-xl font-bold text-orange-600">{data.return_on_ad_spend}x</div>
                      <div class="text-xs text-gray-600">ROAS</div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Brand Consistency Metrics -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Métricas de Consistencia de Marca</h2>

          <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
            {#each Object.entries(currentVariantData.brandConsistency || {}) as [metric, value]}
              <div class="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <div class="text-3xl font-bold mb-2"
                     class:text-green-600={value >= 90}
                     class:text-blue-600={value >= 80 && value < 90}
                     class:text-yellow-600={value >= 70 && value < 80}
                     class:text-red-600={value < 70}>
                  {value}%
                </div>

                <div class="text-sm text-gray-700 font-medium capitalize">
                  {metric.replace('_', ' ')}
                </div>

                <div class="text-lg mt-2">
                  {getPerformanceIndicator(value, 85)}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Conversion Optimization -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Landing Pages -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Optimización Landing Pages</h3>

            <div class="space-y-4">
              <div class="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span class="text-gray-700">Tasa de conversión:</span>
                <span class="text-2xl font-bold text-green-600">
                  {currentVariantData.conversionOptimization?.landing_pages?.conversion_rate || 18.7}%
                </span>
              </div>

              <div class="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span class="text-gray-700">Bounce rate:</span>
                <span class="text-2xl font-bold text-blue-600">
                  {currentVariantData.conversionOptimization?.landing_pages?.bounce_rate || 23.4}%
                </span>
              </div>

              <div class="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span class="text-gray-700">Tiempo en página:</span>
                <span class="text-2xl font-bold text-purple-600">
                  {Math.floor((currentVariantData.conversionOptimization?.landing_pages?.time_on_page || 142) / 60)}m {(currentVariantData.conversionOptimization?.landing_pages?.time_on_page || 142) % 60}s
                </span>
              </div>
            </div>
          </div>

          <!-- Booking Funnel -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Embudo de Reservas</h3>

            <div class="space-y-4">
              {#each Object.entries(currentVariantData.conversionOptimization?.booking_funnel || {}) as [step, rate]}
                {#if step !== 'overall_conversion'}
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span class="text-gray-700 text-sm capitalize">
                      {step.replace('_', ' → ')}:
                    </span>
                    <div class="flex items-center space-x-2">
                      <div class="w-20 bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style="width: {rate}%"></div>
                      </div>
                      <span class="font-bold text-indigo-600 text-sm">{rate}%</span>
                    </div>
                  </div>
                {/if}
              {/each}

              <div class="border-t pt-4">
                <div class="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                  <span class="font-bold text-gray-900">Conversión General:</span>
                  <span class="text-2xl font-bold text-indigo-600">
                    {currentVariantData.conversionOptimization?.booking_funnel?.overall_conversion || 67}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .competitive-advantage-design {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .argentina-focused {
    --argentina-primary: #74b9ff;
    --argentina-secondary: #00b894;
    --argentina-accent: #fdcb6e;
  }

  .premium-positioned {
    --premium-primary: #667eea;
    --premium-secondary: #764ba2;
    --premium-accent: #f093fb;
  }

  /* Differentiation section styling */
  .differentiation-section {
    background-image: radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  }

  /* Brand excellence styling */
  .brand-excellence-section {
    background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%);
  }

  /* Social features styling */
  .social-features-section {
    background-image: radial-gradient(circle at 30% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
  }

  /* Gamification styling */
  .gamification-section {
    background-image: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%);
  }

  /* Referral programs styling */
  .referral-section {
    background-image: radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
  }

  /* Marketing excellence styling */
  .marketing-section {
    background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
  }

  /* Premium hover effects */
  .hover-premium {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hover-premium:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  /* Argentina flag colors animation */
  @keyframes argentinaFlag {
    0%, 100% { border-color: #74b9ff; }
    50% { border-color: #ffffff; }
  }

  .argentina-border {
    animation: argentinaFlag 3s infinite;
  }

  /* Competitive advantage indicators */
  .advantage-unique {
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
  }

  .advantage-strong {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }

  .advantage-moderate {
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
  }

  /* Viral coefficient visualization */
  .viral-indicator {
    position: relative;
    overflow: hidden;
  }

  .viral-indicator::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.2), transparent);
    transition: left 0.8s;
  }

  .viral-indicator:hover::before {
    left: 100%;
  }

  /* Gamification progress animations */
  .progress-ring {
    transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Responsive optimizations */
  @media (max-width: 768px) {
    .competitive-advantage-design h1 {
      font-size: 2.5rem;
    }

    .competitive-advantage-design .text-4xl {
      font-size: 2rem;
    }

    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid.grid-cols-5 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* Accessibility enhancements */
  .competitive-advantage-design [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Premium animations */
  @keyframes shimmer {
    0% { background-position: -468px 0; }
    100% { background-position: 468px 0; }
  }

  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 400% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* Brand consistency indicators */
  .consistency-excellent {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .consistency-good {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .consistency-needs-improvement {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  /* Marketing channel performance */
  .channel-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    transition: all 0.3s ease;
  }

  .channel-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
</style>