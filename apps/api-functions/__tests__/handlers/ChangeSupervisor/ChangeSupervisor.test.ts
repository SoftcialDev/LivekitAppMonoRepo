/**
 * @fileoverview ChangeSupervisor handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../ChangeSupervisor/index')).default;
  return handler(ctx);
}

describe('ChangeSupervisor handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let services: Record<string, any>;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');

    ctx = TestHelpers.createMockContext();
    (ctx as any).req = { method: 'POST', body: { userEmails: ['e1@example.com'], newSupervisorEmail: 'sup@example.com' } } as any;
    (ctx as any).bindings = { user: { id: 'caller' } } as any;

    services = {
      userRepository: {},
      authorizationService: {},
      supervisorRepository: {},
      commandMessagingService: {},
      supervisorManagementService: {},
      auditService: {}
    };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'UserRepository') return services.userRepository;
      if (token === 'AuthorizationService') return services.authorizationService;
      if (token === 'SupervisorRepository') return services.supervisorRepository;
      if (token === 'CommandMessagingService') return services.commandMessagingService;
      if (token === 'SupervisorManagementService') return services.supervisorManagementService;
      if (token === 'IAuditService') return services.auditService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => 'ad-123' }));

    jest.doMock('../../../shared/domain/value-objects/SupervisorAssignment', () => ({
      SupervisorAssignment: { fromRequest: (x: any) => x }
    }));

    const authorizeSupervisorChange = jest.fn().mockResolvedValue(undefined);
    const validateSupervisorAssignment = jest.fn().mockResolvedValue(undefined);
    const changeSupervisor = jest.fn().mockResolvedValue({ updatedCount: 1, skippedCount: 0, totalProcessed: 1 });

    jest.doMock('../../../shared/application/services/SupervisorApplicationService', () => ({
      SupervisorApplicationService: jest.fn().mockImplementation(() => ({
        authorizeSupervisorChange,
        validateSupervisorAssignment,
        changeSupervisor
      }))
    }));
  });

  it('should return 200 on successful supervisor change', async () => {
    await runHandler(ctx);
    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('SupervisorRepository');
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({ updatedCount: 1, skippedCount: 0, totalProcessed: 1 });
  });

  it('should return 500 when caller id missing', async () => {
    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => undefined }));
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(400);
    expect(ctx.res?.body).toBeDefined();
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in ChangeSupervisor' });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in ChangeSupervisor' });
  });
});


