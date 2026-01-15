import { TalkSessionStopRequest } from '../../../src/domain/value-objects/TalkSessionStopRequest';
import { TalkStopReason } from '../../../src/domain/enums/TalkStopReason';

describe('TalkSessionStopRequest', () => {
  describe('toPayload', () => {
    it('should convert request to payload format', () => {
      const request = new TalkSessionStopRequest('session-id', TalkStopReason.USER_STOP);
      const payload = request.toPayload();

      expect(payload).toEqual({
        talkSessionId: 'session-id',
        stopReason: TalkStopReason.USER_STOP
      });
    });
  });
});

