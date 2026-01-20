import { GetUserDebugResponse } from '../../../src/domain/value-objects/GetUserDebugResponse';

describe('GetUserDebugResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com'
      };
      const response = new GetUserDebugResponse(
        mockUser as any,
        [],
        [],
        null,
        null
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        user: mockUser,
        roles: [],
        permissions: [],
        contactManagerProfile: null,
        supervisor: null
      });
    });
  });
});





