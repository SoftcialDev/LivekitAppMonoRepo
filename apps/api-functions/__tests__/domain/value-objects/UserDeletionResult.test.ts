import { UserDeletionResult } from '../../../src/domain/value-objects/UserDeletionResult';
import { UserRole } from '@prisma/client';
import { UserDeletionType } from '../../../src/domain/enums/UserDeletionType';

describe('UserDeletionResult', () => {
  describe('failure', () => {
    it('should create failure result', () => {
      const result = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'Deletion failed'
      );

      expect(result.success).toBe(false);
      expect(result.userEmail).toBe('user@example.com');
      expect(result.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(result.message).toBe('Deletion failed');
      expect(result.previousRole).toBeNull();
      expect(result.azureAdObjectId).toBeNull();
      expect(result.fullName).toBeNull();
    });
  });

  describe('getDeletionTypeString', () => {
    it('should return deletion type as string', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.PSO,
        'azure-id',
        'User Name',
        'Deletion successful'
      );
      expect(result.getDeletionTypeString()).toBe(UserDeletionType.SOFT_DELETE);
    });
  });

  describe('getPreviousRoleString', () => {
    it('should return previous role as string', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Supervisor,
        'azure-id',
        'User Name',
        'Deletion successful'
      );
      expect(result.getPreviousRoleString()).toBe(UserRole.Supervisor);
    });

    it('should return null when previous role is null', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        null,
        'azure-id',
        'User Name',
        'Deletion successful'
      );
      expect(result.getPreviousRoleString()).toBeNull();
    });
  });

  describe('isSuccess', () => {
    it('should return true for success result', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.PSO,
        'azure-id',
        'User Name',
        'Deletion successful'
      );
      expect(result.isSuccess()).toBe(true);
    });

    it('should return false for failure result', () => {
      const result = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'Deletion failed'
      );
      expect(result.isSuccess()).toBe(false);
    });
  });

  describe('getMessage', () => {
    it('should return message from result', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.PSO,
        'azure-id',
        'User Name',
        'Deletion successful'
      );
      expect(result.getMessage()).toBe('Deletion successful');
    });
  });
});

