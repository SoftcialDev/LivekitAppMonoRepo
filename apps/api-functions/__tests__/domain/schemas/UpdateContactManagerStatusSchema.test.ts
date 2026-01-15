import { updateContactManagerStatusSchema } from '../../../src/domain/schemas/UpdateContactManagerStatusSchema';

describe('UpdateContactManagerStatusSchema', () => {
  describe('updateContactManagerStatusSchema', () => {
    it('should validate valid schema', () => {
      const validData = {
        status: 'Available',
      };

      const result = updateContactManagerStatusSchema.parse(validData);
      expect(result.status).toBe('Available');
    });

    it('should throw error for invalid status', () => {
      const invalidData = {
        status: 'INVALID_STATUS',
      };

      expect(() => {
        updateContactManagerStatusSchema.parse(invalidData);
      }).toThrow();
    });
  });
});

