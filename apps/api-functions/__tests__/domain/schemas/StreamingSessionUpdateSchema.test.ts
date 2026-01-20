import { streamingSessionUpdateSchema } from '../../../src/domain/schemas/StreamingSessionUpdateSchema';

describe('StreamingSessionUpdateSchema', () => {
  describe('status errorMap', () => {
    it('should return custom error message for invalid status', () => {
      const result = streamingSessionUpdateSchema.safeParse({
        status: 'invalid'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Status must be either 'started' or 'stopped'");
      }
    });
  });
});





