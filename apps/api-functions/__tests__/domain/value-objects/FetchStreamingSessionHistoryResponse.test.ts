import { FetchStreamingSessionHistoryResponse } from '../../../src/domain/value-objects/FetchStreamingSessionHistoryResponse';
import { StreamingSessionHistory } from '../../../src/domain/entities/StreamingSessionHistory';

describe('FetchStreamingSessionHistoryResponse', () => {
  describe('toPayload', () => {
    it('should convert response with session to payload format', () => {
      const mockSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T11:00:00Z'),
        stopReason: 'Manual',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z')
      } as StreamingSessionHistory;

      const response = new FetchStreamingSessionHistoryResponse(mockSession);
      const payload = response.toPayload();

      expect(payload.session).toBeDefined();
      expect(payload.session?.id).toBe('session-id');
      expect(payload.session?.userId).toBe('user-id');
    });

    it('should convert response with null session to payload format', () => {
      const response = new FetchStreamingSessionHistoryResponse(null);
      const payload = response.toPayload();

      expect(payload.session).toBeNull();
    });
  });
});


