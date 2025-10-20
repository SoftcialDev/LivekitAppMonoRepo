/**
 * @fileoverview UserQuerySchema - unit tests
 * @summary Tests for UserQuerySchema validation functionality
 * @description Validates user query request schema validation
 */

// Mock UserRole since it's not available in test environment
jest.mock('@prisma/client', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    ContactManager: 'ContactManager',
    SuperAdmin: 'SuperAdmin',
    Unassigned: 'Unassigned'
  }
}));

import { userQuerySchema, UserQueryRequestData } from '../../../../../shared/domain/schemas/UserQuerySchema';

describe('UserQuerySchema', () => {
  describe('userQuerySchema', () => {
    it('should validate with single role', () => {
      const validData = {
        role: 'Admin'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('Admin');
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it('should validate with multiple roles', () => {
      const validData = {
        role: 'Admin,Supervisor,Employee'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('Admin,Supervisor,Employee');
      }
    });

    it('should validate with roles and spaces', () => {
      const validData = {
        role: 'Admin, Supervisor, Employee'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('Admin, Supervisor, Employee');
      }
    });

    it('should validate with null role for backward compatibility', () => {
      const validData = {
        role: 'null'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('null');
      }
    });

    it('should validate with custom page', () => {
      const validData = {
        role: 'Admin',
        page: '2'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
      }
    });

    it('should validate with custom pageSize', () => {
      const validData = {
        role: 'Admin',
        pageSize: '100'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(100);
      }
    });

    it('should validate with all parameters', () => {
      const validData = {
        role: 'Admin,Supervisor',
        page: '3',
        pageSize: '25'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('Admin,Supervisor');
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(25);
      }
    });

    it('should validate with maximum pageSize', () => {
      const validData = {
        role: 'Admin',
        pageSize: '1000'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(1000);
      }
    });

    it('should validate with minimum pageSize', () => {
      const validData = {
        role: 'Admin',
        pageSize: '1'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(1);
      }
    });

    it('should validate with minimum page', () => {
      const validData = {
        role: 'Admin',
        page: '1'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should reject missing role', () => {
      const invalidData = {};

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('should reject empty role', () => {
      const invalidData = {
        role: ''
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Role parameter is required');
      }
    });

    it('should reject invalid role', () => {
      const invalidData = {
        role: 'InvalidRole'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid role parameter');
      }
    });

    it('should reject mixed valid and invalid roles', () => {
      const invalidData = {
        role: 'Admin,InvalidRole,Supervisor'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid role parameter');
      }
    });

    it('should reject null role', () => {
      const invalidData = {
        role: null
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject undefined role', () => {
      const invalidData = {
        role: undefined
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject numeric role', () => {
      const invalidData = {
        role: 123
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject boolean role', () => {
      const invalidData = {
        role: true
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject array role', () => {
      const invalidData = {
        role: ['Admin']
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject object role', () => {
      const invalidData = {
        role: { name: 'Admin' }
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject zero page', () => {
      const invalidData = {
        role: 'Admin',
        page: '0'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page must be at least 1');
      }
    });

    it('should reject negative page', () => {
      const invalidData = {
        role: 'Admin',
        page: '-1'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page must be at least 1');
      }
    });

    it('should reject zero pageSize', () => {
      const invalidData = {
        role: 'Admin',
        pageSize: '0'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page size must be between 1 and 1000');
      }
    });

    it('should reject negative pageSize', () => {
      const invalidData = {
        role: 'Admin',
        pageSize: '-1'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page size must be between 1 and 1000');
      }
    });

    it('should reject pageSize over 1000', () => {
      const invalidData = {
        role: 'Admin',
        pageSize: '1001'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page size must be between 1 and 1000');
      }
    });

    it('should reject non-numeric page', () => {
      const invalidData = {
        role: 'Admin',
        page: 'abc'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject non-numeric pageSize', () => {
      const invalidData = {
        role: 'Admin',
        pageSize: 'abc'
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject null page', () => {
      const invalidData = {
        role: 'Admin',
        page: null
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject null pageSize', () => {
      const invalidData = {
        role: 'Admin',
        pageSize: null
      };

      const result = userQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept undefined page (uses default)', () => {
      const validData = {
        role: 'Admin',
        page: undefined
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should accept undefined pageSize (uses default)', () => {
      const validData = {
        role: 'Admin',
        pageSize: undefined
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(50);
      }
    });

    it('should reject null input', () => {
      const result = userQuerySchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it('should reject undefined input', () => {
      const result = userQuerySchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it('should reject string input', () => {
      const result = userQuerySchema.safeParse('invalid');

      expect(result.success).toBe(false);
    });

    it('should reject number input', () => {
      const result = userQuerySchema.safeParse(123);

      expect(result.success).toBe(false);
    });

    it('should reject boolean input', () => {
      const result = userQuerySchema.safeParse(true);

      expect(result.success).toBe(false);
    });

    it('should reject array input', () => {
      const result = userQuerySchema.safeParse([]);

      expect(result.success).toBe(false);
    });
  });

  describe('UserQueryRequestData type', () => {
    it('should have correct type structure', () => {
      const data: UserQueryRequestData = {
        role: 'Admin',
        page: 1,
        pageSize: 50
      };

      expect(data.role).toBe('Admin');
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(50);
    });

    it('should accept multiple roles', () => {
      const data: UserQueryRequestData = {
        role: 'Admin,Supervisor',
        page: 2,
        pageSize: 25
      };

      expect(data.role).toBe('Admin,Supervisor');
      expect(data.page).toBe(2);
      expect(data.pageSize).toBe(25);
    });
  });

  describe('edge cases', () => {
    it('should handle very long role strings', () => {
      const validData = {
        role: 'Admin,Supervisor,Employee,ContactManager,SuperAdmin,Unassigned'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should handle roles with extra spaces', () => {
      const validData = {
        role: '  Admin  ,  Supervisor  ,  Employee  '
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should handle very large page numbers', () => {
      const validData = {
        role: 'Admin',
        page: '999999'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(999999);
      }
    });

    it('should handle decimal page numbers', () => {
      const validData = {
        role: 'Admin',
        page: '2.5'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
      }
    });

    it('should handle decimal pageSize', () => {
      const validData = {
        role: 'Admin',
        pageSize: '25.5'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(25);
      }
    });

    it('should handle extra properties', () => {
      const validData = {
        role: 'Admin',
        extra: 'property'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('validation scenarios', () => {
    it('should validate admin user query', () => {
      const validData = {
        role: 'Admin'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate supervisor user query', () => {
      const validData = {
        role: 'Supervisor'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate employee user query', () => {
      const validData = {
        role: 'Employee'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate contact manager user query', () => {
      const validData = {
        role: 'ContactManager'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate super admin user query', () => {
      const validData = {
        role: 'SuperAdmin'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate unassigned user query', () => {
      const validData = {
        role: 'Unassigned'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate mixed role query', () => {
      const validData = {
        role: 'Admin,Supervisor,Employee',
        page: '1',
        pageSize: '100'
      };

      const result = userQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });
});
