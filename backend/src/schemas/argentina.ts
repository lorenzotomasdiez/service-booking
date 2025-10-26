import { Type } from '@sinclair/typebox';

// Argentina DNI validation pattern (8 digits with optional dots)
export const DNI_PATTERN = /^\d{1,2}\.?\d{3}\.?\d{3}$/;

// Argentina phone number pattern (+54 9 11 xxxx-xxxx for mobile, +54-xxx-xxx-xxxx or 11-xxxx-xxxx)
export const PHONE_PATTERN = /^(\+54[-\s]?9?[-\s]?)?(11|[2-9]\d{1})[-\s]?\d{4}[-\s]?\d{4}$/;

// Argentina CUIT/CUIL pattern (XX-XXXXXXXX-X)
export const CUIT_PATTERN = /^\d{2}-?\d{8}-?\d{1}$/;

// Validation schemas
export const ArgentinaDNI = Type.String({
  pattern: DNI_PATTERN.source,
  description: 'Argentina DNI format (8 digits, optional dots)',
  examples: ['12345678', '12.345.678']
});

export const ArgentinaPhone = Type.String({
  pattern: PHONE_PATTERN.source,
  description: 'Argentina phone format (+54-11-xxxx-xxxx)',
  examples: ['+54-11-1234-5678', '11-1234-5678', '+5491112345678']
});

export const ArgentinaCUIT = Type.String({
  pattern: CUIT_PATTERN.source,
  description: 'Argentina CUIT/CUIL format (XX-XXXXXXXX-X)',
  examples: ['20-12345678-9', '2012345678-9']
});

// Argentina postal code validation (A1234AAA or 1234)
export const ArgentinaPostalCode = Type.String({
  pattern: '^([A-Z]?\\d{4}[A-Z]{3}|\\d{4})$',
  description: 'Argentina postal code (CABA: A1234AAA, Provinces: 1234)',
  examples: ['C1234ABC', '1234']
});

// Helper functions for validation
export const validateDNI = (dni: string): boolean => {
  const cleanDNI = dni.replace(/\./g, '');
  return DNI_PATTERN.test(cleanDNI) && cleanDNI.length === 8;
};

export const validatePhone = (phone: string): boolean => {
  return PHONE_PATTERN.test(phone);
};

export const validateCUIT = (cuit: string): boolean => {
  const cleanCUIT = cuit.replace(/-/g, '');
  if (!/^\d{11}$/.test(cleanCUIT)) return false;
  
  // CUIT validation algorithm
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCUIT[i]) * weights[i];
  }
  
  const checkDigit = 11 - (sum % 11);
  const expectedCheckDigit = checkDigit === 11 ? 0 : checkDigit === 10 ? 9 : checkDigit;
  
  return parseInt(cleanCUIT[10]) === expectedCheckDigit;
};

export const formatPhone = (phone: string): string => {
  // Normalize phone to +54-11-xxxx-xxxx format
  const cleaned = phone.replace(/[-\s]/g, '');
  
  if (cleaned.startsWith('+54')) {
    const number = cleaned.substring(3);
    return `+54-${number.substring(0, 2)}-${number.substring(2, 6)}-${number.substring(6)}`;
  } else if (cleaned.startsWith('54')) {
    const number = cleaned.substring(2);
    return `+54-${number.substring(0, 2)}-${number.substring(2, 6)}-${number.substring(6)}`;
  } else {
    return `+54-${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
};

export const formatDNI = (dni: string): string => {
  const cleaned = dni.replace(/\./g, '');
  return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5)}`;
};

export const formatCUIT = (cuit: string): string => {
  const cleaned = cuit.replace(/-/g, '');
  return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 10)}-${cleaned.substring(10)}`;
};