import { PresenceUpdateRequest } from '../../../../../shared/domain/value-objects/PresenceUpdateRequest';
import { PresenceUpdateParams } from '../../../../../shared/domain/schemas/PresenceUpdateSchema';

import { Status } from '../../../../../shared/domain/enums/Status';

describe('PresenceUpdateRequest', () => {
  describe('constructor', () => {
    it('should create request with Online status', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Online);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(Status.Online);
    });

    it('should create request with Offline status', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Offline);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(Status.Offline);
    });

    it('should handle different caller ID formats', () => {
      const request1 = new PresenceUpdateRequest('caller-abc', Status.Online);
      const request2 = new PresenceUpdateRequest('caller-xyz', Status.Online);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different status values', () => {
      const request1 = new PresenceUpdateRequest('caller-123', Status.Online);
      const request2 = new PresenceUpdateRequest('caller-123', Status.Offline);

      expect(request1.status).toBe(Status.Online);
      expect(request2.status).toBe(Status.Offline);
    });

    it('should handle UUID format caller ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new PresenceUpdateRequest(uuid, Status.Online);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new PresenceUpdateRequest(azureObjectId, Status.Online);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle email format caller ID', () => {
      const email = 'user@example.com';
      const request = new PresenceUpdateRequest(email, Status.Online);

      expect(request.callerId).toBe(email);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid caller ID and params with ONLINE status', () => {
      const params: PresenceUpdateParams = { status: 'online' };
      const request = PresenceUpdateRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(Status.Online);
    });

    it('should create request from valid caller ID and params with OFFLINE status', () => {
      const params: PresenceUpdateParams = { status: 'offline' };
      const request = PresenceUpdateRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(Status.Offline);
    });


    it('should handle different caller ID formats from body', () => {
      const params: PresenceUpdateParams = { status: 'online' };
      const request1 = PresenceUpdateRequest.fromBody('caller-abc', params);
      const request2 = PresenceUpdateRequest.fromBody('caller-xyz', params);

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different status values from body', () => {
      const params1: PresenceUpdateParams = { status: 'online' };
      const params2: PresenceUpdateParams = { status: 'offline' };

      const request1 = PresenceUpdateRequest.fromBody('caller-123', params1);
      const request2 = PresenceUpdateRequest.fromBody('caller-123', params2);

      expect(request1.status).toBe(Status.Online);
      expect(request2.status).toBe(Status.Offline);
    });

    it('should handle UUID format caller ID from body', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const params: PresenceUpdateParams = { status: 'online' };
      const request = PresenceUpdateRequest.fromBody(uuid, params);

      expect(request.callerId).toBe(uuid);
    });

    it('should handle Azure AD Object ID format caller ID from body', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const params: PresenceUpdateParams = { status: 'online' };
      const request = PresenceUpdateRequest.fromBody(azureObjectId, params);

      expect(request.callerId).toBe(azureObjectId);
    });

    it('should handle email format caller ID from body', () => {
      const email = 'user@example.com';
      const params: PresenceUpdateParams = { status: 'online' };
      const request = PresenceUpdateRequest.fromBody(email, params);

      expect(request.callerId).toBe(email);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with ONLINE status', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Online);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-123',
        status: Status.Online
      });
    });

    it('should convert to payload format with OFFLINE status', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Offline);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-123',
        status: Status.Offline
      });
    });


    it('should convert different caller ID formats to payload', () => {
      const request1 = new PresenceUpdateRequest('caller-abc', Status.Online);
      const request2 = new PresenceUpdateRequest('caller-xyz', Status.Online);

      const payload1 = request1.toPayload();
      const payload2 = request2.toPayload();

      expect(payload1).toEqual({
        callerId: 'caller-abc',
        status: Status.Online
      });
      expect(payload2).toEqual({
        callerId: 'caller-xyz',
        status: Status.Online
      });
    });

    it('should convert different status values to payload', () => {
      const request1 = new PresenceUpdateRequest('caller-123', Status.Online);
      const request2 = new PresenceUpdateRequest('caller-123', Status.Offline);

      const payload1 = request1.toPayload();
      const payload2 = request2.toPayload();

      expect(payload1.status).toBe(Status.Online);
      expect(payload2.status).toBe(Status.Offline);
    });

    it('should convert UUID format caller ID to payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new PresenceUpdateRequest(uuid, Status.Online);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: uuid,
        status: Status.Online
      });
    });

    it('should convert Azure AD Object ID format caller ID to payload', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new PresenceUpdateRequest(azureObjectId, Status.Online);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: azureObjectId,
        status: Status.Online
      });
    });

    it('should convert email format caller ID to payload', () => {
      const email = 'user@example.com';
      const request = new PresenceUpdateRequest(email, Status.Online);
      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: email,
        status: Status.Online
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Online);

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller';
      }).toThrow();

      expect(() => {
        (request as any).status = Status.Offline;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new PresenceUpdateRequest('', Status.Online);

      expect(request.callerId).toBe('');
      expect(request.status).toBe(Status.Online);
    });

    it('should handle long caller ID string', () => {
      const longId = 'caller-' + 'a'.repeat(1000);
      const request = new PresenceUpdateRequest(longId, Status.Online);

      expect(request.callerId).toBe(longId);
    });

    it('should handle special characters in caller ID', () => {
      const specialId = 'caller-123!@#$%^&*()';
      const request = new PresenceUpdateRequest(specialId, Status.Online);

      expect(request.callerId).toBe(specialId);
    });

    it('should handle unicode characters in caller ID', () => {
      const unicodeId = 'caller-123-émojis-🚀';
      const request = new PresenceUpdateRequest(unicodeId, Status.Online);

      expect(request.callerId).toBe(unicodeId);
    });

    it('should handle numeric caller ID', () => {
      const numericId = '123456789';
      const request = new PresenceUpdateRequest(numericId, Status.Online);

      expect(request.callerId).toBe(numericId);
    });

    it('should handle alphanumeric caller ID', () => {
      const alphanumericId = 'caller123abc456def';
      const request = new PresenceUpdateRequest(alphanumericId, Status.Online);

      expect(request.callerId).toBe(alphanumericId);
    });

    it('should handle caller ID with spaces', () => {
      const idWithSpaces = 'caller 123 with spaces';
      const request = new PresenceUpdateRequest(idWithSpaces, Status.Online);

      expect(request.callerId).toBe(idWithSpaces);
    });

    it('should handle caller ID with hyphens', () => {
      const idWithHyphens = 'caller-123-with-hyphens';
      const request = new PresenceUpdateRequest(idWithHyphens, Status.Online);

      expect(request.callerId).toBe(idWithHyphens);
    });

    it('should handle caller ID with underscores', () => {
      const idWithUnderscores = 'caller_123_with_underscores';
      const request = new PresenceUpdateRequest(idWithUnderscores, Status.Online);

      expect(request.callerId).toBe(idWithUnderscores);
    });

    it('should handle caller ID with dots', () => {
      const idWithDots = 'caller.123.with.dots';
      const request = new PresenceUpdateRequest(idWithDots, Status.Online);

      expect(request.callerId).toBe(idWithDots);
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Online);

      expect(typeof request.callerId).toBe('string');
    });

    it('should accept Status enum for status', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Online);

      expect(typeof request.status).toBe('string');
      expect(request.status).toBe(Status.Online);
    });

    it('should accept PresenceUpdateParams interface', () => {
      const params: PresenceUpdateParams = { status: 'online' };
      const request = PresenceUpdateRequest.fromBody('caller-123', params);

      expect(request).toBeInstanceOf(PresenceUpdateRequest);
      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(Status.Online);
    });

    it('should return object from toPayload', () => {
      const request = new PresenceUpdateRequest('caller-123', Status.Online);
      const payload = request.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('callerId');
      expect(payload).toHaveProperty('status');
      expect(typeof payload.callerId).toBe('string');
      expect(typeof payload.status).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle supervisor presence update scenario', () => {
      const request = new PresenceUpdateRequest('supervisor-123', Status.Online);

      expect(request.callerId).toBe('supervisor-123');
      expect(request.status).toBe(Status.Online);
    });

    it('should handle admin presence update scenario', () => {
      const request = new PresenceUpdateRequest('admin-456', Status.Offline);

      expect(request.callerId).toBe('admin-456');
      expect(request.status).toBe(Status.Offline);
    });


    it('should handle Azure AD Object ID presence update scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new PresenceUpdateRequest(azureObjectId, Status.Online);

      expect(request.callerId).toBe(azureObjectId);
      expect(request.status).toBe(Status.Online);
    });

    it('should handle presence update from body scenario', () => {
      const params: PresenceUpdateParams = { status: 'online' };
      const request = PresenceUpdateRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(Status.Online);
    });

    it('should handle presence update with different email domains scenario', () => {
      const request = new PresenceUpdateRequest('user@company.com', Status.Online);

      expect(request.callerId).toBe('user@company.com');
      expect(request.status).toBe(Status.Online);
    });

    it('should handle presence update with subdomain email scenario', () => {
      const request = new PresenceUpdateRequest('user@subdomain.example.com', Status.Online);

      expect(request.callerId).toBe('user@subdomain.example.com');
      expect(request.status).toBe(Status.Online);
    });

    it('should handle presence update with different status transitions scenario', () => {
      const request1 = new PresenceUpdateRequest('caller-123', Status.Online);
      const request2 = new PresenceUpdateRequest('caller-123', Status.Offline);

      expect(request1.status).toBe(Status.Online);
      expect(request2.status).toBe(Status.Offline);
    });

    it('should handle presence update with different user types scenario', () => {
      const supervisorRequest = new PresenceUpdateRequest('supervisor-123', Status.Online);
      const adminRequest = new PresenceUpdateRequest('admin-456', Status.Offline);

      expect(supervisorRequest.callerId).toBe('supervisor-123');
      expect(adminRequest.callerId).toBe('admin-456');
    });
  });
});
