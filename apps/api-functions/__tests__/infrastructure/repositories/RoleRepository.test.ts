import { RoleRepository } from '../../../src/infrastructure/repositories/RoleRepository';
import { Role } from '../../../src/domain/entities/Role';
import { createMockPrismaClient, createMockRole, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('RoleRepository', () => {
  let repository: RoleRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new RoleRepository();
  });

  describe('findById', () => {
    it('should find a role by id', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
        displayName: 'PSO Role',
        description: 'PSO description',
        isSystem: false,
        isActive: true,
      });

      mockPrismaClient.role.findUnique.mockResolvedValue(prismaRole);

      const result = await repository.findById('role-id');

      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-id' },
      });
      expect(result).toBeInstanceOf(Role);
      expect(result?.id).toBe('role-id');
      expect(result?.name).toBe('PSO');
      expect(result?.displayName).toBe('PSO Role');
      expect(result?.description).toBe('PSO description');
      expect(result?.isSystem).toBe(false);
      expect(result?.isActive).toBe(true);
    });

    it('should return null when role not found', async () => {
      mockPrismaClient.role.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle role with null displayName and description', async () => {
      const prismaRole = createMockRole({
        id: 'role-id',
        name: 'PSO',
        displayName: null,
        description: null,
      });

      mockPrismaClient.role.findUnique.mockResolvedValue(prismaRole);

      const result = await repository.findById('role-id');

      expect(result).toBeInstanceOf(Role);
      expect(result?.displayName).toBeUndefined();
      expect(result?.description).toBeUndefined();
    });
  });

  describe('findByName', () => {
    it('should find a role by name', async () => {
      const prismaRole = createMockRole({
        name: 'PSO',
      });

      mockPrismaClient.role.findUnique.mockResolvedValue(prismaRole);

      const result = await repository.findByName('PSO');

      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'PSO' },
      });
      expect(result).toBeInstanceOf(Role);
      expect(result?.name).toBe('PSO');
    });

    it('should return null when role not found by name', async () => {
      mockPrismaClient.role.findUnique.mockResolvedValue(null);

      const result = await repository.findByName('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all roles when onlyActive is false', async () => {
      const prismaRoles = [
        createMockRole({ id: 'role-1', name: 'PSO' }),
        createMockRole({ id: 'role-2', name: 'Supervisor', isActive: false }),
      ];

      mockPrismaClient.role.findMany.mockResolvedValue(prismaRoles);

      const result = await repository.findAll(false);

      expect(mockPrismaClient.role.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Role);
      expect(result[0].name).toBe('PSO');
      expect(result[1].name).toBe('Supervisor');
    });

    it('should find only active roles when onlyActive is true', async () => {
      const prismaRoles = [
        createMockRole({ id: 'role-1', name: 'PSO', isActive: true }),
      ];

      mockPrismaClient.role.findMany.mockResolvedValue(prismaRoles);

      const result = await repository.findAll(true);

      expect(mockPrismaClient.role.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array when no roles found', async () => {
      mockPrismaClient.role.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toHaveLength(0);
    });
  });
});

