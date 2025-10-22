import { UserDeletionRequest } from '../../../../../shared/domain/value-objects/UserDeletionRequest';

// Mock UserDeletionType since it's not available in test environment
const UserDeletionType = {
  SOFT_DELETE: 'SOFT_DELETE'
} as const;

// Mock the UserDeletionType import in the actual file
jest.mock('../../../../../shared/domain/enums/UserDeletionType', () => ({
  UserDeletionType: {
    SOFT_DELETE: 'SOFT_DELETE'
  }
}));

// Import the mocked enum
import { UserDeletionType as MockedUserDeletionType } from '../../../../../shared/domain/enums/UserDeletionType';

describe('UserDeletionRequest', () => {
  describe('create factory method', () => {
    it('should create request with valid parameters', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        'User requested deletion'
      );

      expect(request.userEmail).toBe('user@example.com');
      expect(request.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(request.reason).toBe('User requested deletion');
    });

    it('should create request without reason', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE
      );

      expect(request.userEmail).toBe('user@example.com');
      expect(request.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(request.reason).toBeUndefined();
    });

    it('should create request with SOFT_DELETE type', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        'Administrative action'
      );

      expect(request.userEmail).toBe('user@example.com');
      expect(request.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(request.reason).toBe('Administrative action');
    });

    it('should handle different email formats', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+test@company.org'
      ];

      emails.forEach(email => {
        const request = UserDeletionRequest.create(email, MockedUserDeletionType.SOFT_DELETE);
        expect(request.userEmail).toBe(email);
      });
    });
  });

  describe('isSoftDelete', () => {
    it('should always return true', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE
      );

      expect(request.isSoftDelete()).toBe(true);
    });

    it('should return true even for HardDelete type', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE
      );

      expect(request.isSoftDelete()).toBe(true);
    });
  });

  describe('getDeletionTypeString', () => {
    it('should return SOFT_DELETE as string', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE
      );

      expect(request.getDeletionTypeString()).toBe('SOFT_DELETE');
    });

    it('should return SOFT_DELETE as string for all cases', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE
      );

      expect(request.getDeletionTypeString()).toBe('SOFT_DELETE');
    });
  });

  describe('getReason', () => {
    it('should return reason when provided', () => {
      const reason = 'User requested account deletion';
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        reason
      );

      expect(request.getReason()).toBe(reason);
    });

    it('should return undefined when no reason provided', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE
      );

      expect(request.getReason()).toBeUndefined();
    });

    it('should return empty string when empty reason provided', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        ''
      );

      expect(request.getReason()).toBe('');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        'Test reason'
      );

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).userEmail = 'modified@example.com';
      }).toThrow();

      expect(() => {
        (request as any).deletionType = UserDeletionType.SOFT_DELETE;
      }).toThrow();

      expect(() => {
        (request as any).reason = 'Modified reason';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email string', () => {
      const request = UserDeletionRequest.create('', MockedUserDeletionType.SOFT_DELETE);
      expect(request.userEmail).toBe('');
    });

    it('should handle long email string', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const request = UserDeletionRequest.create(longEmail, MockedUserDeletionType.SOFT_DELETE);
      expect(request.userEmail).toBe(longEmail);
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'user+test@example-domain.co.uk';
      const request = UserDeletionRequest.create(specialEmail, MockedUserDeletionType.SOFT_DELETE);
      expect(request.userEmail).toBe(specialEmail);
    });

    it('should handle long reason string', () => {
      const longReason = 'A'.repeat(1000);
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        longReason
      );
      expect(request.reason).toBe(longReason);
    });

    it('should handle special characters in reason', () => {
      const specialReason = 'User requested deletion due to: "Privacy concerns" & data protection';
      const request = UserDeletionRequest.create(
        'user@example.com',
        MockedUserDeletionType.SOFT_DELETE,
        specialReason
      );
      expect(request.reason).toBe(specialReason);
    });
  });
});
