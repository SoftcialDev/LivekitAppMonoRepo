import { ProcessCommandDomainService } from '../../../../shared/domain/services/ProcessCommandDomainService';
import { ProcessCommandRequest } from '../../../../shared/domain/value-objects/ProcessCommandRequest';
import { PendingCommandDomainService } from '../../../../shared/domain/services/PendingCommandDomainService';
import { StreamingSessionDomainService } from '../../../../shared/domain/services/StreamingSessionDomainService';
import { PresenceDomainService } from '../../../../shared/domain/services/PresenceDomainService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ICommandMessagingService } from '../../../../shared/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { CommandType } from '../../../../shared/domain/enums/CommandType';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';

describe('ProcessCommandDomainService', () => {
  let service: ProcessCommandDomainService;
  let pendingCommandDomainService: jest.Mocked<PendingCommandDomainService>;
  let streamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let presenceDomainService: jest.Mocked<PresenceDomainService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let commandMessagingService: jest.Mocked<ICommandMessagingService>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();
    pendingCommandDomainService = { createPendingCommand: jest.fn() } as any;
    streamingSessionDomainService = { startStreamingSession: jest.fn(), stopStreamingSession: jest.fn() } as any;
    presenceDomainService = { isUserOnline: jest.fn() } as any;
    userRepository = { findByEmail: jest.fn() } as any;
    commandMessagingService = { sendToUser: jest.fn() } as any;
    webPubSubService = { sendToUser: jest.fn(), broadcastMessage: jest.fn() } as any;
    service = new ProcessCommandDomainService(pendingCommandDomainService, streamingSessionDomainService, presenceDomainService, userRepository, commandMessagingService, webPubSubService);
  });

  describe('processCommand', () => {
    it('should process START command successfully', async () => {
      const mockUser = { id: 'user-123', email: 'employee@example.com' };
      const mockCommand = { id: 'cmd-123', employeeId: 'user-123', command: 'START', timestamp: new Date() };
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      pendingCommandDomainService.createPendingCommand.mockResolvedValue(mockCommand as any);
      const request = new ProcessCommandRequest(CommandType.START, 'employee@example.com', new Date());
      const result = await service.processCommand(request);
      expect(streamingSessionDomainService.startStreamingSession).toHaveBeenCalledWith('user-123');
    });

    it('should process STOP command successfully', async () => {
      const mockUser = { id: 'user-123', email: 'employee@example.com' };
      const mockCommand = { id: 'cmd-123', employeeId: 'user-123', command: 'STOP', timestamp: new Date() };
      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      pendingCommandDomainService.createPendingCommand.mockResolvedValue(mockCommand as any);
      const request = new ProcessCommandRequest(CommandType.STOP, 'employee@example.com', new Date());
      const result = await service.processCommand(request);
      expect(streamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-123', 'COMMAND');
    });

    it('should throw UserNotFoundError when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const request = new ProcessCommandRequest(CommandType.START, 'employee@example.com', new Date());
      await expect(service.processCommand(request)).rejects.toThrow(UserNotFoundError);
    });
  });
});