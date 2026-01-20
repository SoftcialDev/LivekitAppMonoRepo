import { userQuerySchema } from '../../../src/domain/schemas/UserQuerySchema';
import { UserRole } from '@prisma/client';

describe('UserQuerySchema', () => {
  describe('role validation', () => {
    it('should validate role refine function with valid roles', () => {
      const result = userQuerySchema.safeParse({
        role: `${UserRole.Admin},${UserRole.PSO}`,
        page: 1,
        pageSize: 50
      });
      expect(result.success).toBe(true);
    });

    it('should validate role refine function with null role', () => {
      const result = userQuerySchema.safeParse({
        role: 'null',
        page: 1,
        pageSize: 50
      });
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid role', () => {
      const result = userQuerySchema.safeParse({
        role: 'InvalidRole',
        page: 1,
        pageSize: 50
      });
      expect(result.success).toBe(false);
    });
  });

  describe('page preprocess', () => {
    it('should default page to 1 when undefined', () => {
      const result = userQuerySchema.safeParse({
        role: UserRole.Admin,
        page: undefined,
        pageSize: 50
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should parse page from string', () => {
      const result = userQuerySchema.safeParse({
        role: UserRole.Admin,
        page: '2',
        pageSize: 50
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
      }
    });
  });

  describe('pageSize preprocess', () => {
    it('should default pageSize to 50 when undefined', () => {
      const result = userQuerySchema.safeParse({
        role: UserRole.Admin,
        page: 1,
        pageSize: undefined
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(50);
      }
    });

    it('should parse pageSize from string', () => {
      const result = userQuerySchema.safeParse({
        role: UserRole.Admin,
        page: 1,
        pageSize: '25'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageSize).toBe(25);
      }
    });
  });
});





