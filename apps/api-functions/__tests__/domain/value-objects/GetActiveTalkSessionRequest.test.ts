import { GetActiveTalkSessionRequest } from '../../../src/domain/value-objects/GetActiveTalkSessionRequest';

describe('GetActiveTalkSessionRequest', () => {
  describe('toPayload', () => {
    it('should convert request to payload format', () => {
      const request = new GetActiveTalkSessionRequest('caller-id', 'pso@example.com');
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-id',
        psoEmail: 'pso@example.com'
      });
    });
  });
});





