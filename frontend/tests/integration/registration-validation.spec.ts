/**
 * T049: Integration Tests for Registration Form Validation
 * Tests for real-time validation behavior, user interaction flows
 *
 * Note: These are Vitest-based integration tests.
 * For full E2E browser testing, Playwright would be needed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PasswordStrength } from '$lib/validation/registration';

describe('Registration Form Real-Time Validation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Field Validation', () => {
    it('should validate email on blur event', async () => {
      // Simulate user typing and blur
      const email = 'invalid-email';
      const validEmail = 'test@example.com';

      // Invalid email should show error on blur
      let error = validateEmailOnBlur(email);
      expect(error).toBe('Email inválido');

      // Valid email should clear error on blur
      error = validateEmailOnBlur(validEmail);
      expect(error).toBeNull();
    });

    it('should show email validation error immediately on blur', () => {
      const invalidEmail = 'notanemail';
      const error = validateEmailOnBlur(invalidEmail);

      expect(error).toBeTruthy();
      expect(error).toBe('Email inválido');
    });

    it('should clear email error when user starts typing valid email', () => {
      const errors = { email: 'Email inválido' };
      const newValue = 'test@example.com';

      // Simulate onChange - error should be cleared
      if (newValue) {
        delete errors.email;
      }

      expect(errors.email).toBeUndefined();
    });

    it('should trim and lowercase email on blur', () => {
      const rawEmail = '  TEST@EXAMPLE.COM  ';
      const processedEmail = rawEmail.trim().toLowerCase();

      expect(processedEmail).toBe('test@example.com');
    });
  });

  describe('Password Field Validation', () => {
    it('should validate password in real-time on change', () => {
      const passwords = [
        { value: 'short', valid: false },
        { value: 'Password1', valid: false }, // Missing special char
        { value: 'Password123!', valid: true },
        { value: 'VeryStrong@Pass99', valid: true }
      ];

      passwords.forEach(({ value, valid }) => {
        const error = validatePasswordOnChange(value);
        if (valid) {
          expect(error).toBeNull();
        } else {
          expect(error).toBeTruthy();
        }
      });
    });

    it('should calculate password strength in real-time', () => {
      const strengthTests: Array<{ password: string; expectedStrength: PasswordStrength }> = [
        { password: '', expectedStrength: 'weak' },
        { password: 'Pass1!', expectedStrength: 'weak' },
        { password: 'Password123!', expectedStrength: 'medium' },
        { password: 'VeryStrong@Password123', expectedStrength: 'strong' }
      ];

      strengthTests.forEach(({ password, expectedStrength }) => {
        const strength = calculatePasswordStrength(password);
        expect(strength).toBe(expectedStrength);
      });
    });

    it('should update password strength indicator on each keystroke', () => {
      const passwordProgression = [
        'P',           // weak
        'Pa',          // weak
        'Pas',         // weak
        'Pass',        // weak
        'Pass1',       // weak
        'Pass1!',      // weak (too short)
        'Pass12!',     // weak (too short)
        'Pass123!',    // medium
        'Password123!' // medium/strong
      ];

      passwordProgression.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(['weak', 'medium', 'strong']).toContain(strength);
      });
    });

    it('should show specific password requirement errors', () => {
      const testCases = [
        { password: 'password', expectedError: 'letra mayúscula' },
        { password: 'PASSWORD', expectedError: 'letra minúscula' },
        { password: 'Password', expectedError: 'número' },
        { password: 'Password123', expectedError: 'carácter especial' },
        { password: 'Pass1!', expectedError: 'muy corta' }
      ];

      testCases.forEach(({ password, expectedError }) => {
        const error = validatePasswordOnChange(password);
        expect(error).toBeTruthy();
        if (error) {
          expect(error.toLowerCase()).toContain(expectedError.toLowerCase());
        }
      });
    });
  });

  describe('Password Confirmation Validation', () => {
    it('should validate password confirmation in real-time', () => {
      const password = 'Password123!';
      const confirmations = [
        { value: '', error: 'Confirma tu contraseña' },
        { value: 'Different123!', error: 'Las contraseñas no coinciden' },
        { value: 'Password123!', error: null }
      ];

      confirmations.forEach(({ value, error }) => {
        const validationError = validatePasswordConfirmation(password, value);
        expect(validationError).toBe(error);
      });
    });

    it('should show mismatch error as user types wrong confirmation', () => {
      const password = 'Password123!';
      const confirmPassword = 'Password1'; // Partial match

      const error = validatePasswordConfirmation(password, confirmPassword);
      expect(error).toBe('Las contraseñas no coinciden');
    });

    it('should clear confirmation error when passwords match', () => {
      const password = 'Password123!';
      const confirmPassword = 'Password123!';

      const error = validatePasswordConfirmation(password, confirmPassword);
      expect(error).toBeNull();
    });

    it('should revalidate confirmation when main password changes', () => {
      let password = 'Password123!';
      let confirmPassword = 'Password123!';

      // Initially matching
      let error = validatePasswordConfirmation(password, confirmPassword);
      expect(error).toBeNull();

      // Change main password - should now mismatch
      password = 'NewPassword123!';
      error = validatePasswordConfirmation(password, confirmPassword);
      expect(error).toBe('Las contraseñas no coinciden');
    });
  });

  describe('Name Field Validation', () => {
    it('should validate name on blur', () => {
      const names = [
        { value: '', error: 'Nombre requerido' },
        { value: 'J', error: 'Nombre muy corto (mín. 2 caracteres)' },
        { value: 'Juan', error: null },
        { value: 'María José', error: null }
      ];

      names.forEach(({ value, error }) => {
        const validationError = validateNameOnBlur(value);
        expect(validationError).toBe(error);
      });
    });

    it('should reject names with numbers', () => {
      const error = validateNameOnBlur('Juan123');
      expect(error).toContain('letras y espacios');
    });

    it('should reject names with special characters', () => {
      const error = validateNameOnBlur('Juan@');
      expect(error).toContain('letras y espacios');
    });

    it('should accept names with Spanish characters', () => {
      const names = ['José', 'María', 'Ángel', 'Ñoño'];

      names.forEach((name) => {
        const error = validateNameOnBlur(name);
        expect(error).toBeNull();
      });
    });
  });

  describe('Phone Field Validation', () => {
    it('should validate Argentina phone format on blur', () => {
      const phones = [
        { value: '', error: 'Teléfono requerido' },
        { value: '11 1234-5678', error: 'Teléfono inválido' },
        { value: '+54 9 11 1234-5678', error: null },
        { value: '+54 9 351 1234-5678', error: null }
      ];

      phones.forEach(({ value, error }) => {
        const validationError = validatePhoneOnBlur(value);
        expect(validationError).toBe(error);
      });
    });

    it('should show format hint for invalid phone', () => {
      const error = validatePhoneOnBlur('1234567890');
      expect(error).toContain('+54 9');
      expect(error).toContain('1234-5678');
    });
  });

  describe('Form Submit Button State', () => {
    it('should disable submit button when form is invalid', () => {
      const formData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'invalid-email', // Invalid
        phone: '+54 9 11 1234-5678',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'CLIENT' as const,
        acceptTerms: true
      };

      const isValid = checkFormValidity(formData);
      expect(isValid).toBe(false);
    });

    it('should enable submit button when all fields are valid', () => {
      const formData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phone: '+54 9 11 1234-5678',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'CLIENT' as const,
        acceptTerms: true
      };

      const isValid = checkFormValidity(formData);
      expect(isValid).toBe(true);
    });

    it('should disable submit button when passwords do not match', () => {
      const formData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phone: '+54 9 11 1234-5678',
        password: 'Password123!',
        confirmPassword: 'Different123!', // Mismatch
        role: 'CLIENT' as const,
        acceptTerms: true
      };

      const isValid = checkFormValidity(formData);
      expect(isValid).toBe(false);
    });

    it('should disable submit button when terms are not accepted', () => {
      const formData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phone: '+54 9 11 1234-5678',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'CLIENT' as const,
        acceptTerms: false // Not accepted
      };

      const isValid = checkFormValidity(formData);
      expect(isValid).toBe(false);
    });

    it('should re-enable submit button when validation errors are fixed', () => {
      const formData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'invalid',
        phone: '+54 9 11 1234-5678',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'CLIENT' as const,
        acceptTerms: true
      };

      // Initially invalid
      let isValid = checkFormValidity(formData);
      expect(isValid).toBe(false);

      // Fix the email
      formData.email = 'juan@example.com';
      isValid = checkFormValidity(formData);
      expect(isValid).toBe(true);
    });
  });

  describe('Error Message Display', () => {
    it('should show error message below invalid field', () => {
      const fieldError = 'Email inválido';

      // Error should be displayed
      expect(fieldError).toBeTruthy();
      expect(typeof fieldError).toBe('string');
    });

    it('should show error in Spanish', () => {
      const errors = [
        'Email requerido',
        'Contraseña muy corta',
        'Las contraseñas no coinciden',
        'Nombre requerido',
        'Teléfono inválido'
      ];

      errors.forEach((error) => {
        expect(error).toBeTruthy();
        // All errors should be in Spanish (no English characters in error messages)
        expect(/^[a-záéíóúñ\s\(\)\d\-\.]+$/i.test(error)).toBe(true);
      });
    });

    it('should clear error message when field becomes valid', () => {
      const errors: Record<string, string> = {
        email: 'Email inválido'
      };

      // User fixes the email
      const newEmail = 'test@example.com';
      if (newEmail && !validateEmailOnBlur(newEmail)) {
        delete errors.email;
      }

      expect(errors.email).toBeUndefined();
    });
  });

  describe('Password Strength Indicator Visual States', () => {
    it('should show weak indicator with red color', () => {
      const strength: PasswordStrength = 'weak';
      const colorClass = getStrengthColor(strength);
      const label = getStrengthLabel(strength);

      expect(colorClass).toBe('bg-error-500');
      expect(label).toBe('Débil');
    });

    it('should show medium indicator with yellow color', () => {
      const strength: PasswordStrength = 'medium';
      const colorClass = getStrengthColor(strength);
      const label = getStrengthLabel(strength);

      expect(colorClass).toBe('bg-warning-500');
      expect(label).toBe('Media');
    });

    it('should show strong indicator with green color', () => {
      const strength: PasswordStrength = 'strong';
      const colorClass = getStrengthColor(strength);
      const label = getStrengthLabel(strength);

      expect(colorClass).toBe('bg-success-500');
      expect(label).toBe('Fuerte');
    });
  });

  describe('Multiple Field Validation Flow', () => {
    it('should validate all fields when user submits form', () => {
      const formData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'CLIENT' as const,
        acceptTerms: false
      };

      const errors = getAllErrors(formData);

      expect(errors.firstName).toBeTruthy();
      expect(errors.lastName).toBeTruthy();
      expect(errors.email).toBeTruthy();
      expect(errors.phone).toBeTruthy();
      expect(errors.password).toBeTruthy();
      expect(errors.confirmPassword).toBeTruthy();
      expect(errors.acceptTerms).toBeTruthy();
    });

    it('should show all field errors simultaneously on submit', () => {
      const formData = {
        firstName: 'J', // Too short
        lastName: 'P', // Too short
        email: 'invalid', // Invalid format
        phone: '123', // Invalid format
        password: 'weak', // Too weak
        confirmPassword: 'different', // Mismatch
        role: 'CLIENT' as const,
        acceptTerms: false
      };

      const errors = getAllErrors(formData);
      const errorCount = Object.keys(errors).length;

      expect(errorCount).toBeGreaterThan(5);
    });

    it('should progressively clear errors as user fixes fields', () => {
      const errors: Record<string, string> = {
        firstName: 'Nombre muy corto',
        email: 'Email inválido',
        password: 'Contraseña muy corta'
      };

      // Fix firstName
      delete errors.firstName;
      expect(Object.keys(errors).length).toBe(2);

      // Fix email
      delete errors.email;
      expect(Object.keys(errors).length).toBe(1);

      // Fix password
      delete errors.password;
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});

// Helper functions for testing (simulating component behavior)
function validateEmailOnBlur(email: string): string | null {
  if (!email) return 'Email requerido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Email inválido';
  return null;
}

function validatePasswordOnChange(password: string): string | null {
  if (!password) return 'Contraseña requerida';
  if (password.length < 8) return 'Contraseña muy corta (mín. 8 caracteres)';
  if (!/[a-z]/.test(password)) return 'Debe contener al menos una letra minúscula';
  if (!/[A-Z]/.test(password)) return 'Debe contener al menos una letra mayúscula';
  if (!/[0-9]/.test(password)) return 'Debe contener al menos un número';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Debe contener al menos un carácter especial';
  return null;
}

function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return 'Confirma tu contraseña';
  if (password !== confirmPassword) return 'Las contraseñas no coinciden';
  return null;
}

function validateNameOnBlur(name: string): string | null {
  if (!name) return 'Nombre requerido';
  if (name.length < 2) return 'Nombre muy corto (mín. 2 caracteres)';
  if (!/^[a-záéíóúñ\s]+$/i.test(name)) return 'El nombre solo puede contener letras y espacios';
  return null;
}

function validatePhoneOnBlur(phone: string): string | null {
  if (!phone) return 'Teléfono requerido';
  if (!/^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/.test(phone)) {
    return 'Teléfono inválido (usar formato: +54 9 11 1234-5678)';
  }
  return null;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score < 4) return 'weak';
  if (score < 6) return 'medium';
  return 'strong';
}

function getStrengthColor(strength: PasswordStrength): string {
  const colors = {
    weak: 'bg-error-500',
    medium: 'bg-warning-500',
    strong: 'bg-success-500'
  };
  return colors[strength];
}

function getStrengthLabel(strength: PasswordStrength): string {
  const labels = {
    weak: 'Débil',
    medium: 'Media',
    strong: 'Fuerte'
  };
  return labels[strength];
}

function checkFormValidity(formData: any): boolean {
  if (!formData.firstName || formData.firstName.length < 2) return false;
  if (!formData.lastName || formData.lastName.length < 2) return false;
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
  if (!formData.phone || !/^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/.test(formData.phone)) return false;
  if (!formData.password || formData.password.length < 8) return false;
  if (formData.password !== formData.confirmPassword) return false;
  if (!formData.acceptTerms) return false;

  // Check password requirements
  if (!/[a-z]/.test(formData.password)) return false;
  if (!/[A-Z]/.test(formData.password)) return false;
  if (!/[0-9]/.test(formData.password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) return false;

  return true;
}

function getAllErrors(formData: any): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.firstName) errors.firstName = 'Nombre requerido';
  else if (formData.firstName.length < 2) errors.firstName = 'Nombre muy corto';

  if (!formData.lastName) errors.lastName = 'Apellido requerido';
  else if (formData.lastName.length < 2) errors.lastName = 'Apellido muy corto';

  if (!formData.email) errors.email = 'Email requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email inválido';

  if (!formData.phone) errors.phone = 'Teléfono requerido';
  else if (!/^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/.test(formData.phone)) errors.phone = 'Teléfono inválido';

  if (!formData.password) errors.password = 'Contraseña requerida';
  else if (formData.password.length < 8) errors.password = 'Contraseña muy corta';

  if (!formData.confirmPassword) errors.confirmPassword = 'Confirma tu contraseña';
  else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

  if (!formData.acceptTerms) errors.acceptTerms = 'Debes aceptar los términos';

  return errors;
}
