import { SendSnapshotResponse } from '../../../src/domain/value-objects/SendSnapshotResponse';

describe('SendSnapshotResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const response = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');
      const payload = response.toPayload();

      expect(payload).toEqual({
        snapshotId: 'snapshot-id',
        message: 'Snapshot sent successfully'
      });
    });
  });
});





