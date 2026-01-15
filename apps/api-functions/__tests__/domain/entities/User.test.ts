import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';
import * as dateUtils from '../../../src/utils/dateUtils';

describe('User', () => {
  const baseProps = {
    id: 'user-id',
    azureAdObjectId: 'azure-id',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.PSO,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAdmin', () => {
    it('should return true when user is active and role is Admin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: null,
      });

      expect(user.isAdmin()).toBe(true);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: new Date(),
      });

      expect(user.isAdmin()).toBe(false);
    });

    it('should return false when role is not Admin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.isAdmin()).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true when user is active and role is SuperAdmin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.SuperAdmin,
        deletedAt: null,
      });

      expect(user.isSuperAdmin()).toBe(true);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.SuperAdmin,
        deletedAt: new Date(),
      });

      expect(user.isSuperAdmin()).toBe(false);
    });
  });

  describe('isContactManager', () => {
    it('should return true when user is active and role is ContactManager', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.ContactManager,
        deletedAt: null,
      });

      expect(user.isContactManager()).toBe(true);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.ContactManager,
        deletedAt: new Date(),
      });

      expect(user.isContactManager()).toBe(false);
    });
  });

  describe('canSendCommands', () => {
    it('should return true when user is Admin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: null,
      });

      expect(user.canSendCommands()).toBe(true);
    });

    it('should return true when user is Supervisor', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Supervisor,
        deletedAt: null,
      });

      expect(user.canSendCommands()).toBe(true);
    });

    it('should return true when user is SuperAdmin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.SuperAdmin,
        deletedAt: null,
      });

      expect(user.canSendCommands()).toBe(true);
    });

    it('should return false when user is PSO', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.canSendCommands()).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: new Date(),
      });

      expect(user.canSendCommands()).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should return true when user can send commands', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: null,
      });

      expect(user.canManageUsers()).toBe(true);
    });

    it('should return false when user cannot send commands', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.canManageUsers()).toBe(false);
    });
  });

  describe('canAccessAdmin', () => {
    it('should return true when user is SuperAdmin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.SuperAdmin,
        deletedAt: null,
      });

      expect(user.canAccessAdmin()).toBe(true);
    });

    it('should return false when user is not SuperAdmin', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: null,
      });

      expect(user.canAccessAdmin()).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.SuperAdmin,
        deletedAt: new Date(),
      });

      expect(user.canAccessAdmin()).toBe(false);
    });
  });

  describe('canBeAssignedToSupervisor', () => {
    it('should return true when user is active PSO', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.canBeAssignedToSupervisor()).toBe(true);
    });

    it('should return false when user is not PSO', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Admin,
        deletedAt: null,
      });

      expect(user.canBeAssignedToSupervisor()).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: new Date(),
      });

      expect(user.canBeAssignedToSupervisor()).toBe(false);
    });
  });

  describe('hasSupervisor', () => {
    it('should return true when supervisorId is not null', () => {
      const user = new User({
        ...baseProps,
        supervisorId: 'supervisor-id',
      });

      expect(user.hasSupervisor()).toBe(true);
    });

    it('should return false when supervisorId is null', () => {
      const user = new User({
        ...baseProps,
        supervisorId: null,
      });

      expect(user.hasSupervisor()).toBe(false);
    });
  });

  describe('canBeSupervisor', () => {
    it('should return true when user is active Supervisor', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Supervisor,
        deletedAt: null,
      });

      expect(user.canBeSupervisor()).toBe(true);
    });

    it('should return false when user is not Supervisor', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.canBeSupervisor()).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.Supervisor,
        deletedAt: new Date(),
      });

      expect(user.canBeSupervisor()).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the roles', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.hasAnyRole([UserRole.PSO, UserRole.Admin])).toBe(true);
    });

    it('should return false when user does not have any of the roles', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.hasAnyRole([UserRole.Admin, UserRole.Supervisor])).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: new Date(),
      });

      expect(user.hasAnyRole([UserRole.PSO])).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.hasRole(UserRole.PSO)).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: null,
      });

      expect(user.hasRole(UserRole.Admin)).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = new User({
        ...baseProps,
        role: UserRole.PSO,
        deletedAt: new Date(),
      });

      expect(user.hasRole(UserRole.PSO)).toBe(false);
    });
  });

  describe('getCreatedAtFormatted', () => {
    it('should return formatted creation date', () => {
      const mockFormat = jest.spyOn(dateUtils, 'formatCentralAmericaTime').mockReturnValue('2024-01-01 10:00:00');
      const user = new User({
        ...baseProps,
        createdAt: new Date('2024-01-01T10:00:00Z'),
      });

      const formatted = user.getCreatedAtFormatted();
      expect(formatted).toBe('2024-01-01 10:00:00');
      expect(mockFormat).toHaveBeenCalledWith(baseProps.createdAt);

      mockFormat.mockRestore();
    });
  });

  describe('getUpdatedAtFormatted', () => {
    it('should return formatted update date', () => {
      const updatedAt = new Date('2024-01-01T11:00:00Z');
      const mockFormat = jest.spyOn(dateUtils, 'formatCentralAmericaTime').mockReturnValue('2024-01-01 11:00:00');
      const user = new User({
        ...baseProps,
        updatedAt,
      });

      const formatted = user.getUpdatedAtFormatted();
      expect(formatted).toBe('2024-01-01 11:00:00');
      expect(mockFormat).toHaveBeenCalledWith(updatedAt);

      mockFormat.mockRestore();
    });
  });

  describe('getDeletedAtFormatted', () => {
    it('should return formatted deletion date when deleted', () => {
      const deletedAt = new Date('2024-01-02T10:00:00Z');
      const mockFormat = jest.spyOn(dateUtils, 'formatCentralAmericaTime').mockReturnValue('2024-01-02 10:00:00');
      const user = new User({
        ...baseProps,
        deletedAt,
      });

      const formatted = user.getDeletedAtFormatted();
      expect(formatted).toBe('2024-01-02 10:00:00');
      expect(mockFormat).toHaveBeenCalledWith(deletedAt);

      mockFormat.mockRestore();
    });

    it('should return null when not deleted', () => {
      const user = new User({
        ...baseProps,
        deletedAt: null,
      });

      expect(user.getDeletedAtFormatted()).toBeNull();
    });
  });

  describe('getRoleChangedAtFormatted', () => {
    it('should return formatted role change date when changed', () => {
      const roleChangedAt = new Date('2024-01-02T10:00:00Z');
      const mockFormat = jest.spyOn(dateUtils, 'formatCentralAmericaTime').mockReturnValue('2024-01-02 10:00:00');
      const user = new User({
        ...baseProps,
        roleChangedAt,
      });

      const formatted = user.getRoleChangedAtFormatted();
      expect(formatted).toBe('2024-01-02 10:00:00');
      expect(mockFormat).toHaveBeenCalledWith(roleChangedAt);

      mockFormat.mockRestore();
    });

    it('should return null when role not changed', () => {
      const user = new User({
        ...baseProps,
        roleChangedAt: null,
      });

      expect(user.getRoleChangedAtFormatted()).toBeNull();
    });
  });

  describe('getAssignedAtFormatted', () => {
    it('should return formatted assignment date when assigned', () => {
      const assignedAt = new Date('2024-01-02T10:00:00Z');
      const mockFormat = jest.spyOn(dateUtils, 'formatCentralAmericaTime').mockReturnValue('2024-01-02 10:00:00');
      const user = new User({
        ...baseProps,
        assignedAt,
      });

      const formatted = user.getAssignedAtFormatted();
      expect(formatted).toBe('2024-01-02 10:00:00');
      expect(mockFormat).toHaveBeenCalledWith(assignedAt);

      mockFormat.mockRestore();
    });

    it('should return null when not assigned', () => {
      const user = new User({
        ...baseProps,
        assignedAt: null,
      });

      expect(user.getAssignedAtFormatted()).toBeNull();
    });
  });

  describe('getAccountAgeInDays', () => {
    it('should return age in days using Central America Time', () => {
      const mockGetCentralAmericaTime = jest.spyOn(dateUtils, 'getCentralAmericaTime').mockReturnValue(new Date('2024-01-03T10:00:00Z'));
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const user = new User({
        ...baseProps,
        createdAt,
      });

      const ageInDays = user.getAccountAgeInDays();
      expect(ageInDays).toBeGreaterThanOrEqual(1);
      expect(mockGetCentralAmericaTime).toHaveBeenCalled();

      mockGetCentralAmericaTime.mockRestore();
    });
  });

  describe('getTimeSinceLastUpdate', () => {
    it('should return time since last update in hours using Central America Time', () => {
      const mockGetCentralAmericaTime = jest.spyOn(dateUtils, 'getCentralAmericaTime').mockReturnValue(new Date('2024-01-01T12:00:00Z'));
      const updatedAt = new Date('2024-01-01T10:00:00Z');
      const user = new User({
        ...baseProps,
        updatedAt,
      });

      const timeSinceUpdate = user.getTimeSinceLastUpdate();
      expect(timeSinceUpdate).toBeGreaterThanOrEqual(1);
      expect(mockGetCentralAmericaTime).toHaveBeenCalled();

      mockGetCentralAmericaTime.mockRestore();
    });
  });
});

