import { FetchStreamingSessionHistoryRequest } from '../../../src/domain/value-objects/FetchStreamingSessionHistoryRequest';

describe('FetchStreamingSessionHistoryRequest', () => {
  describe('fromPayload', () => {
    it('should create instance from payload', () => {
      const payload = {} as any;
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should create instance from empty payload', () => {
      const payload = undefined as any;
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });
  });
});


