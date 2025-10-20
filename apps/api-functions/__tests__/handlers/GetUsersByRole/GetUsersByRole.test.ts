/**
 * @fileoverview GetUsersByRole Handler Unit Test
 * @summary Unit tests for GetUsersByRole Azure Function handler
 * @description Tests the handler in isolation with mocked dependencies
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';
import '../../mocks/authHelpers';
// Container will be mocked per-test via jest.doMock with the handler's import path
import { toPayloadify } from '../../mocks/payload';

// Mock UserRole enum
jest.mock('../../../shared/domain/enums/UserRole', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    ContactManager: 'ContactManager',
    PSO: 'PSO'
  }
}));

// Mock the schema that uses UserRole
jest.mock('../../../shared/domain/schemas/UserQuerySchema', () => ({
  userQuerySchema: {
    parse: jest.fn((data) => data)
  }
}));

// Mock UserQueryApplicationService
jest.mock('../../../shared/application/services/UserQueryApplicationService', () => ({
  UserQueryApplicationService: jest.fn().mockImplementation(() => ({
    getUsersByRole: jest.fn()
  }))
}));

async function runHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../GetUsersByRole/index')).default;
  return handler(ctx, req);
}

describe('GetUsersByRole handler - unit', () => {
  let ctx: Context;
  let req: HttpRequest;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let userRepository: any;
  let authorizationService: any;
  let userQueryService: any;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');
    require('../../mocks/authHelpers');
    ctx = TestHelpers.createMockContext();
    req = TestHelpers.createMockHttpRequest({ method: 'GET' as any });
    ctx.req = req;
    ctx.bindings.user = TestHelpers.createMockUser();
    ctx.bindings.validatedQuery = {
      role: 'PSO',
      page: 1,
      pageSize: 10
    };
    (req as any).query = { ...ctx.bindings.validatedQuery };

    userRepository = { findMany: jest.fn() };
    authorizationService = { canQueryUsers: jest.fn() };
    userQueryService = { getUsersByRole: jest.fn() };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'UserRepository') return userRepository;
      if (token === 'AuthorizationService') return authorizationService;
      if (token === 'UserQueryService') return userQueryService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    jest.doMock('../../../shared/domain/value-objects/UserQueryRequest', () => ({
      UserQueryRequest: { fromQueryString: (x: any) => x }
    }));
  });

      it('should get users by role successfully and return 200', async () => {
        const mockResponse = {
          users: [
            { id: 'user-1', email: 'user1@example.com', role: 'PSO' },
            { id: 'user-2', email: 'user2@example.com', role: 'PSO' }
          ],
          totalCount: 2,
          page: 1,
          pageSize: 10
        };

        // Mock the UserQueryApplicationService instance
        const mockUserQueryApplicationService = {
          getUsersByRole: jest.fn().mockResolvedValue(toPayloadify(mockResponse))
        };

        const { UserQueryApplicationService } = await import('../../../shared/application/services/UserQueryApplicationService');
        (UserQueryApplicationService as jest.Mock).mockImplementation(() => mockUserQueryApplicationService);

        await runHandler(ctx, req);

        expect(container.initialize).toHaveBeenCalled();
        expect(container.resolve).toHaveBeenCalledWith('UserRepository');
        expect(container.resolve).toHaveBeenCalledWith('AuthorizationService');
        expect(container.resolve).toHaveBeenCalledWith('UserQueryService');
        expect(UserQueryApplicationService).toHaveBeenCalledWith(userRepository, authorizationService, userQueryService);
        expect(ctx.res).toEqual({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: mockResponse
        });
      });

  it('should handle different roles and pagination', async () => {
    ctx.bindings.validatedQuery = {
      role: 'SUPERVISOR',
      page: 2,
      pageSize: 5
    };
    (req as any).query = { ...ctx.bindings.validatedQuery };
    
    const mockResponse = {
      users: [
        { id: 'supervisor-1', email: 'supervisor1@example.com', role: 'SUPERVISOR' }
      ],
      totalCount: 1,
      page: 2,
      pageSize: 5
    };
    
    const mockUserQueryApplicationService = {
      getUsersByRole: jest.fn().mockResolvedValue(toPayloadify(mockResponse))
    };
    
    const { UserQueryApplicationService } = await import('../../../shared/application/services/UserQueryApplicationService');
    (UserQueryApplicationService as jest.Mock).mockImplementation(() => mockUserQueryApplicationService);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });

  it('should return 500 when userQueryService throws', async () => {
    const mockUserQueryApplicationService = {
      getUsersByRole: jest.fn().mockRejectedValue(new Error('Database connection failed'))
    };
    
    const { UserQueryApplicationService } = await import('../../../shared/application/services/UserQueryApplicationService');
    (UserQueryApplicationService as jest.Mock).mockImplementation(() => mockUserQueryApplicationService);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should return 500 when initialize throws', async () => {
    container.initialize.mockImplementation(() => { throw new Error('init failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should return 500 when resolve throws', async () => {
    container.resolve.mockImplementation(() => { throw new Error('resolve failed'); });

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should handle missing caller ID', async () => {
    ctx.bindings.user = null;
    // Override getCallerAdId to ensure it returns undefined and triggers the throw
    jest.doMock('../../../shared/utils/authHelpers', () => ({
      getCallerAdId: () => undefined
    }));

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal error' }
    });
  });

  it('should handle empty response gracefully', async () => {
    const mockUserQueryApplicationService = {
      getUsersByRole: jest.fn().mockResolvedValue(toPayloadify(null))
    };
    
    const { UserQueryApplicationService } = await import('../../../shared/application/services/UserQueryApplicationService');
    (UserQueryApplicationService as jest.Mock).mockImplementation(() => mockUserQueryApplicationService);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  it('should handle undefined response gracefully', async () => {
    const mockUserQueryApplicationService = {
      getUsersByRole: jest.fn().mockResolvedValue(toPayloadify(undefined))
    };
    
    const { UserQueryApplicationService } = await import('../../../shared/application/services/UserQueryApplicationService');
    (UserQueryApplicationService as jest.Mock).mockImplementation(() => mockUserQueryApplicationService);

    await runHandler(ctx, req);

    expect(ctx.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
  });
});
