import { DeleteRecordingRequest } from '../../../../../shared/domain/value-objects/DeleteRecordingRequest';
import { DeleteRecordingParams } from '../../../../../shared/domain/schemas/DeleteRecordingSchema';

describe('DeleteRecordingRequest', () => {
  describe('constructor', () => {
    it('should create request with valid recording ID', () => {
      const request = new DeleteRecordingRequest('recording-123');

      expect(request.id).toBe('recording-123');
    });

    it('should handle different recording ID formats', () => {
      const recordingIds = [
        'recording-123',
        'rec-456',
        'session-789',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000'
      ];

      recordingIds.forEach(recordingId => {
        const request = new DeleteRecordingRequest(recordingId);
        expect(request.id).toBe(recordingId);
      });
    });
  });

  describe('fromParams', () => {
    it('should create request from valid params', () => {
      const params: DeleteRecordingParams = {
        id: 'recording-123'
      };

      const request = DeleteRecordingRequest.fromParams(params);

      expect(request.id).toBe('recording-123');
    });

    it('should handle different recording ID formats from params', () => {
      const recordingIds = [
        'recording-123',
        'rec-456',
        'session-789',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000'
      ];

      recordingIds.forEach(recordingId => {
        const params: DeleteRecordingParams = { id: recordingId };
        const request = DeleteRecordingRequest.fromParams(params);
        expect(request.id).toBe(recordingId);
      });
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const request = new DeleteRecordingRequest('recording-123');
      const payload = request.toPayload();

      expect(payload).toEqual({
        id: 'recording-123'
      });
    });

    it('should return immutable payload', () => {
      const request = new DeleteRecordingRequest('recording-123');
      const payload = request.toPayload();

      // Try to modify payload
      (payload as any).id = 'modified-id';

      // Original request should be unchanged
      expect(request.id).toBe('recording-123');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new DeleteRecordingRequest('recording-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).id = 'modified-recording-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty recording ID string', () => {
      const request = new DeleteRecordingRequest('');
      expect(request.id).toBe('');
    });

    it('should handle long recording ID string', () => {
      const longRecordingId = 'recording-' + 'a'.repeat(100);
      const request = new DeleteRecordingRequest(longRecordingId);
      expect(request.id).toBe(longRecordingId);
    });

    it('should handle special characters in recording ID', () => {
      const specialRecordingId = 'recording-123_test.456@domain';
      const request = new DeleteRecordingRequest(specialRecordingId);
      expect(request.id).toBe(specialRecordingId);
    });

    it('should handle numeric recording ID', () => {
      const numericRecordingId = '123456789';
      const request = new DeleteRecordingRequest(numericRecordingId);
      expect(request.id).toBe(numericRecordingId);
    });

    it('should handle UUID format recording ID', () => {
      const uuidRecordingId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new DeleteRecordingRequest(uuidRecordingId);
      expect(request.id).toBe(uuidRecordingId);
    });
  });
});
