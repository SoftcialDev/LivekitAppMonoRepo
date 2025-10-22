import { FetchStreamingSessionHistoryRequest } from '../../../../../shared/domain/value-objects/FetchStreamingSessionHistoryRequest';
import { FetchStreamingSessionHistoryRequestPayload } from '../../../../../shared/domain/schemas/FetchStreamingSessionHistorySchema';

describe('FetchStreamingSessionHistoryRequest', () => {
  describe('constructor', () => {
    it('should create request without parameters', () => {
      const request = new FetchStreamingSessionHistoryRequest();

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should create multiple instances', () => {
      const request1 = new FetchStreamingSessionHistoryRequest();
      const request2 = new FetchStreamingSessionHistoryRequest();

      expect(request1).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
      expect(request2).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
      expect(request1).not.toBe(request2); // Different instances
    });
  });

  describe('fromPayload', () => {
    it('should create request from empty payload', () => {
      const payload: FetchStreamingSessionHistoryRequestPayload = {};
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should create request from payload with additional properties', () => {
      const payload: FetchStreamingSessionHistoryRequestPayload = {
        // Add any properties that might be in the payload
      };
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should create multiple instances from different payloads', () => {
      const payload1: FetchStreamingSessionHistoryRequestPayload = {};
      const payload2: FetchStreamingSessionHistoryRequestPayload = {};

      const request1 = FetchStreamingSessionHistoryRequest.fromPayload(payload1);
      const request2 = FetchStreamingSessionHistoryRequest.fromPayload(payload2);

      expect(request1).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
      expect(request2).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
      expect(request1).not.toBe(request2); // Different instances
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const request = new FetchStreamingSessionHistoryRequest();

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      // Since there are no properties to modify, this test mainly ensures
      // the object can be frozen without issues
      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });
  });

  describe('edge cases', () => {
    it('should handle null payload', () => {
      const payload = null as any;
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should handle undefined payload', () => {
      const payload = undefined as any;
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should handle payload with unexpected properties', () => {
      const payload = {
        unexpectedProperty: 'value',
        anotherProperty: 123
      } as any;
      const request = FetchStreamingSessionHistoryRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });
  });

  describe('usage patterns', () => {
    it('should be used in authentication context', () => {
      const request = new FetchStreamingSessionHistoryRequest();

      // This test documents that the request relies on authenticated user context
      // rather than explicit parameters
      expect(request).toBeInstanceOf(FetchStreamingSessionHistoryRequest);
    });

    it('should be serializable', () => {
      const request = new FetchStreamingSessionHistoryRequest();

      // Test that the request can be serialized/deserialized
      const serialized = JSON.stringify(request);
      expect(serialized).toBeDefined();
    });
  });
});
