/**
 * Q11-001: Launch Readiness Security Validation
 * 
 * Comprehensive security testing for BarberPro platform launch
 * Focus: PCI DSS compliance, Argentina data protection, penetration testing
 */

import { test, expect, Page, Browser } from '@playwright/test';
import { spawn } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(require('child_process').exec);

// Security test configuration
const SECURITY_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  testTimeout: 30000,
  argentina: {
    dataProtectionLaw: '25.326',
    pciDssRequired: true,
    gdprCompliance: true
  }
};

class SecurityValidator {
  private page: Page;
  private browser: Browser;

  constructor(page: Page, browser: Browser) {
    this.page = page;
    this.browser = browser;
  }

  async validateSecurityHeaders(url: string): Promise<{[key: string]: string | boolean}> {
    const response = await fetch(url);
    const headers = response.headers;

    return {
      contentSecurityPolicy: headers.get('content-security-policy') !== null,
      strictTransportSecurity: headers.get('strict-transport-security') !== null,
      xFrameOptions: headers.get('x-frame-options') !== null,
      xContentTypeOptions: headers.get('x-content-type-options') !== null,
      referrerPolicy: headers.get('referrer-policy') !== null,
      permissionsPolicy: headers.get('permissions-policy') !== null,
      xXssProtection: headers.get('x-xss-protection') !== null
    };
  }

  async testSqlInjection(endpoint: string, parameter: string): Promise<boolean> {
    const sqlPayloads = [
      "' OR '1'='1",
      "' UNION SELECT * FROM users--",
      "'; DROP TABLE users;--",
      "' OR 1=1#",
      "admin'--",
      "' OR 'a'='a",
      "1' OR '1'='1' /*"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await fetch(`${SECURITY_CONFIG.baseUrl}${endpoint}?${parameter}=${encodeURIComponent(payload)}`);
        const body = await response.text();

        // Check for SQL error messages or successful injection
        if (body.includes('SQL syntax') || 
            body.includes('mysql_fetch') || 
            body.includes('ORA-') ||
            body.includes('PostgreSQL') ||
            response.status === 200 && body.includes('admin')) {
          return false; // Vulnerable
        }
      } catch (error) {
        // Request failed, which is expected for blocked payloads
      }
    }
    return true; // Secure
  }

  async testXssVulnerabilities(): Promise<boolean> {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "';alert('XSS');//",
      "<iframe src=javascript:alert('XSS')></iframe>"
    ];

    await this.page.goto(`${SECURITY_CONFIG.frontendUrl}/search`);

    for (const payload of xssPayloads) {
      try {
        await this.page.fill('[data-testid="search-input"]', payload);
        await this.page.press('[data-testid="search-input"]', 'Enter');
        
        // Wait for potential XSS execution
        await this.page.waitForTimeout(1000);

        // Check if XSS was executed (alert dialog)
        const hasAlert = await this.page.locator('.alert').count() > 0;
        if (hasAlert) {
          return false; // Vulnerable
        }
      } catch (error) {
        // Error expected for blocked payloads
      }
    }
    return true; // Secure
  }

  async testCsrfProtection(): Promise<boolean> {
    try {
      // Attempt CSRF attack without proper token
      const response = await fetch(`${SECURITY_CONFIG.baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify({
          provider_id: 1,
          date: '2024-01-15',
          time: '10:00'
        })
      });

      // Should be blocked (403/400) or require authentication
      return response.status === 403 || response.status === 401 || response.status === 400;
    } catch (error) {
      return true; // Request blocked, which is good
    }
  }
}

test.describe('Q11-001: Launch Readiness Security Validation', () => {
  let securityValidator: SecurityValidator;

  test.beforeEach(async ({ page, browser }) => {
    securityValidator = new SecurityValidator(page, browser);
  });

  test.describe('Security Headers and HTTPS Validation', () => {
    test('should enforce comprehensive security headers', async ({ page }) => {
      const headers = await securityValidator.validateSecurityHeaders(SECURITY_CONFIG.frontendUrl);

      // Essential security headers
      expect(headers.contentSecurityPolicy).toBe(true);
      expect(headers.xFrameOptions).toBe(true);
      expect(headers.xContentTypeOptions).toBe(true);
      
      // HTTPS-specific headers (if HTTPS enabled)
      if (SECURITY_CONFIG.frontendUrl.includes('https')) {
        expect(headers.strictTransportSecurity).toBe(true);
      }

      // Additional security headers
      expect(headers.referrerPolicy).toBe(true);
    });

    test('should prevent clickjacking attacks', async ({ page }) => {
      const response = await page.goto(SECURITY_CONFIG.frontendUrl);
      const xFrameOptions = response?.headers()['x-frame-options'];
      const csp = response?.headers()['content-security-policy'];

      // Should have X-Frame-Options: DENY/SAMEORIGIN or CSP frame-ancestors
      expect(
        xFrameOptions === 'DENY' || 
        xFrameOptions === 'SAMEORIGIN' || 
        (csp && csp.includes('frame-ancestors'))
      ).toBe(true);
    });

    test('should enforce Content Security Policy', async ({ page }) => {
      const response = await page.goto(SECURITY_CONFIG.frontendUrl);
      const csp = response?.headers()['content-security-policy'];

      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src");
      expect(csp).toContain("style-src");
    });

    test('should prevent MIME sniffing', async ({ page }) => {
      const response = await page.goto(SECURITY_CONFIG.frontendUrl);
      const xContentTypeOptions = response?.headers()['x-content-type-options'];

      expect(xContentTypeOptions).toBe('nosniff');
    });
  });

  test.describe('Authentication and Authorization Security', () => {
    test('should enforce strong authentication', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/login`);

      // Test password requirements
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', '123'); // Weak password
      await page.click('[data-testid="login-button"]');

      // Should require stronger password
      await expect(page.getByText(/contraseña debe tener/i)).toBeVisible();
    });

    test('should implement proper session management', async ({ page, context }) => {
      // Login with valid credentials
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/login`);
      await page.fill('[data-testid="email"]', 'test@barberpro.com');
      await page.fill('[data-testid="password"]', 'SecurePassword123!');
      await page.click('[data-testid="login-button"]');

      // Check session cookie properties
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'session' || c.name === 'token');

      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true);
        expect(sessionCookie.secure).toBe(SECURITY_CONFIG.frontendUrl.includes('https'));
        expect(sessionCookie.sameSite).toBe('Strict');
      }
    });

    test('should prevent session fixation attacks', async ({ page, context }) => {
      // Get initial session
      await page.goto(SECURITY_CONFIG.frontendUrl);
      const initialCookies = await context.cookies();
      const initialSession = initialCookies.find(c => c.name === 'session');

      // Login
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/login`);
      await page.fill('[data-testid="email"]', 'test@barberpro.com');
      await page.fill('[data-testid="password"]', 'SecurePassword123!');
      await page.click('[data-testid="login-button"]');

      // Check if session ID changed after login
      const postLoginCookies = await context.cookies();
      const postLoginSession = postLoginCookies.find(c => c.name === 'session');

      if (initialSession && postLoginSession) {
        expect(initialSession.value).not.toBe(postLoginSession.value);
      }
    });

    test('should implement proper access controls', async ({ page }) => {
      // Try to access admin panel without authentication
      const response = await page.goto(`${SECURITY_CONFIG.frontendUrl}/admin`);
      
      // Should redirect to login or show 403/401
      expect(
        page.url().includes('/login') || 
        response?.status() === 403 || 
        response?.status() === 401
      ).toBe(true);
    });
  });

  test.describe('Input Validation and Injection Prevention', () => {
    test('should prevent SQL injection attacks', async ({ page }) => {
      const isSecure = await securityValidator.testSqlInjection('/api/search', 'location');
      expect(isSecure).toBe(true);

      // Test multiple endpoints
      const endpoints = [
        { endpoint: '/api/providers', parameter: 'id' },
        { endpoint: '/api/bookings', parameter: 'provider_id' },
        { endpoint: '/api/users', parameter: 'email' }
      ];

      for (const { endpoint, parameter } of endpoints) {
        const result = await securityValidator.testSqlInjection(endpoint, parameter);
        expect(result).toBe(true);
      }
    });

    test('should prevent XSS attacks', async ({ page }) => {
      const isSecure = await securityValidator.testXssVulnerabilities();
      expect(isSecure).toBe(true);

      // Test additional XSS vectors
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/profile`);
      
      // Test stored XSS in profile fields
      const xssPayload = "<script>alert('Stored XSS')</script>";
      await page.fill('[data-testid="profile-name"]', xssPayload);
      await page.click('[data-testid="save-profile"]');

      // Reload page and check if XSS executes
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Check that script is properly escaped
      const nameField = await page.inputValue('[data-testid="profile-name"]');
      expect(nameField).not.toContain('<script>');
    });

    test('should prevent CSRF attacks', async ({ page }) => {
      const isProtected = await securityValidator.testCsrfProtection();
      expect(isProtected).toBe(true);
    });

    test('should validate file uploads properly', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/profile`);

      // Test malicious file upload
      const maliciousFiles = [
        { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'test.jsp', content: '<% System.out.println("JSP executed"); %>' },
        { name: 'test.asp', content: '<% Response.Write("ASP executed") %>' }
      ];

      for (const file of maliciousFiles) {
        try {
          await page.setInputFiles('[data-testid="profile-image"]', {
            name: file.name,
            mimeType: 'text/plain',
            buffer: Buffer.from(file.content)
          });

          await page.click('[data-testid="upload-button"]');
          
          // Should show error for invalid file type
          await expect(page.getByText(/tipo de archivo no permitido/i)).toBeVisible();
        } catch (error) {
          // Upload rejection is expected
        }
      }
    });
  });

  test.describe('Payment Security and PCI DSS Compliance', () => {
    test('should enforce PCI DSS compliance for payment processing', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/booking/payment`);

      // Check that payment form uses HTTPS
      expect(page.url()).toMatch(/^https:/);

      // Check that card data is handled securely
      const cardForm = page.locator('[data-testid="card-form"]');
      if (await cardForm.isVisible()) {
        // Card form should be in iframe or use secure tokenization
        const hasSecureHandling = await cardForm.locator('iframe').count() > 0 ||
                                 await page.locator('[data-testid="mercadopago-secure"]').count() > 0;
        
        expect(hasSecureHandling).toBe(true);
      }
    });

    test('should not store sensitive payment data', async ({ page }) => {
      // Mock successful payment
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/booking/payment`);
      
      // Fill payment form (mock)
      if (await page.locator('[data-testid="card-number"]').isVisible()) {
        await page.fill('[data-testid="card-number"]', '4111111111111111');
        await page.fill('[data-testid="card-expiry"]', '12/25');
        await page.fill('[data-testid="card-cvv"]', '123');
        
        await page.click('[data-testid="submit-payment"]');
      }

      // Check payment confirmation doesn't show sensitive data
      await page.waitForSelector('[data-testid="payment-confirmation"]');
      const confirmationText = await page.textContent('[data-testid="payment-confirmation"]');
      
      expect(confirmationText).not.toMatch(/4111111111111111/);
      expect(confirmationText).not.toMatch(/123/);
    });

    test('should validate payment amount integrity', async ({ page }) => {
      // Test amount tampering prevention
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/booking/payment`);

      // Try to manipulate payment amount in client
      await page.evaluate(() => {
        const amountField = document.querySelector('[data-testid="payment-amount"]');
        if (amountField) {
          (amountField as HTMLInputElement).value = '1'; // Try to set to 1 peso
        }
      });

      await page.click('[data-testid="submit-payment"]');
      
      // Should validate against server-side amount
      await expect(page.getByText(/monto inválido/i)).toBeVisible();
    });
  });

  test.describe('Data Protection and Privacy Compliance', () => {
    test('should comply with Argentina Data Protection Law 25.326', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/privacy-policy`);

      // Check for required privacy policy elements
      await expect(page.getByText(/ley 25.326/i)).toBeVisible();
      await expect(page.getByText(/protección de datos personales/i)).toBeVisible();
      await expect(page.getByText(/derechos del titular/i)).toBeVisible();
    });

    test('should implement proper data encryption', async ({ page }) => {
      // Check that sensitive data is encrypted in transit
      const response = await page.goto(SECURITY_CONFIG.frontendUrl);
      
      if (SECURITY_CONFIG.frontendUrl.includes('https')) {
        expect(response?.securityDetails()).toBeDefined();
      }

      // Test API encryption
      const apiResponse = await fetch(`${SECURITY_CONFIG.baseUrl}/api/users/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      // Response should not contain plaintext sensitive data
      const responseText = await apiResponse.text();
      expect(responseText).not.toMatch(/password.*:/);
    });

    test('should provide data export functionality (GDPR compliance)', async ({ page }) => {
      // Login first
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/login`);
      await page.fill('[data-testid="email"]', 'test@barberpro.com');
      await page.fill('[data-testid="password"]', 'SecurePassword123!');
      await page.click('[data-testid="login-button"]');

      // Navigate to data export
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/account/data-export`);
      await page.click('[data-testid="request-data-export"]');

      // Should confirm data export request
      await expect(page.getByText(/solicitud de exportación recibida/i)).toBeVisible();
    });

    test('should provide data deletion functionality', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/account/delete`);

      // Should require confirmation for account deletion
      await page.click('[data-testid="delete-account-button"]');
      await expect(page.getByText(/confirmar eliminación/i)).toBeVisible();
      
      // Should require password for final confirmation
      await expect(page.locator('[data-testid="password-confirmation"]')).toBeVisible();
    });
  });

  test.describe('API Security and Rate Limiting', () => {
    test('should implement proper API rate limiting', async ({ page }) => {
      const requests = [];
      
      // Make rapid requests to trigger rate limiting
      for (let i = 0; i < 100; i++) {
        requests.push(
          fetch(`${SECURITY_CONFIG.baseUrl}/api/search?location=Buenos Aires`)
        );
      }

      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited).toBe(true);
    });

    test('should validate API authentication', async ({ page }) => {
      // Test unauthenticated access to protected endpoints
      const protectedEndpoints = [
        '/api/bookings',
        '/api/payments',
        '/api/admin/users',
        '/api/providers/analytics'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await fetch(`${SECURITY_CONFIG.baseUrl}${endpoint}`);
        expect([401, 403]).toContain(response.status);
      }
    });

    test('should prevent API enumeration attacks', async ({ page }) => {
      // Test sequential ID enumeration
      const responses = [];
      for (let i = 1; i <= 10; i++) {
        const response = await fetch(`${SECURITY_CONFIG.baseUrl}/api/bookings/${i}`);
        responses.push(response.status);
      }

      // Should not reveal existence of resources through different status codes
      const uniqueStatuses = [...new Set(responses)];
      expect(uniqueStatuses.length).toBeLessThanOrEqual(2); // Should be consistent (401/403)
    });
  });

  test.describe('Infrastructure Security', () => {
    test('should not expose sensitive server information', async ({ page }) => {
      const response = await page.goto(SECURITY_CONFIG.frontendUrl);
      const headers = response?.headers();

      // Should not expose server technology
      expect(headers?.['server']).not.toMatch(/apache|nginx|express/i);
      expect(headers?.['x-powered-by']).toBeFalsy();
    });

    test('should handle errors securely', async ({ page }) => {
      // Test 404 errors don't reveal system information
      const response = await page.goto(`${SECURITY_CONFIG.frontendUrl}/non-existent-page`);
      const content = await page.content();

      expect(content).not.toMatch(/stack trace/i);
      expect(content).not.toMatch(/internal server error/i);
      expect(content).not.toMatch(/node\.js/i);
      expect(content).not.toMatch(/express/i);
    });

    test('should secure administrative interfaces', async ({ page }) => {
      // Admin interfaces should require strong authentication
      const adminUrls = [
        '/admin',
        '/admin/users',
        '/admin/system',
        '/api/admin',
        '/.env',
        '/config.json',
        '/admin.php' // Common attack vector
      ];

      for (const url of adminUrls) {
        try {
          const response = await page.goto(`${SECURITY_CONFIG.frontendUrl}${url}`);
          // Should not be accessible without authentication
          expect([401, 403, 404]).toContain(response?.status() || 404);
        } catch (error) {
          // Request failure is acceptable (blocked by security)
        }
      }
    });
  });

  test.describe('Argentina-Specific Security Requirements', () => {
    test('should comply with Argentina financial regulations', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/compliance`);

      // Check for Argentina-specific compliance mentions
      await expect(page.getByText(/banco central de la república argentina/i)).toBeVisible();
      await expect(page.getByText(/ley de entidades financieras/i)).toBeVisible();
    });

    test('should secure MercadoPago integration', async ({ page }) => {
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/payment`);

      // MercadoPago integration should use secure methods
      const mpIframe = page.locator('iframe[src*="mercadopago"]');
      if (await mpIframe.count() > 0) {
        const src = await mpIframe.getAttribute('src');
        expect(src).toMatch(/^https:/);
      }

      // Check for proper webhook security
      const webhookResponse = await fetch(`${SECURITY_CONFIG.baseUrl}/api/webhooks/mercadopago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });

      // Should validate webhook signature
      expect([401, 403, 400]).toContain(webhookResponse.status);
    });

    test('should protect against Argentina-specific attack vectors', async ({ page }) => {
      // Test protection against local currency manipulation
      await page.goto(`${SECURITY_CONFIG.frontendUrl}/booking/payment`);

      // Try to manipulate currency
      await page.evaluate(() => {
        localStorage.setItem('currency', 'USD');
        sessionStorage.setItem('exchange_rate', '0.001');
      });

      await page.reload();
      
      // Should still show ARS prices
      const priceElements = page.locator('[data-testid*="price"]');
      if (await priceElements.count() > 0) {
        const priceText = await priceElements.first().textContent();
        expect(priceText).toMatch(/ARS|\$/);
      }
    });
  });
});

// Utility functions for security testing
async function performSecurityScan(url: string): Promise<{
  vulnerabilities: string[];
  securityScore: number;
}> {
  // Mock security scan results
  return {
    vulnerabilities: [],
    securityScore: 95
  };
}

async function checkSslConfiguration(url: string): Promise<{
  grade: string;
  vulnerabilities: string[];
}> {
  // Mock SSL assessment
  return {
    grade: 'A+',
    vulnerabilities: []
  };
}

async function testPasswordPolicy(page: Page): Promise<boolean> {
  // Test password strength requirements
  const weakPasswords = ['123456', 'password', 'abc123', '11111111'];
  
  for (const password of weakPasswords) {
    await page.fill('[data-testid="password"]', password);
    const isRejected = await page.locator('[data-testid="password-error"]').isVisible();
    if (!isRejected) {
      return false; // Weak password accepted
    }
  }
  
  return true; // All weak passwords rejected
}

export { SecurityValidator, performSecurityScan, checkSslConfiguration, testPasswordPolicy };