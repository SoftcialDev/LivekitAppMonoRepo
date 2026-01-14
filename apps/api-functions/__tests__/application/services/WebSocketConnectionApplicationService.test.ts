import { WebSocketConnectionApplicationService } from '../../../src/application/services/WebSocketConnectionApplicationService';
import { WebSocketConnectionDomainService } from '../../../src/domain/services/WebSocketConnectionDomainService';
import { WebSocketEventRequest } from '../../../src/domain/value-objects/WebSocketEventRequest';
import { WebSocketEventResponse } from '../../../src/domain/value-objects/WebSocketEventResponse';
import { Context } from '@azure/functions';

describe('WebSocketConnectionApplicationService', () => {
  let service: WebSocketConnectionApplicationService;
  let mockDomainService: jest.Mocked<WebSocketConnectionDomainService>;

  beforeEach(() => {
    mockDomainService = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn(),
    } as any;

    service = new WebSocketConnectionApplicationService(mockDomainService);
  });

  it('should successfully handle connection', async () => {
    const request = new WebSocketEventRequest(
      'user-123',
      'conn-123',
      'test-hub',
      'connect',
      {}
    );
    const mockResponse = WebSocketEventResponse.success('Connected');

    mockDomainService.handleConnection.mockResolvedValue(mockResponse);

    const result = await service.handleConnection(request);

    expect(mockDomainService.handleConnection).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should successfully handle disconnection', async () => {
    const request = new WebSocketEventRequest(
      'user-123',
      'conn-123',
      'test-hub',
      'disconnected',
      {}
    );
    const mockContext = {
      log: { info: jest.fn() },
    } as unknown as Context;
    const mockResponse = WebSocketEventResponse.success('Disconnected');

    mockDomainService.handleDisconnection.mockResolvedValue(mockResponse);

    const result = await service.handleDisconnection(request, mockContext);

    expect(mockDomainService.handleDisconnection).toHaveBeenCalledWith(request, mockContext);
    expect(result).toBe(mockResponse);
  });

  it('should handle disconnection without context', async () => {
    const request = new WebSocketEventRequest(
      'user-123',
      'conn-123',
      'test-hub',
      'disconnected',
      {}
    );
    const mockResponse = WebSocketEventResponse.success('Disconnected');

    mockDomainService.handleDisconnection.mockResolvedValue(mockResponse);

    const result = await service.handleDisconnection(request);

    expect(mockDomainService.handleDisconnection).toHaveBeenCalledWith(request, undefined);
    expect(result).toBe(mockResponse);
  });
});

