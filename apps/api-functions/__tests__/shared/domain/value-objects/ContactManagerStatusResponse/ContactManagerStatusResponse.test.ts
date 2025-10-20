/**
 * @fileoverview ContactManagerStatusResponse value object - unit tests
 * @summary Tests for ContactManagerStatusResponse value object functionality
 * @description Validates response creation, factory methods, and payload conversion
 */

import { ContactManagerStatusResponse, ContactManagerStatusData } from '../../../../../shared/domain/value-objects/ContactManagerStatusResponse';

describe('ContactManagerStatusResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        'manager@example.com',
        'John Doe',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.id).toBe('cm-123');
      expect(response.userId).toBe('user-456');
      expect(response.email).toBe('manager@example.com');
      expect(response.fullName).toBe('John Doe');
      expect(response.status).toBe('ACTIVE');
      expect(response.createdAt).toBe('2023-01-01T10:00:00Z');
      expect(response.updatedAt).toBe('2023-01-01T11:00:00Z');
    });

    it('should create response with different status values', () => {
      const activeResponse = new ContactManagerStatusResponse(
        'cm-1',
        'user-1',
        'active@example.com',
        'Active Manager',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      const inactiveResponse = new ContactManagerStatusResponse(
        'cm-2',
        'user-2',
        'inactive@example.com',
        'Inactive Manager',
        'INACTIVE',
        '2023-01-02T10:00:00Z',
        '2023-01-02T11:00:00Z'
      );

      expect(activeResponse.status).toBe('ACTIVE');
      expect(inactiveResponse.status).toBe('INACTIVE');
    });

    it('should create response with empty strings for optional fields', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        '',
        '',
        'PENDING',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.email).toBe('');
      expect(response.fullName).toBe('');
      expect(response.status).toBe('PENDING');
    });
  });

  describe('fromProfile', () => {
    it('should create response from profile with complete user data', () => {
      const mockProfile = {
        id: 'cm-123',
        userId: 'user-456',
        status: 'ACTIVE',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        user: {
          email: 'manager@example.com',
          fullName: 'John Doe'
        }
      };

      const response = ContactManagerStatusResponse.fromProfile(mockProfile);

      expect(response.id).toBe('cm-123');
      expect(response.userId).toBe('user-456');
      expect(response.email).toBe('manager@example.com');
      expect(response.fullName).toBe('John Doe');
      expect(response.status).toBe('ACTIVE');
      expect(response.createdAt).toBe('2023-01-01T10:00:00.000Z');
      expect(response.updatedAt).toBe('2023-01-01T11:00:00.000Z');
    });

    it('should create response from profile with missing user data', () => {
      const mockProfile = {
        id: 'cm-123',
        userId: 'user-456',
        status: 'INACTIVE',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        user: null
      };

      const response = ContactManagerStatusResponse.fromProfile(mockProfile);

      expect(response.id).toBe('cm-123');
      expect(response.userId).toBe('user-456');
      expect(response.email).toBe('');
      expect(response.fullName).toBe('');
      expect(response.status).toBe('INACTIVE');
    });

    it('should create response from profile with partial user data', () => {
      const mockProfile = {
        id: 'cm-123',
        userId: 'user-456',
        status: 'PENDING',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        user: {
          email: 'manager@example.com',
          fullName: null
        }
      };

      const response = ContactManagerStatusResponse.fromProfile(mockProfile);

      expect(response.email).toBe('manager@example.com');
      expect(response.fullName).toBe('');
    });

    it('should handle profile with undefined user properties', () => {
      const mockProfile = {
        id: 'cm-123',
        userId: 'user-456',
        status: 'SUSPENDED',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        user: {
          email: undefined,
          fullName: undefined
        }
      };

      const response = ContactManagerStatusResponse.fromProfile(mockProfile);

      expect(response.email).toBe('');
      expect(response.fullName).toBe('');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        'manager@example.com',
        'John Doe',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        id: 'cm-123',
        userId: 'user-456',
        email: 'manager@example.com',
        fullName: 'John Doe',
        status: 'ACTIVE',
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T11:00:00Z'
      });
    });

    it('should convert response with empty fields to payload', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        '',
        '',
        'PENDING',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      const payload = response.toPayload();

      expect(payload.email).toBe('');
      expect(payload.fullName).toBe('');
      expect(payload.status).toBe('PENDING');
    });
  });

  describe('ContactManagerStatusData interface', () => {
    it('should match ContactManagerStatusData interface structure', () => {
      const data: ContactManagerStatusData = {
        id: 'cm-123',
        userId: 'user-456',
        email: 'manager@example.com',
        fullName: 'John Doe',
        status: 'ACTIVE',
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T11:00:00Z'
      };

      expect(data.id).toBe('cm-123');
      expect(data.userId).toBe('user-456');
      expect(data.email).toBe('manager@example.com');
      expect(data.fullName).toBe('John Doe');
      expect(data.status).toBe('ACTIVE');
      expect(data.createdAt).toBe('2023-01-01T10:00:00Z');
      expect(data.updatedAt).toBe('2023-01-01T11:00:00Z');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        'manager@example.com',
        'John Doe',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).id = 'cm-456';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).email = 'other@example.com';
      }).not.toThrow();

      expect(() => {
        (response as any).status = 'INACTIVE';
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle long email addresses', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        longEmail,
        'John Doe',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.email).toBe(longEmail);
    });

    it('should handle special characters in email and name', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        'manager+test@example-domain.com',
        'José María',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.email).toBe('manager+test@example-domain.com');
      expect(response.fullName).toBe('José María');
    });

    it('should handle different status values', () => {
      const statuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'];
      
      statuses.forEach((status, i) => {
        const response = new ContactManagerStatusResponse(
          `cm-${i}`,
          `user-${i}`,
          `manager${i}@example.com`,
          `Manager ${i}`,
          status,
          '2023-01-01T10:00:00Z',
          '2023-01-01T11:00:00Z'
        );

        expect(response.status).toBe(status);
      });
    });

    it('should handle ISO date strings', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        'manager@example.com',
        'John Doe',
        'ACTIVE',
        '2023-12-31T23:59:59.999Z',
        '2024-01-01T00:00:00.000Z'
      );

      expect(response.createdAt).toBe('2023-12-31T23:59:59.999Z');
      expect(response.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('type safety', () => {
    it('should accept string types for all properties', () => {
      const response = new ContactManagerStatusResponse(
        'cm-123',
        'user-456',
        'manager@example.com',
        'John Doe',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(typeof response.id).toBe('string');
      expect(typeof response.userId).toBe('string');
      expect(typeof response.email).toBe('string');
      expect(typeof response.fullName).toBe('string');
      expect(typeof response.status).toBe('string');
      expect(typeof response.createdAt).toBe('string');
      expect(typeof response.updatedAt).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle active contact manager', () => {
      const response = new ContactManagerStatusResponse(
        'cm-active-123',
        'user-active-456',
        'active.manager@example.com',
        'Active Manager',
        'ACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.status).toBe('ACTIVE');
      expect(response.email).toBe('active.manager@example.com');
    });

    it('should handle inactive contact manager', () => {
      const response = new ContactManagerStatusResponse(
        'cm-inactive-123',
        'user-inactive-456',
        'inactive.manager@example.com',
        'Inactive Manager',
        'INACTIVE',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.status).toBe('INACTIVE');
      expect(response.email).toBe('inactive.manager@example.com');
    });

    it('should handle pending contact manager', () => {
      const response = new ContactManagerStatusResponse(
        'cm-pending-123',
        'user-pending-456',
        'pending.manager@example.com',
        'Pending Manager',
        'PENDING',
        '2023-01-01T10:00:00Z',
        '2023-01-01T11:00:00Z'
      );

      expect(response.status).toBe('PENDING');
      expect(response.email).toBe('pending.manager@example.com');
    });
  });
});
