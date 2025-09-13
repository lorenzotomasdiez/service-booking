<!--
  Premium Experience Optimizer - Day 9 Premium Features Enhancement
  Building on Day 8's 4.8/5 satisfaction success for enterprise positioning
  Sophisticated interfaces for premium providers and enterprise clients
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { fade, fly, scale, slide } from 'svelte/transition';
  
  export let variant: 'dashboard' | 'client-management' | 'multi-location' | 'onboarding' | 'subscription' | 'luxury-features' = 'dashboard';
  export let userTier: 'basic' | 'professional' | 'enterprise' = 'professional';
  export let argentinaMarket: boolean = true;
  export let businessIntelligence: any = null;
  
  const dispatch = createEventDispatcher<{
    premiumAction: { action: string; data: any; tier: string };
    enterpriseRequest: { feature: string; requirements: any };
    upgradeTrigger: { currentTier: string; targetTier: string; reason: string };
  }>();
  
  // Premium design tokens with luxury positioning
  const premiumTokens = {
    luxury: {
      primary: '#1a202c',        // Deep charcoal for sophistication
      secondary: '#2d3748',      // Professional gray
      accent: '#805ad5',         // Premium purple
      gold: '#d69e2e',          // Argentina gold highlights
      surface: '#ffffff',        // Pure white for cleanliness
      elevated: '#f7fafc',       // Subtle elevation
      text: '#2d3748',          // Professional text
      success: '#38a169',        // Success green
      warning: '#dd6b20',        // Premium orange
      error: '#e53e3e',         // Error red
      gradient: 'from-purple-600 via-blue-600 to-indigo-700'
    }
  };
  
  // Enterprise features unlocked by tier
  const tierFeatures = {
    basic: {
      maxLocations: 1,
      maxStaff: 3,
      analytics: 'basic',
      support: 'email',
      whatsappIntegration: false,
      customBranding: false,
      apiAccess: false,
      conciergeService: false
    },
    professional: {
      maxLocations: 3,
      maxStaff: 15,
      analytics: 'advanced',
      support: 'priority',
      whatsappIntegration: true,
      customBranding: 'limited',
      apiAccess: 'limited',
      conciergeService: false
    },
    enterprise: {
      maxLocations: 999,
      maxStaff: 999,
      analytics: 'enterprise',
      support: 'dedicated',
      whatsappIntegration: 'full',
      customBranding: 'complete',
      apiAccess: 'full',
      conciergeService: true
    }
  };
  
  // Argentina premium market insights
  const argentinaPremiumData = {
    averageRevenue: {
      basic: 28500,
      professional: 85600,
      enterprise: 245000
    },
    marketPosition: {
      basic: 'Local competitor',
      professional: 'Market leader',
      enterprise: 'Category creator'
    },
    clientProfile: {
      basic: 'Neighborhood clients',
      professional: 'Premium urban clients',
      enterprise: 'Luxury & corporate clients'
    },
    pricingPower: {
      basic: '5-10% above market',
      professional: '25-40% premium pricing',
      enterprise: '50-100% luxury positioning'
    }
  };
  
  // Component state
  let currentFeatures = tierFeatures[userTier];
  let componentData = writable({});
  let showUpgradeModal = false;
  let upgradeReason = '';
  
  onMount(() => {
    initializePremiumComponent();
  });
  
  function initializePremiumComponent() {
    switch (variant) {
      case 'dashboard':
        initializePremiumDashboard();
        break;
      case 'client-management':
        initializeClientManagement();
        break;
      case 'multi-location':
        initializeMultiLocation();
        break;
      case 'onboarding':
        initializePremiumOnboarding();
        break;
      case 'subscription':
        initializeSubscriptionManagement();
        break;
      case 'luxury-features':
        initializeLuxuryFeatures();
        break;
    }
  }
  
  function initializePremiumDashboard() {
    const revenue = argentinaPremiumData.averageRevenue[userTier];
    componentData.set({
      premiumMetrics: {
        monthlyRevenue: { value: revenue, change: 18.5, tier: userTier },
        premiumClients: { value: 89, change: 25.3, tier: userTier },
        averageTicket: { value: Math.round(revenue / 89), change: 12.7, tier: userTier },
        marketPosition: { value: argentinaPremiumData.marketPosition[userTier], change: 8.2, tier: userTier },
        luxuryBookings: { value: 34, change: 45.2, tier: userTier },
        conciergeRequests: { value: userTier === 'enterprise' ? 12 : 0, change: 67.3, tier: userTier }
      },
      executiveActions: [
        { id: 'vip-clients', label: 'Clientes VIP', icon: '👑', count: 8, premium: true },
        { id: 'luxury-services', label: 'Servicios Premium', icon: '✨', count: 5, premium: true },
        { id: 'concierge', label: 'Servicio Concierge', icon: '🎩', count: userTier === 'enterprise' ? 3 : 0, premium: true, enterpriseOnly: true },
        { id: 'analytics', label: 'Business Intelligence', icon: '📊', premium: true },
        { id: 'white-label', label: 'White Label', icon: '🏷️', premium: true, enterpriseOnly: userTier !== 'enterprise' }
      ],
      competitiveAdvantage: {
        marketShare: userTier === 'enterprise' ? 'Category Leader' : userTier === 'professional' ? 'Premium Provider' : 'Local Leader',
        pricePosition: argentinaPremiumData.pricingPower[userTier],
        uniqueValue: 'Argentina Cultural Intelligence + Premium UX',
        nextMilestone: userTier === 'basic' ? 'Premium Provider Status' : userTier === 'professional' ? 'Category Leadership' : 'International Expansion'
      }
    });
  }
  
  function initializeClientManagement() {
    componentData.set({
      vipClients: [
        {
          id: 1,
          name: 'Roberto Martínez',
          tier: 'Platinum',
          ltv: 45600,
          frequency: 'Quincenal',
          preferences: ['Horario fijo', 'Producto específico', 'Servicio a domicilio'],
          lastVisit: Date.now() - 86400000 * 3,
          nextBooking: Date.now() + 86400000 * 4,
          notes: 'CEO multinacional - máxima discreción',
          satisfaction: 5.0,
          conciergeLevel: userTier === 'enterprise'
        },
        {
          id: 2,
          name: 'Sofia Fernández',
          tier: 'Gold',
          ltv: 28900,
          frequency: 'Mensual',
          preferences: ['Fin de semana', 'Productos orgánicos', 'Música clásica'],
          lastVisit: Date.now() - 86400000 * 7,
          nextBooking: Date.now() + 86400000 * 14,
          notes: 'Influencer - fotos permitidas con consentimiento',
          satisfaction: 4.9,
          conciergeLevel: false
        },
        {
          id: 3,
          name: 'Carlos Mendoza',
          tier: 'Silver',
          ltv: 18500,
          frequency: 'Semanal',
          preferences: ['Horario laboral', 'Servicio rápido', 'WhatsApp confirmación'],
          lastVisit: Date.now() - 86400000 * 2,
          nextBooking: Date.now() + 86400000 * 5,
          notes: 'Ejecutivo bancario - puntualidad crítica',
          satisfaction: 4.8,
          conciergeLevel: false
        }
      ],
      clientInsights: {
        averageLTV: 31000,
        retentionRate: 94,
        satisfactionScore: 4.85,
        premiumServiceUptake: 78,
        conciergeUsage: userTier === 'enterprise' ? 45 : 0,
        referralRate: 67
      },
      personalizationEngine: {
        enabled: userTier !== 'basic',
        aiRecommendations: userTier === 'enterprise',
        predictiveScheduling: userTier !== 'basic',
        customPreferences: true,
        loyaltyProgram: userTier !== 'basic'
      }
    });
  }
  
  function initializeMultiLocation() {
    componentData.set({
      locations: [
        {
          id: 1,
          name: 'BarberPro Palermo',
          address: 'Av. Santa Fe 3421, Palermo, CABA',
          status: 'active',
          staff: 8,
          revenue: 125000,
          occupancy: 87,
          rating: 4.9,
          manager: 'Diego Rodriguez',
          specialties: ['Corte clásico', 'Barba styling', 'Servicios premium'],
          vipRoom: true,
          conciergeService: userTier === 'enterprise'
        },
        {
          id: 2,
          name: 'BarberPro Recoleta',
          address: 'Av. Callao 1250, Recoleta, CABA',
          status: 'active',
          staff: 12,
          revenue: 185000,
          occupancy: 92,
          rating: 4.8,
          manager: 'Maria González',
          specialties: ['Servicios ejecutivos', 'Grooming completo', 'Eventos corporativos'],
          vipRoom: true,
          conciergeService: userTier === 'enterprise'
        },
        {
          id: 3,
          name: 'BarberPro Puerto Madero',
          address: 'Av. Alicia Moreau de Justo 740, Puerto Madero, CABA',
          status: userTier === 'enterprise' ? 'active' : 'upgrade_required',
          staff: userTier === 'enterprise' ? 15 : 0,
          revenue: userTier === 'enterprise' ? 245000 : 0,
          occupancy: userTier === 'enterprise' ? 95 : 0,
          rating: userTier === 'enterprise' ? 4.95 : 0,
          manager: userTier === 'enterprise' ? 'Alejandro Morales' : null,
          specialties: userTier === 'enterprise' ? ['Luxury services', 'Corporate accounts', 'International clients'] : [],
          vipRoom: true,
          conciergeService: userTier === 'enterprise',
          premium: true
        }
      ],
      consolidatedMetrics: {
        totalRevenue: userTier === 'enterprise' ? 555000 : userTier === 'professional' ? 310000 : 125000,
        totalStaff: userTier === 'enterprise' ? 35 : userTier === 'professional' ? 20 : 8,
        averageOccupancy: userTier === 'enterprise' ? 91 : userTier === 'professional' ? 89.5 : 87,
        overallRating: userTier === 'enterprise' ? 4.88 : userTier === 'professional' ? 4.85 : 4.9,
        vipCapacity: userTier === 'enterprise' ? 3 : userTier === 'professional' ? 2 : 1
      },
      centralizedFeatures: {
        staffManagement: userTier !== 'basic',
        inventorySync: userTier === 'enterprise',
        brandConsistency: userTier !== 'basic',
        performanceComparison: userTier !== 'basic',
        clientTransfers: userTier !== 'basic'
      }
    });
  }
  
  function initializePremiumOnboarding() {
    componentData.set({
      onboardingSteps: [
        {
          id: 'welcome',
          title: 'Bienvenido al Futuro de los Servicios Premium',
          subtitle: 'Tu plataforma para dominar el mercado argentino de servicios de lujo',
          completed: true,
          premium: true
        },
        {
          id: 'brand-setup',
          title: 'Configuración de Marca Premium',
          subtitle: 'Establecer tu identidad de lujo en el mercado argentino',
          completed: true,
          premium: true,
          features: ['Logo personalizado', 'Colores de marca', 'Mensaje de valor único']
        },
        {
          id: 'luxury-services',
          title: 'Catálogo de Servicios Premium',
          subtitle: 'Servicios exclusivos que justifican precios premium',
          completed: false,
          premium: true,
          features: ['Servicios VIP', 'Experiencias únicas', 'Pricing estratégico']
        },
        {
          id: 'vip-client-setup',
          title: 'Gestión de Clientes VIP',
          subtitle: 'Sistema de clientela premium y servicio concierge',
          completed: false,
          premium: true,
          features: ['Perfiles VIP', 'Preferencias detalladas', 'Servicio personalizado'],
          enterpriseOnly: userTier !== 'enterprise'
        },
        {
          id: 'argentina-integration',
          title: 'Integración Argentina Premium',
          subtitle: 'Optimización cultural y de mercado local',
          completed: false,
          premium: true,
          features: ['WhatsApp Business', 'MercadoPago Premium', 'Cultural insights']
        },
        {
          id: 'enterprise-features',
          title: 'Características Empresariales',
          subtitle: 'Herramientas para operaciones multi-ubicación',
          completed: false,
          premium: true,
          enterpriseOnly: userTier !== 'enterprise',
          features: ['Multi-ubicación', 'Gestión de staff', 'Reportes ejecutivos']
        }
      ],
      premiumBenefits: {
        revenueIncrease: '40-85% aumento promedio en ingresos',
        clientUpgrade: '65% de clientes migran a servicios premium',
        marketPosition: 'Positioning como proveedor de lujo',
        competitiveAdvantage: 'Diferenciación única en Argentina',
        roi: 'ROI 300-500% en primeros 6 meses'
      }
    });
  }
  
  function initializeSubscriptionManagement() {
    componentData.set({
      currentPlan: {
        tier: userTier,
        price: userTier === 'enterprise' ? 7999 : userTier === 'professional' ? 3999 : 1999,
        billingCycle: 'monthly',
        nextBilling: Date.now() + 86400000 * 12,
        discountApplied: userTier === 'enterprise' ? 20 : userTier === 'professional' ? 10 : 0,
        autoRenewal: true
      },
      usage: {
        locations: userTier === 'enterprise' ? 3 : userTier === 'professional' ? 2 : 1,
        staff: userTier === 'enterprise' ? 35 : userTier === 'professional' ? 20 : 8,
        monthlyBookings: userTier === 'enterprise' ? 1250 : userTier === 'professional' ? 680 : 245,
        apiCalls: userTier === 'enterprise' ? 15000 : userTier === 'professional' ? 2500 : 0,
        conciergeHours: userTier === 'enterprise' ? 45 : 0
      },
      upgradeOpportunities: [
        {
          feature: 'Multi-location Management',
          currentUsage: userTier === 'enterprise' ? 3 : userTier === 'professional' ? 2 : 1,
          limit: currentFeatures.maxLocations,
          recommendedTier: userTier === 'basic' ? 'professional' : 'enterprise',
          revenue_impact: '+$45,000 monthly potential',
          available: userTier !== 'enterprise'
        },
        {
          feature: 'Concierge Service',
          currentUsage: userTier === 'enterprise' ? 45 : 0,
          limit: userTier === 'enterprise' ? 999 : 0,
          recommendedTier: 'enterprise',
          revenue_impact: '+$25,000 monthly potential',
          available: userTier !== 'enterprise'
        },
        {
          feature: 'White Label Branding',
          currentUsage: userTier === 'enterprise' ? 'Full' : userTier === 'professional' ? 'Limited' : 'None',
          limit: currentFeatures.customBranding,
          recommendedTier: 'enterprise',
          revenue_impact: '+30% brand premium',
          available: userTier !== 'enterprise'
        }
      ],
      invoicing: {
        monthly: userTier === 'enterprise' ? 7999 : userTier === 'professional' ? 3999 : 1999,
        quarterly: Math.round((userTier === 'enterprise' ? 7999 : userTier === 'professional' ? 3999 : 1999) * 3 * 0.95),
        yearly: Math.round((userTier === 'enterprise' ? 7999 : userTier === 'professional' ? 3999 : 1999) * 12 * 0.85),
        currency: 'ARS',
        paymentMethods: ['MercadoPago', 'Transferencia bancaria', 'Tarjeta de crédito'],
        invoiceHistory: []
      }
    });
  }
  
  function initializeLuxuryFeatures() {
    componentData.set({
      luxuryServices: [
        {
          id: 'concierge',
          name: 'Servicio Concierge Premium',
          description: 'Asistente personal para clientes VIP',
          enabled: userTier === 'enterprise',
          features: ['Agenda personalizada', 'Servicios a domicilio', 'Atención 24/7'],
          pricing: 'Incluido en plan Enterprise',
          clientImpact: '85% satisfacción cliente premium',
          revenueImpact: '+$25,000 monthly'
        },
        {
          id: 'white-label',
          name: 'White Label Completo',
          description: 'Marca completamente personalizada',
          enabled: userTier === 'enterprise',
          features: ['Branding completo', 'Dominio propio', 'Apps personalizadas'],
          pricing: 'Incluido en plan Enterprise',
          clientImpact: '40% aumento percepción marca',
          revenueImpact: '+30% precio premium'
        },
        {
          id: 'vip-rooms',
          name: 'Salas VIP Exclusivas',
          description: 'Espacios premium para clientela selecta',
          enabled: userTier !== 'basic',
          features: ['Ambientes exclusivos', 'Servicios premium', 'Privacidad total'],
          pricing: userTier === 'professional' ? '+$500/mes' : 'Incluido',
          clientImpact: '95% retención clientes VIP',
          revenueImpact: '+60% ticket promedio VIP'
        },
        {
          id: 'ai-personalization',
          name: 'IA Personalización Avanzada',
          description: 'Inteligencia artificial para experiencia única',
          enabled: userTier === 'enterprise',
          features: ['Recomendaciones IA', 'Predicción preferencias', 'Optimización automática'],
          pricing: 'Incluido en plan Enterprise',
          clientImpact: '45% aumento satisfacción',
          revenueImpact: '+25% conversión servicios adicionales'
        },
        {
          id: 'executive-reports',
          name: 'Reportes Ejecutivos',
          description: 'Business intelligence de nivel C-suite',
          enabled: userTier === 'enterprise',
          features: ['Dashboards ejecutivos', 'Análisis predictivo', 'Insights competitivos'],
          pricing: 'Incluido en plan Enterprise',
          clientImpact: 'Decisiones data-driven',
          revenueImpact: '+15% optimización operacional'
        }
      ],
      argentinaPremiumMarket: {
        marketSize: '$45M servicios premium CABA',
        growthRate: '25% anual crecimiento lujo',
        competitorAnalysis: 'Solo 3% proveedores premium tecnológicos',
        opportunity: 'Primeros en mercado premium digital',
        barriers: 'Cultura, confianza, posicionamiento'
      },
      enterpriseReadiness: {
        scalability: userTier === 'enterprise' ? 'Ready' : 'Upgrade required',
        integration: userTier === 'enterprise' ? 'Full API access' : 'Limited integration',
        support: userTier === 'enterprise' ? 'Dedicated account manager' : 'Standard support',
        customization: userTier === 'enterprise' ? 'Unlimited' : 'Template-based',
        sla: userTier === 'enterprise' ? '99.95% uptime' : '99.5% uptime'
      }
    });
  }
  
  function handlePremiumAction(action: string, data: any = {}) {
    dispatch('premiumAction', { action, data, tier: userTier });
  }
  
  function triggerUpgrade(targetTier: string, reason: string) {
    upgradeReason = reason;
    showUpgradeModal = true;
    dispatch('upgradeTrigger', { currentTier: userTier, targetTier, reason });
  }
  
  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-AR')}`;
  }
  
  function formatPercentage(value: number): string {
    return `${value}%`;
  }
  
  function getFeatureStatus(feature: string): boolean {
    return currentFeatures[feature] !== false && currentFeatures[feature] !== 0;
  }
  
  $: currentData = $componentData;
  $: luxuryTokens = premiumTokens.luxury;
</script>

<div class="premium-experience" style="--primary: {luxuryTokens.primary}; --secondary: {luxuryTokens.secondary}; --accent: {luxuryTokens.accent}; --gold: {luxuryTokens.gold}; --surface: {luxuryTokens.surface}">
  
  {#if variant === 'dashboard'}
    <!-- Premium Executive Dashboard -->
    <div class="executive-dashboard bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <!-- Premium Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-3 h-3 bg-gold rounded-full animate-pulse"></div>
            <h2 class="text-3xl font-bold text-gray-900">Executive Command Center</h2>
            <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              {userTier.toUpperCase()}
            </span>
          </div>
          <p class="text-gray-600 text-lg">Comando estratégico para el mercado premium argentino</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-green-700 font-semibold">Premium Active</span>
            </div>
          </div>
          {#if userTier !== 'enterprise'}
            <button 
              class="btn-enterprise"
              on:click={() => triggerUpgrade('enterprise', 'dashboard_upgrade')}
            >
              🚀 Upgrade to Enterprise
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Premium Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {#each Object.entries(currentData.premiumMetrics || {}) as [key, metric]}
          <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {#if key === 'monthlyRevenue'}Ingresos Premium
                {:else if key === 'premiumClients'}Clientes VIP
                {:else if key === 'averageTicket'}Ticket Promedio
                {:else if key === 'marketPosition'}Posición Mercado
                {:else if key === 'luxuryBookings'}Reservas Lujo
                {:else if key === 'conciergeRequests'}Solicitudes Concierge
                {:else}{key}
                {/if}
              </span>
              <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                +{metric.change}%
              </span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {#if key === 'monthlyRevenue' || key === 'averageTicket'}
                {formatCurrency(metric.value)}
              {:else if key === 'marketPosition'}
                {metric.value}
              {:else}
                {metric.value}
              {/if}
            </div>
            <div class="text-xs text-gray-500">vs. mes anterior</div>
            {#if userTier === 'enterprise' && key === 'conciergeRequests'}
              <div class="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Enterprise Feature
              </div>
            {/if}
          </div>
        {/each}
      </div>
      
      <!-- Executive Quick Actions -->
      <div class="mb-8">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Executive Actions</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          {#each currentData.executiveActions || [] as action}
            <button 
              class="premium-action-card"
              class:opacity-50={action.enterpriseOnly && userTier !== 'enterprise'}
              class:cursor-not-allowed={action.enterpriseOnly && userTier !== 'enterprise'}
              on:click={() => action.enterpriseOnly && userTier !== 'enterprise' ? triggerUpgrade('enterprise', action.id) : handlePremiumAction(action.id, action)}
            >
              <div class="text-3xl mb-3">{action.icon}</div>
              <div class="text-sm font-semibold text-gray-900 mb-1">{action.label}</div>
              {#if action.count > 0}
                <div class="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs rounded-full font-bold mb-2">
                  {action.count}
                </div>
              {/if}
              {#if action.enterpriseOnly && userTier !== 'enterprise'}
                <div class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-2">
                  Enterprise
                </div>
              {:else if action.premium}
                <div class="text-xs bg-gold text-white px-2 py-1 rounded mt-2">
                  Premium
                </div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Competitive Advantage Panel -->
      <div class="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <h4 class="text-lg font-bold text-gray-900 mb-4">🇦🇷 Competitive Advantage Argentina</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          {#each Object.entries(currentData.competitiveAdvantage || {}) as [key, value]}
            <div class="text-center">
              <div class="text-sm font-medium text-gray-600 mb-1 capitalize">
                {#if key === 'marketShare'}Market Share
                {:else if key === 'pricePosition'}Price Position
                {:else if key === 'uniqueValue'}Unique Value
                {:else if key === 'nextMilestone'}Next Milestone
                {:else}{key}
                {/if}
              </div>
              <div class="text-lg font-bold text-purple-700">{value}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
  {:else if variant === 'client-management'}
    <!-- Premium Client Management -->
    <div class="client-management bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">VIP Client Management</h3>
          <p class="text-gray-600">Gestión premium de clientela selecta</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="bg-gradient-to-r from-gold to-yellow-500 text-white px-4 py-2 rounded-lg font-semibold">
            👑 {currentData.vipClients?.length || 0} VIP Clients
          </div>
          {#if !getFeatureStatus('personalizationEngine')}
            <button 
              class="btn-upgrade"
              on:click={() => triggerUpgrade('professional', 'personalization_engine')}
            >
              Unlock AI Personalization
            </button>
          {/if}
        </div>
      </div>
      
      <!-- VIP Client Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {#each currentData.vipClients || [] as client}
          <div class="vip-client-card bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gold shadow-lg">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-gold to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 class="font-bold text-gray-900">{client.name}</h4>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {client.tier}
                  </span>
                </div>
              </div>
              {#if client.conciergeLevel}
                <div class="text-2xl">🎩</div>
              {/if}
            </div>
            
            <div class="space-y-3 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">LTV:</span>
                <span class="font-semibold text-green-600">{formatCurrency(client.ltv)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Frecuencia:</span>
                <span class="font-medium">{client.frequency}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Satisfacción:</span>
                <span class="font-semibold text-gold">{client.satisfaction}/5 ⭐</span>
              </div>
            </div>
            
            <div class="mb-4">
              <h5 class="text-sm font-medium text-gray-700 mb-2">Preferencias VIP:</h5>
              <div class="flex flex-wrap gap-1">
                {#each client.preferences as preference}
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {preference}
                  </span>
                {/each}
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-3 mb-4">
              <p class="text-xs text-gray-600 italic">"{client.notes}"</p>
            </div>
            
            <div class="flex space-x-2">
              <button class="btn-primary-sm flex-1">
                📅 Next: {new Date(client.nextBooking).toLocaleDateString('es-AR')}
              </button>
              {#if client.conciergeLevel}
                <button class="btn-concierge">🎩</button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Client Insights Dashboard -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        {#each Object.entries(currentData.clientInsights || {}) as [key, value]}
          <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-600 mb-1">
              {#if key.includes('Rate') || key === 'retentionRate' || key === 'premiumServiceUptake' || key === 'referralRate'}
                {value}%
              {:else if key === 'averageLTV'}
                {formatCurrency(value)}
              {:else if key === 'satisfactionScore'}
                {value}/5
              {:else}
                {value}
              {/if}
            </div>
            <div class="text-xs text-gray-600 uppercase tracking-wide">
              {#if key === 'averageLTV'}LTV Promedio
              {:else if key === 'retentionRate'}Retención
              {:else if key === 'satisfactionScore'}Satisfacción
              {:else if key === 'premiumServiceUptake'}Uptake Premium
              {:else if key === 'conciergeUsage'}Uso Concierge
              {:else if key === 'referralRate'}Referidos
              {:else}{key}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
    
  {:else if variant === 'multi-location'}
    <!-- Multi-Location Management -->
    <div class="multi-location bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Multi-Location Command Center</h3>
          <p class="text-gray-600">Gestión centralizada de múltiples ubicaciones premium</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-2">
            <span class="text-blue-700 font-semibold">
              {currentData.locations?.filter(l => l.status === 'active').length || 0}/{currentFeatures.maxLocations} Locations
            </span>
          </div>
        </div>
      </div>
      
      <!-- Consolidated Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        {#each Object.entries(currentData.consolidatedMetrics || {}) as [key, value]}
          <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-md">
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {#if key === 'totalRevenue'}
                {formatCurrency(value)}
              {:else if key === 'averageOccupancy'}
                {value}%
              {:else if key === 'overallRating'}
                {value}/5
              {:else}
                {value}
              {/if}
            </div>
            <div class="text-sm text-gray-600">
              {#if key === 'totalRevenue'}Revenue Total
              {:else if key === 'totalStaff'}Staff Total
              {:else if key === 'averageOccupancy'}Ocupación Promedio
              {:else if key === 'overallRating'}Rating General
              {:else if key === 'vipCapacity'}Capacidad VIP
              {:else}{key}
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Location Cards -->
      <div class="space-y-6">
        {#each currentData.locations || [] as location}
          <div class="location-card bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-lg"
               class:opacity-50={location.status === 'upgrade_required'}
               class:border-purple-300={location.premium}>
            
            {#if location.status === 'upgrade_required'}
              <div class="absolute top-4 right-4">
                <button 
                  class="btn-upgrade"
                  on:click={() => triggerUpgrade('enterprise', 'multi_location')}
                >
                  🔓 Unlock Location
                </button>
              </div>
            {/if}
            
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <h4 class="text-xl font-bold text-gray-900">{location.name}</h4>
                  {#if location.vipRoom}
                    <span class="px-2 py-1 bg-gold text-white text-xs rounded-full font-medium">VIP</span>
                  {/if}
                  {#if location.conciergeService}
                    <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Concierge</span>
                  {/if}
                  {#if location.premium}
                    <span class="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full font-medium">Premium</span>
                  {/if}
                </div>
                <p class="text-gray-600">{location.address}</p>
                {#if location.manager}
                  <p class="text-sm text-gray-500">Manager: {location.manager}</p>
                {/if}
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{location.rating}/5</div>
                <div class="text-sm text-gray-600">Rating</div>
              </div>
            </div>
            
            {#if location.status === 'active'}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center">
                  <div class="text-xl font-bold text-green-600">{formatCurrency(location.revenue)}</div>
                  <div class="text-sm text-gray-600">Revenue Mensual</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-blue-600">{location.staff}</div>
                  <div class="text-sm text-gray-600">Staff</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-purple-600">{location.occupancy}%</div>
                  <div class="text-sm text-gray-600">Ocupación</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-gold">{location.rating}</div>
                  <div class="text-sm text-gray-600">Rating</div>
                </div>
              </div>
              
              <div class="mb-4">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Especialidades:</h5>
                <div class="flex flex-wrap gap-2">
                  {#each location.specialties as specialty}
                    <span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {specialty}
                    </span>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="text-center py-8">
                <div class="text-6xl mb-4">🔒</div>
                <h5 class="text-lg font-semibold text-gray-600 mb-2">Premium Location</h5>
                <p class="text-gray-500 mb-4">Upgrade to Enterprise to unlock this exclusive location</p>
                <button 
                  class="btn-enterprise"
                  on:click={() => triggerUpgrade('enterprise', 'premium_location')}
                >
                  Unlock Enterprise Features
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
  {:else if variant === 'luxury-features'}
    <!-- Luxury Features Showcase -->
    <div class="luxury-features bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
      <div class="text-center mb-8">
        <h3 class="text-3xl font-bold text-gray-900 mb-2">🏆 Luxury Features Portfolio</h3>
        <p class="text-xl text-gray-600">Características exclusivas para el mercado premium argentino</p>
      </div>
      
      <!-- Luxury Services Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {#each currentData.luxuryServices || [] as service}
          <div class="luxury-service-card bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-8 border-2 shadow-xl"
               class:border-gold={service.enabled}
               class:border-gray-200={!service.enabled}
               class:opacity-75={!service.enabled}>
            
            <div class="flex items-center justify-between mb-6">
              <h4 class="text-xl font-bold text-gray-900">{service.name}</h4>
              <div class="flex items-center space-x-2">
                {#if service.enabled}
                  <span class="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    ✅ Active
                  </span>
                {:else}
                  <span class="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                    🔒 Locked
                  </span>
                {/if}
              </div>
            </div>
            
            <p class="text-gray-600 mb-6">{service.description}</p>
            
            <div class="space-y-4 mb-6">
              <div>
                <h5 class="text-sm font-semibold text-gray-700 mb-2">Features:</h5>
                <div class="space-y-1">
                  {#each service.features as feature}
                    <div class="flex items-center space-x-2">
                      <span class="text-gold">✨</span>
                      <span class="text-sm text-gray-700">{feature}</span>
                    </div>
                  {/each}
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h6 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Client Impact</h6>
                  <p class="text-sm font-medium text-green-600">{service.clientImpact}</p>
                </div>
                <div>
                  <h6 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Revenue Impact</h6>
                  <p class="text-sm font-medium text-purple-600">{service.revenueImpact}</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
              <div class="text-lg font-bold text-gray-900">{service.pricing}</div>
              {#if !service.enabled}
                <button 
                  class="btn-enterprise"
                  on:click={() => triggerUpgrade('enterprise', service.id)}
                >
                  Unlock Feature
                </button>
              {:else}
                <button class="btn-primary">Manage</button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Argentina Premium Market Analysis -->
      <div class="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8">
        <h4 class="text-xl font-bold text-gray-900 mb-6">🇦🇷 Argentina Premium Market Intelligence</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          {#each Object.entries(currentData.argentinaPremiumMarket || {}) as [key, value]}
            <div class="text-center">
              <div class="text-lg font-bold text-purple-700 mb-2">{value}</div>
              <div class="text-sm text-gray-600 capitalize">
                {#if key === 'marketSize'}Market Size
                {:else if key === 'growthRate'}Growth Rate
                {:else if key === 'competitorAnalysis'}Competition
                {:else if key === 'opportunity'}Opportunity
                {:else if key === 'barriers'}Barriers
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

<!-- Upgrade Modal -->
{#if showUpgradeModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
    <div class="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl" transition:scale>
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🚀</div>
        <h4 class="text-xl font-bold text-gray-900 mb-2">Upgrade to Enterprise</h4>
        <p class="text-gray-600">Unlock premium features and dominate the Argentina market</p>
      </div>
      
      <div class="space-y-4 mb-6">
        <div class="flex justify-between">
          <span>Multi-location management</span>
          <span class="text-green-600">✓</span>
        </div>
        <div class="flex justify-between">
          <span>Concierge service</span>
          <span class="text-green-600">✓</span>
        </div>
        <div class="flex justify-between">
          <span>White label branding</span>
          <span class="text-green-600">✓</span>
        </div>
        <div class="flex justify-between">
          <span>Dedicated support</span>
          <span class="text-green-600">✓</span>
        </div>
      </div>
      
      <div class="flex space-x-4">
        <button 
          class="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          on:click={() => showUpgradeModal = false}
        >
          Maybe Later
        </button>
        <button 
          class="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          on:click={() => {
            handlePremiumAction('upgrade_enterprise', { reason: upgradeReason });
            showUpgradeModal = false;
          }}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .premium-experience {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .executive-dashboard {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }
  
  .premium-action-card {
    @apply p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all text-center bg-white;
  }
  
  .premium-action-card:hover {
    @apply shadow-xl transform -translate-y-1;
  }
  
  .vip-client-card {
    background: linear-gradient(135deg, #ffffff 0%, #fefefe 50%, #f9fafb 100%);
    border: 2px solid var(--gold);
  }
  
  .location-card {
    @apply relative;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }
  
  .luxury-service-card {
    background: linear-gradient(135deg, #ffffff 0%, #fefefe 50%, #f9fafb 100%);
  }
  
  .btn-primary {
    @apply inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors;
  }
  
  .btn-primary-sm {
    @apply inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors;
  }
  
  .btn-enterprise {
    @apply inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg;
  }
  
  .btn-upgrade {
    @apply inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-gold to-yellow-500 text-white text-xs font-medium rounded-lg hover:from-yellow-500 hover:to-gold transition-all;
  }
  
  .btn-concierge {
    @apply w-10 h-8 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm;
  }
</style>