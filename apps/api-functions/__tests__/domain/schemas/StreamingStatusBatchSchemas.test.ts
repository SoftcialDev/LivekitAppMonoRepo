import { validateEmailArray } from '../../../src/domain/schemas/StreamingStatusBatchSchemas';

describe('StreamingStatusBatchSchemas', () => {
  describe('validateEmailArray', () => {
    it('should return error when emails array is empty', () => {
      const result = validateEmailArray([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails array cannot be empty');
    });

    it('should return error when emails array exceeds 1000 items', () => {
      const emails = Array(1001).fill('user@example.com');
      const result = validateEmailArray(emails);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails array cannot exceed 1000 items');
    });

    it('should return error when emails contain invalid addresses', () => {
      const result = validateEmailArray(['invalid-email', 'user@example.com']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should return error when emails are not unique', () => {
      const result = validateEmailArray(['user@example.com', 'User@Example.com']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be unique');
    });
  });
});





