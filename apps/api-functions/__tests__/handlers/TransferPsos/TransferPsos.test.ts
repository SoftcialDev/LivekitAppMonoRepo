/**
 * @fileoverview TransferPsos handler - unit tests
 * @summary Unit tests for TransferPsos Azure Function handler
 * @description Tests handler behavior with shared mocks for middleware and container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../TransferPsos/index')).default;
  return handler(ctx, req);
}

describe('TransferPsos handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = { newSupervisorEmail: 'new.supervisor@test.com' };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { transferPsos: jest.fn() };
    container = createServiceContainerMock({ TransferPsosApplicationService: appService });
    container.resolve.mockReturnValue(appService);
  });

  it('should transfer PSOs and return 200', async () => {
    const payload = { movedCount: 7, message: 'ok' };
    appService.transferPsos.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('TransferPsosApplicationService');
    expect(appService.transferPsos).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ callerId: ctx.bindings.callerId, newSupervisorEmail: 'new.supervisor@test.com' })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.transferPsos.mockRejectedValue(new Error('boom'));

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in TransferPsos' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in TransferPsos' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in TransferPsos' });
    expect(ctx.log.error).toHaveBeenCalledTimes(1);
  });
});


