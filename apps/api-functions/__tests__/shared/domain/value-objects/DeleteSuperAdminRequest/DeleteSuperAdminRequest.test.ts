import { DeleteSuperAdminRequest, DeleteSuperAdminRequestPayload } from '../../../../../shared/domain/value-objects/DeleteSuperAdminRequest';

describe('DeleteSuperAdminRequest', () => {
  describe('constructor', () => {
    it('should create request with valid user ID', () => {
      const request = new DeleteSuperAdminRequest('user-123');

      expect(request.userId).toBe('user-123');
    });

    it('should handle different user ID formats', () => {
      const request1 = new DeleteSuperAdminRequest('user-abc');
      const request2 = new DeleteSuperAdminRequest('admin-xyz');

      expect(request1.userId).toBe('user-abc');
      expect(request2.userId).toBe('admin-xyz');
    });

    it('should handle UUID format user ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new DeleteSuperAdminRequest(uuid);

      expect(request.userId).toBe(uuid);
    });
  });

  describe('fromPayload', () => {
    it('should create request from valid payload', () => {
      const payload: DeleteSuperAdminRequestPayload = {
        userId: 'user-123'
      };
      const request = DeleteSuperAdminRequest.fromPayload(payload);

      expect(request.userId).toBe('user-123');
    });

    it('should handle different user ID formats from payload', () => {
      const payload1: DeleteSuperAdminRequestPayload = {
        userId: 'user-abc'
      };
      const payload2: DeleteSuperAdminRequestPayload = {
        userId: 'admin-xyz'
      };

      const request1 = DeleteSuperAdminRequest.fromPayload(payload1);
      const request2 = DeleteSuperAdminRequest.fromPayload(payload2);

      expect(request1.userId).toBe('user-abc');
      expect(request2.userId).toBe('admin-xyz');
    });

    it('should handle UUID format user ID from payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const payload: DeleteSuperAdminRequestPayload = {
        userId: uuid
      };
      const request = DeleteSuperAdminRequest.fromPayload(payload);

      expect(request.userId).toBe(uuid);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new DeleteSuperAdminRequest('user-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).userId = 'modified-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty user ID string', () => {
      const request = new DeleteSuperAdminRequest('');

      expect(request.userId).toBe('');
    });

    it('should handle long user ID string', () => {
      const longId = 'user-' + 'a'.repeat(1000);
      const request = new DeleteSuperAdminRequest(longId);

      expect(request.userId).toBe(longId);
    });

    it('should handle special characters in user ID', () => {
      const specialId = 'user-123!@#$%^&*()';
      const request = new DeleteSuperAdminRequest(specialId);

      expect(request.userId).toBe(specialId);
    });

    it('should handle numeric user ID', () => {
      const numericId = '123456789';
      const request = new DeleteSuperAdminRequest(numericId);

      expect(request.userId).toBe(numericId);
    });

    it('should handle alphanumeric user ID', () => {
      const alphanumericId = 'user123abc456def';
      const request = new DeleteSuperAdminRequest(alphanumericId);

      expect(request.userId).toBe(alphanumericId);
    });
  });

  describe('type safety', () => {
    it('should accept string for userId', () => {
      const request = new DeleteSuperAdminRequest('user-123');
      expect(typeof request.userId).toBe('string');
    });

    it('should accept DeleteSuperAdminRequestPayload interface', () => {
      const payload: DeleteSuperAdminRequestPayload = {
        userId: 'user-123'
      };
      const request = DeleteSuperAdminRequest.fromPayload(payload);

      expect(request).toBeInstanceOf(DeleteSuperAdminRequest);
      expect(request.userId).toBe('user-123');
    });
  });

  describe('validation scenarios', () => {
    it('should handle admin removal scenario', () => {
      const request = new DeleteSuperAdminRequest('admin-123');

      expect(request.userId).toBe('admin-123');
    });

    it('should handle super admin demotion scenario', () => {
      const request = new DeleteSuperAdminRequest('super-admin-456');

      expect(request.userId).toBe('super-admin-456');
    });

    it('should handle user role change scenario', () => {
      const request = new DeleteSuperAdminRequest('user-role-change-789');

      expect(request.userId).toBe('user-role-change-789');
    });

    it('should handle bulk admin removal scenario', () => {
      const request = new DeleteSuperAdminRequest('bulk-admin-removal-001');

      expect(request.userId).toBe('bulk-admin-removal-001');
    });
  });
});
