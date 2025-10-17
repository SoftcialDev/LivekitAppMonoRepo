/**
 * @fileoverview StreamingSessionUpdate handler - unit tests
 * @summary Unit tests for StreamingSessionUpdate Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../StreamingSessionUpdate/index')).default;
  return handler(ctx, req);
}

describe('StreamingSessionUpdate handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = { status: 'started', isCommand: false };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { updateStreamingSession: jest.fn() };
    container = createServiceContainerMock({ StreamingSessionUpdateApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should update streaming session and return 200', async () => {
    const payload = {
      message: 'Streaming session started',
      status: 'started'
    };
    appService.updateStreamingSession.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('StreamingSessionUpdateApplicationService');
    expect(appService.updateStreamingSession).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ callerId: ctx.bindings.callerId, status: 'started', isCommand: false })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should handle stopped session with reason', async () => {
    (req as any).body = { status: 'stopped', isCommand: true, reason: 'COMMAND' };
    const payload = {
      message: 'Streaming session stopped (COMMAND)',
      status: 'stopped',
      stopReason: 'COMMAND'
    };
    appService.updateStreamingSession.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(appService.updateStreamingSession).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ 
        callerId: ctx.bindings.callerId, 
        status: 'stopped', 
        isCommand: true,
        reason: 'COMMAND'
      })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.updateStreamingSession.mockRejectedValue(new Error('boom'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to update streaming session' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to update streaming session' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to update streaming session' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });
});
