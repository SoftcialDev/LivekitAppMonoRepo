import { FetchStreamingSessionsResponse } from '../../../../../shared/domain/value-objects/FetchStreamingSessionsResponse';
import { StreamingSessionHistory } from '../../../../../shared/domain/entities/StreamingSessionHistory';

describe('FetchStreamingSessionsResponse', () => {
  describe('constructor', () => {
    it('should create response with sessions array', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          user: {
            email: 'user2@example.com',
            id: 'user-2'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);

      expect(response.sessions).toBe(sessions);
      expect(response.sessions).toHaveLength(2);
    });

    it('should create response with empty sessions array', () => {
      const response = new FetchStreamingSessionsResponse([]);

      expect(response.sessions).toEqual([]);
      expect(response.sessions).toHaveLength(0);
    });

    it('should create response with single session', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);

      expect(response.sessions).toBe(sessions);
      expect(response.sessions).toHaveLength(1);
    });
  });

  describe('withSessions factory method', () => {
    it('should create response with sessions', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          user: {
            email: 'user2@example.com',
            id: 'user-2'
          }
        })
      ];
      const response = FetchStreamingSessionsResponse.withSessions(sessions);

      expect(response.sessions).toBe(sessions);
      expect(response.sessions).toHaveLength(2);
    });

    it('should create response with different session arrays', () => {
      const sessions1 = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        })
      ];
      const sessions2 = [
        new StreamingSessionHistory({
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          user: {
            email: 'user2@example.com',
            id: 'user-2'
          }
        })
      ];

      const response1 = FetchStreamingSessionsResponse.withSessions(sessions1);
      const response2 = FetchStreamingSessionsResponse.withSessions(sessions2);

      expect(response1.sessions).toBe(sessions1);
      expect(response2.sessions).toBe(sessions2);
    });
  });

  describe('withNoSessions factory method', () => {
    it('should create response with empty sessions array', () => {
      const response = FetchStreamingSessionsResponse.withNoSessions();

      expect(response.sessions).toEqual([]);
      expect(response.sessions).toHaveLength(0);
    });

    it('should create multiple instances with empty sessions array', () => {
      const response1 = FetchStreamingSessionsResponse.withNoSessions();
      const response2 = FetchStreamingSessionsResponse.withNoSessions();

      expect(response1.sessions).toEqual([]);
      expect(response2.sessions).toEqual([]);
      expect(response1).not.toBe(response2); // Different instances
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with sessions', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          user: {
            email: 'user2@example.com',
            id: 'user-2'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload).toEqual({
        sessions: [
          {
            email: 'user1@example.com',
            startedAt: '2024-01-01T10:00:00.000Z',
            userId: 'user-1'
          },
          {
            email: 'user2@example.com',
            startedAt: '2024-01-01T11:00:00.000Z',
            userId: 'user-2'
          }
        ]
      });
    });

    it('should convert to payload format with empty sessions array', () => {
      const response = new FetchStreamingSessionsResponse([]);
      const payload = response.toPayload();

      expect(payload).toEqual({
        sessions: []
      });
    });

    it('should convert sessions without user data to payload', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload).toEqual({
        sessions: [
          {
            email: '',
            startedAt: '2024-01-01T10:00:00.000Z',
            userId: 'user-1'
          }
        ]
      });
    });

    it('should convert sessions with user data to payload', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload).toEqual({
        sessions: [
          {
            email: 'user1@example.com',
            startedAt: '2024-01-01T10:00:00.000Z',
            userId: 'user-1'
          }
        ]
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).sessions = [];
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle sessions with different user data', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z')
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload.sessions[0].email).toBe('user1@example.com');
      expect(payload.sessions[1].email).toBe('');
    });

    it('should handle sessions with different timestamp formats', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload.sessions[0].startedAt).toBe('2024-01-01T10:00:00.000Z');
    });

    it('should handle large number of sessions', () => {
      const sessions = Array.from({ length: 100 }, (_, i) => 
        new StreamingSessionHistory({
          id: `session-${i}`,
          userId: `user-${i}`,
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: `user${i}@example.com`,
            id: `user-${i}`
          }
        })
      );
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload.sessions).toHaveLength(100);
      expect(payload.sessions[0].email).toBe('user0@example.com');
      expect(payload.sessions[99].email).toBe('user99@example.com');
    });
  });

  describe('type safety', () => {
    it('should accept StreamingSessionHistory array for sessions', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);

      expect(response.sessions).toBeInstanceOf(Array);
      expect(response.sessions[0]).toBeInstanceOf(StreamingSessionHistory);
    });

    it('should match FetchStreamingSessionsResponsePayload interface', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload).toHaveProperty('sessions');
      expect(payload.sessions).toBeInstanceOf(Array);
      expect(payload.sessions[0]).toHaveProperty('email');
      expect(payload.sessions[0]).toHaveProperty('startedAt');
      expect(payload.sessions[0]).toHaveProperty('userId');
    });
  });

  describe('validation scenarios', () => {
    it('should handle multiple active sessions scenario', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          stoppedAt: null,
          stopReason: null,
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          stoppedAt: null,
          stopReason: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          user: {
            email: 'user2@example.com',
            id: 'user-2'
          }
        })
      ];
      const response = FetchStreamingSessionsResponse.withSessions(sessions);
      const payload = response.toPayload();

      expect(payload.sessions).toHaveLength(2);
      expect(payload.sessions[0].email).toBe('user1@example.com');
      expect(payload.sessions[1].email).toBe('user2@example.com');
    });

    it('should handle no active sessions scenario', () => {
      const response = FetchStreamingSessionsResponse.withNoSessions();
      const payload = response.toPayload();

      expect(payload.sessions).toEqual([]);
    });

    it('should handle mixed session types scenario', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'active-session',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          stoppedAt: null,
          stopReason: null,
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'stopped-session',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          stoppedAt: new Date('2024-01-01T12:00:00Z'),
          stopReason: 'COMMAND',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T12:00:00Z'),
          user: {
            email: 'user2@example.com',
            id: 'user-2'
          }
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload.sessions).toHaveLength(2);
      expect(payload.sessions[0].email).toBe('user1@example.com');
      expect(payload.sessions[1].email).toBe('user2@example.com');
    });

    it('should handle sessions with different user data scenarios', () => {
      const sessions = [
        new StreamingSessionHistory({
          id: 'session-with-user',
          userId: 'user-1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          user: {
            email: 'user1@example.com',
            id: 'user-1'
          }
        }),
        new StreamingSessionHistory({
          id: 'session-without-user',
          userId: 'user-2',
          startedAt: new Date('2024-01-01T11:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z')
        })
      ];
      const response = new FetchStreamingSessionsResponse(sessions);
      const payload = response.toPayload();

      expect(payload.sessions[0].email).toBe('user1@example.com');
      expect(payload.sessions[1].email).toBe('');
    });
  });
});
