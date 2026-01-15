import { SuperAdminListResponse } from '../../../src/domain/value-objects/SuperAdminListResponse';
import { SuperAdminProfile } from '../../../src/domain/entities/SuperAdminProfile';

describe('SuperAdminListResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const mockProfile = new SuperAdminProfile(
        'profile-id',
        'user-id',
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T10:00:00Z'),
        {
          email: 'admin@example.com',
          fullName: 'Admin Name',
          role: 'SuperAdmin'
        }
      );

      const response = new SuperAdminListResponse([mockProfile], 1);
      const payload = response.toPayload();

      expect(payload.superAdmins).toHaveLength(1);
      expect(payload.superAdmins[0].id).toBe('profile-id');
      expect(payload.superAdmins[0].email).toBe('admin@example.com');
      expect(payload.totalCount).toBe(1);
    });

    it('should handle profile without user', () => {
      const mockProfile = new SuperAdminProfile(
        'profile-id',
        'user-id',
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T10:00:00Z')
      );

      const response = new SuperAdminListResponse([mockProfile], 1);
      const payload = response.toPayload();

      expect(payload.superAdmins[0].email).toBe('');
      expect(payload.superAdmins[0].fullName).toBe('');
      expect(payload.superAdmins[0].role).toBe('SuperAdmin');
    });
  });
});

