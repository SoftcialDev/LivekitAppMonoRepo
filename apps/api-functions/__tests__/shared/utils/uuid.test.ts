/**
 * @fileoverview Tests for UUID utilities
 * @description Tests for UUID validation functions
 */

import { isUuid } from '../../../shared/utils/uuid';

describe('UUID utilities', () => {
  describe('isUuid', () => {
    it('should return true for valid UUID v4', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(isUuid(validUuid)).toBe(true);
    });

    it('should return true for valid UUID v4 with uppercase', () => {
      const validUuid = '123E4567-E89B-12D3-A456-426614174000';
      expect(isUuid(validUuid)).toBe(true);
    });

    it('should return true for valid UUID v4 with mixed case', () => {
      const validUuid = '123e4567-E89b-12D3-a456-426614174000';
      expect(isUuid(validUuid)).toBe(true);
    });

    it('should return false for invalid UUID format', () => {
      const invalidUuid = '123e4567-e89b-12d3-a456-42661417400';
      expect(isUuid(invalidUuid)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isUuid('')).toBe(false);
    });

    it('should return false for non-UUID string', () => {
      expect(isUuid('not-a-uuid')).toBe(false);
    });

    it('should return false for UUID with invalid version', () => {
      const invalidVersion = '123e4567-e89b-12d3-6123-426614174000';
      expect(isUuid(invalidVersion)).toBe(false);
    });

    it('should return false for UUID with invalid variant', () => {
      const invalidVariantFormat = '123e4567-e89b-12d3-a456-42661417400c';
      expect(isUuid(invalidVariantFormat)).toBe(false);
    });

    it('should return false for UUID with invalid format', () => {
      const invalidFormat = '123e4567-e89b-12d3-a456-42661417400g';
      expect(isUuid(invalidFormat)).toBe(false);
    });
  });
});