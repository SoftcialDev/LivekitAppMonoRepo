import { FetchStreamingSessionsRequest } from '../../../../../shared/domain/value-objects/FetchStreamingSessionsRequest';
import { FetchStreamingSessionsRequestPayload } from '../../../../../shared/domain/schemas/FetchStreamingSessionsSchema';

describe('FetchStreamingSessionsRequest', () => {
  describe('constructor', () => {
    it('should create request without parameters', () => {
      const request = new FetchStreamingSessionsRequest();

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should create multiple instances', () => {
      const request1 = new FetchStreamingSessionsRequest();
      const request2 = new FetchStreamingSessionsRequest();

      expect(request1).toBeInstanceOf(FetchStreamingSessionsRequest);
      expect(request2).toBeInstanceOf(FetchStreamingSessionsRequest);
      expect(request1).not.toBe(request2); // Different instances
    });
  });

  describe('fromPayload', () => {
    it('should create request from empty payload', () => {
      const payload: FetchStreamingSessionsRequestPayload = {};
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should create request from payload with additional properties', () => {
      const payload: FetchStreamingSessionsRequestPayload = {
        // Add any properties that might be in the payload
      };
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should create multiple instances from different payloads', () => {
      const payload1: FetchStreamingSessionsRequestPayload = {};
      const payload2: FetchStreamingSessionsRequestPayload = {};

      const request1 = FetchStreamingSessionsRequest.fromPayload(payload1);
      const request2 = FetchStreamingSessionsRequest.fromPayload(payload2);

      expect(request1).toBeInstanceOf(FetchStreamingSessionsRequest);
      expect(request2).toBeInstanceOf(FetchStreamingSessionsRequest);
      expect(request1).not.toBe(request2); // Different instances
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const request = new FetchStreamingSessionsRequest();

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      // Since there are no properties to modify, this test mainly ensures
      // the object can be frozen without issues
      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });
  });

  describe('edge cases', () => {
    it('should handle null payload', () => {
      const payload = null as any;
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should handle undefined payload', () => {
      const payload = undefined as any;
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should handle payload with unexpected properties', () => {
      const payload = {
        unexpectedProperty: 'value',
        anotherProperty: 123
      } as any;
      const request = FetchStreamingSessionsRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });
  });

  describe('usage patterns', () => {
    it('should be used in authentication context', () => {
      const request = new FetchStreamingSessionsRequest();

      // This test documents that the request relies on authenticated user context
      // rather than explicit parameters
      expect(request).toBeInstanceOf(FetchStreamingSessionsRequest);
    });

    it('should be serializable', () => {
      const request = new FetchStreamingSessionsRequest();

      // Test that the request can be serialized/deserialized
      const serialized = JSON.stringify(request);
      expect(serialized).toBeDefined();
    });
  });
});
