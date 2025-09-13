/**
 * End-to-End Tests for Psychology Booking Flow - Day 8 Advanced Testing Framework
 * BarberPro Premium Service Booking Platform - Argentina Market
 * 
 * Tests complete psychology vertical user journeys with privacy compliance
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe('Psychology Vertical - Complete Booking Flow', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Create browser context with Argentina settings
    context = await browser.newContext({
      locale: 'es-AR',
      timezoneId: 'America/Argentina/Buenos_Aires',
      geolocation: { latitude: -34.6037, longitude: -58.3816 }, // Buenos Aires
      permissions: ['geolocation']
    });
    
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Complete psychology therapy booking with GDPR compliance', async () => {
    // 1. Navigate to psychology services
    await page.goto('/servicios/psicologia');
    await expect(page.locator('h1')).toContainText('Servicios de Psicología');

    // 2. Search for psychology specialists in Buenos Aires
    await page.fill('[data-testid="search-location"]', 'Buenos Aires');
    await page.selectOption('[data-testid="service-category"]', 'psicologia');
    await page.selectOption('[data-testid="specialization"]', 'terapia-cognitivo-conductual');
    await page.click('[data-testid="search-button"]');

    // Wait for search results
    await page.waitForSelector('[data-testid="specialist-card"]');
    await expect(page.locator('[data-testid="specialist-card"]').first()).toBeVisible();

    // Verify psychology specialists have required credentials
    const firstSpecialist = page.locator('[data-testid="specialist-card"]').first();
    await expect(firstSpecialist.locator('[data-testid="license-badge"]')).toContainText('Matrícula Profesional');
    await expect(firstSpecialist.locator('[data-testid="specialization-badge"]')).toContainText('TCC');

    // 3. Select a psychology specialist
    await firstSpecialist.click();
    await page.waitForURL(/\/especialistas\/psicologia\/\w+/);

    // Verify specialist profile shows psychology-specific information
    await expect(page.locator('[data-testid="specialist-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="psychology-license"]')).toBeVisible();
    await expect(page.locator('[data-testid="specializations"]')).toContainText('Terapia Cognitivo-Conductual');
    await expect(page.locator('[data-testid="privacy-notice"]')).toContainText('Confidencialidad garantizada');

    // 4. Select therapy type and schedule appointment
    await page.click('[data-testid="book-appointment"]');
    await page.waitForSelector('[data-testid="therapy-type-selection"]');

    // Select individual therapy
    await page.click('[data-testid="individual-therapy"]');
    await expect(page.locator('[data-testid="therapy-duration"]')).toContainText('50 minutos');
    await expect(page.locator('[data-testid="therapy-price"]')).toContainText('$8,000');

    // 5. GDPR Privacy Consent - Critical for psychology services
    await page.waitForSelector('[data-testid="privacy-consent-modal"]');
    await expect(page.locator('[data-testid="gdpr-notice"]')).toContainText('Artículo 9 del RGPD');
    await expect(page.locator('[data-testid="mental-health-data-notice"]')).toContainText('datos de salud mental');

    // Review privacy policy
    await page.click('[data-testid="privacy-policy-link"]');
    await expect(page.locator('[data-testid="privacy-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-processing-purpose"]')).toContainText('tratamiento terapéutico');
    await page.click('[data-testid="close-privacy-modal"]');

    // Provide explicit consent for psychology services
    await page.check('[data-testid="gdpr-consent-checkbox"]');
    await page.check('[data-testid="mental-health-consent-checkbox"]');
    await page.check('[data-testid="therapy-recording-consent-checkbox"]');
    await page.click('[data-testid="confirm-privacy-consent"]');

    // 6. Select appointment date and time
    await page.waitForSelector('[data-testid="calendar-widget"]');
    
    // Select next available appointment (within 7 days)
    const availableSlot = page.locator('[data-testid="available-slot"]').first();
    await availableSlot.click();
    
    // Verify appointment details
    await expect(page.locator('[data-testid="selected-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="selected-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-duration"]')).toContainText('50 min');

    // 7. Fill in therapy-specific intake information
    await page.fill('[data-testid="primary-concern"]', 'Manejo de ansiedad y estrés laboral');
    await page.selectOption('[data-testid="therapy-history"]', 'primera-vez');
    await page.selectOption('[data-testid="preferred-approach"]', 'cognitivo-conductual');
    
    // Mental health questionnaire (PHQ-9 simplified)
    await page.selectOption('[data-testid="mood-frequency"]', 'algunas-veces');
    await page.selectOption('[data-testid="sleep-quality"]', 'regular');
    await page.selectOption('[data-testid="stress-level"]', 'moderado');

    // Emergency contact (required for mental health services)
    await page.fill('[data-testid="emergency-contact-name"]', 'María Pérez');
    await page.fill('[data-testid="emergency-contact-phone"]', '+5491234567890');
    await page.selectOption('[data-testid="emergency-contact-relationship"]', 'familiar');

    // 8. Review booking details
    await page.click('[data-testid="continue-to-review"]');
    await page.waitForSelector('[data-testid="booking-review"]');

    // Verify booking summary
    await expect(page.locator('[data-testid="service-type"]')).toContainText('Terapia Individual');
    await expect(page.locator('[data-testid="specialization"]')).toContainText('Cognitivo-Conductual');
    await expect(page.locator('[data-testid="session-duration"]')).toContainText('50 minutos');
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('$8,000');
    await expect(page.locator('[data-testid="privacy-level"]')).toContainText('Máxima confidencialidad');

    // Tax information (psychology services may be tax exempt)
    await expect(page.locator('[data-testid="tax-status"]')).toContainText('Exento de IVA');
    await expect(page.locator('[data-testid="tax-reason"]')).toContainText('Servicios de salud mental');

    // 9. Payment processing with Argentina methods
    await page.click('[data-testid="proceed-to-payment"]');
    await page.waitForSelector('[data-testid="payment-methods"]');

    // Select MercadoPago payment
    await page.click('[data-testid="mercadopago-option"]');
    await page.waitForSelector('[data-testid="mercadopago-form"]');

    // Fill payment information
    await page.fill('[data-testid="cardholder-name"]', 'Juan Carlos Pérez');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="expiry-month"]', '12');
    await page.fill('[data-testid="expiry-year"]', '2027');
    await page.fill('[data-testid="cvv"]', '123');

    // Argentina-specific information
    await page.fill('[data-testid="dni"]', '12345678');
    await page.selectOption('[data-testid="installments"]', '1');

    // Process payment
    await page.click('[data-testid="process-payment"]');
    
    // Wait for payment processing
    await page.waitForSelector('[data-testid="payment-processing"]');
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('Procesando pago');

    // 10. Payment confirmation and booking confirmation
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('Pago exitoso');

    // Booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-number"]')).toMatch(/^PSY-\d{8}$/);
    await expect(page.locator('[data-testid="therapist-contact"]')).toBeVisible();

    // 11. Therapy-specific post-booking information
    await expect(page.locator('[data-testid="pre-session-instructions"]')).toContainText('Instrucciones previas');
    await expect(page.locator('[data-testid="confidentiality-reminder"]')).toContainText('confidencialidad');
    await expect(page.locator('[data-testid="cancellation-policy"]')).toContainText('24 horas de anticipación');

    // Download appointment details
    await page.click('[data-testid="download-appointment"]');
    
    // Calendar integration
    await page.click('[data-testid="add-to-calendar"]');
    await expect(page.locator('[data-testid="calendar-options"]')).toBeVisible();

    // 12. WhatsApp notification confirmation (Argentina-specific)
    await expect(page.locator('[data-testid="whatsapp-notification"]')).toContainText('WhatsApp');
    await page.click('[data-testid="enable-whatsapp-notifications"]');
    
    // 13. Initial session preparation
    await page.click('[data-testid="session-preparation"]');
    await expect(page.locator('[data-testid="intake-form"]')).toBeVisible();
    
    // Complete initial assessment form
    await page.fill('[data-testid="therapy-goals"]', 'Reducir niveles de ansiedad y mejorar el manejo del estrés');
    await page.selectOption('[data-testid="session-preference"]', 'presencial');
    await page.check('[data-testid="session-recording-consent"]');

    await page.click('[data-testid="submit-intake-form"]');
    await expect(page.locator('[data-testid="intake-submitted"]')).toContainText('Formulario enviado');

    // 14. Verify booking appears in user dashboard
    await page.goto('/mi-cuenta/citas');
    await expect(page.locator('[data-testid="upcoming-appointments"]')).toBeVisible();
    
    const therapyAppointment = page.locator('[data-testid="appointment-card"]').first();
    await expect(therapyAppointment.locator('[data-testid="service-type"]')).toContainText('Terapia Individual');
    await expect(therapyAppointment.locator('[data-testid="privacy-indicator"]')).toContainText('Confidencial');
    
    // Verify modification options
    await expect(therapyAppointment.locator('[data-testid="modify-appointment"]')).toBeVisible();
    await expect(therapyAppointment.locator('[data-testid="cancel-appointment"]')).toBeVisible();
  });

  test('Psychology specialist onboarding with license verification', async () => {
    // Navigate to specialist registration
    await page.goto('/registro/psicologo');
    await expect(page.locator('h1')).toContainText('Registro de Psicólogo');

    // Personal information
    await page.fill('[data-testid="first-name"]', 'Dr. María');
    await page.fill('[data-testid="last-name"]', 'González');
    await page.fill('[data-testid="email"]', 'maria.gonzalez@test.com');
    await page.fill('[data-testid="phone"]', '+5491123456789');
    await page.fill('[data-testid="dni"]', '23456789');

    // Professional information
    await page.fill('[data-testid="professional-license"]', 'MP-12345-AR');
    await page.fill('[data-testid="university"]', 'Universidad de Buenos Aires');
    await page.fill('[data-testid="graduation-year"]', '2015');

    // Upload license documents
    await page.setInputFiles('[data-testid="license-document"]', 'test-files/psychology-license.pdf');
    await page.setInputFiles('[data-testid="university-diploma"]', 'test-files/psychology-diploma.pdf');
    await page.setInputFiles('[data-testid="continuing-education"]', 'test-files/ce-certificates.pdf');

    // Specializations
    await page.check('[data-testid="specialization-cognitive-behavioral"]');
    await page.check('[data-testid="specialization-anxiety-disorders"]');
    await page.check('[data-testid="specialization-depression"]');

    // Practice information
    await page.fill('[data-testid="office-address"]', 'Av. Corrientes 1234, Buenos Aires');
    await page.check('[data-testid="in-person-sessions"]');
    await page.check('[data-testid="online-sessions"]');
    await page.fill('[data-testid="session-rate"]', '8000');

    // Professional ethics agreement
    await page.check('[data-testid="ethics-code-agreement"]');
    await page.check('[data-testid="confidentiality-agreement"]');
    await page.check('[data-testid="gdpr-compliance-agreement"]');

    // Submit registration
    await page.click('[data-testid="submit-registration"]');
    
    // Verification process
    await page.waitForSelector('[data-testid="verification-pending"]');
    await expect(page.locator('[data-testid="verification-status"]')).toContainText('En proceso de verificación');
    await expect(page.locator('[data-testid="verification-timeline"]')).toContainText('24-48 horas');
  });

  test('Psychology session management and privacy controls', async () => {
    // Login as registered therapist
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'therapist@test.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to session management
    await page.goto('/terapeutas/sesiones');
    await expect(page.locator('h1')).toContainText('Gestión de Sesiones');

    // View upcoming session
    const upcomingSession = page.locator('[data-testid="session-card"]').first();
    await upcomingSession.click();

    // Session details with privacy controls
    await expect(page.locator('[data-testid="client-initials"]')).toBeVisible(); // Only initials shown
    await expect(page.locator('[data-testid="session-type"]')).toContainText('Individual');
    await expect(page.locator('[data-testid="privacy-level"]')).toContainText('Alta');

    // Access client information (with proper authentication)
    await page.click('[data-testid="view-client-details"]');
    await page.fill('[data-testid="therapist-password-confirmation"]', 'SecurePassword123!');
    await page.click('[data-testid="confirm-access"]');

    // Session notes with encryption
    await page.click('[data-testid="session-notes"]');
    await page.fill('[data-testid="private-notes"]', 'Cliente muestra progreso en técnicas de respiración.');
    await page.selectOption('[data-testid="session-outcome"]', 'progreso-positivo');

    // Save encrypted notes
    await page.click('[data-testid="save-encrypted-notes"]');
    await expect(page.locator('[data-testid="notes-saved"]')).toContainText('Notas guardadas de forma segura');

    // Treatment plan update
    await page.click('[data-testid="update-treatment-plan"]');
    await page.fill('[data-testid="treatment-goals"]', 'Continuar con ejercicios de mindfulness');
    await page.fill('[data-testid="next-session-focus"]', 'Técnicas de afrontamiento del estrés');

    // Schedule next session
    await page.click('[data-testid="schedule-next-session"]');
    await page.click('[data-testid="calendar-next-week"]');
    await page.click('[data-testid="time-slot-14-00"]');
    
    await page.click('[data-testid="confirm-next-session"]');
    await expect(page.locator('[data-testid="session-scheduled"]')).toContainText('Sesión programada');
  });

  test('Mental health crisis protocol and emergency procedures', async () => {
    // Simulate crisis situation during session
    await page.goto('/terapeutas/sesion-activa/session-123');
    
    // Trigger crisis protocol
    await page.click('[data-testid="crisis-protocol"]');
    await page.waitForSelector('[data-testid="crisis-assessment"]');

    // Crisis assessment
    await page.selectOption('[data-testid="crisis-level"]', 'alto-riesgo');
    await page.check('[data-testid="suicidal-ideation"]');
    await page.fill('[data-testid="crisis-notes"]', 'Cliente expresa ideas suicidas');

    // Emergency contact activation
    await page.click('[data-testid="activate-emergency-protocol"]');
    await expect(page.locator('[data-testid="emergency-contacts-called"]')).toContainText('Contactos de emergencia notificados');

    // Professional support notification
    await expect(page.locator('[data-testid="supervisor-notified"]')).toContainText('Supervisor clínico notificado');
    await expect(page.locator('[data-testid="crisis-team-alerted"]')).toContainText('Equipo de crisis activado');

    // Documentation for crisis intervention
    await page.click('[data-testid="crisis-documentation"]');
    await page.fill('[data-testid="intervention-summary"]', 'Protocolo de crisis activado, contactos notificados');
    await page.check('[data-testid="follow-up-required"]');

    await page.click('[data-testid="save-crisis-report"]');
    await expect(page.locator('[data-testid="crisis-report-saved"]')).toContainText('Reporte de crisis guardado');
  });

  test('GDPR data subject rights for therapy clients', async () => {
    // Login as client
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'client@test.com');
    await page.fill('[data-testid="password"]', 'ClientPassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to privacy controls
    await page.goto('/mi-cuenta/privacidad');
    await expect(page.locator('h1')).toContainText('Privacidad y Datos');

    // Right to access
    await page.click('[data-testid="request-data-access"]');
    await page.fill('[data-testid="access-reason"]', 'Revisión de historial terapéutico');
    await page.click('[data-testid="submit-access-request"]');
    
    await expect(page.locator('[data-testid="access-request-submitted"]')).toContainText('Solicitud enviada');
    await expect(page.locator('[data-testid="access-timeline"]')).toContainText('30 días');

    // Right to rectification
    await page.click('[data-testid="request-data-correction"]');
    await page.fill('[data-testid="correction-details"]', 'Actualizar dirección de contacto');
    await page.click('[data-testid="submit-correction-request"]');

    // Right to erasure (with therapy-specific limitations)
    await page.click('[data-testid="request-data-deletion"]');
    await expect(page.locator('[data-testid="deletion-limitations"]')).toContainText('Las notas terapéuticas tienen períodos de retención específicos');
    
    await page.check('[data-testid="understand-limitations"]');
    await page.fill('[data-testid="deletion-reason"]', 'Ya no requiero servicios terapéuticos');
    await page.click('[data-testid="submit-deletion-request"]');

    // Right to data portability
    await page.click('[data-testid="export-data"]');
    await page.selectOption('[data-testid="export-format"]', 'pdf-anonymized');
    await page.check('[data-testid="exclude-sensitive-notes"]');
    
    await page.click('[data-testid="generate-export"]');
    await expect(page.locator('[data-testid="export-processing"]')).toContainText('Generando exportación');
  });
});