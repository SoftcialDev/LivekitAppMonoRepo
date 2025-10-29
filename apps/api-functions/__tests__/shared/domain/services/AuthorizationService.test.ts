/**
 * @fileoverview AuthorizationService - unit tests
 */

// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);

import { AuthorizationService } from '../../../../shared/domain/services/AuthorizationService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { AuthError } from '../../../../shared/domain/errors/DomainError';
import { AuthErrorCode } from '../../../../shared/domain/errors/ErrorCodes';
import { UserRole } from '@prisma/client';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let userRepository: jest.Mocked<IUserRepository>;

  const callerId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = {
      hasAnyRole: jest.fn(),
      hasRole: jest.fn(),
      existsAndActive: jest.fn(),
      findByAzureAdObjectId: jest.fn(),
    } as any;

    service = new AuthorizationService(userRepository);
  });

  describe('capability checks', () => {
    it('canSendCommands authorizes Admin, Supervisor, SuperAdmin', async () => {
      userRepository.hasAnyRole.mockResolvedValue(true);
      await expect(service.canSendCommands(callerId)).resolves.toBe(true);
      expect(userRepository.hasAnyRole).toHaveBeenCalledWith(callerId, [UserRole.Admin, UserRole.Supervisor, UserRole.SuperAdmin]);
    });

    it('canManageUsers authorizes Admin, SuperAdmin, Supervisor', async () => {
      userRepository.hasAnyRole.mockResolvedValue(true);
      await expect(service.canManageUsers(callerId)).resolves.toBe(true);
      expect(userRepository.hasAnyRole).toHaveBeenCalledWith(callerId, [UserRole.Admin, UserRole.SuperAdmin, UserRole.Supervisor]);
    });

    it('canAccessAdmin authorizes only SuperAdmin', async () => {
      userRepository.hasRole.mockResolvedValue(true);
      await expect(service.canAccessAdmin(callerId)).resolves.toBe(true);
      expect(userRepository.hasRole).toHaveBeenCalledWith(callerId, UserRole.SuperAdmin);
    });

    it('canAccessSuperAdmin validates active and role', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.SuperAdmin, deletedAt: null } as any);
      await expect(service.canAccessSuperAdmin(callerId)).resolves.toBeUndefined();
    });

    it('canAccessEmployee allows Employee', async () => {
      userRepository.hasAnyRole.mockResolvedValue(true);
      await expect(service.canAccessEmployee(callerId)).resolves.toBe(true);
      expect(userRepository.hasAnyRole).toHaveBeenCalledWith(callerId, [UserRole.Employee]);
    });

    it('canAccessContactManager allows Employee or ContactManager', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.ContactManager, deletedAt: null } as any);
      await expect(service.canAccessContactManager(callerId)).resolves.toBeUndefined();
    });

    it('canAccessStreamingStatus allows Supervisor/Admin/SuperAdmin/ContactManager', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.Supervisor, deletedAt: null } as any);
      await expect(service.canAccessStreamingStatus(callerId)).resolves.toBeUndefined();
    });
  });

  describe('active checks', () => {
    it('isUserActive returns repository result', async () => {
      userRepository.existsAndActive.mockResolvedValue(true);
      await expect(service.isUserActive(callerId)).resolves.toBe(true);
      userRepository.existsAndActive.mockResolvedValue(false);
      await expect(service.isUserActive(callerId)).resolves.toBe(false);
    });
  });

  describe('authorizeUserWithRoles', () => {
    it('throws USER_NOT_FOUND when user is missing', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      await expect(service.authorizeUserWithRoles(callerId, [UserRole.Admin], 'op')).rejects.toEqual(
        new AuthError('User not found', AuthErrorCode.USER_NOT_FOUND)
      );
    });

    it('throws USER_NOT_FOUND when user is deleted', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', deletedAt: new Date() } as any);
      await expect(service.authorizeUserWithRoles(callerId, [UserRole.Admin], 'op')).rejects.toEqual(
        new AuthError('User is deleted', AuthErrorCode.USER_NOT_FOUND)
      );
    });

    it('throws INSUFFICIENT_PRIVILEGES when role not allowed', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.Employee, deletedAt: null } as any);
      await expect(service.authorizeUserWithRoles(callerId, [UserRole.Admin], 'op')).rejects.toEqual(
        new AuthError('Insufficient permissions for op', AuthErrorCode.INSUFFICIENT_PRIVILEGES)
      );
    });

    it('resolves when role allowed', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.Admin, deletedAt: null } as any);
      await expect(service.authorizeUserWithRoles(callerId, [UserRole.Admin], 'op')).resolves.toBeUndefined();
    });
  });

  describe('special helpers', () => {
    it('authorizeUserQuery requires Admin/Supervisor/SuperAdmin', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.Supervisor, deletedAt: null } as any);
      await expect(service.authorizeUserQuery(callerId)).resolves.toBeUndefined();
    });

    it('authorizeCommandAcknowledgment requires Employee', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: UserRole.Employee, deletedAt: null } as any);
      await expect(service.authorizeCommandAcknowledgment(callerId)).resolves.toBeUndefined();
    });

    it('isAdminOrSuperAdmin returns true for Admin or SuperAdmin', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: 'Admin' } as any);
      await expect(service.isAdminOrSuperAdmin(callerId)).resolves.toBe(true);
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: 'SuperAdmin' } as any);
      await expect(service.isAdminOrSuperAdmin(callerId)).resolves.toBe(true);
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: 'Employee' } as any);
      await expect(service.isAdminOrSuperAdmin(callerId)).resolves.toBe(false);
    });

    it('isSuperAdmin returns true only for SuperAdmin', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: 'SuperAdmin' } as any);
      await expect(service.isSuperAdmin(callerId)).resolves.toBe(true);
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: '1', role: 'Admin' } as any);
      await expect(service.isSuperAdmin(callerId)).resolves.toBe(false);
    });
  });
});


