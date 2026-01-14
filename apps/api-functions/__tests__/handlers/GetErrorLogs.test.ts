import { Context, HttpRequest } from '@azure/functions';
import { GetErrorLogsApplicationService } from '../../src/application/services/GetErrorLogsApplicationService';
import { GetErrorLogsRequest } from '../../src/domain/value-objects/GetErrorLogsRequest';
import { GetErrorLogsResponse } from '../../src/domain/value-objects/GetErrorLogsResponse';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetErrorLogs handler', () => {
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
      query: {
        source: 'API',
        severity: 'High',
        limit: '10',
        offset: '0',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
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

  it('should successfully get error logs with query parameters', async () => {
    const mockLogs = [
      {
        id: 'log-1',
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
      },
    ];

    mockApplicationService.getErrorLogs.mockResolvedValue({ logs: mockLogs as any, total: 1 });

    const getErrorLogsHandler = (await import('../../src/handlers/GetErrorLogs')).default;
    await getErrorLogsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetErrorLogsApplicationService');
    expect(mockApplicationService.getErrorLogs).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toHaveProperty('logs');
    expect(mockContext.res?.body).toHaveProperty('total');
    expect(mockContext.res?.body).toHaveProperty('count');
  });

  it('should handle empty query parameters', async () => {
    mockRequest.query = {};
    mockApplicationService.getErrorLogs.mockResolvedValue({ logs: [], total: 0 });

    const getErrorLogsHandler = (await import('../../src/handlers/GetErrorLogs')).default;
    await getErrorLogsHandler(mockContext, mockRequest);

    expect(mockApplicationService.getErrorLogs).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.logs).toEqual([]);
    expect(mockContext.res?.body.total).toBe(0);
  });

  it('should handle pagination parameters', async () => {
    mockRequest.query = {
      limit: '20',
      offset: '40',
    };

    mockApplicationService.getErrorLogs.mockResolvedValue({ logs: [], total: 100 });

    const getErrorLogsHandler = (await import('../../src/handlers/GetErrorLogs')).default;
    await getErrorLogsHandler(mockContext, mockRequest);

    expect(mockApplicationService.getErrorLogs).toHaveBeenCalled();
    expect(mockContext.res?.body.limit).toBe(20);
    expect(mockContext.res?.body.offset).toBe(40);
  });
});

