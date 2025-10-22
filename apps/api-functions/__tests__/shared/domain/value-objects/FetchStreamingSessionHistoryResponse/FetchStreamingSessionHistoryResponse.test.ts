import { FetchStreamingSessionHistoryResponse } from '../../../../../shared/domain/value-objects/FetchStreamingSessionHistoryResponse';
import { StreamingSessionHistory } from '../../../../../shared/domain/entities/StreamingSessionHistory';

describe('FetchStreamingSessionHistoryResponse', () => {
  describe('constructor', () => {
    it('should create response with session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        user: {
          email: 'user@example.com',
          id: 'user-456'
        }
      });
      const response = new FetchStreamingSessionHistoryResponse(session);

      expect(response.session).toBe(session);
    });

    it('should create response with null session', () => {
      const response = new FetchStreamingSessionHistoryResponse(null);

      expect(response.session).toBeNull();
    });

    it('should create response with different session types', () => {
      const activeSession = new StreamingSessionHistory({
        id: 'active-session',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: null,
        stopReason: null,
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      });
      const stoppedSession = new StreamingSessionHistory({
        id: 'stopped-session',
        userId: 'user-2',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'DISCONNECT',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });

      const response1 = new FetchStreamingSessionHistoryResponse(activeSession);
      const response2 = new FetchStreamingSessionHistoryResponse(stoppedSession);

      expect(response1.session).toBe(activeSession);
      expect(response2.session).toBe(stoppedSession);
    });
  });

  describe('withSession factory method', () => {
    it('should create response with session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });
      const response = FetchStreamingSessionHistoryResponse.withSession(session);

      expect(response.session).toBe(session);
    });

    it('should create response with different sessions', () => {
      const session1 = new StreamingSessionHistory({
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: null,
        stopReason: null,
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      });
      const session2 = new StreamingSessionHistory({
        id: 'session-2',
        userId: 'user-2',
        startedAt: new Date('2024-01-01T11:00:00Z'),
        stoppedAt: new Date('2024-01-01T13:00:00Z'),
        stopReason: 'DISCONNECT',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T13:00:00Z')
      });

      const response1 = FetchStreamingSessionHistoryResponse.withSession(session1);
      const response2 = FetchStreamingSessionHistoryResponse.withSession(session2);

      expect(response1.session).toBe(session1);
      expect(response2.session).toBe(session2);
    });
  });

  describe('withNoSession factory method', () => {
    it('should create response with null session', () => {
      const response = FetchStreamingSessionHistoryResponse.withNoSession();

      expect(response.session).toBeNull();
    });

    it('should create multiple instances with null session', () => {
      const response1 = FetchStreamingSessionHistoryResponse.withNoSession();
      const response2 = FetchStreamingSessionHistoryResponse.withNoSession();

      expect(response1.session).toBeNull();
      expect(response2.session).toBeNull();
      expect(response1).not.toBe(response2); // Different instances
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        user: {
          email: 'user@example.com',
          id: 'user-456'
        }
      });
      const response = new FetchStreamingSessionHistoryResponse(session);
      const payload = response.toPayload();

      expect(payload).toEqual({
        session: {
          id: 'session-123',
          userId: 'user-456',
          startedAt: '2024-01-01T10:00:00.000Z',
          stoppedAt: '2024-01-01T12:00:00.000Z',
          stopReason: 'COMMAND',
          createdAt: '2024-01-01T09:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z'
        }
      });
    });

    it('should convert to payload format with null session', () => {
      const response = new FetchStreamingSessionHistoryResponse(null);
      const payload = response.toPayload();

      expect(payload).toEqual({
        session: null
      });
    });

    it('should convert active session to payload', () => {
      const activeSession = new StreamingSessionHistory({
        id: 'active-session',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: null,
        stopReason: null,
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      });
      const response = new FetchStreamingSessionHistoryResponse(activeSession);
      const payload = response.toPayload();

      expect(payload.session).toEqual({
        id: 'active-session',
        userId: 'user-1',
        startedAt: '2024-01-01T10:00:00.000Z',
        stoppedAt: null,
        stopReason: null,
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z'
      });
    });

    it('should convert stopped session to payload', () => {
      const stoppedSession = new StreamingSessionHistory({
        id: 'stopped-session',
        userId: 'user-2',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'DISCONNECT',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });
      const response = new FetchStreamingSessionHistoryResponse(stoppedSession);
      const payload = response.toPayload();

      expect(payload.session).toEqual({
        id: 'stopped-session',
        userId: 'user-2',
        startedAt: '2024-01-01T10:00:00.000Z',
        stoppedAt: '2024-01-01T12:00:00.000Z',
        stopReason: 'DISCONNECT',
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z'
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });
      const response = new FetchStreamingSessionHistoryResponse(session);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).session = null;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle session with minimal properties', () => {
      const minimalSession = new StreamingSessionHistory({
        id: 'minimal-session',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      });
      const response = new FetchStreamingSessionHistoryResponse(minimalSession);
      const payload = response.toPayload();

      expect(payload.session).toEqual({
        id: 'minimal-session',
        userId: 'user-1',
        startedAt: '2024-01-01T10:00:00.000Z',
        stoppedAt: null,
        stopReason: null,
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z'
      });
    });

    it('should handle session with all properties', () => {
      const fullSession = new StreamingSessionHistory({
        id: 'full-session',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        user: {
          email: 'user@example.com',
          id: 'user-1'
        }
      });
      const response = new FetchStreamingSessionHistoryResponse(fullSession);
      const payload = response.toPayload();

      expect(payload.session).toEqual({
        id: 'full-session',
        userId: 'user-1',
        startedAt: '2024-01-01T10:00:00.000Z',
        stoppedAt: '2024-01-01T12:00:00.000Z',
        stopReason: 'COMMAND',
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z'
      });
    });

    it('should handle different timestamp formats', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });
      const response = new FetchStreamingSessionHistoryResponse(session);
      const payload = response.toPayload();

      expect(payload.session?.startedAt).toBe('2024-01-01T10:00:00.000Z');
      expect(payload.session?.stoppedAt).toBe('2024-01-01T12:00:00.000Z');
      expect(payload.session?.createdAt).toBe('2024-01-01T09:00:00.000Z');
      expect(payload.session?.updatedAt).toBe('2024-01-01T12:00:00.000Z');
    });
  });

  describe('type safety', () => {
    it('should accept StreamingSessionHistory or null for session', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      });
      const response1 = new FetchStreamingSessionHistoryResponse(session);
      const response2 = new FetchStreamingSessionHistoryResponse(null);

      expect(response1.session).toBeInstanceOf(StreamingSessionHistory);
      expect(response2.session).toBeNull();
    });

    it('should match FetchStreamingSessionHistoryResponsePayload interface', () => {
      const session = new StreamingSessionHistory({
        id: 'session-123',
        userId: 'user-456',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });
      const response = new FetchStreamingSessionHistoryResponse(session);
      const payload = response.toPayload();

      expect(payload).toHaveProperty('session');
      expect(payload.session).toHaveProperty('id');
      expect(payload.session).toHaveProperty('userId');
      expect(payload.session).toHaveProperty('startedAt');
      expect(payload.session).toHaveProperty('stoppedAt');
      expect(payload.session).toHaveProperty('stopReason');
      expect(payload.session).toHaveProperty('createdAt');
      expect(payload.session).toHaveProperty('updatedAt');
    });
  });

  describe('validation scenarios', () => {
    it('should handle active session scenario', () => {
      const activeSession = new StreamingSessionHistory({
        id: 'active-session',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: null,
        stopReason: null,
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      });
      const response = FetchStreamingSessionHistoryResponse.withSession(activeSession);
      const payload = response.toPayload();

      expect(payload.session?.stoppedAt).toBeNull();
      expect(payload.session?.stopReason).toBeNull();
    });

    it('should handle stopped session scenario', () => {
      const stoppedSession = new StreamingSessionHistory({
        id: 'stopped-session',
        userId: 'user-2',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'COMMAND',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });
      const response = FetchStreamingSessionHistoryResponse.withSession(stoppedSession);
      const payload = response.toPayload();

      expect(payload.session?.stoppedAt).toBe('2024-01-01T12:00:00.000Z');
      expect(payload.session?.stopReason).toBe('COMMAND');
    });

    it('should handle no session found scenario', () => {
      const response = FetchStreamingSessionHistoryResponse.withNoSession();
      const payload = response.toPayload();

      expect(payload.session).toBeNull();
    });

    it('should handle session with user data scenario', () => {
      const sessionWithUser = new StreamingSessionHistory({
        id: 'session-with-user',
        userId: 'user-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        stoppedAt: new Date('2024-01-01T12:00:00Z'),
        stopReason: 'DISCONNECT',
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        user: {
          email: 'user@example.com',
          id: 'user-1'
        }
      });
      const response = new FetchStreamingSessionHistoryResponse(sessionWithUser);
      const payload = response.toPayload();

      expect(payload.session?.id).toBe('session-with-user');
      expect(payload.session?.userId).toBe('user-1');
      expect(payload.session?.stopReason).toBe('DISCONNECT');
    });
  });
});
