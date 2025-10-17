/**
 * @fileoverview SendSnapshot handler - unit tests
 * @summary Unit tests for SendSnapshot Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../SendSnapshot/index')).default;
  return handler(ctx, req);
}

describe('SendSnapshot handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = { 
      psoEmail: 'pso@test.com', 
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
      reason: 'Test snapshot'
    };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();
    (ctx as any).bindings.user = { fullName: 'John Supervisor' };
    req.headers = { authorization: 'Bearer test-token-123' };

    appService = { sendSnapshot: jest.fn() };
    container = createServiceContainerMock({ SendSnapshotApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should send snapshot and return 200', async () => {
    const payload = {
      snapshotId: 'snapshot-123',
      message: 'Snapshot report sent successfully'
    };
    appService.sendSnapshot.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('SendSnapshotApplicationService');
    expect(appService.sendSnapshot).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ 
        callerId: ctx.bindings.callerId, 
        psoEmail: 'pso@test.com',
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
        reason: 'Test snapshot'
      }),
      'John Supervisor',
      'test-token-123'
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should handle missing authorization header', async () => {
    req.headers = {};
    const payload = {
      snapshotId: 'snapshot-456',
      message: 'Snapshot report sent successfully'
    };
    appService.sendSnapshot.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(appService.sendSnapshot).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.any(Object),
      'John Supervisor',
      undefined
    );
  });

  it('should return 500 when application service throws', async () => {
    appService.sendSnapshot.mockRejectedValue(new Error('boom'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error processing snapshot' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error processing snapshot' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error processing snapshot' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });
});
