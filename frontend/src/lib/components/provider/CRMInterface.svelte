<script lang="ts">
  // CRM Interface - Building on 4.8/5 satisfaction feedback
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { socketService } from '$lib/services/socket';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Button from '../Button.svelte';
  import Modal from '../Modal.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let satisfactionScore = 4.8; // Building on Day 8's 4.8/5 success
  export let argentinaInsights: any = {};
  
  const dispatch = createEventDispatcher();
  
  // CRM state
  let clients: any[] = [];
  let selectedClient: any = null;
  let isLoading = true;
  let searchQuery = '';
  let filterStatus = 'all';
  let sortBy = 'lastVisit';
  let socketConnection: any = null;
  
  // Client communication
  let showMessageModal = false;
  let messageText = '';
  let messageType = 'whatsapp'; // whatsapp, sms, email
  let isSendingMessage = false;
  
  // Client analytics
  let clientAnalytics: any = {};
  let satisfactionTrends: any[] = [];
  
  // Argentina-specific CRM features
  const argentinaFeatures = {
    whatsappIntegration: true,
    dniValidation: true,
    provincialPreferences: true,
    mobileFirst: true
  };
  
  // Client statuses for Argentina market
  const clientStatuses = [
    { id: 'active', name: 'Activo', color: 'green' },
    { id: 'inactive', name: 'Inactivo', color: 'yellow' },
    { id: 'vip', name: 'VIP', color: 'purple' },
    { id: 'new', name: 'Nuevo', color: 'blue' },
    { id: 'at_risk', name: 'En Riesgo', color: 'red' }
  ];
  
  onMount(async () => {
    try {
      // Initialize real-time connection
      socketConnection = await socketService.connect();
      socketConnection.on('client_updated', handleClientUpdate);
      socketConnection.on('new_client', handleNewClient);
      
      // Load CRM data
      await Promise.all([
        loadClients(),
        loadClientAnalytics(),
        loadSatisfactionTrends()
      ]);
      
      isLoading = false;
      
      // Track CRM access
      uxAnalyticsService.trackEvent('crm_interface_access', {
        satisfactionScore,
        totalClients: clients.length,
        argentinaOptimized: true
      });
    } catch (error) {
      console.error('[CRMInterface] Initialization error:', error);
      isLoading = false;
    }
  });
  
  onDestroy(() => {
    if (socketConnection) {
      socketConnection.off('client_updated', handleClientUpdate);
      socketConnection.off('new_client', handleNewClient);
      socketConnection.disconnect();
    }
  });
  
  async function loadClients() {
    try {
      const response = await fetch('/api/provider/clients', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-CRM': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        clients = data.clients || [];
      }
    } catch (error) {
      console.error('[CRMInterface] Load clients error:', error);
    }
  }
  
  async function loadClientAnalytics() {
    try {
      const response = await fetch('/api/provider/clients/analytics', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        clientAnalytics = await response.json();
      }
    } catch (error) {
      console.error('[CRMInterface] Load analytics error:', error);
    }
  }
  
  async function loadSatisfactionTrends() {
    try {
      const response = await fetch('/api/provider/satisfaction/trends', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        satisfactionTrends = data.trends || [];
      }
    } catch (error) {
      console.error('[CRMInterface] Load trends error:', error);
    }
  }
  
  function handleClientUpdate(data: any) {
    clients = clients.map(client => 
      client.id === data.client.id ? data.client : client
    );
    
    // Update selected client if it's the one being updated
    if (selectedClient?.id === data.client.id) {
      selectedClient = data.client;
    }
  }
  
  function handleNewClient(data: any) {
    clients = [data.client, ...clients];
    
    // Show notification for Argentina mobile users
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nuevo cliente', {
        body: `${data.client.name} se ha registrado`,
        icon: '/favicon-32x32.png'
      });
    }
  }
  
  function selectClient(client: any) {
    selectedClient = client;
    
    uxAnalyticsService.trackEvent('client_selected', {
      clientId: client.id,
      clientStatus: client.status,
      satisfactionScore: client.satisfactionScore
    });
  }
  
  function openMessageModal(client: any) {
    selectedClient = client;
    showMessageModal = true;
    messageText = '';
    messageType = 'whatsapp'; // Default to WhatsApp for Argentina
    
    uxAnalyticsService.trackEvent('client_message_initiated', {
      clientId: client.id,
      preferredChannel: 'whatsapp'
    });
  }
  
  async function sendMessage() {
    if (!messageText.trim() || !selectedClient) {
      alert('Escribe un mensaje');
      return;
    }
    
    isSendingMessage = true;
    
    try {
      const response = await fetch('/api/provider/clients/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          message: messageText,
          type: messageType,
          argentinaOptimized: true
        })
      });
      
      if (response.ok) {
        showMessageModal = false;
        messageText = '';
        
        // Track successful message
        uxAnalyticsService.trackEvent('client_message_sent', {
          clientId: selectedClient.id,
          messageType,
          messageLength: messageText.length
        });
        
        alert('Mensaje enviado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('[CRMInterface] Send message error:', error);
      alert('Error al enviar mensaje');
    } finally {
      isSendingMessage = false;
    }
  }
  
  async function updateClientStatus(client: any, newStatus: string) {
    try {
      const response = await fetch(`/api/provider/clients/${client.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updatedClient = await response.json();
        clients = clients.map(c => c.id === client.id ? updatedClient : c);
        
        if (selectedClient?.id === client.id) {
          selectedClient = updatedClient;
        }
        
        uxAnalyticsService.trackEvent('client_status_updated', {
          clientId: client.id,
          oldStatus: client.status,
          newStatus
        });
      }
    } catch (error) {
      console.error('[CRMInterface] Update status error:', error);
    }
  }
  
  // Filtering and sorting
  $: filteredClients = clients
    .filter(client => {
      const matchesSearch = searchQuery === '' || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery);
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastVisit':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        case 'satisfaction':
          return (b.satisfactionScore || 0) - (a.satisfactionScore || 0);
        case 'bookings':
          return (b.totalBookings || 0) - (a.totalBookings || 0);
        default:
          return 0;
      }
    });
  
  function getStatusColor(status: string): string {
    const statusConfig = clientStatuses.find(s => s.id === status);
    const color = statusConfig?.color || 'gray';
    
    const colors = {
      green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    
    return colors[color] || colors.gray;
  }
  
  function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(new Date(dateString));
  }
  
  function formatPhone(phone: string): string {
    // Format Argentina phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('54')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phone;
  }
  
  function getSatisfactionEmoji(score: number): string {
    if (score >= 4.5) return '😍';
    if (score >= 4.0) return '😊';
    if (score >= 3.5) return '🙂';
    if (score >= 3.0) return '😐';
    return '🙁';
  }
</script>

<!-- CRM Interface -->
<div class="space-y-6">
  <!-- Header with Satisfaction Score -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        👥 CRM - Gestión de Clientes
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Administra tus relaciones con clientes
      </p>
    </div>
    
    <!-- Satisfaction Score Badge -->
    <div class="mt-4 lg:mt-0">
      <div class="flex items-center space-x-3 bg-yellow-100 dark:bg-yellow-800 px-4 py-2 rounded-full">
        <span class="text-2xl">{getSatisfactionEmoji(satisfactionScore)}</span>
        <div>
          <div class="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
            Satisfacción Promedio
          </div>
          <div class="text-yellow-900 dark:text-yellow-100 text-xl font-bold">
            {satisfactionScore}/5
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {#if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center h-96" in:fade>
      <div class="text-center">
        <LoadingSpinner size="large" />
        <p class="mt-4 text-gray-600 dark:text-gray-300">Cargando clientes...</p>
      </div>
    </div>
  {:else}
    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Total Clientes</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {clients.length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Clientes Activos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {clients.filter(c => c.status === 'active').length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Clientes VIP</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {clients.filter(c => c.status === 'vip').length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Clientes Nuevos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {clients.filter(c => c.status === 'new').length}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Filters and Search -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Buscar por nombre, email o teléfono..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
        </div>
        
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            bind:value={filterStatus}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos los estados</option>
            {#each clientStatuses as status}
              <option value={status.id}>{status.name}</option>
            {/each}
          </select>
          
          <select
            bind:value={sortBy}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="lastVisit">Última visita</option>
            <option value="name">Nombre</option>
            <option value="satisfaction">Satisfacción</option>
            <option value="bookings">Reservas</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Clients List -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {#if filteredClients.length > 0}
        <div class="divide-y divide-gray-200 dark:divide-gray-600">
          {#each filteredClients as client (client.id)}
            <div 
              class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              on:click={() => selectClient(client)}
              in:fly={{ y: 20, duration: 300, delay: filteredClients.indexOf(client) * 50 }}
            >
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <!-- Client Info -->
                <div class="flex items-start space-x-4">
                  <!-- Avatar -->
                  <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <!-- Details -->
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-1">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        {client.name}
                      </h3>
                      <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(client.status)}">
                        {clientStatuses.find(s => s.id === client.status)?.name || client.status}
                      </span>
                    </div>
                    
                    <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div class="flex items-center space-x-4">
                        <span>📧 {client.email}</span>
                        <span>📱 {formatPhone(client.phone)}</span>
                      </div>
                      <div class="flex items-center space-x-4">
                        <span>📅 Última visita: {formatDate(client.lastVisit)}</span>
                        <span>📊 {client.totalBookings || 0} reservas</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Stats and Actions -->
                <div class="flex items-center space-x-6">
                  <!-- Satisfaction Score -->
                  <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {client.satisfactionScore || 'N/A'}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Satisfacción</div>
                  </div>
                  
                  <!-- Revenue -->
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${(client.totalRevenue || 0).toLocaleString('es-AR')}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Ingresos</div>
                  </div>
                  
                  <!-- Quick Actions -->
                  <div class="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      on:click={(e) => {
                        e.stopPropagation();
                        openMessageModal(client);
                      }}
                      class="flex items-center space-x-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>WhatsApp</span>
                    </Button>
                    
                    <!-- Status Dropdown -->
                    <select
                      value={client.status}
                      on:change={(e) => {
                        e.stopPropagation();
                        updateClientStatus(client, e.target.value);
                      }}
                      class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {#each clientStatuses as status}
                        <option value={status.id}>{status.name}</option>
                      {/each}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <!-- Empty State -->
        <div class="text-center py-12" in:fade>
          <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron clientes
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Ajusta los filtros o espera a que lleguen nuevos clientes
          </p>
        </div>
      {/if}
    </div>
    
    <!-- Client Detail Panel -->
    {#if selectedClient}
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" in:scale={{ duration: 300 }}>
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div class="flex items-start space-x-4">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {selectedClient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {selectedClient.name}
              </h3>
              <div class="flex items-center space-x-3 mb-2">
                <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(selectedClient.status)}">
                  {clientStatuses.find(s => s.id === selectedClient.status)?.name}
                </span>
                <span class="text-gray-600 dark:text-gray-400">
                  Cliente desde {formatDate(selectedClient.createdAt)}
                </span>
              </div>
              <div class="text-gray-600 dark:text-gray-400 space-y-1">
                <div>📧 {selectedClient.email}</div>
                <div>📱 {formatPhone(selectedClient.phone)}</div>
                {#if selectedClient.address}
                  <div>📍 {selectedClient.address}</div>
                {/if}
              </div>
            </div>
          </div>
          
          <Button
            variant="secondary"
            on:click={() => selectedClient = null}
          >
            Cerrar
          </Button>
        </div>
        
        <!-- Client Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {selectedClient.totalBookings || 0}
            </div>
            <div class="text-sm text-blue-800 dark:text-blue-200">Reservas Totales</div>
          </div>
          
          <div class="bg-green-50 dark:bg-green-900 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              ${(selectedClient.totalRevenue || 0).toLocaleString('es-AR')}
            </div>
            <div class="text-sm text-green-800 dark:text-green-200">Ingresos Totales</div>
          </div>
          
          <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
              {selectedClient.satisfactionScore || 'N/A'}
            </div>
            <div class="text-sm text-yellow-800 dark:text-yellow-200">Satisfacción</div>
          </div>
          
          <div class="bg-purple-50 dark:bg-purple-900 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {selectedClient.referrals || 0}
            </div>
            <div class="text-sm text-purple-800 dark:text-purple-200">Referencias</div>
          </div>
        </div>
        
        <!-- Recent Bookings -->
        {#if selectedClient.recentBookings?.length > 0}
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reservas Recientes
            </h4>
            <div class="space-y-3">
              {#each selectedClient.recentBookings.slice(0, 5) as booking}
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {booking.service.name}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(booking.dateTime)}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold text-gray-900 dark:text-white">
                      ${booking.totalAmount.toLocaleString('es-AR')}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {booking.status}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Actions -->
        <div class="flex space-x-3">
          <Button
            variant="primary"
            on:click={() => openMessageModal(selectedClient)}
            class="flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Enviar Mensaje</span>
          </Button>
          
          <Button variant="secondary" class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Nueva Reserva</span>
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Message Modal -->
<Modal 
  open={showMessageModal} 
  on:close={() => { showMessageModal = false; selectedClient = null; }}
  title="Enviar Mensaje a {selectedClient?.name || ''}"
  size="medium"
>
  {#if selectedClient}
    <div class="space-y-4">
      <!-- Message Type Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Canal de Comunicación
        </label>
        <div class="flex space-x-2">
          <button
            class="flex-1 p-3 border rounded-lg transition-colors"
            class:border-green-500={messageType === 'whatsapp'}
            class:bg-green-50={messageType === 'whatsapp'}
            class:dark:bg-green-900={messageType === 'whatsapp'}
            on:click={() => messageType = 'whatsapp'}
          >
            <div class="text-center">
              <div class="text-2xl mb-1">📱</div>
              <div class="text-sm font-medium">WhatsApp</div>
            </div>
          </button>
          
          <button
            class="flex-1 p-3 border rounded-lg transition-colors"
            class:border-blue-500={messageType === 'sms'}
            class:bg-blue-50={messageType === 'sms'}
            class:dark:bg-blue-900={messageType === 'sms'}
            on:click={() => messageType = 'sms'}
          >
            <div class="text-center">
              <div class="text-2xl mb-1">💬</div>
              <div class="text-sm font-medium">SMS</div>
            </div>
          </button>
          
          <button
            class="flex-1 p-3 border rounded-lg transition-colors"
            class:border-purple-500={messageType === 'email'}
            class:bg-purple-50={messageType === 'email'}
            class:dark:bg-purple-900={messageType === 'email'}
            on:click={() => messageType = 'email'}
          >
            <div class="text-center">
              <div class="text-2xl mb-1">📧</div>
              <div class="text-sm font-medium">Email</div>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Message Text -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mensaje
        </label>
        <textarea
          bind:value={messageText}
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Escribe tu mensaje aquí..."
        ></textarea>
        <div class="text-sm text-gray-500 mt-1">
          {messageText.length}/500 caracteres
        </div>
      </div>
      
      <!-- Form Actions -->
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          variant="secondary"
          on:click={() => { showMessageModal = false; selectedClient = null; }}
          disabled={isSendingMessage}
        >
          Cancelar
        </Button>
        
        <Button
          variant="primary"
          on:click={sendMessage}
          disabled={isSendingMessage || !messageText.trim()}
          class="flex items-center space-x-2"
        >
          {#if isSendingMessage}
            <LoadingSpinner size="small" />
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          {/if}
          <span>Enviar</span>
        </Button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  /* Argentina mobile optimization */
  @media (max-width: 768px) {
    .md\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .lg\:flex-row {
      flex-direction: column;
    }
    
    .lg\:space-x-4 {
      margin-left: 0;
    }
    
    .lg\:space-x-4 > * + * {
      margin-left: 0;
      margin-top: 1rem;
    }
  }
  
  /* Smooth hover effects */
  .hover\:bg-gray-50:hover {
    background-color: rgba(249, 250, 251, 0.8);
  }
  
  /* Status color transitions */
  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
</style>