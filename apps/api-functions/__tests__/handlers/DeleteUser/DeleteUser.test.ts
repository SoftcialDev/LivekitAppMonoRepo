/**
 * @fileoverview DeleteUser handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../DeleteUser/index')).default;
  return handler(ctx);
}

describe('DeleteUser handler - unit', () => {
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
    (ctx as any).req = { method: 'POST', body: { userEmail: 'user@example.com', reason: 'rule violation' } } as any;
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

    // Validation middleware: feed validated body
    jest.doMock('../../../shared/middleware/validate', () => ({
      withBodyValidation: (_schema: any) => async (c: any, cb: any) => {
        c.bindings.validatedBody = (ctx as any).req.body;
        await cb();
      }
    }));

    jest.doMock('../../../shared/utils/authHelpers', () => ({
      getCallerAdId: () => 'ad-123'
    }));

    // VO and Enums used
    jest.doMock('../../../shared/domain/value-objects/UserDeletionRequest', () => ({
      UserDeletionRequest: { create: (email: string, _type: any, reason?: string) => ({ userEmail: email, reason }) }
    }));
    jest.doMock('../../../shared/domain/enums/UserDeletionType', () => ({
      UserDeletionType: { SOFT_DELETE: 'SOFT_DELETE' }
    }));

    // Application service: return result object with methods
    jest.doMock('../../../shared/application/services/UserDeletionApplicationService', () => ({
      UserDeletionApplicationService: jest.fn().mockImplementation(() => ({
        deleteUser: jest.fn().mockResolvedValue({
          isSuccess: () => true,
          userEmail: 'user@example.com',
          getDeletionTypeString: () => 'SOFT_DELETE',
          getPreviousRoleString: () => 'Employee',
          getMessage: () => 'User soft deleted successfully (Graph roles removed)',
          timestamp: '2024-01-01T00:00:00.000Z'
        })
      }))
    }));
  });

  it('should return 200 on successful soft delete', async () => {
    await runHandler(ctx);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('UserRepository');
    expect(container.resolve).toHaveBeenCalledWith('AuthorizationService');
    expect(container.resolve).toHaveBeenCalledWith('IAuditService');
    expect(container.resolve).toHaveBeenCalledWith('PresenceService');
    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        userEmail: 'user@example.com',
        deletionType: 'SOFT_DELETE',
        previousRole: 'Employee',
        message: 'User soft deleted successfully (Graph roles removed)',
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    });
  });

  it('should return 500 when caller id missing', async () => {
    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => undefined }));

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });
});


