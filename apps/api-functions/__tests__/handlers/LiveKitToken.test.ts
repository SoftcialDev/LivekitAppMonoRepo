import { Context, HttpRequest } from '@azure/functions';
import { LiveKitTokenApplicationService } from '../../src/application/services/LiveKitTokenApplicationService';
import { LiveKitTokenRequest } from '../../src/domain/value-objects/LiveKitTokenRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('LiveKitToken handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<LiveKitTokenApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {},
    });

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: {},
    };

    mockApplicationService = {
      generateToken: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'LiveKitTokenApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      return mockApplicationService;
    });
  });

  it('should successfully generate LiveKit token', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      role: 'PSO',
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      rooms: [
        {
          room: 'room-id',
          token: 'livekit-token',
        },
      ],
      livekitUrl: 'https://livekit.example.com',
      toPayload: jest.fn().mockReturnValue({
        rooms: [
          {
            room: 'room-id',
            token: 'livekit-token',
          },
        ],
        livekitUrl: 'https://livekit.example.com',
      }),
    };

    mockApplicationService.generateToken.mockResolvedValue(mockResponse as any);

    const liveKitTokenHandler = (await import('../../src/handlers/LiveKitToken')).default;
    await liveKitTokenHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('LiveKitTokenApplicationService');
    expect(mockApplicationService.generateToken).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(LiveKitTokenRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle userId query parameter', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      role: 'PSO',
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    mockRequest.query = {
      userId: 'user-id-123',
    };
    mockContext.bindings.validatedQuery = {
      userId: 'user-id-123',
    };

    const mockResponse = {
      rooms: [
        {
          room: 'room-id',
          token: 'livekit-token',
        },
      ],
      livekitUrl: 'https://livekit.example.com',
      toPayload: jest.fn().mockReturnValue({
        rooms: [
          {
            room: 'room-id',
            token: 'livekit-token',
          },
        ],
        livekitUrl: 'https://livekit.example.com',
      }),
    };

    mockApplicationService.generateToken.mockResolvedValue(mockResponse as any);

    const liveKitTokenHandler = (await import('../../src/handlers/LiveKitToken')).default;
    await liveKitTokenHandler(mockContext, mockRequest);

    expect(mockApplicationService.generateToken).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });

  it('should handle multiple rooms for admin', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      role: 'PSO',
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      rooms: [
        {
          room: 'room-1',
          token: 'token-1',
        },
        {
          room: 'room-2',
          token: 'token-2',
        },
      ],
      livekitUrl: 'https://livekit.example.com',
      toPayload: jest.fn().mockReturnValue({
        rooms: [
          {
            room: 'room-1',
            token: 'token-1',
          },
          {
            room: 'room-2',
            token: 'token-2',
          },
        ],
        livekitUrl: 'https://livekit.example.com',
      }),
    };

    mockApplicationService.generateToken.mockResolvedValue(mockResponse as any);

    const liveKitTokenHandler = (await import('../../src/handlers/LiveKitToken')).default;
    await liveKitTokenHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.rooms).toHaveLength(2);
  });
});

