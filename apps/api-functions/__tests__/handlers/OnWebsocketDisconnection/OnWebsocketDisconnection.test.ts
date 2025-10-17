/**
 * @fileoverview OnWebsocketDisconnection handler - unit tests
 * @summary Unit tests for OnWebsocketDisconnection Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context } from '@azure/functions';
import { setupWebSocketDisconnectionTest, assertWebSocketDisconnectionSuccess, assertWebSocketError } from '../../utils/websocketTestHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../OnWebsocketDisconnection/index')).default;
  return handler(ctx);
}

describe('OnWebsocketDisconnection handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let connectionService: any;
  let cmService: any;
  let webPubSubService: any;

  beforeEach(() => {
    jest.resetModules();
    const setup = setupWebSocketDisconnectionTest();
    ctx = setup.ctx;
    container = setup.container;
    connectionService = setup.connectionService;
    cmService = setup.cmService;
    webPubSubService = setup.webPubSubService;
  });

  it('should handle disconnection successfully and return 200', async () => {
    const disconnectResult = {
      status: 200,
      message: 'User user-123 disconnected successfully'
    };
    const syncResult = {
      corrected: 2,
      warnings: [],
      errors: []
    };
    
    connectionService.handleDisconnection.mockResolvedValue(toPayloadify(disconnectResult));
    cmService.handleContactManagerDisconnect.mockResolvedValue(undefined);
    webPubSubService.syncAllUsersWithDatabase.mockResolvedValue(syncResult);

    await runHandler(ctx);

    assertWebSocketDisconnectionSuccess(connectionService, cmService, webPubSubService, container, ctx, 200);
  });

  it('should handle disconnection with different user data', async () => {
    ctx.bindingData = {
      invocationId: 'inv-789',
      userId: 'user-789',
      connectionId: 'conn-xyz',
      hub: 'production-hub',
      phase: 'timeout'
    };
    
    const disconnectResult = {
      status: 200,
      message: 'User user-789 disconnected successfully'
    };
    const syncResult = {
      corrected: 0,
      warnings: ['Some warning'],
      errors: []
    };
    
    connectionService.handleDisconnection.mockResolvedValue(toPayloadify(disconnectResult));
    cmService.handleContactManagerDisconnect.mockResolvedValue(undefined);
    webPubSubService.syncAllUsersWithDatabase.mockResolvedValue(syncResult);

    await runHandler(ctx);

    assertWebSocketDisconnectionSuccess(connectionService, cmService, webPubSubService, container, ctx, 200);
  });

  it('should handle sync errors gracefully and still return 200', async () => {
    const disconnectResult = {
      status: 200,
      message: 'User user-123 disconnected successfully'
    };
    
    connectionService.handleDisconnection.mockResolvedValue(toPayloadify(disconnectResult));
    cmService.handleContactManagerDisconnect.mockResolvedValue(undefined);
    webPubSubService.syncAllUsersWithDatabase.mockRejectedValue(new Error('Sync failed'));

    await runHandler(ctx);

    expect(connectionService.handleDisconnection).toHaveBeenCalled();
    expect(cmService.handleContactManagerDisconnect).toHaveBeenCalled();
    expect(webPubSubService.syncAllUsersWithDatabase).toHaveBeenCalled();
    expect(ctx.res).toEqual({ status: 200 });
  });

  it('should return 500 when connection service throws', async () => {
    connectionService.handleDisconnection.mockRejectedValue(new Error('Connection service failed'));

    await runHandler(ctx);

    assertWebSocketError(ctx, 500, 'Internal error: Connection service failed');
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx);

    assertWebSocketError(ctx, 500, 'Internal error: init failed');
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx);

    assertWebSocketError(ctx, 500, 'Internal error: resolve failed');
  });

  it('should handle missing binding data gracefully', async () => {
    const setup = setupWebSocketDisconnectionTest({ invocationId: 'inv-empty' });
    ctx = setup.ctx;
    container = setup.container;
    connectionService = setup.connectionService;
    cmService = setup.cmService;
    webPubSubService = setup.webPubSubService;
    
    const disconnectResult = {
      status: 200,
      message: 'Disconnection processed'
    };
    const syncResult = {
      corrected: 0,
      warnings: [],
      errors: []
    };
    
    connectionService.handleDisconnection.mockResolvedValue(toPayloadify(disconnectResult));
    cmService.handleContactManagerDisconnect.mockResolvedValue(undefined);
    webPubSubService.syncAllUsersWithDatabase.mockResolvedValue(syncResult);

    await runHandler(ctx);

    assertWebSocketDisconnectionSuccess(connectionService, cmService, webPubSubService, container, ctx, 200);
  });
});
