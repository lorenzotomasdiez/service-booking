/**
 * T048: Unit Tests for Registration Form Validation
 * Tests for email format validation, password strength validation, and other field validations
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  dniSchema,
  roleSchema,
  registrationSchema,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  validateField,
  validatePasswordConfirmation,
  areAllFieldsValid,
  getAllValidationErrors
} from '$lib/validation/registration';

describe('Email Validation', () => {
  describe('Valid emails', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
        'admin@barberpro.ar'
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should trim and lowercase emails', () => {
      const result = emailSchema.parse('  TEST@EXAMPLE.COM  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('Invalid emails', () => {
    it('should reject empty email', () => {
      expect(() => emailSchema.parse('')).toThrow('Email requerido');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@.com',
        'user @example.com',
        'user@example',
        'user..name@example.com'
      ];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow('Email inválido');
      });
    });

    it('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => emailSchema.parse(longEmail)).toThrow('Email muy largo');
    });
  });
});

describe('Password Validation', () => {
  describe('Valid passwords', () => {
    it('should accept password with all requirements', () => {
      const validPasswords = [
        'Password123!',
        'MySecure@Pass1',
        'Strong#Pass99',
        'Valid$Password1'
      ];

      validPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });
  });

  describe('Invalid passwords', () => {
    it('should reject empty password', () => {
      expect(() => passwordSchema.parse('')).toThrow('Contraseña requerida');
    });

    it('should reject password shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('Pass1!')).toThrow('Contraseña muy corta (mín. 8 caracteres)');
    });

    it('should reject password without lowercase letter', () => {
      expect(() => passwordSchema.parse('PASSWORD123!')).toThrow('Debe contener al menos una letra minúscula');
    });

    it('should reject password without uppercase letter', () => {
      expect(() => passwordSchema.parse('password123!')).toThrow('Debe contener al menos una letra mayúscula');
    });

    it('should reject password without number', () => {
      expect(() => passwordSchema.parse('Password!')).toThrow('Debe contener al menos un número');
    });

    it('should reject password without special character', () => {
      expect(() => passwordSchema.parse('Password123')).toThrow('Debe contener al menos un carácter especial');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'A'.repeat(101) + 'a1!';
      expect(() => passwordSchema.parse(longPassword)).toThrow('Contraseña muy larga');
    });
  });
});

describe('Password Strength Calculation', () => {
  it('should calculate weak strength for short passwords', () => {
    expect(calculatePasswordStrength('')).toBe('weak');
    expect(calculatePasswordStrength('Pass1!')).toBe('weak');
    expect(calculatePasswordStrength('abc123')).toBe('weak');
  });

  it('should calculate medium strength for moderate passwords', () => {
    expect(calculatePasswordStrength('Password1!')).toBe('medium');
    expect(calculatePasswordStrength('Abcd1234!')).toBe('medium');
  });

  it('should calculate strong strength for complex passwords', () => {
    expect(calculatePasswordStrength('VeryStrong@Password123')).toBe('strong');
    expect(calculatePasswordStrength('Super$ecure#Pass99')).toBe('strong');
    expect(calculatePasswordStrength('MyComplex@Password2024!')).toBe('strong');
  });

  it('should return correct Spanish labels for strength levels', () => {
    expect(getPasswordStrengthLabel('weak')).toBe('Débil');
    expect(getPasswordStrengthLabel('medium')).toBe('Media');
    expect(getPasswordStrengthLabel('strong')).toBe('Fuerte');
  });

  it('should return correct color classes for strength levels', () => {
    expect(getPasswordStrengthColor('weak')).toBe('bg-error-500');
    expect(getPasswordStrengthColor('medium')).toBe('bg-warning-500');
    expect(getPasswordStrengthColor('strong')).toBe('bg-success-500');
  });
});

describe('Name Validation', () => {
  describe('Valid names', () => {
    it('should accept valid names with letters', () => {
      const validNames = [
        'Juan',
        'María',
        'José Luis',
        'Ana María',
        'Ñoño'
      ];

      validNames.forEach((name) => {
        expect(() => nameSchema.parse(name)).not.toThrow();
      });
    });

    it('should accept names with Spanish characters', () => {
      expect(() => nameSchema.parse('José')).not.toThrow();
      expect(() => nameSchema.parse('María')).not.toThrow();
      expect(() => nameSchema.parse('Ángel')).not.toThrow();
      expect(() => nameSchema.parse('Ñandú')).not.toThrow();
    });

    it('should trim whitespace from names', () => {
      const result = nameSchema.parse('  Juan  ');
      expect(result).toBe('Juan');
    });
  });

  describe('Invalid names', () => {
    it('should reject empty name', () => {
      expect(() => nameSchema.parse('')).toThrow('Nombre requerido');
    });

    it('should reject name shorter than 2 characters', () => {
      expect(() => nameSchema.parse('A')).toThrow('Nombre muy corto (mín. 2 caracteres)');
    });

    it('should reject name longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      expect(() => nameSchema.parse(longName)).toThrow('Nombre muy largo');
    });

    it('should reject names with numbers', () => {
      expect(() => nameSchema.parse('Juan123')).toThrow('El nombre solo puede contener letras y espacios');
    });

    it('should reject names with special characters', () => {
      expect(() => nameSchema.parse('Juan@')).toThrow('El nombre solo puede contener letras y espacios');
      expect(() => nameSchema.parse('María!')).toThrow('El nombre solo puede contener letras y espacios');
    });
  });
});

describe('Phone Validation (Argentina)', () => {
  describe('Valid phone numbers', () => {
    it('should accept valid Argentina phone formats', () => {
      const validPhones = [
        '+54 9 11 1234-5678',
        '+54 9 351 1234-5678',
        '+54 9 221 1234-5678'
      ];

      validPhones.forEach((phone) => {
        expect(() => phoneSchema.parse(phone)).not.toThrow();
      });
    });
  });

  describe('Invalid phone numbers', () => {
    it('should reject empty phone', () => {
      expect(() => phoneSchema.parse('')).toThrow('Teléfono requerido');
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '11 1234-5678',
        '+54 11 1234-5678',
        '+54 9 11 12345678',
        '+54 9 11-1234-5678',
        '549111234-5678'
      ];

      invalidPhones.forEach((phone) => {
        expect(() => phoneSchema.parse(phone)).toThrow('Teléfono inválido');
      });
    });
  });
});

describe('DNI Validation (Argentina)', () => {
  describe('Valid DNI numbers', () => {
    it('should accept valid DNI formats', () => {
      const validDNIs = [
        '12.345.678',
        '98.765.432',
        '1.234.567'
      ];

      validDNIs.forEach((dni) => {
        expect(() => dniSchema.parse(dni)).not.toThrow();
      });
    });
  });

  describe('Invalid DNI numbers', () => {
    it('should reject empty DNI', () => {
      expect(() => dniSchema.parse('')).toThrow('DNI requerido');
    });

    it('should reject invalid DNI formats', () => {
      const invalidDNIs = [
        '12345678',
        '12-345-678',
        '12 345 678',
        '123456789'
      ];

      invalidDNIs.forEach((dni) => {
        expect(() => dniSchema.parse(dni)).toThrow('DNI inválido');
      });
    });
  });
});

describe('Role Validation', () => {
  it('should accept valid roles', () => {
    expect(() => roleSchema.parse('CLIENT')).not.toThrow();
    expect(() => roleSchema.parse('PROVIDER')).not.toThrow();
  });

  it('should reject invalid roles', () => {
    expect(() => roleSchema.parse('ADMIN')).toThrow();
    expect(() => roleSchema.parse('invalid')).toThrow();
    expect(() => roleSchema.parse('')).toThrow();
  });
});

describe('Complete Registration Form Validation', () => {
  const validFormData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '+54 9 11 1234-5678',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'CLIENT' as const,
    acceptTerms: true,
    acceptMarketing: false
  };

  it('should accept valid complete form data', () => {
    expect(() => registrationSchema.parse(validFormData)).not.toThrow();
  });

  it('should reject when passwords do not match', () => {
    const invalidData = {
      ...validFormData,
      confirmPassword: 'DifferentPassword123!'
    };

    expect(() => registrationSchema.parse(invalidData)).toThrow('Las contraseñas no coinciden');
  });

  it('should reject when terms are not accepted', () => {
    const invalidData = {
      ...validFormData,
      acceptTerms: false
    };

    expect(() => registrationSchema.parse(invalidData)).toThrow('Debes aceptar los términos y condiciones');
  });
});

describe('Field Validation Helper', () => {
  it('should validate individual fields correctly', () => {
    expect(validateField('email', 'test@example.com')).toBeNull();
    expect(validateField('email', 'invalid')).toBe('Email inválido');

    expect(validateField('firstName', 'Juan')).toBeNull();
    expect(validateField('firstName', 'J')).toBe('Nombre muy corto (mín. 2 caracteres)');

    expect(validateField('password', 'Password123!')).toBeNull();
    expect(validateField('password', 'short')).toContain('Contraseña muy corta');
  });
});

describe('Password Confirmation Validation', () => {
  it('should return null when passwords match', () => {
    expect(validatePasswordConfirmation('Password123!', 'Password123!')).toBeNull();
  });

  it('should return error when passwords do not match', () => {
    expect(validatePasswordConfirmation('Password123!', 'Different123!')).toBe('Las contraseñas no coinciden');
  });

  it('should return error when confirmation is empty', () => {
    expect(validatePasswordConfirmation('Password123!', '')).toBe('Confirma tu contraseña');
  });
});

describe('Form Validity Check', () => {
  const validFormData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '+54 9 11 1234-5678',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'CLIENT' as const,
    acceptTerms: true
  };

  it('should return true for valid form data', () => {
    expect(areAllFieldsValid(validFormData)).toBe(true);
  });

  it('should return false for invalid form data', () => {
    const invalidData = { ...validFormData, email: 'invalid' };
    expect(areAllFieldsValid(invalidData)).toBe(false);
  });

  it('should return false when required fields are missing', () => {
    const incompleteData = { ...validFormData, firstName: '' };
    expect(areAllFieldsValid(incompleteData)).toBe(false);
  });
});

describe('Get All Validation Errors', () => {
  it('should return empty object for valid data', () => {
    const validData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      phone: '+54 9 11 1234-5678',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'CLIENT',
      acceptTerms: true
    };

    expect(getAllValidationErrors(validData)).toEqual({});
  });

  it('should return all validation errors for invalid data', () => {
    const invalidData = {
      firstName: 'J',
      lastName: '',
      email: 'invalid',
      phone: '1234',
      password: 'short',
      confirmPassword: 'different',
      role: 'INVALID',
      acceptTerms: false
    };

    const errors = getAllValidationErrors(invalidData);

    expect(errors.firstName).toContain('muy corto');
    expect(errors.lastName).toContain('requerido');
    expect(errors.email).toContain('inválido');
    expect(errors.phone).toContain('inválido');
    expect(errors.password).toBeTruthy();
    expect(errors.acceptTerms).toContain('términos');
  });

  it('should only show first error per field', () => {
    const invalidData = {
      firstName: '',
      lastName: 'Pérez',
      email: 'test@example.com',
      phone: '+54 9 11 1234-5678',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'CLIENT',
      acceptTerms: true
    };

    const errors = getAllValidationErrors(invalidData);

    // Should have only one error for firstName
    expect(typeof errors.firstName).toBe('string');
    expect(errors.firstName).toBeTruthy();
  });
});
