/**
 * Database Configuration for BarberPro Argentina
 * PostgreSQL Connection Configuration with Docker Support
 */

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
  connectionTimeout: number;
  idleTimeout: number;
}

export const databaseConfig: DatabaseConfig = {
  // Full database URL (takes precedence over individual settings)
  // Uses Docker service name 'postgres' instead of 'localhost'
  url: process.env.DATABASE_URL || 'postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_dev',

  // Database host - uses Docker service name in containers
  host: process.env.POSTGRES_HOST || 'postgres',

  // Database port
  port: parseInt(process.env.POSTGRES_PORT || '5432'),

  // Database name
  database: process.env.POSTGRES_DB || 'barberpro_dev',

  // Database user
  user: process.env.POSTGRES_USER || 'barberpro',

  // Database password
  password: process.env.POSTGRES_PASSWORD || 'barberpro_dev_password',

  // Use SSL in production
  ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production',

  // Connection pool minimum connections
  poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2'),

  // Connection pool maximum connections
  poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10'),

  // Connection timeout in milliseconds
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),

  // Idle connection timeout in milliseconds
  idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
};

/**
 * Validate Database configuration
 * Throws an error if required configuration is missing
 */
export function validateDatabaseConfig(): void {
  const errors: string[] = [];

  if (!databaseConfig.url && !databaseConfig.host) {
    errors.push('DATABASE_URL or POSTGRES_HOST is required');
  }

  if (!databaseConfig.database) {
    errors.push('POSTGRES_DB is required');
  }

  if (!databaseConfig.user) {
    errors.push('POSTGRES_USER is required');
  }

  if (!databaseConfig.password) {
    errors.push('POSTGRES_PASSWORD is required');
  }

  // Validate port
  if (databaseConfig.port <= 0 || databaseConfig.port > 65535) {
    errors.push('POSTGRES_PORT must be a valid port number (1-65535)');
  }

  // Validate pool sizes
  if (databaseConfig.poolMin < 0) {
    errors.push('DATABASE_POOL_MIN must be non-negative');
  }

  if (databaseConfig.poolMax < databaseConfig.poolMin) {
    errors.push('DATABASE_POOL_MAX must be greater than or equal to DATABASE_POOL_MIN');
  }

  if (errors.length > 0) {
    throw new Error(`Database configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get Database configuration with validation
 */
export function getDatabaseConfig(): DatabaseConfig {
  validateDatabaseConfig();
  return databaseConfig;
}

/**
 * Get connection string for Prisma
 */
export function getDatabaseUrl(): string {
  if (databaseConfig.url) {
    return databaseConfig.url;
  }

  // Build connection string from individual components
  const { user, password, host, port, database } = databaseConfig;
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export default databaseConfig;
