import { WebSocketConnectionDomainService } from '../../../src/domain/services/WebSocketConnectionDomainService';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { StreamingSessionDomainService } from '../../../src/domain/services/StreamingSessionDomainService';
import { TalkSessionDomainService } from '../../../src/domain/services/TalkSessionDomainService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ITalkSessionRepository } from '../../../src/domain/interfaces/ITalkSessionRepository';
import { LiveKitRecordingService } from '../../../src/infrastructure/services/LiveKitRecordingService';
import { WebSocketEventRequest } from '../../../src/domain/value-objects/WebSocketEventRequest';
import { WebSocketEventResponse } from '../../../src/domain/value-objects/WebSocketEventResponse';
import { createMockPresenceDomainServiceInstance, createMockStreamingSessionDomainServiceInstance, createMockWebPubSubService, createMockUserRepository, createMockTalkSessionRepository, createMockLiveKitRecordingService, createMockTalkSessionDomainService, createMockUser, createMockSupervisor } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';
import { TalkStopReason } from '../../../src/domain/enums/TalkStopReason';

describe('WebSocketConnectionDomainService', () => {
  let service: WebSocketConnectionDomainService;
  let mockPresenceDomainService: jest.Mocked<PresenceDomainService>;
  let mockStreamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLiveKitRecordingService: jest.Mocked<LiveKitRecordingService>;
  let mockTalkSessionRepository: jest.Mocked<ITalkSessionRepository>;
  let mockTalkSessionDomainService: jest.Mocked<TalkSessionDomainService>;

  beforeEach(() => {
    mockPresenceDomainService = createMockPresenceDomainServiceInstance();
    mockStreamingSessionDomainService = createMockStreamingSessionDomainServiceInstance();
    mockWebPubSubService = createMockWebPubSubService();
    mockUserRepository = createMockUserRepository();
    mockLiveKitRecordingService = createMockLiveKitRecordingService();
    mockTalkSessionRepository = createMockTalkSessionRepository();
    mockTalkSessionDomainService = createMockTalkSessionDomainService();
    service = new WebSocketConnectionDomainService(
      mockPresenceDomainService,
      mockStreamingSessionDomainService,
      mockWebPubSubService,
      mockUserRepository,
      mockLiveKitRecordingService,
      mockTalkSessionRepository,
      mockTalkSessionDomainService
    );
  });

  describe('handleConnection', () => {
    it('should handle connection successfully', async () => {
      const request = new WebSocketEventRequest('user@example.com', 'conn-123', 'test-hub', 'connect', {
        userId: 'user@example.com',
      });

      mockPresenceDomainService.setUserOnline.mockResolvedValue(undefined);
      mockWebPubSubService.syncAllUsersWithDatabase.mockResolvedValue({
        corrected: 0,
        warnings: [],
        errors: [],
      });

      const result = await service.handleConnection(request);

      expect(mockPresenceDomainService.setUserOnline).toHaveBeenCalledWith('user@example.com');
      expect(result.status).toBe(200);
      expect(result.message).toContain('connected successfully');
    });

    it('should return error when userId is missing', async () => {
      const request = new WebSocketEventRequest('', 'conn-123', 'test-hub', 'connect', {});

      const result = await service.handleConnection(request);

      expect(result.status).toBe(500);
      expect(result.message).toContain('Missing userId');
    });

    it('should continue even if sync fails', async () => {
      const request = new WebSocketEventRequest('user@example.com', 'conn-123', 'test-hub', 'connect', {
        userId: 'user@example.com',
      });

      mockPresenceDomainService.setUserOnline.mockResolvedValue(undefined);
      mockWebPubSubService.syncAllUsersWithDatabase.mockRejectedValue(new Error('Sync failed'));

      const result = await service.handleConnection(request);

      expect(result.status).toBe(200);
    });
  });

  describe('handleDisconnection', () => {
    it('should handle disconnection successfully for PSO', async () => {
      const request = new WebSocketEventRequest('pso@example.com', 'conn-123', 'test-hub', 'disconnected', {
        userId: 'pso@example.com',
      });
      const user = createMockUser({
        id: 'user-id',
        email: 'pso@example.com',
        role: UserRole.PSO,
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([]);
      mockLiveKitRecordingService.stopAllForUser.mockResolvedValue({
        results: [],
        message: 'Stopped',
        total: 0,
        completed: 0,
      } as any);
      mockPresenceDomainService.setUserOffline.mockResolvedValue(undefined);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue(null);
      mockWebPubSubService.syncAllUsersWithDatabase.mockResolvedValue({
        corrected: 0,
        warnings: [],
        errors: [],
      });

      const result = await service.handleDisconnection(request);

      expect(mockPresenceDomainService.setUserOffline).toHaveBeenCalled();
      expect(mockStreamingSessionDomainService.stopStreamingSession).toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it('should close supervisor talk sessions on disconnect', async () => {
      const request = new WebSocketEventRequest('supervisor@example.com', 'conn-123', 'test-hub', 'disconnected', {
        userId: 'supervisor@example.com',
      });
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        email: 'supervisor@example.com',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const session = {
        id: 'session-id',
        psoId: 'pso-id',
      };

      mockUserRepository.findByEmail.mockResolvedValue(supervisor);
      mockTalkSessionRepository.getActiveTalkSessionsForSupervisor.mockResolvedValue([session] as any);
      mockTalkSessionRepository.stopTalkSession.mockResolvedValue(undefined);
      mockUserRepository.findById.mockResolvedValue(pso);
      mockTalkSessionDomainService.broadcastTalkStoppedEvent.mockResolvedValue(undefined);
      mockTalkSessionRepository.getActiveTalkSessionsForPso.mockResolvedValue([]);
      mockLiveKitRecordingService.stopAllForUser.mockResolvedValue({
        results: [],
        message: 'Stopped',
        total: 0,
        completed: 0,
      } as any);
      mockPresenceDomainService.setUserOffline.mockResolvedValue(undefined);
      mockStreamingSessionDomainService.stopStreamingSession.mockResolvedValue(null);
      mockWebPubSubService.syncAllUsersWithDatabase.mockResolvedValue({
        corrected: 0,
        warnings: [],
        errors: [],
      });

      await service.handleDisconnection(request);

      expect(mockTalkSessionRepository.stopTalkSession).toHaveBeenCalledWith('session-id', TalkStopReason.SUPERVISOR_DISCONNECTED);
      expect(mockTalkSessionDomainService.broadcastTalkStoppedEvent).toHaveBeenCalledWith('pso@example.com');
    });

    it('should return error when user not found', async () => {
      const request = new WebSocketEventRequest('user@example.com', 'conn-123', 'test-hub', 'disconnected', {
        userId: 'user@example.com',
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.handleDisconnection(request);

      expect(result.status).toBe(500);
      expect(result.message).toContain('User not found');
    });
  });
});

