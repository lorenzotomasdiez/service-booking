import redisService from './redis';

export class CacheService {
  private defaultTTL = 3600; // 1 hour in seconds

  async get<T>(key: string): Promise<T | null> {
    try {
      return await redisService.getJSON<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await redisService.setJSON(key, value, ttl || this.defaultTTL);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redisService.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await redisService.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Cache keys helper functions
  generateUserKey(userId: string): string {
    return `user:${userId}`;
  }

  generateServiceKey(serviceId: string): string {
    return `service:${serviceId}`;
  }

  generateBookingKey(bookingId: string): string {
    return `booking:${bookingId}`;
  }

  generateProviderServicesKey(providerId: string): string {
    return `provider:${providerId}:services`;
  }

  generateUserBookingsKey(userId: string): string {
    return `user:${userId}:bookings`;
  }

  // Session management
  async setUserSession(userId: string, sessionData: any, ttl = 86400): Promise<void> {
    const key = `session:${userId}`;
    await this.set(key, sessionData, ttl);
  }

  async getUserSession<T>(userId: string): Promise<T | null> {
    const key = `session:${userId}`;
    return await this.get<T>(key);
  }

  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.del(key);
  }
}

export const cacheService = new CacheService();