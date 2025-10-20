/**
 * @fileoverview GetSupervisorByIdentifier handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../GetSupervisorByIdentifier/index')).default;
  return handler(ctx, req);
}

describe('GetSupervisorByIdentifier handler - unit', () => {
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
    ctx.bindings.validatedQuery = { identifier: 'sup-123' } as any;
    (req as any).query = { ...ctx.bindings.validatedQuery };

    appService = { getSupervisorByIdentifier: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'GetSupervisorByIdentifierApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      ServiceContainer: { getInstance: () => ({ initialize, resolve }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/GetSupervisorByIdentifierRequest', () => ({
      GetSupervisorByIdentifierRequest: { fromQuery: (q: any) => q }
    }));
  });

  it('should return 200 with supervisor payload', async () => {
    const payload = {
      supervisor: { id: 'sup-123', email: 'sup@example.com', name: 'Jane Supervisor' },
      identifier: 'sup-123'
    };
    appService.getSupervisorByIdentifier.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetSupervisorByIdentifierApplicationService');
    expect(appService.getSupervisorByIdentifier).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ identifier: 'sup-123' })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.getSupervisorByIdentifier.mockRejectedValue(new Error('DB error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorByIdentifier' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorByIdentifier' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorByIdentifier' }
    });
  });

  it('should handle null response payload with 200', async () => {
    appService.getSupervisorByIdentifier.mockResolvedValue({ toPayload: () => null } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  it('should handle undefined response payload with 200', async () => {
    appService.getSupervisorByIdentifier.mockResolvedValue({ toPayload: () => undefined } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
  });
});


