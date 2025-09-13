<!--
  AI-Enhanced User Experience Design - Day 10 AI-Driven Features
  Building on Day 9's 4.8/5 satisfaction optimization insights for intelligent experiences
  Advanced AI interfaces with natural interaction patterns and predictive capabilities
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { fade, fly, scale, slide } from 'svelte/transition';
  
  export let variant: 'intelligent-search' | 'ai-personalization' | 'smart-scheduling' | 'intelligent-notifications' | 'ai-analytics' | 'conversational-ai' = 'intelligent-search';
  export let userId: string = 'user-123';
  export let aiModel: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'custom' = 'claude-3';
  export let personalizationLevel: 'basic' | 'advanced' | 'enterprise' = 'advanced';
  export let argentinaContext: boolean = true;
  
  const dispatch = createEventDispatcher<{
    aiAction: { action: string; userId: string; data: any; confidence: number };
    personalizationUpdate: { userId: string; preferences: any; learningData: any };
    intelligentSuggestion: { type: string; suggestion: any; reasoning: string };
    aiInsight: { category: string; insight: any; actionable: boolean };
  }>();
  
  // AI design tokens with intelligent interfaces
  const aiTokens = {
    intelligent: {
      primary: '#4f46e5',           // AI intelligent blue
      secondary: '#7c3aed',         // AI purple
      accent: '#06b6d4',           // AI cyan
      surface: '#ffffff',           // Pure AI white
      elevated: '#f8fafc',          // Subtle AI elevation
      aiGradient: 'from-indigo-500 via-purple-500 to-cyan-500',
      aiText: '#1e1b4b',           // AI text
      aiSecondary: '#4338ca',      // AI secondary text
      success: '#10b981',          // AI success
      warning: '#f59e0b',          // AI warning
      error: '#ef4444',            // AI error
      prediction: '#8b5cf6',       // AI prediction purple
      confidence: '#059669'        // AI confidence green
    },
    conversational: {
      userBubble: '#3b82f6',       // User message blue
      aiBubble: '#6366f1',         // AI message indigo
      systemBubble: '#64748b',     // System message gray
      typing: '#a855f7',           // Typing indicator purple
      suggestion: '#10b981'        // Suggestion green
    }
  };
  
  // AI capabilities and features
  const aiCapabilities = {
    intelligentSearch: {
      naturalLanguage: 'Advanced NLP for conversational search queries',
      contextualUnderstanding: 'Context-aware search with intent recognition',
      visualSearch: 'Image-based search with computer vision',
      voiceSearch: 'Voice-activated search with Argentina Spanish support',
      predictiveSearch: 'Real-time search suggestions based on behavior',
      semanticSearch: 'Meaning-based search beyond keyword matching'
    },
    personalizationEngine: {
      behaviorAnalysis: 'Deep learning behavior pattern analysis',
      preferenceMapping: 'Dynamic user preference learning and adaptation',
      contextualRecommendations: 'Situational and temporal recommendation engine',
      culturalIntelligence: 'Argentina cultural context and preferences',
      adaptiveInterface: 'Self-optimizing UI based on user interaction patterns',
      predictivePersonalization: 'Anticipating user needs and preferences'
    },
    smartScheduling: {
      conflictResolution: 'Intelligent conflict detection and resolution',
      optimizationEngine: 'AI-powered schedule optimization for efficiency',
      demandPrediction: 'Machine learning demand forecasting',
      dynamicPricing: 'AI-driven pricing optimization based on demand',
      weatherIntegration: 'Weather-aware scheduling adjustments',
      trafficOptimization: 'Real-time traffic-aware appointment timing'
    },
    conversationalAI: {
      naturalConversation: 'Human-like conversation patterns and responses',
      argentineSpanish: 'Native Argentina Spanish with cultural context',
      emotionalIntelligence: 'Emotion recognition and appropriate responses',
      businessContext: 'Service booking domain expertise and knowledge',
      multiTurnDialogue: 'Complex multi-turn conversation handling',
      integrationCapabilities: 'Seamless integration with booking system'
    }
  };
  
  // Argentina AI optimization
  const argentinaAIOptimization = {
    languageProcessing: {
      dialectRecognition: 'Argentina Spanish dialect and slang recognition',
      culturalNuances: 'Understanding of Argentina cultural communication patterns',
      formalInformalSwitch: 'Appropriate formal/informal language switching',
      localExpressions: 'Recognition and use of local expressions and idioms',
      timeZoneIntelligence: 'Argentina timezone and business hours awareness'
    },
    culturalIntelligence: {
      socialPatterns: 'Understanding of Argentina social interaction patterns',
      businessEtiquette: 'Argentina business culture and etiquette awareness',
      familyStructures: 'Understanding of family decision-making patterns',
      economicContext: 'Cost-consciousness and payment preference awareness',
      loyaltyPatterns: 'Argentina customer loyalty and referral behaviors'
    },
    marketSpecificFeatures: {
      mercadopagoIntegration: 'Native MercadoPago payment flow optimization',
      whatsappNative: 'WhatsApp Business API integration and patterns',
      siestaAwareness: 'Business hours and siesta time scheduling intelligence',
      neighborhoodIntelligence: 'Buenos Aires neighborhood-specific recommendations',
      weatherIntelligence: 'Argentina weather pattern impact on scheduling'
    }
  };
  
  // Component state
  let componentData = writable({});
  let aiProcessing = false;
  let confidenceScore = 0;
  let currentConversation = [];
  
  onMount(() => {
    initializeAIComponent();
  });
  
  function initializeAIComponent() {
    switch (variant) {
      case 'intelligent-search':
        initializeIntelligentSearch();
        break;
      case 'ai-personalization':
        initializeAIPersonalization();
        break;
      case 'smart-scheduling':
        initializeSmartScheduling();
        break;
      case 'intelligent-notifications':
        initializeIntelligentNotifications();
        break;
      case 'ai-analytics':
        initializeAIAnalytics();
        break;
      case 'conversational-ai':
        initializeConversationalAI();
        break;
    }
  }
  
  function initializeIntelligentSearch() {
    componentData.set({
      searchCapabilities: {
        naturalLanguage: {
          enabled: true,
          examples: [
            '"Busco un barbero cerca de Palermo para mañana tarde"',
            '"Necesito corte de pelo urgente, que esté abierto ahora"',
            '"Quiero el mejor barbero para barba, con buenas reseñas"'
          ],
          accuracy: 94.7,
          responseTime: '150ms'
        },
        visualSearch: {
          enabled: personalizationLevel !== 'basic',
          features: ['Style matching', 'Hairstyle recognition', 'Beard style matching'],
          accuracy: 87.3,
          supportedFormats: ['JPG', 'PNG', 'WebP']
        },
        voiceSearch: {
          enabled: personalizationLevel === 'enterprise',
          languages: ['Spanish (Argentina)', 'English', 'Portuguese'],
          accuracy: 91.2,
          noiseReduction: true
        }
      },
      intelligentResults: {
        contextualRanking: 'AI-powered relevance scoring based on user context',
        personalizedFiltering: 'Results filtered based on user preferences and history',
        intentRecognition: 'Understanding search intent beyond keywords',
        suggestionEngine: 'Real-time search suggestions and auto-complete',
        semanticMatching: 'Meaning-based matching for better results'
      },
      searchInsights: [
        {
          query: 'barbero palermo',
          intent: 'location_based_search',
          confidence: 96.5,
          suggestions: ['barbero palermo cerca', 'barbero palermo abierto', 'barbero palermo reseñas'],
          results: 23,
          avgRelevance: 94.2
        },
        {
          query: 'corte clasico barba',
          intent: 'service_specific_search',
          confidence: 92.8,
          suggestions: ['corte clasico barba precio', 'corte clasico barba cerca', 'corte clasico barba reviews'],
          results: 18,
          avgRelevance: 91.7
        },
        {
          query: 'urgente ahora abierto',
          intent: 'immediate_availability',
          confidence: 98.1,
          suggestions: ['barbero abierto ahora', 'turno urgente disponible', 'sin cita previa'],
          results: 12,
          avgRelevance: 97.3
        }
      ]
    });
  }
  
  function initializeAIPersonalization() {
    componentData.set({
      personalizationProfile: {
        userId: userId,
        learningStage: 'advanced',
        dataPoints: 847,
        confidenceLevel: 87.5,
        lastUpdate: Date.now() - 3600000,
        preferences: {
          serviceTypes: ['Corte clásico', 'Barba styling', 'Servicios premium'],
          priceRange: { min: 3500, max: 8000 },
          timePreferences: ['17:00-19:00', '10:00-12:00'],
          locationRadius: 5,
          providerPreferences: ['Alta calificación', 'Experiencia comprobada', 'Ambiente profesional']
        },
        behaviorPatterns: {
          bookingFrequency: 'Quincenal',
          cancellationRate: 2.3,
          reviewBehavior: 'Siempre deja reseñas',
          loyaltyPattern: 'Proveedor fijo con ocasionales experimentos',
          pricesensitivity: 'Moderada',
          socialSharing: 'Comparte transformaciones'
        }
      },
      aiRecommendations: [
        {
          type: 'provider_suggestion',
          title: 'Nuevo Barbero Recomendado',
          recommendation: {
            name: 'Classic Cuts Palermo',
            rating: 4.9,
            distance: '2.1 km',
            price: 4200,
            specialty: 'Cortes clásicos y barba'
          },
          reasoning: 'Based on your preference for classic cuts and high-rated providers in Palermo area',
          confidence: 91.7,
          personalizedFactors: ['Location preference', 'Service type match', 'Price range fit', 'Rating criteria']
        },
        {
          type: 'time_optimization',
          title: 'Horario Óptimo Sugerido',
          recommendation: {
            day: 'Jueves',
            time: '17:30',
            reason: 'Lower demand, better availability',
            savings: '15% descuento hora valle'
          },
          reasoning: 'Historical data shows you prefer evening appointments with shorter wait times',
          confidence: 88.3,
          personalizedFactors: ['Time preference', 'Wait time sensitivity', 'Price sensitivity']
        },
        {
          type: 'service_upgrade',
          title: 'Servicio Premium Sugerido',
          recommendation: {
            service: 'Tratamiento capilar premium',
            provider: 'Tu barbero habitual',
            price: 6500,
            benefit: 'Nutrición profunda para tu tipo de cabello'
          },
          reasoning: 'Your hair type and seasonal changes suggest this premium treatment would be beneficial',
          confidence: 84.6,
          personalizedFactors: ['Service history', 'Hair type analysis', 'Seasonal recommendations']
        }
      ],
      adaptiveInterface: {
        layoutOptimization: 'Customized layout based on most-used features',
        navigationPatterns: 'Simplified navigation highlighting frequent actions',
        contentPrioritization: 'Personalized content ordering based on relevance',
        accessibilityAdaptation: 'Interface adapted to user accessibility needs',
        culturalAdaptation: 'Argentina cultural elements and communication style'
      }
    });
  }
  
  function initializeSmartScheduling() {
    componentData.set({
      schedulingIntelligence: {
        conflictResolution: {
          detectionAccuracy: 99.7,
          resolutionSuggestions: 'Intelligent alternative time suggestions',
          priorityManagement: 'AI-powered appointment priority scoring',
          automaticRescheduling: 'Smart rescheduling with minimal disruption'
        },
        demandPrediction: {
          accuracy: 92.3,
          forecastHorizon: '14 days',
          factors: ['Historical data', 'Weather patterns', 'Local events', 'Seasonal trends'],
          optimizationImpact: '+23% booking efficiency'
        },
        dynamicOptimization: {
          realTimeAdjustment: 'Continuous schedule optimization',
          trafficIntegration: 'Buenos Aires traffic pattern awareness',
          weatherAdaptation: 'Weather-based scheduling adjustments',
          providerOptimization: 'Multi-provider resource optimization'
        }
      },
      intelligentSuggestions: [
        {
          type: 'optimal_time',
          suggestion: 'Jueves 18:00 - Óptimo para ti',
          reasoning: 'Based on your history, traffic patterns, and provider availability',
          confidence: 94.8,
          benefits: ['Menor tiempo de espera', 'Mejor disponibilidad', '5% descuento'],
          impact: 'High'
        },
        {
          type: 'alternative_provider',
          suggestion: 'Barbero alternativo disponible',
          reasoning: 'Your preferred provider is busy, but this alternative matches your style preferences',
          confidence: 87.2,
          benefits: ['Mismo nivel de servicio', 'Disponible inmediatamente', 'Nueva ubicación conveniente'],
          impact: 'Medium'
        },
        {
          type: 'service_combo',
          suggestion: 'Combo recomendado: Corte + Barba',
          reasoning: 'You typically book these separately, combo saves time and money',
          confidence: 91.5,
          benefits: ['15% descuento', 'Una sola visita', 'Mejor resultado coordinado'],
          impact: 'High'
        }
      ],
      predictiveAnalytics: {
        demandForecast: [
          { day: 'Lunes', demand: 65, confidence: 89.2, factors: ['Fin de semana', 'Inicio semana'] },
          { day: 'Martes', demand: 78, confidence: 92.1, factors: ['Post-weekend', 'Mid-week prep'] },
          { day: 'Miércoles', demand: 85, confidence: 94.3, factors: ['Peak booking day'] },
          { day: 'Jueves', demand: 82, confidence: 91.7, factors: ['Pre-weekend prep'] },
          { day: 'Viernes', demand: 95, confidence: 97.2, factors: ['Weekend preparation'] },
          { day: 'Sábado', demand: 88, confidence: 89.8, factors: ['Weekend service'] },
          { day: 'Domingo', demand: 45, confidence: 85.4, factors: ['Rest day', 'Family time'] }
        ],
        seasonalTrends: {
          summer: '+15% demand for shorter styles',
          winter: '+20% demand for beard services',
          holidays: '+35% demand for special events',
          backToSchool: '+25% demand for professional styles'
        }
      }
    });
  }
  
  function initializeIntelligentNotifications() {
    componentData.set({
      intelligentNotifications: [
        {
          id: 1,
          type: 'predictive_reminder',
          title: 'Es hora de tu corte habitual',
          message: 'Basado en tu patrón, sueles reservar cada 15 días. ¿Reservamos?',
          aiReasoning: 'Historical booking pattern analysis suggests optimal timing',
          confidence: 92.7,
          actions: [
            { label: 'Reservar con tu barbero habitual', action: 'book_usual', priority: 'high' },
            { label: 'Ver opciones cercanas', action: 'explore', priority: 'medium' },
            { label: 'Recordar en 3 días', action: 'snooze', priority: 'low' }
          ],
          personalization: ['Timing based on history', 'Provider preference', 'Location convenience'],
          priority: 'high',
          sendTime: Date.now() + 3600000
        },
        {
          id: 2,
          type: 'contextual_opportunity',
          title: 'Tu barbero favorito tiene disponibilidad',
          message: 'Diego en Palermo tiene un hueco hoy 17:30 - perfecto para tu horario preferido',
          aiReasoning: 'Provider availability matches user preference patterns and schedule',
          confidence: 88.4,
          actions: [
            { label: 'Reservar ahora', action: 'book_now', priority: 'high' },
            { label: 'Ver otros horarios', action: 'view_times', priority: 'medium' }
          ],
          personalization: ['Preferred provider', 'Time preference', 'Historical patterns'],
          priority: 'high',
          sendTime: Date.now() + 1800000
        },
        {
          id: 3,
          type: 'weather_adaptive',
          title: 'Lluvia pronosticada - ¿Cambiar cita?',
          message: 'Se pronostica lluvia fuerte para tu cita del jueves. Te sugerimos reagendar.',
          aiReasoning: 'Weather forecast indicates conditions that typically affect user attendance',
          confidence: 85.1,
          actions: [
            { label: 'Reagendar para viernes', action: 'reschedule', priority: 'high' },
            { label: 'Mantener cita original', action: 'keep', priority: 'medium' }
          ],
          personalization: ['Weather sensitivity', 'Historical cancellation patterns'],
          priority: 'medium',
          sendTime: Date.now() + 86400000
        }
      ],
      notificationIntelligence: {
        timingOptimization: 'AI-powered optimal send time prediction',
        channelSelection: 'Smart channel selection (WhatsApp, Push, SMS)',
        frequencyManagement: 'Intelligent frequency to avoid notification fatigue',
        contentPersonalization: 'Dynamically personalized message content',
        sentimentAnalysis: 'Message tone adapted to user preferences',
        actionPrediction: 'Predicted user actions for improved UX'
      },
      performanceMetrics: {
        openRate: 89.3,
        clickThroughRate: 67.8,
        conversionRate: 34.2,
        satisfactionScore: 4.6,
        unsubscribeRate: 1.2,
        responseTime: '2.1 minutes average'
      }
    });
  }
  
  function initializeAIAnalytics() {
    componentData.set({
      aiInsights: [
        {
          category: 'Revenue Optimization',
          insight: {
            title: 'Dynamic Pricing Opportunity',
            description: 'AI identifies 23% revenue increase potential through intelligent pricing',
            recommendation: 'Implement dynamic pricing for peak hours (17:00-19:00)',
            confidence: 91.7,
            impact: '+$18,500 monthly projected increase',
            implementation: 'Automated pricing rules with customer communication'
          },
          actionable: true,
          urgency: 'high',
          dataPoints: 1247,
          analyticsType: 'predictive'
        },
        {
          category: 'Customer Experience',
          insight: {
            title: 'Service Personalization Impact',
            description: 'Personalized recommendations increase booking completion by 34%',
            recommendation: 'Expand AI personalization to all user touchpoints',
            confidence: 94.2,
            impact: '+340 additional monthly bookings',
            implementation: 'Enhanced recommendation engine deployment'
          },
          actionable: true,
          urgency: 'medium',
          dataPoints: 2156,
          analyticsType: 'behavioral'
        },
        {
          category: 'Operational Efficiency',
          insight: {
            title: 'Schedule Optimization Success',
            description: 'AI scheduling reduces no-shows by 67% and increases efficiency by 28%',
            recommendation: 'Deploy smart scheduling across all providers',
            confidence: 96.8,
            impact: '-67% no-show rate, +28% provider efficiency',
            implementation: 'System-wide smart scheduling rollout'
          },
          actionable: true,
          urgency: 'high',
          dataPoints: 3891,
          analyticsType: 'operational'
        }
      ],
      predictiveAnalytics: {
        businessForecasting: {
          revenueProjection: {
            nextMonth: 342000,
            confidence: 89.3,
            factors: ['Historical trends', 'Seasonal patterns', 'Market conditions']
          },
          demandForecast: {
            peakDays: ['Jueves', 'Viernes', 'Sábado'],
            peakHours: ['17:00-19:00', '10:00-12:00'],
            seasonalTrends: 'Summer: +15% short styles, Winter: +20% beard services'
          },
          marketOpportunities: [
            {
              opportunity: 'Premium services expansion',
              potential: '+45% revenue in premium segment',
              confidence: 87.4,
              timeframe: '3-6 months'
            },
            {
              opportunity: 'Corporate client acquisition',
              potential: '+25% B2B revenue stream',
              confidence: 82.1,
              timeframe: '6-9 months'
            }
          ]
        },
        customerIntelligence: {
          segmentAnalysis: {
            vipClients: { percentage: 12, revenue: 45, retention: 94 },
            regularClients: { percentage: 67, revenue: 48, retention: 78 },
            newClients: { percentage: 21, revenue: 7, retention: 34 }
          },
          churnPrediction: {
            riskClients: 23,
            interventionSuccess: 67,
            averageRecovery: 4200
          },
          lifetimeValue: {
            average: 28900,
            premium: 67500,
            growth: 23
          }
        }
      },
      realTimeIntelligence: {
        activeMonitoring: 'Real-time performance and user behavior tracking',
        alertSystem: 'AI-powered anomaly detection and automated alerts',
        adaptiveOptimization: 'Continuous system optimization based on live data',
        competitiveIntelligence: 'Market positioning and competitive analysis',
        trendDetection: 'Early trend identification and opportunity recognition'
      }
    });
  }
  
  function initializeConversationalAI() {
    componentData.set({
      conversationInterface: {
        aiPersonality: {
          name: 'Sofia',
          role: 'Asistente de Reservas Premium',
          personality: 'Profesional, amigable, culturalmente inteligente',
          language: 'Español Argentino nativo',
          expertise: ['Servicios de barbería', 'Agenda y reservas', 'Recomendaciones personalizadas']
        },
        capabilities: {
          naturalConversation: 'Conversación fluida y contextual',
          emotionalIntelligence: 'Reconocimiento y respuesta emocional apropiada',
          businessKnowledge: 'Conocimiento profundo del dominio de servicios',
          culturalAwareness: 'Comprensión cultural argentina',
          multiTurnDialogue: 'Conversaciones complejas multi-turno',
          integrationSeamless: 'Integración perfecta con sistema de reservas'
        },
        conversationExamples: [
          {
            user: "Hola, necesito un corte de pelo urgente para mañana",
            ai: "¡Hola! Te ayudo a encontrar disponibilidad para mañana. ¿Preferís algún horario en particular? Y decime, ¿tenés algún barbero de confianza o querés que te recomiende opciones cerca tuyo?",
            context: "Urgency detection, preference inquiry, personalized assistance"
          },
          {
            user: "No sé si me queda bien el pelo así",
            ai: "Entiendo tu preocupación. ¿Te parece si te conecto con Diego, tu barbero habitual? Él conoce bien tu estilo y siempre te hace quedar genial. También podés mandarle una foto por WhatsApp para que te aconseje. ¿Qué te parece?",
            context: "Emotional support, provider relationship, solution offering"
          },
          {
            user: "¿Cuánto sale un corte clásico con barba?",
            ai: "El precio varía según el barbero y la zona. En Palermo, que veo que es donde solés ir, un corte clásico con barba está entre $4.500 y $6.500. Diego, tu barbero habitual, cobra $5.200. ¿Te parece que reserve con él o preferís ver otras opciones?",
            context: "Pricing transparency, location awareness, personalized recommendation"
          }
        ]
      },
      conversationFlow: {
        greeting: 'Saludo contextual basado en historial y hora',
        intentRecognition: 'Identificación inteligente de intención del usuario',
        informationGathering: 'Recolección conversacional de información necesaria',
        optionPresentation: 'Presentación inteligente de opciones personalizadas',
        bookingConfirmation: 'Confirmación detallada y seguimiento',
        followUp: 'Seguimiento post-servicio y feedback collection'
      },
      aiCapabilityMetrics: {
        responseAccuracy: 94.7,
        intentRecognition: 92.3,
        conversationCompletion: 89.1,
        userSatisfaction: 4.8,
        problemResolution: 87.6,
        multiTurnSuccess: 91.4
      }
    });
  }
  
  function handleAIAction(action: string, data: any = {}, confidence: number = 85) {
    aiProcessing = true;
    confidenceScore = confidence;
    
    setTimeout(() => {
      aiProcessing = false;
      dispatch('aiAction', { action, userId, data, confidence });
    }, 1000 + Math.random() * 1000);
  }
  
  function handlePersonalizationUpdate(preferences: any, learningData: any) {
    dispatch('personalizationUpdate', { userId, preferences, learningData });
  }
  
  function handleIntelligentSuggestion(type: string, suggestion: any, reasoning: string) {
    dispatch('intelligentSuggestion', { type, suggestion, reasoning });
  }
  
  function handleAIInsight(category: string, insight: any, actionable: boolean) {
    dispatch('aiInsight', { category, insight, actionable });
  }
  
  function formatConfidence(confidence: number): string {
    if (confidence >= 90) return 'Alta';
    if (confidence >= 75) return 'Media';
    return 'Baja';
  }
  
  function getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }
  
  $: currentData = $componentData;
  $: aiStyles = aiTokens.intelligent;
  $: conversationalStyles = aiTokens.conversational;
</script>

<div class="ai-enhanced-ux" style="--ai-primary: {aiStyles.primary}; --ai-secondary: {aiStyles.secondary}; --ai-accent: {aiStyles.accent}; --ai-surface: {aiStyles.surface}">
  
  {#if variant === 'intelligent-search'}
    <!-- Intelligent Search Interface -->
    <div class="intelligent-search bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-3 mb-4">
          <div class="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
          <h3 class="text-3xl font-bold text-gray-900">🔍 Intelligent Search Engine</h3>
        </div>
        <p class="text-xl text-gray-600">AI-powered search with natural language processing</p>
        <div class="flex items-center justify-center space-x-4 mt-4">
          <span class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-bold">94.7% Accuracy</span>
          <span class="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-bold">150ms Response</span>
          <span class="px-4 py-2 bg-cyan-100 text-cyan-800 rounded-full font-bold">Argentina Optimized</span>
        </div>
      </div>
      
      <!-- Search Input with AI Features -->
      <div class="search-interface mb-8">
        <div class="relative">
          <input 
            type="text" 
            placeholder="Buscá con lenguaje natural: 'Barbero cerca de Palermo para mañana tarde'"
            class="w-full p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none pl-16 pr-24"
            on:input={(e) => handleAIAction('intelligent_search', { query: e.target.value }, 94.7)}
          >
          <div class="absolute left-6 top-1/2 transform -translate-y-1/2">
            <div class="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <div class="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {#if currentData.searchCapabilities?.voiceSearch.enabled}
              <button class="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                🎤
              </button>
            {/if}
            {#if currentData.searchCapabilities?.visualSearch.enabled}
              <button class="p-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                📷
              </button>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- AI Search Capabilities -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div class="capability-card">
          <div class="flex items-center space-x-3 mb-4">
            <div class="text-3xl">🧠</div>
            <h4 class="text-xl font-bold text-gray-900">Natural Language</h4>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Accuracy:</span>
              <span class="font-bold text-indigo-600">{currentData.searchCapabilities?.naturalLanguage.accuracy}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Response Time:</span>
              <span class="font-bold text-indigo-600">{currentData.searchCapabilities?.naturalLanguage.responseTime}</span>
            </div>
            <div class="mt-4">
              <h5 class="font-semibold text-gray-800 mb-2">Ejemplos:</h5>
              <div class="space-y-2">
                {#each currentData.searchCapabilities?.naturalLanguage.examples || [] as example}
                  <div class="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-sm">
                    {example}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
        
        <div class="capability-card" class:opacity-50={!currentData.searchCapabilities?.visualSearch.enabled}>
          <div class="flex items-center space-x-3 mb-4">
            <div class="text-3xl">👁️</div>
            <h4 class="text-xl font-bold text-gray-900">Visual Search</h4>
            {#if !currentData.searchCapabilities?.visualSearch.enabled}
              <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Upgrade Required</span>
            {/if}
          </div>
          {#if currentData.searchCapabilities?.visualSearch.enabled}
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Accuracy:</span>
                <span class="font-bold text-purple-600">{currentData.searchCapabilities?.visualSearch.accuracy}%</span>
              </div>
              <div class="mt-4">
                <h5 class="font-semibold text-gray-800 mb-2">Features:</h5>
                <div class="flex flex-wrap gap-2">
                  {#each currentData.searchCapabilities?.visualSearch.features || [] as feature}
                    <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{feature}</span>
                  {/each}
                </div>
              </div>
            </div>
          {:else}
            <p class="text-gray-500">Upload images to find similar styles and providers</p>
          {/if}
        </div>
        
        <div class="capability-card" class:opacity-50={!currentData.searchCapabilities?.voiceSearch.enabled}>
          <div class="flex items-center space-x-3 mb-4">
            <div class="text-3xl">🎤</div>
            <h4 class="text-xl font-bold text-gray-900">Voice Search</h4>
            {#if !currentData.searchCapabilities?.voiceSearch.enabled}
              <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Enterprise Feature</span>
            {/if}
          </div>
          {#if currentData.searchCapabilities?.voiceSearch.enabled}
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Accuracy:</span>
                <span class="font-bold text-cyan-600">{currentData.searchCapabilities?.voiceSearch.accuracy}%</span>
              </div>
              <div class="mt-4">
                <h5 class="font-semibold text-gray-800 mb-2">Languages:</h5>
                <div class="space-y-1">
                  {#each currentData.searchCapabilities?.voiceSearch.languages || [] as language}
                    <div class="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">{language}</div>
                  {/each}
                </div>
              </div>
            </div>
          {:else}
            <p class="text-gray-500">Voice-activated search with Argentina Spanish support</p>
          {/if}
        </div>
      </div>
      
      <!-- Search Insights Analytics -->
      <div class="search-insights">
        <h4 class="text-xl font-bold text-gray-900 mb-6">🎯 Search Intelligence Analytics</h4>
        <div class="space-y-4">
          {#each currentData.searchInsights || [] as insight}
            <div class="insight-card bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <div class="text-2xl">🔍</div>
                  <div>
                    <h5 class="font-bold text-gray-900">"{insight.query}"</h5>
                    <p class="text-sm text-gray-600">Intent: {insight.intent}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <span class="px-3 py-1 rounded-full text-sm font-medium {getConfidenceColor(insight.confidence)}">
                    {formatConfidence(insight.confidence)} ({insight.confidence}%)
                  </span>
                  <span class="font-bold text-indigo-600">{insight.results} results</span>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h6 class="font-semibold text-gray-800 mb-2">Sugerencias AI:</h6>
                  <div class="space-y-1">
                    {#each insight.suggestions as suggestion}
                      <div class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        {suggestion}
                      </div>
                    {/each}
                  </div>
                </div>
                <div>
                  <h6 class="font-semibold text-gray-800 mb-2">Relevance Score:</h6>
                  <div class="flex items-center space-x-3">
                    <div class="flex-1 bg-gray-200 rounded-full h-3">
                      <div class="bg-green-500 h-3 rounded-full" style="width: {insight.avgRelevance}%"></div>
                    </div>
                    <span class="font-bold text-green-600">{insight.avgRelevance}%</span>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
  {:else if variant === 'ai-personalization'}
    <!-- AI Personalization Engine -->
    <div class="ai-personalization bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-3 mb-4">
          <div class="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <h3 class="text-3xl font-bold text-gray-900">🎯 AI Personalization Engine</h3>
        </div>
        <p class="text-xl text-gray-600">Advanced personalization with cultural intelligence</p>
        <div class="flex items-center justify-center space-x-4 mt-4">
          <span class="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-bold">87.5% Confidence</span>
          <span class="px-4 py-2 bg-pink-100 text-pink-800 rounded-full font-bold">847 Data Points</span>
          <span class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-bold">Advanced Learning</span>
        </div>
      </div>
      
      <!-- Personalization Profile -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="profile-section">
          <h4 class="text-xl font-bold text-gray-900 mb-6">👤 User Intelligence Profile</h4>
          <div class="space-y-6">
            <div class="profile-metric">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-700">Learning Stage</span>
                <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                  {currentData.personalizationProfile?.learningStage}
                </span>
              </div>
            </div>
            
            <div class="profile-metric">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-700">Data Points Collected</span>
                <span class="font-bold text-indigo-600">{currentData.personalizationProfile?.dataPoints}</span>
              </div>
            </div>
            
            <div class="profile-metric">
              <div class="flex items-center justify-between mb-3">
                <span class="font-medium text-gray-700">Confidence Level</span>
                <span class="font-bold text-green-600">{currentData.personalizationProfile?.confidenceLevel}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-green-500 h-3 rounded-full" style="width: {currentData.personalizationProfile?.confidenceLevel}%"></div>
              </div>
            </div>
            
            <div class="preferences-section">
              <h5 class="font-semibold text-gray-800 mb-3">🎯 Learned Preferences</h5>
              <div class="space-y-3">
                <div>
                  <span class="text-sm font-medium text-gray-600">Service Types:</span>
                  <div class="flex flex-wrap gap-2 mt-1">
                    {#each currentData.personalizationProfile?.preferences.serviceTypes || [] as service}
                      <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{service}</span>
                    {/each}
                  </div>
                </div>
                
                <div>
                  <span class="text-sm font-medium text-gray-600">Price Range:</span>
                  <div class="mt-1 text-sm text-green-600 font-bold">
                    ${currentData.personalizationProfile?.preferences.priceRange.min} - ${currentData.personalizationProfile?.preferences.priceRange.max}
                  </div>
                </div>
                
                <div>
                  <span class="text-sm font-medium text-gray-600">Time Preferences:</span>
                  <div class="flex flex-wrap gap-2 mt-1">
                    {#each currentData.personalizationProfile?.preferences.timePreferences || [] as time}
                      <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">{time}</span>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Behavior Patterns -->
        <div class="behavior-section">
          <h4 class="text-xl font-bold text-gray-900 mb-6">📊 Behavior Intelligence</h4>
          <div class="space-y-4">
            {#each Object.entries(currentData.personalizationProfile?.behaviorPatterns || {}) as [key, value]}
              <div class="behavior-metric bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-700">
                    {#if key === 'bookingFrequency'}Booking Frequency
                    {:else if key === 'cancellationRate'}Cancellation Rate
                    {:else if key === 'reviewBehavior'}Review Behavior
                    {:else if key === 'loyaltyPattern'}Loyalty Pattern
                    {:else if key === 'pricesensitivity'}Price Sensitivity
                    {:else if key === 'socialSharing'}Social Sharing
                    {:else}{key}
                    {/if}
                  </span>
                  <span class="font-bold text-purple-700">
                    {#if key === 'cancellationRate'}{value}%
                    {:else}{value}
                    {/if}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- AI Recommendations -->
      <div class="recommendations-section">
        <h4 class="text-xl font-bold text-gray-900 mb-6">🎯 Intelligent Recommendations</h4>
        <div class="space-y-6">
          {#each currentData.aiRecommendations || [] as recommendation}
            <div class="recommendation-card bg-gradient-to-br from-white to-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h5 class="text-lg font-bold text-gray-900 mb-2">{recommendation.title}</h5>
                  <div class="flex items-center space-x-4">
                    <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                      {recommendation.type.replace('_', ' ')}
                    </span>
                    <span class="px-3 py-1 rounded-full text-sm font-medium {getConfidenceColor(recommendation.confidence)}">
                      {formatConfidence(recommendation.confidence)} ({recommendation.confidence}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="recommendation-content">
                  {#if recommendation.type === 'provider_suggestion'}
                    <div class="provider-suggestion">
                      <div class="flex items-center space-x-3 mb-3">
                        <div class="text-2xl">💈</div>
                        <div>
                          <h6 class="font-bold text-gray-900">{recommendation.recommendation.name}</h6>
                          <div class="flex items-center space-x-2 text-sm">
                            <span class="text-yellow-600">⭐ {recommendation.recommendation.rating}</span>
                            <span class="text-gray-600">• {recommendation.recommendation.distance}</span>
                            <span class="text-green-600">• ${recommendation.recommendation.price}</span>
                          </div>
                        </div>
                      </div>
                      <p class="text-sm text-gray-600 mb-3">{recommendation.recommendation.specialty}</p>
                    </div>
                  {:else if recommendation.type === 'time_optimization'}
                    <div class="time-suggestion">
                      <div class="flex items-center space-x-3 mb-3">
                        <div class="text-2xl">⏰</div>
                        <div>
                          <h6 class="font-bold text-gray-900">{recommendation.recommendation.day} {recommendation.recommendation.time}</h6>
                          <p class="text-sm text-gray-600">{recommendation.recommendation.reason}</p>
                        </div>
                      </div>
                      <div class="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        💰 {recommendation.recommendation.savings}
                      </div>
                    </div>
                  {:else if recommendation.type === 'service_upgrade'}
                    <div class="service-upgrade">
                      <div class="flex items-center space-x-3 mb-3">
                        <div class="text-2xl">✨</div>
                        <div>
                          <h6 class="font-bold text-gray-900">{recommendation.recommendation.service}</h6>
                          <p class="text-sm text-gray-600">{recommendation.recommendation.provider}</p>
                          <span class="text-lg font-bold text-purple-600">${recommendation.recommendation.price}</span>
                        </div>
                      </div>
                      <p class="text-sm text-gray-700">{recommendation.recommendation.benefit}</p>
                    </div>
                  {/if}
                </div>
                
                <div class="reasoning-content">
                  <h6 class="font-semibold text-gray-800 mb-2">🧠 AI Reasoning</h6>
                  <p class="text-sm text-gray-600 mb-3">{recommendation.reasoning}</p>
                  
                  <h6 class="font-semibold text-gray-800 mb-2">Personalization Factors:</h6>
                  <div class="flex flex-wrap gap-1">
                    {#each recommendation.personalizedFactors as factor}
                      <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{factor}</span>
                    {/each}
                  </div>
                </div>
              </div>
              
              <div class="flex justify-end space-x-3 mt-4">
                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Not Interested
                </button>
                <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        on:click={() => handleIntelligentSuggestion(recommendation.type, recommendation.recommendation, recommendation.reasoning)}>
                  Apply Recommendation
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
  {:else if variant === 'conversational-ai'}
    <!-- Conversational AI Interface -->
    <div class="conversational-ai bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-3 mb-4">
          <div class="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse"></div>
          <h3 class="text-3xl font-bold text-gray-900">💬 Conversational AI Assistant</h3>
        </div>
        <p class="text-xl text-gray-600">Natural conversation with Argentina cultural intelligence</p>
      </div>
      
      <!-- AI Personality Profile -->
      <div class="ai-profile bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 mb-8">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <div>
            <h4 class="text-xl font-bold text-gray-900">{currentData.conversationInterface?.aiPersonality.name}</h4>
            <p class="text-gray-600">{currentData.conversationInterface?.aiPersonality.role}</p>
            <div class="flex items-center space-x-4 mt-2">
              <span class="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
                {currentData.conversationInterface?.aiPersonality.language}
              </span>
              <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {currentData.conversationInterface?.aiPersonality.personality}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 class="font-semibold text-gray-800 mb-2">Expertise Areas:</h5>
          <div class="flex flex-wrap gap-2">
            {#each currentData.conversationInterface?.aiPersonality.expertise || [] as expertise}
              <span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">{expertise}</span>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Conversation Interface -->
      <div class="conversation-container bg-gray-50 rounded-xl p-6 mb-8 min-h-96 max-h-96 overflow-y-auto">
        <div class="space-y-4">
          {#each currentData.conversationInterface?.conversationExamples || [] as example}
            <!-- User Message -->
            <div class="flex justify-end">
              <div class="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl" style="background-color: {conversationalStyles.userBubble}; color: white;">
                <p class="text-sm">{example.user}</p>
              </div>
            </div>
            
            <!-- AI Response -->
            <div class="flex justify-start">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  S
                </div>
                <div class="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl" style="background-color: {conversationalStyles.aiBubble}; color: white;">
                  <p class="text-sm">{example.ai}</p>
                </div>
              </div>
            </div>
            
            <!-- Context Explanation -->
            <div class="flex justify-center">
              <div class="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full max-w-md text-center">
                AI Context: {example.context}
              </div>
            </div>
          {/each}
          
          {#if aiProcessing}
            <div class="flex justify-start">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  S
                </div>
                <div class="px-4 py-3 rounded-2xl" style="background-color: {conversationalStyles.aiBubble}; color: white;">
                  <div class="flex items-center space-x-2">
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                      <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-sm">Sofia está escribiendo...</span>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Message Input -->
      <div class="message-input-container">
        <div class="flex items-center space-x-4 bg-gray-100 rounded-2xl p-4">
          <input 
            type="text" 
            placeholder="Escribí tu mensaje..."
            class="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
            on:keypress={(e) => {
              if (e.key === 'Enter') {
                handleAIAction('send_message', { message: e.target.value }, 92.3);
                e.target.value = '';
              }
            }}
          >
          <button class="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- AI Capabilities Metrics -->
      <div class="ai-metrics mt-8">
        <h4 class="text-xl font-bold text-gray-900 mb-6">🎯 AI Performance Metrics</h4>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
          {#each Object.entries(currentData.aiCapabilityMetrics || {}) as [key, value]}
            <div class="metric-card bg-gradient-to-br from-white to-cyan-50 rounded-lg p-4 border border-cyan-200 text-center">
              <div class="text-2xl font-bold text-cyan-600 mb-1">
                {#if typeof value === 'number' && key !== 'userSatisfaction'}
                  {value}%
                {:else}
                  {value}
                {/if}
              </div>
              <div class="text-xs text-gray-600 uppercase tracking-wide">
                {#if key === 'responseAccuracy'}Response Accuracy
                {:else if key === 'intentRecognition'}Intent Recognition
                {:else if key === 'conversationCompletion'}Completion Rate
                {:else if key === 'userSatisfaction'}User Satisfaction
                {:else if key === 'problemResolution'}Problem Resolution
                {:else if key === 'multiTurnSuccess'}Multi-Turn Success
                {:else}{key}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .ai-enhanced-ux {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .intelligent-search {
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  }
  
  .search-interface input:focus {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .capability-card {
    @apply bg-gradient-to-br from-white to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-md;
  }
  
  .insight-card {
    @apply hover:shadow-lg transition-all;
  }
  
  .ai-personalization {
    background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
  }
  
  .profile-section {
    @apply bg-gradient-to-br from-white to-purple-50 rounded-xl p-6 border border-purple-100;
  }
  
  .behavior-section {
    @apply bg-gradient-to-br from-white to-pink-50 rounded-xl p-6 border border-pink-100;
  }
  
  .recommendation-card {
    @apply hover:shadow-xl transition-all;
  }
  
  .conversational-ai {
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  }
  
  .conversation-container {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  .conversation-container::-webkit-scrollbar {
    width: 4px;
  }
  
  .conversation-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  .conversation-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  .metric-card {
    @apply hover:shadow-md transition-all;
  }
</style>