import { PendingCommandDomainService } from '../../../../shared/domain/services/PendingCommandDomainService';
import { IPendingCommandRepository } from '../../../../shared/domain/interfaces/IPendingCommandRepository';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { PendingCommandUserNotFoundError } from '../../../../shared/domain/errors/PendingCommandErrors';

describe('PendingCommandDomainService', () => {
  let service: PendingCommandDomainService;
  let pendingCommandRepository: jest.Mocked<IPendingCommandRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    pendingCommandRepository = { createPendingCommand: jest.fn(), deletePendingCommandsForEmployee: jest.fn(), markAsPublished: jest.fn(), getPendingCommandsForEmployee: jest.fn() } as any;
    userRepository = { findByAzureAdObjectId: jest.fn() } as any;
    service = new PendingCommandDomainService(pendingCommandRepository, userRepository);
  });

  describe('createPendingCommand', () => {
    it('should create pending command successfully', async () => {
      const mockCommand = { id: 'cmd-123', employeeId: 'emp-123', command: 'START', timestamp: new Date(), reason: 'Test reason' };
      pendingCommandRepository.createPendingCommand.mockResolvedValue(mockCommand as any);
      const result = await service.createPendingCommand('emp-123', 'START', new Date(), 'Test reason');
      expect(pendingCommandRepository.deletePendingCommandsForEmployee).toHaveBeenCalledWith('emp-123');
      expect(result.id).toBe('cmd-123');
    });
  });

  describe('markAsPublished', () => {
    it('should mark command as published', async () => {
      await service.markAsPublished('cmd-123');
      expect(pendingCommandRepository.markAsPublished).toHaveBeenCalledWith('cmd-123');
    });
  });

  describe('fetchPendingCommands', () => {
    it('should fetch pending commands for user', async () => {
      const mockUser = { id: 'user-123', isActive: () => true };
      const mockCommands = [{ id: 'cmd-123', employeeId: 'user-123', command: 'START', timestamp: new Date(), acknowledged: false }];
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      pendingCommandRepository.getPendingCommandsForEmployee.mockResolvedValue(mockCommands as any);
      const result = await service.fetchPendingCommands('caller-123');
      expect(result.pending).not.toBeNull();
    });

    it('should throw PendingCommandUserNotFoundError when user not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      await expect(service.fetchPendingCommands('caller-123')).rejects.toThrow(PendingCommandUserNotFoundError);
    });
  });
});