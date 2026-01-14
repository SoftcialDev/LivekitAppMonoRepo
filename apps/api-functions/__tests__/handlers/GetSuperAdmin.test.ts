import { Context, HttpRequest } from '@azure/functions';
import { SuperAdminApplicationService } from '../../src/application/services/SuperAdminApplicationService';
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

describe('GetSuperAdmin handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<SuperAdminApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
    });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      createSuperAdmin: jest.fn(),
      deleteSuperAdmin: jest.fn(),
      listSuperAdmins: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully get all super admins', async () => {
    const mockResponse = {
      superAdmins: [
        {
          id: 'super-admin-1',
          userId: 'user-1',
          email: 'admin1@example.com',
        },
        {
          id: 'super-admin-2',
          userId: 'user-2',
          email: 'admin2@example.com',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        superAdmins: [
          {
            id: 'super-admin-1',
            userId: 'user-1',
            email: 'admin1@example.com',
          },
          {
            id: 'super-admin-2',
            userId: 'user-2',
            email: 'admin2@example.com',
          },
        ],
      }),
    };

    mockApplicationService.listSuperAdmins.mockResolvedValue(mockResponse as any);

    const getSuperAdminHandler = (await import('../../src/handlers/GetSuperAdmin')).default;
    await getSuperAdminHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('SuperAdminApplicationService');
    expect(mockApplicationService.listSuperAdmins).toHaveBeenCalledWith('test-azure-ad-id');
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle empty super admin list', async () => {
    const mockResponse = {
      superAdmins: [],
      toPayload: jest.fn().mockReturnValue({
        superAdmins: [],
      }),
    };

    mockApplicationService.listSuperAdmins.mockResolvedValue(mockResponse as any);

    const getSuperAdminHandler = (await import('../../src/handlers/GetSuperAdmin')).default;
    await getSuperAdminHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.superAdmins).toEqual([]);
  });
});

