import { UserRoleChangeRequest } from '../../../src/domain/value-objects/UserRoleChangeRequest';
import { UserRole } from '@prisma/client';

describe('UserRoleChangeRequest', () => {
  describe('getRoleName', () => {
    it('should return role name as string', () => {
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Admin,
        new Date()
      );
      expect(request.getRoleName()).toBe(UserRole.Admin);
    });
  });

  describe('toPayload', () => {
    it('should convert request to payload format', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const request = new UserRoleChangeRequest(
        'user@example.com',
        UserRole.Supervisor,
        timestamp
      );
      const payload = request.toPayload();

      expect(payload).toEqual({
        userEmail: 'user@example.com',
        newRole: UserRole.Supervisor,
        timestamp: timestamp.toISOString()
      });
    });
  });
});

