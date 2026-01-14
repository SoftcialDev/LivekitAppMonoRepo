import { Context } from '@azure/functions';
import getCurrentUser from '../../src/handlers/GetCurrentUser';
import { GetCurrentUserApplicationService } from '../../src/application/services/GetCurrentUserApplicationService';
import { GetCurrentUserRequest } from '../../src/domain/value-objects/GetCurrentUserRequest';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';
import { getCallerAdId } from '../../src/utils/authHelpers';
import { createMockContext, createMockJwtPayload } from './handlerMocks';

jest.mock('../../src/config', () => ({
  config: {
    azureTenantId: 'test-tenant-id',
    azureClientId: 'test-client-id',
    node_env: 'test',
    databaseUrl: 'postgresql://test',
    livekitApiUrl: 'https://test.livekit.io',
    livekitApiKey: 'test-key',
    livekitApiSecret: 'test-secret',
    serviceBusConnection: 'test-connection',
    webPubSubEndpoint: 'https://test.webpubsub.azure.com',
    webPubSubKey: 'test-key',
    webPubSubHubName: 'test-hub',
    azureClientSecret: 'test-secret',
    serviceBusTopicName: 'test-topic',
    azureAdApiIdentifierUri: 'https://test.api',
    servicePrincipalObjectId: 'test-principal-id',
    commandsSubscriptionName: 'test-subscription',
    snapshotContainerName: 'test-container',
  },
}));

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

jest.mock('../../src/utils/authHelpers', () => ({
  getCallerAdId: jest.fn(),
}));

jest.mock('../../src/middleware/auth', () => ({
  withAuth: jest.fn((ctx: Context, next: () => Promise<void>) => next()),
}));

jest.mock('../../src/middleware/errorHandler', () => ({
  withErrorHandler: jest.fn((handler: any) => handler),
}));

describe('GetCurrentUser handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<GetCurrentUserApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = createMockContext();
    const jwtPayload = createMockJwtPayload();
    
    mockContext.bindings = {
      user: jwtPayload,
    };

    mockApplicationService = {
      getCurrentUser: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;
    
    mockResolve.mockReturnValue(mockApplicationService);
    (getCallerAdId as jest.Mock).mockReturnValue('test-azure-ad-id');
  });

  it('should successfully get current user', async () => {
    const mockResponse = {
      azureAdObjectId: 'test-azure-ad-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'PSO',
      permissions: ['snapshots:create'],
      isNewUser: false,
      toPayload: jest.fn().mockReturnValue({
        azureAdObjectId: 'test-azure-ad-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'PSO',
        permissions: ['snapshots:create'],
      }),
    };

    mockApplicationService.getCurrentUser.mockResolvedValue(mockResponse as any);

    await getCurrentUser(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetCurrentUserApplicationService');
    expect(mockApplicationService.getCurrentUser).toHaveBeenCalledWith(
      expect.any(GetCurrentUserRequest),
      expect.objectContaining({ oid: 'test-azure-ad-id' })
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle new user auto-creation', async () => {
    const mockResponse = {
      azureAdObjectId: 'test-azure-ad-id',
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'PSO',
      permissions: [],
      isNewUser: true,
      toPayload: jest.fn().mockReturnValue({
        azureAdObjectId: 'test-azure-ad-id',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'PSO',
        permissions: [],
      }),
    };

    mockApplicationService.getCurrentUser.mockResolvedValue(mockResponse as any);

    await getCurrentUser(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('New user auto-created')
    );
    expect(mockContext.res?.status).toBe(200);
  });

  it('should throw error when user not found in context', async () => {
    mockContext.bindings = {};

    await expect(getCurrentUser(mockContext)).rejects.toThrow();
  });

  it('should throw error when caller ID cannot be extracted', async () => {
    (getCallerAdId as jest.Mock).mockReturnValue(null);

    await expect(getCurrentUser(mockContext)).rejects.toThrow();
  });
});

