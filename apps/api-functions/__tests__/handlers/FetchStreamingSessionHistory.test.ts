import { Context, HttpRequest } from '@azure/functions';
import { FetchStreamingSessionHistoryApplicationService } from '../../src/application/services/FetchStreamingSessionHistoryApplicationService';
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

describe('FetchStreamingSessionHistory handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<FetchStreamingSessionHistoryApplicationService>;
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
      fetchStreamingSessionHistory: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully fetch streaming session history', async () => {
    const mockResponse = {
      session: {
        id: 'session-1',
        userId: 'user-1',
        startedAt: new Date(),
        stoppedAt: null,
      },
      toPayload: jest.fn().mockReturnValue({
        session: {
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date(),
          stoppedAt: null,
        },
      }),
    };

    mockApplicationService.fetchStreamingSessionHistory.mockResolvedValue(mockResponse as any);

    const fetchStreamingSessionHistoryHandler = (await import('../../src/handlers/FetchStreamingSessionHistory')).default;
    await fetchStreamingSessionHistoryHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('FetchStreamingSessionHistoryApplicationService');
    expect(mockApplicationService.fetchStreamingSessionHistory).toHaveBeenCalledWith('test-azure-ad-id');
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return 204 when no session history', async () => {
    const mockResponse = {
      session: null,
      toPayload: jest.fn().mockReturnValue({
        session: null,
      }),
    };

    mockApplicationService.fetchStreamingSessionHistory.mockResolvedValue(mockResponse as any);

    const fetchStreamingSessionHistoryHandler = (await import('../../src/handlers/FetchStreamingSessionHistory')).default;
    await fetchStreamingSessionHistoryHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(204);
  });
});



