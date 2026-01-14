import {
  extractErrorDetails,
  extractErrorMessage,
  extractErrorCause,
  hasErrorProperties,
  extractErrorProperty,
  extractHttpStatusCode,
  extractAxiosErrorMessage,
  extractEgressErrorDetails,
  extractEgressErrorMessage,
  wrapError,
  wrapDatabaseQueryError,
  wrapEntityCreationError,
  wrapEntityUpdateError,
  wrapEntityDeletionError,
  wrapPsoFetchError,
  wrapSupervisorFetchError,
  wrapStreamingSessionFetchError,
  wrapLiveKitOperationError,
  wrapGraphServiceError,
  wrapChatServiceError,
  wrapBlobStorageUploadError,
  wrapBlobStorageDownloadError,
  wrapBlobStorageDeleteError,
} from '../../../src/utils/error/ErrorHelpers';
import { DatabaseQueryError } from '../../../src/domain/errors/RepositoryErrors';
import { GraphServiceError } from '../../../src/domain/errors/InfrastructureErrors';
import { DomainError } from '../../../src/domain/errors/DomainError';

describe('ErrorHelpers', () => {
  describe('extractErrorDetails', () => {
    it('should extract details from Error instance', () => {
      const error = new Error('Test error');
      const result = extractErrorDetails(error);

      expect(result.message).toBe('Test error');
      expect(result.cause).toBe(error);
    });

    it('should extract details from string', () => {
      const result = extractErrorDetails('String error');

      expect(result.message).toBe('String error');
      expect(result.cause).toBeInstanceOf(Error);
    });

    it('should extract details from number', () => {
      const result = extractErrorDetails(123);

      expect(result.message).toBe('123');
      expect(result.cause).toBeInstanceOf(Error);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from Error', () => {
      expect(extractErrorMessage(new Error('Test'))).toBe('Test');
    });

    it('should convert non-Error to string', () => {
      expect(extractErrorMessage('String')).toBe('String');
      expect(extractErrorMessage(123)).toBe('123');
    });
  });

  describe('extractErrorCause', () => {
    it('should return Error instance as-is', () => {
      const error = new Error('Test');
      expect(extractErrorCause(error)).toBe(error);
    });

    it('should wrap non-Error in Error', () => {
      const result = extractErrorCause('String');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('String');
    });
  });

  describe('hasErrorProperties', () => {
    it('should return true when error has all properties', () => {
      const error = { code: 400, message: 'Error' };
      expect(hasErrorProperties(error, 'code', 'message')).toBe(true);
    });

    it('should return false when error missing properties', () => {
      const error = { code: 400 };
      expect(hasErrorProperties(error, 'code', 'message')).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasErrorProperties(null, 'code')).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(hasErrorProperties('string', 'code')).toBe(false);
    });
  });

  describe('extractErrorProperty', () => {
    it('should extract property from error object', () => {
      const error = { code: 400, message: 'Error' };
      expect(extractErrorProperty(error, 'code')).toBe(400);
    });

    it('should return undefined for missing property', () => {
      const error = { code: 400 };
      expect(extractErrorProperty(error, 'message')).toBeUndefined();
    });
  });

  describe('extractHttpStatusCode', () => {
    it('should extract code property', () => {
      const error = { code: 400 };
      expect(extractHttpStatusCode(error)).toBe(400);
    });

    it('should extract statusCode property', () => {
      const error = { statusCode: 404 };
      expect(extractHttpStatusCode(error)).toBe(404);
    });

    it('should extract status property', () => {
      const error = { status: 500 };
      expect(extractHttpStatusCode(error)).toBe(500);
    });

    it('should prioritize code over statusCode', () => {
      const error = { code: 400, statusCode: 404 };
      expect(extractHttpStatusCode(error)).toBe(400);
    });

    it('should return undefined when no status code found', () => {
      const error = { message: 'Error' };
      expect(extractHttpStatusCode(error)).toBeUndefined();
    });
  });

  describe('extractAxiosErrorMessage', () => {
    it('should extract message from axios error with response', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };

      const result = extractAxiosErrorMessage(error);
      expect(result).toContain('HTTP 404');
      expect(result).toContain('Not found');
    });

    it('should fallback to extractErrorMessage when no response', () => {
      const error = new Error('Network error');
      expect(extractAxiosErrorMessage(error)).toBe('Network error');
    });
  });

  describe('extractEgressErrorDetails', () => {
    it('should extract egress error details', () => {
      const info = {
        status: 'failed',
        statusDetail: 'Recording failed',
        error: 'Error message',
        roomName: 'room-123',
        startedAt: '2023-01-01T00:00:00Z',
        duration: 1000,
      };

      const result = extractEgressErrorDetails(info);

      expect(result.status).toBe('failed');
      expect(result.statusDetail).toBe('Recording failed');
      expect(result.error).toBe('Error message');
      expect(result.roomName).toBe('room-123');
      expect(result.startedAt).toBe('2023-01-01T00:00:00Z');
      expect(result.duration).toBe(1000);
    });

    it('should handle alternative property names', () => {
      const info = {
        state: 'failed',
        errorMessage: 'Error',
        startedAtMs: 1000,
        endedAtMs: 2000,
      };

      const result = extractEgressErrorDetails(info);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Error');
      expect(result.startedAt).toBe(1000);
      expect(result.endedAt).toBe(2000);
    });

    it('should return empty object for non-object input', () => {
      expect(extractEgressErrorDetails(null)).toEqual({});
      expect(extractEgressErrorDetails('string')).toEqual({});
    });
  });

  describe('extractEgressErrorMessage', () => {
    it('should return error from details', () => {
      const details = { error: 'Error message' };
      expect(extractEgressErrorMessage(details, null, 'Default')).toBe('Error message');
    });

    it('should fallback to statusDetail', () => {
      const details = { statusDetail: 'Status detail' };
      expect(extractEgressErrorMessage(details, null, 'Default')).toBe('Status detail');
    });

    it('should fallback to errorMessage', () => {
      const details = { errorMessage: 'Error message' };
      expect(extractEgressErrorMessage(details, null, 'Default')).toBe('Error message');
    });

    it('should fallback to extractErrorMessage', () => {
      const details = {};
      const error = new Error('Error');
      expect(extractEgressErrorMessage(details, error, 'Default')).toBe('Error');
    });

    it('should return default message when all fallbacks fail', () => {
      const details = {};
      const emptyError = '';
      expect(extractEgressErrorMessage(details, emptyError, 'Default')).toBe('Default');
    });
  });

  describe('wrapError', () => {
    class TestDomainError extends DomainError {
      constructor(message: string, cause?: Error) {
        super(message, 400);
        this.cause = cause;
      }
    }

    it('should wrap error in domain error', () => {
      const originalError = new Error('Original error');
      const result = wrapError(TestDomainError, 'Base message', originalError);

      expect(result).toBeInstanceOf(TestDomainError);
      expect(result.message).toContain('Base message');
      expect(result.message).toContain('Original error');
    });

    it('should wrap string error', () => {
      const result = wrapError(TestDomainError, 'Base message', 'String error');

      expect(result).toBeInstanceOf(TestDomainError);
      expect(result.message).toContain('String error');
    });
  });

  describe('wrapDatabaseQueryError', () => {
    it('should wrap error in DatabaseQueryError', () => {
      const error = new Error('DB error');
      const result = wrapDatabaseQueryError('Query failed', error);

      expect(result).toBeInstanceOf(DatabaseQueryError);
      expect(result.message).toContain('Query failed');
    });
  });

  describe('wrapEntityCreationError', () => {
    it('should wrap error in EntityCreationError', () => {
      const error = new Error('Creation failed');
      const result = wrapEntityCreationError('Failed to create', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to create');
    });
  });

  describe('wrapEntityUpdateError', () => {
    it('should wrap error in EntityUpdateError', () => {
      const error = new Error('Update failed');
      const result = wrapEntityUpdateError('Failed to update', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to update');
    });
  });

  describe('wrapEntityDeletionError', () => {
    it('should wrap error in EntityDeletionError', () => {
      const error = new Error('Delete failed');
      const result = wrapEntityDeletionError('Failed to delete', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to delete');
    });
  });

  describe('wrapPsoFetchError', () => {
    it('should wrap error in PsoFetchError', () => {
      const error = new Error('Fetch failed');
      const result = wrapPsoFetchError('Failed to fetch PSO', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to fetch PSO');
    });
  });

  describe('wrapSupervisorFetchError', () => {
    it('should wrap error in SupervisorFetchError', () => {
      const error = new Error('Fetch failed');
      const result = wrapSupervisorFetchError('Failed to fetch supervisor', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to fetch supervisor');
    });
  });

  describe('wrapStreamingSessionFetchError', () => {
    it('should wrap error in StreamingSessionFetchError', () => {
      const error = new Error('Fetch failed');
      const result = wrapStreamingSessionFetchError('Failed to fetch session', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to fetch session');
    });
  });

  describe('wrapLiveKitOperationError', () => {
    it('should wrap error in LiveKitOperationError', () => {
      const error = new Error('Operation failed');
      const result = wrapLiveKitOperationError('Failed to perform operation', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to perform operation');
    });
  });

  describe('wrapGraphServiceError', () => {
    it('should wrap error in GraphServiceError', () => {
      const error = new Error('Graph API failed');
      const result = wrapGraphServiceError('Failed to call Graph API', error);

      expect(result).toBeInstanceOf(GraphServiceError);
      expect(result.message).toContain('Failed to call Graph API');
    });
  });

  describe('wrapChatServiceError', () => {
    it('should wrap error in ChatServiceError', () => {
      const error = new Error('Chat failed');
      const result = wrapChatServiceError('Failed to process chat', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to process chat');
    });
  });

  describe('wrapBlobStorageUploadError', () => {
    it('should wrap error in BlobStorageUploadError', () => {
      const error = new Error('Upload failed');
      const result = wrapBlobStorageUploadError('Failed to upload', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to upload');
    });
  });

  describe('wrapBlobStorageDownloadError', () => {
    it('should wrap error in BlobStorageDownloadError', () => {
      const error = new Error('Download failed');
      const result = wrapBlobStorageDownloadError('Failed to download', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to download');
    });
  });

  describe('wrapBlobStorageDeleteError', () => {
    it('should wrap error in BlobStorageDeleteError', () => {
      const error = new Error('Delete failed');
      const result = wrapBlobStorageDeleteError('Failed to delete', error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Failed to delete');
    });
  });
});

