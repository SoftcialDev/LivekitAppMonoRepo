import { FetchStreamingSessionsResponse } from '../../../src/domain/value-objects/FetchStreamingSessionsResponse';
import { StreamingSessionHistory } from '../../../src/domain/entities/StreamingSessionHistory';

describe('FetchStreamingSessionsResponse', () => {
  describe('toPayload', () => {
    it('should convert response with sessions to payload format', () => {
      const mockSessions = [
        {
          userId: 'user-id-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          user: { email: 'user1@example.com' }
        },
        {
          userId: 'user-id-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          user: { email: 'user2@example.com' }
        }
      ] as StreamingSessionHistory[];

      const response = new FetchStreamingSessionsResponse(mockSessions);
      const payload = response.toPayload();

      expect(payload.sessions).toHaveLength(2);
      expect(payload.sessions[0].email).toBe('user1@example.com');
      expect(payload.sessions[1].email).toBe('user2@example.com');
    });

    it('should handle empty sessions array', () => {
      const response = new FetchStreamingSessionsResponse([]);
      const payload = response.toPayload();

      expect(payload.sessions).toEqual([]);
    });

    it('should handle session without user email', () => {
      const mockSessions = [
        {
          userId: 'user-id-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          user: null
        }
      ] as any[];

      const response = new FetchStreamingSessionsResponse(mockSessions);
      const payload = response.toPayload();

      expect(payload.sessions[0].email).toBe('');
    });
  });
});






