import { seedDefaultRolesAndPermissions } from '../../../src/infrastructure/seed/defaultRolesAndPermissions';
import { createMockPrismaClient, createMockRole, createMockPermission, createMockUser, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('defaultRolesAndPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
  });

  describe('seedDefaultRolesAndPermissions', () => {
    it('should create all roles, permissions, role-permission assignments, and migrate user roles', async () => {
      // Mock roles
      const mockRoles = {
        SuperAdmin: createMockRole({ name: 'SuperAdmin', id: 'role-superadmin-id' }),
        Admin: createMockRole({ name: 'Admin', id: 'role-admin-id' }),
        Supervisor: createMockRole({ name: 'Supervisor', id: 'role-supervisor-id' }),
        PSO: createMockRole({ name: 'PSO', id: 'role-pso-id' }),
        ContactManager: createMockRole({ name: 'ContactManager', id: 'role-cm-id' }),
        Unassigned: createMockRole({ name: 'Unassigned', id: 'role-unassigned-id' }),
      };

      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockImplementation(({ data }) => {
        const role = mockRoles[data.name as keyof typeof mockRoles];
        return Promise.resolve(role);
      });

      // Mock permissions
      const mockPermissions: Record<string, any> = {};
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockImplementation(({ data }) => {
        const perm = createMockPermission({
          code: data.code,
          name: data.name,
          resource: data.resource,
          action: data.action,
          id: `perm-${data.code}-id`,
        });
        mockPermissions[data.code] = perm;
        return Promise.resolve(perm);
      });

      // Mock role permissions
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);

      // Mock users for migration
      const mockUsers = [
        createMockUser({ id: 'user-1', role: 'PSO' }),
        createMockUser({ id: 'user-2', role: 'Supervisor' }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      // Verify roles were created
      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledTimes(6);
      expect(mockPrismaClient.role.create).toHaveBeenCalledTimes(6);

      // Verify permissions were created (should be many)
      expect(mockPrismaClient.permission.findUnique).toHaveBeenCalled();
      expect(mockPrismaClient.permission.create).toHaveBeenCalled();

      // Verify role-permission assignments
      expect(mockPrismaClient.rolePermission.upsert).toHaveBeenCalled();

      // Verify user migration
      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledTimes(2);
    });

    it('should skip creating roles that already exist', async () => {
      const existingRole = createMockRole({ name: 'SuperAdmin', id: 'existing-role-id' });

      mockPrismaClient.role.findUnique
        .mockResolvedValueOnce(existingRole) // SuperAdmin exists
        .mockResolvedValueOnce(null) // Admin doesn't exist
        .mockResolvedValueOnce(null) // Supervisor doesn't exist
        .mockResolvedValueOnce(null) // PSO doesn't exist
        .mockResolvedValueOnce(null) // ContactManager doesn't exist
        .mockResolvedValueOnce(null); // Unassigned doesn't exist

      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      expect(mockPrismaClient.role.create).toHaveBeenCalledTimes(5); // Only 5 created, 1 skipped
    });

    it('should skip creating permissions that already exist', async () => {
      const existingPermission = createMockPermission({ code: 'error_logs:read' });

      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique
        .mockResolvedValueOnce(existingPermission) // First permission exists
        .mockResolvedValueOnce(null); // Rest don't exist
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      expect(mockPrismaClient.permission.create).toHaveBeenCalled();
    });

    it('should create role-permission assignments correctly', async () => {
      const superAdminRole = createMockRole({ name: 'SuperAdmin', id: 'role-superadmin-id' });
      const psoRole = createMockRole({ name: 'PSO', id: 'role-pso-id' });
      const errorLogsReadPerm = createMockPermission({ code: 'error_logs:read', id: 'perm-error-logs-read-id' });
      const commandsAckPerm = createMockPermission({ code: 'commands:acknowledge', id: 'perm-commands-ack-id' });

      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockImplementation(({ data }) => {
        if (data.name === 'SuperAdmin') return Promise.resolve(superAdminRole);
        if (data.name === 'PSO') return Promise.resolve(psoRole);
        return Promise.resolve(createMockRole({ name: data.name }));
      });

      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockImplementation(({ data }) => {
        if (data.code === 'error_logs:read') return Promise.resolve(errorLogsReadPerm);
        if (data.code === 'commands:acknowledge') return Promise.resolve(commandsAckPerm);
        return Promise.resolve(createMockPermission({ code: data.code }));
      });

      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      // Verify role-permission upserts were called
      expect(mockPrismaClient.rolePermission.upsert).toHaveBeenCalled();
      
      // Verify SuperAdmin gets all permissions
      const superAdminUpserts = (mockPrismaClient.rolePermission.upsert as jest.Mock).mock.calls.filter(
        (call) => call[0].where.roleId_permissionId.roleId === 'role-superadmin-id'
      );
      expect(superAdminUpserts.length).toBeGreaterThan(0);
    });

    it('should migrate user roles correctly', async () => {
      const psoRole = createMockRole({ name: 'PSO', id: 'role-pso-id' });
      const supervisorRole = createMockRole({ name: 'Supervisor', id: 'role-supervisor-id' });
      const mockUsers = [
        createMockUser({ id: 'user-1', role: 'PSO' }),
        createMockUser({ id: 'user-2', role: 'Supervisor' }),
        createMockUser({ id: 'user-3', role: 'Unassigned' }),
      ];

      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockImplementation(({ data }) => {
        if (data.name === 'PSO') return Promise.resolve(psoRole);
        if (data.name === 'Supervisor') return Promise.resolve(supervisorRole);
        return Promise.resolve(createMockRole({ name: data.name }));
      });

      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledTimes(3);

      // Verify user-1 (PSO) gets PSO role assignment
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: 'user-1',
            roleId: 'role-pso-id',
          },
        },
        update: { isActive: true },
        create: {
          userId: 'user-1',
          roleId: 'role-pso-id',
          isActive: true,
        },
      });

      // Verify user-2 (Supervisor) gets Supervisor role assignment
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: 'user-2',
            roleId: 'role-supervisor-id',
          },
        },
        update: { isActive: true },
        create: {
          userId: 'user-2',
          roleId: 'role-supervisor-id',
          isActive: true,
        },
      });
    });

    it('should skip migrating users with roles that do not exist in roleIdByName', async () => {
      const psoRole = createMockRole({ name: 'PSO', id: 'role-pso-id' });
      const mockUsers = [
        createMockUser({ id: 'user-1', role: 'PSO' }),
        createMockUser({ id: 'user-2', role: 'NonExistentRole' }),
      ];

      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockImplementation(({ data }) => {
        if (data.name === 'PSO') return Promise.resolve(psoRole);
        return Promise.resolve(createMockRole({ name: data.name }));
      });

      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      // Only user-1 should get migrated (user-2 has non-existent role)
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_roleId: expect.objectContaining({
              userId: 'user-1',
            }),
          }),
        })
      );
    });

    it('should handle errors when creating roles', async () => {
      const error = new Error('Database error');
      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockRejectedValue(error);

      await expect(seedDefaultRolesAndPermissions()).rejects.toThrow('Database error');
    });

    it('should handle errors when creating permissions', async () => {
      const error = new Error('Database error');
      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockRejectedValue(error);

      await expect(seedDefaultRolesAndPermissions()).rejects.toThrow('Database error');
    });

    it('should handle errors when creating role-permission assignments', async () => {
      const error = new Error('Database error');
      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockRejectedValue(error);

      await expect(seedDefaultRolesAndPermissions()).rejects.toThrow('Database error');
    });

    it('should handle errors when migrating user roles', async () => {
      const error = new Error('Database error');
      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue([createMockUser()]);
      mockPrismaClient.userRoleAssignment.upsert.mockRejectedValue(error);

      await expect(seedDefaultRolesAndPermissions()).rejects.toThrow('Database error');
    });

    it('should create roles with correct default values', async () => {
      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      // Verify SuperAdmin role creation
      expect(mockPrismaClient.role.create).toHaveBeenCalledWith({
        data: {
          name: 'SuperAdmin',
          displayName: 'Super Admin',
          isSystem: true,
          isActive: true,
        },
      });

      // Verify PSO role creation
      expect(mockPrismaClient.role.create).toHaveBeenCalledWith({
        data: {
          name: 'PSO',
          displayName: 'PSO',
          isSystem: true,
          isActive: true,
        },
      });
    });

    it('should create permissions with correct structure', async () => {
      mockPrismaClient.role.findUnique.mockResolvedValue(null);
      mockPrismaClient.role.create.mockResolvedValue(createMockRole());
      mockPrismaClient.permission.findUnique.mockResolvedValue(null);
      mockPrismaClient.permission.create.mockResolvedValue(createMockPermission());
      mockPrismaClient.rolePermission.upsert.mockResolvedValue({} as any);
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await seedDefaultRolesAndPermissions();

      // Verify error_logs:read permission creation
      expect(mockPrismaClient.permission.create).toHaveBeenCalledWith({
        data: {
          code: 'error_logs:read',
          name: 'Read error logs',
          resource: 'error_logs',
          action: 'read',
          isActive: true,
        },
      });
    });
  });
});

