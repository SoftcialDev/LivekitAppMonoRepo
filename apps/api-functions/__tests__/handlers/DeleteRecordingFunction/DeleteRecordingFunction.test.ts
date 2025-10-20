/**
 * @fileoverview DeleteRecordingFunction handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../DeleteRecordingFunction/index')).default;
  return handler(ctx, req);
}

describe('DeleteRecordingFunction handler - unit', () => {
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
    (ctx as any).bindingData = { id: 'rec-1' };

    appService = { deleteRecording: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'DeleteRecordingApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      ServiceContainer: { getInstance: () => ({ initialize, resolve }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/DeleteRecordingRequest', () => ({
      DeleteRecordingRequest: { fromParams: (p: any) => p }
    }));
  });

  it('should return 200 after deleting recording', async () => {
    appService.deleteRecording.mockResolvedValue(toPayloadify({ id: 'rec-1', message: 'deleted' }));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('DeleteRecordingApplicationService');
    expect(appService.deleteRecording).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ id: 'rec-1' })
    );
    expect(ctx.res?.status).toBe(200);
  });

  it('should return 500 when application service throws', async () => {
    appService.deleteRecording.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to delete recording' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to delete recording' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to delete recording' }
    });
  });
});


