import { ProcessCommandDomainService } from '../../../src/domain/services/ProcessCommandDomainService';
import { PendingCommandDomainService } from '../../../src/domain/services/PendingCommandDomainService';
import { StreamingSessionDomainService } from '../../../src/domain/services/StreamingSessionDomainService';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { ProcessCommandRequest } from '../../../src/domain/value-objects/ProcessCommandRequest';
import { ProcessCommandResponse } from '../../../src/domain/value-objects/ProcessCommandResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockCommandMessagingService, createMockWebPubSubService, createMockPendingCommandDomainService, createMockStreamingSessionDomainServiceInstance, createMockPresenceDomainServiceInstance, createMockUser } from './domainServiceTestSetup';
import { CommandType } from '../../../src/domain/enums/CommandType';
import { Status } from '../../../src/domain/enums/Status';

describe('ProcessCommandDomainService', () => {
  let service: ProcessCommandDomainService;
  let mockPendingCommandDomainService: jest.Mocked<PendingCommandDomainService>;
  let mockStreamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let mockPresenceDomainService: jest.Mocked<PresenceDomainService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCommandMessagingService: jest.Mocked<ICommandMessagingService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockPendingCommandDomainService = createMockPendingCommandDomainService();
    mockStreamingSessionDomainService = createMockStreamingSessionDomainServiceInstance();
    mockPresenceDomainService = createMockPresenceDomainServiceInstance();
    mockUserRepository = createMockUserRepository();
    mockCommandMessagingService = createMockCommandMessagingService();
    mockWebPubSubService = createMockWebPubSubService();
    service = new ProcessCommandDomainService(
      mockPendingCommandDomainService,
      mockStreamingSessionDomainService,
      mockPresenceDomainService,
      mockUserRepository,
      mockCommandMessagingService,
      mockWebPubSubService
    );
  });

  describe('processCommand', () => {
    it('should process START command successfully', async () => {
      const request = new ProcessCommandRequest(CommandType.START, 'employee@example.com', new Date());
      const user = createMockUser({
        id: 'user-id',
        email: 'employee@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPendingCommandDomainService.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: 'user-id',
        command: CommandType.START,
        timestamp: new Date(),
      } as any);
      mockStreamingSessionDomainService.startStreamingSession.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);
      mockPresenceDomainService.getPresenceStatus.mockResolvedValue(Status.Online);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockPendingCommandDomainService.markAsPublished.mockResolvedValue(undefined);

      const result = await service.processCommand(request);

      expect(mockStreamingSessionDomainService.startStreamingSession).toHaveBeenCalledWith('user-id');
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalled();
      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith('commands:employee@example.com', expect.any(Object));
      expect(result.delivered).toBe(true);
    });

    it('should process STOP command successfully', async () => {
      const request = new ProcessCommandRequest(CommandType.STOP, 'employee@example.com', new Date(), 'REASON');
      const user = createMockUser({
        id: 'user-id',
        email: 'employee@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPendingCommandDomainService.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: 'user-id',
        command: CommandType.STOP,
        timestamp: new Date(),
      } as any);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue(null);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);
      mockPresenceDomainService.getPresenceStatus.mockResolvedValue(Status.Online);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockPendingCommandDomainService.markAsPublished.mockResolvedValue(undefined);

      const result = await service.processCommand(request);

      expect(mockStreamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-id', 'REASON');
      expect(result.delivered).toBe(true);
    });

    it('should process REFRESH command without streaming session changes', async () => {
      const request = new ProcessCommandRequest(CommandType.REFRESH, 'employee@example.com', new Date());
      const user = createMockUser({
        id: 'user-id',
        email: 'employee@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPendingCommandDomainService.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: 'user-id',
        command: CommandType.REFRESH,
        timestamp: new Date(),
      } as any);
      mockPresenceDomainService.getPresenceStatus.mockResolvedValue(Status.Online);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockPendingCommandDomainService.markAsPublished.mockResolvedValue(undefined);

      const result = await service.processCommand(request);

      expect(mockStreamingSessionDomainService.startStreamingSession).not.toHaveBeenCalled();
      expect(mockStreamingSessionDomainService.stopStreamingSession).not.toHaveBeenCalled();
      expect(mockWebPubSubService.broadcastMessage).not.toHaveBeenCalled();
      expect(result.delivered).toBe(true);
    });

    it('should not deliver command when user is offline', async () => {
      const request = new ProcessCommandRequest(CommandType.START, 'employee@example.com', new Date());
      const user = createMockUser({
        id: 'user-id',
        email: 'employee@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPendingCommandDomainService.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: 'user-id',
        command: CommandType.START,
        timestamp: new Date(),
      } as any);
      mockStreamingSessionDomainService.startStreamingSession.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);
      mockPresenceDomainService.getPresenceStatus.mockResolvedValue(Status.Offline);

      const result = await service.processCommand(request);

      expect(result.delivered).toBe(false);
      expect(mockCommandMessagingService.sendToGroup).not.toHaveBeenCalled();
      expect(mockPendingCommandDomainService.markAsPublished).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const request = new ProcessCommandRequest(CommandType.START, 'employee@example.com', new Date());

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.processCommand(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should use COMMAND as default reason for STOP command', async () => {
      const request = new ProcessCommandRequest(CommandType.STOP, 'employee@example.com', new Date());
      const user = createMockUser({
        id: 'user-id',
        email: 'employee@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPendingCommandDomainService.createPendingCommand.mockResolvedValue({
        id: 'command-id',
        employeeId: 'user-id',
        command: CommandType.STOP,
        timestamp: new Date(),
      } as any);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue(null);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);
      mockPresenceDomainService.getPresenceStatus.mockResolvedValue(Status.Online);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockPendingCommandDomainService.markAsPublished.mockResolvedValue(undefined);

      await service.processCommand(request);

      expect(mockStreamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-id', 'COMMAND');
    });
  });
});

