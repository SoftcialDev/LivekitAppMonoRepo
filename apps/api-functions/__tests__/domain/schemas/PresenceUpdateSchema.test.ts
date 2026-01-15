import { presenceUpdateSchema } from '../../../src/domain/schemas/PresenceUpdateSchema';

describe('PresenceUpdateSchema', () => {
  describe('status errorMap', () => {
    it('should return custom error message for invalid status', () => {
      const result = presenceUpdateSchema.safeParse({
        status: 'invalid'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Status must be either 'online' or 'offline'");
      }
    });
  });
});

