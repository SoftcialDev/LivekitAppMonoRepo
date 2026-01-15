import { TalkSessionAlreadyActiveError } from '../../../src/domain/errors/TalkSessionErrors';
import { TalkSessionErrorCode } from '../../../src/domain/errors/ErrorCodes';

describe('TalkSessionErrors', () => {
  describe('TalkSessionAlreadyActiveError', () => {
    it('should create an instance with message and code', () => {
      const error = new TalkSessionAlreadyActiveError('Session already active');
      expect(error.message).toBe('Session already active');
      expect(error.name).toBe('TalkSessionAlreadyActiveError');
      expect(error.statusCode).toBe(TalkSessionErrorCode.TALK_SESSION_ALREADY_ACTIVE);
      expect(error.activeSessionId).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('should create an instance with activeSessionId', () => {
      const error = new TalkSessionAlreadyActiveError('Session already active', 'session-id-123');
      expect(error.message).toBe('Session already active');
      expect(error.activeSessionId).toBe('session-id-123');
      expect(error.cause).toBeUndefined();
    });

    it('should create an instance with cause', () => {
      const cause = new Error('Original error');
      const error = new TalkSessionAlreadyActiveError('Session already active', undefined, cause);
      expect(error.message).toBe('Session already active');
      expect(error.cause).toBe(cause);
    });

    it('should create an instance with all parameters', () => {
      const cause = new Error('Original error');
      const error = new TalkSessionAlreadyActiveError('Session already active', 'session-id-123', cause);
      expect(error.message).toBe('Session already active');
      expect(error.activeSessionId).toBe('session-id-123');
      expect(error.cause).toBe(cause);
    });
  });
});

