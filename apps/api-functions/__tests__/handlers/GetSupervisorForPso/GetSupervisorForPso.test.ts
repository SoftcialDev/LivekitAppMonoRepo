/**
 * @fileoverview GetSupervisorForPso Handler Unit Test
 * @summary Unit tests for GetSupervisorForPso Azure Function handler
 * @description Tests the handler in isolation with mocked dependencies
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../GetSupervisorForPso/index')).default;
  return handler(ctx, req);
}

describe('GetSupervisorForPso handler - unit', () => {
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
    ctx.bindings.validatedQuery = {
      psoIdentifier: 'pso-123'
    };
    (req as any).query = { ...ctx.bindings.validatedQuery };

    appService = { getSupervisorForPso: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'GetSupervisorForPsoApplicationService') return appService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      ServiceContainer: { getInstance: () => ({ initialize, resolve }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/GetSupervisorForPsoRequest', () => ({
      GetSupervisorForPsoRequest: { fromQuery: (x: any) => x }
    }));
  });

  it('should get supervisor for PSO successfully and return 200', async () => {
    const mockResponse = {
      supervisor: {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        name: 'John Supervisor'
      },
      psoIdentifier: 'pso-123'
    };
    appService.getSupervisorForPso.mockResolvedValue(toPayloadify(mockResponse));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetSupervisorForPsoApplicationService');
    expect(appService.getSupervisorForPso).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ psoIdentifier: 'pso-123' })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });

  it('should handle different PSO identifiers', async () => {
    ctx.bindings.validatedQuery = {
      psoIdentifier: 'different-pso-456'
    };
    (req as any).query = { ...ctx.bindings.validatedQuery };
    
    const mockResponse = {
      supervisor: {
        id: 'supervisor-456',
        email: 'different.supervisor@example.com',
        name: 'Jane Supervisor'
      },
      psoIdentifier: 'different-pso-456'
    };
    appService.getSupervisorForPso.mockResolvedValue(toPayloadify(mockResponse));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetSupervisorForPsoApplicationService');
    expect(appService.getSupervisorForPso).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ psoIdentifier: 'different-pso-456' })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });

  it('should return 400 when application service returns error', async () => {
    const errorResponse = {
      error: true,
      message: 'The specified PSO identifier does not exist'
    };
    appService.getSupervisorForPso.mockResolvedValue(toPayloadify(errorResponse));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetSupervisorForPsoApplicationService');
    expect(appService.getSupervisorForPso).toHaveBeenCalled();
    expect(ctx.res && ctx.res.status).toBe(400);
    expect(ctx.res && ctx.res.body).toMatchObject(errorResponse);
  });

  it('should return 500 when application service throws', async () => {
    appService.getSupervisorForPso.mockRejectedValue(new Error('Database connection failed'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorForPso' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);
    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorForPso' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);
    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorForPso' }
    });
  });

  it('should handle empty response gracefully', async () => {
    appService.getSupervisorForPso.mockResolvedValue({ toPayload: () => null } as any);

    await runHandler(ctx, req);
    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorForPso' }
    });
  });

  it('should handle undefined response gracefully', async () => {
    appService.getSupervisorForPso.mockResolvedValue({ toPayload: () => undefined } as any);

    await runHandler(ctx, req);
    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorForPso' }
    });
  });

  it('should handle missing caller ID', async () => {
    ctx.bindings.callerId = null;

    await runHandler(ctx, req);
    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetSupervisorForPso' }
    });
  });
});
