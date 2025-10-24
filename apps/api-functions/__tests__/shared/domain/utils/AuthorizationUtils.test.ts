/**
 * @fileoverview Tests for AuthorizationUtils
 * @description Tests for authorization utilities
 */

import { AuthorizationUtils } from '../../../../shared/domain/utils/AuthorizationUtils';
import { IAuthorizationService } from '../../../../shared/domain/interfaces/IAuthorizationService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { AuthError } from '../../../../shared/domain/errors/DomainError';
import { AuthErrorCode } from '../../../../shared/domain/errors/ErrorCodes';
import { UserRole } from '../../../../shared/domain/enums/UserRole';
import { User } from '../../../../shared/domain/entities/User';

describe('AuthorizationUtils', () => {
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockAuthorizationService = {
      isUserActive: jest.fn(),
      canSendCommands: jest.fn(),
      canManageUsers: jest.fn(),
      canAccessAdmin: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;
  });

  describe('validateCallerAuthorization', () => {
    it('should validate caller authorization successfully', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when caller ID is empty', async () => {
      // Act & Assert
      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, '')
      ).rejects.toThrow(new AuthError('Caller ID not found', AuthErrorCode.CALLER_ID_NOT_FOUND));
    });

    it('should throw error when user is inactive', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCallerAuthorization(mockAuthorizationService, callerId)
      ).rejects.toThrow(new AuthError('User not found or inactive', AuthErrorCode.USER_NOT_FOUND));
    });
  });

  describe('validateCanSendCommands', () => {
    it('should validate can send commands successfully', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when user cannot send commands', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canSendCommands.mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanSendCommands(mockAuthorizationService, callerId)
      ).rejects.toThrow(new AuthError('Insufficient privileges to send commands', AuthErrorCode.INSUFFICIENT_PRIVILEGES));
    });
  });

  describe('validateCanManageUsers', () => {
    it('should validate can manage users successfully', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canManageUsers.mockResolvedValue(true);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when user cannot manage users', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canManageUsers.mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanManageUsers(mockAuthorizationService, callerId)
      ).rejects.toThrow(new AuthError('Insufficient privileges to manage users', AuthErrorCode.INSUFFICIENT_PRIVILEGES));
    });
  });

  describe('validateCanAccessAdmin', () => {
    it('should validate can access admin successfully', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canAccessAdmin.mockResolvedValue(true);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canAccessAdmin).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when user cannot access admin', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canAccessAdmin.mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanAccessAdmin(mockAuthorizationService, callerId)
      ).rejects.toThrow(new AuthError('Insufficient privileges to access admin functions', AuthErrorCode.INSUFFICIENT_PRIVILEGES));
    });
  });

  describe('validateCanChangeRoles', () => {
    it('should validate can change roles successfully', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const newRole = UserRole.Employee;
      const caller = { id: 'user-123', role: UserRole.Admin } as User;

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanChangeRoles(
          mockAuthorizationService,
          callerId,
          newRole,
          mockUserRepository
        )
      ).resolves.not.toThrow();

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when caller is not found', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const newRole = UserRole.Employee;

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanChangeRoles(
          mockAuthorizationService,
          callerId,
          newRole,
          mockUserRepository
        )
      ).rejects.toThrow(new AuthError('Caller not found', AuthErrorCode.USER_NOT_FOUND));
    });

    it('should throw error when supervisor tries to assign non-employee role', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const newRole = UserRole.Admin;
      const caller = { id: 'user-123', role: UserRole.Supervisor } as User;

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanChangeRoles(
          mockAuthorizationService,
          callerId,
          newRole,
          mockUserRepository
        )
      ).rejects.toThrow(new AuthError('Supervisors may only assign Employee role', AuthErrorCode.INSUFFICIENT_PRIVILEGES));
    });

    it('should throw error when non-admin tries to delete user', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const newRole = null;
      const caller = { id: 'user-123', role: UserRole.Supervisor } as User;

      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act & Assert
      await expect(
        AuthorizationUtils.validateCanChangeRoles(
          mockAuthorizationService,
          callerId,
          newRole,
          mockUserRepository
        )
      ).rejects.toThrow(new AuthError('Only Admins can delete users', AuthErrorCode.INSUFFICIENT_PRIVILEGES));
    });
  });
});
