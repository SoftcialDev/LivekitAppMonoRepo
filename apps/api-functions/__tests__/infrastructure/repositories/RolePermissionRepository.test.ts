import { RolePermissionRepository } from '../../../src/infrastructure/repositories/RolePermissionRepository';
import { Permission } from '../../../src/domain/entities/Permission';
import { createMockPrismaClient, createMockPermission, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('RolePermissionRepository', () => {
  let repository: RolePermissionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new RolePermissionRepository();
  });

  describe('findPermissionsByRole', () => {
    it('should find permissions by role with onlyGranted true', async () => {
      const prismaPermission = createMockPermission({
        id: 'permission-id',
        code: 'users:read',
        name: 'Read Users',
        resource: 'users',
        action: 'read',
        isActive: true,
      });

      const mockRole = {
        id: 'role-id',
        rolePermissions: [
          {
            granted: true,
            permission: prismaPermission,
          },
        ],
      };

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);

      const result = await repository.findPermissionsByRole('role-id', true);

      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-id' },
        include: {
          rolePermissions: {
            where: { granted: true },
            include: { permission: true },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Permission);
      expect(result[0].code).toBe('users:read');
    });

    it('should find permissions by role with onlyGranted false', async () => {
      const prismaPermission = createMockPermission({
        id: 'permission-id',
        code: 'users:write',
        isActive: true,
      });

      const mockRole = {
        id: 'role-id',
        rolePermissions: [
          {
            granted: false,
            permission: prismaPermission,
          },
        ],
      };

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);

      const result = await repository.findPermissionsByRole('role-id', false);

      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-id' },
        include: {
          rolePermissions: {
            where: undefined,
            include: { permission: true },
          },
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should filter out inactive permissions', async () => {
      const activePermission = createMockPermission({
        id: 'permission-1',
        code: 'users:read',
        isActive: true,
      });

      const inactivePermission = createMockPermission({
        id: 'permission-2',
        code: 'users:write',
        isActive: false,
      });

      const mockRole = {
        id: 'role-id',
        rolePermissions: [
          {
            granted: true,
            permission: activePermission,
          },
          {
            granted: true,
            permission: inactivePermission,
          },
        ],
      };

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);

      const result = await repository.findPermissionsByRole('role-id', true);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('users:read');
    });

    it('should return empty array when role not found', async () => {
      mockPrismaClient.role.findUnique.mockResolvedValue(null);

      const result = await repository.findPermissionsByRole('non-existent-role-id');

      expect(result).toHaveLength(0);
    });

    it('should return empty array when role has no permissions', async () => {
      const mockRole = {
        id: 'role-id',
        rolePermissions: [],
      };

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);

      const result = await repository.findPermissionsByRole('role-id');

      expect(result).toHaveLength(0);
    });

    it('should handle permission with null description', async () => {
      const prismaPermission = createMockPermission({
        id: 'permission-id',
        code: 'users:read',
        description: null,
        isActive: true,
      });

      const mockRole = {
        id: 'role-id',
        rolePermissions: [
          {
            granted: true,
            permission: prismaPermission,
          },
        ],
      };

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);

      const result = await repository.findPermissionsByRole('role-id');

      expect(result[0]).toBeInstanceOf(Permission);
      expect(result[0].description).toBeUndefined();
    });
  });
});

