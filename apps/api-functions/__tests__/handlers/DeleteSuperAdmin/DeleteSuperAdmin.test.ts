/**
 * @fileoverview DeleteSuperAdmin handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../DeleteSuperAdmin/index')).default;
  return handler(ctx, req);
}

describe('DeleteSuperAdmin handler - unit', () => {
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
    (ctx as any).bindingData = { id: 'user-123' };

    appService = { deleteSuperAdmin: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'SuperAdminApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    // Validation schema pass-through safeParse -> success
    jest.doMock('../../../shared/domain/schemas/DeleteSuperAdminSchema', () => ({
      deleteSuperAdminSchema: { safeParse: (x: any) => ({ success: true, data: x }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/DeleteSuperAdminRequest', () => ({
      DeleteSuperAdminRequest: { fromPayload: (x: any) => x }
    }));
  });

  it('should return 200 on successful deletion', async () => {
    appService.deleteSuperAdmin.mockResolvedValue(undefined);

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('SuperAdminApplicationService');
    expect(appService.deleteSuperAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123' }),
      ctx.bindings.callerId
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Super Admin role removed successfully' }
    });
  });

  it('should return 400 when validation fails', async () => {
    // Set up the mock before importing the handler
    jest.doMock('../../../shared/domain/schemas/DeleteSuperAdminSchema', () => ({
      deleteSuperAdminSchema: { safeParse: () => ({ success: false, error: { message: 'bad' } }) }
    }));

    // Re-import the handler with the mock
    const handler = (await import('../../../DeleteSuperAdmin/index')).default;
    await handler(ctx, req);

    expect(ctx.res).toEqual({ status: 400, body: { error: 'Invalid user ID format' } });
  });

  it('should return 500 when application service throws', async () => {
    appService.deleteSuperAdmin.mockRejectedValue(new Error('Service error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to remove Super Admin role' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to remove Super Admin role' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to remove Super Admin role' }
    });
  });
});


