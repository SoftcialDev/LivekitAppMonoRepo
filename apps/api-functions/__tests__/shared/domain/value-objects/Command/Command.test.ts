import { Command } from '../../../../../shared/domain/value-objects/Command';
import { CommandType } from '../../../../../shared/domain/enums/CommandType';

describe('Command', () => {
  describe('constructor', () => {
    it('should create command with all properties', () => {
      const timestamp = new Date();
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        timestamp,
        'Test reason'
      );

      expect(command.type).toBe(CommandType.START);
      expect(command.employeeEmail).toBe('employee@example.com');
      expect(command.timestamp).toBe(timestamp);
      expect(command.reason).toBe('Test reason');
    });

    it('should create command without reason', () => {
      const timestamp = new Date();
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        timestamp
      );

      expect(command.type).toBe(CommandType.STOP);
      expect(command.employeeEmail).toBe('employee@example.com');
      expect(command.timestamp).toBe(timestamp);
      expect(command.reason).toBeUndefined();
    });

    it('should create START command', () => {
      const timestamp = new Date();
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        timestamp
      );

      expect(command.type).toBe(CommandType.START);
    });

    it('should create STOP command', () => {
      const timestamp = new Date();
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        timestamp,
        'End of shift'
      );

      expect(command.type).toBe(CommandType.STOP);
      expect(command.reason).toBe('End of shift');
    });
  });

  describe('fromRequest', () => {
    it('should create command from request data', () => {
      const commandData = {
        command: CommandType.START,
        employeeEmail: '  EMPLOYEE@EXAMPLE.COM  ',
        reason: 'Test reason'
      };

      const command = Command.fromRequest(commandData);

      expect(command.type).toBe(CommandType.START);
      expect(command.employeeEmail).toBe('employee@example.com'); // Should be lowercase and trimmed
      expect(command.timestamp).toBeInstanceOf(Date);
      expect(command.reason).toBe('Test reason');
    });

    it('should create command without reason from request', () => {
      const commandData = {
        command: CommandType.STOP,
        employeeEmail: 'employee@example.com'
      };

      const command = Command.fromRequest(commandData);

      expect(command.type).toBe(CommandType.STOP);
      expect(command.employeeEmail).toBe('employee@example.com');
      expect(command.timestamp).toBeInstanceOf(Date);
      expect(command.reason).toBeUndefined();
    });

    it('should normalize email case and whitespace', () => {
      const commandData = {
        command: CommandType.START,
        employeeEmail: '  EMPLOYEE@EXAMPLE.COM  '
      };

      const command = Command.fromRequest(commandData);

      expect(command.employeeEmail).toBe('employee@example.com');
    });

    it('should handle different command types', () => {
      const startData = {
        command: CommandType.START,
        employeeEmail: 'employee@example.com'
      };

      const stopData = {
        command: CommandType.STOP,
        employeeEmail: 'employee@example.com',
        reason: 'End of shift'
      };

      const startCommand = Command.fromRequest(startData);
      const stopCommand = Command.fromRequest(stopData);

      expect(startCommand.type).toBe(CommandType.START);
      expect(stopCommand.type).toBe(CommandType.STOP);
      expect(stopCommand.reason).toBe('End of shift');
    });
  });

  describe('toPayload', () => {
    it('should convert command to payload with reason', () => {
      const timestamp = new Date();
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        timestamp,
        'End of shift'
      );

      const payload = command.toPayload();

      expect(payload).toEqual({
        command: CommandType.STOP,
        employeeEmail: 'employee@example.com',
        timestamp: timestamp.toISOString(),
        reason: 'End of shift'
      });
    });

    it('should convert command to payload without reason', () => {
      const timestamp = new Date();
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        timestamp
      );

      const payload = command.toPayload();

      expect(payload).toEqual({
        command: CommandType.START,
        employeeEmail: 'employee@example.com',
        timestamp: timestamp.toISOString()
      });
    });

    it('should return immutable payload', () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date()
      );

      const payload = command.toPayload() as any;
      
      // Try to modify payload
      payload.command = 'MODIFIED';
      payload.employeeEmail = 'modified@example.com';
      
      // Original command should be unchanged
      expect(command.type).toBe(CommandType.START);
      expect(command.employeeEmail).toBe('employee@example.com');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date(),
        'Test reason'
      );
      
      expect(() => {
        (command as any).type = CommandType.STOP;
      }).toThrow();
      
      expect(() => {
        (command as any).employeeEmail = 'modified@example.com';
      }).toThrow();
      
      expect(() => {
        (command as any).timestamp = new Date();
      }).toThrow();
      
      expect(() => {
        (command as any).reason = 'Modified reason';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty reason string', () => {
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        new Date(),
        ''
      );

      expect(command.reason).toBe('');
    });

    it('should handle long reason string', () => {
      const longReason = 'A'.repeat(1000);
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        new Date(),
        longReason
      );

      expect(command.reason).toBe(longReason);
    });

    it('should handle special characters in email', () => {
      const command = new Command(
        CommandType.START,
        'employee+test@example.com',
        new Date()
      );

      expect(command.employeeEmail).toBe('employee+test@example.com');
    });

    it('should handle different timestamp formats', () => {
      const pastDate = new Date('2023-01-01T00:00:00Z');
      const futureDate = new Date('2030-01-01T00:00:00Z');
      
      const pastCommand = new Command(CommandType.START, 'employee@example.com', pastDate);
      const futureCommand = new Command(CommandType.START, 'employee@example.com', futureDate);

      expect(pastCommand.timestamp).toBe(pastDate);
      expect(futureCommand.timestamp).toBe(futureDate);
    });
  });

  describe('timestamp behavior', () => {
    it('should set timestamp on creation from request', () => {
      const before = new Date();
      const command = Command.fromRequest({
        command: CommandType.START,
        employeeEmail: 'employee@example.com'
      });
      const after = new Date();

      expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(command.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have different timestamps for different requests', async () => {
      const command1 = Command.fromRequest({
        command: CommandType.START,
        employeeEmail: 'employee1@example.com'
      });
      
      // Add delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const command2 = Command.fromRequest({
        command: CommandType.START,
        employeeEmail: 'employee2@example.com'
      });

      expect(command1.timestamp.getTime()).not.toBe(command2.timestamp.getTime());
    });
  });
});