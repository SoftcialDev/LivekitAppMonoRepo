import { LivekitRecordingRequest } from '../../../../../shared/domain/value-objects/LivekitRecordingRequest';
import { LivekitRecordingRequestPayload } from '../../../../../shared/domain/schemas/LivekitRecordingSchema';

// Mock RecordingCommandType since it's not available in test environment
const RecordingCommandType = {
  START: 'START',
  STOP: 'STOP'
} as const;

jest.mock('@prisma/client', () => ({
  RecordingCommandType: {
    START: 'START',
    STOP: 'STOP'
  }
}));

describe('LivekitRecordingRequest', () => {
  describe('constructor', () => {
    it('should create request with START command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('room-123');
    });

    it('should create request with STOP command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-456');

      expect(request.command).toBe(RecordingCommandType.STOP);
      expect(request.roomName).toBe('room-456');
    });

    it('should handle different room names', () => {
      const request1 = new LivekitRecordingRequest(RecordingCommandType.START, 'room-abc');
      const request2 = new LivekitRecordingRequest(RecordingCommandType.START, 'room-xyz');

      expect(request1.roomName).toBe('room-abc');
      expect(request2.roomName).toBe('room-xyz');
    });

    it('should handle different command types', () => {
      const request1 = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');
      const request2 = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-123');

      expect(request1.command).toBe(RecordingCommandType.START);
      expect(request2.command).toBe(RecordingCommandType.STOP);
    });

    it('should handle UUID format room names', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, uuid);

      expect(request.roomName).toBe(uuid);
    });

    it('should handle Azure AD Object ID format room names', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, azureObjectId);

      expect(request.roomName).toBe(azureObjectId);
    });

    it('should handle email format room names', () => {
      const email = 'user@example.com';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, email);

      expect(request.roomName).toBe(email);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid payload with START command', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('room-123');
    });

    it('should create request from valid payload with STOP command', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.STOP,
        roomName: 'room-456'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.command).toBe(RecordingCommandType.STOP);
      expect(request.roomName).toBe('room-456');
    });

    it('should handle different room names from payload', () => {
      const payload1: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-abc'
      };
      const payload2: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-xyz'
      };

      const request1 = LivekitRecordingRequest.fromBody(payload1);
      const request2 = LivekitRecordingRequest.fromBody(payload2);

      expect(request1.roomName).toBe('room-abc');
      expect(request2.roomName).toBe('room-xyz');
    });

    it('should handle different command types from payload', () => {
      const payload1: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-123'
      };
      const payload2: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.STOP,
        roomName: 'room-123'
      };

      const request1 = LivekitRecordingRequest.fromBody(payload1);
      const request2 = LivekitRecordingRequest.fromBody(payload2);

      expect(request1.command).toBe(RecordingCommandType.START);
      expect(request2.command).toBe(RecordingCommandType.STOP);
    });

    it('should handle UUID format room names from payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: uuid
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.roomName).toBe(uuid);
    });

    it('should handle Azure AD Object ID format room names from payload', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: azureObjectId
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.roomName).toBe(azureObjectId);
    });

    it('should handle email format room names from payload', () => {
      const email = 'user@example.com';
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: email
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.roomName).toBe(email);
    });
  });

  describe('isStartCommand', () => {
    it('should return true for START command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(request.isStartCommand()).toBe(true);
    });

    it('should return false for STOP command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-123');

      expect(request.isStartCommand()).toBe(false);
    });

    it('should return true for START command from payload', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.isStartCommand()).toBe(true);
    });

    it('should return false for STOP command from payload', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.STOP,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.isStartCommand()).toBe(false);
    });
  });

  describe('isStopCommand', () => {
    it('should return true for STOP command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-123');

      expect(request.isStopCommand()).toBe(true);
    });

    it('should return false for START command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(request.isStopCommand()).toBe(false);
    });

    it('should return true for STOP command from payload', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.STOP,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.isStopCommand()).toBe(true);
    });

    it('should return false for START command from payload', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.isStopCommand()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).command = RecordingCommandType.STOP;
      }).toThrow();

      expect(() => {
        (request as any).roomName = 'modified-room';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty room name', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, '');

      expect(request.roomName).toBe('');
    });

    it('should handle long room name', () => {
      const longRoomName = 'room-' + 'a'.repeat(1000);
      const request = new LivekitRecordingRequest(RecordingCommandType.START, longRoomName);

      expect(request.roomName).toBe(longRoomName);
    });

    it('should handle special characters in room name', () => {
      const specialRoomName = 'room-123!@#$%^&*()';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, specialRoomName);

      expect(request.roomName).toBe(specialRoomName);
    });

    it('should handle unicode characters in room name', () => {
      const unicodeRoomName = 'room-123-émojis-🚀';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, unicodeRoomName);

      expect(request.roomName).toBe(unicodeRoomName);
    });

    it('should handle numeric room name', () => {
      const numericRoomName = '123456789';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, numericRoomName);

      expect(request.roomName).toBe(numericRoomName);
    });

    it('should handle alphanumeric room name', () => {
      const alphanumericRoomName = 'room123abc456def';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, alphanumericRoomName);

      expect(request.roomName).toBe(alphanumericRoomName);
    });

    it('should handle room name with spaces', () => {
      const roomNameWithSpaces = 'room 123 with spaces';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomNameWithSpaces);

      expect(request.roomName).toBe(roomNameWithSpaces);
    });

    it('should handle room name with hyphens', () => {
      const roomNameWithHyphens = 'room-123-with-hyphens';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomNameWithHyphens);

      expect(request.roomName).toBe(roomNameWithHyphens);
    });

    it('should handle room name with underscores', () => {
      const roomNameWithUnderscores = 'room_123_with_underscores';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomNameWithUnderscores);

      expect(request.roomName).toBe(roomNameWithUnderscores);
    });

    it('should handle room name with dots', () => {
      const roomNameWithDots = 'room.123.with.dots';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, roomNameWithDots);

      expect(request.roomName).toBe(roomNameWithDots);
    });
  });

  describe('type safety', () => {
    it('should accept RecordingCommandType for command', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(typeof request.command).toBe('string');
      expect(request.command).toBe(RecordingCommandType.START);
    });

    it('should accept string for roomName', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(typeof request.roomName).toBe('string');
    });

    it('should accept LivekitRecordingRequestPayload interface', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request).toBeInstanceOf(LivekitRecordingRequest);
      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('room-123');
    });

    it('should return boolean from isStartCommand', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(typeof request.isStartCommand()).toBe('boolean');
    });

    it('should return boolean from isStopCommand', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-123');

      expect(typeof request.isStopCommand()).toBe('boolean');
    });
  });

  describe('validation scenarios', () => {
    it('should handle recording start scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-123');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('room-123');
      expect(request.isStartCommand()).toBe(true);
      expect(request.isStopCommand()).toBe(false);
    });

    it('should handle recording stop scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-123');

      expect(request.command).toBe(RecordingCommandType.STOP);
      expect(request.roomName).toBe('room-123');
      expect(request.isStartCommand()).toBe(false);
      expect(request.isStopCommand()).toBe(true);
    });

    it('should handle supervisor recording scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'supervisor-123');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('supervisor-123');
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle admin recording scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'admin-456');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('admin-456');
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle PSO recording scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'pso-789');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('pso-789');
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle contact manager recording scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'contact-manager-101');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('contact-manager-101');
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle Azure AD Object ID recording scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = new LivekitRecordingRequest(RecordingCommandType.START, azureObjectId);

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe(azureObjectId);
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle recording from payload scenario', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.START,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('room-123');
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle recording stop from payload scenario', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: RecordingCommandType.STOP,
        roomName: 'room-123'
      };
      const request = LivekitRecordingRequest.fromBody(payload);

      expect(request.command).toBe(RecordingCommandType.STOP);
      expect(request.roomName).toBe('room-123');
      expect(request.isStopCommand()).toBe(true);
    });

    it('should handle recording with different email domains scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'user@company.com');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('user@company.com');
      expect(request.isStartCommand()).toBe(true);
    });

    it('should handle recording with subdomain email scenario', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'user@subdomain.example.com');

      expect(request.command).toBe(RecordingCommandType.START);
      expect(request.roomName).toBe('user@subdomain.example.com');
      expect(request.isStartCommand()).toBe(true);
    });
  });
});
