import { UserRoleChangeRequest } from '../../../../../shared/domain/value-objects/UserRoleChangeRequest';

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

describe('UserRoleChangeRequest', () => {
  describe('constructor', () => {
    it('should create request with valid parameters', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.SuperAdmin,
        timestamp
      );

      expect(request.userEmail).toBe('user@example.com');
      expect(request.newRole).toBe(UserRole.SuperAdmin);
      expect(request.timestamp).toBe(timestamp);
    });

    it('should normalize email to lowercase', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'USER@EXAMPLE.COM',
        UserRole.Admin,
        timestamp
      );

      expect(request.userEmail).toBe('user@example.com');
    });

    it('should handle different role types', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request1 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Supervisor,
        timestamp
      );
      const request2 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Employee,
        timestamp
      );
      const request3 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.ContactManager,
        timestamp
      );

      expect(request1.newRole).toBe(UserRole.Supervisor);
      expect(request2.newRole).toBe(UserRole.Employee);
      expect(request3.newRole).toBe(UserRole.ContactManager);
    });

    it('should handle different email formats', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request1 = new UserRoleChangeRequest(
        'user@company.com',
        UserRole.Admin,
        timestamp
      );
      const request2 = new UserRoleChangeRequest(
        'admin@subdomain.example.com',
        UserRole.Admin,
        timestamp
      );

      expect(request1.userEmail).toBe('user@company.com');
      expect(request2.userEmail).toBe('admin@subdomain.example.com');
    });

    it('should handle different timestamps', () => {
      const timestamp1 = new Date('2023-12-01T10:00:00Z');
      const timestamp2 = new Date('2023-12-01T11:30:00Z');
      const request1 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp1
      );
      const request2 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp2
      );

      expect(request1.timestamp).toBe(timestamp1);
      expect(request2.timestamp).toBe(timestamp2);
    });
  });

  describe('fromRequest', () => {
    it('should create request from valid payload', () => {
      const payload = {
        userEmail: 'user@example.com',
        newRole: UserRole.SuperAdmin
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('user@example.com');
      expect(request.newRole).toBe(UserRole.SuperAdmin);
      expect(request.timestamp).toBeInstanceOf(Date);
    });

    it('should normalize email to lowercase from payload', () => {
      const payload = {
        userEmail: 'USER@EXAMPLE.COM',
        newRole: UserRole.Admin
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('user@example.com');
    });

    it('should handle different role types from payload', () => {
      const payload1 = {
        userEmail: 'user@example.com',
        newRole: UserRole.Supervisor
      };
      const payload2 = {
        userEmail: 'user@example.com',
        newRole: UserRole.Employee
      };

      const request1 = UserRoleChangeRequest.fromRequest(payload1);
      const request2 = UserRoleChangeRequest.fromRequest(payload2);

      expect(request1.newRole).toBe(UserRole.Supervisor);
      expect(request2.newRole).toBe(UserRole.Employee);
    });

    it('should generate timestamp automatically', () => {
      const payload = {
        userEmail: 'user@example.com',
        newRole: UserRole.Admin
      };

      const beforeTime = new Date();
      const request = UserRoleChangeRequest.fromRequest(payload);
      const afterTime = new Date();

      expect(request.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(request.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('getRoleName', () => {
    it('should return role name as string', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.SuperAdmin,
        timestamp
      );

      expect(request.getRoleName()).toBe(UserRole.SuperAdmin);
    });

    it('should return different role names for different roles', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request1 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp
      );
      const request2 = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Supervisor,
        timestamp
      );

      expect(request1.getRoleName()).toBe(UserRole.Admin);
      expect(request2.getRoleName()).toBe(UserRole.Supervisor);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.SuperAdmin,
        timestamp
      );

      const payload = request.toPayload();

      expect(payload).toEqual({
        userEmail: 'user@example.com',
        newRole: UserRole.SuperAdmin,
        timestamp: '2023-12-01T10:00:00.000Z'
      });
    });

    it('should convert timestamp to ISO string', () => {
      const timestamp = new Date('2023-12-01T11:30:45.123Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp
      );

      const payload = request.toPayload();

      expect(payload.timestamp).toBe('2023-12-01T11:30:45.123Z');
    });

    it('should return immutable payload', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.SuperAdmin,
        timestamp
      );

      const payload = request.toPayload();
      payload.userEmail = 'other@example.com';

      expect(request.userEmail).toBe('user@example.com');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.SuperAdmin,
        timestamp
      );

      expect(() => {
        (request as any).userEmail = 'other@example.com';
      }).toThrow();
      expect(() => {
        (request as any).newRole = UserRole.Admin;
      }).toThrow();
      expect(() => {
        (request as any).timestamp = new Date();
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle email with special characters', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user+tag@example.com',
        UserRole.Admin,
        timestamp
      );

      expect(request.userEmail).toBe('user+tag@example.com');
    });

    it('should handle email with unicode characters', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        '测试@example.com',
        UserRole.Admin,
        timestamp
      );

      expect(request.userEmail).toBe('测试@example.com');
    });

    it('should handle long email addresses', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const longEmail = 'very.long.email.address.with.many.parts@very.long.domain.name.example.com';
      const request = new UserRoleChangeRequest(
        longEmail,
        UserRole.Admin,
        timestamp
      );

      expect(request.userEmail).toBe(longEmail);
    });

    it('should handle Unassigned role', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Unassigned,
        timestamp
      );

      expect(request.newRole).toBe(UserRole.Unassigned);
      expect(request.getRoleName()).toBe(UserRole.Unassigned);
    });

    it('should handle empty email string', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        '',
        UserRole.Admin,
        timestamp
      );

      expect(request.userEmail).toBe('');
    });
  });

  describe('type safety', () => {
    it('should accept string for userEmail', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp
      );

      expect(typeof request.userEmail).toBe('string');
    });

    it('should accept UserRole for newRole', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp
      );

      expect(request.newRole).toBe(UserRole.Admin);
    });

    it('should accept Date for timestamp', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp
      );

      expect(request.timestamp).toBeInstanceOf(Date);
    });

    it('should accept UserRoleChangeRequestPayload interface', () => {
      const payload = {
        userEmail: 'user@example.com',
        newRole: UserRole.SuperAdmin
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('user@example.com');
    });
  });

  describe('validation scenarios', () => {
    it('should handle admin role change scenario', () => {
      const payload = {
        userEmail: 'admin@company.com',
        newRole: UserRole.SuperAdmin
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('admin@company.com');
      expect(request.newRole).toBe(UserRole.SuperAdmin);
      expect(request.getRoleName()).toBe(UserRole.SuperAdmin);
    });

    it('should handle supervisor role change scenario', () => {
      const payload = {
        userEmail: 'supervisor@company.com',
        newRole: UserRole.Supervisor
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('supervisor@company.com');
      expect(request.newRole).toBe(UserRole.Supervisor);
    });

    it('should handle employee role change scenario', () => {
      const payload = {
        userEmail: 'employee@company.com',
        newRole: UserRole.Employee
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('employee@company.com');
      expect(request.newRole).toBe(UserRole.Employee);
    });

    it('should handle contact manager role change scenario', () => {
      const payload = {
        userEmail: 'contact@company.com',
        newRole: UserRole.ContactManager
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('contact@company.com');
      expect(request.newRole).toBe(UserRole.ContactManager);
    });

    it('should handle role change with different email domains scenario', () => {
      const payload = {
        userEmail: 'user@subdomain.example.com',
        newRole: UserRole.Admin
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('user@subdomain.example.com');
    });

    it('should handle role change with uppercase email scenario', () => {
      const payload = {
        userEmail: 'USER@EXAMPLE.COM',
        newRole: UserRole.Admin
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('user@example.com');
    });

    it('should handle role change to unassigned scenario', () => {
      const payload = {
        userEmail: 'user@example.com',
        newRole: UserRole.Unassigned
      };

      const request = UserRoleChangeRequest.fromRequest(payload);

      expect(request.userEmail).toBe('user@example.com');
      expect(request.newRole).toBe(UserRole.Unassigned);
    });

    it('should handle role change with timestamp conversion scenario', () => {
      const timestamp = new Date('2023-12-01T11:30:45.123Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        timestamp
      );

      const payload = request.toPayload();

      expect(payload.timestamp).toBe('2023-12-01T11:30:45.123Z');
    });
  });
});
