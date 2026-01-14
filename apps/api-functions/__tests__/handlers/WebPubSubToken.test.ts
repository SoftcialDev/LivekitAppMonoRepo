import { Context, HttpRequest } from '@azure/functions';
import { WebPubSubTokenApplicationService } from '../../src/application/services/WebPubSubTokenApplicationService';
import { WebPubSubTokenResponse } from '../../src/domain/value-objects/WebPubSubTokenResponse';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/WebPubSubTokenApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

describe('WebPubSubToken handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<WebPubSubTokenApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      generateToken: jest.fn(),
    } as any;

    (WebPubSubTokenApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully generate WebPubSub token', async () => {
    const mockResponse = new WebPubSubTokenResponse(
      'test-token',
      'https://test.webpubsub.azure.com',
      'test-hub',
      ['presence', 'test@example.com']
    );
    mockApplicationService.generateToken.mockResolvedValue(mockResponse);

    const webPubSubTokenHandler = (await import('../../src/handlers/WebPubSubToken')).default;
    await webPubSubTokenHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('WebPubSubTokenApplicationService');
    expect(mockApplicationService.generateToken).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

