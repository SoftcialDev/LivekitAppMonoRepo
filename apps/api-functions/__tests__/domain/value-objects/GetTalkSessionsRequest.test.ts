import { GetTalkSessionsRequest } from '../../../src/domain/value-objects/GetTalkSessionsRequest';

describe('GetTalkSessionsRequest', () => {
  describe('toPayload', () => {
    it('should convert request to payload format', () => {
      const request = new GetTalkSessionsRequest('caller-id', 1, 10);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-id',
        page: 1,
        limit: 10
      });
    });
  });
});

