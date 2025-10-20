/**
 * @fileoverview FetchPendingCommandsFunction handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../FetchPendingCommandsFunction/index')).default;
  return handler(ctx, req);
}

describe('FetchPendingCommandsFunction handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');
    require('../../mocks/authHelpers');

    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'GET' as any });
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { fetchPendingCommands: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'FetchPendingCommandsApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));
  });

  it('should return 200 with pending command payload', async () => {
    const payload = { pending: { id: 'cmd-1' } };
    appService.fetchPendingCommands.mockResolvedValue({ ...toPayloadify(payload), pending: payload.pending });

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('FetchPendingCommandsApplicationService');
    expect(appService.fetchPendingCommands).toHaveBeenCalledWith(ctx.bindings.callerId);
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 204 when no pending commands', async () => {
    const payload = { pending: null };
    appService.fetchPendingCommands.mockResolvedValue({ ...toPayloadify(payload), pending: null });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({ status: 204, headers: { 'Content-Type': 'application/json' }, body: null });
  });

  it('should return 500 when application service throws', async () => {
    appService.fetchPendingCommands.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch pending commands' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch pending commands' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch pending commands' }
    });
  });
});


