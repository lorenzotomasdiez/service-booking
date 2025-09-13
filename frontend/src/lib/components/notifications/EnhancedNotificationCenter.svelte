<script lang="ts">
  // Enhanced Notification Center - Optimized for Argentina mobile preferences
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { socketService } from '$lib/services/socket';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Button from '../Button.svelte';
  import Modal from '../Modal.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let isOpen = false;
  export let argentinaOptimized = true;
  
  const dispatch = createEventDispatcher();
  
  // Notification state
  let notifications: any[] = [];
  let unreadCount = 0;
  let isLoading = true;
  let activeTab = 'all';
  let socketConnection: any = null;
  
  // Notification settings
  let notificationSettings = {
    push: true,
    email: false,
    whatsapp: true, // Preferred in Argentina
    sms: false,
    inApp: true
  };
  
  // Argentina-specific preferences
  let argentinaPreferences = {
    whatsappPriority: true, // 67% prefer WhatsApp
    mobileFirst: true, // 87% mobile usage
    spanishLanguage: true,
    localTimezone: 'America/Argentina/Buenos_Aires',
    businessHours: {
      start: 9,
      end: 18,
      timezone: 'America/Argentina/Buenos_Aires'
    }
  };
  
  // Notification types
  const notificationTypes = {
    booking: {
      icon: '📅',
      color: 'blue',
      priority: 'high'
    },
    payment: {
      icon: '💳',
      color: 'green',
      priority: 'high'
    },
    reminder: {
      icon: '⏰',
      color: 'yellow',
      priority: 'medium'
    },
    message: {
      icon: '💬',
      color: 'purple',
      priority: 'medium'
    },
    review: {
      icon: '⭐',
      color: 'orange',
      priority: 'low'
    },
    system: {
      icon: '⚙️',
      color: 'gray',
      priority: 'low'
    },
    promotion: {
      icon: '🎉',
      color: 'pink',
      priority: 'low'
    }
  };
  
  // Filter tabs
  const tabs = [
    { id: 'all', name: 'Todas', count: 0 },
    { id: 'unread', name: 'No leídas', count: 0 },
    { id: 'booking', name: 'Reservas', count: 0 },
    { id: 'payment', name: 'Pagos', count: 0 },
    { id: 'message', name: 'Mensajes', count: 0 }
  ];
  
  onMount(async () => {
    try {
      // Initialize real-time notifications
      await initializeNotifications();
      
      // Load notification history
      await loadNotifications();
      
      // Load user preferences
      await loadNotificationSettings();
      
      // Request push notification permission
      await requestNotificationPermission();
      
      isLoading = false;
      
      // Track notification center access
      uxAnalyticsService.trackEvent('notification_center_accessed', {
        unreadCount,
        argentinaOptimized,
        mobileUser: window.innerWidth <= 768
      });
    } catch (error) {
      console.error('[NotificationCenter] Initialization error:', error);
      isLoading = false;
    }
  });
  
  onDestroy(() => {
    if (socketConnection) {
      socketConnection.off('notification_received');
      socketConnection.off('notification_read');
      socketConnection.disconnect();
    }
  });
  
  async function initializeNotifications() {
    try {
      socketConnection = await socketService.connect();
      
      // Join notification room
      socketConnection.emit('join_notifications', {
        userId: $authStore.user?.id,
        preferences: argentinaPreferences
      });
      
      // Set up real-time listeners
      socketConnection.on('notification_received', handleNewNotification);
      socketConnection.on('notification_read', handleNotificationRead);
      socketConnection.on('notification_deleted', handleNotificationDeleted);
    } catch (error) {
      console.error('[NotificationCenter] Socket initialization error:', error);
    }
  }
  
  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Notifications': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        notifications = data.notifications || [];
        unreadCount = data.unreadCount || 0;
        
        // Update tab counts
        updateTabCounts();
      }
    } catch (error) {
      console.error('[NotificationCenter] Load notifications error:', error);
    }
  }
  
  async function loadNotificationSettings() {
    try {
      const response = await fetch('/api/user/notification-settings', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        const settings = await response.json();
        notificationSettings = { ...notificationSettings, ...settings };
      }
    } catch (error) {
      console.error('[NotificationCenter] Load settings error:', error);
    }
  }
  
  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          notificationSettings.push = true;
          await saveNotificationSettings();
          
          uxAnalyticsService.trackEvent('push_notifications_enabled', {
            argentinaUser: true
          });
        }
      } catch (error) {
        console.error('[NotificationCenter] Permission request error:', error);
      }
    }
  }
  
  function handleNewNotification(data: any) {
    const notification = data.notification;
    
    // Add to notifications list
    notifications = [notification, ...notifications];
    unreadCount += 1;
    
    // Update tab counts
    updateTabCounts();
    
    // Show browser notification if enabled and Argentina optimized
    if (notificationSettings.push && 'Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(notification);
    }
    
    // Vibrate for mobile users (Argentina preference)
    if (argentinaOptimized && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Track notification received
    uxAnalyticsService.trackEvent('notification_received', {
      type: notification.type,
      priority: notificationTypes[notification.type]?.priority,
      argentinaOptimized: true
    });
  }
  
  function handleNotificationRead(data: any) {
    notifications = notifications.map(n => 
      n.id === data.notificationId ? { ...n, read: true } : n
    );
    
    if (!notifications.find(n => n.id === data.notificationId)?.read) {
      unreadCount = Math.max(0, unreadCount - 1);
    }
    
    updateTabCounts();
  }
  
  function handleNotificationDeleted(data: any) {
    const notification = notifications.find(n => n.id === data.notificationId);
    
    if (notification && !notification.read) {
      unreadCount = Math.max(0, unreadCount - 1);
    }
    
    notifications = notifications.filter(n => n.id !== data.notificationId);
    updateTabCounts();
  }
  
  function showBrowserNotification(notification: any) {
    const typeConfig = notificationTypes[notification.type];
    
    try {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon-32x32.png',
        badge: '/favicon-16x16.png',
        tag: `barberpro_${notification.type}`,
        requireInteraction: typeConfig?.priority === 'high',
        silent: false,
        timestamp: Date.now(),
        data: {
          notificationId: notification.id,
          type: notification.type,
          argentinaOptimized: true
        }
      });
    } catch (error) {
      console.error('[NotificationCenter] Browser notification error:', error);
    }
  }
  
  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        // Update locally
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
          notification.read = true;
          unreadCount = Math.max(0, unreadCount - 1);
          updateTabCounts();
          
          // Emit via socket
          if (socketConnection) {
            socketConnection.emit('notification_read', {
              notificationId,
              userId: $authStore.user?.id
            });
          }
        }
      }
    } catch (error) {
      console.error('[NotificationCenter] Mark read error:', error);
    }
  }
  
  async function markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        notifications = notifications.map(n => ({ ...n, read: true }));
        unreadCount = 0;
        updateTabCounts();
        
        uxAnalyticsService.trackEvent('notifications_all_marked_read', {
          count: notifications.length
        });
      }
    } catch (error) {
      console.error('[NotificationCenter] Mark all read error:', error);
    }
  }
  
  async function deleteNotification(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
          unreadCount = Math.max(0, unreadCount - 1);
        }
        
        notifications = notifications.filter(n => n.id !== notificationId);
        updateTabCounts();
        
        // Emit via socket
        if (socketConnection) {
          socketConnection.emit('notification_deleted', {
            notificationId,
            userId: $authStore.user?.id
          });
        }
      }
    } catch (error) {
      console.error('[NotificationCenter] Delete notification error:', error);
    }
  }
  
  async function saveNotificationSettings() {
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`
        },
        body: JSON.stringify({
          ...notificationSettings,
          argentinaPreferences
        })
      });
      
      if (response.ok) {
        uxAnalyticsService.trackEvent('notification_settings_updated', {
          whatsappEnabled: notificationSettings.whatsapp,
          pushEnabled: notificationSettings.push
        });
      }
    } catch (error) {
      console.error('[NotificationCenter] Save settings error:', error);
    }
  }
  
  function updateTabCounts() {
    tabs[0].count = notifications.length; // All
    tabs[1].count = notifications.filter(n => !n.read).length; // Unread
    tabs[2].count = notifications.filter(n => n.type === 'booking').length; // Booking
    tabs[3].count = notifications.filter(n => n.type === 'payment').length; // Payment
    tabs[4].count = notifications.filter(n => n.type === 'message').length; // Message
  }
  
  function changeTab(tabId: string) {
    activeTab = tabId;
    
    uxAnalyticsService.trackEvent('notification_tab_changed', {
      from: activeTab,
      to: tabId
    });
  }
  
  function handleNotificationClick(notification: any) {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle notification action
    if (notification.action) {
      dispatch('notificationAction', {
        action: notification.action,
        data: notification.data
      });
    }
    
    // Track click
    uxAnalyticsService.trackEvent('notification_clicked', {
      type: notification.type,
      hasAction: !!notification.action
    });
  }
  
  function getFilteredNotifications(): any[] {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'booking':
        return notifications.filter(n => n.type === 'booking');
      case 'payment':
        return notifications.filter(n => n.type === 'payment');
      case 'message':
        return notifications.filter(n => n.type === 'message');
      default:
        return notifications;
    }
  }
  
  function formatNotificationTime(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    
    return notificationTime.toLocaleDateString('es-AR', {
      timeZone: argentinaPreferences.localTimezone
    });
  }
  
  function getNotificationTypeConfig(type: string) {
    return notificationTypes[type] || notificationTypes.system;
  }
  
  function getNotificationColor(type: string): string {
    const config = getNotificationTypeConfig(type);
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    
    return colors[config.color] || colors.gray;
  }
</script>

<!-- Enhanced Notification Center -->
<Modal 
  open={isOpen} 
  on:close={() => dispatch('close')}
  title="Notificaciones"
  size="large"
>
  <div class="space-y-6">
    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div class="flex items-center space-x-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Notificaciones
        </h2>
        
        {#if unreadCount > 0}
          <span class="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200 text-sm font-medium rounded-full">
            {unreadCount} no leídas
          </span>
        {/if}
      </div>
      
      <div class="flex space-x-2">
        {#if unreadCount > 0}
          <Button
            variant="secondary"
            size="sm"
            on:click={markAllAsRead}
            class="flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Marcar todo como leído</span>
          </Button>
        {/if}
        
        <Button
          variant="secondary"
          size="sm"
          class="flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Configurar</span>
        </Button>
      </div>
    </div>
    
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center h-64" in:fade>
        <div class="text-center">
          <LoadingSpinner size="large" />
          <p class="mt-4 text-gray-600 dark:text-gray-300">Cargando notificaciones...</p>
        </div>
      </div>
    {:else}
      <!-- Notification Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-600">
        <div class="flex space-x-1 overflow-x-auto pb-2">
          {#each tabs as tab (tab.id)}
            <button
              class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center space-x-2"
              class:bg-blue-600={activeTab === tab.id}
              class:text-white={activeTab === tab.id}
              class:bg-gray-100={activeTab !== tab.id}
              class:text-gray-700={activeTab !== tab.id}
              class:dark:bg-gray-700={activeTab !== tab.id}
              class:dark:text-gray-300={activeTab !== tab.id}
              on:click={() => changeTab(tab.id)}
            >
              <span>{tab.name}</span>
              {#if tab.count > 0}
                <span class="px-2 py-1 bg-white bg-opacity-20 text-xs rounded-full">
                  {tab.count}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Notifications List -->
      <div class="space-y-3 max-h-96 overflow-y-auto">
        {#each getFilteredNotifications() as notification (notification.id)}
          <div 
            class="p-4 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer"
            class:border-blue-200={!notification.read}
            class:bg-blue-50={!notification.read}
            class:dark:bg-blue-900={!notification.read}
            class:border-gray-200={notification.read}
            class:dark:border-gray-600={notification.read}
            on:click={() => handleNotificationClick(notification)}
            in:fly={{ y: 20, duration: 300 }}
          >
            <div class="flex items-start justify-between">
              <!-- Notification Content -->
              <div class="flex items-start space-x-3 flex-1">
                <!-- Notification Icon -->
                <div class="flex-shrink-0">
                  <span class="text-2xl">
                    {getNotificationTypeConfig(notification.type).icon}
                  </span>
                </div>
                
                <!-- Notification Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </h4>
                    
                    <!-- Type Badge -->
                    <span class="ml-2 px-2 py-1 text-xs font-medium rounded-full {getNotificationColor(notification.type)} flex-shrink-0">
                      {notification.type}
                    </span>
                  </div>
                  
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                    
                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-2">
                      {#if notification.action}
                        <button
                          class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          on:click|stopPropagation={() => handleNotificationClick(notification)}
                        >
                          {notification.actionText || 'Ver'}
                        </button>
                      {/if}
                      
                      <button
                        class="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        on:click|stopPropagation={() => deleteNotification(notification.id)}
                        title="Eliminar notificación"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Unread Indicator -->
              {#if !notification.read}
                <div class="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 ml-2"></div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Empty State -->
          <div class="text-center py-12" in:fade>
            <div class="text-6xl mb-4">
              {#if activeTab === 'unread'}
                ✓
              {:else}
                🔔
              {/if}
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {#if activeTab === 'unread'}
                ¡Todo leído!
              {:else}
                No hay notificaciones
              {/if}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {#if activeTab === 'unread'}
                No tienes notificaciones sin leer
              {:else}
                Las notificaciones aparecerán aquí
              {/if}
            </p>
          </div>
        {/each}
      </div>
      
      <!-- Notification Settings Section -->
      <div class="border-t border-gray-200 dark:border-gray-600 pt-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preferencias de Notificación
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Push Notifications -->
          <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              bind:checked={notificationSettings.push}
              on:change={saveNotificationSettings}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">
                🔔 Notificaciones Push
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Recibe alertas en tu dispositivo
              </div>
            </div>
          </label>
          
          <!-- WhatsApp (Argentina preferred) -->
          <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              bind:checked={notificationSettings.whatsapp}
              on:change={saveNotificationSettings}
              class="rounded border-gray-300 text-green-600 focus:ring-green-500"
            >
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">
                📱 WhatsApp
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Preferido en Argentina (67% de usuarios)
              </div>
            </div>
          </label>
          
          <!-- Email -->
          <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              bind:checked={notificationSettings.email}
              on:change={saveNotificationSettings}
              class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            >
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">
                📧 Email
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Resumen diario y confirmaciones
              </div>
            </div>
          </label>
          
          <!-- SMS -->
          <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              bind:checked={notificationSettings.sms}
              on:change={saveNotificationSettings}
              class="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            >
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">
                💬 SMS
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Solo para recordatorios importantes
              </div>
            </div>
          </label>
        </div>
        
        <!-- Argentina-specific Features -->
        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🇦🇷 Optimizado para Argentina
          </h4>
          <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Horarios de oficina argentinos (9:00 - 18:00 UTC-3)</li>
            <li>• Integración con WhatsApp (preferido por el 67% de usuarios)</li>
            <li>• Notificaciones optimizadas para móviles</li>
            <li>• Soporte completo en español argentino</li>
          </ul>
        </div>
      </div>
    {/if}
  </div>
</Modal>

<style>
  /* Line clamp utility */
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  /* Argentina mobile optimization */
  @media (max-width: 768px) {
    .md\:grid-cols-2 {
      grid-template-columns: 1fr;
    }
    
    .sm\:flex-row {
      flex-direction: column;
    }
    
    .sm\:space-x-4 > * + * {
      margin-left: 0;
      margin-top: 1rem;
    }
    
    /* Larger touch targets */
    button {
      min-height: 44px;
    }
  }
  
  /* Smooth scrolling for mobile */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
  }
  
  /* Notification animations */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
  
  /* Hover effects */
  .hover\:shadow-md:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  /* Tab overflow scroll */
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
  
  .overflow-x-auto::-webkit-scrollbar {
    height: 4px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 2px;
  }
</style>