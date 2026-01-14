import { Context, HttpRequest } from '@azure/functions';
import { GetPsosBySupervisorApplicationService } from '../../src/application/services/GetPsosBySupervisorApplicationService';
import { GetPsosBySupervisorRequest } from '../../src/domain/value-objects/GetPsosBySupervisorRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetPsosBySupervisor handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetPsosBySupervisorApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        supervisorId: 'supervisor-id-123',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: mockRequest.query,
    };

    mockApplicationService = {
      getPsosBySupervisor: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully get PSOs by supervisor', async () => {
    const mockResponse = {
      psos: [
        {
          id: 'pso-1',
          email: 'pso1@example.com',
          name: 'PSO 1',
          supervisorId: 'supervisor-id-123',
        },
        {
          id: 'pso-2',
          email: 'pso2@example.com',
          name: 'PSO 2',
          supervisorId: 'supervisor-id-123',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        psos: [
          {
            id: 'pso-1',
            email: 'pso1@example.com',
            name: 'PSO 1',
            supervisorId: 'supervisor-id-123',
          },
          {
            id: 'pso-2',
            email: 'pso2@example.com',
            name: 'PSO 2',
            supervisorId: 'supervisor-id-123',
          },
        ],
      }),
    };

    mockApplicationService.getPsosBySupervisor.mockResolvedValue(mockResponse as any);

    const GetPsosBySupervisor = (await import('../../src/handlers/GetPsosBySupervisor')).default;
    await GetPsosBySupervisor(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetPsosBySupervisorApplicationService');
    expect(mockApplicationService.getPsosBySupervisor).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetPsosBySupervisorRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

