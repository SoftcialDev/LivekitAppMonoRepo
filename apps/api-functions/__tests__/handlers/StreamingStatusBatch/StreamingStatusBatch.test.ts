/**
 * @fileoverview StreamingStatusBatch handler - unit tests
 * @summary Unit tests for StreamingStatusBatch Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../StreamingStatusBatch/index')).default;
  return handler(ctx, req);
}

describe('StreamingStatusBatch handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = { emails: ['user1@test.com', 'user2@test.com'] };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { getBatchStatus: jest.fn() };
    container = createServiceContainerMock({ StreamingStatusBatchApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should get batch status and return 200', async () => {
    const payload = {
      statuses: [
        { email: 'user1@test.com', hasActiveSession: true, lastSession: null },
        { email: 'user2@test.com', hasActiveSession: false, lastSession: { stopReason: 'manual', stoppedAt: '2024-01-01T00:00:00.000Z' } }
      ]
    };
    appService.getBatchStatus.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('StreamingStatusBatchApplicationService');
    expect(appService.getBatchStatus).toHaveBeenCalledWith(['user1@test.com', 'user2@test.com'], ctx.bindings.callerId);
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 400 when validation fails', async () => {
    (req as any).body = { emails: 'invalid' };

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(400);
    expect(ctx.res?.body).toEqual({ error: expect.any(String) });
  });

  it('should return 500 when application service throws', async () => {
    appService.getBatchStatus.mockRejectedValue(new Error('boom'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to fetch streaming status batch' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to fetch streaming status batch' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Failed to fetch streaming status batch' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });
});
