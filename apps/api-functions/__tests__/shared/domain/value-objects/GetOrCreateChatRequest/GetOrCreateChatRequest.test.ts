import { GetOrCreateChatRequest } from '../../../../../shared/domain/value-objects/GetOrCreateChatRequest';

describe('GetOrCreateChatRequest', () => {
  describe('constructor', () => {
    it('should create request with valid caller ID and PSO email', () => {
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle different caller ID formats', () => {
      const request1 = new GetOrCreateChatRequest('caller-abc', 'pso1@example.com');
      const request2 = new GetOrCreateChatRequest('caller-xyz', 'pso2@example.com');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different PSO email formats', () => {
      const request1 = new GetOrCreateChatRequest('caller-123', 'pso1@example.com');
      const request2 = new GetOrCreateChatRequest('caller-123', 'pso2@company.com');

      expect(request1.psoEmail).toBe('pso1@example.com');
      expect(request2.psoEmail).toBe('pso2@company.com');
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new GetOrCreateChatRequest(uuid, 'pso@example.com');

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new GetOrCreateChatRequest(azureObjectId, 'pso@example.com');

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle email format caller ID', () => {
      const email = 'user@example.com';
      const request = new GetOrCreateChatRequest(email, 'pso@example.com');

      expect(request.callerId).toBe(email);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid caller ID and body', () => {
      const body = { psoEmail: 'pso@example.com' };
      const request = GetOrCreateChatRequest.fromBody('caller-123', body);

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle different caller ID formats from body', () => {
      const body = { psoEmail: 'pso@example.com' };
      const request1 = GetOrCreateChatRequest.fromBody('caller-abc', body);
      const request2 = GetOrCreateChatRequest.fromBody('caller-xyz', body);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different PSO email formats from body', () => {
      const body1 = { psoEmail: 'pso1@example.com' };
      const body2 = { psoEmail: 'pso2@company.com' };

      const request1 = GetOrCreateChatRequest.fromBody('caller-123', body1);
      const request2 = GetOrCreateChatRequest.fromBody('caller-123', body2);

      expect(request1.psoEmail).toBe('pso1@example.com');
      expect(request2.psoEmail).toBe('pso2@company.com');
    });

    it('should handle UUID format caller ID from body', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const body = { psoEmail: 'pso@example.com' };
      const request = GetOrCreateChatRequest.fromBody(uuid, body);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID from body', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const body = { psoEmail: 'pso@example.com' };
      const request = GetOrCreateChatRequest.fromBody(azureObjectId, body);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle email format caller ID from body', () => {
      const email = 'user@example.com';
      const body = { psoEmail: 'pso@example.com' };
      const request = GetOrCreateChatRequest.fromBody(email, body);

      expect(request.callerId).toBe(email);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();

      expect(() => {
        (request as any).psoEmail = 'modified@pso.com';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new GetOrCreateChatRequest('', 'pso@example.com');

      expect(request.callerId).toBe('');
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle empty PSO email string', () => {
      const request = new GetOrCreateChatRequest('caller-123', '');

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new GetOrCreateChatRequest(longId, 'pso@example.com');

      expect(request.callerId).toBe(longId);
    });

    it('should handle long PSO email string', () => {
      const longEmail = 'pso-' + 'a'.repeat(1000) + '@example.com';
      const request = new GetOrCreateChatRequest('caller-123', longEmail);

      expect(request.psoEmail).toBe(longEmail);
    });

    it('should handle special characters in caller ID', () => {
      const specialId = 'caller-123!@#$%^&*()';
      const request = new GetOrCreateChatRequest(specialId, 'pso@example.com');

      expect(request.callerId).toBe(specialId);
    });

    it('should handle special characters in PSO email', () => {
      const specialEmail = 'pso+test@example.com';
      const request = new GetOrCreateChatRequest('caller-123', specialEmail);

      expect(request.psoEmail).toBe(specialEmail);
    });

    it('should handle unicode characters in caller ID', () => {
      const unicodeId = 'caller-123-émojis-🚀';
      const request = new GetOrCreateChatRequest(unicodeId, 'pso@example.com');

      expect(request.callerId).toBe(unicodeId);
    });

    it('should handle unicode characters in PSO email', () => {
      const unicodeEmail = 'pso-émojis-🚀@example.com';
      const request = new GetOrCreateChatRequest('caller-123', unicodeEmail);

      expect(request.psoEmail).toBe(unicodeEmail);
    });

    it('should handle numeric caller ID', () => {
      const numericId = '123456789';
      const request = new GetOrCreateChatRequest(numericId, 'pso@example.com');

      expect(request.callerId).toBe(numericId);
    });

    it('should handle alphanumeric caller ID', () => {
      const alphanumericId = 'caller123abc456def';
      const request = new GetOrCreateChatRequest(alphanumericId, 'pso@example.com');

      expect(request.callerId).toBe(alphanumericId);
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');
      expect(typeof request.callerId).toBe('string');
    });

    it('should accept string for psoEmail', () => {
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');
      expect(typeof request.psoEmail).toBe('string');
    });

    it('should accept body object with psoEmail property', () => {
      const body = { psoEmail: 'pso@example.com' };
      const request = GetOrCreateChatRequest.fromBody('caller-123', body);

      expect(request).toBeInstanceOf(GetOrCreateChatRequest);
      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@example.com');
    });
  });

  describe('validation scenarios', () => {
    it('should handle supervisor to PSO chat scenario', () => {
      const request = new GetOrCreateChatRequest('supervisor-123', 'pso@example.com');

      expect(request.callerId).toBe('supervisor-123');
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle admin to PSO chat scenario', () => {
      const request = new GetOrCreateChatRequest('admin-456', 'pso2@example.com');

      expect(request.callerId).toBe('admin-456');
      expect(request.psoEmail).toBe('pso2@example.com');
    });

    it('should handle Azure AD Object ID chat scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new GetOrCreateChatRequest(azureObjectId, 'pso@example.com');

      expect(request.callerId).toBe(azureObjectId);
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle chat creation from body scenario', () => {
      const body = { psoEmail: 'body-pso@example.com' };
      const request = GetOrCreateChatRequest.fromBody('body-caller-123', body);

      expect(request.callerId).toBe('body-caller-123');
      expect(request.psoEmail).toBe('body-pso@example.com');
    });

    it('should handle contact manager to PSO chat scenario', () => {
      const request = new GetOrCreateChatRequest('contact-manager-123', 'pso@example.com');

      expect(request.callerId).toBe('contact-manager-123');
      expect(request.psoEmail).toBe('pso@example.com');
    });

    it('should handle PSO to PSO chat scenario', () => {
      const request = new GetOrCreateChatRequest('pso-123', 'pso2@example.com');

      expect(request.callerId).toBe('pso-123');
      expect(request.psoEmail).toBe('pso2@example.com');
    });

    it('should handle chat with different email domains scenario', () => {
      const request = new GetOrCreateChatRequest('caller-123', 'pso@different-domain.com');

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@different-domain.com');
    });

    it('should handle chat with subdomain email scenario', () => {
      const request = new GetOrCreateChatRequest('caller-123', 'pso@subdomain.example.com');

      expect(request.callerId).toBe('caller-123');
      expect(request.psoEmail).toBe('pso@subdomain.example.com');
    });
  });
});
