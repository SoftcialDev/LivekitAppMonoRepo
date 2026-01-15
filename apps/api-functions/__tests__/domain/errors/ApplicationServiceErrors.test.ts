import { ApplicationServiceOperationError, RecordingSessionNotFoundError } from '../../../src/domain/errors/ApplicationServiceErrors';

describe('ApplicationServiceErrors', () => {
  describe('ApplicationServiceOperationError', () => {
    it('should create error with message', () => {
      const error = new ApplicationServiceOperationError('Test error message');
      expect(error.message).toBe('Test error message');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new ApplicationServiceOperationError('Test error', cause);
      expect(error.message).toBe('Test error');
      expect(error.cause).toBe(cause);
    });
  });

  describe('RecordingSessionNotFoundError', () => {
    it('should create error with message', () => {
      const error = new RecordingSessionNotFoundError('Session not found');
      expect(error.message).toBe('Session not found');
      expect(error).toBeInstanceOf(Error);
    });
  });
});

