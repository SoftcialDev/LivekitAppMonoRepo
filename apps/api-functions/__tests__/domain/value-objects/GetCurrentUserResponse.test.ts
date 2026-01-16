import { GetCurrentUserResponse } from '../../../src/domain/value-objects/GetCurrentUserResponse';
import { UserRole } from '@prisma/client';

describe('GetCurrentUserResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format with all fields', () => {
      const response = new GetCurrentUserResponse(
        'azure-id',
        'user@example.com',
        'John',
        'Doe',
        UserRole.Supervisor,
        'supervisor-id',
        'Supervisor Name',
        ['permission1', 'permission2'],
        false
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Supervisor,
        supervisorAdId: 'supervisor-id',
        supervisorName: 'Supervisor Name',
        permissions: ['permission1', 'permission2'],
        isNewUser: false
      });
    });

    it('should convert response with optional fields undefined', () => {
      const response = new GetCurrentUserResponse(
        'azure-id',
        'user@example.com',
        'John',
        'Doe',
        null,
        undefined,
        undefined,
        [],
        true
      );
      const payload = response.toPayload();

      expect(payload.supervisorAdId).toBeUndefined();
      expect(payload.supervisorName).toBeUndefined();
      expect(payload.isNewUser).toBe(true);
    });
  });
});



