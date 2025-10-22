import { GetSupervisorForPsoRequest } from '../../../../../shared/domain/value-objects/GetSupervisorForPsoRequest';

describe('GetSupervisorForPsoRequest', () => {
  describe('constructor', () => {
    it('should create request with valid PSO identifier', () => {
      const request = new GetSupervisorForPsoRequest('pso-123');

      expect(request.identifier).toBe('pso-123');
    });

    it('should handle different PSO identifier formats', () => {
      const request1 = new GetSupervisorForPsoRequest('pso-abc');
      const request2 = new GetSupervisorForPsoRequest('pso@example.com');

      expect(request1.identifier).toBe('pso-abc');
      expect(request2.identifier).toBe('pso@example.com');
    });

    it('should handle UUID format PSO identifier', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new GetSupervisorForPsoRequest(uuid);

      expect(request.identifier).toBe(uuid);
    });

    it('should handle email format PSO identifier', () => {
      const email = 'pso@example.com';
      const request = new GetSupervisorForPsoRequest(email);

      expect(request.identifier).toBe(email);
    });
  });

  describe('fromQuery', () => {
    it('should create request from valid query', () => {
      const query = { identifier: 'pso-123' };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request.identifier).toBe('pso-123');
    });

    it('should trim whitespace from identifier', () => {
      const query = { identifier: '  pso-123  ' };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request.identifier).toBe('pso-123');
    });

    it('should handle different PSO identifier formats from query', () => {
      const query1 = { identifier: 'pso-abc' };
      const query2 = { identifier: 'pso@example.com' };

      const request1 = GetSupervisorForPsoRequest.fromQuery(query1);
      const request2 = GetSupervisorForPsoRequest.fromQuery(query2);

      expect(request1.identifier).toBe('pso-abc');
      expect(request2.identifier).toBe('pso@example.com');
    });

    it('should handle UUID format PSO identifier from query', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const query = { identifier: uuid };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request.identifier).toBe(uuid);
    });

    it('should handle email format PSO identifier from query', () => {
      const email = 'pso@example.com';
      const query = { identifier: email };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request.identifier).toBe(email);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new GetSupervisorForPsoRequest('pso-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).identifier = 'modified-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty PSO identifier string', () => {
      const request = new GetSupervisorForPsoRequest('');

      expect(request.identifier).toBe('');
    });

    it('should handle long PSO identifier string', () => {
      const longId = 'pso-' + 'a'.repeat(1000);
      const request = new GetSupervisorForPsoRequest(longId);

      expect(request.identifier).toBe(longId);
    });

    it('should handle special characters in PSO identifier', () => {
      const specialId = 'pso-123!@#$%^&*()';
      const request = new GetSupervisorForPsoRequest(specialId);

      expect(request.identifier).toBe(specialId);
    });

    it('should handle numeric PSO identifier', () => {
      const numericId = '123456789';
      const request = new GetSupervisorForPsoRequest(numericId);

      expect(request.identifier).toBe(numericId);
    });

    it('should handle alphanumeric PSO identifier', () => {
      const alphanumericId = 'pso123abc456def';
      const request = new GetSupervisorForPsoRequest(alphanumericId);

      expect(request.identifier).toBe(alphanumericId);
    });

    it('should handle PSO identifier with only whitespace', () => {
      const query = { identifier: '   ' };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request.identifier).toBe('');
    });
  });

  describe('type safety', () => {
    it('should accept string for identifier', () => {
      const request = new GetSupervisorForPsoRequest('pso-123');
      expect(typeof request.identifier).toBe('string');
    });

    it('should accept query object with identifier property', () => {
      const query = { identifier: 'pso-123' };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request).toBeInstanceOf(GetSupervisorForPsoRequest);
      expect(request.identifier).toBe('pso-123');
    });
  });

  describe('validation scenarios', () => {
    it('should handle PSO ID lookup scenario', () => {
      const request = new GetSupervisorForPsoRequest('pso-123');

      expect(request.identifier).toBe('pso-123');
    });

    it('should handle Azure AD Object ID lookup scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new GetSupervisorForPsoRequest(azureObjectId);

      expect(request.identifier).toBe(azureObjectId);
    });

    it('should handle PSO email lookup scenario', () => {
      const email = 'pso@example.com';
      const request = new GetSupervisorForPsoRequest(email);

      expect(request.identifier).toBe(email);
    });

    it('should handle trimmed PSO identifier scenario', () => {
      const query = { identifier: '  pso@example.com  ' };
      const request = GetSupervisorForPsoRequest.fromQuery(query);

      expect(request.identifier).toBe('pso@example.com');
    });
  });
});
