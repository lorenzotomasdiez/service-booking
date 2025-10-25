/**
 * T050: Registration Form Validation Schemas
 * Comprehensive Zod validation schemas for registration with Argentina-specific rules
 */

import { z } from 'zod';

// Password strength levels
export type PasswordStrength = 'weak' | 'medium' | 'strong';

// Email validation (RFC 5322 compliant)
export const emailSchema = z
  .string()
  .min(1, 'Email requerido')
  .email('Email inválido')
  .max(255, 'Email muy largo')
  .toLowerCase()
  .trim();

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(1, 'Contraseña requerida')
  .min(8, 'Contraseña muy corta (mín. 8 caracteres)')
  .max(100, 'Contraseña muy larga (máx. 100 caracteres)')
  .refine(
    (password) => /[a-z]/.test(password),
    'Debe contener al menos una letra minúscula'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Debe contener al menos una letra mayúscula'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Debe contener al menos un número'
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Debe contener al menos un carácter especial'
  );

// Name validation (first name or last name)
export const nameSchema = z
  .string()
  .min(1, 'Nombre requerido')
  .min(2, 'Nombre muy corto (mín. 2 caracteres)')
  .max(50, 'Nombre muy largo (máx. 50 caracteres)')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
  .trim();

// Phone validation for Argentina format: +54 9 11 1234-5678
export const phoneSchema = z
  .string()
  .min(1, 'Teléfono requerido')
  .regex(
    /^\+54\s9\s\d{2,4}\s\d{4}-\d{4}$/,
    'Teléfono inválido (usar formato: +54 9 11 1234-5678)'
  );

// DNI validation for Argentina format: 12.345.678
export const dniSchema = z
  .string()
  .min(1, 'DNI requerido')
  .regex(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}$/, 'DNI inválido (usar formato: 12.345.678)');

// Role validation
export const roleSchema = z.enum(['CLIENT', 'PROVIDER'], 'Por favor selecciona un rol');

// Complete registration form schema
export const registrationSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    role: roleSchema,
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones'
    }),
    acceptMarketing: z.boolean().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  });

// Individual field validation schemas (for real-time validation)
export const fieldValidationSchemas = {
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: roleSchema
} as const;

// Password strength calculation
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';

  const length = password.length;
  let score = 0;

  // Length score
  if (length >= 8) score++;
  if (length >= 12) score++;
  if (length >= 16) score++;

  // Character variety score
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  // Determine strength based on score
  if (score < 4) return 'weak';
  if (score < 6) return 'medium';
  return 'strong';
}

// Get password strength label in Spanish
export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  const labels: Record<PasswordStrength, string> = {
    weak: 'Débil',
    medium: 'Media',
    strong: 'Fuerte'
  };
  return labels[strength];
}

// Get password strength color class
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  const colors: Record<PasswordStrength, string> = {
    weak: 'bg-error-500',
    medium: 'bg-warning-500',
    strong: 'bg-success-500'
  };
  return colors[strength];
}

// Validate a single field and return error message
export function validateField(
  fieldName: keyof typeof fieldValidationSchemas,
  value: any
): string | null {
  try {
    const schema = fieldValidationSchemas[fieldName];
    if (!schema) return null;

    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Valor inválido';
    }
    return 'Error de validación';
  }
}

// Validate password confirmation
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Confirma tu contraseña';
  }
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  return null;
}

// Check if all required fields are valid
export function areAllFieldsValid(formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'CLIENT' | 'PROVIDER';
  acceptTerms: boolean;
}): boolean {
  try {
    registrationSchema.parse(formData);
    return true;
  } catch {
    return false;
  }
}

// Get all validation errors for a form
export function getAllValidationErrors(formData: any): Record<string, string> {
  try {
    registrationSchema.parse(formData);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (field && !errors[field]) {
          errors[field] = err.message;
        }
      });
      return errors;
    }
    return {};
  }
}

// Export types
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type FieldName = keyof typeof fieldValidationSchemas;
