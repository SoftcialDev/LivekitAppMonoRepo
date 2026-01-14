import { Context, HttpRequest } from '@azure/functions';
import { GetErrorLogsApplicationService } from '../../src/application/services/GetErrorLogsApplicationService';
import { GetErrorLogsResponse } from '../../src/domain/value-objects/GetErrorLogsResponse';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';
import { ensureBindings } from '../../src/domain/types/ContextBindings';

describe('GetErrorLogById handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetErrorLogsApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
    });

    mockContext.bindingData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      invocationId: 'test-invocation-id',
    };

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedParams: {
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    };

    mockApplicationService = {
      getErrorLogs: jest.fn(),
      getErrorLogById: jest.fn(),
      markAsResolved: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully get error log by id', async () => {
    const mockLog = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      severity: 'High',
      source: 'API',
      endpoint: '/api/test',
      functionName: 'TestFunction',
      errorName: 'Error',
      errorMessage: 'Test error',
      stackTrace: null,
      httpStatusCode: 500,
      userId: 'user-1',
      userEmail: 'user@example.com',
      requestId: 'req-1',
      context: {},
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date(),
    };

    mockApplicationService.getErrorLogById.mockResolvedValue(mockLog as any);

    const getErrorLogByIdHandler = (await import('../../src/handlers/GetErrorLogById')).default;
    await getErrorLogByIdHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetErrorLogsApplicationService');
    expect(mockApplicationService.getErrorLogById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toHaveProperty('id');
    expect(mockContext.res?.body.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return 400 when error log not found', async () => {
    mockApplicationService.getErrorLogById.mockResolvedValue(null);

    const getErrorLogByIdHandler = (await import('../../src/handlers/GetErrorLogById')).default;
    await getErrorLogByIdHandler(mockContext, mockRequest);

    expect(mockApplicationService.getErrorLogById).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(400);
    expect(mockContext.res?.body).toEqual({ error: 'Error log not found' });
  });
});

