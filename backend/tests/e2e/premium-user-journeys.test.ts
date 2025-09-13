import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { test, Page, Browser, chromium } from '@playwright/test';
import { FastifyInstance } from 'fastify';

describe('Premium User Journeys End-to-End Testing', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('Provider Premium Subscription Journey', () => {
    it('should complete premium subscription upgrade flow', async () => {
      // Navigate to provider dashboard
      await page.goto('http://localhost:3000/dashboard/provider');
      
      // Login as basic tier provider
      await page.fill('[data-testid="email-input"]', 'provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for dashboard to load
      await page.waitForSelector('[data-testid="provider-dashboard"]');
      
      // Navigate to subscription management
      await page.click('[data-testid="subscription-menu"]');
      await page.click('[data-testid="upgrade-subscription"]');
      
      // Select premium plan
      await page.click('[data-testid="premium-plan-card"]');
      await page.click('[data-testid="select-premium-button"]');
      
      // Complete payment flow
      await page.fill('[data-testid="card-number"]', '4111111111111111');
      await page.fill('[data-testid="card-expiry"]', '12/26');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'Test Provider');
      
      await page.click('[data-testid="complete-payment"]');
      
      // Verify upgrade success
      await page.waitForSelector('[data-testid="upgrade-success"]');
      const successMessage = await page.textContent('[data-testid="upgrade-success"]');
      expect(successMessage).toContain('Suscripción Premium activada');
      
      // Verify premium features are now accessible
      await page.click('[data-testid="dashboard-menu"]');
      await expect(page.locator('[data-testid="advanced-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="multi-location-manager"]')).toBeVisible();
      await expect(page.locator('[data-testid="custom-branding"]')).toBeVisible();
    });

    it('should validate premium feature access control', async () => {
      // Login as basic tier provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'basic.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Try to access premium feature directly via URL
      await page.goto('http://localhost:3000/dashboard/provider/advanced-analytics');
      
      // Should redirect to upgrade page
      await page.waitForSelector('[data-testid="upgrade-required"]');
      const upgradeMessage = await page.textContent('[data-testid="upgrade-message"]');
      expect(upgradeMessage).toContain('Esta función requiere una suscripción Premium');
      
      // Verify CTA button is present
      await expect(page.locator('[data-testid="upgrade-now-button"]')).toBeVisible();
    });
  });

  describe('Advanced Provider Dashboard Journey', () => {
    it('should display comprehensive analytics for premium providers', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to advanced analytics
      await page.click('[data-testid="advanced-analytics"]');
      await page.waitForSelector('[data-testid="analytics-dashboard"]');
      
      // Verify revenue metrics
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-growth"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-booking-value"]')).toBeVisible();
      
      // Verify customer insights
      await expect(page.locator('[data-testid="customer-demographics"]')).toBeVisible();
      await expect(page.locator('[data-testid="retention-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="satisfaction-score"]')).toBeVisible();
      
      // Verify performance indicators
      await expect(page.locator('[data-testid="booking-conversion-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancellation-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="peak-hours-analysis"]')).toBeVisible();
      
      // Test date range filtering
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');
      await page.waitForSelector('[data-testid="analytics-updated"]');
      
      // Verify data updates
      const revenueElement = await page.locator('[data-testid="total-revenue"]');
      expect(await revenueElement.getAttribute('data-period')).toBe('30-days');
    });

    it('should enable advanced booking management features', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to booking management
      await page.click('[data-testid="booking-management"]');
      await page.waitForSelector('[data-testid="advanced-booking-tools"]');
      
      // Test bulk operations
      await page.click('[data-testid="select-all-bookings"]');
      await page.click('[data-testid="bulk-actions-menu"]');
      await expect(page.locator('[data-testid="bulk-reschedule"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-notifications"]')).toBeVisible();
      
      // Test advanced filtering
      await page.click('[data-testid="advanced-filters"]');
      await page.fill('[data-testid="service-filter"]', 'Corte de Cabello');
      await page.click('[data-testid="date-range-filter"]');
      await page.click('[data-testid="this-week"]');
      await page.click('[data-testid="apply-filters"]');
      
      await page.waitForSelector('[data-testid="filtered-results"]');
      const resultCount = await page.textContent('[data-testid="result-count"]');
      expect(resultCount).toMatch(/\d+ reservas encontradas/);
    });
  });

  describe('Multi-Location Management Journey', () => {
    it('should enable location setup for premium providers', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to location management
      await page.click('[data-testid="multi-location-manager"]');
      await page.waitForSelector('[data-testid="location-dashboard"]');
      
      // Add new location
      await page.click('[data-testid="add-location-button"]');
      await page.waitForSelector('[data-testid="location-form"]');
      
      // Fill location details
      await page.fill('[data-testid="location-name"]', 'Sucursal Palermo');
      await page.fill('[data-testid="location-address"]', 'Av. Santa Fe 1234, Palermo');
      await page.fill('[data-testid="location-phone"]', '+54 11 1234-5678');
      
      // Set operating hours
      await page.click('[data-testid="monday-checkbox"]');
      await page.fill('[data-testid="monday-open"]', '09:00');
      await page.fill('[data-testid="monday-close"]', '18:00');
      
      // Select services
      await page.click('[data-testid="service-haircut"]');
      await page.click('[data-testid="service-coloring"]');
      
      // Save location
      await page.click('[data-testid="save-location"]');
      
      // Verify location added
      await page.waitForSelector('[data-testid="location-success"]');
      await expect(page.locator('[data-testid="location-card-palermo"]')).toBeVisible();
      
      // Test location switching
      await page.click('[data-testid="location-selector"]');
      await page.click('[data-testid="location-palermo"]');
      await page.waitForSelector('[data-testid="location-dashboard-palermo"]');
      
      const activeLocation = await page.textContent('[data-testid="active-location-name"]');
      expect(activeLocation).toBe('Sucursal Palermo');
    });

    it('should sync bookings across multiple locations', async () => {
      // Login as premium provider with multiple locations
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'multilocation.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to unified booking view
      await page.click('[data-testid="unified-bookings"]');
      await page.waitForSelector('[data-testid="multi-location-calendar"]');
      
      // Verify all locations are displayed
      await expect(page.locator('[data-testid="location-centro"]')).toBeVisible();
      await expect(page.locator('[data-testid="location-palermo"]')).toBeVisible();
      await expect(page.locator('[data-testid="location-belgrano"]')).toBeVisible();
      
      // Test cross-location booking transfer
      await page.click('[data-testid="booking-item-123"]');
      await page.click('[data-testid="transfer-booking"]');
      await page.click('[data-testid="target-location-palermo"]');
      await page.click('[data-testid="confirm-transfer"]');
      
      // Verify transfer success
      await page.waitForSelector('[data-testid="transfer-success"]');
      const transferMessage = await page.textContent('[data-testid="transfer-message"]');
      expect(transferMessage).toContain('Reserva transferida exitosamente');
    });
  });

  describe('Referral Program Journey', () => {
    it('should complete referral invitation and reward process', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to referral program
      await page.click('[data-testid="referral-program"]');
      await page.waitForSelector('[data-testid="referral-dashboard"]');
      
      // Send referral invitation
      await page.click('[data-testid="invite-provider"]');
      await page.fill('[data-testid="referral-email"]', 'newprovider@test.com');
      await page.fill('[data-testid="referral-name"]', 'Nuevo Proveedor');
      await page.fill('[data-testid="referral-message"]', 'Te invito a unirte a BarberPro');
      
      await page.click('[data-testid="send-invitation"]');
      
      // Verify invitation sent
      await page.waitForSelector('[data-testid="invitation-sent"]');
      const invitationMessage = await page.textContent('[data-testid="invitation-message"]');
      expect(invitationMessage).toContain('Invitación enviada exitosamente');
      
      // Check referral tracking
      await expect(page.locator('[data-testid="pending-referrals"]')).toContainText('1');
      
      // Verify referral link generation
      const referralLink = await page.inputValue('[data-testid="referral-link"]');
      expect(referralLink).toMatch(/https:\/\/.*\/ref\/[a-zA-Z0-9]+/);
    });

    it('should track referral rewards and commission adjustments', async () => {
      // Login as provider with successful referrals
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'referrer.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to earnings section
      await page.click('[data-testid="earnings-analytics"]');
      await page.waitForSelector('[data-testid="earnings-dashboard"]');
      
      // Verify referral bonuses
      await expect(page.locator('[data-testid="referral-bonuses"]')).toBeVisible();
      const referralEarnings = await page.textContent('[data-testid="total-referral-earnings"]');
      expect(referralEarnings).toMatch(/ARS \$[\d,]+/);
      
      // Check commission adjustments
      await page.click('[data-testid="commission-details"]');
      await expect(page.locator('[data-testid="referral-discount"]')).toBeVisible();
      
      const discountRate = await page.textContent('[data-testid="current-discount-rate"]');
      expect(discountRate).toMatch(/\d+%/);
    });
  });

  describe('Loyalty Points System Journey', () => {
    it('should track and redeem loyalty points correctly', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to loyalty program
      await page.click('[data-testid="loyalty-program"]');
      await page.waitForSelector('[data-testid="loyalty-dashboard"]');
      
      // Verify current points and tier
      const currentPoints = await page.textContent('[data-testid="current-points"]');
      const currentTier = await page.textContent('[data-testid="current-tier"]');
      
      expect(currentPoints).toMatch(/\d+ puntos/);
      expect(currentTier).toMatch(/(Bronce|Plata|Oro|Platino)/);
      
      // Check points earning history
      await page.click('[data-testid="points-history"]');
      await expect(page.locator('[data-testid="points-transaction"]')).toBeVisible();
      
      // Test points redemption
      await page.click('[data-testid="redeem-points"]');
      await page.waitForSelector('[data-testid="redemption-options"]');
      
      await page.click('[data-testid="redeem-commission-discount"]');
      await page.click('[data-testid="confirm-redemption"]');
      
      // Verify redemption success
      await page.waitForSelector('[data-testid="redemption-success"]');
      const redemptionMessage = await page.textContent('[data-testid="redemption-message"]');
      expect(redemptionMessage).toContain('Puntos canjeados exitosamente');
    });

    it('should handle tier progression correctly', async () => {
      // Login as provider near tier upgrade
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'tier.upgrade@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Complete a high-value booking to trigger tier upgrade
      await page.goto('http://localhost:3000/bookings/create');
      await page.fill('[data-testid="client-email"]', 'client@test.com');
      await page.click('[data-testid="service-premium-package"]');
      await page.click('[data-testid="confirm-booking"]');
      
      // Navigate back to loyalty dashboard
      await page.goto('http://localhost:3000/dashboard/provider/loyalty');
      
      // Verify tier upgrade notification
      await page.waitForSelector('[data-testid="tier-upgrade-notification"]');
      const upgradeMessage = await page.textContent('[data-testid="tier-upgrade-message"]');
      expect(upgradeMessage).toContain('¡Felicitaciones! Has alcanzado el nivel');
      
      // Check new tier benefits
      await page.click('[data-testid="view-tier-benefits"]');
      await expect(page.locator('[data-testid="tier-benefits-list"]')).toBeVisible();
    });
  });

  describe('Dynamic Pricing Journey', () => {
    it('should display and apply dynamic pricing correctly', async () => {
      // Login as premium provider with dynamic pricing enabled
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'dynamic.pricing@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to pricing management
      await page.click('[data-testid="pricing-management"]');
      await page.waitForSelector('[data-testid="dynamic-pricing-dashboard"]');
      
      // Verify current pricing indicators
      await expect(page.locator('[data-testid="demand-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="surge-pricing-status"]')).toBeVisible();
      
      // Check service pricing
      const servicePricing = await page.locator('[data-testid="service-haircut-price"]');
      const currentPrice = await servicePricing.textContent();
      expect(currentPrice).toMatch(/ARS \$\d+/);
      
      // Verify pricing history
      await page.click('[data-testid="pricing-analytics"]');
      await expect(page.locator('[data-testid="pricing-chart"]')).toBeVisible();
      
      // Test manual price override
      await page.click('[data-testid="override-pricing"]');
      await page.fill('[data-testid="override-price"]', '120');
      await page.fill('[data-testid="override-reason"]', 'Promoción especial');
      await page.click('[data-testid="apply-override"]');
      
      // Verify override applied
      await page.waitForSelector('[data-testid="override-success"]');
      const overrideMessage = await page.textContent('[data-testid="override-message"]');
      expect(overrideMessage).toContain('Precio personalizado aplicado');
    });
  });

  describe('Performance and Security Testing', () => {
    it('should maintain performance under premium feature load', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      
      const startTime = Date.now();
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="provider-dashboard"]');
      const loginTime = Date.now() - startTime;
      
      expect(loginTime).toBeLessThan(3000); // Login within 3 seconds
      
      // Test navigation performance between premium features
      const navigationTests = [
        { feature: 'advanced-analytics', maxTime: 2000 },
        { feature: 'multi-location-manager', maxTime: 2000 },
        { feature: 'loyalty-program', maxTime: 1500 },
        { feature: 'referral-program', maxTime: 1500 },
        { feature: 'pricing-management', maxTime: 2000 },
      ];
      
      for (const test of navigationTests) {
        const navStartTime = Date.now();
        await page.click(`[data-testid="${test.feature}"]`);
        await page.waitForSelector(`[data-testid="${test.feature}-dashboard"]`);
        const navTime = Date.now() - navStartTime;
        
        expect(navTime).toBeLessThan(test.maxTime);
      }
    });

    it('should enforce premium feature security correctly', async () => {
      // Test unauthorized access attempts
      const unauthorizedTests = [
        { url: '/dashboard/provider/advanced-analytics', feature: 'analytics' },
        { url: '/dashboard/provider/multi-location', feature: 'locations' },
        { url: '/dashboard/provider/referrals', feature: 'referrals' },
      ];
      
      for (const test of unauthorizedTests) {
        // Try to access without login
        await page.goto(`http://localhost:3000${test.url}`);
        await page.waitForSelector('[data-testid="login-required"]');
        
        // Login as basic tier user
        await page.fill('[data-testid="email-input"]', 'basic.provider@test.com');
        await page.fill('[data-testid="password-input"]', 'testpass123');
        await page.click('[data-testid="login-button"]');
        
        // Try to access premium feature
        await page.goto(`http://localhost:3000${test.url}`);
        await page.waitForSelector('[data-testid="upgrade-required"]');
        
        const accessDeniedMessage = await page.textContent('[data-testid="access-denied"]');
        expect(accessDeniedMessage).toContain('requiere una suscripción Premium');
      }
    });
  });

  describe('Argentina-Specific Premium Features', () => {
    it('should handle AFIP integration for premium providers', async () => {
      // Login as premium provider with AFIP enabled
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'afip.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to tax management
      await page.click('[data-testid="tax-management"]');
      await page.waitForSelector('[data-testid="afip-dashboard"]');
      
      // Verify AFIP integration status
      await expect(page.locator('[data-testid="afip-status-active"]')).toBeVisible();
      
      // Generate monthly report
      await page.click('[data-testid="generate-monthly-report"]');
      await page.waitForSelector('[data-testid="report-generation"]');
      
      // Verify report generation
      await page.waitForSelector('[data-testid="report-ready"]', { timeout: 10000 });
      const reportMessage = await page.textContent('[data-testid="report-message"]');
      expect(reportMessage).toContain('Reporte mensual generado exitosamente');
      
      // Download report
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-report"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/reporte-afip-\d{4}-\d{2}\.pdf/);
    });

    it('should validate Argentina payment preferences', async () => {
      // Login as premium provider
      await page.goto('http://localhost:3000/dashboard/provider');
      await page.fill('[data-testid="email-input"]', 'premium.provider@test.com');
      await page.fill('[data-testid="password-input"]', 'testpass123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to payment settings
      await page.click('[data-testid="payment-settings"]');
      await page.waitForSelector('[data-testid="payment-preferences"]');
      
      // Verify Argentina-specific payment options
      await expect(page.locator('[data-testid="mercadopago-integration"]')).toBeVisible();
      await expect(page.locator('[data-testid="bank-transfer-option"]')).toBeVisible();
      await expect(page.locator('[data-testid="installment-plans"]')).toBeVisible();
      
      // Configure installment options
      await page.click('[data-testid="configure-installments"]');
      await page.check('[data-testid="installment-3"]');
      await page.check('[data-testid="installment-6"]');
      await page.check('[data-testid="installment-12"]');
      
      await page.click('[data-testid="save-payment-preferences"]');
      
      // Verify configuration saved
      await page.waitForSelector('[data-testid="preferences-saved"]');
      const saveMessage = await page.textContent('[data-testid="save-message"]');
      expect(saveMessage).toContain('Preferencias de pago guardadas');
    });
  });
});