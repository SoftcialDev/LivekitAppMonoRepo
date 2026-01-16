import { livekitRecordingSchema } from '../../../src/domain/schemas/LivekitRecordingSchema';
import { RecordingCommandType } from '@prisma/client';

describe('LivekitRecordingSchema', () => {
  describe('command errorMap', () => {
    it('should return custom error message for invalid command', () => {
      const result = livekitRecordingSchema.safeParse({
        command: 'INVALID',
        roomName: 'room-1'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Command must be START or STOP');
      }
    });
  });
});



