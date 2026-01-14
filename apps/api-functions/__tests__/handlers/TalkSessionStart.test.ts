import { Context, HttpRequest } from '@azure/functions';
import { TalkSessionApplicationService } from '../../src/application/services/TalkSessionApplicationService';
import { TalkSessionStartRequest } from '../../src/domain/value-objects/TalkSessionStartRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { ITalkSessionRepository } from '../../src/domain/interfaces/ITalkSessionRepository';
import { IWebPubSubService } from '../../src/domain/interfaces/IWebPubSubService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('TalkSessionStart handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<TalkSessionApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'POST',
      body: {
        psoEmail: 'pso@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        psoEmail: 'pso@example.com',
      },
    };

    mockApplicationService = {
      startTalkSession: jest.fn(),
      stopTalkSession: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
      findByEmail: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const mockTalkSessionRepository = {
      getActiveTalkSessionsForPso: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    } as any;

    const mockWebPubSubService = {
      broadcastToUser: jest.fn(),
    } as any;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'TalkSessionApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      if (serviceName === 'TalkSessionRepository') {
        return mockTalkSessionRepository;
      }
      if (serviceName === 'WebPubSubService') {
        return mockWebPubSubService;
      }
      if (serviceName === 'TalkSessionDomainService') {
        const { TalkSessionDomainService } = require('../../src/domain/services/TalkSessionDomainService');
        return new TalkSessionDomainService(mockTalkSessionRepository, mockUserRepository, mockWebPubSubService);
      }
      return mockApplicationService;
    });
  });

  it('should successfully start talk session', async () => {
    const mockSupervisor = {
      id: 'supervisor-id',
      azureAdObjectId: 'test-azure-ad-id',
      email: 'supervisor@example.com',
      fullName: 'Supervisor Name',
    };

    const mockPso = {
      id: 'pso-id',
      email: 'pso@example.com',
      fullName: 'PSO Name',
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockSupervisor as any);
    mockUserRepository.findByEmail.mockResolvedValue(mockPso as any);

    const mockResponse = {
      sessionId: 'session-id-123',
      psoEmail: 'pso@example.com',
      supervisorId: 'supervisor-id',
      startedAt: new Date(),
      toPayload: jest.fn().mockReturnValue({
        sessionId: 'session-id-123',
        psoEmail: 'pso@example.com',
        supervisorId: 'supervisor-id',
        startedAt: new Date(),
      }),
    };

    mockApplicationService.startTalkSession.mockResolvedValue(mockResponse as any);

    const talkSessionStartHandler = (await import('../../src/handlers/TalkSessionStart')).default;
    await talkSessionStartHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('TalkSessionApplicationService');
    expect(mockApplicationService.startTalkSession).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(TalkSessionStartRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

