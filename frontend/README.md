# BarberPro Frontend

Modern, mobile-first frontend for BarberPro service booking platform built with SvelteKit, TypeScript, and TailwindCSS.

## Tech Stack

- **Framework**: SvelteKit (Vite-based)
- **Language**: TypeScript 5.9.2
- **Styling**: TailwindCSS 3.x
- **State Management**: Svelte Stores
- **HTTP Client**: Fetch API
- **Forms**: Svelte bindings with validation
- **PWA**: Progressive Web App capabilities

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:5173
```

## Development

### Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code with ESLint
npm run lint:fix         # Fix linting issues
npm run typecheck        # TypeScript type checking
npm run format:check     # Check code formatting
npm run format:fix       # Fix code formatting
```

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:unit        # Run unit tests
npm run test:e2e         # Run E2E tests with Playwright
```

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=10000

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Feature Flags
VITE_ENABLE_OAUTH=true
VITE_ENABLE_EMAIL_VERIFICATION=true

# App Configuration
VITE_APP_NAME=BarberPro
VITE_APP_URL=http://localhost:5173
```

**Note**: All environment variables must be prefixed with `VITE_` to be exposed to the frontend.

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/           # Svelte components
│   │   │   ├── auth/             # Authentication components
│   │   │   │   ├── LoginForm.svelte
│   │   │   │   ├── RegisterForm.svelte
│   │   │   │   ├── OAuthButtons.svelte
│   │   │   │   └── VerificationBanner.svelte
│   │   │   ├── booking/          # Booking components
│   │   │   ├── provider/         # Provider components
│   │   │   └── core/             # Core UI components
│   │   ├── stores/               # Svelte stores
│   │   │   ├── auth.ts           # Auth store
│   │   │   └── user.ts           # User store
│   │   ├── services/             # API services
│   │   │   ├── api.ts            # Base API client
│   │   │   ├── auth.service.ts   # Auth API calls
│   │   │   └── oauth.service.ts  # OAuth API calls
│   │   ├── utils/                # Utility functions
│   │   │   ├── validation.ts     # Form validation
│   │   │   └── argentina.ts      # Argentina-specific utils
│   │   └── types/                # TypeScript types
│   │       └── auth.types.ts     # Auth types
│   ├── routes/                   # SvelteKit routes
│   │   ├── +page.svelte          # Home page
│   │   ├── +layout.svelte        # Root layout
│   │   ├── auth/                 # Auth routes
│   │   │   ├── login/
│   │   │   │   └── +page.svelte  # Login page
│   │   │   ├── register/
│   │   │   │   ├── client/
│   │   │   │   │   └── +page.svelte  # Client registration
│   │   │   │   └── provider/
│   │   │   │       └── +page.svelte  # Provider registration
│   │   │   ├── google/
│   │   │   │   └── callback/
│   │   │   │       └── +page.svelte  # OAuth callback
│   │   │   └── verify-email/
│   │   │       └── +page.svelte  # Email verification
│   │   ├── dashboard/            # User dashboard
│   │   └── bookings/             # Booking pages
│   ├── app.html                  # HTML template
│   └── app.css                   # Global styles
├── static/                       # Static assets
│   ├── favicon.png
│   └── images/
├── tests/                        # Tests
│   ├── unit/                     # Unit tests
│   └── e2e/                      # E2E tests
├── .env                          # Environment variables
├── svelte.config.js              # SvelteKit config
├── vite.config.ts                # Vite config
├── tailwind.config.js            # TailwindCSS config
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## Authentication & Registration

### Registration Flow

BarberPro supports two registration methods:

#### 1. Email/Password Registration

**Routes:**
- Client registration: `/auth/register/client`
- Provider registration: `/auth/register/provider`

**Flow:**

1. User navigates to registration page
2. Fills out registration form:
   - Name (required)
   - Email (required, validated)
   - Password (required, strength validation)
   - Phone (optional, Argentina format)
   - DNI (optional, Argentina format)
   - CUIT (optional, for providers)
3. Submits form → `POST /api/auth/register`
4. Backend creates user with `isVerified: false`
5. Backend sends verification email
6. User receives access token and is logged in
7. Verification banner shows: "Por favor verifica tu email"
8. User clicks link in email → `/auth/verify-email?token={token}`
9. Email is verified, banner disappears

**Components:**
- `src/lib/components/auth/RegisterForm.svelte` - Registration form
- `src/lib/components/auth/VerificationBanner.svelte` - Email verification reminder
- `src/routes/auth/register/client/+page.svelte` - Client registration page
- `src/routes/auth/register/provider/+page.svelte` - Provider registration page

#### 2. OAuth Registration (Google)

**Route:** `/auth/google/callback`

**Flow:**

1. User clicks "Continue with Google" button
2. Frontend redirects to backend OAuth endpoint: `GET /api/oauth/google`
3. User is redirected to Google login
4. User authenticates with Google
5. Google redirects to: `GET /api/oauth/google/callback?code={code}`
6. Backend exchanges code for user profile
7. If user exists: login, redirect to dashboard
8. If new user:
   - Backend creates user with `authMethod: 'OAUTH'`
   - Email is pre-verified (`isVerified: true`)
   - No password required
   - User selects role (CLIENT or PROVIDER)
9. Backend redirects to: `/auth/google/callback?access_token={token}&refresh_token={token}`
10. Frontend stores tokens and redirects to dashboard

**Components:**
- `src/lib/components/auth/OAuthButtons.svelte` - OAuth login buttons
- `src/routes/auth/google/callback/+page.svelte` - OAuth callback handler

**Configuration:**

Set Google Client ID in `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Note**: The actual OAuth flow is handled by the backend. The frontend only:
- Provides the "Continue with Google" button
- Handles the callback redirect
- Stores the tokens
- Redirects the user to the appropriate page

### Login Flow

**Route:** `/auth/login`

**Flow:**

1. User navigates to `/auth/login`
2. Fills out login form:
   - Email
   - Password
   - Remember me (optional)
3. Submits form → `POST /api/auth/login`
4. Backend validates credentials
5. Backend returns access token and refresh token
6. Frontend stores tokens in stores
7. Redirect to dashboard or previous page

**Email/Password Login:**
```svelte
<LoginForm on:success={handleLoginSuccess} />
```

**OAuth Login:**
```svelte
<OAuthButtons provider="google" on:click={handleOAuthClick} />
```

### Email Verification

**Route:** `/auth/verify-email?token={token}`

**Flow:**

1. User receives verification email
2. Clicks link in email
3. Frontend extracts token from URL
4. Calls backend: `GET /api/auth/verify-email?token={token}`
5. Backend validates token and marks email as verified
6. Frontend shows success message
7. Redirects to dashboard

**Resend Verification Email:**

For authenticated users:
```typescript
await authService.resendVerification();
```

For unauthenticated users:
```typescript
await authService.sendVerification(email);
```

**Rate Limits:**
- Public endpoint: 3 emails per hour per email address
- Authenticated endpoint: 3 emails per hour per user

### Verification Status

**Component:** `VerificationBanner.svelte`

Shows a banner at the top of the page if user's email is not verified:

```svelte
<script>
  import VerificationBanner from '$lib/components/auth/VerificationBanner.svelte';
</script>

<VerificationBanner />
```

**Features:**
- Only shows for logged-in users with unverified emails
- Dismissible (hides for session)
- Shows resend button (rate limited)
- Auto-updates when verification is complete

## API Integration

### Base API Client

Location: `src/lib/services/api.ts`

```typescript
import { api } from '$lib/services/api';

// GET request
const user = await api.get('/auth/me');

// POST request
const response = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// PUT request
const updated = await api.put('/auth/me', {
  name: 'New Name'
});

// DELETE request
await api.delete('/auth/logout');
```

**Features:**
- Automatic token injection (Authorization header)
- Automatic token refresh on 401
- Error handling and retry logic
- Request/response interceptors
- TypeScript typed responses

### Auth Service

Location: `src/lib/services/auth.service.ts`

```typescript
import { authService } from '$lib/services/auth.service';

// Register
const result = await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!',
  role: 'CLIENT'
});

// Login
const tokens = await authService.login({
  email: 'john@example.com',
  password: 'Password123!'
});

// Logout
await authService.logout();

// Get current user
const user = await authService.getCurrentUser();

// Send verification email
await authService.sendVerification('john@example.com');

// Resend verification (authenticated)
await authService.resendVerification();

// Check verification status
const status = await authService.getVerificationStatus();
```

### OAuth Service

Location: `src/lib/services/oauth.service.ts`

```typescript
import { oauthService } from '$lib/services/oauth.service';

// Initiate Google OAuth flow
oauthService.loginWithGoogle();

// Handle OAuth callback
const tokens = await oauthService.handleCallback(code, state);
```

## State Management

### Auth Store

Location: `src/lib/stores/auth.ts`

```typescript
import { authStore } from '$lib/stores/auth';

// Subscribe to auth state
authStore.subscribe((state) => {
  console.log('User:', state.user);
  console.log('Is authenticated:', state.isAuthenticated);
  console.log('Is verified:', state.isVerified);
});

// Check if authenticated
const isAuth = get(authStore).isAuthenticated;

// Get current user
const user = get(authStore).user;

// Login
await authStore.login(email, password);

// Logout
await authStore.logout();

// Update user
authStore.setUser(updatedUser);
```

**State:**
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  isVerified: boolean,
  isLoading: boolean,
  error: string | null
}
```

## Form Validation

### Client-Side Validation

All forms include real-time validation with Spanish error messages:

**Password Validation:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Email Validation:**
- Valid email format
- Maximum 255 characters

**Phone Validation (Argentina):**
- Format: `+54 9 11 1234-5678`
- Optional country code
- Area code validation
- Length validation

**DNI Validation (Argentina):**
- Format: `12.345.678`
- 7-8 digits
- Optional dots

**CUIT Validation (Argentina):**
- Format: `20-12345678-9`
- Valid check digit
- Optional dashes

### Error Display

Validation errors are shown inline below each field:

```svelte
<input
  type="email"
  bind:value={email}
  class:error={emailError}
/>
{#if emailError}
  <p class="error-message">{emailError}</p>
{/if}
```

## Routing

### File-Based Routing

SvelteKit uses file-based routing. Each `+page.svelte` file creates a route:

```
src/routes/
├── +page.svelte                    → /
├── auth/
│   ├── login/+page.svelte          → /auth/login
│   ├── register/
│   │   ├── client/+page.svelte     → /auth/register/client
│   │   └── provider/+page.svelte   → /auth/register/provider
│   ├── google/
│   │   └── callback/+page.svelte   → /auth/google/callback
│   └── verify-email/+page.svelte   → /auth/verify-email
└── dashboard/+page.svelte          → /dashboard
```

### Protected Routes

Use `+page.server.ts` or `+layout.server.ts` to protect routes:

```typescript
// +page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }

  return {
    user: locals.user
  };
};
```

### Navigation

```svelte
<script>
  import { goto } from '$app/navigation';

  function navigateToDashboard() {
    goto('/dashboard');
  }
</script>

<a href="/auth/login">Login</a>
<button on:click={navigateToDashboard}>Dashboard</button>
```

## Styling

### TailwindCSS

All components use TailwindCSS utility classes:

```svelte
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Click me
</button>
```

### Custom Theme

Configure theme in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

### Global Styles

Location: `src/app.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded;
  }
}
```

## PWA Configuration

BarberPro is a Progressive Web App with offline capabilities.

### Service Worker

Location: `src/service-worker.ts`

**Features:**
- Cache-first strategy for static assets
- Network-first for API calls
- Offline page fallback
- Background sync for bookings

### Manifest

Location: `static/manifest.json`

```json
{
  "name": "BarberPro",
  "short_name": "BarberPro",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## Argentina-Specific Features

### Locale

All text is in Spanish (es-AR):
- Error messages
- Form labels
- Validation messages
- Date/time formatting

### Phone Number Formatting

```typescript
import { formatArgentinaPhone } from '$lib/utils/argentina';

const formatted = formatArgentinaPhone('1112345678');
// Output: +54 9 11 1234-5678
```

### DNI Formatting

```typescript
import { formatDNI } from '$lib/utils/argentina';

const formatted = formatDNI('12345678');
// Output: 12.345.678
```

### CUIT Formatting

```typescript
import { formatCUIT } from '$lib/utils/argentina';

const formatted = formatCUIT('20123456789');
// Output: 20-12345678-9
```

### Currency

```typescript
import { formatCurrency } from '$lib/utils/argentina';

const formatted = formatCurrency(1500);
// Output: $1.500,00 ARS
```

### Timezone

All dates use Argentina timezone (America/Argentina/Buenos_Aires):

```typescript
import { formatDate } from '$lib/utils/argentina';

const formatted = formatDate(new Date());
// Output: 25/10/2025 14:30 (AR)
```

## Performance Optimization

### Code Splitting

SvelteKit automatically splits code by route:
- Each route is a separate chunk
- Components are lazy-loaded
- Only loads what's needed for current page

### Image Optimization

```svelte
<script>
  import { onMount } from 'svelte';

  let imageSrc = '/placeholder.png';

  onMount(() => {
    // Lazy load image
    const img = new Image();
    img.src = '/actual-image.png';
    img.onload = () => {
      imageSrc = '/actual-image.png';
    };
  });
</script>

<img src={imageSrc} alt="Description" loading="lazy" />
```

### Prefetching

```svelte
<a href="/dashboard" data-sveltekit-prefetch>Dashboard</a>
```

## Error Handling

### Global Error Handler

Location: `src/routes/+error.svelte`

```svelte
<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="error-page">
  <h1>{data.status}</h1>
  <p>{data.message}</p>
  <a href="/">Volver al inicio</a>
</div>
```

### API Error Handling

```typescript
try {
  await authService.login(email, password);
} catch (error) {
  if (error.status === 401) {
    errorMessage = 'Credenciales inválidas';
  } else if (error.status === 429) {
    errorMessage = 'Demasiados intentos. Por favor, espera un momento.';
  } else {
    errorMessage = 'Error al iniciar sesión. Por favor, intenta nuevamente.';
  }
}
```

## Testing

### Unit Tests

Location: `tests/unit/`

```bash
npm run test:unit
```

Test components in isolation:

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import LoginForm from '$lib/components/auth/LoginForm.svelte';

test('submits login form', async () => {
  const { getByLabelText, getByText } = render(LoginForm);

  const emailInput = getByLabelText('Email');
  const passwordInput = getByLabelText('Contraseña');
  const submitButton = getByText('Iniciar sesión');

  await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
  await fireEvent.input(passwordInput, { target: { value: 'Password123!' } });
  await fireEvent.click(submitButton);

  // Assert form submitted
});
```

### E2E Tests

Location: `tests/e2e/`

```bash
npm run test:e2e
```

Test complete user flows:

```typescript
import { test, expect } from '@playwright/test';

test('user can register and verify email', async ({ page }) => {
  await page.goto('/auth/register/client');

  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Password123!');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.verification-banner')).toBeVisible();
});
```

## Deployment

### Production Build

```bash
npm run build
```

Outputs to `build/` directory.

### Preview Production Build

```bash
npm run preview
```

### Environment Variables

Set production environment variables:

```env
VITE_API_URL=https://api.barberpro.com
VITE_GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
VITE_APP_URL=https://barberpro.com
```

### Deployment Checklist

- [ ] Update API URL to production
- [ ] Update Google OAuth redirect URIs
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Enable gzip/brotli compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Enable error tracking (e.g., Sentry)
- [ ] Set up analytics
- [ ] Test PWA installation
- [ ] Verify service worker caching
- [ ] Test offline functionality

## Troubleshooting

### OAuth Redirect Not Working

1. Check `VITE_GOOGLE_CLIENT_ID` is set correctly
2. Verify redirect URI in Google Console matches frontend URL
3. Check backend `GOOGLE_REDIRECT_URI` matches frontend callback route
4. Ensure cookies are enabled in browser

### API Connection Issues

1. Check `VITE_API_URL` points to correct backend
2. Verify CORS is configured on backend
3. Check network tab for failed requests
4. Verify backend is running

### Email Verification Not Working

1. Check MailHog is running (development): http://localhost:8025
2. Verify `EMAIL_HOST` and `EMAIL_PORT` in backend `.env`
3. Check spam folder
4. Verify frontend `VITE_APP_URL` matches email links

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear SvelteKit cache
rm -rf .svelte-kit

# Rebuild
npm run build
```

## Contributing

1. Follow TypeScript strict mode
2. Use Spanish for all user-facing text
3. Write tests for new components
4. Use TailwindCSS for styling
5. Follow Argentina-specific patterns
6. Update documentation for new features

## License

Proprietary - BarberPro
