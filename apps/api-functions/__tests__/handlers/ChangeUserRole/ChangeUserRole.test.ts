/**
 * @fileoverview ChangeUserRole handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../ChangeUserRole/index')).default;
  return handler(ctx);
}

describe('ChangeUserRole handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let userRepository: any;
  let authorizationService: any;
  let auditService: any;
  let presenceService: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');

    ctx = TestHelpers.createMockContext();
    (ctx as any).req = { method: 'POST', body: { userEmail: 'u@example.com', newRole: 'Supervisor' } } as any;
    (ctx as any).bindings = { user: { id: 'caller' } } as any;

    userRepository = {};
    authorizationService = {};
    auditService = {};
    presenceService = {};

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'UserRepository') return userRepository;
      if (token === 'AuthorizationService') return authorizationService;
      if (token === 'IAuditService') return auditService;
      if (token === 'PresenceService') return presenceService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    // withBodyValidation to set validatedBody
    jest.doMock('../../../shared/middleware/validate', () => ({
      withBodyValidation: (_schema: any) => async (c: any, cb: any) => { c.bindings.validatedBody = (c.req as any).body; await cb(); }
    }));

    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => 'ad-123' }));

    jest.doMock('../../../shared/domain/value-objects/UserRoleChangeRequest', () => ({
      UserRoleChangeRequest: { fromRequest: (x: any) => x }
    }));

    const authorizeRoleChange = jest.fn().mockResolvedValue(undefined);
    const validateRoleChangeRequest = jest.fn().mockResolvedValue(undefined);
    const changeUserRole = jest.fn().mockResolvedValue({
      getSummary: () => 'Role changed',
      getOperationType: () => 'CHANGE_ROLE',
      userEmail: 'u@example.com',
      previousRole: 'Employee',
      newRole: 'Supervisor'
    });

    jest.doMock('../../../shared/application/services/UserRoleChangeApplicationService', () => ({
      UserRoleChangeApplicationService: jest.fn().mockImplementation(() => ({
        authorizeRoleChange,
        validateRoleChangeRequest,
        changeUserRole
      }))
    }));
  });

  it('should return 200 on successful role change', async () => {
    await runHandler(ctx);
    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('UserRepository');
    expect(container.resolve).toHaveBeenCalledWith('AuthorizationService');
    expect(container.resolve).toHaveBeenCalledWith('IAuditService');
    expect(container.resolve).toHaveBeenCalledWith('PresenceService');
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({ message: 'Role changed', userEmail: 'u@example.com' });
  });

  it('should return 401 when caller id missing', async () => {
    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => undefined }));
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(401);
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in ChangeUserRole' });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal Server Error in ChangeUserRole' });
  });
});


