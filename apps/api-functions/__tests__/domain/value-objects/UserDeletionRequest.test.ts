import { UserDeletionRequest } from '../../../src/domain/value-objects/UserDeletionRequest';
import { UserDeletionType } from '../../../src/domain/enums/UserDeletionType';

describe('UserDeletionRequest', () => {
  describe('isSoftDelete', () => {
    it('should always return true', () => {
      const request = UserDeletionRequest.create('user@example.com', UserDeletionType.SOFT_DELETE);
      expect(request.isSoftDelete()).toBe(true);
    });
  });

  describe('getDeletionTypeString', () => {
    it('should return deletion type as string', () => {
      const request = UserDeletionRequest.create('user@example.com', UserDeletionType.SOFT_DELETE);
      expect(request.getDeletionTypeString()).toBe(UserDeletionType.SOFT_DELETE);
    });
  });

  describe('getReason', () => {
    it('should return reason when provided', () => {
      const request = UserDeletionRequest.create(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'User requested deletion'
      );
      expect(request.getReason()).toBe('User requested deletion');
    });

    it('should return undefined when reason not provided', () => {
      const request = UserDeletionRequest.create('user@example.com', UserDeletionType.SOFT_DELETE);
      expect(request.getReason()).toBeUndefined();
    });
  });
});

