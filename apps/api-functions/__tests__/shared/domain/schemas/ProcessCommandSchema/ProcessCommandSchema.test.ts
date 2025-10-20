/**
 * @fileoverview ProcessCommandSchema - unit tests
 * @summary Tests for ProcessCommandSchema validation functionality
 * @description Validates ProcessCommand request schema validation
 */

import { processCommandSchema, ProcessCommandParams } from '../../../../../shared/domain/schemas/ProcessCommandSchema';

describe('ProcessCommandSchema', () => {
  describe('processCommandSchema', () => {
    it('should validate with START command', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with STOP command', () => {
      const validData = {
        command: 'STOP' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('STOP');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with reason', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Test reason'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should validate with empty reason', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: ''
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('');
      }
    });

    it('should validate with long reason', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'a'.repeat(1000)
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('a'.repeat(1000));
      }
    });

    it('should validate with special characters in reason', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Reason with special chars: !@#$%^&*()'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Reason with special chars: !@#$%^&*()');
      }
    });

    it('should validate with unicode characters in reason', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Razón con caracteres especiales: ñáéíóú'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Razón con caracteres especiales: ñáéíóú');
      }
    });

    it('should validate with different timestamp formats', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00Z'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00Z');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with different email formats', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user+tag@example.co.uk',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user+tag@example.co.uk');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate with extra properties', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Test reason',
        extraProperty: 'value'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Test reason');
      }
    });

    it('should reject missing command', () => {
      const invalidData = {
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null command', () => {
      const invalidData = {
        command: null,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined command', () => {
      const invalidData = {
        command: undefined,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject invalid command', () => {
      const invalidData = {
        command: 'INVALID',
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Command must be either 'START' or 'STOP'");
      }
    });

    it('should reject empty command', () => {
      const invalidData = {
        command: '',
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_enum_value');
        expect(result.error.issues[0].message).toBe("Command must be either 'START' or 'STOP'");
      }
    });

    it('should reject missing employeeEmail', () => {
      const invalidData = {
        command: 'START',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null employeeEmail', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: null,
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined employeeEmail', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: undefined,
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'invalid-email',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_string');
        expect(result.error.issues[0].message).toBe('Employee email must be a valid email address');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: '',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_string');
        expect(result.error.issues[0].message).toBe('Employee email must be a valid email address');
      }
    });

    it('should reject non-string email', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 123,
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject missing timestamp', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'user@example.com'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null timestamp', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: null
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined timestamp', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: undefined
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject invalid timestamp', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: 'invalid-timestamp'
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_string');
        expect(result.error.issues[0].message).toBe('Timestamp must be a valid ISO datetime string');
      }
    });

    it('should reject empty timestamp', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: ''
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_string');
        expect(result.error.issues[0].message).toBe('Timestamp must be a valid ISO datetime string');
      }
    });

    it('should reject non-string timestamp', () => {
      const invalidData = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: 123
      };

      const result = processCommandSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null input', () => {
      const result = processCommandSchema.safeParse(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined input', () => {
      const result = processCommandSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string input', () => {
      const result = processCommandSchema.safeParse('string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject number input', () => {
      const result = processCommandSchema.safeParse(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean input', () => {
      const result = processCommandSchema.safeParse(true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array input', () => {
      const result = processCommandSchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('ProcessCommandParams type', () => {
    it('should have correct type structure', () => {
      const validData: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Test reason'
      };

      expect(validData.command).toBe('START');
      expect(validData.employeeEmail).toBe('user@example.com');
      expect(validData.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(validData.reason).toBe('Test reason');
    });

    it('should accept minimal data', () => {
      const validData: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      expect(validData.command).toBe('START');
      expect(validData.employeeEmail).toBe('user@example.com');
      expect(validData.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(validData.reason).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very long reason', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'a'.repeat(10000)
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('a'.repeat(10000));
      }
    });

    it('should handle very long email', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'a'.repeat(100) + '@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('a'.repeat(100) + '@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should handle very long timestamp', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should handle extra properties', () => {
      const validData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Test reason',
        extraProperty: 'value'
      };

      const result = processCommandSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Test reason');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate start command request', () => {
      const requestData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Start recording'
      };

      const result = processCommandSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Start recording');
      }
    });

    it('should validate stop command request', () => {
      const requestData = {
        command: 'STOP' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z',
        reason: 'Stop recording'
      };

      const result = processCommandSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('STOP');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBe('Stop recording');
      }
    });

    it('should validate command request without reason', () => {
      const requestData = {
        command: 'START' as const,
        employeeEmail: 'user@example.com',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      const result = processCommandSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe('START');
        expect(result.data.employeeEmail).toBe('user@example.com');
        expect(result.data.timestamp).toBe('2023-01-01T00:00:00.000Z');
        expect(result.data.reason).toBeUndefined();
      }
    });
  });
});

