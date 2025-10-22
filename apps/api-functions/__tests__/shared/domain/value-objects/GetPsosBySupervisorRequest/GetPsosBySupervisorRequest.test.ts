import { GetPsosBySupervisorRequest } from '../../../../../shared/domain/value-objects/GetPsosBySupervisorRequest';

describe('GetPsosBySupervisorRequest', () => {
  describe('constructor', () => {
    it('should create request with caller ID only', () => {
      const request = new GetPsosBySupervisorRequest('caller-123');

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBeUndefined();
    });

    it('should create request with caller ID and supervisor ID', () => {
      const request = new GetPsosBySupervisorRequest('caller-123', 'supervisor-456');

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBe('supervisor-456');
    });

    it('should handle different caller ID formats', () => {
      const request1 = new GetPsosBySupervisorRequest('caller-abc');
      const request2 = new GetPsosBySupervisorRequest('caller-xyz');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different supervisor ID formats', () => {
      const request1 = new GetPsosBySupervisorRequest('caller-123', 'supervisor-abc');
      const request2 = new GetPsosBySupervisorRequest('caller-123', 'supervisor-xyz');

      expect(request1.supervisorId).toBe('supervisor-abc');
      expect(request2.supervisorId).toBe('supervisor-xyz');
    });

    it('should handle UUID format IDs', () => {
      const callerUuid = '550e8400-e29b-41d4-a716-446655440000';
      const supervisorUuid = '550e8400-e29b-41d4-a716-446655440001';
      const request = new GetPsosBySupervisorRequest(callerUuid, supervisorUuid);

      expect(request.callerId).toBe(callerUuid);
      expect(request.supervisorId).toBe(supervisorUuid);
    });
  });

  describe('fromQuery', () => {
    it('should create request from caller ID and empty query', () => {
      const request = GetPsosBySupervisorRequest.fromQuery('caller-123', {});

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBeUndefined();
    });

    it('should create request from caller ID and query with supervisor ID', () => {
      const request = GetPsosBySupervisorRequest.fromQuery('caller-123', { supervisorId: 'supervisor-456' });

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBe('supervisor-456');
    });

    it('should handle different caller ID formats from query', () => {
      const request1 = GetPsosBySupervisorRequest.fromQuery('caller-abc', {});
      const request2 = GetPsosBySupervisorRequest.fromQuery('caller-xyz', {});

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different supervisor ID formats from query', () => {
      const request1 = GetPsosBySupervisorRequest.fromQuery('caller-123', { supervisorId: 'supervisor-abc' });
      const request2 = GetPsosBySupervisorRequest.fromQuery('caller-123', { supervisorId: 'supervisor-xyz' });

      expect(request1.supervisorId).toBe('supervisor-abc');
      expect(request2.supervisorId).toBe('supervisor-xyz');
    });

    it('should handle UUID format IDs from query', () => {
      const callerUuid = '550e8400-e29b-41d4-a716-446655440000';
      const supervisorUuid = '550e8400-e29b-41d4-a716-446655440001';
      const request = GetPsosBySupervisorRequest.fromQuery(callerUuid, { supervisorId: supervisorUuid });

      expect(request.callerId).toBe(callerUuid);
      expect(request.supervisorId).toBe(supervisorUuid);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new GetPsosBySupervisorRequest('caller-123', 'supervisor-456');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();

      expect(() => {
        (request as any).supervisorId = 'modified-supervisor';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new GetPsosBySupervisorRequest('');

      expect(request.callerId).toBe('');
      expect(request.supervisorId).toBeUndefined();
    });

    it('should handle empty supervisor ID string', () => {
      const request = new GetPsosBySupervisorRequest('caller-123', '');

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new GetPsosBySupervisorRequest(longId);

      expect(request.callerId).toBe(longId);
    });

    it('should handle long supervisor ID string', () => {
      const longId = 'supervisor-' + 'a'.repeat(1000);
      const request = new GetPsosBySupervisorRequest('caller-123', longId);

      expect(request.supervisorId).toBe(longId);
    });

    it('should handle special characters in IDs', () => {
      const specialCallerId = 'caller-123!@#$%^&*()';
      const specialSupervisorId = 'supervisor-456!@#$%^&*()';
      const request = new GetPsosBySupervisorRequest(specialCallerId, specialSupervisorId);

      expect(request.callerId).toBe(specialCallerId);
      expect(request.supervisorId).toBe(specialSupervisorId);
    });

    it('should handle numeric IDs', () => {
      const numericCallerId = '123456789';
      const numericSupervisorId = '987654321';
      const request = new GetPsosBySupervisorRequest(numericCallerId, numericSupervisorId);

      expect(request.callerId).toBe(numericCallerId);
      expect(request.supervisorId).toBe(numericSupervisorId);
    });

    it('should handle alphanumeric IDs', () => {
      const alphanumericCallerId = 'caller123abc456def';
      const alphanumericSupervisorId = 'supervisor123abc456def';
      const request = new GetPsosBySupervisorRequest(alphanumericCallerId, alphanumericSupervisorId);

      expect(request.callerId).toBe(alphanumericCallerId);
      expect(request.supervisorId).toBe(alphanumericSupervisorId);
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new GetPsosBySupervisorRequest('caller-123');
      expect(typeof request.callerId).toBe('string');
    });

    it('should accept optional string for supervisorId', () => {
      const request1 = new GetPsosBySupervisorRequest('caller-123');
      const request2 = new GetPsosBySupervisorRequest('caller-123', 'supervisor-456');

      expect(request1.supervisorId).toBeUndefined();
      expect(typeof request2.supervisorId).toBe('string');
    });

    it('should accept query object with optional supervisorId property', () => {
      const request1 = GetPsosBySupervisorRequest.fromQuery('caller-123', {});
      const request2 = GetPsosBySupervisorRequest.fromQuery('caller-123', { supervisorId: 'supervisor-456' });

      expect(request1).toBeInstanceOf(GetPsosBySupervisorRequest);
      expect(request2).toBeInstanceOf(GetPsosBySupervisorRequest);
      expect(request1.supervisorId).toBeUndefined();
      expect(request2.supervisorId).toBe('supervisor-456');
    });
  });

  describe('validation scenarios', () => {
    it('should handle PSO lookup by caller scenario', () => {
      const request = new GetPsosBySupervisorRequest('caller-123');

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBeUndefined();
    });

    it('should handle PSO lookup by supervisor scenario', () => {
      const request = new GetPsosBySupervisorRequest('caller-123', 'supervisor-456');

      expect(request.callerId).toBe('caller-123');
      expect(request.supervisorId).toBe('supervisor-456');
    });

    it('should handle admin PSO access scenario', () => {
      const request = new GetPsosBySupervisorRequest('admin-123', 'supervisor-456');

      expect(request.callerId).toBe('admin-123');
      expect(request.supervisorId).toBe('supervisor-456');
    });

    it('should handle Azure AD Object ID scenario', () => {
      const callerObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const supervisorObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567891';
      const request = new GetPsosBySupervisorRequest(callerObjectId, supervisorObjectId);

      expect(request.callerId).toBe(callerObjectId);
      expect(request.supervisorId).toBe(supervisorObjectId);
    });
  });
});
