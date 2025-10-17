/**
 * @fileoverview PresenceUpdate handler - unit tests
 * @summary Unit tests for PresenceUpdate Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../PresenceUpdate/index')).default;
  return handler(ctx, req);
}

describe('PresenceUpdate handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = { status: 'online' };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();
    (ctx as any).bindings.validatedBody = { status: 'online' };

    appService = { updatePresence: jest.fn() };
    container = createServiceContainerMock({ PresenceUpdateApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should update presence to online and return 200', async () => {
    const payload = {
      message: 'Presence set to online'
    };
    appService.updatePresence.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('PresenceUpdateApplicationService');
    expect(appService.updatePresence).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ 
        callerId: ctx.bindings.callerId, 
        status: 'online'
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should update presence to offline and return 200', async () => {
    (req as any).body = { status: 'offline' };
    (ctx as any).bindings.validatedBody = { status: 'offline' };
    const payload = {
      message: 'Presence set to offline'
    };
    appService.updatePresence.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(appService.updatePresence).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ 
        callerId: ctx.bindings.callerId, 
        status: 'offline'
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.updatePresence.mockRejectedValue(new Error('boom'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to update presence' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to update presence' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to update presence' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });
});
