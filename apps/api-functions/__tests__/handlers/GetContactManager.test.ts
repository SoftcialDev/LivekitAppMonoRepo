import { Context, HttpRequest } from '@azure/functions';
import { ContactManagerApplicationService } from '../../src/application/services/ContactManagerApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('GetContactManager handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<ContactManagerApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'GET' });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      listContactManagers: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;

    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully get contact managers', async () => {
    const mockResponse = {
      contactManagers: [
        {
          id: 'cm-1',
          email: 'cm1@example.com',
          name: 'Contact Manager 1',
          status: 'ACTIVE',
        },
        {
          id: 'cm-2',
          email: 'cm2@example.com',
          name: 'Contact Manager 2',
          status: 'INACTIVE',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        contactManagers: [
          {
            id: 'cm-1',
            email: 'cm1@example.com',
            name: 'Contact Manager 1',
            status: 'ACTIVE',
          },
          {
            id: 'cm-2',
            email: 'cm2@example.com',
            name: 'Contact Manager 2',
            status: 'INACTIVE',
          },
        ],
      }),
    };

    mockApplicationService.listContactManagers.mockResolvedValue(mockResponse as any);

    const getAll = (await import('../../src/handlers/GetContactManager')).default;
    await getAll(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('ContactManagerApplicationService');
    expect(mockApplicationService.listContactManagers).toHaveBeenCalledWith('test-azure-ad-id');
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});


