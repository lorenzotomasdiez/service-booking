<!--
  Advanced Design System - Day 8 Design System Enhancement
  Sophisticated provider dashboard patterns, notifications, and business intelligence displays
  Group booking, family plans, and premium subscription interfaces
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { fade, fly, scale } from 'svelte/transition';
  
  export let theme: 'barber' | 'psychology' | 'medical' = 'barber';
  export let variant: 'dashboard' | 'notifications' | 'business-intelligence' | 'group-booking' | 'premium-subscription' = 'dashboard';
  export let dataSource: any = null;
  export let argentinaOptimized: boolean = true;
  
  const dispatch = createEventDispatcher<{
    componentInteraction: { component: string; action: string; data: any };
    designSystemUpdate: { component: string; changes: any };
  }>();
  
  // Advanced design tokens for different verticals
  const designTokens = {
    barber: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      surface: '#f8fafc',
      text: '#1e293b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'from-blue-500 to-indigo-600'
    },
    psychology: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      surface: '#f0fdf4',
      text: '#14532d',
      success: '#22c55e',
      warning: '#eab308',
      error: '#dc2626',
      gradient: 'from-green-500 to-emerald-600'
    },
    medical: {
      primary: '#0891b2',
      secondary: '#0e7490',
      accent: '#06b6d4',
      surface: '#f0f9ff',
      text: '#164e63',
      success: '#06b6d4',
      warning: '#f97316',
      error: '#dc2626',
      gradient: 'from-cyan-500 to-blue-600'
    }
  };
  
  // Argentina-specific design patterns
  const argentinaPatterns = {
    currency: {
      symbol: '$',
      decimals: 0,
      thousands: '.',
      format: (amount: number) => `$${amount.toLocaleString('es-AR')}`
    },
    scheduling: {
      siestaHours: { start: 13, end: 15 },
      preferredTimes: ['10:00-12:00', '17:00-19:00'],
      weekendActivity: { saturday: 0.65, sunday: 0.3 }
    },
    communication: {
      whatsappPreference: 67,
      emailUsage: 25,
      smsUsage: 8
    },
    payment: {
      mercadopagoUsage: 92,
      cashUsage: 8,
      preferredInstallments: [3, 6, 12]
    }
  };
  
  // Component state
  let currentTokens = designTokens[theme];
  let componentData = writable({});
  
  onMount(() => {
    initializeComponent();
  });
  
  function initializeComponent() {
    // Initialize component based on variant
    switch (variant) {
      case 'dashboard':
        initializeDashboard();
        break;
      case 'notifications':
        initializeNotifications();
        break;
      case 'business-intelligence':
        initializeBusinessIntelligence();
        break;
      case 'group-booking':
        initializeGroupBooking();
        break;
      case 'premium-subscription':
        initializePremiumSubscription();
        break;
    }
  }
  
  function initializeDashboard() {
    componentData.set({
      metrics: {
        revenue: { value: 28500, change: 12.5, period: 'mes' },
        bookings: { value: 156, change: 8.3, period: 'mes' },
        clients: { value: 89, change: 15.2, period: 'mes' },
        rating: { value: 4.8, change: 0.2, period: 'mes' }
      },
      quickActions: [
        { id: 'schedule', label: 'Ver Agenda', icon: '📅', urgent: false },
        { id: 'messages', label: 'Mensajes WhatsApp', icon: '💬', urgent: true, count: 3 },
        { id: 'payments', label: 'Pagos Pendientes', icon: '💳', urgent: false },
        { id: 'clients', label: 'Nuevos Clientes', icon: '👥', urgent: false }
      ],
      recentActivity: [
        { type: 'booking', client: 'María González', service: 'Corte + Barba', time: '10:30', status: 'confirmed' },
        { type: 'payment', amount: 3500, method: 'MercadoPago', status: 'completed' },
        { type: 'review', client: 'Carlos Mendez', rating: 5, comment: 'Excelente servicio como siempre' }
      ]
    });
  }
  
  function initializeNotifications() {
    componentData.set({
      notifications: [
        {
          id: 1,
          type: 'booking',
          title: 'Nueva Reserva',
          message: 'Sofia Martinez reservó Corte Clásico para mañana 15:30',
          timestamp: Date.now() - 300000,
          read: false,
          priority: 'high',
          actions: [{ label: 'Confirmar', action: 'confirm' }, { label: 'Ver Detalles', action: 'view' }]
        },
        {
          id: 2,
          type: 'payment',
          title: 'Pago Recibido',
          message: 'Pago de $4,200 procesado via MercadoPago',
          timestamp: Date.now() - 900000,
          read: true,
          priority: 'medium',
          actions: [{ label: 'Ver Comprobante', action: 'receipt' }]
        },
        {
          id: 3,
          type: 'system',
          title: 'Actualización Disponible',
          message: 'Nueva versión con mejoras para Argentina disponible',
          timestamp: Date.now() - 3600000,
          read: false,
          priority: 'low',
          actions: [{ label: 'Actualizar', action: 'update' }]
        }
      ],
      settings: {
        whatsapp: true,
        email: true,
        push: true,
        sms: false
      }
    });
  }
  
  function initializeBusinessIntelligence() {
    componentData.set({
      analytics: {
        revenue: {
          current: 28500,
          previous: 25200,
          trend: 'up',
          projection: 32000
        },
        clientInsights: {
          newClients: 12,
          returning: 78,
          retention: 67,
          averageValue: 4200
        },
        performance: {
          bookingRate: 89,
          completionRate: 96,
          noShowRate: 4,
          reschedulingRate: 8
        },
        marketPosition: {
          rank: 'Top 15%',
          competitors: 23,
          rating: 4.8,
          reviews: 145
        }
      },
      recommendations: [
        {
          type: 'pricing',
          title: 'Optimización de Precios',
          description: 'Considera aumentar precios en horarios pico (17-19h)',
          impact: '+15% ingresos',
          priority: 'high'
        },
        {
          type: 'marketing',
          title: 'Promoción Fin de Semana',
          description: 'Los sábados tienen baja ocupación (65%)',
          impact: '+25% reservas sábados',
          priority: 'medium'
        }
      ]
    });
  }
  
  function initializeGroupBooking() {
    componentData.set({
      groupTypes: [
        {
          id: 'family',
          name: 'Plan Familiar',
          description: 'Para familias de 3+ personas',
          discount: 15,
          icon: '👨‍👩‍👧‍👦',
          minPeople: 3,
          maxPeople: 6
        },
        {
          id: 'couple',
          name: 'Plan Pareja',
          description: 'Servicios coordinados para parejas',
          discount: 10,
          icon: '💑',
          minPeople: 2,
          maxPeople: 2
        },
        {
          id: 'friends',
          name: 'Grupo de Amigos',
          description: 'Para grupos de amigos',
          discount: 12,
          icon: '👥',
          minPeople: 3,
          maxPeople: 8
        }
      ],
      activeBooking: null,
      calculatedDiscount: 0,
      totalPrice: 0
    });
  }
  
  function initializePremiumSubscription() {
    componentData.set({
      tiers: [
        {
          id: 'basic',
          name: 'Básico',
          price: 1999,
          period: 'mes',
          description: 'Perfecto para empezar',
          features: [
            'Agenda digital',
            'Pagos con MercadoPago',
            'Soporte WhatsApp',
            'Hasta 50 clientes'
          ],
          limitations: ['Sin analytics avanzados', 'Promociones limitadas'],
          popular: false
        },
        {
          id: 'professional',
          name: 'Profesional',
          price: 3999,
          period: 'mes',
          description: 'Para profesionales establecidos',
          features: [
            'Todo lo del plan Básico',
            'Analytics avanzados',
            'Marketing automático',
            'Clientes ilimitados',
            'Integraciones premium',
            'Soporte prioritario'
          ],
          limitations: [],
          popular: true
        },
        {
          id: 'enterprise',
          name: 'Empresa',
          price: 7999,
          period: 'mes',
          description: 'Para cadenas y múltiples ubicaciones',
          features: [
            'Todo lo del plan Profesional',
            'Múltiples ubicaciones',
            'Gestión de staff',
            'Reportes ejecutivos',
            'API personalizada',
            'Gerente de cuenta'
          ],
          limitations: [],
          popular: false
        }
      ],
      benefits: {
        analytics: 'Insights de negocio que aumentan ingresos 25%',
        marketing: 'Herramientas que atraen 40% más clientes',
        automation: 'Ahorra 10 horas semanales en gestión',
        support: 'Soporte en español 24/7 via WhatsApp'
      }
    });
  }
  
  function handleInteraction(component: string, action: string, data: any = {}) {
    dispatch('componentInteraction', { component, action, data });
  }
  
  function formatCurrency(amount: number): string {
    return argentinaOptimized 
      ? argentinaPatterns.currency.format(amount)
      : `$${amount.toLocaleString()}`;
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
  
  $: currentData = $componentData;
</script>

<div class="advanced-design-system" style="--primary: {currentTokens.primary}; --secondary: {currentTokens.secondary}; --accent: {currentTokens.accent}; --surface: {currentTokens.surface}; --text: {currentTokens.text}">
  
  {#if variant === 'dashboard'}
    <!-- Sophisticated Provider Dashboard -->
    <div class="dashboard-container bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold" style="color: var(--text)">Panel de Control</h2>
          <p class="text-gray-600">Gestiona tu negocio desde un solo lugar</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <span class="text-green-700 text-sm font-medium">● En línea</span>
          </div>
          <button class="btn btn-primary">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Nueva Cita
          </button>
        </div>
      </div>
      
      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {#each Object.entries(currentData.metrics || {}) as [key, metric]}
          <div class="bg-gradient-to-br {currentTokens.gradient} bg-opacity-10 rounded-lg p-4 border border-opacity-20 border-gray-300">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600 capitalize">
                {#if key === 'revenue'}Ingresos
                {:else if key === 'bookings'}Reservas
                {:else if key === 'clients'}Clientes
                {:else if key === 'rating'}Calificación
                {:else}{key}{/if}
              </span>
              <span class="text-xs text-green-600 font-medium">+{metric.change}%</span>
            </div>
            <div class="text-2xl font-bold" style="color: var(--primary)">
              {#if key === 'revenue'}{formatCurrency(metric.value)}
              {:else if key === 'rating'}{metric.value}/5
              {:else}{metric.value}
              {/if}
            </div>
            <div class="text-xs text-gray-500">Este {metric.period}</div>
          </div>
        {/each}
      </div>
      
      <!-- Quick Actions -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          {#each currentData.quickActions || [] as action}
            <button 
              class="relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
              class:border-red-300={action.urgent}
              class:bg-red-50={action.urgent}
              on:click={() => handleInteraction('dashboard', 'quick_action', action)}
            >
              {#if action.urgent && action.count}
                <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {action.count}
                </span>
              {/if}
              <div class="text-2xl mb-2">{action.icon}</div>
              <div class="text-sm font-medium text-gray-900">{action.label}</div>
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <div class="space-y-3">
          {#each currentData.recentActivity || [] as activity}
            <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div class="w-8 h-8 rounded-full flex items-center justify-center"
                   class:bg-blue-100={activity.type === 'booking'}
                   class:bg-green-100={activity.type === 'payment'}
                   class:bg-yellow-100={activity.type === 'review'}>
                <span class="text-sm">
                  {#if activity.type === 'booking'}📅
                  {:else if activity.type === 'payment'}💳
                  {:else if activity.type === 'review'}⭐
                  {/if}
                </span>
              </div>
              <div class="flex-1">
                {#if activity.type === 'booking'}
                  <p class="text-sm font-medium text-gray-900">
                    <span class="font-semibold">{activity.client}</span> - {activity.service}
                  </p>
                  <p class="text-xs text-gray-600">{activity.time} • {activity.status}</p>
                {:else if activity.type === 'payment'}
                  <p class="text-sm font-medium text-gray-900">
                    Pago recibido: {formatCurrency(activity.amount)}
                  </p>
                  <p class="text-xs text-gray-600">{activity.method} • {activity.status}</p>
                {:else if activity.type === 'review'}
                  <p class="text-sm font-medium text-gray-900">
                    <span class="font-semibold">{activity.client}</span> • {activity.rating}⭐
                  </p>
                  <p class="text-xs text-gray-600">"{activity.comment}"</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
  {:else if variant === 'notifications'}
    <!-- Advanced Notification Center -->
    <div class="notifications-container bg-white rounded-xl shadow-lg border border-gray-100">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Notificaciones</h3>
          <div class="flex items-center space-x-2">
            <button class="text-sm text-blue-600 hover:text-blue-800">Marcar todas como leídas</button>
            <button class="p-2 text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Notifications List -->
      <div class="divide-y divide-gray-100">
        {#each currentData.notifications || [] as notification}
          <div class="p-4 hover:bg-gray-50 transition-colors"
               class:bg-blue-50={!notification.read}
               class:border-l-4={notification.priority === 'high'}
               class:border-red-400={notification.priority === 'high'}
               class:border-yellow-400={notification.priority === 'medium'}>
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                   class:bg-blue-100={notification.type === 'booking'}
                   class:bg-green-100={notification.type === 'payment'}
                   class:bg-gray-100={notification.type === 'system'}>
                <span class="text-sm">
                  {#if notification.type === 'booking'}📅
                  {:else if notification.type === 'payment'}💳
                  {:else}⚙️
                  {/if}
                </span>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-sm font-medium text-gray-900">{notification.title}</h4>
                  <span class="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                {#if notification.actions && notification.actions.length > 0}
                  <div class="flex space-x-2">
                    {#each notification.actions as action}
                      <button 
                        class="text-xs px-3 py-1 rounded-full border"
                        class:bg-blue-50={action.action === 'confirm'}
                        class:border-blue-200={action.action === 'confirm'}
                        class:text-blue-700={action.action === 'confirm'}
                        class:bg-gray-50={action.action !== 'confirm'}
                        class:border-gray-200={action.action !== 'confirm'}
                        class:text-gray-700={action.action !== 'confirm'}
                        on:click={() => handleInteraction('notifications', action.action, notification)}
                      >
                        {action.label}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
              
              {#if !notification.read}
                <div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Settings Footer -->
      <div class="p-4 border-t border-gray-100 bg-gray-50">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">Preferencias de Notificación</span>
          <div class="flex space-x-4">
            {#each Object.entries(currentData.settings || {}) as [method, enabled]}
              <label class="flex items-center space-x-2">
                <input type="checkbox" class="form-checkbox h-4 w-4 text-blue-600" checked={enabled}>
                <span class="text-sm text-gray-600 capitalize">
                  {#if method === 'whatsapp'}WhatsApp
                  {:else if method === 'email'}Email
                  {:else if method === 'push'}Push
                  {:else if method === 'sms'}SMS
                  {:else}{method}
                  {/if}
                </span>
              </label>
            {/each}
          </div>
        </div>
      </div>
    </div>
    
  {:else if variant === 'business-intelligence'}
    <!-- Business Intelligence Display -->
    <div class="business-intelligence bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 class="text-xl font-bold text-gray-900 mb-6">Inteligencia de Negocio</h3>
      
      <!-- Analytics Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {#each Object.entries(currentData.analytics || {}) as [category, data]}
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <h4 class="text-sm font-semibold text-gray-700 mb-3 capitalize">
              {#if category === 'revenue'}Ingresos
              {:else if category === 'clientInsights'}Clientes
              {:else if category === 'performance'}Rendimiento
              {:else if category === 'marketPosition'}Posición
              {:else}{category}
              {/if}
            </h4>
            
            <div class="space-y-2">
              {#each Object.entries(data) as [key, value]}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 capitalize">
                    {#if key === 'current'}Actual
                    {:else if key === 'previous'}Anterior
                    {:else if key === 'newClients'}Nuevos
                    {:else if key === 'returning'}Recurrentes
                    {:else if key === 'retention'}Retención
                    {:else if key === 'averageValue'}Promedio
                    {:else if key === 'bookingRate'}Reservas
                    {:else if key === 'completionRate'}Completadas
                    {:else if key === 'noShowRate'}No Show
                    {:else if key === 'reschedulingRate'}Reprogramadas
                    {:else if key === 'rank'}Ranking
                    {:else if key === 'competitors'}Competidores
                    {:else if key === 'rating'}Calificación
                    {:else if key === 'reviews'}Reseñas
                    {:else}{key}
                    {/if}
                  </span>
                  <span class="font-medium" style="color: var(--primary)">
                    {#if typeof value === 'number' && (key.includes('Rate') || key === 'retention')}{value}%
                    {:else if typeof value === 'number' && (key === 'current' || key === 'previous' || key === 'averageValue')}{formatCurrency(value)}
                    {:else if key === 'rating'}{value}/5
                    {:else}{value}
                    {/if}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Recommendations -->
      <div>
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Recomendaciones Inteligentes</h4>
        <div class="space-y-4">
          {#each currentData.recommendations || [] as rec}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                 class:border-red-300={rec.priority === 'high'}
                 class:bg-red-50={rec.priority === 'high'}
                 class:border-yellow-300={rec.priority === 'medium'}
                 class:bg-yellow-50={rec.priority === 'medium'}>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <h5 class="font-medium text-gray-900">{rec.title}</h5>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          class:bg-red-100={rec.priority === 'high'}
                          class:text-red-800={rec.priority === 'high'}
                          class:bg-yellow-100={rec.priority === 'medium'}
                          class:text-yellow-800={rec.priority === 'medium'}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <p class="text-sm font-medium text-green-700">{rec.impact}</p>
                </div>
                <button class="btn btn-sm btn-primary ml-4"
                        on:click={() => handleInteraction('business-intelligence', 'apply_recommendation', rec)}>
                  Aplicar
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
  {:else if variant === 'group-booking'}
    <!-- Group Booking Interface -->
    <div class="group-booking bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div class="text-center mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-2">Reservas Grupales</h3>
        <p class="text-gray-600">Descuentos especiales para grupos y familias</p>
      </div>
      
      <!-- Group Types -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {#each currentData.groupTypes || [] as groupType}
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
               class:border-blue-300={currentData.activeBooking?.id === groupType.id}
               class:bg-blue-50={currentData.activeBooking?.id === groupType.id}
               on:click={() => handleInteraction('group-booking', 'select_type', groupType)}>
            <div class="text-center">
              <div class="text-4xl mb-3">{groupType.icon}</div>
              <h4 class="font-semibold text-gray-900 mb-2">{groupType.name}</h4>
              <p class="text-sm text-gray-600 mb-3">{groupType.description}</p>
              
              <div class="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium mb-2">
                {groupType.discount}% DESCUENTO
              </div>
              
              <div class="text-xs text-gray-500">
                {groupType.minPeople}-{groupType.maxPeople} personas
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Booking Calculator -->
      {#if currentData.activeBooking}
        <div class="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
          <h4 class="font-semibold text-gray-900 mb-3">Calculadora de Grupo</h4>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Número de Personas</label>
              <select class="w-full p-2 border border-gray-300 rounded-lg">
                {#each Array(currentData.activeBooking.maxPeople - currentData.activeBooking.minPeople + 1) as _, i}
                  <option value={currentData.activeBooking.minPeople + i}>
                    {currentData.activeBooking.minPeople + i} personas
                  </option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Servicio Base</label>
              <select class="w-full p-2 border border-gray-300 rounded-lg">
                <option value="4200">Corte Clásico - $4,200</option>
                <option value="5500">Corte + Barba - $5,500</option>
                <option value="7200">Combo Completo - $7,200</option>
              </select>
            </div>
          </div>
          
          <!-- Price Breakdown -->
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Precio individual:</span>
                <span>$4,200</span>
              </div>
              <div class="flex justify-between">
                <span>Subtotal (3 personas):</span>
                <span>$12,600</span>
              </div>
              <div class="flex justify-between text-green-600">
                <span>Descuento {currentData.activeBooking.discount}%:</span>
                <span>-$1,890</span>
              </div>
              <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
                <span>Total Final:</span>
                <span style="color: var(--primary)">$10,710</span>
              </div>
              <div class="text-xs text-gray-500 text-center">
                Ahorro total: $1,890 • Por persona: $3,570
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Argentina Family Plan Special -->
      <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="text-2xl">🇦🇷</div>
          <div>
            <h4 class="font-semibold text-gray-900">Plan Familiar Argentino</h4>
            <p class="text-sm text-gray-600">Descuento especial para familias. Incluye servicio a domicilio en CABA.</p>
          </div>
        </div>
      </div>
    </div>
    
  {:else if variant === 'premium-subscription'}
    <!-- Premium Subscription Interface -->
    <div class="premium-subscription bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div class="text-center mb-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Planes Premium</h3>
        <p class="text-gray-600">Impulsa tu negocio con herramientas profesionales</p>
      </div>
      
      <!-- Pricing Tiers -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {#each currentData.tiers || [] as tier}
          <div class="relative border rounded-xl p-6 transition-all hover:shadow-lg"
               class:border-blue-300={tier.popular}
               class:shadow-lg={tier.popular}
               class:bg-blue-50={tier.popular}>
            
            {#if tier.popular}
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span class="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
            {/if}
            
            <div class="text-center mb-6">
              <h4 class="text-xl font-bold text-gray-900 mb-2">{tier.name}</h4>
              <p class="text-gray-600 text-sm mb-4">{tier.description}</p>
              
              <div class="text-3xl font-bold mb-1" style="color: var(--primary)">
                {formatCurrency(tier.price)}
              </div>
              <div class="text-sm text-gray-500">por {tier.period}</div>
            </div>
            
            <!-- Features -->
            <div class="space-y-3 mb-6">
              {#each tier.features as feature}
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm text-gray-700">{feature}</span>
                </div>
              {/each}
              
              {#each tier.limitations as limitation}
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm text-gray-500">{limitation}</span>
                </div>
              {/each}
            </div>
            
            <button 
              class="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              class:bg-blue-600={tier.popular}
              class:text-white={tier.popular}
              class:hover:bg-blue-700={tier.popular}
              class:border={!tier.popular}
              class:border-gray-300={!tier.popular}
              class:hover:border-gray-400={!tier.popular}
              on:click={() => handleInteraction('premium-subscription', 'select_plan', tier)}
            >
              {tier.popular ? 'Comenzar Ahora' : 'Seleccionar Plan'}
            </button>
          </div>
        {/each}
      </div>
      
      <!-- Benefits Highlight -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h4 class="font-semibold text-gray-900 mb-4">¿Por qué elegir BarberPro Premium?</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each Object.entries(currentData.benefits || {}) as [key, benefit]}
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span class="text-sm">
                  {#if key === 'analytics'}📊
                  {:else if key === 'marketing'}📈
                  {:else if key === 'automation'}⚡
                  {:else if key === 'support'}🎧
                  {:else}✨
                  {/if}
                </span>
              </div>
              <div>
                <h5 class="font-medium text-gray-900 capitalize mb-1">
                  {#if key === 'analytics'}Analytics Avanzados
                  {:else if key === 'marketing'}Marketing Automático
                  {:else if key === 'automation'}Automatización
                  {:else if key === 'support'}Soporte Premium
                  {:else}{key}
                  {/if}
                </h5>
                <p class="text-sm text-gray-600">{benefit}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .advanced-design-system {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply text-white shadow-sm focus:ring-blue-500;
    background-color: var(--primary);
  }
  
  .btn-primary:hover {
    @apply shadow-md;
    background-color: var(--secondary);
  }
  
  .btn-secondary {
    @apply text-gray-700 bg-white border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-gray-500;
  }
  
  .btn-sm {
    @apply px-3 py-1.5 text-xs;
  }
  
  .form-checkbox {
    @apply rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
  }
</style>