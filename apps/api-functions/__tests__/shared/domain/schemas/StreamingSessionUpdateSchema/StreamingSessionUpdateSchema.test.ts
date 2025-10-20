/**
 * @fileoverview StreamingSessionUpdateSchema - unit tests
 * @summary Tests for StreamingSessionUpdateSchema validation functionality
 * @description Validates StreamingSessionUpdate request schema validation
 */

import { streamingSessionUpdateSchema, StreamingSessionUpdateParams } from '../../../../../shared/domain/schemas/StreamingSessionUpdateSchema';

describe('StreamingSessionUpdateSchema', () => {
  describe('streamingSessionUpdateSchema', () => {
    it('should validate with started status', () => {
      const validData = {
        status: 'started' as const
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with stopped status', () => {
      const validData = {
        status: 'stopped' as const
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stopped');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with isCommand true', () => {
      const validData = {
        status: 'started' as const,
        isCommand: true
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with isCommand false', () => {
      const validData = {
        status: 'stopped' as const,
        isCommand: false
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stopped');
        expect(result.data.isCommand).toBe(false);
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with reason', () => {
      const validData = {
        status: 'started' as const,
        reason: 'Test reason'
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should validate with all fields', () => {
      const validData = {
        status: 'started' as const,
        isCommand: true,
        reason: 'Test reason'
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should validate with empty reason', () => {
      const validData = {
        status: 'started' as const,
        reason: ''
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBe('');
      }
    });

    it('should validate with long reason', () => {
      const validData = {
        status: 'started' as const,
        reason: 'a'.repeat(1000)
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBe('a'.repeat(1000));
      }
    });

    it('should validate with special characters in reason', () => {
      const validData = {
        status: 'started' as const,
        reason: 'Reason with special chars: !@#$%^&*()'
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBe('Reason with special chars: !@#$%^&*()');
      }
    });

    it('should validate with unicode characters in reason', () => {
      const validData = {
        status: 'started' as const,
        reason: 'Razón con caracteres especiales: ñáéíóú'
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBe('Razón con caracteres especiales: ñáéíóú');
      }
    });

    it('should validate with extra properties', () => {
      const validData = {
        status: 'started' as const,
        isCommand: true,
        reason: 'Test reason',
        extraProperty: 'value'
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should reject missing status', () => {
      const invalidData = {};

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null status', () => {
      const invalidData = {
        status: null
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined status', () => {
      const invalidData = {
        status: undefined
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid'
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Status must be either 'started' or 'stopped'");
      }
    });

    it('should reject empty string status', () => {
      const invalidData = {
        status: ''
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Status must be either 'started' or 'stopped'");
      }
    });

    it('should reject numeric status', () => {
      const invalidData = {
        status: 123
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean status', () => {
      const invalidData = {
        status: true
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array status', () => {
      const invalidData = {
        status: []
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject object status', () => {
      const invalidData = {
        status: {}
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null isCommand', () => {
      const invalidData = {
        status: 'started' as const,
        isCommand: null
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string isCommand', () => {
      const invalidData = {
        status: 'started' as const,
        isCommand: 'true'
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject numeric isCommand', () => {
      const invalidData = {
        status: 'started' as const,
        isCommand: 1
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array isCommand', () => {
      const invalidData = {
        status: 'started' as const,
        isCommand: []
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject object isCommand', () => {
      const invalidData = {
        status: 'started' as const,
        isCommand: {}
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null reason', () => {
      const invalidData = {
        status: 'started' as const,
        reason: null
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject numeric reason', () => {
      const invalidData = {
        status: 'started' as const,
        reason: 123
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean reason', () => {
      const invalidData = {
        status: 'started' as const,
        reason: true
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array reason', () => {
      const invalidData = {
        status: 'started' as const,
        reason: []
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject object reason', () => {
      const invalidData = {
        status: 'started' as const,
        reason: {}
      };

      const result = streamingSessionUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null input', () => {
      const result = streamingSessionUpdateSchema.safeParse(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined input', () => {
      const result = streamingSessionUpdateSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string input', () => {
      const result = streamingSessionUpdateSchema.safeParse('string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject number input', () => {
      const result = streamingSessionUpdateSchema.safeParse(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean input', () => {
      const result = streamingSessionUpdateSchema.safeParse(true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array input', () => {
      const result = streamingSessionUpdateSchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('StreamingSessionUpdateParams type', () => {
    it('should have correct type structure', () => {
      const validData: StreamingSessionUpdateParams = {
        status: 'started',
        isCommand: true,
        reason: 'Test reason'
      };

      expect(validData.status).toBe('started');
      expect(validData.isCommand).toBe(true);
      expect(validData.reason).toBe('Test reason');
    });

    it('should accept minimal data', () => {
      const validData: StreamingSessionUpdateParams = {
        status: 'started'
      };

      expect(validData.status).toBe('started');
      expect(validData.isCommand).toBeUndefined();
      expect(validData.reason).toBeUndefined();
    });

    it('should accept stopped status', () => {
      const validData: StreamingSessionUpdateParams = {
        status: 'stopped',
        isCommand: false,
        reason: 'Stop reason'
      };

      expect(validData.status).toBe('stopped');
      expect(validData.isCommand).toBe(false);
      expect(validData.reason).toBe('Stop reason');
    });
  });

  describe('edge cases', () => {
    it('should handle very long reason', () => {
      const validData = {
        status: 'started' as const,
        reason: 'a'.repeat(10000)
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.reason).toBe('a'.repeat(10000));
      }
    });

    it('should handle extra properties', () => {
      const validData = {
        status: 'started' as const,
        isCommand: true,
        reason: 'Test reason',
        extraProperty: 'value'
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should handle nested properties', () => {
      const validData = {
        status: 'started' as const,
        isCommand: true,
        reason: 'Test reason',
        nested: {
          property: 'value'
        }
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should handle array properties', () => {
      const validData = {
        status: 'started' as const,
        isCommand: true,
        reason: 'Test reason',
        arrayProperty: [1, 2, 3]
      };

      const result = streamingSessionUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBe('Test reason');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate start streaming session request', () => {
      const requestData = {
        status: 'started' as const,
        isCommand: true,
        reason: 'Start streaming'
      };

      const result = streamingSessionUpdateSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBe(true);
        expect(result.data.reason).toBe('Start streaming');
      }
    });

    it('should validate stop streaming session request', () => {
      const requestData = {
        status: 'stopped' as const,
        isCommand: false,
        reason: 'Stop streaming'
      };

      const result = streamingSessionUpdateSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('stopped');
        expect(result.data.isCommand).toBe(false);
        expect(result.data.reason).toBe('Stop streaming');
      }
    });

    it('should validate streaming session update without command flag', () => {
      const requestData = {
        status: 'started' as const,
        reason: 'Manual start'
      };

      const result = streamingSessionUpdateSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('started');
        expect(result.data.isCommand).toBeUndefined();
        expect(result.data.reason).toBe('Manual start');
      }
    });
  });
});
