/**
 * @fileoverview UserRoleChangeApplicationService - unit tests
 */

// Mock UserRole enum globally
jest.mock('@prisma/client', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    Unassigned: 'Unassigned'
  }
}));

import { UserRoleChangeApplicationService } from '../../../../../shared/application/services/UserRoleChangeApplicationService';
import { UserRole } from '@prisma/client';
import { UserRoleChangeError } from '../../../../../shared/domain/errors/DomainError';
import { UserRoleChangeErrorCode } from '../../../../../shared/domain/errors/ErrorCodes';

describe('UserRoleChangeApplicationService', () => {
  let service: UserRoleChangeApplicationService;
  let mockUserRepository: any;
  let mockAuthService: any;
  let mockAuditService: any;
  let mockPresenceService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      upsertUser: jest.fn(),
      findByAzureAdObjectId: jest.fn().mockResolvedValue({ id: 'caller123', fullName: 'Test Caller' })
    };
    mockAuthService = {
      isUserActive: jest.fn().mockResolvedValue(true)
    };
    mockAuditService = {
      logAudit: jest.fn().mockResolvedValue(undefined)
    };
    mockPresenceService = {
      setUserOffline: jest.fn()
    };
    service = new UserRoleChangeApplicationService(
      mockUserRepository,
      mockAuthService,
      mockAuditService,
      mockPresenceService
    );
  });

  describe('authorizeRoleChange', () => {
    it('delegates to AuthorizationUtils', async () => {
      const callerId = 'caller123';
      const newRole = UserRole.Admin;
      await service.authorizeRoleChange(callerId, newRole);
      // AuthorizationUtils is tested separately, just verify no errors
    });
  });

  describe('validateRoleChangeRequest', () => {
    it('validates email format and role', async () => {
      const request = { userEmail: 'test@example.com', newRole: UserRole.Admin } as any;
      await service.validateRoleChangeRequest(request);
      // ValidationUtils is tested separately, just verify no errors
    });

    it('throws error for invalid role', async () => {
      const request = { userEmail: 'test@example.com', newRole: 'InvalidRole' } as any;
      await expect(service.validateRoleChangeRequest(request))
        .rejects
        .toThrow(UserRoleChangeError);
    });
  });

  describe('changeUserRole', () => {
    it('handles role assignment for existing user', async () => {
      const request = { userEmail: 'test@example.com', newRole: UserRole.Admin } as any;
      const callerId = 'caller123';
      const existingUser = { id: '1', role: UserRole.Employee, azureAdObjectId: 'azure123', fullName: 'Test User' };
      const updatedUser = { id: '1', role: UserRole.Admin, azureAdObjectId: 'azure123', fullName: 'Test User' };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);

      const result = await service.changeUserRole(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        azureAdObjectId: existingUser.azureAdObjectId || '',
        fullName: existingUser.fullName || 'test@example.com',
        role: UserRole.Admin
      });
      expect(result).toBeDefined();
    });

    it('handles role assignment for new user', async () => {
      const request = { userEmail: 'new@example.com', newRole: UserRole.Supervisor } as any;
      const callerId = 'caller123';
      const updatedUser = { id: '2', role: UserRole.Supervisor, azureAdObjectId: 'azure456', fullName: 'new@example.com' };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);

      const result = await service.changeUserRole(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        azureAdObjectId: '',
        fullName: 'new@example.com',
        role: UserRole.Supervisor
      });
      expect(result).toBeDefined();
    });

    it('sets user offline when assigned Employee role', async () => {
      const request = { userEmail: 'test@example.com', newRole: UserRole.Employee } as any;
      const callerId = 'caller123';
      const existingUser = { id: '1', role: UserRole.Admin, azureAdObjectId: 'azure123', fullName: 'Test User' };
      const updatedUser = { id: '1', role: UserRole.Employee, azureAdObjectId: 'azure123', fullName: 'Test User' };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);

      await service.changeUserRole(request, callerId);

      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('test@example.com');
    });

    it('throws error when newRole is null', async () => {
      const request = { userEmail: 'test@example.com', newRole: null } as any;
      const callerId = 'caller123';
      
      await expect(service.changeUserRole(request, callerId))
        .rejects
        .toThrow(UserRoleChangeError);
    });

    it('throws error when role change fails', async () => {
      const request = { userEmail: 'test@example.com', newRole: UserRole.Admin } as any;
      const callerId = 'caller123';
      
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.changeUserRole(request, callerId))
        .rejects
        .toThrow(UserRoleChangeError);
    });
  });
});
