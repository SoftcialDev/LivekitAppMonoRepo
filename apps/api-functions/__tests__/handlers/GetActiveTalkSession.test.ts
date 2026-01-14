import { Context, HttpRequest } from '@azure/functions';
import { GetActiveTalkSessionApplicationService } from '../../src/application/services/GetActiveTalkSessionApplicationService';
import { GetActiveTalkSessionRequest } from '../../src/domain/value-objects/GetActiveTalkSessionRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { ITalkSessionRepository } from '../../src/domain/interfaces/ITalkSessionRepository';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetActiveTalkSession handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetActiveTalkSessionApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockTalkSessionRepository: jest.Mocked<ITalkSessionRepository>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        psoEmail: 'pso@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getActiveTalkSession: jest.fn(),
    } as any;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockTalkSessionRepository = {
      getActiveTalkSessionsForPso: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'GetActiveTalkSessionApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      if (serviceName === 'TalkSessionRepository') {
        return mockTalkSessionRepository;
      }
      if (serviceName === 'GetActiveTalkSessionDomainService') {
        const { GetActiveTalkSessionDomainService } = require('../../src/domain/services/GetActiveTalkSessionDomainService');
        return new GetActiveTalkSessionDomainService(mockTalkSessionRepository, mockUserRepository);
      }
      return mockApplicationService;
    });
  });

  it('should successfully get active talk session', async () => {
    const mockPso = {
      id: 'pso-id',
      email: 'pso@example.com',
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockPso as any);

    const mockResponse = {
      active: true,
      session: {
        id: 'session-id',
        psoId: 'pso-id',
        supervisorId: 'supervisor-id',
        startedAt: new Date(),
      },
      toPayload: jest.fn().mockReturnValue({
        active: true,
        session: {
          id: 'session-id',
          psoId: 'pso-id',
          supervisorId: 'supervisor-id',
          startedAt: new Date(),
        },
      }),
    };

    mockApplicationService.getActiveTalkSession.mockResolvedValue(mockResponse as any);

    const getActiveTalkSessionHandler = (await import('../../src/handlers/GetActiveTalkSession')).default;
    await getActiveTalkSessionHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetActiveTalkSessionApplicationService');
    expect(mockApplicationService.getActiveTalkSession).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetActiveTalkSessionRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return 400 when query parameters are invalid', async () => {
    mockRequest.query = {};

    const getActiveTalkSessionHandler = (await import('../../src/handlers/GetActiveTalkSession')).default;
    await getActiveTalkSessionHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body).toHaveProperty('message');
    expect(mockContext.res?.body).toHaveProperty('errors');
  });

  it('should handle no active session', async () => {
    const mockPso = {
      id: 'pso-id',
      email: 'pso@example.com',
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockPso as any);

    const mockResponse = {
      active: false,
      session: null,
      toPayload: jest.fn().mockReturnValue({
        active: false,
        session: null,
      }),
    };

    mockApplicationService.getActiveTalkSession.mockResolvedValue(mockResponse as any);

    const getActiveTalkSessionHandler = (await import('../../src/handlers/GetActiveTalkSession')).default;
    await getActiveTalkSessionHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.active).toBe(false);
  });

  it('should handle undefined query parameter', async () => {
    (mockRequest as any).query = undefined;

    const getActiveTalkSessionHandler = (await import('../../src/handlers/GetActiveTalkSession')).default;
    await getActiveTalkSessionHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body).toHaveProperty('message');
    expect(mockContext.res?.body).toHaveProperty('errors');
  });
});

