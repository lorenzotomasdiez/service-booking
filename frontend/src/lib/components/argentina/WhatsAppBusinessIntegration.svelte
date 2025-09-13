<!--
  WhatsApp Business Integration Component
  Optimized for Argentina's 67% WhatsApp preference
  Supports booking notifications, customer service, and business communication
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { uxAnalytics } from '$lib/services/ux-analytics';
  
  export let businessPhone: string = '';
  export let businessName: string = 'BarberPro';
  export let enableNotifications: boolean = true;
  export let enableBookingUpdates: boolean = true;
  export let enableCustomerService: boolean = true;
  export let autoResponses: boolean = true;
  
  const dispatch = createEventDispatcher<{
    whatsappConnected: { phone: string; status: string };
    messageTemplateSelected: { template: string; context: string };
    notificationSent: { recipient: string; type: string; status: string };
    customerServiceRequested: { issue: string; priority: string };
  }>();
  
  interface MessageTemplate {
    id: string;
    name: string;
    context: 'booking' | 'reminder' | 'confirmation' | 'support' | 'promotion';
    template: string;
    variables: string[];
    usage: number;
    effectiveness: number;
  }
  
  interface WhatsAppFeature {
    id: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    usage: number;
    benefit: string;
  }
  
  // WhatsApp Business features for Argentina market
  let whatsappFeatures: WhatsAppFeature[] = [
    {
      id: 'booking_notifications',
      name: 'Notificaciones de Reserva',
      description: 'Confirmaciones automáticas por WhatsApp',
      icon: '📅',
      enabled: enableNotifications,
      usage: 89,
      benefit: 'Reduce no-shows en 45%'
    },
    {
      id: 'reminder_system',
      name: 'Sistema de Recordatorios',
      description: 'Recordatorios 24h y 2h antes del turno',
      icon: '⏰',
      enabled: true,
      usage: 92,
      benefit: 'Mejora puntualidad 67%'
    },
    {
      id: 'quick_responses',
      name: 'Respuestas Rápidas',
      description: 'Mensajes predefinidos para consultas frecuentes',
      icon: '⚡',
      enabled: autoResponses,
      usage: 78,
      benefit: 'Respuesta en <2 minutos'
    },
    {
      id: 'customer_support',
      name: 'Atención al Cliente',
      description: 'Canal directo para consultas y soporte',
      icon: '💬',
      enabled: enableCustomerService,
      usage: 85,
      benefit: '4.8/5 satisfacción'
    },
    {
      id: 'promotions',
      name: 'Promociones Exclusivas',
      description: 'Ofertas especiales via WhatsApp Business',
      icon: '🎁',
      enabled: true,
      usage: 65,
      benefit: '+23% reservas repeat'
    },
    {
      id: 'location_sharing',
      name: 'Ubicación del Local',
      description: 'Compartir ubicación y direcciones fácilmente',
      icon: '📍',
      enabled: true,
      usage: 71,
      benefit: 'Reduce llegadas tarde 38%'
    }
  ];
  
  // Argentina-specific message templates
  let messageTemplates: MessageTemplate[] = [
    {
      id: 'booking_confirmation',
      name: 'Confirmación de Reserva',
      context: 'confirmation',
      template: '¡Hola {clientName}! Tu reserva en {businessName} está confirmada para el {date} a las {time}. Servicio: {service}. ¡Te esperamos! 💈',
      variables: ['clientName', 'businessName', 'date', 'time', 'service'],
      usage: 98,
      effectiveness: 94
    },
    {
      id: 'reminder_24h',
      name: 'Recordatorio 24 horas',
      context: 'reminder',
      template: '¡Hola {clientName}! Te recordamos que mañana a las {time} tenés turno en {businessName}. Si necesitás reprogramar, respondé a este mensaje. 📅',
      variables: ['clientName', 'time', 'businessName'],
      usage: 87,
      effectiveness: 89
    },
    {
      id: 'reminder_2h',
      name: 'Recordatorio 2 horas',
      context: 'reminder',
      template: '¡{clientName}! Tu turno en {businessName} es en 2 horas ({time}). Estamos en {address}. ¡Nos vemos pronto! ✂️',
      variables: ['clientName', 'businessName', 'time', 'address'],
      usage: 91,
      effectiveness: 96
    },
    {
      id: 'welcome_message',
      name: 'Mensaje de Bienvenida',
      context: 'support',
      template: '¡Hola! Bienvenido/a a {businessName} 👋 ¿En qué podemos ayudarte hoy? Podés consultarnos sobre servicios, precios o agendar tu turno.',
      variables: ['businessName'],
      usage: 76,
      effectiveness: 88
    },
    {
      id: 'promotion_offer',
      name: 'Oferta Promocional',
      context: 'promotion',
      template: '🔥 ¡Oferta exclusiva para vos! {promotion} válida hasta el {expiryDate}. Reservá tu turno respondiendo "QUIERO" a este mensaje.',
      variables: ['promotion', 'expiryDate'],
      usage: 45,
      effectiveness: 67
    }
  ];
  
  // Usage statistics (based on Day 6 data)
  let whatsappStats = {
    totalMessages: 156,
    responseRate: 97,
    averageResponseTime: '3.2 minutos',
    customerSatisfaction: 4.8,
    bookingConversions: 34,
    activeChats: 23
  };
  
  let selectedTemplate = '';
  let customMessage = '';
  let showTemplateEditor = false;
  let connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'connected';
  
  onMount(() => {
    initializeWhatsAppAPI();
    trackWhatsAppUsage();
  });
  
  function initializeWhatsAppAPI() {
    // Simulate WhatsApp Business API connection
    connectionStatus = 'connecting';
    
    setTimeout(() => {
      connectionStatus = 'connected';
      dispatch('whatsappConnected', {
        phone: businessPhone,
        status: 'connected'
      });
    }, 2000);
  }
  
  function trackWhatsAppUsage() {
    uxAnalytics.trackExternalEvent('whatsapp_integration_viewed', {
      businessPhone,
      features_enabled: whatsappFeatures.filter(f => f.enabled).length,
      timestamp: Date.now()
    });
  }
  
  function toggleFeature(featureId: string) {
    const feature = whatsappFeatures.find(f => f.id === featureId);
    if (feature) {
      feature.enabled = !feature.enabled;
      
      uxAnalytics.trackExternalEvent('whatsapp_feature_toggled', {
        feature: featureId,
        enabled: feature.enabled,
        timestamp: Date.now()
      });
    }
  }
  
  function selectTemplate(templateId: string) {
    selectedTemplate = templateId;
    const template = messageTemplates.find(t => t.id === templateId);
    
    if (template) {
      dispatch('messageTemplateSelected', {
        template: templateId,
        context: template.context
      });
      
      uxAnalytics.trackExternalEvent('whatsapp_template_selected', {
        template: templateId,
        context: template.context,
        effectiveness: template.effectiveness,
        timestamp: Date.now()
      });
    }
  }
  
  function sendCustomMessage() {
    if (customMessage.trim()) {
      // Simulate sending message
      dispatch('notificationSent', {
        recipient: 'customer',
        type: 'custom',
        status: 'sent'
      });
      
      uxAnalytics.trackExternalEvent('whatsapp_custom_message_sent', {
        messageLength: customMessage.length,
        timestamp: Date.now()
      });
      
      customMessage = '';
    }
  }
  
  function requestCustomerService(issue: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    dispatch('customerServiceRequested', { issue, priority });
    
    uxAnalytics.trackExternalEvent('whatsapp_support_requested', {
      issue,
      priority,
      timestamp: Date.now()
    });
  }
  
  function formatPhoneNumber(phone: string): string {
    // Format Argentina phone number
    if (phone.startsWith('+54')) {
      return phone;
    }
    return `+54 ${phone}`;
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
  
  function getStatusIcon(status: string): string {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚫';
    }
  }
</script>

<div class="whatsapp-integration bg-white rounded-xl shadow-lg border border-gray-200">
  <!-- Header with Connection Status -->
  <div class="border-b border-gray-200 p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          📱
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">WhatsApp Business</h3>
          <p class="text-sm text-gray-600">Preferido por 67% de usuarios argentinos</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <span class="text-2xl">{getStatusIcon(connectionStatus)}</span>
        <div class="text-right">
          <div class="{getStatusColor(connectionStatus)} text-sm font-medium capitalize">
            {connectionStatus === 'connecting' ? 'Conectando...' : 
             connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
          </div>
          {#if businessPhone}
            <div class="text-xs text-gray-500">{formatPhoneNumber(businessPhone)}</div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- WhatsApp Statistics Dashboard -->
  <div class="p-6 bg-gradient-to-r from-green-50 to-blue-50">
    <h4 class="text-base font-semibold text-gray-900 mb-4">Estadísticas de WhatsApp</h4>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{whatsappStats.totalMessages}</div>
        <div class="text-xs text-gray-600">Mensajes Totales</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{whatsappStats.responseRate}%</div>
        <div class="text-xs text-gray-600">Tasa Respuesta</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600">{whatsappStats.averageResponseTime}</div>
        <div class="text-xs text-gray-600">Tiempo Respuesta</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600">{whatsappStats.bookingConversions}</div>
        <div class="text-xs text-gray-600">Reservas por WhatsApp</div>
      </div>
    </div>
  </div>

  <!-- Features Configuration -->
  <div class="p-6">
    <h4 class="text-base font-semibold text-gray-900 mb-4">Funciones Disponibles</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each whatsappFeatures as feature}
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="text-2xl">{feature.icon}</div>
              <div>
                <h5 class="font-medium text-gray-900">{feature.name}</h5>
                <p class="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
            
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={feature.enabled}
                on:change={() => toggleFeature(feature.id)}
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Uso: {feature.usage}%</span>
            <span class="text-green-600 font-medium">{feature.benefit}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Message Templates -->
  <div class="p-6 border-t border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-base font-semibold text-gray-900">Plantillas de Mensajes</h4>
      <button
        type="button"
        on:click={() => showTemplateEditor = !showTemplateEditor}
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showTemplateEditor ? 'Ocultar' : 'Personalizar'}
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each messageTemplates as template}
        <div
          class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-sm transition-all"
          class:border-blue-500={selectedTemplate === template.id}
          class:bg-blue-50={selectedTemplate === template.id}
          on:click={() => selectTemplate(template.id)}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && selectTemplate(template.id)}
        >
          <div class="flex items-center justify-between mb-2">
            <h5 class="font-medium text-gray-900">{template.name}</h5>
            <div class="flex items-center space-x-2">
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {template.usage}% uso
              </span>
              <span class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                {template.effectiveness}% efectivo
              </span>
            </div>
          </div>
          
          <p class="text-sm text-gray-600 mb-3 italic">"{template.template}"</p>
          
          <div class="flex flex-wrap gap-1">
            {#each template.variables as variable}
              <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {variable}
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Custom Message Composer -->
  {#if showTemplateEditor}
    <div class="p-6 border-t border-gray-200 bg-gray-50" transition:slide={{ duration: 300 }}>
      <h5 class="text-sm font-semibold text-gray-900 mb-3">Mensaje Personalizado</h5>
      <div class="space-y-4">
        <textarea
          bind:value={customMessage}
          placeholder="Escribí tu mensaje personalizado para los clientes..."
          rows="4"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        ></textarea>
        
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Caracteres: {customMessage.length}/1000
          </div>
          <button
            type="button"
            on:click={sendCustomMessage}
            disabled={!customMessage.trim()}
            class="btn btn-sm btn-primary"
            class:opacity-50={!customMessage.trim()}
            class:cursor-not-allowed={!customMessage.trim()}
          >
            Enviar Mensaje
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Quick Actions -->
  <div class="p-6 border-t border-gray-200">
    <h5 class="text-sm font-semibold text-gray-900 mb-3">Acciones Rápidas</h5>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        type="button"
        on:click={() => requestCustomerService('general_inquiry')}
        class="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span class="text-lg">💬</span>
        <div class="text-left">
          <div class="text-sm font-medium text-gray-900">Atención Cliente</div>
          <div class="text-xs text-gray-600">Canal de soporte directo</div>
        </div>
      </button>
      
      <button
        type="button"
        on:click={() => selectTemplate('reminder_24h')}
        class="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span class="text-lg">⏰</span>
        <div class="text-left">
          <div class="text-sm font-medium text-gray-900">Recordatorio</div>
          <div class="text-xs text-gray-600">Enviar recordatorio turno</div>
        </div>
      </button>
      
      <button
        type="button"
        on:click={() => selectTemplate('promotion_offer')}
        class="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span class="text-lg">🎁</span>
        <div class="text-left">
          <div class="text-sm font-medium text-gray-900">Promoción</div>
          <div class="text-xs text-gray-600">Enviar oferta especial</div>
        </div>
      </button>
    </div>
  </div>

  <!-- Argentina Market Insights -->
  <div class="p-6 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
    <h5 class="text-sm font-semibold text-gray-900 mb-3">💡 Insights del Mercado Argentino</h5>
    <div class="space-y-2 text-sm text-gray-700">
      <p>• 67% de usuarios prefiere comunicarse por WhatsApp</p>
      <p>• Horario pico de mensajes: 10-12hs y 17-19hs (evitar siesta)</p>
      <p>• Respuestas en <5 minutos aumentan reservas 34%</p>
      <p>• Emojis y tono informal generan +23% engagement</p>
      <p>• Recordatorios reducen no-shows del 25% al 8%</p>
    </div>
  </div>
</div>