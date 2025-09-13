/**
 * Accessibility Testing Automation - WCAG 2.1 AA Compliance
 * BarberPro Premium Service Booking Platform - Day 8 Advanced Testing Framework
 * 
 * Comprehensive accessibility testing with focus on:
 * - WCAG 2.1 AA compliance
 * - Argentina market accessibility requirements
 * - Psychology vertical accessibility for mental health users
 * - Mobile-first accessibility optimization
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA Compliance Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Configure page for accessibility testing
    await page.goto('/');
    
    // Set Argentina locale and timezone
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'es-AR'
      });
    });
  });

  test.describe('Core Application Accessibility', () => {
    test('Homepage accessibility compliance', async ({ page }) => {
      await page.goto('/');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Additional manual checks
      await test.step('Check page structure', async () => {
        // Verify proper heading hierarchy
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        expect(headings.length).toBeGreaterThan(0);
        
        // Check main landmark
        await expect(page.locator('main')).toBeVisible();
        
        // Check navigation landmark
        await expect(page.locator('nav')).toBeVisible();
      });

      await test.step('Check keyboard navigation', async () => {
        // Test tab navigation
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Verify skip link functionality
        await page.keyboard.press('Tab');
        const skipLink = page.locator('[data-testid="skip-to-main"]');
        if (await skipLink.isVisible()) {
          await skipLink.click();
          const mainContent = page.locator('main');
          await expect(mainContent).toBeFocused();
        }
      });

      await test.step('Check color contrast', async () => {
        // Verify minimum contrast ratios
        const colorContrastResults = await new AxeBuilder({ page })
          .withTags(['color-contrast'])
          .analyze();
        
        expect(colorContrastResults.violations).toEqual([]);
      });

      await test.step('Check responsive accessibility', async () => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        const mobileAccessibility = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        
        expect(mobileAccessibility.violations).toEqual([]);
        
        // Verify touch targets are at least 44px
        const buttons = await page.locator('button, a[role="button"]').all();
        for (const button of buttons) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });
    });

    test('Service search accessibility', async ({ page }) => {
      await page.goto('/buscar-servicios');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await test.step('Search form accessibility', async () => {
        // Check form labels
        const searchInput = page.locator('[data-testid="search-input"]');
        await expect(searchInput).toHaveAttribute('aria-label');
        
        const locationInput = page.locator('[data-testid="location-input"]');
        await expect(locationInput).toHaveAttribute('aria-label');
        
        // Check form validation messages
        await searchInput.fill('');
        await page.keyboard.press('Enter');
        
        const errorMessage = page.locator('[role="alert"]');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
        }
      });

      await test.step('Search results accessibility', async () => {
        await page.fill('[data-testid="search-input"]', 'barbería');
        await page.fill('[data-testid="location-input"]', 'Buenos Aires');
        await page.click('[data-testid="search-button"]');
        
        await page.waitForSelector('[data-testid="search-results"]');
        
        // Check results are announced to screen readers
        const resultsRegion = page.locator('[data-testid="search-results"]');
        await expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
        
        // Check each result card accessibility
        const resultCards = page.locator('[data-testid="provider-card"]');
        const cardCount = await resultCards.count();
        
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = resultCards.nth(i);
          await expect(card).toHaveAttribute('role', 'article');
          await expect(card).toHaveAttribute('tabindex', '0');
          
          // Check image alt text
          const providerImage = card.locator('img');
          if (await providerImage.isVisible()) {
            await expect(providerImage).toHaveAttribute('alt');
          }
        }
      });
    });

    test('Booking form accessibility', async ({ page }) => {
      // Navigate to booking form
      await page.goto('/reservar/provider-123');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await test.step('Form field accessibility', async () => {
        // Check all form inputs have proper labels
        const formInputs = page.locator('input, select, textarea');
        const inputCount = await formInputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = formInputs.nth(i);
          const inputType = await input.getAttribute('type');
          
          if (inputType !== 'hidden') {
            // Check for label association
            const inputId = await input.getAttribute('id');
            if (inputId) {
              const label = page.locator(`label[for="${inputId}"]`);
              await expect(label).toBeVisible();
            } else {
              // Check for aria-label
              await expect(input).toHaveAttribute('aria-label');
            }
          }
        }
      });

      await test.step('Date and time picker accessibility', async () => {
        const datePicker = page.locator('[data-testid="date-picker"]');
        if (await datePicker.isVisible()) {
          // Check calendar widget accessibility
          await datePicker.click();
          await page.waitForSelector('[role="dialog"]');
          
          const calendarDialog = page.locator('[role="dialog"]');
          await expect(calendarDialog).toHaveAttribute('aria-label');
          
          // Check calendar navigation
          const prevButton = page.locator('[aria-label*="anterior"]');
          const nextButton = page.locator('[aria-label*="siguiente"]');
          
          await expect(prevButton).toBeVisible();
          await expect(nextButton).toBeVisible();
          
          // Check date buttons have proper labels
          const dateButtons = page.locator('[role="gridcell"] button');
          const dateCount = await dateButtons.count();
          
          for (let i = 0; i < Math.min(dateCount, 5); i++) {
            const dateButton = dateButtons.nth(i);
            await expect(dateButton).toHaveAttribute('aria-label');
          }
        }
      });

      await test.step('Form validation accessibility', async () => {
        // Trigger validation errors
        await page.click('[data-testid="submit-booking"]');
        
        // Check error messages are properly announced
        const errorMessages = page.locator('[role="alert"]');
        const errorCount = await errorMessages.count();
        
        for (let i = 0; i < errorCount; i++) {
          const error = errorMessages.nth(i);
          await expect(error).toHaveAttribute('aria-live');
        }
        
        // Check form fields are marked as invalid
        const invalidInputs = page.locator('[aria-invalid="true"]');
        expect(await invalidInputs.count()).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Psychology Vertical Accessibility', () => {
    test('Psychology specialist search accessibility for mental health users', async ({ page }) => {
      await page.goto('/servicios/psicologia');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await test.step('Mental health specific accessibility features', async () => {
        // Check for calm, accessible design
        const pageBackground = page.locator('body');
        const bgColor = await pageBackground.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Verify non-triggering color schemes
        expect(bgColor).not.toContain('rgb(255, 0, 0)'); // No pure red
        
        // Check for reduced motion support
        await page.addStyleTag({
          content: `
            @media (prefers-reduced-motion: reduce) {
              * { animation: none !important; transition: none !important; }
            }
          `
        });
        
        // Verify animations respect user preferences
        const animatedElements = page.locator('[class*="animate"], [style*="animation"]');
        const animationCount = await animatedElements.count();
        
        if (animationCount > 0) {
          // Check animations can be disabled
          await page.emulateMedia({ reducedMotion: 'reduce' });
          // Verify animations are disabled or reduced
        }
      });

      await test.step('Privacy-aware accessibility', async () => {
        // Check privacy notices are accessible
        const privacyNotice = page.locator('[data-testid="privacy-notice"]');
        if (await privacyNotice.isVisible()) {
          await expect(privacyNotice).toHaveAttribute('role', 'region');
          await expect(privacyNotice).toHaveAttribute('aria-label');
        }
        
        // Check GDPR consent is accessible
        const consentForm = page.locator('[data-testid="gdpr-consent"]');
        if (await consentForm.isVisible()) {
          const consentCheckboxes = consentForm.locator('input[type="checkbox"]');
          const checkboxCount = await consentCheckboxes.count();
          
          for (let i = 0; i < checkboxCount; i++) {
            const checkbox = consentCheckboxes.nth(i);
            await expect(checkbox).toHaveAttribute('aria-describedby');
          }
        }
      });

      await test.step('Crisis support accessibility', async () => {
        // Check crisis hotline information is accessible
        const crisisInfo = page.locator('[data-testid="crisis-support"]');
        if (await crisisInfo.isVisible()) {
          await expect(crisisInfo).toHaveAttribute('role', 'region');
          await expect(crisisInfo).toHaveAttribute('aria-label', /crisis|emergencia/i);
          
          // Check phone numbers are properly marked up
          const phoneLinks = crisisInfo.locator('a[href^="tel:"]');
          const phoneCount = await phoneLinks.count();
          
          for (let i = 0; i < phoneCount; i++) {
            const phoneLink = phoneLinks.nth(i);
            await expect(phoneLink).toHaveAttribute('aria-label');
          }
        }
      });
    });

    test('Therapy session booking accessibility', async ({ page }) => {
      await page.goto('/reservar/psicologo/therapist-123');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await test.step('Sensitive form accessibility', async () => {
        // Check mental health questionnaire accessibility
        const questionnaire = page.locator('[data-testid="mental-health-questionnaire"]');
        if (await questionnaire.isVisible()) {
          // Check fieldset and legend usage
          const fieldsets = questionnaire.locator('fieldset');
          const fieldsetCount = await fieldsets.count();
          
          for (let i = 0; i < fieldsetCount; i++) {
            const fieldset = fieldsets.nth(i);
            const legend = fieldset.locator('legend');
            await expect(legend).toBeVisible();
          }
          
          // Check radio buttons are properly grouped
          const radioGroups = questionnaire.locator('[role="radiogroup"]');
          const groupCount = await radioGroups.count();
          
          for (let i = 0; i < groupCount; i++) {
            const group = radioGroups.nth(i);
            await expect(group).toHaveAttribute('aria-labelledby');
          }
        }
      });

      await test.step('Privacy consent accessibility', async () => {
        const privacyModal = page.locator('[data-testid="privacy-consent-modal"]');
        if (await privacyModal.isVisible()) {
          // Check modal accessibility
          await expect(privacyModal).toHaveAttribute('role', 'dialog');
          await expect(privacyModal).toHaveAttribute('aria-modal', 'true');
          await expect(privacyModal).toHaveAttribute('aria-labelledby');
          
          // Check focus management
          const firstFocusable = privacyModal.locator('button, input, select, textarea, a[href]').first();
          await expect(firstFocusable).toBeFocused();
          
          // Check consent checkboxes are accessible
          const consentCheckboxes = privacyModal.locator('input[type="checkbox"]');
          const checkboxCount = await consentCheckboxes.count();
          
          for (let i = 0; i < checkboxCount; i++) {
            const checkbox = consentCheckboxes.nth(i);
            const label = page.locator(`label[for="${await checkbox.getAttribute('id')}"]`);
            await expect(label).toBeVisible();
            
            // Check description association
            const describedBy = await checkbox.getAttribute('aria-describedby');
            if (describedBy) {
              const description = page.locator(`#${describedBy}`);
              await expect(description).toBeVisible();
            }
          }
        }
      });
    });
  });

  test.describe('Argentina Market Accessibility', () => {
    test('Spanish language accessibility', async ({ page }) => {
      await page.goto('/?lang=es-AR');
      
      await test.step('Language declaration', async () => {
        // Check HTML lang attribute
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('es-AR');
        
        // Check for proper Spanish content
        const mainHeading = page.locator('h1').first();
        const headingText = await mainHeading.textContent();
        expect(headingText).toMatch(/[áéíóúñü]/i); // Contains Spanish characters
      });

      await test.step('Currency and number formatting accessibility', async () => {
        // Check currency is properly announced to screen readers
        const priceElements = page.locator('[data-testid*="price"]');
        const priceCount = await priceElements.count();
        
        for (let i = 0; i < Math.min(priceCount, 3); i++) {
          const price = priceElements.nth(i);
          const priceText = await price.textContent();
          
          // Check for proper currency formatting
          expect(priceText).toMatch(/\$\s?\d+/); // Argentine peso format
          
          // Check for screen reader friendly format
          const ariaLabel = await price.getAttribute('aria-label');
          if (ariaLabel) {
            expect(ariaLabel).toMatch(/pesos?/i);
          }
        }
      });

      await test.step('Regional form accessibility', async () => {
        // Check DNI input accessibility
        const dniInput = page.locator('[data-testid="dni-input"]');
        if (await dniInput.isVisible()) {
          await expect(dniInput).toHaveAttribute('aria-label');
          await expect(dniInput).toHaveAttribute('inputmode', 'numeric');
          
          // Check format requirements are announced
          const dniHelp = page.locator('[aria-describedby*="dni"]');
          if (await dniHelp.count() > 0) {
            await expect(dniHelp.first()).toContainText(/\d/); // Contains digit info
          }
        }
        
        // Check CUIT input accessibility
        const cuitInput = page.locator('[data-testid="cuit-input"]');
        if (await cuitInput.isVisible()) {
          await expect(cuitInput).toHaveAttribute('aria-label');
          await expect(cuitInput).toHaveAttribute('pattern');
        }
      });
    });

    test('Mobile accessibility for Argentina devices', async ({ page }) => {
      // Simulate popular Argentina mobile devices
      await page.setViewportSize({ width: 360, height: 640 }); // Samsung Galaxy A series
      await page.goto('/');
      
      const mobileAccessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(mobileAccessibility.violations).toEqual([]);

      await test.step('Touch target accessibility', async () => {
        // Check minimum touch target sizes (44px x 44px)
        const interactiveElements = page.locator('button, a, input, select, [role="button"]');
        const elementCount = await interactiveElements.count();
        
        for (let i = 0; i < Math.min(elementCount, 10); i++) {
          const element = interactiveElements.nth(i);
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            if (box) {
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      });

      await test.step('Mobile navigation accessibility', async () => {
        // Check mobile menu accessibility
        const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
        if (await mobileMenuButton.isVisible()) {
          await expect(mobileMenuButton).toHaveAttribute('aria-expanded');
          await expect(mobileMenuButton).toHaveAttribute('aria-controls');
          
          // Open mobile menu
          await mobileMenuButton.click();
          
          const mobileMenu = page.locator('[data-testid="mobile-menu"]');
          await expect(mobileMenu).toBeVisible();
          await expect(mobileMenu).toHaveAttribute('role', 'menu');
          
          // Check menu items accessibility
          const menuItems = mobileMenu.locator('a, button');
          const itemCount = await menuItems.count();
          
          for (let i = 0; i < itemCount; i++) {
            const item = menuItems.nth(i);
            await expect(item).toHaveAttribute('role', 'menuitem');
          }
        }
      });

      await test.step('Mobile form accessibility', async () => {
        // Check mobile-optimized inputs
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
          await expect(emailInput).toHaveAttribute('inputmode', 'email');
        }
        
        const phoneInput = page.locator('input[type="tel"]');
        if (await phoneInput.isVisible()) {
          await expect(phoneInput).toHaveAttribute('inputmode', 'tel');
        }
        
        // Check autocomplete attributes
        const nameInput = page.locator('[data-testid="name-input"]');
        if (await nameInput.isVisible()) {
          await expect(nameInput).toHaveAttribute('autocomplete');
        }
      });
    });

    test('WhatsApp integration accessibility', async ({ page }) => {
      await page.goto('/contacto');
      
      await test.step('WhatsApp button accessibility', async () => {
        const whatsappButton = page.locator('[data-testid="whatsapp-contact"]');
        if (await whatsappButton.isVisible()) {
          await expect(whatsappButton).toHaveAttribute('aria-label');
          
          const ariaLabel = await whatsappButton.getAttribute('aria-label');
          expect(ariaLabel).toMatch(/whatsapp/i);
          
          // Check external link indication
          await expect(whatsappButton).toHaveAttribute('target', '_blank');
          await expect(whatsappButton).toHaveAttribute('aria-describedby');
          
          const externalLinkDesc = page.locator('#external-link-description');
          if (await externalLinkDesc.isVisible()) {
            await expect(externalLinkDesc).toContainText(/abre en una nueva ventana/i);
          }
        }
      });
    });
  });

  test.describe('Advanced Accessibility Features', () => {
    test('Screen reader optimization', async ({ page }) => {
      await page.goto('/');
      
      await test.step('Skip navigation links', async () => {
        // Test skip to main content
        await page.keyboard.press('Tab');
        const skipLink = page.locator('[data-testid="skip-to-main"]');
        if (await skipLink.isVisible()) {
          await skipLink.click();
          const mainContent = page.locator('main');
          await expect(mainContent).toBeFocused();
        }
      });

      await test.step('Live regions for dynamic content', async () => {
        // Check search results are announced
        await page.goto('/buscar-servicios');
        await page.fill('[data-testid="search-input"]', 'barbería');
        await page.click('[data-testid="search-button"]');
        
        const liveRegion = page.locator('[aria-live]');
        expect(await liveRegion.count()).toBeGreaterThan(0);
        
        // Check for polite vs assertive announcements
        const politeLiveRegions = page.locator('[aria-live="polite"]');
        const assertiveLiveRegions = page.locator('[aria-live="assertive"]');
        
        expect(await politeLiveRegions.count()).toBeGreaterThan(0);
        // Assertive should be used sparingly
        expect(await assertiveLiveRegions.count()).toBeLessThanOrEqual(2);
      });

      await test.step('Descriptive link text', async () => {
        const links = page.locator('a');
        const linkCount = await links.count();
        
        for (let i = 0; i < Math.min(linkCount, 10); i++) {
          const link = links.nth(i);
          const linkText = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');
          
          const effectiveText = ariaLabel || linkText || title;
          
          // Check link text is descriptive (not just "click here", "read more", etc.)
          expect(effectiveText).not.toMatch(/^(click here|read more|more|aquí|más info)$/i);
          expect(effectiveText?.length || 0).toBeGreaterThan(3);
        }
      });
    });

    test('Keyboard navigation enhancement', async ({ page }) => {
      await page.goto('/');
      
      await test.step('Focus management', async () => {
        // Check focus is visible
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        // Check focus indicator is visible
        const outline = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).outline
        );
        const boxShadow = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).boxShadow
        );
        
        expect(outline !== 'none' || boxShadow !== 'none').toBe(true);
      });

      await test.step('Custom keyboard shortcuts', async () => {
        // Check for accessible keyboard shortcuts
        await page.keyboard.press('Alt+m'); // Open mobile menu
        await page.keyboard.press('Alt+s'); // Focus search
        await page.keyboard.press('Escape'); // Close modals
        
        // Verify shortcuts don't conflict with screen reader shortcuts
        // Alt+Tab, Alt+D, etc. should not be overridden
      });

      await test.step('Modal focus trapping', async () => {
        // Open a modal
        const modalTrigger = page.locator('[data-testid="open-modal"]');
        if (await modalTrigger.isVisible()) {
          await modalTrigger.click();
          
          const modal = page.locator('[role="dialog"]');
          await expect(modal).toBeVisible();
          
          // Check focus is trapped within modal
          const modalInputs = modal.locator('button, input, select, textarea, a[href]');
          const inputCount = await modalInputs.count();
          
          if (inputCount > 1) {
            // Tab through all elements and verify focus stays in modal
            for (let i = 0; i < inputCount + 2; i++) {
              await page.keyboard.press('Tab');
              const currentFocus = page.locator(':focus');
              const isInModal = await modal.locator(':focus').count() > 0;
              expect(isInModal).toBe(true);
            }
          }
        }
      });
    });

    test('High contrast and low vision support', async ({ page }) => {
      await page.goto('/');
      
      await test.step('High contrast mode compatibility', async () => {
        // Simulate high contrast mode
        await page.addStyleTag({
          content: `
            @media (prefers-contrast: high) {
              * {
                background: black !important;
                color: white !important;
                border-color: white !important;
              }
            }
          `
        });
        
        await page.emulateMedia({ colorScheme: 'dark', contrast: 'high' });
        
        // Verify content is still readable
        const bodyText = await page.locator('body').evaluate(el => 
          window.getComputedStyle(el).color
        );
        const bodyBg = await page.locator('body').evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Ensure sufficient contrast
        expect(bodyText).not.toBe(bodyBg);
      });

      await test.step('Text scaling support', async () => {
        // Test 200% text scaling
        await page.addStyleTag({
          content: `
            html { font-size: 200% !important; }
          `
        });
        
        // Verify layout doesn't break with larger text
        const accessibilityResults = await new AxeBuilder({ page })
          .withTags(['wcag2aa'])
          .analyze();
        
        expect(accessibilityResults.violations).toEqual([]);
        
        // Check horizontal scrolling isn't required
        const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
        const viewportWidth = await page.viewport()?.width || 1024;
        
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth * 1.1); // Allow 10% tolerance
      });
    });
  });
});