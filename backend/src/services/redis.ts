import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts, giving up');
            return new Error('Too many reconnection attempts');
          }
          // Exponential backoff: wait 100ms * 2^retries
          const delay = Math.min(100 * Math.pow(2, retries), 3000);
          console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    // Handle errors gracefully to prevent process crash
    // This catches all error events including socket errors
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err.message || err);
      // Mark as disconnected but don't crash the process
      this.isConnected = false;
      // Error is now handled, won't crash Node.js
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
      this.isConnected = true;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
      this.isConnected = false;
    });

    this.client.on('disconnect', () => {
      console.log('⚠️  Redis disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async setJSON(key: string, value: any, expireInSeconds?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.set(key, jsonValue, expireInSeconds);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON from Redis:', error);
      return null;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
const redisService = new RedisService();

export default redisService;

// Export the Redis client for direct access (e.g., in tests)
export const redisClient = redisService.getClient();