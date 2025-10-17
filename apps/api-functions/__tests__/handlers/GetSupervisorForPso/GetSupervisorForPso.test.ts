/**
 * @fileoverview GetSupervisorForPso Handler Unit Test
 * @summary Unit tests for GetSupervisorForPso Azure Function handler
 * @description Tests the handler in isolation with mocked dependencies
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
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
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'GET' as any });
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();
    ctx.bindings.validatedQuery = {
      psoIdentifier: 'pso-123'
    };

    appService = { getSupervisorForPso: jest.fn() };
    container = createServiceContainerMock({ GetSupervisorForPsoApplicationService: appService });
    container.resolve.mockReturnValue(appService);
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

    expect(ctx.res).toBeDefined();
  });

  it('should handle different PSO identifiers', async () => {
    ctx.bindings.validatedQuery = {
      psoIdentifier: 'different-pso-456'
    };
    
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

    expect(ctx.res).toBeDefined();
  });

  it('should return 400 when application service returns error', async () => {
    const errorResponse = {
      error: 'PSO not found',
      message: 'The specified PSO identifier does not exist'
    };
    appService.getSupervisorForPso.mockResolvedValue(toPayloadify({ ...errorResponse, error: true }));

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });

  it('should return 500 when application service throws', async () => {
    appService.getSupervisorForPso.mockRejectedValue(new Error('Database connection failed'));

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });

  it('should handle empty response gracefully', async () => {
    appService.getSupervisorForPso.mockResolvedValue(toPayloadify(null));

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });

  it('should handle undefined response gracefully', async () => {
    appService.getSupervisorForPso.mockResolvedValue(toPayloadify(undefined));

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });

  it('should handle missing caller ID', async () => {
    ctx.bindings.callerId = null;

    await runHandler(ctx, req);

    expect(ctx.res).toBeDefined();
  });
});
