import { DeleteSnapshotResponse } from '../../../src/domain/value-objects/DeleteSnapshotResponse';

describe('DeleteSnapshotResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const response = new DeleteSnapshotResponse('snapshot-id', 'Snapshot deleted successfully');
      const payload = response.toPayload();

      expect(payload).toEqual({
        deletedId: 'snapshot-id',
        message: 'Snapshot deleted successfully'
      });
    });
  });
});

