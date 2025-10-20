/**
 * @fileoverview RecordingErrors - unit tests
 * @summary Tests for recording specific error classes
 * @description Validates error creation, inheritance, and error message handling
 */

import { 
  RecordingNotFoundError, 
  RecordingAccessDeniedError, 
  RecordingUserNotFoundError, 
  RecordingFetchError, 
  RecordingCreationError, 
  RecordingUpdateError, 
  RecordingDeletionError, 
  RecordingCommandError, 
  NoActiveRecordingsError, 
  RecordingStartError, 
  RecordingStopError 
} from '../../../../../shared/domain/errors/RecordingErrors';

describe('RecordingErrors', () => {
  describe('RecordingNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new RecordingNotFoundError();

      expect(error.message).toBe('Recording session not found');
      expect(error.name).toBe('RecordingNotFoundError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom not found message';
      const error = new RecordingNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingNotFoundError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingAccessDeniedError', () => {
    it('should create error with default message', () => {
      const error = new RecordingAccessDeniedError();

      expect(error.message).toBe('Access denied to recording operations');
      expect(error.name).toBe('RecordingAccessDeniedError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom access denied message';
      const error = new RecordingAccessDeniedError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingAccessDeniedError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingAccessDeniedError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingUserNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new RecordingUserNotFoundError();

      expect(error.message).toBe('User not found for recording operations');
      expect(error.name).toBe('RecordingUserNotFoundError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom user not found message';
      const error = new RecordingUserNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingUserNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingUserNotFoundError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingFetchError', () => {
    it('should create error with default message', () => {
      const error = new RecordingFetchError();

      expect(error.message).toBe('Failed to fetch recordings');
      expect(error.name).toBe('RecordingFetchError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom fetch error message';
      const error = new RecordingFetchError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingFetchError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingFetchError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingCreationError', () => {
    it('should create error with default message', () => {
      const error = new RecordingCreationError();

      expect(error.message).toBe('Failed to create recording session');
      expect(error.name).toBe('RecordingCreationError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom creation error message';
      const error = new RecordingCreationError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingCreationError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingCreationError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingUpdateError', () => {
    it('should create error with default message', () => {
      const error = new RecordingUpdateError();

      expect(error.message).toBe('Failed to update recording session');
      expect(error.name).toBe('RecordingUpdateError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom update error message';
      const error = new RecordingUpdateError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingUpdateError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingUpdateError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingDeletionError', () => {
    it('should create error with default message', () => {
      const error = new RecordingDeletionError();

      expect(error.message).toBe('Failed to delete recording session');
      expect(error.name).toBe('RecordingDeletionError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom deletion error message';
      const error = new RecordingDeletionError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingDeletionError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingDeletionError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingCommandError', () => {
    it('should create error with default message', () => {
      const error = new RecordingCommandError();

      expect(error.message).toBe('Failed to process recording command');
      expect(error.name).toBe('RecordingCommandError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom command error message';
      const error = new RecordingCommandError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingCommandError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingCommandError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('NoActiveRecordingsError', () => {
    it('should create error with default message', () => {
      const error = new NoActiveRecordingsError();

      expect(error.message).toBe('No active recordings found');
      expect(error.name).toBe('NoActiveRecordingsError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom no active recordings message';
      const error = new NoActiveRecordingsError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('NoActiveRecordingsError');
    });

    it('should be instance of Error', () => {
      const error = new NoActiveRecordingsError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingStartError', () => {
    it('should create error with default message', () => {
      const error = new RecordingStartError();

      expect(error.message).toBe('Failed to start recording');
      expect(error.name).toBe('RecordingStartError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom start error message';
      const error = new RecordingStartError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingStartError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingStartError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RecordingStopError', () => {
    it('should create error with default message', () => {
      const error = new RecordingStopError();

      expect(error.message).toBe('Failed to stop recording');
      expect(error.name).toBe('RecordingStopError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom stop error message';
      const error = new RecordingStopError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('RecordingStopError');
    });

    it('should be instance of Error', () => {
      const error = new RecordingStopError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('error usage scenarios', () => {
    it('should handle error throwing and catching', () => {
      const errors = [
        new RecordingNotFoundError('Test error'),
        new RecordingAccessDeniedError('Test error'),
        new RecordingUserNotFoundError('Test error'),
        new RecordingFetchError('Test error'),
        new RecordingCreationError('Test error'),
        new RecordingUpdateError('Test error'),
        new RecordingDeletionError('Test error'),
        new RecordingCommandError('Test error'),
        new NoActiveRecordingsError('Test error'),
        new RecordingStartError('Test error'),
        new RecordingStopError('Test error')
      ];

      errors.forEach(error => {
        expect(() => {
          throw error;
        }).toThrow('Test error');
      });
    });

    it('should support error type checking', () => {
      const errors = [
        new RecordingNotFoundError(),
        new RecordingAccessDeniedError(),
        new RecordingUserNotFoundError(),
        new RecordingFetchError(),
        new RecordingCreationError(),
        new RecordingUpdateError(),
        new RecordingDeletionError(),
        new RecordingCommandError(),
        new NoActiveRecordingsError(),
        new RecordingStartError(),
        new RecordingStopError()
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.stack).toBeDefined();
      });
    });
  });

  describe('error serialization', () => {
    it('should preserve error properties', () => {
      const error = new RecordingNotFoundError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.name).toBe('RecordingNotFoundError');
    });

    it('should be convertible to plain object', () => {
      const error = new RecordingNotFoundError('Test message');
      const errorObject = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };

      expect(errorObject.message).toBe('Test message');
      expect(errorObject.name).toBe('RecordingNotFoundError');
      expect(errorObject.stack).toBeDefined();
    });
  });
});
