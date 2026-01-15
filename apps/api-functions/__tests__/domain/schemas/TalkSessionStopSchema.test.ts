import { talkSessionStopSchema } from '../../../src/domain/schemas/TalkSessionStopSchema';
import { TalkStopReason } from '../../../src/domain/enums/TalkStopReason';

describe('TalkSessionStopSchema', () => {
  describe('talkSessionStopSchema', () => {
    it('should validate valid schema', () => {
      const validData = {
        talkSessionId: '123e4567-e89b-12d3-a456-426614174000',
        stopReason: TalkStopReason.USER_STOP,
      };

      const result = talkSessionStopSchema.parse(validData);
      expect(result.talkSessionId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.stopReason).toBe(TalkStopReason.USER_STOP);
    });

    it('should throw error for invalid UUID', () => {
      const invalidData = {
        talkSessionId: 'invalid-uuid',
        stopReason: TalkStopReason.USER_STOP,
      };

      expect(() => {
        talkSessionStopSchema.parse(invalidData);
      }).toThrow();
    });

    it('should throw error for invalid stopReason', () => {
      const invalidData = {
        talkSessionId: '123e4567-e89b-12d3-a456-426614174000',
        stopReason: 'INVALID_REASON',
      };

      expect(() => {
        talkSessionStopSchema.parse(invalidData);
      }).toThrow();
    });
  });
});

