import { Context, HttpRequest } from '@azure/functions';
import { ContactManagerApplicationService } from '../../src/application/services/ContactManagerApplicationService';
import { UpdateContactManagerStatusRequest } from '../../src/domain/value-objects/UpdateContactManagerStatusRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('UpdateContactManagerStatus handler', () => {
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
        status: 'Available',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['ContactManager'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: mockRequest.body,
    };

    mockApplicationService = {
      updateMyContactManagerStatus: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;

    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully update contact manager status', async () => {
    const mockResponse = {
      id: 'cm-id-123',
      userId: 'user-id-123',
      email: 'contactmanager@example.com',
      status: 'Available',
      toPayload: jest.fn().mockReturnValue({
        id: 'cm-id-123',
        userId: 'user-id-123',
        email: 'contactmanager@example.com',
        status: 'Available',
      }),
    };

    mockApplicationService.updateMyContactManagerStatus.mockResolvedValue(mockResponse as any);

    const updateMyStatusFunction = (await import('../../src/handlers/UpdateContactManagerStatus')).default;
    await updateMyStatusFunction(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('ContactManagerApplicationService');
    expect(mockApplicationService.updateMyContactManagerStatus).toHaveBeenCalledWith(
      expect.any(UpdateContactManagerStatusRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

