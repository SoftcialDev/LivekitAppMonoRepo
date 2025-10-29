// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);

import { SuperAdminDomainService } from '../../../../shared/domain/services/SuperAdminDomainService';
import { CreateSuperAdminRequest } from '../../../../shared/domain/value-objects/CreateSuperAdminRequest';
import { DeleteSuperAdminRequest } from '../../../../shared/domain/value-objects/DeleteSuperAdminRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { UserRole } from '@prisma/client';

describe('SuperAdminDomainService', () => {
  let service: SuperAdminDomainService;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByEmail: jest.fn(), changeUserRole: jest.fn(), createSuperAdminAuditLog: jest.fn(), findById: jest.fn(), findByAzureAdObjectId: jest.fn(), findAllSuperAdmins: jest.fn() } as any;
    service = new SuperAdminDomainService(userRepository);
  });

  describe('createSuperAdmin', () => {
    it('should create super admin successfully', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      const request = new CreateSuperAdminRequest('admin@example.com');
      const result = await service.createSuperAdmin(request);
      expect(userRepository.changeUserRole).toHaveBeenCalledWith('user-123', UserRole.SuperAdmin);
      expect(result.userId).toBe('user-123');
    });

    it('should throw error when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const request = new CreateSuperAdminRequest('admin@example.com');
      await expect(service.createSuperAdmin(request)).rejects.toThrow('not found in database');
    });
  });

  describe('deleteSuperAdmin', () => {
    it('should delete super admin by composite ID', async () => {
      const mockUser = { id: 'user-123', role: UserRole.SuperAdmin };
      userRepository.findById.mockResolvedValue(mockUser as any);
      const request = new DeleteSuperAdminRequest('superadmin-user-123');
      await service.deleteSuperAdmin(request);
      expect(userRepository.changeUserRole).toHaveBeenCalledWith('user-123', UserRole.Unassigned);
    });

    it('should throw error when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      userRepository.findAllSuperAdmins.mockResolvedValue([]);
      const request = new DeleteSuperAdminRequest('user-123');
      await expect(service.deleteSuperAdmin(request)).rejects.toThrow('not found');
    });
  });

  describe('listSuperAdmins', () => {
    it('should list all super admins', async () => {
      const mockProfiles = [{ id: 'profile-1', userId: 'user-1' }];
      userRepository.findAllSuperAdmins.mockResolvedValue(mockProfiles as any);
      const result = await service.listSuperAdmins();
      expect(result.superAdmins).toBeDefined();
    });
  });
});