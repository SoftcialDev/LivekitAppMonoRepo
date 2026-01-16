import { FetchStreamingSessionsRequest } from '../../../src/domain/value-objects/FetchStreamingSessionsRequest';

describe('FetchStreamingSessionsRequest', () => {
  describe('fromPayload', () => {
    it('should create instance from payload', () => {
      const payload = {} as any;
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should create instance from empty payload', () => {
      const payload = undefined as any;
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });
  });
});



