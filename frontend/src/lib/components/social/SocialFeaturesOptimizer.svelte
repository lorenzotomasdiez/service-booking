<!--
  Social Features Optimizer - Day 9 Argentina Social Communication Enhancement
  Building on 4.8/5 satisfaction for social testimonial optimization
  Advanced social features with WhatsApp integration and Argentina cultural patterns
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { fade, fly, scale, slide } from 'svelte/transition';
  
  export let variant: 'social-features' | 'whatsapp-design' | 'referral-interface' | 'community-features' | 'loyalty-program' | 'marketing-tools' = 'social-features';
  export let vertical: 'barber' | 'psychology' | 'dentist' | 'fitness' | 'veterinary' | 'beauty' = 'barber';
  export let argentinaOptimized: boolean = true;
  export let userType: 'client' | 'provider' = 'client';
  
  const dispatch = createEventDispatcher<{
    socialAction: { action: string; data: any; platform: string };
    whatsappIntegration: { feature: string; configuration: any };
    referralActivation: { referrer: string; referee: string; vertical: string };
    communityEngagement: { type: string; content: any; engagement: number };
  }>();
  
  // Argentina social media usage patterns (2024 data)
  const argentinaSocialData = {
    whatsappUsage: 97,        // % of internet users
    instagramUsage: 85,       // % of internet users  
    facebookUsage: 78,        // % of internet users
    linkedinUsage: 45,        // % of internet users
    tiktokUsage: 62,          // % of internet users
    preferredCommunication: {
      whatsapp: 67,
      email: 25,
      sms: 8
    },
    socialSharing: {
      beforeAfter: 78,         // % willing to share transformations
      reviews: 85,             // % trust online reviews
      referrals: 92,           // % trust friend recommendations
      userGeneratedContent: 73  // % engage with UGC
    },
    demographicPreferences: {
      '18-25': ['Instagram', 'TikTok', 'WhatsApp'],
      '26-35': ['Instagram', 'WhatsApp', 'Facebook'],
      '36-45': ['WhatsApp', 'Facebook', 'Instagram'],
      '46-60': ['WhatsApp', 'Facebook', 'Email'],
      '60+': ['WhatsApp', 'Email', 'Facebook']
    }
  };
  
  // Social features configuration per vertical
  const verticalSocialConfig = {
    barber: {
      keyFeatures: ['before_after_gallery', 'style_voting', 'barber_challenges', 'group_bookings', 'father_son_specials'],
      socialContent: ['transformation_videos', 'styling_tips', 'product_reviews', 'barber_stories'],
      communityTypes: ['neighborhood_barbers', 'style_enthusiasts', 'fathers_community'],
      trustSignals: ['verified_barbers', 'neighborhood_reviews', 'tradition_badges'],
      marketingAngles: ['craftsmanship', 'tradition', 'masculine_bonding', 'style_transformation']
    },
    psychology: {
      keyFeatures: ['anonymous_support_groups', 'wellness_challenges', 'mindfulness_community', 'family_progress'],
      socialContent: ['wellness_tips', 'mental_health_education', 'success_stories', 'therapeutic_insights'],
      communityTypes: ['wellness_circle', 'family_support', 'professional_network'],
      trustSignals: ['licensed_professionals', 'confidentiality_badges', 'success_testimonials'],
      marketingAngles: ['mental_wellness', 'family_health', 'professional_support', 'life_improvement'],
      privacyFirst: true
    },
    dentist: {
      keyFeatures: ['smile_gallery', 'oral_health_tips', 'family_dental_plans', 'emergency_network'],
      socialContent: ['oral_health_education', 'smile_transformations', 'dental_tips', 'family_care'],
      communityTypes: ['family_dental_care', 'oral_health_enthusiasts', 'dental_professionals'],
      trustSignals: ['certified_dentists', 'equipment_showcase', 'insurance_accepted'],
      marketingAngles: ['healthy_smiles', 'family_care', 'modern_technology', 'pain_free_treatment']
    },
    fitness: {
      keyFeatures: ['workout_challenges', 'progress_sharing', 'group_training', 'fitness_competitions'],
      socialContent: ['transformation_videos', 'workout_tips', 'nutrition_advice', 'motivational_content'],
      communityTypes: ['fitness_community', 'workout_partners', 'challenge_groups'],
      trustSignals: ['certified_trainers', 'real_results', 'safety_protocols'],
      marketingAngles: ['body_transformation', 'health_improvement', 'community_support', 'personal_achievement']
    },
    veterinary: {
      keyFeatures: ['pet_gallery', 'health_tracking', 'pet_playdate_coordination', 'emergency_network'],
      socialContent: ['pet_care_tips', 'health_education', 'cute_pet_moments', 'veterinary_insights'],
      communityTypes: ['pet_owners', 'breed_enthusiasts', 'veterinary_professionals'],
      trustSignals: ['licensed_veterinarians', 'emergency_availability', 'pet_love_verification'],
      marketingAngles: ['pet_health', 'loving_care', 'emergency_readiness', 'pet_happiness']
    },
    beauty: {
      keyFeatures: ['transformation_gallery', 'beauty_challenges', 'product_recommendations', 'style_voting'],
      socialContent: ['beauty_transformations', 'tutorial_videos', 'product_reviews', 'style_inspiration'],
      communityTypes: ['beauty_enthusiasts', 'style_community', 'product_lovers'],
      trustSignals: ['professional_artists', 'quality_products', 'transformation_results'],
      marketingAngles: ['beauty_transformation', 'self_confidence', 'style_enhancement', 'premium_experience']
    }
  };
  
  // WhatsApp Business integration patterns
  const whatsappIntegrationConfig = {
    messageTemplates: {
      booking_confirmation: {
        template: "¡Hola {cliente_nombre}! Tu reserva con {proveedor_nombre} está confirmada para {fecha} a las {hora}. Dirección: {direccion}. ¿Alguna pregunta? Respondeme acá 😊",
        variables: ['cliente_nombre', 'proveedor_nombre', 'fecha', 'hora', 'direccion']
      },
      booking_reminder: {
        template: "📅 Recordatorio: Tenés tu cita mañana {fecha} a las {hora} con {proveedor_nombre}. Para confirmar o reprogramar, respondeme a este mensaje.",
        variables: ['fecha', 'hora', 'proveedor_nombre']
      },
      post_service_followup: {
        template: "¡Gracias por elegirnos! ¿Cómo te sentís con el servicio de {proveedor_nombre}? Tu opinión nos ayuda a mejorar. Dejanos tu reseña: {link_reseña}",
        variables: ['proveedor_nombre', 'link_reseña']
      },
      referral_invitation: {
        template: "¡Tu amigo {referidor_nombre} te recomienda {servicio_tipo} en {plataforma_nombre}! Usá este código {codigo_descuento} y obtené 20% descuento. Reservá acá: {link_reserva}",
        variables: ['referidor_nombre', 'servicio_tipo', 'plataforma_nombre', 'codigo_descuento', 'link_reserva']
      },
      community_update: {
        template: "🎉 ¡{proveedor_nombre} está trendeando en tu barrio! Con {rating}/5 estrellas y {total_reviews} reseñas. ¿Querés ver disponibilidad? {link_disponibilidad}",
        variables: ['proveedor_nombre', 'rating', 'total_reviews', 'link_disponibilidad']
      }
    },
    businessFeatures: {
      catalogIntegration: true,
      paymentLinks: true,
      customerLabels: true,
      broadcastLists: true,
      automatedResponses: true,
      multiDeviceSupport: true,
      analyticsIntegration: true
    },
    culturalOptimization: {
      informalTone: true,
      localSlang: ['che', 'bárbaro', 'copado', 'genial'],
      emojiUsage: 'moderate',
      responseTimeExpectation: '< 30 minutes',
      businessHours: 'respects siesta hours'
    }
  };
  
  // Component state
  let componentData = writable({});
  let socialMetrics = writable({
    engagement: 0,
    shares: 0,
    referrals: 0,
    communitySize: 0
  });
  let selectedSocialPlatform = 'whatsapp';
  
  onMount(() => {
    initializeSocialSystem();
  });
  
  function initializeSocialSystem() {
    switch (variant) {
      case 'social-features':
        initializeSocialFeatures();
        break;
      case 'whatsapp-design':
        initializeWhatsAppDesign();
        break;
      case 'referral-interface':
        initializeReferralInterface();
        break;
      case 'community-features':
        initializeCommunityFeatures();
        break;
      case 'loyalty-program':
        initializeLoyaltyProgram();
        break;
      case 'marketing-tools':
        initializeMarketingTools();
        break;
    }
  }
  
  function initializeSocialFeatures() {
    const config = verticalSocialConfig[vertical];
    componentData.set({
      socialOverview: {
        whatsappUsers: argentinaSocialData.whatsappUsage,
        socialSharing: argentinaSocialData.socialSharing,
        verticalFeatures: config.keyFeatures,
        trustSignals: config.trustSignals
      },
      socialPlatforms: [
        {
          platform: 'WhatsApp',
          usage: argentinaSocialData.whatsappUsage,
          priority: 'Critical',
          features: ['Direct messaging', 'Group chats', 'Business catalog', 'Payment links'],
          argentinaSpecific: 'Primary communication channel'
        },
        {
          platform: 'Instagram',
          usage: argentinaSocialData.instagramUsage,
          priority: 'High',
          features: ['Stories', 'Reels', 'Before/After posts', 'Direct messaging'],
          argentinaSpecific: 'Visual showcase platform'
        },
        {
          platform: 'Facebook',
          usage: argentinaSocialData.facebookUsage,
          priority: 'Medium',
          features: ['Community groups', 'Event promotion', 'Reviews', 'Local business pages'],
          argentinaSpecific: 'Community building and reviews'
        },
        {
          platform: 'Google Reviews',
          usage: 95,
          priority: 'Critical',
          features: ['Star ratings', 'Written reviews', 'Photos', 'Response management'],
          argentinaSpecific: 'Primary review platform'
        }
      ],
      engagementFeatures: [
        {
          feature: 'Before/After Gallery',
          description: 'Showcase transformations with client consent',
          engagement: '+45% social shares',
          privacy: vertical === 'psychology' ? 'Anonymous only' : 'Consent required',
          argentinaCultural: 'High sharing culture'
        },
        {
          feature: 'Client Testimonials Video',
          description: 'Short video testimonials in Argentine Spanish',
          engagement: '+65% trust building',
          privacy: 'Full consent required',
          argentinaCultural: 'Personal recommendations highly valued'
        },
        {
          feature: 'Provider Behind the Scenes',
          description: 'Show day-in-the-life content for trust building',
          engagement: '+30% provider connection',
          privacy: 'Provider consent',
          argentinaCultural: 'Personal connection important'
        },
        {
          feature: 'Community Challenges',
          description: vertical + '-specific challenges and contests',
          engagement: '+85% community engagement',
          privacy: 'Participant consent',
          argentinaCultural: 'Community participation culture'
        }
      ]
    });
  }
  
  function initializeWhatsAppDesign() {
    componentData.set({
      whatsappIntegration: whatsappIntegrationConfig,
      conversationFlows: [
        {
          flow: 'Booking Request',
          steps: [
            'Client sends initial message',
            'Auto-response with available slots',
            'Client selects preferred time',
            'Confirmation with details',
            'Calendar integration'
          ],
          avgResponseTime: '< 5 minutes',
          automationLevel: '80%'
        },
        {
          flow: 'Service Inquiry',
          steps: [
            'Client asks about services',
            'Auto-response with service catalog',
            'Pricing and availability info',
            'Book or request more info',
            'Follow-up scheduling'
          ],
          avgResponseTime: '< 10 minutes',
          automationLevel: '60%'
        },
        {
          flow: 'Post-Service Follow-up',
          steps: [
            'Automated thank you message',
            'Request for feedback/review',
            'Loyalty program information',
            'Next appointment suggestion',
            'Referral program invitation'
          ],
          avgResponseTime: 'Immediate',
          automationLevel: '95%'
        }
      ],
      businessCatalog: {
        services: [
          {
            name: vertical === 'barber' ? 'Corte Clásico' : 
                  vertical === 'psychology' ? 'Consulta Individual' :
                  vertical === 'dentist' ? 'Limpieza Dental' :
                  vertical === 'fitness' ? 'Entrenamiento Personal' :
                  vertical === 'veterinary' ? 'Consulta Veterinaria' :
                  'Tratamiento Facial',
            price: vertical === 'barber' ? '$4,200' :
                   vertical === 'psychology' ? '$5,500' :
                   vertical === 'dentist' ? '$3,800' :
                   vertical === 'fitness' ? '$6,000' :
                   vertical === 'veterinary' ? '$4,500' :
                   '$8,500',
            duration: vertical === 'psychology' ? '50 min' : '45 min',
            image: `service_${vertical}_1.jpg`,
            whatsappBooking: true
          }
        ],
        paymentIntegration: 'MercadoPago link in WhatsApp',
        availability: 'Real-time calendar integration'
      },
      designElements: {
        chatBubbleDesign: 'Argentina green with rounded corners',
        emojiUsage: 'Cultural appropriate emojis',
        messageTemplates: 'Informal but professional tone',
        quickReplies: ['Sí, me interesa', 'Quiero más info', 'Reservar ahora', 'Consultar precio'],
        businessProfile: {
          photo: `${vertical}_business_whatsapp.jpg`,
          description: `${vertical.charAt(0).toUpperCase() + vertical.slice(1)} premium en Argentina`,
          address: 'Buenos Aires, Argentina',
          hours: 'Lun-Sáb 9:00-19:00',
          website: `www.${vertical}pro.com.ar`
        }
      }
    });
  }
  
  function initializeReferralInterface() {
    componentData.set({
      referralProgram: {
        title: '¡Invitá a tus amigos y ganá!',
        subtitle: 'Por cada amigo que reserve, ambos ganan descuentos exclusivos',
        incentives: {
          referrer: {
            immediate: '20% descuento próximo servicio',
            cumulative: 'Servicio gratis cada 5 referidos exitosos',
            special: 'VIP status con 10 referidos'
          },
          referee: {
            immediate: '15% descuento primer servicio',
            special: 'Consulta premium gratis si reserva en 48hs'
          }
        },
        sharingMethods: [
          {
            method: 'WhatsApp',
            usage: 67,
            template: '¡Che! Te recomiendo {servicio} en {lugar}. Usá mi código {codigo} y tenés 15% descuento. ¡Es buenísimo!',
            trackingCode: 'WA_REF_{user_id}'
          },
          {
            method: 'Instagram Stories',
            usage: 45,
            template: 'Sticker with QR code and personal message',
            trackingCode: 'IG_REF_{user_id}'
          },
          {
            method: 'Facebook',
            usage: 35,
            template: 'Personal post with experience sharing',
            trackingCode: 'FB_REF_{user_id}'
          },
          {
            method: 'Direct Link',
            usage: 25,
            template: 'Personal referral link with embedded code',
            trackingCode: 'DL_REF_{user_id}'
          }
        ]
      },
      referralTracking: {
        totalReferrals: 0,
        successfulBookings: 0,
        totalEarnings: 0,
        currentLevel: 'Bronze',
        nextLevelRequirement: '3 more successful referrals',
        leaderboard: [
          { name: 'María G.', referrals: 12, level: 'Gold' },
          { name: 'Carlos M.', referrals: 8, level: 'Silver' },
          { name: 'Sofia R.', referrals: 6, level: 'Silver' }
        ]
      },
      argentinaSocialBehavior: {
        trustFactors: ['Personal recommendation', 'Mutual friends', 'Neighborhood connection'],
        sharingMotivation: ['Help friends', 'Get rewards', 'Build social status'],
        culturalApproach: 'Informal, personal, and community-oriented',
        effectiveMessaging: ['¡Che, tenés que probar!', 'Te va a encantar', 'Confiá en mí']
      }
    });
  }
  
  function initializeCommunityFeatures() {
    const config = verticalSocialConfig[vertical];
    componentData.set({
      communityTypes: config.communityTypes.map(type => ({
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        members: Math.floor(Math.random() * 500) + 100,
        activity: 'High',
        features: ['Discussion posts', 'Event coordination', 'Resource sharing', 'Expert Q&A'],
        argentinaCultural: 'Neighborhood-based connections'
      })),
      communityFeatures: [
        {
          feature: 'Local Neighborhood Groups',
          description: 'Connect with providers and clients in your area',
          engagement: '+60% local bookings',
          argentinaSpecific: 'Barrio-based community building',
          privacy: vertical === 'psychology' ? 'Anonymous participation option' : 'Optional real name'
        },
        {
          feature: 'Experience Sharing',
          description: 'Share and discover service experiences',
          engagement: '+40% trust building',
          argentinaSpecific: 'Personal recommendation culture',
          privacy: 'User-controlled visibility'
        },
        {
          feature: 'Expert Q&A',
          description: 'Direct questions to verified professionals',
          engagement: '+75% provider authority',
          argentinaSpecific: 'Respect for professional expertise',
          privacy: 'Professional verification required'
        },
        {
          feature: 'Event Coordination',
          description: 'Organize group bookings and special events',
          engagement: '+50% group bookings',
          argentinaSpecific: 'Family and friend group activities',
          privacy: 'Group member consent required'
        }
      ],
      gamificationElements: {
        badges: [
          { name: 'Vecino Activo', description: 'Participación regular en comunidad barrial' },
          { name: 'Recomendador Experto', description: '10+ recomendaciones exitosas' },
          { name: 'Cliente VIP', description: 'Cliente frecuente con excelente historial' },
          { name: 'Embajador de Marca', description: 'Promotor activo en redes sociales' }
        ],
        rewards: [
          { achievement: 'Primera reseña', reward: '5% descuento próximo servicio' },
          { achievement: 'Referido exitoso', reward: '15% descuento' },
          { achievement: 'Cliente del mes', reward: 'Servicio premium gratis' },
          { achievement: 'Embajador', reward: 'Acceso VIP exclusivo' }
        ]
      }
    });
  }
  
  function initializeLoyaltyProgram() {
    componentData.set({
      loyaltyTiers: [
        {
          tier: 'Bronce',
          requirements: 'Primera reserva',
          benefits: ['5% descuento', 'Recordatorios WhatsApp', 'Soporte básico'],
          color: '#CD7F32',
          icon: '🥉',
          members: '78%'
        },
        {
          tier: 'Plata',
          requirements: '3 servicios o $15,000 gastos',
          benefits: ['10% descuento', 'Prioridad en reservas', 'Acceso a promociones exclusivas'],
          color: '#C0C0C0',
          icon: '🥈',
          members: '18%'
        },
        {
          tier: 'Oro',
          requirements: '8 servicios o $40,000 gastos',
          benefits: ['15% descuento', 'Servicio VIP', 'Regalos personalizados'],
          color: '#FFD700',
          icon: '🥇',
          members: '3.5%'
        },
        {
          tier: 'Platino',
          requirements: '15 servicios o $75,000 gastos',
          benefits: ['20% descuento', 'Servicio a domicilio', 'Asesor personal'],
          color: '#E5E4E2',
          icon: '👑',
          members: '0.5%'
        }
      ],
      pointsSystem: {
        earning: {
          serviceBooking: '100 puntos por $1,000 gastados',
          referralSuccess: '500 puntos por referido exitoso',
          reviewSubmission: '200 puntos por reseña verificada',
          socialSharing: '50 puntos por compartir en redes'
        },
        redemption: {
          '1000 puntos': '5% descuento',
          '2500 puntos': '10% descuento',
          '5000 puntos': 'Servicio básico gratis',
          '10000 puntos': 'Servicio premium gratis'
        }
      },
      gamificationFeatures: {
        challenges: [
          {
            challenge: 'Mes de Autocuidado',
            description: '2 servicios en el mismo mes',
            reward: '300 puntos extra + 10% descuento próximo',
            timeframe: 'Mensual',
            participation: '45%'
          },
          {
            challenge: 'Amigo del Barrio',
            description: 'Refiere 3 vecinos en un mes',
            reward: 'Servicio gratis + badge especial',
            timeframe: 'Mensual',
            participation: '22%'
          }
        ],
        socialFeatures: {
          leaderboard: 'Ranking mensual de puntos',
          achievements: 'Badges compartibles en redes',
          community: 'Grupo VIP exclusivo para nivel Oro+'
        }
      }
    });
  }
  
  function initializeMarketingTools() {
    componentData.set({
      marketingChannels: [
        {
          channel: 'WhatsApp Business',
          reach: '97% de usuarios argentinos',
          features: ['Broadcast lists', 'Automated responses', 'Catalog sharing'],
          roi: '450% ROI promedio',
          bestPractices: ['Mensajes personalizados', 'Horarios respetando siesta', 'Emojis culturalmente apropiados']
        },
        {
          channel: 'Instagram Marketing',
          reach: '85% usuarios 18-45 años',
          features: ['Stories promocionales', 'Reels de transformación', 'IGTV educativo'],
          roi: '320% ROI promedio',
          bestPractices: ['Contenido visual atractivo', 'Hashtags locales', 'Colaboraciones con influencers']
        },
        {
          channel: 'Google My Business',
          reach: '95% búsquedas locales',
          features: ['Reseñas gestionadas', 'Posts promocionales', 'Q&A automatizada'],
          roi: '280% ROI promedio',
          bestPractices: ['Fotos de calidad', 'Respuesta rápida a reseñas', 'Info actualizada']
        },
        {
          channel: 'Facebook Community',
          reach: '78% usuarios +25 años',
          features: ['Grupos comunitarios', 'Eventos promocionales', 'Ads segmentados'],
          roi: '200% ROI promedio',
          bestPractices: ['Contenido educativo', 'Engagement genuino', 'Segmentación por barrio']
        }
      ],
      automatedCampaigns: {
        'New Client Welcome': {
          trigger: 'First booking completed',
          channels: ['WhatsApp', 'Email'],
          content: 'Welcome message + loyalty program invitation',
          conversion: '78%'
        },
        'Re-engagement': {
          trigger: '30 days no activity',
          channels: ['WhatsApp', 'Instagram DM'],
          content: 'Personalized offer + what\'s new',
          conversion: '34%'
        },
        'Referral Activation': {
          trigger: 'High satisfaction score',
          channels: ['WhatsApp', 'App notification'],
          content: 'Referral program invitation with incentive',
          conversion: '56%'
        }
      },
      providerTools: [
        {
          tool: 'Content Creation Assistant',
          description: 'AI-powered content suggestions for social media',
          features: ['Photo editing', 'Caption generation', 'Hashtag optimization'],
          argentinaOptimized: 'Spanish content + local trends'
        },
        {
          tool: 'Client Communication Hub',
          description: 'Centralized client communication management',
          features: ['WhatsApp integration', 'Automated responses', 'Follow-up scheduling'],
          argentinaOptimized: 'Cultural communication patterns'
        },
        {
          tool: 'Reputation Management',
          description: 'Monitor and respond to online reviews',
          features: ['Review alerts', 'Response templates', 'Rating analytics'],
          argentinaOptimized: 'Spanish sentiment analysis'
        },
        {
          tool: 'Local SEO Optimizer',
          description: 'Improve local search visibility',
          features: ['Keyword optimization', 'Local citations', 'Google My Business optimization'],
          argentinaOptimized: 'Argentina search patterns'
        }
      ]
    });
  }
  
  function handleSocialAction(action: string, data: any = {}) {
    dispatch('socialAction', { action, data, platform: selectedSocialPlatform });
  }
  
  function activateReferral(referrerData: any) {
    dispatch('referralActivation', { 
      referrer: referrerData.referrer, 
      referee: referrerData.referee, 
      vertical 
    });
  }
  
  function integratePlatform(platform: string, configuration: any) {
    dispatch('whatsappIntegration', { feature: platform, configuration });
  }
  
  $: currentData = $componentData;
  $: metrics = $socialMetrics;
</script>

<div class="social-features-optimizer">
  
  {#if variant === 'social-features'}
    <!-- Social Features Overview -->
    <div class="social-overview bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Social Features & Engagement</h2>
          <p class="text-gray-600">Optimized for Argentina social behavior and {vertical} vertical</p>
        </div>
        <div class="flex items-center space-x-3">
          <span class="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            🇦🇷 Argentina Optimized
          </span>
          <span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            4.8/5 Satisfaction
          </span>
        </div>
      </div>
      
      <!-- Platform Usage Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {#each currentData.socialPlatforms || [] as platform}
          <div class="platform-card bg-gradient-to-br from-white to-gray-50 rounded-lg p-6 border border-gray-200 shadow-md">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-900">{platform.platform}</h3>
              <span class="text-sm px-2 py-1 rounded-full"
                    class:bg-red-100={platform.priority === 'Critical'}
                    class:text-red-700={platform.priority === 'Critical'}
                    class:bg-yellow-100={platform.priority === 'High'}
                    class:text-yellow-700={platform.priority === 'High'}
                    class:bg-blue-100={platform.priority === 'Medium'}
                    class:text-blue-700={platform.priority === 'Medium'}>
                {platform.priority}
              </span>
            </div>
            <div class="text-3xl font-bold text-blue-600 mb-2">{platform.usage}%</div>
            <p class="text-sm text-gray-600 mb-3">{platform.argentinaSpecific}</p>
            <div class="space-y-1">
              {#each platform.features.slice(0, 2) as feature}
                <div class="text-xs text-gray-500">• {feature}</div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Engagement Features -->
      <div class="engagement-features">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Social Engagement Features</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {#each currentData.engagementFeatures || [] as feature}
            <div class="feature-card bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div class="flex items-start justify-between mb-4">
                <h4 class="font-semibold text-gray-900">{feature.feature}</h4>
                <span class="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {feature.engagement}
                </span>
              </div>
              <p class="text-gray-600 mb-4">{feature.description}</p>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Privacy:</span>
                  <span class="font-medium">{feature.privacy}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Argentina Cultural:</span>
                  <span class="font-medium text-blue-600">{feature.argentinaCultural}</span>
                </div>
              </div>
              <button 
                class="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                on:click={() => handleSocialAction('activate_feature', feature)}
              >
                Activate Feature
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
  {:else if variant === 'whatsapp-design'}
    <!-- WhatsApp Integration Design -->
    <div class="whatsapp-design bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">WhatsApp Business Integration</h2>
          <p class="text-gray-600">97% Argentina usage • Primary communication channel</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-2xl">📱</span>
          <span class="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            67% Preferred Channel
          </span>
        </div>
      </div>
      
      <!-- Message Templates -->
      <div class="message-templates mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Automated Message Templates</h3>
        <div class="space-y-4">
          {#each Object.entries(currentData.whatsappIntegration?.messageTemplates || {}) as [templateType, template]}
            <div class="template-card bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-gray-900 capitalize">{templateType.replace(/_/g, ' ')}</h4>
                <button class="text-blue-600 hover:text-blue-800 text-sm">Edit Template</button>
              </div>
              <div class="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                <p class="text-sm text-gray-800 italic">"{template.template}"</p>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each template.variables as variable}
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {variable}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Conversation Flows -->
      <div class="conversation-flows mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Conversation Flows</h3>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {#each currentData.conversationFlows || [] as flow}
            <div class="flow-card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 class="font-semibold text-gray-900 mb-4">{flow.flow}</h4>
              <div class="space-y-2 mb-4">
                {#each flow.steps as step, index}
                  <div class="flex items-center space-x-3">
                    <div class="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span class="text-sm text-gray-700">{step}</span>
                  </div>
                {/each}
              </div>
              <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div class="text-sm font-semibold text-gray-900">{flow.avgResponseTime}</div>
                  <div class="text-xs text-gray-600">Avg Response</div>
                </div>
                <div>
                  <div class="text-sm font-semibold text-green-600">{flow.automationLevel}</div>
                  <div class="text-xs text-gray-600">Automated</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Business Catalog Design -->
      <div class="business-catalog">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">WhatsApp Business Catalog</h3>
        <div class="catalog-preview bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-6">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
              {vertical === 'barber' ? '✂️' : 
               vertical === 'psychology' ? '🧠' :
               vertical === 'dentist' ? '🦷' :
               vertical === 'fitness' ? '💪' :
               vertical === 'veterinary' ? '🐕' : '💄'}
            </div>
            <div>
              <h4 class="font-bold text-gray-900">{vertical.charAt(0).toUpperCase() + vertical.slice(1)}Pro Buenos Aires</h4>
              <p class="text-sm text-gray-600">{currentData.designElements?.businessProfile?.description}</p>
              <p class="text-xs text-gray-500">{currentData.designElements?.businessProfile?.hours}</p>
            </div>
          </div>
          
          {#each currentData.businessCatalog?.services || [] as service}
            <div class="service-item bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-4">
              <div class="flex justify-between items-start">
                <div>
                  <h5 class="font-semibold text-gray-900">{service.name}</h5>
                  <p class="text-sm text-gray-600">{service.duration}</p>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-green-600">{service.price}</div>
                  <button class="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600">
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          {/each}
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h5 class="font-medium text-blue-900 mb-2">Automated Features</h5>
            <div class="space-y-1 text-sm text-blue-800">
              <div>✓ {currentData.businessCatalog?.paymentIntegration}</div>
              <div>✓ {currentData.businessCatalog?.availability}</div>
              <div>✓ Respuestas automáticas culturalmente adaptadas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  {:else if variant === 'referral-interface'}
    <!-- Referral Program Interface -->
    <div class="referral-interface bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900">{currentData.referralProgram?.title}</h2>
        <p class="text-gray-600 text-lg">{currentData.referralProgram?.subtitle}</p>
      </div>
      
      <!-- Incentives Overview -->
      <div class="incentives-grid grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div class="referrer-incentives bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🎁 Para Vos (quien refiere)</h3>
          <div class="space-y-3">
            {#each Object.entries(currentData.referralProgram?.incentives?.referrer || {}) as [type, reward]}
              <div class="reward-item flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm">
                    {type === 'immediate' ? '⚡' : type === 'cumulative' ? '🏆' : '👑'}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-800">{reward}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="referee-incentives bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🎉 Para tu Amigo</h3>
          <div class="space-y-3">
            {#each Object.entries(currentData.referralProgram?.incentives?.referee || {}) as [type, reward]}
              <div class="reward-item flex items-center space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm">
                    {type === 'immediate' ? '🎁' : '⭐'}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-800">{reward}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Sharing Methods -->
      <div class="sharing-methods mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">¿Cómo querés compartir?</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {#each currentData.referralProgram?.sharingMethods || [] as method}
            <button 
              class="sharing-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all text-center"
              on:click={() => handleSocialAction('share_referral', method)}
            >
              <div class="text-3xl mb-3">
                {method.method === 'WhatsApp' ? '📱' :
                 method.method === 'Instagram Stories' ? '📸' :
                 method.method === 'Facebook' ? '👥' : '🔗'}
              </div>
              <h4 class="font-semibold text-gray-900 mb-2">{method.method}</h4>
              <div class="text-sm text-blue-600 font-medium mb-2">{method.usage}% de argentinos</div>
              <div class="text-xs text-gray-600 italic">"{method.template.substring(0, 50)}..."</div>
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Referral Tracking -->
      <div class="referral-tracking bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Tu Progreso de Referidos</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {#each Object.entries(currentData.referralTracking || {}).slice(0, 4) as [metric, value]}
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 mb-1">{value}</div>
              <div class="text-sm text-gray-600 capitalize">
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="level-progress bg-white rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-900">Nivel Actual: {currentData.referralTracking?.currentLevel}</span>
            <span class="text-sm text-gray-600">{currentData.referralTracking?.nextLevelRequirement}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-purple-600 h-2 rounded-full" style="width: 65%"></div>
          </div>
        </div>
      </div>
      
      <!-- Argentina Cultural Context -->
      <div class="cultural-context bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🇦🇷 Argentina Referral Culture</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 class="font-medium text-gray-700 mb-2">Trust Factors</h5>
            <div class="space-y-1">
              {#each currentData.argentinaSocialBehavior?.trustFactors || [] as factor}
                <div class="text-sm text-gray-600">• {factor}</div>
              {/each}
            </div>
          </div>
          <div>
            <h5 class="font-medium text-gray-700 mb-2">Sharing Motivation</h5>
            <div class="space-y-1">
              {#each currentData.argentinaSocialBehavior?.sharingMotivation || [] as motivation}
                <div class="text-sm text-gray-600">• {motivation}</div>
              {/each}
            </div>
          </div>
          <div>
            <h5 class="font-medium text-gray-700 mb-2">Effective Messaging</h5>
            <div class="space-y-1">
              {#each currentData.argentinaSocialBehavior?.effectiveMessaging || [] as message}
                <div class="text-sm text-blue-600 italic">"{message}"</div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
    
  {:else if variant === 'loyalty-program'}
    <!-- Loyalty Program with Gamification -->
    <div class="loyalty-program bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900">Programa de Lealtad Premium</h2>
        <p class="text-gray-600">Gamificación y recompensas diseñadas para Argentina</p>
      </div>
      
      <!-- Loyalty Tiers -->
      <div class="loyalty-tiers grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {#each currentData.loyaltyTiers || [] as tier}
          <div class="tier-card bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 shadow-lg"
               style="border-color: {tier.color}">
            <div class="text-center mb-4">
              <div class="text-4xl mb-2">{tier.icon}</div>
              <h3 class="font-bold text-gray-900 mb-1">{tier.tier}</h3>
              <p class="text-xs text-gray-600">{tier.members} de usuarios</p>
            </div>
            
            <div class="requirements bg-gray-50 rounded-lg p-3 mb-4">
              <h5 class="text-xs font-semibold text-gray-700 mb-1">REQUISITOS</h5>
              <p class="text-sm text-gray-600">{tier.requirements}</p>
            </div>
            
            <div class="benefits space-y-2">
              <h5 class="text-xs font-semibold text-gray-700">BENEFICIOS</h5>
              {#each tier.benefits as benefit}
                <div class="flex items-center space-x-2">
                  <span class="text-green-500 text-xs">✓</span>
                  <span class="text-sm text-gray-700">{benefit}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Points System -->
      <div class="points-system grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="earning-points bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">💰 Cómo Ganar Puntos</h3>
          <div class="space-y-3">
            {#each Object.entries(currentData.pointsSystem?.earning || {}) as [action, points]}
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-700 capitalize">
                  {action.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span class="font-semibold text-green-600">{points}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="redeeming-points bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🎁 Cómo Canjear Puntos</h3>
          <div class="space-y-3">
            {#each Object.entries(currentData.pointsSystem?.redemption || {}) as [points, reward]}
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-700">{points}</span>
                <span class="font-semibold text-blue-600">{reward}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Active Challenges -->
      <div class="challenges mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🏆 Desafíos Activos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each currentData.gamificationFeatures?.challenges || [] as challenge}
            <div class="challenge-card bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">{challenge.challenge}</h4>
                <span class="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  {challenge.participation} participación
                </span>
              </div>
              <p class="text-gray-600 mb-4">{challenge.description}</p>
              <div class="reward bg-white rounded-lg p-3 mb-3">
                <h5 class="text-sm font-semibold text-gray-700 mb-1">Recompensa:</h5>
                <p class="text-sm text-green-600">{challenge.reward}</p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">{challenge.timeframe}</span>
                <button class="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600">
                  Participar
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Social Features -->
      <div class="social-gamification bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">👥 Social Gamification</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {#each Object.entries(currentData.gamificationFeatures?.socialFeatures || {}) as [feature, description]}
            <div class="social-feature text-center">
              <div class="text-3xl mb-2">
                {feature === 'leaderboard' ? '🏆' :
                 feature === 'achievements' ? '🏅' : '👑'}
              </div>
              <h5 class="font-medium text-gray-900 mb-2 capitalize">{feature}</h5>
              <p class="text-sm text-gray-600">{description}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .social-features-optimizer {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .platform-card {
    transition: all 0.3s ease;
  }
  
  .platform-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }
  
  .feature-card {
    transition: all 0.2s ease;
  }
  
  .feature-card:hover {
    transform: translateY(-2px);
  }
  
  .template-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  }
  
  .sharing-card {
    transition: all 0.3s ease;
  }
  
  .sharing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    border-color: #3b82f6;
  }
  
  .tier-card {
    transition: all 0.3s ease;
  }
  
  .tier-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
  }
  
  .challenge-card {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }
  
  .flow-card {
    transition: all 0.2s ease;
  }
  
  .flow-card:hover {
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }
</style>