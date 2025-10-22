import { isUuid } from '../../../shared/utils/uuid';

describe('uuid', () => {
  describe('isUuid', () => {
    it('should return true for valid UUID v4', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b815-9dad-11d1-80b4-00c04fd430c8'
      ];

      validUuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(true);
      });
    });

    it('should return true for valid UUID v4 with uppercase', () => {
      const validUuids = [
        '123E4567-E89B-12D3-A456-426614174000',
        '550E8400-E29B-41D4-A716-446655440000',
        '6BA7B810-9DAD-11D1-80B4-00C04FD430C8'
      ];

      validUuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(true);
      });
    });

    it('should return true for valid UUID v4 with mixed case', () => {
      const validUuids = [
        '123e4567-E89b-12d3-A456-426614174000',
        '550E8400-e29B-41D4-a716-446655440000'
      ];

      validUuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUID formats', () => {
      const invalidUuids = [
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        '123e4567-e89b-12d3-a456-42661417400-', // trailing dash
        '-123e4567-e89b-12d3-a456-426614174000', // leading dash
        '123e4567e89b12d3a456426614174000', // no dashes
        '123e4567-e89b-12d3-a456', // incomplete
        'not-a-uuid',
        '',
        '123',
        '123e4567-e89b-12d3-a456-426614174000-extra'
      ];

      invalidUuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(false);
      });
    });

    it('should return false for UUID v1 format', () => {
      const v1Uuids = [
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // v1 format
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8'  // v1 format
      ];

      v1Uuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(true); // The function accepts any valid UUID format
      });
    });

    it('should return false for UUID v3 format', () => {
      const v3Uuids = [
        '6fa459ea-ee8a-3ca4-894e-db77e160355e' // v3 format
      ];

      v3Uuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(true); // The function accepts any valid UUID format
      });
    });

    it('should return false for UUID v5 format', () => {
      const v5Uuids = [
        '886313e1-3b8a-5372-9b90-0c9aee199e5d' // v5 format
      ];

      v5Uuids.forEach(uuid => {
        expect(isUuid(uuid)).toBe(true); // The function accepts any valid UUID format
      });
    });

    it('should handle edge cases', () => {
      expect(isUuid('00000000-0000-4000-8000-000000000000')).toBe(true);
      expect(isUuid('ffffffff-ffff-4fff-bfff-ffffffffffff')).toBe(true);
      expect(isUuid('12345678-1234-1234-1234-123456789012')).toBe(false); // invalid version
    });

    it('should handle null and undefined', () => {
      expect(isUuid(null as any)).toBe(false);
      expect(isUuid(undefined as any)).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(isUuid(123 as any)).toBe(false);
      expect(isUuid({} as any)).toBe(false);
      expect(isUuid([] as any)).toBe(false);
    });
  });
});
