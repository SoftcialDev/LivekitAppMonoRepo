import { WebSocketConnectionDomainService } from '../../../../shared/domain/services/WebSocketConnectionDomainService';
import { WebSocketEventRequest } from '../../../../shared/domain/value-objects/WebSocketEventRequest';
import { PresenceDomainService } from '../../../../shared/domain/services/PresenceDomainService';
import { StreamingSessionDomainService } from '../../../../shared/domain/services/StreamingSessionDomainService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';

describe('WebSocketConnectionDomainService', () => {
  let service: WebSocketConnectionDomainService;
  let presenceDomainService: jest.Mocked<PresenceDomainService>;
  let streamingSessionDomainService: jest.Mocked<StreamingSessionDomainService>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();
    presenceDomainService = { setUserOnline: jest.fn(), setUserOffline: jest.fn() } as any;
    streamingSessionDomainService = { stopStreamingSession: jest.fn() } as any;
    webPubSubService = { syncAllUsersWithDatabase: jest.fn() } as any;
    service = new WebSocketConnectionDomainService(presenceDomainService, streamingSessionDomainService, webPubSubService);
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
      webPubSubService.syncAllUsersWithDatabase.mockResolvedValue({ corrected: 0, warnings: [], errors: [] } as any);
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'disconnected', { phase: 'disconnected' });
      const result = await service.handleDisconnection(request);
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