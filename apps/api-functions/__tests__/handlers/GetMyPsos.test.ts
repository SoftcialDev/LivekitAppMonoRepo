import { Context, HttpRequest } from '@azure/functions';
import { GetPsosBySupervisorApplicationService } from '../../src/application/services/GetPsosBySupervisorApplicationService';
import { GetPsosBySupervisorRequest } from '../../src/domain/value-objects/GetPsosBySupervisorRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { UserRole } from '@prisma/client';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetMyPsos handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetPsosBySupervisorApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'GET' });

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getPsosBySupervisor: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize, container } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'GetPsosBySupervisorApplicationService') {
        return mockApplicationService;
      }
      if (serviceName === 'UserRepository') {
        return mockUserRepository;
      }
      return mockApplicationService;
    });
  });

  it('should return PSOs for supervisor', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      role: UserRole.Supervisor,
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      psos: [
        {
          id: 'pso-1',
          email: 'pso1@example.com',
          name: 'PSO 1',
          supervisorId: 'test-azure-ad-id',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        psos: [
          {
            id: 'pso-1',
            email: 'pso1@example.com',
            name: 'PSO 1',
            supervisorId: 'test-azure-ad-id',
          },
        ],
      }),
    };

    mockApplicationService.getPsosBySupervisor.mockResolvedValue(mockResponse as any);

    const GetMyPsos = (await import('../../src/handlers/GetMyPsos')).default;
    await GetMyPsos(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith('test-azure-ad-id');
    expect(mockApplicationService.getPsosBySupervisor).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetPsosBySupervisorRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return all PSOs for admin', async () => {
    const mockUser = {
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      role: UserRole.Admin,
      deletedAt: null,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);

    const mockResponse = {
      psos: [
        {
          id: 'pso-1',
          email: 'pso1@example.com',
          name: 'PSO 1',
        },
        {
          id: 'pso-2',
          email: 'pso2@example.com',
          name: 'PSO 2',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        psos: [
          {
            id: 'pso-1',
            email: 'pso1@example.com',
            name: 'PSO 1',
          },
          {
            id: 'pso-2',
            email: 'pso2@example.com',
            name: 'PSO 2',
          },
        ],
      }),
    };

    mockApplicationService.getPsosBySupervisor.mockResolvedValue(mockResponse as any);

    const GetMyPsos = (await import('../../src/handlers/GetMyPsos')).default;
    await GetMyPsos(mockContext, mockRequest);

    expect(mockApplicationService.getPsosBySupervisor).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetPsosBySupervisorRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

