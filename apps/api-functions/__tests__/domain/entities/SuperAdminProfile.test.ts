import { SuperAdminProfile } from '../../../src/domain/entities/SuperAdminProfile';

describe('SuperAdminProfile', () => {
  const baseData = {
    id: 'superadmin-id',
    userId: 'user-id',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('fromPrisma', () => {
    it('should create SuperAdminProfile from Prisma data', () => {
      const profile = SuperAdminProfile.fromPrisma(baseData);

      expect(profile).toBeInstanceOf(SuperAdminProfile);
      expect(profile.id).toBe('superadmin-id');
      expect(profile.userId).toBe('user-id');
      expect(profile.createdAt).toEqual(baseData.createdAt);
      expect(profile.updatedAt).toEqual(baseData.updatedAt);
      expect(profile.user).toBeUndefined();
    });
  });

  describe('toPayload', () => {
    it('should return payload without user when user is not provided', () => {
      const profile = new SuperAdminProfile(
        'superadmin-id',
        'user-id',
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T10:00:00Z')
      );

      const payload = profile.toPayload();

      expect(payload).toEqual({
        id: 'superadmin-id',
        userId: 'user-id',
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
      });
      expect(payload.user).toBeUndefined();
    });

    it('should return payload with user when user is provided', () => {
      const profile = new SuperAdminProfile(
        'superadmin-id',
        'user-id',
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T10:00:00Z'),
        {
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'SuperAdmin',
        }
      );

      const payload = profile.toPayload();

      expect(payload).toEqual({
        id: 'superadmin-id',
        userId: 'user-id',
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
        user: {
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'SuperAdmin',
        },
      });
    });
  });
});


