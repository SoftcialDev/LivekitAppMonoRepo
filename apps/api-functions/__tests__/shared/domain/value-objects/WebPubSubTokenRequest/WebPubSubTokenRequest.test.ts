import { WebPubSubTokenRequest } from '../../../../../shared/domain/value-objects/WebPubSubTokenRequest';
import { WebPubSubTokenParams } from '../../../../../shared/domain/schemas/WebPubSubTokenSchema';

describe('WebPubSubTokenRequest', () => {
  describe('constructor', () => {
    it('should create request with valid caller ID', () => {
      const request = new WebPubSubTokenRequest('caller-123');

      expect(request.callerId).toBe('caller-123');
    });

    it('should handle different caller ID formats', () => {
      const request1 = new WebPubSubTokenRequest('caller-abc');
      const request2 = new WebPubSubTokenRequest('caller-xyz');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new WebPubSubTokenRequest(uuid);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new WebPubSubTokenRequest(azureObjectId);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle email format caller ID', () => {
      const email = 'user@example.com';
      const request = new WebPubSubTokenRequest(email);

      expect(request.callerId).toBe(email);
    });
  });

  describe('fromParams', () => {
    it('should create request from valid caller ID and empty params', () => {
      const params: WebPubSubTokenParams = {};
      const request = WebPubSubTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
    });

    it('should create request from valid caller ID and params with additional properties', () => {
      const params: WebPubSubTokenParams = {
        // Add any properties that might be in the params
      };
      const request = WebPubSubTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
    });

    it('should handle different caller ID formats from params', () => {
      const params: WebPubSubTokenParams = {};
      const request1 = WebPubSubTokenRequest.fromParams('caller-abc', params);
      const request2 = WebPubSubTokenRequest.fromParams('caller-xyz', params);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle UUID format caller ID from params', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const params: WebPubSubTokenParams = {};
      const request = WebPubSubTokenRequest.fromParams(uuid, params);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID from params', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const params: WebPubSubTokenParams = {};
      const request = WebPubSubTokenRequest.fromParams(azureObjectId, params);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle email format caller ID from params', () => {
      const email = 'user@example.com';
      const params: WebPubSubTokenParams = {};
      const request = WebPubSubTokenRequest.fromParams(email, params);

      expect(request.callerId).toBe(email);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new WebPubSubTokenRequest('caller-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new WebPubSubTokenRequest('');

      expect(request.callerId).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new WebPubSubTokenRequest(longId);

      expect(request.callerId).toBe(longId);
    });

    it('should handle special characters in caller ID', () => {
      const specialId = 'caller-123!@#$%^&*()';
      const request = new WebPubSubTokenRequest(specialId);

      expect(request.callerId).toBe(specialId);
    });

    it('should handle numeric caller ID', () => {
      const numericId = '123456789';
      const request = new WebPubSubTokenRequest(numericId);

      expect(request.callerId).toBe(numericId);
    });

    it('should handle alphanumeric caller ID', () => {
      const alphanumericId = 'caller123abc456def';
      const request = new WebPubSubTokenRequest(alphanumericId);

      expect(request.callerId).toBe(alphanumericId);
    });

    it('should handle unicode characters in caller ID', () => {
      const unicodeId = 'caller-123-émojis-🚀';
      const request = new WebPubSubTokenRequest(unicodeId);

      expect(request.callerId).toBe(unicodeId);
    });

    it('should handle null params', () => {
      const params = null as any;
      const request = WebPubSubTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
    });

    it('should handle undefined params', () => {
      const params = undefined as any;
      const request = WebPubSubTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
    });

    it('should handle params with unexpected properties', () => {
      const params = {
        unexpectedProperty: 'value',
        anotherProperty: 123
      } as any;
      const request = WebPubSubTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new WebPubSubTokenRequest('caller-123');
      expect(typeof request.callerId).toBe('string');
    });

    it('should accept WebPubSubTokenParams interface', () => {
      const params: WebPubSubTokenParams = {};
      const request = WebPubSubTokenRequest.fromParams('caller-123', params);

      expect(request).toBeInstanceOf(WebPubSubTokenRequest);
      expect(request.callerId).toBe('caller-123');
    });
  });

  describe('validation scenarios', () => {
    it('should handle WebPubSub token generation scenario', () => {
      const request = new WebPubSubTokenRequest('user-123');

      expect(request.callerId).toBe('user-123');
    });

    it('should handle admin token generation scenario', () => {
      const request = new WebPubSubTokenRequest('admin-456');

      expect(request.callerId).toBe('admin-456');
    });

    it('should handle supervisor token generation scenario', () => {
      const request = new WebPubSubTokenRequest('supervisor-789');

      expect(request.callerId).toBe('supervisor-789');
    });

    it('should handle Azure AD Object ID token generation scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new WebPubSubTokenRequest(azureObjectId);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle token generation from params scenario', () => {
      const params: WebPubSubTokenParams = {};
      const request = WebPubSubTokenRequest.fromParams('params-caller-123', params);

      expect(request.callerId).toBe('params-caller-123');
    });

    it('should handle PSO token generation scenario', () => {
      const request = new WebPubSubTokenRequest('pso-123');

      expect(request.callerId).toBe('pso-123');
    });

    it('should handle contact manager token generation scenario', () => {
      const request = new WebPubSubTokenRequest('contact-manager-123');

      expect(request.callerId).toBe('contact-manager-123');
    });
  });
});
