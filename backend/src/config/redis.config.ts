/**
 * Redis Configuration for BarberPro Argentina
 * Redis Connection Configuration with Docker Support
 */

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password: string;
  db: number;
  keyPrefix: string;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;
  enableOfflineQueue: boolean;
}

export const redisConfig: RedisConfig = {
  // Full Redis URL (takes precedence over individual settings)
  // Uses Docker service name 'redis' instead of 'localhost'
  url: process.env.REDIS_URL || 'redis://redis:6379',

  // Redis host - uses Docker service name in containers
  host: process.env.REDIS_HOST || 'redis',

  // Redis port
  port: parseInt(process.env.REDIS_PORT || '6379'),

  // Redis password (optional in development)
  password: process.env.REDIS_PASSWORD || '',

  // Redis database number (0-15)
  db: parseInt(process.env.REDIS_DB || '0'),

  // Key prefix for all Redis keys
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'barberpro:',

  // Connection timeout in milliseconds
  connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '10000'),

  // Maximum number of retry attempts
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),

  // Delay between retries in milliseconds
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),

  // Enable offline queue
  enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
};

/**
 * Validate Redis configuration
 * Throws an error if required configuration is missing
 */
export function validateRedisConfig(): void {
  const errors: string[] = [];

  if (!redisConfig.url && !redisConfig.host) {
    errors.push('REDIS_URL or REDIS_HOST is required');
  }

  // Validate port
  if (redisConfig.port <= 0 || redisConfig.port > 65535) {
    errors.push('REDIS_PORT must be a valid port number (1-65535)');
  }

  // Validate database number
  if (redisConfig.db < 0 || redisConfig.db > 15) {
    errors.push('REDIS_DB must be between 0 and 15');
  }

  // Validate retry settings
  if (redisConfig.maxRetries < 0) {
    errors.push('REDIS_MAX_RETRIES must be non-negative');
  }

  if (redisConfig.retryDelay < 0) {
    errors.push('REDIS_RETRY_DELAY must be non-negative');
  }

  if (errors.length > 0) {
    throw new Error(`Redis configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get Redis configuration with validation
 */
export function getRedisConfig(): RedisConfig {
  validateRedisConfig();
  return redisConfig;
}

/**
 * Get connection string for Redis client
 */
export function getRedisUrl(): string {
  if (redisConfig.url) {
    return redisConfig.url;
  }

  // Build connection string from individual components
  const { host, port, password, db } = redisConfig;

  if (password) {
    return `redis://:${password}@${host}:${port}/${db}`;
  }

  return `redis://${host}:${port}/${db}`;
}

export default redisConfig;
