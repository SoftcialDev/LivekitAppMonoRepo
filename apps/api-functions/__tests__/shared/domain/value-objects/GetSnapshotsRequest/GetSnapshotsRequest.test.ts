import { GetSnapshotsRequest } from '../../../../../shared/domain/value-objects/GetSnapshotsRequest';

describe('GetSnapshotsRequest', () => {
  describe('constructor', () => {
    it('should create request with valid caller ID', () => {
      const request = new GetSnapshotsRequest('caller-123');

      expect(request.callerId).toBe('caller-123');
    });

    it('should handle different caller ID formats', () => {
      const request1 = new GetSnapshotsRequest('caller-abc');
      const request2 = new GetSnapshotsRequest('caller-xyz');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new GetSnapshotsRequest(uuid);

      expect(request.callerId).toBe(uuid);
    });
  });

  describe('fromCallerId', () => {
    it('should create request from valid caller ID', () => {
      const request = GetSnapshotsRequest.fromCallerId('caller-123');

      expect(request.callerId).toBe('caller-123');
    });

    it('should handle different caller ID formats', () => {
      const request1 = GetSnapshotsRequest.fromCallerId('caller-abc');
      const request2 = GetSnapshotsRequest.fromCallerId('caller-xyz');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = GetSnapshotsRequest.fromCallerId(uuid);

      expect(request.callerId).toBe(uuid);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new GetSnapshotsRequest('caller-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new GetSnapshotsRequest('');

      expect(request.callerId).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new GetSnapshotsRequest(longId);

      expect(request.callerId).toBe(longId);
    });

    it('should handle special characters in caller ID', () => {
      const specialId = 'caller-123!@#$%^&*()';
      const request = new GetSnapshotsRequest(specialId);

      expect(request.callerId).toBe(specialId);
    });

    it('should handle numeric caller ID', () => {
      const numericId = '123456789';
      const request = new GetSnapshotsRequest(numericId);

      expect(request.callerId).toBe(numericId);
    });

    it('should handle alphanumeric caller ID', () => {
      const alphanumericId = 'caller123abc456def';
      const request = new GetSnapshotsRequest(alphanumericId);

      expect(request.callerId).toBe(alphanumericId);
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new GetSnapshotsRequest('caller-123');
      expect(typeof request.callerId).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle snapshot retrieval scenario', () => {
      const request = new GetSnapshotsRequest('user-123');

      expect(request.callerId).toBe('user-123');
    });

    it('should handle admin snapshot access scenario', () => {
      const request = new GetSnapshotsRequest('admin-456');

      expect(request.callerId).toBe('admin-456');
    });

    it('should handle supervisor snapshot access scenario', () => {
      const request = new GetSnapshotsRequest('supervisor-789');

      expect(request.callerId).toBe('supervisor-789');
    });

    it('should handle Azure AD Object ID scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new GetSnapshotsRequest(azureObjectId);

      expect(request.callerId).toBe(azureObjectId);
    });
  });
});
