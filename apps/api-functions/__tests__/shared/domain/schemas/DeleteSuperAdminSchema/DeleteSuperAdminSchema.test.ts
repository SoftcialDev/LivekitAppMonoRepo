/**
 * @fileoverview DeleteSuperAdminSchema - unit tests
 * @summary Tests for DeleteSuperAdminSchema validation functionality
 * @description Validates Super Admin deletion request schema validation
 */

import { deleteSuperAdminSchema, DeleteSuperAdminRequest } from '../../../../../shared/domain/schemas/DeleteSuperAdminSchema';

describe('DeleteSuperAdminSchema', () => {
  describe('deleteSuperAdminSchema', () => {
    it('should validate valid userId string', () => {
      const validData = {
        userId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should validate Azure AD Object ID format', () => {
      const validData = {
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      }
    });

    it('should validate UUID format', () => {
      const validData = {
        userId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
      }
    });

    it('should validate single character string', () => {
      const validData = {
        userId: 'a'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('a');
      }
    });

    it('should validate long string', () => {
      const validData = {
        userId: 'a'.repeat(1000)
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('a'.repeat(1000));
      }
    });

    it('should reject empty userId', () => {
      const invalidData = {
        userId: ''
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('too_small');
        expect(result.error.issues[0].message).toBe('User ID is required');
      }
    });

    it('should reject missing userId', () => {
      const invalidData = {};

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null userId', () => {
      const invalidData = {
        userId: null
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined userId', () => {
      const invalidData = {
        userId: undefined
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject non-string userId', () => {
      const invalidData = {
        userId: 123
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean userId', () => {
      const invalidData = {
        userId: true
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array userId', () => {
      const invalidData = {
        userId: ['user1', 'user2']
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject object userId', () => {
      const invalidData = {
        userId: { id: 'user1' }
      };

      const result = deleteSuperAdminSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['userId']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('DeleteSuperAdminRequest type', () => {
    it('should have correct type structure', () => {
      const validData: DeleteSuperAdminRequest = {
        userId: '550e8400-e29b-41d4-a716-446655440000'
      };

      expect(validData.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should accept valid string userId', () => {
      const validData: DeleteSuperAdminRequest = {
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      };

      expect(typeof validData.userId).toBe('string');
      expect(validData.userId.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in userId', () => {
      const validData = {
        userId: 'user-id_with.special@chars#123'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('user-id_with.special@chars#123');
      }
    });

    it('should handle unicode characters in userId', () => {
      const validData = {
        userId: 'usuario-ñáéíóú-123'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('usuario-ñáéíóú-123');
      }
    });

    it('should handle numeric string userId', () => {
      const validData = {
        userId: '123456789'
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('123456789');
      }
    });

    it('should handle whitespace in userId', () => {
      const validData = {
        userId: ' user with spaces '
      };

      const result = deleteSuperAdminSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(' user with spaces ');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate super admin deletion request', () => {
      const requestData = {
        userId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = deleteSuperAdminSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(requestData);
      }
    });

    it('should validate different user ID formats', () => {
      const userIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'user123',
        'admin@example.com'
      ];

      userIds.forEach(userId => {
        const result = deleteSuperAdminSchema.safeParse({ userId });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.userId).toBe(userId);
        }
      });
    });

    it('should validate Azure AD Object ID format', () => {
      const azureAdObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const requestData = {
        userId: azureAdObjectId
      };

      const result = deleteSuperAdminSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(azureAdObjectId);
      }
    });
  });
});

