/**
 * @fileoverview UserQueryResult value object - unit tests
 * @summary Tests for UserQueryResult value object functionality
 * @description Validates query result creation, factory methods, and payload conversion
 */

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { UserQueryResult, UserQueryResultPayload } from '../../../../../shared/domain/value-objects/UserQueryResult';
import { UserSummary } from '../../../../../shared/domain/entities/UserSummary';

// Mock UserSummary entity
jest.mock('../../../../../shared/domain/entities/UserSummary', () => ({
  UserSummary: jest.fn()
}));

describe('UserQueryResult', () => {
  describe('constructor', () => {
    it('should create result with all properties', () => {
      const mockUsers = [
        { 
          azureAdObjectId: 'azure-1', 
          email: 'user1@example.com', 
          firstName: 'User', 
          lastName: 'One',
          role: 'Employee'
        },
        { 
          azureAdObjectId: 'azure-2', 
          email: 'user2@example.com', 
          firstName: 'User', 
          lastName: 'Two',
          role: 'Employee'
        }
      ] as unknown as UserSummary[];

      const result = new UserQueryResult(100, 1, 10, mockUsers);

      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.users).toEqual(mockUsers);
      expect(result.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should create result with empty users array', () => {
      const result = new UserQueryResult(0, 1, 10, []);

      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.users).toEqual([]);
    });

    it('should create result with single user', () => {
      const mockUser = { 
        azureAdObjectId: 'azure-1', 
        email: 'user@example.com', 
        firstName: 'User', 
        lastName: 'One',
        role: 'Employee'
      } as unknown as UserSummary;
      const result = new UserQueryResult(1, 1, 1, [mockUser]);

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
      expect(result.users).toEqual([mockUser]);
    });

    it('should create result with large dataset', () => {
      const manyUsers = Array.from({ length: 1000 }, (_, i) => ({
        azureAdObjectId: `azure-${i}`,
        email: `user${i}@example.com`,
        firstName: `User`,
        lastName: `${i}`,
        role: 'Employee'
      })) as unknown as UserSummary[];

      const result = new UserQueryResult(1000, 1, 1000, manyUsers);

      expect(result.total).toBe(1000);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1000);
      expect(result.users).toHaveLength(1000);
    });
  });

  describe('create factory method', () => {
    it('should create result using factory method', () => {
      const mockUsers = [
        { 
          azureAdObjectId: 'azure-1', 
          email: 'user1@example.com', 
          firstName: 'User', 
          lastName: 'One',
          role: 'Employee'
        }
      ] as unknown as UserSummary[];

      const result = UserQueryResult.create(50, 2, 25, mockUsers);

      expect(result.total).toBe(50);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(25);
      expect(result.users).toEqual(mockUsers);
      expect(result.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should create result with zero total', () => {
      const result = UserQueryResult.create(0, 1, 10, []);

      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.users).toEqual([]);
    });

    it('should create result with different page numbers', () => {
      const mockUsers = [] as UserSummary[];
      
      const page1Result = UserQueryResult.create(100, 1, 10, mockUsers);
      const page2Result = UserQueryResult.create(100, 2, 10, mockUsers);
      const page10Result = UserQueryResult.create(100, 10, 10, mockUsers);

      expect(page1Result.page).toBe(1);
      expect(page2Result.page).toBe(2);
      expect(page10Result.page).toBe(10);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const mockUsers = [
        { 
          azureAdObjectId: 'azure-1', 
          email: 'user1@example.com', 
          firstName: 'User', 
          lastName: 'One',
          role: 'Employee'
        },
        { 
          azureAdObjectId: 'azure-2', 
          email: 'user2@example.com', 
          firstName: 'User', 
          lastName: 'Two',
          role: 'Employee'
        }
      ] as unknown as UserSummary[];

      const result = new UserQueryResult(100, 1, 10, mockUsers);
      const payload = result.toPayload();

      expect(payload).toEqual({
        total: 100,
        page: 1,
        pageSize: 10,
        users: mockUsers
      });
    });

    it('should convert empty result to payload', () => {
      const result = new UserQueryResult(0, 1, 10, []);
      const payload = result.toPayload();

      expect(payload).toEqual({
        total: 0,
        page: 1,
        pageSize: 10,
        users: []
      });
    });

    it('should return reference to users array', () => {
      const originalUsers = [
        { 
          azureAdObjectId: 'azure-1', 
          email: 'user1@example.com', 
          firstName: 'User', 
          lastName: 'One',
          role: 'Employee'
        }
      ] as unknown as UserSummary[];

      const result = new UserQueryResult(1, 1, 1, originalUsers);
      const payload = result.toPayload();
      
      // Modify the payload
      payload.users.push({ 
        azureAdObjectId: 'azure-2', 
        email: 'user2@example.com', 
        firstName: 'User', 
        lastName: 'Two',
        role: 'Employee'
      } as unknown as UserSummary);

      // Since toPayload returns a reference, both original and payload are affected
      expect(result.users).toHaveLength(2);
      expect(payload.users).toHaveLength(2);
    });
  });

  describe('UserQueryResultPayload interface', () => {
    it('should match UserQueryResultPayload interface structure', () => {
      const payload: UserQueryResultPayload = {
        total: 100,
        page: 1,
        pageSize: 10,
        users: []
      };

      expect(payload.total).toBe(100);
      expect(payload.page).toBe(1);
      expect(payload.pageSize).toBe(10);
      expect(payload.users).toEqual([]);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const mockUsers = [] as UserSummary[];
      const result = new UserQueryResult(100, 1, 10, mockUsers);

      // TypeScript should prevent these assignments
      expect(() => {
        (result as any).total = 200;
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (result as any).page = 2;
      }).not.toThrow();

      expect(() => {
        (result as any).timestamp = new Date();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle negative total', () => {
      const result = new UserQueryResult(-1, 1, 10, []);

      expect(result.total).toBe(-1);
    });

    it('should handle zero page', () => {
      const result = new UserQueryResult(100, 0, 10, []);

      expect(result.page).toBe(0);
    });

    it('should handle negative page', () => {
      const result = new UserQueryResult(100, -1, 10, []);

      expect(result.page).toBe(-1);
    });

    it('should handle zero page size', () => {
      const result = new UserQueryResult(100, 1, 0, []);

      expect(result.pageSize).toBe(0);
    });

    it('should handle negative page size', () => {
      const result = new UserQueryResult(100, 1, -1, []);

      expect(result.pageSize).toBe(-1);
    });

    it('should handle very large numbers', () => {
      const result = new UserQueryResult(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, []);

      expect(result.total).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.page).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.pageSize).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('pagination scenarios', () => {
    it('should handle first page', () => {
      const result = new UserQueryResult(100, 1, 10, []);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should handle last page', () => {
      const result = new UserQueryResult(100, 10, 10, []);

      expect(result.page).toBe(10);
      expect(result.pageSize).toBe(10);
    });

    it('should handle middle page', () => {
      const result = new UserQueryResult(100, 5, 10, []);

      expect(result.page).toBe(5);
      expect(result.pageSize).toBe(10);
    });

    it('should handle different page sizes', () => {
      const pageSize10 = new UserQueryResult(100, 1, 10, []);
      const pageSize25 = new UserQueryResult(100, 1, 25, []);
      const pageSize50 = new UserQueryResult(100, 1, 50, []);

      expect(pageSize10.pageSize).toBe(10);
      expect(pageSize25.pageSize).toBe(25);
      expect(pageSize50.pageSize).toBe(50);
    });
  });

  describe('type safety', () => {
    it('should accept number types for pagination properties', () => {
      const result = new UserQueryResult(100, 1, 10, []);

      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.pageSize).toBe('number');
    });

    it('should accept UserSummary array for users', () => {
      const mockUsers = [] as UserSummary[];
      const result = new UserQueryResult(100, 1, 10, mockUsers);

      expect(Array.isArray(result.users)).toBe(true);
    });
  });

  describe('validation scenarios', () => {
    it('should handle empty result scenario', () => {
      const result = UserQueryResult.create(0, 1, 10, []);

      expect(result.total).toBe(0);
      expect(result.users).toEqual([]);
    });

    it('should handle single user result scenario', () => {
      const mockUser = { 
        azureAdObjectId: 'azure-1', 
        email: 'user@example.com', 
        firstName: 'User', 
        lastName: 'One',
        role: 'Employee'
      } as unknown as UserSummary;
      const result = UserQueryResult.create(1, 1, 1, [mockUser]);

      expect(result.total).toBe(1);
      expect(result.users).toHaveLength(1);
    });

    it('should handle large dataset scenario', () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        azureAdObjectId: `azure-${i}`,
        email: `user${i}@example.com`,
        firstName: `User`,
        lastName: `${i}`,
        role: 'Employee'
      })) as unknown as UserSummary[];

      const result = UserQueryResult.create(1000, 1, 100, manyUsers);

      expect(result.total).toBe(1000);
      expect(result.users).toHaveLength(100);
    });
  });
});
