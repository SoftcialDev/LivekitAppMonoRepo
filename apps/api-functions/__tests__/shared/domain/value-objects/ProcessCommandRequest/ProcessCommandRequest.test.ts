import { ProcessCommandRequest } from '../../../../../shared/domain/value-objects/ProcessCommandRequest';
import { ProcessCommandParams } from '../../../../../shared/domain/schemas/ProcessCommandSchema';
import { CommandType } from '../../../../../shared/domain/enums/CommandType';

describe('ProcessCommandRequest', () => {
  describe('constructor', () => {
    it('should create request with all properties', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        'Starting camera'
      );

      expect(request.command).toBe(CommandType.START);
      expect(request.employeeEmail).toBe('employee@example.com');
      expect(request.timestamp).toBe(timestamp);
      expect(request.reason).toBe('Starting camera');
    });

    it('should create request without reason', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.STOP,
        'employee@example.com',
        timestamp
      );

      expect(request.command).toBe(CommandType.STOP);
      expect(request.employeeEmail).toBe('employee@example.com');
      expect(request.timestamp).toBe(timestamp);
      expect(request.reason).toBeUndefined();
    });

    it('should create START command', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp
      );

      expect(request.command).toBe(CommandType.START);
    });

    it('should create STOP command', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.STOP,
        'employee@example.com',
        timestamp,
        'Stopping camera'
      );

      expect(request.command).toBe(CommandType.STOP);
    });

    it('should handle different email formats', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request1 = new ProcessCommandRequest(
        CommandType.START,
        'user@company.com',
        timestamp
      );
      const request2 = new ProcessCommandRequest(
        CommandType.START,
        'admin@subdomain.example.com',
        timestamp
      );

      expect(request1.employeeEmail).toBe('user@company.com');
      expect(request2.employeeEmail).toBe('admin@subdomain.example.com');
    });

    it('should handle different timestamps', () => {
      const timestamp1 = new Date('2023-12-01T10:00:00Z');
      const timestamp2 = new Date('2023-12-01T11:30:00Z');
      const request1 = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp1
      );
      const request2 = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp2
      );

      expect(request1.timestamp).toBe(timestamp1);
      expect(request2.timestamp).toBe(timestamp2);
    });
  });

  describe('fromMessage', () => {
    it('should create request from valid message parameters', () => {
      const params: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T10:00:00Z',
        reason: 'Starting camera'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.command).toBe(CommandType.START);
      expect(request.employeeEmail).toBe('employee@example.com');
      expect(request.timestamp).toEqual(new Date('2023-12-01T10:00:00Z'));
      expect(request.reason).toBe('Starting camera');
    });

    it('should create request from message without reason', () => {
      const params: ProcessCommandParams = {
        command: 'STOP',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T10:00:00Z'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.command).toBe(CommandType.STOP);
      expect(request.employeeEmail).toBe('employee@example.com');
      expect(request.timestamp).toEqual(new Date('2023-12-01T10:00:00Z'));
      expect(request.reason).toBeUndefined();
    });

    it('should handle different command types from message', () => {
      const params1: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T10:00:00Z'
      };
      const params2: ProcessCommandParams = {
        command: 'STOP',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T10:00:00Z'
      };

      const request1 = ProcessCommandRequest.fromMessage(params1);
      const request2 = ProcessCommandRequest.fromMessage(params2);

      expect(request1.command).toBe(CommandType.START);
      expect(request2.command).toBe(CommandType.STOP);
    });

    it('should handle different email formats from message', () => {
      const params: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'user@company.com',
        timestamp: '2023-12-01T10:00:00Z'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.employeeEmail).toBe('user@company.com');
    });

    it('should handle different timestamp formats from message', () => {
      const params: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T11:30:00.000Z'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.timestamp).toEqual(new Date('2023-12-01T11:30:00.000Z'));
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with all properties', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        'Starting camera'
      );

      const payload = request.toPayload();

      expect(payload).toEqual({
        command: CommandType.START,
        employeeEmail: 'employee@example.com',
        timestamp: timestamp,
        reason: 'Starting camera'
      });
    });

    it('should convert to payload format without reason', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.STOP,
        'employee@example.com',
        timestamp
      );

      const payload = request.toPayload();

      expect(payload).toEqual({
        command: CommandType.STOP,
        employeeEmail: 'employee@example.com',
        timestamp: timestamp,
        reason: undefined
      });
    });

    it('should return immutable payload', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        'Starting camera'
      );

      const payload = request.toPayload();
      payload.command = CommandType.STOP;

      expect(request.command).toBe(CommandType.START);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        'Starting camera'
      );

      expect(() => {
        (request as any).command = CommandType.STOP;
      }).toThrow();
      expect(() => {
        (request as any).employeeEmail = 'other@example.com';
      }).toThrow();
      expect(() => {
        (request as any).timestamp = new Date();
      }).toThrow();
      expect(() => {
        (request as any).reason = 'Different reason';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty reason string', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        ''
      );

      expect(request.reason).toBe('');
    });

    it('should handle long reason string', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const longReason = 'This is a very long reason that explains why the command was issued and provides detailed context about the decision making process';
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        longReason
      );

      expect(request.reason).toBe(longReason);
    });

    it('should handle special characters in email', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'user+tag@example.com',
        timestamp
      );

      expect(request.employeeEmail).toBe('user+tag@example.com');
    });

    it('should handle different timestamp formats', () => {
      const timestamp1 = new Date('2023-12-01T10:00:00Z');
      const timestamp2 = new Date('2023-12-01T10:00:00.000Z');
      const timestamp3 = new Date('2023-12-01T10:00:00+00:00');

      const request1 = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp1
      );
      const request2 = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp2
      );
      const request3 = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp3
      );

      expect(request1.timestamp).toBe(timestamp1);
      expect(request2.timestamp).toBe(timestamp2);
      expect(request3.timestamp).toBe(timestamp3);
    });
  });

  describe('type safety', () => {
    it('should accept CommandType for command', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp
      );

      expect(request.command).toBe(CommandType.START);
    });

    it('should accept string for employeeEmail', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp
      );

      expect(typeof request.employeeEmail).toBe('string');
    });

    it('should accept Date for timestamp', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp
      );

      expect(request.timestamp).toBeInstanceOf(Date);
    });

    it('should accept optional string for reason', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'employee@example.com',
        timestamp,
        'Starting camera'
      );

      expect(typeof request.reason).toBe('string');
    });

    it('should accept ProcessCommandParams interface', () => {
      const params: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T10:00:00Z'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.command).toBe(CommandType.START);
    });
  });

  describe('validation scenarios', () => {
    it('should handle camera start command scenario', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'pso@company.com',
        timestamp,
        'Starting camera for monitoring'
      );

      expect(request.command).toBe(CommandType.START);
      expect(request.employeeEmail).toBe('pso@company.com');
      expect(request.reason).toBe('Starting camera for monitoring');
    });

    it('should handle camera stop command scenario', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.STOP,
        'pso@company.com',
        timestamp,
        'Stopping camera due to end of shift'
      );

      expect(request.command).toBe(CommandType.STOP);
      expect(request.employeeEmail).toBe('pso@company.com');
      expect(request.reason).toBe('Stopping camera due to end of shift');
    });

    it('should handle supervisor command scenario', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'supervisor@company.com',
        timestamp,
        'Supervisor initiated camera start'
      );

      expect(request.command).toBe(CommandType.START);
      expect(request.employeeEmail).toBe('supervisor@company.com');
    });

    it('should handle admin command scenario', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.STOP,
        'admin@company.com',
        timestamp,
        'Admin initiated camera stop'
      );

      expect(request.command).toBe(CommandType.STOP);
      expect(request.employeeEmail).toBe('admin@company.com');
    });

    it('should handle command from message scenario', () => {
      const params: ProcessCommandParams = {
        command: 'START',
        employeeEmail: 'employee@company.com',
        timestamp: '2023-12-01T10:00:00Z',
        reason: 'Command received from Service Bus'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.command).toBe(CommandType.START);
      expect(request.employeeEmail).toBe('employee@company.com');
      expect(request.reason).toBe('Command received from Service Bus');
    });

    it('should handle command with different email domains scenario', () => {
      const timestamp = new Date('2023-12-01T10:00:00Z');
      const request = new ProcessCommandRequest(
        CommandType.START,
        'user@subdomain.example.com',
        timestamp,
        'Command for subdomain user'
      );

      expect(request.employeeEmail).toBe('user@subdomain.example.com');
    });

    it('should handle command with timestamp conversion scenario', () => {
      const params: ProcessCommandParams = {
        command: 'STOP',
        employeeEmail: 'employee@example.com',
        timestamp: '2023-12-01T11:30:00.000Z'
      };

      const request = ProcessCommandRequest.fromMessage(params);

      expect(request.timestamp).toEqual(new Date('2023-12-01T11:30:00.000Z'));
    });
  });
});
