import { Context, HttpRequest } from '@azure/functions';
import { ContactManagerApplicationService } from '../../src/application/services/ContactManagerApplicationService';
import { DeleteContactManagerRequest } from '../../src/domain/value-objects/DeleteContactManagerRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('DeleteContactManager handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<ContactManagerApplicationService>;
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
      invocationId: 'test-invocation-id',
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      deleteContactManager: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;

    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully delete contact manager', async () => {
    mockApplicationService.deleteContactManager.mockResolvedValue(undefined);

    const removeHandler = (await import('../../src/handlers/DeleteContactManager')).default;
    await removeHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('ContactManagerApplicationService');
    expect(mockApplicationService.deleteContactManager).toHaveBeenCalledWith(
      expect.any(DeleteContactManagerRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      message: 'Contact Manager deleted successfully',
    });
  });
});

