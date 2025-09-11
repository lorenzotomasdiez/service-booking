<script lang="ts">
  // Notification Center Component - Real-time notifications and alerts
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { socketService, bookingUpdates, bookingConflicts, waitlistNotifications } from '$lib/services/socket';
  import { user } from '$lib/stores/auth';
  import Button from '../Button.svelte';
  import type { Booking, TimeSlot } from '$lib/types/booking';
  
  // Notification types
  interface Notification {
    id: string;
    type: 'booking_update' | 'booking_conflict' | 'waitlist_available' | 'reminder' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    actionUrl?: string;
    actionLabel?: string;
    data?: any;
  }
  
  // State
  let notifications: Notification[] = [];
  let showNotifications = false;
  let unreadCount = 0;
  
  // Auto-dismiss timers
  const autoHideTimers = new Map<string, number>();
  
  // Subscribe to real-time updates
  let unsubscribers: Array<() => void> = [];
  
  onMount(() => {
    // Subscribe to booking updates
    const unsubBookingUpdates = bookingUpdates.subscribe((update) => {
      if (update) {
        handleBookingUpdate(update);
      }
    });
    
    // Subscribe to booking conflicts
    const unsubBookingConflicts = bookingConflicts.subscribe((conflict) => {
      if (conflict) {
        handleBookingConflict(conflict);
      }
    });
    
    // Subscribe to waitlist notifications
    const unsubWaitlistNotifications = waitlistNotifications.subscribe((notification) => {
      if (notification) {
        handleWaitlistNotification(notification);
      }
    });
    
    unsubscribers = [unsubBookingUpdates, unsubBookingConflicts, unsubWaitlistNotifications];
    
    // Load existing notifications from localStorage
    loadStoredNotifications();
  });
  
  onDestroy(() => {
    unsubscribers.forEach(unsub => unsub());
    autoHideTimers.forEach(timer => clearTimeout(timer));
  });
  
  // Handle different types of real-time updates
  const handleBookingUpdate = (update: any) => {
    const booking = update.booking;
    let title = '';
    let message = '';
    
    switch (booking.status) {
      case 'CONFIRMED':
        title = 'Reserva confirmada';
        message = `Tu reserva para ${booking.service?.name} ha sido confirmada`;
        break;
      case 'CANCELLED':
        title = 'Reserva cancelada';
        message = `Tu reserva para ${booking.service?.name} ha sido cancelada`;
        break;
      case 'IN_PROGRESS':
        title = 'Servicio en progreso';
        message = `Tu servicio ${booking.service?.name} está comenzando`;
        break;
      case 'COMPLETED':
        title = 'Servicio completado';
        message = `Tu servicio ${booking.service?.name} ha sido completado`;
        break;
      default:
        title = 'Actualización de reserva';
        message = `Tu reserva para ${booking.service?.name} ha sido actualizada`;
    }
    
    addNotification({
      type: 'booking_update',
      title,
      message,
      data: booking,
      actionUrl: `/bookings/${booking.id}`,
      actionLabel: 'Ver detalles'
    });
  };
  
  const handleBookingConflict = (conflict: any) => {
    addNotification({
      type: 'booking_conflict',
      title: 'Conflicto de horario detectado',
      message: conflict.conflictReason,
      data: conflict,
      actionLabel: 'Ver horarios alternativos'
    });
  };
  
  const handleWaitlistNotification = (notification: any) => {
    const slot = notification.availableSlot;
    const formattedTime = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(slot.startTime));
    
    addNotification({
      type: 'waitlist_available',
      title: '¡Horario disponible!',
      message: `Se liberó un horario para las ${formattedTime}. ¡Reserva ahora!`,
      data: notification,
      actionLabel: 'Reservar ahora'
    });
  };
  
  // Add notification
  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const notification: Notification = {
      id: generateId(),
      timestamp: new Date(),
      isRead: false,
      ...notificationData
    };
    
    notifications = [notification, ...notifications];
    updateUnreadCount();
    saveNotifications();
    
    // Show browser notification if supported and permitted
    showBrowserNotification(notification);
    
    // Auto-hide info notifications after 5 seconds
    if (notification.type === 'info') {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
      autoHideTimers.set(notification.id, timer);
    }
  };
  
  // Browser notification
  const showBrowserNotification = (notification: Notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: notification.id
    });
    
    browserNotification.onclick = () => {
      if (notification.actionUrl) {
        window.focus();
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };
    
    // Auto close after 4 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 4000);
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addNotification({
          type: 'info',
          title: 'Notificaciones activadas',
          message: 'Ahora recibirás notificaciones en tiempo real'
        });
      }
    }
  };
  
  // Notification management
  const markAsRead = (notificationId: string) => {
    notifications = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    updateUnreadCount();
    saveNotifications();
  };
  
  const markAllAsRead = () => {
    notifications = notifications.map(n => ({ ...n, isRead: true }));
    updateUnreadCount();
    saveNotifications();
  };
  
  const removeNotification = (notificationId: string) => {
    const timer = autoHideTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      autoHideTimers.delete(notificationId);
    }
    
    notifications = notifications.filter(n => n.id !== notificationId);
    updateUnreadCount();
    saveNotifications();
  };
  
  const clearAllNotifications = () => {
    autoHideTimers.forEach(timer => clearTimeout(timer));
    autoHideTimers.clear();
    notifications = [];
    updateUnreadCount();
    saveNotifications();
  };
  
  // Utility functions
  const updateUnreadCount = () => {
    unreadCount = notifications.filter(n => !n.isRead).length;
  };
  
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `hace ${days}d`;
    }
  };
  
  // Persistence
  const saveNotifications = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50))); // Keep last 50
    }
  };
  
  const loadStoredNotifications = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          notifications = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          updateUnreadCount();
        } catch (error) {
          console.error('Error loading stored notifications:', error);
        }
      }
    }
  };
  
  // Toggle notification panel
  const toggleNotifications = () => {
    showNotifications = !showNotifications;
  };
  
  // Click outside to close
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.notification-center')) {
      showNotifications = false;
    }
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_update':
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-2m-6 2v-2a4 4 0 114 0v2m6-8V7a4 4 0 118 0v8M3 21h18" />
        </svg>`;
      case 'booking_conflict':
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
      case 'waitlist_available':
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>`;
      default:
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_update':
        return 'text-blue-600 bg-blue-100';
      case 'booking_conflict':
        return 'text-red-600 bg-red-100';
      case 'waitlist_available':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  // On mount, request notification permission if user is logged in
  $: if ($user && typeof window !== 'undefined') {
    requestNotificationPermission();
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="notification-center relative">
  <!-- Notification Bell Button -->
  <button
    type="button"
    on:click={toggleNotifications}
    class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label="Notificaciones"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.595-3.595a2 2 0 00-1.434-.593h-6.942a2 2 0 00-1.434.593L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    
    <!-- Unread badge -->
    {#if unreadCount > 0}
      <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            in:fade={{ duration: 200 }}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    {/if}
  </button>

  <!-- Notification Panel -->
  {#if showNotifications}
    <div class="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
         in:fly={{ y: -10, duration: 200 }}
         out:fade={{ duration: 150 }}>
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Notificaciones</h3>
          
          <div class="flex items-center space-x-2">
            {#if unreadCount > 0}
              <button
                type="button"
                on:click={markAllAsRead}
                class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Marcar todas como leídas
              </button>
            {/if}
            
            {#if notifications.length > 0}
              <button
                type="button"
                on:click={clearAllNotifications}
                class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                title="Limpiar todas"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="max-h-96 overflow-y-auto">
        {#if notifications.length === 0}
          <div class="px-6 py-8 text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.595-3.595a2 2 0 00-1.434-.593h-6.942a2 2 0 00-1.434.593L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p class="text-gray-600">No tienes notificaciones</p>
          </div>
        {:else}
          {#each notifications as notification (notification.id)}
            <div class="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors
                        {!notification.isRead ? 'bg-blue-50 border-blue-100' : ''}"
                 in:fly={{ x: 20, duration: 200 }}>
              
              <div class="flex items-start space-x-3">
                <!-- Icon -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 {getNotificationColor(notification.type)}">
                  {@html getNotificationIcon(notification.type)}
                </div>
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-gray-900 {!notification.isRead ? 'font-semibold' : ''}">
                        {notification.title}
                      </h4>
                      <p class="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      <!-- Action button -->
                      {#if notification.actionLabel}
                        <button
                          type="button"
                          class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          on:click={() => {
                            markAsRead(notification.id);
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                            }
                          }}
                        >
                          {notification.actionLabel}
                        </button>
                      {/if}
                      
                      <p class="text-xs text-gray-500 mt-2">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex items-center space-x-1 ml-2">
                      {#if !notification.isRead}
                        <button
                          type="button"
                          on:click={() => markAsRead(notification.id)}
                          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Marcar como leída"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      {/if}
                      
                      <button
                        type="button"
                        on:click={() => removeNotification(notification.id)}
                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Eliminar"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      {#if notifications.length > 0}
        <div class="px-6 py-3 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            class="w-full text-sm text-center text-gray-600 hover:text-gray-800 transition-colors"
            on:click={() => showNotifications = false}
          >
            Ver todas las notificaciones
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for notifications */
  .notification-center ::-webkit-scrollbar {
    width: 6px;
  }
  
  .notification-center ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .notification-center ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .notification-center ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>