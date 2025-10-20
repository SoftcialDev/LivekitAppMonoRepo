/**
 * @fileoverview AcknowledgeCommandFunction handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../AcknowledgeCommandFunction/index')).default;
  return handler(ctx);
}

describe('AcknowledgeCommandFunction handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');

    ctx = TestHelpers.createMockContext();
    (ctx as any).req = { method: 'POST', body: { commandIds: ['c1','c2'] } } as any;
    (ctx as any).bindings = { user: { id: 'caller' } } as any;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { acknowledgeCommands: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'CommandAcknowledgmentApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    jest.doMock('../../../shared/domain/value-objects/AcknowledgeCommandRequest', () => ({
      AcknowledgeCommandRequest: { fromBody: (b: any) => b }
    }));
  });

  it('should return 200 with updated count payload', async () => {
    appService.acknowledgeCommands.mockResolvedValue({ toPayload: () => ({ updatedCount: 2 }) });

    await runHandler(ctx);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('CommandAcknowledgmentApplicationService');
    expect(appService.acknowledgeCommands).toHaveBeenCalledWith(
      expect.objectContaining({ commandIds: ['c1','c2'] }),
      ctx.bindings.callerId
    );
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toEqual({ updatedCount: 2 });
  });

  it('should return 500 when application service throws', async () => {
    appService.acknowledgeCommands.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error' });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error' });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error' });
  });
});


