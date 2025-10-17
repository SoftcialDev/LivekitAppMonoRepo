/**
 * @fileoverview OnWebsocketConnection handler - unit tests
 * @summary Unit tests for OnWebsocketConnection Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context } from '@azure/functions';
import { setupWebSocketConnectionTest, assertWebSocketConnectionSuccess, assertWebSocketError } from '../../utils/websocketTestHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../OnWebsocketConnection/index')).default;
  return handler(ctx);
}

describe('OnWebsocketConnection handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    const setup = setupWebSocketConnectionTest();
    ctx = setup.ctx;
    container = setup.container;
    appService = setup.appService;
  });

  it('should handle connection successfully and return 200', async () => {
    const payload = {
      status: 200,
      message: 'User user-123 connected successfully'
    };
    appService.handleConnection.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx);

    assertWebSocketConnectionSuccess(appService, container, ctx, 200);
  });

  it('should handle connection with different user data', async () => {
    const setup = setupWebSocketConnectionTest({
      invocationId: 'inv-789',
      userId: 'user-789',
      connectionId: 'conn-abc',
      hub: 'production-hub',
      phase: 'reconnected'
    });
    ctx = setup.ctx;
    container = setup.container;
    appService = setup.appService;
    
    const payload = {
      status: 200,
      message: 'User user-789 connected successfully'
    };
    appService.handleConnection.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx);

    assertWebSocketConnectionSuccess(appService, container, ctx, 200);
  });

  it('should return 500 when application service throws', async () => {
    appService.handleConnection.mockRejectedValue(new Error('Connection failed'));

    await runHandler(ctx);

    assertWebSocketError(ctx, 500, 'Internal error: Connection failed');
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
    const setup = setupWebSocketConnectionTest({ invocationId: 'inv-empty' });
    ctx = setup.ctx;
    container = setup.container;
    appService = setup.appService;
    
    const payload = {
      status: 200,
      message: 'Connection processed'
    };
    appService.handleConnection.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx);

    assertWebSocketConnectionSuccess(appService, container, ctx, 200);
  });
});
