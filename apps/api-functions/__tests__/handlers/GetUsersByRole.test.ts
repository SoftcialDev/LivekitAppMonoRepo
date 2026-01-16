import { Context, HttpRequest } from '@azure/functions';
import { UserQueryApplicationService } from '../../src/application/services/UserQueryApplicationService';
import { UserQueryRequest } from '../../src/domain/value-objects/UserQueryRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../src/domain/interfaces/IAuthorizationService';
import { IUserQueryService } from '../../src/domain/interfaces/IUserQueryService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/application/services/UserQueryApplicationService');
jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('GetUsersByRole handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<UserQueryApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockUserQueryService: jest.Mocked<IUserQueryService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        role: 'PSO',
        page: '1',
        pageSize: '10',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: mockRequest.query,
    };

    mockUserRepository = {} as any;
    mockAuthorizationService = {} as any;
    mockUserQueryService = {} as any;

    mockApplicationService = {
      getUsersByRole: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;

    mockResolve
      .mockReturnValueOnce(mockUserRepository)
      .mockReturnValueOnce(mockAuthorizationService)
      .mockReturnValueOnce(mockUserQueryService);

    (UserQueryApplicationService as jest.MockedClass<typeof UserQueryApplicationService>).mockImplementation(() => mockApplicationService as any);
  });

  it('should successfully get users by role', async () => {
    const mockResult = {
      users: [
        {
          id: 'user-1',
          email: 'pso1@example.com',
          name: 'PSO 1',
          role: 'PSO',
        },
        {
          id: 'user-2',
          email: 'pso2@example.com',
          name: 'PSO 2',
          role: 'PSO',
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      toPayload: jest.fn().mockReturnValue({
        users: [
          {
            id: 'user-1',
            email: 'pso1@example.com',
            name: 'PSO 1',
            role: 'PSO',
          },
          {
            id: 'user-2',
            email: 'pso2@example.com',
            name: 'PSO 2',
            role: 'PSO',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      }),
    };

    mockApplicationService.getUsersByRole.mockResolvedValue(mockResult as any);

    const getUsersByRole = (await import('../../src/handlers/GetUsersByRole')).default;
    await getUsersByRole(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockApplicationService.getUsersByRole).toHaveBeenCalledWith(
      expect.any(UserQueryRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResult.toPayload());
  });
});



