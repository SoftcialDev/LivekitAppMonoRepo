import { AuthorizationUtils } from '../../../src/domain/utils/AuthorizationUtils';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { AuthError } from '../../../src/domain/errors/DomainError';
import { AuthErrorCode } from '../../../src/domain/errors/ErrorCodes';
import { createMockUserRepository, createMockUser } from '../services/domainServiceTestSetup';
import { UserRole } from '@prisma/client';
import { RoleValidationUtils } from '../../../src/domain/utils/RoleValidationUtils';

describe('AuthorizationUtils', () => {
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockAuthorizationService = {
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      authorizePermission: jest.fn(),
      authorizeAnyPermission: jest.fn(),
      canSendCommands: jest.fn(),
      authorizeUserQuery: jest.fn(),
      canManageUsers: jest.fn(),
      canAccessAdmin: jest.fn(),
      isUserActive: jest.fn(),
      authorizeCommandAcknowledgment: jest.fn(),
      canAccessStreamingStatus: jest.fn(),
      authorizeAdminOrSuperAdmin: jest.fn(),
    } as any;

    mockUserRepository = createMockUserRepository();
  });

  describe('validateCallerAuthorization', () => {
    it('should not throw when callerId is valid and user is active', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId, 'test operation')
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
    });

    it('should throw AuthError when callerId is empty', async () => {
      const callerId = '';

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).rejects.toThrow(AuthError);

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).rejects.toThrow('Caller ID not found');
    });

    it('should throw AuthError when callerId is null', async () => {
      const callerId = null as any;

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).rejects.toThrow(AuthError);
    });

    it('should throw AuthError when user is not active', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).rejects.toThrow(AuthError);

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).rejects.toThrow('User not found or inactive');
    });

    it('should use default operation name when not provided', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);

      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).resolves.not.toThrow();
    });
  });

  describe('validateCanSendCommands', () => {
    it('should not throw when caller can send commands', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      await expect(AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
    });

    it('should throw AuthError when caller cannot send commands', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canSendCommands.mockResolvedValue(false);

      await expect(AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );

      await expect(AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)).rejects.toThrow(
        'Insufficient privileges to send commands'
      );
    });

    it('should throw AuthError when callerId is empty', async () => {
      const callerId = '';

      await expect(AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );
    });

    it('should throw AuthError when user is not active', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      await expect(AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );
    });
  });

  describe('validateCanManageUsers', () => {
    it('should not throw when caller can manage users', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canManageUsers.mockResolvedValue(true);

      await expect(AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
    });

    it('should throw AuthError when caller cannot manage users', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canManageUsers.mockResolvedValue(false);

      await expect(AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );

      await expect(AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)).rejects.toThrow(
        'Insufficient privileges to manage users'
      );
    });

    it('should throw AuthError when callerId is empty', async () => {
      const callerId = '';

      await expect(AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );
    });

    it('should throw AuthError when user is not active', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      await expect(AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );
    });
  });

  describe('validateCanAccessAdmin', () => {
    it('should not throw when caller can access admin', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);

      await expect(AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canAccessAdmin).toHaveBeenCalledWith(callerId);
    });

    it('should throw AuthError when caller cannot access admin', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canAccessAdmin.mockResolvedValue(false);

      await expect(AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );

      await expect(AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)).rejects.toThrow(
        'Insufficient privileges to access admin functions'
      );
    });

    it('should throw AuthError when callerId is empty', async () => {
      const callerId = '';

      await expect(AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );
    });

    it('should throw AuthError when user is not active', async () => {
      const callerId = 'caller-id';

      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      await expect(AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)).rejects.toThrow(
        AuthError
      );
    });
  });

  describe('validateCanChangeRoles', () => {
    it('should not throw when caller can change roles and assignment is valid', async () => {
      const callerId = 'caller-id';
      const newRole = UserRole.PSO;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
    });

    it('should throw AuthError when callerId is empty', async () => {
      const callerId = '';
      const newRole = UserRole.PSO;

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow(AuthError);
    });

    it('should throw AuthError when caller is not found', async () => {
      const callerId = 'caller-id';
      const newRole = UserRole.PSO;

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow(AuthError);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow('Caller not found');
    });

    it('should throw AuthError when Supervisor tries to assign non-PSO role', async () => {
      const callerId = 'caller-id';
      const newRole = UserRole.Admin;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.Supervisor });

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow(AuthError);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow('Supervisors may only assign PSO role');
    });

    it('should not throw when Supervisor tries to assign PSO role', async () => {
      const callerId = 'caller-id';
      const newRole = UserRole.PSO;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.Supervisor });

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).resolves.not.toThrow();
    });

    it('should throw when Supervisor tries to delete user (null role)', async () => {
      const callerId = 'caller-id';
      const newRole = null;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.Supervisor });

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow('Only Admins can delete users');
    });

    it('should throw AuthError when non-Admin tries to delete user', async () => {
      const callerId = 'caller-id';
      const newRole = null;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.Supervisor });

      jest.spyOn(RoleValidationUtils, 'isValidRoleAssignment').mockReturnValue(false);
      jest.spyOn(RoleValidationUtils, 'canManageUsers').mockReturnValue(false);

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow(AuthError);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow('Only Admins can delete users');
    });

    it('should not throw when Admin tries to delete user', async () => {
      const callerId = 'caller-id';
      const newRole = null;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.Admin });

      jest.spyOn(RoleValidationUtils, 'isValidRoleAssignment').mockReturnValue(true);

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).resolves.not.toThrow();
    });

    it('should not throw when SuperAdmin tries to delete user', async () => {
      const callerId = 'caller-id';
      const newRole = null;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.SuperAdmin });

      jest.spyOn(RoleValidationUtils, 'isValidRoleAssignment').mockReturnValue(true);

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).resolves.not.toThrow();
    });

    it('should not throw when assignment is valid via RoleValidationUtils', async () => {
      const callerId = 'caller-id';
      const newRole = UserRole.PSO;
      const caller = createMockUser({ id: 'caller-id', azureAdObjectId: callerId, role: UserRole.Admin });

      jest.spyOn(RoleValidationUtils, 'isValidRoleAssignment').mockReturnValue(true);

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).resolves.not.toThrow();
    });

    it('should throw AuthError when user is not active', async () => {
      const callerId = 'caller-id';
      const newRole = UserRole.PSO;

      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      await expect(
        AuthorizationUtils.validateCanChangeRoles(mockAuthorizationService, callerId, newRole, mockUserRepository)
      ).rejects.toThrow(AuthError);
    });
  });
});

