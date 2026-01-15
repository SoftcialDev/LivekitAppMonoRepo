import { StreamingSessionUpdateRequest } from '../../../src/domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingStatus } from '../../../src/domain/enums/StreamingStatus';

describe('StreamingSessionUpdateRequest', () => {
  describe('toPayload', () => {
    it('should convert request to payload format with all fields', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-id',
        StreamingStatus.Started,
        true,
        'Command reason'
      );
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-id',
        status: StreamingStatus.Started,
        isCommand: true,
        reason: 'Command reason'
      });
    });

    it('should convert request to payload format without optional fields', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-id',
        StreamingStatus.Stopped
      );
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-id',
        status: StreamingStatus.Stopped,
        isCommand: undefined,
        reason: undefined
      });
    });
  });
});

