import {
  StreamingSessionNotFoundError,
  StreamingSessionAccessDeniedError,
  StreamingSessionUserNotFoundError,
  StreamingSessionFetchError,
  StreamingSessionCreationError,
  StreamingSessionUpdateError,
} from '../../../src/domain/errors/StreamingSessionErrors';

describe('StreamingSessionErrors', () => {
  describe('StreamingSessionNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionNotFoundError();
      expect(error.message).toBe('Streaming session not found');
      expect(error.name).toBe('StreamingSessionNotFoundError');
    });

    it('should create error with custom message', () => {
      const error = new StreamingSessionNotFoundError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('StreamingSessionAccessDeniedError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionAccessDeniedError();
      expect(error.message).toBe('Access denied to streaming session');
      expect(error.name).toBe('StreamingSessionAccessDeniedError');
    });

    it('should create error with custom message', () => {
      const error = new StreamingSessionAccessDeniedError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('StreamingSessionUserNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionUserNotFoundError();
      expect(error.message).toBe('User not found for streaming session');
      expect(error.name).toBe('StreamingSessionUserNotFoundError');
    });

    it('should create error with custom message', () => {
      const error = new StreamingSessionUserNotFoundError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('StreamingSessionFetchError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionFetchError();
      expect(error.message).toBe('Failed to fetch streaming session');
      expect(error.name).toBe('StreamingSessionFetchError');
    });

    it('should create error with custom message', () => {
      const error = new StreamingSessionFetchError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('StreamingSessionCreationError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionCreationError();
      expect(error.message).toBe('Failed to create streaming session');
      expect(error.name).toBe('StreamingSessionCreationError');
    });

    it('should create error with custom message', () => {
      const error = new StreamingSessionCreationError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('StreamingSessionUpdateError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionUpdateError();
      expect(error.message).toBe('Failed to update streaming session');
      expect(error.name).toBe('StreamingSessionUpdateError');
    });

    it('should create error with custom message', () => {
      const error = new StreamingSessionUpdateError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });
});


