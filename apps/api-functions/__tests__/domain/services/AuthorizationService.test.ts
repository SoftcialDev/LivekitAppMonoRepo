import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { Permission } from '../../../src/domain/enums/Permission';
import { AuthError } from '../../../src/domain/errors/DomainError';
import { AuthErrorCode } from '../../../src/domain/errors/ErrorCodes';
import { createMockUserRepository, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    service = new AuthorizationService(mockUserRepository);
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;

      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.UsersRead]);

      const result = await service.hasPermission(callerId, permission);

      expect(result).toBe(true);
      expect(mockUserRepository.getEffectivePermissionCodesByAzureId).toHaveBeenCalledWith(callerId);
    });

    it('should return false when user does not have the permission', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;

      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.SnapshotsRead]);

      const result = await service.hasPermission(callerId, permission);

      expect(result).toBe(false);
    });

    it('should return false when callerId is empty', async () => {
      const callerId = '';
      const permission = Permission.UsersRead;

      const result = await service.hasPermission(callerId, permission);

      expect(result).toBe(false);
      expect(mockUserRepository.getEffectivePermissionCodesByAzureId).not.toHaveBeenCalled();
    });

    it('should return false when callerId is null', async () => {
      const callerId = null as any;
      const permission = Permission.UsersRead;

      const result = await service.hasPermission(callerId, permission);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has any of the permissions', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];

      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.UsersRead]);

      const result = await service.hasAnyPermission(callerId, permissions);

      expect(result).toBe(true);
    });

    it('should return false when user does not have any of the permissions', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];

      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.RecordingsRead]);

      const result = await service.hasAnyPermission(callerId, permissions);

      expect(result).toBe(false);
    });

    it('should return false when callerId is empty', async () => {
      const callerId = '';
      const permissions = [Permission.UsersRead];

      const result = await service.hasAnyPermission(callerId, permissions);

      expect(result).toBe(false);
    });

    it('should return false when permissions array is empty', async () => {
      const callerId = 'caller-id';
      const permissions: Permission[] = [];

      const result = await service.hasAnyPermission(callerId, permissions);

      expect(result).toBe(false);
      expect(mockUserRepository.getEffectivePermissionCodesByAzureId).not.toHaveBeenCalled();
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];

      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([
        Permission.UsersRead,
        Permission.SnapshotsRead,
      ]);

      const result = await service.hasAllPermissions(callerId, permissions);

      expect(result).toBe(true);
    });

    it('should return false when user does not have all permissions', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];

      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.UsersRead]);

      const result = await service.hasAllPermissions(callerId, permissions);

      expect(result).toBe(false);
    });

    it('should return false when callerId is empty', async () => {
      const callerId = '';
      const permissions = [Permission.UsersRead];

      const result = await service.hasAllPermissions(callerId, permissions);

      expect(result).toBe(false);
    });
  });

  describe('authorizePermission', () => {
    it('should not throw when user has the permission', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.UsersRead]);

      await expect(service.authorizePermission(callerId, permission)).resolves.not.toThrow();
    });

    it('should throw AuthError when user does not have the permission', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      await expect(service.authorizePermission(callerId, permission)).rejects.toThrow(AuthError);
      await expect(service.authorizePermission(callerId, permission)).rejects.toThrow('Insufficient permissions');
    });

    it('should include operation name in error message', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;
      const operationName = 'read users';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      await expect(service.authorizePermission(callerId, permission, operationName)).rejects.toThrow(
        'Insufficient permissions for read users'
      );
    });

    it('should throw AuthError when user is not found', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.authorizePermission(callerId, permission)).rejects.toThrow(AuthError);
      await expect(service.authorizePermission(callerId, permission)).rejects.toThrow('User not found');
    });

    it('should throw AuthError when user is deleted', async () => {
      const callerId = 'caller-id';
      const permission = Permission.UsersRead;
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.PSO,
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizePermission(callerId, permission)).rejects.toThrow(AuthError);
      await expect(service.authorizePermission(callerId, permission)).rejects.toThrow('User is deleted');
    });
  });

  describe('authorizeAnyPermission', () => {
    it('should not throw when user has any of the permissions', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([Permission.UsersRead]);

      await expect(service.authorizeAnyPermission(callerId, permissions)).resolves.not.toThrow();
    });

    it('should throw AuthError when user does not have any of the permissions', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      await expect(service.authorizeAnyPermission(callerId, permissions)).rejects.toThrow(AuthError);
      await expect(service.authorizeAnyPermission(callerId, permissions)).rejects.toThrow('Insufficient permissions');
    });

    it('should include operation name in error message', async () => {
      const callerId = 'caller-id';
      const permissions = [Permission.UsersRead, Permission.SnapshotsRead];
      const operationName = 'read data';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      await expect(service.authorizeAnyPermission(callerId, permissions, operationName)).rejects.toThrow(
        'Insufficient permissions for read data'
      );
    });
  });

  describe('canSendCommands', () => {
    it('should return true for Admin role', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasAnyRole.mockResolvedValue(true);

      const result = await service.canSendCommands(callerId);

      expect(result).toBe(true);
      expect(mockUserRepository.hasAnyRole).toHaveBeenCalledWith(callerId, [
        UserRole.Admin,
        UserRole.Supervisor,
        UserRole.SuperAdmin,
      ]);
    });

    it('should return false when user does not have required role', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasAnyRole.mockResolvedValue(false);

      const result = await service.canSendCommands(callerId);

      expect(result).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should return true for Admin role', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasAnyRole.mockResolvedValue(true);

      const result = await service.canManageUsers(callerId);

      expect(result).toBe(true);
      expect(mockUserRepository.hasAnyRole).toHaveBeenCalledWith(callerId, [
        UserRole.Admin,
        UserRole.SuperAdmin,
        UserRole.Supervisor,
      ]);
    });

    it('should return false when user does not have required role', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasAnyRole.mockResolvedValue(false);

      const result = await service.canManageUsers(callerId);

      expect(result).toBe(false);
    });
  });

  describe('canAccessAdmin', () => {
    it('should return true for SuperAdmin role', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasRole.mockResolvedValue(true);

      const result = await service.canAccessAdmin(callerId);

      expect(result).toBe(true);
      expect(mockUserRepository.hasRole).toHaveBeenCalledWith(callerId, UserRole.SuperAdmin);
    });

    it('should return false when user is not SuperAdmin', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasRole.mockResolvedValue(false);

      const result = await service.canAccessAdmin(callerId);

      expect(result).toBe(false);
    });
  });

  describe('canAccessSuperAdmin', () => {
    it('should not throw for SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessSuperAdmin(callerId)).resolves.not.toThrow();
    });

    it('should throw AuthError for non-SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessSuperAdmin(callerId)).rejects.toThrow(AuthError);
      await expect(service.canAccessSuperAdmin(callerId)).rejects.toThrow('Insufficient permissions');
    });

    it('should throw AuthError when user is not found', async () => {
      const callerId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.canAccessSuperAdmin(callerId)).rejects.toThrow(AuthError);
    });
  });

  describe('canAccessPSO', () => {
    it('should return true for PSO role', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasAnyRole.mockResolvedValue(true);

      const result = await service.canAccessPSO(callerId);

      expect(result).toBe(true);
      expect(mockUserRepository.hasAnyRole).toHaveBeenCalledWith(callerId, [UserRole.PSO]);
    });

    it('should return false when user is not PSO', async () => {
      const callerId = 'caller-id';

      mockUserRepository.hasAnyRole.mockResolvedValue(false);

      const result = await service.canAccessPSO(callerId);

      expect(result).toBe(false);
    });
  });

  describe('canAccessContactManager', () => {
    it('should not throw for PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessContactManager(callerId)).resolves.not.toThrow();
    });

    it('should not throw for ContactManager role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.ContactManager,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessContactManager(callerId)).resolves.not.toThrow();
    });

    it('should throw AuthError for other roles', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessContactManager(callerId)).rejects.toThrow(AuthError);
      await expect(service.canAccessContactManager(callerId)).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('canAccessStreamingStatus', () => {
    it('should not throw for SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessStreamingStatus(callerId)).resolves.not.toThrow();
    });

    it('should not throw for Admin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessStreamingStatus(callerId)).resolves.not.toThrow();
    });

    it('should not throw for Supervisor role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Supervisor });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessStreamingStatus(callerId)).resolves.not.toThrow();
    });

    it('should not throw for ContactManager role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.ContactManager,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessStreamingStatus(callerId)).resolves.not.toThrow();
    });

    it('should throw AuthError for PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.canAccessStreamingStatus(callerId)).rejects.toThrow(AuthError);
    });

    it('should throw AuthError when user is not found', async () => {
      const callerId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.canAccessStreamingStatus(callerId)).rejects.toThrow(AuthError);
    });
  });

  describe('isUserActive', () => {
    it('should return true when user exists and is active', async () => {
      const callerId = 'caller-id';

      mockUserRepository.existsAndActive.mockResolvedValue(true);

      const result = await service.isUserActive(callerId);

      expect(result).toBe(true);
      expect(mockUserRepository.existsAndActive).toHaveBeenCalledWith(callerId);
    });

    it('should return false when user does not exist or is inactive', async () => {
      const callerId = 'caller-id';

      mockUserRepository.existsAndActive.mockResolvedValue(false);

      const result = await service.isUserActive(callerId);

      expect(result).toBe(false);
    });
  });

  describe('authorizeUserWithRoles', () => {
    it('should not throw when user has one of the allowed roles', async () => {
      const callerId = 'caller-id';
      const allowedRoles = [UserRole.Admin, UserRole.SuperAdmin];
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'test operation')).resolves.not.toThrow();
    });

    it('should throw AuthError when user does not have any of the allowed roles', async () => {
      const callerId = 'caller-id';
      const allowedRoles = [UserRole.Admin, UserRole.SuperAdmin];
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'test operation')).rejects.toThrow(AuthError);
      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'test operation')).rejects.toThrow(
        'Insufficient permissions for test operation'
      );
    });

    it('should throw AuthError when user is not found', async () => {
      const callerId = 'caller-id';
      const allowedRoles = [UserRole.Admin];

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'test operation')).rejects.toThrow(AuthError);
    });

    it('should throw AuthError when user is deleted', async () => {
      const callerId = 'caller-id';
      const allowedRoles = [UserRole.Admin];
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.Admin,
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'test operation')).rejects.toThrow(AuthError);
    });
  });

  describe('authorizeUserQuery', () => {
    it('should not throw for Admin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserQuery(callerId)).resolves.not.toThrow();
    });

    it('should not throw for Supervisor role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Supervisor });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserQuery(callerId)).resolves.not.toThrow();
    });

    it('should not throw for SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserQuery(callerId)).resolves.not.toThrow();
    });

    it('should throw AuthError for PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserQuery(callerId)).rejects.toThrow(AuthError);
    });
  });

  describe('authorizeCommandAcknowledgment', () => {
    it('should not throw for PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeCommandAcknowledgment(callerId)).resolves.not.toThrow();
    });

    it('should throw AuthError for non-PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeCommandAcknowledgment(callerId)).rejects.toThrow(AuthError);
      await expect(service.authorizeCommandAcknowledgment(callerId)).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('isAdminOrSuperAdmin', () => {
    it('should return true for Admin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      const result = await service.isAdminOrSuperAdmin(callerId);

      expect(result).toBe(true);
    });

    it('should return true for SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      const result = await service.isAdminOrSuperAdmin(callerId);

      expect(result).toBe(true);
    });

    it('should return false for PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      const result = await service.isAdminOrSuperAdmin(callerId);

      expect(result).toBe(false);
    });

    it('should return false when user is not found', async () => {
      const callerId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      const result = await service.isAdminOrSuperAdmin(callerId);

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      const result = await service.isSuperAdmin(callerId);

      expect(result).toBe(true);
    });

    it('should return false for Admin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      const result = await service.isSuperAdmin(callerId);

      expect(result).toBe(false);
    });

    it('should return false when user is not found', async () => {
      const callerId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      const result = await service.isSuperAdmin(callerId);

      expect(result).toBe(false);
    });
  });

  describe('authorizeAdminOrSuperAdmin', () => {
    it('should not throw for Admin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.Admin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeAdminOrSuperAdmin(callerId)).resolves.not.toThrow();
    });

    it('should not throw for SuperAdmin role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeAdminOrSuperAdmin(callerId)).resolves.not.toThrow();
    });

    it('should throw AuthError for PSO role', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, role: UserRole.PSO });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeAdminOrSuperAdmin(callerId)).rejects.toThrow(AuthError);
      await expect(service.authorizeAdminOrSuperAdmin(callerId)).rejects.toThrow('Insufficient permissions');
    });

    it('should throw AuthError when user is not found', async () => {
      const callerId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.authorizeAdminOrSuperAdmin(callerId)).rejects.toThrow(AuthError);
    });
  });

  describe('validateUserActive', () => {
    it('should throw AuthError when user is not found in validateUserWithRoles', async () => {
      const callerId = 'caller-id';
      const allowedRoles = [UserRole.Admin];

      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(null);

      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'operation')).rejects.toThrow(AuthError);
      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'operation')).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw AuthError when user is deleted in validateUserWithRoles', async () => {
      const callerId = 'caller-id';
      const allowedRoles = [UserRole.Admin];
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.Admin,
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'operation')).rejects.toThrow(AuthError);
      await expect(service.authorizeUserWithRoles(callerId, allowedRoles, 'operation')).rejects.toThrow(
        'User is deleted'
      );
    });
  });
});

