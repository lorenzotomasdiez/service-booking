import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { argentinaValidation, commonSchemas } from '../middleware/validation';

// User creation schema
export const createUserSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo'),
  email: z.string().email('Email inválido').max(255, 'Email demasiado largo'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres').max(128, 'Contraseña demasiado larga'),
  phone: argentinaValidation.phone.optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CLIENT),
  dni: argentinaValidation.dni.optional(),
  cuit: argentinaValidation.cuit.optional(),
  timezone: argentinaValidation.timezone.default('America/Argentina/Buenos_Aires'),
  locale: argentinaValidation.locale.default('es-AR'),
  avatar: z.string().url('URL de avatar inválida').optional(),
  birthDate: z.string().datetime('Fecha de nacimiento inválida').optional().transform(val => val ? new Date(val) : undefined)
});

// User update schema
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo').optional(),
  email: z.string().email('Email inválido').max(255, 'Email demasiado largo').optional(),
  phone: argentinaValidation.phone.optional(),
  dni: argentinaValidation.dni.optional(),
  cuit: argentinaValidation.cuit.optional(),
  timezone: argentinaValidation.timezone.optional(),
  locale: argentinaValidation.locale.optional(),
  avatar: z.string().url('URL de avatar inválida').optional(),
  birthDate: z.string().datetime('Fecha de nacimiento inválida').optional().transform(val => val ? new Date(val) : undefined),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional()
});

// Password update schema
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'Nueva contraseña debe tener al menos 8 caracteres').max(128, 'Contraseña demasiado larga'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña requerida')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// User list query schema
export const listUsersQuerySchema = commonSchemas.pagination.extend({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  search: z.string().max(100, 'Búsqueda demasiado larga').optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt', 'role']).default('createdAt')
});

// User ID param schema
export const userIdParamSchema = commonSchemas.id;

// User availability check schemas
export const emailAvailabilitySchema = z.object({
  email: z.string().email('Email inválido')
});

export const phoneAvailabilitySchema = z.object({
  phone: argentinaValidation.phone
});

export const dniAvailabilitySchema = z.object({
  dni: argentinaValidation.dni
});

// Export type definitions for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type EmailAvailabilityInput = z.infer<typeof emailAvailabilitySchema>;
export type PhoneAvailabilityInput = z.infer<typeof phoneAvailabilitySchema>;
export type DNIAvailabilityInput = z.infer<typeof dniAvailabilitySchema>;