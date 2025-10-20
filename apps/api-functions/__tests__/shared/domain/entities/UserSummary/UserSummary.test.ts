/**
 * @fileoverview UserSummary entity - unit tests
 */

// Mock UserRole enum globally
jest.mock('@prisma/client', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    SuperAdmin: 'SuperAdmin',
    ContactManager: 'ContactManager',
    Unassigned: 'Unassigned'
  }
}));

import { UserSummary, UserSummaryData } from '../../../../../shared/domain/entities/UserSummary';
import { UserRole } from '@prisma/client';

describe('UserSummary', () => {
  const baseUserData: UserSummaryData = {
    azureAdObjectId: 'azure123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.Employee
  };

  describe('constructor', () => {
    it('creates user summary with all required properties', () => {
      const userSummary = new UserSummary(baseUserData);
      
      expect(userSummary.azureAdObjectId).toBe('azure123');
      expect(userSummary.email).toBe('test@example.com');
      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('Doe');
      expect(userSummary.role).toBe(UserRole.Employee);
    });

    it('creates user summary with optional supervisor properties', () => {
      const userDataWithSupervisor = {
        ...baseUserData,
        supervisorAdId: 'supervisor123',
        supervisorName: 'Supervisor Name'
      };
      
      const userSummary = new UserSummary(userDataWithSupervisor);
      
      expect(userSummary.supervisorAdId).toBe('supervisor123');
      expect(userSummary.supervisorName).toBe('Supervisor Name');
    });

    it('handles null role', () => {
      const userDataWithNullRole = {
        ...baseUserData,
        role: null
      };
      
      const userSummary = new UserSummary(userDataWithNullRole);
      expect(userSummary.role).toBeNull();
    });
  });

  describe('fromPrismaUser', () => {
    it('creates user summary from Prisma user without supervisor', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: 'John Doe',
        role: UserRole.Employee
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.azureAdObjectId).toBe('azure123');
      expect(userSummary.email).toBe('test@example.com');
      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('Doe');
      expect(userSummary.role).toBe(UserRole.Employee);
      expect(userSummary.supervisorAdId).toBeUndefined();
      expect(userSummary.supervisorName).toBeUndefined();
    });

    it('creates user summary from Prisma user with supervisor', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: 'John Doe',
        role: UserRole.Employee,
        supervisor: {
          azureAdObjectId: 'supervisor123',
          fullName: 'Supervisor Name'
        }
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.supervisorAdId).toBe('supervisor123');
      expect(userSummary.supervisorName).toBe('Supervisor Name');
    });

    it('handles single name in fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: 'John',
        role: UserRole.Employee
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('');
    });

    it('handles empty fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: '',
        role: UserRole.Employee
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.firstName).toBe('');
      expect(userSummary.lastName).toBe('');
    });

    it('handles null fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: null,
        role: UserRole.Employee
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.firstName).toBe('');
      expect(userSummary.lastName).toBe('');
    });

    it('handles multiple spaces in fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: 'John   Michael   Doe',
        role: UserRole.Employee
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.firstName).toBe('John');
      expect(userSummary.lastName).toBe('Michael');
    });

    it('handles whitespace-only fullName', () => {
      const prismaUser = {
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: '   ',
        role: UserRole.Employee
      };

      const userSummary = UserSummary.fromPrismaUser(prismaUser);
      
      expect(userSummary.firstName).toBe('');
      expect(userSummary.lastName).toBe('');
    });
  });

  describe('splitName static method', () => {
    it('splits normal full name correctly', () => {
      const result = (UserSummary as any).splitName('John Doe');
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('handles single name', () => {
      const result = (UserSummary as any).splitName('John');
      expect(result).toEqual({ firstName: 'John', lastName: '' });
    });

    it('handles empty string', () => {
      const result = (UserSummary as any).splitName('');
      expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('handles multiple spaces', () => {
      const result = (UserSummary as any).splitName('John   Doe');
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('handles whitespace-only string', () => {
      const result = (UserSummary as any).splitName('   ');
      expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('handles null fullName', () => {
      const result = (UserSummary as any).splitName(null);
      expect(result).toEqual({ firstName: '', lastName: '' });
    });

    it('handles undefined fullName', () => {
      const result = (UserSummary as any).splitName(undefined);
      expect(result).toEqual({ firstName: '', lastName: '' });
    });
  });
});
