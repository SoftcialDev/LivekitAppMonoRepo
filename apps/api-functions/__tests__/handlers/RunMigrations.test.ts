import { Context, HttpRequest } from '@azure/functions';
import { IErrorLogService } from '../../src/domain/interfaces/IErrorLogService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';
import { ApplicationServiceOperationError } from '../../src/domain/errors/ApplicationServiceErrors';

jest.mock('node:child_process');
jest.mock('../../src/infrastructure/seed/defaultRolesAndPermissions');
jest.mock('../../src/infrastructure/seed/defaultSnapshotReasons');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../src/config', () => ({
  config: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    migrationForceReset: 'false',
  },
}));

describe('RunMigrations handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockErrorLogService: jest.Mocked<IErrorLogService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
    };

    mockErrorLogService = {
      logError: jest.fn().mockResolvedValue(undefined),
    } as any;

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer();
    mockResolve = resolve;
    mockInitialize = initialize;
    mockResolve.mockImplementation((name: string) => {
      if (name === 'ErrorLogService') {
        return mockErrorLogService;
      }
      return {};
    });

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should return 400 for non-POST requests', async () => {
    mockRequest.method = 'GET';

    const runMigrationsHandler = (await import('../../src/handlers/RunMigrations')).default;
    await runMigrationsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
  });

  it('should throw error when DATABASE_URL is not configured', async () => {
    const { config } = require('../../src/config');
    const originalUrl = config.databaseUrl;
    config.databaseUrl = undefined;

    const runMigrationsHandler = (await import('../../src/handlers/RunMigrations')).default;
    
    await expect(runMigrationsHandler(mockContext, mockRequest)).rejects.toThrow(ApplicationServiceOperationError);
    
    config.databaseUrl = originalUrl;
  });
});

