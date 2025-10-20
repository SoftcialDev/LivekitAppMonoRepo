/**
 * @fileoverview DeleteRecordingResponse value object - unit tests
 * @summary Tests for DeleteRecordingResponse value object functionality
 * @description Validates response creation, properties, and payload conversion
 */

import { DeleteRecordingResponse } from '../../../../../shared/domain/value-objects/DeleteRecordingResponse';

describe('DeleteRecordingResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        '/path/to/recording.mp4',
        true,
        false,
        true
      );

      expect(response.message).toBe('Recording deleted successfully');
      expect(response.sessionId).toBe('session-123');
      expect(response.blobPath).toBe('/path/to/recording.mp4');
      expect(response.blobDeleted).toBe(true);
      expect(response.blobMissing).toBe(false);
      expect(response.dbDeleted).toBe(true);
    });

    it('should create response with default boolean values', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123'
      );

      expect(response.message).toBe('Recording deleted successfully');
      expect(response.sessionId).toBe('session-123');
      expect(response.blobPath).toBeUndefined();
      expect(response.blobDeleted).toBe(false);
      expect(response.blobMissing).toBe(false);
      expect(response.dbDeleted).toBe(false);
    });

    it('should create response with null blob path', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        null,
        false,
        false,
        true
      );

      expect(response.blobPath).toBeNull();
      expect(response.blobDeleted).toBe(false);
      expect(response.blobMissing).toBe(false);
      expect(response.dbDeleted).toBe(true);
    });

    it('should create response with undefined blob path', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        undefined,
        false,
        false,
        true
      );

      expect(response.blobPath).toBeUndefined();
    });
  });

  describe('scenarios', () => {
    it('should handle successful deletion with blob', () => {
      const response = new DeleteRecordingResponse(
        'Recording and blob deleted successfully',
        'session-123',
        '/recordings/session-123.mp4',
        true,
        false,
        true
      );

      expect(response.message).toBe('Recording and blob deleted successfully');
      expect(response.sessionId).toBe('session-123');
      expect(response.blobPath).toBe('/recordings/session-123.mp4');
      expect(response.blobDeleted).toBe(true);
      expect(response.blobMissing).toBe(false);
      expect(response.dbDeleted).toBe(true);
    });

    it('should handle successful deletion without blob', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully (no blob)',
        'session-456',
        null,
        false,
        true,
        true
      );

      expect(response.message).toBe('Recording deleted successfully (no blob)');
      expect(response.sessionId).toBe('session-456');
      expect(response.blobPath).toBeNull();
      expect(response.blobDeleted).toBe(false);
      expect(response.blobMissing).toBe(true);
      expect(response.dbDeleted).toBe(true);
    });

    it('should handle database deletion failure', () => {
      const response = new DeleteRecordingResponse(
        'Failed to delete database record',
        'session-789',
        '/recordings/session-789.mp4',
        true,
        false,
        false
      );

      expect(response.message).toBe('Failed to delete database record');
      expect(response.sessionId).toBe('session-789');
      expect(response.blobDeleted).toBe(true);
      expect(response.dbDeleted).toBe(false);
    });

    it('should handle blob deletion failure', () => {
      const response = new DeleteRecordingResponse(
        'Database deleted but blob deletion failed',
        'session-abc',
        '/recordings/session-abc.mp4',
        false,
        false,
        true
      );

      expect(response.message).toBe('Database deleted but blob deletion failed');
      expect(response.sessionId).toBe('session-abc');
      expect(response.blobDeleted).toBe(false);
      expect(response.dbDeleted).toBe(true);
    });

    it('should handle complete failure', () => {
      const response = new DeleteRecordingResponse(
        'Failed to delete recording',
        'session-failed',
        '/recordings/session-failed.mp4',
        false,
        false,
        false
      );

      expect(response.message).toBe('Failed to delete recording');
      expect(response.sessionId).toBe('session-failed');
      expect(response.blobDeleted).toBe(false);
      expect(response.dbDeleted).toBe(false);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with all properties', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        '/path/to/recording.mp4',
        true,
        false,
        true
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording deleted successfully',
        sessionId: 'session-123',
        blobPath: '/path/to/recording.mp4',
        blobDeleted: true,
        blobMissing: false,
        dbDeleted: true
      });
    });

    it('should convert to payload format with null blob path', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        null,
        false,
        true,
        true
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording deleted successfully',
        sessionId: 'session-123',
        blobPath: null,
        blobDeleted: false,
        blobMissing: true,
        dbDeleted: true
      });
    });

    it('should convert to payload format with undefined blob path', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        undefined,
        false,
        false,
        true
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording deleted successfully',
        sessionId: 'session-123',
        blobPath: undefined,
        blobDeleted: false,
        blobMissing: false,
        dbDeleted: true
      });
    });

    it('should convert to payload format with default values', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123'
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording deleted successfully',
        sessionId: 'session-123',
        blobPath: undefined,
        blobDeleted: false,
        blobMissing: false,
        dbDeleted: false
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        '/path/to/recording.mp4',
        true,
        false,
        true
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).message = 'Modified message';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).sessionId = 'modified-session';
      }).not.toThrow();

      expect(() => {
        (response as any).blobDeleted = false;
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const response = new DeleteRecordingResponse(
        '',
        'session-123'
      );

      expect(response.message).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long message that contains detailed information about the recording deletion process and provides comprehensive context for debugging purposes';
      const response = new DeleteRecordingResponse(
        longMessage,
        'session-123'
      );

      expect(response.message).toBe(longMessage);
    });

    it('should handle special characters in session ID', () => {
      const specialSessionId = 'session-123_abc-456.def';
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        specialSessionId
      );

      expect(response.sessionId).toBe(specialSessionId);
    });

    it('should handle long blob paths', () => {
      const longBlobPath = '/recordings/' + 'a'.repeat(1000) + '.mp4';
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        longBlobPath
      );

      expect(response.blobPath).toBe(longBlobPath);
    });

    it('should handle different blob path formats', () => {
      const httpPath = 'http://storage.example.com/recordings/session-123.mp4';
      const httpsPath = 'https://storage.example.com/recordings/session-123.mp4';
      const relativePath = 'recordings/session-123.mp4';

      const httpResponse = new DeleteRecordingResponse('Message', 'session-123', httpPath);
      const httpsResponse = new DeleteRecordingResponse('Message', 'session-123', httpsPath);
      const relativeResponse = new DeleteRecordingResponse('Message', 'session-123', relativePath);

      expect(httpResponse.blobPath).toBe(httpPath);
      expect(httpsResponse.blobPath).toBe(httpsPath);
      expect(relativeResponse.blobPath).toBe(relativePath);
    });
  });

  describe('type safety', () => {
    it('should accept string types for message and sessionId', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123'
      );

      expect(typeof response.message).toBe('string');
      expect(typeof response.sessionId).toBe('string');
    });

    it('should accept boolean types for flags', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted successfully',
        'session-123',
        '/path/to/recording.mp4',
        true,
        false,
        true
      );

      expect(typeof response.blobDeleted).toBe('boolean');
      expect(typeof response.blobMissing).toBe('boolean');
      expect(typeof response.dbDeleted).toBe('boolean');
    });

    it('should accept string or null for blobPath', () => {
      const stringResponse = new DeleteRecordingResponse(
        'Message',
        'session-123',
        '/path/to/recording.mp4'
      );

      const nullResponse = new DeleteRecordingResponse(
        'Message',
        'session-123',
        null
      );

      expect(typeof stringResponse.blobPath).toBe('string');
      expect(nullResponse.blobPath).toBeNull();
    });
  });

  describe('validation scenarios', () => {
    it('should handle successful complete deletion', () => {
      const response = new DeleteRecordingResponse(
        'Recording and all associated data deleted successfully',
        'session-complete-123',
        '/recordings/session-complete-123.mp4',
        true,
        false,
        true
      );

      expect(response.blobDeleted).toBe(true);
      expect(response.blobMissing).toBe(false);
      expect(response.dbDeleted).toBe(true);
    });

    it('should handle partial deletion success', () => {
      const response = new DeleteRecordingResponse(
        'Database deleted but blob was missing',
        'session-partial-123',
        '/recordings/session-partial-123.mp4',
        false,
        true,
        true
      );

      expect(response.blobDeleted).toBe(false);
      expect(response.blobMissing).toBe(true);
      expect(response.dbDeleted).toBe(true);
    });

    it('should handle no deletion success', () => {
      const response = new DeleteRecordingResponse(
        'No deletion performed - recording not found',
        'session-not-found',
        null,
        false,
        true,
        false
      );

      expect(response.blobDeleted).toBe(false);
      expect(response.blobMissing).toBe(true);
      expect(response.dbDeleted).toBe(false);
    });
  });
});
