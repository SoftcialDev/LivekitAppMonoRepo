import { deleteErrorLogsSchema } from '../../../src/domain/schemas/DeleteErrorLogsSchema';

describe('DeleteErrorLogsSchema', () => {
  describe('deleteErrorLogsSchema', () => {
    it('should validate schema with ids array', () => {
      const validData = {
        ids: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
      };

      const result = deleteErrorLogsSchema.parse(validData);
      expect(result.ids).toEqual(['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001']);
    });

    it('should validate schema with deleteAll flag', () => {
      const validData = {
        deleteAll: true,
      };

      const result = deleteErrorLogsSchema.parse(validData);
      expect(result.deleteAll).toBe(true);
    });

    it('should throw error when both ids and deleteAll are missing', () => {
      const invalidData = {};

      expect(() => {
        deleteErrorLogsSchema.parse(invalidData);
      }).toThrow();
    });
  });
});

