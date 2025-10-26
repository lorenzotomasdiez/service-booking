# OAuth Secure State Token Exchange Pattern

## Problem

The original OAuth callback implementation returned JWT tokens directly as JSON when Google redirected the user to the backend callback URL. This caused:

1. **Broken User Flow**: User saw JSON response instead of being redirected to the frontend application
2. **Security Risk**: JWT tokens could be exposed in browser history, server logs, and network monitoring if passed via URL
3. **Poor UX**: No loading states, welcome modals, or proper error handling

## Solution: State Token Exchange Pattern

We implemented a secure **state token exchange pattern** that eliminates token exposure while providing a seamless user experience.

### Flow Architecture

```
┌─────────┐      ┌─────────┐      ┌────────┐      ┌──────────┐
│ User    │      │ Google  │      │Backend │      │ Frontend │
│ Browser │      │ OAuth   │      │  API   │      │   App    │
└────┬────┘      └────┬────┘      └───┬────┘      └────┬─────┘
     │                │                │                │
     │ 1. Click "Continue with Google" │                │
     ├────────────────────────────────>│                │
     │                                  │                │
     │ 2. Redirect to Google OAuth     │                │
     │<─────────────────────────────────┤                │
     │                                  │                │
     │ 3. Authenticate & Grant          │                │
     ├────────────────>│                │                │
     │                 │                │                │
     │ 4. Google redirects with code    │                │
     │                 ├───────────────>│                │
     │                 │                │                │
     │                 │    5. Exchange code for tokens  │
     │                 │                │ (from Google)  │
     │                 │                │                │
     │                 │    6. Store tokens in Redis    │
     │                 │                │ with callback  │
     │                 │                │ token (5 min)  │
     │                 │                │                │
     │ 7. Redirect to frontend with callback token      │
     │<────────────────────────────────┤                │
     │                                  │                │
     │ 8. Frontend callback page loads │                │
     ├─────────────────────────────────────────────────>│
     │                                  │                │
     │ 9. Exchange callback token for JWT tokens        │
     ├─────────────────────────────────>│                │
     │                                  │                │
     │ 10. Return JWT tokens (API call, not URL)        │
     │<─────────────────────────────────┤                │
     │                                  │                │
     │ 11. Store tokens in auth store, show welcome     │
     │                                  │                │
     └──────────────────────────────────────────────────┘
```

### Key Security Features

1. **JWT Tokens Never in URL**: Tokens are passed via API call (POST request body), not URL query parameters
2. **One-Time Use Callback Token**: Callback token is deleted from Redis after single use
3. **Short TTL**: Callback token expires in 5 minutes (shorter than initial OAuth state)
4. **Redis-Backed**: All session data stored in Redis with automatic expiration
5. **Correlation IDs**: Full tracing for security monitoring and incident response

## Implementation Details

### Backend Changes

#### 1. New TypeScript Types (`backend/src/types/oauth.types.ts`)

```typescript
export interface OAuthCallbackSession {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
    isVerified: boolean;
    authMethod: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
  returnTo?: string;
  createdAt: number;
}
```

#### 2. OAuth Configuration (`backend/src/config/oauth.config.ts`)

```typescript
export const oauthCallbackKeys = {
  getCallbackSessionKey: (callbackToken: string) => `oauth:callback:${callbackToken}`,
  getCallbackPrefix: () => 'oauth:callback:',
  defaultTTL: 5 * 60, // 5 minutes - short-lived for security
};
```

#### 3. OAuth Service Methods (`backend/src/services/oauth.service.ts`)

**Store Callback Session**:
```typescript
async storeCallbackSession(sessionData: OAuthCallbackSession): Promise<string> {
  const callbackToken = crypto.randomBytes(32).toString('base64url');
  const key = oauthCallbackKeys.getCallbackSessionKey(callbackToken);
  await redisService.setJSON(key, sessionData, oauthCallbackKeys.defaultTTL);
  return callbackToken;
}
```

**Exchange Callback Token**:
```typescript
async exchangeCallbackToken(callbackToken: string): Promise<{
  valid: boolean;
  session?: OAuthCallbackSession;
  error?: string;
}> {
  const key = oauthCallbackKeys.getCallbackSessionKey(callbackToken);
  const sessionData = await redisService.getJSON<OAuthCallbackSession>(key);

  if (!sessionData) {
    return { valid: false, error: 'Token de callback inválido o expirado' };
  }

  // Delete token after retrieval (one-time use)
  await redisService.del(key);

  return { valid: true, session: sessionData };
}
```

#### 4. OAuth Routes (`backend/src/routes/oauth.ts`)

**Modified Callback Endpoint** (GET `/auth/oauth/google/callback`):
- Receives OAuth callback from Google
- Exchanges authorization code for tokens
- Creates/updates user in database
- **NEW**: Stores tokens in Redis with callback token
- **NEW**: Redirects to frontend with callback token in URL

```typescript
// Store callback session data in Redis with callback token
const callbackSession: OAuthCallbackSession = { /* user data + tokens */ };
const callbackToken = await oauthService.storeCallbackSession(callbackSession);

// Redirect to frontend with callback token (NOT tokens themselves)
const frontendCallbackUrl = new URL(
  '/auth/callback/google',
  process.env.FRONTEND_URL || 'http://localhost:5173'
);
frontendCallbackUrl.searchParams.set('token', callbackToken);

return reply.redirect(302, frontendCallbackUrl.toString());
```

**New Exchange Endpoint** (POST `/auth/oauth/google/exchange-token`):
- Receives callback token from frontend
- Validates and retrieves session from Redis
- Returns JWT tokens in JSON response
- Deletes callback token (one-time use)

```typescript
fastify.post('/google/exchange-token', {
  body: { token: string },
  response: {
    success: boolean,
    data: {
      user: { id, email, name, ... },
      accessToken: string,
      refreshToken: string,
      expiresIn: number,
      isNewUser: boolean,
      returnTo?: string
    }
  }
});
```

### Frontend Changes

#### Modified Callback Page (`frontend/src/routes/auth/callback/google/+page.svelte`)

**Before** (Broken):
```typescript
// Tried to call backend callback URL as API
const response = await apiClient.get('/auth/oauth/google/callback', {
  params: { code, state }
});
```

**After** (Working):
```typescript
// Get callback token from URL
const callbackToken = params.get('token');

// Exchange callback token for JWT tokens via API call
const response = await apiClient.post('/auth/oauth/google/exchange-token', {
  token: callbackToken
});

// JWT tokens received securely via API response body
const { user, accessToken, refreshToken, isNewUser, returnTo } = response.data;
```

## Security Benefits

| Aspect | Before (Broken) | After (Secure) |
|--------|----------------|----------------|
| **JWT Token Exposure** | In URL (if using query params) | Only in API response body |
| **Browser History** | Tokens visible | Only callback token (no value after expiry) |
| **Server Logs** | Tokens logged | Callback tokens logged (no value) |
| **Network Monitoring** | Tokens in HTTP logs | Tokens in encrypted HTTPS body only |
| **Token Replay** | Possible if URL copied | Impossible (one-time use + 5 min TTL) |
| **CSRF Protection** | OAuth state token | OAuth state + callback token |

## Testing

### Manual Test Flow

1. **Start Services**:
   ```bash
   npm start
   ```

2. **Navigate to Registration**:
   ```
   http://localhost:5173/register
   ```

3. **Click "Continue with Google"**:
   - Browser redirects to Google OAuth page
   - User authenticates with Google account

4. **Google Redirects to Backend**:
   ```
   http://localhost:3000/api/auth/oauth/google/callback?code=...&state=...
   ```

5. **Backend Redirects to Frontend** (NEW):
   ```
   http://localhost:5173/auth/callback/google?token=<callback-token>
   ```

6. **Frontend Exchanges Token**:
   - POST request to `/auth/oauth/google/exchange-token` with `{ token: "..." }`
   - Receives JWT tokens in response
   - Stores tokens in auth store
   - Shows welcome modal (if new user)
   - Redirects to dashboard

### Expected Results

- ✅ User never sees JSON response in browser
- ✅ User lands on frontend callback page with loading state
- ✅ JWT tokens never appear in URL
- ✅ Welcome modal appears for new users
- ✅ User redirected to appropriate dashboard (CLIENT vs PROVIDER)
- ✅ Backend logs show successful OAuth flow with correlation IDs

### Error Scenarios

1. **Invalid Callback Token**:
   - Frontend shows: "Token de callback inválido o expirado"
   - Redirects to login page after 3 seconds

2. **Expired Callback Token** (>5 minutes):
   - Same as invalid token
   - Backend logs show token not found in Redis

3. **User Cancels OAuth**:
   - Frontend shows: "Autenticación cancelada. Puedes intentar nuevamente."
   - Redirects to login page

## Observability

### Log Events

All OAuth events include correlation IDs for tracing:

```json
{
  "oauthEvent": "SUCCESS",
  "provider": "GOOGLE",
  "correlationId": "uuid-here",
  "userId": "user-id",
  "providerUserId": "google-user-id",
  "timestamp": "2025-10-26T11:26:59.563Z",
  "context": {
    "isNewUser": false,
    "authMethod": "OAUTH"
  }
}
```

### Monitoring Queries

**Track OAuth Success Rate**:
```
oauthEvent=SUCCESS | count by provider
```

**Track Callback Token Exchange Failures**:
```
"Invalid or expired callback token" | count
```

**Track OAuth Flow Duration**:
```
oauthEvent=INITIATE to oauthEvent=SUCCESS | duration by correlationId
```

## Environment Variables

Ensure these are configured:

```env
# Backend OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Frontend Configuration
VITE_BACKEND_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

## Production Considerations

1. **HTTPS Required**: All OAuth redirects MUST use HTTPS in production
2. **CORS Configuration**: Ensure frontend domain is whitelisted for `/exchange-token` endpoint
3. **Redis Availability**: Callback tokens require Redis - ensure high availability
4. **TTL Tuning**: 5-minute TTL may need adjustment based on network latency
5. **Rate Limiting**: Consider rate limiting on exchange endpoint to prevent brute-force

## Rollback Plan

If issues arise, revert these commits:
1. `backend/src/routes/oauth.ts` - Callback endpoint changes
2. `backend/src/services/oauth.service.ts` - New exchange methods
3. `frontend/src/routes/auth/callback/google/+page.svelte` - Frontend exchange logic

Original JSON response can be restored by removing redirect and returning:
```typescript
return reply.send({ user, accessToken, refreshToken, ... });
```

However, this will break the user flow (users will see JSON again).

## References

- OAuth 2.0 RFC: https://datatracker.ietf.org/doc/html/rfc6749
- OWASP OAuth Security: https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Security_Cheat_Sheet.html
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2

## Authors

- Implementation: Claude Code + User
- Date: 2025-10-26
- Feature Branch: `002-registration-completion`
