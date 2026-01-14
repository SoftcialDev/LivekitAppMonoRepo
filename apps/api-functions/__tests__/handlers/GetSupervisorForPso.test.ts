import { Context, HttpRequest } from '@azure/functions';
import { GetSupervisorForPsoApplicationService } from '../../src/application/services/GetSupervisorForPsoApplicationService';
import { GetSupervisorForPsoRequest } from '../../src/domain/value-objects/GetSupervisorForPsoRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetSupervisorForPso handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetSupervisorForPsoApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        identifier: 'pso@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: {
        identifier: 'pso@example.com',
      },
    };

    mockApplicationService = {
      getSupervisorForPso: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully get supervisor for pso', async () => {
    const mockResponse = {
      supervisor: {
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
      },
      toPayload: jest.fn().mockReturnValue({
        supervisor: {
          id: 'supervisor-id',
          email: 'supervisor@example.com',
          fullName: 'Supervisor Name',
        },
      }),
    };

    mockApplicationService.getSupervisorForPso.mockResolvedValue(mockResponse as any);

    const getSupervisorForPsoHandler = (await import('../../src/handlers/GetSupervisorForPso')).default;
    await getSupervisorForPsoHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetSupervisorForPsoApplicationService');
    expect(mockApplicationService.getSupervisorForPso).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetSupervisorForPsoRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return 400 when supervisor not found', async () => {
    const mockResponse = {
      supervisor: null,
      toPayload: jest.fn().mockReturnValue({
        error: 'Supervisor not found for PSO',
      }),
    };

    mockApplicationService.getSupervisorForPso.mockResolvedValue(mockResponse as any);

    const getSupervisorForPsoHandler = (await import('../../src/handlers/GetSupervisorForPso')).default;
    await getSupervisorForPsoHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body).toHaveProperty('error');
  });
});

