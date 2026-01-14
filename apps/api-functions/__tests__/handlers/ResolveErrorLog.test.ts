import { Context, HttpRequest } from '@azure/functions';
import { GetErrorLogsApplicationService } from '../../src/application/services/GetErrorLogsApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';
import { ensureBindings } from '../../src/domain/types/ContextBindings';

describe('ResolveErrorLog handler', () => {
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
      method: 'PATCH',
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

  it('should successfully resolve error log', async () => {
    mockApplicationService.markAsResolved.mockResolvedValue(undefined);

    const resolveErrorLogHandler = (await import('../../src/handlers/ResolveErrorLog')).default;
    await resolveErrorLogHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetErrorLogsApplicationService');
    const extendedCtx = ensureBindings(mockContext);
    expect(mockApplicationService.markAsResolved).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({ message: 'Error log marked as resolved' });
  });
});

