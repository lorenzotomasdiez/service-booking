import { Type } from '@sinclair/typebox';
import { ArgentinaDNI, ArgentinaPhone, ArgentinaCUIT } from './argentina';

// User registration schema
export const RegisterSchema = Type.Object({
  name: Type.String({ 
    minLength: 2, 
    maxLength: 100,
    description: 'Full name of the user' 
  }),
  email: Type.String({ 
    format: 'email',
    description: 'Valid email address' 
  }),
  password: Type.String({ 
    minLength: 8,
    maxLength: 100,
    description: 'Password (minimum 8 characters)' 
  }),
  phone: Type.Optional(ArgentinaPhone),
  role: Type.Optional(Type.Union([
    Type.Literal('CLIENT'),
    Type.Literal('PROVIDER'),
    Type.Literal('ADMIN')
  ], { default: 'CLIENT' })),
  dni: Type.Optional(ArgentinaDNI),
  cuit: Type.Optional(ArgentinaCUIT),
  birthDate: Type.Optional(Type.String({ format: 'date' }))
});

// User login schema
export const LoginSchema = Type.Object({
  email: Type.String({ 
    format: 'email',
    description: 'Registered email address' 
  }),
  password: Type.String({ 
    minLength: 1,
    description: 'User password' 
  }),
  rememberMe: Type.Optional(Type.Boolean({ default: false }))
});

// Password reset request schema
export const ForgotPasswordSchema = Type.Object({
  email: Type.String({ 
    format: 'email',
    description: 'Registered email address' 
  })
});

// Password reset confirmation schema
export const ResetPasswordSchema = Type.Object({
  token: Type.String({ 
    minLength: 1,
    description: 'Reset token from email' 
  }),
  password: Type.String({ 
    minLength: 8,
    maxLength: 100,
    description: 'New password (minimum 8 characters)' 
  })
});

// Refresh token schema
export const RefreshTokenSchema = Type.Object({
  refreshToken: Type.String({ 
    minLength: 1,
    description: 'Valid refresh token' 
  })
});

// Update profile schema
export const UpdateProfileSchema = Type.Object({
  name: Type.Optional(Type.String({ 
    minLength: 2, 
    maxLength: 100 
  })),
  phone: Type.Optional(ArgentinaPhone),
  dni: Type.Optional(ArgentinaDNI),
  cuit: Type.Optional(ArgentinaCUIT),
  birthDate: Type.Optional(Type.String({ format: 'date' })),
  timezone: Type.Optional(Type.String({ 
    default: 'America/Argentina/Buenos_Aires' 
  })),
  locale: Type.Optional(Type.String({ 
    default: 'es-AR' 
  }))
});

// Change password schema
export const ChangePasswordSchema = Type.Object({
  currentPassword: Type.String({ 
    minLength: 1,
    description: 'Current password' 
  }),
  newPassword: Type.String({ 
    minLength: 8,
    maxLength: 100,
    description: 'New password (minimum 8 characters)' 
  })
});

// Response schemas
export const UserResponse = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  phone: Type.Union([Type.String(), Type.Null()]),
  role: Type.Union([
    Type.Literal('CLIENT'),
    Type.Literal('PROVIDER'),
    Type.Literal('ADMIN')
  ]),
  isActive: Type.Boolean(),
  isVerified: Type.Boolean(),
  dni: Type.Union([Type.String(), Type.Null()]),
  cuit: Type.Union([Type.String(), Type.Null()]),
  timezone: Type.String(),
  locale: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
  birthDate: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const AuthResponse = Type.Object({
  user: UserResponse,
  accessToken: Type.String(),
  refreshToken: Type.String(),
  expiresIn: Type.Number()
});

export const TokenResponse = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
  expiresIn: Type.Number()
});

// Error schemas
export const AuthErrorResponse = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Number()
});

export const ValidationErrorResponse = Type.Object({
  error: Type.String(),
  message: Type.String(),
  validation: Type.Array(Type.Object({
    field: Type.String(),
    message: Type.String()
  })),
  statusCode: Type.Number()
});