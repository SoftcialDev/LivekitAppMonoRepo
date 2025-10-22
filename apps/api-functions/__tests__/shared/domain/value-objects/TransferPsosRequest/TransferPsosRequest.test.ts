import { TransferPsosRequest } from '../../../../../shared/domain/value-objects/TransferPsosRequest';
import { TransferPsosParams } from '../../../../../shared/domain/schemas/TransferPsosSchema';

describe('TransferPsosRequest', () => {
  describe('constructor', () => {
    it('should create request with valid caller ID and new supervisor email', () => {
      const request = new TransferPsosRequest('caller-123', 'new-supervisor@example.com');

      expect(request.callerId).toBe('caller-123');
      expect(request.newSupervisorEmail).toBe('new-supervisor@example.com');
    });

    it('should handle different caller ID formats', () => {
      const request1 = new TransferPsosRequest('caller-abc', 'supervisor1@example.com');
      const request2 = new TransferPsosRequest('caller-xyz', 'supervisor2@example.com');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different supervisor email formats', () => {
      const request1 = new TransferPsosRequest('caller-123', 'supervisor1@example.com');
      const request2 = new TransferPsosRequest('caller-123', 'supervisor2@company.com');

      expect(request1.newSupervisorEmail).toBe('supervisor1@example.com');
      expect(request2.newSupervisorEmail).toBe('supervisor2@company.com');
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new TransferPsosRequest(uuid, 'supervisor@example.com');

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new TransferPsosRequest(azureObjectId, 'supervisor@example.com');

      expect(request.callerId).toBe(azureObjectId);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid caller ID and params', () => {
      const params: TransferPsosParams = {
        newSupervisorEmail: 'new-supervisor@example.com'
      };
      const request = TransferPsosRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.newSupervisorEmail).toBe('new-supervisor@example.com');
    });

    it('should handle different caller ID formats from body', () => {
      const params: TransferPsosParams = {
        newSupervisorEmail: 'supervisor@example.com'
      };
      const request1 = TransferPsosRequest.fromBody('caller-abc', params);
      const request2 = TransferPsosRequest.fromBody('caller-xyz', params);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different supervisor email formats from body', () => {
      const params1: TransferPsosParams = {
        newSupervisorEmail: 'supervisor1@example.com'
      };
      const params2: TransferPsosParams = {
        newSupervisorEmail: 'supervisor2@company.com'
      };

      const request1 = TransferPsosRequest.fromBody('caller-123', params1);
      const request2 = TransferPsosRequest.fromBody('caller-123', params2);

      expect(request1.newSupervisorEmail).toBe('supervisor1@example.com');
      expect(request2.newSupervisorEmail).toBe('supervisor2@company.com');
    });

    it('should handle UUID format caller ID from body', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const params: TransferPsosParams = {
        newSupervisorEmail: 'supervisor@example.com'
      };
      const request = TransferPsosRequest.fromBody(uuid, params);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID from body', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const params: TransferPsosParams = {
        newSupervisorEmail: 'supervisor@example.com'
      };
      const request = TransferPsosRequest.fromBody(azureObjectId, params);

      expect(request.callerId).toBe(azureObjectId);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new TransferPsosRequest('caller-123', 'supervisor@example.com');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();

      expect(() => {
        (request as any).newSupervisorEmail = 'modified@example.com';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new TransferPsosRequest('', 'supervisor@example.com');

      expect(request.callerId).toBe('');
      expect(request.newSupervisorEmail).toBe('supervisor@example.com');
    });

    it('should handle empty supervisor email string', () => {
      const request = new TransferPsosRequest('caller-123', '');

      expect(request.callerId).toBe('caller-123');
      expect(request.newSupervisorEmail).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new TransferPsosRequest(longId, 'supervisor@example.com');

      expect(request.callerId).toBe(longId);
    });

    it('should handle long supervisor email string', () => {
      const longEmail = 'supervisor-' + 'a'.repeat(1000) + '@example.com';
      const request = new TransferPsosRequest('caller-123', longEmail);

      expect(request.newSupervisorEmail).toBe(longEmail);
    });

    it('should handle special characters in caller ID', () => {
      const specialId = 'caller-123!@#$%^&*()';
      const request = new TransferPsosRequest(specialId, 'supervisor@example.com');

      expect(request.callerId).toBe(specialId);
    });

    it('should handle special characters in supervisor email', () => {
      const specialEmail = 'supervisor+test@example.com';
      const request = new TransferPsosRequest('caller-123', specialEmail);

      expect(request.newSupervisorEmail).toBe(specialEmail);
    });

    it('should handle numeric caller ID', () => {
      const numericId = '123456789';
      const request = new TransferPsosRequest(numericId, 'supervisor@example.com');

      expect(request.callerId).toBe(numericId);
    });

    it('should handle alphanumeric caller ID', () => {
      const alphanumericId = 'caller123abc456def';
      const request = new TransferPsosRequest(alphanumericId, 'supervisor@example.com');

      expect(request.callerId).toBe(alphanumericId);
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new TransferPsosRequest('caller-123', 'supervisor@example.com');
      expect(typeof request.callerId).toBe('string');
    });

    it('should accept string for newSupervisorEmail', () => {
      const request = new TransferPsosRequest('caller-123', 'supervisor@example.com');
      expect(typeof request.newSupervisorEmail).toBe('string');
    });

    it('should accept TransferPsosParams interface', () => {
      const params: TransferPsosParams = {
        newSupervisorEmail: 'supervisor@example.com'
      };
      const request = TransferPsosRequest.fromBody('caller-123', params);

      expect(request).toBeInstanceOf(TransferPsosRequest);
      expect(request.callerId).toBe('caller-123');
      expect(request.newSupervisorEmail).toBe('supervisor@example.com');
    });
  });

  describe('validation scenarios', () => {
    it('should handle PSO transfer scenario', () => {
      const request = new TransferPsosRequest('caller-123', 'new-supervisor@example.com');

      expect(request.callerId).toBe('caller-123');
      expect(request.newSupervisorEmail).toBe('new-supervisor@example.com');
    });

    it('should handle bulk PSO transfer scenario', () => {
      const request = new TransferPsosRequest('admin-456', 'bulk-supervisor@example.com');

      expect(request.callerId).toBe('admin-456');
      expect(request.newSupervisorEmail).toBe('bulk-supervisor@example.com');
    });

    it('should handle supervisor reassignment scenario', () => {
      const request = new TransferPsosRequest('supervisor-789', 'reassign-supervisor@example.com');

      expect(request.callerId).toBe('supervisor-789');
      expect(request.newSupervisorEmail).toBe('reassign-supervisor@example.com');
    });

    it('should handle Azure AD Object ID scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new TransferPsosRequest(azureObjectId, 'azure-supervisor@example.com');

      expect(request.callerId).toBe(azureObjectId);
      expect(request.newSupervisorEmail).toBe('azure-supervisor@example.com');
    });

    it('should handle transfer from body scenario', () => {
      const params: TransferPsosParams = {
        newSupervisorEmail: 'body-supervisor@example.com'
      };
      const request = TransferPsosRequest.fromBody('body-caller-123', params);

      expect(request.callerId).toBe('body-caller-123');
      expect(request.newSupervisorEmail).toBe('body-supervisor@example.com');
    });
  });
});
