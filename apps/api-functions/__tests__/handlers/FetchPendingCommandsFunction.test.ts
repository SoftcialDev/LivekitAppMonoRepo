import { Context, HttpRequest } from '@azure/functions';
import { FetchPendingCommandsApplicationService } from '../../src/application/services/FetchPendingCommandsApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ...jest.requireActual('../../src/infrastructure/container/ServiceContainer'),
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('FetchPendingCommandsFunction handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<FetchPendingCommandsApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
    });

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      fetchPendingCommands: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully fetch pending command', async () => {
    const mockResponse = {
      pending: {
        id: 'command-id',
        commandType: 'START_CAMERA',
        createdAt: new Date(),
      },
      toPayload: jest.fn().mockReturnValue({
        pending: {
          id: 'command-id',
          commandType: 'START_CAMERA',
          createdAt: new Date(),
        },
      }),
    };

    mockApplicationService.fetchPendingCommands.mockResolvedValue(mockResponse as any);

    const fetchPendingCommandsHandler = (await import('../../src/handlers/FetchPendingCommandsFunction')).default;
    await fetchPendingCommandsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('FetchPendingCommandsApplicationService');
    expect(mockApplicationService.fetchPendingCommands).toHaveBeenCalledWith('test-azure-ad-id');
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return 204 when no pending commands', async () => {
    const mockResponse = {
      pending: null,
      toPayload: jest.fn().mockReturnValue({
        pending: null,
      }),
    };

    mockApplicationService.fetchPendingCommands.mockResolvedValue(mockResponse as any);

    const fetchPendingCommandsHandler = (await import('../../src/handlers/FetchPendingCommandsFunction')).default;
    await fetchPendingCommandsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(204);
  });
});

