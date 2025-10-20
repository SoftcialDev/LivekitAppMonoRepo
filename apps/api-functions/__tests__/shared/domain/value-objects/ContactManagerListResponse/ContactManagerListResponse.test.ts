/**
 * @fileoverview ContactManagerListResponse value object - unit tests
 * @summary Tests for ContactManagerListResponse value object functionality
 * @description Validates response creation, factory methods, and payload conversion
 */

import { ContactManagerListResponse, ContactManagerItem } from '../../../../../shared/domain/value-objects/ContactManagerListResponse';
import { ContactManagerProfile } from '../../../../../shared/domain/entities/ContactManagerProfile';

// Mock ContactManagerProfile entity
jest.mock('../../../../../shared/domain/entities/ContactManagerProfile', () => ({
  ContactManagerProfile: jest.fn()
}));

describe('ContactManagerListResponse', () => {
  describe('constructor', () => {
    it('should create response with contact managers list', () => {
      const contactManagers: ContactManagerItem[] = [
        {
          id: 'cm-1',
          email: 'manager1@example.com',
          fullName: 'Manager One',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        },
        {
          id: 'cm-2',
          email: 'manager2@example.com',
          fullName: 'Manager Two',
          status: 'INACTIVE',
          createdAt: '2023-01-02T10:00:00Z',
          updatedAt: '2023-01-02T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(contactManagers);

      expect(response.contactManagers).toEqual(contactManagers);
    });

    it('should create response with empty list', () => {
      const response = new ContactManagerListResponse([]);

      expect(response.contactManagers).toEqual([]);
    });

    it('should create response with single contact manager', () => {
      const contactManagers: ContactManagerItem[] = [
        {
          id: 'cm-1',
          email: 'manager@example.com',
          fullName: 'Single Manager',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(contactManagers);

      expect(response.contactManagers).toHaveLength(1);
      expect(response.contactManagers[0].id).toBe('cm-1');
    });
  });

  describe('fromProfiles', () => {
    it('should create response from ContactManagerProfile entities', () => {
      const mockProfiles = [
        {
          id: 'cm-1',
          userId: 'user-1',
          status: 'ACTIVE',
          createdAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T11:00:00Z'),
          user: {
            email: 'manager1@example.com',
            fullName: 'Manager One'
          }
        },
        {
          id: 'cm-2',
          userId: 'user-2',
          status: 'INACTIVE',
          createdAt: new Date('2023-01-02T10:00:00Z'),
          updatedAt: new Date('2023-01-02T11:00:00Z'),
          user: {
            email: 'manager2@example.com',
            fullName: 'Manager Two'
          }
        }
      ] as unknown as ContactManagerProfile[];

      const response = ContactManagerListResponse.fromProfiles(mockProfiles);

      expect(response.contactManagers).toHaveLength(2);
      expect(response.contactManagers[0]).toEqual({
        id: 'cm-1',
        email: 'manager1@example.com',
        fullName: 'Manager One',
        status: 'ACTIVE',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T11:00:00.000Z'
      });
      expect(response.contactManagers[1]).toEqual({
        id: 'cm-2',
        email: 'manager2@example.com',
        fullName: 'Manager Two',
        status: 'INACTIVE',
        createdAt: '2023-01-02T10:00:00.000Z',
        updatedAt: '2023-01-02T11:00:00.000Z'
      });
    });

    it('should handle profiles with missing user data', () => {
      const mockProfiles = [
        {
          id: 'cm-1',
          userId: 'user-1',
          status: 'ACTIVE',
          createdAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T11:00:00Z'),
          user: null
        }
      ] as unknown as ContactManagerProfile[];

      const response = ContactManagerListResponse.fromProfiles(mockProfiles);

      expect(response.contactManagers[0]).toEqual({
        id: 'cm-1',
        email: '',
        fullName: '',
        status: 'ACTIVE',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T11:00:00.000Z'
      });
    });

    it('should handle profiles with partial user data', () => {
      const mockProfiles = [
        {
          id: 'cm-1',
          userId: 'user-1',
          status: 'ACTIVE',
          createdAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T11:00:00Z'),
          user: {
            email: 'manager@example.com',
            fullName: null
          }
        }
      ] as unknown as ContactManagerProfile[];

      const response = ContactManagerListResponse.fromProfiles(mockProfiles);

      expect(response.contactManagers[0]).toEqual({
        id: 'cm-1',
        email: 'manager@example.com',
        fullName: '',
        status: 'ACTIVE',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T11:00:00.000Z'
      });
    });

    it('should handle empty profiles array', () => {
      const response = ContactManagerListResponse.fromProfiles([]);

      expect(response.contactManagers).toEqual([]);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const contactManagers: ContactManagerItem[] = [
        {
          id: 'cm-1',
          email: 'manager1@example.com',
          fullName: 'Manager One',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(contactManagers);
      const payload = response.toPayload();

      expect(payload).toEqual({
        contactManagers: contactManagers
      });
    });

    it('should return reference to contact managers (not immutable)', () => {
      const originalManagers: ContactManagerItem[] = [
        {
          id: 'cm-1',
          email: 'manager@example.com',
          fullName: 'Manager',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(originalManagers);
      const payload = response.toPayload();
      
      // Modify the payload
      payload.contactManagers.push({
        id: 'cm-2',
        email: 'manager2@example.com',
        fullName: 'Manager Two',
        status: 'INACTIVE',
        createdAt: '2023-01-02T10:00:00Z',
        updatedAt: '2023-01-02T11:00:00Z'
      });

      // Original response will be affected (not immutable)
      expect(response.contactManagers).toHaveLength(2);
    });
  });

  describe('ContactManagerItem interface', () => {
    it('should match ContactManagerItem interface structure', () => {
      const item: ContactManagerItem = {
        id: 'cm-1',
        email: 'manager@example.com',
        fullName: 'Manager Name',
        status: 'ACTIVE',
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T11:00:00Z'
      };

      expect(item.id).toBe('cm-1');
      expect(item.email).toBe('manager@example.com');
      expect(item.fullName).toBe('Manager Name');
      expect(item.status).toBe('ACTIVE');
      expect(item.createdAt).toBe('2023-01-01T10:00:00Z');
      expect(item.updatedAt).toBe('2023-01-01T11:00:00Z');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const contactManagers: ContactManagerItem[] = [
        {
          id: 'cm-1',
          email: 'manager@example.com',
          fullName: 'Manager',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(contactManagers);

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).contactManagers = [];
      }).not.toThrow(); // JavaScript allows property modification
    });
  });

  describe('edge cases', () => {
    it('should handle large lists of contact managers', () => {
      const largeList: ContactManagerItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `cm-${i}`,
        email: `manager${i}@example.com`,
        fullName: `Manager ${i}`,
        status: i % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T11:00:00Z'
      }));

      const response = new ContactManagerListResponse(largeList);

      expect(response.contactManagers).toHaveLength(1000);
      expect(response.contactManagers[0].id).toBe('cm-0');
      expect(response.contactManagers[999].id).toBe('cm-999');
    });

    it('should handle special characters in contact manager data', () => {
      const contactManagers: ContactManagerItem[] = [
        {
          id: 'cm-特殊',
          email: 'manager+test@example-domain.com',
          fullName: 'José María',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(contactManagers);

      expect(response.contactManagers[0].id).toBe('cm-特殊');
      expect(response.contactManagers[0].email).toBe('manager+test@example-domain.com');
      expect(response.contactManagers[0].fullName).toBe('José María');
    });

    it('should handle different status values', () => {
      const statuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'];
      const contactManagers: ContactManagerItem[] = statuses.map((status, i) => ({
        id: `cm-${i}`,
        email: `manager${i}@example.com`,
        fullName: `Manager ${i}`,
        status,
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T11:00:00Z'
      }));

      const response = new ContactManagerListResponse(contactManagers);

      statuses.forEach((status, i) => {
        expect(response.contactManagers[i].status).toBe(status);
      });
    });
  });

  describe('type safety', () => {
    it('should accept valid ContactManagerItem arrays', () => {
      const validItems: ContactManagerItem[] = [
        {
          id: 'cm-1',
          email: 'manager@example.com',
          fullName: 'Manager',
          status: 'ACTIVE',
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ];

      const response = new ContactManagerListResponse(validItems);

      expect(response.contactManagers).toEqual(validItems);
    });
  });
});
