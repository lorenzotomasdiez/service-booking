import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from './database';
import redis from './redis';

// Import monitoring services for launch day analytics
import { createLaunchDayMonitoringService } from './launch-day-monitoring';
import { createRealTimeAnalyticsService } from './real-time-analytics';

export interface AuthenticatedSocket extends SocketIOServer {
  userId: string;
  userRole: string;
  providerId?: string;
}

export interface BookingUpdateData {
  bookingId: string;
  action: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed';
  booking: any;
  timestamp: Date;
}

export interface NotificationData {
  userId: string;
  type: 'booking' | 'payment' | 'system';
  title: string;
  message: string;
  data?: any;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private monitoringService: any;
  private analyticsService: any;

  constructor(server: HTTPServer) {
    // Initialize monitoring services
    this.monitoringService = createLaunchDayMonitoringService();
    this.analyticsService = createRealTimeAnalyticsService();
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.CORS_ORIGIN?.split(',') || ['https://barberpro.com.ar']
          : true,
        credentials: true
      },
      transports: ['websocket', 'polling'],
      // Note: compression is enabled by default in newer versions
      // Connection timeout optimized for Argentina networks
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret-change-in-production') as any;
        
        // Get user details from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { provider: true }
        });

        if (!user || !user.isActive) {
          throw new Error('User not found or inactive');
        }

        // Attach user data to socket
        socket.userId = user.id;
        socket.userRole = user.role;
        socket.providerId = user.provider?.id;
        socket.userEmail = user.email;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', async (socket: any) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Track connected user
      this.addUserConnection(socket.userId, socket.id);

      // Update connection count in monitoring
      this.monitoringService.updateRealTimeConnections(this.getOnlineUsersCount());

      // Start user session tracking for analytics
      const sessionMetadata = {
        device: socket.handshake.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        location: socket.handshake.headers['x-location'] || 'Argentina',
        referralSource: socket.handshake.query.ref || null,
        timezone: socket.handshake.query.tz || 'America/Argentina/Buenos_Aires'
      };
      
      await this.analyticsService.startUserSession(socket.userId, socket.id, sessionMetadata);

      // Track Argentina activity
      if (sessionMetadata.location) {
        await this.analyticsService.trackArgentinaActivity('session_start', sessionMetadata.location, sessionMetadata);
      }

      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // Join provider room if user is a provider
      if (socket.providerId) {
        socket.join(`provider:${socket.providerId}`);
      }

      // Join role-based rooms
      socket.join(`role:${socket.userRole}`);

      // Handle booking-related events
      this.setupBookingEvents(socket);

      // Handle notification events
      this.setupNotificationEvents(socket);

      // Handle presence events
      this.setupPresenceEvents(socket);

      // Handle reconnection sync
      this.setupReconnectionHandling(socket);

      // Handle real-time availability subscriptions
      this.setupAvailabilityEvents(socket);

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`User ${socket.userId} disconnected: ${reason}`);
        this.removeUserConnection(socket.userId, socket.id);
        
        // Update connection count in monitoring
        this.monitoringService.updateRealTimeConnections(this.getOnlineUsersCount());
        
        // Update presence status
        this.updateUserPresence(socket.userId, 'offline');
      });

      // Handle connection errors
      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Conectado exitosamente a BarberPro',
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  /**
   * Setup booking-related events
   */
  private setupBookingEvents(socket: any): void {
    // Client wants to listen to specific booking updates
    socket.on('subscribe:booking', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
    });

    // Client wants to stop listening to booking updates
    socket.on('unsubscribe:booking', (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
    });

    // Provider wants to listen to their booking updates
    socket.on('subscribe:provider-bookings', () => {
      if (socket.providerId) {
        socket.join(`provider-bookings:${socket.providerId}`);
      }
    });

    // Real-time booking status updates
    socket.on('booking:status-update', async (data: { bookingId: string; status: string }) => {
      try {
        // Verify user has permission to update this booking
        const booking = await prisma.booking.findUnique({
          where: { id: data.bookingId },
          include: { client: true, provider: true, service: true }
        });

        if (!booking) {
          socket.emit('error', { message: 'Reserva no encontrada' });
          return;
        }

        // Check permissions
        const canUpdate = booking.clientId === socket.userId || 
                         booking.provider.userId === socket.userId ||
                         socket.userRole === 'ADMIN';

        if (!canUpdate) {
          socket.emit('error', { message: 'Sin permisos para actualizar esta reserva' });
          return;
        }

        // Emit update to all relevant parties
        this.broadcastBookingUpdate({
          bookingId: data.bookingId,
          action: 'updated',
          booking,
          timestamp: new Date()
        });

        // Broadcast availability update for the affected date
        await this.broadcastAvailabilityUpdate(booking.providerId, booking.startTime);

      } catch (error) {
        console.error('Error updating booking status:', error);
        socket.emit('error', { message: 'Error al actualizar reserva' });
      }
    });

    // Real-time booking attempt (check availability before creating)
    socket.on('booking:check-availability', async (data: { 
      providerId: string; 
      serviceId: string; 
      startTime: string; 
    }) => {
      try {
        const { bookingService } = require('./booking');
        const startTime = new Date(data.startTime);
        
        const service = await prisma.service.findUnique({
          where: { id: data.serviceId }
        });

        if (!service) {
          socket.emit('booking:availability-result', {
            available: false,
            error: 'Servicio no encontrado'
          });
          return;
        }

        const endTime = new Date(startTime.getTime() + (service.duration * 60000));
        const validation = await bookingService.validateBookingSlot(
          data.providerId,
          data.serviceId,
          startTime,
          endTime
        );

        socket.emit('booking:availability-result', {
          available: validation.isValid,
          conflicts: validation.conflicts,
          timeSlot: { start: startTime, end: endTime }
        });

      } catch (error) {
        console.error('Error checking booking availability:', error);
        socket.emit('booking:availability-result', {
          available: false,
          error: 'Error al verificar disponibilidad'
        });
      }
    });

    // Live booking creation with real-time conflict detection
    socket.on('booking:create-live', async (data: {
      providerId: string;
      serviceId: string;
      startTime: string;
      notes?: string;
    }) => {
      try {
        const { bookingService } = require('./booking');
        const startTime = new Date(data.startTime);

        const result = await bookingService.createBookingWithLock({
          clientId: socket.userId,
          providerId: data.providerId,
          serviceId: data.serviceId,
          startTime,
          notes: data.notes
        });

        if (result.success && result.booking) {
          // Emit success to the client
          socket.emit('booking:create-success', {
            booking: result.booking,
            message: 'Reserva creada exitosamente'
          });

          // Broadcast to all relevant parties
          await this.broadcastBookingUpdate({
            bookingId: result.booking.id,
            action: 'created',
            booking: result.booking,
            timestamp: new Date()
          });

          // Update availability for the affected date
          await this.broadcastAvailabilityUpdate(data.providerId, startTime);

        } else {
          // Handle conflicts
          socket.emit('booking:create-conflict', {
            errors: result.errors,
            message: 'El horario ya no está disponible'
          });

          // Suggest alternative slots
          const suggestions = await bookingService.getSuggestedSlots(
            data.providerId,
            data.serviceId,
            startTime
          );

          socket.emit('booking:suggested-slots', {
            suggestions,
            originalRequest: data
          });
        }

      } catch (error) {
        console.error('Error creating live booking:', error);
        socket.emit('booking:create-error', {
          message: 'Error al crear la reserva'
        });
      }
    });
  }

  /**
   * Setup notification events
   */
  private setupNotificationEvents(socket: any): void {
    // Mark notification as read
    socket.on('notification:read', async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { 
            id: notificationId,
            userId: socket.userId 
          },
          data: { 
            status: 'READ',
            readAt: new Date()
          }
        });

        socket.emit('notification:read-success', { notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });

    // Get unread notification count
    socket.on('notifications:get-unread-count', async () => {
      try {
        const count = await prisma.notification.count({
          where: {
            userId: socket.userId,
            status: 'UNREAD'
          }
        });

        socket.emit('notifications:unread-count', { count });
      } catch (error) {
        console.error('Error getting unread count:', error);
      }
    });
  }

  /**
   * Setup presence events
   */
  private setupPresenceEvents(socket: any): void {
    // Update user presence
    this.updateUserPresence(socket.userId, 'online');

    // Handle typing indicators for chat
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(data.conversationId).emit('user:typing', {
        userId: socket.userId,
        typing: true
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(data.conversationId).emit('user:typing', {
        userId: socket.userId,
        typing: false
      });
    });
  }

  /**
   * Setup real-time availability events
   */
  private setupAvailabilityEvents(socket: any): void {
    // Subscribe to provider availability updates
    socket.on('availability:subscribe', (providerId: string) => {
      socket.join(`availability:${providerId}`);
      console.log(`User ${socket.userId} subscribed to availability updates for provider ${providerId}`);
    });

    // Unsubscribe from provider availability updates
    socket.on('availability:unsubscribe', (providerId: string) => {
      socket.leave(`availability:${providerId}`);
      console.log(`User ${socket.userId} unsubscribed from availability updates for provider ${providerId}`);
    });

    // Provider calendar subscription (for provider dashboard)
    socket.on('calendar:subscribe', () => {
      if (socket.providerId) {
        socket.join(`provider-calendar:${socket.providerId}`);
        console.log(`Provider ${socket.providerId} subscribed to calendar updates`);
      }
    });

    // Request immediate availability update
    socket.on('availability:request-update', async (data: { providerId: string; date: string }) => {
      try {
        const requestDate = new Date(data.date);
        await this.broadcastAvailabilityUpdate(data.providerId, requestDate);
      } catch (error) {
        console.error('Error handling availability update request:', error);
        socket.emit('error', { message: 'Error al actualizar disponibilidad' });
      }
    });
  }

  /**
   * Real-time availability synchronization
   */
  public async broadcastAvailabilityUpdate(providerId: string, date: Date): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { bookingService } = require('./booking');
      
      // Get provider services for availability calculation
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: { services: true }
      });

      if (!provider) return;

      const availabilityUpdates = await Promise.all(
        provider.services.map(async (service) => ({
          serviceId: service.id,
          slots: await bookingService.calculateAvailableSlots(providerId, service.id, date)
        }))
      );

      // Emit to provider's calendar subscribers
      this.io.to(`provider-calendar:${providerId}`).emit('availability:updated', {
        providerId,
        date: date.toISOString(),
        availability: availabilityUpdates,
        timestamp: new Date()
      });

      // Emit to global availability watchers for this provider
      this.io.to(`availability:${providerId}`).emit('availability:updated', {
        providerId,
        date: date.toISOString(),
        availability: availabilityUpdates,
        timestamp: new Date()
      });

      console.log(`Broadcasted availability update for provider ${providerId} on ${date.toDateString()}`);
    } catch (error) {
      console.error('Error broadcasting availability update:', error);
    }
  }

  /**
   * Real-time booking conflict detection
   */
  public async notifyBookingConflict(data: {
    userId: string;
    providerId: string;
    conflictDetails: any;
    suggestedSlots: any[];
  }): Promise<void> {
    try {
      const notification = {
        type: 'booking_conflict',
        title: 'Conflicto de Reserva',
        message: 'El horario solicitado ya no está disponible',
        data: {
          conflictDetails: data.conflictDetails,
          suggestedSlots: data.suggestedSlots
        },
        timestamp: new Date()
      };

      // Send to the specific user
      this.io.to(`user:${data.userId}`).emit('booking:conflict', notification);

      console.log(`Notified user ${data.userId} of booking conflict`);
    } catch (error) {
      console.error('Error notifying booking conflict:', error);
    }
  }

  /**
   * Multi-user conflict resolution for simultaneous bookings
   */
  public async handleSimultaneousBooking(data: {
    providerId: string;
    serviceId: string;
    timeSlot: { start: Date; end: Date };
    competingUsers: string[];
  }): Promise<void> {
    try {
      // Notify all competing users about the conflict
      const notification = {
        type: 'booking_race_condition',
        title: 'Reserva Simultánea',
        message: 'Múltiples usuarios intentaron reservar el mismo horario',
        data: {
          providerId: data.providerId,
          serviceId: data.serviceId,
          timeSlot: data.timeSlot
        },
        timestamp: new Date()
      };

      // Send to all competing users
      data.competingUsers.forEach(userId => {
        this.io.to(`user:${userId}`).emit('booking:race-condition', notification);
      });

      // Broadcast updated availability immediately
      await this.broadcastAvailabilityUpdate(data.providerId, data.timeSlot.start);

      console.log(`Handled simultaneous booking for ${data.competingUsers.length} users`);
    } catch (error) {
      console.error('Error handling simultaneous booking:', error);
    }
  }

  /**
   * Reconnection handling for unstable connections
   */
  private setupReconnectionHandling(socket: any): void {
    socket.on('reconnect:request-sync', async () => {
      try {
        // Send missed updates to the user
        const offlineUpdates = await this.getOfflineUpdates(socket.userId);
        const offlineNotifications = await this.getOfflineNotifications(socket.userId);

        socket.emit('reconnect:sync-data', {
          updates: offlineUpdates,
          notifications: offlineNotifications,
          timestamp: new Date()
        });

        // If user is a provider, send current calendar state
        if (socket.providerId) {
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          // Send current availability for next 7 days
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);
            await this.broadcastAvailabilityUpdate(socket.providerId, checkDate);
          }
        }

        console.log(`Synced reconnection data for user ${socket.userId}`);
      } catch (error) {
        console.error('Error handling reconnection sync:', error);
        socket.emit('reconnect:sync-error', { 
          message: 'Error al sincronizar datos de reconexión' 
        });
      }
    });
  }

  /**
   * Broadcast booking update to all relevant users
   */
  public async broadcastBookingUpdate(data: BookingUpdateData): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: {
          client: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      if (!booking) return;

      // Emit to specific booking room
      this.io.to(`booking:${data.bookingId}`).emit('booking:updated', data);

      // Emit to client
      this.io.to(`user:${booking.clientId}`).emit('booking:updated', data);

      // Emit to provider
      this.io.to(`user:${booking.provider.userId}`).emit('booking:updated', data);

      // Emit to provider's booking room
      this.io.to(`provider-bookings:${booking.providerId}`).emit('booking:updated', data);

      // Store in Redis for offline users
      await this.storeOfflineUpdate(booking.clientId, data);
      await this.storeOfflineUpdate(booking.provider.userId, data);

      console.log(`Broadcasted booking update for booking ${data.bookingId}`);
    } catch (error) {
      console.error('Error broadcasting booking update:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  public async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Store notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type.toUpperCase() as any,
          data: data.data
        }
      });

      // Send real-time notification if user is online
      this.io.to(`user:${data.userId}`).emit('notification:new', {
        ...notification,
        timestamp: new Date()
      });

      // Store for offline users
      await this.storeOfflineNotification(data.userId, notification);

      console.log(`Sent notification to user ${data.userId}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Broadcast system-wide announcement
   */
  public async broadcastSystemAnnouncement(message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    this.io.emit('system:announcement', {
      type,
      message,
      timestamp: new Date()
    });

    console.log(`Broadcasted system announcement: ${message}`);
  }

  /**
   * Send notification to all providers
   */
  public async notifyProviders(message: string, data?: any): Promise<void> {
    this.io.to('role:PROVIDER').emit('provider:notification', {
      message,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Send notification to specific provider
   */
  public async notifyProvider(providerId: string, notification: any): Promise<void> {
    try {
      // Get provider's user ID
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: { user: true }
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Send real-time notification
      this.io.to(`user:${provider.userId}`).emit('notification', {
        ...notification,
        timestamp: new Date()
      });

      // Store notification for offline delivery
      await this.storeOfflineNotification(provider.userId, {
        ...notification,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error notifying provider:', error);
    }
  }

  /**
   * Send notification to specific client
   */
  public async notifyClient(clientId: string, notification: any): Promise<void> {
    try {
      // Send real-time notification
      this.io.to(`user:${clientId}`).emit('notification', {
        ...notification,
        timestamp: new Date()
      });

      // Store notification for offline delivery
      await this.storeOfflineNotification(clientId, {
        ...notification,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error notifying client:', error);
    }
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get user connection status
   */
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Track user connection
   */
  private addUserConnection(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId)!.push(socketId);
  }

  /**
   * Remove user connection
   */
  private removeUserConnection(userId: string, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      const index = userSockets.indexOf(socketId);
      if (index > -1) {
        userSockets.splice(index, 1);
      }
      if (userSockets.length === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Update user presence status
   */
  private async updateUserPresence(userId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      const key = `presence:${userId}`;
      if (status === 'online') {
        await redis.set(key, JSON.stringify({ // 5 minutes TTL
          status,
          lastSeen: new Date(),
          socketCount: this.connectedUsers.get(userId)?.length || 0
        }), 300);
      } else {
        await redis.set(key, JSON.stringify({ // 1 hour TTL for offline
          status,
          lastSeen: new Date(),
          socketCount: 0
        }), 3600);
      }
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  /**
   * Store updates for offline users
   */
  private async storeOfflineUpdate(userId: string, data: any): Promise<void> {
    try {
      const key = `offline_updates:${userId}`;
      await redis.getClient().lPush(key, JSON.stringify({
        ...data,
        timestamp: new Date()
      }));
      // Keep only last 50 updates
      await redis.getClient().lTrim(key, 0, 49);
      // Set expiry to 7 days
      await redis.getClient().expire(key, 604800);
    } catch (error) {
      console.error('Error storing offline update:', error);
    }
  }

  /**
   * Store notifications for offline users
   */
  private async storeOfflineNotification(userId: string, notification: any): Promise<void> {
    try {
      const key = `offline_notifications:${userId}`;
      await redis.getClient().lPush(key, JSON.stringify(notification));
      // Keep only last 100 notifications
      await redis.getClient().lTrim(key, 0, 99);
      // Set expiry to 30 days
      await redis.getClient().expire(key, 2592000);
    } catch (error) {
      console.error('Error storing offline notification:', error);
    }
  }

  /**
   * Get offline updates for user
   */
  public async getOfflineUpdates(userId: string): Promise<any[]> {
    try {
      const key = `offline_updates:${userId}`;
      const updates = await redis.getClient().lRange(key, 0, -1);
      await redis.del(key); // Clear after retrieving
      return updates.map((update: string) => JSON.parse(update));
    } catch (error) {
      console.error('Error getting offline updates:', error);
      return [];
    }
  }

  /**
   * Get offline notifications for user
   */
  public async getOfflineNotifications(userId: string): Promise<any[]> {
    try {
      const key = `offline_notifications:${userId}`;
      const notifications = await redis.getClient().lRange(key, 0, -1);
      await redis.del(key); // Clear after retrieving
      return notifications.map((notification: string) => JSON.parse(notification));
    } catch (error) {
      console.error('Error getting offline notifications:', error);
      return [];
    }
  }
}

export let socketService: SocketService;

export function initializeSocketService(server: HTTPServer): SocketService {
  socketService = new SocketService(server);
  return socketService;
}