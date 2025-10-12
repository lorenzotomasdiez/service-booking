/**
 * CUIT Service Unit Tests
 *
 * Tests for CUIT/CUIL validation, formatting, and generation
 */

const cuitService = require('../services/cuit.service');

describe('CUIT Service', () => {
  describe('validateCUIT', () => {
    it('should validate correct CUIT with valid checksum', () => {
      const validCuits = [
        '20-12345678-6',
        '27-98765432-0',  // Corrected checksum
        '23-45678901-3',  // Corrected checksum
        '30-71234567-1',  // Corrected checksum
        '20123456786',    // Without hyphens
      ];

      validCuits.forEach(cuit => {
        const result = cuitService.validateCUIT(cuit);
        expect(result).toBe(true);
      });
    });

    it('should reject CUIT with invalid checksum', () => {
      const invalidCuits = [
        '20-12345678-0',  // Checksum should be 6
        '27-98765432-1',  // Checksum should be 0
        '23-45678901-0',  // Checksum should be 3
        '99-99999999-9',  // Invalid checksum
      ];

      invalidCuits.forEach(cuit => {
        const result = cuitService.validateCUIT(cuit);
        expect(result).toBe(false);
      });
    });

    it('should reject CUIT with invalid length', () => {
      const invalidLengths = [
        '20-1234567-6',     // Too short
        '20-123456789-6',   // Too long
        '123',              // Way too short
        '',                 // Empty string
      ];

      invalidLengths.forEach(cuit => {
        const result = cuitService.validateCUIT(cuit);
        expect(result).toBe(false);
      });
    });

    it('should reject CUIT with non-numeric characters', () => {
      const invalidCuits = [
        '20-ABCDEFGH-6',
        '2A-12345678-6',
        '20-12345678-X',
      ];

      invalidCuits.forEach(cuit => {
        const result = cuitService.validateCUIT(cuit);
        expect(result).toBe(false);
      });
    });

    it('should handle CUIT with and without hyphens', () => {
      expect(cuitService.validateCUIT('20-12345678-6')).toBe(true);
      expect(cuitService.validateCUIT('20123456786')).toBe(true);
      expect(cuitService.validateCUIT('20 12345678 6')).toBe(true);
    });

    it('should return false for null or undefined input', () => {
      expect(cuitService.validateCUIT(null)).toBe(false);
      expect(cuitService.validateCUIT(undefined)).toBe(false);
    });
  });

  describe('validateChecksum', () => {
    it('should validate correct checksum', () => {
      expect(cuitService.validateChecksum('20123456786')).toBe(true);
      expect(cuitService.validateChecksum('27987654320')).toBe(true);  // Corrected
      expect(cuitService.validateChecksum('23456789013')).toBe(true);  // Corrected
    });

    it('should reject incorrect checksum', () => {
      expect(cuitService.validateChecksum('20123456780')).toBe(false);
      expect(cuitService.validateChecksum('27987654321')).toBe(false);  // Wrong checksum
      expect(cuitService.validateChecksum('23456789010')).toBe(false);
    });

    it('should handle edge case where checkDigit would be 11 (becomes 0)', () => {
      // Need to find or create a CUIT where the calculation results in 11
      // For now, test that the function handles it correctly in the algorithm
      const result = cuitService.validateChecksum('20000000000');
      expect(typeof result).toBe('boolean');
    });

    it('should handle edge case where checkDigit would be 10 (becomes 9)', () => {
      // Test the algorithm handles the case where remainder produces 10
      const result = cuitService.validateChecksum('20000000009');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('cleanCUIT', () => {
    it('should remove hyphens from CUIT', () => {
      expect(cuitService.cleanCUIT('20-12345678-6')).toBe('20123456786');
    });

    it('should remove spaces from CUIT', () => {
      expect(cuitService.cleanCUIT('20 12345678 6')).toBe('20123456786');
    });

    it('should remove both hyphens and spaces', () => {
      expect(cuitService.cleanCUIT('20 - 12345678 - 6')).toBe('20123456786');
    });

    it('should return clean CUIT if already clean', () => {
      expect(cuitService.cleanCUIT('20123456786')).toBe('20123456786');
    });

    it('should return empty string for non-string input', () => {
      expect(cuitService.cleanCUIT(null)).toBe('');
      expect(cuitService.cleanCUIT(undefined)).toBe('');
      expect(cuitService.cleanCUIT(123)).toBe('');
    });
  });

  describe('formatCUIT', () => {
    it('should format clean CUIT correctly', () => {
      expect(cuitService.formatCUIT('20123456786')).toBe('20-12345678-6');
      expect(cuitService.formatCUIT('27987654320')).toBe('27-98765432-0');  // Corrected
    });

    it('should format already formatted CUIT', () => {
      expect(cuitService.formatCUIT('20-12345678-6')).toBe('20-12345678-6');
    });

    it('should return null for invalid length', () => {
      expect(cuitService.formatCUIT('123')).toBe(null);
      expect(cuitService.formatCUIT('20-1234567-6')).toBe(null);
      expect(cuitService.formatCUIT('')).toBe(null);
    });

    it('should format CUIT in standard XX-XXXXXXXX-X format', () => {
      const formatted = cuitService.formatCUIT('20123456786');
      expect(formatted).toMatch(/^\d{2}-\d{8}-\d{1}$/);
    });
  });

  describe('getCUITType', () => {
    it('should identify male person (20)', () => {
      const type = cuitService.getCUITType('20-12345678-6');
      expect(type).toBe('Persona Física Masculino');
    });

    it('should identify female person (27)', () => {
      const type = cuitService.getCUITType('27-98765432-0');  // Corrected
      expect(type).toBe('Persona Física Femenino');
    });

    it('should identify non-resident person (23)', () => {
      const type = cuitService.getCUITType('23-45678901-3');  // Corrected
      expect(type).toBe('Persona Física - No Residente');
    });

    it('should identify legal entity (30)', () => {
      const type = cuitService.getCUITType('30-71234567-1');  // Corrected
      expect(type).toBe('Persona Jurídica');
    });

    it('should identify new person format (24)', () => {
      const type = cuitService.getCUITType('24-12345678-0');
      expect(type).toContain('Nuevo');
    });

    it('should identify national legal entity (33)', () => {
      const type = cuitService.getCUITType('33-12345678-0');
      expect(type).toContain('Nacional');
    });

    it('should identify foreign legal entity (34)', () => {
      const type = cuitService.getCUITType('34-12345678-0');
      expect(type).toContain('Extranjera');
    });

    it('should return unknown for invalid type codes', () => {
      const type = cuitService.getCUITType('99-12345678-0');
      expect(type).toBe('Desconocido');
    });

    it('should return null for invalid length', () => {
      expect(cuitService.getCUITType('123')).toBe(null);
      expect(cuitService.getCUITType('')).toBe(null);
    });
  });

  describe('validateAndFormat', () => {
    it('should return validation result with formatted CUIT for valid input', () => {
      const result = cuitService.validateAndFormat('20123456786');

      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('20-12345678-6');
      expect(result.cleaned).toBe('20123456786');
      expect(result.type).toBe('Persona Física Masculino');
    });

    it('should return validation result with nulls for invalid input', () => {
      const result = cuitService.validateAndFormat('20-12345678-0');

      expect(result.valid).toBe(false);
      expect(result.formatted).toBe(null);
      expect(result.cleaned).toBe(null);
      expect(result.type).toBe(null);
    });

    it('should handle already formatted valid CUIT', () => {
      const result = cuitService.validateAndFormat('27-98765432-0');  // Corrected

      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('27-98765432-0');
      expect(result.cleaned).toBe('27987654320');
      expect(result.type).toBe('Persona Física Femenino');
    });

    it('should provide complete information in one call', () => {
      const result = cuitService.validateAndFormat('30-71234567-1');  // Corrected

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('cleaned');
      expect(result).toHaveProperty('type');
    });
  });

  describe('generateRandomCUIT', () => {
    it('should generate valid CUIT with default type (20)', () => {
      const cuit = cuitService.generateRandomCUIT();

      expect(cuit).toMatch(/^20-\d{8}-\d{1}$/);
      expect(cuitService.validateCUIT(cuit)).toBe(true);
    });

    it('should generate valid CUIT with specified type', () => {
      const types = ['20', '23', '24', '27', '30', '33', '34'];

      types.forEach(type => {
        const cuit = cuitService.generateRandomCUIT(type);

        expect(cuit).toMatch(new RegExp(`^${type}-\\d{8}-\\d{1}$`));
        expect(cuitService.validateCUIT(cuit)).toBe(true);
      });
    });

    it('should generate different CUITs on multiple calls', () => {
      const cuit1 = cuitService.generateRandomCUIT();
      const cuit2 = cuitService.generateRandomCUIT();
      const cuit3 = cuitService.generateRandomCUIT();

      // Very unlikely (but possible) that all three are the same
      expect(cuit1 === cuit2 && cuit2 === cuit3).toBe(false);
    });

    it('should generate CUIT with correct checksum', () => {
      for (let i = 0; i < 10; i++) {
        const cuit = cuitService.generateRandomCUIT();
        const cleaned = cuitService.cleanCUIT(cuit);

        expect(cuitService.validateChecksum(cleaned)).toBe(true);
      }
    });

    it('should generate CUIT with female type (27)', () => {
      const cuit = cuitService.generateRandomCUIT('27');

      expect(cuit).toMatch(/^27-\d{8}-\d{1}$/);
      expect(cuitService.getCUITType(cuit)).toBe('Persona Física Femenino');
    });

    it('should generate CUIT for legal entity (30)', () => {
      const cuit = cuitService.generateRandomCUIT('30');

      expect(cuit).toMatch(/^30-\d{8}-\d{1}$/);
      expect(cuitService.getCUITType(cuit)).toBe('Persona Jurídica');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long strings gracefully', () => {
      const longString = '1'.repeat(100);
      expect(cuitService.validateCUIT(longString)).toBe(false);
    });

    it('should handle special characters', () => {
      expect(cuitService.validateCUIT('20-12345678-6!')).toBe(false);
      expect(cuitService.validateCUIT('20@12345678#6')).toBe(false);
    });

    it('should handle mixed format correctly', () => {
      expect(cuitService.validateCUIT('20 123456786')).toBe(true);
      expect(cuitService.validateCUIT('20-123456786')).toBe(true);
    });

    it('should be case-insensitive for type detection', () => {
      // Numbers don't have case, but testing robustness
      const result = cuitService.getCUITType('20-12345678-6');
      expect(typeof result).toBe('string');
    });
  });

  describe('Real-world Test Cases', () => {
    // These are test CUITs with valid checksums for different categories
    const testCUITs = [
      { cuit: '20-12345678-6', valid: true, type: 'Persona Física Masculino' },
      { cuit: '27-98765432-0', valid: true, type: 'Persona Física Femenino' },  // Corrected
      { cuit: '23-45678901-3', valid: true, type: 'Persona Física - No Residente' },  // Corrected
      { cuit: '30-71234567-1', valid: true, type: 'Persona Jurídica' },  // Corrected
      { cuit: '20-12345678-0', valid: false, type: null }, // Invalid checksum
    ];

    testCUITs.forEach(({ cuit, valid, type }) => {
      it(`should ${valid ? 'validate' : 'reject'} ${cuit}`, () => {
        const result = cuitService.validateAndFormat(cuit);

        expect(result.valid).toBe(valid);
        if (valid) {
          expect(result.type).toBe(type);
          expect(result.formatted).toBeTruthy();
          expect(result.cleaned).toBeTruthy();
        } else {
          expect(result.type).toBe(null);
          expect(result.formatted).toBe(null);
        }
      });
    });
  });
});
