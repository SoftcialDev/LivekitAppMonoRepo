import { StreamingSessionUpdateRequest } from '../../../../../shared/domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingSessionUpdateParams } from '../../../../../shared/domain/schemas/StreamingSessionUpdateSchema';
import { StreamingStatus } from '../../../../../shared/domain/enums/StreamingStatus';

describe('StreamingSessionUpdateRequest', () => {
  describe('constructor', () => {
    it('should create request with all properties', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        'Starting streaming session'
      );

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(StreamingStatus.Started);
      expect(request.isCommand).toBe(true);
      expect(request.reason).toBe('Starting streaming session');
    });

    it('should create request without optional properties', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Stopped
      );

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(StreamingStatus.Stopped);
      expect(request.isCommand).toBeUndefined();
      expect(request.reason).toBeUndefined();
    });

    it('should create request with Started status', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started
      );

      expect(request.status).toBe(StreamingStatus.Started);
    });

    it('should create request with Stopped status', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Stopped,
        true,
        'Stopping streaming session'
      );

      expect(request.status).toBe(StreamingStatus.Stopped);
    });

    it('should handle different caller ID formats', () => {
      const request1 = new StreamingSessionUpdateRequest(
        'caller-abc',
        StreamingStatus.Started
      );
      const request2 = new StreamingSessionUpdateRequest(
        'caller-xyz',
        StreamingStatus.Started
      );

      expect(request1.callerId).toBe('caller-abc');
      expect(request2.callerId).toBe('caller-xyz');
    });

    it('should handle different boolean values for isCommand', () => {
      const request1 = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true
      );
      const request2 = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        false
      );

      expect(request1.isCommand).toBe(true);
      expect(request2.isCommand).toBe(false);
    });
  });

  describe('fromBody', () => {
    it('should create request from valid caller ID and body parameters', () => {
      const params: StreamingSessionUpdateParams = {
        status: 'started',
        isCommand: true,
        reason: 'Starting streaming session'
      };

      const request = StreamingSessionUpdateRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(StreamingStatus.Started);
      expect(request.isCommand).toBe(true);
      expect(request.reason).toBe('Starting streaming session');
    });

    it('should create request from body without optional properties', () => {
      const params: StreamingSessionUpdateParams = {
        status: 'stopped'
      };

      const request = StreamingSessionUpdateRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(StreamingStatus.Stopped);
      expect(request.isCommand).toBeUndefined();
      expect(request.reason).toBeUndefined();
    });

    it('should handle different status values from body', () => {
      const params1: StreamingSessionUpdateParams = {
        status: 'started'
      };
      const params2: StreamingSessionUpdateParams = {
        status: 'stopped'
      };

      const request1 = StreamingSessionUpdateRequest.fromBody('caller-123', params1);
      const request2 = StreamingSessionUpdateRequest.fromBody('caller-123', params2);

      expect(request1.status).toBe(StreamingStatus.Started);
      expect(request2.status).toBe(StreamingStatus.Stopped);
    });

    it('should handle different caller ID formats from body', () => {
      const params: StreamingSessionUpdateParams = {
        status: 'started'
      };

      const request = StreamingSessionUpdateRequest.fromBody('caller-abc', params);

      expect(request.callerId).toBe('caller-abc');
    });

    it('should handle different boolean values for isCommand from body', () => {
      const params1: StreamingSessionUpdateParams = {
        status: 'started',
        isCommand: true
      };
      const params2: StreamingSessionUpdateParams = {
        status: 'started',
        isCommand: false
      };

      const request1 = StreamingSessionUpdateRequest.fromBody('caller-123', params1);
      const request2 = StreamingSessionUpdateRequest.fromBody('caller-123', params2);

      expect(request1.isCommand).toBe(true);
      expect(request2.isCommand).toBe(false);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with all properties', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        'Starting streaming session'
      );

      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-123',
        status: StreamingStatus.Started,
        isCommand: true,
        reason: 'Starting streaming session'
      });
    });

    it('should convert to payload format without optional properties', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Stopped
      );

      const payload = request.toPayload();

      expect(payload).toEqual({
        callerId: 'caller-123',
        status: StreamingStatus.Stopped,
        isCommand: undefined,
        reason: undefined
      });
    });

    it('should return immutable payload', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        'Starting streaming session'
      );

      const payload = request.toPayload();
      payload.status = StreamingStatus.Stopped;

      expect(request.status).toBe(StreamingStatus.Started);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        'Starting streaming session'
      );

      expect(() => {
        (request as any).callerId = 'other-caller';
      }).toThrow();
      expect(() => {
        (request as any).status = StreamingStatus.Stopped;
      }).toThrow();
      expect(() => {
        (request as any).isCommand = false;
      }).toThrow();
      expect(() => {
        (request as any).reason = 'Different reason';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new StreamingSessionUpdateRequest(
        '',
        StreamingStatus.Started
      );

      expect(request.callerId).toBe('');
    });

    it('should handle long caller ID string', () => {
      const longCallerId = 'caller-' + 'x'.repeat(100);
      const request = new StreamingSessionUpdateRequest(
        longCallerId,
        StreamingStatus.Started
      );

      expect(request.callerId).toBe(longCallerId);
    });

    it('should handle special characters in caller ID', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123!@#$%',
        StreamingStatus.Started
      );

      expect(request.callerId).toBe('caller-123!@#$%');
    });

    it('should handle unicode characters in caller ID', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-测试-123',
        StreamingStatus.Started
      );

      expect(request.callerId).toBe('caller-测试-123');
    });

    it('should handle empty reason string', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        ''
      );

      expect(request.reason).toBe('');
    });

    it('should handle long reason string', () => {
      const longReason = 'This is a very long reason that explains why the streaming session was started and provides detailed context about the decision making process';
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        longReason
      );

      expect(request.reason).toBe(longReason);
    });

    it('should handle numeric caller ID', () => {
      const request = new StreamingSessionUpdateRequest(
        '123456',
        StreamingStatus.Started
      );

      expect(request.callerId).toBe('123456');
    });

    it('should handle alphanumeric caller ID', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller123abc',
        StreamingStatus.Started
      );

      expect(request.callerId).toBe('caller123abc');
    });
  });

  describe('type safety', () => {
    it('should accept string for callerId', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started
      );

      expect(typeof request.callerId).toBe('string');
    });

    it('should accept StreamingStatus for status', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started
      );

      expect(request.status).toBe(StreamingStatus.Started);
    });

    it('should accept optional boolean for isCommand', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true
      );

      expect(typeof request.isCommand).toBe('boolean');
    });

    it('should accept optional string for reason', () => {
      const request = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        'Starting streaming session'
      );

      expect(typeof request.reason).toBe('string');
    });

    it('should accept StreamingSessionUpdateParams interface', () => {
      const params: StreamingSessionUpdateParams = {
        status: 'started',
        isCommand: true
      };

      const request = StreamingSessionUpdateRequest.fromBody('caller-123', params);

      expect(request.status).toBe(StreamingStatus.Started);
    });
  });

  describe('validation scenarios', () => {
    it('should handle streaming session start scenario', () => {
      const request = new StreamingSessionUpdateRequest(
        'pso-123',
        StreamingStatus.Started,
        true,
        'Starting streaming session for monitoring'
      );

      expect(request.callerId).toBe('pso-123');
      expect(request.status).toBe(StreamingStatus.Started);
      expect(request.isCommand).toBe(true);
      expect(request.reason).toBe('Starting streaming session for monitoring');
    });

    it('should handle streaming session stop scenario', () => {
      const request = new StreamingSessionUpdateRequest(
        'pso-123',
        StreamingStatus.Stopped,
        true,
        'Stopping streaming session due to end of shift'
      );

      expect(request.callerId).toBe('pso-123');
      expect(request.status).toBe(StreamingStatus.Stopped);
      expect(request.isCommand).toBe(true);
      expect(request.reason).toBe('Stopping streaming session due to end of shift');
    });

    it('should handle supervisor streaming session update scenario', () => {
      const request = new StreamingSessionUpdateRequest(
        'supervisor-456',
        StreamingStatus.Started,
        false,
        'Supervisor initiated streaming session start'
      );

      expect(request.callerId).toBe('supervisor-456');
      expect(request.status).toBe(StreamingStatus.Started);
      expect(request.isCommand).toBe(false);
    });

    it('should handle admin streaming session update scenario', () => {
      const request = new StreamingSessionUpdateRequest(
        'admin-789',
        StreamingStatus.Stopped,
        false,
        'Admin initiated streaming session stop'
      );

      expect(request.callerId).toBe('admin-789');
      expect(request.status).toBe(StreamingStatus.Stopped);
      expect(request.isCommand).toBe(false);
    });

    it('should handle streaming session update from body scenario', () => {
      const params: StreamingSessionUpdateParams = {
        status: 'started',
        isCommand: true,
        reason: 'Streaming session update received from API'
      };

      const request = StreamingSessionUpdateRequest.fromBody('caller-123', params);

      expect(request.callerId).toBe('caller-123');
      expect(request.status).toBe(StreamingStatus.Started);
      expect(request.isCommand).toBe(true);
      expect(request.reason).toBe('Streaming session update received from API');
    });

    it('should handle streaming session update with different caller ID formats scenario', () => {
      const request1 = new StreamingSessionUpdateRequest(
        '550e8400-e29b-41d4-a716-446655440000',
        StreamingStatus.Started
      );
      const request2 = new StreamingSessionUpdateRequest(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        StreamingStatus.Started
      );
      const request3 = new StreamingSessionUpdateRequest(
        'user@company.com',
        StreamingStatus.Started
      );

      expect(request1.callerId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(request2.callerId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(request3.callerId).toBe('user@company.com');
    });

    it('should handle streaming session update with command flag scenario', () => {
      const request1 = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        true,
        'Command triggered streaming session start'
      );
      const request2 = new StreamingSessionUpdateRequest(
        'caller-123',
        StreamingStatus.Started,
        false,
        'Manual streaming session start'
      );

      expect(request1.isCommand).toBe(true);
      expect(request2.isCommand).toBe(false);
    });
  });
});
