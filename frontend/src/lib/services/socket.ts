// Real-time Socket.io Service for BarberPro
// Handles all real-time communication for booking updates
import { io, type Socket } from 'socket.io-client';
import { writable, type Writable } from 'svelte/store';
import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { SocketBookingEvents, TimeSlot, Booking, BookingStatus } from '$lib/types/booking';

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastReconnect: Date | null;
}

class SocketService {
  private socket: Socket | null = null;
  private authToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Stores for reactive state management
  public state: Writable<SocketState> = writable({
    connected: false,
    connecting: false,
    error: null,
    lastReconnect: null
  });

  public availabilityUpdates: Writable<SocketBookingEvents['availability:updated'] | null> = writable(null);
  public bookingUpdates: Writable<SocketBookingEvents['booking:updated'] | null> = writable(null);
  public bookingConflicts: Writable<SocketBookingEvents['booking:conflict'] | null> = writable(null);
  public waitlistNotifications: Writable<SocketBookingEvents['waitlist:notification'] | null> = writable(null);

  constructor() {
    // Don't auto-connect - wait for explicit connect() call after authentication
  }

  // =============================================================================
  // CONNECTION MANAGEMENT
  // =============================================================================

  private initializeSocket() {
    if (!browser) return;

    const socketUrl = env.PUBLIC_SOCKET_URL || 'http://localhost:3000';
    this.authToken = this.getAuthToken();

    if (!this.authToken || !this.isValidTokenFormat(this.authToken)) {
      console.warn('No valid auth token found, Socket.io connection not established');
      return;
    }

    this.state.update(state => ({ ...state, connecting: true, error: null }));

    this.socket = io(socketUrl, {
      auth: {
        token: this.authToken
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      this.reconnectAttempts = 0;
      this.state.update(state => ({
        ...state,
        connected: true,
        connecting: false,
        error: null,
        lastReconnect: new Date()
      }));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.state.update(state => ({
        ...state,
        connected: false,
        connecting: false,
        error: `Desconectado: ${reason}`
      }));

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.state.update(state => ({
        ...state,
        connected: false,
        connecting: false,
        error: `Error de conexión: ${error.message}`
      }));
      this.scheduleReconnect();
    });

    // Real-time booking events
    this.setupBookingEventListeners();
  }

  private setupBookingEventListeners() {
    if (!this.socket) return;

    // Availability updates
    this.socket.on('availability:updated', (data: SocketBookingEvents['availability:updated']) => {
      console.log('📅 Availability updated:', data);
      this.availabilityUpdates.set(data);
    });

    // Booking creation events
    this.socket.on('booking:created', (data: SocketBookingEvents['booking:created']) => {
      console.log('📝 Booking created:', data);
      // Trigger availability update for affected slots
      this.availabilityUpdates.set({
        providerId: data.booking.providerId,
        date: new Date(data.booking.startTime).toISOString().split('T')[0],
        updatedSlots: data.affectedSlots
      });
    });

    // Booking updates
    this.socket.on('booking:updated', (data: SocketBookingEvents['booking:updated']) => {
      console.log('🔄 Booking updated:', data);
      this.bookingUpdates.set(data);
    });

    // Booking cancellations
    this.socket.on('booking:cancelled', (data: SocketBookingEvents['booking:cancelled']) => {
      console.log('❌ Booking cancelled:', data);
      // Update availability with released slots
      if (data.releasedSlots.length > 0) {
        const booking = data.releasedSlots[0];
        this.availabilityUpdates.set({
          providerId: '', // Will be filled by the backend
          date: new Date().toISOString().split('T')[0],
          updatedSlots: data.releasedSlots
        });
      }
    });

    // Booking conflicts
    this.socket.on('booking:conflict', (data: SocketBookingEvents['booking:conflict']) => {
      console.log('⚠️ Booking conflict detected:', data);
      this.bookingConflicts.set(data);
    });

    // Waitlist notifications
    this.socket.on('waitlist:notification', (data: SocketBookingEvents['waitlist:notification']) => {
      console.log('🔔 Waitlist notification:', data);
      this.waitlistNotifications.set(data);
    });

    // Reconnection sync
    this.socket.on('reconnect:sync-data', (data: any) => {
      console.log('🔄 Syncing missed updates:', data);
      // Process missed updates
      if (data.missedBookings) {
        data.missedBookings.forEach((booking: Booking) => {
          this.bookingUpdates.set({
            booking,
            previousStatus: 'PENDING' as BookingStatus // Default previous status
          });
        });
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.state.update(state => ({
        ...state,
        error: 'No se pudo reconectar. Recarga la página.'
      }));
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.reconnect();
    }, delay);
  }

  // =============================================================================
  // PUBLIC METHODS
  // =============================================================================

  /**
   * Manually reconnect to the socket server
   */
  public connect() {
    // Only connect if we have a valid token
    const token = this.getAuthToken();
    if (!token || token.length < 5) { // Reduced minimum length requirement
      console.warn('No valid auth token found, skipping Socket.io connection');
      return;
    }

    // Validate token format (basic JWT structure check)
    if (!this.isValidTokenFormat(token)) {
      console.warn('Invalid auth token format, skipping Socket.io connection');
      return;
    }

    if (!this.socket || this.socket.disconnected) {
      this.initializeSocket();
    }
  }

  public reconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.initializeSocket();
  }

  /**
   * Subscribe to provider availability updates
   */
  public subscribeToProviderAvailability(providerId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot subscribe to availability');
      return;
    }

    this.socket.emit('availability:subscribe', { providerId });
    console.log(`📡 Subscribed to availability updates for provider: ${providerId}`);
  }

  /**
   * Unsubscribe from provider availability updates
   */
  public unsubscribeFromProviderAvailability(providerId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('availability:unsubscribe', { providerId });
    console.log(`📡 Unsubscribed from availability updates for provider: ${providerId}`);
  }

  /**
   * Check real-time availability for booking creation
   */
  public checkLiveAvailability(providerId: string, serviceId: string, startTime: Date): Promise<{
    isAvailable: boolean;
    conflicts?: string[];
    suggestedSlots?: TimeSlot[];
  }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ isAvailable: false, conflicts: ['Socket no conectado'] });
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve({ isAvailable: false, conflicts: ['Timeout de verificación'] });
      }, 5000);

      this.socket.emit('booking:check-availability', {
        providerId,
        serviceId,
        startTime: startTime.toISOString()
      });

      // Listen for the response
      this.socket.once('booking:availability-result', (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      });
    });
  }

  /**
   * Create booking with live conflict detection
   */
  public createLiveBooking(bookingData: any): Promise<{
    success: boolean;
    booking?: Booking;
    conflicts?: string[];
    suggestedSlots?: TimeSlot[];
  }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ 
          success: false, 
          conflicts: ['Socket no conectado. Usa el método tradicional.'] 
        });
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve({ 
          success: false, 
          conflicts: ['Timeout de creación. Intenta nuevamente.'] 
        });
      }, 10000);

      this.socket.emit('booking:create-live', bookingData);

      // Listen for the response
      this.socket.once('booking:create-result', (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      });

      // Listen for conflicts
      this.socket.once('booking:conflict', (conflictData) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          conflicts: [conflictData.conflictReason],
          suggestedSlots: conflictData.suggestedSlots
        });
      });
    });
  }

  /**
   * Request sync for missed updates (after reconnection)
   */
  public requestSync(lastSyncTime?: Date) {
    if (!this.socket?.connected) return;

    this.socket.emit('reconnect:request-sync', {
      lastSyncTime: lastSyncTime?.toISOString() || new Date(Date.now() - 300000).toISOString() // 5 minutes ago default
    });
  }

  /**
   * Join a room for provider-specific updates
   */
  public joinProviderRoom(providerId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('join:provider-room', { providerId });
    console.log(`🏠 Joined provider room: ${providerId}`);
  }

  /**
   * Leave a provider room
   */
  public leaveProviderRoom(providerId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('leave:provider-room', { providerId });
    console.log(`🏠 Left provider room: ${providerId}`);
  }

  /**
   * Update auth token and reconnect
   */
  public updateAuthToken(token: string) {
    this.authToken = token;
    if (this.socket?.connected) {
      this.socket.auth = { token };
      this.reconnect();
    }
  }

  /**
   * Disconnect the socket
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.state.update(state => ({
      ...state,
      connected: false,
      connecting: false,
      error: null
    }));
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getAuthToken(): string | null {
    if (!browser) return null;

    try {
      // Try localStorage first
      const localToken = localStorage.getItem('auth_token');
      if (localToken && localToken.trim()) {
        if (dev) {
          console.log('Found token in localStorage, length:', localToken.length);
        }
        return localToken.trim();
      }

      // Try cookies as fallback
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (cookieToken?.trim()) {
        if (dev) {
          console.log('Found token in cookies, length:', cookieToken.length);
        }
        return cookieToken.trim();
      }

      if (dev) {
        console.log('No auth token found in localStorage or cookies');
      }
      return null;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  /**
   * Basic JWT token format validation
   */
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      console.warn('Token validation failed: token is empty or not a string');
      return false;
    }

    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split('.');

    // Log for debugging in development
    if (dev) {
      console.log('Token validation - parts count:', parts.length, 'token preview:', token.substring(0, 20) + '...');
    }

    // In development, be more lenient
    if (dev) {
      return token.length > 10; // Just check for minimum length in dev
    }

    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Clear all reactive stores
   */
  public clearStores() {
    this.availabilityUpdates.set(null);
    this.bookingUpdates.set(null);
    this.bookingConflicts.set(null);
    this.waitlistNotifications.set(null);
  }

  /**
   * Get connection status for UI display
   */
  public getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.socket.connecting) return 'connecting';
    return 'error';
  }
}

// Create and export singleton instance
export const socketService = new SocketService();

// Export reactive stores for use in components
export const {
  state: socketState,
  availabilityUpdates,
  bookingUpdates,
  bookingConflicts,
  waitlistNotifications
} = socketService;