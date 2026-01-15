import { Context, HttpRequest } from '@azure/functions';
import { GetUserDebugApplicationService } from '../../src/application/services/GetUserDebugApplicationService';
import { GetUserDebugRequest } from '../../src/domain/value-objects/GetUserDebugRequest';
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

describe('GetUserDebug handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetUserDebugApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        userIdentifier: 'user@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: {
        userIdentifier: 'user@example.com',
      },
    };

    mockApplicationService = {
      getUserDebug: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully get user debug information', async () => {
    const mockResponse = {
      user: {
        id: 'user-id',
        email: 'user@example.com',
        fullName: 'Test User',
        role: 'PSO',
      },
      roles: [],
      permissions: [],
      contactManagerProfile: null,
      supervisor: null,
      toPayload: jest.fn().mockReturnValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          fullName: 'Test User',
          role: 'PSO',
        },
        roles: [],
        permissions: [],
        contactManagerProfile: null,
        supervisor: null,
      }),
    };

    mockApplicationService.getUserDebug.mockResolvedValue(mockResponse as any);

    const getUserDebugHandler = (await import('../../src/handlers/GetUserDebug')).default;
    await getUserDebugHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetUserDebugApplicationService');
    expect(mockApplicationService.getUserDebug).toHaveBeenCalledWith(
      expect.any(GetUserDebugRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle user with contact manager profile', async () => {
    const mockResponse = {
      user: {
        id: 'user-id',
        email: 'user@example.com',
        role: 'ContactManager',
      },
      roles: [],
      permissions: [],
      contactManagerProfile: {
        id: 'profile-id',
        status: 'Available',
      },
      supervisor: null,
      toPayload: jest.fn().mockReturnValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'ContactManager',
        },
        roles: [],
        permissions: [],
        contactManagerProfile: {
          id: 'profile-id',
          status: 'Available',
        },
        supervisor: null,
      }),
    };

    mockApplicationService.getUserDebug.mockResolvedValue(mockResponse as any);

    const getUserDebugHandler = (await import('../../src/handlers/GetUserDebug')).default;
    await getUserDebugHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.contactManagerProfile).toBeDefined();
  });
});


