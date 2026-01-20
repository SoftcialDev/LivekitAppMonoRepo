import { DeleteRecordingRequest } from '../../../src/domain/value-objects/DeleteRecordingRequest';

describe('DeleteRecordingRequest', () => {
  describe('toPayload', () => {
    it('should convert request to payload format', () => {
      const request = new DeleteRecordingRequest('recording-id-123');
      const payload = request.toPayload();

      expect(payload).toEqual({
        id: 'recording-id-123'
      });
    });
  });
});





