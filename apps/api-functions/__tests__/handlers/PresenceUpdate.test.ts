import { Context, HttpRequest } from '@azure/functions';
import { PresenceUpdateApplicationService } from '../../src/application/services/PresenceUpdateApplicationService';
import { PresenceUpdateResponse } from '../../src/domain/value-objects/PresenceUpdateResponse';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/PresenceUpdateApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

describe('PresenceUpdate handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<PresenceUpdateApplicationService>;
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
      validatedBody: {
        status: 'online',
      },
    };

    mockApplicationService = {
      updatePresence: jest.fn(),
    } as any;

    (PresenceUpdateApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully update presence to online', async () => {
    const mockResponse = new PresenceUpdateResponse('Presence set to online');
    mockApplicationService.updatePresence.mockResolvedValue(mockResponse);

    const presenceUpdateHandler = (await import('../../src/handlers/PresenceUpdate')).default;
    await presenceUpdateHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('PresenceUpdateApplicationService');
    expect(mockApplicationService.updatePresence).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should successfully update presence to offline', async () => {
    mockContext.bindings.validatedBody = {
      status: 'offline',
    };

    const mockResponse = new PresenceUpdateResponse('Presence set to offline');
    mockApplicationService.updatePresence.mockResolvedValue(mockResponse);

    const presenceUpdateHandler = (await import('../../src/handlers/PresenceUpdate')).default;
    await presenceUpdateHandler(mockContext, mockRequest);

    expect(mockApplicationService.updatePresence).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });
});


