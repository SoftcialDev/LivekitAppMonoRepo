/**
 * @fileoverview GetMyPsos handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
import { toPayloadify } from '../../mocks/payload';

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../GetMyPsos/index')).default;
  return handler(ctx, req);
}

describe('GetMyPsos handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let appService: any;
  let userRepository: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');
    require('../../mocks/authHelpers');

    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'GET' as any });
    ctx.req = req;
    ctx.bindings.callerId = TestHelpers.generateUuid();

    appService = { getPsosBySupervisor: jest.fn() };
    userRepository = { findByAzureAdObjectId: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'GetPsosBySupervisorApplicationService') return appService;
      if (token === 'UserRepository') return userRepository;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      ServiceContainer: { getInstance: () => ({ initialize, resolve }) }
    }));

    jest.doMock('../../../shared/domain/value-objects/GetPsosBySupervisorRequest', () => ({
      GetPsosBySupervisorRequest: function GetPsosBySupervisorRequest(callerId: string, supervisorId?: string) {
        return { callerId, supervisorId } as any;
      }
    }));

    // Mock Prisma UserRole enum to simple strings used in tests
    jest.doMock('@prisma/client', () => ({
      UserRole: { Admin: 'Admin', SuperAdmin: 'SuperAdmin', Supervisor: 'Supervisor' }
    }));
  });

  it('should return 200 with PSOs for supervisor (self)', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'u1', role: 'Supervisor' });
    const payload = { psos: [{ id: 'p1' }] };
    appService.getPsosBySupervisor.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetPsosBySupervisorApplicationService');
    expect(container.resolve).toHaveBeenCalledWith('UserRepository');
    expect(appService.getPsosBySupervisor).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ callerId: ctx.bindings.callerId, supervisorId: ctx.bindings.callerId })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 200 with all PSOs for Admin', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'u1', role: 'Admin' });
    const payload = { psos: [{ id: 'p1' }, { id: 'p2' }] };
    appService.getPsosBySupervisor.mockResolvedValue(toPayloadify(payload));

    await runHandler(ctx, req);

    expect(appService.getPsosBySupervisor).toHaveBeenCalledWith(
      ctx.bindings.callerId,
      expect.objectContaining({ callerId: ctx.bindings.callerId, supervisorId: undefined })
    );
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  });

  it('should return 500 when caller not found', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue(null);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetMyPsos' }
    });
  });

  it('should return 500 when application service throws', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'u1', role: 'Supervisor' });
    appService.getPsosBySupervisor.mockRejectedValue(new Error('DB error'));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetMyPsos' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetMyPsos' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetMyPsos' }
    });
  });

  it('should handle null response payload gracefully', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'u1', role: 'Admin' });
    appService.getPsosBySupervisor.mockResolvedValue({ toPayload: () => { throw new Error('null payload'); } } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetMyPsos' }
    });
  });

  it('should handle undefined response payload gracefully', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'u1', role: 'Admin' });
    appService.getPsosBySupervisor.mockResolvedValue({ toPayload: () => { throw new Error('undefined payload'); } } as any);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal Server Error in GetMyPsos' }
    });
  });
});


