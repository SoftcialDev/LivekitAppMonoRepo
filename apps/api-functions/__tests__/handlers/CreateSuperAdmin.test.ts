import { Context, HttpRequest } from '@azure/functions';
import { SuperAdminApplicationService } from '../../src/application/services/SuperAdminApplicationService';
import { CreateSuperAdminRequest } from '../../src/domain/value-objects/CreateSuperAdminRequest';
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

describe('CreateSuperAdmin handler', () => {
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
      method: 'POST',
      body: {
        email: 'newadmin@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        email: 'newadmin@example.com',
      },
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

  it('should successfully create super admin', async () => {
    const mockSuperAdmin = {
      id: 'super-admin-id',
      userId: 'user-id',
      email: 'newadmin@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      toPayload: jest.fn().mockReturnValue({
        id: 'super-admin-id',
        userId: 'user-id',
        email: 'newadmin@example.com',
      }),
    };

    mockApplicationService.createSuperAdmin.mockResolvedValue(mockSuperAdmin as any);

    const createSuperAdminHandler = (await import('../../src/handlers/CreateSuperAdmin')).default;
    await createSuperAdminHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('SuperAdminApplicationService');
    expect(mockApplicationService.createSuperAdmin).toHaveBeenCalledWith(
      expect.any(CreateSuperAdminRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockSuperAdmin.toPayload());
  });
});

