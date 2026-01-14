import { SuperAdminDomainService } from '../../../src/domain/services/SuperAdminDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { CreateSuperAdminRequest } from '../../../src/domain/value-objects/CreateSuperAdminRequest';
import { DeleteSuperAdminRequest } from '../../../src/domain/value-objects/DeleteSuperAdminRequest';
import { SuperAdminListResponse } from '../../../src/domain/value-objects/SuperAdminListResponse';
import { SuperAdminUserNotFoundError, SuperAdminInvalidRoleError } from '../../../src/domain/errors/SuperAdminErrors';
import { createMockUserRepository, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';
import { SuperAdminProfile } from '../../../src/domain/entities/SuperAdminProfile';

describe('SuperAdminDomainService', () => {
  let service: SuperAdminDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    service = new SuperAdminDomainService(mockUserRepository);
  });

  describe('createSuperAdmin', () => {
    it('should create Super Admin successfully', async () => {
      const request = new CreateSuperAdminRequest('user@example.com');
      const mockUser = createMockUser({ id: 'user-id', email: 'user@example.com', role: UserRole.PSO });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.createSuperAdminAuditLog.mockResolvedValue(undefined);

      const result = await service.createSuperAdmin(request);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.SuperAdmin);
      expect(mockUserRepository.createSuperAdminAuditLog).toHaveBeenCalled();
      expect(result).toBeInstanceOf(SuperAdminProfile);
      expect(result.userId).toBe('user-id');
    });

    it('should throw SuperAdminUserNotFoundError when user not found', async () => {
      const request = new CreateSuperAdminRequest('notfound@example.com');
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.createSuperAdmin(request)).rejects.toThrow(SuperAdminUserNotFoundError);
    });
  });

  describe('deleteSuperAdmin', () => {
    it('should delete Super Admin successfully with direct ID', async () => {
      const request = new DeleteSuperAdminRequest('user-id');
      const mockUser = createMockUser({ id: 'user-id', role: UserRole.SuperAdmin });
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.createSuperAdminAuditLog.mockResolvedValue(undefined);

      await service.deleteSuperAdmin(request);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.Unassigned);
      expect(mockUserRepository.createSuperAdminAuditLog).toHaveBeenCalled();
    });

    it('should delete Super Admin successfully with composite ID', async () => {
      const request = new DeleteSuperAdminRequest('superadmin-user-id');
      const mockUser = createMockUser({ id: 'user-id', role: UserRole.SuperAdmin });
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.createSuperAdminAuditLog.mockResolvedValue(undefined);

      await service.deleteSuperAdmin(request);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
    });

    it('should throw SuperAdminUserNotFoundError when user not found', async () => {
      const request = new DeleteSuperAdminRequest('non-existent');
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);
      mockUserRepository.findAllSuperAdmins.mockResolvedValue([]);
      mockUserRepository.findAllUsers.mockResolvedValue([]);

      await expect(service.deleteSuperAdmin(request)).rejects.toThrow(SuperAdminUserNotFoundError);
    });

    it('should throw SuperAdminInvalidRoleError when user is not Super Admin', async () => {
      const request = new DeleteSuperAdminRequest('user-id');
      const mockUser = createMockUser({ id: 'user-id', role: UserRole.PSO });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(service.deleteSuperAdmin(request)).rejects.toThrow(SuperAdminInvalidRoleError);
    });
  });

  describe('listSuperAdmins', () => {
    it('should list all Super Admins', async () => {
      const mockProfiles = [
        new SuperAdminProfile('superadmin-1', 'user-1', new Date(), new Date()),
        new SuperAdminProfile('superadmin-2', 'user-2', new Date(), new Date()),
      ];
      mockUserRepository.findAllSuperAdmins.mockResolvedValue(mockProfiles);

      const result = await service.listSuperAdmins();

      expect(mockUserRepository.findAllSuperAdmins).toHaveBeenCalled();
      expect(result).toBeInstanceOf(SuperAdminListResponse);
    });
  });
});

