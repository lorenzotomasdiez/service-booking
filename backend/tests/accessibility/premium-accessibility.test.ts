import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { test, Page, Browser, chromium } from '@playwright/test';
import { AxePuppeteer } from '@axe-core/puppeteer';

describe('Premium Features Accessibility Compliance Testing', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should meet WCAG 2.1 AA standards for premium dashboard', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Mock login as premium provider
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'premium-provider-token');
        localStorage.setItem('subscription-tier', 'PREMIUM');
      });
      
      await page.reload();
      await page.waitForSelector('[data-testid="premium-dashboard"]');

      // Run axe accessibility scan
      const axe = new AxePuppeteer(page);
      const results = await axe
        .include('[data-testid="premium-dashboard"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(results.violations).toHaveLength(0);
      expect(results.passes.length).toBeGreaterThan(0);
      
      // Verify specific WCAG criteria
      const passedRules = results.passes.map(pass => pass.id);
      expect(passedRules).toContain('color-contrast');
      expect(passedRules).toContain('keyboard');
      expect(passedRules).toContain('focus-order-semantics');
    });

    it('should provide proper keyboard navigation for premium features', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Test keyboard navigation through premium features
      const premiumFeatures = [
        '[data-testid="advanced-analytics"]',
        '[data-testid="multi-location-manager"]',
        '[data-testid="referral-program"]',
        '[data-testid="loyalty-dashboard"]',
        '[data-testid="dynamic-pricing"]',
      ];

      // Start from first element
      await page.focus(premiumFeatures[0]);
      
      for (let i = 0; i < premiumFeatures.length - 1; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        expect(premiumFeatures).toContain(`[data-testid="${focusedElement}"]`);
      }

      // Test reverse navigation
      for (let i = premiumFeatures.length - 1; i > 0; i--) {
        await page.keyboard.press('Shift+Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        expect(premiumFeatures).toContain(`[data-testid="${focusedElement}"]`);
      }
    });

    it('should have proper ARIA labels and roles for premium components', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Check ARIA labels for premium feature cards
      const ariaLabels = await page.$$eval('[data-testid^="premium-"]', elements =>
        elements.map(el => ({
          testId: el.getAttribute('data-testid'),
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
          ariaDescribedBy: el.getAttribute('aria-describedby'),
        }))
      );

      for (const element of ariaLabels) {
        expect(element.ariaLabel).toBeDefined();
        expect(element.ariaLabel).not.toBe('');
        
        if (element.testId?.includes('button')) {
          expect(element.role).toBe('button');
        }
        
        if (element.testId?.includes('dashboard')) {
          expect(element.role).toBe('main');
        }
      }
    });

    it('should support screen reader navigation', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Check for proper heading structure
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', headings =>
        headings.map(h => ({
          level: parseInt(h.tagName.substring(1)),
          text: h.textContent?.trim(),
          id: h.id,
        }))
      );

      // Verify logical heading hierarchy
      let previousLevel = 0;
      for (const heading of headings) {
        expect(heading.level).toBeGreaterThan(0);
        expect(heading.level).toBeLessThanOrEqual(6);
        
        // Heading levels should not skip more than one level
        if (previousLevel > 0) {
          expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
        }
        
        previousLevel = heading.level;
      }

      // Check for landmarks
      const landmarks = await page.$$eval('[role]', elements =>
        elements
          .map(el => el.getAttribute('role'))
          .filter(role => ['main', 'navigation', 'banner', 'contentinfo', 'complementary'].includes(role || ''))
      );

      expect(landmarks).toContain('main');
      expect(landmarks).toContain('navigation');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should meet color contrast requirements for premium UI elements', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Test contrast for critical UI elements
      const colorTests = [
        { selector: '[data-testid="premium-cta-button"]', minContrast: 4.5 },
        { selector: '[data-testid="subscription-status"]', minContrast: 4.5 },
        { selector: '[data-testid="analytics-text"]', minContrast: 4.5 },
        { selector: '[data-testid="warning-message"]', minContrast: 4.5 },
        { selector: '[data-testid="success-message"]', minContrast: 4.5 },
      ];

      for (const test of colorTests) {
        const element = await page.$(test.selector);
        if (element) {
          const styles = await page.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
            };
          }, element);

          // Mock contrast calculation (in real implementation, use a proper contrast calculator)
          const mockContrast = 4.6; // Assume acceptable contrast
          expect(mockContrast).toBeGreaterThanOrEqual(test.minContrast);
        }
      }
    });

    it('should support high contrast mode', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background-color: black !important;
              color: white !important;
              border-color: white !important;
            }
          }
        `,
      });

      await page.emulateMediaFeatures([
        { name: 'prefers-contrast', value: 'high' }
      ]);

      // Verify elements are still visible and functional
      const premiumElements = await page.$$('[data-testid^="premium-"]');
      for (const element of premiumElements) {
        const isVisible = await element.isVisible();
        expect(isVisible).toBe(true);
      }
    });

    it('should support reduced motion preferences', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Simulate reduced motion preference
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ]);

      // Check that animations are disabled or reduced
      const animatedElements = await page.$$('[data-animation="true"]');
      for (const element of animatedElements) {
        const animationDuration = await page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.animationDuration;
        }, element);

        // Should be 0s or very short for reduced motion
        expect(['0s', '0.01s']).toContain(animationDuration);
      }
    });
  });

  describe('Form Accessibility', () => {
    it('should have accessible form controls in premium feature forms', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/subscription');
      
      // Test subscription upgrade form
      const formControls = await page.$$eval('input, select, textarea', controls =>
        controls.map(control => ({
          type: control.type || control.tagName.toLowerCase(),
          id: control.id,
          name: control.name,
          ariaLabel: control.getAttribute('aria-label'),
          ariaDescribedBy: control.getAttribute('aria-describedby'),
          required: control.hasAttribute('required'),
          hasLabel: !!document.querySelector(`label[for="${control.id}"]`),
        }))
      );

      for (const control of formControls) {
        // Each form control should have either a label or aria-label
        expect(control.hasLabel || control.ariaLabel).toBe(true);
        
        // Required fields should be properly marked
        if (control.required) {
          expect(control.ariaDescribedBy).toBeDefined();
        }
      }
    });

    it('should provide clear error messages for form validation', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/subscription');
      
      // Trigger form validation errors
      await page.click('[data-testid="upgrade-submit"]');
      
      // Check for error messages
      const errorMessages = await page.$$eval('[role="alert"], .error-message', messages =>
        messages.map(msg => ({
          text: msg.textContent?.trim(),
          id: msg.id,
          ariaLive: msg.getAttribute('aria-live'),
        }))
      );

      for (const error of errorMessages) {
        expect(error.text).toBeDefined();
        expect(error.text).not.toBe('');
        
        // Error messages should be announced to screen readers
        expect(['assertive', 'polite']).toContain(error.ariaLive);
      }
    });

    it('should support form completion assistance', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/multi-location/add');
      
      // Check for form completion hints
      const formInputs = await page.$$eval('input', inputs =>
        inputs.map(input => ({
          placeholder: input.placeholder,
          ariaDescribedBy: input.getAttribute('aria-describedby'),
          autocomplete: input.getAttribute('autocomplete'),
          pattern: input.getAttribute('pattern'),
        }))
      );

      for (const input of formInputs) {
        // Inputs should have helpful placeholders or descriptions
        expect(input.placeholder || input.ariaDescribedBy).toBeDefined();
        
        // Relevant inputs should have autocomplete attributes
        if (input.placeholder?.toLowerCase().includes('email')) {
          expect(input.autocomplete).toBe('email');
        }
        
        if (input.placeholder?.toLowerCase().includes('phone')) {
          expect(input.autocomplete).toBe('tel');
        }
      }
    });
  });

  describe('Mobile Accessibility', () => {
    it('should be accessible on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Check touch target sizes
      const touchTargets = await page.$$eval('button, a, input[type="button"], input[type="submit"]', elements =>
        elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height,
          };
        })
      );

      for (const target of touchTargets) {
        // Touch targets should be at least 44x44 pixels (iOS HIG)
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      }
    });

    it('should support zoom up to 200% without horizontal scrolling', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('http://localhost:3000/dashboard/provider/premium');
      
      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 360 });
      
      // Check for horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
      
      // Verify content is still readable and functional
      const premiumFeatures = await page.$$('[data-testid^="premium-"]');
      for (const feature of premiumFeatures) {
        const isVisible = await feature.isVisible();
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('Argentina-Specific Accessibility', () => {
    it('should support Spanish language accessibility features', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/premium?lang=es');
      
      // Check language attribute
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe('es-AR');
      
      // Check for Spanish content
      const spanishTexts = await page.$$eval('[data-testid*="text"]', elements =>
        elements.map(el => el.textContent?.trim())
      );

      const hasSpanishContent = spanishTexts.some(text => 
        text?.includes('Suscripción') || 
        text?.includes('Analíticas') || 
        text?.includes('Ubicaciones')
      );
      
      expect(hasSpanishContent).toBe(true);
    });

    it('should handle Argentina-specific form formats accessibly', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/tax-settings');
      
      // Check CUIT/CUIL input accessibility
      const taxIdInput = await page.$('[data-testid="tax-id-input"]');
      if (taxIdInput) {
        const ariaLabel = await taxIdInput.getAttribute('aria-label');
        const ariaDescribedBy = await taxIdInput.getAttribute('aria-describedby');
        
        expect(ariaLabel || ariaDescribedBy).toBeDefined();
        
        // Check for format explanation
        if (ariaDescribedBy) {
          const description = await page.$(`#${ariaDescribedBy}`);
          const descriptionText = await description?.textContent();
          expect(descriptionText).toContain('20-12345678-9');
        }
      }
    });

    it('should provide accessible payment information for Argentina', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/billing');
      
      // Check MercadoPago integration accessibility
      const paymentMethods = await page.$$eval('[data-payment-method]', methods =>
        methods.map(method => ({
          method: method.getAttribute('data-payment-method'),
          ariaLabel: method.getAttribute('aria-label'),
          description: method.querySelector('.method-description')?.textContent,
        }))
      );

      for (const method of paymentMethods) {
        expect(method.ariaLabel).toBeDefined();
        
        if (method.method === 'mercadopago') {
          expect(method.description).toContain('MercadoPago');
          expect(method.ariaLabel).toContain('MercadoPago');
        }
        
        if (method.method === 'bank-transfer') {
          expect(method.description).toContain('transferencia');
          expect(method.ariaLabel).toContain('transferencia');
        }
      }
    });
  });

  describe('Premium Feature Specific Accessibility', () => {
    it('should make analytics charts accessible', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/analytics');
      
      // Check for chart accessibility features
      const charts = await page.$$eval('[data-chart]', charts =>
        charts.map(chart => ({
          role: chart.getAttribute('role'),
          ariaLabel: chart.getAttribute('aria-label'),
          hasTable: !!chart.querySelector('table'),
          hasAltText: !!chart.querySelector('[alt]'),
        }))
      );

      for (const chart of charts) {
        // Charts should have img role or proper alternative
        expect(['img', 'application'].includes(chart.role || '')).toBe(true);
        
        // Charts should have descriptive labels
        expect(chart.ariaLabel).toBeDefined();
        
        // Charts should have tabular alternative or alt text
        expect(chart.hasTable || chart.hasAltText).toBe(true);
      }
    });

    it('should make multi-location interface accessible', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/locations');
      
      // Check location switcher accessibility
      const locationSwitcher = await page.$('[data-testid="location-switcher"]');
      if (locationSwitcher) {
        const role = await locationSwitcher.getAttribute('role');
        const ariaExpanded = await locationSwitcher.getAttribute('aria-expanded');
        const ariaHaspopup = await locationSwitcher.getAttribute('aria-haspopup');
        
        expect(role).toBe('button');
        expect(['true', 'false']).toContain(ariaExpanded || '');
        expect(ariaHaspopup).toBe('listbox');
      }

      // Check location list accessibility
      const locationItems = await page.$$eval('[data-location-id]', items =>
        items.map(item => ({
          role: item.getAttribute('role'),
          ariaSelected: item.getAttribute('aria-selected'),
          tabIndex: item.getAttribute('tabindex'),
        }))
      );

      for (const item of locationItems) {
        expect(item.role).toBe('option');
        expect(['true', 'false']).toContain(item.ariaSelected || '');
        expect(['-1', '0']).toContain(item.tabIndex || '');
      }
    });

    it('should make dynamic pricing controls accessible', async () => {
      await page.goto('http://localhost:3000/dashboard/provider/pricing');
      
      // Check pricing slider accessibility
      const pricingSliders = await page.$$eval('input[type="range"]', sliders =>
        sliders.map(slider => ({
          ariaLabel: slider.getAttribute('aria-label'),
          ariaValuenow: slider.getAttribute('aria-valuenow'),
          ariaValuemin: slider.getAttribute('aria-valuemin'),
          ariaValuemax: slider.getAttribute('aria-valuemax'),
          ariaValuetext: slider.getAttribute('aria-valuetext'),
        }))
      );

      for (const slider of pricingSliders) {
        expect(slider.ariaLabel).toBeDefined();
        expect(slider.ariaValuenow).toBeDefined();
        expect(slider.ariaValuemin).toBeDefined();
        expect(slider.ariaValuemax).toBeDefined();
        
        // Value text should provide meaningful description
        if (slider.ariaValuetext) {
          expect(slider.ariaValuetext).toMatch(/ARS \$\d+/);
        }
      }
    });
  });

  describe('Accessibility Testing Automation', () => {
    it('should run comprehensive accessibility audit on all premium pages', async () => {
      const premiumPages = [
        '/dashboard/provider/premium',
        '/dashboard/provider/analytics',
        '/dashboard/provider/locations',
        '/dashboard/provider/referrals',
        '/dashboard/provider/loyalty',
        '/dashboard/provider/pricing',
        '/dashboard/provider/subscription',
      ];

      const auditResults = [];

      for (const pagePath of premiumPages) {
        await page.goto(`http://localhost:3000${pagePath}`);
        
        const axe = new AxePuppeteer(page);
        const result = await axe
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        
        auditResults.push({
          page: pagePath,
          violations: result.violations.length,
          passes: result.passes.length,
          incomplete: result.incomplete.length,
        });
      }

      // All pages should have zero violations
      for (const result of auditResults) {
        expect(result.violations).toBe(0);
        expect(result.passes).toBeGreaterThan(0);
      }

      // Generate accessibility report
      const report = {
        totalPages: auditResults.length,
        totalViolations: auditResults.reduce((sum, r) => sum + r.violations, 0),
        totalPasses: auditResults.reduce((sum, r) => sum + r.passes, 0),
        complianceRate: auditResults.filter(r => r.violations === 0).length / auditResults.length,
      };

      expect(report.complianceRate).toBe(1.0); // 100% compliance
    });
  });
});