import { UserRepository } from '../../../src/infrastructure/repositories/UserRepository';
import { User } from '../../../src/domain/entities/User';
import { ContactManagerProfile } from '../../../src/domain/entities/ContactManagerProfile';
import { SuperAdminProfile } from '../../../src/domain/entities/SuperAdminProfile';
import { Role } from '../../../src/domain/entities/Role';
import { UserRole, ContactManagerStatus } from '@prisma/client';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapPsoFetchError } from '../../../src/utils/error/ErrorHelpers';
import { PsoFetchError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, createMockUser, createMockRole, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapPsoFetchError = wrapPsoFetchError as jest.MockedFunction<typeof wrapPsoFetchError>;

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new UserRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('findByAzureAdObjectId', () => {
    it('should find user by Azure AD object id', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findByAzureAdObjectId('azure-id');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { azureAdObjectId: 'azure-id' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-id');
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByAzureAdObjectId('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (lowercase)', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findByEmail('USER@EXAMPLE.COM');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const prismaUser = createMockUser({ id: 'user-id' });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findById('user-id');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAllUsers', () => {
    it('should find all users', async () => {
      const prismaUsers = [
        createMockUser({ id: 'user-1' }),
        createMockUser({ id: 'user-2' }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findAllUsers();

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
    });
  });

  describe('existsAndActive', () => {
    it('should return true for active user', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        deletedAt: null,
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.existsAndActive('azure-id');

      expect(result).toBe(true);
    });

    it('should return false for deleted user', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        deletedAt: mockDate,
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.existsAndActive('azure-id');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.existsAndActive('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      const prismaRole = createMockRole({ name: UserRole.PSO });
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        userRoleAssignments: [
          {
            role: prismaRole,
            isActive: true,
            assignedAt: mockDate,
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.hasRole('azure-id', UserRole.PSO);

      expect(result).toBe(true);
    });

    it('should return false when user does not have role', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        userRoleAssignments: [],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.hasRole('azure-id', UserRole.PSO);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.hasRole('non-existent-id', UserRole.PSO);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the roles', async () => {
      const prismaRole = createMockRole({ name: UserRole.PSO });
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        userRoleAssignments: [
          {
            role: prismaRole,
            isActive: true,
            assignedAt: mockDate,
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.hasAnyRole('azure-id', [UserRole.PSO, UserRole.Supervisor]);

      expect(result).toBe(true);
    });

    it('should return false when user does not have any of the roles', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        userRoleAssignments: [],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.hasAnyRole('azure-id', [UserRole.Supervisor]);

      expect(result).toBe(false);
    });
  });

  describe('isPSO', () => {
    it('should return true when user is PSO', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        email: 'pso@example.com',
        role: UserRole.PSO,
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.isPSO('pso@example.com');

      expect(result).toBe(true);
    });

    it('should return false when user is not PSO', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        email: 'user@example.com',
        role: UserRole.Supervisor,
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.isPSO('user@example.com');

      expect(result).toBe(false);
    });
  });

  describe('updateSupervisor', () => {
    it('should update user supervisor', async () => {
      mockPrismaClient.user.update.mockResolvedValue({} as any);

      await repository.updateSupervisor('user@example.com', 'supervisor-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        data: {
          supervisorId: 'supervisor-id',
          updatedAt: mockDate,
        },
      });
    });

    it('should unassign supervisor when supervisorId is null', async () => {
      mockPrismaClient.user.update.mockResolvedValue({} as any);

      await repository.updateSupervisor('user@example.com', null);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        data: {
          supervisorId: null,
          updatedAt: mockDate,
        },
      });
    });
  });

  describe('createPSO', () => {
    it('should create a new PSO user', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        email: 'pso@example.com',
        role: UserRole.PSO,
        supervisorId: 'supervisor-id',
      });

      mockPrismaClient.user.create.mockResolvedValue(prismaUser);

      const result = await repository.createPSO('pso@example.com', 'PSO Name', 'supervisor-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: 'pso@example.com',
          fullName: 'PSO Name',
          role: UserRole.PSO,
          supervisorId: 'supervisor-id',
          azureAdObjectId: '',
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should create PSO without supervisor', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        email: 'pso@example.com',
        role: UserRole.PSO,
        supervisorId: null,
      });

      mockPrismaClient.user.create.mockResolvedValue(prismaUser);

      await repository.createPSO('pso@example.com', 'PSO Name');

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          supervisorId: null,
        }),
      });
    });
  });

  describe('updateMultipleSupervisors', () => {
    it('should update multiple supervisors in transaction', async () => {
      const updates = [
        { email: 'pso1@example.com', supervisorId: 'supervisor-1' },
        { email: 'pso2@example.com', supervisorId: 'supervisor-2' },
      ];

      mockPrismaClient.$transaction.mockResolvedValue([{}, {}]);

      await repository.updateMultipleSupervisors(updates);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });
  });

  describe('findBySupervisor', () => {
    it('should find users by supervisor', async () => {
      const prismaUsers = [
        createMockUser({ id: 'user-1', supervisorId: 'supervisor-id' }),
        createMockUser({ id: 'user-2', supervisorId: 'supervisor-id' }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findBySupervisor('supervisor-id');

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {
          supervisorId: 'supervisor-id',
          deletedAt: null,
        },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      mockPrismaClient.user.update.mockResolvedValue({} as any);

      await repository.deleteUser('user-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          deletedAt: mockDate,
          updatedAt: mockDate,
        },
      });
    });
  });

  describe('upsertUser', () => {
    it('should create new user when not exists', async () => {
      const userData = {
        email: 'user@example.com',
        azureAdObjectId: 'azure-id',
        fullName: 'User Name',
        role: UserRole.PSO,
      };

      const prismaUser = createMockUser({
        id: 'user-id',
        ...userData,
      });

      mockPrismaClient.user.upsert.mockResolvedValue(prismaUser);

      const result = await repository.upsertUser(userData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        update: expect.objectContaining({
          azureAdObjectId: 'azure-id',
          fullName: 'User Name',
          role: UserRole.PSO,
          deletedAt: null,
        }),
        create: expect.objectContaining({
          email: 'user@example.com',
          azureAdObjectId: 'azure-id',
          fullName: 'User Name',
          role: UserRole.PSO,
          deletedAt: null,
        }),
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should update existing user and sync role assignments', async () => {
      const userData = {
        email: 'user@example.com',
        azureAdObjectId: 'azure-id',
        fullName: 'Updated Name',
        role: UserRole.Supervisor,
      };

      const prismaUser = createMockUser({
        id: 'user-id',
        ...userData,
      });

      const mockRole = createMockRole({ id: 'role-id', name: UserRole.Supervisor });
      mockPrismaClient.user.upsert.mockResolvedValue(prismaUser);
      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaClient.userRoleAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await repository.upsertUser(userData);

      expect(mockPrismaClient.user.upsert).toHaveBeenCalled();
      // Verify syncUserRoleAssignments was called
      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { name: UserRole.Supervisor }
      });
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalled();
    });

    it('should set deletedAt to undefined for Unassigned role', async () => {
      const userData = {
        email: 'user@example.com',
        azureAdObjectId: 'azure-id',
        fullName: 'User Name',
        role: UserRole.Unassigned,
      };

      const prismaUser = createMockUser({
        id: 'user-id',
        ...userData,
      });

      mockPrismaClient.user.upsert.mockResolvedValue(prismaUser);

      await repository.upsertUser(userData);

      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        update: expect.objectContaining({
          deletedAt: undefined,
        }),
        create: expect.objectContaining({
          deletedAt: undefined,
        }),
      });
    });
  });

  describe('findActiveUsersByRole', () => {
    it('should find active users by role', async () => {
      const prismaUsers = [
        { id: 'user-1', email: 'user1@example.com', fullName: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', fullName: 'User 2' },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findActiveUsersByRole(UserRole.PSO);

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {
          role: UserRole.PSO,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByRoles', () => {
    it('should find users by roles', async () => {
      const prismaUsers = [
        createMockUser({ id: 'user-1', role: UserRole.PSO, supervisor: null }),
        createMockUser({ id: 'user-2', role: UserRole.Supervisor, supervisor: null }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findByRoles([UserRole.PSO, UserRole.Supervisor]);

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: [UserRole.PSO, UserRole.Supervisor] },
        },
        include: {
          supervisor: {
            select: { azureAdObjectId: true, fullName: true },
          },
        },
        orderBy: { fullName: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
    });
  });

  describe('findByRolesWithSupervisor', () => {
    it('should find users by roles with supervisor (raw Prisma data)', async () => {
      const prismaUsers = [
        createMockUser({ id: 'user-1', role: UserRole.PSO, supervisor: null }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findByRolesWithSupervisor([UserRole.PSO]);

      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findUsersWithUnassignedRole', () => {
    it('should find users with unassigned role', async () => {
      const prismaUsers = [
        createMockUser({ id: 'user-1', role: UserRole.Unassigned, supervisor: null }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findUsersWithUnassignedRole();

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {
          role: UserRole.Unassigned,
        },
        include: {
          supervisor: {
            select: { azureAdObjectId: true, fullName: true },
          },
        },
        orderBy: { fullName: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findUsersWithUnassignedRoleWithSupervisor', () => {
    it('should find users with unassigned role with supervisor (raw Prisma data)', async () => {
      const prismaUsers = [
        createMockUser({ id: 'user-1', role: UserRole.Unassigned, supervisor: null }),
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findUsersWithUnassignedRoleWithSupervisor();

      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('changeUserRole', () => {
    it('should change user role and sync role assignments', async () => {
      const mockRole = createMockRole({ id: 'role-id', name: UserRole.Supervisor });
      mockPrismaClient.user.update.mockResolvedValue({} as any);
      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaClient.userRoleAssignment.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await repository.changeUserRole('user-id', UserRole.Supervisor);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          role: UserRole.Supervisor,
          deletedAt: null,
          roleChangedAt: mockDate,
        },
      });
      // Verify syncUserRoleAssignments was called
      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { name: UserRole.Supervisor }
      });
      expect(mockPrismaClient.userRoleAssignment.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', isActive: true },
        data: { isActive: false, updatedAt: mockDate }
      });
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalled();
    });

    it('should set deletedAt to undefined for Unassigned role', async () => {
      const mockRole = createMockRole({ id: 'role-id', name: UserRole.Unassigned });
      mockPrismaClient.user.update.mockResolvedValue({} as any);
      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaClient.userRoleAssignment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await repository.changeUserRole('user-id', UserRole.Unassigned);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          role: UserRole.Unassigned,
          deletedAt: undefined,
          roleChangedAt: mockDate,
        },
      });
    });
  });

  describe('createContactManager', () => {
    it('should create a contact manager user', async () => {
      const userData = {
        azureAdObjectId: 'azure-id',
        email: 'cm@example.com',
        fullName: 'Contact Manager',
      };

      const prismaUser = createMockUser({
        id: 'user-id',
        ...userData,
        role: UserRole.ContactManager,
      });

      mockPrismaClient.user.create.mockResolvedValue(prismaUser);

      const result = await repository.createContactManager(userData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          azureAdObjectId: 'azure-id',
          email: 'cm@example.com',
          fullName: 'Contact Manager',
          role: UserRole.ContactManager,
          roleChangedAt: mockDate,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(User);
    });
  });

  describe('createContactManagerProfile', () => {
    it('should create a contact manager profile', async () => {
      const prismaProfile = {
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.contactManagerProfile.create.mockResolvedValue(prismaProfile);

      const result = await repository.createContactManagerProfile('user-id', ContactManagerStatus.Available);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.contactManagerProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          status: ContactManagerStatus.Available,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(ContactManagerProfile);
    });
  });

  describe('createContactManagerStatusHistory', () => {
    it('should create contact manager status history', async () => {
      mockPrismaClient.contactManagerStatusHistory.create.mockResolvedValue({} as any);

      await repository.createContactManagerStatusHistory({
        profileId: 'profile-id',
        previousStatus: ContactManagerStatus.Available,
        newStatus: ContactManagerStatus.Unavailable,
        changedById: 'user-id',
      });

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.contactManagerStatusHistory.create).toHaveBeenCalledWith({
        data: {
          profileId: 'profile-id',
          previousStatus: ContactManagerStatus.Available,
          newStatus: ContactManagerStatus.Unavailable,
          changedById: 'user-id',
          timestamp: mockDate,
        },
      });
    });
  });

  describe('createSuperAdmin', () => {
    it('should create a super admin user', async () => {
      const userData = {
        azureAdObjectId: 'azure-id',
        email: 'admin@example.com',
        fullName: 'Super Admin',
      };

      const prismaUser = createMockUser({
        id: 'user-id',
        ...userData,
        role: UserRole.SuperAdmin,
      });

      mockPrismaClient.user.create.mockResolvedValue(prismaUser);

      const result = await repository.createSuperAdmin(userData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          azureAdObjectId: 'azure-id',
          email: 'admin@example.com',
          fullName: 'Super Admin',
          role: UserRole.SuperAdmin,
          roleChangedAt: mockDate,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(User);
    });
  });

  describe('createSuperAdminAuditLog', () => {
    it('should create super admin audit log', async () => {
      mockPrismaClient.auditLog.create.mockResolvedValue({} as any);

      await repository.createSuperAdminAuditLog({
        profileId: 'profile-id',
        action: 'Created',
        changedById: 'user-id',
      });

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          entity: 'SuperAdmin',
          entityId: 'profile-id',
          action: 'Created',
          changedById: 'user-id',
          timestamp: mockDate,
        },
      });
    });
  });

  describe('findContactManagerProfile', () => {
    it('should find contact manager profile by id', async () => {
      const prismaProfile = {
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'cm@example.com',
          fullName: 'Contact Manager',
        },
      };

      mockPrismaClient.contactManagerProfile.findUnique.mockResolvedValue(prismaProfile);

      const result = await repository.findContactManagerProfile('profile-id');

      expect(mockPrismaClient.contactManagerProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile-id' },
        include: { user: true },
      });
      expect(result).toBeInstanceOf(ContactManagerProfile);
    });

    it('should return null when profile not found', async () => {
      mockPrismaClient.contactManagerProfile.findUnique.mockResolvedValue(null);

      const result = await repository.findContactManagerProfile('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteContactManagerProfile', () => {
    it('should delete contact manager profile', async () => {
      mockPrismaClient.contactManagerProfile.delete.mockResolvedValue({} as any);

      await repository.deleteContactManagerProfile('profile-id');

      expect(mockPrismaClient.contactManagerProfile.delete).toHaveBeenCalledWith({
        where: { id: 'profile-id' },
      });
    });
  });

  describe('createContactManagerAuditLog', () => {
    it('should create contact manager audit log', async () => {
      mockPrismaClient.auditLog.create.mockResolvedValue({} as any);

      await repository.createContactManagerAuditLog({
        profileId: 'profile-id',
        action: 'Updated',
        changedById: 'user-id',
      });

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          entity: 'ContactManager',
          entityId: 'profile-id',
          action: 'Updated',
          changedById: 'user-id',
          timestamp: mockDate,
        },
      });
    });
  });

  describe('findAllContactManagers', () => {
    it('should find all contact managers', async () => {
      const prismaProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          status: ContactManagerStatus.Available,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'cm1@example.com',
            fullName: 'Contact Manager 1',
          },
        },
      ];

      mockPrismaClient.contactManagerProfile.findMany.mockResolvedValue(prismaProfiles);

      const result = await repository.findAllContactManagers();

      expect(mockPrismaClient.contactManagerProfile.findMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ContactManagerProfile);
    });
  });

  describe('findContactManagerProfileByUserId', () => {
    it('should find contact manager profile by user id', async () => {
      const prismaProfile = {
        id: 'profile-id',
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'cm@example.com',
          fullName: 'Contact Manager',
        },
      };

      mockPrismaClient.contactManagerProfile.findUnique.mockResolvedValue(prismaProfile);

      const result = await repository.findContactManagerProfileByUserId('user-id');

      expect(mockPrismaClient.contactManagerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toBeInstanceOf(ContactManagerProfile);
    });

    it('should return null when profile not found', async () => {
      mockPrismaClient.contactManagerProfile.findUnique.mockResolvedValue(null);

      const result = await repository.findContactManagerProfileByUserId('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAllSuperAdmins', () => {
    it('should find all super admins', async () => {
      const prismaUsers = [
        {
          id: 'user-1',
          email: 'admin1@example.com',
          fullName: 'Super Admin 1',
          role: UserRole.SuperAdmin,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(prismaUsers);

      const result = await repository.findAllSuperAdmins();

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.SuperAdmin },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SuperAdminProfile);
    });
  });

  describe('updateContactManagerStatus', () => {
    it('should update contact manager status', async () => {
      mockPrismaClient.contactManagerProfile.update.mockResolvedValue({} as any);

      await repository.updateContactManagerStatus('profile-id', ContactManagerStatus.Unavailable);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.contactManagerProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-id' },
        data: {
          status: ContactManagerStatus.Unavailable,
          updatedAt: mockDate,
        },
      });
    });
  });

  describe('getPsosBySupervisor', () => {
    it('should get PSOs by supervisor id', async () => {
      const supervisor = {
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: 'Supervisor',
        azureAdObjectId: 'azure-id',
      };

      const psos = [
        {
          email: 'pso1@example.com',
          supervisor: { fullName: 'Supervisor' },
        },
      ];

      mockPrismaClient.user.findUnique.mockResolvedValue(supervisor);
      mockPrismaClient.user.findMany.mockResolvedValue(psos);

      const result = await repository.getPsosBySupervisor('supervisor-id');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('pso1@example.com');
      expect(result[0].supervisorName).toBe('Supervisor');
    });

    it('should try to find supervisor by azureAdObjectId first, then by id', async () => {
      const supervisor = {
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: 'Supervisor',
        azureAdObjectId: 'azure-id',
      };

      mockPrismaClient.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(supervisor);
      mockPrismaClient.user.findMany.mockResolvedValue([]);

      await repository.getPsosBySupervisor('supervisor-id');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { azureAdObjectId: 'supervisor-id' },
        select: expect.any(Object),
      });
      expect(mockPrismaClient.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: 'supervisor-id' },
        select: expect.any(Object),
      });
    });

    it('should return empty array when supervisor not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.getPsosBySupervisor('non-existent-id');

      expect(result).toHaveLength(0);
    });

    it('should return empty array when supervisor role is not Supervisor', async () => {
      const supervisor = {
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Not Supervisor',
        role: 'PSO',
        azureAdObjectId: 'azure-id',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(supervisor);

      const result = await repository.getPsosBySupervisor('supervisor-id');

      expect(result).toHaveLength(0);
    });

    it('should get all PSOs when supervisorId is not provided', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([
        {
          email: 'pso1@example.com',
          supervisor: { fullName: 'Supervisor 1' },
        },
      ]);

      const result = await repository.getPsosBySupervisor();

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'PSO',
          deletedAt: null,
        },
        select: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });

    it('should throw PsoFetchError on error', async () => {
      const error = new Error('Database error');
      mockPrismaClient.user.findUnique.mockRejectedValue(error);
      const wrappedError = new PsoFetchError('Failed to get PSOs by supervisor', error);
      mockWrapPsoFetchError.mockReturnValue(wrappedError);

      await expect(repository.getPsosBySupervisor('supervisor-id')).rejects.toThrow(PsoFetchError);
      expect(mockWrapPsoFetchError).toHaveBeenCalledWith('Failed to get PSOs by supervisor', error);
    });
  });

  describe('getActiveRolesByAzureId', () => {
    it('should get active roles by Azure ID', async () => {
      const prismaRole = createMockRole({ name: UserRole.PSO });
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        role: UserRole.PSO,
        userRoleAssignments: [
          {
            role: prismaRole,
            isActive: true,
            assignedAt: mockDate,
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.getActiveRolesByAzureId('azure-id');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { azureAdObjectId: 'azure-id' },
        select: {
          id: true,
          role: true,
          userRoleAssignments: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Role);
    });

    it('should return empty array when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.getActiveRolesByAzureId('non-existent-id');

      expect(result).toHaveLength(0);
    });

    it('should filter out assignments with null role', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        role: UserRole.PSO,
        userRoleAssignments: [
          {
            role: null,
            isActive: true,
            assignedAt: mockDate,
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.getActiveRolesByAzureId('azure-id');

      expect(result).toHaveLength(0);
    });
  });

  describe('getEffectivePermissionCodesByAzureId', () => {
    it('should get effective permission codes by Azure ID', async () => {
      const prismaPermission = {
        id: 'perm-id',
        code: 'PERMISSION_CODE',
        isActive: true,
      };

      const prismaRole = createMockRole({
        name: UserRole.PSO,
        rolePermissions: [
          {
            granted: true,
            permission: prismaPermission,
          },
        ],
      });

      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        role: UserRole.PSO,
        userRoleAssignments: [
          {
            role: prismaRole,
            isActive: true,
            assignedAt: mockDate,
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);
      mockPrismaClient.role.findUnique.mockResolvedValue(prismaRole);

      const result = await repository.getEffectivePermissionCodesByAzureId('azure-id');

      expect(result).toContain('PERMISSION_CODE');
    });

    it('should return empty array when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.getEffectivePermissionCodesByAzureId('non-existent-id');

      expect(result).toHaveLength(0);
    });

  describe('syncUserRoleAssignments', () => {
    it('should deactivate all active roles and activate target role', async () => {
      const userId = 'user-id';
      const targetRole = UserRole.ContactManager;
      const mockRole = createMockRole({ id: 'contact-manager-role-id', name: targetRole });

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaClient.userRoleAssignment.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await repository.syncUserRoleAssignments(userId, targetRole);

      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { name: targetRole }
      });
      expect(mockPrismaClient.userRoleAssignment.updateMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        data: { isActive: false, updatedAt: mockDate }
      });
      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId,
            roleId: mockRole.id
          }
        },
        update: {
          isActive: true,
          updatedAt: mockDate
        },
        create: {
          userId,
          roleId: mockRole.id,
          isActive: true,
          assignedAt: mockDate,
          createdAt: mockDate,
          updatedAt: mockDate
        }
      });
    });

    it('should create new role assignment when it does not exist', async () => {
      const userId = 'user-id';
      const targetRole = UserRole.PSO;
      const mockRole = createMockRole({ id: 'pso-role-id', name: targetRole });

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaClient.userRoleAssignment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await repository.syncUserRoleAssignments(userId, targetRole);

      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId,
            roleId: mockRole.id,
            isActive: true
          })
        })
      );
    });

    it('should reactivate existing inactive role assignment', async () => {
      const userId = 'user-id';
      const targetRole = UserRole.Admin;
      const mockRole = createMockRole({ id: 'admin-role-id', name: targetRole });

      mockPrismaClient.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaClient.userRoleAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.userRoleAssignment.upsert.mockResolvedValue({} as any);

      await repository.syncUserRoleAssignments(userId, targetRole);

      expect(mockPrismaClient.userRoleAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            isActive: true,
            updatedAt: mockDate
          }
        })
      );
    });

    it('should handle role not found gracefully', async () => {
      const userId = 'user-id';
      const targetRole = UserRole.Supervisor;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockPrismaClient.role.findUnique.mockResolvedValue(null);

      await repository.syncUserRoleAssignments(userId, targetRole);

      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { name: targetRole }
      });
      expect(mockPrismaClient.userRoleAssignment.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.userRoleAssignment.upsert).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Role "${targetRole}" not found`)
      );

      consoleWarnSpy.mockRestore();
    });
  });

    it('should include permissions from legacy role', async () => {
      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        role: UserRole.PSO,
        userRoleAssignments: [],
      });

      const prismaRole = createMockRole({
        name: UserRole.PSO,
        rolePermissions: [
          {
            granted: true,
            permission: {
              id: 'perm-id',
              code: 'LEGACY_PERMISSION',
              isActive: true,
            },
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);
      mockPrismaClient.role.findUnique.mockResolvedValue(prismaRole);

      const result = await repository.getEffectivePermissionCodesByAzureId('azure-id');

      expect(result).toContain('LEGACY_PERMISSION');
    });

    it('should filter out inactive permissions', async () => {
      const prismaPermission = {
        id: 'perm-id',
        code: 'INACTIVE_PERMISSION',
        isActive: false,
      };

      const prismaRole = createMockRole({
        name: UserRole.PSO,
        rolePermissions: [
          {
            granted: true,
            permission: prismaPermission,
          },
        ],
      });

      const prismaUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        role: UserRole.PSO,
        userRoleAssignments: [
          {
            role: prismaRole,
            isActive: true,
            assignedAt: mockDate,
          },
        ],
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.getEffectivePermissionCodesByAzureId('azure-id');

      expect(result).not.toContain('INACTIVE_PERMISSION');
    });
  });
});

