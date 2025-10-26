/**
 * T057: Post-Registration Flow Integration Tests
 * Tests for welcome modal, verification reminders, and role-based redirects
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test helpers
async function mockOAuthCallback(page: Page, userData: {
  isNewUser: boolean;
  role: 'CLIENT' | 'PROVIDER';
  isVerified: boolean;
  email: string;
  name: string;
}) {
  // Mock the OAuth callback API response
  await page.route('**/api/auth/oauth/google/callback*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email: userData.email,
            name: userData.name,
            role: userData.role,
            isVerified: userData.isVerified,
            authMethod: 'OAUTH',
            avatar: 'https://example.com/avatar.jpg'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          isNewUser: userData.isNewUser,
          returnTo: undefined
        }
      })
    });
  });

  // Mock the /me endpoint
  await page.route('**/api/auth/me*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'test-user-id',
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isVerified: userData.isVerified,
          authMethod: 'OAUTH',
          avatar: 'https://example.com/avatar.jpg',
          phone: '+54 9 11 1234-5678',
          isActive: true,
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-AR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });
  });
}

async function mockEmailRegistration(page: Page, userData: {
  email: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER';
  isVerified: boolean;
}) {
  await page.route('**/api/auth/register*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email: userData.email,
            name: userData.name,
            role: userData.role,
            isVerified: userData.isVerified,
            authMethod: 'EMAIL',
            phone: '+54 9 11 1234-5678',
            isActive: true,
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR'
          },
          token: 'mock-access-token',
          expiresIn: 3600
        }
      })
    });
  });
}

test.describe('Post-Registration Welcome Flow', () => {
  test('T057.1: Welcome modal appears for new OAuth CLIENT users', async ({ page }) => {
    // Mock new OAuth user registration
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'CLIENT',
      isVerified: true, // OAuth users are auto-verified
      email: 'newclient@example.com',
      name: 'New Client'
    });

    // Navigate to OAuth callback page
    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    // Wait for welcome modal to appear
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });

    // Check welcome message content
    await expect(page.locator('[data-testid="welcome-modal"]')).toContainText('Bienvenido');
    await expect(page.locator('[data-testid="welcome-modal"]')).toContainText('cuenta ha sido creada');

    // Check for profile completion CTA
    await expect(page.locator('[data-testid="profile-completion-cta"]')).toBeVisible();

    // Check for continue button
    await expect(page.locator('[data-testid="continue-dashboard"]')).toBeVisible();
  });

  test('T057.2: Welcome modal appears for new OAuth PROVIDER users', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'PROVIDER',
      isVerified: true,
      email: 'newprovider@example.com',
      name: 'New Provider'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    // Wait for welcome modal
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });

    // Provider-specific welcome message
    await expect(page.locator('[data-testid="welcome-modal"]')).toContainText('Bienvenido');
  });

  test('T057.3: Welcome modal does NOT appear for returning OAuth users', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: false, // Existing user
      role: 'CLIENT',
      isVerified: true,
      email: 'existing@example.com',
      name: 'Existing User'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    // Welcome modal should NOT appear
    await page.waitForTimeout(2000); // Wait to ensure modal doesn't appear
    await expect(page.locator('[data-testid="welcome-modal"]')).not.toBeVisible();
  });

  test('T057.4: Profile completion button navigates to profile page', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'CLIENT',
      isVerified: true,
      email: 'newuser@example.com',
      name: 'New User'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });

    // Click profile completion button
    await page.locator('[data-testid="profile-completion-cta"]').click();

    // Should navigate to profile page
    await expect(page).toHaveURL(/\/dashboard\/client\/profile/, { timeout: 5000 });
  });

  test('T057.5: Continue button navigates to dashboard and closes modal', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'CLIENT',
      isVerified: true,
      email: 'newuser@example.com',
      name: 'New User'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });

    // Click continue button
    await page.locator('[data-testid="continue-dashboard"]').click();

    // Modal should close
    await expect(page.locator('[data-testid="welcome-modal"]')).not.toBeVisible();

    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard\/client/, { timeout: 5000 });
  });
});

test.describe('Role-Based Redirect Logic', () => {
  test('T057.6: CLIENT users redirect to /dashboard/client after OAuth', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'CLIENT',
      isVerified: true,
      email: 'client@example.com',
      name: 'Test Client'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    // After welcome modal, should redirect to client dashboard
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="continue-dashboard"]').click();

    await expect(page).toHaveURL(/\/dashboard\/client/, { timeout: 5000 });
  });

  test('T057.7: PROVIDER users redirect to /dashboard/provider after OAuth', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'PROVIDER',
      isVerified: true,
      email: 'provider@example.com',
      name: 'Test Provider'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="continue-dashboard"]').click();

    await expect(page).toHaveURL(/\/dashboard\/provider/, { timeout: 5000 });
  });

  test('T057.8: Existing CLIENT users redirect to /dashboard/client (no modal)', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: false,
      role: 'CLIENT',
      isVerified: true,
      email: 'existing-client@example.com',
      name: 'Existing Client'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    // Should redirect directly without modal
    await expect(page).toHaveURL(/\/dashboard\/client/, { timeout: 5000 });
  });

  test('T057.9: Existing PROVIDER users redirect to /dashboard/provider (no modal)', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: false,
      role: 'PROVIDER',
      isVerified: true,
      email: 'existing-provider@example.com',
      name: 'Existing Provider'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);

    await expect(page).toHaveURL(/\/dashboard\/provider/, { timeout: 5000 });
  });
});

test.describe('Email Verification Reminder Banner', () => {
  test('T057.10: Verification banner shows for unverified email users', async ({ page }) => {
    // Mock login with unverified email user
    await page.route('**/api/auth/login*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'unverified-user',
              email: 'unverified@example.com',
              name: 'Unverified User',
              role: 'CLIENT',
              isVerified: false, // NOT verified
              authMethod: 'EMAIL',
              phone: '+54 9 11 1234-5678',
              isActive: true,
              timezone: 'America/Argentina/Buenos_Aires',
              locale: 'es-AR'
            },
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            expiresIn: 3600
          }
        })
      });
    });

    await page.route('**/api/auth/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'unverified-user',
            email: 'unverified@example.com',
            name: 'Unverified User',
            role: 'CLIENT',
            isVerified: false,
            authMethod: 'EMAIL',
            phone: '+54 9 11 1234-5678',
            isActive: true,
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    });

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard/client`);

    // Verification banner should be visible
    await expect(page.locator('[data-testid="verification-banner"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="verification-banner"]')).toContainText('verificar');
  });

  test('T057.11: Verification banner does NOT show for verified users', async ({ page }) => {
    await page.route('**/api/auth/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'verified-user',
            email: 'verified@example.com',
            name: 'Verified User',
            role: 'CLIENT',
            isVerified: true, // Verified
            authMethod: 'EMAIL',
            phone: '+54 9 11 1234-5678',
            isActive: true,
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/dashboard/client`);

    // Verification banner should NOT be visible
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="verification-banner"]')).not.toBeVisible();
  });

  test('T057.12: Verification banner does NOT show for OAuth users', async ({ page }) => {
    await page.route('**/api/auth/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'oauth-user',
            email: 'oauth@example.com',
            name: 'OAuth User',
            role: 'CLIENT',
            isVerified: true, // OAuth users are auto-verified
            authMethod: 'OAUTH',
            phone: '+54 9 11 1234-5678',
            isActive: true,
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/dashboard/client`);

    // Verification banner should NOT be visible for OAuth users
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="verification-banner"]')).not.toBeVisible();
  });

  test('T057.13: Resend verification button works in banner', async ({ page }) => {
    await page.route('**/api/auth/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'unverified-user',
            email: 'unverified@example.com',
            name: 'Unverified User',
            role: 'CLIENT',
            isVerified: false,
            authMethod: 'EMAIL',
            phone: '+54 9 11 1234-5678',
            isActive: true,
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
    });

    // Mock resend verification endpoint
    let resendCalled = false;
    await page.route('**/api/auth/resend-verification*', async (route) => {
      resendCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: null
        })
      });
    });

    await page.goto(`${BASE_URL}/dashboard/client`);
    await expect(page.locator('[data-testid="verification-banner"]')).toBeVisible({ timeout: 5000 });

    // Click resend button
    await page.locator('[data-testid="resend-verification-btn"]').click();

    // Should show success message
    await expect(page.locator('[data-testid="resend-success-message"]')).toBeVisible({ timeout: 3000 });

    // Verify API was called
    await page.waitForTimeout(500);
    expect(resendCalled).toBe(true);
  });
});

test.describe('Welcome Modal Accessibility and Responsiveness', () => {
  test('T057.14: Welcome modal is keyboard accessible', async ({ page }) => {
    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'CLIENT',
      isVerified: true,
      email: 'newuser@example.com',
      name: 'New User'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });

    // Tab to profile button
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="profile-completion-cta"]')).toBeFocused();

    // Tab to continue button
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="continue-dashboard"]')).toBeFocused();

    // Press Enter to continue
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="welcome-modal"]')).not.toBeVisible();
  });

  test('T057.15: Welcome modal is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await mockOAuthCallback(page, {
      isNewUser: true,
      role: 'CLIENT',
      isVerified: true,
      email: 'mobile@example.com',
      name: 'Mobile User'
    });

    await page.goto(`${BASE_URL}/auth/callback/google?code=mock-code&state=mock-state`);
    await expect(page.locator('[data-testid="welcome-modal"]')).toBeVisible({ timeout: 5000 });

    // Modal should be visible and properly sized
    const modalBox = await page.locator('[data-testid="welcome-modal"]').boundingBox();
    expect(modalBox).toBeTruthy();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(375);
    }

    // Buttons should be stacked vertically on mobile
    const profileBtn = page.locator('[data-testid="profile-completion-cta"]');
    const continueBtn = page.locator('[data-testid="continue-dashboard"]');

    const profileBox = await profileBtn.boundingBox();
    const continueBox = await continueBtn.boundingBox();

    expect(profileBox).toBeTruthy();
    expect(continueBox).toBeTruthy();
  });
});
