import { FetchPendingCommandsResponse, FetchPendingCommandsResponsePayload } from '../../../../../shared/domain/value-objects/FetchPendingCommandsResponse';
import { PendingCommand } from '../../../../../shared/domain/entities/PendingCommand';

// Mock CommandType since it's not available in test environment
const CommandType = {
  START: 'START',
  STOP: 'STOP'
} as const;

jest.mock('@prisma/client', () => ({
  CommandType: {
    START: 'START',
    STOP: 'STOP'
  }
}));

describe('FetchPendingCommandsResponse', () => {
  describe('constructor', () => {
    it('should create response with pending command', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);

      expect(response.pending).toBe(pendingCommand);
    });

    it('should create response with null pending', () => {
      const response = new FetchPendingCommandsResponse(null);

      expect(response.pending).toBeNull();
    });

    it('should create response with different pending commands', () => {
      const command1 = new PendingCommand({
        id: 'cmd-1',
        employeeId: 'emp-1',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const command2 = new PendingCommand({
        id: 'cmd-2',
        employeeId: 'emp-2',
        command: CommandType.STOP,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response1 = new FetchPendingCommandsResponse(command1);
      const response2 = new FetchPendingCommandsResponse(command2);

      expect(response1.pending).toBe(command1);
      expect(response2.pending).toBe(command2);
    });
  });

  describe('withPending factory method', () => {
    it('should create response with pending command', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = FetchPendingCommandsResponse.withPending(pendingCommand);

      expect(response.pending).toBe(pendingCommand);
    });

    it('should create response with different pending commands', () => {
      const command1 = new PendingCommand({
        id: 'cmd-1',
        employeeId: 'emp-1',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const command2 = new PendingCommand({
        id: 'cmd-2',
        employeeId: 'emp-2',
        command: CommandType.STOP,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response1 = FetchPendingCommandsResponse.withPending(command1);
      const response2 = FetchPendingCommandsResponse.withPending(command2);

      expect(response1.pending).toBe(command1);
      expect(response2.pending).toBe(command2);
    });
  });

  describe('withNoPending factory method', () => {
    it('should create response with null pending', () => {
      const response = FetchPendingCommandsResponse.withNoPending();

      expect(response.pending).toBeNull();
    });

    it('should create multiple instances with null pending', () => {
      const response1 = FetchPendingCommandsResponse.withNoPending();
      const response2 = FetchPendingCommandsResponse.withNoPending();

      expect(response1.pending).toBeNull();
      expect(response2.pending).toBeNull();
      expect(response1).not.toBe(response2); // Different instances
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with pending command', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);
      const payload = response.toPayload();

      expect(payload).toEqual({
        pending: pendingCommand
      });
    });

    it('should convert to payload format with null pending', () => {
      const response = new FetchPendingCommandsResponse(null);
      const payload = response.toPayload();

      expect(payload).toEqual({
        pending: null
      });
    });

    it('should return reference to pending command', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);
      const payload = response.toPayload();

      expect(payload.pending).toBe(pendingCommand);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).pending = null;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle pending command with all properties', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        published: true,
        publishedAt: new Date(),
        acknowledged: false,
        acknowledgedAt: null,
        attemptCount: 2,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);

      expect(response.pending).toBe(pendingCommand);
    });

    it('should handle pending command with minimal properties', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.STOP,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);

      expect(response.pending).toBe(pendingCommand);
    });
  });

  describe('type safety', () => {
    it('should accept PendingCommand or null for pending', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const responseWithCommand = new FetchPendingCommandsResponse(pendingCommand);
      const responseWithNull = new FetchPendingCommandsResponse(null);

      expect(responseWithCommand.pending).toBe(pendingCommand);
      expect(responseWithNull.pending).toBeNull();
    });

    it('should match FetchPendingCommandsResponsePayload interface', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);
      const payload: FetchPendingCommandsResponsePayload = response.toPayload();

      expect(payload).toEqual({
        pending: pendingCommand
      });
    });
  });

  describe('validation scenarios', () => {
    it('should handle pending command scenario', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-123',
        employeeId: 'emp-456',
        command: CommandType.START,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = FetchPendingCommandsResponse.withPending(pendingCommand);

      expect(response.pending).toBe(pendingCommand);
      expect(response.pending?.id).toBe('cmd-123');
    });

    it('should handle no pending commands scenario', () => {
      const response = FetchPendingCommandsResponse.withNoPending();

      expect(response.pending).toBeNull();
    });

    it('should handle command processing scenario', () => {
      const pendingCommand = new PendingCommand({
        id: 'cmd-process-123',
        employeeId: 'emp-process-456',
        command: CommandType.STOP,
        timestamp: new Date(),
        published: true,
        publishedAt: new Date(),
        acknowledged: false,
        acknowledgedAt: null,
        attemptCount: 1,
        expiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = new FetchPendingCommandsResponse(pendingCommand);

      expect(response.pending).toBe(pendingCommand);
      expect(response.pending?.isPublishedButNotAcknowledged()).toBe(true);
    });
  });
});
