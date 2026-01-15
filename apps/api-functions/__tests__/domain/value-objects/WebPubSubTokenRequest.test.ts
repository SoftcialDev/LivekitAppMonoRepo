import { WebPubSubTokenRequest } from '../../../src/domain/value-objects/WebPubSubTokenRequest';

describe('WebPubSubTokenRequest', () => {
  describe('fromParams', () => {
    it('should create instance from params', () => {
      const callerId = 'caller-id-123';
      const params = {} as any;
      const request = WebPubSubTokenRequest.fromParams(callerId, params);

      expect(request).toBeInstanceOf(WebPubSubTokenRequest);
      expect(request.callerId).toBe(callerId);
    });
  });
});

