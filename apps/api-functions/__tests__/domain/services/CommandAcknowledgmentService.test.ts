import { CommandAcknowledgmentService } from '../../../src/domain/services/CommandAcknowledgmentService';
import { IPendingCommandRepository } from '../../../src/domain/interfaces/IPendingCommandRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { AcknowledgeCommandRequest } from '../../../src/domain/value-objects/AcknowledgeCommandRequest';
import { AcknowledgeCommandResult } from '../../../src/domain/value-objects/AcknowledgeCommandResult';
import { CommandUserNotFoundError, CommandUserDeletedError, CommandInvalidUserRoleError, CommandNotFoundError } from '../../../src/domain/errors/CommandErrors';
import { createMockPendingCommandRepository, createMockUserRepository, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('CommandAcknowledgmentService', () => {
  let service: CommandAcknowledgmentService;
  let mockPendingCommandRepository: jest.Mocked<IPendingCommandRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockPendingCommandRepository = createMockPendingCommandRepository();
    mockUserRepository = createMockUserRepository();
    service = new CommandAcknowledgmentService(mockPendingCommandRepository, mockUserRepository);
  });

  describe('acknowledgeCommands', () => {
    it('should acknowledge commands successfully for PSO', async () => {
      const callerId = 'pso-azure-id';
      const request = new AcknowledgeCommandRequest(['cmd-1', 'cmd-2']);
      const mockUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.PSO,
        deletedAt: null,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);
      mockPendingCommandRepository.findByIds.mockResolvedValue(['cmd-1', 'cmd-2']);
      mockPendingCommandRepository.markAsAcknowledged.mockResolvedValue(2);

      const result = await service.acknowledgeCommands(request, callerId);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandRepository.findByIds).toHaveBeenCalledWith(['cmd-1', 'cmd-2']);
      expect(mockPendingCommandRepository.markAsAcknowledged).toHaveBeenCalledWith(['cmd-1', 'cmd-2']);
      expect(result.updatedCount).toBe(2);
      expect(result).toBeInstanceOf(AcknowledgeCommandResult);
    });

    it('should throw CommandUserNotFoundError when user not found', async () => {
      const callerId = 'non-existent-id';
      const request = new AcknowledgeCommandRequest(['cmd-1']);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.acknowledgeCommands(request, callerId)).rejects.toThrow(CommandUserNotFoundError);
    });

    it('should throw CommandUserDeletedError when user is deleted', async () => {
      const callerId = 'deleted-user-id';
      const request = new AcknowledgeCommandRequest(['cmd-1']);
      const mockUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.PSO,
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);

      await expect(service.acknowledgeCommands(request, callerId)).rejects.toThrow(CommandUserDeletedError);
    });

    it('should throw CommandInvalidUserRoleError when user is not PSO', async () => {
      const callerId = 'supervisor-id';
      const request = new AcknowledgeCommandRequest(['cmd-1']);
      const mockUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.Supervisor,
        deletedAt: null,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);

      await expect(service.acknowledgeCommands(request, callerId)).rejects.toThrow(CommandInvalidUserRoleError);
    });

    it('should throw CommandNotFoundError when command IDs not found', async () => {
      const callerId = 'pso-azure-id';
      const request = new AcknowledgeCommandRequest(['cmd-1', 'cmd-2', 'cmd-3']);
      const mockUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: callerId,
        role: UserRole.PSO,
        deletedAt: null,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser);
      mockPendingCommandRepository.findByIds.mockResolvedValue(['cmd-1', 'cmd-2']);

      await expect(service.acknowledgeCommands(request, callerId)).rejects.toThrow(CommandNotFoundError);
      await expect(service.acknowledgeCommands(request, callerId)).rejects.toThrow('Command IDs not found: cmd-3');
    });
  });
});


