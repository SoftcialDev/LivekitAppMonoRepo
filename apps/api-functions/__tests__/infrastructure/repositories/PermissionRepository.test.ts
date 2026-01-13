import { PermissionRepository } from '../../../src/infrastructure/repositories/PermissionRepository';
import { Permission } from '../../../src/domain/entities/Permission';
import { createMockPrismaClient, createMockPermission, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('PermissionRepository', () => {
  let repository: PermissionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new PermissionRepository();
  });

  describe('findByCode', () => {
    it('should find a permission by code', async () => {
      const prismaPermission = createMockPermission({
        id: 'permission-id',
        code: 'users:read',
        name: 'Read Users',
        resource: 'users',
        action: 'read',
      });

      mockPrismaClient.permission.findUnique.mockResolvedValue(prismaPermission);

      const result = await repository.findByCode('users:read');

      expect(mockPrismaClient.permission.findUnique).toHaveBeenCalledWith({
        where: { code: 'users:read' },
      });
      expect(result).toBeInstanceOf(Permission);
      expect(result?.code).toBe('users:read');
      expect(result?.name).toBe('Read Users');
      expect(result?.resource).toBe('users');
      expect(result?.action).toBe('read');
    });

    it('should return null when permission not found', async () => {
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);

      const result = await repository.findByCode('non-existent:code');

      expect(result).toBeNull();
    });

    it('should handle permission with null description', async () => {
      const prismaPermission = createMockPermission({
        code: 'users:read',
        description: null,
      });

      mockPrismaClient.permission.findUnique.mockResolvedValue(prismaPermission);

      const result = await repository.findByCode('users:read');

      expect(result).toBeInstanceOf(Permission);
      expect(result?.description).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should find all permissions when onlyActive is false', async () => {
      const prismaPermissions = [
        createMockPermission({ id: 'perm-1', code: 'users:read', isActive: true }),
        createMockPermission({ id: 'perm-2', code: 'users:write', isActive: false }),
      ];

      mockPrismaClient.permission.findMany.mockResolvedValue(prismaPermissions);

      const result = await repository.findAll(false);

      expect(mockPrismaClient.permission.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Permission);
    });

    it('should find only active permissions when onlyActive is true', async () => {
      const prismaPermissions = [
        createMockPermission({ id: 'perm-1', code: 'users:read', isActive: true }),
      ];

      mockPrismaClient.permission.findMany.mockResolvedValue(prismaPermissions);

      const result = await repository.findAll(true);

      expect(mockPrismaClient.permission.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array when no permissions found', async () => {
      mockPrismaClient.permission.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findByCodes', () => {
    it('should find permissions by codes with onlyActive true', async () => {
      const prismaPermissions = [
        createMockPermission({ id: 'perm-1', code: 'users:read', isActive: true }),
        createMockPermission({ id: 'perm-2', code: 'users:write', isActive: true }),
      ];

      mockPrismaClient.permission.findMany.mockResolvedValue(prismaPermissions);

      const result = await repository.findByCodes(['users:read', 'users:write'], true);

      expect(mockPrismaClient.permission.findMany).toHaveBeenCalledWith({
        where: {
          code: { in: ['users:read', 'users:write'] },
          isActive: true,
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Permission);
    });

    it('should find permissions by codes with onlyActive false', async () => {
      const prismaPermissions = [
        createMockPermission({ id: 'perm-1', code: 'users:read', isActive: false }),
      ];

      mockPrismaClient.permission.findMany.mockResolvedValue(prismaPermissions);

      const result = await repository.findByCodes(['users:read'], false);

      expect(mockPrismaClient.permission.findMany).toHaveBeenCalledWith({
        where: {
          code: { in: ['users:read'] },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no permissions match codes', async () => {
      mockPrismaClient.permission.findMany.mockResolvedValue([]);

      const result = await repository.findByCodes(['non-existent:code']);

      expect(result).toHaveLength(0);
    });
  });
});

