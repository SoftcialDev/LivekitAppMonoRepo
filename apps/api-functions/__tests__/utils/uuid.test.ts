import { isUuid } from '../../src/utils/uuid';

describe('uuid', () => {
  describe('isUuid', () => {
    it('should return true for valid UUID v4', () => {
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should return true for uppercase UUID', () => {
      expect(isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should return true for mixed case UUID', () => {
      expect(isUuid('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUID format', () => {
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isUuid('')).toBe(false);
    });

    it('should return false for UUID v1 (wrong version)', () => {
      expect(isUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should return false for UUID with invalid variant', () => {
      expect(isUuid('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
    });
  });
});

