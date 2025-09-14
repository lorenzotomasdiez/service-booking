<!--
  Market Launch Experience Design & Brand Excellence - D11-001
  Comprehensive market launch experience with Argentina cultural alignment
  Premium brand positioning with conversion optimization and trust building
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { uxAnalytics } from '$lib/services/ux-analytics';

  export let variant: 'hero' | 'acquisition' | 'testimonials' | 'social-proof' | 'campaign-assets' = 'hero';
  export let vertical: 'barber' | 'psychology' | 'medical' = 'barber';
  export let argentinaCulture: boolean = true;
  export let premiumMode: boolean = true;
  export let launchPhase: 'pre-launch' | 'soft-launch' | 'full-launch' = 'soft-launch';

  const dispatch = createEventDispatcher<{
    conversionAction: { action: string; data: any; source: string };
    trustEngagement: { element: string; credibilityScore: number };
    brandInteraction: { component: string; value: string; quality: 'premium' | 'standard' };
    marketLaunchMetrics: { phase: string; engagement: number; conversion: number };
  }>();

  // Argentina Market & Brand Excellence Data
  const argentinaMarketData = {
    culturalElements: {
      barber: {
        trustSymbols: ['🏆', '✂️', '🥇', '👨‍💼'],
        popularServices: ['Corte Clásico', 'Barba y Bigote', 'Afeitado Tradicional'],
        culturalValues: ['Profesionalismo', 'Tradición', 'Confianza', 'Calidad'],
        premiumIndicators: ['Certificado', 'Reconocido', 'Premium', 'Exclusivo']
      },
      psychology: {
        trustSymbols: ['🧠', '💚', '🌟', '🤝'],
        popularServices: ['Terapia Individual', 'Terapia de Pareja', 'Evaluación'],
        culturalValues: ['Confidencialidad', 'Profesionalismo', 'Empatía', 'Resultados'],
        premiumIndicators: ['Especializado', 'Certificado', 'Reconocido', 'Experto']
      },
      medical: {
        trustSymbols: ['🏥', '⚕️', '🔬', '👩‍⚕️'],
        popularServices: ['Consulta General', 'Control Rutina', 'Especializada'],
        culturalValues: ['Confianza', 'Experiencia', 'Tecnología', 'Cuidado'],
        premiumIndicators: ['Especialista', 'Certificado', 'Avanzado', 'Premium']
      }
    },
    marketPositioning: {
      competitive_advantages: [
        'Tecnología más avanzada de Argentina',
        'Profesionales verificados y certificados',
        'Pagos seguros con MercadoPago',
        'Atención al cliente 24/7 en español',
        'Garantía de satisfacción del 100%'
      ],
      trustFactors: [
        { icon: '🔒', text: 'Datos protegidos con encriptación bancaria' },
        { icon: '✅', text: 'Profesionales verificados personalmente' },
        { icon: '💳', text: 'Pagos seguros con MercadoPago' },
        { icon: '⭐', text: 'Más de 10,000 reseñas positivas' },
        { icon: '🇦🇷', text: 'Empresa argentina con sede en Buenos Aires' }
      ],
      premiumFeatures: [
        'Agenda inteligente con IA',
        'Recordatorios automáticos por WhatsApp',
        'Reprogramación gratuita hasta 2 horas antes',
        'Servicio premium sin esperas',
        'Atención personalizada para cada cliente'
      ]
    },
    testimonials: [
      {
        name: 'María González',
        location: 'Palermo, CABA',
        service: vertical,
        rating: 5,
        text: 'La mejor experiencia que tuve reservando servicios online. Todo muy fácil y profesional.',
        verified: true,
        avatar: '👩‍💼'
      },
      {
        name: 'Carlos Mendez',
        location: 'Recoleta, CABA',
        service: vertical,
        rating: 5,
        text: 'Excelente plataforma. Los profesionales son de primera calidad y el pago es súper seguro.',
        verified: true,
        avatar: '👨‍💼'
      },
      {
        name: 'Sofia Martinez',
        location: 'Belgrano, CABA',
        service: vertical,
        rating: 5,
        text: 'Reservé para toda mi familia. El proceso fue rapidísimo y el servicio impecable.',
        verified: true,
        avatar: '👩'
      }
    ],
    socialProof: {
      statistics: {
        users: '50,000+',
        bookings: '200,000+',
        satisfaction: '98.5%',
        professionals: '2,500+',
        coverage: 'Toda CABA y GBA'
      },
      mediaFeatures: [
        { outlet: 'La Nación', headline: 'La startup argentina que revoluciona la reserva de servicios' },
        { outlet: 'Clarín Tech', headline: 'BarberPro: la plataforma que conecta profesionales con clientes' },
        { outlet: 'Infobae', headline: 'Cómo una app argentina está cambiando el mercado de servicios' }
      ]
    }
  };

  // Component State
  let currentData = writable({});
  let animationState = writable('idle');
  let conversionMetrics = {
    impressions: 0,
    interactions: 0,
    conversions: 0
  };

  onMount(() => {
    initializeVariant();
    trackLaunchImpression();
  });

  function initializeVariant() {
    switch (variant) {
      case 'hero':
        initializeHeroExperience();
        break;
      case 'acquisition':
        initializeAcquisitionExperience();
        break;
      case 'testimonials':
        initializeTestimonialExperience();
        break;
      case 'social-proof':
        initializeSocialProofExperience();
        break;
      case 'campaign-assets':
        initializeCampaignAssets();
        break;
    }
  }

  function initializeHeroExperience() {
    const verticalData = argentinaMarketData.culturalElements[vertical];
    currentData.set({
      heroTitle: getVerticalHeroTitle(),
      heroSubtitle: 'Reservá con los mejores profesionales de Argentina en segundos',
      ctaText: premiumMode ? 'Comenzar Experiencia Premium' : 'Reservar Ahora',
      trustSymbols: verticalData.trustSymbols,
      premiumIndicators: verticalData.premiumIndicators,
      culturalValues: verticalData.culturalValues,
      launchOffer: getLaunchOffer(),
      trustFactors: argentinaMarketData.marketPositioning.trustFactors.slice(0, 3)
    });
  }

  function initializeAcquisitionExperience() {
    currentData.set({
      acquisitionStrategies: [
        {
          title: 'Primera Reserva Gratis',
          description: 'Tu primera experiencia premium sin costo',
          cta: 'Reclamar Oferta',
          urgency: '⏰ Oferta limitada por lanzamiento',
          value: '$5,000 de valor'
        },
        {
          title: 'Invita y Gana',
          description: 'Gana $1,000 por cada amigo que invites',
          cta: 'Invitar Amigos',
          urgency: '💰 Sin límite de ganancias',
          value: 'Hasta $10,000/mes'
        },
        {
          title: 'Plan Familiar Premium',
          description: '4 personas por el precio de 3',
          cta: 'Activar Plan',
          urgency: '👨‍👩‍👧‍👦 Ideal para familias',
          value: '25% de ahorro'
        }
      ],
      conversionPath: {
        awareness: 'Descubrir BarberPro',
        interest: 'Ver beneficios únicos',
        consideration: 'Leer testimonios reales',
        intent: 'Comparar con competencia',
        evaluation: 'Probar gratis',
        purchase: 'Primera reserva exitosa'
      }
    });
  }

  function initializeTestimonialExperience() {
    currentData.set({
      testimonials: argentinaMarketData.testimonials,
      testimonialStats: {
        totalReviews: '10,247',
        averageRating: '4.9',
        recommendationRate: '98.5%',
        repeatCustomers: '89%'
      },
      videoTestimonials: [
        {
          thumbnail: '🎥',
          speaker: 'Laura Rodriguez',
          profession: 'Arquitecta',
          preview: 'Como profesional independiente, BarberPro me cambió la vida...',
          duration: '2:15'
        }
      ]
    });
  }

  function initializeSocialProofExperience() {
    currentData.set({
      ...argentinaMarketData.socialProof,
      liveActivity: {
        recentBookings: [
          { name: 'Ana M.', location: 'Villa Crespo', minutes: 2, service: 'Corte Clásico' },
          { name: 'Pedro L.', location: 'San Telmo', minutes: 5, service: 'Barba y Bigote' },
          { name: 'Carmen S.', location: 'Belgrano', minutes: 8, service: 'Combo Completo' }
        ],
        onlineUsers: 1247,
        activeProfessionals: 89
      },
      certifications: [
        { name: 'ISO 27001', description: 'Seguridad de la información' },
        { name: 'PCI DSS', description: 'Seguridad en pagos' },
        { name: 'Cámara de Comercio', description: 'Empresa registrada' }
      ]
    });
  }

  function initializeCampaignAssets() {
    currentData.set({
      campaignMessages: [
        {
          medium: 'digital_ads',
          headline: 'Reservá con los Mejores Profesionales de Argentina',
          subheading: 'Tecnología Premium • Profesionales Verificados • Pagos Seguros',
          cta: 'Probar Gratis Ahora'
        },
        {
          medium: 'social_media',
          headline: '🚀 ¡BarberPro ya está en Argentina!',
          subheading: 'La app que están usando todos para reservar servicios premium',
          cta: 'Descargar App'
        },
        {
          medium: 'partnerships',
          headline: 'Únete a la Red Premium de Profesionales',
          subheading: 'Más clientes • Mejores herramientas • Pagos automáticos',
          cta: 'Registrar Negocio'
        }
      ],
      brandAssets: {
        colors: {
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#10b981',
          premium: '#6366f1'
        },
        typography: {
          heading: 'Poppins Bold',
          body: 'Inter Regular',
          accent: 'Inter Medium'
        },
        iconography: [
          { category: 'trust', icons: ['🔒', '✅', '⭐', '🏆'] },
          { category: 'argentina', icons: ['🇦🇷', '🥩', '⚽', '🌟'] },
          { category: 'premium', icons: ['👑', '💎', '🥇', '✨'] }
        ]
      }
    });
  }

  function getVerticalHeroTitle() {
    const titles = {
      barber: 'Reservá con los Mejores Barberos de Argentina',
      psychology: 'Conectá con Psicólogos Profesionales de Confianza',
      medical: 'Acceso Inmediato a Médicos Especialistas'
    };
    return titles[vertical];
  }

  function getLaunchOffer() {
    const offers = {
      'pre-launch': '50% OFF - Acceso anticipado exclusivo',
      'soft-launch': '30% OFF - Oferta de lanzamiento limitada',
      'full-launch': '20% OFF - Celebramos nuestro lanzamiento oficial'
    };
    return offers[launchPhase];
  }

  function trackLaunchImpression() {
    conversionMetrics.impressions++;
    uxAnalytics.trackExternalEvent('market_launch_impression', {
      variant,
      vertical,
      launchPhase,
      premiumMode,
      timestamp: Date.now()
    });
  }

  function handleConversionAction(action: string, data: any, source: string) {
    conversionMetrics.interactions++;
    if (action.includes('convert') || action.includes('signup') || action.includes('book')) {
      conversionMetrics.conversions++;
    }

    dispatch('conversionAction', { action, data, source });
    
    uxAnalytics.trackExternalEvent('market_launch_conversion', {
      action,
      source,
      variant,
      vertical,
      conversionRate: (conversionMetrics.conversions / conversionMetrics.impressions) * 100
    });
  }

  function handleTrustEngagement(element: string) {
    const credibilityScore = calculateCredibilityScore(element);
    dispatch('trustEngagement', { element, credibilityScore });
    
    uxAnalytics.trackExternalEvent('trust_engagement', {
      element,
      credibilityScore,
      variant,
      vertical
    });
  }

  function calculateCredibilityScore(element: string): number {
    const scores = {
      'testimonial': 85,
      'certification': 95,
      'social_proof': 80,
      'media_feature': 90,
      'guarantee': 88,
      'verification': 92
    };
    return scores[element] || 70;
  }

  function formatArgentinaCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  }

  $: currentVariantData = $currentData;
  $: conversionRate = conversionMetrics.impressions > 0 
    ? (conversionMetrics.conversions / conversionMetrics.impressions) * 100 
    : 0;
</script>

<div class="market-launch-experience" class:premium-mode={premiumMode}>
  {#if variant === 'hero'}
    <!-- Premium Hero Experience -->
    <section class="hero-section bg-gradient-to-br from-blue-50 via-white to-green-50 py-16 px-6" 
             in:fade={{ duration: 800, easing: quintOut }}>
      <div class="max-w-6xl mx-auto">
        <!-- Argentina Flag & Premium Badge -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg border border-blue-100 mb-6">
            <span class="text-2xl">🇦🇷</span>
            <span class="text-blue-600 font-semibold">Hecho en Argentina</span>
            {#if premiumMode}
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                ✨ PREMIUM
              </span>
            {/if}
          </div>
          
          <!-- Trust Symbols Animation -->
          <div class="flex justify-center space-x-4 mb-6">
            {#each currentVariantData.trustSymbols || [] as symbol, i}
              <div class="text-4xl animate-bounce" 
                   style="animation-delay: {i * 0.2}s"
                   in:scale={{ delay: i * 200, duration: 600 }}>
                {symbol}
              </div>
            {/each}
          </div>
        </div>

        <!-- Main Hero Content -->
        <div class="text-center mb-12">
          <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            <span class="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {currentVariantData.heroTitle || ''}
            </span>
          </h1>
          
          <p class="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            {currentVariantData.heroSubtitle || ''}
          </p>

          <!-- Launch Offer Banner -->
          <div class="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4 mb-8 max-w-2xl mx-auto transform hover:scale-105 transition-transform">
            <div class="text-lg font-bold mb-2">🎉 OFERTA DE LANZAMIENTO</div>
            <div class="text-2xl font-black">{currentVariantData.launchOffer || ''}</div>
            <div class="text-sm opacity-90 mt-1">⏰ Válido por tiempo limitado</div>
          </div>

          <!-- Primary CTA -->
          <div class="space-y-4">
            <button class="bg-gradient-to-r from-blue-600 to-green-600 text-white px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                    on:click={() => handleConversionAction('hero_primary_cta', { phase: launchPhase }, 'hero_section')}>
              {currentVariantData.ctaText || 'Comenzar Ahora'} →
            </button>
            
            <div class="text-sm text-gray-600 flex items-center justify-center space-x-6">
              <span class="flex items-center space-x-1">
                <span>✅</span>
                <span>Sin compromisos</span>
              </span>
              <span class="flex items-center space-x-1">
                <span>🔒</span>
                <span>100% Seguro</span>
              </span>
              <span class="flex items-center space-x-1">
                <span>⭐</span>
                <span>Garantía total</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Trust Factors Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {#each currentVariantData.trustFactors || [] as factor}
            <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                 on:click={() => handleTrustEngagement('trust_factor')}
                 role="button" tabindex="0">
              <div class="text-3xl mb-3">{factor.icon}</div>
              <p class="text-gray-700 font-medium">{factor.text}</p>
            </div>
          {/each}
        </div>

        <!-- Cultural Values -->
        <div class="text-center">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">Nuestros Valores Argentinos</h3>
          <div class="flex flex-wrap justify-center gap-4">
            {#each currentVariantData.culturalValues || [] as value}
              <span class="bg-blue-50 text-blue-800 px-4 py-2 rounded-full font-medium border border-blue-200">
                {value}
              </span>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'acquisition'}
    <!-- Customer Acquisition Experience -->
    <section class="acquisition-section py-16 px-6 bg-gray-50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Ofertas Exclusivas de Lanzamiento</h2>
          <p class="text-xl text-gray-700">Aprovecha estas oportunidades únicas para nuevos usuarios</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          {#each currentVariantData.acquisitionStrategies || [] as strategy}
            <div class="bg-white rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-blue-300 transition-all transform hover:scale-105">
              <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">{strategy.title}</h3>
                <p class="text-gray-700 mb-6">{strategy.description}</p>
                
                <div class="bg-green-50 text-green-800 rounded-lg p-4 mb-6">
                  <div class="font-bold text-lg">{strategy.value}</div>
                  <div class="text-sm">{strategy.urgency}</div>
                </div>

                <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold w-full hover:shadow-lg transition-all"
                        on:click={() => handleConversionAction('acquisition_offer', strategy, 'acquisition_section')}>
                  {strategy.cta}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Conversion Path Visualization -->
        <div class="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">Tu Camino hacia el Éxito</h3>
          <div class="flex flex-wrap justify-between items-center space-y-4 md:space-y-0">
            {#each Object.entries(currentVariantData.conversionPath || {}) as [key, step], i}
              <div class="flex items-center space-x-4">
                <div class="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div class="text-gray-700 font-medium">{step}</div>
                {#if i < Object.keys(currentVariantData.conversionPath || {}).length - 1}
                  <div class="text-gray-400 hidden md:block">→</div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'testimonials'}
    <!-- Testimonials Experience -->
    <section class="testimonials-section py-16 px-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Qué Dicen Nuestros Usuarios Argentinos</h2>
          <p class="text-xl text-gray-700">Testimonios reales de personas reales</p>
        </div>

        <!-- Testimonial Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {#each Object.entries(currentVariantData.testimonialStats || {}) as [key, value]}
            <div class="text-center bg-white rounded-xl p-6 shadow-lg">
              <div class="text-3xl font-bold text-blue-600 mb-2">{value}</div>
              <div class="text-gray-700 capitalize">
                {#if key === 'totalReviews'}Reseñas Totales
                {:else if key === 'averageRating'}Calificación
                {:else if key === 'recommendationRate'}Recomiendan
                {:else if key === 'repeatCustomers'}Clientes Recurrentes
                {:else}{key}
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Individual Testimonials -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {#each currentVariantData.testimonials || [] as testimonial}
            <div class="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
                 on:click={() => handleTrustEngagement('testimonial')}
                 role="button" tabindex="0">
              <div class="flex items-center space-x-4 mb-6">
                <div class="text-4xl">{testimonial.avatar}</div>
                <div>
                  <div class="font-bold text-gray-900">{testimonial.name}</div>
                  <div class="text-sm text-gray-600">{testimonial.location}</div>
                  {#if testimonial.verified}
                    <div class="flex items-center space-x-1 text-green-600 text-xs">
                      <span>✅</span>
                      <span>Cliente Verificado</span>
                    </div>
                  {/if}
                </div>
              </div>
              
              <div class="flex mb-4">
                {#each Array(testimonial.rating) as _}
                  <span class="text-yellow-400 text-xl">⭐</span>
                {/each}
              </div>
              
              <p class="text-gray-700 italic mb-4">"{{testimonial.text}}"</p>
              
              <div class="text-sm text-blue-600 font-medium">
                Servicio: {testimonial.service === 'barber' ? 'Barbería' : testimonial.service === 'psychology' ? 'Psicología' : 'Medicina'}
              </div>
            </div>
          {/each}
        </div>

        <!-- Video Testimonials Preview -->
        <div class="bg-white rounded-2xl p-8 shadow-lg">
          <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">Testimonios en Video</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each currentVariantData.videoTestimonials || [] as video}
              <div class="relative bg-gray-100 rounded-xl p-6 hover:bg-gray-200 transition-colors cursor-pointer"
                   on:click={() => handleConversionAction('video_testimonial_view', video, 'testimonials')}>
                <div class="text-6xl text-center mb-4">{video.thumbnail}</div>
                <div class="text-center">
                  <div class="font-bold text-gray-900">{video.speaker}</div>
                  <div class="text-sm text-gray-600 mb-2">{video.profession}</div>
                  <p class="text-gray-700 italic text-sm mb-2">{video.preview}</p>
                  <div class="text-blue-600 font-medium">Ver video completo ({video.duration})</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'social-proof'}
    <!-- Social Proof Experience -->
    <section class="social-proof-section py-16 px-6 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Confianza Demostrada</h2>
          <p class="text-xl text-gray-700">Miles de argentinos ya confían en nosotros</p>
        </div>

        <!-- Live Statistics -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          {#each Object.entries(currentVariantData.statistics || {}) as [key, value]}
            <div class="text-center bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 shadow-lg"
                 on:click={() => handleTrustEngagement('social_proof')}
                 role="button" tabindex="0">
              <div class="text-3xl font-bold text-blue-600 mb-2">{value}</div>
              <div class="text-gray-700 text-sm capitalize">
                {#if key === 'users'}Usuarios Activos
                {:else if key === 'bookings'}Reservas Realizadas
                {:else if key === 'satisfaction'}Satisfacción
                {:else if key === 'professionals'}Profesionales
                {:else if key === 'coverage'}Cobertura
                {:else}{key}
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Live Activity Feed -->
        <div class="bg-gray-50 rounded-2xl p-8 mb-12">
          <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">Actividad en Tiempo Real</h3>
          <div class="space-y-4 max-w-2xl mx-auto">
            {#each currentVariantData.liveActivity?.recentBookings || [] as booking}
              <div class="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between"
                   in:slide={{ delay: Math.random() * 1000 }}>
                <div class="flex items-center space-x-3">
                  <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div class="font-medium text-gray-900">{booking.name} reservó {booking.service}</div>
                    <div class="text-sm text-gray-600">{booking.location} • hace {booking.minutes} minutos</div>
                  </div>
                </div>
                <div class="text-green-600 font-medium">✅</div>
              </div>
            {/each}
            
            <div class="text-center pt-4">
              <div class="text-lg font-semibold text-gray-900 mb-2">
                🟢 {currentVariantData.liveActivity?.onlineUsers || 0} usuarios conectados ahora
              </div>
              <div class="text-sm text-gray-600">
                {currentVariantData.liveActivity?.activeProfessionals || 0} profesionales disponibles
              </div>
            </div>
          </div>
        </div>

        <!-- Media Features -->
        <div class="mb-12">
          <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">Apariciones en Medios</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each currentVariantData.mediaFeatures || [] as feature}
              <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                   on:click={() => handleTrustEngagement('media_feature')}
                   role="button" tabindex="0">
                <div class="text-center">
                  <div class="font-bold text-lg text-gray-900 mb-2">{feature.outlet}</div>
                  <p class="text-gray-700 italic">"{feature.headline}"</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Certifications -->
        <div class="bg-blue-50 rounded-2xl p-8">
          <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">Certificaciones y Seguridad</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each currentVariantData.certifications || [] as cert}
              <div class="bg-white rounded-xl p-6 text-center shadow-lg"
                   on:click={() => handleTrustEngagement('certification')}
                   role="button" tabindex="0">
                <div class="text-3xl mb-3">🏆</div>
                <div class="font-bold text-gray-900 mb-2">{cert.name}</div>
                <p class="text-gray-600 text-sm">{cert.description}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

  {:else if variant === 'campaign-assets'}
    <!-- Campaign Assets Showcase -->
    <section class="campaign-assets py-16 px-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Activos de Campaña de Lanzamiento</h2>
          <p class="text-xl text-gray-700">Mensajes y diseños optimizados para cada canal</p>
        </div>

        <!-- Campaign Messages -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {#each currentVariantData.campaignMessages || [] as message}
            <div class="bg-white rounded-2xl p-8 shadow-xl">
              <div class="text-center">
                <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 inline-block">
                  {message.medium.replace('_', ' ').toUpperCase()}
                </div>
                
                <h3 class="text-2xl font-bold text-gray-900 mb-4">{message.headline}</h3>
                <p class="text-gray-700 mb-6">{message.subheading}</p>
                
                <button class="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                        on:click={() => handleConversionAction('campaign_cta', message, 'campaign_assets')}>
                  {message.cta}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Brand Assets -->
        <div class="bg-white rounded-2xl p-8 shadow-xl">
          <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">Sistema de Marca</h3>
          
          <!-- Color Palette -->
          <div class="mb-8">
            <h4 class="text-xl font-semibold text-gray-900 mb-4">Paleta de Colores</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#each Object.entries(currentVariantData.brandAssets?.colors || {}) as [name, color]}
                <div class="text-center">
                  <div class="w-20 h-20 rounded-xl shadow-lg mx-auto mb-2" 
                       style="background-color: {color}"></div>
                  <div class="font-medium text-gray-900 capitalize">{name}</div>
                  <div class="text-sm text-gray-600">{color}</div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Typography -->
          <div class="mb-8">
            <h4 class="text-xl font-semibold text-gray-900 mb-4">Tipografía</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {#each Object.entries(currentVariantData.brandAssets?.typography || {}) as [usage, font]}
                <div class="text-center bg-gray-50 rounded-xl p-6">
                  <div class="text-2xl font-bold text-gray-900 mb-2" style="font-family: {font}">
                    Aa Bb Cc
                  </div>
                  <div class="font-medium text-gray-700 capitalize">{usage}</div>
                  <div class="text-sm text-gray-600">{font}</div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Iconography -->
          <div>
            <h4 class="text-xl font-semibold text-gray-900 mb-4">Iconografía</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {#each currentVariantData.brandAssets?.iconography || [] as category}
                <div class="text-center bg-gray-50 rounded-xl p-6">
                  <div class="text-3xl mb-3">
                    {#each category.icons as icon}
                      <span class="mr-2">{icon}</span>
                    {/each}
                  </div>
                  <div class="font-medium text-gray-900 capitalize">{category.category}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Conversion Metrics Footer -->
  <div class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 text-xs border border-gray-200" class:hidden={!premiumMode}>
    <div class="font-semibold text-gray-900 mb-1">Métricas en Tiempo Real</div>
    <div class="space-y-1 text-gray-600">
      <div>Impresiones: {conversionMetrics.impressions}</div>
      <div>Interacciones: {conversionMetrics.interactions}</div>
      <div>Conversiones: {conversionMetrics.conversions}</div>
      <div class="font-semibold text-green-600">Tasa: {conversionRate.toFixed(1)}%</div>
    </div>
  </div>
</div>

<style>
  .market-launch-experience {
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  .premium-mode {
    --premium-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --premium-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
  }

  .hero-section h1 {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .animate-bounce {
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -10px, 0);
    }
    70% {
      transform: translate3d(0, -5px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }

  .hover\:shadow-3xl:hover {
    box-shadow: 0 35px 60px rgba(0, 0, 0, 0.15);
  }

  /* Argentina-specific styling */
  .argentina-accent {
    background: linear-gradient(45deg, #74b9ff, #00b894);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Responsive enhancements for mobile-first design */
  @media (max-width: 768px) {
    .hero-section h1 {
      font-size: 2.5rem;
      line-height: 1.2;
    }
    
    .hero-section .text-xl {
      font-size: 1.125rem;
    }
  }
</style>