import { StreamingSessionUpdateDomainService } from '../../../../shared/domain/services/StreamingSessionUpdateDomainService';
import { StreamingSessionUpdateRequest } from '../../../../shared/domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingSessionDomainService } from '../../../../shared/domain/services/StreamingSessionDomainService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';
import { StreamingStatus } from '../../../../shared/domain/enums/StreamingStatus';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';

describe('StreamingSessionUpdateDomainService', () => {
  let service: StreamingSessionUpdateDomainService;
  let streamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();
    streamingSessionDomainService = { startStreamingSession: jest.fn(), stopStreamingSession: jest.fn() } as any;
    userRepository = { findByAzureAdObjectId: jest.fn() } as any;
    webPubSubService = { broadcastMessage: jest.fn() } as any;
    service = new StreamingSessionUpdateDomainService(
      streamingSessionDomainService,
      userRepository,
      webPubSubService
    );
  });

  describe('updateStreamingSession', () => {
    it('should start streaming session when status is Started', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      const request = new StreamingSessionUpdateRequest('caller-123', StreamingStatus.Started);
      const result = await service.updateStreamingSession(request);
      expect(streamingSessionDomainService.startStreamingSession).toHaveBeenCalledWith('user-123');
      expect(webPubSubService.broadcastMessage).toHaveBeenCalledWith('user@example.com', {
        email: 'user@example.com',
        status: 'started'
      });
      expect(result.status).toBe(StreamingStatus.Started);
    });

    it('should stop streaming session when status is Stopped', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      const request = new StreamingSessionUpdateRequest('caller-123', StreamingStatus.Stopped);
      const result = await service.updateStreamingSession(request);
      expect(streamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-123', 'DISCONNECT');
      expect(webPubSubService.broadcastMessage).toHaveBeenCalledWith('user@example.com', {
        email: 'user@example.com',
        status: 'stopped',
        reason: 'DISCONNECT'
      });
      expect(result.status).toBe(StreamingStatus.Stopped);
    });

    it('should use COMMAND reason when isCommand is true', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      const request = new StreamingSessionUpdateRequest('caller-123', StreamingStatus.Stopped, true);
      const result = await service.updateStreamingSession(request);
      expect(streamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-123', 'COMMAND');
      expect(webPubSubService.broadcastMessage).toHaveBeenCalledWith('user@example.com', {
        email: 'user@example.com',
        status: 'stopped',
        reason: 'COMMAND'
      });
    });

    it('should throw UserNotFoundError when user not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new StreamingSessionUpdateRequest('caller-123', StreamingStatus.Started);
      await expect(service.updateStreamingSession(request)).rejects.toThrow(UserNotFoundError);
    });
  });
});