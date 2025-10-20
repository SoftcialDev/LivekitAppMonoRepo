/**
 * @fileoverview RecordingCommand entity - unit tests
 */

// Mock RecordingCommandType enum globally
jest.mock('@prisma/client', () => ({
  RecordingCommandType: {
    START: 'START',
    STOP: 'STOP'
  }
}));

import { RecordingCommand } from '../../../../../shared/domain/entities/RecordingCommand';
import { RecordingCommandType } from '@prisma/client';

describe('RecordingCommand', () => {
  const baseCommandData = {
    command: RecordingCommandType.START,
    roomName: 'room123',
    initiatorUserId: 'initiator123',
    subjectUserId: 'subject123',
    subjectLabel: 'Test Subject'
  };

  describe('constructor', () => {
    it('creates command with all required properties', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.command).toBe(RecordingCommandType.START);
      expect(command.roomName).toBe('room123');
      expect(command.initiatorUserId).toBe('initiator123');
      expect(command.subjectUserId).toBe('subject123');
      expect(command.subjectLabel).toBe('Test Subject');
    });
  });

  describe('create', () => {
    it('creates command using static factory method', () => {
      const command = RecordingCommand.create(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.command).toBe(RecordingCommandType.START);
      expect(command.roomName).toBe('room123');
      expect(command.initiatorUserId).toBe('initiator123');
      expect(command.subjectUserId).toBe('subject123');
      expect(command.subjectLabel).toBe('Test Subject');
    });
  });

  describe('command type checks', () => {
    it('isStartCommand returns true for START command', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isStartCommand()).toBe(true);
    });

    it('isStartCommand returns false for STOP command', () => {
      const command = new RecordingCommand(
        RecordingCommandType.STOP,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isStartCommand()).toBe(false);
    });

    it('isStopCommand returns true for STOP command', () => {
      const command = new RecordingCommand(
        RecordingCommandType.STOP,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isStopCommand()).toBe(true);
    });

    it('isStopCommand returns false for START command', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isStopCommand()).toBe(false);
    });
  });

  describe('validation', () => {
    it('isValid returns true for valid command', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isValid()).toBe(true);
    });

    it('isValid returns false when command is empty', () => {
      const command = new RecordingCommand(
        '' as any,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isValid()).toBe(false);
    });

    it('isValid returns false when roomName is empty', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        '',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isValid()).toBe(false);
    });

    it('isValid returns false when initiatorUserId is empty', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        '',
        'subject123',
        'Test Subject'
      );
      
      expect(command.isValid()).toBe(false);
    });

    it('isValid returns false when subjectUserId is empty', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        '',
        'Test Subject'
      );
      
      expect(command.isValid()).toBe(false);
    });

    it('isValid returns false when subjectLabel is empty', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        ''
      );
      
      expect(command.isValid()).toBe(false);
    });
  });

  describe('toPayload', () => {
    it('converts command to payload format', () => {
      const command = new RecordingCommand(
        RecordingCommandType.START,
        'room123',
        'initiator123',
        'subject123',
        'Test Subject'
      );
      
      const payload = command.toPayload();
      
      expect(payload).toEqual({
        command: RecordingCommandType.START,
        roomName: 'room123',
        initiatorUserId: 'initiator123',
        subjectUserId: 'subject123',
        subjectLabel: 'Test Subject'
      });
    });
  });
});
