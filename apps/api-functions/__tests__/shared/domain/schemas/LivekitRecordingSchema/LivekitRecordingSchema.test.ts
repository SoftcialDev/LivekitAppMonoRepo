/**
 * @fileoverview LivekitRecordingSchema - unit tests
 * @summary Tests for LivekitRecordingSchema validation functionality
 * @description Validates LiveKit recording command schema validation
 */

// Mock RecordingCommandType since it's not available in test environment
jest.mock('@prisma/client', () => ({
  RecordingCommandType: {
    START: 'START',
    STOP: 'STOP'
  }
}));

import { livekitRecordingSchema, LivekitRecordingRequestPayload } from '../../../../../shared/domain/schemas/LivekitRecordingSchema';

describe('LivekitRecordingSchema', () => {
  describe('livekitRecordingSchema', () => {
    it('should validate with START command', () => {
      const validData = {
        command: 'START',
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.roomName).toBe('test-room');
      }
    });

    it('should validate with STOP command', () => {
      const validData = {
        command: 'STOP',
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('STOP');
        expect(result.data.roomName).toBe('test-room');
      }
    });

    it('should validate with long room name', () => {
      const validData = {
        command: 'START',
        roomName: 'a'.repeat(100)
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('a'.repeat(100));
      }
    });

    it('should validate with special characters in room name', () => {
      const validData = {
        command: 'START',
        roomName: 'room-123_test.room'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('room-123_test.room');
      }
    });

    it('should reject missing command', () => {
      const invalidData = {
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Command must be START or STOP');
      }
    });

    it('should reject invalid command', () => {
      const invalidData = {
        command: 'INVALID',
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Command must be START or STOP');
      }
    });

    it('should reject null command', () => {
      const invalidData = {
        command: null,
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject undefined command', () => {
      const invalidData = {
        command: undefined,
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject numeric command', () => {
      const invalidData = {
        command: 123,
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject boolean command', () => {
      const invalidData = {
        command: true,
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject array command', () => {
      const invalidData = {
        command: ['START'],
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject object command', () => {
      const invalidData = {
        command: { type: 'START' },
        roomName: 'test-room'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing roomName', () => {
      const invalidData = {
        command: 'START'
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('should reject empty roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: ''
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Room name is required');
      }
    });

    it('should accept whitespace-only roomName (validation allows them)', () => {
      const validData = {
        command: 'START',
        roomName: '   '
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('   ');
      }
    });

    it('should reject null roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: null
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject undefined roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: undefined
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject numeric roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: 123
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject boolean roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: true
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject array roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: ['room']
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject object roomName', () => {
      const invalidData = {
        command: 'START',
        roomName: { name: 'room' }
      };

      const result = livekitRecordingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
      const result = livekitRecordingSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it('should reject undefined input', () => {
      const result = livekitRecordingSchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it('should reject string input', () => {
      const result = livekitRecordingSchema.safeParse('invalid');

      expect(result.success).toBe(false);
    });

    it('should reject number input', () => {
      const result = livekitRecordingSchema.safeParse(123);

      expect(result.success).toBe(false);
    });

    it('should reject boolean input', () => {
      const result = livekitRecordingSchema.safeParse(true);

      expect(result.success).toBe(false);
    });

    it('should reject array input', () => {
      const result = livekitRecordingSchema.safeParse([]);

      expect(result.success).toBe(false);
    });
  });

  describe('LivekitRecordingRequestPayload type', () => {
    it('should have correct type structure', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: 'START',
        roomName: 'test-room'
      };

      expect(payload.command).toBe('START');
      expect(payload.roomName).toBe('test-room');
    });

    it('should accept STOP command', () => {
      const payload: LivekitRecordingRequestPayload = {
        command: 'STOP',
        roomName: 'test-room'
      };

      expect(payload.command).toBe('STOP');
      expect(payload.roomName).toBe('test-room');
    });
  });

  describe('edge cases', () => {
    it('should handle very long room names', () => {
      const validData = {
        command: 'START',
        roomName: 'a'.repeat(1000)
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should handle room names with unicode characters', () => {
      const validData = {
        command: 'START',
        roomName: 'room-测试-123'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should handle extra properties', () => {
      const validData = {
        command: 'START',
        roomName: 'test-room',
        extra: 'property'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('validation scenarios', () => {
    it('should validate start recording request', () => {
      const validData = {
        command: 'START',
        roomName: 'meeting-room-1'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate stop recording request', () => {
      const validData = {
        command: 'STOP',
        roomName: 'meeting-room-1'
      };

      const result = livekitRecordingSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });
});
