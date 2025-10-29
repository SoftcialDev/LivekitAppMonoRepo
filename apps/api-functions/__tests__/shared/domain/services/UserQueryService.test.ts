import { UserQueryService } from '../../../../shared/domain/services/UserQueryService';
import { UserQueryRequest } from '../../../../shared/domain/value-objects/UserQueryRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

describe('UserQueryService', () => {
  let service: UserQueryService;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByRolesWithSupervisor: jest.fn(), findUsersWithUnassignedRoleWithSupervisor: jest.fn() } as any;
    service = new UserQueryService(userRepository);
  });

  describe('findUsersByRoles', () => {
    it('should find users by specific roles', async () => {
      const mockUsers = [{ id: 'user-1', azureAdObjectId: 'azure-1', email: 'user1@example.com', fullName: 'User One', role: 'Employee' }];
      userRepository.findByRolesWithSupervisor.mockResolvedValue(mockUsers as any);
      const request = new UserQueryRequest([UserRole.Employee], 1, 10);
      const result = await service.findUsersByRoles(request);
      expect(result.users).toHaveLength(1);
    });

    it('should include unassigned users when requested', async () => {
      const mockRoleUsers = [{ id: 'user-1', azureAdObjectId: 'azure-1', email: 'user1@example.com', fullName: 'User One', role: 'Employee' }];
      const mockUnassignedUsers = [{ id: 'user-2', azureAdObjectId: 'azure-2', email: 'user2@example.com', fullName: 'User Two', role: null }];
      userRepository.findByRolesWithSupervisor.mockResolvedValue(mockRoleUsers as any);
      userRepository.findUsersWithUnassignedRoleWithSupervisor.mockResolvedValue(mockUnassignedUsers as any);
      const request = new UserQueryRequest([UserRole.Employee, null], 1, 10);
      const result = await service.findUsersByRoles(request);
      expect(result.users).toHaveLength(2);
    });

    it('should return empty result when no users found', async () => {
      userRepository.findByRolesWithSupervisor.mockResolvedValue([]);
      userRepository.findUsersWithUnassignedRoleWithSupervisor.mockResolvedValue([]);
      const request = new UserQueryRequest([UserRole.Employee], 1, 10);
      const result = await service.findUsersByRoles(request);
      expect(result.users).toHaveLength(0);
    });
  });
});
