import { Context, HttpRequest } from '@azure/functions';
import { SuperAdminApplicationService } from '../../src/application/services/SuperAdminApplicationService';
import { DeleteSuperAdminRequest } from '../../src/domain/value-objects/DeleteSuperAdminRequest';
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

describe('DeleteSuperAdmin handler', () => {
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
      method: 'DELETE',
    });

    mockContext.bindingData = {
      id: 'user-id-to-delete',
      invocationId: 'test-invocation-id',
    };

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

  it('should successfully delete super admin', async () => {
    mockApplicationService.deleteSuperAdmin.mockResolvedValue(undefined);

    const deleteSuperAdminHandler = (await import('../../src/handlers/DeleteSuperAdmin')).default;
    await deleteSuperAdminHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('SuperAdminApplicationService');
    expect(mockApplicationService.deleteSuperAdmin).toHaveBeenCalledWith(
      expect.any(DeleteSuperAdminRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({ message: 'Super Admin role removed successfully' });
  });

  it('should return 400 when user ID validation fails', async () => {
    mockContext.bindingData = {
      id: '',
      invocationId: 'test-invocation-id',
    };

    const deleteSuperAdminHandler = (await import('../../src/handlers/DeleteSuperAdmin')).default;
    await deleteSuperAdminHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body).toEqual({ error: 'Invalid user ID format' });
    expect(mockApplicationService.deleteSuperAdmin).not.toHaveBeenCalled();
  });
});

