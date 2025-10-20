/**
 * @fileoverview DeleteContactManagerSchema - unit tests
 * @summary Tests for DeleteContactManagerSchema validation functionality
 * @description Validates Contact Manager deletion request schema validation
 */

import { deleteContactManagerSchema, DeleteContactManagerRequest } from '../../../../../shared/domain/schemas/DeleteContactManagerSchema';

describe('DeleteContactManagerSchema', () => {
  describe('deleteContactManagerSchema', () => {
    it('should validate valid UUID profileId', () => {
      const validData = {
        profileId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should validate different UUID formats', () => {
      const uuidFormats = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff'
      ];

      uuidFormats.forEach(uuid => {
        const result = deleteContactManagerSchema.safeParse({ profileId: uuid });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.profileId).toBe(uuid);
        }
      });
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        profileId: 'invalid-uuid'
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_string');
      }
    });

    it('should reject empty profileId', () => {
      const invalidData = {
        profileId: ''
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_string');
      }
    });

    it('should reject missing profileId', () => {
      const invalidData = {};

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null profileId', () => {
      const invalidData = {
        profileId: null
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined profileId', () => {
      const invalidData = {
        profileId: undefined
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject non-string profileId', () => {
      const invalidData = {
        profileId: 123
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject malformed UUID with extra characters', () => {
      const invalidData = {
        profileId: '550e8400-e29b-41d4-a716-446655440000-extra'
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_string');
      }
    });

    it('should reject UUID with wrong format', () => {
      const invalidData = {
        profileId: '550e8400e29b41d4a716446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_string');
      }
    });

    it('should reject UUID with wrong separators', () => {
      const invalidData = {
        profileId: '550e8400_e29b_41d4_a716_446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['profileId']);
        expect(result.error.issues[0].code).toBe('invalid_string');
      }
    });
  });

  describe('DeleteContactManagerRequest type', () => {
    it('should have correct type structure', () => {
      const validData: DeleteContactManagerRequest = {
        profileId: '550e8400-e29b-41d4-a716-446655440000'
      };

      expect(validData.profileId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should accept valid UUID strings', () => {
      const validData: DeleteContactManagerRequest = {
        profileId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      };

      expect(typeof validData.profileId).toBe('string');
      expect(validData.profileId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('edge cases', () => {
    it('should handle UUID with mixed case', () => {
      const validData = {
        profileId: '550E8400-E29B-41D4-A716-446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe('550E8400-E29B-41D4-A716-446655440000');
      }
    });

    it('should handle UUID with lowercase', () => {
      const validData = {
        profileId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should handle UUID with uppercase', () => {
      const validData = {
        profileId: '550E8400-E29B-41D4-A716-446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profileId).toBe('550E8400-E29B-41D4-A716-446655440000');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate contact manager profile deletion request', () => {
      const requestData = {
        profileId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = deleteContactManagerSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(requestData);
      }
    });

    it('should validate different profile IDs', () => {
      const profileIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
      ];

      profileIds.forEach(profileId => {
        const result = deleteContactManagerSchema.safeParse({ profileId });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.profileId).toBe(profileId);
        }
      });
    });
  });
});

