<!--
  Advanced Customer Experience Design & Personalization Excellence - D13-001
  Intelligent personalization interfaces with adaptive layouts and dynamic content optimization
  Customer journey mapping with experience optimization and conversion enhancement design
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'personalization' | 'journey-mapping' | 'success-tracking' | 'engagement' | 'feedback' | 'community' = 'personalization';
  export let customerId: string = '';
  export let argentinaOptimized: boolean = true;
  export let intelligentAdaptation: boolean = true;
  export let realTimePersonalization: boolean = true;

  const dispatch = createEventDispatcher<{
    personalizedAction: { action: string; context: any; confidence: number };
    journeyOptimization: { stage: string; optimization: string; expectedImprovement: number };
    engagementBoost: { strategy: string; target: string; impact: number };
    communityInteraction: { type: string; engagement: number; socialProof: boolean };
  }>();

  // Advanced Customer Experience Data with Argentina Market Insights
  const advancedCustomerData = {
    personalizedExperience: {
      customerProfile: {
        name: 'Sofia Martinez',
        tier: 'VIP Premium',
        preferences: {
          communication: 'WhatsApp',
          booking_style: 'last_minute',
          service_preference: 'premium',
          payment_method: 'MercadoPago',
          language_tone: 'friendly_informal'
        },
        behavioral_patterns: {
          booking_frequency: 'bi-weekly',
          preferred_times: ['18:00-20:00', '10:00-12:00'],
          seasonal_trends: 'high_summer_low_winter',
          price_sensitivity: 'low',
          loyalty_indicators: ['repeat_bookings', 'referrals', 'reviews']
        },
        argentina_cultural_fit: {
          family_oriented: true,
          trust_based_decisions: true,
          social_proof_importance: 'high',
          siesta_aware_scheduling: true,
          weekend_family_bookings: true
        }
      },
      adaptiveInterface: {
        layout_preferences: {
          mobile_first: true,
          card_density: 'spacious',
          color_scheme: 'warm_professional',
          navigation_style: 'bottom_tabs'
        },
        content_optimization: {
          service_recommendations: [
            { service: 'Corte Premium + Barba', confidence: 94, reason: 'Historical preference' },
            { service: 'Tratamiento Capilar', confidence: 78, reason: 'Seasonal trend' },
            { service: 'Combo Familiar', confidence: 82, reason: 'Family booking pattern' }
          ],
          provider_matching: {
            top_match: 'Carlos Mendez',
            compatibility_score: 96,
            match_factors: ['Same neighborhood', 'High ratings', 'Available preferred times']
          },
          pricing_optimization: {
            price_range: 'premium',
            discount_sensitivity: 'low',
            loyalty_rewards: 'active',
            payment_plan_interest: 'medium'
          }
        }
      }
    },
    journeyMapping: {
      customerJourneyStages: {
        awareness: {
          touchpoints: ['Google Search', 'Instagram Ads', 'Word of mouth'],
          conversion_rate: 34,
          optimization_opportunities: [
            'Improve local SEO for "barberia cerca"',
            'Enhance Instagram social proof',
            'Implement referral incentives'
          ],
          argentina_specific: {
            whatsapp_first_contact: 67,
            trust_badges_impact: 89,
            family_recommendations: 73
          }
        },
        consideration: {
          touchpoints: ['Website browse', 'Provider profiles', 'Reviews read'],
          conversion_rate: 67,
          avg_consideration_time: '2.3 days',
          drop_off_points: ['Pricing page', 'Booking form complexity'],
          optimization_opportunities: [
            'Simplify booking flow to 3 steps',
            'Add video provider introductions',
            'Implement price comparison tools'
          ]
        },
        booking: {
          touchpoints: ['Service selection', 'Date/time choice', 'Payment'],
          conversion_rate: 89,
          avg_completion_time: '4.2 minutes',
          abandonment_reasons: ['Payment issues', 'Availability conflicts'],
          optimization_opportunities: [
            'Add MercadoPago express checkout',
            'Real-time availability updates',
            'Smart scheduling suggestions'
          ]
        },
        experience: {
          touchpoints: ['Pre-service communication', 'Service delivery', 'Post-service follow-up'],
          satisfaction_score: 91,
          nps_contribution: 76,
          excellence_drivers: [
            'Professional service quality',
            'Punctuality and reliability',
            'Personal attention and care'
          ]
        },
        advocacy: {
          touchpoints: ['Review requests', 'Referral programs', 'Social sharing'],
          referral_rate: 28,
          review_completion: 73,
          social_sharing: 45,
          loyalty_program_engagement: 82
        }
      },
      experienceOptimization: {
        micro_moments: [
          {
            moment: 'Booking confirmation',
            current_experience: 'Email + SMS',
            optimized_experience: 'WhatsApp message with map, contact info, and service details',
            expected_improvement: 35
          },
          {
            moment: 'Day before reminder',
            current_experience: 'Generic SMS',
            optimized_experience: 'Personalized WhatsApp with weather-based styling suggestions',
            expected_improvement: 42
          },
          {
            moment: 'Arrival experience',
            current_experience: 'Check-in at counter',
            optimized_experience: 'QR code check-in with welcome message and playlist selection',
            expected_improvement: 28
          }
        ]
      }
    },
    successTracking: {
      customerHealthScore: {
        overall_score: 94,
        components: {
          engagement: { score: 96, trend: 'increasing', indicators: ['App usage frequency', 'Feature adoption'] },
          satisfaction: { score: 92, trend: 'stable', indicators: ['Service ratings', 'Complaint resolution'] },
          loyalty: { score: 89, trend: 'increasing', indicators: ['Repeat bookings', 'Referral activity'] },
          value: { score: 98, trend: 'increasing', indicators: ['Service frequency', 'Premium uptake'] }
        }
      },
      progressVisualization: {
        milestones: [
          { milestone: 'First Booking', status: 'completed', date: '2024-01-15', reward: 'Welcome discount' },
          { milestone: '5 Services Completed', status: 'completed', date: '2024-02-28', reward: 'Bronze status' },
          { milestone: '10 Services + Review', status: 'completed', date: '2024-03-20', reward: 'Silver status' },
          { milestone: 'First Referral', status: 'in_progress', progress: 80, reward: 'Gold status unlock' },
          { milestone: 'Premium Member', status: 'locked', requirement: 'Complete 20 services', reward: 'VIP perks' }
        ],
        achievements: [
          { title: 'Style Explorer', description: 'Tried 5+ different services', icon: '🎨', unlocked: true },
          { title: 'Loyalty Champion', description: 'Booked same provider 5+ times', icon: '🏆', unlocked: true },
          { title: 'Community Builder', description: 'Left 10+ helpful reviews', icon: '⭐', unlocked: false },
          { title: 'Trendsetter', description: 'First to try new services', icon: '🚀', unlocked: false }
        ]
      }
    },
    engagementOptimization: {
      emotionalConnection: {
        personalized_messaging: {
          greeting_style: 'Hola Sofia! 😊',
          tone: 'friendly_professional',
          cultural_references: ['Mate time suggestions', 'Weekend asado prep', 'Football season styling'],
          family_focus: 'Include family booking options and kids-friendly services'
        },
        storytelling_elements: [
          {
            narrative: 'Your Style Journey',
            content: 'From your first classic cut to your current signature look',
            engagement_boost: 45
          },
          {
            narrative: 'Provider Relationships',
            content: 'Building trust with your preferred professionals',
            engagement_boost: 38
          }
        ]
      },
      gamification: {
        points_system: {
          current_points: 2340,
          next_tier_requirement: 3000,
          earning_activities: [
            { activity: 'Complete booking', points: 100 },
            { activity: 'Leave review', points: 150 },
            { activity: 'Refer friend', points: 500 },
            { activity: 'Try new service', points: 200 }
          ]
        },
        challenges: [
          {
            title: 'Spring Style Challenge',
            description: 'Try 3 new services this season',
            progress: 2,
            total: 3,
            reward: 'Free premium treatment',
            expires: '2024-06-21'
          }
        ]
      }
    },
    feedbackIntelligence: {
      sentimentAnalysis: {
        overall_sentiment: 'very_positive',
        sentiment_trends: {
          service_quality: { score: 94, trend: 'increasing', feedback_themes: ['Professional expertise', 'Attention to detail'] },
          platform_usability: { score: 89, trend: 'stable', feedback_themes: ['Easy booking', 'Clear communication'] },
          value_perception: { score: 87, trend: 'increasing', feedback_themes: ['Worth the price', 'Quality service'] }
        }
      },
      actionableInsights: [
        {
          insight: 'Customer values personal relationships with providers',
          action: 'Implement provider loyalty tracking and matching',
          impact: 32,
          priority: 'high'
        },
        {
          insight: 'WhatsApp communication drives satisfaction',
          action: 'Expand WhatsApp integration for all touchpoints',
          impact: 28,
          priority: 'medium'
        }
      ]
    },
    communityFeatures: {
      socialInteraction: {
        peer_connections: [
          { connection: 'Maria L.', relationship: 'Mutual friend referral', interaction_score: 78 },
          { connection: 'Ana S.', relationship: 'Same provider preference', interaction_score: 65 }
        ],
        community_participation: {
          reviews_written: 12,
          helpful_votes_received: 89,
          community_ranking: 'Top 15% contributors',
          trusted_reviewer_status: true
        }
      },
      loyaltyBuilding: {
        exclusive_access: [
          'VIP booking slots (7-day advance access)',
          'New service previews',
          'Provider meet-and-greet events',
          'Premium customer support line'
        ],
        community_benefits: [
          'Member-only styling tips from top providers',
          'Seasonal trend previews',
          'Group booking discounts for family/friends',
          'Argentina cultural event styling guides'
        ]
      }
    }
  };

  // Component State
  let currentData = writable({});
  let personalizedContent = writable([]);
  let adaptiveLayout = writable({});
  let journeyStage = 'consideration';
  let engagementLevel = 'high';
  let lastInteraction = new Date();

  onMount(() => {
    initializeVariant();
    if (intelligentAdaptation) {
      startIntelligentAdaptation();
    }
    if (realTimePersonalization) {
      startRealTimePersonalization();
    }
    trackAdvancedCustomerExperience();
  });

  function initializeVariant() {
    switch (variant) {
      case 'personalization':
        initializePersonalizationExperience();
        break;
      case 'journey-mapping':
        initializeJourneyMapping();
        break;
      case 'success-tracking':
        initializeSuccessTracking();
        break;
      case 'engagement':
        initializeEngagementOptimization();
        break;
      case 'feedback':
        initializeFeedbackIntelligence();
        break;
      case 'community':
        initializeCommunityFeatures();
        break;
    }
  }

  function initializePersonalizationExperience() {
    currentData.set({
      ...advancedCustomerData.personalizedExperience,
      realTimeRecommendations: [
        {
          type: 'service_suggestion',
          title: 'Perfect for your Friday evening plans',
          description: 'Corte Premium + Barba with Carlos (your preferred provider)',
          confidence: 94,
          reasoning: 'Based on your booking pattern and upcoming weekend'
        },
        {
          type: 'time_optimization',
          title: 'Beat the rush',
          description: 'Book for 6:30 PM to avoid peak hour wait times',
          confidence: 87,
          reasoning: 'Historical data shows 15-minute shorter wait'
        }
      ]
    });
  }

  function initializeJourneyMapping() {
    currentData.set({
      ...advancedCustomerData.journeyMapping,
      realTimeJourneyData: {
        current_stage: journeyStage,
        stage_completion: 67,
        next_optimal_action: 'Complete provider selection',
        expected_conversion_time: '2.1 hours'
      }
    });
  }

  function initializeSuccessTracking() {
    currentData.set({
      ...advancedCustomerData.successTracking,
      personalizedGoals: [
        {
          goal: 'Reach Gold Status',
          progress: 80,
          next_step: 'Complete one referral',
          reward: 'Unlock premium provider access',
          timeline: '2 weeks'
        }
      ]
    });
  }

  function initializeEngagementOptimization() {
    currentData.set({
      ...advancedCustomerData.engagementOptimization,
      currentEngagement: {
        level: engagementLevel,
        score: 94,
        recent_activities: [
          'Viewed 3 provider profiles',
          'Saved favorite service',
          'Shared review on social media'
        ]
      }
    });
  }

  function initializeFeedbackIntelligence() {
    currentData.set({
      ...advancedCustomerData.feedbackIntelligence,
      personalizedFeedbackRequest: {
        optimal_timing: 'Post-service + 2 hours',
        preferred_channel: 'WhatsApp',
        incentive: '50 loyalty points + chance to win monthly premium service'
      }
    });
  }

  function initializeCommunityFeatures() {
    currentData.set({
      ...advancedCustomerData.communityFeatures,
      communityInsights: {
        trending_among_peers: ['Corte moderno', 'Tratamiento hidratante'],
        community_events: [
          {
            event: 'Taller de Cuidado Personal Masculino',
            date: '2024-04-15',
            participants: 23,
            interested: true
          }
        ]
      }
    });
  }

  function startIntelligentAdaptation() {
    // Simulate AI-driven interface adaptation
    setInterval(() => {
      adaptInterfaceToContext();
    }, 45000); // Adapt every 45 seconds
  }

  function startRealTimePersonalization() {
    // Simulate real-time content personalization
    setInterval(() => {
      updatePersonalizedContent();
    }, 30000); // Update every 30 seconds
  }

  function adaptInterfaceToContext() {
    const timeOfDay = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());

    // Argentina-specific adaptations
    if (timeOfDay >= 14 && timeOfDay <= 17) {
      // Siesta time - promote evening appointments
      personalizedContent.update(content => [
        ...content,
        {
          type: 'contextual_suggestion',
          message: 'Evening appointments available - perfect post-siesta timing!',
          action: 'View evening slots'
        }
      ]);
    }

    if (isWeekend) {
      // Weekend family focus
      adaptiveLayout.update(layout => ({
        ...layout,
        promoteFamilyBookings: true,
        highlightGroupDiscounts: true
      }));
    }
  }

  function updatePersonalizedContent() {
    const personalizedUpdates = [
      {
        type: 'weather_based',
        message: 'Rainy day? Great time for an indoor grooming session!',
        relevance: 85
      },
      {
        type: 'social_proof',
        message: '12 people in your area booked this service today',
        relevance: 78
      }
    ];

    personalizedContent.set(personalizedUpdates);
  }

  function handlePersonalizedAction(action: string, context: any, confidence: number) {
    dispatch('personalizedAction', { action, context, confidence });

    uxAnalytics.trackExternalEvent('personalized_action_taken', {
      action,
      confidence,
      context,
      variant,
      customerId
    });
  }

  function handleJourneyOptimization(stage: string, optimization: string, expectedImprovement: number) {
    dispatch('journeyOptimization', { stage, optimization, expectedImprovement });

    uxAnalytics.trackExternalEvent('journey_optimization_applied', {
      stage,
      optimization,
      expectedImprovement,
      variant
    });
  }

  function trackAdvancedCustomerExperience() {
    uxAnalytics.trackExternalEvent('advanced_customer_experience_view', {
      variant,
      customerId,
      argentinaOptimized,
      intelligentAdaptation,
      realTimePersonalization
    });
  }

  function formatArgentinaCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getEngagementColor(level: string): string {
    const colors = {
      'high': 'text-green-600 bg-green-100',
      'medium': 'text-blue-600 bg-blue-100',
      'low': 'text-yellow-600 bg-yellow-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return colors[level] || colors.medium;
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  $: currentVariantData = $currentData;
  $: adaptedLayout = $adaptiveLayout;
  $: personalizedContentData = $personalizedContent;
</script>

<div class="advanced-customer-experience" class:argentina-optimized={argentinaOptimized} class:intelligent-adaptive={intelligentAdaptation}>
  {#if variant === 'personalization'}
    <!-- Intelligent Personalization Interface -->
    <section class="personalization-section bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <!-- Personalized Header -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8 border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {currentVariantData.customerProfile?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  ¡Hola {currentVariantData.customerProfile?.name || 'Sofia'}! 😊
                </h1>
                <p class="text-gray-600">
                  Bienvenida a tu experiencia personalizada BarberPro
                </p>
                <div class="flex items-center space-x-2 mt-2">
                  <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {currentVariantData.customerProfile?.tier || 'VIP Premium'}
                  </span>
                  <span class="text-sm text-gray-500">
                    Último servicio: hace 12 días
                  </span>
                </div>
              </div>
            </div>

            {#if intelligentAdaptation}
              <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg px-4 py-2 border border-purple-200">
                <div class="flex items-center space-x-2">
                  <span class="text-purple-600 text-sm">🤖</span>
                  <span class="text-purple-700 font-medium text-sm">IA Personalizada</span>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Real-time Recommendations -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {#each currentVariantData.realTimeRecommendations || [] as recommendation}
            <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                 in:slide={{ delay: 200 }}>
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">{recommendation.title}</h3>
                  <p class="text-gray-700 mb-3">{recommendation.description}</p>
                  <div class="text-sm text-gray-600 mb-4">
                    <strong>Razón:</strong> {recommendation.reasoning}
                  </div>
                </div>

                <div class="ml-4 text-center">
                  <div class="text-2xl font-bold {getConfidenceColor(recommendation.confidence)} mb-1">
                    {recommendation.confidence}%
                  </div>
                  <div class="text-xs text-gray-500">Confianza</div>
                </div>
              </div>

              <button class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                      on:click={() => handlePersonalizedAction('apply_recommendation', recommendation, recommendation.confidence)}>
                {#if recommendation.type === 'service_suggestion'}
                  Reservar Ahora
                {:else if recommendation.type === 'time_optimization'}
                  Ver Horarios
                {:else}
                  Aplicar Sugerencia
                {/if}
              </button>
            </div>
          {/each}
        </div>

        <!-- Adaptive Interface Preferences -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Interfaz Adaptada a Tus Preferencias</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Layout Preferences -->
            <div class="border border-gray-200 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Diseño Personalizado</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Vista móvil optimizada:</span>
                  <span class="text-green-600 font-medium">✓ Activa</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Densidad de contenido:</span>
                  <span class="text-blue-600 font-medium">Espaciosa</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-700">Esquema de colores:</span>
                  <span class="text-purple-600 font-medium">Cálido Profesional</span>
                </div>
              </div>
            </div>

            <!-- Content Optimization -->
            <div class="border border-gray-200 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Contenido Optimizado</h3>
              <div class="space-y-3">
                {#each currentVariantData.adaptiveInterface?.content_optimization?.service_recommendations || [] as service}
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700 text-sm">{service.service}:</span>
                    <span class="text-sm font-medium {getConfidenceColor(service.confidence)}">
                      {service.confidence}%
                    </span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Argentina Cultural Fit -->
            <div class="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
              <h3 class="text-lg font-bold text-gray-900 mb-4">🇦🇷 Adaptación Cultural</h3>
              <div class="space-y-3">
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-sm text-gray-700">Horarios conscientes de siesta</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-sm text-gray-700">Reservas familiares de fin de semana</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-sm text-gray-700">Comunicación por WhatsApp</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-sm text-gray-700">Decisiones basadas en confianza</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'journey-mapping'}
    <!-- Customer Journey Mapping with Experience Optimization -->
    <section class="journey-mapping-section bg-white py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Mapeo de Experiencia del Cliente</h1>
          <p class="text-gray-700">Optimización continua del recorrido del cliente</p>
        </div>

        <!-- Journey Stage Progress -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Recorrido del Cliente</h2>

          <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
            {#each Object.entries(currentVariantData.customerJourneyStages || {}) as [stage, data], index}
              <div class="text-center">
                <div class="bg-white rounded-xl p-6 shadow-lg mb-4 border-2"
                     class:border-blue-500={stage === journeyStage}
                     class:border-gray-200={stage !== journeyStage}>

                  <div class="text-4xl mb-3">
                    {#if stage === 'awareness'}🔍
                    {:else if stage === 'consideration'}🤔
                    {:else if stage === 'booking'}📝
                    {:else if stage === 'experience'}✨
                    {:else if stage === 'advocacy'}🗣️
                    {:else}📋
                    {/if}
                  </div>

                  <h3 class="font-bold text-gray-900 mb-2 capitalize">
                    {#if stage === 'awareness'}Descubrimiento
                    {:else if stage === 'consideration'}Consideración
                    {:else if stage === 'booking'}Reserva
                    {:else if stage === 'experience'}Experiencia
                    {:else if stage === 'advocacy'}Recomendación
                    {:else}{stage}
                    {/if}
                  </h3>

                  <div class="text-2xl font-bold text-blue-600 mb-2">
                    {data.conversion_rate || data.satisfaction_score || data.referral_rate}%
                  </div>

                  <div class="text-sm text-gray-600">
                    {#if data.avg_consideration_time}
                      {data.avg_consideration_time}
                    {:else if data.avg_completion_time}
                      {data.avg_completion_time}
                    {:else if data.nps_contribution}
                      NPS: {data.nps_contribution}
                    {:else}
                      Conversión
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

        <!-- Optimization Opportunities -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Oportunidades de Optimización</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each currentVariantData.customerJourneyStages?.consideration?.optimization_opportunities || [] as opportunity}
              <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border border-yellow-200">
                <div class="flex items-start space-x-3 mb-4">
                  <span class="text-2xl">💡</span>
                  <div>
                    <h3 class="font-bold text-gray-900 mb-2">Oportunidad de Mejora</h3>
                    <p class="text-gray-700 text-sm">{opportunity}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm text-orange-600 font-medium">Impacto estimado: +15%</span>
                  <button class="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                          on:click={() => handleJourneyOptimization('consideration', opportunity, 15)}>
                    Implementar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Micro-moments Optimization -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Optimización de Micro-Momentos</h2>

          <div class="space-y-6">
            {#each currentVariantData.experienceOptimization?.micro_moments || [] as moment}
              <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-gray-900">{moment.moment}</h3>
                  <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    +{moment.expected_improvement}% mejora
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 class="font-medium text-red-800 mb-2">Experiencia Actual</h4>
                    <p class="text-sm text-red-700">{moment.current_experience}</p>
                  </div>

                  <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 class="font-medium text-green-800 mb-2">Experiencia Optimizada</h4>
                    <p class="text-sm text-green-700">{moment.optimized_experience}</p>
                  </div>
                </div>

                <div class="mt-4 text-center">
                  <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Implementar Optimización
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'success-tracking'}
    <!-- Customer Success Tracking with Progress Visualization -->
    <section class="success-tracking-section bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Seguimiento de Éxito del Cliente</h1>
          <p class="text-gray-700">Visualización de progreso y reconocimiento de logros</p>
        </div>

        <!-- Customer Health Score Dashboard -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Puntuación de Salud del Cliente</h2>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {#each Object.entries(currentVariantData.customerHealthScore?.components || {}) as [component, data]}
              <div class="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div class="text-3xl mb-3">
                  {#if component === 'engagement'}🎯
                  {:else if component === 'satisfaction'}😊
                  {:else if component === 'loyalty'}❤️
                  {:else if component === 'value'}💎
                  {:else}📊
                  {/if}
                </div>

                <h3 class="font-bold text-gray-900 mb-2 capitalize">
                  {#if component === 'engagement'}Participación
                  {:else if component === 'satisfaction'}Satisfacción
                  {:else if component === 'loyalty'}Lealtad
                  {:else if component === 'value'}Valor
                  {:else}{component}
                  {/if}
                </h3>

                <div class="text-3xl font-bold text-green-600 mb-2">{data.score}</div>

                <div class="text-sm text-gray-600 mb-3">
                  Tendencia:
                  <span class="font-medium"
                        class:text-green-600={data.trend === 'increasing'}
                        class:text-blue-600={data.trend === 'stable'}
                        class:text-red-600={data.trend === 'decreasing'}>
                    {data.trend === 'increasing' ? '📈 Creciendo' : data.trend === 'stable' ? '➡️ Estable' : '📉 Decreciendo'}
                  </span>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                       style="width: {data.score}%"></div>
                </div>
              </div>
            {/each}
          </div>

          <div class="text-center">
            <div class="inline-flex items-center space-x-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg px-8 py-4 border border-green-200">
              <span class="text-4xl">🏆</span>
              <div>
                <div class="text-3xl font-bold text-green-600">
                  {currentVariantData.customerHealthScore?.overall_score || 94}
                </div>
                <div class="text-green-700 font-medium">Puntuación General de Salud</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Milestones -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Milestones -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Hitos de Progreso</h3>
            <div class="space-y-4">
              {#each currentVariantData.progressVisualization?.milestones || [] as milestone}
                <div class="flex items-center space-x-4 p-4 rounded-lg border border-gray-200"
                     class:bg-green-50={milestone.status === 'completed'}
                     class:bg-blue-50={milestone.status === 'in_progress'}
                     class:bg-gray-50={milestone.status === 'locked'}>

                  <div class="text-2xl">
                    {#if milestone.status === 'completed'}✅
                    {:else if milestone.status === 'in_progress'}🔄
                    {:else}🔒
                    {/if}
                  </div>

                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{milestone.milestone}</h4>
                    <div class="text-sm text-gray-600">Recompensa: {milestone.reward}</div>

                    {#if milestone.status === 'in_progress'}
                      <div class="mt-2">
                        <div class="flex justify-between text-xs text-blue-600 mb-1">
                          <span>Progreso</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-blue-500 h-2 rounded-full" style="width: {milestone.progress}%"></div>
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Achievements -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Logros Desbloqueados</h3>
            <div class="grid grid-cols-1 gap-4">
              {#each currentVariantData.progressVisualization?.achievements || [] as achievement}
                <div class="flex items-center space-x-4 p-4 rounded-lg border border-gray-200"
                     class:bg-yellow-50={achievement.unlocked}
                     class:border-yellow-200={achievement.unlocked}
                     class:opacity-50={!achievement.unlocked}>

                  <div class="text-3xl">{achievement.icon}</div>

                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{achievement.title}</h4>
                    <p class="text-sm text-gray-600">{achievement.description}</p>
                  </div>

                  {#if achievement.unlocked}
                    <div class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                      DESBLOQUEADO
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'engagement'}
    <!-- Customer Engagement Optimization -->
    <section class="engagement-section bg-gradient-to-br from-pink-50 to-rose-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Optimización de Participación</h1>
          <p class="text-gray-700">Conexión emocional y optimización de satisfacción</p>
        </div>

        <!-- Emotional Connection -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Conexión Emocional Personalizada</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Personalized Messaging -->
            <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">💬 Mensajería Personalizada</h3>

              <div class="space-y-4">
                <div class="bg-white rounded-lg p-4 shadow-sm">
                  <div class="text-sm text-gray-600 mb-1">Estilo de saludo:</div>
                  <div class="text-lg font-medium text-pink-600">
                    {currentVariantData.emotionalConnection?.personalized_messaging?.greeting_style || 'Hola Sofia! 😊'}
                  </div>
                </div>

                <div class="bg-white rounded-lg p-4 shadow-sm">
                  <div class="text-sm text-gray-600 mb-1">Tono de comunicación:</div>
                  <div class="font-medium text-gray-900">Amigable y profesional</div>
                </div>

                <div class="bg-white rounded-lg p-4 shadow-sm">
                  <div class="text-sm text-gray-600 mb-2">Referencias culturales argentinas:</div>
                  <div class="flex flex-wrap gap-2">
                    {#each currentVariantData.emotionalConnection?.personalized_messaging?.cultural_references || [] as reference}
                      <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {reference}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            </div>

            <!-- Storytelling Elements -->
            <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">📖 Elementos de Narrativa</h3>

              <div class="space-y-4">
                {#each currentVariantData.emotionalConnection?.storytelling_elements || [] as story}
                  <div class="bg-white rounded-lg p-4 shadow-sm">
                    <h4 class="font-medium text-gray-900 mb-2">{story.narrative}</h4>
                    <p class="text-sm text-gray-600 mb-3">{story.content}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-blue-600 font-medium">
                        Engagement: +{story.engagement_boost}%
                      </span>
                      <button class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                        Ver Historia
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Gamification System -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Sistema de Gamificación</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Points System -->
            <div class="border border-gray-200 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">🎯 Sistema de Puntos</h3>

              <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 mb-6">
                <div class="text-center">
                  <div class="text-3xl font-bold text-purple-600 mb-2">
                    {currentVariantData.gamification?.points_system?.current_points || 2340}
                  </div>
                  <div class="text-gray-700 mb-2">Puntos actuales</div>
                  <div class="text-sm text-gray-600">
                    {currentVariantData.gamification?.points_system?.next_tier_requirement - currentVariantData.gamification?.points_system?.current_points || 660} puntos para el próximo nivel
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="font-medium text-gray-900">Actividades que suman puntos:</h4>
                {#each currentVariantData.gamification?.points_system?.earning_activities || [] as activity}
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">{activity.activity}</span>
                    <span class="font-bold text-purple-600">+{activity.points}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Active Challenges -->
            <div class="border border-gray-200 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">🏆 Desafíos Activos</h3>

              {#each currentVariantData.gamification?.challenges || [] as challenge}
                <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                  <h4 class="font-bold text-gray-900 mb-2">{challenge.title}</h4>
                  <p class="text-sm text-gray-700 mb-4">{challenge.description}</p>

                  <div class="mb-4">
                    <div class="flex justify-between text-sm text-orange-600 mb-1">
                      <span>Progreso</span>
                      <span>{challenge.progress}/{challenge.total}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                           style="width: {(challenge.progress / challenge.total) * 100}%"></div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center">
                    <div class="text-sm">
                      <div class="font-medium text-gray-900">Recompensa:</div>
                      <div class="text-green-600">{challenge.reward}</div>
                    </div>
                    <div class="text-xs text-gray-500">
                      Vence: {new Date(challenge.expires).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'feedback'}
    <!-- Feedback Intelligence with Sentiment Analysis -->
    <section class="feedback-section bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Inteligencia de Feedback</h1>
          <p class="text-gray-700">Análisis de sentimientos e insights accionables</p>
        </div>

        <!-- Sentiment Analysis Dashboard -->
        <div class="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Análisis de Sentimientos</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each Object.entries(currentVariantData.sentimentAnalysis?.sentiment_trends || {}) as [category, data]}
              <div class="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div class="text-3xl mb-3">
                  {#if category === 'service_quality'}⭐
                  {:else if category === 'platform_usability'}💻
                  {:else if category === 'value_perception'}💰
                  {:else}📊
                  {/if}
                </div>

                <h3 class="font-bold text-gray-900 mb-2">
                  {#if category === 'service_quality'}Calidad del Servicio
                  {:else if category === 'platform_usability'}Usabilidad de la Plataforma
                  {:else if category === 'value_perception'}Percepción de Valor
                  {:else}{category.replace('_', ' ')}
                  {/if}
                </h3>

                <div class="text-3xl font-bold text-blue-600 mb-2">{data.score}</div>

                <div class="text-sm text-gray-600 mb-4">
                  Tendencia:
                  <span class="font-medium"
                        class:text-green-600={data.trend === 'increasing'}
                        class:text-blue-600={data.trend === 'stable'}
                        class:text-red-600={data.trend === 'decreasing'}>
                    {data.trend === 'increasing' ? '📈' : data.trend === 'stable' ? '➡️' : '📉'}
                  </span>
                </div>

                <div class="text-xs text-gray-600">
                  <div class="font-medium mb-1">Temas frecuentes:</div>
                  {#each data.feedback_themes as theme}
                    <div class="bg-white px-2 py-1 rounded text-xs mb-1">{theme}</div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Actionable Insights -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Insights Accionables</h2>

          <div class="space-y-6">
            {#each currentVariantData.actionableInsights || [] as insight}
              <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">{insight.insight}</h3>
                    <p class="text-gray-700 mb-3">{insight.action}</p>

                    <div class="flex items-center space-x-4">
                      <span class="text-sm font-medium text-blue-600">
                        Impacto estimado: +{insight.impact}%
                      </span>
                      <span class="px-3 py-1 rounded-full text-xs font-bold"
                            class:bg-red-100={insight.priority === 'high'}
                            class:text-red-800={insight.priority === 'high'}
                            class:bg-yellow-100={insight.priority === 'medium'}
                            class:text-yellow-800={insight.priority === 'medium'}
                            class:bg-green-100={insight.priority === 'low'}
                            class:text-green-800={insight.priority === 'low'}>
                        {insight.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors ml-6">
                    Implementar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'community'}
    <!-- Community Features with Social Interaction -->
    <section class="community-section bg-gradient-to-br from-green-50 to-teal-50 py-8 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Características de Comunidad</h1>
          <p class="text-gray-700">Interacción social y construcción de lealtad</p>
        </div>

        <!-- Social Interaction -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <!-- Peer Connections -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">🤝 Conexiones de la Comunidad</h3>

            <div class="space-y-4">
              {#each currentVariantData.socialInteraction?.peer_connections || [] as connection}
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {connection.connection.charAt(0)}
                  </div>

                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{connection.connection}</div>
                    <div class="text-sm text-gray-600">{connection.relationship}</div>
                  </div>

                  <div class="text-center">
                    <div class="text-lg font-bold text-green-600">{connection.interaction_score}</div>
                    <div class="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Community Participation -->
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 mb-6">📊 Participación en la Comunidad</h3>

            <div class="space-y-4">
              <div class="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span class="text-gray-700">Reseñas escritas:</span>
                <span class="font-bold text-blue-600">
                  {currentVariantData.socialInteraction?.community_participation?.reviews_written || 12}
                </span>
              </div>

              <div class="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span class="text-gray-700">Votos útiles recibidos:</span>
                <span class="font-bold text-green-600">
                  {currentVariantData.socialInteraction?.community_participation?.helpful_votes_received || 89}
                </span>
              </div>

              <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                <div class="font-bold text-yellow-800 mb-2">
                  {currentVariantData.socialInteraction?.community_participation?.community_ranking || 'Top 15% contributors'}
                </div>
                <div class="text-sm text-yellow-700">Ranking en la comunidad</div>
              </div>

              {#if currentVariantData.socialInteraction?.community_participation?.trusted_reviewer_status}
                <div class="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
                  <span class="inline-flex items-center space-x-2">
                    <span class="text-purple-600">🏅</span>
                    <span class="font-bold text-purple-800">Reseñador Confiable</span>
                  </span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Loyalty Building Benefits -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Beneficios de Construcción de Lealtad</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Exclusive Access -->
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">🔑 Acceso Exclusivo</h3>

              <div class="space-y-3">
                {#each currentVariantData.loyaltyBuilding?.exclusive_access || [] as access}
                  <div class="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <span class="text-purple-500">✨</span>
                    <span class="text-sm text-gray-700">{access}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Community Benefits -->
            <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <h3 class="text-lg font-bold text-gray-900 mb-4">🎁 Beneficios de la Comunidad</h3>

              <div class="space-y-3">
                {#each currentVariantData.loyaltyBuilding?.community_benefits || [] as benefit}
                  <div class="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <span class="text-blue-500">🎯</span>
                    <span class="text-sm text-gray-700">{benefit}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <div class="mt-8 text-center">
            <button class="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all"
                    on:click={() => dispatch('communityInteraction', { type: 'benefit_claim', engagement: 95, socialProof: true })}>
              Explorar Todos los Beneficios
            </button>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .advanced-customer-experience {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .argentina-optimized {
    --argentina-primary: #74b9ff;
    --argentina-secondary: #00b894;
    --argentina-accent: #fdcb6e;
  }

  .intelligent-adaptive {
    --adaptive-primary: #667eea;
    --adaptive-secondary: #764ba2;
  }

  /* Premium experience design */
  .personalization-section {
    background-image: radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%);
  }

  .journey-mapping-section {
    background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
  }

  /* Argentina cultural adaptations */
  .argentina-colors {
    background: linear-gradient(135deg, #74b9ff 0%, #00b894 100%);
  }

  /* Interactive elements */
  .hover-lift {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  /* Responsive optimizations */
  @media (max-width: 768px) {
    .advanced-customer-experience h1 {
      font-size: 2rem;
    }

    .advanced-customer-experience .text-3xl {
      font-size: 1.75rem;
    }

    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .grid.grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid.grid-cols-5 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* Accessibility enhancements */
  .advanced-customer-experience [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Premium animations */
  @keyframes slideInFromLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .animate-slide-in {
    animation: slideInFromLeft 0.6s ease-out forwards;
  }

  .animate-fade-scale {
    animation: fadeInScale 0.5s ease-out forwards;
  }

  /* Progress bars */
  .progress-bar {
    transition: width 1s ease-in-out;
  }

  /* Gamification elements */
  .points-glow {
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
  }

  /* Community interaction elements */
  .community-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    transition: all 0.3s ease;
  }

  .community-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
</style>