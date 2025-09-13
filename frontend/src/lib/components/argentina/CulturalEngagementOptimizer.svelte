<!--
  Cultural Engagement Optimizer - Argentina Market User Engagement
  User retention designs, promotional interfaces, regional marketing optimization
  WhatsApp Business integration, peso-specific offers, cultural timing awareness
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { writable } from 'svelte/store';
  
  export let userId: string | null = null;
  export let userProfile: any = null;
  export let serviceType: 'barber' | 'psychology' | 'medical' = 'barber';
  export let location: string = 'CABA';
  
  const dispatch = createEventDispatcher<{
    engagementImproved: { strategy: string; impact: number; metadata: any };
    promotionActivated: { promotion: any; userProfile: any };
    culturalPreferenceApplied: { preference: string; adaptation: any };
    retentionStrategyDeployed: { strategy: any; expectedImpact: number };
  }>();
  
  // Argentina cultural engagement strategies
  let culturalEngagementStrategies = {
    timing: {
      siesta: {
        name: 'Adaptación de Siesta',
        description: 'Promociones especiales durante horarios post-siesta',
        impact: 22,
        implementation: {
          timeSlots: ['15:30-18:00'],
          discountPercentage: 15,
          messaging: 'Post-siesta refresh - 15% OFF turnos de la tarde',
          culturalRelevance: 'Muy alta'
        }
      },
      weekendFamily: {
        name: 'Plan Familia Fin de Semana',
        description: 'Promociones familiares para los fines de semana',
        impact: 28,
        implementation: {
          timeSlots: ['Saturday 10:00-16:00', 'Sunday 10:00-14:00'],
          familyDiscount: 20,
          messaging: 'Plan familiar - Papá, mamá y los chicos juntos',
          culturalRelevance: 'Muy alta'
        }
      },
      asado: {
        name: 'Pre-Asado Domingo',
        description: 'Servicios express antes del asado dominical',
        impact: 18,
        implementation: {
          timeSlots: ['Sunday 09:00-12:00'],
          expressService: true,
          messaging: 'Arreglate rápido para el asado - Servicio express',
          culturalRelevance: 'Alta'
        }
      }
    },
    communication: {
      whatsappBusiness: {
        name: 'WhatsApp Business Premium',
        description: 'Comunicación preferida por 67% de argentinos',
        impact: 35,
        features: {
          instantBooking: 'Reserva por WhatsApp en 30 segundos',
          reminderService: 'Recordatorios automáticos 24h antes',
          customerService: 'Soporte inmediato por chat',
          promotions: 'Ofertas exclusivas por WhatsApp'
        }
      },
      localSlang: {
        name: 'Lenguaje Porteño',
        description: 'Comunicación con modismos y expresiones locales',
        impact: 15,
        examples: {
          greetings: ['¡Hola, che!', '¿Qué tal, boludo?', '¡Dale, vení!'],
          confirmations: ['¡Bárbaro!', '¡Genial, pa!', '¡Dale que va!'],
          scheduling: ['¿Te pinta a las 3?', '¿Nos vemos el finde?']
        }
      }
    },
    payment: {
      mercadopagoPromo: {
        name: 'Promo MercadoPago',
        description: 'Descuentos especiales para el 92% que usa MP',
        impact: 25,
        implementation: {
          cashbackPercentage: 10,
          installmentOptions: [3, 6, 12],
          bonusPoints: true,
          messaging: 'Pagá con MercadoPago y llevate 10% de cashback'
        }
      },
      cuotasUff: {
        name: 'Cuotas sin Interés',
        description: 'Financiación que alivia el bolsillo argentino',
        impact: 30,
        implementation: {
          maxInstallments: 12,
          minimumAmount: 3000,
          partnerBanks: ['Banco Nación', 'Banco Provincia', 'BBVA'],
          messaging: 'Hasta 12 cuotas sin interés - Más fácil imposible'
        }
      }
    },
    social: {
      friendReferral: {
        name: 'Traé a tu Amigo',
        description: 'Programa de referidos con enfoque social argentino',
        impact: 32,
        rewards: {
          referrer: { type: 'discount', value: 30, description: '30% OFF en tu próximo turno' },
          referee: { type: 'discount', value: 20, description: '20% OFF en el primer turno' },
          bonusThreshold: { referrals: 3, bonus: 'Servicio gratis' }
        }
      },
      socialProof: {
        name: 'Testimonio de Barrio',
        description: 'Reseñas de vecinos del mismo barrio',
        impact: 28,
        features: {
          neighborhoodReviews: true,
          localInfluencers: ['Instagrammer de Palermo', 'YouTuber de Belgrano'],
          communityEvents: 'Participa en eventos del barrio'
        }
      }
    },
    seasonal: {
      motherDay: {
        name: 'Día de la Madre Especial',
        description: 'Promoción familiar para fecha muy importante',
        impact: 45,
        timing: 'October 3rd weekend',
        implementation: {
          familyPackage: true,
          motherDiscount: 40,
          complementaryGift: 'Rosa y chocolate artesanal',
          messaging: '¡Mamá se lo merece! Día especial para ella'
        }
      },
      summerReady: {
        name: 'Listo para el Verano',
        description: 'Preparación para temporada de playa y vacaciones',
        impact: 25,
        timing: 'November-December',
        implementation: {
          beachReadyPackage: true,
          vacationDiscount: 20,
          sunProtectionTips: true,
          messaging: '¡Preparate para Mar del Plata! Look veraniego'
        }
      }
    }
  };
  
  // User engagement metrics and personalization
  let userEngagementData = writable({
    visits: 0,
    bookings: 0,
    lastActivity: null,
    preferredTimes: [],
    culturalProfile: {
      siestaImpact: 'unknown',
      weekendActivity: 'unknown',
      paymentPreference: 'unknown',
      communicationStyle: 'unknown'
    },
    engagementScore: 0,
    churnRisk: 'low'
  });
  
  // Active promotions and campaigns
  let activePromotions = [];
  let personalizedOffers = [];
  let culturalAdaptations = [];
  
  // Regional marketing data
  const regionalMarketingData = {
    CABA: {
      trendsInfluence: 'Very High',
      pricesSensitivity: 'Medium',
      preferredChannels: ['Instagram', 'WhatsApp', 'Google'],
      peakSeasons: ['Mother\'s Day', 'Christmas', 'Valentine\'s'],
      culturalEvents: ['Tango Festival', 'Fashion Week', 'Restaurant Week']
    },
    GBA: {
      trendsInfluence: 'Medium',
      pricesSensitivity: 'High',
      preferredChannels: ['WhatsApp', 'Facebook', 'Local Radio'],
      peakSeasons: ['Back to School', 'Mother\'s Day', 'Christmas'],
      culturalEvents: ['Local Festivals', 'School Events', 'Neighborhood Fairs']
    },
    Interior: {
      trendsInfluence: 'Low',
      pricesSensitivity: 'Very High',
      preferredChannels: ['WhatsApp', 'Word of Mouth', 'Local Radio'],
      peakSeasons: ['Harvest Festival', 'Local Patron Saint'],
      culturalEvents: ['Agricultural Fairs', 'Regional Festivals']
    }
  };
  
  onMount(() => {
    initializeEngagementData();
    analyzeCulturalProfile();
    generatePersonalizedOffers();
    startEngagementMonitoring();
  });
  
  function initializeEngagementData() {
    // Load user engagement history
    if (userId) {
      // Simulate loading user data
      userEngagementData.update(data => ({
        ...data,
        visits: Math.floor(Math.random() * 20) + 1,
        bookings: Math.floor(Math.random() * 5) + 1,
        lastActivity: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000),
        engagementScore: Math.floor(Math.random() * 100)
      }));
    }
  }
  
  function analyzeCulturalProfile() {
    // Analyze user behavior to determine cultural preferences
    const currentHour = new Date().getHours();
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    
    userEngagementData.update(data => ({
      ...data,
      culturalProfile: {
        siestaImpact: currentHour >= 13 && currentHour <= 15 ? 'high' : 'medium',
        weekendActivity: isWeekend ? 'active' : 'unknown',
        paymentPreference: 'mercadopago', // Most common
        communicationStyle: 'informal' // Argentine preference
      }
    }));
  }
  
  function generatePersonalizedOffers() {
    const userData = $userEngagementData;
    personalizedOffers = [];
    
    // Siesta timing optimization
    if (userData.culturalProfile.siestaImpact === 'high') {
      personalizedOffers.push({
        id: 'post_siesta',
        title: 'Oferta Post-Siesta',
        description: '15% OFF en turnos después de las 15:30',
        discount: 15,
        timeRestriction: '15:30-18:00',
        culturalRelevance: 'high',
        icon: '☀️'
      });
    }
    
    // Payment method optimization
    if (userData.culturalProfile.paymentPreference === 'mercadopago') {
      personalizedOffers.push({
        id: 'mercadopago_cashback',
        title: 'Cashback MercadoPago',
        description: '10% de cashback pagando con MercadoPago',
        cashback: 10,
        paymentMethod: 'mercadopago',
        culturalRelevance: 'very_high',
        icon: '💳'
      });
    }
    
    // First-time user offers
    if (userData.bookings === 0) {
      personalizedOffers.push({
        id: 'welcome_argentina',
        title: '¡Bienvenido, che!',
        description: '25% OFF en tu primer turno + regalo sorpresa',
        discount: 25,
        gift: 'Producto de cortesía',
        newUser: true,
        culturalRelevance: 'high',
        icon: '🎁'
      });
    }
    
    // Loyalty offers
    if (userData.bookings >= 3) {
      personalizedOffers.push({
        id: 'loyalty_amigo',
        title: 'Cliente Fiel',
        description: 'Cada 5 turnos, el 6to es gratis',
        loyaltyProgram: true,
        requirement: 5,
        reward: 'Servicio gratuito',
        culturalRelevance: 'medium',
        icon: '⭐'
      });
    }
  }
  
  function startEngagementMonitoring() {
    // Monitor user engagement patterns
    setInterval(() => {
      const userData = $userEngagementData;
      
      // Calculate churn risk
      const daysSinceLastActivity = userData.lastActivity 
        ? (Date.now() - userData.lastActivity) / (1000 * 60 * 60 * 24)
        : 999;
      
      let churnRisk = 'low';
      if (daysSinceLastActivity > 30) churnRisk = 'high';
      else if (daysSinceLastActivity > 14) churnRisk = 'medium';
      
      userEngagementData.update(data => ({ ...data, churnRisk }));
      
      // Deploy retention strategies if needed
      if (churnRisk === 'high') {
        deployRetentionStrategy('win_back_campaign');
      } else if (churnRisk === 'medium') {
        deployRetentionStrategy('engagement_boost');
      }
    }, 10000); // Check every 10 seconds for demo
  }
  
  function deployRetentionStrategy(strategyType: string) {
    let strategy;
    
    switch (strategyType) {
      case 'win_back_campaign':
        strategy = {
          name: '¡Te extrañamos, che!',
          description: 'Campaña de reactivación con descuento especial',
          discount: 30,
          personalMessage: '¡Hace tiempo que no te vemos! Volvé con 30% OFF',
          urgency: '48 horas',
          channels: ['WhatsApp', 'Email'],
          expectedImpact: 35
        };
        break;
        
      case 'engagement_boost':
        strategy = {
          name: 'Oferta Exclusiva',
          description: 'Promoción especial para mantener engagement',
          discount: 15,
          personalMessage: 'Oferta exclusiva para vos - Solo por tiempo limitado',
          urgency: '7 días',
          channels: ['WhatsApp', 'Push Notification'],
          expectedImpact: 25
        };
        break;
    }
    
    if (strategy) {
      dispatch('retentionStrategyDeployed', { strategy, expectedImpact: strategy.expectedImpact });
    }
  }
  
  function activatePromotion(promotion: any) {
    dispatch('promotionActivated', {
      promotion,
      userProfile: $userEngagementData
    });
    
    // Add to active promotions
    activePromotions.push({
      ...promotion,
      activatedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
  }
  
  function applyCulturalStrategy(strategyKey: string, categoryKey: string) {
    const strategy = culturalEngagementStrategies[categoryKey][strategyKey];
    
    if (strategy) {
      dispatch('culturalPreferenceApplied', {
        preference: strategyKey,
        adaptation: strategy
      });
      
      culturalAdaptations.push({
        strategy: strategyKey,
        category: categoryKey,
        appliedAt: Date.now(),
        expectedImpact: strategy.impact
      });
    }
  }
  
  function improveEngagement(strategy: string, impact: number, metadata: any = {}) {
    dispatch('engagementImproved', { strategy, impact, metadata });
    
    // Update engagement score
    userEngagementData.update(data => ({
      ...data,
      engagementScore: Math.min(100, data.engagementScore + impact)
    }));
  }
  
  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-AR')}`;
  }
  
  function getRegionalData() {
    return regionalMarketingData[location] || regionalMarketingData.CABA;
  }
  
  function getCulturalRelevanceColor(relevance: string): string {
    switch (relevance) {
      case 'very_high': return 'text-green-700 bg-green-100';
      case 'high': return 'text-blue-700 bg-blue-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }
  
  $: currentRegionalData = getRegionalData();
  $: currentEngagementData = $userEngagementData;
</script>

<div class="cultural-engagement-optimizer bg-white rounded-xl shadow-lg border border-gray-100 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h3 class="text-xl font-bold text-gray-900 flex items-center">
        <span class="mr-2">🇦🇷</span>
        Optimización Cultural de Engagement
      </h3>
      <p class="text-gray-600">Estrategias personalizadas para el mercado argentino</p>
    </div>
    
    <div class="flex items-center space-x-3">
      <div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <span class="text-blue-700 text-sm font-medium">
          Score: {currentEngagementData.engagementScore}/100
        </span>
      </div>
      
      <div class="px-3 py-2 rounded-lg text-sm font-medium"
           class:bg-red-100={currentEngagementData.churnRisk === 'high'}
           class:text-red-700={currentEngagementData.churnRisk === 'high'}
           class:bg-yellow-100={currentEngagementData.churnRisk === 'medium'}
           class:text-yellow-700={currentEngagementData.churnRisk === 'medium'}
           class:bg-green-100={currentEngagementData.churnRisk === 'low'}
           class:text-green-700={currentEngagementData.churnRisk === 'low'}>
        Riesgo: {currentEngagementData.churnRisk === 'low' ? 'Bajo' : currentEngagementData.churnRisk === 'medium' ? 'Medio' : 'Alto'}
      </div>
    </div>
  </div>
  
  <!-- User Profile Summary -->
  <div class="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h4 class="font-semibold text-blue-900 mb-3">Perfil Cultural del Usuario</h4>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="text-center">
        <div class="text-lg mb-1">👤</div>
        <div class="font-medium text-gray-900">{currentEngagementData.visits} visitas</div>
        <div class="text-gray-600">Interacciones</div>
      </div>
      
      <div class="text-center">
        <div class="text-lg mb-1">📅</div>
        <div class="font-medium text-gray-900">{currentEngagementData.bookings} reservas</div>
        <div class="text-gray-600">Conversiones</div>
      </div>
      
      <div class="text-center">
        <div class="text-lg mb-1">💳</div>
        <div class="font-medium text-gray-900 capitalize">{currentEngagementData.culturalProfile.paymentPreference}</div>
        <div class="text-gray-600">Pago preferido</div>
      </div>
      
      <div class="text-center">
        <div class="text-lg mb-1">🕒</div>
        <div class="font-medium text-gray-900 capitalize">{currentEngagementData.culturalProfile.siestaImpact}</div>
        <div class="text-gray-600">Impacto siesta</div>
      </div>
    </div>
  </div>
  
  <!-- Personalized Offers -->
  {#if personalizedOffers.length > 0}
    <div class="mb-6">
      <h4 class="font-semibold text-gray-900 mb-4">Ofertas Personalizadas</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each personalizedOffers as offer}
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
               on:click={() => activatePromotion(offer)}>
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">{offer.icon}</span>
                <h5 class="font-medium text-gray-900">{offer.title}</h5>
              </div>
              <span class="text-xs px-2 py-1 rounded-full {getCulturalRelevanceColor(offer.culturalRelevance)}">
                {offer.culturalRelevance === 'very_high' ? 'Muy Relevante' : 
                 offer.culturalRelevance === 'high' ? 'Relevante' : 
                 offer.culturalRelevance === 'medium' ? 'Moderado' : 'Básico'}
              </span>
            </div>
            
            <p class="text-sm text-gray-600 mb-3">{offer.description}</p>
            
            <div class="flex items-center justify-between">
              <div class="text-sm">
                {#if offer.discount}
                  <span class="font-semibold text-green-600">{offer.discount}% OFF</span>
                {/if}
                {#if offer.cashback}
                  <span class="font-semibold text-blue-600">{offer.cashback}% Cashback</span>
                {/if}
                {#if offer.gift}
                  <span class="font-semibold text-purple-600">+ Regalo</span>
                {/if}
              </div>
              
              <button class="btn btn-sm btn-primary">Activar</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Cultural Engagement Strategies -->
  <div class="mb-6">
    <h4 class="font-semibold text-gray-900 mb-4">Estrategias de Engagement Cultural</h4>
    
    {#each Object.entries(culturalEngagementStrategies) as [category, strategies]}
      <div class="mb-6">
        <h5 class="font-medium text-gray-800 mb-3 capitalize flex items-center">
          {#if category === 'timing'}
            <span class="mr-2">⏰</span> Optimización Temporal
          {:else if category === 'communication'}
            <span class="mr-2">💬</span> Comunicación
          {:else if category === 'payment'}
            <span class="mr-2">💳</span> Pagos
          {:else if category === 'social'}
            <span class="mr-2">👥</span> Social
          {:else if category === 'seasonal'}
            <span class="mr-2">🎉</span> Estacional
          {:else}
            <span class="mr-2">⚡</span> {category}
          {/if}
        </h5>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each Object.entries(strategies) as [strategyKey, strategy]}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div class="flex items-center justify-between mb-2">
                <h6 class="font-medium text-gray-900">{strategy.name}</h6>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  +{strategy.impact}%
                </span>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">{strategy.description}</p>
              
              <!-- Strategy Details -->
              {#if strategy.implementation}
                <div class="text-xs text-gray-500 mb-3">
                  {#if strategy.implementation.timeSlots}
                    <p><strong>Horarios:</strong> {strategy.implementation.timeSlots.join(', ')}</p>
                  {/if}
                  {#if strategy.implementation.discountPercentage}
                    <p><strong>Descuento:</strong> {strategy.implementation.discountPercentage}%</p>
                  {/if}
                  {#if strategy.implementation.messaging}
                    <p><strong>Mensaje:</strong> "{strategy.implementation.messaging}"</p>
                  {/if}
                </div>
              {/if}
              
              {#if strategy.features}
                <div class="text-xs text-gray-500 mb-3">
                  {#each Object.entries(strategy.features) as [feature, description]}
                    <p><strong>{feature}:</strong> {description}</p>
                  {/each}
                </div>
              {/if}
              
              <button 
                class="btn btn-sm btn-secondary w-full"
                on:click={() => applyCulturalStrategy(strategyKey, category)}
              >
                Aplicar Estrategia
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Regional Marketing Insights -->
  <div class="mb-6">
    <h4 class="font-semibold text-gray-900 mb-4">Insights Regionales - {location}</h4>
    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 class="font-medium text-purple-900 mb-2">Preferencias de Canal</h5>
          <ul class="space-y-1 text-sm text-purple-700">
            {#each currentRegionalData.preferredChannels as channel}
              <li class="flex items-center space-x-2">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>{channel}</span>
              </li>
            {/each}
          </ul>
        </div>
        
        <div>
          <h5 class="font-medium text-purple-900 mb-2">Temporadas Peak</h5>
          <ul class="space-y-1 text-sm text-purple-700">
            {#each currentRegionalData.peakSeasons as season}
              <li class="flex items-center space-x-2">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>{season}</span>
              </li>
            {/each}
          </ul>
        </div>
        
        <div>
          <h5 class="font-medium text-purple-900 mb-2">Sensibilidad de Precios</h5>
          <p class="text-sm text-purple-700">{currentRegionalData.pricesSensitivity}</p>
        </div>
        
        <div>
          <h5 class="font-medium text-purple-900 mb-2">Influencia de Tendencias</h5>
          <p class="text-sm text-purple-700">{currentRegionalData.trendsInfluence}</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Active Promotions -->
  {#if activePromotions.length > 0}
    <div class="mb-6">
      <h4 class="font-semibold text-gray-900 mb-4">Promociones Activas</h4>
      <div class="space-y-3">
        {#each activePromotions as promotion}
          <div class="bg-green-50 border border-green-200 rounded-lg p-4" transition:fly={{ y: 20 }}>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">{promotion.icon}</span>
                <div>
                  <h5 class="font-medium text-green-900">{promotion.title}</h5>
                  <p class="text-sm text-green-700">{promotion.description}</p>
                </div>
              </div>
              
              <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Activa
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Cultural Adaptations Applied -->
  {#if culturalAdaptations.length > 0}
    <div>
      <h4 class="font-semibold text-gray-900 mb-4">Adaptaciones Culturales Aplicadas</h4>
      <div class="space-y-2">
        {#each culturalAdaptations.slice(0, 5) as adaptation}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm" transition:scale>
            <div class="flex items-center justify-between">
              <span class="text-blue-900 font-medium capitalize">{adaptation.strategy.replace('_', ' ')}</span>
              <span class="text-blue-700">+{adaptation.expectedImpact}% engagement</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .cultural-engagement-optimizer {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-500;
  }
  
  .btn-secondary {
    @apply text-gray-700 bg-white border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-gray-500;
  }
  
  .btn-sm {
    @apply px-3 py-1.5 text-xs;
  }
</style>