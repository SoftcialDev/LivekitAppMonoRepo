import { TalkSessionStartResponse } from '../../../src/domain/value-objects/TalkSessionStartResponse';

describe('TalkSessionStartResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const response = new TalkSessionStartResponse('session-id', 'Talk session started');
      const payload = response.toPayload();

      expect(payload).toEqual({
        talkSessionId: 'session-id',
        message: 'Talk session started'
      });
    });
  });
});


