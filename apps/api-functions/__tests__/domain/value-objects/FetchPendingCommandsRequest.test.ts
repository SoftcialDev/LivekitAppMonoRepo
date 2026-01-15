import { FetchPendingCommandsRequest } from '../../../src/domain/value-objects/FetchPendingCommandsRequest';

describe('FetchPendingCommandsRequest', () => {
  describe('fromPayload', () => {
    it('should create instance from payload', () => {
      const payload = {} as any;
      const request = FetchPendingCommandsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchPendingCommandsRequest);
    });

    it('should create instance from empty payload', () => {
      const payload = undefined as any;
      const request = FetchPendingCommandsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchPendingCommandsRequest);
    });
  });
});

