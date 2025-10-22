/**
 * @fileoverview Shared middleware mocks
 * @summary Mocks for auth, callerId, body validation and error handler
 * @description Executes callbacks and sets 500 responses on errors to unit-test handlers in isolation
 */

// Auth middleware: just runs the callback
jest.mock('../../shared/middleware/auth', () => ({
  withAuth: jest.fn(async (_ctx: any, callback: any) => {
    return await callback();
  })
}));

// CallerId middleware: just runs the callback
jest.mock('../../shared/middleware/callerId', () => ({
  withCallerId: jest.fn(async (_ctx: any, callback: any) => {
    return await callback();
  })
}));

// Body validation: copies req.body -> ctx.bindings.validatedBody and runs the callback
jest.mock('../../shared/middleware/validate', () => ({
  withBodyValidation: (_schema: any) => async (ctx: any, callback: any) => {
    const body = (ctx.req && ctx.req.body) || (ctx as any).body;
    if (body !== undefined) {
      ctx.bindings = { ...(ctx.bindings ?? {}), validatedBody: body };
    }
    await callback();
  },
  withQueryValidation: (_schema: any) => async (ctx: any, callback: any) => {
    const query = (ctx.req && ctx.req.query) || (ctx as any).query;
    if (query !== undefined) {
      ctx.bindings = { ...(ctx.bindings ?? {}), validatedQuery: query };
    }
    await callback();
  },
  // Curried variant: withPathValidation(schema)(ctx, cb)
  withPathValidation: (_schema: any) => async (ctx: any, callback: any) => {
    const params = (ctx.bindingData ?? {}) as any;
    ctx.bindings = { ...(ctx.bindings ?? {}), validatedParams: params };
    await callback();
  }
}));

// Query validation (alt path used by some handlers)
jest.mock('../../shared/middleware/queryValidation', () => ({
  withQueryValidation: (ctx: any, _schema: any, callback: (validatedQuery: any) => Promise<void>) => {
    const query = (ctx.req && ctx.req.query) || (ctx as any).query;
    if (query !== undefined) {
      ctx.bindings = { ...(ctx.bindings ?? {}), validatedQuery: query };
    }
    return callback(query);
  }
}));

// Path validation (non-curried signature used by some handlers)
jest.mock('../../shared/middleware/pathValidation', () => ({
  withPathValidation: (ctx: any, _schema: any, callback: (validatedParams: any) => Promise<void>) => {
    const params = (ctx.bindingData ?? {}) as any;
    ctx.bindings = { ...(ctx.bindings ?? {}), validatedParams: params };
    return callback(params);
  }
}));

// Error handler: wraps and sets ctx.res with 500 on error
jest.mock('../../shared/middleware/errorHandler', () => ({
  withErrorHandler: (handler: any, options: any) => {
    return async (ctx: any, req: any) => {
      try {
        await handler(ctx, req);
      } catch (err) {
        ctx.log?.error?.(err, 'Unhandled exception in function');
        ctx.res = {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: { error: options?.genericMessage ?? 'Internal error' }
        };
      }
    };
  }
}));

// Authorization helpers
jest.mock('../../shared/middleware/authorization', () => ({
  requireAdminAccess: () => async (_ctx?: any) => {},
  requireSuperAdminAccess: () => async (_ctx?: any) => {},
  requireAdminOrSuperAdminAccess: () => async (_ctx?: any) => {},
  requireCommandPermission: () => async (_ctx?: any) => {},
  requireUserManagementPermission: () => async (_ctx?: any) => {}
}));


