<!--
  D14-001: Brand Leadership Finalization & Strategic Market Positioning
  Argentina market leadership positioning with competitive differentiation and brand excellence
  Premium positioning framework with cultural alignment and market advantage validation
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut, cubicInOut } from 'svelte/easing';
  import { writable } from 'svelte/store';

  export let positioningPhase: 'analysis' | 'strategy' | 'execution' | 'validation' | 'leadership' = 'analysis';
  export let marketFocus: 'argentina' | 'latam' | 'global' = 'argentina';
  export let brandTier: 'premium' | 'luxury' | 'accessible-premium' = 'premium';
  export let competitiveStrategy: 'differentiation' | 'leadership' | 'innovation' = 'leadership';
  export let culturalAlignment: boolean = true;
  export let scalabilityReadiness: boolean = true;

  const dispatch = createEventDispatcher<{
    brandPositioning: { strategy: string; impact: number; market_advantage: string };
    competitiveDifferentiation: { factor: string; advantage: number; sustainability: string };
    marketLeadership: { area: string; ranking: number; recognition: string };
    brandInnovation: { innovation: string; market_impact: number; adoption_potential: string };
  }>();

  // D14-001 Brand Leadership Data
  const brandLeadershipData = {
    marketAnalysis: {
      argentinaMarketPosition: {
        currentPosition: {
          market_share: 23.7,
          brand_awareness: 67.8,
          customer_preference: 56.3,
          competitive_ranking: 2,
          nps_score: 73.2
        },
        competitiveAdvantage: {
          mobile_experience: { advantage: 31, sustainability: 'strong', moat: 'technical excellence' },
          argentina_localization: { advantage: 28, sustainability: 'very strong', moat: 'cultural understanding' },
          family_booking: { advantage: 25, sustainability: 'strong', moat: 'feature innovation' },
          payment_integration: { advantage: 22, sustainability: 'moderate', moat: 'partnership network' },
          premium_positioning: { advantage: 19, sustainability: 'strong', moat: 'brand perception' }
        },
        marketOpportunities: [
          { opportunity: 'GBA Expansion', potential: 45, timeline: '6-9 months', investment: 'medium' },
          { opportunity: 'Psychology Vertical', potential: 38, timeline: '3-4 months', investment: 'low' },
          { opportunity: 'Medical Services', potential: 42, timeline: '6-8 months', investment: 'high' },
          { opportunity: 'Premium Business Clients', potential: 33, timeline: '4-6 months', investment: 'medium' },
          { opportunity: 'International Expansion', potential: 67, timeline: '12-18 months', investment: 'high' }
        ],
        culturalFactors: {
          family_centricity: 94.3,
          whatsapp_preference: 89.7,
          trust_importance: 96.1,
          recommendation_influence: 87.4,
          price_sensitivity: 72.8,
          service_quality_priority: 91.6
        }
      },
      competitiveLandscape: {
        directCompetitors: [
          { name: 'Competitor A', strength: 78, weakness: 'mobile experience', market_share: 18.3 },
          { name: 'Competitor B', strength: 72, weakness: 'family booking', market_share: 15.1 },
          { name: 'Competitor C', strength: 69, weakness: 'premium positioning', market_share: 12.7 }
        ],
        indirectCompetitors: [
          { category: 'Traditional booking', threat_level: 'medium', disruption_potential: 'low' },
          { category: 'Social media booking', threat_level: 'high', disruption_potential: 'medium' },
          { category: 'Direct provider apps', threat_level: 'medium', disruption_potential: 'high' }
        ],
        marketGaps: [
          { gap: 'Family-centered service booking', size: 67, addressability: 'high' },
          { gap: 'Premium mobile experience', size: 45, addressability: 'medium' },
          { gap: 'Argentina-native payment flow', size: 38, addressability: 'high' },
          { gap: 'Multi-vertical template system', size: 82, addressability: 'very high' }
        ]
      }
    },
    brandStrategy: {
      positioningFramework: {
        brand_promise: 'La experiencia premium de reservas que conecta familias argentinas con profesionales de confianza',
        value_proposition: [
          'Experiencia móvil superior diseñada para Argentina',
          'Reservas familiares coordinadas en una sola plataforma',
          'Profesionales verificados con garantía de calidad',
          'Integración nativa con MercadoPago y WhatsApp',
          'Soporte local en español las 24/7'
        ],
        brand_pillars: [
          { pillar: 'Excelencia Técnica', strength: 94.2, differentiation: 'high' },
          { pillar: 'Comprensión Cultural', strength: 96.8, differentiation: 'very high' },
          { pillar: 'Experiencia Familiar', strength: 91.3, differentiation: 'high' },
          { pillar: 'Confianza y Seguridad', strength: 93.7, differentiation: 'medium' },
          { pillar: 'Innovación Continua', strength: 88.9, differentiation: 'high' }
        ],
        target_segments: [
          {
            segment: 'Familias Urbanas Premium',
            size: 2.3,
            potential: 4.7,
            acquisition_cost: 'medium',
            lifetime_value: 'high',
            characteristics: ['Tech-savvy', 'Quality-focused', 'Time-conscious', 'Family-oriented']
          },
          {
            segment: 'Profesionales Jóvenes',
            size: 1.8,
            potential: 3.2,
            acquisition_cost: 'low',
            lifetime_value: 'medium',
            characteristics: ['Mobile-first', 'Convenience-focused', 'Social-influenced', 'Price-conscious']
          },
          {
            segment: 'Adultos Mayores Digitales',
            size: 0.9,
            potential: 2.1,
            acquisition_cost: 'high',
            lifetime_value: 'very high',
            characteristics: ['Quality-focused', 'Trust-dependent', 'Service-oriented', 'Loyalty-driven']
          }
        ]
      },
      brandIdentityExcellence: {
        visual_system: {
          logo_recognition: 89.3,
          color_association: 94.7,
          typography_consistency: 96.1,
          iconography_clarity: 91.8,
          brand_recall: 87.2
        },
        voice_and_tone: {
          argentina_authenticity: 95.4,
          premium_perception: 91.7,
          approachability: 88.9,
          trustworthiness: 94.3,
          innovation_leadership: 87.6
        },
        brand_experience: {
          touchpoint_consistency: 93.8,
          emotional_connection: 89.1,
          service_delivery: 96.2,
          customer_support: 92.4,
          community_building: 85.7
        }
      }
    },
    executionExcellence: {
      marketingStrategy: {
        digital_marketing: {
          social_media_engagement: 91.3,
          content_effectiveness: 87.9,
          influencer_partnerships: 82.4,
          paid_advertising_roi: 267,
          email_marketing_performance: 89.7
        },
        traditional_marketing: {
          radio_partnerships: 78.3,
          print_presence: 65.2,
          outdoor_advertising: 71.8,
          event_sponsorships: 84.6,
          pr_coverage: 88.9
        },
        growth_marketing: {
          referral_program_effectiveness: 93.1,
          viral_coefficient: 1.34,
          organic_growth_rate: 28.7,
          customer_acquisition_cost: 187,
          lifetime_value_ratio: 4.7
        }
      },
      operationalExcellence: {
        service_delivery: {
          booking_success_rate: 96.8,
          provider_quality_score: 93.2,
          customer_satisfaction: 91.7,
          complaint_resolution_time: 4.2,
          service_reliability: 97.3
        },
        technology_platform: {
          uptime_reliability: 99.7,
          mobile_performance: 96.4,
          security_compliance: 98.1,
          scalability_readiness: 94.6,
          innovation_deployment: 89.3
        }
      }
    },
    leadershipValidation: {
      market_recognition: {
        industry_awards: [
          { award: 'Best Mobile App Argentina 2024', category: 'Technology Excellence' },
          { award: 'Argentina Startup of the Year', category: 'Innovation Leadership' },
          { award: 'Customer Experience Excellence', category: 'Service Quality' },
          { award: 'Best Workplace Culture', category: 'Company Culture' }
        ],
        media_coverage: {
          tier_1_mentions: 47,
          positive_sentiment: 91.3,
          thought_leadership_articles: 23,
          expert_recommendations: 156
        },
        industry_leadership: {
          conference_speaking: 12,
          industry_partnerships: 34,
          standard_setting_participation: 8,
          innovation_recognition: 89.7
        }
      },
      customer_advocacy: {
        net_promoter_score: 73.2,
        customer_testimonials: 267,
        case_study_participation: 45,
        reference_customers: 89,
        social_proof_strength: 91.8
      },
      competitive_moats: [
        {
          moat: 'Argentina Cultural Integration',
          strength: 'very strong',
          defensibility: 'high',
          sustainability: 'long-term',
          competitive_threat: 'low'
        },
        {
          moat: 'Family Booking Innovation',
          strength: 'strong',
          defensibility: 'medium',
          sustainability: 'medium-term',
          competitive_threat: 'medium'
        },
        {
          moat: 'Template Replication System',
          strength: 'very strong',
          defensibility: 'very high',
          sustainability: 'long-term',
          competitive_threat: 'very low'
        },
        {
          moat: 'Premium Mobile Experience',
          strength: 'strong',
          defensibility: 'medium',
          sustainability: 'medium-term',
          competitive_threat: 'high'
        }
      ]
    }
  };

  // Component State
  let currentPhaseData = writable({});
  let brandStrengthScore = 0;
  let marketLeadershipRanking = 'Premium Player';
  let competitiveAdvantageIndex = 0;
  let brandInnovationScore = 0;

  onMount(() => {
    initializePhase();
    calculateBrandMetrics();
    trackBrandLeadershipView();
  });

  function initializePhase() {
    switch (positioningPhase) {
      case 'analysis':
        initializeMarketAnalysis();
        break;
      case 'strategy':
        initializeBrandStrategy();
        break;
      case 'execution':
        initializeExecutionExcellence();
        break;
      case 'validation':
        initializeLeadershipValidation();
        break;
      case 'leadership':
        initializeMarketLeadership();
        break;
    }
  }

  function initializeMarketAnalysis() {
    currentPhaseData.set({
      ...brandLeadershipData.marketAnalysis,
      analysisCompletion: 94.8,
      competitiveIntelligence: 91.7,
      marketOpportunityScore: 87.3
    });
  }

  function initializeBrandStrategy() {
    currentPhaseData.set({
      ...brandLeadershipData.brandStrategy,
      strategyAlignment: 96.2,
      positioningStrength: 93.1,
      differentiation: 89.4
    });
  }

  function initializeExecutionExcellence() {
    currentPhaseData.set({
      ...brandLeadershipData.executionExcellence,
      executionQuality: 92.7,
      marketingEffectiveness: 88.9,
      operationalExcellence: 95.1
    });
  }

  function initializeLeadershipValidation() {
    currentPhaseData.set({
      ...brandLeadershipData.leadershipValidation,
      validationScore: 91.8,
      recognitionLevel: 'Industry Leader',
      competitiveMoatStrength: 94.3
    });
  }

  function initializeMarketLeadership() {
    currentPhaseData.set({
      leadershipScore: 93.6,
      marketPosition: 'Premium Leader',
      competitiveAdvantage: 89.7,
      brandInnovation: 87.2,
      futureReadiness: 94.1
    });
  }

  function calculateBrandMetrics() {
    // Calculate brand strength score
    const positioningScore = brandLeadershipData.brandStrategy.positioningFramework.brand_pillars
      .reduce((sum, pillar) => sum + pillar.strength, 0) / brandLeadershipData.brandStrategy.positioningFramework.brand_pillars.length;
    
    const executionScore = (brandLeadershipData.executionExcellence.marketingStrategy.digital_marketing.social_media_engagement +
                           brandLeadershipData.executionExcellence.operationalExcellence.service_delivery.booking_success_rate) / 2;
    
    brandStrengthScore = (positioningScore + executionScore) / 2;
    
    // Calculate competitive advantage index
    const advantages = Object.values(brandLeadershipData.marketAnalysis.argentinaMarketPosition.competitiveAdvantage);
    competitiveAdvantageIndex = advantages.reduce((sum, adv) => sum + adv.advantage, 0) / advantages.length;
    
    // Calculate brand innovation score
    brandInnovationScore = brandLeadershipData.brandStrategy.brandIdentityExcellence.voice_and_tone.innovation_leadership;
    
    // Determine market leadership ranking
    if (brandStrengthScore >= 95) marketLeadershipRanking = 'Market Dominator';
    else if (brandStrengthScore >= 90) marketLeadershipRanking = 'Category Leader';
    else if (brandStrengthScore >= 85) marketLeadershipRanking = 'Premium Player';
    else if (brandStrengthScore >= 80) marketLeadershipRanking = 'Strong Competitor';
    else marketLeadershipRanking = 'Market Participant';
  }

  function trackBrandLeadershipView() {
    console.log('[D14-001] Brand Leadership Finalization tracking initialized', {
      positioningPhase,
      marketFocus,
      brandTier,
      competitiveStrategy,
      culturalAlignment,
      scalabilityReadiness
    });
  }

  function handleBrandPositioning(strategy: string, impact: number, market_advantage: string) {
    dispatch('brandPositioning', { strategy, impact, market_advantage });
  }

  function handleCompetitiveDifferentiation(factor: string, advantage: number, sustainability: string) {
    dispatch('competitiveDifferentiation', { factor, advantage, sustainability });
  }

  function handleMarketLeadership(area: string, ranking: number, recognition: string) {
    dispatch('marketLeadership', { area, ranking, recognition });
  }

  function handleBrandInnovation(innovation: string, market_impact: number, adoption_potential: string) {
    dispatch('brandInnovation', { innovation, market_impact, adoption_potential });
  }

  function getScoreColor(score: number): string {
    if (score >= 95) return 'text-emerald-600';
    if (score >= 90) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getPositionBadge(position: string): string {
    const badges = {
      'Market Dominator': 'bg-purple-100 text-purple-800',
      'Category Leader': 'bg-emerald-100 text-emerald-800',
      'Premium Player': 'bg-blue-100 text-blue-800',
      'Strong Competitor': 'bg-yellow-100 text-yellow-800',
      'Market Participant': 'bg-gray-100 text-gray-800'
    };
    return badges[position] || badges['Market Participant'];
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-AR')}`;
  }

  $: currentData = $currentPhaseData;
</script>

<div class="brand-leadership-finalization" class:premium-tier={brandTier === 'premium'} class:luxury-tier={brandTier === 'luxury'}>
  {#if positioningPhase === 'analysis'}
    <!-- Market Analysis & Competitive Intelligence -->
    <section class="market-analysis bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Market Position -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center space-x-6 bg-white rounded-2xl p-8 shadow-xl">
            <div class="text-center">
              <div class="text-5xl font-bold mb-2 {getScoreColor(brandStrengthScore)}">
                #{currentData.argentinaMarketPosition?.currentPosition?.competitive_ranking || 2}
              </div>
              <div class="text-lg font-medium text-gray-700">Posición en Argentina</div>
              <div class="inline-block px-4 py-2 rounded-full text-sm font-bold mt-2 {getPositionBadge(marketLeadershipRanking)}">
                {marketLeadershipRanking}
              </div>
            </div>
            
            <div class="text-5xl mx-6">🇦🇷</div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">
                {formatPercentage(currentData.argentinaMarketPosition?.currentPosition?.market_share || 0)}
              </div>
              <div class="text-sm text-gray-600">Cuota de Mercado</div>
              <div class="text-2xl font-bold text-emerald-600 mt-1">
                {formatPercentage(currentData.argentinaMarketPosition?.currentPosition?.brand_awareness || 0)}
              </div>
              <div class="text-xs text-gray-500">Reconocimiento</div>
            </div>
          </div>
        </div>

        <!-- Competitive Advantage Matrix -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Matriz de Ventajas Competitivas</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Object.entries(currentData.argentinaMarketPosition?.competitiveAdvantage || {}) as [advantage, data]}
              <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div class="text-center">
                  <div class="text-3xl mb-4">
                    {#if advantage.includes('mobile')}📱
                    {:else if advantage.includes('argentina')}🇦🇷
                    {:else if advantage.includes('family')}👨‍👩‍👧‍👦
                    {:else if advantage.includes('payment')}💳
                    {:else if advantage.includes('premium')}⭐
                    {:else}🏆
                    {/if}
                  </div>
                  
                  <h3 class="text-lg font-bold text-gray-900 mb-3 capitalize">
                    {advantage.replace('_', ' ')}
                  </h3>
                  
                  <div class="text-4xl font-bold {getScoreColor(data.advantage)} mb-2">
                    +{data.advantage}%
                  </div>
                  
                  <div class="text-sm text-gray-600 mb-4">Ventaja Competitiva</div>
                  
                  <div class="space-y-2">
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600">Sostenibilidad:</span>
                      <span class="font-medium">
                        <span class="inline-block w-2 h-2 rounded-full mr-1"
                              class:bg-emerald-500={data.sustainability === 'very strong'}
                              class:bg-green-500={data.sustainability === 'strong'}
                              class:bg-yellow-500={data.sustainability === 'moderate'}></span>
                        {data.sustainability}
                      </span>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="text-xs text-gray-700">
                        <strong>Barrera:</strong> {data.moat}
                      </div>
                    </div>
                  </div>
                  
                  <button class="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          on:click={() => handleCompetitiveDifferentiation(advantage, data.advantage, data.sustainability)}>
                    Analizar Ventaja
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Market Opportunities -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Oportunidades de Mercado</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each currentData.argentinaMarketPosition?.marketOpportunities || [] as opportunity}
              <div class="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                <div class="flex justify-between items-start mb-4">
                  <h3 class="text-xl font-bold text-gray-900">{opportunity.opportunity}</h3>
                  <div class="text-2xl font-bold text-green-600">+{opportunity.potential}%</div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Timeline:</span>
                    <div class="font-medium">{opportunity.timeline}</div>
                  </div>
                  <div>
                    <span class="text-gray-600">Inversión:</span>
                    <div class="font-medium capitalize">{opportunity.investment}</div>
                  </div>
                </div>
                
                <div class="mt-4">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                         style="width: {opportunity.potential}%"></div>
                  </div>
                </div>
                
                <button class="w-full mt-4 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                        on:click={() => handleBrandPositioning(opportunity.opportunity, opportunity.potential, 'market expansion')}>
                  Evaluar Oportunidad
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Cultural Factors Dashboard -->
        {#if culturalAlignment}
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">🇦🇷 Factores Culturales Argentina</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {#each Object.entries(currentData.argentinaMarketPosition?.culturalFactors || {}) as [factor, score]}
                <div class="text-center p-4 bg-white rounded-xl shadow-md">
                  <div class="text-2xl mb-2">
                    {#if factor.includes('family')}👨‍👩‍👧‍👦
                    {:else if factor.includes('whatsapp')}💬
                    {:else if factor.includes('trust')}🤝
                    {:else if factor.includes('recommendation')}👥
                    {:else if factor.includes('price')}💰
                    {:else if factor.includes('quality')}⭐
                    {:else}📊
                    {/if}
                  </div>
                  
                  <div class="text-lg font-bold {getScoreColor(score)} mb-1">
                    {formatPercentage(score)}
                  </div>
                  
                  <div class="text-xs text-gray-600 capitalize">
                    {factor.replace('_', ' ')}
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div class="bg-blue-500 h-1 rounded-full" style="width: {score}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Competitive Landscape -->
        <div class="mt-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Panorama Competitivo</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Direct Competitors -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Competidores Directos</h3>
              
              <div class="space-y-4">
                {#each currentData.competitiveLandscape?.directCompetitors || [] as competitor}
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium text-gray-900">{competitor.name}</span>
                      <span class="text-lg font-bold {getScoreColor(competitor.strength)}">
                        {competitor.strength}%
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span class="text-gray-600">Cuota:</span>
                        <span class="font-medium ml-1">{formatPercentage(competitor.market_share)}</span>
                      </div>
                      <div>
                        <span class="text-gray-600">Debilidad:</span>
                        <span class="font-medium ml-1 text-red-600">{competitor.weakness}</span>
                      </div>
                    </div>
                    
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div class="bg-gradient-to-r from-gray-400 to-gray-600 h-2 rounded-full"
                           style="width: {competitor.strength}%"></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Market Gaps -->
            <div class="bg-white rounded-xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-gray-900 mb-6">Oportunidades de Mercado</h3>
              
              <div class="space-y-4">
                {#each currentData.competitiveLandscape?.marketGaps || [] as gap}
                  <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium text-gray-900">{gap.gap}</span>
                      <span class="text-lg font-bold text-emerald-600">
                        {gap.size}%
                      </span>
                    </div>
                    
                    <div class="text-sm text-gray-600 mb-3">
                      Direccionabilidad: 
                      <span class="font-medium capitalize"
                            class:text-emerald-600={gap.addressability === 'very high' || gap.addressability === 'high'}
                            class:text-yellow-600={gap.addressability === 'medium'}
                            class:text-red-600={gap.addressability === 'low'}>
                        {gap.addressability}
                      </span>
                    </div>
                    
                    <div class="w-full bg-emerald-200 rounded-full h-2">
                      <div class="bg-emerald-500 h-2 rounded-full" style="width: {gap.size}%"></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Analysis Actions -->
        <div class="mt-12 text-center">
          <div class="bg-white rounded-2xl p-8 shadow-xl">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Resumen de Análisis</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">
                  {formatPercentage(currentData.analysisCompletion || 0)}
                </div>
                <div class="text-sm text-gray-600">Análisis Completado</div>
              </div>
              
              <div class="text-center">
                <div class="text-3xl font-bold text-purple-600 mb-2">
                  {formatPercentage(currentData.competitiveIntelligence || 0)}
                </div>
                <div class="text-sm text-gray-600">Inteligencia Competitiva</div>
              </div>
              
              <div class="text-center">
                <div class="text-3xl font-bold text-emerald-600 mb-2">
                  {formatPercentage(currentData.marketOpportunityScore || 0)}
                </div>
                <div class="text-sm text-gray-600">Score Oportunidad</div>
              </div>
            </div>
            
            <div class="space-x-4">
              <button class="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      on:click={() => positioningPhase = 'strategy'}>
                Proceder a Estrategia
              </button>
              
              <button class="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                      on:click={() => handleMarketLeadership('analysis', currentData.analysisCompletion || 0, 'comprehensive')}>
                Validar Análisis
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .brand-leadership-finalization {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .premium-tier {
    --premium-gradient: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .luxury-tier {
    --luxury-gradient: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  }

  .market-analysis {
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
  }

  /* Competitive advantage animations */
  .competitive-advantage-card {
    transition: all 0.3s ease;
  }

  .competitive-advantage-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  /* Market position indicators */
  .market-leader {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .premium-player {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }

  .strong-competitor {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  /* Argentina cultural styling */
  .argentina-cultural-factor {
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
    color: white;
  }

  /* Opportunity growth animations */
  .opportunity-growth {
    animation: opportunityPulse 3s ease-in-out infinite;
  }

  @keyframes opportunityPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  /* Competitive intelligence styling */
  .competitive-intelligence {
    background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  }

  /* Responsive optimizations */
  @media (max-width: 768px) {
    .brand-leadership-finalization h1 {
      font-size: 2rem;
    }
    
    .brand-leadership-finalization .text-5xl {
      font-size: 2.5rem;
    }
    
    .grid.grid-cols-6 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .grid.grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* Accessibility enhancements */
  .brand-leadership-finalization [role="button"]:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Market leadership indicators */
  .leadership-excellent {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    animation: leadershipGlow 2s ease-in-out infinite alternate;
  }

  @keyframes leadershipGlow {
    from { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
    to { box-shadow: 0 0 30px rgba(16, 185, 129, 0.5); }
  }

  /* Cultural alignment indicators */
  .cultural-alignment-high {
    border-left: 4px solid #10b981;
    background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
  }

  .cultural-alignment-medium {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(90deg, #fffbeb 0%, #ffffff 100%);
  }

  .cultural-alignment-low {
    border-left: 4px solid #ef4444;
    background: linear-gradient(90deg, #fef2f2 0%, #ffffff 100%);
  }
</style>