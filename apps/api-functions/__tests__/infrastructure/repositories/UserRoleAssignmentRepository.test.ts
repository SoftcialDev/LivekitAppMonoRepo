import { UserRoleAssignmentRepository } from '../../../src/infrastructure/repositories/UserRoleAssignmentRepository';
import { Role } from '../../../src/domain/entities/Role';
import { wrapDatabaseQueryError } from '../../../src/utils/error/ErrorHelpers';
import { EntityNotFoundError, DatabaseQueryError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, createMockRole, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;

describe('UserRoleAssignmentRepository', () => {
  let repository: UserRoleAssignmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new UserRoleAssignmentRepository();
  });

  describe('findActiveRolesByUserId', () => {
    it('should find active roles by user id', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
        isActive: true,
      });

      const mockAssignments = [
        {
          role: prismaRole,
          isActive: true,
        },
      ];

      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await repository.findActiveRolesByUserId('user-id');

      expect(mockPrismaClient.userRoleAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', isActive: true },
        include: { role: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Role);
      expect(result[0].id).toBe('role-id');
      expect(result[0].name).toBe('PSO');
    });

    it('should filter out assignments without role', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
      });

      const mockAssignments = [
        {
          role: prismaRole,
          isActive: true,
        },
        {
          role: null,
          isActive: true,
        },
      ];

      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await repository.findActiveRolesByUserId('user-id');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('role-id');
    });

    it('should return empty array when no assignments found', async () => {
      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue([]);

      const result = await repository.findActiveRolesByUserId('user-id');

      expect(result).toHaveLength(0);
    });
  });

  describe('findActiveRoleAssignmentsByUserId', () => {
    it('should find active role assignments by user id', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
        displayName: 'PSO Role',
        description: 'PSO description',
        isSystem: false,
        isActive: true,
      });

      const mockAssignments = [
        {
          role: prismaRole,
          assignedAt: mockDate,
          isActive: true,
        },
      ];

      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await repository.findActiveRoleAssignmentsByUserId('user-id');

      expect(mockPrismaClient.userRoleAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', isActive: true },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
              isSystem: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              description: true,
            },
          },
        },
        orderBy: { assignedAt: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe('role-id');
      expect(result[0].role).toBeInstanceOf(Role);
      expect(result[0].assignedAt).toEqual(mockDate);
    });

    it('should filter out assignments with null role', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
      });

      const mockAssignments = [
        {
          role: prismaRole,
          assignedAt: mockDate,
          isActive: true,
        },
        {
          role: null,
          assignedAt: mockDate,
          isActive: true,
        },
      ];

      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await repository.findActiveRoleAssignmentsByUserId('user-id');

      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe('role-id');
    });

    it('should filter out assignments with null role', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
      });

      const mockAssignments = [
        {
          role: prismaRole,
          assignedAt: mockDate,
          isActive: true,
        },
        {
          role: null,
          assignedAt: mockDate,
          isActive: true,
        },
      ];

      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await repository.findActiveRoleAssignmentsByUserId('user-id');

      // Should filter out the null role assignment
      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe('role-id');
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.userRoleAssignment.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get role assignments', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findActiveRoleAssignmentsByUserId('user-id')).rejects.toThrow();
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get role assignments', error);
    });

    it('should return empty array when no assignments found', async () => {
      mockPrismaClient.userRoleAssignment.findMany.mockResolvedValue([]);

      const result = await repository.findActiveRoleAssignmentsByUserId('user-id');

      expect(result).toHaveLength(0);
    });
  });
});

