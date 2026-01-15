import { Context, HttpRequest } from '@azure/functions';
import { ContactManagerApplicationService } from '../../src/application/services/ContactManagerApplicationService';
import { CreateContactManagerRequest } from '../../src/domain/value-objects/CreateContactManagerRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('CreateContactManager handler', () => {
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
      method: 'POST',
      body: {
        email: 'contactmanager@example.com',
        status: 'Active',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: mockRequest.body,
    };

    mockApplicationService = {
      createContactManager: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;

    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully create contact manager', async () => {
    const mockResponse = {
      id: 'cm-id-123',
      userId: 'user-id-123',
      email: 'contactmanager@example.com',
      status: 'Active',
      toPayload: jest.fn().mockReturnValue({
        id: 'cm-id-123',
        userId: 'user-id-123',
        email: 'contactmanager@example.com',
        status: 'Active',
      }),
    };

    mockApplicationService.createContactManager.mockResolvedValue(mockResponse as any);

    const create = (await import('../../src/handlers/CreateContactManager')).default;
    await create(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('ContactManagerApplicationService');
    expect(mockApplicationService.createContactManager).toHaveBeenCalledWith(
      expect.any(CreateContactManagerRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});


