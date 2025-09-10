/**
 * Critical User Journey E2E Tests for BarberPro MVP
 * Tests the most important user flows for Argentina market
 */

import { test, expect, Page } from '@playwright/test';
import { testProviders, testClients, paymentTestScenarios } from '../data/test-users';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('Critical User Journeys - BarberPro MVP', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set Argentina timezone and language
    await page.emulateTimezone('America/Argentina/Buenos_Aires');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-AR,es;q=0.9'
    });
  });

  test.describe('Journey 1: Provider Onboarding (Carlos - Traditional Barber)', () => {
    
    test('Provider can complete full onboarding flow', async ({ page }) => {
      const carlos = testProviders[0]; // Carlos - Traditional Barber
      
      // Step 1: Navigate to registration
      await page.goto(`${BASE_URL}/register/provider`);
      await expect(page).toHaveTitle(/BarberPro.*Registro/);
      
      // Step 2: Fill registration form
      await page.fill('[data-testid="email"]', carlos.email);
      await page.fill('[data-testid="name"]', carlos.name);
      await page.fill('[data-testid="phone"]', carlos.phone);
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password"]', 'TestPassword123!');
      
      // Submit registration
      await page.click('[data-testid="submit-registration"]');
      
      // Step 3: Verify email confirmation page
      await expect(page.locator('[data-testid="email-confirmation-message"]')).toBeVisible();
      
      // For testing, skip email verification (mock it)
      await page.goto(`${BASE_URL}/verify-email?token=test-token&email=${carlos.email}`);
      
      // Step 4: Complete business profile
      await page.fill('[data-testid="business-name"]', carlos.business.name);
      await page.fill('[data-testid="business-description"]', carlos.business.description);
      await page.selectOption('[data-testid="business-type"]', carlos.business.type);
      
      // Step 5: Set location
      await page.fill('[data-testid="address"]', carlos.location!.address);
      await page.fill('[data-testid="city"]', carlos.location!.city);
      await page.selectOption('[data-testid="province"]', carlos.location!.province);
      
      // Step 6: Configure services
      for (const service of carlos.services.slice(0, 2)) { // Test first 2 services
        await page.click('[data-testid="add-service"]');
        await page.fill('[data-testid="service-name"]', service.name);
        await page.fill('[data-testid="service-description"]', service.description);
        await page.fill('[data-testid="service-duration"]', service.duration.toString());
        await page.fill('[data-testid="service-price"]', service.price.toString());
        await page.selectOption('[data-testid="service-category"]', service.category);
        await page.click('[data-testid="save-service"]');
      }
      
      // Step 7: Set working hours
      await page.click('[data-testid="set-working-hours"]');
      await page.fill('[data-testid="monday-open"]', '09:00');
      await page.fill('[data-testid="monday-close"]', '19:00');
      await page.check('[data-testid="copy-to-weekdays"]');
      
      // Step 8: Complete onboarding
      await page.click('[data-testid="complete-onboarding"]');
      
      // Verify successful onboarding
      await expect(page).toHaveURL(/.*\/dashboard\/provider/);
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText(carlos.name);
      
      // Verify business appears in search
      await page.goto(`${BASE_URL}/search?city=${carlos.location!.city}`);
      await expect(page.locator('[data-testid="provider-card"]').first()).toContainText(carlos.business.name);
    });
    
    test('Provider onboarding validates Argentina phone format', async ({ page }) => {
      await page.goto(`${BASE_URL}/register/provider`);
      
      // Test invalid phone formats
      const invalidPhones = [
        '123456789',          // Too short
        '+1234567890123456',  // Too long
        '+5411234567',        // Missing digit
        'invalid-phone'       // Non-numeric
      ];
      
      for (const phone of invalidPhones) {
        await page.fill('[data-testid="phone"]', phone);
        await page.blur('[data-testid="phone"]');
        await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
      }
      
      // Test valid Argentina phone
      await page.fill('[data-testid="phone"]', '+5491123456789');
      await page.blur('[data-testid="phone"]');
      await expect(page.locator('[data-testid="phone-error"]')).not.toBeVisible();
    });
  });

  test.describe('Journey 2: Client Booking Flow (Sofía - Busy Professional)', () => {
    
    test('Client can complete full booking flow from search to payment', async ({ page }) => {
      const sofia = testClients[0]; // Sofía - Busy Professional
      const carlos = testProviders[0]; // Carlos - Provider
      
      // Step 1: Search for services
      await page.goto(BASE_URL);
      await page.fill('[data-testid="search-location"]', sofia.location!.city);
      await page.fill('[data-testid="search-service"]', 'corte');
      await page.click('[data-testid="search-button"]');
      
      // Step 2: Browse results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="provider-card"]')).toHaveCount({ min: 1 });
      
      // Step 3: Select provider
      await page.click(`[data-testid="provider-card"]:has-text("${carlos.business.name}")`);
      
      // Step 4: View provider profile
      await expect(page.locator('[data-testid="provider-name"]')).toContainText(carlos.name);
      await expect(page.locator('[data-testid="provider-services"]')).toBeVisible();
      
      // Step 5: Select service
      await page.click('[data-testid="service-card"]:has-text("Corte Clásico")');
      
      // Step 6: Choose time slot
      await page.click('[data-testid="calendar-next-week"]'); // Book for next week
      await page.click('[data-testid="time-slot"]:has-text("18:00")'); // Sofia's preferred time
      
      // Step 7: Guest booking (no registration required for MVP)
      await page.click('[data-testid="book-as-guest"]');
      
      // Step 8: Fill booking details
      await page.fill('[data-testid="client-name"]', sofia.name);
      await page.fill('[data-testid="client-email"]', sofia.email);
      await page.fill('[data-testid="client-phone"]', sofia.phone);
      await page.fill('[data-testid="booking-notes"]', 'Preferencia por corte moderno');
      
      // Step 9: Review booking summary
      await page.click('[data-testid="review-booking"]');
      await expect(page.locator('[data-testid="booking-summary"]')).toContainText('Corte Clásico');
      await expect(page.locator('[data-testid="total-price"]')).toContainText('$800');
      
      // Step 10: Payment with MercadoPago
      await page.click('[data-testid="proceed-to-payment"]');
      
      // Fill payment details (test cards)
      const paymentData = paymentTestScenarios.successfulPayment;
      await page.fill('[data-testid="card-number"]', paymentData.cardNumber);
      await page.fill('[data-testid="expiry-date"]', paymentData.expiryDate);
      await page.fill('[data-testid="cvv"]', paymentData.cvv);
      await page.fill('[data-testid="cardholder-name"]', paymentData.holderName);
      
      // Step 11: Complete payment
      await page.click('[data-testid="pay-now"]');
      
      // Step 12: Verify confirmation
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible();
      
      // Verify confirmation email sent (check for success message)
      await expect(page.locator('[data-testid="email-sent-message"]')).toContainText('confirmación enviado');
    });
    
    test('Booking flow handles payment failures gracefully', async ({ page }) => {
      const sofia = testClients[0];
      const carlos = testProviders[0];
      
      // Navigate through booking flow to payment
      await page.goto(BASE_URL);
      await page.fill('[data-testid="search-location"]', sofia.location!.city);
      await page.click('[data-testid="search-button"]');
      await page.click(`[data-testid="provider-card"]:has-text("${carlos.business.name}")`);
      await page.click('[data-testid="service-card"]:first');
      await page.click('[data-testid="time-slot"]:first');
      await page.click('[data-testid="book-as-guest"]');
      
      // Fill booking details
      await page.fill('[data-testid="client-name"]', sofia.name);
      await page.fill('[data-testid="client-email"]', sofia.email);
      await page.fill('[data-testid="client-phone"]', sofia.phone);
      await page.click('[data-testid="review-booking"]');
      await page.click('[data-testid="proceed-to-payment"]');
      
      // Use failed payment card
      const failedPayment = paymentTestScenarios.failedPayment;
      await page.fill('[data-testid="card-number"]', failedPayment.cardNumber);
      await page.fill('[data-testid="expiry-date"]', failedPayment.expiryDate);
      await page.fill('[data-testid="cvv"]', failedPayment.cvv);
      await page.fill('[data-testid="cardholder-name"]', failedPayment.holderName);
      
      await page.click('[data-testid="pay-now"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('pago no pudo ser procesado');
      
      // Verify retry option
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
      
      // Verify booking is not confirmed
      await expect(page.locator('[data-testid="booking-confirmation"]')).not.toBeVisible();
    });
  });

  test.describe('Journey 3: Provider Dashboard Management (Martín - Mobile Barber)', () => {
    
    test('Provider can manage daily schedule and bookings', async ({ page }) => {
      const martin = testProviders[1]; // Martín - Mobile Barber
      
      // Step 1: Login as provider
      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="email"]', martin.email);
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      // Verify redirect to provider dashboard
      await expect(page).toHaveURL(/.*\/dashboard\/provider/);
      
      // Step 2: View today's schedule
      await expect(page.locator('[data-testid="daily-schedule"]')).toBeVisible();
      await expect(page.locator('[data-testid="provider-name"]')).toContainText(martin.name);
      
      // Step 3: Check upcoming bookings
      await page.click('[data-testid="upcoming-bookings-tab"]');
      await expect(page.locator('[data-testid="bookings-list"]')).toBeVisible();
      
      // Step 4: Update availability
      await page.click('[data-testid="manage-availability"]');
      await page.click('[data-testid="block-time-slot"]');
      await page.fill('[data-testid="block-start-time"]', '14:00');
      await page.fill('[data-testid="block-end-time"]', '15:00');
      await page.fill('[data-testid="block-reason"]', 'Descanso / Viaje');
      await page.click('[data-testid="save-blocked-time"]');
      
      // Verify blocked time appears
      await expect(page.locator('[data-testid="blocked-time-14:00"]')).toBeVisible();
      
      // Step 5: Accept a pending booking
      await page.click('[data-testid="pending-bookings-tab"]');
      const pendingBooking = page.locator('[data-testid="pending-booking"]').first();
      await pendingBooking.locator('[data-testid="accept-booking"]').click();
      
      // Verify booking moved to confirmed
      await page.click('[data-testid="confirmed-bookings-tab"]');
      await expect(page.locator('[data-testid="confirmed-booking"]')).toHaveCount({ min: 1 });
      
      // Step 6: Send message to client
      await page.locator('[data-testid="confirmed-booking"]').first().click();
      await page.click('[data-testid="message-client"]');
      await page.fill('[data-testid="message-text"]', 'Hola, confirmo tu cita para mañana. ¡Te espero!');
      await page.click('[data-testid="send-message"]');
      
      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness Tests', () => {
    
    test('Booking flow works correctly on mobile devices', async ({ page }) => {
      // Emulate mobile device
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const sofia = testClients[0];
      const carlos = testProviders[0];
      
      await page.goto(BASE_URL);
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await page.click('[data-testid="close-mobile-menu"]');
      
      // Test mobile search
      await page.fill('[data-testid="search-location"]', sofia.location!.city);
      await page.click('[data-testid="search-button"]');
      
      // Verify mobile-friendly results
      await expect(page.locator('[data-testid="provider-card"]')).toBeVisible();
      
      // Test mobile booking flow
      await page.click('[data-testid="provider-card"]');
      await page.click('[data-testid="service-card"]');
      
      // Verify mobile calendar
      await expect(page.locator('[data-testid="mobile-calendar"]')).toBeVisible();
      await page.click('[data-testid="time-slot"]');
      
      // Complete mobile booking
      await page.click('[data-testid="book-as-guest"]');
      await page.fill('[data-testid="client-name"]', sofia.name);
      await page.fill('[data-testid="client-email"]', sofia.email);
      await page.fill('[data-testid="client-phone"]', sofia.phone);
      
      // Verify mobile form handling
      await page.click('[data-testid="review-booking"]');
      await expect(page.locator('[data-testid="mobile-booking-summary"]')).toBeVisible();
    });
  });

  test.describe('Argentina-Specific Features', () => {
    
    test('System handles Argentina timezone correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // Check that time displays use Argentina timezone
      const timeElements = page.locator('[data-testid="time-slot"]');
      await expect(timeElements.first()).toBeVisible();
      
      // Verify siesta time is handled (13:00-15:00 typically blocked)
      const siestaTime = page.locator('[data-testid="time-slot"]:has-text("14:00")');
      await expect(siestaTime).toHaveCount(0); // Should not be available during siesta
    });
    
    test('Currency displays correctly in Argentine Pesos', async ({ page }) => {
      const carlos = testProviders[0];
      
      await page.goto(`${BASE_URL}/provider/${carlos.email}`);
      
      // Check price formatting
      await expect(page.locator('[data-testid="service-price"]')).toContainText('$800');
      await expect(page.locator('[data-testid="service-price"]')).not.toContainText('USD');
    });
    
    test('Phone number validation works for Argentina format', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Test valid Argentina phone numbers
      const validPhones = [
        '+5491123456789',   // Buenos Aires mobile
        '+5493514567890',   // Córdoba mobile
        '+5401112345678'    // Buenos Aires landline
      ];
      
      for (const phone of validPhones) {
        await page.fill('[data-testid="phone"]', phone);
        await page.blur('[data-testid="phone"]');
        await expect(page.locator('[data-testid="phone-error"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Performance Tests', () => {
    
    test('Page load times meet Argentina network requirements', async ({ page }) => {
      const start = Date.now();
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - start;
      
      // Should load within 3 seconds for 3G Argentina networks
      expect(loadTime).toBeLessThan(3000);
    });
    
    test('Search results load quickly with many providers', async ({ page }) => {
      await page.goto(`${BASE_URL}/search?city=Buenos Aires`);
      
      const start = Date.now();
      await page.waitForSelector('[data-testid="search-results"]');
      const searchTime = Date.now() - start;
      
      // Search should complete within 1 second
      expect(searchTime).toBeLessThan(1000);
    });
  });

});

// Helper functions for test setup
async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

async function mockMercadoPagoSuccess(page: Page): Promise<void> {
  // Mock successful MercadoPago response
  await page.route('**/api/payments/mercadopago', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-payment-id',
        status: 'approved',
        status_detail: 'accredited'
      })
    });
  });
}

async function mockMercadoPagoFailure(page: Page): Promise<void> {
  // Mock failed MercadoPago response
  await page.route('**/api/payments/mercadopago', route => {
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'payment_rejected',
        message: 'El pago fue rechazado'
      })
    });
  });
}