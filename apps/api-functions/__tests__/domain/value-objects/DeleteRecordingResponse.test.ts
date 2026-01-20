import { DeleteRecordingResponse } from '../../../src/domain/value-objects/DeleteRecordingResponse';

describe('DeleteRecordingResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format with all fields', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted',
        'session-id',
        'blob/path',
        true,
        false,
        true
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording deleted',
        sessionId: 'session-id',
        blobPath: 'blob/path',
        blobDeleted: true,
        blobMissing: false,
        dbDeleted: true
      });
    });

    it('should convert response with null blobPath', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted',
        'session-id',
        null,
        false,
        false,
        true
      );
      const payload = response.toPayload();

      expect(payload.blobPath).toBeNull();
    });

    it('should convert response with default boolean values', () => {
      const response = new DeleteRecordingResponse(
        'Recording deleted',
        'session-id'
      );
      const payload = response.toPayload();

      expect(payload.blobDeleted).toBe(false);
      expect(payload.blobMissing).toBe(false);
      expect(payload.dbDeleted).toBe(false);
    });
  });
});






