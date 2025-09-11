import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from './database';
import { redis } from './redis';

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

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.CORS_ORIGIN?.split(',') || ['https://barberpro.com.ar']
          : true,
        credentials: true
      },
      transports: ['websocket', 'polling'],
      // Enable compression for Argentina's mobile networks
      compression: true,
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
    this.io.on('connection', (socket: any) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Track connected user
      this.addUserConnection(socket.userId, socket.id);

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

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`User ${socket.userId} disconnected: ${reason}`);
        this.removeUserConnection(socket.userId, socket.id);
        
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

      } catch (error) {
        console.error('Error updating booking status:', error);
        socket.emit('error', { message: 'Error al actualizar reserva' });
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
        await redis.setex(key, 300, JSON.stringify({ // 5 minutes TTL
          status,
          lastSeen: new Date(),
          socketCount: this.connectedUsers.get(userId)?.length || 0
        }));
      } else {
        await redis.setex(key, 3600, JSON.stringify({ // 1 hour TTL for offline
          status,
          lastSeen: new Date(),
          socketCount: 0
        }));
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
      await redis.lpush(key, JSON.stringify({
        ...data,
        timestamp: new Date()
      }));
      // Keep only last 50 updates
      await redis.ltrim(key, 0, 49);
      // Set expiry to 7 days
      await redis.expire(key, 604800);
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
      await redis.lpush(key, JSON.stringify(notification));
      // Keep only last 100 notifications
      await redis.ltrim(key, 0, 99);
      // Set expiry to 30 days
      await redis.expire(key, 2592000);
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
      const updates = await redis.lrange(key, 0, -1);
      await redis.del(key); // Clear after retrieving
      return updates.map(update => JSON.parse(update));
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
      const notifications = await redis.lrange(key, 0, -1);
      await redis.del(key); // Clear after retrieving
      return notifications.map(notification => JSON.parse(notification));
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