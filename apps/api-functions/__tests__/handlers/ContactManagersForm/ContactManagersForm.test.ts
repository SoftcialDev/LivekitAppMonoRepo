/**
 * @fileoverview ContactManagersForm handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../ContactManagersForm/index')).default;
  return handler(ctx, req);
}

describe('ContactManagersForm handler - unit', () => {
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
    (req as any).body = { psoEmail: 'pso@example.com', imageBase64: 'data:image/png;base64,xxx', reason: 'Test' };
    (req as any).headers = { authorization: 'Bearer test-token-xyz' } as any;
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { processForm: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'ContactManagerFormApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    jest.doMock('../../../shared/domain/value-objects/ContactManagerFormRequest', () => ({
      ContactManagerFormRequest: { fromBody: (b: any) => b }
    }));
  });

  it('should return 200 with form result payload', async () => {
    const payload = { formId: 'form-1' };
    appService.processForm.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('ContactManagerFormApplicationService');
    expect(appService.processForm).toHaveBeenCalledWith(
      expect.objectContaining({ psoEmail: 'pso@example.com' }),
      ctx.bindings.callerId,
      'test-token-xyz'
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when application service throws', async () => {
    appService.processForm.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error processing contact manager form' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error processing contact manager form' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error processing contact manager form' }
    });
  });

  it('should handle null/undefined payload with 200', async () => {
    appService.processForm.mockResolvedValue({ toPayload: () => null } as any);
    await runHandler(ctx, req);
    expect(ctx.res?.status).toBe(200);

    appService.processForm.mockResolvedValue({ toPayload: () => undefined } as any);
    await runHandler(ctx, req);
    expect(ctx.res?.status).toBe(200);
  });
});


