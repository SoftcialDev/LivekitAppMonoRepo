import { PendingCommandDomainService } from '../../../src/domain/services/PendingCommandDomainService';
import { IPendingCommandRepository } from '../../../src/domain/interfaces/IPendingCommandRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { FetchPendingCommandsResponse } from '../../../src/domain/value-objects/FetchPendingCommandsResponse';
import { PendingCommandUserNotFoundError, PendingCommandFetchError } from '../../../src/domain/errors/PendingCommandErrors';
import { createMockUserRepository, createMockPendingCommandRepository, createMockUser } from './domainServiceTestSetup';
import { CommandType } from '@prisma/client';
import { PendingCommand } from '../../../src/domain/entities/PendingCommand';

describe('PendingCommandDomainService', () => {
  let service: PendingCommandDomainService;
  let mockPendingCommandRepository: jest.Mocked<IPendingCommandRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockPendingCommandRepository = createMockPendingCommandRepository();
    mockUserRepository = createMockUserRepository();
    service = new PendingCommandDomainService(mockPendingCommandRepository, mockUserRepository);
  });

  describe('createPendingCommand', () => {
    it('should create pending command and delete existing ones', async () => {
      const psoId = 'pso-id';
      const command = CommandType.START;
      const timestamp = new Date();
      const reason = 'Test reason';

      mockPendingCommandRepository.deletePendingCommandsForPso.mockResolvedValue(undefined);
      mockPendingCommandRepository.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: psoId,
        command: command,
        timestamp: timestamp,
        reason: reason,
      } as any);

      const result = await service.createPendingCommand(psoId, command, timestamp, reason);

      expect(mockPendingCommandRepository.deletePendingCommandsForPso).toHaveBeenCalledWith(psoId);
      expect(mockPendingCommandRepository.createPendingCommand).toHaveBeenCalledWith(psoId, command, timestamp, reason);
      expect(result.id).toBe('command-id');
      expect(result.command).toBe(command);
    });

    it('should handle string timestamp', async () => {
      const psoId = 'pso-id';
      const command = CommandType.STOP;
      const timestamp = '2024-01-01T00:00:00Z';

      mockPendingCommandRepository.deletePendingCommandsForPso.mockResolvedValue(undefined);
      mockPendingCommandRepository.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: psoId,
        command: command,
        timestamp: new Date(timestamp),
      } as any);

      await service.createPendingCommand(psoId, command, timestamp);

      expect(mockPendingCommandRepository.createPendingCommand).toHaveBeenCalledWith(
        psoId,
        command,
        expect.any(Date),
        undefined
      );
    });
  });

  describe('markAsPublished', () => {
    it('should mark command as published', async () => {
      const commandId = 'command-id';

      mockPendingCommandRepository.markAsPublished.mockResolvedValue(undefined);

      await service.markAsPublished(commandId);

      expect(mockPendingCommandRepository.markAsPublished).toHaveBeenCalledWith(commandId);
    });
  });

  describe('fetchPendingCommands', () => {
    it('should return pending command when found and not expired', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockPendingCommandRepository.getPendingCommandsForPso.mockResolvedValue([
        {
          id: 'cmd-id',
          employeeId: 'user-id',
          command: CommandType.START,
          timestamp: new Date(),
          acknowledged: false,
        },
      ] as any);

      const result = await service.fetchPendingCommands(callerId);

      expect(result.pending).not.toBeNull();
      expect(result.pending?.id).toBe('cmd-id');
    });

    it('should return no pending when user not found', async () => {
      const callerId = 'caller-id';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.fetchPendingCommands(callerId)).rejects.toThrow(PendingCommandUserNotFoundError);
    });

    it('should return no pending when user is not active', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId, deletedAt: new Date() });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.fetchPendingCommands(callerId)).rejects.toThrow(PendingCommandUserNotFoundError);
    });

    it('should return no pending when no commands found', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockPendingCommandRepository.getPendingCommandsForPso.mockResolvedValue([]);

      const result = await service.fetchPendingCommands(callerId);

      expect(result.pending).toBeNull();
    });

    it('should return pending command when found and not expired', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId });
      const recentDate = new Date();
      recentDate.setMinutes(recentDate.getMinutes() - 5);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockPendingCommandRepository.getPendingCommandsForPso.mockResolvedValue([
        {
          id: 'cmd-id',
          employeeId: 'user-id',
          command: CommandType.START,
          timestamp: recentDate,
          acknowledged: false,
        },
      ] as any);

      const result = await service.fetchPendingCommands(callerId);

      expect(result.pending).not.toBeNull();
      expect(result.pending?.id).toBe('cmd-id');
    });

    it('should throw error when repository fails', async () => {
      const callerId = 'caller-id';
      const user = createMockUser({ id: 'user-id', azureAdObjectId: callerId });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockPendingCommandRepository.getPendingCommandsForPso.mockRejectedValue(new Error('Database error'));

      await expect(service.fetchPendingCommands(callerId)).rejects.toThrow(PendingCommandFetchError);
    });
  });
});

