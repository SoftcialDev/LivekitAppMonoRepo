import { LiveKitTokenRequest } from '../../../../../shared/domain/value-objects/LiveKitTokenRequest';
import { LiveKitTokenParams } from '../../../../../shared/domain/schemas/LiveKitTokenSchema';

describe('LiveKitTokenRequest', () => {
  describe('constructor', () => {
    it('should create request with caller ID only', () => {
      const request = new LiveKitTokenRequest('caller-123');

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should create request with caller ID and target user ID', () => {
      const request = new LiveKitTokenRequest('caller-123', 'target-user-456');

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBe('target-user-456');
    });

    it('should handle different caller ID formats', () => {
      const request1 = new LiveKitTokenRequest('caller-abc');
      const request2 = new LiveKitTokenRequest('caller-xyz');

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different target user ID formats', () => {
      const request1 = new LiveKitTokenRequest('caller-123', 'target-user-1');
      const request2 = new LiveKitTokenRequest('caller-123', 'target-user-2');

      expect(request1.targetUserId).toBe('target-user-1');
      expect(request2.targetUserId).toBe('target-user-2');
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new LiveKitTokenRequest(uuid);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle UUID format target user ID', () => {
      const callerUuid = '550e8400-e29b-41d4-a716-446655440000';
      const targetUuid = '660e8400-e29b-41d4-a716-446655440001';
      const request = new LiveKitTokenRequest(callerUuid, targetUuid);

      expect(request.callerId).toBe(callerUuid);
      expect(request.targetUserId).toBe(targetUuid);
    });

    it('should handle Azure AD Object ID format caller ID', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new LiveKitTokenRequest(azureObjectId);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle Azure AD Object ID format target user ID', () => {
      const callerId = 'caller-123';
      const targetAzureObjectId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';
      const request = new LiveKitTokenRequest(callerId, targetAzureObjectId);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetAzureObjectId);
    });

    it('should handle email format caller ID', () => {
      const email = 'user@example.com';
      const request = new LiveKitTokenRequest(email);

      expect(request.callerId).toBe(email);
    });

    it('should handle email format target user ID', () => {
      const callerId = 'caller-123';
      const targetEmail = 'target@example.com';
      const request = new LiveKitTokenRequest(callerId, targetEmail);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetEmail);
    });
  });

  describe('fromParams', () => {
    it('should create request from valid caller ID and params', () => {
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request = LiveKitTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBe('target-user-456');
    });

    it('should create request from caller ID and params without userId', () => {
      const params: LiveKitTokenParams = {};
      const request = LiveKitTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle different caller ID formats from params', () => {
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request1 = LiveKitTokenRequest.fromParams('caller-abc', params);
      const request2 = LiveKitTokenRequest.fromParams('caller-xyz', params);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different target user ID formats from params', () => {
      const params1: LiveKitTokenParams = { userId: 'target-user-1' };
      const params2: LiveKitTokenParams = { userId: 'target-user-2' };

      const request1 = LiveKitTokenRequest.fromParams('caller-123', params1);
      const request2 = LiveKitTokenRequest.fromParams('caller-123', params2);

      expect(request1.targetUserId).toBe('target-user-1');
      expect(request2.targetUserId).toBe('target-user-2');
    });

    it('should handle UUID format caller ID from params', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request = LiveKitTokenRequest.fromParams(uuid, params);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle UUID format target user ID from params', () => {
      const callerId = 'caller-123';
      const targetUuid = '660e8400-e29b-41d4-a716-446655440001';
      const params: LiveKitTokenParams = { userId: targetUuid };
      const request = LiveKitTokenRequest.fromParams(callerId, params);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetUuid);
    });

    it('should handle Azure AD Object ID format caller ID from params', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request = LiveKitTokenRequest.fromParams(azureObjectId, params);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle Azure AD Object ID format target user ID from params', () => {
      const callerId = 'caller-123';
      const targetAzureObjectId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';
      const params: LiveKitTokenParams = { userId: targetAzureObjectId };
      const request = LiveKitTokenRequest.fromParams(callerId, params);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetAzureObjectId);
    });

    it('should handle email format caller ID from params', () => {
      const email = 'user@example.com';
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request = LiveKitTokenRequest.fromParams(email, params);

      expect(request.callerId).toBe(email);
    });

    it('should handle email format target user ID from params', () => {
      const callerId = 'caller-123';
      const targetEmail = 'target@example.com';
      const params: LiveKitTokenParams = { userId: targetEmail };
      const request = LiveKitTokenRequest.fromParams(callerId, params);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetEmail);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with caller ID only', () => {
      const request = new LiveKitTokenRequest('caller-123');
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-123',
        targetUserId: undefined
      });
    });

    it('should convert to payload format with caller ID and target user ID', () => {
      const request = new LiveKitTokenRequest('caller-123', 'target-user-456');
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-123',
        targetUserId: 'target-user-456'
      });
    });

    it('should convert different caller ID formats to payload', () => {
      const request1 = new LiveKitTokenRequest('caller-abc');
      const request2 = new LiveKitTokenRequest('caller-xyz');

      const payload1 = request1.toPayload();
      const payload2 = request2.toPayload();

      expect(payload1).toEqual({
        callerId: 'caller-abc',
        targetUserId: undefined
      });
      expect(payload2).toEqual({
        callerId: 'caller-xyz',
        targetUserId: undefined
      });
    });

    it('should convert different target user ID formats to payload', () => {
      const request1 = new LiveKitTokenRequest('caller-123', 'target-user-1');
      const request2 = new LiveKitTokenRequest('caller-123', 'target-user-2');

      const payload1 = request1.toPayload();
      const payload2 = request2.toPayload();

      expect(payload1).toEqual({
        callerId: 'caller-123',
        targetUserId: 'target-user-1'
      });
      expect(payload2).toEqual({
        callerId: 'caller-123',
        targetUserId: 'target-user-2'
      });
    });

    it('should convert UUID format caller ID to payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new LiveKitTokenRequest(uuid);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: uuid,
        targetUserId: undefined
      });
    });

    it('should convert UUID format target user ID to payload', () => {
      const callerUuid = '550e8400-e29b-41d4-a716-446655440000';
      const targetUuid = '660e8400-e29b-41d4-a716-446655440001';
      const request = new LiveKitTokenRequest(callerUuid, targetUuid);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: callerUuid,
        targetUserId: targetUuid
      });
    });

    it('should convert Azure AD Object ID format caller ID to payload', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new LiveKitTokenRequest(azureObjectId);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: azureObjectId,
        targetUserId: undefined
      });
    });

    it('should convert Azure AD Object ID format target user ID to payload', () => {
      const callerId = 'caller-123';
      const targetAzureObjectId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';
      const request = new LiveKitTokenRequest(callerId, targetAzureObjectId);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: callerId,
        targetUserId: targetAzureObjectId
      });
    });

    it('should convert email format caller ID to payload', () => {
      const email = 'user@example.com';
      const request = new LiveKitTokenRequest(email);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: email,
        targetUserId: undefined
      });
    });

    it('should convert email format target user ID to payload', () => {
      const callerId = 'caller-123';
      const targetEmail = 'target@example.com';
      const request = new LiveKitTokenRequest(callerId, targetEmail);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: callerId,
        targetUserId: targetEmail
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new LiveKitTokenRequest('caller-123', 'target-user-456');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();

      expect(() => {
        (request as any).targetUserId = 'modified-target';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new LiveKitTokenRequest('');

      expect(request.callerId).toBe('');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle empty target user ID string', () => {
      const request = new LiveKitTokenRequest('caller-123', '');

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new LiveKitTokenRequest(longId);

      expect(request.callerId).toBe(longId);
    });

    it('should handle long target user ID string', () => {
      const callerId = 'caller-123';
      const longTargetId = 'target-' + 'a'.repeat(1000);
      const request = new LiveKitTokenRequest(callerId, longTargetId);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(longTargetId);
    });

    it('should handle special characters in caller ID', () => {
      const specialId = 'caller-123!@#$%^&*()';
      const request = new LiveKitTokenRequest(specialId);

      expect(request.callerId).toBe(specialId);
    });

    it('should handle special characters in target user ID', () => {
      const callerId = 'caller-123';
      const specialTargetId = 'target-123!@#$%^&*()';
      const request = new LiveKitTokenRequest(callerId, specialTargetId);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(specialTargetId);
    });

    it('should handle unicode characters in caller ID', () => {
      const unicodeId = 'caller-123-émojis-🚀';
      const request = new LiveKitTokenRequest(unicodeId);

      expect(request.callerId).toBe(unicodeId);
    });

    it('should handle unicode characters in target user ID', () => {
      const callerId = 'caller-123';
      const unicodeTargetId = 'target-123-émojis-🚀';
      const request = new LiveKitTokenRequest(callerId, unicodeTargetId);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(unicodeTargetId);
    });

    it('should handle numeric caller ID', () => {
      const numericId = '123456789';
      const request = new LiveKitTokenRequest(numericId);

      expect(request.callerId).toBe(numericId);
    });

    it('should handle numeric target user ID', () => {
      const callerId = 'caller-123';
      const numericTargetId = '987654321';
      const request = new LiveKitTokenRequest(callerId, numericTargetId);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(numericTargetId);
    });

    it('should handle alphanumeric caller ID', () => {
      const alphanumericId = 'caller123abc456def';
      const request = new LiveKitTokenRequest(alphanumericId);

      expect(request.callerId).toBe(alphanumericId);
    });

    it('should handle alphanumeric target user ID', () => {
      const callerId = 'caller-123';
      const alphanumericTargetId = 'target123abc456def';
      const request = new LiveKitTokenRequest(callerId, alphanumericTargetId);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(alphanumericTargetId);
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new LiveKitTokenRequest('caller-123');
      expect(typeof request.callerId).toBe('string');
    });

    it('should accept string or undefined for targetUserId', () => {
      const request1 = new LiveKitTokenRequest('caller-123');
      const request2 = new LiveKitTokenRequest('caller-123', 'target-user-456');

      expect(typeof request1.targetUserId).toBe('undefined');
      expect(typeof request2.targetUserId).toBe('string');
    });

    it('should accept LiveKitTokenParams interface', () => {
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request = LiveKitTokenRequest.fromParams('caller-123', params);

      expect(request).toBeInstanceOf(LiveKitTokenRequest);
      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBe('target-user-456');
    });

    it('should return object from toPayload', () => {
      const request = new LiveKitTokenRequest('caller-123', 'target-user-456');
      const payload = request.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('callerId');
      expect(payload).toHaveProperty('targetUserId');
      expect(typeof payload.callerId).toBe('string');
      expect(typeof payload.targetUserId).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle supervisor token generation scenario', () => {
      const request = new LiveKitTokenRequest('supervisor-123');

      expect(request.callerId).toBe('supervisor-123');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle admin token generation scenario', () => {
      const request = new LiveKitTokenRequest('admin-456');

      expect(request.callerId).toBe('admin-456');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle PSO token generation scenario', () => {
      const request = new LiveKitTokenRequest('pso-789');

      expect(request.callerId).toBe('pso-789');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle contact manager token generation scenario', () => {
      const request = new LiveKitTokenRequest('contact-manager-101');

      expect(request.callerId).toBe('contact-manager-101');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle supervisor token generation for specific PSO scenario', () => {
      const request = new LiveKitTokenRequest('supervisor-123', 'pso-456');

      expect(request.callerId).toBe('supervisor-123');
      expect(request.targetUserId).toBe('pso-456');
    });

    it('should handle admin token generation for specific user scenario', () => {
      const request = new LiveKitTokenRequest('admin-456', 'user-789');

      expect(request.callerId).toBe('admin-456');
      expect(request.targetUserId).toBe('user-789');
    });

    it('should handle Azure AD Object ID token generation scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new LiveKitTokenRequest(azureObjectId);

      expect(request.callerId).toBe(azureObjectId);
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle Azure AD Object ID token generation for specific user scenario', () => {
      const callerAzureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const targetAzureObjectId = 'b2c3d4e5-f6g7-8901-bcde-f23456789012';
      const request = new LiveKitTokenRequest(callerAzureObjectId, targetAzureObjectId);

      expect(request.callerId).toBe(callerAzureObjectId);
      expect(request.targetUserId).toBe(targetAzureObjectId);
    });

    it('should handle token generation from params scenario', () => {
      const params: LiveKitTokenParams = { userId: 'target-user-456' };
      const request = LiveKitTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBe('target-user-456');
    });

    it('should handle token generation from params without userId scenario', () => {
      const params: LiveKitTokenParams = {};
      const request = LiveKitTokenRequest.fromParams('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.targetUserId).toBeUndefined();
    });

    it('should handle token generation with different email domains scenario', () => {
      const callerId = 'caller-123';
      const targetEmail = 'target@company.com';
      const request = new LiveKitTokenRequest(callerId, targetEmail);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetEmail);
    });

    it('should handle token generation with subdomain email scenario', () => {
      const callerId = 'caller-123';
      const targetEmail = 'target@subdomain.example.com';
      const request = new LiveKitTokenRequest(callerId, targetEmail);

      expect(request.callerId).toBe(callerId);
      expect(request.targetUserId).toBe(targetEmail);
    });
  });
});
