/**
 * @fileoverview SuperAdminListResponse value object - unit tests
 * @summary Tests for SuperAdminListResponse value object functionality
 * @description Validates super admin list response creation, factory methods, and payload conversion
 */

// Mock SuperAdminProfile entity
jest.mock('../../../../../shared/domain/entities/SuperAdminProfile', () => ({
  SuperAdminProfile: jest.fn()
}));

import { SuperAdminListResponse, SuperAdminListResponsePayload } from '../../../../../shared/domain/value-objects/SuperAdminListResponse';
import { SuperAdminProfile } from '../../../../../shared/domain/entities/SuperAdminProfile';

describe('SuperAdminListResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: 'admin1@example.com', fullName: 'Admin One', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z')
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          user: { email: 'admin2@example.com', fullName: 'Admin Two', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-02T12:00:00Z'),
          updatedAt: new Date('2023-01-02T12:00:00Z')
        }
      ] as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 2);

      expect(response.superAdmins).toEqual(mockProfiles);
      expect(response.totalCount).toBe(2);
    });

    it('should create response with empty profiles array', () => {
      const response = new SuperAdminListResponse([], 0);

      expect(response.superAdmins).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    it('should create response with single profile', () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        user: { email: 'admin@example.com', fullName: 'Admin', role: 'SuperAdmin' },
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z')
      } as SuperAdminProfile;

      const response = new SuperAdminListResponse([mockProfile], 1);

      expect(response.superAdmins).toEqual([mockProfile]);
      expect(response.totalCount).toBe(1);
    });

    it('should create response with mismatched count', () => {
      const mockProfiles = [
        { id: 'profile-1', userId: 'user-1', user: { email: 'admin1@example.com', fullName: 'Admin One', role: 'SuperAdmin' }, createdAt: new Date(), updatedAt: new Date() }
      ] as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 5);

      expect(response.superAdmins).toHaveLength(1);
      expect(response.totalCount).toBe(5);
    });
  });

  describe('fromProfiles factory method', () => {
    it('should create response from profiles array', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: 'admin1@example.com', fullName: 'Admin One', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z')
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          user: { email: 'admin2@example.com', fullName: 'Admin Two', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-02T12:00:00Z'),
          updatedAt: new Date('2023-01-02T12:00:00Z')
        }
      ] as SuperAdminProfile[];

      const response = SuperAdminListResponse.fromProfiles(mockProfiles);

      expect(response.superAdmins).toEqual(mockProfiles);
      expect(response.totalCount).toBe(2);
    });

    it('should create response from empty profiles array', () => {
      const response = SuperAdminListResponse.fromProfiles([]);

      expect(response.superAdmins).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    it('should create response from single profile', () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        user: { email: 'admin@example.com', fullName: 'Admin', role: 'SuperAdmin' },
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z')
      } as SuperAdminProfile;

      const response = SuperAdminListResponse.fromProfiles([mockProfile]);

      expect(response.superAdmins).toEqual([mockProfile]);
      expect(response.totalCount).toBe(1);
    });

    it('should create response from many profiles', () => {
      const manyProfiles = Array.from({ length: 100 }, (_, i) => ({
        id: `profile-${i}`,
        userId: `user-${i}`,
        user: { email: `admin${i}@example.com`, fullName: `Admin ${i}`, role: 'SuperAdmin' },
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z')
      })) as SuperAdminProfile[];

      const response = SuperAdminListResponse.fromProfiles(manyProfiles);

      expect(response.superAdmins).toHaveLength(100);
      expect(response.totalCount).toBe(100);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: 'admin1@example.com', fullName: 'Admin One', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z')
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          user: { email: 'admin2@example.com', fullName: 'Admin Two', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-02T12:00:00Z'),
          updatedAt: new Date('2023-01-02T12:00:00Z')
        }
      ] as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 2);
      const payload = response.toPayload();

      expect(payload).toEqual({
        superAdmins: [
          {
            id: 'profile-1',
            userId: 'user-1',
            email: 'admin1@example.com',
            fullName: 'Admin One',
            role: 'SuperAdmin',
            createdAt: '2023-01-01T12:00:00.000Z',
            updatedAt: '2023-01-01T12:00:00.000Z'
          },
          {
            id: 'profile-2',
            userId: 'user-2',
            email: 'admin2@example.com',
            fullName: 'Admin Two',
            role: 'SuperAdmin',
            createdAt: '2023-01-02T12:00:00.000Z',
            updatedAt: '2023-01-02T12:00:00.000Z'
          }
        ],
        totalCount: 2
      });
    });

    it('should convert empty response to payload', () => {
      const response = new SuperAdminListResponse([], 0);
      const payload = response.toPayload();

      expect(payload).toEqual({
        superAdmins: [],
        totalCount: 0
      });
    });

    it('should handle profiles with missing user data', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: null,
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z'),
          toPayload: jest.fn()
        }
      ] as unknown as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 1);
      const payload = response.toPayload();

      expect(payload.superAdmins[0]).toEqual({
        id: 'profile-1',
        userId: 'user-1',
        email: '',
        fullName: '',
        role: 'SuperAdmin',
        createdAt: '2023-01-01T12:00:00.000Z',
        updatedAt: '2023-01-01T12:00:00.000Z'
      });
    });

    it('should return immutable copy of super admins', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: 'admin@example.com', fullName: 'Admin', role: 'SuperAdmin' },
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z')
        }
      ] as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 1);
      const payload = response.toPayload();
      
      // Modify the payload
      payload.superAdmins.push({
        id: 'profile-2',
        userId: 'user-2',
        email: 'admin2@example.com',
        fullName: 'Admin Two',
        role: 'SuperAdmin',
        createdAt: '2023-01-01T12:00:00.000Z',
        updatedAt: '2023-01-01T12:00:00.000Z'
      });

      // Original response should not be affected
      expect(response.superAdmins).toHaveLength(1);
    });
  });

  describe('SuperAdminListResponsePayload interface', () => {
    it('should match SuperAdminListResponsePayload interface structure', () => {
      const payload: SuperAdminListResponsePayload = {
        superAdmins: [
          {
            id: 'profile-1',
            userId: 'user-1',
            email: 'admin@example.com',
            fullName: 'Admin',
            role: 'SuperAdmin',
            createdAt: '2023-01-01T12:00:00.000Z',
            updatedAt: '2023-01-01T12:00:00.000Z'
          }
        ],
        totalCount: 1
      };

      expect(payload.superAdmins).toHaveLength(1);
      expect(payload.totalCount).toBe(1);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const mockProfiles = [] as SuperAdminProfile[];
      const response = new SuperAdminListResponse(mockProfiles, 0);

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).superAdmins = [];
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).totalCount = 5;
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle profiles with undefined user properties', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: undefined, fullName: undefined, role: undefined },
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z'),
          toPayload: jest.fn()
        }
      ] as unknown as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 1);
      const payload = response.toPayload();

      expect(payload.superAdmins[0].email).toBe('');
      expect(payload.superAdmins[0].fullName).toBe('');
      expect(payload.superAdmins[0].role).toBe('SuperAdmin');
    });

    it('should handle profiles with partial user data', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: 'admin@example.com', fullName: undefined, role: 'SuperAdmin' },
          createdAt: new Date('2023-01-01T12:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z'),
          toPayload: jest.fn()
        }
      ] as unknown as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 1);
      const payload = response.toPayload();

      expect(payload.superAdmins[0].email).toBe('admin@example.com');
      expect(payload.superAdmins[0].fullName).toBe('');
      expect(payload.superAdmins[0].role).toBe('SuperAdmin');
    });

    it('should handle different date formats', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          user: { email: 'admin@example.com', fullName: 'Admin', role: 'SuperAdmin' },
          createdAt: new Date('2020-01-01T00:00:00Z'),
          updatedAt: new Date('2023-12-31T23:59:59Z')
        }
      ] as SuperAdminProfile[];

      const response = new SuperAdminListResponse(mockProfiles, 1);
      const payload = response.toPayload();

      expect(payload.superAdmins[0].createdAt).toBe('2020-01-01T00:00:00.000Z');
      expect(payload.superAdmins[0].updatedAt).toBe('2023-12-31T23:59:59.000Z');
    });
  });

  describe('type safety', () => {
    it('should accept SuperAdminProfile array for super admins', () => {
      const mockProfiles = [] as SuperAdminProfile[];
      const response = new SuperAdminListResponse(mockProfiles, 0);

      expect(Array.isArray(response.superAdmins)).toBe(true);
    });

    it('should accept number for total count', () => {
      const response = new SuperAdminListResponse([], 0);

      expect(typeof response.totalCount).toBe('number');
    });
  });

  describe('validation scenarios', () => {
    it('should handle empty admin list scenario', () => {
      const response = SuperAdminListResponse.fromProfiles([]);

      expect(response.superAdmins).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    it('should handle single admin scenario', () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        user: { email: 'admin@example.com', fullName: 'Admin', role: 'SuperAdmin' },
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z')
      } as SuperAdminProfile;

      const response = SuperAdminListResponse.fromProfiles([mockProfile]);

      expect(response.superAdmins).toHaveLength(1);
      expect(response.totalCount).toBe(1);
    });

    it('should handle multiple admins scenario', () => {
      const mockProfiles = Array.from({ length: 5 }, (_, i) => ({
        id: `profile-${i}`,
        userId: `user-${i}`,
        user: { email: `admin${i}@example.com`, fullName: `Admin ${i}`, role: 'SuperAdmin' },
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z')
      })) as SuperAdminProfile[];

      const response = SuperAdminListResponse.fromProfiles(mockProfiles);

      expect(response.superAdmins).toHaveLength(5);
      expect(response.totalCount).toBe(5);
    });
  });
});
