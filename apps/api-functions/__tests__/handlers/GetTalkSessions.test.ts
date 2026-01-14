import { Context, HttpRequest } from '@azure/functions';
import { GetTalkSessionsApplicationService } from '../../src/application/services/GetTalkSessionsApplicationService';
import { GetTalkSessionsRequest } from '../../src/domain/value-objects/GetTalkSessionsRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetTalkSessions handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetTalkSessionsApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        page: '1',
        limit: '10',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getTalkSessions: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'GetTalkSessionsApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      return mockApplicationService;
    });
  });

  it('should successfully get talk sessions', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      sessions: [
        {
          id: 'session-1',
          psoId: 'pso-1',
          supervisorId: 'supervisor-1',
          startedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      toPayload: jest.fn().mockReturnValue({
        sessions: [
          {
            id: 'session-1',
            psoId: 'pso-1',
            supervisorId: 'supervisor-1',
            startedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      }),
    };

    mockApplicationService.getTalkSessions.mockResolvedValue(mockResponse as any);

    const getTalkSessionsHandler = (await import('../../src/handlers/GetTalkSessions')).default;
    await getTalkSessionsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetTalkSessionsApplicationService');
    expect(mockApplicationService.getTalkSessions).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetTalkSessionsRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return 400 when query parameters are invalid', async () => {
    mockRequest.query = {
      page: 'invalid',
    };

    const getTalkSessionsHandler = (await import('../../src/handlers/GetTalkSessions')).default;
    await getTalkSessionsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body).toHaveProperty('message');
    expect(mockContext.res?.body).toHaveProperty('errors');
  });

  it('should handle empty sessions list', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      sessions: [],
      total: 0,
      page: 1,
      limit: 10,
      toPayload: jest.fn().mockReturnValue({
        sessions: [],
        total: 0,
        page: 1,
        limit: 10,
      }),
    };

    mockApplicationService.getTalkSessions.mockResolvedValue(mockResponse as any);

    const getTalkSessionsHandler = (await import('../../src/handlers/GetTalkSessions')).default;
    await getTalkSessionsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.sessions).toEqual([]);
  });
});

