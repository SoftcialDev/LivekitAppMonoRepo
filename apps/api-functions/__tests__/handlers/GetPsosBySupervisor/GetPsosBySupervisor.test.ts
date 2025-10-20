/**
 * @fileoverview GetPsosBySupervisor handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../GetPsosBySupervisor/index')).default;
  return handler(ctx, req);
}

describe('GetPsosBySupervisor handler - unit', () => {
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
    ctx.bindings.validatedQuery = { supervisorEmail: 'sup@example.com' } as any;
    (req as any).query = { ...ctx.bindings.validatedQuery };

    appService = { getPsosBySupervisor: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'GetPsosBySupervisorApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      ServiceContainer: { getInstance: () => ({ initialize, resolve }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/GetPsosBySupervisorRequest', () => ({
      GetPsosBySupervisorRequest: { fromQuery: (_caller: string, q: any) => q }
    }));
  });

  it('should return 200 with psos payload', async () => {
    const payload = { psos: [{ id: 'p1', email: 'p1@example.com' }] };
    appService.getPsosBySupervisor.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetPsosBySupervisorApplicationService');
    expect(appService.getPsosBySupervisor).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ supervisorEmail: 'sup@example.com' })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.getPsosBySupervisor.mockRejectedValue(new Error('DB error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetPsosBySupervisor' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetPsosBySupervisor' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetPsosBySupervisor' }
    });
  });

  it('should handle null response payload with 200', async () => {
    appService.getPsosBySupervisor.mockResolvedValue({ toPayload: () => null } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  it('should handle undefined response payload with 200', async () => {
    appService.getPsosBySupervisor.mockResolvedValue({ toPayload: () => undefined } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
  });
});


