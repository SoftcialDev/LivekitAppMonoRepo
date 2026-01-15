import { GetUserDebugDomainService } from '../../../src/domain/services/GetUserDebugDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IUserRoleAssignmentRepository } from '../../../src/domain/interfaces/IUserRoleAssignmentRepository';
import { IPermissionRepository } from '../../../src/domain/interfaces/IPermissionRepository';
import { GetUserDebugRequest } from '../../../src/domain/value-objects/GetUserDebugRequest';
import { GetUserDebugResponse } from '../../../src/domain/value-objects/GetUserDebugResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockUserRoleAssignmentRepository, createMockPermissionRepository, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('GetUserDebugDomainService', () => {
  let service: GetUserDebugDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockUserRoleAssignmentRepository: jest.Mocked<IUserRoleAssignmentRepository>;
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockUserRoleAssignmentRepository = createMockUserRoleAssignmentRepository();
    mockPermissionRepository = createMockPermissionRepository();
    service = new GetUserDebugDomainService(
      mockUserRepository,
      mockUserRoleAssignmentRepository,
      mockPermissionRepository
    );
  });

  describe('getUserDebug', () => {
    it('should return user debug info when found by email', async () => {
      const request = new GetUserDebugRequest('user@example.com');
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
        role: UserRole.PSO,
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRoleAssignmentRepository.findActiveRoleAssignmentsByUserId.mockResolvedValue([]);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserDebug(request);

      expect(result.user.id).toBe('user-id');
      expect(result.user.email).toBe('user@example.com');
      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should return user debug info when found by Azure AD Object ID', async () => {
      const request = new GetUserDebugRequest('azure-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRoleAssignmentRepository.findActiveRoleAssignmentsByUserId.mockResolvedValue([]);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserDebug(request);

      expect(result.user.azureAdObjectId).toBe('azure-id');
    });

    it('should throw error when user not found', async () => {
      const request = new GetUserDebugRequest('non-existent');

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.getUserDebug(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should include role assignments when available', async () => {
      const request = new GetUserDebugRequest('user@example.com');
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
      });
      const roleAssignments = [
        {
          roleId: 'role-1',
          role: { displayName: 'Role One', name: 'role_one' },
          assignedAt: new Date(),
        },
      ];

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRoleAssignmentRepository.findActiveRoleAssignmentsByUserId.mockResolvedValue(roleAssignments as any);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserDebug(request);

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].roleName).toBe('Role One');
    });

    it('should include permissions when available', async () => {
      const request = new GetUserDebugRequest('user@example.com');
      const user = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
      });
      const permissions = [
        {
          code: 'PERMISSION_1',
          name: 'Permission One',
          resource: 'resource',
          action: 'action',
        },
      ];

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRoleAssignmentRepository.findActiveRoleAssignmentsByUserId.mockResolvedValue([]);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue(['PERMISSION_1']);
      mockPermissionRepository.findByCodes.mockResolvedValue(permissions as any);
      mockUserRepository.findContactManagerProfileByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserDebug(request);

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].code).toBe('PERMISSION_1');
    });
  });
});


