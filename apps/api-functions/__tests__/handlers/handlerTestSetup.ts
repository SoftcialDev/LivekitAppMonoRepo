export const mockConfig = {
  azureTenantId: 'test-tenant-id',
  azureClientId: 'test-client-id',
  node_env: 'test',
  databaseUrl: 'postgresql://test',
  livekitApiUrl: 'https://test.livekit.io',
  livekitApiKey: 'test-key',
  livekitApiSecret: 'test-secret',
  serviceBusConnection: 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=test=',
  webPubSubEndpoint: 'https://test.webpubsub.azure.com',
  webPubSubKey: 'test-key',
  webPubSubHubName: 'test-hub',
  azureClientSecret: 'test-secret',
  serviceBusTopicName: 'test-topic',
  azureAdApiIdentifierUri: 'https://test.api',
  servicePrincipalObjectId: 'test-principal-id',
  commandsSubscriptionName: 'test-subscription',
  snapshotContainerName: 'test-container',
  storageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test==;EndpointSuffix=core.windows.net',
  recordingsContainerName: 'recordings',
};

jest.mock('../../src/config', () => ({
  config: mockConfig,
}));

jest.mock('../../src/infrastructure/container/ServiceContainer');
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/callerId');
jest.mock('../../src/middleware/validate');
jest.mock('../../src/middleware/permissions');
jest.mock('../../src/middleware/errorHandler');

import { Context } from '@azure/functions';
import { ServiceContainer } from '../../src/infrastructure/container/ServiceContainer';
import * as authMiddleware from '../../src/middleware/auth';
import * as callerIdMiddleware from '../../src/middleware/callerId';
import * as validateMiddleware from '../../src/middleware/validate';
import * as permissionsMiddleware from '../../src/middleware/permissions';
import * as errorHandlerMiddleware from '../../src/middleware/errorHandler';

export const setupMiddlewareMocks = () => {
  (authMiddleware.withAuth as jest.Mock).mockImplementation((ctx: Context, next: () => Promise<void>) => next());
  (callerIdMiddleware.withCallerId as jest.Mock).mockImplementation((ctx: Context, next: () => Promise<void>) => next());
  (validateMiddleware.withBodyValidation as jest.Mock).mockImplementation(() => (ctx: Context, next: () => Promise<void>) => next());
  (validateMiddleware.withPathValidation as jest.Mock).mockImplementation(() => (ctx: Context, next: () => Promise<void>) => next());
  (validateMiddleware.withQueryValidation as jest.Mock).mockImplementation(() => (ctx: Context, next: () => Promise<void>) => next());
  (permissionsMiddleware.requirePermission as jest.Mock).mockImplementation(() => async (ctx: Context) => {});
  (errorHandlerMiddleware.withErrorHandler as jest.Mock).mockImplementation((handler: any) => {
    return async (ctx: Context, ...args: any[]) => {
      await handler(ctx, ...args);
    };
  });
};

export const createMockServiceContainer = (mockService?: any) => {
  const mockResolve = jest.fn();
  const mockInitialize = jest.fn();
  
  if (mockService) {
    mockResolve.mockReturnValue(mockService);
  }
  
  const mockContainer = {
    initialize: mockInitialize,
    resolve: mockResolve,
  } as any;

  (ServiceContainer.getInstance as jest.Mock).mockReturnValue(mockContainer);

  return {
    container: mockContainer,
    mockResolve,
    mockInitialize,
  };
};

