import { WebSocketConnectionDomainService } from '../../../../shared/domain/services/WebSocketConnectionDomainService';
import { WebSocketEventRequest } from '../../../../shared/domain/value-objects/WebSocketEventRequest';
import { PresenceDomainService } from '../../../../shared/domain/services/PresenceDomainService';
import { StreamingSessionDomainService } from '../../../../shared/domain/services/StreamingSessionDomainService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { LiveKitRecordingService } from '../../../../shared/infrastructure/services/LiveKitRecordingService';

describe('WebSocketConnectionDomainService', () => {
  let service: WebSocketConnectionDomainService;
  let presenceDomainService: jest.Mocked<PresenceDomainService>;
  let streamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let liveKitRecordingService: jest.Mocked<LiveKitRecordingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    presenceDomainService = { setUserOnline: jest.fn(), setUserOffline: jest.fn() } as any;
    streamingSessionDomainService = { stopStreamingSession: jest.fn() } as any;
    webPubSubService = { syncAllUsersWithDatabase: jest.fn() } as any;
    userRepository = { findByEmail: jest.fn() } as any;
    liveKitRecordingService = { stopAllForUser: jest.fn() } as any;
    service = new WebSocketConnectionDomainService(
      presenceDomainService,
      streamingSessionDomainService,
      webPubSubService,
      userRepository,
      liveKitRecordingService
    );
  });

  describe('handleConnection', () => {
    it('should handle connection successfully', async () => {
      webPubSubService.syncAllUsersWithDatabase.mockResolvedValue({ corrected: 0, warnings: [], errors: [] } as any);
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'connected', { phase: 'connected' });
      const result = await service.handleConnection(request);
      expect(presenceDomainService.setUserOnline).toHaveBeenCalledWith('user-123');
      expect(result.message).toContain('connected successfully');
    });

    it('should return error when userId is missing', async () => {
      const request = new WebSocketEventRequest('', 'conn-123', 'hub-1', 'connected', { phase: 'connected' });
      const result = await service.handleConnection(request);
      expect(result.message).toContain('Missing userId');
    });

    it('should handle sync failure gracefully', async () => {
      webPubSubService.syncAllUsersWithDatabase.mockRejectedValue(new Error('Sync failed'));
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'connected', { phase: 'connected' });
      const result = await service.handleConnection(request);
      expect(result.message).toContain('connected successfully');
    });
  });

  describe('handleDisconnection', () => {
    it('should handle disconnection successfully', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'user-db-id', email: 'user-123' } as any);
      liveKitRecordingService.stopAllForUser.mockResolvedValue({ total: 0, completed: 0, results: [], message: 'No active recordings' });
      webPubSubService.syncAllUsersWithDatabase.mockResolvedValue({ corrected: 0, warnings: [], errors: [] } as any);
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'disconnected', { phase: 'disconnected' });
      const result = await service.handleDisconnection(request);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('user-123');
      expect(liveKitRecordingService.stopAllForUser).toHaveBeenCalledWith('user-db-id');
      expect(presenceDomainService.setUserOffline).toHaveBeenCalledWith('user-123', undefined);
      expect(streamingSessionDomainService.stopStreamingSession).toHaveBeenCalledWith('user-123', 'DISCONNECT', undefined);
      expect(result.message).toContain('disconnected successfully');
    });

    it('should return error when userId is missing', async () => {
      const request = new WebSocketEventRequest('', 'conn-123', 'hub-1', 'disconnected', { phase: 'disconnected' });
      const result = await service.handleDisconnection(request);
      expect(result.message).toContain('Missing userId');
    });
  });
});