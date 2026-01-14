import { Context, HttpRequest } from '@azure/functions';
import { GetSupervisorByIdentifierApplicationService } from '../../src/application/services/GetSupervisorByIdentifierApplicationService';
import { GetSupervisorByIdentifierRequest } from '../../src/domain/value-objects/GetSupervisorByIdentifierRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetSupervisorByIdentifier handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetSupervisorByIdentifierApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        identifier: 'supervisor@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: {
        identifier: 'supervisor@example.com',
      },
    };

    mockApplicationService = {
      getSupervisorByIdentifier: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully get supervisor by identifier', async () => {
    const mockResponse = {
      supervisor: {
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        firstName: 'Supervisor',
        lastName: 'User',
      },
      toPayload: jest.fn().mockReturnValue({
        supervisor: {
          id: 'supervisor-id',
          email: 'supervisor@example.com',
          firstName: 'Supervisor',
          lastName: 'User',
        },
      }),
    };

    mockApplicationService.getSupervisorByIdentifier.mockResolvedValue(mockResponse as any);

    const getSupervisorByIdentifierHandler = (await import('../../src/handlers/GetSupervisorByIdentifier')).default;
    await getSupervisorByIdentifierHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetSupervisorByIdentifierApplicationService');
    expect(mockApplicationService.getSupervisorByIdentifier).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetSupervisorByIdentifierRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle supervisor not found', async () => {
    const mockResponse = {
      supervisor: null,
      toPayload: jest.fn().mockReturnValue({
        supervisor: null,
      }),
    };

    mockApplicationService.getSupervisorByIdentifier.mockResolvedValue(mockResponse as any);

    const getSupervisorByIdentifierHandler = (await import('../../src/handlers/GetSupervisorByIdentifier')).default;
    await getSupervisorByIdentifierHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.supervisor).toBeNull();
  });
});

