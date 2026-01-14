import { ContactManagerDisconnectApplicationService } from '../../../src/application/services/ContactManagerDisconnectApplicationService';
import { ContactManagerDisconnectDomainService } from '../../../src/domain/services/ContactManagerDisconnectDomainService';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { WebSocketEventRequest } from '../../../src/domain/value-objects/WebSocketEventRequest';
import { WebSocketEventResponse } from '../../../src/domain/value-objects/WebSocketEventResponse';

describe('ContactManagerDisconnectApplicationService', () => {
  let service: ContactManagerDisconnectApplicationService;
  let mockDomainService: jest.Mocked<ContactManagerDisconnectDomainService>;
  let mockPresenceService: jest.Mocked<PresenceDomainService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockDomainService = {
      handleContactManagerDisconnect: jest.fn(),
    } as any;

    mockPresenceService = {
      setUserOnline: jest.fn(),
      setUserOffline: jest.fn(),
    } as any;

    mockWebPubSubService = {
      broadcastToUser: jest.fn(),
    } as any;

    service = new ContactManagerDisconnectApplicationService(
      mockDomainService,
      mockPresenceService,
      mockWebPubSubService
    );
  });

  it('should successfully handle contact manager disconnect', async () => {
    const request = new WebSocketEventRequest(
      'user-123',
      'conn-123',
      'test-hub',
      'disconnected',
      {}
    );
    const mockResponse = WebSocketEventResponse.success('Disconnected');

    mockDomainService.handleContactManagerDisconnect.mockResolvedValue(mockResponse);

    const result = await service.handleContactManagerDisconnect(request);

    expect(mockDomainService.handleContactManagerDisconnect).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

