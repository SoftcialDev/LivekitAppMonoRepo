import { Context, HttpRequest } from '@azure/functions';
import { GetSnapshotReasonsApplicationService } from '../../src/application/services/GetSnapshotReasonsApplicationService';
import { IErrorLogService } from '../../src/domain/interfaces/IErrorLogService';
import { createMockContext, createMockJwtPayload, createMockHttpRequest } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';
import * as authMiddleware from '../../src/middleware/auth';

jest.mock('../../src/middleware/auth');
jest.mock('../../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    snapshotReason: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}), { virtual: true });

describe('GetSnapshotReasons handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<GetSnapshotReasonsApplicationService>;
  let mockErrorLogService: jest.Mocked<IErrorLogService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockContext.req = createMockHttpRequest();

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getSnapshotReasons: jest.fn(),
    } as any;

    mockErrorLogService = {
      logError: jest.fn(),
      logChatServiceError: jest.fn(),
    } as any;

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    mockResolve.mockImplementation((serviceName: string) => {
      if (serviceName === 'ErrorLogService') {
        return mockErrorLogService;
      }
      return mockApplicationService;
    });

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully get snapshot reasons', async () => {
    const prisma = require('../../src/infrastructure/database/PrismaClientService').default;
    prisma.snapshotReason.findMany.mockResolvedValue([]);

    const mockReasons = [
      {
        id: 'reason-1',
        label: 'Reason 1',
        code: 'REASON_1',
        isDefault: false,
        isActive: true,
        order: 1,
        toJSON: jest.fn().mockReturnValue({
          id: 'reason-1',
          label: 'Reason 1',
          code: 'REASON_1',
          isDefault: false,
          isActive: true,
          order: 1,
        }),
      },
      {
        id: 'reason-2',
        label: 'Reason 2',
        code: 'REASON_2',
        isDefault: true,
        isActive: true,
        order: 2,
        toJSON: jest.fn().mockReturnValue({
          id: 'reason-2',
          label: 'Reason 2',
          code: 'REASON_2',
          isDefault: true,
          isActive: true,
          order: 2,
        }),
      },
    ];

    mockApplicationService.getSnapshotReasons.mockResolvedValue(mockReasons as any);

    const getSnapshotReasonsHandler = (await import('../../src/handlers/GetSnapshotReasons')).default;
    await getSnapshotReasonsHandler(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetSnapshotReasonsApplicationService');
    expect(mockApplicationService.getSnapshotReasons).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      reasons: mockReasons.map(r => r.toJSON()),
    });
  });

  it('should log auth failure to error table when status is 401', async () => {
    (authMiddleware.withAuth as jest.Mock).mockImplementationOnce(async (ctx: Context, next: () => Promise<void>) => {
      ctx.res = { status: 401 };
      return;
    });

    const getSnapshotReasonsHandler = (await import('../../src/handlers/GetSnapshotReasons')).default;
    await getSnapshotReasonsHandler(mockContext);

    expect(mockContext.log.warn).toHaveBeenCalledWith('[GetSnapshotReasons] Auth failed - logging to error table');
    expect(mockResolve).toHaveBeenCalledWith('ErrorLogService');
    expect(mockErrorLogService.logError).toHaveBeenCalledWith({
      severity: 'Medium',
      source: 'Authentication',
      endpoint: '/api/GetSnapshotReasons',
      functionName: 'GetSnapshotReasons',
      error: expect.any(Error),
      userId: 'test-azure-ad-id',
      context: expect.objectContaining({
        hasCtxReq: true,
        hasReq: true,
        hasHeaders: true,
      }),
      httpStatusCode: 401,
    });
    expect(mockContext.log.info).toHaveBeenCalledWith('[GetSnapshotReasons] Auth failure logged to error table');
  });

  it('should handle error when logging auth failure fails', async () => {
    (authMiddleware.withAuth as jest.Mock).mockImplementationOnce(async (ctx: Context, next: () => Promise<void>) => {
      ctx.res = { status: 401 };
      return;
    });

    mockErrorLogService.logError.mockRejectedValueOnce(new Error('Logging failed'));

    const getSnapshotReasonsHandler = (await import('../../src/handlers/GetSnapshotReasons')).default;
    await getSnapshotReasonsHandler(mockContext);

    expect(mockContext.log.error).toHaveBeenCalledWith(
      '[GetSnapshotReasons] Failed to log auth error to table',
      expect.any(Error)
    );
  });

  it('should log request details before auth', async () => {
    const prisma = require('../../src/infrastructure/database/PrismaClientService').default;
    prisma.snapshotReason.findMany.mockResolvedValue([]);

    const mockReasons = [
      {
        id: 'reason-1',
        label: 'Reason 1',
        code: 'REASON_1',
        isDefault: false,
        isActive: true,
        order: 1,
        toJSON: jest.fn().mockReturnValue({
          id: 'reason-1',
          label: 'Reason 1',
          code: 'REASON_1',
          isDefault: false,
          isActive: true,
          order: 1,
        }),
      },
    ];

    mockApplicationService.getSnapshotReasons.mockResolvedValue(mockReasons as any);

    const getSnapshotReasonsHandler = (await import('../../src/handlers/GetSnapshotReasons')).default;
    await getSnapshotReasonsHandler(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      '[GetSnapshotReasons] Handler called',
      expect.objectContaining({
        hasCtxReq: true,
        hasReq: true,
        hasHeaders: true,
      })
    );
  });
});

