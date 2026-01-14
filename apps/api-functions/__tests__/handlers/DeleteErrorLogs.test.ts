import { Context, HttpRequest } from '@azure/functions';
import { DeleteErrorLogsApplicationService } from '../../src/application/services/DeleteErrorLogsApplicationService';
import { DeleteErrorLogsRequest } from '../../src/domain/value-objects/DeleteErrorLogsRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}), { virtual: true });

describe('DeleteErrorLogs handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<DeleteErrorLogsApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'DELETE',
      body: {
        ids: ['log-id-1', 'log-id-2'],
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        ids: ['log-id-1', 'log-id-2'],
      },
    };

    mockApplicationService = {
      deleteErrorLogs: jest.fn(),
      deleteAll: jest.fn(),
    } as any;

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully delete error logs by ids', async () => {
    mockApplicationService.deleteErrorLogs.mockResolvedValue(undefined);

    const deleteErrorLogsHandler = (await import('../../src/handlers/DeleteErrorLogs')).default;
    await deleteErrorLogsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('DeleteErrorLogsApplicationService');
    expect(mockApplicationService.deleteErrorLogs).toHaveBeenCalledWith(['log-id-1', 'log-id-2']);
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      message: 'Successfully deleted 2 error log(s)',
      deletedIds: ['log-id-1', 'log-id-2'],
    });
  });

  it('should successfully delete all error logs when deleteAll is true', async () => {
    mockRequest.body = {
      deleteAll: true,
    };
    mockContext.bindings.validatedBody = {
      deleteAll: true,
    };

    mockApplicationService.deleteAll.mockResolvedValue(undefined);

    const deleteErrorLogsHandler = (await import('../../src/handlers/DeleteErrorLogs')).default;
    await deleteErrorLogsHandler(mockContext, mockRequest);

    expect(mockApplicationService.deleteAll).toHaveBeenCalled();
    expect(mockApplicationService.deleteErrorLogs).not.toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      message: 'Successfully deleted all error logs',
      deletedAll: true,
    });
  });

  it('should handle single id string', async () => {
    mockRequest.body = {
      ids: 'single-log-id',
    };
    mockContext.bindings.validatedBody = {
      ids: 'single-log-id',
    };

    mockApplicationService.deleteErrorLogs.mockResolvedValue(undefined);

    const deleteErrorLogsHandler = (await import('../../src/handlers/DeleteErrorLogs')).default;
    await deleteErrorLogsHandler(mockContext, mockRequest);

    expect(mockApplicationService.deleteErrorLogs).toHaveBeenCalled();
  });
});

