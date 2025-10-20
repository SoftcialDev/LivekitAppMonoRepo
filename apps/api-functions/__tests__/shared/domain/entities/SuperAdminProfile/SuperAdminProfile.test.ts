/**
 * @fileoverview SuperAdminProfile entity - unit tests
 */

import { SuperAdminProfile } from '../../../../../shared/domain/entities/SuperAdminProfile';

describe('SuperAdminProfile', () => {
  const baseProfileData = {
    id: 'profile123',
    userId: 'user123',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };

  describe('constructor', () => {
    it('creates profile with all required properties', () => {
      const profile = new SuperAdminProfile(
        'profile123',
        'user123',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      expect(profile.id).toBe('profile123');
      expect(profile.userId).toBe('user123');
      expect(profile.createdAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(profile.updatedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
    });

    it('creates profile with optional user property', () => {
      const profile = new SuperAdminProfile(
        'profile123',
        'user123',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z'),
        {
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'SuperAdmin'
        }
      );
      
      expect(profile.user).toEqual({
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'SuperAdmin'
      });
    });
  });

  describe('fromPrisma', () => {
    it('creates profile from Prisma data without user', () => {
      const prismaData = {
        id: 'profile123',
        userId: 'user123',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };

      const profile = SuperAdminProfile.fromPrisma(prismaData);
      
      expect(profile.id).toBe('profile123');
      expect(profile.userId).toBe('user123');
      expect(profile.createdAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(profile.updatedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
      expect(profile.user).toBeUndefined();
    });
  });

  describe('toPayload', () => {
    it('converts entity to payload without user', () => {
      const profile = new SuperAdminProfile(
        'profile123',
        'user123',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z')
      );
      
      const payload = profile.toPayload();
      
      expect(payload).toEqual({
        id: 'profile123',
        userId: 'user123',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T11:00:00.000Z'
      });
    });

    it('converts entity to payload with user', () => {
      const profile = new SuperAdminProfile(
        'profile123',
        'user123',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T11:00:00Z'),
        {
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'SuperAdmin'
        }
      );
      
      const payload = profile.toPayload();
      
      expect(payload).toEqual({
        id: 'profile123',
        userId: 'user123',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T11:00:00.000Z',
        user: {
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'SuperAdmin'
        }
      });
    });
  });
});
