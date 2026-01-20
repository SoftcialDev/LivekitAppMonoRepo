import { LivekitRecordingRequest } from '../../../src/domain/value-objects/LivekitRecordingRequest';
import { RecordingCommandType } from '@prisma/client';

describe('LivekitRecordingRequest', () => {
  describe('isStopCommand', () => {
    it('should return true when command is STOP', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.STOP, 'room-name');
      expect(request.isStopCommand()).toBe(true);
    });

    it('should return false when command is START', () => {
      const request = new LivekitRecordingRequest(RecordingCommandType.START, 'room-name');
      expect(request.isStopCommand()).toBe(false);
    });
  });
});





