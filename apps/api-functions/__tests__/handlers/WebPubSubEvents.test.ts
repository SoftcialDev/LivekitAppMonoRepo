import { Context, HttpRequest } from '@azure/functions';
import { WebSocketConnectionApplicationService } from '../../src/application/services/WebSocketConnectionApplicationService';
import { ContactManagerDisconnectApplicationService } from '../../src/application/services/ContactManagerDisconnectApplicationService';
import { WebSocketEventResponse } from '../../src/domain/value-objects/WebSocketEventResponse';
import { createMockContext, createMockHttpRequest } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/WebSocketConnectionApplicationService');
jest.mock('../../src/application/services/ContactManagerDisconnectApplicationService');
jest.mock('../../src/utils/webPubSubErrorLogger');
jest.mock('../../src/utils/webPubSubEventLogger');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

describe('WebPubSubEvents handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockConnectionService: jest.Mocked<WebSocketConnectionApplicationService>;
  let mockDisconnectService: jest.Mocked<ContactManagerDisconnectApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });
    mockContext.bindingData = {
      invocationId: 'test-invocation-id',
      webPubSubContext: {
        hub: 'test-hub',
        connectionId: 'conn-123',
        userId: 'user-123',
        eventName: 'connect',
      },
    };

    mockConnectionService = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn(),
    } as any;

    mockDisconnectService = {
      handleContactManagerDisconnect: jest.fn(),
    } as any;

    (WebSocketConnectionApplicationService as jest.Mock).mockImplementation(() => mockConnectionService);
    (ContactManagerDisconnectApplicationService as jest.Mock).mockImplementation(() => mockDisconnectService);

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer();
    mockResolve = resolve;
    mockInitialize = initialize;
    mockResolve.mockImplementation((name: string) => {
      if (name === 'WebSocketConnectionApplicationService') {
        return mockConnectionService;
      }
      if (name === 'ContactManagerDisconnectApplicationService') {
        return mockDisconnectService;
      }
      return {};
    });

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should handle OPTIONS request', async () => {
    mockRequest.method = 'OPTIONS';

    const webPubSubEventsHandler = (await import('../../src/handlers/WebPubSubEvents')).default;
    await webPubSubEventsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.headers?.['WebHook-Allowed-Origin']).toBe('*');
  });

  it('should return 405 for non-POST requests', async () => {
    mockRequest.method = 'GET';

    const webPubSubEventsHandler = (await import('../../src/handlers/WebPubSubEvents')).default;
    await webPubSubEventsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(405);
  });

  it('should handle connect event', async () => {
    mockRequest.headers = {
      'ce-eventname': 'connect',
    };
    mockConnectionService.handleConnection.mockResolvedValue(WebSocketEventResponse.success('Connected'));

    const webPubSubEventsHandler = (await import('../../src/handlers/WebPubSubEvents')).default;
    await webPubSubEventsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('WebSocketConnectionApplicationService');
    expect(mockConnectionService.handleConnection).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });

  it('should handle disconnected event', async () => {
    mockRequest.headers = {
      'ce-eventname': 'disconnected',
    };
    mockContext.bindingData.webPubSubContext = {
      hub: 'test-hub',
      connectionId: 'conn-123',
      userId: 'user-123',
      eventName: 'disconnected',
    };
    mockConnectionService.handleDisconnection.mockResolvedValue(WebSocketEventResponse.success('Disconnected'));
    mockDisconnectService.handleContactManagerDisconnect.mockResolvedValue(WebSocketEventResponse.success('CM disconnected'));

    const webPubSubEventsHandler = (await import('../../src/handlers/WebPubSubEvents')).default;
    await webPubSubEventsHandler(mockContext, mockRequest);

    expect(mockConnectionService.handleDisconnection).toHaveBeenCalled();
    expect(mockDisconnectService.handleContactManagerDisconnect).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });

  it('should return 400 for unknown event name', async () => {
    mockRequest.headers = {};
    mockContext.bindingData = {
      invocationId: 'test-invocation-id',
    };

    const webPubSubEventsHandler = (await import('../../src/handlers/WebPubSubEvents')).default;
    await webPubSubEventsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body.error).toBe('Unknown event name');
  });
});

