import { UserRoleChangeResult } from '../../../src/domain/value-objects/UserRoleChangeResult';
import { UserRole } from '@prisma/client';

describe('UserRoleChangeResult', () => {
  describe('roleChanged with userCreated', () => {
    it('should create result for user creation', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.PSO,
        'azure-id',
        'User Name',
        true // userCreated = true
      );

      expect(result.userEmail).toBe('user@example.com');
      expect(result.previousRole).toBeNull();
      expect(result.newRole).toBe(UserRole.PSO);
      expect(result.userDeleted).toBe(false);
      expect(result.userCreated).toBe(true);
      expect(result.azureAdObjectId).toBe('azure-id');
      expect(result.displayName).toBe('User Name');
    });
  });

  describe('getSummary', () => {
    it('should return summary for deleted user', () => {
      const result = UserRoleChangeResult.userDeleted(
        'user@example.com',
        UserRole.PSO,
        'azure-id',
        'User Name'
      );
      expect(result.getSummary()).toBe('user@example.com deleted');
    });

    it('should return summary for created user', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.PSO,
        'azure-id',
        'User Name',
        true // userCreated = true
      );
      expect(result.getSummary()).toContain('user@example.com created with role');
      expect(result.getSummary()).toContain('PSO');
    });

    it('should return summary for role change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.PSO,
        UserRole.Supervisor,
        'azure-id',
        'User Name'
      );
      expect(result.getSummary()).toContain('role changed from PSO to Supervisor');
    });
  });

  describe('roleChanged', () => {
    it('should return true when role changed', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.PSO,
        UserRole.Supervisor,
        'azure-id',
        'User Name'
      );
      expect(result.roleChanged()).toBe(true);
    });

    it('should return false when role did not change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.PSO,
        UserRole.PSO,
        'azure-id',
        'User Name'
      );
      expect(result.roleChanged()).toBe(false);
    });
  });

  describe('getOperationType', () => {
    it('should return DELETE for deleted user', () => {
      const result = UserRoleChangeResult.userDeleted(
        'user@example.com',
        UserRole.PSO,
        'azure-id',
        'User Name'
      );
      expect(result.getOperationType()).toBe('DELETE');
    });

    it('should return CREATE for created user', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        null,
        UserRole.PSO,
        'azure-id',
        'User Name',
        true // userCreated = true
      );
      expect(result.getOperationType()).toBe('CREATE');
    });

    it('should return UPDATE when role changed', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.PSO,
        UserRole.Supervisor,
        'azure-id',
        'User Name'
      );
      expect(result.getOperationType()).toBe('UPDATE');
    });

    it('should return NO_CHANGE when role did not change', () => {
      const result = UserRoleChangeResult.roleChanged(
        'user@example.com',
        UserRole.PSO,
        UserRole.PSO,
        'azure-id',
        'User Name'
      );
      expect(result.getOperationType()).toBe('NO_CHANGE');
    });
  });
});

