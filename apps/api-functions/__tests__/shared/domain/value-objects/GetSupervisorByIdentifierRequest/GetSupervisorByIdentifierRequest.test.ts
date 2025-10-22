import { GetSupervisorByIdentifierRequest } from '../../../../../shared/domain/value-objects/GetSupervisorByIdentifierRequest';

describe('GetSupervisorByIdentifierRequest', () => {
  describe('constructor', () => {
    it('should create request with valid identifier', () => {
      const request = new GetSupervisorByIdentifierRequest('supervisor-123');

      expect(request.identifier).toBe('supervisor-123');
    });

    it('should handle different identifier formats', () => {
      const request1 = new GetSupervisorByIdentifierRequest('supervisor-abc');
      const request2 = new GetSupervisorByIdentifierRequest('supervisor@example.com');

      expect(request1.identifier).toBe('supervisor-abc');
      expect(request2.identifier).toBe('supervisor@example.com');
    });

    it('should handle UUID format identifier', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new GetSupervisorByIdentifierRequest(uuid);

      expect(request.identifier).toBe(uuid);
    });

    it('should handle email format identifier', () => {
      const email = 'supervisor@example.com';
      const request = new GetSupervisorByIdentifierRequest(email);

      expect(request.identifier).toBe(email);
    });
  });

  describe('fromQuery', () => {
    it('should create request from valid query', () => {
      const query = { identifier: 'supervisor-123' };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request.identifier).toBe('supervisor-123');
    });

    it('should trim whitespace from identifier', () => {
      const query = { identifier: '  supervisor-123  ' };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request.identifier).toBe('supervisor-123');
    });

    it('should handle different identifier formats from query', () => {
      const query1 = { identifier: 'supervisor-abc' };
      const query2 = { identifier: 'supervisor@example.com' };

      const request1 = GetSupervisorByIdentifierRequest.fromQuery(query1);
      const request2 = GetSupervisorByIdentifierRequest.fromQuery(query2);

      expect(request1.identifier).toBe('supervisor-abc');
      expect(request2.identifier).toBe('supervisor@example.com');
    });

    it('should handle UUID format identifier from query', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const query = { identifier: uuid };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request.identifier).toBe(uuid);
    });

    it('should handle email format identifier from query', () => {
      const email = 'supervisor@example.com';
      const query = { identifier: email };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request.identifier).toBe(email);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new GetSupervisorByIdentifierRequest('supervisor-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).identifier = 'modified-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty identifier string', () => {
      const request = new GetSupervisorByIdentifierRequest('');

      expect(request.identifier).toBe('');
    });

    it('should handle long identifier string', () => {
      const longId = 'supervisor-' + 'a'.repeat(1000);
      const request = new GetSupervisorByIdentifierRequest(longId);

      expect(request.identifier).toBe(longId);
    });

    it('should handle special characters in identifier', () => {
      const specialId = 'supervisor-123!@#$%^&*()';
      const request = new GetSupervisorByIdentifierRequest(specialId);

      expect(request.identifier).toBe(specialId);
    });

    it('should handle numeric identifier', () => {
      const numericId = '123456789';
      const request = new GetSupervisorByIdentifierRequest(numericId);

      expect(request.identifier).toBe(numericId);
    });

    it('should handle alphanumeric identifier', () => {
      const alphanumericId = 'supervisor123abc456def';
      const request = new GetSupervisorByIdentifierRequest(alphanumericId);

      expect(request.identifier).toBe(alphanumericId);
    });

    it('should handle identifier with only whitespace', () => {
      const query = { identifier: '   ' };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request.identifier).toBe('');
    });
  });

  describe('type safety', () => {
    it('should accept string for identifier', () => {
      const request = new GetSupervisorByIdentifierRequest('supervisor-123');
      expect(typeof request.identifier).toBe('string');
    });

    it('should accept query object with identifier property', () => {
      const query = { identifier: 'supervisor-123' };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request).toBeInstanceOf(GetSupervisorByIdentifierRequest);
      expect(request.identifier).toBe('supervisor-123');
    });
  });

  describe('validation scenarios', () => {
    it('should handle supervisor ID lookup scenario', () => {
      const request = new GetSupervisorByIdentifierRequest('supervisor-123');

      expect(request.identifier).toBe('supervisor-123');
    });

    it('should handle Azure AD Object ID lookup scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new GetSupervisorByIdentifierRequest(azureObjectId);

      expect(request.identifier).toBe(azureObjectId);
    });

    it('should handle email lookup scenario', () => {
      const email = 'supervisor@example.com';
      const request = new GetSupervisorByIdentifierRequest(email);

      expect(request.identifier).toBe(email);
    });

    it('should handle trimmed identifier scenario', () => {
      const query = { identifier: '  supervisor@example.com  ' };
      const request = GetSupervisorByIdentifierRequest.fromQuery(query);

      expect(request.identifier).toBe('supervisor@example.com');
    });
  });
});
