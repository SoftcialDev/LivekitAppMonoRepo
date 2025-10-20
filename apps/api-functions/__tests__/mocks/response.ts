/**
 * @fileoverview Response utils mock
 * @summary Deterministic ctx.res setters for ok/badRequest
 */

const impl = {
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
  },
  noContent: (ctx: any) => {
    ctx.res = {
      status: 204,
      headers: { 'Content-Type': 'application/json' },
      body: null
    };
  },
  unauthorized: (ctx: any, body?: any) => {
    ctx.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: body ?? { error: 'Unauthorized' }
    };
  }
};

jest.mock('../../shared/utils/response', () => impl);


