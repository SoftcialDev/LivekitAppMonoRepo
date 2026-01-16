import { TransferPsosResponse } from '../../../src/domain/value-objects/TransferPsosResponse';

describe('TransferPsosResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const response = new TransferPsosResponse(5, 'PSOs transferred successfully');
      const payload = response.toPayload();

      expect(payload).toEqual({
        movedCount: 5,
        message: 'PSOs transferred successfully'
      });
    });
  });
});



