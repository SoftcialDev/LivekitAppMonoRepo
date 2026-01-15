import { Context, HttpRequest } from '@azure/functions';
import { FetchStreamingSessionsApplicationService } from '../../src/application/services/FetchStreamingSessionsApplicationService';
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

describe('FetchStreamingSessions handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<FetchStreamingSessionsApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      fetchStreamingSessions: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully fetch streaming sessions', async () => {
    const mockResponse = {
      sessions: [
        {
          id: 'session-1',
          userId: 'user-1',
          status: 'active',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        sessions: [
          {
            id: 'session-1',
            userId: 'user-1',
            status: 'active',
          },
        ],
      }),
    };

    mockApplicationService.fetchStreamingSessions.mockResolvedValue(mockResponse as any);

    const fetchStreamingSessionsHandler = (await import('../../src/handlers/FetchStreamingSessions')).default;
    await fetchStreamingSessionsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('FetchStreamingSessionsApplicationService');
    expect(mockApplicationService.fetchStreamingSessions).toHaveBeenCalledWith('test-azure-ad-id');
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle empty sessions list', async () => {
    const mockResponse = {
      sessions: [],
      toPayload: jest.fn().mockReturnValue({
        sessions: [],
      }),
    };

    mockApplicationService.fetchStreamingSessions.mockResolvedValue(mockResponse as any);

    const fetchStreamingSessionsHandler = (await import('../../src/handlers/FetchStreamingSessions')).default;
    await fetchStreamingSessionsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.sessions).toEqual([]);
  });
});


