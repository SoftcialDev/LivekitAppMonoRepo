/**
 * @fileoverview GetLivekitRecordingsSchema - unit tests
 * @summary Tests for GetLivekitRecordingsSchema validation functionality
 * @description Validates GetLivekitRecordings request schema validation
 */

import { getLivekitRecordingsSchema, GetLivekitRecordingsRequestPayload } from '../../../../../shared/domain/schemas/GetLivekitRecordingsSchema';

describe('GetLivekitRecordingsSchema', () => {
  describe('getLivekitRecordingsSchema', () => {
    it('should validate with all parameters', () => {
      const validData = {
        roomName: 'test-room',
        limit: 100,
        order: 'asc' as const,
        includeSas: true,
        sasMinutes: 120
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('test-room');
        expect(result.data.limit).toBe(100);
        expect(result.data.order).toBe('asc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(120);
      }
    });

    it('should validate with minimal parameters', () => {
      const validData = {};

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBeUndefined();
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(60);
      }
    });

    it('should validate with only roomName', () => {
      const validData = {
        roomName: 'test-room'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('test-room');
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(60);
      }
    });

    it('should validate with only limit', () => {
      const validData = {
        limit: 200
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBeUndefined();
        expect(result.data.limit).toBe(200);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(60);
      }
    });

    it('should validate with only order', () => {
      const validData = {
        order: 'asc' as const
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBeUndefined();
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('asc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(60);
      }
    });

    it('should validate with only includeSas', () => {
      const validData = {
        includeSas: false
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBeUndefined();
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(false);
        expect(result.data.sasMinutes).toBe(60);
      }
    });

    it('should validate with only sasMinutes', () => {
      const validData = {
        sasMinutes: 30
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBeUndefined();
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(30);
      }
    });

    it('should validate with string limit', () => {
      const validData = {
        limit: '100'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should validate with string includeSas', () => {
      const validData = {
        includeSas: 'true'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeSas).toBe(true);
      }
    });

    it('should validate with string sasMinutes', () => {
      const validData = {
        sasMinutes: '120'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sasMinutes).toBe(120);
      }
    });

    it('should validate with numeric includeSas', () => {
      const validData = {
        includeSas: 1
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeSas).toBe(true);
      }
    });

    it('should validate with zero includeSas', () => {
      const validData = {
        includeSas: 0
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeSas).toBe(false);
      }
    });

    it('should validate with maximum limit', () => {
      const validData = {
        limit: 1000
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1000);
      }
    });

    it('should validate with minimum limit', () => {
      const validData = {
        limit: 1
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it('should validate with minimum sasMinutes', () => {
      const validData = {
        sasMinutes: 1
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sasMinutes).toBe(1);
      }
    });

    it('should validate with large sasMinutes', () => {
      const validData = {
        sasMinutes: 10000
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sasMinutes).toBe(10000);
      }
    });

    it('should validate with long roomName', () => {
      const validData = {
        roomName: 'a'.repeat(1000)
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('a'.repeat(1000));
      }
    });

    it('should validate with special characters in roomName', () => {
      const validData = {
        roomName: 'room-123_test@domain.com'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('room-123_test@domain.com');
      }
    });

    it('should validate with unicode characters in roomName', () => {
      const validData = {
        roomName: '房间123'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('房间123');
      }
    });

    it('should reject empty roomName', () => {
      const invalidData = {
        roomName: ''
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
        expect(result.error.issues[0].message).toBe('Room name must not be empty');
      }
    });

    it('should reject limit exceeding maximum', () => {
      const invalidData = {
        limit: 1001
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_big');
        expect(result.error.issues[0].message).toBe('Limit cannot exceed 1000');
      }
    });

    it('should reject zero limit', () => {
      const invalidData = {
        limit: 0
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject negative limit', () => {
      const invalidData = {
        limit: -1
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject invalid order', () => {
      const invalidData = {
        order: 'invalid'
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Order must be 'asc' or 'desc'");
      }
    });

    it('should reject zero sasMinutes', () => {
      const invalidData = {
        sasMinutes: 0
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject negative sasMinutes', () => {
      const invalidData = {
        sasMinutes: -1
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject non-numeric limit', () => {
      const invalidData = {
        limit: 'invalid'
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject non-numeric sasMinutes', () => {
      const invalidData = {
        sasMinutes: 'invalid'
      };

      const result = getLivekitRecordingsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should accept various includeSas values due to coercion', () => {
      const validData = {
        includeSas: 'true'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeSas).toBe(true);
      }
    });

    it('should reject null input', () => {
      const result = getLivekitRecordingsSchema.safeParse(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined input', () => {
      const result = getLivekitRecordingsSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string input', () => {
      const result = getLivekitRecordingsSchema.safeParse('string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject number input', () => {
      const result = getLivekitRecordingsSchema.safeParse(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean input', () => {
      const result = getLivekitRecordingsSchema.safeParse(true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array input', () => {
      const result = getLivekitRecordingsSchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('GetLivekitRecordingsRequestPayload type', () => {
    it('should have correct type structure', () => {
      const validData: GetLivekitRecordingsRequestPayload = {
        roomName: 'test-room',
        limit: 100,
        order: 'asc',
        includeSas: true,
        sasMinutes: 120
      };

      expect(validData.roomName).toBe('test-room');
      expect(validData.limit).toBe(100);
      expect(validData.order).toBe('asc');
      expect(validData.includeSas).toBe(true);
      expect(validData.sasMinutes).toBe(120);
    });

    it('should accept minimal data', () => {
      const validData: GetLivekitRecordingsRequestPayload = {
        limit: 50,
        order: 'desc',
        includeSas: true,
        sasMinutes: 60
      };

      expect(validData.roomName).toBeUndefined();
      expect(validData.limit).toBe(50);
      expect(validData.order).toBe('desc');
      expect(validData.includeSas).toBe(true);
      expect(validData.sasMinutes).toBe(60);
    });
  });

  describe('edge cases', () => {
    it('should handle very large limit', () => {
      const validData = {
        limit: 1000
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1000);
      }
    });

    it('should handle very large sasMinutes', () => {
      const validData = {
        sasMinutes: 10000
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sasMinutes).toBe(10000);
      }
    });

    it('should handle very long roomName', () => {
      const validData = {
        roomName: 'a'.repeat(10000)
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('a'.repeat(10000));
      }
    });

    it('should handle extra properties', () => {
      const validData = {
        roomName: 'test-room',
        limit: 100,
        order: 'asc' as const,
        includeSas: true,
        sasMinutes: 120,
        extraProperty: 'value'
      };

      const result = getLivekitRecordingsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('test-room');
        expect(result.data.limit).toBe(100);
        expect(result.data.order).toBe('asc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(120);
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate get livekit recordings request', () => {
      const requestData = {
        roomName: 'test-room',
        limit: 100,
        order: 'asc' as const,
        includeSas: true,
        sasMinutes: 120
      };

      const result = getLivekitRecordingsSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('test-room');
        expect(result.data.limit).toBe(100);
        expect(result.data.order).toBe('asc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(120);
      }
    });

    it('should validate request with query parameters', () => {
      const requestData = {
        roomName: 'test-room',
        limit: 50,
        order: 'desc' as const,
        includeSas: false,
        sasMinutes: 30
      };

      const result = getLivekitRecordingsSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBe('test-room');
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(false);
        expect(result.data.sasMinutes).toBe(30);
      }
    });

    it('should validate request with minimal data', () => {
      const requestData = {};

      const result = getLivekitRecordingsSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomName).toBeUndefined();
        expect(result.data.limit).toBe(50);
        expect(result.data.order).toBe('desc');
        expect(result.data.includeSas).toBe(true);
        expect(result.data.sasMinutes).toBe(60);
      }
    });
  });
});
