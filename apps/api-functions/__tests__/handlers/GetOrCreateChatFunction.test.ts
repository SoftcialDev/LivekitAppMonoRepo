import { Context, HttpRequest } from '@azure/functions';
import { GetOrCreateChatApplicationService } from '../../src/application/services/GetOrCreateChatApplicationService';
import { GetOrCreateChatRequest } from '../../src/domain/value-objects/GetOrCreateChatRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetOrCreateChatFunction handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetOrCreateChatApplicationService>;
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
      headers: {
        authorization: 'Bearer test-token',
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
      getOrCreateChat: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'GetOrCreateChatApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      return mockApplicationService;
    });
  });

  it('should successfully get or create chat', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      chatId: 'chat-id-123',
      toPayload: jest.fn().mockReturnValue({
        chatId: 'chat-id-123',
      }),
    };

    mockApplicationService.getOrCreateChat.mockResolvedValue(mockResponse as any);

    const getOrCreateChatHandler = (await import('../../src/handlers/GetOrCreateChatFunction')).default;
    await getOrCreateChatHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetOrCreateChatApplicationService');
    expect(mockApplicationService.getOrCreateChat).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetOrCreateChatRequest),
      'test-token'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

