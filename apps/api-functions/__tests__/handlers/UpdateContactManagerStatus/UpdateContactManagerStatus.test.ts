/**
 * @fileoverview UpdateContactManagerStatus Handler Unit Test
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

describe('UpdateContactManagerStatus handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let appService: any;
  let container: { initialize: jest.Mock; resolve: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest();
    appService = { updateMyContactManagerStatus: jest.fn() };
    container = mockServiceContainer({ ContactManagerApplicationService: appService });
  });

  it('should update status and return 200', async () => {
    // Arrange
    (req as any).method = 'POST';
    (req as any).body = { status: 'Available' };
    (ctx as any).req = req;
    const result = { id: 'id', status: 'Available' };
    appService.updateMyContactManagerStatus.mockResolvedValue(toPayloadify(result));

    const handler = (await import('../../../UpdateContactManagerStatus/index')).default;

    // Act
    await handler(ctx, req);

    // Assert
    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('ContactManagerApplicationService');
    expect(appService.updateMyContactManagerStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Available' }),
      ctx.bindings.callerId
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: result
    });
  });

  it('should return 500 when application service throws', async () => {
    (req as any).method = 'POST';
    (req as any).body = { status: 'Busy' };
    (ctx as any).req = req;
    appService.updateMyContactManagerStatus.mockRejectedValue(new Error('boom'));

    const handler = (await import('../../../UpdateContactManagerStatus/index')).default;
    await handler(ctx, req);

    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error updating Contact Manager status' });
  });

  it('should return 500 when initialize throws', async () => {
    (req as any).method = 'POST';
    (req as any).body = { status: 'Away' };
    (ctx as any).req = req;
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    const handler = (await import('../../../UpdateContactManagerStatus/index')).default;
    await handler(ctx, req);
    expect(ctx.res?.status).toBe(500);
  });

  it('should return 500 when resolve throws', async () => {
    (req as any).method = 'POST';
    (req as any).body = { status: 'Offline' };
    (ctx as any).req = req;
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    const handler = (await import('../../../UpdateContactManagerStatus/index')).default;
    await handler(ctx, req);
    expect(ctx.res?.status).toBe(500);
  });
});


