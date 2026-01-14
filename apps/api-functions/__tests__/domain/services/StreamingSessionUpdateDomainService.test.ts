import { StreamingSessionUpdateDomainService } from '../../../src/domain/services/StreamingSessionUpdateDomainService';
import { StreamingSessionDomainService } from '../../../src/domain/services/StreamingSessionDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { StreamingSessionUpdateRequest } from '../../../src/domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingSessionUpdateResponse } from '../../../src/domain/value-objects/StreamingSessionUpdateResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockWebPubSubService, createMockUser } from './domainServiceTestSetup';
import { StreamingStatus } from '../../../src/domain/enums/StreamingStatus';

const createMockStreamingSessionDomainService = (): jest.Mocked<StreamingSessionDomainService> => {
  return {
    startStreamingSession: jest.fn(),
    stopStreamingSession: jest.fn(),
  } as any;
};

describe('StreamingSessionUpdateDomainService', () => {
  let service: StreamingSessionUpdateDomainService;
  let mockStreamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockStreamingSessionDomainService = createMockStreamingSessionDomainService();
    mockUserRepository = createMockUserRepository();
    mockWebPubSubService = createMockWebPubSubService();
    service = new StreamingSessionUpdateDomainService(
      mockStreamingSessionDomainService,
      mockUserRepository,
      mockWebPubSubService
    );
  });

  describe('updateStreamingSession', () => {
    it('should start streaming session successfully', async () => {
      const request = new StreamingSessionUpdateRequest('caller-id', StreamingStatus.Started);
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockStreamingSessionDomainService.startStreamingSession.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.updateStreamingSession(request);

      expect(mockStreamingSessionDomainService.startStreamingSession).toHaveBeenCalledWith('user-id');
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalled();
      expect(result.status).toBe(StreamingStatus.Started);
      expect(result.message).toContain('started');
    });

    it('should stop streaming session successfully', async () => {
      const request = new StreamingSessionUpdateRequest('caller-id', StreamingStatus.Stopped, false, 'DISCONNECT');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
      });
      const stoppedSession = {
        stoppedAt: new Date(),
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue(stoppedSession as any);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.updateStreamingSession(request);

      expect(mockStreamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-id', 'DISCONNECT');
      expect(result.status).toBe(StreamingStatus.Stopped);
      expect(result.message).toContain('stopped');
      expect(result.stopReason).toBe('DISCONNECT');
    });

    it('should use COMMAND reason when isCommand is true', async () => {
      const request = new StreamingSessionUpdateRequest('caller-id', StreamingStatus.Stopped, true);
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue({ stoppedAt: new Date() } as any);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      await service.updateStreamingSession(request);

      expect(mockStreamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-id', 'COMMAND');
    });

    it('should use DISCONNECT reason when isCommand is false and no reason provided', async () => {
      const request = new StreamingSessionUpdateRequest('caller-id', StreamingStatus.Stopped, false);
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue({ stoppedAt: new Date() } as any);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      await service.updateStreamingSession(request);

      expect(mockStreamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-id', 'DISCONNECT');
    });

    it('should throw error when user not found', async () => {
      const request = new StreamingSessionUpdateRequest('caller-id', StreamingStatus.Started);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.updateStreamingSession(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should broadcast error when start fails', async () => {
      const request = new StreamingSessionUpdateRequest('caller-id', StreamingStatus.Started);
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockStreamingSessionDomainService.startStreamingSession.mockRejectedValue(new Error('Start failed'));
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      await expect(service.updateStreamingSession(request)).rejects.toThrow('Start failed');
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({ status: 'failed' })
      );
    });
  });
});

