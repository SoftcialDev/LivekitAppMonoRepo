import { CommandApplicationService } from '../../../src/application/services/CommandApplicationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { Command } from '../../../src/domain/value-objects/Command';
import { MessagingResult } from '../../../src/domain/value-objects/MessagingResult';
import { MessagingError } from '../../../src/domain/errors/DomainError';
import { CommandType } from '../../../src/domain/enums/CommandType';
import { MessagingChannel } from '../../../src/domain/enums/MessagingChannel';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('CommandApplicationService', () => {
  let service: CommandApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockCommandMessagingService: jest.Mocked<ICommandMessagingService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    } as any;

    mockAuthorizationService = {} as any;

    mockCommandMessagingService = {
      sendToGroup: jest.fn(),
    } as any;

    mockWebPubSubService = {
      broadcastMessage: jest.fn(),
    } as any;

    service = new CommandApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockCommandMessagingService,
      mockWebPubSubService
    );
  });

  describe('validateTargetPSO', () => {
    it('should successfully validate PSO', async () => {
      const psoEmail = 'pso@example.com';
      const mockUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: psoEmail,
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await service.validateTargetPSO(psoEmail);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(psoEmail.toLowerCase().trim());
    });

    it('should throw error when email is empty', async () => {
      await expect(service.validateTargetPSO('')).rejects.toThrow();
    });

    it('should throw error when user is not PSO', async () => {
      const email = 'admin@example.com';
      const mockUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email,
        fullName: 'Admin User',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.validateTargetPSO(email)).rejects.toThrow();
    });
  });

  describe('sendCameraCommand', () => {
    it('should successfully send START command', async () => {
      const command = new Command(CommandType.START, 'pso@example.com', new Date());
      
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.sendCameraCommand(command);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:pso@example.com',
        command.toPayload()
      );
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'pso@example.com',
        expect.objectContaining({
          email: 'pso@example.com',
          status: 'pending'
        })
      );
      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(true);
    });

    it('should successfully send STOP command with reason', async () => {
      const command = new Command(CommandType.STOP, 'pso@example.com', new Date(), 'User requested');
      
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.sendCameraCommand(command);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:pso@example.com',
        command.toPayload()
      );
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'pso@example.com',
        expect.objectContaining({
          email: 'pso@example.com',
          status: 'stopped',
          reason: 'User requested'
        })
      );
      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(true);
    });

    it('should successfully send STOP command without reason', async () => {
      const command = new Command(CommandType.STOP, 'pso@example.com', new Date());
      
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.sendCameraCommand(command);

      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'pso@example.com',
        expect.objectContaining({
          email: 'pso@example.com',
          status: 'stopped'
        })
      );
      expect(result.success).toBe(true);
    });

    it('should not broadcast for unsupported command types', async () => {
      const command = new Command(CommandType.REFRESH as any, 'pso@example.com', new Date());
      
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.sendCameraCommand(command);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalled();
      expect(mockWebPubSubService.broadcastMessage).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw error when messaging fails', async () => {
      const command = new Command(CommandType.START, 'pso@example.com', new Date());
      
      mockCommandMessagingService.sendToGroup.mockRejectedValue(new Error('Messaging failed'));

      await expect(service.sendCameraCommand(command)).rejects.toThrow(MessagingError);
    });

    it('should continue even if broadcast fails', async () => {
      const command = new Command(CommandType.START, 'pso@example.com', new Date());
      
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockRejectedValue(new Error('Broadcast failed'));

      const result = await service.sendCameraCommand(command);

      expect(result.success).toBe(true);
    });
  });
});





