/**
 * @fileoverview GetCurrentUser handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../GetCurrentUser/index')).default;
  return handler(ctx);
}

describe('GetCurrentUser handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let applicationService: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');

    ctx = TestHelpers.createMockContext();
    ctx.bindings.user = { 
      oid: 'ad-123',
      upn: 'user@example.com',
      name: 'John Doe'
    } as any;

    // Mock application service
    applicationService = { 
      getCurrentUser: jest.fn()
    };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'GetCurrentUserApplicationService') return applicationService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    // getCallerAdId mock per-test
    jest.doMock('../../../shared/utils/authHelpers', () => ({
      getCallerAdId: (_user: any) => 'ad-123'
    }));

    // Mock GetCurrentUserRequest
    jest.doMock('../../../shared/domain/value-objects/GetCurrentUserRequest', () => ({
      GetCurrentUserRequest: {
        fromCallerId: (callerId: string) => ({ callerId })
      }
    }));
  });

  it('should return 200 with current user info', async () => {
    applicationService.getCurrentUser.mockResolvedValue({
      azureAdObjectId: 'ad-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Admin',
      isNewUser: false,
      toPayload: () => ({
        azureAdObjectId: 'ad-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Admin',
        isNewUser: false
      })
    });

    await runHandler(ctx);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('GetCurrentUserApplicationService');
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({
      azureAdObjectId: 'ad-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Admin',
      isNewUser: false
    });
  });

  it('should auto-create user with Employee role when not found', async () => {
    applicationService.getCurrentUser.mockResolvedValue({
      azureAdObjectId: 'ad-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Employee',
      isNewUser: true,
      toPayload: () => ({
        azureAdObjectId: 'ad-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Employee',
        isNewUser: true
      })
    });

    await runHandler(ctx);

    expect(applicationService.getCurrentUser).toHaveBeenCalled();
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({
      azureAdObjectId: 'ad-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Employee',
      isNewUser: true
    });
  });

  it('should use email from upn when creating new user', async () => {
    ctx.bindings.user = {
      oid: 'ad-456',
      upn: 'newuser@example.com',
      name: 'New User'
    };

    jest.doMock('../../../shared/utils/authHelpers', () => ({
      getCallerAdId: (_user: any) => 'ad-456'
    }));

    applicationService.getCurrentUser.mockResolvedValue({
      azureAdObjectId: 'ad-456',
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'Employee',
      isNewUser: true,
      toPayload: () => ({
        azureAdObjectId: 'ad-456',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'Employee',
        isNewUser: true
      })
    });

    await runHandler(ctx);

    expect(applicationService.getCurrentUser).toHaveBeenCalled();
  });

  it('should return 500 when application service throws email error', async () => {
    ctx.bindings.user = {
      oid: 'ad-789',
      // No upn, email, or preferred_username
    };

    jest.doMock('../../../shared/utils/authHelpers', () => ({
      getCallerAdId: (_user: any) => 'ad-789'
    }));

    applicationService.getCurrentUser.mockRejectedValue(new Error('User email not found in authentication token'));

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should return 500 when getCallerAdId missing', async () => {
    jest.doMock('../../../shared/utils/authHelpers', () => ({
      getCallerAdId: () => undefined
    }));

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

  it('should return 500 when application service throws (catch block)', async () => {
    applicationService.getCurrentUser.mockRejectedValue(new Error('DB error'));

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });
});


