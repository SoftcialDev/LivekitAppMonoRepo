import { StreamingSessionUpdateResponse } from '../../../src/domain/value-objects/StreamingSessionUpdateResponse';
import { StreamingStatus } from '../../../src/domain/enums/StreamingStatus';

describe('StreamingSessionUpdateResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format with all fields', () => {
      const response = new StreamingSessionUpdateResponse(
        'Session updated',
        StreamingStatus.Stopped,
        'Manual stop',
        '2024-01-01T11:00:00Z'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Session updated',
        status: StreamingStatus.Stopped,
        stopReason: 'Manual stop',
        stoppedAt: '2024-01-01T11:00:00Z'
      });
    });

    it('should convert response to payload format without optional fields', () => {
      const response = new StreamingSessionUpdateResponse(
        'Session updated',
        StreamingStatus.Started
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Session updated',
        status: StreamingStatus.Started,
        stopReason: undefined,
        stoppedAt: undefined
      });
    });
  });
});

