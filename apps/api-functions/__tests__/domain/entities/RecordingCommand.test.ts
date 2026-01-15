import { RecordingCommand } from '../../../src/domain/entities/RecordingCommand';
import { RecordingCommandType } from '@prisma/client';

describe('RecordingCommand', () => {
  describe('isValid', () => {
    it('should return true when all fields are present', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );
      expect(command.isValid()).toBe(true);
    });

    it('should return false when command is missing', () => {
      const command = new RecordingCommand(
        null as any,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );
      expect(command.isValid()).toBe(false);
    });

    it('should return false when roomName is missing', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        '',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );
      expect(command.isValid()).toBe(false);
    });
  });

  describe('toPayload', () => {
    it('should convert command to payload format', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room-name',
        'initiator-id',
        'subject-id',
        'Subject Label'
      );
      const payload = command.toPayload();

      expect(payload).toEqual({
        command: RecordingCommandType.START,
        roomName: 'room-name',
        initiatorUserId: 'initiator-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label'
      });
    });
  });
});


