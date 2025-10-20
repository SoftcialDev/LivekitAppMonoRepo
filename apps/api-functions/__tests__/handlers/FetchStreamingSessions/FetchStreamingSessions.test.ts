/**
 * @fileoverview FetchStreamingSessions handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../FetchStreamingSessions/index')).default;
  return handler(ctx, req);
}

describe('FetchStreamingSessions handler - unit', () => {
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

    appService = { fetchStreamingSessions: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'FetchStreamingSessionsApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));
  });

  it('should return 200 with sessions payload', async () => {
    const payload = { sessions: [{ id: 's1' } ] };
    appService.fetchStreamingSessions.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('FetchStreamingSessionsApplicationService');
    expect(appService.fetchStreamingSessions).toHaveBeenCalledWith(ctx.bindings.callerId);
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.fetchStreamingSessions.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch streaming sessions' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch streaming sessions' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to fetch streaming sessions' }
    });
  });

  it('should handle null payload with 200', async () => {
    appService.fetchStreamingSessions.mockResolvedValue({ toPayload: () => null } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  it('should handle undefined payload with 200', async () => {
    appService.fetchStreamingSessions.mockResolvedValue({ toPayload: () => undefined } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
  });
});


