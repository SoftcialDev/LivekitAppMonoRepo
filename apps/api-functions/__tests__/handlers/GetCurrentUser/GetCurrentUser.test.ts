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
  let userRepository: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');

    ctx = TestHelpers.createMockContext();
    ctx.bindings.user = { id: 'ad-123' } as any;

    userRepository = { findByAzureAdObjectId: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'UserRepository') return userRepository;
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

    // UserSummary.fromPrismaUser passthrough
    jest.doMock('../../../shared/domain/entities/UserSummary', () => ({
      UserSummary: {
        fromPrismaUser: (u: any) => ({
          azureAdObjectId: u.azureAdObjectId,
          email: u.email,
          firstName: (u.fullName || '').split(' ')[0] || '',
          lastName: (u.fullName || '').split(' ').slice(1).join(' ') || '',
          role: u.role,
          supervisorAdId: null,
          supervisorName: null
        })
      }
    }));
  });

  it('should return 200 with current user info', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue({
      azureAdObjectId: 'ad-123',
      email: 'user@example.com',
      fullName: 'John Doe',
      role: 'Admin'
    });

    await runHandler(ctx);

    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('UserRepository');
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({
      azureAdObjectId: 'ad-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Admin'
    });
  });

  it('should return 404 when user not found', async () => {
    userRepository.findByAzureAdObjectId.mockResolvedValue(null);

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'User not found in database' }
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

  it('should return 500 when repository throws (catch block)', async () => {
    userRepository.findByAzureAdObjectId.mockRejectedValue(new Error('DB error'));

    await runHandler(ctx);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal server error' }
    });
  });
});


