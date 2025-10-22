import { UserQueryRequest } from '../../../../../shared/domain/value-objects/UserQueryRequest';
import { ValidationError } from '../../../../../shared/domain/errors/DomainError';
import { ValidationErrorCode } from '../../../../../shared/domain/errors/ErrorCodes';

// Mock UserRole enum since it's not available in test environment
const UserRole = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Supervisor: 'Supervisor',
  Employee: 'Employee',
  ContactManager: 'ContactManager',
  Unassigned: 'Unassigned'
} as const;

jest.mock('@prisma/client', () => ({
  UserRole: {
    SuperAdmin: 'SuperAdmin',
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    ContactManager: 'ContactManager',
    Unassigned: 'Unassigned'
  }
}));

describe('UserQueryRequest', () => {
  describe('constructor', () => {
    it('should create request with valid parameters', () => {
      const roles = [UserRole.SuperAdmin, UserRole.Admin];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.roles).toEqual(roles);
      expect(request.page).toBe(1);
      expect(request.pageSize).toBe(50);
      expect(request.timestamp).toBeInstanceOf(Date);
    });

    it('should create request with null roles', () => {
      const roles = [null, UserRole.Employee];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.roles).toEqual(roles);
      expect(request.page).toBe(1);
      expect(request.pageSize).toBe(50);
    });

    it('should normalize page to minimum value of 1', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 0, 50);

      expect(request.page).toBe(1);
    });

    it('should normalize page to minimum value of 1 for negative values', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, -5, 50);

      expect(request.page).toBe(1);
    });

    it('should normalize pageSize to minimum value of 1', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 0);

      expect(request.pageSize).toBe(1);
    });

    it('should normalize pageSize to maximum value of 1000', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 2000);

      expect(request.pageSize).toBe(1000);
    });

    it('should handle different role combinations', () => {
      const roles1 = [UserRole.SuperAdmin];
      const roles2 = [UserRole.Admin, UserRole.Supervisor];
      const roles3 = [UserRole.Employee, UserRole.ContactManager];
      const roles4 = [null, UserRole.Employee];

      const request1 = new UserQueryRequest(roles1, 1, 50);
      const request2 = new UserQueryRequest(roles2, 1, 50);
      const request3 = new UserQueryRequest(roles3, 1, 50);
      const request4 = new UserQueryRequest(roles4, 1, 50);

      expect(request1.roles).toEqual(roles1);
      expect(request2.roles).toEqual(roles2);
      expect(request3.roles).toEqual(roles3);
      expect(request4.roles).toEqual(roles4);
    });
  });

  describe('fromQueryString', () => {
    it('should create request from valid query string', () => {
      const query = {
        role: 'SuperAdmin,Admin',
        page: '2',
        pageSize: '25'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.SuperAdmin, UserRole.Admin]);
      expect(request.page).toBe(2);
      expect(request.pageSize).toBe(25);
    });

    it('should create request from single role', () => {
      const query = {
        role: 'Employee',
        page: '1',
        pageSize: '50'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.Employee]);
      expect(request.page).toBe(1);
      expect(request.pageSize).toBe(50);
    });

    it('should handle null role mapping', () => {
      const query = {
        role: 'null',
        page: '1',
        pageSize: '50'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([null]);
    });

    it('should handle Unassigned role mapping to null', () => {
      const query = {
        role: 'Unassigned',
        page: '1',
        pageSize: '50'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([null]);
    });

    it('should handle mixed roles including null', () => {
      const query = {
        role: 'SuperAdmin,null,Employee',
        page: '1',
        pageSize: '50'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.SuperAdmin, null, UserRole.Employee]);
    });

    it('should handle empty page and pageSize with defaults', () => {
      const query = {
        role: 'SuperAdmin'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.SuperAdmin]);
      expect(request.page).toBe(1);
      expect(request.pageSize).toBe(50);
    });

    it('should trim whitespace from roles', () => {
      const query = {
        role: ' SuperAdmin , Admin , Employee ',
        page: '1',
        pageSize: '50'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.SuperAdmin, UserRole.Admin, UserRole.Employee]);
    });

    it('should throw error for empty role parameter', () => {
      const query = {
        role: '',
        page: '1',
        pageSize: '50'
      };

      expect(() => {
        UserQueryRequest.fromQueryString(query);
      }).toThrow(ValidationError);
    });

    it('should throw error for missing role parameter', () => {
      const query = {
        page: '1',
        pageSize: '50'
      };

      expect(() => {
        UserQueryRequest.fromQueryString(query);
      }).toThrow(ValidationError);
    });

    it('should throw error for invalid role', () => {
      const query = {
        role: 'InvalidRole',
        page: '1',
        pageSize: '50'
      };

      expect(() => {
        UserQueryRequest.fromQueryString(query);
      }).toThrow(ValidationError);
    });

    it('should throw error for mixed valid and invalid roles', () => {
      const query = {
        role: 'SuperAdmin,InvalidRole,Admin',
        page: '1',
        pageSize: '50'
      };

      expect(() => {
        UserQueryRequest.fromQueryString(query);
      }).toThrow(ValidationError);
    });
  });

  describe('hasNullRole', () => {
    it('should return true when null role is present', () => {
      const roles = [UserRole.SuperAdmin, null, UserRole.Admin];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.hasNullRole()).toBe(true);
    });

    it('should return false when no null role is present', () => {
      const roles = [UserRole.SuperAdmin, UserRole.Admin];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.hasNullRole()).toBe(false);
    });

    it('should return true when only null role is present', () => {
      const roles = [null];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.hasNullRole()).toBe(true);
    });
  });

  describe('getPrismaRoles', () => {
    it('should return only non-null roles', () => {
      const roles = [UserRole.SuperAdmin, null, UserRole.Admin, null];
      const request = new UserQueryRequest(roles, 1, 50);

      const prismaRoles = request.getPrismaRoles();

      expect(prismaRoles).toEqual([UserRole.SuperAdmin, UserRole.Admin]);
    });

    it('should return empty array when only null roles', () => {
      const roles = [null, null];
      const request = new UserQueryRequest(roles, 1, 50);

      const prismaRoles = request.getPrismaRoles();

      expect(prismaRoles).toEqual([]);
    });

    it('should return all roles when no null roles', () => {
      const roles = [UserRole.SuperAdmin, UserRole.Admin, UserRole.Employee];
      const request = new UserQueryRequest(roles, 1, 50);

      const prismaRoles = request.getPrismaRoles();

      expect(prismaRoles).toEqual([UserRole.SuperAdmin, UserRole.Admin, UserRole.Employee]);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const roles = [UserRole.SuperAdmin, null, UserRole.Admin];
      const request = new UserQueryRequest(roles, 2, 25);

      const payload = request.toPayload();

      expect(payload).toEqual({
        roles: ['SuperAdmin', 'null', 'Admin'],
        page: 2,
        pageSize: 25
      });
    });

    it('should convert null roles to string "null"', () => {
      const roles = [null, UserRole.Employee];
      const request = new UserQueryRequest(roles, 1, 50);

      const payload = request.toPayload();

      expect(payload.roles).toEqual(['null', 'Employee']);
    });

    it('should return immutable payload', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 50);

      const payload = request.toPayload();
      payload.page = 999;

      expect(request.page).toBe(1);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(() => {
        (request as any).roles = [UserRole.Admin];
      }).toThrow();
      expect(() => {
        (request as any).page = 999;
      }).toThrow();
      expect(() => {
        (request as any).pageSize = 999;
      }).toThrow();
      expect(() => {
        (request as any).timestamp = new Date();
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty roles array', () => {
      const roles: (typeof UserRole[keyof typeof UserRole] | null)[] = [];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.roles).toEqual([]);
      expect(request.hasNullRole()).toBe(false);
      expect(request.getPrismaRoles()).toEqual([]);
    });

    it('should handle very large page numbers', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 999999, 50);

      expect(request.page).toBe(999999);
    });

    it('should handle very large pageSize values', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 999999);

      expect(request.pageSize).toBe(1000);
    });

    it('should handle decimal page values', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 2.5, 50);

      expect(request.page).toBe(2.5);
    });

    it('should handle decimal pageSize values', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 25.7);

      expect(request.pageSize).toBe(25.7);
    });

    it('should handle all UserRole values', () => {
      const roles = [
        UserRole.SuperAdmin,
        UserRole.Admin,
        UserRole.Supervisor,
        UserRole.Employee,
        UserRole.ContactManager,
        UserRole.Unassigned
      ];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.roles).toEqual(roles);
    });
  });

  describe('type safety', () => {
    it('should accept UserRole array for roles', () => {
      const roles = [UserRole.SuperAdmin, UserRole.Admin];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.roles).toEqual(roles);
    });

    it('should accept number for page', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 5, 50);

      expect(typeof request.page).toBe('number');
    });

    it('should accept number for pageSize', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 100);

      expect(typeof request.pageSize).toBe('number');
    });

    it('should return Date for timestamp', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 50);

      expect(request.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('validation scenarios', () => {
    it('should handle admin user query scenario', () => {
      const query = {
        role: 'Admin,Supervisor',
        page: '1',
        pageSize: '100'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.Admin, UserRole.Supervisor]);
      expect(request.page).toBe(1);
      expect(request.pageSize).toBe(100);
      expect(request.hasNullRole()).toBe(false);
      expect(request.getPrismaRoles()).toEqual([UserRole.Admin, UserRole.Supervisor]);
    });

    it('should handle unassigned users query scenario', () => {
      const query = {
        role: 'null',
        page: '1',
        pageSize: '50'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([null]);
      expect(request.hasNullRole()).toBe(true);
      expect(request.getPrismaRoles()).toEqual([]);
    });

    it('should handle mixed roles query scenario', () => {
      const query = {
        role: 'SuperAdmin,null,Employee',
        page: '2',
        pageSize: '25'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.roles).toEqual([UserRole.SuperAdmin, null, UserRole.Employee]);
      expect(request.hasNullRole()).toBe(true);
      expect(request.getPrismaRoles()).toEqual([UserRole.SuperAdmin, UserRole.Employee]);
    });

    it('should handle pagination scenario', () => {
      const query = {
        role: 'Employee',
        page: '3',
        pageSize: '20'
      };

      const request = UserQueryRequest.fromQueryString(query);

      expect(request.page).toBe(3);
      expect(request.pageSize).toBe(20);
    });

    it('should handle large page size scenario', () => {
      const roles = [UserRole.SuperAdmin];
      const request = new UserQueryRequest(roles, 1, 2000);

      expect(request.pageSize).toBe(1000);
    });

    it('should handle invalid role error scenario', () => {
      const query = {
        role: 'InvalidRole',
        page: '1',
        pageSize: '50'
      };

      expect(() => {
        UserQueryRequest.fromQueryString(query);
      }).toThrow('Invalid role: InvalidRole');
    });

    it('should handle missing role error scenario', () => {
      const query = {
        page: '1',
        pageSize: '50'
      };

      expect(() => {
        UserQueryRequest.fromQueryString(query);
      }).toThrow('Role parameter is required');
    });
  });
});
