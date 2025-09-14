<script lang="ts">
  // Customer Support Interface Component
  // F11-001: Customer Experience Platform - Customer Success & Support Interface
  
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, slide, fly } from 'svelte/transition';
  import customerSuccessService from '../../services/customer-success';
  import type {
    CustomerSupportTicket,
    CustomerSupportMessage,
    CustomerHealthScore,
    CustomerSuccessRecommendation,
    SupportTicketFormData,
    FeedbackFormData
  } from '../../types/customer-experience';
  
  const dispatch = createEventDispatcher();
  
  export let userId: string;
  export let isProvider: boolean = false;
  
  let activeTab: 'tickets' | 'chat' | 'health' | 'feedback' = 'tickets';
  let tickets: CustomerSupportTicket[] = [];
  let healthScore: CustomerHealthScore | null = null;
  let recommendations: CustomerSuccessRecommendation[] = [];
  let isLoading = false;
  let error: string | null = null;
  
  // Ticket creation
  let showCreateTicket = false;
  let newTicketData: SupportTicketFormData = {
    type: 'general',
    priority: 'medium',
    title: '',
    description: '',
    attachments: []
  };
  
  // Chat functionality
  let selectedTicket: CustomerSupportTicket | null = null;
  let newMessage = '';
  let messageAttachments: File[] = [];
  
  // Feedback
  let showFeedback = false;
  let feedbackData: FeedbackFormData = {
    type: 'suggestion',
    comment: '',
    category: 'general',
    allowContact: true
  };
  
  const ticketTypes = [
    { value: 'technical', label: 'Problema Técnico', icon: '⚙️' },
    { value: 'billing', label: 'Facturación', icon: '💳' },
    { value: 'booking', label: 'Reservas', icon: '📅' },
    { value: 'general', label: 'Consulta General', icon: '❓' },
    { value: 'feature_request', label: 'Solicitud de Funcionalidad', icon: '💡' }
  ];
  
  const priorityLevels = [
    { value: 'low', label: 'Baja', color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: 'Media', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'high', label: 'Alta', color: 'text-red-600 bg-red-100' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-800 bg-red-200' }
  ];
  
  onMount(async () => {
    await loadSupportData();
    
    // Subscribe to real-time updates
    const unsubscribe = customerSuccessService.subscribeToCustomerUpdates(
      userId,
      handleRealtimeUpdate
    );
    
    return () => {
      unsubscribe();
    };
  });
  
  async function loadSupportData() {
    isLoading = true;
    error = null;
    
    try {
      const [ticketsData, healthData, recommendationsData] = await Promise.all([
        customerSuccessService.getSupportTickets(userId),
        customerSuccessService.getCustomerHealthScore(userId),
        customerSuccessService.getCustomerRecommendations(userId)
      ]);
      
      tickets = ticketsData;
      healthScore = healthData;
      recommendations = recommendationsData;
    } catch (err) {
      error = 'Error al cargar la información de soporte';
      console.error('Support data loading error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  function handleRealtimeUpdate(event: any) {
    switch (event.type) {
      case 'support:ticket_created':
        tickets = [event.ticket, ...tickets];
        break;
      case 'support:ticket_updated':
        tickets = tickets.map(ticket => 
          ticket.id === event.ticketId 
            ? { ...ticket, status: event.status, assignedTo: event.assignedTo }
            : ticket
        );
        break;
      case 'customer:health_score_changed':
        if (healthScore) {
          healthScore.score = event.newScore;
          healthScore.risk = event.risk;
        }
        break;
    }
  }
  
  async function createTicket() {
    if (!newTicketData.title.trim() || !newTicketData.description.trim()) {
      return;
    }
    
    try {
      const ticket = await customerSuccessService.createSupportTicket(newTicketData);
      tickets = [ticket, ...tickets];
      
      // Reset form
      newTicketData = {
        type: 'general',
        priority: 'medium',
        title: '',
        description: '',
        attachments: []
      };
      showCreateTicket = false;
      
      dispatch('ticket-created', { ticket });
    } catch (err) {
      error = 'Error al crear el ticket';
      console.error('Ticket creation error:', err);
    }
  }
  
  async function sendMessage() {
    if (!selectedTicket || !newMessage.trim()) {
      return;
    }
    
    try {
      const message = await customerSuccessService.addTicketMessage(
        selectedTicket.id,
        newMessage,
        messageAttachments
      );
      
      selectedTicket.messages = [...selectedTicket.messages, message];
      newMessage = '';
      messageAttachments = [];
      
      // Update tickets list
      tickets = tickets.map(ticket => 
        ticket.id === selectedTicket.id ? selectedTicket : ticket
      );
    } catch (err) {
      error = 'Error al enviar el mensaje';
      console.error('Message send error:', err);
    }
  }
  
  async function submitFeedback() {
    if (!feedbackData.comment.trim()) {
      return;
    }
    
    try {
      await customerSuccessService.submitFeedback(feedbackData);
      
      // Reset form
      feedbackData = {
        type: 'suggestion',
        comment: '',
        category: 'general',
        allowContact: true
      };
      showFeedback = false;
      
      dispatch('feedback-submitted');
    } catch (err) {
      error = 'Error al enviar el feedback';
      console.error('Feedback submission error:', err);
    }
  }
  
  function handleFileUpload(event: Event, type: 'ticket' | 'message') {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    
    if (type === 'ticket') {
      newTicketData.attachments = [...newTicketData.attachments, ...validFiles];
    } else {
      messageAttachments = [...messageAttachments, ...validFiles];
    }
  }
  
  function removeAttachment(index: number, type: 'ticket' | 'message') {
    if (type === 'ticket') {
      newTicketData.attachments = newTicketData.attachments.filter((_, i) => i !== index);
    } else {
      messageAttachments = messageAttachments.filter((_, i) => i !== index);
    }
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  function getHealthScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="max-w-6xl mx-auto p-4">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Centro de Soporte</h1>
    <p class="text-gray-600">Estamos aquí para ayudarte. Encuentra respuestas rápidas o contacta con nuestro equipo.</p>
  </div>
  
  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" transition:slide>
      <div class="flex items-center">
        <div class="text-red-600 mr-3">⚠️</div>
        <div class="text-red-700">{error}</div>
        <button 
          on:click={() => error = null}
          class="ml-auto text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Tab Navigation -->
  <div class="border-b border-gray-200 mb-6">
    <nav class="flex space-x-8">
      <button
        on:click={() => activeTab = 'tickets'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
          {activeTab === 'tickets' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        🎫 Tickets de Soporte
      </button>
      
      <button
        on:click={() => activeTab = 'chat'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
          {activeTab === 'chat' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        💬 Chat de Soporte
      </button>
      
      <button
        on:click={() => activeTab = 'health'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
          {activeTab === 'health' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        📊 Salud de la Cuenta
      </button>
      
      <button
        on:click={() => activeTab = 'feedback'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
          {activeTab === 'feedback' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        🗨️ Feedback
      </button>
    </nav>
  </div>
  
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Cargando...</span>
    </div>
  {:else}
    <!-- Tickets Tab -->
    {#if activeTab === 'tickets'}
      <div transition:fade>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Mis Tickets de Soporte</h2>
          <button
            on:click={() => showCreateTicket = true}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Crear Ticket
          </button>
        </div>
        
        <!-- Tickets List -->
        <div class="space-y-4">
          {#each tickets as ticket}
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                 transition:slide>
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="flex items-center mb-2">
                    <h3 class="text-lg font-medium text-gray-900 mr-3">{ticket.title}</h3>
                    <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(ticket.status)}">
                      {ticket.status === 'open' ? 'Abierto' : 
                       ticket.status === 'in_progress' ? 'En Progreso' : 
                       ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                    </span>
                    <span class="ml-2 px-2 py-1 text-xs font-medium rounded-full {priorityLevels.find(p => p.value === ticket.priority)?.color}">
                      {priorityLevels.find(p => p.value === ticket.priority)?.label}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-2">{ticket.description}</p>
                  <div class="flex items-center text-sm text-gray-500">
                    <span>Creado: {formatDate(ticket.createdAt)}</span>
                    {#if ticket.assignedTo}
                      <span class="ml-4">Asignado a: {ticket.assignedTo}</span>
                    {/if}
                    <span class="ml-4">{ticket.messages.length} mensajes</span>
                  </div>
                </div>
                
                <button
                  on:click={() => { selectedTicket = ticket; activeTab = 'chat'; }}
                  class="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Ver Chat →
                </button>
              </div>
            </div>
          {/each}
          
          {#if tickets.length === 0}
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🎫</div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes tickets de soporte</h3>
              <p class="text-gray-600 mb-4">Cuando tengas dudas o problemas, puedes crear un ticket aquí.</p>
              <button
                on:click={() => showCreateTicket = true}
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear tu Primer Ticket
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- Chat Tab -->
    {#if activeTab === 'chat'}
      <div transition:fade>
        {#if selectedTicket}
          <div class="bg-white border border-gray-200 rounded-lg">
            <!-- Chat Header -->
            <div class="border-b border-gray-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{selectedTicket.title}</h3>
                  <p class="text-sm text-gray-600">Ticket #{selectedTicket.id}</p>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(selectedTicket.status)}">
                    {selectedTicket.status === 'open' ? 'Abierto' : 
                     selectedTicket.status === 'in_progress' ? 'En Progreso' : 
                     selectedTicket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                  </span>
                  <button
                    on:click={() => selectedTicket = null}
                    class="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Messages -->
            <div class="h-96 overflow-y-auto p-4 space-y-4">
              {#each selectedTicket.messages as message}
                <div class="flex {message.senderType === 'customer' ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                    {message.senderType === 'customer' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-900'}">
                    <p class="text-sm">{message.message}</p>
                    <p class="text-xs mt-1 opacity-70">
                      {formatDate(message.timestamp)}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Message Input -->
            <div class="border-t border-gray-200 p-4">
              <div class="flex space-x-2">
                <input
                  type="text"
                  bind:value={newMessage}
                  on:keydown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe tu mensaje..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="file"
                  multiple
                  on:change={(e) => handleFileUpload(e, 'message')}
                  class="hidden"
                  id="message-files"
                />
                <label
                  for="message-files"
                  class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  📁
                </label>
                <button
                  on:click={sendMessage}
                  disabled={!newMessage.trim()}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
              
              {#if messageAttachments.length > 0}
                <div class="mt-2 flex flex-wrap gap-2">
                  {#each messageAttachments as file, index}
                    <div class="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                      <span>{file.name}</span>
                      <button
                        on:click={() => removeAttachment(index, 'message')}
                        class="ml-1 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="text-center py-12">
            <div class="text-6xl mb-4">💬</div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Selecciona un ticket para chatear</h3>
            <p class="text-gray-600">Ve a la sección de tickets y selecciona uno para comenzar la conversación.</p>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Health Tab -->
    {#if activeTab === 'health'}
      <div transition:fade>
        {#if healthScore}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Health Score Card -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Puntuación de Salud de la Cuenta</h3>
              
              <div class="text-center mb-6">
                <div class="text-4xl font-bold {getHealthScoreColor(healthScore.score)} mb-2">
                  {healthScore.score}/100
                </div>
                <div class="text-sm text-gray-600">
                  Nivel de riesgo: 
                  <span class="font-medium
                    {healthScore.risk === 'low' ? 'text-green-600' : 
                      healthScore.risk === 'medium' ? 'text-yellow-600' : 'text-red-600'}">
                    {healthScore.risk === 'low' ? 'Bajo' : 
                     healthScore.risk === 'medium' ? 'Medio' : 'Alto'}
                  </span>
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Frecuencia de Reservas</span>
                  <span class="text-sm font-medium">{healthScore.factors.bookingFrequency}/100</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Historial de Pagos</span>
                  <span class="text-sm font-medium">{healthScore.factors.paymentHistory}/100</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Interacciones de Soporte</span>
                  <span class="text-sm font-medium">{healthScore.factors.supportInteractions}/100</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Uso de la App</span>
                  <span class="text-sm font-medium">{healthScore.factors.appUsage}/100</span>
                </div>
              </div>
            </div>
            
            <!-- Recommendations -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Recomendaciones Personalizadas</h3>
              
              <div class="space-y-4">
                {#each recommendations as recommendation}
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <h4 class="font-medium text-gray-900">{recommendation.title}</h4>
                      <span class="px-2 py-1 text-xs font-medium rounded-full
                        {recommendation.priority === 'high' ? 'text-red-600 bg-red-100' :
                          recommendation.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                          'text-green-600 bg-green-100'}">
                        {recommendation.priority === 'high' ? 'Alta' :
                         recommendation.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                    <div class="text-xs text-gray-500">
                      Impacto estimado: {recommendation.estimatedImpact}%
                    </div>
                  </div>
                {/each}
                
                {#if recommendations.length === 0}
                  <div class="text-center py-8">
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-gray-600">No hay recomendaciones en este momento. ¡Todo se ve bien!</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Feedback Tab -->
    {#if activeTab === 'feedback'}
      <div transition:fade>
        <div class="max-w-2xl mx-auto">
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Comparte tu Feedback</h3>
            <p class="text-gray-600 mb-6">Tu opinión es muy importante para nosotros. Cuéntanos cómo podemos mejorar.</p>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Feedback</label>
                <select
                  bind:value={feedbackData.type}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="suggestion">Sugerencia</option>
                  <option value="nps">Recomendarías BarberPro?</option>
                  <option value="csat">Satisfacción General</option>
                  <option value="review">Reseña</option>
                </select>
              </div>
              
              {#if feedbackData.type === 'nps' || feedbackData.type === 'csat'}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {feedbackData.type === 'nps' 
                      ? 'Del 0 al 10, ¿qué tan probable es que recomiendes BarberPro?' 
                      : 'Del 1 al 5, ¿qué tan satisfecho estás?'}
                  </label>
                  <div class="flex space-x-2">
                    {#each Array(feedbackData.type === 'nps' ? 11 : 5) as _, i}
                      <button
                        on:click={() => feedbackData.score = i + (feedbackData.type === 'nps' ? 0 : 1)}
                        class="w-10 h-10 border border-gray-300 rounded-md text-sm font-medium transition-colors
                          {feedbackData.score === i + (feedbackData.type === 'nps' ? 0 : 1)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-50'}"
                      >
                        {i + (feedbackData.type === 'nps' ? 0 : 1)}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Comentarios</label>
                <textarea
                  bind:value={feedbackData.comment}
                  rows="4"
                  placeholder="Cuéntanos tu experiencia, sugerencias o cualquier comentario..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  bind:value={feedbackData.category}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="app_usability">Usabilidad de la App</option>
                  <option value="booking_process">Proceso de Reserva</option>
                  <option value="payment">Pagos</option>
                  <option value="customer_support">Atención al Cliente</option>
                  <option value="provider_quality">Calidad de Proveedores</option>
                </select>
              </div>
              
              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    bind:checked={feedbackData.allowContact}
                    class="mr-2"
                  />
                  <span class="text-sm text-gray-700">Permitir que nos contactemos para seguimiento</span>
                </label>
              </div>
              
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  on:click={() => {
                    feedbackData = {
                      type: 'suggestion',
                      comment: '',
                      category: 'general',
                      allowContact: true
                    };
                  }}
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  on:click={submitFeedback}
                  disabled={!feedbackData.comment.trim()}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
  
  <!-- Create Ticket Modal -->
  {#if showCreateTicket}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" transition:fade>
      <div class="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto" transition:fly={{ y: -50 }}>
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Crear Ticket de Soporte</h3>
            <button
              on:click={() => showCreateTicket = false}
              class="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Problema</label>
              <select
                bind:value={newTicketData.type}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {#each ticketTypes as type}
                  <option value={type.value}>{type.icon} {type.label}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
              <select
                bind:value={newTicketData.priority}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {#each priorityLevels as priority}
                  <option value={priority.value}>{priority.label}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                bind:value={newTicketData.title}
                placeholder="Describe brevemente el problema"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                bind:value={newTicketData.description}
                rows="4"
                placeholder="Describe el problema en detalle..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Archivos Adjuntos (opcional)</label>
              <input
                type="file"
                multiple
                on:change={(e) => handleFileUpload(e, 'ticket')}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-xs text-gray-500 mt-1">Imágenes, PDFs o archivos de texto (máx. 10MB cada uno)</p>
              
              {#if newTicketData.attachments.length > 0}
                <div class="mt-2 space-y-1">
                  {#each newTicketData.attachments as file, index}
                    <div class="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                      <span>{file.name}</span>
                      <button
                        on:click={() => removeAttachment(index, 'ticket')}
                        class="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                on:click={() => showCreateTicket = false}
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                on:click={createTicket}
                disabled={!newTicketData.title.trim() || !newTicketData.description.trim()}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
