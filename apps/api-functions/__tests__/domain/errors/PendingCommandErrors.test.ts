import {
  PendingCommandNotFoundError,
  PendingCommandExpiredError,
  PendingCommandAccessDeniedError
} from '../../../src/domain/errors/PendingCommandErrors';

describe('PendingCommandErrors', () => {
  describe('PendingCommandNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandNotFoundError();
      expect(error.message).toBe('No pending commands found');
      expect(error.name).toBe('PendingCommandNotFoundError');
    });

    it('should create error with custom message', () => {
      const error = new PendingCommandNotFoundError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('PendingCommandExpiredError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandExpiredError();
      expect(error.message).toBe('Pending command has expired');
      expect(error.name).toBe('PendingCommandExpiredError');
    });

    it('should create error with custom message', () => {
      const error = new PendingCommandExpiredError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('PendingCommandAccessDeniedError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandAccessDeniedError();
      expect(error.message).toBe('Access denied to pending commands');
      expect(error.name).toBe('PendingCommandAccessDeniedError');
    });

    it('should create error with custom message', () => {
      const error = new PendingCommandAccessDeniedError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });
});



