/**
 * @fileoverview Response utils mock
 * @summary Deterministic ctx.res setters for ok/badRequest
 */

jest.mock('../../shared/utils/response', () => ({
  ok: (ctx: any, body: any) => {
    ctx.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body
    };
  },
  badRequest: (ctx: any, body: any) => {
    ctx.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body
    };
  }
}));


