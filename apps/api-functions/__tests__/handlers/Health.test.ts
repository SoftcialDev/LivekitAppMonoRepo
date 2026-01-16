import { Context, HttpRequest } from '@azure/functions';
import { createMockContext, createMockHttpRequest } from './handlerMocks';
import { HealthCheckDomainService } from '../../src/domain/services/HealthCheckDomainService';
import { StorageDetailsService } from '../../src/infrastructure/services/StorageDetailsService';
import { DatabaseHealthCheckService } from '../../src/infrastructure/services/DatabaseHealthCheckService';
import { HealthStatus } from '../../src/domain/enums/HealthStatus';

jest.mock('../../src/config', () => ({
  config: {
    databaseUrl: 'postgresql://test',
    azureTenantId: 'test-tenant-id',
    azureClientId: 'test-client-id',
  },
}));

jest.mock('../../src/domain/services/HealthCheckDomainService');
jest.mock('../../src/infrastructure/services/StorageDetailsService');
jest.mock('../../src/infrastructure/services/DatabaseHealthCheckService');

describe('Health handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {},
    });
    mockContext.req = mockRequest;
  });

  it('should return 200 when health check passes', async () => {
    const mockHealthCheckService = {
      validateEnvironmentVariables: jest.fn().mockReturnValue({
        status: HealthStatus.OK,
        missingKeys: [],
      }),
      determineOverallStatus: jest.fn().mockReturnValue(HealthStatus.OK),
    };

    (HealthCheckDomainService as jest.Mock).mockImplementation(() => mockHealthCheckService);
    (StorageDetailsService as jest.Mock).mockImplementation(() => ({
      getStorageDetails: jest.fn().mockReturnValue({}),
    }));
    (DatabaseHealthCheckService as jest.Mock).mockImplementation(() => ({
      checkDatabaseConnectivity: jest.fn().mockResolvedValue({
        status: HealthStatus.OK,
        message: 'Database connection successful',
      }),
      fetchUsers: jest.fn().mockResolvedValue([]),
    }));

    const healthHandler = (await import('../../src/handlers/Health')).default;
    await healthHandler(mockContext);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toHaveProperty('status');
    expect(mockContext.res?.body).toHaveProperty('timestamp');
    expect(mockContext.res?.body).toHaveProperty('checks');
  });

  it('should return 503 when health check fails', async () => {
    const mockHealthCheckService = {
      validateEnvironmentVariables: jest.fn().mockReturnValue({
        status: HealthStatus.FAIL,
        missingKeys: ['MISSING_KEY'],
      }),
      determineOverallStatus: jest.fn().mockReturnValue(HealthStatus.FAIL),
    };

    (HealthCheckDomainService as jest.Mock).mockImplementation(() => mockHealthCheckService);
    (StorageDetailsService as jest.Mock).mockImplementation(() => ({
      getStorageDetails: jest.fn().mockReturnValue({}),
    }));
    (DatabaseHealthCheckService as jest.Mock).mockImplementation(() => ({
      checkDatabaseConnectivity: jest.fn().mockResolvedValue({
        status: HealthStatus.FAIL,
        message: 'Database connection failed',
      }),
      fetchUsers: jest.fn().mockResolvedValue([]),
    }));

    const healthHandler = (await import('../../src/handlers/Health')).default;
    await healthHandler(mockContext);

    expect(mockContext.res?.status).toBe(503);
    expect(mockContext.res?.body.status).toBe(HealthStatus.FAIL);
  });

  it('should handle verbose query parameter', async () => {
    mockRequest.query = { verbose: 'true' };

    const mockHealthCheckService = {
      validateEnvironmentVariables: jest.fn().mockReturnValue({
        status: HealthStatus.OK,
        missingKeys: [],
      }),
      determineOverallStatus: jest.fn().mockReturnValue(HealthStatus.OK),
    };

    (HealthCheckDomainService as jest.Mock).mockImplementation(() => mockHealthCheckService);
    (StorageDetailsService as jest.Mock).mockImplementation(() => ({
      getStorageDetails: jest.fn().mockReturnValue({}),
    }));
    (DatabaseHealthCheckService as jest.Mock).mockImplementation(() => ({
      checkDatabaseConnectivity: jest.fn().mockResolvedValue({
        status: HealthStatus.OK,
        message: 'Database connection successful',
      }),
      fetchUsers: jest.fn().mockResolvedValue([]),
    }));

    const healthHandler = (await import('../../src/handlers/Health')).default;
    await healthHandler(mockContext);

    expect(mockContext.res?.status).toBe(200);
  });
});



