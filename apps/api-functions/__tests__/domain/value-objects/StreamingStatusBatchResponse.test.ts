import { StreamingStatusBatchResponse } from '../../../src/domain/value-objects/StreamingStatusBatchResponse';

describe('StreamingStatusBatchResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: {
            stopReason: null,
            stoppedAt: null
          }
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'Manual',
            stoppedAt: '2024-01-01T11:00:00Z'
          }
        }
      ];
      const response = new StreamingStatusBatchResponse(statuses);
      const payload = response.toPayload();

      expect(payload).toEqual({
        statuses: statuses
      });
    });

    it('should handle empty statuses array', () => {
      const response = new StreamingStatusBatchResponse([]);
      const payload = response.toPayload();

      expect(payload.statuses).toEqual([]);
    });
  });
});



