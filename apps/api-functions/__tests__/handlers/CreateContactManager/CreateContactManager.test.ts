/**
 * @fileoverview CreateContactManager handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../CreateContactManager/index')).default;
  return handler(ctx, req);
}

describe('CreateContactManager handler - unit', () => {
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
    req = TestHelpers.createMockHttpRequest({ method: 'POST' as any });
    (req as any).body = { email: 'cm@example.com', status: 'Active' };
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { createContactManager: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'ContactManagerApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    jest.doMock('../../../shared/domain/value-objects/CreateContactManagerRequest', () => ({
      CreateContactManagerRequest: { fromBody: (b: any) => b }
    }));
  });

  it('should return 200 with created contact manager payload', async () => {
    const payload = { id: 'cm-1', email: 'cm@example.com', status: 'Active' };
    appService.createContactManager.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('ContactManagerApplicationService');
    expect(appService.createContactManager).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'cm@example.com', status: 'Active' }),
      ctx.bindings.callerId
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.createContactManager.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to add Contact Manager' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to add Contact Manager' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to add Contact Manager' }
    });
  });

  it('should handle null/undefined payload with 200', async () => {
    appService.createContactManager.mockResolvedValue({ toPayload: () => null } as any);
    await runHandler(ctx, req);
    expect(ctx.res?.status).toBe(200);

    appService.createContactManager.mockResolvedValue({ toPayload: () => undefined } as any);
    await runHandler(ctx, req);
    expect(ctx.res?.status).toBe(200);
  });
});


