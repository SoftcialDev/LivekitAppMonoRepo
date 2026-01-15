import { processCommandSchema } from '../../../src/domain/schemas/ProcessCommandSchema';

describe('ProcessCommandSchema', () => {
  describe('command errorMap', () => {
    it('should return custom error message for invalid command', () => {
      const result = processCommandSchema.safeParse({
        command: 'INVALID',
        employeeEmail: 'user@example.com',
        timestamp: '2024-01-01T10:00:00Z'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Command must be either 'START' or 'STOP'");
      }
    });
  });
});


