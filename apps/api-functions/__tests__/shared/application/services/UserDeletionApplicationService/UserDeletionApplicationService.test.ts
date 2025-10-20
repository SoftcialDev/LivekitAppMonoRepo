/**
 * @fileoverview UserDeletionApplicationService - unit tests
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

import { UserDeletionApplicationService } from '../../../../../shared/application/services/UserDeletionApplicationService';
import { UserRole } from '@prisma/client';
import { UserDeletionType } from '../../../../../shared/domain/enums/UserDeletionType';
import { UserDeletionError } from '../../../../../shared/domain/errors/DomainError';
import { UserDeletionErrorCode } from '../../../../../shared/domain/errors/ErrorCodes';

describe('UserDeletionApplicationService', () => {
  let service: UserDeletionApplicationService;
  let mockUserRepository: any;
  let mockAuthService: any;
  let mockAuditService: any;
  let mockPresenceService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      changeUserRole: jest.fn(),
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
    service = new UserDeletionApplicationService(
      mockUserRepository,
      mockAuthService,
      mockAuditService,
      mockPresenceService
    );
  });

  describe('authorizeUserDeletion', () => {
    it('delegates to AuthorizationUtils', async () => {
      const callerId = 'caller123';
      await service.authorizeUserDeletion(callerId);
      // AuthorizationUtils is tested separately, just verify no errors
    });
  });

  describe('validateDeletionRequest', () => {
    it('validates email format and deletion type', async () => {
      const request = { userEmail: 'test@example.com', deletionType: UserDeletionType.SOFT_DELETE } as any;
      await service.validateDeletionRequest(request);
      // ValidationUtils is tested separately, just verify no errors
    });

    it('throws error for invalid deletion type', async () => {
      const request = { userEmail: 'test@example.com', deletionType: 'InvalidType' } as any;
      await expect(service.validateDeletionRequest(request))
        .rejects
        .toThrow(UserDeletionError);
    });
  });

  describe('deleteUser', () => {
    it('handles soft delete for existing user', async () => {
      const request = { userEmail: 'test@example.com', deletionType: UserDeletionType.SOFT_DELETE } as any;
      const callerId = 'caller123';
      const existingUser = { id: '1', role: UserRole.Admin, azureAdObjectId: 'azure123', fullName: 'Test User' };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      const result = await service.deleteUser(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('1', UserRole.Unassigned);
      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeDefined();
    });

    it('throws error when user not found', async () => {
      const request = { userEmail: 'test@example.com', deletionType: UserDeletionType.SOFT_DELETE } as any;
      const callerId = 'caller123';
      
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.deleteUser(request, callerId))
        .rejects
        .toThrow(UserDeletionError);
    });

    it('throws error when user already unassigned', async () => {
      const request = { userEmail: 'test@example.com', deletionType: UserDeletionType.SOFT_DELETE } as any;
      const callerId = 'caller123';
      const existingUser = { id: '1', role: UserRole.Unassigned };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.deleteUser(request, callerId))
        .rejects
        .toThrow(UserDeletionError);
    });

    it('throws error when deletion fails', async () => {
      const request = { userEmail: 'test@example.com', deletionType: UserDeletionType.SOFT_DELETE } as any;
      const callerId = 'caller123';
      
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteUser(request, callerId))
        .rejects
        .toThrow(UserDeletionError);
    });
  });
});
