import { Context, HttpRequest } from '@azure/functions';
import { StreamingSessionUpdateApplicationService } from '../../src/application/services/StreamingSessionUpdateApplicationService';
import { StreamingSessionUpdateRequest } from '../../src/domain/value-objects/StreamingSessionUpdateRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('StreamingSessionUpdate handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<StreamingSessionUpdateApplicationService>;
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
        status: 'started',
        isCommand: false,
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        status: 'started',
        isCommand: false,
      },
    };

    mockApplicationService = {
      updateStreamingSession: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const mockStreamingSessionDomainService = {
      startStreamingSession: jest.fn(),
      stopStreamingSession: jest.fn(),
    } as any;

    const mockWebPubSubService = {
      broadcastToUser: jest.fn(),
    } as any;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'StreamingSessionUpdateApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      if (serviceName === 'StreamingSessionDomainService') {
        return mockStreamingSessionDomainService;
      }
      if (serviceName === 'WebPubSubService') {
        return mockWebPubSubService;
      }
      if (serviceName === 'StreamingSessionUpdateDomainService') {
        const { StreamingSessionUpdateDomainService } = require('../../src/domain/services/StreamingSessionUpdateDomainService');
        return new StreamingSessionUpdateDomainService(mockStreamingSessionDomainService, mockUserRepository, mockWebPubSubService);
      }
      return mockApplicationService;
    });
  });

  it('should successfully update streaming session to started', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      email: 'pso@example.com',
    };

    // Ensure the mock is set up before creating the service
    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      sessionId: 'session-id',
      status: 'started',
      toPayload: jest.fn().mockReturnValue({
        sessionId: 'session-id',
        status: 'started',
      }),
    };

    // Mock the application service to avoid calling the domain service directly
    mockApplicationService.updateStreamingSession.mockImplementation(async (callerId: string, request: any) => {
      // Simulate the domain service call
      const user = await mockUserRepository.findByAzureAdObjectId(callerId);
      if (!user) {
        throw new Error('User not found');
      }
      return mockResponse as any;
    });

    const streamingSessionUpdateHandler = (await import('../../src/handlers/StreamingSessionUpdate')).default;
    await streamingSessionUpdateHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('StreamingSessionUpdateApplicationService');
    expect(mockApplicationService.updateStreamingSession).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(StreamingSessionUpdateRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should successfully update streaming session to stopped', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      email: 'pso@example.com',
    };

    // Ensure the mock is set up before creating the service
    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    mockRequest.body = {
      status: 'stopped',
    };
    mockContext.bindings.validatedBody = {
      status: 'stopped',
    };

    const mockResponse = {
      sessionId: 'session-id',
      status: 'stopped',
      toPayload: jest.fn().mockReturnValue({
        sessionId: 'session-id',
        status: 'stopped',
      }),
    };

    // Mock the application service to avoid calling the domain service directly
    mockApplicationService.updateStreamingSession.mockImplementation(async (callerId: string, request: any) => {
      // Simulate the domain service call
      const user = await mockUserRepository.findByAzureAdObjectId(callerId);
      if (!user) {
        throw new Error('User not found');
      }
      return mockResponse as any;
    });

    const streamingSessionUpdateHandler = (await import('../../src/handlers/StreamingSessionUpdate')).default;
    await streamingSessionUpdateHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.status).toBe('stopped');
  });
});

