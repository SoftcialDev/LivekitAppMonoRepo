/**
 * @fileoverview Tests for UserRepository
 * @description Tests for user data access operations
 */

import { UserRepository } from '../../../../shared/infrastructure/repositories/UserRepository';
import { User } from '../../../../shared/domain/entities/User';
import { ContactManagerProfile } from '../../../../shared/domain/entities/ContactManagerProfile';
import { SuperAdminProfile } from '../../../../shared/domain/entities/SuperAdminProfile';

// Mock UserRole
jest.mock('@prisma/client', () => ({
  UserRole: {
    Employee: 'Employee',
    ContactManager: 'ContactManager',
    Admin: 'Admin',
    SuperAdmin: 'SuperAdmin',
    Unassigned: 'Unassigned'
  },
  ContactManagerStatus: {
    Active: 'Active',
    Inactive: 'Inactive'
  }
}));

import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn()
  },
  contactManagerProfile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  contactManagerStatusHistory: {
    create: jest.fn()
  },
  auditLog: {
    create: jest.fn()
  },
  $transaction: jest.fn()
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00Z'))
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockPrismaUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new UserRepository();

    mockPrismaUser = {
      id: 'user-123',
      azureAdObjectId: 'azure-oid-123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'Employee',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z'),
      deletedAt: null
    };
  });

  describe('constructor', () => {
    it('should create UserRepository instance', () => {
      expect(userRepository).toBeInstanceOf(UserRepository);
    });
  });

  describe('findByAzureAdObjectId', () => {
    it('should find user by Azure AD object ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.findByAzureAdObjectId('azure-oid-123');

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { azureAdObjectId: 'azure-oid-123' }
      });
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.findByAzureAdObjectId('non-existent-oid');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should normalize email to lowercase', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });
  });

  describe('findById', () => {
    it('should find user by database ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.findById('user-123');

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
    });
  });

  describe('findAllUsers', () => {
    it('should find all users', async () => {
      const mockUsers = [mockPrismaUser, { ...mockPrismaUser, id: 'user-456' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userRepository.findAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[1]).toBeInstanceOf(User);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('existsAndActive', () => {
    it('should return true for active user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.existsAndActive('azure-oid-123');

      expect(result).toBe(true);
    });

    it('should return false for inactive user', async () => {
      const inactiveUser = { ...mockPrismaUser, deletedAt: new Date() };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      const result = await userRepository.existsAndActive('azure-oid-123');

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.hasRole('azure-oid-123', 'Employee' as any);

      expect(result).toBe(true);
    });

    it('should return false when user does not have the role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.hasRole('azure-oid-123', 'Admin' as any);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the roles', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.hasAnyRole('azure-oid-123', ['Employee', 'Admin'] as any[]);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.hasAnyRole('azure-oid-123', ['Admin', 'SuperAdmin'] as any[]);

      expect(result).toBe(false);
    });
  });

  describe('isEmployee', () => {
    it('should return true for employee', async () => {
      const employeeUser = { ...mockPrismaUser, role: 'Employee' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(employeeUser);

      const result = await userRepository.isEmployee('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false for non-employee', async () => {
      const adminUser = { ...mockPrismaUser, role: 'Admin' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(adminUser);

      const result = await userRepository.isEmployee('test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('createEmployee', () => {
    it('should create a new employee', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.createEmployee('newuser@example.com', 'New User', 'supervisor-123');

      expect(result).toBeInstanceOf(User);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          fullName: 'New User',
          role: 'Employee',
          supervisorId: 'supervisor-123',
          azureAdObjectId: '',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should create employee without supervisor', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.createEmployee('newuser@example.com', 'New User');

      expect(result).toBeInstanceOf(User);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          fullName: 'New User',
          role: 'Employee',
          supervisorId: null,
          azureAdObjectId: '',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('updateSupervisor', () => {
    it('should update user supervisor', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.updateSupervisor('test@example.com', 'supervisor-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          supervisorId: 'supervisor-123',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should remove supervisor when null', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.updateSupervisor('test@example.com', null);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          supervisorId: null,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.deleteUser('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('updateMultipleSupervisors', () => {
    it('should update multiple supervisors in transaction', async () => {
      const updates = [
        { email: 'user1@example.com', supervisorId: 'supervisor-1' },
        { email: 'user2@example.com', supervisorId: 'supervisor-2' }
      ];
      
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      await userRepository.updateMultipleSupervisors(updates);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('upsertUser', () => {
    it('should upsert user with active role', async () => {
      const userData = {
        email: 'test@example.com',
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
        role: 'Employee' as any
      };
      
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.upsertUser(userData);

      expect(result).toBeInstanceOf(User);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: {
          azureAdObjectId: 'azure-123',
          fullName: 'Test User',
          role: 'Employee',
          deletedAt: null,
          updatedAt: expect.any(Date)
        },
        create: {
          email: 'test@example.com',
          azureAdObjectId: 'azure-123',
          fullName: 'Test User',
          role: 'Employee',
          deletedAt: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should upsert user with unassigned role', async () => {
      const userData = {
        email: 'test@example.com',
        azureAdObjectId: 'azure-123',
        fullName: 'Test User',
        role: 'Unassigned' as any
      };
      
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.upsertUser(userData);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: {
          azureAdObjectId: 'azure-123',
          fullName: 'Test User',
          role: 'Unassigned',
          deletedAt: undefined,
          updatedAt: expect.any(Date)
        },
        create: {
          email: 'test@example.com',
          azureAdObjectId: 'azure-123',
          fullName: 'Test User',
          role: 'Unassigned',
          deletedAt: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('findByRoles', () => {
    it('should find users by roles', async () => {
      const mockUsers = [
        { ...mockPrismaUser, role: 'Employee' },
        { ...mockPrismaUser, id: 'user-2', role: 'Admin' }
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userRepository.findByRoles(['Employee', 'Admin'] as any[]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[1]).toBeInstanceOf(User);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['Employee', 'Admin'] } },
        include: {
          supervisor: {
            select: { azureAdObjectId: true, fullName: true }
          }
        },
        orderBy: { fullName: 'asc' }
      });
    });
  });

  describe('findByRolesWithSupervisor', () => {
    it('should find users by roles with supervisor info', async () => {
      const mockUsers = [{ ...mockPrismaUser, role: 'Employee' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userRepository.findByRolesWithSupervisor(['Employee'] as any[]);

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['Employee'] } },
        include: {
          supervisor: {
            select: { azureAdObjectId: true, fullName: true }
          }
        },
        orderBy: { fullName: 'asc' }
      });
    });
  });

  describe('findUsersWithUnassignedRole', () => {
    it('should find users with unassigned role', async () => {
      const mockUsers = [{ ...mockPrismaUser, role: 'Unassigned' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userRepository.findUsersWithUnassignedRole();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(User);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'Unassigned' },
        include: {
          supervisor: {
            select: { azureAdObjectId: true, fullName: true }
          }
        },
        orderBy: { fullName: 'asc' }
      });
    });
  });

  describe('findUsersWithUnassignedRoleWithSupervisor', () => {
    it('should find users with unassigned role with supervisor info', async () => {
      const mockUsers = [{ ...mockPrismaUser, role: 'Unassigned' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userRepository.findUsersWithUnassignedRoleWithSupervisor();

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'Unassigned' },
        include: {
          supervisor: {
            select: { azureAdObjectId: true, fullName: true }
          }
        },
        orderBy: { fullName: 'asc' }
      });
    });
  });

  describe('changeUserRole', () => {
    it('should change user role to active role', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.changeUserRole('user-123', 'Employee' as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          role: 'Employee',
          deletedAt: null,
          roleChangedAt: expect.any(Date)
        }
      });
    });

    it('should change user role to unassigned role', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockPrismaUser);

      await userRepository.changeUserRole('user-123', 'Unassigned' as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          role: 'Unassigned',
          deletedAt: undefined,
          roleChangedAt: expect.any(Date)
        }
      });
    });
  });

  describe('createContactManager', () => {
    it('should create contact manager', async () => {
      const userData = {
        azureAdObjectId: 'azure-123',
        email: 'cm@example.com',
        fullName: 'Contact Manager'
      };
      
      (prisma.user.create as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.createContactManager(userData);

      expect(result).toBeInstanceOf(User);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          azureAdObjectId: 'azure-123',
          email: 'cm@example.com',
          fullName: 'Contact Manager',
          role: 'ContactManager',
          roleChangedAt: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('createContactManagerProfile', () => {
    it('should create contact manager profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (prisma.contactManagerProfile.create as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userRepository.createContactManagerProfile('user-123', 'Active' as any);

      expect(result).toBeInstanceOf(ContactManagerProfile);
      expect(prisma.contactManagerProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          status: 'Active',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('createContactManagerStatusHistory', () => {
    it('should create contact manager status history', async () => {
      const data = {
        profileId: 'profile-123',
        previousStatus: 'Active' as any,
        newStatus: 'Inactive' as any,
        changedById: 'user-123'
      };

      (prisma.contactManagerStatusHistory.create as jest.Mock).mockResolvedValue(undefined);

      await userRepository.createContactManagerStatusHistory(data);

      expect(prisma.contactManagerStatusHistory.create).toHaveBeenCalledWith({
        data: {
          profileId: 'profile-123',
          previousStatus: 'Active',
          newStatus: 'Inactive',
          changedById: 'user-123',
          timestamp: expect.any(Date)
        }
      });
    });
  });

  describe('createSuperAdmin', () => {
    it('should create super admin', async () => {
      const userData = {
        azureAdObjectId: 'azure-123',
        email: 'admin@example.com',
        fullName: 'Super Admin'
      };
      
      (prisma.user.create as jest.Mock).mockResolvedValue(mockPrismaUser);

      const result = await userRepository.createSuperAdmin(userData);

      expect(result).toBeInstanceOf(User);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          azureAdObjectId: 'azure-123',
          email: 'admin@example.com',
          fullName: 'Super Admin',
          role: 'SuperAdmin',
          roleChangedAt: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('createSuperAdminAuditLog', () => {
    it('should create super admin audit log', async () => {
      const data = {
        profileId: 'profile-123',
        action: 'CREATE',
        changedById: 'user-123'
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(undefined);

      await userRepository.createSuperAdminAuditLog(data);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entity: 'SuperAdmin',
          entityId: 'profile-123',
          action: 'CREATE',
          changedById: 'user-123',
          timestamp: expect.any(Date)
        }
      });
    });
  });

  describe('findContactManagerProfile', () => {
    it('should find contact manager profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        status: 'Active',
        user: mockPrismaUser
      };
      
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userRepository.findContactManagerProfile('profile-123');

      expect(result).toBeInstanceOf(ContactManagerProfile);
      expect(prisma.contactManagerProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
        include: { user: true }
      });
    });

    it('should return null when profile not found', async () => {
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.findContactManagerProfile('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteContactManagerProfile', () => {
    it('should delete contact manager profile', async () => {
      (prisma.contactManagerProfile.delete as jest.Mock).mockResolvedValue(undefined);

      await userRepository.deleteContactManagerProfile('profile-123');

      expect(prisma.contactManagerProfile.delete).toHaveBeenCalledWith({
        where: { id: 'profile-123' }
      });
    });
  });

  describe('createContactManagerAuditLog', () => {
    it('should create contact manager audit log', async () => {
      const data = {
        profileId: 'profile-123',
        action: 'CREATE',
        changedById: 'user-123'
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(undefined);

      await userRepository.createContactManagerAuditLog(data);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entity: 'ContactManager',
          entityId: 'profile-123',
          action: 'CREATE',
          changedById: 'user-123',
          timestamp: expect.any(Date)
        }
      });
    });
  });

  describe('findContactManagerProfileByUserId', () => {
    it('should find contact manager profile by user ID', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        status: 'Active',
        user: {
          email: 'cm@example.com',
          fullName: 'Contact Manager'
        }
      };
      
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userRepository.findContactManagerProfileByUserId('user-123');

      expect(result).toBeInstanceOf(ContactManagerProfile);
      expect(prisma.contactManagerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should return null when profile not found', async () => {
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.findContactManagerProfileByUserId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateContactManagerStatus', () => {
    it('should update contact manager status', async () => {
      (prisma.contactManagerProfile.update as jest.Mock).mockResolvedValue(undefined);

      await userRepository.updateContactManagerStatus('profile-123', 'Inactive' as any);

      expect(prisma.contactManagerProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
        data: {
          status: 'Inactive',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('findAllContactManagers', () => {
    it('should find all contact managers', async () => {
      const mockContactManagerProfile = {
        id: 'profile-123',
        userId: 'user-123',
        status: 'Active',
        user: {
          id: 'user-123',
          email: 'contact@example.com',
          fullName: 'Contact Manager'
        }
      };
      (prisma.contactManagerProfile.findMany as jest.Mock).mockResolvedValue([mockContactManagerProfile]);

      const result = await userRepository.findAllContactManagers();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ContactManagerProfile);
      expect(prisma.contactManagerProfile.findMany).toHaveBeenCalledWith({
        include: { 
          user: { 
            select: { 
              email: true, 
              fullName: true 
            } 
          } 
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return empty array when no contact managers found', async () => {
      (prisma.contactManagerProfile.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userRepository.findAllContactManagers();

      expect(result).toHaveLength(0);
    });
  });

  describe('findAllSuperAdmins', () => {
    it('should find all super admins', async () => {
      const superAdminUser = { ...mockPrismaUser, role: 'SuperAdmin' };
      (prisma.user.findMany as jest.Mock).mockResolvedValue([superAdminUser]);

      const result = await userRepository.findAllSuperAdmins();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SuperAdminProfile);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'SuperAdmin' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return empty array when no super admins found', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userRepository.findAllSuperAdmins();

      expect(result).toHaveLength(0);
    });
  });

  describe('findBySupervisor', () => {
    it('should find users by supervisor', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockPrismaUser]);

      const result = await userRepository.findBySupervisor('supervisor-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(User);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { 
          supervisorId: 'supervisor-123',
          deletedAt: null
        }
      });
    });

    it('should return empty array when no users found for supervisor', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userRepository.findBySupervisor('supervisor-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPsosBySupervisor', () => {
    it('should get PSOs by supervisor ID', async () => {
      const mockSupervisor = {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: 'Supervisor',
        azureAdObjectId: 'azure-supervisor-123'
      };
      
      const mockEmployees = [
        {
          email: 'employee1@example.com',
          supervisor: { fullName: 'Supervisor' }
        },
        {
          email: 'employee2@example.com',
          supervisor: { fullName: 'Supervisor' }
        }
      ];

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockSupervisor)
        .mockResolvedValueOnce(null);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await userRepository.getPsosBySupervisor('azure-supervisor-123');

      expect(result).toEqual([
        { email: 'employee1@example.com', supervisorName: 'Supervisor' },
        { email: 'employee2@example.com', supervisorName: 'Supervisor' }
      ]);
    });

    it('should get all PSOs when no supervisor ID provided', async () => {
      const mockEmployees = [
        {
          email: 'employee1@example.com',
          supervisor: { fullName: 'Supervisor 1' }
        }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await userRepository.getPsosBySupervisor();

      expect(result).toEqual([
        { email: 'employee1@example.com', supervisorName: 'Supervisor 1' }
      ]);
    });

    it('should return empty array when supervisor not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getPsosBySupervisor('non-existent');

      expect(result).toEqual([]);
    });

    it('should return empty array when user is not a supervisor', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        fullName: 'User',
        role: 'Employee',
        azureAdObjectId: 'azure-user-123'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.getPsosBySupervisor('azure-user-123');

      expect(result).toEqual([]);
    });
  });
});