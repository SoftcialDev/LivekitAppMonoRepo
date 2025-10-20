/**
 * @fileoverview UserRoleChangeResult value object - unit tests
 * @summary Tests for UserRoleChangeResult value object functionality
 * @description Validates result creation, factory methods, and utility functions
 */

import { UserRoleChangeResult } from '../../../../../shared/domain/value-objects/UserRoleChangeResult';
import { UserRole } from '../../../../../shared/domain/enums/UserRole';

describe('UserRoleChangeResult', () => {
  describe('constructor', () => {
    it('should create result with all properties', () => {
      const result = new UserRoleChangeResult(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        false,
        false,
        'azure-123',
        'John Doe'
      );

      expect(result.userEmail).toBe('user@example.com');
      expect(result.previousRole).toBe(UserRole.Employee);
      expect(result.newRole).toBe(UserRole.Supervisor);
      expect(result.userCreated).toBe(false);
      expect(result.userDeleted).toBe(false);
      expect(result.azureAdObjectId).toBe('azure-123');
      expect(result.displayName).toBe('John Doe');
    });

    it('should create result with null roles', () => {
      const result = new UserRoleChangeResult(
        'user@example.com',
        null,
        null,
        false,
        false,
        'azure-123',
        'John Doe'
      );

      expect(result.userEmail).toBe('user@example.com');
      expect(result.previousRole).toBeNull();
      expect(result.newRole).toBeNull();
      expect(result.userCreated).toBe(false);
      expect(result.userDeleted).toBe(false);
      expect(result.azureAdObjectId).toBe('azure-123');
      expect(result.displayName).toBe('John Doe');
    });

    it('should create result with user creation', () => {
      const result = new UserRoleChangeResult(
        'newuser@example.com',
        null,
        UserRole.Employee,
        true,
        false,
        'azure-456',
        'New User'
      );

      expect(result.userEmail).toBe('newuser@example.com');
      expect(result.previousRole).toBeNull();
      expect(result.newRole).toBe(UserRole.Employee);
      expect(result.userCreated).toBe(true);
      expect(result.userDeleted).toBe(false);
      expect(result.azureAdObjectId).toBe('azure-456');
      expect(result.displayName).toBe('New User');
    });

    it('should create result with user deletion', () => {
      const result = new UserRoleChangeResult(
        'deleteduser@example.com',
        UserRole.Supervisor,
        null,
        false,
        true,
        'azure-789',
        'Deleted User'
      );

      expect(result.userEmail).toBe('deleteduser@example.com');
      expect(result.previousRole).toBe(UserRole.Supervisor);
      expect(result.newRole).toBeNull();
      expect(result.userCreated).toBe(false);
      expect(result.userDeleted).toBe(true);
      expect(result.azureAdObjectId).toBe('azure-789');
      expect(result.displayName).toBe('Deleted User');
    });
  });

  describe('roleChanged factory method', () => {
    it('should create role change result', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe',
        false
      );

      expect(result.userEmail).toBe('user@example.com');
      expect(result.previousRole).toBe(UserRole.Employee);
      expect(result.newRole).toBe(UserRole.Supervisor);
      expect(result.userCreated).toBe(false);
      expect(result.userDeleted).toBe(false);
      expect(result.azureAdObjectId).toBe('azure-123');
      expect(result.displayName).toBe('John Doe');
    });

    it('should create role change result with default userCreated', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.userCreated).toBe(false);
    });

    it('should create role change result with userCreated true', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        true
      );

      expect(result.userCreated).toBe(true);
      expect(result.userDeleted).toBe(false);
    });

    it('should handle different role transitions', () => {
      const psoToSupervisor = UserRoleChangeResult.roleChanged(
        'user1@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-1',
        'User 1'
      );

      const supervisorToPso = UserRoleChangeResult.roleChanged(
        'user2@example.com',
        UserRole.Supervisor,
        UserRole.Employee,
        'azure-2',
        'User 2'
      );

      expect(psoToSupervisor.previousRole).toBe(UserRole.Employee);
      expect(psoToSupervisor.newRole).toBe(UserRole.Supervisor);
      expect(supervisorToPso.previousRole).toBe(UserRole.Supervisor);
      expect(supervisorToPso.newRole).toBe(UserRole.Employee);
    });
  });

  describe('userDeleted factory method', () => {
    it('should create user deletion result', () => {
      const result = UserRoleChangeResult.userDeleted(
        'user@example.com',
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.userEmail).toBe('user@example.com');
      expect(result.previousRole).toBe(UserRole.Supervisor);
      expect(result.newRole).toBeNull();
      expect(result.userCreated).toBe(false);
      expect(result.userDeleted).toBe(true);
      expect(result.azureAdObjectId).toBe('azure-123');
      expect(result.displayName).toBe('John Doe');
    });

    it('should handle deletion with null previous role', () => {
      const result = UserRoleChangeResult.userDeleted(
        'user@example.com',
        null,
        'azure-123',
        'John Doe'
      );

      expect(result.previousRole).toBeNull();
      expect(result.newRole).toBeNull();
      expect(result.userDeleted).toBe(true);
    });

    it('should handle deletion with different previous roles', () => {
      const psoDeletion = UserRoleChangeResult.userDeleted(
        'pso@example.com',
        UserRole.Employee,
        'azure-1',
        'PSO User'
      );

      const supervisorDeletion = UserRoleChangeResult.userDeleted(
        'supervisor@example.com',
        UserRole.Supervisor,
        'azure-2',
        'Supervisor User'
      );

      expect(psoDeletion.previousRole).toBe(UserRole.Employee);
      expect(supervisorDeletion.previousRole).toBe(UserRole.Supervisor);
    });
  });

  describe('getSummary', () => {
    it('should return deletion summary for deleted user', () => {
      const result = UserRoleChangeResult.userDeleted(
        'user@example.com',
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.getSummary()).toBe('user@example.com deleted');
    });

    it('should return creation summary for created user', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        true
      );

      expect(result.getSummary()).toBe('user@example.com created with role Employee');
    });

    it('should return role change summary for role change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.getSummary()).toBe('user@example.com role changed from Employee to Supervisor');
    });

    it('should return role change summary with null previous role', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.Employee,
        'azure-123',
        'John Doe'
      );

      expect(result.getSummary()).toBe('user@example.com role changed from none to Employee');
    });
  });

  describe('roleChanged', () => {
    it('should return true when role actually changed', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.roleChanged()).toBe(true);
    });

    it('should return false when role did not change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Employee,
        'azure-123',
        'John Doe'
      );

      expect(result.roleChanged()).toBe(false);
    });

    it('should return true when previous role is null and new role is not', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.Employee,
        'azure-123',
        'John Doe'
      );

      expect(result.roleChanged()).toBe(true);
    });

    it('should return true when previous role is not null and new role is null', () => {
      const result = new UserRoleChangeResult(
        'user@example.com',
        UserRole.Employee,
        null,
        false,
        false,
        'azure-123',
        'John Doe'
      );

      expect(result.roleChanged()).toBe(true);
    });
  });

  describe('getOperationType', () => {
    it('should return DELETE for deleted user', () => {
      const result = UserRoleChangeResult.userDeleted(
        'user@example.com',
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.getOperationType()).toBe('DELETE');
    });

    it('should return CREATE for created user', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.Employee,
        'azure-123',
        'John Doe',
        true
      );

      expect(result.getOperationType()).toBe('CREATE');
    });

    it('should return UPDATE for role change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.getOperationType()).toBe('UPDATE');
    });

    it('should return NO_CHANGE for no role change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Employee,
        'azure-123',
        'John Doe'
      );

      expect(result.getOperationType()).toBe('NO_CHANGE');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (result as any).userEmail = 'other@example.com';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (result as any).previousRole = UserRole.Supervisor;
      }).not.toThrow();

      expect(() => {
        (result as any).userCreated = true;
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email', () => {
      const result = UserRoleChangeResult.roleChanged(
        '',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.userEmail).toBe('');
    });

    it('should handle long display names', () => {
      const longName = 'A'.repeat(1000);
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        longName
      );

      expect(result.displayName).toBe(longName);
    });

    it('should handle special characters in email', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user+test@example-domain.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'John Doe'
      );

      expect(result.userEmail).toBe('user+test@example-domain.com');
    });

    it('should handle unicode characters in display name', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.Employee,
        UserRole.Supervisor,
        'azure-123',
        'José María'
      );

      expect(result.displayName).toBe('José María');
    });
  });

  describe('type safety', () => {
    it('should accept valid UserRole values', () => {
      const psoResult = UserRoleChangeResult.roleChanged(
        'pso@example.com',
        null,
        UserRole.Employee,
        'azure-1',
        'PSO User'
      );

      const supervisorResult = UserRoleChangeResult.roleChanged(
        'supervisor@example.com',
        null,
        UserRole.Supervisor,
        'azure-2',
        'Supervisor User'
      );

      expect(psoResult.newRole).toBe(UserRole.Employee);
      expect(supervisorResult.newRole).toBe(UserRole.Supervisor);
    });

    it('should handle null roles correctly', () => {
      const result = new UserRoleChangeResult(
        'user@example.com',
        null,
        null,
        false,
        false,
        'azure-123',
        'John Doe'
      );

      expect(result.previousRole).toBeNull();
      expect(result.newRole).toBeNull();
    });
  });
});
