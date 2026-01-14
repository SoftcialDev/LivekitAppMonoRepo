import { UserQueryService } from '../../../src/domain/services/UserQueryService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { UserQueryRequest } from '../../../src/domain/value-objects/UserQueryRequest';
import { UserQueryResult } from '../../../src/domain/value-objects/UserQueryResult';
import { createMockUserRepository } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('UserQueryService', () => {
  let service: UserQueryService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    service = new UserQueryService(mockUserRepository);
  });

  describe('findUsersByRoles', () => {
    it('should return users by roles with pagination', async () => {
      const request = new UserQueryRequest([UserRole.PSO], 1, 10);
      const mockUsers = [
        {
          id: 'user-1',
          azureAdObjectId: 'azure-1',
          email: 'pso1@example.com',
          fullName: 'PSO One',
          role: UserRole.PSO,
        },
        {
          id: 'user-2',
          azureAdObjectId: 'azure-2',
          email: 'pso2@example.com',
          fullName: 'PSO Two',
          role: UserRole.PSO,
        },
      ];

      mockUserRepository.findByRolesWithSupervisor.mockResolvedValue(mockUsers as any);

      const result = await service.findUsersByRoles(request);

      expect(mockUserRepository.findByRolesWithSupervisor).toHaveBeenCalledWith([UserRole.PSO]);
      expect(result.total).toBe(2);
      expect(result.users).toHaveLength(2);
    });

    it('should include unassigned users when requested', async () => {
      const request = new UserQueryRequest([null], 1, 10);
      const mockUnassigned = [
        {
          id: 'user-3',
          azureAdObjectId: 'azure-3',
          email: 'unassigned@example.com',
          fullName: 'Unassigned User',
          role: null,
        },
      ];

      mockUserRepository.findUsersWithUnassignedRoleWithSupervisor.mockResolvedValue(mockUnassigned as any);

      const result = await service.findUsersByRoles(request);

      expect(mockUserRepository.findUsersWithUnassignedRoleWithSupervisor).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });

    it('should remove duplicate users', async () => {
      const request = new UserQueryRequest([UserRole.PSO], 1, 10);
      const mockUsers = [
        {
          id: 'user-1',
          azureAdObjectId: 'azure-1',
          email: 'pso1@example.com',
          fullName: 'PSO One',
          role: UserRole.PSO,
        },
        {
          id: 'user-2',
          azureAdObjectId: 'azure-1',
          email: 'pso1@example.com',
          fullName: 'PSO One',
          role: UserRole.PSO,
        },
      ];

      mockUserRepository.findByRolesWithSupervisor.mockResolvedValue(mockUsers as any);

      const result = await service.findUsersByRoles(request);

      expect(result.total).toBe(1);
      expect(result.users).toHaveLength(1);
    });

    it('should apply pagination correctly', async () => {
      const request = new UserQueryRequest([UserRole.PSO], 2, 2);
      const mockUsers = [
        { id: 'user-1', azureAdObjectId: 'azure-1', email: 'pso1@example.com', fullName: 'PSO One', role: UserRole.PSO },
        { id: 'user-2', azureAdObjectId: 'azure-2', email: 'pso2@example.com', fullName: 'PSO Two', role: UserRole.PSO },
        { id: 'user-3', azureAdObjectId: 'azure-3', email: 'pso3@example.com', fullName: 'PSO Three', role: UserRole.PSO },
        { id: 'user-4', azureAdObjectId: 'azure-4', email: 'pso4@example.com', fullName: 'PSO Four', role: UserRole.PSO },
      ];

      mockUserRepository.findByRolesWithSupervisor.mockResolvedValue(mockUsers as any);

      const result = await service.findUsersByRoles(request);

      expect(result.total).toBe(4);
      expect(result.users).toHaveLength(2);
      expect(result.page).toBe(2);
    });
  });
});

