/**
 * OAuth Type Definitions
 * Shared types for Google OAuth authentication
 */

/**
 * OAuth State object stored in Redis
 * Used for CSRF protection during OAuth flow
 */
export interface OAuthState {
  // State token (random string)
  token: string;

  // Timestamp when state was created (for expiration)
  createdAt: number;

  // User's original intent (optional)
  returnTo?: string;

  // Role if user was selecting during registration
  role?: 'CLIENT' | 'PROVIDER';

  // Whether this is a login (false) or registration (true)
  isRegistration?: boolean;
}

/**
 * Google OAuth profile information
 */
export interface GoogleProfile {
  // Google user ID
  id: string;

  // Email address
  email: string;

  // User's name
  name: string;

  // Picture URL
  picture?: string;

  // Locale
  locale?: string;

  // Email verified at Google
  email_verified?: boolean;

  // Raw profile data (all fields from Google)
  _raw?: string;

  // Parsed JSON from raw
  _json?: Record<string, any>;
}

/**
 * OAuth callback data from Google
 */
export interface OAuthCallbackData {
  // Authorization code from Google
  code: string;

  // State token (must match what we sent)
  state: string;

  // Scope granted
  scope?: string;

  // Access token (if provided)
  accessToken?: string;

  // Refresh token (if provided)
  refreshToken?: string;
}

/**
 * OAuth result after successful authentication
 */
export interface OAuthResult {
  // Success flag
  success: boolean;

  // User data
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };

  // JWT tokens
  accessToken?: string;
  refreshToken?: string;

  // Error message (if failed)
  error?: string;

  // Error code (if failed)
  errorCode?: string;

  // Whether user is new (registration) or existing (login)
  isNewUser?: boolean;
}

/**
 * OAuth provider information stored in database
 */
export interface OAuthProviderData {
  id: string;
  userId: string;
  provider: 'GOOGLE' | 'FACEBOOK';
  providerUserId: string;
  email: string;
  profileData?: {
    name?: string;
    picture?: string;
    locale?: string;
    [key: string]: any;
  };
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OAuth error codes
 */
export enum OAuthErrorCode {
  STATE_MISMATCH = 'STATE_MISMATCH',
  STATE_EXPIRED = 'STATE_EXPIRED',
  INVALID_CODE = 'INVALID_CODE',
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  USER_FETCH_FAILED = 'USER_FETCH_FAILED',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  USER_LINKING_FAILED = 'USER_LINKING_FAILED',
  PROVIDER_NOT_SUPPORTED = 'PROVIDER_NOT_SUPPORTED',
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * OAuth callback session data stored in Redis
 * Used for secure state token exchange pattern
 */
export interface OAuthCallbackSession {
  // User data
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
    isVerified: boolean;
    authMethod: string;
  };

  // JWT tokens
  accessToken: string;
  refreshToken: string;
  expiresIn: number;

  // Additional metadata
  isNewUser: boolean;
  returnTo?: string;

  // Timestamp when session was created
  createdAt: number;
}

/**
 * OAuth event for logging
 */
export interface OAuthEvent {
  // Event type
  type: 'INITIATE' | 'CALLBACK' | 'SUCCESS' | 'ERROR' | 'LINK' | 'UNLINK';

  // Provider name
  provider: 'GOOGLE' | 'FACEBOOK';

  // User ID (if known)
  userId?: string;

  // Provider user ID (if known)
  providerUserId?: string;

  // Correlation ID for tracing
  correlationId: string;

  // Timestamp
  timestamp: Date;

  // Additional context
  context?: Record<string, any>;

  // Error (if applicable)
  error?: {
    code: OAuthErrorCode;
    message: string;
  };
}
