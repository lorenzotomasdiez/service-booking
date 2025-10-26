/**
 * Google OAuth 2.0 Configuration
 * Handles all Google OAuth settings and endpoints
 */

export const googleOAuthConfig = {
  // OAuth credentials (from environment variables)
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // Callback URL - must match Google Cloud Console configuration
  callbackURL:
    process.env.BACKEND_URL || 'http://localhost:3000'
      ? `${process.env.BACKEND_URL}/api/auth/oauth/google/callback`
      : 'http://localhost:3000/api/auth/oauth/google/callback',

  // OAuth scopes
  scope: (process.env.GOOGLE_OAUTH_SCOPES || 'openid profile email').split(' '),

  // Google OAuth endpoints
  authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenURL: 'https://www.googleapis.com/oauth2/v4/token',
  userInfoURL: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',

  // OAuth flow settings
  accessType: 'online', // or 'offline' for refresh tokens
  prompt: 'consent', // 'consent' to force re-auth, 'login' to force login
  state: true, // Enable state parameter for CSRF protection

  // Additional parameters
  discoveryURL: 'https://accounts.google.com/.well-known/openid-configuration',
};

/**
 * OAuth state storage keys (for Redis)
 */
export const oauthStateKeys = {
  getStateKey: (stateToken: string) => `oauth:state:${stateToken}`,
  getStatePrefix: () => 'oauth:state:',
  defaultTTL: 10 * 60, // 10 minutes in seconds
};

/**
 * OAuth callback session storage keys (for Redis)
 * Used for secure state token exchange pattern
 */
export const oauthCallbackKeys = {
  getCallbackSessionKey: (callbackToken: string) => `oauth:callback:${callbackToken}`,
  getCallbackPrefix: () => 'oauth:callback:',
  defaultTTL: 5 * 60, // 5 minutes in seconds - short-lived for security
};

/**
 * Fastify OAuth2 plugin configuration for Google
 */
export const fastifyOAuth2GoogleConfig = {
  name: 'google',
  scope: googleOAuthConfig.scope,
  clientId: googleOAuthConfig.clientId,
  clientSecret: googleOAuthConfig.clientSecret,
  callbackUri: googleOAuthConfig.callbackURL,
  discoveryURL: googleOAuthConfig.discoveryURL,
};
