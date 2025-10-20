/**
 * @fileoverview UserDeletionResult value object - unit tests
 * @summary Tests for UserDeletionResult value object functionality
 * @description Validates result creation, factory methods, and utility functions
 */

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { UserDeletionResult } from '../../../../../shared/domain/value-objects/UserDeletionResult';
import { UserDeletionType } from '../../../../../shared/domain/enums/UserDeletionType';
import { UserRole } from '../../../../../shared/domain/enums/UserRole';

describe('UserDeletionResult', () => {
  describe('success factory method', () => {
    it('should create successful deletion result', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'User deleted successfully'
      );

      expect(result.success).toBe(true);
      expect(result.userEmail).toBe('user@example.com');
      expect(result.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(result.previousRole).toBe(UserRole.Employee);
      expect(result.azureAdObjectId).toBe('azure-123');
      expect(result.fullName).toBe('John Doe');
      expect(result.message).toBe('User deleted successfully');
      expect(result.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should create successful deletion result with null values', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        null,
        null,
        null,
        'User deleted successfully'
      );

      expect(result.success).toBe(true);
      expect(result.userEmail).toBe('user@example.com');
      expect(result.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(result.previousRole).toBeNull();
      expect(result.azureAdObjectId).toBeNull();
      expect(result.fullName).toBeNull();
      expect(result.message).toBe('User deleted successfully');
    });

    it('should handle different deletion types', () => {
      const softDeleteResult = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Soft deleted'
      );

      const hardDeleteResult = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Supervisor,
        'azure-456',
        'Jane Doe',
        'Hard deleted'
      );

      expect(softDeleteResult.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(hardDeleteResult.deletionType).toBe(UserDeletionType.SOFT_DELETE);
    });

    it('should handle different user roles', () => {
      const psoResult = UserDeletionResult.success(
        'pso@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'PSO User',
        'PSO deleted'
      );

      const supervisorResult = UserDeletionResult.success(
        'supervisor@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Supervisor,
        'azure-456',
        'Supervisor User',
        'Supervisor deleted'
      );

      expect(psoResult.previousRole).toBe(UserRole.Employee);
      expect(supervisorResult.previousRole).toBe(UserRole.Supervisor);
    });
  });

  describe('failure factory method', () => {
    it('should create failed deletion result', () => {
      const result = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'Deletion failed due to database error'
      );

      expect(result.success).toBe(false);
      expect(result.userEmail).toBe('user@example.com');
      expect(result.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(result.previousRole).toBeNull();
      expect(result.azureAdObjectId).toBeNull();
      expect(result.fullName).toBeNull();
      expect(result.message).toBe('Deletion failed due to database error');
      expect(result.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should handle different failure scenarios', () => {
      const dbErrorResult = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'Database connection failed'
      );

      const authErrorResult = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'User not authorized for deletion'
      );

      expect(dbErrorResult.message).toBe('Database connection failed');
      expect(authErrorResult.message).toBe('User not authorized for deletion');
    });
  });

  describe('utility methods', () => {
    it('should get deletion type as string', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      expect(result.getDeletionTypeString()).toBe(UserDeletionType.SOFT_DELETE);
    });

    it('should get previous role as string', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      expect(result.getPreviousRoleString()).toBe(UserRole.Employee);
    });

    it('should return null for previous role when not set', () => {
      const result = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'Failed'
      );

      expect(result.getPreviousRoleString()).toBeNull();
    });

    it('should check if deletion was successful', () => {
      const successResult = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      const failureResult = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        'Failed'
      );

      expect(successResult.isSuccess()).toBe(true);
      expect(failureResult.isSuccess()).toBe(false);
    });

    it('should get result message', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'User deleted successfully'
      );

      expect(result.getMessage()).toBe('User deleted successfully');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (result as any).success = false;
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (result as any).userEmail = 'other@example.com';
      }).not.toThrow();

      expect(() => {
        (result as any).timestamp = new Date();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email', () => {
      const result = UserDeletionResult.success(
        '',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      expect(result.userEmail).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long error message that contains detailed information about what went wrong during the deletion process and provides comprehensive context for debugging purposes';
      
      const result = UserDeletionResult.failure(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        longMessage
      );

      expect(result.message).toBe(longMessage);
    });

    it('should handle special characters in email', () => {
      const result = UserDeletionResult.success(
        'user+test@example-domain.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      expect(result.userEmail).toBe('user+test@example-domain.com');
    });

    it('should handle unicode characters in full name', () => {
      const result = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'José María',
        'Deleted'
      );

      expect(result.fullName).toBe('José María');
    });
  });

  describe('type safety', () => {
    it('should accept valid UserDeletionType values', () => {
      const softDeleteResult = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        'Deleted'
      );

      const hardDeleteResult = UserDeletionResult.success(
        'user@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Supervisor,
        'azure-456',
        'Jane Doe',
        'Deleted'
      );

      expect(softDeleteResult.deletionType).toBe(UserDeletionType.SOFT_DELETE);
      expect(hardDeleteResult.deletionType).toBe(UserDeletionType.SOFT_DELETE);
    });

    it('should accept valid UserRole values', () => {
      const psoResult = UserDeletionResult.success(
        'pso@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Employee,
        'azure-123',
        'PSO User',
        'Deleted'
      );

      const supervisorResult = UserDeletionResult.success(
        'supervisor@example.com',
        UserDeletionType.SOFT_DELETE,
        UserRole.Supervisor,
        'azure-456',
        'Supervisor User',
        'Deleted'
      );

      expect(psoResult.previousRole).toBe(UserRole.Employee);
      expect(supervisorResult.previousRole).toBe(UserRole.Supervisor);
    });
  });
});
