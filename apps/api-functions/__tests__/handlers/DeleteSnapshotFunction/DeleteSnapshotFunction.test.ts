/**
 * @fileoverview DeleteSnapshotFunction handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../DeleteSnapshotFunction/index')).default;
  return handler(ctx, req);
}

describe('DeleteSnapshotFunction handler - unit', () => {
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
    req = TestHelpers.createMockHttpRequest({ method: 'DELETE' as any });
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();
    (ctx as any).bindingData = { id: 'snapshot-1' };

    appService = { deleteSnapshot: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'DeleteSnapshotApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      ServiceContainer: { getInstance: () => ({ initialize, resolve }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/DeleteSnapshotRequest', () => ({
      DeleteSnapshotRequest: { fromParams: (_callerId: string, params: any) => params }
    }));
  });

  it('should return 200 after deleting snapshot', async () => {
    appService.deleteSnapshot.mockResolvedValue(toPayloadify({ deletedId: 'snapshot-1', message: 'deleted' }));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('DeleteSnapshotApplicationService');
    expect(appService.deleteSnapshot).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ id: 'snapshot-1' })
    );
    expect(ctx.res?.status).toBe(200);
  });

  it('should return 500 when application service throws', async () => {
    appService.deleteSnapshot.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error deleting snapshot' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error deleting snapshot' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error deleting snapshot' }
    });
  });
});


